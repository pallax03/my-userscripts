import { Storage } from "../storage.js";
import { showToast } from "../toast.js";
import { AniListAPI } from "./api.js";
import { iconHtml, KeyRound, ExternalLink, Check } from "../icons.js";

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
  document.getElementById("al-modal")?.remove();

  const wrap = document.createElement("div");
  wrap.id = "al-modal";
  wrap.className = "al-overlay";
  wrap.innerHTML = `
    <div class="al-modal">
      <div class="al-modal-header">
        <div class="al-modal-icon">
          ${iconHtml(KeyRound, { width: 22, height: 22 })}
        </div>
        <div>
          <h3 class="al-modal-title">Connect AniList</h3>
          <p class="al-modal-subtitle">Authorize access to sync episodes and lists</p>
        </div>
      </div>

      <div class="al-modal-body">
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
      </div>

      <div class="al-modal-actions">
        <button type="button" class="al-btn secondary" id="al-m-cancel">Cancel</button>
        <button type="button" class="al-btn primary" id="al-m-ok">
          ${iconHtml(Check, { width: 14, height: 14 })}
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
