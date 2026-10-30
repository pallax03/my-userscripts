import { BaseProvider, cleanTitle, generateSearchCandidates, extractSeason, scoreSearchResult } from "./base.js";
import { Storage } from "../../shared/storage.js";
import { getAnimeMetadata, getAnimeKey } from "../../shared/animeunity/metadata.js";
import { getActiveEpisode } from "../components/episodes.js";

export class AnimeUnityProvider extends BaseProvider {
  constructor() {
    super("AnimeUnity");
  }

  isHome() {
    const p = window.location.pathname;
    return p === "/" || p === "/home" || p === "";
  }

  isAnimePage() {
    return /\/anime\/\d+/i.test(window.location.pathname);
  }

  isWatchPage() {
    return /\/anime\/\d+[^/]*\/\d+/i.test(window.location.pathname);
  }

  getAnimeInfo() {
    const { malId, anilistId, title: metaTitle } = getAnimeMetadata();
    const domTitleEl = document.querySelector("#anime .title, h1.title");
    const domTitle = domTitleEl?.innerText?.trim() || "";

    const title = metaTitle || domTitle;
    const currentEp = this.getActiveEpisode();

    const epElements = document.querySelectorAll(".episode-wrapper .episode-item");
    const totalEp = epElements.length || null;

    return {
      title,
      romajiTitle: title,
      anilistId,
      malId,
      currentEp,
      totalEp
    };
  }

  getActiveEpisode() {
    return getActiveEpisode();
  }

  getShelfAnchor() {
    const barLink = document.querySelector("#home .bar-link");
    const topBarRow = barLink?.closest(".row");
    if (topBarRow) return { element: topBarRow, position: "after" };

    const ultimiEpisodi = document.querySelector("#ultimi-episodi");
    const ultimiRow = ultimiEpisodi?.closest(".row");
    if (ultimiRow) return { element: ultimiRow, position: "before" };

    const container = document.querySelector("#home > .container, .container");
    if (container) return { element: container, position: "prepend" };

    return null;
  }

  getNavAnchor() {
    return {
      desktop: document.getElementById("left-nav") || document.querySelector("nav.navbar .navbar-nav, .nav-left"),
      mobile: document.querySelector(".nav-top-mobile")
    };
  }

  getActionsAnchor() {
    const epWrapper = document.querySelector(".episode-wrapper");
    if (epWrapper) return { element: epWrapper, position: "before" };
    const overview = document.querySelector(".overview, .content .overview");
    if (overview) return { element: overview, position: "append" };
    return null;
  }

  getVideoBottomAnchor() {
    return document.getElementById("video-bottom");
  }

  highlightEpisodes(trackedProgress) {
    if (trackedProgress === undefined || trackedProgress === null) return;
    const items = document.querySelectorAll(".episode-wrapper .episode-item");
    const activeEp = this.getActiveEpisode();

    items.forEach((item) => {
      const epNum = parseInt(item.innerText.trim(), 10);
      if (isNaN(epNum)) return;

      const isDone = epNum <= trackedProgress;
      const isCurrent = epNum === activeEp;

      item.classList.toggle("al-done", isDone);
      item.classList.toggle("al-current", isCurrent);
    });
  }

  async resolveTargetUrl(media, targetEp = 1) {
    if (!media?.id) return null;

    const pref = Storage.get("al_pref_language") || "sub";
    const prefDubInt = pref === "dub" ? 1 : 0;

    const rawMap = Storage.get("al_au_map");
    const map = (rawMap && typeof rawMap === "object" && !Array.isArray(rawMap)) ? rawMap : {};
    const cached = map[media.id];

    if (cached?.id && cached?.slug) {
      const mediaSeason = extractSeason(media.title?.romaji || media.title?.english || media.title?.userPreferred || "");
      const cachedSeason = cached.title ? extractSeason(cached.title) : null;
      const seasonMatches = cachedSeason === null || cachedSeason === mediaSeason;

      if (seasonMatches && (cached.dub === undefined || cached.dub === prefDubInt || cached.hasAlternativeDub === false)) {
        return `/anime/${cached.id}-${cached.slug}?ep=${targetEp}`;
      }
    }

    const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
    const candidates = generateSearchCandidates(media);

    for (const query of candidates) {
      try {
        const res = await fetch("/livesearch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrf || "",
            "X-Requested-With": "XMLHttpRequest"
          },
          body: JSON.stringify({ title: query })
        });

        if (!res.ok) continue;
        const data = await res.json();
        const records = data?.records || [];
        if (!records.length) continue;

        const matches = records.filter((r) => r.anilist_id === media.id);
        let chosen = null;
        if (matches.length > 0) {
          chosen = matches.find((r) => (r.dub === 1) === (prefDubInt === 1)) || matches[0];
        } else {
          const scored = records
            .map((r) => ({ record: r, score: scoreSearchResult(r, media, prefDubInt === 1) }))
            .sort((a, b) => b.score - a.score);
          if (scored[0] && scored[0].score >= 50) {
            chosen = scored[0].record;
          }
        }

        if (chosen?.id && chosen?.slug) {
          map[media.id] = {
            id: chosen.id,
            slug: chosen.slug,
            dub: chosen.dub,
            hasAlternativeDub: records.length > 1,
            title: chosen.title,
            updatedAt: Date.now()
          };
          Storage.set("al_au_map", map);
          return `/anime/${chosen.id}-${chosen.slug}?ep=${targetEp}`;
        }
      } catch (_) {}
    }

    return null;
  }
}
