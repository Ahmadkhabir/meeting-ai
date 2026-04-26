import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'

export const metadata: Metadata = {
  title: 'MeetingAI - Smart Meeting Intelligence',
  description: 'AI-powered meeting recording, transcription and insights',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{background:'#0A0F1E', minHeight:'100vh', display:'flex'}}>
        <Sidebar />
        <main style={{flex:1, marginLeft:'240px', minHeight:'100vh', padding:'32px'}}>
          {children}
        </main>
      </body>
    </html>
  )
}
