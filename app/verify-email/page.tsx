'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function VerifyEmailPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState<any>(null)
  const [cooldown, setCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const router = useRouter()

  useEffect(() => {
    const raw = localStorage.getItem('pending_verification')
    if (!raw) {
      router.replace('/login')
      return
    }
    try {
      const p = JSON.parse(raw)
      if (!p.email) { router.replace('/login'); return }
      setPending(p)
    } catch {
      router.replace('/login')
    }
  }, [router])

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }
  }, [])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!pending) return
    setError('')
    setLoading(true)

    const entered = code.trim()

    // In dev mode, allow direct code comparison as fallback
    if (pending.devMode && pending.devCode && entered === pending.devCode) {
      completeLogin()
      return
    }

    try {
      const res = await fetch('/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: entered,
          token: pending.token,
          email: pending.email,
          expires: pending.expires,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        const attempts = (pending.attempts || 0) + 1
        const updated = { ...pending, attempts }
        setPending(updated)
        localStorage.setItem('pending_verification', JSON.stringify(updated))
        setError(
          attempts >= 5
            ? 'Too many failed attempts. Please request a new code.'
            : data.error || 'Invalid verification code. Please try again.'
        )
        setLoading(false)
        return
      }

      completeLogin()
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  function completeLogin() {
    const session = {
      email: pending.email,
      name: pending.name || '',
      loggedInAt: new Date().toISOString(),
    }
    localStorage.setItem('session', JSON.stringify(session))
    localStorage.removeItem('pending_verification')
    router.push('/')
  }

  async function handleResend() {
    if (!pending || cooldown > 0) return
    setResending(true)
    setError('')

    try {
      const res = await fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pending.email, name: pending.name || '' }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to resend code.')
        setResending(false)
        return
      }

      const updated = {
        ...pending,
        token: data.token,
        expires: data.expires,
        devMode: data.devMode ?? false,
        devCode: data.devMode ? data.code : undefined,
        attempts: 0,
      }
      setPending(updated)
      localStorage.setItem('pending_verification', JSON.stringify(updated))
      setCode('')

      // 60-second cooldown
      setCooldown(60)
      cooldownRef.current = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) { clearInterval(cooldownRef.current!); return 0 }
          return c - 1
        })
      }, 1000)
    } catch {
      setError('Network error. Please try again.')
    }

    setResending(false)
  }

  if (!pending) return null

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Check your inbox</h1>
          <p className="text-gray-400 mt-2 text-sm">
            We sent a 6-digit code to{' '}
            <span className="text-indigo-400 font-medium">{pending.email}</span>
          </p>
          {pending.devMode && pending.devCode && (
            <p className="mt-2 text-xs text-yellow-400 bg-yellow-900/30 rounded px-2 py-1">
              Dev mode — code: <strong>{pending.devCode}</strong>
            </p>
          )}
        </div>

        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Verification code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              inputMode="numeric"
              required
              autoFocus
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/40 border border-red-500/60 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Verifying…' : 'Verify & sign in'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="text-sm text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {resending
              ? 'Resending…'
              : cooldown > 0
              ? `Resend in ${cooldown}s`
              : 'Resend code'}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => { localStorage.removeItem('pending_verification'); router.push('/login') }}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    </div>
  )
}
