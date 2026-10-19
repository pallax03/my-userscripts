import {
  iconHtml,
  User,
  KeyRound,
  LogOut,
  ExternalLink,
  Sliders
} from "../../shared/icons.js";
import { openPreferencesModal } from "./preferences-modal.js";

const dropdownTpl = (user) => `
  <div class="al-dropdown-header">
    <div class="al-user-info">
      <img src="${user.avatar?.medium || "https://anilist.co/img/icons/icon.svg"}" class="al-dropdown-avatar" />
      <div class="al-user-text">
        <span class="al-username">${user.name}</span>
        <span class="al-user-status">
          <span class="al-status-dot"></span>
          <span>AniList Connected</span>
        </span>
      </div>
    </div>
  </div>

  <div class="al-dropdown-body">
    <a class="al-dropdown-item" href="https://anilist.co/user/${user.name}" target="_blank" rel="noopener noreferrer">
      <span class="al-item-left">
        ${iconHtml(User, { width: 14, height: 14 })}
        <span>View Profile</span>
      </span>
      ${iconHtml(ExternalLink, { width: 12, height: 12, class: "al-item-ext" })}
    </a>
    <button class="al-dropdown-item al-btn-prefs" type="button">
      <span class="al-item-left">
        ${iconHtml(Sliders, { width: 14, height: 14 })}
        <span>Preferences</span>
      </span>
    </button>
    <button class="al-dropdown-item al-btn-token" type="button">
      <span class="al-item-left">
        ${iconHtml(KeyRound, { width: 14, height: 14 })}
        <span>Change Token</span>
      </span>
    </button>
  </div>

  <div class="al-dropdown-footer">
    <button class="al-dropdown-item danger al-btn-logout" type="button">
      <span class="al-item-left">
        ${iconHtml(LogOut, { width: 14, height: 14, style: "color:#ef4444;" })}
        <span>Disconnect Account</span>
      </span>
    </button>
  </div>
`;

function bindDropdown(menu, { onChangeToken, onLogout }, currentUser) {
  menu.querySelector(".al-btn-prefs")?.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.remove("show");
    openPreferencesModal({ viewer: currentUser });
  });

  menu.querySelector(".al-btn-token")?.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.remove("show");
    onChangeToken();
  });

  menu.querySelector(".al-btn-logout")?.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.remove("show");
    onLogout();
  });
}

export function renderNav(currentUser, callbacks) {
  const avatar = currentUser?.avatar?.medium || "https://anilist.co/img/icons/icon.svg";

  // 1. Desktop Nav (#left-nav)
  const leftNav = document.querySelector("#left-nav");
  if (leftNav) {
    let container = document.getElementById("al-nav-desktop");
    if (!container) {
      container = document.createElement("li");
      container.id = "al-nav-desktop";
      container.className = "nav-item position-relative";
      const nativeLogin = leftNav.querySelector('a[href*="/login"]')?.closest(".nav-item");
      nativeLogin ? nativeLogin.replaceWith(container) : leftNav.appendChild(container);
    }

    if (!currentUser) {
      container.innerHTML = `
        <a class="nav-link text-center pt-3" href="#" role="button">
          ${iconHtml(KeyRound, { width: 18, height: 18, style: "color:var(--al-blue);" })}<br>
          <span style="color:var(--al-blue);font-weight:600;font-size:11px;">AniList</span>
        </a>`;
      container.querySelector("a").onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        callbacks.onLogin?.();
      };
    } else {
      container.innerHTML = `
        <a class="nav-link d-flex align-items-center p-2" href="#" role="button" style="gap:8px;">
          <img src="${avatar}" class="al-avatar" />
          <div class="d-none d-lg-flex flex-column text-left">
            <span class="text-white font-weight-bold small text-truncate" style="max-width:85px;">${currentUser.name}</span>
            <span class="text-muted" style="font-size:10px;">AniList</span>
          </div>
          <i class="fas fa-chevron-down text-muted ml-1" style="font-size:9px;"></i>
        </a>
        <div class="dropdown-menu dropdown-menu-right al-dropdown-menu" id="al-nav-dropdown">
          ${dropdownTpl(currentUser)}
        </div>`;

      const menu = container.querySelector("#al-nav-dropdown");
      let closeTimer = null;

      const openDropdown = () => {
        if (closeTimer) clearTimeout(closeTimer);
        closeTimer = null;
        menu.classList.add("show");
      };

      const closeDropdownWithDelay = () => {
        if (closeTimer) clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
          menu.classList.remove("show");
        }, 220); // 220ms grace window (safe triangle trajectory)
      };

      container.addEventListener("mouseenter", openDropdown);
      container.addEventListener("mouseleave", closeDropdownWithDelay);
      menu.addEventListener("mouseenter", openDropdown);
      menu.addEventListener("mouseleave", closeDropdownWithDelay);

      container.querySelector("a").onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        menu.classList.toggle("show");
      };

      document.addEventListener("click", (e) => {
        if (!container.contains(e.target)) menu.classList.remove("show");
      });

      bindDropdown(menu, callbacks, currentUser);
    }
  }

  // 2. Mobile Nav (.nav-top-mobile)
  const mobileNav = document.querySelector(".nav-top-mobile");
  if (mobileNav) {
    let mWidget = document.getElementById("al-nav-mobile");
    if (!mWidget) {
      mWidget = document.createElement("div");
      mWidget.id = "al-nav-mobile";
      mWidget.className = "d-inline-block ml-2 position-relative";
      mobileNav.appendChild(mWidget);
    }

    if (!currentUser) {
      mWidget.innerHTML = `
        <button type="button" class="btn btn-sm al-bg-blue py-1 px-2 rounded-pill small d-inline-flex align-items-center" style="gap:4px;">
          ${iconHtml(KeyRound, { width: 12, height: 12 })}
          <span>AniList</span>
        </button>`;
      mWidget.querySelector("button").onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        callbacks.onLogin?.();
      };
    } else {
      mWidget.innerHTML = `
        <img src="${avatar}" class="al-avatar-mobile" />
        <div class="dropdown-menu dropdown-menu-right al-dropdown-menu position-fixed" id="al-nav-m-dropdown" style="top:54px;right:12px;z-index:99999;">
          ${dropdownTpl(currentUser)}
        </div>`;

      const mMenu = mWidget.querySelector("#al-nav-m-dropdown");
      mWidget.querySelector("img").onclick = (e) => {
        e.stopPropagation();
        mMenu.classList.toggle("show");
      };
      bindDropdown(mMenu, callbacks, currentUser);
    }
  }
}
