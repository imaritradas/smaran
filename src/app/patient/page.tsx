"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PatientPairingPage() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedId = localStorage.getItem("smaran_patient_id");
      if (storedId) {
        router.push("/patient/home");
      }
    }
  }, [router]);

  const handleDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...digits];
    newDigits[index] = val.slice(-1);
    setDigits(newDigits);
    setError(null);

    if (val && index < 5) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`digit-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePair = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit pairing code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/patients?code=${code}`);
      const data = await res.json();

      if (!res.ok || !data.patient) {
        setError(data.error || "No patient found for this 6-digit code. Please check with your caregiver.");
        return;
      }

      localStorage.setItem("smaran_patient_id", data.patient.id);
      localStorage.setItem("smaran_patient_code", code);
      localStorage.setItem("smaran_patient_name", data.patient.name);
      if (data.patient.preferredLanguage) {
        localStorage.setItem("smaran_lang", data.patient.preferredLanguage);
      }
      if (data.patient.photoUrl) {
        localStorage.setItem("smaran_patient_photo", data.patient.photoUrl);
      }

      // Broadcast pairing
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const channel = new BroadcastChannel("smaran_sync");
        channel.postMessage({ type: "PATIENT_PAIRED", patient: data.patient });
        channel.close();
      }

      router.push("/patient/home");
    } catch {
      setError("Unable to connect to server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-6 text-center animate-fade-in">
      <div className="w-full max-w-md surface rounded-3xl p-8 shadow-card border border-[var(--border)] relative overflow-hidden">
        {/* Soft top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-2 blue-gradient" />

        <div className="w-16 h-16 blue-gradient text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
          Enter Your Code
        </h2>
        <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
          Ask your caregiver or family member for your 6-digit pairing code.
        </p>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold leading-relaxed animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handlePair} className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-3">
            {digits.map((d, i) => (
              <input
                key={i}
                id={`digit-${i}`}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-bold text-[var(--text-primary)] surface-overlay border-2 border-[var(--border)] rounded-2xl focus:border-sky-400 focus:bg-[var(--surface)] focus:outline-none focus:ring-4 focus:ring-sky-400/20 transition-all shadow-inner-soft"
                autoFocus={i === 0}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || digits.join("").length !== 6}
            className="w-full py-4 blue-gradient disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-2xl shadow-card hover:shadow-glow transition-all active:scale-[0.98]"
          >
            {loading ? "Connecting..." : "Start Using Smaran"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-col items-center gap-2">
          <p className="text-xs text-[var(--text-muted)]">
            Caregiver looking to register or view codes?
          </p>
          <Link
            href="/dashboard"
            className="text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline underline-offset-4"
          >
            Open Caregiver Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
