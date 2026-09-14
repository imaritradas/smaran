import { NextRequest, NextResponse } from "next/server";
import { getPatientSafeZone, updatePatientSafeZone } from "@/lib/serverStore";

/**
 * GET /api/location/safe-zone?patientId=...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId") || "pat_602188";
    const safeZone = await getPatientSafeZone(patientId);
    return NextResponse.json({ safeZone });
  } catch (err) {
    console.error("[GET /api/location/safe-zone]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to get safe zone" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/location/safe-zone
 * Updates home latitude, longitude, address, and safe radius in meters.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId = "pat_602188",
      homeLatitude,
      homeLongitude,
      homeAddress,
      radiusMeters,
      enabled,
    } = body;

    const updated = await updatePatientSafeZone({
      patientId,
      ...(homeLatitude !== undefined && { homeLatitude: Number(homeLatitude) }),
      ...(homeLongitude !== undefined && { homeLongitude: Number(homeLongitude) }),
      ...(homeAddress !== undefined && { homeAddress: String(homeAddress) }),
      ...(radiusMeters !== undefined && { radiusMeters: Number(radiusMeters) }),
      ...(enabled !== undefined && { enabled: Boolean(enabled) }),
    });

    return NextResponse.json({ safeZone: updated });
  } catch (err) {
    console.error("[POST /api/location/safe-zone]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update safe zone" },
      { status: 500 }
    );
  }
}
