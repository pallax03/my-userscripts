import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cleanTitle, extractSeason, scoreSearchResult } from "../src/sync-anilist/providers/base.js";

describe("providers/base", () => {
  describe("cleanTitle", () => {
    it("strips language/format tags and brackets while preserving core title", () => {
      assert.equal(cleanTitle("One Piece (ITA)"), "One Piece");
      assert.equal(cleanTitle("Jujutsu Kaisen (SUB ITA) [1080p]"), "Jujutsu Kaisen");
      assert.equal(cleanTitle("Attack on Titan DUB"), "Attack on Titan");
      assert.equal(cleanTitle(""), "");
      assert.equal(cleanTitle(null), "");
    });
  });

  describe("extractSeason", () => {
    it("extracts explicit, roman numeral, part, and trailing season numbers", () => {
      assert.equal(extractSeason("One Piece"), 1);
      assert.equal(extractSeason("Jujutsu Kaisen Season 2"), 2);
      assert.equal(extractSeason("Attack on Titan Stagione 3"), 3);
      assert.equal(extractSeason("My Hero Academia 2nd Season"), 2);
      assert.equal(extractSeason("Mob Psycho 100 II"), 2);
      assert.equal(extractSeason("Mob Psycho 100 III"), 3);
      assert.equal(extractSeason("Haikyuu!! 4 Parte 2"), 4);
      assert.equal(extractSeason("Bleach Part 2"), 2);
      assert.equal(extractSeason("Boku no Hero Academia 5 (ITA)"), 5);
    });
  });

  describe("scoreSearchResult", () => {
    const media = {
      id: 21,
      title: { romaji: "One Piece", english: "One Piece" }
    };

    it("prefers exact anilist_id match and matching dub preference", () => {
      const subMatch = scoreSearchResult({ title: "One Piece", anilist_id: 21, dub: 0 }, media, false);
      const dubMismatch = scoreSearchResult({ title: "One Piece (ITA)", anilist_id: 21, dub: 1 }, media, false);
      const wrongId = scoreSearchResult({ title: "Other Anime", anilist_id: 999, dub: 0 }, media, false);

      assert.ok(subMatch > dubMismatch);
      assert.ok(subMatch > wrongId);
    });

    it("prefers ITA dub when isDubPref is true", () => {
      const dubMatch = scoreSearchResult({ title: "One Piece (ITA)", dub: 1 }, media, true);
      const subMismatch = scoreSearchResult({ title: "One Piece", dub: 0 }, media, true);

      assert.ok(dubMatch > subMismatch);
    });
  });
});
