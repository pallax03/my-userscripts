import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { shouldAutoTrack, computeProgressUpdate } from "../src/sync-anilist/domain/tracking.js";

describe("domain/tracking shouldAutoTrack", () => {
  it("tracks next episode at >= 85% or ended, and blocks older episodes", () => {
    assert.equal(shouldAutoTrack({ activeEp: 6, trackedProgress: 5, status: "CURRENT", percent: 85 }), true);
    assert.equal(shouldAutoTrack({ activeEp: 6, trackedProgress: 5, status: "CURRENT", percent: 84, isEnded: false }), false);
    assert.equal(shouldAutoTrack({ activeEp: 6, trackedProgress: 5, status: "CURRENT", percent: 50, isEnded: true }), true);
    assert.equal(shouldAutoTrack({ activeEp: 3, trackedProgress: 5, status: "CURRENT", percent: 95 }), false);
  });

  it("allows REPEATING rewatch on any episode, and COMPLETED auto-rewatch ONLY on Ep. 1", () => {
    assert.equal(shouldAutoTrack({ activeEp: 4, trackedProgress: 12, status: "REPEATING", percent: 86 }), true);
    assert.equal(shouldAutoTrack({ activeEp: 1, trackedProgress: 12, status: "COMPLETED", percent: 86 }), true);
    assert.equal(shouldAutoTrack({ activeEp: 5, trackedProgress: 12, status: "COMPLETED", percent: 95 }), false);
  });

  it("auto-adds untracked anime at Ep. 1 >= 85%", () => {
    assert.equal(shouldAutoTrack({ activeEp: 1, trackedProgress: -1, status: null, percent: 85 }), true);
    assert.equal(shouldAutoTrack({ activeEp: 1, trackedProgress: -1, status: null, percent: 30 }), false);
  });
});

describe("domain/tracking computeProgressUpdate", () => {
  const today = { year: 2026, month: 11, day: 19 };

  it("sets CURRENT on untracked Ep. 1 and REPEATING when finishing Ep. 1 of COMPLETED anime", () => {
    const newAnime = computeProgressUpdate({ mediaId: 21, newProgress: 1, totalEp: 24, entry: null, today });
    assert.equal(newAnime.params.status, "CURRENT");
    assert.equal(newAnime.params.progress, 1);
    assert.deepEqual(newAnime.params.startedAt, today);

    const rewatchStart = computeProgressUpdate({
      mediaId: 21,
      newProgress: 1,
      totalEp: 12,
      entry: { status: "COMPLETED", progress: 12, startedAt: { year: 2025, month: 1, day: 1 } },
      today
    });
    assert.equal(rewatchStart.params.status, "REPEATING");
    assert.equal(rewatchStart.params.progress, 1);
    assert.equal(rewatchStart.isRewatching, true);
  });

  it("increments repeat count when completing a REPEATING anime", () => {
    const done = computeProgressUpdate({
      mediaId: 21,
      newProgress: 12,
      totalEp: 12,
      entry: { status: "REPEATING", progress: 11, repeat: 1, startedAt: { year: 2025 } },
      today
    });
    assert.equal(done.params.status, "COMPLETED");
    assert.equal(done.params.repeat, 2);
    assert.deepEqual(done.params.completedAt, today);
  });
});
