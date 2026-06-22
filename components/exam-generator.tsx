'use client'

import { useState, useEffect, useRef } from "react";
import { Upload, CheckCircle, Sparkles, Loader2, FileText, AlertCircle, Settings2, Download, Trash2, Eye, EyeOff, Maximize, X, Printer, Clock, Play, Pause, Check, ChevronDown, RefreshCw } from "lucide-react";

const EXAM_TYPES = ["UPSC", "SSC CGL", "State PCS (RPSC)", "Banking PO", "Railway RRB", "CTET", "NEET", "JEE"];

function Badge({ level }: { level: string }) {
  const map: { [key: string]: string } = {
    Easy: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Moderate: "bg-amber-100 text-amber-700 border-amber-200",
    Hard: "bg-rose-100 text-rose-700 border-rose-200",
  };
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${map[level] || map.Easy}`}>
      {level}
    </span>
  );
}

function SliderRow({ label, value, color, onChange }: { label: string; value: number; color: string; onChange: (v: number) => void }) {
  const colors = { 
    easy: "accent-emerald-500", moderate: "accent-amber-500", hard: "accent-rose-500",
  };
  const textColors = { 
    easy: "text-emerald-600", moderate: "text-amber-600", hard: "text-rose-600",
  };
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <span className={`text-xs font-bold tabular-nums ${textColors[color]}`}>{value}%</span>
      </div>
      <input type="range" min="0" max="100" value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className={`w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 ${colors[color]}`} />
    </div>
  );
}

export function ExamGenerator({ geminiApiKey }: { geminiApiKey: string }) {
  const [inputText, setInputText] = useState("");
  const [inputTitle, setInputTitle] = useState("Mock_Test_Paper");
  const [activeTab, setActiveTab] = useState("setup");
  const [statusMessage, setStatusMessage] = useState("");
  
  const [paperLanguage, setPaperLanguage] = useState("Bilingual");
  const [distEasy, setDistEasy] = useState(30);
  const [distModerate, setDistModerate] = useState(40);
  const [distHard, setDistHard] = useState(30);
  const [examType, setExamType] = useState("State PCS (RPSC)");
  const [targetCount, setTargetCount] = useState(15);
  const [examSubject, setExamSubject] = useState("G.K. and G.S.");
  const [maxMarks, setMaxMarks] = useState("200");
  const [paperCode, setPaperCode] = useState("50");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [revealedQs, setRevealedQs] = useState({});
  const [studentAnswers, setStudentAnswers] = useState({});
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const sourceTextRef = useRef(null);
  const pdfRef = useRef(null);

  const notify = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(""), 4500);
  };

  const adjustSliders = (type: string, val: number) => {
    const rem = 100 - val;
    if (type === "easy") {
      const sum = distModerate + distHard;
      const m = sum > 0 ? Math.round((distModerate / sum) * rem) : Math.round(rem / 2);
      setDistEasy(val); setDistModerate(m); setDistHard(rem - m);
    } else if (type === "moderate") {
      const sum = distEasy + distHard;
      const e = sum > 0 ? Math.round((distEasy / sum) * rem) : Math.round(rem / 2);
      setDistModerate(val); setDistEasy(e); setDistHard(rem - e);
    } else {
      const sum = distEasy + distModerate;
      const e = sum > 0 ? Math.round((distEasy / sum) * rem) : Math.round(rem / 2);
      setDistHard(val); setDistEasy(e); setDistModerate(rem - e);
    }
  };

  const processFile = async (file: File | null) => {
    if (!file) return;
    const newTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_ -]/g, "");
    setInputTitle(newTitle || "Mock_Test");
    
    if (questions.length > 0) {
      setQuestions([]);
      setRevealedQs({});
      setStudentAnswers({});
      setIsTestSubmitted(false);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInputText(text.substring(0, 60000));
      notify(`File loaded: ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => processFile(e.target.files?.[0] || null);
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); processFile((e.dataTransfer.files[0]) || null); };

  const generate = async () => {
    if (!inputText.trim() || isGenerating) return;
    setIsGenerating(true);
    notify(`Generating ${targetCount} questions...`);
    setActiveTab("preview");

    const easyN = Math.round((targetCount * distEasy) / 100);
    const modN = Math.round((targetCount * distModerate) / 100);
    const hardN = targetCount - easyN - modN;
    const safeText = inputText.substring(0, 40000);

    const schema = {
      type: "OBJECT",
      properties: {
        questions: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              q_en: { type: "STRING" }, q_hi: { type: "STRING" },
              options_en: { type: "ARRAY", items: { type: "STRING" } },
              options_hi: { type: "ARRAY", items: { type: "STRING" } },
              correct_index: { type: "INTEGER" },
              difficulty: { type: "STRING" },
              exp_en: { type: "STRING" }, exp_hi: { type: "STRING" },
            },
            required: ["q_en","q_hi","options_en","options_hi","correct_index","difficulty","exp_en","exp_hi"]
          }
        }
      }
    };

    const langInstruction = paperLanguage === "Hindi Only" ? "Hindi" : paperLanguage === "English Only" ? "English" : "bilingual English and Hindi";
    const prompt = `Generate EXACTLY ${targetCount} UNIQUE high-quality ${langInstruction} MCQs from the provided text.
Exam Standard: ${examType}
Difficulty: ${easyN} Easy, ${modN} Moderate, ${hardN} Hard.
Provide exactly 4 options per question. Keep options concise.
Give thorough explanations in both English and Hindi.
Source Text: ${safeText}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2-flash:generateContent?key=${geminiApiKey}`;
    
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.7 }
        })
      });
      
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const parsedData = JSON.parse(data.candidates[0].content.parts[0].text);
      
      if (parsedData?.questions?.length > 0) {
        const newQs = parsedData.questions.map((q: any, i: number) => ({ ...q, id: Date.now() + i }));
        setQuestions(prev => [...prev, ...newQs]);
        setStudentAnswers({});
        setIsTestSubmitted(false);
        notify(`✅ ${newQs.length} questions generated!`);
      } else {
        notify("❌ Generation failed.");
      }
    } catch (err) {
      notify("❌ Generation error. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteQuestion = (id: number) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    notify("Question deleted.");
  };

  const submitTest = () => {
    setIsTestSubmitted(true);
    notify("✅ Test Submitted!");
  };

  const retakeTest = () => {
    setStudentAnswers({});
    setIsTestSubmitted(false);
  };

  const getScoreData = () => {
    let c = 0, w = 0, u = 0;
    questions.forEach((q: any) => {
      const ans = studentAnswers[q.id];
      if (ans === undefined || ans === 4) u++;
      else if (ans === q.correct_index) c++;
      else w++;
    });
    const tQ = questions.length || 1;
    const mM = Number(maxMarks) || 200;
    const mpq = mM / tQ;
    const neg = mpq / 3;
    const s = (c * mpq) - (w * neg);
    return { correct: c, wrong: w, unattempted: u, score: isNaN(s) ? "0.00" : s.toFixed(2), total: mM };
  };

  const renderOption = (q: any, i: number, isHindi: boolean) => {
    const isSelected = studentAnswers[q.id] === i;
    const isCorrect = q.correct_index === i;
    const isRevealed = (!isPracticeMode || revealedQs[q.id] || isTestSubmitted);

    let bgClass = "", textClass = "text-slate-800", borderClass = "border-slate-300", showCheck = false;

    if (isTestSubmitted) {
      if (isCorrect) { bgClass = "bg-emerald-100"; borderClass = "border-emerald-500"; textClass = "text-emerald-900 font-bold"; showCheck = isSelected; }
      else if (isSelected && !isCorrect) { bgClass = "bg-rose-100"; borderClass = "border-rose-500"; textClass = "text-rose-900 line-through"; }
      else { bgClass = "opacity-50"; }
    } else {
      if (isSelected) { bgClass = "bg-indigo-100"; borderClass = "border-indigo-500"; textClass = "text-indigo-900 font-bold"; showCheck = true; }
      else if (isRevealed && isCorrect) { bgClass = "bg-emerald-50"; textClass = "text-emerald-800 font-bold"; }
      else { bgClass = "hover:bg-slate-50 cursor-pointer"; }
    }

    const optionText = isHindi ? (q.options_hi?.[i] || "") : (q.options_en?.[i] || "");

    return (
      <div key={`${q.id}-${isHindi ? 'hi' : 'en'}-${i}`}
        onClick={() => { if (!isTestSubmitted) setStudentAnswers(prev => ({...prev, [q.id]: i})) }}
        className={`flex items-center gap-2 p-2 rounded border ${bgClass} ${borderClass} ${textClass} transition-all text-sm`}>
        <span className="shrink-0 font-semibold">({i + 1})</span>
        <span className="flex-1">{optionText}</span>
        {showCheck && <Check className={`w-4 h-4 shrink-0 ${isTestSubmitted && isCorrect ? "text-emerald-600" : "text-indigo-600"}`} />}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      {!isFullscreen && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
            <div className="text-2xl font-black">ExamMind <span className="text-blue-600">AI</span></div>
            <nav className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
              {[["setup","Setup"],["preview","Preview"]].map(([id, label]) => (
                <button key={id} onClick={() => setActiveTab(id as any)}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === id ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </header>
      )}

      {/* Toast */}
      {statusMessage && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg shadow-xl z-50 animate-pulse">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-sm font-medium">{statusMessage}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {activeTab === "setup" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar Settings */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm sticky top-20">
                <h3 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-indigo-600" /> Settings
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-2 text-sm">Paper Language</label>
                    <select value={paperLanguage} onChange={e => setPaperLanguage(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option>Bilingual (English + Hindi)</option>
                      <option>Hindi Only</option>
                      <option>English Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-2 text-sm">Exam Type</label>
                    <select value={examType} onChange={e => setExamType(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      {EXAM_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-2 text-sm">Questions: {targetCount}</label>
                    <select value={targetCount} onChange={e => setTargetCount(parseInt(e.target.value))}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-slate-900 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      {[10,15,20,25,30].map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-200">
                    <h4 className="font-black text-slate-700 text-sm uppercase">Difficulty Distribution</h4>
                    <SliderRow label="Easy" value={distEasy} color="easy" onChange={v => adjustSliders("easy", v)} />
                    <SliderRow label="Moderate" value={distModerate} color="moderate" onChange={v => adjustSliders("moderate", v)} />
                    <SliderRow label="Hard" value={distHard} color="hard" onChange={v => adjustSliders("hard", v)} />
                  </div>

                  <button onClick={generate} disabled={!inputText.trim() || isGenerating}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                      inputText.trim() && !isGenerating
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:shadow-lg text-white"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {isGenerating ? "Generating..." : `Generate ${targetCount} MCQs`}
                  </button>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-2 space-y-6">
              {/* Upload Area */}
              <div onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
                className={`relative bg-white border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all ${
                  dragOver ? "border-indigo-500 bg-indigo-50 scale-105" : "border-slate-300 hover:border-indigo-400"}`}>
                <input type="file" accept=".pdf,.txt" onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="bg-indigo-100 w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-7 h-7 text-indigo-600" />
                </div>
                <p className="font-bold text-slate-900 text-lg mb-1">Upload PDF or Text</p>
                <p className="text-sm text-slate-500">Drag and drop or tap to select</p>
              </div>

              {/* Source Text */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Source Text
                  </span>
                </div>
                <textarea ref={sourceTextRef} value={inputText} onChange={e => setInputText(e.target.value)}
                  placeholder="Your text will appear here..."
                  className="w-full h-80 p-5 text-sm text-slate-700 resize-none focus:outline-none placeholder-slate-400 leading-relaxed" />
              </div>
            </main>
          </div>
        )}

        {activeTab === "preview" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden flex flex-col h-[calc(100vh-200px)]">
            {/* Toolbar */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-wrap gap-3">
              <button onClick={() => setIsFullscreen(!isFullscreen)}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2">
                {isFullscreen ? <X className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                {isFullscreen ? "Exit" : "Fullscreen"}
              </button>
              <label className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200">
                <span className="text-sm font-bold text-slate-700">Practice Mode</span>
                <input type="checkbox" checked={isPracticeMode} onChange={e => setIsPracticeMode(e.target.checked)} className="w-4 h-4 cursor-pointer" />
              </label>
            </div>

            {/* Paper Content */}
            <div className="flex-1 overflow-auto p-6 bg-slate-100">
              <div ref={pdfRef} className="bg-white shadow-lg mx-auto max-w-2xl rounded-lg p-6 sm:p-8">
                <div className="border-b-2 border-slate-800 pb-4 mb-6">
                  <h1 className="text-2xl font-bold text-center uppercase">{inputTitle.replace(/_/g, " ")}</h1>
                  <div className="flex justify-between mt-4 text-xs font-bold text-slate-600 gap-2 flex-wrap">
                    <span>Code: {paperCode}</span>
                    <span>Sub: {examSubject}</span>
                    <span>Max Marks: {maxMarks}</span>
                  </div>
                </div>

                {isTestSubmitted && (
                  <div className="mb-6 p-5 rounded-lg bg-indigo-50 border-2 border-indigo-200 text-center">
                    <h2 className="text-xl font-bold text-indigo-900 mb-4">Your Score</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white p-3 rounded border border-slate-200">
                        <div className="text-2xl font-black text-emerald-600">{getScoreData().correct}</div>
                        <div className="text-xs font-bold text-slate-600">Correct</div>
                      </div>
                      <div className="bg-white p-3 rounded border border-slate-200">
                        <div className="text-2xl font-black text-rose-600">{getScoreData().wrong}</div>
                        <div className="text-xs font-bold text-slate-600">Wrong</div>
                      </div>
                      <div className="bg-white p-3 rounded border border-slate-200">
                        <div className="text-2xl font-black text-slate-600">{getScoreData().unattempted}</div>
                        <div className="text-xs font-bold text-slate-600">Left</div>
                      </div>
                      <div className="bg-indigo-100 p-3 rounded border-2 border-indigo-500">
                        <div className="text-2xl font-black text-indigo-700">{getScoreData().score}</div>
                        <div className="text-xs font-bold text-indigo-600">Score</div>
                      </div>
                    </div>
                    <button onClick={retakeTest} className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all">
                      Retake Test
                    </button>
                  </div>
                )}

                {questions.map((q: any, idx: number) => (
                  <div key={q.id} className="mb-5 pb-5 border-b border-slate-200 last:border-b-0">
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <p className="font-semibold text-slate-900"><span className="font-bold">{idx + 1}.</span> {q.q_en}</p>
                      <button onClick={() => deleteQuestion(q.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 ml-6">
                      {[0,1,2,3].map(i => renderOption(q, i, false))}
                    </div>
                  </div>
                ))}

                {!isTestSubmitted && questions.length > 0 && (
                  <div className="text-center mt-8">
                    <button onClick={submitTest} className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-lg">
                      Submit Test
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
