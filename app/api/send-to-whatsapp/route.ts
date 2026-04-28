import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { phoneNumberId, accessToken, recipientPhone, title, summary, actionItems } = await req.json()

    if (!phoneNumberId || !accessToken || !recipientPhone) {
      return NextResponse.json(
        { success: false, error: 'Missing phoneNumberId, accessToken, or recipientPhone' },
        { status: 400 }
      )
    }

    // Normalize phone: strip spaces/dashes, ensure no leading +
    const phone = recipientPhone.replace(/[\s\-()]/g, '').replace(/^\+/, '')

    // Build message text
    const lines: string[] = []
    lines.push(`📋 *${title || 'Meeting Summary'}*`)
    lines.push('')

    if (summary) {
      lines.push('*Summary*')
      const truncated = summary.length > 1800 ? summary.slice(0, 1800) + '…' : summary
      lines.push(truncated)
    }

    if (Array.isArray(actionItems) && actionItems.length > 0) {
      lines.push('')
      lines.push('*Action Items*')
      actionItems.slice(0, 10).forEach((item: string) => {
        lines.push(`✅ ${item}`)
      })
    }

    lines.push('')
    lines.push(`_Sent from Meeting AI · ${new Date().toLocaleDateString()}_`)

    const messageText = lines.join('\n')

    const waRes = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: messageText },
        }),
      }
    )

    const waData = await waRes.json()

    if (!waRes.ok || waData.error) {
      const errMsg = waData.error?.message || 'WhatsApp API error'
      return NextResponse.json({ success: false, error: errMsg }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      messageId: waData.messages?.[0]?.id,
    })
  } catch (err: any) {
    console.error('send-to-whatsapp error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
