export const Storage = {
  get: (k) => {
    try {
      if (typeof GM_getValue === "function") {
        const val = GM_getValue(k);
        if (val !== undefined && val !== null) return val;
      }
    } catch (_) {}
    try {
      return localStorage.getItem(k);
    } catch (_) {
      return null;
    }
  },

  set: (k, v) => {
    try { if (typeof GM_setValue === "function") GM_setValue(k, v); } catch (_) {}
    try { localStorage.setItem(k, v); } catch (_) {}
  },

  del: (k) => {
    try { if (typeof GM_deleteValue === "function") GM_deleteValue(k); } catch (_) {}
    try { localStorage.removeItem(k); } catch (_) {}
  }
};
