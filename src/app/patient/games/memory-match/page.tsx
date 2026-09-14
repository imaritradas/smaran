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

// North Eastern regional symbols rendered as text glyphs (no emojis)
const SYMBOLS = ["A", "B", "C", "D"];
const SYMBOL_COLORS = ["bg-sky-500", "bg-indigo-500", "bg-teal-500", "bg-amber-500"];

interface Card {
  id: number;
  symbol: number;
  matched: boolean;
}

export default function MemoryMatchGamePage() {
  const router = useRouter();
  const [lang, setLang] = useState<SupportedLanguage>("as");
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [session, setSession] = useState<ReturnType<typeof startSession> | null>(null);
  const [cardFlipTimes, setCardFlipTimes] = useState<Record<number, number>>({});
  const [isWon, setIsWon] = useState(false);
  const [stats, setStats] = useState<{ correct: number; incorrect: number }>({ correct: 0, incorrect: 0 });

  useEffect(() => {
    const storedLang = (localStorage.getItem("smaran_lang") || "as") as SupportedLanguage;
    const patientId = localStorage.getItem("smaran_patient_id") || "local_patient";
    setLang(storedLang);

    const deck: Card[] = [...Array.from(SYMBOLS.keys()), ...Array.from(SYMBOLS.keys())]
      .sort(() => Math.random() - 0.5)
      .map((sym, idx) => ({ id: idx, symbol: sym, matched: false }));
    setCards(deck);

    const sess = startSession("memory-match", patientId);
    setSession(sess);

    const prompt = getTranslation(storedLang, "tap_to_start");
    speakPrompt(prompt, storedLang).catch(() => {});
  }, []);

  const handleCardClick = (index: number) => {
    if (flipped.length === 2 || cards[index].matched || flipped.includes(index)) return;

    const now = Date.now();
    setCardFlipTimes((prev) => ({ ...prev, [index]: now }));

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = cards[firstIdx];
      const secondCard = cards[secondIdx];
      const latency = now - (cardFlipTimes[firstIdx] || now);

      if (firstCard.symbol === secondCard.symbol) {
        recordAttempt(session, true, latency);
        setStats((s) => ({ ...s, correct: s.correct + 1 }));

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, matched: true } : c
            )
          );
          setFlipped([]);

          setCards((latestCards) => {
            const allMatched = latestCards.every(
              (c, i) =>
                c.matched || i === firstIdx || i === secondIdx
            );
            if (allMatched) {
              handleGameComplete();
            }
            return latestCards;
          });
        }, 500);
      } else {
        recordAttempt(session, false, latency);
        setStats((s) => ({ ...s, incorrect: s.incorrect + 1 }));
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  const handleGameComplete = async () => {
    if (!session) return;
    const completed = completeSession(session);
    setIsWon(true);
    await saveGameSessionLocally(completed);
    const winPrompt = getTranslation(lang, "well_done");
    speakPrompt(winPrompt, lang).catch(() => {});
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-2 space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between surface p-4 sm:p-5 rounded-3xl border border-[var(--border)] shadow-card">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            {getTranslation(lang, "game_memory_match")}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Find the matching pairs</p>
        </div>
        <Link
          href="/patient/home"
          className="px-4 py-2.5 surface-overlay hover:border-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 text-[var(--text-secondary)] hover:text-sky-600 text-xs font-bold rounded-2xl border border-[var(--border)] transition-all flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </Link>
      </div>

      {/* 4x2 Cards Grid */}
      <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-md mx-auto w-full my-auto">
        {cards.map((card, idx) => {
          const isFlipped = flipped.includes(idx) || card.matched;
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(idx)}
              disabled={card.matched || flipped.length === 2}
              className={`aspect-square text-2xl sm:text-3xl rounded-3xl flex items-center justify-center font-bold transition-all transform active:scale-95 shadow-card ${
                card.matched
                  ? "bg-sky-500/15 border-2 border-sky-400 text-sky-500 cursor-default"
                  : isFlipped
                  ? "surface border-2 border-sky-400 shadow-card-hover scale-105"
                  : "blue-gradient text-white border-2 border-sky-300 hover:shadow-glow"
              }`}
            >
              {isFlipped ? (
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl ${SYMBOL_COLORS[card.symbol]} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                  {SYMBOLS[card.symbol]}
                </div>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
                  <circle cx="12" cy="12" r="2"/>
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Completion Modal Card */}
      {isWon && (
        <div className="blue-gradient text-white p-6 sm:p-8 rounded-3xl shadow-glow text-center space-y-4 animate-scale-in">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <h3 className="text-2xl font-bold">{getTranslation(lang, "well_done")}</h3>
          <p className="text-white/90 text-sm">
            You found all pairs! {stats.correct} correct matches and {stats.incorrect} attempts.
          </p>
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

      {!isWon && (
        <div className="text-center text-xs font-semibold text-[var(--text-muted)]">
          Matches: {stats.correct} / 4 &bull; Take your time
        </div>
      )}
    </div>
  );
}
