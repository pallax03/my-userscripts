import "./styles.scss";
import { Storage } from "../shared/storage.js";
import { showToast } from "../shared/toast.js";
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
import { iconHtml, Play } from "../shared/icons.js";

handleUrlToken();

let currentUser = null;
let currentMedia = null;
let currentTitle = "";
let trackedProgress = -1;
let lastActiveEp = 0;

let homeEntries = null;
let homeFetching = false;

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

async function loadHomeWatching() {
  if (homeFetching) return;
  homeFetching = true;

  if (!currentUser?.id) {
    homeEntries = [];
    homeFetching = false;
    renderHome();
    return;
  }

  try {
    const data = await AniListAPI.getUserWatching(currentUser.id);
    const lists = data?.MediaListCollection?.lists || [];
    homeEntries = lists.flatMap((l) => l.entries || []);
  } catch (err) {
    console.warn("[sync-anilist] Error loading watching collection:", err);
    homeEntries = [];
  } finally {
    homeFetching = false;
    renderHome();
  }
}

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
    onRefresh: () => loadHomeWatching()
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
      if (isHome()) loadHomeWatching();
      App.render();
    }
  },

  logout() {
    cancelAutoTrack();
    Storage.del("anilist_token");
    currentUser = null;
    currentMedia = null;
    homeEntries = null;
    trackedProgress = -1;
    lastActiveEp = 0;
    cancelledEps.clear();
    App.render();
    showToast("Disconnected from AniList");
  },

  async setProgress(newProgress) {
    if (!currentMedia) return;
    const entry = currentMedia.mediaListEntry;
    const isCompleted = currentMedia.episodes ? newProgress >= currentMedia.episodes : false;
    const isStarting = !entry || entry.progress === 0;

    const params = {
      mediaId: currentMedia.id,
      progress: newProgress,
      status: isCompleted ? "COMPLETED" : (entry?.status || "CURRENT")
    };

    if (isStarting && !entry?.startedAt?.year) params.startedAt = getTodayDate();
    if (isCompleted) params.completedAt = getTodayDate();

    const res = await AniListAPI.saveEntry(params);
    if (res?.SaveMediaListEntry) {
      cancelledEps.delete(newProgress);
      showToast(isCompleted ? "🎉 Completed on AniList!" : `Episode ${newProgress} saved`);
      App.sync();
    }
  },

  render() {
    const openAuth = () => openTokenModal(async () => { await App.loadUser(); App.sync(); });
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
      onStatusChange: async (status) => {
        if (await AniListAPI.saveEntry({ mediaId: currentMedia.id, status })) {
          showToast(`Status: ${AniListAPI.statuses[status]}`);
          App.sync();
        }
      },
      onScoreChange: async (score) => {
        if (await AniListAPI.saveEntry({ mediaId: currentMedia.id, score })) {
          showToast(score ? `Score: ${score}/10` : "Score removed");
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
    });

    renderVideoBottom({
      activeEp,
      trackedProgress,
      total: currentMedia?.episodes || 0,
      hasToken,
      autoTrackState,
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
      App.render();
      return;
    }

    const meta = extractPageMetadata();
    if (meta.anilistId) {
      currentMedia = (await AniListAPI.getMediaById(meta.anilistId))?.Media || null;
    }
    if (!currentMedia && meta.romajiTitle) {
      currentMedia = await findMediaByTitle(meta.romajiTitle);
    }
    if (!currentMedia && currentTitle) {
      currentMedia = await findMediaByTitle(currentTitle);
    }

    trackedProgress = currentMedia?.mediaListEntry ? currentMedia.mediaListEntry.progress : -1;
    App.render();
  },

  init() {
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

        autoSelectTargetEpisode();
        highlightEpisodes(trackedProgress);
      }

      if (!document.getElementById("al-nav-desktop")) {
        App.render();
      }
    }, 600);
  }
};

App.init();
