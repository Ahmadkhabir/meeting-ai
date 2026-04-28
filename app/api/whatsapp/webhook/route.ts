import { NextRequest, NextResponse } from 'next/server'

// GET: Meta webhook verification
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'meetingai_verify'

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

// POST: Receive WhatsApp messages
export async function POST(req: NextRequest) {
  try {
    const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
    const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
    const OPENAI_KEY = process.env.OPENAI_API_KEY
    const GROQ_KEY = process.env.GROQ_API_KEY
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://meeting-ai-lemon.vercel.app'

    const body = await req.json()

    // Extract message from WhatsApp payload
    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages

    if (!messages || messages.length === 0) {
      return NextResponse.json({ status: 'ok' })
    }

    const message = messages[0]
    const from = message.from // sender phone number

    if (!WA_TOKEN || !WA_PHONE_ID || !from) {
      return NextResponse.json({ status: 'ok' })
    }

    // ── Handle text messages ───────────────────────────────────────────────
    if (message.type === 'text') {
      const text = message.text?.body?.toLowerCase() || ''
      if (text.includes('hi') || text.includes('hello') || text.includes('start')) {
        await sendWhatsAppMessage(WA_TOKEN, WA_PHONE_ID, from,
          '👋 Welcome to *Meeting AI*!\n\nSend me a *voice note* or *audio file* and I\'ll transcribe and summarize it for you.'
        )
      } else {
        await sendWhatsAppMessage(WA_TOKEN, WA_PHONE_ID, from,
          '🎙️ Send me a *voice note* or audio file to transcribe and summarize it.'
        )
      }
      return NextResponse.json({ status: 'ok' })
    }

    // ── Handle audio / voice ───────────────────────────────────────────────
    if (message.type !== 'audio' && message.type !== 'voice') {
      return NextResponse.json({ status: 'ok' })
    }

    const mediaId = message.audio?.id || message.voice?.id
    if (!mediaId) return NextResponse.json({ status: 'ok' })

    // Acknowledge
    await sendWhatsAppMessage(WA_TOKEN, WA_PHONE_ID, from,
      '⏳ Processing your audio... This may take a moment.'
    )

    // ── Step 1: Get media URL ──────────────────────────────────────────────
    const mediaUrlRes = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      { headers: { Authorization: `Bearer ${WA_TOKEN}` } }
    )
    const mediaUrlData = await mediaUrlRes.json()

    if (!mediaUrlData.url) {
      await sendWhatsAppMessage(WA_TOKEN, WA_PHONE_ID, from, '❌ Could not access audio file. Please try again.')
      return NextResponse.json({ status: 'ok' })
    }

    // ── Step 2: Download audio ─────────────────────────────────────────────
    const audioRes = await fetch(mediaUrlData.url, {
      headers: { Authorization: `Bearer ${WA_TOKEN}` },
    })
    if (!audioRes.ok) {
      await sendWhatsAppMessage(WA_TOKEN, WA_PHONE_ID, from, '❌ Failed to download audio.')
      return NextResponse.json({ status: 'ok' })
    }

    const audioBuffer = await audioRes.arrayBuffer()
    const mimeType = mediaUrlData.mime_type || 'audio/ogg'
    const ext = mimeType.split('/')[1]?.split(';')[0] || 'ogg'
    const audioBlob = new Blob([audioBuffer], { type: mimeType })

    // ── Step 3: Transcribe ─────────────────────────────────────────────────
    const transcribeKey = OPENAI_KEY || GROQ_KEY
    const transcribeProvider = OPENAI_KEY ? 'openai' : GROQ_KEY ? 'groq' : null

    if (!transcribeKey || !transcribeProvider) {
      await sendWhatsAppMessage(WA_TOKEN, WA_PHONE_ID, from,
        '❌ No AI API key configured on the server. Please contact the app admin.'
      )
      return NextResponse.json({ status: 'ok' })
    }

    const formData = new FormData()
    formData.append('audio', audioBlob, `recording.${ext}`)
    formData.append('provider', transcribeProvider)
    formData.append('apiKey', transcribeKey)

    const transcribeRes = await fetch(`${APP_URL}/api/transcribe`, {
      method: 'POST',
      body: formData,
    })
    const transcribeData = await transcribeRes.json()

    if (!transcribeRes.ok || !transcribeData.text) {
      await sendWhatsAppMessage(WA_TOKEN, WA_PHONE_ID, from, '❌ Transcription failed. Please try again.')
      return NextResponse.json({ status: 'ok' })
    }

    const transcript: string = transcribeData.text

    // ── Step 4: Summarize ──────────────────────────────────────────────────
    let summary = ''
    let actionItems: string[] = []

    try {
      const summaryRes = await fetch(`${APP_URL}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          provider: 'openai',
          apiKey: transcribeKey,
          model: 'gpt-4o-mini',
        }),
      })
      if (summaryRes.ok) {
        const sd = await summaryRes.json()
        summary = sd.summary || ''
        actionItems = sd.actionItems || []
      }
    } catch { /* best effort */ }

    // ── Step 5: Reply ──────────────────────────────────────────────────────
    const lines: string[] = []
    lines.push('✅ *Meeting AI Summary*')
    lines.push('')

    if (summary) {
      lines.push('*Summary*')
      const truncated = summary.length > 1800 ? summary.slice(0, 1800) + '…' : summary
      lines.push(truncated)
    } else {
      lines.push('*Transcript*')
      const truncated = transcript.length > 2000 ? transcript.slice(0, 2000) + '…' : transcript
      lines.push(truncated)
    }

    if (actionItems.length > 0) {
      lines.push('')
      lines.push('*Action Items*')
      actionItems.slice(0, 8).forEach(item => lines.push(`✅ ${item}`))
    }

    await sendWhatsAppMessage(WA_TOKEN, WA_PHONE_ID, from, lines.join('\n'))

    return NextResponse.json({ status: 'ok' })
  } catch (err: any) {
    console.error('whatsapp webhook error:', err)
    return NextResponse.json({ status: 'ok' }) // always 200 to Meta
  }
}

async function sendWhatsAppMessage(
  accessToken: string,
  phoneNumberId: string,
  to: string,
  body: string
) {
  await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    }),
  })
}
