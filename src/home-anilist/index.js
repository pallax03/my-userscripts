import "./styles.scss";
import { Storage } from "../shared/storage.js";
import { AniListAPI } from "../shared/anilist/api.js";
import { handleUrlToken } from "../shared/anilist/auth.js";
import { iconHtml, Play } from "../shared/icons.js";
import { scanAnimeUnityPageMap } from "../shared/animeunity/utils.js";
import { renderWatchingShelf } from "./components/watching-shelf.js";

// Handle OAuth token in URL if present
handleUrlToken();

let viewer = null;
let entries = [];
let isFetching = false;
let hasLoadedOnce = false;

function isHomePage() {
  const p = window.location.pathname;
  return p === "/" || p === "/home" || p === "";
}

function createSkeletonShelf() {
  const shelf = document.createElement("div");
  shelf.id = "al-home-continue-watching";
  shelf.className = "al-home-shelf";
  shelf.innerHTML = `
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
        <div class="al-shelf-skeleton"></div>
      </div>
    </div>
  `;
  return shelf;
}

function injectShelf(shelfElement) {
  const existing = document.getElementById("al-home-continue-watching");
  if (existing) {
    if (existing !== shelfElement) {
      existing.replaceWith(shelfElement);
    }
    return;
  }

  const shelfRow = document.createElement("div");
  shelfRow.className = "row al-home-shelf-row";
  const shelfCol = document.createElement("div");
  shelfCol.className = "col-12";
  shelfCol.appendChild(shelfElement);
  shelfRow.appendChild(shelfCol);

  // 1. Preferred insertion: immediately after the top bar row
  const barLink = document.querySelector("#home .bar-link");
  const topBarRow = barLink?.closest(".row");
  if (topBarRow) {
    topBarRow.after(shelfRow);
    return;
  }

  // 2. Fallback: immediately before #ultimi-episodi row
  const ultimiEpisodi = document.querySelector("#ultimi-episodi");
  const ultimiRow = ultimiEpisodi?.closest(".row");
  if (ultimiRow) {
    ultimiRow.before(shelfRow);
    return;
  }

  // 3. Fallback: prepend to container
  const container = document.querySelector("#home > .container") || document.querySelector(".container");
  if (container) {
    container.prepend(shelfRow);
  }
}

async function loadData() {
  if (isFetching) return;
  isFetching = true;

  const token = Storage.get("anilist_token");
  if (!token) {
    viewer = null;
    entries = [];
    hasLoadedOnce = true;
    isFetching = false;
    render();
    return;
  }

  try {
    const viewerData = await AniListAPI.getViewer(() => {
      viewer = null;
      entries = [];
    });
    viewer = viewerData?.Viewer || null;

    if (viewer?.id) {
      const collectionData = await AniListAPI.getUserWatching(viewer.id);
      const lists = collectionData?.MediaListCollection?.lists || [];
      entries = lists.flatMap((l) => l.entries || []);
    } else {
      entries = [];
    }
  } catch (err) {
    console.error("[home-anilist] Error fetching watching list:", err);
  } finally {
    isFetching = false;
    hasLoadedOnce = true;
    render();
  }
}

function render() {
  if (!isHomePage()) {
    const existing = document.getElementById("al-home-continue-watching");
    if (existing) {
      existing.closest(".al-home-shelf-row")?.remove() || existing.remove();
    }
    return;
  }

  // If container not ready in DOM yet, do not inject
  const container = document.querySelector("#home .container, .container");
  if (!container) return;

  if (!hasLoadedOnce && isFetching) {
    if (!document.getElementById("al-home-continue-watching")) {
      injectShelf(createSkeletonShelf());
    }
    return;
  }

  const shelf = renderWatchingShelf({ entries, viewer });
  injectShelf(shelf);
}

function init() {
  // Harvest anime mappings from current page layout-items
  scanAnimeUnityPageMap();

  if (isHomePage()) {
    injectShelf(createSkeletonShelf());
    loadData();
  }

  // Periodic check to ensure shelf stays mounted across Vue route changes
  setInterval(() => {
    if (isHomePage()) {
      scanAnimeUnityPageMap();
      if (!document.getElementById("al-home-continue-watching")) {
        if (!hasLoadedOnce && !isFetching) {
          loadData();
        } else {
          render();
        }
      }
    } else {
      const existing = document.getElementById("al-home-continue-watching");
      if (existing) {
        existing.closest(".al-home-shelf-row")?.remove() || existing.remove();
      }
    }
  }, 800);
}

init();
