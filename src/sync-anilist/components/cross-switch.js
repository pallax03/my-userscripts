import { Storage } from "../../shared/storage.js";
import { showToast } from "../../shared/toast.js";
import { Logger } from "../../shared/logger.js";
import { iconHtml, Globe, Tv, ExternalLink, Loader2 } from "../../shared/icons.js";
import { cleanTitle, generateSearchCandidates, extractSeason, scoreSearchResult } from "../providers/base.js";

/**
 * Universal JSON request helper using GM_xmlhttpRequest if cross-origin, or native fetch
 * @param {string} url
 * @param {Object} [options]
 * @returns {Promise<any>}
 */
function requestJson(url, options = {}) {
  return new Promise((resolve) => {
    if (typeof GM_xmlhttpRequest === "function") {
      GM_xmlhttpRequest({
        method: options.method || "GET",
        url,
        headers: options.headers || {},
        data: options.body || null,
        timeout: 8000,
        onload: (res) => {
          if (res.status >= 200 && res.status < 300) {
            try {
              resolve(JSON.parse(res.responseText));
            } catch (_) {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        },
        onerror: () => resolve(null),
        ontimeout: () => resolve(null)
      });
    } else {
      fetch(url, options)
        .then((r) => (r.ok ? r.json() : null))
        .then(resolve)
        .catch(() => resolve(null));
    }
  });
}

/**
 * Universal HTML/Text request helper using GM_xmlhttpRequest if cross-origin, or native fetch
 * @param {string} url
 * @param {Object} [options]
 * @returns {Promise<string|null>}
 */
function requestText(url, options = {}) {
  return new Promise((resolve) => {
    if (typeof GM_xmlhttpRequest === "function") {
      GM_xmlhttpRequest({
        method: options.method || "GET",
        url,
        headers: options.headers || {},
        data: options.body || null,
        timeout: 8000,
        onload: (res) => {
          if (res.status >= 200 && res.status < 400) {
            resolve(res.responseText || "");
          } else {
            resolve(null);
          }
        },
        onerror: () => resolve(null),
        ontimeout: () => resolve(null)
      });
    } else {
      fetch(url, options)
        .then((r) => (r.ok ? r.text() : null))
        .then(resolve)
        .catch(() => resolve(null));
    }
  });
}

/**
 * Resolves the absolute AnimeSaturn URL for a given AniList media and target episode
 * @param {Object} media
 * @param {number} targetEp
 * @returns {Promise<string>}
 */
export async function resolveSaturnUrl(media, targetEp = 1) {
  const asBase = Storage.get("al_as_base") || "https://www.animesaturn.net";
  if (!media?.id) return asBase;

  const pref = Storage.get("al_pref_language") || "sub";
  const isDubPref = pref === "dub";

  const rawMap = Storage.get("al_as_map");
  const map = rawMap && typeof rawMap === "object" && !Array.isArray(rawMap) ? rawMap : {};
  const cached = map[media.id];

  if (cached?.slug) {
    const mediaSeason = extractSeason(media.title?.romaji || media.title?.english || media.title?.userPreferred || "");
    const cachedSeason = cached.title ? extractSeason(cached.title) : null;
    const seasonMatches = cachedSeason === null || cachedSeason === mediaSeason;

    if (seasonMatches && (cached.dub === undefined || (cached.dub === 1) === isDubPref || cached.hasAlternativeDub === false)) {
      return `${asBase}/anime/${cached.slug}/ep-${targetEp}`;
    }
  }

  const candidates = generateSearchCandidates(media);

  for (const query of candidates) {
    try {
      const data = await requestJson(`${asBase}/api/search?q=${encodeURIComponent(query)}`);
      const results = data?.results || [];
      if (!results.length) continue;

      const scored = results
        .map((r) => ({ result: r, score: scoreSearchResult(r, media, isDubPref) }))
        .sort((a, b) => b.score - a.score);

      const best = scored[0];
      if (best && best.score >= 50 && best.result?.url) {
        const chosen = best.result;
        const slug = chosen.url.replace(/^\/anime\//, "").replace(/\/$/, "");
        const isDub = chosen.title?.includes("(ITA)") || chosen.url?.includes("-ita-") ? 1 : 0;

        map[media.id] = {
          slug,
          dub: isDub,
          hasAlternativeDub: results.length > 1,
          title: chosen.title,
          updatedAt: Date.now()
        };
        Storage.set("al_as_map", map);

        return `${asBase}/anime/${slug}/ep-${targetEp}`;
      }
    } catch (_) {}
  }

  const title = media.title?.english || media.title?.romaji || media.title?.userPreferred || "";
  return `${asBase}/filter?key=${encodeURIComponent(cleanTitle(title))}`;
}

/**
 * Resolves the absolute AnimeUnity URL for a given AniList media and target episode
 * Uses AnimeUnity's CSRF-free /archivio?title= GET endpoint
 * @param {Object} media
 * @param {number} targetEp
 * @returns {Promise<string>}
 */
export async function resolveUnityUrl(media, targetEp = 1) {
  const auBase = Storage.get("al_au_base") || "https://www.animeunity.co";
  if (!media?.id) return auBase;

  const pref = Storage.get("al_pref_language") || "sub";
  const prefDubInt = pref === "dub" ? 1 : 0;

  const rawMap = Storage.get("al_au_map");
  const map = rawMap && typeof rawMap === "object" && !Array.isArray(rawMap) ? rawMap : {};
  const cached = map[media.id];

  if (cached?.id && cached?.slug) {
    if (cached.dub === undefined || cached.dub === prefDubInt || cached.hasAlternativeDub === false) {
      return `${auBase}/anime/${cached.id}-${cached.slug}?ep=${targetEp}`;
    }
  }

  const candidates = generateSearchCandidates(media);

  for (const query of candidates) {
    try {
      const html = await requestText(`${auBase}/archivio?title=${encodeURIComponent(query)}`);
      if (!html) continue;

      const m = html.match(/<archivio\s+records="([^"]+)"/i);
      if (!m || !m[1]) continue;

      const rawJson = m[1].replace(/&quot;/g, '"');
      const records = JSON.parse(rawJson);
      if (!Array.isArray(records) || !records.length) continue;

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
        return `${auBase}/anime/${chosen.id}-${chosen.slug}?ep=${targetEp}`;
      }
    } catch (_) {}
  }

  const title = media.title?.english || media.title?.romaji || media.title?.userPreferred || "";
  return `${auBase}/archivio?title=${encodeURIComponent(cleanTitle(title))}`;
}

/**
 * Renders the cross-provider switch button in the player header (#video-top on AnimeUnity, watch-toolbar on AnimeSaturn)
 * @param {Object} options
 * @param {Object} options.media
 * @param {number} options.activeEp
 * @param {Object} options.provider
 */
export function renderCrossSwitch({ media, activeEp = 0, provider = null } = {}) {
  const isUnity = provider?.name === "AnimeUnity";
  const targetSiteName = isUnity ? "AnimeSaturn" : "AnimeUnity";
  const targetIcon = isUnity ? Globe : Tv;
  const targetEp = activeEp > 0 ? activeEp : 1;

  // Determine container
  let container = null;
  if (isUnity) {
    container = document.getElementById("video-top");
  } else {
    container = document.querySelector(".watch-toolbar") || document.querySelector(".player-card") || document.querySelector(".ag-cta");
  }

  const existing = document.getElementById("al-cross-switch-btn");

  if (!container || !media) {
    existing?.remove();
    return;
  }

  let btn = existing;
  if (!btn) {
    btn = document.createElement("button");
    btn.type = "button";
    btn.id = "al-cross-switch-btn";
    btn.className = `al-cross-switch-btn ${isUnity ? "for-saturn" : "for-unity"}`;
    container.appendChild(btn);
  } else {
    btn.className = `al-cross-switch-btn ${isUnity ? "for-saturn" : "for-unity"}`;
  }

  btn.title = `Switch to ${targetSiteName} · Open Ep. ${targetEp}`;
  btn.innerHTML = `
    <span class="al-switch-icon">${iconHtml(targetIcon, { width: 13, height: 13 })}</span>
    <span class="al-switch-label">${targetSiteName}</span>
    <span class="al-switch-ep">Ep. ${targetEp}</span>
    ${iconHtml(ExternalLink, { width: 11, height: 11, class: "al-switch-ext" })}
  `;

  // Bind single click handler
  btn.onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    btn.classList.add("is-loading");
    btn.innerHTML = `${iconHtml(Loader2, { width: 12, height: 12, class: "al-spin" })} <span>Opening ${targetSiteName}...</span>`;

    showToast(`⚡ Switching to ${targetSiteName} (Ep. ${targetEp})...`, false, 2500);

    try {
      const url = isUnity
        ? await resolveSaturnUrl(media, targetEp)
        : await resolveUnityUrl(media, targetEp);

      if (url) {
        window.location.href = url;
        return;
      }
    } catch (err) {
      Logger.error("Cross switch error:", err);
    }

    // Fallback search redirection
    const auBase = Storage.get("al_au_base") || "https://www.animeunity.co";
    const asBase = Storage.get("al_as_base") || "https://www.animesaturn.net";
    const title = media.title?.english || media.title?.romaji || media.title?.userPreferred || "";
    if (isUnity) {
      window.location.href = `${asBase}/filter?key=${encodeURIComponent(cleanTitle(title))}`;
    } else {
      window.location.href = `${auBase}/archivio?title=${encodeURIComponent(cleanTitle(title))}`;
    }
  };
}
