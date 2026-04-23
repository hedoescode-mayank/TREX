"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import HexGridBackground from "@/components/HexGridBackground";
import { useAuth } from "@/components/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { loginWithEmail } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation: Gmail format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid @gmail.com address.");
      return;
    }

    // Validation: Password minimum 6 chars (Firebase minimum)
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
      // Firebase auth state is now set — ProtectedRoute will read it
      router.push("/city");
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        setError("Account not found. Check your email or sign up first.");
      } else if (code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError(err?.message || "Login failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center font-sans text-gray-900 selection:bg-blue-200">
      <HexGridBackground />

      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-start items-center">
        <div
          className="text-2xl font-bold tracking-tighter text-black cursor-pointer"
          onClick={() => router.push("/")}
        >
          trex<span className="text-blue-500">.ai</span>
        </div>
      </nav>

      <main className="relative z-10 p-8 glass rounded-[2rem] shadow-2xl shadow-gray-200/50 max-w-md w-full mx-4 border border-white/50 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-bold tracking-widest text-blue-600 uppercase mb-2">Access</p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Sign In</h1>
          <p className="text-gray-500 text-sm mt-2">Enter your credentials to continue</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              placeholder="you@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-800"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-800"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 btn-premium w-full py-3.5 rounded-xl text-lg font-medium shadow-xl shadow-black/10 hover:-translate-y-0.5 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Signing in..." : "Authenticate"}
          </button>
        </form>
      </main>
    </div>
  );
}
