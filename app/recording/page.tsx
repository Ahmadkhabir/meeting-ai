'use client'
import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Square, Pause, Play } from 'lucide-react'

export default function Recording() {
  const [status, setStatus] = useState<'idle'|'recording'|'paused'|'processing'>('idle')
  const [time, setTime] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval>|null>(null)
  const mediaRef = useRef<MediaRecorder|null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (status === 'recording') {
      intervalRef.current = setInterval(() => setTime(t => t+1), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [status])

  const fmt = (s:number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio:true})
      const mr = new MediaRecorder(stream)
      mediaRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.start(1000)
      setStatus('recording')
      setTime(0)
    } catch { alert('Microphone access denied') }
  }

  function pause() {
    if (mediaRef.current?.state === 'recording') { mediaRef.current.pause(); setStatus('paused') }
    else if (mediaRef.current?.state === 'paused') { mediaRef.current.resume(); setStatus('recording') }
  }

  async function stop() {
    if (!mediaRef.current) return
    setStatus('processing')
    mediaRef.current.stop()
    mediaRef.current.stream.getTracks().forEach(t=>t.stop())
    setTimeout(() => {
      alert('Recording saved! In production this would transcribe and generate AI summary.')
      setStatus('idle')
      setTime(0)
    }, 2000)
  }

  const bars = Array.from({length:20},(_,i)=>i)

  return (
    <div style={{maxWidth:'800px',margin:'0 auto',textAlign:'center'}}>
      <h1 style={{fontSize:'28px',fontWeight:'700',color:'#F1F5F9',marginBottom:'8px'}}>Record Meeting</h1>
      <p style={{color:'rgba(255,255,255,0.5)',marginBottom:'48px'}}>AI will transcribe and generate insights automatically</p>

      <div style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:'48px'}}>
        {status==='recording' && (
          <>
            {[1,2,3].map(i=>(
              <div key={i} style={{position:'absolute',width:`${120+i*60}px`,height:`${120+i*60}px`,borderRadius:'50%',border:'1px solid rgba(99,102,241,0.3)',animation:`ping ${1+i*0.5}s ease-out infinite`,opacity:0.4}} />
            ))}
          </>
        )}
        <button onClick={status==='idle'?start:stop} style={{width:'120px',height:'120px',borderRadius:'50%',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',background:status==='idle'?'linear-gradient(135deg,#6366F1,#8B5CF6)':status==='processing'?'rgba(99,102,241,0.5)':'linear-gradient(135deg,#EF4444,#DC2626)',boxShadow:status==='recording'?'0 0 40px rgba(99,102,241,0.6)':'none',transition:'all 0.3s',fontSize:'40px',color:'#fff'}}>
          {status==='idle' ? <Mic size={40}/> : status==='processing' ? '...' : <Square size={36}/>}
        </button>
      </div>

      {status!=='idle' && (
        <div style={{marginBottom:'32px'}}>
          <div style={{fontSize:'48px',fontWeight:'700',fontVariantNumeric:'tabular-nums',color:status==='paused'?'#EAB308':'#F1F5F9',marginBottom:'16px'}}>{fmt(time)}</div>
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'center',gap:'3px',height:'40px',marginBottom:'20px'}}>
            {bars.map(i=>(
              <div key={i} style={{width:'4px',borderRadius:'2px',background:status==='recording'?'#6366F1':'rgba(99,102,241,0.3)',height:`${status==='recording'?Math.random()*100:20}%`,transition:'height 0.1s',minHeight:'4px'}} />
            ))}
          </div>
          <button onClick={pause} style={{padding:'10px 24px',borderRadius:'8px',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',color:'#F1F5F9',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'8px',fontSize:'14px'}}>
            {status==='paused'?<><Play size={14}/>Resume</>:<><Pause size={14}/>Pause</>}
          </button>
        </div>
      )}

      <div className="glass" style={{padding:'20px',textAlign:'left'}}>
        <p style={{fontSize:'13px',color:'rgba(255,255,255,0.5)',textAlign:'center'}}>{status==='idle'?'Click the microphone to start recording':status==='recording'?'Recording in progress — AI will process when you stop':status==='paused'?'Recording paused':'Processing your recording...'}</p>
      </div>
    </div>
  )
}
