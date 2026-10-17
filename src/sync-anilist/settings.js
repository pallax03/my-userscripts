import { Storage } from "../shared/storage.js";

const listeners = new Set();

export const Settings = {
  get() {
    const autoTrack = Storage.get("al_opt_autotrack");
    const delay = Storage.get("al_opt_autodelay");
    const preventRewind = Storage.get("al_opt_prevent_rewind");
    const homeShelf = Storage.get("al_home_shelf_enabled");
    const homeOnlyUnwatched = Storage.get("al_pref_default_unwatched");
    const searchAutoSelectDelay = Storage.get("al_pref_search_autoselect");

    return {
      autoTrack: autoTrack === true || autoTrack === "true",
      delay: parseInt(delay, 10) || 15,
      preventRewind: preventRewind !== false && preventRewind !== "false",
      language: Storage.get("al_pref_language") || "sub",
      homeShelf: homeShelf !== false && homeShelf !== "false",
      homeOnlyUnwatched: homeOnlyUnwatched === true || homeOnlyUnwatched === "true",
      searchAutoSelectDelay: searchAutoSelectDelay !== null && searchAutoSelectDelay !== undefined
        ? parseInt(searchAutoSelectDelay, 10)
        : 5
    };
  },

  set(key, val) {
    if (key === "autoTrack") Storage.set("al_opt_autotrack", String(val));
    else if (key === "delay") Storage.set("al_opt_autodelay", String(val));
    else if (key === "preventRewind") Storage.set("al_opt_prevent_rewind", String(val));
    else if (key === "language") {
      Storage.set("al_pref_language", String(val));
      // Invalidate full URL mapping cache so all series re-resolve with new audio preference
      Storage.del("al_au_map");
    }
    else if (key === "homeShelf") Storage.set("al_home_shelf_enabled", String(val));
    else if (key === "homeOnlyUnwatched") Storage.set("al_pref_default_unwatched", String(val));
    else if (key === "searchAutoSelectDelay") Storage.set("al_pref_search_autoselect", String(val));

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
