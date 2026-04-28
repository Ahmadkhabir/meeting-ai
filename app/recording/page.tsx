'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type RecordingStatus = 'idle' | 'recording' | 'processing' | 'done'

interface Meeting {
  id: string
  title: string
  date: string
  duration: string
  transcript: string
  summary: string
  actionItems: string[]
}

export default function RecordingPage() {
  const [status, setStatus] = useState<RecordingStatus>('idle')
  const [time, setTime] = useState(0)
  const [processingStep, setProcessingStep] = useState('')
  const [error, setError] = useState('')
  const [doneMeeting, setDoneMeeting] = useState<Meeting | null>(null)
  const [sharing, setSharing] = useState<'telegram' | 'whatsapp' | null>(null)
  const [shareMsg, setShareMsg] = useState('')

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
    setShareMsg('')
    setDoneMeeting(null)
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
      const keys = JSON.parse(localStorage.getItem('ai_keys') || '{}')
      const models = JSON.parse(localStorage.getItem('ai_models') || '{}')

      const openaiKey: string = keys.openai || ''
      const groqKey: string = keys.groq || ''
      const anthropicKey: string = keys.anthropic || ''

      const transcribeProvider = openaiKey ? 'openai' : groqKey ? 'groq' : ''
      const transcribeKey = openaiKey || groqKey || ''

      if (!transcribeKey) {
        setError('No API key found. Please add an OpenAI or Groq API key in Settings.')
        setStatus('idle')
        setTime(0)
        return
      }

      // ── Step 1: Transcribe ─────────────────────────────────────────────
      setProcessingStep('Transcribing audio...')
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')
      formData.append('provider', transcribeProvider)
      formData.append('apiKey', transcribeKey)

      const transcribeRes = await fetch('/api/transcribe', { method: 'POST', body: formData })
      const transcribeData = await transcribeRes.json()

      if (!transcribeRes.ok || !transcribeData.text) {
        setError(transcribeData.error || 'Transcription failed. Check your API key in Settings.')
        setStatus('idle')
        setTime(0)
        return
      }

      const transcript: string = transcribeData.text

      // ── Step 2: Summarize ──────────────────────────────────────────────
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
            body: JSON.stringify({ transcript, provider: summaryProvider, apiKey: summaryKey, model: summaryModel }),
          })
          if (summaryRes.ok) {
            const sd = await summaryRes.json()
            summary = sd.summary || ''
            actionItems = sd.actionItems || []
          }
        } catch { /* best effort */ }
      }

      // ── Step 3: Save ───────────────────────────────────────────────────
      setProcessingStep('Saving meeting...')

      const titleLine = summary
        ? summary.split('\n').find((l) => l.trim()) || 'Meeting'
        : 'Meeting'
      const title =
        titleLine.replace(/^[#*\s-]+/, '').slice(0, 60) ||
        `Meeting on ${new Date().toLocaleDateString()}`

      const meeting: Meeting = {
        id: Date.now().toString(),
        title,
        date: new Date().toISOString(),
        duration: formatDuration(duration),
        transcript,
        summary,
        actionItems,
      }

      const existing: Meeting[] = JSON.parse(localStorage.getItem('meetings') || '[]')
      existing.unshift(meeting)
      localStorage.setItem('meetings', JSON.stringify(existing))

      setDoneMeeting(meeting)
      setStatus('done')
    } catch (e: any) {
      console.error('processRecording error:', e)
      setError('Processing failed: ' + e.message)
      setStatus('idle')
      setTime(0)
    }
  }

  async function shareToTelegram() {
    if (!doneMeeting) return
    const tgConfig = JSON.parse(localStorage.getItem('tg_config') || '{}')
    if (!tgConfig.botToken || !tgConfig.chatId) {
      setShareMsg('Telegram not configured. Go to Settings to add your Bot Token and Chat ID.')
      return
    }
    setSharing('telegram')
    setShareMsg('')
    try {
      const res = await fetch('/api/send-to-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: tgConfig.botToken,
          chatId: tgConfig.chatId,
          title: doneMeeting.title,
          summary: doneMeeting.summary,
          actionItems: doneMeeting.actionItems,
        }),
      })
      const data = await res.json()
      setShareMsg(data.success ? '✓ Sent to Telegram!' : `Telegram error: ${data.error}`)
    } catch (e: any) {
      setShareMsg('Failed to send to Telegram: ' + e.message)
    }
    setSharing(null)
  }

  async function shareToWhatsApp() {
    if (!doneMeeting) return
    const waConfig = JSON.parse(localStorage.getItem('wa_config') || '{}')
    if (!waConfig.phoneNumberId || !waConfig.accessToken || !waConfig.recipientPhone) {
      setShareMsg('WhatsApp not configured. Go to Settings to add your WhatsApp Business API credentials.')
      return
    }
    setSharing('whatsapp')
    setShareMsg('')
    try {
      const res = await fetch('/api/send-to-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId: waConfig.phoneNumberId,
          accessToken: waConfig.accessToken,
          recipientPhone: waConfig.recipientPhone,
          title: doneMeeting.title,
          summary: doneMeeting.summary,
          actionItems: doneMeeting.actionItems,
        }),
      })
      const data = await res.json()
      setShareMsg(data.success ? '✓ Sent to WhatsApp!' : `WhatsApp error: ${data.error}`)
    } catch (e: any) {
      setShareMsg('Failed to send to WhatsApp: ' + e.message)
    }
    setSharing(null)
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

      {/* ── Done State ──────────────────────────────────────────────────── */}
      {status === 'done' && doneMeeting && (
        <div className="w-full max-w-md space-y-5">
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-xl font-semibold text-white">Meeting saved!</p>
            <p className="text-gray-400 text-sm text-center">{doneMeeting.title}</p>
          </div>

          {/* Share buttons */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
            <p className="text-sm font-medium text-gray-300">Share summary via:</p>
            <div className="flex gap-3">
              <button
                onClick={shareToTelegram}
                disabled={sharing !== null}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sky-700 hover:bg-sky-600 disabled:opacity-50 rounded-xl text-sm font-medium transition"
              >
                {sharing === 'telegram' ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : '✈️'}
                Telegram
              </button>
              <button
                onClick={shareToWhatsApp}
                disabled={sharing !== null}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-700 hover:bg-green-600 disabled:opacity-50 rounded-xl text-sm font-medium transition"
              >
                {sharing === 'whatsapp' ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : '💬'}
                WhatsApp
              </button>
            </div>
            {shareMsg && (
              <p className={`text-xs text-center ${shareMsg.startsWith('✓') ? 'text-green-400' : 'text-yellow-400'}`}>
                {shareMsg}
              </p>
            )}
            <p className="text-xs text-gray-600 text-center">
              Configure in{' '}
              <a href="/settings" className="text-indigo-400 hover:underline">Settings</a>
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/meetings')}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition"
            >
              Go to Meetings
            </button>
            <button
              onClick={() => { setStatus('idle'); setTime(0); setDoneMeeting(null); setShareMsg('') }}
              className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition"
            >
              Record Another
            </button>
          </div>
        </div>
      )}

      {/* ── Timer ───────────────────────────────────────────────────────── */}
      {status !== 'done' && (
        <div className="text-7xl font-mono tracking-wider text-white">
          {mins}:{secs}
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────── */}
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

      {/* ── Controls ────────────────────────────────────────────────────── */}
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

      {/* ── Settings reminder ───────────────────────────────────────────── */}
      {status === 'idle' && (
        <p className="text-gray-600 text-sm text-center max-w-xs">
          Make sure you&apos;ve added your API keys in{' '}
          <a href="/settings" className="text-indigo-400 hover:underline">Settings</a>{' '}
          before recording. You can also set up Telegram and WhatsApp sharing there.
        </p>
      )}
    </div>
  )
}
