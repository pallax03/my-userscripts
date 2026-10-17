import { Storage } from "../storage.js";

/**
 * Strips release tags, language labels, and season markers from titles
 * @param {string} title
 * @returns {string}
 */
export function cleanTitle(title) {
  if (!title) return "";
  return title
    .replace(/\s*\((ITA|SUB|SUB ITA|DUB|ITA SUB|OVA|TV)\)/gi, "")
    .replace(/\s+(ITA|SUB|DUB)$/gi, "")
    .replace(/\s+Season\s+\d+/gi, "")
    .trim();
}

/**
 * Scans layout-items elements on AnimeUnity pages to harvest AniList -> AnimeUnity mappings
 * @returns {Record<string, { id: number, slug: string, title?: string, latestEp?: number }>}
 */
export function scanAnimeUnityPageMap() {
  const map = Storage.get("al_au_map") || {};
  let updated = false;

  const layoutElements = document.querySelectorAll("layout-items[items-json]");
  layoutElements.forEach((el) => {
    try {
      const raw = el.getAttribute("items-json");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : parsed?.data || [];

      items.forEach((item) => {
        const anime = item?.anime;
        const anilistId = anime?.anilist_id;
        if (anilistId && anime.id && anime.slug) {
          const epNum = parseInt(item.number, 10);
          map[anilistId] = {
            id: anime.id,
            slug: anime.slug,
            title: anime.title || anime.title_eng,
            latestEp: isNaN(epNum) ? undefined : epNum,
            updatedAt: Date.now()
          };
          updated = true;
        }
      });
    } catch (_) {}
  });

  if (updated) {
    Storage.set("al_au_map", map);
  }

  return map;
}

/**
 * Resolves the best AnimeUnity link for a given AniList media object
 * @param {Object} media - AniList media object with id and title
 * @returns {string} Relative URL to anime page or archive search
 */
export function getAnimeUnityUrl(media) {
  if (!media) return "/";

  const map = Storage.get("al_au_map") || {};
  const mapped = map[media.id];

  if (mapped?.id && mapped?.slug) {
    return `/anime/${mapped.id}-${mapped.slug}`;
  }

  const title = media.title?.romaji || media.title?.english || "";
  const cleaned = cleanTitle(title);
  return `/archivio?title=${encodeURIComponent(cleaned)}`;
}
