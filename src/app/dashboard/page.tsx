"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Patient, SupportedLanguage } from "@/lib/types";

export default function CaregiverDashboardPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCodeBanner, setSuccessCodeBanner] = useState<{
    name: string;
    code: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    caregiverPhone: "+91 98000 00000",
    preferredLanguage: "as" as SupportedLanguage,
  });

  const loadPatients = useCallback(async () => {
    try {
      const caregiverId =
        (typeof window !== "undefined" &&
          localStorage.getItem("smaran_caregiver_id")) ||
        "cg_default";
      const res = await fetch(`/api/patients?caregiverId=${caregiverId}`);
      const data = await res.json();
      if (res.ok && data.patients && data.patients.length > 0) {
        setPatients(data.patients);
      }
    } catch (err) {
      console.error("Failed to load patients:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();

    // Listen for cross-tab sync events
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel("smaran_sync");
      channel.onmessage = (event) => {
        if (event.data?.type === "PATIENT_CREATED" || event.data?.type === "SESSION_SYNCED") {
          loadPatients();
        }
      };
      return () => channel.close();
    }
  }, [loadPatients]);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage("Please provide the patient's full name.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const caregiverId =
        (typeof window !== "undefined" &&
          localStorage.getItem("smaran_caregiver_id")) ||
        "cg_default";

      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          caregiverId,
          caregiverPhone: formData.caregiverPhone.trim(),
          preferredLanguage: formData.preferredLanguage,
        }),
      });

      const data = await res.json();

      if (res.ok && data.patient) {
        setPatients((prev) => [data.patient, ...prev.filter((p) => p.id !== data.patient.id)]);
        setShowAddModal(false);
        setSuccessCodeBanner({
          name: data.patient.name,
          code: data.patient.pairingCode,
        });
        setFormData({
          name: "",
          caregiverPhone: "+91 98000 00000",
          preferredLanguage: "as",
        });

        // Broadcast to other tabs
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const channel = new BroadcastChannel("smaran_sync");
          channel.postMessage({ type: "PATIENT_CREATED", patient: data.patient });
          channel.close();
        }
      } else {
        setErrorMessage(data.error || "Failed to register patient. Please try again.");
      }
    } catch (err) {
      console.error("Failed to add patient", err);
      setErrorMessage("Network or server connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
    as: "Assamese (অসমীয়া)",
    brx: "Bodo (बड़ो)",
    kha: "Khasi",
    en: "English",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner Alert on Successful Patient Registration */}
      {successCodeBanner && (
        <div className="p-5 rounded-3xl blue-gradient text-white shadow-glow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-scale-in">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-white/90">
                Patient <span className="font-bold">{successCodeBanner.name}</span> registered successfully!
              </p>
              <p className="text-sm font-bold text-white">
                Share Pairing Code: <span className="text-xl tracking-widest font-black underline decoration-2">{successCodeBanner.code}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setSuccessCodeBanner(null)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl transition-all self-end sm:self-auto"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 surface-raised p-6 rounded-3xl border border-[var(--border)] shadow-card">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Caregiver Overview
          </h2>
          <p className="text-[var(--text-secondary)] text-sm">
            Monitored elderly individuals, 6-digit patient pairing codes, and live sync status.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMessage(null);
            setShowAddModal(true);
          }}
          className="py-3 px-5 blue-gradient hover:shadow-glow text-white font-bold text-sm rounded-2xl shadow-card transition-all active:scale-95 flex items-center gap-2 self-start sm:self-auto"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Patient Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            Registered Patients ({patients.length})
          </h3>
          <span className="text-xs text-[var(--text-muted)] font-medium">Real-time synced</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[var(--text-secondary)]">Loading registered patients...</div>
        ) : patients.length === 0 ? (
          <div className="surface p-12 text-center rounded-3xl border border-[var(--border)] space-y-3">
            <p className="text-base font-semibold text-[var(--text-primary)]">No patients registered yet</p>
            <p className="text-xs text-[var(--text-muted)]">Click &quot;Register New Patient&quot; above to create a profile and generate a 6-digit pairing code.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {patients.map((pat) => (
              <div
                key={pat.id}
                className="surface-raised rounded-3xl p-6 border border-[var(--border)] shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-xl font-bold text-[var(--text-primary)]">
                        {pat.name}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                        Language:{" "}
                        <span className="font-bold text-sky-600 dark:text-sky-400">
                          {LANGUAGE_NAMES[pat.preferredLanguage] || pat.preferredLanguage}
                        </span>
                      </p>
                    </div>

                    <span className="px-3 py-1 bg-sky-500/15 text-sky-600 dark:text-sky-400 text-xs font-bold rounded-full border border-sky-500/20">
                      Active
                    </span>
                  </div>

                  {/* 6-Digit Pairing Code Display */}
                  <div className="surface-overlay p-4 rounded-2xl border border-[var(--border)] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider block">
                        Patient Pairing Code
                      </span>
                      <span className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 tracking-widest">
                        {pat.pairingCode}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[var(--text-muted)] font-bold block">
                        SMS Alert Mobile
                      </span>
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {pat.caregiverPhone || "Not set"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-wrap gap-2.5 border-t border-[var(--border)]">
                  <Link
                    href={`/dashboard/patients/${pat.id}`}
                    className="flex-1 py-3 px-4 blue-gradient hover:shadow-glow text-white font-bold text-xs rounded-2xl text-center transition-all flex items-center justify-center gap-2"
                  >
                    <span>View Trends & Activity</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </Link>

                  <Link
                    href={`/dashboard/patients/${pat.id}/family-setup`}
                    className="py-3 px-4 surface-overlay hover:border-sky-400 text-[var(--text-primary)] font-bold text-xs rounded-2xl text-center border border-[var(--border)] transition-colors"
                  >
                    Family Photos
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="surface rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[var(--border)] animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">
                Register New Patient
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full surface-overlay text-[var(--text-secondary)] font-bold flex items-center justify-center hover:border-sky-400 border border-[var(--border)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleAddPatient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Rongmon Deka"
                  className="w-full px-4 py-3 rounded-2xl surface-overlay border border-[var(--border)] focus:border-sky-400 focus:outline-none text-sm text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Primary Regional Language
                </label>
                <select
                  value={formData.preferredLanguage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferredLanguage: e.target.value as SupportedLanguage,
                    })
                  }
                  className="w-full px-4 py-3 rounded-2xl surface-overlay border border-[var(--border)] focus:border-sky-400 focus:outline-none text-sm text-[var(--text-primary)] cursor-pointer"
                >
                  <option value="as">Assamese (অসমীয়া)</option>
                  <option value="brx">Bodo (बड़ो)</option>
                  <option value="kha">Khasi</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Caregiver Mobile / SMS Alert Number
                </label>
                <input
                  type="tel"
                  value={formData.caregiverPhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      caregiverPhone: e.target.value,
                    })
                  }
                  placeholder="+91 98000 00000"
                  className="w-full px-4 py-3 rounded-2xl surface-overlay border border-[var(--border)] focus:border-sky-400 focus:outline-none text-sm text-[var(--text-primary)]"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 blue-gradient hover:shadow-glow disabled:opacity-50 text-white font-bold rounded-2xl shadow-card text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Creating Patient & Generating Code...</span>
                    </>
                  ) : (
                    <span>Create Patient & Generate 6-Digit Code</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
