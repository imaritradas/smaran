"use client";

import React, { useState } from "react";
import { CognitiveVerdict } from "@/lib/types";

interface CognitiveVerdictCardProps {
  verdict: CognitiveVerdict | null;
  patientName?: string;
  patientId?: string;
  onApplyRecommendation?: (title: string, action: string) => void;
}

export default function CognitiveVerdictCard({
  verdict,
  patientName = "Patient",
  patientId,
  onApplyRecommendation,
}: CognitiveVerdictCardProps) {
  const [appliedCategory, setAppliedCategory] = useState<string | null>(null);

  if (!verdict) return null;

  const getRiskBadge = () => {
    switch (verdict.riskLevel) {
      case "Low":
        return {
          bg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          icon: "🛡️",
          label: "Low Risk • Resilient Trajectory",
        };
      case "Moderate":
        return {
          bg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
          icon: "⚠️",
          label: "Moderate • Asymmetry Monitored",
        };
      case "Elevated":
        return {
          bg: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse",
          icon: "🚨",
          label: "Elevated Risk • Caregiver Action Advised",
        };
    }
  };

  const riskBadge = getRiskBadge();

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleQuickAddReminder = (rec: CognitiveVerdict["recommendations"][0]) => {
    if (onApplyRecommendation) {
      onApplyRecommendation(rec.title, rec.action);
      setAppliedCategory(rec.title);
      setTimeout(() => setAppliedCategory(null), 3500);
    }
  };

  return (
    <div className="surface-raised rounded-3xl p-6 sm:p-7 border border-[var(--border)] shadow-card space-y-6 animate-fade-in relative overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🩺</span>
            <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">
              Clinical Conclusion & Longitudinal Verdict
            </h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            Synthesized algorithmic assessment across 14-day rolling cognitive windows, session accuracy, and routine adherence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 shadow-sm ${riskBadge.bg}`}>
            <span>{riskBadge.icon}</span>
            <span>{riskBadge.label}</span>
          </span>

          <button
            type="button"
            onClick={handlePrint}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl surface-overlay border border-[var(--border)] hover:border-sky-400 text-xs font-bold text-[var(--text-secondary)] hover:text-sky-600 dark:hover:text-sky-400 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
            title="Print or Save PDF Report"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </div>

      {/* Executive Verdict Hero Card */}
      <div className="bg-gradient-to-br from-slate-50 via-sky-50/40 to-slate-100 dark:from-slate-900/90 dark:via-sky-950/30 dark:to-slate-900/90 p-5 sm:p-6 rounded-3xl border border-sky-200/60 dark:border-sky-800/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              Executive Clinical Assessment &bull; {patientName} ({patientId || "Patient"})
            </span>
            <span className="text-[11px] text-[var(--text-muted)] font-semibold">
              Assessed: {new Date(verdict.lastAssessedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

          <h4 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] leading-snug">
            {verdict.verdictTitle}
          </h4>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed pt-1">
            {verdict.summary}
          </p>
        </div>

        {/* Overall Score Dial Badge */}
        <div className="surface-raised p-4 sm:p-5 rounded-2xl border border-[var(--border)] shadow-md flex flex-col items-center justify-center text-center shrink-0 w-full md:w-44">
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] mb-1">
            Composite Wellness Index
          </span>
          <div className="flex items-baseline gap-1 my-0.5">
            <span className="text-4xl font-black text-[var(--text-primary)] dark:text-white tracking-tight">
              {verdict.overallScore}
            </span>
            <span className="text-xs font-bold text-[var(--text-muted)]">/ 100</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold mt-1">
            <span className="text-[var(--text-muted)]">Baseline: {verdict.overallBaseline}%</span>
            <span
              className={`px-1.5 py-0.2 rounded font-black text-[11px] ${
                verdict.overallChangePct > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : verdict.overallChangePct === 0
                    ? "text-sky-600 dark:text-sky-400"
                    : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {verdict.overallChangePct > 0 ? `+${verdict.overallChangePct}%` : `${verdict.overallChangePct}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Key Findings vs Prescriptive Action Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Key Findings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
              <span>Domain Performance Analysis</span>
            </h5>
            <span className="text-[11px] text-[var(--text-muted)] font-bold">4 Tracked Domains</span>
          </div>

          <div className="space-y-2.5">
            {verdict.keyFindings.map((finding) => (
              <div
                key={finding.domain}
                className={`p-3.5 rounded-2xl border transition-colors ${
                  finding.positive
                    ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30"
                    : "bg-slate-50/70 dark:bg-slate-900/60 border-[var(--border)]"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5 shrink-0">
                    {finding.positive ? "🟢" : "⚠️"}
                  </span>
                  <div>
                    <h6 className="text-xs font-black text-[var(--text-primary)]">
                      {finding.domain}
                    </h6>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                      {finding.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prescriptive Caregiver Action Plan */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
              <span>Prescriptive Caregiver Action Plan</span>
            </h5>
            <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
              Evidence-Based Steps
            </span>
          </div>

          <div className="space-y-3">
            {verdict.recommendations.map((rec, idx) => (
              <div
                key={rec.title}
                className="p-4 rounded-2xl surface-overlay border border-[var(--border)] shadow-sm space-y-2 relative"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h6 className="text-xs font-black text-[var(--text-primary)]">
                      {rec.title}
                    </h6>
                  </div>

                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full surface border border-[var(--border)] text-[var(--text-muted)]">
                    {rec.category}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed pl-8">
                  {rec.action}
                </p>

                {onApplyRecommendation && (
                  <div className="pl-8 pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleQuickAddReminder(rec)}
                      className="text-[11px] font-extrabold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <span>+ Schedule Routine Reminder for this</span>
                    </button>

                    {appliedCategory === rec.title && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">
                        ✓ Populated into Reminders!
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
