import { Settings } from "../settings.js";
import { Logger } from "../../shared/logger.js";
import { iconHtml, SkipForward } from "../../shared/icons.js";

const cache = new Map();
let activeMalId = null;
let activeEp = null;
let activeOp = null;
let activeDuration = 0;
let fetchToken = 0;
let episodeAutoSkipOverride = null;
let currentProvider = null;

export function isEpisodeAutoSkipActive() {
  if (episodeAutoSkipOverride !== null) {
    return episodeAutoSkipOverride;
  }
  return Settings.get().autoSkip;
}

export function toggleEpisodeAutoSkip() {
  episodeAutoSkipOverride = !isEpisodeAutoSkipActive();
  broadcastOp();
  renderAutoSkipButton(currentProvider);
  return episodeAutoSkipOverride;
}

export function renderAutoSkipButton(provider) {
  if (provider) currentProvider = provider;
  const existing = document.getElementById("al-auto-skip-btn");

  if (!activeOp) {
    existing?.remove();
    return;
  }

  const container = currentProvider?.getVideoBottomAnchor?.();
  if (!container) return;

  const isActive = isEpisodeAutoSkipActive();
  let btn = existing;
  if (!btn) {
    btn = document.createElement("button");
    btn.type = "button";
    btn.id = "al-auto-skip-btn";
    container.appendChild(btn);
  } else if (btn.parentElement !== container) {
    container.appendChild(btn);
  }

  btn.className = `al-auto-skip-btn ${isActive ? "is-active" : "is-barred"}`;
  btn.title = isActive
    ? "Auto-skip intro: Active (Click to disable for this episode)"
    : "Auto-skip intro: Disabled (Click to enable for this episode)";
  btn.innerHTML = `
    <span class="al-skip-icon">${iconHtml(SkipForward, { width: 13, height: 13 })}</span>
    <span class="al-skip-label">Skip Intro</span>
  `;

  btn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleEpisodeAutoSkip();
  };
}

export function broadcastOp() {
  const settings = Settings.get();
  const msg = {
    type: "AU_SKIP_OP",
    op: activeOp,
    autoSkip: isEpisodeAutoSkipActive(),
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
    episodeAutoSkipOverride = null;
    broadcastOp();
    renderAutoSkipButton(currentProvider);
  } else if (roundedDur > 0) {
    activeDuration = roundedDur;
  }

  const cacheKey = `${malId}_${epNum}`;
  if (cache.has(cacheKey)) {
    activeOp = cache.get(cacheKey);
    broadcastOp();
    renderAutoSkipButton(currentProvider);
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
      renderAutoSkipButton(currentProvider);
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
    renderAutoSkipButton(currentProvider);
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
    renderAutoSkipButton(currentProvider);
  });
}
