/**
 * Selectors shared by the AnimeUnity provider and its UI components.
 * The site keeps the episode data in custom elements, but the surrounding
 * markup is changed more often than the data attributes.
 */
export const ANIMEUNITY_SELECTORS = {
  title: "[data-anime-title], .anime-title, #anime h1, #anime .title, h1.title",
  episodeItems: [
    ".episode-wrapper .episode-item",
    "[data-episode-number]",
    "[data-episode]",
    ".episode-list .episode",
    ".episodes-list .episode",
    ".episode-item",
    ".ep-item",
    ".ep-tile"
  ].join(", "),
  episodeActive: [
    ".episode-wrapper .episode-item.active",
    "[data-episode-number].active",
    "[data-episode].active",
    ".episode-item.active",
    ".episode.active",
    ".ep-item.active",
    ".ep-tile.active",
    "[aria-current='true']"
  ].join(", "),
  episodeContainer: ".episode-wrapper, .episode-list, .episodes-list, [data-episodes], section[x-data*='epList']",
  player: "video-player, [data-player], .video-player",
  playerTop: "#video-top, [data-player-header], .player-header",
  playerBottom: "#video-bottom, [data-player-footer], .player-footer"
};

export function getEpisodeItems(root = document) {
  return root.querySelectorAll(ANIMEUNITY_SELECTORS.episodeItems);
}

export function getEpisodeNumber(element) {
  if (!element) return 0;
  const raw = element.dataset?.episodeNumber ||
    element.dataset?.episode ||
    element.getAttribute("data-episode-number") ||
    element.getAttribute("data-episode") ||
    element.getAttribute("aria-label") ||
    element.textContent;
  const match = String(raw || "").match(/\d+/);
  const number = match ? parseInt(match[0], 10) : 0;
  return number > 0 ? number : 0;
}

export function getAnimeId(pathname = window.location.pathname) {
  const match = pathname.match(/\/anime\/(?:[^/]*-)?(\d+)(?:\/|$)/i) ||
    pathname.match(/\/anime\/(\d+)(?:-|\/|$)/i);
  return match ? match[1] : null;
}
