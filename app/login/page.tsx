'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Password strength checker
function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Weak', color: '#F87171' };
  if (score <= 2) return { score, label: 'Fair', color: '#FBBF24' };
  if (score <= 3) return { score, label: 'Good', color: '#34D399' };
  return { score, label: 'Strong', color: '#6366F1' };
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 min
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockoutUntil, setLockoutUntil] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('auth_user')) {
      try {
        const user = JSON.parse(localStorage.getItem('auth_user')!);
        if (user.loginAt && Date.now() - user.loginAt < SESSION_DURATION) {
          router.replace('/'); return;
        }
        localStorage.removeItem('auth_user');
      } catch { localStorage.removeItem('auth_user'); }
    }
    // Load lockout state
    const lockData = localStorage.getItem('login_lockout');
    if (lockData) {
      try {
        const { until, attempts } = JSON.parse(lockData);
        if (Date.now() < until) {
          setLockoutUntil(until);
          setAttemptsLeft(0);
        } else {
          localStorage.removeItem('login_lockout');
          setAttemptsLeft(MAX_ATTEMPTS - (attempts || 0));
        }
      } catch {}
    }
  }, [router]);

  useEffect(() => {
    if (!lockoutUntil) return;
    const t = setInterval(() => {
      const left = Math.max(0, lockoutUntil - Date.now());
      if (left === 0) {
        setLockoutUntil(0);
        setAttemptsLeft(MAX_ATTEMPTS);
        localStorage.removeItem('login_lockout');
        clearInterval(t);
        setTimeLeft('');
      } else {
        const m = Math.floor(left / 60000);
        const s = Math.floor((left % 60000) / 1000);
        setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [lockoutUntil]);

  const recordFailedAttempt = () => {
    const lockData = localStorage.getItem('login_lockout');
    let attempts = 1;
    try { attempts = (JSON.parse(lockData || '{}').attempts || 0) + 1; } catch {}
    const remaining = MAX_ATTEMPTS - attempts;
    if (remaining <= 0) {
      const until = Date.now() + LOCKOUT_DURATION;
      localStorage.setItem('login_lockout', JSON.stringify({ until, attempts }));
      setLockoutUntil(until);
      setAttemptsLeft(0);
    } else {
      localStorage.setItem('login_lockout', JSON.stringify({ until: 0, attempts }));
      setAttemptsLeft(remaining);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutUntil && Date.now() < lockoutUntil) return;
    setLoading(true); setError('');
    await new Promise(r => setTimeout(r, 700));
    const stored = localStorage.getItem('registered_' + email);
    if (!stored) {
      recordFailedAttempt();
      setError('No account found with this email. Please sign up.');
      setLoading(false); return;
    }
    try {
      const reg = JSON.parse(stored);
      if (reg.password !== btoa(password)) {
        recordFailedAttempt();
        const left = attemptsLeft - 1;
        setError('Incorrect password.' + (left > 0 ? ` ${left} attempt${left !== 1 ? 's' : ''} remaining.` : ''));
        setLoading(false); return;
      }
      localStorage.removeItem('login_lockout');
      localStorage.setItem('auth_user', JSON.stringify({ email, name: reg.name, provider: 'email', verified: true, loginAt: Date.now() }));
      router.push('/');
    } catch { setError('Sign in failed. Please try again.'); }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const strength = getStrength(password);
    if (strength.score < 2) { setError('Please use a stronger password (min 8 chars, mix of letters and numbers).'); setLoading(false); return; }
    await new Promise(r => setTimeout(r, 600));
    try {
      const res = await fetch('/api/send-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'Failed to send verification email.'); setLoading(false); return; }
      // Store registration data temporarily
      localStorage.setItem('pending_verification', JSON.stringify({
          email,
          name,
          token: data.token,
          expires: data.expires,
          attempts: 0,
          devMode: data.devMode,
          devCode: data.devMode ? data.code : undefined,
        }));
      localStorage.setItem('registered_' + email, JSON.stringify({ email, name, password: btoa(password), registeredAt: Date.now() }));
      router.push('/verify-email');
    } catch { setError('Sign up failed. Please try again.'); }
    setLoading(false);
  };

  const handleSocial = async (provider: 'google' | 'apple') => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    localStorage.setItem('auth_user', JSON.stringify({ email: 'user@' + provider + '.com', name: provider === 'google' ? 'Google User' : 'Apple User', provider, verified: true, loginAt: Date.now() }));
    router.push('/');
    setLoading(false);
  };

  const pw = getStrength(password);
  const inp: React.CSSProperties = { padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0A0F1E', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 420, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 26 }}>🎙️</div>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: 0 }}>MeetingAI</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 8, fontSize: 15 }}>Record · Transcribe · Summarize</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32, backdropFilter: 'blur(20px)' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {(['signin', 'signup'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, background: tab === t ? 'rgba(99,102,241,0.35)' : 'transparent', color: tab === t ? '#fff' : 'rgba(255,255,255,0.45)' }}>
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {lockoutUntil > 0 && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, textAlign: 'center' }}>
              <p style={{ color: '#F87171', fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>🔒 Account temporarily locked</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>Too many failed attempts. Try again in {timeLeft}</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <button onClick={() => handleSocial('google')} disabled={loading || lockoutUntil > 0} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', width: '100%', opacity: lockoutUntil > 0 ? 0.4 : 1 }}>
              <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
              Continue with Google
            </button>
            <button onClick={() => handleSocial('apple')} disabled={loading || lockoutUntil > 0} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', width: '100%', opacity: lockoutUntil > 0 ? 0.4 : 1 }}>
              <svg width="18" height="18" viewBox="0 0 814 1000" fill="white"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.8 135.4-317.9 268.2-317.9 69.8 0 127.6 45.7 170.2 45.7 40.3 0 103-48.5 180.8-48.5 23.3 0 106.1 2.6 168.4 98.8zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/></svg>
              Continue with Apple
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>or continue with email</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <form onSubmit={tab === 'signin' ? handleSignIn : handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tab === 'signup' && <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required style={inp} />}
            <input type="email" placeholder="Email address" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} required style={inp} />
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} required style={{ ...inp, paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16 }}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>

            {tab === 'signup' && password.length > 0 && (
              <div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= pw.score ? pw.color : 'rgba(255,255,255,0.1)', transition: 'background 0.2s' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: pw.color, fontSize: 12 }}>{pw.label}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Min 8 chars · uppercase · number</span>
                </div>
              </div>
            )}

            {error && <p style={{ color: '#F87171', fontSize: 13, margin: 0, padding: '8px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: 8 }}>{error}</p>}

            {tab === 'signin' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {attemptsLeft < MAX_ATTEMPTS && attemptsLeft > 0 && <span style={{ color: '#FBBF24', fontSize: 12 }}>{attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} left</span>}
                <div style={{ marginLeft: 'auto' }}><a href="/forgot-password" style={{ color: '#6366F1', fontSize: 13, textDecoration: 'none' }}>Forgot password?</a></div>
              </div>
            )}

            <button type="submit" disabled={loading || (lockoutUntil > 0 && tab === 'signin')} style={{ padding: '13px', borderRadius: 12, border: 'none', background: (loading || (lockoutUntil > 0 && tab === 'signin')) ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
              {loading ? (tab === 'signup' ? 'Sending code...' : 'Signing in...') : tab === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 24 }}>By continuing, you agree to our Terms of Service and Privacy Policy</p>
      </div>
    </div>
  );
}
