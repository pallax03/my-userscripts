import { Storage } from "../shared/storage.js";

const listeners = new Set();

export const Settings = {
  get() {
    return {
      autoTrack: Storage.get("al_opt_autotrack") === "true",
      delay: parseInt(Storage.get("al_opt_autodelay"), 10) || 15,
      preventRewind: Storage.get("al_opt_prevent_rewind") !== "false"
    };
  },

  set(key, val) {
    if (key === "autoTrack") Storage.set("al_opt_autotrack", String(val));
    else if (key === "delay") Storage.set("al_opt_autodelay", String(val));
    else if (key === "preventRewind") Storage.set("al_opt_prevent_rewind", String(val));

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
