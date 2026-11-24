import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { Buddy, computeBuddySyncState } from "../src/sync-anilist/buddy.js";
import { Resume, resolveResumeAction } from "../src/sync-anilist/resume.js";

function installMemoryLocalStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k)
  };
}

describe("Buddy notes", () => {
  it("extracts and applies [sync:username] while preserving user notes", () => {
    assert.equal(Buddy.extract("Great show [sync:pallax]"), "pallax");
    assert.equal(Buddy.extract("No buddy tag here"), null);
    assert.equal(Buddy.extract(null), null);

    assert.equal(Buddy.apply("", "pallax"), "[sync:pallax]");
    assert.equal(Buddy.apply("Great show [sync:old]", "new_user"), "Great show [sync:new_user]");
    assert.equal(Buddy.apply("Great show [sync:old]", ""), "Great show");
  });
});

describe("Resume notes & formatting", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  it("extracts, applies, and clears [resume:...] while preserving [sync:...] tags", () => {
    const notes = "Watched with friend [sync:pallax] [resume:ep=4,t=312,d=1440]";
    const parsed = Resume.extract(notes);
    assert.deepEqual(parsed, { ep: 4, time: 312, duration: 1440, percent: 22 });

    const updated = Resume.apply("Watched [sync:pallax]", { ep: 5, time: 120.4, duration: 1440.2 });
    assert.equal(updated, "Watched [sync:pallax] [resume:ep=5,t=120,d=1440]");

    assert.equal(Resume.clear(updated), "Watched [sync:pallax]");
    assert.equal(Resume.extract("no tag"), null);
  });

  it("formats seconds cleanly", () => {
    assert.equal(Resume.formatTime(0), "0:00");
    assert.equal(Resume.formatTime(-5), "0:00");
    assert.equal(Resume.formatTime(65), "1:05");
    assert.equal(Resume.formatTime(3665), "1:01:05");
  });

  it("reads, writes, and clears local resume cache", () => {
    Resume.setLocal(123, { ep: 2, time: 90, duration: 1400, percent: 6 });
    const cached = Resume.getLocal(123);
    assert.equal(cached.ep, 2);
    assert.equal(cached.time, 90);
    assert.ok(typeof cached.updatedAt === "number");

    Resume.clearLocal(123);
    assert.equal(Resume.getLocal(123), null);
  });
});

describe("resolveResumeAction", () => {
  it("allows only the immediate next unwatched episode and blocks watched/past/future episodes", () => {
    const validResume = { ep: 6, time: 300, duration: 1400, percent: 21 };

    // Immediate next unwatched episode (5 -> 6) is eligible
    assert.deepEqual(
      resolveResumeAction({ trackedProgress: 5, activeEp: 6, localResume: validResume }),
      { action: "seek", time: 300 }
    );
    // Already-watched episode (ep 5 when progress is 5) is ineligible
    assert.deepEqual(
      resolveResumeAction({ trackedProgress: 5, activeEp: 5, localResume: { ...validResume, ep: 5 } }),
      { action: "none", reason: "ineligible_episode" }
    );
    // Older rewatched episode is ineligible
    assert.deepEqual(
      resolveResumeAction({ trackedProgress: 5, activeEp: 3, localResume: { ...validResume, ep: 3 } }),
      { action: "none", reason: "ineligible_episode" }
    );

    // Future episode
    assert.deepEqual(
      resolveResumeAction({ trackedProgress: 5, activeEp: 7, localResume: { ...validResume, ep: 7 } }),
      { action: "none", reason: "ineligible_episode" }
    );

    // Untracked (-1) disallows Ep. 2+, and invalid episode 0 is disallowed
    assert.deepEqual(
      resolveResumeAction({ trackedProgress: -1, activeEp: 2, localResume: { ...validResume, ep: 2 } }),
      { action: "none", reason: "ineligible_episode" }
    );
    assert.deepEqual(
      resolveResumeAction({ trackedProgress: 0, activeEp: 0, localResume: { ...validResume, ep: 0 } }),
      { action: "none", reason: "ineligible_episode" }
    );
  });

  it("allows local-only resume on Ep. 1 when untracked, and blocks COMPLETED already-watched episodes", () => {
    assert.deepEqual(
      resolveResumeAction({
        trackedProgress: -1,
        activeEp: 1,
        localResume: { ep: 1, time: 240, duration: 1440, percent: 17 }
      }),
      { action: "seek", time: 240 }
    );
    assert.deepEqual(
      resolveResumeAction({
        trackedProgress: 12,
        activeEp: 1,
        status: "COMPLETED",
        localResume: { ep: 1, time: 300, duration: 1440, percent: 21 }
      }),
      { action: "none", reason: "ineligible_episode" }
    );
  });

  it("yields to native site resume or active playback when currentTime > 5", () => {
    const localResume = { ep: 6, time: 300, duration: 1400, percent: 21 };
    assert.deepEqual(
      resolveResumeAction({ trackedProgress: 5, activeEp: 6, currentTime: 6, localResume }),
      { action: "yield", reason: "already_playing" }
    );
    assert.deepEqual(
      resolveResumeAction({ trackedProgress: 5, activeEp: 6, currentTime: 5, localResume }),
      { action: "seek", time: 300 }
    );
  });

  it("picks localResume when valid and fresher/equal, or falls back to anilistResume", () => {
    const localResume = { ep: 1, time: 240, duration: 1440, percent: 17 };
    const anilistResume = { ep: 1, time: 180, duration: 1440, percent: 13 };

    assert.deepEqual(
      resolveResumeAction({ trackedProgress: 0, activeEp: 1, localResume, anilistResume }),
      { action: "seek", time: 240 }
    );

    // Cross-device anilistResume is further ahead than localResume
    assert.deepEqual(
      resolveResumeAction({
        trackedProgress: 0,
        activeEp: 1,
        localResume: { ep: 1, time: 120, duration: 1440, percent: 8 },
        anilistResume: { ep: 1, time: 400, duration: 1440, percent: 28 }
      }),
      { action: "seek", time: 400 }
    );

    // localResume is for a wrong ep -> falls back to anilistResume
    assert.deepEqual(
      resolveResumeAction({
        trackedProgress: 4,
        activeEp: 5,
        localResume: { ep: 4, time: 500, duration: 1440, percent: 35 },
        anilistResume: { ep: 5, time: 210, duration: 1440, percent: 15 }
      }),
      { action: "seek", time: 210 }
    );
  });

  it("ignores resumes with time <= 10 or percent >= 90", () => {
    assert.deepEqual(
      resolveResumeAction({
        trackedProgress: 2,
        activeEp: 3,
        localResume: { ep: 3, time: 10, duration: 1440, percent: 1 },
        anilistResume: { ep: 3, time: 1300, duration: 1440, percent: 90 }
      }),
      { action: "none", reason: "no_valid_resume" }
    );

    // Computes percent from time/duration when percent is omitted
    assert.deepEqual(
      resolveResumeAction({
        trackedProgress: 2,
        activeEp: 3,
        localResume: { ep: 3, time: 1350, duration: 1440 }
      }),
      { action: "none", reason: "no_valid_resume" }
    );
  });
});

describe("computeBuddySyncState", () => {
  it("detects same-episode buddy resume when ahead by > 10s", () => {
    const res = computeBuddySyncState({
      myProgress: 4,
      myStatus: "CURRENT",
      myResume: { ep: 5, time: 120, duration: 1440, percent: 8 },
      buddyProgress: 4,
      buddyStatus: "CURRENT",
      buddyResume: { ep: 5, time: 450, duration: 1440, percent: 31 }
    });
    assert.equal(res.canSync, true);
    assert.equal(res.syncKind, "resume");
    assert.equal(res.canSyncResume, true);
    assert.deepEqual(res.resumeToApply, { ep: 5, time: 450, duration: 1440, percent: 31 });
  });

  it("ignores same-episode buddy resume when within 10s or behind", () => {
    const res = computeBuddySyncState({
      myProgress: 4,
      myStatus: "CURRENT",
      myResume: { ep: 5, time: 445, duration: 1440, percent: 31 },
      buddyProgress: 4,
      buddyStatus: "CURRENT",
      buddyResume: { ep: 5, time: 450, duration: 1440, percent: 31 }
    });
    assert.equal(res.canSync, false);
    assert.equal(res.syncKind, "none");
    assert.equal(res.resumeToApply, null);
  });

  it("carries buddy resume when syncing ahead on episodes", () => {
    const res = computeBuddySyncState({
      myProgress: 2,
      myStatus: "CURRENT",
      buddyProgress: 5,
      buddyStatus: "CURRENT",
      buddyResume: { ep: 6, time: 300, duration: 1440, percent: 21 }
    });
    assert.equal(res.canSync, true);
    assert.equal(res.syncKind, "episode");
    assert.equal(res.isEpAhead, true);
    assert.deepEqual(res.resumeToApply, { ep: 6, time: 300, duration: 1440, percent: 21 });
  });

  it("returns completed syncKind without resume when buddy completed", () => {
    const res = computeBuddySyncState({
      myProgress: 10,
      myStatus: "CURRENT",
      buddyProgress: 12,
      buddyStatus: "COMPLETED",
      buddyIsCompleted: true,
      buddyResume: { ep: 13, time: 100, duration: 1440, percent: 7 }
    });
    assert.equal(res.canSync, true);
    assert.equal(res.syncKind, "completed");
    assert.equal(res.resumeToApply, null);
  });
});
