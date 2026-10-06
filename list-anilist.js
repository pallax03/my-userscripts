// ==UserScript==
// @name         AniList Friend List - Quick Add & Sync
// @namespace    https://github.com/pallax03/my-userscripts
// @version      1.1.0
// @description  Easily add and sync anime from a friend's AniList list directly into your own collection with native browser dropdowns and default action selection
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

  // Status mapping identical to manage-anilist.js
  const STATUSES = {
    PLANNING: "Plan to Watch",
    CURRENT: "Watching",
    COMPLETED: "Completed",
    PAUSED: "Paused",
    DROPPED: "Dropped",
    REPEATING: "Rewatching"
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
  // 3. UI & STYLES (Solid Opaque Contrast & Native Selects)
  // ==========================================================================
  const UI = {
    initStyles() {
      if (document.getElementById("al-friend-styles")) return;
      document.head.insertAdjacentHTML("beforeend", `<style id="al-friend-styles">
        :root {
          --al-blue: #3db4f2;
          --al-blue-bg: #15273d;
          --al-green: #22c55e;
          --al-green-bg: #112d20;
          --al-surface: #111a26;
          --al-border: #2a3d54;
        }

        /* Floating Bottom Toolbar */
        .al-friend-bar {
          position: fixed;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--al-surface) !important;
          border: 1.5px solid var(--al-border);
          box-shadow: 0 12px 36px rgba(0,0,0,0.85);
          border-radius: 30px;
          padding: 8px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 99990;
          font-family: inherit;
        }
        .al-friend-bar span { font-size: 13px; color: #9fadbd; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
        .al-friend-bar b { color: #fff; }
        .al-filter-label { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #e2e8f0; cursor: pointer; user-select: none; font-weight: 600; }
        .al-filter-label input { cursor: pointer; width: 15px; height: 15px; accent-color: var(--al-blue); }

        /* Native Select Dropdown in Toolbar */
        .al-select {
          background: #0b1622 !important;
          color: #fff !important;
          border: 1.5px solid var(--al-blue) !important;
          border-radius: 6px !important;
          padding: 5px 8px;
          font-size: 12px;
          font-weight: 700;
          outline: none;
          cursor: pointer;
        }
        .al-select option { background: #0e1622; color: #fff; }

        /* Contiguous Unified Split Button Component */
        .al-split-btn {
          display: flex;
          align-items: stretch;
          width: 100%;
          box-sizing: border-box;
          margin-top: 6px;
          border-radius: 6px;
          border: 1.5px solid var(--al-blue);
          background: var(--al-blue-bg);
          overflow: hidden;
          transition: border-color 0.15s, background 0.15s;
          position: relative;
          z-index: 5;
        }

        /* Left Main Action Button */
        .al-btn-action {
          flex: 1;
          background: transparent !important;
          color: var(--al-blue) !important;
          border: none !important;
          border-right: 1.5px solid var(--al-blue) !important;
          padding: 6px 8px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          min-height: 32px;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          transition: background 0.15s, color 0.15s;
          text-decoration: none !important;
        }
        .al-btn-action:hover {
          background: var(--al-blue) !important;
          color: #0b1622 !important;
        }

        /* Right Arrow Dropdown Box (Integrated into same component) */
        .al-arrow-box {
          position: relative;
          width: 32px;
          min-height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--al-blue);
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .al-arrow-box:hover {
          background: var(--al-blue);
          color: #0b1622;
        }
        .al-arrow-icon {
          pointer-events: none;
          font-size: 11px;
          font-weight: 900;
        }
        .al-native-sel {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          border: none;
        }
        .al-native-sel option {
          background: #0e1622;
          color: #fff;
          font-size: 13px;
        }

        /* Unified Split Button when ALREADY IN LIST (Green Solid Theme) */
        .al-split-btn.is-added {
          border-color: var(--al-green);
          background: var(--al-green-bg);
        }
        .al-split-btn.is-added .al-btn-action {
          color: #4ade80 !important;
          border-right-color: var(--al-green) !important;
        }
        .al-split-btn.is-added .al-btn-action:hover {
          background: var(--al-green) !important;
          color: #0b1622 !important;
        }
        .al-split-btn.is-added .al-arrow-box {
          color: #4ade80;
        }
        .al-split-btn.is-added .al-arrow-box:hover {
          background: var(--al-green);
          color: #0b1622;
        }

        /* Toast Notifications */
        .al-toast {
          position: fixed;
          bottom: 85px;
          left: 50%;
          transform: translateX(-50%);
          background: #0e1a29;
          color: #fff;
          border: 1.5px solid var(--al-blue);
          border-left: 5px solid var(--al-blue);
          padding: 10px 20px;
          border-radius: 8px;
          z-index: 1000000;
          font-weight: 700;
          font-size: 13px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.85);
          pointer-events: none;
        }
        .al-toast.alert { border-color: #ef4444; border-left-color: #ef4444; }

        /* Modal Overlay */
        .al-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999999; }
        .al-modal { background: #111a26; border: 1.5px solid var(--al-border); border-radius: 12px; width: 90%; max-width: 420px; padding: 20px; color: #fff; }

        .al-card-hidden { display: none !important; }

        /* Mobile Viewport */
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
          .al-btn-add { font-size: 11px; padding: 4px 6px; min-height: 30px; }
          .al-native-quick-sel { font-size: 11px; min-height: 30px; }
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
          <h3 style="margin:0 0 12px;color:var(--al-blue);font-size:17px;">🔑 Connect AniList</h3>
          <p style="font-size:13px;color:#9fadbd;margin-bottom:12px;">Authorize the app to sync with your AniList account:</p>
          <div style="background:rgba(61,180,242,0.12);border:1px solid rgba(61,180,242,0.3);border-radius:8px;padding:10px;margin-bottom:12px;">
            <a href="${API.oauthUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--al-blue);font-size:13px;font-weight:700;text-decoration:none;">
              🔗 Open AniList OAuth Authorization
            </a>
            <div style="font-size:11px;color:#94a3b8;margin-top:4px;">Click "Authorize" and copy the generated access token.</div>
          </div>
          <input type="password" id="al-tok-in" placeholder="Paste access token here..." value="${Storage.get("anilist_token") || ""}" style="width:100%;box-sizing:border-box;background:#080d14;border:1px solid #202f43;border-radius:6px;padding:8px 10px;color:#fff;outline:none;" />
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
            <button type="button" id="al-m-cancel" style="background:#1c2838;color:#fff;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;">Cancel</button>
            <button type="button" id="al-m-ok" style="background:var(--al-blue);color:#0b1622;border:none;border-radius:6px;padding:6px 16px;font-weight:700;cursor:pointer;">Save</button>
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
      document.querySelectorAll(".al-actions-wrap, #al-friend-bar").forEach(el => el.remove());
    },

    // Bottom floating toolbar with native select for Default Action
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
          <button type="button" id="al-bar-login" style="background:var(--al-blue);color:#0b1622;border:none;border-radius:15px;padding:5px 14px;font-size:12px;font-weight:700;cursor:pointer;">Connect AniList</button>`;
        bar.querySelector("#al-bar-login").onclick = () => UI.openTokenModal();
        return;
      }

      const defAct = App.getDefaultAction();

      bar.innerHTML = `
        <span>👤 <b>${currentUser.name}</b></span>
        <span style="color:var(--al-border);">|</span>
        <label class="al-filter-label" id="al-filter-toggle">
          <input type="checkbox" id="al-hide-chk" ${hideAlreadyAdded ? "checked" : ""}>
          <span>Hide in my list</span>
        </label>
        <span style="color:var(--al-border);">|</span>
        <label style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#cbd5e1;font-weight:600;">
          <span>Default action:</span>
          <select class="al-select" id="al-default-sel">
            ${Object.entries(STATUSES).map(([k, v]) => `
              <option value="${k}" ${defAct === k ? "selected" : ""}>${v}</option>
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
        UI.toast(`Default action: ${STATUSES[newAct] || newAct}`);

        // Update all unadded buttons dynamically
        document.querySelectorAll(".al-split-btn:not(.is-added)").forEach(box => {
          const btn = box.querySelector(".al-btn-action");
          if (btn) btn.innerText = `➕ Add (${STATUSES[newAct]})`;
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
        UI.toast(`✓ Added as ${STATUSES[status] || status}!`);
        App.scanAndEnhanceDOM();
      }
    },

    // Remove anime from personal list
    async handleDelete(mediaId, entryId) {
      if (confirm("Remove this anime from your AniList?")) {
        const res = await API.deleteEntry(entryId);
        if (res?.DeleteMediaListEntry?.deleted) {
          userEntries.delete(mediaId);
          UI.toast("Anime removed from your list");
          App.scanAndEnhanceDOM();
        }
      }
    },

    // Enhance card or row using unified split button with integrated native select
    enhanceEntry(container, mediaId, totalEpisodes) {
      container.setAttribute("data-al-media-id", mediaId);
      const existing = userEntries.get(mediaId);
      const isAdded = !!existing;
      const defAct = App.getDefaultAction();

      let box = container.querySelector(".al-split-btn");

      const buildHtml = () => {
        if (!isAdded) {
          return `
            <button type="button" class="al-btn-action" title="Quick add as ${STATUSES[defAct]}">
              ➕ Add (${STATUSES[defAct]})
            </button>
            <div class="al-arrow-box" title="Select specific status">
              <span class="al-arrow-icon">▾</span>
              <select class="al-native-sel">
                <option value="" disabled selected></option>
                ${Object.entries(STATUSES).map(([k, v]) => `
                  <option value="${k}">${v}</option>
                `).join("")}
              </select>
            </div>`;
        } else {
          return `
            <button type="button" class="al-btn-action" title="Current status (click to change)">
              ✓ ${STATUSES[existing.status] || existing.status}
            </button>
            <div class="al-arrow-box" title="Change status or remove">
              <span class="al-arrow-icon">▾</span>
              <select class="al-native-sel">
                ${Object.entries(STATUSES).map(([k, v]) => `
                  <option value="${k}" ${existing.status === k ? "selected" : ""}>${v}</option>
                `).join("")}
                <option value="DELETE" style="color:#f87171;">🗑️ Remove from list</option>
              </select>
            </div>`;
        }
      };

      if (box) {
        box.className = `al-split-btn ${isAdded ? "is-added" : ""}`;
        box.innerHTML = buildHtml();
      } else {
        box = document.createElement("div");
        box.className = `al-split-btn ${isAdded ? "is-added" : ""}`;
        box.innerHTML = buildHtml();

        const titleEl = container.querySelector(".title, .title a, a.title") || container;
        if (container.classList.contains("entry-card") || container.querySelector(".cover")) {
          container.appendChild(box);
        } else {
          titleEl.after(box);
        }
      }

      // Event Listeners on unified component
      const actionBtn = box.querySelector(".al-btn-action");
      const nativeSel = box.querySelector(".al-native-sel");

      if (actionBtn && nativeSel) {
        actionBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isAdded) {
            App.handleSave(mediaId, App.getDefaultAction(), totalEpisodes);
          } else {
            if (typeof nativeSel.showPicker === "function") {
              nativeSel.showPicker();
            } else {
              nativeSel.focus();
              nativeSel.click();
            }
          }
        };

        nativeSel.onchange = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const chosen = e.target.value;
          if (chosen === "DELETE") {
            App.handleDelete(mediaId, existing?.id);
          } else if (chosen && (!existing || chosen !== existing.status)) {
            App.handleSave(mediaId, chosen, totalEpisodes);
          }
        };
      }

      // Filter visibility
      if (hideAlreadyAdded && isAdded) {
        container.classList.add("al-card-hidden");
      } else {
        container.classList.remove("al-card-hidden");
      }
    },

    // Scan DOM for anime cards and table rows
    scanAndEnhanceDOM() {
      if (!App.isFriendList() || !currentUser) return;

      const links = document.querySelectorAll('a[href*="/anime/"]');
      links.forEach(link => {
        const href = link.getAttribute("href");
        const match = href.match(/\/anime\/(\d+)/);
        if (!match) return;

        const mediaId = parseInt(match[1]);
        const card = link.closest(".entry-card, .media-card, .entry, .row");
        if (card) {
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

      // SPA navigation and virtual scroll polling
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
