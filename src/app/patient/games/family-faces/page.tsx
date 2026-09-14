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
  { id: "mem_1", patientId: "pat_602188", name: "Ajoy", relation: "Son", photoBase64: "", createdAt: new Date().toISOString() },
  { id: "mem_2", patientId: "pat_602188", name: "Rumi", relation: "Daughter-in-law", photoBase64: "", createdAt: new Date().toISOString() },
  { id: "mem_3", patientId: "pat_602188", name: "Priyanuj", relation: "Grandson", photoBase64: "", createdAt: new Date().toISOString() },
];

export default function FamilyFacesGamePage() {
  const router = useRouter();
  const [lang, setLang] = useState<SupportedLanguage>("as");
  const [members, setMembers] = useState<FamilyPhotoItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [session, setSession] = useState<ReturnType<typeof startSession> | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedLang = (localStorage.getItem("smaran_lang") || "as") as SupportedLanguage;
    const patientId = localStorage.getItem("smaran_patient_id") || "pat_602188";
    setLang(storedLang);
    const sess = startSession("family-faces", patientId);
    setSession(sess);

    async function loadFamilyPhotos() {
      setLoading(true);
      const combined: FamilyPhotoItem[] = [];

      // 1. Fetch from Server API for this patient
      try {
        const res = await fetch(`/api/family?patientId=${encodeURIComponent(patientId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.members && data.members.length > 0) {
            combined.push(...data.members);
          }
        }
        // Also check pat_602188 if patientId is different/local
        if (patientId !== "pat_602188" && combined.length === 0) {
          const resDefault = await fetch(`/api/family?patientId=pat_602188`);
          if (resDefault.ok) {
            const dataDef = await resDefault.json();
            if (dataDef.members && dataDef.members.length > 0) {
              combined.push(...dataDef.members);
            }
          }
        }
      } catch (e) {
        console.warn("Failed fetching server family photos:", e);
      }

      // 2. Fetch from IndexedDB offline storage
      try {
        const localList = await getLocalFamilyMembers();
        if (localList && localList.length > 0) {
          for (const item of localList) {
            if (!combined.some((m) => m.id === item.id)) {
              combined.push(item);
            }
          }
        }
      } catch (e) {
        console.warn("Local storage read error:", e);
      }

      // 3. Fallback to mock if none found
      if (combined.length === 0) {
        setMembers(MOCK_MEMBERS);
      } else {
        setMembers(combined);
      }
      setLoading(false);

      const lookPrompt = getTranslation(storedLang, "voice.lookAtPhoto") || "Look at the photo of your family member";
      speakPrompt(lookPrompt, storedLang).catch(() => {});
    }

    loadFamilyPhotos();
  }, []);

  const handleRecognize = (recalled: boolean) => {
    recordAttempt(session, recalled, 1000);
    setRevealed(true);
    const currentMember = members[currentIndex];
    if (currentMember) {
      const intro = getTranslation(lang, "voice.thisIs") || "This is";
      const yourStr = getTranslation(lang, "game.family.your") || "your";
      const msg = `${intro} ${currentMember.name}, ${yourStr} ${currentMember.relation}`;
      speakPrompt(msg, lang).catch(() => {});
    }
  };

  const handleNext = () => {
    setRevealed(false);
    if (currentIndex + 1 < members.length) {
      setCurrentIndex((i) => i + 1);
      const lookPrompt = getTranslation(lang, "voice.lookAtPhoto") || "Look at the photo of your family member";
      speakPrompt(lookPrompt, lang).catch(() => {});
    } else {
      handleCompleteGame();
    }
  };

  const handleCompleteGame = async () => {
    if (!session) return;
    const completed = completeSession(session);
    setIsFinished(true);
    await saveGameSessionLocally(completed);
    const lovelyMsg = getTranslation(lang, "voice.lovelyFamily") || "How lovely to see family members!";
    speakPrompt(lovelyMsg, lang).catch(() => {});
  };

  const handleBack = () => {
    const backMsg = getTranslation(lang, "voice.goingBack") || "Going back";
    speakPrompt(backMsg, lang).catch(() => {});
  };

  const currentMember = members[currentIndex];

  const getImgSrc = (photoBase64: string) => {
    if (!photoBase64) return "";
    if (photoBase64.startsWith("data:")) return photoBase64;
    return `data:image/jpeg;base64,${photoBase64}`;
  };

  return (
    <div className="min-h-[82vh] flex flex-col justify-between py-2 space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between surface p-4 sm:p-5 rounded-3xl border border-[var(--border)] shadow-card shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            {getTranslation(lang, "game_family_faces")}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {getTranslation(lang, "family_faces_desc")}
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

      {/* Loading state */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-[var(--text-muted)]">{getTranslation(lang, "status.loading")}</p>
        </div>
      )}

      {/* Centered Main Game Card Area */}
      {!loading && currentMember && !isFinished && (
        <div className="flex-1 flex flex-col items-center justify-center my-auto py-4">
          <div className="max-w-md w-full mx-auto space-y-6">
            {/* Family Photo Card */}
            <div className="surface rounded-3xl p-6 sm:p-8 border-2 border-[var(--border)] shadow-card text-center space-y-5 transition-all">
              <div className="w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-3xl overflow-hidden bg-sky-50 dark:bg-sky-950/40 border-2 border-sky-400/40 flex items-center justify-center shadow-lg relative">
                {currentMember.photoBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getImgSrc(currentMember.photoBase64)}
                    alt={currentMember.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full blue-gradient flex items-center justify-center text-white text-4xl font-bold shadow-glow">
                    {currentMember.name.charAt(0)}
                  </div>
                )}
                <div className="absolute bottom-2 right-2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-[11px] font-bold">
                  {currentIndex + 1} / {members.length}
                </div>
              </div>

              {revealed ? (
                <div className="space-y-1.5 animate-scale-in">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                    {currentMember.name}
                  </h3>
                  <p className="text-base font-bold text-sky-600 dark:text-sky-400">
                    {getTranslation(lang, "game.family.your") || "Your"} {currentMember.relation}
                  </p>
                </div>
              ) : (
                <div className="space-y-1 py-1">
                  <p className="text-base font-bold text-[var(--text-secondary)]">
                    {getTranslation(lang, "game.family.recognize") || "Do you recognize this dear family member?"}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!revealed ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => handleRecognize(true)}
                  className="py-4 px-3 blue-gradient hover:shadow-glow text-white text-base font-bold rounded-2xl shadow-card active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {getTranslation(lang, "game.family.yesRemember") || "Yes, I remember"}
                </button>
                <button
                  onClick={() => handleRecognize(false)}
                  className="py-4 px-3 surface-overlay hover:border-sky-400 text-[var(--text-secondary)] text-base font-bold rounded-2xl border-2 border-[var(--border)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  {getTranslation(lang, "game.family.tellMe") || "Tell me who it is"}
                </button>
              </div>
            ) : (
              <button
                onClick={handleNext}
                className="w-full py-4.5 blue-gradient text-white font-black text-lg rounded-2xl shadow-glow hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>{currentIndex + 1 < members.length ? (getTranslation(lang, "game.family.nextMember") || "Next Family Member") : (getTranslation(lang, "game.finish") || "Finish Activity")}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Completion View */}
      {isFinished && (
        <div className="flex-1 flex flex-col items-center justify-center my-auto">
          <div className="max-w-md w-full blue-gradient text-white p-6 sm:p-8 rounded-3xl shadow-glow text-center space-y-4 animate-scale-in">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <h3 className="text-2xl font-black">{getTranslation(lang, "well_done")}</h3>
            <p className="text-white/95 text-sm font-medium">
              {getTranslation(lang, "game.family.complete") || "How lovely it is to see and remember our family!"}
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => {
                  setCurrentIndex(0);
                  setIsFinished(false);
                  setRevealed(false);
                }}
                className="py-3 px-6 bg-white text-sky-700 font-bold rounded-2xl shadow-card hover:bg-sky-50 active:scale-95 transition-all"
              >
                {getTranslation(lang, "game.seeAgain") || "See Again"}
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
