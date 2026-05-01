"use client";

import ProtectedRoute from "@/components/ProtectedRoute";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, TrendingUp, Info, MoreVertical, UploadCloud, FileText, UserCheck, Sparkles, Search, Layers, Zap, History, Clock, Download, X, ChevronRight, ShieldCheck } from "lucide-react";
import TrexBotIcon from "@/components/TrexBotIcon";
import ResumeChatbot from "@/components/ResumeChatbot";
import ResumeCanvas from "@/app/resume/builder/ResumeCanvas";
import { useAuth } from "@/components/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, collection, onSnapshot } from "firebase/firestore";

interface ActionItem {
  label: string;
  impact: string;
}

interface AICard {
  title: string;
  severity: 'critical' | 'major' | 'moderate' | 'minor';
  details: string;
  action_items: ActionItem[];
}

interface AIFeedback {
  provider: string;
  overall_match: AICard;
  resume_weaknesses: AICard;
  section_review: AICard;
  role_alignment: AICard;
  project_review: AICard;
  roadmap: AICard;
  application_strategy: AICard;
  final_verdict: AICard;
  suggested_resume_changes: string[];
}

interface SectionScores {
  [key: string]: number;
}

interface AnalysisResult {
  overall_score: number;
  section_scores: SectionScores;
  matched_keywords: string[];
  missing_keywords: string[];
  detected_sections: string[];
  missing_sections: string[];
  ats_warnings: string[];
  improvement_suggestions: string[];
  ai_feedback: AIFeedback | null;
}

function AICardComponent({ card }: { card: AICard }) {
  const severityMap = {
    critical: { color: "bg-red-500", label: "CRITICAL", progress: "w-full" },
    major: { color: "bg-orange-500", label: "MAJOR", progress: "w-3/4" },
    moderate: { color: "bg-amber-500", label: "MODERATE", progress: "w-1/2" },
    minor: { color: "bg-blue-500", label: "MINOR", progress: "w-1/4" },
  };

  const config = severityMap[card.severity] || severityMap.moderate;

  return (
    <div className="group relative bg-[#1a191f] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1">
      {/* Top Progress Bar (Severity Impact) */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
        <div className={`h-full ${config.color} transition-all duration-500 ${config.progress}`}></div>
      </div>

      <div className="p-6 space-y-4">
        {/* Header: Title & Subtitle mapping */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">AI Assessment Category</span>
            <h3 className="text-lg font-bold text-white tracking-tight leading-tight">{card.title}</h3>
          </div>
          <button className="text-gray-500 hover:text-white transition-colors p-1" title="Options">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* Details Mapping */}
        <p className="text-sm text-gray-400 leading-relaxed min-h-[60px]">
          {card.details}
        </p>

        {/* Action Items as Course Pills */}
        {card.action_items && card.action_items.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {card.action_items.map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full pl-2 pr-3 py-1 transition-colors"
                title={`Impact: ${item.impact}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${config.color}`}></div>
                <span className="text-[11px] font-medium text-gray-300">{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer: Pill mapping for Priority/Severity */}
        <div className="pt-4 flex items-center justify-between border-t border-white/5 mt-2">
          <div className="flex items-center gap-2">
             <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${config.color} text-white shadow-sm`}>
               {config.label}
             </span>
          </div>
          <span className="text-[10px] text-gray-500 font-medium tracking-widest">VERIFIED</span>
        </div>
      </div>
    </div>
  );
}

export default function ResumeOptimizer() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [useAI, setUseAI] = useState<boolean>(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Builder Journey States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const { user } = useAuth();

  // Sidebar Panel States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'history' | 'my-resumes'>('history');
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [myResumes, setMyResumes] = useState<any[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);

  // Fetch all resumes from Firestore and split into history vs my-resumes
  useEffect(() => {
    if (!user) return;
    setSidebarLoading(true);

    const q = collection(db, "users", user.uid, "resumes");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      // Sort by date descending
      all.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setHistoryItems(all.filter((r: any) => r.type !== 'builder'));
      setMyResumes(all.filter((r: any) => r.type === 'builder'));
      setSidebarLoading(false);
    }, () => setSidebarLoading(false));

    return () => unsubscribe();
  }, [user]);
  
  // Auto-open bot if 'start=true' is in query params
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('start') === 'true') {
      setIsChatOpen(true);
    }
  }, []);

  const startBuildingJourney = async (data: any) => {
    setIsChatOpen(false);
    try {
      const res = await fetch("http://localhost:8000/api/builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to initialize builder");
      const { session_id } = await res.json();
      setCurrentSessionId(session_id);
      setIsCanvasOpen(true);
    } catch (e) {
      alert("Error starting builder session");
    }
  };

  const analyzeResume = async () => {
    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      if (!resumeFile) {
        throw new Error("Please upload a PDF resume");
      }
      if (!jobDescription.trim()) {
        throw new Error("Please enter the job description");
      }

      const formData = new FormData();
      formData.append("resume_file", resumeFile);
      formData.append("job_description", jobDescription);
      formData.append("use_ai", useAI ? "true" : "false");
      formData.append("provider", "groq");

      const res = await fetch("http://localhost:8000/api/resume/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to analyze resume");
      }

      const data: AnalysisResult = await res.json();
      setAnalysis(data);

      // Save to Firebase if authenticated
      if (user) {
        try {
          const analysisId = crypto.randomUUID();
          await setDoc(doc(db, "users", user.uid, "resumes", analysisId), {
            fileName: resumeFile.name,
            createdAt: serverTimestamp(),
            jobDescription: jobDescription,
            analysisResult: data,
            overallScore: data.overall_score
          });
          console.log("Analysis saved to Firestore");
        } catch (fbErr) {
          console.error("Failed to save to Firestore:", fbErr);
        }
      }

    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "An error occurred";
      setError(errorMsg);
      alert(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
      // Auto-scroll to results if analysis succeeded
      setTimeout(() => {
        if (!error && !loading) {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const handleClear = () => {
    setResumeFile(null);
    setJobDescription("");
    setAnalysis(null);
    setError("");
    const fileInput = document.getElementById('resume-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <ProtectedRoute>
    {isCanvasOpen && currentSessionId ? (
      <ResumeCanvas sessionId={currentSessionId} onBack={() => setIsCanvasOpen(false)} />
    ) : (
    <div className="relative min-h-screen flex flex-col font-sans text-white selection:bg-orange-500/30">
      {/* Background - True Premium Dark */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#0a0a0c]">
        <div className="absolute top-[-10%] left-[10%] w-[50%] h-[600px] bg-gradient-to-br from-orange-500/5 to-transparent rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[60%] h-[700px] bg-blue-500/5 rounded-full blur-[140px]" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#0f0e13]/80 backdrop-blur-xl px-6 md:px-12 py-4 flex justify-between items-center border-b border-white/5">
        <Link href="/" className="text-2xl font-bold tracking-tighter text-white">
          trex<span className="text-orange-500">.ai</span>
        </Link>
        <div className="hidden md:flex items-center gap-10 text-[11px] font-bold text-gray-500 tracking-[0.2em] uppercase">
          <Link href="/" className="hover:text-white transition">HOME</Link>
          <button onClick={() => { setIsSidebarOpen(true); setSidebarTab('my-resumes'); }} className="hover:text-white transition cursor-pointer bg-transparent border-none uppercase text-[11px] font-bold tracking-[0.2em] text-gray-500">MY RESUMES</button>
          <button onClick={() => { setIsSidebarOpen(true); setSidebarTab('history'); }} className="hover:text-white transition cursor-pointer bg-transparent border-none uppercase text-[11px] font-bold tracking-[0.2em] text-gray-500">HISTORY</button>
          <span className="text-white border-b-2 border-orange-500 pb-0.5">RESUME AI</span>
        </div>
        <Link href="/">
          <button className="px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white">
            Back to Home
          </button>
        </Link>
      </nav>

      {/* Page Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full pt-36 px-6 pb-20 space-y-16">
        {/* Premium Hero Section */}
        <div className="flex flex-col items-center text-center space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black tracking-[0.3em] uppercase">
            <Sparkles className="w-3 h-3" />
            AI RECRUITER MODE
          </div>
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white">
            Senior AI Resume Review
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl leading-relaxed font-medium">
            Our neural-pipeline simulates a high-pressure engineering manager interview. <br className="hidden md:block" />
            Upload your resume and JD for a brutal, honest, and strategic assessment.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <div className="flex items-center gap-3 px-5 py-2.5 bg-[#1a191f] border border-white/5 rounded-2xl shadow-xl text-[11px] font-black text-gray-300 tracking-widest uppercase">
               <Search className="w-4 h-4 text-orange-500" />
               ATS SCAN
            </div>
            <div className="flex items-center gap-3 px-5 py-2.5 bg-[#1a191f] border border-white/5 rounded-2xl shadow-xl text-[11px] font-black text-gray-300 tracking-widest uppercase">
               <Layers className="w-4 h-4 text-blue-500" />
               JD MATCH
            </div>
            <div className="flex items-center gap-3 px-5 py-2.5 bg-[#1a191f] border border-white/5 rounded-2xl shadow-xl text-[11px] font-black text-gray-300 tracking-widest uppercase">
               <UserCheck className="w-4 h-4 text-green-500" />
               SENIOR HR REVIEW
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Input Section - Resume Upload */}
          <Card className="bg-[#1a191f] shadow-2xl shadow-black/50 h-fit border-white/5 overflow-hidden">
            <CardHeader className="pb-2 border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" />
                Resume Document
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div 
                className={`group relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-[2rem] transition-all duration-500 bg-[#0f0e13]/50
                  ${resumeFile ? 'border-orange-500/50 bg-orange-500/5 shadow-2xl shadow-orange-500/10' : 'border-white/5 hover:border-orange-500/30 hover:bg-orange-500/[0.02]'}`}
              >
                <input
                  id="resume-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  aria-label="Upload PDF Resume"
                />
                
                {!resumeFile ? (
                  <div className="flex flex-col items-center text-center p-6 space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform duration-500 border border-orange-500/20">
                       <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-widest">Drag & Drop Resume</p>
                      <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-tighter">or click to browse from files</p>
                    </div>
                    <div className="pt-4">
                      <span className="text-[9px] font-black px-3 py-1 bg-white/5 text-gray-400 rounded-full border border-white/5 tracking-widest uppercase">PDF ONLY • MAX 5MB</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center p-6 space-y-4 animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-24 bg-[#1a191f] rounded-xl border-2 border-orange-500 shadow-2xl shadow-orange-500/20 flex items-center justify-center relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-full h-2 bg-orange-500"></div>
                       <FileText className="w-10 h-10 text-orange-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white line-clamp-1 px-4">{resumeFile.name}</p>
                      <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">Ready for analysis</p>
                    </div>
                    <button 
                       onClick={(e) => { e.stopPropagation(); setResumeFile(null); }}
                       className="text-[10px] font-black text-gray-500 hover:text-orange-500 transition-colors uppercase tracking-widest z-20 mt-2"
                    >
                      Remove File
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="use-ai" 
                  checked={useAI} 
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="w-4 h-4 text-orange-500 accent-orange-500 rounded bg-[#0f0e13] border-white/10 focus:ring-orange-500 transition-colors cursor-pointer"
                />
                <label htmlFor="use-ai" className="text-[10px] text-gray-500 font-black uppercase tracking-widest cursor-pointer hover:text-orange-500 transition-colors">
                  Enable Neural Senior Persona Review
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Input Section - Job Description */}
          <Card className="bg-[#1a191f] shadow-2xl shadow-black/50 h-fit border-white/5 overflow-hidden">
            <CardHeader className="pb-2 border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                Job Description
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="relative group">
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the target JD here (Requirements, Skills, Responsibilities)..."
                  className="w-full h-64 bg-[#0f0e13]/50 border border-white/5 rounded-[2rem] p-8 text-white focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/30 outline-none shadow-inner transition-all resize-none placeholder:text-gray-700 text-sm leading-relaxed"
                  aria-label="Job description"
                />
                <div className="absolute bottom-6 right-6 flex items-center gap-2 pointer-events-none">
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm ${jobDescription.length > 500 ? 'text-orange-500' : 'text-gray-600'} tracking-widest`}>
                    {jobDescription.length} CHARS
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 px-2">
                <Info className="w-4 h-4 text-blue-500/50" />
                <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">
                  Paste the full text for deeper semantic matching.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How Analysis Works Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-14 border-y border-white/5">
           <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-black text-lg border border-orange-500/20">1</div>
              <div>
                <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none mb-2">Upload Resume</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">PDF format, max 5MB</p>
              </div>
           </div>
           <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-lg border border-blue-500/20">2</div>
              <div>
                <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none mb-2">Paste Job Desc</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Requirements & Skills</p>
              </div>
           </div>
           <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center font-black text-lg border border-green-500/20">3</div>
              <div>
                <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none mb-2">Get your technical analysis</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">8-card technical analysis</p>
              </div>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-8 justify-center items-center py-8">
          <Button
            onClick={analyzeResume}
            disabled={loading || !resumeFile || !jobDescription.trim()}
            className="w-full md:w-96 h-20 bg-orange-600 hover:bg-orange-700 text-white shadow-2xl shadow-orange-500/20 text-xl font-black rounded-[2rem] transition-all duration-500 hover:-translate-y-2 hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.2em] border-t border-white/20"
          >
            {loading ? (
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                Analyzing...
              </div>
            ) : (
              "Analyze Now"
            )}
          </Button>
          <Button
            onClick={handleClear}
            disabled={loading}
            className="w-full md:w-48 h-20 bg-[#1a191f] border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white shadow-xl text-sm font-black rounded-[2rem] transition-all duration-500 uppercase tracking-widest"
          >
            Clear All
          </Button>
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {/* Overall Score section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Match Score */}
              <Card className="bg-[#1a191f] md:col-span-1 shadow-2xl shadow-orange-500/5 border-orange-500/20 rounded-[2.5rem]">
                <CardContent className="pt-10 pb-10">
                  <div className="flex flex-col items-center justify-center h-full gap-8">
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">ATS Match Integrity</p>
                    <div className="relative w-48 h-48">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke={analysis.overall_score >= 80 ? "#22c55e" : analysis.overall_score >= 60 ? "#f97316" : "#ef4444"}
                          strokeWidth="10"
                          strokeDasharray={`${(analysis.overall_score / 100) * 264} 264`}
                          strokeLinecap="round"
                          className="drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-5xl font-black text-white">{analysis.overall_score}%</span>
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-2">Score</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sub Scores */}
              <Card className="bg-[#1a191f] md:col-span-2 shadow-2xl border-white/5 rounded-[2.5rem]">
                <CardHeader className="pt-10 px-10">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Metric Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="px-10 pb-10">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {Object.entries(analysis.section_scores).map(([key, value]) => (
                      <div key={key} className="bg-[#0f0e13] p-6 rounded-3xl border border-white/5 flex flex-col items-center text-center group hover:border-orange-500/30 transition-all">
                        <span className="text-3xl font-black text-white mb-2 group-hover:text-orange-500 transition-colors">{value}</span>
                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{key.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Senior Review Cards */}
            {analysis.ai_feedback && (
              <div className="space-y-10">
                <div className="flex items-center gap-6">
                   <div className="h-px flex-1 bg-white/5"></div>
                   <h2 className="text-2xl font-black text-white uppercase tracking-[0.4em] px-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Senior Assessor Report</h2>
                   <div className="h-px flex-1 bg-white/5"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <AICardComponent card={analysis.ai_feedback.overall_match} />
                   <AICardComponent card={analysis.ai_feedback.resume_weaknesses} />
                   <AICardComponent card={analysis.ai_feedback.section_review} />
                   <AICardComponent card={analysis.ai_feedback.role_alignment} />
                   <AICardComponent card={analysis.ai_feedback.project_review} />
                   <AICardComponent card={analysis.ai_feedback.roadmap} />
                   <AICardComponent card={analysis.ai_feedback.application_strategy} />
                   <AICardComponent card={analysis.ai_feedback.final_verdict} />
                </div>

                {/* Final Suggestions Engine */}
                <Card className="bg-gradient-to-br from-[#1a191f] to-[#0a0a0c] text-white border border-white/5 shadow-2xl shadow-orange-500/10 overflow-hidden relative rounded-[3rem]">
                  <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                    <TrendingUp className="w-64 h-64" />
                  </div>
                  <CardHeader className="pt-12 px-12">
                    <CardTitle className="text-2xl font-black flex items-center gap-4 uppercase tracking-widest">
                      <TrendingUp className="w-8 h-8 text-orange-500" />
                      Priority Action Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-12 pb-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                       <div className="space-y-6">
                         <p className="text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Urgent Structural Fixes</p>
                         <ul className="space-y-4">
                           {analysis.ai_feedback.suggested_resume_changes.slice(0, 5).map((change, idx) => (
                             <li key={idx} className="flex items-start gap-4 text-gray-300 group">
                               <span className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center text-[11px] font-black border border-orange-500/20 group-hover:scale-110 transition-transform">
                                 {idx + 1}
                               </span>
                               <span className="text-sm font-medium leading-relaxed group-hover:text-white transition-colors pt-0.5">{change}</span>
                             </li>
                           ))}
                         </ul>
                       </div>
                       <div className="bg-white/[0.03] p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-orange-500/20 transition-all">
                         <div className="absolute top-0 left-0 w-2 h-full bg-orange-500/50"></div>
                         <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Strategic Persona Insight</p>
                         <p className="text-lg text-gray-300 leading-relaxed italic font-medium">
                           "The most impactful change you can make right now is focusing on the <strong className="text-white underline decoration-orange-500/50">{analysis.ai_feedback.role_alignment.title}</strong> action items. Addressing these will increase your interview callback rate by an estimated 40% for roles in this domain."
                         </p>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Keyword and Structure Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-16 border-t border-white/5">
               <Card className="bg-[#1a191f] shadow-2xl border-white/5 rounded-[2.5rem]">
                <CardHeader className="pt-8 px-8">
                  <CardTitle className="text-lg font-black text-white uppercase tracking-widest">Resume Architecture</CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8 space-y-8">
                  <div className="space-y-4">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Detected Segments</p>
                    <div className="flex flex-wrap gap-2">
                       {analysis.detected_sections.map(sec => (
                         <span key={sec} className="bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">{sec}</span>
                       ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Missing Priority Segments</p>
                    <div className="flex flex-wrap gap-2">
                       {analysis.missing_sections.map(sec => (
                         <span key={sec} className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">{sec}</span>
                       ))}
                       {analysis.missing_sections.length === 0 && <span className="text-[10px] text-green-600 font-black uppercase tracking-widest">Standard structure verified</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1a191f] shadow-2xl border-white/5 rounded-[2.5rem]">
                <CardHeader className="pt-8 px-8">
                  <CardTitle className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    Keywords Found ({analysis.matched_keywords.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-4 custom-scrollbar">
                    {analysis.matched_keywords.map((keyword) => (
                      <span key={keyword} className="px-3 py-1.5 bg-green-500/5 text-green-400 border border-green-500/10 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <Card className="bg-[#1a191f] shadow-2xl border-white/5 rounded-[2.5rem]">
                <CardHeader className="pt-8 px-8">
                  <CardTitle className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-red-500" />
                    Missing Keywords ({analysis.missing_keywords.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-4 custom-scrollbar">
                    {analysis.missing_keywords.map((keyword) => (
                      <span key={keyword} className="px-3 py-1.5 bg-red-500/5 text-red-400 border border-red-500/10 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {keyword}
                      </span>
                    ))}
                    {analysis.missing_keywords.length === 0 && <span className="text-[10px] text-green-500 font-black uppercase tracking-widest">Keyword target met</span>}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1a191f] shadow-2xl border-orange-500/20 rounded-[2.5rem]">
                <CardHeader className="pt-8 px-8">
                  <CardTitle className="text-lg font-black text-orange-500 uppercase tracking-widest">Strategic Warnings</CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8 h-48 overflow-y-auto pr-4 custom-scrollbar">
                  <ul className="space-y-4">
                    {analysis.improvement_suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-4 group">
                        <span className="flex-shrink-0 w-6 h-6 mt-0.5 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center text-[10px] font-black border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-white transition-all">
                          {idx + 1}
                        </span>
                        <span className="text-xs text-gray-400 leading-relaxed font-medium group-hover:text-gray-200 transition-colors">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!analysis && !loading && (
          <div className="flex items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-[3rem]">
            <div className="text-center space-y-4">
              <p className="text-gray-500 text-xl font-medium tracking-tight">Upload your PDF and paste a job description above to score yourself</p>
              <p className="text-gray-600 text-[11px] font-black uppercase tracking-[0.2em]">Our ATS pipeline will review keywords, formatting, and sections.</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center space-y-8">
              <div className="relative inline-block">
                <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-white text-2xl font-black uppercase tracking-widest">Running pipeline</p>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Checking sections, ATS formatting, and keyword matching</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Builder Journey Components */}
      {!isSidebarOpen && <TrexBotIcon onClick={() => setIsChatOpen(true)} isOpen={isChatOpen} />}
      <ResumeChatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onSubmit={startBuildingJourney}
      />

      {/* ═══════════ History & My Resumes Slide-Out Panel ═══════════ */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[110] flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setIsSidebarOpen(false); setSelectedHistoryItem(null); }} />

          {/* Panel */}
          <div className="absolute right-0 top-0 h-full w-full max-w-[520px] bg-[#0f0e13] border-l border-white/10 shadow-[-20px_0_80px_rgba(0,0,0,0.8)] flex flex-col animate-in slide-in-from-right duration-500">
            {/* Panel Header */}
            <div className="px-8 pt-8 pb-6 border-b border-white/5 space-y-6 bg-[#1a191f]/30">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tighter text-white uppercase">Archive</h2>
                <button onClick={() => { setIsSidebarOpen(false); setSelectedHistoryItem(null); }} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setSidebarTab('history'); setSelectedHistoryItem(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                    sidebarTab === 'history'
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                      : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
                  }`}
                >
                  <History className="w-3.5 h-3.5" /> Reviews
                </button>
                <button
                  onClick={() => { setSidebarTab('my-resumes'); setSelectedHistoryItem(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                    sidebarTab === 'my-resumes'
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                      : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> My Resumes
                </button>
              </div>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-4">
              {sidebarLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-8 h-8 border-4 border-white/10 border-t-orange-500 rounded-full animate-spin" />
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Loading...</p>
                </div>
              ) : selectedHistoryItem ? (
                /* ───── Expanded History Detail View ───── */
                <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-300">
                  <button onClick={() => setSelectedHistoryItem(null)} className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-orange-500 uppercase tracking-[0.2em] transition-colors">
                    <ChevronRight className="w-3 h-3 rotate-180" /> Back to list
                  </button>

                  {/* Score Ring */}
                  <div className="bg-[#1a191f] rounded-[2rem] p-8 border border-white/5 flex flex-col items-center gap-4">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <circle cx="50" cy="50" r="42" fill="none"
                          stroke={selectedHistoryItem.overallScore >= 80 ? '#22c55e' : selectedHistoryItem.overallScore >= 60 ? '#f97316' : '#ef4444'}
                          strokeWidth="8" strokeDasharray={`${(selectedHistoryItem.overallScore / 100) * 264} 264`} strokeLinecap="round"
                          className="drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-3xl font-black text-white">{selectedHistoryItem.overallScore}%</span>
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Score</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-white truncate max-w-full">{selectedHistoryItem.fileName}</p>
                    <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">
                      {selectedHistoryItem.createdAt ? new Date(selectedHistoryItem.createdAt.toDate()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                    </p>
                  </div>

                  {/* Section Scores */}
                  {selectedHistoryItem.analysisResult?.section_scores && (
                    <div className="bg-[#1a191f] rounded-[2rem] p-6 border border-white/5 space-y-4">
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Metric Breakdown</p>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(selectedHistoryItem.analysisResult.section_scores).map(([key, val]) => (
                          <div key={key} className="bg-[#0f0e13] p-4 rounded-xl border border-white/5 text-center">
                            <p className="text-xl font-black text-white">{val as number}</p>
                            <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-1">{key.replace('_', ' ')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matched Keywords */}
                  {selectedHistoryItem.analysisResult?.matched_keywords?.length > 0 && (
                    <div className="bg-[#1a191f] rounded-[2rem] p-6 border border-white/5 space-y-3">
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em]">✓ Matched Keywords</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedHistoryItem.analysisResult.matched_keywords.slice(0, 12).map((kw: string) => (
                          <span key={kw} className="px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 text-[9px] font-black rounded-lg uppercase tracking-wider">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Keywords */}
                  {selectedHistoryItem.analysisResult?.missing_keywords?.length > 0 && (
                    <div className="bg-[#1a191f] rounded-[2rem] p-6 border border-white/5 space-y-3">
                      <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.3em]">✗ Missing Keywords</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedHistoryItem.analysisResult.missing_keywords.slice(0, 10).map((kw: string) => (
                          <span key={kw} className="px-3 py-1.5 bg-red-500/5 border border-red-500/10 text-red-500 text-[9px] font-black rounded-lg uppercase tracking-wider">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Suggestions */}
                  {(selectedHistoryItem.analysisResult?.ai_feedback?.suggested_resume_changes || selectedHistoryItem.analysisResult?.improvement_suggestions)?.length > 0 && (
                    <div className="bg-gradient-to-br from-orange-950/20 to-transparent rounded-[2rem] p-6 border border-orange-500/10 space-y-4">
                      <p className="text-[9px] font-black text-orange-500 uppercase tracking-[0.3em]">⚡ Action Items</p>
                      <ul className="space-y-3">
                        {(selectedHistoryItem.analysisResult.ai_feedback?.suggested_resume_changes || selectedHistoryItem.analysisResult.improvement_suggestions).slice(0, 5).map((item: string, idx: number) => (
                          <li key={idx} className="flex gap-3 text-xs text-gray-400 font-medium group">
                            <span className="flex-shrink-0 w-6 h-6 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center text-[9px] font-black text-orange-500">{idx + 1}</span>
                            <span className="pt-0.5 leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : sidebarTab === 'history' ? (
                /* ───── History List (Reviews) ───── */
                historyItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-gray-700" />
                    </div>
                    <p className="text-gray-500 text-sm font-bold">No review history yet</p>
                    <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Analyze a resume above to create your first review</p>
                  </div>
                ) : (
                  historyItems.map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedHistoryItem(item)}
                      className="w-full text-left group bg-[#1a191f] hover:bg-[#1f1e25] border border-white/5 hover:border-orange-500/30 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-0.5 flex items-center gap-5"
                    >
                      {/* Score Badge */}
                      <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white border ${
                        item.overallScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/20' :
                        item.overallScore >= 60 ? 'bg-orange-500/10 border-orange-500/20' :
                        'bg-red-500/10 border-red-500/20'
                      }`}>
                        {item.overallScore || '–'}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <p className="text-sm font-bold text-white truncate group-hover:text-orange-500 transition-colors">{item.fileName || 'Untitled'}</p>
                        <div className="flex items-center gap-2 text-[9px] text-gray-600 font-black uppercase tracking-[0.15em]">
                          <Clock className="w-3 h-3 text-orange-500/40" />
                          {item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-orange-500 transition-colors" />
                    </button>
                  ))
                )
              ) : (
                /* ───── My Resumes List (AI-Built) ───── */
                myResumes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-700" />
                    </div>
                    <p className="text-gray-500 text-sm font-bold">No AI-built resumes yet</p>
                    <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Use the TREX chatbot to build your first resume</p>
                    <button onClick={() => { setIsSidebarOpen(false); setIsChatOpen(true); }} className="mt-2 px-6 py-3 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-orange-500 transition-colors shadow-lg shadow-orange-500/20">
                      Start Building
                    </button>
                  </div>
                ) : (
                  myResumes.map((item: any) => (
                    <div key={item.id} className="group bg-[#1a191f] border border-white/5 hover:border-emerald-500/30 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5">
                      <div className="flex items-center gap-5">
                        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                          <FileText className="w-6 h-6 text-emerald-500 group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <p className="text-sm font-bold text-white truncate">{item.fileName || 'Untitled Resume'}</p>
                          <div className="flex items-center gap-2 text-[9px] text-gray-600 font-black uppercase tracking-[0.15em]">
                            <Clock className="w-3 h-3 text-emerald-500/40" />
                            {item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <a
                          href={item.pdfData || item.url}
                          download={item.fileName || 'resume.pdf'}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-colors shadow-lg shadow-emerald-500/20"
                        >
                          <Download className="w-3.5 h-3.5" /> Download PDF
                        </a>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>

            {/* Panel Footer */}
            <div className="px-8 py-5 border-t border-white/5 bg-[#1a191f]/30 flex items-center justify-between">
              <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">
                {sidebarTab === 'history' ? `${historyItems.length} Reviews` : `${myResumes.length} Resumes`}
              </p>
              <Link href="/my-resumes" onClick={() => setIsSidebarOpen(false)}>
                <span className="text-[10px] font-black text-orange-500 hover:text-orange-400 uppercase tracking-[0.2em] transition-colors cursor-pointer">Full Dashboard →</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
    )}
    </ProtectedRoute>
  );
}
