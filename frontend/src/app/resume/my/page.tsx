"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText, Download, Trash2, Clock, ChevronLeft, Search,
  ShieldCheck, Sparkles, ArrowRight, Target, History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Counter component for animated numbers
function Counter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);
  return <>{count}</>;
}

export default function MyResumes() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'built' | 'reviews'>('all');

  useEffect(() => {
    if (!user) return;

    const fetchResumes = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "users", user.uid, "resumes"));
        const querySnapshot = await getDocs(q);
        console.log(`[MY-RESUMES] Found ${querySnapshot.docs.length} documents`);

        const fetchedResumes = querySnapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));

        // Sort by date descending
        fetchedResumes.sort((a: any, b: any) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });

        setResumes(fetchedResumes);
      } catch (error) {
        console.error("Error fetching resumes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResumes();
  }, [user]);

  const handleDelete = async (resumeId: string) => {
    if (!window.confirm("Delete this document permanently?")) return;

    try {
      await deleteDoc(doc(db, "users", user!.uid, "resumes", resumeId));
      setResumes(prev => prev.filter(r => r.id !== resumeId));
    } catch (error) {
      alert("Failed to delete");
    }
  };

  // Filter by search term using fileName field (the actual field in Firestore)
  const filteredResumes = resumes
    .filter((r: any) => {
      const name = (r.fileName || r.name || "").toLowerCase();
      return name.includes(searchTerm.toLowerCase());
    })
    .filter((r: any) => {
      if (activeTab === 'built') return r.type === 'builder';
      if (activeTab === 'reviews') return r.type !== 'builder';
      return true;
    });

  const builtCount = resumes.filter((r: any) => r.type === 'builder').length;
  const reviewCount = resumes.filter((r: any) => r.type !== 'builder').length;

  const formatDate = (createdAt: any) => {
    try {
      if (createdAt?.toDate) {
        return createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      if (createdAt?.seconds) {
        return new Date(createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      return "Recent";
    } catch {
      return "Recent";
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0a0a0c] text-gray-100 flex flex-col pt-24 pb-20 selection:bg-orange-500/30">
        {/* Background Glow */}
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[10%] w-[50%] h-[600px] bg-orange-600/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-[-10%] right-[10%] w-[60%] h-[700px] bg-blue-600/5 rounded-full blur-[150px]" />
        </div>

        <main className="max-w-6xl mx-auto w-full px-6 space-y-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <Link href="/resume" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-orange-500 transition-colors">
                <ChevronLeft className="w-3 h-3" /> Back to Resume AI
              </Link>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white">
                MY <span className="text-orange-500">RESUMES</span>
              </h1>
              <p className="text-gray-500 text-lg font-medium max-w-xl leading-relaxed">
                Your AI-generated career documents & analysis reports, stored securely in the cloud.
              </p>
            </div>

            <div className="flex flex-col gap-4 items-end">
              {/* Search */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3.5 w-full md:w-72 outline-none focus:border-orange-500/50 focus:bg-white/[0.07] transition-all text-sm font-medium"
                />
              </div>
              <Link href="/resume?start=true">
                <Button className="bg-orange-600 hover:bg-orange-500 text-white font-black px-8 py-6 rounded-[2rem] h-auto flex items-center gap-3 text-base hover:scale-105 transition-all shadow-2xl shadow-orange-500/20">
                  Build New <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Tab Filters */}
          <div className="flex gap-3">
            {[
              { key: 'all', label: 'All', count: resumes.length, icon: History },
              { key: 'built', label: 'AI Built', count: builtCount, icon: Sparkles },
              { key: 'reviews', label: 'Reviews', count: reviewCount, icon: ShieldCheck },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                    : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300 border border-white/5'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-white/20' : 'bg-white/5'
                }`}>{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-72 bg-white/5 rounded-[2.5rem] animate-pulse border border-white/5" />
              ))}
            </div>
          ) : filteredResumes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {filteredResumes.map((resume: any, idx: number) => {
                  const isBuilder = resume.type === 'builder';
                  const displayName = resume.fileName || resume.name || "Untitled Document";
                  const score = resume.overallScore;

                  return (
                    <motion.div
                      key={resume.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="group bg-[#1a191f] border-white/5 hover:border-orange-500/30 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/5 hover:-translate-y-2">
                        {/* Top Type Bar */}
                        <div className={`h-1.5 w-full ${isBuilder ? 'bg-emerald-500' : (score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-orange-500' : 'bg-red-500')} opacity-30 group-hover:opacity-100 transition-opacity`} />

                        <CardContent className="p-8 space-y-6">
                          {/* Top Row: Icon + Type + Delete */}
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className={`p-3.5 rounded-2xl transition-colors ${isBuilder ? 'bg-emerald-500/10 group-hover:bg-emerald-500' : 'bg-orange-500/10 group-hover:bg-orange-500'}`}>
                                {isBuilder
                                  ? <FileText className="w-5 h-5 text-emerald-500 group-hover:text-white transition-colors" />
                                  : <ShieldCheck className="w-5 h-5 text-orange-500 group-hover:text-white transition-colors" />
                                }
                              </div>
                              <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${
                                isBuilder
                                  ? 'text-emerald-500 bg-emerald-500/5 border-emerald-500/20'
                                  : 'text-orange-500 bg-orange-500/5 border-orange-500/20'
                              }`}>
                                {isBuilder ? 'AI Built' : 'Analysis'}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDelete(resume.id)}
                              className="p-2.5 text-gray-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Name & Date */}
                          <div className="space-y-2">
                            <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-orange-500 transition-colors truncate leading-tight">
                              {displayName}
                            </h3>
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">
                              <Clock className="w-3 h-3 text-orange-500/40" />
                              {formatDate(resume.createdAt)}
                            </div>
                          </div>

                          {/* Score or Status Badge */}
                          <div className="flex items-center justify-between bg-black/40 p-5 rounded-2xl border border-white/5">
                            <div className="space-y-1">
                              <p className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em]">
                                {isBuilder ? 'Status' : 'ATS Match'}
                              </p>
                              <p className="text-2xl font-black text-white">
                                {isBuilder ? 'READY' : <><Counter value={score || 0} />%</>}
                              </p>
                            </div>
                            <div className={`w-3.5 h-3.5 rounded-full shadow-lg ${
                              isBuilder
                                ? 'bg-emerald-500 shadow-emerald-500/50'
                                : score >= 80
                                  ? 'bg-emerald-500 shadow-emerald-500/50'
                                  : score >= 60
                                    ? 'bg-orange-500 shadow-orange-500/50'
                                    : 'bg-red-500 shadow-red-500/50'
                            }`} />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            {isBuilder ? (
                              <a
                                href={resume.pdfData || resume.url}
                                download={displayName}
                                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-colors shadow-lg shadow-emerald-500/20"
                              >
                                <Download className="w-3.5 h-3.5" /> Download PDF
                              </a>
                            ) : (
                              <Link href="/my-resumes" className="flex-1">
                                <div className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-colors shadow-lg shadow-orange-500/20 cursor-pointer">
                                  <Target className="w-3.5 h-3.5" /> View Full Report
                                </div>
                              </Link>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="py-28 flex flex-col items-center justify-center text-center space-y-8 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.02]">
              <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center">
                <FileText className="w-10 h-10 text-gray-700" />
              </div>
              <div className="space-y-3">
                <p className="text-gray-400 text-xl font-bold">
                  {searchTerm ? 'No matching results' : activeTab === 'built' ? 'No AI-built resumes yet' : activeTab === 'reviews' ? 'No analysis reviews yet' : 'No documents found'}
                </p>
                <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">
                  {searchTerm ? 'Try a different search term' : 'Start by analyzing or building your first resume'}
                </p>
              </div>
              <Link href="/resume?start=true">
                <Button className="rounded-full bg-orange-600 hover:bg-orange-500 text-white font-black px-10 py-6 h-auto text-lg shadow-2xl shadow-orange-500/20">
                  Build New Resume
                </Button>
              </Link>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
