"use client";

import React, { useEffect } from "react";
import { SupportedLanguage } from "@/lib/types";
import { getTranslation, speakPrompt } from "@/lib/i18n";

interface TakeMeHomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: SupportedLanguage;
  distanceMeters: number | null;
  bearingDegrees: number;
  homeAddress?: string;
  caregiverPhone?: string;
}

export default function TakeMeHomeModal({
  isOpen,
  onClose,
  lang,
  distanceMeters,
  bearingDegrees,
  homeAddress,
  caregiverPhone = "+91 98640 12345",
}: TakeMeHomeModalProps) {
  useEffect(() => {
    if (isOpen) {
      const voiceText = getTranslation(lang, "gps.reassuringVoice");
      speakPrompt(voiceText, lang).catch(() => {});
    }
  }, [isOpen, lang]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="surface-raised w-full max-w-lg rounded-3xl border-2 border-emerald-500/40 shadow-2xl overflow-hidden animate-scale-in flex flex-col">
        {/* Calming Top Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center relative">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md mx-auto mb-3 flex items-center justify-center shadow-inner">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-wide">
            {getTranslation(lang, "gps.reassuringTitle")}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xs mx-auto leading-relaxed">
            {getTranslation(lang, "gps.reassuringVoice")}
          </p>
        </div>

        {/* Direction & Distance Body */}
        <div className="p-6 sm:p-7 flex flex-col items-center text-center space-y-6">
          {/* Compass Directional Pointer */}
          <div className="relative flex items-center justify-center">
            {/* Outer pulsating ring */}
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-dashed border-emerald-500/30 flex items-center justify-center animate-spin-slow bg-emerald-500/5">
              <div className="absolute top-2 text-[11px] font-black text-emerald-600 dark:text-emerald-400 tracking-wider">
                HOME
              </div>
            </div>

            {/* Rotating Arrow Indicator */}
            <div
              className="absolute w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center transition-transform duration-700 ease-out"
              style={{ transform: `rotate(${bearingDegrees}deg)` }}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-glow">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </div>
            </div>
          </div>

          <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            {getTranslation(lang, "gps.followArrow")}
          </p>

          {/* Distance Badge */}
          <div className="surface-overlay px-6 py-4 rounded-2xl border border-[var(--border)] shadow-sm w-full">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block">
              {getTranslation(lang, "gps.distanceToHome")}
            </span>
            <div className="text-3xl font-black text-[var(--text-primary)] mt-1 font-mono">
              {distanceMeters !== null ? `${distanceMeters} m` : "Calculating..."}
            </div>
            {homeAddress && (
              <p className="text-xs text-[var(--text-secondary)] mt-1 flex items-center justify-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{homeAddress}</span>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3 pt-2">
            {/* Quick Call Button */}
            <a
              href={`tel:${caregiverPhone}`}
              className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-black text-base shadow-lg shadow-amber-500/20 flex items-center justify-center gap-3 transition-all"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>{getTranslation(lang, "gps.callCaregiver")}</span>
            </a>

            {/* I am safe now close button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-6 rounded-2xl surface-overlay hover:border-emerald-500 text-[var(--text-secondary)] hover:text-emerald-600 font-bold text-sm border border-[var(--border)] transition-all"
            >
              {getTranslation(lang, "gps.imSafeNow")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
