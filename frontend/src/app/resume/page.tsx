"use client";

import ProtectedRoute from "@/components/ProtectedRoute";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, TrendingUp, Info } from "lucide-react";

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
  const severityColors = {
    critical: "bg-red-50 border-red-200 text-red-800",
    major: "bg-orange-50 border-orange-200 text-orange-800",
    moderate: "bg-amber-50 border-amber-200 text-amber-800",
    minor: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const badgeColors = {
    critical: "bg-red-500 text-white",
    major: "bg-orange-500 text-white",
    moderate: "bg-amber-500 text-white",
    minor: "bg-blue-500 text-white",
  };

  return (
    <Card className={`glass shadow-md border ${severityColors[card.severity]}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{card.title}</CardTitle>
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${badgeColors[card.severity]}`}>
            {card.severity}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed opacity-90">{card.details}</p>
        
        {card.action_items && card.action_items.length > 0 && (
          <div className="pt-2 border-t border-current/10">
            <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-70">Action Items</p>
            <div className="space-y-2">
              {card.action_items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white/40 p-2 rounded border border-white/40">
                  <span className="text-xs font-medium">{item.label}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-white/60 rounded border border-white/80">{item.impact}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ResumeOptimizer() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [useAI, setUseAI] = useState<boolean>(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

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
    <div className="relative min-h-screen flex flex-col font-sans text-gray-900 selection:bg-orange-200">
      {/* Background */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[#fdfdfd]">
        <div className="absolute top-[-10%] left-[10%] w-[50%] h-[600px] bg-gradient-to-br from-orange-100/80 to-amber-50/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[60%] h-[700px] bg-orange-100/40 rounded-full blur-[140px]" />
        <div className="absolute top-[20%] right-[-5%] w-[40%] h-[500px] bg-red-100/30 rounded-full blur-[130px]" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass-nav px-6 md:px-12 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold tracking-tighter text-black">
          trex<span className="text-orange-500">.ai</span>
        </Link>
        <div className="hidden md:flex items-center gap-10 text-[13px] font-semibold text-gray-600 tracking-wide">
          <Link href="/" className="hover:text-black transition">HOME</Link>
          <span className="text-black border-b-2 border-orange-500 pb-0.5">RESUME AI</span>
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
          <h1 className="text-4xl font-bold tracking-tight mb-3 text-gray-900">Senior AI Resume Review</h1>
          <p className="text-gray-500 text-lg">Expert-level analysis driven by a sharp Senior HR + Technical persona.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="glass shadow-xl shadow-gray-200/50 h-fit">
            <CardHeader>
              <CardTitle>Your Resume (PDF)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-md bg-white hover:bg-gray-50 transition p-4">
                <input
                  id="resume-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                {!resumeFile && <p className="text-xs text-gray-400 mt-4 text-center">Only PDFs up to 5MB supported.</p>}
                {resumeFile && <p className="text-sm font-semibold text-green-600 mt-4">Selected: {resumeFile.name}</p>}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="use-ai" 
                  checked={useAI} 
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="w-4 h-4 text-orange-600 accent-orange-500 rounded focus:ring-orange-500"
                />
                <label htmlFor="use-ai" className="text-sm text-gray-700 font-medium cursor-pointer">
                  Enable Senior AI Review (Detailed & Honest)
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="glass shadow-xl shadow-gray-200/50 h-fit">
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description here..."
                className="w-full h-64 bg-white border border-gray-200 rounded-md p-4 text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none shadow-sm transition-all resize-none"
                aria-label="Job description"
              />
              <p className="text-xs text-gray-400">
                Tip: Include the full description for better role-alignment extraction.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={analyzeResume}
            disabled={loading || !resumeFile || !jobDescription.trim()}
            className="w-full md:w-auto px-8 h-12 flex items-center bg-orange-500 hover:bg-orange-600 text-white shadow-md text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing AI Review..." : "Analyze Now"}
          </Button>
          <Button
            onClick={handleClear}
            disabled={loading}
            className="w-full md:w-auto px-8 h-12 flex items-center bg-gray-200 hover:bg-gray-300 text-gray-900 shadow-md text-lg font-semibold"
          >
            Clear
          </Button>
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-10 animate-in fade-in duration-500">
            {/* Overall Score section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Match Score */}
              <Card className="glass md:col-span-1 shadow-xl shadow-orange-200/50 border-orange-200">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <p className="text-gray-500 text-sm font-medium">ATS Match Integrity</p>
                    <div className="relative w-36 h-36">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={analysis.overall_score >= 80 ? "#22c55e" : analysis.overall_score >= 60 ? "#f97316" : "#ef4444"}
                          strokeWidth="8"
                          strokeDasharray={`${(analysis.overall_score / 100) * 251.2} 251.2`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-3xl font-bold text-gray-800">{analysis.overall_score}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sub Scores */}
              <Card className="glass md:col-span-2 shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Metric Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(analysis.section_scores).map(([key, value]) => (
                      <div key={key} className="bg-white/60 p-4 rounded-lg border border-gray-100 flex flex-col items-center text-center">
                        <span className="text-2xl font-bold text-gray-800 mb-1">{value}</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{key.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Senior Review Cards */}
            {analysis.ai_feedback && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                   <div className="h-px flex-1 bg-gray-200"></div>
                   <h2 className="text-xl font-bold text-gray-800 uppercase tracking-widest px-4">Senior Assessor Report</h2>
                   <div className="h-px flex-1 bg-gray-200"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-none shadow-2xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <TrendingUp className="w-32 h-32" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-orange-400" />
                      Priority Action Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div>
                         <p className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-4">Urgent Fixes</p>
                         <ul className="space-y-3">
                           {analysis.ai_feedback.suggested_resume_changes.slice(0, 5).map((change, idx) => (
                             <li key={idx} className="flex items-start gap-3 text-sm text-gray-200">
                               <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px] font-bold border border-orange-500/30">
                                 {idx + 1}
                               </span>
                               {change}
                             </li>
                           ))}
                         </ul>
                       </div>
                       <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                         <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">Strategic Insight</p>
                         <p className="text-sm text-gray-300 leading-relaxed italic">
                           "The most impactful change you can make right now is focusing on the <strong>{analysis.ai_feedback.role_alignment.title}</strong> action items. Addressing these will increase your interview callback rate by an estimated 40% for roles in this domain."
                         </p>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Keyword and Structure Sections (Preserved) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-gray-100">
               {/* Architecture and Body Sections */}
               <Card className="glass shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-700">Resume Architecture</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Detected Sections</p>
                    <div className="flex flex-wrap gap-2">
                       {analysis.detected_sections.map(sec => (
                         <span key={sec} className="bg-green-50 border border-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase">{sec}</span>
                       ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Missing Priority Sections</p>
                    <div className="flex flex-wrap gap-2">
                       {analysis.missing_sections.map(sec => (
                         <span key={sec} className="bg-red-50 border border-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded uppercase">{sec}</span>
                       ))}
                       {analysis.missing_sections.length === 0 && <span className="text-xs text-green-600">Standard structure verified.</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Matched Keywords */}
              <Card className="glass shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-green-700 font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    Keywords Found ({analysis.matched_keywords.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    {analysis.matched_keywords.map((keyword) => (
                      <span key={keyword} className="px-2 py-1 bg-green-50 text-green-800 border border-green-100 rounded text-[10px] font-bold uppercase">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Missing Keywords */}
              <Card className="glass shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-red-600 font-bold">
                    <AlertCircle className="w-5 h-5" />
                    Missing Keywords ({analysis.missing_keywords.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {analysis.missing_keywords.map((keyword) => (
                      <span key={keyword} className="px-2 py-1 bg-red-50 text-red-800 border border-red-100 rounded text-[10px] font-bold uppercase">
                        {keyword}
                      </span>
                    ))}
                    {analysis.missing_keywords.length === 0 && <span className="text-xs text-green-600 font-bold">JD keyword target met!</span>}
                  </div>
                </CardContent>
              </Card>

              {/* Suggestions */}
              <Card className="glass shadow-xl shadow-blue-200/30 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-800 font-bold">System Warnings</CardTitle>
                </CardHeader>
                <CardContent className="h-48 overflow-y-auto pr-2 custom-scrollbar">
                  <ul className="space-y-3">
                    {analysis.improvement_suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold uppercase">
                          {idx + 1}
                        </span>
                        <span className="text-xs text-gray-700 leading-snug">{suggestion}</span>
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
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <p className="text-gray-500 text-lg mb-4">Upload your PDF and paste a job description above to score yourself</p>
              <p className="text-gray-400 text-sm">Our ATS pipeline will review keywords, formatting, sections, and provide AI feedback.</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
              <p className="text-gray-500 text-lg font-medium">Running pipeline...</p>
              <p className="text-gray-400 text-sm mt-2">Checking sections, ATS formatting, and keyword matching.</p>
            </div>
          </div>
        )}
      </main>
    </div>
    </ProtectedRoute>
  );
}
