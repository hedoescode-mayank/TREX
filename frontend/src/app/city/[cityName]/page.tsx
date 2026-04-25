"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface CityItem {
  label: string;
  unit: string;
  value: string;
  numeric: number;
}
interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  items: CityItem[];
}
interface CityDetail {
  city: string;
  index: number;
  meta: { state: string; population: string; desc: string; region: string; type: string };
  key_stats: { veg_thali: string; rent_1bhk_centre: string; pg_double: string; petrol: string };
  categories: Category[];
  normalized: Record<string, number>;
}
interface CityListItem {
  city: string;
  index: number;
}

const COMPARE_SUGGESTIONS: Record<string, string[]> = {
  Mumbai: ["Delhi", "Bangalore", "Pune", "Hyderabad", "Chennai"],
  Delhi: ["Mumbai", "Bangalore", "Chandigarh", "Noida", "Gurgaon"],
  Bangalore: ["Hyderabad", "Pune", "Chennai", "Mumbai", "Noida"],
  Hyderabad: ["Bangalore", "Pune", "Chennai", "Mumbai", "Kolkata"],
  default: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune"],
};

export default function CityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cityName = decodeURIComponent(params.cityName as string);

  const [data, setData] = useState<CityDetail | null>(null);
  const [allCities, setAllCities] = useState<CityListItem[]>([]);
  const [compareTo, setCompareTo] = useState("");
  const [salary, setSalary] = useState("60000");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const catRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/city/${encodeURIComponent(cityName)}`).then((r) => r.json()),
      fetch(`${API}/api/cities`).then((r) => r.json()),
    ])
      .then(([detail, list]) => {
        if (detail.detail) { setError(detail.detail); setLoading(false); return; }
        setData(detail);
        setAllCities((list.cities || []).filter((c: CityListItem) => c.city !== cityName));
        setLoading(false);
      })
      .catch(() => { setError("Failed to load city data."); setLoading(false); });
  }, [cityName]);

  const scrollTo = (id: string) => {
    catRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCompare = () => {
    if (!compareTo) return;
    const s = salary ? `&salary=${salary}` : "";
    router.push(`/city/compare?city1=${encodeURIComponent(cityName)}&city2=${encodeURIComponent(compareTo)}${s}`);
  };

  const suggestions = COMPARE_SUGGESTIONS[cityName] || COMPARE_SUGGESTIONS.default;

  if (loading) return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-10 w-10 border-b-2 border-blue-500 rounded-full" />
          <p className="text-gray-500 text-sm">Loading {cityName} data...</p>
        </div>
      </div>
    </ProtectedRoute>
  );

  if (error || !data) return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-500 text-lg font-semibold">{error || "City not found"}</p>
          <button onClick={() => router.push("/city")} className="mt-3 text-blue-600 text-sm hover:underline">
            ← Back to all cities
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );

  const { meta, key_stats, categories, index } = data;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 font-sans">
        {/* Nav */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-3 flex items-center gap-4">
          <span
            className="text-xl font-bold tracking-tight cursor-pointer"
            onClick={() => router.push("/")}
          >
            trex<span className="text-blue-500">.ai</span>
          </span>
          <div className="text-gray-400 text-sm">
            <button onClick={() => router.push("/city")} className="hover:text-blue-600 transition-colors">
              Cities
            </button>
            <span className="mx-2">/</span>
            <span className="text-gray-700 font-medium">{cityName}</span>
          </div>
        </nav>

        {/* Hero */}
        <div className="relative bg-gray-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900 opacity-95" />
          <div className="relative max-w-6xl mx-auto px-6 py-10">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
              {meta.region} &bull; {meta.type} &bull; Pop. {meta.population}
            </p>
            <div className="flex items-start justify-between flex-wrap gap-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">Cost of Living in {cityName}</h1>
                <p className="text-sm text-blue-300 mb-1">{meta.state}</p>
                <p className="text-gray-300 max-w-xl text-sm leading-relaxed">{meta.desc}</p>
              </div>
              {/* Cost Index Badge */}
              <div className="bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-center min-w-[120px]">
                <p className="text-xs text-gray-300 mb-1">Cost Index</p>
                <p className="text-5xl font-black">{index}</p>
                <p className="text-xs text-gray-400 mt-1">Mumbai = 100</p>
              </div>
            </div>

            {/* Quick stat boxes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-7">
              {[
                { label: "Veg Thali", val: key_stats.veg_thali },
                { label: "1BHK (Centre)", val: key_stats.rent_1bhk_centre },
                { label: "PG Double Sharing", val: key_stats.pg_double },
                { label: "Petrol", val: key_stats.petrol },
              ].map((s) => (
                <div key={s.label} className="bg-white/10 border border-white/20 rounded-xl p-3">
                  <p className="text-gray-400 text-xs">{s.label}</p>
                  <p className="text-white font-bold text-lg mt-0.5">{s.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="bg-white border-b border-gray-200 sticky top-[49px] z-40 px-6 py-3 overflow-x-auto">
          <div className="max-w-6xl mx-auto flex gap-2 text-xs min-w-max">
            <span className="text-gray-400 font-semibold uppercase tracking-widest mr-2 self-center">JUMP TO</span>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollTo(cat.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all font-medium text-gray-600 whitespace-nowrap"
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 py-8 flex gap-8">
          {/* Left — Categories */}
          <div className="flex-1 space-y-10 min-w-0">
            {categories.map((cat) => (
              <section
                key={cat.id}
                ref={(el) => { catRefs.current[cat.id] = el; }}
                className="scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{cat.name}</h2>
                    <p className="text-xs text-gray-400">{cat.description}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 bg-white">
                  <div className="grid grid-cols-[1fr_auto] bg-gray-50 border-b border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <span>Item</span>
                    <span>{cityName}</span>
                  </div>
                  {cat.items.map((item, idx) => (
                    <div
                      key={item.label}
                      className={`grid grid-cols-[1fr_auto] px-4 py-3 border-b border-gray-50 last:border-0 ${idx % 2 === 0 ? "" : "bg-gray-50/50"}`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.unit}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900 self-center">{item.value}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Right Sidebar */}
          <div className="w-72 flex-shrink-0 space-y-5">
            {/* Compare Widget */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-3">Compare {cityName} with</h3>

              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                value={compareTo}
                onChange={(e) => setCompareTo(e.target.value)}
              >
                <option value="">Pick a city to compare...</option>
                {allCities.map((c) => (
                  <option key={c.city} value={c.city}>
                    {c.city} (Index: {c.index})
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Monthly salary (₹)"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              />

              <button
                onClick={handleCompare}
                disabled={!compareTo}
                className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Compare & Analyze →
              </button>

              {/* Quick Links */}
              <div className="mt-4 space-y-1">
                {suggestions
                  .filter((s) => s !== cityName)
                  .slice(0, 5)
                  .map((sug) => (
                    <button
                      key={sug}
                      onClick={() =>
                        router.push(
                          `/city/compare?city1=${encodeURIComponent(cityName)}&city2=${encodeURIComponent(sug)}&salary=${salary}`
                        )
                      }
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-50 text-sm text-gray-700 hover:text-blue-700 transition-colors group"
                    >
                      <span>{cityName} vs {sug}</span>
                      <span className="text-blue-400 group-hover:translate-x-0.5 transition-transform">→</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Other Cities list */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-bold text-gray-900 mb-3">Other Cities</h3>
              <div className="space-y-1">
                {allCities.slice(0, 12).map((c) => (
                  <button
                    key={c.city}
                    onClick={() => router.push(`/city/${encodeURIComponent(c.city)}`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-sm transition-colors"
                  >
                    <span className="text-gray-700">{c.city}</span>
                    <span className="text-xs text-gray-400">Index {c.index}</span>
                  </button>
                ))}
                <button
                  onClick={() => router.push("/city")}
                  className="w-full text-center text-xs text-blue-600 hover:underline pt-1 mt-1"
                >
                  ▶ Show all 54 cities
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
