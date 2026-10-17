import { Storage } from "../shared/storage.js";

const listeners = new Set();

export const Settings = {
  get() {
    return {
      autoTrack: Storage.get("al_opt_autotrack") === "true",
      delay: parseInt(Storage.get("al_opt_autodelay"), 10) || 15,
      preventRewind: Storage.get("al_opt_prevent_rewind") !== "false",
      language: Storage.get("al_pref_language") || "sub",
      homeShelf: Storage.get("al_home_shelf_enabled") !== "false",
      homeOnlyUnwatched: Storage.get("al_home_only_unwatched") === true
    };
  },

  set(key, val) {
    if (key === "autoTrack") Storage.set("al_opt_autotrack", String(val));
    else if (key === "delay") Storage.set("al_opt_autodelay", String(val));
    else if (key === "preventRewind") Storage.set("al_opt_prevent_rewind", String(val));
    else if (key === "language") {
      Storage.set("al_pref_language", String(val));
      // Invalidate alternative dub cache
      const map = Storage.get("al_au_map") || {};
      Object.keys(map).forEach((k) => {
        if (map[k].hasAlternativeDub) delete map[k];
      });
      Storage.set("al_au_map", map);
    }
    else if (key === "homeShelf") Storage.set("al_home_shelf_enabled", String(val));
    else if (key === "homeOnlyUnwatched") Storage.set("al_home_only_unwatched", Boolean(val));

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
