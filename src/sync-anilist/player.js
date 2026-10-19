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

  function getPlayer() {
    const uWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
    return typeof uWin.jwplayer === "function" ? uWin.jwplayer() : null;
  }

  function getPos() {
    const jw = getPlayer();
    if (jw && typeof jw.getPosition === "function") {
      const p = jw.getPosition();
      if (typeof p === "number" && !isNaN(p)) return p;
    }
    return document.querySelector("video")?.currentTime || 0;
  }

  function getDuration() {
    const jw = getPlayer();
    if (jw && typeof jw.getDuration === "function") {
      const d = jw.getDuration();
      if (typeof d === "number" && !isNaN(d) && d > 0) return d;
    }
    return document.querySelector("video")?.duration || 0;
  }

  function notifyReady() {
    const dur = getDuration();
    if (dur > 0 && Math.round(dur) !== Math.round(lastReportedDur)) {
      lastReportedDur = dur;
      try {
        window.top.postMessage({ type: "AU_FRAME_READY", duration: dur }, "*");
      } catch (_) {}
    }
  }

  function bindMediaEvents() {
    const video = document.querySelector("video");
    if (video && !video.__au_skip_bound) {
      video.__au_skip_bound = true;
      video.addEventListener("timeupdate", checkTime);
      video.addEventListener("loadedmetadata", () => {
        notifyReady();
        computeAdjustedOp();
      });
      video.addEventListener("durationchange", () => {
        notifyReady();
        computeAdjustedOp();
      });
    }

    const jw = getPlayer();
    if (jw && typeof jw.on === "function" && !jw.__au_skip_bound) {
      jw.__au_skip_bound = true;
      jw.on("time", checkTime);
      jw.on("meta", () => {
        notifyReady();
        computeAdjustedOp();
      });
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
    const jw = getPlayer();
    if (jw && typeof jw.seek === "function") {
      jw.seek(target);
    } else {
      const v = document.querySelector("video");
      if (v) v.currentTime = target;
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

    const target = document.querySelector(".jw-wrapper, .jwplayer, #player") || document.body;
    if (window.getComputedStyle(target).position === "static") {
      target.style.position = "relative";
    }
    target.appendChild(btn);
  }

  function checkTime() {
    bindMediaEvents();

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
