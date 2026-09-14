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
  labelKey: string;
  periodKey: string;
  iconSvg: React.ReactNode;
}

const ALL_ROUTINE_STEPS: RoutineStep[] = [
  {
    id: "wake",
    order: 1,
    labelKey: "routine.wakeUp",
    periodKey: "morning",
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
  },
  {
    id: "chai",
    order: 2,
    labelKey: "routine.morningTea",
    periodKey: "morning",
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="2" x2="6" y2="4" />
        <line x1="10" y1="2" x2="10" y2="4" />
        <line x1="14" y1="2" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    id: "walk",
    order: 3,
    labelKey: "routine.prayer",
    periodKey: "morning",
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="3" />
        <line x1="12" y1="8" x2="12" y2="14" />
        <path d="M9 11l3 3 3-3" />
        <path d="M9 17l3 4 3-4" />
      </svg>
    ),
  },
  {
    id: "lunch",
    order: 4,
    labelKey: "routine.lunch",
    periodKey: "afternoon",
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    id: "tea",
    order: 5,
    labelKey: "routine.eveningTea",
    periodKey: "evening",
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
      </svg>
    ),
  },
  {
    id: "sleep",
    order: 6,
    labelKey: "routine.sleep",
    periodKey: "night",
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  },
];

const PERIOD_COLORS: Record<string, string> = {
  morning: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  afternoon: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  evening: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
  night: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
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
    const patientId = localStorage.getItem("smaran_patient_id") || "pat_602188";
    setLang(storedLang);
    const sess = startSession("routine-recall", patientId);
    setSession(sess);
    const shuffled = [...ALL_ROUTINE_STEPS].sort(() => Math.random() - 0.5);
    setAvailable(shuffled);
    setStepStartTime(Date.now());

    const prompt = getTranslation(storedLang, "voice.orderRoutine") || "Put your daily routine in order from morning to night";
    speakPrompt(prompt, storedLang).catch(() => {});
  }, []);

  const handleSelectStep = (step: RoutineStep) => {
    if (isFinished) return;
    const latency = Date.now() - stepStartTime;
    const expectedOrder = selectedOrder.length + 1;
    const isCorrect = step.order === expectedOrder;
    recordAttempt(session, isCorrect, latency);

    const stepLabel = getTranslation(lang, step.labelKey);
    speakPrompt(stepLabel, lang).catch(() => {});

    const newSelected = [...selectedOrder, step];
    setSelectedOrder(newSelected);
    setAvailable((prev) => prev.filter((s) => s.id !== step.id));
    setStepStartTime(Date.now());

    if (newSelected.length === ALL_ROUTINE_STEPS.length) {
      handleCompleteGame();
    }
  };

  const handleReset = () => {
    setSelectedOrder([]);
    setAvailable([...ALL_ROUTINE_STEPS].sort(() => Math.random() - 0.5));
    setIsFinished(false);
    setStepStartTime(Date.now());
    const prompt = getTranslation(lang, "voice.orderRoutine") || "Put your daily routine in order from morning to night";
    speakPrompt(prompt, lang).catch(() => {});
  };

  const handleCompleteGame = async () => {
    if (!session) return;
    const completed = completeSession(session);
    setIsFinished(true);
    await saveGameSessionLocally(completed);
    const winPrompt = getTranslation(lang, "well_done") + "! " + (getTranslation(lang, "game.routine.complete") || "You ordered your daily activities clearly from morning to night!");
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
            {getTranslation(lang, "game_routine_recall")}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {getTranslation(lang, "routine_recall_desc")}
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

      {/* Selected Sequence Timeline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-wider">
            {getTranslation(lang, "game.routine.timeline") || "Your Timeline (Morning to Night)"}
          </p>
          <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
            {selectedOrder.length} / {ALL_ROUTINE_STEPS.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 min-h-[76px]">
          {ALL_ROUTINE_STEPS.map((_, idx) => {
            const slotNum = idx + 1;
            const step = selectedOrder[idx];
            return (
              <div
                key={slotNum}
                className={`p-3 rounded-2xl border-2 transition-all flex flex-col justify-center items-center text-center min-h-[88px] ${
                  step
                    ? "surface border-sky-400 shadow-card animate-scale-in"
                    : "border-dashed border-[var(--border)] bg-sky-50/20 dark:bg-sky-950/10 text-[var(--text-muted)]"
                }`}
              >
                {step ? (
                  <>
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wide">
                      {getTranslation(lang, "game.routine.step") || "Step"} {slotNum}
                    </span>
                    <span className="text-xs font-bold text-[var(--text-primary)] leading-tight mt-1">
                      {getTranslation(lang, step.labelKey)}
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-bold text-[var(--text-muted)]">
                    {getTranslation(lang, "game.routine.slot") || "Slot"} {slotNum}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Available choices */}
      {!isFinished && available.length > 0 && (
        <div className="flex-1 flex flex-col justify-center my-auto space-y-3 py-2">
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">
            {getTranslation(lang, "game.routine.tapNext") || "Tap the next activity in your day:"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {available.map((step) => (
              <button
                key={step.id}
                onClick={() => handleSelectStep(step)}
                className="surface-raised hover:border-sky-400 p-4 rounded-2xl border-2 border-[var(--border)] shadow-card hover:shadow-card-hover flex items-center gap-3.5 text-left transition-all active:scale-[0.98] group"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${PERIOD_COLORS[step.periodKey]} shrink-0 shadow-sm`}>
                  {step.iconSvg}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${PERIOD_COLORS[step.periodKey]}`}>
                    {getTranslation(lang, `period.${step.periodKey}`) || step.periodKey}
                  </span>
                  <p className="text-sm font-bold text-[var(--text-primary)] group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors mt-1 leading-snug">
                    {getTranslation(lang, step.labelKey)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {isFinished && (
        <div className="flex-1 flex flex-col items-center justify-center my-auto">
          <div className="max-w-md w-full blue-gradient text-white p-6 sm:p-8 rounded-3xl shadow-glow text-center space-y-4 animate-scale-in">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <h3 className="text-2xl font-black">{getTranslation(lang, "well_done")}</h3>
            <p className="text-white/95 text-sm font-medium">
              {getTranslation(lang, "game.routine.complete") || "You ordered your daily activities clearly from morning to night!"}
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={handleReset}
                className="py-3 px-6 bg-white text-sky-700 font-bold rounded-2xl shadow-card hover:bg-sky-50 active:scale-95 transition-all"
              >
                {getTranslation(lang, "game.seeAgain") || "Try Again"}
              </button>
              <button
                onClick={() => {
                  const backMsg = getTranslation(lang, "voice.goingBack") || "Going back";
                  speakPrompt(backMsg, lang).catch(() => {});
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
    </div>
  );
}
