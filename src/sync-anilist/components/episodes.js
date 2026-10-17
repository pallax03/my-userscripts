/**
 * Retrieves the currently active episode number
 * Checks both the DOM active element and the video-player custom element attribute
 * @returns {number}
 */
export function getActiveEpisode() {
  const activeEl = document.querySelector(".episode-wrapper .episode-item.active, .episode-item.active");
  if (activeEl) {
    const num = parseInt(activeEl.innerText.trim(), 10);
    if (!isNaN(num) && num > 0) return num;
  }

  try {
    const player = document.querySelector("video-player");
    const epAttr = player?.getAttribute("episode");
    if (epAttr) {
      const parsed = JSON.parse(epAttr);
      const num = parseInt(parsed?.number, 10);
      if (!isNaN(num) && num > 0) return num;
    }
  } catch (_) {}

  return 0;
}

/**
 * Highlights watched and currently tracked episodes in the episode grid
 * @param {number} trackedProgress
 */
export function highlightEpisodes(trackedProgress) {
  const items = document.querySelectorAll(".episode-wrapper .episode-item");
  if (!items.length) return;

  items.forEach((el) => {
    const num = parseInt(el.innerText.trim(), 10);
    if (isNaN(num)) return;
    const isTracked = trackedProgress > 0 && num === trackedProgress;
    const isDone = trackedProgress > 0 && num < trackedProgress;
    el.classList.toggle("al-tracked", isTracked);
    el.classList.toggle("al-done", isDone);
  });
}

let lastAutoSelectedKey = "";

/**
 * Automatically activates target episode from URL param (?ep=X), sessionStorage,
 * or defaults to current AniList progress.
 * @param {Object} [media]
 * @param {number} [trackedProgress]
 */
export function autoSelectTargetEpisode(media, trackedProgress) {
  const urlParams = new URLSearchParams(window.location.search);
  const targetStr = urlParams.get("ep") || sessionStorage.getItem("al_target_ep");

  let targetEp = 0;
  if (targetStr) {
    targetEp = parseInt(targetStr, 10);
  } else if (trackedProgress && trackedProgress > 0) {
    targetEp = trackedProgress;
  }

  if (!targetEp || isNaN(targetEp) || targetEp <= 0) return;

  const currentKey = `${window.location.pathname}_ep${targetEp}`;
  if (lastAutoSelectedKey === currentKey) return;

  let switched = false;

  // 1. Try native Vue component switch on <video-player>
  const player = document.querySelector("video-player");
  const playerVue = player?.__vue__ || document.querySelector(".episode-wrapper")?.__vue__;

  if (playerVue && Array.isArray(playerVue.episodes) && playerVue.episodes.length > 0) {
    const epObj = playerVue.episodes.find((e) => parseInt(e.number, 10) === targetEp);
    if (epObj) {
      if (Array.isArray(playerVue.episodes_tabs) && playerVue.episodes_tabs.length > 0) {
        const targetTab = playerVue.episodes_tabs.find((tab) =>
          tab.episodes?.some((e) => e.id === epObj.id)
        );
        if (targetTab && playerVue.episode_tab !== targetTab && typeof playerVue.switchTab === "function") {
          playerVue.switchTab(targetTab);
        }
      }

      if (typeof playerVue.switchEpisode === "function") {
        playerVue.switchEpisode(epObj);
        switched = true;
      }
    }
  }

  // 2. DOM fallback / selector active sync & scroll
  const items = document.querySelectorAll(".episode-wrapper .episode-item");
  if (items.length > 0) {
    for (const item of items) {
      const num = parseInt(item.innerText.trim(), 10);
      if (num === targetEp) {
        if (!switched && !item.classList.contains("active")) {
          const clickEl = item.querySelector("a") || item;
          clickEl.click();
          switched = true;
        }
        try {
          item.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
        } catch (_) {}
        break;
      }
    }
  }

  if (switched) {
    lastAutoSelectedKey = currentKey;
    sessionStorage.removeItem("al_target_ep");
    if (urlParams.has("ep")) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("ep");
      window.history.replaceState({}, document.title, cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : ""));
    }
  }
}
