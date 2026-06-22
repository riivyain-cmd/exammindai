'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Upload,
  CheckCircle,
  Sparkles,
  Copy,
  FileText,
  Loader2,
  AlertCircle,
  Settings2,
  Download,
  Trash2,
  Target,
  Eye,
  EyeOff,
  Maximize,
  X,
  Printer,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Check,
  RefreshCw,
  CloudUpload,
  Library,
  Search,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  MessageSquare,
  BrainCircuit,
} from 'lucide-react'
import { savePaper, deletePaper, submitTestAttempt } from '@/app/actions/papers'
import { Header } from './header'

interface ExamGeneratorProps {
  geminiApiKey: string
}

const EXAM_TYPES = ['UPSC', 'SSC CGL', 'State PCS (RPSC)', 'Banking PO', 'Railway RRB', 'CTET', 'NEET', 'JEE']
const PERSPECTIVES = [
  'Analytical',
  'Factual',
  'Conceptual',
  'PYQ Pattern',
  'Assertion-Reason',
  'Statement Based (1, 2, Both)',
  'Match the Following',
  'Applied / Clinical',
  'Custom Mix (Percentage)',
]

interface Question {
  id: string
  q_en: string
  q_hi: string
  options_en: string[]
  options_hi: string[]
  correct_index: number
  difficulty: string
  exp_en: string
  exp_hi: string
  source_page: string
}

function Badge({ level }: { level: string }) {
  const map: Record<string, string> = {
    Easy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Moderate: 'bg-amber-100 text-amber-700 border-amber-200',
    Hard: 'bg-rose-100 text-rose-700 border-rose-200',
  }
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${
        map[level] || map.Easy
      }`}
      data-html2canvas-ignore="true"
    >
      {level}
    </span>
  )
}

function SliderRow({
  label,
  value,
  color,
  onChange,
}: {
  label: string
  value: number
  color: string
  onChange: (v: number) => void
}) {
  const colors: Record<string, string> = {
    easy: 'accent-emerald-500',
    moderate: 'accent-amber-500',
    hard: 'accent-rose-500',
    factual: 'accent-blue-500',
    conceptual: 'accent-purple-500',
    advanced: 'accent-orange-500',
  }
  const textColors: Record<string, string> = {
    easy: 'text-emerald-600',
    moderate: 'text-amber-600',
    hard: 'text-rose-600',
    factual: 'text-blue-600',
    conceptual: 'text-purple-600',
    advanced: 'text-orange-600',
  }
  return (
    <div>
      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
        <span>{label}</span>
        <span className={`font-bold tabular-nums ${textColors[color]}`}>{value}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={`w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200 ${colors[color]}`}
      />
    </div>
  )
}

function PaperTimer() {
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const resetTimer = () => {
    setIsTimerRunning(false)
    setTimerSeconds(0)
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-slate-100 border-slate-200 text-slate-700">
      <Clock size={15} className={isTimerRunning ? 'text-indigo-500 animate-pulse' : 'text-slate-500'} />
      <span className="text-xs font-bold font-mono min-w-[40px] text-center tracking-wider">{formatTime(timerSeconds)}</span>
      <div className="w-px h-4 mx-1 bg-slate-300"></div>
      <button
        onClick={() => setIsTimerRunning(!isTimerRunning)}
        className={`transition-colors p-0.5 ${
          isTimerRunning ? 'text-amber-500 hover:text-amber-600' : 'text-emerald-500 hover:text-emerald-600'
        }`}
        title={isTimerRunning ? 'Pause Timer' : 'Start Timer'}
      >
        {isTimerRunning ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <button
        onClick={resetTimer}
        className="transition-colors p-0.5 text-slate-400 hover:text-rose-500"
        title="Reset Timer"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  )
}

export function ExamGenerator({ geminiApiKey }: ExamGeneratorProps) {
  const [inputText, setInputText] = useState('')
  const [inputTitle, setInputTitle] = useState('Mock_Test_Paper')
  const [activeTab, setActiveTab] = useState<'setup' | 'preview' | 'library'>('setup')

  const [paperLanguage, setPaperLanguage] = useState('Bilingual')
  const [distEasy, setDistEasy] = useState(30)
  const [distModerate, setDistModerate] = useState(40)
  const [distHard, setDistHard] = useState(30)
  const [examType, setExamType] = useState('State PCS (RPSC)')
  const [perspectiveMode, setPerspectiveMode] = useState('Custom Mix (Percentage)')
  const [targetCount, setTargetCount] = useState(15)
  const [topicFocus, setTopicFocus] = useState('')

  const [distFactual, setDistFactual] = useState(40)
  const [distConceptual, setDistConceptual] = useState(40)
  const [distAdvanced, setDistAdvanced] = useState(20)

  const [examSubject, setExamSubject] = useState('G.K. and G.S.')
  const [maxMarks, setMaxMarks] = useState('200')
  const [paperCode, setPaperCode] = useState('50')

  const [isGenerating, setIsGenerating] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [zoomLevel, setZoomLevel] = useState(1)
  const [dragOver, setDragOver] = useState(false)
  const [isPracticeMode, setIsPracticeMode] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [revealedQs, setRevealedQs] = useState<Record<string, boolean>>({})

  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [studentAnswers, setStudentAnswers] = useState<Record<string, number>>({})
  const [isTestSubmitted, setIsTestSubmitted] = useState(false)

  const [statusMessage, setStatusMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savedCode, setSavedCode] = useState<string | null>(null)

  const pdfRef = useRef<HTMLDivElement>(null)

  const notify = (msg: string) => {
    setStatusMessage(msg)
    setTimeout(() => setStatusMessage(''), 4500)
  }

  const adjustSliders = (type: string, val: number) => {
    const rem = 100 - val
    if (type === 'easy') {
      const sum = distModerate + distHard
      const m = sum > 0 ? Math.round((distModerate / sum) * rem) : Math.round(rem / 2)
      setDistEasy(val)
      setDistModerate(m)
      setDistHard(rem - m)
    } else if (type === 'moderate') {
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

  const adjustStyleSliders = (type: string, val: number) => {
    const rem = 100 - val
    if (type === 'factual') {
      const sum = distConceptual + distAdvanced
      const c = sum > 0 ? Math.round((distConceptual / sum) * rem) : Math.round(rem / 2)
      setDistFactual(val)
      setDistConceptual(c)
      setDistAdvanced(rem - c)
    } else if (type === 'conceptual') {
      const sum = distFactual + distAdvanced
      const f = sum > 0 ? Math.round((distFactual / sum) * rem) : Math.round(rem / 2)
      setDistConceptual(val)
      setDistFactual(f)
      setDistAdvanced(rem - f)
    } else {
      const sum = distFactual + distConceptual
      const f = sum > 0 ? Math.round((distFactual / sum) * rem) : Math.round(rem / 2)
      setDistAdvanced(val)
      setDistFactual(f)
      setDistConceptual(rem - f)
    }
  }

  const processFile = async (file: File | null) => {
    if (!file) return
    const newTitle = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_ -]/g, '')
    setInputTitle(newTitle || 'Mock_Test')

    if (questions.length > 0) {
      setQuestions([])
      setSavedCode(null)
      setRevealedQs({})
      setStudentAnswers({})
      setIsTestSubmitted(false)
    }

    if (file.type === 'application/pdf') {
      notify('PDF read ho rahi hai…')
      const reader = new FileReader()
      reader.onload = async function (this: FileReader) {
        try {
          // Simple PDF text extraction (would need PDF.js for full support)
          const text = await file.text?.() || ''
          setInputText(text)
          notify(`Done! PDF content extracted.`)
        } catch {
          notify('❌ PDF read nahi ho saki. Doosri file try karein.')
        }
      }
      reader.readAsText(file)
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        setInputText(e.target?.result as string)
        notify(`File load ho gayi: ${file.name}`)
      }
      reader.readAsText(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => processFile(e.target.files?.[0] || null)
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    processFile(e.dataTransfer.files?.[0] || null)
  }

  const generate = async () => {
    if (!inputText.trim() || isGenerating) return
    setIsGenerating(true)
    notify(`${targetCount} questions generate ho rahe hain...`)
    setActiveTab('preview')

    const easyN = Math.round((targetCount * distEasy) / 100)
    const modN = Math.round((targetCount * distModerate) / 100)
    const hardN = targetCount - easyN - modN

    let stylePrompt = `Question Style/Pattern: ${perspectiveMode}`
    if (perspectiveMode === 'Custom Mix (Percentage)') {
      const facN = Math.round((targetCount * distFactual) / 100)
      const conN = Math.round((targetCount * distConceptual) / 100)
      const advN = targetCount - facN - conN
      stylePrompt = `Question Style Distribution: Generate exactly ${facN} Factual/Direct questions, ${conN} Conceptual/Analytical questions, and ${advN} Advanced (Statement-based / Assertion-Reason) questions.`
    }

    let langInstruction = 'bilingual (English & Hindi)'
    if (paperLanguage === 'Hindi Only') {
      langInstruction = 'strictly in HINDI language only.'
    } else if (paperLanguage === 'English Only') {
      langInstruction = 'strictly in ENGLISH language only.'
    }

    const schema = {
      type: 'OBJECT',
      properties: {
        questions: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              q_en: { type: 'STRING' },
              q_hi: { type: 'STRING' },
              options_en: { type: 'ARRAY', items: { type: 'STRING' } },
              options_hi: { type: 'ARRAY', items: { type: 'STRING' } },
              correct_index: { type: 'INTEGER' },
              difficulty: { type: 'STRING' },
              exp_en: { type: 'STRING' },
              exp_hi: { type: 'STRING' },
              source_page: { type: 'STRING' },
            },
            required: ['q_en', 'q_hi', 'options_en', 'options_hi', 'correct_index', 'difficulty', 'exp_en', 'exp_hi', 'source_page'],
          },
        },
      },
    }

    const prompt = `Generate EXACTLY ${targetCount} UNIQUE, high-quality ${langInstruction} MCQs from the provided text.
Exam Standard: ${examType}
${stylePrompt}
${topicFocus.trim() ? `FOCUS AREA: "${topicFocus}"` : ''}
Difficulty: ${easyN} Easy, ${modN} Moderate, ${hardN} Hard.
Provide exactly 4 options. Keep the options concise like a real exam.
Give thorough explanations.
Source Text: ${inputText.substring(0, 60000)}`

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`

    const delays = [1000, 2000, 4000, 8000, 16000]
    let success = false
    let parsedData: { questions?: Question[] } | null = null

    for (let i = 0; i <= delays.length; i++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: {
              parts: [{ text: 'You are an expert exam paper setter. Provide highly accurate answer keys.' }],
            },
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: schema,
              temperature: 0.7,
            },
          }),
        })
        if (!res.ok) throw new Error('API error ' + res.status)
        const data = await res.json()
        parsedData = JSON.parse(data.candidates[0].content.parts[0].text)
        success = true
        break
      } catch (err) {
        if (i < delays.length) await new Promise((r) => setTimeout(r, delays[i]))
      }
    }

    if (success && parsedData?.questions?.length) {
      const newQs = parsedData.questions.map((q, i) => ({
        ...q,
        id: `q_${Date.now()}_${i}`,
      }))
      setQuestions((prev) => [...prev, ...newQs])
      setStudentAnswers({})
      setIsTestSubmitted(false)
      notify(`✅ ${newQs.length} naye questions jode gaye.`)
    } else {
      notify('❌ Generation fail. Thodi der baad try karein.')
    }

    setIsGenerating(false)
  }

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
    notify('Question hata diya.')
  }

  const handleManualSave = async () => {
    if (!questions.length) {
      notify('❌ Koi question nahi hai.')
      return
    }

    const code = savedCode || 'BDR-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    setIsSaving(true)

    try {
      const result = await savePaper({
        code,
        title: inputTitle,
        examType,
        perspectiveMode,
        paperLanguage,
        examSubject,
        maxMarks,
        paperCode,
        questions,
      })

      if (!savedCode) {
        setSavedCode(result.code)
        notify(`✅ Paper code (${result.code}) ke sath save ho gaya!`)
      } else {
        notify(`✅ Paper updated!`)
      }
    } catch (e) {
      notify('❌ Cloud Save Failed.')
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  const submitTest = () => {
    setIsTestSubmitted(true)
    if (pdfRef.current) {
      pdfRef.current.parentElement?.parentElement?.scrollTo({ top: 0, behavior: 'smooth' })
    }
    notify('✅ Test Submitted Successfully!')
  }

  const retakeTest = () => {
    setStudentAnswers({})
    setIsTestSubmitted(false)
  }

  const getScoreData = () => {
    let c = 0,
      w = 0,
      u = 0
    questions.forEach((q) => {
      const ans = studentAnswers[q.id]
      if (ans === undefined || ans === 4) u++
      else if (ans === q.correct_index) c++
      else w++
    })

    const tQ = questions.length || 1
    const mM = Number(maxMarks) || 200
    const mpq = mM / tQ
    const neg = mpq / 3
    const s = c * mpq - w * neg

    return {
      correct: c,
      wrong: w,
      unattempted: u,
      score: isNaN(s) ? '0.00' : s.toFixed(2),
      total: mM,
    }
  }

  const renderOption = (q: Question, i: number, isHindi: boolean) => {
    const isSelected = studentAnswers[q.id] === i
    const isCorrect = q.correct_index === i
    const isRevealed = !isPracticeMode || revealedQs[q.id] || isTestSubmitted

    let bgClass = 'transparent',
      textClass = 'text-slate-800',
      borderClass = 'border-transparent',
      showCheck = false

    if (isTestSubmitted) {
      if (isCorrect) {
        bgClass = 'bg-emerald-100 font-bold shadow-sm'
        borderClass = 'border-emerald-500'
        textClass = 'text-emerald-900'
        showCheck = isSelected
      } else if (isSelected && !isCorrect) {
        bgClass = 'bg-rose-100'
        borderClass = 'border-rose-500'
        textClass = 'text-rose-900 line-through'
      } else {
        borderClass = 'border-transparent opacity-60'
      }
    } else {
      if (isSelected) {
        bgClass = 'bg-indigo-100 font-bold shadow-sm ring-1 ring-indigo-500'
        borderClass = 'border-indigo-500'
        textClass = 'text-indigo-900'
        showCheck = true
      } else if (isRevealed && isCorrect) {
        bgClass = 'bg-emerald-50 font-bold'
        textClass = 'text-emerald-800'
      } else {
        bgClass = 'hover:bg-slate-100 cursor-pointer'
        borderClass = 'border-slate-200'
      }
    }

    const optionText = isHindi
      ? q.options_hi?.[i] || ''
      : q.options_en?.[i] || ''

    return (
      <div
        key={`${q.id}-${isHindi ? 'hi' : 'en'}-${i}`}
        onClick={() => {
          if (!isTestSubmitted) setStudentAnswers((prev) => ({ ...prev, [q.id]: i }))
        }}
        className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-all ${bgClass} ${borderClass} ${textClass}`}
      >
        <span className="shrink-0 font-sans">({i + 1})</span>
        <span className="flex-1">{optionText}</span>
        {showCheck && !isTestSubmitted && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
        {showCheck && isTestSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
      </div>
    )
  }

  const renderOption5 = (q: Question, isHindi: boolean) => {
    const isSelected = studentAnswers[q.id] === 4
    let bgClass = 'transparent',
      borderClass = 'border-transparent',
      textClass = 'text-slate-800',
      showCheck = false

    if (isTestSubmitted) {
      if (isSelected) {
        bgClass = 'bg-slate-200'
        borderClass = 'border-slate-400'
        textClass = 'text-slate-600'
      } else {
        borderClass = 'border-transparent opacity-60'
      }
    } else {
      if (isSelected) {
        bgClass = 'bg-indigo-100 font-bold shadow-sm ring-1 ring-indigo-500'
        borderClass = 'border-indigo-500'
        textClass = 'text-indigo-900'
        showCheck = true
      } else {
        bgClass = 'hover:bg-slate-100 cursor-pointer'
        borderClass = 'border-slate-200'
      }
    }

    return (
      <div
        key={`${q.id}-opt5-${isHindi ? 'hi' : 'en'}`}
        onClick={() => {
          if (!isTestSubmitted) setStudentAnswers((prev) => ({ ...prev, [q.id]: 4 }))
        }}
        className={`mt-2 text-[12.5px] px-2 py-1 flex items-center gap-1.5 rounded border transition-all ${bgClass} ${borderClass} ${textClass}`}
      >
        <span className="shrink-0 font-sans">(5)</span>
        <span className="flex-1">{isHindi ? 'अनुत्तरित प्रश्न' : 'Question not attempted'}</span>
        {showCheck && !isTestSubmitted && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
      </div>
    )
  }

  // Auto-Zoom for Mobile
  useEffect(() => {
    const w = window.innerWidth
    if (w < 400) setZoomLevel(0.4)
    else if (w < 500) setZoomLevel(0.48)
    else if (w < 640) setZoomLevel(0.6)
    else if (w < 800) setZoomLevel(0.8)
    else setZoomLevel(1)
  }, [])

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />
      {/* Status Message */}
      {statusMessage && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-slate-900 border border-slate-700 text-white p-3 rounded-lg shadow-xl animate-bounce z-50">
          <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
          <p className="text-sm font-medium pr-2">{statusMessage}</p>
        </div>
      )}

      {/* Header */}
      {!isFullscreen && (
        <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
          <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-white text-lg tracking-tight truncate">
                  ExamMind <span className="text-blue-400">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">Mock Test Generator</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-2 bg-slate-800 p-1 rounded-lg">
              {[
                ['setup', 'Setup'],
                ['preview', 'Preview'],
                ['library', 'Library'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as 'setup' | 'preview' | 'library')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                    activeTab === id
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {label}
                  {id === 'preview' && questions.length > 0 && (
                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === id ? 'bg-white/20' : 'bg-slate-600'}`}>
                      {questions.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as 'setup' | 'preview' | 'library')}
              className="md:hidden bg-slate-800 text-white text-xs font-bold p-1.5 rounded border border-slate-700"
            >
              <option value="setup">Setup</option>
              <option value="preview">Preview</option>
              <option value="library">Library</option>
            </select>
          </div>
        </header>
      )}

      {/* Content */}
      <div className={`max-w-screen-xl mx-auto flex-1 w-full flex flex-col md:flex-row items-start ${isFullscreen ? 'px-0 py-0 max-w-full' : 'px-3 sm:px-4 py-4 gap-4 sm:gap-6'}`}>
        {/* Sidebar */}
        {(activeTab === 'setup' || activeTab === 'preview') && !isFullscreen && (
          <aside className="w-full md:w-80 shrink-0 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-indigo-500" /> Settings
              </h3>

              <div className="space-y-3.5">
                {/* Language Option */}
                <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                  <label className="block text-indigo-900 font-bold mb-1.5 text-xs">Paper Language</label>
                  <select
                    value={paperLanguage}
                    onChange={(e) => setPaperLanguage(e.target.value)}
                    className="w-full p-2.5 border border-indigo-200 rounded-lg text-indigo-900 font-bold bg-white text-xs"
                  >
                    <option value="Bilingual">Bilingual</option>
                    <option value="Hindi Only">Hindi Only</option>
                    <option value="English Only">English Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1 text-xs">Exam Type</label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 font-semibold bg-slate-50 text-xs"
                  >
                    {EXAM_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1 text-xs">Question Style</label>
                  <select
                    value={perspectiveMode}
                    onChange={(e) => setPerspectiveMode(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 font-semibold bg-slate-50 text-xs"
                  >
                    {PERSPECTIVES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5 shadow-inner">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase mb-1">Paper MetaData</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1 text-[9px] uppercase">Paper Code</label>
                      <input
                        type="text"
                        value={paperCode}
                        onChange={(e) => setPaperCode(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 font-semibold bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1 text-[9px] uppercase">Max Marks</label>
                      <input
                        type="text"
                        value={maxMarks}
                        onChange={(e) => setMaxMarks(e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 font-semibold bg-white text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1 text-[9px] uppercase">Subject</label>
                    <input
                      type="text"
                      value={examSubject}
                      onChange={(e) => setExamSubject(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 font-semibold bg-white text-xs"
                    />
                  </div>
                </div>

                {perspectiveMode === 'Custom Mix (Percentage)' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3 shadow-inner">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase mb-2">Mix Distribution</h4>
                    <SliderRow label="Factual" value={distFactual} color="factual" onChange={(v) => adjustStyleSliders('factual', v)} />
                    <SliderRow label="Conceptual" value={distConceptual} color="conceptual" onChange={(v) => adjustStyleSliders('conceptual', v)} />
                    <SliderRow label="Advanced" value={distAdvanced} color="advanced" onChange={(v) => adjustStyleSliders('advanced', v)} />
                  </div>
                )}

                <div>
                  <label className="block text-slate-600 font-bold mb-1 text-xs">Questions</label>
                  <select
                    value={targetCount}
                    onChange={(e) => setTargetCount(parseInt(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-slate-800 font-semibold bg-slate-50 text-xs"
                  >
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions</option>
                    <option value={25}>25 Questions</option>
                    <option value={30}>30 Questions</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Difficulty
              </h3>
              <div className="space-y-4">
                <SliderRow label="Easy" value={distEasy} color="easy" onChange={(v) => adjustSliders('easy', v)} />
                <SliderRow label="Moderate" value={distModerate} color="moderate" onChange={(v) => adjustSliders('moderate', v)} />
                <SliderRow label="Hard" value={distHard} color="hard" onChange={(v) => adjustSliders('hard', v)} />
              </div>
            </div>

            <button
              onClick={generate}
              disabled={!inputText.trim() || isGenerating}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all shadow-lg ${
                inputText.trim() && !isGenerating
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-indigo-500/30'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {isGenerating ? 'Generating…' : `Generate ${targetCount} MCQs`}
            </button>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 w-full flex flex-col h-full">
          {/* Setup Tab */}
          {activeTab === 'setup' && !isFullscreen && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative bg-white border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                  dragOver ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                }`}
              >
                <input type="file" accept=".pdf,.txt" onChange={handleFileInput} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="bg-indigo-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                  <Upload className={`w-8 h-8 ${dragOver ? 'text-indigo-600' : 'text-indigo-500'}`} />
                </div>
                <p className="font-bold text-slate-800 text-lg mb-2">PDF ya Text Upload Karein</p>
                <p className="text-sm text-slate-500 font-medium">Apna PDF/TXT syllabus yahan tap karke chunein</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-[350px]">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">Source Text</span>
                  </div>
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Text yahan dikhega..."
                  className="w-full flex-1 p-4 text-sm text-slate-700 resize-none focus:outline-none placeholder-slate-400"
                />
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div
              className={
                isFullscreen
                  ? 'fixed inset-0 z-[9999] bg-[#cbd5e1] flex flex-col w-full h-full'
                  : 'bg-[#e5e7eb] rounded-xl overflow-hidden border border-slate-300 shadow-inner flex flex-col w-full'
              }
              style={isFullscreen ? {} : { height: 'calc(100vh - 120px)', minHeight: '400px' }}
            >
              {/* Toolbar */}
              <div
                className={
                  isFullscreen
                    ? 'bg-slate-800 border-b border-slate-700 p-3 flex flex-wrap items-center justify-between gap-2 shadow-lg z-10 text-white'
                    : 'bg-white border-b border-slate-200 p-3 flex flex-wrap items-center justify-between gap-2 shadow-sm z-10'
                }
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className={`flex items-center gap-1 p-1 rounded-lg border ${isFullscreen ? 'bg-slate-700 border-slate-600' : 'bg-slate-100 border-slate-200'}`}>
                    <button onClick={() => setZoomLevel((z) => Math.max(z - 0.1, 0.3))} className={`p-1.5 rounded ${isFullscreen ? 'hover:bg-slate-600' : 'hover:bg-white'}`}>
                      <ZoomOut size={14} />
                    </button>
                    <button onClick={() => setZoomLevel(1)} className={`p-1.5 rounded ${isFullscreen ? 'hover:bg-slate-600' : 'hover:bg-white'}`}>
                      <RotateCcw size={14} />
                    </button>
                    <button onClick={() => setZoomLevel((z) => Math.min(z + 0.1, 2))} className={`p-1.5 rounded ${isFullscreen ? 'hover:bg-slate-600' : 'hover:bg-white'}`}>
                      <ZoomIn size={14} />
                    </button>
                    <span className={`text-xs font-bold tabular-nums mx-2 ${isFullscreen ? 'text-slate-300' : 'text-slate-500'}`}>{Math.round(zoomLevel * 100)}%</span>
                  </div>
                  <PaperTimer />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {savedCode && (
                    <div className="hidden sm:flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1.5 rounded-lg border border-emerald-200 text-[10px] font-bold shadow-sm">
                      <span className="font-mono text-xs">{savedCode}</span>
                      <button onClick={() => navigator.clipboard.writeText(savedCode)} className="hover:text-emerald-900 ml-1">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleManualSave}
                    disabled={!questions.length || isSaving}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all shadow-md ${
                      !questions.length ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : savedCode ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                    <span>{savedCode ? 'Update' : 'Save'}</span>
                  </button>

                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isFullscreen ? 'bg-indigo-900/50 border-indigo-700/50' : 'bg-indigo-50 border-indigo-100'}`}>
                    <span className={`text-xs font-bold ${isFullscreen ? 'text-indigo-200' : 'text-indigo-800'}`}>Practice</span>
                    <button
                      onClick={() => setIsPracticeMode((p) => !p)}
                      className={`relative w-9 h-5 rounded-full transition-colors flex items-center ${isPracticeMode ? 'bg-indigo-600' : isFullscreen ? 'bg-slate-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform ${isPracticeMode ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>

                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    disabled={!questions.length}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      !questions.length
                        ? 'opacity-50 cursor-not-allowed'
                        : isFullscreen
                          ? 'bg-slate-600 hover:bg-slate-500 text-white'
                          : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
                    }`}
                  >
                    {isFullscreen ? <X className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Paper Content */}
              <div
                className="flex-1 overflow-x-auto overflow-y-auto p-4 flex justify-center items-start pt-12"
                style={{ scrollbarWidth: 'thin', scrollbarColor: isFullscreen ? '#475569 transparent' : '#cbd5e1 transparent' }}
              >
                <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', transition: 'transform .2s' }}>
                  <div
                    ref={pdfRef}
                    id="printable-paper"
                    className="bg-white shadow-2xl text-left text-slate-800 font-serif"
                    style={{
                      width: '794px',
                      minWidth: '794px',
                      maxWidth: '794px',
                      minHeight: '1123px',
                      padding: '40px 30px',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Paper Header */}
                    <div className="border-b-2 border-slate-800 pb-3 mb-6">
                      <h1 className="text-xl font-bold text-center uppercase tracking-wider mb-3">{(inputTitle || '').replace(/_/g, ' ')}</h1>
                      <div className="flex justify-between items-center text-xs font-bold uppercase text-slate-800 border border-slate-200 bg-slate-50 p-2 rounded">
                        <span>Paper Code: {paperCode}</span>
                        <span>Sub: {examSubject}</span>
                        <span>Max Marks: {maxMarks}</span>
                      </div>
                    </div>

                    {/* Score Card */}
                    {isTestSubmitted && (
                      <div className="mb-8 border-2 border-indigo-500 bg-indigo-50 rounded-xl p-6 text-center shadow-sm">
                        <h2 className="text-2xl font-black text-indigo-900 mb-6">Your Scorecard</h2>
                        <div className="flex flex-wrap justify-center gap-4">
                          <div className="bg-white border border-slate-200 rounded-lg p-4 w-28 shadow-sm">
                            <div className="text-3xl font-black text-emerald-600">{getScoreData().correct}</div>
                            <div className="text-xs font-bold text-slate-500 uppercase mt-1">Correct</div>
                          </div>
                          <div className="bg-white border border-slate-200 rounded-lg p-4 w-28 shadow-sm">
                            <div className="text-3xl font-black text-rose-600">{getScoreData().wrong}</div>
                            <div className="text-xs font-bold text-slate-500 uppercase mt-1">Wrong</div>
                          </div>
                          <div className="bg-white border border-slate-200 rounded-lg p-4 w-28 shadow-sm">
                            <div className="text-3xl font-black text-slate-600">{getScoreData().unattempted}</div>
                            <div className="text-xs font-bold text-slate-500 uppercase mt-1">Unattempted</div>
                          </div>
                          <div className="bg-white border-2 border-indigo-200 rounded-lg p-4 w-32 shadow-sm ring-2 ring-indigo-500">
                            <div className="text-3xl font-black text-indigo-700">{getScoreData().score}</div>
                            <div className="text-xs font-bold text-indigo-500 uppercase mt-1">Score</div>
                          </div>
                        </div>
                        <button onClick={retakeTest} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700">
                          Retake Test
                        </button>
                      </div>
                    )}

                    {/* Questions */}
                    {questions.length > 0 ? (
                      <div>
                        {questions.map((q, idx) => (
                          <div key={q.id} className="group relative question-block border-b border-slate-200 pb-4 mb-5">
                            {/* Trash button */}
                            <div className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-white pl-2 pb-2">
                              <button
                                onClick={() => deleteQuestion(q.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-md transition-colors shadow-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex w-full">
                              {/* Hindi Column */}
                              {(paperLanguage === 'Bilingual' || paperLanguage === 'Hindi Only') && (
                                <div className={`${paperLanguage === 'Bilingual' ? 'w-1/2 pr-4 border-r border-slate-400' : 'w-full'} flex`}>
                                  <div className="w-8 shrink-0 font-bold text-sm pt-0.5">{idx + 1}.</div>
                                  <div className="flex-1 font-serif">
                                    <div className="text-sm font-medium leading-relaxed mb-3 text-justify">{q.q_hi}</div>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-sm">
                                      {[0, 1, 2, 3].map((i) => renderOption(q, i, true))}
                                    </div>
                                    {renderOption5(q, true)}
                                  </div>
                                </div>
                              )}

                              {/* English Column */}
                              {(paperLanguage === 'Bilingual' || paperLanguage === 'English Only') && (
                                <div className={`${paperLanguage === 'Bilingual' ? 'w-1/2 pl-4' : 'w-full'} flex`}>
                                  <div className="w-8 shrink-0 font-bold text-sm pt-0.5">{idx + 1}.</div>
                                  <div className="flex-1 font-serif">
                                    <div className="text-sm font-medium leading-relaxed mb-3 text-justify">{q.q_en}</div>
                                    <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-sm">
                                      {[0, 1, 2, 3].map((i) => renderOption(q, i, false))}
                                    </div>
                                    {renderOption5(q, false)}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Show/Hide Answer */}
                            {isPracticeMode && !isTestSubmitted && (
                              <div className="mt-3 text-center">
                                <button
                                  onClick={() => setRevealedQs((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition-colors"
                                >
                                  {revealedQs[q.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  {revealedQs[q.id] ? 'Hide' : 'Show'} Answer
                                </button>
                              </div>
                            )}

                            {/* Answer Explanation */}
                            {(!isPracticeMode || revealedQs[q.id] || isTestSubmitted) && (
                              <div className="mt-4 ml-8 bg-slate-50 border border-slate-200 rounded p-3 text-xs font-sans">
                                <div className="font-bold text-slate-800 mb-1">
                                  Answer: <span className="text-emerald-700">({q.correct_index + 1})</span>
                                </div>
                                {(paperLanguage === 'Bilingual' || paperLanguage === 'English Only') && (
                                  <div className="text-slate-600 mb-1">
                                    {paperLanguage === 'Bilingual' && <span className="font-bold text-slate-800">EN: </span>}
                                    {q.exp_en}
                                  </div>
                                )}
                                {(paperLanguage === 'Bilingual' || paperLanguage === 'Hindi Only') && (
                                  <div className="text-slate-600">
                                    {paperLanguage === 'Bilingual' && <span className="font-bold text-slate-800">HI: </span>}
                                    {q.exp_hi}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}

                        {!isTestSubmitted && (
                          <div className="mt-10 mb-6 flex justify-center">
                            <button
                              onClick={submitTest}
                              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white rounded-full font-black text-lg shadow-lg transition-all"
                            >
                              <CheckCircle className="w-5 h-5" /> Submit Test
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-20 text-slate-400">
                        <p className="text-sm font-medium">No questions yet. Generate some from the setup tab.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Library Tab */}
          {activeTab === 'library' && !isFullscreen && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
              <Library className="w-12 h-12 mx-auto mb-4 text-indigo-600" />
              <h2 className="text-xl font-black text-slate-800 mb-2">Paper Library</h2>
              <p className="text-sm text-slate-500">Your saved papers will appear here.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
