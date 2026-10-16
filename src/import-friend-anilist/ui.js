import { openTokenModal } from "../shared/anilist/auth.js";

export { openTokenModal };

export const STATUS_CONFIG = {
  COMPLETED: {
    name: "Completed",
    icon: "✓",
    border: "#22c55e",
    bg: "#0d261a",
    text: "#4ade80",
    dot: "#22c55e"
  },
  CURRENT: {
    name: "Watching",
    icon: "▶",
    border: "#3db4f2",
    bg: "#102338",
    text: "#60a5fa",
    dot: "#3db4f2"
  },
  REPEATING: {
    name: "Rewatching",
    icon: "↻",
    border: "#06b6d4",
    bg: "#0c252e",
    text: "#22d3ee",
    dot: "#06b6d4"
  },
  DROPPED: {
    name: "Dropped",
    icon: "✕",
    border: "#ef4444",
    bg: "#2b1216",
    text: "#f87171",
    dot: "#ef4444"
  },
  PLANNING: {
    name: "Plan to Watch",
    icon: "📌",
    border: "#64748b",
    bg: "#18202c",
    text: "#cbd5e1",
    dot: "#94a3b8"
  },
  PAUSED: {
    name: "Paused",
    icon: "⏸",
    border: "#eab308",
    bg: "#29210c",
    text: "#facc15",
    dot: "#eab308"
  }
};
