import { Settings } from "../settings.js";
import { Logger } from "../../shared/logger.js";
import { iconHtml, SkipForward, ThumbsUp, ThumbsDown, Plus, Pencil } from "../../shared/icons.js";
import {
  voteSkipTime,
  getVoteStatus,
  openAniSkipDock,
  handleAniSkipHotkey,
  handleAniSkipArrow
} from "./aniskip-contribute.js";

const cache = new Map();
let activeMalId = null;
let activeEp = null;
let activeOp = null;
let activeDuration = 0;
let fetchToken = 0;
let episodeAutoSkipOverride = null;
let currentProvider = null;

let lastKnownCurrentTime = 0;
let lastKnownDuration = 0;

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
  activeOp = newData;
  const { malId, epNum } = getEffectiveIds();
  if (malId && epNum) {
    const cacheKey = `${malId}_${epNum}`;
    cache.set(cacheKey, activeOp);
  }
  broadcastOp();
  renderAutoSkipButton(currentProvider);
}

export function renderAutoSkipButton(provider) {
  if (provider) currentProvider = provider;
  const container = currentProvider?.getVideoBottomAnchor?.();
  if (!container) return;

  const settings = Settings.get();
  let wrapper = document.getElementById("al-aniskip-wrapper");

  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.id = "al-aniskip-wrapper";
    wrapper.className = "al-aniskip-wrapper";
    container.appendChild(wrapper);
  } else if (wrapper.parentElement !== container) {
    container.appendChild(wrapper);
  }

  // 1. If Opening is present on AniSkip
  if (activeOp) {
    const isActive = isEpisodeAutoSkipActive();
    const currentVote = (settings.communityAniSkip && activeOp.skipId)
      ? getVoteStatus(activeOp.skipId)
      : null;

    wrapper.innerHTML = `
      <div class="al-aniskip-pill-bar">
        <!-- Skip Intro Toggle -->
        <button type="button" class="al-skip-pill-btn al-skip-toggle ${isActive ? "is-active" : "is-disabled"}" title="${isActive ? "Auto-skip active (Click to disable)" : "Auto-skip disabled (Click to enable)"}">
          <span class="al-skip-icon">${iconHtml(SkipForward, { width: 13, height: 13 })}</span>
          <span class="al-skip-label">Skip Intro</span>
          <span class="al-skip-status-dot"></span>
        </button>

        ${settings.communityAniSkip && activeOp.skipId ? `
          <span class="al-skip-pill-divider"></span>
          <!-- Skip Intro Community Votes -->
          <div class="al-skip-pill-votes" title="Vote on this skip timing">
            <button type="button" class="al-skip-vote-btn is-upvote ${currentVote === "upvote" ? "is-voted" : ""}" title="${currentVote === "upvote" ? "Upvoted (+1)" : "Accurate skip (+1)"}">
              ${iconHtml(ThumbsUp, { width: 12, height: 12 })}
            </button>
            <button type="button" class="al-skip-vote-btn is-downvote ${currentVote === "downvote" ? "is-voted" : ""}" title="${currentVote === "downvote" ? "Downvoted (-1)" : "Inaccurate skip (-1)"}">
              ${iconHtml(ThumbsDown, { width: 12, height: 12 })}
            </button>
          </div>
        ` : ""}

        ${settings.communityAniSkip ? `
          <span class="al-skip-pill-divider"></span>
          <!-- Edit / Calibrate Timestamps -->
          <button type="button" class="al-skip-pill-btn al-skip-edit-btn" title="Edit or calibrate skip timestamps (Key: [ or ])">
            <span class="al-skip-icon">${iconHtml(Pencil, { width: 11, height: 11 })}</span>
          </button>
        ` : ""}
      </div>
    `;

    wrapper.querySelector(".al-skip-toggle")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleEpisodeAutoSkip();
    });

    wrapper.querySelector(".is-upvote")?.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const ok = await voteSkipTime({ skipId: activeOp.skipId, voteType: "upvote" });
      if (ok) renderAutoSkipButton(currentProvider);
    });

    wrapper.querySelector(".is-downvote")?.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const ok = await voteSkipTime({ skipId: activeOp.skipId, voteType: "downvote" });
      if (ok) renderAutoSkipButton(currentProvider);
    });

    wrapper.querySelector(".al-skip-edit-btn")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const { malId, epNum } = getEffectiveIds();
      openAniSkipDock({
        malId,
        epNum,
        currentTime: lastKnownCurrentTime,
        duration: activeDuration || lastKnownDuration,
        initialStart: activeOp.start,
        initialEnd: activeOp.end,
        skipType: activeOp.skipType || "op",
        provider: currentProvider,
        onSuccess: handleSuccessfulContribution
      });
    });

    return;
  }

  // 2. If NO Opening is present on AniSkip
  if (settings.communityAniSkip) {
    wrapper.innerHTML = `
      <div class="al-aniskip-pill-bar">
        <button type="button" class="al-skip-pill-btn al-skip-suggest-btn" title="No intro found on AniSkip. Add timestamps (Key: [ or ])">
          <span class="al-skip-icon">${iconHtml(Plus, { width: 12, height: 12 })}</span>
          <span class="al-skip-label">Contribute Skip</span>
        </button>
      </div>
    `;

    wrapper.querySelector(".al-skip-suggest-btn")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const { malId, epNum } = getEffectiveIds();
      if (!malId) {
        Logger.warn("Cannot open AniSkip dock: MAL ID missing");
        return;
      }
      openAniSkipDock({
        malId,
        epNum,
        currentTime: lastKnownCurrentTime,
        duration: activeDuration || lastKnownDuration,
        provider: currentProvider,
        onSuccess: handleSuccessfulContribution
      });
    });
  } else {
    wrapper.innerHTML = "";
  }
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
          skipType: op.skipType,
          skipId: op.skipId
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
    if (e.data?.type === "AU_FRAME_READY") {
      const frameDur = e.data.duration ? Math.round(e.data.duration) : 0;
      if (frameDur > 0 && !activeOp && activeMalId && activeEp) {
        checkSkipIntro(activeMalId, activeEp, frameDur);
      } else {
        broadcastOp();
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
