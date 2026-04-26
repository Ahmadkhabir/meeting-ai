'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Mic, Clock, CheckCircle, TrendingUp, BarChart2, Calendar, ArrowRight } from 'lucide-react'

const meetings = [
  {id:'1',title:'Q2 Strategy Review',date:'Apr 25, 2026',duration:'47 min',sentiment:'positive',topics:['Strategy','Budget','Growth']},
  {id:'2',title:'Product Roadmap Sync',date:'Apr 24, 2026',duration:'32 min',sentiment:'neutral',topics:['Product','Timeline','Features']},
  {id:'3',title:'Client Onboarding Call',date:'Apr 23, 2026',duration:'28 min',sentiment:'positive',topics:['Onboarding','Demo','Questions']},
]

const sentimentColor: Record<string,string> = {
  positive:'rgba(34,197,94,0.15)',
  neutral:'rgba(234,179,8,0.15)',
  negative:'rgba(239,68,68,0.15)',
}
const sentimentText: Record<string,string> = {positive:'#22C55E',neutral:'#EAB308',negative:'#EF4444'}

export default function Dashboard() {
  return (
    <div style={{maxWidth:'1200px',margin:'0 auto'}}>
      <div style={{marginBottom:'32px'}}>
        <h1 style={{fontSize:'28px',fontWeight:'700',color:'#F1F5F9',marginBottom:'8px'}}>Dashboard</h1>
        <p style={{color:'rgba(255,255,255,0.5)',fontSize:'14px'}}>Your AI-powered meeting intelligence hub</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'16px',marginBottom:'32px'}}>
        {[
          {icon:Mic,label:'Total Recordings',value:'24',sub:'This month',color:'#6366F1'},
          {icon:Clock,label:'Hours Recorded',value:'18.5h',sub:'This month',color:'#8B5CF6'},
          {icon:CheckCircle,label:'Action Items',value:'47',sub:'Identified',color:'#06B6D4'},
          {icon:TrendingUp,label:'Productivity',value:'+23%',sub:'vs last month',color:'#22C55E'},
        ].map(({icon:Icon,label,value,sub,color}) => (
          <div key={label} className="glass" style={{padding:'20px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
              <span style={{fontSize:'13px',color:'rgba(255,255,255,0.5)'}}>{label}</span>
              <div style={{padding:'8px',borderRadius:'8px',background:`${color}22`}}><Icon size={16} style={{color}} /></div>
            </div>
            <div style={{fontSize:'28px',fontWeight:'700',color:'#F1F5F9'}}>{value}</div>
            <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',marginTop:'4px'}}>{sub}</div>
          </div>
        ))}
      </div>

      <div className="glass" style={{padding:'24px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
          <h2 style={{fontSize:'16px',fontWeight:'600',color:'#F1F5F9'}}>Recent Meetings</h2>
          <Link href="/meetings" style={{display:'flex',alignItems:'center',gap:'6px',color:'#6366F1',textDecoration:'none',fontSize:'13px'}}>
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          {meetings.map(m => (
            <Link key={m.id} href={`/meetings/${m.id}`} style={{display:'flex',alignItems:'center',gap:'16px',padding:'16px',borderRadius:'8px',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',textDecoration:'none',transition:'background 0.2s'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:'14px',fontWeight:'600',color:'#F1F5F9',marginBottom:'4px'}}>{m.title}</div>
                <div style={{display:'flex',alignItems:'center',gap:'12px',fontSize:'12px',color:'rgba(255,255,255,0.4)'}}>
                  <span style={{display:'flex',alignItems:'center',gap:'4px'}}><Calendar size={11} />{m.date}</span>
                  <span style={{display:'flex',alignItems:'center',gap:'4px'}}><Clock size={11} />{m.duration}</span>
                </div>
              </div>
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                {m.topics.map(t => (
                  <span key={t} style={{padding:'2px 8px',borderRadius:'12px',background:'rgba(99,102,241,0.15)',color:'#818CF8',fontSize:'11px'}}>{t}</span>
                ))}
              </div>
              <div style={{padding:'4px 10px',borderRadius:'20px',background:sentimentColor[m.sentiment],color:sentimentText[m.sentiment],fontSize:'11px',fontWeight:'600',textTransform:'capitalize'}}>{m.sentiment}</div>
            </Link>
          ))}
        </div>
      </div>

      <div style={{marginTop:'24px',textAlign:'center'}}>
        <Link href="/recording" style={{display:'inline-flex',alignItems:'center',gap:'10px',padding:'16px 32px',borderRadius:'12px',background:'linear-gradient(135deg,#6366F1,#8B5CF6)',color:'#fff',textDecoration:'none',fontWeight:'600',fontSize:'15px',boxShadow:'0 8px 32px rgba(99,102,241,0.4)'}}>
          <Mic size={20} /> Start New Recording
        </Link>
      </div>
    </div>
  )
}
