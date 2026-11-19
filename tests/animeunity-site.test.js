import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getAnimeMetadata, getCurrentEpisode, getTotalEpisodes } from "../src/shared/animeunity/site.js";

describe("shared/animeunity/site", () => {
  const samplePage = {
    props: {
      anime: {
        id: 12,
        slug: "one-piece",
        mal_id: 21,
        anilist_id: 21,
        title: "One Piece",
        episodes_count: 1122
      },
      episode: {
        number: "105"
      },
      loadedEpisodes: {
        total: 1122,
        episodes: [
          { number: "105", videos: [{ id: 50573, language: "jpn" }] },
          { number: "106", videos: [{ id: 50574, language: "jpn" }] }
        ]
      }
    }
  };

  it("extracts anime metadata from Inertia props", () => {
    assert.deepEqual(getAnimeMetadata(samplePage), {
      animeId: 12,
      slug: "one-piece",
      malId: 21,
      anilistId: 21,
      title: "One Piece"
    });
  });

  it("extracts active episode only on watch URLs, returning 0 on detail pages even if props.episode is set", () => {
    assert.equal(getCurrentEpisode(samplePage, "/anime/12-one-piece/50573"), 105);
    assert.equal(getCurrentEpisode(samplePage, "/anime/12-one-piece"), 0);
  });

  it("falls back to videoId lookup in loadedEpisodes when props.episode is absent", () => {
    const withoutEp = {
      props: {
        ...samplePage.props,
        episode: null
      }
    };
    assert.equal(getCurrentEpisode(withoutEp, "/anime/12-one-piece/50574"), 106);
    assert.equal(getCurrentEpisode(withoutEp, "/anime/12-one-piece"), 0);
  });

  it("returns total episodes from loadedEpisodes or anime.episodes_count", () => {
    assert.equal(getTotalEpisodes(samplePage), 1122);
    assert.equal(getTotalEpisodes({ props: { anime: { episodes_count: 24 } } }), 24);
    assert.equal(getTotalEpisodes(null), null);
  });
});
