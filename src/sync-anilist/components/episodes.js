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
 * Safe for AnimeUnity Vue hydration without premature URL stripping.
 * @param {Object} [media]
 * @param {number} [trackedProgress]
 * @param {number} [retryCount]
 */
export function autoSelectTargetEpisode(media, trackedProgress, retryCount = 0) {
  const urlParams = new URLSearchParams(window.location.search);
  const targetStr = urlParams.get("ep") || sessionStorage.getItem("al_target_ep");

  let targetEp = 0;
  if (targetStr) {
    targetEp = parseInt(targetStr, 10);
  }

  if (!targetEp || isNaN(targetEp) || targetEp <= 0) return;

  const currentKey = `${window.location.pathname}_ep${targetEp}`;
  if (lastAutoSelectedKey === currentKey && retryCount === 0) return;

  sessionStorage.removeItem("al_target_ep");

  // 1. Check if Vue component on <video-player> is mounted and hydrated
  const player = document.querySelector("video-player");
  const playerVue = player?.__vue__ || document.querySelector(".episode-wrapper")?.__vue__;

  if (playerVue && Array.isArray(playerVue.episodes) && playerVue.episodes.length > 0) {
    const epObj = playerVue.episodes.find((e) => parseInt(e.number, 10) === targetEp);
    if (epObj) {
      lastAutoSelectedKey = currentKey;

      if (Array.isArray(playerVue.episodes_tabs) && playerVue.episodes_tabs.length > 0) {
        const targetTab = playerVue.episodes_tabs.find((tab) =>
          tab.episodes?.some((e) => e.id === epObj.id)
        );
        if (targetTab && playerVue.episode_tab !== targetTab && typeof playerVue.switchTab === "function") {
          playerVue.switchTab(targetTab);
        }
      }

      if (typeof playerVue.switchEpisode === "function") {
        const curEpNum = parseInt(playerVue.episode?.number, 10);
        if (curEpNum !== targetEp) {
          playerVue.switchEpisode(epObj);
        }
      }

      // Smooth scroll wrapper to center active item
      setTimeout(() => {
        const activeItem = document.querySelector(".episode-wrapper .episode-item.active");
        const wrapper = activeItem?.closest(".episode-wrapper");
        if (activeItem && wrapper && wrapper.scrollWidth > wrapper.clientWidth) {
          wrapper.scrollTo({
            left: activeItem.offsetLeft - wrapper.clientWidth / 2 + activeItem.clientWidth / 2,
            behavior: "smooth"
          });
        }
      }, 100);

      return;
    }
  }

  // If Vue is still bootstrapping, retry up to 10 times (1.5s total) without clicking
  if (retryCount < 10) {
    setTimeout(() => {
      autoSelectTargetEpisode(media, trackedProgress, retryCount + 1);
    }, 150);
    return;
  }

  // 2. DOM fallback only if Vue is completely unavailable after all retries
  lastAutoSelectedKey = currentKey;
  const items = document.querySelectorAll(".episode-wrapper .episode-item");
  if (items.length > 0) {
    for (const item of items) {
      const num = parseInt(item.innerText.trim(), 10);
      if (num === targetEp) {
        if (!item.classList.contains("active")) {
          const clickEl = item.querySelector("a") || item;
          clickEl.click();
        }
        const wrapper = item.closest(".episode-wrapper");
        if (wrapper && wrapper.scrollWidth > wrapper.clientWidth) {
          wrapper.scrollTo({
            left: item.offsetLeft - wrapper.clientWidth / 2 + item.clientWidth / 2,
            behavior: "smooth"
          });
        }
        break;
      }
    }
  }
}
