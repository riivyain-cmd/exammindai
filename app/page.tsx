import { ExamGenerator } from '@/components/exam-generator'

export const metadata = {
  title: 'ExamMind AI - Mock Test Generator',
  description: 'Generate AI-powered exam papers with bilingual support',
}

export default function Page() {
  const geminiApiKey = process.env.GEMINI_API_KEY || ''

  return (
    <div className="min-h-screen bg-slate-50">
      <ExamGenerator geminiApiKey={geminiApiKey} />
    </div>
  )
}
