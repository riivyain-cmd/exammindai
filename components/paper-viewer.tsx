'use client'

import React, { useState, useRef } from 'react'
import {
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  X,
  Check,
  Clock,
  Play,
  Pause,
} from 'lucide-react'

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

interface PaperViewerProps {
  title: string
  paperCode: string
  subject: string
  maxMarks: string
  questions: Question[]
  paperLanguage: string
}

export function PaperViewer({
  title,
  paperCode,
  subject,
  maxMarks,
  questions,
  paperLanguage,
}: PaperViewerProps) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [studentAnswers, setStudentAnswers] = useState<Record<string, number>>({})
  const [isTestSubmitted, setIsTestSubmitted] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const pdfRef = useRef<HTMLDivElement>(null)

  React.useEffect(() => {
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
    if (h > 0)
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const getScoreData = () => {
    let correct = 0,
      wrong = 0,
      unattempted = 0
    questions.forEach((q) => {
      const ans = studentAnswers[q.id]
      if (ans === undefined || ans === 4) unattempted++
      else if (ans === q.correct_index) correct++
      else wrong++
    })

    const totalQuestions = questions.length || 1
    const totalMarksNum = Number(maxMarks) || 200
    const marksPerQuestion = totalMarksNum / totalQuestions
    const negativeMarks = marksPerQuestion / 3
    const score = correct * marksPerQuestion - wrong * negativeMarks

    return {
      correct,
      wrong,
      unattempted,
      score: isNaN(score) ? '0.00' : score.toFixed(2),
      total: totalMarksNum,
    }
  }

  const renderOption = (q: Question, index: number, isHindi: boolean) => {
    const isSelected = studentAnswers[q.id] === index
    const isCorrect = q.correct_index === index
    const optionText = isHindi
      ? q.options_hi && q.options_hi[index]
        ? q.options_hi[index]
        : ''
      : q.options_en && q.options_en[index]
        ? q.options_en[index]
        : ''

    let bgClass = 'transparent'
    let textClass = 'text-slate-800'
    let borderClass = 'border-transparent'

    if (isTestSubmitted) {
      if (isCorrect) {
        bgClass = 'bg-emerald-100 font-bold'
        borderClass = 'border-emerald-500'
        textClass = 'text-emerald-900'
      } else if (isSelected && !isCorrect) {
        bgClass = 'bg-rose-100'
        borderClass = 'border-rose-500'
        textClass = 'text-rose-900 line-through'
      } else {
        borderClass = 'border-transparent opacity-60'
      }
    } else {
      if (isSelected) {
        bgClass = 'bg-indigo-100 font-bold'
        borderClass = 'border-indigo-500'
        textClass = 'text-indigo-900'
      }
    }

    return (
      <div
        key={`${q.id}-${isHindi ? 'hi' : 'en'}-${index}`}
        onClick={() => {
          if (!isTestSubmitted)
            setStudentAnswers((prev) => ({ ...prev, [q.id]: index }))
        }}
        className={`flex items-center gap-2 px-3 py-2 rounded border transition-all cursor-pointer ${bgClass} ${borderClass} ${textClass}`}
      >
        <span className="font-sans">({index + 1})</span>
        <span className="flex-1 text-sm">{optionText}</span>
        {isSelected && isTestSubmitted && isCorrect && (
          <Check className="w-4 h-4 text-emerald-600" />
        )}
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-100' : 'bg-slate-50 rounded-lg border border-slate-200'}`}
    >
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 p-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.1, 0.5))}
              className="p-1 hover:bg-white rounded transition-all"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 hover:bg-white rounded transition-all"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.1, 2))}
              className="p-1 hover:bg-white rounded transition-all"
            >
              <ZoomIn size={16} />
            </button>
            <span className="text-xs font-bold text-slate-600 mx-2">
              {Math.round(zoomLevel * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50">
            <Clock size={14} />
            <span className="text-xs font-mono font-bold min-w-[40px] text-center">
              {formatTime(timerSeconds)}
            </span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-0.5 text-slate-600 hover:text-indigo-600 transition-colors"
            >
              {isTimerRunning ? <Pause size={14} /> : <Play size={14} />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-slate-100 rounded transition-all text-slate-600"
          >
            {isFullscreen ? <X size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        className="flex-1 overflow-y-auto p-4 flex justify-center"
        style={{
          scrollBehavior: 'smooth',
        }}
      >
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s',
          }}
        >
          <div
            ref={pdfRef}
            className="bg-white shadow-lg rounded-lg p-8 w-[794px] text-slate-900 font-serif"
          >
            {/* Header */}
            <div className="border-b-2 border-slate-800 pb-4 mb-6">
              <h1 className="text-2xl font-bold text-center uppercase">
                {title.replace(/_/g, ' ')}
              </h1>
              <div className="flex justify-between items-center mt-4 text-xs font-bold bg-slate-50 p-3 rounded border border-slate-200">
                <span>Paper Code: {paperCode}</span>
                <span>Sub: {subject}</span>
                <span>Maximum Marks: {maxMarks}</span>
              </div>
            </div>

            {/* Scorecard if submitted */}
            {isTestSubmitted && (
              <div className="mb-8 p-6 border-2 border-indigo-500 bg-indigo-50 rounded-lg">
                <h2 className="text-xl font-bold text-center mb-4 text-indigo-900">
                  Your Test Scorecard
                </h2>
                <div className="flex justify-center gap-4 font-sans">
                  <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
                    <div className="text-2xl font-bold text-emerald-600">
                      {getScoreData().correct}
                    </div>
                    <div className="text-xs font-bold text-slate-500 mt-1">
                      Correct
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
                    <div className="text-2xl font-bold text-rose-600">
                      {getScoreData().wrong}
                    </div>
                    <div className="text-xs font-bold text-slate-500 mt-1">
                      Wrong
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
                    <div className="text-2xl font-bold text-slate-600">
                      {getScoreData().unattempted}
                    </div>
                    <div className="text-xs font-bold text-slate-500 mt-1">
                      Unattempted
                    </div>
                  </div>
                  <div className="bg-indigo-100 p-4 rounded-lg border-2 border-indigo-500 text-center">
                    <div className="text-2xl font-bold text-indigo-700">
                      {getScoreData().score}
                    </div>
                    <div className="text-xs font-bold text-indigo-600 mt-1">
                      Score
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Questions */}
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="mb-6 pb-4 border-b border-slate-200 page-break-inside"
              >
                <div className="flex gap-4">
                  {/* Hindi Column */}
                  {(paperLanguage === 'Bilingual' ||
                    paperLanguage === 'Hindi Only') && (
                    <div
                      className={
                        paperLanguage === 'Bilingual' ? 'w-1/2 pr-4' : 'w-full'
                      }
                    >
                      <div className="flex gap-2">
                        <div className="font-bold text-sm w-6 shrink-0">
                          {idx + 1}.
                        </div>
                        <div className="flex-1">
                          <div className="text-sm leading-relaxed mb-3">
                            {q.q_hi}
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            {[0, 1, 2, 3].map((i) =>
                              renderOption(q, i, true)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* English Column */}
                  {(paperLanguage === 'Bilingual' ||
                    paperLanguage === 'English Only') && (
                    <div
                      className={
                        paperLanguage === 'Bilingual' ? 'w-1/2 pl-4' : 'w-full'
                      }
                    >
                      <div className="flex gap-2">
                        <div className="font-bold text-sm w-6 shrink-0">
                          {idx + 1}.
                        </div>
                        <div className="flex-1">
                          <div className="text-sm leading-relaxed mb-3">
                            {q.q_en}
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            {[0, 1, 2, 3].map((i) =>
                              renderOption(q, i, false)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Answer explanation */}
                {isTestSubmitted && (
                  <div className="mt-3 ml-8 p-3 bg-slate-50 rounded text-xs">
                    <div className="font-bold text-slate-800 mb-1">
                      Answer: <span className="text-emerald-700">({q.correct_index + 1})</span>
                    </div>
                    {(paperLanguage === 'Bilingual' ||
                      paperLanguage === 'English Only') && (
                      <div className="text-slate-600 mb-1">{q.exp_en}</div>
                    )}
                    {(paperLanguage === 'Bilingual' ||
                      paperLanguage === 'Hindi Only') && (
                      <div className="text-slate-600">{q.exp_hi}</div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Submit Button */}
            {!isTestSubmitted && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setIsTestSubmitted(true)}
                  className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all"
                >
                  Submit Test
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
