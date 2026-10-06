// ==UserScript==
// @name         AnimeUnity to AniList Sync
// @namespace    https://github.com/pallax03/my-userscripts
// @version      1.1.0
// @description  Sincronizzazione avanzata progresso e profilo AniList per AnimeUnity
// @author       Alex Mazzoni
// @match        *://*.animeunity.so/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  // ==========================================================================
  // 1. HELPERS & STORAGE (KISS)
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

  // Ottiene la data odierna nel formato FuzzyDateInput di AniList
  const today = () => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  };

  // Rimuove tag superflui (ITA, SUB, ecc.) per facilitare la ricerca su AniList
  const cleanTitle = (t) => t ? t.replace(/\s*\((ITA|SUB|SUB ITA|DUB|ITA SUB|OVA)\)/gi, "").replace(/\s+(ITA|SUB|DUB)$/gi, "").replace(/\s+Season\s+\d+/gi, "").trim() : "";

  // Supporto login rapido via URL (?al_token=...)
  const params = new URLSearchParams(window.location.search);
  if (params.has("al_token")) {
    Storage.set("anilist_token", params.get("al_token").trim());
    params.delete("al_token");
    window.history.replaceState({}, document.title, window.location.pathname + (params.toString() ? "?" + params : "") + window.location.hash);
  }

  // ==========================================================================
  // 2. ANILIST API (GraphQL)
  // ==========================================================================
  const API = {
    url: "https://graphql.anilist.co",
    clientId: "43750",
    oauthUrl: "https://anilist.co/api/v2/oauth/authorize?client_id=43750&response_type=token",
    statuses: { CURRENT: "Watching", PLANNING: "Plan to Watch", COMPLETED: "Completed", DROPPED: "Dropped", PAUSED: "Paused", REPEATING: "Rewatching" },

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

    getMedia: (search) => API.call(
      `query($s:String){Media(search:$s,type:ANIME){id title{romaji english} episodes status mediaListEntry{id progress status score startedAt{year month day} completedAt{year month day}}}}`,
      { s: search }
    ),

    getMediaById: (id) => API.call(
      `query($id:Int){Media(id:$id,type:ANIME){id title{romaji english} episodes status mediaListEntry{id progress status score startedAt{year month day} completedAt{year month day}}}}`,
      { id: parseInt(id) }
    ),

    saveEntry: (args) => API.call(
      `mutation($mediaId:Int,$progress:Int,$status:MediaListStatus,$score:Float,$startedAt:FuzzyDateInput,$completedAt:FuzzyDateInput){
        SaveMediaListEntry(mediaId:$mediaId,progress:$progress,status:$status,score:$score,startedAt:$startedAt,completedAt:$completedAt){
          id progress status score startedAt{year month day} completedAt{year month day}
        }
      }`,
      args
    ),

    deleteEntry: (id) => API.call(`mutation($id:Int){DeleteMediaListEntry(id:$id){deleted}}`, { id })
  };

  // ==========================================================================
  // 3. UI & STILI (Minimal, Modern & Dark)
  // ==========================================================================
  const UI = {
    initStyles() {
      if (document.getElementById("al-styles")) return;
      document.head.insertAdjacentHTML("beforeend", `<style id="al-styles">
        :root { --al-blue: #3db4f2; --al-bg: #152232; --al-border: rgba(255,255,255,0.12); }
        .al-btn { background: rgba(61,180,242,0.12); color: var(--al-blue)!important; border: 1px solid rgba(61,180,242,0.35); border-radius: 20px; padding: 5px 12px; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .al-btn:hover { background: rgba(61,180,242,0.25); color: #fff!important; }
        .al-avatar { width: 24px; height: 24px; border-radius: 50%; border: 1.5px solid var(--al-blue); object-fit: cover; }
        .al-dropdown { position: absolute; top: calc(100% + 6px); right: 0; background: var(--al-bg); border: 1px solid var(--al-border); border-radius: 8px; min-width: 180px; box-shadow: 0 10px 25px rgba(0,0,0,0.6); display: none; flex-direction: column; z-index: 10000; overflow: hidden; }
        .al-dropdown.show { display: flex; }
        .al-dropdown a, .al-dropdown button { padding: 9px 12px; color: #bcbedc; font-size: 13px; display: flex; align-items: center; gap: 8px; text-decoration: none!important; cursor: pointer; background: transparent; border: none; width: 100%; text-align: left; }
        .al-dropdown a:hover, .al-dropdown button:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .al-dropdown .danger { color: #f87171; border-top: 1px solid var(--al-border); }
        .al-dropdown-mobile { position: fixed!important; top: 54px!important; right: 12px!important; z-index: 99999!important; }

        /* Cover Actions Panel */
        .cover-wrap .actions { display: flex!important; flex-direction: column!important; width: 100%!important; gap: 8px!important; margin-top: 10px!important; }
        .cover-wrap .actions > *:not(#al-panel) { display: none!important; }
        .al-panel { background: var(--al-bg); border: 1px solid var(--al-border); border-radius: 10px; padding: 12px; width: 100%; display: flex; flex-direction: column; gap: 8px; box-sizing: border-box; }
        .al-select { background: #0e1622; color: #fff; border: 1px solid var(--al-border); border-radius: 6px; padding: 7px; font-size: 13px; font-weight: 600; width: 100%; outline: none; cursor: pointer; }
        .al-action-btn { background: var(--al-blue); color: #0b1622!important; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 700; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .al-step-btn { background: #0e1622; border: 1px solid var(--al-border); color: #fff; width: 22px; height: 22px; border-radius: 4px; cursor: pointer; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
        .al-step-btn:hover { border-color: var(--al-blue); color: var(--al-blue); }

        /* Griglia Episodi & Highlight */
        .episode-wrapper .episode-item.seen:not(.active):not(.al-highlight) { background-color: #17212e!important; border: 1px solid rgba(255,255,255,0.06)!important; opacity: 0.85; }
        .episode-wrapper .episode-item.seen:not(.active):not(.al-highlight) a { color: #728197!important; }
        .episode-wrapper .episode-item.al-done:not(.al-highlight) { background-color: rgba(61,180,242,0.08)!important; border: 1px solid rgba(61,180,242,0.25)!important; }
        .episode-wrapper .episode-item.al-done:not(.al-highlight) a { color: #93c5fd!important; font-weight: 600; }
        .episode-wrapper .episode-item.al-highlight { background: linear-gradient(135deg, rgba(61,180,242,0.4), rgba(14,116,144,0.5))!important; border: 2px solid var(--al-blue)!important; box-shadow: 0 0 14px rgba(61,180,242,0.85)!important; transform: scale(1.06); position: relative; z-index: 2; }
        .episode-wrapper .episode-item.al-highlight a { color: #fff!important; font-weight: 900!important; }
        .episode-wrapper .episode-item.al-highlight::after { content: "✓"; position: absolute; top: -6px; right: -6px; background: var(--al-blue); color: #0b1622; font-size: 10px; font-weight: 900; border-radius: 50%; width: 15px; height: 15px; display: flex; align-items: center; justify-content: center; }

        /* Tasti Progresso sotto gli episodi */
        .al-next-ep-box { display: flex; justify-content: center; align-items: center; margin: 16px 0; gap: 10px; flex-wrap: wrap; }
        .al-btn-next { background: linear-gradient(135deg, #192b42, #152232); border: 1px solid rgba(61,180,242,0.45); color: #fff; padding: 10px 20px; border-radius: 20px; font-weight: 700; font-size: 14px; cursor: pointer; }
        .al-btn-next:hover { border-color: var(--al-blue); box-shadow: 0 0 12px rgba(61,180,242,0.4); }
        .al-btn-prev { background: #182230; border: 1px solid rgba(255,255,255,0.15); color: #94a3b8; padding: 10px 18px; border-radius: 20px; font-weight: 600; font-size: 13px; cursor: pointer; }
        .al-btn-prev:hover { background: #233144; color: #f87171; border-color: rgba(248,113,113,0.4); }
        .al-badge-done { background: rgba(61,180,242,0.15); border: 1px solid rgba(61,180,242,0.3); color: var(--al-blue); padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; }

        /* Modal & Toast */
        .al-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 99999; }
        .al-modal { background: #111a26; border: 1px solid var(--al-border); border-radius: 12px; width: 90%; max-width: 420px; padding: 20px; color: #fff; box-shadow: 0 20px 40px rgba(0,0,0,0.8); }
        .al-toast { position: fixed; bottom: 24px; right: 24px; background: #102538; color: #fff; border-left: 4px solid var(--al-blue); padding: 12px 20px; border-radius: 8px; z-index: 100000; font-weight: 600; font-size: 13px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
        .al-toast.alert { border-left-color: #ef4444; }
      </style>`);
    },

    toast(text, isAlert = false) {
      const el = document.createElement("div");
      el.className = `al-toast ${isAlert ? "alert" : ""}`;
      el.innerText = text;
      document.body.appendChild(el);
      setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity 0.3s"; setTimeout(() => el.remove(), 300); }, 2200);
    },

    modal(title, contentHtml, onConfirm) {
      document.getElementById("al-modal")?.remove();
      const wrap = document.createElement("div");
      wrap.id = "al-modal";
      wrap.className = "al-overlay";
      wrap.innerHTML = `
        <div class="al-modal">
          <h3 style="margin:0 0 12px;color:var(--al-blue);font-size:17px;">${title}</h3>
          ${contentHtml}
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
            <button type="button" class="al-btn" id="al-m-cancel" style="background:#1c2838;color:#fff!important;">Annulla</button>
            <button type="button" class="al-action-btn" id="al-m-ok" style="width:auto;padding:6px 16px;">Salva</button>
          </div>
        </div>`;
      document.body.appendChild(wrap);
      wrap.querySelector("#al-m-cancel").onclick = () => wrap.remove();
      wrap.querySelector("#al-m-ok").onclick = () => { onConfirm(wrap); wrap.remove(); };
    },

    openTokenModal() {
      UI.modal(
        "🔑 Connetti AniList",
        `<p style="font-size:13px;color:#9fadbd;margin-bottom:12px;">Ottieni il tuo token con 1 click autorizzando l'app ufficiale:</p>
         <div style="background:rgba(61,180,242,0.12);border:1px solid rgba(61,180,242,0.3);border-radius:8px;padding:10px;margin-bottom:12px;">
           <a href="${API.oauthUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--al-blue);font-size:13px;font-weight:700;text-decoration:none;">
             🔗 Apri Autorizzazione OAuth AniList
           </a>
           <div style="font-size:11px;color:#94a3b8;margin-top:4px;">Clicca "Authorize" e copia il token restituito.</div>
         </div>
         <input type="password" id="al-tok-in" placeholder="Incolla il token qui..." value="${Storage.get("anilist_token") || ""}" style="width:100%;box-sizing:border-box;background:#080d14;border:1px solid #202f43;border-radius:6px;padding:8px 10px;color:#fff;outline:none;" />`,
        async (m) => {
          const val = m.querySelector("#al-tok-in").value.trim();
          if (val) { Storage.set("anilist_token", val); UI.toast("Token salvato!"); await App.loadUser(); App.sync(); }
          else { App.logout(); }
        }
      );
    },

    openManualModal() {
      const cur = Storage.get("al_manual_" + window.location.pathname) || "";
      UI.modal(
        "🔗 Associa Anime AniList",
        `<p style="font-size:13px;color:#9fadbd;margin-bottom:12px;">Incolla l'URL AniList (es. anilist.co/anime/12345/...) o l'ID numerico:</p>
         <input type="text" id="al-man-in" placeholder="es. 105228" value="${cur}" style="width:100%;box-sizing:border-box;background:#080d14;border:1px solid #202f43;border-radius:6px;padding:8px 10px;color:#fff;outline:none;" />`,
        (m) => {
          const val = m.querySelector("#al-man-in").value.trim();
          const match = val.match(/(?:anime\/|^)(\d+)/);
          if (match) {
            Storage.set("al_manual_" + window.location.pathname, match[1]);
            UI.toast("ID associato: " + match[1]);
          } else {
            Storage.del("al_manual_" + window.location.pathname);
            UI.toast("Override rimosso");
          }
          App.sync();
        }
      );
    }
  };

  // ==========================================================================
  // 4. CORE APP & LOGICA DI AGGIORNAMENTO PROGRESSO
  // ==========================================================================
  let currentUser = null, currentMedia = null, currentTitle = "", trackedProgress = -1;

  const App = {
    async loadUser() {
      const token = Storage.get("anilist_token");
      if (!token) return App.logout();
      const cached = Storage.get("anilist_user");
      if (cached) try { currentUser = JSON.parse(cached); App.renderNav(); } catch (_) {}
      const data = await API.getViewer();
      if (data?.Viewer) {
        currentUser = data.Viewer;
        Storage.set("anilist_user", JSON.stringify(currentUser));
        App.renderNav();
      }
    },

    logout() {
      Storage.del("anilist_token");
      Storage.del("anilist_user");
      currentUser = null;
      App.renderNav();
      document.getElementById("al-panel")?.remove();
      document.getElementById("al-next-ep-wrap")?.remove();
      UI.toast("Disconnesso da AniList", true);
    },

    renderNav() {
      const renderWidget = (parent, isMobile) => {
        if (!parent) return;
        const id = isMobile ? "al-nav-mobile" : "al-nav-desktop";
        let w = document.getElementById(id);
        if (!w) {
          w = document.createElement(isMobile ? "div" : "li");
          w.id = id;
          w.className = isMobile ? "al-btn ml-2" : "nav-item al-btn ml-2";
          w.style.cursor = "pointer";
          parent.appendChild(w);
        }

        if (!currentUser) {
          w.innerHTML = `<i class="fas fa-key"></i> <span>AniList</span>`;
          w.onclick = (e) => { e.stopPropagation(); UI.openTokenModal(); };
          return;
        }

        const dropId = isMobile ? "al-drop-m" : "al-drop-d";
        w.innerHTML = `
          <img class="al-avatar" src="${currentUser.avatar?.medium || "https://anilist.co/img/icons/icon.svg"}" />
          <span style="max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${currentUser.name}</span>
          <i class="fas fa-chevron-down" style="font-size:9px;"></i>
          <div class="al-dropdown ${isMobile ? "al-dropdown-mobile" : ""}" id="${dropId}">
            <a href="https://anilist.co/user/${currentUser.name}" target="_blank">👤 Profilo</a>
            <button type="button" id="al-drop-tok">⚙️ Cambia Token</button>
            <button type="button" class="danger" id="al-drop-out">🚪 Disconnetti</button>
          </div>`;

        w.onclick = (e) => {
          e.stopPropagation();
          const d = document.getElementById(dropId);
          document.querySelectorAll(".al-dropdown").forEach(el => el !== d && el.classList.remove("show"));
          d?.classList.toggle("show");
        };
        w.querySelector("#al-drop-tok").onclick = (e) => { e.stopPropagation(); UI.openTokenModal(); };
        w.querySelector("#al-drop-out").onclick = (e) => { e.stopPropagation(); App.logout(); };
      };

      renderWidget(document.querySelector("#left-nav"), false);
      renderWidget(document.querySelector(".nav-top-mobile"), true);
    },

    // Aggiornamento progresso con QoL: gestione date di inizio, fine e auto-complete
    async setProgress(media, newProgress) {
      const entry = media.mediaListEntry;
      const totalEp = media.episodes;
      const isCompleted = totalEp ? newProgress >= totalEp : false;

      const params = { mediaId: media.id, progress: newProgress };

      if (isCompleted) {
        params.status = "COMPLETED";
        params.completedAt = today();
        if (!entry?.startedAt?.year) params.startedAt = today();
      } else if (newProgress > 0 && entry?.status === "PLANNING") {
        params.status = "CURRENT";
      }

      if (newProgress > 0 && !entry?.startedAt?.year && !params.startedAt) {
        params.startedAt = today();
      }

      const res = await API.saveEntry(params);
      if (res?.SaveMediaListEntry) {
        UI.toast(isCompleted ? "🎉 Serie completata su AniList!" : `Episodio ${newProgress} salvato!`);
        App.sync();
      }
    },

    renderPanel(media) {
      const container = document.querySelector(".cover-wrap .actions");
      if (!container) return;
      container.querySelectorAll(":scope > *:not(#al-panel)").forEach(el => el.remove());

      let p = document.getElementById("al-panel");
      if (!p) { p = document.createElement("div"); p.id = "al-panel"; p.className = "al-panel"; container.appendChild(p); }

      if (!Storage.get("anilist_token")) {
        p.innerHTML = `<button type="button" class="al-action-btn" id="al-p-login"><i class="fas fa-key"></i> Connetti AniList</button>`;
        p.querySelector("#al-p-login").onclick = () => UI.openTokenModal();
        return;
      }

      if (!media) {
        p.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#f87171;font-weight:700;">
            <span>Non trovato su AniList</span>
            <button type="button" class="al-step-btn" id="al-man-btn" title="Associa ID">🔗</button>
          </div>
          <button type="button" class="al-action-btn" style="background:#26384f;color:#fff;" id="al-man-search">Collega URL AniList</button>`;
        p.querySelector("#al-man-btn").onclick = p.querySelector("#al-man-search").onclick = () => UI.openManualModal();
        return;
      }

      const entry = media.mediaListEntry;
      trackedProgress = entry ? entry.progress : -1;

      if (!entry) {
        p.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <a href="https://anilist.co/anime/${media.id}" target="_blank" style="color:var(--al-blue);font-size:12px;font-weight:700;text-decoration:none;">AniList #${media.id}</a>
            <button type="button" class="al-step-btn" id="al-man-btn" title="Cambia ID">🔗</button>
          </div>
          <button type="button" class="al-action-btn" id="al-add-btn">➕ Aggiungi a Watching</button>`;
        p.querySelector("#al-add-btn").onclick = () => App.setProgress(media, 0);
        p.querySelector("#al-man-btn").onclick = () => UI.openManualModal();
        return;
      }

      const total = media.episodes || 0;
      p.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <a href="https://anilist.co/anime/${media.id}" target="_blank" style="color:var(--al-blue);font-size:12px;font-weight:700;text-decoration:none;">AniList #${media.id}</a>
          <div style="display:flex;gap:4px;">
            <button type="button" class="al-step-btn" id="al-man-btn" title="Cambia ID">🔗</button>
            <button type="button" class="al-step-btn" id="al-del-btn" style="color:#f87171;" title="Rimuovi">🗑️</button>
          </div>
        </div>
        <select class="al-select" id="al-stat-sel">
          ${Object.entries(API.statuses).map(([k, v]) => `<option value="${k}" ${entry.status === k ? "selected" : ""}>${v}</option>`).join("")}
        </select>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#94a3b8;margin-top:2px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span>Ep: <b>${entry.progress}</b>${total ? "/" + total : ""}</span>
            <button type="button" class="al-step-btn" id="al-minus" ${entry.progress <= 0 ? "disabled" : ""}>-</button>
            <button type="button" class="al-step-btn" id="al-plus">+</button>
          </div>
          <select id="al-score-sel" style="background:#0e1622;color:#fff;border:1px solid var(--al-border);border-radius:4px;padding:2px 4px;font-size:11px;">
            <option value="0">-</option>
            ${[1,2,3,4,5,6,7,8,9,10].map(s => `<option value="${s}" ${entry.score === s ? "selected" : ""}>★ ${s}</option>`).join("")}
          </select>
        </div>`;

      p.querySelector("#al-man-btn").onclick = () => UI.openManualModal();
      p.querySelector("#al-del-btn").onclick = async () => {
        if (confirm("Rimuovere dalla lista AniList?") && await API.deleteEntry(entry.id)) {
          UI.toast("Serie rimossa");
          App.sync();
        }
      };
      p.querySelector("#al-minus").onclick = () => entry.progress > 0 && App.setProgress(media, entry.progress - 1);
      p.querySelector("#al-plus").onclick = () => App.setProgress(media, entry.progress + 1);
      p.querySelector("#al-stat-sel").onchange = async (e) => {
        if (await API.saveEntry({ mediaId: media.id, status: e.target.value })) {
          UI.toast("Stato: " + API.statuses[e.target.value]);
          App.sync();
        }
      };
      p.querySelector("#al-score-sel").onchange = async (e) => {
        const sc = parseFloat(e.target.value);
        if (await API.saveEntry({ mediaId: media.id, score: sc })) {
          UI.toast(sc ? `Voto: ${sc}/10` : "Voto rimosso");
        }
      };
    },

    // Tasto rapido sotto la griglia episodi (non viene mostrato se già in pari con gli episodi!)
    renderNextEpisode(media) {
      document.getElementById("al-next-ep-wrap")?.remove();
      if (!media?.mediaListEntry) return;

      const epWrapper = document.querySelector(".episode-wrapper");
      if (!epWrapper) return;

      const eps = Array.from(epWrapper.querySelectorAll(".episode-item"));
      const prog = media.mediaListEntry.progress;
      const nextEp = prog + 1;
      const prevEp = prog - 1;

      // Verifica se il prossimo episodio esiste nella griglia attuale di AnimeUnity
      const hasNext = eps.some(el => parseInt(el.innerText.trim()) === nextEp);
      const isCompleted = media.episodes ? prog >= media.episodes : false;

      // Se non c'è il prossimo e non si può andare indietro, non mostrare nulla
      if (!hasNext && prog <= 0 && !isCompleted) return;

      const wrap = document.createElement("div");
      wrap.id = "al-next-ep-wrap";
      wrap.className = "al-next-ep-box";

      let html = "";
      if (prog > 0) {
        html += `<button type="button" class="al-btn-prev" id="al-btn-prev">↶ Ep. ${prevEp} (-1)</button>`;
      }

      if (hasNext && !isCompleted) {
        html += `<button type="button" class="al-btn-next" id="al-btn-next">✓ Segna Ep. ${nextEp} (+1)</button>`;
      } else if (isCompleted) {
        html += `<span class="al-badge-done">🎉 Serie completata</span>`;
      } else if (!hasNext && prog > 0) {
        html += `<span class="al-badge-done">✓ Sei in pari con gli episodi</span>`;
      }

      wrap.innerHTML = html;

      wrap.querySelector("#al-btn-prev")?.addEventListener("click", () => App.setProgress(media, prevEp));
      wrap.querySelector("#al-btn-next")?.addEventListener("click", () => App.setProgress(media, nextEp));

      epWrapper.after(wrap);
    },

    async sync() {
      if (!Storage.get("anilist_token")) return App.renderPanel(null);

      const manualId = Storage.get("al_manual_" + window.location.pathname);
      if (manualId) {
        const data = await API.getMediaById(manualId);
        currentMedia = data?.Media || null;
      } else if (currentTitle) {
        const cleaned = cleanTitle(currentTitle);
        let data = await API.getMedia(cleaned);
        if (!data?.Media && cleaned !== currentTitle) data = await API.getMedia(currentTitle);
        currentMedia = data?.Media || null;
      }

      App.renderPanel(currentMedia);
      App.renderNextEpisode(currentMedia);
    },

    init() {
      UI.initStyles();
      App.loadUser();

      // Chiusura dropdown se si clicca all'esterno
      document.addEventListener("click", () => document.querySelectorAll(".al-dropdown").forEach(d => d.classList.remove("show")));

      // Scorciatoie tastiera: Shift+S (+1 ep), Shift+Z (-1 ep)
      document.addEventListener("keydown", (e) => {
        if (e.shiftKey && !["INPUT", "TEXTAREA"].includes(e.target.tagName) && currentMedia?.mediaListEntry) {
          if (e.key === "S" || e.key === "s") App.setProgress(currentMedia, currentMedia.mediaListEntry.progress + 1);
          if ((e.key === "Z" || e.key === "z") && currentMedia.mediaListEntry.progress > 0) App.setProgress(currentMedia, currentMedia.mediaListEntry.progress - 1);
        }
      });

      // Loop di polling per navigazione SPA AnimeUnity ed evidenziazione episodi
      setInterval(() => {
        const titleEl = document.querySelector("#anime .title, h1.title");
        if (titleEl && titleEl.innerText.trim() !== currentTitle) {
          currentTitle = titleEl.innerText.trim();
          App.sync();
        }

        // Ripristino nav se rigenerata da Vue
        if (!document.getElementById("al-nav-desktop") || (!document.getElementById("al-nav-mobile") && document.querySelector(".nav-top-mobile"))) {
          App.renderNav();
        }

        // Pulizia elementi nativi AnimeUnity in .actions
        const act = document.querySelector(".cover-wrap .actions");
        if (act) act.querySelectorAll(":scope > *:not(#al-panel)").forEach(el => el.remove());

        // Evidenziazione episodi nella griglia
        if (trackedProgress > -1) {
          document.querySelectorAll(".episode-item").forEach(el => {
            const num = parseInt(el.innerText.trim());
            el.classList.toggle("al-highlight", num === trackedProgress);
            el.classList.toggle("al-done", num < trackedProgress);
          });
        }
      }, 500);
    }
  };

  App.init();
})();