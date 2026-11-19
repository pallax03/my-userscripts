/**
 * Pure domain rules for episode auto-tracking and AniList progress updates.
 * Zero DOM or network side effects (SRP / Ponytail).
 */

/**
 * Determines whether playback state should automatically update AniList progress.
 */
export function shouldAutoTrack({
  activeEp,
  trackedProgress,
  status = null,
  percent = 0,
  isEnded = false,
  threshold = 85,
  isCancelled = false
}) {
  if (!activeEp || activeEp <= 0 || isCancelled) return false;
  if (percent < threshold && !isEnded) return false;

  const isCompletedEp1Rewatch = status === "COMPLETED" && activeEp === 1;
  return activeEp > trackedProgress || status === "REPEATING" || isCompletedEp1Rewatch;
}

/**
 * Computes the AniList SaveMediaListEntry payload for a progress update.
 */
export function computeProgressUpdate({
  mediaId,
  newProgress,
  totalEp = 0,
  entry = null,
  overrideStatus = null,
  today = null
}) {
  const isReset = newProgress === 0;
  const prevStatus = entry?.status || null;
  const isCompletedEp1Rewatch = prevStatus === "COMPLETED" && newProgress === 1 && !overrideStatus;
  const isCompleted = !isCompletedEp1Rewatch && (overrideStatus === "COMPLETED" || (totalEp > 0 && newProgress >= totalEp));
  const isRewatching = prevStatus === "REPEATING" || isCompletedEp1Rewatch;

  let status = "CURRENT";
  if (isCompleted) status = "COMPLETED";
  else if (isReset || isRewatching) status = isRewatching || prevStatus === "COMPLETED" ? "REPEATING" : "CURRENT";

  const params = { mediaId, progress: newProgress, status };
  if (today && !entry?.startedAt?.year) params.startedAt = today;

  if (isCompleted) {
    if (today && !entry?.completedAt?.year) params.completedAt = today;
    if (prevStatus === "REPEATING") params.repeat = (entry?.repeat || 0) + 1;
  }

  return { params, isCompleted, isRewatching, isReset };
}
