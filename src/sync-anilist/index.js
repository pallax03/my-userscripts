import "./styles.scss";
import { Storage } from "../shared/storage.js";
import { showToast } from "../shared/toast.js";
import { Logger } from "../shared/logger.js";
import { AniListAPI } from "../shared/anilist/api.js";
import { handleUrlToken, getTodayDate, openTokenModal } from "../shared/anilist/auth.js";
import { scanAnimeUnityPageMap } from "../shared/animeunity/utils.js";
import { extractPageMetadata, cleanTitle } from "./resolver.js";
import { Settings } from "./settings.js";
import { renderNav } from "./components/nav.js";
import { renderActions } from "./components/actions.js";
import { renderVideoBottom } from "./components/video-bottom.js";
import { highlightEpisodes, getActiveEpisode, autoSelectTargetEpisode } from "./components/episodes.js";
import { renderWatchingShelf } from "./components/watching-shelf.js";
import { Buddy } from "./buddy.js";
import { getAnimeUnityUrl } from "../shared/animeunity/utils.js";
import { iconHtml, Play } from "../shared/icons.js";
import { getAnimeMetadata } from "../shared/animeunity/metadata.js";
import { checkSkipIntro, initSkipIntroTop } from "./components/skip-intro.js";
import { initPlayer } from "./player.js";

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
  preventRewind: true
};
const cancelledEps = new Set();

const isHome = () => {
  const p = window.location.pathname;
  return p === "/" || p === "/home" || p === "";
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

function handleActiveEpisodeChange(newActiveEp) {
  if (!newActiveEp || newActiveEp === lastActiveEp) return;
  lastActiveEp = newActiveEp;
  cancelAutoTrack();

  const malId = currentMedia?.idMal || getAnimeMetadata(undefined, {
    onResolved: (m) => { if (m?.malId) checkSkipIntro(m.malId, newActiveEp); }
  }).malId;
  if (malId) {
    checkSkipIntro(malId, newActiveEp);
  }

  const settings = Settings.get();
  autoTrackState.preventRewind = settings.preventRewind;

  if (
    settings.autoTrack &&
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

async function findMediaByTitle(title) {
  if (!title) return null;
  const cleaned = cleanTitle(title);
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

  const shelfRow = document.createElement("div");
  shelfRow.className = "row al-home-shelf-row";
  const shelfCol = document.createElement("div");
  shelfCol.className = "col-12";
  shelfCol.appendChild(shelfElement);
  shelfRow.appendChild(shelfCol);

  const barLink = document.querySelector("#home .bar-link");
  const topBarRow = barLink?.closest(".row");
  if (topBarRow) {
    topBarRow.after(shelfRow);
    return;
  }

  const ultimiEpisodi = document.querySelector("#ultimi-episodi");
  const ultimiRow = ultimiEpisodi?.closest(".row");
  if (ultimiRow) {
    ultimiRow.before(shelfRow);
    return;
  }

  const container = document.querySelector("#home > .container, .container");
  if (container) {
    container.prepend(shelfRow);
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
      const auUrl = getAnimeUnityUrl(media, { targetEp: buddyProgress || myProgress || 1 });

      notifs.push({
        mediaId: entry.mediaId,
        buddy: buddyName,
        avatar: Buddy.getAvatar(buddyName) || "https://anilist.co/img/icons/icon.svg",
        buddyEp: buddyProgress,
        myEp: myProgress,
        isAhead,
        isBuddyCompleted: !!isBuddyCompleted,
        canSync: isAhead || (isBuddyCompleted && entry.status !== "COMPLETED"),
        title,
        auUrl
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

  const settings = Settings.get();
  if (!settings.homeShelf) {
    const existing = document.getElementById("al-home-continue-watching");
    if (existing) existing.closest(".al-home-shelf-row")?.remove() || existing.remove();
    return;
  }

  const container = document.querySelector("#home .container, .container");
  if (!container) return;

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
      if (prevStatus === "COMPLETED" || isRewatching) {
        targetStatus = "REPEATING";
      } else {
        targetStatus = "CURRENT";
      }
    } else {
      if (prevStatus === "COMPLETED" || isRewatching) {
        targetStatus = "REPEATING";
      } else {
        targetStatus = "CURRENT";
      }
    }

    const params = {
      mediaId: id,
      progress: newProgress,
      status: targetStatus
    };

    // Auto-fill dates: preserve if already present, set today if missing
    if (!entry?.startedAt?.year) {
      params.startedAt = getTodayDate();
    }

    if (isCompleted) {
      if (!entry?.completedAt?.year) {
        params.completedAt = getTodayDate();
      }
      // If user was rewatching and reached completion, increment repeat count
      if (isRewatching) {
        params.repeat = (entry?.repeat || 0) + 1;
      }
    }

    const res = await AniListAPI.saveEntry(params);
    if (res?.SaveMediaListEntry) {
      cancelledEps.delete(newProgress);
      const toastMsg = isReset
        ? `Progress reset to Ep. 0 (${AniListAPI.statuses[targetStatus] || targetStatus})`
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
    const openAuth = () => openTokenModal(async () => {
      await App.loadUser();
      if (isHome()) await loadHomeWatching();
      else App.sync();
    });
    const hasToken = !!Storage.get("anilist_token");
    const activeEp = getActiveEpisode();

    renderNav(currentUser, {
      onLogin: openAuth,
      onLogout: () => App.logout(),
      onChangeToken: openAuth
    });

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
          if (!entry?.completedAt?.year) {
            params.completedAt = getTodayDate();
          }
          if (!entry?.startedAt?.year) {
            params.startedAt = getTodayDate();
          }
          if (entry?.status === "REPEATING") {
            params.repeat = (entry.repeat || 0) + 1;
          }
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
      }
    }, {
      isLoading: isMediaLoading,
      viewer: currentUser,
      defaultBuddy: Settings.get().defaultBuddy,
      buddyData: currentBuddyData
    });

    renderVideoBottom({
      activeEp,
      trackedProgress,
      total: currentMedia?.episodes || 0,
      hasToken,
      autoTrackState,
      isLoading: isMediaLoading,
      callbacks: {
        onSave: (ep) => {
          cancelAutoTrack();
          App.setProgress(ep);
        },
        onCancel: () => {
          if (autoTrackState.targetEp) cancelledEps.add(autoTrackState.targetEp);
          cancelAutoTrack();
          App.render();
        },
        onForce: (ep) => {
          cancelAutoTrack();
          App.setProgress(ep);
        },
        onReset: () => {
          cancelAutoTrack();
          App.setProgress(0);
        }
      }
    });

    highlightEpisodes(trackedProgress);
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

      const meta = extractPageMetadata();
      if (meta.anilistId) {
        currentMedia = (await AniListAPI.getMediaById(meta.anilistId))?.Media || null;
      }
      // Only search by title if no exact AniList ID exists on the page
      if (!currentMedia && !meta.anilistId && meta.romajiTitle) {
        currentMedia = await findMediaByTitle(meta.romajiTitle);
      }
      if (!currentMedia && !meta.anilistId && currentTitle) {
        currentMedia = await findMediaByTitle(currentTitle);
      }

      // Auto-learn: cache direct AnimeUnity ID and slug for this AniList media
      if (currentMedia?.id) {
        const match = window.location.pathname.match(/\/anime\/(\d+)(?:-([^\/]+))?/i);
        if (match && match[1]) {
          const rawMap = Storage.get("al_au_map");
          const map = (rawMap && typeof rawMap === "object" && !Array.isArray(rawMap)) ? rawMap : {};
          map[currentMedia.id] = {
            id: parseInt(match[1], 10),
            slug: match[2] || "",
            updatedAt: Date.now()
          };
          Storage.set("al_au_map", map);
          Logger.info(`Auto-learned mapping: AniList ${currentMedia.id} -> AU /anime/${match[1]}-${match[2]}`);
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
        const ep = getActiveEpisode() || 1;
        const malId = currentMedia?.idMal || getAnimeMetadata(undefined, {
          onResolved: (m) => { if (m?.malId) checkSkipIntro(m.malId, ep); }
        }).malId;
        if (malId) {
          checkSkipIntro(malId, ep);
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

    Settings.subscribe((settings) => {
      autoTrackState.preventRewind = settings.preventRewind;
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

      const epItem = e.target.closest(".episode-wrapper .episode-item");
      if (epItem) {
        setTimeout(() => {
          const ep = getActiveEpisode();
          if (ep) handleActiveEpisodeChange(ep);
        }, 80);
      }

      if (e.target.closest("#video-bottom a.prev, #video-bottom a.next")) {
        setTimeout(() => {
          const ep = getActiveEpisode();
          if (ep) handleActiveEpisodeChange(ep);
        }, 150);
      }
    });

    setInterval(() => {
      scanAnimeUnityPageMap();

      if (isHome()) {
        if (currentUser?.id && homeEntries === null && !homeFetching) {
          loadHomeWatching();
        } else if (!document.getElementById("al-home-continue-watching")) {
          renderHome();
        }
      } else {
        const shelf = document.getElementById("al-home-continue-watching");
        if (shelf) shelf.closest(".al-home-shelf-row")?.remove() || shelf.remove();

        const titleEl = document.querySelector("#anime .title, h1.title");
        if (titleEl && titleEl.innerText.trim() !== currentTitle) {
          currentTitle = titleEl.innerText.trim();
          App.sync();
        }

        const ep = getActiveEpisode();
        if (ep && ep !== lastActiveEp) {
          handleActiveEpisodeChange(ep);
        }

        highlightEpisodes(trackedProgress);
      }

      if (!isHome()) {
        const needsVideoBottom = document.getElementById("video-bottom") && !document.getElementById("al-video-bottom-widget");
        if (!document.getElementById("al-nav-desktop") || needsVideoBottom) {
          App.render();
        }
      } else {
        if (!document.getElementById("al-nav-desktop")) {
          App.render();
        }
      }
    }, 600);
  }
};

if (window.location.hostname.includes("vixcloud")) {
  initPlayer();
} else {
  currentUser = Buddy.getViewer();
  handleUrlToken();
  App.init();
}

