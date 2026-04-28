import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { transcript, provider, apiKey, model } = await req.json()

    if (!transcript) {
      return NextResponse.json({ error: 'No transcript provided' }, { status: 400 })
    }
    if (!apiKey) {
      return NextResponse.json({ error: 'No API key provided' }, { status: 400 })
    }

    const prompt = `You are a meeting assistant. Analyze this meeting transcript and respond with a JSON object containing:
- "summary": A concise 2-3 sentence overview of what was discussed
- "actionItems": An array of specific action items or follow-ups (empty array if none)

Respond ONLY with valid JSON, no markdown or extra text.

Transcript:
${transcript.slice(0, 8000)}`

    let rawText = ''

    if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'claude-3-haiku-20240307',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const d = await res.json()
      rawText = d.content?.[0]?.text || ''
    } else {
      // OpenAI
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      })
      const d = await res.json()
      rawText = d.choices?.[0]?.message?.content || ''
    }

    try {
      const parsed = JSON.parse(rawText)
      return NextResponse.json({
        summary: parsed.summary || '',
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      })
    } catch {
      // If not valid JSON, return text as summary
      return NextResponse.json({ summary: rawText, actionItems: [] })
    }
  } catch (e: any) {
    console.error('Summarize route error:', e)
    return NextResponse.json({ error: e.message || 'Summary failed' }, { status: 500 })
  }
}
