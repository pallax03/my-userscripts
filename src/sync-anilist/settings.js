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
    const communityAniSkip = Storage.get("al_pref_community_aniskip");
    const shelfFilterUnwatched = Storage.get("al_shelf_filter_unwatched");
    const shelfFilterSync = Storage.get("al_shelf_filter_sync");

    // Determine track trigger: defaults to "delay" (countdown delay)
    let effectiveTrigger = "delay";
    if (trackTrigger && trackTrigger !== "play" && trackTrigger !== "manual") {
      effectiveTrigger = trackTrigger;
    } else if (autoTrack === false || autoTrack === "false" || trackTrigger === "manual") {
      effectiveTrigger = "manual";
    }

    const isAutoResumeActive = autoResume !== false && autoResume !== "false";

    return {
      autoTrack: effectiveTrigger !== "manual",
      trackTrigger: effectiveTrigger,
      completionThreshold: completionThreshold !== null && completionThreshold !== undefined && !isNaN(parseInt(completionThreshold, 10))
        ? parseInt(completionThreshold, 10)
        : 85,
      autoResume: isAutoResumeActive,
      crossDeviceSync: isAutoResumeActive,
      delay: delay !== null && delay !== undefined && !isNaN(parseInt(delay, 10)) ? parseInt(delay, 10) : 15,
      preventRewind: false, // Standardized: always false
      autoSkip: autoSkip === true || autoSkip === "true",
      communityAniSkip: communityAniSkip !== false && communityAniSkip !== "false",
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
      else if (Storage.get("al_pref_track_trigger") === "manual" || !Storage.get("al_pref_track_trigger")) Storage.set("al_pref_track_trigger", "delay");
    }
    else if (key === "trackTrigger") {
      Storage.set("al_pref_track_trigger", String(val));
      Storage.set("al_opt_autotrack", String(val !== "manual"));
    }
    else if (key === "completionThreshold") Storage.set("al_pref_completion_threshold", String(val));
    else if (key === "autoResume") {
      Storage.set("al_pref_autoresume", String(val));
      Storage.set("al_pref_cross_device_sync", String(val));
    }
    else if (key === "crossDeviceSync") {
      Storage.set("al_pref_cross_device_sync", String(val));
      Storage.set("al_pref_autoresume", String(val));
    }
    else if (key === "delay") Storage.set("al_opt_autodelay", String(val));
    else if (key === "autoSkip") Storage.set("al_opt_autoskip", String(val));
    else if (key === "communityAniSkip") Storage.set("al_pref_community_aniskip", String(val));
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
