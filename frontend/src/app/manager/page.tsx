"use client";

import React, { useEffect, useState } from "react";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, limit } from "firebase/firestore";
import { 
  Card, CardHeader, CardTitle, CardContent 
} from "@/components/ui/card";
import { 
  Users, Briefcase, Filter, Search, 
  ArrowUpRight, Mail, MapPin, Calendar, 
  ChevronRight, LayoutDashboard, Settings,
  LogOut, Shield, TrendingUp, Sparkles
} from "lucide-react";

interface MatchSubmission {
  id: string;
  userEmail: string;
  targetRole: string;
  preferredLocation: string;
  matchScore: number;
  missingSkills: string[];
  jobReadinessScore: number;
  createdAt: any;
  resumeFileName: string;
}

export default function ManagerDashboard() {
  const [submissions, setSubmissions] = useState<MatchSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("");

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const q = query(
          collection(db, "careerMatches"),
          orderBy("createdAt", "desc"),
          limit(50)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MatchSubmission[];
        setSubmissions(data);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const filteredSubmissions = submissions.filter(s => 
    s.targetRole.toLowerCase().includes(filterRole.toLowerCase())
  );

  return (
    <RoleProtectedRoute allowedRoles={["manager", "admin"]}>
      <div className="flex min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-orange-500/30">
        {/* Premium Sidebar */}
        <aside className="w-72 bg-[#0f0e13] border-r border-white/5 hidden lg:flex flex-col">
          <div className="p-10">
            <Link href="/" className="text-2xl font-black tracking-tighter text-white">
              trex<span className="text-orange-500">.ai</span>
            </Link>
          </div>
          <nav className="flex-1 px-6 space-y-2">
            <div className="px-4 py-3 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">General</div>
            <Link href="/manager" className="flex items-center gap-4 px-4 py-3.5 bg-orange-500/10 text-orange-500 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-orange-500/20">
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </Link>
            <Link href="/" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
              <Users className="w-4 h-4" />
              Applicants
            </Link>
            <div className="px-4 py-3 mt-6 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">System</div>
            <Link href="/" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
              <Shield className="w-4 h-4" />
              Roles & Access
            </Link>
            <Link href="/" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </nav>
          <div className="p-6 border-t border-white/5">
             <Link href="/" className="flex items-center gap-4 px-4 py-3.5 text-red-500 hover:bg-red-500/10 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
              <LogOut className="w-4 h-4" />
              Exit Dashboard
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Premium Header */}
          <header className="h-20 bg-[#0f0e13]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-10">
            <div className="flex items-center gap-6 flex-1 max-w-2xl">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input 
                  type="text" 
                  placeholder="Search submissions by role..."
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full bg-[#1a191f]/50 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-[13px] font-medium text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all placeholder:text-gray-700"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-3 px-4 py-2 bg-orange-500/10 text-orange-500 rounded-full text-[10px] font-black border border-orange-500/20 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div>
                  LIVE FEED
               </div>
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-[1px]">
                  <div className="w-full h-full rounded-[11px] bg-[#0f0e13] flex items-center justify-center font-black text-xs text-white uppercase">
                     AD
                  </div>
               </div>
            </div>
          </header>

          <div className="p-10 overflow-y-auto space-y-10">
            <div className="flex items-end justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[9px] font-black tracking-[0.2em] uppercase mb-3">
                  <Sparkles className="w-3 h-3" />
                  Management Suite
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter">Applicant Pipeline</h1>
                <p className="text-gray-500 font-medium mt-2">Monitor career matchmaking submissions and match scores across the system.</p>
              </div>
              <div className="flex gap-4">
                 <button className="flex items-center gap-3 px-5 py-3 bg-[#1a191f] border border-white/5 rounded-2xl text-[11px] font-black text-gray-400 hover:text-white transition-all uppercase tracking-widest">
                    <Filter className="w-4 h-4 text-orange-500" />
                    Filters
                 </button>
                 <button className="px-6 py-3 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-white/5 hover:scale-105 transition-all">
                    Export Data
                 </button>
              </div>
            </div>

            {/* Quick Stats - Premium Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { label: "Total Applications", value: submissions.length, icon: Users, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
                { label: "High Matches (>80%)", value: submissions.filter(s => s.matchScore >= 80).length, icon: Briefcase, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                { label: "Average Readiness", value: submissions.length ? Math.round(submissions.reduce((acc, curr) => acc + curr.jobReadinessScore, 0) / submissions.length) + "%" : "0%", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                { label: "Active Roles", value: new Set(submissions.map(s => s.targetRole)).size, icon: LayoutDashboard, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
              ].map((stat, idx) => (
                <Card key={idx} className="bg-[#1a191f] border-white/5 shadow-2xl overflow-hidden group rounded-3xl">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start">
                      <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} ${stat.border} border group-hover:scale-110 transition-transform duration-500`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1 uppercase tracking-tighter">
                         +12% <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                    <div className="mt-6">
                      <p className="text-4xl font-black text-white tracking-tighter">{stat.value}</p>
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mt-2">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Submissions Table - Premium Look */}
            <Card className="bg-[#1a191f] border-white/5 shadow-2xl overflow-hidden rounded-[2.5rem]">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="bg-white/[0.02] border-b border-white/5">
                        <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Applicant</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Target Role</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Match Score</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Readiness</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Submitted</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5 bg-transparent">
                     {loading ? (
                        <tr>
                           <td colSpan={6} className="px-8 py-20 text-center">
                              <div className="flex flex-col items-center gap-4">
                                 <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                                 <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Loading Pipeline...</span>
                              </div>
                           </td>
                        </tr>
                     ) : filteredSubmissions.length === 0 ? (
                        <tr>
                           <td colSpan={6} className="px-8 py-20 text-center text-gray-600 text-[10px] font-black uppercase tracking-widest italic">No submissions found matching filters.</td>
                        </tr>
                     ) : filteredSubmissions.map((s) => (
                        <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center font-black text-sm uppercase">
                                    {s.userEmail ? s.userEmail[0] : "?"}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-sm font-black text-white truncate max-w-[180px] tracking-tight">{s.userEmail || "Anonymous"}</span>
                                    <span className="text-[9px] text-gray-600 flex items-center gap-1 uppercase font-black tracking-widest mt-1">
                                       <Mail className="w-3 h-3 text-orange-500/50" /> {s.resumeFileName ? s.resumeFileName.slice(0, 15) + "..." : "No File"}
                                    </span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex flex-col">
                                 <span className="text-[13px] font-black text-white tracking-tight uppercase">{s.targetRole}</span>
                                 <span className="text-[9px] text-gray-600 flex items-center gap-1 uppercase font-black tracking-widest mt-1">
                                    <MapPin className="w-3 h-3 text-orange-500/50" /> {s.preferredLocation}
                                 </span>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex flex-col gap-2">
                                 <span className={`text-[13px] font-black ${s.matchScore >= 80 ? 'text-emerald-500' : s.matchScore >= 60 ? 'text-orange-500' : 'text-red-500'} tracking-tighter`}>
                                    {s.matchScore}%
                                 </span>
                                 <div className="w-24 bg-white/5 h-1.5 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-1000 ${s.matchScore >= 80 ? 'bg-emerald-500' : s.matchScore >= 60 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${s.matchScore}%` }}></div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <span className="text-[11px] font-black text-white bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 uppercase tracking-tighter">{s.jobReadinessScore}%</span>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-2 text-[9px] font-black text-gray-600 uppercase tracking-widest">
                                 <Calendar className="w-3 h-3 text-orange-500/50" />
                                 {s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString() : "Just Now"}
                              </div>
                           </td>
                           <td className="px-8 py-6 text-right">
                              <button className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-orange-500 hover:bg-orange-500/10 rounded-xl transition-all border border-transparent hover:border-orange-500/20">
                                 <ChevronRight className="w-5 h-5" />
                              </button>
                           </td>
                        </tr>
                     ) )}
                   </tbody>
                 </table>
               </div>
            </Card>
          </div>
        </main>
      </div>
    </RoleProtectedRoute>
  );
}
