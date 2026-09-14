"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SupportedLanguage } from "@/lib/types";
import { speakPrompt, getTranslation } from "@/lib/i18n";

interface LangOption {
  code: SupportedLanguage;
  nativeLabel: string;
  englishLabel: string;
  scriptText: string;
}

const LANGUAGES: LangOption[] = [
  {
    code: "as",
    nativeLabel: "অসমীয়া",
    englishLabel: "Assamese",
    scriptText: "নমস্কাৰ, আপুনি কেনে আছে?",
  },
  {
    code: "brx",
    nativeLabel: "बड़ो",
    englishLabel: "Bodo",
    scriptText: "खुलुमबाय, नोंथाङा मोजां दं नामा?",
  },
  {
    code: "kha",
    nativeLabel: "Khasi",
    englishLabel: "Khasi",
    scriptText: "Kumno, phi koit phi khiah?",
  },
  {
    code: "en",
    nativeLabel: "English",
    englishLabel: "English",
    scriptText: "Welcome, choose your language.",
  },
];

export default function LanguageSelectorPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<SupportedLanguage>("as");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("smaran_lang") as SupportedLanguage;
      if (stored && ["as", "brx", "kha", "en"].includes(stored)) {
        setSelected(stored);
      }
    }
  }, []);

  const handleSelect = (code: SupportedLanguage) => {
    setSelected(code);
    if (typeof window !== "undefined") {
      localStorage.setItem("smaran_lang", code);
    }
  };

  const handleAudioSample = async (code: SupportedLanguage) => {
    handleSelect(code);
    setIsPlayingAudio(true);
    try {
      const sampleText = getTranslation(code, "welcome");
      await speakPrompt(sampleText, code);
    } catch {
      // Audio sample fallback
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleConfirm = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("smaran_lang", selected);
    }
    router.push("/patient/home");
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-4 sm:py-8 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
          Choose Your Language
        </h2>
        <p className="text-[var(--text-secondary)] text-sm sm:text-base font-medium">
          আপোনাৰ ভাষা বাছক &bull; नोंथांनि रावखौ सायख &bull; Jied ia ka ktien
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-auto">
        {LANGUAGES.map((lang, i) => {
          const isCurrent = selected === lang.code;
          return (
            <div
              key={lang.code}
              className={`relative rounded-3xl p-5 border-2 transition-all cursor-pointer surface shadow-card hover:shadow-card-hover flex flex-col justify-between animate-fade-in-up stagger-${i + 1} ${
                isCurrent
                  ? "border-sky-400 ring-4 ring-sky-400/20 dark:ring-sky-500/20"
                  : "border-[var(--border)] hover:border-sky-300"
              }`}
              style={{ animationFillMode: "both" }}
              onClick={() => handleSelect(lang.code)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                    {lang.nativeLabel}
                  </h3>
                  <p className="text-sm font-semibold text-[var(--text-muted)]">
                    {lang.englishLabel}
                  </p>
                </div>
                {isCurrent && (
                  <span className="w-8 h-8 rounded-full blue-gradient text-white flex items-center justify-center font-bold text-sm shadow-card">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                )}
              </div>

              <p className="text-xs text-[var(--text-secondary)] italic surface-overlay p-3 rounded-2xl mb-4 border border-[var(--border-subtle)] leading-relaxed">
                &ldquo;{lang.scriptText}&rdquo;
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAudioSample(lang.code);
                }}
                disabled={isPlayingAudio}
                className="w-full py-2.5 px-3 rounded-2xl surface-overlay hover:bg-sky-50 dark:hover:bg-sky-950/40 text-[var(--text-secondary)] hover:text-sky-600 dark:hover:text-sky-300 font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-[var(--border)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
                <span>{isPlayingAudio && selected === lang.code ? "Playing..." : "Listen to sample"}</span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="pt-6">
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full py-4 blue-gradient hover:shadow-glow text-white font-bold text-xl rounded-2xl shadow-card transition-all active:scale-[0.98]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
