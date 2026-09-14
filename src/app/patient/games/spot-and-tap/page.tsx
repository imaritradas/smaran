"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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

interface ItemGrid {
  id: number;
  isTarget: boolean;
  color: string;
}

const DISTRACTOR_COLORS = [
  "bg-amber-400",
  "bg-rose-400",
  "bg-teal-400",
  "bg-indigo-400",
  "bg-purple-400",
];

export default function SpotAndTapGamePage() {
  const router = useRouter();
  const [lang, setLang] = useState<SupportedLanguage>("as");
  const [items, setItems] = useState<ItemGrid[]>([]);
  const [targetHits, setTargetHits] = useState(0);
  const [round, setRound] = useState(1);
  const [session, setSession] = useState<ReturnType<typeof startSession> | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const finishGameRef = useRef<() => void>(() => {});

  const generateRound = useCallback(() => {
    const targetPos = Math.floor(Math.random() * 9);
    const newItems: ItemGrid[] = [];
    for (let i = 0; i < 9; i++) {
      if (i === targetPos) {
        newItems.push({ id: i, isTarget: true, color: "blue-gradient" });
      } else {
        const c = DISTRACTOR_COLORS[Math.floor(Math.random() * DISTRACTOR_COLORS.length)];
        newItems.push({ id: i, isTarget: false, color: c });
      }
    }
    setItems(newItems);
    setRoundStartTime(Date.now());
  }, []);

  useEffect(() => {
    const storedLang = (localStorage.getItem("smaran_lang") || "as") as SupportedLanguage;
    const patientId = localStorage.getItem("smaran_patient_id") || "pat_602188";
    setLang(storedLang);
    const sess = startSession("spot-and-tap", patientId);
    setSession(sess);
    generateRound();

    const title = getTranslation(storedLang, "game_spot_and_tap");
    speakPrompt(`${getTranslation(storedLang, "voice.letsPlay")}: ${title}`, storedLang).catch(() => {});
  }, [generateRound]);

  const handleItemTap = (item: ItemGrid) => {
    if (isFinished) return;
    const latency = Date.now() - roundStartTime;

    if (item.isTarget) {
      recordAttempt(session, true, latency);
      setTargetHits((h) => h + 1);

      const foundVoice = getTranslation(lang, "voice.foundIt") || "Found it!";
      speakPrompt(foundVoice, lang).catch(() => {});

      if (round < 6) {
        setRound((r) => r + 1);
        generateRound();
      } else {
        finishGameRef.current();
      }
    } else {
      recordAttempt(session, false, latency);
      const tryAgainVoice = getTranslation(lang, "voice.tryAgain") || "Try again!";
      speakPrompt(tryAgainVoice, lang).catch(() => {});
    }
  };

  const handleFinishGame = useCallback(async () => {
    if (!session) return;
    const completed = completeSession(session);
    setIsFinished(true);
    await saveGameSessionLocally(completed);
    const winPrompt = getTranslation(lang, "well_done") + "! " + (getTranslation(lang, "game.spot.complete") || "Great attention! You spotted the targets.");
    speakPrompt(winPrompt, lang).catch(() => {});
  }, [session, lang]);

  useEffect(() => {
    finishGameRef.current = handleFinishGame;
  }, [handleFinishGame]);

  const handleBack = () => {
    const backMsg = getTranslation(lang, "voice.goingBack") || "Going back";
    speakPrompt(backMsg, lang).catch(() => {});
  };

  return (
    <div className="min-h-[82vh] flex flex-col justify-between py-2 space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between surface p-4 sm:p-5 rounded-3xl border border-[var(--border)] shadow-card shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            {getTranslation(lang, "game_spot_and_tap")}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {getTranslation(lang, "spot_and_tap_desc")}
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

      {/* Target prompt */}
      <div className="text-center py-4 surface-raised border border-[var(--border)] rounded-3xl max-w-sm mx-auto w-full shadow-card shrink-0">
        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-2">
          {getTranslation(lang, "game.spot.target") || "Target to Spot"}
        </span>
        <div className="w-16 h-16 blue-gradient rounded-2xl mx-auto flex items-center justify-center text-white shadow-glow animate-pulse-gentle">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
      </div>

      {/* Centered 3x3 Grid */}
      {!isFinished && (
        <div className="flex-1 flex flex-col items-center justify-center my-auto w-full py-2">
          <div className="grid grid-cols-3 gap-3.5 sm:gap-4 max-w-xs mx-auto w-full">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemTap(item)}
                className={`aspect-square rounded-3xl ${item.color} border-2 border-[var(--border)] hover:border-sky-400 flex items-center justify-center shadow-card active:scale-90 transition-all`}
              >
                {item.isTarget ? (
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-white drop-shadow animate-scale-in">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full bg-current opacity-30" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {isFinished && (
        <div className="flex-1 flex flex-col items-center justify-center my-auto">
          <div className="max-w-md w-full blue-gradient text-white p-6 sm:p-8 rounded-3xl shadow-glow text-center space-y-4 animate-scale-in">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
            </svg>
            <h3 className="text-2xl font-black">{getTranslation(lang, "well_done")}</h3>
            <p className="text-white/95 text-sm font-medium">
              {getTranslation(lang, "game.spot.complete") || "Great attention! You spotted the targets with focus."} ({targetHits} hits)
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => window.location.reload()}
                className="py-3 px-6 bg-white text-sky-700 font-bold rounded-2xl shadow-card hover:bg-sky-50 active:scale-95 transition-all"
              >
                {getTranslation(lang, "game.seeAgain") || "Play Again"}
              </button>
              <button
                onClick={() => {
                  handleBack();
                  router.push("/patient/home");
                }}
                className="py-3 px-6 bg-sky-900/40 text-white font-bold rounded-2xl border border-white/20 hover:bg-sky-900/60 active:scale-95 transition-all"
              >
                {getTranslation(lang, "game.allActivities") || "All Activities"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!isFinished && (
        <div className="text-center text-xs font-bold text-[var(--text-muted)] shrink-0 py-1">
          {getTranslation(lang, "game.spot.round") || "Round"} {round} / 6 &bull; {getTranslation(lang, "game.takeYourTime") || "Keep your eyes sharp"}
        </div>
      )}
    </div>
  );
}
