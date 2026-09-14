import { GameSession, CheckIn, TrendMetric } from "./types";

/**
 * Scoring + trend computation for the four tracked cognitive metrics.
 *
 * Each formula is intentionally simple and explainable — a caregiver or
 * health worker should be able to understand "how did this score come about?"
 * without statistics training.
 */

const ATTENTION_RESPONSE_BASELINE_MS = 1500;

/** Memory score = average accuracy × 100 across memory-match sessions. */
export function computeMemoryScore(sessions: GameSession[]): number {
  const relevant = sessions.filter((s) => s.gameType === "memory-match");
  if (relevant.length === 0) return 0;
  const avg = relevant.reduce((sum, s) => sum + s.accuracy, 0) / relevant.length;
  return Math.round(avg * 100);
}

/**
 * Attention score = average accuracy × 100 across spot-and-tap sessions,
 * adjusted down if avgResponseMs exceeds a 1500ms baseline.
 *
 * The penalty is proportional: if average response is 2× baseline,
 * the score is halved. Clamped to [0, 100].
 */
export function computeAttentionScore(sessions: GameSession[]): number {
  const relevant = sessions.filter((s) => s.gameType === "spot-and-tap");
  if (relevant.length === 0) return 0;

  const avgAccuracy =
    relevant.reduce((sum, s) => sum + s.accuracy, 0) / relevant.length;
  const avgResponse =
    relevant.reduce((sum, s) => sum + s.avgResponseMs, 0) / relevant.length;

  // Scale factor: 1.0 at or below baseline, decreasing linearly above
  const speedFactor = Math.min(
    1,
    ATTENTION_RESPONSE_BASELINE_MS / Math.max(avgResponse, 1)
  );

  return Math.round(Math.min(100, Math.max(0, avgAccuracy * 100 * speedFactor)));
}

/** Pattern Recognition score = average accuracy × 100 across sequence-recall sessions. */
export function computePatternScore(sessions: GameSession[]): number {
  const relevant = sessions.filter((s) => s.gameType === "sequence-recall");
  if (relevant.length === 0) return 0;
  const avg = relevant.reduce((sum, s) => sum + s.accuracy, 0) / relevant.length;
  return Math.round(avg * 100);
}

/**
 * Routine Recall score = blend of:
 *   (a) average accuracy × 100 across routine-recall game sessions
 *   (b) completed/scheduled ratio × 100 from CheckIn records
 * The two are averaged so both passive reminders and active gameplay count.
 */
export function computeRoutineScore(
  sessions: GameSession[],
  checkIns: CheckIn[]
): number {
  const relevant = sessions.filter((s) => s.gameType === "routine-recall");
  const gameScore =
    relevant.length > 0
      ? (relevant.reduce((sum, s) => sum + s.accuracy, 0) / relevant.length) * 100
      : null;

  const completedCheckIns = checkIns.filter((c) => c.completedAt !== null).length;
  const checkInScore =
    checkIns.length > 0 ? (completedCheckIns / checkIns.length) * 100 : null;

  // If we have both signals, average them; otherwise use whichever we have
  if (gameScore !== null && checkInScore !== null) {
    return Math.round((gameScore + checkInScore) / 2);
  }
  if (gameScore !== null) return Math.round(gameScore);
  if (checkInScore !== null) return Math.round(checkInScore);
  return 0;
}

/**
 * Compute trend direction and percentage change by comparing the current
 * 14-day window against the preceding 14-day window.
 */
function computeDirection(
  currentScore: number,
  previousScore: number
): { changePct: number | null; direction: TrendMetric["direction"] } {
  if (previousScore === 0 && currentScore === 0) {
    return { changePct: null, direction: "unknown" };
  }
  if (previousScore === 0) {
    // No baseline to compare against
    return { changePct: null, direction: "unknown" };
  }

  const changePct = ((currentScore - previousScore) / previousScore) * 100;

  let direction: TrendMetric["direction"];
  if (changePct <= -1) {
    direction = "down";
  } else if (changePct >= 1) {
    direction = "up";
  } else {
    direction = "flat";
  }

  return { changePct: Math.round(changePct * 10) / 10, direction };
}

/**
 * Compute all four trend metrics given sessions and check-ins
 * split into current 14-day window and previous 14-day window.
 */
export function computeTrends(
  currentSessions: GameSession[],
  previousSessions: GameSession[],
  currentCheckIns: CheckIn[],
  previousCheckIns: CheckIn[]
): TrendMetric[] {
  const metrics: {
    label: TrendMetric["label"];
    current: number;
    previous: number;
  }[] = [
    {
      label: "Memory",
      current: computeMemoryScore(currentSessions),
      previous: computeMemoryScore(previousSessions),
    },
    {
      label: "Attention",
      current: computeAttentionScore(currentSessions),
      previous: computeAttentionScore(previousSessions),
    },
    {
      label: "Pattern Recognition",
      current: computePatternScore(currentSessions),
      previous: computePatternScore(previousSessions),
    },
    {
      label: "Routine Recall",
      current: computeRoutineScore(currentSessions, currentCheckIns),
      previous: computeRoutineScore(previousSessions, previousCheckIns),
    },
  ];

  return metrics.map(({ label, current, previous }) => {
    const { changePct, direction } = computeDirection(current, previous);
    return { label, score: current, changePct, direction };
  });
}

/**
 * Decline alert rule: fire ONLY if ≥2 of the 4 scored metrics show
 * direction "down" AND changePct ≤ -8. Deliberately conservative —
 * must not fire on one bad session.
 */
export function shouldFireAlert(trends: TrendMetric[]): boolean {
  const decliningMetrics = trends.filter(
    (t) =>
      t.direction === "down" && t.changePct !== null && t.changePct <= -8
  );
  return decliningMetrics.length >= 2;
}
