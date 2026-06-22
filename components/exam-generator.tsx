'use client'

import { useState, useRef } from "react"
import { Upload, Sparkles, Loader2, FileText, AlertCircle, Settings2, Download, Trash2, Eye, EyeOff, Maximize, X, Play, Pause, Check, ChevronDown, RotateCcw, Clock } from "lucide-react"

const EXAM_TYPES = ["UPSC", "SSC CGL", "State PCS (RPSC)", "Banking PO", "Railway RRB", "CTET", "NEET", "JEE"]

function SliderRow({ label, value, color, onChange }: { label: string; value: number; color: string; onChange: (v: number) => void }) {
  const colors: { [key: string]: string } = { 
    easy: "accent-emerald-500", moderate: "accent-amber-500", hard: "accent-rose-500",
  }
  const textColors: { [key: string]: string } = { 
    easy: "text-emerald-600", moderate: "text-amber-600", hard: "text-rose-600",
  }
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className={`text-sm font-bold ${textColors[color]}`}>{value}%</span>
      </div>
      <input type="range" min="0" max="100" value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className={`w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 ${colors[color]}`} />
    </div>
  )
}

export function ExamGenerator({ geminiApiKey }: { geminiApiKey: string }) {
  const [inputText, setInputText] = useState("")
  const [inputTitle, setInputTitle] = useState("Mock_Test_Paper")
  const [activeTab, setActiveTab] = useState("setup")
  const [statusMessage, setStatusMessage] = useState("")
  const [dragOver, setDragOver] = useState(false)
  
  const [paperLanguage, setPaperLanguage] = useState("Bilingual")
  const [distEasy, setDistEasy] = useState(30)
  const [distModerate, setDistModerate] = useState(40)
  const [distHard, setDistHard] = useState(30)
  const [examType, setExamType] = useState("State PCS (RPSC)")
  const [targetCount, setTargetCount] = useState(15)
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [questions, setQuestions] = useState<any[]>([])
  const [isPracticeMode, setIsPracticeMode] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [revealedQs, setRevealedQs] = useState<{ [key: number]: boolean }>({})
  const [studentAnswers, setStudentAnswers] = useState<{ [key: number]: number }>({})
  const [isTestSubmitted, setIsTestSubmitted] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  
  const textRef = useRef<HTMLTextAreaElement>(null)
  const paperRef = useRef<HTMLDivElement>(null)

  const notify = (msg: string) => {
    setStatusMessage(msg)
    setTimeout(() => setStatusMessage(""), 4000)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setInputText(text.substring(0, 50000))
      setInputTitle(file.name.replace(/\.[^/.]+$/, ""))
      notify(`✅ File loaded: ${file.name}`)
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        setInputText(text.substring(0, 50000))
        setInputTitle(file.name.replace(/\.[^/.]+$/, ""))
        notify(`✅ File loaded: ${file.name}`)
      }
      reader.readAsText(file)
    }
  }

  const adjustSliders = (type: string, val: number) => {
    const rem = 100 - val
    if (type === "easy") {
      const sum = distModerate + distHard
      const m = sum > 0 ? Math.round((distModerate / sum) * rem) : Math.round(rem / 2)
      setDistEasy(val)
      setDistModerate(m)
      setDistHard(rem - m)
    } else if (type === "moderate") {
      const sum = distEasy + distHard
      const e = sum > 0 ? Math.round((distEasy / sum) * rem) : Math.round(rem / 2)
      setDistModerate(val)
      setDistEasy(e)
      setDistHard(rem - e)
    } else {
      const sum = distEasy + distModerate
      const e = sum > 0 ? Math.round((distEasy / sum) * rem) : Math.round(rem / 2)
      setDistHard(val)
      setDistEasy(e)
      setDistModerate(rem - e)
    }
  }

  const generate = async () => {
    if (!inputText.trim() || !geminiApiKey) {
      notify(geminiApiKey ? "❌ Please upload text first" : "❌ API Key not configured")
      return
    }

    setIsGenerating(true)
    notify("🔄 Generating questions...")
    setActiveTab("preview")

    const easyN = Math.round((targetCount * distEasy) / 100)
    const modN = Math.round((targetCount * distModerate) / 100)
    const hardN = targetCount - easyN - modN

    let langInstruction = "bilingual (English & Hindi)"
    if (paperLanguage === "Hindi Only") {
      langInstruction = "strictly in HINDI language only"
    } else if (paperLanguage === "English Only") {
      langInstruction = "strictly in ENGLISH language only"
    }

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
              exp_hi: { type: "STRING" }
            },
            required: ["q_en", "q_hi", "options_en", "options_hi", "correct_index", "difficulty", "exp_en", "exp_hi"]
          }
        }
      }
    }

    const prompt = `Generate EXACTLY ${targetCount} UNIQUE, high-quality ${langInstruction} MCQs from the provided text.
Exam Standard: ${examType}
Difficulty: ${easyN} Easy, ${modN} Moderate, ${hardN} Hard.
Provide exactly 4 options per question. Keep options concise.
Give thorough explanations.

Source Text:
${inputText.substring(0, 40000)}`

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2-flash:generateContent?key=${geminiApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.7
          }
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      const parsed = JSON.parse(data.candidates[0].content.parts[0].text)

      if (parsed?.questions?.length > 0) {
        const newQs = parsed.questions.map((q: any, i: number) => ({ ...q, id: Date.now() + i }))
        setQuestions(newQs)
        setStudentAnswers({})
        setIsTestSubmitted(false)
        notify(`✅ Generated ${newQs.length} questions!`)
      } else {
        notify("❌ Failed to generate questions")
      }
    } catch (err) {
      console.error(err)
      notify(`❌ Error: ${err instanceof Error ? err.message : "Generation failed"}`)
    }

    setIsGenerating(false)
  }

  const deleteQuestion = (id: number) => {
    setQuestions(prev => prev.filter(q => q.id !== id))
    notify("❌ Question deleted")
  }

  const submitTest = () => {
    setIsTestSubmitted(true)
    notify("✅ Test Submitted!")
  }

  const retakeTest = () => {
    setStudentAnswers({})
    setIsTestSubmitted(false)
  }

  const getScoreData = () => {
    let correct = 0, wrong = 0, unattempted = 0
    questions.forEach((q: any) => {
      const ans = studentAnswers[q.id]
      if (ans === undefined) unattempted++
      else if (ans === q.correct_index) correct++
      else wrong++
    })
    return { correct, wrong, unattempted, total: questions.length }
  }

  const renderOption = (q: any, i: number, isHindi: boolean) => {
    const isSelected = studentAnswers[q.id] === i
    const isCorrect = q.correct_index === i
    const isRevealed = (!isPracticeMode || revealedQs[q.id] || isTestSubmitted)

    let bgClass = "transparent", borderClass = "border-slate-200", textClass = "text-slate-800"
    let showCheck = false

    if (isTestSubmitted) {
      if (isCorrect) {
        bgClass = "bg-emerald-100"
        borderClass = "border-emerald-500"
        textClass = "text-emerald-900 font-bold"
        showCheck = isSelected
      } else if (isSelected && !isCorrect) {
        bgClass = "bg-red-100"
        borderClass = "border-red-500"
        textClass = "text-red-900 line-through"
      }
    } else {
      if (isSelected) {
        bgClass = "bg-indigo-100"
        borderClass = "border-indigo-500"
        textClass = "text-indigo-900 font-bold"
        showCheck = true
      } else if (isRevealed && isCorrect) {
        bgClass = "bg-emerald-50"
        textClass = "text-emerald-800 font-bold"
      } else {
        bgClass = "hover:bg-slate-50 cursor-pointer"
      }
    }

    const optText = isHindi ? (q.options_hi?.[i] || "") : (q.options_en?.[i] || "")

    return (
      <div
        key={`${q.id}-${i}-${isHindi ? 'h' : 'e'}`}
        onClick={() => !isTestSubmitted && setStudentAnswers(prev => ({ ...prev, [q.id]: i }))}
        className={`flex items-center gap-2 px-3 py-2 rounded border transition-all ${bgClass} ${borderClass} ${textClass}`}
      >
        <span className="font-bold">({i + 1})</span>
        <span className="flex-1">{optText}</span>
        {showCheck && <Check className="w-4 h-4 shrink-0" />}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      {!isFullscreen && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-black text-slate-900">ExamMind AI</h1>
            </div>
            <nav className="hidden md:flex gap-2">
              {[["setup", "Setup"], ["preview", "Preview"]].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`px-4 py-2 rounded-lg font-bold transition-all ${
                    activeTab === id
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </header>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">{statusMessage}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "setup" && !isFullscreen && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sticky top-24 space-y-6">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-indigo-600" />
                  Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Paper Language</label>
                    <select
                      value={paperLanguage}
                      onChange={(e) => setPaperLanguage(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    >
                      <option>Bilingual (English + Hindi)</option>
                      <option>Hindi Only</option>
                      <option>English Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Exam Type</label>
                    <select
                      value={examType}
                      onChange={(e) => setExamType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    >
                      {EXAM_TYPES.map(e => <option key={e}>{e}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Number of Questions</label>
                    <select
                      value={targetCount}
                      onChange={(e) => setTargetCount(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    >
                      {[10, 15, 20, 25, 30].map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>

                  <div className="pt-2 space-y-4">
                    <h3 className="text-xs font-black text-slate-600 uppercase">Difficulty</h3>
                    <SliderRow label="Easy" value={distEasy} color="easy" onChange={v => adjustSliders("easy", v)} />
                    <SliderRow label="Moderate" value={distModerate} color="moderate" onChange={v => adjustSliders("moderate", v)} />
                    <SliderRow label="Hard" value={distHard} color="hard" onChange={v => adjustSliders("hard", v)} />
                  </div>
                </div>

                <button
                  onClick={generate}
                  disabled={!inputText.trim() || isGenerating}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate {targetCount} MCQs
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Upload */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  dragOver ? "border-indigo-500 bg-indigo-50" : "border-slate-300 hover:border-indigo-400"
                }`}
              >
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept=".txt,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Upload Syllabus</p>
                      <p className="text-sm text-slate-500 mt-1">PDF or Text file (Max 50MB)</p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Text Area */}
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <span className="font-bold text-slate-700">Source Text</span>
                </div>
                <textarea
                  ref={textRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Your text will appear here..."
                  className="w-full h-80 p-6 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === "preview" && (
          <div className={`${isFullscreen ? "fixed inset-0 z-50 bg-slate-600 p-4" : "bg-white rounded-xl shadow-lg border border-slate-200"}`}
            style={isFullscreen ? {} : { minHeight: "70vh" }}>

            {/* Toolbar */}
            <div className={`flex flex-wrap gap-3 items-center justify-between p-4 border-b ${isFullscreen ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-slate-200"}`}>
              <div className="flex gap-2">
                <button onClick={() => setZoomLevel(z => Math.max(z - 0.1, 0.5))} className="p-2 hover:bg-slate-200 rounded">−</button>
                <span className="w-12 text-center font-bold text-sm">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={() => setZoomLevel(z => Math.min(z + 0.1, 2))} className="p-2 hover:bg-slate-200 rounded">+</button>
              </div>
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold">
                {isFullscreen ? "Exit" : "Fullscreen"}
              </button>
            </div>

            {/* Paper */}
            <div className={`flex justify-center overflow-auto ${isFullscreen ? "py-8" : "p-6"}`}>
              <div
                ref={paperRef}
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top center" }}
                className="bg-white shadow-xl p-8 max-w-4xl w-full"
              >
                <h1 className="text-2xl font-black text-center mb-4">{inputTitle.replace(/_/g, " ")}</h1>

                {isTestSubmitted && (
                  <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6 mb-6 text-center">
                    <h2 className="text-xl font-black text-indigo-900 mb-4">Your Score</h2>
                    <div className="grid grid-cols-4 gap-4">
                      <div><div className="text-3xl font-black text-emerald-600">{getScoreData().correct}</div><div className="text-xs font-bold">Correct</div></div>
                      <div><div className="text-3xl font-black text-red-600">{getScoreData().wrong}</div><div className="text-xs font-bold">Wrong</div></div>
                      <div><div className="text-3xl font-black text-slate-600">{getScoreData().unattempted}</div><div className="text-xs font-bold">Skipped</div></div>
                      <div><div className="text-3xl font-black text-indigo-600">{((getScoreData().correct / (questions.length || 1)) * 100).toFixed(0)}%</div><div className="text-xs font-bold">Score</div></div>
                    </div>
                    <button onClick={retakeTest} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">Retake</button>
                  </div>
                )}

                <div className="space-y-6">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="pb-6 border-b border-slate-200">
                      <div className="flex justify-between items-start mb-3">
                        <p className="font-bold text-lg">{idx + 1}. {paperLanguage !== "English Only" ? q.q_hi : q.q_en}</p>
                        <button onClick={() => deleteQuestion(q.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>

                      <div className="space-y-2 ml-4">
                        {[0, 1, 2, 3].map(i => renderOption(q, i, paperLanguage !== "English Only"))}
                      </div>

                      {isPracticeMode && !isTestSubmitted && (
                        <button
                          onClick={() => setRevealedQs(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                          className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
                        >
                          {revealedQs[q.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {revealedQs[q.id] ? "Hide" : "Show"} Answer
                        </button>
                      )}

                      {((!isPracticeMode || revealedQs[q.id] || isTestSubmitted) && !isTestSubmitted) && (
                        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded text-sm text-emerald-900">
                          <span className="font-bold">Answer: ({q.correct_index + 1})</span> {q.exp_en}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!isTestSubmitted && questions.length > 0 && (
                  <div className="text-center mt-8">
                    <button onClick={submitTest} className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">
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
  )
}
