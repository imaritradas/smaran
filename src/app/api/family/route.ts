import { NextRequest, NextResponse } from "next/server";
import {
  saveFamilyMember,
  getFamilyMembersForPatient,
  deleteFamilyMember,
} from "@/lib/serverStore";

/**
 * GET /api/family?patientId=pat_xxx
 * Returns all family members for a patient.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId query parameter is required" },
        { status: 400 }
      );
    }

    const members = await getFamilyMembersForPatient(patientId);
    return NextResponse.json({ members });
  } catch (err) {
    console.error("[Family API GET]", err);
    const message = err instanceof Error ? err.message : "Failed to fetch family members";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/family
 * Body: { id?, patientId, name, relation, photoBase64 }
 * Creates or updates a family member.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, patientId, name, relation, photoBase64 } = body;

    if (!patientId || !name || !relation || !photoBase64) {
      return NextResponse.json(
        { error: "patientId, name, relation, and photoBase64 are required" },
        { status: 400 }
      );
    }

    const memberId = id || `fam_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record = {
      id: memberId,
      patientId,
      name: name.trim(),
      relation: relation.trim(),
      photoBase64,
      createdAt: new Date().toISOString(),
    };

    await saveFamilyMember(record);

    return NextResponse.json({ member: record }, { status: 201 });
  } catch (err) {
    console.error("[Family API POST]", err);
    const message = err instanceof Error ? err.message : "Failed to save family member";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/family?id=fam_xxx
 * Removes a family member.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const memberId = searchParams.get("id");

    if (!memberId) {
      return NextResponse.json(
        { error: "id query parameter is required" },
        { status: 400 }
      );
    }

    const success = await deleteFamilyMember(memberId);
    if (!success) {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Family API DELETE]", err);
    const message = err instanceof Error ? err.message : "Failed to delete family member";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
