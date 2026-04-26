'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const PUBLIC_PATHS = ['/login', '/forgot-password'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const user = localStorage.getItem('auth_user');
    const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));
    if (!user && !isPublic) {
      router.replace('/login');
    }
  }, [pathname, router]);

  return <>{children}</>;
}
