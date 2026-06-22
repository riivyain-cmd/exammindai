'use client'

import Link from 'next/link'

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-bold text-lg group">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center text-white group-hover:shadow-lg transition-shadow">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.5 1.5H5.75A2.25 2.25 0 003.5 3.75v12.5A2.25 2.25 0 005.75 18.5h8.5a2.25 2.25 0 002.25-2.25V8m-10-6.5v5m5-5v5m-8 .5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <span className="text-slate-900">ExamMind <span className="text-indigo-600">AI</span></span>
        </Link>

        <div className="text-sm text-slate-500 font-medium">
          Free Mock Test Generator
        </div>
      </div>
    </header>
  )
}
