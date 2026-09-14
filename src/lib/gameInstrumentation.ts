import { GameSession, GameType } from "./types";

/**
 * Shared game instrumentation shell.
 *
 * Every game uses the same start/log/end lifecycle so that adding
 * a sixth game later doesn't mean rebuilding the scoring pipeline.
 * Per-action timestamps are logged for potential future analysis
 * (e.g., "did reaction time degrade within a single session?").
 */

interface ActionLog {
  action: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface SessionTracker {
  gameType: GameType;
  patientId: string;
  startTime: number;
  actions: ActionLog[];
  /** Running count of correct responses, updated by the game */
  correctCount: number;
  /** Running count of total responses, updated by the game */
  totalCount: number;
  /** Running count of repeated mistakes */
  repeatedMistakes: number;
  /** Accumulated response times for averaging */
  responseTimes: number[];
}

/** Call at game start. Returns a tracker that the game passes back into logAction/endSession. */
export function startSession(
  gameType: GameType,
  patientId: string
): SessionTracker {
  return {
    gameType,
    patientId,
    startTime: Date.now(),
    actions: [],
    correctCount: 0,
    totalCount: 0,
    repeatedMistakes: 0,
    responseTimes: [],
  };
}

/** Log a single player action (tap, match, sequence step, etc.) with optional data. */
export function logAction(
  tracker: SessionTracker,
  action: string,
  data?: Record<string, unknown>
): void {
  tracker.actions.push({
    action,
    timestamp: Date.now(),
    data,
  });
}

/**
 * End the session and produce a GameSession record ready for IndexedDB.
 *
 * The caller should have updated correctCount, totalCount, repeatedMistakes,
 * and responseTimes on the tracker during gameplay.
 */
export function endSession(tracker: SessionTracker): GameSession {
  const now = Date.now();
  const durationMs = now - tracker.startTime;

  const accuracy =
    tracker.totalCount > 0 ? tracker.correctCount / tracker.totalCount : 0;

  const avgResponseMs =
    tracker.responseTimes.length > 0
      ? tracker.responseTimes.reduce((a, b) => a + b, 0) /
        tracker.responseTimes.length
      : 0;

  return {
    id: generateId(),
    patientId: tracker.patientId,
    gameType: tracker.gameType,
    playedAt: tracker.startTime,
    accuracy: Math.min(1, Math.max(0, accuracy)),
    avgResponseMs: Math.round(avgResponseMs),
    repeatedMistakes: tracker.repeatedMistakes,
    durationMs,
    synced: false,
  };
}

/** Friendly alias to record a user attempt in a game */
export function recordAttempt(
  tracker: SessionTracker | null,
  isCorrect: boolean,
  responseMs: number
): void {
  if (!tracker) return;
  tracker.totalCount++;
  if (isCorrect) {
    tracker.correctCount++;
  } else {
    tracker.repeatedMistakes++;
  }
  tracker.responseTimes.push(responseMs);
  logAction(tracker, isCorrect ? "correct" : "incorrect", { responseMs });
}

/** Friendly alias to complete a session and get GameSession */
export function completeSession(tracker: SessionTracker): GameSession {
  return endSession(tracker);
}

/** Simple ID generator — no external dependency needed for offline-first IDs. */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}


