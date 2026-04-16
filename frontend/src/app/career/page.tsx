import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function CareerMatchmaker() {
  return (
    <div className="relative min-h-screen flex flex-col font-sans text-gray-900 selection:bg-blue-200">
      {/* Dynamic Background Gradients */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#fdfdfd]">
        <div className="absolute top-[-10%] left-[10%] w-[50%] h-[600px] bg-gradient-to-br from-green-100/80 to-emerald-50/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[60%] h-[700px] bg-teal-100/60 rounded-full blur-[140px]" />
      </div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 glass-nav px-6 md:px-12 py-4 flex justify-between items-center transition-all duration-300">
        <Link href="/" className="text-2xl font-bold tracking-tighter text-black">
          trex<span className="text-blue-500">.ai</span>
        </Link>
        <div className="hidden md:flex items-center gap-10 text-[13px] font-semibold text-gray-600 tracking-wide">
          <Link href="/" className="hover:text-black transition">HOME</Link>
          <span className="text-black border-b-2 border-emerald-500 pb-0.5">CAREER AI</span>
        </div>
        <div className="flex gap-4">
          <Link href="/">
            <button className="btn-premium px-6 py-2.5 rounded-full text-sm font-medium">
              Back to Home
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-6">
        <Card className="glass shadow-2xl p-10 mt-10 max-w-lg mx-auto text-center border border-white/40">
          <CardContent className="space-y-6 flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner">
              🚀
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">Career Matchmaker</h1>
            <p className="text-gray-500 text-lg">
              This module is currently in development. Soon you'll be able to map out long-term career paths and find your perfect role.
            </p>
            <Link href="/">
              <button className="mt-8 px-8 py-3 rounded-full bg-gray-900 hover:bg-gray-800 text-white font-medium shadow-xl transition hover:-translate-y-1">
                Return to Dashboard
              </button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
