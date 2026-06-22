import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ExamMind AI - AI-Powered Exam Paper Generator',
  description: 'Generate AI-powered mock test papers with bilingual support for UPSC, SSC, Banking, and more.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="24" fill="%233B82F6"/><path d="M24 35C17 35 12 32.5 9 30V15C12 17.5 17 20 24 20C31 20 36 17.5 39 15V30C36 32.5 31 35 24 35Z" fill="%230F172A" opacity="0.3"/><path d="M24 34C18 34 13 32 10 30V15C13 17 18 19 24 19V34Z" fill="%23F8FAFC"/></svg>',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-background">
      <body>{children}</body>
    </html>
  )
}
