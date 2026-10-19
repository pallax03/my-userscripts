import { AniListAPI } from "../../shared/anilist/api.js";
import { iconHtml, ExternalLink, Trash2, Plus, KeyRound, RotateCcw, Link, Calendar, MoreHorizontal } from "../../shared/icons.js";
import { Buddy } from "../buddy.js";
import { initBuddyPicker } from "./buddy-picker.js";

export function renderActions(media, hasToken, actions, { isLoading = false, viewer = null, defaultBuddy = "", buddyData = null } = {}) {
  // Purge AnimeUnity personal account elements from DOM
  document.querySelectorAll(".cover-wrap .actions, .list-btn-mobile, #add-to-fav").forEach((el) => el.remove());

  const epWrapper = document.querySelector(".episode-wrapper");
  const overview = document.querySelector(".content .overview") || document.querySelector(".overview");
  if (!epWrapper && !overview) return;

  let bar = document.getElementById("al-control-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "al-control-bar";
    bar.className = "al-card";
  }

  // Anchor bar directly below the episode selector
  if (epWrapper && bar.previousElementSibling !== epWrapper) epWrapper.after(bar);
  else if (!epWrapper && overview && bar.parentElement !== overview) overview.appendChild(bar);

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

  bar.innerHTML = `
    <div class="al-card-row">
      <div class="al-left">
        <div class="al-title-meta-wrap">
          <a href="https://anilist.co/anime/${media.id}" target="_blank" rel="noopener noreferrer" class="al-badge" title="Open on AniList: ${title}">
            <span class="al-title-text">${title}</span>
            ${iconHtml(ExternalLink, { width: 12, height: 12, class: "al-badge-icon" })}
          </a>
          ${entry ? `
            <div class="al-more-wrap">
              <button type="button" class="al-icon-btn al-more-btn" id="al-bar-more" title="More options">
                ${iconHtml(MoreHorizontal, { width: 14, height: 14 })}
              </button>
              <div class="al-more-menu" id="al-more-menu" style="display: none;">
                <button type="button" class="al-more-menu-item" id="al-menu-reset" title="Reset progress to Ep. 0 (Haven't watched yet)">
                  ${iconHtml(RotateCcw, { width: 13, height: 13 })}
                  <span>Reset to Ep. 0</span>
                </button>
              </div>
            </div>
          ` : ""}
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
                    <span>${isBuddyCompleted ? `${buddyData.name} Completed` : `Ep. ${buddyData.progress}`}</span>
                  </button>
                ` : `
                  <span class="al-buddy-tag ${isBuddyCompleted ? "is-completed" : ""}" title="${buddyData.name}: ${isBuddyCompleted ? "Completed" : `Ep. ${buddyData.progress || 0}`}">
                    ${isBuddyCompleted ? `<span class="al-dot"></span><span>${buddyData.name} Completed</span>` : `<span>Ep. ${buddyData.progress || 0}</span>`}
                  </span>
                `}
              ` : ""}
            </div>

            <select class="al-select" id="al-bar-status" title="Anime status">
              ${Object.entries(AniListAPI.statuses).map(([k, v]) => `<option value="${k}" ${entry.status === k ? "selected" : ""}>${v}</option>`).join("")}
            </select>

            <select class="al-select" id="al-bar-score" title="Your rating">
              <option value="0">Score: −</option>
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => `<option value="${s}" ${entry.score === s ? "selected" : ""}>★ ${s}/10</option>`).join("")}
            </select>

            <button type="button" class="al-icon-btn danger" id="al-bar-del" title="Remove from AniList library">
              ${iconHtml(Trash2, { width: 14, height: 14 })}
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

  bar.querySelector("#al-bar-add")?.addEventListener("click", actions.onAdd);
  bar.querySelector("#al-bar-del")?.addEventListener("click", actions.onDelete);
  bar.querySelector("#al-bar-status")?.addEventListener("change", (e) => actions.onStatusChange(e.target.value));
  bar.querySelector("#al-bar-score")?.addEventListener("change", (e) => actions.onScoreChange(parseFloat(e.target.value)));
  bar.querySelector("#al-bar-buddy-sync")?.addEventListener("click", () => {
    if (typeof actions.onBuddySync === "function" && buddyData) {
      actions.onBuddySync(buddyData.progress, isBuddyCompleted);
    }
  });

  const moreBtn = bar.querySelector("#al-bar-more");
  const moreMenu = bar.querySelector("#al-more-menu");
  if (moreBtn && moreMenu) {
    moreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = moreMenu.style.display !== "none";
      moreMenu.style.display = isOpen ? "none" : "block";
    });

    bar.querySelector("#al-menu-reset")?.addEventListener("click", () => {
      moreMenu.style.display = "none";
      if (typeof actions.onResetProgress === "function") actions.onResetProgress();
    });

    document.addEventListener("click", (e) => {
      if (!moreBtn.contains(e.target) && !moreMenu.contains(e.target)) {
        moreMenu.style.display = "none";
      }
    });
  }

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
