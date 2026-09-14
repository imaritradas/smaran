"use client";

import Link from "next/link";
import { GameType } from "@/lib/types";

interface GameTileProps {
  gameType: GameType;
  label: string;
  href: string;
  icon?: string;
}

const GAME_STYLES: Record<GameType, { bg: string; iconBg: string }> = {
  "memory-match":    { bg: "bg-gradient-to-br from-sky-400 to-sky-500 dark:from-sky-600 dark:to-sky-700", iconBg: "bg-white/20" },
  "spot-and-tap":    { bg: "bg-gradient-to-br from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-600", iconBg: "bg-white/20" },
  "sequence-recall": { bg: "bg-gradient-to-br from-violet-400 to-violet-500 dark:from-violet-600 dark:to-violet-700", iconBg: "bg-white/20" },
  "routine-recall":  { bg: "bg-gradient-to-br from-sage-400 to-sage-500 dark:from-sage-600 dark:to-sage-700", iconBg: "bg-white/20" },
  "family-faces":    { bg: "bg-gradient-to-br from-rose-400 to-rose-500 dark:from-rose-600 dark:to-rose-700", iconBg: "bg-white/20" },
};

function GameIcon({ gameType }: { gameType: GameType }) {
  const cls = "w-8 h-8 text-white/90";
  switch (gameType) {
    case "memory-match":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
    case "spot-and-tap":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
    case "sequence-recall":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
    case "routine-recall":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case "family-faces":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  }
}

export default function GameTile({ gameType, label, href }: GameTileProps) {
  const style = GAME_STYLES[gameType];
  return (
    <Link
      href={href}
      className={`${style.bg} text-white p-4 rounded-2xl shadow-card hover:shadow-card-hover transition-all hover:-translate-y-0.5 hover:scale-[1.01] flex items-center gap-4 group`}
    >
      <div className={`shrink-0 w-11 h-11 rounded-xl ${style.iconBg} flex items-center justify-center group-hover:bg-white/30 transition-colors`}>
        <GameIcon gameType={gameType} />
      </div>
      <span className="text-sm font-semibold leading-tight">{label}</span>
    </Link>
  );
}
