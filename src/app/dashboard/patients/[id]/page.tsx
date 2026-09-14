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

interface ReminderItem {
  id: string;
  patientId: string;
  title: string;
  scheduledTime: string;
  category: "medicine" | "water" | "walk" | "food" | "general";
  completed: boolean;
  createdAt: number;
}

const PRESET_REMINDERS = [
  { label: "💊 Take Medicine", title: "Take morning prescription pills", time: "08:30", category: "medicine" as const },
  { label: "💧 Drink Water / Hydrate", title: "Drink a tall glass of fresh water & hydrate", time: "11:00", category: "water" as const },
  { label: "🚶 Morning Walk", title: "Morning gentle fresh air walk", time: "07:30", category: "walk" as const },
  { label: "🍳 Breakfast", title: "Nutritious warm breakfast", time: "09:00", category: "food" as const },
  { label: "🍱 Lunch", title: "Nutritious afternoon lunch", time: "13:00", category: "food" as const },
  { label: "🌅 Evening Walk", title: "Evening garden stroll", time: "17:30", category: "walk" as const },
  { label: "🫖 Evening Tea", title: "Warm herbal tea & relaxation", time: "16:30", category: "water" as const },
];

const PRESET_ALERTS = [
  "💧 High Heat Advisory: Please hydrate and drink a glass of water now.",
  "💊 Essential Reminder: Please remember to take your afternoon prescription.",
  "🚶 Active Mind: It's a pleasant day for a gentle 15-minute walk outside.",
  "🩺 Doctor Appointment: Check-in scheduled for 4:00 PM today.",
  "🏠 Family Visit: Your family is visiting this evening at 5:00 PM!",
];

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

  // Reminders state connected to /api/reminders
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderTime, setReminderTime] = useState("09:00");
  const [reminderCategory, setReminderCategory] = useState<"medicine" | "water" | "walk" | "food" | "general">("medicine");
  const [savingReminder, setSavingReminder] = useState(false);

  // Important alerts dispatcher state
  const [alertMessage, setAlertMessage] = useState("");
  const [alertPriority, setAlertPriority] = useState<"high" | "normal">("high");
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertSentToast, setAlertSentToast] = useState(false);

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
      const pRes = await fetch(`/api/patients?patientId=${encodeURIComponent(patientId)}`);
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData.patient) {
          setPatient(pData.patient);
        }
      }

      // 3. Fetch synced reminders
      const remRes = await fetch(`/api/reminders?patientId=${encodeURIComponent(patientId)}`);
      if (remRes.ok) {
        const remData = await remRes.json();
        if (remData.reminders) {
          setReminders(remData.reminders);
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

    // Auto-poll every 3.5 seconds so patient gameplay & reminders sync in real time
    const pollInterval = setInterval(() => {
      loadData(false);
    }, 3500);

    // Listen for live sync broadcasts from the patient app
    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      channel = new BroadcastChannel("smaran_sync");
      channel.onmessage = (event) => {
        if (
          event.data?.type === "SESSION_SYNCED" ||
          event.data?.type === "REMINDERS_UPDATED" ||
          event.data?.type === "REMINDER_UPDATED" ||
          event.data?.type === "NOTIFICATIONS_UPDATED" ||
          event.data?.type === "PATIENT_PAIRED"
        ) {
          loadData(false);
        }
      };
    }

    return () => {
      clearInterval(pollInterval);
      if (channel) channel.close();
    };
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

  // Add Reminder
  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim()) return;

    setSavingReminder(true);
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          title: reminderTitle.trim(),
          scheduledTime: reminderTime,
          category: reminderCategory,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reminder) {
          setReminders((prev) => [data.reminder, ...prev]);
        }
        setReminderTitle("");

        // Broadcast to patient app
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const channel = new BroadcastChannel("smaran_sync");
          channel.postMessage({ type: "REMINDERS_UPDATED", patientId });
          setTimeout(() => channel.close(), 1000);
        }
      }
    } catch (err) {
      console.error("Failed to save reminder:", err);
    } finally {
      setSavingReminder(false);
    }
  };

  // Toggle Reminder Status
  const handleToggleReminder = async (rem: ReminderItem) => {
    const nextStatus = !rem.completed;
    setReminders((prev) =>
      prev.map((r) => (r.id === rem.id ? { ...r, completed: nextStatus } : r))
    );

    try {
      await fetch("/api/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rem.id, completed: nextStatus }),
      });

      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const channel = new BroadcastChannel("smaran_sync");
        channel.postMessage({ type: "REMINDER_UPDATED", reminderId: rem.id, completed: nextStatus });
        setTimeout(() => channel.close(), 1000);
      }
    } catch (err) {
      console.error("Failed to toggle reminder:", err);
    }
  };

  // Delete Reminder
  const handleDeleteReminder = async (remId: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== remId));
    try {
      await fetch(`/api/reminders?id=${encodeURIComponent(remId)}`, {
        method: "DELETE",
      });
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const channel = new BroadcastChannel("smaran_sync");
        channel.postMessage({ type: "REMINDERS_UPDATED", patientId });
        setTimeout(() => channel.close(), 1000);
      }
    } catch (err) {
      console.error("Failed to delete reminder:", err);
    }
  };

  // Send Important Alert to Patient Notifications
  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertMessage.trim()) return;

    setSendingAlert(true);
    try {
      const title = alertPriority === "high" ? "🚨 Important Caregiver Alert" : "Caregiver Message";
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          title,
          message: alertMessage.trim(),
          type: "alert",
          priority: alertPriority,
        }),
      });

      if (res.ok) {
        setAlertMessage("");
        setAlertSentToast(true);
        setTimeout(() => setAlertSentToast(false), 3500);

        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const channel = new BroadcastChannel("smaran_sync");
          channel.postMessage({ type: "NOTIFICATION_CREATED", patientId });
          setTimeout(() => channel.close(), 1000);
        }
      }
    } catch (err) {
      console.error("Failed to send alert to patient:", err);
    } finally {
      setSendingAlert(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "medicine":
        return "💊";
      case "water":
        return "💧";
      case "walk":
        return "🚶";
      case "food":
        return "🍲";
      default:
        return "⏰";
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-[var(--text-secondary)] font-bold">
        <div className="w-9 h-9 border-3 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-base text-[var(--text-primary)] font-bold">Analyzing cognitive session trends & syncing...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
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
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-1.5">
            {patient ? patient.name : `Patient ${patientId}`}
          </h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[var(--text-secondary)] mt-1.5">
            <span>ID: <code className="font-mono font-bold text-[var(--text-primary)]">{patientId}</code></span>
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
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              Cognitive Domain Trends (14-Day Rolling Window)
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-medium">
              Live score evaluation updated automatically when games are completed.
            </p>
          </div>
          <span className="text-xs text-sky-600 dark:text-sky-400 font-bold bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
            {sessions.length} Recorded Session{sessions.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trends.map((metric) => (
            <TrendCard key={metric.label} metric={metric} />
          ))}
        </div>
      </div>

      {/* Reminders & Send Important Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Routine Reminders Creator & Synced List */}
        <div className="lg:col-span-2 surface-raised rounded-3xl p-6 border border-[var(--border)] shadow-card space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <span>Daily Routine Reminders</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Syncs to Patient App
                </span>
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Set medicine, water hydration, walking, and meal routines. Patient hears and sees these gently.
              </p>
            </div>
            <span className="text-xs font-bold text-[var(--text-muted)]">
              {reminders.length} Active
            </span>
          </div>

          {/* Quick Preset Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Quick Preset Routines:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_REMINDERS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setReminderTitle(preset.title);
                    setReminderTime(preset.time);
                    setReminderCategory(preset.category);
                  }}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold surface-overlay hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-[var(--text-secondary)] hover:text-sky-600 dark:hover:text-sky-400 border border-[var(--border)] transition-all active:scale-95"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reminder Form */}
          <form onSubmit={handleAddReminder} className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <input
              type="text"
              required
              placeholder="e.g. Morning Blood Pressure Tablet or Hydrate"
              value={reminderTitle}
              onChange={(e) => setReminderTitle(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-2xl surface-overlay border border-[var(--border)] text-sm focus:border-sky-400 focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)]"
            />
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full sm:w-28 px-3 py-2.5 rounded-2xl surface-overlay border border-[var(--border)] text-sm focus:border-sky-400 focus:outline-none text-[var(--text-primary)]"
            />
            <select
              value={reminderCategory}
              onChange={(e) => setReminderCategory(e.target.value as "medicine" | "water" | "walk" | "food" | "general")}
              className="w-full sm:w-32 px-3 py-2.5 rounded-2xl surface-overlay border border-[var(--border)] text-xs font-bold focus:border-sky-400 focus:outline-none text-[var(--text-primary)]"
            >
              <option value="medicine">💊 Medicine</option>
              <option value="water">💧 Water</option>
              <option value="walk">🚶 Walk</option>
              <option value="food">🍲 Meal</option>
              <option value="general">⏰ Routine</option>
            </select>
            <button
              type="submit"
              disabled={savingReminder}
              className="py-2.5 px-4 blue-gradient hover:shadow-glow text-white font-bold text-xs rounded-2xl shadow-card active:scale-95 transition-all disabled:opacity-50 shrink-0"
            >
              {savingReminder ? "Saving..." : "+ Add"}
            </button>
          </form>

          {/* Reminders List */}
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {reminders.length === 0 ? (
              <div className="text-center py-8 text-xs text-[var(--text-muted)] surface rounded-2xl border border-[var(--border)]">
                No reminders configured. Use the presets above to add daily medicine or water reminders.
              </div>
            ) : (
              reminders.map((rem) => (
                <div
                  key={rem.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    rem.completed
                      ? "surface opacity-60 border-[var(--border)]"
                      : "surface-overlay border-[var(--border)] hover:border-sky-400"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl shrink-0">
                      {getCategoryIcon(rem.category)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-sky-600 dark:text-sky-400">
                          {rem.scheduledTime}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                          {rem.category}
                        </span>
                      </div>
                      <p className={`text-sm font-bold text-[var(--text-primary)] truncate ${rem.completed ? "line-through text-[var(--text-muted)]" : ""}`}>
                        {rem.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleReminder(rem)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all active:scale-95 ${
                        rem.completed
                          ? "bg-emerald-500 text-white border-emerald-600"
                          : "surface hover:bg-sky-50 dark:hover:bg-sky-950/40 text-[var(--text-secondary)] border-[var(--border)]"
                      }`}
                    >
                      {rem.completed ? "Completed ✓" : "Pending"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteReminder(rem.id)}
                      className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                      title="Delete Reminder"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Synced Game Sessions Log */}
        <div className="surface-raised rounded-3xl p-6 border border-[var(--border)] shadow-card space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Recent Sessions</h3>
              <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Sync</span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Sessions recorded directly from patient gameplay
            </p>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="p-3.5 rounded-2xl surface-overlay border border-[var(--border)] flex items-center justify-between text-xs hover:border-sky-300 transition-colors"
              >
                <div>
                  <p className="font-bold text-[var(--text-primary)] capitalize text-sm">
                    {s.gameType.replace(/-/g, " ")}
                  </p>
                  <span className="text-[11px] text-[var(--text-muted)] font-medium">
                    {new Date(s.playedAt).toLocaleDateString([], { month: "short", day: "numeric" })} &bull;{" "}
                    {new Date(s.playedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-sky-600 dark:text-sky-400 text-sm block">
                    {Math.round(s.accuracy * 100)}% accuracy
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold">
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

          <div className="pt-2 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)] text-center">
            Automatic background polling active (every 3.5s)
          </div>
        </div>
      </div>

      {/* Send Important Alert to Patient App Notifications */}
      <div className="surface-raised rounded-3xl p-6 border border-[var(--border)] shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span>🚨 Send Important Alert to Patient App</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                Instant Notification
              </span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Alerts appear prominently in the patient&apos;s Notifications section with large badges and speech read-out.
            </p>
          </div>

          {alertSentToast && (
            <div className="px-3.5 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm animate-fade-in">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Alert dispatched to Patient App!</span>
            </div>
          )}
        </div>

        {/* Quick Alert Presets */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Quick Alert Templates:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_ALERTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAlertMessage(preset)}
                className="px-2.5 py-1 rounded-xl text-xs font-semibold surface-overlay hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[var(--text-secondary)] hover:text-rose-600 dark:hover:text-rose-400 border border-[var(--border)] transition-all active:scale-95 truncate max-w-xs"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Dispatch Form */}
        <form onSubmit={handleSendAlert} className="flex flex-col sm:flex-row gap-3 pt-1">
          <input
            type="text"
            required
            placeholder="Type important message for the patient (e.g., Hydrate yourself or doctor visit today)..."
            value={alertMessage}
            onChange={(e) => setAlertMessage(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-2xl surface-overlay border border-[var(--border)] text-sm focus:border-rose-400 focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)]"
          />

          <div className="flex items-center gap-2">
            <select
              value={alertPriority}
              onChange={(e) => setAlertPriority(e.target.value as "high" | "normal")}
              className="px-3 py-2.5 rounded-2xl surface-overlay border border-[var(--border)] text-xs font-bold focus:border-rose-400 focus:outline-none text-[var(--text-primary)]"
            >
              <option value="high">🚨 High Priority</option>
              <option value="normal">ℹ️ Normal Alert</option>
            </select>

            <button
              type="submit"
              disabled={sendingAlert}
              className="py-2.5 px-5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs rounded-2xl shadow-card active:scale-95 transition-all disabled:opacity-50 shrink-0"
            >
              {sendingAlert ? "Dispatching..." : "Send Alert to Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

