import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveSkipSegment, resolveManualSkipTarget } from "../src/sync-anilist/skip-logic.js";

describe("resolveSkipSegment (AniSkip -> Native intro priority)", () => {
  it("prioritizes AniSkip segment over native intro when both are present", () => {
    const aniskipOp = { start: 12, end: 102, skipType: "op", skipId: "abc" };
    const nativeIntro = { start: 10, end: 95 };

    const resolved = resolveSkipSegment({ aniskipOp, nativeIntro });
    assert.deepEqual(resolved, {
      start: 12,
      end: 102,
      skipType: "op",
      skipId: "abc",
      source: "aniskip"
    });
  });

  it("falls back to native intro when AniSkip segment is null or invalid", () => {
    const nativeIntro = { start: 15, end: 105 };

    assert.deepEqual(resolveSkipSegment({ aniskipOp: null, nativeIntro }), {
      start: 15,
      end: 105,
      source: "native"
    });

    assert.deepEqual(resolveSkipSegment({ aniskipOp: { start: 50, end: 50 }, nativeIntro }), {
      start: 15,
      end: 105,
      source: "native"
    });
  });

  it("returns null when neither AniSkip nor native intro is valid", () => {
    assert.equal(resolveSkipSegment({ aniskipOp: null, nativeIntro: null }), null);
    assert.equal(
      resolveSkipSegment({ aniskipOp: { start: 90, end: 80 }, nativeIntro: { start: 10, end: 10 } }),
      null
    );
    assert.equal(resolveSkipSegment(), null);
  });
});

describe("resolveManualSkipTarget (S key skip behavior)", () => {
  it("skips to segment.end - 1 when inside the active intro window", () => {
    const segment = { start: 20, end: 110, source: "aniskip" };

    assert.deepEqual(
      resolveManualSkipTarget({ currentPos: 25, duration: 1440, segment }),
      { target: 109, mode: "segment", source: "aniskip" }
    );

    // Within 1.5s pre-intro grace window
    assert.deepEqual(
      resolveManualSkipTarget({ currentPos: 18.5, duration: 1440, segment }),
      { target: 109, mode: "segment", source: "aniskip" }
    );
  });

  it("skips using native intro segment when AniSkip is absent", () => {
    const segment = resolveSkipSegment({
      aniskipOp: null,
      nativeIntro: { start: 0, end: 90 }
    });

    assert.deepEqual(
      resolveManualSkipTarget({ currentPos: 0, duration: 1440, segment }),
      { target: 89, mode: "segment", source: "native" }
    );
  });

  it("falls back to +85s when outside the intro window or when no segment exists", () => {
    const segment = { start: 20, end: 110, source: "aniskip" };

    // Outside intro window (past segment.end - 2)
    assert.deepEqual(
      resolveManualSkipTarget({ currentPos: 300, duration: 1440, segment }),
      { target: 385, mode: "fallback", source: "fallback" }
    );

    // No segment at all
    assert.deepEqual(
      resolveManualSkipTarget({ currentPos: 10, duration: 1440, segment: null }),
      { target: 95, mode: "fallback", source: "fallback" }
    );
  });

  it("clamps +85s fallback to duration - 1 and respects custom fallbackDuration", () => {
    assert.deepEqual(
      resolveManualSkipTarget({ currentPos: 1380, duration: 1440, segment: null }),
      { target: 1439, mode: "fallback", source: "fallback" }
    );

    assert.deepEqual(
      resolveManualSkipTarget({ currentPos: 100, duration: 1440, segment: null, fallbackDuration: 90 }),
      { target: 190, mode: "fallback", source: "fallback" }
    );
  });
});
