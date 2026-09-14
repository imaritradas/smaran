"use client";

import { CaregiverAlert } from "@/lib/types";

interface AlertCardProps {
  alert: CaregiverAlert;
  onAcknowledge: (alertId: string) => void;
}

export default function AlertCard({ alert, onAcknowledge }: AlertCardProps) {
  const timeAgo = getTimeAgo(alert.createdAt);

  return (
    <div
      className={`rounded-xl p-4 border-l-4 transition-all ${
        alert.acknowledged
          ? "border-slate/30 bg-white/50 opacity-60"
          : "border-terracotta bg-terracotta/5 shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {!alert.acknowledged && (
              <span className="inline-block w-2 h-2 rounded-full bg-terracotta animate-pulse-gentle" />
            )}
            <span className="text-xs text-ink/50">{timeAgo}</span>
          </div>
          <p className="text-ink text-sm leading-relaxed">{alert.message}</p>
        </div>
        {!alert.acknowledged && (
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="shrink-0 px-4 py-2 text-xs font-bold rounded-lg bg-ink text-white hover:bg-ink/80 transition-colors"
          >
            Acknowledge
          </button>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
