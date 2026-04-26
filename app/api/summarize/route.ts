import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { transcript, provider = 'anthropic', apiKey, model } = await req.json()
    if (!transcript) return NextResponse.json({ error: 'No transcript' }, { status: 400 })

    const prompt = `Analyze this meeting transcript and provide:
1. Executive Summary (2-3 sentences)
2. Key Decisions (bullet list)
3. Action Items (with owner and deadline if mentioned)
4. Main Topics Discussed
5. Overall Sentiment (positive/neutral/negative)

Transcript:
${transcript}

Respond in JSON format: { summary, decisions: [], actions: [], topics: [], sentiment }`

    let result
    if (provider === 'anthropic' && apiKey) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: model||'claude-3-5-sonnet-20241022', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] })
      })
      const d = await r.json()
      result = JSON.parse(d.content[0].text)
    } else if (provider === 'openai' && apiKey) {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model||'gpt-4o', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' } })
      })
      const d = await r.json()
      result = JSON.parse(d.choices[0].message.content)
    } else {
      result = {
        summary: 'AI summary requires a configured API key. Please add your API key in Settings.',
        decisions: ['Configure API key in Settings to enable AI summaries'],
        actions: [{ task: 'Add API key in Settings', owner: 'User', due: 'Now' }],
        topics: ['Setup Required'],
        sentiment: 'neutral'
      }
    }
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to summarize' }, { status: 500 })
  }
}
