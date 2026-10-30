// ==UserScript==
// @name         AniList Friend List - Quick Add & Sync
// @namespace    https://github.com/pallax03/my-userscripts
// @version      0.3.0
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
	_css(".al-badge{white-space:nowrap;-webkit-backdrop-filter:blur(8px);border:1px solid #0000;border-radius:6px;align-items:center;gap:5px;padding:3px 8px;font-size:11px;font-weight:700;line-height:1.2;display:inline-flex}.al-badge svg{flex-shrink:0}.al-badge.al-badge-CURRENT{color:#76caf6;background:#3db4f229;border-color:#3db4f273}.al-badge.al-badge-CURRENT .al-dot{background:#3db4f2;box-shadow:0 0 6px #3db4f299}.al-badge.al-badge-PLANNING{color:#b9c3d0;background:#94a3b829;border-color:#94a3b873}.al-badge.al-badge-PLANNING .al-dot{background:#94a3b8;box-shadow:0 0 6px #94a3b899}.al-badge.al-badge-COMPLETED{color:#45df7e;background:#22c55e29;border-color:#22c55e73}.al-badge.al-badge-COMPLETED .al-dot{background:#22c55e;box-shadow:0 0 6px #22c55e99}.al-badge.al-badge-PAUSED{color:#f8c937;background:#eab30829;border-color:#eab30873}.al-badge.al-badge-PAUSED .al-dot{background:#eab308;box-shadow:0 0 6px #eab30899}.al-badge.al-badge-REPEATING{color:#1fd9f9;background:#06b6d429;border-color:#06b6d473}.al-badge.al-badge-REPEATING .al-dot{background:#06b6d4;box-shadow:0 0 6px #06b6d499}.al-badge.al-badge-DROPPED{color:#f47c7c;background:#ef444429;border-color:#ef444473}.al-badge.al-badge-DROPPED .al-dot{background:#ef4444;box-shadow:0 0 6px #ef444499}.al-dot{border-radius:50%;flex-shrink:0;width:6px;height:6px;display:inline-block}.al-btn{cursor:pointer;white-space:nowrap;border:1px solid #0000;border-radius:9px;justify-content:center;align-items:center;gap:6px;padding:8px 16px;font-size:13px;font-weight:700;text-decoration:none;transition:all .2s cubic-bezier(.4,0,.2,1);display:inline-flex}.al-btn:hover{text-decoration:none;transform:translateY(-1px)}.al-btn:active{transform:translateY(0)}.al-btn.primary{background:linear-gradient(135deg,#3db4f2 0%,#0284c7 100%);box-shadow:0 4px 14px #3db4f259;color:#06101e!important}.al-btn.primary:hover{filter:brightness(1.08);box-shadow:0 6px 20px #3db4f28c;color:#06101e!important}.al-btn.secondary{background:#ffffff14;border-color:#ffffff26;color:#e2e8f0!important}.al-btn.secondary:hover{background:#ffffff24;color:#fff!important}.al-btn.danger{background:#ef444426;border-color:#ef444459;color:#fca5a5!important}.al-btn.danger:hover{background:#ef444447;border-color:#ef4444;color:#fff!important}.al-overlay{-webkit-backdrop-filter:blur(16px);animation:.2s al-fade-in;inset:0!important;box-sizing:border-box!important;z-index:2147483647!important;pointer-events:auto!important;visibility:visible!important;opacity:1!important;background:#03070dd9!important;justify-content:center!important;align-items:center!important;width:100vw!important;min-width:100vw!important;height:100vh!important;min-height:100vh!important;margin:0!important;padding:16px!important;display:flex!important;position:fixed!important;inset:0!important}.al-overlay.al-overlay-drawer{justify-content:flex-end!important;align-items:stretch!important;padding:0!important}.al-modal{color:#fff;background:linear-gradient(135deg,#101a27 0%,#080f18 100%);border:1px solid #3db4f259;border-radius:16px;width:90%;max-width:440px;max-height:calc(100vh - 32px);padding:24px;animation:.25s cubic-bezier(.16,1,.3,1) al-modal-in;overflow-y:auto;box-shadow:0 20px 60px #000000d9,0 0 30px #3db4f22e;z-index:2147483647!important;pointer-events:auto!important;visibility:visible!important;opacity:1!important;box-sizing:border-box!important;position:relative!important}.al-modal .al-modal-header{justify-content:space-between;align-items:center;gap:14px;margin-bottom:18px;display:flex}.al-modal .al-modal-header .al-modal-header-left{align-items:center;gap:14px;min-width:0;display:flex}.al-modal .al-modal-header .al-modal-close-btn{color:#94a3b8;cursor:pointer;background:#ffffff0f;border:1px solid #ffffff1a;border-radius:9px;flex-shrink:0;justify-content:center;align-items:center;width:32px;height:32px;transition:all .15s;display:inline-flex}.al-modal .al-modal-header .al-modal-close-btn:hover{color:#fff;background:#ffffff24;border-color:#ffffff38;transform:scale(1.05)}.al-modal .al-modal-icon{color:#3db4f2;background:linear-gradient(135deg,#3db4f233,#0284c71a);border:1px solid #3db4f266;border-radius:12px;flex-shrink:0;justify-content:center;align-items:center;width:44px;height:44px;display:flex;box-shadow:0 0 15px #3db4f24d}.al-modal .al-modal-title{color:#fff;margin:0;font-size:18px;font-weight:700;line-height:1.2}.al-modal .al-modal-subtitle{color:#94a3b8;margin:3px 0 0;font-size:12px;line-height:1.3}.al-modal .al-modal-body{flex-direction:column;gap:12px;display:flex}.al-modal .al-modal-actions{justify-content:flex-end;align-items:center;gap:10px;margin-top:20px;display:flex}.al-auth-link{background:linear-gradient(135deg,#3db4f226,#0ea5e914);border:1px solid #3db4f259;border-radius:10px;justify-content:space-between;align-items:center;padding:11px 14px;font-size:13px;font-weight:700;text-decoration:none;transition:all .2s;display:flex;color:#3db4f2!important}.al-auth-link .al-auth-tag{color:#06101e;text-transform:uppercase;background:#3db4f2;border-radius:5px;padding:2px 6px;font-size:10px;font-weight:900}.al-auth-link:hover{background:linear-gradient(135deg,#3db4f240,#0ea5e929);border-color:#3db4f2}.al-auth-hint{color:#94a3b8;margin:0;font-size:12px;line-height:1.4}.al-input-group input{box-sizing:border-box;color:#fff;background:#0d1521d9;border:1px solid #3db4f259;border-radius:10px;outline:none;width:100%;padding:10px 14px;font-size:13px;transition:all .2s}.al-input-group input:focus{border-color:#3db4f2;box-shadow:0 0 15px #3db4f24d}.al-prefs-modal{max-width:460px!important}.al-prefs-modal .al-prefs-body{flex-direction:column;gap:12px;display:flex}.al-prefs-modal .al-pref-group{background:#ffffff08;border:1px solid #ffffff14;border-radius:12px;flex-direction:column;transition:background .25s,border-color .25s,box-shadow .25s;display:flex;overflow:hidden}.al-prefs-modal .al-pref-group.is-active{background:#3db4f20a;border-color:#3db4f259;box-shadow:0 4px 16px #0000004d}.al-prefs-modal .al-pref-group.is-active .al-pref-header{border-bottom:1px solid #3db4f226}.al-prefs-modal .al-pref-group .al-pref-header{cursor:pointer;justify-content:space-between;align-items:center;gap:14px;margin:0;padding:12px 14px;transition:background .15s;display:flex}.al-prefs-modal .al-pref-group .al-pref-header:hover{background:#ffffff08}.al-prefs-modal .al-pref-group .al-pref-info{flex-direction:column;gap:2px;display:flex}.al-prefs-modal .al-pref-group .al-pref-title{color:#f1f5f9;font-size:13px;font-weight:600}.al-prefs-modal .al-pref-group .al-pref-desc{color:#94a3b8;font-size:11px;font-weight:500}.al-prefs-modal .al-pref-group .al-pref-sub{background:#080e1799;flex-direction:column;gap:12px;padding:12px 14px;animation:.22s cubic-bezier(.16,1,.3,1) al-slide-down;display:flex}.al-prefs-modal .al-pref-group .al-pref-sub.is-hidden{display:none!important}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row{color:#cbd5e1;cursor:pointer;justify-content:space-between;align-items:center;gap:12px;margin:0;font-size:12px;font-weight:500;display:flex}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-pref-sub-label{color:#94a3b8;align-items:center;gap:8px;display:flex}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-pref-sub-label svg{color:#3db4f2}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-select-xs{color:#f1f5f9;cursor:pointer;background:#0e1622f2;border:1px solid #ffffff29;border-radius:7px;outline:none;padding:4px 8px;font-size:12px;font-weight:600}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-select-xs:hover,.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-select-xs:focus{border-color:#3db4f2}.al-prefs-modal .al-pref-group .al-pref-sub .al-pref-row .al-checkbox{accent-color:#3db4f2;cursor:pointer;width:16px;height:16px}.al-prefs-modal .al-switch{appearance:none;cursor:pointer;background:#ffffff29;border-radius:12px;outline:none;flex-shrink:0;width:36px;height:20px;transition:background .2s;position:relative}.al-prefs-modal .al-switch:after{content:\"\";background:#fff;border-radius:50%;width:16px;height:16px;transition:transform .2s cubic-bezier(.16,1,.3,1);position:absolute;top:2px;left:2px;box-shadow:0 1px 3px #0006}.al-prefs-modal .al-switch:checked{background:#3db4f2}.al-prefs-modal .al-switch:checked:after{background:#06101e;transform:translate(16px)}.al-prefs-modal .al-avatar-sm{object-fit:cover;border:1px solid #3db4f2;border-radius:50%;width:22px;height:22px;box-shadow:0 0 6px #3db4f24d}.al-prefs-modal .al-btn-logout{padding:5px 10px;font-size:11px;color:#fca5a5!important;border-color:#ef44444d!important}.al-prefs-modal .al-btn-logout:hover{color:#fff!important;background:#ef444433!important;border-color:#ef4444!important}.al-toast{-webkit-backdrop-filter:blur(12px);animation:.2s cubic-bezier(.16,1,.3,1) al-modal-in;width:auto!important;max-width:380px!important;height:auto!important;min-height:unset!important;color:#fff!important;z-index:1000000!important;pointer-events:none!important;background:#0e1a29f2!important;border:1px solid #3db4f2!important;border-left-width:4px!important;border-radius:10px!important;padding:10px 20px!important;font-size:13px!important;font-weight:700!important;line-height:1.4!important;position:fixed!important;inset:auto auto 85px 50%!important;transform:translate(-50%)!important;box-shadow:0 12px 36px #000000d9,0 0 16px #3db4f240!important}.al-toast.al-toast-alert,.al-toast.alert{border-color:#ef4444!important;box-shadow:0 12px 36px #000000d9,0 0 16px #ef444440!important}.al-drawer{box-sizing:border-box!important;background:linear-gradient(#101a27 0%,#070e17 100%)!important;border:none!important;border-left:1px solid #3db4f259!important;border-radius:20px 0 0 20px!important;flex-direction:column!important;width:100%!important;max-width:480px!important;height:100dvh!important;max-height:100dvh!important;margin:0!important;padding:0!important;animation:.28s cubic-bezier(.16,1,.3,1) al-drawer-in!important;display:flex!important;overflow:hidden!important;box-shadow:-14px 0 60px #000000d9,-2px 0 25px #3db4f22e!important}.al-drawer .al-modal-header{-webkit-backdrop-filter:blur(12px);background:#0e1622d9;border-bottom:1px solid #ffffff14;flex-shrink:0;margin:0!important;padding:22px 24px 18px!important}.al-drawer .al-modal-body{flex-direction:column;gap:16px;display:flex;-webkit-overflow-scrolling:touch!important;flex:auto!important;padding:24px!important;overflow-y:auto!important}.al-drawer .al-modal-body::-webkit-scrollbar{width:6px}.al-drawer .al-modal-body::-webkit-scrollbar-track{background:#0003}.al-drawer .al-modal-body::-webkit-scrollbar-thumb{background:#ffffff29;border-radius:3px}.al-drawer .al-modal-body::-webkit-scrollbar-thumb:hover{background:#3db4f266}.al-drawer .al-modal-actions{-webkit-backdrop-filter:blur(12px);background:#080e16f5;border-top:1px solid #ffffff14;flex-shrink:0;justify-content:flex-end;align-items:center;gap:12px;display:flex;margin:0!important;padding:16px 24px!important}@media (width<=768px){.al-drawer{width:100vw!important;max-width:100vw!important;box-shadow:none!important;border:none!important;border-radius:0!important;animation:.25s cubic-bezier(.16,1,.3,1) al-drawer-mobile-in!important}.al-drawer .al-modal-header{padding:18px 18px 14px!important}.al-drawer .al-modal-body{padding:18px!important}.al-drawer .al-modal-actions{padding:14px 18px calc(14px + env(safe-area-inset-bottom,0px))!important}}@keyframes al-modal-in{0%{opacity:0;transform:translateY(10px)scale(.97)}to{opacity:1;transform:translateY(0)scale(1)}}@keyframes al-fade-in{0%{opacity:0}to{opacity:1}}@keyframes al-slide-down{0%{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}@keyframes al-drawer-in{0%{opacity:.6;transform:translate(100%)}to{opacity:1;transform:translate(0)}}@keyframes al-drawer-mobile-in{0%{opacity:.6;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}.al-friend-bar{-webkit-backdrop-filter:blur(16px);border:1px solid #3db4f259;border-radius:9999px;align-items:center;padding:6px 14px;font-family:inherit;transition:all .25s;display:flex;position:fixed;bottom:20px;left:50%;transform:translate(-50%);box-shadow:0 16px 40px #000c,0 0 20px #3db4f22e;z-index:99990!important;background:#0d1622f0!important}.al-friend-bar .al-bar-content{align-items:center;gap:10px;display:flex}.al-friend-bar .al-bar-user{align-items:center;gap:8px;display:inline-flex}.al-friend-bar .al-bar-user .al-avatar{object-fit:cover;border:1.5px solid #3db4f2;border-radius:50%;flex-shrink:0;width:24px;height:24px;box-shadow:0 0 8px #3db4f266}.al-friend-bar .al-bar-user .al-username{color:#fff;white-space:nowrap;font-size:13px;font-weight:700}.al-friend-bar .al-bar-divider{background:#ffffff26;width:1px;height:16px}.al-friend-bar .al-bar-default{align-items:center;display:inline-flex}.al-friend-bar .al-select{cursor:pointer;outline:none;padding:4px 8px;font-size:12px;font-weight:600;transition:border-color .2s,box-shadow .2s;color:#e2e8f0!important;background:#0a121ce6!important;border:1px solid #3db4f259!important;border-radius:7px!important}.al-friend-bar .al-select:focus,.al-friend-bar .al-select:hover{box-shadow:0 0 8px #3db4f24d;border-color:#3db4f2!important}.al-friend-bar .al-bar-btn{color:#cbd5e1;cursor:pointer;background:#ffffff14;border:1px solid #ffffff26;border-radius:50%;justify-content:center;align-items:center;width:28px;height:28px;padding:0;transition:all .2s;display:inline-flex}.al-friend-bar .al-bar-btn:hover{color:#fff;background:#3db4f233;border-color:#3db4f2;transform:translateY(-1px);box-shadow:0 0 10px #3db4f259}.al-friend-bar .al-bar-btn:active{transform:translateY(0)}.al-friend-bar .al-bar-warning{color:#facc15;align-items:center;gap:6px;font-size:12px;font-weight:600;display:inline-flex}.al-card-open{z-index:800!important;overflow:visible!important}.al-split-box{z-index:20;-webkit-backdrop-filter:blur(8px);background:#0d1622d9;border:1px solid #ffffff26;transition:all .2s;box-shadow:0 4px 12px #00000080;box-sizing:border-box!important;border-radius:6px!important;align-items:stretch!important;height:24px!important;min-height:24px!important;display:inline-flex!important;position:relative!important;overflow:visible!important}.al-split-box.is-open{z-index:850!important}.al-split-box .al-btn-main{color:#cbd5e1;cursor:pointer;white-space:nowrap;text-overflow:ellipsis;flex:auto;gap:5px;transition:background .15s,color .15s;overflow:hidden;background:0 0!important;border:none!important;border-right:1px solid #ffffff26!important;border-radius:5px 0 0 5px!important;justify-content:center!important;align-items:center!important;height:100%!important;padding:0 8px!important;font-size:11px!important;font-weight:600!important;text-decoration:none!important;display:inline-flex!important}.al-split-box .al-btn-main svg{flex-shrink:0}.al-split-box .al-btn-main:hover{background:#ffffff1a!important}.al-split-box .al-btn-arrow{color:#94a3b8;cursor:pointer;transition:background .15s,color .15s;background:0 0!important;border:none!important;border-radius:0 5px 5px 0!important;flex:0 0 20px!important;justify-content:center!important;align-items:center!important;width:20px!important;height:100%!important;padding:0!important;font-size:10px!important;display:inline-flex!important}.al-split-box .al-btn-arrow svg{flex-shrink:0;transition:transform .2s}.al-split-box .al-btn-arrow:hover{color:#fff;background:#ffffff1f!important}.al-split-box.is-open .al-btn-arrow svg{transform:rotate(180deg)}.al-split-box[data-status=COMPLETED]{background:#0d1622e6;border-color:#22c55e66}.al-split-box[data-status=COMPLETED]:hover{border-color:#22c55eb3;box-shadow:0 4px 14px #22c55e40}.al-split-box[data-status=COMPLETED] .al-btn-main{color:#45df7e}.al-split-box[data-status=COMPLETED] .al-btn-main svg{color:#22c55e}.al-split-box[data-status=COMPLETED] .al-btn-arrow{color:#3ddd78}.al-split-box[data-status=COMPLETED] .al-btn-arrow:hover{color:#fff}.al-split-box[data-status=COMPLETED].is-added{box-shadow:0 0 10px #22c55e33;background:#22c55e2e!important;border-color:#22c55ea6!important}.al-split-box[data-status=COMPLETED].is-added .al-btn-main{color:#fff!important;font-weight:700!important}.al-split-box[data-status=CURRENT]{background:#0d1622e6;border-color:#3db4f266}.al-split-box[data-status=CURRENT]:hover{border-color:#3db4f2b3;box-shadow:0 4px 14px #3db4f240}.al-split-box[data-status=CURRENT] .al-btn-main{color:#76caf6}.al-split-box[data-status=CURRENT] .al-btn-main svg{color:#3db4f2}.al-split-box[data-status=CURRENT] .al-btn-arrow{color:#6dc6f5}.al-split-box[data-status=CURRENT] .al-btn-arrow:hover{color:#fff}.al-split-box[data-status=CURRENT].is-added{box-shadow:0 0 10px #3db4f233;background:#3db4f22e!important;border-color:#3db4f2a6!important}.al-split-box[data-status=CURRENT].is-added .al-btn-main{color:#fff!important;font-weight:700!important}.al-split-box[data-status=REPEATING]{background:#0d1622e6;border-color:#06b6d466}.al-split-box[data-status=REPEATING]:hover{border-color:#06b6d4b3;box-shadow:0 4px 14px #06b6d440}.al-split-box[data-status=REPEATING] .al-btn-main{color:#1fd9f9}.al-split-box[data-status=REPEATING] .al-btn-main svg{color:#06b6d4}.al-split-box[data-status=REPEATING] .al-btn-arrow{color:#15d7f8}.al-split-box[data-status=REPEATING] .al-btn-arrow:hover{color:#fff}.al-split-box[data-status=REPEATING].is-added{box-shadow:0 0 10px #06b6d433;background:#06b6d42e!important;border-color:#06b6d4a6!important}.al-split-box[data-status=REPEATING].is-added .al-btn-main{color:#fff!important;font-weight:700!important}.al-split-box[data-status=DROPPED]{background:#0d1622e6;border-color:#ef444466}.al-split-box[data-status=DROPPED]:hover{border-color:#ef4444b3;box-shadow:0 4px 14px #ef444440}.al-split-box[data-status=DROPPED] .al-btn-main{color:#f47c7c}.al-split-box[data-status=DROPPED] .al-btn-main svg{color:#ef4444}.al-split-box[data-status=DROPPED] .al-btn-arrow{color:#f37373}.al-split-box[data-status=DROPPED] .al-btn-arrow:hover{color:#fff}.al-split-box[data-status=DROPPED].is-added{box-shadow:0 0 10px #ef444433;background:#ef44442e!important;border-color:#ef4444a6!important}.al-split-box[data-status=DROPPED].is-added .al-btn-main{color:#fff!important;font-weight:700!important}.al-split-box[data-status=PLANNING]{background:#0d1622e6;border-color:#94a3b866}.al-split-box[data-status=PLANNING]:hover{border-color:#94a3b8b3;box-shadow:0 4px 14px #94a3b840}.al-split-box[data-status=PLANNING] .al-btn-main{color:#b9c3d0}.al-split-box[data-status=PLANNING] .al-btn-main svg{color:#94a3b8}.al-split-box[data-status=PLANNING] .al-btn-arrow{color:#b3bdcc}.al-split-box[data-status=PLANNING] .al-btn-arrow:hover{color:#fff}.al-split-box[data-status=PLANNING].is-added{box-shadow:0 0 10px #94a3b833;background:#94a3b82e!important;border-color:#94a3b8a6!important}.al-split-box[data-status=PLANNING].is-added .al-btn-main{color:#fff!important;font-weight:700!important}.al-split-box[data-status=PAUSED]{background:#0d1622e6;border-color:#eab30866}.al-split-box[data-status=PAUSED]:hover{border-color:#eab308b3;box-shadow:0 4px 14px #eab30840}.al-split-box[data-status=PAUSED] .al-btn-main{color:#f8c937}.al-split-box[data-status=PAUSED] .al-btn-main svg{color:#eab308}.al-split-box[data-status=PAUSED] .al-btn-arrow{color:#f8c72d}.al-split-box[data-status=PAUSED] .al-btn-arrow:hover{color:#fff}.al-split-box[data-status=PAUSED].is-added{box-shadow:0 0 10px #eab30833;background:#eab3082e!important;border-color:#eab308a6!important}.al-split-box[data-status=PAUSED].is-added .al-btn-main{color:#fff!important;font-weight:700!important}.entry-card,.media-card,.entry-card .cover,.media-card .cover{position:relative!important}.entry-card .al-split-box,.media-card .al-split-box,.entry-card .cover .al-split-box,.cover .al-split-box{z-index:25!important;pointer-events:auto!important;width:auto!important;max-width:calc(100% - 16px)!important;height:24px!important;margin:0!important;transition:opacity .2s,transform .2s!important;position:absolute!important;inset:8px 8px auto auto!important}.entry-card .al-split-box .al-btn-main,.media-card .al-split-box .al-btn-main,.entry-card .cover .al-split-box .al-btn-main,.cover .al-split-box .al-btn-main{padding:0 7px!important;font-size:10.5px!important}.entry-card .al-split-box.is-added,.media-card .al-split-box.is-added{opacity:1!important;pointer-events:auto!important}@media (hover:hover){.entry-card .al-split-box:not(.is-added),.media-card .al-split-box:not(.is-added){opacity:0;pointer-events:none;transform:translateY(-2px)}.entry-card:hover .al-split-box:not(.is-added),.media-card:hover .al-split-box:not(.is-added),.entry-card .al-split-box.is-open,.media-card .al-split-box.is-open{transform:translateY(0);opacity:1!important;pointer-events:auto!important;z-index:35!important}}.title .al-split-box{vertical-align:middle!important;height:22px!important;min-height:22px!important;margin-left:10px!important;display:inline-flex!important}.title .al-split-box .al-btn-main{padding:0 6px!important;font-size:10px!important}.title .al-split-box .al-btn-arrow{flex:0 0 18px!important;width:18px!important}.al-stat-drop{-webkit-backdrop-filter:blur(20px);box-sizing:border-box;border:1px solid #3db4f24d;border-radius:10px;flex-direction:column;gap:2px;min-width:170px;padding:5px;animation:.18s cubic-bezier(.16,1,.3,1) al-drop-in;display:none;position:absolute;top:calc(100% + 5px);right:0;overflow:hidden;box-shadow:0 16px 45px #000000e6,0 0 20px #3db4f226;z-index:880!important;background:#0d1521fa!important}.al-stat-drop.show{display:flex!important}.al-stat-drop .al-drop-opt{text-align:left;cursor:pointer;box-sizing:border-box;border-radius:6px;align-items:center;gap:8px;width:100%;padding:6px 10px;font-size:11.5px;font-weight:600;transition:all .15s;display:flex;color:#e2e8f0!important;background:0 0!important;border:1px solid #0000!important}.al-stat-drop .al-drop-opt svg{opacity:.85;flex-shrink:0}.al-stat-drop .al-drop-opt:hover{color:#fff!important;background:#3db4f226!important;border-color:#3db4f259!important}.al-stat-drop .al-drop-opt:hover svg{opacity:1}.al-stat-drop .al-drop-opt .al-stat-dot{border-radius:50%;flex-shrink:0;width:7px;height:7px}.al-stat-drop .al-drop-opt .al-stat-dot[data-status=COMPLETED]{background:#22c55e;box-shadow:0 0 6px #22c55e99}.al-stat-drop .al-drop-opt .al-stat-dot[data-status=CURRENT]{background:#3db4f2;box-shadow:0 0 6px #3db4f299}.al-stat-drop .al-drop-opt .al-stat-dot[data-status=REPEATING]{background:#06b6d4;box-shadow:0 0 6px #06b6d499}.al-stat-drop .al-drop-opt .al-stat-dot[data-status=DROPPED]{background:#ef4444;box-shadow:0 0 6px #ef444499}.al-stat-drop .al-drop-opt .al-stat-dot[data-status=PLANNING]{background:#94a3b8;box-shadow:0 0 6px #94a3b899}.al-stat-drop .al-drop-opt .al-stat-dot[data-status=PAUSED]{background:#eab308;box-shadow:0 0 6px #eab30899}.al-stat-drop .al-drop-del{margin-top:3px;padding-top:7px;color:#f87171!important;border-top:1px solid #ffffff1a!important}.al-stat-drop .al-drop-del svg{color:#f87171}.al-stat-drop .al-drop-del:hover{color:#fff!important;background:#ef44442e!important;border-color:#ef444466!important}.al-card-hidden{display:none!important}@keyframes al-drop-in{0%{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}@media (width<=768px){.al-friend-bar{border-radius:16px;width:calc(100% - 24px);max-width:440px;padding:6px 12px;bottom:12px}.al-friend-bar .al-bar-content{justify-content:space-between;gap:8px;width:100%}.al-friend-bar .al-bar-user .al-username{text-overflow:ellipsis;max-width:100px;font-size:12px;overflow:hidden}.al-friend-bar .al-select{padding:3px 6px;font-size:11px}}");
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
	var Pause = [["rect", {
		x: "14",
		y: "3",
		width: "5",
		height: "18",
		rx: "1"
	}], ["rect", {
		x: "5",
		y: "3",
		width: "5",
		height: "18",
		rx: "1"
	}]];
	var Play = [["path", { d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" }]];
	var Plus = [["path", { d: "M5 12h14" }], ["path", { d: "M12 5v14" }]];
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
	var X = [["path", { d: "M18 6 6 18" }], ["path", { d: "m6 6 12 12" }]];
	function iconHtml(iconNode, attrs = {
		width: 12,
		height: 12
	}) {
		return createElement(iconNode, attrs).outerHTML;
	}
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
	var STATUS_CONFIG = {
		CURRENT: {
			key: "CURRENT",
			name: "Watching",
			color: "#3db4f2",
			icon: Play
		},
		PLANNING: {
			key: "PLANNING",
			name: "Plan to Watch",
			color: "#94a3b8",
			icon: Clock
		},
		COMPLETED: {
			key: "COMPLETED",
			name: "Completed",
			color: "#22c55e",
			icon: Check
		},
		PAUSED: {
			key: "PAUSED",
			name: "Paused",
			color: "#eab308",
			icon: Pause
		},
		REPEATING: {
			key: "REPEATING",
			name: "Rewatching",
			color: "#06b6d4",
			icon: RotateCcw
		},
		DROPPED: {
			key: "DROPPED",
			name: "Dropped",
			color: "#ef4444",
			icon: X
		}
	};
	function openFriendPreferencesModal({ currentUser, hideAlreadyAdded, defaultAction, onHideToggle, onDefaultActionChange, onLogout }) {
		const { modal, close } = createModal({
			id: "al-friend-prefs-overlay",
			className: "al-prefs-modal",
			variant: "drawer",
			icon: SlidersVertical,
			title: "Friend List Preferences",
			subtitle: "Customize list browsing and quick-add actions",
			body: `
      <!-- Hide already added toggle card -->
      <div class="al-pref-group ${hideAlreadyAdded ? "is-active" : ""}">
        <label class="al-pref-header">
          <div class="al-pref-info">
            <span class="al-pref-title">Hide anime in my list</span>
            <span class="al-pref-desc">Filter out anime already present in your AniList collection</span>
          </div>
          <input type="checkbox" class="al-switch al-toggle-hide" ${hideAlreadyAdded ? "checked" : ""} />
        </label>
      </div>

      <!-- Default action selection card -->
      <div class="al-pref-group">
        <div class="al-pref-header" style="cursor: default;">
          <div class="al-pref-info">
            <span class="al-pref-title">Default quick-add status</span>
            <span class="al-pref-desc">Status applied when clicking the primary card button</span>
          </div>
          <select class="al-select al-sel-default">
            ${Object.entries(STATUS_CONFIG).map(([k, cfg]) => `<option value="${k}" ${defaultAction === k ? "selected" : ""}>${cfg.name}</option>`).join("")}
          </select>
        </div>
      </div>

      <!-- Account session info card -->
      ${currentUser ? `
      <div class="al-pref-group">
        <div class="al-pref-header" style="cursor: default;">
          <div class="al-pref-info">
            <span class="al-pref-title" style="display:flex;align-items:center;gap:8px;">
              <img src="${currentUser.avatar?.medium || "https://anilist.co/img/icons/icon.svg"}" class="al-avatar-sm" alt="${currentUser.name}" />
              <span>Connected as <b>${currentUser.name}</b></span>
            </span>
            <span class="al-pref-desc">AniList OAuth session active</span>
          </div>
          <button type="button" class="al-btn secondary al-btn-logout" title="Disconnect account">
            ${iconHtml(LogOut, {
				width: 12,
				height: 12
			})}
            <span>Disconnect</span>
          </button>
        </div>
      </div>
      ` : ""}
    `,
			actions: [{
				label: "Done",
				primary: true,
				icon: Check
			}]
		});
		const hideToggle = modal.querySelector(".al-toggle-hide");
		const hideGroup = hideToggle?.closest(".al-pref-group");
		if (hideToggle) hideToggle.onchange = (e) => {
			const active = e.target.checked;
			hideGroup?.classList.toggle("is-active", active);
			if (typeof onHideToggle === "function") onHideToggle(active);
		};
		const defaultSel = modal.querySelector(".al-sel-default");
		if (defaultSel) defaultSel.onchange = (e) => {
			if (typeof onDefaultActionChange === "function") onDefaultActionChange(e.target.value);
		};
		const logoutBtn = modal.querySelector(".al-btn-logout");
		if (logoutBtn) logoutBtn.onclick = () => {
			close();
			if (typeof onLogout === "function") onLogout();
		};
	}
	handleUrlToken();
	var currentUser = null;
	var userEntries = new Map();
	var hideAlreadyAdded = Storage.get("al_hide_friend_entries") || false;
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
			showToast("AniList session disconnected");
			App.renderFloatingBar();
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
        <div class="al-bar-content">
          <span class="al-bar-warning">
            ${iconHtml(KeyRound, {
					width: 14,
					height: 14
				})}
            <span>Token not configured</span>
          </span>
          <button type="button" class="al-btn primary al-bar-login">
            ${iconHtml(KeyRound, {
					width: 12,
					height: 12
				})}
            <span>Connect AniList</span>
          </button>
        </div>`;
				bar.querySelector(".al-bar-login").onclick = () => openTokenModal(() => App.initUser());
				return;
			}
			const defAct = App.getDefaultAction();
			bar.innerHTML = `
      <div class="al-bar-content">
        <div class="al-bar-user" title="Logged in as ${currentUser.name}">
          <img src="${currentUser.avatar?.medium || "https://anilist.co/img/icons/icon.svg"}" class="al-avatar" alt="${currentUser.name}" />
          <span class="al-username">${currentUser.name}</span>
        </div>
        <div class="al-bar-divider"></div>
        <div class="al-bar-default" title="Default quick-add status">
          <select class="al-select" id="al-default-sel">
            ${Object.entries(STATUS_CONFIG).map(([k, cfg]) => `<option value="${k}" ${defAct === k ? "selected" : ""}>${cfg.name}</option>`).join("")}
          </select>
        </div>
        <div class="al-bar-divider"></div>
        <button type="button" class="al-bar-btn al-bar-prefs" title="Preferences">
          ${iconHtml(SlidersVertical, {
				width: 14,
				height: 14
			})}
        </button>
      </div>`;
			bar.querySelector("#al-default-sel").onchange = (e) => {
				const newAct = e.target.value;
				App.setDefaultAction(newAct);
				showToast(`Default action: ${(STATUS_CONFIG[newAct] || STATUS_CONFIG.PLANNING).name}`);
				document.querySelectorAll(".al-split-box:not(.is-added)").forEach((box) => {
					App.applyButtonTheme(box, newAct, false);
				});
			};
			bar.querySelector(".al-bar-prefs").onclick = () => {
				openFriendPreferencesModal({
					currentUser,
					hideAlreadyAdded,
					defaultAction: App.getDefaultAction(),
					onHideToggle: (active) => {
						hideAlreadyAdded = active;
						Storage.set("al_hide_friend_entries", active);
						App.applyVisibilityFilter();
					},
					onDefaultActionChange: (newAct) => {
						App.setDefaultAction(newAct);
						showToast(`Default action: ${(STATUS_CONFIG[newAct] || STATUS_CONFIG.PLANNING).name}`);
						App.renderFloatingBar();
						document.querySelectorAll(".al-split-box:not(.is-added)").forEach((box) => {
							App.applyButtonTheme(box, newAct, false);
						});
					},
					onLogout: () => App.logout()
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
			if (!mainBtn) return;
			box.dataset.status = statusKey;
			box.classList.toggle("is-added", isAdded);
			mainBtn.innerHTML = `
      ${iconHtml(isAdded ? cfg.icon : Plus, {
				width: 12,
				height: 12
			})}
      <span>${cfg.name}</span>
    `;
			mainBtn.title = isAdded ? `Status: ${cfg.name} (click to change)` : `Add as ${cfg.name}`;
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
				showToast(`Added as ${(STATUS_CONFIG[status] || STATUS_CONFIG.PLANNING).name}`);
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
      <button type="button" class="al-btn-arrow" title="Change status">
        ${iconHtml(ChevronDown, {
				width: 10,
				height: 10
			})}
      </button>
      <div class="al-stat-drop">
        ${Object.entries(STATUS_CONFIG).map(([k, cfg]) => `
          <button type="button" class="al-drop-opt" data-status="${k}">
            <span class="al-stat-dot" data-status="${k}"></span>
            ${iconHtml(cfg.icon, {
				width: 12,
				height: 12
			})}
            <span>${cfg.name}</span>
          </button>
        `).join("")}
        <button type="button" class="al-drop-opt al-drop-del" data-del="1" style="display:${isAdded ? "flex" : "none"};">
          ${iconHtml(Trash, {
				width: 12,
				height: 12
			})}
          <span>Remove from list</span>
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
				};
			});
			const delBtn = box.querySelector(".al-drop-del");
			if (delBtn) delBtn.onclick = (e) => {
				e.preventDefault();
				e.stopPropagation();
				toggleDropdown(false);
				const curEntry = userEntries.get(mediaId);
				if (curEntry) App.handleDelete(mediaId, curEntry.id);
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
				const match = link.getAttribute("href")?.match(/\/anime\/(\d+)/);
				if (!match) return;
				const mediaId = parseInt(match[1], 10);
				const card = link.closest(".entry-card, .media-card, .entry, .row");
				if (card && !card.querySelector(".al-split-box")) {
					let totalEp = null;
					const epMatch = card.innerText?.match(/\/\s*(\d+)/);
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
