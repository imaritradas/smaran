import { NextRequest, NextResponse } from "next/server";
import {
  getGameSessionsForPatient,
  getCheckInsForPatient,
  getPatientById,
  getAlertsForPatient,
  createAlert,
} from "@/lib/serverStore";
import { computeTrends, shouldFireAlert } from "@/lib/trends";
import { sendSms } from "@/lib/sms";
import { TrendMetric } from "@/lib/types";

/**
 * POST /api/trends
 * Computes cognitive trends for a patient from all synced game sessions & check-ins.
 * Returns: { trends, sessions, familyFacesCount, alertFired, alerts }
 */
export async function POST(request: NextRequest) {
  try {
    const { patientId } = await request.json();

    if (!patientId) {
      return NextResponse.json(
        { error: "Missing required field: patientId" },
        { status: 400 }
      );
    }

    const now = Date.now();
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;
    const currentStart = now - fourteenDays;
    const previousStart = currentStart - fourteenDays;

    // Fetch sessions and check-ins from serverStore
    const allSessions = await getGameSessionsForPatient(patientId);
    const allCheckIns = await getCheckInsForPatient(patientId);

    const currentSessions = allSessions.filter((s) => s.playedAt >= currentStart);
    const previousSessions = allSessions.filter(
      (s) => s.playedAt >= previousStart && s.playedAt < currentStart
    );

    const currentCheckIns = allCheckIns.filter((c) => c.scheduledFor >= currentStart);
    const previousCheckIns = allCheckIns.filter(
      (c) => c.scheduledFor >= previousStart && c.scheduledFor < currentStart
    );

    let trends: TrendMetric[];

    // If there is real session data, compute trends
    if (allSessions.length > 0) {
      trends = computeTrends(
        currentSessions,
        previousSessions,
        currentCheckIns,
        previousCheckIns
      );
    } else {
      // Baseline metrics for newly registered patient
      trends = [
        { label: "Memory", score: 80, changePct: null, direction: "unknown" },
        { label: "Attention", score: 80, changePct: null, direction: "unknown" },
        { label: "Pattern Recognition", score: 80, changePct: null, direction: "unknown" },
        { label: "Routine Recall", score: 80, changePct: null, direction: "unknown" },
      ];
    }

    // Family Faces count in the last 7 days
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const familyFacesSessions = allSessions.filter(
      (s) => s.gameType === "family-faces" && s.playedAt >= oneWeekAgo
    );

    // Check decline alert rule
    let alertFired = false;
    if (shouldFireAlert(trends)) {
      const decliningMetrics = trends
        .filter((t) => t.direction === "down" && t.changePct !== null && t.changePct <= -8)
        .map((t) => `${t.label} (${t.changePct}%)`)
        .join(", ");

      const alertMessage = `Consistent decline detected in ${decliningMetrics} over the past 14 days. Consider scheduling a wellness check.`;
      await createAlert(patientId, alertMessage);

      const patient = await getPatientById(patientId);
      if (patient?.caregiverPhone) {
        await sendSms(patient.caregiverPhone, alertMessage);
      }
      alertFired = true;
    }

    const alerts = await getAlertsForPatient(patientId);

    return NextResponse.json({
      trends,
      sessions: allSessions.slice(0, 15), // Return recent 15 sessions for display
      totalSessionsCount: allSessions.length,
      familyFacesCount: familyFacesSessions.length,
      alertFired,
      alerts,
    });
  } catch (err) {
    console.error("[Trends API POST]", err);
    const message = err instanceof Error ? err.message : "Trend computation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
