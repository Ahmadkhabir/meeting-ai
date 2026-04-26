'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 min
  const [email, setEmail] = useState('');
  const [devCode, setDevCode] = useState('');
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const pending = localStorage.getItem('pending_verification');
    if (!pending) { router.replace('/login'); return; }
    try {
      const data = JSON.parse(pending);
      setEmail(data.email || '');
      if (data.devCode) setDevCode(data.devCode);
      const remaining = Math.max(0, Math.floor((data.expires - Date.now()) / 1000));
      setTimeLeft(remaining);
    } catch { router.replace('/login'); }
  }, [router]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const handleInput = (i: number, val: string) => {
    const v = val.replace(/[^0-9]/g, '').slice(-1);
    const next = [...code];
    next[i] = v;
    setCode(next);
    setError('');
    if (v && i < 5) refs.current[i + 1]?.focus();
    if (!v && i > 0) refs.current[i - 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    const next = [...code];
    pasted.split('').forEach((c, i) => { if (i < 6) next[i] = c; });
    setCode(next);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const entered = code.join('');
    if (entered.length < 6) { setError('Please enter the 6-digit code'); return; }
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 600));
    try {
      const pending = JSON.parse(localStorage.getItem('pending_verification') || '{}');
      if (Date.now() > pending.expires) { setError('Code expired. Please request a new one.'); setLoading(false); return; }
      
      let attempts = pending.attempts || 0;
      if (attempts >= 3) { setError('Too many attempts. Please request a new code.'); setLoading(false); return; }
      
      if (entered !== pending.code) {
        attempts++;
        localStorage.setItem('pending_verification', JSON.stringify({ ...pending, attempts }));
        setError('Incorrect code. ' + (3 - attempts) + ' attempts remaining.');
        setLoading(false);
        return;
      }
      
      // Success
      const user = { email: pending.email, name: pending.name || pending.email.split('@')[0], provider: 'email', verified: true, loginAt: Date.now() };
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.removeItem('pending_verification');
      router.push('/');
    } catch { setError('Verification failed. Please try again.'); }
    setLoading(false);
  };

  const handleResend = async () => {
    setResending(true);
    const pending = JSON.parse(localStorage.getItem('pending_verification') || '{}');
    try {
      const res = await fetch('/api/send-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: pending.email }) });
      const data = await res.json();
      if (data.success) {
        const updated = { ...pending, code: data.code, expires: data.expires, attempts: 0, devCode: data.devMode ? data.code : undefined };
        localStorage.setItem('pending_verification', JSON.stringify(updated));
        if (data.devMode) setDevCode(data.code);
        setTimeLeft(600);
        setCode(['', '', '', '', '', '']);
        setResent(true);
        setTimeout(() => setResent(false), 3000);
      }
    } catch {}
    setResending(false);
  };

  const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  const allFilled = code.every(c => c !== '');

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0A0F1E', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 420, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 26 }}>🎙️</div>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: 0 }}>MeetingAI</h1>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32, backdropFilter: 'blur(20px)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
            <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 22, margin: '0 0 8px' }}>Check your email</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              We sent a 6-digit code to<br /><strong style={{ color: '#fff' }}>{email}</strong>
            </p>
          </div>

          {devCode && (
            <div style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 4px' }}>⚠️ Dev mode — add RESEND_API_KEY for real emails</p>
              <p style={{ color: '#6366F1', fontSize: 20, fontWeight: 700, letterSpacing: 4, margin: 0 }}>{devCode}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }} onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => { refs.current[i] = el; }}
                type="text" inputMode="numeric" maxLength={1}
                value={digit}
                onChange={e => handleInput(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                style={{
                  width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 700,
                  borderRadius: 12, border: `2px solid ${digit ? '#6366F1' : 'rgba(255,255,255,0.12)'}`,
                  background: digit ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.05)',
                  color: '#fff', outline: 'none', transition: 'all 0.15s',
                }}
              />
            ))}
          </div>

          {error && <p style={{ color: '#F87171', fontSize: 13, textAlign: 'center', margin: '0 0 16px', padding: '8px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: 8 }}>{error}</p>}

          <button onClick={handleVerify} disabled={loading || !allFilled} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: (!allFilled || loading) ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: (!allFilled || loading) ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            {timeLeft > 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '0 0 8px' }}>Code expires in {fmt(timeLeft)}</p>
            ) : (
              <p style={{ color: '#F87171', fontSize: 13, margin: '0 0 8px' }}>Code expired</p>
            )}
            <button onClick={handleResend} disabled={resending || timeLeft > 540} style={{ background: 'none', border: 'none', color: (resending || timeLeft > 540) ? 'rgba(255,255,255,0.25)' : '#6366F1', cursor: (resending || timeLeft > 540) ? 'default' : 'pointer', fontSize: 13 }}>
              {resent ? '✓ New code sent!' : resending ? 'Sending...' : timeLeft > 540 ? 'Resend in ' + fmt(timeLeft - 540) : 'Resend code'}
            </button>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <a href="/login" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontSize: 13 }}>← Back to Sign In</a>
        </div>
      </div>
    </div>
  );
}
