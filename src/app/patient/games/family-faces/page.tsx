"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startSession,
  recordAttempt,
  completeSession,
} from "@/lib/gameInstrumentation";
import { saveGameSessionLocally, getLocalFamilyMembers } from "@/lib/offlineStore";
import { SupportedLanguage } from "@/lib/types";
import { getTranslation, speakPrompt } from "@/lib/i18n";

interface FamilyPhotoItem {
  id: string;
  patientId: string;
  name: string;
  relation: string;
  photoBase64: string;
  createdAt: string;
}

const MOCK_MEMBERS: FamilyPhotoItem[] = [
  { id: "mem_1", patientId: "local", name: "Ajoy", relation: "Son", photoBase64: "", createdAt: new Date().toISOString() },
  { id: "mem_2", patientId: "local", name: "Rumi", relation: "Daughter-in-law", photoBase64: "", createdAt: new Date().toISOString() },
  { id: "mem_3", patientId: "local", name: "Priyanuj", relation: "Grandson", photoBase64: "", createdAt: new Date().toISOString() },
];

export default function FamilyFacesGamePage() {
  const router = useRouter();
  const [lang, setLang] = useState<SupportedLanguage>("as");
  const [members, setMembers] = useState<FamilyPhotoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [session, setSession] = useState<ReturnType<typeof startSession> | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const storedLang = (localStorage.getItem("smaran_lang") || "as") as SupportedLanguage;
    const patientId = localStorage.getItem("smaran_patient_id") || "local_patient";
    setLang(storedLang);
    const sess = startSession("family-faces", patientId);
    setSession(sess);
    getLocalFamilyMembers().then((localList) => {
      if (localList && localList.length > 0) {
        setMembers(localList);
      } else {
        setMembers(MOCK_MEMBERS);
      }
    });
    speakPrompt("Look at the photo of your family member", storedLang).catch(() => {});
  }, []);

  const handleRecognize = (recalled: boolean) => {
    recordAttempt(session, recalled, 1000);
    setRevealed(true);
    const currentMember = members[currentIndex];
    if (currentMember) {
      const msg = `This is ${currentMember.name}, your ${currentMember.relation}`;
      speakPrompt(msg, lang).catch(() => {});
    }
  };

  const handleNext = () => {
    setRevealed(false);
    if (currentIndex + 1 < members.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      handleCompleteGame();
    }
  };

  const handleCompleteGame = async () => {
    if (!session) return;
    const completed = completeSession(session);
    setIsFinished(true);
    await saveGameSessionLocally(completed);
    speakPrompt("How lovely to see family members!", lang).catch(() => {});
  };

  const currentMember = members[currentIndex];

  return (
    <div className="flex-1 flex flex-col justify-between py-2 space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between surface p-4 rounded-3xl border border-[var(--border)] shadow-card">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {getTranslation(lang, "game_family_faces")}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">Recognize your beloved family</p>
        </div>
        <Link
          href="/patient/home"
          className="px-3.5 py-2 surface-overlay hover:border-sky-400 text-[var(--text-secondary)] hover:text-sky-600 text-xs font-bold rounded-2xl border border-[var(--border)] transition-colors flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          {getTranslation(lang, "back")}
        </Link>
      </div>

      {currentMember && !isFinished && (
        <div className="max-w-sm mx-auto w-full my-auto space-y-6">
          <div className="surface rounded-3xl p-6 border-2 border-[var(--border)] shadow-card text-center space-y-4">
            <div className="w-40 h-40 mx-auto rounded-3xl overflow-hidden bg-sky-50 dark:bg-sky-950/40 border-2 border-sky-400/30 flex items-center justify-center shadow-card">
              {currentMember.photoBase64 ? (
                <img
                  src={currentMember.photoBase64}
                  alt={currentMember.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full blue-gradient flex items-center justify-center text-white text-3xl font-bold shadow-glow">
                  {currentMember.name.charAt(0)}
                </div>
              )}
            </div>

            {revealed ? (
              <div className="space-y-1 animate-scale-in">
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                  {currentMember.name}
                </h3>
                <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                  Your {currentMember.relation}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[var(--text-secondary)]">
                  Do you recognize this dear family member?
                </p>
              </div>
            )}
          </div>

          {!revealed ? (
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleRecognize(true)}
                className="flex-1 py-4 blue-gradient hover:shadow-glow text-white font-bold rounded-2xl shadow-card active:scale-[0.98] transition-all"
              >
                Yes, I remember
              </button>
              <button
                onClick={() => handleRecognize(false)}
                className="flex-1 py-4 surface-overlay hover:border-sky-400 text-[var(--text-secondary)] font-bold rounded-2xl border border-[var(--border)] active:scale-[0.98] transition-all"
              >
                Tell me who it is
              </button>
            </div>
          ) : (
            <button
              onClick={handleNext}
              className="w-full py-4 blue-gradient text-white font-bold text-lg rounded-2xl shadow-glow hover:scale-[1.01] active:scale-[0.98] transition-all"
            >
              {currentIndex + 1 < members.length ? "Next Family Member" : "Finish Activity"}
            </button>
          )}
        </div>
      )}

      {/* Completion Modal */}
      {isFinished && (
        <div className="blue-gradient text-white p-6 sm:p-8 rounded-3xl shadow-glow text-center space-y-4 animate-scale-in">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <h3 className="text-2xl font-bold">{getTranslation(lang, "well_done")}</h3>
          <p className="text-white/90 text-sm">How lovely it is to see and remember our family!</p>
          <div className="flex gap-3 justify-center pt-2">
            <button onClick={() => window.location.reload()} className="py-3 px-6 bg-white text-sky-700 font-bold rounded-2xl shadow-card hover:bg-sky-50 active:scale-95 transition-all">
              See Again
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
