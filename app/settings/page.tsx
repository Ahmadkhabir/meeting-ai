'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AiKeys {
  openai: string
  groq: string
  anthropic: string
}

interface TelegramConfig {
  botToken: string
  chatId: string
  enabled: boolean
}

interface WhatsAppConfig {
  phoneNumberId: string
  accessToken: string
  recipientPhone: string
  enabled: boolean
}

const DEFAULT_AI: AiKeys = { openai: '', groq: '', anthropic: '' }
const DEFAULT_TG: TelegramConfig = { botToken: '', chatId: '', enabled: false }
const DEFAULT_WA: WhatsAppConfig = { phoneNumberId: '', accessToken: '', recipientPhone: '', enabled: false }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {children}
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, type = 'text', hint
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
      />
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-300">{label}</span>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-indigo-600' : 'bg-gray-700'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [ai, setAi] = useState<AiKeys>(DEFAULT_AI)
  const [tg, setTg] = useState<TelegramConfig>(DEFAULT_TG)
  const [wa, setWa] = useState<WhatsAppConfig>(DEFAULT_WA)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState<'telegram' | 'whatsapp' | null>(null)
  const [testMsg, setTestMsg] = useState('')

  useEffect(() => {
    try {
      const a = JSON.parse(localStorage.getItem('ai_keys') || '{}')
      const t = JSON.parse(localStorage.getItem('tg_config') || '{}')
      const w = JSON.parse(localStorage.getItem('wa_config') || '{}')
      setAi({ ...DEFAULT_AI, ...a })
      setTg({ ...DEFAULT_TG, ...t })
      setWa({ ...DEFAULT_WA, ...w })
    } catch { /* ignore */ }
  }, [])

  function save() {
    localStorage.setItem('ai_keys', JSON.stringify(ai))
    localStorage.setItem('tg_config', JSON.stringify(tg))
    localStorage.setItem('wa_config', JSON.stringify(wa))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function testTelegram() {
    if (!tg.botToken || !tg.chatId) { setTestMsg('Enter Bot Token and Chat ID first.'); return }
    setTesting('telegram')
    setTestMsg('')
    try {
      const res = await fetch(`/api/send-to-telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: tg.botToken,
          chatId: tg.chatId,
          title: 'Test from Meeting AI',
          summary: 'This is a test message to confirm your Telegram integration is working.',
          actionItems: ['Setup complete ✓'],
        }),
      })
      const data = await res.json()
      setTestMsg(data.success ? '✓ Test message sent to Telegram!' : `Error: ${data.error}`)
    } catch (e: any) {
      setTestMsg('Network error: ' + e.message)
    }
    setTesting(null)
  }

  async function testWhatsApp() {
    if (!wa.phoneNumberId || !wa.accessToken || !wa.recipientPhone) {
      setTestMsg('Enter Phone Number ID, Access Token, and recipient phone first.')
      return
    }
    setTesting('whatsapp')
    setTestMsg('')
    try {
      const res = await fetch('/api/send-to-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId: wa.phoneNumberId,
          accessToken: wa.accessToken,
          recipientPhone: wa.recipientPhone,
          title: 'Test from Meeting AI',
          summary: 'This is a test message to confirm your WhatsApp integration is working.',
          actionItems: ['Setup complete ✓'],
        }),
      })
      const data = await res.json()
      setTestMsg(data.success ? '✓ Test message sent to WhatsApp!' : `Error: ${data.error}`)
    } catch (e: any) {
      setTestMsg('Network error: ' + e.message)
    }
    setTesting(null)
  }

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white text-sm">← Back</button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        {/* AI Keys */}
        <Section title="🤖 AI Keys">
          <Field
            label="OpenAI API Key"
            value={ai.openai}
            onChange={v => setAi(p => ({ ...p, openai: v }))}
            placeholder="sk-..."
            type="password"
            hint="Used for Whisper transcription and GPT-4o-mini summarization"
          />
          <Field
            label="Groq API Key (optional, faster transcription)"
            value={ai.groq}
            onChange={v => setAi(p => ({ ...p, groq: v }))}
            placeholder="gsk_..."
            type="password"
            hint="Free tier available at console.groq.com"
          />
          <Field
            label="Anthropic API Key (optional, better summaries)"
            value={ai.anthropic}
            onChange={v => setAi(p => ({ ...p, anthropic: v }))}
            placeholder="sk-ant-..."
            type="password"
            hint="Uses Claude Haiku for cost-effective summarization"
          />
        </Section>

        {/* Telegram */}
        <Section title="✈️ Telegram Bot">
          <Toggle
            enabled={tg.enabled}
            onChange={v => setTg(p => ({ ...p, enabled: v }))}
            label="Enable Telegram integration"
          />
          <Field
            label="Bot Token"
            value={tg.botToken}
            onChange={v => setTg(p => ({ ...p, botToken: v }))}
            placeholder="1234567890:ABC..."
            type="password"
            hint="Create a bot at @BotFather on Telegram"
          />
          <Field
            label="Your Chat ID"
            value={tg.chatId}
            onChange={v => setTg(p => ({ ...p, chatId: v }))}
            placeholder="123456789"
            hint="Send /start to @userinfobot on Telegram to get your chat ID"
          />

          {/* Webhook setup */}
          <div className="bg-gray-800/60 rounded-xl p-4 space-y-2 text-xs text-gray-400">
            <p className="font-medium text-gray-300 text-sm">📡 Webhook Setup (to receive audio via Telegram)</p>
            <p>1. Set your webhook by opening this URL in a browser (replace YOUR_BOT_TOKEN):</p>
            <code className="block bg-gray-900 rounded px-3 py-2 text-indigo-300 break-all">
              {`https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=${appUrl}/api/telegram/webhook`}
            </code>
            <p>2. Send any voice message to your bot — Meeting AI will transcribe and summarize it, then reply with the summary.</p>
            <p className="text-yellow-400">⚠️ Requires TELEGRAM_BOT_TOKEN and OPENAI_API_KEY set as Vercel environment variables.</p>
          </div>

          <button
            onClick={testTelegram}
            disabled={testing === 'telegram'}
            className="px-4 py-2 bg-sky-700 hover:bg-sky-600 disabled:opacity-50 text-white text-sm rounded-lg transition"
          >
            {testing === 'telegram' ? 'Sending...' : 'Send Test Message'}
          </button>
          {testMsg && testing !== 'telegram' && (
            <p className={`text-sm ${testMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{testMsg}</p>
          )}
        </Section>

        {/* WhatsApp */}
        <Section title="💬 WhatsApp Business API">
          <Toggle
            enabled={wa.enabled}
            onChange={v => setWa(p => ({ ...p, enabled: v }))}
            label="Enable WhatsApp integration"
          />
          <Field
            label="Phone Number ID"
            value={wa.phoneNumberId}
            onChange={v => setWa(p => ({ ...p, phoneNumberId: v }))}
            placeholder="1234567890123456"
            hint="Found in Meta Developer Console → WhatsApp → API Setup"
          />
          <Field
            label="Access Token (Permanent)"
            value={wa.accessToken}
            onChange={v => setWa(p => ({ ...p, accessToken: v }))}
            placeholder="EAABs..."
            type="password"
            hint="Create a permanent system user token in Meta Business Manager"
          />
          <Field
            label="Your WhatsApp Number (for sending summaries)"
            value={wa.recipientPhone}
            onChange={v => setWa(p => ({ ...p, recipientPhone: v }))}
            placeholder="+966501234567"
            hint="Include country code (e.g. +966 for Saudi Arabia)"
          />

          {/* Webhook setup */}
          <div className="bg-gray-800/60 rounded-xl p-4 space-y-2 text-xs text-gray-400">
            <p className="font-medium text-gray-300 text-sm">📡 Webhook Setup (to receive audio via WhatsApp)</p>
            <p>1. Go to Meta Developers → WhatsApp → Configuration → Webhooks</p>
            <p>2. Callback URL:</p>
            <code className="block bg-gray-900 rounded px-3 py-2 text-indigo-300 break-all">
              {`${appUrl}/api/whatsapp/webhook`}
            </code>
            <p>3. Verify token: set any string in Vercel as <code className="text-indigo-300">WHATSAPP_VERIFY_TOKEN</code></p>
            <p>4. Subscribe to: <strong className="text-gray-300">messages</strong></p>
            <p className="text-yellow-400">⚠️ Requires WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN, and OPENAI_API_KEY as Vercel env vars.</p>
          </div>

          <button
            onClick={testWhatsApp}
            disabled={testing === 'whatsapp'}
            className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm rounded-lg transition"
          >
            {testing === 'whatsapp' ? 'Sending...' : 'Send Test Message'}
          </button>
          {testMsg && testing !== 'whatsapp' && (
            <p className={`text-sm ${testMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{testMsg}</p>
          )}
        </Section>

        {/* Save button */}
        <button
          onClick={save}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold text-white transition"
        >
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
