'use client'

import { useState, useEffect, useRef } from "react";
import {
  Upload, CheckCircle, Sparkles, Copy, FileText,
  Loader2, ZoomIn, ZoomOut, RotateCcw,
  AlertCircle, Settings2, Download, Trash2, Target,
  CloudUpload, Library, Eye, EyeOff, Maximize, X, Printer,
  Clock, Play, Pause, Check, ChevronDown, RefreshCw, MessageSquare
} from "lucide-react";

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
    factual: "accent-blue-500", conceptual: "accent-purple-500", advanced: "accent-orange-500"
  };
  const textColors = { 
    easy: "text-emerald-600", moderate: "text-amber-600", hard: "text-rose-600",
    factual: "text-blue-600", conceptual: "text-purple-600", advanced: "text-orange-600"
  };
  return (
    <div>
      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
        <span>{label}</span>
        <span className={`font-bold tabular-nums ${textColors[color]}`}>{value}%</span>
      </div>
      <input type="range" min="0" max="100" value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className={`w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200 ${colors[color]}`} />
    </div>
  );
}

function PaperTimer({ isFullscreen }: { isFullscreen: boolean }) {
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => setTimerSeconds(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg border ${isFullscreen ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
      <Clock size={15} className={isTimerRunning ? "text-indigo-500 animate-pulse" : (isFullscreen ? "text-slate-400" : "text-slate-500")} />
      <span className="text-[11px] sm:text-xs font-bold font-mono min-w-[40px] text-center">{formatTime(timerSeconds)}</span>
      <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="transition-colors p-0.5">
        {isTimerRunning ? <Pause size={14} /> : <Play size={14} />}
      </button>
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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [revealedQs, setRevealedQs] = useState({});
  const [studentAnswers, setStudentAnswers] = useState({});
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  
  const sourceTextRef = useRef(null);
  const pdfRef = useRef(null);

  useEffect(() => {
    const w = window.innerWidth;
    if (w < 400) setZoomLevel(0.40);
    else if (w < 500) setZoomLevel(0.48);
    else if (w < 640) setZoomLevel(0.60);
    else if (w < 800) setZoomLevel(0.80);
    else setZoomLevel(1);
  }, []);

  const notify = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(""), 4500);
  };

  const adjustSliders = (type, val) => {
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

  const processFile = async (file) => {
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
    reader.onload = e => {
      setInputText(e.target.result);
      notify(`File loaded: ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleFileInput = e => processFile(e.target.files[0]);
  const handleDrop = e => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files[0]); };

  const generate = async () => {
    if (!inputText.trim() || isGenerating) return;
    setIsGenerating(true);
    notify(`Generating ${targetCount} questions...`);
    setActiveTab("preview");

    const easyN = Math.round((targetCount * distEasy) / 100);
    const modN = Math.round((targetCount * distModerate) / 100);
    const hardN = targetCount - easyN - modN;
    const safeText = inputText.substring(0, 60000);

    const schema = {
      type: "OBJECT",
      properties: {
        questions: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              q_en: { type: "STRING" },
              q_hi: { type: "STRING" },
              options_en: { type: "ARRAY", items: { type: "STRING" } },
              options_hi: { type: "ARRAY", items: { type: "STRING" } },
              correct_index: { type: "INTEGER" },
              difficulty: { type: "STRING" },
              exp_en: { type: "STRING" },
              exp_hi: { type: "STRING" },
              source_page: { type: "STRING" }
            },
            required: ["q_en","q_hi","options_en","options_hi","correct_index","difficulty","exp_en","exp_hi","source_page"]
          }
        }
      }
    };

    const langInstruction = paperLanguage === "Hindi Only" ? "HINDI only" : paperLanguage === "English Only" ? "ENGLISH only" : "bilingual (English & Hindi)";

    const prompt = `Generate EXACTLY ${targetCount} high-quality ${langInstruction} MCQs from this text.
Difficulty: ${easyN} Easy, ${modN} Moderate, ${hardN} Hard.
Provide 4 options and thorough explanations.
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
        const newQs = parsedData.questions.map((q, i) => ({ ...q, id: Date.now() + i }));
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

  const deleteQuestion = (id) => {
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
    questions.forEach(q => {
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

  const renderOption = (q, i, isHindi) => {
    const isSelected = studentAnswers[q.id] === i;
    const isCorrect = q.correct_index === i;
    const isRevealed = (!isPracticeMode || revealedQs[q.id] || isTestSubmitted);

    let bgClass = "transparent", textClass = "text-slate-800", borderClass = "border-transparent", showCheck = false;

    if (isTestSubmitted) {
      if (isCorrect) { bgClass = "bg-emerald-100 font-bold"; borderClass = "border-emerald-500"; textClass = "text-emerald-900"; showCheck = isSelected; }
      else if (isSelected && !isCorrect) { bgClass = "bg-rose-100"; borderClass = "border-rose-500"; textClass = "text-rose-900 line-through"; }
      else { borderClass = "border-transparent opacity-60"; }
    } else {
      if (isSelected) { bgClass = "bg-indigo-100 font-bold"; borderClass = "border-indigo-500"; textClass = "text-indigo-900"; showCheck = true; }
      else if (isRevealed && isCorrect) { bgClass = "bg-emerald-50 font-bold"; textClass = "text-emerald-800"; }
      else { bgClass = "hover:bg-slate-100 cursor-pointer"; borderClass = "border-slate-200"; }
    }

    const optionText = isHindi ? (q.options_hi && q.options_hi[i] ? q.options_hi[i] : "") : (q.options_en && q.options_en[i] ? q.options_en[i] : "");

    return (
      <div key={`${q.id}-${isHindi ? 'hi' : 'en'}-${i}`}
        onClick={() => { if (!isTestSubmitted) setStudentAnswers(prev => ({...prev, [q.id]: i})) }}
        className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-all ${bgClass} ${borderClass} ${textClass}`}>
        <span className="shrink-0">({i + 1})</span>
        <span className="flex-1">{optionText}</span>
        {showCheck && <Check className={`w-3.5 h-3.5 shrink-0 ${isTestSubmitted && isCorrect ? "text-emerald-600" : "text-indigo-600"}`} />}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {!isFullscreen && (
        <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
          <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="text-white font-bold text-lg">ExamMind <span className="text-blue-400">AI</span></div>
            <nav className="hidden md:flex items-center gap-2 bg-slate-800 p-1 rounded-lg">
              {[["setup","Setup"],["preview","Preview"]].map(([id, label]) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === id ? "bg-indigo-500 text-white" : "text-slate-300 hover:text-white"}`}>
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </header>
      )}

      {statusMessage && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-slate-900 border border-slate-700 text-white p-3 rounded-lg shadow-xl z-50">
          <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
          <p className="text-sm font-medium">{statusMessage}</p>
        </div>
      )}

      <div className="max-w-screen-xl mx-auto flex-1 w-full flex items-start px-4 py-6 gap-6">
        {(activeTab === "setup") && (
          <aside className="w-80 shrink-0 space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-indigo-500" /> Settings
              </h3>
              
              <div>
                <label className="block text-slate-600 font-bold mb-1 text-xs">Paper Language</label>
                <select value={paperLanguage} onChange={e => setPaperLanguage(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 font-semibold bg-slate-50 text-xs">
                  <option>Bilingual (English + Hindi)</option>
                  <option>Hindi Only</option>
                  <option>English Only</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1 text-xs">Exam Type</label>
                <select value={examType} onChange={e => setExamType(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 font-semibold bg-slate-50 text-xs">
                  {EXAM_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1 text-xs">Questions</label>
                <select value={targetCount} onChange={e => setTargetCount(parseInt(e.target.value))}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 font-semibold bg-slate-50 text-xs">
                  {[10,15,20,25,30].map(n => <option key={n}>{n}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-600 uppercase">Difficulty</h4>
                <SliderRow label="Easy" value={distEasy} color="easy" onChange={v => adjustSliders("easy", v)} />
                <SliderRow label="Moderate" value={distModerate} color="moderate" onChange={v => adjustSliders("moderate", v)} />
                <SliderRow label="Hard" value={distHard} color="hard" onChange={v => adjustSliders("hard", v)} />
              </div>

              <button onClick={generate} disabled={!inputText.trim() || isGenerating}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all ${
                  inputText.trim() && !isGenerating
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 text-white"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {isGenerating ? "Generating..." : `Generate ${targetCount} MCQs`}
              </button>
            </div>
          </aside>
        )}

        <main className="flex-1 min-w-0 w-full">
          {activeTab === "setup" && (
            <div className="space-y-5">
              <div onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
                className={`relative bg-white border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                  dragOver ? "border-indigo-500 bg-indigo-50" : "border-slate-300 hover:border-indigo-400"}`}>
                <input type="file" accept=".pdf,.txt" onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="bg-indigo-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-indigo-500" />
                </div>
                <p className="font-bold text-slate-800 text-lg mb-2">Upload PDF or Text</p>
                <p className="text-sm text-slate-500">Tap to upload your syllabus or notes</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                  <span className="text-sm font-bold text-slate-700">Source Text</span>
                </div>
                <textarea ref={sourceTextRef} value={inputText} onChange={e => setInputText(e.target.value)}
                  placeholder="Text will appear here..."
                  className="w-full h-64 p-4 text-sm text-slate-700 resize-none focus:outline-none" />
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="bg-slate-600 rounded-2xl overflow-hidden border border-slate-300 shadow-inner flex flex-col w-full" style={{ height: "calc(100vh - 160px)" }}>
              <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
                <button onClick={() => setIsFullscreen(!isFullscreen)}
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-indigo-600 text-white">
                  {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                </button>
                <div className="flex items-center gap-2">
                  <PaperTimer isFullscreen={isFullscreen} />
                  <label className="flex items-center gap-2">
                    <span className="text-xs font-bold">Practice</span>
                    <input type="checkbox" checked={isPracticeMode} onChange={e => setIsPracticeMode(e.target.checked)}
                      className="w-4 h-4" />
                  </label>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 flex justify-center" style={{ scrollbarWidth: "thin" }}>
                <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top center" }}>
                  <div ref={pdfRef} className="bg-white shadow-xl p-8" style={{ width: "794px", minHeight: "1123px" }}>
                    <div className="border-b-2 border-slate-800 pb-4 mb-6">
                      <h1 className="text-2xl font-bold text-center uppercase">{inputTitle}</h1>
                      <div className="flex justify-between mt-4 text-sm font-bold">
                        <span>Code: {paperCode}</span>
                        <span>Sub: {examSubject}</span>
                        <span>Marks: {maxMarks}</span>
                      </div>
                    </div>

                    {isTestSubmitted && (
                      <div className="mb-6 p-6 rounded-lg bg-indigo-50 border-2 border-indigo-200 text-center">
                        <h2 className="text-2xl font-bold text-indigo-900 mb-4">Score Card</h2>
                        <div className="flex justify-around">
                          <div><div className="text-3xl font-bold text-emerald-600">{getScoreData().correct}</div><div className="text-xs font-bold">Correct</div></div>
                          <div><div className="text-3xl font-bold text-rose-600">{getScoreData().wrong}</div><div className="text-xs font-bold">Wrong</div></div>
                          <div><div className="text-3xl font-bold text-slate-600">{getScoreData().unattempted}</div><div className="text-xs font-bold">Left</div></div>
                          <div><div className="text-3xl font-bold text-indigo-700">{getScoreData().score}</div><div className="text-xs font-bold">Score</div></div>
                        </div>
                        <button onClick={retakeTest} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-full font-bold">
                          Retake
                        </button>
                      </div>
                    )}

                    {questions.map((q, idx) => (
                      <div key={q.id} className="mb-6 pb-6 border-b border-slate-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-bold mb-3">{idx + 1}. {q.q_en}</p>
                            <div className="space-y-1.5">
                              {[0,1,2,3].map(i => renderOption(q, i, false))}
                            </div>
                          </div>
                          <button onClick={() => deleteQuestion(q.id)} className="ml-4 p-1 text-rose-600 hover:bg-rose-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {!isTestSubmitted && questions.length > 0 && (
                      <div className="text-center mt-10">
                        <button onClick={submitTest} className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold">
                          Submit Test
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
