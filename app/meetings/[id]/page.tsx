'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar, CheckSquare, MessageSquare, FileText } from 'lucide-react'

const meeting = {
  id:'1',title:'Q2 Strategy Review',date:'Apr 25, 2026',duration:'47 min',
  summary:'The team reviewed Q2 performance metrics and established strategic priorities for the next quarter. Key focus areas identified include expanding the enterprise customer base, improving product onboarding flow, and optimizing the sales pipeline.',
  decisions:['Increase enterprise sales budget by 20%','Launch new onboarding flow by May 15','Hire 2 senior engineers Q2'],
  actions:[
    {task:'Prepare revised budget proposal',owner:'Ahmad',due:'Apr 30'},
    {task:'Design new onboarding wireframes',owner:'Design Team',due:'May 5'},
    {task:'Post senior engineer job listings',owner:'HR',due:'Apr 28'},
  ],
  transcript:[
    {speaker:'Ahmad',time:'00:00',text:'Good morning everyone. Let us start with the Q2 performance review.'},
    {speaker:'Sarah',time:'02:15',text:'Revenue is up 18% quarter over quarter. Enterprise accounts grew from 12 to 19.'},
    {speaker:'Ahmad',time:'04:30',text:'Excellent. I would like to propose increasing the enterprise budget by 20%.'},
    {speaker:'Mark',time:'06:45',text:'That makes sense given the ROI we are seeing. I support the proposal.'},
    {speaker:'Sarah',time:'09:00',text:'Agreed. We should also accelerate the onboarding improvements.'},
  ]
}

export default function MeetingDetail() {
  const [tab, setTab] = useState<'summary'|'actions'|'transcript'>('summary')
  const colors = ['#6366F1','#8B5CF6','#06B6D4','#22C55E','#F59E0B']
  
  return (
    <div style={{maxWidth:'900px',margin:'0 auto'}}>
      <Link href="/meetings" style={{display:'inline-flex',alignItems:'center',gap:'8px',color:'rgba(255,255,255,0.5)',textDecoration:'none',fontSize:'13px',marginBottom:'24px'}}>
        <ArrowLeft size={14}/> Back to Meetings
      </Link>
      
      <div style={{marginBottom:'24px'}}>
        <h1 style={{fontSize:'26px',fontWeight:'700',color:'#F1F5F9',marginBottom:'8px'}}>{meeting.title}</h1>
        <div style={{display:'flex',gap:'16px',fontSize:'13px',color:'rgba(255,255,255,0.5)'}}>
          <span style={{display:'flex',alignItems:'center',gap:'4px'}}><Calendar size={13}/>{meeting.date}</span>
          <span style={{display:'flex',alignItems:'center',gap:'4px'}}><Clock size={13}/>{meeting.duration}</span>
        </div>
      </div>

      <div style={{display:'flex',gap:'4px',marginBottom:'24px',background:'rgba(255,255,255,0.04)',padding:'4px',borderRadius:'10px',width:'fit-content'}}>
        {(['summary','actions','transcript'] as const).map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{padding:'8px 20px',borderRadius:'8px',border:'none',cursor:'pointer',fontSize:'13px',fontWeight:'500',background:tab===t?'rgba(99,102,241,0.3)':'transparent',color:tab===t?'#A5B4FC':'rgba(255,255,255,0.5)',transition:'all 0.2s',textTransform:'capitalize'}}>
            {t}
          </button>
        ))}
      </div>

      <div className="glass" style={{padding:'24px'}}>
        {tab==='summary' && (
          <div>
            <p style={{color:'rgba(255,255,255,0.8)',lineHeight:'1.7',marginBottom:'24px'}}>{meeting.summary}</p>
            <h3 style={{fontSize:'14px',fontWeight:'600',color:'#F1F5F9',marginBottom:'12px'}}>Key Decisions</h3>
            {meeting.decisions.map((d,i)=>(
              <div key={i} style={{display:'flex',gap:'10px',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#6366F1',marginTop:'6px',flexShrink:0}} />
                <span style={{color:'rgba(255,255,255,0.7)',fontSize:'14px'}}>{d}</span>
              </div>
            ))}
          </div>
        )}
        {tab==='actions' && (
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {meeting.actions.map((a,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:'16px',padding:'16px',background:'rgba(255,255,255,0.03)',borderRadius:'8px',border:'1px solid rgba(255,255,255,0.06)'}}>
                <CheckSquare size={18} style={{color:'#6366F1',flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:'14px',color:'#F1F5F9',marginBottom:'4px'}}>{a.task}</div>
                  <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)'}}>Owner: {a.owner} · Due: {a.due}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab==='transcript' && (
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            {meeting.transcript.map((t,i)=>(
              <div key={i} style={{display:'flex',gap:'12px'}}>
                <div style={{width:'32px',height:'32px',borderRadius:'50%',background:colors[i%colors.length]+'33',border:`1px solid ${colors[i%colors.length]}66`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'700',color:colors[i%colors.length],flexShrink:0}}>
                  {t.speaker[0]}
                </div>
                <div>
                  <div style={{display:'flex',gap:'8px',alignItems:'center',marginBottom:'4px'}}>
                    <span style={{fontSize:'13px',fontWeight:'600',color:'#F1F5F9'}}>{t.speaker}</span>
                    <span style={{fontSize:'11px',color:'rgba(255,255,255,0.3)'}}>{t.time}</span>
                  </div>
                  <p style={{fontSize:'14px',color:'rgba(255,255,255,0.7)',lineHeight:'1.5'}}>{t.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
