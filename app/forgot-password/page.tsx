'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('auth_user')) {
      router.replace('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { setError('Please enter a valid email address'); return; }
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 1000));
    setSent(true);
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0A0F1E', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 420, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 26 }}>🎙</div>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: 0 }}>MeetingAI</h1>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32, backdropFilter: 'blur(20px)' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>📬</div>
              <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 22, margin: '0 0 12px' }}>Check your email</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                We sent a password reset link to<br />
                <strong style={{ color: '#fff' }}>{email}</strong>
              </p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 16 }}>Didn't receive it? Check your spam folder.</p>
              <button onClick={() => router.push('/login')} style={{ marginTop: 24, padding: '11px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
                ← Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 22, margin: '0 0 8px' }}>Reset your password</h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  type="email" placeholder="Email address" value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }} required
                  style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                />
                {error && <p style={{ color: '#F87171', fontSize: 13, margin: 0, padding: '8px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: 8 }}>{error}</p>}
                <button type="submit" disabled={loading} style={{ padding: '13px 16px', borderRadius: 12, border: 'none', background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <a href="/login" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: 14 }}>← Back to Sign In</a>
              </div>
            </>
          )}
        </div>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 24 }}>By continuing, you agree to our Terms of Service and Privacy Policy</p>
      </div>
    </div>
  );
}
