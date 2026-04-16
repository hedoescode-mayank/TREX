"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";

interface AnalysisResult {
  matchPercentage: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

export default function ResumeOptimizer() {
  const [resume, setResume] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const analyzeResume = () => {
    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      if (!resume.trim()) {
        throw new Error("Please enter your resume");
      }
      if (!jobDescription.trim()) {
        throw new Error("Please enter the job description");
      }

      // Extract keywords (simple tokenization)
      const extractKeywords = (text: string): string[] => {
        const words = text
          .toLowerCase()
          .match(/\b[a-z]{3,}\b/g) || [];
        // Filter out common words
        const commonWords = new Set([
          "the", "and", "for", "with", "that", "this", "from", "are", "not", "but", "can", "you", "all", "our", "out", "one", "has", "had", "have",
          "more", "than", "will", "your", "have", "such", "also", "into", "only", "over", "very", "just", "when", "what", "who", "which", "where",
          "why", "how", "all", "each", "every", "both", "few", "more", "most", "other", "some", "such", "any", "many", "much", "even", "then"
        ]);
        
        return [...new Set(words.filter(w => !commonWords.has(w) && w.length > 3))].slice(0, 20);
      };

      const resumeKeywords = extractKeywords(resume);
      const jobKeywords = extractKeywords(jobDescription);

      const matchedKeywords = resumeKeywords.filter(k => jobKeywords.includes(k));
      const missingKeywords = jobKeywords.filter(k => !resumeKeywords.includes(k)).slice(0, 10);

      const matchPercentage = jobKeywords.length > 0
        ? Math.round((matchedKeywords.length / jobKeywords.length) * 100)
        : 0;

      // Generate suggestions based on analysis
      const suggestions: string[] = [];
      
      if (matchPercentage < 50) {
        suggestions.push("Consider adding more technical keywords from the job description to your resume");
      }
      if (matchedKeywords.length > 0) {
        suggestions.push(`Great! You have ${matchedKeywords.length} matching keywords with the job description`);
      }
      if (missingKeywords.length > 5) {
        suggestions.push(`Review and add the top missing keywords: ${missingKeywords.slice(0, 3).join(", ")}`);
      }
      if (resume.length < 300) {
        suggestions.push("Your resume seems short. Add more details about your experience and skills");
      }
      suggestions.push("Highlight your achievements with quantifiable metrics (e.g., improved by 30%)");
      suggestions.push("Ensure your resume is ATS (Applicant Tracking System) friendly by using standard formatting");

      setAnalysis({
        matchPercentage,
        matchedKeywords,
        missingKeywords,
        suggestions: suggestions.slice(0, 4)
      });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "An error occurred";
      setError(errorMsg);
      alert(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setResume("");
    setJobDescription("");
    setAnalysis(null);
    setError("");
  };

  return (
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
          <h1 className="text-4xl font-bold tracking-tight mb-3 text-gray-900">Resume Optimizer</h1>
          <p className="text-gray-500 text-lg">Analyze your resume against job descriptions and get AI-powered optimization suggestions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="glass shadow-xl shadow-gray-200/50 h-fit">
            <CardHeader>
              <CardTitle>Your Resume</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder="Paste your resume here..."
                className="w-full h-64 bg-white border border-gray-200 rounded-md p-4 text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none shadow-sm transition-all resize-none"
                aria-label="Resume content"
              />
              <p className="text-xs text-gray-400">
                Tip: Paste your resume in plain text format for best results
              </p>
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
                placeholder="Paste the job description here..."
                className="w-full h-64 bg-white border border-gray-200 rounded-md p-4 text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none shadow-sm transition-all resize-none"
                aria-label="Job description"
              />
              <p className="text-xs text-gray-400">
                Tip: Include the full job description including requirements and qualifications
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={analyzeResume}
            disabled={loading}
            className="w-full md:w-auto h-12 flex items-center bg-orange-500 hover:bg-orange-600 text-white shadow-md text-lg font-semibold"
          >
            {loading ? "Analyzing..." : "Analyze Resume"}
          </Button>
          <Button
            onClick={handleClear}
            disabled={loading}
            className="w-full md:w-auto h-12 flex items-center bg-gray-200 hover:bg-gray-300 text-gray-900 shadow-md text-lg font-semibold"
          >
            Clear
          </Button>
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Match Score */}
            <Card className="glass shadow-xl shadow-orange-200/50 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Resume Match Score</p>
                    <p className="text-5xl font-bold text-orange-600">{analysis.matchPercentage}%</p>
                  </div>
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="8"
                        strokeDasharray={`${(analysis.matchPercentage / 100) * 251.2} 251.2`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <TrendingUp className="w-10 h-10 text-orange-500" />
                    </div>
                  </div>
                </div>
                <p className="text-gray-600">
                  {analysis.matchPercentage >= 80
                    ? "Excellent match! Your resume strongly aligns with this job."
                    : analysis.matchPercentage >= 60
                    ? "Good match! Consider making a few adjustments."
                    : analysis.matchPercentage >= 40
                    ? "Fair match. Review the suggestions to improve your resume."
                    : "Low match. Add more relevant keywords from the job description."}
                </p>
              </CardContent>
            </Card>

            {/* Matched Keywords */}
            {analysis.matchedKeywords.length > 0 && (
              <Card className="glass shadow-xl shadow-green-200/50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-5 h-5" />
                    Matching Keywords ({analysis.matchedKeywords.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.matchedKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Missing Keywords */}
            {analysis.missingKeywords.length > 0 && (
              <Card className="glass shadow-xl shadow-red-200/50 border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    Missing Keywords ({analysis.missingKeywords.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suggestions */}
            {analysis.suggestions.length > 0 && (
              <Card className="glass shadow-xl shadow-blue-200/50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-700">Optimization Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {analysis.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-gray-700 pt-0.5">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!analysis && !loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <p className="text-gray-500 text-lg mb-4">Paste your resume and job description above to get started</p>
              <p className="text-gray-400 text-sm">Get personalized suggestions to match your resume with the job</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
              <p className="text-gray-500 text-lg">Analyzing your resume...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
