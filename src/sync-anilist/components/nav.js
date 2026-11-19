import {
  iconHtml,
  User,
  KeyRound,
  LogOut
} from "../../shared/icons.js";
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
    pill.className = "al-compact-pill al-home-user-pill";
  }

  if (pill.parentElement !== navSlot) {
    navSlot.appendChild(pill);
  }

  const avatar = currentUser?.avatar?.medium || "https://anilist.co/img/icons/icon.svg";

  if (!currentUser) {
    pill.classList.remove("is-expanded");
    pill.classList.add("is-guest");
    pill.innerHTML = `
      <button type="button" class="al-pill-btn primary" id="al-home-login-btn">
        ${iconHtml(KeyRound, { width: 14, height: 14 })}
        <span>Login AniList</span>
      </button>
    `;
    pill.querySelector("#al-home-login-btn")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      callbacks.onLogin?.();
    });
    return;
  }
  pill.classList.remove("is-guest");

  pill.innerHTML = `
    <div class="al-home-pill-side is-left">
      <a class="al-home-pill-action" href="https://anilist.co/user/${currentUser.name}" target="_blank" rel="noopener noreferrer" title="AniList Profile">
        ${iconHtml(User, { width: 13, height: 13 })}
        <span>Profile</span>
      </a>
    </div>
    <button type="button" class="al-home-avatar-btn" id="al-home-avatar-btn" title="${currentUser.name}">
      <img src="${avatar}" class="al-home-avatar" alt="${currentUser.name}" />
    </button>
    <div class="al-home-pill-side is-right">
      <button type="button" class="al-home-pill-action is-danger" id="al-home-menu-logout" title="Logout">
        <span>Logout</span>
        ${iconHtml(LogOut, { width: 13, height: 13 })}
      </button>
    </div>
  `;

  const avatarBtn = pill.querySelector("#al-home-avatar-btn");
  avatarBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    pill.classList.toggle("is-expanded");
  });
  document.addEventListener("click", (e) => {
    if (!pill.contains(e.target)) pill.classList.remove("is-expanded");
  });

  pill.querySelector("#al-home-menu-logout")?.addEventListener("click", (e) => {
    e.stopPropagation();
    pill.classList.remove("is-expanded");
    callbacks.onLogout?.();
  });
}
