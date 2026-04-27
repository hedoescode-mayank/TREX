"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import { 
  ShieldCheck, Wallet, MapPin, Phone, CheckCircle, Info, 
  Car, Coffee, Home, Zap, Heart, TrendingUp, Search, 
  Building2, Users, Activity, GraduationCap, AlertCircle,
  ArrowRight, Sparkles
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number | undefined): string {
  if (!n) return "—";
  return `₹${n.toLocaleString("en-IN")}`;
}

function DiffChip({ a, b, invert }: { a: number; b: number; invert?: boolean }) {
  if (!a || !b || a === b) return null;
  const diff = Math.round(((b - a) / a) * 100);
  const cheaper = invert ? diff > 0 : diff < 0;
  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${cheaper ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
      {diff > 0 ? `+${diff}%` : `${diff}%`}
    </span>
  );
}

function Section({ title, icon, children, className = "" }: { title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-blue-100 ${className}`}>
      <div className="flex items-center gap-3 px-8 py-5 border-b border-gray-50 bg-gray-50/30">
        <span className="text-blue-500">{icon}</span>
        <h2 className="font-extrabold text-gray-900 tracking-tight">{title}</h2>
      </div>
      <div className="p-8">{children}</div>
    </div>
  );
}

function CityCol({ label, val1, val2, c1Name, c2Name }: { label: string; val1: string; val2: string; c1Name: string; c2Name: string }) {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr] text-sm py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-800">{val1}</span>
      <span className="font-semibold text-gray-800">{val2}</span>
    </div>
  );
}

function AISkeletonLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
          <div className="h-4 bg-gray-100 rounded w-4/5" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
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
        `/city/compare?city1=${encodeURIComponent(city1)}&city2=${encodeURIComponent(city2)}&salary=${salary}`,
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
      <div className="min-h-screen bg-gray-50 font-sans">
        {/* Nav */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-3 flex items-center gap-4">
          <span className="text-xl font-bold tracking-tight cursor-pointer" onClick={() => router.push("/")}>
            trex<span className="text-blue-500">.ai</span>
          </span>
          <div className="text-gray-400 text-sm">
            <button onClick={() => router.push("/city")} className="hover:text-blue-600">Cities</button>
            <span className="mx-2">/</span>
            <span className="text-gray-700 font-medium">Compare</span>
          </div>
        </nav>

        {/* Controls */}
        <div className="bg-white border-b border-gray-200 px-6 py-6">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-5">
              {city1 && city2 ? `${city1} vs ${city2}` : "Compare Two Cities"}
            </h1>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">City 1</label>
                <select value={city1} onChange={e => setCity1(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-40">
                  <option value="">Select city…</option>
                  {allCities.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
                </select>
              </div>
              <span className="text-gray-400 font-black text-xl pb-2">vs</span>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">City 2</label>
                <select value={city2} onChange={e => setCity2(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-40">
                  <option value="">Select city…</option>
                  {allCities.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">Monthly Salary (₹)</label>
                <input type="number" value={salary} onChange={e => setSalary(e.target.value)}
                  placeholder="e.g. 60000"
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40" />
              </div>
              <button onClick={runCompare} disabled={!city1 || !city2 || loadingData}
                className="bg-blue-600 text-white rounded-xl px-7 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
                {loadingData ? "Loading…" : "Compare →"}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </div>
        </div>

        {/* Results */}
        {result && norm1 && norm2 && (
          <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
            {/* AI Verdict Banner */}
            {aiAnalysis?.verdict && (
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-3xl px-8 py-5 flex items-center justify-between shadow-xl shadow-blue-500/20 group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-inner border border-white/20">
                    🏆
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">AI STRATEGIC VERDICT</p>
                    <p className="font-extrabold text-xl leading-tight">{aiAnalysis.verdict}</p>
                  </div>
                </div>
                <Sparkles className="w-6 h-6 text-blue-200 opacity-50 animate-pulse hidden md:block" />
              </div>
            )}

            {/* City Header */}
            <div className="grid grid-cols-2 gap-6">
              {[result.city1, result.city2].map((c, i) => (
                <div key={c.name}
                  onClick={() => router.push(`/city/${encodeURIComponent(c.name)}`)}
                  className={`group relative overflow-hidden rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl shadow-lg border border-transparent
                    ${i === 0 ? 'bg-blue-600 text-white shadow-blue-500/10' : 'bg-slate-900 text-white shadow-slate-900/10'}`}>
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Building2 className="w-16 h-16" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-2">{c.meta.type} • {c.meta.state}</p>
                  <p className="text-3xl font-black mt-1 leading-none">{c.name}</p>
                  <p className="text-xs mt-3 opacity-60 line-clamp-2 leading-relaxed max-w-[90%]">{c.meta.desc}</p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider bg-white/10 w-fit px-3 py-1 rounded-full border border-white/10">
                    Explore Profile <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>

            {/* Affordability */}
            {hasSalary && aff1?.savings !== undefined && aff2?.savings !== undefined && (
              <Section title={`Financial Forecast (at ₹${parseInt(salary).toLocaleString("en-IN")}/mo)`} icon={<Wallet className="w-5 h-5" />}>
                <div className="grid grid-cols-2 gap-10">
                  {[{ city: city1, aff: aff1, color: "blue" }, { city: city2, aff: aff2, color: "slate" }].map(({ city, aff, color }) => (
                    <div key={city} className="space-y-4">
                      <p className={`font-black text-xs uppercase tracking-[0.15em] text-${color}-500 mb-1`}>{city}</p>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                          <span className="text-gray-400 font-medium uppercase text-[10px] tracking-wider">Estimated Outflow</span>
                          <span className="font-bold text-gray-800">{fmt(aff.total_expense)}</span>
                        </div>
                        <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                          <span className="text-gray-400 font-medium uppercase text-[10px] tracking-wider">Disposable Savings</span>
                          <span className={`font-black text-base ${(aff.savings || 0) > 0 ? "text-emerald-600" : "text-red-500"}`}>{fmt(aff.savings)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-1">
                          <span className="text-gray-400 font-medium uppercase text-[10px] tracking-wider">Efficiency</span>
                          <span className="font-black text-gray-900">{aff.savings_percentage?.toFixed(1)}%</span>
                        </div>
                        <div className="mt-2 h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-50">
                          <div className={`h-full ${color === 'blue' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-700 shadow-[0_0_8px_rgba(15,23,42,0.5)]'} rounded-full transition-all duration-1000`}
                            style={{ width: `${Math.min(100, Math.max(0, aff.savings_percentage || 0))}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Key Metric Comparison */}
            <Section title="Comparative Key Benchmarks" icon={<TrendingUp className="w-5 h-5" />}>
              <div className="grid grid-cols-[1fr_150px_150px] text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-4 font-black pb-3 border-b border-gray-100">
                <span>METRIC CLASSIFICATION</span>
                <span className="text-blue-600 text-center">{city1}</span>
                <span className="text-slate-600 text-center">{city2}</span>
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
                <div key={label} className="grid grid-cols-[1fr_150px_150px] text-sm py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 px-2 -mx-2 rounded-xl transition-colors group">
                  <span className="text-gray-500 font-medium group-hover:text-gray-900 transition-colors">{label}</span>
                  <span className={`font-bold text-center ${v1 < v2 ? "text-emerald-600" : "text-gray-700"}`}>{fmt(v1)}</span>
                  <div className="flex items-center justify-center gap-3">
                    <span className={`font-bold ${v2 < v1 ? "text-emerald-600" : "text-gray-700"}`}>{fmt(v2)}</span>
                    <DiffChip a={v1} b={v2} />
                  </div>
                </div>
              ))}
            </Section>

            {/* ─── AI STRATEGIC INTELLIGENCE SECTION ─── */}
            <div className="border-t-2 border-blue-100/50 pt-12 mt-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">AI Strategic Intelligence</h2>
                  <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Contextual relocation & affordability engine</p>
                </div>
                <div className="flex items-center gap-3">
                  {loadingAI && (
                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 shadow-sm animate-pulse">
                      <Sparkles className="h-3 w-3" />
                      GENERATING INSIGHTS
                    </div>
                  )}
                  {aiError && (
                    <div className="flex items-center gap-2 text-[10px] font-black text-red-600 bg-red-50 px-4 py-2 rounded-full border border-red-100 shadow-sm">
                      <AlertCircle className="w-3 w-3" />
                      ANALYSIS FAILED
                    </div>
                  )}
                </div>
              </div>

              {loadingAI && !aiAnalysis && <AISkeletonLoader />}

              {aiAnalysis && (
                <div className="space-y-12">
                  {/* Executive Summary */}
                  {aiAnalysis.summary && (
                    <div className="bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 border border-blue-100/50 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                        <ShieldCheck className="w-32 h-32" />
                      </div>
                      <div className="flex items-center gap-2 mb-4 relative z-10">
                        <div className="h-px w-10 bg-blue-300"></div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">AI Executive Summary</p>
                      </div>
                      <p className="text-gray-700 leading-relaxed text-xl font-medium italic relative z-10">"{aiAnalysis.summary}"</p>
                    </div>
                  )}

                  {/* Insight cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {aiAnalysis.rent_analysis && (
                      <div className="bg-white rounded-[2rem] border-t-4 border-t-blue-500 border border-gray-100 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 group">
                        <div className="flex items-center justify-between mb-6">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rent & Housing</p>
                          <div className="p-2 bg-blue-50 rounded-xl text-blue-500 group-hover:scale-110 transition-transform">
                            <Home className="w-5 h-5" />
                          </div>
                        </div>
                        <p className="font-black text-gray-900 mb-6 leading-tight text-lg">{aiAnalysis.rent_analysis.headline}</p>
                        <div className="space-y-4 mb-8">
                          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/30">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{city1}</p>
                            <p className="text-xs text-gray-700 font-bold">{aiAnalysis.rent_analysis.city1_breakdown}</p>
                          </div>
                          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/30">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">{city2}</p>
                            <p className="text-xs text-gray-700 font-bold">{aiAnalysis.rent_analysis.city2_breakdown}</p>
                          </div>
                        </div>
                        <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-center mb-6 shadow-inner border border-emerald-100/50">
                          💸 {aiAnalysis.rent_analysis.monthly_saving}
                        </div>
                        <p className="text-[11px] text-gray-400 font-bold leading-relaxed pt-5 border-t border-gray-50 italic">
                          {aiAnalysis.rent_analysis.recommendation}
                        </p>
                      </div>
                    )}

                    {aiAnalysis.food_analysis && (
                      <div className="bg-white rounded-[2rem] border-t-4 border-t-orange-500 border border-gray-100 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 group">
                        <div className="flex items-center justify-between mb-6">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Food & Dining</p>
                          <div className="p-2 bg-orange-50 rounded-xl text-orange-500 group-hover:scale-110 transition-transform">
                            <Coffee className="w-5 h-5" />
                          </div>
                        </div>
                        <p className="font-black text-gray-900 mb-6 leading-tight text-lg">{aiAnalysis.food_analysis.headline}</p>
                        <div className="space-y-4 mb-8">
                          <div className="flex justify-between items-center text-xs pb-3 border-b border-gray-50">
                            <span className="text-gray-500 font-black uppercase tracking-widest">{city1} Daily</span>
                            <span className="font-black text-gray-900 text-sm">{aiAnalysis.food_analysis.city1_daily}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-black uppercase tracking-widest">{city2} Daily</span>
                            <span className="font-black text-gray-900 text-sm">{aiAnalysis.food_analysis.city2_daily}</span>
                          </div>
                          <div className="mt-4 bg-emerald-50 text-emerald-700 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-center shadow-inner border border-emerald-100/50">
                            Monthly Offset: {aiAnalysis.food_analysis.monthly_diff}
                          </div>
                        </div>
                        <div className="flex gap-3 items-start bg-gray-50 p-4 rounded-[1.5rem] border border-gray-100">
                          <Zap className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-gray-500 font-bold leading-relaxed italic">
                            {aiAnalysis.food_analysis.tip}
                          </p>
                        </div>
                      </div>
                    )}

                    {aiAnalysis.transport_analysis && (
                      <div className="bg-white rounded-[2rem] border-t-4 border-t-indigo-500 border border-gray-100 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 group">
                        <div className="flex items-center justify-between mb-6">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobility</p>
                          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-500 group-hover:scale-110 transition-transform">
                            <Car className="w-5 h-5" />
                          </div>
                        </div>
                        <p className="font-black text-gray-900 mb-6 leading-tight text-lg">{aiAnalysis.transport_analysis.headline}</p>
                        <div className="space-y-4 mb-8">
                           <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-50">
                              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                              <p className="text-xs text-gray-700 font-black tracking-tight">{aiAnalysis.transport_analysis.city1_monthly}</p>
                           </div>
                           <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-50">
                              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                              <p className="text-xs text-gray-700 font-black tracking-tight">{aiAnalysis.transport_analysis.city2_monthly}</p>
                           </div>
                           {aiAnalysis.transport_analysis.petrol_diff && (
                              <div className="bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100 flex items-center gap-2">
                                 <span className="text-sm">⛽</span>
                                 <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{aiAnalysis.transport_analysis.petrol_diff}</p>
                              </div>
                           )}
                        </div>
                        <div className="bg-slate-900 text-white p-4 rounded-[1.5rem] shadow-lg shadow-slate-900/10">
                           <p className="text-[11px] font-bold leading-relaxed opacity-90">{aiAnalysis.transport_analysis.recommendation}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Salary Breakdown */}
                  {aiAnalysis.salary_analysis && hasSalary && (
                    <Section title="Institutional Salary Analytics" icon={<Zap className="w-5 h-5" />}>
                      <div className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-12 flex items-center gap-4">
                         <div className="w-12 h-[2px] bg-blue-500"></div>
                         {aiAnalysis.salary_analysis.headline}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        {([
                          { name: city1, b: aiAnalysis.salary_analysis.city1_breakdown, color: "blue" },
                          { name: city2, b: aiAnalysis.salary_analysis.city2_breakdown, color: "slate" },
                        ] as const).map(({ name, b, color }) => (
                          <div key={name} className="relative">
                            <div className={`absolute -left-6 top-0 bottom-0 w-[2px] bg-gradient-to-b from-${color}-500/30 via-${color}-500/10 to-transparent`}></div>
                            <div className="flex items-center justify-between mb-8">
                               <p className={`font-black text-2xl text-${color}-950 tracking-tighter`}>{name}</p>
                               <div className={`text-[10px] font-black text-${color}-600 bg-${color}-50 border border-${color}-100 px-3 py-1 rounded-full uppercase tracking-widest`}>
                                 Active Node
                               </div>
                            </div>
                            <div className="space-y-5">
                              {[
                                ["Rent & Housing", b.rent, <Home className="w-3.5 h-3.5"/>], 
                                ["Food & Nutrition", b.food, <Coffee className="w-3.5 h-3.5"/>], 
                                ["City Mobility", b.transport, <Car className="w-3.5 h-3.5"/>],
                                ["Essential Utilities", b.utilities, <Zap className="w-3.5 h-3.5"/>], 
                                ["Gross Expenditure", b.total_expense, <Wallet className="w-3.5 h-3.5"/>],
                              ].map(([k, v, icon]) => (
                                <div key={k as string} className={`flex justify-between text-sm items-center py-1 ${k === "Gross Expenditure" ? "font-black border-t-2 border-gray-100 pt-6 mt-4 text-gray-900" : "text-gray-500"}`}>
                                  <div className="flex items-center gap-3 uppercase text-[10px] font-black tracking-[0.15em] opacity-60">
                                     {icon}
                                     {k}
                                  </div>
                                  <span className="font-extrabold text-gray-900">{v}</span>
                                </div>
                              ))}
                              
                              <div className={`mt-10 bg-gradient-to-br from-${color === 'blue' ? 'blue-600' : 'slate-800'} to-${color === 'blue' ? 'indigo-700' : 'slate-900'} rounded-[2rem] p-7 text-white shadow-2xl shadow-${color}-500/20 relative overflow-hidden group`}>
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                   <TrendingUp className="w-12 h-12" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-3">Disposable Retained Capital</p>
                                <div className="flex justify-between items-end relative z-10">
                                   <p className="text-3xl font-black">{b.monthly_savings}</p>
                                   <div className="bg-white/20 px-3 py-1.5 rounded-xl text-[10px] font-black border border-white/10 backdrop-blur-sm">
                                      {b.savings_percentage} EFFICIENCY
                                   </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {aiAnalysis.salary_analysis.verdict && (
                        <div className="mt-16 p-8 bg-blue-50/50 rounded-[2.5rem] border-2 border-dashed border-blue-200 text-center relative overflow-hidden group">
                          <Sparkles className="absolute top-4 left-4 w-5 h-5 text-blue-300 opacity-40 animate-pulse" />
                          <p className="text-base text-blue-950 font-black italic relative z-10 leading-relaxed max-w-3xl mx-auto">
                            "{aiAnalysis.salary_analysis.verdict}"
                          </p>
                        </div>
                      )}
                    </Section>
                  )}

                  {/* Benefits & Pros/Cons */}
                  {aiAnalysis.benefits && (
                    <Section title="Comparative Benefits & Tradeoffs" icon={<Activity className="w-5 h-5" />}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {[
                          { city: city1, pros: aiAnalysis.benefits.city1_pros, cons: aiAnalysis.benefits.city1_cons, color: "blue" },
                          { city: city2, pros: aiAnalysis.benefits.city2_pros, cons: aiAnalysis.benefits.city2_cons, color: "slate" },
                        ].map(({ city, pros, cons, color }) => (
                          <div key={city}>
                            <p className={`font-black text-xl text-${color}-950 mb-8 tracking-tighter flex items-center gap-3`}>
                               <div className={`w-2 h-2 rounded-full bg-${color}-500 shadow-[0_0_8px_rgba(0,0,0,0.1)]`}></div>
                               {city}
                            </p>
                            <div className="space-y-4 mb-8">
                              {pros?.map((p, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 group hover:bg-emerald-50 transition-colors">
                                  <div className="bg-emerald-500 rounded-full p-1 mt-0.5 group-hover:scale-110 transition-transform shadow-md shadow-emerald-500/20">
                                    <CheckCircle className="w-3 h-3 text-white" />
                                  </div>
                                  <span className="text-sm text-gray-800 font-bold tracking-tight">{p}</span>
                                </div>
                              ))}
                            </div>
                            <div className="space-y-3">
                              {cons?.map((c, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-red-50/30 border border-red-100/30">
                                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-gray-500 font-medium leading-relaxed">{c}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Where to Live */}
                  {aiAnalysis.where_to_live && (
                    <Section title="Neighborhood Intelligence" icon={<MapPin className="w-5 h-5" />}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        {[
                          { city: city1, areas: aiAnalysis.where_to_live.city1_areas, color: "blue" },
                          { city: city2, areas: aiAnalysis.where_to_live.city2_areas, color: "slate" },
                        ].map(({ city, areas, color }) => (
                          <div key={city}>
                            <p className={`font-black text-[10px] uppercase tracking-[0.3em] text-${color}-400 mb-8 flex items-center gap-3`}>
                               <MapPin className="w-4 h-4" />
                               GEOGRAPHIC FOOTPRINT: {city}
                            </p>
                            <div className="grid grid-cols-1 gap-5">
                              {[
                                { label: "Budget-Friendly", val: areas.affordable, icon: "🟢", bg: "bg-emerald-50/50", text: "text-emerald-700", border: "border-emerald-100/50", dot: "bg-emerald-500" },
                                { label: "Mid-Range", val: areas.mid_range, icon: "🟡", bg: "bg-amber-50/50", text: "text-amber-700", border: "border-amber-100/50", dot: "bg-amber-500" },
                                { label: "Premium", val: areas.premium, icon: "🔵", bg: "bg-blue-50/50", text: "text-blue-700", border: "border-blue-100/50", dot: "bg-blue-500" },
                              ].map(({ label, val, bg, text, border, dot }) => (
                                <div key={label} className={`${bg} ${border} border rounded-[1.5rem] p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden`}>
                                  <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                       <div className={`w-2 h-2 rounded-full ${dot}`}></div>
                                       <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${text}`}>{label}</p>
                                    </div>
                                    <ArrowRight className={`w-4 h-4 ${text} opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0 duration-500`} />
                                  </div>
                                  <p className="text-sm text-gray-900 font-extrabold leading-relaxed">{val}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Broker Contacts */}
                  {aiAnalysis.broker_contacts && (
                    <Section title="Verified Logistics & Real Estate" icon={<Phone className="w-5 h-5" />}>
                      <div className="flex items-start gap-4 mb-10 bg-blue-50 p-6 rounded-[2rem] border border-blue-100 shadow-inner">
                        <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                           <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                           <p className="text-blue-950 font-black text-sm uppercase tracking-widest mb-1">Institutional Support</p>
                           <p className="text-xs text-blue-800 font-medium opacity-80 leading-relaxed">
                              Access our curated network of verified brokers and agents. Call directly to initiate listing discovery or schedule viewings.
                           </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {[
                          { data: aiAnalysis.broker_contacts.city1, color: "blue", icon: <Building2 className="w-4 h-4" /> },
                          { data: aiAnalysis.broker_contacts.city2, color: "slate", icon: <MapPin className="w-4 h-4" /> },
                        ].map(({ data, color, icon }) => (
                          <div key={data.name}>
                            <p className={`font-black text-[10px] uppercase tracking-[0.2em] text-${color}-400 mb-6 flex items-center gap-2`}>
                               {icon} {data.name} AGENT DIRECTORY
                            </p>
                            <div className="space-y-4 mb-8">
                              {data.brokers?.map((b) => (
                                <div key={b.name} className="flex items-center justify-between bg-white border border-gray-100 rounded-[1.5rem] p-5 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all group">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all duration-300">
                                       <Users className="w-6 h-6" />
                                    </div>
                                    <div>
                                      <p className="text-base font-black text-gray-900 tracking-tight">{b.name}</p>
                                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{b.area}</p>
                                    </div>
                                  </div>
                                  <a href={`tel:${b.phone}`}
                                    className="p-4 bg-gray-50 text-gray-900 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm border border-gray-100 group-hover:border-transparent">
                                    <Phone className="w-5 h-5" />
                                  </a>
                                </div>
                              ))}
                            </div>
                            {data.pg_hubs?.length > 0 && (
                              <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">PG & Coliving Cluster Centers</p>
                                <div className="flex flex-wrap gap-2.5">
                                  {data.pg_hubs.map(hub => (
                                    <span key={hub} className="bg-white border border-gray-200 text-gray-900 text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-sm hover:border-blue-300 transition-colors cursor-default">{hub}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Lifestyle */}
                  {aiAnalysis.lifestyle_comparison && (
                    <Section title="Vibe & Lifestyle Pulse" icon={<Activity className="w-5 h-5" />}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-12">
                        {[
                          { city: city1, highlights: aiAnalysis.lifestyle_comparison.city1_highlights, color: "blue", icon: <Sparkles className="w-5 h-5 text-blue-500" /> },
                          { city: city2, highlights: aiAnalysis.lifestyle_comparison.city2_highlights, color: "slate", icon: <Zap className="w-5 h-5 text-slate-500" /> },
                        ].map(({ city, highlights, color, icon }) => (
                          <div key={city}>
                            <p className={`font-black text-2xl text-${color}-950 mb-8 tracking-tighter flex items-center gap-4`}>
                               {icon} {city}
                            </p>
                            <div className="flex flex-wrap gap-3">
                              {highlights?.map((h, i) => (
                                <span key={i} className={`bg-${color}-50 text-${color}-950 border border-${color}-200/50 text-[11px] font-black px-4 py-2 rounded-2xl uppercase tracking-widest flex items-center gap-3 shadow-sm hover:scale-105 transition-transform duration-300`}>
                                   <div className={`w-2 h-2 rounded-full bg-${color}-500 shadow-[0_0_8px_rgba(0,0,0,0.1)]`}></div>
                                   {h}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-gray-100">
                        <div className="bg-blue-50/40 rounded-[2rem] p-8 border border-blue-50 shadow-sm group hover:shadow-xl transition-shadow">
                          <div className="text-[10px] text-blue-500 uppercase font-black tracking-[0.3em] mb-4 flex items-center gap-3">
                             <Activity className="w-4 h-4" /> Fitness & Wellness
                          </div>
                          <p className="text-base text-blue-950 font-bold leading-relaxed italic opacity-90 group-hover:opacity-100 transition-opacity">"{aiAnalysis.lifestyle_comparison.gym_diff}"</p>
                        </div>
                        <div className="bg-indigo-50/40 rounded-[2rem] p-8 border border-indigo-50 shadow-sm group hover:shadow-xl transition-shadow">
                          <div className="text-[10px] text-indigo-500 uppercase font-black tracking-[0.3em] mb-4 flex items-center gap-3">
                             <Heart className="w-4 h-4" /> Social & Leisure
                          </div>
                          <p className="text-base text-indigo-950 font-bold leading-relaxed italic opacity-90 group-hover:opacity-100 transition-opacity">"{aiAnalysis.lifestyle_comparison.entertainment_diff}"</p>
                        </div>
                      </div>
                    </Section>
                  )}

                  {/* Final Recommendation */}
                  {aiAnalysis.final_recommendation && (
                    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-[3rem] p-12 shadow-2xl shadow-indigo-950/30 relative overflow-hidden group border border-white/5">
                      <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                      <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-[2px] bg-indigo-500"></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400">Final Strategic Recommendation</p>
                      </div>
                      <div className="flex flex-col md:flex-row gap-10 items-center md:items-start relative z-10">
                         <div className="w-24 h-24 rounded-[2rem] bg-white/10 flex items-center justify-center text-5xl shadow-inner border border-white/10 shrink-0 group-hover:rotate-12 transition-transform duration-500">
                           🎯
                         </div>
                         <div className="space-y-4">
                            <p className="text-2xl leading-relaxed font-black tracking-tight italic opacity-95 group-hover:opacity-100 transition-opacity">"{aiAnalysis.final_recommendation}"</p>
                            <p className="text-xs font-bold uppercase tracking-widest text-indigo-300 opacity-60">Verified AI Strategic Match</p>
                         </div>
                      </div>
                    </div>
                  )}

                  {/* Moving Checklist */}
                  {aiAnalysis.moving_checklist && aiAnalysis.moving_checklist.length > 0 && (
                    <Section title="Relocation Operational Checklist" icon={<CheckCircle className="w-5 h-5" />}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {aiAnalysis.moving_checklist.map((item, i) => (
                          <div key={i} className="flex items-center gap-5 p-6 rounded-2xl bg-gray-50 border border-gray-100 group hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all duration-300">
                            <span className="bg-blue-600 text-white font-black rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0 text-base shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                              {i + 1}
                            </span>
                            <span className="text-gray-900 font-bold text-sm tracking-tight leading-relaxed">{item}</span>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}
                </div>
              )}
            </div>

            {/* Full Category Comparison Table */}
            <div className="mt-20">
              <div className="flex items-center gap-4 mb-10">
                 <div className="h-px w-12 bg-gray-200"></div>
                 <h2 className="text-2xl font-black text-gray-900 tracking-tight">Granular Price Comparison</h2>
              </div>
              
              {result.city1.categories.map((cat1, ci) => {
                const cat2 = result.city2.categories[ci];
                if (!cat2) return null;
                return (
                  <div key={cat1.id} className="mb-10 bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 px-8 py-5 bg-gray-50/50 border-b border-gray-100">
                      <span className="text-2xl drop-shadow-sm">{cat1.icon}</span>
                      <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest">{cat1.name}</h3>
                    </div>
                    <div className="grid grid-cols-[1fr_150px_150px] px-8 py-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 bg-white">
                      <span>Item Specification</span>
                      <span className="text-blue-600 text-center">{city1}</span>
                      <span className="text-slate-600 text-center">{city2}</span>
                    </div>
                    {cat1.items.map((item, idx) => {
                      const item2 = cat2.items[idx];
                      if (!item2) return null;
                      const n1 = item.numeric, n2 = item2.numeric;
                      return (
                        <div key={item.label}
                          className={`grid grid-cols-[1fr_150px_150px] px-8 py-5 border-b border-gray-50 last:border-0 text-sm hover:bg-gray-50/30 transition-colors ${idx % 2 ? "bg-gray-50/10" : ""}`}>
                          <div>
                            <p className="font-bold text-gray-800 tracking-tight">{item.label}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">{item.unit}</p>
                          </div>
                          <p className={`font-black self-center text-center ${n1 > 0 && n2 > 0 && n1 < n2 ? "text-emerald-600" : "text-gray-700"}`}>{item.value}</p>
                          <div className="flex items-center justify-center gap-3 self-center">
                            <p className={`font-black ${n1 > 0 && n2 > 0 && n2 < n1 ? "text-emerald-600" : "text-gray-700"}`}>{item2.value}</p>
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

        {!result && !loadingData && (
          <div className="max-w-5xl mx-auto px-6 py-24 text-center">
            <p className="text-5xl mb-4">🏙️</p>
            <p className="text-xl font-semibold text-gray-700">Select two cities above to start comparing</p>
            <p className="text-gray-400 text-sm mt-2">Get side-by-side prices, affordability, broker contacts, and AI analysis</p>
          </div>
        )}
        {loadingData && (
          <div className="max-w-5xl mx-auto px-6 py-24 text-center">
            <div className="animate-spin h-10 w-10 border-b-2 border-blue-500 rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Loading city comparison data…</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default function ComparePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-blue-500 rounded-full" /></div>}>
      <ComparePage />
    </Suspense>
  );
}
