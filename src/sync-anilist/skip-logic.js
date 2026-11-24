/**
 * Pure, DOM-free helpers for hybrid skip segment resolution and manual S-key targets.
 * Priority: AniSkip segment -> Native intro segment -> +85s fallback.
 */

function isValidSegment(segment) {
  return Boolean(
    segment &&
      typeof segment.start === "number" &&
      typeof segment.end === "number" &&
      Number.isFinite(segment.start) &&
      Number.isFinite(segment.end) &&
      segment.end > segment.start
  );
}

/**
 * Resolves the active skip segment by priority:
 * 1. AniSkip segment
 * 2. Native site intro segment
 * 3. null (no segment available)
 */
export function resolveSkipSegment({ aniskipOp = null, nativeIntro = null } = {}) {
  if (isValidSegment(aniskipOp)) {
    return {
      ...aniskipOp,
      source: aniskipOp.source || "aniskip"
    };
  }
  if (isValidSegment(nativeIntro)) {
    return {
      ...nativeIntro,
      source: nativeIntro.source || "native"
    };
  }
  return null;
}

/**
 * Returns true if there is meaningful post-credits content after an ending segment.
 */
export function hasPostCredits(edSegment, duration = 0, minRemaining = 5) {
  return Boolean(
    isValidSegment(edSegment) &&
      typeof duration === "number" &&
      Number.isFinite(duration) &&
      duration > 0 &&
      duration - edSegment.end >= minRemaining
  );
}

/**
 * Resolves the target timestamp when skipping an Ending (ED) segment.
 * Jumps to ed.end - 1 when post-credits exist, otherwise to ed.end (clamped to duration).
 */
export function resolveEdSkipTarget({ edSegment = null, duration = 0, minRemaining = 5 } = {}) {
  if (!isValidSegment(edSegment)) return null;
  const postCredits = hasPostCredits(edSegment, duration, minRemaining);
  const target = postCredits
    ? Math.max(0, edSegment.end - 1)
    : (duration > 0 ? Math.min(duration, edSegment.end) : edSegment.end);
  return {
    target,
    hasPostCredits: postCredits,
    source: edSegment.source || "aniskip"
  };
}

/**
 * Resolves the target timestamp for a manual skip action (S key).
 * Uses the active OP or ED segment when currentPos is inside its window,
 * otherwise falls back to currentPos + fallbackDuration (default 85s), clamped to duration - 1.
 */
export function resolveManualSkipTarget({
  currentPos = 0,
  duration = 0,
  segment = null,
  edSegment = null,
  fallbackDuration = 85
} = {}) {
  const pos = typeof currentPos === "number" && Number.isFinite(currentPos) && currentPos >= 0 ? currentPos : 0;
  const dur = typeof duration === "number" && Number.isFinite(duration) && duration > 0 ? duration : 0;
  const fallback =
    typeof fallbackDuration === "number" && Number.isFinite(fallbackDuration) && fallbackDuration > 0
      ? fallbackDuration
      : 85;

  if (isValidSegment(segment)) {
    const showStart = Math.max(0, segment.start - 1.5);
    const showEnd = Math.max(showStart, segment.end - 2);
    if (pos >= showStart && pos <= showEnd) {
      return {
        target: Math.max(0, segment.end - 1),
        mode: "segment",
        source: segment.source || "aniskip"
      };
    }
  }

  if (isValidSegment(edSegment)) {
    const showStart = Math.max(0, edSegment.start - 1.5);
    const showEnd = Math.max(showStart, edSegment.end - 2);
    if (pos >= showStart && pos <= showEnd) {
      const edRes = resolveEdSkipTarget({ edSegment, duration: dur });
      return {
        target: edRes.target,
        mode: "segment",
        kind: "ed",
        hasPostCredits: edRes.hasPostCredits,
        source: edRes.source
      };
    }
  }

  const rawTarget = pos + fallback;
  const target = dur > 0 ? Math.max(0, Math.min(dur - 1, rawTarget)) : rawTarget;
  return {
    target,
    mode: "fallback",
    source: "fallback"
  };
}

/**
 * Builds a CSS linear-gradient highlighting OP/ED ranges in yellow along a 0%-100% timeline.
 */
export function buildTimelineHighlightGradient(segments = [], duration = 0) {
  if (typeof duration !== "number" || !Number.isFinite(duration) || duration <= 0) {
    return null;
  }

  const ranges = (Array.isArray(segments) ? segments : [])
    .filter(isValidSegment)
    .map((s) => ({
      start: Math.max(0, Math.min(duration, s.start)),
      end: Math.max(0, Math.min(duration, s.end))
    }))
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start - b.start);

  if (ranges.length === 0) return null;

  const merged = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const prev = merged[merged.length - 1];
    const cur = ranges[i];
    if (cur.start <= prev.end) {
      prev.end = Math.max(prev.end, cur.end);
    } else {
      merged.push(cur);
    }
  }

  const color = "rgba(250, 204, 21, 0.85)";
  const stops = [];
  let cursorPct = 0;

  for (const r of merged) {
    const startPct = Number(((r.start / duration) * 100).toFixed(3));
    const endPct = Number(((r.end / duration) * 100).toFixed(3));
    if (startPct > cursorPct) {
      stops.push(`transparent ${cursorPct}%`, `transparent ${startPct}%`);
    }
    stops.push(`${color} ${startPct}%`, `${color} ${endPct}%`);
    cursorPct = endPct;
  }

  if (cursorPct < 100) {
    stops.push(`transparent ${cursorPct}%`, "transparent 100%");
  }

  return `linear-gradient(to right, ${stops.join(", ")})`;
}
