"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import { 
  ShieldCheck, Wallet, MapPin, Phone, CheckCircle, Info, 
  Car, Coffee, Home, Zap, Heart, TrendingUp, Search, 
  Building2, Users, Activity, GraduationCap, AlertCircle,
  ArrowRight, Sparkles, BadgeCheck
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// ─── Types ──────────────────────────────────────────────────────────────────
interface CityItem { label: string; unit: string; value: string; numeric: number }
interface Category { id: string; name: string; icon: string; description: string; items: CityItem[] }
interface CityNorm { rent_1bhk_shared: number; rent_1bhk_solo: number; rent_2bhk: number; food_monthly: number; groceries: number; commute_monthly: number; utilities: number; internet: number; lifestyle: number; job_market_score: number; transport_quality: number }
interface CityData {
  name: string;
  meta: { state: string; population: string; desc: string; type: string };
  normalized: CityNorm;
  categories: Category[];
  affordability: { total_expense?: number; savings?: number; savings_percentage?: number };
}
interface CompareResult { city1: CityData; city2: CityData }

interface AIAnalysis {
  verdict?: string;
  summary?: string;
  rent_analysis?: { headline: string; city1_breakdown: string; city2_breakdown: string; monthly_saving: string; recommendation: string };
  food_analysis?: { headline: string; city1_daily: string; city2_daily: string; monthly_diff: string; tip: string };
  transport_analysis?: { headline: string; city1_monthly: string; city2_monthly: string; petrol_diff: string; recommendation: string };
  salary_analysis?: {
    headline: string;
    city1_breakdown: { rent: string; food: string; transport: string; utilities: string; total_expense: string; monthly_savings: string; savings_percentage: string };
    city2_breakdown: { rent: string; food: string; transport: string; utilities: string; total_expense: string; monthly_savings: string; savings_percentage: string };
    verdict: string;
  };
  lifestyle_comparison?: { city1_highlights: string[]; city2_highlights: string[]; gym_diff: string; entertainment_diff: string };
  where_to_live?: {
    city1_areas: { affordable: string; mid_range: string; premium: string };
    city2_areas: { affordable: string; mid_range: string; premium: string };
  };
  benefits?: { city1_pros: string[]; city2_pros: string[]; city1_cons: string[]; city2_cons: string[] };
  final_recommendation?: string;
  moving_checklist?: string[];
  broker_contacts?: {
    city1: { name: string; brokers: { name: string; phone: string; area: string }[]; pg_hubs: string[] };
    city2: { name: string; brokers: { name: string; phone: string; area: string }[]; pg_hubs: string[] };
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number | undefined): string {
  if (!n) return "—";
  return `₹${n.toLocaleString("en-IN")}`;
}

function DiffChip({ a, b, invert }: { a: number; b: number; invert?: boolean }) {
  if (!a || !b || a === b) return null;
  const diff = Math.round(((b - a) / a) * 100);
  const cheaper = invert ? diff > 0 : diff < 0;
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cheaper ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>
      {diff > 0 ? `+${diff}%` : `${diff}%`}
    </span>
  );
}

function Section({ title, icon, children, className = "" }: { title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#1a191f] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden transition-all duration-500 hover:border-orange-500/20 ${className}`}>
      <div className="flex items-center gap-4 px-10 py-6 border-b border-white/5 bg-white/[0.02]">
        <span className="text-orange-500">{icon}</span>
        <h2 className="font-black text-white uppercase tracking-widest text-sm">{title}</h2>
      </div>
      <div className="p-10">{children}</div>
    </div>
  );
}

function AISkeletonLoader() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-[#1a191f] rounded-[2rem] border border-white/5 p-8 space-y-4">
          <div className="h-6 bg-white/5 rounded-xl w-1/3" />
          <div className="h-4 bg-white/5 rounded-lg w-full" />
          <div className="h-4 bg-white/5 rounded-lg w-5/6" />
          <div className="h-4 bg-white/5 rounded-lg w-4/5" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
function ComparePage() {
  const router = useRouter();
  const params = useSearchParams();

  const [city1, setCity1] = useState(params.get("city1") || "");
  const [city2, setCity2] = useState(params.get("city2") || "");
  const [salary, setSalary] = useState(params.get("salary") || "60000");
  const [result, setResult] = useState<CompareResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState("");
  const [error, setError] = useState("");
  const [allCities, setAllCities] = useState<{ city: string }[]>([]);

  useEffect(() => {
    fetch(`${API}/api/cities`).then(r => r.json()).then(d => setAllCities(d.cities || []));
  }, []);

  const runCompare = async () => {
    if (!city1 || !city2) return;
    setLoadingData(true);
    setResult(null);
    setAiAnalysis(null);
    setAiError("");
    setError("");

    try {
      const res = await fetch(`${API}/api/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city1, city2, salary: parseFloat(salary) || 0 }),
      });
      if (!res.ok) throw new Error("Comparison failed");
      const data = await res.json();
      setResult(data);
      setLoadingData(false);

      router.replace(
        `/city/analyzer?city1=${encodeURIComponent(city1)}&city2=${encodeURIComponent(city2)}&salary=${salary}`,
        { scroll: false }
      );

      // AI analysis — starts immediately after data load
      setLoadingAI(true);
      fetch(`${API}/api/compare/analysis?city1=${encodeURIComponent(city1)}&city2=${encodeURIComponent(city2)}&salary=${salary}`)
        .then(r => r.json())
        .then(ai => {
          if (ai?.detail) { setAiError(ai.detail); }
          else { setAiAnalysis(ai); }
          setLoadingAI(false);
        })
        .catch(() => { setAiError("AI analysis unavailable."); setLoadingAI(false); });
    } catch {
      setError("Failed to load comparison. Check both cities are valid.");
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (city1 && city2) runCompare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const norm1 = result?.city1.normalized;
  const norm2 = result?.city2.normalized;
  const aff1 = result?.city1.affordability;
  const aff2 = result?.city2.affordability;
  const hasSalary = parseFloat(salary) > 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0a0a0c] font-sans text-white selection:bg-orange-500/30">
        {/* Premium Nav */}
        <nav className="sticky top-0 z-50 bg-[#0f0e13]/80 backdrop-blur-xl border-b border-white/5 px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-2xl font-black tracking-tighter cursor-pointer" onClick={() => router.push("/")}>
              trex<span className="text-orange-500">.ai</span>
            </span>
            <div className="hidden md:flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 gap-4">
              <button onClick={() => router.push("/city")} className="hover:text-white transition-colors">Cities</button>
              <span className="text-white/10">/</span>
              <span className="text-orange-500">Compare Analysis</span>
            </div>
          </div>
          <button onClick={() => router.push("/city")} className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
             New Search
          </button>
        </nav>

        {/* Global Hero Gradient */}
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none -z-10"></div>

        {/* Controls Overlay */}
        <div className="bg-[#0f0e13]/50 backdrop-blur-md border-b border-white/5 px-10 py-12 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
              <TrendingUp className="w-64 h-64 text-orange-500" />
           </div>
           <div className="max-w-6xl mx-auto relative z-10">
              <h1 className="text-5xl font-black text-white mb-10 tracking-tighter">
                {city1 && city2 ? <>{city1} <span className="text-orange-500 px-4">VS</span> {city2}</> : "Comparative Intelligence"}
              </h1>
              <div className="flex flex-wrap gap-6 items-end">
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black">Node Alpha (City 1)</label>
                  <select value={city1} onChange={e => setCity1(e.target.value)}
                    className="bg-[#1a191f] border border-white/10 rounded-2xl px-6 py-4 text-[13px] font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all min-w-64 appearance-none shadow-xl">
                    <option value="">Select city…</option>
                    {allCities.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black">Node Beta (City 2)</label>
                  <select value={city2} onChange={e => setCity2(e.target.value)}
                    className="bg-[#1a191f] border border-white/10 rounded-2xl px-6 py-4 text-[13px] font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all min-w-64 appearance-none shadow-xl">
                    <option value="">Select city…</option>
                    {allCities.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black">Monthly Capital (₹)</label>
                  <input type="number" value={salary} onChange={e => setSalary(e.target.value)}
                    placeholder="e.g. 60000"
                    className="bg-[#1a191f] border border-white/10 rounded-2xl px-6 py-4 text-[13px] font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all w-48 shadow-xl" />
                </div>
                <button onClick={runCompare} disabled={!city1 || !city2 || loadingData}
                  className="bg-orange-600 text-white rounded-2xl px-10 py-4.5 text-[11px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xl shadow-orange-500/20 hover:-translate-y-1 active:scale-95 h-[58px]">
                  {loadingData ? "Synthesizing..." : "Analyze Correlation"}
                </button>
              </div>
              {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-6 animate-pulse">{error}</p>}
           </div>
        </div>

        {/* Results Container */}
        {result && norm1 && norm2 && (
          <div className="max-w-6xl mx-auto px-10 py-16 space-y-16">
            
            {/* AI Verdict Premium Banner */}
            {aiAnalysis?.verdict && (
              <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 text-white rounded-[3rem] px-12 py-10 flex items-center justify-between shadow-[0_30px_100px_rgba(249,115,22,0.2)] group overflow-hidden relative border border-white/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="flex items-center gap-8 relative z-10">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-white/20 backdrop-blur-xl flex items-center justify-center text-3xl shadow-2xl border border-white/20">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-80 mb-2">AI STRATEGIC CORRELATION VERDICT</p>
                    <p className="font-black text-3xl tracking-tight leading-none">{aiAnalysis.verdict}</p>
                  </div>
                </div>
                <div className="relative z-10 hidden lg:block">
                  <div className="px-6 py-3 bg-black/20 rounded-2xl border border-white/10 backdrop-blur-xl text-[10px] font-black uppercase tracking-[0.2em]">
                    Institutional Grade
                  </div>
                </div>
              </div>
            )}

            {/* City Comparative Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {[result.city1, result.city2].map((c, i) => (
                <div key={c.name}
                  onClick={() => router.push(`/city/${encodeURIComponent(c.name)}`)}
                  className={`group relative overflow-hidden rounded-[3rem] p-10 cursor-pointer transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_40px_100px_rgba(0,0,0,0.5)] shadow-2xl border border-white/5
                    ${i === 0 ? 'bg-[#1a191f] text-white' : 'bg-white/[0.02] text-white hover:bg-white/[0.04]'}`}>
                  <div className={`absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700 ${i === 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                    <Building2 className="w-24 h-24" />
                  </div>
                  <div className="flex flex-col gap-6 relative z-10">
                    <div className="space-y-2">
                       <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${i === 0 ? 'text-orange-500' : 'text-gray-600'}`}>{c.meta.type} • {c.meta.state}</p>
                       <p className="text-5xl font-black tracking-tighter leading-none">{c.name}</p>
                    </div>
                    <p className="text-sm opacity-50 font-medium leading-relaxed max-w-[85%]">{c.meta.desc}</p>
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest bg-white/5 w-fit px-5 py-2.5 rounded-2xl border border-white/5 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all duration-500">
                      Explore Profile <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Affordability Metrics */}
            {hasSalary && aff1?.savings !== undefined && aff2?.savings !== undefined && (
              <Section title={`Projected Capital Efficiency (at ${fmt(parseInt(salary))}/mo)`} icon={<Wallet className="w-5 h-5" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                  {[{ city: city1, aff: aff1, color: "orange" }, { city: city2, aff: aff2, color: "gray" }].map(({ city, aff, color }) => (
                    <div key={city} className="space-y-8 relative">
                      <div className="flex items-center justify-between">
                         <p className={`font-black text-xs uppercase tracking-[0.2em] ${color === 'orange' ? 'text-orange-500' : 'text-gray-400'}`}>{city}</p>
                         <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[9px] font-black text-gray-500 uppercase tracking-widest">Calculated Node</div>
                      </div>
                      <div className="space-y-6">
                        <div className="flex justify-between items-end pb-4 border-b border-white/5">
                          <span className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Monthly Burn Rate</span>
                          <span className="font-black text-xl text-white tracking-tight">{fmt(aff.total_expense)}</span>
                        </div>
                        <div className="flex justify-between items-end pb-4 border-b border-white/5">
                          <span className="text-gray-500 font-black uppercase text-[10px] tracking-widest">Retained Capital</span>
                          <span className={`font-black text-3xl tracking-tighter ${(aff.savings || 0) > 0 ? "text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "text-red-500"}`}>{fmt(aff.savings)}</span>
                        </div>
                        <div className="space-y-3">
                           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                             <span className="text-gray-600">Savings Ratio</span>
                             <span className="text-white">{aff.savings_percentage?.toFixed(1)}%</span>
                           </div>
                           <div className="h-2 bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
                             <div className={`h-full ${color === 'orange' ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'bg-gray-600'} transition-all duration-1500 ease-out`}
                               style={{ width: `${Math.min(100, Math.max(0, aff.savings_percentage || 0))}%` }} />
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Key Metric Comparison Table */}
            <Section title="Institutional Benchmarks" icon={<TrendingUp className="w-5 h-5" />}>
              <div className="grid grid-cols-[1fr_180px_180px] text-[10px] text-gray-600 uppercase tracking-[0.3em] mb-8 font-black pb-5 border-b border-white/5">
                <span>METRIC CLASSIFICATION</span>
                <span className="text-orange-500 text-center">{city1}</span>
                <span className="text-gray-400 text-center">{city2}</span>
              </div>
              {([
                ["1BHK Solo Rent", norm1.rent_1bhk_solo, norm2.rent_1bhk_solo],
                ["PG / Shared Room", norm1.rent_1bhk_shared, norm2.rent_1bhk_shared],
                ["Monthly Food", norm1.food_monthly, norm2.food_monthly],
                ["Groceries", norm1.groceries, norm2.groceries],
                ["Commute (Monthly)", norm1.commute_monthly, norm2.commute_monthly],
                ["Utilities", norm1.utilities, norm2.utilities],
                ["Internet", norm1.internet, norm2.internet],
                ["Lifestyle & Misc", norm1.lifestyle, norm2.lifestyle],
              ] as [string, number, number][]).map(([label, v1, v2]) => (
                <div key={label} className="grid grid-cols-[1fr_180px_180px] text-sm py-6 border-b border-white/[0.02] last:border-0 hover:bg-white/[0.02] px-6 -mx-6 rounded-2xl transition-all group items-center">
                  <span className="text-gray-500 font-black uppercase text-[11px] tracking-widest group-hover:text-white transition-colors">{label}</span>
                  <span className={`font-black text-center text-lg tracking-tight ${v1 < v2 ? "text-emerald-500" : "text-white/60"}`}>{fmt(v1)}</span>
                  <div className="flex items-center justify-center gap-4">
                    <span className={`font-black text-lg tracking-tight ${v2 < v1 ? "text-emerald-500" : "text-white/60"}`}>{fmt(v2)}</span>
                    <DiffChip a={v1} b={v2} />
                  </div>
                </div>
              ))}
            </Section>

            {/* AI STRATEGIC INTELLIGENCE GRID */}
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-white/5">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] font-black tracking-widest uppercase mb-4">
                    <Zap className="w-3 h-3" />
                    Neural Analysis Engine
                  </div>
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase">AI Strategic Insights</h2>
                </div>
                <div className="flex items-center gap-4">
                  {loadingAI && (
                    <div className="flex items-center gap-3 text-[10px] font-black text-orange-500 bg-orange-500/10 px-5 py-2.5 rounded-2xl border border-orange-500/20 shadow-2xl animate-pulse">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
                      SYNTHESIZING LOGIC
                    </div>
                  )}
                  {aiError && (
                    <div className="flex items-center gap-3 text-[10px] font-black text-red-500 bg-red-500/10 px-5 py-2.5 rounded-2xl border border-red-500/20">
                      <AlertCircle className="w-4 h-4" />
                      SYSTEM FAILURE
                    </div>
                  )}
                </div>
              </div>

              {loadingAI && !aiAnalysis && <AISkeletonLoader />}

              {aiAnalysis && (
                <div className="space-y-16 animate-in fade-in duration-1000">
                  {/* Summary Block */}
                  {aiAnalysis.summary && (
                    <div className="bg-[#1a191f] border border-white/5 rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000">
                        <ShieldCheck className="w-48 h-48 text-orange-500" />
                      </div>
                      <div className="flex items-center gap-4 mb-8 relative z-10">
                        <div className="h-[2px] w-12 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Executive Synthesis</p>
                      </div>
                      <p className="text-gray-300 leading-relaxed text-2xl font-medium italic relative z-10 tracking-tight">"{aiAnalysis.summary}"</p>
                    </div>
                  )}

                  {/* Feature Analysis Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {aiAnalysis.rent_analysis && (
                      <div className="bg-[#1a191f] rounded-[2.5rem] border-t-4 border-t-orange-500 border-x border-b border-white/5 p-10 shadow-2xl hover:scale-105 transition-all duration-500 group">
                        <div className="flex items-center justify-between mb-8">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Housing Logic</p>
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-all">
                            <Home className="w-5 h-5" />
                          </div>
                        </div>
                        <p className="font-black text-white mb-8 leading-tight text-xl tracking-tight uppercase">{aiAnalysis.rent_analysis.headline}</p>
                        <div className="space-y-4 mb-10">
                          <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">{city1}</p>
                            <p className="text-xs text-gray-400 font-bold leading-relaxed">{aiAnalysis.rent_analysis.city1_breakdown}</p>
                          </div>
                          <div className="bg-black/40 p-5 rounded-2xl border border-white/5">
                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">{city2}</p>
                            <p className="text-xs text-gray-400 font-bold leading-relaxed">{aiAnalysis.rent_analysis.city2_breakdown}</p>
                          </div>
                        </div>
                        <div className="bg-emerald-500/10 text-emerald-500 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-center border border-emerald-500/20 shadow-inner mb-6">
                           Capital Yield: {aiAnalysis.rent_analysis.monthly_saving}
                        </div>
                        <p className="text-[11px] text-gray-600 font-bold leading-relaxed pt-6 border-t border-white/5 italic">
                          {aiAnalysis.rent_analysis.recommendation}
                        </p>
                      </div>
                    )}

                    {aiAnalysis.food_analysis && (
                      <div className="bg-[#1a191f] rounded-[2.5rem] border-t-4 border-t-blue-500 border-x border-b border-white/5 p-10 shadow-2xl hover:scale-105 transition-all duration-500 group">
                        <div className="flex items-center justify-between mb-8">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Nutrition Costing</p>
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all">
                            <Coffee className="w-5 h-5" />
                          </div>
                        </div>
                        <p className="font-black text-white mb-8 leading-tight text-xl tracking-tight uppercase">{aiAnalysis.food_analysis.headline}</p>
                        <div className="space-y-6 mb-10">
                          <div className="flex justify-between items-center text-xs pb-4 border-b border-white/5">
                            <span className="text-gray-500 font-black uppercase tracking-widest">{city1} Daily</span>
                            <span className="font-black text-white text-base">{aiAnalysis.food_analysis.city1_daily}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs pb-4">
                            <span className="text-gray-500 font-black uppercase tracking-widest">{city2} Daily</span>
                            <span className="font-black text-white text-base">{aiAnalysis.food_analysis.city2_daily}</span>
                          </div>
                          <div className="bg-blue-500/10 text-blue-500 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-center border border-blue-500/20 shadow-inner">
                            Monthly Offset: {aiAnalysis.food_analysis.monthly_diff}
                          </div>
                        </div>
                        <div className="flex gap-4 items-start bg-black/40 p-6 rounded-2xl border border-white/5">
                          <Zap className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-gray-500 font-bold leading-relaxed italic">
                            {aiAnalysis.food_analysis.tip}
                          </p>
                        </div>
                      </div>
                    )}

                    {aiAnalysis.transport_analysis && (
                      <div className="bg-[#1a191f] rounded-[2.5rem] border-t-4 border-t-emerald-500 border-x border-b border-white/5 p-10 shadow-2xl hover:scale-105 transition-all duration-500 group">
                        <div className="flex items-center justify-between mb-8">
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Mobility Index</p>
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <Car className="w-5 h-5" />
                          </div>
                        </div>
                        <p className="font-black text-white mb-8 leading-tight text-xl tracking-tight uppercase">{aiAnalysis.transport_analysis.headline}</p>
                        <div className="space-y-5 mb-10">
                           <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
                              <p className="text-xs text-gray-300 font-black uppercase tracking-tight">{aiAnalysis.transport_analysis.city1_monthly}</p>
                           </div>
                           <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                              <div className="w-2.5 h-2.5 rounded-full bg-gray-700"></div>
                              <p className="text-xs text-gray-300 font-black uppercase tracking-tight">{aiAnalysis.transport_analysis.city2_monthly}</p>
                           </div>
                           {aiAnalysis.transport_analysis.petrol_diff && (
                              <div className="bg-emerald-500/10 px-4 py-3 rounded-xl border border-emerald-500/20 flex items-center gap-3">
                                 <Zap className="w-4 h-4 text-orange-500" />
                                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{aiAnalysis.transport_analysis.petrol_diff}</p>
                              </div>
                           )}
                        </div>
                        <div className="bg-white text-black p-6 rounded-[2rem] shadow-2xl">
                           <p className="text-[11px] font-black leading-relaxed uppercase tracking-tight">{aiAnalysis.transport_analysis.recommendation}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Neighborhood Mapping */}
                  {aiAnalysis.where_to_live && (
                    <Section title="Institutional Area Mapping" icon={<MapPin className="w-5 h-5" />}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        {[
                          { city: city1, areas: aiAnalysis.where_to_live.city1_areas, color: "orange" },
                          { city: city2, areas: aiAnalysis.where_to_live.city2_areas, color: "gray" },
                        ].map(({ city, areas, color }) => (
                          <div key={city}>
                            <div className={`font-black text-[10px] uppercase tracking-[0.4em] ${color === 'orange' ? 'text-orange-500' : 'text-gray-600'} mb-10 flex items-center gap-4`}>
                               <div className="w-8 h-px bg-current opacity-30"></div>
                               GEOSPATIAL CLUSTERS: {city}
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                              {[
                                { label: "Value Hubs", val: areas.affordable, bg: "bg-emerald-500/5", text: "text-emerald-500", border: "border-emerald-500/10", dot: "bg-emerald-500" },
                                { label: "Strategic Centers", val: areas.mid_range, bg: "bg-orange-500/5", text: "text-orange-500", border: "border-orange-500/10", dot: "bg-orange-500" },
                                { label: "Prime Corridors", val: areas.premium, bg: "bg-blue-500/5", text: "text-blue-500", border: "border-blue-500/10", dot: "bg-blue-500" },
                              ].map(({ label, val, bg, text, border, dot }) => (
                                <div key={label} className={`${bg} ${border} border rounded-[2.5rem] p-8 shadow-2xl hover:bg-white/[0.03] transition-all group relative overflow-hidden`}>
                                  <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                       <div className={`w-2.5 h-2.5 rounded-full ${dot} shadow-[0_0_10px_rgba(255,255,255,0.2)]`}></div>
                                       <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${text}`}>{label}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-lg border ${border} text-[8px] font-black uppercase tracking-widest text-gray-600`}>Verified</div>
                                  </div>
                                  <p className="text-lg text-white font-black tracking-tight leading-relaxed">{val}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Broker & Logistics Engine */}
                  {aiAnalysis.broker_contacts && (
                    <Section title="Operational Logistics Directory" icon={<Phone className="w-5 h-5" />}>
                      <div className="flex items-start gap-6 mb-12 bg-white/[0.02] p-8 rounded-[3rem] border border-white/5 shadow-inner group">
                        <div className="w-14 h-14 rounded-2xl bg-orange-600/10 text-orange-500 flex items-center justify-center shrink-0 border border-orange-500/20 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                           <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                           <p className="text-white font-black text-base uppercase tracking-widest">Institutional Logistics Support</p>
                           <p className="text-sm text-gray-500 font-medium opacity-80 leading-relaxed max-w-3xl">
                              Access curated verified brokers. Our internal rating system monitors response times and listing accuracy. 
                              Connect directly to bypass traditional platform latency.
                           </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {[
                          { data: aiAnalysis.broker_contacts.city1, color: "orange" },
                          { data: aiAnalysis.broker_contacts.city2, color: "gray" },
                        ].map(({ data, color }) => (
                          <div key={data.name}>
                            <p className={`font-black text-[10px] uppercase tracking-[0.3em] ${color === 'orange' ? 'text-orange-500' : 'text-gray-600'} mb-8 flex items-center gap-3`}>
                               <Users className="w-4 h-4" /> {data.name} VERIFIED AGENTS
                            </p>
                            <div className="space-y-4 mb-10">
                              {data.brokers?.map((b) => (
                                <div key={b.name} className="flex items-center justify-between bg-[#1a191f] border border-white/5 rounded-[2rem] p-6 shadow-xl hover:border-orange-500/30 transition-all duration-500 group">
                                  <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center text-gray-600 group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-500 transition-all duration-500">
                                       <Users className="w-7 h-7" />
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-lg font-black text-white tracking-tight leading-none uppercase">{b.name}</p>
                                      <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">{b.area}</p>
                                    </div>
                                  </div>
                                  <a href={`tel:${b.phone}`}
                                    className="w-14 h-14 bg-white/5 text-white rounded-2xl hover:bg-orange-600 transition-all flex items-center justify-center border border-white/10 group-hover:border-transparent group-hover:scale-105 active:scale-90">
                                    <Phone className="w-6 h-6" />
                                  </a>
                                </div>
                              ))}
                            </div>
                            {data.pg_hubs?.length > 0 && (
                              <div className="bg-black/30 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mb-6">PG & Coliving Cluster Hubs</p>
                                <div className="flex flex-wrap gap-3">
                                  {data.pg_hubs.map(hub => (
                                    <span key={hub} className="bg-[#1a191f] border border-white/5 text-white text-[10px] font-black px-5 py-2.5 rounded-xl uppercase tracking-widest shadow-xl hover:border-orange-500/30 transition-colors cursor-default">{hub}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Vibe & Lifestyle Pulse */}
                  {aiAnalysis.lifestyle_comparison && (
                    <Section title="Socio-Cultural Dynamics" icon={<Activity className="w-5 h-5" />}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16">
                        {[
                          { city: city1, highlights: aiAnalysis.lifestyle_comparison.city1_highlights, color: "orange", icon: <Sparkles className="w-6 h-6 text-orange-500" /> },
                          { city: city2, highlights: aiAnalysis.lifestyle_comparison.city2_highlights, color: "gray", icon: <Zap className="w-6 h-6 text-gray-500" /> },
                        ].map(({ city, highlights, color, icon }) => (
                          <div key={city}>
                            <p className={`font-black text-3xl text-white mb-10 tracking-tighter flex items-center gap-5 uppercase leading-none`}>
                               {icon} {city}
                            </p>
                            <div className="flex flex-wrap gap-4">
                              {highlights?.map((h, i) => (
                                <span key={i} className={`bg-[#1a191f] text-white border border-white/5 text-[11px] font-black px-5 py-3 rounded-2xl uppercase tracking-widest flex items-center gap-4 shadow-xl hover:border-orange-500/30 transition-all duration-500`}>
                                   <div className={`w-2 h-2 rounded-full ${color === 'orange' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'bg-gray-700'}`}></div>
                                   {h}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-16 border-t border-white/5">
                        <div className="bg-orange-500/5 rounded-[3rem] p-10 border border-orange-500/10 shadow-2xl group hover:bg-orange-500/[0.08] transition-all duration-500">
                          <div className="text-[10px] text-orange-500 uppercase font-black tracking-[0.4em] mb-6 flex items-center gap-3">
                             <Activity className="w-5 h-5" /> Fitness & Wellness Logic
                          </div>
                          <p className="text-xl text-white font-medium leading-relaxed italic opacity-90 group-hover:opacity-100 transition-opacity tracking-tight">"{aiAnalysis.lifestyle_comparison.gym_diff}"</p>
                        </div>
                        <div className="bg-blue-500/5 rounded-[3rem] p-10 border border-blue-500/10 shadow-2xl group hover:bg-blue-500/[0.08] transition-all duration-500">
                          <div className="text-[10px] text-blue-500 uppercase font-black tracking-[0.4em] mb-6 flex items-center gap-3">
                             <Heart className="w-5 h-5" /> Social & Leisure Dynamics
                          </div>
                          <p className="text-xl text-white font-medium leading-relaxed italic opacity-90 group-hover:opacity-100 transition-opacity tracking-tight">"{aiAnalysis.lifestyle_comparison.entertainment_diff}"</p>
                        </div>
                      </div>
                    </Section>
                  )}

                  {/* Final Recommendation Summary Card */}
                  {aiAnalysis.final_recommendation && (
                    <div className="bg-gradient-to-br from-orange-600 via-[#1a191f] to-black text-white rounded-[4rem] p-16 shadow-[0_50px_150px_rgba(0,0,0,0.8)] relative overflow-hidden group border border-white/10">
                      <div className="absolute top-0 right-0 p-20 opacity-[0.03] group-hover:scale-125 transition-transform duration-2000">
                        <Sparkles className="w-96 h-96" />
                      </div>
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500"></div>
                      <div className="flex items-center gap-6 mb-12 relative z-10">
                        <div className="h-[2px] w-16 bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,1)]"></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.6em] text-orange-500">The Final Strategic Correlation</p>
                      </div>
                      <div className="flex flex-col md:flex-row gap-14 items-center md:items-start relative z-10">
                         <div className="w-32 h-32 rounded-[2.5rem] bg-orange-600 shadow-[0_20px_60px_rgba(249,115,22,0.4)] flex items-center justify-center text-6xl border border-white/20 shrink-0 group-hover:rotate-6 transition-all duration-700">
                           🎯
                         </div>
                         <div className="space-y-6">
                            <p className="text-3xl lg:text-4xl leading-[1.2] font-black tracking-tighter italic text-white drop-shadow-2xl">"{aiAnalysis.final_recommendation}"</p>
                            <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                               <BadgeCheck className="w-4 h-4 text-orange-500" />
                               Institutional Grade Verification
                            </div>
                         </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Granular Price Synthesis Table */}
            <div className="mt-24">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                 <div className="flex items-center gap-6">
                    <div className="h-[2px] w-16 bg-white/10"></div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Granular Market Synthesis</h2>
                 </div>
                 <div className="px-6 py-2 bg-white/5 rounded-full border border-white/5 text-[9px] font-black text-gray-600 uppercase tracking-widest">Update 2026.Q2.v4</div>
              </div>
              
              {result.city1.categories.map((cat1, ci) => {
                const cat2 = result.city2.categories[ci];
                if (!cat2) return null;
                return (
                  <div key={cat1.id} className="mb-12 bg-[#1a191f] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl hover:border-orange-500/20 transition-all duration-500">
                    <div className="flex items-center gap-6 px-12 py-8 bg-white/[0.03] border-b border-white/5">
                      <span className="text-3xl drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">{cat1.icon}</span>
                      <h3 className="font-black text-white text-base uppercase tracking-[0.3em] leading-none">{cat1.name}</h3>
                    </div>
                    <div className="grid grid-cols-[1fr_180px_180px] px-12 py-5 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] border-b border-white/[0.02] bg-black/20">
                      <span>Inventory Item Specification</span>
                      <span className="text-orange-500 text-center">{city1}</span>
                      <span className="text-gray-400 text-center">{city2}</span>
                    </div>
                    {cat1.items.map((item, idx) => {
                      const item2 = cat2.items[idx];
                      if (!item2) return null;
                      const n1 = item.numeric, n2 = item2.numeric;
                      return (
                        <div key={item.label}
                          className={`grid grid-cols-[1fr_180px_180px] px-12 py-7 border-b border-white/[0.01] last:border-0 text-sm hover:bg-white/[0.02] transition-colors items-center ${idx % 2 ? "bg-black/10" : ""}`}>
                          <div>
                            <p className="font-black text-white tracking-tight uppercase text-xs">{item.label}</p>
                            <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] mt-1.5">{item.unit}</p>
                          </div>
                          <p className={`font-black self-center text-center text-lg tracking-tighter ${n1 > 0 && n2 > 0 && n1 < n2 ? "text-emerald-500" : "text-white/40"}`}>{item.value}</p>
                          <div className="flex items-center justify-center gap-6 self-center">
                            <p className={`font-black text-lg tracking-tighter ${n1 > 0 && n2 > 0 && n2 < n1 ? "text-emerald-500" : "text-white/40"}`}>{item2.value}</p>
                            {n1 > 0 && n2 > 0 && <DiffChip a={n1} b={n2} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* Empty State */}
        {!result && !loadingData && (
          <div className="max-w-6xl mx-auto px-10 py-40 text-center relative overflow-hidden">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[150px] -z-10"></div>
             <div className="w-24 h-24 bg-[#1a191f] border border-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl">
                <Search className="w-10 h-10 text-orange-500" />
             </div>
             <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-6">Awaiting Parameters</h2>
             <p className="text-xl font-medium text-gray-500 max-w-2xl mx-auto leading-relaxed">
               Select two cities above and define your capital allocation to start the comparative engine. 
               Get side-by-side market synthesis and AI strategic insights.
             </p>
          </div>
        )}

        {/* Loading Matrix Overlay */}
        {loadingData && (
          <div className="fixed inset-0 z-[100] bg-[#0a0a0c]/90 backdrop-blur-2xl flex items-center justify-center p-10">
            <div className="text-center space-y-10">
              <div className="relative inline-block">
                <div className="w-24 h-24 border-[6px] border-orange-500/10 border-t-orange-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(249,115,22,1)]"></div>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-3xl font-black text-white uppercase tracking-[0.2em] animate-pulse">Running Correlation Engine</p>
                <p className="text-[11px] font-black text-gray-600 uppercase tracking-[0.4em]">Aggregating market data • Mapping neighborhood clusters • Synthesizing AI logic</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 border-t border-white/5 py-20 px-10">
           <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="text-2xl font-black tracking-tighter text-white">
                trex<span className="text-orange-500">.ai</span>
              </div>
              <p className="text-gray-700 text-[9px] font-black uppercase tracking-[0.4em]">Proprietary Data Synthesis Node • v2.0.4</p>
              <div className="text-gray-800 text-[9px] font-black uppercase tracking-widest">© 2026 TREX AI SYSTEMS</div>
           </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}

// Wrapping for Suspense
export default function SuspenseComparePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center"><div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div></div>}>
      <ComparePage />
    </Suspense>
  );
}
