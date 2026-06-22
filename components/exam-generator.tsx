'use client'

import { useState } from 'react'
import { Header } from './header'
import { Upload, Sparkles, Loader2, FileText, AlertCircle } from 'lucide-react'

interface ExamGeneratorProps {
  geminiApiKey: string
}

export function ExamGenerator({ geminiApiKey }: ExamGeneratorProps) {
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [questions, setQuestions] = useState<any[]>([])
  const [selectedExam, setSelectedExam] = useState('UPSC')
  const [questionCount, setQuestionCount] = useState(15)
  const [difficulty, setDifficulty] = useState('mixed')
  const [language, setLanguage] = useState('Bilingual')

  const EXAM_TYPES = ['UPSC', 'SSC CGL', 'State PCS (RPSC)', 'Banking PO', 'Railway', 'NEET', 'JEE']

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (uploadedFile) {
      setFile(uploadedFile)
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        setText(content.substring(0, 5000))
        setMessage(`File loaded: ${uploadedFile.name}`)
      }
      reader.readAsText(uploadedFile)
    }
  }

  const generateQuestions = async () => {
    if (!text.trim()) {
      setMessage('Please upload text first')
      return
    }

    setLoading(true)
    setMessage('Generating questions...')

    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.substring(0, 10000),
          examType: selectedExam,
          count: questionCount,
          difficulty,
          language,
          apiKey: geminiApiKey,
        }),
      })

      if (!response.ok) throw new Error('Generation failed')
      const data = await response.json()
      setQuestions(data.questions || [])
      setMessage(`Generated ${data.questions?.length || 0} questions!`)
    } catch (error) {
      setMessage('Error: ' + (error instanceof Error ? error.message : 'Generation failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Settings */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-20">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Settings
              </h2>

              <div className="space-y-5">
                {/* Exam Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Exam Type</label>
                  <select
                    value={selectedExam}
                    onChange={(e) => setSelectedExam(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    {EXAM_TYPES.map((exam) => (
                      <option key={exam} value={exam}>
                        {exam}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Question Count */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Number of Questions</label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    {[10, 15, 20, 25, 30].map((num) => (
                      <option key={num} value={num}>
                        {num} Questions
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Difficulty Level</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="mixed">Mixed</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="Bilingual">Bilingual (English + Hindi)</option>
                    <option value="English">English Only</option>
                    <option value="Hindi">Hindi Only</option>
                  </select>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateQuestions}
                  disabled={loading || !text}
                  className="w-full mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Questions
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Content - Upload & Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer">
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept=".txt,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900">Drop your file here</p>
                      <p className="text-sm text-slate-500 mt-1">Upload PDF or Text file (Max 10MB)</p>
                    </div>
                  </div>
                </label>
              </div>

              {file && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-900">{file.name}</span>
                </div>
              )}

              {message && (
                <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                  message.includes('Error') || message.includes('Please')
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <AlertCircle className={`w-5 h-5 mt-0.5 shrink-0 ${
                    message.includes('Error') || message.includes('Please')
                      ? 'text-red-600'
                      : 'text-blue-600'
                  }`} />
                  <p className={`text-sm font-medium ${
                    message.includes('Error') || message.includes('Please')
                      ? 'text-red-800'
                      : 'text-blue-800'
                  }`}>{message}</p>
                </div>
              )}
            </div>

            {/* Questions Display */}
            {questions.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Generated Questions ({questions.length})</h3>
                <div className="space-y-6">
                  {questions.slice(0, 5).map((q, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <p className="font-bold text-slate-900">Q{idx + 1}. {q.q_en}</p>
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                          {q.difficulty}
                        </span>
                      </div>
                      <div className="space-y-2 ml-4">
                        {q.options_en?.map((opt: string, i: number) => (
                          <p key={i} className="text-sm text-slate-600">({i + 1}) {opt}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {questions.length > 5 && (
                  <p className="text-sm text-slate-500 mt-6 text-center">
                    ... and {questions.length - 5} more questions
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
