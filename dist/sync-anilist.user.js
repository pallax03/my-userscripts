// ==UserScript==
// @name         AniList Streaming Sync
// @namespace    https://github.com/pallax03/my-userscripts
// @version      1.3.2
// @author       Alex Mazzoni
// @description  Automatically sync watched AnimeUnity and AnimeSaturn episodes to AniList and skip opening sequences with AniSkip
// @license      MIT
// @source       https://github.com/pallax03/my-userscripts.git
// @downloadURL  https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/sync-anilist.user.js
// @updateURL    https://raw.githubusercontent.com/pallax03/my-userscripts/master/dist/sync-anilist.user.js
// @include      *://*.animeunity.*/*
// @include      *://animeunity.*/*
// @include      *://*.animesaturn.*/*
// @include      *://animesaturn.*/*
// @include      *://*.saturncdn.*/*
// @include      *://play.saturncdn.*/*
// @include      *://*.vixcloud.*/*
// @include      *://vixcloud.*/*
// @include      *://*.vixcloud2.*/*
// @include      *://vixcloud2.*/*
// @include      /^https?:\/\/(?:[a-z0-9-]+\.)?animeunity\.[a-z]{2,}\/.*$/
// @include      /^https?:\/\/(?:[a-z0-9-]+\.)?animesaturn\.[a-z]{2,}\/.*$/
// @include      /^https?:\/\/(?:[a-z0-9-]+\.)?saturncdn\.[a-z]{2,}\/.*$/
// @include      /^https?:\/\/(?:[a-z0-9-]+\.)?vixcloud[0-9]?\.[a-z]{2,}\/.*$/
// @match        *://*.animeunity.to/*
// @match        *://animeunity.to/*
// @match        *://*.animeunity.so/*
// @match        *://animeunity.so/*
// @match        *://*.animeunity.tv/*
// @match        *://animeunity.tv/*
// @match        *://*.animeunity.co/*
// @match        *://animeunity.co/*
// @match        *://*.animeunity.cc/*
// @match        *://animeunity.cc/*
// @match        *://*.animeunity.fun/*
// @match        *://animeunity.fun/*
// @match        *://*.animesaturn.net/*
// @match        *://animesaturn.net/*
// @match        *://*.animesaturn.cx/*
// @match        *://animesaturn.cx/*
// @match        *://*.animesaturn.cc/*
// @match        *://animesaturn.cc/*
// @match        *://*.animesaturn.in/*
// @match        *://animesaturn.in/*
// @match        *://*.animesaturn.me/*
// @match        *://animesaturn.me/*
// @match        *://*.animesaturn.to/*
// @match        *://animesaturn.to/*
// @match        *://*.saturncdn.net/*
// @match        *://play.saturncdn.net/*
// @match        *://*.vixcloud.cc/*
// @match        *://vixcloud.cc/*
// @match        *://*.vixcloud.co/*
// @match        *://vixcloud.co/*
// @match        *://*.vixcloud.to/*
// @match        *://vixcloud.to/*
// @match        *://*.vixcloud.net/*
// @match        *://vixcloud.net/*
// @match        *://*.vixcloud.org/*
// @match        *://vixcloud.org/*
// @match        *://*.vixcloud.video/*
// @match        *://vixcloud.video/*
// @match        *://*.vixcloud2.cc/*
// @match        *://vixcloud2.cc/*
// @match        *://*.vixcloud2.co/*
// @match        *://vixcloud2.co/*
// @match        *://*.vixcloud2.to/*
// @match        *://vixcloud2.to/*
// @match        *://*.vixcloud2.net/*
// @match        *://vixcloud2.net/*
// @connect      graphql.anilist.co
// @connect      anilist.co
// @connect      api.aniskip.com
// @connect      animesaturn.net
// @connect      saturncdn.net
// @connect      animeunity.to
// @connect      animeunity.so
// @connect      animeunity.tv
// @connect      animeunity.co
// @connect      animeunity.cc
// @connect      animeunity.fun
// @connect      animeunity.*
// @connect      animesaturn.*
// @grant        GM_addStyle
// @grant        GM_deleteValue
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
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
	_css(".al-badge{white-space:nowrap;-webkit-backdrop-filter:blur(8px);border:1px solid #0000;border-radius:6px;align-items:center;gap:5px;padding:3px 8px;font-size:11px;font-weight:700;line-height:1.2;display:inline-flex}.al-badge svg{flex-shrink:0}.al-badge.al-badge-CURRENT{color:#76caf6;background:#3db4f229;border-color:#3db4f273}.al-badge.al-badge-CURRENT .al-dot{background:#3db4f2;box-shadow:0 0 6px #3db4f299}.al-badge.al-badge-PLANNING{color:#b9c3d0;background:#94a3b829;border-color:#94a3b873}.al-badge.al-badge-PLANNING .al-dot{background:#94a3b8;box-shadow:0 0 6px #94a3b899}.al-badge.al-badge-COMPLETED{color:#45df7e;background:#22c55e29;border-color:#22c55e73}.al-badge.al-badge-COMPLETED .al-dot{background:#22c55e;box-shadow:0 0 6px #22c55e99}.al-badge.al-badge-PAUSED{color:#f8c937;background:#eab30829;border-color:#eab30873}.al-badge.al-badge-PAUSED .al-dot{background:#eab308;box-shadow:0 0 6px #eab30899}.al-badge.al-badge-REPEATING{color:#1fd9f9;background:#06b6d429;border-color:#06b6d473}.al-badge.al-badge-REPEATING .al-dot{background:#06b6d4;box-shadow:0 0 6px #06b6d499}.al-badge.al-badge-DROPPED{color:#f47c7c;background:#ef444429;border-color:#ef444473}.al-badge.al-badge-DROPPED .al-dot{background:#ef4444;box-shadow:0 0 6px #ef444499}.al-dot{border-radius:50%;flex-shrink:0;width:6px;height:6px;display:inline-block}.al-btn{cursor:pointer;white-space:nowrap;border:1px solid #0000;border-radius:9px;justify-content:center;align-items:center;gap:6px;padding:8px 16px;font-size:13px;font-weight:700;text-decoration:none;transition:all .2s cubic-bezier(.4,0,.2,1);display:inline-flex}.al-btn:hover{text-decoration:none;transform:translateY(-1px)}.al-btn:active{transform:translateY(0)}.al-btn.primary{background:linear-gradient(135deg,#3db4f2 0%,#0284c7 100%);box-shadow:0 4px 14px #3db4f259;color:#06101e!important}.al-btn.primary:hover{filter:brightness(1.08);box-shadow:0 6px 20px #3db4f28c;color:#06101e!important}.al-btn.secondary{background:#ffffff14;border-color:#ffffff26;color:#e2e8f0!important}.al-btn.secondary:hover{background:#ffffff24;color:#fff!important}.al-btn.danger{background:#ef444426;border-color:#ef444459;color:#fca5a5!important}.al-btn.danger:hover{background:#ef444447;border-color:#ef4444;color:#fff!important}.al-overlay{-webkit-backdrop-filter:blur(16px);animation:.2s al-fade-in;inset:0!important;box-sizing:border-box!important;z-index:2147483647!important;pointer-events:auto!important;visibility:visible!important;opacity:1!important;background:#03070dd9!important;justify-content:center!important;align-items:center!important;width:100vw!important;min-width:100vw!important;height:100vh!important;min-height:100vh!important;margin:0!important;padding:16px!important;display:flex!important;position:fixed!important;inset:0!important}.al-overlay.al-overlay-drawer{justify-content:flex-end!important;align-items:stretch!important;padding:0!important}.al-modal{color:#fff;background:linear-gradient(135deg,#101a27 0%,#080f18 100%);border:1px solid #3db4f259;border-radius:16px;width:90%;max-width:440px;max-height:calc(100vh - 32px);padding:24px;animation:.25s cubic-bezier(.16,1,.3,1) al-modal-in;overflow-y:auto;box-shadow:0 20px 60px #000000d9,0 0 30px #3db4f22e;z-index:2147483647!important;pointer-events:auto!important;visibility:visible!important;opacity:1!important;box-sizing:border-box!important;position:relative!important}.al-modal .al-modal-header{justify-content:space-between;align-items:center;gap:14px;margin-bottom:18px;display:flex}.al-modal .al-modal-header .al-modal-header-left{align-items:center;gap:14px;min-width:0;display:flex}.al-modal .al-modal-header .al-modal-close-btn{color:#94a3b8;cursor:pointer;background:#ffffff0f;border:1px solid #ffffff1a;border-radius:9px;flex-shrink:0;justify-content:center;align-items:center;width:32px;height:32px;transition:all .15s;display:inline-flex}.al-modal .al-modal-header .al-modal-close-btn:hover{color:#fff;background:#ffffff24;border-color:#ffffff38;transform:scale(1.05)}.al-modal .al-modal-icon{color:#3db4f2;background:linear-gradient(135deg,#3db4f233,#0284c71a);border:1px solid #3db4f266;border-radius:12px;flex-shrink:0;justify-content:center;align-items:center;width:44px;height:44px;display:flex;box-shadow:0 0 15px #3db4f24d}.al-modal .al-modal-title{color:#fff;margin:0;font-size:18px;font-weight:700;line-height:1.2}.al-modal .al-modal-subtitle{color:#94a3b8;margin:3px 0 0;font-size:12px;line-height:1.3}.al-modal .al-modal-body{flex-direction:column;gap:12px;display:flex}.al-modal .al-modal-actions{justify-content:flex-end;align-items:center;gap:10px;margin-top:20px;display:flex}.al-auth-link{background:linear-gradient(135deg,#3db4f226,#0ea5e914);border:1px solid #3db4f259;border-radius:10px;justify-content:space-between;align-items:center;padding:11px 14px;font-size:13px;font-weight:700;text-decoration:none;transition:all .2s;display:flex;color:#3db4f2!important}.al-auth-link .al-auth-tag{color:#06101e;text-transform:uppercase;background:#3db4f2;border-radius:5px;padding:2px 6px;font-size:10px;font-weight:900}.al-auth-link:hover{background:linear-gradient(135deg,#3db4f240,#0ea5e929);border-color:#3db4f2}.al-auth-hint{color:#94a3b8;margin:0;font-size:12px;line-height:1.4}.al-input-group input{box-sizing:border-box;color:#fff;background:#0d1521d9;border:1px solid #3db4f259;border-radius:10px;outline:none;width:100%;padding:10px 14px;font-size:13px;transition:all .2s}.al-input-group input:focus{border-color:#3db4f2;box-shadow:0 0 15px #3db4f24d}.al-prefs-modal{max-width:460px!important}.al-prefs-modal .al-prefs-body{flex-direction:column;gap:12px;display:flex}.al-prefs-modal .al-pref-group{background:#ffffff08;border:1px solid #ffffff14;border-radius:12px;flex-direction:column;transition:background .25s,border-color .25s,box-shadow .25s;display:flex;overflow:hidden}.al-prefs-modal .al-pref-group.is-active{background:#3db4f20a;border-color:#3db4f259;box-shadow:0 4px 16px #0000004d}.al-prefs-modal .al-pref-group.is-active .al-pref-header{border-bottom:1px solid #3db4f226}.al-prefs-modal .al-pref-group .al-pref-header{cursor:pointer;justify-content:space-between;align-items:center;gap:14px;margin:0;padding:12px 14px;transition:background .15s;display:flex}.al-prefs-modal .al-pref-group .al-pref-header:hover{background:#ffffff08}.al-prefs-modal .al-pref-group .al-pref-info{flex-direction:column;gap:2px;display:flex}.al-prefs-modal .al-pref-group .al-pref-title{color:#f1f5f9;font-size:13px;font-weight:600}.al-prefs-modal .al-pref-group .al-pref-desc{color:#94a3b8;font-size:11px;font-weight:500}.al-prefs-modal .al-pref-group .al-pref-sub{background:#080e1799;flex-direction:column;gap:12px;padding:12px 14px;animation:.22s cubic-bezier(.16,1,.3,1) al-slide-down;display:flex}.al-prefs-modal .al-pref-group .al-pref-sub.is-hidden{display:none!important}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row{color:#cbd5e1;cursor:pointer;justify-content:space-between;align-items:center;gap:12px;margin:0;font-size:12px;font-weight:500;display:flex}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-pref-sub-label{color:#94a3b8;align-items:center;gap:8px;display:flex}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-pref-sub-label svg{color:#3db4f2}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-select-xs{color:#f1f5f9;cursor:pointer;background:#0e1622f2;border:1px solid #ffffff29;border-radius:7px;outline:none;padding:4px 8px;font-size:12px;font-weight:600}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-select-xs:hover,.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-select-xs:focus{border-color:#3db4f2}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-checkbox{accent-color:#3db4f2;cursor:pointer;width:16px;height:16px}.al-prefs-modal .al-switch{appearance:none;cursor:pointer;background:#ffffff29;border-radius:12px;outline:none;flex-shrink:0;width:36px;height:20px;transition:background .2s;position:relative}.al-prefs-modal .al-switch:after{content:\"\";background:#fff;border-radius:50%;width:16px;height:16px;transition:transform .2s cubic-bezier(.16,1,.3,1);position:absolute;top:2px;left:2px;box-shadow:0 1px 3px #0006}.al-prefs-modal .al-switch:checked{background:#3db4f2}.al-prefs-modal .al-switch:checked:after{background:#06101e;transform:translate(16px)}.al-prefs-modal .al-avatar-sm{object-fit:cover;border:1px solid #3db4f2;border-radius:50%;width:22px;height:22px;box-shadow:0 0 6px #3db4f24d}.al-prefs-modal .al-btn-logout{padding:5px 10px;font-size:11px;color:#fca5a5!important;border-color:#ef44444d!important}.al-prefs-modal .al-btn-logout:hover{color:#fff!important;background:#ef444433!important;border-color:#ef4444!important}.al-toast{-webkit-backdrop-filter:blur(12px);animation:.2s cubic-bezier(.16,1,.3,1) al-modal-in;width:auto!important;max-width:380px!important;height:auto!important;min-height:unset!important;color:#fff!important;z-index:1000000!important;pointer-events:none!important;background:#0e1a29f2!important;border:1px solid #3db4f2!important;border-left-width:4px!important;border-radius:10px!important;padding:10px 20px!important;font-size:13px!important;font-weight:700!important;line-height:1.4!important;position:fixed!important;inset:auto auto 85px 50%!important;transform:translate(-50%)!important;box-shadow:0 12px 36px #000000d9,0 0 16px #3db4f240!important}.al-drawer{box-sizing:border-box!important;background:linear-gradient(#101a27 0%,#070e17 100%)!important;border:none!important;border-left:1px solid #3db4f259!important;border-radius:20px 0 0 20px!important;flex-direction:column!important;width:100%!important;max-width:480px!important;height:100dvh!important;max-height:100dvh!important;margin:0!important;padding:0!important;animation:.28s cubic-bezier(.16,1,.3,1) al-drawer-in!important;display:flex!important;overflow:hidden!important;box-shadow:-14px 0 60px #000000d9,-2px 0 25px #3db4f22e!important}.al-drawer .al-modal-header{-webkit-backdrop-filter:blur(12px);background:#0e1622d9;border-bottom:1px solid #ffffff14;flex-shrink:0;margin:0!important;padding:22px 24px 18px!important}.al-drawer .al-modal-body{flex-direction:column;gap:16px;display:flex;-webkit-overflow-scrolling:touch!important;flex:auto!important;padding:24px!important;overflow-y:auto!important}.al-drawer .al-modal-body::-webkit-scrollbar{width:6px}.al-drawer .al-modal-body::-webkit-scrollbar-track{background:#0003}.al-drawer .al-modal-body::-webkit-scrollbar-thumb{background:#ffffff29;border-radius:3px}.al-drawer .al-modal-body::-webkit-scrollbar-thumb:hover{background:#3db4f266}.al-drawer .al-modal-actions{-webkit-backdrop-filter:blur(12px);background:#080e16f5;border-top:1px solid #ffffff14;flex-shrink:0;justify-content:flex-end;align-items:center;gap:12px;display:flex;margin:0!important;padding:16px 24px!important}@media (width<=768px){.al-drawer{width:100vw!important;max-width:100vw!important;box-shadow:none!important;border:none!important;border-radius:0!important;animation:.25s cubic-bezier(.16,1,.3,1) al-drawer-mobile-in!important}.al-drawer .al-modal-header{padding:18px 18px 14px!important}.al-drawer .al-modal-body{padding:18px!important}.al-drawer .al-modal-actions{padding:14px 18px calc(14px + env(safe-area-inset-bottom,0px))!important}}@keyframes al-modal-in{0%{opacity:0;transform:translateY(10px)scale(.97)}to{opacity:1;transform:translateY(0)scale(1)}}@keyframes al-fade-in{0%{opacity:0}to{opacity:1}}@keyframes al-slide-down{0%{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}@keyframes al-drawer-in{0%{opacity:.6;transform:translate(100%)}to{opacity:1;transform:translate(0)}}@keyframes al-drawer-mobile-in{0%{opacity:.6;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}.cover-wrap .actions,.list-btn-mobile,#add-to-fav,a[href*=\\/login].list,a[href*=\\/login].btn-danger{display:none!important}#video-bottom{border-bottom:1px solid #3db4f233;min-height:40px;background-color:var(--color-background-1,#131722)!important;justify-content:center!important;align-items:center!important;padding:6px 12px!important;display:flex!important;position:relative!important;overflow:visible!important}#video-bottom a.prev{z-index:2;transition:all .2s;color:#94a3b8!important;white-space:nowrap!important;align-items:center!important;gap:6px!important;font-size:12px!important;font-weight:600!important;text-decoration:none!important;display:inline-flex!important;position:absolute!important;top:50%!important;left:12px!important;transform:translateY(-50%)!important}#video-bottom a.prev:hover{color:#3db4f2!important;text-decoration:none!important}#video-bottom a.next{z-index:2;transition:all .2s;color:#94a3b8!important;white-space:nowrap!important;align-items:center!important;gap:6px!important;font-size:12px!important;font-weight:600!important;text-decoration:none!important;display:inline-flex!important;position:absolute!important;top:50%!important;right:12px!important;transform:translateY(-50%)!important}#video-bottom a.next:hover{color:#3db4f2!important;text-decoration:none!important}@media (width<=500px){#video-bottom{padding:4px 8px!important}#video-bottom a.prev span,#video-bottom a.next span{display:none!important}#video-bottom a.prev,#video-bottom a.next{font-size:14px!important}}#video-bottom #al-video-bottom-widget{z-index:1;justify-content:center;align-items:center;gap:8px;max-width:calc(100% - 170px);margin:0 auto;display:flex}@media (width<=500px){#video-bottom #al-video-bottom-widget{max-width:calc(100% - 64px)}}#video-bottom #al-video-bottom-widget .al-vb-status-slot,#video-bottom #al-video-bottom-widget .al-vb-buddy-slot{align-items:center;display:inline-flex}#video-bottom #al-video-bottom-widget .al-vb-mark-btn{cursor:pointer;white-space:nowrap;background:linear-gradient(135deg,#3db4f2 0%,#0284c7 100%);border:none;border-radius:6px;align-items:center;gap:5px;min-height:26px;padding:4px 12px;font-size:11px;font-weight:800;transition:all .2s cubic-bezier(.16,1,.3,1);display:inline-flex;box-shadow:0 0 12px #3db4f266;color:#06101e!important}#video-bottom #al-video-bottom-widget .al-vb-mark-btn:hover{filter:brightness(1.08);transform:scale(1.04);box-shadow:0 0 16px #3db4f299}#video-bottom #al-video-bottom-widget .al-vb-mark-btn:active{transform:scale(.97)}#video-bottom #al-video-bottom-widget .al-vb-countdown{background:#0e1622f2;border:1px solid #3db4f273;border-radius:8px;justify-content:space-between;align-items:center;gap:8px;max-width:100%;padding:3px 6px;animation:2s ease-in-out infinite al-pulse-border;display:inline-flex;box-shadow:0 0 14px #3db4f240}#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-timer{color:#e2e8f0;white-space:nowrap;align-items:center;gap:5px;padding:0 4px;font-size:11px;font-weight:600;display:flex}#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-timer strong{color:#3db4f2}#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-btn{cursor:pointer;white-space:nowrap;justify-content:center;align-items:center;min-width:24px;min-height:24px;padding:0;transition:all .15s;display:inline-flex}#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-btn.al-vb-cancel{color:#fca5a5;background:#ef44441a;border:1px solid #ef44444d;border-radius:6px}#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-btn.al-vb-cancel:hover,#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-btn.al-vb-cancel:active{color:#fff;background:#ef44444d;border-color:#ef4444}#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-btn.al-vb-save{color:#06101e;background:linear-gradient(135deg,#3db4f2 0%,#0284c7 100%);border:none;border-radius:6px;box-shadow:0 0 8px #3db4f259}#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-btn.al-vb-save:hover,#video-bottom #al-video-bottom-widget .al-vb-countdown .al-vb-btn.al-vb-save:active{filter:brightness(1.15);box-shadow:0 0 12px #3db4f28c}#video-bottom #al-video-bottom-widget .al-vb-synced{color:#4ade80;white-space:nowrap;background:#22c55e1f;border:1px solid #22c55e4d;border-radius:6px;align-items:center;gap:5px;min-height:26px;padding:4px 8px;font-size:11px;font-weight:600;display:inline-flex}#video-bottom #al-video-bottom-widget .al-vb-synced .al-vb-reset-btn{color:#94a3b8!important;cursor:pointer!important;background:0 0!important;border:none!important;justify-content:center!important;align-items:center!important;width:18px!important;height:18px!important;margin-left:2px!important;padding:0!important;transition:color .15s!important;display:inline-flex!important}#video-bottom #al-video-bottom-widget .al-vb-synced .al-vb-reset-btn:hover{color:#ef4444!important}#video-bottom #al-video-bottom-widget .al-vb-recap{color:#93c5fd;white-space:nowrap;background:#3b82f61f;border:1px solid #3b82f64d;border-radius:6px;align-items:center;gap:8px;min-height:26px;padding:3px 8px;font-size:11px;font-weight:600;display:inline-flex}#video-bottom #al-video-bottom-widget .al-vb-recap .al-vb-recap-text{align-items:center;gap:5px;display:flex}#video-bottom #al-video-bottom-widget .al-vb-recap .al-vb-btn.ghost-xs{color:#e2e8f0;cursor:pointer;background:#ffffff14;border:1px solid #ffffff26;border-radius:5px;justify-content:center;align-items:center;min-width:22px;min-height:22px;padding:0;display:inline-flex}#video-bottom #al-video-bottom-widget .al-vb-recap .al-vb-btn.ghost-xs:hover{color:#fff;background:#3db4f240;border-color:#3db4f2}.al-card{-webkit-backdrop-filter:blur(20px);background:linear-gradient(135deg,#111a26f0 0%,#0a121cfa 100%);border:1px solid #3db4f24d;border-radius:14px;width:100%;margin-top:14px;margin-bottom:24px;padding:12px 18px 14px;transition:border-color .3s,box-shadow .3s;position:relative;overflow:visible;box-shadow:0 12px 35px #0009,0 0 20px #3db4f21f}.al-card:hover{border-color:#3db4f280;box-shadow:0 14px 40px #000000b3,0 0 25px #3db4f233}.al-card .al-card-row{flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;width:100%;display:flex}.al-card .al-left{flex-wrap:wrap;align-items:center;gap:8px;min-width:0;display:flex}.al-card .al-right,.al-card .al-controls-group{align-items:center;gap:10px;display:flex}.al-card .al-controls-group .al-buddy-cluster{box-sizing:border-box;background:#0e1622a6;border:1px solid #3db4f238;border-radius:10px;align-items:center;gap:6px;height:36px;padding:2px 6px 2px 2px;transition:all .2s;display:inline-flex}.al-card .al-controls-group .al-buddy-cluster:hover{background:#0e1622d9;border-color:#3db4f273}.al-card .al-controls-group .al-buddy-cluster.has-completed{background:#0a1914b3;border-color:#22c55e66}.al-card .al-controls-group .al-buddy-cluster.has-completed:hover{border-color:#22c55ea6}.al-card .al-controls-group .al-buddy-cluster .al-buddy-box{align-items:center;display:inline-flex}.al-card .al-controls-group .al-buddy-cluster .al-buddy-box .al-buddy-btn{background:0 0;border:none;height:30px;padding:0 8px 0 6px;font-size:12px}.al-card .al-controls-group .al-buddy-cluster .al-buddy-box .al-buddy-btn:hover{box-shadow:none;background:#ffffff0f}.al-card .al-controls-group .al-buddy-cluster .al-buddy-sync-btn{cursor:pointer;white-space:nowrap;background:linear-gradient(135deg,#3db4f238,#0284c74d);border:1px solid #3db4f280;border-radius:7px;align-items:center;gap:5px;height:28px;padding:0 10px;font-size:11.5px;font-weight:700;transition:all .2s cubic-bezier(.4,0,.2,1);display:inline-flex;box-shadow:0 0 10px #3db4f233;color:#38bdf8!important}.al-card .al-controls-group .al-buddy-cluster .al-buddy-sync-btn svg{flex-shrink:0;transition:transform .2s}.al-card .al-controls-group .al-buddy-cluster .al-buddy-sync-btn:hover{background:linear-gradient(135deg,#3db4f2 0%,#0284c7 100%);border-color:#0000;transform:translateY(-1px);box-shadow:0 4px 14px #3db4f273;color:#06101e!important}.al-card .al-controls-group .al-buddy-cluster .al-buddy-sync-btn:hover svg{transform:scale(1.1)}.al-card .al-controls-group .al-buddy-cluster .al-buddy-sync-btn:active{transform:translateY(0)}.al-card .al-controls-group .al-buddy-cluster .al-buddy-sync-btn.is-completed{background:linear-gradient(135deg,#22c55e40,#16a34a59);border:1px solid #22c55e99;box-shadow:0 0 12px #22c55e40;color:#4ade80!important}.al-card .al-controls-group .al-buddy-cluster .al-buddy-sync-btn.is-completed:hover{background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);border-color:#0000;box-shadow:0 4px 16px #22c55e80;color:#052e16!important}.al-card .al-controls-group .al-buddy-cluster .al-buddy-tag{white-space:nowrap;color:#94a3b8;background:#ffffff0f;border:1px solid #ffffff1a;border-radius:6px;align-items:center;gap:5px;height:26px;padding:0 8px;font-size:11px;font-weight:700;display:inline-flex}.al-card .al-controls-group .al-buddy-cluster .al-buddy-tag .al-dot{background:#94a3b8;border-radius:50%;flex-shrink:0;width:5px;height:5px;display:inline-block}.al-card .al-controls-group .al-buddy-cluster .al-buddy-tag.is-completed{color:#4ade80;background:#22c55e26;border-color:#22c55e66}.al-card .al-controls-group .al-buddy-cluster .al-buddy-tag.is-completed .al-dot{background:#22c55e;box-shadow:0 0 6px #22c55e99}.al-card .al-info{color:#e2e8f0;align-items:center;gap:10px;font-size:13px;font-weight:600;display:flex}.al-card .al-pill{text-transform:uppercase;letter-spacing:.5px;color:#06101e;background:linear-gradient(135deg,#3db4f2,#0284c7);border-radius:6px;padding:3px 8px;font-size:11px;font-weight:800}.al-card .al-pill.danger{color:#fff;background:linear-gradient(135deg,#ef4444,#b91c1c)}.al-card .al-badge{background:linear-gradient(135deg,#3db4f22e,#0ea5e91a);border:1px solid #3db4f273;border-radius:9px;align-items:center;gap:8px;max-width:320px;padding:6px 14px;font-size:13px;font-weight:700;text-decoration:none;transition:all .2s;display:inline-flex;color:#3db4f2!important}.al-card .al-badge .al-title-text{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.al-card .al-badge .al-badge-icon{opacity:.85;flex-shrink:0;transition:transform .2s,opacity .2s}.al-card .al-badge:hover{background:linear-gradient(135deg,#3db4f247,#0ea5e933);border-color:#3db4f2;text-decoration:none;transform:translateY(-1px);box-shadow:0 0 15px #3db4f259}.al-card .al-badge:hover .al-badge-icon{opacity:1;transform:translate(1px,-1px)}.al-card .al-icon-btn{color:#94a3b8;cursor:pointer;background:#ffffff0d;border:1px solid #ffffff1f;border-radius:8px;justify-content:center;align-items:center;width:34px;height:34px;transition:all .2s;display:inline-flex}.al-card .al-icon-btn:hover{color:#fff;background:#ffffff1f;border-color:#ffffff4d;transform:translateY(-1px)}.al-card .al-icon-btn.primary{background:linear-gradient(135deg,#3db4f2 0%,#0284c7 100%);border:none;color:#06101e!important}.al-card .al-icon-btn.primary:hover{filter:brightness(1.15);box-shadow:0 0 10px #3db4f280;color:#06101e!important}.al-card .al-icon-btn.danger:hover{color:#ef4444;background:#ef44442e;border-color:#ef4444;box-shadow:0 0 12px #ef44444d}.al-card .al-title-meta-wrap{flex-wrap:wrap;align-items:center;gap:8px;display:inline-flex}.al-card .al-ep-chip{box-sizing:border-box;white-space:nowrap;background:#0e1622d9;border:1px solid #ffffff1a;border-radius:8px;align-items:center;gap:6px;padding:3px 6px 3px 8px;font-size:11.5px;transition:all .2s;display:inline-flex}.al-card .al-ep-chip .al-ep-chip-badge{align-items:center;gap:5px;font-weight:600;display:inline-flex}.al-card .al-ep-chip .al-ep-chip-badge .al-ep-chip-num{font-weight:700}.al-card .al-ep-chip .al-ep-chip-badge .al-ep-chip-timer{color:#f59e0b;font-weight:800}.al-card .al-ep-chip .al-ep-chip-badge .al-ep-chip-text{opacity:.85;font-size:10.5px}.al-card .al-ep-chip .al-ep-chip-actions{align-items:center;gap:4px;margin-left:2px;display:inline-flex}.al-card .al-ep-chip .al-ep-mini-btn{cursor:pointer;white-space:nowrap;-webkit-user-select:none;user-select:none;border:none;border-radius:5px;justify-content:center;align-items:center;gap:4px;height:22px;padding:0 7px;font-size:11px;font-weight:700;transition:all .15s cubic-bezier(.16,1,.3,1);display:inline-flex}.al-card .al-ep-chip .al-ep-mini-btn.primary{color:#06101e;background:#3db4f2}.al-card .al-ep-chip .al-ep-mini-btn.primary:hover{background:#2ca5e6;box-shadow:0 0 8px #3db4f280}.al-card .al-ep-chip .al-ep-mini-btn.success{background:#10b981;border:none;min-width:24px;height:22px;padding:0 6px;box-shadow:0 0 8px #10b98166;color:#fff!important}.al-card .al-ep-chip .al-ep-mini-btn.success svg{stroke-width:2.75px;filter:drop-shadow(0 1px 2px #00000059);color:#fff!important;stroke:#fff!important}.al-card .al-ep-chip .al-ep-mini-btn.success:hover{background:#059669;transform:translateY(-1px);box-shadow:0 0 12px #10b981a6}.al-card .al-ep-chip .al-ep-mini-btn.success:active{transform:translateY(0)}.al-card .al-ep-chip .al-ep-mini-btn.cancel,.al-card .al-ep-chip .al-ep-mini-btn.danger{color:#fca5a5;background:#ef444426;border:1px solid #ef444459;padding:0 5px}.al-card .al-ep-chip .al-ep-mini-btn.cancel:hover,.al-card .al-ep-chip .al-ep-mini-btn.danger:hover{color:#fff;background:#ef44444d;border-color:#ef4444}.al-card .al-ep-chip .al-ep-mini-btn.rewind{color:#94a3b8;background:#ffffff12;border:1px solid #ffffff24}.al-card .al-ep-chip .al-ep-mini-btn.rewind:hover{color:#fca5a5;background:#ef444433;border-color:#ef444473}.al-card .al-ep-chip.is-countdown{color:#fbbf24;background:#f59e0b1a;border-color:#f59e0b59;box-shadow:0 0 10px #f59e0b26}.al-card .al-ep-chip.is-countdown svg{color:#f59e0b}.al-card .al-ep-chip.is-synced{color:#38bdf8;background:#38bdf81a;border-color:#38bdf84d}.al-card .al-ep-chip.is-synced svg{color:#38bdf8}.al-card .al-ep-chip.is-watched{color:#34d399;background:#34d3991a;border-color:#34d39940}.al-card .al-ep-chip.is-watched svg{color:#34d399}.al-card .al-ep-chip.is-untracked{color:#facc15;background:#eab30814;border-color:#eab30840}.al-card .al-ep-chip.is-untracked svg{color:#eab308}.al-card .al-ep-chip.is-resuming{color:#c084fc;background:#a855f71f;border-color:#a855f759}.al-card .al-ep-chip.is-resuming svg{color:#a855f7}.al-card .al-card-dates-row{border-top:1px solid #ffffff0f;justify-content:space-between;align-items:center;width:100%;margin-top:10px;padding-top:8px;display:flex}.al-card .al-card-dates-row .al-date-col{align-items:center;gap:6px;display:flex}.al-card .al-card-dates-row .al-date-col.al-date-start{justify-content:flex-start}.al-card .al-card-dates-row .al-date-col.al-date-end{justify-content:flex-end;margin-left:auto}.al-card .al-card-dates-row .al-meta-date{color:#94a3b8;white-space:nowrap;background:#ffffff0a;border:1px solid #ffffff14;border-radius:6px;align-items:center;gap:5px;padding:2.5px 8px;font-size:11px;font-weight:600;display:inline-flex}.al-card .al-card-dates-row .al-meta-date svg{color:#38bdf8;opacity:.85}.al-card .al-card-dates-row .al-meta-date.al-meta-repeat{color:#a78bfa;background:#a78bfa14;border-color:#a78bfa40}.al-card .al-card-dates-row .al-meta-date.al-meta-repeat svg{color:#a78bfa}.al-card .al-select{appearance:none;color:#f1f5f9;cursor:pointer;background:#0e1622d9 url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='none' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' d='m1 1 4 4 4-4'/%3E%3C/svg%3E\") right 10px center no-repeat;border:1px solid #ffffff29;border-radius:9px;outline:none;height:34px;padding:5px 28px 5px 11px;font-size:12.5px;font-weight:600;transition:all .2s}.al-card .al-select:hover,.al-card .al-select:focus{border-color:#3db4f2;box-shadow:0 0 12px #3db4f240}.al-card .al-select option{color:#fff;background:#0e1622}.al-card .al-select.al-status-select{background-color:#0e1622d9;border-color:#3db4f259}.al-card .al-select.al-status-select:hover,.al-card .al-select.al-status-select:focus{border-color:#3db4f2}.al-card .al-card-progress-bar{background:#ffffff0f;height:3px;position:absolute;bottom:0;left:0;right:0}.al-card .al-card-progress-bar .al-card-progress-fill{background:linear-gradient(90deg,#3db4f2,#22c55e);height:100%;transition:width .3s;box-shadow:0 0 8px #3db4f2b3}@media (width<=768px){.al-card{padding:12px 14px 14px}.al-card .al-card-row{flex-direction:column;align-items:stretch;gap:10px}.al-card .al-left{width:100%}.al-card .al-left .al-title-meta-wrap{flex-wrap:wrap;align-items:center;gap:8px;width:100%;display:flex}.al-card .al-left .al-title-meta-wrap .al-badge{flex:auto;min-width:130px;max-width:none}.al-card .al-left .al-title-meta-wrap .al-status-select{flex:none}.al-card .al-left .al-title-meta-wrap .al-ep-chip{width:auto;max-width:100%}.al-card .al-right{width:100%}.al-card .al-controls-group{flex-wrap:wrap;align-items:center;gap:8px;width:100%;display:flex}.al-card .al-controls-group .al-buddy-cluster{box-sizing:border-box;justify-content:space-between;align-items:center;gap:8px;width:100%;height:auto;min-height:38px;padding:4px 6px;display:flex}.al-card .al-controls-group .al-buddy-cluster .al-buddy-box{flex:1;min-width:0}.al-card .al-controls-group .al-buddy-cluster .al-buddy-box .al-buddy-picker-wrap{width:100%}.al-card .al-controls-group .al-buddy-cluster .al-buddy-box .al-buddy-picker-wrap .al-buddy-btn{justify-content:flex-start;width:100%}.al-card .al-controls-group .al-score-select{flex:auto;min-width:90px;height:36px}.al-card .al-controls-group .al-bar-del-btn{flex-shrink:0;width:36px;height:36px}}.al-avatar{object-fit:cover;border:2px solid #3db4f2;border-radius:50%;width:36px;height:36px;transition:transform .2s,box-shadow .2s;box-shadow:0 0 12px #3db4f266}.al-avatar:hover{transform:scale(1.05);box-shadow:0 0 18px #3db4f2a6}.al-avatar-mobile{object-fit:cover;cursor:pointer;border:2px solid #3db4f2;border-radius:50%;width:32px;height:32px;box-shadow:0 0 10px #3db4f259}.al-dropdown-menu{-webkit-backdrop-filter:blur(20px);box-sizing:border-box;min-width:220px;max-width:calc(100vw - 24px);max-height:calc(100vh - 75px);display:none;overflow:hidden auto;box-shadow:0 16px 45px #000000d9,0 0 20px #3db4f226;background:linear-gradient(135deg,#111a26fa 0%,#080f18fc 100%)!important;border:1px solid #3db4f24d!important;border-radius:14px!important;padding:0!important}.al-dropdown-menu.show{display:block!important}.al-dropdown-menu:before{content:\"\";background:0 0;height:16px;position:absolute;top:-15px;left:0;right:0}.al-dropdown-menu .al-dropdown-header{background:#ffffff08;border-bottom:1px solid #ffffff14;padding:14px 16px 12px}.al-dropdown-menu .al-dropdown-header .al-user-info{align-items:center;gap:10px;display:flex}.al-dropdown-menu .al-dropdown-header .al-dropdown-avatar{object-fit:cover;border:2px solid #3db4f2;border-radius:50%;width:40px;height:40px;box-shadow:0 0 12px #3db4f273}.al-dropdown-menu .al-dropdown-header .al-user-text{flex-direction:column;display:flex;overflow:hidden}.al-dropdown-menu .al-dropdown-header .al-username{color:#fff;white-space:nowrap;text-overflow:ellipsis;max-width:145px;font-size:14px;font-weight:700;overflow:hidden}.al-dropdown-menu .al-dropdown-header .al-user-status{color:#94a3b8;align-items:center;gap:6px;font-size:11px;font-weight:600;display:flex}.al-dropdown-menu .al-dropdown-header .al-status-dot{background:#22c55e;border-radius:50%;width:7px;height:7px;box-shadow:0 0 8px #22c55e}.al-dropdown-menu .al-dropdown-body{padding:6px 0}.al-dropdown-menu .al-dropdown-footer{background:#00000040;border-top:1px solid #ffffff14;padding:6px 8px}.al-dropdown-menu .al-dropdown-item{color:#cbd5e1;cursor:pointer;background:0 0;border:none;justify-content:space-between;align-items:center;width:100%;padding:10px 16px;font-size:13px;font-weight:500;text-decoration:none;transition:all .15s;display:flex}.al-dropdown-menu .al-dropdown-item .al-item-left{align-items:center;gap:10px;display:flex}.al-dropdown-menu .al-dropdown-item .al-item-ext{color:#64748b;transition:color .15s}.al-dropdown-menu .al-dropdown-item:hover{text-decoration:none;color:#fff!important;background:#3db4f224!important}.al-dropdown-menu .al-dropdown-item:hover .al-item-ext{color:#3db4f2}.al-dropdown-menu .al-dropdown-item.danger{color:#fca5a5;background:#ef444414;border:1px solid #ef444438;border-radius:8px;margin:2px 0;padding:8px 12px;font-weight:600}.al-dropdown-menu .al-dropdown-item.danger:hover{box-shadow:0 0 14px #ef444440;color:#fff!important;background:#ef444438!important;border-color:#ef444480!important}.episode-wrapper .episode-item.al-done:not(.active):not(.al-tracked){background-color:#3db4f21f!important;border:1px solid #3db4f24d!important}.episode-wrapper .episode-item.al-done:not(.active):not(.al-tracked) a{color:#93c5fd!important}.episode-wrapper .episode-item.al-tracked{position:relative;border:2px solid #3db4f2!important}.episode-wrapper .episode-item.al-tracked:not(.active){background-color:#3db4f233!important}.episode-wrapper .episode-item.al-tracked:not(.active) a{color:#3db4f2!important;font-weight:700!important}.episode-wrapper .episode-item.al-tracked:after{content:\"✓\";color:#06101e;z-index:6;background:#3db4f2;border-radius:50%;justify-content:center;align-items:center;width:15px;height:15px;font-size:10px;font-weight:900;display:flex;position:absolute;top:-6px;right:-6px;box-shadow:0 2px 6px #0009}.episode-wrapper .episode-item.seen:not(.active):not(.al-tracked):not(.al-done){background-color:var(--color-background-1,#191d26)!important;color:inherit!important}.episode-wrapper .episode-item.active{z-index:10!important;background:#007bff!important;transform:scale(1.12)!important;box-shadow:0 0 16px #007bfff2,0 0 0 2px #fff!important}.episode-wrapper .episode-item.active a{color:#fff!important;font-weight:900!important}.al-toast{width:auto!important;max-width:380px!important;height:auto!important;min-height:unset!important;color:#fff!important;z-index:100000!important;pointer-events:none!important;background:linear-gradient(135deg,#102538 0%,#091724 100%)!important;border:1px solid #3db4f259!important;border-left:4px solid #3db4f2!important;border-radius:9px!important;padding:12px 20px!important;font-size:13px!important;font-weight:600!important;line-height:1.4!important;position:fixed!important;inset:auto 24px 24px auto!important;transform:none!important;box-shadow:0 10px 30px #0009,0 0 15px #3db4f233!important}.al-toast.al-toast-alert,.al-toast.alert{border-color:#ef444473!important;box-shadow:0 10px 30px #0009,0 0 15px #ef444440!important}@keyframes al-pulse-border{0%,to{border-color:#3db4f273;box-shadow:0 0 12px #3db4f233}50%{border-color:#3db4f2cc;box-shadow:0 0 20px #3db4f273}}.al-home-shelf-row{width:100%;margin-top:10px;margin-bottom:24px}.al-home-shelf{-webkit-backdrop-filter:blur(16px);background:#0e16228c;border:1px solid #ffffff14;border-radius:14px;width:100%;padding:16px 20px;box-shadow:0 8px 32px #00000040}@media (width<=576px){.al-home-shelf{padding:14px 12px}}.al-shelf-header{border-bottom:1px solid #ffffff0f;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;padding-bottom:12px;display:flex}.al-shelf-title-wrap{align-items:center;gap:10px;display:flex}.al-shelf-title-wrap .al-shelf-icon{color:#3db4f2;background:#3db4f226;border-radius:8px;justify-content:center;align-items:center;width:28px;height:28px;display:flex;box-shadow:0 0 10px #3db4f240}.al-shelf-title-wrap .al-shelf-title{letter-spacing:.6px;text-transform:uppercase;color:#fff;margin:0;font-size:1.15rem;font-weight:800;line-height:1}.al-shelf-title-wrap .al-shelf-count{color:#94a3b8;background:#ffffff14;border:1px solid #ffffff0f;border-radius:10px;justify-content:center;align-items:center;padding:2px 8px;font-size:11px;font-weight:700;display:inline-flex}.al-shelf-controls{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.al-shelf-pref-btn{color:#94a3b8;cursor:pointer;background:#ffffff0d;border:1px solid #ffffff14;border-radius:8px;flex-shrink:0;justify-content:center;align-items:center;width:28px;height:28px;transition:all .2s;display:flex}.al-shelf-pref-btn:hover{color:#3db4f2;background:#3db4f226;border-color:#3db4f259}.al-shelf-chip-btn{cursor:pointer;-webkit-user-select:none;user-select:none;color:#94a3b8;white-space:nowrap;background:#ffffff0d;border:1px solid #ffffff14;border-radius:20px;align-items:center;gap:5px;padding:4px 10px;font-size:11px;font-weight:600;transition:all .2s cubic-bezier(.16,1,.3,1);display:inline-flex}.al-shelf-chip-btn svg{flex-shrink:0;transition:transform .2s}.al-shelf-chip-btn .al-chip-count{color:#cbd5e1;background:#ffffff1a;border-radius:10px;margin-left:2px;padding:1px 5px;font-size:9.5px;font-weight:800}.al-shelf-chip-btn:hover{color:#f1f5f9;background:#ffffff1a;border-color:#fff3}.al-shelf-chip-btn.is-active{color:#38bdf8;background:#3db4f22e;border-color:#3db4f280;box-shadow:0 0 10px #3db4f240}.al-shelf-chip-btn.is-active .al-chip-count{color:#e0f2fe;background:#3db4f259}.al-shelf-chip-btn.is-sync.is-active{color:#38bdf8;background:#0ea5e92e;border-color:#0ea5e980}.al-shelf-chip-btn.is-sync.is-active .al-chip-count{color:#e0f2fe;background:#0ea5e959}.al-shelf-carousel-wrap{width:100%;position:relative}.al-shelf-track{scroll-snap-type:x mandatory;scroll-behavior:smooth;scrollbar-width:thin;scrollbar-color:#3db4f24d transparent;gap:16px;padding:4px 2px 14px;display:flex;overflow-x:auto}.al-shelf-track::-webkit-scrollbar{height:6px}.al-shelf-track::-webkit-scrollbar-track{background:#ffffff08;border-radius:4px}.al-shelf-track::-webkit-scrollbar-thumb{background:#3db4f24d;border-radius:4px}.al-shelf-track::-webkit-scrollbar-thumb:hover{background:#3db4f299}.al-shelf-card{scroll-snap-align:start;cursor:pointer;background:#121a26d9;border:1px solid #ffffff12;border-radius:12px;flex-direction:column;flex:0 0 175px;width:175px;transition:transform .22s cubic-bezier(.16,1,.3,1),box-shadow .22s,border-color .22s;display:flex;position:relative;overflow:hidden}@media (width<=576px){.al-shelf-card{flex:0 0 170px;width:170px}}.al-shelf-card.al-card-loading{opacity:.65;cursor:wait;pointer-events:none}.al-shelf-card:hover{border-color:#3db4f259;transform:translateY(-4px);box-shadow:0 12px 24px #00000073}.al-shelf-card:hover .al-card-cover img{transform:scale(1.05)}.al-card-cover{aspect-ratio:2/3;background:#090e16;border-radius:12px 12px 0 0;width:100%;position:relative;overflow:hidden}.al-card-cover img{object-fit:cover;width:100%;height:100%;transition:transform .3s;display:block}.al-card-badge-top-left{z-index:3;position:absolute;top:8px;left:8px}.al-card-badge-top-right{z-index:3;position:absolute;top:8px;right:8px}.al-card-al-link{color:#94a3b8;-webkit-backdrop-filter:blur(6px);background:#0a0e16bf;border:1px solid #ffffff26;border-radius:6px;justify-content:center;align-items:center;width:24px;height:24px;text-decoration:none;transition:all .2s;display:flex}.al-card-al-link:hover{background:#02a9ff40;border-color:#02a9ff;transform:scale(1.08);box-shadow:0 0 10px #02a9ff80}.al-card-cover-overlay{z-index:2;background:linear-gradient(#0000 0%,#090e1699 40%,#090e16f2 100%);flex-direction:column;gap:4px;padding:24px 8px 6px;display:flex;position:absolute;bottom:0;left:0;right:0}.al-card-progress-text{color:#e2e8f0;text-shadow:0 1px 3px #000c;justify-content:space-between;align-items:center;font-size:10px;font-weight:700;display:flex}.al-card-progress-bar{background:#ffffff2e;border-radius:2px;width:100%;height:4px;overflow:hidden}.al-card-progress-fill{background:#3db4f2;border-radius:2px;height:100%;transition:width .3s}.al-card-body{background:#0e141e99;flex-direction:column;flex:1;justify-content:space-between;gap:10px;padding:10px 10px 12px;display:flex}.al-card-title{color:#f1f5f9;-webkit-line-clamp:2;text-overflow:ellipsis;-webkit-box-orient:vertical;min-height:34px;font-size:12.5px;font-weight:600;line-height:1.35;text-decoration:none;transition:color .2s;display:-webkit-box;overflow:hidden}.al-card-title:hover{color:#3db4f2}.al-card-actions{width:100%}.al-card-btn{cursor:pointer;border:none;border-radius:6px;justify-content:center;align-items:center;gap:5px;width:100%;min-height:30px;padding:7px 10px;font-size:12px;font-weight:700;text-decoration:none;transition:all .2s;display:flex}.al-card-btn.al-btn-play{color:#fff;background:#3db4f2;box-shadow:0 2px 8px #3db4f24d}.al-card-btn.al-btn-play:hover{color:#fff;background:#2ca5e6;box-shadow:0 4px 14px #3db4f280}.al-card-btn.al-btn-caughtup{color:#4ade80;background:#22c55e1f;border:1px solid #22c55e4d}.al-card-btn.al-btn-caughtup:hover{color:#86efac;background:#22c55e38;border-color:#22c55e80}.al-card-btn.al-btn-secondary{color:#94a3b8;background:#ffffff0d;border:1px solid #ffffff14}.al-card-btn.al-btn-secondary:hover{color:#e2e8f0;background:#ffffff1a}.al-shelf-empty{text-align:center;color:#94a3b8;background:#ffffff05;border:1px dashed #ffffff14;border-radius:10px;flex-direction:column;justify-content:center;align-items:center;gap:12px;padding:36px 16px;display:flex}.al-shelf-empty .al-shelf-empty-icon{color:#475569}.al-shelf-empty .al-shelf-empty-title{color:#cbd5e1;font-size:14px;font-weight:700}.al-shelf-empty .al-shelf-empty-desc{color:#64748b;max-width:360px;font-size:12px;line-height:1.5}.al-shelf-skeleton{aspect-ratio:2/3;background:linear-gradient(90deg,#ffffff08 25%,#ffffff14 50%,#ffffff08 75%) 0 0/200% 100%;border-radius:12px;flex:0 0 175px;width:175px;animation:1.5s infinite al-skeleton-shimmer}@media (width<=576px){.al-shelf-skeleton{flex:0 0 150px;width:150px}}@keyframes al-skeleton-shimmer{0%{background-position:200% 0}to{background-position:-200% 0}}.al-skeleton-pill{background:linear-gradient(90deg,#ffffff0a 25%,#ffffff17 50%,#ffffff0a 75%) 0 0/200% 100%;border-radius:8px;animation:1.5s infinite al-skeleton-shimmer}.al-spin{animation:.8s linear infinite al-spin;display:inline-block}@keyframes al-spin{0%{transform:rotate(0)}to{transform:rotate(360deg)}}.al-agent-candidate{border-radius:8px;transition:all .2s;animation:2s ease-in-out infinite al-candidate-pulse;position:relative;background:#3db4f21f!important;outline:2px solid #3db4f2!important}@keyframes al-candidate-pulse{0%,to{box-shadow:0 0 0 2px #3db4f2b3,0 0 14px #3db4f24d}50%{box-shadow:0 0 0 3px #3db4f2,0 0 22px #3db4f28c}}.al-agent-countdown-badge{box-sizing:border-box;color:#e2e8f0;pointer-events:none;background:#3db4f22e;border:1px solid #3db4f266;border-radius:6px;justify-content:space-between;align-items:center;width:100%;margin-top:6px;padding:4px 10px;font-size:11px;display:flex}.al-agent-countdown-badge strong{color:#3db4f2;font-weight:700}.al-agent-countdown-badge .al-agent-cancel-hint{color:#94a3b8;font-size:10px}.search-backdrop{z-index:99999!important;pointer-events:auto!important;justify-content:center!important;width:100vw!important;height:100vh!important;display:flex!important;position:fixed!important;top:0!important;left:0!important}.search-backdrop.show{opacity:1!important;visibility:visible!important}.search-backdrop .search-container{opacity:1!important;z-index:100000!important;display:block!important}.search-backdrop .results{opacity:1!important;z-index:100001!important;display:block!important}.al-vt-sync-badge{-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);z-index:10;background:#0f172ad9;border-bottom:1px solid #3db4f240;justify-content:center;align-items:center;padding:6px 12px;display:flex}.al-vt-sync-badge .al-vt-inner{background:#1e293bb3;border:1px solid #3db4f24d;border-radius:9999px;align-items:center;gap:10px;padding:3px 10px;display:inline-flex}.al-vt-sync-badge .al-vt-info{color:#e2e8f0;align-items:center;gap:6px;font-size:11px;display:inline-flex}.al-vt-sync-badge .al-vt-info strong{color:#38bdf8;font-weight:700}.al-vt-sync-badge .al-vt-sync-btn{cursor:pointer;background:linear-gradient(135deg,#38bdf8 0%,#0284c7 100%);border:none;border-radius:9999px;align-items:center;gap:4px;padding:2px 8px;font-size:11px;font-weight:800;transition:all .15s;display:inline-flex;color:#06101e!important}.al-vt-sync-badge .al-vt-sync-btn:hover{filter:brightness(1.1);transform:scale(1.04)}video-player,.video-player{z-index:25;position:relative}.overview>.row:has(#al-control-bar){z-index:25;position:relative}#al-control-bar{z-index:30!important;position:relative!important}#al-control-bar.has-open-popover{z-index:99999!important}.al-elevated-stack{z-index:99999!important;position:relative!important}.al-buddy-btn{color:#e2e8f0;cursor:pointer;box-sizing:border-box;background:#0e1622d9;border:1px solid #ffffff29;border-radius:9px;outline:none;align-items:center;gap:7px;height:36px;padding:0 12px 0 10px;transition:all .2s cubic-bezier(.4,0,.2,1);display:inline-flex}.al-buddy-btn:hover{background:#142032f2;border-color:#38bdf8;box-shadow:0 0 12px #3db4f240}.al-buddy-btn.is-active{background:#0e1a2af2;border-color:#3db4f280;padding:0 10px 0 6px}.al-buddy-btn.is-active:hover{border-color:#38bdf8;box-shadow:0 0 14px #3db4f259}.al-buddy-btn .al-buddy-avatar-chip{object-fit:cover;border:1.5px solid #38bdf8;border-radius:50%;flex-shrink:0;width:22px;height:22px}.al-buddy-btn .al-buddy-name-chip{color:#38bdf8;text-overflow:ellipsis;white-space:nowrap;max-width:105px;font-size:12px;font-weight:700;overflow:hidden}.al-buddy-btn .al-buddy-icon{color:#94a3b8;flex-shrink:0}.al-buddy-btn .al-buddy-label{color:#cbd5e1;font-size:13px;font-weight:600}.al-buddy-btn .al-buddy-chevron{color:#94a3b8;flex-shrink:0;transition:transform .2s}.al-buddy-picker-wrap,.al-buddy-box{display:inline-block;position:relative}.al-buddy-picker-wrap .al-buddy-popover,.al-buddy-box .al-buddy-popover{-webkit-backdrop-filter:blur(24px);box-sizing:border-box;border:1px solid #3db4f259;border-radius:12px;width:280px;padding:8px;position:absolute;top:calc(100% + 6px);right:0;box-shadow:0 20px 50px #000000f2,0 0 20px #3db4f233;z-index:999999!important;background:#0d1624!important}@media (width<=576px){.al-buddy-picker-wrap .al-buddy-popover,.al-buddy-box .al-buddy-popover{width:min(290px,100vw - 32px);right:-10px}}.al-buddy-pop-search-box{background:#ffffff0f;border:1px solid #ffffff24;border-radius:8px;align-items:center;gap:8px;margin-bottom:6px;padding:7px 10px;transition:all .2s;display:flex}.al-buddy-pop-search-box:focus-within{background:#ffffff17;border-color:#38bdf8;box-shadow:0 0 10px #38bdf840}.al-buddy-pop-search-box .al-buddy-search-icon{color:#94a3b8;flex-shrink:0}.al-buddy-pop-search-box .al-buddy-search-input{width:100%;color:#f8fafc!important;box-shadow:none!important;background:0 0!important;border:none!important;outline:none!important;padding:0!important;font-size:12.5px!important;font-weight:500!important}.al-buddy-pop-search-box .al-buddy-search-input::placeholder{color:#64748b}.al-buddy-pop-options{flex-direction:column;gap:2px;max-height:220px;display:flex;overflow-y:auto}.al-buddy-pop-options::-webkit-scrollbar{width:4px}.al-buddy-pop-options::-webkit-scrollbar-thumb{background:#3db4f24d;border-radius:4px}.al-buddy-pop-options .al-buddy-loading,.al-buddy-pop-options .al-buddy-empty{color:#94a3b8;text-align:center;padding:14px;font-size:12px}.al-buddy-pop-options .al-buddy-option{cursor:pointer;text-align:left;box-sizing:border-box;background:0 0;border:1px solid #0000;border-radius:8px;align-items:center;gap:9px;width:100%;padding:7px 9px;transition:all .15s;display:flex}.al-buddy-pop-options .al-buddy-option:hover{background:#38bdf81f;border-color:#38bdf840}.al-buddy-pop-options .al-buddy-option.selected{background:#38bdf82e;border-color:#38bdf866}.al-buddy-pop-options .al-buddy-option.selected .al-buddy-opt-name{color:#38bdf8;font-weight:700}.al-buddy-pop-options .al-buddy-option .al-buddy-opt-avatar{object-fit:cover;border:1px solid #3db4f259;border-radius:50%;flex-shrink:0;width:24px;height:24px}.al-buddy-pop-options .al-buddy-option .al-buddy-opt-name{color:#e2e8f0;text-overflow:ellipsis;white-space:nowrap;flex:1;font-size:12.5px;font-weight:600;overflow:hidden}.al-buddy-pop-options .al-buddy-option .al-buddy-opt-badge{color:#38bdf8;text-transform:uppercase;letter-spacing:.3px;background:#38bdf82e;border-radius:4px;padding:2px 6px;font-size:9px;font-weight:800}.al-buddy-pop-options .al-buddy-option .al-buddy-opt-check{color:#38bdf8;flex-shrink:0}.al-buddy-pop-footer{border-top:1px solid #ffffff14;margin-top:6px;padding-top:6px}.al-buddy-pop-footer .al-buddy-pop-remove{color:#ef4444;cursor:pointer;background:#ef444414;border:1px solid #ef444440;border-radius:8px;justify-content:center;align-items:center;gap:6px;width:100%;padding:6px;font-size:11.5px;font-weight:600;transition:all .15s;display:flex}.al-buddy-pop-footer .al-buddy-pop-remove:hover{color:#fff;background:#ef444433;border-color:#ef4444}.al-card-buddy-overlay{z-index:3;-webkit-backdrop-filter:blur(10px);box-sizing:border-box;background:#0a101ad9;border:1px solid #38bdf866;border-radius:9999px;justify-content:space-between;align-items:center;gap:6px;padding:3px 8px 3px 4px;display:flex;position:absolute;top:38px;left:8px;right:8px;box-shadow:0 4px 12px #00000080}.al-card-buddy-overlay .al-card-buddy-left{flex:1;align-items:center;gap:6px;min-width:0;display:flex;overflow:hidden}.al-card-buddy-overlay .al-card-buddy-avatar{object-fit:cover!important;border:1.5px solid #38bdf8!important;border-radius:50%!important;flex-shrink:0!important;width:20px!important;min-width:20px!important;max-width:20px!important;height:20px!important;min-height:20px!important;max-height:20px!important;display:block!important}.al-card-buddy-overlay .al-card-buddy-name{color:#38bdf8;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;font-size:11px;font-weight:700;overflow:hidden}.al-card-buddy-overlay .al-card-buddy-status{color:#f1f5f9;white-space:nowrap;background:#ffffff1f;border-radius:9999px;flex-shrink:0;margin-left:auto;padding:1.5px 6px;font-size:10px;font-weight:800}.al-btn-buddy-sync{cursor:pointer;box-sizing:border-box;border:none;justify-content:center;align-items:center;gap:5px;width:100%;margin-bottom:6px;transition:all .15s;display:flex;box-shadow:0 0 10px #3db4f240;color:#06101e!important;background:linear-gradient(135deg,#3db4f2 0%,#0284c7 100%)!important;border-radius:6px!important;padding:5px 8px!important;font-size:11px!important;font-weight:800!important}.al-btn-buddy-sync:hover{filter:brightness(1.15);transform:translateY(-1px);box-shadow:0 0 12px #3db4f273}.al-btn-buddy-sync:active{transform:translateY(0)}.al-buddy-picker-wrap{align-items:center;gap:6px;display:inline-flex;position:relative}.al-pref-collapsible .al-pref-header{justify-content:space-between;align-items:center;display:flex}.al-pref-collapsible .al-pref-title-click{cursor:pointer;-webkit-user-select:none;user-select:none;flex:1;align-items:center;gap:8px;display:flex}.al-pref-collapsible .al-pref-title-click .al-pref-chevron{color:#94a3b8;justify-content:center;align-items:center;transition:transform .2s;display:inline-flex}.al-pref-collapsible:not(.is-open) .al-pref-title-click .al-pref-chevron{transform:rotate(-90deg)}.al-pref-collapsible:not(.is-open) .al-pref-sub{display:none!important}.al-pref-collapsible.is-open .al-pref-title-click .al-pref-chevron{transform:rotate(0)}.al-prefs-modal .al-pref-group,.al-prefs-modal .al-pref-group .al-pref-sub{overflow:visible!important}.al-prefs-modal .al-buddy-box{align-items:center;display:flex}.al-prefs-modal .al-buddy-box .al-buddy-btn{height:34px;padding:0 10px 0 6px;font-size:12.5px}.al-prefs-modal .al-buddy-box .al-buddy-btn .al-buddy-avatar-chip{width:22px;height:22px}#au-skip-intro-btn{display:none;z-index:2147483647!important;-webkit-backdrop-filter:blur(8px)!important;color:#fff!important;cursor:pointer!important;-webkit-user-select:none!important;user-select:none!important;pointer-events:auto!important;background:#0a101aeb!important;border:1.5px solid #3db4f2!important;border-radius:8px!important;align-items:center!important;gap:6px!important;padding:8px 16px!important;font-family:inherit!important;font-size:13px!important;font-weight:800!important;transition:transform .15s,background .15s,color .15s!important;position:absolute!important;bottom:56px!important;right:20px!important;box-shadow:0 4px 16px #0009,0 0 12px #3db4f266!important}#au-skip-intro-btn:hover{color:#06101e!important;background:#3db4f2!important;transform:scale(1.04)!important}#au-skip-intro-btn:active{transform:scale(.98)!important}.al-nav-saturn{align-items:center;margin-right:8px;display:inline-flex;position:relative}.al-nav-saturn .al-saturn-nav-avatar{transition:transform .15s}.al-nav-saturn .al-saturn-nav-avatar:hover{transform:scale(1.08)}.al-nav-saturn .al-dropdown-menu{z-index:99999;position:absolute;top:calc(100% + 10px);left:auto;right:0}.ep-tile.al-done{color:#93c5fd!important;background-color:#3db4f226!important;border-color:#3db4f266!important}.ep-tile.al-done .ep-seen{opacity:1!important;color:#3db4f2!important;display:inline-flex!important}.ep-tile.al-current{border-color:#3db4f2!important;box-shadow:0 0 10px #3db4f273!important}.al-btn-pref-action{color:#cbd5e1;cursor:pointer;background:#ffffff0f;border:1px solid #ffffff26;border-radius:6px;align-items:center;gap:5px;padding:4px 10px;font-size:11.5px;font-weight:700;transition:all .2s;display:inline-flex}.al-btn-pref-action.danger{color:#f87171;background:#ef44441f;border-color:#ef44444d}.al-btn-pref-action.danger:hover{color:#fff;background:#ef444440;border-color:#ef4444;box-shadow:0 0 10px #ef44444d}.al-cross-switch-btn{color:#38bdf8;cursor:pointer;white-space:nowrap;-webkit-backdrop-filter:blur(10px);-webkit-user-select:none;user-select:none;background:#0e1622d9;border:1px solid #3db4f259;border-radius:8px;align-items:center;gap:6px;padding:4px 10px;font-size:11.5px;font-weight:700;text-decoration:none;transition:all .2s cubic-bezier(.16,1,.3,1);display:inline-flex;box-shadow:0 2px 8px #0000004d}.al-cross-switch-btn .al-switch-icon{color:#38bdf8;align-items:center;display:inline-flex}.al-cross-switch-btn .al-switch-label{color:#f1f5f9}.al-cross-switch-btn .al-switch-ep{color:#38bdf8;background:#3db4f233;border-radius:5px;padding:1px 6px;font-size:10px;font-weight:800}.al-cross-switch-btn .al-switch-ext{opacity:.7;transition:transform .2s,opacity .2s}.al-cross-switch-btn:hover{color:#fff;background:linear-gradient(135deg,#3db4f240,#0284c759);border-color:#3db4f2;transform:translateY(-1px);box-shadow:0 0 14px #3db4f273}.al-cross-switch-btn:hover .al-switch-ext{opacity:1;transform:translate(1px,-1px)}.al-cross-switch-btn:active{transform:translateY(0)}.al-cross-switch-btn.is-loading{opacity:.75;pointer-events:none}.al-cross-switch-btn.for-saturn{color:#c084fc;background:#9333ea29;border:1px solid #a855f773;box-shadow:0 0 10px #a855f733}.al-cross-switch-btn.for-saturn .al-switch-icon{color:#c084fc}.al-cross-switch-btn.for-saturn .al-switch-label{color:#f3e8ff}.al-cross-switch-btn.for-saturn .al-switch-ep{color:#f3e8ff;background:#a855f740}.al-cross-switch-btn.for-saturn .al-switch-ext{color:#c084fc}.al-cross-switch-btn.for-saturn:hover{color:#fff;background:linear-gradient(135deg,#a855f752,#7e22ce73);border-color:#c084fc;transform:translateY(-1px);box-shadow:0 0 18px #a855f78c}.al-cross-switch-btn.for-unity{color:#38bdf8;background:#0284c729;border:1px solid #38bdf873;margin-left:6px;box-shadow:0 0 10px #38bdf833}.al-cross-switch-btn.for-unity .al-switch-icon{color:#38bdf8}.al-cross-switch-btn.for-unity .al-switch-label{color:#f0f9ff}.al-cross-switch-btn.for-unity .al-switch-ep{color:#e0f2fe;background:#38bdf840}.al-cross-switch-btn.for-unity .al-switch-ext{color:#38bdf8}.al-cross-switch-btn.for-unity:hover{color:#fff;background:linear-gradient(135deg,#38bdf852,#0284c773);border-color:#38bdf8;transform:translateY(-1px);box-shadow:0 0 18px #38bdf88c}#video-top{position:relative!important}#video-top .al-cross-switch-btn.for-saturn{z-index:5;margin:0;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}#video-top .al-cross-switch-btn.for-saturn:hover{transform:translate(-50%,calc(-50% - 1px))}#video-top .al-cross-switch-btn.for-saturn:active{transform:translate(-50%,-50%)}@media (width<=576px){#video-top .al-cross-switch-btn.for-saturn{margin-left:auto;position:static;transform:none}#video-top .al-cross-switch-btn.for-saturn:hover{transform:translateY(-1px)}#video-top .al-cross-switch-btn.for-saturn:active{transform:translateY(0)}}");
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
	if (typeof window !== "undefined" && window.self === window.top && !window.__AU_LOGGER_INIT__) {
		window.__AU_LOGGER_INIT__ = true;
		window.addEventListener("message", (e) => {
			if (e.data?.type === "AU_LOG_BRIDGE") {
				const { prefix, level, msg, data } = e.data;
				const tag = `%c${prefix}%c`;
				const tagStyle = "color: #38bdf8; font-weight: bold;";
				const resetStyle = "color: inherit;";
				if (level === "error") console.error(tag, tagStyle, resetStyle, msg, data !== void 0 ? data : "");
				else if (level === "warn") console.warn(tag, tagStyle, resetStyle, msg, data !== void 0 ? data : "");
				else console.log(tag, tagStyle, resetStyle, msg, data !== void 0 ? data : "");
			}
		});
	}
	function createLogger(prefix = "[AU]") {
		const isTop = typeof window !== "undefined" ? window.self === window.top : true;
		function logMessage(level, msg, data) {
			if (isTop) {
				const tag = `%c${prefix}%c`;
				const tagStyle = "color: #38bdf8; font-weight: bold;";
				const resetStyle = "color: inherit;";
				if (level === "error") console.error(tag, tagStyle, resetStyle, msg, data !== void 0 ? data : "");
				else if (level === "warn") console.warn(tag, tagStyle, resetStyle, msg, data !== void 0 ? data : "");
				else console.log(tag, tagStyle, resetStyle, msg, data !== void 0 ? data : "");
			} else try {
				window.top.postMessage({
					type: "AU_LOG_BRIDGE",
					prefix,
					level,
					msg,
					data: typeof data === "object" ? JSON.parse(JSON.stringify(data)) : data
				}, "*");
			} catch (_) {}
		}
		return {
			info: (msg, data) => logMessage("info", msg, data),
			warn: (msg, data) => logMessage("warn", msg, data),
			error: (msg, data) => logMessage("error", msg, data)
		};
	}
	var Logger = createLogger("[AU-Sync]");
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
					}),
					keepalive: true
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
		getMedia: (search) => AniListAPI.call(`query($s:String){Media(search:$s,type:ANIME){id idMal episodes format status title{romaji english userPreferred}mediaListEntry{id status score progress notes repeat startedAt{year month day}completedAt{year month day}}}}`, { s: search }, { silent: true }),
		searchMedia: (search) => AniListAPI.call(`query($s:String){Page(page:1,perPage:5){media(search:$s,type:ANIME,sort:SEARCH_MATCH){id idMal episodes format status title{romaji english userPreferred}mediaListEntry{id status score progress notes repeat startedAt{year month day}completedAt{year month day}}}}}`, { s: search }, { silent: true }),
		getMediaById: (id) => AniListAPI.call(`query($id:Int){Media(id:$id,type:ANIME){id idMal episodes format status title{romaji english userPreferred}mediaListEntry{id status score progress notes repeat startedAt{year month day}completedAt{year month day}}}}`, { id: Number(id) }, { silent: true }),
		getMediaByMalId: (idMal) => AniListAPI.call(`query($id:Int){Media(idMal:$id,type:ANIME){id idMal episodes format status title{romaji english userPreferred}mediaListEntry{id status score progress notes repeat startedAt{year month day}completedAt{year month day}}}}`, { id: Number(idMal) }, { silent: true }),
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
	var ExternalLink = [
		["path", { d: "M15 3h6v6" }],
		["path", { d: "M10 14 21 3" }],
		["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }]
	];
	var FastForward = [["path", { d: "M12 6a2 2 0 0 1 3.414-1.414l6 6a2 2 0 0 1 0 2.828l-6 6A2 2 0 0 1 12 18z" }], ["path", { d: "M2 6a2 2 0 0 1 3.414-1.414l6 6a2 2 0 0 1 0 2.828l-6 6A2 2 0 0 1 2 18z" }]];
	var Globe = [
		["circle", {
			cx: "12",
			cy: "12",
			r: "10"
		}],
		["path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }],
		["path", { d: "M2 12h20" }]
	];
	var KeyRound = [["path", { d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" }], ["circle", {
		cx: "16.5",
		cy: "7.5",
		r: ".5",
		fill: "currentColor"
	}]];
	var Languages = [
		["path", { d: "m5 8 6 6" }],
		["path", { d: "m4 14 6-6 2-3" }],
		["path", { d: "M2 5h12" }],
		["path", { d: "M7 2h1" }],
		["path", { d: "m22 22-5-10-5 10" }],
		["path", { d: "M14 18h6" }]
	];
	var Link = [["path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }], ["path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" }]];
	var LoaderCircle = [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }]];
	var LogOut = [
		["path", { d: "m16 17 5-5-5-5" }],
		["path", { d: "M21 12H9" }],
		["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }]
	];
	var Play = [["path", { d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" }]];
	var Plus = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
	var RotateCcw = [["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }], ["path", { d: "M3 3v5h5" }]];
	var Search = [["path", { d: "m21 21-4.34-4.34" }], ["circle", {
		cx: "11",
		cy: "11",
		r: "8"
	}]];
	var SkipForward = [["path", { d: "M21 4v16" }], ["path", { d: "M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z" }]];
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
	var Tv = [["path", { d: "m17 2-5 5-5-5" }], ["rect", {
		width: "20",
		height: "15",
		x: "2",
		y: "7",
		rx: "2"
	}]];
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
	function createModal({ id = "al-modal-overlay", className = "", variant = "modal", icon = null, title = "", subtitle = "", body = "", actions = [], onClose = null } = {}) {
		document.getElementById(id)?.remove();
		const isDrawer = variant === "drawer";
		const overlay = document.createElement("div");
		overlay.id = id;
		overlay.className = `al-overlay ${isDrawer ? "al-overlay-drawer" : ""}`.trim();
		overlay.style.cssText = isDrawer ? "position:fixed!important;top:0!important;left:0!important;right:0!important;bottom:0!important;width:100vw!important;height:100vh!important;height:100dvh!important;z-index:2147483647!important;display:flex!important;align-items:stretch!important;justify-content:flex-end!important;margin:0!important;padding:0!important;box-sizing:border-box!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;" : "position:fixed!important;top:0!important;left:0!important;right:0!important;bottom:0!important;width:100vw!important;height:100vh!important;height:100dvh!important;z-index:2147483647!important;display:flex!important;align-items:center!important;justify-content:center!important;margin:0!important;padding:16px!important;box-sizing:border-box!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;";
		const modal = document.createElement("div");
		modal.className = `al-modal ${isDrawer ? "al-drawer" : ""} ${className}`.trim();
		modal.style.cssText = "position:relative!important;z-index:2147483647!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;";
		const header = document.createElement("div");
		header.className = "al-modal-header";
		header.innerHTML = `
    <div class="al-modal-header-left">
      ${icon ? `<div class="al-modal-icon">${iconHtml(icon, {
			width: 22,
			height: 22
		})}</div>` : ""}
      <div>
        <h3 class="al-modal-title">${title}</h3>
        ${subtitle ? `<p class="al-modal-subtitle">${subtitle}</p>` : ""}
      </div>
    </div>
    <button type="button" class="al-modal-close-btn" aria-label="Close dialog">
      ${iconHtml(X, {
			width: 18,
			height: 18
		})}
    </button>
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
		header.querySelector(".al-modal-close-btn")?.addEventListener("click", (e) => {
			e.stopPropagation();
			close();
		});
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
	function cleanTitle$1(title) {
		if (!title) return "";
		return title.replace(/\s*\((ITA|SUB|SUB ITA|DUB|ITA SUB|OVA|TV)\)/gi, "").replace(/\s+(ITA|SUB|DUB)$/gi, "").replace(/\[[^\]]+\]/g, "").trim();
	}
	function extractSeason(title) {
		if (!title) return 1;
		const t = title.toLowerCase();
		const seasonMatch = t.match(/\b(?:season|stagione)\s*(\d+)\b/i) || t.match(/\b(\d+)(?:st|nd|rd|th)\s+season\b/i);
		if (seasonMatch) return parseInt(seasonMatch[1], 10);
		if (/\b(?:second\s+season|2nd\s+season)\b/i.test(t)) return 2;
		if (/\b(?:third\s+season|3rd\s+season)\b/i.test(t)) return 3;
		if (/\b(?:fourth\s+season|4th\s+season)\b/i.test(t)) return 4;
		if (/\b(?:final\s+season)\b/i.test(t)) return 4;
		if (/\bii\b/i.test(t)) return 2;
		if (/\biii\b/i.test(t)) return 3;
		if (/\biv\b/i.test(t)) return 4;
		const seasonBeforePart = t.match(/\b(\d+)\s+(?:part|parte)\s+\d+\b/i);
		if (seasonBeforePart) return parseInt(seasonBeforePart[1], 10);
		const partMatch = t.match(/\b(?:part|parte)\s*(\d+)\b/i);
		if (partMatch) return parseInt(partMatch[1], 10);
		const trailingMatch = t.replace(/\s*\((?:ita|sub|dub|sub ita)\)/gi, "").trim().match(/(?:^|\s+)(\d+)$/);
		if (trailingMatch) {
			const n = parseInt(trailingMatch[1], 10);
			if (n > 0 && n <= 20) return n;
		}
		return 1;
	}
	function scoreSearchResult(result, media, isDubPref = false) {
		if (!result || !media) return -999;
		let score = 0;
		const rTitle = result.title || result.title_eng || "";
		const rUrl = result.url || result.slug || "";
		const isDub = result.dub === 1 || rTitle.includes("(ITA)") || rUrl.includes("-ita-") || rUrl.endsWith("-ita");
		if (isDubPref) {
			if (isDub) score += 30;
			else score -= 20;
		} else if (!isDub) score += 30;
		else score -= 20;
		let anilistId = result.anilist_id;
		if (!anilistId && result.poster) {
			const m = String(result.poster).match(/\/bx?(\d+)[-_.]/i);
			if (m && m[1]) anilistId = parseInt(m[1], 10);
		}
		if (anilistId && anilistId === media.id) score += 200;
		const mediaTitle = media.title?.romaji || media.title?.english || media.title?.userPreferred || "";
		if (extractSeason(mediaTitle) === extractSeason(rTitle)) score += 100;
		else score -= 100;
		const lowMedia = mediaTitle.toLowerCase();
		const lowRes = rTitle.toLowerCase();
		for (const sub of [
			"steel ball run",
			"stone ocean",
			"vento aureo",
			"diamond is unbreakable",
			"stardust crusaders",
			"phantom blood",
			"battle tendency"
		]) if (lowMedia.includes(sub) !== lowRes.includes(sub)) score -= 150;
		for (const word of [
			"quest",
			"picture drama",
			"recap",
			"special",
			"drama cd"
		]) if (lowRes.includes(word) && !lowMedia.includes(word)) score -= 100;
		const rEps = parseInt(result.episodes || result.episodes_count, 10);
		if (media.episodes && !isNaN(rEps) && rEps > 0) {
			if (rEps === media.episodes) score += 35;
			else if (Math.abs(rEps - media.episodes) <= 2) score += 15;
		}
		const targetYear = media.seasonYear || media.startDate?.year;
		const rYear = parseInt(result.year || result.date, 10);
		if (targetYear && !isNaN(rYear) && rYear > 0) {
			if (rYear === targetYear) score += 25;
			else if (Math.abs(rYear - targetYear) <= 1) score += 10;
		}
		const rType = (result.type || "").toUpperCase();
		if (media.format && rType) {
			if (media.format === rType) score += 20;
			else if (media.format === "TV" && (rType === "OVA" || rType === "MOVIE" || rType === "SPECIAL")) score -= 50;
		}
		return score;
	}
	function generateSearchCandidates$1(media) {
		if (!media) return [];
		const candidates = [];
		const rom = media.title?.romaji;
		const eng = media.title?.english;
		const pref = media.title?.userPreferred;
		for (const raw of [
			rom,
			eng,
			pref
		]) {
			if (!raw) continue;
			const clean = cleanTitle$1(raw);
			if (clean && clean.length >= 3) candidates.push(clean);
			const season = extractSeason(raw);
			if (season > 1) {
				const baseName = clean.replace(/\b(?:second|third|fourth|\d+(?:st|nd|rd|th)?)\s+season\b/gi, "").replace(/\s+part\s+\d+/gi, "").trim();
				if (baseName && baseName.length >= 3) candidates.push(`${baseName} ${season}`);
			}
			const parts = raw.split(/[:\-\(\)]+/).map((p) => cleanTitle$1(p.trim())).filter((p) => p.length >= 3);
			candidates.push(...parts);
			const noSeason = clean.split(/\b(?:\d+th|1st|2nd|3rd|\d+)\s+season\b/i)[0].trim();
			if (noSeason && noSeason.length >= 3) candidates.push(noSeason);
			const words = clean.split(/\s+/).slice(0, 3).join(" ").trim();
			if (words.length >= 3) candidates.push(words);
		}
		return [...new Set(candidates.filter((c) => c && c.length >= 3))];
	}
	var BaseProvider = class {
		constructor(name) {
			this.name = name;
		}
		isHome() {
			return false;
		}
		isAnimePage() {
			return false;
		}
		isWatchPage() {
			return false;
		}
		getAnimeInfo() {
			return {
				title: null,
				romajiTitle: null,
				anilistId: null,
				malId: null,
				currentEp: null,
				totalEp: null
			};
		}
		getShelfAnchor() {
			return null;
		}
		getNavAnchor() {
			return null;
		}
		getActionsAnchor() {
			return null;
		}
		getVideoBottomAnchor() {
			return null;
		}
		highlightEpisodes(trackedProgress) {}
		getActiveEpisode() {
			return null;
		}
		async resolveTargetUrl(media, targetEp = 1) {
			return null;
		}
	};
	function getAnimeKey(pathname = window.location.pathname) {
		const m = pathname.match(/\/anime\/(\d+)/i);
		return m ? m[1] : null;
	}
	var inFlightFetches = new Set();
	function getAnimeMetadata(customKey, { onResolved } = {}) {
		const animeKey = customKey || getAnimeKey();
		if (!animeKey) return {
			malId: null,
			anilistId: null,
			title: null
		};
		let malId = null;
		let anilistId = null;
		let title = null;
		try {
			const rawMal = sessionStorage.getItem("au_mal_" + animeKey);
			if (rawMal) malId = parseInt(rawMal, 10) || null;
			const rawAl = sessionStorage.getItem("au_al_" + animeKey);
			if (rawAl) anilistId = parseInt(rawAl, 10) || null;
		} catch (_) {}
		if (malId && anilistId) return {
			malId,
			anilistId,
			title
		};
		try {
			const raw = document.querySelector("video-player[anime], [anime]")?.getAttribute("anime");
			if (raw) {
				const obj = JSON.parse(raw);
				if (obj.mal_id && !malId) {
					malId = parseInt(obj.mal_id, 10);
					try {
						sessionStorage.setItem("au_mal_" + animeKey, String(malId));
					} catch (_) {}
				}
				if (obj.anilist_id && !anilistId) {
					anilistId = parseInt(obj.anilist_id, 10);
					try {
						sessionStorage.setItem("au_al_" + animeKey, String(anilistId));
					} catch (_) {}
				}
				if (obj.title) title = obj.title;
			}
		} catch (_) {}
		if (!anilistId) try {
			const m = `${document.querySelector("meta[property=\"og:image\"]")?.content || ""} ${document.querySelector(".cover-wrap img.cover, img.cover")?.src || ""}`.match(/\/b[x]?(\d+)[-_]/i);
			if (m && m[1]) {
				anilistId = parseInt(m[1], 10);
				try {
					sessionStorage.setItem("au_al_" + animeKey, String(anilistId));
				} catch (_) {}
			}
		} catch (_) {}
		if ((!malId || !anilistId) && !inFlightFetches.has(animeKey)) {
			inFlightFetches.add(animeKey);
			fetchBackgroundMetadata(animeKey).then((resolved) => {
				inFlightFetches.delete(animeKey);
				if (resolved && typeof onResolved === "function") onResolved(resolved);
			}).catch(() => {
				inFlightFetches.delete(animeKey);
			});
		}
		return {
			malId,
			anilistId,
			title
		};
	}
	async function fetchBackgroundMetadata(animeKey) {
		try {
			const res = await fetch(`/anime/${animeKey}`);
			if (!res.ok) return null;
			const html = await res.text();
			let malId = null;
			let anilistId = null;
			const mMal = html.match(/(?:&quot;|")mal_id(?:&quot;|")\s*:\s*(\d+)/);
			if (mMal && mMal[1]) {
				malId = parseInt(mMal[1], 10);
				try {
					sessionStorage.setItem("au_mal_" + animeKey, String(malId));
				} catch (_) {}
			}
			const mAl = html.match(/(?:&quot;|")anilist_id(?:&quot;|")\s*:\s*(\d+)/);
			if (mAl && mAl[1]) {
				anilistId = parseInt(mAl[1], 10);
				try {
					sessionStorage.setItem("au_al_" + animeKey, String(anilistId));
				} catch (_) {}
			}
			const mEps = html.match(/episodes="(\[{.*?\}\])"/);
			if (mEps && mEps[1]) {
				const raw = mEps[1].replace(/&quot;/g, "\"");
				try {
					sessionStorage.setItem("au_eps_" + animeKey, raw);
				} catch (_) {}
			}
			return {
				malId,
				anilistId
			};
		} catch (_) {
			return null;
		}
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
	var lastAutoSelectedKey = "";
	function autoSelectTargetEpisode(media, trackedProgress, retryCount = 0) {
		const targetStr = new URLSearchParams(window.location.search).get("ep") || sessionStorage.getItem("al_target_ep");
		let targetEp = 0;
		if (targetStr) targetEp = parseInt(targetStr, 10);
		if (!targetEp || isNaN(targetEp) || targetEp <= 0) return;
		const currentKey = `${window.location.pathname}_ep${targetEp}`;
		if (lastAutoSelectedKey === currentKey && retryCount === 0) return;
		sessionStorage.removeItem("al_target_ep");
		const playerVue = document.querySelector("video-player")?.__vue__ || document.querySelector(".episode-wrapper")?.__vue__;
		if (playerVue && Array.isArray(playerVue.episodes) && playerVue.episodes.length > 0) {
			const epObj = playerVue.episodes.find((e) => parseInt(e.number, 10) === targetEp);
			if (epObj) {
				lastAutoSelectedKey = currentKey;
				if (Array.isArray(playerVue.episodes_tabs) && playerVue.episodes_tabs.length > 0) {
					const targetTab = playerVue.episodes_tabs.find((tab) => tab.episodes?.some((e) => e.id === epObj.id));
					if (targetTab && playerVue.episode_tab !== targetTab && typeof playerVue.switchTab === "function") playerVue.switchTab(targetTab);
				}
				if (typeof playerVue.switchEpisode === "function") {
					if (parseInt(playerVue.episode?.number, 10) !== targetEp) playerVue.switchEpisode(epObj);
				}
				setTimeout(() => {
					const activeItem = document.querySelector(".episode-wrapper .episode-item.active");
					const wrapper = activeItem?.closest(".episode-wrapper");
					if (activeItem && wrapper && wrapper.scrollWidth > wrapper.clientWidth) wrapper.scrollTo({
						left: activeItem.offsetLeft - wrapper.clientWidth / 2 + activeItem.clientWidth / 2,
						behavior: "smooth"
					});
				}, 100);
				return;
			}
		}
		if (retryCount < 10) {
			setTimeout(() => {
				autoSelectTargetEpisode(media, trackedProgress, retryCount + 1);
			}, 150);
			return;
		}
		lastAutoSelectedKey = currentKey;
		const items = document.querySelectorAll(".episode-wrapper .episode-item");
		if (items.length > 0) {
			for (const item of items) if (parseInt(item.innerText.trim(), 10) === targetEp) {
				if (!item.classList.contains("active")) (item.querySelector("a") || item).click();
				const wrapper = item.closest(".episode-wrapper");
				if (wrapper && wrapper.scrollWidth > wrapper.clientWidth) wrapper.scrollTo({
					left: item.offsetLeft - wrapper.clientWidth / 2 + item.clientWidth / 2,
					behavior: "smooth"
				});
				break;
			}
		}
	}
	var AnimeUnityProvider = class extends BaseProvider {
		constructor() {
			super("AnimeUnity");
		}
		isHome() {
			const p = window.location.pathname;
			return p === "/" || p === "/home" || p === "";
		}
		isAnimePage() {
			return /\/anime\/\d+/i.test(window.location.pathname);
		}
		isWatchPage() {
			return /\/anime\/\d+[^/]*\/\d+/i.test(window.location.pathname);
		}
		getAnimeInfo() {
			const { malId, anilistId, title: metaTitle } = getAnimeMetadata();
			const domTitle = document.querySelector("#anime .title, h1.title")?.innerText?.trim() || "";
			const title = metaTitle || domTitle;
			return {
				title,
				romajiTitle: title,
				anilistId,
				malId,
				currentEp: this.getActiveEpisode(),
				totalEp: document.querySelectorAll(".episode-wrapper .episode-item").length || null
			};
		}
		getActiveEpisode() {
			return getActiveEpisode();
		}
		getShelfAnchor() {
			const topBarRow = document.querySelector("#home .bar-link")?.closest(".row");
			if (topBarRow) return {
				element: topBarRow,
				position: "after"
			};
			const ultimiRow = document.querySelector("#ultimi-episodi")?.closest(".row");
			if (ultimiRow) return {
				element: ultimiRow,
				position: "before"
			};
			const container = document.querySelector("#home > .container, .container");
			if (container) return {
				element: container,
				position: "prepend"
			};
			return null;
		}
		getNavAnchor() {
			return {
				desktop: document.getElementById("left-nav") || document.querySelector("nav.navbar .navbar-nav, .nav-left"),
				mobile: document.querySelector(".nav-top-mobile")
			};
		}
		getActionsAnchor() {
			const epWrapper = document.querySelector(".episode-wrapper");
			if (epWrapper) return {
				element: epWrapper,
				position: "before"
			};
			const overview = document.querySelector(".overview, .content .overview");
			if (overview) return {
				element: overview,
				position: "append"
			};
			return null;
		}
		getVideoBottomAnchor() {
			return document.getElementById("video-bottom");
		}
		highlightEpisodes(trackedProgress) {
			if (trackedProgress === void 0 || trackedProgress === null) return;
			const items = document.querySelectorAll(".episode-wrapper .episode-item");
			const activeEp = this.getActiveEpisode();
			items.forEach((item) => {
				const epNum = parseInt(item.innerText.trim(), 10);
				if (isNaN(epNum)) return;
				const isDone = epNum <= trackedProgress;
				const isCurrent = epNum === activeEp;
				item.classList.toggle("al-done", isDone);
				item.classList.toggle("al-current", isCurrent);
			});
		}
		async resolveTargetUrl(media, targetEp = 1) {
			if (!media?.id) return null;
			const prefDubInt = (Storage.get("al_pref_language") || "sub") === "dub" ? 1 : 0;
			const rawMap = Storage.get("al_au_map");
			const map = rawMap && typeof rawMap === "object" && !Array.isArray(rawMap) ? rawMap : {};
			const cached = map[media.id];
			if (cached?.id && cached?.slug) {
				const mediaSeason = extractSeason(media.title?.romaji || media.title?.english || media.title?.userPreferred || "");
				const cachedSeason = cached.title ? extractSeason(cached.title) : null;
				if ((cachedSeason === null || cachedSeason === mediaSeason) && (cached.dub === void 0 || cached.dub === prefDubInt || cached.hasAlternativeDub === false)) return `/anime/${cached.id}-${cached.slug}?ep=${targetEp}`;
			}
			const csrf = document.querySelector("meta[name=\"csrf-token\"]")?.content;
			const candidates = generateSearchCandidates$1(media);
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
				let chosen = null;
				if (matches.length > 0) chosen = matches.find((r) => r.dub === 1 === (prefDubInt === 1)) || matches[0];
				else {
					const scored = records.map((r) => ({
						record: r,
						score: scoreSearchResult(r, media, prefDubInt === 1)
					})).sort((a, b) => b.score - a.score);
					if (scored[0] && scored[0].score >= 50) chosen = scored[0].record;
				}
				if (chosen?.id && chosen?.slug) {
					map[media.id] = {
						id: chosen.id,
						slug: chosen.slug,
						dub: chosen.dub,
						hasAlternativeDub: records.length > 1,
						title: chosen.title,
						updatedAt: Date.now()
					};
					Storage.set("al_au_map", map);
					return `/anime/${chosen.id}-${chosen.slug}?ep=${targetEp}`;
				}
			} catch (_) {}
			return null;
		}
	};
	function sanitizeSaturnCache() {
		const rawMap = Storage.get("al_as_map");
		if (!rawMap || typeof rawMap !== "object") return;
		let changed = false;
		if (rawMap["107263"]?.slug?.includes("haikyuu") && !rawMap["107263"]?.slug?.includes("quest")) {
			delete rawMap["107263"];
			changed = true;
		}
		if (rawMap["190327"]?.slug?.includes("stone-ocean")) {
			delete rawMap["190327"];
			changed = true;
		}
		if (changed) Storage.set("al_as_map", rawMap);
	}
	var AnimeSaturnProvider = class extends BaseProvider {
		constructor() {
			super("AnimeSaturn");
			sanitizeSaturnCache();
		}
		isHome() {
			const p = window.location.pathname;
			return p === "/" || p === "/home" || p === "";
		}
		isAnimePage() {
			const p = window.location.pathname;
			return p.startsWith("/anime/") && !p.includes("/ep-");
		}
		isWatchPage() {
			const p = window.location.pathname;
			return /\/ep-\d+/i.test(p);
		}
		getActiveEpisode() {
			const m = window.location.pathname.match(/\/ep-(\d+)/i);
			if (m && m[1]) return parseInt(m[1], 10);
			const activeTile = document.querySelector(".ep-tile.is-current");
			if (activeTile) {
				const epNum = parseInt(activeTile.innerText.trim(), 10);
				if (!isNaN(epNum)) return epNum;
			}
			const subMatch = (document.querySelector(".player-card__sub, .ept-sub")?.innerText || "").match(/episodio\s+(\d+)/i);
			if (subMatch && subMatch[1]) return parseInt(subMatch[1], 10);
			return null;
		}
		getAnimeInfo() {
			const cardTitle = document.querySelector(".player-card__title, .ept-title")?.innerText?.trim();
			const headTitle = document.querySelector(".ag-head h1, h1")?.innerText?.trim();
			const title = cleanTitle$1(cardTitle || headTitle || "");
			let romajiTitle = (document.querySelector(".ag-head")?.querySelector("p.text-ink-dim") || document.querySelector(".ept-jtitle"))?.innerText?.trim() || "";
			if (!romajiTitle || romajiTitle.toLowerCase().includes("niente trovato")) romajiTitle = title;
			let anilistId = null;
			let malId = null;
			const alLink = document.querySelector("a[href*=\"anilist.co/anime/\"]");
			if (alLink) {
				const match = alLink.getAttribute("href")?.match(/anilist\.co\/anime\/(\d+)/i);
				if (match && match[1]) anilistId = parseInt(match[1], 10);
			}
			const malLink = document.querySelector("a[href*=\"myanimelist.net/anime/\"]");
			if (malLink) {
				const match = malLink.getAttribute("href")?.match(/myanimelist\.net\/anime\/(\d+)/i);
				if (match && match[1]) malId = parseInt(match[1], 10);
			}
			if (!anilistId) {
				const mainPoster = document.querySelector(".ag-poster img, .anime-poster-card img");
				if (mainPoster) {
					const match = (mainPoster.getAttribute("src") || "").match(/\/b[x]?(\d+)[-_.]/i);
					if (match && match[1]) anilistId = parseInt(match[1], 10);
				}
			}
			const slugMatch = window.location.pathname.match(/\/anime\/([^/]+)/i);
			const currentSlug = slugMatch ? slugMatch[1] : null;
			if ((!anilistId || !malId) && currentSlug) {
				const rawMap = Storage.get("al_as_map");
				const map = rawMap && typeof rawMap === "object" && !Array.isArray(rawMap) ? rawMap : {};
				for (const [id, val] of Object.entries(map)) if (val.slug === currentSlug) {
					if (!anilistId) anilistId = parseInt(id, 10);
					if (!malId && val.malId) malId = parseInt(val.malId, 10);
					break;
				}
			}
			const currentEp = this.getActiveEpisode();
			let totalEp = document.querySelectorAll(".ep-tile").length || null;
			if (!totalEp) {
				const totalMatch = (document.querySelector(".player-card__sub")?.innerText || "").match(/(\d+)\s+episodi/i);
				if (totalMatch && totalMatch[1]) totalEp = parseInt(totalMatch[1], 10);
			}
			return {
				title,
				romajiTitle,
				anilistId,
				malId,
				currentEp,
				totalEp
			};
		}
		async fetchRemoteMetadata() {
			const slugMatch = window.location.pathname.match(/\/anime\/([^/]+)/i);
			const currentSlug = slugMatch ? slugMatch[1] : null;
			if (!currentSlug) return null;
			try {
				const res = await fetch(`/anime/${currentSlug}`);
				if (!res.ok) return null;
				const html = await res.text();
				const alMatch = html.match(/anilist\.co\/anime\/(\d+)/i);
				const malMatch = html.match(/myanimelist\.net\/anime\/(\d+)/i);
				const anilistId = alMatch && alMatch[1] ? parseInt(alMatch[1], 10) : null;
				const malId = malMatch && malMatch[1] ? parseInt(malMatch[1], 10) : null;
				if (anilistId) {
					const rawMap = Storage.get("al_as_map");
					const map = rawMap && typeof rawMap === "object" && !Array.isArray(rawMap) ? rawMap : {};
					map[anilistId] = {
						slug: currentSlug,
						malId: malId || void 0,
						updatedAt: Date.now()
					};
					Storage.set("al_as_map", map);
				}
				return {
					anilistId,
					malId
				};
			} catch (_) {
				return null;
			}
		}
		getShelfAnchor() {
			const latestSection = document.querySelector("section[data-latest]");
			if (latestSection) return {
				element: latestSection,
				position: "before"
			};
			const heroShell = document.querySelector(".hero-shell")?.closest("section");
			if (heroShell) return {
				element: heroShell,
				position: "after"
			};
			const container = document.querySelector(".container-page, main");
			if (container) return {
				element: container,
				position: "prepend"
			};
			return null;
		}
		getNavAnchor() {
			const headerTools = document.querySelector("header .ml-auto.flex, header [x-show='!mobileSearch'].ml-auto");
			if (headerTools) return {
				desktop: headerTools,
				mobile: headerTools
			};
			const nav = document.querySelector("header nav, header .container-page");
			return {
				desktop: nav,
				mobile: nav
			};
		}
		getActionsAnchor() {
			const epSection = document.querySelector("section[x-data*='epList'], section:has(.ep-tile), .episodes-list, .ag-episodes");
			if (epSection) return {
				element: epSection,
				position: "before"
			};
			const toolbar = document.querySelector(".watch-toolbar, .ag-cta");
			if (toolbar) return {
				element: toolbar,
				position: "before"
			};
			return null;
		}
		getVideoBottomAnchor() {
			const toolbar = document.querySelector(".watch-toolbar");
			if (toolbar) return toolbar;
			return document.querySelector(".player-card");
		}
		highlightEpisodes(trackedProgress) {
			if (trackedProgress === void 0 || trackedProgress === null) return;
			const tiles = document.querySelectorAll(".ep-tile");
			const activeEp = this.getActiveEpisode();
			tiles.forEach((tile) => {
				let epNum = parseInt(tile.innerText.trim(), 10);
				if (isNaN(epNum)) {
					const m = (tile.getAttribute("href") || "").match(/\/ep-(\d+)/i);
					if (m) epNum = parseInt(m[1], 10);
				}
				if (isNaN(epNum)) return;
				const isDone = epNum <= trackedProgress;
				const isCurrent = epNum === activeEp;
				tile.classList.toggle("al-done", isDone);
				tile.classList.toggle("al-current", isCurrent);
			});
		}
		async resolveTargetUrl(media, targetEp = 1) {
			if (!media?.id) return null;
			const isDubPref = (Storage.get("al_pref_language") || "sub") === "dub";
			const rawMap = Storage.get("al_as_map");
			const map = rawMap && typeof rawMap === "object" && !Array.isArray(rawMap) ? rawMap : {};
			const cached = map[media.id];
			if (cached?.slug) {
				const mediaSeason = extractSeason(media.title?.romaji || media.title?.english || media.title?.userPreferred || "");
				const cachedSeason = cached.title ? extractSeason(cached.title) : null;
				if ((cachedSeason === null || cachedSeason === mediaSeason) && (cached.dub === void 0 || cached.dub === 1 === isDubPref || cached.hasAlternativeDub === false)) return `/anime/${cached.slug}/ep-${targetEp}`;
			}
			const candidates = generateSearchCandidates$1(media);
			for (const query of candidates) try {
				const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
				if (!res.ok) continue;
				const results = (await res.json())?.results || [];
				if (!results.length) continue;
				results.forEach((r) => {
					if (!r.anilist_id && r.poster) {
						const m = r.poster.match(/\/bx?(\d+)[-_.]/i);
						if (m && m[1]) r.anilist_id = parseInt(m[1], 10);
					}
				});
				const best = results.map((r) => ({
					result: r,
					score: scoreSearchResult(r, media, isDubPref)
				})).sort((a, b) => b.score - a.score)[0];
				if (best && best.score >= 50 && best.result?.url) {
					const chosen = best.result;
					const slug = chosen.url.replace(/^\/anime\//, "").replace(/\/$/, "");
					const isDub = chosen.title?.includes("(ITA)") || chosen.url?.includes("-ita-") ? 1 : 0;
					map[media.id] = {
						slug,
						dub: isDub,
						hasAlternativeDub: results.length > 1,
						title: chosen.title,
						malId: media.idMal || void 0,
						updatedAt: Date.now()
					};
					Storage.set("al_as_map", map);
					return `/anime/${slug}/ep-${targetEp}`;
				}
			} catch (_) {}
			return null;
		}
	};
	var currentProvider = null;
	function getProvider() {
		if (currentProvider) return currentProvider;
		const host = window.location.hostname.toLowerCase();
		if (host.includes("animeunity")) currentProvider = new AnimeUnityProvider();
		else if (host.includes("animesaturn") || host.includes("saturncdn")) currentProvider = new AnimeSaturnProvider();
		return currentProvider;
	}
	function getCurrentProvider() {
		return getProvider();
	}
	var listeners = new Set();
	var Settings = {
		get() {
			const autoTrack = Storage.get("al_opt_autotrack");
			const delay = Storage.get("al_opt_autodelay");
			const trackTrigger = Storage.get("al_pref_track_trigger");
			const completionThreshold = Storage.get("al_pref_completion_threshold");
			const autoResume = Storage.get("al_pref_autoresume");
			const crossDeviceSync = Storage.get("al_pref_cross_device_sync");
			const searchAutoSelectDelay = Storage.get("al_pref_search_autoselect");
			const defaultBuddy = Storage.get("al_pref_default_buddy");
			const autoSkip = Storage.get("al_opt_autoskip");
			const skipFallback = Storage.get("al_opt_skip_fallback");
			const shelfFilterUnwatched = Storage.get("al_shelf_filter_unwatched");
			const shelfFilterSync = Storage.get("al_shelf_filter_sync");
			let effectiveTrigger = "completion";
			if (trackTrigger) effectiveTrigger = trackTrigger;
			else if (autoTrack === false || autoTrack === "false") effectiveTrigger = "manual";
			return {
				autoTrack: effectiveTrigger !== "manual",
				trackTrigger: effectiveTrigger,
				completionThreshold: completionThreshold !== null && completionThreshold !== void 0 && !isNaN(parseInt(completionThreshold, 10)) ? parseInt(completionThreshold, 10) : 85,
				autoResume: autoResume !== false && autoResume !== "false",
				crossDeviceSync: crossDeviceSync !== false && crossDeviceSync !== "false",
				delay: delay !== null && delay !== void 0 && !isNaN(parseInt(delay, 10)) ? parseInt(delay, 10) : 15,
				preventRewind: false,
				autoSkip: autoSkip === true || autoSkip === "true",
				skipFallbackDuration: skipFallback !== null && skipFallback !== void 0 && !isNaN(parseInt(skipFallback, 10)) ? parseInt(skipFallback, 10) : 85,
				language: Storage.get("al_pref_language") || "sub",
				homeShelf: true,
				shelfFilterUnwatched: shelfFilterUnwatched === true || shelfFilterUnwatched === "true",
				shelfFilterSync: shelfFilterSync === true || shelfFilterSync === "true",
				searchAutoSelectDelay: searchAutoSelectDelay !== null && searchAutoSelectDelay !== void 0 ? parseInt(searchAutoSelectDelay, 10) : 5,
				defaultBuddy: defaultBuddy ? String(defaultBuddy).trim() : ""
			};
		},
		set(key, val) {
			if (key === "autoTrack") {
				Storage.set("al_opt_autotrack", String(val));
				if (!val) Storage.set("al_pref_track_trigger", "manual");
				else if (Storage.get("al_pref_track_trigger") === "manual") Storage.set("al_pref_track_trigger", "completion");
			} else if (key === "trackTrigger") {
				Storage.set("al_pref_track_trigger", String(val));
				Storage.set("al_opt_autotrack", String(val !== "manual"));
			} else if (key === "completionThreshold") Storage.set("al_pref_completion_threshold", String(val));
			else if (key === "autoResume") Storage.set("al_pref_autoresume", String(val));
			else if (key === "crossDeviceSync") Storage.set("al_pref_cross_device_sync", String(val));
			else if (key === "delay") Storage.set("al_opt_autodelay", String(val));
			else if (key === "autoSkip") Storage.set("al_opt_autoskip", String(val));
			else if (key === "skipFallbackDuration") Storage.set("al_opt_skip_fallback", String(val));
			else if (key === "language") {
				Storage.set("al_pref_language", String(val));
				Storage.del("al_au_map");
				Storage.del("al_as_map");
			} else if (key === "shelfFilterUnwatched") Storage.set("al_shelf_filter_unwatched", String(val));
			else if (key === "shelfFilterSync") Storage.set("al_shelf_filter_sync", String(val));
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
	var Resume = {
		extract(notes) {
			if (!notes || typeof notes !== "string") return null;
			const match = notes.match(/\[resume:ep=(\d+),t=(\d+),d=(\d+)\]/i);
			if (!match) return null;
			const ep = parseInt(match[1], 10);
			const time = parseInt(match[2], 10);
			const duration = parseInt(match[3], 10);
			return {
				ep,
				time,
				duration,
				percent: duration > 0 ? Math.min(100, Math.max(0, Math.round(time / duration * 100))) : 0
			};
		},
		apply(notes, { ep, time, duration }) {
			const clean = (notes || "").replace(/\s*\[resume:[^\]]+\]/gi, "").trim();
			const tag = `[resume:ep=${Math.round(ep)},t=${Math.round(time)},d=${Math.round(duration)}]`;
			return clean ? `${clean} ${tag}` : tag;
		},
		clear(notes) {
			return (notes || "").replace(/\s*\[resume:[^\]]+\]/gi, "").trim();
		},
		formatTime(seconds) {
			if (!seconds || isNaN(seconds) || seconds <= 0) return "0:00";
			const s = Math.round(seconds);
			const hrs = Math.floor(s / 3600);
			const mins = Math.floor(s % 3600 / 60);
			const secs = s % 60;
			if (hrs > 0) return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
			return `${mins}:${String(secs).padStart(2, "0")}`;
		},
		getLocal(mediaId) {
			if (!mediaId) return null;
			return Storage.get(`al_resume_${mediaId}`) || null;
		},
		setLocal(mediaId, data) {
			if (!mediaId || !data) return;
			Storage.set(`al_resume_${mediaId}`, {
				...data,
				updatedAt: Date.now()
			});
		},
		clearLocal(mediaId) {
			if (!mediaId) return;
			Storage.del(`al_resume_${mediaId}`);
		}
	};
	var cache$1 = new Map();
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
			const cached = cache$1.get(key);
			if (cached && Date.now() - cached.time < CACHE_TTL_MS) return cached.map;
			try {
				const lists = (await AniListAPI.getFriendWatching(buddyName))?.MediaListCollection?.lists || [];
				const map = new Map();
				for (const list of lists) for (const entry of list.entries || []) if (!map.has(entry.mediaId)) map.set(entry.mediaId, entry);
				cache$1.set(key, {
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
			const cached = cache$1.get(key);
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
		const { modal, close } = createModal({
			id: "al-prefs-overlay",
			className: "al-prefs-modal",
			variant: "drawer",
			icon: SlidersVertical,
			title: "Preferences",
			subtitle: "Playback, search, and sync settings",
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
              ${iconHtml(Play, {
				width: 13,
				height: 13
			})}
              <span>Track trigger timing</span>
            </span>
            <select class="al-select-xs al-sel-trigger">
              <option value="completion" ${settings.trackTrigger === "completion" ? "selected" : ""}>At 85% Video Completion</option>
              <option value="play" ${settings.trackTrigger === "play" ? "selected" : ""}>On Video Start (Play)</option>
              <option value="delay" ${settings.trackTrigger === "delay" ? "selected" : ""}>Countdown Delay on Load</option>
            </select>
          </div>

          <div class="al-pref-row al-row-delay" style="${settings.trackTrigger === "delay" ? "" : "display: none;"}">
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
              <span>Auto-resume playback position</span>
            </span>
            <input type="checkbox" class="al-switch al-toggle-autoresume" ${settings.autoResume ? "checked" : ""} />
          </label>

          <label class="al-pref-row" style="cursor: pointer;">
            <span class="al-pref-sub-label">
              ${iconHtml(Languages, {
				width: 13,
				height: 13
			})}
              <span>Cross-device sync via AniList notes</span>
            </span>
            <input type="checkbox" class="al-switch al-toggle-crossdevicesync" ${settings.crossDeviceSync ? "checked" : ""} />
          </label>
        </div>
      </div>

      <!-- 2. Skip Intro (AniSkip) -->
      <div class="al-pref-group al-pref-collapsible is-open is-active" style="margin-top: 10px;" id="al-pref-sec-skipintro">
        <div class="al-pref-header">
          <div class="al-pref-title-click">
            <span class="al-pref-chevron">${iconHtml(ChevronDown, {
				width: 14,
				height: 14
			})}</span>
            <div class="al-pref-info">
              <span class="al-pref-title">Skip intro (AniSkip)</span>
              <span class="al-pref-desc">Automatic opening skip & shortcut controls</span>
            </div>
          </div>
        </div>

        <div class="al-pref-sub">
          <label class="al-pref-row" style="cursor: pointer;">
            <span class="al-pref-sub-label">
              ${iconHtml(SkipForward, {
				width: 13,
				height: 13
			})}
              <span>Auto-skip opening intro</span>
            </span>
            <input type="checkbox" class="al-switch al-toggle-autoskip" ${settings.autoSkip ? "checked" : ""} />
          </label>

          <div class="al-pref-row">
            <span class="al-pref-sub-label">
              ${iconHtml(FastForward, {
				width: 13,
				height: 13
			})}
              <span>Fallback skip (Key 'S')</span>
            </span>
            <select class="al-select-xs al-sel-skip-fallback">
              <option value="75" ${settings.skipFallbackDuration === 75 ? "selected" : ""}>75 seconds</option>
              <option value="80" ${settings.skipFallbackDuration === 80 ? "selected" : ""}>80 seconds</option>
              <option value="85" ${settings.skipFallbackDuration === 85 ? "selected" : ""}>85 seconds (Default)</option>
              <option value="90" ${settings.skipFallbackDuration === 90 ? "selected" : ""}>90 seconds</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 3. Navigation & Search Preferences -->
      <div class="al-pref-group al-pref-collapsible is-open is-active" style="margin-top: 10px;" id="al-pref-sec-search">
        <div class="al-pref-header">
          <div class="al-pref-title-click">
            <span class="al-pref-chevron">${iconHtml(ChevronDown, {
				width: 14,
				height: 14
			})}</span>
            <div class="al-pref-info">
              <span class="al-pref-title">Search & Matching</span>
              <span class="al-pref-desc">Streaming language & auto-navigation</span>
            </div>
          </div>
        </div>

        <div class="al-pref-sub">
          <div class="al-pref-row">
            <span class="al-pref-sub-label">
              ${iconHtml(Languages, {
				width: 13,
				height: 13
			})}
              <span>Preferred language</span>
            </span>
            <select class="al-select-xs al-sel-language">
              <option value="sub" ${settings.language === "sub" ? "selected" : ""}>SUB (Original)</option>
              <option value="dub" ${settings.language === "dub" ? "selected" : ""}>ITA (Dubbed)</option>
            </select>
          </div>

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
              <option value="0" ${settings.searchAutoSelectDelay === 0 ? "selected" : ""}>Manual (Browse results)</option>
            </select>
          </div>

          <div class="al-pref-row" style="align-items: center; justify-content: space-between; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 8px; margin-top: 4px;">
            <span class="al-pref-sub-label">
              ${iconHtml(RotateCcw, {
				width: 13,
				height: 13
			})}
              <span>Reset learned anime URLs</span>
            </span>
            <button type="button" class="al-btn-pref-action danger al-btn-clear-cache">
              ${iconHtml(Trash, {
				width: 11,
				height: 11
			})}
              <span>Clear Cache</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 4. Sync Together (Watch Buddy) -->
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
		const triggerSelect = modal.querySelector(".al-sel-trigger");
		const delayRow = modal.querySelector(".al-row-delay");
		if (triggerSelect) triggerSelect.addEventListener("change", (e) => {
			const mode = e.target.value;
			Settings.set("trackTrigger", mode);
			if (delayRow) delayRow.style.display = mode === "delay" ? "" : "none";
		});
		const delaySelect = modal.querySelector(".al-sel-delay");
		if (delaySelect) delaySelect.addEventListener("change", (e) => {
			Settings.set("delay", parseInt(e.target.value, 10));
		});
		const autoResumeToggle = modal.querySelector(".al-toggle-autoresume");
		if (autoResumeToggle) autoResumeToggle.addEventListener("change", (e) => {
			Settings.set("autoResume", e.target.checked);
		});
		const crossDeviceToggle = modal.querySelector(".al-toggle-crossdevicesync");
		if (crossDeviceToggle) crossDeviceToggle.addEventListener("change", (e) => {
			Settings.set("crossDeviceSync", e.target.checked);
		});
		const skipGroup = modal.querySelector("#al-pref-sec-skipintro");
		(skipGroup?.querySelector(".al-pref-title-click"))?.addEventListener("click", () => {
			skipGroup?.classList.toggle("is-open");
		});
		const autoSkipToggle = modal.querySelector(".al-toggle-autoskip");
		if (autoSkipToggle) autoSkipToggle.addEventListener("change", (e) => {
			Settings.set("autoSkip", e.target.checked);
		});
		const skipFallbackSelect = modal.querySelector(".al-sel-skip-fallback");
		if (skipFallbackSelect) skipFallbackSelect.addEventListener("change", (e) => {
			Settings.set("skipFallbackDuration", parseInt(e.target.value, 10));
		});
		const searchGroup = modal.querySelector("#al-pref-sec-search");
		(searchGroup?.querySelector(".al-pref-title-click"))?.addEventListener("click", () => {
			searchGroup?.classList.toggle("is-open");
		});
		const langSelect = modal.querySelector(".al-sel-language");
		if (langSelect) langSelect.addEventListener("change", (e) => {
			Settings.set("language", e.target.value);
		});
		const autoSelect = modal.querySelector(".al-sel-autoselect");
		if (autoSelect) autoSelect.addEventListener("change", (e) => {
			Settings.set("searchAutoSelectDelay", parseInt(e.target.value, 10));
		});
		const clearCacheBtn = modal.querySelector(".al-btn-clear-cache");
		if (clearCacheBtn) clearCacheBtn.addEventListener("click", () => {
			Storage.del("al_au_map");
			Storage.del("al_as_map");
			showToast("⚡ Search cache cleared: mappings reset");
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
			onChangeToken?.();
		});
		menu.querySelector(".al-btn-logout")?.addEventListener("click", (e) => {
			e.stopPropagation();
			menu.classList.remove("show");
			onLogout?.();
		});
	}
	function renderNav(currentUser, callbacks, provider = null) {
		const avatar = currentUser?.avatar?.medium || "https://anilist.co/img/icons/icon.svg";
		const navAnchor = provider?.getNavAnchor?.();
		const leftNav = navAnchor?.desktop || document.querySelector("#left-nav");
		if (leftNav) {
			let container = document.getElementById("al-nav-desktop");
			const isSaturn = leftNav.classList?.contains("flex") || provider?.name === "AnimeSaturn";
			if (!container) {
				container = document.createElement(isSaturn ? "div" : "li");
				container.id = "al-nav-desktop";
				container.className = isSaturn ? "al-nav-saturn position-relative" : "nav-item position-relative";
				if (isSaturn) leftNav.prepend(container);
				else {
					const nativeLogin = leftNav.querySelector("a[href*=\"/login\"]")?.closest(".nav-item");
					nativeLogin ? nativeLogin.replaceWith(container) : leftNav.appendChild(container);
				}
			}
			if (!currentUser) {
				if (isSaturn) container.innerHTML = `
          <button type="button" class="btn-icon cursor-pointer" id="al-nav-login-btn" title="Connect AniList" style="display:flex;align-items:center;gap:4px;padding:4px 8px;border-radius:9999px;background:rgba(2,169,255,0.15);color:#02a9ff;font-size:12px;font-weight:600;border:none;">
            ${iconHtml(KeyRound, {
					width: 14,
					height: 14
				})}
            <span>AniList</span>
          </button>`;
				else container.innerHTML = `
          <a class="nav-link text-center pt-3" href="javascript:void(0)" role="button" id="al-nav-login-btn">
            ${iconHtml(KeyRound, {
					width: 18,
					height: 18,
					style: "color:var(--al-blue);"
				})}<br>
            <span style="color:var(--al-blue);font-weight:600;font-size:11px;">AniList</span>
          </a>`;
				const btn = container.querySelector("#al-nav-login-btn") || container.querySelector("a, button");
				const handleLogin = (e) => {
					e.preventDefault();
					e.stopPropagation();
					callbacks.onLogin?.();
				};
				if (btn) {
					btn.onclick = handleLogin;
					btn.addEventListener("click", handleLogin, true);
				}
			} else {
				if (isSaturn) container.innerHTML = `
          <button type="button" class="btn-icon cursor-pointer al-saturn-nav-avatar" title="AniList: ${currentUser.name}" style="background:none;border:none;padding:0;cursor:pointer;">
            <img src="${avatar}" class="al-avatar" style="width:28px;height:28px;border-radius:50%;display:block;border:1.5px solid #02a9ff;" />
          </button>
          <div class="dropdown-menu dropdown-menu-right al-dropdown-menu" id="al-nav-dropdown" style="right:0;left:auto;">
            ${dropdownTpl(currentUser)}
          </div>`;
				else container.innerHTML = `
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
					menu?.classList.add("show");
				};
				const closeDropdownWithDelay = () => {
					if (closeTimer) clearTimeout(closeTimer);
					closeTimer = setTimeout(() => {
						menu?.classList.remove("show");
					}, 220);
				};
				container.addEventListener("mouseenter", openDropdown);
				container.addEventListener("mouseleave", closeDropdownWithDelay);
				menu?.addEventListener("mouseenter", openDropdown);
				menu?.addEventListener("mouseleave", closeDropdownWithDelay);
				const triggerBtn = container.querySelector("a, button");
				if (triggerBtn) triggerBtn.onclick = (e) => {
					e.preventDefault();
					e.stopPropagation();
					menu?.classList.toggle("show");
				};
				document.addEventListener("click", (e) => {
					if (!container.contains(e.target)) menu?.classList.remove("show");
				});
				if (menu) bindDropdown(menu, callbacks, currentUser);
			}
		}
		const mobileNav = navAnchor?.mobile || document.querySelector(".nav-top-mobile");
		if (mobileNav && mobileNav !== leftNav) {
			let mWidget = document.getElementById("al-nav-mobile");
			if (!mWidget) {
				mWidget = document.createElement("div");
				mWidget.id = "al-nav-mobile";
				mWidget.className = "d-inline-block ml-2 position-relative";
				mobileNav.appendChild(mWidget);
			}
			if (!currentUser) {
				mWidget.innerHTML = `
        <button type="button" class="btn btn-sm al-bg-blue py-1 px-2 rounded-pill small d-inline-flex align-items-center" id="al-nav-m-login-btn" style="gap:4px;">
          ${iconHtml(KeyRound, {
					width: 12,
					height: 12
				})}
          <span>AniList</span>
        </button>`;
				const mBtn = mWidget.querySelector("#al-nav-m-login-btn") || mWidget.querySelector("button");
				const handleMLogin = (e) => {
					e.preventDefault();
					e.stopPropagation();
					callbacks.onLogin?.();
				};
				if (mBtn) {
					mBtn.onclick = handleMLogin;
					mBtn.addEventListener("click", handleMLogin, true);
				}
			} else {
				mWidget.innerHTML = `
        <img src="${avatar}" class="al-avatar-mobile" />
        <div class="dropdown-menu dropdown-menu-right al-dropdown-menu position-fixed" id="al-nav-m-dropdown" style="top:54px;right:12px;z-index:99999;">
          ${dropdownTpl(currentUser)}
        </div>`;
				const mMenu = mWidget.querySelector("#al-nav-m-dropdown");
				const mAvatar = mWidget.querySelector("img");
				if (mAvatar) mAvatar.onclick = (e) => {
					e.stopPropagation();
					mMenu?.classList.toggle("show");
				};
				if (mMenu) bindDropdown(mMenu, callbacks, currentUser);
			}
		}
	}
	function renderActions(media, hasToken, actions, { isLoading = false, viewer = null, defaultBuddy = "", buddyData = null, provider = null, activeEp = 0, trackedProgress = -1, autoTrackState = null } = {}) {
		document.querySelectorAll(".cover-wrap .actions, .list-btn-mobile, #add-to-fav").forEach((el) => el.remove());
		const anchorData = provider?.getActionsAnchor?.();
		let targetAnchor = null;
		let insertMode = "before";
		if (anchorData?.element) {
			targetAnchor = anchorData.element;
			insertMode = anchorData.position || "before";
		} else if (anchorData instanceof HTMLElement) {
			targetAnchor = anchorData;
			insertMode = "before";
		} else {
			const epWrapper = document.querySelector(".episode-wrapper, section[x-data*='epList'], section:has(.ep-tile)");
			if (epWrapper) {
				targetAnchor = epWrapper;
				insertMode = "before";
			} else {
				const overview = document.querySelector(".content .overview, .overview");
				if (overview) {
					targetAnchor = overview;
					insertMode = "append";
				}
			}
		}
		if (!targetAnchor) return;
		let bar = document.getElementById("al-control-bar");
		if (!bar) {
			bar = document.createElement("div");
			bar.id = "al-control-bar";
			bar.className = "al-card";
		}
		if (insertMode === "before") {
			if (bar.nextElementSibling !== targetAnchor) targetAnchor.before(bar);
		} else if (insertMode === "after") {
			if (bar.previousElementSibling !== targetAnchor) targetAnchor.after(bar);
		} else if (insertMode === "append") {
			if (bar.parentElement !== targetAnchor) targetAnchor.appendChild(bar);
		}
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
		let episodeStatusHtml = "";
		if (activeEp > 0) {
			if (autoTrackState?.isActive && autoTrackState.targetEp === activeEp) episodeStatusHtml = `
        <div class="al-ep-chip is-countdown" title="Auto-tracking progress in ${autoTrackState.countdown}s">
          <div class="al-ep-chip-badge">
            ${iconHtml(Clock, {
				width: 12,
				height: 12,
				class: "al-pulse"
			})}
            <span class="al-ep-chip-num">Ep. ${activeEp}</span>
            <span class="al-ep-chip-timer">${autoTrackState.countdown}s</span>
          </div>
          <div class="al-ep-chip-actions">
            <button type="button" class="al-ep-mini-btn danger" id="al-ep-cancel" title="Cancel auto-track">
              ${iconHtml(X, {
				width: 11,
				height: 11
			})}
            </button>
            <button type="button" class="al-ep-mini-btn success" id="al-ep-savenow" title="Mark Ep. ${activeEp} as watched now">
              ${iconHtml(Check, {
				width: 12,
				height: 12
			})}
            </button>
          </div>
        </div>`;
			else if (trackedProgress > 0 && activeEp === trackedProgress) {
				const rewindTarget = activeEp - 1;
				episodeStatusHtml = `
        <div class="al-ep-chip is-synced" title="Tracked on AniList as Ep. ${activeEp}">
          <div class="al-ep-chip-badge">
            ${iconHtml(CheckCheck, {
					width: 12,
					height: 12
				})}
            <span class="al-ep-chip-num">Ep. ${activeEp}</span>
            <span class="al-ep-chip-text">Synced</span>
          </div>
          <div class="al-ep-chip-actions">
            <button type="button" class="al-ep-mini-btn rewind" id="al-ep-rewind" title="${rewindTarget > 0 ? `Rewind AniList to Ep. ${rewindTarget}` : "Mark as unwatched"}">
              ${iconHtml(RotateCcw, {
					width: 11,
					height: 11
				})}
              <span>${rewindTarget > 0 ? `Ep. ${rewindTarget}` : "Reset"}</span>
            </button>
          </div>
        </div>`;
			} else if (trackedProgress > 0 && activeEp < trackedProgress) {
				const rewindTarget = activeEp - 1;
				episodeStatusHtml = `
        <div class="al-ep-chip is-watched" title="Episode ${activeEp} already watched (AniList at Ep. ${trackedProgress})">
          <div class="al-ep-chip-badge">
            ${iconHtml(Check, {
					width: 12,
					height: 12
				})}
            <span class="al-ep-chip-num">Ep. ${activeEp}</span>
            <span class="al-ep-chip-text">Seen</span>
          </div>
          <div class="al-ep-chip-actions">
            <button type="button" class="al-ep-mini-btn rewind" id="al-ep-rewind" title="${rewindTarget > 0 ? `Rewind AniList to Ep. ${rewindTarget}` : "Mark as unwatched"}">
              ${iconHtml(RotateCcw, {
					width: 11,
					height: 11
				})}
              <span>${rewindTarget > 0 ? `Ep. ${rewindTarget}` : "Reset"}</span>
            </button>
          </div>
        </div>`;
			} else {
				const resume = Resume.extract(entry?.notes) || Resume.getLocal(media.id);
				if (resume && resume.ep === activeEp && resume.time > 15 && resume.percent < 88) episodeStatusHtml = `
          <div class="al-ep-chip is-resuming" title="Resume at ${Resume.formatTime(resume.time)} (${resume.percent}%) • Mark Ep. ${activeEp} as watched">
            <div class="al-ep-chip-badge">
              ${iconHtml(Play, {
					width: 12,
					height: 12
				})}
              <span class="al-ep-chip-num">Ep. ${activeEp}</span>
              <span class="al-ep-chip-text" style="color: #c084fc;">${Resume.formatTime(resume.time)}</span>
            </div>
            <div class="al-ep-chip-actions">
              <button type="button" class="al-ep-mini-btn success" id="al-ep-save" title="Mark Ep. ${activeEp} as watched">
                ${iconHtml(Check, {
					width: 12,
					height: 12
				})}
              </button>
            </div>
          </div>`;
				else episodeStatusHtml = `
          <div class="al-ep-chip is-untracked" title="Mark Ep. ${activeEp} as watched (AniList currently at Ep. ${trackedProgress > 0 ? trackedProgress : 0})">
            <div class="al-ep-chip-badge">
              ${iconHtml(Zap, {
					width: 12,
					height: 12
				})}
              <span class="al-ep-chip-num">Ep. ${activeEp}</span>
            </div>
            <div class="al-ep-chip-actions">
              <button type="button" class="al-ep-mini-btn success" id="al-ep-save" title="Mark Ep. ${activeEp} as watched">
                ${iconHtml(Check, {
					width: 12,
					height: 12
				})}
              </button>
            </div>
          </div>`;
			}
		}
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
            <select class="al-select al-status-select" id="al-bar-status" title="Anime status">
              ${Object.entries(AniListAPI.statuses).map(([k, v]) => `<option value="${k}" ${entry.status === k ? "selected" : ""}>${v}</option>`).join("")}
            </select>
          ` : ""}

          ${episodeStatusHtml}
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
                    <span>${isBuddyCompleted ? `${buddyData.name} Done` : `Ep. ${buddyData.progress}`}</span>
                  </button>
                ` : `
                  <span class="al-buddy-tag ${isBuddyCompleted ? "is-completed" : ""}" title="${buddyData.name}: ${isBuddyCompleted ? "Completed" : `Ep. ${buddyData.progress || 0}`}">
                    ${isBuddyCompleted ? `<span class="al-dot"></span><span>${buddyData.name} Done</span>` : `<span>Ep. ${buddyData.progress || 0}</span>`}
                  </span>
                `}
              ` : ""}
            </div>

            <select class="al-select al-score-select" id="al-bar-score" title="Your rating">
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

            <button type="button" class="al-icon-btn danger al-bar-del-btn" id="al-bar-del" title="Remove from AniList library">
              ${iconHtml(Trash, {
			width: 13,
			height: 13
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
		bar.querySelector("#al-ep-cancel")?.addEventListener("click", () => {
			actions.onCancelCountdown?.();
		});
		bar.querySelector("#al-ep-savenow, #al-ep-save")?.addEventListener("click", () => {
			actions.onSave?.(activeEp);
		});
		bar.querySelector("#al-ep-rewind")?.addEventListener("click", () => {
			const rewindTarget = Math.max(0, activeEp - 1);
			actions.onRewind?.(rewindTarget, activeEp);
		});
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
			showToast(`⚠️ Could not open search bar`, true);
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
			showToast(`⚠️ Could not open search input`, true);
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
			showToast(`⚠️ No immediate results for "${query}"`, true);
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
	function getEntrySortTier(entry) {
		const media = entry.media || {};
		const state = calculateEntryState(entry);
		const resume = Resume.extract(entry.notes) || Resume.getLocal(media.id);
		if (Boolean(resume && resume.percent > 0 && resume.percent < 88 && (resume.ep === state.nextToWatch || resume.ep > state.progress))) return 1;
		if ((media.status === "RELEASING" || Boolean(media.nextAiringEpisode)) && state.hasUnwatchedAired) return 2;
		if (state.hasUnwatchedAired || state.isRepeating) return 3;
		return 4;
	}
	function compareShelfEntries(a, b) {
		const tierA = getEntrySortTier(a);
		const tierB = getEntrySortTier(b);
		if (tierA !== tierB) return tierA - tierB;
		if (tierA === 4) {
			const timeA = a.media?.nextAiringEpisode?.timeUntilAiring;
			const timeB = b.media?.nextAiringEpisode?.timeUntilAiring;
			if (timeA && timeB) return timeA - timeB;
			if (timeA && !timeB) return -1;
			if (!timeA && timeB) return 1;
		}
		const updatedA = a.updatedAt || 0;
		return (b.updatedAt || 0) - updatedA;
	}
	function createCard(entry, buddySync = null, onSyncEntry = null) {
		const media = entry.media || {};
		const state = calculateEntryState(entry);
		const resume = Resume.extract(entry.notes) || Resume.getLocal(media.id);
		const isResumeActive = resume && resume.percent > 0 && resume.percent < 88 && (resume.ep === state.nextToWatch || resume.ep > state.progress);
		const epTarget = isResumeActive ? resume.ep : state.hasUnwatchedAired ? state.nextToWatch : state.progress || 1;
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
		} else if (state.nextAir && state.nextAir.timeUntilAiring > 0) {
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
		if (isResumeActive) progressLabel.textContent = `Ep. ${resume.ep} • ${Resume.formatTime(resume.time)} / ${Resume.formatTime(resume.duration)}`;
		else progressLabel.textContent = `Ep. ${state.progress} / ${state.totalEp || state.latestAired || "?"}`;
		progressText.appendChild(progressLabel);
		if (isResumeActive) {
			const resumeTag = document.createElement("span");
			resumeTag.style.color = "#c084fc";
			resumeTag.textContent = `${resume.percent}%`;
			progressText.appendChild(resumeTag);
		} else if (state.hasUnwatchedAired || state.isRepeating) {
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
		if (isResumeActive) {
			progressFill.style.width = `${resume.percent}%`;
			progressFill.style.background = "linear-gradient(90deg, #3db4f2, #a855f7)";
		} else {
			const totalForBar = state.totalEp || state.latestAired || state.progress || 1;
			const percent = Math.min(100, Math.max(0, Math.round(state.progress / totalForBar * 100)));
			progressFill.style.width = `${percent}%`;
		}
		progressBar.appendChild(progressFill);
		overlay.appendChild(progressBar);
		coverWrap.appendChild(overlay);
		card.appendChild(coverWrap);
		const cardBody = document.createElement("div");
		cardBody.className = "al-card-body";
		const titleLink = document.createElement("a");
		titleLink.href = "#";
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
		btn.href = "#";
		btn.className = "al-card-btn";
		if (isResumeActive) {
			btn.classList.add("al-btn-play");
			btn.style.background = "linear-gradient(135deg, #0284c7, #9333ea)";
			btn.title = `Resume Ep. ${resume.ep} (${Resume.formatTime(resume.time)})`;
			btn.innerHTML = `${iconHtml(Play, {
				width: 12,
				height: 12
			})} Resume`;
		} else if (state.hasUnwatchedAired || state.isRepeating) {
			btn.classList.add("al-btn-play");
			if (state.isRepeating) btn.style.background = "#06b6d4";
			btn.title = `Watch Ep. ${state.nextToWatch}`;
			btn.innerHTML = `${iconHtml(Play, {
				width: 12,
				height: 12
			})} Play`;
		} else if (state.nextAir && state.nextAir.timeUntilAiring > 0) {
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
			const provider = getCurrentProvider();
			const siteName = provider?.name || "Site";
			Logger.info(`Card clicked: "${title}" (AniList ID: ${media.id}) on ${siteName}`);
			if (epTarget) sessionStorage.setItem("al_target_ep", String(epTarget));
			if (isResumeActive && resume?.time > 0) sessionStorage.setItem("al_resume_time", String(resume.time));
			card.classList.add("al-card-loading");
			const originalBtnHtml = btn.innerHTML;
			btn.innerHTML = `${iconHtml(LoaderCircle, {
				width: 12,
				height: 12,
				class: "al-spin"
			})} Loading...`;
			btn.style.opacity = "0.75";
			btn.style.pointerEvents = "none";
			try {
				const targetUrl = await provider?.resolveTargetUrl(media, epTarget);
				if (targetUrl) {
					showToast(`⚡ Opening ${title}...`);
					window.location.href = targetUrl;
					return;
				}
				if (provider?.name === "AnimeUnity") {
					showToast(`🔍 Searching "${title}" on AnimeUnity...`, false, 2e3);
					const settings = Settings.get();
					if (!await simulateAgenticSearch(media, {
						epTarget,
						autoSelectDelay: settings.searchAutoSelectDelay
					})) showToast(`⚠️ Could not find "${title}" on AnimeUnity`, true);
				} else {
					showToast(`🔍 Searching "${title}" on AnimeSaturn...`);
					window.location.href = `/filter?key=${encodeURIComponent(cleanTitle$1(title))}`;
				}
			} catch (err) {
				Logger.error("Search error in handleCardNavigate:", err);
				showToast(`⚠️ Error: ${err.message}`, true);
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
		let unwatchedOnly = Settings.get().shelfFilterUnwatched;
		let syncOnly = Settings.get().shelfFilterSync;
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
		prefBtn.title = "Preferences";
		prefBtn.innerHTML = iconHtml(SlidersVertical, {
			width: 14,
			height: 14
		});
		controls.appendChild(prefBtn);
		const unwatchedEntries = entries.filter((e) => calculateEntryState(e).hasUnwatchedAired);
		const unwatchedBtn = document.createElement("button");
		unwatchedBtn.type = "button";
		unwatchedBtn.className = `al-shelf-chip-btn ${unwatchedOnly ? "is-active" : ""}`;
		unwatchedBtn.title = "Show only anime with unwatched aired episodes";
		unwatchedBtn.innerHTML = `
    ${iconHtml(Zap, {
			width: 12,
			height: 12
		})}
    <span>Unwatched</span>
    ${unwatchedEntries.length > 0 ? `<span class="al-chip-count">${unwatchedEntries.length}</span>` : ""}
  `;
		unwatchedBtn.addEventListener("click", () => {
			unwatchedOnly = !unwatchedOnly;
			Settings.set("shelfFilterUnwatched", unwatchedOnly);
			unwatchedBtn.classList.toggle("is-active", unwatchedOnly);
			updateTrack();
		});
		controls.appendChild(unwatchedBtn);
		const syncMap = new Map((syncNotifs || []).map((n) => [n.mediaId, n]));
		const syncEntries = entries.filter((e) => syncMap.has(e.mediaId) || !!Buddy.extract(e.notes));
		let syncBtn = null;
		if (syncEntries.length > 0) {
			syncBtn = document.createElement("button");
			syncBtn.type = "button";
			syncBtn.className = `al-shelf-chip-btn is-sync ${syncOnly ? "is-active" : ""}`;
			syncBtn.title = "Show only anime with Sync Together friend";
			syncBtn.innerHTML = `
      ${iconHtml(Users, {
				width: 12,
				height: 12
			})}
      <span>Sync</span>
      <span class="al-chip-count sync-badge">${syncEntries.length}</span>
    `;
			syncBtn.addEventListener("click", () => {
				syncOnly = !syncOnly;
				Settings.set("shelfFilterSync", syncOnly);
				syncBtn.classList.toggle("is-active", syncOnly);
				updateTrack();
			});
			controls.appendChild(syncBtn);
		}
		prefBtn.addEventListener("click", () => {
			openPreferencesModal({
				viewer,
				onSave: () => {
					unwatchedOnly = Settings.get().shelfFilterUnwatched;
					syncOnly = Settings.get().shelfFilterSync;
					unwatchedBtn.classList.toggle("is-active", unwatchedOnly);
					if (syncBtn) syncBtn.classList.toggle("is-active", syncOnly);
					updateTrack();
				}
			});
		});
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
        <div class="al-shelf-empty-desc">Sign in with AniList to access your Continue Watching list, release countdowns, and quick episode progress.</div>
        <button type="button" class="al-btn primary al-home-auth-btn" style="margin-top: 6px;">Connect AniList</button>
      `;
				const authBtn = empty.querySelector(".al-home-auth-btn");
				const handleShelfLogin = (e) => {
					e.preventDefault();
					e.stopPropagation();
					if (typeof onLogin === "function") onLogin();
					else openTokenModal();
				};
				if (authBtn) {
					authBtn.onclick = handleShelfLogin;
					authBtn.addEventListener("click", handleShelfLogin, true);
				}
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
			let visibleEntries = [...entries];
			if (unwatchedOnly) visibleEntries = visibleEntries.filter((e) => calculateEntryState(e).hasUnwatchedAired);
			if (syncOnly) visibleEntries = visibleEntries.filter((e) => syncMap.has(e.mediaId) || !!Buddy.extract(e.notes));
			visibleEntries.sort(compareShelfEntries);
			if (!visibleEntries.length) {
				const empty = document.createElement("div");
				empty.className = "al-shelf-empty";
				empty.style.width = "100%";
				empty.innerHTML = `
        <div class="al-shelf-empty-title">All Caught Up</div>
        <div class="al-shelf-empty-desc">${unwatchedOnly && syncOnly ? "No series with unwatched aired episodes and Sync Together friend." : unwatchedOnly ? "You are caught up on all airing anime! No unwatched episodes available." : "No series with a Sync Together friend found in your watching list."}</div>
      `;
				track.appendChild(empty);
				return;
			}
			visibleEntries.forEach((entry) => {
				const card = createCard(entry, syncMap.get(entry.mediaId) || null, onSyncEntry);
				track.appendChild(card);
			});
		}
		updateTrack();
		carouselWrap.appendChild(track);
		shelfContainer.appendChild(carouselWrap);
		return shelfContainer;
	}
	var cache = new Map();
	var activeMalId = null;
	var activeEp = null;
	var activeOp = null;
	var activeDuration = 0;
	var fetchToken = 0;
	function broadcastOp() {
		const settings = Settings.get();
		const msg = {
			type: "AU_SKIP_OP",
			op: activeOp,
			autoSkip: settings.autoSkip,
			skipFallbackDuration: settings.skipFallbackDuration
		};
		document.querySelectorAll("iframe").forEach((frame) => {
			try {
				frame.contentWindow?.postMessage(msg, "*");
			} catch (_) {}
		});
	}
	async function checkSkipIntro(malId, epNum, duration = 0) {
		if (!malId || !epNum) return;
		const roundedDur = Math.round(duration || 0);
		if (malId !== activeMalId || epNum !== activeEp) {
			activeMalId = malId;
			activeEp = epNum;
			activeDuration = roundedDur;
			activeOp = null;
			broadcastOp();
		} else if (roundedDur > 0) activeDuration = roundedDur;
		const cacheKey = `${malId}_${epNum}`;
		if (cache.has(cacheKey)) {
			activeOp = cache.get(cacheKey);
			broadcastOp();
			return;
		}
		const token = ++fetchToken;
		try {
			const res = await fetch(`https://api.aniskip.com/v2/skip-times/${malId}/${epNum}?types=op&episodeLength=${activeDuration}`);
			if (token !== fetchToken) return;
			if (!res.ok) {
				activeOp = null;
				cache.set(cacheKey, null);
				broadcastOp();
				return;
			}
			const op = (await res.json()).results?.find((r) => r.skipType === "op" || r.skipType === "mixed-op");
			activeOp = op ? {
				start: op.interval.startTime,
				end: op.interval.endTime,
				episodeLength: op.episodeLength || 0,
				skipType: op.skipType
			} : null;
			cache.set(cacheKey, activeOp);
			Logger.info(`📡 AniSkip result for Ep ${epNum}:`, activeOp || "No opening found");
			broadcastOp();
		} catch (err) {
			Logger.warn("AniSkip fetch failed:", err);
		}
	}
	function initSkipIntroTop() {
		window.addEventListener("message", (e) => {
			if (e.data?.type === "AU_FRAME_READY") {
				const frameDur = e.data.duration ? Math.round(e.data.duration) : 0;
				if (frameDur > 0 && !activeOp && activeMalId && activeEp) checkSkipIntro(activeMalId, activeEp, frameDur);
				else broadcastOp();
			}
		});
		window.addEventListener("keydown", (e) => {
			if (e.key === "s" || e.key === "S") {
				const tag = document.activeElement?.tagName?.toLowerCase();
				if (tag === "input" || tag === "textarea" || tag === "select") return;
				document.querySelectorAll("iframe").forEach((frame) => {
					try {
						frame.contentWindow?.postMessage({ type: "AU_TRIGGER_SKIP" }, "*");
					} catch (_) {}
				});
			}
		}, true);
		Settings.subscribe(() => {
			broadcastOp();
		});
	}
	function initPlayer() {
		let rawOp = null;
		let currentOp = null;
		let autoSkip = false;
		let skipFallbackDuration = 85;
		let btn = null;
		let isBtnVisible = false;
		let lastReportedDur = 0;
		let hasAutoSkipped = false;
		let lastSkipTime = 0;
		let pendingResumeSeek = null;
		let activeResumeTarget = null;
		let hasConfirmedResume = false;
		let lastBroadcastTime = 0;
		let lastReadyNotice = 0;
		function broadcastPlaybackState(force = false) {
			const now = Date.now();
			if (!force && now - lastBroadcastTime < 750) return;
			lastBroadcastTime = now;
			const pos = getPos();
			const dur = getDuration();
			const video = document.querySelector("video");
			const jw = getPlayer();
			const vds = getVidstack();
			let isPaused = true;
			let isEnded = false;
			if (jw && typeof jw.getState === "function") {
				isPaused = jw.getState() === "paused" || jw.getState() === "idle";
				isEnded = jw.getState() === "complete";
			} else if (vds && typeof vds.paused !== "undefined") {
				isPaused = vds.paused;
				isEnded = vds.ended;
			} else if (video) {
				isPaused = video.paused;
				isEnded = video.ended;
			}
			try {
				window.top.postMessage({
					type: "AL_PLAYBACK_STATE",
					currentTime: pos,
					duration: dur,
					isPaused,
					isEnded
				}, "*");
			} catch (_) {}
		}
		function handlePlayResumeGuard() {
			if (activeResumeTarget !== null && activeResumeTarget > 10) {
				const target = activeResumeTarget;
				setTimeout(() => {
					if (getPos() < 5) {
						Logger.info(`↺ Anti-reset guard: restoring playhead to ${target}s`);
						seekTo(target);
					}
				}, 350);
			}
		}
		function applyResumeSeek(target) {
			if (typeof target !== "number" || target <= 0) return;
			hasConfirmedResume = false;
			activeResumeTarget = target;
			const dur = getDuration();
			if (dur > 0 && target < dur - 5) {
				seekTo(target);
				Logger.info(`↺ Applying seekTo ${target}s`);
				let checks = 0;
				const guardInterval = setInterval(() => {
					checks++;
					const currentPos = getPos();
					if (currentPos < 3 && checks <= 6) seekTo(target);
					else if (currentPos >= target - 5 || checks > 8) {
						clearInterval(guardInterval);
						if (!hasConfirmedResume) {
							hasConfirmedResume = true;
							try {
								window.top.postMessage({
									type: "AL_RESUME_CONFIRMED",
									time: target
								}, "*");
							} catch (_) {}
						}
					}
				}, 400);
				pendingResumeSeek = null;
			} else pendingResumeSeek = target;
		}
		function getPlayer() {
			const uWin = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
			return typeof uWin.jwplayer === "function" ? uWin.jwplayer() : null;
		}
		function getVidstack() {
			return document.querySelector("media-player");
		}
		function getPos() {
			const jw = getPlayer();
			if (jw && typeof jw.getPosition === "function") {
				const p = jw.getPosition();
				if (typeof p === "number" && !isNaN(p)) return p;
			}
			const vds = getVidstack();
			if (vds && typeof vds.currentTime === "number" && !isNaN(vds.currentTime)) return vds.currentTime;
			return document.querySelector("video")?.currentTime || 0;
		}
		function getDuration() {
			const jw = getPlayer();
			if (jw && typeof jw.getDuration === "function") {
				const d = jw.getDuration();
				if (typeof d === "number" && !isNaN(d) && d > 0) return d;
			}
			const vds = getVidstack();
			if (vds && typeof vds.duration === "number" && !isNaN(vds.duration) && vds.duration > 0) return vds.duration;
			return document.querySelector("video")?.duration || 0;
		}
		function notifyReady() {
			const dur = getDuration();
			if (dur > 0) {
				const now = Date.now();
				if (Math.round(dur) !== Math.round(lastReportedDur)) {
					lastReportedDur = dur;
					try {
						window.top.postMessage({
							type: "AU_FRAME_READY",
							duration: dur
						}, "*");
					} catch (_) {}
				}
				if (now - lastReadyNotice > 1e3) {
					lastReadyNotice = now;
					try {
						window.top.postMessage({
							type: "AL_PLAYER_READY",
							duration: dur
						}, "*");
					} catch (_) {}
				}
				if (pendingResumeSeek !== null) applyResumeSeek(pendingResumeSeek);
			}
		}
		function bindMediaEvents() {
			const video = document.querySelector("video");
			if (video && !video.__au_skip_bound) {
				video.__au_skip_bound = true;
				video.addEventListener("timeupdate", () => {
					checkTime();
					broadcastPlaybackState();
				});
				video.addEventListener("play", () => {
					handlePlayResumeGuard();
					broadcastPlaybackState(true);
				});
				video.addEventListener("pause", () => broadcastPlaybackState(true));
				video.addEventListener("ended", () => broadcastPlaybackState(true));
				video.addEventListener("canplay", () => notifyReady());
				video.addEventListener("playing", () => notifyReady());
				video.addEventListener("loadedmetadata", () => {
					notifyReady();
					computeAdjustedOp();
					broadcastPlaybackState(true);
				});
				video.addEventListener("durationchange", () => {
					notifyReady();
					computeAdjustedOp();
					broadcastPlaybackState(true);
				});
			}
			const jw = getPlayer();
			if (jw && typeof jw.on === "function" && !jw.__au_skip_bound) {
				jw.__au_skip_bound = true;
				jw.on("time", () => {
					checkTime();
					broadcastPlaybackState();
				});
				jw.on("play", () => {
					handlePlayResumeGuard();
					notifyReady();
					broadcastPlaybackState(true);
				});
				jw.on("pause", () => broadcastPlaybackState(true));
				jw.on("complete", () => broadcastPlaybackState(true));
				jw.on("ready", () => notifyReady());
				jw.on("firstFrame", () => notifyReady());
				jw.on("meta", () => {
					notifyReady();
					computeAdjustedOp();
					broadcastPlaybackState(true);
				});
			}
			const vds = getVidstack();
			if (vds && !vds.__au_skip_bound) {
				vds.__au_skip_bound = true;
				vds.addEventListener("can-play", () => notifyReady());
				vds.addEventListener("play", () => {
					handlePlayResumeGuard();
					broadcastPlaybackState(true);
				});
				vds.addEventListener("pause", () => broadcastPlaybackState(true));
				vds.addEventListener("ended", () => broadcastPlaybackState(true));
			}
		}
		function computeAdjustedOp() {
			if (!rawOp) {
				currentOp = null;
				return;
			}
			const dur = getDuration();
			let offset = 0;
			if (dur > 0 && rawOp.episodeLength > 0 && rawOp.start > 0) {
				const diff = rawOp.episodeLength - dur;
				if (diff >= .5 && diff <= 35 && rawOp.start >= diff) offset = diff;
			}
			currentOp = {
				start: Math.max(0, rawOp.start - offset),
				end: Math.max(0, rawOp.end - offset)
			};
		}
		function seekTo(target) {
			if (typeof target !== "number" || isNaN(target) || target <= 0) return;
			const jw = getPlayer();
			if (jw && typeof jw.seek === "function") try {
				jw.seek(target);
			} catch (_) {}
			const vds = getVidstack();
			if (vds && typeof vds.currentTime !== "undefined") try {
				vds.currentTime = target;
			} catch (_) {}
			const v = document.querySelector("video");
			if (v) try {
				v.currentTime = target;
			} catch (_) {}
		}
		function skipIntro(isAuto = false) {
			if (!currentOp) return;
			const target = Math.max(0, currentOp.end - 1);
			Logger.info(`⏩ ${isAuto ? "Auto-skipped" : "User skipped"} intro to ${target.toFixed(2)}s`);
			seekTo(target);
			if (btn) {
				btn.style.display = "none";
				isBtnVisible = false;
			}
		}
		function fallbackSkip() {
			const pos = getPos();
			const dur = getDuration();
			const target = dur > 0 ? Math.min(dur - 1, pos + skipFallbackDuration) : pos + skipFallbackDuration;
			Logger.info(`⏩ Fallback skip (+${skipFallbackDuration}s) to ${target.toFixed(2)}s`);
			seekTo(target);
			if (btn) {
				btn.style.display = "none";
				isBtnVisible = false;
			}
		}
		function handleSkipAction() {
			const now = Date.now();
			if (now - lastSkipTime < 500) return;
			lastSkipTime = now;
			const pos = getPos();
			const showStart = currentOp ? Math.max(0, currentOp.start - 1.5) : 0;
			const showEnd = currentOp ? Math.max(showStart, currentOp.end - 2) : 0;
			if (currentOp && pos >= showStart && pos <= showEnd) skipIntro(false);
			else fallbackSkip();
		}
		function ensureButton() {
			if (btn && btn.parentElement) return;
			btn = document.createElement("button");
			btn.id = "au-skip-intro-btn";
			btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><polygon points="19 5 19 19"></polygon></svg>
      <span>Skip Intro (S)</span>
    `;
			[
				"mousedown",
				"mouseup",
				"pointerdown",
				"touchstart",
				"click"
			].forEach((evt) => {
				btn.addEventListener(evt, (e) => {
					e.stopPropagation();
					e.stopImmediatePropagation();
					if (evt === "click") {
						e.preventDefault();
						skipIntro(false);
					}
				}, true);
			});
			const target = document.querySelector(".jw-wrapper, .jwplayer, #player, .player, .video-container, video")?.parentElement || document.body;
			if (window.getComputedStyle(target).position === "static") target.style.position = "relative";
			target.appendChild(btn);
		}
		function checkTime() {
			bindMediaEvents();
			if (activeResumeTarget !== null && getPos() >= activeResumeTarget - 3) activeResumeTarget = null;
			if (getDuration() > 0 && Math.round(getDuration()) !== Math.round(lastReportedDur)) notifyReady();
			if (!rawOp) {
				if (btn && isBtnVisible) {
					btn.style.display = "none";
					isBtnVisible = false;
				}
				return;
			}
			computeAdjustedOp();
			if (!currentOp) return;
			const pos = getPos();
			if (autoSkip) {
				if (btn && isBtnVisible) {
					btn.style.display = "none";
					isBtnVisible = false;
				}
				if (pos >= currentOp.start && pos < currentOp.end - 1) {
					if (!hasAutoSkipped) {
						hasAutoSkipped = true;
						skipIntro(true);
					}
				} else if (pos < currentOp.start - 5) hasAutoSkipped = false;
				return;
			}
			const showStart = Math.max(0, currentOp.start - 1.5);
			const showEnd = Math.max(showStart, currentOp.end - 2);
			if (pos >= showStart && pos <= showEnd) {
				if (!isBtnVisible) {
					ensureButton();
					btn.style.display = "inline-flex";
					isBtnVisible = true;
				}
			} else if (isBtnVisible && btn) {
				btn.style.display = "none";
				isBtnVisible = false;
			}
		}
		window.addEventListener("message", (e) => {
			if (e.data?.type === "AU_SKIP_OP") {
				rawOp = e.data.op || null;
				autoSkip = !!e.data.autoSkip;
				if (typeof e.data.skipFallbackDuration === "number" && e.data.skipFallbackDuration > 0) skipFallbackDuration = e.data.skipFallbackDuration;
				hasAutoSkipped = false;
				computeAdjustedOp();
				checkTime();
			} else if (e.data?.type === "AU_TRIGGER_SKIP") handleSkipAction();
			else if (e.data?.type === "AL_RESUME_SEEK") applyResumeSeek(e.data.target);
		});
		window.addEventListener("keydown", (e) => {
			if (e.key === "s" || e.key === "S") {
				const tag = document.activeElement?.tagName?.toLowerCase();
				if (tag === "input" || tag === "textarea" || tag === "select") return;
				e.preventDefault();
				handleSkipAction();
			}
		}, true);
		setInterval(checkTime, 250);
		notifyReady();
	}
	function requestJson(url, options = {}) {
		return new Promise((resolve) => {
			if (typeof GM_xmlhttpRequest === "function") GM_xmlhttpRequest({
				method: options.method || "GET",
				url,
				headers: options.headers || {},
				data: options.body || null,
				timeout: 8e3,
				onload: (res) => {
					if (res.status >= 200 && res.status < 300) try {
						resolve(JSON.parse(res.responseText));
					} catch (_) {
						resolve(null);
					}
					else resolve(null);
				},
				onerror: () => resolve(null),
				ontimeout: () => resolve(null)
			});
			else fetch(url, options).then((r) => r.ok ? r.json() : null).then(resolve).catch(() => resolve(null));
		});
	}
	function requestText(url, options = {}) {
		return new Promise((resolve) => {
			if (typeof GM_xmlhttpRequest === "function") GM_xmlhttpRequest({
				method: options.method || "GET",
				url,
				headers: options.headers || {},
				data: options.body || null,
				timeout: 8e3,
				onload: (res) => {
					if (res.status >= 200 && res.status < 400) resolve(res.responseText || "");
					else resolve(null);
				},
				onerror: () => resolve(null),
				ontimeout: () => resolve(null)
			});
			else fetch(url, options).then((r) => r.ok ? r.text() : null).then(resolve).catch(() => resolve(null));
		});
	}
	async function resolveSaturnUrl(media, targetEp = 1) {
		const asBase = Storage.get("al_as_base") || "https://www.animesaturn.net";
		if (!media?.id) return asBase;
		const isDubPref = (Storage.get("al_pref_language") || "sub") === "dub";
		const rawMap = Storage.get("al_as_map");
		const map = rawMap && typeof rawMap === "object" && !Array.isArray(rawMap) ? rawMap : {};
		const cached = map[media.id];
		if (cached?.slug) {
			const mediaSeason = extractSeason(media.title?.romaji || media.title?.english || media.title?.userPreferred || "");
			const cachedSeason = cached.title ? extractSeason(cached.title) : null;
			if ((cachedSeason === null || cachedSeason === mediaSeason) && (cached.dub === void 0 || cached.dub === 1 === isDubPref || cached.hasAlternativeDub === false)) return `${asBase}/anime/${cached.slug}/ep-${targetEp}`;
		}
		const candidates = generateSearchCandidates$1(media);
		for (const query of candidates) try {
			const results = (await requestJson(`${asBase}/api/search?q=${encodeURIComponent(query)}`))?.results || [];
			if (!results.length) continue;
			const best = results.map((r) => ({
				result: r,
				score: scoreSearchResult(r, media, isDubPref)
			})).sort((a, b) => b.score - a.score)[0];
			if (best && best.score >= 50 && best.result?.url) {
				const chosen = best.result;
				const slug = chosen.url.replace(/^\/anime\//, "").replace(/\/$/, "");
				const isDub = chosen.title?.includes("(ITA)") || chosen.url?.includes("-ita-") ? 1 : 0;
				map[media.id] = {
					slug,
					dub: isDub,
					hasAlternativeDub: results.length > 1,
					title: chosen.title,
					updatedAt: Date.now()
				};
				Storage.set("al_as_map", map);
				return `${asBase}/anime/${slug}/ep-${targetEp}`;
			}
		} catch (_) {}
		const title = media.title?.english || media.title?.romaji || media.title?.userPreferred || "";
		return `${asBase}/filter?key=${encodeURIComponent(cleanTitle$1(title))}`;
	}
	async function resolveUnityUrl(media, targetEp = 1) {
		const auBase = Storage.get("al_au_base") || "https://www.animeunity.co";
		if (!media?.id) return auBase;
		const prefDubInt = (Storage.get("al_pref_language") || "sub") === "dub" ? 1 : 0;
		const rawMap = Storage.get("al_au_map");
		const map = rawMap && typeof rawMap === "object" && !Array.isArray(rawMap) ? rawMap : {};
		const cached = map[media.id];
		if (cached?.id && cached?.slug) {
			if (cached.dub === void 0 || cached.dub === prefDubInt || cached.hasAlternativeDub === false) return `${auBase}/anime/${cached.id}-${cached.slug}?ep=${targetEp}`;
		}
		const candidates = generateSearchCandidates$1(media);
		for (const query of candidates) try {
			const html = await requestText(`${auBase}/archivio?title=${encodeURIComponent(query)}`);
			if (!html) continue;
			const m = html.match(/<archivio\s+records="([^"]+)"/i);
			if (!m || !m[1]) continue;
			const rawJson = m[1].replace(/&quot;/g, "\"");
			const records = JSON.parse(rawJson);
			if (!Array.isArray(records) || !records.length) continue;
			const matches = records.filter((r) => r.anilist_id === media.id);
			let chosen = null;
			if (matches.length > 0) chosen = matches.find((r) => r.dub === 1 === (prefDubInt === 1)) || matches[0];
			else {
				const scored = records.map((r) => ({
					record: r,
					score: scoreSearchResult(r, media, prefDubInt === 1)
				})).sort((a, b) => b.score - a.score);
				if (scored[0] && scored[0].score >= 50) chosen = scored[0].record;
			}
			if (chosen?.id && chosen?.slug) {
				map[media.id] = {
					id: chosen.id,
					slug: chosen.slug,
					dub: chosen.dub,
					hasAlternativeDub: records.length > 1,
					title: chosen.title,
					updatedAt: Date.now()
				};
				Storage.set("al_au_map", map);
				return `${auBase}/anime/${chosen.id}-${chosen.slug}?ep=${targetEp}`;
			}
		} catch (_) {}
		const title = media.title?.english || media.title?.romaji || media.title?.userPreferred || "";
		return `${auBase}/archivio?title=${encodeURIComponent(cleanTitle$1(title))}`;
	}
	function renderCrossSwitch({ media, activeEp = 0, provider = null } = {}) {
		const isUnity = provider?.name === "AnimeUnity";
		const targetSiteName = isUnity ? "AnimeSaturn" : "AnimeUnity";
		const targetIcon = isUnity ? Globe : Tv;
		const targetEp = activeEp > 0 ? activeEp : 1;
		let container = null;
		if (isUnity) container = document.getElementById("video-top");
		else container = document.querySelector(".watch-toolbar") || document.querySelector(".player-card") || document.querySelector(".ag-cta");
		const existing = document.getElementById("al-cross-switch-btn");
		if (!container || !media) {
			existing?.remove();
			return;
		}
		let btn = existing;
		if (!btn) {
			btn = document.createElement("button");
			btn.type = "button";
			btn.id = "al-cross-switch-btn";
			btn.className = `al-cross-switch-btn ${isUnity ? "for-saturn" : "for-unity"}`;
			container.appendChild(btn);
		} else btn.className = `al-cross-switch-btn ${isUnity ? "for-saturn" : "for-unity"}`;
		btn.title = `Switch to ${targetSiteName} · Open Ep. ${targetEp}`;
		btn.innerHTML = `
    <span class="al-switch-icon">${iconHtml(targetIcon, {
			width: 13,
			height: 13
		})}</span>
    <span class="al-switch-label">${targetSiteName}</span>
    <span class="al-switch-ep">Ep. ${targetEp}</span>
    ${iconHtml(ExternalLink, {
			width: 11,
			height: 11,
			class: "al-switch-ext"
		})}
  `;
		btn.onclick = async (e) => {
			e.preventDefault();
			e.stopPropagation();
			btn.classList.add("is-loading");
			btn.innerHTML = `${iconHtml(LoaderCircle, {
				width: 12,
				height: 12,
				class: "al-spin"
			})} <span>Opening ${targetSiteName}...</span>`;
			showToast(`⚡ Switching to ${targetSiteName} (Ep. ${targetEp})...`, false, 2500);
			try {
				const url = isUnity ? await resolveSaturnUrl(media, targetEp) : await resolveUnityUrl(media, targetEp);
				if (url) {
					window.location.href = url;
					return;
				}
			} catch (err) {
				Logger.error("Cross switch error:", err);
			}
			const auBase = Storage.get("al_au_base") || "https://www.animeunity.co";
			const asBase = Storage.get("al_as_base") || "https://www.animesaturn.net";
			const title = media.title?.english || media.title?.romaji || media.title?.userPreferred || "";
			if (isUnity) window.location.href = `${asBase}/filter?key=${encodeURIComponent(cleanTitle$1(title))}`;
			else window.location.href = `${auBase}/archivio?title=${encodeURIComponent(cleanTitle$1(title))}`;
		};
	}
	var provider = null;
	var currentUser = null;
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
		preventRewind: false
	};
	var cancelledEps = new Set();
	var isHome = () => {
		return provider ? provider.isHome() : false;
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
	var lastNotesSyncTime = 0;
	var lastSyncedResumeTime = 0;
	var hasTriggeredPlayTrack = false;
	var pendingResumeTarget = null;
	var pendingResumeEp = null;
	function prepareResumeTarget(force = false) {
		if (!Settings.get().autoResume) {
			pendingResumeTarget = null;
			pendingResumeEp = null;
			return;
		}
		const activeEp = provider?.getActiveEpisode?.() || 1;
		const sessionTime = sessionStorage.getItem("al_resume_time");
		const sessionTargetEp = sessionStorage.getItem("al_target_ep");
		let targetTime = null;
		if (sessionTime) {
			const parsedTime = parseInt(sessionTime, 10);
			const parsedEp = sessionTargetEp ? parseInt(sessionTargetEp, 10) : null;
			if (!parsedEp || parsedEp === activeEp) targetTime = parsedTime;
		}
		if (!targetTime && currentMedia) {
			const resume = Resume.extract(currentMedia?.mediaListEntry?.notes) || Resume.getLocal(currentMedia?.id);
			if (resume && resume.ep === activeEp && resume.time > 15 && resume.percent < 88) targetTime = resume.time;
		}
		if (targetTime && targetTime > 0) {
			pendingResumeTarget = targetTime;
			pendingResumeEp = activeEp;
		} else if (force) {
			pendingResumeTarget = null;
			pendingResumeEp = null;
		}
	}
	function dispatchResumeSeek(targetWindow = null) {
		if (!pendingResumeTarget || !Settings.get().autoResume) return;
		const payload = {
			type: "AL_RESUME_SEEK",
			target: pendingResumeTarget
		};
		if (targetWindow) try {
			targetWindow.postMessage(payload, "*");
		} catch (_) {}
		else document.querySelectorAll("iframe").forEach((frame) => {
			try {
				frame.contentWindow?.postMessage(payload, "*");
			} catch (_) {}
		});
	}
	async function syncResumeToNotes(mediaId, ep, currentTime, duration) {
		if (!currentMedia?.mediaListEntry || !Settings.get().crossDeviceSync) return;
		const curNotes = currentMedia.mediaListEntry.notes || "";
		const updated = Resume.apply(curNotes, {
			ep,
			time: currentTime,
			duration
		});
		if (updated === curNotes) return;
		currentMedia.mediaListEntry.notes = updated;
		try {
			await AniListAPI.saveEntry({
				mediaId,
				notes: updated
			});
		} catch (_) {}
	}
	function handlePlaybackState({ currentTime, duration, isPaused, isEnded }) {
		if (!currentMedia || isHome()) return;
		const activeEp = provider?.getActiveEpisode?.() || 1;
		const settings = Settings.get();
		const percent = duration > 0 ? currentTime / duration * 100 : 0;
		if (currentTime > 10 && percent < 92) Resume.setLocal(currentMedia.id, {
			ep: activeEp,
			time: Math.round(currentTime),
			duration: Math.round(duration),
			percent: Math.round(percent)
		});
		if (settings.autoTrack && settings.trackTrigger === "play" && !isPaused && currentTime > 3 && !hasTriggeredPlayTrack && activeEp > trackedProgress && !cancelledEps.has(activeEp)) {
			hasTriggeredPlayTrack = true;
			App.setProgress(activeEp);
			return;
		}
		const threshold = settings.completionThreshold || 85;
		if (settings.autoTrack && settings.trackTrigger === "completion" && (percent >= threshold || isEnded) && activeEp > trackedProgress && !cancelledEps.has(activeEp)) {
			cancelledEps.add(activeEp);
			Resume.clearLocal(currentMedia.id);
			App.setProgress(activeEp);
			return;
		}
		if (settings.crossDeviceSync && currentUser?.id && currentTime > 15 && percent < 85) {
			const now = Date.now();
			const timeDiff = Math.abs(currentTime - lastSyncedResumeTime);
			if (isPaused || now - lastNotesSyncTime >= 6e4 && timeDiff >= 15) {
				lastNotesSyncTime = now;
				lastSyncedResumeTime = currentTime;
				syncResumeToNotes(currentMedia.id, activeEp, currentTime, duration);
			}
		}
	}
	function handleActiveEpisodeChange(newActiveEp) {
		if (!newActiveEp || newActiveEp === lastActiveEp) return;
		lastActiveEp = newActiveEp;
		cancelAutoTrack();
		hasTriggeredPlayTrack = false;
		const info = provider?.getAnimeInfo() || {};
		const malId = currentMedia?.idMal || info.malId;
		if (malId) checkSkipIntro(malId, newActiveEp);
		prepareResumeTarget(true);
		dispatchResumeSeek();
		const settings = Settings.get();
		if (settings.autoTrack && settings.trackTrigger === "delay" && currentMedia && newActiveEp > trackedProgress && !cancelledEps.has(newActiveEp)) {
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
	async function findMediaByTitle(title, expectedTotalEp = null) {
		if (!title) return null;
		const cleaned = cleanTitle$1(title);
		const targetSeason = extractSeason(title);
		const candidates = (await AniListAPI.searchMedia(cleaned) || (cleaned !== title ? await AniListAPI.searchMedia(title) : null))?.Page?.media || [];
		if (candidates.length > 0) {
			const scored = candidates.map((m) => {
				let score = 0;
				const mTitle = m.title?.romaji || m.title?.english || m.title?.userPreferred || "";
				if (extractSeason(mTitle) === targetSeason) score += 100;
				else score -= 100;
				if (expectedTotalEp && m.episodes) {
					if (m.episodes === expectedTotalEp) score += 40;
					else if (Math.abs(m.episodes - expectedTotalEp) <= 2) score += 15;
					else if (m.episodes <= 3 && expectedTotalEp > 10) score -= 60;
				}
				if (m.format === "TV") score += 30;
				else if (m.format === "OVA" || m.format === "SPECIAL") score -= 50;
				const lowerM = mTitle.toLowerCase();
				const lowerQ = cleaned.toLowerCase();
				for (const word of [
					"quest",
					"picture drama",
					"recap",
					"special",
					"drama cd"
				]) if (lowerM.includes(word) && !lowerQ.includes(word)) score -= 80;
				return {
					media: m,
					score
				};
			}).sort((a, b) => b.score - a.score);
			if (scored[0] && scored[0].score > 0) return scored[0].media;
			return candidates[0];
		}
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
		const anchor = provider?.getShelfAnchor?.();
		if (!anchor || !anchor.element) return;
		const shelfRow = document.createElement("div");
		shelfRow.className = "row al-home-shelf-row";
		const shelfCol = document.createElement("div");
		shelfCol.className = "col-12";
		shelfCol.appendChild(shelfElement);
		shelfRow.appendChild(shelfCol);
		if (anchor.position === "after") anchor.element.after(shelfRow);
		else if (anchor.position === "before") anchor.element.before(shelfRow);
		else if (anchor.position === "prepend") anchor.element.prepend(shelfRow);
		else anchor.element.appendChild(shelfRow);
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
				notifs.push({
					mediaId: entry.mediaId,
					buddy: buddyName,
					avatar: Buddy.getAvatar(buddyName) || "https://anilist.co/img/icons/icon.svg",
					buddyEp: buddyProgress,
					myEp: myProgress,
					isAhead,
					isBuddyCompleted: !!isBuddyCompleted,
					canSync: isAhead || isBuddyCompleted && entry.status !== "COMPLETED",
					title
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
			else if (isReset) targetStatus = prevStatus === "COMPLETED" || isRewatching ? "REPEATING" : "CURRENT";
			else targetStatus = prevStatus === "COMPLETED" || isRewatching ? "REPEATING" : "CURRENT";
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
			if (entry?.notes && entry.notes.includes("[resume:")) {
				const cleared = Resume.clear(entry.notes);
				params.notes = cleared;
				if (entry) entry.notes = cleared;
			}
			Resume.clearLocal(id);
			if ((await AniListAPI.saveEntry(params))?.SaveMediaListEntry) {
				cancelledEps.delete(newProgress);
				showToast(isReset ? `Progress reset to Ep. 0 (${AniListAPI.statuses[targetStatus] || targetStatus})` : trackedProgress > 0 && newProgress < trackedProgress ? `↺ Rewound to Ep. ${newProgress}` : isCompleted ? isRewatching ? `🎉 Rewatch completed (${(entry?.repeat || 0) + 1}×)!` : "🎉 Completed on AniList!" : `Episode ${newProgress} saved`);
				if (isSinglePage) App.sync();
				else await loadHomeWatching();
			}
		},
		render() {
			const hasToken = !!Storage.get("anilist_token");
			const activeEp = provider?.getActiveEpisode?.() || 0;
			renderNav(currentUser, {
				onLogin: openAuth,
				onLogout: () => App.logout(),
				onChangeToken: openAuth
			}, provider);
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
				},
				onSave: (ep) => {
					cancelAutoTrack();
					App.setProgress(ep);
				},
				onCancelCountdown: () => {
					if (autoTrackState.targetEp) cancelledEps.add(autoTrackState.targetEp);
					cancelAutoTrack();
					App.render();
				},
				onRewind: (rewindTarget, currentActiveEp) => {
					cancelAutoTrack();
					if (currentActiveEp) cancelledEps.add(currentActiveEp);
					App.setProgress(rewindTarget);
				}
			}, {
				isLoading: isMediaLoading,
				viewer: currentUser,
				defaultBuddy: Settings.get().defaultBuddy,
				buddyData: currentBuddyData,
				provider,
				activeEp,
				trackedProgress,
				autoTrackState
			});
			provider?.highlightEpisodes(trackedProgress);
			renderCrossSwitch({
				media: currentMedia,
				activeEp,
				provider
			});
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
				const info = provider?.getAnimeInfo() || {};
				if (info.anilistId) currentMedia = (await AniListAPI.getMediaById(info.anilistId))?.Media || null;
				if (!currentMedia && info.malId) currentMedia = (await AniListAPI.getMediaByMalId(info.malId))?.Media || null;
				if (!currentMedia && typeof provider?.fetchRemoteMetadata === "function") {
					const remote = await provider.fetchRemoteMetadata();
					if (remote?.anilistId) currentMedia = (await AniListAPI.getMediaById(remote.anilistId))?.Media || null;
					else if (remote?.malId) currentMedia = (await AniListAPI.getMediaByMalId(remote.malId))?.Media || null;
				}
				if (!currentMedia && info.romajiTitle) currentMedia = await findMediaByTitle(info.romajiTitle, info.totalEp);
				if (!currentMedia && info.title) currentMedia = await findMediaByTitle(info.title, info.totalEp);
				if (!currentMedia && currentTitle) currentMedia = await findMediaByTitle(currentTitle, info.totalEp);
				if (currentMedia?.id) {
					if (provider?.name === "AnimeUnity") {
						const match = window.location.pathname.match(/\/anime\/(\d+)(?:-([^/]+))?/i);
						if (match && match[1]) {
							const rawMap = Storage.get("al_au_map");
							const map = rawMap && typeof rawMap === "object" && !Array.isArray(rawMap) ? rawMap : {};
							map[currentMedia.id] = {
								id: parseInt(match[1], 10),
								slug: match[2] || "",
								updatedAt: Date.now()
							};
							Storage.set("al_au_map", map);
						}
					} else if (provider?.name === "AnimeSaturn") {
						const match = window.location.pathname.match(/\/anime\/([^/]+)/i);
						if (match && match[1]) {
							const rawMap = Storage.get("al_as_map");
							const map = rawMap && typeof rawMap === "object" && !Array.isArray(rawMap) ? rawMap : {};
							map[currentMedia.id] = {
								slug: match[1],
								malId: currentMedia.idMal || void 0,
								updatedAt: Date.now()
							};
							Storage.set("al_as_map", map);
						}
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
				if (!isHome()) {
					if (provider?.name === "AnimeUnity") autoSelectTargetEpisode(currentMedia, trackedProgress);
					const ep = provider?.getActiveEpisode?.() || 1;
					const malId = currentMedia?.idMal || info.malId;
					if (malId) checkSkipIntro(malId, ep);
					prepareResumeTarget();
					dispatchResumeSeek();
				}
			} catch (err) {
				Logger.warn("Error during AniList sync:", err);
			} finally {
				isMediaLoading = false;
				App.render();
			}
		},
		init() {
			initSkipIntroTop();
			App.loadUser();
			prepareResumeTarget();
			window.addEventListener("message", (e) => {
				if (e.data?.type === "AL_PLAYBACK_STATE") handlePlaybackState(e.data);
				else if (e.data?.type === "AL_PLAYER_READY" || e.data?.type === "AU_FRAME_READY") {
					if (!pendingResumeTarget) prepareResumeTarget();
					if (pendingResumeTarget) dispatchResumeSeek(e.source);
				} else if (e.data?.type === "AL_RESUME_CONFIRMED") {
					const activeEp = pendingResumeEp || provider?.getActiveEpisode?.() || 1;
					const resumeTime = e.data.time || pendingResumeTarget;
					pendingResumeTarget = null;
					pendingResumeEp = null;
					sessionStorage.removeItem("al_resume_time");
					sessionStorage.removeItem("al_target_ep");
					if (resumeTime) showToast(`↺ Resumed Ep. ${activeEp} at ${Resume.formatTime(resumeTime)}`, false, 2500);
				}
			});
			const handlePageExit = () => {
				if (currentMedia && currentUser?.id) {
					const local = Resume.getLocal(currentMedia.id);
					if (local && local.time > 15 && local.percent < 85) syncResumeToNotes(currentMedia.id, local.ep, local.time, local.duration);
				}
			};
			document.addEventListener("visibilitychange", () => {
				if (document.hidden) handlePageExit();
			});
			window.addEventListener("beforeunload", handlePageExit);
			window.addEventListener("pagehide", handlePageExit);
			Settings.subscribe((settings) => {
				if (!settings.autoTrack) cancelAutoTrack();
				App.render();
			});
			document.addEventListener("click", (e) => {
				document.querySelectorAll("#al-nav-dropdown, #al-nav-m-dropdown").forEach((d) => {
					if (!d.contains(e.target) && !e.target.closest("#al-nav-desktop, #al-nav-mobile")) d.classList.remove("show");
				});
				if (e.target.closest(".episode-wrapper .episode-item, .ep-tile, a[href*='/ep-'], #video-bottom a.prev, #video-bottom a.next, .wt-btn")) setTimeout(() => {
					const ep = provider?.getActiveEpisode?.();
					if (ep) handleActiveEpisodeChange(ep);
				}, 100);
			});
			let lastPath = window.location.pathname;
			setInterval(() => {
				if (window.location.pathname !== lastPath) {
					lastPath = window.location.pathname;
					if (isHome()) loadHomeWatching();
					else App.sync();
				}
				if (isHome()) {
					if (currentUser?.id && homeEntries === null && !homeFetching) loadHomeWatching();
					else if (!document.getElementById("al-home-continue-watching")) renderHome();
				} else {
					const shelf = document.getElementById("al-home-continue-watching");
					if (shelf) shelf.closest(".al-home-shelf-row")?.remove() || shelf.remove();
					const info = provider?.getAnimeInfo() || {};
					if (info.title && info.title !== currentTitle) {
						currentTitle = info.title;
						App.sync();
					}
					const ep = provider?.getActiveEpisode?.();
					if (ep && ep !== lastActiveEp) handleActiveEpisodeChange(ep);
					provider?.highlightEpisodes(trackedProgress);
				}
				const hasNav = document.getElementById("al-nav-desktop");
				const hasBar = document.getElementById("al-control-bar");
				if (!hasNav || !isHome() && !hasBar) App.render();
			}, 700);
		}
	};
	if (window.location.hostname.includes("vixcloud") || window.location.hostname.includes("saturncdn")) initPlayer();
	else {
		provider = getProvider();
		if (provider?.name === "AnimeUnity") Storage.set("al_au_base", window.location.origin);
		else if (provider?.name === "AnimeSaturn") Storage.set("al_as_base", window.location.origin);
		currentUser = Buddy.getViewer();
		handleUrlToken();
		App.init();
	}
})();
