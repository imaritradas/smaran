"use client";

import { SupportedLanguage } from "@/lib/types";

interface LanguageButtonProps {
  code: SupportedLanguage;
  nativeLabel: string;
  englishLabel: string;
  selected: boolean;
  onSelect: (code: SupportedLanguage) => void;
}

export default function LanguageButton({
  code,
  nativeLabel,
  englishLabel,
  selected,
  onSelect,
}: LanguageButtonProps) {
  return (
    <button
      onClick={() => onSelect(code)}
      className={`tap-target w-full px-8 py-6 rounded-2xl text-center transition-all border-2 ${
        selected
          ? "bg-amber text-white border-amber shadow-lg shadow-amber/20 scale-[1.03]"
          : "bg-white text-ink border-sage/30 hover:border-sage hover:bg-sage/5"
      }`}
    >
      <span className="block text-2xl font-bold">{nativeLabel}</span>
      {nativeLabel !== englishLabel && (
        <span className={`block text-sm mt-1 ${selected ? "text-white/70" : "text-ink/50"}`}>
          {englishLabel}
        </span>
      )}
    </button>
  );
}
