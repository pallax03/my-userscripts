import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectProviderName } from "../src/sync-anilist/providers/index.js";
import { getCandidateBaseUrls } from "../src/sync-anilist/components/cross-switch.js";

describe("providers/index detectProviderName", () => {
  it("matches AnimeUnity across TLDs and subdomains", () => {
    for (const host of [
      "animeunity.cx",
      "www.animeunity.cx",
      "animeunity.to",
      "www.animeunity.to",
      "animeunity.cc",
      "animeunity.so",
      "animeunity.net",
      "sub.animeunity.co",
      "ANIMEUNITY.TV"
    ]) {
      assert.equal(detectProviderName(host), "AnimeUnity", `Expected AnimeUnity for ${host}`);
    }
  });

  it("matches AnimeSaturn and SaturnCDN across TLDs and subdomains", () => {
    for (const host of [
      "animesaturn.cx",
      "www.animesaturn.cx",
      "animesaturn.to",
      "animesaturn.cc",
      "animesaturn.so",
      "www.animesaturn.net",
      "sub.animesaturn.me",
      "play.saturncdn.net",
      "saturncdn.cx"
    ]) {
      assert.equal(detectProviderName(host), "AnimeSaturn", `Expected AnimeSaturn for ${host}`);
    }
  });

  it("returns null for unrelated, lookalike, or empty hostnames", () => {
    for (const host of [
      "",
      null,
      undefined,
      "anilist.co",
      "example.com",
      "notanimeunity.cx",
      "fake-animesaturn.net"
    ]) {
      assert.equal(detectProviderName(host), null, `Expected null for ${String(host)}`);
    }
  });
});

describe("cross-switch getCandidateBaseUrls", () => {
  it("prioritizes stored base URL, then current hostname TLD, then fallback TLDs without duplicates", () => {
    const urls = getCandidateBaseUrls("AnimeSaturn", "https://www.animesaturn.cc/", "www.animeunity.cx");
    assert.equal(urls[0], "https://www.animesaturn.cc");
    assert.equal(urls[1], "https://www.animesaturn.cx");
    assert.equal(new Set(urls).size, urls.length);
  });

  it("uses current TLD first when no stored base URL is available", () => {
    const urls = getCandidateBaseUrls("AnimeUnity", "", "www.animesaturn.to");
    assert.equal(urls[0], "https://www.animeunity.to");
    assert.ok(urls.includes("https://www.animeunity.cx"));
  });
});
