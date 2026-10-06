// ==UserScript==
// @name         AnimeUnity to AniList Sync
// @namespace    https://github.com/
// @version      2.2.0
// @description  Sincronizzazione avanzata progresso, gestione lista e profilo AniList per AnimeUnity con QoL
// @author       Open Community
// @match        *://*.animeunity.so/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  // ==========================================
  // 1. STORAGE UNIFICATO (Condiviso & Cross-Script)
  // ==========================================
  const Storage = {
    KEYS: {
      TOKEN: "anilist_token",
      USER: "anilist_user",
      MANUAL_PREFIX: "al_manual_id_"
    },
    get(key) {
      try {
        if (typeof GM_getValue === "function") {
          const val = GM_getValue(key);
          if (val !== undefined && val !== null) return val;
        }
      } catch (_) {}
      return localStorage.getItem(key) || null;
    },
    set(key, value) {
      try {
        if (typeof GM_setValue === "function") GM_setValue(key, value);
      } catch (_) {}
      try {
        localStorage.setItem(key, value);
      } catch (_) {}
    },
    remove(key) {
      try {
        if (typeof GM_deleteValue === "function") GM_deleteValue(key);
      } catch (_) {}
      try {
        localStorage.removeItem(key);
      } catch (_) {}
    }
  };

  // Supporto configurazione rapida via parametro URL (?al_token=...)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("al_token")) {
    const rawToken = urlParams.get("al_token").trim();
    if (rawToken) {
      Storage.set(Storage.KEYS.TOKEN, rawToken);
      urlParams.delete("al_token");
      const cleanUrl = window.location.pathname + (urlParams.toString() ? "?" + urlParams.toString() : "") + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }

  // ==========================================
  // 2. CONFIGURAZIONE & COSTANTI
  // ==========================================
  const CONFIG = {
    apiUrl: "https://graphql.anilist.co",
    clientId: "43750",
    devSettingsUrl: "https://anilist.co/settings/developer",
    get oauthUrl() {
      return `https://anilist.co/api/v2/oauth/authorize?client_id=${this.clientId}&response_type=token`;
    },
    statuses: {
      CURRENT: "Watching",
      PLANNING: "Plan to Watch",
      COMPLETED: "Completed",
      DROPPED: "Dropped",
      PAUSED: "Paused",
      REPEATING: "Rewatching"
    }
  };

  let currentUser = null;
  let currentMedia = null;
  let currentTitle = "";
  let trackedProgress = -1;

  // ==========================================
  // 3. API GRAPHQL ANILIST
  // ==========================================
  const API = {
    async fetch(query, variables) {
      const token = Storage.get(Storage.KEYS.TOKEN);
      if (!token) return null;

      try {
        const res = await fetch(CONFIG.apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
          },
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
        UI.toast("Errore AniList: " + (err.message || "Network Timeout"), true);
        return null;
      }
    },

    async getViewer() {
      const data = await API.fetch(`query { Viewer { id name avatar { medium } siteUrl } }`);
      return data?.Viewer || null;
    },

    cleanTitle(title) {
      if (!title) return "";
      return title
        .replace(/\s*\((ITA|SUB|SUB ITA|DUB|ITA SUB|OVA)\)/gi, "")
        .replace(/\s+(ITA|SUB|DUB)$/gi, "")
        .replace(/\s+Season\s+\d+/gi, "")
        .trim();
    },

    getMediaBySearch(search) {
      return API.fetch(`query($search:String){Media(search:$search,type:ANIME){id title{romaji english} episodes mediaListEntry{id progress status score}}}`, { search });
    },

    getMediaById(id) {
      return API.fetch(`query($id:Int){Media(id:$id,type:ANIME){id title{romaji english} episodes mediaListEntry{id progress status score}}}`, { id: parseInt(id) });
    },

    // Costruttore dinamico di mutazione: aggiorna SOLO i campi richiesti senza azzerare o inviare null
    updateMediaList(mediaId, progress, status, score) {
      const vars = { mediaId };
      const varDefs = ["$mediaId:Int"];
      const mutationArgs = ["mediaId:$mediaId"];

      if (typeof progress === "number") {
        vars.progress = progress;
        varDefs.push("$progress:Int");
        mutationArgs.push("progress:$progress");
      }
      if (status) {
        vars.status = status;
        varDefs.push("$status:MediaListStatus");
        mutationArgs.push("status:$status");
      }
      if (typeof score === "number") {
        vars.score = score;
        varDefs.push("$score:Float");
        mutationArgs.push("score:$score");
      }

      const q = `mutation(${varDefs.join(",")}){SaveMediaListEntry(${mutationArgs.join(",")}){id progress status score}}`;
      return API.fetch(q, vars);
    },

    removeMediaList(id) {
      return API.fetch(`mutation($id:Int){DeleteMediaListEntry(id:$id){deleted}}`, { id });
    }
  };

  // ==========================================
  // 4. INTERFACCIA UTENTE & STILI (Design Modern Dark)
  // ==========================================
  const UI = {
    initStyles() {
      if (document.getElementById("al-sync-styles")) return;
      document.head.insertAdjacentHTML("beforeend", `<style id="al-sync-styles">
        :root {
          --al-blue: #3db4f2;
          --al-blue-hover: #009be5;
          --al-bg-card: #152232;
          --al-bg-dark: #0b1622;
          --al-border: rgba(255, 255, 255, 0.12);
          --al-text-main: #bcbedc;
          --al-text-bright: #edf1f5;
        }

        /* Navbar AniList Widget */
        .al-nav-widget { display: flex; align-items: center; position: relative; margin-left: 12px; }
        .al-nav-btn {
          display: flex; align-items: center; gap: 8px; background: rgba(61, 180, 242, 0.12);
          color: var(--al-blue)!important; border: 1px solid rgba(61, 180, 242, 0.35);
          border-radius: 20px; padding: 6px 14px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s ease; text-decoration: none!important;
          outline: none;
        }
        .al-nav-btn:hover { background: rgba(61, 180, 242, 0.25); color: #fff!important; transform: translateY(-1px); }
        .al-nav-avatar { width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid var(--al-blue); object-fit: cover; }
        
        /* Dropdown Profilo Desktop */
        .al-dropdown {
          position: absolute; top: calc(100% + 8px); right: 0; background: var(--al-bg-card);
          border: 1px solid var(--al-border); border-radius: 10px; min-width: 190px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.6); display: none; flex-direction: column;
          z-index: 10001; overflow: hidden; animation: alFadeIn 0.15s ease-out;
        }
        .al-dropdown.show { display: flex; }

        /* Mobile Navbar AniList Widget & Dropdown */
        .al-nav-widget-mobile { display: flex; align-items: center; position: relative; margin-left: 8px; }
        .al-nav-btn-mobile { padding: 4px 10px !important; font-size: 12px !important; gap: 6px !important; border-radius: 16px !important; }
        .al-dropdown-mobile {
          position: fixed !important; top: 54px !important; right: 12px !important; left: auto !important;
          min-width: 190px !important; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.8) !important; z-index: 99999 !important;
        }

        .al-dropdown-item {
          padding: 10px 14px; color: var(--al-text-main); font-size: 13px; display: flex;
          align-items: center; gap: 10px; text-decoration: none!important; cursor: pointer;
          background: transparent; border: none; width: 100%; text-align: left; transition: background 0.15s;
        }
        .al-dropdown-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .al-dropdown-item.danger { color: #f87171; border-top: 1px solid var(--al-border); }
        .al-dropdown-item.danger:hover { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

        /* Pulizia & Isolamento .actions sotto la copertina */
        .cover-wrap .actions {
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          gap: 8px !important;
          margin-top: 10px !important;
        }
        .cover-wrap .actions > *:not(#al-actions-panel) {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }

        /* AniList Actions Card su Cover */
        .al-card-panel {
          background: var(--al-bg-card); border: 1px solid var(--al-border); border-radius: 10px;
          padding: 12px; width: 100%; display: flex; flex-direction: column; gap: 9px; box-sizing: border-box;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }
        .al-card-header { display: flex; justify-content: space-between; align-items: center; }
        .al-badge-link {
          display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--al-blue)!important;
          font-weight: 700; text-decoration: none!important;
        }
        .al-badge-link:hover { text-decoration: underline!important; }
        .al-icon-btn {
          background: transparent; border: none; color: #8a9bb0; cursor: pointer;
          font-size: 13px; padding: 4px; border-radius: 4px; transition: color 0.15s;
        }
        .al-icon-btn:hover { color: #fff; }
        .al-icon-btn.danger:hover { color: #f87171; }

        .al-btn-action {
          background: var(--al-blue); color: #0b1622!important; border: none; padding: 9px 12px;
          border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 700; width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 6px; transition: filter 0.2s;
          box-sizing: border-box;
        }
        .al-btn-action:hover { filter: brightness(1.15); }
        .al-btn-action:disabled { opacity: 0.6; cursor: not-allowed; }

        select.al-select {
          background: #0e1622; color: #fff; border: 1px solid var(--al-border);
          border-radius: 6px; padding: 7px 10px; font-size: 13px; font-weight: 600;
          outline: none; width: 100%; cursor: pointer;
        }
        select.al-select:focus { border-color: var(--al-blue); }

        .al-score-wrap { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #8a9bb0; }
        .al-score-select {
          background: #0e1622; color: #fff; border: 1px solid var(--al-border);
          border-radius: 4px; padding: 3px 6px; font-size: 12px; outline: none; cursor: pointer;
        }

        /* QoL: Mini Progress Bar su Card */
        .al-progress-container { display: flex; flex-direction: column; gap: 4px; margin-top: 2px; }
        .al-progress-header { display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; font-weight: 600; }
        .al-progress-header b { color: #fff; }
        .al-progress-bar-bg { width: 100%; height: 5px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; }
        .al-progress-bar-fill { height: 100%; background: linear-gradient(90deg, #3db4f2, #00d2ff); border-radius: 3px; transition: width 0.3s; }

        /* ==============================================================
           OVERRIDE GRAFICA EPISODI: Pulizia sfondo e contrasto impeccabile
           ============================================================== */
        /* 1. Svuota il background chiaro nativo di AnimeUnity per gli episodi già visti */
        .episode-wrapper .episode-item.seen:not(.active):not(.al-ep-highlight) {
          background-color: #17212e !important;
          border: 1px solid rgba(255, 255, 255, 0.06) !important;
          opacity: 0.85;
        }
        .episode-wrapper .episode-item.seen:not(.active):not(.al-ep-highlight) a {
          color: #728197 !important;
        }

        /* 2. Episodi completati su AniList (da 1 all'ultimo visto) */
        .episode-wrapper .episode-item.al-ep-done:not(.al-ep-highlight) {
          background-color: rgba(61, 180, 242, 0.08) !important;
          border: 1px solid rgba(61, 180, 242, 0.25) !important;
        }
        .episode-wrapper .episode-item.al-ep-done:not(.al-ep-highlight) a {
          color: #93c5fd !important;
          font-weight: 600 !important;
        }

        /* 3. Evidenziazione brillante con Glow per l'ultimo episodio sincronizzato */
        .episode-wrapper .episode-item.al-ep-highlight {
          background: linear-gradient(135deg, rgba(61, 180, 242, 0.42) 0%, rgba(14, 116, 144, 0.48) 100%) !important;
          border: 2px solid #3db4f2 !important;
          box-shadow: 0 0 14px rgba(61, 180, 242, 0.85) !important;
          transform: scale(1.06);
          position: relative;
          z-index: 2;
        }
        .episode-wrapper .episode-item.al-ep-highlight a {
          color: #ffffff !important;
          font-weight: 900 !important;
          text-shadow: 0 0 8px rgba(61, 180, 242, 0.9);
        }
        .episode-wrapper .episode-item.al-ep-highlight::after {
          content: "✓";
          position: absolute;
          top: -6px;
          right: -6px;
          background: #3db4f2;
          color: #0b1622;
          font-size: 10px;
          font-weight: 900;
          border-radius: 50%;
          width: 15px;
          height: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.7);
        }

        /* Tasto Rapido Episodio Successivo sotto la griglia */
        .al-next-ep-box { display: flex; justify-content: center; margin: 16px 0; }
        .al-btn-next-ep {
          background: linear-gradient(135deg, #192b42 0%, #152232 100%);
          border: 1px solid rgba(61, 180, 242, 0.45); color: #fff; padding: 10px 22px;
          border-radius: 20px; font-weight: 700; font-size: 14px; cursor: pointer;
          display: flex; align-items: center; gap: 8px; transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .al-btn-next-ep:hover { border-color: var(--al-blue); box-shadow: 0 0 12px rgba(61,180,242,0.4); transform: translateY(-1px); }

        /* QoL: Tasto Rapido accanto al player video */
        .al-player-quick-btn {
          background: rgba(61, 180, 242, 0.15); border: 1px solid rgba(61, 180, 242, 0.4);
          color: #3db4f2; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700;
          cursor: pointer; display: inline-flex; align-items: center; gap: 6px; margin-left: 10px;
          transition: all 0.2s;
        }
        .al-player-quick-btn:hover { background: rgba(61, 180, 242, 0.3); color: #fff; }

        /* Modal Dialog */
        .al-modal-overlay {
          position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center; z-index: 99999; animation: alFadeIn 0.2s;
        }
        .al-modal {
          background: #111a26; border: 1px solid var(--al-border); border-radius: 12px;
          width: 90%; max-width: 440px; padding: 22px; box-shadow: 0 20px 40px rgba(0,0,0,0.8);
          color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .al-modal h3 { margin: 0 0 12px 0; font-size: 18px; color: var(--al-blue); display: flex; align-items: center; gap: 8px; }
        .al-modal p { font-size: 13px; color: #9fadbd; margin: 0 0 14px 0; line-height: 1.5; }
        .al-modal input {
          width: 100%; box-sizing: border-box; background: #080d14; border: 1px solid #202f43;
          border-radius: 8px; padding: 10px 12px; color: #fff; font-size: 13px; outline: none; margin-bottom: 14px;
        }
        .al-modal input:focus { border-color: var(--al-blue); }
        .al-modal-footer { display: flex; justify-content: flex-end; gap: 10px; }
        .al-modal-btn {
          border: none; border-radius: 6px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer;
        }
        .al-modal-btn.primary { background: var(--al-blue); color: #0b1622; }
        .al-modal-btn.secondary { background: #1c2838; color: #fff; }

        /* Toast Notifications */
        .al-toast {
          position: fixed; bottom: 24px; right: 24px; background: #102538; color: #fff;
          border-left: 4px solid var(--al-blue); padding: 12px 20px; border-radius: 8px;
          z-index: 100000; font-weight: 600; font-size: 13px; box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          animation: alFadeIn 0.2s; pointer-events: none;
        }
        .al-toast.alert { border-left-color: #ef4444; }

        @keyframes alFadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      </style>`);
    },

    toast(text, isAlert = false) {
      const el = document.createElement("div");
      el.className = `al-toast ${isAlert ? "alert" : ""}`;
      el.innerText = text;
      document.body.appendChild(el);
      setTimeout(() => {
        el.style.opacity = "0";
        el.style.transition = "opacity 0.3s";
        setTimeout(() => el.remove(), 300);
      }, 2500);
    },

    openTokenModal() {
      document.getElementById("al-token-modal")?.remove();
      const modal = document.createElement("div");
      modal.id = "al-token-modal";
      modal.className = "al-modal-overlay";
      modal.innerHTML = `
        <div class="al-modal">
          <h3><i class="fas fa-key"></i> Connetti Account AniList</h3>
          <p style="color:#d1d5db;margin-bottom:14px;line-height:1.5;">
            Sincronizza il tuo progresso anime con AniList inserendo il tuo Personal Token.
          </p>
          <div style="background:rgba(61,180,242,0.12);border:1px solid rgba(61,180,242,0.4);border-radius:8px;padding:12px 14px;margin-bottom:14px;">
            <div style="font-size:12px;color:#edf1f5;font-weight:600;margin-bottom:6px;">
              Passo 1: Genera il token (1 Click)
            </div>
            <a href="${CONFIG.oauthUrl}" target="_blank" rel="noopener noreferrer" style="color:#3db4f2;font-size:13px;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
              <i class="fas fa-external-link-alt"></i> Apri Autorizzazione AniList OAuth
            </a>
            <div style="font-size:11px;color:#94a3b8;margin-top:6px;line-height:1.4;">
              Clicca "Authorize" e copia il codice <code>access_token</code> presente nell'URL reindirizzato.
            </div>
          </div>
          <div style="font-size:12px;color:#edf1f5;font-weight:600;margin-bottom:6px;">
            Passo 2: Incolla il token qui sotto
          </div>
          <input type="password" id="al-token-input" placeholder="Incolla il token (es. eyJ0eX...)" value="${Storage.get(Storage.KEYS.TOKEN) || ""}" />
          <div class="al-modal-footer">
            <button class="al-modal-btn secondary" id="al-modal-cancel">Annulla</button>
            <button class="al-modal-btn primary" id="al-modal-save">Salva & Connetti</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector("#al-modal-cancel").onclick = () => modal.remove();
      modal.querySelector("#al-modal-save").onclick = async () => {
        const val = modal.querySelector("#al-token-input").value.trim();
        if (!val) {
          App.logout();
          modal.remove();
          return;
        }
        Storage.set(Storage.KEYS.TOKEN, val);
        UI.toast("Verifica token in corso...");
        modal.remove();
        await App.loadUser();
        App.syncAnime();
      };
    },

    openManualLinkModal() {
      const currentManual = Storage.get(Storage.KEYS.MANUAL_PREFIX + window.location.pathname) || "";
      const modal = document.createElement("div");
      modal.className = "al-modal-overlay";
      modal.innerHTML = `
        <div class="al-modal">
          <h3><i class="fas fa-link"></i> Collega Anime AniList</h3>
          <p>Se la ricerca per titolo non corrisponde, incolla l'URL dell'anime su AniList o il suo ID numerico.</p>
          <input type="text" id="al-manual-input" placeholder="es. https://anilist.co/anime/105228/Dorohedoro" value="${currentManual}" />
          <div class="al-modal-footer">
            ${currentManual ? `<button class="al-modal-btn secondary" id="al-manual-reset" style="color:#f87171;">Rimuovi Override</button>` : ""}
            <button class="al-modal-btn secondary" id="al-manual-cancel">Annulla</button>
            <button class="al-modal-btn primary" id="al-manual-save">Salva</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector("#al-manual-cancel").onclick = () => modal.remove();
      if (currentManual) {
        modal.querySelector("#al-manual-reset").onclick = () => {
          Storage.remove(Storage.KEYS.MANUAL_PREFIX + window.location.pathname);
          UI.toast("Collegamento manuale rimosso.");
          modal.remove();
          App.syncAnime();
        };
      }
      modal.querySelector("#al-manual-save").onclick = () => {
        const val = modal.querySelector("#al-manual-input").value.trim();
        const match = val.match(/(?:anime\/|^)(\d+)/);
        if (match && match[1]) {
          Storage.set(Storage.KEYS.MANUAL_PREFIX + window.location.pathname, match[1]);
          UI.toast("ID AniList associato: " + match[1]);
          modal.remove();
          App.syncAnime();
        } else {
          UI.toast("URL o ID AniList non valido!", true);
        }
      };
    },

    renderNavbar(viewer) {
      // 1. WIDGET DESKTOP (#left-nav)
      const loginItem = document.querySelector('#left-nav a[href*="/login"]')?.closest("li") ||
                        document.querySelector('nav a[href*="/login"]')?.closest("li");

      let widget = document.getElementById("al-nav-widget");
      if (loginItem && loginItem !== widget) {
        if (!widget) {
          widget = document.createElement("li");
          widget.id = "al-nav-widget";
          widget.className = "nav-item al-nav-widget";
        }
        loginItem.replaceWith(widget);
      }

      if (widget) {
        if (!viewer) {
          widget.innerHTML = `
            <button type="button" class="al-nav-btn" data-al-action="open-token-modal">
              <i class="fas fa-key"></i> Connetti AniList
            </button>
          `;
        } else {
          widget.innerHTML = `
            <button type="button" class="al-nav-btn" id="al-user-toggle">
              <img class="al-nav-avatar" src="${viewer.avatar?.medium || "https://anilist.co/img/icons/icon.svg"}" alt="${viewer.name}" />
              <span>${viewer.name}</span>
              <i class="fas fa-chevron-down" style="font-size:10px;margin-left:2px;"></i>
            </button>
            <div class="al-dropdown" id="al-nav-dropdown">
              <a class="al-dropdown-item" href="https://anilist.co/user/${viewer.name}" target="_blank" rel="noopener noreferrer">
                <i class="fas fa-user-circle"></i> Profilo AniList
              </a>
              <button type="button" class="al-dropdown-item" data-al-action="open-token-modal">
                <i class="fas fa-cog"></i> Gestisci Token
              </button>
              <button type="button" class="al-dropdown-item danger" id="al-drop-logout">
                <i class="fas fa-sign-out-alt"></i> Disconnetti
              </button>
            </div>
          `;
        }
      }

      // 2. WIDGET MOBILE (.nav-top-mobile)
      const mobileNav = document.querySelector(".nav-top-mobile");
      if (mobileNav) {
        let mobileWidget = document.getElementById("al-nav-widget-mobile");
        if (!mobileWidget) {
          mobileWidget = document.createElement("div");
          mobileWidget.id = "al-nav-widget-mobile";
          mobileWidget.className = "al-nav-widget-mobile";
          mobileNav.appendChild(mobileWidget);
        }

        if (!viewer) {
          mobileWidget.innerHTML = `
            <button type="button" class="al-nav-btn al-nav-btn-mobile" data-al-action="open-token-modal">
              <i class="fas fa-key"></i> <span>AniList</span>
            </button>
          `;
        } else {
          mobileWidget.innerHTML = `
            <button type="button" class="al-nav-btn al-nav-btn-mobile" id="al-user-toggle-mobile">
              <img class="al-nav-avatar" src="${viewer.avatar?.medium || "https://anilist.co/img/icons/icon.svg"}" alt="${viewer.name}" />
              <span style="max-width:75px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${viewer.name}</span>
              <i class="fas fa-chevron-down" style="font-size:8px;"></i>
            </button>
            <div class="al-dropdown al-dropdown-mobile" id="al-nav-dropdown-mobile">
              <a class="al-dropdown-item" href="https://anilist.co/user/${viewer.name}" target="_blank" rel="noopener noreferrer">
                <i class="fas fa-user-circle"></i> Profilo AniList
              </a>
              <button type="button" class="al-dropdown-item" data-al-action="open-token-modal">
                <i class="fas fa-cog"></i> Gestisci Token
              </button>
              <button type="button" class="al-dropdown-item danger" id="al-drop-logout-mobile">
                <i class="fas fa-sign-out-alt"></i> Disconnetti
              </button>
            </div>
          `;
        }
      }
    },

    renderAnimePanel(media) {
      const actionsContainer = document.querySelector(".cover-wrap .actions");
      if (!actionsContainer) return;

      // Rimuovi SOLO i figli diretti di .actions diversi da #al-actions-panel (:scope > è fondamentale per non distruggere i select interni!)
      actionsContainer.querySelectorAll(":scope > *:not(#al-actions-panel)").forEach(el => el.remove());

      let panel = document.getElementById("al-actions-panel");
      if (!panel) {
        panel = document.createElement("div");
        panel.id = "al-actions-panel";
        panel.className = "al-card-panel";
        actionsContainer.appendChild(panel);
      }

      if (!Storage.get(Storage.KEYS.TOKEN)) {
        panel.innerHTML = `
          <button type="button" class="al-btn-action" data-al-action="open-token-modal">
            <i class="fas fa-key"></i> Connetti ad AniList
          </button>
        `;
        return;
      }

      if (!media) {
        panel.innerHTML = `
          <div class="al-card-header">
            <span style="font-size:12px;color:#f87171;font-weight:600;"><i class="fas fa-exclamation-triangle"></i> Non trovato</span>
            <button type="button" class="al-icon-btn" id="al-manual-trigger" title="Collega ID AniList"><i class="fas fa-link"></i></button>
          </div>
          <button type="button" class="al-modal-btn primary" id="al-manual-search-btn">
            <i class="fas fa-link"></i> Collega URL o ID AniList
          </button>
        `;
        panel.querySelector("#al-manual-search-btn").onclick = () => UI.openManualLinkModal();
        panel.querySelector("#al-manual-trigger").onclick = () => UI.openManualLinkModal();
        return;
      }

      const entry = media.mediaListEntry;
      trackedProgress = entry ? entry.progress : -1;

      if (!entry) {
        panel.innerHTML = `
          <div class="al-card-header">
            <a href="https://anilist.co/anime/${media.id}" target="_blank" rel="noopener noreferrer" class="al-badge-link">
              <i class="fas fa-external-link-alt"></i> AniList #${media.id}
            </a>
            <button type="button" class="al-icon-btn" id="al-manual-trigger" title="Cambia associazione AniList"><i class="fas fa-link"></i></button>
          </div>
          <button type="button" class="al-btn-action" id="al-add-entry-btn">
            <i class="fas fa-plus"></i> Aggiungi a Watching
          </button>
        `;
        panel.querySelector("#al-add-entry-btn").onclick = async (e) => {
          e.target.disabled = true;
          if (await API.updateMediaList(media.id, 0, "CURRENT")) {
            UI.toast("Anime aggiunto a Watching!");
            App.syncAnime();
          } else e.target.disabled = false;
        };
        panel.querySelector("#al-manual-trigger").onclick = () => UI.openManualLinkModal();
        return;
      }

      // Anime già in lista AniList
      const totalEp = media.episodes || 0;
      const progressPercent = totalEp ? Math.round((entry.progress / totalEp) * 100) : 0;

      panel.innerHTML = `
        <div class="al-card-header">
          <a href="https://anilist.co/anime/${media.id}" target="_blank" rel="noopener noreferrer" class="al-badge-link">
            <i class="fas fa-external-link-alt"></i> AniList #${media.id}
          </a>
          <div style="display:flex;gap:4px;">
            <button type="button" class="al-icon-btn" id="al-manual-trigger" title="Cambia associazione AniList"><i class="fas fa-link"></i></button>
            <button type="button" class="al-icon-btn danger" id="al-delete-entry-btn" title="Rimuovi da AniList"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <select class="al-select" id="al-status-select">
          ${Object.entries(CONFIG.statuses).map(([k, v]) => `<option value="${k}" ${entry.status === k ? "selected" : ""}>${v}</option>`).join("")}
        </select>
        <div class="al-progress-container">
          <div class="al-progress-header">
            <span>Progresso: <b>${entry.progress}</b>${totalEp ? ` / ${totalEp}` : ""} ep</span>
            <span style="color:#3db4f2;">${totalEp ? `${progressPercent}%` : ""}</span>
          </div>
          ${totalEp ? `
            <div class="al-progress-bar-bg">
              <div class="al-progress-bar-fill" style="width:${Math.min(100, progressPercent)}%;"></div>
            </div>
          ` : ""}
        </div>
        <div class="al-score-wrap">
          <span>Voto personale:</span>
          <select class="al-score-select" id="al-score-select">
            <option value="0" ${!entry.score ? "selected" : ""}>-</option>
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => `<option value="${s}" ${entry.score === s ? "selected" : ""}>★ ${s}/10</option>`).join("")}
          </select>
        </div>
      `;

      panel.querySelector("#al-manual-trigger").onclick = () => UI.openManualLinkModal();
      panel.querySelector("#al-delete-entry-btn").onclick = async () => {
        if (confirm("Vuoi davvero rimuovere questa serie dalla tua lista AniList?")) {
          if (await API.removeMediaList(entry.id)) {
            UI.toast("Serie rimossa da AniList", true);
            App.syncAnime();
          }
        }
      };

      panel.querySelector("#al-status-select").onchange = async (e) => {
        const newStatus = e.target.value;
        e.target.disabled = true;
        if (await API.updateMediaList(media.id, undefined, newStatus)) {
          UI.toast(`Stato impostato su: ${CONFIG.statuses[newStatus]}`);
        }
        App.syncAnime();
      };

      panel.querySelector("#al-score-select").onchange = async (e) => {
        const newScore = parseFloat(e.target.value);
        if (await API.updateMediaList(media.id, undefined, undefined, newScore)) {
          UI.toast(newScore > 0 ? `Voto salvato: ${newScore}/10` : "Voto rimosso");
        }
      };
    },

    renderNextEpisodeButton(media) {
      document.getElementById("al-next-ep-wrap")?.remove();
      document.getElementById("al-player-quick-btn")?.remove();

      if (!media?.mediaListEntry) return;

      const epWrapper = document.querySelector(".episode-wrapper");
      const nextEp = media.mediaListEntry.progress + 1;

      // 1. Tasto rapido sotto la griglia degli episodi
      if (epWrapper) {
        const eps = Array.from(epWrapper.querySelectorAll(".episode-item"));
        const hasNext = eps.some(el => parseInt(el.innerText.trim()) === nextEp);

        if (hasNext) {
          const wrap = document.createElement("div");
          wrap.id = "al-next-ep-wrap";
          wrap.className = "al-next-ep-box";
          wrap.innerHTML = `
            <button type="button" class="al-btn-next-ep" id="al-btn-mark-ep">
              <i class="fas fa-check-circle" style="color:var(--al-blue);"></i> Segna Episodio ${nextEp} completato
            </button>
          `;
          wrap.querySelector("#al-btn-mark-ep").onclick = async (e) => {
            e.target.disabled = true;
            if (await API.updateMediaList(media.id, nextEp)) {
              UI.toast(`Episodio ${nextEp} completato!`);
              App.syncAnime();
            } else e.target.disabled = false;
          };
          epWrapper.after(wrap);
        }
      }
    }
  };

  // ==========================================
  // 5. APPLICAZIONE CORE & ORCHESTRAZIONE
  // ==========================================
  const App = {
    async loadUser() {
      const token = Storage.get(Storage.KEYS.TOKEN);
      if (!token) {
        currentUser = null;
        Storage.remove(Storage.KEYS.USER);
        UI.renderNavbar(null);
        return null;
      }

      const cached = Storage.get(Storage.KEYS.USER);
      if (cached) {
        try {
          currentUser = JSON.parse(cached);
          UI.renderNavbar(currentUser);
        } catch (_) {}
      }

      const viewer = await API.getViewer();
      if (viewer) {
        currentUser = viewer;
        Storage.set(Storage.KEYS.USER, JSON.stringify(viewer));
        UI.renderNavbar(currentUser);
      }
      return viewer;
    },

    logout() {
      Storage.remove(Storage.KEYS.TOKEN);
      Storage.remove(Storage.KEYS.USER);
      currentUser = null;
      UI.renderNavbar(null);
      UI.renderAnimePanel(null);
      document.getElementById("al-next-ep-wrap")?.remove();
      document.getElementById("al-player-quick-btn")?.remove();
      UI.toast("Disconnesso da AniList", true);
    },

    async syncAnime() {
      if (!Storage.get(Storage.KEYS.TOKEN)) {
        UI.renderAnimePanel(null);
        return;
      }

      // 1. Controllo override manuale specifico della pagina
      const manualId = Storage.get(Storage.KEYS.MANUAL_PREFIX + window.location.pathname);
      if (manualId) {
        const data = await API.getMediaById(manualId);
        currentMedia = data?.Media || null;
        UI.renderAnimePanel(currentMedia);
        UI.renderNextEpisodeButton(currentMedia);
        return;
      }

      if (!currentTitle) return;

      // 2. QoL: Ricerca prima con titolo pulito (senza (ITA), SUB ITA, ecc.), poi con titolo grezzo
      const cleaned = API.cleanTitle(currentTitle);
      let data = await API.getMediaBySearch(cleaned);
      if (!data?.Media && cleaned !== currentTitle) {
        data = await API.getMediaBySearch(currentTitle);
      }

      currentMedia = data?.Media || null;
      UI.renderAnimePanel(currentMedia);
      UI.renderNextEpisodeButton(currentMedia);
    },

    init() {
      UI.initStyles();
      App.loadUser();

      // Event Delegation Globale in fase CAPTURE
      document.addEventListener("click", (e) => {
        // Apertura modale token (da navbar o da pannello cover)
        const tokenTrigger = e.target.closest('[data-al-action="open-token-modal"]');
        if (tokenTrigger) {
          e.preventDefault();
          e.stopPropagation();
          UI.openTokenModal();
          return;
        }

        // Toggle dropdown utente (desktop o mobile)
        const userToggle = e.target.closest("#al-user-toggle, #al-user-toggle-mobile");
        if (userToggle) {
          e.preventDefault();
          e.stopPropagation();
          const isMobile = !!userToggle.matches("#al-user-toggle-mobile");
          const target = document.getElementById(isMobile ? "al-nav-dropdown-mobile" : "al-nav-dropdown");
          target?.classList.toggle("show");
          return;
        }

        // Logout dal dropdown (desktop o mobile)
        const logoutBtn = e.target.closest("#al-drop-logout, #al-drop-logout-mobile");
        if (logoutBtn) {
          e.preventDefault();
          e.stopPropagation();
          document.getElementById("al-nav-dropdown")?.classList.remove("show");
          document.getElementById("al-nav-dropdown-mobile")?.classList.remove("show");
          App.logout();
          return;
        }

        // Chiusura dropdown al click esterno
        if (!e.target.closest("#al-nav-widget, #al-nav-widget-mobile")) {
          document.getElementById("al-nav-dropdown")?.classList.remove("show");
          document.getElementById("al-nav-dropdown-mobile")?.classList.remove("show");
        }
      }, true);

      // QoL: Scorciatoia da tastiera globale (Shift + S per segnare il prossimo episodio come visto)
      document.addEventListener("keydown", async (e) => {
        if (e.shiftKey && (e.key === "S" || e.key === "s") && !["INPUT", "TEXTAREA"].includes(e.target.tagName)) {
          if (currentMedia?.mediaListEntry) {
            const next = currentMedia.mediaListEntry.progress + 1;
            if (await API.updateMediaList(currentMedia.id, next)) {
              UI.toast(`Episodio ${next} completato (Scorciatoia Shift+S)!`);
              App.syncAnime();
            }
          }
        }
      });

      // Polling continuo per gestione DOM dinamico SPA ed evidenziazione episodi
      setInterval(() => {
        const titleEl = document.querySelector("#anime .title");
        if (titleEl && titleEl.innerText.trim() !== currentTitle) {
          currentTitle = titleEl.innerText.trim();
          App.syncAnime();
        }

        // Se AnimeUnity rigenera il login originale o la navbar mobile, aggiorna i widget
        const originalLogin = document.querySelector('#left-nav a[href*="/login"]')?.closest("li");
        const hasMobileBar = !!document.querySelector(".nav-top-mobile");
        const hasMobileWidget = !!document.getElementById("al-nav-widget-mobile");
        if ((originalLogin && originalLogin.id !== "al-nav-widget") || (hasMobileBar && !hasMobileWidget)) {
          UI.renderNavbar(currentUser);
        }

        // Rimuovi SOLO i figli diretti di .actions diversi da #al-actions-panel
        const actionsContainer = document.querySelector(".cover-wrap .actions");
        if (actionsContainer) {
          actionsContainer.querySelectorAll(":scope > *:not(#al-actions-panel)").forEach(el => el.remove());
        }

        // Colorazione avanzata degli episodi
        if (trackedProgress > -1) {
          document.querySelectorAll(".episode-item").forEach(el => {
            const epNum = parseInt(el.innerText.trim());
            el.classList.toggle("al-ep-highlight", epNum === trackedProgress);
            el.classList.toggle("al-ep-done", epNum < trackedProgress);
          });
        }
      }, 500);
    }
  };

  App.init();
})();