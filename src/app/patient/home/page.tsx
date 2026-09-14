"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import GameTile from "@/components/GameTile";
import { SupportedLanguage, GameType } from "@/lib/types";
import { getTranslation, speakPrompt } from "@/lib/i18n";
import { ReminderRecord, NotificationRecord } from "@/lib/serverStore";

export default function PatientHomePage() {
  const [lang, setLang] = useState<SupportedLanguage>("as");
  const [patientName, setPatientName] = useState<string>("");
  const [patientCode, setPatientCode] = useState<string>("");
  const [patientPhoto, setPatientPhoto] = useState<string | null>(null);
  const [nextReminder, setNextReminder] = useState<ReminderRecord | null>(null);
  const [latestAlert, setLatestAlert] = useState<NotificationRecord | null>(null);

  const fetchRemindersAndAlerts = useCallback(async (pid: string) => {
    try {
      // 1. Reminders
      const remRes = await fetch(`/api/reminders?patientId=${encodeURIComponent(pid)}`);
      if (remRes.ok) {
        const remData = await remRes.json();
        if (remData.reminders) {
          const pending = remData.reminders.find((r: ReminderRecord) => !r.completed);
          setNextReminder(pending || null);
        }
      }

      // 2. Notifications & Alerts
      const notifRes = await fetch(`/api/notifications?patientId=${encodeURIComponent(pid)}`);
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        if (notifData.notifications) {
          const unreadAlert = notifData.notifications.find(
            (n: NotificationRecord) => !n.read && (n.priority === "high" || n.type === "alert")
          );
          setLatestAlert(unreadAlert || notifData.notifications[0] || null);
        }
      }
    } catch {
      // silent
    }
  }, []);

  const refreshUserData = useCallback(() => {
    if (typeof window !== "undefined") {
      const storedLang = (localStorage.getItem("smaran_lang") || "as") as SupportedLanguage;
      const storedName = localStorage.getItem("smaran_patient_name") || "Mohit";
      const storedCode = localStorage.getItem("smaran_patient_code") || localStorage.getItem("smaran_patient_id") || "pat_602188";
      const storedPhoto = localStorage.getItem("smaran_patient_photo") || null;
      setLang(storedLang);
      setPatientName(storedName);
      setPatientCode(storedCode);
      setPatientPhoto(storedPhoto);

      const pid = localStorage.getItem("smaran_patient_id") || "pat_602188";
      fetchRemindersAndAlerts(pid);

      const welcomeText = `${getTranslation(storedLang, "welcome")}, ${storedName}`;
      speakPrompt(welcomeText, storedLang).catch(() => {});
    }
  }, [fetchRemindersAndAlerts]);

  useEffect(() => {
    refreshUserData();

    const handleStorage = () => refreshUserData();
    window.addEventListener("storage", handleStorage);

    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      channel = new BroadcastChannel("smaran_sync");
      channel.onmessage = () => refreshUserData();
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (channel) channel.close();
    };
  }, [refreshUserData]);

  const handleCompleteReminderQuick = async (reminder: ReminderRecord) => {
    setNextReminder(null);
    speakPrompt(getTranslation(lang, "reminders.completed") || "Completed!", lang).catch(() => {});
    try {
      await fetch("/api/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reminder.id, completed: true }),
      });

      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const channel = new BroadcastChannel("smaran_sync");
        channel.postMessage({ type: "REMINDER_UPDATED", reminderId: reminder.id, completed: true });
        setTimeout(() => channel.close(), 1000);
      }
    } catch (err) {
      console.warn("Failed to complete reminder:", err);
    }
  };

  const initial = patientName ? patientName.trim().charAt(0).toUpperCase() : "S";

  const games = [
    {
      id: "memory-match",
      title: getTranslation(lang, "game_memory_match"),
      subtitle: getTranslation(lang, "memory_match_desc"),
      href: "/patient/games/memory-match",
    },
    {
      id: "spot-and-tap",
      title: getTranslation(lang, "game_spot_and_tap"),
      subtitle: getTranslation(lang, "spot_and_tap_desc"),
      href: "/patient/games/spot-and-tap",
    },
    {
      id: "sequence-recall",
      title: getTranslation(lang, "game_sequence_recall"),
      subtitle: getTranslation(lang, "sequence_recall_desc"),
      href: "/patient/games/sequence-recall",
    },
    {
      id: "routine-recall",
      title: getTranslation(lang, "game_routine_recall"),
      subtitle: getTranslation(lang, "routine_recall_desc"),
      href: "/patient/games/routine-recall",
    },
    {
      id: "family-faces",
      title: getTranslation(lang, "game_family_faces"),
      subtitle: getTranslation(lang, "family_faces_desc"),
      href: "/patient/games/family-faces",
    },
  ];

  return (
    <div className="flex-1 flex flex-col py-2 space-y-6 animate-fade-in">
      {/* Welcome Banner Card with Patient Unique Code */}
      <div className="surface-raised p-5 sm:p-6 rounded-3xl border border-[var(--border)] shadow-card flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/patient/home"
            title="Smaran Home"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden blue-gradient flex items-center justify-center text-white font-bold text-xl shadow-glow shrink-0 border-2 border-white dark:border-sky-800 hover:scale-105 transition-transform"
          >
            {patientPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={patientPhoto} alt={patientName} className="w-full h-full object-cover" />
            ) : (
              <span>{initial}</span>
            )}
          </Link>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-muted)] block">
              {getTranslation(lang, "welcome")}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] leading-tight">
              {patientName}
            </h2>
            {patientCode && (
              <p className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 mt-0.5 tracking-wider">
                ID: {patientCode}
              </p>
            )}
          </div>
        </div>

        <Link
          href="/patient/language"
          onClick={() => {
            const prompt = getTranslation(lang, "home.changeLanguage");
            speakPrompt(prompt, lang).catch(() => {});
          }}
          className="px-3.5 py-2 surface-overlay hover:border-sky-400 text-[var(--text-secondary)] hover:text-sky-600 text-xs font-bold rounded-2xl flex items-center gap-2 transition-all border border-[var(--border)] shadow-sm shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span className="hidden sm:inline">{getTranslation(lang, "home.changeLanguage")}</span>
          <span className="sm:hidden">{getTranslation(lang, "nav.language")}</span>
        </Link>
      </div>

      {/* Urgent Alert Banner (if any unread alert from caregiver) */}
      {latestAlert && (
        <div className="surface-raised p-4 sm:p-5 rounded-3xl border-2 border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/20 shadow-card flex items-center justify-between gap-3 animate-scale-in">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                {latestAlert.title}
              </span>
              <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                {latestAlert.message}
              </p>
            </div>
          </div>
          <Link
            href="/patient/notifications"
            className="py-2 px-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all shrink-0"
          >
            View Alerts
          </Link>
        </div>
      )}

      {/* Next Daily Routine Reminder Card */}
      {nextReminder && (
        <div className="surface-raised p-4 sm:p-5 rounded-3xl border-2 border-sky-400/40 shadow-card flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400">
                  {nextReminder.scheduledTime}
                </span>
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">
                  Upcoming Reminder
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate">
                {nextReminder.title}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleCompleteReminderQuick(nextReminder)}
              className="py-2.5 px-4 blue-gradient hover:shadow-glow text-white font-bold text-xs rounded-xl shadow-card active:scale-95 transition-all flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span>{getTranslation(lang, "reminders.markDone") || "Done"}</span>
            </button>
            <Link
              href="/patient/reminders"
              className="py-2.5 px-3 surface-overlay hover:border-sky-400 text-[var(--text-secondary)] font-bold text-xs rounded-xl border border-[var(--border)]"
            >
              All
            </Link>
          </div>
        </div>
      )}

      {/* Activities Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-bold text-[var(--text-secondary)]">
            {getTranslation(lang, "home.selectActivity")}
          </p>
          <span className="text-xs text-[var(--text-muted)] font-semibold">
            {getTranslation(lang, "home.activitiesAvailable")}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {games.map((g, i) => (
            <div key={g.id} className={`animate-fade-in-up stagger-${i + 1}`} style={{ animationFillMode: "both" }}>
              <GameTile
                gameType={g.id as GameType}
                label={g.title}
                href={g.href}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Encouragement Card */}
      <div className="surface-overlay p-4 sm:p-5 rounded-3xl border border-[var(--border)] text-center">
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
          {getTranslation(lang, "home.encouragement")}
        </p>
      </div>
    </div>
  );
}
