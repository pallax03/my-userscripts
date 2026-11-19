import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { Buddy } from "../src/sync-anilist/buddy.js";
import { Resume } from "../src/sync-anilist/resume.js";

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
