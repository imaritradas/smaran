"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Disclaimer from "@/components/Disclaimer";
import { initClientAuth } from "@/lib/firebase";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (pathname === "/dashboard/login") return;

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("smaran_caregiver_email");
      if (!stored) {
        router.push("/dashboard/login");
      } else {
        setUserEmail(stored);
      }
      initClientAuth();

      const theme = localStorage.getItem("smaran_theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(theme === "dark" || (!theme && prefersDark));
    }
  }, [pathname, router]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("smaran_theme", next ? "dark" : "light");
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("smaran_caregiver_email");
      localStorage.removeItem("smaran_caregiver_id");
      router.push("/dashboard/login");
    }
  };

  const isLoginPage = pathname === "/dashboard/login";
  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : "C";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
      {/* Top Navbar */}
      <header className="bg-navy-900 dark:bg-navy-950 text-white border-b border-navy-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sage to-eucalyptus flex items-center justify-center text-white font-bold text-sm shadow-card group-hover:shadow-glow transition-shadow">
              S
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white block leading-none">
                Smaran
              </span>
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                Caregiver Portal
              </span>
            </div>
          </Link>

          {!isLoginPage && (
            <div className="flex items-center gap-3">
              {userEmail && (
                <div className="hidden sm:flex items-center gap-2 text-xs text-white/60 bg-navy-800 px-3 py-1.5 rounded-full border border-navy-700">
                  <div className="w-5 h-5 rounded-full bg-sage/30 flex items-center justify-center text-[10px] font-bold text-sage">
                    {initial}
                  </div>
                  {userEmail}
                </div>
              )}

              <Link
                href="/patient"
                target="_blank"
                className="text-xs font-bold bg-navy-800 hover:bg-navy-700 text-white/70 hover:text-white px-3 py-1.5 rounded-lg border border-navy-700 transition-colors"
              >
                Patient View
              </Link>

              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
                className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center border border-navy-700 hover:border-sage/50 transition-colors text-white/60 hover:text-white"
              >
                {isDark ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="text-xs font-bold text-terracotta-300 hover:text-terracotta-200 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <Disclaimer />
        </div>
        {children}
      </main>

      <footer className="surface border-t border-[var(--border)] py-5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[var(--text-muted)]">
          <p>2026 Smaran — Built for Smart India Hackathon (SIH26003)</p>
          <p className="font-medium">
            North Eastern Region Cognitive Assistance and Monitoring
          </p>
        </div>
      </footer>
    </div>
  );
}
