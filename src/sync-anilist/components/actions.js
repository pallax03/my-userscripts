import { AniListAPI } from "../../shared/anilist/api.js";
import {
  iconHtml,
  Trash2,
  Plus,
  KeyRound,
  Check,
  Zap,
  Sliders,
  User,
  LogOut,
  RotateCcw,
  Bookmark,
  ExternalLink
} from "../../shared/icons.js";
import { Buddy } from "../buddy.js";
import { initBuddyPicker } from "./buddy-picker.js";
import { openPreferencesModal } from "./preferences-modal.js";
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
    isWatch = false
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
    viewer?.name
  ].join("::");

  if (bar.__lastRenderKey === renderKey && bar.children.length > 0) {
    return;
  }
  bar.__lastRenderKey = renderKey;

  // 1. Not Logged In State
  if (!hasToken) {
    bar.innerHTML = `
      <div class="al-pill-item al-dock-dot is-offline" title="Non connesso ad AniList"></div>
      <span class="al-pill-label">Accedi ad AniList per tracciare gli episodi</span>
      <button type="button" class="al-pill-btn primary" id="al-bar-login">
        ${iconHtml(KeyRound, { width: 13, height: 13 })}
        <span>Accedi con 1-Click</span>
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
      <div class="al-pill-item al-dock-dot is-pulsing" title="Sincronizzazione AniList..."></div>
      <span class="al-pill-loading-text">Sincronizzazione AniList in corso...</span>
      <div class="al-dock-switch-box" id="al-dock-switch-slot"></div>
    `;
    return;
  }

  // 3. Anime Not Found State
  if (!media) {
    bar.innerHTML = `
      <div class="al-pill-item al-dock-dot is-error" title="Anime non trovato su AniList"></div>
      <span class="al-pill-label text-muted">Anime non trovato su AniList</span>
      <div class="al-dock-switch-box" id="al-dock-switch-slot"></div>
    `;
    return;
  }

  const title = media.title?.english || media.title?.romaji || media.title?.userPreferred || `Anime #${media.id}`;
  const total = media.episodes || 0;
  const isCurrentTracked = progress > 0 && activeEp === progress;
  const isAhead = activeEp > progress;
  const isPast = progress > 0 && activeEp < progress;
  const isCounting = autoTrackState?.isActive && autoTrackState.targetEp === activeEp;
  const isBuddyCompleted = !!buddyData?.isCompleted;
  const isBuddyAhead = !!(buddyData?.name && (buddyData.progress || 0) > progress);
  const canSyncBuddy = isBuddyAhead || (isBuddyCompleted && entry?.status !== "COMPLETED");
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
      <button type="button" class="al-dock-btn is-add" id="al-ep-save" title="Aggiungi anime alla tua libreria AniList">
        ${iconHtml(Plus, { width: 12, height: 12 })}
        <span>Aggiungi alla lista</span>
      </button>
    `;
  } else if (isCounting) {
    actionBtnHtml = `
      <button type="button" class="al-dock-btn is-counting" id="al-ep-save" title="Salvataggio automatico in ${autoTrackState.countdown}s • Clicca per salvare subito">
        ${iconHtml(Zap, { width: 12, height: 12, class: "al-pulse" })}
        <span>Salva subito (${autoTrackState.countdown}s)</span>
      </button>
      <button type="button" class="al-dock-step-btn danger" id="al-ep-cancel-track" title="Annulla salvataggio automatico">✕</button>
    `;
  } else if (isAhead || progress === 0) {
    actionBtnHtml = `
      <button type="button" class="al-dock-btn is-pending" id="al-ep-save" title="Segna l'episodio ${activeEp} come visto su AniList (Attuale: Ep. ${progress})">
        ${iconHtml(Zap, { width: 12, height: 12 })}
        <span>Segna Ep. ${activeEp} visto</span>
      </button>
    `;
  } else if (isCurrentTracked) {
    actionBtnHtml = `
      <button type="button" class="al-dock-btn is-tracked" id="al-ep-save" title="Sincronizzato: Ep. ${progress} • Clicca per riconfermare">
        ${iconHtml(Check, { width: 12, height: 12 })}
        <span>In pari (Ep. ${activeEp})</span>
      </button>
    `;
  } else if (isPast) {
    actionBtnHtml = `
      <button type="button" class="al-dock-btn is-tracked" id="al-ep-save" title="Episodio già visto (AniList è a Ep. ${progress}) • Clicca per allineare AniList all'Ep. ${activeEp}">
        ${iconHtml(Check, { width: 12, height: 12 })}
        <span>Visto (AniList: Ep. ${progress})</span>
      </button>
    `;
  }

  bar.innerHTML = `
    <!-- Pulse dot -->
    <div class="al-dock-dot ${isCounting ? "is-counting" : (isCurrentTracked || !isWatch) ? "is-synced" : "is-pending"}"></div>

    <!-- Anime Title + AniList Link -->
    <a class="al-dock-title" href="https://anilist.co/anime/${media.id}" target="_blank" rel="noopener noreferrer" title="${title} su AniList">
      <span class="al-title-name">${title}</span>
      <span class="al-ext-icon">${iconHtml(ExternalLink, { width: 10, height: 10 })}</span>
    </a>

    <div class="al-dock-divider"></div>

    <!-- Gruppo 1: Controllo Episodio (Watch) o Progresso (Detail) -->
    <div class="al-dock-group al-dock-ep-group">
      ${isWatch ? `
        <div class="al-dock-ep-badge">Ep. ${activeEp}</div>
        ${actionBtnHtml}
        <div class="al-dock-step-controls">
          <button type="button" class="al-dock-step-btn" id="al-ep-rewind" title="Riavvolgi tracciamento a Ep. ${Math.max(0, activeEp - 1)}">
            ${iconHtml(RotateCcw, { width: 11, height: 11 })}
          </button>
          <button type="button" class="al-dock-step-btn" id="al-ep-next" title="Avanza tracciamento ad AniList ad Ep. ${activeEp + 1}">
            ${iconHtml(Plus, { width: 11, height: 11 })}
          </button>
        </div>
      ` : `
        ${entry ? `
          <div class="al-dock-ep-badge" title="Progresso tracciato su AniList">
            Tracciato: Ep. ${progress} / ${total || "?"}
          </div>
        ` : `
          <button type="button" class="al-dock-btn is-add" id="al-ep-save" title="Aggiungi anime alla tua libreria AniList">
            ${iconHtml(Plus, { width: 12, height: 12 })}
            <span>Aggiungi alla lista</span>
          </button>
        `}
      `}
    </div>

    <div class="al-dock-divider"></div>

    <!-- Gruppo 2: Stato Libreria AniList (+ Score on detail page) -->
    <div class="al-dock-group al-dock-status-group">
      ${entry ? `
        <div class="al-dock-select-box">
          ${iconHtml(Bookmark, { width: 11, height: 11, class: "al-dock-icon-muted" })}
          <select class="al-dock-select" id="al-bar-status" title="Stato su AniList">
            ${Object.entries(statusMap).map(([k, label]) => `
              <option value="${k}" ${entry.status === k ? "selected" : ""}>${label}</option>
            `).join("")}
          </select>
        </div>
        ${!isWatch ? `
          <div class="al-dock-select-box" title="Voto su AniList">
            <select class="al-dock-select" id="al-bar-score">
              <option value="0" ${!entry.score ? "selected" : ""}>Voto: -</option>
              ${[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((s) => `
                <option value="${s}" ${entry.score === s ? "selected" : ""}>★ ${s}</option>
              `).join("")}
            </select>
          </div>
        ` : ""}
      ` : ""}
    </div>

    <!-- Gruppo 3: Slot Skip Intro (Watch Page) -->
    ${isWatch ? `<div class="al-dock-group al-dock-skip-slot" id="al-dock-skip-slot"></div>` : ""}

    <!-- Gruppo 4: Provider Switch (AnimeSaturn) -->
    <div class="al-dock-group al-dock-switch-box" id="al-dock-switch-slot"></div>

    <!-- Gruppo 5: Buddy Watching & Account -->
    <div class="al-dock-group al-dock-user-group">
      ${entry ? `
        <div class="al-dock-buddy-cluster" id="al-dock-buddy-box">
          ${currentBuddy && buddyData ? `
            ${canSyncBuddy ? `
              <button type="button" class="al-dock-buddy-btn is-ahead" id="al-bar-buddy-sync" title="Allineati a ${buddyData.name} (${isBuddyCompleted ? "Completato" : `Ep. ${buddyData.progress}`})">
                <img src="${buddyAvatar}" class="al-dock-buddy-avatar" alt="${currentBuddy}" />
                <span>${isBuddyCompleted ? "Fine" : `Ep. ${buddyData.progress}`}</span>
              </button>
            ` : `
              <div class="al-dock-buddy-btn" title="Insieme a ${currentBuddy} (Ep. ${buddyData.progress || 0})">
                <img src="${buddyAvatar}" class="al-dock-buddy-avatar" alt="${currentBuddy}" />
                <span>Ep. ${buddyData.progress || 0}</span>
              </div>
            `}
          ` : `
            <div class="al-dock-buddy-picker-trigger" id="al-bar-buddy-picker-mount"></div>
          `}
        </div>
      ` : ""}

      <div class="al-dock-user-wrap">
        <button type="button" class="al-dock-avatar-btn" id="al-dock-avatar-btn" title="${viewer?.name || "Account AniList"}">
          <img src="${viewer?.avatar?.medium || "https://anilist.co/img/icons/icon.svg"}" class="al-dock-avatar" />
        </button>
        <div class="al-dock-menu" id="al-dock-menu">
          <div class="al-dock-menu-header">
            <img src="${viewer?.avatar?.medium || "https://anilist.co/img/icons/icon.svg"}" class="al-dock-menu-avatar" />
            <div class="al-dock-menu-user">
              <span class="al-dock-menu-name">${viewer?.name || "Connesso"}</span>
              <span class="al-dock-menu-sub">AniList • ${entry ? `Ep. ${progress}/${total || "?"}` : "Libreria"}</span>
            </div>
          </div>
          <div class="al-dock-menu-body">
            <a class="al-dock-menu-item" href="https://anilist.co/user/${viewer?.name || ""}" target="_blank" rel="noopener noreferrer">
              ${iconHtml(User, { width: 13, height: 13 })}
              <span>Profilo AniList</span>
            </a>
            <button type="button" class="al-dock-menu-item" id="al-dock-menu-prefs">
              ${iconHtml(Sliders, { width: 13, height: 13 })}
              <span>Impostazioni</span>
            </button>
            <button type="button" class="al-dock-menu-item" id="al-dock-menu-token">
              ${iconHtml(KeyRound, { width: 13, height: 13 })}
              <span>Cambia Token</span>
            </button>
            ${entry ? `
              <button type="button" class="al-dock-menu-item danger" id="al-dock-menu-del">
                ${iconHtml(Trash2, { width: 13, height: 13 })}
                <span>Rimuovi da AniList</span>
              </button>
            ` : ""}
            <button type="button" class="al-dock-menu-item danger" id="al-dock-menu-logout">
              ${iconHtml(LogOut, { width: 13, height: 13 })}
              <span>Disconnetti Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind Actions
  bar.querySelector("#al-bar-status")?.addEventListener("change", (e) => actions.onStatusChange(e.target.value));
  bar.querySelector("#al-bar-score")?.addEventListener("change", (e) => actions.onScoreChange?.(parseInt(e.target.value, 10)));
  bar.querySelector("#al-ep-save")?.addEventListener("click", () => {
    if (!entry) {
      actions.onAdd?.();
    } else {
      actions.onSave?.(activeEp || 1);
    }
  });
  bar.querySelector("#al-ep-rewind")?.addEventListener("click", () => {
    const rewindTarget = Math.max(0, (activeEp || 1) - 1);
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
    if (!bar.contains(e.target)) menu?.classList.remove("show");
  });

  bar.querySelector("#al-dock-menu-prefs")?.addEventListener("click", () => {
    menu?.classList.remove("show");
    openPreferencesModal({ viewer });
  });
  bar.querySelector("#al-dock-menu-token")?.addEventListener("click", () => {
    menu?.classList.remove("show");
    actions.onChangeToken?.();
  });
  bar.querySelector("#al-dock-menu-del")?.addEventListener("click", () => {
    menu?.classList.remove("show");
    actions.onDelete?.();
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
      emptyLabel: "Sync Amico",
      placeholder: "Cerca amico seguito...",
      onSelect: actions.onBuddyChange,
      onClear: () => actions.onBuddyChange("")
    });
  }
}
