"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LocationStatusResponse } from "@/lib/types";

interface GPSMonitoringCardProps {
  patientId: string;
  patientName: string;
  onAlertTriggered?: () => void;
}

export default function GPSMonitoringCard({
  patientId,
  patientName,
  onAlertTriggered,
}: GPSMonitoringCardProps) {
  const [data, setData] = useState<LocationStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingRadius, setUpdatingRadius] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchLocationData = useCallback(async () => {
    try {
      const res = await fetch(`/api/location?patientId=${encodeURIComponent(patientId)}`);
      if (res.ok) {
        const json: LocationStatusResponse = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("[GPSMonitoringCard] Error loading location:", err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchLocationData();
    // Poll every 10 seconds for live updates
    const interval = setInterval(fetchLocationData, 10000);
    return () => clearInterval(interval);
  }, [fetchLocationData]);

  const handleUpdateRadius = async (newRadius: number) => {
    setUpdatingRadius(true);
    try {
      const res = await fetch("/api/location/safe-zone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          radiusMeters: newRadius,
        }),
      });
      if (res.ok) {
        await fetchLocationData();
        setActionSuccess(`Safe Zone radius updated to ${newRadius}m`);
        setTimeout(() => setActionSuccess(null), 3500);
      }
    } catch (err) {
      console.error("Failed to update radius:", err);
    } finally {
      setUpdatingRadius(false);
    }
  };

  const handleSetCurrentAsHome = () => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setUpdatingRadius(true);
          try {
            const res = await fetch("/api/location/safe-zone", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                patientId,
                homeLatitude: pos.coords.latitude,
                homeLongitude: pos.coords.longitude,
                homeAddress: "Caregiver Device Locked Location",
              }),
            });
            if (res.ok) {
              await fetchLocationData();
              setActionSuccess("Home coordinates locked to your current location!");
              setTimeout(() => setActionSuccess(null), 3500);
            }
          } catch (err) {
            console.error("Failed to set home:", err);
          } finally {
            setUpdatingRadius(false);
          }
        },
        (err) => {
          alert(`Could not fetch your device GPS: ${err.message}`);
        }
      );
    }
  };

  // ── Simulator Helpers for Testing & Demonstrations ──
  const handleSimulateMovement = async (mode: "wander" | "home" | "sos") => {
    if (!data?.safeZone) return;
    setSimulating(true);

    let lat = data.safeZone.homeLatitude;
    let lon = data.safeZone.homeLongitude;
    let isLostSOS = false;

    if (mode === "wander") {
      // Offset by ~450m north-east (0.0035 deg latitude ~ 390m)
      lat += 0.0038;
      lon += 0.0035;
    } else if (mode === "home") {
      // Within 25m of home
      lat += 0.00015;
      lon += 0.0001;
    } else if (mode === "sos") {
      // Wandering with SOS active
      lat += 0.0042;
      lon += 0.004;
      isLostSOS = true;
    }

    try {
      const res = await fetch("/api/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          latitude: lat,
          longitude: lon,
          accuracy: 8,
          isLostSOS,
        }),
      });

      if (res.ok) {
        await fetchLocationData();
        if (onAlertTriggered) onAlertTriggered();

        if (mode === "wander") {
          setActionSuccess("⚠️ Simulated Wandering: Patient moved outside safe zone! Alert dispatched.");
        } else if (mode === "home") {
          setActionSuccess("🟢 Simulated Return: Patient is now safe at home.");
        } else {
          setActionSuccess("🚨 Simulated SOS: Patient activated 'Take Me Home'!");
        }
        setTimeout(() => setActionSuccess(null), 4500);
      }
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setSimulating(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="surface-raised p-6 rounded-3xl border border-[var(--border)] shadow-card animate-pulse">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mb-4" />
        <div className="h-64 bg-slate-100 dark:bg-slate-900 rounded-2xl" />
      </div>
    );
  }

  const cur = data?.currentLocation;
  const sz = data?.safeZone;
  const dist = data?.distanceMeters ?? 0;
  const isBreached = data?.isOutsideSafeZone ?? false;
  const radius = sz?.radiusMeters ?? 250;
  const isSOS = cur?.isLostSOS ?? false;

  // Calculate coordinates relative to home for SVG radar (center at 150, 150)
  const maxViewMeters = Math.max(radius * 1.6, 600);
  const scale = 110 / maxViewMeters; // pixels per meter on radar

  let patientX = 150;
  let patientY = 150;

  if (cur && sz) {
    // 1 deg lat ~ 111,000m, 1 deg lon ~ 111,000m * cos(lat)
    const dLatMeters = (cur.latitude - sz.homeLatitude) * 111320;
    const dLonMeters = (cur.longitude - sz.homeLongitude) * 111320 * Math.cos((sz.homeLatitude * Math.PI) / 180);

    patientX = 150 + dLonMeters * scale;
    patientY = 150 - dLatMeters * scale; // SVG Y goes downwards

    // Bound within SVG
    patientX = Math.max(20, Math.min(280, patientX));
    patientY = Math.max(20, Math.min(280, patientY));
  }

  const safeRadiusPx = Math.min(130, radius * scale);

  const googleMapsUrl = cur
    ? `https://www.google.com/maps/search/?api=1&query=${cur.latitude},${cur.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${sz?.homeLatitude || 26.1445},${sz?.homeLongitude || 91.7362}`;

  return (
    <div className="surface-raised p-6 sm:p-7 rounded-3xl border border-[var(--border)] shadow-card space-y-6 animate-fade-in">
      {/* Header & Status Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Live Patient Location & Safety
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
            GPS Geofencing & Wandering Radar
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            Real-time safe boundary tracking for {patientName}
          </p>
        </div>

        {/* Dynamic Status Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          {isSOS ? (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-500 text-white text-xs font-black tracking-wide shadow-lg shadow-rose-500/30 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              🚨 EMERGENCY SOS ACTIVE
            </span>
          ) : isBreached ? (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-500/15 border border-rose-500 text-rose-600 dark:text-rose-400 text-xs font-black tracking-wide shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              ⚠️ SAFE ZONE BREACH
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500 text-emerald-600 dark:text-emerald-400 text-xs font-black tracking-wide shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              🟢 SAFE (INSIDE ZONE)
            </span>
          )}
        </div>
      </div>

      {/* Action Success Toast */}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 text-xs sm:text-sm font-bold text-sky-800 dark:text-sky-300 animate-scale-in flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Radar Map & Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Radar Container */}
        <div className="lg:col-span-7 surface-overlay rounded-3xl border border-[var(--border)] p-5 flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100 shadow-inner min-h-[340px]">
          {/* Top Info Bar */}
          <div className="w-full flex items-center justify-between text-[11px] font-mono font-bold text-slate-400 z-10 px-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>RADAR SCAN: ACTIVE</span>
            </div>
            <span>RANGE: {maxViewMeters}M</span>
          </div>

          {/* SVG Visual Radar */}
          <svg viewBox="0 0 300 300" className="w-full max-w-[280px] h-[280px] my-auto">
            <defs>
              {/* Radar Grid Pattern */}
              <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.15" />
                <stop offset="70%" stopColor="#0284c7" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="safeZoneFill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.08" />
              </radialGradient>
            </defs>

            {/* Radar Circular Grid Lines */}
            <circle cx="150" cy="150" r="140" fill="url(#radarGlow)" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="150" cy="150" r="100" fill="none" stroke="#1e293b" strokeWidth="1" />
            <circle cx="150" cy="150" r="60" fill="none" stroke="#1e293b" strokeWidth="1" />

            {/* Crosshairs */}
            <line x1="150" y1="10" x2="150" y2="290" stroke="#1e293b" strokeWidth="1" />
            <line x1="10" y1="150" x2="290" y2="150" stroke="#1e293b" strokeWidth="1" />

            {/* Safe Zone Geofence Circle */}
            <circle
              cx="150"
              cy="150"
              r={safeRadiusPx}
              fill="url(#safeZoneFill)"
              stroke={isBreached ? "#f43f5e" : "#10b981"}
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />

            {/* Home Marker in Center */}
            <g transform="translate(150, 150)">
              <circle r="14" fill="#0f766e" opacity="0.8" />
              <circle r="8" fill="#14b8a6" />
              {/* Home Icon */}
              <path
                d="M -5 2 L -5 -2 L 0 -6 L 5 -2 L 5 2 Z"
                fill="#ffffff"
              />
              <text y="24" textAnchor="middle" fill="#5eead4" fontSize="9" fontWeight="bold" fontFamily="monospace">
                HOME
              </text>
            </g>

            {/* Connection Line between Home & Patient */}
            <line
              x1="150"
              y1="150"
              x2={patientX}
              y2={patientY}
              stroke={isBreached ? "#f43f5e" : "#38bdf8"}
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />

            {/* Patient Pin Marker */}
            <g transform={`translate(${patientX}, ${patientY})`}>
              <circle
                r="18"
                fill={isBreached ? "#f43f5e" : "#0284c7"}
                opacity="0.35"
                className="animate-ping"
              />
              <circle
                r="12"
                fill={isBreached ? "#e11d48" : "#0284c7"}
                stroke="#ffffff"
                strokeWidth="2.5"
                className="shadow-lg"
              />
              <circle r="4" fill="#ffffff" />
              <text
                y="-18"
                textAnchor="middle"
                fill={isBreached ? "#fda4af" : "#7dd3fc"}
                fontSize="10"
                fontWeight="900"
                fontFamily="system-ui"
              >
                {patientName.split(" ")[0]} ({dist}m)
              </text>
            </g>
          </svg>

          {/* Bottom Coordinates & Google Maps Link */}
          <div className="w-full flex items-center justify-between z-10 px-2 pt-2 border-t border-slate-800 text-[11px]">
            <span className="font-mono text-slate-400">
              {cur ? `${cur.latitude.toFixed(5)}, ${cur.longitude.toFixed(5)}` : "Acquiring..."}
            </span>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 font-bold hover:underline"
            >
              <span>View in Google Maps</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            </a>
          </div>
        </div>

        {/* Live Metrics & Geofence Configuration */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="surface-overlay p-3.5 rounded-2xl border border-[var(--border)]">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-muted)] block">
                Distance to Home
              </span>
              <div className="text-2xl font-black text-[var(--text-primary)] font-mono mt-0.5">
                {dist} <span className="text-sm font-bold text-[var(--text-muted)]">meters</span>
              </div>
              <span className={`text-[10px] font-bold ${isBreached ? "text-rose-600" : "text-emerald-600"}`}>
                {isBreached ? "Outside Boundary" : "Within Safe Radius"}
              </span>
            </div>

            <div className="surface-overlay p-3.5 rounded-2xl border border-[var(--border)]">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-muted)] block">
                Safe Zone Radius
              </span>
              <div className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono mt-0.5">
                {radius} <span className="text-sm font-bold text-[var(--text-muted)]">meters</span>
              </div>
              <span className="text-[10px] font-bold text-[var(--text-muted)]">
                Configurable Radius
              </span>
            </div>
          </div>

          {/* Home Address Reference Card */}
          <div className="surface-overlay p-3.5 rounded-2xl border border-[var(--border)] space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--text-muted)] block">
              Registered Home Location
            </span>
            <p className="text-xs font-bold text-[var(--text-primary)] truncate">
              {sz?.homeAddress || "Zoo Road, Guwahati, Assam"}
            </p>
            <p className="text-[11px] font-mono text-[var(--text-muted)]">
              Lat: {sz?.homeLatitude.toFixed(4)}, Lon: {sz?.homeLongitude.toFixed(4)}
            </p>
          </div>

          {/* Radius Selector Pills */}
          <div className="space-y-2">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-[var(--text-secondary)] block">
              Adjust Geofence Safe Radius:
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {[100, 250, 500, 1000, 2000].map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={updatingRadius}
                  onClick={() => handleUpdateRadius(r)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-extrabold transition-all border ${
                    radius === r
                      ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                      : "surface-overlay text-[var(--text-secondary)] hover:border-sky-400 border-[var(--border)]"
                  }`}
                >
                  {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Caregiver Actions & Navigation Buttons */}
          <div className="space-y-2 pt-1">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-2xl blue-gradient hover:shadow-glow text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
              <span>Navigate to Patient in Google Maps</span>
            </a>

            <button
              type="button"
              disabled={updatingRadius}
              onClick={handleSetCurrentAsHome}
              className="w-full py-2.5 px-4 rounded-2xl surface-overlay hover:border-sky-400 text-[var(--text-secondary)] font-bold text-xs flex items-center justify-center gap-2 border border-[var(--border)] transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              <span>Set My Device Location as Home</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Demonstration / Simulator Drawer */}
      <div className="surface-overlay p-4 rounded-2xl border border-dashed border-[var(--border)] space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🧪</span>
            <span className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
              Caregiver Geofence Drill & Simulator
            </span>
          </div>
          <span className="text-[10px] font-bold text-[var(--text-muted)]">
            Test real-time alerts & geofence response
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            disabled={simulating}
            onClick={() => handleSimulateMovement("home")}
            className="py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-all flex items-center justify-center gap-1.5"
          >
            <span>🏠</span>
            <span>Simulate At Home</span>
          </button>

          <button
            type="button"
            disabled={simulating}
            onClick={() => handleSimulateMovement("wander")}
            className="py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-500/30 transition-all flex items-center justify-center gap-1.5"
          >
            <span>🚶</span>
            <span>Simulate Wandering</span>
          </button>

          <button
            type="button"
            disabled={simulating}
            onClick={() => handleSimulateMovement("sos")}
            className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-500/30 transition-all flex items-center justify-center gap-1.5"
          >
            <span>🚨</span>
            <span>Simulate Patient SOS</span>
          </button>
        </div>
      </div>
    </div>
  );
}
