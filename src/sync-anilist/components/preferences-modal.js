import { iconHtml, Sliders, Clock, RotateCcw, Check } from "../../shared/icons.js";
import { Settings } from "../settings.js";

export function openPreferencesModal() {
  document.getElementById("al-prefs-overlay")?.remove();

  const settings = Settings.get();
  const wrap = document.createElement("div");
  wrap.className = "al-overlay";
  wrap.id = "al-prefs-overlay";

  wrap.innerHTML = `
    <div class="al-modal al-prefs-modal">
      <div class="al-modal-header">
        <div class="al-modal-icon">
          ${iconHtml(Sliders, { width: 22, height: 22 })}
        </div>
        <div>
          <h5 class="al-modal-title">Sync Preferences</h5>
          <p class="al-modal-subtitle">Configure auto-tracking and playback rules</p>
        </div>
      </div>

      <div class="al-modal-body al-prefs-body">
        <label class="al-pref-item">
          <div class="al-pref-info">
            <span class="al-pref-title">Auto-track on episode select</span>
            <span class="al-pref-desc">Sync episode to AniList automatically when selected</span>
          </div>
          <input type="checkbox" class="al-switch al-toggle-autotrack" ${settings.autoTrack ? "checked" : ""} />
        </label>

        <div class="al-pref-sub ${settings.autoTrack ? "" : "is-hidden"}">
          <div class="al-pref-row">
            <span class="al-pref-sub-label">
              ${iconHtml(Clock, { width: 13, height: 13 })}
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
              ${iconHtml(RotateCcw, { width: 13, height: 13 })}
              <span>Prevent rewind when rewatching</span>
            </span>
            <input type="checkbox" class="al-checkbox al-chk-rewind" ${settings.preventRewind ? "checked" : ""} />
          </label>
        </div>
      </div>

      <div class="al-modal-actions">
        <button type="button" class="al-btn primary" id="al-prefs-close">
          ${iconHtml(Check, { width: 14, height: 14 })}
          <span>Done</span>
        </button>
      </div>
    </div>`;

  document.body.appendChild(wrap);

  const autoTrackToggle = wrap.querySelector(".al-toggle-autotrack");
  const delaySelect = wrap.querySelector(".al-sel-delay");
  const rewindCheckbox = wrap.querySelector(".al-chk-rewind");
  const prefSub = wrap.querySelector(".al-pref-sub");

  if (autoTrackToggle) {
    autoTrackToggle.onchange = (e) => {
      const active = e.target.checked;
      Settings.set("autoTrack", active);
      if (prefSub) prefSub.classList.toggle("is-hidden", !active);
    };
  }

  if (delaySelect) {
    delaySelect.onchange = (e) => {
      Settings.set("delay", parseInt(e.target.value, 10));
    };
  }

  if (rewindCheckbox) {
    rewindCheckbox.onchange = (e) => {
      Settings.set("preventRewind", e.target.checked);
    };
  }

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
