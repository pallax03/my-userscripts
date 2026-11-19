import { Storage } from "../shared/storage.js";

const listeners = new Set();

export const Settings = {
  get() {
    const defaultBuddy = Storage.get("al_pref_default_buddy");
    const autoSkip = Storage.get("al_opt_autoskip");
    const shelfFilterUnwatched = Storage.get("al_shelf_filter_unwatched");
    const shelfFilterSync = Storage.get("al_shelf_filter_sync");

    return {
      autoTrack: true, // Fixed at 85% Video Completion
      trackTrigger: "completion",
      completionThreshold: 85,
      autoResume: true,
      crossDeviceSync: true,
      delay: 0,
      preventRewind: false, // Standardized: always false
      autoSkip: autoSkip === true || autoSkip === "true",
      communityAniSkip: true,
      skipFallbackDuration: 85,
      language: "sub",
      homeShelf: true, // Always enabled
      shelfFilterUnwatched: shelfFilterUnwatched === true || shelfFilterUnwatched === "true",
      shelfFilterSync: shelfFilterSync === true || shelfFilterSync === "true",
      searchAutoSelectDelay: 5,
      defaultBuddy: defaultBuddy ? String(defaultBuddy).trim() : ""
    };
  },

  set(key, val) {
    if (key === "autoSkip") Storage.set("al_opt_autoskip", String(val));
    else if (key === "shelfFilterUnwatched") Storage.set("al_shelf_filter_unwatched", String(val));
    else if (key === "shelfFilterSync") Storage.set("al_shelf_filter_sync", String(val));
    else if (key === "defaultBuddy") Storage.set("al_pref_default_buddy", String(val || "").trim());

    const current = Settings.get();
    listeners.forEach((fn) => {
      try { fn(current); } catch (_) {}
    });
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
};
