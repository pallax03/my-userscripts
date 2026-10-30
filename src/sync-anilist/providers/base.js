import { Storage } from "../../shared/storage.js";

/**
 * Strips release tags, language labels, and bracket info while preserving season numbers
 * @param {string} title
 * @returns {string}
 */
export function cleanTitle(title) {
  if (!title) return "";
  return title
    .replace(/\s*\((ITA|SUB|SUB ITA|DUB|ITA SUB|OVA|TV)\)/gi, "")
    .replace(/\s+(ITA|SUB|DUB)$/gi, "")
    .replace(/\[[^\]]+\]/g, "")
    .trim();
}

/**
 * Extracts season number from a title string (defaults to 1 if no season indicator is present)
 * @param {string} title
 * @returns {number}
 */
export function extractSeason(title) {
  if (!title) return 1;
  const t = title.toLowerCase();

  // 1. Explicit Season keywords: "Season 2", "Stagione 2", "2nd Season"
  const seasonMatch = t.match(/\b(?:season|stagione)\s*(\d+)\b/i) ||
                      t.match(/\b(\d+)(?:st|nd|rd|th)\s+season\b/i);
  if (seasonMatch) return parseInt(seasonMatch[1], 10);

  // 2. Word forms
  if (/\b(?:second\s+season|2nd\s+season)\b/i.test(t)) return 2;
  if (/\b(?:third\s+season|3rd\s+season)\b/i.test(t)) return 3;
  if (/\b(?:fourth\s+season|4th\s+season)\b/i.test(t)) return 4;
  if (/\b(?:final\s+season)\b/i.test(t)) return 4;

  // 3. Roman numerals (II, III, IV)
  if (/\bii\b/i.test(t)) return 2;
  if (/\biii\b/i.test(t)) return 3;
  if (/\biv\b/i.test(t)) return 4;

  // 4. Season number before Part/Parte (e.g. "4 Parte 2" -> 4)
  const seasonBeforePart = t.match(/\b(\d+)\s+(?:part|parte)\s+\d+\b/i);
  if (seasonBeforePart) return parseInt(seasonBeforePart[1], 10);

  // 5. Standalone Part/Parte without preceding season (e.g. "Part 2")
  const partMatch = t.match(/\b(?:part|parte)\s*(\d+)\b/i);
  if (partMatch) return parseInt(partMatch[1], 10);

  // 6. Trailing digit (e.g. "Haikyuu!! 2", "Boku no Hero Academia 5")
  const clean = t.replace(/\s*\((?:ita|sub|dub|sub ita)\)/gi, "").trim();
  const trailingMatch = clean.match(/(?:^|\s+)(\d+)$/);
  if (trailingMatch) {
    const n = parseInt(trailingMatch[1], 10);
    if (n > 0 && n <= 20) return n;
  }

  return 1;
}

/**
 * Scores a search result against target AniList media for accurate season and metadata matching
 * @param {Object} result
 * @param {Object} media
 * @param {boolean} isDubPref
 * @returns {number}
 */
export function scoreSearchResult(result, media, isDubPref = false) {
  if (!result || !media) return -999;
  let score = 0;

  const rTitle = result.title || result.title_eng || "";
  const rUrl = result.url || result.slug || "";
  const isDub = (result.dub === 1) ||
                rTitle.includes("(ITA)") ||
                rUrl.includes("-ita-") ||
                rUrl.endsWith("-ita");

  // 1. Dub match
  if (isDubPref) {
    if (isDub) score += 30;
    else score -= 20;
  } else {
    if (!isDub) score += 30;
    else score -= 20;
  }

  // 2. Direct anilist_id match if available (e.g. AnimeUnity and AnimeSaturn poster URLs)
  let anilistId = result.anilist_id;
  if (!anilistId && result.poster) {
    const m = String(result.poster).match(/\/bx?(\d+)[-_.]/i);
    if (m && m[1]) anilistId = parseInt(m[1], 10);
  }

  if (anilistId && anilistId === media.id) {
    score += 200;
  }

  // 3. Season match (heavy weighting to prevent season cross-contamination)
  const mediaTitle = media.title?.romaji || media.title?.english || media.title?.userPreferred || "";
  const mediaSeason = extractSeason(mediaTitle);
  const resSeason = extractSeason(rTitle);

  if (mediaSeason === resSeason) {
    score += 100;
  } else {
    score -= 100;
  }

  // 4. Franchise distinctive subtitle mismatch penalty (e.g. JoJo parts)
  const lowMedia = mediaTitle.toLowerCase();
  const lowRes = rTitle.toLowerCase();
  const distinctiveSubtitles = [
    "steel ball run",
    "stone ocean",
    "vento aureo",
    "diamond is unbreakable",
    "stardust crusaders",
    "phantom blood",
    "battle tendency"
  ];
  for (const sub of distinctiveSubtitles) {
    const mediaHas = lowMedia.includes(sub);
    const resHas = lowRes.includes(sub);
    if (mediaHas !== resHas) {
      score -= 150;
    }
  }

  // 5. Spin-off and special penalty when searching for main series
  for (const word of ["quest", "picture drama", "recap", "special", "drama cd"]) {
    if (lowRes.includes(word) && !lowMedia.includes(word)) {
      score -= 100;
    }
  }

  // 6. Episode count match
  const rEps = parseInt(result.episodes || result.episodes_count, 10);
  if (media.episodes && !isNaN(rEps) && rEps > 0) {
    if (rEps === media.episodes) {
      score += 35;
    } else if (Math.abs(rEps - media.episodes) <= 2) {
      score += 15;
    }
  }

  // 5. Release year match
  const targetYear = media.seasonYear || media.startDate?.year;
  const rYear = parseInt(result.year || result.date, 10);
  if (targetYear && !isNaN(rYear) && rYear > 0) {
    if (rYear === targetYear) {
      score += 25;
    } else if (Math.abs(rYear - targetYear) <= 1) {
      score += 10;
    }
  }

  // 6. Format penalty if media is TV and result is OVA/Movie
  const rType = (result.type || "").toUpperCase();
  if (media.format && rType) {
    if (media.format === rType) score += 20;
    else if (media.format === "TV" && (rType === "OVA" || rType === "MOVIE" || rType === "SPECIAL")) score -= 50;
  }

  return score;
}

/**
 * Generates prioritized search keywords for site search APIs
 * Prioritizes Romaji over English for Italian anime streaming platforms
 * @param {Object} media - AniList media object with titles
 * @returns {string[]} Deduplicated candidate query strings
 */
export function generateSearchCandidates(media) {
  if (!media) return [];
  const candidates = [];
  const rom = media.title?.romaji;
  const eng = media.title?.english;
  const pref = media.title?.userPreferred;

  // Romaji first: Italian sites index Romaji titles or translated Italian titles matching Romaji
  for (const raw of [rom, eng, pref]) {
    if (!raw) continue;
    const clean = cleanTitle(raw);
    if (clean && clean.length >= 3) candidates.push(clean);

    // If season is denoted in words (e.g. "Second Season"), also add numeric variant ("Haikyuu!! 2")
    const season = extractSeason(raw);
    if (season > 1) {
      const baseName = clean
        .replace(/\b(?:second|third|fourth|\d+(?:st|nd|rd|th)?)\s+season\b/gi, "")
        .replace(/\s+part\s+\d+/gi, "")
        .trim();
      if (baseName && baseName.length >= 3) {
        candidates.push(`${baseName} ${season}`);
      }
    }

    const parts = raw.split(/[:\-\(\)]+/).map((p) => cleanTitle(p.trim())).filter((p) => p.length >= 3);
    candidates.push(...parts);

    const noSeason = clean.split(/\b(?:\d+th|1st|2nd|3rd|\d+)\s+season\b/i)[0].trim();
    if (noSeason && noSeason.length >= 3) candidates.push(noSeason);

    const words = clean.split(/\s+/).slice(0, 3).join(" ").trim();
    if (words.length >= 3) candidates.push(words);
  }

  return [...new Set(candidates.filter((c) => c && c.length >= 3))];
}

/**
 * Base Site Provider interface
 */
export class BaseProvider {
  constructor(name) {
    this.name = name;
  }

  isHome() {
    return false;
  }

  isAnimePage() {
    return false;
  }

  isWatchPage() {
    return false;
  }

  getAnimeInfo() {
    return {
      title: null,
      romajiTitle: null,
      anilistId: null,
      malId: null,
      currentEp: null,
      totalEp: null
    };
  }

  getShelfAnchor() {
    return null;
  }

  getNavAnchor() {
    return null;
  }

  getActionsAnchor() {
    return null;
  }

  getVideoBottomAnchor() {
    return null;
  }

  highlightEpisodes(trackedProgress) {}

  getActiveEpisode() {
    return null;
  }

  async resolveTargetUrl(media, targetEp = 1) {
    return null;
  }
}
