"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import HexGridBackground from "@/components/HexGridBackground";
import CursorRipple from "@/components/CursorRipple";
import AmbientEffects from "@/components/AmbientEffects";
import FloatingAnalytics from "@/components/FloatingAnalytics";
import { useAuth } from "@/components/AuthContext";
import AuthModal from "@/components/AuthModal";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function Home() {
  const { user, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);

  return (
    <div className="relative min-h-screen flex flex-col font-sans text-gray-900 selection:bg-blue-200">
      <HexGridBackground />
      <AmbientEffects />
      <CursorRipple />
      <FloatingAnalytics />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 glass-nav px-6 md:px-12 py-4 flex justify-between items-center transition-all duration-300">
        <div className="text-2xl font-bold tracking-tighter text-black">
          trex<span className="text-blue-500">.ai</span>
        </div>
        <div className="hidden md:flex items-center gap-12 text-[12px] font-bold text-gray-800 drop-shadow-sm tracking-[0.2em]">
          <a href="#why" className="hover:text-blue-600 transition-colors duration-300">WHY WE EXIST</a>
          <a href="#goal" className="hover:text-blue-600 transition-colors duration-300">GOAL</a>
        </div>
        <div className="flex gap-4 items-center">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Member</span>
                <span className="text-sm font-bold text-black">{user.displayName?.split(' ')[0]}</span>
              </div>
              <button 
                onClick={logout}
                className="px-6 py-2.5 rounded-full text-sm font-medium border border-black/10 hover:bg-black/5 transition-all"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="btn-premium px-6 py-2.5 rounded-full text-sm font-medium"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-48 pb-20 px-6">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center px-5 py-2 rounded-full glass border border-white shadow-sm mb-10"
        >
          <span className="text-sm font-semibold text-blue-600">India's Premier Career Intelligence</span>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center"
        >
          <motion.h1 
            variants={fadeInUp}
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight text-center max-w-5xl leading-[1.05] text-black drop-shadow-md"
          >
            <span className="font-light">AI for your professional</span><br />
            future from India
          </motion.h1>

          <motion.p 
            variants={fadeInUp}
            className="mt-8 text-xl md:text-2xl text-gray-800 drop-shadow-sm text-center max-w-3xl font-medium leading-relaxed"
          >
            Built on sovereign compute. Powered by frontier-class models.<br className="hidden md:block" />
            Delivering perfect context for your life decisions.
          </motion.p>

          <motion.div 
            variants={fadeInUp}
            className="mt-14"
          >
            <Link href="/city">
              <button className="btn-premium px-10 py-5 rounded-full text-lg font-medium shadow-2xl shadow-black/10">
                Commence Analysis
              </button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature Cards Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mt-32 w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            {
              title: "City Intelligence",
              desc: "Evaluate living costs, tech hubs, and quality of life dynamically across top-tier cities.",
              bg: "from-[#4f7cff] to-[#8c52ff]",
              badge: "City AI",
              href: "/city"
            },
            {
              title: "Resume Optimizer",
              desc: "Tailor your resume instantly against any job description with deep semantic understanding.",
              bg: "from-[#ff9900] to-[#ff5e62]",
              badge: "Resume AI",
              href: "/resume"
            },
            {
              title: "Career Matchmaker",
              desc: "Discover internships, switch careers, and map long-term paths securely.",
              bg: "from-[#11998e] to-[#38ef7d]",
              badge: "Action Engine",
              href: "/career"
            }
          ].map((feature, idx) => (
            <Link key={idx} href={feature.href} className="group glass rounded-[2rem] p-2 flex flex-col hover:-translate-y-2 transition-all duration-500 cursor-pointer shadow-xl shadow-gray-200/50">
              <div className="p-8 pb-4 flex-1">
                <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-4 group-hover:text-blue-500 transition-colors">Module</p>
                <h3 className="text-2xl font-semibold mb-3 text-gray-900 group-hover:text-black">{feature.title}</h3>
                <p className="text-gray-500 text-[15px] leading-relaxed">
                  {feature.desc}
                </p>
              </div>
              
              <div className={`h-52 rounded-[1.5rem] m-2 flex items-center justify-center relative overflow-hidden bg-gradient-to-br ${feature.bg} group-hover:brightness-110 transition-all`}>
                 <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]"></div>
                 <div className="absolute w-40 h-40 bg-white/20 rounded-full blur-2xl top-[-20%] left-[-10%] group-hover:scale-125 transition-transform duration-1000"></div>
                 <div className="absolute w-32 h-32 bg-black/10 rounded-full blur-xl bottom-[-10%] right-[-10%]"></div>
                 <div className="glass px-8 py-3 rounded-2xl relative z-10 border border-white/50 backdrop-blur-xl shadow-lg group-hover:scale-105 transition-transform">
                   <h4 className="text-white font-semibold text-lg tracking-wide drop-shadow-sm">{feature.badge}</h4>
                 </div>
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Why We Exist Section */}
        <motion.section 
          id="why" 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-48 w-full max-w-4xl text-center px-6 scroll-mt-32"
        >
          <p className="text-[11px] font-bold tracking-[0.3em] text-emerald-600 drop-shadow-sm uppercase mb-6">Discovery</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-10 tracking-tight text-black drop-shadow-md">Why We Exist</h2>
          <p className="text-xl md:text-2xl text-gray-800 drop-shadow-sm font-medium leading-relaxed">
            Every year, millions of Indian freshers enter the workforce without a clear compass. High relocation costs, misleading job descriptions, and ATS-driven screening create a wall. <br/><br/>
            <span className="text-orange-600 font-semibold italic drop-shadow-md">T.R.E.X was built to tear that wall down.</span> We provide the intelligence needed to make life-changing decisions with data, not just intuition.
          </p>
        </motion.section>

        {/* Goal Section */}
        <motion.section 
          id="goal" 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-48 w-full max-w-4xl text-center px-6 pb-40 scroll-mt-32"
        >
          <p className="text-[11px] font-bold tracking-[0.3em] text-orange-600 drop-shadow-sm uppercase mb-6">Mission</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-10 tracking-tight text-black drop-shadow-md">Our Goal</h2>
          <p className="text-xl md:text-2xl text-gray-800 drop-shadow-sm font-medium leading-relaxed">
            To become the sovereign career operating system for India. By integrating frontier AI models with localized financial data, we aim to eliminate <span className="text-emerald-600 font-semibold italic">"salary blindness"</span> and empower every professional to own their growth trajectory with absolute clarity.
          </p>
        </motion.section>
      </main>
    </div>
  );
}
