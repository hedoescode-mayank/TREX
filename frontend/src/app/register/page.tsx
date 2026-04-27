"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import HexGridBackground from "@/components/HexGridBackground";
import { useAuth } from "@/components/AuthContext";
import Link from "next/link";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { signupWithEmail } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation: Gmail format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid @gmail.com address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setSubmitting(true);
    try {
      await signupWithEmail(email, password, name);
      router.push("/city");
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
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
          <p className="text-[11px] font-bold tracking-widest text-blue-600 uppercase mb-2">Join</p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-2">Start your career intelligence journey</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="Aarav Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-800"
              required
            />
          </div>

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
            {submitting ? "Creating account..." : "Start Experience"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </main>
    </div>
  );
}
