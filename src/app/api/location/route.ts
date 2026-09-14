import { NextRequest, NextResponse } from "next/server";
import {
  recordPatientLocation,
  getPatientLocations,
  getPatientSafeZone,
  computeDistanceMeters,
  computeBearing,
} from "@/lib/serverStore";

/**
 * GET /api/location?patientId=...
 * Returns the latest GPS location, safe-zone config, distance to home, and recent history.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId") || "pat_602188";

    const [history, safeZone] = await Promise.all([
      getPatientLocations(patientId, 40),
      getPatientSafeZone(patientId),
    ]);

    const currentLocation = history.length > 0 ? history[history.length - 1] : null;

    let distanceMeters: number | null = null;
    let isOutsideSafeZone = false;
    let bearingDegrees = 0;

    if (currentLocation && safeZone) {
      distanceMeters = computeDistanceMeters(
        currentLocation.latitude,
        currentLocation.longitude,
        safeZone.homeLatitude,
        safeZone.homeLongitude
      );
      isOutsideSafeZone = safeZone.enabled && distanceMeters > safeZone.radiusMeters;
      bearingDegrees = computeBearing(
        currentLocation.latitude,
        currentLocation.longitude,
        safeZone.homeLatitude,
        safeZone.homeLongitude
      );
    }

    return NextResponse.json({
      currentLocation,
      safeZone,
      distanceMeters,
      isOutsideSafeZone,
      bearingDegrees,
      history,
    });
  } catch (err) {
    console.error("[GET /api/location]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch location data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/location
 * Receives GPS ping from patient app, computes geofence, dispatches safety alerts if breached or SOS.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId = "pat_602188",
      latitude,
      longitude,
      accuracy,
      heading,
      speed,
      isLostSOS,
    } = body;

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Missing latitude or longitude" },
        { status: 400 }
      );
    }

    const result = await recordPatientLocation({
      patientId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: accuracy !== undefined ? Number(accuracy) : 10,
      heading: heading !== undefined ? Number(heading) : null,
      speed: speed !== undefined ? Number(speed) : null,
      isLostSOS: !!isLostSOS,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/location]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to record location" },
      { status: 500 }
    );
  }
}
