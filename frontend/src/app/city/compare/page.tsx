"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";

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

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
        <span className="text-xl">{icon}</span>
        <h2 className="font-bold text-gray-900 text-lg">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
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
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl px-7 py-4 flex items-center gap-3 shadow-md">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-0.5">AI Verdict</p>
                  <p className="font-bold text-lg leading-tight">{aiAnalysis.verdict}</p>
                </div>
              </div>
            )}

            {/* City Header */}
            <div className="grid grid-cols-2 gap-4">
              {[result.city1, result.city2].map(c => (
                <div key={c.name}
                  onClick={() => router.push(`/city/${encodeURIComponent(c.name)}`)}
                  className="bg-gray-900 text-white rounded-2xl p-5 cursor-pointer hover:bg-gray-800 transition-colors">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">{c.meta.type} • {c.meta.state}</p>
                  <p className="text-2xl font-bold mt-1">{c.name}</p>
                  <p className="text-gray-400 text-xs mt-1 line-clamp-2">{c.meta.desc}</p>
                </div>
              ))}
            </div>

            {/* Affordability */}
            {hasSalary && aff1?.savings !== undefined && aff2?.savings !== undefined && (
              <Section title={`Affordability at ₹${parseInt(salary).toLocaleString("en-IN")}/mo salary`} icon="💰">
                <div className="grid grid-cols-2 gap-5">
                  {[{ city: city1, aff: aff1 }, { city: city2, aff: aff2 }].map(({ city, aff }) => (
                    <div key={city}>
                      <p className="font-bold text-gray-800 mb-3 text-base">{city}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Total Expenses</span>
                          <span className="font-semibold">{fmt(aff.total_expense)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Monthly Savings</span>
                          <span className={`font-bold ${(aff.savings || 0) > 0 ? "text-emerald-600" : "text-red-500"}`}>{fmt(aff.savings)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Savings Rate</span>
                          <span className="font-semibold">{aff.savings_percentage?.toFixed(1)}%</span>
                        </div>
                        <div className="mt-3 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, aff.savings_percentage || 0))}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Key Metric Comparison */}
            <Section title="Key Metric Comparison" icon="📊">
              <div className="grid grid-cols-[1fr_1fr_1fr] text-xs text-gray-400 uppercase tracking-wider mb-3 font-semibold pb-2 border-b border-gray-100">
                <span>Metric</span>
                <span className="text-blue-600">{city1}</span>
                <span className="text-purple-600">{city2}</span>
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
                <div key={label} className="grid grid-cols-[1fr_1fr_1fr] text-sm py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-500">{label}</span>
                  <span className={`font-semibold ${v1 < v2 ? "text-emerald-600" : "text-gray-700"}`}>{fmt(v1)}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${v2 < v1 ? "text-emerald-600" : "text-gray-700"}`}>{fmt(v2)}</span>
                    <DiffChip a={v1} b={v2} />
                  </div>
                </div>
              ))}
            </Section>

            {/* ─── AI ANALYSIS SECTION ─── */}
            <div className="border-t-2 border-blue-100 pt-2">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900">AI Analysis</h2>
                {loadingAI && (
                  <span className="flex items-center gap-1.5 text-sm text-blue-500 font-medium">
                    <span className="animate-spin h-4 w-4 border-b-2 border-blue-500 rounded-full inline-block" />
                    Generating detailed analysis…
                  </span>
                )}
                {aiError && <span className="text-sm text-red-500">{aiError}</span>}
              </div>

              {loadingAI && !aiAnalysis && <AISkeletonLoader />}

              {aiAnalysis && (
                <div className="space-y-5">
                  {/* Executive Summary */}
                  {aiAnalysis.summary && (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Executive Summary</p>
                      <p className="text-gray-800 leading-relaxed">{aiAnalysis.summary}</p>
                    </div>
                  )}

                  {/* 3-col analysis blocks */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {aiAnalysis.rent_analysis && (
                      <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">🏠 Rent & Housing</p>
                        <p className="font-semibold text-gray-800 mb-3 text-sm">{aiAnalysis.rent_analysis.headline}</p>
                        <div className="space-y-1.5 text-xs text-gray-600">
                          <p><span className="font-semibold text-blue-600">{city1}:</span> {aiAnalysis.rent_analysis.city1_breakdown}</p>
                          <p><span className="font-semibold text-purple-600">{city2}:</span> {aiAnalysis.rent_analysis.city2_breakdown}</p>
                          <p className="text-emerald-600 font-semibold mt-2">💸 {aiAnalysis.rent_analysis.monthly_saving}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">{aiAnalysis.rent_analysis.recommendation}</p>
                      </div>
                    )}
                    {aiAnalysis.food_analysis && (
                      <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">🍽️ Food & Dining</p>
                        <p className="font-semibold text-gray-800 mb-3 text-sm">{aiAnalysis.food_analysis.headline}</p>
                        <div className="space-y-1.5 text-xs text-gray-600">
                          <p><span className="font-semibold text-blue-600">{city1} daily:</span> {aiAnalysis.food_analysis.city1_daily}</p>
                          <p><span className="font-semibold text-purple-600">{city2} daily:</span> {aiAnalysis.food_analysis.city2_daily}</p>
                          <p className="text-emerald-600 font-semibold mt-2">💸 {aiAnalysis.food_analysis.monthly_diff}/month difference</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">💡 {aiAnalysis.food_analysis.tip}</p>
                      </div>
                    )}
                    {aiAnalysis.transport_analysis && (
                      <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">🚗 Transport</p>
                        <p className="font-semibold text-gray-800 mb-3 text-sm">{aiAnalysis.transport_analysis.headline}</p>
                        <div className="space-y-1.5 text-xs text-gray-600">
                          <p><span className="font-semibold text-blue-600">{city1}:</span> {aiAnalysis.transport_analysis.city1_monthly}</p>
                          <p><span className="font-semibold text-purple-600">{city2}:</span> {aiAnalysis.transport_analysis.city2_monthly}</p>
                          {aiAnalysis.transport_analysis.petrol_diff && (
                            <p className="text-gray-500 mt-1">⛽ {aiAnalysis.transport_analysis.petrol_diff}</p>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">{aiAnalysis.transport_analysis.recommendation}</p>
                      </div>
                    )}
                  </div>

                  {/* Salary Breakdown */}
                  {aiAnalysis.salary_analysis && hasSalary && (
                    <Section title="Detailed Salary Breakdown" icon="💼">
                      <p className="text-sm font-semibold text-gray-700 mb-4 italic">{aiAnalysis.salary_analysis.headline}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {([
                          { name: city1, b: aiAnalysis.salary_analysis.city1_breakdown, color: "blue" },
                          { name: city2, b: aiAnalysis.salary_analysis.city2_breakdown, color: "purple" },
                        ] as const).map(({ name, b, color }) => (
                          <div key={name}>
                            <p className={`font-bold text-${color}-600 mb-3`}>{name}</p>
                            <div className="space-y-2">
                              {[
                                ["Rent", b.rent], ["Food", b.food], ["Transport", b.transport],
                                ["Utilities", b.utilities], ["Total Expense", b.total_expense],
                              ].map(([k, v]) => (
                                <div key={k} className={`flex justify-between text-sm ${k === "Total Expense" ? "font-bold border-t border-gray-100 pt-2 mt-2" : ""}`}>
                                  <span className="text-gray-500">{k}</span>
                                  <span className="text-gray-800">{v}</span>
                                </div>
                              ))}
                              <div className="flex justify-between text-sm font-bold text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 mt-2">
                                <span>Monthly Savings</span>
                                <span>{b.monthly_savings} ({b.savings_percentage})</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {aiAnalysis.salary_analysis.verdict && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                          <p className="text-sm text-blue-800 font-medium">{aiAnalysis.salary_analysis.verdict}</p>
                        </div>
                      )}
                    </Section>
                  )}

                  {/* Benefits & Pros/Cons */}
                  {aiAnalysis.benefits && (
                    <Section title="Benefits & Tradeoffs" icon="⚖️">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { city: city1, pros: aiAnalysis.benefits.city1_pros, cons: aiAnalysis.benefits.city1_cons, color: "blue" },
                          { city: city2, pros: aiAnalysis.benefits.city2_pros, cons: aiAnalysis.benefits.city2_cons, color: "purple" },
                        ].map(({ city, pros, cons, color }) => (
                          <div key={city}>
                            <p className={`font-bold text-${color}-600 mb-3 text-base`}>{city}</p>
                            <div className="space-y-1.5 mb-4">
                              {pros?.map((p, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                  <span className="text-emerald-500 mt-0.5 font-bold">✓</span>
                                  <span className="text-gray-700">{p}</span>
                                </div>
                              ))}
                            </div>
                            <div className="space-y-1.5">
                              {cons?.map((c, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                  <span className="text-red-400 mt-0.5 font-bold">✕</span>
                                  <span className="text-gray-500">{c}</span>
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
                    <Section title="Where to Live" icon="📍">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { city: city1, areas: aiAnalysis.where_to_live.city1_areas, color: "blue" },
                          { city: city2, areas: aiAnalysis.where_to_live.city2_areas, color: "purple" },
                        ].map(({ city, areas, color }) => (
                          <div key={city}>
                            <p className={`font-bold text-${color}-600 mb-3`}>{city}</p>
                            <div className="space-y-3">
                              {[
                                { label: "🟢 Budget-Friendly", val: areas.affordable },
                                { label: "🟡 Mid-Range", val: areas.mid_range },
                                { label: "🔵 Premium", val: areas.premium },
                              ].map(({ label, val }) => (
                                <div key={label} className="bg-gray-50 rounded-xl p-3">
                                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                                  <p className="text-sm text-gray-700">{val}</p>
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
                    <Section title="Broker & Agent Contacts" icon="📞">
                      <p className="text-xs text-gray-400 mb-4">Real estate agents who operate in these cities — call directly to enquire about rental listings.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { data: aiAnalysis.broker_contacts.city1, color: "blue" },
                          { data: aiAnalysis.broker_contacts.city2, color: "purple" },
                        ].map(({ data, color }) => (
                          <div key={data.name}>
                            <p className={`font-bold text-${color}-600 mb-3`}>{data.name}</p>
                            <div className="space-y-2.5 mb-4">
                              {data.brokers?.map((b) => (
                                <div key={b.name} className="flex items-start justify-between bg-gray-50 rounded-xl p-3">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">{b.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{b.area}</p>
                                  </div>
                                  <a href={`tel:${b.phone}`}
                                    className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1">
                                    📞 {b.phone}
                                  </a>
                                </div>
                              ))}
                            </div>
                            {data.pg_hubs?.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Popular PG Hubs</p>
                                <div className="flex flex-wrap gap-2">
                                  {data.pg_hubs.map(hub => (
                                    <span key={hub} className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">{hub}</span>
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
                    <Section title="Lifestyle Comparison" icon="🎬">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        {[
                          { city: city1, highlights: aiAnalysis.lifestyle_comparison.city1_highlights },
                          { city: city2, highlights: aiAnalysis.lifestyle_comparison.city2_highlights },
                        ].map(({ city, highlights }) => (
                          <div key={city}>
                            <p className="font-bold text-gray-800 mb-2">{city}</p>
                            <ul className="space-y-1.5">
                              {highlights?.map((h, i) => (
                                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                  <span className="text-blue-400 mt-0.5">•</span>{h}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Gym</p>
                          <p className="text-gray-700">{aiAnalysis.lifestyle_comparison.gym_diff}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Entertainment</p>
                          <p className="text-gray-700">{aiAnalysis.lifestyle_comparison.entertainment_diff}</p>
                        </div>
                      </div>
                    </Section>
                  )}

                  {/* Final Recommendation */}
                  {aiAnalysis.final_recommendation && (
                    <div className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white rounded-2xl p-7 shadow-lg">
                      <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-2">Final Recommendation</p>
                      <p className="text-lg leading-relaxed font-medium">{aiAnalysis.final_recommendation}</p>
                    </div>
                  )}

                  {/* Moving Checklist */}
                  {aiAnalysis.moving_checklist && aiAnalysis.moving_checklist.length > 0 && (
                    <Section title="Moving Checklist" icon="✅">
                      <div className="space-y-2.5">
                        {aiAnalysis.moving_checklist.map((item, i) => (
                          <div key={i} className="flex items-start gap-3 text-sm">
                            <span className="bg-blue-100 text-blue-700 font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs mt-0.5">
                              {i + 1}
                            </span>
                            <span className="text-gray-700">{item}</span>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}
                </div>
              )}
            </div>

            {/* Full Category Comparison Table */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Full Price Comparison</h2>
              {result.city1.categories.map((cat1, ci) => {
                const cat2 = result.city2.categories[ci];
                if (!cat2) return null;
                return (
                  <div key={cat1.id} className="mb-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 border-b border-gray-200">
                      <span>{cat1.icon}</span>
                      <h3 className="font-bold text-gray-800 text-sm">{cat1.name}</h3>
                    </div>
                    <div className="grid grid-cols-[1fr_150px_150px] px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <span>Item</span>
                      <span className="text-blue-500">{city1}</span>
                      <span className="text-purple-500">{city2}</span>
                    </div>
                    {cat1.items.map((item, idx) => {
                      const item2 = cat2.items[idx];
                      if (!item2) return null;
                      const n1 = item.numeric, n2 = item2.numeric;
                      return (
                        <div key={item.label}
                          className={`grid grid-cols-[1fr_150px_150px] px-5 py-3 border-b border-gray-50 last:border-0 text-sm ${idx % 2 ? "bg-gray-50/40" : ""}`}>
                          <div>
                            <p className="font-medium text-gray-800">{item.label}</p>
                            <p className="text-xs text-gray-400">{item.unit}</p>
                          </div>
                          <p className={`font-semibold self-center ${n1 > 0 && n2 > 0 && n1 < n2 ? "text-emerald-600" : "text-gray-700"}`}>{item.value}</p>
                          <div className="flex items-center gap-1.5 self-center">
                            <p className={`font-semibold ${n1 > 0 && n2 > 0 && n2 < n1 ? "text-emerald-600" : "text-gray-700"}`}>{item2.value}</p>
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
