import {
  iconHtml,
  Plus,
  KeyRound,
  Check,
  Zap,
  Sliders,
  User,
  LogOut,
  RotateCcw,
  ExternalLink,
  SkipForward
} from "../../shared/icons.js";
import { Buddy } from "../buddy.js";
import { initBuddyPicker } from "./buddy-picker.js";
import { openPreferencesModal } from "./preferences-modal.js";
import { openSkipContribute } from "./skip-intro.js";
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
      <button type="button" class="al-dock-btn is-add" id="al-ep-save" title="Aggiungi anime alla tua libreria AniList">
        ${iconHtml(Plus, { width: 12, height: 12 })}
        <span>Aggiungi</span>
      </button>
    `;
  } else if (isCounting) {
    actionBtnHtml = `
      <button type="button" class="al-dock-btn is-counting" id="al-ep-save" title="Salvataggio automatico in ${autoTrackState.countdown}s • Clicca per salvare subito">
        ${iconHtml(Zap, { width: 12, height: 12, class: "al-pulse" })}
        <span>Salva (${autoTrackState.countdown}s)</span>
      </button>
      <button type="button" class="al-dock-step-btn danger" id="al-ep-cancel-track" title="Annulla salvataggio automatico">✕</button>
    `;
  } else if (isAhead || progress === 0) {
    actionBtnHtml = `
      <button type="button" class="al-dock-btn is-pending" id="al-ep-save" title="Segna Ep. ${activeEp} visto su AniList (Attuale: Ep. ${progress})">
        ${iconHtml(Zap, { width: 12, height: 12 })}
        <span>Segna Ep. ${activeEp}</span>
      </button>
    `;
  } else if (isCurrentTracked) {
    actionBtnHtml = `
      <button type="button" class="al-dock-btn is-tracked" id="al-ep-save" title="Sincronizzato su AniList: Ep. ${progress} • Clicca per riconfermare">
        ${iconHtml(Check, { width: 12, height: 12 })}
        <span>In pari · Ep. ${activeEp}</span>
      </button>
    `;
  } else if (isPast) {
    actionBtnHtml = `
      <button type="button" class="al-dock-btn is-tracked" id="al-ep-save" title="Episodio precedente (AniList è a Ep. ${progress}) • Clicca per allineare a Ep. ${activeEp}">
        ${iconHtml(Check, { width: 12, height: 12 })}
        <span>Ep. ${activeEp} (AniList: ${progress})</span>
      </button>
    `;
  }

  bar.innerHTML = `
    <!-- Gruppo 1: Controllo Episodio (Watch) o Progresso (Detail) -->
    <div class="al-dock-group al-dock-ep-group">
      ${isWatchEp ? `
        ${actionBtnHtml}
      ` : `
        ${entry ? `
          <div class="al-dock-ep-badge" title="${title} su AniList">
            ${isRewatching ? "Rewatch" : "Tracciato"}: Ep. ${progress} / ${total || "?"}
          </div>
        ` : `
          <button type="button" class="al-dock-btn is-add" id="al-ep-save" title="Aggiungi anime alla tua libreria AniList">
            ${iconHtml(Plus, { width: 12, height: 12 })}
            <span>Aggiungi</span>
          </button>
        `}
      `}
    </div>

    <!-- Gruppo 2: Slot Skip Intro (Watch Page, solo quando esiste segmento) -->
    ${isWatchEp ? `<div class="al-dock-group al-dock-skip-slot" id="al-dock-skip-slot"></div>` : ""}

    <!-- Gruppo 3: Provider Switch (Go to AnimeSaturn / AnimeUnity) -->
    <div class="al-dock-group al-dock-switch-box" id="al-dock-switch-slot"></div>

    <!-- Gruppo 4: Buddy Ahead Sync (solo se l'amico è più avanti!) + Menu Account -->
    <div class="al-dock-group al-dock-user-group">
      ${entry && currentBuddy && buddyData && canSyncBuddy ? `
        <button type="button" class="al-dock-buddy-btn is-ahead" id="al-bar-buddy-sync" title="Allineati a ${buddyData.name} (${isBuddyCompleted ? "Completato" : `Ep. ${buddyData.progress}`})">
          <img src="${buddyAvatar}" class="al-dock-buddy-avatar" alt="${currentBuddy}" />
          <span>${isBuddyCompleted ? "Fine" : `Ep. ${buddyData.progress}`}</span>
        </button>
      ` : ""}

      <div class="al-dock-user-wrap">
        <button type="button" class="al-dock-avatar-btn" id="al-dock-avatar-btn" title="${title} • ${viewer?.name || "Account AniList"}">
          <img src="${viewer?.avatar?.medium || "https://anilist.co/img/icons/icon.svg"}" class="al-dock-avatar" />
        </button>
        <div class="al-dock-menu" id="al-dock-menu">
          <div class="al-dock-menu-header">
            <img src="${viewer?.avatar?.medium || "https://anilist.co/img/icons/icon.svg"}" class="al-dock-menu-avatar" />
            <div class="al-dock-menu-user">
              <span class="al-dock-menu-name">${viewer?.name || "Connesso"}</span>
              <span class="al-dock-menu-sub">${entry ? `Ep. ${progress}/${total || "?"}` : "Non in lista"}</span>
            </div>
          </div>
          <div class="al-dock-menu-body">
            <a class="al-dock-menu-item" href="https://anilist.co/anime/${media.id}" target="_blank" rel="noopener noreferrer">
              ${iconHtml(ExternalLink, { width: 13, height: 13 })}
              <span class="al-title-name">${title}</span>
            </a>
            ${entry ? `
              <div class="al-dock-menu-controls" style="display:flex;gap:6px;padding:4px 6px;align-items:center;">
                <button type="button" class="al-dock-step-btn" id="al-ep-rewind" title="Riavvolgi tracciamento a Ep. ${Math.max(0, (activeEp || progress || 1) - 1)}">
                  ${iconHtml(RotateCcw, { width: 11, height: 11 })}
                  <span style="font-size:10px;margin-left:3px;">-1</span>
                </button>
                <select class="al-dock-select" id="al-bar-status" title="Stato su AniList" style="flex:1;">
                  ${Object.entries(statusMap).map(([k, label]) => `
                    <option value="${k}" ${entry.status === k ? "selected" : ""}>${label}</option>
                  `).join("")}
                </select>
              </div>
              <div class="al-dock-buddy-picker-trigger" id="al-bar-buddy-picker-mount" style="padding:2px 6px;"></div>
            ` : ""}
            ${isWatchEp ? `
              <button type="button" class="al-dock-menu-item" id="al-dock-menu-skip">
                ${iconHtml(SkipForward, { width: 13, height: 13 })}
                <span>Calibra / + Intro</span>
              </button>
            ` : ""}
            <a class="al-dock-menu-item" href="https://anilist.co/user/${viewer?.name || ""}" target="_blank" rel="noopener noreferrer">
              ${iconHtml(User, { width: 13, height: 13 })}
              <span>Profilo AniList</span>
            </a>
            <button type="button" class="al-dock-menu-item" id="al-dock-menu-prefs">
              ${iconHtml(Sliders, { width: 13, height: 13 })}
              <span>Impostazioni</span>
            </button>
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
  bar.querySelector("#al-ep-cancel-track")?.addEventListener("click", () => {
    actions.onCancelCountdown?.();
  });
  bar.querySelector("#al-bar-buddy-sync")?.addEventListener("click", () => {
    if (typeof actions.onBuddySync === "function" && buddyData) {
      actions.onBuddySync(buddyData.progress, isBuddyCompleted);
    }
  });
  bar.querySelector("#al-dock-menu-skip")?.addEventListener("click", () => {
    menu?.classList.remove("show");
    openSkipContribute();
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
