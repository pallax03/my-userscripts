/**
 * Pure domain model deriving the minimal dock UI state from AniList & player state.
 * Keeps UI rendering (actions.js) free of business rules (SRP/KISS).
 */
export function deriveDockState({
  media,
  activeEp = 0,
  isWatch = false,
  autoTrackState = null,
  buddyData = null
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
  const isBuddyAhead = Boolean(buddyData?.name && (buddyData.progress || 0) > progress);
  const canSyncBuddy = isBuddyAhead || (isBuddyCompleted && entry?.status !== "COMPLETED");

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
    episodeMode
  };
}
