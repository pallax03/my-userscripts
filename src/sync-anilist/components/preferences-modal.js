import { createModal } from "../../shared/modal.js";
import {
  iconHtml,
  Sliders,
  Clock,
  Check,
  ChevronDown,
  Users,
  Search,
  FastForward,
  SkipForward,
  ThumbsUp,
  Languages,
  RotateCcw,
  Trash2,
  Play
} from "../../shared/icons.js";
import { Settings } from "../settings.js";
import { Storage } from "../../shared/storage.js";
import { showToast } from "../../shared/toast.js";
import { Buddy } from "../buddy.js";
import { initBuddyPicker } from "./buddy-picker.js";

/**
 * Opens unified preferences modal for playback, search, and sync buddy
 * @param {Object} [options]
 * @param {Function} [options.onSave]
 * @param {Object} [options.viewer]
 */
export function openPreferencesModal({ onSave, viewer } = {}) {
  const currentViewer = viewer || Buddy.getViewer();
  const settings = Settings.get();

  const { modal, close } = createModal({
    id: "al-prefs-overlay",
    className: "al-prefs-modal",
    variant: "drawer",
    icon: Sliders,
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
            <span class="al-pref-chevron">${iconHtml(ChevronDown, { width: 14, height: 14 })}</span>
            <div class="al-pref-info">
              <span class="al-pref-title">Auto-track episodes</span>
              <span class="al-pref-desc">Sync episode progress to AniList automatically</span>
            </div>
          </div>
          <input type="checkbox" class="al-switch al-toggle-autotrack" ${settings.autoTrack ? "checked" : ""} />
        </div>

        <div class="al-pref-sub" style="${settings.autoTrack ? "" : "display: none;"}">
          <div class="al-pref-row al-row-delay">
            <span class="al-pref-sub-label">
              ${iconHtml(Clock, { width: 13, height: 13 })}
              <span>Countdown before tracking</span>
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
              <span>Auto-resume playback position</span>
            </span>
            <input type="checkbox" class="al-switch al-toggle-autoresume" ${settings.autoResume ? "checked" : ""} />
          </label>
        </div>
      </div>

      <!-- 2. Skip Intro (AniSkip) -->
      <div class="al-pref-group al-pref-collapsible is-open is-active" style="margin-top: 10px;" id="al-pref-sec-skipintro">
        <div class="al-pref-header">
          <div class="al-pref-title-click">
            <span class="al-pref-chevron">${iconHtml(ChevronDown, { width: 14, height: 14 })}</span>
            <div class="al-pref-info">
              <span class="al-pref-title">Skip intro (AniSkip)</span>
              <span class="al-pref-desc">Automatic opening skip & shortcut controls</span>
            </div>
          </div>
        </div>

        <div class="al-pref-sub">
          <label class="al-pref-row" style="cursor: pointer;">
            <span class="al-pref-sub-label">
              ${iconHtml(SkipForward, { width: 13, height: 13 })}
              <span>Auto-skip opening intro</span>
            </span>
            <input type="checkbox" class="al-switch al-toggle-autoskip" ${settings.autoSkip ? "checked" : ""} />
          </label>

          <label class="al-pref-row" style="cursor: pointer;">
            <span class="al-pref-sub-label">
              ${iconHtml(ThumbsUp, { width: 13, height: 13 })}
              <span>Community voting & contribute</span>
            </span>
            <input type="checkbox" class="al-switch al-toggle-community-aniskip" ${settings.communityAniSkip ? "checked" : ""} />
          </label>

          <div class="al-pref-row">
            <span class="al-pref-sub-label">
              ${iconHtml(FastForward, { width: 13, height: 13 })}
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
            <span class="al-pref-chevron">${iconHtml(ChevronDown, { width: 14, height: 14 })}</span>
            <div class="al-pref-info">
              <span class="al-pref-title">Search & Matching</span>
              <span class="al-pref-desc">Streaming language & auto-navigation</span>
            </div>
          </div>
        </div>

        <div class="al-pref-sub">
          <div class="al-pref-row">
            <span class="al-pref-sub-label">
              ${iconHtml(Languages, { width: 13, height: 13 })}
              <span>Preferred language</span>
            </span>
            <select class="al-select-xs al-sel-language">
              <option value="sub" ${settings.language === "sub" ? "selected" : ""}>SUB (Original)</option>
              <option value="dub" ${settings.language === "dub" ? "selected" : ""}>ITA (Dubbed)</option>
            </select>
          </div>

          <div class="al-pref-row">
            <span class="al-pref-sub-label">
              ${iconHtml(Clock, { width: 13, height: 13 })}
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
              ${iconHtml(RotateCcw, { width: 13, height: 13 })}
              <span>Reset learned anime URLs</span>
            </span>
            <button type="button" class="al-btn-pref-action danger al-btn-clear-cache">
              ${iconHtml(Trash2, { width: 11, height: 11 })}
              <span>Clear Cache</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 4. Sync Together (Watch Buddy) -->
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

  const autoResumeToggle = modal.querySelector(".al-toggle-autoresume");
  if (autoResumeToggle) {
    autoResumeToggle.addEventListener("change", (e) => {
      Settings.set("autoResume", e.target.checked);
    });
  }

  // 2. Skip Intro (AniSkip) collapsible header & controls
  const skipGroup = modal.querySelector("#al-pref-sec-skipintro");
  const skipHeader = skipGroup?.querySelector(".al-pref-title-click");
  skipHeader?.addEventListener("click", () => {
    skipGroup?.classList.toggle("is-open");
  });

  const autoSkipToggle = modal.querySelector(".al-toggle-autoskip");
  if (autoSkipToggle) {
    autoSkipToggle.addEventListener("change", (e) => {
      Settings.set("autoSkip", e.target.checked);
    });
  }

  const communityToggle = modal.querySelector(".al-toggle-community-aniskip");
  if (communityToggle) {
    communityToggle.addEventListener("change", (e) => {
      Settings.set("communityAniSkip", e.target.checked);
    });
  }

  const skipFallbackSelect = modal.querySelector(".al-sel-skip-fallback");
  if (skipFallbackSelect) {
    skipFallbackSelect.addEventListener("change", (e) => {
      Settings.set("skipFallbackDuration", parseInt(e.target.value, 10));
    });
  }

  // 3. Search & Language settings
  const searchGroup = modal.querySelector("#al-pref-sec-search");
  const searchHeader = searchGroup?.querySelector(".al-pref-title-click");
  searchHeader?.addEventListener("click", () => {
    searchGroup?.classList.toggle("is-open");
  });

  const langSelect = modal.querySelector(".al-sel-language");
  if (langSelect) {
    langSelect.addEventListener("change", (e) => {
      Settings.set("language", e.target.value);
    });
  }

  const autoSelect = modal.querySelector(".al-sel-autoselect");
  if (autoSelect) {
    autoSelect.addEventListener("change", (e) => {
      Settings.set("searchAutoSelectDelay", parseInt(e.target.value, 10));
    });
  }

  const clearCacheBtn = modal.querySelector(".al-btn-clear-cache");
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener("click", () => {
      Storage.del("al_au_map");
      Storage.del("al_as_map");
      showToast("⚡ Search cache cleared: mappings reset");
    });
  }

  // 4. Sync Together collapsible header
  const buddyGroup = modal.querySelector("#al-pref-sec-buddy");
  const buddyHeader = buddyGroup?.querySelector(".al-pref-title-click");
  buddyHeader?.addEventListener("click", () => {
    buddyGroup?.classList.toggle("is-open");
  });

  // Bind Default Buddy Picker
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
