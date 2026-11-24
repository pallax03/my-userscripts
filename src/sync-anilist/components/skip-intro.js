import { Settings } from "../settings.js";
import { Logger } from "../../shared/logger.js";
import { showToast } from "../../shared/toast.js";
import { slot } from "../slots.js";
import { iconHtml, SkipForward, Plus, Pencil, ThumbsUp, ThumbsDown } from "../../shared/icons.js";
import { resolveSkipSegment, resolveManualSkipTarget, hasPostCredits } from "../skip-logic.js";
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
let aniskipOp = null;
let aniskipEd = null;
let nativeIntro = null;
let nativeOutro = null;
let activeOp = null;
let activeEd = null;
let activeDuration = 0;
let fetchToken = 0;
let episodeAutoSkipOverride = null;
let currentProvider = null;

let lastKnownCurrentTime = 0;
let lastKnownDuration = 0;

function syncActiveOp() {
  activeOp = resolveSkipSegment({ aniskipOp, nativeIntro });
  activeEd = resolveSkipSegment({ aniskipOp: aniskipEd, nativeIntro: nativeOutro });
}

export function getActiveSkipSegments() {
  return { op: activeOp, ed: activeEd };
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
  const isEd = newData?.skipType === "ed" || newData?.skipType === "mixed-ed";
  if (isEd) {
    aniskipEd = { ...newData, source: "aniskip" };
  } else {
    aniskipOp = { ...newData, source: "aniskip" };
  }
  syncActiveOp();
  const { malId, epNum } = getEffectiveIds();
  if (malId && epNum) {
    const cacheKey = `${malId}_${epNum}`;
    cache.set(cacheKey, { op: aniskipOp, ed: aniskipEd, queriedLength: activeDuration });
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
  const dur = activeDuration || lastKnownDuration;
  const preferEd = dur > 0 && lastKnownCurrentTime > dur * 0.5;
  const initialType = preferEd ? "ed" : "op";
  const seg = preferEd ? activeEd : activeOp;
  openAniSkipDock({
    malId,
    epNum,
    currentTime: lastKnownCurrentTime,
    duration: dur,
    initialStart: seg?.start ?? null,
    initialEnd: seg?.end ?? null,
    skipType: seg?.skipType || initialType,
    existingOp: activeOp,
    existingEd: activeEd,
    provider: currentProvider,
    onSuccess: handleSuccessfulContribution
  });
  return true;
}

export function renderAutoSkipButton(provider) {
  if (provider) currentProvider = provider;

  const container = slot("skip");
  if (!container) return;

  if (!currentProvider?.isWatchPage?.()) {
    container.innerHTML = "";
    container.style.display = "none";
    container.dataset.rendered = "0";
    return;
  }
  container.style.display = "";

  const settings = Settings.get();
  const isActive = isEpisodeAutoSkipActive();
  const hasAnySegment = Boolean(activeOp || activeEd);
  const dur = activeDuration || lastKnownDuration;
  const inOpWindow = Boolean(
    activeOp &&
    !isActive &&
    lastKnownCurrentTime >= Math.max(0, activeOp.start - 1.5) &&
    lastKnownCurrentTime <= Math.max(activeOp.start, activeOp.end - 2)
  );
  const inEdWindow = Boolean(
    !inOpWindow &&
    activeEd &&
    !isActive &&
    lastKnownCurrentTime >= Math.max(0, activeEd.start - 1.5) &&
    lastKnownCurrentTime <= Math.max(activeEd.start, activeEd.end - 2)
  );
  const inSkipWindow = inOpWindow || inEdWindow;
  const voteSeg = (inEdWindow || (activeEd && dur > 0 && lastKnownCurrentTime > dur * 0.5) || !activeOp)
    ? activeEd
    : activeOp;
  const currentVote = (settings.communityAniSkip && voteSeg?.skipId)
    ? getVoteStatus(voteSeg.skipId)
    : null;
  const opKey = activeOp ? `${activeOp.start}-${activeOp.end}-${activeOp.source || "aniskip"}-${activeOp.skipId || ""}` : "none";
  const edKey = activeEd ? `${activeEd.start}-${activeEd.end}-${activeEd.source || "aniskip"}-${activeEd.skipId || ""}` : "none";
  const renderKey = `${opKey}|${edKey}|${isActive}|${settings.communityAniSkip}|${inOpWindow}|${inEdWindow}|${voteSeg?.skipId || ""}|${currentVote || ""}`;
  if (container.__lastSkipKey === renderKey && container.dataset.rendered === "1") return;
  container.__lastSkipKey = renderKey;
  container.dataset.rendered = "1";

  if (!hasAnySegment) {
    if (!settings.communityAniSkip) {
      container.innerHTML = "";
      return;
    }
    container.innerHTML = `
      <div class="al-dock-skip-cluster">
        <button type="button" class="al-dock-chip is-pending" id="al-skip-add-btn" title="Add intro / ending timestamps (Key: [ / ])">
          ${iconHtml(Plus, { width: 11, height: 11 })}
          <span>Intro/ED</span>
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

  const primarySeg = activeOp || activeEd;
  const srcLabel = primarySeg.source === "native" ? "Native" : "AniSkip";
  const nowLabel = inEdWindow
    ? (hasPostCredits(activeEd, dur) ? "Post-Credits" : "Skip ED")
    : "Skip";
  const nowTitle = inEdWindow ? "Skip Ending (Key: S)" : "Skip Intro (Key: S)";
  const voteKindLabel = voteSeg === activeEd ? "ED" : "OP";

  container.innerHTML = `
    <div class="al-dock-skip-cluster">
      ${inSkipWindow ? `
        <button type="button" class="al-dock-btn is-pending" id="al-skip-now-btn" title="${nowTitle}">
          ${iconHtml(SkipForward, { width: 11, height: 11 })}
          <span>${nowLabel}</span>
        </button>
      ` : ""}
      <button type="button" class="al-dock-chip al-is-toggle ${isActive ? "is-tracked" : "is-pending"}" id="al-skip-toggle-btn" title="${srcLabel}: ${isActive ? "Auto-skip ON (OP & ED)" : "Auto-skip OFF"}">
        ${iconHtml(SkipForward, { width: 11, height: 11 })}
        <span>Skip</span>
      </button>
      ${settings.communityAniSkip && voteSeg?.skipId ? `
        <div class="al-skip-pill-votes" title="Vote ${voteKindLabel} skip timing">
          <button type="button" class="al-skip-vote-btn is-upvote ${currentVote === "upvote" ? "is-voted" : ""}" title="Accurate ${voteKindLabel} (+1)">
            ${iconHtml(ThumbsUp, { width: 11, height: 11 })}
          </button>
          <button type="button" class="al-skip-vote-btn is-downvote ${currentVote === "downvote" ? "is-voted" : ""}" title="Inaccurate ${voteKindLabel} (-1)">
            ${iconHtml(ThumbsDown, { width: 11, height: 11 })}
          </button>
        </div>
      ` : ""}
      ${settings.communityAniSkip ? `
        <button type="button" class="al-dock-step-btn" id="al-skip-edit-btn" title="Calibrate OP / ED (Key: [ / ])">
          ${iconHtml(Pencil, { width: 10, height: 10 })}
        </button>
      ` : ""}
    </div>
  `;

  container.querySelector("#al-skip-now-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    triggerSkip();
  });

  container.querySelector("#al-skip-toggle-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleEpisodeAutoSkip();
  });

  container.querySelector(".is-upvote")?.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await voteSkipTime({ skipId: voteSeg.skipId, voteType: "upvote" });
    if (ok) renderAutoSkipButton(currentProvider);
  });

  container.querySelector(".is-downvote")?.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await voteSkipTime({ skipId: voteSeg.skipId, voteType: "downvote" });
    if (ok) renderAutoSkipButton(currentProvider);
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
    ed: activeEd,
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
  const isEpSwitch = (activeMalId !== null && malId !== activeMalId) || (activeEp !== null && epNum !== activeEp);

  if (isNew) {
    activeMalId = malId;
    activeEp = epNum;
    activeDuration = roundedDur;
    aniskipOp = null;
    aniskipEd = null;
    if (isEpSwitch) {
      nativeIntro = null;
      nativeOutro = null;
    }
    syncActiveOp();
    episodeAutoSkipOverride = null;
    broadcastOp();
    renderAutoSkipButton(currentProvider);
  } else if (roundedDur > 0) {
    activeDuration = roundedDur;
  }

  const cacheKey = `${malId}_${epNum}`;
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    const shouldRefetchWithDur = roundedDur > 0 && !cached?.op && cached?.queriedLength === 0;
    if (!shouldRefetchWithDur) {
      aniskipOp = cached?.op || null;
      aniskipEd = cached?.ed || null;
      syncActiveOp();
      broadcastOp();
      renderAutoSkipButton(currentProvider);
      return;
    }
  }

  const token = ++fetchToken;
  try {
    const res = await fetch(
      `https://api.aniskip.com/v2/skip-times/${malId}/${epNum}?types=op&types=ed&episodeLength=${activeDuration}`
    );

    if (token !== fetchToken) return;

    if (!res.ok) {
      aniskipOp = null;
      aniskipEd = null;
      cache.set(cacheKey, { op: null, ed: null, queriedLength: activeDuration });
      syncActiveOp();
      broadcastOp();
      renderAutoSkipButton(currentProvider);
      return;
    }

    const data = await res.json();
    const toSegment = (r) => r ? {
      start: r.interval.startTime,
      end: r.interval.endTime,
      episodeLength: r.episodeLength || 0,
      skipType: r.skipType,
      skipId: r.skipId,
      source: "aniskip"
    } : null;

    const op = data.results?.find((r) => r.skipType === "op" || r.skipType === "mixed-op");
    const ed = data.results?.find((r) => r.skipType === "ed" || r.skipType === "mixed-ed");
    aniskipOp = toSegment(op);
    aniskipEd = toSegment(ed);
    cache.set(cacheKey, { op: aniskipOp, ed: aniskipEd, queriedLength: activeDuration });
    syncActiveOp();

    Logger.info(`📡 AniSkip result for Ep ${epNum}:`, activeOp || "No opening found");
    broadcastOp();
    renderAutoSkipButton(currentProvider);
  } catch (err) {
    Logger.warn("AniSkip fetch failed:", err);
    syncActiveOp();
    broadcastOp();
    renderAutoSkipButton(currentProvider);
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
      existingOp: activeOp,
      existingEd: activeEd,
      provider: currentProvider,
      onSuccess: handleSuccessfulContribution
    }
  );
}

function triggerSkip() {
  const frames = document.querySelectorAll("iframe");
  frames.forEach((frame) => {
    try {
      frame.contentWindow?.postMessage({ type: "AU_TRIGGER_SKIP" }, "*");
    } catch (_) {}
  });

  const topVideo = document.querySelector("video");
  if (topVideo) {
    const fallbackDuration = Settings.get().skipFallbackDuration || 85;
    const resolution = resolveManualSkipTarget({
      currentPos: topVideo.currentTime || 0,
      duration: topVideo.duration || 0,
      segment: activeOp,
      edSegment: activeEd,
      fallbackDuration
    });
    topVideo.currentTime = resolution.target;
    const label = resolution.source === "fallback"
      ? `⏩ Skipped +${fallbackDuration}s`
      : resolution.kind === "ed"
        ? (resolution.hasPostCredits ? "⏩ Skipped ending -> Post-credits" : "⏩ Ending skipped (no post-credits)")
        : `⏩ Skipped intro (${resolution.source === "native" ? "Native" : "AniSkip"})`;
    showToast(label, false, 2000);
  }
}

export function initSkipIntroTop() {
  window.addEventListener("message", (e) => {
    if (e.data?.type === "AU_FRAME_READY" || e.data?.type === "AL_PLAYER_READY") {
      const frameDur = e.data.duration ? Math.round(e.data.duration) : 0;
      if (frameDur > 0 && !aniskipOp && activeMalId && activeEp) {
        checkSkipIntro(activeMalId, activeEp, frameDur);
      } else {
        broadcastOp();
      }
    } else if (e.data?.type === "AU_NATIVE_TIMESTAMPS" && (e.data.intro || e.data.outro)) {
      const prevKey = `${activeOp?.start || ""}-${activeOp?.end || ""}|${activeEd?.start || ""}-${activeEd?.end || ""}`;
      if (e.data.intro) {
        nativeIntro = {
          start: e.data.intro.start,
          end: e.data.intro.end,
          episodeLength: activeDuration || lastKnownDuration,
          skipType: "op",
          source: "native"
        };
      }
      if (e.data.outro) {
        nativeOutro = {
          start: e.data.outro.start,
          end: e.data.outro.end,
          episodeLength: activeDuration || lastKnownDuration,
          skipType: "ed",
          source: "native"
        };
      }
      syncActiveOp();
      const nextKey = `${activeOp?.start || ""}-${activeOp?.end || ""}|${activeEd?.start || ""}-${activeEd?.end || ""}`;
      if ((activeOp || activeEd) && nextKey !== prevKey) {
        broadcastOp();
        renderAutoSkipButton(currentProvider);
        if (activeOp && !document.getElementById("al-dock-banner")?.textContent) {
          showToast(`⏩ Intro ready (${activeOp.source === "native" ? "Native" : "AniSkip"})`, false, 1800);
        }
      }
    } else if (e.data?.type === "AL_PLAYBACK_STATE") {
      if (typeof e.data.currentTime === "number") {
        lastKnownCurrentTime = e.data.currentTime;
      }
      if (typeof e.data.duration === "number" && e.data.duration > 0) {
        lastKnownDuration = e.data.duration;
      }
      if ((activeOp || activeEd) && !isEpisodeAutoSkipActive()) {
        renderAutoSkipButton(currentProvider);
      }
    } else if (e.data?.type === "AU_SKIP_EXECUTED") {
      let label;
      if (e.data.source === "fallback") {
        label = `⏩ Skipped +${e.data.fallbackDuration || 85}s`;
      } else if (e.data.kind === "ed") {
        label = e.data.hasPostCredits
          ? `⏩ ${e.data.mode === "auto" ? "Auto-skipped" : "Skipped"} ending -> Post-credits`
          : "⏩ Ending skipped (no post-credits)";
      } else {
        label = `⏩ ${e.data.mode === "auto" ? "Auto-skipped" : "Skipped"} intro (${e.data.source === "native" ? "Native" : "AniSkip"})`;
      }
      showToast(label, false, 2000);
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
        triggerSkip();
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
