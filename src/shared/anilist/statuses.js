import { Play, Clock, Check, Pause, RotateCcw, X } from "../icons.js";

/**
 * Standard AniList Anime Status Configurations
 * Shared across sync-anilist, import-friend-anilist, and home-anilist
 */
export const STATUS_CONFIG = {
  CURRENT: {
    key: "CURRENT",
    name: "Watching",
    color: "#3db4f2",
    icon: Play
  },
  PLANNING: {
    key: "PLANNING",
    name: "Plan to Watch",
    color: "#94a3b8",
    icon: Clock
  },
  COMPLETED: {
    key: "COMPLETED",
    name: "Completed",
    color: "#22c55e",
    icon: Check
  },
  PAUSED: {
    key: "PAUSED",
    name: "Paused",
    color: "#eab308",
    icon: Pause
  },
  REPEATING: {
    key: "REPEATING",
    name: "Rewatching",
    color: "#06b6d4",
    icon: RotateCcw
  },
  DROPPED: {
    key: "DROPPED",
    name: "Dropped",
    color: "#ef4444",
    icon: X
  }
};

/**
 * Creates a standardized status badge element
 * @param {string} statusKey - AniList status (CURRENT, PLANNING, etc.)
 * @param {Object} [options]
 * @param {boolean} [options.showDot=true]
 * @param {boolean} [options.showIcon=false]
 * @param {string} [options.text] - Custom text override
 * @returns {HTMLSpanElement}
 */
export function createStatusBadge(statusKey, { showDot = true, showIcon = false, text } = {}) {
  const config = STATUS_CONFIG[statusKey] || { name: statusKey, color: "#94a3b8" };
  const badge = document.createElement("span");
  badge.className = `al-badge al-badge-${statusKey}`;

  if (showDot) {
    const dot = document.createElement("span");
    dot.className = "al-dot";
    badge.appendChild(dot);
  }

  if (showIcon && typeof config.icon === "function") {
    const icon = config.icon({ size: 12 });
    badge.appendChild(icon);
  }

  const label = document.createElement("span");
  label.textContent = text || config.name;
  badge.appendChild(label);

  return badge;
}
