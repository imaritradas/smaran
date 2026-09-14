import { NextRequest, NextResponse } from "next/server";
import {
  getRemindersForPatient,
  createReminder,
  toggleReminderStatus,
  deleteReminder,
} from "@/lib/serverStore";

/**
 * GET /api/reminders?patientId=pat_xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId parameter is required" },
        { status: 400 }
      );
    }

    const reminders = await getRemindersForPatient(patientId);
    return NextResponse.json({ reminders });
  } catch (err) {
    console.error("[Reminders API GET]", err);
    const message = err instanceof Error ? err.message : "Failed to get reminders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/reminders
 * Body: { patientId, title, scheduledTime, category? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, title, scheduledTime, category } = body;

    if (!patientId || !title) {
      return NextResponse.json(
        { error: "patientId and title are required" },
        { status: 400 }
      );
    }

    const reminder = await createReminder({
      patientId,
      title,
      scheduledTime: scheduledTime || "09:00",
      category: category || "general",
    });

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (err) {
    console.error("[Reminders API POST]", err);
    const message = err instanceof Error ? err.message : "Failed to create reminder";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/reminders
 * Body: { id, completed }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, completed } = body;

    if (!id || typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "id and completed boolean are required" },
        { status: 400 }
      );
    }

    const reminder = await toggleReminderStatus(id, completed);
    if (!reminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ reminder });
  } catch (err) {
    console.error("[Reminders API PATCH]", err);
    const message = err instanceof Error ? err.message : "Failed to update reminder";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/reminders?id=rem_xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id parameter is required" },
        { status: 400 }
      );
    }

    const success = await deleteReminder(id);
    if (!success) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Reminders API DELETE]", err);
    const message = err instanceof Error ? err.message : "Failed to delete reminder";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
