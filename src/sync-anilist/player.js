import { Logger } from "../shared/logger.js";
import {
  resolveManualSkipTarget,
  resolveEdSkipTarget,
  hasPostCredits,
  buildTimelineHighlightGradient
} from "./skip-logic.js";

export function initPlayer() {
  let rawOp = null;
  let rawEd = null;
  let nativeOp = null;
  let nativeEd = null;
  let currentOp = null;
  let currentEd = null;
  let lastHighlightKey = "";
  let autoSkip = false;
  let skipFallbackDuration = 85;
  let btn = null;
  let isBtnVisible = false;
  let currentBtnKind = "op";
  let lastReportedDur = 0;
  let hasAutoSkippedOp = false;
  let hasAutoSkippedEd = false;
  let lastSkipTime = 0;
  let pendingResumeSeek = null;
  let activeResumeTarget = null;
  let hasConfirmedResume = false;
  let activeGuardInterval = null;
  let hasReportedPlayerReady = false;
  let lastNativeTimestampKey = "";
  let lastBroadcastTime = 0;
  let isProgrammaticSeek = false;
  let programmaticSeekTimeout = null;
  let isAniSkipDockOpen = false;
  let dockSyncInterval = null;

  function markProgrammaticSeek(durationMs = 600) {
    isProgrammaticSeek = true;
    if (programmaticSeekTimeout) clearTimeout(programmaticSeekTimeout);
    programmaticSeekTimeout = setTimeout(() => {
      isProgrammaticSeek = false;
      programmaticSeekTimeout = null;
    }, durationMs);
  }

  function handleSeeking() {
    if (!isProgrammaticSeek) {
      cancelActiveResume();
    }
  }

  function cancelActiveResume() {
    activeResumeTarget = null;
    pendingResumeSeek = null;
    if (activeGuardInterval) {
      clearInterval(activeGuardInterval);
      activeGuardInterval = null;
    }
  }

  function broadcastPlaybackState(force = false) {
    const now = Date.now();
    const minInterval = isAniSkipDockOpen ? 200 : 750;
    if (!force && now - lastBroadcastTime < minInterval) return;
    lastBroadcastTime = now;

    const pos = getPos();
    const dur = getDuration();
    const video = document.querySelector("video");
    const jw = getPlayer();
    const vds = getVidstack();

    let isPaused = true;
    let isEnded = false;

    if (jw && typeof jw.getState === "function") {
      const st = jw.getState();
      isPaused = st === "paused" || st === "idle" || Boolean(video && video.paused);
      isEnded = st === "complete" || Boolean(video && video.ended);
    } else if (vds && typeof vds.paused !== "undefined") {
      isPaused = Boolean(vds.paused || (video && video.paused));
      isEnded = Boolean(vds.ended || (video && video.ended));
    } else if (video) {
      isPaused = video.paused;
      isEnded = video.ended;
    }

    try {
      window.top.postMessage(
        {
          type: "AL_PLAYBACK_STATE",
          currentTime: pos,
          duration: dur,
          isPaused,
          isEnded
        },
        "*"
      );
    } catch (_) {}
  }

  function handlePlayResumeGuard() {
    if (activeResumeTarget !== null && activeResumeTarget > 10) {
      const target = activeResumeTarget;
      setTimeout(() => {
        const currentPos = getPos();
        if (currentPos < 5) {
          Logger.info(`↺ Anti-reset guard: restoring playhead to ${target}s`);
          seekTo(target);
        }
      }, 350);
    }
  }

  function applyResumeSeek(target) {
    if (typeof target !== "number" || target <= 0) return;
    const cur = getPos();
    // Companion mode: if video is already playing past 5s (e.g. site native resume), do not fight or overwrite
    if (cur > 5 && Math.abs(cur - target) < 15) {
      hasConfirmedResume = true;
      return;
    }

    hasConfirmedResume = false;
    activeResumeTarget = target;
    const dur = getDuration();

    if (dur > 0 && target < dur - 5) {
      seekTo(target);
      Logger.info(`↺ Applying companion seekTo ${target}s`);
      pendingResumeSeek = null;
      setTimeout(() => {
        const settledPos = getPos();
        if (settledPos < 5 && activeResumeTarget === target) {
          Logger.info(`↺ Retrying seekTo ${target}s after reset`);
          seekTo(target);
        }
        if (getPos() >= Math.max(5, target - 15)) {
          hasConfirmedResume = true;
          try {
            window.top.postMessage({ type: "AL_RESUME_CONFIRMED", time: target }, "*");
          } catch (_) {}
        }
      }, 450);
    } else {
      pendingResumeSeek = target;
    }
  }

  function getPlayer() {
    const uWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
    return typeof uWin.jwplayer === "function" ? uWin.jwplayer() : null;
  }

  function getVidstack() {
    return document.querySelector("media-player");
  }

  function getPos() {
    const jw = getPlayer();
    if (jw && typeof jw.getPosition === "function") {
      const p = jw.getPosition();
      if (typeof p === "number" && !isNaN(p)) return p;
    }
    const vds = getVidstack();
    if (vds && typeof vds.currentTime === "number" && !isNaN(vds.currentTime)) {
      return vds.currentTime;
    }
    return document.querySelector("video")?.currentTime || 0;
  }

  function getDuration() {
    const jw = getPlayer();
    if (jw && typeof jw.getDuration === "function") {
      const d = jw.getDuration();
      if (typeof d === "number" && !isNaN(d) && d > 0) return d;
    }
    const vds = getVidstack();
    if (vds && typeof vds.duration === "number" && !isNaN(vds.duration) && vds.duration > 0) {
      return vds.duration;
    }
    return document.querySelector("video")?.duration || 0;
  }

  function notifyReady() {
    const dur = getDuration();
    if (dur > 0) {
      if (Math.round(dur) !== Math.round(lastReportedDur)) {
        lastReportedDur = dur;
        hasReportedPlayerReady = false;
      }
      if (!hasReportedPlayerReady) {
        hasReportedPlayerReady = true;
        try {
          window.top.postMessage({ type: "AL_PLAYER_READY", duration: dur }, "*");
        } catch (_) {}
      }

      computeAdjustedOp();
      if (pendingResumeSeek !== null) {
        applyResumeSeek(pendingResumeSeek);
      }
    }
  }

  function bindMediaEvents() {
    const video = document.querySelector("video");
    if (video && !video.__au_skip_bound) {
      video.__au_skip_bound = true;
      video.addEventListener("timeupdate", () => {
        checkTime();
        broadcastPlaybackState();
      });
      video.addEventListener("play", () => {
        handlePlayResumeGuard();
        broadcastPlaybackState(true);
      });
      video.addEventListener("seeking", () => {
        handleSeeking();
        broadcastPlaybackState(true);
      });
      video.addEventListener("seeked", () => broadcastPlaybackState(true));
      video.addEventListener("pause", () => {
        broadcastPlaybackState(true);
        setTimeout(() => broadcastPlaybackState(true), 100);
      });
      video.addEventListener("ended", () => broadcastPlaybackState(true));
      video.addEventListener("canplay", () => notifyReady());
      video.addEventListener("playing", () => notifyReady());
      video.addEventListener("loadedmetadata", () => {
        notifyReady();
        computeAdjustedOp();
        broadcastPlaybackState(true);
      });
      video.addEventListener("durationchange", () => {
        notifyReady();
        computeAdjustedOp();
        broadcastPlaybackState(true);
      });
    }

    const jw = getPlayer();
    if (jw && typeof jw.on === "function" && !jw.__au_skip_bound) {
      jw.__au_skip_bound = true;
      jw.on("time", () => {
        checkTime();
        broadcastPlaybackState();
      });
      jw.on("play", () => {
        handlePlayResumeGuard();
        notifyReady();
        broadcastPlaybackState(true);
      });
      jw.on("seek", () => {
        handleSeeking();
        broadcastPlaybackState(true);
      });
      jw.on("seeked", () => broadcastPlaybackState(true));
      jw.on("pause", () => {
        broadcastPlaybackState(true);
        setTimeout(() => broadcastPlaybackState(true), 100);
      });
      jw.on("complete", () => broadcastPlaybackState(true));
      jw.on("ready", () => notifyReady());
      jw.on("firstFrame", () => notifyReady());
      jw.on("meta", () => {
        notifyReady();
        computeAdjustedOp();
        broadcastPlaybackState(true);
      });
    }

    const vds = getVidstack();
    if (vds && !vds.__au_skip_bound) {
      vds.__au_skip_bound = true;
      vds.addEventListener("can-play", () => notifyReady());
      vds.addEventListener("play", () => {
        handlePlayResumeGuard();
        broadcastPlaybackState(true);
      });
      vds.addEventListener("seeking", () => {
        handleSeeking();
        broadcastPlaybackState(true);
      });
      vds.addEventListener("seeked", () => broadcastPlaybackState(true));
      vds.addEventListener("pause", () => {
        broadcastPlaybackState(true);
        setTimeout(() => broadcastPlaybackState(true), 100);
      });
      vds.addEventListener("ended", () => broadcastPlaybackState(true));
    }
  }

  function adjustSegmentForBumper(rawSeg, dur) {
    if (!rawSeg) return null;
    let offset = 0;

    // Adjust for pre-roll bumper if AniSkip file is longer by <= 35s
    if (dur > 0 && rawSeg.episodeLength > 0) {
      const diff = rawSeg.episodeLength - dur;
      if (diff >= 0.5 && diff <= 35 && (rawSeg.start >= diff || (rawSeg.start <= 3 && diff <= 10))) {
        offset = diff;
      }
    }

    return {
      start: Math.max(0, rawSeg.start - offset),
      end: Math.max(0, rawSeg.end - offset)
    };
  }

  function updateTimelineHighlight() {
    const dur = getDuration();
    const gradient = buildTimelineHighlightGradient([currentOp, currentEd], dur);
    const key = gradient || "none";
    if (key === lastHighlightKey) return;
    lastHighlightKey = key;

    let styleEl = document.getElementById("al-timeline-highlight-style");
    if (!gradient) {
      styleEl?.remove();
      return;
    }

    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "al-timeline-highlight-style";
      (document.head || document.documentElement).appendChild(styleEl);
    }

    styleEl.textContent = `
      .jw-cue.au-segment-intro,
      .jw-cue.au-segment-outro {
        background-color: rgba(250, 204, 21, 0.95) !important;
      }
      .jw-timesegment-container::after,
      .jw-slider-time > .jw-slider-container > .jw-rail::after,
      media-time-slider .vds-slider-track::after,
      .vds-time-slider .vds-slider-track::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        border-radius: inherit;
        z-index: 5;
        background: ${gradient};
      }
    `;
  }

  function computeAdjustedOp() {
    const dur = getDuration();
    currentOp = adjustSegmentForBumper(rawOp || nativeOp, dur);
    currentEd = adjustSegmentForBumper(rawEd || nativeEd, dur);
    updateTimelineHighlight();
  }

  function checkNativeTimestamps() {
    const uWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
    const timestamps = uWin.video?.timestamps || window.video?.timestamps;
    if (!Array.isArray(timestamps) || timestamps.length === 0) return;

    const introTs = timestamps.find((t) => t.kind === "intro" && t.end_time > t.start_time);
    const outroTs = timestamps.find((t) => t.kind === "outro" && t.end_time > t.start_time);
    if (!introTs && !outroTs) return;

    const intro = introTs ? { start: introTs.start_time, end: introTs.end_time } : null;
    const outro = outroTs ? { start: outroTs.start_time, end: outroTs.end_time } : null;
    const tsKey = `${intro?.start || ""}-${intro?.end || ""}|${outro?.start || ""}-${outro?.end || ""}`;
    if (tsKey === lastNativeTimestampKey) return;
    lastNativeTimestampKey = tsKey;

    if (intro) {
      nativeOp = {
        start: intro.start,
        end: intro.end,
        episodeLength: getDuration(),
        source: "native"
      };
    }
    if (outro) {
      nativeEd = {
        start: outro.start,
        end: outro.end,
        episodeLength: getDuration(),
        source: "native"
      };
    }
    if (intro || outro) {
      computeAdjustedOp();
    }

    try {
      window.top.postMessage(
        {
          type: "AU_NATIVE_TIMESTAMPS",
          intro,
          outro
        },
        "*"
      );
    } catch (_) {}
  }

  function seekTo(target) {
    if (typeof target !== "number" || isNaN(target) || target < 0) return;
    markProgrammaticSeek(1500);
    const jw = getPlayer();
    if (jw && typeof jw.seek === "function") {
      try {
        jw.seek(target);
        broadcastPlaybackState(true);
        return;
      } catch (_) {}
    }
    const vds = getVidstack();
    if (vds && typeof vds.currentTime !== "undefined") {
      try {
        vds.currentTime = target;
        broadcastPlaybackState(true);
        return;
      } catch (_) {}
    }
    const v = document.querySelector("video");
    if (v) {
      try {
        v.currentTime = target;
      } catch (_) {}
    }
    broadcastPlaybackState(true);
  }

  function skipIntro(isAuto = false) {
    if (!currentOp) return;
    const target = Math.max(0, currentOp.end - 1);
    Logger.info(`⏩ ${isAuto ? "Auto-skipped" : "User skipped"} intro to ${target.toFixed(2)}s`);
    seekTo(target);
    try {
      window.top.postMessage({
        type: "AU_SKIP_EXECUTED",
        mode: isAuto ? "auto" : "manual",
        kind: "op",
        source: (rawOp || nativeOp)?.source || "aniskip",
        target
      }, "*");
    } catch (_) {}
  }

  function skipEnding(isAuto = false) {
    if (!currentEd) return;
    const dur = getDuration();
    const res = resolveEdSkipTarget({ edSegment: currentEd, duration: dur });
    if (!res) return;
    Logger.info(`⏩ ${isAuto ? "Auto-skipped" : "User skipped"} ending to ${res.target.toFixed(2)}s (postCredits: ${res.hasPostCredits})`);
    seekTo(res.target);
    try {
      window.top.postMessage({
        type: "AU_SKIP_EXECUTED",
        mode: isAuto ? "auto" : "manual",
        kind: "ed",
        hasPostCredits: res.hasPostCredits,
        source: (rawEd || nativeEd)?.source || "aniskip",
        target: res.target
      }, "*");
    } catch (_) {}
  }

  function handleSkipAction() {
    cancelActiveResume();
    const now = Date.now();
    if (now - lastSkipTime < 500) return;
    lastSkipTime = now;

    const pos = getPos();
    const dur = getDuration();
    const resolution = resolveManualSkipTarget({
      currentPos: pos,
      duration: dur,
      segment: currentOp,
      edSegment: currentEd,
      fallbackDuration: skipFallbackDuration
    });

    if (resolution.mode === "segment") {
      Logger.info(`⏩ User skipped ${resolution.kind || "op"} (${resolution.source}) to ${resolution.target.toFixed(2)}s`);
    } else {
      Logger.info(`⏩ Fallback skip (+${skipFallbackDuration}s) to ${resolution.target.toFixed(2)}s`);
    }
    seekTo(resolution.target);
    try {
      window.top.postMessage({
        type: "AU_SKIP_EXECUTED",
        mode: resolution.mode,
        kind: resolution.kind || (resolution.mode === "segment" ? "op" : undefined),
        hasPostCredits: resolution.hasPostCredits,
        source: resolution.source,
        fallbackDuration: skipFallbackDuration,
        target: resolution.target
      }, "*");
    } catch (_) {}
  }

  function ensureButton() {
    if (btn && btn.parentElement) return;

    btn = document.createElement("button");
    btn.id = "au-skip-intro-btn";
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><polygon points="19 5 19 19"></polygon></svg>
      <span>Skip Intro (S)</span>
    `;

    ["mousedown", "mouseup", "pointerdown", "touchstart", "click"].forEach((evt) => {
      btn.addEventListener(
        evt,
        (e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
          if (evt === "click") {
            e.preventDefault();
            if (currentBtnKind === "ed") skipEnding(false);
            else skipIntro(false);
          }
        },
        true
      );
    });

    const target = document.body || document.documentElement;
    if (window.getComputedStyle(target).position === "static") {
      target.style.position = "relative";
    }
    target.appendChild(btn);
  }

  function checkTime() {
    bindMediaEvents();
    checkNativeTimestamps();

    if (activeResumeTarget !== null && getPos() >= activeResumeTarget - 3) {
      activeResumeTarget = null;
    }

    if (getDuration() > 0 && Math.round(getDuration()) !== Math.round(lastReportedDur)) {
      notifyReady();
    }

    if (!rawOp && !nativeOp && !rawEd && !nativeEd) {
      if (btn && isBtnVisible) {
        btn.style.display = "none";
        isBtnVisible = false;
      }
      return;
    }

    computeAdjustedOp();
    if (!currentOp && !currentEd) {
      if (btn && isBtnVisible) {
        btn.style.display = "none";
        isBtnVisible = false;
      }
      return;
    }

    const pos = getPos();
    const dur = getDuration();

    // Auto-skip logic
    if (autoSkip) {
      if (btn && isBtnVisible) {
        btn.style.display = "none";
        isBtnVisible = false;
      }
      if (currentOp) {
        if (pos >= currentOp.start && pos < currentOp.end - 1) {
          if (!hasAutoSkippedOp) {
            hasAutoSkippedOp = true;
            skipIntro(true);
            return;
          }
        } else if (pos < currentOp.start - 5) {
          hasAutoSkippedOp = false;
        }
      }
      if (currentEd) {
        if (pos >= currentEd.start && pos < currentEd.end - 1) {
          if (!hasAutoSkippedEd) {
            hasAutoSkippedEd = true;
            skipEnding(true);
            return;
          }
        } else if (pos < currentEd.start - 5) {
          hasAutoSkippedEd = false;
        }
      }
      return;
    }

    // Manual skip button logic
    const inOp = Boolean(
      currentOp &&
      pos >= Math.max(0, currentOp.start - 1.5) &&
      pos <= Math.max(currentOp.start, currentOp.end - 2)
    );
    const inEd = Boolean(
      !inOp &&
      currentEd &&
      pos >= Math.max(0, currentEd.start - 1.5) &&
      pos <= Math.max(currentEd.start, currentEd.end - 2)
    );

    if (inOp || inEd) {
      ensureButton();
      const nextKind = inEd ? "ed" : "op";
      const nextLabel = inEd
        ? (hasPostCredits(currentEd, dur) ? "Skip to Post-Credits (S)" : "Skip Ending (S)")
        : "Skip Intro (S)";
      currentBtnKind = nextKind;
      const span = btn.querySelector("span");
      if (span && span.textContent !== nextLabel) span.textContent = nextLabel;
      if (!isBtnVisible) {
        btn.style.display = "inline-flex";
        isBtnVisible = true;
      }
    } else {
      if (isBtnVisible && btn) {
        btn.style.display = "none";
        isBtnVisible = false;
      }
    }
  }

  window.addEventListener("message", (e) => {
    if (e.data?.type === "AU_SKIP_OP") {
      rawOp = e.data.op || null;
      rawEd = e.data.ed || null;
      autoSkip = !!e.data.autoSkip;
      if (typeof e.data.skipFallbackDuration === "number" && e.data.skipFallbackDuration > 0) {
        skipFallbackDuration = e.data.skipFallbackDuration;
      }
      hasAutoSkippedOp = false;
      hasAutoSkippedEd = false;
      computeAdjustedOp();
      checkTime();
    } else if (e.data?.type === "AU_TRIGGER_SKIP") {
      handleSkipAction();
    } else if (e.data?.type === "AU_SEEK_PLAYER") {
      if (typeof e.data.time === "number" && !isNaN(e.data.time)) {
        seekTo(e.data.time);
      }
    } else if (e.data?.type === "AL_RESUME_SEEK") {
      applyResumeSeek(e.data.target);
    } else if (e.data?.type === "AU_ANISKIP_DOCK_STATE") {
      isAniSkipDockOpen = !!e.data.open;
      if (isAniSkipDockOpen) {
        broadcastPlaybackState(true);
        if (!dockSyncInterval) {
          dockSyncInterval = setInterval(() => {
            if (isAniSkipDockOpen) broadcastPlaybackState();
          }, 200);
        }
      } else {
        if (dockSyncInterval) {
          clearInterval(dockSyncInterval);
          dockSyncInterval = null;
        }
      }
    } else if (e.data?.type === "AU_REQUEST_CURRENT_TIME") {
      broadcastPlaybackState(true);
    }
  });

  window.addEventListener(
    "keydown",
    (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      const keyLower = e.key?.toLowerCase();
      const isStart = keyLower === "i" || e.key === "[" || e.code === "BracketLeft";
      const isEnd = keyLower === "o" || e.key === "]" || e.code === "BracketRight";
      const isArrow = e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown";

      if (isAniSkipDockOpen && isArrow) {
        e.preventDefault();
        e.stopPropagation();
        try {
          window.top.postMessage({ type: "AU_ANISKIP_ARROW", key: e.key }, "*");
        } catch (_) {}
        return;
      }

      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        handleSkipAction();
      } else if (isStart || isEnd) {
        const pos = getPos();
        const dur = getDuration();
        try {
          window.top.postMessage(
            {
              type: "AU_ANISKIP_HOTKEY",
              action: isStart ? "start" : "end",
              key: e.key,
              currentTime: pos,
              duration: dur
            },
            "*"
          );
        } catch (_) {}
      }
    },
    true
  );

  setInterval(checkTime, 250);
  notifyReady();
}
