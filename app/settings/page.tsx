'use client'
import { useState, useEffect } from 'react'
import { Save, Key, Cpu, CheckCircle } from 'lucide-react'

const providers = [
  {id:'anthropic',name:'Anthropic',models:['claude-3-5-sonnet-20241022','claude-3-haiku-20240307'],color:'#D4A017'},
  {id:'openai',name:'OpenAI',models:['gpt-4o','gpt-4o-mini','gpt-4-turbo'],color:'#10A37F'},
  {id:'gemini',name:'Google Gemini',models:['gemini-1.5-pro','gemini-1.5-flash'],color:'#4285F4'},
  {id:'mistral',name:'Mistral AI',models:['mistral-large','mistral-medium'],color:'#FF6B35'},
  {id:'groq',name:'Groq',models:['llama-3.1-70b-versatile','mixtral-8x7b-32768'],color:'#F04438'},
  {id:'ollama',name:'Ollama (Local)',models:['llama3.2','mistral','phi3'],color:'#6366F1'},
]

export default function Settings() {
  const [keys, setKeys] = useState<Record<string,string>>({})
  const [models, setModels] = useState<Record<string,string>>({})
  const [active, setActive] = useState('anthropic')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const k = localStorage.getItem('ai_keys'); if(k) setKeys(JSON.parse(k))
      const m = localStorage.getItem('ai_models'); if(m) setModels(JSON.parse(m))
    } catch {}
  }, [])

  function save() {
    localStorage.setItem('ai_keys', JSON.stringify(keys))
    localStorage.setItem('ai_models', JSON.stringify(models))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{maxWidth:'800px',margin:'0 auto'}}>
      <div style={{marginBottom:'32px'}}>
        <h1 style={{fontSize:'28px',fontWeight:'700',color:'#F1F5F9',marginBottom:'8px'}}>Settings</h1>
        <p style={{color:'rgba(255,255,255,0.5)',fontSize:'14px'}}>Configure AI providers and API keys</p>
      </div>

      <div style={{display:'flex',gap:'8px',marginBottom:'24px',flexWrap:'wrap'}}>
        {providers.map(p => (
          <button key={p.id} onClick={()=>setActive(p.id)} style={{padding:'8px 16px',borderRadius:'8px',border:`1px solid ${active===p.id?p.color+'66':'rgba(255,255,255,0.1)'}`,background:active===p.id?`${p.color}15`:'rgba(255,255,255,0.03)',color:active===p.id?p.color:'rgba(255,255,255,0.5)',cursor:'pointer',fontSize:'13px',fontWeight:'500',transition:'all 0.2s'}}>
            {p.name}
          </button>
        ))}
      </div>

      {providers.filter(p=>p.id===active).map(p => (
        <div key={p.id} className="glass" style={{padding:'24px',marginBottom:'16px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px'}}>
            <div style={{width:'40px',height:'40px',borderRadius:'10px',background:`${p.color}22`,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Cpu size={20} style={{color:p.color}}/>
            </div>
            <div>
              <div style={{fontSize:'16px',fontWeight:'600',color:'#F1F5F9'}}>{p.name}</div>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)'}}>AI Language Model</div>
            </div>
          </div>

          <div style={{marginBottom:'16px'}}>
            <label style={{fontSize:'13px',color:'rgba(255,255,255,0.6)',display:'block',marginBottom:'6px'}}>
              {p.id==='ollama'?'Base URL':'API Key'}
            </label>
            <div style={{position:'relative'}}>
              <Key size={14} style={{position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'rgba(255,255,255,0.3)'}}/>
              <input type="password" value={keys[p.id]||''} onChange={e=>setKeys({...keys,[p.id]:e.target.value})} placeholder={p.id==='ollama'?'http://localhost:11434':`Enter ${p.name} API key...`} style={{width:'100%',padding:'10px 12px 10px 36px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',color:'#F1F5F9',fontSize:'13px',outline:'none'}}/>
            </div>
          </div>

          <div>
            <label style={{fontSize:'13px',color:'rgba(255,255,255,0.6)',display:'block',marginBottom:'6px'}}>Model</label>
            <select value={models[p.id]||p.models[0]} onChange={e=>setModels({...models,[p.id]:e.target.value})} style={{width:'100%',padding:'10px 12px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',color:'#F1F5F9',fontSize:'13px',outline:'none'}}>
              {p.models.map(m=><option key={m} value={m} style={{background:'#0D1526'}}>{m}</option>)}
            </select>
          </div>
        </div>
      ))}

      <button onClick={save} style={{display:'flex',alignItems:'center',gap:'8px',padding:'12px 24px',borderRadius:'10px',background:saved?'rgba(34,197,94,0.2)':'linear-gradient(135deg,#6366F1,#8B5CF6)',border:saved?'1px solid rgba(34,197,94,0.4)':'none',color:'#fff',cursor:'pointer',fontSize:'14px',fontWeight:'600',transition:'all 0.3s'}}>
        {saved?<><CheckCircle size={16}/>Saved!</>:<><Save size={16}/>Save Settings</>}
      </button>
    </div>
  )
}
