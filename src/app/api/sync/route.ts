import { NextRequest, NextResponse } from "next/server";
import { syncGameSessions } from "@/lib/serverStore";
import { GameSession, CheckIn } from "@/lib/types";

/**
 * POST /api/sync
 * Accepts batched game sessions and check-ins from the offline store,
 * commits them to persistent storage (local store + Cloud Firestore if configured),
 * and maintains complete data integrity between patient devices and caregiver dashboard.
 *
 * Body: { sessions?: GameSession[], checkIns?: CheckIn[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      sessions?: GameSession[];
      checkIns?: CheckIn[];
    };

    const sessions = body.sessions || [];
    const checkIns = body.checkIns || [];

    const { syncedCount } = await syncGameSessions(sessions, checkIns);

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      sessionsSynced: sessions.length,
      checkInsSynced: checkIns.length,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("[Sync API POST]", err);
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
