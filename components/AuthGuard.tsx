'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const PUBLIC_PATHS = ['/login', '/forgot-password', '/verify-email'];
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
    
    try {
      const raw = localStorage.getItem('auth_user');
      if (!raw) {
        if (!isPublic) router.replace('/login');
        return;
      }
      const user = JSON.parse(raw);
      // Check session expiry (24h)
      if (user.loginAt && Date.now() - user.loginAt > SESSION_DURATION) {
        localStorage.removeItem('auth_user');
        if (!isPublic) router.replace('/login');
        return;
      }
      // Redirect logged-in users away from auth pages
      if (isPublic && pathname !== '/verify-email') {
        router.replace('/');
      }
    } catch {
      localStorage.removeItem('auth_user');
      if (!isPublic) router.replace('/login');
    }
  }, [pathname, router]);

  return <>{children}</>;
}
