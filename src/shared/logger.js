/**
 * Shared logger with postMessage subframe bridging.
 * Logs originating in subframes (e.g. video player iframes) are forwarded
 * to window.top so all messages appear together in the primary browser console.
 */

if (window.self === window.top && !window.__AU_LOGGER_INIT__) {
  window.__AU_LOGGER_INIT__ = true;
  window.addEventListener("message", (e) => {
    if (e.data?.type === "AU_LOG_BRIDGE") {
      const { prefix, level, msg, data } = e.data;
      const tag = `%c${prefix}%c`;
      const tagStyle = "color: #38bdf8; font-weight: bold;";
      const resetStyle = "color: inherit;";
      if (level === "error") {
        console.error(tag, tagStyle, resetStyle, msg, data !== undefined ? data : "");
      } else if (level === "warn") {
        console.warn(tag, tagStyle, resetStyle, msg, data !== undefined ? data : "");
      } else {
        console.log(tag, tagStyle, resetStyle, msg, data !== undefined ? data : "");
      }
    }
  });
}

export function createLogger(prefix = "[AU]") {
  const isTop = window.self === window.top;

  function logMessage(level, msg, data) {
    if (isTop) {
      const tag = `%c${prefix}%c`;
      const tagStyle = "color: #38bdf8; font-weight: bold;";
      const resetStyle = "color: inherit;";
      if (level === "error") {
        console.error(tag, tagStyle, resetStyle, msg, data !== undefined ? data : "");
      } else if (level === "warn") {
        console.warn(tag, tagStyle, resetStyle, msg, data !== undefined ? data : "");
      } else {
        console.log(tag, tagStyle, resetStyle, msg, data !== undefined ? data : "");
      }
    } else {
      try {
        window.top.postMessage({
          type: "AU_LOG_BRIDGE",
          prefix,
          level,
          msg,
          data: typeof data === "object" ? JSON.parse(JSON.stringify(data)) : data
        }, "*");
      } catch (_) {}
    }
  }

  return {
    info: (msg, data) => logMessage("info", msg, data),
    warn: (msg, data) => logMessage("warn", msg, data),
    error: (msg, data) => logMessage("error", msg, data)
  };
}

export const Logger = createLogger("[AU-Sync]");

