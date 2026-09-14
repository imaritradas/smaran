"use client";

import React, { useState, useEffect } from "react";
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

type SymbolName = "rhino" | "teaLeaf" | "gamusa" | "jaapi";

interface CardState {
  id: number;
  symbol: SymbolName;
  matched: boolean;
}

const SYMBOLS: Record<SymbolName, string> = {
  rhino: "🦏",
  teaLeaf: "🍃",
  gamusa: "🧣",
  jaapi: "👒",
};

const SYMBOL_COLORS: Record<SymbolName, string> = {
  rhino: "bg-emerald-500",
  teaLeaf: "bg-teal-500",
  gamusa: "bg-rose-500",
  jaapi: "bg-amber-500",
};

export default function MemoryMatchGamePage() {
  const router = useRouter();
  const [lang, setLang] = useState<SupportedLanguage>("as");
  const [cards, setCards] = useState<CardState[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });
  const [session, setSession] = useState<ReturnType<typeof startSession> | null>(null);
  const [isWon, setIsWon] = useState(false);
  const [flipStartTime, setFlipStartTime] = useState<number>(Date.now());

  useEffect(() => {
    const storedLang = (localStorage.getItem("smaran_lang") || "as") as SupportedLanguage;
    const patientId = localStorage.getItem("smaran_patient_id") || "pat_602188";
    setLang(storedLang);
    const sess = startSession("memory-match", patientId);
    setSession(sess);

    const initialSymbols: SymbolName[] = [
      "rhino", "rhino",
      "teaLeaf", "teaLeaf",
      "gamusa", "gamusa",
      "jaapi", "jaapi",
    ];
    const shuffled = initialSymbols
      .sort(() => Math.random() - 0.5)
      .map((sym, i) => ({ id: i, symbol: sym, matched: false }));
    setCards(shuffled);
    setFlipStartTime(Date.now());

    const title = getTranslation(storedLang, "game_memory_match");
    speakPrompt(`${getTranslation(storedLang, "voice.letsPlay")}: ${title}`, storedLang).catch(() => {});
  }, []);

  const handleCardClick = (index: number) => {
    if (flipped.length === 2 || cards[index].matched || flipped.includes(index) || isWon) {
      return;
    }

    const nextFlipped = [...flipped, index];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      const firstIdx = nextFlipped[0];
      const secondIdx = nextFlipped[1];
      const latency = Date.now() - flipStartTime;

      if (cards[firstIdx].symbol === cards[secondIdx].symbol) {
        recordAttempt(session, true, latency);
        setStats((s) => ({ ...s, correct: s.correct + 1 }));

        const correctVoice = getTranslation(lang, "voice.correct") || "Correct!";
        speakPrompt(correctVoice, lang).catch(() => {});

        setTimeout(() => {
          setCards((prev) => {
            const latestCards = prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, matched: true } : c
            );
            setFlipped([]);
            setFlipStartTime(Date.now());

            const allMatched = latestCards.every((c) => c.matched);
            if (allMatched) {
              handleGameComplete();
            }
            return latestCards;
          });
        }, 400);
      } else {
        recordAttempt(session, false, latency);
        setStats((s) => ({ ...s, incorrect: s.incorrect + 1 }));
        setTimeout(() => {
          setFlipped([]);
          setFlipStartTime(Date.now());
        }, 900);
      }
    }
  };

  const handleGameComplete = async () => {
    if (!session) return;
    const completed = completeSession(session);
    setIsWon(true);
    await saveGameSessionLocally(completed);
    const winPrompt = getTranslation(lang, "well_done") + "! " + (getTranslation(lang, "game.memory.complete") || "You matched all symbols!");
    speakPrompt(winPrompt, lang).catch(() => {});
  };

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
            {getTranslation(lang, "game_memory_match")}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {getTranslation(lang, "memory_match_desc")}
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

      {/* Centered Cards Grid */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto w-full py-4">
        <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-md mx-auto w-full">
          {cards.map((card, idx) => {
            const isFlipped = flipped.includes(idx) || card.matched;
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(idx)}
                disabled={card.matched || flipped.length === 2}
                className={`aspect-square text-2xl sm:text-3xl rounded-3xl flex items-center justify-center font-bold transition-all transform active:scale-95 shadow-card ${
                  card.matched
                    ? "bg-sky-500/15 border-2 border-sky-400 text-sky-500 cursor-default scale-95"
                    : isFlipped
                    ? "surface border-2 border-sky-400 shadow-card-hover scale-105"
                    : "blue-gradient text-white border-2 border-sky-300 hover:shadow-glow hover:scale-[1.02]"
                }`}
              >
                {isFlipped ? (
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl ${SYMBOL_COLORS[card.symbol]} flex items-center justify-center text-white font-bold text-xl shadow-sm animate-scale-in`}>
                    {SYMBOLS[card.symbol]}
                  </div>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Completion View */}
      {isWon && (
        <div className="flex-1 flex flex-col items-center justify-center my-auto">
          <div className="max-w-md w-full blue-gradient text-white p-6 sm:p-8 rounded-3xl shadow-glow text-center space-y-4 animate-scale-in">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <h3 className="text-2xl font-black">{getTranslation(lang, "well_done")}</h3>
            <p className="text-white/95 text-sm font-medium">
              {getTranslation(lang, "game.memory.complete") || "You matched all symbols!"} ({stats.correct} matches)
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

      {!isWon && (
        <div className="text-center text-xs font-bold text-[var(--text-muted)] shrink-0 py-1">
          {getTranslation(lang, "game.matches") || "Matches"}: {stats.correct} / 4 &bull; {getTranslation(lang, "game.takeYourTime") || "Take your time"}
        </div>
      )}
    </div>
  );
}
