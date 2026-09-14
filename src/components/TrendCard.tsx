"use client";

import React from "react";
import { TrendMetric } from "@/lib/types";

interface TrendCardProps {
  metric: TrendMetric;
}

export default function TrendCard({ metric }: TrendCardProps) {
  const directionIcon =
    metric.direction === "up"
      ? "↑"
      : metric.direction === "down"
        ? "↓"
        : metric.direction === "flat"
          ? "→"
          : "—";

  // Vibrant, high-contrast colors in both light and dark mode
  const isDeclining = metric.direction === "down" && metric.changePct !== null && metric.changePct < 0;
  const isImproving = metric.direction === "up" && metric.changePct !== null && metric.changePct > 0;

  let badgeColor = "bg-slate-100 dark:bg-slate-800/80 text-[var(--text-muted)] border-slate-200 dark:border-slate-700";
  if (isDeclining) {
    badgeColor = "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
  } else if (isImproving) {
    badgeColor = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  } else if (metric.direction === "flat") {
    badgeColor = "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30";
  }

  // Ring stroke color based on score magnitude
  let ringStrokeColor = "stroke-sky-500 dark:stroke-sky-400";
  if (metric.score >= 80) {
    ringStrokeColor = "stroke-emerald-500 dark:stroke-emerald-400";
  } else if (metric.score < 50) {
    ringStrokeColor = "stroke-rose-500 dark:stroke-rose-400";
  }

  // SVG circle math for the score ring
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, metric.score));
  const offset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="surface-raised p-6 rounded-3xl border border-[var(--border)] shadow-card flex flex-col items-center gap-3.5 transition-all hover:shadow-card-hover hover:border-sky-400/40 animate-fade-in group">
      <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[var(--text-secondary)] dark:text-sky-300/90 text-center">
        {metric.label}
      </h3>

      {/* Score ring with clear contrast in both light & dark mode */}
      <div className="relative w-28 h-28 flex items-center justify-center my-1">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          {/* Background track circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            className="stroke-sky-100 dark:stroke-sky-950/80"
            strokeWidth="9"
          />
          {/* Active score circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            className={`transition-all duration-700 ease-out ${ringStrokeColor}`}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>

        {/* Big high-contrast numeric score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] dark:text-white tracking-tight drop-shadow-sm">
            {clampedScore}
          </span>
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider -mt-1">
            score
          </span>
        </div>
      </div>

      {/* Change / Trend indicator badge */}
      <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-colors ${badgeColor}`}>
        <span className="text-sm font-extrabold">{directionIcon}</span>
        {metric.changePct !== null ? (
          <span>
            {metric.changePct > 0 ? "+" : ""}
            {metric.changePct}% vs baseline
          </span>
        ) : (
          <span className="font-semibold">No baseline</span>
        )}
      </div>
    </div>
  );
}
