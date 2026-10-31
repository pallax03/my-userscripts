import { Storage } from "../../shared/storage.js";
import { Logger } from "../../shared/logger.js";
import { showToast } from "../../shared/toast.js";
import {
  iconHtml,
  Check,
  X,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Tv
} from "../../shared/icons.js";
import { Resume } from "../resume.js";
import { Settings } from "../settings.js";

const ANISKIP_API_URL = "https://api.aniskip.com/v2";
const PRESET_PROVIDERS = ["Crunchyroll", "Netflix", "Prime Video", "Disney+", "HIDIVE", "Fansub"];

/**
 * Sends seek command to player frames and native video element
 * @param {number} targetSec
 */
export function seekPlayerTime(targetSec) {
  if (typeof targetSec !== "number" || isNaN(targetSec) || targetSec < 0) return;
  const t = Math.max(0, Math.round(targetSec * 10) / 10);
  document.querySelectorAll("iframe").forEach((frame) => {
    try {
      frame.contentWindow?.postMessage({ type: "AU_SEEK_PLAYER", time: t }, "*");
    } catch (_) {}
  });
  const v = document.querySelector("video");
  if (v) {
    try { v.currentTime = t; } catch (_) {}
  }
}

/**
 * Returns or generates a persistent UUID v4 submitter ID.
 * @returns {string}
 */
export function getSubmitterId() {
  let id = Storage.get("aniskip_submitter_id");
  if (!id) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      id = crypto.randomUUID();
    } else {
      id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
    Storage.set("aniskip_submitter_id", id);
  }
  return id;
}

/**
 * Gets remembered provider name (e.g. Crunchyroll, Netflix)
 * @returns {string}
 */
export function getSavedProvider() {
  return Storage.get("aniskip_provider") || "Crunchyroll";
}

/**
 * Saves provider name to storage
 * @param {string} val
 */
export function saveProvider(val) {
  if (val && typeof val === "string") {
    Storage.set("aniskip_provider", val.trim());
  }
}

/**
 * Gets vote status for a specific skipId from local storage.
 * @param {string} skipId
 * @returns {"upvote"|"downvote"|null}
 */
export function getVoteStatus(skipId) {
  if (!skipId) return null;
  return Storage.get(`aniskip_vote_${skipId}`) || null;
}

/**
 * Sends an upvote or downvote to AniSkip API.
 * @param {Object} params
 * @param {string} params.skipId
 * @param {"upvote"|"downvote"} params.voteType
 * @returns {Promise<boolean>}
 */
export async function voteSkipTime({ skipId, voteType }) {
  if (!skipId || !voteType) return false;

  const currentVote = getVoteStatus(skipId);
  if (currentVote === voteType) {
    showToast("Already voted on AniSkip", false, 2000);
    return false;
  }

  try {
    const res = await fetch(`${ANISKIP_API_URL}/skip-times/vote/${skipId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voteType })
    });

    if (res.status === 429) {
      showToast("AniSkip: Vote limit reached. Try again later.", true, 3000);
      return false;
    }

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      Logger.warn("AniSkip vote failed:", errData);
      showToast(errData.message || "Failed to submit vote", true, 3000);
      return false;
    }

    Storage.set(`aniskip_vote_${skipId}`, voteType);
    const label = voteType === "upvote" ? "Upvote recorded!" : "Downvote recorded!";
    showToast(`✓ AniSkip: ${label}`, false, 2500);
    return true;
  } catch (err) {
    Logger.error("AniSkip vote error:", err);
    showToast("Connection error with AniSkip", true, 3000);
    return false;
  }
}

/**
 * Submits new skip times to AniSkip API.
 * @param {Object} params
 * @param {number} params.malId
 * @param {number} params.epNum
 * @param {string} [params.skipType="op"]
 * @param {number} params.startTime
 * @param {number} params.endTime
 * @param {number} params.episodeLength
 * @param {string} [params.providerName="Crunchyroll"]
 * @returns {Promise<{ skipId: string }>}
 */
export async function createSkipTime({
  malId,
  epNum,
  skipType = "op",
  startTime,
  endTime,
  episodeLength,
  providerName = "Crunchyroll"
}) {
  if (!malId || !epNum) {
    throw new Error("Missing anime or episode metadata");
  }

  const start = Math.max(0, Math.round(startTime * 10) / 10);
  const end = Math.round(endTime * 10) / 10;
  const duration = Math.round((episodeLength || 0) * 10) / 10;
  const interval = end - start;

  if (interval < 5) {
    throw new Error("Interval must be at least 5 seconds");
  }
  if (interval > 240) {
    throw new Error("Interval cannot exceed 4 minutes");
  }

  const effectiveProvider = String(providerName || "Crunchyroll").trim();
  saveProvider(effectiveProvider);

  const payload = {
    skipType,
    providerName: effectiveProvider,
    startTime: start,
    endTime: end,
    episodeLength: duration > 0 ? duration : Math.max(end + 60, 1420),
    submitterId: getSubmitterId()
  };

  const res = await fetch(`${ANISKIP_API_URL}/skip-times/${malId}/${epNum}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (res.status === 429) {
    throw new Error("Daily submission limit reached for this episode (max 10/day)");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `AniSkip Error (${res.status})`);
  }

  return { skipId: data.skipId };
}

// -------------------------------------------------------------
// Interactive Non-Blocking AniSkip Dock (Single-Row Strip)
// -------------------------------------------------------------

let dockContainer = null;
let dockState = null;
let lastPlaybackTime = 0;
let lastPlaybackDuration = 0;

export function isAniSkipDockOpen() {
  return !!dockContainer && (document.body.contains(dockContainer) || document.fullscreenElement?.contains(dockContainer));
}

export function broadcastDockState(isOpen) {
  document.querySelectorAll("iframe").forEach((frame) => {
    try {
      frame.contentWindow?.postMessage({ type: "AU_ANISKIP_DOCK_STATE", open: isOpen }, "*");
    } catch (_) {}
  });
}

export function requestPlayerCurrentTime() {
  document.querySelectorAll("iframe").forEach((frame) => {
    try {
      frame.contentWindow?.postMessage({ type: "AU_REQUEST_CURRENT_TIME" }, "*");
    } catch (_) {}
  });
}

export function dismissAniSkipDock() {
  broadcastDockState(false);
  dockContainer?.remove();
  dockContainer = null;
  dockState = null;
}

export function getCurrentPlaybackTime() {
  const v = document.querySelector("video");
  if (v && typeof v.currentTime === "number" && !isNaN(v.currentTime)) {
    return v.currentTime;
  }
  return lastPlaybackTime;
}

/**
 * Returns recommended intro duration according to script formula
 * @returns {number}
 */
export function getRecommendedDuration() {
  const settings = Settings.get();
  return (typeof settings.skipFallbackDuration === "number" && settings.skipFallbackDuration > 0)
    ? settings.skipFallbackDuration
    : 85;
}

/**
 * Opens or updates the interactive non-blocking AniSkip Dock toolbar
 * @param {Object} options
 * @param {number} options.malId
 * @param {number} options.epNum
 * @param {number} [options.currentTime=0]
 * @param {number} [options.duration=0]
 * @param {number} [options.initialStart=null]
 * @param {number} [options.initialEnd=null]
 * @param {string} [options.skipType="op"]
 * @param {Object} [options.provider]
 * @param {Function} [options.onSuccess]
 */
export function openAniSkipDock({
  malId,
  epNum,
  currentTime = 0,
  duration = 0,
  initialStart = null,
  initialEnd = null,
  skipType = "op",
  provider,
  onSuccess
}) {
  if (typeof currentTime === "number" && currentTime > 0) {
    lastPlaybackTime = currentTime;
  }
  if (typeof duration === "number" && duration > 0) {
    lastPlaybackDuration = duration;
  }

  const currentPos = Math.max(0, Math.round((currentTime || lastPlaybackTime || 0) * 10) / 10);
  const totalDur = Math.round((duration || lastPlaybackDuration || 0) * 10) / 10;
  const recDuration = getRecommendedDuration();

  const isEditing = typeof initialStart === "number";
  const start = isEditing ? initialStart : currentPos;
  const end = typeof initialEnd === "number"
    ? initialEnd
    : (totalDur > 0 ? Math.min(totalDur, start + recDuration) : start + recDuration);

  dockState = {
    malId,
    epNum,
    skipType: skipType || "op",
    providerName: getSavedProvider(),
    startTime: start,
    endTime: Math.round(end * 10) / 10,
    episodeLength: totalDur,
    isManualIn: isEditing,
    isManualOut: isEditing,
    activeTarget: "in",
    lastManualTarget: isEditing ? "in" : null,
    lastCustomStart: isEditing ? initialStart : null,
    lastCustomEnd: isEditing ? initialEnd : null,
    provider,
    onSuccess
  };

  broadcastDockState(true);
  requestPlayerCurrentTime();

  if (isEditing) {
    seekPlayerTime(start);
  }

  renderAniSkipDock();
}

/**
 * Applies In point.
 * If repeatedly pressed on the same second: steps back by 1 second and seeks.
 * If pressed on a different timestamp: captures current time and seeks to align.
 * @param {number|null} [timeOverride=null]
 */
export function applyInPoint(timeOverride = null) {
  if (!dockState) return;
  const cur = typeof timeOverride === "number" ? timeOverride : getCurrentPlaybackTime();
  const recDuration = getRecommendedDuration();
  const curSec = Math.round(cur);
  const inSec = Math.round(dockState.startTime);

  // If repeatedly pressing Set In on the same second: nudge 1 second earlier
  if (Math.abs(cur - dockState.startTime) < 1.0 || curSec === inSec) {
    dockState.startTime = Math.max(0, inSec - 1);
  } else {
    dockState.startTime = Math.max(0, Math.round(cur * 10) / 10);
  }

  seekPlayerTime(dockState.startTime);

  dockState.isManualIn = true;
  dockState.activeTarget = "in";
  dockState.lastManualTarget = "in";

  // Auto-adjust complementary Out using exact script fallback duration if Out wasn't manual
  if (!dockState.isManualOut || dockState.endTime <= dockState.startTime) {
    const totalDur = dockState.episodeLength || 0;
    const smartEnd = totalDur > 0 ? Math.min(totalDur, dockState.startTime + recDuration) : dockState.startTime + recDuration;
    dockState.endTime = Math.round(smartEnd * 10) / 10;
  }

  renderAniSkipDock();
}

/**
 * Applies Out point.
 * If repeatedly pressed on the same second: steps back by 1 second (intro ended before scene began) and seeks.
 * If pressed on a different timestamp: captures current time and seeks to align.
 * @param {number|null} [timeOverride=null]
 */
export function applyOutPoint(timeOverride = null) {
  if (!dockState) return;
  const cur = typeof timeOverride === "number" ? timeOverride : getCurrentPlaybackTime();
  const recDuration = getRecommendedDuration();
  const curSec = Math.round(cur);
  const outSec = Math.round(dockState.endTime);

  // If repeatedly pressing Set Out on the same second: nudge 1 second earlier
  if (Math.abs(cur - dockState.endTime) < 1.0 || curSec === outSec) {
    dockState.endTime = Math.max(dockState.startTime + 5, outSec - 1);
  } else {
    dockState.endTime = Math.round(cur * 10) / 10;
  }

  seekPlayerTime(dockState.endTime);

  dockState.isManualOut = true;
  dockState.activeTarget = "out";
  dockState.lastManualTarget = "out";

  // Auto-adjust complementary In using exact script fallback duration if In wasn't manual
  if (!dockState.isManualIn || dockState.startTime >= dockState.endTime) {
    dockState.startTime = Math.max(0, Math.round((dockState.endTime - recDuration) * 10) / 10);
  }

  renderAniSkipDock();
}

/**
 * Handles Arrow keys (Left/Down: -1s, Right/Up: +1s) for the active target
 * @param {string} key
 */
export function handleAniSkipArrow(key) {
  if (!dockState) return;

  const isNudgeDown = key === "ArrowLeft" || key === "ArrowDown";
  const delta = isNudgeDown ? -1 : 1;
  const target = dockState.activeTarget || "in";

  if (target === "in") {
    const nextStart = Math.max(0, Math.round((dockState.startTime + delta) * 10) / 10);
    if (nextStart < dockState.endTime - 5 || !dockState.isManualOut) {
      dockState.startTime = nextStart;
      dockState.isManualIn = true;
      dockState.lastManualTarget = "in";
      seekPlayerTime(dockState.startTime);
      if (!dockState.isManualOut) {
        dockState.endTime = Math.round((dockState.startTime + getRecommendedDuration()) * 10) / 10;
      }
    }
  } else {
    const nextEnd = Math.max(dockState.startTime + 5, Math.round((dockState.endTime + delta) * 10) / 10);
    dockState.endTime = nextEnd;
    dockState.isManualOut = true;
    dockState.lastManualTarget = "out";
    seekPlayerTime(dockState.endTime);
  }

  renderAniSkipDock();
}

/**
 * Toggles between Auto formula and Custom calibration from last manually modified point
 */
export function toggleAutoCustomDuration() {
  if (!dockState) return;

  const recDuration = getRecommendedDuration();
  const totalDur = dockState.episodeLength || 0;
  const isAllManual = dockState.isManualIn && dockState.isManualOut;

  if (isAllManual) {
    // Preserve custom values to allow restoring if clicked again
    dockState.lastCustomStart = dockState.startTime;
    dockState.lastCustomEnd = dockState.endTime;

    // Reset to Auto calculated from last manual anchor
    if (dockState.lastManualTarget === "out") {
      dockState.startTime = Math.max(0, Math.round((dockState.endTime - recDuration) * 10) / 10);
      dockState.isManualIn = false;
      seekPlayerTime(dockState.startTime);
    } else {
      const smartEnd = totalDur > 0
        ? Math.min(totalDur, dockState.startTime + recDuration)
        : dockState.startTime + recDuration;
      dockState.endTime = Math.round(smartEnd * 10) / 10;
      dockState.isManualOut = false;
      seekPlayerTime(dockState.endTime);
    }
  } else if (typeof dockState.lastCustomStart === "number" && typeof dockState.lastCustomEnd === "number") {
    dockState.startTime = dockState.lastCustomStart;
    dockState.endTime = dockState.lastCustomEnd;
    dockState.isManualIn = true;
    dockState.isManualOut = true;
    seekPlayerTime(dockState.startTime);
  }

  renderAniSkipDock();
}

/**
 * Handles hotkeys for start (In) and end (Out) points with script formula auto-fill
 */
export function handleAniSkipHotkey(action, currentTime = 0, duration = 0, context = {}) {
  const { malId, epNum, provider, onSuccess } = context;
  if (!malId || !epNum) return;

  if (typeof currentTime === "number" && currentTime > 0) {
    lastPlaybackTime = currentTime;
  }
  if (typeof duration === "number" && duration > 0) {
    lastPlaybackDuration = duration;
  }

  if (!dockState) {
    openAniSkipDock({
      malId,
      epNum,
      currentTime,
      duration,
      provider,
      onSuccess
    });
  }

  if (action === "start") {
    applyInPoint(currentTime);
  } else if (action === "end") {
    applyOutPoint(currentTime);
  }
}

function renderAniSkipDock() {
  if (!dockState) return;

  const mountPoint = document.fullscreenElement || document.body;

  if (!dockContainer) {
    dockContainer = document.createElement("div");
    dockContainer.id = "al-aniskip-dock";
    dockContainer.className = "al-aniskip-dock";
    dockContainer.addEventListener("mouseenter", requestPlayerCurrentTime);
  }

  if (dockContainer.parentElement !== mountPoint) {
    mountPoint.appendChild(dockContainer);
  }

  const { skipType, providerName, startTime, endTime, isManualIn, isManualOut, activeTarget } = dockState;
  const interval = Math.round((endTime - startTime) * 10) / 10;
  const isValid = interval >= 5 && interval <= 240;
  const isPreset = PRESET_PROVIDERS.includes(providerName);
  const isAllManual = isManualIn && isManualOut;
  const recDuration = getRecommendedDuration();

  dockContainer.innerHTML = `
    <div class="al-dock-inner">
      <!-- Type Selector -->
      <div class="al-dock-types">
        <button type="button" class="al-dock-type ${skipType === "op" ? "is-active" : ""}" data-type="op" title="Opening sequence">
          OP
        </button>
        <button type="button" class="al-dock-type ${skipType === "ed" ? "is-active" : ""}" data-type="ed" title="Ending sequence">
          ED
        </button>
      </div>

      <!-- Guided Provider Selector -->
      <div class="al-dock-provider-wrap" title="Video source / release provider">
        <span class="al-dock-provider-icon">${iconHtml(Tv, { width: 12, height: 12 })}</span>
        <select class="al-dock-provider-select">
          ${PRESET_PROVIDERS.map((p) => `<option value="${p}" ${providerName === p ? "selected" : ""}>${p}</option>`).join("")}
          <option value="custom" ${!isPreset ? "selected" : ""}>Custom...</option>
        </select>
        <input type="text" class="al-dock-provider-custom ${!isPreset ? "" : "is-hidden"}" value="${!isPreset ? providerName : ""}" placeholder="Provider" spellcheck="false" />
      </div>

      <!-- In Point Split-Pill (Left: Set/Mark with [, Right: Preview Seek) -->
      <div class="al-dock-split-pill ${isManualIn ? "is-manual" : "is-auto"} ${activeTarget === "in" ? "is-active-target" : ""}" title="Left: Set In (Key: [) | Right: Jump to In point">
        <button type="button" class="al-dock-pill-btn al-dock-in-mark" title="Set In (Key: [). Click repeatedly to step 1s back">
          <span class="al-dock-kbd">[</span>
          <span class="al-dock-pill-tag">In</span>
        </button>
        <button type="button" class="al-dock-pill-btn al-dock-in-seek" title="Seek video to ${Resume.formatTime(startTime)}">
          <b class="al-dock-pill-time">${Resume.formatTime(startTime)}</b>
          <span class="al-dock-pill-arrow">⤏</span>
        </button>
      </div>

      <!-- Out Point Split-Pill (Left: Set/Mark with ], Right: Preview Seek) -->
      <div class="al-dock-split-pill ${isManualOut ? "is-manual" : "is-auto"} ${activeTarget === "out" ? "is-active-target" : ""}" title="Left: Set Out (Key: ]) | Right: Jump to Out point">
        <button type="button" class="al-dock-pill-btn al-dock-out-mark" title="Set Out (Key: ]). Click repeatedly to step 1s back">
          <span class="al-dock-kbd">]</span>
          <span class="al-dock-pill-tag">Out</span>
        </button>
        <button type="button" class="al-dock-pill-btn al-dock-out-seek" title="Seek video to ${Resume.formatTime(endTime)}">
          <b class="al-dock-pill-time">${Resume.formatTime(endTime)}</b>
          <span class="al-dock-pill-arrow">⤏</span>
        </button>
      </div>

      <!-- Live Duration & Status Toggle Button (Auto vs Custom) -->
      <button type="button" class="al-dock-dur-btn al-dock-dur-badge ${isValid ? "is-valid" : "is-invalid"} ${isAllManual ? "is-custom" : "is-auto"}" title="${isAllManual ? `Click to recalculate Auto duration from ${dockState.lastManualTarget === "out" ? "Out" : "In"}` : `Assisted auto duration (${recDuration}s). Click to restore custom`}">
        ${interval}s ${isAllManual ? "Custom ✓" : "Auto"}
      </button>

      <!-- Submit Action with Enter badge -->
      <button type="button" class="al-dock-submit-btn ${isValid ? "" : "is-disabled"}" title="Submit to AniSkip (Key: Enter)">
        <span class="al-dock-kbd">↵</span>
        <span>Submit</span>
      </button>

      <!-- Close Action -->
      <button type="button" class="al-dock-close-btn" title="Close dock (Key: Esc)">
        ${iconHtml(X, { width: 13, height: 13 })}
      </button>
    </div>
  `;

  // Event handlers
  const typeButtons = dockContainer.querySelectorAll(".al-dock-type");
  typeButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      dockState.skipType = btn.dataset.type || "op";
      typeButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
    });
  });

  const providerSelect = dockContainer.querySelector(".al-dock-provider-select");
  const providerCustom = dockContainer.querySelector(".al-dock-provider-custom");

  providerSelect?.addEventListener("change", (e) => {
    const val = e.target.value;
    if (val === "custom") {
      providerCustom.classList.remove("is-hidden");
      providerCustom.focus();
      if (providerCustom.value) {
        dockState.providerName = providerCustom.value;
        saveProvider(providerCustom.value);
      }
    } else {
      providerCustom.classList.add("is-hidden");
      dockState.providerName = val;
      saveProvider(val);
    }
  });

  providerCustom?.addEventListener("input", (e) => {
    dockState.providerName = e.target.value;
    saveProvider(e.target.value);
  });

  // In Mark Click
  dockContainer.querySelector(".al-dock-in-mark")?.addEventListener("click", (e) => {
    e.stopPropagation();
    applyInPoint();
  });

  // In Seek Click
  dockContainer.querySelector(".al-dock-in-seek")?.addEventListener("click", (e) => {
    e.stopPropagation();
    dockState.activeTarget = "in";
    seekPlayerTime(dockState.startTime);
    renderAniSkipDock();
  });

  // Out Mark Click
  dockContainer.querySelector(".al-dock-out-mark")?.addEventListener("click", (e) => {
    e.stopPropagation();
    applyOutPoint();
  });

  // Out Seek Click
  dockContainer.querySelector(".al-dock-out-seek")?.addEventListener("click", (e) => {
    e.stopPropagation();
    dockState.activeTarget = "out";
    seekPlayerTime(dockState.endTime);
    renderAniSkipDock();
  });

  // Duration Badge Click -> Toggle Auto / Custom
  dockContainer.querySelector(".al-dock-dur-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleAutoCustomDuration();
  });

  // Submit
  const submitBtn = dockContainer.querySelector(".al-dock-submit-btn");
  submitBtn?.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (!isValid) return;
    await submitCurrentDock();
  });

  // Close
  const closeBtn = dockContainer.querySelector(".al-dock-close-btn");
  closeBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    dismissAniSkipDock();
  });
}

async function submitCurrentDock() {
  if (!dockState) return;

  const btn = dockContainer?.querySelector(".al-dock-submit-btn");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `${iconHtml(Loader2, { width: 12, height: 12 })} <span>Saving...</span>`;
  }

  try {
    const res = await createSkipTime({
      malId: dockState.malId,
      epNum: dockState.epNum,
      skipType: dockState.skipType,
      startTime: dockState.startTime,
      endTime: dockState.endTime,
      episodeLength: dockState.episodeLength,
      providerName: dockState.providerName
    });

    showToast("✓ Skip time saved to AniSkip!", false, 3000);

    const successData = {
      start: dockState.startTime,
      end: dockState.endTime,
      episodeLength: dockState.episodeLength,
      skipType: dockState.skipType,
      skipId: res.skipId
    };

    const cb = dockState.onSuccess;
    dismissAniSkipDock();
    if (typeof cb === "function") {
      cb(successData);
    }
  } catch (err) {
    Logger.error("AniSkip submission failed:", err);
    showToast(`AniSkip: ${err.message}`, true, 4000);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span class="al-dock-kbd">↵</span> <span>Submit</span>`;
    }
  }
}

// Global hotkeys for dock submission, dismissal, and arrow nudges
window.addEventListener("keydown", (e) => {
  if (!isAniSkipDockOpen()) return;

  const tag = document.activeElement?.tagName?.toLowerCase();
  const isInput = tag === "input" || tag === "textarea" || tag === "select";
  if (isInput) return;

  if (e.key === "Escape") {
    e.preventDefault();
    dismissAniSkipDock();
  } else if (e.key === "Enter") {
    e.preventDefault();
    submitCurrentDock();
  } else if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
    e.preventDefault();
    handleAniSkipArrow(e.key);
  }
});

// Listen for playback updates and forwarded arrow events from player frames
window.addEventListener("message", (e) => {
  if (e.data?.type === "AL_PLAYBACK_STATE") {
    if (typeof e.data.currentTime === "number" && !isNaN(e.data.currentTime)) {
      lastPlaybackTime = e.data.currentTime;
    }
    if (typeof e.data.duration === "number" && !isNaN(e.data.duration) && e.data.duration > 0) {
      lastPlaybackDuration = e.data.duration;
    }
  } else if (e.data?.type === "AU_ANISKIP_ARROW") {
    handleAniSkipArrow(e.data.key);
  }
});

window.addEventListener("focus", () => {
  if (isAniSkipDockOpen()) {
    requestPlayerCurrentTime();
  }
});
