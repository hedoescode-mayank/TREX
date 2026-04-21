"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type CityResult = {
  city: string;
  total_expense: number;
  savings: number;
  savings_percentage: number;
  comfort_score: number;
  final_city_score: number;
  stress_score: number;
};

export default function CityAnalyzer() {
  const [salary, setSalary] = useState<number>(50000);
  const [sharing, setSharing] = useState<boolean>(true);
  const [bhk, setBhk] = useState<string>("1BHK");
  const [results, setResults] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const analyze = async () => {
    setLoading(true);
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salary_monthly: salary,
          sharing,
          bhk,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || `API Error: ${res.status}`);
      }
      
      const data = await res.json();
      if (data && data.results) {
        setResults(data.results);
      } else {
        throw new Error("No results returned from API");
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "An error occurred while analyzing cities";
      setError(errorMsg);
      setResults([]);
      alert(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col font-sans text-gray-900 selection:bg-blue-200">
      {/* Background */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#fdfdfd]">
        <div className="absolute top-[-10%] left-[10%] w-[50%] h-[600px] bg-gradient-to-br from-orange-100/80 to-amber-50/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[60%] h-[700px] bg-blue-100/60 rounded-full blur-[140px]" />
        <div className="absolute top-[20%] right-[-5%] w-[40%] h-[500px] bg-purple-100/50 rounded-full blur-[130px]" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass-nav px-6 md:px-12 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold tracking-tighter text-black">
          trex<span className="text-blue-500">.ai</span>
        </Link>
        <div className="hidden md:flex items-center gap-10 text-[13px] font-semibold text-gray-600 tracking-wide">
          <Link href="/" className="hover:text-black transition">HOME</Link>
          <span className="text-black border-b-2 border-blue-500 pb-0.5">CITY ANALYZER</span>
        </div>
        <Link href="/">
          <button className="btn-premium px-6 py-2.5 rounded-full text-sm font-medium">
            Back to Home
          </button>
        </Link>
      </nav>

      {/* Page Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full pt-36 px-6 pb-20 space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-3 text-gray-900">City Cost Analyzer</h1>
          <p className="text-gray-500 text-lg">Compare real savings and stress across top Indian cities.</p>
        </div>

        <Card className="glass shadow-xl shadow-gray-200/50">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1 w-full">
              <label htmlFor="salary-input" className="text-sm font-medium text-gray-500">Monthly Salary (₹)</label>
              <input
                id="salary-input"
                aria-label="Monthly Salary in INR"
                type="number"
                value={salary}
                onChange={(e) => {
                  setSalary(Number(e.target.value));
                  setResults([]);
                }}
                className="w-full bg-white border border-gray-200 rounded-md h-10 px-3 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all hover:border-gray-300"
              />
            </div>
            <div className="space-y-2 flex-1 w-full">
              <label htmlFor="bhk-select" className="text-sm font-medium text-gray-500">Accommodation</label>
              <select
                id="bhk-select"
                aria-label="Accommodation type"
                value={bhk}
                onChange={(e) => {
                  setBhk(e.target.value);
                  setResults([]);
                }}
                className="w-full bg-white border border-gray-200 rounded-md h-10 px-3 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all hover:border-gray-300"
              >
                <option value="1BHK">1 BHK</option>
                <option value="2BHK">2 BHK</option>
              </select>
            </div>
            <div className="space-y-2 flex-1 w-full">
              <label htmlFor="living-style" className="text-sm font-medium text-gray-500">Living Style</label>
              <select
                id="living-style"
                aria-label="Living style preference"
                value={sharing ? "shared" : "solo"}
                onChange={(e) => {
                  setSharing(e.target.value === "shared");
                  setResults([]);
                }}
                className="w-full bg-white border border-gray-200 rounded-md h-10 px-3 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all hover:border-gray-300"
              >
                <option value="shared">Sharing</option>
                <option value="solo">Solo</option>
              </select>
            </div>
            <Button onClick={analyze} disabled={loading} className="w-full md:w-auto h-10 md:mb-0 flex items-center bg-gray-900 hover:bg-gray-800 text-white shadow-md">
              {loading ? "Analyzing..." : "Analyze Cities"}
            </Button>
          </CardContent>
        </Card>

        {!results.length && !loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <p className="text-gray-500 text-lg mb-4">Click "Analyze Cities" to compare costs and find your ideal city.</p>
              <p className="text-gray-400 text-sm">Enter your salary, choose accommodation type and living style to begin.</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-500 text-lg">Analyzing cities...</p>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <>
            <Card className="h-[400px] glass shadow-xl shadow-gray-200/50">
              <CardHeader>
                <CardTitle>Savings vs Expenses Overview</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results}>
                    <XAxis dataKey="city" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#f1f5f9", color: "#111", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                    <Bar dataKey="savings" stackId="a" fill="#10b981" name="Monthly Savings (₹)" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="total_expense" stackId="a" fill="#3b82f6" name="Total Expenses (₹)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {results.map((r, i) => (
                <Card key={r.city} className={`glass shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${i === 0 ? "border-emerald-200 bg-emerald-50/40" : ""}`}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center text-xl">
                      {r.city}
                      {i === 0 && <span className="px-3 py-1 text-[11px] uppercase tracking-wider font-bold bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">Top Pick</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-gray-500 text-sm font-medium">Final Score</span>
                      <span className="font-bold text-xl text-blue-600">{r.final_city_score.toFixed(1)} <span className="text-xs font-normal text-gray-400">/ 100</span></span>
                    </div>
                    <div className="flex justify-between items-center text-[15px]">
                      <span className="text-gray-500 font-medium">Monthly Savings</span>
                      <span className="font-bold text-emerald-600">₹{r.savings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[15px]">
                      <span className="text-gray-500 font-medium">Savings Return</span>
                      <span className="font-semibold text-gray-900">{r.savings_percentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-[15px]">
                      <span className="text-gray-500 font-medium">Stress Level</span>
                      <span className="font-semibold text-orange-500">{r.stress_score} / 10</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
