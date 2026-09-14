"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SupportedLanguage } from "@/lib/types";
import { getTranslation, speakPrompt } from "@/lib/i18n";
import { ReminderRecord } from "@/lib/serverStore";

export default function PatientRemindersPage() {
  const [lang, setLang] = useState<SupportedLanguage>("as");
  const [reminders, setReminders] = useState<ReminderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [readingAloud, setReadingAloud] = useState(false);

  const fetchReminders = useCallback(async (pid: string) => {
    try {
      const res = await fetch(`/api/reminders?patientId=${encodeURIComponent(pid)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.reminders) {
          setReminders(data.reminders);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch reminders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedLang = (localStorage.getItem("smaran_lang") || "as") as SupportedLanguage;
      const pid = localStorage.getItem("smaran_patient_id") || "pat_602188";
      setLang(storedLang);
      fetchReminders(pid);

      const prompt = getTranslation(storedLang, "reminders.title") || "Daily Routine Reminders";
      speakPrompt(prompt, storedLang).catch(() => {});
    }

    // Listen to sync updates
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel("smaran_sync");
      channel.onmessage = (e) => {
        if (e.data?.type === "REMINDER_UPDATED" || e.data?.type === "SESSION_SYNCED") {
          const pid = localStorage.getItem("smaran_patient_id") || "pat_602188";
          fetchReminders(pid);
        }
      };
      return () => channel.close();
    }
  }, [fetchReminders]);

  const handleToggle = async (reminder: ReminderRecord) => {
    const nextStatus = !reminder.completed;
    // Optimistic update
    setReminders((prev) =>
      prev.map((r) => (r.id === reminder.id ? { ...r, completed: nextStatus } : r))
    );

    // Audio feedback
    if (nextStatus) {
      const doneMsg = (getTranslation(lang, "reminders.completed") || "Completed") + "! " + (getTranslation(lang, "well_done") || "Well done!");
      speakPrompt(doneMsg, lang).catch(() => {});
    }

    try {
      await fetch("/api/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reminder.id, completed: nextStatus }),
      });

      // Broadcast to caregiver dashboard
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const channel = new BroadcastChannel("smaran_sync");
        channel.postMessage({ type: "REMINDER_UPDATED", reminderId: reminder.id, completed: nextStatus });
        setTimeout(() => channel.close(), 1000);
      }
    } catch (err) {
      console.warn("Failed to update reminder status:", err);
    }
  };

  const handleReadAllAloud = async () => {
    if (reminders.length === 0) return;
    setReadingAloud(true);
    try {
      const pending = reminders.filter((r) => !r.completed);
      if (pending.length === 0) {
        await speakPrompt(getTranslation(lang, "well_done") + "! " + (getTranslation(lang, "reminders.completed") || "All reminders are completed!"), lang);
      } else {
        for (const rem of pending) {
          const text = `${rem.scheduledTime}: ${rem.title}`;
          await speakPrompt(text, lang);
        }
      }
    } catch {
      // Audio fallback
    } finally {
      setReadingAloud(false);
    }
  };

  const handleBack = () => {
    const backMsg = getTranslation(lang, "voice.goingBack") || "Going back";
    speakPrompt(backMsg, lang).catch(() => {});
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "medicine":
        return (
          <div className="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
              <path d="m8.5 8.5 7 7"/>
            </svg>
          </div>
        );
      case "water":
        return (
          <div className="w-11 h-11 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
            </svg>
          </div>
        );
      case "walk":
        return (
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="3"/>
              <line x1="12" y1="8" x2="12" y2="14"/>
              <path d="M9 11l3 3 3-3"/>
              <path d="M9 17l3 4 3-4"/>
            </svg>
          </div>
        );
      case "food":
        return (
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
        );
    }
  };

  const completedCount = reminders.filter((r) => r.completed).length;

  return (
    <div className="flex-1 flex flex-col py-2 space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between surface p-4 sm:p-5 rounded-3xl border border-[var(--border)] shadow-card shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            {getTranslation(lang, "reminders.title") || "Daily Routine Reminders"}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {getTranslation(lang, "reminders.subtitle") || "Caregiver-scheduled care: medicines, water, walks, and meals."}
          </p>
        </div>
        <Link
          href="/patient/home"
          onClick={handleBack}
          className="px-4 py-2.5 surface-overlay hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 text-[var(--text-secondary)] hover:text-sky-600 text-xs font-bold rounded-2xl border border-[var(--border)] transition-all flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          {getTranslation(lang, "game.back") || "Back"}
        </Link>
      </div>

      {/* Progress & Read Aloud Card */}
      <div className="surface-raised p-5 rounded-3xl border border-[var(--border)] shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
            Today&apos;s Routine Progress
          </span>
          <p className="text-base font-extrabold text-[var(--text-primary)]">
            {completedCount} of {reminders.length} completed
          </p>
          <div className="w-48 sm:w-64 h-2 bg-sky-100 dark:bg-sky-950 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full blue-gradient transition-all duration-500 rounded-full"
              style={{ width: `${reminders.length > 0 ? (completedCount / reminders.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleReadAllAloud}
          disabled={readingAloud || reminders.length === 0}
          className="py-3 px-5 blue-gradient hover:shadow-glow text-white font-bold text-xs rounded-2xl shadow-card transition-all active:scale-95 flex items-center gap-2 shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
          <span>{readingAloud ? "Reading Schedule..." : (getTranslation(lang, "reminders.readAloud") || "Read All Reminders")}</span>
        </button>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-[var(--text-muted)] text-sm">
            {getTranslation(lang, "status.loading") || "Loading reminders..."}
          </div>
        ) : reminders.length === 0 ? (
          <div className="surface p-10 text-center rounded-3xl border border-[var(--border)] text-[var(--text-muted)] text-sm">
            {getTranslation(lang, "reminders.noReminders") || "No reminders scheduled for today yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {reminders.map((rem) => (
              <div
                key={rem.id}
                className={`p-4 sm:p-5 rounded-3xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-card ${
                  rem.completed
                    ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30 opacity-80"
                    : "surface-raised border-[var(--border)] hover:border-sky-400"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {getCategoryIcon(rem.category)}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                        {rem.scheduledTime}
                      </span>
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">
                        {rem.category}
                      </span>
                    </div>
                    <h3 className={`text-base sm:text-lg font-bold text-[var(--text-primary)] truncate ${rem.completed ? "line-through text-[var(--text-muted)]" : ""}`}>
                      {rem.title}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(rem)}
                  className={`py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0 ${
                    rem.completed
                      ? "bg-emerald-500 text-white shadow-card hover:bg-emerald-600"
                      : "surface-overlay border-2 border-sky-400/60 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-sky-600 dark:text-sky-400"
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>
                    {rem.completed
                      ? (getTranslation(lang, "reminders.completed") || "Completed ✓")
                      : (getTranslation(lang, "reminders.markDone") || "Mark as Done")}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
