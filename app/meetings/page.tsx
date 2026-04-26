'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, Clock, Calendar, Filter } from 'lucide-react'

const meetings = [
  {id:'1',title:'Q2 Strategy Review',date:'Apr 25, 2026',duration:'47 min',topics:['Strategy','Budget'],sentiment:'positive'},
  {id:'2',title:'Product Roadmap Sync',date:'Apr 24, 2026',duration:'32 min',topics:['Product','Timeline'],sentiment:'neutral'},
  {id:'3',title:'Client Onboarding Call',date:'Apr 23, 2026',duration:'28 min',topics:['Onboarding','Demo'],sentiment:'positive'},
  {id:'4',title:'Engineering Sprint Review',date:'Apr 22, 2026',duration:'55 min',topics:['Engineering','Sprint'],sentiment:'neutral'},
  {id:'5',title:'Sales Pipeline Review',date:'Apr 21, 2026',duration:'38 min',topics:['Sales','Pipeline'],sentiment:'positive'},
]

const sColor: Record<string,string> = {positive:'#22C55E',neutral:'#EAB308',negative:'#EF4444'}

export default function Meetings() {
  const [q, setQ] = useState('')
  const filtered = meetings.filter(m => m.title.toLowerCase().includes(q.toLowerCase()))
  return (
    <div style={{maxWidth:'900px',margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'32px'}}>
        <div>
          <h1 style={{fontSize:'28px',fontWeight:'700',color:'#F1F5F9',marginBottom:'4px'}}>Meetings</h1>
          <p style={{color:'rgba(255,255,255,0.5)',fontSize:'14px'}}>{meetings.length} recordings total</p>
        </div>
      </div>

      <div style={{position:'relative',marginBottom:'24px'}}>
        <Search size={16} style={{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.3)'}} />
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search meetings..." style={{width:'100%',padding:'12px 14px 12px 42px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'10px',color:'#F1F5F9',fontSize:'14px',outline:'none'}} />
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
        {filtered.map(m => (
          <Link key={m.id} href={`/meetings/${m.id}`} style={{display:'flex',alignItems:'center',gap:'16px',padding:'20px',borderRadius:'12px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',textDecoration:'none',transition:'background 0.2s'}}>
            <div style={{flex:1}}>
              <div style={{fontSize:'15px',fontWeight:'600',color:'#F1F5F9',marginBottom:'6px'}}>{m.title}</div>
              <div style={{display:'flex',alignItems:'center',gap:'16px',fontSize:'12px',color:'rgba(255,255,255,0.4)'}}>
                <span style={{display:'flex',alignItems:'center',gap:'4px'}}><Calendar size={11}/>{m.date}</span>
                <span style={{display:'flex',alignItems:'center',gap:'4px'}}><Clock size={11}/>{m.duration}</span>
              </div>
            </div>
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
              {m.topics.map(t=>(
                <span key={t} style={{padding:'3px 10px',borderRadius:'12px',background:'rgba(99,102,241,0.15)',color:'#818CF8',fontSize:'11px'}}>{t}</span>
              ))}
            </div>
            <div style={{width:'8px',height:'8px',borderRadius:'50%',background:sColor[m.sentiment]}} />
          </Link>
        ))}
      </div>
    </div>
  )
}
