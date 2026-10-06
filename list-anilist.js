// ==UserScript==
// @name         AniList Friend List - Quick Add & Sync
// @namespace    https://github.com/pallax03/my-userscripts
// @version      1.3.0
// @description  Easily add and sync anime from a friend's AniList list directly into your own collection with graceful color-coded split buttons and customizable default action
// @author       Alex Mazzoni
// @match        *://anilist.co/user/*/animelist*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  // ==========================================================================
  // 1. STORAGE & HELPERS
  // ==========================================================================
  const Storage = {
    get: (k) => {
      try { if (typeof GM_getValue === "function") return GM_getValue(k) ?? localStorage.getItem(k); } catch (_) {}
      return localStorage.getItem(k);
    },
    set: (k, v) => {
      try { if (typeof GM_setValue === "function") GM_setValue(k, v); } catch (_) {}
      try { localStorage.setItem(k, v); } catch (_) {}
    },
    del: (k) => {
      try { if (typeof GM_deleteValue === "function") GM_deleteValue(k); } catch (_) {}
      try { localStorage.removeItem(k); } catch (_) {}
    }
  };

  const today = () => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  };

  // Exact color mapping requested:
  // completed -> verde (green)
  // watching -> blue
  // re-watching -> cyan
  // dropped -> red
  // planning -> gray
  // paused -> yellow
  const STATUS_CONFIG = {
    COMPLETED: {
      name: "Completed",
      icon: "✓",
      border: "#22c55e",
      bg: "#0d261a",
      text: "#4ade80",
      dot: "#22c55e"
    },
    CURRENT: {
      name: "Watching",
      icon: "▶",
      border: "#3db4f2",
      bg: "#102338",
      text: "#60a5fa",
      dot: "#3db4f2"
    },
    REPEATING: {
      name: "Rewatching",
      icon: "↻",
      border: "#06b6d4",
      bg: "#0c252e",
      text: "#22d3ee",
      dot: "#06b6d4"
    },
    DROPPED: {
      name: "Dropped",
      icon: "✕",
      border: "#ef4444",
      bg: "#2b1216",
      text: "#f87171",
      dot: "#ef4444"
    },
    PLANNING: {
      name: "Plan to Watch",
      icon: "📌",
      border: "#64748b",
      bg: "#18202c",
      text: "#cbd5e1",
      dot: "#94a3b8"
    },
    PAUSED: {
      name: "Paused",
      icon: "⏸",
      border: "#eab308",
      bg: "#29210c",
      text: "#facc15",
      dot: "#eab308"
    }
  };

  // Quick token setup via URL (?al_token=...)
  const params = new URLSearchParams(window.location.search);
  if (params.has("al_token")) {
    Storage.set("anilist_token", params.get("al_token").trim());
    params.delete("al_token");
    window.history.replaceState({}, document.title, window.location.pathname + (params.toString() ? "?" + params : "") + window.location.hash);
  }

  // ==========================================================================
  // 2. GRAPHQL API
  // ==========================================================================
  const API = {
    url: "https://graphql.anilist.co",
    clientId: "43750",
    oauthUrl: "https://anilist.co/api/v2/oauth/authorize?client_id=43750&response_type=token",

    async call(query, variables = {}) {
      const token = Storage.get("anilist_token");
      if (!token) return null;
      try {
        const res = await fetch(API.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({ query, variables })
        });
        const { data, errors } = await res.json();
        if (errors) {
          if (errors[0]?.status === 401 || errors[0]?.message?.includes("Invalid token")) {
            UI.toast("AniList token invalid or expired!", true);
            App.logout();
            return null;
          }
          throw new Error(errors[0].message);
        }
        return data;
      } catch (err) {
        UI.toast("Error: " + (err.message || "Network"), true);
        return null;
      }
    },

    getViewer: () => API.call(`query { Viewer { id name avatar { medium } } }`),

    getUserCollection: (userId) => API.call(
      `query($u:Int){MediaListCollection(userId:$u,type:ANIME){lists{entries{id mediaId status score progress media{id episodes title{romaji english}}}}}}`,
      { u: userId }
    ),

    saveEntry: (args) => API.call(
      `mutation($mediaId:Int,$status:MediaListStatus,$progress:Int,$startedAt:FuzzyDateInput,$completedAt:FuzzyDateInput){
        SaveMediaListEntry(mediaId:$mediaId,status:$status,progress:$progress,startedAt:$startedAt,completedAt:$completedAt){
          id mediaId status score progress startedAt{year month day} completedAt{year month day}
        }
      }`,
      args
    ),

    deleteEntry: (id) => API.call(`mutation($id:Int){DeleteMediaListEntry(id:$id){deleted}}`, { id })
  };

  // ==========================================================================
  // 3. UI & STYLES
  // ==========================================================================
  const UI = {
    initStyles() {
      if (document.getElementById("al-friend-styles")) return;
      document.head.insertAdjacentHTML("beforeend", `<style id="al-friend-styles">
        /* Elevated card context when menu is open */
        .al-card-open {
          overflow: visible !important;
          z-index: 999999 !important;
        }

        /* Floating Bottom Toolbar */
        .al-friend-bar {
          position: fixed;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          background: #111a26 !important;
          border: 1.5px solid #2a3d54;
          box-shadow: 0 12px 36px rgba(0,0,0,0.85);
          border-radius: 30px;
          padding: 8px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 99990;
          font-family: inherit;
        }
        .al-friend-bar b { color: #fff; }
        .al-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid #3db4f2;
          display: inline-block;
          vertical-align: middle;
          flex-shrink: 0;
        }
        .al-filter-label { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #e2e8f0; cursor: pointer; user-select: none; font-weight: 600; }
        .al-filter-label input { cursor: pointer; width: 15px; height: 15px; accent-color: #3db4f2; }
        .al-select {
          background: #0b1622 !important;
          color: #fff !important;
          border: 1.5px solid #3db4f2 !important;
          border-radius: 6px !important;
          padding: 5px 8px;
          font-size: 12px;
          font-weight: 700;
          outline: none;
          cursor: pointer;
        }

        /* Single Contiguous Split Button Component */
        .al-split-box {
          display: inline-flex !important;
          align-items: stretch !important;
          border-radius: 6px !important;
          overflow: visible !important;
          position: relative !important;
          z-index: 10;
          height: 26px !important;
          min-height: 26px !important;
          box-sizing: border-box !important;
          border: 1.5px solid transparent;
        }
        .al-split-box.is-open {
          z-index: 999999 !important;
        }

        /* In Grid View: compact floating pill over the top-right corner of the anime cover image */
        .entry-card, .media-card, .entry-card .cover, .media-card .cover {
          position: relative !important;
        }
        .entry-card:hover .cover img,
        .media-card:hover .cover img {
          transform: scale(1.04);
          transition: transform 0.25s ease;
        }

        .entry-card .al-split-box,
        .media-card .al-split-box,
        .entry-card .cover .al-split-box,
        .cover .al-split-box {
          position: absolute !important;
          top: 8px !important;
          right: 8px !important;
          bottom: auto !important;
          left: auto !important;
          width: auto !important;
          max-width: calc(100% - 16px) !important;
          margin: 0 !important;
          height: 22px !important;
          min-height: 22px !important;
          border-radius: 4px !important;
          backdrop-filter: blur(8px) !important;
          box-shadow: 0 4px 14px rgba(0,0,0,0.8) !important;
          z-index: 99999 !important;
          pointer-events: auto !important;
          transition: opacity 0.2s ease !important;
        }

        /* Buttons in Grid View: always visible if already in list (.is-added), but on-hover for unadded */
        .entry-card .al-split-box.is-added,
        .media-card .al-split-box.is-added {
          opacity: 1 !important;
          pointer-events: auto !important;
        }

        @media (hover: hover) {
          .entry-card .al-split-box:not(.is-added),
          .media-card .al-split-box:not(.is-added) {
            opacity: 0;
            pointer-events: none;
          }
          .entry-card:hover .al-split-box:not(.is-added),
          .media-card:hover .al-split-box:not(.is-added),
          .entry-card .al-split-box.is-open,
          .media-card .al-split-box.is-open {
            opacity: 1 !important;
            pointer-events: auto !important;
          }
        }

        .entry-card .al-btn-main,
        .media-card .al-btn-main {
          font-size: 10px !important;
          padding: 0 6px !important;
          height: 19px !important;
          line-height: 19px !important;
        }
        .entry-card .al-btn-arrow,
        .media-card .al-btn-arrow {
          width: 18px !important;
          flex: 0 0 18px !important;
          font-size: 8px !important;
          height: 19px !important;
          line-height: 19px !important;
        }

        /* In Table View: placed directly after the anime title link */
        .title .al-split-box {
          display: inline-flex !important;
          margin-left: 8px !important;
          vertical-align: middle !important;
          height: 22px !important;
          min-height: 22px !important;
          width: auto !important;
        }
        .title .al-split-box .al-btn-main {
          font-size: 10px !important;
          padding: 0 7px !important;
        }
        .title .al-split-box .al-btn-arrow {
          width: 20px !important;
          flex: 0 0 20px !important;
          font-size: 9px !important;
        }

        /* Left Main Action Button */
        .al-btn-main {
          flex: 1 1 auto;
          background: transparent !important;
          color: inherit !important;
          border: none !important;
          border-right: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 4px 0 0 4px !important;
          padding: 0 8px !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          cursor: pointer;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 4px;
          height: 100% !important;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          transition: background 0.15s;
          text-decoration: none !important;
        }
        .al-btn-main:hover {
          background: rgba(255, 255, 255, 0.12) !important;
        }

        /* Right Dropdown Toggle Arrow */
        .al-btn-arrow {
          flex: 0 0 24px !important;
          width: 24px !important;
          background: transparent !important;
          color: inherit !important;
          border: none !important;
          border-radius: 0 4px 4px 0 !important;
          font-size: 10px !important;
          font-weight: 900 !important;
          cursor: pointer;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 100% !important;
          transition: background 0.15s;
          padding: 0 !important;
        }
        .al-btn-arrow:hover {
          background: rgba(255, 255, 255, 0.15) !important;
        }

        /* Dropdown Menu (Color-coded) */
        .al-stat-drop {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          background: #0e1622 !important;
          border: 1.5px solid #2a3d54;
          border-radius: 8px;
          box-shadow: 0 12px 36px rgba(0,0,0,0.95);
          z-index: 999999 !important;
          min-width: 165px;
          display: none;
          flex-direction: column;
          overflow: hidden;
          padding: 4px;
          gap: 2px;
          box-sizing: border-box;
        }
        .al-stat-drop.show {
          display: flex !important;
        }

        .al-drop-opt {
          background: #111a26 !important;
          border: 1px solid transparent !important;
          border-radius: 5px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 700;
          text-align: left;
          color: #f1f5f9 !important;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          transition: all 0.12s ease;
          box-sizing: border-box;
        }
        .al-drop-opt:hover {
          border-color: #3db4f2 !important;
          background: #192738 !important;
        }
        .al-drop-opt .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }

        .al-drop-del {
          color: #f87171 !important;
          border-top: 1px solid #2a3d54 !important;
          margin-top: 2px;
        }
        .al-drop-del:hover {
          background: #331518 !important;
          border-color: #ef4444 !important;
        }

        /* Toast Notifications */
        .al-toast {
          position: fixed;
          bottom: 85px;
          left: 50%;
          transform: translateX(-50%);
          background: #0e1a29;
          color: #fff;
          border: 1.5px solid #3db4f2;
          border-left: 5px solid #3db4f2;
          padding: 10px 20px;
          border-radius: 8px;
          z-index: 1000000;
          font-weight: 700;
          font-size: 13px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.85);
          pointer-events: none;
        }
        .al-toast.alert { border-color: #ef4444; border-left-color: #ef4444; }

        /* Modal */
        .al-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999999; }
        .al-modal { background: #111a26; border: 1.5px solid #2a3d54; border-radius: 12px; width: 90%; max-width: 420px; padding: 20px; color: #fff; }

        .al-card-hidden { display: none !important; }

        @media (max-width: 768px) {
          .al-friend-bar {
            width: calc(100% - 24px);
            max-width: 420px;
            bottom: 12px;
            padding: 8px 12px;
            gap: 8px;
            justify-content: space-between;
            border-radius: 16px;
          }
          .al-friend-bar span { font-size: 11px; }
          .al-filter-label { font-size: 11px; }
          .al-select { font-size: 11px; padding: 3px 6px; }
        }
      </style>`);
    },

    toast(text, isAlert = false) {
      document.querySelectorAll(".al-toast").forEach(el => el.remove());
      const el = document.createElement("div");
      el.className = `al-toast ${isAlert ? "alert" : ""}`;
      el.innerText = text;
      document.body.appendChild(el);
      setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity 0.3s"; setTimeout(() => el.remove(), 300); }, 2000);
    },

    openTokenModal() {
      document.getElementById("al-modal")?.remove();
      const wrap = document.createElement("div");
      wrap.id = "al-modal";
      wrap.className = "al-overlay";
      wrap.innerHTML = `
        <div class="al-modal">
          <h3 style="margin:0 0 12px;color:#3db4f2;font-size:17px;">🔑 Connect AniList</h3>
          <p style="font-size:13px;color:#9fadbd;margin-bottom:12px;">Authorize the app to sync with your AniList account:</p>
          <div style="background:rgba(61,180,242,0.12);border:1px solid rgba(61,180,242,0.3);border-radius:8px;padding:10px;margin-bottom:12px;">
            <a href="${API.oauthUrl}" target="_blank" rel="noopener noreferrer" style="color:#3db4f2;font-size:13px;font-weight:700;text-decoration:none;">
              🔗 Open AniList OAuth Authorization
            </a>
            <div style="font-size:11px;color:#94a3b8;margin-top:4px;">Click "Authorize" and copy the generated access token.</div>
          </div>
          <input type="password" id="al-tok-in" placeholder="Paste access token here..." value="${Storage.get("anilist_token") || ""}" style="width:100%;box-sizing:border-box;background:#080d14;border:1px solid #202f43;border-radius:6px;padding:8px 10px;color:#fff;outline:none;" />
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
            <button type="button" id="al-m-cancel" style="background:#1c2838;color:#fff;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;">Cancel</button>
            <button type="button" id="al-m-ok" style="background:#3db4f2;color:#0b1622;border:none;border-radius:6px;padding:6px 16px;font-weight:700;cursor:pointer;">Save</button>
          </div>
        </div>`;
      document.body.appendChild(wrap);
      wrap.querySelector("#al-m-cancel").onclick = () => wrap.remove();
      wrap.querySelector("#al-m-ok").onclick = async () => {
        const val = wrap.querySelector("#al-tok-in").value.trim();
        if (val) {
          Storage.set("anilist_token", val);
          UI.toast("Token saved!");
          wrap.remove();
          await App.initUser();
        }
      };
    }
  };

  // ==========================================================================
  // 4. APP CORE
  // ==========================================================================
  let currentUser = null;
  let userEntries = new Map(); // mediaId -> entry
  let hideAlreadyAdded = false;

  const App = {
    getDefaultAction() {
      return Storage.get("al_default_action") || "PLANNING";
    },

    setDefaultAction(status) {
      Storage.set("al_default_action", status);
    },

    getPageUsername() {
      const match = window.location.pathname.match(/\/user\/([^\/]+)\/animelist/i);
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

      const viewerData = await API.getViewer();
      if (!viewerData?.Viewer) {
        App.renderFloatingBar();
        return;
      }

      currentUser = viewerData.Viewer;

      // Do not activate on your own list
      if (!App.isFriendList()) {
        document.getElementById("al-friend-bar")?.remove();
        return;
      }

      // Single GraphQL batch call to load viewer's collection
      const listData = await API.getUserCollection(currentUser.id);
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
      document.querySelectorAll(".al-split-box, #al-friend-bar").forEach(el => el.remove());
    },

    // Bottom floating toolbar with Default Action selector
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
        bar.querySelector("#al-bar-login").onclick = () => UI.openTokenModal();
        return;
      }

      const defAct = App.getDefaultAction();

      bar.innerHTML = `
        <span style="display:inline-flex;align-items:center;gap:7px;">
          <img src="${currentUser.avatar?.medium || 'https://anilist.co/img/icons/icon.svg'}" class="al-avatar" alt="${currentUser.name}" />
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
            ${Object.entries(STATUS_CONFIG).map(([k, cfg]) => `
              <option value="${k}" ${defAct === k ? "selected" : ""}>${cfg.name}</option>
            `).join("")}
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
        UI.toast(`Default action: ${cfg.name}`);

        // Update all unadded buttons with new default status & colors
        document.querySelectorAll(".al-split-box:not(.is-added)").forEach(box => {
          App.applyButtonTheme(box, newAct, false);
        });
      };
    },

    applyVisibilityFilter() {
      document.querySelectorAll("[data-al-media-id]").forEach(card => {
        const mediaId = parseInt(card.getAttribute("data-al-media-id"));
        const exists = userEntries.has(mediaId);
        card.classList.toggle("al-card-hidden", hideAlreadyAdded && exists);
      });
    },

    // Applies status color theme to a split box component
    applyButtonTheme(box, statusKey, isAdded) {
      const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.PLANNING;
      const mainBtn = box.querySelector(".al-btn-main");
      const arrowBtn = box.querySelector(".al-btn-arrow");
      if (!mainBtn || !arrowBtn) return;

      box.classList.toggle("is-added", isAdded);

      // Solid color theme directly on the split box itself (no outer transparent wrapper!)
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

    // Save anime without modifying the global default action
    async handleSave(mediaId, status, totalEpisodes = null) {
      const isCompleted = status === "COMPLETED";
      const params = {
        mediaId: mediaId,
        status: status,
        progress: isCompleted ? (totalEpisodes || 0) : undefined
      };

      if (isCompleted) {
        params.completedAt = today();
        params.startedAt = today();
      }

      const res = await API.saveEntry(params);
      if (res?.SaveMediaListEntry) {
        userEntries.set(mediaId, res.SaveMediaListEntry);
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PLANNING;
        UI.toast(`✓ Added as ${cfg.name}!`);

        // Targeted DOM update
        const card = document.querySelector(`[data-al-media-id="${mediaId}"]`);
        if (card) {
          const box = card.querySelector(".al-split-box");
          if (box) App.applyButtonTheme(box, status, true);
          if (hideAlreadyAdded) card.classList.add("al-card-hidden");
        }
      }
    },

    // Remove anime from personal list
    async handleDelete(mediaId, entryId) {
      if (confirm("Remove this anime from your AniList?")) {
        const res = await API.deleteEntry(entryId);
        if (res?.DeleteMediaListEntry?.deleted) {
          userEntries.delete(mediaId);
          UI.toast("Anime removed from your list");

          // Reset button to unadded default state
          const card = document.querySelector(`[data-al-media-id="${mediaId}"]`);
          if (card) {
            const box = card.querySelector(".al-split-box");
            if (box) App.applyButtonTheme(box, App.getDefaultAction(), false);
            card.classList.remove("al-card-hidden");
          }
        }
      }
    },

    // Enhance card or row: creates split button ONCE (never clobbers during polling!)
    enhanceEntry(container, mediaId, totalEpisodes) {
      container.setAttribute("data-al-media-id", mediaId);

      // CRITICAL: If button already exists, DO NOT RECREATE IT!
      if (container.querySelector(".al-split-box")) return;

      const existing = userEntries.get(mediaId);
      const isAdded = !!existing;
      const defAct = App.getDefaultAction();
      const currentStatus = isAdded ? existing.status : defAct;

      const box = document.createElement("div");
      box.className = `al-split-box ${isAdded ? "is-added" : ""}`;

      // Prevent card click navigation or drag handlers from hijacking clicks
      box.onclick = (e) => e.stopPropagation();
      box.onmousedown = (e) => e.stopPropagation();

      box.innerHTML = `
        <button type="button" class="al-btn-main"></button>
        <button type="button" class="al-btn-arrow" title="Change status">▾</button>
        <div class="al-stat-drop">
          ${Object.entries(STATUS_CONFIG).map(([k, cfg]) => `
            <button type="button" class="al-drop-opt" data-status="${k}">
              <span class="dot" style="background:${cfg.dot}"></span>
              <span>${cfg.name}</span>
            </button>
          `).join("")}
          <button type="button" class="al-drop-opt al-drop-del" data-del="1" style="display:${isAdded ? 'flex' : 'none'};">
            <span>🗑️ Remove from list</span>
          </button>
        </div>`;

      App.applyButtonTheme(box, currentStatus, isAdded);

      const drop = box.querySelector(".al-stat-drop");
      const arrowBtn = box.querySelector(".al-btn-arrow");
      const mainBtn = box.querySelector(".al-btn-main");

      const toggleDropdown = (forceState) => {
        const willOpen = forceState !== undefined ? forceState : !drop.classList.contains("show");
        document.querySelectorAll(".al-stat-drop").forEach(d => d.classList.remove("show"));
        document.querySelectorAll(".al-split-box").forEach(b => b.classList.remove("is-open"));
        document.querySelectorAll(".al-card-open").forEach(c => c.classList.remove("al-card-open"));

        if (willOpen) {
          drop.classList.add("show");
          box.classList.add("is-open");
          container.classList.add("al-card-open");
        }
      };

      // Arrow click opens dropdown
      arrowBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleDropdown();
      };

      // Main button click:
      // If not added: quick-add with default action!
      // If already added: toggle dropdown to change status!
      mainBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!userEntries.has(mediaId)) {
          App.handleSave(mediaId, App.getDefaultAction(), totalEpisodes);
        } else {
          toggleDropdown();
        }
      };

      // Dropdown option click
      drop.querySelectorAll("button[data-status]").forEach(btn => {
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

      // Append into DOM:
      // If it's Grid View (.entry-card): append directly to card container at top-right (z-index 99999), completely independent of cover and title!
      // If it's Table View (.entry.row, .list-table): append inside title cell after the link.
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

    // Scans DOM ONLY for un-enhanced cards
    scanAndEnhanceDOM() {
      if (!App.isFriendList() || !currentUser) return;

      const links = document.querySelectorAll('a[href*="/anime/"]');
      links.forEach(link => {
        const href = link.getAttribute("href");
        const match = href.match(/\/anime\/(\d+)/);
        if (!match) return;

        const mediaId = parseInt(match[1]);
        const card = link.closest(".entry-card, .media-card, .entry, .row");
        // Only enhance if not already enhanced!
        if (card && !card.querySelector(".al-split-box")) {
          let totalEp = null;
          const epText = card.innerText;
          const epMatch = epText.match(/\/\s*(\d+)/);
          if (epMatch) totalEp = parseInt(epMatch[1]);

          App.enhanceEntry(card, mediaId, totalEp);
        }
      });
    },

    init() {
      UI.initStyles();
      App.initUser();

      // Close dropdowns on outside click
      document.addEventListener("click", () => {
        document.querySelectorAll(".al-stat-drop").forEach(d => d.classList.remove("show"));
        document.querySelectorAll(".al-split-box").forEach(b => b.classList.remove("is-open"));
        document.querySelectorAll(".al-card-open").forEach(c => c.classList.remove("al-card-open"));
      });

      // SPA navigation and virtual scroll polling (only scans new items, never mutates open ones)
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
})();
