import './globals.css';
import Sidebar from '@/components/Sidebar';
import AuthGuard from '@/components/AuthGuard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MeetingAI',
  description: 'AI-powered meeting recorder and summarizer',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0A0F1E', minHeight: '100vh', color: '#fff' }}>
        <AuthGuard>
          <Sidebar />
          <main style={{ marginLeft: 240, minHeight: '100vh', padding: '32px' }}>
            {children}
          </main>
        </AuthGuard>
      </body>
    </html>
  );
}
