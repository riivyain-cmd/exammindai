import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { ExamGenerator } from '@/components/exam-generator'

export const metadata = {
  title: 'ExamMind AI - Mock Test Generator',
  description: 'Generate AI-powered exam papers with bilingual support',
}

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const geminiApiKey = process.env.GEMINI_API_KEY || ''

  return (
    <div>
      <ExamGenerator geminiApiKey={geminiApiKey} />
    </div>
  )
}
