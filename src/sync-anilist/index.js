import "./styles.scss";
import { Storage } from "../shared/storage.js";
import { showToast } from "../shared/toast.js";
import { Logger } from "../shared/logger.js";
import { AniListAPI } from "../shared/anilist/api.js";
import { handleOAuthRedirect, handleUrlToken, getTodayDate, openTokenModal } from "../shared/anilist/auth.js";
import { cleanTitle, extractSeason } from "./providers/base.js";
import { getProvider, getCurrentProvider } from "./providers/index.js";
import { Settings } from "./settings.js";
import { Resume, resolveResumeAction, isResumeEligibleEpisode } from "./resume.js";
import { shouldAutoTrack, isEpisodeFinished, computeProgressUpdate } from "./domain/tracking.js";
import { renderNav } from "./components/nav.js";
import { renderActions } from "./components/actions.js";
import { renderWatchingShelf } from "./components/watching-shelf.js";
import { Buddy, computeBuddySyncState } from "./buddy.js";
import { iconHtml, Play } from "../shared/icons.js";
import { checkSkipIntro, initSkipIntroTop, renderAutoSkipButton, getActiveSkipSegments } from "./components/skip-intro.js";
import { initPlayer } from "./player.js";
import { renderCrossSwitch } from "./components/cross-switch.js";

let provider = null;
let currentUser = null;
let currentMedia = null;
let currentTitle = "";
let trackedProgress = -1;
let lastActiveEp = 0;
let isMediaLoading = false;

let homeEntries = null;
let homeFetching = false;
let homeSyncNotifs = [];
let currentBuddyData = null;

let autoTrackTimer = null;
let countdownInterval = null;
const autoTrackState = {
  isActive: false,
  countdown: 0,
  targetEp: 0,
  preventRewind: false
};
const cancelledEps = new Set();

const isHome = () => {
  return provider ? provider.isHome() : false;
};

function cancelAutoTrack() {
  if (autoTrackTimer) clearTimeout(autoTrackTimer);
  if (countdownInterval) clearInterval(countdownInterval);
  autoTrackTimer = null;
  countdownInterval = null;
  autoTrackState.isActive = false;
  autoTrackState.countdown = 0;
  autoTrackState.targetEp = 0;
}

let lastNotesSyncTime = 0;
let lastSyncedResumeTime = 0;
let hasTriggeredPlayTrack = false;
let pendingResumeTarget = null;
let pendingResumeEp = null;
let resumedEpKey = null;
let lastObservedCurrentTime = 0;
let lastPlayerWindow = null;
let lastSyncedMediaId = null;
let resumeLoadingToastKey = null;

function getResumeKey(activeEp) {
  const ep = activeEp || provider?.getActiveEpisode?.() || 1;
  const mediaId = currentMedia?.id || "media";
  return `${mediaId}_ep${ep}`;
}

function isEpisodeEligibleForResume(ep) {
  return isResumeEligibleEpisode({ trackedProgress, activeEp: ep });
}

function prepareResumeTarget(force = false) {
  const activeEp = provider?.getActiveEpisode?.() || 1;
  const currentKey = getResumeKey(activeEp);
  if (resumedEpKey === currentKey && !force) return;
  const settings = Settings.get();
  if (!settings.autoResume) {
    pendingResumeTarget = null;
    pendingResumeEp = null;
    return;
  }

  const sessionTime = sessionStorage.getItem("al_resume_time");
  const sessionTargetEp = sessionStorage.getItem("al_target_ep");
  let targetTime = null;

  if (sessionTime) {
    const parsedTime = parseInt(sessionTime, 10);
    const parsedEp = sessionTargetEp ? parseInt(sessionTargetEp, 10) : null;
    if ((!parsedEp || parsedEp === activeEp) && isResumeEligibleEpisode({ trackedProgress, activeEp })) {
      targetTime = parsedTime;
    }
  }

  if (!targetTime && currentMedia) {
    const decision = resolveResumeAction({
      trackedProgress,
      activeEp,
      status: currentMedia?.mediaListEntry?.status || null,
      currentTime: lastObservedCurrentTime,
      localResume: Resume.getLocal(currentMedia.id),
      anilistResume: Resume.extract(currentMedia?.mediaListEntry?.notes)
    });
    if (decision.action === "yield") {
      resumedEpKey = currentKey;
      pendingResumeTarget = null;
      pendingResumeEp = null;
      return;
    }
    if (decision.action === "seek") {
      targetTime = decision.time;
    }
  }

  if (targetTime && targetTime > 0) {
    pendingResumeTarget = targetTime;
    pendingResumeEp = activeEp;
    if (provider?.isWatchPage?.() && resumeLoadingToastKey !== currentKey) {
      resumeLoadingToastKey = currentKey;
      showToast(`↺ Restoring Ep. ${activeEp} at ${Resume.formatTime(targetTime)}...`, false, 2000);
      App.render();
    }
  } else if (force || currentMedia) {
    pendingResumeTarget = null;
    pendingResumeEp = null;
  }
}

function dispatchResumeSeek(targetWindow = null) {
  const activeEp = pendingResumeEp || provider?.getActiveEpisode?.() || 1;
  if (!pendingResumeTarget || !Settings.get().autoResume || resumedEpKey === getResumeKey(activeEp)) return;

  const payload = { type: "AL_RESUME_SEEK", target: pendingResumeTarget };
  const win = targetWindow || lastPlayerWindow;

  if (win) {
    try {
      win.postMessage(payload, "*");
    } catch (_) {}
  } else {
    document.querySelectorAll("iframe").forEach((frame) => {
      try {
        frame.contentWindow?.postMessage(payload, "*");
      } catch (_) {}
    });
  }
}

async function syncResumeToNotes(mediaId, ep, currentTime, duration) {
  if (!currentMedia?.mediaListEntry || !Settings.get().crossDeviceSync) return;
  const curNotes = currentMedia.mediaListEntry.notes || "";
  const updated = Resume.apply(curNotes, { ep, time: currentTime, duration });
  if (updated === curNotes) return;

  currentMedia.mediaListEntry.notes = updated;
  try {
    await AniListAPI.saveEntry({
      mediaId,
      notes: updated
    });
  } catch (_) {}
}

function handlePlaybackState({ currentTime, duration, isPaused, isEnded }) {
  lastObservedCurrentTime = typeof currentTime === "number" ? currentTime : 0;
  if (!currentMedia || isHome() || !provider?.isWatchPage?.()) return;
  const activeEp = provider?.getActiveEpisode?.() || 1;
  const settings = Settings.get();
  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isEligible = isEpisodeEligibleForResume(activeEp);
  const edStart = getActiveSkipSegments().ed?.start || null;
  const threshold = settings.completionThreshold || 85;
  const finished = isEpisodeFinished({ currentTime, duration, percent, isEnded, threshold, edStart });
  const alreadyTrackedOrCancelled = cancelledEps.has(activeEp) || !isEligible;

  // Companion mode: yield only if video is already near target or playing deep past 20s
  if (currentTime > 5 && (!pendingResumeTarget || Math.abs(currentTime - pendingResumeTarget) <= 15 || currentTime > 20)) {
    resumedEpKey = getResumeKey(activeEp);
    pendingResumeTarget = null;
  }

  // 1. Fast local cache update (strictly ONLY for eligible, unfinished episodes)
  if (!alreadyTrackedOrCancelled && !finished && currentTime > 5) {
    Resume.setLocal(currentMedia.id, {
      ep: activeEp,
      time: Math.round(currentTime),
      duration: Math.round(duration),
      percent: Math.round(percent)
    });
  }

  // 2. Refresh UI on pause & sync resume to notes (only for active Watching/Rewatching, unfinished)
  const entryStatus = currentMedia?.mediaListEntry?.status;
  if (isPaused) {
    if (!alreadyTrackedOrCancelled && !finished && entryStatus !== "COMPLETED" && settings.autoResume && currentUser?.id && currentTime > 5) {
      syncResumeToNotes(currentMedia.id, activeEp, currentTime, duration);
    }
    App.render();
  }

  // 3. Trigger: Video Completion (ED start, >= 85%, or isEnded) via pure domain rule
  if (
    settings.autoTrack &&
    shouldAutoTrack({
      activeEp,
      trackedProgress,
      status: entryStatus,
      currentTime,
      duration,
      percent,
      isEnded,
      threshold,
      edStart,
      isCancelled: cancelledEps.has(activeEp)
    })
  ) {
    cancelledEps.add(activeEp);
    Resume.clearLocal(currentMedia.id);
    App.setProgress(activeEp);
    return;
  }

  // 4. Cloud Sync to notes (periodic while playing, only if unfinished)
  if (!alreadyTrackedOrCancelled && !finished && entryStatus !== "COMPLETED" && settings.autoResume && currentUser?.id && currentTime > 15) {
    const now = Date.now();
    const timeDiff = Math.abs(currentTime - lastSyncedResumeTime);
    if (now - lastNotesSyncTime >= 60000 && timeDiff >= 15) {
      lastNotesSyncTime = now;
      lastSyncedResumeTime = currentTime;
      syncResumeToNotes(currentMedia.id, activeEp, currentTime, duration);
    }
  }
}

function handleActiveEpisodeChange(newActiveEp) {
  if (!newActiveEp || newActiveEp === lastActiveEp) return;
  lastActiveEp = newActiveEp;
  cancelAutoTrack();
  hasTriggeredPlayTrack = false;
  resumedEpKey = null;
  lastObservedCurrentTime = 0;

  const info = provider?.getAnimeInfo() || {};
  const malId = currentMedia?.idMal || info.malId;
  if (malId) {
    checkSkipIntro(malId, newActiveEp);
  }
  renderAutoSkipButton(provider);

  prepareResumeTarget(true);
  if (pendingResumeTarget) {
    dispatchResumeSeek();
  }

  App.render();
}

async function findMediaByTitle(title, expectedTotalEp = null) {
  if (!title) return null;
  const cleaned = cleanTitle(title);
  const targetSeason = extractSeason(title);

  // Use candidate Page search for season & format filtering
  const searchRes = (await AniListAPI.searchMedia(cleaned)) || (cleaned !== title ? await AniListAPI.searchMedia(title) : null);
  const candidates = searchRes?.Page?.media || [];

  if (candidates.length > 0) {
    const scored = candidates
      .map((m) => {
        let score = 0;
        const mTitle = m.title?.romaji || m.title?.english || m.title?.userPreferred || "";
        const mSeason = extractSeason(mTitle);
        if (mSeason === targetSeason) score += 100;
        else score -= 100;

        if (expectedTotalEp && m.episodes) {
          if (m.episodes === expectedTotalEp) score += 40;
          else if (Math.abs(m.episodes - expectedTotalEp) <= 2) score += 15;
          else if (m.episodes <= 3 && expectedTotalEp > 10) score -= 60;
        }

        if (m.format === "TV") score += 30;
        else if (m.format === "OVA" || m.format === "SPECIAL") score -= 50;

        // Extra penalty for titles containing spin-off keywords when search query didn't have them
        const lowerM = mTitle.toLowerCase();
        const lowerQ = cleaned.toLowerCase();
        for (const word of ["quest", "picture drama", "recap", "special", "drama cd"]) {
          if (lowerM.includes(word) && !lowerQ.includes(word)) {
            score -= 80;
          }
        }

        return { media: m, score };
      })
      .sort((a, b) => b.score - a.score);

    if (scored[0] && scored[0].score > 0) {
      return scored[0].media;
    }
    return candidates[0];
  }

  // Fallback to single getMedia query
  let res = await AniListAPI.getMedia(cleaned);
  if (!res?.Media && cleaned !== title) res = await AniListAPI.getMedia(title);
  return res?.Media || null;
}

function injectHomeShelf(shelfElement) {
  const existing = document.getElementById("al-home-continue-watching");
  if (existing) {
    if (existing !== shelfElement) existing.replaceWith(shelfElement);
    return;
  }

  const anchor = provider?.getShelfAnchor?.();
  if (!anchor || !anchor.element) return;

  const shelfRow = document.createElement("div");
  shelfRow.className = "row al-home-shelf-row";
  const shelfCol = document.createElement("div");
  shelfCol.className = "col-12";
  shelfCol.appendChild(shelfElement);
  shelfRow.appendChild(shelfCol);

  if (anchor.position === "after") {
    anchor.element.after(shelfRow);
  } else if (anchor.position === "before") {
    anchor.element.before(shelfRow);
  } else if (anchor.position === "prepend") {
    anchor.element.prepend(shelfRow);
  } else {
    anchor.element.appendChild(shelfRow);
  }
}

async function computeHomeSyncNotifs() {
  if (!homeEntries || !homeEntries.length) {
    homeSyncNotifs = [];
    return;
  }

  const buddyMap = new Map();
  homeEntries.forEach((entry) => {
    const buddy = Buddy.extract(entry.notes);
    if (buddy) {
      if (!buddyMap.has(buddy)) buddyMap.set(buddy, []);
      buddyMap.get(buddy).push(entry);
    }
  });

  if (!buddyMap.size) {
    homeSyncNotifs = [];
    return;
  }

  const notifs = [];
  for (const [buddyName, entries] of buddyMap.entries()) {
    const buddyCol = await Buddy.getBuddyCollection(buddyName);
    for (const entry of entries) {
      const buddyEntry = buddyCol.get(entry.mediaId);
      const myProgress = entry.progress || 0;
      const buddyProgress = buddyEntry?.progress || 0;
      const isBuddyCompleted = buddyEntry?.status === "COMPLETED" || (buddyEntry?.media?.episodes && buddyProgress >= buddyEntry.media.episodes);
      const buddyResume = Resume.extract(buddyEntry?.notes);
      const myResume = Resume.extract(entry.notes) || Resume.getLocal(entry.mediaId);
      const syncState = computeBuddySyncState({
        myProgress,
        myStatus: entry.status,
        myResume,
        buddyProgress,
        buddyStatus: buddyEntry?.status,
        buddyIsCompleted: !!isBuddyCompleted,
        buddyResume
      });
      const media = entry.media || {};
      const title = media.title?.english || media.title?.romaji || "Untitled";

      notifs.push({
        mediaId: entry.mediaId,
        buddy: buddyName,
        avatar: Buddy.getAvatar(buddyName) || "https://anilist.co/img/icons/icon.svg",
        buddyEp: buddyProgress,
        myEp: myProgress,
        isAhead: syncState.isEpAhead,
        isBuddyCompleted: !!isBuddyCompleted,
        buddyResume,
        resumeToApply: syncState.resumeToApply,
        canSyncResume: syncState.canSyncResume,
        syncKind: syncState.syncKind,
        canSync: syncState.canSync,
        title
      });
    }
  }

  homeSyncNotifs = notifs;
}

async function loadHomeWatching() {
  if (homeFetching) return;
  homeFetching = true;

  if (!currentUser?.id) {
    homeEntries = [];
    homeSyncNotifs = [];
    homeFetching = false;
    renderHome();
    return;
  }

  try {
    const data = await AniListAPI.getUserWatching(currentUser.id);
    const lists = data?.MediaListCollection?.lists || [];
    homeEntries = lists.flatMap((l) => l.entries || []);
    homeEntries.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    await computeHomeSyncNotifs();
  } catch (err) {
    Logger.warn("Error loading watching collection:", err);
    homeEntries = [];
    homeSyncNotifs = [];
  } finally {
    homeFetching = false;
    renderHome();
  }
}

const openAuth = () => openTokenModal(async () => {
  await App.loadUser();
  if (isHome()) await loadHomeWatching();
  else App.sync();
});

function renderHome() {
  if (!isHome()) {
    const existing = document.getElementById("al-home-continue-watching");
    if (existing) existing.closest(".al-home-shelf-row")?.remove() || existing.remove();
    return;
  }

  if (homeEntries === null && homeFetching) {
    if (!document.getElementById("al-home-continue-watching")) {
      const skeleton = document.createElement("div");
      skeleton.id = "al-home-continue-watching";
      skeleton.className = "al-home-shelf";
      skeleton.innerHTML = `
        <div class="al-shelf-header">
          <div class="al-shelf-title-wrap">
            <div class="al-shelf-icon">${iconHtml(Play, { width: 15, height: 15 })}</div>
            <h2 class="al-shelf-title">CONTINUE WATCHING</h2>
          </div>
        </div>
        <div class="al-shelf-carousel-wrap">
          <div class="al-shelf-track">
            <div class="al-shelf-skeleton"></div>
            <div class="al-shelf-skeleton"></div>
            <div class="al-shelf-skeleton"></div>
            <div class="al-shelf-skeleton"></div>
          </div>
        </div>
      `;
      injectHomeShelf(skeleton);
    }
    return;
  }

  const shelf = renderWatchingShelf({
    entries: homeEntries || [],
    viewer: currentUser,
    syncNotifs: homeSyncNotifs,
    onLogin: openAuth,
    onRefresh: () => loadHomeWatching(),
    onSyncEntry: async (mediaId, ep, isCompleted = false, buddyResume = null, syncKind = "episode") => {
      if (syncKind === "resume" && buddyResume) {
        await App.syncBuddyResume(mediaId, buddyResume);
        return;
      }
      await App.setProgress(ep, mediaId, isCompleted ? "COMPLETED" : null, { buddyResume });
      await loadHomeWatching();
    },
    onClearResume: async (entry) => {
      const mediaId = entry?.media?.id;
      if (!mediaId) return;
      Resume.clearLocal(mediaId);
      sessionStorage.removeItem("al_resume_time");
      if (entry.notes && entry.notes.includes("[resume:")) {
        const cleared = Resume.clear(entry.notes);
        await AniListAPI.saveEntry({ mediaId, notes: cleared });
      }
      showToast("Resume cleared");
      await loadHomeWatching();
    },
    onAdjustProgress: async (mediaId, targetEp) => {
      if (!mediaId) return;
      await App.setProgress(Math.max(0, targetEp), mediaId);
      await loadHomeWatching();
    },
    onRemoveEntry: async (entry) => {
      if (!entry?.id) return;
      if (confirm("Remove this anime from your AniList?") && (await AniListAPI.deleteEntry(entry.id))) {
        showToast("Anime removed");
        await loadHomeWatching();
      }
    },
    onStatusChange: async (entry, status) => {
      if (!entry?.media?.id || !status) return;
      const params = { mediaId: entry.media.id, status };
      if (status === "COMPLETED") {
        if (!entry.completedAt?.year) params.completedAt = getTodayDate();
        if (!entry.startedAt?.year) params.startedAt = getTodayDate();
        if (entry.status === "REPEATING") params.repeat = (entry.repeat || 0) + 1;
      } else if ((status === "CURRENT" || status === "REPEATING") && !entry.startedAt?.year) {
        params.startedAt = getTodayDate();
      }
      if (await AniListAPI.saveEntry(params)) {
        showToast(`Status: ${AniListAPI.statuses[status] || status}`);
        await loadHomeWatching();
      }
    },
    onBuddyChange: async (entry, newBuddy) => {
      if (!entry?.media?.id) return;
      const updatedNotes = Buddy.apply(entry.notes || "", newBuddy);
      const res = await AniListAPI.saveEntry({
        mediaId: entry.media.id,
        notes: updatedNotes
      });
      if (res?.SaveMediaListEntry) {
        if (newBuddy) Settings.set("defaultBuddy", newBuddy);
        showToast(newBuddy ? `Sync Together set: ${newBuddy}` : "Sync Together removed");
        await loadHomeWatching();
      }
    }
  });
  injectHomeShelf(shelf);
}

export const App = {
  async loadUser() {
    if (!Storage.get("anilist_token")) {
      currentUser = null;
      App.render();
      return;
    }
    const data = await AniListAPI.getViewer(() => App.logout());
    if (data?.Viewer) {
      currentUser = data.Viewer;
      Buddy.setViewer(currentUser);
      if (currentUser.id) Buddy.getFollowingCached(currentUser.id);
      if (isHome()) loadHomeWatching();
      App.render();
    }
  },

  logout() {
    cancelAutoTrack();
    Storage.del("anilist_token");
    Buddy.setViewer(null);
    currentUser = null;
    currentMedia = null;
    homeEntries = null;
    homeSyncNotifs = [];
    currentBuddyData = null;
    trackedProgress = -1;
    lastActiveEp = 0;
    cancelledEps.clear();
    App.render();
    showToast("Disconnected from AniList");
  },

  async setProgress(newProgress, targetMediaId = null, overrideStatus = null, { buddyResume = null } = {}) {
    const id = targetMediaId || currentMedia?.id;
    if (!id) return;
    const isSinglePage = !targetMediaId && currentMedia;
    const homeEntry = targetMediaId ? homeEntries?.find((e) => e.mediaId === targetMediaId || e.media?.id === targetMediaId) : null;
    const entry = isSinglePage ? currentMedia.mediaListEntry : (homeEntry || null);
    const totalEp = isSinglePage ? currentMedia.episodes : (homeEntry?.media?.episodes || 0);

    const { params, isCompleted, isRewatching, isReset } = computeProgressUpdate({
      mediaId: id,
      newProgress,
      totalEp,
      entry,
      overrideStatus,
      today: getTodayDate()
    });
    const targetStatus = params.status;

    if (buddyResume && typeof buddyResume.time === "number" && buddyResume.time > 10) {
      const appliedNotes = Resume.apply(entry?.notes || "", buddyResume);
      params.notes = appliedNotes;
      if (entry) entry.notes = appliedNotes;
      Resume.setLocal(id, buddyResume);
    } else {
      if (entry?.notes && entry.notes.includes("[resume:")) {
        const cleared = Resume.clear(entry.notes);
        params.notes = cleared;
        if (entry) entry.notes = cleared;
      }
      Resume.clearLocal(id);
    }

    const res = await AniListAPI.saveEntry(params);
    if (res?.SaveMediaListEntry) {
      cancelledEps.delete(newProgress);
      const isRewind = trackedProgress > 0 && newProgress < trackedProgress;
      const toastMsg = isReset
        ? `Progress reset to Ep. 0 (${AniListAPI.statuses[targetStatus] || targetStatus})`
        : isRewind
          ? `↺ Rewound to Ep. ${newProgress}`
          : isCompleted
            ? (isRewatching ? `🎉 Rewatch completed (${(entry?.repeat || 0) + 1}×)!` : "🎉 Completed on AniList!")
            : `Episode ${newProgress} saved`;
      showToast(toastMsg);
      if (isSinglePage) {
        App.sync();
      } else {
        await loadHomeWatching();
      }
    }
  },

  async syncBuddyResume(mediaId, buddyResume) {
    if (!mediaId || !buddyResume) return;
    const isSinglePage = currentMedia?.id === mediaId;
    const homeEntry = homeEntries?.find((e) => e.mediaId === mediaId || e.media?.id === mediaId) || null;
    const entry = isSinglePage ? currentMedia?.mediaListEntry : homeEntry;
    const updatedNotes = Resume.apply(entry?.notes || "", buddyResume);

    Resume.setLocal(mediaId, buddyResume);
    const res = await AniListAPI.saveEntry({ mediaId, notes: updatedNotes });
    if (res?.SaveMediaListEntry) {
      if (entry) entry.notes = updatedNotes;
      showToast(`↺ Synced resume to Ep. ${buddyResume.ep} (${Resume.formatTime(buddyResume.time)})`);
      if (isHome()) {
        await loadHomeWatching();
      } else {
        const activeEp = provider?.getActiveEpisode?.() || 0;
        if (provider?.isWatchPage?.() && activeEp === buddyResume.ep) {
          resumedEpKey = null;
          pendingResumeTarget = buddyResume.time;
          pendingResumeEp = buddyResume.ep;
          dispatchResumeSeek();
        }
        await App.sync();
      }
    }
  },

  render() {
    const hasToken = !!Storage.get("anilist_token");
    const activeEp = provider?.getActiveEpisode?.() || 0;
    const isWatch = !!provider?.isWatchPage?.();

    renderNav(currentUser, {
      onLogin: openAuth,
      onLogout: () => App.logout(),
      onChangeToken: openAuth
    }, provider);

    if (isHome()) {
      const actionsSlot = document.getElementById("al-slot-actions");
      if (actionsSlot) actionsSlot.style.display = "none";
      const switchSlot = document.getElementById("al-slot-switch");
      if (switchSlot) switchSlot.style.display = "none";
      const skipSlot = document.getElementById("al-slot-skip");
      if (skipSlot) skipSlot.style.display = "none";
      const navSlot = document.getElementById("al-slot-nav");
      if (navSlot) navSlot.style.display = "";
      renderHome();
      return;
    }

    const actionsSlot = document.getElementById("al-slot-actions");
    if (actionsSlot) actionsSlot.style.display = "";
    const switchSlot = document.getElementById("al-slot-switch");
    if (switchSlot) switchSlot.style.display = "";
    const skipSlot = document.getElementById("al-slot-skip");
    if (skipSlot) skipSlot.style.display = isWatch ? "" : "none";
    if (isWatch) renderAutoSkipButton(provider);
    const navSlot = document.getElementById("al-slot-nav");
    if (navSlot) navSlot.style.display = "none";

    renderActions(currentMedia, hasToken, {
      onConnect: openAuth,
      onAdd: () => App.setProgress(activeEp || 1),
      onResetProgress: () => App.setProgress(0),
      onBuddySync: async ({ ep, isCompleted = false, buddyResume = null, syncKind = "episode" } = {}) => {
        if (syncKind === "resume" && buddyResume && currentMedia?.id) {
          await App.syncBuddyResume(currentMedia.id, buddyResume);
          return;
        }
        await App.setProgress(ep, null, isCompleted ? "COMPLETED" : null, { buddyResume });
      },
      onStatusChange: async (status) => {
        const entry = currentMedia?.mediaListEntry;
        const params = { mediaId: currentMedia.id, status };
        if (status === "COMPLETED") {
          if (!entry?.completedAt?.year) params.completedAt = getTodayDate();
          if (!entry?.startedAt?.year) params.startedAt = getTodayDate();
          if (entry?.status === "REPEATING") params.repeat = (entry.repeat || 0) + 1;
        } else if ((status === "CURRENT" || status === "REPEATING") && !entry?.startedAt?.year) {
          params.startedAt = getTodayDate();
        }
        if (await AniListAPI.saveEntry(params)) {
          showToast(`Status: ${AniListAPI.statuses[status]}`);
          App.sync();
        }
      },
      onBuddyChange: async (newBuddy) => {
        const curNotes = currentMedia?.mediaListEntry?.notes || "";
        const updatedNotes = Buddy.apply(curNotes, newBuddy);
        const res = await AniListAPI.saveEntry({
          mediaId: currentMedia.id,
          notes: updatedNotes
        });
        if (res?.SaveMediaListEntry) {
          if (currentMedia.mediaListEntry) currentMedia.mediaListEntry.notes = updatedNotes;
          if (newBuddy) Settings.set("defaultBuddy", newBuddy);
          showToast(newBuddy ? `Sync Together set: ${newBuddy}` : "Sync Together removed");
          App.sync();
        }
      },
      onDelete: async () => {
        if (
          confirm("Remove this anime from your AniList?") &&
          (await AniListAPI.deleteEntry(currentMedia.mediaListEntry.id))
        ) {
          showToast("Anime removed");
          App.sync();
        }
      },
      onSave: (ep) => {
        cancelAutoTrack();
        App.setProgress(ep);
      },
      onCancelCountdown: () => {
        if (autoTrackState.targetEp) cancelledEps.add(autoTrackState.targetEp);
        cancelAutoTrack();
        App.render();
      },
      onStepProgress: async (targetEp) => {
        cancelAutoTrack();
        if (activeEp && targetEp < activeEp) cancelledEps.add(activeEp);
        await App.setProgress(Math.max(0, targetEp));
      }
    }, {
      isLoading: isMediaLoading,
      viewer: currentUser,
      defaultBuddy: Settings.get().defaultBuddy,
      buddyData: currentBuddyData,
      myResume: Resume.extract(currentMedia?.mediaListEntry?.notes) || Resume.getLocal(currentMedia?.id),
      provider,
      activeEp,
      trackedProgress,
      autoTrackState,
      isWatch,
      resumeTarget: pendingResumeTarget || 0
    });

    provider?.highlightEpisodes(trackedProgress);
    renderCrossSwitch({ media: currentMedia, activeEp, provider });
    if (isWatch && activeEp > 0) {
      renderAutoSkipButton(provider);
    }
  },

  async sync() {
    if (isHome()) return;

    if (!Storage.get("anilist_token")) {
      currentMedia = null;
      trackedProgress = -1;
      isMediaLoading = false;
      App.render();
      return;
    }

    try {
      isMediaLoading = true;
      App.render();

      const info = provider?.getAnimeInfo() || {};
      if (info.anilistId) {
        currentMedia = (await AniListAPI.getMediaById(info.anilistId))?.Media || null;
      }
      if (!currentMedia && info.malId) {
        currentMedia = (await AniListAPI.getMediaByMalId(info.malId))?.Media || null;
      }
      if (!currentMedia && typeof provider?.fetchRemoteMetadata === "function") {
        const remote = await provider.fetchRemoteMetadata();
        if (remote?.anilistId) {
          currentMedia = (await AniListAPI.getMediaById(remote.anilistId))?.Media || null;
        } else if (remote?.malId) {
          currentMedia = (await AniListAPI.getMediaByMalId(remote.malId))?.Media || null;
        }
      }
      if (!currentMedia && info.romajiTitle) {
        currentMedia = await findMediaByTitle(info.romajiTitle, info.totalEp);
      }
      if (!currentMedia && info.title) {
        currentMedia = await findMediaByTitle(info.title, info.totalEp);
      }
      if (!currentMedia && currentTitle) {
        currentMedia = await findMediaByTitle(currentTitle, info.totalEp);
      }

      // Auto-learn cache mapping for active provider
      if (currentMedia?.id) {
        if (provider?.name === "AnimeUnity") {
          const match = window.location.pathname.match(/\/anime\/(\d+)(?:-([^/]+))?/i);
          if (match && match[1]) {
            const rawMap = Storage.get("al_au_map");
            const map = (rawMap && typeof rawMap === "object" && !Array.isArray(rawMap)) ? rawMap : {};
            map[currentMedia.id] = {
              id: parseInt(match[1], 10),
              slug: match[2] || "",
              updatedAt: Date.now()
            };
            Storage.set("al_au_map", map);
          }
        } else if (provider?.name === "AnimeSaturn") {
          const match = window.location.pathname.match(/\/anime\/([^/]+)/i);
          if (match && match[1]) {
            const rawMap = Storage.get("al_as_map");
            const map = (rawMap && typeof rawMap === "object" && !Array.isArray(rawMap)) ? rawMap : {};
            map[currentMedia.id] = {
              slug: match[1],
              malId: currentMedia.idMal || undefined,
              updatedAt: Date.now()
            };
            Storage.set("al_as_map", map);
          }
        }
      }

      if (currentMedia?.id && currentMedia.id !== lastSyncedMediaId) {
        lastSyncedMediaId = currentMedia.id;
        lastActiveEp = 0;
        lastObservedCurrentTime = 0;
        hasTriggeredPlayTrack = false;
        lastPlayerWindow = null;
        cancelledEps.clear();
        cancelAutoTrack();
      }

      trackedProgress = currentMedia?.mediaListEntry ? currentMedia.mediaListEntry.progress : -1;

      // Extract and fetch buddy progress for this media
      const buddyName = Buddy.extract(currentMedia?.mediaListEntry?.notes);
      if (buddyName && currentMedia?.id) {
        const buddyEntry = await Buddy.getBuddyMediaEntry(buddyName, currentMedia.id);
        const buddyEp = buddyEntry?.progress || 0;
        const isBuddyCompleted = buddyEntry?.status === "COMPLETED" || (buddyEntry?.media?.episodes && buddyEp >= buddyEntry.media.episodes);
        currentBuddyData = {
          name: buddyName,
          avatar: Buddy.getAvatar(buddyName) || buddyEntry?.user?.avatar?.medium || "https://anilist.co/img/icons/icon.svg",
          progress: buddyEp,
          status: buddyEntry?.status,
          isCompleted: !!isBuddyCompleted,
          resume: Resume.extract(buddyEntry?.notes)
        };
      } else {
        currentBuddyData = null;
      }

      if (!isHome() && provider?.isWatchPage?.()) {
        const ep = provider?.getActiveEpisode?.() || 0;
        const malId = currentMedia?.idMal || info.malId;
        if (malId && ep > 0) {
          checkSkipIntro(malId, ep);
        }
        if (ep > 0 && resumedEpKey !== getResumeKey(ep)) {
          prepareResumeTarget();
          if (pendingResumeTarget) {
            dispatchResumeSeek();
          }
        }
      } else if (!isHome() && provider?.isAnimePage?.() && currentMedia) {
        const urlEp = new URLSearchParams(window.location.search).get("ep");
        const targetStr = urlEp || sessionStorage.getItem("al_target_ep");
        const targetEp = targetStr ? parseInt(targetStr, 10) : 0;
        if (targetEp > 0) {
          sessionStorage.removeItem("al_target_ep");
          const targetUrl = await provider.resolveTargetUrl(currentMedia, targetEp);
          if (targetUrl && targetUrl !== window.location.pathname) {
            window.location.href = targetUrl;
            return;
          }
        }
      }
      if (!isHome() && currentMedia && !pendingResumeTarget) {
        showToast(
          trackedProgress >= 0
            ? `✓ AniList: Ep. ${trackedProgress}/${currentMedia.episodes || "?"}`
            : `✓ AniList: ${currentMedia.title?.english || currentMedia.title?.romaji || "Ready"}`,
          false,
          2000
        );
      }
    } catch (err) {
      Logger.warn("Error during AniList sync:", err);
    } finally {
      isMediaLoading = false;
      App.render();
    }
  },

  init() {
    initSkipIntroTop();
    App.loadUser();
    prepareResumeTarget();

    window.addEventListener("message", (e) => {
      if (e.data?.type === "AL_AUTH_SUCCESS" && e.data.token) {
        Storage.set("anilist_token", e.data.token);
        showToast("✓ AniList Connected!");
        App.loadUser();
      } else if (e.data?.type === "AL_PLAYBACK_STATE") {
        handlePlaybackState(e.data);
      } else if (e.data?.type === "PLAYER_EVENT" && e.data?.data?.event === "playerstate") {
        const d = e.data.data;
        handlePlaybackState({
          currentTime: typeof d.position === "number" ? d.position : 0,
          duration: typeof d.duration === "number" ? d.duration : 0,
          isPaused: !!d.paused,
          isEnded: d.reason === "complete"
        });
      } else if (e.data?.type === "AL_PLAYER_READY" || e.data?.type === "AU_FRAME_READY") {
        if (e.source) lastPlayerWindow = e.source;
        if (!provider?.isWatchPage?.()) return;
        const ep = provider?.getActiveEpisode?.() || 0;
        if (ep > 0 && resumedEpKey !== getResumeKey(ep)) {
          if (!pendingResumeTarget) {
            prepareResumeTarget();
          }
          // Give native site resume brief grace period before applying cross-device AniList fallback
          if (pendingResumeTarget) {
            const targetWin = e.source || lastPlayerWindow;
            setTimeout(() => {
              if (resumedEpKey !== getResumeKey(ep) && pendingResumeTarget) {
                dispatchResumeSeek(targetWin);
              }
            }, 600);
          }
        }
      } else if (e.data?.type === "AL_RESUME_CONFIRMED") {
        const activeEp = pendingResumeEp || provider?.getActiveEpisode?.() || 1;
        const currentKey = getResumeKey(activeEp);
        if (resumedEpKey === currentKey) return;
        resumedEpKey = currentKey;
        const resumeTime = e.data.time || pendingResumeTarget;
        pendingResumeTarget = null;
        pendingResumeEp = null;
        sessionStorage.removeItem("al_resume_time");
        sessionStorage.removeItem("al_target_ep");
        if (resumeTime) {
          showToast(`↺ Resumed Ep. ${activeEp} at ${Resume.formatTime(resumeTime)}`, false, 2500);
        }
        App.render();
      }
    });

    const handlePageExit = () => {
      if (currentMedia && currentUser?.id && currentMedia.mediaListEntry?.status !== "COMPLETED") {
        const local = Resume.getLocal(currentMedia.id);
        const edStart = getActiveSkipSegments().ed?.start || null;
        const threshold = Settings.get().completionThreshold || 85;
        if (
          local &&
          local.time > 15 &&
          !cancelledEps.has(local.ep) &&
          isEpisodeEligibleForResume(local.ep) &&
          !isEpisodeFinished({
            currentTime: local.time,
            duration: local.duration,
            percent: local.percent,
            threshold,
            edStart
          })
        ) {
          syncResumeToNotes(currentMedia.id, local.ep, local.time, local.duration);
        }
      }
    };

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        handlePageExit();
      }
    });
    window.addEventListener("beforeunload", handlePageExit);
    window.addEventListener("pagehide", handlePageExit);

    Settings.subscribe((settings) => {
      if (!settings.autoTrack) {
        cancelAutoTrack();
      }
      App.render();
    });

    document.addEventListener("click", (e) => {
      document.querySelectorAll("#al-nav-dropdown, #al-nav-m-dropdown").forEach((d) => {
        if (!d.contains(e.target) && !e.target.closest("#al-nav-desktop, #al-nav-mobile")) {
          d.classList.remove("show");
        }
      });

      const epClick = e.target.closest(".episode-wrapper .episode-item, .ep-tile, a[href*='/ep-'], #video-bottom a.prev, #video-bottom a.next, .wt-btn");
      if (epClick) {
        setTimeout(() => {
          const ep = provider?.getActiveEpisode?.();
          if (ep) handleActiveEpisodeChange(ep);
        }, 100);
      }
    });

    let lastPath = window.location.pathname;

    setInterval(() => {
      if (window.location.pathname !== lastPath) {
        lastPath = window.location.pathname;
        if (isHome()) {
          loadHomeWatching();
        } else {
          App.sync();
        }
      }

      if (isHome()) {
        if (currentUser?.id && homeEntries === null && !homeFetching) {
          loadHomeWatching();
        } else if (!document.getElementById("al-home-continue-watching")) {
          renderHome();
        }
      } else {
        const shelf = document.getElementById("al-home-continue-watching");
        if (shelf) shelf.closest(".al-home-shelf-row")?.remove() || shelf.remove();

        const info = provider?.getAnimeInfo() || {};
        if (info.title && info.title !== currentTitle) {
          currentTitle = info.title;
          App.sync();
        }

        const ep = provider?.getActiveEpisode?.();
        if (ep && ep !== lastActiveEp) {
          handleActiveEpisodeChange(ep);
        }

        provider?.highlightEpisodes(trackedProgress);
        if (provider?.isWatchPage?.() && ep > 0) {
          renderAutoSkipButton(provider);
        }
      }

      function monitorTopLevelVideo() {
        const video = document.querySelector("video");
        if (video && !video.__au_top_bound) {
          video.__au_top_bound = true;
          const broadcast = () => {
            handlePlaybackState({
              currentTime: video.currentTime || 0,
              duration: video.duration || 0,
              isPaused: video.paused,
              isEnded: video.ended
            });
          };
          video.addEventListener("pause", () => {
            broadcast();
            setTimeout(broadcast, 100);
          });
          video.addEventListener("seeked", broadcast);
          video.addEventListener("timeupdate", broadcast);
        }
      }
      monitorTopLevelVideo();

      if (isHome()) {
        const hasPill = document.getElementById("al-home-user-pill");
        if (!hasPill) App.render();
      } else {
        const hasBar = document.getElementById("al-control-bar");
        if (!hasBar) App.render();
      }
    }, 700);
  }
};

const isPlayerFrame = window.self !== window.top || window.location.hostname.includes("vixcloud") || window.location.hostname.includes("saturncdn");

if (handleOAuthRedirect()) {
  // Handled AniList OAuth callback
} else if (isPlayerFrame) {
  initPlayer();
} else {
  provider = getProvider();
  if (provider?.name === "AnimeUnity") {
    Storage.set("al_au_base", window.location.origin);
  } else if (provider?.name === "AnimeSaturn") {
    Storage.set("al_as_base", window.location.origin);
  }
  currentUser = Buddy.getViewer();
  handleUrlToken();
  App.init();
}
