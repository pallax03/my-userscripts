import { Storage } from "../storage.js";
import { showToast } from "../toast.js";
import { AniListAPI } from "./api.js";
import { iconHtml, KeyRound, ExternalLink, Check } from "../icons.js";

import { createModal } from "../modal.js";

export const getTodayDate = () => {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
};

export const handleOAuthRedirect = () => {
  if (window.location.hostname.includes("anilist.co") && window.location.pathname.includes("/oauth")) {
    const raw = (window.location.hash || "").replace(/^#/, "") || (window.location.search || "").replace(/^\?/, "");
    const params = new URLSearchParams(raw);
    const token = params.get("access_token");
    const state = params.get("state");

    if (token) {
      Storage.set("anilist_token", token);

      // Channel 1: postMessage to opener
      try {
        if (window.opener) {
          window.opener.postMessage({ type: "AL_AUTH_SUCCESS", token }, "*");
        }
      } catch (_) {}

      // Channel 2: Redirect return URL via OAuth state
      if (state) {
        try {
          const returnUrl = new URL(decodeURIComponent(state));
          if (/animeunity|animesaturn|saturncdn/.test(returnUrl.hostname)) {
            returnUrl.searchParams.set("al_token", token);
            window.location.href = returnUrl.toString();
            return true;
          }
        } catch (_) {}
      }

      document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0b131e;color:#fff;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:24px;">
          <div style="width:52px;height:52px;border-radius:50%;background:rgba(20,184,166,0.18);color:#14b8a6;display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:12px;border:1px solid #14b8a6;box-shadow:0 0 16px rgba(20,184,166,0.3);">✓</div>
          <h2 style="color:#14b8a6;margin:0 0 6px 0;font-size:20px;font-weight:700;">AniList Connected!</h2>
          <p style="color:#94a3b8;font-size:13px;margin:0 0 16px 0;">Token saved successfully. Returning to streaming...</p>
        </div>
      `;

      setTimeout(() => {
        try { window.close(); } catch (_) {}
      }, 1000);
      return true;
    }
  }
  return false;
};

export const handleUrlToken = () => {
  const params = new URLSearchParams(window.location.search);
  if (params.has("al_token")) {
    const token = params.get("al_token").trim();
    Storage.set("anilist_token", token);
    params.delete("al_token");
    const query = params.toString() ? `?${params}` : "";
    window.history.replaceState({}, document.title, window.location.pathname + query + window.location.hash);
    return token;
  }
  return null;
};

export const openTokenModal = (onTokenSaved) => {
  const oauthUrl = typeof AniListAPI.getOAuthUrl === "function"
    ? AniListAPI.getOAuthUrl(window.location.href)
    : AniListAPI.oauthUrl;

  let authFinished = false;
  const finishAuth = (token) => {
    if (authFinished) return;
    authFinished = true;
    if (token) {
      Storage.set("anilist_token", token);
      showToast("✓ AniList Connected!");
      if (typeof onTokenSaved === "function") onTokenSaved();
    }
  };

  // Channel 1 listener: Direct postMessage
  const onMessage = (e) => {
    if (e.data?.type === "AL_AUTH_SUCCESS" && e.data.token) {
      window.removeEventListener("message", onMessage);
      finishAuth(e.data.token);
    }
  };
  window.addEventListener("message", onMessage);

  // 1. Try seamless popup flow
  let authWin = null;
  try {
    authWin = window.open(oauthUrl, "anilist_auth", "width=600,height=750,menubar=no,toolbar=no");
  } catch (_) {}

  if (authWin) {
    showToast("Waiting for AniList authorization...", false, 3500);
    const timer = setInterval(() => {
      const token = Storage.get("anilist_token");
      if (token) {
        clearInterval(timer);
        finishAuth(token);
      } else if (authWin.closed) {
        clearInterval(timer);
        setTimeout(() => {
          if (!authFinished && !Storage.get("anilist_token")) {
            showFallbackModal(oauthUrl, finishAuth);
          }
        }, 500);
      }
    }, 600);
    return;
  }

  // 2. Fallback modal if popup blocked
  showFallbackModal(oauthUrl, finishAuth);
};

function showFallbackModal(oauthUrl, onTokenSaved) {
  const { modal, close } = createModal({
    id: "al-token-modal",
    icon: KeyRound,
    title: "Connect AniList",
    subtitle: "Authorize access to sync episodes and lists",
    body: `
      <a href="${oauthUrl}" target="_blank" rel="noopener noreferrer" class="al-auth-link">
        <span class="d-flex align-items-center" style="gap:8px;">
          ${iconHtml(ExternalLink, { width: 14, height: 14 })}
          <span>1. Open AniList Authorization</span>
        </span>
        <span class="al-auth-tag">OAuth</span>
      </a>
      <p class="al-auth-hint">Authorize access, copy the generated token and paste it below:</p>

      <div class="al-input-group">
        <input type="password" id="al-tok-in" placeholder="Paste access token here..." value="${Storage.get("anilist_token") || ""}" autocomplete="off" spellcheck="false" />
      </div>
    `,
    actions: [
      { label: "Cancel", secondary: true, onClick: ({ close }) => close() },
      {
        label: "Save Token",
        primary: true,
        icon: Check,
        id: "al-m-ok",
        onClick: async ({ close, modal }) => {
          const val = modal.querySelector("#al-tok-in")?.value.trim();
          if (val) {
            Storage.set("anilist_token", val);
            showToast("✓ Token saved");
            close();
            if (typeof onTokenSaved === "function") await onTokenSaved(val);
          }
        }
      }
    ]
  });

  const input = modal.querySelector("#al-tok-in");
  setTimeout(() => input?.focus(), 60);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") modal.querySelector("#al-m-ok")?.click();
  });
}
