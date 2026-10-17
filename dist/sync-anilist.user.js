// ==UserScript==
// @name         AnimeUnity to AniList Sync
// @namespace    https://github.com/pallax03/my-userscripts
// @version      1.0.0
// @author       Alex Mazzoni
// @description  Automatically sync watched AnimeUnity episodes and status to AniList
// @license      MIT
// @source       https://github.com/pallax03/my-userscripts.git
// @downloadURL  https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/sync-anilist.user.js
// @updateURL    https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/sync-anilist.user.js
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
	_css(".cover-wrap .actions,.list-btn-mobile,#add-to-fav,a[href*=\\/login].list,a[href*=\\/login].btn-danger{display:none!important}.al-btn{cursor:pointer;white-space:nowrap;border:1px solid #0000;border-radius:9px;justify-content:center;align-items:center;gap:6px;padding:8px 16px;font-size:13px;font-weight:700;text-decoration:none;transition:all .2s cubic-bezier(.4,0,.2,1);display:inline-flex}.al-btn:hover{text-decoration:none;transform:translateY(-1px)}.al-btn:active{transform:translateY(0)}.al-btn.primary{background:linear-gradient(135deg,#3db4f2 0%,#0284c7 100%);box-shadow:0 4px 14px #3db4f259;color:#06101e!important}.al-btn.primary:hover{filter:brightness(1.08);box-shadow:0 6px 20px #3db4f28c;color:#06101e!important}.al-btn.secondary{background:#ffffff14;border-color:#ffffff26;color:#e2e8f0!important}.al-btn.secondary:hover{background:#ffffff24;color:#fff!important}#video-bottom{border-bottom:1px solid #3db4f233;min-height:40px;background-color:var(--color-background-1,#131722)!important;justify-content:center!important;align-items:center!important;padding:6px 12px!important;display:flex!important;position:relative!important;overflow:visible!important}#video-bottom a.prev{z-index:2;transition:all .2s;color:#94a3b8!important;white-space:nowrap!important;align-items:center!important;gap:6px!important;font-size:12px!important;font-weight:600!important;text-decoration:none!important;display:inline-flex!important;position:absolute!important;top:50%!important;left:12px!important;transform:translateY(-50%)!important}#video-bottom a.prev:hover{color:#3db4f2!important;text-decoration:none!important}#video-bottom a.next{z-index:2;transition:all .2s;color:#94a3b8!important;white-space:nowrap!important;align-items:center!important;gap:6px!important;font-size:12px!important;font-weight:600!important;text-decoration:none!important;display:inline-flex!important;position:absolute!important;top:50%!important;right:12px!important;transform:translateY(-50%)!important}#video-bottom a.next:hover{color:#3db4f2!important;text-decoration:none!important}@media (width<=500px){#video-bottom{padding:4px 8px!important}#video-bottom a.prev span,#video-bottom a.next span{display:none!important}#video-bottom a.prev,#video-bottom a.next{font-size:14px!important}}#video-bottom #al-video-bottom-widget{z-index:1;justify-content:center;align-items:center;max-width:calc(100% - 170px);margin:0 auto;display:flex}@media (width<=500px){#video-bottom #al-video-bottom-widget{max-width:calc(100% - 64px)}}#video-bottom #al-video-bottom-widget .al-vb-mark-btn{cursor:pointer;white-space:nowrap;background:linear-gradient(135deg,#3db4f2 0%,#0284c7 100%);border:none;border-radius:6px;align-items:center;gap:5px;min-height:26px;padding:4px 12px;font-size:11px;font-weight:800;transition:all .2s cubic-bezier(.16,1,.3,1);display:inline-flex;box-shadow:0 0 12px #3db4f266;color:#06101e!important}#video-bottom #al-video-bottom-widget .al-vb-mark-btn:hover{filter:brightness(1.08);transform:scale(1.04);box-shadow:0 0 16px #3db4f299}#video-bottom #al-video-bottom-widget .al-vb-mark-btn:active{transform:scale(.97)}#video-bottom #al-video-bottom-widget .al-vb-countdown{background:#0e1622f2;border:1px solid #3db4f273;border-radius:8px;justify-content:space-between;align-items:center;gap:8px;max-width:100%;padding:3px 6px;animation:2s ease-in-out infinite al-pulse-border;display:inline-flex;box-shadow:0 0 14px #3db4f240}#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-timer{color:#e2e8f0;white-space:nowrap;align-items:center;gap:5px;padding:0 4px;font-size:11px;font-weight:600;display:flex}#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-timer strong{color:#3db4f2}#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-btn{cursor:pointer;white-space:nowrap;justify-content:center;align-items:center;min-width:24px;min-height:24px;padding:0;transition:all .15s;display:inline-flex}#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-btn.al-vb-cancel{color:#fca5a5;background:#ef44441a;border:1px solid #ef44444d;border-radius:6px}#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-btn.al-vb-cancel:hover,#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-btn.al-vb-cancel:active{color:#fff;background:#ef44444d;border-color:#ef4444}#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-btn.al-vb-save{color:#06101e;background:linear-gradient(135deg,#3db4f2 0%,#0284c7 100%);border:none;border-radius:6px;box-shadow:0 0 8px #3db4f259}#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-btn.al-vb-save:hover,#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-btn.al-vb-save:active{filter:brightness(1.15);box-shadow:0 0 12px #3db4f28c}#video-bottom #al-video-bottom-widget .al-vb-synced{color:#4ade80;white-space:nowrap;background:#22c55e1f;border:1px solid #22c55e4d;border-radius:6px;align-items:center;gap:5px;min-height:26px;padding:4px 10px;font-size:11px;font-weight:600;display:inline-flex}#video-bottom #al-video-bottom-widget .al-vb-recap{color:#93c5fd;white-space:nowrap;background:#3b82f61f;border:1px solid #3b82f64d;border-radius:6px;align-items:center;gap:8px;min-height:26px;padding:3px 8px;font-size:11px;font-weight:600;display:inline-flex}#video-bottom #al-video-bottom-widget .al-vb-recap .al-vb-recap-text{align-items:center;gap:5px;display:flex}#video-bottom #al-video-bottom-widget .al-vb-recap .al-vb-btn.ghost-xs{color:#e2e8f0;cursor:pointer;background:#ffffff14;border:1px solid #ffffff26;border-radius:5px;justify-content:center;align-items:center;min-width:22px;min-height:22px;padding:0;display:inline-flex}#video-bottom #al-video-bottom-widget .al-vb-recap .al-vb-btn.ghost-xs:hover{color:#fff;background:#3db4f240;border-color:#3db4f2}.al-card{-webkit-backdrop-filter:blur(20px);background:linear-gradient(135deg,#111a26f0 0%,#0a121cfa 100%);border:1px solid #3db4f24d;border-radius:14px;width:100%;margin-top:14px;margin-bottom:24px;padding:12px 18px 14px;transition:border-color .3s,box-shadow .3s;position:relative;overflow:hidden;box-shadow:0 12px 35px #0009,0 0 20px #3db4f21f}.al-card:hover{border-color:#3db4f280;box-shadow:0 14px 40px #000000b3,0 0 25px #3db4f233}.al-card .al-card-row{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;width:100%;display:flex}.al-card .al-left{align-items:center;gap:10px;min-width:0;display:flex}.al-card .al-right,.al-card .al-controls-group{align-items:center;gap:10px;display:flex}.al-card .al-info{color:#e2e8f0;align-items:center;gap:10px;font-size:13px;font-weight:600;display:flex}.al-card .al-pill{text-transform:uppercase;letter-spacing:.5px;color:#06101e;background:linear-gradient(135deg,#3db4f2,#0284c7);border-radius:6px;padding:3px 8px;font-size:11px;font-weight:800}.al-card .al-pill.danger{color:#fff;background:linear-gradient(135deg,#ef4444,#b91c1c)}.al-card .al-badge{background:linear-gradient(135deg,#3db4f22e,#0ea5e91a);border:1px solid #3db4f273;border-radius:9px;align-items:center;gap:8px;max-width:320px;padding:6px 14px;font-size:13px;font-weight:700;text-decoration:none;transition:all .2s;display:inline-flex;color:#3db4f2!important}.al-card .al-badge .al-title-text{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.al-card .al-badge .al-badge-icon{opacity:.85;flex-shrink:0;transition:transform .2s,opacity .2s}.al-card .al-badge:hover{background:linear-gradient(135deg,#3db4f247,#0ea5e933);border-color:#3db4f2;text-decoration:none;transform:translateY(-1px);box-shadow:0 0 15px #3db4f259}.al-card .al-badge:hover .al-badge-icon{opacity:1;transform:translate(1px,-1px)}.al-card .al-icon-btn{color:#94a3b8;cursor:pointer;background:#ffffff0d;border:1px solid #ffffff1f;border-radius:8px;justify-content:center;align-items:center;width:34px;height:34px;transition:all .2s;display:inline-flex}.al-card .al-icon-btn:hover{color:#fff;background:#ffffff1f;border-color:#ffffff4d;transform:translateY(-1px)}.al-card .al-icon-btn.danger:hover{color:#ef4444;background:#ef44442e;border-color:#ef4444;box-shadow:0 0 12px #ef44444d}.al-card .al-select{appearance:none;color:#f1f5f9;cursor:pointer;background:#0e1622d9 url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='none' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' d='m1 1 4 4 4-4'/%3E%3C/svg%3E\") right 10px center no-repeat;border:1px solid #ffffff29;border-radius:9px;outline:none;height:36px;padding:6px 30px 6px 12px;font-size:13px;font-weight:600;transition:all .2s}.al-card .al-select:hover,.al-card .al-select:focus{border-color:#3db4f2;box-shadow:0 0 12px #3db4f240}.al-card .al-select option{color:#fff;background:#0e1622}.al-card .al-card-progress-bar{background:#ffffff0f;height:3px;position:absolute;bottom:0;left:0;right:0}.al-card .al-card-progress-bar .al-card-progress-fill{background:linear-gradient(90deg,#3db4f2,#22c55e);height:100%;transition:width .3s;box-shadow:0 0 8px #3db4f2b3}@media (width<=768px){.al-card{padding:12px 14px 14px}.al-card .al-card-row{flex-direction:column;align-items:stretch;gap:10px}.al-card .al-left{width:100%}.al-card .al-left .al-badge{justify-content:center;width:100%;max-width:100%}.al-card .al-right{width:100%}.al-card .al-controls-group{grid-template-columns:1fr 1fr auto;gap:8px;width:100%;display:grid}.al-card .al-controls-group .al-select{width:100%}}.al-avatar{object-fit:cover;border:2px solid #3db4f2;border-radius:50%;width:36px;height:36px;transition:transform .2s,box-shadow .2s;box-shadow:0 0 12px #3db4f266}.al-avatar:hover{transform:scale(1.05);box-shadow:0 0 18px #3db4f2a6}.al-avatar-mobile{object-fit:cover;cursor:pointer;border:2px solid #3db4f2;border-radius:50%;width:32px;height:32px;box-shadow:0 0 10px #3db4f259}.al-dropdown-menu{-webkit-backdrop-filter:blur(20px);min-width:220px;max-height:calc(100vh - 75px);overflow-y:auto;box-shadow:0 16px 45px #000000d9,0 0 20px #3db4f226;background:linear-gradient(135deg,#111a26fa 0%,#080f18fc 100%)!important;border:1px solid #3db4f24d!important;border-radius:14px!important;padding:0!important}.al-dropdown-menu .al-dropdown-header{background:#ffffff08;border-bottom:1px solid #ffffff14;padding:14px 16px 12px}.al-dropdown-menu .al-dropdown-header .al-user-info{align-items:center;gap:10px;display:flex}.al-dropdown-menu .al-dropdown-header .al-dropdown-avatar{object-fit:cover;border:2px solid #3db4f2;border-radius:50%;width:40px;height:40px;box-shadow:0 0 12px #3db4f273}.al-dropdown-menu .al-dropdown-header .al-user-text{flex-direction:column;display:flex;overflow:hidden}.al-dropdown-menu .al-dropdown-header .al-username{color:#fff;white-space:nowrap;text-overflow:ellipsis;max-width:145px;font-size:14px;font-weight:700;overflow:hidden}.al-dropdown-menu .al-dropdown-header .al-user-status{color:#94a3b8;align-items:center;gap:6px;font-size:11px;font-weight:600;display:flex}.al-dropdown-menu .al-dropdown-header .al-status-dot{background:#22c55e;border-radius:50%;width:7px;height:7px;box-shadow:0 0 8px #22c55e}.al-dropdown-menu .al-dropdown-body{padding:6px 0}.al-dropdown-menu .al-dropdown-footer{background:#00000040;border-top:1px solid #ffffff14;padding:6px 8px}.al-dropdown-menu .al-dropdown-item{color:#cbd5e1;cursor:pointer;background:0 0;border:none;justify-content:space-between;align-items:center;width:100%;padding:10px 16px;font-size:13px;font-weight:500;text-decoration:none;transition:all .15s;display:flex}.al-dropdown-menu .al-dropdown-item .al-item-left{align-items:center;gap:10px;display:flex}.al-dropdown-menu .al-dropdown-item .al-item-ext{color:#64748b;transition:color .15s}.al-dropdown-menu .al-dropdown-item:hover{text-decoration:none;color:#fff!important;background:#3db4f224!important}.al-dropdown-menu .al-dropdown-item:hover .al-item-ext{color:#3db4f2}.al-dropdown-menu .al-dropdown-item.danger{color:#fca5a5;background:#ef444414;border:1px solid #ef444438;border-radius:8px;margin:2px 0;padding:8px 12px;font-weight:600}.al-dropdown-menu .al-dropdown-item.danger:hover{box-shadow:0 0 14px #ef444440;color:#fff!important;background:#ef444438!important;border-color:#ef444480!important}.episode-wrapper .episode-item.al-done:not(.active):not(.al-tracked){background-color:#3db4f21f!important;border:1px solid #3db4f24d!important}.episode-wrapper .episode-item.al-done:not(.active):not(.al-tracked) a{color:#93c5fd!important}.episode-wrapper .episode-item.al-tracked{position:relative;border:2px solid #3db4f2!important}.episode-wrapper .episode-item.al-tracked:not(.active){background-color:#3db4f233!important}.episode-wrapper .episode-item.al-tracked:not(.active) a{color:#3db4f2!important;font-weight:700!important}.episode-wrapper .episode-item.al-tracked:after{content:\"✓\";color:#06101e;z-index:6;background:#3db4f2;border-radius:50%;justify-content:center;align-items:center;width:15px;height:15px;font-size:10px;font-weight:900;display:flex;position:absolute;top:-6px;right:-6px;box-shadow:0 2px 6px #0009}.episode-wrapper .episode-item.seen:not(.active):not(.al-tracked):not(.al-done){background-color:var(--color-background-1,#191d26)!important;color:inherit!important}.episode-wrapper .episode-item.active{z-index:10!important;background:#007bff!important;transform:scale(1.12)!important;box-shadow:0 0 16px #007bfff2,0 0 0 2px #fff!important}.episode-wrapper .episode-item.active a{color:#fff!important;font-weight:900!important}.al-toast{color:#fff;z-index:100000;pointer-events:none;background:linear-gradient(135deg,#102538 0%,#091724 100%);border-left:4px solid #3db4f2;border-radius:9px;padding:12px 20px;font-size:13px;font-weight:600;position:fixed;bottom:24px;right:24px;box-shadow:0 10px 30px #0009,0 0 15px #3db4f233}.al-toast.alert{border-left-color:#ef4444}.al-overlay{-webkit-backdrop-filter:blur(16px);z-index:99999;background:#03070dd1;justify-content:center;align-items:center;display:flex;position:fixed;inset:0}.al-modal{color:#fff;background:linear-gradient(135deg,#101a27 0%,#080f18 100%);border:1px solid #3db4f259;border-radius:16px;width:90%;max-width:440px;padding:24px;animation:.25s cubic-bezier(.16,1,.3,1) al-modal-in;box-shadow:0 20px 60px #000000d9,0 0 30px #3db4f22e}.al-modal .al-modal-header{align-items:center;gap:14px;margin-bottom:18px;display:flex}.al-modal .al-modal-icon{color:#3db4f2;background:linear-gradient(135deg,#3db4f233,#0284c71a);border:1px solid #3db4f266;border-radius:12px;flex-shrink:0;justify-content:center;align-items:center;width:44px;height:44px;display:flex;box-shadow:0 0 15px #3db4f24d}.al-modal .al-modal-title{color:#fff;margin:0;font-size:18px;font-weight:700;line-height:1.2}.al-modal .al-modal-subtitle{color:#94a3b8;margin:3px 0 0;font-size:12px;line-height:1.3}.al-modal .al-auth-link{background:linear-gradient(135deg,#3db4f226,#0ea5e914);border:1px solid #3db4f259;border-radius:10px;justify-content:space-between;align-items:center;margin-bottom:12px;padding:11px 14px;font-size:13px;font-weight:700;text-decoration:none;transition:all .2s;display:flex;color:#3db4f2!important}.al-modal .al-auth-link .al-auth-tag{color:#06101e;text-transform:uppercase;background:#3db4f2;border-radius:5px;padding:2px 6px;font-size:10px;font-weight:900}.al-modal .al-auth-link:hover{background:linear-gradient(135deg,#3db4f240,#0ea5e929);border-color:#3db4f2;text-decoration:none;transform:translateY(-1px);box-shadow:0 0 15px #3db4f24d}.al-modal .al-auth-hint{color:#94a3b8;margin-bottom:10px;font-size:12px}.al-modal .al-input-group input{color:#fff;background:#060c13e6;border:1px solid #ffffff26;border-radius:9px;outline:none;width:100%;padding:10px 14px;font-size:13px;transition:all .2s}.al-modal .al-input-group input::placeholder{color:#475569}.al-modal .al-input-group input:focus{border-color:#3db4f2;box-shadow:0 0 0 3px #3db4f240,0 0 15px #3db4f233}.al-modal.al-prefs-modal{max-width:460px}.al-modal.al-prefs-modal .al-prefs-body{flex-direction:column;gap:12px;margin-bottom:4px;display:flex}.al-modal.al-prefs-modal .al-pref-group{background:#ffffff08;border:1px solid #ffffff14;border-radius:12px;flex-direction:column;transition:background .25s,border-color .25s,box-shadow .25s;display:flex;overflow:hidden}.al-modal.al-prefs-modal .al-pref-group.is-active{background:#3db4f20a;border-color:#3db4f259;box-shadow:0 4px 16px #0000004d}.al-modal.al-prefs-modal .al-pref-group.is-active .al-pref-header{border-bottom:1px solid #3db4f226}.al-modal.al-prefs-modal .al-pref-group .al-pref-header{cursor:pointer;justify-content:space-between;align-items:center;gap:14px;margin:0;padding:12px 14px;transition:background .15s;display:flex}.al-modal.al-prefs-modal .al-pref-group .al-pref-header:hover{background:#ffffff08}.al-modal.al-prefs-modal .al-pref-group .al-pref-info{flex-direction:column;gap:2px;display:flex}.al-modal.al-prefs-modal .al-pref-group .al-pref-title{color:#f1f5f9;font-size:13px;font-weight:600}.al-modal.al-prefs-modal .al-pref-group .al-pref-desc{color:#94a3b8;font-size:11px;font-weight:500}.al-modal.al-prefs-modal .al-pref-group .al-pref-sub{background:#080e1799;flex-direction:column;gap:12px;padding:12px 14px;animation:.22s cubic-bezier(.16,1,.3,1) al-slide-down;display:flex}.al-modal.al-prefs-modal .al-pref-group .al-pref-sub.is-hidden{display:none!important}.al-modal.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row{color:#cbd5e1;cursor:pointer;justify-content:space-between;align-items:center;gap:12px;margin:0;font-size:12px;font-weight:500;display:flex}.al-modal.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-pref-sub-label{color:#94a3b8;align-items:center;gap:8px;display:flex}.al-modal.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-pref-sub-label svg{color:#3db4f2}.al-modal.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-select-xs{color:#f1f5f9;cursor:pointer;background:#0e1622f2;border:1px solid #ffffff29;border-radius:7px;outline:none;padding:4px 8px;font-size:12px;font-weight:600}.al-modal.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-select-xs:hover,.al-modal.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-select-xs:focus{border-color:#3db4f2}.al-modal.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-checkbox{accent-color:#3db4f2;cursor:pointer;width:16px;height:16px}.al-modal.al-prefs-modal .al-switch{appearance:none;cursor:pointer;background:#ffffff29;border-radius:12px;outline:none;flex-shrink:0;width:36px;height:20px;transition:background .2s;position:relative}.al-modal.al-prefs-modal .al-switch:after{content:\"\";background:#fff;border-radius:50%;width:16px;height:16px;transition:transform .2s cubic-bezier(.16,1,.3,1);position:absolute;top:2px;left:2px;box-shadow:0 1px 3px #0006}.al-modal.al-prefs-modal .al-switch:checked{background:#3db4f2}.al-modal.al-prefs-modal .al-switch:checked:after{background:#06101e;transform:translate(16px)}.al-modal .al-modal-actions{justify-content:flex-end;gap:10px;margin-top:20px;display:flex}@keyframes al-modal-in{0%{opacity:0;transform:scale(.94)translateY(8px)}to{opacity:1;transform:scale(1)translateY(0)}}@keyframes al-pulse-border{0%,to{border-color:#3db4f273;box-shadow:0 0 12px #3db4f233}50%{border-color:#3db4f2cc;box-shadow:0 0 20px #3db4f273}}@keyframes al-slide-down{0%{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}");
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
	var CheckCheck = [["path", { d: "M18 6 7 17l-5-5" }], ["path", { d: "m22 10-7.5 7.5L13 16" }]];
	var Check = [["path", { d: "M20 6 9 17l-5-5" }]];
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
	var Eye = [["path", { d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" }], ["circle", {
		cx: "12",
		cy: "12",
		r: "3"
	}]];
	var KeyRound = [["path", { d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" }], ["circle", {
		cx: "16.5",
		cy: "7.5",
		r: ".5",
		fill: "currentColor"
	}]];
	var LogOut = [
		["path", { d: "m16 17 5-5-5-5" }],
		["path", { d: "M21 12H9" }],
		["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }]
	];
	var Plus = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
	var RefreshCcw = [
		["path", { d: "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }],
		["path", { d: "M3 3v5h5" }],
		["path", { d: "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" }],
		["path", { d: "M16 16h5v5" }]
	];
	var RotateCcw = [["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }], ["path", { d: "M3 3v5h5" }]];
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
	var Trash = [
		["path", { d: "M10 11v6" }],
		["path", { d: "M14 11v6" }],
		["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }],
		["path", { d: "M3 6h18" }],
		["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }]
	];
	var User = [["path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }], ["circle", {
		cx: "12",
		cy: "7",
		r: "4"
	}]];
	var X = [["path", { d: "M18 6 6 18" }], ["path", { d: "m6 6 12 12" }]];
	var Zap = [["path", { d: "M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z" }]];
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
	var getAnimeKey = () => {
		const match = window.location.pathname.match(/\/anime\/(\d+)/i);
		return match ? match[1] : window.location.pathname;
	};
	var extractPageMetadata = () => {
		const animeKey = getAnimeKey();
		let anilistId = null;
		let romajiTitle = null;
		try {
			const el = document.querySelector("video-player, layout-items");
			if (el) {
				const raw = el.getAttribute("anime");
				if (raw) {
					const parsed = JSON.parse(raw);
					if (parsed?.anilist_id) anilistId = parseInt(parsed.anilist_id, 10);
					if (parsed?.title) romajiTitle = parsed.title;
				}
			}
		} catch (_) {}
		if (!anilistId && animeKey) try {
			const html = document.documentElement.innerHTML;
			const mId = html.match(new RegExp(`(?:&quot;|")id(?:&quot;|")\\s*:\\s*${animeKey}[^}]*?(?:&quot;|")anilist_id(?:&quot;|")\\s*:\\s*(\\d+)`));
			if (mId && mId[1]) anilistId = parseInt(mId[1], 10);
			if (!romajiTitle) {
				const mTitle = html.match(new RegExp(`(?:&quot;|")id(?:&quot;|")\\s*:\\s*${animeKey}[^}]*?(?:&quot;|")title(?:&quot;|")\\s*:\\s*(?:&quot;|")([^"&]+(?:&amp;[^"&]+)*)(?:&quot;|")`));
				if (mTitle && mTitle[1]) romajiTitle = mTitle[1].replace(/&amp;/g, "&");
			}
		} catch (_) {}
		if (!anilistId) {
			const mCover = `${document.querySelector("meta[property=\"og:image\"]")?.content || ""} ${document.querySelector(".cover-wrap img.cover, img.cover")?.src || ""}`.match(/\/b[x]?(\d+)[-_]/i);
			if (mCover && mCover[1]) anilistId = parseInt(mCover[1], 10);
		}
		return {
			anilistId,
			romajiTitle
		};
	};
	var cleanTitle = (t) => t ? t.replace(/\s*\((ITA|SUB|SUB ITA|DUB|ITA SUB|OVA|TV)\)/gi, "").replace(/\s+(ITA|SUB|DUB)$/gi, "").replace(/\s+Season\s+\d+/gi, "").trim() : "";
	var listeners = new Set();
	var Settings = {
		get() {
			return {
				autoTrack: Storage.get("al_opt_autotrack") === "true",
				delay: parseInt(Storage.get("al_opt_autodelay"), 10) || 15,
				preventRewind: Storage.get("al_opt_prevent_rewind") !== "false"
			};
		},
		set(key, val) {
			if (key === "autoTrack") Storage.set("al_opt_autotrack", String(val));
			else if (key === "delay") Storage.set("al_opt_autodelay", String(val));
			else if (key === "preventRewind") Storage.set("al_opt_prevent_rewind", String(val));
			const current = Settings.get();
			listeners.forEach((fn) => {
				try {
					fn(current);
				} catch (_) {}
			});
		},
		subscribe(fn) {
			listeners.add(fn);
			return () => listeners.delete(fn);
		}
	};
	function openPreferencesModal() {
		document.getElementById("al-prefs-overlay")?.remove();
		const settings = Settings.get();
		const wrap = document.createElement("div");
		wrap.className = "al-overlay";
		wrap.id = "al-prefs-overlay";
		wrap.innerHTML = `
    <div class="al-modal al-prefs-modal">
      <div class="al-modal-header">
        <div class="al-modal-icon">
          ${iconHtml(SlidersVertical, {
			width: 22,
			height: 22
		})}
        </div>
        <div>
          <h5 class="al-modal-title">Sync Preferences</h5>
          <p class="al-modal-subtitle">Configure auto-tracking and playback rules</p>
        </div>
      </div>

      <div class="al-modal-body al-prefs-body">
        <div class="al-pref-group ${settings.autoTrack ? "is-active" : ""}">
          <label class="al-pref-header">
            <div class="al-pref-info">
              <span class="al-pref-title">Auto-track on episode select</span>
              <span class="al-pref-desc">Sync episode to AniList automatically when selected</span>
            </div>
            <input type="checkbox" class="al-switch al-toggle-autotrack" ${settings.autoTrack ? "checked" : ""} />
          </label>

          <div class="al-pref-sub ${settings.autoTrack ? "" : "is-hidden"}">
            <div class="al-pref-row">
              <span class="al-pref-sub-label">
                ${iconHtml(Clock, {
			width: 13,
			height: 13
		})}
                <span>Grace delay before saving</span>
              </span>
              <select class="al-select-xs al-sel-delay">
                <option value="0" ${settings.delay === 0 ? "selected" : ""}>Instant (0s)</option>
                <option value="10" ${settings.delay === 10 ? "selected" : ""}>10 seconds</option>
                <option value="15" ${settings.delay === 15 ? "selected" : ""}>15 seconds</option>
                <option value="30" ${settings.delay === 30 ? "selected" : ""}>30 seconds</option>
              </select>
            </div>

            <label class="al-pref-row">
              <span class="al-pref-sub-label">
                ${iconHtml(RotateCcw, {
			width: 13,
			height: 13
		})}
                <span>Prevent rewind when rewatching</span>
              </span>
              <input type="checkbox" class="al-checkbox al-chk-rewind" ${settings.preventRewind ? "checked" : ""} />
            </label>
          </div>
        </div>
      </div>

      <div class="al-modal-actions">
        <button type="button" class="al-btn primary" id="al-prefs-close">
          ${iconHtml(Check, {
			width: 14,
			height: 14
		})}
          <span>Done</span>
        </button>
      </div>
    </div>`;
		document.body.appendChild(wrap);
		const autoTrackToggle = wrap.querySelector(".al-toggle-autotrack");
		const delaySelect = wrap.querySelector(".al-sel-delay");
		const rewindCheckbox = wrap.querySelector(".al-chk-rewind");
		const prefSub = wrap.querySelector(".al-pref-sub");
		if (autoTrackToggle) autoTrackToggle.onchange = (e) => {
			const active = e.target.checked;
			Settings.set("autoTrack", active);
			wrap.querySelector(".al-pref-group")?.classList.toggle("is-active", active);
			if (prefSub) prefSub.classList.toggle("is-hidden", !active);
		};
		if (delaySelect) delaySelect.onchange = (e) => {
			Settings.set("delay", parseInt(e.target.value, 10));
		};
		if (rewindCheckbox) rewindCheckbox.onchange = (e) => {
			Settings.set("preventRewind", e.target.checked);
		};
		const closeBtn = wrap.querySelector("#al-prefs-close");
		closeBtn.onclick = () => wrap.remove();
		wrap.onclick = (e) => {
			if (e.target === wrap) wrap.remove();
		};
		const keyHandler = (e) => {
			if (e.key === "Escape") {
				wrap.remove();
				document.removeEventListener("keydown", keyHandler);
			}
		};
		document.addEventListener("keydown", keyHandler);
	}
	var dropdownTpl = (user) => `
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
        ${iconHtml(User, {
		width: 14,
		height: 14
	})}
        <span>View Profile</span>
      </span>
      ${iconHtml(ExternalLink, {
		width: 12,
		height: 12,
		class: "al-item-ext"
	})}
    </a>
    <button class="al-dropdown-item al-btn-prefs" type="button">
      <span class="al-item-left">
        ${iconHtml(SlidersVertical, {
		width: 14,
		height: 14
	})}
        <span>Preferences</span>
      </span>
    </button>
    <button class="al-dropdown-item al-btn-token" type="button">
      <span class="al-item-left">
        ${iconHtml(KeyRound, {
		width: 14,
		height: 14
	})}
        <span>Change Token</span>
      </span>
    </button>
  </div>

  <div class="al-dropdown-footer">
    <button class="al-dropdown-item danger al-btn-logout" type="button">
      <span class="al-item-left">
        ${iconHtml(LogOut, {
		width: 14,
		height: 14,
		style: "color:#ef4444;"
	})}
        <span>Disconnect Account</span>
      </span>
    </button>
  </div>
`;
	function bindDropdown(menu, { onChangeToken, onLogout }) {
		menu.querySelector(".al-btn-prefs")?.addEventListener("click", (e) => {
			e.stopPropagation();
			menu.classList.remove("show");
			openPreferencesModal();
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
	function renderNav(currentUser, callbacks) {
		const avatar = currentUser?.avatar?.medium || "https://anilist.co/img/icons/icon.svg";
		const leftNav = document.querySelector("#left-nav");
		if (leftNav) {
			let container = document.getElementById("al-nav-desktop");
			if (!container) {
				container = document.createElement("li");
				container.id = "al-nav-desktop";
				container.className = "nav-item position-relative";
				const nativeLogin = leftNav.querySelector("a[href*=\"/login\"]")?.closest(".nav-item");
				nativeLogin ? nativeLogin.replaceWith(container) : leftNav.appendChild(container);
			}
			if (!currentUser) {
				container.innerHTML = `
        <a class="nav-link text-center pt-3" href="#" role="button">
          ${iconHtml(KeyRound, {
					width: 18,
					height: 18,
					style: "color:var(--al-blue);"
				})}<br>
          <span style="color:var(--al-blue);font-weight:600;font-size:11px;">AniList</span>
        </a>`;
				container.querySelector("a").onclick = (e) => {
					e.preventDefault();
					callbacks.onLogin();
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
				container.querySelector("a").onclick = (e) => {
					e.preventDefault();
					e.stopPropagation();
					menu.classList.toggle("show");
				};
				bindDropdown(menu, callbacks);
			}
		}
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
          ${iconHtml(KeyRound, {
					width: 12,
					height: 12
				})}
          <span>AniList</span>
        </button>`;
				mWidget.querySelector("button").onclick = callbacks.onLogin;
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
				bindDropdown(mMenu, callbacks);
			}
		}
	}
	function renderActions(media, hasToken, actions) {
		document.querySelectorAll(".cover-wrap .actions, .list-btn-mobile, #add-to-fav").forEach((el) => el.remove());
		const epWrapper = document.querySelector(".episode-wrapper");
		const overview = document.querySelector(".content .overview") || document.querySelector(".overview");
		if (!epWrapper && !overview) return;
		let bar = document.getElementById("al-control-bar");
		if (!bar) {
			bar = document.createElement("div");
			bar.id = "al-control-bar";
			bar.className = "al-card";
		}
		if (epWrapper && bar.previousElementSibling !== epWrapper) epWrapper.after(bar);
		else if (!epWrapper && overview && bar.parentElement !== overview) overview.appendChild(bar);
		if (!hasToken) {
			bar.innerHTML = `
      <div class="al-card-row">
        <div class="al-info">
          <span class="al-pill">AniList</span>
          <span>Connect your account to track anime and sync episodes</span>
        </div>
        <button type="button" class="al-btn primary" id="al-bar-login">
          ${iconHtml(KeyRound, {
				width: 14,
				height: 14
			})}
          <span>Connect AniList</span>
        </button>
      </div>`;
			bar.querySelector("#al-bar-login").onclick = actions.onConnect;
			return;
		}
		if (!media) {
			bar.innerHTML = `
      <div class="al-card-row">
        <div class="al-info text-danger">
          <span class="al-pill danger">AniList</span>
          <span>Anime not found in AniList database</span>
        </div>
      </div>`;
			return;
		}
		const title = media.title?.romaji || media.title?.english || media.title?.userPreferred || `AniList #${media.id}`;
		const entry = media.mediaListEntry;
		const total = media.episodes || 0;
		const progress = entry?.progress || 0;
		const percent = total > 0 && progress > 0 ? Math.min(100, Math.round(progress / total * 100)) : 0;
		bar.innerHTML = `
    <div class="al-card-row">
      <div class="al-left">
        <a href="https://anilist.co/anime/${media.id}" target="_blank" rel="noopener noreferrer" class="al-badge" title="Open on AniList: ${title}">
          <span class="al-title-text">${title}</span>
          ${iconHtml(ExternalLink, {
			width: 12,
			height: 12,
			class: "al-badge-icon"
		})}
        </a>
      </div>

      <div class="al-right">
        ${!entry ? `
          <button type="button" class="al-btn primary" id="al-bar-add">
            ${iconHtml(Plus, {
			width: 14,
			height: 14
		})}
            <span>Add to Watching</span>
          </button>
        ` : `
          <div class="al-controls-group">
            <select class="al-select" id="al-bar-status" title="Anime status">
              ${Object.entries(AniListAPI.statuses).map(([k, v]) => `<option value="${k}" ${entry.status === k ? "selected" : ""}>${v}</option>`).join("")}
            </select>

            <select class="al-select" id="al-bar-score" title="Your rating">
              <option value="0">Score: −</option>
              ${[
			1,
			2,
			3,
			4,
			5,
			6,
			7,
			8,
			9,
			10
		].map((s) => `<option value="${s}" ${entry.score === s ? "selected" : ""}>★ ${s}/10</option>`).join("")}
            </select>

            <button type="button" class="al-icon-btn danger" id="al-bar-del" title="Remove from AniList library">
              ${iconHtml(Trash, {
			width: 14,
			height: 14
		})}
            </button>
          </div>
        `}
      </div>
    </div>
    ${entry && total > 0 ? `
      <div class="al-card-progress-bar" title="Completion: ${progress}/${total} (${percent}%)">
        <div class="al-card-progress-fill" style="width: ${percent}%;"></div>
      </div>
    ` : ""}`;
		bar.querySelector("#al-bar-add")?.addEventListener("click", actions.onAdd);
		bar.querySelector("#al-bar-del")?.addEventListener("click", actions.onDelete);
		bar.querySelector("#al-bar-status")?.addEventListener("change", (e) => actions.onStatusChange(e.target.value));
		bar.querySelector("#al-bar-score")?.addEventListener("change", (e) => actions.onScoreChange(parseFloat(e.target.value)));
	}
	function renderVideoBottom({ activeEp, trackedProgress, hasToken, autoTrackState, callbacks }) {
		const container = document.getElementById("video-bottom");
		if (!container) return;
		let widget = document.getElementById("al-video-bottom-widget");
		if (!widget) {
			widget = document.createElement("div");
			widget.id = "al-video-bottom-widget";
			const nextBtn = container.querySelector(".float-right, .next");
			if (nextBtn) container.insertBefore(widget, nextBtn);
			else container.appendChild(widget);
		}
		if (!hasToken || !activeEp) {
			widget.innerHTML = "";
			return;
		}
		if (autoTrackState?.isActive && autoTrackState.targetEp === activeEp) {
			widget.innerHTML = `
      <div class="al-vb-countdown">
        <button type="button" class="al-vb-btn ghost al-vb-cancel" id="al-vb-cancel" title="Cancel auto-save">
          ${iconHtml(X, {
				width: 13,
				height: 13
			})}
        </button>
        <span class="al-vb-timer">
          ${iconHtml(Clock, {
				width: 11,
				height: 11,
				class: "al-pulse"
			})}
          <span>Ep. ${activeEp} · <strong>${autoTrackState.countdown}s</strong></span>
        </span>
        <button type="button" class="al-vb-btn primary-sm al-vb-save" id="al-vb-savenow" title="Save now">
          ${iconHtml(Check, {
				width: 13,
				height: 13
			})}
        </button>
      </div>`;
			widget.querySelector("#al-vb-cancel")?.addEventListener("click", (e) => {
				e.stopPropagation();
				callbacks.onCancel();
			});
			widget.querySelector("#al-vb-savenow")?.addEventListener("click", (e) => {
				e.stopPropagation();
				callbacks.onSave(activeEp);
			});
			return;
		}
		if (trackedProgress > 0 && activeEp < trackedProgress && autoTrackState?.preventRewind) {
			widget.innerHTML = `
      <div class="al-vb-recap">
        <span class="al-vb-recap-text">
          ${iconHtml(Eye, {
				width: 12,
				height: 12
			})}
          <span>Ep. ${activeEp} · Rewatch</span>
        </span>
        <button type="button" class="al-vb-btn ghost-xs" id="al-vb-force" title="Sync AniList progress to Ep. ${activeEp}">
          ${iconHtml(RefreshCcw, {
				width: 11,
				height: 11
			})}
        </button>
      </div>`;
			widget.querySelector("#al-vb-force")?.addEventListener("click", (e) => {
				e.stopPropagation();
				callbacks.onForce(activeEp);
			});
			return;
		}
		if (trackedProgress > 0 && activeEp === trackedProgress) {
			widget.innerHTML = `
      <div class="al-vb-synced">
        ${iconHtml(CheckCheck, {
				width: 13,
				height: 13,
				class: "al-text-green"
			})}
        <span>Ep. ${activeEp} Synced</span>
      </div>`;
			return;
		}
		if (trackedProgress > 0 && activeEp < trackedProgress) {
			widget.innerHTML = `
      <div class="al-vb-synced">
        ${iconHtml(Check, {
				width: 13,
				height: 13,
				class: "al-text-green"
			})}
        <span>Ep. ${activeEp} Watched</span>
      </div>`;
			return;
		}
		widget.innerHTML = `
    <button type="button" class="al-vb-mark-btn" id="al-vb-mark" title="Mark episode ${activeEp} as watched on AniList">
      ${iconHtml(Zap, {
			width: 12,
			height: 12
		})}
      <span>Mark Ep. ${activeEp}</span>
    </button>`;
		widget.querySelector("#al-vb-mark")?.addEventListener("click", (e) => {
			e.stopPropagation();
			callbacks.onSave(activeEp);
		});
	}
	function getActiveEpisode() {
		const activeEl = document.querySelector(".episode-wrapper .episode-item.active");
		if (activeEl) {
			const num = parseInt(activeEl.innerText.trim(), 10);
			if (!isNaN(num) && num > 0) return num;
		}
		return 0;
	}
	function highlightEpisodes(trackedProgress) {
		const items = document.querySelectorAll(".episode-wrapper .episode-item");
		if (!items.length) return;
		items.forEach((el) => {
			const num = parseInt(el.innerText.trim(), 10);
			if (isNaN(num)) return;
			const isTracked = trackedProgress > 0 && num === trackedProgress;
			const isDone = trackedProgress > 0 && num < trackedProgress;
			el.classList.toggle("al-tracked", isTracked);
			el.classList.toggle("al-done", isDone);
		});
	}
	handleUrlToken();
	var currentUser = null;
	var currentMedia = null;
	var currentTitle = "";
	var trackedProgress = -1;
	var lastActiveEp = 0;
	var autoTrackTimer = null;
	var countdownInterval = null;
	var autoTrackState = {
		isActive: false,
		countdown: 0,
		targetEp: 0,
		preventRewind: true
	};
	var cancelledEps = new Set();
	function cancelAutoTrack() {
		if (autoTrackTimer) clearTimeout(autoTrackTimer);
		if (countdownInterval) clearInterval(countdownInterval);
		autoTrackTimer = null;
		countdownInterval = null;
		autoTrackState.isActive = false;
		autoTrackState.countdown = 0;
		autoTrackState.targetEp = 0;
	}
	function handleActiveEpisodeChange(newActiveEp) {
		if (!newActiveEp || newActiveEp === lastActiveEp) return;
		lastActiveEp = newActiveEp;
		cancelAutoTrack();
		const settings = Settings.get();
		autoTrackState.preventRewind = settings.preventRewind;
		if (settings.autoTrack && currentMedia && newActiveEp > trackedProgress && !cancelledEps.has(newActiveEp)) {
			if (settings.delay === 0) {
				App.setProgress(newActiveEp);
				return;
			}
			autoTrackState.isActive = true;
			autoTrackState.targetEp = newActiveEp;
			autoTrackState.countdown = settings.delay;
			App.render();
			countdownInterval = setInterval(() => {
				autoTrackState.countdown -= 1;
				if (autoTrackState.countdown <= 0) clearInterval(countdownInterval);
				App.render();
			}, 1e3);
			autoTrackTimer = setTimeout(() => {
				cancelAutoTrack();
				App.setProgress(newActiveEp);
			}, settings.delay * 1e3);
		} else App.render();
	}
	async function findMediaByTitle(title) {
		if (!title) return null;
		const cleaned = cleanTitle(title);
		let res = await AniListAPI.getMedia(cleaned);
		if (!res?.Media && cleaned !== title) res = await AniListAPI.getMedia(title);
		return res?.Media || null;
	}
	var App = {
		async loadUser() {
			if (!Storage.get("anilist_token")) {
				currentUser = null;
				App.render();
				return;
			}
			const data = await AniListAPI.getViewer(() => App.logout());
			if (data?.Viewer) {
				currentUser = data.Viewer;
				App.render();
			}
		},
		logout() {
			cancelAutoTrack();
			Storage.del("anilist_token");
			currentUser = null;
			currentMedia = null;
			trackedProgress = -1;
			lastActiveEp = 0;
			cancelledEps.clear();
			App.render();
			showToast("Disconnected from AniList");
		},
		async setProgress(newProgress) {
			if (!currentMedia) return;
			const entry = currentMedia.mediaListEntry;
			const isCompleted = currentMedia.episodes ? newProgress >= currentMedia.episodes : false;
			const isStarting = !entry || entry.progress === 0;
			const params = {
				mediaId: currentMedia.id,
				progress: newProgress,
				status: isCompleted ? "COMPLETED" : entry?.status || "CURRENT"
			};
			if (isStarting && !entry?.startedAt?.year) params.startedAt = getTodayDate();
			if (isCompleted) params.completedAt = getTodayDate();
			if ((await AniListAPI.saveEntry(params))?.SaveMediaListEntry) {
				cancelledEps.delete(newProgress);
				showToast(isCompleted ? "🎉 Completed on AniList!" : `Episode ${newProgress} saved`);
				App.sync();
			}
		},
		render() {
			const openAuth = () => openTokenModal(async () => {
				await App.loadUser();
				App.sync();
			});
			const hasToken = !!Storage.get("anilist_token");
			const activeEp = getActiveEpisode();
			renderNav(currentUser, {
				onLogin: openAuth,
				onLogout: () => App.logout(),
				onChangeToken: openAuth
			});
			renderActions(currentMedia, hasToken, {
				onConnect: openAuth,
				onAdd: () => App.setProgress(activeEp || 1),
				onStatusChange: async (status) => {
					if (await AniListAPI.saveEntry({
						mediaId: currentMedia.id,
						status
					})) {
						showToast(`Status: ${AniListAPI.statuses[status]}`);
						App.sync();
					}
				},
				onScoreChange: async (score) => {
					if (await AniListAPI.saveEntry({
						mediaId: currentMedia.id,
						score
					})) showToast(score ? `Score: ${score}/10` : "Score removed");
				},
				onDelete: async () => {
					if (confirm("Remove this anime from your AniList?") && await AniListAPI.deleteEntry(currentMedia.mediaListEntry.id)) {
						showToast("Anime removed");
						App.sync();
					}
				}
			});
			renderVideoBottom({
				activeEp,
				trackedProgress,
				total: currentMedia?.episodes || 0,
				hasToken,
				autoTrackState,
				callbacks: {
					onSave: (ep) => {
						cancelAutoTrack();
						App.setProgress(ep);
					},
					onCancel: () => {
						if (autoTrackState.targetEp) cancelledEps.add(autoTrackState.targetEp);
						cancelAutoTrack();
						App.render();
					},
					onForce: (ep) => {
						cancelAutoTrack();
						App.setProgress(ep);
					}
				}
			});
			highlightEpisodes(trackedProgress);
		},
		async sync() {
			if (!Storage.get("anilist_token")) {
				currentMedia = null;
				trackedProgress = -1;
				App.render();
				return;
			}
			const meta = extractPageMetadata();
			if (meta.anilistId) currentMedia = (await AniListAPI.getMediaById(meta.anilistId))?.Media || null;
			if (!currentMedia && meta.romajiTitle) currentMedia = await findMediaByTitle(meta.romajiTitle);
			if (!currentMedia && currentTitle) currentMedia = await findMediaByTitle(currentTitle);
			trackedProgress = currentMedia?.mediaListEntry ? currentMedia.mediaListEntry.progress : -1;
			App.render();
		},
		init() {
			App.loadUser();
			Settings.subscribe((settings) => {
				autoTrackState.preventRewind = settings.preventRewind;
				if (!settings.autoTrack) cancelAutoTrack();
				App.render();
			});
			document.addEventListener("click", (e) => {
				document.querySelectorAll("#al-nav-dropdown, #al-nav-m-dropdown").forEach((d) => {
					if (!d.contains(e.target) && !e.target.closest("#al-nav-desktop, #al-nav-mobile")) d.classList.remove("show");
				});
				if (e.target.closest(".episode-wrapper .episode-item")) setTimeout(() => {
					const ep = getActiveEpisode();
					if (ep) handleActiveEpisodeChange(ep);
				}, 80);
				if (e.target.closest("#video-bottom a.prev, #video-bottom a.next")) setTimeout(() => {
					const ep = getActiveEpisode();
					if (ep) handleActiveEpisodeChange(ep);
				}, 150);
			});
			setInterval(() => {
				const titleEl = document.querySelector("#anime .title, h1.title");
				if (titleEl && titleEl.innerText.trim() !== currentTitle) {
					currentTitle = titleEl.innerText.trim();
					App.sync();
				}
				const ep = getActiveEpisode();
				if (ep && ep !== lastActiveEp) handleActiveEpisodeChange(ep);
				if (!document.getElementById("al-nav-desktop") || !document.getElementById("al-video-bottom-widget")) App.render();
				highlightEpisodes(trackedProgress);
			}, 600);
		}
	};
	App.init();
})();
