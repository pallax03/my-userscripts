import { Logger } from "../shared/logger.js";

export function initPlayer() {
  let rawOp = null;
  let currentOp = null;
  let autoSkip = false;
  let skipFallbackDuration = 85;
  let btn = null;
  let isBtnVisible = false;
  let lastReportedDur = 0;
  let hasAutoSkipped = false;
  let lastSkipTime = 0;
  let pendingResumeSeek = null;
  let activeResumeTarget = null;
  let hasConfirmedResume = false;
  let activeGuardInterval = null;
  let hasReportedPlayerReady = false;
  let lastBroadcastTime = 0;

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
    if (!force && now - lastBroadcastTime < 750) return;
    lastBroadcastTime = now;

    const pos = getPos();
    const dur = getDuration();
    const video = document.querySelector("video");
    const jw = getPlayer();
    const vds = getVidstack();

    let isPaused = true;
    let isEnded = false;

    if (jw && typeof jw.getState === "function") {
      isPaused = jw.getState() === "paused" || jw.getState() === "idle";
      isEnded = jw.getState() === "complete";
    } else if (vds && typeof vds.paused !== "undefined") {
      isPaused = vds.paused;
      isEnded = vds.ended;
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
    hasConfirmedResume = false;
    activeResumeTarget = target;
    const dur = getDuration();

    if (dur > 0 && target < dur - 5) {
      seekTo(target);
      Logger.info(`↺ Applying seekTo ${target}s`);

      // Anti-reset guard: HLS players often reset time to 0 upon first user play
      if (activeGuardInterval) clearInterval(activeGuardInterval);
      let checks = 0;
      activeGuardInterval = setInterval(() => {
        checks++;
        const currentPos = getPos();
        if (currentPos < 3 && checks <= 6) {
          seekTo(target);
        } else if (currentPos >= target - 5 || checks > 8) {
          clearInterval(activeGuardInterval);
          activeGuardInterval = null;
          if (!hasConfirmedResume) {
            hasConfirmedResume = true;
            try {
              window.top.postMessage({ type: "AL_RESUME_CONFIRMED", time: target }, "*");
            } catch (_) {}
          }
        }
      }, 400);

      pendingResumeSeek = null;
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
        try {
          window.top.postMessage({ type: "AU_FRAME_READY", duration: dur }, "*");
        } catch (_) {}
      }
      if (!hasReportedPlayerReady) {
        hasReportedPlayerReady = true;
        try {
          window.top.postMessage({ type: "AL_PLAYER_READY", duration: dur }, "*");
        } catch (_) {}
      }

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
      video.addEventListener("seeking", cancelActiveResume);
      video.addEventListener("pause", () => broadcastPlaybackState(true));
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
      jw.on("seek", cancelActiveResume);
      jw.on("pause", () => broadcastPlaybackState(true));
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
      vds.addEventListener("seeking", cancelActiveResume);
      vds.addEventListener("pause", () => broadcastPlaybackState(true));
      vds.addEventListener("ended", () => broadcastPlaybackState(true));
    }
  }

  function computeAdjustedOp() {
    if (!rawOp) {
      currentOp = null;
      return;
    }
    const dur = getDuration();
    let offset = 0;

    // Adjust for pre-roll bumper if AniSkip file is longer by <= 35s
    if (dur > 0 && rawOp.episodeLength > 0 && rawOp.start > 0) {
      const diff = rawOp.episodeLength - dur;
      if (diff >= 0.5 && diff <= 35 && rawOp.start >= diff) {
        offset = diff;
      }
    }

    currentOp = {
      start: Math.max(0, rawOp.start - offset),
      end: Math.max(0, rawOp.end - offset)
    };
  }

  function seekTo(target) {
    if (typeof target !== "number" || isNaN(target) || target <= 0) return;
    const jw = getPlayer();
    if (jw && typeof jw.seek === "function") {
      try {
        jw.seek(target);
      } catch (_) {}
    }
    const vds = getVidstack();
    if (vds && typeof vds.currentTime !== "undefined") {
      try {
        vds.currentTime = target;
      } catch (_) {}
    }
    const v = document.querySelector("video");
    if (v) {
      try {
        v.currentTime = target;
      } catch (_) {}
    }
  }

  function skipIntro(isAuto = false) {
    if (!currentOp) return;
    const target = Math.max(0, currentOp.end - 1);
    Logger.info(`⏩ ${isAuto ? "Auto-skipped" : "User skipped"} intro to ${target.toFixed(2)}s`);
    seekTo(target);
    if (btn) {
      btn.style.display = "none";
      isBtnVisible = false;
    }
  }

  function fallbackSkip() {
    const pos = getPos();
    const dur = getDuration();
    const target = dur > 0 ? Math.min(dur - 1, pos + skipFallbackDuration) : pos + skipFallbackDuration;
    Logger.info(`⏩ Fallback skip (+${skipFallbackDuration}s) to ${target.toFixed(2)}s`);
    seekTo(target);
    if (btn) {
      btn.style.display = "none";
      isBtnVisible = false;
    }
  }

  function handleSkipAction() {
    cancelActiveResume();
    const now = Date.now();
    if (now - lastSkipTime < 500) return;
    lastSkipTime = now;

    const pos = getPos();
    const showStart = currentOp ? Math.max(0, currentOp.start - 1.5) : 0;
    const showEnd = currentOp ? Math.max(showStart, currentOp.end - 2) : 0;
    if (currentOp && pos >= showStart && pos <= showEnd) {
      skipIntro(false);
    } else {
      fallbackSkip();
    }
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
            skipIntro(false);
          }
        },
        true
      );
    });

    const target = document.querySelector(".jw-wrapper, .jwplayer, #player, .player, .video-container, video")?.parentElement || document.body;
    if (window.getComputedStyle(target).position === "static") {
      target.style.position = "relative";
    }
    target.appendChild(btn);
  }

  function checkTime() {
    bindMediaEvents();

    if (activeResumeTarget !== null && getPos() >= activeResumeTarget - 3) {
      activeResumeTarget = null;
    }

    if (getDuration() > 0 && Math.round(getDuration()) !== Math.round(lastReportedDur)) {
      notifyReady();
    }

    if (!rawOp) {
      if (btn && isBtnVisible) {
        btn.style.display = "none";
        isBtnVisible = false;
      }
      return;
    }

    computeAdjustedOp();
    if (!currentOp) return;

    const pos = getPos();

    // Auto-skip logic
    if (autoSkip) {
      if (btn && isBtnVisible) {
        btn.style.display = "none";
        isBtnVisible = false;
      }
      if (pos >= currentOp.start && pos < currentOp.end - 1) {
        if (!hasAutoSkipped) {
          hasAutoSkipped = true;
          skipIntro(true);
        }
      } else if (pos < currentOp.start - 5) {
        hasAutoSkipped = false;
      }
      return;
    }

    // Manual skip button logic
    const showStart = Math.max(0, currentOp.start - 1.5);
    const showEnd = Math.max(showStart, currentOp.end - 2);

    if (pos >= showStart && pos <= showEnd) {
      if (!isBtnVisible) {
        ensureButton();
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
      autoSkip = !!e.data.autoSkip;
      if (typeof e.data.skipFallbackDuration === "number" && e.data.skipFallbackDuration > 0) {
        skipFallbackDuration = e.data.skipFallbackDuration;
      }
      hasAutoSkipped = false;
      computeAdjustedOp();
      checkTime();
    } else if (e.data?.type === "AU_TRIGGER_SKIP") {
      handleSkipAction();
    } else if (e.data?.type === "AL_RESUME_SEEK") {
      applyResumeSeek(e.data.target);
    }
  });

  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "s" || e.key === "S") {
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
        e.preventDefault();
        handleSkipAction();
      }
    },
    true
  );

  setInterval(checkTime, 250);
  notifyReady();
}
