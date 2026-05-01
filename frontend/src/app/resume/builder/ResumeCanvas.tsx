"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Download, Edit3, Save, ChevronLeft, Sparkles, Loader2, Wand2, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

interface ResumeCanvasProps {
  sessionId: string;
  onBack: () => void;
}

const ResumeCanvas: React.FC<ResumeCanvasProps> = ({ sessionId, onBack }) => {
  const [resume, setResume] = useState<any>({
    personal_info: {},
    summary: "",
    education: [],
    experience: [],
    projects: [],
    skills: {},
  });
  const [status, setStatus] = useState("initializing");
  const [progress, setProgress] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [refiningSection, setRefiningSection] = useState<string | null>(null);
  const [aiInstruction, setAiInstruction] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  // Keep a ref to resume data so the SSE callback always sees current state
  const resumeRef = useRef(resume);
  useEffect(() => { resumeRef.current = resume; }, [resume]);

  useEffect(() => {
    if (!sessionId) return;

    const eventSource = new EventSource(`http://localhost:8000/api/builder/stream/${sessionId}`);

    eventSource.onmessage = async (event) => {
      const payload = JSON.parse(event.data);
      if (payload.section === 'heading') {
        setResume((prev: any) => ({ ...prev, personal_info: payload.data }));
        setProgress(10);
      } else if (payload.section === 'summary') {
        setResume((prev: any) => ({ ...prev, summary: payload.data }));
        setProgress(30);
      } else if (payload.section === 'education') {
        setResume((prev: any) => ({ ...prev, education: payload.data }));
        setProgress(45);
      } else if (payload.section === 'experience_item') {
        setResume((prev: any) => ({ ...prev, experience: [...prev.experience, payload.data] }));
        setProgress((prev) => Math.min(prev + 10, 80));
      } else if (payload.section === 'project_item') {
        setResume((prev: any) => ({ ...prev, projects: [...prev.projects, payload.data] }));
        setProgress((prev) => Math.min(prev + 5, 90));
      } else if (payload.section === 'skills') {
        setResume((prev: any) => ({ ...prev, skills: payload.data }));
        setProgress(95);
      } else if (payload.section === 'pdf_url') {
        const backendUrl = payload.data;
        setStatus("uploading");
        setProgress(98);
        
        // Upload to Firebase if user is logged in
        if (typeof window !== 'undefined') {
            try {
                const { auth, db } = await import('@/lib/firebase');
                const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
                
                if (!auth.currentUser) {
                    alert("⚠️ Not Logged In: Please login to save this to your history.");
                    return;
                }

                const uid = auth.currentUser.uid;
                const currentResume = resumeRef.current;
                const resumeName = currentResume.personal_info?.name || "AI";

                if (backendUrl && backendUrl.length > 0) {
                    // Backend generated a PDF — fetch it and save as Base64
                    console.log("[CANVAS] Fetching PDF from:", backendUrl);
                    const response = await fetch(backendUrl);
                    
                    if (!response.ok) {
                        throw new Error(`PDF fetch failed: ${response.status}`);
                    }
                    
                    const blob = await response.blob();
                    
                    // Convert Blob to Base64
                    const base64data = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(blob);
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = () => reject(new Error("FileReader failed"));
                    });
                    
                    const resumesCollection = collection(db, "users", uid, "resumes");
                    await addDoc(resumesCollection, {
                        userId: uid,
                        sessionId: sessionId,
                        pdfData: base64data,
                        fileName: `${resumeName}_Resume.pdf`,
                        type: 'builder',
                        createdAt: serverTimestamp()
                    });
                    console.log("[CANVAS] Resume PDF saved to Firestore!");
                    alert("✅ Resume saved to Cloud History!");
                } else {
                    // PDF generation failed on backend — save resume data as JSON fallback
                    console.warn("[CANVAS] No PDF URL received, saving resume data directly...");
                    const resumesCollection = collection(db, "users", uid, "resumes");
                    await addDoc(resumesCollection, {
                        userId: uid,
                        sessionId: sessionId,
                        resumeData: JSON.stringify(currentResume),
                        fileName: `${resumeName}_Resume.pdf`,
                        type: 'builder',
                        createdAt: serverTimestamp()
                    });
                    console.log("[CANVAS] Resume data saved to Firestore (no PDF)!");
                    alert("✅ Resume saved! (PDF generation had an issue, but your data is safe in the cloud)");
                }
            } catch (err: any) {
                console.error("[CANVAS] Firebase save failed:", err);
                alert(`❌ Cloud Sync Failed: ${err.message}`);
            }
        }
      } else if (payload.section === 'status' && payload.data === 'complete') {
        setStatus("complete");
        setProgress(100);
        eventSource.close();
      } else if (payload.error) {
        console.error("[CANVAS] Stream error:", payload.error);
        setStatus("error");
        eventSource.close();
      }
    };

    eventSource.onerror = (err) => {
      console.error("[CANVAS] EventSource error:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId]);

  const handleExport = () => {
    window.print();
  };

  const handleAIEdit = async (sectionType: string, content: any) => {
    if (!aiInstruction.trim()) return;
    setIsRefining(true);
    try {
      const res = await fetch(`http://localhost:8000/api/builder/ai-edit?section_type=${sectionType}&instruction=${encodeURIComponent(aiInstruction)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const result = await res.json();
      
      // Update local state based on section type
      setResume((prev: any) => {
        const newData = { ...prev };
        if (sectionType === 'summary') newData.summary = result.data;
        else if (sectionType === 'experience') newData.experience = result.data;
        else if (sectionType === 'projects') newData.projects = result.data;
        else if (sectionType === 'skills') newData.skills = result.data;
        return newData;
      });
      
      setRefiningSection(null);
      setAiInstruction("");
    } catch (e) {
      alert("AI refinement failed");
    } finally {
      setIsRefining(false);
    }
  };

  const SectionOverlay = ({ type, content }: { type: string, content: any }) => (
    <div className="absolute inset-0 bg-orange-500/0 hover:bg-orange-500/5 transition-colors group flex items-start justify-end p-2 pointer-events-none no-print">
       <button 
         onClick={() => setRefiningSection(type)}
         className="pointer-events-auto opacity-0 group-hover:opacity-100 bg-orange-500 text-white p-2 rounded-full shadow-lg transform translate-x-4 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-2 text-xs font-bold px-4"
       >
         <Wand2 className="w-3 h-3" /> Edit with AI
       </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f0e13] text-gray-100 flex flex-col pt-24">
      {/* AI Refinement Modal */}
      {refiningSection && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-[#151419] w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 space-y-6 shadow-2xl">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <Sparkles className="text-orange-500" /> Refine {refiningSection}
              </h3>
              <p className="text-sm text-gray-400">Tell TREX how you want to change this section. (e.g. "Make it more professional", "Add more tech keywords")</p>
              <textarea 
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                placeholder="Your instructions..."
                className="w-full bg-[#0f0e13] border border-white/10 rounded-2xl p-4 text-sm text-gray-200 min-h-[120px] focus:border-orange-500/50 outline-none"
              />
              <div className="flex gap-4">
                 <Button 
                   onClick={() => setRefiningSection(null)}
                   variant="outline" className="flex-1 rounded-xl"
                 >
                   Cancel
                 </Button>
                 <Button 
                   disabled={isRefining || !aiInstruction.trim()}
                   onClick={() => handleAIEdit(refiningSection, resume[refiningSection])}
                   className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold"
                 >
                   {isRefining ? <Loader2 className="animate-spin w-4 h-4" /> : "Apply AI Edits"}
                 </Button>
              </div>
           </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="fixed top-0 w-full z-50 bg-[#151419]/80 backdrop-blur-xl px-6 md:px-12 py-4 flex justify-between items-center border-b border-white/5 no-print">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Resume Builder</h1>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${status === 'complete' ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                {status === 'complete' ? 'Ready for export' : 
                 status === 'uploading' ? 'Syncing with Cloud...' : 'AI Polishing in progress...'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <Button 
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "default" : "outline"} 
            className={`rounded-full border-white/10 ${isEditing ? 'bg-green-500 hover:bg-green-600' : 'hover:bg-white/5'}`}
          >
            {isEditing ? <Check className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />} 
            {isEditing ? "Finish Editing" : "Manual Edit"}
          </Button>
          <Button onClick={handleExport} className="rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold px-8">
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        </div>
      </div>

      <main className="flex-1 flex gap-8 p-8 overflow-hidden">
        {/* Left: Progress/Status */}
        <div className="w-80 flex flex-col gap-6 no-print">
           <div className="bg-[#151419] p-6 rounded-[2rem] border border-white/5 shadow-2xl">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                Build Pipeline
              </h3>
              <div className="space-y-6">
                 <div className="flex justify-between text-xs font-bold">
                    <span>Overall Progress</span>
                    <span className="text-orange-500">{progress}%</span>
                 </div>
                 <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                 </div>
                 
                 <div className="space-y-3 pt-4">
                    {[
                        { label: "Identity Check", active: progress >= 10 },
                        { label: "Narrative Synthesis", active: progress >= 30 },
                        { label: "Academic Audit", active: progress >= 45 },
                        { label: "Career Extraction", active: progress >= 70 },
                        { label: "Technical Indexing", active: progress >= 95 },
                        { label: "Cloud Synchronization", active: progress >= 98 },
                    ].map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                           <div className={`w-1.5 h-1.5 rounded-full ${step.active ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'bg-gray-800'}`}></div>
                           <span className={`text-[11px] font-bold uppercase tracking-wider ${step.active ? 'text-white' : 'text-gray-600'}`}>
                             {step.label}
                           </span>
                        </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>

        {/* Right: Resume Canvas */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#1a1920] rounded-[2rem] border border-white/5 p-12 shadow-inner resume-container">
           <div 
             className={`max-w-[800px] mx-auto bg-white text-gray-900 p-16 shadow-2xl min-h-[1100px] font-serif relative ${isEditing ? 'ring-2 ring-orange-500/50' : ''}`}
           >
              {/* Header */}
              <div className="border-b-2 border-gray-900 pb-8 mb-8 text-center relative group">
                 <h1 
                   contentEditable={isEditing} suppressContentEditableWarning={true}
                   onBlur={(e) => setResume((p: any) => ({ ...p, personal_info: { ...p.personal_info, name: e.currentTarget.textContent }}))}
                   className="text-4xl font-bold mb-2 uppercase tracking-tight outline-none"
                 >
                   {resume.personal_info.name || "YOUR NAME"}
                 </h1>
                 <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-gray-600">
                    <span contentEditable={isEditing} suppressContentEditableWarning={true} className="outline-none">{resume.personal_info.email}</span>
                    <span contentEditable={isEditing} suppressContentEditableWarning={true} className="outline-none">{resume.personal_info.phone}</span>
                    <span contentEditable={isEditing} suppressContentEditableWarning={true} className="outline-none">{resume.personal_info.location}</span>
                 </div>
              </div>

              {/* Summary */}
              {resume.summary && (
                <section className="mb-8 relative">
                   <h2 className="text-lg font-bold border-b border-gray-300 mb-3 uppercase tracking-wider">Professional Summary</h2>
                   <p 
                     contentEditable={isEditing} suppressContentEditableWarning={true}
                     onBlur={(e) => setResume((p: any) => ({ ...p, summary: e.currentTarget.textContent }))}
                     className="text-sm leading-relaxed text-gray-800 outline-none"
                   >
                     {resume.summary}
                   </p>
                   <SectionOverlay type="summary" content={resume.summary} />
                </section>
              )}

              {/* Experience */}
              {resume.experience.length > 0 && (
                <section className="mb-8 relative">
                   <h2 className="text-lg font-bold border-b border-gray-300 mb-4 uppercase tracking-wider">Experience</h2>
                   <div className="space-y-6">
                      {resume.experience.map((exp: any, idx: number) => (
                        <div key={idx} className="relative">
                           <div className="flex justify-between items-baseline mb-1">
                              <h3 contentEditable={isEditing} suppressContentEditableWarning={true} className="font-bold text-base outline-none">{exp.role}</h3>
                              <span contentEditable={isEditing} suppressContentEditableWarning={true} className="text-xs font-bold text-gray-500 uppercase outline-none">{exp.start_date} - {exp.end_date || "Present"}</span>
                           </div>
                           <div className="flex justify-between items-baseline mb-2">
                              <span contentEditable={isEditing} suppressContentEditableWarning={true} className="font-bold text-sm text-gray-700 italic outline-none">{exp.company}</span>
                              <span contentEditable={isEditing} suppressContentEditableWarning={true} className="text-xs font-medium text-gray-500 outline-none">{exp.location}</span>
                           </div>
                           <ul className="list-disc ml-4 space-y-1">
                              {exp.bullets.map((bullet: string, bidx: number) => (
                                <li key={bidx} contentEditable={isEditing} suppressContentEditableWarning={true} className="text-sm text-gray-800 outline-none">{bullet}</li>
                              ))}
                           </ul>
                        </div>
                      ))}
                   </div>
                   <SectionOverlay type="experience" content={resume.experience} />
                </section>
              )}

              {/* Projects */}
              {resume.projects.length > 0 && (
                <section className="mb-8 relative">
                   <h2 className="text-lg font-bold border-b border-gray-300 mb-4 uppercase tracking-wider">Projects</h2>
                   <div className="space-y-4">
                      {resume.projects.map((proj: any, idx: number) => (
                        <div key={idx} className="relative">
                           <div className="flex justify-between items-baseline mb-1">
                              <h3 contentEditable={isEditing} suppressContentEditableWarning={true} className="font-bold text-sm outline-none">{proj.name}</h3>
                              {proj.tech_stack && <span contentEditable={isEditing} suppressContentEditableWarning={true} className="text-[10px] font-bold text-gray-500 uppercase outline-none">{proj.tech_stack.join(' | ')}</span>}
                           </div>
                           <p contentEditable={isEditing} suppressContentEditableWarning={true} className="text-sm text-gray-800 outline-none">{proj.description}</p>
                        </div>
                      ))}
                   </div>
                   <SectionOverlay type="projects" content={resume.projects} />
                </section>
              )}

              {/* Skills */}
              {Object.keys(resume.skills).length > 0 && (
                <section className="relative">
                   <h2 className="text-lg font-bold border-b border-gray-300 mb-4 uppercase tracking-wider">Technical Skills</h2>
                   <div className="space-y-2">
                      {Object.entries(resume.skills).map(([category, items]: [string, any], idx) => (
                        <div key={idx} className="text-sm">
                           <span contentEditable={isEditing} suppressContentEditableWarning={true} className="font-bold outline-none">{category}: </span>
                           <span contentEditable={isEditing} suppressContentEditableWarning={true} className="outline-none">{items.join(', ')}</span>
                        </div>
                      ))}
                   </div>
                   <SectionOverlay type="skills" content={resume.skills} />
                </section>
              )}
           </div>
        </div>
      </main>
    </div>
  );
};

export default ResumeCanvas;
