// ==UserScript==
// @name         AniList Friend List - 1-Click Quick Add
// @namespace    https://github.com/pallax03/my-userscripts
// @version      1.0.0
// @description  Aggiungi facilmente gli anime dalla lista di un amico alla tua collezione su AniList con memoria dell'ultima azione e filtro QoL
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
  // 1. STORAGE & HELPERS (KISS)
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

  const STATUS_META = {
    PLANNING: { label: "Pianifica", full: "Plan to Watch", icon: "📌", color: "#3db4f2" },
    CURRENT: { label: "In corso", full: "Watching", icon: "👁️", color: "#22c55e" },
    COMPLETED: { label: "Completato", full: "Completed", icon: "🎉", color: "#a855f7" },
    PAUSED: { label: "In pausa", full: "Paused", icon: "⏸️", color: "#eab308" },
    DROPPED: { label: "Abbandonato", full: "Dropped", icon: "⏹️", color: "#ef4444" }
  };

  // Supporto login rapido via URL (?al_token=...)
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
            UI.toast("Token AniList non valido o scaduto!", true);
            App.logout();
            return null;
          }
          throw new Error(errors[0].message);
        }
        return data;
      } catch (err) {
        UI.toast("Errore: " + (err.message || "Network"), true);
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
  // 3. UI & STYLES (AniList Dark Theme Integration)
  // ==========================================================================
  const UI = {
    initStyles() {
      if (document.getElementById("al-friend-styles")) return;
      document.head.insertAdjacentHTML("beforeend", `<style id="al-friend-styles">
        :root { --al-blue: #3db4f2; --al-dark: #0b1622; --al-surface: #152232; --al-border: rgba(255,255,255,0.12); }
        
        /* Floating / Sticky Toolbar */
        .al-friend-bar { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #111a26; border: 1px solid var(--al-border); box-shadow: 0 10px 30px rgba(0,0,0,0.7); border-radius: 30px; padding: 8px 18px; display: flex; align-items: center; gap: 14px; z-index: 9999; backdrop-filter: blur(8px); }
        .al-friend-bar span { font-size: 13px; color: #9fadbd; font-weight: 600; display: flex; align-items: center; gap: 6px; }
        .al-friend-bar b { color: #fff; }
        .al-filter-label { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #cbd5e1; cursor: pointer; user-select: none; }
        .al-filter-label input { cursor: pointer; accent-color: var(--al-blue); }

        /* Split Button */
        .al-split-box { display: inline-flex; align-items: center; position: relative; z-index: 10; margin-top: 6px; font-family: Overpass,-apple-system,BlinkMacSystemFont,Segoe UI,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue,sans-serif; }
        .al-btn-main { background: rgba(61,180,242,0.15); color: var(--al-blue)!important; border: 1px solid rgba(61,180,242,0.4); border-radius: 6px 0 0 6px; padding: 4px 8px; font-size: 11px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; line-height: 1.4; transition: all 0.2s; white-space: nowrap; }
        .al-btn-main:hover { background: rgba(61,180,242,0.3); color: #fff!important; }
        .al-btn-arrow { background: rgba(61,180,242,0.15); color: var(--al-blue)!important; border: 1px solid rgba(61,180,242,0.4); border-left: none; border-radius: 0 6px 6px 0; padding: 4px 6px; font-size: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s; line-height: 1.4; }
        .al-btn-arrow:hover { background: rgba(61,180,242,0.3); color: #fff!important; }

        /* Stile quando già presente in lista */
        .al-split-box.is-added .al-btn-main { background: rgba(34,197,94,0.15); color: #4ade80!important; border-color: rgba(34,197,94,0.4); }
        .al-split-box.is-added .al-btn-arrow { background: rgba(34,197,94,0.15); color: #4ade80!important; border-color: rgba(34,197,94,0.4); }

        /* Dropdown menu stati */
        .al-stat-drop { position: absolute; top: calc(100% + 4px); left: 0; background: #0e1622; border: 1px solid var(--al-border); border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.8); z-index: 1000; min-width: 140px; display: none; flex-direction: column; overflow: hidden; padding: 4px 0; }
        .al-stat-drop.show { display: flex; }
        .al-stat-drop button { background: transparent; border: none; padding: 6px 12px; font-size: 12px; font-weight: 600; text-align: left; color: #cbd5e1; cursor: pointer; display: flex; align-items: center; gap: 8px; width: 100%; transition: background 0.15s; }
        .al-stat-drop button:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .al-stat-drop .del-opt { color: #f87171; border-top: 1px solid var(--al-border); margin-top: 4px; padding-top: 6px; }

        /* Toast notification */
        .al-toast { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: #102538; color: #fff; border-left: 4px solid var(--al-blue); padding: 10px 18px; border-radius: 8px; z-index: 100000; font-weight: 600; font-size: 13px; box-shadow: 0 8px 24px rgba(0,0,0,0.6); pointer-events: none; }
        .al-toast.alert { border-left-color: #ef4444; }

        /* Modale Token */
        .al-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 99999; }
        .al-modal { background: #111a26; border: 1px solid var(--al-border); border-radius: 12px; width: 90%; max-width: 420px; padding: 20px; color: #fff; }

        /* Card nascosta dal filtro */
        .al-card-hidden { display: none !important; }
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
          <h3 style="margin:0 0 12px;color:var(--al-blue);font-size:17px;">🔑 Connetti AniList</h3>
          <p style="font-size:13px;color:#9fadbd;margin-bottom:12px;">Autorizza l'app per sincronizzare la lista:</p>
          <div style="background:rgba(61,180,242,0.12);border:1px solid rgba(61,180,242,0.3);border-radius:8px;padding:10px;margin-bottom:12px;">
            <a href="${API.oauthUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--al-blue);font-size:13px;font-weight:700;text-decoration:none;">
              🔗 Apri Autorizzazione OAuth AniList
            </a>
            <div style="font-size:11px;color:#94a3b8;margin-top:4px;">Clicca "Authorize" e copia il token restituito.</div>
          </div>
          <input type="password" id="al-tok-in" placeholder="Incolla il token qui..." value="${Storage.get("anilist_token") || ""}" style="width:100%;box-sizing:border-box;background:#080d14;border:1px solid #202f43;border-radius:6px;padding:8px 10px;color:#fff;outline:none;" />
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
            <button type="button" id="al-m-cancel" style="background:#1c2838;color:#fff;border:none;border-radius:6px;padding:6px 14px;cursor:pointer;">Annulla</button>
            <button type="button" id="al-m-ok" style="background:var(--al-blue);color:#0b1622;border:none;border-radius:6px;padding:6px 16px;font-weight:700;cursor:pointer;">Salva</button>
          </div>
        </div>`;
      document.body.appendChild(wrap);
      wrap.querySelector("#al-m-cancel").onclick = () => wrap.remove();
      wrap.querySelector("#al-m-ok").onclick = async () => {
        const val = wrap.querySelector("#al-tok-in").value.trim();
        if (val) {
          Storage.set("anilist_token", val);
          UI.toast("Token salvato!");
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
    getLastAction() {
      return Storage.get("al_last_action") || "PLANNING";
    },

    setLastAction(status) {
      Storage.set("al_last_action", status);
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

      // Se non siamo sulla lista di un amico, non serve caricare la collezione
      if (!App.isFriendList()) {
        document.getElementById("al-friend-bar")?.remove();
        return;
      }

      // Carica l'intera lista dell'utente in una sola query
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

    // Barra di controllo inferiore (stato utente, ultima azione e filtro "Nascondi già in lista")
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
          <span>🔑 Token non configurato</span>
          <button type="button" id="al-bar-login" style="background:var(--al-blue);color:#0b1622;border:none;border-radius:15px;padding:4px 12px;font-size:12px;font-weight:700;cursor:pointer;">Connetti AniList</button>`;
        bar.querySelector("#al-bar-login").onclick = () => UI.openTokenModal();
        return;
      }

      const lastAct = App.getLastAction();
      const meta = STATUS_META[lastAct] || STATUS_META.PLANNING;

      bar.innerHTML = `
        <span>👤 <b>${currentUser.name}</b></span>
        <span style="color:var(--al-border);">|</span>
        <label class="al-filter-label" id="al-filter-toggle">
          <input type="checkbox" id="al-hide-chk" ${hideAlreadyAdded ? "checked" : ""}>
          <span>Nascondi già in lista</span>
        </label>
        <span style="color:var(--al-border);">|</span>
        <span style="font-size:12px;">Azione default: <b>${meta.icon} ${meta.label}</b></span>`;

      bar.querySelector("#al-hide-chk").onchange = (e) => {
        hideAlreadyAdded = e.target.checked;
        App.applyVisibilityFilter();
      };
    },

    applyVisibilityFilter() {
      document.querySelectorAll("[data-al-media-id]").forEach(card => {
        const mediaId = parseInt(card.getAttribute("data-al-media-id"));
        const exists = userEntries.has(mediaId);
        card.classList.toggle("al-card-hidden", hideAlreadyAdded && exists);
      });
    },

    // Salva o aggiorna un anime nella lista personale
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
        App.setLastAction(status);
        UI.toast(`✓ Aggiunto a ${STATUS_META[status]?.full || status}!`);
        App.renderFloatingBar();
        App.scanAndEnhanceDOM();
      }
    },

    // Rimuove un anime dalla lista personale
    async handleDelete(mediaId, entryId) {
      if (confirm("Vuoi davvero rimuovere questo anime dalla tua lista?")) {
        const res = await API.deleteEntry(entryId);
        if (res?.DeleteMediaListEntry?.deleted) {
          userEntries.delete(mediaId);
          UI.toast("Serie rimossa dalla tua lista");
          App.scanAndEnhanceDOM();
        }
      }
    },

    // Inietta il pulsante intelligente su una card o riga
    enhanceEntry(container, mediaId, totalEpisodes) {
      container.setAttribute("data-al-media-id", mediaId);
      if (container.querySelector(".al-split-box")) return;

      const box = document.createElement("div");
      box.className = "al-split-box";

      const existing = userEntries.get(mediaId);
      const isAdded = !!existing;
      if (isAdded) box.classList.add("is-added");

      const lastAct = App.getLastAction();
      const meta = isAdded ? (STATUS_META[existing.status] || { label: existing.status, icon: "✓" }) : (STATUS_META[lastAct] || STATUS_META.PLANNING);

      const mainLabel = isAdded ? `✓ ${meta.label}` : `➕ ${meta.label}`;

      box.innerHTML = `
        <button type="button" class="al-btn-main" title="${isAdded ? 'Già presente: clicca per cambiare' : 'Aggiungi con ' + meta.label}">
          <span>${mainLabel}</span>
        </button>
        <button type="button" class="al-btn-arrow" title="Seleziona stato">▾</button>
        <div class="al-stat-drop">
          ${Object.entries(STATUS_META).map(([k, v]) => `
            <button type="button" data-status="${k}">${v.icon} ${v.full}</button>
          `).join("")}
          ${isAdded ? `<button type="button" class="del-opt" data-del="1">🗑️ Rimuovi dalla lista</button>` : ""}
        </div>`;

      // Click sul menu a tendina
      const drop = box.querySelector(".al-stat-drop");
      const arrow = box.querySelector(".al-btn-arrow");
      const mainBtn = box.querySelector(".al-btn-main");

      arrow.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll(".al-stat-drop").forEach(d => d !== drop && d.classList.remove("show"));
        drop.classList.toggle("show");
      };

      // Click sul pulsante principale: se non presente, esegue l'ultima azione con 1 click!
      // Se già presente, apre il menu per modificare
      mainBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAdded) {
          App.handleSave(mediaId, lastAct, totalEpisodes);
        } else {
          drop.classList.toggle("show");
        }
      };

      // Click sulle opzioni del dropdown
      drop.querySelectorAll("button[data-status]").forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          drop.classList.remove("show");
          const selStatus = btn.getAttribute("data-status");
          App.handleSave(mediaId, selStatus, totalEpisodes);
        };
      });

      const delBtn = drop.querySelector("button[data-del]");
      if (delBtn) {
        delBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          drop.classList.remove("show");
          App.handleDelete(mediaId, existing.id);
        };
      }

      // Inserimento nel DOM
      // Se è in modalità Grid (card), appendi sotto il titolo o dentro il content
      // Se è in modalità List (riga tabella), appendi nella colonna titolo o azioni
      const titleEl = container.querySelector(".title, .title a, a.title") || container;
      if (container.classList.contains("entry-card") || container.querySelector(".cover")) {
        // Grid Card
        container.appendChild(box);
      } else {
        // Table Row
        titleEl.after(box);
      }

      // Applica filtro se attivo
      if (hideAlreadyAdded && isAdded) {
        container.classList.add("al-card-hidden");
      }
    },

    // Trova tutte le card/righe dell'anime presenti nella pagina
    scanAndEnhanceDOM() {
      if (!App.isFriendList() || !currentUser) return;

      // 1. Grid Cards: .entry-card o container con link /anime/ID/
      const links = document.querySelectorAll('a[href*="/anime/"]');
      links.forEach(link => {
        const href = link.getAttribute("href");
        const match = href.match(/\/anime\/(\d+)/);
        if (!match) return;

        const mediaId = parseInt(match[1]);
        const card = link.closest(".entry-card, .media-card, .entry, .row");
        if (card && !card.querySelector(".al-split-box")) {
          // Cerca di identificare episodi massimi se presenti nel DOM
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

      // Chiudi dropdown al click esterno
      document.addEventListener("click", () => {
        document.querySelectorAll(".al-stat-drop").forEach(d => d.classList.remove("show"));
      });

      // Observer e polling per navigazione SPA e scroll virtuale di AniList
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
