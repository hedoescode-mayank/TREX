import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col font-sans text-gray-900 selection:bg-blue-200">
      {/* Dynamic Background Gradients */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#fdfdfd]">
        <div className="absolute top-[-10%] left-[10%] w-[50%] h-[600px] bg-gradient-to-br from-orange-100/80 to-amber-50/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[60%] h-[700px] bg-blue-100/60 rounded-full blur-[140px]" />
        <div className="absolute top-[20%] right-[-5%] w-[40%] h-[500px] bg-purple-100/50 rounded-full blur-[130px]" />
      </div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 glass-nav px-6 md:px-12 py-4 flex justify-between items-center transition-all duration-300">
        <div className="text-2xl font-bold tracking-tighter text-black">
          trex<span className="text-blue-500">.ai</span>
        </div>
        <div className="hidden md:flex items-center gap-10 text-[13px] font-semibold text-gray-600 tracking-wide">
          <a href="#" className="hover:text-black transition">PLATFORM</a>
          <a href="#" className="hover:text-black transition">AGENTS</a>
          <a href="#" className="hover:text-black transition">RESOURCES</a>
          <a href="#" className="hover:text-black transition">COMPANY</a>
        </div>
        <div className="flex gap-4">
          <button className="hidden md:block px-6 py-2.5 rounded-full text-sm font-medium border border-gray-200 bg-white/50 hover:bg-white transition drop-shadow-sm">
            Talk to Sales
          </button>
          <button className="btn-premium px-6 py-2.5 rounded-full text-sm font-medium">
            Experience T.R.E.X
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-48 pb-20 px-6">
        
        <div className="inline-flex items-center px-5 py-2 rounded-full glass border border-white shadow-sm mb-10">
          <span className="text-sm font-semibold text-blue-600">India's Premier Career Intelligence</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-medium tracking-tight text-center max-w-5xl leading-[1.05] text-gray-900">
          <span className="font-light">AI for your professional</span><br />
          future from India
        </h1>

        <p className="mt-8 text-xl md:text-2xl text-gray-500 text-center max-w-3xl font-light leading-relaxed">
          Built on sovereign compute. Powered by frontier-class models.<br className="hidden md:block" />
          Delivering perfect context for your life decisions.
        </p>

        <div className="mt-14">
          <Link href="/city">
            <button className="btn-premium px-10 py-5 rounded-full text-lg font-medium shadow-2xl shadow-black/10">
              Commence Analysis
            </button>
          </Link>
        </div>

        {/* Feature Cards Section */}
        <div className="mt-32 w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8">
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
            <Link key={idx} href={feature.href} className="glass rounded-[2rem] p-2 flex flex-col hover:-translate-y-1 transition duration-500 cursor-pointer shadow-xl shadow-gray-200/50">
              <div className="p-8 pb-4 flex-1">
                <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-4">Module</p>
                <h3 className="text-2xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-500 text-[15px] leading-relaxed">
                  {feature.desc}
                </p>
              </div>
              
              <div className={`h-52 rounded-[1.5rem] m-2 flex items-center justify-center relative overflow-hidden bg-gradient-to-br ${feature.bg}`}>
                 {/* Internal decorative elements */}
                 <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]"></div>
                 
                 {/* Decorative cloud-like shapes inside the card (like Sarvam's graphic) */}
                 <div className="absolute w-40 h-40 bg-white/20 rounded-full blur-2xl top-[-20%] left-[-10%]"></div>
                 <div className="absolute w-32 h-32 bg-black/10 rounded-full blur-xl bottom-[-10%] right-[-10%]"></div>

                 <div className="glass px-8 py-3 rounded-2xl relative z-10 border border-white/50 backdrop-blur-xl shadow-lg">
                   <h4 className="text-white font-semibold text-lg tracking-wide drop-shadow-sm">{feature.badge}</h4>
                 </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}