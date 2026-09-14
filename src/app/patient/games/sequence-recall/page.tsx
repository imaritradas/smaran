"use client";

import React, { useState, useEffect, useRef } from "react";
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

interface SimonPad {
  id: number;
  label: string;
  color: string;
  activeColor: string;
  soundFreq: number;
}

const PADS: SimonPad[] = [
  { id: 0, label: "Cyan", color: "bg-sky-500", activeColor: "bg-sky-200 ring-8 ring-sky-300 scale-105", soundFreq: 261.63 },
  { id: 1, label: "Indigo", color: "bg-indigo-500", activeColor: "bg-indigo-200 ring-8 ring-indigo-300 scale-105", soundFreq: 329.63 },
  { id: 2, label: "Teal", color: "bg-teal-500", activeColor: "bg-teal-200 ring-8 ring-teal-300 scale-105", soundFreq: 392.0 },
  { id: 3, label: "Amber", color: "bg-amber-500", activeColor: "bg-amber-200 ring-8 ring-amber-300 scale-105", soundFreq: 523.25 },
];

export default function SequenceRecallGamePage() {
  const router = useRouter();
  const [lang, setLang] = useState<SupportedLanguage>("as");
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerStep, setPlayerStep] = useState<number>(0);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [isShowingSequence, setIsShowingSequence] = useState<boolean>(false);
  const [round, setRound] = useState<number>(1);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());
  const [session, setSession] = useState<ReturnType<typeof startSession> | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = (freq: number) => {
    try {
      if (!audioCtxRef.current && typeof window !== "undefined") {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }
      if (audioCtxRef.current) {
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        gain.gain.setValueAtTime(0.2, audioCtxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtxRef.current.currentTime + 0.4);
      }
    } catch {
      // Audio fallback
    }
  };

  const playPadFeedback = (padId: number) => {
    setActivePad(padId);
    playTone(PADS[padId].soundFreq);
    setTimeout(() => setActivePad(null), 400);
  };

  const startNextRound = (seqLength: number) => {
    setIsShowingSequence(true);
    setPlayerStep(0);
    const newSeq: number[] = [];
    for (let i = 0; i < seqLength; i++) {
      newSeq.push(Math.floor(Math.random() * 4));
    }
    setSequence(newSeq);

    newSeq.forEach((padId, index) => {
      setTimeout(() => {
        playPadFeedback(padId);
        if (index === newSeq.length - 1) {
          setTimeout(() => {
            setIsShowingSequence(false);
            setStepStartTime(Date.now());
          }, 600);
        }
      }, (index + 1) * 700);
    });
  };

  useEffect(() => {
    const storedLang = (localStorage.getItem("smaran_lang") || "as") as SupportedLanguage;
    const patientId = localStorage.getItem("smaran_patient_id") || "local_patient";
    setLang(storedLang);

    const sess = startSession("sequence-recall", patientId);
    setSession(sess);

    startNextRound(2);
    speakPrompt("Watch the lights and repeat the pattern", storedLang).catch(() => {});
  }, []);

  const handlePadPress = (padId: number) => {
    if (isShowingSequence || isFinished) return;
    const latency = Date.now() - stepStartTime;
    playPadFeedback(padId);

    const expectedPad = sequence[playerStep];
    const isCorrect = padId === expectedPad;

    if (isCorrect) {
      recordAttempt(session, true, latency);
      const nextStep = playerStep + 1;

      if (nextStep === sequence.length) {
        if (round < 4) {
          setRound((r) => r + 1);
          setTimeout(() => {
            startNextRound(sequence.length + 1);
          }, 1000);
        } else {
          handleGameFinish();
        }
      } else {
        setPlayerStep(nextStep);
        setStepStartTime(Date.now());
      }
    } else {
      recordAttempt(session, false, latency);
      setTimeout(() => {
        setIsShowingSequence(true);
        startNextRound(sequence.length);
      }, 800);
    }
  };

  const handleGameFinish = async () => {
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
            {getTranslation(lang, "game_sequence_recall")}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">Watch the lights and tap in order</p>
        </div>
        <Link
          href="/patient/home"
          className="px-3.5 py-2 surface-overlay hover:border-sky-400 text-[var(--text-secondary)] hover:text-sky-600 text-xs font-bold rounded-2xl border border-[var(--border)] transition-colors flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          {getTranslation(lang, "back")}
        </Link>
      </div>

      {/* 2x2 Simon Pad Grid */}
      <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto w-full my-auto aspect-square p-4 bg-sky-950/20 dark:bg-black/60 rounded-3xl border border-sky-400/20 shadow-glow backdrop-blur">
        {PADS.map((pad) => {
          const isActive = activePad === pad.id;
          return (
            <button
              key={pad.id}
              onClick={() => handlePadPress(pad.id)}
              disabled={isShowingSequence || isFinished}
              aria-label={pad.label}
              className={`rounded-2xl transition-all duration-200 ${
                isActive ? pad.activeColor : pad.color
              } active:scale-95 disabled:cursor-not-allowed shadow-card`}
            />
          );
        })}
      </div>

      {/* Completion Modal */}
      {isFinished && (
        <div className="blue-gradient text-white p-6 sm:p-8 rounded-3xl shadow-glow text-center space-y-4 animate-scale-in">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
          <h3 className="text-2xl font-bold">{getTranslation(lang, "well_done")}</h3>
          <p className="text-white/90 text-sm">Wonderful memory! You recalled the melodic patterns beautifully.</p>
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
          {isShowingSequence ? (
            <span className="text-sky-500 animate-pulse font-bold">Watch the lights carefully...</span>
          ) : (
            <span>Your turn! Tap {playerStep + 1} of {sequence.length}</span>
          )}
        </div>
      )}
    </div>
  );
}
