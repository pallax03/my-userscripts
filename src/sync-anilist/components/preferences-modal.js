import { createModal } from "../../shared/modal.js";
import { Storage } from "../../shared/storage.js";
import { iconHtml, Sliders, Clock, RotateCcw, Check } from "../../shared/icons.js";
import { Settings } from "../settings.js";

export function openPreferencesModal() {
  const settings = Settings.get();

  const { modal } = createModal({
    id: "al-prefs-overlay",
    className: "al-prefs-modal",
    icon: Sliders,
    title: "Sync Preferences",
    subtitle: "Configure auto-tracking and playback rules",
    body: `
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

      <div class="al-pref-group is-active" style="margin-top: 12px;">
        <div class="al-pref-header">
          <div class="al-pref-info">
            <span class="al-pref-title">Preferred Audio</span>
            <span class="al-pref-desc">Default version when both SUB-ITA and ITA exist</span>
          </div>
          <select class="al-select-xs al-sel-lang">
            <option value="sub" ${(Storage.get("al_pref_language") || "sub") === "sub" ? "selected" : ""}>SUB-ITA</option>
            <option value="dub" ${Storage.get("al_pref_language") === "dub" ? "selected" : ""}>ITA (Dub)</option>
          </select>
        </div>
      </div>
    `,
    actions: [{ label: "Done", primary: true, icon: Check }]
  });

  const autoTrackToggle = modal.querySelector(".al-toggle-autotrack");
  const delaySelect = modal.querySelector(".al-sel-delay");
  const rewindCheckbox = modal.querySelector(".al-chk-rewind");
  const prefSub = modal.querySelector(".al-pref-sub");
  const prefGroup = modal.querySelector(".al-pref-group");

  if (autoTrackToggle) {
    autoTrackToggle.onchange = (e) => {
      const active = e.target.checked;
      Settings.set("autoTrack", active);
      prefGroup?.classList.toggle("is-active", active);
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

  const langSelect = modal.querySelector(".al-sel-lang");
  if (langSelect) {
    langSelect.onchange = (e) => {
      Storage.set("al_pref_language", e.target.value);
    };
  }
}
