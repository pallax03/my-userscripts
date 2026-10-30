import { BaseProvider, cleanTitle, generateSearchCandidates, extractSeason, scoreSearchResult } from "./base.js";
import { Storage } from "../../shared/storage.js";

function sanitizeSaturnCache() {
  const rawMap = Storage.get("al_as_map");
  if (!rawMap || typeof rawMap !== "object") return;
  let changed = false;

  // Clean known false-positive matches (Quest Picture Drama mistakenly mapped to Haikyuu main series)
  if (rawMap["107263"]?.slug?.includes("haikyuu") && !rawMap["107263"]?.slug?.includes("quest")) {
    delete rawMap["107263"];
    changed = true;
  }

  // Clean known false-positive matches (Steel Ball Run mistakenly mapped to Stone Ocean)
  if (rawMap["190327"]?.slug?.includes("stone-ocean")) {
    delete rawMap["190327"];
    changed = true;
  }

  if (changed) {
    Storage.set("al_as_map", rawMap);
  }
}

export class AnimeSaturnProvider extends BaseProvider {
  constructor() {
    super("AnimeSaturn");
    sanitizeSaturnCache();
  }

  isHome() {
    const p = window.location.pathname;
    return p === "/" || p === "/home" || p === "";
  }

  isAnimePage() {
    const p = window.location.pathname;
    return p.startsWith("/anime/") && !p.includes("/ep-");
  }

  isWatchPage() {
    const p = window.location.pathname;
    return /\/ep-\d+/i.test(p);
  }

  getActiveEpisode() {
    const m = window.location.pathname.match(/\/ep-(\d+)/i);
    if (m && m[1]) return parseInt(m[1], 10);

    const activeTile = document.querySelector(".ep-tile.is-current");
    if (activeTile) {
      const epNum = parseInt(activeTile.innerText.trim(), 10);
      if (!isNaN(epNum)) return epNum;
    }

    const subText = document.querySelector(".player-card__sub, .ept-sub")?.innerText || "";
    const subMatch = subText.match(/episodio\s+(\d+)/i);
    if (subMatch && subMatch[1]) return parseInt(subMatch[1], 10);

    return null;
  }

  getAnimeInfo() {
    // 1. Title extraction
    const cardTitle = document.querySelector(".player-card__title, .ept-title")?.innerText?.trim();
    const headTitle = document.querySelector(".ag-head h1, h1")?.innerText?.trim();
    const rawTitle = cardTitle || headTitle || "";
    const title = cleanTitle(rawTitle);

    // 2. Alt/Romaji title (scoped inside .ag-head to avoid matching hidden navbar search template)
    const altEl = document.querySelector(".ag-head")?.querySelector("p.text-ink-dim") || document.querySelector(".ept-jtitle");
    let romajiTitle = altEl?.innerText?.trim() || "";
    if (!romajiTitle || romajiTitle.toLowerCase().includes("niente trovato")) {
      romajiTitle = title;
    }

    // 3. AniList ID and MyAnimeList ID extraction
    let anilistId = null;
    let malId = null;

    // Check direct official external links in DOM (present on all AnimeSaturn anime pages)
    const alLink = document.querySelector('a[href*="anilist.co/anime/"]');
    if (alLink) {
      const match = alLink.getAttribute("href")?.match(/anilist\.co\/anime\/(\d+)/i);
      if (match && match[1]) anilistId = parseInt(match[1], 10);
    }

    const malLink = document.querySelector('a[href*="myanimelist.net/anime/"]');
    if (malLink) {
      const match = malLink.getAttribute("href")?.match(/myanimelist\.net\/anime\/(\d+)/i);
      if (match && match[1]) malId = parseInt(match[1], 10);
    }

    // Check dedicated main poster src if present
    if (!anilistId) {
      const mainPoster = document.querySelector(".ag-poster img, .anime-poster-card img");
      if (mainPoster) {
        const src = mainPoster.getAttribute("src") || "";
        const match = src.match(/\/b[x]?(\d+)[-_.]/i);
        if (match && match[1]) {
          anilistId = parseInt(match[1], 10);
        }
      }
    }

    // Fallback: check cached mapping in storage
    const slugMatch = window.location.pathname.match(/\/anime\/([^/]+)/i);
    const currentSlug = slugMatch ? slugMatch[1] : null;
    if ((!anilistId || !malId) && currentSlug) {
      const rawMap = Storage.get("al_as_map");
      const map = (rawMap && typeof rawMap === "object" && !Array.isArray(rawMap)) ? rawMap : {};
      for (const [id, val] of Object.entries(map)) {
        if (val.slug === currentSlug) {
          if (!anilistId) anilistId = parseInt(id, 10);
          if (!malId && val.malId) malId = parseInt(val.malId, 10);
          break;
        }
      }
    }

    // 4. Current & total episodes
    const currentEp = this.getActiveEpisode();
    const epTiles = document.querySelectorAll(".ep-tile");
    let totalEp = epTiles.length || null;

    if (!totalEp) {
      const sub = document.querySelector(".player-card__sub")?.innerText || "";
      const totalMatch = sub.match(/(\d+)\s+episodi/i);
      if (totalMatch && totalMatch[1]) totalEp = parseInt(totalMatch[1], 10);
    }

    return {
      title,
      romajiTitle,
      anilistId,
      malId,
      currentEp,
      totalEp
    };
  }

  /**
   * Fast background metadata fetch for episode watch pages (/ep-X)
   * Fetches the anime base page (/anime/slug) to extract official AniList and MAL IDs
   * @returns {Promise<{ anilistId: number|null, malId: number|null }|null>}
   */
  async fetchRemoteMetadata() {
    const slugMatch = window.location.pathname.match(/\/anime\/([^/]+)/i);
    const currentSlug = slugMatch ? slugMatch[1] : null;
    if (!currentSlug) return null;

    try {
      const res = await fetch(`/anime/${currentSlug}`);
      if (!res.ok) return null;
      const html = await res.text();

      const alMatch = html.match(/anilist\.co\/anime\/(\d+)/i);
      const malMatch = html.match(/myanimelist\.net\/anime\/(\d+)/i);

      const anilistId = alMatch && alMatch[1] ? parseInt(alMatch[1], 10) : null;
      const malId = malMatch && malMatch[1] ? parseInt(malMatch[1], 10) : null;

      if (anilistId) {
        const rawMap = Storage.get("al_as_map");
        const map = (rawMap && typeof rawMap === "object" && !Array.isArray(rawMap)) ? rawMap : {};
        map[anilistId] = {
          slug: currentSlug,
          malId: malId || undefined,
          updatedAt: Date.now()
        };
        Storage.set("al_as_map", map);
      }

      return { anilistId, malId };
    } catch (_) {
      return null;
    }
  }

  getShelfAnchor() {
    const latestSection = document.querySelector("section[data-latest]");
    if (latestSection) return { element: latestSection, position: "before" };

    const heroShell = document.querySelector(".hero-shell")?.closest("section");
    if (heroShell) return { element: heroShell, position: "after" };

    const container = document.querySelector(".container-page, main");
    if (container) return { element: container, position: "prepend" };

    return null;
  }

  getNavAnchor() {
    const headerTools = document.querySelector("header .ml-auto.flex, header [x-show='!mobileSearch'].ml-auto");
    if (headerTools) {
      return { desktop: headerTools, mobile: headerTools };
    }
    const nav = document.querySelector("header nav, header .container-page");
    return { desktop: nav, mobile: nav };
  }

  getActionsAnchor() {
    const epSection = document.querySelector("section[x-data*='epList'], section:has(.ep-tile), .episodes-list, .ag-episodes");
    if (epSection) return { element: epSection, position: "before" };
    const toolbar = document.querySelector(".watch-toolbar, .ag-cta");
    if (toolbar) return { element: toolbar, position: "before" };
    return null;
  }

  getVideoBottomAnchor() {
    const toolbar = document.querySelector(".watch-toolbar");
    if (toolbar) return toolbar;
    return document.querySelector(".player-card");
  }

  highlightEpisodes(trackedProgress) {
    if (trackedProgress === undefined || trackedProgress === null) return;
    const tiles = document.querySelectorAll(".ep-tile");
    const activeEp = this.getActiveEpisode();

    tiles.forEach((tile) => {
      let epNum = parseInt(tile.innerText.trim(), 10);
      if (isNaN(epNum)) {
        const href = tile.getAttribute("href") || "";
        const m = href.match(/\/ep-(\d+)/i);
        if (m) epNum = parseInt(m[1], 10);
      }
      if (isNaN(epNum)) return;

      const isDone = epNum <= trackedProgress;
      const isCurrent = epNum === activeEp;

      tile.classList.toggle("al-done", isDone);
      tile.classList.toggle("al-current", isCurrent);
    });
  }

  async resolveTargetUrl(media, targetEp = 1) {
    if (!media?.id) return null;

    const pref = Storage.get("al_pref_language") || "sub";
    const isDubPref = pref === "dub";

    const rawMap = Storage.get("al_as_map");
    const map = (rawMap && typeof rawMap === "object" && !Array.isArray(rawMap)) ? rawMap : {};
    const cached = map[media.id];

    // Validate cached entry: ensure season matches if title was cached
    if (cached?.slug) {
      const mediaSeason = extractSeason(media.title?.romaji || media.title?.english || media.title?.userPreferred || "");
      const cachedSeason = cached.title ? extractSeason(cached.title) : null;
      const seasonMatches = cachedSeason === null || cachedSeason === mediaSeason;

      if (seasonMatches && (cached.dub === undefined || (cached.dub === 1) === isDubPref || cached.hasAlternativeDub === false)) {
        return `/anime/${cached.slug}/ep-${targetEp}`;
      }
    }

    const candidates = generateSearchCandidates(media);

    for (const query of candidates) {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) continue;

        const data = await res.json();
        const results = data?.results || [];
        if (!results.length) continue;

        // Extract anilist_id from poster filename (AnimeSaturn convention: /bx190327-...)
        results.forEach((r) => {
          if (!r.anilist_id && r.poster) {
            const m = r.poster.match(/\/bx?(\d+)[-_.]/i);
            if (m && m[1]) r.anilist_id = parseInt(m[1], 10);
          }
        });

        // Score and rank results to guarantee season and dub accuracy
        const scored = results
          .map((r) => ({ result: r, score: scoreSearchResult(r, media, isDubPref) }))
          .sort((a, b) => b.score - a.score);

        const best = scored[0];
        // Only accept candidate if top score is positive and confident
        if (best && best.score >= 50 && best.result?.url) {
          const chosen = best.result;
          const slug = chosen.url.replace(/^\/anime\//, "").replace(/\/$/, "");
          const isDub = chosen.title?.includes("(ITA)") || chosen.url?.includes("-ita-") ? 1 : 0;

          map[media.id] = {
            slug,
            dub: isDub,
            hasAlternativeDub: results.length > 1,
            title: chosen.title,
            malId: media.idMal || undefined,
            updatedAt: Date.now()
          };
          Storage.set("al_as_map", map);

          return `/anime/${slug}/ep-${targetEp}`;
        }
      } catch (_) {}
    }

    return null;
  }
}
