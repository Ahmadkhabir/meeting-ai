'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const navItems = [
  { label: 'Dashboard', href: '/', icon: '⊞' },
  { label: 'Record', href: '/recording', icon: '⏺' },
  { label: 'Meetings', href: '/meetings', icon: '📋' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_user');
    router.push('/login');
  };

  const isPublic = ['/login', '/forgot-password'].some(p => pathname === p || pathname.startsWith(p + '/'));
  if (isPublic) return null;

  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, width: 240, height: '100vh',
      background: 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column',
      padding: '24px 0', zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎙️</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>MeetingAI</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>AI-Powered Notes</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <a key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 10, textDecoration: 'none',
              background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: active ? '#fff' : 'rgba(255,255,255,0.5)',
              borderLeft: active ? '2px solid #6366F1' : '2px solid transparent',
              fontSize: 14, fontWeight: active ? 500 : 400,
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* User + logout */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
            </div>
          </div>
        )}
        <button onClick={handleLogout} style={{
          width: '100%', padding: '9px 12px', borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)',
          color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⎋</span> Sign Out
        </button>
      </div>
    </div>
  );
}
