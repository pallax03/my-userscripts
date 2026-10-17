import { Storage } from "../storage.js";

/**
 * Strips release tags, language labels, cour markers, and season numbers from titles
 * @param {string} title
 * @returns {string}
 */
export function cleanTitle(title) {
  if (!title) return "";
  return title
    .replace(/\s*\((ITA|SUB|SUB ITA|DUB|ITA SUB|OVA|TV)\)/gi, "")
    .replace(/\s+(ITA|SUB|DUB)$/gi, "")
    .replace(/\s+\d+(?:st|nd|rd|th)\s+Season/gi, "")
    .replace(/\s+Season\s+\d+/gi, "")
    .replace(/\s+\d+-nensei-hen.*/gi, "")
    .replace(/:\s*2nd\s*&\s*3rd\s*STAGE.*/gi, "")
    .trim();
}

/**
 * Generates prioritized search keywords for AnimeUnity /livesearch
 * @param {Object} media - AniList media object with title
 * @returns {string[]} Deduplicated candidate query strings
 */
export function generateSearchCandidates(media) {
  if (!media) return [];
  const candidates = [];
  const eng = media.title?.english;
  const rom = media.title?.romaji;

  if (eng) {
    // 1. Full English title cleaned
    const cleanEng = cleanTitle(eng);
    if (cleanEng) candidates.push(cleanEng);

    // 2. Base title before colon, dash, or number
    const baseEng = eng.split(/[:\-\d]/)[0].trim();
    if (baseEng.length >= 3) candidates.push(baseEng);
  }

  if (rom) {
    // 3. Cleaned Romaji title
    const cleanRom = cleanTitle(rom);
    if (cleanRom) candidates.push(cleanRom);

    // 4. Base Romaji before colon, dash, or number
    const baseRom = rom.split(/[:\-\d]/)[0].trim();
    if (baseRom.length >= 3) candidates.push(baseRom);

    // 5. First 2-3 words of Romaji title
    const words = rom.split(/\s+/).slice(0, 3).join(" ").trim();
    if (words.length >= 3) candidates.push(words);
  }

  // Deduplicate and filter minimum length
  return [...new Set(candidates.filter((c) => c && c.length >= 3))];
}

/**
 * Resolves the exact AnimeUnity anime record via the internal /livesearch API
 * Respects user language preference (SUB-ITA vs ITA)
 * @param {Object} media - AniList media object
 * @param {Object} [options]
 * @param {string} [options.preferredDub] - "sub" (default) or "dub"
 * @returns {Promise<{ id: number, slug: string, dub: number, title?: string } | null>}
 */
export async function resolveAnimeUnityAnime(media, { preferredDub } = {}) {
  if (!media?.id) return null;

  const pref = preferredDub || Storage.get("al_pref_language") || "sub";
  const prefDubInt = pref === "dub" ? 1 : 0;

  const map = Storage.get("al_au_map") || {};
  const cached = map[media.id];

  // Return cached result if dub matches or no alternative exists
  if (cached?.id && cached?.slug) {
    if (cached.dub === undefined || cached.dub === prefDubInt || cached.hasAlternativeDub === false) {
      return cached;
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

      // Match records by exact AniList ID
      const matches = records.filter((r) => r.anilist_id === media.id);
      if (matches.length > 0) {
        let selected = matches.find((r) => r.dub === prefDubInt);
        if (!selected) {
          selected = matches[0];
        }

        const resolved = {
          id: selected.id,
          slug: selected.slug,
          dub: selected.dub,
          title: selected.title || selected.title_eng,
          hasAlternativeDub: matches.length > 1,
          updatedAt: Date.now()
        };

        map[media.id] = resolved;
        Storage.set("al_au_map", map);
        return resolved;
      }
    } catch (err) {
      console.warn("[animeunity-utils] /livesearch error for query:", query, err);
    }
  }

  return null;
}

/**
 * Scans layout-items elements on AnimeUnity pages to harvest AniList -> AnimeUnity mappings
 * @returns {Record<string, { id: number, slug: string, title?: string, latestEp?: number, dub?: number }>}
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
            dub: anime.dub || 0,
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
 * Resolves the best direct AnimeUnity URL or smart archive search URL
 * @param {Object} media - AniList media object with id and title
 * @param {Object} [options]
 * @param {number} [options.targetEp] - Optional episode number to navigate to
 * @returns {string} Relative URL to anime page or archive search
 */
export function getAnimeUnityUrl(media, { targetEp } = {}) {
  if (!media) return "/";

  const map = Storage.get("al_au_map") || {};
  const mapped = map[media.id];

  if (mapped?.id && mapped?.slug) {
    const epSuffix = targetEp ? `?ep=${targetEp}` : "";
    return `/anime/${mapped.id}-${mapped.slug}${epSuffix}`;
  }

  const candidates = generateSearchCandidates(media);
  const bestSearch = candidates[candidates.length - 1] || media.title?.english || media.title?.romaji || "";
  return `/archivio?title=${encodeURIComponent(bestSearch)}`;
}
