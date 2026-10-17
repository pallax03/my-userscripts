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

/**
 * Automatically activates target episode from URL param (?ep=X) or sessionStorage
 */
export function autoSelectTargetEpisode() {
  const urlParams = new URLSearchParams(window.location.search);
  const targetStr = urlParams.get("ep") || sessionStorage.getItem("al_target_ep");
  if (!targetStr) return;

  const targetEp = parseInt(targetStr, 10);
  if (!targetEp || isNaN(targetEp) || targetEp <= 0) return;

  const items = document.querySelectorAll(".episode-wrapper .episode-item");
  if (!items.length) return;

  for (const item of items) {
    const num = parseInt(item.innerText.trim(), 10);
    if (num === targetEp) {
      if (!item.classList.contains("active")) {
        item.click();
      }
      sessionStorage.removeItem("al_target_ep");
      break;
    }
  }
}
