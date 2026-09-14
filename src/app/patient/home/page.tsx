"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import GameTile from "@/components/GameTile";
import { SupportedLanguage, GameType } from "@/lib/types";
import { getTranslation, speakPrompt } from "@/lib/i18n";

export default function PatientHomePage() {
  const [lang, setLang] = useState<SupportedLanguage>("as");
  const [patientName, setPatientName] = useState<string>("");
  const [patientPhoto, setPatientPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedLang = (localStorage.getItem("smaran_lang") || "as") as SupportedLanguage;
      const storedName = localStorage.getItem("smaran_patient_name") || "Friend";
      const storedPhoto = localStorage.getItem("smaran_patient_photo") || null;
      setLang(storedLang);
      setPatientName(storedName);
      setPatientPhoto(storedPhoto);

      const welcomeText = `${getTranslation(storedLang, "welcome")}, ${storedName}`;
      speakPrompt(welcomeText, storedLang).catch(() => {});
    }
  }, []);

  const initial = patientName ? patientName.trim().charAt(0).toUpperCase() : "S";

  const games = [
    {
      id: "memory-match",
      title: getTranslation(lang, "game_memory_match"),
      subtitle: "Find matching pairs of traditional symbols",
      href: "/patient/games/memory-match",
    },
    {
      id: "spot-and-tap",
      title: getTranslation(lang, "game_spot_and_tap"),
      subtitle: "Focus your attention and tap the target",
      href: "/patient/games/spot-and-tap",
    },
    {
      id: "sequence-recall",
      title: getTranslation(lang, "game_sequence_recall"),
      subtitle: "Remember and repeat the glowing melody pattern",
      href: "/patient/games/sequence-recall",
    },
    {
      id: "routine-recall",
      title: getTranslation(lang, "game_routine_recall"),
      subtitle: "Put daily activities in their natural order",
      href: "/patient/games/routine-recall",
    },
    {
      id: "family-faces",
      title: getTranslation(lang, "game_family_faces"),
      subtitle: "Comfort and recognition of your dear ones",
      href: "/patient/games/family-faces",
    },
  ];

  return (
    <div className="flex-1 flex flex-col py-2 space-y-6 animate-fade-in">
      {/* Welcome Banner Card */}
      <div className="surface-raised p-5 sm:p-6 rounded-3xl border border-[var(--border)] shadow-card flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/patient/home"
            title="Go to Home"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden blue-gradient flex items-center justify-center text-white font-bold text-xl shadow-glow shrink-0 border-2 border-white dark:border-sky-800 hover:scale-105 transition-transform"
          >
            {patientPhoto ? (
              <img src={patientPhoto} alt={patientName} className="w-full h-full object-cover" />
            ) : (
              <span>{initial}</span>
            )}
          </Link>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--text-muted)] block">
              {getTranslation(lang, "welcome")}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              {patientName}
            </h2>
          </div>
        </div>

        <Link
          href="/patient/language"
          className="px-3.5 py-2 surface-overlay hover:border-sky-400 text-[var(--text-secondary)] hover:text-[var(--accent)] text-xs font-bold rounded-2xl flex items-center gap-2 transition-all border border-[var(--border)] shadow-sm shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span className="hidden sm:inline">Change Language</span>
          <span className="sm:hidden">Language</span>
        </Link>
      </div>

      {/* Activities Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-bold text-[var(--text-secondary)]">
            Select an activity to begin
          </p>
          <span className="text-xs text-[var(--text-muted)] font-medium">5 Activities Available</span>
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
          Play anytime at your own comfortable pace. There are no wrong answers — every moment of engagement strengthens and exercises your mind.
        </p>
      </div>
    </div>
  );
}
