'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type RecordingStatus = 'idle' | 'recording' | 'processing'

export default function RecordingPage() {
  const [status, setStatus] = useState<RecordingStatus>('idle')
  const [time, setTime] = useState(0)
  const [processingStep, setProcessingStep] = useState('')
  const [error, setError] = useState('')

  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const durationRef = useRef(0)
  const router = useRouter()

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  async function start() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      durationRef.current = 0

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg'

      const mr = new MediaRecorder(stream, { mimeType })
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        processRecording(blob, durationRef.current)
      }
      mr.start(1000)
      mediaRef.current = mr
      setStatus('recording')

      timerRef.current = setInterval(() => {
        setTime((t) => {
          durationRef.current = t + 1
          return t + 1
        })
      }, 1000)
    } catch (e: any) {
      setError(
        e.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access and try again.'
          : 'Could not access microphone: ' + e.message
      )
    }
  }

  function stop() {
    if (!mediaRef.current || mediaRef.current.state === 'inactive') return
    mediaRef.current.stop()
    mediaRef.current.stream.getTracks().forEach((t) => t.stop())
    if (timerRef.current) clearInterval(timerRef.current)
    setStatus('processing')
  }

  async function processRecording(blob: Blob, duration: number) {
    try {
      // Read API keys from localStorage (set in Settings page)
      const keys = JSON.parse(localStorage.getItem('ai_keys') || '{}')
      const models = JSON.parse(localStorage.getItem('ai_models') || '{}')

      const openaiKey: string = keys.openai || ''
      const groqKey: string = keys.groq || ''
      const anthropicKey: string = keys.anthropic || ''

      // Pick transcription provider (prefer OpenAI, fallback to Groq)
      const transcribeProvider = openaiKey ? 'openai' : groqKey ? 'groq' : ''
      const transcribeKey = openaiKey || groqKey || ''

      if (!transcribeKey) {
        setError(
          'No API key found. Please add an OpenAI or Groq API key in Settings to enable transcription.'
        )
        setStatus('idle')
        setTime(0)
        return
      }

      // ── Step 1: Transcribe ──────────────────────────────────────────────
      setProcessingStep('Transcribing audio...')
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')
      formData.append('provider', transcribeProvider)
      formData.append('apiKey', transcribeKey)

      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })
      const transcribeData = await transcribeRes.json()

      if (!transcribeRes.ok || !transcribeData.text) {
        setError(
          transcribeData.error ||
            'Transcription failed. Please check your API key in Settings and try again.'
        )
        setStatus('idle')
        setTime(0)
        return
      }

      const transcript: string = transcribeData.text

      // ── Step 2: Summarize (best-effort) ────────────────────────────────
      let summary = ''
      let actionItems: string[] = []

      const summaryKey = anthropicKey || openaiKey
      const summaryProvider = anthropicKey ? 'anthropic' : 'openai'
      const summaryModel = anthropicKey
        ? models.anthropic || 'claude-3-haiku-20240307'
        : models.openai || 'gpt-4o-mini'

      if (summaryKey) {
        setProcessingStep('Generating summary...')
        try {
          const summaryRes = await fetch('/api/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transcript,
              provider: summaryProvider,
              apiKey: summaryKey,
              model: summaryModel,
            }),
          })
          if (summaryRes.ok) {
            const sd = await summaryRes.json()
            summary = sd.summary || ''
            actionItems = sd.actionItems || []
          }
        } catch {
          // summary is best-effort — continue without it
        }
      }

      // ── Step 3: Save meeting to localStorage ───────────────────────────
      setProcessingStep('Saving meeting...')

      const titleLine = summary
        ? summary.split('\n').find((l) => l.trim()) || 'Meeting'
        : 'Meeting'
      const title =
        titleLine.replace(/^[#*\s-]+/, '').slice(0, 60) ||
        `Meeting on ${new Date().toLocaleDateString()}`

      const meeting = {
        id: Date.now().toString(),
        title,
        date: new Date().toISOString(),
        duration: formatDuration(duration),
        transcript,
        summary,
        actionItems,
      }

      const existing: any[] = JSON.parse(localStorage.getItem('meetings') || '[]')
      existing.unshift(meeting)
      localStorage.setItem('meetings', JSON.stringify(existing))

      router.push('/meetings')
    } catch (e: any) {
      console.error('processRecording error:', e)
      setError('Processing failed: ' + e.message)
      setStatus('idle')
      setTime(0)
    }
  }

  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const mins = String(Math.floor(time / 60)).padStart(2, '0')
  const secs = String(time % 60).padStart(2, '0')

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8 gap-8">
      <h1 className="text-3xl font-bold">Record Meeting</h1>

      {/* Timer */}
      <div className="text-7xl font-mono tracking-wider text-white">
        {mins}:{secs}
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-md w-full p-4 bg-red-900/40 border border-red-500/60 rounded-xl text-red-200 text-sm text-center">
          {error}
          <button
            onClick={() => setError('')}
            className="mt-2 block mx-auto text-red-400 hover:text-red-200 underline text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Controls */}
      {status === 'idle' && (
        <button
          onClick={start}
          className="px-10 py-4 bg-red-600 hover:bg-red-700 active:scale-95 rounded-full text-xl font-semibold transition-all"
        >
          Start Recording
        </button>
      )}

      {status === 'recording' && (
        <div className="flex flex-col items-center gap-5">
          <div className="flex items-center gap-2 text-red-400 font-medium">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse inline-block" />
            Recording in progress
          </div>
          <button
            onClick={stop}
            className="px-10 py-4 bg-gray-700 hover:bg-gray-600 active:scale-95 rounded-full text-xl font-semibold transition-all"
          >
            Stop &amp; Transcribe
          </button>
        </div>
      )}

      {status === 'processing' && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-lg">{processingStep || 'Processing...'}</p>
          <p className="text-gray-600 text-sm">This may take a moment</p>
        </div>
      )}

      {/* Settings reminder */}
      {status === 'idle' && (
        <p className="text-gray-600 text-sm text-center max-w-xs">
          Make sure you&apos;ve added your OpenAI or Groq API key in{' '}
          <a href="/settings" className="text-indigo-400 hover:underline">
            Settings
          </a>{' '}
          before recording.
        </p>
      )}
    </div>
  )
}
