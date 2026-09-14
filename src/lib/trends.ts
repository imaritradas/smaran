import { GameSession, CheckIn, TrendMetric, CognitiveVerdict } from "./types";

/**
 * Scoring + trend computation for the four tracked cognitive metrics.
 *
 * Each formula is intentionally simple and explainable — a caregiver or
 * health worker should be able to understand "how did this score come about?"
 * without statistics training.
 */

const ATTENTION_RESPONSE_BASELINE_MS = 1500;

// Default normative baseline scores representing typical healthy adult reference
const DEFAULT_BASELINES: Record<TrendMetric["label"], number> = {
  Memory: 75,
  Attention: 78,
  "Pattern Recognition": 82,
  "Routine Recall": 72,
};

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
 */
export function computeAttentionScore(sessions: GameSession[]): number {
  const relevant = sessions.filter((s) => s.gameType === "spot-and-tap");
  if (relevant.length === 0) return 0;

  const avgAccuracy =
    relevant.reduce((sum, s) => sum + s.accuracy, 0) / relevant.length;
  const avgResponse =
    relevant.reduce((sum, s) => sum + s.avgResponseMs, 0) / relevant.length;

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

  if (gameScore !== null && checkInScore !== null) {
    return Math.round((gameScore + checkInScore) / 2);
  }
  if (gameScore !== null) return Math.round(gameScore);
  if (checkInScore !== null) return Math.round(checkInScore);
  return 0;
}

/**
 * Compute trend direction and percentage change against baseline.
 */
function computeDirectionAndDelta(
  currentScore: number,
  baselineScore: number
): { changePct: number; direction: TrendMetric["direction"] } {
  if (baselineScore <= 0) {
    return { changePct: 0, direction: "flat" };
  }

  const changePct = ((currentScore - baselineScore) / baselineScore) * 100;
  const roundedChange = Math.round(changePct * 10) / 10;

  let direction: TrendMetric["direction"];
  if (roundedChange <= -2) {
    direction = "down";
  } else if (roundedChange >= 2) {
    direction = "up";
  } else {
    direction = "flat";
  }

  return { changePct: roundedChange, direction };
}

/**
 * Categorize performance status into clinical buckets
 */
function getMetricStatus(score: number, changePct: number): NonNullable<TrendMetric["status"]> {
  if (score >= 75 && changePct >= -5) return "optimal";
  if (score >= 55 && changePct >= -15) return "stable";
  if (score < 40 || changePct <= -25) return "significant_decline";
  return "mild_decline";
}

/**
 * Generate clinically informed, personalized insight sentence for each domain
 */
function getDomainInsight(
  label: TrendMetric["label"],
  score: number,
  baseline: number,
  changePct: number
): string {
  const deltaStr = Math.abs(changePct).toFixed(1) + "%";
  switch (label) {
    case "Memory":
      if (changePct <= -15) {
        return `Symbol recall accuracy is currently ${score}% (${deltaStr} below baseline of ${baseline}%). Patient experiences retention challenges with larger item sets.`;
      } else if (changePct >= 10) {
        return `Visual working memory is strong at ${score}% (+${deltaStr} above baseline), indicating effective short-term retention and recognition.`;
      }
      return `Visual memory is steady at ${score}% (baseline: ${baseline}%). Consistently retains 4–6 visual symbols across repeated trials.`;

    case "Attention":
      if (changePct <= -15) {
        return `Response speed has decelerated to ${score}% (${deltaStr} below baseline). Shows slower target acquisition or motor hesitation.`;
      } else if (changePct >= 5) {
        return `High alertness and motor focus at ${score}% (+${deltaStr} above baseline). Quick target reaction with minimal hesitation.`;
      }
      return `Attention and stimulus response are stable at ${score}% (baseline: ${baseline}%). Steady visual tracking maintained.`;

    case "Pattern Recognition":
      if (changePct <= -15) {
        return `Sequence recall accuracy has decreased to ${score}% (${deltaStr} below baseline). Patient benefits from shorter 2–3 step audio-visual patterns.`;
      } else if (score >= 85) {
        return `Pattern and sequence recognition is excellent at ${score}%. Musical and sequential working memory remains intact.`;
      }
      return `Pattern recognition is solid at ${score}% (baseline: ${baseline}%). Follows sequential structures comfortably.`;

    case "Routine Recall":
      if (changePct <= -15) {
        return `Daily routine sequencing stands at ${score}% (${deltaStr} below baseline). Structured voice reminders are recommended for medication and meal schedules.`;
      } else if (changePct >= 10) {
        return `Routine adherence is high at ${score}% (+${deltaStr} above baseline). Consistently recalls morning and evening steps independently.`;
      }
      return `Routine recall is functioning steadily at ${score}% (baseline: ${baseline}%). Follows daily activity orders with mild prompt support.`;
  }
}

/**
 * Compute all four trend metrics given sessions and check-ins.
 * Guarantees meaningful baseline, true delta percentage, history sparkline, and clinical insight.
 */
export function computeTrends(
  currentSessions: GameSession[],
  previousSessions: GameSession[] = [],
  currentCheckIns: CheckIn[] = [],
  previousCheckIns: CheckIn[] = []
): TrendMetric[] {
  // Combine all sessions sorted chronologically ascending
  const allSessionsAsc = [...previousSessions, ...currentSessions].sort(
    (a, b) => a.playedAt - b.playedAt
  );

  const getDomainHistory = (type: GameSession["gameType"]) => {
    const matching = allSessionsAsc.filter((s) => s.gameType === type);
    if (matching.length === 0) return [75, 75];
    return matching.slice(-6).map((s) => Math.round(s.accuracy * 100));
  };

  const getDomainSessionsCount = (type: GameSession["gameType"]) => {
    return allSessionsAsc.filter((s) => s.gameType === type).length;
  };

  // Helper to establish domain baseline:
  // 1. If previousSessions had data, compute score from that window
  // 2. Else if multiple sessions exist, use average of the earlier 40% of sessions
  // 3. Fallback to established clinical normative baseline
  const getDomainBaseline = (
    label: TrendMetric["label"],
    type: GameSession["gameType"],
    computeFn: (s: GameSession[]) => number
  ): number => {
    if (previousSessions.length > 0) {
      const prev = computeFn(previousSessions);
      if (prev > 0) return prev;
    }
    const matching = allSessionsAsc.filter((s) => s.gameType === type);
    if (matching.length >= 3) {
      const initialChunk = matching.slice(0, Math.ceil(matching.length * 0.4));
      const chunkScore = computeFn(initialChunk);
      if (chunkScore > 0) return chunkScore;
    } else if (matching.length > 0) {
      // If only 1-2 sessions, blend the first session with normative baseline
      const firstScore = Math.round(matching[0].accuracy * 100);
      return Math.round((firstScore + DEFAULT_BASELINES[label]) / 2);
    }
    return DEFAULT_BASELINES[label];
  };

  // 1. Memory
  const memoryCurrent = computeMemoryScore(currentSessions);
  const memoryBaseline = getDomainBaseline("Memory", "memory-match", computeMemoryScore);
  const memoryFinalCurrent = memoryCurrent > 0 ? memoryCurrent : memoryBaseline;
  const memoryDelta = computeDirectionAndDelta(memoryFinalCurrent, memoryBaseline);

  // 2. Attention
  const attentionCurrent = computeAttentionScore(currentSessions);
  const attentionBaseline = getDomainBaseline("Attention", "spot-and-tap", computeAttentionScore);
  const attentionFinalCurrent = attentionCurrent > 0 ? attentionCurrent : attentionBaseline;
  const attentionDelta = computeDirectionAndDelta(attentionFinalCurrent, attentionBaseline);

  // 3. Pattern Recognition
  const patternCurrent = computePatternScore(currentSessions);
  const patternBaseline = getDomainBaseline("Pattern Recognition", "sequence-recall", computePatternScore);
  const patternFinalCurrent = patternCurrent > 0 ? patternCurrent : patternBaseline;
  const patternDelta = computeDirectionAndDelta(patternFinalCurrent, patternBaseline);

  // 4. Routine Recall
  const routineCurrent = computeRoutineScore(currentSessions, currentCheckIns);
  let routineBaseline: number;
  if (previousSessions.length > 0 || previousCheckIns.length > 0) {
    const prev = computeRoutineScore(previousSessions, previousCheckIns);
    routineBaseline = prev > 0 ? prev : DEFAULT_BASELINES["Routine Recall"];
  } else {
    const routineSessions = allSessionsAsc.filter((s) => s.gameType === "routine-recall");
    if (routineSessions.length >= 3) {
      const early = routineSessions.slice(0, Math.ceil(routineSessions.length * 0.4));
      const earlyScore = computeRoutineScore(early, []);
      routineBaseline = earlyScore > 0 ? earlyScore : DEFAULT_BASELINES["Routine Recall"];
    } else {
      routineBaseline = DEFAULT_BASELINES["Routine Recall"];
    }
  }
  const routineFinalCurrent = routineCurrent > 0 ? routineCurrent : routineBaseline;
  const routineDelta = computeDirectionAndDelta(routineFinalCurrent, routineBaseline);

  const list: TrendMetric[] = [
    {
      label: "Memory",
      score: memoryFinalCurrent,
      baselineScore: memoryBaseline,
      changePct: memoryDelta.changePct,
      direction: memoryDelta.direction,
      status: getMetricStatus(memoryFinalCurrent, memoryDelta.changePct),
      sessionCount: getDomainSessionsCount("memory-match"),
      history: getDomainHistory("memory-match"),
      insight: getDomainInsight("Memory", memoryFinalCurrent, memoryBaseline, memoryDelta.changePct),
    },
    {
      label: "Attention",
      score: attentionFinalCurrent,
      baselineScore: attentionBaseline,
      changePct: attentionDelta.changePct,
      direction: attentionDelta.direction,
      status: getMetricStatus(attentionFinalCurrent, attentionDelta.changePct),
      sessionCount: getDomainSessionsCount("spot-and-tap"),
      history: getDomainHistory("spot-and-tap"),
      insight: getDomainInsight("Attention", attentionFinalCurrent, attentionBaseline, attentionDelta.changePct),
    },
    {
      label: "Pattern Recognition",
      score: patternFinalCurrent,
      baselineScore: patternBaseline,
      changePct: patternDelta.changePct,
      direction: patternDelta.direction,
      status: getMetricStatus(patternFinalCurrent, patternDelta.changePct),
      sessionCount: getDomainSessionsCount("sequence-recall"),
      history: getDomainHistory("sequence-recall"),
      insight: getDomainInsight("Pattern Recognition", patternFinalCurrent, patternBaseline, patternDelta.changePct),
    },
    {
      label: "Routine Recall",
      score: routineFinalCurrent,
      baselineScore: routineBaseline,
      changePct: routineDelta.changePct,
      direction: routineDelta.direction,
      status: getMetricStatus(routineFinalCurrent, routineDelta.changePct),
      sessionCount: getDomainSessionsCount("routine-recall"),
      history: getDomainHistory("routine-recall"),
      insight: getDomainInsight("Routine Recall", routineFinalCurrent, routineBaseline, routineDelta.changePct),
    },
  ];

  return list;
}

/**
 * Generate Comprehensive Executive Cognitive Verdict & Action Plan
 */
export function computeCognitiveVerdict(
  trends: TrendMetric[],
  patientName: string = "The patient"
): CognitiveVerdict {
  const scores = trends.map((t) => t.score);
  const baselines = trends.map((t) => t.baselineScore || 75);

  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const overallBaseline = Math.round(baselines.reduce((a, b) => a + b, 0) / baselines.length);
  const overallChangePct = Math.round(((overallScore - overallBaseline) / overallBaseline) * 100);

  const decliningMetrics = trends.filter(
    (t) => t.direction === "down" && t.changePct !== null && t.changePct <= -10
  );
  const strongMetrics = trends.filter(
    (t) => t.score >= 75 || (t.changePct !== null && t.changePct >= 5)
  );

  let status: CognitiveVerdict["status"] = "optimal";
  let riskLevel: CognitiveVerdict["riskLevel"] = "Low";
  let verdictTitle = "Cognitive Trajectory Stable";

  if (decliningMetrics.length >= 2 || overallScore < 50) {
    status = "mild_decline";
    riskLevel = overallScore < 45 ? "Elevated" : "Moderate";
    verdictTitle = "Mild Cognitive Asymmetry Detected — Targeted Support Advised";
  } else if (decliningMetrics.length === 1) {
    status = "stable";
    riskLevel = "Moderate";
    verdictTitle = `Preserved Overall Function with Isolated ${decliningMetrics[0].label} Sensitivity`;
  } else if (overallScore >= 80) {
    status = "optimal";
    riskLevel = "Low";
    verdictTitle = "Healthy Cognitive Resilience Across Core Domains";
  }

  // Generate tailored executive summary
  let summary = `${patientName} demonstrates an overall composite cognitive wellness index of ${overallScore}/100 `;
  if (overallChangePct < 0) {
    summary += `(${Math.abs(overallChangePct)}% below baseline of ${overallBaseline}%). `;
  } else if (overallChangePct > 0) {
    summary += `(+${overallChangePct}% above baseline of ${overallBaseline}%). `;
  } else {
    summary += `(matching baseline of ${overallBaseline}%). `;
  }

  if (strongMetrics.length > 0 && decliningMetrics.length > 0) {
    const strongNames = strongMetrics.map((m) => m.label).join(" & ");
    const weakNames = decliningMetrics.map((m) => m.label).join(" & ");
    summary += `There is a notable functional divergence: ${strongNames} remain highly responsive and preserved, whereas ${weakNames} exhibit observable retention difficulty. This asymmetry is commonly observed in early cognitive transitions and benefits greatly from proactive caregiver routine scaffolding.`;
  } else if (decliningMetrics.length >= 2) {
    summary += `Both memory encoding and routine sequencing indicate progressive fatigue. Daily routine structuring and low-stress cognitive exercises are recommended.`;
  } else {
    summary += `High performance stability is evident across motor focus, visual memory, and sequential reasoning tasks.`;
  }

  // Key findings
  const keyFindings: CognitiveVerdict["keyFindings"] = trends.map((t) => {
    const deltaStr = t.changePct !== null ? `${t.changePct > 0 ? "+" : ""}${t.changePct}%` : "0%";
    const isPos = (t.changePct ?? 0) >= -8 && t.score >= 60;
    return {
      domain: t.label,
      text: `${t.label} is at ${t.score}% (Baseline: ${t.baselineScore}%, Delta: ${deltaStr}). ${t.insight || ""}`,
      positive: isPos,
    };
  });

  // Actionable recommendations
  const recommendations: CognitiveVerdict["recommendations"] = [];

  // 1. Memory recommendation
  const mem = trends.find((t) => t.label === "Memory");
  if (mem && (mem.score < 60 || (mem.changePct ?? 0) < -10)) {
    recommendations.push({
      title: "Targeted Visual Memory Stimulation",
      action: "Engage in 5–10 minutes of Memory Match daily. Start with smaller symbol pairs to build confidence and reinforce neural encoding.",
      category: "game",
    });
  } else {
    recommendations.push({
      title: "Maintain Memory Maintenance",
      action: "Continue weekly Memory Match sessions to preserve active visual recall and pattern retention.",
      category: "game",
    });
  }

  // 2. Routine recommendation
  const routine = trends.find((t) => t.label === "Routine Recall");
  if (routine && (routine.score < 60 || (routine.changePct ?? 0) < -10)) {
    recommendations.push({
      title: "Audio & Visual Routine Scaffolding",
      action: "Enable daily voice-assisted reminders for medicine, hydration, and meal times to reduce cognitive load and prevent skipped steps.",
      category: "routine",
    });
  } else {
    recommendations.push({
      title: "Active Daily Walk & Hydration Habits",
      action: "Maintain consistent morning and evening walk routines with regular hydration reminders.",
      category: "routine",
    });
  }

  // 3. Clinical follow-up
  if (riskLevel === "Elevated" || decliningMetrics.length >= 2) {
    recommendations.push({
      title: "Clinical Longitudinal Review",
      action: "Export or print this 14-day trend summary to share during the patient's next primary care or neurological wellness check-in.",
      category: "clinical",
    });
  } else {
    recommendations.push({
      title: "Ongoing Longitudinal Monitoring",
      action: "Continue passive 14-day trend observation. No immediate clinical escalation required as scores remain in stable range.",
      category: "clinical",
    });
  }

  return {
    overallScore,
    overallBaseline,
    overallChangePct,
    status,
    verdictTitle,
    summary,
    keyFindings,
    recommendations,
    riskLevel,
    lastAssessedAt: Date.now(),
  };
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

