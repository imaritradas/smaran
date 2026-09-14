import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-950 via-sky-800 to-sky-600 text-white px-6">
      <div className="animate-fade-in text-center max-w-lg">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white/15 border border-white/20 mb-4 animate-glow backdrop-blur-sm">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
              <line x1="10" y1="22" x2="14" y2="22"/>
              <line x1="9" y1="17" x2="15" y2="17"/>
            </svg>
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-2">Smaran</h1>
          <p className="text-sky-200 text-xl font-medium">&#x0938;&#x094D;&#x092E;&#x0930;&#x0923;</p>
          <p className="text-sky-300/70 mt-2 text-lg">Memory and Mind Wellness</p>
        </div>

        <p className="text-white/60 text-base mb-12 leading-relaxed max-w-md mx-auto">
          Cognitive engagement and monitoring for elderly care, designed for India&apos;s North Eastern communities with voice support in Assamese, Bodo, Khasi, and English.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/patient" className="tap-target bg-white text-sky-700 px-8 py-4 rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M17 12h.01"/><path d="M7 12h.01"/></svg>
            I am a Patient
          </Link>
          <Link href="/dashboard/login" className="tap-target bg-white/10 border border-white/25 text-white px-8 py-4 rounded-2xl text-lg font-bold backdrop-blur-sm hover:bg-white/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
            I am a Caregiver
          </Link>
        </div>

        <p className="mt-16 text-white/25 text-xs max-w-sm mx-auto">
          This platform is a cognitive engagement and monitoring tool, not a diagnostic device.
        </p>
      </div>
    </main>
  );
}
