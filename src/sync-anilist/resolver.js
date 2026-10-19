import { getAnimeKey, getAnimeMetadata } from "../shared/animeunity/metadata.js";

export { getAnimeKey };

export const extractPageMetadata = () => {
  const { anilistId, title } = getAnimeMetadata();
  return { anilistId, romajiTitle: title };
};

export { cleanTitle } from "../shared/animeunity/utils.js";
