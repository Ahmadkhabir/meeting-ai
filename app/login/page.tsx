'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), name: name.trim() }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to send verification email. Please try again.')
        setLoading(false)
        return
      }

      // Store verification context (token for server-side verification)
      localStorage.setItem(
        'pending_verification',
        JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          token: data.token,
          expires: data.expires,
          attempts: 0,
          devMode: data.devMode ?? false,
          devCode: data.devMode ? data.code : undefined,
        })
      )

      router.push('/verify-email')
    } catch (err: any) {
      setError('Network error. Please check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Sign in to MeetingAI</h1>
          <p className="text-gray-400 mt-2 text-sm">
            We&apos;ll send a verification code to your email.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ahmad"
              required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/40 border border-red-500/60 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !name}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Sending code…' : 'Send verification code'}
          </button>
        </form>
      </div>
    </div>
  )
}
