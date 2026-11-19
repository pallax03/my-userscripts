import {
  iconHtml,
  Plus,
  Minus,
  Loader2,
  KeyRound,
  Check,
  Zap,
  User,
  LogOut,
  Bookmark
} from "../../shared/icons.js";
import { Buddy } from "../buddy.js";
import { Resume } from "../resume.js";
import { initBuddyPicker } from "./buddy-picker.js";
import { deriveDockState } from "../dock-model.js";
import { slot } from "../slots.js";

/**
 * Renders the compact Teal Floating Island dock
 * Visible on Anime Detail and Watch pages in bottom-right.
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
    autoTrackState = null,
    isWatch = false,
    resumeTarget = 0
  } = {}
) {
  const targetAnchor = slot("actions");

  let bar = document.getElementById("al-control-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "al-control-bar";
    bar.className = "al-compact-pill";
  }

  if (bar.parentElement !== targetAnchor) {
    targetAnchor.appendChild(bar);
  }

  // Memoization: avoid destroying DOM and listeners if key state hasn't changed
  const entry = media?.mediaListEntry;
  const progress = entry?.progress || 0;
  const currentBuddy = Buddy.extract(entry?.notes);
  const renderKey = [
    hasToken,
    isLoading,
    isWatch,
    media?.id,
    entry?.id,
    entry?.status,
    entry?.score,
    progress,
    activeEp,
    trackedProgress,
    currentBuddy,
    buddyData?.progress,
    buddyData?.isCompleted,
    autoTrackState?.isActive ? autoTrackState.countdown : -1,
    resumeTarget || 0,
    viewer?.name
  ].join("::");

  if (bar.__lastRenderKey === renderKey && bar.children.length > 0) {
    return;
  }
  bar.__lastRenderKey = renderKey;

  // 1. Not Logged In State
  if (!hasToken) {
    bar.innerHTML = `
      <div class="al-pill-item al-dock-dot is-offline" title="Disconnected"></div>
      <span class="al-pill-label">AniList</span>
      <button type="button" class="al-pill-btn primary" id="al-bar-login">
        ${iconHtml(KeyRound, { width: 13, height: 13 })}
        <span>Login</span>
      </button>
      <div class="al-dock-switch-box" id="al-dock-switch-slot"></div>
    `;
    bar.querySelector("#al-bar-login")?.addEventListener("click", (e) => {
      e.preventDefault();
      actions.onConnect?.();
    });
    return;
  }

  // 2. Loading State
  if (isLoading) {
    bar.innerHTML = `
      <div class="al-pill-item al-dock-dot is-pulsing" title="Syncing..."></div>
      <span class="al-pill-loading-text">${resumeTarget > 0 ? `Restoring ${Resume.formatTime(resumeTarget)}...` : "Syncing..."}</span>
    `;
    return;
  }

  // 3. Anime Not Found State
  if (!media) {
    bar.innerHTML = `
      <div class="al-pill-item al-dock-dot is-error" title="Not found on AniList"></div>
      <span class="al-pill-label text-muted">Not on AniList</span>
      <div class="al-dock-switch-box" id="al-dock-switch-slot"></div>
    `;
    return;
  }

  const title = media.title?.english || media.title?.romaji || media.title?.userPreferred || `Anime #${media.id}`;
  const {
    total,
    isRewatching,
    isWatchEp,
    isCounting,
    isCurrentTracked,
    isAhead,
    isPast,
    isBuddyCompleted,
    canSyncBuddy
  } = deriveDockState({ media, activeEp, isWatch, autoTrackState, buddyData });
  const buddyAvatar = Buddy.getAvatar(currentBuddy) || buddyData?.avatar || "https://anilist.co/img/icons/icon.svg";

  const statusMap = {
    CURRENT: "Watching",
    COMPLETED: "Completed",
    PLANNING: "Planning",
    PAUSED: "Paused",
    REPEATING: "Rewatching",
    DROPPED: "Dropped"
  };

  // Determine expressive episode action button (Watch page)
  let actionBtnHtml = "";
  if (!entry) {
    actionBtnHtml = `
      <button type="button" class="al-dock-btn is-add" id="al-ep-save" title="Add to AniList">
        ${iconHtml(Plus, { width: 12, height: 12 })}
        <span>Add</span>
      </button>
    `;
  } else if (isCounting) {
    actionBtnHtml = `
      <button type="button" class="al-dock-btn is-counting" id="al-ep-save" title="Auto-saving in ${autoTrackState.countdown}s">
        ${iconHtml(Zap, { width: 12, height: 12, class: "al-pulse" })}
        <span>Save (${autoTrackState.countdown}s)</span>
      </button>
      <button type="button" class="al-dock-step-btn danger" id="al-ep-cancel-track" title="Cancel auto-save">✕</button>
    `;
  } else if (isAhead || progress === 0) {
    actionBtnHtml = `
      <button type="button" class="al-dock-btn is-pending" id="al-ep-save" title="Mark Ep. ${activeEp} watched">
        ${iconHtml(Zap, { width: 12, height: 12 })}
        <span>Mark Ep. ${activeEp}</span>
      </button>
    `;
  } else if (isCurrentTracked) {
    actionBtnHtml = `
      <button type="button" class="al-dock-btn is-tracked" id="al-ep-save" title="Synced on AniList (Ep. ${progress})">
        ${iconHtml(Check, { width: 12, height: 12 })}
        <span>Synced</span>
      </button>
    `;
  } else if (isPast) {
    actionBtnHtml = `
      <button type="button" class="al-dock-btn is-tracked" id="al-ep-save" title="Watched (AniList: Ep. ${progress})">
        ${iconHtml(Check, { width: 12, height: 12 })}
        <span>Watched (AL: ${progress})</span>
      </button>
    `;
  }

  bar.innerHTML = `
    <!-- Left: Anime Title (AniList blue link) & Status -->
    <div class="al-dock-group al-dock-status-group">
      <a class="al-dock-title" href="https://anilist.co/anime/${media.id}" target="_blank" rel="noopener noreferrer" title="${title} (AniList)">
        ${title}
      </a>
      ${entry ? `
        <div class="al-dock-select-box">
          ${iconHtml(Bookmark, { width: 11, height: 11, class: "al-dock-icon-muted" })}
          <select class="al-dock-select" id="al-bar-status" title="AniList Status">
            ${Object.entries(statusMap).map(([k, label]) => `
              <option value="${k}" ${entry.status === k ? "selected" : ""}>${label}</option>
            `).join("")}
          </select>
        </div>
      ` : ""}
    </div>

    <!-- Center: Episode Progress + -/+ + Resume Loading + Sync Action -->
    <div class="al-dock-group al-dock-ep-group">
      ${isWatchEp ? `
        <div class="al-dock-ep-badge" title="Episode ${activeEp} of ${total || "?"}">
          Ep. ${activeEp} / ${total || "?"}
        </div>
        ${entry ? `
          <button type="button" class="al-dock-step-btn" id="al-ep-rewind" title="Previous episode">${iconHtml(Minus, { width: 11, height: 11 })}</button>
          <button type="button" class="al-dock-step-btn" id="al-ep-next" title="Next episode">${iconHtml(Plus, { width: 11, height: 11 })}</button>
        ` : ""}
        ${resumeTarget > 0 ? `
          <div class="al-dock-resume-chip" id="al-dock-resume-loading" title="Restoring position">
            ${iconHtml(Loader2, { width: 11, height: 11, class: "al-spin" })}
            <span>${Resume.formatTime(resumeTarget)}</span>
          </div>
        ` : ""}
        ${actionBtnHtml}
      ` : `
        ${entry ? `
          <div class="al-dock-ep-badge" title="${title}">
            ${isRewatching ? "Rewatch" : "Progress"}: Ep. ${progress} / ${total || "?"}
          </div>
          <button type="button" class="al-dock-step-btn" id="al-ep-rewind" title="Previous episode">${iconHtml(Minus, { width: 11, height: 11 })}</button>
          <button type="button" class="al-dock-step-btn" id="al-ep-next" title="Next episode">${iconHtml(Plus, { width: 11, height: 11 })}</button>
        ` : `
          <button type="button" class="al-dock-btn is-add" id="al-ep-save" title="Add to AniList">
            ${iconHtml(Plus, { width: 12, height: 12 })}
            <span>Add</span>
          </button>
        `}
      `}
    </div>

    <!-- Right: Buddy + User PFP (Only 1 Dropdown) -->
    <div class="al-dock-group al-dock-user-group">
      ${entry ? `
        <div class="al-dock-buddy-cluster" id="al-dock-buddy-box">
          ${currentBuddy && buddyData && canSyncBuddy ? `
            <button type="button" class="al-dock-buddy-btn is-ahead" id="al-bar-buddy-sync" title="Sync to ${buddyData.name}">
              <img src="${buddyAvatar}" class="al-dock-buddy-avatar" alt="${currentBuddy}" />
              <span>${isBuddyCompleted ? "Done" : `Ep. ${buddyData.progress}`}</span>
            </button>
          ` : `
            <div class="al-dock-buddy-picker-trigger" id="al-bar-buddy-picker-mount"></div>
          `}
        </div>
      ` : ""}

      <!-- User Menu (Strictly Account Only) -->
      <div class="al-dock-user-wrap">
        <button type="button" class="al-dock-avatar-btn" id="al-dock-avatar-btn" title="${viewer?.name || "AniList Account"}">
          <img src="${viewer?.avatar?.medium || "https://anilist.co/img/icons/icon.svg"}" class="al-dock-avatar" />
        </button>
        <div class="al-dock-menu" id="al-dock-menu">
          <div class="al-dock-menu-header">
            <img src="${viewer?.avatar?.medium || "https://anilist.co/img/icons/icon.svg"}" class="al-dock-menu-avatar" />
            <div class="al-dock-menu-user">
              <span class="al-dock-menu-name">${viewer?.name || "Connected"}</span>
              <span class="al-dock-menu-sub">AniList Account</span>
            </div>
          </div>
          <div class="al-dock-menu-body">
            <a class="al-dock-menu-item" href="https://anilist.co/user/${viewer?.name || ""}" target="_blank" rel="noopener noreferrer">
              ${iconHtml(User, { width: 13, height: 13 })}
              <span>Profile</span>
            </a>
            <button type="button" class="al-dock-menu-item danger" id="al-dock-menu-logout">
              ${iconHtml(LogOut, { width: 13, height: 13 })}
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind Actions
  bar.querySelector("#al-bar-status")?.addEventListener("change", (e) => actions.onStatusChange(e.target.value));
  bar.querySelector("#al-ep-save")?.addEventListener("click", () => {
    if (!entry) {
      actions.onAdd?.();
    } else {
      actions.onSave?.(activeEp || 1);
    }
  });
  bar.querySelector("#al-ep-rewind")?.addEventListener("click", () => {
    const rewindTarget = Math.max(0, (activeEp || progress || 1) - 1);
    actions.onRewind?.(rewindTarget, activeEp);
  });
  bar.querySelector("#al-ep-next")?.addEventListener("click", () => {
    actions.onNextEp?.();
  });
  bar.querySelector("#al-ep-cancel-track")?.addEventListener("click", () => {
    actions.onCancelCountdown?.();
  });
  bar.querySelector("#al-bar-buddy-sync")?.addEventListener("click", () => {
    if (typeof actions.onBuddySync === "function" && buddyData) {
      actions.onBuddySync(buddyData.progress, isBuddyCompleted);
    }
  });

  // User Avatar Dropdown Handling
  const avatarBtn = bar.querySelector("#al-dock-avatar-btn");
  const menu = bar.querySelector("#al-dock-menu");
  avatarBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    menu?.classList.toggle("show");
  });
  document.addEventListener("click", (e) => {
    if (!bar.contains(e.target)) {
      menu?.classList.remove("show");
    }
  });

  bar.querySelector("#al-dock-menu-logout")?.addEventListener("click", () => {
    menu?.classList.remove("show");
    actions.onLogout?.();
  });

  // Buddy picker initialization
  const buddyPickerMount = bar.querySelector("#al-bar-buddy-picker-mount");
  if (buddyPickerMount && entry) {
    initBuddyPicker(buddyPickerMount, {
      selectedBuddy: currentBuddy,
      defaultBuddy,
      viewer,
      emptyLabel: "Buddy",
      placeholder: "Search friend...",
      onSelect: actions.onBuddyChange,
      onClear: () => actions.onBuddyChange("")
    });
  }
}
