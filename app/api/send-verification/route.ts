import { NextRequest, NextResponse } from 'next/server';

// Rate limit store (in-memory, resets on cold start)
const rateLimit = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
  }

  const { email } = await req.json();
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

  const resendKey = process.env.RESEND_API_KEY;
  const hasResend = resendKey && resendKey.length > 10;

  if (hasResend) {
    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'MeetingAI <noreply@resend.dev>',
          to: email,
          subject: 'Your MeetingAI verification code',
          html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0A0F1E;font-family:system-ui,sans-serif">
  <div style="max-width:480px;margin:40px auto;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:40px">
    <div style="text-align:center;margin-bottom:32px">
      <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#6366F1,#8B5CF6);margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:26px">🎙️</div>
      <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0">MeetingAI</h1>
    </div>
    <h2 style="color:#fff;font-size:20px;font-weight:600;margin:0 0 12px">Verify your email address</h2>
    <p style="color:rgba(255,255,255,0.55);font-size:14px;line-height:1.6;margin:0 0 28px">Use the code below to complete your sign-up. It expires in 10 minutes.</p>
    <div style="background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);border-radius:12px;padding:20px;text-align:center;margin-bottom:28px">
      <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">Verification Code</p>
      <p style="color:#fff;font-size:40px;font-weight:800;letter-spacing:10px;margin:0">${code}</p>
    </div>
    <p style="color:rgba(255,255,255,0.35);font-size:13px;margin:0">If you didn't request this, you can safely ignore this email.</p>
  </div>
</body>
</html>`
        })
      });

      if (!emailRes.ok) {
        const err = await emailRes.text();
        console.error('Resend error:', err);
        return NextResponse.json({ error: 'Failed to send email. Check RESEND_API_KEY.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, expires, devMode: false });
    } catch (err) {
      console.error('Email send error:', err);
      return NextResponse.json({ error: 'Email service error.' }, { status: 500 });
    }
  }

  // Dev mode: return code directly (no real email sent)
  return NextResponse.json({ success: true, code, expires, devMode: true });
}
