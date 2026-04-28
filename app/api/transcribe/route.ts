import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audio = formData.get('audio') as File | null
    const provider = (formData.get('provider') as string) || 'openai'
    const apiKey = formData.get('apiKey') as string | null

    if (!audio) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }
    if (!apiKey) {
      return NextResponse.json({ error: 'No API key provided' }, { status: 400 })
    }

    const whisperForm = new FormData()
    whisperForm.append('file', audio, 'recording.webm')
    whisperForm.append('model', 'whisper-1')
    whisperForm.append('response_format', 'json')

    const baseUrl =
      provider === 'groq'
        ? 'https://api.groq.com/openai/v1/audio/transcriptions'
        : 'https://api.openai.com/v1/audio/transcriptions'

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: whisperForm,
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Whisper API error:', response.status, errText)
      return NextResponse.json(
        { error: `Transcription service returned ${response.status}` },
        { status: 502 }
      )
    }

    const data = await response.json()
    return NextResponse.json({ text: data.text || '' })
  } catch (e: any) {
    console.error('Transcribe route error:', e)
    return NextResponse.json({ error: e.message || 'Transcription failed' }, { status: 500 })
  }
}
