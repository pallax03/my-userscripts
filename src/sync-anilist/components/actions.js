import { AniListAPI } from "../../shared/anilist/api.js";
import {
  iconHtml,
  ExternalLink,
  Trash2,
  Plus,
  KeyRound,
  RotateCcw,
  Link,
  Calendar,
  Check,
  CheckCheck,
  Clock,
  X,
  Zap,
  Play
} from "../../shared/icons.js";
import { Buddy } from "../buddy.js";
import { initBuddyPicker } from "./buddy-picker.js";
import { Resume } from "../resume.js";

/**
 * Renders the streamlined anime control card above the episode selector
 * @param {Object} media - AniList media object
 * @param {boolean} hasToken - Whether user is logged into AniList
 * @param {Object} actions - Action callbacks
 * @param {Object} options - State options
 */
export function renderActions(
  media,
  hasToken,
  actions,
  {
    isLoading = false,
    viewer = null,
    defaultBuddy = "",
    buddyData = null,
    provider = null,
    activeEp = 0,
    trackedProgress = -1,
    autoTrackState = null
  } = {}
) {
  // Purge AnimeUnity personal account elements from DOM if present
  document.querySelectorAll(".cover-wrap .actions, .list-btn-mobile, #add-to-fav").forEach((el) => el.remove());

  // Determine anchor element and position (always placed above episode selector)
  const anchorData = provider?.getActionsAnchor?.();
  let targetAnchor = null;
  let insertMode = "before";

  if (anchorData?.element) {
    targetAnchor = anchorData.element;
    insertMode = anchorData.position || "before";
  } else if (anchorData instanceof HTMLElement) {
    targetAnchor = anchorData;
    insertMode = "before";
  } else {
    const epWrapper = document.querySelector(".episode-wrapper, section[x-data*='epList'], section:has(.ep-tile)");
    if (epWrapper) {
      targetAnchor = epWrapper;
      insertMode = "before";
    } else {
      const overview = document.querySelector(".content .overview, .overview");
      if (overview) {
        targetAnchor = overview;
        insertMode = "append";
      }
    }
  }

  if (!targetAnchor) return;

  let bar = document.getElementById("al-control-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "al-control-bar";
    bar.className = "al-card";
  }

  if (insertMode === "before") {
    if (bar.nextElementSibling !== targetAnchor) {
      targetAnchor.before(bar);
    }
  } else if (insertMode === "after") {
    if (bar.previousElementSibling !== targetAnchor) {
      targetAnchor.after(bar);
    }
  } else if (insertMode === "append") {
    if (bar.parentElement !== targetAnchor) {
      targetAnchor.appendChild(bar);
    }
  }

  if (!hasToken) {
    bar.innerHTML = `
      <div class="al-card-row">
        <div class="al-info">
          <span class="al-pill">AniList</span>
          <span>Connect your account to track anime and sync episodes</span>
        </div>
        <button type="button" class="al-btn primary" id="al-bar-login">
          ${iconHtml(KeyRound, { width: 14, height: 14 })}
          <span>Connect AniList</span>
        </button>
      </div>`;
    bar.querySelector("#al-bar-login").onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      actions.onConnect?.();
    };
    return;
  }

  if (isLoading) {
    bar.innerHTML = `
      <div class="al-card-row" style="opacity: 0.85;">
        <div class="al-left" style="display: flex; gap: 10px; align-items: center;">
          <div class="al-skeleton-pill" style="width: 140px; height: 32px; border-radius: 9px;"></div>
          <div class="al-skeleton-pill" style="width: 100px; height: 32px; border-radius: 9px;"></div>
        </div>
        <div class="al-right" style="display: flex; gap: 8px; align-items: center;">
          <div class="al-skeleton-pill" style="width: 85px; height: 32px; border-radius: 8px;"></div>
          <div class="al-skeleton-pill" style="width: 95px; height: 32px; border-radius: 8px;"></div>
        </div>
      </div>`;
    return;
  }

  if (!media) {
    bar.innerHTML = `
      <div class="al-card-row">
        <div class="al-info text-danger">
          <span class="al-pill danger">AniList</span>
          <span>Anime not found in AniList database</span>
        </div>
      </div>`;
    return;
  }

  const title = media.title?.english || media.title?.romaji || media.title?.userPreferred || `AniList #${media.id}`;
  const entry = media.mediaListEntry;
  const total = media.episodes || 0;
  const progress = entry?.progress || 0;
  const percent = total > 0 && progress > 0 ? Math.min(100, Math.round((progress / total) * 100)) : 0;
  const currentBuddy = Buddy.extract(entry?.notes);

  const formatDate = (dateObj) => {
    if (!dateObj?.year) return null;
    const d = String(dateObj.day || 1).padStart(2, "0");
    const m = String(dateObj.month || 1).padStart(2, "0");
    return `${d}/${m}/${dateObj.year}`;
  };

  const startDate = formatDate(entry?.startedAt);
  const completedDate = formatDate(entry?.completedAt);
  const rewatches = entry?.repeat || 0;

  const isBuddyCompleted = !!buddyData?.isCompleted;
  const isBuddyAhead = !!(buddyData?.name && (buddyData.progress || 0) > progress);
  const canSyncBuddy = isBuddyAhead || (isBuddyCompleted && entry?.status !== "COMPLETED");

  // Compact, symbolic episode controller chip placed directly next to the anime title
  let episodeStatusHtml = "";
  if (activeEp > 0) {
    const nextToWatch = (trackedProgress > 0 ? trackedProgress : 0) + 1;
    const isNextEp = activeEp === nextToWatch;
    const resume = Resume.extract(entry?.notes) || Resume.getLocal(media.id);
    const isResuming = isNextEp && resume && resume.ep === activeEp && resume.time > 5 && resume.percent < 88;

    if (autoTrackState?.isActive && autoTrackState.targetEp === activeEp) {
      // 1. Countdown active
      episodeStatusHtml = `
        <div class="al-ep-chip is-countdown" title="Auto-tracking progress in ${autoTrackState.countdown}s">
          <div class="al-ep-chip-badge">
            ${iconHtml(Clock, { width: 12, height: 12, class: "al-pulse" })}
            <span class="al-ep-chip-num">Ep. ${activeEp}</span>
            <span class="al-ep-chip-timer">${autoTrackState.countdown}s</span>
          </div>
          <div class="al-ep-chip-actions">
            <button type="button" class="al-ep-mini-btn danger" id="al-ep-cancel" title="Cancel auto-track">
              ${iconHtml(X, { width: 11, height: 11 })}
            </button>
            <button type="button" class="al-ep-mini-btn success" id="al-ep-savenow" title="Mark Ep. ${activeEp} as watched now">
              ${iconHtml(Check, { width: 12, height: 12 })}
            </button>
          </div>
        </div>`;
    } else if (trackedProgress > 0 && activeEp === trackedProgress) {
      // 2. Synced with AniList
      const rewindTarget = activeEp - 1;
      episodeStatusHtml = `
        <div class="al-ep-chip is-synced" title="Tracked on AniList as Ep. ${activeEp}">
          <div class="al-ep-chip-badge">
            ${iconHtml(CheckCheck, { width: 12, height: 12 })}
            <span class="al-ep-chip-num">Ep. ${activeEp}</span>
          </div>
          <div class="al-ep-chip-actions">
            <button type="button" class="al-ep-mini-btn rewind" id="al-ep-rewind" title="${rewindTarget > 0 ? `Rewind AniList to Ep. ${rewindTarget}` : "Mark as unwatched"}">
              ${iconHtml(RotateCcw, { width: 11, height: 11 })}
              <span>${rewindTarget > 0 ? `Ep. ${rewindTarget}` : "Reset"}</span>
            </button>
          </div>
        </div>`;
    } else if (trackedProgress > 0 && activeEp < trackedProgress) {
      // 3. Already Watched in the past (re-watching an old episode)
      const rewindTarget = activeEp - 1;
      episodeStatusHtml = `
        <div class="al-ep-chip is-watched" title="Episode ${activeEp} already watched (AniList at Ep. ${trackedProgress})">
          <div class="al-ep-chip-badge">
            ${iconHtml(Check, { width: 12, height: 12 })}
            <span class="al-ep-chip-num">Ep. ${activeEp}</span>
          </div>
          <div class="al-ep-chip-actions">
            <button type="button" class="al-ep-mini-btn rewind" id="al-ep-rewind" title="${rewindTarget > 0 ? `Rewind AniList to Ep. ${rewindTarget}` : "Mark as unwatched"}">
              ${iconHtml(RotateCcw, { width: 11, height: 11 })}
              <span>${rewindTarget > 0 ? `Ep. ${rewindTarget}` : "Reset"}</span>
            </button>
          </div>
        </div>`;
    } else if (isResuming) {
      // 4. Intra-episode Resume active ONLY for the next episode (paused midway)
      episodeStatusHtml = `
        <div class="al-ep-chip is-resuming" title="Resume at ${Resume.formatTime(resume.time)} (${resume.percent}%) • Mark Ep. ${activeEp} as watched">
          <div class="al-ep-chip-badge">
            ${iconHtml(Play, { width: 12, height: 12 })}
            <span class="al-ep-chip-num">Ep. ${activeEp}</span>
            <span class="al-ep-chip-text" style="color: #c084fc;">${Resume.formatTime(resume.time)}</span>
          </div>
          <div class="al-ep-chip-actions">
            <button type="button" class="al-ep-mini-btn success" id="al-ep-save" title="Mark Ep. ${activeEp} as watched">
              ${iconHtml(Check, { width: 12, height: 12 })}
            </button>
          </div>
        </div>`;
    } else {
      // 5. Untracked / Future episode: single prominent checkmark tick to mark watched
      episodeStatusHtml = `
        <div class="al-ep-chip is-untracked" title="Mark Ep. ${activeEp} as watched (AniList currently at Ep. ${trackedProgress > 0 ? trackedProgress : 0})">
          <div class="al-ep-chip-badge">
            ${iconHtml(Zap, { width: 12, height: 12 })}
            <span class="al-ep-chip-num">Ep. ${activeEp}</span>
          </div>
          <div class="al-ep-chip-actions">
            <button type="button" class="al-ep-mini-btn success" id="al-ep-save" title="Mark Ep. ${activeEp} as watched">
              ${iconHtml(Check, { width: 12, height: 12 })}
            </button>
          </div>
        </div>`;
    }
  }

  bar.innerHTML = `
    <div class="al-card-row">
      <div class="al-left">
        <div class="al-title-meta-wrap">
          <a href="https://anilist.co/anime/${media.id}" target="_blank" rel="noopener noreferrer" class="al-badge" title="Open on AniList: ${title}">
            <span class="al-title-text">${title}</span>
            ${iconHtml(ExternalLink, { width: 12, height: 12, class: "al-badge-icon" })}
          </a>

          ${entry ? `
            <select class="al-select al-status-select" id="al-bar-status" title="Anime status">
              ${Object.entries(AniListAPI.statuses).map(([k, v]) => `<option value="${k}" ${entry.status === k ? "selected" : ""}>${v}</option>`).join("")}
            </select>
          ` : ""}

          ${episodeStatusHtml}
        </div>
      </div>

      <div class="al-right">
        ${!entry ? `
          <button type="button" class="al-btn primary" id="al-bar-add">
            ${iconHtml(Plus, { width: 14, height: 14 })}
            <span>Add to Watching</span>
          </button>
        ` : `
          <div class="al-controls-group">
            <div class="al-buddy-cluster ${isBuddyCompleted ? "has-completed" : ""}" title="Sync Watching with friend">
              <div class="al-buddy-box" id="al-bar-buddy-box"></div>
              ${currentBuddy && buddyData ? `
                ${canSyncBuddy ? `
                  <button type="button" class="al-buddy-sync-btn ${isBuddyCompleted ? "is-completed" : ""}" id="al-bar-buddy-sync" title="${isBuddyCompleted ? `${buddyData.name} completed this anime • Click to sync & mark as Completed` : `Sync with ${buddyData.name} to Ep. ${buddyData.progress}`}">
                    ${iconHtml(Link, { width: 12, height: 12 })}
                    <span>${isBuddyCompleted ? `${buddyData.name} Done` : `Ep. ${buddyData.progress}`}</span>
                  </button>
                ` : `
                  <span class="al-buddy-tag ${isBuddyCompleted ? "is-completed" : ""}" title="${buddyData.name}: ${isBuddyCompleted ? "Completed" : `Ep. ${buddyData.progress || 0}`}">
                    ${isBuddyCompleted ? `<span class="al-dot"></span><span>${buddyData.name} Done</span>` : `<span>Ep. ${buddyData.progress || 0}</span>`}
                  </span>
                `}
              ` : ""}
            </div>

            <select class="al-select al-score-select" id="al-bar-score" title="Your rating">
              <option value="0">Score: −</option>
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => `<option value="${s}" ${entry.score === s ? "selected" : ""}>★ ${s}/10</option>`).join("")}
            </select>

            <button type="button" class="al-icon-btn danger al-bar-del-btn" id="al-bar-del" title="Remove from AniList library">
              ${iconHtml(Trash2, { width: 13, height: 13 })}
            </button>
          </div>
        `}
      </div>
    </div>

    ${entry && (startDate || completedDate || rewatches > 0) ? `
      <div class="al-card-dates-row">
        <div class="al-date-col al-date-start">
          ${startDate ? `
            <span class="al-meta-date" title="Started watching on ${startDate}">
              ${iconHtml(Calendar, { width: 11, height: 11 })}
              <span>Started: ${startDate}</span>
            </span>
          ` : ""}
          ${rewatches > 0 ? `
            <span class="al-meta-date al-meta-repeat" title="Completed rewatches: ${rewatches}">
              ${iconHtml(RotateCcw, { width: 10, height: 10 })}
              <span>Rewatched: ${rewatches}×</span>
            </span>
          ` : ""}
        </div>
        <div class="al-date-col al-date-end">
          ${completedDate ? `
            <span class="al-meta-date" title="Completed on ${completedDate}">
              ${iconHtml(Calendar, { width: 11, height: 11 })}
              <span>Completed: ${completedDate}</span>
            </span>
          ` : ""}
        </div>
      </div>
    ` : ""}

    ${entry && total > 0 ? `
      <div class="al-card-progress-bar" title="Completion: ${progress}/${total} (${percent}%)">
        <div class="al-card-progress-fill" style="width: ${percent}%;"></div>
      </div>
    ` : ""}`;

  // Bind Events
  bar.querySelector("#al-bar-add")?.addEventListener("click", actions.onAdd);
  bar.querySelector("#al-bar-del")?.addEventListener("click", actions.onDelete);
  bar.querySelector("#al-bar-status")?.addEventListener("change", (e) => actions.onStatusChange(e.target.value));
  bar.querySelector("#al-bar-score")?.addEventListener("change", (e) => actions.onScoreChange(parseFloat(e.target.value)));
  bar.querySelector("#al-bar-buddy-sync")?.addEventListener("click", () => {
    if (typeof actions.onBuddySync === "function" && buddyData) {
      actions.onBuddySync(buddyData.progress, isBuddyCompleted);
    }
  });

  // Episode Controller Action Listeners
  bar.querySelector("#al-ep-cancel")?.addEventListener("click", () => {
    actions.onCancelCountdown?.();
  });

  bar.querySelector("#al-ep-savenow, #al-ep-save")?.addEventListener("click", () => {
    actions.onSave?.(activeEp);
  });

  bar.querySelector("#al-ep-rewind")?.addEventListener("click", () => {
    const rewindTarget = Math.max(0, activeEp - 1);
    actions.onRewind?.(rewindTarget, activeEp);
  });

  // Setup Shared Buddy Picker
  const buddyBox = bar.querySelector("#al-bar-buddy-box");
  if (buddyBox && entry) {
    const getElevatedAncestors = () => {
      const list = [];
      let el = bar;
      while (el && el !== document.body) {
        if (el.classList && (el.classList.contains("overview") || el.tagName === "MAIN")) break;
        list.push(el);
        el = el.parentElement;
      }
      return list;
    };

    initBuddyPicker(buddyBox, {
      selectedBuddy: currentBuddy,
      defaultBuddy,
      viewer,
      emptyLabel: "Sync",
      placeholder: "Search followed friend...",
      onSelect: actions.onBuddyChange,
      onClear: () => actions.onBuddyChange(""),
      onOpen: () => {
        bar.classList.add("has-open-popover");
        getElevatedAncestors().forEach((el) => el.classList.add("al-elevated-stack"));
      },
      onClose: () => {
        bar.classList.remove("has-open-popover");
        getElevatedAncestors().forEach((el) => el.classList.remove("al-elevated-stack"));
      }
    });
  }
}
