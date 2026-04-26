'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Mic, FileText, Settings } from 'lucide-react'

const links = [
  {href:'/',icon:LayoutDashboard,label:'Dashboard'},
  {href:'/recording',icon:Mic,label:'Record'},
  {href:'/meetings',icon:FileText,label:'Meetings'},
  {href:'/settings',icon:Settings,label:'Settings'},
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside style={{position:'fixed',top:0,left:0,height:'100vh',width:'240px',background:'rgba(13,21,38,0.95)',borderRight:'1px solid rgba(255,255,255,0.08)',backdropFilter:'blur(20px)',display:'flex',flexDirection:'column',padding:'24px 16px',zIndex:100}}>
      <div style={{marginBottom:'32px',padding:'8px 16px'}}>
        <div style={{fontSize:'20px',fontWeight:'700',background:'linear-gradient(135deg,#6366F1,#8B5CF6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>MeetingAI</div>
        <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginTop:'4px'}}>Smart Intelligence</div>
      </div>
      <nav style={{display:'flex',flexDirection:'column',gap:'4px',flex:1}}>
        {links.map(({href,icon:Icon,label}) => {
          const active = path===href
          return (
            <Link key={href} href={href} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 16px',borderRadius:'8px',textDecoration:'none',color:active?'#fff':'rgba(255,255,255,0.5)',background:active?'rgba(99,102,241,0.2)':'transparent',border:active?'1px solid rgba(99,102,241,0.4)':'1px solid transparent',transition:'all 0.2s',fontSize:'14px',fontWeight:active?'600':'400'}}>
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
