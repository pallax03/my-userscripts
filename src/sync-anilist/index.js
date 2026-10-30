import "./styles.scss";
import { Storage } from "../shared/storage.js";
import { showToast } from "../shared/toast.js";
import { Logger } from "../shared/logger.js";
import { AniListAPI } from "../shared/anilist/api.js";
import { handleUrlToken, getTodayDate, openTokenModal } from "../shared/anilist/auth.js";
import { cleanTitle, extractSeason } from "./providers/base.js";
import { getProvider, getCurrentProvider } from "./providers/index.js";
import { Settings } from "./settings.js";
import { Resume } from "./resume.js";
import { renderNav } from "./components/nav.js";
import { renderActions } from "./components/actions.js";
import { autoSelectTargetEpisode } from "./components/episodes.js";
import { renderWatchingShelf } from "./components/watching-shelf.js";
import { Buddy } from "./buddy.js";
import { iconHtml, Play } from "../shared/icons.js";
import { checkSkipIntro, initSkipIntroTop } from "./components/skip-intro.js";
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
let hasDispatchedResumeThisEp = false;

function prepareResumeTarget(force = false) {
  if (hasDispatchedResumeThisEp && !force) return;
  const settings = Settings.get();
  if (!settings.autoResume) {
    pendingResumeTarget = null;
    pendingResumeEp = null;
    return;
  }

  const activeEp = provider?.getActiveEpisode?.() || 1;
  const sessionTime = sessionStorage.getItem("al_resume_time");
  const sessionTargetEp = sessionStorage.getItem("al_target_ep");
  let targetTime = null;

  if (sessionTime) {
    const parsedTime = parseInt(sessionTime, 10);
    const parsedEp = sessionTargetEp ? parseInt(sessionTargetEp, 10) : null;
    if (!parsedEp || parsedEp === activeEp) {
      targetTime = parsedTime;
    }
  }

  if (!targetTime && currentMedia) {
    const resume = Resume.extract(currentMedia?.mediaListEntry?.notes) || Resume.getLocal(currentMedia?.id);
    if (resume && resume.ep === activeEp && resume.time > 15 && resume.percent < 88) {
      targetTime = resume.time;
    }
  }

  if (targetTime && targetTime > 0) {
    pendingResumeTarget = targetTime;
    pendingResumeEp = activeEp;
  } else if (force) {
    pendingResumeTarget = null;
    pendingResumeEp = null;
  }
}

function dispatchResumeSeek(targetWindow = null) {
  if (!pendingResumeTarget || !Settings.get().autoResume) return;

  const payload = { type: "AL_RESUME_SEEK", target: pendingResumeTarget };

  if (targetWindow) {
    try {
      targetWindow.postMessage(payload, "*");
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
  if (!currentMedia || isHome()) return;
  const activeEp = provider?.getActiveEpisode?.() || 1;
  const settings = Settings.get();
  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // 1. Fast local cache update
  if (currentTime > 10 && percent < 92) {
    Resume.setLocal(currentMedia.id, {
      ep: activeEp,
      time: Math.round(currentTime),
      duration: Math.round(duration),
      percent: Math.round(percent)
    });
  }

  // 2. Trigger: On Video Start (Play) mode
  if (
    settings.autoTrack &&
    settings.trackTrigger === "play" &&
    !isPaused &&
    currentTime > 3 &&
    !hasTriggeredPlayTrack &&
    activeEp > trackedProgress &&
    !cancelledEps.has(activeEp)
  ) {
    hasTriggeredPlayTrack = true;
    App.setProgress(activeEp);
    return;
  }

  // 3. Trigger: Video Completion (>= 85% or isEnded)
  const threshold = settings.completionThreshold || 85;
  if (
    settings.autoTrack &&
    settings.trackTrigger === "completion" &&
    (percent >= threshold || isEnded) &&
    activeEp > trackedProgress &&
    !cancelledEps.has(activeEp)
  ) {
    cancelledEps.add(activeEp);
    Resume.clearLocal(currentMedia.id);
    App.setProgress(activeEp);
    return;
  }

  // 4. Cloud Sync to AniList notes (throttled)
  if (settings.crossDeviceSync && currentUser?.id && currentTime > 15 && percent < 85) {
    const now = Date.now();
    const timeDiff = Math.abs(currentTime - lastSyncedResumeTime);
    // Sync on pause or every 60 seconds of continuous playback
    const shouldSync = isPaused || (now - lastNotesSyncTime >= 60000 && timeDiff >= 15);

    if (shouldSync) {
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
  hasDispatchedResumeThisEp = false;

  const info = provider?.getAnimeInfo() || {};
  const malId = currentMedia?.idMal || info.malId;
  if (malId) {
    checkSkipIntro(malId, newActiveEp);
  }

  prepareResumeTarget(true);
  if (pendingResumeTarget) {
    hasDispatchedResumeThisEp = true;
    dispatchResumeSeek();
  }

  const settings = Settings.get();

  if (
    settings.autoTrack &&
    settings.trackTrigger === "delay" &&
    currentMedia &&
    newActiveEp > trackedProgress &&
    !cancelledEps.has(newActiveEp)
  ) {
    if (settings.delay === 0) {
      App.setProgress(newActiveEp);
      return;
    }

    autoTrackState.isActive = true;
    autoTrackState.targetEp = newActiveEp;
    autoTrackState.countdown = settings.delay;
    App.render();

    countdownInterval = setInterval(() => {
      autoTrackState.countdown -= 1;
      if (autoTrackState.countdown <= 0) {
        clearInterval(countdownInterval);
      }
      App.render();
    }, 1000);

    autoTrackTimer = setTimeout(() => {
      cancelAutoTrack();
      App.setProgress(newActiveEp);
    }, settings.delay * 1000);
  } else {
    App.render();
  }
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
      const isAhead = buddyProgress > myProgress;
      const media = entry.media || {};
      const title = media.title?.english || media.title?.romaji || "Untitled";

      notifs.push({
        mediaId: entry.mediaId,
        buddy: buddyName,
        avatar: Buddy.getAvatar(buddyName) || "https://anilist.co/img/icons/icon.svg",
        buddyEp: buddyProgress,
        myEp: myProgress,
        isAhead,
        isBuddyCompleted: !!isBuddyCompleted,
        canSync: isAhead || (isBuddyCompleted && entry.status !== "COMPLETED"),
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
    onSyncEntry: async (mediaId, ep, isCompleted = false) => {
      await App.setProgress(ep, mediaId, isCompleted ? "COMPLETED" : null);
      await loadHomeWatching();
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

  async setProgress(newProgress, targetMediaId = null, overrideStatus = null) {
    const id = targetMediaId || currentMedia?.id;
    if (!id) return;
    const isSinglePage = !targetMediaId && currentMedia;
    const homeEntry = targetMediaId ? homeEntries?.find((e) => e.mediaId === targetMediaId || e.media?.id === targetMediaId) : null;
    const entry = isSinglePage ? currentMedia.mediaListEntry : (homeEntry || null);
    const totalEp = isSinglePage ? currentMedia.episodes : (homeEntry?.media?.episodes || 0);

    const isReset = newProgress === 0;
    const isCompleted = overrideStatus === "COMPLETED" || (totalEp > 0 && newProgress >= totalEp);
    const prevStatus = entry?.status;
    const isRewatching = prevStatus === "REPEATING";

    let targetStatus;
    if (isCompleted) {
      targetStatus = "COMPLETED";
    } else if (isReset) {
      targetStatus = (prevStatus === "COMPLETED" || isRewatching) ? "REPEATING" : "CURRENT";
    } else {
      targetStatus = (prevStatus === "COMPLETED" || isRewatching) ? "REPEATING" : "CURRENT";
    }

    const params = {
      mediaId: id,
      progress: newProgress,
      status: targetStatus
    };

    if (!entry?.startedAt?.year) {
      params.startedAt = getTodayDate();
    }

    if (isCompleted) {
      if (!entry?.completedAt?.year) {
        params.completedAt = getTodayDate();
      }
      if (isRewatching) {
        params.repeat = (entry?.repeat || 0) + 1;
      }
    }

    if (entry?.notes && entry.notes.includes("[resume:")) {
      const cleared = Resume.clear(entry.notes);
      params.notes = cleared;
      if (entry) entry.notes = cleared;
    }
    Resume.clearLocal(id);

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

  render() {
    const hasToken = !!Storage.get("anilist_token");
    const activeEp = provider?.getActiveEpisode?.() || 0;

    renderNav(currentUser, {
      onLogin: openAuth,
      onLogout: () => App.logout(),
      onChangeToken: openAuth
    }, provider);

    if (isHome()) {
      renderHome();
      return;
    }

    renderActions(currentMedia, hasToken, {
      onConnect: openAuth,
      onAdd: () => App.setProgress(activeEp || 1),
      onResetProgress: () => App.setProgress(0),
      onBuddySync: (ep, isCompleted) => App.setProgress(ep, null, isCompleted ? "COMPLETED" : null),
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
      onScoreChange: async (score) => {
        if (await AniListAPI.saveEntry({ mediaId: currentMedia.id, score })) {
          showToast(score ? `Score: ${score}/10` : "Score removed");
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
      onRewind: (rewindTarget, currentActiveEp) => {
        cancelAutoTrack();
        if (currentActiveEp) cancelledEps.add(currentActiveEp);
        App.setProgress(rewindTarget);
      }
    }, {
      isLoading: isMediaLoading,
      viewer: currentUser,
      defaultBuddy: Settings.get().defaultBuddy,
      buddyData: currentBuddyData,
      provider,
      activeEp,
      trackedProgress,
      autoTrackState
    });

    provider?.highlightEpisodes(trackedProgress);
    renderCrossSwitch({ media: currentMedia, activeEp, provider });
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
          isCompleted: !!isBuddyCompleted
        };
      } else {
        currentBuddyData = null;
      }

      if (!isHome()) {
        if (provider?.name === "AnimeUnity") {
          autoSelectTargetEpisode(currentMedia, trackedProgress);
        }
        const ep = provider?.getActiveEpisode?.() || 1;
        const malId = currentMedia?.idMal || info.malId;
        if (malId) {
          checkSkipIntro(malId, ep);
        }
        if (!hasDispatchedResumeThisEp) {
          prepareResumeTarget();
          if (pendingResumeTarget) {
            hasDispatchedResumeThisEp = true;
            dispatchResumeSeek();
          }
        }
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
      if (e.data?.type === "AL_PLAYBACK_STATE") {
        handlePlaybackState(e.data);
      } else if (e.data?.type === "AL_PLAYER_READY" || e.data?.type === "AU_FRAME_READY") {
        if (!hasDispatchedResumeThisEp) {
          if (!pendingResumeTarget) {
            prepareResumeTarget();
          }
          if (pendingResumeTarget) {
            hasDispatchedResumeThisEp = true;
            dispatchResumeSeek(e.source);
          }
        }
      } else if (e.data?.type === "AL_RESUME_CONFIRMED") {
        hasDispatchedResumeThisEp = true;
        const activeEp = pendingResumeEp || provider?.getActiveEpisode?.() || 1;
        const resumeTime = e.data.time || pendingResumeTarget;
        pendingResumeTarget = null;
        pendingResumeEp = null;
        sessionStorage.removeItem("al_resume_time");
        sessionStorage.removeItem("al_target_ep");
        if (resumeTime) {
          showToast(`↺ Resumed Ep. ${activeEp} at ${Resume.formatTime(resumeTime)}`, false, 2500);
        }
      }
    });

    const handlePageExit = () => {
      if (currentMedia && currentUser?.id) {
        const local = Resume.getLocal(currentMedia.id);
        if (local && local.time > 15 && local.percent < 85) {
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
      }

      const hasNav = document.getElementById("al-nav-desktop");
      const hasBar = document.getElementById("al-control-bar");
      if (!hasNav || (!isHome() && !hasBar)) {
        App.render();
      }
    }, 700);
  }
};

const isPlayerFrame = window.location.hostname.includes("vixcloud") || window.location.hostname.includes("saturncdn");

if (isPlayerFrame) {
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
