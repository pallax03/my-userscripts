/**
 * Unified metadata and anime resolver for AnimeUnity.
 * Handles DOM parsing, sessionStorage caching, cover image AniList extraction,
 * and background HTML prefetching during SPA navigations.
 */

export function getAnimeKey(pathname = window.location.pathname) {
  const m = pathname.match(/\/anime\/(\d+)/i);
  return m ? m[1] : null;
}

const inFlightFetches = new Set();

/**
 * Retrieves cached or extracts current anime metadata for a given anime key.
 * @param {string} [customKey]
 * @param {Object} [options]
 * @param {Function} [options.onResolved] - Callback invoked when background fetch completes
 * @returns {{ malId: number | null, anilistId: number | null, title: string | null }}
 */
export function getAnimeMetadata(customKey, { onResolved } = {}) {
  const animeKey = customKey || getAnimeKey();
  if (!animeKey) return { malId: null, anilistId: null, title: null };

  let malId = null;
  let anilistId = null;
  let title = null;

  // 1. Session storage cache
  try {
    const rawMal = sessionStorage.getItem("au_mal_" + animeKey);
    if (rawMal) malId = parseInt(rawMal, 10) || null;
    const rawAl = sessionStorage.getItem("au_al_" + animeKey);
    if (rawAl) anilistId = parseInt(rawAl, 10) || null;
  } catch (_) {}

  if (malId && anilistId) {
    return { malId, anilistId, title };
  }

  // 2. DOM custom element attribute before Vue unmounts
  try {
    const el = document.querySelector("video-player[anime], [anime]");
    const raw = el?.getAttribute("anime");
    if (raw) {
      const obj = JSON.parse(raw);
      if (obj.mal_id && !malId) {
        malId = parseInt(obj.mal_id, 10);
        try { sessionStorage.setItem("au_mal_" + animeKey, String(malId)); } catch (_) {}
      }
      if (obj.anilist_id && !anilistId) {
        anilistId = parseInt(obj.anilist_id, 10);
        try { sessionStorage.setItem("au_al_" + animeKey, String(anilistId)); } catch (_) {}
      }
      if (obj.title) title = obj.title;
    }
  } catch (_) {}

  // 3. Cover image filename pattern (bx<ID> or b<ID>)
  if (!anilistId) {
    try {
      const og = document.querySelector('meta[property="og:image"]')?.content || "";
      const cover = document.querySelector(".cover-wrap img.cover, img.cover")?.src || "";
      const m = `${og} ${cover}`.match(/\/b[x]?(\d+)[-_]/i);
      if (m && m[1]) {
        anilistId = parseInt(m[1], 10);
        try { sessionStorage.setItem("au_al_" + animeKey, String(anilistId)); } catch (_) {}
      }
    } catch (_) {}
  }

  // 4. Background fetch if either malId or anilistId is missing
  if ((!malId || !anilistId) && !inFlightFetches.has(animeKey)) {
    inFlightFetches.add(animeKey);
    fetchBackgroundMetadata(animeKey).then((resolved) => {
      inFlightFetches.delete(animeKey);
      if (resolved && typeof onResolved === "function") {
        onResolved(resolved);
      }
    }).catch(() => {
      inFlightFetches.delete(animeKey);
    });
  }

  return { malId, anilistId, title };
}

/**
 * Fetches page HTML in the background to extract server-rendered metadata and episode list
 * @param {string} animeKey
 * @returns {Promise<{ malId: number | null, anilistId: number | null } | null>}
 */
async function fetchBackgroundMetadata(animeKey) {
  try {
    const res = await fetch(`/anime/${animeKey}`);
    if (!res.ok) return null;
    const html = await res.text();

    let malId = null;
    let anilistId = null;

    const mMal = html.match(/(?:&quot;|")mal_id(?:&quot;|")\s*:\s*(\d+)/);
    if (mMal && mMal[1]) {
      malId = parseInt(mMal[1], 10);
      try { sessionStorage.setItem("au_mal_" + animeKey, String(malId)); } catch (_) {}
    }

    const mAl = html.match(/(?:&quot;|")anilist_id(?:&quot;|")\s*:\s*(\d+)/);
    if (mAl && mAl[1]) {
      anilistId = parseInt(mAl[1], 10);
      try { sessionStorage.setItem("au_al_" + animeKey, String(anilistId)); } catch (_) {}
    }

    const mEps = html.match(/episodes="(\[{.*?\}\])"/);
    if (mEps && mEps[1]) {
      const raw = mEps[1].replace(/&quot;/g, '"');
      try { sessionStorage.setItem("au_eps_" + animeKey, raw); } catch (_) {}
    }

    return { malId, anilistId };
  } catch (_) {
    return null;
  }
}

/**
 * Returns the cached or DOM-parsed episodes list for an anime key
 * @param {string} [customKey]
 * @returns {Array<{ id: number, number: string }>}
 */
export function getEpisodesList(customKey) {
  const animeKey = customKey || getAnimeKey();
  if (!animeKey) return [];

  try {
    const cached = sessionStorage.getItem("au_eps_" + animeKey);
    if (cached) {
      const list = JSON.parse(cached);
      if (Array.isArray(list) && list.length > 0) return list;
    }
  } catch (_) {}

  try {
    const el = document.querySelector("video-player[episodes], [episodes]");
    const raw = el?.getAttribute("episodes");
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        try { sessionStorage.setItem("au_eps_" + animeKey, raw); } catch (_) {}
        return list;
      }
    }
  } catch (_) {}

  return [];
}
