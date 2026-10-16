export function getActiveEpisode() {
  const activeEl = document.querySelector(".episode-wrapper .episode-item.active");
  if (activeEl) {
    const num = parseInt(activeEl.innerText.trim(), 10);
    if (!isNaN(num) && num > 0) return num;
  }
  return 0;
}

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
