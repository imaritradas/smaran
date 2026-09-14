"use client";

import React, { useState } from "react";
import { TrendMetric } from "@/lib/types";

interface TrendCardProps {
  metric: TrendMetric;
}

export default function TrendCard({ metric }: TrendCardProps) {
  const [expanded, setExpanded] = useState(false);

  const baseline = metric.baselineScore ?? 75;
  const current = metric.score;
  const changePct = metric.changePct ?? 0;
  const status = metric.status ?? (current >= 75 ? "optimal" : current >= 55 ? "stable" : "mild_decline");

  // Domain Icons & Descriptions
  const getDomainMeta = (label: string) => {
    switch (label) {
      case "Memory":
        return {
          icon: "🧠",
          testName: "Memory Match",
          metricDesc: "Visual symbol retention & pairs recall",
        };
      case "Attention":
        return {
          icon: "👁️",
          testName: "Spot & Tap",
          metricDesc: "Visual processing speed & motor reaction",
        };
      case "Pattern Recognition":
        return {
          icon: "🧩",
          testName: "Sequence Recall",
          metricDesc: "Sequential auditory-visual working memory",
        };
      case "Routine Recall":
        return {
          icon: "⏰",
          testName: "Routine Ordering",
          metricDesc: "Daily activity sequencing & check-in adherence",
        };
      default:
        return { icon: "📊", testName: "Cognitive Game", metricDesc: "Cognitive domain evaluation" };
    }
  };

  const meta = getDomainMeta(metric.label);

  // Status Styling & Badges
  const getStatusBadge = () => {
    switch (status) {
      case "optimal":
        return {
          label: "Optimal",
          badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          ringColor: "stroke-emerald-500 dark:stroke-emerald-400",
          textColor: "text-emerald-600 dark:text-emerald-400",
          dotColor: "bg-emerald-500",
        };
      case "stable":
        return {
          label: "Stable",
          badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
          ringColor: "stroke-sky-500 dark:stroke-sky-400",
          textColor: "text-sky-600 dark:text-sky-400",
          dotColor: "bg-sky-500",
        };
      case "mild_decline":
        return {
          label: "Mild Decline",
          badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
          ringColor: "stroke-amber-500 dark:stroke-amber-400",
          textColor: "text-amber-600 dark:text-amber-400",
          dotColor: "bg-amber-500",
        };
      case "significant_decline":
        return {
          label: "Decline Alert",
          badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse",
          ringColor: "stroke-rose-500 dark:stroke-rose-400",
          textColor: "text-rose-600 dark:text-rose-400",
          dotColor: "bg-rose-500",
        };
    }
  };

  const statusInfo = getStatusBadge();

  // SVG ring calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const clampedCurrent = Math.max(0, Math.min(100, current));
  const currentOffset = circumference - (clampedCurrent / 100) * circumference;

  const clampedBaseline = Math.max(0, Math.min(100, baseline));
  const baselineOffset = circumference - (clampedBaseline / 100) * circumference;

  // Mini sparkline math
  const history = metric.history && metric.history.length > 1 ? metric.history : [baseline, current];
  const minVal = Math.min(...history, 0);
  const maxVal = Math.max(...history, 100);
  const sparkWidth = 120;
  const sparkHeight = 24;
  const sparkPoints = history
    .map((val, idx) => {
      const x = (idx / (history.length - 1)) * sparkWidth;
      const y = sparkHeight - ((val - minVal) / (maxVal - minVal || 1)) * (sparkHeight - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const isPositiveDelta = changePct > 0;
  const isNeutralDelta = changePct === 0;

  return (
    <div className="surface-raised rounded-3xl p-5 border border-[var(--border)] shadow-card flex flex-col justify-between transition-all hover:shadow-card-hover hover:border-sky-400/50 animate-fade-in group relative overflow-hidden">
      {/* Top Header: Domain Title, Icon & Status Pill */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl p-1.5 rounded-xl surface-overlay border border-[var(--border)] shadow-sm">
              {meta.icon}
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-[var(--text-primary)] leading-tight">
                {metric.label}
              </h3>
              <span className="text-[10px] font-bold text-[var(--text-muted)] block">
                {meta.testName}
              </span>
            </div>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border flex items-center gap-1 shrink-0 ${statusInfo.badgeClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
            {statusInfo.label}
          </span>
        </div>

        {/* Central Visualization: Circular Dial with Baseline Marker */}
        <div className="flex items-center justify-center py-2">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                className="stroke-slate-200/60 dark:stroke-slate-800/80"
                strokeWidth="8"
              />
              {/* Dotted Baseline Reference Ring */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="currentColor"
                className="text-slate-400/50 dark:text-slate-600/70"
                strokeWidth="8"
                strokeDasharray="2, 4"
                strokeDashoffset={baselineOffset}
              />
              {/* Active Current Score Arc */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                className={`transition-all duration-1000 ease-out ${statusInfo.ringColor}`}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={currentOffset}
              />
            </svg>

            {/* Centered Score Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
              <span className="text-3xl font-black text-[var(--text-primary)] dark:text-white tracking-tight leading-none">
                {clampedCurrent}
                <span className="text-sm font-semibold text-[var(--text-muted)]">%</span>
              </span>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                Current
              </span>
            </div>
          </div>
        </div>

        {/* Comparison Gauge: Current vs Baseline Position */}
        <div className="bg-slate-50/80 dark:bg-slate-900/60 p-3 rounded-2xl border border-[var(--border)] space-y-2 mt-1">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-[var(--text-muted)] flex items-center gap-1">
              <span>Baseline:</span>
              <span className="text-[var(--text-primary)] font-black">{baseline}%</span>
            </span>

            {/* Delta vs Baseline Pill */}
            <span
              className={`px-2 py-0.5 rounded-lg text-xs font-black flex items-center gap-0.5 ${
                isPositiveDelta
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : isNeutralDelta
                    ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                    : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
              }`}
            >
              <span>{isPositiveDelta ? "▲ +" : isNeutralDelta ? "■ " : "▼ "}</span>
              <span>{changePct > 0 ? `+${changePct}` : changePct}%</span>
            </span>
          </div>

          {/* Visual Range Position Bar */}
          <div className="space-y-1">
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden">
              {/* Zones: Red (0-45), Yellow (45-70), Green (70-100) */}
              <div className="absolute inset-0 flex">
                <div className="w-[45%] h-full bg-rose-500/20" />
                <div className="w-[25%] h-full bg-amber-500/20" />
                <div className="w-[30%] h-full bg-emerald-500/20" />
              </div>
              {/* Current Position Fill */}
              <div
                className={`h-full transition-all duration-700 rounded-full ${
                  current >= 70 ? "bg-emerald-500" : current >= 50 ? "bg-amber-500" : "bg-rose-500"
                }`}
                style={{ width: `${clampedCurrent}%` }}
              />
              {/* Baseline Indicator Needle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-slate-900 dark:bg-white rounded-full z-10 -ml-0.5 shadow-sm"
                style={{ left: `${clampedBaseline}%` }}
                title={`Intake Baseline: ${baseline}%`}
              />
            </div>
            <div className="flex justify-between text-[9px] font-bold text-[var(--text-muted)] px-0.5">
              <span>0% Critical</span>
              <span className="text-[var(--text-secondary)]">Baseline ({baseline}%)</span>
              <span>100% Optimal</span>
            </div>
          </div>

          {/* Mini Sparkline of Recent Game Sessions */}
          <div className="pt-1 flex items-center justify-between border-t border-[var(--border)]">
            <span className="text-[10px] font-bold text-[var(--text-muted)]">
              {metric.sessionCount || history.length} Sessions
            </span>
            <div className="flex items-center gap-1">
              <svg width={sparkWidth} height={sparkHeight} className="overflow-visible">
                <polyline
                  fill="none"
                  stroke={current >= 70 ? "#10b981" : current >= 50 ? "#f59e0b" : "#f43f5e"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={sparkPoints}
                />
                {history.map((val, i) => {
                  const x = (i / (history.length - 1)) * sparkWidth;
                  const y = sparkHeight - ((val - minVal) / (maxVal - minVal || 1)) * (sparkHeight - 4) - 2;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="2"
                      className={i === history.length - 1 ? "fill-white stroke-sky-500 stroke-2" : "fill-slate-400 dark:fill-slate-600"}
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Expandable Insight Button & Drawer */}
      <div className="mt-3 pt-2 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left flex items-center justify-between text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline transition-colors"
        >
          <span>{expanded ? "Hide Clinical Insight" : "View Domain Insight & Analysis"}</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {expanded && (
          <div className="mt-2 p-2.5 bg-sky-50/70 dark:bg-sky-950/40 rounded-xl border border-sky-200/50 dark:border-sky-900/40 text-[11px] text-[var(--text-secondary)] leading-relaxed animate-fade-in">
            <p className="font-semibold text-[var(--text-primary)] mb-1">
              {meta.metricDesc}
            </p>
            <p>{metric.insight || `Currently standing at ${current}% against an established baseline of ${baseline}%.`}</p>
          </div>
        )}
      </div>
    </div>
  );
}

