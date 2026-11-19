import { Storage } from "../storage.js";
import { cleanTitle, generateSearchCandidates, scoreSearchResult } from "../../sync-anilist/providers/base.js";

export { cleanTitle, generateSearchCandidates };

const AUDIO = { dub: "ita", sub: "jpn" };

/** Inertia page object: live in history.state, or the server-rendered data-page before hydration. */
export function getPage() {
  const live = typeof history !== "undefined" ? history.state?.page : null;
  if (live?.props) return live;
  try {
    const raw = typeof document !== "undefined" ? document.querySelector("#app")?.dataset?.page : null;
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function getAnimeMetadata(page = getPage()) {
  const a = page?.props?.anime;
  if (a) {
    return {
      animeId: a.id,
      slug: a.slug,
      malId: a.mal_id || null,
      anilistId: a.anilist_id || null,
      title: a.title
    };
  }
  if (typeof document === "undefined") {
    return { malId: null, anilistId: null, title: null };
  }
  const link = (host) => document.querySelector(`a[href*="${host}/anime/"]`)?.href.match(/anime\/(\d+)/)?.[1];
  return {
    malId: +link("myanimelist.net") || null,
    anilistId: +link("anilist.co") || null,
    title: document.querySelector("h1")?.innerText?.trim() || null
  };
}

export function getCurrentEpisode(
  page = getPage(),
  pathname = typeof location !== "undefined" ? location.pathname : ""
) {
  const epNum = parseInt(page?.props?.episode?.number, 10);
  if (epNum > 0) return epNum;

  // Fallback: match videoId from URL and look up in loadedEpisodes
  const match = pathname.match(/\/anime\/\d+[^/]*\/(\d+)/);
  if (match) {
    const videoId = parseInt(match[1], 10);
    const episodes = page?.props?.loadedEpisodes?.episodes || [];
    for (const ep of episodes) {
      if (ep.videos?.some((v) => v.id === videoId)) {
        const found = parseInt(ep.number, 10);
        if (found > 0) return found;
      }
    }
  }
  return 0;
}

export function getTotalEpisodes(page = getPage()) {
  return page?.props?.loadedEpisodes?.total || page?.props?.anime?.episodes_count || null;
}

const getJson = async (url) => {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  return res.ok ? res.json() : null;
};

async function fetchAnilistId({ id, slug }) {
  try {
    const html = await (await fetch(`/anime/${id}-${slug}`)).text();
    const page = new DOMParser().parseFromString(html, "text/html").querySelector("#app")?.dataset.page;
    return JSON.parse(page).props.anime.anilist_id;
  } catch (_) {
    return null;
  }
}

const loadMap = () => {
  if (Storage.get("al_au_ver") !== 2) {
    Storage.del("al_au_map");
    Storage.set("al_au_ver", 2);
  }
  const raw = Storage.get("al_au_map");
  return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
};

/**
 * Maps an AniList media to an AnimeUnity {id, slug}: cached, else /api/search + AniList-id verification.
 * @returns {Promise<{id:number, slug:string, matchingQuery?:string}|null>}
 */
export async function resolveAnimeUnityAnime(media) {
  if (!media?.id) return null;
  const map = loadMap();
  if (map[media.id]?.id) return map[media.id];

  for (const query of generateSearchCandidates(media)) {
    const records = (await getJson(`/api/search?q=${encodeURIComponent(query)}`).catch(() => null))?.data || [];
    const ranked = records
      .map((r) => ({ r, score: scoreSearchResult({ ...r, episodes: r.total_episodes }, media) }))
      .sort((a, b) => b.score - a.score);

    let chosen = null;
    for (const { r } of ranked.slice(0, 4)) {
      const pm = String(r.images?.poster || "").match(/\/bx?(\d+)[-_.]/i);
      if (pm && parseInt(pm[1], 10) === media.id) { chosen = r; break; }
      if (await fetchAnilistId(r) === media.id) { chosen = r; break; }
    }
    if (!chosen && ranked[0]?.score >= 50) chosen = ranked[0].r;

    if (chosen) {
      const hit = { id: chosen.id, slug: chosen.slug, title: chosen.title, matchingQuery: query };
      map[media.id] = hit;
      Storage.set("al_au_map", map);
      return hit;
    }
  }
  return null;
}

/** Direct watch URL for an episode (audio picked from the sub/dub preference), else the anime page. */
export async function getEpisodeUrl({ id, slug }, ep = 1) {
  const base = `/anime/${id}-${slug}`;
  const startEp = ep > 0 ? ep : 1;
  const data = await getJson(`/api/anime/${id}/episodes?start=${startEp}`).catch(() => null);
  const videos = data?.episodes?.find((e) => parseInt(e.number, 10) === startEp)?.videos?.filter((v) => !v.is_hidden) || [];
  const audio = AUDIO[Storage.get("al_pref_language")] || AUDIO.sub;
  const video = videos.find((v) => v.language === audio) || videos[0];
  return video ? `${base}/${video.id}` : base;
}
