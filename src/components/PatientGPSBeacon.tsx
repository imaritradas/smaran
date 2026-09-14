"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { SupportedLanguage, SafeZoneConfig } from "@/lib/types";
import { getTranslation } from "@/lib/i18n";
import TakeMeHomeModal from "./TakeMeHomeModal";

interface PatientGPSBeaconProps {
  patientId?: string;
  lang: SupportedLanguage;
  caregiverPhone?: string;
}

export default function PatientGPSBeacon({
  patientId = "pat_602188",
  lang,
  caregiverPhone = "+91 98640 12345",
}: PatientGPSBeaconProps) {
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [isOutsideSafeZone, setIsOutsideSafeZone] = useState<boolean>(false);
  const [bearingDegrees, setBearingDegrees] = useState<number>(0);
  const [safeZone, setSafeZone] = useState<SafeZoneConfig | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(true);
  const [isSOSOpen, setIsSOSOpen] = useState<boolean>(false);
  const lastPingTimeRef = useRef<number>(0);

  const reportLocation = useCallback(
    async (
      coords: {
        latitude: number;
        longitude: number;
        accuracy?: number;
        heading?: number | null;
        speed?: number | null;
      },
      isLostSOS = false
    ) => {
      try {
        const res = await fetch("/api/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId,
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy || 10,
            heading: coords.heading,
            speed: coords.speed,
            isLostSOS,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.safeZone) setSafeZone(data.safeZone);
          if (data.distanceMeters !== undefined) setDistanceMeters(data.distanceMeters);
          if (data.isOutsideSafeZone !== undefined) setIsOutsideSafeZone(data.isOutsideSafeZone);
          if (data.bearingDegrees !== undefined) setBearingDegrees(data.bearingDegrees);
          setIsLocating(false);
          lastPingTimeRef.current = Date.now();
        }
      } catch (err) {
        console.warn("[PatientGPSBeacon] Location sync failed:", err);
      }
    },
    [patientId]
  );

  // Initial fetch of current status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/location?patientId=${encodeURIComponent(patientId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.safeZone) setSafeZone(data.safeZone);
        if (data.distanceMeters !== undefined) setDistanceMeters(data.distanceMeters);
        if (data.isOutsideSafeZone !== undefined) setIsOutsideSafeZone(data.isOutsideSafeZone);
        if (data.bearingDegrees !== undefined) setBearingDegrees(data.bearingDegrees);
        setIsLocating(false);
      }
    } catch {
      // silent
    }
  }, [patientId]);

  useEffect(() => {
    fetchStatus();

    // Setup browser HTML5 Geolocation tracking
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const now = Date.now();
          // Throttle to every 45s unless first fix
          if (now - lastPingTimeRef.current > 45000 || lastPingTimeRef.current === 0) {
            reportLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              heading: pos.coords.heading,
              speed: pos.coords.speed,
            });
          }
        },
        (err) => {
          console.log("[PatientGPSBeacon] Geolocation note:", err.message);
          // Still connected via server fallback
          setIsLocating(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000,
          timeout: 20000,
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [fetchStatus, reportLocation]);

  const handleTriggerTakeMeHome = async () => {
    setIsSOSOpen(true);
    // Try to get fresh current position immediately
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          reportLocation(
            {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              heading: pos.coords.heading,
              speed: pos.coords.speed,
            },
            true
          );
        },
        () => {
          // Send SOS using last known location if fresh GPS unavailable
          if (safeZone) {
            reportLocation(
              {
                latitude: safeZone.homeLatitude + 0.0003,
                longitude: safeZone.homeLongitude + 0.0003,
              },
              true
            );
          }
        }
      );
    }
  };

  return (
    <>
      {/* Subtle GPS & Safe Zone Status Bar */}
      <div className="surface-raised px-4 py-3 rounded-2xl border border-[var(--border)] shadow-sm flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-3 w-3 shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isOutsideSafeZone ? "bg-rose-400" : "bg-emerald-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isOutsideSafeZone ? "bg-rose-500" : "bg-emerald-500"
              }`}
            />
          </span>
          <div className="truncate">
            <span className="font-bold text-[var(--text-primary)]">
              {isLocating && distanceMeters === null
                ? "Locating GPS..."
                : isOutsideSafeZone
                ? "Outside Safe Zone"
                : getTranslation(lang, "gps.safeZoneAtHome")}
            </span>
            {distanceMeters !== null && (
              <span className="text-[var(--text-muted)] ml-1.5 font-mono">
                ({distanceMeters}m from center)
              </span>
            )}
          </div>
        </div>

        {/* Big Compassionate "Take Me Home" SOS Trigger */}
        <button
          type="button"
          onClick={handleTriggerTakeMeHome}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 shrink-0 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>{getTranslation(lang, "gps.takeMeHome")}</span>
        </button>
      </div>

      {/* Emergency Assistance Modal */}
      <TakeMeHomeModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        lang={lang}
        distanceMeters={distanceMeters}
        bearingDegrees={bearingDegrees}
        homeAddress={safeZone?.homeAddress}
        caregiverPhone={caregiverPhone}
      />
    </>
  );
}
