// ==UserScript==
// @name         AniList Friend List - Quick Add & Sync
// @namespace    https://github.com/pallax03/my-userscripts
// @version      1.3.1
// @author       Alex Mazzoni
// @description  Add and sync anime directly from a friend's AniList list into your collection with color-coded split buttons
// @license      MIT
// @source       https://github.com/pallax03/my-userscripts.git
// @downloadURL  https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/import-friend-anilist.user.js
// @updateURL    https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/import-friend-anilist.user.js
// @match        *://anilist.co/user/*/animelist*
// @grant        GM_addStyle
// @grant        GM_deleteValue
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

(function() {
	"use strict";
	var s = new Set();
	var _css = async (t) => {
		if (s.has(t)) return;
		s.add(t);
		((c) => {
			if (typeof GM_addStyle === "function") GM_addStyle(c);
			else (document.head || document.documentElement).appendChild(document.createElement("style")).append(c);
		})(t);
	};
	_css(".al-card-open{z-index:999999!important;overflow:visible!important}.al-friend-bar{z-index:99990;border:1.5px solid #2a3d54;border-radius:30px;align-items:center;gap:12px;padding:8px 18px;font-family:inherit;display:flex;position:fixed;bottom:16px;left:50%;transform:translate(-50%);box-shadow:0 12px 36px #000000d9;background:#111a26!important}.al-friend-bar b{color:#fff}.al-avatar{object-fit:cover;vertical-align:middle;border:1.5px solid #3db4f2;border-radius:50%;flex-shrink:0;width:22px;height:22px;display:inline-block}.al-filter-label{color:#e2e8f0;cursor:pointer;-webkit-user-select:none;user-select:none;align-items:center;gap:6px;font-size:13px;font-weight:600;display:inline-flex}.al-filter-label input{cursor:pointer;accent-color:#3db4f2;width:15px;height:15px}.al-select{cursor:pointer;outline:none;padding:5px 8px;font-size:12px;font-weight:700;color:#fff!important;background:#0b1622!important;border:1.5px solid #3db4f2!important;border-radius:6px!important}.al-split-box{z-index:10;border:1.5px solid #0000;box-sizing:border-box!important;border-radius:6px!important;align-items:stretch!important;height:26px!important;min-height:26px!important;display:inline-flex!important;position:relative!important;overflow:visible!important}.al-split-box.is-open{z-index:999999!important}.entry-card,.media-card,.entry-card .cover,.media-card .cover{position:relative!important}.entry-card:hover .cover img,.media-card:hover .cover img{transition:transform .25s;transform:scale(1.04)}.entry-card .al-split-box,.media-card .al-split-box,.entry-card .cover .al-split-box,.cover .al-split-box{-webkit-backdrop-filter:blur(8px)!important;backdrop-filter:blur(8px)!important;z-index:99999!important;pointer-events:auto!important;border-radius:4px!important;width:auto!important;max-width:calc(100% - 16px)!important;height:22px!important;min-height:22px!important;margin:0!important;transition:opacity .2s!important;position:absolute!important;inset:8px 8px auto auto!important;box-shadow:0 4px 14px #000c!important}.entry-card .al-split-box.is-added,.media-card .al-split-box.is-added{opacity:1!important;pointer-events:auto!important}@media (hover:hover){.entry-card .al-split-box:not(.is-added),.media-card .al-split-box:not(.is-added){opacity:0;pointer-events:none}.entry-card:hover .al-split-box:not(.is-added),.media-card:hover .al-split-box:not(.is-added),.entry-card .al-split-box.is-open,.media-card .al-split-box.is-open{opacity:1!important;pointer-events:auto!important}}.entry-card .al-btn-main,.media-card .al-btn-main{height:19px!important;padding:0 6px!important;font-size:10px!important;line-height:19px!important}.entry-card .al-btn-arrow,.media-card .al-btn-arrow{flex:0 0 18px!important;width:18px!important;height:19px!important;font-size:8px!important;line-height:19px!important}.title .al-split-box{vertical-align:middle!important;width:auto!important;height:22px!important;min-height:22px!important;margin-left:8px!important;display:inline-flex!important}.title .al-split-box .al-btn-main{padding:0 7px!important;font-size:10px!important}.title .al-split-box .al-btn-arrow{flex:0 0 20px!important;width:20px!important;font-size:9px!important}.al-btn-main{cursor:pointer;white-space:nowrap;text-overflow:ellipsis;flex:auto;gap:4px;transition:background .15s;overflow:hidden;color:inherit!important;background:0 0!important;border:none!important;border-right:1px solid #fff3!important;border-radius:4px 0 0 4px!important;justify-content:center!important;align-items:center!important;height:100%!important;padding:0 8px!important;font-size:11px!important;font-weight:700!important;text-decoration:none!important;display:flex!important}.al-btn-main:hover{background:#ffffff1f!important}.al-btn-arrow{cursor:pointer;transition:background .15s;width:24px!important;color:inherit!important;background:0 0!important;border:none!important;border-radius:0 4px 4px 0!important;flex:0 0 24px!important;justify-content:center!important;align-items:center!important;height:100%!important;padding:0!important;font-size:10px!important;font-weight:900!important;display:flex!important}.al-btn-arrow:hover{background:#ffffff26!important}.al-stat-drop{box-sizing:border-box;border:1.5px solid #2a3d54;border-radius:8px;flex-direction:column;gap:2px;min-width:165px;padding:4px;display:none;position:absolute;top:calc(100% + 4px);right:0;overflow:hidden;box-shadow:0 12px 36px #000000f2;z-index:999999!important;background:#0e1622!important}.al-stat-drop.show{display:flex!important}.al-drop-opt{text-align:left;cursor:pointer;box-sizing:border-box;border-radius:5px;align-items:center;gap:8px;width:100%;padding:6px 10px;font-size:11px;font-weight:700;transition:all .12s;display:flex;color:#f1f5f9!important;background:#111a26!important;border:1px solid #0000!important}.al-drop-opt:hover{background:#192738!important;border-color:#3db4f2!important}.al-drop-opt .dot{border-radius:50%;flex-shrink:0;width:8px;height:8px;display:inline-block}.al-drop-del{margin-top:2px;color:#f87171!important;border-top:1px solid #2a3d54!important}.al-drop-del:hover{background:#331518!important;border-color:#ef4444!important}.al-toast{color:#fff;z-index:1000000;pointer-events:none;background:#0e1a29;border:1.5px solid #3db4f2;border-left-width:5px;border-radius:8px;padding:10px 20px;font-size:13px;font-weight:700;position:fixed;bottom:85px;left:50%;transform:translate(-50%);box-shadow:0 10px 30px #000000d9}.al-toast.alert{border-color:#ef4444}.al-overlay{-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);z-index:999999;background:#000c;justify-content:center;align-items:center;display:flex;position:fixed;inset:0}.al-modal{color:#fff;background:#111a26;border:1.5px solid #2a3d54;border-radius:12px;width:90%;max-width:420px;padding:20px}.al-card-hidden{display:none!important}@media (width<=768px){.al-friend-bar{border-radius:16px;justify-content:space-between;gap:8px;width:calc(100% - 24px);max-width:420px;padding:8px 12px;bottom:12px}.al-friend-bar span,.al-filter-label{font-size:11px}.al-select{padding:3px 6px;font-size:11px}}");
	var Storage = {
		get: (k) => {
			try {
				if (typeof GM_getValue === "function") {
					const val = GM_getValue(k);
					if (val !== void 0 && val !== null) return val;
				}
			} catch (_) {}
			try {
				return localStorage.getItem(k);
			} catch (_) {
				return null;
			}
		},
		set: (k, v) => {
			try {
				if (typeof GM_setValue === "function") GM_setValue(k, v);
			} catch (_) {}
			try {
				localStorage.setItem(k, v);
			} catch (_) {}
		},
		del: (k) => {
			try {
				if (typeof GM_deleteValue === "function") GM_deleteValue(k);
			} catch (_) {}
			try {
				localStorage.removeItem(k);
			} catch (_) {}
		}
	};
	function showToast(text, isAlert = false, duration = 2200) {
		if (!text) return;
		document.querySelectorAll(".al-toast").forEach((el) => el.remove());
		const el = document.createElement("div");
		el.className = `al-toast ${isAlert ? "alert" : ""}`;
		el.innerText = text;
		document.body.appendChild(el);
		setTimeout(() => {
			el.style.opacity = "0";
			el.style.transition = "opacity 0.3s";
			setTimeout(() => el.remove(), 300);
		}, duration);
	}
	var AniListAPI = {
		url: "https://graphql.anilist.co",
		clientId: "43750",
		oauthUrl: "https://anilist.co/api/v2/oauth/authorize?client_id=43750&response_type=token",
		statuses: {
			CURRENT: "Watching",
			COMPLETED: "Completed",
			PAUSED: "Paused",
			DROPPED: "Dropped",
			PLANNING: "Planning",
			REPEATING: "Rewatching"
		},
		async call(query, variables = {}, { silent = false, onAuthError = null } = {}) {
			const token = Storage.get("anilist_token");
			if (!token) return null;
			try {
				const { data, errors } = await (await fetch(AniListAPI.url, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`
					},
					body: JSON.stringify({
						query,
						variables
					})
				})).json();
				if (errors) {
					const first = errors[0];
					if (first?.status === 401 || first?.message?.includes("Invalid token")) {
						if (!silent) showToast("AniList token invalid or expired", true);
						if (typeof onAuthError === "function") onAuthError();
						return null;
					}
					if (first?.status === 404 || first?.message?.includes("Not Found")) return null;
					throw new Error(first.message);
				}
				return data;
			} catch (err) {
				if (!silent) showToast(`AniList error: ${err.message || "Network"}`, true);
				return null;
			}
		},
		getViewer: (onAuthError) => AniListAPI.call(`query { Viewer { id name avatar { medium } } }`, {}, {
			silent: true,
			onAuthError
		}),
		getMedia: (search) => AniListAPI.call(`query($s:String){Media(search:$s,type:ANIME){id episodes title{romaji english}mediaListEntry{id status score progress startedAt{year month day}completedAt{year month day}}}}`, { s: search }, { silent: true }),
		getMediaById: (id) => AniListAPI.call(`query($id:Int){Media(id:$id,type:ANIME){id episodes title{romaji english}mediaListEntry{id status score progress startedAt{year month day}completedAt{year month day}}}}`, { id: Number(id) }, { silent: true }),
		getUserCollection: (userId) => AniListAPI.call(`query($u:Int){MediaListCollection(userId:$u,type:ANIME){lists{entries{id mediaId status score progress media{id episodes title{romaji english}}}}}}`, { u: userId }, { silent: true }),
		saveEntry: (args) => AniListAPI.call(`mutation($mediaId:Int,$status:MediaListStatus,$score:Float,$progress:Int,$startedAt:FuzzyDateInput,$completedAt:FuzzyDateInput){
        SaveMediaListEntry(mediaId:$mediaId,status:$status,score:$score,progress:$progress,startedAt:$startedAt,completedAt:$completedAt){
          id mediaId status score progress startedAt{year month day} completedAt{year month day}
        }
      }`, args),
		deleteEntry: (id) => AniListAPI.call(`mutation($id:Int){DeleteMediaListEntry(id:$id){deleted}}`, { id })
	};
	var defaultAttributes = {
		xmlns: "http://www.w3.org/2000/svg",
		width: 24,
		height: 24,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		"stroke-width": 2,
		"stroke-linecap": "round",
		"stroke-linejoin": "round"
	};
	var createSVGElement = ([tag, attrs, children]) => {
		const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
		Object.keys(attrs).forEach((name) => {
			element.setAttribute(name, String(attrs[name]));
		});
		if (children?.length) children.forEach((child) => {
			const childElement = createSVGElement(child);
			element.appendChild(childElement);
		});
		return element;
	};
	var createElement = (iconNode, customAttrs = {}) => {
		return createSVGElement([
			"svg",
			{
				...defaultAttributes,
				...customAttrs
			},
			iconNode
		]);
	};
	var Check = [["path", { d: "M20 6 9 17l-5-5" }]];
	var ExternalLink = [
		["path", { d: "M15 3h6v6" }],
		["path", { d: "M10 14 21 3" }],
		["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }]
	];
	var KeyRound = [["path", { d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" }], ["circle", {
		cx: "16.5",
		cy: "7.5",
		r: ".5",
		fill: "currentColor"
	}]];
	function iconHtml(iconNode, attrs = {
		width: 12,
		height: 12
	}) {
		return createElement(iconNode, attrs).outerHTML;
	}
	var getTodayDate = () => {
		const d = new Date();
		return {
			year: d.getFullYear(),
			month: d.getMonth() + 1,
			day: d.getDate()
		};
	};
	var handleUrlToken = () => {
		const params = new URLSearchParams(window.location.search);
		if (params.has("al_token")) {
			Storage.set("anilist_token", params.get("al_token").trim());
			params.delete("al_token");
			const query = params.toString() ? `?${params}` : "";
			window.history.replaceState({}, document.title, window.location.pathname + query + window.location.hash);
		}
	};
	var openTokenModal = (onTokenSaved) => {
		document.getElementById("al-modal")?.remove();
		const wrap = document.createElement("div");
		wrap.id = "al-modal";
		wrap.className = "al-overlay";
		wrap.innerHTML = `
    <div class="al-modal">
      <div class="al-modal-header">
        <div class="al-modal-icon">
          ${iconHtml(KeyRound, {
			width: 22,
			height: 22
		})}
        </div>
        <div>
          <h3 class="al-modal-title">Connect AniList</h3>
          <p class="al-modal-subtitle">Authorize access to sync episodes and lists</p>
        </div>
      </div>

      <div class="al-modal-body">
        <a href="${AniListAPI.oauthUrl}" target="_blank" rel="noopener noreferrer" class="al-auth-link">
          <span class="d-flex align-items-center" style="gap:8px;">
            ${iconHtml(ExternalLink, {
			width: 14,
			height: 14
		})}
            <span>1. Open AniList Authorization</span>
          </span>
          <span class="al-auth-tag">OAuth</span>
        </a>
        <p class="al-auth-hint">Authorize access, copy the generated token and paste it below:</p>

        <div class="al-input-group">
          <input type="password" id="al-tok-in" placeholder="Paste access token here..." value="${Storage.get("anilist_token") || ""}" autocomplete="off" spellcheck="false" />
        </div>
      </div>

      <div class="al-modal-actions">
        <button type="button" class="al-btn secondary" id="al-m-cancel">Cancel</button>
        <button type="button" class="al-btn primary" id="al-m-ok">
          ${iconHtml(Check, {
			width: 14,
			height: 14
		})}
          <span>Save Token</span>
        </button>
      </div>
    </div>`;
		document.body.appendChild(wrap);
		const input = wrap.querySelector("#al-tok-in");
		input.focus();
		input.onkeydown = (e) => {
			if (e.key === "Enter") wrap.querySelector("#al-m-ok").click();
			if (e.key === "Escape") wrap.remove();
		};
		wrap.querySelector("#al-m-cancel").onclick = () => wrap.remove();
		wrap.querySelector("#al-m-ok").onclick = async () => {
			const val = input.value.trim();
			if (val) {
				Storage.set("anilist_token", val);
				showToast("Token saved");
				wrap.remove();
				if (typeof onTokenSaved === "function") await onTokenSaved();
			}
		};
	};
	var STATUS_CONFIG = {
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
	handleUrlToken();
	var currentUser = null;
	var userEntries = new Map();
	var hideAlreadyAdded = false;
	var App = {
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
			if (!Storage.get("anilist_token")) {
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
				for (const list of listData.MediaListCollection.lists) for (const entry of list.entries) userEntries.set(entry.mediaId, entry);
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
          ${Object.entries(STATUS_CONFIG).map(([k, cfg]) => `<option value="${k}" ${defAct === k ? "selected" : ""}>${cfg.name}</option>`).join("")}
        </select>
      </label>`;
			bar.querySelector("#al-hide-chk").onchange = (e) => {
				hideAlreadyAdded = e.target.checked;
				App.applyVisibilityFilter();
			};
			bar.querySelector("#al-default-sel").onchange = (e) => {
				const newAct = e.target.value;
				App.setDefaultAction(newAct);
				showToast(`Default action: ${(STATUS_CONFIG[newAct] || STATUS_CONFIG.PLANNING).name}`);
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
			if (delBtn) delBtn.style.display = isAdded ? "flex" : "none";
		},
		async handleSave(mediaId, status, totalEpisodes = null) {
			const isCompleted = status === "COMPLETED";
			const params = {
				mediaId,
				status,
				progress: isCompleted ? totalEpisodes || 0 : void 0
			};
			if (isCompleted) {
				params.completedAt = getTodayDate();
				params.startedAt = getTodayDate();
			}
			const res = await AniListAPI.saveEntry(params);
			if (res?.SaveMediaListEntry) {
				userEntries.set(mediaId, res.SaveMediaListEntry);
				showToast(`✓ Added as ${(STATUS_CONFIG[status] || STATUS_CONFIG.PLANNING).name}`);
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
				if ((await AniListAPI.deleteEntry(entryId))?.DeleteMediaListEntry?.deleted) {
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
        ${Object.entries(STATUS_CONFIG).map(([k, cfg]) => `
          <button type="button" class="al-drop-opt" data-status="${k}">
            <span class="dot" style="background:${cfg.dot}"></span>
            <span>${cfg.name}</span>
          </button>
        `).join("")}
        <button type="button" class="al-drop-opt al-drop-del" data-del="1" style="display:${isAdded ? "flex" : "none"};">
          <span>🗑️ Remove from list</span>
        </button>
      </div>`;
			App.applyButtonTheme(box, currentStatus, isAdded);
			const drop = box.querySelector(".al-stat-drop");
			const arrowBtn = box.querySelector(".al-btn-arrow");
			const mainBtn = box.querySelector(".al-btn-main");
			const toggleDropdown = (forceState) => {
				const willOpen = forceState !== void 0 ? forceState : !drop.classList.contains("show");
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
				if (!userEntries.has(mediaId)) App.handleSave(mediaId, App.getDefaultAction(), totalEpisodes);
				else toggleDropdown();
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
			if (delBtn) delBtn.onclick = (e) => {
				e.preventDefault();
				e.stopPropagation();
				toggleDropdown(false);
				const curEntry = userEntries.get(mediaId);
				if (curEntry) {
					App.handleDelete(mediaId, curEntry.id);
					delBtn.style.display = "none";
				}
			};
			const isGridCard = container.classList.contains("entry-card") || container.classList.contains("media-card");
			const titleCell = container.querySelector(".title");
			if (isGridCard) {
				container.style.position = "relative";
				container.appendChild(box);
			} else if (titleCell) {
				const titleLink = titleCell.querySelector("a");
				if (titleLink) titleLink.after(box);
				else titleCell.appendChild(box);
			} else {
				container.style.position = "relative";
				container.appendChild(box);
			}
			if (hideAlreadyAdded && isAdded) container.classList.add("al-card-hidden");
		},
		scanAndEnhanceDOM() {
			if (!App.isFriendList() || !currentUser) return;
			document.querySelectorAll("a[href*=\"/anime/\"]").forEach((link) => {
				const match = link.getAttribute("href").match(/\/anime\/(\d+)/);
				if (!match) return;
				const mediaId = parseInt(match[1], 10);
				const card = link.closest(".entry-card, .media-card, .entry, .row");
				if (card && !card.querySelector(".al-split-box")) {
					let totalEp = null;
					const epMatch = card.innerText.match(/\/\s*(\d+)/);
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
				} else if (App.isFriendList() && currentUser) App.scanAndEnhanceDOM();
			}, 700);
		}
	};
	App.init();
})();
