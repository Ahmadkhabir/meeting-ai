import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audio = formData.get('audio') as Blob
    const provider = formData.get('provider') as string || 'openai'
    const apiKey = formData.get('apiKey') as string

    if (!audio) return NextResponse.json({ error: 'No audio' }, { status: 400 })

    let transcript = ''

    if ((provider === 'openai' || provider === 'groq') && apiKey) {
      const fd = new FormData()
      fd.append('file', audio, 'audio.webm')
      fd.append('model', 'whisper-1')
      const baseUrl = provider === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1'
      const r = await fetch(`${baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: fd
      })
      const d = await r.json()
      transcript = d.text || ''
    } else {
      transcript = 'Transcription requires an OpenAI or Groq API key. Please configure one in Settings.'
    }

    return NextResponse.json({ transcript })
  } catch (e) {
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
