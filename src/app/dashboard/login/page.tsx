"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CaregiverLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("caregiver@smaran.org");
  const [password, setPassword] = useState("smaran2026");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Save auth session locally for zero-cost demo
    if (typeof window !== "undefined") {
      localStorage.setItem("smaran_caregiver_email", email);
      localStorage.setItem("smaran_caregiver_id", `cg_${Buffer.from(email).toString("base64").slice(0, 10)}`);
    }

    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-8">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-card border border-sand-200">
        <div className="w-16 h-16 bg-navy-900 text-coral-500 rounded-2xl flex items-center justify-center text-3xl font-black mx-auto mb-6 shadow-md">
          स्म
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-navy-900 text-center mb-2">
          {isRegistering ? "Create Caregiver Account" : "Caregiver Portal"}
        </h2>
        <p className="text-navy-600 text-sm text-center mb-6">
          Access patient trends, longitudinal decline alerts, and configure family memory albums.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="caregiver@smaran.org"
              className="w-full px-4 py-3 rounded-xl bg-sand-50 border-2 border-sand-300 focus:border-coral-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-coral-100 transition-all text-navy-900 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-sand-50 border-2 border-sand-300 focus:border-coral-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-coral-100 transition-all text-navy-900 text-sm font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-coral-500 hover:bg-coral-600 disabled:opacity-50 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-98"
          >
            {loading ? "Signing in..." : isRegistering ? "Register Account" : "Sign In to Dashboard"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-sand-200 text-center space-y-3">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-xs font-bold text-navy-700 hover:text-coral-600"
          >
            {isRegistering
              ? "Already have an account? Sign In"
              : "Need a new account? Register"}
          </button>

          <div>
            <Link
              href="/patient"
              className="text-xs font-semibold text-coral-600 hover:underline block"
            >
              Go to Patient Game Hub →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
