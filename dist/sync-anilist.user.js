// ==UserScript==
// @name         AnimeUnity to AniList Sync
// @namespace    https://github.com/pallax03/my-userscripts
// @version      1.2.0
// @author       Alex Mazzoni
// @description  Automatically sync watched AnimeUnity episodes and status to AniList
// @license      MIT
// @source       https://github.com/pallax03/my-userscripts.git
// @downloadURL  https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/sync-anilist.user.js
// @updateURL    https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/sync-anilist.user.js
// @include      *://*.animeunity.*/*
// @include      *://animeunity.*/*
// @include      /^https?:\/\/(?:[a-z0-9-]+\.)?animeunity\.[a-z]{2,}\/.*$/
// @match        *://*.animeunity.to/*
// @match        *://animeunity.to/*
// @match        *://*.animeunity.so/*
// @match        *://animeunity.so/*
// @match        *://*.animeunity.tv/*
// @match        *://animeunity.tv/*
// @match        *://*.animeunity.it/*
// @match        *://animeunity.it/*
// @match        *://*.animeunity.cc/*
// @match        *://animeunity.cc/*
// @match        *://*.animeunity.fun/*
// @match        *://animeunity.fun/*
// @connect      graphql.anilist.co
// @connect      anilist.co
// @connect      127.0.0.1
// @connect      localhost
// @grant        GM_addStyle
// @grant        GM_deleteValue
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
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
	_css(".al-badge{white-space:nowrap;-webkit-backdrop-filter:blur(8px);border:1px solid #0000;border-radius:6px;align-items:center;gap:5px;padding:3px 8px;font-size:11px;font-weight:700;line-height:1.2;display:inline-flex}.al-badge svg{flex-shrink:0}.al-badge.al-badge-CURRENT{color:#76caf6;background:#3db4f229;border-color:#3db4f273}.al-badge.al-badge-CURRENT .al-dot{background:#3db4f2;box-shadow:0 0 6px #3db4f299}.al-badge.al-badge-PLANNING{color:#b9c3d0;background:#94a3b829;border-color:#94a3b873}.al-badge.al-badge-PLANNING .al-dot{background:#94a3b8;box-shadow:0 0 6px #94a3b899}.al-badge.al-badge-COMPLETED{color:#45df7e;background:#22c55e29;border-color:#22c55e73}.al-badge.al-badge-COMPLETED .al-dot{background:#22c55e;box-shadow:0 0 6px #22c55e99}.al-badge.al-badge-PAUSED{color:#f8c937;background:#eab30829;border-color:#eab30873}.al-badge.al-badge-PAUSED .al-dot{background:#eab308;box-shadow:0 0 6px #eab30899}.al-badge.al-badge-REPEATING{color:#1fd9f9;background:#06b6d429;border-color:#06b6d473}.al-badge.al-badge-REPEATING .al-dot{background:#06b6d4;box-shadow:0 0 6px #06b6d499}.al-badge.al-badge-DROPPED{color:#f47c7c;background:#ef444429;border-color:#ef444473}.al-badge.al-badge-DROPPED .al-dot{background:#ef4444;box-shadow:0 0 6px #ef444499}.al-dot{border-radius:50%;flex-shrink:0;width:6px;height:6px;display:inline-block}.al-btn{cursor:pointer;white-space:nowrap;border:1px solid #0000;border-radius:9px;justify-content:center;align-items:center;gap:6px;padding:8px 16px;font-size:13px;font-weight:700;text-decoration:none;transition:all .2s cubic-bezier(.4,0,.2,1);display:inline-flex}.al-btn:hover{text-decoration:none;transform:translateY(-1px)}.al-btn:active{transform:translateY(0)}.al-btn.primary{background:linear-gradient(135deg,#3db4f2 0%,#0284c7 100%);box-shadow:0 4px 14px #3db4f259;color:#06101e!important}.al-btn.primary:hover{filter:brightness(1.08);box-shadow:0 6px 20px #3db4f28c;color:#06101e!important}.al-btn.secondary{background:#ffffff14;border-color:#ffffff26;color:#e2e8f0!important}.al-btn.secondary:hover{background:#ffffff24;color:#fff!important}.al-btn.danger{background:#ef444426;border-color:#ef444459;color:#fca5a5!important}.al-btn.danger:hover{background:#ef444447;border-color:#ef4444;color:#fff!important}.al-overlay{-webkit-backdrop-filter:blur(16px);animation:.2s al-fade-in;inset:0!important;box-sizing:border-box!important;z-index:2147483647!important;pointer-events:auto!important;visibility:visible!important;opacity:1!important;background:#03070dd9!important;justify-content:center!important;align-items:center!important;width:100vw!important;min-width:100vw!important;height:100vh!important;min-height:100vh!important;margin:0!important;padding:16px!important;display:flex!important;position:fixed!important;inset:0!important}.al-modal{color:#fff;background:linear-gradient(135deg,#101a27 0%,#080f18 100%);border:1px solid #3db4f259;border-radius:16px;width:90%;max-width:440px;max-height:calc(100vh - 32px);padding:24px;animation:.25s cubic-bezier(.16,1,.3,1) al-modal-in;overflow-y:auto;box-shadow:0 20px 60px #000000d9,0 0 30px #3db4f22e;z-index:2147483647!important;pointer-events:auto!important;visibility:visible!important;opacity:1!important;box-sizing:border-box!important;position:relative!important}.al-modal .al-modal-header{align-items:center;gap:14px;margin-bottom:18px;display:flex}.al-modal .al-modal-icon{color:#3db4f2;background:linear-gradient(135deg,#3db4f233,#0284c71a);border:1px solid #3db4f266;border-radius:12px;flex-shrink:0;justify-content:center;align-items:center;width:44px;height:44px;display:flex;box-shadow:0 0 15px #3db4f24d}.al-modal .al-modal-title{color:#fff;margin:0;font-size:18px;font-weight:700;line-height:1.2}.al-modal .al-modal-subtitle{color:#94a3b8;margin:3px 0 0;font-size:12px;line-height:1.3}.al-modal .al-modal-body{flex-direction:column;gap:12px;display:flex}.al-modal .al-modal-actions{justify-content:flex-end;align-items:center;gap:10px;margin-top:20px;display:flex}.al-auth-link{background:linear-gradient(135deg,#3db4f226,#0ea5e914);border:1px solid #3db4f259;border-radius:10px;justify-content:space-between;align-items:center;padding:11px 14px;font-size:13px;font-weight:700;text-decoration:none;transition:all .2s;display:flex;color:#3db4f2!important}.al-auth-link .al-auth-tag{color:#06101e;text-transform:uppercase;background:#3db4f2;border-radius:5px;padding:2px 6px;font-size:10px;font-weight:900}.al-auth-link:hover{background:linear-gradient(135deg,#3db4f240,#0ea5e929);border-color:#3db4f2}.al-auth-hint{color:#94a3b8;margin:0;font-size:12px;line-height:1.4}.al-input-group input{box-sizing:border-box;color:#fff;background:#0d1521d9;border:1px solid #3db4f259;border-radius:10px;outline:none;width:100%;padding:10px 14px;font-size:13px;transition:all .2s}.al-input-group input:focus{border-color:#3db4f2;box-shadow:0 0 15px #3db4f24d}.al-prefs-modal{max-width:460px!important}.al-prefs-modal .al-prefs-body{flex-direction:column;gap:12px;display:flex}.al-prefs-modal .al-pref-group{background:#ffffff08;border:1px solid #ffffff14;border-radius:12px;flex-direction:column;transition:background .25s,border-color .25s,box-shadow .25s;display:flex;overflow:hidden}.al-prefs-modal .al-pref-group.is-active{background:#3db4f20a;border-color:#3db4f259;box-shadow:0 4px 16px #0000004d}.al-prefs-modal .al-pref-group.is-active .al-pref-header{border-bottom:1px solid #3db4f226}.al-prefs-modal .al-pref-group .al-pref-header{cursor:pointer;justify-content:space-between;align-items:center;gap:14px;margin:0;padding:12px 14px;transition:background .15s;display:flex}.al-prefs-modal .al-pref-group .al-pref-header:hover{background:#ffffff08}.al-prefs-modal .al-pref-group .al-pref-info{flex-direction:column;gap:2px;display:flex}.al-prefs-modal .al-pref-group .al-pref-title{color:#f1f5f9;font-size:13px;font-weight:600}.al-prefs-modal .al-pref-group .al-pref-desc{color:#94a3b8;font-size:11px;font-weight:500}.al-prefs-modal .al-pref-group .al-pref-sub{background:#080e1799;flex-direction:column;gap:12px;padding:12px 14px;animation:.22s cubic-bezier(.16,1,.3,1) al-slide-down;display:flex}.al-prefs-modal .al-pref-group .al-pref-sub.is-hidden{display:none!important}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row{color:#cbd5e1;cursor:pointer;justify-content:space-between;align-items:center;gap:12px;margin:0;font-size:12px;font-weight:500;display:flex}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-pref-sub-label{color:#94a3b8;align-items:center;gap:8px;display:flex}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-pref-sub-label svg{color:#3db4f2}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-select-xs{color:#f1f5f9;cursor:pointer;background:#0e1622f2;border:1px solid #ffffff29;border-radius:7px;outline:none;padding:4px 8px;font-size:12px;font-weight:600}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-select-xs:hover,.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-select-xs:focus{border-color:#3db4f2}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-checkbox{accent-color:#3db4f2;cursor:pointer;width:16px;height:16px}.al-prefs-modal .al-switch{appearance:none;cursor:pointer;background:#ffffff29;border-radius:12px;outline:none;flex-shrink:0;width:36px;height:20px;transition:background .2s;position:relative}.al-prefs-modal .al-switch:after{content:\"\";background:#fff;border-radius:50%;width:16px;height:16px;transition:transform .2s cubic-bezier(.16,1,.3,1);position:absolute;top:2px;left:2px;box-shadow:0 1px 3px #0006}.al-prefs-modal .al-switch:checked{background:#3db4f2}.al-prefs-modal .al-switch:checked:after{background:#06101e;transform:translate(16px)}.al-prefs-modal .al-avatar-sm{object-fit:cover;border:1px solid #3db4f2;border-radius:50%;width:22px;height:22px;box-shadow:0 0 6px #3db4f24d}.al-prefs-modal .al-btn-logout{padding:5px 10px;font-size:11px;color:#fca5a5!important;border-color:#ef44444d!important}.al-prefs-modal .al-btn-logout:hover{color:#fff!important;background:#ef444433!important;border-color:#ef4444!important}.al-toast{-webkit-backdrop-filter:blur(12px);animation:.2s cubic-bezier(.16,1,.3,1) al-modal-in;width:auto!important;max-width:380px!important;height:auto!important;min-height:unset!important;color:#fff!important;z-index:1000000!important;pointer-events:none!important;background:#0e1a29f2!important;border:1px solid #3db4f2!important;border-left-width:4px!important;border-radius:10px!important;padding:10px 20px!important;font-size:13px!important;font-weight:700!important;line-height:1.4!important;position:fixed!important;inset:auto auto 85px 50%!important;transform:translate(-50%)!important;box-shadow:0 12px 36px #000000d9,0 0 16px #3db4f240!important}@keyframes al-modal-in{0%{opacity:0;transform:translateY(10px)scale(.97)}to{opacity:1;transform:translateY(0)scale(1)}}@keyframes al-fade-in{0%{opacity:0}to{opacity:1}}@keyframes al-slide-down{0%{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}.cover-wrap .actions,.list-btn-mobile,#add-to-fav,a[href*=\\/login].list,a[href*=\\/login].btn-danger{display:none!important}#video-bottom{border-bottom:1px solid #3db4f233;min-height:40px;background-color:var(--color-background-1,#131722)!important;justify-content:center!important;align-items:center!important;padding:6px 12px!important;display:flex!important;position:relative!important;overflow:visible!important}#video-bottom a.prev{z-index:2;transition:all .2s;color:#94a3b8!important;white-space:nowrap!important;align-items:center!important;gap:6px!important;font-size:12px!important;font-weight:600!important;text-decoration:none!important;display:inline-flex!important;position:absolute!important;top:50%!important;left:12px!important;transform:translateY(-50%)!important}#video-bottom a.prev:hover{color:#3db4f2!important;text-decoration:none!important}#video-bottom a.next{z-index:2;transition:all .2s;color:#94a3b8!important;white-space:nowrap!important;align-items:center!important;gap:6px!important;font-size:12px!important;font-weight:600!important;text-decoration:none!important;display:inline-flex!important;position:absolute!important;top:50%!important;right:12px!important;transform:translateY(-50%)!important}#video-bottom a.next:hover{color:#3db4f2!important;text-decoration:none!important}@media (width<=500px){#video-bottom{padding:4px 8px!important}#video-bottom a.prev span,#video-bottom a.next span{display:none!important}#video-bottom a.prev,#video-bottom a.next{font-size:14px!important}}#video-bottom #al-video-bottom-widget{z-index:1;justify-content:center;align-items:center;gap:8px;max-width:calc(100% - 170px);margin:0 auto;display:flex}@media (width<=500px){#video-bottom #al-video-bottom-widget{max-width:calc(100% - 64px)}}#video-bottom #al-video-bottom-widget .al-vb-status-slot,#video-bottom #al-video-bottom-widget .al-vb-buddy-slot{align-items:center;display:inline-flex}#video-bottom #al-video-bottom-widget .al-vb-mark-btn{cursor:pointer;white-space:nowrap;background:linear-gradient(135deg,#3db4f2 0%,#0284c7 100%);border:none;border-radius:6px;align-items:center;gap:5px;min-height:26px;padding:4px 12px;font-size:11px;font-weight:800;transition:all .2s cubic-bezier(.16,1,.3,1);display:inline-flex;box-shadow:0 0 12px #3db4f266;color:#06101e!important}#video-bottom #al-video-bottom-widget .al-vb-mark-btn:hover{filter:brightness(1.08);transform:scale(1.04);box-shadow:0 0 16px #3db4f299}#video-bottom #al-video-bottom-widget .al-vb-mark-btn:active{transform:scale(.97)}#video-bottom #al-video-bottom-widget .al-vb-countdown{background:#0e1622f2;border:1px solid #3db4f273;border-radius:8px;justify-content:space-between;align-items:center;gap:8px;max-width:100%;padding:3px 6px;animation:2s ease-in-out infinite al-pulse-border;display:inline-flex;box-shadow:0 0 14px #3db4f240}#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-timer{color:#e2e8f0;white-space:nowrap;align-items:center;gap:5px;padding:0 4px;font-size:11px;font-weight:600;display:flex}#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-timer strong{color:#3db4f2}#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-btn{cursor:pointer;white-space:nowrap;justify-content:center;align-items:center;min-width:24px;min-height:24px;padding:0;transition:all .15s;display:inline-flex}#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-btn.al-vb-cancel{color:#fca5a5;background:#ef44441a;border:1px solid #ef44444d;border-radius:6px}#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-btn.al-vb-cancel:hover,#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-btn.al-vb-cancel:active{color:#fff;background:#ef44444d;border-color:#ef4444}#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-btn.al-vb-save{color:#06101e;background:linear-gradient(135deg,#3db4f2 0%,#0284c7 100%);border:none;border-radius:6px;box-shadow:0 0 8px #3db4f259}#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-btn.al-vb-save:hover,#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-btn.al-vb-save:active{filter:brightness(1.15);box-shadow:0 0 12px #3db4f28c}#video-bottom #al-video-bottom-widget .al-vb-synced{color:#4ade80;white-space:nowrap;background:#22c55e1f;border:1px solid #22c55e4d;border-radius:6px;align-items:center;gap:5px;min-height:26px;padding:4px 8px;font-size:11px;font-weight:600;display:inline-flex}#video-bottom #al-video-bottom-widget .al-vb-synced .al-vb-reset-btn{color:#94a3b8!important;cursor:pointer!important;background:0 0!important;border:none!important;justify-content:center!important;align-items:center!important;width:18px!important;height:18px!important;margin-left:2px!important;padding:0!important;transition:color .15s!important;display:inline-flex!important}#video-bottom #al-video-bottom-widget .al-vb-synced .al-vb-reset-btn:hover{color:#ef4444!important}#video-bottom #al-video-bottom-widget .al-vb-recap{color:#93c5fd;white-space:nowrap;background:#3b82f61f;border:1px solid #3b82f64d;border-radius:6px;align-items:center;gap:8px;min-height:26px;padding:3px 8px;font-size:11px;font-weight:600;display:inline-flex}#video-bottom #al-video-bottom-widget .al-vb-recap .al-vb-recap-text{align-items:center;gap:5px;display:flex}#video-bottom #al-video-bottom-widget .al-vb-recap .al-vb-btn.ghost-xs{color:#e2e8f0;cursor:pointer;background:#ffffff14;border:1px solid #ffffff26;border-radius:5px;justify-content:center;align-items:center;min-width:22px;min-height:22px;padding:0;display:inline-flex}#video-bottom #al-video-bottom-widget .al-vb-recap .al-vb-btn.ghost-xs:hover{color:#fff;background:#3db4f240;border-color:#3db4f2}.al-card{-webkit-backdrop-filter:blur(20px);background:linear-gradient(135deg,#111a26f0 0%,#0a121cfa 100%);border:1px solid #3db4f24d;border-radius:14px;width:100%;margin-top:14px;margin-bottom:24px;padding:12px 18px 14px;transition:border-color .3s,box-shadow .3s;position:relative;overflow:visible;box-shadow:0 12px 35px #0009,0 0 20px #3db4f21f}.al-card:hover{border-color:#3db4f280;box-shadow:0 14px 40px #000000b3,0 0 25px #3db4f233}.al-card .al-card-row{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;width:100%;display:flex}.al-card .al-left{align-items:center;gap:10px;min-width:0;display:flex}.al-card .al-right,.al-card .al-controls-group{align-items:center;gap:10px;display:flex}.al-card .al-controls-group .al-buddy-cluster{box-sizing:border-box;background:#0e1622a6;border:1px solid #3db4f238;border-radius:10px;align-items:center;gap:6px;height:36px;padding:2px 6px 2px 2px;transition:all .2s;display:inline-flex}.al-card .al-controls-group .al-buddy-cluster:hover{background:#0e1622d9;border-color:#3db4f273}.al-card .al-controls-group .al-buddy-cluster.has-completed{background:#0a1914b3;border-color:#22c55e66}.al-card .al-controls-group .al-buddy-cluster.has-completed:hover{border-color:#22c55ea6}.al-card .al-controls-group .al-buddy-cluster .al-buddy-box{align-items:center;display:inline-flex}.al-card .al-controls-group .al-buddy-cluster .al-buddy-box .al-buddy-btn{background:0 0;border:none;height:30px;padding:0 8px 0 6px;font-size:12px}.al-card .al-controls-group .al-buddy-cluster .al-buddy-box .al-buddy-btn:hover{box-shadow:none;background:#ffffff0f}.al-card .al-controls-group .al-buddy-cluster .al-buddy-sync-btn{cursor:pointer;white-space:nowrap;background:linear-gradient(135deg,#3db4f238,#0284c74d);border:1px solid #3db4f280;border-radius:7px;align-items:center;gap:5px;height:28px;padding:0 10px;font-size:11.5px;font-weight:700;transition:all .2s cubic-bezier(.4,0,.2,1);display:inline-flex;box-shadow:0 0 10px #3db4f233;color:#38bdf8!important}.al-card .al-controls-group .al-buddy-cluster .al-buddy-sync-btn svg{flex-shrink:0;transition:transform .2s}.al-card .al-controls-group .al-buddy-cluster .al-buddy-sync-btn:hover{background:linear-gradient(135deg,#3db4f2 0%,#0284c7 100%);border-color:#0000;transform:translateY(-1px);box-shadow:0 4px 14px #3db4f273;color:#06101e!important}.al-card .al-controls-group .al-buddy-cluster .al-buddy-sync-btn:hover svg{transform:scale(1.1)}.al-card .al-controls-group .al-buddy-cluster .al-buddy-sync-btn:active{transform:translateY(0)}.al-card .al-controls-group .al-buddy-cluster .al-buddy-sync-btn.is-completed{background:linear-gradient(135deg,#22c55e40,#16a34a59);border:1px solid #22c55e99;box-shadow:0 0 12px #22c55e40;color:#4ade80!important}.al-card .al-controls-group .al-buddy-cluster .al-buddy-sync-btn.is-completed:hover{background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);border-color:#0000;box-shadow:0 4px 16px #22c55e80;color:#052e16!important}.al-card .al-controls-group .al-buddy-cluster .al-buddy-tag{white-space:nowrap;color:#94a3b8;background:#ffffff0f;border:1px solid #ffffff1a;border-radius:6px;align-items:center;gap:5px;height:26px;padding:0 8px;font-size:11px;font-weight:700;display:inline-flex}.al-card .al-controls-group .al-buddy-cluster .al-buddy-tag .al-dot{background:#94a3b8;border-radius:50%;flex-shrink:0;width:5px;height:5px;display:inline-block}.al-card .al-controls-group .al-buddy-cluster .al-buddy-tag.is-completed{color:#4ade80;background:#22c55e26;border-color:#22c55e66}.al-card .al-controls-group .al-buddy-cluster .al-buddy-tag.is-completed .al-dot{background:#22c55e;box-shadow:0 0 6px #22c55e99}.al-card .al-info{color:#e2e8f0;align-items:center;gap:10px;font-size:13px;font-weight:600;display:flex}.al-card .al-pill{text-transform:uppercase;letter-spacing:.5px;color:#06101e;background:linear-gradient(135deg,#3db4f2,#0284c7);border-radius:6px;padding:3px 8px;font-size:11px;font-weight:800}.al-card .al-pill.danger{color:#fff;background:linear-gradient(135deg,#ef4444,#b91c1c)}.al-card .al-badge{background:linear-gradient(135deg,#3db4f22e,#0ea5e91a);border:1px solid #3db4f273;border-radius:9px;align-items:center;gap:8px;max-width:320px;padding:6px 14px;font-size:13px;font-weight:700;text-decoration:none;transition:all .2s;display:inline-flex;color:#3db4f2!important}.al-card .al-badge .al-title-text{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.al-card .al-badge .al-badge-icon{opacity:.85;flex-shrink:0;transition:transform .2s,opacity .2s}.al-card .al-badge:hover{background:linear-gradient(135deg,#3db4f247,#0ea5e933);border-color:#3db4f2;text-decoration:none;transform:translateY(-1px);box-shadow:0 0 15px #3db4f259}.al-card .al-badge:hover .al-badge-icon{opacity:1;transform:translate(1px,-1px)}.al-card .al-icon-btn{color:#94a3b8;cursor:pointer;background:#ffffff0d;border:1px solid #ffffff1f;border-radius:8px;justify-content:center;align-items:center;width:34px;height:34px;transition:all .2s;display:inline-flex}.al-card .al-icon-btn:hover{color:#fff;background:#ffffff1f;border-color:#ffffff4d;transform:translateY(-1px)}.al-card .al-icon-btn.primary{background:linear-gradient(135deg,#3db4f2 0%,#0284c7 100%);border:none;color:#06101e!important}.al-card .al-icon-btn.primary:hover{filter:brightness(1.15);box-shadow:0 0 10px #3db4f280;color:#06101e!important}.al-card .al-icon-btn.danger:hover{color:#ef4444;background:#ef44442e;border-color:#ef4444;box-shadow:0 0 12px #ef44444d}.al-card .al-title-meta-wrap{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.al-card .al-more-wrap{align-items:center;display:inline-flex;position:relative}.al-card .al-more-wrap .al-more-menu{-webkit-backdrop-filter:blur(20px);z-index:100;border:1px solid #3db4f259;border-radius:8px;min-width:140px;padding:4px;position:absolute;top:calc(100% + 6px);left:0;right:auto;box-shadow:0 8px 24px #0009;background:#0d1624!important}.al-card .al-more-wrap .al-more-menu .al-more-menu-item{color:#ef4444;cursor:pointer;text-align:left;background:0 0;border:none;border-radius:6px;align-items:center;gap:6px;width:100%;padding:6px 10px;font-size:12px;font-weight:600;transition:all .15s;display:flex}.al-card .al-more-wrap .al-more-menu .al-more-menu-item:hover{color:#fca5a5;background:#ef444426}.al-card .al-card-dates-row{border-top:1px solid #ffffff0f;justify-content:space-between;align-items:center;width:100%;margin-top:10px;padding-top:8px;display:flex}.al-card .al-card-dates-row .al-date-col{align-items:center;gap:6px;display:flex}.al-card .al-card-dates-row .al-date-col.al-date-start{justify-content:flex-start}.al-card .al-card-dates-row .al-date-col.al-date-end{justify-content:flex-end;margin-left:auto}.al-card .al-card-dates-row .al-meta-date{color:#94a3b8;white-space:nowrap;background:#ffffff0a;border:1px solid #ffffff14;border-radius:6px;align-items:center;gap:5px;padding:2.5px 8px;font-size:11px;font-weight:600;display:inline-flex}.al-card .al-card-dates-row .al-meta-date svg{color:#38bdf8;opacity:.85}.al-card .al-card-dates-row .al-meta-date.al-meta-repeat{color:#a78bfa;background:#a78bfa14;border-color:#a78bfa40}.al-card .al-card-dates-row .al-meta-date.al-meta-repeat svg{color:#a78bfa}.al-card .al-select{appearance:none;color:#f1f5f9;cursor:pointer;background:#0e1622d9 url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='none' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' d='m1 1 4 4 4-4'/%3E%3C/svg%3E\") right 10px center no-repeat;border:1px solid #ffffff29;border-radius:9px;outline:none;height:36px;padding:6px 30px 6px 12px;font-size:13px;font-weight:600;transition:all .2s}.al-card .al-select:hover,.al-card .al-select:focus{border-color:#3db4f2;box-shadow:0 0 12px #3db4f240}.al-card .al-select option{color:#fff;background:#0e1622}.al-card .al-card-progress-bar{background:#ffffff0f;height:3px;position:absolute;bottom:0;left:0;right:0}.al-card .al-card-progress-bar .al-card-progress-fill{background:linear-gradient(90deg,#3db4f2,#22c55e);height:100%;transition:width .3s;box-shadow:0 0 8px #3db4f2b3}@media (width<=768px){.al-card{padding:12px 14px 14px}.al-card .al-card-row{flex-direction:column;align-items:stretch;gap:12px}.al-card .al-left{width:100%}.al-card .al-left .al-title-meta-wrap{justify-content:space-between;align-items:center;gap:8px;width:100%;display:flex}.al-card .al-left .al-title-meta-wrap .al-badge{flex:1;min-width:0;max-width:none}.al-card .al-left .al-title-meta-wrap .al-more-wrap{flex-shrink:0}.al-card .al-left .al-title-meta-wrap .al-more-wrap .al-more-menu{left:auto;right:0}.al-card .al-right{width:100%}.al-card .al-controls-group{flex-wrap:wrap;align-items:center;gap:8px;width:100%;display:flex}.al-card .al-controls-group .al-buddy-cluster{box-sizing:border-box;justify-content:space-between;align-items:center;gap:8px;width:100%;height:auto;min-height:38px;padding:4px 6px;display:flex}.al-card .al-controls-group .al-buddy-cluster .al-buddy-box{flex:1;min-width:0}.al-card .al-controls-group .al-buddy-cluster .al-buddy-box .al-buddy-picker-wrap{width:100%}.al-card .al-controls-group .al-buddy-cluster .al-buddy-box .al-buddy-picker-wrap .al-buddy-btn{justify-content:flex-start;width:100%}.al-card .al-controls-group .al-select{flex:calc(50% - 24px);min-width:100px;height:36px}.al-card .al-controls-group .al-icon-btn.danger{flex-shrink:0;width:36px;height:36px}}.al-avatar{object-fit:cover;border:2px solid #3db4f2;border-radius:50%;width:36px;height:36px;transition:transform .2s,box-shadow .2s;box-shadow:0 0 12px #3db4f266}.al-avatar:hover{transform:scale(1.05);box-shadow:0 0 18px #3db4f2a6}.al-avatar-mobile{object-fit:cover;cursor:pointer;border:2px solid #3db4f2;border-radius:50%;width:32px;height:32px;box-shadow:0 0 10px #3db4f259}.al-dropdown-menu{-webkit-backdrop-filter:blur(20px);box-sizing:border-box;min-width:220px;max-width:calc(100vw - 24px);max-height:calc(100vh - 75px);overflow:hidden auto;box-shadow:0 16px 45px #000000d9,0 0 20px #3db4f226;background:linear-gradient(135deg,#111a26fa 0%,#080f18fc 100%)!important;border:1px solid #3db4f24d!important;border-radius:14px!important;padding:0!important}.al-dropdown-menu:before{content:\"\";background:0 0;height:16px;position:absolute;top:-15px;left:0;right:0}.al-dropdown-menu .al-dropdown-header{background:#ffffff08;border-bottom:1px solid #ffffff14;padding:14px 16px 12px}.al-dropdown-menu .al-dropdown-header .al-user-info{align-items:center;gap:10px;display:flex}.al-dropdown-menu .al-dropdown-header .al-dropdown-avatar{object-fit:cover;border:2px solid #3db4f2;border-radius:50%;width:40px;height:40px;box-shadow:0 0 12px #3db4f273}.al-dropdown-menu .al-dropdown-header .al-user-text{flex-direction:column;display:flex;overflow:hidden}.al-dropdown-menu .al-dropdown-header .al-username{color:#fff;white-space:nowrap;text-overflow:ellipsis;max-width:145px;font-size:14px;font-weight:700;overflow:hidden}.al-dropdown-menu .al-dropdown-header .al-user-status{color:#94a3b8;align-items:center;gap:6px;font-size:11px;font-weight:600;display:flex}.al-dropdown-menu .al-dropdown-header .al-status-dot{background:#22c55e;border-radius:50%;width:7px;height:7px;box-shadow:0 0 8px #22c55e}.al-dropdown-menu .al-dropdown-body{padding:6px 0}.al-dropdown-menu .al-dropdown-footer{background:#00000040;border-top:1px solid #ffffff14;padding:6px 8px}.al-dropdown-menu .al-dropdown-item{color:#cbd5e1;cursor:pointer;background:0 0;border:none;justify-content:space-between;align-items:center;width:100%;padding:10px 16px;font-size:13px;font-weight:500;text-decoration:none;transition:all .15s;display:flex}.al-dropdown-menu .al-dropdown-item .al-item-left{align-items:center;gap:10px;display:flex}.al-dropdown-menu .al-dropdown-item .al-item-ext{color:#64748b;transition:color .15s}.al-dropdown-menu .al-dropdown-item:hover{text-decoration:none;color:#fff!important;background:#3db4f224!important}.al-dropdown-menu .al-dropdown-item:hover .al-item-ext{color:#3db4f2}.al-dropdown-menu .al-dropdown-item.danger{color:#fca5a5;background:#ef444414;border:1px solid #ef444438;border-radius:8px;margin:2px 0;padding:8px 12px;font-weight:600}.al-dropdown-menu .al-dropdown-item.danger:hover{box-shadow:0 0 14px #ef444440;color:#fff!important;background:#ef444438!important;border-color:#ef444480!important}.episode-wrapper .episode-item.al-done:not(.active):not(.al-tracked){background-color:#3db4f21f!important;border:1px solid #3db4f24d!important}.episode-wrapper .episode-item.al-done:not(.active):not(.al-tracked) a{color:#93c5fd!important}.episode-wrapper .episode-item.al-tracked{position:relative;border:2px solid #3db4f2!important}.episode-wrapper .episode-item.al-tracked:not(.active){background-color:#3db4f233!important}.episode-wrapper .episode-item.al-tracked:not(.active) a{color:#3db4f2!important;font-weight:700!important}.episode-wrapper .episode-item.al-tracked:after{content:\"✓\";color:#06101e;z-index:6;background:#3db4f2;border-radius:50%;justify-content:center;align-items:center;width:15px;height:15px;font-size:10px;font-weight:900;display:flex;position:absolute;top:-6px;right:-6px;box-shadow:0 2px 6px #0009}.episode-wrapper .episode-item.seen:not(.active):not(.al-tracked):not(.al-done){background-color:var(--color-background-1,#191d26)!important;color:inherit!important}.episode-wrapper .episode-item.active{z-index:10!important;background:#007bff!important;transform:scale(1.12)!important;box-shadow:0 0 16px #007bfff2,0 0 0 2px #fff!important}.episode-wrapper .episode-item.active a{color:#fff!important;font-weight:900!important}.al-toast{width:auto!important;max-width:380px!important;height:auto!important;min-height:unset!important;color:#fff!important;z-index:100000!important;pointer-events:none!important;background:linear-gradient(135deg,#102538 0%,#091724 100%)!important;border:1px solid #3db4f259!important;border-left:4px solid #3db4f2!important;border-radius:9px!important;padding:12px 20px!important;font-size:13px!important;font-weight:600!important;line-height:1.4!important;position:fixed!important;inset:auto 24px 24px auto!important;transform:none!important;box-shadow:0 10px 30px #0009,0 0 15px #3db4f233!important}.al-toast.al-toast-alert,.al-toast.alert{border-color:#ef444473!important;box-shadow:0 10px 30px #0009,0 0 15px #ef444440!important}@keyframes al-pulse-border{0%,to{border-color:#3db4f273;box-shadow:0 0 12px #3db4f233}50%{border-color:#3db4f2cc;box-shadow:0 0 20px #3db4f273}}.al-home-shelf-row{width:100%;margin-top:10px;margin-bottom:24px}.al-home-shelf{-webkit-backdrop-filter:blur(16px);background:#0e16228c;border:1px solid #ffffff14;border-radius:14px;width:100%;padding:16px 20px;box-shadow:0 8px 32px #00000040}@media (width<=576px){.al-home-shelf{padding:14px 12px}}.al-shelf-header{border-bottom:1px solid #ffffff0f;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;padding-bottom:12px;display:flex}.al-shelf-title-wrap{align-items:center;gap:10px;display:flex}.al-shelf-title-wrap .al-shelf-icon{color:#3db4f2;background:#3db4f226;border-radius:8px;justify-content:center;align-items:center;width:28px;height:28px;display:flex;box-shadow:0 0 10px #3db4f240}.al-shelf-title-wrap .al-shelf-title{letter-spacing:.6px;text-transform:uppercase;color:#fff;margin:0;font-size:1.15rem;font-weight:800;line-height:1}.al-shelf-title-wrap .al-shelf-count{color:#94a3b8;background:#ffffff14;border:1px solid #ffffff0f;border-radius:10px;justify-content:center;align-items:center;padding:2px 8px;font-size:11px;font-weight:700;display:inline-flex}.al-shelf-controls{align-items:center;gap:12px;display:flex}.al-shelf-pref-btn{color:#94a3b8;cursor:pointer;background:#ffffff0d;border:1px solid #ffffff14;border-radius:8px;justify-content:center;align-items:center;width:28px;height:28px;transition:all .2s;display:flex}.al-shelf-pref-btn:hover{color:#3db4f2;background:#3db4f226;border-color:#3db4f259}.al-shelf-filter{cursor:pointer;-webkit-user-select:none;user-select:none;background:#ffffff0a;border:1px solid #ffffff0f;border-radius:8px;align-items:center;gap:8px;padding:5px 10px;transition:all .2s;display:inline-flex}.al-shelf-filter:hover{background:#ffffff12;border-color:#ffffff1f}.al-shelf-filter .al-shelf-toggle-box{background:#ffffff26;border-radius:10px;width:32px;height:18px;transition:background-color .2s;position:relative}.al-shelf-filter .al-shelf-toggle-box.active{background:#3db4f2;box-shadow:0 0 8px #3db4f266}.al-shelf-filter .al-shelf-toggle-box .al-shelf-toggle-knob{background:#fff;border-radius:50%;width:14px;height:14px;transition:transform .2s cubic-bezier(.16,1,.3,1);position:absolute;top:2px;left:2px}.al-shelf-filter .al-shelf-toggle-box .al-shelf-toggle-knob.active{transform:translate(14px)}.al-shelf-filter .al-shelf-filter-label{color:#cbd5e1;align-items:center;gap:5px;font-size:11.5px;font-weight:600;display:flex}.al-shelf-filter .al-shelf-unwatched-pill{color:#3db4f2;background:#3db4f233;border-radius:6px;padding:1px 6px;font-size:10px;font-weight:700}.al-shelf-carousel-wrap{width:100%;position:relative}.al-shelf-track{scroll-snap-type:x mandatory;scroll-behavior:smooth;scrollbar-width:thin;scrollbar-color:#3db4f24d transparent;gap:16px;padding:4px 2px 14px;display:flex;overflow-x:auto}.al-shelf-track::-webkit-scrollbar{height:6px}.al-shelf-track::-webkit-scrollbar-track{background:#ffffff08;border-radius:4px}.al-shelf-track::-webkit-scrollbar-thumb{background:#3db4f24d;border-radius:4px}.al-shelf-track::-webkit-scrollbar-thumb:hover{background:#3db4f299}.al-shelf-card{scroll-snap-align:start;cursor:pointer;background:#121a26d9;border:1px solid #ffffff12;border-radius:12px;flex-direction:column;flex:0 0 175px;width:175px;transition:transform .22s cubic-bezier(.16,1,.3,1),box-shadow .22s,border-color .22s;display:flex;position:relative;overflow:hidden}@media (width<=576px){.al-shelf-card{flex:0 0 150px;width:150px}}.al-shelf-card.al-card-loading{opacity:.65;cursor:wait;pointer-events:none}.al-shelf-card:hover{border-color:#3db4f259;transform:translateY(-4px);box-shadow:0 12px 24px #00000073}.al-shelf-card:hover .al-card-cover img{transform:scale(1.05)}.al-card-cover{aspect-ratio:2/3;background:#090e16;border-radius:12px 12px 0 0;width:100%;position:relative;overflow:hidden}.al-card-cover img{object-fit:cover;width:100%;height:100%;transition:transform .3s;display:block}.al-card-badge-top-left{z-index:3;position:absolute;top:8px;left:8px}.al-card-badge-top-right{z-index:3;position:absolute;top:8px;right:8px}.al-card-al-link{color:#94a3b8;-webkit-backdrop-filter:blur(6px);background:#0a0e16bf;border:1px solid #ffffff26;border-radius:6px;justify-content:center;align-items:center;width:24px;height:24px;text-decoration:none;transition:all .2s;display:flex}.al-card-al-link:hover{background:#02a9ff40;border-color:#02a9ff;transform:scale(1.08);box-shadow:0 0 10px #02a9ff80}.al-card-cover-overlay{z-index:2;background:linear-gradient(#0000 0%,#090e1699 40%,#090e16f2 100%);flex-direction:column;gap:4px;padding:24px 8px 6px;display:flex;position:absolute;bottom:0;left:0;right:0}.al-card-progress-text{color:#e2e8f0;text-shadow:0 1px 3px #000c;justify-content:space-between;align-items:center;font-size:10px;font-weight:700;display:flex}.al-card-progress-bar{background:#ffffff2e;border-radius:2px;width:100%;height:4px;overflow:hidden}.al-card-progress-fill{background:#3db4f2;border-radius:2px;height:100%;transition:width .3s}.al-card-body{background:#0e141e99;flex-direction:column;flex:1;justify-content:space-between;gap:10px;padding:10px 10px 12px;display:flex}.al-card-title{color:#f1f5f9;-webkit-line-clamp:2;text-overflow:ellipsis;-webkit-box-orient:vertical;min-height:32px;font-size:12px;font-weight:600;line-height:1.35;text-decoration:none;transition:color .2s;display:-webkit-box;overflow:hidden}.al-card-title:hover{color:#3db4f2}.al-card-actions{width:100%}.al-card-btn{cursor:pointer;border:none;border-radius:6px;justify-content:center;align-items:center;gap:5px;width:100%;padding:6px 8px;font-size:11.5px;font-weight:700;text-decoration:none;transition:all .2s;display:flex}.al-card-btn.al-btn-play{color:#fff;background:#3db4f2;box-shadow:0 2px 8px #3db4f24d}.al-card-btn.al-btn-play:hover{color:#fff;background:#2ca5e6;box-shadow:0 4px 14px #3db4f280}.al-card-btn.al-btn-caughtup{color:#4ade80;background:#22c55e1f;border:1px solid #22c55e4d}.al-card-btn.al-btn-caughtup:hover{color:#86efac;background:#22c55e38;border-color:#22c55e80}.al-card-btn.al-btn-secondary{color:#94a3b8;background:#ffffff0d;border:1px solid #ffffff14}.al-card-btn.al-btn-secondary:hover{color:#e2e8f0;background:#ffffff1a}.al-shelf-empty{text-align:center;color:#94a3b8;background:#ffffff05;border:1px dashed #ffffff14;border-radius:10px;flex-direction:column;justify-content:center;align-items:center;gap:12px;padding:36px 16px;display:flex}.al-shelf-empty .al-shelf-empty-icon{color:#475569}.al-shelf-empty .al-shelf-empty-title{color:#cbd5e1;font-size:14px;font-weight:700}.al-shelf-empty .al-shelf-empty-desc{color:#64748b;max-width:360px;font-size:12px;line-height:1.5}.al-shelf-skeleton{aspect-ratio:2/3;background:linear-gradient(90deg,#ffffff08 25%,#ffffff14 50%,#ffffff08 75%) 0 0/200% 100%;border-radius:12px;flex:0 0 175px;width:175px;animation:1.5s infinite al-skeleton-shimmer}@media (width<=576px){.al-shelf-skeleton{flex:0 0 150px;width:150px}}@keyframes al-skeleton-shimmer{0%{background-position:200% 0}to{background-position:-200% 0}}.al-skeleton-pill{background:linear-gradient(90deg,#ffffff0a 25%,#ffffff17 50%,#ffffff0a 75%) 0 0/200% 100%;border-radius:8px;animation:1.5s infinite al-skeleton-shimmer}.al-spin{animation:.8s linear infinite al-spin;display:inline-block}@keyframes al-spin{0%{transform:rotate(0)}to{transform:rotate(360deg)}}.al-agent-candidate{border-radius:8px;transition:all .2s;animation:2s ease-in-out infinite al-candidate-pulse;position:relative;background:#3db4f21f!important;outline:2px solid #3db4f2!important}@keyframes al-candidate-pulse{0%,to{box-shadow:0 0 0 2px #3db4f2b3,0 0 14px #3db4f24d}50%{box-shadow:0 0 0 3px #3db4f2,0 0 22px #3db4f28c}}.al-agent-countdown-badge{box-sizing:border-box;color:#e2e8f0;pointer-events:none;background:#3db4f22e;border:1px solid #3db4f266;border-radius:6px;justify-content:space-between;align-items:center;width:100%;margin-top:6px;padding:4px 10px;font-size:11px;display:flex}.al-agent-countdown-badge strong{color:#3db4f2;font-weight:700}.al-agent-countdown-badge .al-agent-cancel-hint{color:#94a3b8;font-size:10px}.search-backdrop{z-index:99999!important;pointer-events:auto!important;justify-content:center!important;width:100vw!important;height:100vh!important;display:flex!important;position:fixed!important;top:0!important;left:0!important}.search-backdrop.show{opacity:1!important;visibility:visible!important}.search-backdrop .search-container{opacity:1!important;z-index:100000!important;display:block!important}.search-backdrop .results{opacity:1!important;z-index:100001!important;display:block!important}.al-vt-sync-badge{-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);z-index:10;background:#0f172ad9;border-bottom:1px solid #3db4f240;justify-content:center;align-items:center;padding:6px 12px;display:flex}.al-vt-sync-badge .al-vt-inner{background:#1e293bb3;border:1px solid #3db4f24d;border-radius:9999px;align-items:center;gap:10px;padding:3px 10px;display:inline-flex}.al-vt-sync-badge .al-vt-info{color:#e2e8f0;align-items:center;gap:6px;font-size:11px;display:inline-flex}.al-vt-sync-badge .al-vt-info strong{color:#38bdf8;font-weight:700}.al-vt-sync-badge .al-vt-sync-btn{cursor:pointer;background:linear-gradient(135deg,#38bdf8 0%,#0284c7 100%);border:none;border-radius:9999px;align-items:center;gap:4px;padding:2px 8px;font-size:11px;font-weight:800;transition:all .15s;display:inline-flex;color:#06101e!important}.al-vt-sync-badge .al-vt-sync-btn:hover{filter:brightness(1.1);transform:scale(1.04)}video-player,.video-player{z-index:25;position:relative}.overview>.row:has(#al-control-bar){z-index:25;position:relative}#al-control-bar{z-index:30!important;position:relative!important}#al-control-bar.has-open-popover{z-index:99999!important}.al-elevated-stack{z-index:99999!important;position:relative!important}.al-buddy-btn{color:#e2e8f0;cursor:pointer;box-sizing:border-box;background:#0e1622d9;border:1px solid #ffffff29;border-radius:9px;outline:none;align-items:center;gap:7px;height:36px;padding:0 12px 0 10px;transition:all .2s cubic-bezier(.4,0,.2,1);display:inline-flex}.al-buddy-btn:hover{background:#142032f2;border-color:#38bdf8;box-shadow:0 0 12px #3db4f240}.al-buddy-btn.is-active{background:#0e1a2af2;border-color:#3db4f280;padding:0 10px 0 6px}.al-buddy-btn.is-active:hover{border-color:#38bdf8;box-shadow:0 0 14px #3db4f259}.al-buddy-btn .al-buddy-avatar-chip{object-fit:cover;border:1.5px solid #38bdf8;border-radius:50%;flex-shrink:0;width:22px;height:22px}.al-buddy-btn .al-buddy-name-chip{color:#38bdf8;text-overflow:ellipsis;white-space:nowrap;max-width:105px;font-size:12px;font-weight:700;overflow:hidden}.al-buddy-btn .al-buddy-icon{color:#94a3b8;flex-shrink:0}.al-buddy-btn .al-buddy-label{color:#cbd5e1;font-size:13px;font-weight:600}.al-buddy-btn .al-buddy-chevron{color:#94a3b8;flex-shrink:0;transition:transform .2s}.al-buddy-picker-wrap,.al-buddy-box{display:inline-block;position:relative}.al-buddy-picker-wrap .al-buddy-popover,.al-buddy-box .al-buddy-popover{-webkit-backdrop-filter:blur(24px);box-sizing:border-box;border:1px solid #3db4f259;border-radius:12px;width:280px;padding:8px;position:absolute;top:calc(100% + 6px);right:0;box-shadow:0 20px 50px #000000f2,0 0 20px #3db4f233;z-index:999999!important;background:#0d1624!important}@media (width<=576px){.al-buddy-picker-wrap .al-buddy-popover,.al-buddy-box .al-buddy-popover{width:min(290px,100vw - 32px);right:-10px}}.al-buddy-pop-search-box{background:#ffffff0f;border:1px solid #ffffff24;border-radius:8px;align-items:center;gap:8px;margin-bottom:6px;padding:7px 10px;transition:all .2s;display:flex}.al-buddy-pop-search-box:focus-within{background:#ffffff17;border-color:#38bdf8;box-shadow:0 0 10px #38bdf840}.al-buddy-pop-search-box .al-buddy-search-icon{color:#94a3b8;flex-shrink:0}.al-buddy-pop-search-box .al-buddy-search-input{width:100%;color:#f8fafc!important;box-shadow:none!important;background:0 0!important;border:none!important;outline:none!important;padding:0!important;font-size:12.5px!important;font-weight:500!important}.al-buddy-pop-search-box .al-buddy-search-input::placeholder{color:#64748b}.al-buddy-pop-options{flex-direction:column;gap:2px;max-height:220px;display:flex;overflow-y:auto}.al-buddy-pop-options::-webkit-scrollbar{width:4px}.al-buddy-pop-options::-webkit-scrollbar-thumb{background:#3db4f24d;border-radius:4px}.al-buddy-pop-options .al-buddy-loading,.al-buddy-pop-options .al-buddy-empty{color:#94a3b8;text-align:center;padding:14px;font-size:12px}.al-buddy-pop-options .al-buddy-option{cursor:pointer;text-align:left;box-sizing:border-box;background:0 0;border:1px solid #0000;border-radius:8px;align-items:center;gap:9px;width:100%;padding:7px 9px;transition:all .15s;display:flex}.al-buddy-pop-options .al-buddy-option:hover{background:#38bdf81f;border-color:#38bdf840}.al-buddy-pop-options .al-buddy-option.selected{background:#38bdf82e;border-color:#38bdf866}.al-buddy-pop-options .al-buddy-option.selected .al-buddy-opt-name{color:#38bdf8;font-weight:700}.al-buddy-pop-options .al-buddy-option .al-buddy-opt-avatar{object-fit:cover;border:1px solid #3db4f259;border-radius:50%;flex-shrink:0;width:24px;height:24px}.al-buddy-pop-options .al-buddy-option .al-buddy-opt-name{color:#e2e8f0;text-overflow:ellipsis;white-space:nowrap;flex:1;font-size:12.5px;font-weight:600;overflow:hidden}.al-buddy-pop-options .al-buddy-option .al-buddy-opt-badge{color:#38bdf8;text-transform:uppercase;letter-spacing:.3px;background:#38bdf82e;border-radius:4px;padding:2px 6px;font-size:9px;font-weight:800}.al-buddy-pop-options .al-buddy-option .al-buddy-opt-check{color:#38bdf8;flex-shrink:0}.al-buddy-pop-footer{border-top:1px solid #ffffff14;margin-top:6px;padding-top:6px}.al-buddy-pop-footer .al-buddy-pop-remove{color:#ef4444;cursor:pointer;background:#ef444414;border:1px solid #ef444440;border-radius:8px;justify-content:center;align-items:center;gap:6px;width:100%;padding:6px;font-size:11.5px;font-weight:600;transition:all .15s;display:flex}.al-buddy-pop-footer .al-buddy-pop-remove:hover{color:#fff;background:#ef444433;border-color:#ef4444}.al-card-buddy-overlay{z-index:3;-webkit-backdrop-filter:blur(10px);box-sizing:border-box;background:#0a101ad9;border:1px solid #38bdf866;border-radius:9999px;justify-content:space-between;align-items:center;gap:6px;padding:3px 8px 3px 4px;display:flex;position:absolute;top:38px;left:8px;right:8px;box-shadow:0 4px 12px #00000080}.al-card-buddy-overlay .al-card-buddy-left{flex:1;align-items:center;gap:6px;min-width:0;display:flex;overflow:hidden}.al-card-buddy-overlay .al-card-buddy-avatar{object-fit:cover!important;border:1.5px solid #38bdf8!important;border-radius:50%!important;flex-shrink:0!important;width:20px!important;min-width:20px!important;max-width:20px!important;height:20px!important;min-height:20px!important;max-height:20px!important;display:block!important}.al-card-buddy-overlay .al-card-buddy-name{color:#38bdf8;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;font-size:11px;font-weight:700;overflow:hidden}.al-card-buddy-overlay .al-card-buddy-status{color:#f1f5f9;white-space:nowrap;background:#ffffff1f;border-radius:9999px;flex-shrink:0;margin-left:auto;padding:1.5px 6px;font-size:10px;font-weight:800}.al-btn-buddy-sync{cursor:pointer;box-sizing:border-box;border:none;justify-content:center;align-items:center;gap:5px;width:100%;margin-bottom:6px;transition:all .15s;display:flex;box-shadow:0 0 10px #3db4f240;color:#06101e!important;background:linear-gradient(135deg,#3db4f2 0%,#0284c7 100%)!important;border-radius:6px!important;padding:5px 8px!important;font-size:11px!important;font-weight:800!important}.al-btn-buddy-sync:hover{filter:brightness(1.15);transform:translateY(-1px);box-shadow:0 0 12px #3db4f273}.al-btn-buddy-sync:active{transform:translateY(0)}.al-buddy-picker-wrap{align-items:center;gap:6px;display:inline-flex;position:relative}.al-pref-collapsible .al-pref-header{justify-content:space-between;align-items:center;display:flex}.al-pref-collapsible .al-pref-title-click{cursor:pointer;-webkit-user-select:none;user-select:none;flex:1;align-items:center;gap:8px;display:flex}.al-pref-collapsible .al-pref-title-click .al-pref-chevron{color:#94a3b8;justify-content:center;align-items:center;transition:transform .2s;display:inline-flex}.al-pref-collapsible:not(.is-open) .al-pref-title-click .al-pref-chevron{transform:rotate(-90deg)}.al-pref-collapsible:not(.is-open) .al-pref-sub{display:none!important}.al-pref-collapsible.is-open .al-pref-title-click .al-pref-chevron{transform:rotate(0)}.al-prefs-modal,.al-prefs-modal .al-modal-body,.al-prefs-modal .al-pref-group,.al-prefs-modal .al-pref-group .al-pref-sub{overflow:visible!important}.al-prefs-modal .al-buddy-box{align-items:center;display:flex}.al-prefs-modal .al-buddy-box .al-buddy-btn{height:34px;padding:0 10px 0 6px;font-size:12.5px}.al-prefs-modal .al-buddy-box .al-buddy-btn .al-buddy-avatar-chip{width:22px;height:22px}");
	var Storage = {
		get: (k) => {
			let raw = null;
			try {
				if (typeof GM_getValue === "function") {
					const val = GM_getValue(k);
					if (val !== void 0 && val !== null) {
						if (typeof val === "object") return val;
						raw = val;
					}
				}
			} catch (_) {}
			if (raw === null) try {
				raw = localStorage.getItem(k);
			} catch (_) {
				return null;
			}
			if (raw === null || raw === void 0) return null;
			if (typeof raw === "string") {
				if (raw === "[object Object]") return null;
				try {
					return JSON.parse(raw);
				} catch (_) {
					return raw;
				}
			}
			return raw;
		},
		set: (k, v) => {
			const strVal = typeof v === "object" && v !== null ? JSON.stringify(v) : String(v);
			try {
				if (typeof GM_setValue === "function") GM_setValue(k, strVal);
			} catch (_) {}
			try {
				localStorage.setItem(k, strVal);
			} catch (_) {}
		},
		del: (k) => {
			try {
				if (typeof GM_deleteValue === "function") GM_deleteValue(k);
			} catch (_) {}
			try {
				localStorage.removeItem(k);
			} catch (_) {}
		},
		remove: (k) => Storage.del(k)
	};
	function showToast(text, isAlert = false, duration = 2200) {
		if (!text) return;
		document.querySelectorAll(".al-toast").forEach((el) => el.remove());
		const el = document.createElement("div");
		el.className = `al-toast ${isAlert ? "al-toast-alert" : ""}`;
		el.innerText = text;
		document.body.appendChild(el);
		setTimeout(() => {
			el.style.opacity = "0";
			el.style.transition = "opacity 0.3s";
			setTimeout(() => el.remove(), 300);
		}, duration);
	}
	var LOG_ENDPOINT = "http://127.0.0.1:9876/log";
	if (!window.__AU_LOGS__) window.__AU_LOGS__ = [];
	function emit(level, message, data) {
		const entry = {
			time: new Date().toISOString(),
			level,
			message,
			data
		};
		window.__AU_LOGS__.push(entry);
		if (window.__AU_LOGS__.length > 100) window.__AU_LOGS__.shift();
		const prefix = `[AU-Sync]`;
		if (level === "ERROR") console.error(prefix, message, data || "");
		else if (level === "WARN") console.warn(prefix, message, data || "");
		else console.log(prefix, message, data || "");
		if (typeof window !== "undefined" && window.__AU_DEBUG__) try {
			const payload = JSON.stringify({
				level,
				message,
				data
			});
			if (typeof GM_xmlhttpRequest === "function") GM_xmlhttpRequest({
				method: "POST",
				url: LOG_ENDPOINT,
				headers: { "Content-Type": "application/json" },
				data: payload,
				timeout: 500,
				onerror: () => {},
				ontimeout: () => {}
			});
			else fetch(LOG_ENDPOINT, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: payload
			}).catch(() => {});
		} catch (_) {}
	}
	var Logger = {
		info: (msg, data) => emit("INFO", msg, data),
		warn: (msg, data) => emit("WARN", msg, data),
		error: (msg, data) => emit("ERROR", msg, data),
		getLogs: () => [...window.__AU_LOGS__]
	};
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
		getMedia: (search) => AniListAPI.call(`query($s:String){Media(search:$s,type:ANIME){id idMal episodes title{romaji english}mediaListEntry{id status score progress notes repeat startedAt{year month day}completedAt{year month day}}}}`, { s: search }, { silent: true }),
		getMediaById: (id) => AniListAPI.call(`query($id:Int){Media(id:$id,type:ANIME){id idMal episodes title{romaji english}mediaListEntry{id status score progress notes repeat startedAt{year month day}completedAt{year month day}}}}`, { id: Number(id) }, { silent: true }),
		getUserCollection: (userId) => AniListAPI.call(`query($u:Int){MediaListCollection(userId:$u,type:ANIME){lists{entries{id mediaId status score progress notes repeat startedAt{year month day}completedAt{year month day} media{id idMal episodes title{romaji english}}}}}}`, { u: userId }, { silent: true }),
		getUserWatching: (userId) => AniListAPI.call(`query($u:Int){MediaListCollection(userId:$u,type:ANIME,status_in:[CURRENT,REPEATING],sort:UPDATED_TIME_DESC){lists{entries{id mediaId status score progress notes repeat startedAt{year month day}completedAt{year month day}updatedAt media{id idMal episodes status siteUrl bannerImage coverImage{extraLarge large medium}title{romaji english}nextAiringEpisode{episode airingAt timeUntilAiring}}}}}}`, { u: userId }, { silent: true }),
		getUserFollowing: (userId, page = 1) => AniListAPI.call(`query($u:Int!,$p:Int){Page(page:$p,perPage:50){pageInfo{hasNextPage} following(userId:$u){id name avatar{medium}}}}`, {
			u: Number(userId),
			p: Number(page)
		}, { silent: true }),
		getUserFollowers: (userId, page = 1) => AniListAPI.call(`query($u:Int!,$p:Int){Page(page:$p,perPage:50){pageInfo{hasNextPage} followers(userId:$u){id name avatar{medium}}}}`, {
			u: Number(userId),
			p: Number(page)
		}, { silent: true }),
		searchUsers: (search) => AniListAPI.call(`query($s:String){Page(page:1,perPage:15){users(search:$s){id name avatar{medium}}}}`, { s: String(search) }, { silent: true }),
		getUserByName: (userName) => AniListAPI.call(`query($n:String){User(name:$n){id name avatar{medium}}}`, { n: String(userName) }, { silent: true }),
		getFriendWatching: (userName) => AniListAPI.call(`query($u:String){MediaListCollection(userName:$u,type:ANIME,status_in:[CURRENT,REPEATING,COMPLETED],sort:UPDATED_TIME_DESC){lists{entries{mediaId status progress notes media{id episodes title{romaji english}}}}}}`, { u: String(userName) }, { silent: true }),
		getFriendMediaEntry: (userName, mediaId) => AniListAPI.call(`query($u:String,$m:Int){MediaList(userName:$u,mediaId:$m,type:ANIME){id status progress user{name avatar{medium}}}}`, {
			u: String(userName),
			m: Number(mediaId)
		}, { silent: true }),
		saveEntry: (args) => AniListAPI.call(`mutation($mediaId:Int,$status:MediaListStatus,$score:Float,$progress:Int,$notes:String,$startedAt:FuzzyDateInput,$completedAt:FuzzyDateInput,$repeat:Int){
        SaveMediaListEntry(mediaId:$mediaId,status:$status,score:$score,progress:$progress,notes:$notes,startedAt:$startedAt,completedAt:$completedAt,repeat:$repeat){
          id mediaId status score progress notes repeat startedAt{year month day} completedAt{year month day}
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
	var Calendar = [
		["path", { d: "M8 2v3" }],
		["path", { d: "M16 2v3" }],
		["rect", {
			x: "3",
			y: "3",
			width: "18",
			height: "18",
			rx: "2"
		}],
		["path", { d: "M3 9h18" }]
	];
	var CheckCheck = [["path", { d: "M18 6 7 17l-5-5" }], ["path", { d: "m22 10-7.5 7.5L13 16" }]];
	var Check = [["path", { d: "M20 6 9 17l-5-5" }]];
	var ChevronDown = [["path", { d: "m6 9 6 6 6-6" }]];
	var Clock = [["circle", {
		cx: "12",
		cy: "12",
		r: "10"
	}], ["path", { d: "M12 6v6l4 2" }]];
	var Ellipsis = [
		["circle", {
			cx: "12",
			cy: "12",
			r: "1"
		}],
		["circle", {
			cx: "19",
			cy: "12",
			r: "1"
		}],
		["circle", {
			cx: "5",
			cy: "12",
			r: "1"
		}]
	];
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
	var Link = [["path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }], ["path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" }]];
	var LoaderCircle = [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }]];
	var LogOut = [
		["path", { d: "m16 17 5-5-5-5" }],
		["path", { d: "M21 12H9" }],
		["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }]
	];
	var Play = [["path", { d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" }]];
	var Plus = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
	var RefreshCcw = [
		["path", { d: "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }],
		["path", { d: "M3 3v5h5" }],
		["path", { d: "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" }],
		["path", { d: "M16 16h5v5" }]
	];
	var RotateCcw = [["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }], ["path", { d: "M3 3v5h5" }]];
	var Search = [["path", { d: "m21 21-4.34-4.34" }], ["circle", {
		cx: "11",
		cy: "11",
		r: "8"
	}]];
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
	var Users = [
		["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }],
		["path", { d: "M16 3.128a4 4 0 0 1 0 7.744" }],
		["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }],
		["circle", {
			cx: "9",
			cy: "7",
			r: "4"
		}]
	];
	var X = [["path", { d: "M18 6 6 18" }], ["path", { d: "m6 6 12 12" }]];
	var Zap = [["path", { d: "M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z" }]];
	function iconHtml(iconNode, attrs = {
		width: 12,
		height: 12
	}) {
		return createElement(iconNode, attrs).outerHTML;
	}
	var ANILIST_ICON_SVG = `<svg viewBox="0 0 172 172" width="13" height="13" style="display:block;flex-shrink:0;"><g fill-rule="evenodd"><path d="M111.322 111.157V41.029c0-4.019-2.217-6.237-6.236-6.237H91.365c-4.019 0-6.237 2.218-6.237 6.237v33.304c0 .938 9.037 5.293 9.273 6.214 6.885 26.902 1.496 48.433-5.031 49.438 10.672.528 11.846 5.659 3.897 2.153 1.216-14.354 5.961-14.326 19.602-.528.117.119 2.797 5.741 2.964 5.741h32.217c4.019 0 6.236-2.217 6.236-6.236v-13.721c0-4.019-2.217-6.237-6.236-6.237h-36.728z" fill="#02a9ff"/><path d="M54.365 34.792L18.331 137.351h27.996l6.098-17.74h30.49l5.96 17.74h27.857L80.836 34.792H54.365zm4.435 62.09l8.731-28.412 9.563 28.412H58.8z" fill="#fff"/></g></svg>`;
	function createModal({ id = "al-modal-overlay", className = "", icon = null, title = "", subtitle = "", body = "", actions = [], onClose = null } = {}) {
		document.getElementById(id)?.remove();
		const overlay = document.createElement("div");
		overlay.id = id;
		overlay.className = "al-overlay";
		overlay.style.cssText = "position:fixed!important;top:0!important;left:0!important;right:0!important;bottom:0!important;width:100vw!important;height:100vh!important;z-index:2147483647!important;display:flex!important;align-items:center!important;justify-content:center!important;margin:0!important;padding:16px!important;box-sizing:border-box!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;";
		const modal = document.createElement("div");
		modal.className = `al-modal ${className}`.trim();
		modal.style.cssText = "position:relative!important;z-index:2147483647!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;";
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
		const openedAt = Date.now();
		overlay.onclick = (e) => {
			if (Date.now() - openedAt < 200) return;
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
		(document.body || document.documentElement).appendChild(overlay);
		return {
			overlay,
			modal,
			body: bodyEl,
			close
		};
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
		setTimeout(() => input?.focus(), 60);
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
		for (const raw of [eng, rom]) {
			if (!raw) continue;
			const clean = cleanTitle(raw);
			if (clean && clean.length >= 3) candidates.push(clean);
			const parts = raw.split(/[:\-\(\)]+/).map((p) => cleanTitle(p.trim())).filter((p) => p.length >= 3);
			candidates.push(...parts);
			const noSeason = clean.split(/\b(?:\d+th|1st|2nd|3rd|\d+)\s+season\b/i)[0].trim();
			if (noSeason && noSeason.length >= 3) candidates.push(noSeason);
			const words = clean.split(/\s+/).slice(0, 3).join(" ").trim();
			if (words.length >= 3) candidates.push(words);
		}
		return [...new Set(candidates.filter((c) => c && c.length >= 3))];
	}
	async function resolveAnimeUnityAnime(media, { preferredDub } = {}) {
		if (!media?.id) return null;
		const prefDubInt = (preferredDub || Storage.get("al_pref_language") || "sub") === "dub" ? 1 : 0;
		const rawMap = Storage.get("al_au_map");
		const map = rawMap && typeof rawMap === "object" && !Array.isArray(rawMap) ? rawMap : {};
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
					matchingQuery: query,
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
		const rawMap = Storage.get("al_au_map");
		const map = rawMap && typeof rawMap === "object" && !Array.isArray(rawMap) ? rawMap : {};
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
		if (!media) return "";
		const rawMap = Storage.get("al_au_map");
		const mapped = (rawMap && typeof rawMap === "object" && !Array.isArray(rawMap) ? rawMap : {})[media.id];
		if (mapped?.id && mapped?.slug) {
			const epSuffix = targetEp ? `?ep=${targetEp}` : "";
			return `/anime/${mapped.id}-${mapped.slug}${epSuffix}`;
		}
		return "";
	}
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
	var listeners = new Set();
	var Settings = {
		get() {
			const autoTrack = Storage.get("al_opt_autotrack");
			const delay = Storage.get("al_opt_autodelay");
			const preventRewind = Storage.get("al_opt_prevent_rewind");
			const homeShelf = Storage.get("al_home_shelf_enabled");
			const homeOnlyUnwatched = Storage.get("al_pref_default_unwatched");
			const searchAutoSelectDelay = Storage.get("al_pref_search_autoselect");
			const defaultBuddy = Storage.get("al_pref_default_buddy");
			return {
				autoTrack: autoTrack === true || autoTrack === "true",
				delay: delay !== null && delay !== void 0 && !isNaN(parseInt(delay, 10)) ? parseInt(delay, 10) : 15,
				preventRewind: preventRewind !== false && preventRewind !== "false",
				language: Storage.get("al_pref_language") || "sub",
				homeShelf: homeShelf !== false && homeShelf !== "false",
				homeOnlyUnwatched: homeOnlyUnwatched === true || homeOnlyUnwatched === "true",
				searchAutoSelectDelay: searchAutoSelectDelay !== null && searchAutoSelectDelay !== void 0 ? parseInt(searchAutoSelectDelay, 10) : 5,
				defaultBuddy: defaultBuddy ? String(defaultBuddy).trim() : ""
			};
		},
		set(key, val) {
			if (key === "autoTrack") Storage.set("al_opt_autotrack", String(val));
			else if (key === "delay") Storage.set("al_opt_autodelay", String(val));
			else if (key === "preventRewind") Storage.set("al_opt_prevent_rewind", String(val));
			else if (key === "language") {
				Storage.set("al_pref_language", String(val));
				Storage.del("al_au_map");
			} else if (key === "homeShelf") Storage.set("al_home_shelf_enabled", String(val));
			else if (key === "homeOnlyUnwatched") Storage.set("al_pref_default_unwatched", String(val));
			else if (key === "searchAutoSelectDelay") Storage.set("al_pref_search_autoselect", String(val));
			else if (key === "defaultBuddy") Storage.set("al_pref_default_buddy", String(val || "").trim());
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
	var cache = new Map();
	var CACHE_TTL_MS = 18e4;
	var avatarMap = new Map();
	var Buddy = {
		extract(notes) {
			if (!notes || typeof notes !== "string") return null;
			const match = notes.match(/\[sync:([a-zA-Z0-9_-]+)\]/i);
			return match ? match[1].trim() : null;
		},
		apply(notes, buddyName) {
			const clean = (notes || "").replace(/\s*\[sync:[^\]]+\]/gi, "").trim();
			if (buddyName && buddyName.trim()) return clean ? `${clean} [sync:${buddyName.trim()}]` : `[sync:${buddyName.trim()}]`;
			return clean;
		},
		getViewer() {
			return Storage.get("al_viewer") || null;
		},
		setViewer(viewer) {
			if (viewer) Storage.set("al_viewer", viewer);
			else Storage.del("al_viewer");
		},
		getAvatar(userName) {
			if (!userName) return null;
			const lower = userName.toLowerCase();
			if (avatarMap.has(lower)) return avatarMap.get(lower);
			const stored = Storage.get(`al_avatar_${lower}`);
			if (stored) {
				avatarMap.set(lower, stored);
				return stored;
			}
			return null;
		},
		setAvatar(userName, avatarUrl) {
			if (!userName || !avatarUrl) return;
			const lower = userName.toLowerCase();
			avatarMap.set(lower, avatarUrl);
			Storage.set(`al_avatar_${lower}`, avatarUrl);
		},
		async getFollowingCached(viewerId) {
			return Buddy.getFriendsCached(viewerId);
		},
		async getFriendsCached(viewerId) {
			const id = viewerId || Buddy.getViewer()?.id;
			if (!id) return [];
			const cacheKey = `al_friends_${id}`;
			const cached = Storage.get(cacheKey);
			if (cached && Array.isArray(cached.users) && Date.now() - cached.time < 216e5) {
				for (const u of cached.users) if (u.name && u.avatar?.medium) Buddy.setAvatar(u.name, u.avatar.medium);
				return cached.users;
			}
			try {
				const [followingP1, followingP2, followersP1, followersP2] = await Promise.all([
					AniListAPI.getUserFollowing(id, 1).catch(() => null),
					AniListAPI.getUserFollowing(id, 2).catch(() => null),
					AniListAPI.getUserFollowers(id, 1).catch(() => null),
					AniListAPI.getUserFollowers(id, 2).catch(() => null)
				]);
				const rawList = [
					...followingP1?.Page?.following || [],
					...followingP2?.Page?.following || [],
					...followersP1?.Page?.followers || [],
					...followersP2?.Page?.followers || []
				];
				const userMap = new Map();
				for (const u of rawList) if (u && u.name && !userMap.has(u.name.toLowerCase())) {
					userMap.set(u.name.toLowerCase(), u);
					if (u.avatar?.medium) Buddy.setAvatar(u.name, u.avatar.medium);
				}
				const users = Array.from(userMap.values());
				Storage.set(cacheKey, {
					users,
					time: Date.now()
				});
				return users;
			} catch (_) {
				return [];
			}
		},
		async searchFriends(query, viewerId) {
			const raw = (query || "").trim();
			const normalized = raw.toLowerCase();
			const id = viewerId || Buddy.getViewer()?.id;
			const list = [...await Buddy.getFriendsCached(id)];
			const defaultBuddy = Settings.get().defaultBuddy;
			if (defaultBuddy && !list.some((u) => u.name.toLowerCase() === defaultBuddy.toLowerCase())) list.unshift({
				name: defaultBuddy,
				avatar: { medium: Buddy.getAvatar(defaultBuddy) || "https://anilist.co/img/icons/icon.svg" }
			});
			if (!raw) return list;
			const localMatches = list.filter((u) => u.name.toLowerCase().includes(normalized));
			const seenNames = new Set(localMatches.map((u) => u.name.toLowerCase()));
			if (raw.length >= 2) try {
				const apiUsers = (await AniListAPI.searchUsers(raw))?.Page?.users || [];
				for (const u of apiUsers) if (u && u.name && !seenNames.has(u.name.toLowerCase())) {
					seenNames.add(u.name.toLowerCase());
					localMatches.push(u);
					if (u.avatar?.medium) Buddy.setAvatar(u.name, u.avatar.medium);
				}
			} catch (_) {}
			return localMatches;
		},
		async getBuddyCollection(buddyName) {
			if (!buddyName) return new Map();
			const key = `buddy_col_${buddyName.toLowerCase()}`;
			const cached = cache.get(key);
			if (cached && Date.now() - cached.time < CACHE_TTL_MS) return cached.map;
			try {
				const lists = (await AniListAPI.getFriendWatching(buddyName))?.MediaListCollection?.lists || [];
				const map = new Map();
				for (const list of lists) for (const entry of list.entries || []) if (!map.has(entry.mediaId)) map.set(entry.mediaId, entry);
				cache.set(key, {
					map,
					time: Date.now()
				});
				return map;
			} catch (_) {
				return new Map();
			}
		},
		async getBuddyMediaEntry(buddyName, mediaId) {
			if (!buddyName || !mediaId) return null;
			const key = `buddy_col_${buddyName.toLowerCase()}`;
			const cached = cache.get(key);
			if (cached && Date.now() - cached.time < CACHE_TTL_MS) return cached.map.get(mediaId) || null;
			try {
				const entry = (await AniListAPI.getFriendMediaEntry(buddyName, mediaId))?.MediaList || null;
				if (entry?.user?.name && entry.user.avatar?.medium) Buddy.setAvatar(entry.user.name, entry.user.avatar.medium);
				return entry;
			} catch (_) {
				return null;
			}
		}
	};
	function initBuddyPicker(container, { selectedBuddy = "", defaultBuddy = "", viewer = null, emptyLabel = "Sync", placeholder = "Search followed friend...", onSelect, onClear, onOpen, onClose } = {}) {
		if (!container) return;
		let activeBuddy = (selectedBuddy || "").trim();
		function renderTriggerHtml(buddyName) {
			const b = (buddyName || "").trim();
			const avatar = b ? Buddy.getAvatar(b) : null;
			if (b) return `
        <img src="${avatar || "https://anilist.co/img/icons/icon.svg"}" class="al-buddy-avatar-chip" alt="${b}" />
        <span class="al-buddy-name-chip">${b}</span>
        ${iconHtml(ChevronDown, {
				width: 11,
				height: 11,
				class: "al-buddy-chevron"
			})}
      `;
			return `
      ${iconHtml(Users, {
				width: 14,
				height: 14,
				class: "al-buddy-icon"
			})}
      <span class="al-buddy-label">${emptyLabel}</span>
      ${iconHtml(ChevronDown, {
				width: 11,
				height: 11,
				class: "al-buddy-chevron"
			})}
    `;
		}
		container.innerHTML = `
    <div class="al-buddy-picker-wrap">
      <button type="button" class="al-buddy-btn ${activeBuddy ? "is-active" : ""}" id="al-buddy-trigger" title="${activeBuddy ? `Sync Together: ${activeBuddy}` : "Sync Together with friend"}">
        ${renderTriggerHtml(activeBuddy)}
      </button>
      <div class="al-buddy-popover" id="al-buddy-popover" style="display: none;"></div>
    </div>
  `;
		const trigger = container.querySelector("#al-buddy-trigger");
		const popover = container.querySelector("#al-buddy-popover");
		if (!trigger || !popover) return;
		function updateActiveBuddy(newBuddy) {
			activeBuddy = (newBuddy || "").trim();
			trigger.className = `al-buddy-btn ${activeBuddy ? "is-active" : ""}`;
			trigger.title = activeBuddy ? `Sync Together: ${activeBuddy}` : "Sync Together with friend";
			trigger.innerHTML = renderTriggerHtml(activeBuddy);
		}
		let searchDebounce = null;
		const closePopover = () => {
			if (popover.style.display === "none") return;
			popover.style.display = "none";
			trigger.classList.remove("has-open-popover");
			if (typeof onClose === "function") onClose();
		};
		trigger.addEventListener("click", (e) => {
			e.stopPropagation();
			if (!(popover.style.display === "none")) {
				closePopover();
				return;
			}
			if (typeof onOpen === "function") onOpen();
			trigger.classList.add("has-open-popover");
			popover.style.display = "block";
			popover.innerHTML = `
      <div class="al-buddy-pop-search-box">
        ${iconHtml(Search, {
				width: 13,
				height: 13,
				class: "al-buddy-search-icon"
			})}
        <input
          type="search"
          class="al-buddy-search-input"
          placeholder="${placeholder}"
          value=""
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          name="al_buddy_search_query"
          data-lpignore="true"
          data-1p-ignore="true"
        />
      </div>
      <div class="al-buddy-pop-options" id="al-buddy-pop-options">
        <div class="al-buddy-loading">Loading followed friends...</div>
      </div>
      ${activeBuddy ? `
        <div class="al-buddy-pop-footer">
          <button type="button" class="al-buddy-pop-remove" id="al-buddy-pop-remove">
            ${iconHtml(Trash, {
				width: 12,
				height: 12
			})}
            <span>Remove Sync</span>
          </button>
        </div>
      ` : ""}
    `;
			const inp = popover.querySelector(".al-buddy-search-input");
			const optionsBox = popover.querySelector("#al-buddy-pop-options");
			popover.querySelector("#al-buddy-pop-remove")?.addEventListener("click", () => {
				updateActiveBuddy("");
				closePopover();
				if (typeof onClear === "function") onClear();
			});
			async function renderOptions(query = "") {
				if (!optionsBox) return;
				const users = await Buddy.searchFriends(query, viewer?.id);
				if (!users || !users.length) {
					optionsBox.innerHTML = `<div class="al-buddy-empty">No followed friend found</div>`;
					return;
				}
				optionsBox.innerHTML = users.map((u) => {
					const isSelected = activeBuddy.toLowerCase() === u.name.toLowerCase();
					const isDefault = defaultBuddy && defaultBuddy.toLowerCase() === u.name.toLowerCase();
					return `
          <button type="button" class="al-buddy-option ${isSelected ? "selected" : ""}" data-user="${u.name}">
            <img src="${u.avatar?.medium || "https://anilist.co/img/icons/icon.svg"}" class="al-buddy-opt-avatar" alt="${u.name}" />
            <span class="al-buddy-opt-name">${u.name}</span>
            ${isDefault ? `<span class="al-buddy-opt-badge">Default</span>` : ""}
            ${isSelected ? iconHtml(Check, {
						width: 12,
						height: 12,
						class: "al-buddy-opt-check"
					}) : ""}
          </button>
        `;
				}).join("");
				optionsBox.querySelectorAll(".al-buddy-option").forEach((opt) => {
					opt.addEventListener("click", () => {
						const chosenUser = opt.dataset.user;
						updateActiveBuddy(chosenUser);
						closePopover();
						if (typeof onSelect === "function") onSelect(chosenUser);
					});
				});
			}
			inp?.addEventListener("input", (evt) => {
				if (searchDebounce) clearTimeout(searchDebounce);
				const val = evt.target.value;
				optionsBox.innerHTML = `<div class="al-buddy-loading">Searching...</div>`;
				searchDebounce = setTimeout(() => {
					renderOptions(val);
				}, 120);
			});
			inp?.addEventListener("keydown", (evt) => {
				if (evt.key === "Enter") {
					evt.preventDefault();
					const firstOpt = optionsBox?.querySelector(".al-buddy-option");
					if (firstOpt) firstOpt.click();
				} else if (evt.key === "Escape") closePopover();
			});
			inp?.focus();
			renderOptions("");
		});
		if (container._buddyDocClick) document.removeEventListener("click", container._buddyDocClick);
		container._buddyDocClick = (evt) => {
			if (!popover.contains(evt.target) && !trigger.contains(evt.target)) closePopover();
		};
		document.addEventListener("click", container._buddyDocClick);
	}
	function openPreferencesModal({ onSave, viewer } = {}) {
		const currentViewer = viewer || Buddy.getViewer();
		const settings = Settings.get();
		const currentBuddy = settings.defaultBuddy;
		currentBuddy && Buddy.getAvatar(currentBuddy);
		const { modal, close } = createModal({
			id: "al-prefs-overlay",
			className: "al-prefs-modal",
			icon: SlidersVertical,
			title: "Preferences",
			subtitle: "Playback, homepage, and sync settings",
			onClose: () => {
				if (typeof onSave === "function") onSave();
			},
			body: `
      <!-- 1. Playback & Auto-Track -->
      <div class="al-pref-group al-pref-collapsible ${settings.autoTrack ? "is-open is-active" : ""}" id="al-pref-sec-autotrack">
        <div class="al-pref-header">
          <div class="al-pref-title-click">
            <span class="al-pref-chevron">${iconHtml(ChevronDown, {
				width: 14,
				height: 14
			})}</span>
            <div class="al-pref-info">
              <span class="al-pref-title">Auto-track episodes</span>
              <span class="al-pref-desc">Sync episode progress to AniList automatically</span>
            </div>
          </div>
          <input type="checkbox" class="al-switch al-toggle-autotrack" ${settings.autoTrack ? "checked" : ""} />
        </div>

        <div class="al-pref-sub">
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

          <label class="al-pref-row" style="cursor: pointer;">
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

      <!-- 2. Homepage Shelf -->
      <div class="al-pref-group al-pref-collapsible ${settings.homeShelf ? "is-open is-active" : ""}" style="margin-top: 10px;" id="al-pref-sec-shelf">
        <div class="al-pref-header">
          <div class="al-pref-title-click">
            <span class="al-pref-chevron">${iconHtml(ChevronDown, {
				width: 14,
				height: 14
			})}</span>
            <div class="al-pref-info">
              <span class="al-pref-title">Continue Watching shelf</span>
              <span class="al-pref-desc">Show Continue Watching shelf on homepage</span>
            </div>
          </div>
          <input type="checkbox" class="al-switch al-toggle-homeshelf" ${settings.homeShelf ? "checked" : ""} />
        </div>

        <div class="al-pref-sub">
          <label class="al-pref-row" style="cursor: pointer;">
            <span class="al-pref-sub-label">
              ${iconHtml(Zap, {
				width: 13,
				height: 13
			})}
              <span>Default to unwatched only</span>
            </span>
            <input type="checkbox" class="al-checkbox al-chk-unwatched" ${settings.homeOnlyUnwatched ? "checked" : ""} />
          </label>

          <div class="al-pref-row">
            <span class="al-pref-sub-label">
              ${iconHtml(Clock, {
				width: 13,
				height: 13
			})}
              <span>Auto-open search match</span>
            </span>
            <select class="al-select-xs al-sel-autoselect">
              <option value="5" ${settings.searchAutoSelectDelay === 5 ? "selected" : ""}>5 seconds (Default)</option>
              <option value="10" ${settings.searchAutoSelectDelay === 10 ? "selected" : ""}>10 seconds</option>
              <option value="0" ${settings.searchAutoSelectDelay === 0 ? "selected" : ""}>Manual (No auto-open)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 3. Sync Together (Watch Buddy) -->
      <div class="al-pref-group al-pref-collapsible is-open is-active" style="margin-top: 10px;" id="al-pref-sec-buddy">
        <div class="al-pref-header">
          <div class="al-pref-title-click">
            <span class="al-pref-chevron">${iconHtml(ChevronDown, {
				width: 14,
				height: 14
			})}</span>
            <div class="al-pref-info">
              <span class="al-pref-title">Sync Together</span>
              <span class="al-pref-desc">Watch with your AniList friend</span>
            </div>
          </div>
        </div>

        <div class="al-pref-sub">
          <div class="al-pref-row" style="align-items: center; justify-content: space-between;">
            <div class="al-pref-sub-label">
              ${iconHtml(Users, {
				width: 13,
				height: 13
			})}
              <div>
                <span>Default Sync Buddy</span>
                <div style="font-size: 11px; color: #64748b; font-weight: normal; margin-top: 1px;">Preselected for new anime</div>
              </div>
            </div>
            <div class="al-buddy-box" id="al-pref-buddy-box"></div>
          </div>
        </div>
      </div>
    `,
			actions: [{
				label: "Done",
				primary: true,
				icon: Check,
				onClick: () => {
					close();
					if (typeof onSave === "function") onSave();
				}
			}]
		});
		const autoTrackToggle = modal.querySelector(".al-toggle-autotrack");
		const autoTrackGroup = modal.querySelector("#al-pref-sec-autotrack");
		const autoTrackHeader = autoTrackGroup?.querySelector(".al-pref-title-click");
		const setAutoTrack = (active) => {
			if (autoTrackToggle) autoTrackToggle.checked = active;
			Settings.set("autoTrack", active);
			autoTrackGroup?.classList.toggle("is-open", active);
			autoTrackGroup?.classList.toggle("is-active", active);
		};
		autoTrackHeader?.addEventListener("click", () => {
			setAutoTrack(!autoTrackToggle?.checked);
		});
		autoTrackToggle?.addEventListener("change", (e) => {
			setAutoTrack(e.target.checked);
		});
		const delaySelect = modal.querySelector(".al-sel-delay");
		if (delaySelect) delaySelect.addEventListener("change", (e) => {
			Settings.set("delay", parseInt(e.target.value, 10));
		});
		const rewindCheckbox = modal.querySelector(".al-chk-rewind");
		if (rewindCheckbox) rewindCheckbox.addEventListener("change", (e) => {
			Settings.set("preventRewind", e.target.checked);
		});
		const homeShelfToggle = modal.querySelector(".al-toggle-homeshelf");
		const shelfGroup = modal.querySelector("#al-pref-sec-shelf");
		const shelfHeader = shelfGroup?.querySelector(".al-pref-title-click");
		const setHomeShelf = (active) => {
			if (homeShelfToggle) homeShelfToggle.checked = active;
			Settings.set("homeShelf", active);
			shelfGroup?.classList.toggle("is-open", active);
			shelfGroup?.classList.toggle("is-active", active);
		};
		shelfHeader?.addEventListener("click", () => {
			setHomeShelf(!homeShelfToggle?.checked);
		});
		homeShelfToggle?.addEventListener("change", (e) => {
			setHomeShelf(e.target.checked);
		});
		const unwatchedCheckbox = modal.querySelector(".al-chk-unwatched");
		if (unwatchedCheckbox) unwatchedCheckbox.addEventListener("change", (e) => {
			Settings.set("homeOnlyUnwatched", e.target.checked);
		});
		const autoSelect = modal.querySelector(".al-sel-autoselect");
		if (autoSelect) autoSelect.addEventListener("change", (e) => {
			Settings.set("searchAutoSelectDelay", parseInt(e.target.value, 10));
		});
		const buddyGroup = modal.querySelector("#al-pref-sec-buddy");
		(buddyGroup?.querySelector(".al-pref-title-click"))?.addEventListener("click", () => {
			buddyGroup?.classList.toggle("is-open");
		});
		initBuddyPicker(modal.querySelector("#al-pref-buddy-box"), {
			selectedBuddy: Settings.get().defaultBuddy,
			defaultBuddy: "",
			viewer: currentViewer,
			emptyLabel: "Select Friend",
			placeholder: "Search followed friend...",
			onSelect: (name) => {
				Settings.set("defaultBuddy", name);
			},
			onClear: () => {
				Settings.set("defaultBuddy", "");
			}
		});
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
					}, 220);
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
	function renderActions(media, hasToken, actions, { isLoading = false, viewer = null, defaultBuddy = "", buddyData = null } = {}) {
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
			bar.querySelector("#al-bar-login").onclick = (e) => {
				e.preventDefault();
				e.stopPropagation();
				actions.onConnect?.();
			};
			return;
		}
		if (isLoading) {
			bar.innerHTML = `
      <div class="al-card-row" style="opacity: 0.85;">
        <div class="al-left" style="display: flex; gap: 10px; align-items: center;">
          <div class="al-skeleton-pill" style="width: 140px; height: 32px; border-radius: 9px;"></div>
          <div class="al-skeleton-pill" style="width: 100px; height: 32px; border-radius: 9px;"></div>
        </div>
        <div class="al-right" style="display: flex; gap: 8px; align-items: center;">
          <div class="al-skeleton-pill" style="width: 85px; height: 32px; border-radius: 8px;"></div>
          <div class="al-skeleton-pill" style="width: 95px; height: 32px; border-radius: 8px;"></div>
        </div>
      </div>`;
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
		const title = media.title?.english || media.title?.romaji || media.title?.userPreferred || `AniList #${media.id}`;
		const entry = media.mediaListEntry;
		const total = media.episodes || 0;
		const progress = entry?.progress || 0;
		const percent = total > 0 && progress > 0 ? Math.min(100, Math.round(progress / total * 100)) : 0;
		const currentBuddy = Buddy.extract(entry?.notes);
		const formatDate = (dateObj) => {
			if (!dateObj?.year) return null;
			return `${String(dateObj.day || 1).padStart(2, "0")}/${String(dateObj.month || 1).padStart(2, "0")}/${dateObj.year}`;
		};
		const startDate = formatDate(entry?.startedAt);
		const completedDate = formatDate(entry?.completedAt);
		const rewatches = entry?.repeat || 0;
		const isBuddyCompleted = !!buddyData?.isCompleted;
		const canSyncBuddy = !!(buddyData?.name && (buddyData.progress || 0) > progress) || isBuddyCompleted && entry?.status !== "COMPLETED";
		bar.innerHTML = `
    <div class="al-card-row">
      <div class="al-left">
        <div class="al-title-meta-wrap">
          <a href="https://anilist.co/anime/${media.id}" target="_blank" rel="noopener noreferrer" class="al-badge" title="Open on AniList: ${title}">
            <span class="al-title-text">${title}</span>
            ${iconHtml(ExternalLink, {
			width: 12,
			height: 12,
			class: "al-badge-icon"
		})}
          </a>
          ${entry ? `
            <div class="al-more-wrap">
              <button type="button" class="al-icon-btn al-more-btn" id="al-bar-more" title="More options">
                ${iconHtml(Ellipsis, {
			width: 14,
			height: 14
		})}
              </button>
              <div class="al-more-menu" id="al-more-menu" style="display: none;">
                <button type="button" class="al-more-menu-item" id="al-menu-reset" title="Reset progress to Ep. 0 (Haven't watched yet)">
                  ${iconHtml(RotateCcw, {
			width: 13,
			height: 13
		})}
                  <span>Reset to Ep. 0</span>
                </button>
              </div>
            </div>
          ` : ""}
        </div>
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
            <div class="al-buddy-cluster ${isBuddyCompleted ? "has-completed" : ""}" title="Sync Watching with friend">
              <div class="al-buddy-box" id="al-bar-buddy-box"></div>
              ${currentBuddy && buddyData ? `
                ${canSyncBuddy ? `
                  <button type="button" class="al-buddy-sync-btn ${isBuddyCompleted ? "is-completed" : ""}" id="al-bar-buddy-sync" title="${isBuddyCompleted ? `${buddyData.name} completed this anime • Click to sync & mark as Completed` : `Sync with ${buddyData.name} to Ep. ${buddyData.progress}`}">
                    ${iconHtml(Link, {
			width: 12,
			height: 12
		})}
                    <span>${isBuddyCompleted ? `${buddyData.name} Completed` : `Ep. ${buddyData.progress}`}</span>
                  </button>
                ` : `
                  <span class="al-buddy-tag ${isBuddyCompleted ? "is-completed" : ""}" title="${buddyData.name}: ${isBuddyCompleted ? "Completed" : `Ep. ${buddyData.progress || 0}`}">
                    ${isBuddyCompleted ? `<span class="al-dot"></span><span>${buddyData.name} Completed</span>` : `<span>Ep. ${buddyData.progress || 0}</span>`}
                  </span>
                `}
              ` : ""}
            </div>

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

    ${entry && (startDate || completedDate || rewatches > 0) ? `
      <div class="al-card-dates-row">
        <div class="al-date-col al-date-start">
          ${startDate ? `
            <span class="al-meta-date" title="Started watching on ${startDate}">
              ${iconHtml(Calendar, {
			width: 11,
			height: 11
		})}
              <span>Started: ${startDate}</span>
            </span>
          ` : ""}
          ${rewatches > 0 ? `
            <span class="al-meta-date al-meta-repeat" title="Completed rewatches: ${rewatches}">
              ${iconHtml(RotateCcw, {
			width: 10,
			height: 10
		})}
              <span>Rewatched: ${rewatches}×</span>
            </span>
          ` : ""}
        </div>
        <div class="al-date-col al-date-end">
          ${completedDate ? `
            <span class="al-meta-date" title="Completed on ${completedDate}">
              ${iconHtml(Calendar, {
			width: 11,
			height: 11
		})}
              <span>Completed: ${completedDate}</span>
            </span>
          ` : ""}
        </div>
      </div>
    ` : ""}

    ${entry && total > 0 ? `
      <div class="al-card-progress-bar" title="Completion: ${progress}/${total} (${percent}%)">
        <div class="al-card-progress-fill" style="width: ${percent}%;"></div>
      </div>
    ` : ""}`;
		bar.querySelector("#al-bar-add")?.addEventListener("click", actions.onAdd);
		bar.querySelector("#al-bar-del")?.addEventListener("click", actions.onDelete);
		bar.querySelector("#al-bar-status")?.addEventListener("change", (e) => actions.onStatusChange(e.target.value));
		bar.querySelector("#al-bar-score")?.addEventListener("change", (e) => actions.onScoreChange(parseFloat(e.target.value)));
		bar.querySelector("#al-bar-buddy-sync")?.addEventListener("click", () => {
			if (typeof actions.onBuddySync === "function" && buddyData) actions.onBuddySync(buddyData.progress, isBuddyCompleted);
		});
		const moreBtn = bar.querySelector("#al-bar-more");
		const moreMenu = bar.querySelector("#al-more-menu");
		if (moreBtn && moreMenu) {
			moreBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				const isOpen = moreMenu.style.display !== "none";
				moreMenu.style.display = isOpen ? "none" : "block";
			});
			bar.querySelector("#al-menu-reset")?.addEventListener("click", () => {
				moreMenu.style.display = "none";
				if (typeof actions.onResetProgress === "function") actions.onResetProgress();
			});
			document.addEventListener("click", (e) => {
				if (!moreBtn.contains(e.target) && !moreMenu.contains(e.target)) moreMenu.style.display = "none";
			});
		}
		const buddyBox = bar.querySelector("#al-bar-buddy-box");
		if (buddyBox && entry) {
			const getElevatedAncestors = () => {
				const list = [];
				let el = bar;
				while (el && el !== document.body) {
					if (el.classList && (el.classList.contains("overview") || el.tagName === "MAIN")) break;
					list.push(el);
					el = el.parentElement;
				}
				return list;
			};
			initBuddyPicker(buddyBox, {
				selectedBuddy: currentBuddy,
				defaultBuddy,
				viewer,
				emptyLabel: "Sync",
				placeholder: "Search followed friend...",
				onSelect: actions.onBuddyChange,
				onClear: () => actions.onBuddyChange(""),
				onOpen: () => {
					bar.classList.add("has-open-popover");
					getElevatedAncestors().forEach((el) => el.classList.add("al-elevated-stack"));
				},
				onClose: () => {
					bar.classList.remove("has-open-popover");
					getElevatedAncestors().forEach((el) => el.classList.remove("al-elevated-stack"));
				}
			});
		}
	}
	function renderVideoBottom({ activeEp, trackedProgress, hasToken, autoTrackState, callbacks, isLoading = false }) {
		const container = document.getElementById("video-bottom");
		if (!container) return;
		document.getElementById("al-video-top-widget")?.remove();
		document.getElementById("al-vb-buddy-widget")?.remove();
		let widget = document.getElementById("al-video-bottom-widget");
		if (!widget) {
			widget = document.createElement("div");
			widget.id = "al-video-bottom-widget";
			const nextBtn = container.querySelector(".float-right, .next");
			if (nextBtn) container.insertBefore(widget, nextBtn);
			else container.appendChild(widget);
		}
		widget.querySelector(".al-vb-buddy-slot")?.remove();
		let statusSlot = widget.querySelector(".al-vb-status-slot");
		if (!statusSlot) {
			statusSlot = document.createElement("div");
			statusSlot.className = "al-vb-status-slot";
			widget.appendChild(statusSlot);
		}
		if (!hasToken || !activeEp) {
			statusSlot.innerHTML = "";
			return;
		}
		if (isLoading) {
			statusSlot.innerHTML = `<div class="al-skeleton-pill" style="width: 105px; height: 26px; border-radius: 6px; opacity: 0.85;"></div>`;
			return;
		}
		if (autoTrackState?.isActive && autoTrackState.targetEp === activeEp) {
			statusSlot.innerHTML = `
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
			statusSlot.querySelector("#al-vb-cancel")?.addEventListener("click", (e) => {
				e.stopPropagation();
				callbacks.onCancel();
			});
			statusSlot.querySelector("#al-vb-savenow")?.addEventListener("click", (e) => {
				e.stopPropagation();
				callbacks.onSave(activeEp);
			});
			return;
		}
		if (trackedProgress > 0 && activeEp < trackedProgress && autoTrackState?.preventRewind) {
			statusSlot.innerHTML = `
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
			statusSlot.querySelector("#al-vb-force")?.addEventListener("click", (e) => {
				e.stopPropagation();
				callbacks.onForce(activeEp);
			});
			return;
		}
		if (trackedProgress > 0 && activeEp === trackedProgress) {
			statusSlot.innerHTML = `
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
			statusSlot.innerHTML = `
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
		statusSlot.innerHTML = `
    <button type="button" class="al-vb-mark-btn" id="al-vb-mark" title="Mark episode ${activeEp} as watched on AniList">
      ${iconHtml(Zap, {
			width: 12,
			height: 12
		})}
      <span>Mark Ep. ${activeEp}</span>
    </button>`;
		statusSlot.querySelector("#al-vb-mark")?.addEventListener("click", (e) => {
			e.stopPropagation();
			callbacks.onSave(activeEp);
		});
	}
	function getActiveEpisode() {
		const activeEl = document.querySelector(".episode-wrapper .episode-item.active, .episode-item.active");
		if (activeEl) {
			const num = parseInt(activeEl.innerText.trim(), 10);
			if (!isNaN(num) && num > 0) return num;
		}
		try {
			const epAttr = document.querySelector("video-player")?.getAttribute("episode");
			if (epAttr) {
				const parsed = JSON.parse(epAttr);
				const num = parseInt(parsed?.number, 10);
				if (!isNaN(num) && num > 0) return num;
			}
		} catch (_) {}
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
	var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
	async function simulateAgenticSearch(media, { epTarget, autoSelectDelay = 5 } = {}) {
		if (!media) return false;
		Logger.info(`Searching best query for media ID ${media.id}...`);
		let resolved = await resolveAnimeUnityAnime(media);
		let query = resolved?.matchingQuery;
		if (!query) {
			const candidates = generateSearchCandidates(media);
			query = candidates[1] || candidates[0] || cleanTitle(media.title?.english || media.title?.romaji) || "";
		}
		Logger.info(`Using search query: "${query}" (Resolved: ${resolved ? resolved.id : "NO"})`);
		const isDesktop = window.innerWidth >= 768;
		const desktopSearch = document.querySelector("#left-nav nav-search, #left-nav .search-box");
		const mobileSearch = document.querySelector(".nav-top-mobile nav-search, .nav-top-mobile .search-box");
		let targetNavSearch = null;
		if (isDesktop && desktopSearch) targetNavSearch = desktopSearch;
		else if (!isDesktop && mobileSearch) targetNavSearch = mobileSearch;
		else {
			const allNav = Array.from(document.querySelectorAll("nav-search, .search-box"));
			targetNavSearch = allNav.find((el) => {
				const parent = el.closest(".d-md-none, #left-nav, .nav-top-mobile") || el;
				return window.getComputedStyle(parent).display !== "none";
			}) || desktopSearch || mobileSearch || allNav[0];
		}
		const searchBtn = targetNavSearch?.querySelector("button, button.input-group-text") || targetNavSearch?.closest(".search-box")?.querySelector("button") || document.querySelector("#left-nav .search-box button, nav-search button");
		const vueInstance = targetNavSearch?.__vue__ || targetNavSearch?.closest(".search-box")?.parentElement?.__vue__ || searchBtn?.closest(".search-box")?.parentElement?.__vue__;
		if (vueInstance) {
			if (vueInstance.active) {
				vueInstance.active = false;
				await sleep(40);
			}
			if (typeof vueInstance.searchClick === "function") vueInstance.searchClick();
			else vueInstance.active = true;
		} else if (searchBtn) searchBtn.click();
		else {
			Logger.warn("Search button/component not found in DOM");
			showToast(`⚠️ Impossibile aprire la barra di ricerca`, true);
			return false;
		}
		let input = null;
		for (let i = 0; i < 25; i++) {
			input = targetNavSearch?.querySelector(".search-container .search-bar, .search-backdrop input") || document.querySelector("#left-nav .search-bar, .search-container .search-bar, .search-backdrop input");
			if (input) break;
			await sleep(40);
		}
		if (!input) {
			Logger.warn("Search input did not mount within timeout");
			showToast(`⚠️ Impossibile aprire la casella di ricerca`, true);
			return false;
		}
		const backdrop = targetNavSearch?.querySelector(".search-backdrop") || input.closest(".search-backdrop") || document.querySelector(".search-backdrop");
		if (backdrop) backdrop.classList.add("show");
		input.focus();
		input.value = query;
		input.dispatchEvent(new Event("input", { bubbles: true }));
		input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
		const currentVue = input.closest(".search-backdrop")?.__vue__ || targetNavSearch?.__vue__ || vueInstance;
		if (currentVue && typeof currentVue.fetchAnime === "function") {
			currentVue.query = query;
			currentVue.fetchAnime({ target: { value: query } });
		}
		Logger.info(`Search modal opened and query "${query}" dispatched`);
		let items = [];
		for (let i = 0; i < 35; i++) {
			items = Array.from((backdrop || targetNavSearch || document).querySelectorAll(".results .result, .results .livesearch-item"));
			if (items.length > 0) break;
			await sleep(70);
		}
		if (!items.length) {
			Logger.info(`No search results returned for "${query}"`);
			showToast(`⚠️ Nessun risultato immediato per "${query}"`, true);
			return true;
		}
		Logger.info(`Search results rendered: ${items.length} items`);
		const prefDubInt = (Storage.get("al_pref_language") || "sub") === "dub" ? 1 : 0;
		let targetIndex = -1;
		const searchVue = document.querySelector(".search-backdrop")?.__vue__ || currentVue;
		if (searchVue?.animes && Array.isArray(searchVue.animes)) {
			const records = searchVue.animes;
			const matches = [];
			records.forEach((r, idx) => {
				if (r?.anilist_id === media.id) matches.push({
					record: r,
					idx
				});
			});
			if (matches.length > 0) {
				const selected = matches.find((m) => m.record.dub === prefDubInt) || matches[0];
				targetIndex = selected.idx;
				Logger.info(`Candidate matched by AniList ID ${media.id}:`, selected.record);
			}
		}
		if (targetIndex < 0 || targetIndex >= items.length) {
			const cleanQ = query.toLowerCase().replace(/[^a-z0-9]/g, "");
			const matchIdx = items.findIndex((el) => {
				const text = el.innerText.toLowerCase().replace(/[^a-z0-9]/g, "");
				return text.includes(cleanQ) || cleanQ.includes(text);
			});
			targetIndex = matchIdx >= 0 ? matchIdx : 0;
		}
		const targetEl = items[targetIndex] || items[0];
		if (!targetEl) return true;
		const targetLink = targetEl.tagName === "A" ? targetEl : targetEl.querySelector("a.livesearch-item, a") || targetEl;
		targetEl.classList.add("al-agent-candidate");
		try {
			targetEl.scrollIntoView({
				block: "nearest",
				behavior: "smooth"
			});
		} catch (_) {}
		if (autoSelectDelay <= 0) return true;
		let countdown = autoSelectDelay;
		const badge = document.createElement("div");
		badge.className = "al-agent-countdown-badge";
		badge.innerHTML = `<span>Auto-opening in <strong>${countdown}s</strong></span><span class="al-agent-cancel-hint">(Click any to choose)</span>`;
		targetEl.appendChild(badge);
		let timer = null;
		const cancel = () => {
			if (timer) clearInterval(timer);
			badge.remove();
			targetEl.classList.remove("al-agent-candidate");
			document.removeEventListener("click", onDocumentClick, true);
		};
		const onDocumentClick = (e) => {
			if (!targetEl.contains(e.target)) {
				Logger.info("User clicked outside candidate: countdown cancelled");
				cancel();
			}
		};
		document.addEventListener("click", onDocumentClick, true);
		timer = setInterval(() => {
			countdown--;
			if (countdown > 0) badge.innerHTML = `<span>Auto-opening in <strong>${countdown}s</strong></span><span class="al-agent-cancel-hint">(Click any to choose)</span>`;
			else {
				cancel();
				Logger.info("Countdown finished: auto-clicking matched anime");
				if (epTarget) sessionStorage.setItem("al_target_ep", String(epTarget));
				targetLink.click();
			}
		}, 1e3);
		return true;
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
		const isRepeating = entry.status === "REPEATING";
		let latestAired = 0;
		if (nextAir?.episode) latestAired = nextAir.episode - 1;
		else if (status === "FINISHED") latestAired = totalEp || progress;
		else if (totalEp && totalEp > 0) latestAired = totalEp;
		else latestAired = progress;
		const hasUnwatchedAired = isRepeating ? latestAired === 0 || latestAired > progress : latestAired > progress;
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
			nextToWatch,
			isRepeating
		};
	}
	function createCard(entry, buddySync = null, onSyncEntry = null) {
		const media = entry.media || {};
		const state = calculateEntryState(entry);
		const epTarget = state.hasUnwatchedAired ? state.nextToWatch : state.progress || 1;
		const auUrl = getAnimeUnityUrl(media, { targetEp: epTarget });
		const title = media.title?.english || media.title?.romaji || media.title?.userPreferred || "Untitled";
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
		if (buddySync) {
			const buddyPill = document.createElement("div");
			buddyPill.className = "al-card-buddy-overlay";
			buddyPill.title = `Watching with ${buddySync.buddy}`;
			const epDisplay = `Ep. ${buddySync.buddyEp || 0}`;
			buddyPill.innerHTML = `
      <div class="al-card-buddy-left">
        <img src="${buddySync.avatar || "https://anilist.co/img/icons/icon.svg"}" class="al-card-buddy-avatar" alt="${buddySync.buddy}" />
        <span class="al-card-buddy-name">${buddySync.buddy}</span>
      </div>
      <span class="al-card-buddy-status">${epDisplay}</span>
    `;
			coverWrap.appendChild(buddyPill);
		}
		const badgeWrap = document.createElement("div");
		badgeWrap.className = "al-card-badge-top-left";
		if (state.isRepeating) {
			const badge = document.createElement("span");
			badge.className = "al-badge al-badge-REPEATING";
			const dot = document.createElement("span");
			dot.className = "al-dot";
			badge.appendChild(dot);
			const txt = document.createElement("span");
			txt.textContent = state.unwatchedCount > 1 ? `+${state.unwatchedCount} eps` : "Caught up";
			badge.appendChild(txt);
			badgeWrap.appendChild(badge);
		} else if (state.hasUnwatchedAired) {
			const badge = document.createElement("span");
			badge.className = "al-badge al-badge-CURRENT";
			const dot = document.createElement("span");
			dot.className = "al-dot";
			badge.appendChild(dot);
			const txt = document.createElement("span");
			txt.textContent = state.unwatchedCount > 1 ? `+${state.unwatchedCount} eps` : `Caught up`;
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
		alLink.innerHTML = ANILIST_ICON_SVG;
		alLinkWrap.appendChild(alLink);
		coverWrap.appendChild(alLinkWrap);
		const overlay = document.createElement("div");
		overlay.className = "al-card-cover-overlay";
		const progressText = document.createElement("div");
		progressText.className = "al-card-progress-text";
		const progressLabel = document.createElement("span");
		progressLabel.textContent = `Ep. ${state.progress} / ${state.totalEp || state.latestAired || "?"}`;
		progressText.appendChild(progressLabel);
		if (state.hasUnwatchedAired || state.isRepeating) {
			const readyTag = document.createElement("span");
			readyTag.style.color = state.isRepeating ? "#06b6d4" : "#3db4f2";
			readyTag.textContent = state.isRepeating ? "Rewatching" : "Ready";
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
		titleLink.href = auUrl || "#";
		titleLink.className = "al-card-title";
		titleLink.title = title;
		titleLink.textContent = title;
		cardBody.appendChild(titleLink);
		const actions = document.createElement("div");
		actions.className = "al-card-actions";
		if (buddySync) {
			const isCompleted = !!buddySync.isBuddyCompleted;
			if (!!buddySync.isAhead || isCompleted && entry.status !== "COMPLETED") {
				const syncBtn = document.createElement("button");
				syncBtn.type = "button";
				syncBtn.className = "al-card-btn al-btn-buddy-sync";
				syncBtn.title = `Sync AniList to ${isCompleted ? "Completed" : `Ep. ${buddySync.buddyEp}`} (${buddySync.buddy})`;
				syncBtn.innerHTML = `${iconHtml(Link, {
					width: 12,
					height: 12
				})} <span>${isCompleted ? "Sync Completed" : `Sync Ep. ${buddySync.buddyEp}`}</span>`;
				syncBtn.addEventListener("click", (e) => {
					e.stopPropagation();
					e.preventDefault();
					syncBtn.style.pointerEvents = "none";
					syncBtn.style.opacity = "0.7";
					syncBtn.innerHTML = `${iconHtml(LoaderCircle, {
						width: 12,
						height: 12,
						class: "al-spin"
					})} <span>Syncing...</span>`;
					if (typeof onSyncEntry === "function") onSyncEntry(buddySync.mediaId, buddySync.buddyEp, isCompleted);
				});
				actions.appendChild(syncBtn);
			}
		}
		const btn = document.createElement("a");
		btn.href = auUrl || "#";
		btn.className = "al-card-btn";
		if (state.hasUnwatchedAired || state.isRepeating) {
			btn.classList.add("al-btn-play");
			if (state.isRepeating) btn.style.background = "#06b6d4";
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
			})} Caught up`;
		}
		actions.appendChild(btn);
		cardBody.appendChild(actions);
		card.appendChild(cardBody);
		async function handleCardNavigate(e) {
			if (e.target.closest(".al-card-al-link, .al-btn-buddy-sync")) return;
			e.preventDefault();
			Logger.info(`Card clicked: "${title}" (AniList ID: ${media.id})`);
			if (epTarget) sessionStorage.setItem("al_target_ep", String(epTarget));
			const directUrl = getAnimeUnityUrl(media, { targetEp: epTarget });
			if (directUrl && directUrl.startsWith("/anime/")) {
				Logger.info(`Level 1 direct cache HIT -> opening ${directUrl}`);
				showToast(`⚡ Opening ${title}...`);
				window.location.href = directUrl;
				return;
			}
			Logger.info(`Level 1 direct cache MISS for ID ${media.id}. Opening search modal...`);
			showToast(`🔍 Searching "${title}" on AnimeUnity...`, false, 2e3);
			card.classList.add("al-card-loading");
			const originalBtnHtml = btn.innerHTML;
			btn.innerHTML = `${iconHtml(LoaderCircle, {
				width: 12,
				height: 12,
				class: "al-spin"
			})} Loading...`;
			btn.style.opacity = "0.75";
			btn.style.pointerEvents = "none";
			const settings = Settings.get();
			try {
				if (!await simulateAgenticSearch(media, {
					epTarget,
					autoSelectDelay: settings.searchAutoSelectDelay
				})) showToast(`⚠️ Could not find or open search for "${title}"`, true);
			} catch (err) {
				Logger.error("Search error in handleCardNavigate:", err);
				showToast(`⚠️ Search error: ${err.message}`, true);
			} finally {
				card.classList.remove("al-card-loading");
				btn.innerHTML = originalBtnHtml;
				btn.style.opacity = "";
				btn.style.pointerEvents = "";
			}
		}
		card.addEventListener("click", handleCardNavigate);
		return card;
	}
	function renderWatchingShelf({ entries = [], viewer = null, onRefresh = null, onLogin = null, syncNotifs = [], onSyncEntry = null } = {}) {
		scanAnimeUnityPageMap();
		let unwatchedOnly = Settings.get().homeOnlyUnwatched;
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
			openPreferencesModal({
				viewer,
				onSave: () => {
					unwatchedOnly = Settings.get().homeOnlyUnwatched;
					toggleBox.classList.toggle("active", unwatchedOnly);
					toggleKnob.classList.toggle("active", unwatchedOnly);
					updateTrack();
				}
			});
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
			pill.textContent = String(unwatchedEntries.length);
			filterWrap.appendChild(pill);
		}
		controls.appendChild(filterWrap);
		const syncMap = new Map((syncNotifs || []).map((n) => [n.mediaId, n]));
		const syncEntries = entries.filter((e) => syncMap.has(e.mediaId) || !!Buddy.extract(e.notes));
		let syncOnly = false;
		if (syncEntries.length > 0) {
			const syncFilterWrap = document.createElement("div");
			syncFilterWrap.className = "al-shelf-filter";
			syncFilterWrap.title = "Toggle: Show only series with Sync Together friend";
			const syncToggleBox = document.createElement("div");
			syncToggleBox.className = `al-shelf-toggle-box ${syncOnly ? "active" : ""}`;
			const syncToggleKnob = document.createElement("div");
			syncToggleKnob.className = `al-shelf-toggle-knob ${syncOnly ? "active" : ""}`;
			syncToggleBox.appendChild(syncToggleKnob);
			syncFilterWrap.appendChild(syncToggleBox);
			const syncFilterLabel = document.createElement("span");
			syncFilterLabel.className = "al-shelf-filter-label";
			syncFilterLabel.innerHTML = `${iconHtml(Users, {
				width: 12,
				height: 12
			})} Sync Together`;
			syncFilterWrap.appendChild(syncFilterLabel);
			const syncPill = document.createElement("span");
			syncPill.className = "al-shelf-unwatched-pill";
			syncPill.style.background = "rgba(56, 189, 248, 0.2)";
			syncPill.style.color = "#38bdf8";
			syncPill.textContent = String(syncEntries.length);
			syncFilterWrap.appendChild(syncPill);
			syncFilterWrap.addEventListener("click", () => {
				syncOnly = !syncOnly;
				syncToggleBox.classList.toggle("active", syncOnly);
				syncToggleKnob.classList.toggle("active", syncOnly);
				updateTrack();
			});
			controls.appendChild(syncFilterWrap);
		}
		header.appendChild(controls);
		shelfContainer.appendChild(header);
		const carouselWrap = document.createElement("div");
		carouselWrap.className = "al-shelf-carousel-wrap";
		const track = document.createElement("div");
		track.className = "al-shelf-track";
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
        <button type="button" class="al-btn primary al-home-auth-btn" style="margin-top: 6px;">Connect AniList</button>
      `;
				empty.querySelector(".al-home-auth-btn")?.addEventListener("click", (e) => {
					e.preventDefault();
					e.stopPropagation();
					if (typeof onLogin === "function") onLogin();
					else openTokenModal();
				});
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
			let visibleEntries = entries;
			if (unwatchedOnly) visibleEntries = visibleEntries.filter((e) => calculateEntryState(e).hasUnwatchedAired);
			if (syncOnly) visibleEntries = visibleEntries.filter((e) => syncMap.has(e.mediaId) || !!Buddy.extract(e.notes));
			if (!visibleEntries.length) {
				const empty = document.createElement("div");
				empty.className = "al-shelf-empty";
				empty.style.width = "100%";
				empty.innerHTML = `
        <div class="al-shelf-empty-title">${unwatchedOnly ? "All Caught Up! 🎉" : "No Matching Anime"}</div>
        <div class="al-shelf-empty-desc">${unwatchedOnly ? "You have no unwatched aired episodes in your Watching list." : "No anime in your Watching list match the active filters."}</div>
      `;
				track.appendChild(empty);
				return;
			}
			visibleEntries.forEach((entry) => {
				const buddySync = syncMap.get(entry.mediaId);
				track.appendChild(createCard(entry, buddySync, onSyncEntry));
			});
		}
		filterWrap.addEventListener("click", () => {
			unwatchedOnly = !unwatchedOnly;
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
	var currentUser = Buddy.getViewer();
	var currentMedia = null;
	var currentTitle = "";
	var trackedProgress = -1;
	var lastActiveEp = 0;
	var isMediaLoading = false;
	var homeEntries = null;
	var homeFetching = false;
	var homeSyncNotifs = [];
	var currentBuddyData = null;
	var autoTrackTimer = null;
	var countdownInterval = null;
	var autoTrackState = {
		isActive: false,
		countdown: 0,
		targetEp: 0,
		preventRewind: true
	};
	var cancelledEps = new Set();
	var isHome = () => {
		const p = window.location.pathname;
		return p === "/" || p === "/home" || p === "";
	};
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
	function injectHomeShelf(shelfElement) {
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
		const container = document.querySelector("#home > .container, .container");
		if (container) container.prepend(shelfRow);
	}
	async function computeHomeSyncNotifs() {
		if (!homeEntries || !homeEntries.length) {
			homeSyncNotifs = [];
			return;
		}
		const buddyMap = new Map();
		homeEntries.forEach((entry) => {
			const buddy = Buddy.extract(entry.notes);
			if (buddy) {
				if (!buddyMap.has(buddy)) buddyMap.set(buddy, []);
				buddyMap.get(buddy).push(entry);
			}
		});
		if (!buddyMap.size) {
			homeSyncNotifs = [];
			return;
		}
		const notifs = [];
		for (const [buddyName, entries] of buddyMap.entries()) {
			const buddyCol = await Buddy.getBuddyCollection(buddyName);
			for (const entry of entries) {
				const buddyEntry = buddyCol.get(entry.mediaId);
				const myProgress = entry.progress || 0;
				const buddyProgress = buddyEntry?.progress || 0;
				const isBuddyCompleted = buddyEntry?.status === "COMPLETED" || buddyEntry?.media?.episodes && buddyProgress >= buddyEntry.media.episodes;
				const isAhead = buddyProgress > myProgress;
				const media = entry.media || {};
				const title = media.title?.english || media.title?.romaji || "Untitled";
				const auUrl = getAnimeUnityUrl(media, { targetEp: buddyProgress || myProgress || 1 });
				notifs.push({
					mediaId: entry.mediaId,
					buddy: buddyName,
					avatar: Buddy.getAvatar(buddyName) || "https://anilist.co/img/icons/icon.svg",
					buddyEp: buddyProgress,
					myEp: myProgress,
					isAhead,
					isBuddyCompleted: !!isBuddyCompleted,
					canSync: isAhead || isBuddyCompleted && entry.status !== "COMPLETED",
					title,
					auUrl
				});
			}
		}
		homeSyncNotifs = notifs;
	}
	async function loadHomeWatching() {
		if (homeFetching) return;
		homeFetching = true;
		if (!currentUser?.id) {
			homeEntries = [];
			homeSyncNotifs = [];
			homeFetching = false;
			renderHome();
			return;
		}
		try {
			homeEntries = ((await AniListAPI.getUserWatching(currentUser.id))?.MediaListCollection?.lists || []).flatMap((l) => l.entries || []);
			homeEntries.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
			await computeHomeSyncNotifs();
		} catch (err) {
			Logger.warn("Error loading watching collection:", err);
			homeEntries = [];
			homeSyncNotifs = [];
		} finally {
			homeFetching = false;
			renderHome();
		}
	}
	var openAuth = () => openTokenModal(async () => {
		await App.loadUser();
		if (isHome()) await loadHomeWatching();
		else App.sync();
	});
	function renderHome() {
		if (!isHome()) {
			const existing = document.getElementById("al-home-continue-watching");
			if (existing) existing.closest(".al-home-shelf-row")?.remove() || existing.remove();
			return;
		}
		if (!Settings.get().homeShelf) {
			const existing = document.getElementById("al-home-continue-watching");
			if (existing) existing.closest(".al-home-shelf-row")?.remove() || existing.remove();
			return;
		}
		if (!document.querySelector("#home .container, .container")) return;
		if (homeEntries === null && homeFetching) {
			if (!document.getElementById("al-home-continue-watching")) {
				const skeleton = document.createElement("div");
				skeleton.id = "al-home-continue-watching";
				skeleton.className = "al-home-shelf";
				skeleton.innerHTML = `
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
          </div>
        </div>
      `;
				injectHomeShelf(skeleton);
			}
			return;
		}
		injectHomeShelf(renderWatchingShelf({
			entries: homeEntries || [],
			viewer: currentUser,
			syncNotifs: homeSyncNotifs,
			onLogin: openAuth,
			onRefresh: () => loadHomeWatching(),
			onSyncEntry: async (mediaId, ep, isCompleted = false) => {
				await App.setProgress(ep, mediaId, isCompleted ? "COMPLETED" : null);
				await loadHomeWatching();
			}
		}));
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
				Buddy.setViewer(currentUser);
				if (currentUser.id) Buddy.getFollowingCached(currentUser.id);
				if (isHome()) loadHomeWatching();
				App.render();
			}
		},
		logout() {
			cancelAutoTrack();
			Storage.del("anilist_token");
			Buddy.setViewer(null);
			currentUser = null;
			currentMedia = null;
			homeEntries = null;
			homeSyncNotifs = [];
			currentBuddyData = null;
			trackedProgress = -1;
			lastActiveEp = 0;
			cancelledEps.clear();
			App.render();
			showToast("Disconnected from AniList");
		},
		async setProgress(newProgress, targetMediaId = null, overrideStatus = null) {
			const id = targetMediaId || currentMedia?.id;
			if (!id) return;
			const isSinglePage = !targetMediaId && currentMedia;
			const homeEntry = targetMediaId ? homeEntries?.find((e) => e.mediaId === targetMediaId || e.media?.id === targetMediaId) : null;
			const entry = isSinglePage ? currentMedia.mediaListEntry : homeEntry || null;
			const totalEp = isSinglePage ? currentMedia.episodes : homeEntry?.media?.episodes || 0;
			const isReset = newProgress === 0;
			const isCompleted = overrideStatus === "COMPLETED" || totalEp > 0 && newProgress >= totalEp;
			const prevStatus = entry?.status;
			const isRewatching = prevStatus === "REPEATING";
			let targetStatus;
			if (isCompleted) targetStatus = "COMPLETED";
			else if (isReset) {
				if (prevStatus === "COMPLETED" || isRewatching) targetStatus = "REPEATING";
				else targetStatus = "CURRENT";
			} else if (prevStatus === "COMPLETED" || isRewatching) targetStatus = "REPEATING";
			else targetStatus = "CURRENT";
			const params = {
				mediaId: id,
				progress: newProgress,
				status: targetStatus
			};
			if (!entry?.startedAt?.year) params.startedAt = getTodayDate();
			if (isCompleted) {
				if (!entry?.completedAt?.year) params.completedAt = getTodayDate();
				if (isRewatching) params.repeat = (entry?.repeat || 0) + 1;
			}
			if ((await AniListAPI.saveEntry(params))?.SaveMediaListEntry) {
				cancelledEps.delete(newProgress);
				showToast(isReset ? `Progress reset to Ep. 0 (${AniListAPI.statuses[targetStatus] || targetStatus})` : isCompleted ? isRewatching ? `🎉 Rewatch completed (${(entry?.repeat || 0) + 1}×)!` : "🎉 Completed on AniList!" : `Episode ${newProgress} saved`);
				if (isSinglePage) App.sync();
				else await loadHomeWatching();
			}
		},
		render() {
			const openAuth = () => openTokenModal(async () => {
				await App.loadUser();
				if (isHome()) await loadHomeWatching();
				else App.sync();
			});
			const hasToken = !!Storage.get("anilist_token");
			const activeEp = getActiveEpisode();
			renderNav(currentUser, {
				onLogin: openAuth,
				onLogout: () => App.logout(),
				onChangeToken: openAuth
			});
			if (isHome()) {
				renderHome();
				return;
			}
			renderActions(currentMedia, hasToken, {
				onConnect: openAuth,
				onAdd: () => App.setProgress(activeEp || 1),
				onResetProgress: () => App.setProgress(0),
				onBuddySync: (ep, isCompleted) => App.setProgress(ep, null, isCompleted ? "COMPLETED" : null),
				onStatusChange: async (status) => {
					const entry = currentMedia?.mediaListEntry;
					const params = {
						mediaId: currentMedia.id,
						status
					};
					if (status === "COMPLETED") {
						if (!entry?.completedAt?.year) params.completedAt = getTodayDate();
						if (!entry?.startedAt?.year) params.startedAt = getTodayDate();
						if (entry?.status === "REPEATING") params.repeat = (entry.repeat || 0) + 1;
					} else if ((status === "CURRENT" || status === "REPEATING") && !entry?.startedAt?.year) params.startedAt = getTodayDate();
					if (await AniListAPI.saveEntry(params)) {
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
				onBuddyChange: async (newBuddy) => {
					const curNotes = currentMedia?.mediaListEntry?.notes || "";
					const updatedNotes = Buddy.apply(curNotes, newBuddy);
					if ((await AniListAPI.saveEntry({
						mediaId: currentMedia.id,
						notes: updatedNotes
					}))?.SaveMediaListEntry) {
						if (currentMedia.mediaListEntry) currentMedia.mediaListEntry.notes = updatedNotes;
						if (newBuddy) Settings.set("defaultBuddy", newBuddy);
						showToast(newBuddy ? `Sync Together set: ${newBuddy}` : "Sync Together removed");
						App.sync();
					}
				},
				onDelete: async () => {
					if (confirm("Remove this anime from your AniList?") && await AniListAPI.deleteEntry(currentMedia.mediaListEntry.id)) {
						showToast("Anime removed");
						App.sync();
					}
				}
			}, {
				isLoading: isMediaLoading,
				viewer: currentUser,
				defaultBuddy: Settings.get().defaultBuddy,
				buddyData: currentBuddyData
			});
			renderVideoBottom({
				activeEp,
				trackedProgress,
				total: currentMedia?.episodes || 0,
				hasToken,
				autoTrackState,
				isLoading: isMediaLoading,
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
					},
					onReset: () => {
						cancelAutoTrack();
						App.setProgress(0);
					}
				}
			});
			highlightEpisodes(trackedProgress);
		},
		async sync() {
			if (isHome()) return;
			if (!Storage.get("anilist_token")) {
				currentMedia = null;
				trackedProgress = -1;
				isMediaLoading = false;
				App.render();
				return;
			}
			try {
				isMediaLoading = true;
				App.render();
				const meta = extractPageMetadata();
				if (meta.anilistId) currentMedia = (await AniListAPI.getMediaById(meta.anilistId))?.Media || null;
				if (!currentMedia && !meta.anilistId && meta.romajiTitle) currentMedia = await findMediaByTitle(meta.romajiTitle);
				if (!currentMedia && !meta.anilistId && currentTitle) currentMedia = await findMediaByTitle(currentTitle);
				if (currentMedia?.id) {
					const match = window.location.pathname.match(/\/anime\/(\d+)(?:-([^\/]+))?/i);
					if (match && match[1]) {
						const rawMap = Storage.get("al_au_map");
						const map = rawMap && typeof rawMap === "object" && !Array.isArray(rawMap) ? rawMap : {};
						map[currentMedia.id] = {
							id: parseInt(match[1], 10),
							slug: match[2] || "",
							updatedAt: Date.now()
						};
						Storage.set("al_au_map", map);
						Logger.info(`Auto-learned mapping: AniList ${currentMedia.id} -> AU /anime/${match[1]}-${match[2]}`);
					}
				}
				trackedProgress = currentMedia?.mediaListEntry ? currentMedia.mediaListEntry.progress : -1;
				const buddyName = Buddy.extract(currentMedia?.mediaListEntry?.notes);
				if (buddyName && currentMedia?.id) {
					const buddyEntry = await Buddy.getBuddyMediaEntry(buddyName, currentMedia.id);
					const buddyEp = buddyEntry?.progress || 0;
					const isBuddyCompleted = buddyEntry?.status === "COMPLETED" || buddyEntry?.media?.episodes && buddyEp >= buddyEntry.media.episodes;
					currentBuddyData = {
						name: buddyName,
						avatar: Buddy.getAvatar(buddyName) || buddyEntry?.user?.avatar?.medium || "https://anilist.co/img/icons/icon.svg",
						progress: buddyEp,
						status: buddyEntry?.status,
						isCompleted: !!isBuddyCompleted
					};
				} else currentBuddyData = null;
			} catch (err) {
				Logger.warn("Error during AniList sync:", err);
			} finally {
				isMediaLoading = false;
				App.render();
			}
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
				scanAnimeUnityPageMap();
				if (isHome()) {
					if (currentUser?.id && homeEntries === null && !homeFetching) loadHomeWatching();
					else if (!document.getElementById("al-home-continue-watching")) renderHome();
				} else {
					const shelf = document.getElementById("al-home-continue-watching");
					if (shelf) shelf.closest(".al-home-shelf-row")?.remove() || shelf.remove();
					const titleEl = document.querySelector("#anime .title, h1.title");
					if (titleEl && titleEl.innerText.trim() !== currentTitle) {
						currentTitle = titleEl.innerText.trim();
						App.sync();
					}
					const ep = getActiveEpisode();
					if (ep && ep !== lastActiveEp) handleActiveEpisodeChange(ep);
					highlightEpisodes(trackedProgress);
				}
				if (!isHome()) {
					const needsVideoBottom = document.getElementById("video-bottom") && !document.getElementById("al-video-bottom-widget");
					if (!document.getElementById("al-nav-desktop") || needsVideoBottom) App.render();
				} else if (!document.getElementById("al-nav-desktop")) App.render();
			}, 600);
		}
	};
	App.init();
})();
