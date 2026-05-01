"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Trash2, FileText, X, AlertCircle, 
  History, Calendar, LayoutGrid, 
  ArrowRight, Sparkles, ShieldCheck, 
  Target, Activity, Zap,
  Layers
} from "lucide-react";

// Dynamic Counter Component
function Counter({ value, duration = 1500 }: { value: number, duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <>{count}</>;
}

export default function MyResumes() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, "users", user.uid, "resumes")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`Fetched ${snapshot.docs.length} resumes from Firestore`);
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        return { 
          ...docData, 
          id: doc.id 
        };
      });
      
      // Sort in memory to avoid needing a composite index
      data.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      
      setResumes(data);
      setLoading(false);
    }, (err: any) => {
      console.error("Error fetching resumes:", err);
      setError("Failed to load your resumes. " + (err?.message || ""));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!id) {
      alert("Error: Missing document ID");
      return;
    }

    if (!confirm("Confirm deletion of this analysis report?")) return;
    
    try {
      const docRef = doc(db, "users", user!.uid, "resumes", id);
      await deleteDoc(docRef);
      
      if (selectedAnalysis?.id === id) {
        setSelectedAnalysis(null);
      }
    } catch (err: any) {
      console.error("Critical error during delete:", err);
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen flex flex-col font-sans text-gray-200 bg-[#0a0a0c] selection:bg-orange-500/30">
        {/* Background Glow */}
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[10%] w-[50%] h-[600px] bg-orange-600/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-[-10%] right-[10%] w-[60%] h-[700px] bg-blue-600/5 rounded-full blur-[150px]" />
        </div>

        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 px-6 md:px-12 py-5 flex justify-between items-center backdrop-blur-2xl border-b border-white/5 bg-[#0a0a0c]/40">
          <Link href="/" className="text-2xl font-black tracking-tighter text-white">
            trex<span className="text-orange-500">.ai</span>
          </Link>
          <div className="hidden md:flex items-center gap-10 text-[10px] font-black text-gray-500 tracking-[0.3em]">
            <Link href="/" className="hover:text-white transition-colors uppercase">HOME</Link>
            <span className="text-white border-b-2 border-orange-500 pb-1">HISTORY</span>
          </div>
          <Link href="/">
            <button className="px-6 py-2 rounded-xl text-[10px] font-black bg-orange-600 hover:bg-orange-500 transition-all text-white tracking-widest uppercase shadow-xl shadow-orange-500/10">
              Dashboard
            </button>
          </Link>
        </nav>

        <main className="flex-1 max-w-6xl mx-auto w-full pt-44 px-6 pb-20 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-black text-orange-500 tracking-widest uppercase">
                <History className="w-3.5 h-3.5" />
                Archive Storage
              </div>
              <h1 className="text-6xl font-black tracking-tighter text-white">Checked Resumes</h1>
              <p className="text-gray-500 text-lg font-medium max-w-xl leading-relaxed">
                Review your previous resume analysis reports and tracking indices.
              </p>
            </div>
            <Link href="/resume">
              <Button className="bg-orange-600 hover:bg-orange-500 text-white font-black px-8 py-7 rounded-[2rem] h-auto flex items-center gap-3 text-lg hover:scale-105 transition-all shadow-2xl shadow-orange-500/20">
                New Check <ArrowRight className="w-6 h-6" />
              </Button>
            </Link>
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-32 gap-4">
               <div className="w-10 h-10 border-4 border-white/10 border-t-orange-500 rounded-full animate-spin"></div>
               <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Accessing Archive...</p>
             </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 p-12 rounded-[3rem] text-center max-w-2xl mx-auto space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-red-500" />
              <h3 className="text-2xl font-black text-white tracking-tight uppercase">Connectivity Error</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">{error}</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-8 text-center bg-white/[0.02] border border-white/5 rounded-[4rem]">
              <div className="w-24 h-24 bg-[#0a0a0c] border border-white/5 rounded-[2.5rem] flex items-center justify-center text-orange-500 shadow-2xl">
                <LayoutGrid className="w-10 h-10" />
              </div>
              <div className="space-y-3">
                <p className="text-2xl font-black text-white uppercase tracking-tight">No Reports Found</p>
                <p className="text-sm text-gray-600 max-w-sm mx-auto font-medium">Analyze a resume to generate your first professional checker report.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {resumes.map((resume) => (
                <Card key={resume.id} 
                      onClick={() => setSelectedAnalysis(resume)}
                      className="bg-[#1a191f] border-white/5 hover:border-orange-500/40 transition-all duration-500 cursor-pointer group shadow-2xl rounded-[2.5rem] overflow-hidden">
                  <div className={`h-2 w-full ${resume.overallScore >= 80 ? 'bg-emerald-500' : resume.overallScore >= 60 ? 'bg-orange-500' : 'bg-red-500'} opacity-30 group-hover:opacity-100 transition-opacity`}></div>
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-sm font-black text-white line-clamp-1 flex items-center gap-4 uppercase tracking-tight">
                      <div className="w-12 h-12 rounded-2xl bg-[#0a0a0c] border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-600 group-hover:border-orange-500 transition-all duration-500">
                        {resume.type === 'builder' ? <FileText className="w-6 h-6 text-emerald-500 group-hover:text-white transition-colors" /> : <ShieldCheck className="w-6 h-6 text-orange-500 group-hover:text-white transition-colors" />}
                      </div>
                      {resume.fileName || "Untitled Document"}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] mt-8">
                      <Calendar className="w-3.5 h-3.5 text-orange-500/50" />
                      {resume.createdAt ? new Date(resume.createdAt.toDate()).toLocaleDateString() : 'Recent'}
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="flex items-center justify-between bg-black/40 p-6 rounded-[2rem] border border-white/5 shadow-inner">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">{resume.type === 'builder' ? 'Status' : 'Match Index'}</p>
                        <p className="text-3xl font-black text-white">
                          {resume.type === 'builder' ? 'READY' : <><Counter value={resume.overallScore || 0} />%</>}
                        </p>
                      </div>
                      <div className={`w-4 h-4 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)] ${resume.type === 'builder' ? 'bg-emerald-500 shadow-emerald-500/50' : (resume.overallScore >= 80 ? 'bg-emerald-500 shadow-emerald-500/50' : resume.overallScore >= 60 ? 'bg-orange-500 shadow-orange-500/50' : 'bg-red-500 shadow-red-500/50')}`}></div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                       {resume.type === 'builder' ? (
                         <a 
                           href={resume.pdfData || resume.url} 
                           download={resume.fileName || "resume.pdf"} 
                           className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] hover:underline"
                         >
                           Download PDF
                         </a>
                       ) : (
                         <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] group-hover:text-orange-500 transition-colors">View Deep Report</span>
                       )}
                       <button 
                         onClick={(e) => handleDelete(e, resume.id)} 
                         className="relative z-30 p-3 text-gray-600 hover:text-white hover:bg-red-600 rounded-2xl transition-all active:scale-90 shadow-xl border border-transparent hover:border-red-500"
                         title="Delete Report"
                       >
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>

        {/* Enhanced Premium Modal */}
        {selectedAnalysis && selectedAnalysis.type !== 'builder' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-[#0a0a0c]/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#0a0a0c] w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 relative">
              
              <div className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-[#1a191f]/80">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">REPORT ARCHIVE</h3>
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mt-0.5">{selectedAnalysis.fileName}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedAnalysis(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar flex-1 bg-gradient-to-b from-transparent to-[#1a191f]/20">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-[#1a191f] p-6 rounded-2xl border border-white/5 text-center flex flex-col items-center justify-center space-y-2 shadow-sm">
                        <p className="text-4xl font-black text-white tracking-tighter"><Counter value={selectedAnalysis.overallScore} />%</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Overall Index</p>
                    </div>
                    <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {selectedAnalysis.analysisResult.section_scores && Object.entries(selectedAnalysis.analysisResult.section_scores).map(([key, val]) => (
                        <div key={key} className="bg-[#1a191f]/50 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center hover:border-orange-500/30 hover:bg-orange-500/[0.02] transition-colors group">
                          <p className="text-2xl font-bold text-white group-hover:text-orange-500 transition-colors"><Counter value={val as number} /></p>
                          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest text-center mt-2 group-hover:text-gray-300 transition-colors">{key.replace('_', ' ')}</p>
                        </div>
                      ))}
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-[#1a191f]/40 border-white/5 rounded-2xl p-6 space-y-6 shadow-sm">
                        <div className="flex items-center gap-3 px-1">
                           <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                           </div>
                           <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Verified Strengths</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedAnalysis.analysisResult?.matched_keywords?.slice(0, 15).map((kw: string) => (
                            <span key={kw} className="px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                              {kw}
                            </span>
                          ))}
                        </div>
                    </Card>

                    <Card className="bg-[#1a191f]/40 border-white/5 rounded-2xl p-6 space-y-6 shadow-sm">
                        <div className="flex items-center gap-3 px-1">
                           <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                              <Target className="w-4 h-4 text-red-500" />
                           </div>
                           <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Strategic Gaps</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedAnalysis.analysisResult?.missing_keywords?.slice(0, 10).map((kw: string) => (
                            <span key={kw} className="px-3 py-1.5 bg-red-500/5 border border-red-500/10 text-red-500 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                              {kw}
                            </span>
                          ))}
                        </div>
                    </Card>
                 </div>

                 <Card className="bg-gradient-to-br from-orange-950/20 to-transparent border border-orange-500/10 rounded-3xl p-8 space-y-8">
                    <div className="flex items-center gap-4 px-2">
                       <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                          <Activity className="w-5 h-5 text-orange-500" />
                       </div>
                       <h4 className="text-sm font-bold text-white uppercase tracking-widest">Optimisation Roadmap</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
                        <ul className="space-y-4">
                          {(selectedAnalysis.analysisResult?.ai_feedback?.suggested_resume_changes || selectedAnalysis.analysisResult?.improvement_suggestions || []).slice(0, 5).map((item: string, idx: number) => (
                            <li key={idx} className="flex gap-4 text-sm text-gray-400 font-medium group">
                              <span className="flex-shrink-0 w-6 h-6 bg-black/40 border border-white/5 rounded-lg flex items-center justify-center text-[10px] font-bold text-orange-500 group-hover:bg-orange-600 group-hover:text-white transition-colors">{idx+1}</span>
                              <span className="group-hover:text-gray-300 transition-colors leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="bg-black/40 p-6 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-2xl rounded-full"></div>
                           <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-2">
                              <Zap className="w-3 h-3" /> Final Assessment
                           </p>
                           <p className="text-sm text-gray-400 italic leading-relaxed">
                              {selectedAnalysis.analysisResult.ai_feedback?.overall_match.details || "Historical snapshot of your checked document. Use the latest feedback to iterate on your resume for maximum impact."}
                           </p>
                        </div>
                    </div>
                 </Card>
              </div>
              
              <div className="px-8 py-5 border-t border-white/5 bg-[#1a191f]/80 flex justify-between items-center">
                <button 
                  onClick={(e) => {
                    handleDelete(e, selectedAnalysis.id);
                    setSelectedAnalysis(null);
                  }}
                  className="flex items-center gap-2 text-red-500/60 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Purge Report
                </button>
                <Link href="/resume">
                  <Button className="bg-white text-black hover:bg-orange-500 hover:text-white font-bold px-6 py-2 rounded-xl text-sm transition-all shadow-sm">
                    Live Checker
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
