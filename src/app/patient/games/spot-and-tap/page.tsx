"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startSession,
  recordAttempt,
  completeSession,
} from "@/lib/gameInstrumentation";
import { saveGameSessionLocally } from "@/lib/offlineStore";
import { SupportedLanguage } from "@/lib/types";
import { getTranslation, speakPrompt } from "@/lib/i18n";

// Colors for the target and distractor items
const TARGET_COLOR = "bg-sky-500 text-white";
const DISTRACTOR_COLORS = [
  "bg-slate-300 dark:bg-slate-700 text-slate-500",
  "bg-amber-300 dark:bg-amber-800/60 text-amber-600",
  "bg-teal-300 dark:bg-teal-800/60 text-teal-600",
  "bg-indigo-300 dark:bg-indigo-800/60 text-indigo-600",
  "bg-rose-300 dark:bg-rose-800/60 text-rose-600",
];

interface ItemGrid {
  id: number;
  color: string;
  isTarget: boolean;
}

export default function SpotAndTapGamePage() {
  const router = useRouter();
  const [lang, setLang] = useState<SupportedLanguage>("as");
  const [items, setItems] = useState<ItemGrid[]>([]);
  const [round, setRound] = useState(1);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [session, setSession] = useState<ReturnType<typeof startSession> | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [targetHits, setTargetHits] = useState(0);

  const generateRound = useCallback(() => {
    const totalSlots = 9;
    const targetIndex = Math.floor(Math.random() * totalSlots);
    const newItems: ItemGrid[] = [];

    for (let i = 0; i < totalSlots; i++) {
      if (i === targetIndex) {
        newItems.push({ id: i, color: TARGET_COLOR, isTarget: true });
      } else {
        const randColor = DISTRACTOR_COLORS[Math.floor(Math.random() * DISTRACTOR_COLORS.length)];
        newItems.push({ id: i, color: randColor, isTarget: false });
      }
    }
    setItems(newItems);
    setRoundStartTime(Date.now());
  }, []);

  const finishGameRef = useRef<() => void>(() => {});

  useEffect(() => {
    const storedLang = (localStorage.getItem("smaran_lang") || "as") as SupportedLanguage;
    const patientId = localStorage.getItem("smaran_patient_id") || "local_patient";
    setLang(storedLang);

    const sess = startSession("spot-and-tap", patientId);
    setSession(sess);
    generateRound();

    speakPrompt("Tap the blue star target", storedLang).catch(() => {});
  }, [generateRound]);

  const handleItemTap = (item: ItemGrid) => {
    if (isFinished) return;
    const latency = Date.now() - roundStartTime;

    if (item.isTarget) {
      recordAttempt(session, true, latency);
      setTargetHits((h) => h + 1);
      if (round < 6) {
        setRound((r) => r + 1);
        generateRound();
      } else {
        finishGameRef.current();
      }
    } else {
      recordAttempt(session, false, latency);
    }
  };

  const handleFinishGame = useCallback(async () => {
    if (!session) return;
    const completed = completeSession(session);
    setIsFinished(true);
    await saveGameSessionLocally(completed);
    const winPrompt = getTranslation(lang, "well_done");
    speakPrompt(winPrompt, lang).catch(() => {});
  }, [session, lang]);

  useEffect(() => {
    finishGameRef.current = handleFinishGame;
  }, [handleFinishGame]);

  return (
    <div className="flex-1 flex flex-col justify-between py-2 space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between surface p-4 rounded-3xl border border-[var(--border)] shadow-card">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {getTranslation(lang, "game_spot_and_tap")}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">Find and tap the blue star</p>
        </div>
        <Link
          href="/patient/home"
          className="px-3.5 py-2 surface-overlay hover:border-sky-400 text-[var(--text-secondary)] hover:text-sky-600 text-xs font-bold rounded-2xl border border-[var(--border)] transition-colors flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          {getTranslation(lang, "back")}
        </Link>
      </div>

      {/* Target prompt */}
      <div className="text-center py-4 surface-raised border border-[var(--border)] rounded-3xl max-w-sm mx-auto w-full shadow-card">
        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-3">
          Target to Spot
        </span>
        <div className="w-16 h-16 blue-gradient rounded-2xl mx-auto flex items-center justify-center text-white shadow-glow animate-pulse-gentle">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
      </div>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-xs mx-auto w-full my-auto">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemTap(item)}
            className={`aspect-square rounded-3xl ${item.color} border-2 border-[var(--border)] hover:border-sky-400 flex items-center justify-center shadow-card active:scale-90 transition-all`}
          >
            {item.isTarget ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-white drop-shadow">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            ) : (
              <div className="w-3 h-3 rounded-full bg-current opacity-40" />
            )}
          </button>
        ))}
      </div>

      {/* Completion Modal */}
      {isFinished && (
        <div className="blue-gradient text-white p-6 sm:p-8 rounded-3xl shadow-glow text-center space-y-4 animate-scale-in">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
          </svg>
          <h3 className="text-2xl font-bold">{getTranslation(lang, "well_done")}</h3>
          <p className="text-white/90 text-sm">Great attention! You spotted {targetHits} targets with focus.</p>
          <div className="flex gap-3 justify-center pt-2">
            <button onClick={() => window.location.reload()} className="py-3 px-6 bg-white text-sky-700 font-bold rounded-2xl shadow-card hover:bg-sky-50 active:scale-95 transition-all">
              Play Again
            </button>
            <button onClick={() => router.push("/patient/home")} className="py-3 px-6 bg-sky-900/40 text-white font-bold rounded-2xl border border-white/20 hover:bg-sky-900/60 active:scale-95 transition-all">
              All Activities
            </button>
          </div>
        </div>
      )}

      {!isFinished && (
        <div className="text-center text-xs font-semibold text-[var(--text-muted)]">
          Round {round} of 6 &bull; Keep your eyes sharp
        </div>
      )}
    </div>
  );
}
