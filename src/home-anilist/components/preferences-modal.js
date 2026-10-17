import { createModal } from "../../shared/modal.js";
import { Storage } from "../../shared/storage.js";
import { showToast } from "../../shared/toast.js";
import { iconHtml, Sliders, Check, Zap } from "../../shared/icons.js";

/**
 * Opens the Preferences modal for home-anilist
 * @param {Object} options
 * @param {Function} [options.onSave] - Callback executed when preferences are saved
 */
export function openHomePreferencesModal({ onSave } = {}) {
  const currentLang = Storage.get("al_pref_language") || "sub";
  const currentOnlyUnwatched = Storage.get("al_home_only_unwatched") === true;

  const { modal, close } = createModal({
    id: "al-home-prefs-overlay",
    className: "al-prefs-modal",
    icon: Sliders,
    title: "Home Preferences",
    subtitle: "Customize your Continue Watching shelf and audio preferences",
    body: `
      <div class="al-pref-group is-active">
        <div class="al-pref-header">
          <div class="al-pref-info">
            <span class="al-pref-title">Preferred Audio</span>
            <span class="al-pref-desc">Select which version to link when both SUB-ITA and ITA are available</span>
          </div>
        </div>

        <div class="al-pref-sub" style="padding-top: 6px;">
          <div class="al-pref-row" style="cursor: pointer;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; width: 100%; margin: 0;">
              <input type="radio" name="al_pref_lang" value="sub" class="al-radio" ${currentLang === "sub" ? "checked" : ""} />
              <div>
                <strong style="color: #f1f5f9; font-size: 13px;">SUB-ITA</strong>
                <div style="font-size: 11px; color: #94a3b8;">Original Japanese audio with Italian subtitles (Default)</div>
              </div>
            </label>
          </div>

          <div class="al-pref-row" style="cursor: pointer; margin-top: 4px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; width: 100%; margin: 0;">
              <input type="radio" name="al_pref_lang" value="dub" class="al-radio" ${currentLang === "dub" ? "checked" : ""} />
              <div>
                <strong style="color: #f1f5f9; font-size: 13px;">ITA</strong>
                <div style="font-size: 11px; color: #94a3b8;">Italian dubbed audio</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div class="al-pref-group" style="margin-top: 12px;">
        <label class="al-pref-header" style="cursor: pointer;">
          <div class="al-pref-info">
            <span class="al-pref-title">Default to Unwatched Only</span>
            <span class="al-pref-desc">Automatically hide caught-up series when opening the homepage</span>
          </div>
          <input type="checkbox" class="al-switch al-toggle-default-unwatched" ${currentOnlyUnwatched ? "checked" : ""} />
        </label>
      </div>
    `,
    actions: [
      {
        label: "Save Preferences",
        primary: true,
        icon: Check,
        onClick: () => {
          const selectedLang = modal.querySelector('input[name="al_pref_lang"]:checked')?.value || "sub";
          const onlyUnwatched = modal.querySelector(".al-toggle-default-unwatched")?.checked === true;

          const langChanged = selectedLang !== currentLang;
          Storage.set("al_pref_language", selectedLang);
          Storage.set("al_home_only_unwatched", onlyUnwatched);

          if (langChanged) {
            // Invalidate mapped links so they re-resolve to the newly preferred audio
            const map = Storage.get("al_au_map") || {};
            Object.keys(map).forEach((key) => {
              if (map[key].hasAlternativeDub) {
                delete map[key];
              }
            });
            Storage.set("al_au_map", map);
          }

          showToast("Preferences saved");
          close();
          if (typeof onSave === "function") {
            onSave({ langChanged, onlyUnwatched, preferredDub: selectedLang });
          }
        }
      }
    ]
  });
}
