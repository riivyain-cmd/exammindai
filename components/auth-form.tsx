'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message ?? 'Something went wrong')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-indigo-100 mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.5 1.5H5.75A2.25 2.25 0 003.5 3.75v12.5A2.25 2.25 0 005.75 18.5h8.5a2.25 2.25 0 002.25-2.25V8m-10-6.5v5m5-5v5m-8 .5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isSignUp ? 'Get Started' : 'Welcome Back'}
          </h1>
          <p className="text-slate-600">
            {isSignUp
              ? 'Create your ExamMind account today'
              : 'Sign in to access your exam papers'}
          </p>
        </div>

        {/* Card */}
        <Card className="p-8 shadow-lg border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div>
                <Label htmlFor="name" className="text-sm font-semibold text-slate-700 mb-2 block">
                  Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="आपका नाम या Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className="h-11 bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700 mb-2 block">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700 mb-2 block">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="h-11 bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
              />
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200" role="alert">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
            >
              {loading
                ? (
                  <>
                    <svg className="w-4 h-4 animate-spin mr-2 inline" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                )
                : isSignUp
                  ? 'Create Account'
                  : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">or</span>
            </div>
          </div>

          {/* Toggle Link */}
          <p className="text-center text-sm text-slate-600">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <Link
              href={isSignUp ? '/sign-in' : '/sign-up'}
              className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {isSignUp ? 'Sign in instead' : 'Sign up now'}
            </Link>
          </p>
        </Card>

        {/* Footer Help Text */}
        <p className="text-center text-xs text-slate-500 mt-6">
          By {isSignUp ? 'creating an account' : 'signing in'}, you agree to our Terms of Service
        </p>
      </div>
    </main>
  )
}
