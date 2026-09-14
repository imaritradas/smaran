import { NextRequest, NextResponse } from "next/server";
import {
  createPatient,
  getPatientsByCaregiver,
  getPatientById,
  getPatientByCode,
} from "@/lib/serverStore";

/**
 * POST /api/patients
 * Registers a new patient and generates a unique 6-digit pairing code.
 * Body: { name, caregiverId, caregiverPhone, preferredLanguage?, photoUrl? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, caregiverId, caregiverPhone, preferredLanguage, photoUrl } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Patient name is required" },
        { status: 400 }
      );
    }

    const { patient, pairingCode } = await createPatient({
      name: name.trim(),
      caregiverId: caregiverId || "cg_default",
      caregiverPhone: caregiverPhone || "+91 98000 00000",
      preferredLanguage: preferredLanguage || "as",
      photoUrl,
    });

    return NextResponse.json({ patient, pairingCode }, { status: 201 });
  } catch (err) {
    console.error("[Patients API POST]", err);
    const message = err instanceof Error ? err.message : "Failed to create patient";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/patients
 * Supports:
 * - ?code=123456 -> Look up patient by 6-digit pairing code (for patient pairing)
 * - ?patientId=pat_xxx -> Look up specific patient details
 * - ?caregiverId=cg_xxx -> List all patients for a caregiver
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const patientId = searchParams.get("patientId");
    const caregiverId = searchParams.get("caregiverId");

    // 1. Lookup by 6-digit pairing code
    if (code) {
      const patient = await getPatientByCode(code.trim());
      if (!patient) {
        return NextResponse.json(
          { error: "No patient found matching this 6-digit code" },
          { status: 404 }
        );
      }
      return NextResponse.json({ patient });
    }

    // 2. Lookup by patientId
    if (patientId) {
      const patient = await getPatientById(patientId);
      if (!patient) {
        return NextResponse.json(
          { error: "Patient not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ patient });
    }

    // 3. List patients for caregiver (defaults to cg_default if none given)
    const effectiveCaregiverId = caregiverId || "cg_default";
    const patients = await getPatientsByCaregiver(effectiveCaregiverId);
    return NextResponse.json({ patients });
  } catch (err) {
    console.error("[Patients API GET]", err);
    const message = err instanceof Error ? err.message : "Failed to retrieve patients";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/patients?patientId=pat_xxx
 * Removes a patient and associated records.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "patientId is required" },
        { status: 400 }
      );
    }

    const { deletePatient } = await import("@/lib/serverStore");
    const success = await deletePatient(patientId);

    if (!success) {
      return NextResponse.json(
        { error: "Patient not found or could not be deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Patient removed successfully" });
  } catch (err) {
    console.error("[Patients API DELETE]", err);
    const message = err instanceof Error ? err.message : "Failed to delete patient";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
