import { getEpisodesList } from "./metadata.js";

/**
 * Resolves the currently active episode number on AnimeUnity.
 * Prioritizes the live reactive DOM header, URL episode ID mapping, and active item classes.
 * @returns {number}
 */
export function getCurrentEpisode() {
  // 1. Live player header (#video-top .title: "Episodio 4")
  const topTitle = document.querySelector("#video-top .title, #video-top span");
  if (topTitle) {
    const m = topTitle.textContent.match(/\d+/);
    if (m) {
      const num = parseInt(m[0], 10);
      if (!isNaN(num) && num > 0) return num;
    }
  }

  // 2. Map episode ID in URL path (/anime/<slug>/<epId>)
  const pathMatch = window.location.pathname.match(/\/anime\/[^/]+\/(\d+)/);
  if (pathMatch && pathMatch[1]) {
    const epId = parseInt(pathMatch[1], 10);
    const list = getEpisodesList();
    const matched = list.find((e) => e.id === epId);
    if (matched?.number) {
      const num = parseInt(matched.number, 10);
      if (!isNaN(num) && num > 0) return num;
    }
  }

  // 3. Active element in episode list (.episode-wrapper .episode-item.active)
  const activeItem = document.querySelector(".episode-wrapper .episode-item.active, .episode-item.active");
  if (activeItem) {
    const m = activeItem.textContent.match(/\d+/);
    if (m) {
      const num = parseInt(m[0], 10);
      if (!isNaN(num) && num > 0) return num;
    }
  }

  // 4. Initial server-rendered attribute fallback
  try {
    const player = document.querySelector("video-player");
    const epAttr = player?.getAttribute("episode");
    if (epAttr) {
      const parsed = JSON.parse(epAttr);
      const num = parseInt(parsed?.number, 10);
      if (!isNaN(num) && num > 0) return num;
    }
  } catch (_) {}

  return 1;
}
