import { Settings } from "../settings.js";
import { Logger } from "../../shared/logger.js";
import { iconHtml, SkipForward, Plus, Pencil } from "../../shared/icons.js";
import { resolveSkipSegment } from "../skip-logic.js";
import {
  openAniSkipDock,
  handleAniSkipHotkey,
  handleAniSkipArrow
} from "./aniskip-contribute.js";

const cache = new Map();
let activeMalId = null;
let activeEp = null;
let aniskipOp = null;
let nativeIntro = null;
let activeOp = null;
let activeDuration = 0;
let fetchToken = 0;
let episodeAutoSkipOverride = null;
let currentProvider = null;

let lastKnownCurrentTime = 0;
let lastKnownDuration = 0;

function syncActiveOp() {
  activeOp = resolveSkipSegment({ aniskipOp, nativeIntro });
}

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

function getEffectiveIds() {
  const malId = activeMalId || currentProvider?.getAnimeInfo?.()?.malId || null;
  const epNum = activeEp || currentProvider?.getActiveEpisode?.() || 1;
  return { malId, epNum };
}

function handleSuccessfulContribution(newData) {
  aniskipOp = newData;
  syncActiveOp();
  const { malId, epNum } = getEffectiveIds();
  if (malId && epNum) {
    const cacheKey = `${malId}_${epNum}`;
    cache.set(cacheKey, aniskipOp);
  }
  broadcastOp();
  renderAutoSkipButton(currentProvider);
}

export function openSkipContribute() {
  const { malId, epNum } = getEffectiveIds();
  if (!malId) {
    Logger.warn("Cannot open AniSkip dock: MAL ID missing");
    return false;
  }
  openAniSkipDock({
    malId,
    epNum,
    currentTime: lastKnownCurrentTime,
    duration: activeDuration || lastKnownDuration,
    initialStart: activeOp?.start,
    initialEnd: activeOp?.end,
    skipType: activeOp?.skipType || "op",
    provider: currentProvider,
    onSuccess: handleSuccessfulContribution
  });
  return true;
}

export function renderAutoSkipButton(provider) {
  if (provider) currentProvider = provider;

  const container = document.getElementById("al-dock-skip-slot") || currentProvider?.getVideoBottomAnchor?.();
  if (!container) return;

  const settings = Settings.get();
  const isActive = isEpisodeAutoSkipActive();
  const renderKey = `${activeOp ? `${activeOp.start}-${activeOp.end}-${activeOp.source || "aniskip"}` : "none"}|${isActive}|${settings.communityAniSkip}`;
  if (container.__lastSkipKey === renderKey && container.dataset.rendered === "1") return;
  container.__lastSkipKey = renderKey;
  container.dataset.rendered = "1";

  if (!activeOp) {
    if (!settings.communityAniSkip) {
      container.innerHTML = "";
      return;
    }
    container.innerHTML = `
      <div class="al-dock-skip-cluster">
        <button type="button" class="al-dock-chip is-pending" id="al-skip-add-btn" title="Nessuna intro trovata. Contribuisci ad AniSkip (Key: [ o ])">
          ${iconHtml(Plus, { width: 10, height: 10 })}
          <span>+ Intro</span>
        </button>
      </div>
    `;
    container.querySelector("#al-skip-add-btn")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openSkipContribute();
    });
    return;
  }

  const srcLabel = activeOp.source === "native" ? "Native" : "AniSkip";
  container.innerHTML = `
    <div class="al-dock-skip-cluster">
      <button type="button" class="al-dock-chip ${isActive ? "is-tracked" : "is-pending"}" id="al-skip-toggle-btn" title="${srcLabel}: ${isActive ? "Auto-Skip attivo (Clicca per disattivare)" : "Auto-Skip disattivato (Clicca per attivare)"}">
        ${iconHtml(SkipForward, { width: 11, height: 11 })}
        <span>${isActive ? "Auto-Skip: ON" : "Auto-Skip: OFF"}</span>
      </button>
      ${settings.communityAniSkip ? `
        <button type="button" class="al-dock-step-btn" id="al-skip-edit-btn" title="Calibra timestamp intro (Key: [ o ])">
          ${iconHtml(Pencil, { width: 10, height: 10 })}
        </button>
      ` : ""}
    </div>
  `;

  container.querySelector("#al-skip-toggle-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleEpisodeAutoSkip();
  });

  container.querySelector("#al-skip-edit-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openSkipContribute();
  });
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
    aniskipOp = null;
    nativeIntro = null;
    syncActiveOp();
    episodeAutoSkipOverride = null;
    broadcastOp();
    renderAutoSkipButton(currentProvider);
  } else if (roundedDur > 0) {
    activeDuration = roundedDur;
  }

  const cacheKey = `${malId}_${epNum}`;
  if (cache.has(cacheKey)) {
    aniskipOp = cache.get(cacheKey);
    syncActiveOp();
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
      aniskipOp = null;
      cache.set(cacheKey, null);
      syncActiveOp();
      broadcastOp();
      renderAutoSkipButton(currentProvider);
      return;
    }

    const data = await res.json();
    const op = data.results?.find((r) => r.skipType === "op" || r.skipType === "mixed-op");
    if (op) {
      aniskipOp = {
        start: op.interval.startTime,
        end: op.interval.endTime,
        episodeLength: op.episodeLength || 0,
        skipType: op.skipType,
        skipId: op.skipId,
        source: "aniskip"
      };
      cache.set(cacheKey, aniskipOp);
    } else {
      aniskipOp = null;
      cache.set(cacheKey, null);
    }
    syncActiveOp();

    Logger.info(`📡 AniSkip result for Ep ${epNum}:`, activeOp || "No opening found");
    broadcastOp();
    renderAutoSkipButton(currentProvider);
  } catch (err) {
    Logger.warn("AniSkip fetch failed:", err);
  }
}

function handleHotkeyAction(action, timeOverride = null) {
  if (!Settings.get().communityAniSkip) return;
  const { malId, epNum } = getEffectiveIds();
  if (!malId) return;

  const curTime = typeof timeOverride === "number" ? timeOverride : lastKnownCurrentTime;
  handleAniSkipHotkey(
    action,
    curTime,
    activeDuration || lastKnownDuration,
    {
      malId,
      epNum,
      provider: currentProvider,
      onSuccess: handleSuccessfulContribution
    }
  );
}

export function initSkipIntroTop() {
  window.addEventListener("message", (e) => {
    if (e.data?.type === "AU_FRAME_READY" || e.data?.type === "AL_PLAYER_READY") {
      const frameDur = e.data.duration ? Math.round(e.data.duration) : 0;
      if (frameDur > 0 && !activeOp && activeMalId && activeEp) {
        checkSkipIntro(activeMalId, activeEp, frameDur);
      } else {
        broadcastOp();
      }
    } else if (e.data?.type === "AU_NATIVE_TIMESTAMPS" && e.data.intro) {
      const prevKey = activeOp ? `${activeOp.start}-${activeOp.end}-${activeOp.source || "aniskip"}` : "";
      nativeIntro = {
        start: e.data.intro.start,
        end: e.data.intro.end,
        episodeLength: activeDuration || lastKnownDuration,
        skipType: "op",
        source: "native"
      };
      syncActiveOp();
      const nextKey = activeOp ? `${activeOp.start}-${activeOp.end}-${activeOp.source || "aniskip"}` : "";
      if (activeOp && nextKey !== prevKey) {
        broadcastOp();
        renderAutoSkipButton(currentProvider);
      }
    } else if (e.data?.type === "AL_PLAYBACK_STATE") {
      if (typeof e.data.currentTime === "number") {
        lastKnownCurrentTime = e.data.currentTime;
      }
      if (typeof e.data.duration === "number" && e.data.duration > 0) {
        lastKnownDuration = e.data.duration;
      }
    } else if (e.data?.type === "AU_ANISKIP_HOTKEY") {
      const action = e.data.action || (e.data.key === "]" || e.data.key === "o" ? "end" : "start");
      handleHotkeyAction(action, e.data.currentTime);
    } else if (e.data?.type === "AU_ANISKIP_ARROW") {
      handleAniSkipArrow(e.data.key);
    }
  });

  window.addEventListener(
    "keydown",
    (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.key === "s" || e.key === "S") {
        document.querySelectorAll("iframe").forEach((frame) => {
          try {
            frame.contentWindow?.postMessage({ type: "AU_TRIGGER_SKIP" }, "*");
          } catch (_) {}
        });
        return;
      }

      const keyLower = e.key?.toLowerCase();
      const isStart = keyLower === "i" || e.key === "[" || e.code === "BracketLeft";
      const isEnd = keyLower === "o" || e.key === "]" || e.code === "BracketRight";

      if (isStart) {
        handleHotkeyAction("start");
      } else if (isEnd) {
        handleHotkeyAction("end");
      }
    },
    true
  );

  Settings.subscribe(() => {
    broadcastOp();
    renderAutoSkipButton(currentProvider);
  });
}
