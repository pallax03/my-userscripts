import "./styles.css";
import { Storage } from "../shared/storage.js";
import { showToast } from "../shared/toast.js";
import { AniListAPI } from "../shared/anilist/api.js";
import { handleUrlToken, getTodayDate, openTokenModal } from "../shared/anilist/auth.js";
import { STATUS_CONFIG } from "./ui.js";

handleUrlToken();

let currentUser = null;
const userEntries = new Map();
let hideAlreadyAdded = false;

export const App = {
  getDefaultAction() {
    return Storage.get("al_default_action") || "PLANNING";
  },

  setDefaultAction(status) {
    Storage.set("al_default_action", status);
  },

  getPageUsername() {
    const match = window.location.pathname.match(/\/user\/([^/]+)\/animelist/i);
    return match ? decodeURIComponent(match[1]) : null;
  },

  isFriendList() {
    const pageUser = App.getPageUsername();
    if (!pageUser || !currentUser) return false;
    return pageUser.toLowerCase() !== currentUser.name.toLowerCase();
  },

  async initUser() {
    const token = Storage.get("anilist_token");
    if (!token) {
      App.renderFloatingBar();
      return;
    }

    const viewerData = await AniListAPI.getViewer(() => App.logout());
    if (!viewerData?.Viewer) {
      App.renderFloatingBar();
      return;
    }

    currentUser = viewerData.Viewer;

    if (!App.isFriendList()) {
      document.getElementById("al-friend-bar")?.remove();
      return;
    }

    const listData = await AniListAPI.getUserCollection(currentUser.id);
    if (listData?.MediaListCollection?.lists) {
      userEntries.clear();
      for (const list of listData.MediaListCollection.lists) {
        for (const entry of list.entries) {
          userEntries.set(entry.mediaId, entry);
        }
      }
    }

    App.renderFloatingBar();
    App.scanAndEnhanceDOM();
  },

  logout() {
    Storage.del("anilist_token");
    currentUser = null;
    userEntries.clear();
    document.querySelectorAll(".al-split-box, #al-friend-bar").forEach((el) => el.remove());
  },

  renderFloatingBar() {
    if (!App.isFriendList() && currentUser) {
      document.getElementById("al-friend-bar")?.remove();
      return;
    }

    let bar = document.getElementById("al-friend-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "al-friend-bar";
      bar.className = "al-friend-bar";
      document.body.appendChild(bar);
    }

    if (!currentUser) {
      bar.innerHTML = `
        <span>🔑 Token not configured</span>
        <button type="button" id="al-bar-login" style="background:#3db4f2;color:#0b1622;border:none;border-radius:15px;padding:5px 14px;font-size:12px;font-weight:700;cursor:pointer;">Connect AniList</button>`;
      bar.querySelector("#al-bar-login").onclick = () => openTokenModal(() => App.initUser());
      return;
    }

    const defAct = App.getDefaultAction();

    bar.innerHTML = `
      <span style="display:inline-flex;align-items:center;gap:7px;">
        <img src="${currentUser.avatar?.medium || "https://anilist.co/img/icons/icon.svg"}" class="al-avatar" alt="${currentUser.name}" />
        <b>${currentUser.name}</b>
      </span>
      <span style="color:#2a3d54;">|</span>
      <label class="al-filter-label" id="al-filter-toggle">
        <input type="checkbox" id="al-hide-chk" ${hideAlreadyAdded ? "checked" : ""}>
        <span>Hide in my list</span>
      </label>
      <span style="color:#2a3d54;">|</span>
      <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#cbd5e1;font-weight:600;">
        <span>Default action:</span>
        <select class="al-select" id="al-default-sel">
          ${Object.entries(STATUS_CONFIG)
            .map(([k, cfg]) => `<option value="${k}" ${defAct === k ? "selected" : ""}>${cfg.name}</option>`)
            .join("")}
        </select>
      </label>`;

    bar.querySelector("#al-hide-chk").onchange = (e) => {
      hideAlreadyAdded = e.target.checked;
      App.applyVisibilityFilter();
    };

    bar.querySelector("#al-default-sel").onchange = (e) => {
      const newAct = e.target.value;
      App.setDefaultAction(newAct);
      const cfg = STATUS_CONFIG[newAct] || STATUS_CONFIG.PLANNING;
      showToast(`Default action: ${cfg.name}`);

      document.querySelectorAll(".al-split-box:not(.is-added)").forEach((box) => {
        App.applyButtonTheme(box, newAct, false);
      });
    };
  },

  applyVisibilityFilter() {
    document.querySelectorAll("[data-al-media-id]").forEach((card) => {
      const mediaId = parseInt(card.getAttribute("data-al-media-id"), 10);
      const exists = userEntries.has(mediaId);
      card.classList.toggle("al-card-hidden", hideAlreadyAdded && exists);
    });
  },

  applyButtonTheme(box, statusKey, isAdded) {
    const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.PLANNING;
    const mainBtn = box.querySelector(".al-btn-main");
    const arrowBtn = box.querySelector(".al-btn-arrow");
    if (!mainBtn || !arrowBtn) return;

    box.classList.toggle("is-added", isAdded);
    box.style.background = cfg.bg;
    box.style.borderColor = cfg.border;
    box.style.color = cfg.text;

    mainBtn.style.color = cfg.text;
    arrowBtn.style.color = cfg.text;

    if (isAdded) {
      mainBtn.innerHTML = `<span>${cfg.icon} ${cfg.name}</span>`;
      mainBtn.title = `Current status: ${cfg.name} (click to change)`;
    } else {
      mainBtn.innerHTML = `<span>➕ ${cfg.name}</span>`;
      mainBtn.title = `Add as ${cfg.name}`;
    }

    const delBtn = box.querySelector(".al-drop-del");
    if (delBtn) {
      delBtn.style.display = isAdded ? "flex" : "none";
    }
  },

  async handleSave(mediaId, status, totalEpisodes = null) {
    const isCompleted = status === "COMPLETED";
    const params = {
      mediaId,
      status,
      progress: isCompleted ? totalEpisodes || 0 : undefined
    };

    if (isCompleted) {
      params.completedAt = getTodayDate();
      params.startedAt = getTodayDate();
    }

    const res = await AniListAPI.saveEntry(params);
    if (res?.SaveMediaListEntry) {
      userEntries.set(mediaId, res.SaveMediaListEntry);
      const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PLANNING;
      showToast(`✓ Added as ${cfg.name}`);

      const card = document.querySelector(`[data-al-media-id="${mediaId}"]`);
      if (card) {
        const box = card.querySelector(".al-split-box");
        if (box) App.applyButtonTheme(box, status, true);
        if (hideAlreadyAdded) card.classList.add("al-card-hidden");
      }
    }
  },

  async handleDelete(mediaId, entryId) {
    if (confirm("Remove this anime from your AniList?")) {
      const res = await AniListAPI.deleteEntry(entryId);
      if (res?.DeleteMediaListEntry?.deleted) {
        userEntries.delete(mediaId);
        showToast("Anime removed from your list");

        const card = document.querySelector(`[data-al-media-id="${mediaId}"]`);
        if (card) {
          const box = card.querySelector(".al-split-box");
          if (box) App.applyButtonTheme(box, App.getDefaultAction(), false);
          card.classList.remove("al-card-hidden");
        }
      }
    }
  },

  enhanceEntry(container, mediaId, totalEpisodes) {
    container.setAttribute("data-al-media-id", mediaId);
    if (container.querySelector(".al-split-box")) return;

    const existing = userEntries.get(mediaId);
    const isAdded = !!existing;
    const defAct = App.getDefaultAction();
    const currentStatus = isAdded ? existing.status : defAct;

    const box = document.createElement("div");
    box.className = `al-split-box ${isAdded ? "is-added" : ""}`;

    box.onclick = (e) => e.stopPropagation();
    box.onmousedown = (e) => e.stopPropagation();

    box.innerHTML = `
      <button type="button" class="al-btn-main"></button>
      <button type="button" class="al-btn-arrow" title="Change status">▾</button>
      <div class="al-stat-drop">
        ${Object.entries(STATUS_CONFIG)
          .map(
            ([k, cfg]) => `
          <button type="button" class="al-drop-opt" data-status="${k}">
            <span class="dot" style="background:${cfg.dot}"></span>
            <span>${cfg.name}</span>
          </button>
        `
          )
          .join("")}
        <button type="button" class="al-drop-opt al-drop-del" data-del="1" style="display:${isAdded ? "flex" : "none"};">
          <span>🗑️ Remove from list</span>
        </button>
      </div>`;

    App.applyButtonTheme(box, currentStatus, isAdded);

    const drop = box.querySelector(".al-stat-drop");
    const arrowBtn = box.querySelector(".al-btn-arrow");
    const mainBtn = box.querySelector(".al-btn-main");

    const toggleDropdown = (forceState) => {
      const willOpen = forceState !== undefined ? forceState : !drop.classList.contains("show");
      document.querySelectorAll(".al-stat-drop").forEach((d) => d.classList.remove("show"));
      document.querySelectorAll(".al-split-box").forEach((b) => b.classList.remove("is-open"));
      document.querySelectorAll(".al-card-open").forEach((c) => c.classList.remove("al-card-open"));

      if (willOpen) {
        drop.classList.add("show");
        box.classList.add("is-open");
        container.classList.add("al-card-open");
      }
    };

    arrowBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleDropdown();
    };

    mainBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!userEntries.has(mediaId)) {
        App.handleSave(mediaId, App.getDefaultAction(), totalEpisodes);
      } else {
        toggleDropdown();
      }
    };

    drop.querySelectorAll("button[data-status]").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleDropdown(false);
        const selStatus = btn.getAttribute("data-status");
        App.handleSave(mediaId, selStatus, totalEpisodes);
        box.querySelector(".al-drop-del").style.display = "flex";
      };
    });

    const delBtn = box.querySelector(".al-drop-del");
    if (delBtn) {
      delBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleDropdown(false);
        const curEntry = userEntries.get(mediaId);
        if (curEntry) {
          App.handleDelete(mediaId, curEntry.id);
          delBtn.style.display = "none";
        }
      };
    }

    const isGridCard = container.classList.contains("entry-card") || container.classList.contains("media-card");
    const titleCell = container.querySelector(".title");

    if (isGridCard) {
      container.style.position = "relative";
      container.appendChild(box);
    } else if (titleCell) {
      const titleLink = titleCell.querySelector("a");
      if (titleLink) {
        titleLink.after(box);
      } else {
        titleCell.appendChild(box);
      }
    } else {
      container.style.position = "relative";
      container.appendChild(box);
    }

    if (hideAlreadyAdded && isAdded) {
      container.classList.add("al-card-hidden");
    }
  },

  scanAndEnhanceDOM() {
    if (!App.isFriendList() || !currentUser) return;

    const links = document.querySelectorAll('a[href*="/anime/"]');
    links.forEach((link) => {
      const href = link.getAttribute("href");
      const match = href.match(/\/anime\/(\d+)/);
      if (!match) return;

      const mediaId = parseInt(match[1], 10);
      const card = link.closest(".entry-card, .media-card, .entry, .row");
      if (card && !card.querySelector(".al-split-box")) {
        let totalEp = null;
        const epText = card.innerText;
        const epMatch = epText.match(/\/\s*(\d+)/);
        if (epMatch) totalEp = parseInt(epMatch[1], 10);

        App.enhanceEntry(card, mediaId, totalEp);
      }
    });
  },

  init() {
    App.initUser();

    document.addEventListener("click", () => {
      document.querySelectorAll(".al-stat-drop").forEach((d) => d.classList.remove("show"));
      document.querySelectorAll(".al-split-box").forEach((b) => b.classList.remove("is-open"));
      document.querySelectorAll(".al-card-open").forEach((c) => c.classList.remove("al-card-open"));
    });

    let lastPath = window.location.pathname;
    setInterval(() => {
      if (window.location.pathname !== lastPath) {
        lastPath = window.location.pathname;
        App.initUser();
      } else if (App.isFriendList() && currentUser) {
        App.scanAndEnhanceDOM();
      }
    }, 700);
  }
};

App.init();
