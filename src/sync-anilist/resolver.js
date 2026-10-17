export const getAnimeKey = () => {
  const match = window.location.pathname.match(/\/anime\/(\d+)/i);
  return match ? match[1] : window.location.pathname;
};

export const extractPageMetadata = () => {
  const animeKey = getAnimeKey();
  let anilistId = null;
  let romajiTitle = null;

  // Extract from video player custom element attributes
  try {
    const el = document.querySelector("video-player, layout-items");
    if (el) {
      const raw = el.getAttribute("anime");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.anilist_id) anilistId = parseInt(parsed.anilist_id, 10);
        if (parsed?.title) romajiTitle = parsed.title;
      }
    }
  } catch (_) {}

  // Fallback: match inline JSON in server-rendered page HTML
  if (!anilistId && animeKey) {
    try {
      const html = document.documentElement.innerHTML;
      const mId = html.match(
        new RegExp(`(?:&quot;|")id(?:&quot;|")\\s*:\\s*${animeKey}[^}]*?(?:&quot;|")anilist_id(?:&quot;|")\\s*:\\s*(\\d+)`)
      );
      if (mId && mId[1]) anilistId = parseInt(mId[1], 10);

      if (!romajiTitle) {
        const mTitle = html.match(
          new RegExp(`(?:&quot;|")id(?:&quot;|")\\s*:\\s*${animeKey}[^}]*?(?:&quot;|")title(?:&quot;|")\\s*:\\s*(?:&quot;|")([^"&]+(?:&amp;[^"&]+)*)(?:&quot;|")`)
        );
        if (mTitle && mTitle[1]) romajiTitle = mTitle[1].replace(/&amp;/g, "&");
      }
    } catch (_) {}
  }

  // Fallback: cover image filename format bx<ID> or b<ID>
  if (!anilistId) {
    const og = document.querySelector('meta[property="og:image"]')?.content || "";
    const cover = document.querySelector(".cover-wrap img.cover, img.cover")?.src || "";
    const mCover = `${og} ${cover}`.match(/\/b[x]?(\d+)[-_]/i);
    if (mCover && mCover[1]) anilistId = parseInt(mCover[1], 10);
  }

  return { anilistId, romajiTitle };
};

export { cleanTitle } from "../shared/animeunity/utils.js";
