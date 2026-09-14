"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SupportedLanguage } from "@/lib/types";
import { getTranslation, speakPrompt } from "@/lib/i18n";
import { NotificationRecord } from "@/lib/serverStore";

export default function PatientNotificationsPage() {
  const [lang, setLang] = useState<SupportedLanguage>("as");
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (pid: string) => {
    try {
      const res = await fetch(`/api/notifications?patientId=${encodeURIComponent(pid)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.notifications) {
          setNotifications(data.notifications);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedLang = (localStorage.getItem("smaran_lang") || "as") as SupportedLanguage;
      const pid = localStorage.getItem("smaran_patient_id") || "pat_602188";
      setLang(storedLang);
      fetchNotifications(pid);

      const prompt = getTranslation(storedLang, "notifications.title") || "Notifications & Alerts";
      speakPrompt(prompt, storedLang).catch(() => {});
    }

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel("smaran_sync");
      channel.onmessage = (e) => {
        if (e.data?.type === "NOTIFICATION_CREATED" || e.data?.type === "REMINDER_UPDATED") {
          const pid = localStorage.getItem("smaran_patient_id") || "pat_602188";
          fetchNotifications(pid);
        }
      };
      return () => channel.close();
    }
  }, [fetchNotifications]);

  const handleReadAloud = async (notif: NotificationRecord) => {
    setActiveSpeechId(notif.id);
    try {
      const textToSpeak = `${notif.title}. ${notif.message}`;
      await speakPrompt(textToSpeak, lang);
    } finally {
      setActiveSpeechId(null);
    }
  };

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.warn("Failed to mark notification read:", err);
    }
  };

  const handleDelete = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("Failed to delete notification:", err);
    }
  };

  const handleBack = () => {
    const backMsg = getTranslation(lang, "voice.goingBack") || "Going back";
    speakPrompt(backMsg, lang).catch(() => {});
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex-1 flex flex-col py-2 space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between surface p-4 sm:p-5 rounded-3xl border border-[var(--border)] shadow-card shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              {getTranslation(lang, "notifications.title") || "Notifications & Alerts"}
            </h2>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {getTranslation(lang, "notifications.subtitle") || "Important caregiver messages, routine reminders, and wellness updates."}
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

      {/* Notifications List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="p-12 text-center text-[var(--text-muted)] text-sm">
            {getTranslation(lang, "status.loading") || "Loading notifications..."}
          </div>
        ) : notifications.length === 0 ? (
          <div className="surface p-12 text-center rounded-3xl border border-[var(--border)] space-y-3 text-[var(--text-muted)]">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto opacity-50 text-sky-500">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <p className="text-sm font-semibold">
              {getTranslation(lang, "notifications.noNotifications") || "No new notifications right now. Everything is peaceful!"}
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const isHighPriority = notif.priority === "high" || notif.type === "alert";
            return (
              <div
                key={notif.id}
                className={`p-5 rounded-3xl border-2 transition-all space-y-3 shadow-card ${
                  !notif.read
                    ? isHighPriority
                      ? "bg-rose-50/50 dark:bg-rose-950/25 border-rose-400/50"
                      : "surface-raised border-sky-400/50"
                    : "surface border-[var(--border)] opacity-75"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isHighPriority
                          ? "bg-rose-500 text-white shadow-sm"
                          : "bg-sky-500 text-white shadow-sm"
                      }`}
                    >
                      {isHighPriority ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                      )}
                    </span>
                    <div>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        isHighPriority
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                          : "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30"
                      }`}>
                        {notif.type}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mt-1">
                        {notif.title}
                      </h3>
                    </div>
                  </div>

                  <span className="text-[11px] text-[var(--text-muted)] font-semibold shrink-0">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed pl-11">
                  {notif.message}
                </p>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => handleReadAloud(notif)}
                    className="py-2 px-3.5 surface-overlay hover:border-sky-400 text-sky-600 dark:text-sky-400 font-bold text-xs rounded-xl border border-[var(--border)] flex items-center gap-1.5 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    </svg>
                    <span>{activeSpeechId === notif.id ? "Reading..." : (getTranslation(lang, "notifications.readAloud") || "Read Out Loud")}</span>
                  </button>

                  {!notif.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(notif.id)}
                      className="py-2 px-3 surface-overlay hover:border-sky-400 text-[var(--text-secondary)] font-bold text-xs rounded-xl border border-[var(--border)] transition-colors"
                    >
                      {getTranslation(lang, "notifications.markRead") || "Mark as Read"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(notif.id)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                    title="Dismiss"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
