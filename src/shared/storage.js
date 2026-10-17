export const Storage = {
  get: (k) => {
    let raw = null;
    try {
      if (typeof GM_getValue === "function") {
        const val = GM_getValue(k);
        if (val !== undefined && val !== null) {
          if (typeof val === "object") return val;
          raw = val;
        }
      }
    } catch (_) {}

    if (raw === null) {
      try {
        raw = localStorage.getItem(k);
      } catch (_) {
        return null;
      }
    }

    if (raw === null || raw === undefined) return null;
    if (typeof raw === "string") {
      if (raw === "[object Object]") return null; // Corrupted legacy storage
      try {
        return JSON.parse(raw);
      } catch (_) {
        return raw;
      }
    }
    return raw;
  },

  set: (k, v) => {
    const isObj = typeof v === "object" && v !== null;
    const strVal = isObj ? JSON.stringify(v) : String(v);

    try {
      if (typeof GM_setValue === "function") {
        GM_setValue(k, strVal);
      }
    } catch (_) {}

    try {
      localStorage.setItem(k, strVal);
    } catch (_) {}
  },

  del: (k) => {
    try { if (typeof GM_deleteValue === "function") GM_deleteValue(k); } catch (_) {}
    try { localStorage.removeItem(k); } catch (_) {}
  }
};
