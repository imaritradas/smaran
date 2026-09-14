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

interface PadConfig {
  id: number;
  label: string;
  color: string;
  activeColor: string;
  soundFreq: number;
}

const PADS: PadConfig[] = [
  { id: 0, label: "Red", color: "bg-rose-500/40 hover:bg-rose-500/60 border-rose-500/40", activeColor: "bg-rose-500 scale-95 shadow-lg shadow-rose-500/50 border-white", soundFreq: 261.63 },
  { id: 1, label: "Blue", color: "bg-sky-500/40 hover:bg-sky-500/60 border-sky-500/40", activeColor: "bg-sky-500 scale-95 shadow-lg shadow-sky-500/50 border-white", soundFreq: 329.63 },
  { id: 2, label: "Green", color: "bg-emerald-500/40 hover:bg-emerald-500/60 border-emerald-500/40", activeColor: "bg-emerald-500 scale-95 shadow-lg shadow-emerald-500/50 border-white", soundFreq: 392.0 },
  { id: 3, label: "Yellow", color: "bg-amber-500/40 hover:bg-amber-500/60 border-amber-500/40", activeColor: "bg-amber-500 scale-95 shadow-lg shadow-amber-500/50 border-white", soundFreq: 523.25 },
];

export default function SequenceRecallGamePage() {
  const router = useRouter();
  const [lang, setLang] = useState<SupportedLanguage>("as");
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerStep, setPlayerStep] = useState(0);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [round, setRound] = useState(1);
  const [session, setSession] = useState<ReturnType<typeof startSession> | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = (freq: number) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // AudioContext not allowed or disabled
    }
  };

  const playPadFeedback = (padId: number) => {
    setActivePad(padId);
    playTone(PADS[padId].soundFreq);
    setTimeout(() => setActivePad(null), 380);
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
          }, 550);
        }
      }, (index + 1) * 700);
    });
  };

  useEffect(() => {
    const storedLang = (localStorage.getItem("smaran_lang") || "as") as SupportedLanguage;
    const patientId = localStorage.getItem("smaran_patient_id") || "pat_602188";
    setLang(storedLang);

    const sess = startSession("sequence-recall", patientId);
    setSession(sess);

    startNextRound(2);

    const title = getTranslation(storedLang, "game_sequence_recall");
    speakPrompt(`${getTranslation(storedLang, "voice.letsPlay")}: ${title}`, storedLang).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const correctVoice = getTranslation(lang, "voice.correct") || "Correct!";
        speakPrompt(correctVoice, lang).catch(() => {});

        if (round < 4) {
          setRound((r) => r + 1);
          setTimeout(() => {
            startNextRound(sequence.length + 1);
          }, 900);
        } else {
          handleGameFinish();
        }
      } else {
        setPlayerStep(nextStep);
        setStepStartTime(Date.now());
      }
    } else {
      recordAttempt(session, false, latency);
      const tryAgainVoice = getTranslation(lang, "voice.tryAgain") || "Try again!";
      speakPrompt(tryAgainVoice, lang).catch(() => {});

      setTimeout(() => {
        setIsShowingSequence(true);
        startNextRound(sequence.length);
      }, 900);
    }
  };

  const handleGameFinish = async () => {
    if (!session) return;
    const completed = completeSession(session);
    setIsFinished(true);
    await saveGameSessionLocally(completed);
    const winPrompt = getTranslation(lang, "well_done") + "! " + (getTranslation(lang, "game.sequence.complete") || "Wonderful memory! You recalled the melodic patterns.");
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
            {getTranslation(lang, "game_sequence_recall")}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {getTranslation(lang, "sequence_recall_desc")}
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

      {/* Centered 2x2 Simon Pad Grid */}
      {!isFinished && (
        <div className="flex-1 flex flex-col items-center justify-center my-auto w-full py-4">
          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto w-full aspect-square p-5 bg-sky-950/20 dark:bg-black/60 rounded-3xl border-2 border-sky-400/20 shadow-glow backdrop-blur">
            {PADS.map((pad) => {
              const isActive = activePad === pad.id;
              return (
                <button
                  key={pad.id}
                  onClick={() => handlePadPress(pad.id)}
                  disabled={isShowingSequence || isFinished}
                  aria-label={pad.label}
                  className={`rounded-2xl border-2 transition-all duration-200 ${
                    isActive ? pad.activeColor : pad.color
                  } active:scale-95 disabled:cursor-not-allowed shadow-card`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {isFinished && (
        <div className="flex-1 flex flex-col items-center justify-center my-auto">
          <div className="max-w-md w-full blue-gradient text-white p-6 sm:p-8 rounded-3xl shadow-glow text-center space-y-4 animate-scale-in">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
            <h3 className="text-2xl font-black">{getTranslation(lang, "well_done")}</h3>
            <p className="text-white/95 text-sm font-medium">
              {getTranslation(lang, "game.sequence.complete") || "Wonderful memory! You recalled the melodic patterns beautifully."}
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
          {isShowingSequence ? (
            <span className="text-sky-500 animate-pulse">
              {getTranslation(lang, "game.sequence.watch") || "Watch the lights carefully..."}
            </span>
          ) : (
            <span>
              {getTranslation(lang, "game.sequence.yourTurn") || "Your turn! Tap"} {playerStep + 1} / {sequence.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
