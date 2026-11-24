import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { deriveDockState } from "../src/sync-anilist/dock-model.js";

describe("dock-model deriveDockState", () => {
  const baseMedia = { id: 21, episodes: 1122 };

  it("never marks Detail page (activeEp: 0, isWatch: false) as watched/past", () => {
    const state = deriveDockState({
      media: { ...baseMedia, mediaListEntry: { status: "CURRENT", progress: 5 } },
      activeEp: 0,
      isWatch: false
    });
    assert.equal(state.isWatchEp, false);
    assert.equal(state.isPast, false);
    assert.equal(state.isCurrentTracked, false);
    assert.equal(state.episodeMode, "detail");
  });

  it("treats REPEATING (rewatch) episodes <= progress as pending, never as watched", () => {
    const state = deriveDockState({
      media: { ...baseMedia, mediaListEntry: { status: "REPEATING", progress: 12 } },
      activeEp: 3,
      isWatch: true
    });
    assert.equal(state.isRewatching, true);
    assert.equal(state.isPast, false);
    assert.equal(state.isCurrentTracked, false);
    assert.equal(state.isAhead, true);
    assert.equal(state.episodeMode, "pending");
  });

  it("marks Watch episode as tracked when activeEp === progress in CURRENT", () => {
    const state = deriveDockState({
      media: { ...baseMedia, mediaListEntry: { status: "CURRENT", progress: 6 } },
      activeEp: 6,
      isWatch: true
    });
    assert.equal(state.episodeMode, "tracked");
  });

  it("enables buddy sync button only when buddy is ahead, completed, or has ahead resume", () => {
    const ahead = deriveDockState({
      media: { ...baseMedia, mediaListEntry: { status: "CURRENT", progress: 5 } },
      buddyData: { name: "brother", progress: 7, isCompleted: false }
    });
    const behind = deriveDockState({
      media: { ...baseMedia, mediaListEntry: { status: "CURRENT", progress: 7 } },
      buddyData: { name: "brother", progress: 5, isCompleted: false }
    });
    const sameEpResume = deriveDockState({
      media: { ...baseMedia, mediaListEntry: { status: "CURRENT", progress: 5 } },
      myResume: { ep: 6, time: 60, duration: 1440, percent: 4 },
      buddyData: {
        name: "brother",
        progress: 5,
        isCompleted: false,
        resume: { ep: 6, time: 360, duration: 1440, percent: 25 }
      }
    });
    assert.equal(ahead.canSyncBuddy, true);
    assert.equal(ahead.buddySyncKind, "episode");
    assert.equal(behind.canSyncBuddy, false);
    assert.equal(sameEpResume.canSyncBuddy, true);
    assert.equal(sameEpResume.buddySyncKind, "resume");
  });

  it("computes canDecrement and canIncrement bounds for AniList stepper", () => {
    const atZero = deriveDockState({
      media: { id: 1, episodes: 12, mediaListEntry: { status: "CURRENT", progress: 0 } }
    });
    const atTotal = deriveDockState({
      media: { id: 1, episodes: 12, mediaListEntry: { status: "CURRENT", progress: 12 } }
    });
    assert.equal(atZero.canDecrement, false);
    assert.equal(atZero.canIncrement, true);
    assert.equal(atTotal.canDecrement, true);
    assert.equal(atTotal.canIncrement, false);
  });
});
