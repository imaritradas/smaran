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

interface RoutineStep {
  id: string;
  order: number;
  label: string;
  period: string;
  iconPath: string;
}

const DEFAULT_ROUTINE: RoutineStep[] = [
  { id: "brush", order: 1, label: "Brush teeth and wash face", period: "Morning", iconPath: "M12 2v4M6.34 6.34l2.83 2.83M20 12h-4M17.66 6.34l-2.83 2.83M12 20v-4" },
  { id: "chai", order: 2, label: "Morning tea and light breakfast", period: "Morning", iconPath: "M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" },
  { id: "lunch", order: 3, label: "Midday meal and rest", period: "Afternoon", iconPath: "M12 2a10 10 0 1 0 10 10H12V2z" },
  { id: "sleep", order: 4, label: "Night sleep and rest", period: "Night", iconPath: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" },
];

const PERIOD_COLORS: Record<string, string> = {
  Morning: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  Afternoon: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  Night: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
};

export default function RoutineRecallGamePage() {
  const router = useRouter();
  const [lang, setLang] = useState<SupportedLanguage>("as");
  const [available, setAvailable] = useState<RoutineStep[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<RoutineStep[]>([]);
  const [session, setSession] = useState<ReturnType<typeof startSession> | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());

  useEffect(() => {
    const storedLang = (localStorage.getItem("smaran_lang") || "as") as SupportedLanguage;
    const patientId = localStorage.getItem("smaran_patient_id") || "local_patient";
    setLang(storedLang);
    const sess = startSession("routine-recall", patientId);
    setSession(sess);
    const shuffled = [...DEFAULT_ROUTINE].sort(() => Math.random() - 0.5);
    setAvailable(shuffled);
    setStepStartTime(Date.now());
    speakPrompt("Put your daily routine in order from morning to night", storedLang).catch(() => {});
  }, []);

  const handleSelectStep = (step: RoutineStep) => {
    if (isFinished) return;
    const latency = Date.now() - stepStartTime;
    const expectedOrder = selectedOrder.length + 1;
    const isCorrect = step.order === expectedOrder;
    recordAttempt(session, isCorrect, latency);
    const newSelected = [...selectedOrder, step];
    setSelectedOrder(newSelected);
    setAvailable((prev) => prev.filter((s) => s.id !== step.id));
    setStepStartTime(Date.now());
    if (newSelected.length === DEFAULT_ROUTINE.length) {
      handleCompleteGame();
    }
  };

  const handleReset = () => {
    setSelectedOrder([]);
    setAvailable([...DEFAULT_ROUTINE].sort(() => Math.random() - 0.5));
    setStepStartTime(Date.now());
  };

  const handleCompleteGame = async () => {
    if (!session) return;
    const completed = completeSession(session);
    setIsFinished(true);
    await saveGameSessionLocally(completed);
    const winPrompt = getTranslation(lang, "well_done");
    speakPrompt(winPrompt, lang).catch(() => {});
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-2 space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between surface p-4 rounded-3xl border border-[var(--border)] shadow-card">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {getTranslation(lang, "game_routine_recall")}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">Order your daily activities</p>
        </div>
        <Link
          href="/patient/home"
          className="px-3.5 py-2 surface-overlay hover:border-sky-400 text-[var(--text-secondary)] hover:text-sky-600 text-xs font-bold rounded-2xl border border-[var(--border)] transition-colors flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          {getTranslation(lang, "back")}
        </Link>
      </div>

      {/* Selected Sequence Slots */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">
          Your Timeline (Morning to Night)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 min-h-[72px]">
          {[1, 2, 3, 4].map((slotNum) => {
            const step = selectedOrder[slotNum - 1];
            return (
              <div
                key={slotNum}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col justify-center items-center text-center min-h-[80px] ${
                  step
                    ? "surface border-sky-400 shadow-card animate-scale-in"
                    : "border-dashed border-[var(--border)] bg-sky-50/20 dark:bg-sky-950/10 text-[var(--text-muted)]"
                }`}
              >
                {step ? (
                  <>
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wide">
                      Step {slotNum}
                    </span>
                    <span className="text-xs font-semibold text-[var(--text-primary)] leading-tight mt-1">
                      {step.label}
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-bold text-[var(--text-muted)]">
                    Slot {slotNum}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Available choices */}
      {!isFinished && available.length > 0 && (
        <div className="space-y-2 my-auto">
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">
            Tap the next activity in your day:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {available.map((step) => (
              <button
                key={step.id}
                onClick={() => handleSelectStep(step)}
                className="surface-raised hover:border-sky-400 p-4 rounded-2xl border-2 border-[var(--border)] shadow-card hover:shadow-card-hover flex items-center gap-3 text-left transition-all active:scale-[0.98] group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${PERIOD_COLORS[step.period]} shrink-0`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={step.iconPath}/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${PERIOD_COLORS[step.period]}`}>
                    {step.period}
                  </span>
                  <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors mt-1">
                    {step.label}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {isFinished && (
        <div className="blue-gradient text-white p-6 sm:p-8 rounded-3xl shadow-glow text-center space-y-4 animate-scale-in">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <h3 className="text-2xl font-bold">{getTranslation(lang, "well_done")}</h3>
          <p className="text-white/90 text-sm">You ordered your daily activities clearly from morning to night!</p>
          <div className="flex gap-3 justify-center pt-2">
            <button onClick={handleReset} className="py-3 px-6 bg-white text-sky-700 font-bold rounded-2xl shadow-card hover:bg-sky-50 active:scale-95 transition-all">
              Try Again
            </button>
            <button onClick={() => router.push("/patient/home")} className="py-3 px-6 bg-sky-900/40 text-white font-bold rounded-2xl border border-white/20 hover:bg-sky-900/60 active:scale-95 transition-all">
              All Activities
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
