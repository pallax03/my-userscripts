import { BaseProvider } from "./base.js";
import { getAnimeMetadata, getCurrentEpisode, getTotalEpisodes, getEpisodeUrl, resolveAnimeUnityAnime } from "../../shared/animeunity/site.js";
import { slot } from "../slots.js";

export class AnimeUnityProvider extends BaseProvider {
  constructor() {
    super("AnimeUnity");
  }

  isHome() {
    return location.pathname === "/";
  }

  isAnimePage() {
    return /^\/anime\/\d+/.test(location.pathname);
  }

  isWatchPage() {
    return /^\/anime\/\d+[^/]*\/\d+/.test(location.pathname) ||
      Boolean(document.querySelector("iframe[src*='vixcloud'], iframe[src*='embed']"));
  }

  getAnimeInfo() {
    const { malId, anilistId, title } = getAnimeMetadata();
    return {
      title,
      romajiTitle: title,
      anilistId,
      malId,
      currentEp: getCurrentEpisode(),
      totalEp: getTotalEpisodes()
    };
  }

  getActiveEpisode() {
    return getCurrentEpisode();
  }

  getShelfAnchor() {
    const container = document.querySelector("#home > .container, .container");
    if (container) return { element: container, position: "prepend" };
    const main = document.querySelector("main");
    return main ? { element: main, position: "prepend" } : null;
  }

  getNavAnchor() {
    return null;
  }

  getActionsAnchor() {
    return { element: slot("actions"), position: "append" };
  }

  getVideoBottomAnchor() {
    return document.getElementById("al-dock-skip-slot");
  }

  async resolveTargetUrl(media, targetEp = 1) {
    const anime = await resolveAnimeUnityAnime(media);
    return anime ? getEpisodeUrl(anime, targetEp) : null;
  }
}
