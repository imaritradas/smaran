"use client";

import Link from "next/link";
import { GameType } from "@/lib/types";

interface GameTileProps {
  gameType: GameType;
  label: string;
  href: string;
  icon?: string;
}

const GAME_STYLES: Record<GameType, { bg: string; iconBg: string; description: string }> = {
  "memory-match":    { bg: "bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 dark:from-sky-500 dark:via-sky-600 dark:to-blue-700", iconBg: "bg-white/20 backdrop-blur-sm", description: "Find matching pairs of symbols" },
  "spot-and-tap":    { bg: "bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 dark:from-amber-500 dark:via-orange-500 dark:to-amber-600", iconBg: "bg-white/20 backdrop-blur-sm", description: "Focus and tap the target quickly" },
  "sequence-recall": { bg: "bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-600 dark:from-violet-500 dark:via-purple-600 dark:to-indigo-700", iconBg: "bg-white/20 backdrop-blur-sm", description: "Remember and repeat the pattern" },
  "routine-recall":  { bg: "bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 dark:from-emerald-500 dark:via-teal-600 dark:to-cyan-700", iconBg: "bg-white/20 backdrop-blur-sm", description: "Order your daily activities" },
  "family-faces":    { bg: "bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-600 dark:from-rose-500 dark:via-pink-600 dark:to-fuchsia-700", iconBg: "bg-white/20 backdrop-blur-sm", description: "Recognize your dear family" },
};

function GameIcon({ gameType }: { gameType: GameType }) {
  const cls = "w-7 h-7 text-white";
  switch (gameType) {
    case "memory-match":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
    case "spot-and-tap":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
    case "sequence-recall":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
    case "routine-recall":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case "family-faces":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  }
}

export default function GameTile({ gameType, label, href }: GameTileProps) {
  const style = GAME_STYLES[gameType];
  return (
    <Link
      href={href}
      className={`${style.bg} text-white p-5 rounded-3xl shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] flex items-center gap-4 group relative overflow-hidden`}
    >
      {/* Subtle decorative circle */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/[0.07]" />
      <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/[0.04]" />

      <div className={`shrink-0 w-12 h-12 rounded-2xl ${style.iconBg} flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 group-hover:scale-110 shadow-sm`}>
        <GameIcon gameType={gameType} />
      </div>
      <div className="flex-1 min-w-0 relative z-10">
        <span className="text-[15px] font-bold leading-tight block">{label}</span>
        <span className="text-[11px] text-white/70 font-medium mt-0.5 block">{style.description}</span>
      </div>
      {/* Arrow indicator */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all duration-300 shrink-0 relative z-10">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </Link>
  );
}
