import { NextRequest, NextResponse } from "next/server";
import {
  getNotificationsForPatient,
  createNotification,
  markNotificationAsRead,
  deleteNotification,
} from "@/lib/serverStore";

/**
 * GET /api/notifications?patientId=pat_xxx
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

    const notifications = await getNotificationsForPatient(patientId);
    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("[Notifications API GET]", err);
    const message = err instanceof Error ? err.message : "Failed to get notifications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/notifications
 * Body: { patientId, title, message, type?, priority? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, title, message, type, priority } = body;

    if (!patientId || !title || !message) {
      return NextResponse.json(
        { error: "patientId, title, and message are required" },
        { status: 400 }
      );
    }

    const notification = await createNotification({
      patientId,
      title,
      message,
      type: type || "caregiver",
      priority: priority || "normal",
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (err) {
    console.error("[Notifications API POST]", err);
    const message = err instanceof Error ? err.message : "Failed to create notification";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications
 * Body: { id } -> marks notification as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const success = await markNotificationAsRead(id);
    if (!success) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Notifications API PATCH]", err);
    const message = err instanceof Error ? err.message : "Failed to update notification";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications?id=notif_xxx
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

    const success = await deleteNotification(id);
    if (!success) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Notifications API DELETE]", err);
    const message = err instanceof Error ? err.message : "Failed to delete notification";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
