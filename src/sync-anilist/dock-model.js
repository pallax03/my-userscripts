import { computeBuddySyncState } from "./buddy.js";

/**
 * Pure domain model deriving the minimal dock UI state from AniList & player state.
 * Keeps UI rendering (actions.js) free of business rules (SRP/KISS).
 */
export function deriveDockState({
  media,
  activeEp = 0,
  isWatch = false,
  autoTrackState = null,
  buddyData = null,
  myResume = null
} = {}) {
  const entry = media?.mediaListEntry || null;
  const progress = entry?.progress || 0;
  const total = media?.episodes || 0;
  const isRewatching = entry?.status === "REPEATING";
  const isWatchEp = Boolean(isWatch && activeEp > 0);
  const isCounting = Boolean(autoTrackState?.isActive && autoTrackState.targetEp === activeEp);

  const isCurrentTracked = Boolean(isWatchEp && !isRewatching && progress > 0 && activeEp === progress);
  const isPast = Boolean(isWatchEp && !isRewatching && progress > 0 && activeEp < progress);
  const isAhead = Boolean(isWatchEp && (!entry || isRewatching || activeEp > progress));

  const isBuddyCompleted = Boolean(buddyData?.isCompleted);
  const buddySync = buddyData?.name
    ? computeBuddySyncState({
        myProgress: progress,
        myStatus: entry?.status || null,
        myResume,
        buddyProgress: buddyData?.progress || 0,
        buddyStatus: buddyData?.status || null,
        buddyIsCompleted: isBuddyCompleted,
        buddyResume: buddyData?.resume || null
      })
    : {
        canSync: false,
        canSyncResume: false,
        syncKind: "none",
        resumeToApply: null
      };

  const canSyncBuddy = buddySync.canSync;
  const canDecrement = Boolean(entry && progress > 0);
  const canIncrement = Boolean(entry && (!total || progress < total));

  let episodeMode = "detail";
  if (isWatchEp) {
    if (!entry) episodeMode = "add";
    else if (isCounting) episodeMode = "counting";
    else if (isAhead || progress === 0) episodeMode = "pending";
    else if (isCurrentTracked) episodeMode = "tracked";
    else if (isPast) episodeMode = "past";
  } else if (!entry) {
    episodeMode = "add";
  }

  return {
    entry,
    progress,
    total,
    isRewatching,
    isWatchEp,
    isCounting,
    isCurrentTracked,
    isPast,
    isAhead,
    isBuddyCompleted,
    canSyncBuddy,
    canSyncBuddyResume: buddySync.canSyncResume,
    buddySyncKind: buddySync.syncKind,
    buddyResumeToApply: buddySync.resumeToApply,
    canDecrement,
    canIncrement,
    episodeMode
  };
}
