"use client";

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

  const directionColor =
    metric.direction === "up"
      ? "text-sage"
      : metric.direction === "down"
        ? "text-terracotta"
        : "text-slate";

  const ringColor =
    metric.direction === "down"
      ? "stroke-terracotta"
      : "stroke-sage";

  // SVG circle math for the score ring
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (metric.score / 100) * circumference;

  return (
    <div className="glass-card p-6 flex flex-col items-center gap-3 animate-slide-up">
      <h3 className="text-ink font-bold text-sm uppercase tracking-wider">
        {metric.label}
      </h3>

      {/* Score ring */}
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(29, 59, 54, 0.1)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            className={`score-ring ${ringColor}`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-ink">
          {metric.score}
        </span>
      </div>

      {/* Change indicator */}
      <div className={`flex items-center gap-1 text-lg font-semibold ${directionColor}`}>
        <span className="text-xl">{directionIcon}</span>
        {metric.changePct !== null ? (
          <span>{metric.changePct > 0 ? "+" : ""}{metric.changePct}%</span>
        ) : (
          <span className="text-sm text-slate/60">No baseline</span>
        )}
      </div>
    </div>
  );
}
