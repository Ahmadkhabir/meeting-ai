import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { botToken, chatId, title, summary, actionItems } = await req.json()

    if (!botToken || !chatId) {
      return NextResponse.json({ success: false, error: 'Missing botToken or chatId' }, { status: 400 })
    }

    // Build a nicely formatted Telegram message (Markdown V2)
    const lines: string[] = []
    lines.push(`📋 *${escapeMarkdown(title || 'Meeting Summary')}*`)
    lines.push('')

    if (summary) {
      lines.push('*Summary*')
      // Telegram messages max 4096 chars — truncate if needed
      const truncated = summary.length > 1500 ? summary.slice(0, 1500) + '…' : summary
      lines.push(escapeMarkdown(truncated))
    }

    if (Array.isArray(actionItems) && actionItems.length > 0) {
      lines.push('')
      lines.push('*Action Items*')
      actionItems.slice(0, 10).forEach((item: string) => {
        lines.push(`✅ ${escapeMarkdown(item)}`)
      })
    }

    lines.push('')
    lines.push(`_Sent from Meeting AI · ${new Date().toLocaleDateString()}_`)

    const text = lines.join('\n')

    const tgRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'MarkdownV2',
        }),
      }
    )

    const tgData = await tgRes.json()

    if (!tgData.ok) {
      return NextResponse.json(
        { success: false, error: tgData.description || 'Telegram API error' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, messageId: tgData.result?.message_id })
  } catch (err: any) {
    console.error('send-to-telegram error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

// Escape special chars for Telegram MarkdownV2
function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&')
}
