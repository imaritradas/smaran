"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import OfflineIndicator from "@/components/OfflineIndicator";
import { initClientAuth } from "@/lib/firebase";
import { syncPendingSessions } from "@/lib/offlineStore";

const NAV_ITEMS = [
  {
    href: "/patient/home",
    label: "Home",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: "/patient/games/memory-match",
    label: "Memory Match",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    href: "/patient/games/spot-and-tap",
    label: "Spot and Tap",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    ),
  },
  {
    href: "/patient/games/sequence-recall",
    label: "Sequence Recall",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13"/>
        <circle cx="6" cy="18" r="3"/>
        <circle cx="18" cy="16" r="3"/>
      </svg>
    ),
  },
  {
    href: "/patient/games/routine-recall",
    label: "Routine Recall",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    href: "/patient/games/family-faces",
    label: "Family Faces",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [syncedCount, setSyncedCount] = useState<number | null>(null);
  const [patientName, setPatientName] = useState("");
  const [patientPhoto, setPatientPhoto] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      initClientAuth();
      const storedName = localStorage.getItem("smaran_patient_name") || "";
      const storedPhoto = localStorage.getItem("smaran_patient_photo") || null;
      setPatientName(storedName);
      setPatientPhoto(storedPhoto);

      const theme = localStorage.getItem("smaran_theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(theme === "dark" || (!theme && prefersDark));
    }

    const doSync = async () => {
      if (typeof window !== "undefined" && navigator.onLine) {
        try {
          const pid = localStorage.getItem("smaran_patient_id");
          if (pid) {
            const count = await syncPendingSessions(pid);
            if (count > 0) {
              setSyncedCount(count);
              setTimeout(() => setSyncedCount(null), 4000);
            }
          }
        } catch { /* silent */ }
      }
    };
    doSync();
    window.addEventListener("online", doSync);
    return () => window.removeEventListener("online", doSync);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("smaran_theme", next ? "dark" : "light");
  };

  const initial = patientName ? patientName.trim().charAt(0).toUpperCase() : "S";
  const isOnboardingPage = pathname === "/patient" || pathname === "/patient/language";

  // On onboarding pages (pairing/language), show simple clean header with avatar linking to home
  if (isOnboardingPage) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col text-[var(--foreground)] bg-radial-glow">
        <header className="px-4 sm:px-6 py-3 flex items-center justify-between border-b border-[var(--border)] surface sticky top-0 z-30">
          <Link href="/patient/home" className="flex items-center gap-3 group" title="Smaran Home">
            <div className="w-9 h-9 rounded-xl blue-gradient flex items-center justify-center text-white font-bold text-sm shadow-card group-hover:scale-105 transition-transform">
              S
            </div>
            <span className="text-lg font-bold text-[var(--text-primary)]">Smaran</span>
          </Link>
          <div className="flex items-center gap-3">
            <OfflineIndicator />
            {/* User profile photo / initial - clicking it opens home page */}
            <Link
              href="/patient/home"
              title="Go to Home"
              className="w-9 h-9 rounded-full overflow-hidden blue-gradient flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-sky-900 shadow-card hover:scale-105 transition-transform"
            >
              {patientPhoto ? (
                <img src={patientPhoto} alt={patientName || "Patient"} className="w-full h-full object-cover" />
              ) : (
                <span>{initial}</span>
              )}
            </Link>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-8 h-8 rounded-full surface-overlay flex items-center justify-center border border-[var(--border)] hover:border-sky-400 transition-colors text-[var(--text-muted)]"
            >
              {isDark ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
          </div>
        </header>
        <main className="flex-1 max-w-lg w-full mx-auto p-4 sm:p-6 flex flex-col">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex bg-radial-glow">
      {/* ── LEFT SIDEBAR (desktop) ── */}
      <aside className="hidden md:flex md:w-64 lg:w-72 flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)] shadow-sidebar fixed top-0 left-0 bottom-0 z-40">
        {/* Brand Header */}
        <div className="px-5 py-5 border-b border-[var(--border)]">
          <Link href="/patient/home" className="flex items-center gap-3 group" title="Smaran Home">
            <div className="w-10 h-10 rounded-xl blue-gradient flex items-center justify-center text-white font-bold shadow-glow text-lg group-hover:scale-105 transition-transform">
              S
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)] leading-none">Smaran</h1>
              <span className="text-[10px] text-[var(--text-muted)] font-medium tracking-wide">Cognitive Companion</span>
            </div>
          </Link>
        </div>

        {/* User Profile Card - clicking opens home page */}
        <div className="px-4 py-4">
          <Link
            href="/patient/home"
            title="Click to open Home page"
            className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--surface-overlay)] border border-[var(--border)] hover:border-sky-400 hover:shadow-card transition-all group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full overflow-hidden blue-gradient flex items-center justify-center text-white font-bold shadow-card shrink-0 border-2 border-white/80 dark:border-sky-900 group-hover:scale-105 transition-transform">
              {patientPhoto ? (
                <img src={patientPhoto} alt={patientName || "Patient"} className="w-full h-full object-cover" />
              ) : (
                <span className="text-base">{initial}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent)] transition-colors">
                {patientName || "Patient"}
              </p>
              <div className="mt-0.5"><OfflineIndicator /></div>
            </div>
          </Link>
        </div>

        {/* Activities Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Activities</p>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`nav-item ${isActive ? "active" : ""}`}>
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-4 py-4 border-t border-[var(--border)] space-y-2">
          <Link href="/patient/language" className="nav-item w-full">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            <span>Language</span>
          </Link>
          <button onClick={toggleTheme} className="nav-item w-full">
            {isDark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
            <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>

          {syncedCount !== null && (
            <div className="text-xs font-semibold px-3 py-1.5 bg-sky-500/15 text-sky-600 dark:text-sky-400 rounded-lg animate-fade-in text-center">
              Synced {syncedCount} session{syncedCount > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </aside>

      {/* ── MOBILE TOP BAR ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 surface border-b border-[var(--border)]">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 rounded-lg surface-overlay border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] active:scale-95 transition-transform"
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              )}
            </button>
            <Link href="/patient/home" className="flex items-center gap-2" title="Smaran Home">
              <div className="w-8 h-8 rounded-lg blue-gradient flex items-center justify-center text-white font-bold text-sm shadow-card">S</div>
              <span className="font-bold text-[var(--text-primary)]">Smaran</span>
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <OfflineIndicator />
            {/* Mobile profile photo or initial - clicking opens home page */}
            <Link
              href="/patient/home"
              title="Go to Home"
              className="w-9 h-9 rounded-full overflow-hidden blue-gradient flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-sky-900 shadow-card hover:scale-105 active:scale-95 transition-transform"
            >
              {patientPhoto ? (
                <img src={patientPhoto} alt={patientName || "Patient"} className="w-full h-full object-cover" />
              ) : (
                <span>{initial}</span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-[var(--border)] surface px-3 py-3 space-y-1 animate-slide-down shadow-lg">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`nav-item ${isActive ? "active" : ""}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="border-t border-[var(--border)] pt-2 mt-2 space-y-1">
              <Link
                href="/patient/language"
                onClick={() => setMobileMenuOpen(false)}
                className="nav-item"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span>Language</span>
              </Link>
              <button
                onClick={() => {
                  toggleTheme();
                  setMobileMenuOpen(false);
                }}
                className="nav-item w-full"
              >
                {isDark ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                )}
                <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT MAIN CONTENT AREA ── */}
      <main className="flex-1 md:ml-64 lg:ml-72 min-h-screen pt-14 md:pt-0">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
