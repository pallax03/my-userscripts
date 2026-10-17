import { createModal } from "../../shared/modal.js";
import { iconHtml, Sliders, Check, LogOut } from "../../shared/icons.js";
import { STATUS_CONFIG } from "../ui.js";

export function openFriendPreferencesModal({
  currentUser,
  hideAlreadyAdded,
  defaultAction,
  onHideToggle,
  onDefaultActionChange,
  onLogout
}) {
  const { modal, close } = createModal({
    id: "al-friend-prefs-overlay",
    className: "al-prefs-modal",
    icon: Sliders,
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
            ${Object.entries(STATUS_CONFIG)
              .map(([k, cfg]) => `<option value="${k}" ${defaultAction === k ? "selected" : ""}>${cfg.name}</option>`)
              .join("")}
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
            ${iconHtml(LogOut, { width: 12, height: 12 })}
            <span>Disconnect</span>
          </button>
        </div>
      </div>
      ` : ""}
    `,
    actions: [{ label: "Done", primary: true, icon: Check }]
  });

  const hideToggle = modal.querySelector(".al-toggle-hide");
  const hideGroup = hideToggle?.closest(".al-pref-group");
  if (hideToggle) {
    hideToggle.onchange = (e) => {
      const active = e.target.checked;
      hideGroup?.classList.toggle("is-active", active);
      if (typeof onHideToggle === "function") onHideToggle(active);
    };
  }

  const defaultSel = modal.querySelector(".al-sel-default");
  if (defaultSel) {
    defaultSel.onchange = (e) => {
      if (typeof onDefaultActionChange === "function") onDefaultActionChange(e.target.value);
    };
  }

  const logoutBtn = modal.querySelector(".al-btn-logout");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      close();
      if (typeof onLogout === "function") onLogout();
    };
  }
}
