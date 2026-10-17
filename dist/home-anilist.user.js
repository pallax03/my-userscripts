// ==UserScript==
// @name         AnimeUnity Home - AniList Continue Watching
// @namespace    https://github.com/pallax03/my-userscripts
// @version      1.0.0
// @author       Alex Mazzoni
// @description  Personalized AnimeUnity homepage with AniList Continue Watching shelf, release tracker, and quick progress
// @license      MIT
// @source       https://github.com/pallax03/my-userscripts.git
// @downloadURL  https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/home-anilist.user.js
// @updateURL    https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/home-anilist.user.js
// @match        *://*.animeunity.so/*
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
	_css(".al-badge{white-space:nowrap;-webkit-backdrop-filter:blur(8px);border:1px solid #0000;border-radius:6px;align-items:center;gap:5px;padding:3px 8px;font-size:11px;font-weight:700;line-height:1.2;display:inline-flex}.al-badge svg{flex-shrink:0}.al-badge.al-badge-CURRENT{color:#76caf6;background:#3db4f229;border-color:#3db4f273}.al-badge.al-badge-CURRENT .al-dot{background:#3db4f2;box-shadow:0 0 6px #3db4f299}.al-badge.al-badge-PLANNING{color:#b9c3d0;background:#94a3b829;border-color:#94a3b873}.al-badge.al-badge-PLANNING .al-dot{background:#94a3b8;box-shadow:0 0 6px #94a3b899}.al-badge.al-badge-COMPLETED{color:#45df7e;background:#22c55e29;border-color:#22c55e73}.al-badge.al-badge-COMPLETED .al-dot{background:#22c55e;box-shadow:0 0 6px #22c55e99}.al-badge.al-badge-PAUSED{color:#f8c937;background:#eab30829;border-color:#eab30873}.al-badge.al-badge-PAUSED .al-dot{background:#eab308;box-shadow:0 0 6px #eab30899}.al-badge.al-badge-REPEATING{color:#1fd9f9;background:#06b6d429;border-color:#06b6d473}.al-badge.al-badge-REPEATING .al-dot{background:#06b6d4;box-shadow:0 0 6px #06b6d499}.al-badge.al-badge-DROPPED{color:#f47c7c;background:#ef444429;border-color:#ef444473}.al-badge.al-badge-DROPPED .al-dot{background:#ef4444;box-shadow:0 0 6px #ef444499}.al-dot{border-radius:50%;flex-shrink:0;width:6px;height:6px;display:inline-block}.al-btn{cursor:pointer;white-space:nowrap;border:1px solid #0000;border-radius:9px;justify-content:center;align-items:center;gap:6px;padding:8px 16px;font-size:13px;font-weight:700;text-decoration:none;transition:all .2s cubic-bezier(.4,0,.2,1);display:inline-flex}.al-btn:hover{text-decoration:none;transform:translateY(-1px)}.al-btn:active{transform:translateY(0)}.al-btn.primary{background:linear-gradient(135deg,#3db4f2 0%,#0284c7 100%);box-shadow:0 4px 14px #3db4f259;color:#06101e!important}.al-btn.primary:hover{filter:brightness(1.08);box-shadow:0 6px 20px #3db4f28c;color:#06101e!important}.al-btn.secondary{background:#ffffff14;border-color:#ffffff26;color:#e2e8f0!important}.al-btn.secondary:hover{background:#ffffff24;color:#fff!important}.al-btn.danger{background:#ef444426;border-color:#ef444459;color:#fca5a5!important}.al-btn.danger:hover{background:#ef444447;border-color:#ef4444;color:#fff!important}.al-overlay{-webkit-backdrop-filter:blur(16px);background:#03070dd1;justify-content:center;align-items:center;animation:.2s al-fade-in;display:flex;position:fixed;inset:0;z-index:999999!important}.al-modal{color:#fff;box-sizing:border-box;background:linear-gradient(135deg,#101a27 0%,#080f18 100%);border:1px solid #3db4f259;border-radius:16px;width:90%;max-width:440px;padding:24px;animation:.25s cubic-bezier(.16,1,.3,1) al-modal-in;box-shadow:0 20px 60px #000000d9,0 0 30px #3db4f22e}.al-modal .al-modal-header{align-items:center;gap:14px;margin-bottom:18px;display:flex}.al-modal .al-modal-icon{color:#3db4f2;background:linear-gradient(135deg,#3db4f233,#0284c71a);border:1px solid #3db4f266;border-radius:12px;flex-shrink:0;justify-content:center;align-items:center;width:44px;height:44px;display:flex;box-shadow:0 0 15px #3db4f24d}.al-modal .al-modal-title{color:#fff;margin:0;font-size:18px;font-weight:700;line-height:1.2}.al-modal .al-modal-subtitle{color:#94a3b8;margin:3px 0 0;font-size:12px;line-height:1.3}.al-modal .al-modal-body{flex-direction:column;gap:12px;display:flex}.al-modal .al-modal-actions{justify-content:flex-end;align-items:center;gap:10px;margin-top:20px;display:flex}.al-auth-link{background:linear-gradient(135deg,#3db4f226,#0ea5e914);border:1px solid #3db4f259;border-radius:10px;justify-content:space-between;align-items:center;padding:11px 14px;font-size:13px;font-weight:700;text-decoration:none;transition:all .2s;display:flex;color:#3db4f2!important}.al-auth-link .al-auth-tag{color:#06101e;text-transform:uppercase;background:#3db4f2;border-radius:5px;padding:2px 6px;font-size:10px;font-weight:900}.al-auth-link:hover{background:linear-gradient(135deg,#3db4f240,#0ea5e929);border-color:#3db4f2}.al-auth-hint{color:#94a3b8;margin:0;font-size:12px;line-height:1.4}.al-input-group input{box-sizing:border-box;color:#fff;background:#0d1521d9;border:1px solid #3db4f259;border-radius:10px;outline:none;width:100%;padding:10px 14px;font-size:13px;transition:all .2s}.al-input-group input:focus{border-color:#3db4f2;box-shadow:0 0 15px #3db4f24d}.al-prefs-modal{max-width:460px!important}.al-prefs-modal .al-prefs-body{flex-direction:column;gap:12px;display:flex}.al-prefs-modal .al-pref-group{background:#ffffff08;border:1px solid #ffffff14;border-radius:12px;flex-direction:column;transition:background .25s,border-color .25s,box-shadow .25s;display:flex;overflow:hidden}.al-prefs-modal .al-pref-group.is-active{background:#3db4f20a;border-color:#3db4f259;box-shadow:0 4px 16px #0000004d}.al-prefs-modal .al-pref-group.is-active .al-pref-header{border-bottom:1px solid #3db4f226}.al-prefs-modal .al-pref-group .al-pref-header{cursor:pointer;justify-content:space-between;align-items:center;gap:14px;margin:0;padding:12px 14px;transition:background .15s;display:flex}.al-prefs-modal .al-pref-group .al-pref-header:hover{background:#ffffff08}.al-prefs-modal .al-pref-group .al-pref-info{flex-direction:column;gap:2px;display:flex}.al-prefs-modal .al-pref-group .al-pref-title{color:#f1f5f9;font-size:13px;font-weight:600}.al-prefs-modal .al-pref-group .al-pref-desc{color:#94a3b8;font-size:11px;font-weight:500}.al-prefs-modal .al-pref-group .al-pref-sub{background:#080e1799;flex-direction:column;gap:12px;padding:12px 14px;animation:.22s cubic-bezier(.16,1,.3,1) al-slide-down;display:flex}.al-prefs-modal .al-pref-group .al-pref-sub.is-hidden{display:none!important}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row{color:#cbd5e1;cursor:pointer;justify-content:space-between;align-items:center;gap:12px;margin:0;font-size:12px;font-weight:500;display:flex}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-pref-sub-label{color:#94a3b8;align-items:center;gap:8px;display:flex}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-pref-sub-label svg{color:#3db4f2}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-select-xs{color:#f1f5f9;cursor:pointer;background:#0e1622f2;border:1px solid #ffffff29;border-radius:7px;outline:none;padding:4px 8px;font-size:12px;font-weight:600}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-select-xs:hover,.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-select-xs:focus{border-color:#3db4f2}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-checkbox{accent-color:#3db4f2;cursor:pointer;width:16px;height:16px}.al-prefs-modal .al-switch{appearance:none;cursor:pointer;background:#ffffff29;border-radius:12px;outline:none;flex-shrink:0;width:36px;height:20px;transition:background .2s;position:relative}.al-prefs-modal .al-switch:after{content:\"\";background:#fff;border-radius:50%;width:16px;height:16px;transition:transform .2s cubic-bezier(.16,1,.3,1);position:absolute;top:2px;left:2px;box-shadow:0 1px 3px #0006}.al-prefs-modal .al-switch:checked{background:#3db4f2}.al-prefs-modal .al-switch:checked:after{background:#06101e;transform:translate(16px)}.al-prefs-modal .al-avatar-sm{object-fit:cover;border:1px solid #3db4f2;border-radius:50%;width:22px;height:22px;box-shadow:0 0 6px #3db4f24d}.al-prefs-modal .al-btn-logout{padding:5px 10px;font-size:11px;color:#fca5a5!important;border-color:#ef44444d!important}.al-prefs-modal .al-btn-logout:hover{color:#fff!important;background:#ef444433!important;border-color:#ef4444!important}.al-toast{-webkit-backdrop-filter:blur(12px);color:#fff;pointer-events:none;background:#0e1a29f2;border:1px solid #3db4f2;border-left-width:4px;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:700;animation:.2s cubic-bezier(.16,1,.3,1) al-modal-in;position:fixed;bottom:85px;left:50%;transform:translate(-50%);box-shadow:0 12px 36px #000000d9,0 0 16px #3db4f240;z-index:1000000!important}.al-toast.alert{border-color:#ef4444;box-shadow:0 12px 36px #000000d9,0 0 16px #ef444440}@keyframes al-modal-in{0%{opacity:0;transform:translateY(10px)scale(.97)}to{opacity:1;transform:translateY(0)scale(1)}}@keyframes al-fade-in{0%{opacity:0}to{opacity:1}}@keyframes al-slide-down{0%{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}.al-home-shelf-row{width:100%;margin-top:10px;margin-bottom:24px}.al-home-shelf{-webkit-backdrop-filter:blur(16px);background:#0e16228c;border:1px solid #ffffff14;border-radius:14px;width:100%;padding:16px 20px;box-shadow:0 8px 32px #00000040}@media (width<=576px){.al-home-shelf{padding:14px 12px}}.al-shelf-header{border-bottom:1px solid #ffffff0f;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;padding-bottom:12px;display:flex}.al-shelf-title-wrap{align-items:center;gap:10px;display:flex}.al-shelf-title-wrap .al-shelf-icon{color:#3db4f2;background:#3db4f226;border-radius:8px;justify-content:center;align-items:center;width:28px;height:28px;display:flex;box-shadow:0 0 10px #3db4f240}.al-shelf-title-wrap .al-shelf-title{letter-spacing:.6px;text-transform:uppercase;color:#fff;margin:0;font-size:1.15rem;font-weight:800;line-height:1}.al-shelf-title-wrap .al-shelf-count{color:#94a3b8;background:#ffffff14;border:1px solid #ffffff0f;border-radius:10px;justify-content:center;align-items:center;padding:2px 8px;font-size:11px;font-weight:700;display:inline-flex}.al-shelf-controls{align-items:center;gap:12px;display:flex}.al-shelf-pref-btn{color:#94a3b8;cursor:pointer;background:#ffffff0d;border:1px solid #ffffff14;border-radius:8px;justify-content:center;align-items:center;width:28px;height:28px;transition:all .2s;display:flex}.al-shelf-pref-btn:hover{color:#3db4f2;background:#3db4f226;border-color:#3db4f259}.al-shelf-filter{cursor:pointer;-webkit-user-select:none;user-select:none;background:#ffffff0a;border:1px solid #ffffff0f;border-radius:8px;align-items:center;gap:8px;padding:5px 10px;transition:all .2s;display:inline-flex}.al-shelf-filter:hover{background:#ffffff12;border-color:#ffffff1f}.al-shelf-filter .al-shelf-toggle-box{background:#ffffff26;border-radius:10px;width:32px;height:18px;transition:background-color .2s;position:relative}.al-shelf-filter .al-shelf-toggle-box.active{background:#3db4f2;box-shadow:0 0 8px #3db4f266}.al-shelf-filter .al-shelf-toggle-box .al-shelf-toggle-knob{background:#fff;border-radius:50%;width:14px;height:14px;transition:transform .2s cubic-bezier(.16,1,.3,1);position:absolute;top:2px;left:2px}.al-shelf-filter .al-shelf-toggle-box .al-shelf-toggle-knob.active{transform:translate(14px)}.al-shelf-filter .al-shelf-filter-label{color:#cbd5e1;align-items:center;gap:5px;font-size:11.5px;font-weight:600;display:flex}.al-shelf-filter .al-shelf-unwatched-pill{color:#3db4f2;background:#3db4f233;border-radius:6px;padding:1px 6px;font-size:10px;font-weight:700}.al-shelf-nav{align-items:center;gap:6px;display:flex}.al-shelf-nav .al-shelf-arrow{color:#94a3b8;cursor:pointer;background:#ffffff0d;border:1px solid #ffffff14;border-radius:8px;justify-content:center;align-items:center;width:28px;height:28px;transition:all .2s;display:flex}.al-shelf-nav .al-shelf-arrow:hover:not(:disabled){color:#fff;background:#ffffff1f;border-color:#fff3}.al-shelf-nav .al-shelf-arrow:disabled{opacity:.3;cursor:not-allowed}.al-shelf-carousel-wrap{width:100%;position:relative}.al-shelf-track{scroll-snap-type:x mandatory;scroll-behavior:smooth;scrollbar-width:thin;scrollbar-color:#3db4f24d transparent;gap:16px;padding:4px 2px 14px;display:flex;overflow-x:auto}.al-shelf-track::-webkit-scrollbar{height:6px}.al-shelf-track::-webkit-scrollbar-track{background:#ffffff08;border-radius:4px}.al-shelf-track::-webkit-scrollbar-thumb{background:#3db4f24d;border-radius:4px}.al-shelf-track::-webkit-scrollbar-thumb:hover{background:#3db4f299}.al-shelf-card{scroll-snap-align:start;background:#121a26d9;border:1px solid #ffffff12;border-radius:12px;flex-direction:column;flex:0 0 175px;width:175px;transition:transform .22s cubic-bezier(.16,1,.3,1),box-shadow .22s,border-color .22s;display:flex;position:relative;overflow:hidden}@media (width<=576px){.al-shelf-card{flex:0 0 150px;width:150px}}.al-shelf-card:hover{border-color:#3db4f259;transform:translateY(-4px);box-shadow:0 12px 24px #00000073}.al-shelf-card:hover .al-card-cover img{transform:scale(1.05)}.al-card-cover{aspect-ratio:2/3;background:#090e16;width:100%;position:relative;overflow:hidden}.al-card-cover img{object-fit:cover;width:100%;height:100%;transition:transform .3s;display:block}.al-card-badge-top-left{z-index:3;position:absolute;top:8px;left:8px}.al-card-badge-top-right{z-index:3;position:absolute;top:8px;right:8px}.al-card-al-link{color:#94a3b8;-webkit-backdrop-filter:blur(6px);background:#0a0e16bf;border:1px solid #ffffff26;border-radius:6px;justify-content:center;align-items:center;width:24px;height:24px;text-decoration:none;transition:all .2s;display:flex}.al-card-al-link:hover{color:#fff;background:#3db4f2;border-color:#3db4f2;box-shadow:0 0 8px #3db4f280}.al-card-cover-overlay{z-index:2;background:linear-gradient(#0000 0%,#090e1699 40%,#090e16f2 100%);flex-direction:column;gap:4px;padding:24px 8px 6px;display:flex;position:absolute;bottom:0;left:0;right:0}.al-card-progress-text{color:#e2e8f0;text-shadow:0 1px 3px #000c;justify-content:space-between;align-items:center;font-size:10px;font-weight:700;display:flex}.al-card-progress-bar{background:#ffffff2e;border-radius:2px;width:100%;height:4px;overflow:hidden}.al-card-progress-fill{background:#3db4f2;border-radius:2px;height:100%;transition:width .3s}.al-card-body{background:#0e141e99;flex-direction:column;flex:1;justify-content:space-between;gap:10px;padding:10px 10px 12px;display:flex}.al-card-title{color:#f1f5f9;-webkit-line-clamp:2;text-overflow:ellipsis;-webkit-box-orient:vertical;min-height:32px;font-size:12px;font-weight:600;line-height:1.35;text-decoration:none;transition:color .2s;display:-webkit-box;overflow:hidden}.al-card-title:hover{color:#3db4f2}.al-card-actions{width:100%}.al-card-btn{cursor:pointer;border:none;border-radius:6px;justify-content:center;align-items:center;gap:5px;width:100%;padding:6px 8px;font-size:11.5px;font-weight:700;text-decoration:none;transition:all .2s;display:flex}.al-card-btn.al-btn-play{color:#fff;background:#3db4f2;box-shadow:0 2px 8px #3db4f24d}.al-card-btn.al-btn-play:hover{color:#fff;background:#2ca5e6;box-shadow:0 4px 14px #3db4f280}.al-card-btn.al-btn-caughtup{color:#4ade80;background:#22c55e1f;border:1px solid #22c55e4d}.al-card-btn.al-btn-caughtup:hover{color:#86efac;background:#22c55e38;border-color:#22c55e80}.al-card-btn.al-btn-secondary{color:#94a3b8;background:#ffffff0d;border:1px solid #ffffff14}.al-card-btn.al-btn-secondary:hover{color:#e2e8f0;background:#ffffff1a}.al-shelf-empty{text-align:center;color:#94a3b8;background:#ffffff05;border:1px dashed #ffffff14;border-radius:10px;flex-direction:column;justify-content:center;align-items:center;gap:12px;padding:36px 16px;display:flex}.al-shelf-empty .al-shelf-empty-icon{color:#475569}.al-shelf-empty .al-shelf-empty-title{color:#cbd5e1;font-size:14px;font-weight:700}.al-shelf-empty .al-shelf-empty-desc{color:#64748b;max-width:360px;font-size:12px;line-height:1.5}.al-shelf-skeleton{aspect-ratio:2/3;background:linear-gradient(90deg,#ffffff08 25%,#ffffff14 50%,#ffffff08 75%) 0 0/200% 100%;border-radius:12px;flex:0 0 175px;width:175px;animation:1.5s infinite al-skeleton-shimmer}@media (width<=576px){.al-shelf-skeleton{flex:0 0 150px;width:150px}}@keyframes al-skeleton-shimmer{0%{background-position:200% 0}to{background-position:-200% 0}}");
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
		getUserWatching: (userId) => AniListAPI.call(`query($u:Int){MediaListCollection(userId:$u,type:ANIME,status:CURRENT,sort:UPDATED_TIME_DESC){lists{entries{id mediaId status score progress updatedAt media{id episodes status siteUrl bannerImage coverImage{extraLarge large medium}title{romaji english}nextAiringEpisode{episode airingAt timeUntilAiring}}}}}}`, { u: userId }, { silent: true }),
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
	var ChevronLeft = [["path", { d: "m15 18-6-6 6-6" }]];
	var ChevronRight = [["path", { d: "m9 18 6-6-6-6" }]];
	var Clock = [["circle", {
		cx: "12",
		cy: "12",
		r: "10"
	}], ["path", { d: "M12 6v6l4 2" }]];
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
	var Play = [["path", { d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" }]];
	var SlidersVertical = [
		["path", { d: "M10 8h4" }],
		["path", { d: "M12 21v-9" }],
		["path", { d: "M12 8V3" }],
		["path", { d: "M17 16h4" }],
		["path", { d: "M19 12V3" }],
		["path", { d: "M19 21v-5" }],
		["path", { d: "M3 14h4" }],
		["path", { d: "M5 10V3" }],
		["path", { d: "M5 21v-7" }]
	];
	var Zap = [["path", { d: "M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z" }]];
	function iconHtml(iconNode, attrs = {
		width: 12,
		height: 12
	}) {
		return createElement(iconNode, attrs).outerHTML;
	}
	function createModal({ id = "al-modal-overlay", className = "", icon = null, title = "", subtitle = "", body = "", actions = [], onClose = null } = {}) {
		document.getElementById(id)?.remove();
		const overlay = document.createElement("div");
		overlay.id = id;
		overlay.className = "al-overlay";
		const modal = document.createElement("div");
		modal.className = `al-modal ${className}`.trim();
		const header = document.createElement("div");
		header.className = "al-modal-header";
		header.innerHTML = `
    ${icon ? `<div class="al-modal-icon">${iconHtml(icon, {
			width: 22,
			height: 22
		})}</div>` : ""}
    <div>
      <h3 class="al-modal-title">${title}</h3>
      ${subtitle ? `<p class="al-modal-subtitle">${subtitle}</p>` : ""}
    </div>
  `;
		modal.appendChild(header);
		const bodyEl = document.createElement("div");
		bodyEl.className = "al-modal-body";
		if (typeof body === "string") bodyEl.innerHTML = body;
		else if (body instanceof HTMLElement) bodyEl.appendChild(body);
		modal.appendChild(bodyEl);
		const close = () => {
			document.removeEventListener("keydown", keyHandler);
			overlay.remove();
			if (typeof onClose === "function") onClose();
		};
		const keyHandler = (e) => {
			if (e.key === "Escape") close();
		};
		document.addEventListener("keydown", keyHandler);
		overlay.onclick = (e) => {
			if (e.target === overlay) close();
		};
		const actionsEl = document.createElement("div");
		actionsEl.className = "al-modal-actions";
		const finalActions = actions && actions.length > 0 ? actions : [{
			label: "Done",
			primary: true,
			icon: Check
		}];
		for (const act of finalActions) {
			const btn = document.createElement("button");
			btn.type = "button";
			if (act.id) btn.id = act.id;
			btn.className = `al-btn ${act.primary ? "primary" : act.danger ? "danger" : "secondary"}`.trim();
			btn.innerHTML = `
      ${act.icon ? iconHtml(act.icon, {
				width: 14,
				height: 14
			}) : ""}
      <span>${act.label}</span>
    `;
			btn.onclick = (e) => {
				if (typeof act.onClick === "function") act.onClick({
					close,
					modal,
					overlay,
					event: e
				});
				else close();
			};
			actionsEl.appendChild(btn);
		}
		modal.appendChild(actionsEl);
		overlay.appendChild(modal);
		document.body.appendChild(overlay);
		return {
			overlay,
			modal,
			body: bodyEl,
			close
		};
	}
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
		const { modal, close } = createModal({
			id: "al-token-modal",
			icon: KeyRound,
			title: "Connect AniList",
			subtitle: "Authorize access to sync episodes and lists",
			body: `
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
    `,
			actions: [{
				label: "Cancel",
				secondary: true,
				onClick: ({ close }) => close()
			}, {
				label: "Save Token",
				primary: true,
				icon: Check,
				id: "al-m-ok",
				onClick: async ({ close, modal }) => {
					const val = modal.querySelector("#al-tok-in")?.value.trim();
					if (val) {
						Storage.set("anilist_token", val);
						showToast("Token saved");
						close();
						if (typeof onTokenSaved === "function") await onTokenSaved();
					}
				}
			}]
		});
		const input = modal.querySelector("#al-tok-in");
		input?.focus();
		input?.addEventListener("keydown", (e) => {
			if (e.key === "Enter") modal.querySelector("#al-m-ok")?.click();
		});
	};
	function cleanTitle(title) {
		if (!title) return "";
		return title.replace(/\s*\((ITA|SUB|SUB ITA|DUB|ITA SUB|OVA|TV)\)/gi, "").replace(/\s+(ITA|SUB|DUB)$/gi, "").replace(/\s+\d+(?:st|nd|rd|th)\s+Season/gi, "").replace(/\s+Season\s+\d+/gi, "").replace(/\s+\d+-nensei-hen.*/gi, "").replace(/:\s*2nd\s*&\s*3rd\s*STAGE.*/gi, "").trim();
	}
	function generateSearchCandidates(media) {
		if (!media) return [];
		const candidates = [];
		const eng = media.title?.english;
		const rom = media.title?.romaji;
		if (eng) {
			const cleanEng = cleanTitle(eng);
			if (cleanEng) candidates.push(cleanEng);
			const baseEng = eng.split(/[:\-\d]/)[0].trim();
			if (baseEng.length >= 3) candidates.push(baseEng);
		}
		if (rom) {
			const cleanRom = cleanTitle(rom);
			if (cleanRom) candidates.push(cleanRom);
			const baseRom = rom.split(/[:\-\d]/)[0].trim();
			if (baseRom.length >= 3) candidates.push(baseRom);
			const words = rom.split(/\s+/).slice(0, 3).join(" ").trim();
			if (words.length >= 3) candidates.push(words);
		}
		return [...new Set(candidates.filter((c) => c && c.length >= 3))];
	}
	async function resolveAnimeUnityAnime(media, { preferredDub } = {}) {
		if (!media?.id) return null;
		const prefDubInt = (preferredDub || Storage.get("al_pref_language") || "sub") === "dub" ? 1 : 0;
		const map = Storage.get("al_au_map") || {};
		const cached = map[media.id];
		if (cached?.id && cached?.slug) {
			if (cached.dub === void 0 || cached.dub === prefDubInt || cached.hasAlternativeDub === false) return cached;
		}
		const csrf = document.querySelector("meta[name=\"csrf-token\"]")?.content;
		const candidates = generateSearchCandidates(media);
		for (const query of candidates) try {
			const res = await fetch("/livesearch", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-CSRF-TOKEN": csrf || "",
					"X-Requested-With": "XMLHttpRequest"
				},
				body: JSON.stringify({ title: query })
			});
			if (!res.ok) continue;
			const records = (await res.json())?.records || [];
			if (!records.length) continue;
			const matches = records.filter((r) => r.anilist_id === media.id);
			if (matches.length > 0) {
				let selected = matches.find((r) => r.dub === prefDubInt);
				if (!selected) selected = matches[0];
				const resolved = {
					id: selected.id,
					slug: selected.slug,
					dub: selected.dub,
					title: selected.title || selected.title_eng,
					hasAlternativeDub: matches.length > 1,
					updatedAt: Date.now()
				};
				map[media.id] = resolved;
				Storage.set("al_au_map", map);
				return resolved;
			}
		} catch (err) {
			console.warn("[animeunity-utils] /livesearch error for query:", query, err);
		}
		return null;
	}
	function scanAnimeUnityPageMap() {
		const map = Storage.get("al_au_map") || {};
		let updated = false;
		document.querySelectorAll("layout-items[items-json]").forEach((el) => {
			try {
				const raw = el.getAttribute("items-json");
				if (!raw) return;
				const parsed = JSON.parse(raw);
				(Array.isArray(parsed) ? parsed : parsed?.data || []).forEach((item) => {
					const anime = item?.anime;
					const anilistId = anime?.anilist_id;
					if (anilistId && anime.id && anime.slug) {
						const epNum = parseInt(item.number, 10);
						map[anilistId] = {
							id: anime.id,
							slug: anime.slug,
							title: anime.title || anime.title_eng,
							dub: anime.dub || 0,
							latestEp: isNaN(epNum) ? void 0 : epNum,
							updatedAt: Date.now()
						};
						updated = true;
					}
				});
			} catch (_) {}
		});
		if (updated) Storage.set("al_au_map", map);
		return map;
	}
	function getAnimeUnityUrl(media, { targetEp } = {}) {
		if (!media) return "/";
		const mapped = (Storage.get("al_au_map") || {})[media.id];
		if (mapped?.id && mapped?.slug) {
			const epSuffix = targetEp ? `?ep=${targetEp}` : "";
			return `/anime/${mapped.id}-${mapped.slug}${epSuffix}`;
		}
		const candidates = generateSearchCandidates(media);
		const bestSearch = candidates[candidates.length - 1] || media.title?.english || media.title?.romaji || "";
		return `/archivio?title=${encodeURIComponent(bestSearch)}`;
	}
	function openHomePreferencesModal({ onSave } = {}) {
		const currentLang = Storage.get("al_pref_language") || "sub";
		const currentOnlyUnwatched = Storage.get("al_home_only_unwatched") === true;
		const { modal, close } = createModal({
			id: "al-home-prefs-overlay",
			className: "al-prefs-modal",
			icon: SlidersVertical,
			title: "Home Preferences",
			subtitle: "Customize your Continue Watching shelf and audio preferences",
			body: `
      <div class="al-pref-group is-active">
        <div class="al-pref-header">
          <div class="al-pref-info">
            <span class="al-pref-title">Preferred Audio</span>
            <span class="al-pref-desc">Select which version to link when both SUB-ITA and ITA are available</span>
          </div>
        </div>

        <div class="al-pref-sub" style="padding-top: 6px;">
          <div class="al-pref-row" style="cursor: pointer;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; width: 100%; margin: 0;">
              <input type="radio" name="al_pref_lang" value="sub" class="al-radio" ${currentLang === "sub" ? "checked" : ""} />
              <div>
                <strong style="color: #f1f5f9; font-size: 13px;">SUB-ITA</strong>
                <div style="font-size: 11px; color: #94a3b8;">Original Japanese audio with Italian subtitles (Default)</div>
              </div>
            </label>
          </div>

          <div class="al-pref-row" style="cursor: pointer; margin-top: 4px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; width: 100%; margin: 0;">
              <input type="radio" name="al_pref_lang" value="dub" class="al-radio" ${currentLang === "dub" ? "checked" : ""} />
              <div>
                <strong style="color: #f1f5f9; font-size: 13px;">ITA</strong>
                <div style="font-size: 11px; color: #94a3b8;">Italian dubbed audio</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div class="al-pref-group" style="margin-top: 12px;">
        <label class="al-pref-header" style="cursor: pointer;">
          <div class="al-pref-info">
            <span class="al-pref-title">Default to Unwatched Only</span>
            <span class="al-pref-desc">Automatically hide caught-up series when opening the homepage</span>
          </div>
          <input type="checkbox" class="al-switch al-toggle-default-unwatched" ${currentOnlyUnwatched ? "checked" : ""} />
        </label>
      </div>
    `,
			actions: [{
				label: "Save Preferences",
				primary: true,
				icon: Check,
				onClick: () => {
					const selectedLang = modal.querySelector("input[name=\"al_pref_lang\"]:checked")?.value || "sub";
					const onlyUnwatched = modal.querySelector(".al-toggle-default-unwatched")?.checked === true;
					const langChanged = selectedLang !== currentLang;
					Storage.set("al_pref_language", selectedLang);
					Storage.set("al_home_only_unwatched", onlyUnwatched);
					if (langChanged) {
						const map = Storage.get("al_au_map") || {};
						Object.keys(map).forEach((key) => {
							if (map[key].hasAlternativeDub) delete map[key];
						});
						Storage.set("al_au_map", map);
					}
					showToast("Preferences saved");
					close();
					if (typeof onSave === "function") onSave({
						langChanged,
						onlyUnwatched,
						preferredDub: selectedLang
					});
				}
			}]
		});
	}
	function formatCountdown(seconds) {
		if (!seconds || seconds <= 0) return "";
		const days = Math.floor(seconds / 86400);
		const hours = Math.floor(seconds % 86400 / 3600);
		const minutes = Math.floor(seconds % 3600 / 60);
		if (days > 0) return `${days}d ${hours}h`;
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	}
	function calculateEntryState(entry) {
		const progress = entry.progress || 0;
		const media = entry.media || {};
		const nextAir = media.nextAiringEpisode;
		const totalEp = media.episodes;
		const status = media.status;
		let latestAired = 0;
		if (nextAir?.episode) latestAired = nextAir.episode - 1;
		else if (status === "FINISHED") latestAired = totalEp || progress;
		else if (totalEp && totalEp > 0) latestAired = totalEp;
		else latestAired = progress;
		const hasUnwatchedAired = latestAired > progress;
		const unwatchedCount = Math.max(0, latestAired - progress);
		const isCaughtUp = !hasUnwatchedAired;
		const nextToWatch = progress + 1;
		return {
			progress,
			totalEp,
			latestAired,
			nextAir,
			hasUnwatchedAired,
			unwatchedCount,
			isCaughtUp,
			nextToWatch
		};
	}
	function createCard(entry) {
		const media = entry.media || {};
		const state = calculateEntryState(entry);
		const epTarget = state.hasUnwatchedAired ? state.nextToWatch : void 0;
		const auUrl = getAnimeUnityUrl(media, { targetEp: epTarget });
		const title = media.title?.romaji || media.title?.english || "Untitled";
		const coverUrl = media.coverImage?.large || media.coverImage?.medium || "";
		const alUrl = media.siteUrl || `https://anilist.co/anime/${media.id}`;
		const card = document.createElement("div");
		card.className = "al-shelf-card";
		card.dataset.mediaId = media.id;
		const coverWrap = document.createElement("div");
		coverWrap.className = "al-card-cover";
		const coverImg = document.createElement("img");
		coverImg.src = coverUrl;
		coverImg.alt = title;
		coverImg.loading = "lazy";
		coverWrap.appendChild(coverImg);
		const badgeWrap = document.createElement("div");
		badgeWrap.className = "al-card-badge-top-left";
		if (state.hasUnwatchedAired) {
			const badge = document.createElement("span");
			badge.className = "al-badge al-badge-CURRENT";
			const dot = document.createElement("span");
			dot.className = "al-dot";
			badge.appendChild(dot);
			const txt = document.createElement("span");
			txt.textContent = state.unwatchedCount > 1 ? `+${state.unwatchedCount} eps` : `Ep. ${state.nextToWatch}`;
			badge.appendChild(txt);
			badgeWrap.appendChild(badge);
		} else if (state.nextAir) {
			const badge = document.createElement("span");
			badge.className = "al-badge al-badge-PAUSED";
			const dot = document.createElement("span");
			dot.className = "al-dot";
			badge.appendChild(dot);
			const txt = document.createElement("span");
			txt.textContent = `Ep. ${state.nextAir.episode} in ${formatCountdown(state.nextAir.timeUntilAiring)}`;
			badge.appendChild(txt);
			badgeWrap.appendChild(badge);
		} else {
			const badge = document.createElement("span");
			badge.className = "al-badge al-badge-COMPLETED";
			const dot = document.createElement("span");
			dot.className = "al-dot";
			badge.appendChild(dot);
			const txt = document.createElement("span");
			txt.textContent = "Caught up";
			badge.appendChild(txt);
			badgeWrap.appendChild(badge);
		}
		coverWrap.appendChild(badgeWrap);
		const alLinkWrap = document.createElement("div");
		alLinkWrap.className = "al-card-badge-top-right";
		const alLink = document.createElement("a");
		alLink.href = alUrl;
		alLink.target = "_blank";
		alLink.rel = "noopener noreferrer";
		alLink.className = "al-card-al-link";
		alLink.title = "View on AniList";
		alLink.innerHTML = iconHtml(ExternalLink, {
			width: 12,
			height: 12
		});
		alLinkWrap.appendChild(alLink);
		coverWrap.appendChild(alLinkWrap);
		const overlay = document.createElement("div");
		overlay.className = "al-card-cover-overlay";
		const progressText = document.createElement("div");
		progressText.className = "al-card-progress-text";
		const progressLabel = document.createElement("span");
		progressLabel.textContent = `Ep. ${state.progress} / ${state.totalEp || state.latestAired || "?"}`;
		progressText.appendChild(progressLabel);
		if (state.hasUnwatchedAired) {
			const readyTag = document.createElement("span");
			readyTag.style.color = "#3db4f2";
			readyTag.textContent = "Ready";
			progressText.appendChild(readyTag);
		}
		overlay.appendChild(progressText);
		const progressBar = document.createElement("div");
		progressBar.className = "al-card-progress-bar";
		const progressFill = document.createElement("div");
		progressFill.className = "al-card-progress-fill";
		const totalForBar = state.totalEp || state.latestAired || state.progress || 1;
		const percent = Math.min(100, Math.max(0, Math.round(state.progress / totalForBar * 100)));
		progressFill.style.width = `${percent}%`;
		progressBar.appendChild(progressFill);
		overlay.appendChild(progressBar);
		coverWrap.appendChild(overlay);
		card.appendChild(coverWrap);
		const cardBody = document.createElement("div");
		cardBody.className = "al-card-body";
		const titleLink = document.createElement("a");
		titleLink.href = auUrl;
		titleLink.className = "al-card-title";
		titleLink.title = title;
		titleLink.textContent = title;
		cardBody.appendChild(titleLink);
		const actions = document.createElement("div");
		actions.className = "al-card-actions";
		const btn = document.createElement("a");
		btn.href = auUrl;
		btn.className = "al-card-btn";
		if (state.hasUnwatchedAired) {
			btn.classList.add("al-btn-play");
			btn.innerHTML = `${iconHtml(Play, {
				width: 12,
				height: 12
			})} Ep. ${state.nextToWatch}`;
		} else if (state.nextAir) {
			btn.classList.add("al-btn-secondary");
			btn.innerHTML = `${iconHtml(Clock, {
				width: 12,
				height: 12
			})} Ep. ${state.progress}`;
		} else {
			btn.classList.add("al-btn-caughtup");
			btn.innerHTML = `${iconHtml(Check, {
				width: 12,
				height: 12
			})} In pari`;
		}
		actions.appendChild(btn);
		cardBody.appendChild(actions);
		card.appendChild(cardBody);
		resolveAnimeUnityAnime(media).then((resolved) => {
			if (resolved?.id && resolved?.slug) {
				card._resolved = resolved;
				const directUrl = `/anime/${resolved.id}-${resolved.slug}`;
				titleLink.href = directUrl;
				btn.href = `${directUrl}${epTarget ? `?ep=${epTarget}` : ""}`;
			}
		});
		async function handleCardNavigate(e) {
			if (state.hasUnwatchedAired) sessionStorage.setItem("al_target_ep", String(state.nextToWatch));
			if (!card._resolved && (btn.href.includes("/archivio") || titleLink.href.includes("/archivio"))) {
				e.preventDefault();
				btn.style.opacity = "0.7";
				btn.style.pointerEvents = "none";
				const resolved = await resolveAnimeUnityAnime(media);
				btn.style.opacity = "";
				btn.style.pointerEvents = "";
				if (resolved?.id && resolved?.slug) {
					const directUrl = `/anime/${resolved.id}-${resolved.slug}${epTarget ? `?ep=${epTarget}` : ""}`;
					window.location.href = directUrl;
					return;
				}
				window.location.href = btn.href;
			}
		}
		titleLink.addEventListener("click", handleCardNavigate);
		btn.addEventListener("click", handleCardNavigate);
		return card;
	}
	function renderWatchingShelf({ entries = [], viewer = null } = {}) {
		scanAnimeUnityPageMap();
		let unwatchedOnly = Storage.get("al_home_only_unwatched") === true;
		const shelfContainer = document.createElement("div");
		shelfContainer.id = "al-home-continue-watching";
		shelfContainer.className = "al-home-shelf";
		const header = document.createElement("div");
		header.className = "al-shelf-header";
		const titleWrap = document.createElement("div");
		titleWrap.className = "al-shelf-title-wrap";
		const iconBox = document.createElement("div");
		iconBox.className = "al-shelf-icon";
		iconBox.innerHTML = iconHtml(Play, {
			width: 15,
			height: 15
		});
		titleWrap.appendChild(iconBox);
		const title = document.createElement("h2");
		title.className = "al-shelf-title";
		title.textContent = "CONTINUE WATCHING";
		titleWrap.appendChild(title);
		const countBadge = document.createElement("span");
		countBadge.className = "al-shelf-count";
		countBadge.textContent = String(entries.length);
		titleWrap.appendChild(countBadge);
		header.appendChild(titleWrap);
		const controls = document.createElement("div");
		controls.className = "al-shelf-controls";
		const prefBtn = document.createElement("button");
		prefBtn.type = "button";
		prefBtn.className = "al-shelf-pref-btn";
		prefBtn.title = "Preferences (Audio & Shelf)";
		prefBtn.innerHTML = iconHtml(SlidersVertical, {
			width: 14,
			height: 14
		});
		prefBtn.addEventListener("click", () => {
			openHomePreferencesModal({ onSave: ({ onlyUnwatched }) => {
				unwatchedOnly = onlyUnwatched;
				toggleBox.classList.toggle("active", unwatchedOnly);
				toggleKnob.classList.toggle("active", unwatchedOnly);
				updateTrack();
			} });
		});
		controls.appendChild(prefBtn);
		const unwatchedEntries = entries.filter((e) => calculateEntryState(e).hasUnwatchedAired);
		const filterWrap = document.createElement("div");
		filterWrap.className = "al-shelf-filter";
		filterWrap.title = "Toggle: Show only series with unwatched aired episodes";
		const toggleBox = document.createElement("div");
		toggleBox.className = `al-shelf-toggle-box ${unwatchedOnly ? "active" : ""}`;
		const toggleKnob = document.createElement("div");
		toggleKnob.className = `al-shelf-toggle-knob ${unwatchedOnly ? "active" : ""}`;
		toggleBox.appendChild(toggleKnob);
		filterWrap.appendChild(toggleBox);
		const filterLabel = document.createElement("span");
		filterLabel.className = "al-shelf-filter-label";
		filterLabel.innerHTML = `${iconHtml(Zap, {
			width: 12,
			height: 12
		})} Only unwatched`;
		filterWrap.appendChild(filterLabel);
		if (unwatchedEntries.length > 0) {
			const pill = document.createElement("span");
			pill.className = "al-shelf-unwatched-pill";
			pill.textContent = `${unwatchedEntries.length} ready`;
			filterWrap.appendChild(pill);
		}
		controls.appendChild(filterWrap);
		const navWrap = document.createElement("div");
		navWrap.className = "al-shelf-nav";
		const prevBtn = document.createElement("button");
		prevBtn.type = "button";
		prevBtn.className = "al-shelf-arrow";
		prevBtn.title = "Scroll Left";
		prevBtn.innerHTML = iconHtml(ChevronLeft, {
			width: 16,
			height: 16
		});
		const nextBtn = document.createElement("button");
		nextBtn.type = "button";
		nextBtn.className = "al-shelf-arrow";
		nextBtn.title = "Scroll Right";
		nextBtn.innerHTML = iconHtml(ChevronRight, {
			width: 16,
			height: 16
		});
		navWrap.appendChild(prevBtn);
		navWrap.appendChild(nextBtn);
		controls.appendChild(navWrap);
		header.appendChild(controls);
		shelfContainer.appendChild(header);
		const carouselWrap = document.createElement("div");
		carouselWrap.className = "al-shelf-carousel-wrap";
		const track = document.createElement("div");
		track.className = "al-shelf-track";
		prevBtn.addEventListener("click", () => {
			track.scrollBy({
				left: -380,
				behavior: "smooth"
			});
		});
		nextBtn.addEventListener("click", () => {
			track.scrollBy({
				left: 380,
				behavior: "smooth"
			});
		});
		function updateTrack() {
			track.innerHTML = "";
			if (!viewer) {
				const empty = document.createElement("div");
				empty.className = "al-shelf-empty";
				empty.style.width = "100%";
				empty.innerHTML = `
        <div class="al-shelf-empty-icon">${iconHtml(Play, {
					width: 32,
					height: 32
				})}</div>
        <div class="al-shelf-empty-title">Connect your AniList Account</div>
        <div class="al-shelf-empty-desc">Sign in with AniList to access your Continue Watching list, release countdowns, and quick episode progress directly on AnimeUnity.</div>
        <button type="button" class="al-btn al-btn-primary al-home-auth-btn" style="margin-top: 6px;">Connect AniList</button>
      `;
				empty.querySelector(".al-home-auth-btn")?.addEventListener("click", () => openTokenModal());
				track.appendChild(empty);
				return;
			}
			if (!entries.length) {
				const empty = document.createElement("div");
				empty.className = "al-shelf-empty";
				empty.style.width = "100%";
				empty.innerHTML = `
        <div class="al-shelf-empty-title">No Anime in Watching</div>
        <div class="al-shelf-empty-desc">You don't currently have any anime marked as "Watching" on AniList.</div>
      `;
				track.appendChild(empty);
				return;
			}
			const visibleEntries = unwatchedOnly ? entries.filter((e) => calculateEntryState(e).hasUnwatchedAired) : entries;
			if (!visibleEntries.length) {
				const empty = document.createElement("div");
				empty.className = "al-shelf-empty";
				empty.style.width = "100%";
				empty.innerHTML = `
        <div class="al-shelf-empty-title">All Caught Up! 🎉</div>
        <div class="al-shelf-empty-desc">You have no unwatched aired episodes in your Watching list. Disable the filter above to view all series.</div>
      `;
				track.appendChild(empty);
				return;
			}
			visibleEntries.forEach((entry) => {
				track.appendChild(createCard(entry));
			});
		}
		filterWrap.addEventListener("click", () => {
			unwatchedOnly = !unwatchedOnly;
			Storage.set("al_home_only_unwatched", unwatchedOnly);
			toggleBox.classList.toggle("active", unwatchedOnly);
			toggleKnob.classList.toggle("active", unwatchedOnly);
			updateTrack();
		});
		updateTrack();
		carouselWrap.appendChild(track);
		shelfContainer.appendChild(carouselWrap);
		return shelfContainer;
	}
	handleUrlToken();
	var viewer = null;
	var entries = [];
	var isFetching = false;
	var hasLoadedOnce = false;
	function isHomePage() {
		const p = window.location.pathname;
		return p === "/" || p === "/home" || p === "";
	}
	function createSkeletonShelf() {
		const shelf = document.createElement("div");
		shelf.id = "al-home-continue-watching";
		shelf.className = "al-home-shelf";
		shelf.innerHTML = `
    <div class="al-shelf-header">
      <div class="al-shelf-title-wrap">
        <div class="al-shelf-icon">${iconHtml(Play, {
			width: 15,
			height: 15
		})}</div>
        <h2 class="al-shelf-title">CONTINUE WATCHING</h2>
      </div>
    </div>
    <div class="al-shelf-carousel-wrap">
      <div class="al-shelf-track">
        <div class="al-shelf-skeleton"></div>
        <div class="al-shelf-skeleton"></div>
        <div class="al-shelf-skeleton"></div>
        <div class="al-shelf-skeleton"></div>
        <div class="al-shelf-skeleton"></div>
      </div>
    </div>
  `;
		return shelf;
	}
	function injectShelf(shelfElement) {
		const existing = document.getElementById("al-home-continue-watching");
		if (existing) {
			if (existing !== shelfElement) existing.replaceWith(shelfElement);
			return;
		}
		const shelfRow = document.createElement("div");
		shelfRow.className = "row al-home-shelf-row";
		const shelfCol = document.createElement("div");
		shelfCol.className = "col-12";
		shelfCol.appendChild(shelfElement);
		shelfRow.appendChild(shelfCol);
		const topBarRow = document.querySelector("#home .bar-link")?.closest(".row");
		if (topBarRow) {
			topBarRow.after(shelfRow);
			return;
		}
		const ultimiRow = document.querySelector("#ultimi-episodi")?.closest(".row");
		if (ultimiRow) {
			ultimiRow.before(shelfRow);
			return;
		}
		const container = document.querySelector("#home > .container") || document.querySelector(".container");
		if (container) container.prepend(shelfRow);
	}
	async function loadData() {
		if (isFetching) return;
		isFetching = true;
		if (!Storage.get("anilist_token")) {
			viewer = null;
			entries = [];
			hasLoadedOnce = true;
			isFetching = false;
			render();
			return;
		}
		try {
			viewer = (await AniListAPI.getViewer(() => {
				viewer = null;
				entries = [];
			}))?.Viewer || null;
			if (viewer?.id) entries = ((await AniListAPI.getUserWatching(viewer.id))?.MediaListCollection?.lists || []).flatMap((l) => l.entries || []);
			else entries = [];
		} catch (err) {
			console.error("[home-anilist] Error fetching watching list:", err);
		} finally {
			isFetching = false;
			hasLoadedOnce = true;
			render();
		}
	}
	function render() {
		if (!isHomePage()) {
			const existing = document.getElementById("al-home-continue-watching");
			if (existing) existing.closest(".al-home-shelf-row")?.remove() || existing.remove();
			return;
		}
		if (!document.querySelector("#home .container, .container")) return;
		if (!hasLoadedOnce && isFetching) {
			if (!document.getElementById("al-home-continue-watching")) injectShelf(createSkeletonShelf());
			return;
		}
		injectShelf(renderWatchingShelf({
			entries,
			viewer
		}));
	}
	function init() {
		scanAnimeUnityPageMap();
		if (isHomePage()) {
			injectShelf(createSkeletonShelf());
			loadData();
		}
		setInterval(() => {
			if (isHomePage()) {
				scanAnimeUnityPageMap();
				if (!document.getElementById("al-home-continue-watching")) {
					if (!hasLoadedOnce && !isFetching) loadData();
					else render();
				}
			} else {
				const existing = document.getElementById("al-home-continue-watching");
				if (existing) existing.closest(".al-home-shelf-row")?.remove() || existing.remove();
			}
		}, 800);
	}
	init();
})();
