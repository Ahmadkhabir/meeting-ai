import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function signCode(code: string, email: string, expires: number): string {
  const secret =
    process.env.NEXTAUTH_SECRET ||
    process.env.OTP_SECRET ||
    'meeting-ai-otp-fallback-secret'
  return createHmac('sha256', secret)
    .update(`${code}:${email.toLowerCase()}:${expires}`)
    .digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const code = generateCode()
    const expires = Date.now() + 10 * 60 * 1000 // 10 minutes
    const token = signCode(code, email, expires)

    // Dev mode: no Resend key configured — return code directly for testing
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ success: true, code, expires, token, devMode: true })
    }

    // Production mode: send email via Resend
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const { error: resendError } = await resend.emails.send({
      from: 'MeetingAI <onboarding@resend.dev>',
      to: email,
      subject: 'Your MeetingAI verification code',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    max-width: 480px; margin: 0 auto; padding: 32px; background: #0f172a;
                    color: #e2e8f0; border-radius: 12px;">
          <h2 style="margin: 0 0 8px; font-size: 24px; color: #f8fafc;">
            Welcome to MeetingAI${name ? `, ${name}` : ''}!
          </h2>
          <p style="color: #94a3b8; margin: 0 0 24px;">
            Use the code below to verify your email address. It expires in 10 minutes.
          </p>
          <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px;
                      padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px; font-weight: 700; letter-spacing: 12px;
                         color: #6366f1; font-family: monospace;">
              ${code}
            </span>
          </div>
          <p style="color: #64748b; font-size: 13px; margin: 0;">
            If you didn't create a MeetingAI account, you can safely ignore this email.
          </p>
        </div>
      `,
    })

    if (resendError) {
      console.error('Resend error:', resendError)
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      )
    }

    // Production: return token but NOT the code — server verifies via /api/verify-code
    return NextResponse.json({ success: true, expires, token, devMode: false })
  } catch (err: any) {
    console.error('send-verification error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
