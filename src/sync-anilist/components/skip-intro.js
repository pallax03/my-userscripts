import { Settings } from "../settings.js";
import { Logger } from "../../shared/logger.js";

const cache = new Map();
let activeMalId = null;
let activeEp = null;
let activeOp = null;
let activeDuration = 0;
let fetchToken = 0;

export function broadcastOp() {
  const settings = Settings.get();
  const msg = {
    type: "AU_SKIP_OP",
    op: activeOp,
    autoSkip: settings.autoSkip,
    skipFallbackDuration: settings.skipFallbackDuration
  };
  document.querySelectorAll("iframe").forEach((frame) => {
    try {
      frame.contentWindow?.postMessage(msg, "*");
    } catch (_) {}
  });
}

export async function checkSkipIntro(malId, epNum, duration = 0) {
  if (!malId || !epNum) return;

  const roundedDur = Math.round(duration || 0);
  const isNew = malId !== activeMalId || epNum !== activeEp;

  if (isNew) {
    activeMalId = malId;
    activeEp = epNum;
    activeDuration = roundedDur;
    activeOp = null;
    broadcastOp();
  } else if (roundedDur > 0) {
    activeDuration = roundedDur;
  }

  const cacheKey = `${malId}_${epNum}`;
  if (cache.has(cacheKey)) {
    activeOp = cache.get(cacheKey);
    broadcastOp();
    return;
  }

  const token = ++fetchToken;
  try {
    const res = await fetch(
      `https://api.aniskip.com/v2/skip-times/${malId}/${epNum}?types=op&episodeLength=${activeDuration}`
    );

    if (token !== fetchToken) return;

    if (!res.ok) {
      activeOp = null;
      cache.set(cacheKey, null);
      broadcastOp();
      return;
    }

    const data = await res.json();
    const op = data.results?.find((r) => r.skipType === "op" || r.skipType === "mixed-op");
    activeOp = op
      ? {
          start: op.interval.startTime,
          end: op.interval.endTime,
          episodeLength: op.episodeLength || 0,
          skipType: op.skipType
        }
      : null;

    cache.set(cacheKey, activeOp);
    Logger.info(`📡 AniSkip result for Ep ${epNum}:`, activeOp || "No opening found");
    broadcastOp();
  } catch (err) {
    Logger.warn("AniSkip fetch failed:", err);
  }
}

export function initSkipIntroTop() {
  window.addEventListener("message", (e) => {
    if (e.data?.type === "AU_FRAME_READY") {
      const frameDur = e.data.duration ? Math.round(e.data.duration) : 0;
      if (frameDur > 0 && !activeOp && activeMalId && activeEp) {
        checkSkipIntro(activeMalId, activeEp, frameDur);
      } else {
        broadcastOp();
      }
    }
  });

  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "s" || e.key === "S") {
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
        document.querySelectorAll("iframe").forEach((frame) => {
          try {
            frame.contentWindow?.postMessage({ type: "AU_TRIGGER_SKIP" }, "*");
          } catch (_) {}
        });
      }
    },
    true
  );

  Settings.subscribe(() => {
    broadcastOp();
  });
}
