const LOG_ENDPOINT = "http://127.0.0.1:9876/log";

// In-memory buffer of recent logs
if (!window.__AU_LOGS__) window.__AU_LOGS__ = [];

function emit(level, message, data) {
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    data
  };

  window.__AU_LOGS__.push(entry);
  if (window.__AU_LOGS__.length > 100) window.__AU_LOGS__.shift();

  // Console output
  const prefix = `[AU-Sync]`;
  if (level === "ERROR") {
    console.error(prefix, message, data || "");
  } else if (level === "WARN") {
    console.warn(prefix, message, data || "");
  } else {
    console.log(prefix, message, data || "");
  }

  // Stream to local log bridge if active
  try {
    const payload = JSON.stringify({ level, message, data });
    if (typeof GM_xmlhttpRequest === "function") {
      GM_xmlhttpRequest({
        method: "POST",
        url: LOG_ENDPOINT,
        headers: { "Content-Type": "application/json" },
        data: payload,
        timeout: 1000,
        onerror: () => {},
        ontimeout: () => {}
      });
    } else {
      fetch(LOG_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload
      }).catch(() => {});
    }
  } catch (_) {}
}

export const Logger = {
  info: (msg, data) => emit("INFO", msg, data),
  warn: (msg, data) => emit("WARN", msg, data),
  error: (msg, data) => emit("ERROR", msg, data),
  getLogs: () => [...window.__AU_LOGS__]
};
