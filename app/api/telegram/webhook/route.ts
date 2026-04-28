import { NextRequest, NextResponse } from 'next/server'

// Telegram sends POST updates to this endpoint
export async function POST(req: NextRequest) {
  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const OPENAI_KEY = process.env.OPENAI_API_KEY
    const GROQ_KEY = process.env.GROQ_API_KEY

    if (!BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN env var not set')
      return NextResponse.json({ ok: true }) // always 200 to Telegram
    }

    const update = await req.json()
    const message = update?.message

    if (!message) return NextResponse.json({ ok: true })

    const chatId = message.chat?.id
    if (!chatId) return NextResponse.json({ ok: true })

    // ── Handle /start command ──────────────────────────────────────────────
    if (message.text === '/start') {
      await sendTelegramMessage(BOT_TOKEN, chatId,
        '👋 *Welcome to Meeting AI!*\n\nSend me a *voice message* or *audio file* and I\'ll transcribe and summarize it for you.\n\nYou can also forward voice notes from other chats.',
        'MarkdownV2'
      )
      return NextResponse.json({ ok: true })
    }

    // ── Handle voice / audio messages ─────────────────────────────────────
    const fileId = message.voice?.file_id || message.audio?.file_id

    if (!fileId) {
      // Not an audio message — ignore silently or reply with hint
      if (message.text && !message.text.startsWith('/')) {
        await sendTelegramMessage(BOT_TOKEN, chatId,
          '🎙️ Send me a *voice message* or audio file to transcribe and summarize it\\.',
          'MarkdownV2'
        )
      }
      return NextResponse.json({ ok: true })
    }

    // Acknowledge receipt
    await sendTelegramMessage(BOT_TOKEN, chatId,
      '⏳ Processing your audio\\.\\.\\. This may take a moment\\.',
      'MarkdownV2'
    )

    // ── Step 1: Get file path from Telegram ───────────────────────────────
    const fileRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
    )
    const fileData = await fileRes.json()

    if (!fileData.ok || !fileData.result?.file_path) {
      await sendTelegramMessage(BOT_TOKEN, chatId,
        '❌ Could not download the audio file\\. Please try again\\.',
        'MarkdownV2'
      )
      return NextResponse.json({ ok: true })
    }

    const filePath = fileData.result.file_path
    const audioUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`

    // ── Step 2: Download audio ────────────────────────────────────────────
    const audioRes = await fetch(audioUrl)
    if (!audioRes.ok) {
      await sendTelegramMessage(BOT_TOKEN, chatId, '❌ Failed to download audio\\.', 'MarkdownV2')
      return NextResponse.json({ ok: true })
    }

    const audioBuffer = await audioRes.arrayBuffer()
    const ext = filePath.split('.').pop() || 'oga'
    const audioBlob = new Blob([audioBuffer], { type: `audio/${ext}` })

    // ── Step 3: Transcribe ─────────────────────────────────────────────────
    const transcribeKey = OPENAI_KEY || GROQ_KEY
    const transcribeProvider = OPENAI_KEY ? 'openai' : GROQ_KEY ? 'groq' : null

    if (!transcribeKey || !transcribeProvider) {
      await sendTelegramMessage(BOT_TOKEN, chatId,
        '❌ No AI API key configured\\. Please set OPENAI\\_API\\_KEY or GROQ\\_API\\_KEY in Vercel environment variables\\.',
        'MarkdownV2'
      )
      return NextResponse.json({ ok: true })
    }

    const formData = new FormData()
    formData.append('audio', audioBlob, `recording.${ext}`)
    formData.append('provider', transcribeProvider)
    formData.append('apiKey', transcribeKey)

    const transcribeRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://meeting-ai-lemon.vercel.app'}/api/transcribe`,
      { method: 'POST', body: formData }
    )
    const transcribeData = await transcribeRes.json()

    if (!transcribeRes.ok || !transcribeData.text) {
      await sendTelegramMessage(BOT_TOKEN, chatId, '❌ Transcription failed\\. Please try again\\.', 'MarkdownV2')
      return NextResponse.json({ ok: true })
    }

    const transcript: string = transcribeData.text

    // ── Step 4: Summarize ──────────────────────────────────────────────────
    let summary = ''
    let actionItems: string[] = []

    try {
      const summaryRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://meeting-ai-lemon.vercel.app'}/api/summarize`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript,
            provider: 'openai',
            apiKey: OPENAI_KEY || GROQ_KEY,
            model: 'gpt-4o-mini',
          }),
        }
      )
      if (summaryRes.ok) {
        const sd = await summaryRes.json()
        summary = sd.summary || ''
        actionItems = sd.actionItems || []
      }
    } catch { /* best effort */ }

    // ── Step 5: Reply with results ─────────────────────────────────────────
    const lines: string[] = []
    lines.push('✅ *Meeting AI Summary*')
    lines.push('')

    if (summary) {
      lines.push('*Summary*')
      const truncated = summary.length > 1500 ? summary.slice(0, 1500) + '…' : summary
      lines.push(escapeMarkdown(truncated))
    } else {
      lines.push('*Transcript*')
      const truncated = transcript.length > 2000 ? transcript.slice(0, 2000) + '…' : transcript
      lines.push(escapeMarkdown(truncated))
    }

    if (actionItems.length > 0) {
      lines.push('')
      lines.push('*Action Items*')
      actionItems.slice(0, 8).forEach(item => {
        lines.push(`✅ ${escapeMarkdown(item)}`)
      })
    }

    await sendTelegramMessage(BOT_TOKEN, chatId, lines.join('\n'), 'MarkdownV2')

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('telegram webhook error:', err)
    return NextResponse.json({ ok: true }) // always 200 to Telegram
  }
}

async function sendTelegramMessage(
  botToken: string,
  chatId: number | string,
  text: string,
  parseMode?: string
) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      ...(parseMode ? { parse_mode: parseMode } : {}),
    }),
  })
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&')
}
