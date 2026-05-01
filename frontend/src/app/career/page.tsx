"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { 
  Card, CardHeader, CardTitle, CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, MapPin, TrendingUp, Sparkles, 
  UploadCloud, FileText, CheckCircle2, 
  AlertCircle, ExternalLink, 
  BarChart3, Globe, ShieldCheck, Zap,
  Search, Layers
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

interface JobMatch {
  role: string;
  match_score: number;
  missing_skills: string[];
  skills_to_learn: string[];
  description: string;
}

interface CareerAnalysisResult {
  recommended_roles: JobMatch[];
  overall_match_score: number;
  missing_skills: string[];
  skills_to_learn: string[];
  improvement_suggestions: string[];
  job_readiness_score: number;
  roadmap: string[];
  extracted_skills: string[];
  sample_jobs?: any[];
}

export default function CareerMatchmaker() {
  const { user } = useAuth();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [location, setLocation] = useState("");
  const [expLevel, setExpLevel] = useState("entry");
  const [salary, setSalary] = useState("");
  const [jobType, setJobType] = useState("full-time");
  
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CareerAnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const analyzeCareer = async () => {
    setLoading(true);
    setError("");
    setAnalysis(null);
    setShowLoginPrompt(false);

    try {
      if (!resumeFile) throw new Error("Please upload a PDF resume");
      if (!targetRole) throw new Error("Please enter your target role");
      if (!location) throw new Error("Please enter your preferred location");

      const formData = new FormData();
      formData.append("resume_file", resumeFile);
      formData.append("target_role", targetRole);
      formData.append("location", location);
      formData.append("experience_level", expLevel);
      formData.append("expected_salary", salary);
      formData.append("job_type", jobType);

      const res = await fetch("http://localhost:8000/api/career/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to analyze career match");
      }

      const data: CareerAnalysisResult = await res.json();
      setAnalysis(data);

      if (user) {
        const matchId = crypto.randomUUID();
        await setDoc(doc(db, "careerMatches", matchId), {
          uid: user.uid,
          userEmail: user.email,
          targetRole,
          preferredLocation: location,
          experienceLevel: expLevel,
          expectedSalary: salary,
          jobType,
          resumeFileName: resumeFile.name,
          extractedSkills: data.extracted_skills,
          matchScore: data.overall_match_score,
          missingSkills: data.missing_skills,
          recommendedJobs: data.recommended_roles,
          improvementSuggestions: data.improvement_suggestions,
          jobReadinessScore: data.job_readiness_score,
          createdAt: serverTimestamp(),
        });
      } else {
        setShowLoginPrompt(true);
      }

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setTimeout(() => {
        if (!error && !loading) {
          window.scrollTo({ top: 800, behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const generateJobLinks = (role: string, loc: string) => {
    const q = encodeURIComponent(role);
    const l = encodeURIComponent(loc);
    return [
      { name: "Internshala", url: `https://internshala.com/jobs/${q.toLowerCase().replace(/ /g, '-')}-jobs-in-${l.toLowerCase().replace(/ /g, '-')}`, color: "text-orange-500" },
      { name: "Indeed", url: `https://www.indeed.co.in/jobs?q=${q}&l=${l}`, color: "text-orange-400" },
      { name: "LinkedIn", url: `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${l}`, color: "text-orange-300" },
      { name: "Naukri", url: `https://www.naukri.com/${q.toLowerCase().replace(/ /g, '-')}-jobs-in-${l.toLowerCase().replace(/ /g, '-')}`, color: "text-orange-200" },
    ];
  };

  return (
    <ProtectedRoute>
    <div className="relative min-h-screen flex flex-col font-sans text-white selection:bg-emerald-500/30">
      {/* Background - True Premium Dark */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#0a0a0c]">
        <div className="absolute top-[-10%] left-[10%] w-[50%] h-[600px] bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[60%] h-[700px] bg-blue-500/5 rounded-full blur-[140px]" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#0f0e13]/80 backdrop-blur-xl px-6 md:px-12 py-4 flex justify-between items-center border-b border-white/5">
        <Link href="/" className="text-2xl font-bold tracking-tighter text-white">
          trex<span className="text-emerald-500">.ai</span>
        </Link>
        <div className="hidden md:flex items-center gap-10 text-[11px] font-bold text-gray-500 tracking-[0.2em] uppercase">
          <Link href="/" className="hover:text-white transition">HOME</Link>
          <span className="text-white border-b-2 border-emerald-500 pb-0.5">CAREER AI</span>
        </div>
        <Link href="/">
          <button className="px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white">
            Back to Home
          </button>
        </Link>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full pt-36 px-6 pb-20 space-y-16">
        {/* Premium Hero Section */}
        <div className="flex flex-col items-center text-center space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black tracking-[0.3em] uppercase">
            <Sparkles className="w-3 h-3" />
            CAREER INTELLIGENCE ENGINE
          </div>
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white">
            Discover Your Perfect Role
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl leading-relaxed font-medium">
            Map your skills to the market. Get a precise match score, identify skill gaps, and get a roadmap to your dream career.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <div className="flex items-center gap-3 px-5 py-2.5 bg-[#1a191f] border border-white/5 rounded-2xl shadow-xl text-[11px] font-black text-gray-300 tracking-widest uppercase">
               <Search className="w-4 h-4 text-emerald-500" />
               MARKET FIT
            </div>
            <div className="flex items-center gap-3 px-5 py-2.5 bg-[#1a191f] border border-white/5 rounded-2xl shadow-xl text-[11px] font-black text-gray-300 tracking-widest uppercase">
               <Layers className="w-4 h-4 text-blue-500" />
               SKILL GAPS
            </div>
            <div className="flex items-center gap-3 px-5 py-2.5 bg-[#1a191f] border border-white/5 rounded-2xl shadow-xl text-[11px] font-black text-gray-300 tracking-widest uppercase">
               <TrendingUp className="w-4 h-4 text-green-500" />
               ROADMAP
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Input Section - Career Preferences */}
          <Card className="bg-[#1a191f] shadow-2xl shadow-black/50 h-fit border-white/5 overflow-hidden">
            <CardHeader className="pb-2 border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-500" />
                Career Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Target Role</label>
                <input 
                  type="text" 
                  value={targetRole} 
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Developer"
                  className="w-full bg-[#0f0e13]/50 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-white placeholder:text-gray-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Preferred Location</label>
                <input 
                  type="text" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bangalore, Remote"
                  className="w-full bg-[#0f0e13]/50 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-white placeholder:text-gray-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Experience Level</label>
                  <select 
                    value={expLevel} 
                    onChange={(e) => setExpLevel(e.target.value)}
                    className="w-full bg-[#0f0e13]/50 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-white appearance-none"
                  >
                    <option value="internship" className="bg-[#1a191f]">Internship</option>
                    <option value="entry" className="bg-[#1a191f]">Entry Level</option>
                    <option value="mid" className="bg-[#1a191f]">Mid Level</option>
                    <option value="senior" className="bg-[#1a191f]">Senior Level</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Job Type</label>
                  <select 
                    value={jobType} 
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full bg-[#0f0e13]/50 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-white appearance-none"
                  >
                    <option value="full-time" className="bg-[#1a191f]">Full Time</option>
                    <option value="remote" className="bg-[#1a191f]">Remote</option>
                    <option value="hybrid" className="bg-[#1a191f]">Hybrid</option>
                    <option value="internship" className="bg-[#1a191f]">Internship</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Expected Salary (Annual)</label>
                <input 
                  type="text" 
                  value={salary} 
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="e.g. 12-15 LPA"
                  className="w-full bg-[#0f0e13]/50 border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-white placeholder:text-gray-700"
                />
              </div>
            </CardContent>
          </Card>

          {/* Resume Upload Section */}
          <Card className="bg-[#1a191f] shadow-2xl shadow-black/50 h-fit border-white/5 overflow-hidden">
             <CardHeader className="pb-2 border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                Resume Document
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 flex flex-col items-center justify-center h-full min-h-[300px]">
               <div 
                className={`group relative flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-[2rem] transition-all duration-500 bg-[#0f0e13]/50
                  ${resumeFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/[0.02]'}`}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {!resumeFile ? (
                  <div className="flex flex-col items-center text-center p-6 space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform duration-500 border border-emerald-500/20">
                       <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-widest">Drop Resume</p>
                      <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-tighter">PDF ONLY • MAX 2MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center p-6 space-y-4 animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-24 bg-[#1a191f] rounded-xl border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 flex items-center justify-center relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                       <FileText className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white line-clamp-1 px-4">{resumeFile.name}</p>
                      <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Ready for analysis</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setResumeFile(null); }} className="text-[10px] font-black text-gray-500 hover:text-emerald-500 transition-colors uppercase tracking-widest z-20 mt-2">Remove File</button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={analyzeCareer}
            disabled={loading || !resumeFile || !targetRole}
            className="w-full md:w-96 h-20 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-500/20 text-xl font-black rounded-[2rem] transition-all duration-500 hover:-translate-y-2 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.2em] border-t border-white/20"
          >
            {loading ? (
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                Analyzing...
              </div>
            ) : (
              "Find My Match"
            )}
          </Button>
        </div>

        {error && (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {showLoginPrompt && (
          <div className="flex justify-center">
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black px-6 py-3 rounded-full flex items-center gap-3 uppercase tracking-widest animate-bounce">
              <Zap className="w-4 h-4" />
              Login to save your career analysis
            </div>
          </div>
        )}

        {/* Results Section */}
        {analysis && (
          <div className="space-y-16 pt-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <Card className="bg-[#1a191f] border-emerald-500/20 rounded-[2.5rem] shadow-2xl shadow-emerald-500/5">
                <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-6">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Market Alignment</p>
                  <div className="text-6xl font-black text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">{analysis.overall_match_score}%</div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden max-w-[80%]">
                    <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${analysis.overall_match_score}%` }}></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#1a191f] border-blue-500/20 rounded-[2.5rem] shadow-2xl shadow-blue-500/5">
                <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-6">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Job Readiness</p>
                  <div className="text-6xl font-black text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]">{analysis.job_readiness_score}%</div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden max-w-[80%]">
                    <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${analysis.job_readiness_score}%` }}></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#1a191f] border-white/5 rounded-[2.5rem] shadow-2xl">
                <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-6">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Skills Extracted</p>
                  <div className="text-6xl font-black text-white">{analysis.extracted_skills.length}</div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Verified entities</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance & Skill Gaps */}
            <div id="performance" className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <Card className="bg-[#1a191f] border-white/5 rounded-[2.5rem] shadow-2xl">
                <CardHeader className="pt-8 px-8">
                  <CardTitle className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-emerald-500" />
                    Skill Gap Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8 space-y-8">
                  <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4">Critical Missing Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.missing_skills.map(s => (
                        <span key={s} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black rounded-lg uppercase tracking-widest">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4">Priority Skills to Learn</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.skills_to_learn.map(s => (
                        <span key={s} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black rounded-lg uppercase tracking-widest">{s}</span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-[#1a191f] to-[#0a0a0c] text-white border border-white/5 shadow-2xl overflow-hidden relative rounded-[2.5rem]">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                  <TrendingUp className="w-48 h-48" />
                </div>
                <CardHeader className="pt-8 px-8">
                  <CardTitle className="text-lg font-black flex items-center gap-3 text-emerald-500 uppercase tracking-widest">
                    <TrendingUp className="w-6 h-6" />
                    Growth Roadmap
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8 space-y-6">
                  {analysis.roadmap.map((step, idx) => (
                    <div key={idx} className="flex gap-5 group">
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[11px] font-black text-emerald-500 group-hover:scale-110 transition-transform">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-gray-400 font-medium leading-relaxed group-hover:text-white transition-colors">{step}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Job Match Cards */}
            <div className="space-y-10">
               <div className="flex items-center gap-6">
                  <div className="h-px flex-1 bg-white/5"></div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-[0.4em] px-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Market Opportunities</h2>
                  <div className="h-px flex-1 bg-white/5"></div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {analysis.recommended_roles.map((job, idx) => (
                    <Card key={idx} className="bg-[#1a191f] border border-white/5 rounded-[2rem] hover:border-emerald-500/30 transition-all duration-300 group overflow-hidden">
                      <CardContent className="p-8 space-y-6">
                        <div className="flex justify-between items-start">
                          <h3 className="text-xl font-black text-white group-hover:text-emerald-500 transition-colors tracking-tight">{job.role}</h3>
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-full border border-emerald-500/20 uppercase tracking-widest">{job.match_score}% Match</span>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed font-medium line-clamp-3">{job.description}</p>
                        <div className="pt-2">
                           <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-3">Target Skills Gap</p>
                           <div className="flex flex-wrap gap-2">
                             {job.missing_skills.slice(0, 4).map(s => (
                               <span key={s} className="px-2 py-1 bg-white/5 text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-tighter">{s}</span>
                             ))}
                           </div>
                        </div>
                        <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                           {generateJobLinks(job.role, location).map(link => (
                             <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className={`text-[10px] font-black ${link.color} hover:underline flex items-center gap-2 uppercase tracking-widest`}>
                               Search {link.name} <ExternalLink className="w-3 h-3" />
                             </a>
                           ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Card className="bg-[#1a191f]/50 border-2 border-dashed border-white/5 flex flex-col items-center justify-center p-12 text-center rounded-[2rem] group hover:border-emerald-500/20 transition-all">
                     <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center shadow-2xl mb-6 group-hover:scale-110 transition-transform">
                        <Globe className="w-8 h-8 text-emerald-500" />
                     </div>
                     <p className="text-lg font-black text-white uppercase tracking-widest">Global Positions</p>
                     <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-widest">We found 8 other potential roles matching your profile.</p>
                     <Button className="mt-8 bg-white/5 border border-white/10 text-white hover:bg-white/10 text-[10px] font-black px-8 py-3 rounded-2xl uppercase tracking-widest">View Advanced Report</Button>
                  </Card>
               </div>
            </div>

            {/* Sample Jobs / Market Trends */}
            {analysis.sample_jobs && analysis.sample_jobs.length > 0 && (
              <div className="space-y-10 pt-10">
                <div className="flex items-center gap-6">
                    <div className="h-px flex-1 bg-white/5"></div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-[0.4em] px-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Market Trends</h2>
                    <div className="h-px flex-1 bg-white/5"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {analysis.sample_jobs.map((job, idx) => (
                    <Card key={idx} className="bg-[#1a191f] border-white/5 hover:border-emerald-500/20 transition-all rounded-2xl p-6 shadow-xl">
                      <CardContent className="p-0 space-y-4">
                        <div className="flex justify-between items-start">
                           <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full uppercase tracking-tighter">{job.type}</span>
                           <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{job.match_score}% MATCH</span>
                        </div>
                        <h4 className="text-sm font-black text-white leading-tight uppercase tracking-tight">{job.role}</h4>
                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{job.company}</p>
                        <div className="flex items-center gap-2 pt-2 text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                           <MapPin className="w-3 h-3 text-emerald-500" /> {job.location}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                           <Zap className="w-3 h-3" /> {job.salary}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement Section */}
            <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-[3rem] p-4">
               <CardHeader className="px-8 pt-8">
                  <CardTitle className="text-xl font-black flex items-center gap-3 text-white uppercase tracking-widest">
                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                    Resume Optimization Strategy
                  </CardTitle>
               </CardHeader>
               <CardContent className="px-8 pb-8">
                  <ul className="space-y-4">
                    {analysis.improvement_suggestions.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-4 text-sm text-gray-400 font-medium group">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        <span className="group-hover:text-white transition-colors">{s}</span>
                      </li>
                    ))}
                  </ul>
               </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
    </ProtectedRoute>
  );
}
