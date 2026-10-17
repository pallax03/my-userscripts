import { createModal } from "../../shared/modal.js";
import { iconHtml, Sliders, Clock, RotateCcw, Check, Zap, Play } from "../../shared/icons.js";
import { showToast } from "../../shared/toast.js";
import { Settings } from "../settings.js";

/**
 * Opens unified preferences modal for playback, language, and homepage shelf
 * @param {Object} [options]
 * @param {Function} [options.onSave]
 */
export function openPreferencesModal({ onSave } = {}) {
  const settings = Settings.get();

  const { modal, close } = createModal({
    id: "al-prefs-overlay",
    className: "al-prefs-modal",
    icon: Sliders,
    title: "Preferences",
    subtitle: "Playback, audio, and homepage settings",
    body: `
      <!-- 1. Playback & Auto-Track -->
      <div class="al-pref-group ${settings.autoTrack ? "is-active" : ""}">
        <label class="al-pref-header" style="cursor: pointer;">
          <div class="al-pref-info">
            <span class="al-pref-title">Auto-track episodes</span>
            <span class="al-pref-desc">Sync episode progress to AniList automatically when playing</span>
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

          <label class="al-pref-row" style="cursor: pointer;">
            <span class="al-pref-sub-label">
              ${iconHtml(RotateCcw, { width: 13, height: 13 })}
              <span>Prevent rewind when rewatching</span>
            </span>
            <input type="checkbox" class="al-checkbox al-chk-rewind" ${settings.preventRewind ? "checked" : ""} />
          </label>
        </div>
      </div>

      <!-- 2. Audio Priority -->
      <div class="al-pref-group is-active" style="margin-top: 10px;">
        <div class="al-pref-header">
          <div class="al-pref-info">
            <span class="al-pref-title">Preferred Audio</span>
            <span class="al-pref-desc">Default version when both SUB-ITA and ITA are available</span>
          </div>
          <select class="al-select-xs al-sel-lang">
            <option value="sub" ${settings.language === "sub" ? "selected" : ""}>SUB-ITA</option>
            <option value="dub" ${settings.language === "dub" ? "selected" : ""}>ITA (Dub)</option>
          </select>
        </div>
      </div>

      <!-- 3. Homepage Shelf -->
      <div class="al-pref-group ${settings.homeShelf ? "is-active" : ""}" style="margin-top: 10px;">
        <label class="al-pref-header" style="cursor: pointer;">
          <div class="al-pref-info">
            <span class="al-pref-title">Continue Watching shelf</span>
            <span class="al-pref-desc">Show AniList Continue Watching shelf on homepage</span>
          </div>
          <input type="checkbox" class="al-switch al-toggle-homeshelf" ${settings.homeShelf ? "checked" : ""} />
        </label>

        <div id="al-shelf-sub-opts" class="al-pref-sub ${settings.homeShelf ? "" : "is-hidden"}">
          <label class="al-pref-row" style="cursor: pointer;">
            <span class="al-pref-sub-label">
              ${iconHtml(Zap, { width: 13, height: 13 })}
              <span>Default to unwatched only</span>
            </span>
            <input type="checkbox" class="al-checkbox al-chk-unwatched" ${settings.homeOnlyUnwatched ? "checked" : ""} />
          </label>

          <div class="al-pref-row">
            <span class="al-pref-sub-label">
              ${iconHtml(Clock, { width: 13, height: 13 })}
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
    `,
    actions: [
      {
        label: "Done",
        primary: true,
        icon: Check,
        onClick: () => {
          close();
          if (typeof onSave === "function") onSave();
        }
      }
    ]
  });

  // Bind Auto-track
  const autoTrackToggle = modal.querySelector(".al-toggle-autotrack");
  const delaySelect = modal.querySelector(".al-sel-delay");
  const rewindCheckbox = modal.querySelector(".al-chk-rewind");
  const prefGroup = autoTrackToggle?.closest(".al-pref-group");
  const prefSub = prefGroup?.querySelector(".al-pref-sub");

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

  // Bind Language
  const langSelect = modal.querySelector(".al-sel-lang");
  if (langSelect) {
    langSelect.onchange = (e) => {
      Settings.set("language", e.target.value);
      showToast("Audio preference updated, URL cache cleared");
    };
  }

  // Bind Home Shelf
  const homeShelfToggle = modal.querySelector(".al-toggle-homeshelf");
  const unwatchedCheckbox = modal.querySelector(".al-chk-unwatched");
  const shelfGroup = homeShelfToggle?.closest(".al-pref-group");
  const shelfSub = modal.querySelector("#al-shelf-sub-opts");

  if (homeShelfToggle) {
    homeShelfToggle.onchange = (e) => {
      const active = e.target.checked;
      Settings.set("homeShelf", active);
      shelfGroup?.classList.toggle("is-active", active);
      if (shelfSub) shelfSub.classList.toggle("is-hidden", !active);
    };
  }

  if (unwatchedCheckbox) {
    unwatchedCheckbox.onchange = (e) => {
      Settings.set("homeOnlyUnwatched", e.target.checked);
    };
  }

  const autoSelect = modal.querySelector(".al-sel-autoselect");
  if (autoSelect) {
    autoSelect.onchange = (e) => {
      Settings.set("searchAutoSelectDelay", parseInt(e.target.value, 10));
    };
  }
}
