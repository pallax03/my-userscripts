import { iconHtml, Search, Trash2, Check, ChevronDown, Users } from "../../shared/icons.js";
import { Buddy } from "../buddy.js";

/**
 * Standardized reusable glassmorphic buddy select component
 * Used identically in the anime control bar and the preferences modal
 * @param {HTMLElement} container - The wrapper element to render into
 * @param {Object} options
 * @param {string} [options.selectedBuddy] - Currently selected buddy name
 * @param {string} [options.defaultBuddy] - Default buddy name (for badge)
 * @param {Object} [options.viewer] - Current user viewer object
 * @param {string} [options.emptyLabel] - Label when no buddy is selected
 * @param {string} [options.placeholder] - Placeholder for the search input
 * @param {boolean} [options.showClearBtn] - Whether to show a side trash bin button when active
 * @param {Function} [options.onSelect] - Callback when a buddy is selected: (name) => void
 * @param {Function} [options.onClear] - Callback when buddy is cleared: () => void
 * @param {Function} [options.onOpen] - Callback when popover opens (for z-index elevation)
 * @param {Function} [options.onClose] - Callback when popover closes
 */
export function initBuddyPicker(container, {
  selectedBuddy = "",
  defaultBuddy = "",
  viewer = null,
  emptyLabel = "Sync",
  placeholder = "Search followed friend...",
  onSelect,
  onClear,
  onOpen,
  onClose
} = {}) {
  if (!container) return;

  let activeBuddy = (selectedBuddy || "").trim();

  function renderTriggerHtml(buddyName) {
    const b = (buddyName || "").trim();
    const avatar = b ? Buddy.getAvatar(b) : null;
    if (b) {
      return `
        <img src="${avatar || "https://anilist.co/img/icons/icon.svg"}" class="al-buddy-avatar-chip" alt="${b}" />
        <span class="al-buddy-name-chip">${b}</span>
        ${iconHtml(ChevronDown, { width: 11, height: 11, class: "al-buddy-chevron" })}
      `;
    }
    return `
      ${iconHtml(Users, { width: 14, height: 14, class: "al-buddy-icon" })}
      <span class="al-buddy-label">${emptyLabel}</span>
      ${iconHtml(ChevronDown, { width: 11, height: 11, class: "al-buddy-chevron" })}
    `;
  }

  container.innerHTML = `
    <div class="al-buddy-picker-wrap">
      <button type="button" class="al-buddy-btn ${activeBuddy ? "is-active" : ""}" id="al-buddy-trigger" title="${activeBuddy ? `Sync Together: ${activeBuddy}` : "Sync Together with friend"}">
        ${renderTriggerHtml(activeBuddy)}
      </button>
      <div class="al-buddy-popover" id="al-buddy-popover" style="display: none;"></div>
    </div>
  `;

  const trigger = container.querySelector("#al-buddy-trigger");
  const popover = container.querySelector("#al-buddy-popover");

  if (!trigger || !popover) return;

  function updateActiveBuddy(newBuddy) {
    activeBuddy = (newBuddy || "").trim();
    trigger.className = `al-buddy-btn ${activeBuddy ? "is-active" : ""}`;
    trigger.title = activeBuddy ? `Sync Together: ${activeBuddy}` : "Sync Together with friend";
    trigger.innerHTML = renderTriggerHtml(activeBuddy);
  }

  let searchDebounce = null;

  const closePopover = () => {
    if (popover.style.display === "none") return;
    popover.style.display = "none";
    trigger.classList.remove("has-open-popover");
    if (typeof onClose === "function") onClose();
  };

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const willOpen = popover.style.display === "none";
    if (!willOpen) {
      closePopover();
      return;
    }

    if (typeof onOpen === "function") onOpen();
    trigger.classList.add("has-open-popover");
    popover.style.display = "block";
    popover.innerHTML = `
      <div class="al-buddy-pop-search-box">
        ${iconHtml(Search, { width: 13, height: 13, class: "al-buddy-search-icon" })}
        <input
          type="search"
          class="al-buddy-search-input"
          placeholder="${placeholder}"
          value=""
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          name="al_buddy_search_query"
          data-lpignore="true"
          data-1p-ignore="true"
        />
      </div>
      <div class="al-buddy-pop-options" id="al-buddy-pop-options">
        <div class="al-buddy-loading">Loading followed friends...</div>
      </div>
      ${activeBuddy ? `
        <div class="al-buddy-pop-footer">
          <button type="button" class="al-buddy-pop-remove" id="al-buddy-pop-remove">
            ${iconHtml(Trash2, { width: 12, height: 12 })}
            <span>Remove Sync</span>
          </button>
        </div>
      ` : ""}
    `;

    const inp = popover.querySelector(".al-buddy-search-input");
    const optionsBox = popover.querySelector("#al-buddy-pop-options");

    popover.querySelector("#al-buddy-pop-remove")?.addEventListener("click", () => {
      updateActiveBuddy("");
      closePopover();
      if (typeof onClear === "function") onClear();
    });

    async function renderOptions(query = "") {
      if (!optionsBox) return;
      const users = await Buddy.searchFriends(query, viewer?.id);

      if (!users || !users.length) {
        optionsBox.innerHTML = `<div class="al-buddy-empty">No followed friend found</div>`;
        return;
      }

      optionsBox.innerHTML = users.map((u) => {
        const isSelected = activeBuddy.toLowerCase() === u.name.toLowerCase();
        const isDefault = defaultBuddy && defaultBuddy.toLowerCase() === u.name.toLowerCase();
        return `
          <button type="button" class="al-buddy-option ${isSelected ? "selected" : ""}" data-user="${u.name}">
            <img src="${u.avatar?.medium || "https://anilist.co/img/icons/icon.svg"}" class="al-buddy-opt-avatar" alt="${u.name}" />
            <span class="al-buddy-opt-name">${u.name}</span>
            ${isDefault ? `<span class="al-buddy-opt-badge">Default</span>` : ""}
            ${isSelected ? iconHtml(Check, { width: 12, height: 12, class: "al-buddy-opt-check" }) : ""}
          </button>
        `;
      }).join("");

      optionsBox.querySelectorAll(".al-buddy-option").forEach((opt) => {
        opt.addEventListener("click", () => {
          const chosenUser = opt.dataset.user;
          updateActiveBuddy(chosenUser);
          closePopover();
          if (typeof onSelect === "function") onSelect(chosenUser);
        });
      });
    }

    inp?.addEventListener("input", (evt) => {
      if (searchDebounce) clearTimeout(searchDebounce);
      const val = evt.target.value;
      optionsBox.innerHTML = `<div class="al-buddy-loading">Searching...</div>`;
      searchDebounce = setTimeout(() => {
        renderOptions(val);
      }, 120);
    });

    inp?.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter") {
        evt.preventDefault();
        const firstOpt = optionsBox?.querySelector(".al-buddy-option");
        if (firstOpt) firstOpt.click();
      } else if (evt.key === "Escape") {
        closePopover();
      }
    });

    inp?.focus();
    renderOptions("");
  });

  if (container._buddyDocClick) {
    document.removeEventListener("click", container._buddyDocClick);
  }
  container._buddyDocClick = (evt) => {
    if (!popover.contains(evt.target) && !trigger.contains(evt.target)) {
      closePopover();
    }
  };
  document.addEventListener("click", container._buddyDocClick);
}
