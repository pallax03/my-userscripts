import { Storage } from "../storage.js";
import { showToast } from "../toast.js";
import { AniListAPI } from "./api.js";
import { iconHtml, KeyRound, ExternalLink, Check } from "../icons.js";

import { createModal } from "../modal.js";

export const getTodayDate = () => {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
};

export const handleUrlToken = () => {
  const params = new URLSearchParams(window.location.search);
  if (params.has("al_token")) {
    Storage.set("anilist_token", params.get("al_token").trim());
    params.delete("al_token");
    const query = params.toString() ? `?${params}` : "";
    window.history.replaceState({}, document.title, window.location.pathname + query + window.location.hash);
  }
};

export const openTokenModal = (onTokenSaved) => {
  const { modal, close } = createModal({
    id: "al-token-modal",
    icon: KeyRound,
    title: "Connect AniList",
    subtitle: "Authorize access to sync episodes and lists",
    body: `
      <a href="${AniListAPI.oauthUrl}" target="_blank" rel="noopener noreferrer" class="al-auth-link">
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
            showToast("Token saved");
            close();
            if (typeof onTokenSaved === "function") await onTokenSaved();
          }
        }
      }
    ]
  });

  const input = modal.querySelector("#al-tok-in");
  input?.focus();
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") modal.querySelector("#al-m-ok")?.click();
  });
};
