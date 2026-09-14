"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import TrendCard from "@/components/TrendCard";
import AlertCard from "@/components/AlertCard";
import {
  TrendMetric,
  CaregiverAlert,
  GameSession,
  Patient,
} from "@/lib/types";

export default function PatientDetailDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [trends, setTrends] = useState<TrendMetric[]>([
    { label: "Memory", score: 80, changePct: null, direction: "unknown" },
    { label: "Attention", score: 80, changePct: null, direction: "unknown" },
    { label: "Pattern Recognition", score: 80, changePct: null, direction: "unknown" },
    { label: "Routine Recall", score: 80, changePct: null, direction: "unknown" },
  ]);
  const [alerts, setAlerts] = useState<CaregiverAlert[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Quick reminder creator state
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderTime, setReminderTime] = useState("09:00");
  const [reminders, setReminders] = useState<
    Array<{ id: string; title: string; scheduledTime: string }>
  >([
    { id: "rem_1", title: "Morning Blood Pressure Tablet", scheduledTime: "08:30" },
    { id: "rem_2", title: "Midday Walk in Garden", scheduledTime: "16:00" },
  ]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      // 1. Fetch trends, sessions, and alerts via POST /api/trends
      const res = await fetch("/api/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.trends && data.trends.length > 0) {
          setTrends(data.trends);
        }
        if (data.sessions) {
          setSessions(data.sessions);
        }
        if (data.alerts) {
          setAlerts(data.alerts);
        }
      }

      // 2. Fetch patient info
      const pRes = await fetch(`/api/patients?patientId=${patientId}`);
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData.patient) {
          setPatient(pData.patient);
        }
      }
    } catch (err) {
      console.error("Failed to load patient data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadData();

    // Listen for live sync broadcasts from the patient app
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel("smaran_sync");
      channel.onmessage = (event) => {
        if (
          event.data?.type === "SESSION_SYNCED" ||
          event.data?.type === "PATIENT_PAIRED"
        ) {
          loadData();
        }
      };
      return () => channel.close();
    }
  }, [loadData]);

  const handleDeletePatient = async () => {
    const name = patient?.name || patientId;
    const confirmed = window.confirm(
      `Are you sure you want to remove patient "${name}"?\n\nThis will permanently delete their profile, paired code, and recorded sessions.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/patients?patientId=${encodeURIComponent(patientId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const channel = new BroadcastChannel("smaran_sync");
          channel.postMessage({ type: "PATIENT_DELETED", patientId });
          channel.close();
        }
        router.push("/dashboard");
      } else {
        alert(data.error || "Failed to remove patient");
      }
    } catch (err) {
      console.error("Failed to delete patient:", err);
      alert("Network error: Could not remove patient.");
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim()) return;
    setReminders((prev) => [
      ...prev,
      {
        id: `rem_${Date.now()}`,
        title: reminderTitle.trim(),
        scheduledTime: reminderTime,
      },
    ]);
    setReminderTitle("");
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-[var(--text-secondary)] font-bold">
        <div className="w-8 h-8 border-3 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p>Analyzing cognitive session trends & sync history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner with Patient Context */}
      <div className="surface-raised p-6 rounded-3xl border border-[var(--border)] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              <span>Back to Patient List</span>
            </Link>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-1.5">
            {patient ? patient.name : `Patient ${patientId}`}
          </h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[var(--text-secondary)] mt-1">
            <span>ID: <code className="font-mono text-[var(--text-primary)]">{patientId}</code></span>
            <span>&bull;</span>
            <span>
              Pairing Code:{" "}
              <span className="font-mono font-black text-sky-600 dark:text-sky-400 tracking-wider">
                {patient?.pairingCode || "N/A"}
              </span>
            </span>
            <span>&bull;</span>
            <span>
              Language:{" "}
              <span className="uppercase font-bold text-sky-600 dark:text-sky-400">
                {patient?.preferredLanguage || "as"}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/dashboard/patients/${patientId}/family-setup`}
            className="py-2.5 px-4 surface-overlay hover:border-sky-400 text-[var(--text-primary)] font-bold text-xs rounded-2xl border border-[var(--border)] transition-colors shadow-sm"
          >
            Family Photos
          </Link>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="py-2.5 px-4 blue-gradient hover:shadow-glow text-white font-bold text-xs rounded-2xl transition-all shadow-card flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={refreshing ? "animate-spin" : ""}
            >
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            <span>{refreshing ? "Syncing..." : "Refresh Trends"}</span>
          </button>

          <button
            onClick={handleDeletePatient}
            className="py-2.5 px-3.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold text-xs rounded-2xl border border-rose-200 dark:border-rose-900/40 transition-colors flex items-center gap-1.5 active:scale-95"
            title="Remove Patient"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            <span>Remove</span>
          </button>
        </div>
      </div>

      {/* Longitudinal Decline Alerts (if any) */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Longitudinal Trend Notifications</span>
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {alerts.map((alt) => (
              <AlertCard
                key={alt.id}
                alert={alt}
                onAcknowledge={handleAcknowledgeAlert}
              />
            ))}
          </div>
        </div>
      )}

      {/* 4 Trend Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            Cognitive Domain Trends (14-Day Rolling Window)
          </h3>
          <span className="text-xs text-[var(--text-muted)] font-medium">
            Based on {sessions.length} recorded session{sessions.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trends.map((metric) => (
            <TrendCard key={metric.label} metric={metric} />
          ))}
        </div>
      </div>

      {/* Reminders & Recent Sessions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 surface-raised rounded-3xl p-6 border border-[var(--border)] shadow-card space-y-4">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            Daily Routine Reminders (Assistance & Caregiver Loop)
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Schedule gentle voice and visual reminders that appear during routine
            activities and check-ins.
          </p>

          <form onSubmit={handleAddReminder} className="flex flex-col sm:flex-row gap-3 pt-2">
            <input
              type="text"
              required
              placeholder="e.g. Evening Ayurvedic herbal tea or Walk"
              value={reminderTitle}
              onChange={(e) => setReminderTitle(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-2xl surface-overlay border border-[var(--border)] text-sm focus:border-sky-400 focus:outline-none text-[var(--text-primary)]"
            />
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-32 px-3 py-2.5 rounded-2xl surface-overlay border border-[var(--border)] text-sm focus:border-sky-400 focus:outline-none text-[var(--text-primary)]"
            />
            <button
              type="submit"
              className="py-2.5 px-4 blue-gradient hover:shadow-glow text-white font-bold text-xs rounded-2xl shadow-card active:scale-95 transition-all"
            >
              Add Reminder
            </button>
          </form>

          <div className="divide-y divide-[var(--border)] pt-2">
            {reminders.map((rem) => (
              <div
                key={rem.id}
                className="py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl surface-overlay border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)]">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{rem.title}</p>
                    <span className="text-xs text-[var(--text-muted)] font-medium">
                      Scheduled at {rem.scheduledTime}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full surface-overlay text-[var(--text-secondary)] border border-[var(--border)]">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Synced Game Sessions Log */}
        <div className="surface-raised rounded-3xl p-6 border border-[var(--border)] shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Recent Sessions</h3>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Live Synced" />
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Recorded sessions synced from the patient app
          </p>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="p-3.5 rounded-2xl surface-overlay border border-[var(--border)] flex items-center justify-between text-xs hover:border-sky-300 transition-colors"
              >
                <div>
                  <p className="font-bold text-[var(--text-primary)] capitalize">
                    {s.gameType.replace(/-/g, " ")}
                  </p>
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">
                    {new Date(s.playedAt).toLocaleDateString([], { month: "short", day: "numeric" })} &bull;{" "}
                    {new Date(s.playedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sky-600 dark:text-sky-400 block">
                    {Math.round(s.accuracy * 100)}% accuracy
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">
                    {Math.round(s.durationMs / 1000)}s &bull; {s.avgResponseMs}ms
                  </span>
                </div>
              </div>
            ))}

            {sessions.length === 0 && (
              <div className="text-xs text-[var(--text-muted)] text-center py-8 surface rounded-2xl border border-[var(--border)]">
                No sessions recorded yet. As the patient plays games on their device, their scores and response latencies will sync here in real time.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
