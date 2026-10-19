import { createModal } from "../../shared/modal.js";
import {
  iconHtml,
  Sliders,
  Clock,
  RotateCcw,
  Check,
  Zap,
  ChevronDown,
  Users,
  Trash2,
  Search
} from "../../shared/icons.js";
import { Settings } from "../settings.js";
import { Buddy } from "../buddy.js";
import { initBuddyPicker } from "./buddy-picker.js";

/**
 * Opens unified preferences modal for playback, homepage shelf, and sync buddy
 * @param {Object} [options]
 * @param {Function} [options.onSave]
 * @param {Object} [options.viewer]
 */
export function openPreferencesModal({ onSave, viewer } = {}) {
  const currentViewer = viewer || Buddy.getViewer();
  const settings = Settings.get();
  const currentBuddy = settings.defaultBuddy;
  const buddyAvatar = currentBuddy ? Buddy.getAvatar(currentBuddy) : null;

  const { modal, close } = createModal({
    id: "al-prefs-overlay",
    className: "al-prefs-modal",
    variant: "drawer",
    icon: Sliders,
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
            <span class="al-pref-chevron">${iconHtml(ChevronDown, { width: 14, height: 14 })}</span>
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

      <!-- 2. Homepage Shelf -->
      <div class="al-pref-group al-pref-collapsible ${settings.homeShelf ? "is-open is-active" : ""}" style="margin-top: 10px;" id="al-pref-sec-shelf">
        <div class="al-pref-header">
          <div class="al-pref-title-click">
            <span class="al-pref-chevron">${iconHtml(ChevronDown, { width: 14, height: 14 })}</span>
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

      <!-- 3. Sync Together (Watch Buddy) -->
      <div class="al-pref-group al-pref-collapsible is-open is-active" style="margin-top: 10px;" id="al-pref-sec-buddy">
        <div class="al-pref-header">
          <div class="al-pref-title-click">
            <span class="al-pref-chevron">${iconHtml(ChevronDown, { width: 14, height: 14 })}</span>
            <div class="al-pref-info">
              <span class="al-pref-title">Sync Together</span>
              <span class="al-pref-desc">Watch with your AniList friend</span>
            </div>
          </div>
        </div>

        <div class="al-pref-sub">
          <div class="al-pref-row" style="align-items: center; justify-content: space-between;">
            <div class="al-pref-sub-label">
              ${iconHtml(Users, { width: 13, height: 13 })}
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

  // 1. Auto-track boolean switch + expansion
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
  if (delaySelect) {
    delaySelect.addEventListener("change", (e) => {
      Settings.set("delay", parseInt(e.target.value, 10));
    });
  }

  const rewindCheckbox = modal.querySelector(".al-chk-rewind");
  if (rewindCheckbox) {
    rewindCheckbox.addEventListener("change", (e) => {
      Settings.set("preventRewind", e.target.checked);
    });
  }

  // 2. Home Shelf boolean switch + expansion
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
  if (unwatchedCheckbox) {
    unwatchedCheckbox.addEventListener("change", (e) => {
      Settings.set("homeOnlyUnwatched", e.target.checked);
    });
  }

  const autoSelect = modal.querySelector(".al-sel-autoselect");
  if (autoSelect) {
    autoSelect.addEventListener("change", (e) => {
      Settings.set("searchAutoSelectDelay", parseInt(e.target.value, 10));
    });
  }

  // 3. Sync Together collapsible header
  const buddyGroup = modal.querySelector("#al-pref-sec-buddy");
  const buddyHeader = buddyGroup?.querySelector(".al-pref-title-click");
  buddyHeader?.addEventListener("click", () => {
    buddyGroup?.classList.toggle("is-open");
  });

  // 4. Bind Sync Together Default Buddy Picker using shared component
  const buddyBox = modal.querySelector("#al-pref-buddy-box");
  initBuddyPicker(buddyBox, {
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
