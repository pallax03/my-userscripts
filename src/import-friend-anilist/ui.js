import { Check, Play, Clock, Pause, RotateCcw, X } from "../shared/icons.js";

export const STATUS_CONFIG = {
  PLANNING: { name: "Plan to Watch", icon: Clock },
  CURRENT: { name: "Watching", icon: Play },
  COMPLETED: { name: "Completed", icon: Check },
  PAUSED: { name: "Paused", icon: Pause },
  REPEATING: { name: "Rewatching", icon: RotateCcw },
  DROPPED: { name: "Dropped", icon: X }
};
