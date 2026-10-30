import { Storage } from "../shared/storage.js";

const listeners = new Set();

export const Settings = {
  get() {
    const autoTrack = Storage.get("al_opt_autotrack");
    const delay = Storage.get("al_opt_autodelay");
    const trackTrigger = Storage.get("al_pref_track_trigger");
    const completionThreshold = Storage.get("al_pref_completion_threshold");
    const autoResume = Storage.get("al_pref_autoresume");
    const crossDeviceSync = Storage.get("al_pref_cross_device_sync");
    const searchAutoSelectDelay = Storage.get("al_pref_search_autoselect");
    const defaultBuddy = Storage.get("al_pref_default_buddy");
    const autoSkip = Storage.get("al_opt_autoskip");
    const skipFallback = Storage.get("al_opt_skip_fallback");
    const shelfFilterUnwatched = Storage.get("al_shelf_filter_unwatched");
    const shelfFilterSync = Storage.get("al_shelf_filter_sync");

    // Determine track trigger: defaults to "completion" (smart 85% completion)
    let effectiveTrigger = "completion";
    if (trackTrigger) {
      effectiveTrigger = trackTrigger;
    } else if (autoTrack === false || autoTrack === "false") {
      effectiveTrigger = "manual";
    }

    return {
      autoTrack: effectiveTrigger !== "manual",
      trackTrigger: effectiveTrigger,
      completionThreshold: completionThreshold !== null && completionThreshold !== undefined && !isNaN(parseInt(completionThreshold, 10))
        ? parseInt(completionThreshold, 10)
        : 85,
      autoResume: autoResume !== false && autoResume !== "false",
      crossDeviceSync: crossDeviceSync !== false && crossDeviceSync !== "false",
      delay: delay !== null && delay !== undefined && !isNaN(parseInt(delay, 10)) ? parseInt(delay, 10) : 15,
      preventRewind: false, // Standardized: always false
      autoSkip: autoSkip === true || autoSkip === "true",
      skipFallbackDuration: skipFallback !== null && skipFallback !== undefined && !isNaN(parseInt(skipFallback, 10))
        ? parseInt(skipFallback, 10)
        : 85,
      language: Storage.get("al_pref_language") || "sub",
      homeShelf: true, // Always enabled
      shelfFilterUnwatched: shelfFilterUnwatched === true || shelfFilterUnwatched === "true",
      shelfFilterSync: shelfFilterSync === true || shelfFilterSync === "true",
      searchAutoSelectDelay: searchAutoSelectDelay !== null && searchAutoSelectDelay !== undefined
        ? parseInt(searchAutoSelectDelay, 10)
        : 5,
      defaultBuddy: defaultBuddy ? String(defaultBuddy).trim() : ""
    };
  },

  set(key, val) {
    if (key === "autoTrack") {
      Storage.set("al_opt_autotrack", String(val));
      if (!val) Storage.set("al_pref_track_trigger", "manual");
      else if (Storage.get("al_pref_track_trigger") === "manual") Storage.set("al_pref_track_trigger", "completion");
    }
    else if (key === "trackTrigger") {
      Storage.set("al_pref_track_trigger", String(val));
      Storage.set("al_opt_autotrack", String(val !== "manual"));
    }
    else if (key === "completionThreshold") Storage.set("al_pref_completion_threshold", String(val));
    else if (key === "autoResume") Storage.set("al_pref_autoresume", String(val));
    else if (key === "crossDeviceSync") Storage.set("al_pref_cross_device_sync", String(val));
    else if (key === "delay") Storage.set("al_opt_autodelay", String(val));
    else if (key === "autoSkip") Storage.set("al_opt_autoskip", String(val));
    else if (key === "skipFallbackDuration") Storage.set("al_opt_skip_fallback", String(val));
    else if (key === "language") {
      Storage.set("al_pref_language", String(val));
      Storage.del("al_au_map");
      Storage.del("al_as_map");
    }
    else if (key === "shelfFilterUnwatched") Storage.set("al_shelf_filter_unwatched", String(val));
    else if (key === "shelfFilterSync") Storage.set("al_shelf_filter_sync", String(val));
    else if (key === "searchAutoSelectDelay") Storage.set("al_pref_search_autoselect", String(val));
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
