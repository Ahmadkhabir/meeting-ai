import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

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
    const { code, token, email, expires } = await req.json()

    if (!code || !token || !email || !expires) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const expiresNum = Number(expires)

    if (Date.now() > expiresNum) {
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 })
    }

    const expected = signCode(String(code), email, expiresNum)

    let valid = false
    try {
      const expectedBuf = Buffer.from(expected, 'hex')
      const actualBuf = Buffer.from(String(token), 'hex')
      valid =
        expectedBuf.length === actualBuf.length &&
        timingSafeEqual(expectedBuf, actualBuf)
    } catch {
      valid = false
    }

    if (!valid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('verify-code error:', err)
    return NextResponse.json(
      { error: err.message || 'Verification failed' },
      { status: 500 }
    )
  }
}
