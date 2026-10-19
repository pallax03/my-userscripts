// Top window: AnimeUnity page
if (window.self === window.top) {
  let activeMalId = null;
  let activeEp = null;
  let activeOp = null;
  let activeDuration = 0;

  function getCurrentEpisode(overrideEp) {
    if (typeof overrideEp === "number" && overrideEp > 0) {
      return overrideEp;
    }

    // 1. Primary: Extract episode ID from current URL path (/anime/<id>-<slug>/<ep_id>)
    // and match against <video-player episodes="..."> HTML attribute.
    // Works reliably in isolated userscript sandboxes without needing Vue access!
    try {
      const pathParts = window.location.pathname.split("/").filter(Boolean);
      const epIdInUrl = parseInt(pathParts[pathParts.length - 1], 10);
      if (epIdInUrl) {
        const playerEl = document.querySelector("video-player");
        const rawEps = playerEl?.getAttribute("episodes");
        if (rawEps) {
          const list = JSON.parse(rawEps);
          const matched = list.find((e) => e.id === epIdInUrl);
          if (matched?.number) {
            const num = parseInt(matched.number, 10);
            if (!isNaN(num) && num > 0) return num;
          }
        }
      }
    } catch (_) {}

    // 2. Active element in episode list (.episode-wrapper .episode-item.active)
    const activeItem = document.querySelector(".episode-wrapper .episode-item.active, .episode-item.active");
    if (activeItem) {
      const text = activeItem.innerText?.trim();
      const num = parseInt(text, 10);
      if (!isNaN(num) && num > 0) return num;
    }

    // 3. Vue component state (if accessible via main world / unsafeWindow)
    try {
      const uWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
      const playerEl = uWin.document.querySelector("video-player, layout-items");
      const vue = playerEl?.__vue__ || uWin.document.querySelector(".episode-wrapper")?.__vue__;
      if (vue?.episode_parsed?.number) {
        const num = parseInt(vue.episode_parsed.number, 10);
        if (!isNaN(num) && num > 0) return num;
      }
      const pathParts = window.location.pathname.split("/").filter(Boolean);
      const epIdInUrl = parseInt(pathParts[pathParts.length - 1], 10);
      if (epIdInUrl && Array.isArray(vue?.episodes)) {
        const matched = vue.episodes.find((e) => e.id === epIdInUrl);
        if (matched?.number) {
          const num = parseInt(matched.number, 10);
          if (!isNaN(num) && num > 0) return num;
        }
      }
    } catch (_) {}

    // 4. Fallback: static server-rendered HTML attribute on <video-player>
    try {
      const player = document.querySelector("video-player");
      const epAttr = player?.getAttribute("episode");
      if (epAttr) {
        const parsed = JSON.parse(epAttr);
        const num = parseInt(parsed?.number, 10);
        if (!isNaN(num) && num > 0) return num;
      }
    } catch (_) {}

    return 1;
  }

  function getAnimeData() {
    try {
      const uWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
      const playerEl = uWin.document.querySelector("video-player, layout-items");
      const vue = playerEl?.__vue__ || uWin.document.querySelector(".episode-wrapper")?.__vue__;
      if (vue?.anime_parsed?.mal_id) {
        return { malId: vue.anime_parsed.mal_id };
      }
    } catch (_) {}

    try {
      const player = document.querySelector("video-player");
      const anime = JSON.parse(player?.getAttribute("anime") || "{}");
      if (anime.mal_id) return { malId: anime.mal_id };
    } catch (_) {}

    return { malId: null };
  }

  async function checkEpisode(duration = 0, overrideEp = null) {
    const { malId } = getAnimeData();
    const epNum = getCurrentEpisode(overrideEp);
    const roundedDur = Math.round(duration || 0);

    if (!malId || !epNum) return;

    const isNewEp = malId !== activeMalId || epNum !== activeEp;
    if (!isNewEp && activeOp !== null) {
      return;
    }

    if (isNewEp) {
      console.log(`[AU SkipIntro] 🔄 Episode changed: Ep ${activeEp} -> Ep ${epNum}`);
      activeMalId = malId;
      activeEp = epNum;
      activeDuration = roundedDur;
      activeOp = null;
      broadcastOp(); // Instantly clear previous episode's timestamps in player subframe!
    } else if (roundedDur > 0) {
      activeDuration = roundedDur;
    }

    console.log(`[AU SkipIntro] 🎬 Top page: Fetching AniSkip for MAL ${malId}, Ep ${epNum} (dur: ${activeDuration}s)...`);
    try {
      const res = await fetch(
        `https://api.aniskip.com/v2/skip-times/${malId}/${epNum}?types=op&episodeLength=${activeDuration}`
      );
      if (!res.ok) {
        if (res.status === 404) {
          console.warn(`[AU SkipIntro] ℹ️ AniSkip has no skip times for MAL ${malId} Ep ${epNum} (HTTP 404 - Not submitted yet)`);
        } else {
          console.warn(`[AU SkipIntro] ⚠️ AniSkip returned HTTP ${res.status} for MAL ${malId} Ep ${epNum}`);
        }
        activeOp = null;
        broadcastOp();
        return;
      }

      const data = await res.json();
      const opResult = data.results?.find((r) => r.skipType === "op" || r.skipType === "mixed-op");
      activeOp = opResult
        ? {
            start: opResult.interval.startTime,
            end: opResult.interval.endTime,
            episodeLength: opResult.episodeLength || 0,
            skipType: opResult.skipType,
          }
        : null;

      console.log(`[AU SkipIntro] 📡 AniSkip API result for Ep ${epNum}:`, activeOp || "No opening found");
      broadcastOp();
    } catch (err) {
      console.error("[AU SkipIntro] Error checking episode:", err);
    }
  }

  function broadcastOp() {
    document.querySelectorAll("iframe").forEach((f) => {
      try {
        f.contentWindow?.postMessage({ type: "AU_SKIP_OP", op: activeOp }, "*");
      } catch (_) {}
    });
  }

  // Intercept client-side routing & URL pushState
  const origPushState = history.pushState;
  history.pushState = function (...args) {
    origPushState.apply(this, args);
    setTimeout(() => checkEpisode(), 50);
    setTimeout(() => checkEpisode(), 250);
  };
  const origReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    origReplaceState.apply(this, args);
    setTimeout(() => checkEpisode(), 50);
  };
  window.addEventListener("popstate", () => {
    setTimeout(() => checkEpisode(), 50);
    setTimeout(() => checkEpisode(), 250);
  });

  // Listen for clicks on episode selectors and pagination
  document.addEventListener(
    "click",
    (e) => {
      const epItem = e.target.closest(".episode-item");
      if (epItem) {
        const num = parseInt(epItem.innerText.trim(), 10);
        if (!isNaN(num) && num > 0) {
          checkEpisode(0, num);
          return;
        }
      }
      if (e.target.closest(".episode-wrapper, [class*='episode'], .pagination, #video-bottom, .player-controls")) {
        setTimeout(() => checkEpisode(), 80);
        setTimeout(() => checkEpisode(), 300);
      }
    },
    true
  );

  // Observe iframe src replacements (when Vue re-renders the embed player)
  const iframeObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "attributes" && m.attributeName === "src") {
        setTimeout(() => checkEpisode(), 100);
        break;
      }
    }
  });

  function observeIframes() {
    document.querySelectorAll("iframe").forEach((f) => {
      if (!f.__au_observed) {
        f.__au_observed = true;
        iframeObserver.observe(f, { attributes: true, attributeFilter: ["src"] });
      }
    });
  }
  setInterval(observeIframes, 1000);
  observeIframes();

  window.addEventListener("message", (e) => {
    if (e.data?.type === "AU_FRAME_READY") {
      const frameDur = e.data.duration ? Math.round(e.data.duration) : 0;
      console.log(`[AU SkipIntro] 📩 Frame ready received from player (dur: ${frameDur}s)`);
      checkEpisode(frameDur).then(() => {
        broadcastOp();
      });
    }
  });

  setInterval(() => checkEpisode(), 800);
  setInterval(broadcastOp, 2000);
  checkEpisode();
}

// Subframe: Player (VixCloud / JWPlayer)
else {
  let rawOp = null;
  let currentOp = null;
  let btn = null;
  let lastReportedDur = 0;
  let lastLoggedDur = null;
  let lastLoggedOffset = null;
  let isBtnVisible = false;

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
    const dur = Math.round(getDuration());
    if (dur > 0 && dur !== lastReportedDur) {
      lastReportedDur = dur;
      try {
        window.top.postMessage({ type: "AU_FRAME_READY", duration: dur }, "*");
      } catch (_) {}
    }
  }

  function computeAdjustedOp() {
    if (!rawOp) {
      currentOp = null;
      return;
    }
    const dur = getDuration();
    let offset = 0;
    let diff = 0;

    // Only adjust for pre-roll bumper if:
    // 1. AniSkip file length is longer than local file (diff >= 0.5s).
    //    (If local file is longer, the extra time is post-roll credits/preview at the end, NEVER pre-roll)
    // 2. The difference is within typical Japanese TV bumper range (<= 35s)
    // 3. The intro actually occurred after the bumper (rawOp.start >= diff)
    // 4. The intro did not start at 0:00 (if at 0:00, no pre-roll ever existed)
    if (dur > 0 && rawOp.episodeLength > 0 && rawOp.start > 0) {
      diff = rawOp.episodeLength - dur;
      if (diff >= 0.5 && diff <= 35 && rawOp.start >= diff) {
        offset = diff;
      }
    }

    currentOp = {
      start: Math.max(0, rawOp.start - offset),
      end: Math.max(0, rawOp.end - offset),
    };

    if (dur > 0 && (dur !== lastLoggedDur || offset !== lastLoggedOffset)) {
      lastLoggedDur = dur;
      lastLoggedOffset = offset;
      console.log("[AU SkipIntro] ⚙️ Subframe calculation:", {
        playerDuration: Number(dur.toFixed(2)),
        aniSkipLength: Number(rawOp.episodeLength.toFixed(2)),
        durationDiff: Number(diff.toFixed(2)),
        appliedOffset: Number(offset.toFixed(2)),
        rawInterval: `${rawOp.start}s -> ${rawOp.end}s`,
        adjustedInterval: `${currentOp.start.toFixed(2)}s -> ${currentOp.end.toFixed(2)}s`,
        buttonWindow: `${Math.max(0, currentOp.start - 1.5).toFixed(2)}s -> ${Math.max(0, currentOp.end - 2).toFixed(2)}s`,
        skipTarget: `${Math.max(0, currentOp.end - 1).toFixed(2)}s`
      });
    }
  }

  function skipIntro() {
    if (!currentOp) return;
    const pos = getPos();
    const target = Math.max(0, currentOp.end - 1);
    console.log(`[AU SkipIntro] ⏩ User skipped intro: seeking from ${pos.toFixed(2)}s to ${target.toFixed(2)}s`);
    const jw = getPlayer();
    if (jw && typeof jw.seek === "function") {
      jw.seek(target);
    } else {
      const v = document.querySelector("video");
      if (v) v.currentTime = target;
    }
    if (btn) {
      btn.style.display = "none";
      isBtnVisible = false;
    }
  }

  function ensureButton() {
    if (btn && btn.parentElement) return;

    btn = document.createElement("button");
    btn.id = "au-skip-intro-btn";
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><polygon points="19 5 19 19"></polygon></svg>
      <span>Salta Intro</span>
    `;
    btn.style.cssText = `
      position: absolute !important;
      bottom: 56px !important;
      right: 20px !important;
      z-index: 2147483647 !important;
      display: none;
      align-items: center !important;
      gap: 6px !important;
      background: rgba(10, 16, 26, 0.92) !important;
      backdrop-filter: blur(8px) !important;
      -webkit-backdrop-filter: blur(8px) !important;
      border: 1.5px solid #3db4f2 !important;
      color: #fff !important;
      font-family: inherit !important;
      font-size: 13px !important;
      font-weight: 800 !important;
      padding: 8px 16px !important;
      border-radius: 8px !important;
      cursor: pointer !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6), 0 0 12px rgba(61, 180, 242, 0.4) !important;
      user-select: none !important;
      pointer-events: auto !important;
      transition: transform 0.15s, background 0.15s !important;
    `;

    btn.addEventListener("mouseenter", () => {
      btn.style.background = "#3db4f2";
      btn.style.color = "#06101e";
      btn.style.transform = "scale(1.04)";
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.background = "rgba(10, 16, 26, 0.92)";
      btn.style.color = "#fff";
      btn.style.transform = "scale(1)";
    });

    ["mousedown", "mouseup", "pointerdown", "touchstart", "click"].forEach((evt) => {
      btn.addEventListener(
        evt,
        (e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
          if (evt === "click") {
            e.preventDefault();
            skipIntro();
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

  function bindPlayerEvents() {
    const video = document.querySelector("video");
    if (video && !video.__au_skip_bound) {
      video.__au_skip_bound = true;
      video.addEventListener("timeupdate", checkTime);
      video.addEventListener("loadedmetadata", () => {
        notifyReady();
        computeAdjustedOp();
      });
      video.addEventListener("play", notifyReady);
    }

    const jw = getPlayer();
    if (jw && typeof jw.on === "function" && !jw.__au_skip_bound) {
      jw.__au_skip_bound = true;
      jw.on("time", checkTime);
      jw.on("ready", notifyReady);
      jw.on("play", notifyReady);
      jw.on("meta", () => {
        notifyReady();
        computeAdjustedOp();
      });
    }
  }

  function checkTime() {
    bindPlayerEvents();
    notifyReady();

    if (!rawOp) {
      if (btn && isBtnVisible) {
        btn.style.display = "none";
        isBtnVisible = false;
      }
      return;
    }

    ensureButton();
    computeAdjustedOp();
    if (!currentOp) return;

    const pos = getPos();

    const showStart = Math.max(0, currentOp.start - 1.5);
    // Hide button 2 seconds before the end of the OP
    const showEnd = Math.max(showStart, currentOp.end - 2);

    if (pos >= showStart && pos <= showEnd) {
      if (!isBtnVisible) {
        btn.style.display = "inline-flex";
        isBtnVisible = true;
        console.log(`[AU SkipIntro] 👁️ Button shown at ${pos.toFixed(2)}s (window: ${showStart.toFixed(2)}s - ${showEnd.toFixed(2)}s)`);
      }
    } else {
      if (isBtnVisible) {
        btn.style.display = "none";
        isBtnVisible = false;
        console.log(`[AU SkipIntro] 🙈 Button hidden at ${pos.toFixed(2)}s`);
      }
    }
  }

  window.addEventListener("message", (e) => {
    if (e.data?.type === "AU_SKIP_OP") {
      rawOp = e.data.op || null;
      computeAdjustedOp();
      checkTime();
    }
  });

  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "s" || e.key === "S") {
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "select") return;
        const pos = getPos();
        const showStart = currentOp ? Math.max(0, currentOp.start - 1.5) : 0;
        const showEnd = currentOp ? Math.max(showStart, currentOp.end - 2) : 0;
        if (currentOp && pos >= showStart && pos <= showEnd) {
          e.preventDefault();
          skipIntro();
        }
      }
    },
    true
  );

  setInterval(checkTime, 200);
  notifyReady();
}
