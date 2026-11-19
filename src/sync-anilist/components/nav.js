import {
  iconHtml,
  User,
  KeyRound,
  LogOut,
  Sliders
} from "../../shared/icons.js";
import { openPreferencesModal } from "./preferences-modal.js";
import { slot } from "../slots.js";

/**
 * Renders the compact bottom-right floating account pill on Home page.
 * Completely eliminates brittle navbar DOM scraping and off-screen dropdown clipping.
 */
export function renderNav(currentUser, callbacks, provider = null) {
  // Purge any legacy navbar site injections if still present in DOM
  document.getElementById("al-nav-desktop")?.remove();
  document.getElementById("al-nav-mobile")?.remove();

  // On Anime Detail and Watch pages, account menu is already integrated into the main dock
  if (!provider?.isHome?.()) {
    document.getElementById("al-home-user-pill")?.remove();
    return;
  }

  const navSlot = slot("nav");
  let pill = document.getElementById("al-home-user-pill");
  if (!pill) {
    pill = document.createElement("div");
    pill.id = "al-home-user-pill";
    pill.className = "al-compact-pill";
  }

  if (pill.parentElement !== navSlot) {
    navSlot.appendChild(pill);
  }

  const avatar = currentUser?.avatar?.medium || "https://anilist.co/img/icons/icon.svg";

  if (!currentUser) {
    pill.innerHTML = `
      <div class="al-dock-dot is-offline" title="Non connesso ad AniList"></div>
      <button type="button" class="al-pill-btn primary" id="al-home-login-btn">
        ${iconHtml(KeyRound, { width: 13, height: 13 })}
        <span>Accedi ad AniList</span>
      </button>
    `;
    pill.querySelector("#al-home-login-btn")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      callbacks.onLogin?.();
    });
    return;
  }

  pill.innerHTML = `
    <div class="al-dock-dot is-synced" title="Connesso ad AniList"></div>
    <div class="al-dock-user-wrap">
      <button type="button" class="al-dock-avatar-btn" id="al-home-avatar-btn" title="${currentUser.name}">
        <img src="${avatar}" class="al-dock-avatar" alt="${currentUser.name}" />
      </button>
      <div class="al-dock-menu" id="al-home-menu">
        <div class="al-dock-menu-header">
          <img src="${avatar}" class="al-dock-menu-avatar" alt="${currentUser.name}" />
          <div class="al-dock-menu-user">
            <span class="al-dock-menu-name">${currentUser.name}</span>
            <span class="al-dock-menu-sub">AniList • Connesso</span>
          </div>
        </div>
        <div class="al-dock-menu-body">
          <a class="al-dock-menu-item" href="https://anilist.co/user/${currentUser.name}" target="_blank" rel="noopener noreferrer">
            ${iconHtml(User, { width: 13, height: 13 })}
            <span>Profilo AniList</span>
          </a>
          <button type="button" class="al-dock-menu-item" id="al-home-menu-prefs">
            ${iconHtml(Sliders, { width: 13, height: 13 })}
            <span>Impostazioni</span>
          </button>
          <button type="button" class="al-dock-menu-item" id="al-home-menu-token">
            ${iconHtml(KeyRound, { width: 13, height: 13 })}
            <span>Cambia Token</span>
          </button>
          <button type="button" class="al-dock-menu-item danger" id="al-home-menu-logout">
            ${iconHtml(LogOut, { width: 13, height: 13 })}
            <span>Disconnetti Account</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const avatarBtn = pill.querySelector("#al-home-avatar-btn");
  const menu = pill.querySelector("#al-home-menu");
  avatarBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    menu?.classList.toggle("show");
  });
  document.addEventListener("click", (e) => {
    if (!pill.contains(e.target)) menu?.classList.remove("show");
  });

  pill.querySelector("#al-home-menu-prefs")?.addEventListener("click", () => {
    menu?.classList.remove("show");
    openPreferencesModal({ viewer: currentUser });
  });
  pill.querySelector("#al-home-menu-token")?.addEventListener("click", () => {
    menu?.classList.remove("show");
    callbacks.onChangeToken?.();
  });
  pill.querySelector("#al-home-menu-logout")?.addEventListener("click", () => {
    menu?.classList.remove("show");
    callbacks.onLogout?.();
  });
}
