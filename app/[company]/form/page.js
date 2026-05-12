'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useCompanyColors } from '../../../lib/useCompanyConfig'

const QUESTIONS = [
  { title:'Conditions I like to work in', chips:['I need quiet to focus','Background music helps me','Open office drains me','I prefer natural light','I need fresh air / windows open','I work best from home','I like being in the office','I need my own desk space','Hybrid works best for me','I need a tidy workspace','Clutter doesn\'t bother me','I can work anywhere','I like a standing desk','Cool temperature helps me','I need two monitors','Noise-cancelling headphones essential','Coffee shop buzz energizes me','I need do-not-disturb blocks'] },
  { title:'Times/Hours I like to work', chips:['I\'m sharpest in the morning','I\'m a night owl','I need slow mornings','I start early, finish early','Afternoons are my low point','I protect mornings for deep work','Meetings fine in afternoons','No meetings before 10am','I don\'t work evenings','I\'m flexible with hours','I take a long lunch break','I work in focused sprints','I need breaks between meetings','Back-to-back calls exhaust me','I exercise before work','I\'m in a different time zone','I have caring responsibilities','I work best 10am–2pm'] },
  { title:'The best ways to communicate with me', chips:['Slack for quick questions','Email for anything detailed','I prefer async over real-time','Please don\'t call without warning','I check messages twice a day','I respond within 24 hours','Short messages please','Give me full context upfront','I miss notifications — follow up','Video calls for complex topics','I prefer written over verbal','Ask before booking my calendar','I keep my calendar up to date','I\'m direct — don\'t take it personally','I think out loud — bear with me','I need time to process','WhatsApp for urgent things only','I over-apologise — ignore it'] },
  { title:'The ways I like to receive feedback', chips:['Be direct, I can handle it','Use the sandwich method','Private, not in front of others','Give me examples, not just labels','Written first, then discuss','Face to face is best','I need time to process first','Tell me the impact','Be specific, not vague','I struggle with criticism in public','Include what I should do differently','Positive feedback matters too','I want regular feedback','I welcome challenge — push me','Async message then follow-up call','Be honest even if it\'s hard','Frame it as a question','I take feedback personally at first'] },
  { title:'Things I need', chips:['Clear goals and priorities','Autonomy on how I work','Context on why we\'re doing this','Time to think before deciding','Regular 1:1s with my manager','Recognition when I do good work','Creative freedom','Structured processes','Brainstorm sessions','Psychological safety to speak up','Honest peers who challenge me','Space to make mistakes','Clarity on decisions and ownership','To see the bigger picture','Work that connects to real impact','A manager who has my back','Variety in my work','Deep work time blocked off'] },
  { title:'Things I struggle with', chips:['Ambiguity without direction','Back-to-back meetings','Being micromanaged','Unnecessary process','People pleasing','Saying no','Switching tasks quickly','Loud open-plan offices','Last-minute changes','Working without clear purpose','Passive-aggressive behaviour','Meetings without an agenda','Inconsistency or mixed messages','Perfectionism — I go too deep','Asking for help','Conflict — I avoid it','Too much critique without solutions','Imposter syndrome'] },
  { title:'Things I love', chips:['Solving hard problems','Connecting ideas across teams','Creative brainstorms','Helping others grow','Seeing the impact of my work','Learning new things','Organising team events','Deep focused work','Presenting to an audience','Shipping things quickly','Being trusted with hard projects','Building things from scratch','Cross-functional collaboration','Mentoring people','Data and patterns','Working with autonomy','Big picture strategy','Whiteboarding and sketching'] },
  { title:'Other things to know about me', chips:['I\'m an introvert','I\'m an extrovert','I\'m an ambivert','I trust my intuition','I bring my whole self to work','I name the elephant in the room','Fairness matters a lot to me','I have a dark sense of humour','I\'m very literal — say what you mean','I have caring responsibilities','I\'m neurodivergent','I cycle between high energy and low','I get passionate and loud sometimes','I value honesty over comfort','Silence means I\'m thinking','I over-commit — remind me','Actions speak louder than words','I\'m MBTI typed'] },
]

const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL

export default function CompanyFormPage() {
  const params = useParams()
  const router = useRouter()
  const slug = (params?.company || '').toLowerCase()
  const { primary, secondary, tertiary } = useCompanyColors(slug)

  const [currentQ, setCurrentQ] = useState(0)
  const [responses, setResponses] = useState(Array(8).fill({ raw:'', refined:'' }))
  const [rawText, setRawText] = useState('')
  const [selectedChips, setSelectedChips] = useState(Array(8).fill([]))
  const [userName, setUserName] = useState('')
  const [draftKey, setDraftKey] = useState(null)
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    const name = sessionStorage.getItem('userName')
    const co = sessionStorage.getItem('company')
    if (!name || co !== slug) { router.push(`/${slug}`); return }
    setUserName(name)
    const key = sessionStorage.getItem('draftKey')
    if (key) {
      setDraftKey(key)
      try {
        const saved = localStorage.getItem(key)
        if (saved) { const p = JSON.parse(saved); if (p.responses) { setResponses(p.responses); setSelectedChips(p.chips||Array(8).fill([])); setRawText(p.responses[0]?.raw||'') } }
      } catch(e) {}
    }
    const editIdx = sessionStorage.getItem('editIndex')
    if (editIdx !== null) { setCurrentQ(parseInt(editIdx)); sessionStorage.removeItem('editIndex') }
  }, [])

  useEffect(() => { setRawText(responses[currentQ]?.raw||'') }, [currentQ])

  const toggleChip = (chip) => {
    const current = selectedChips[currentQ]||[]
    const newChips = current.includes(chip) ? current.filter(c=>c!==chip) : [...current,chip]
    const updatedAllChips = selectedChips.map((c,i)=>i===currentQ?newChips:c)
    setSelectedChips(updatedAllChips)
    const chipsText = newChips.map(c=>`• ${c}`).join('\n')
    const manualLines = rawText.split('\n').filter(l=>!l.startsWith('• '))
    const newText = chipsText+(manualLines.join('\n').trim()?'\n'+manualLines.join('\n').trim():'')
    setRawText(newText)
    const updated = responses.map((r,i)=>i===currentQ?{...r,raw:newText}:r)
    setResponses(updated)
    if (draftKey) localStorage.setItem(draftKey, JSON.stringify({responses:updated,chips:updatedAllChips}))
  }

  const updateRaw = (text) => {
    setRawText(text)
    const updated = responses.map((r,i)=>i===currentQ?{...r,raw:text}:r)
    setResponses(updated)
    if (draftKey) localStorage.setItem(draftKey, JSON.stringify({responses:updated,chips:selectedChips}))
  }

  const goNext = () => {
    if (draftKey) localStorage.setItem(draftKey, JSON.stringify({responses,chips:selectedChips}))
    setSavedMsg('Saved!'); setTimeout(()=>setSavedMsg(''),1500)
    setTimeout(()=>{
      if (currentQ<7) setCurrentQ(currentQ+1)
      else { sessionStorage.setItem('responses',JSON.stringify(responses)); router.push(`/${slug}/review`) }
    },200)
  }

  const pct = Math.round((currentQ/8)*100)
  const q = QUESTIONS[currentQ]

  return (
    <div style={{minHeight:'100vh',padding:'clamp(1rem,3vw,1.5rem)',background:tertiary,fontFamily:'Georgia,serif',color:'#1a1a18'}}>
      <div style={{maxWidth:'800px',margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
          <button onClick={()=>router.push(`/${slug}`)} style={{background:'transparent',border:'1px solid #ddd',color:'#666',padding:'0.4rem 0.875rem',borderRadius:'8px',fontSize:'13px',cursor:'pointer',fontFamily:'Georgia,serif'}}>← Home</button>
          {savedMsg && <span style={{fontSize:'13px',color:primary,fontWeight:'bold'}}>{savedMsg}</span>}
        </div>
        <div style={{height:'4px',background:'#e8e4da',borderRadius:'2px',marginBottom:'4px'}}>
          <div style={{height:'4px',background:primary,borderRadius:'2px',width:`${pct}%`,transition:'width 0.3s'}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'1rem'}}>
          <span style={{fontSize:'12px',color:primary,fontWeight:'bold'}}>{pct}%</span>
          <span style={{fontSize:'12px',color:'#aaa'}}>{currentQ+1} / 8</span>
        </div>
        <h1 style={{fontSize:'clamp(18px,4vw,26px)',fontWeight:'bold',margin:'0 0 0.25rem'}}>{q.title}</h1>
        <p style={{fontSize:'13px',color:'#aaa',margin:'0 0 1rem'}}>Tap to add · tap again to remove</p>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'12px'}}>
          {q.chips.map((chip,i)=>{
            const active=(selectedChips[currentQ]||[]).includes(chip)
            return <button key={i} onClick={()=>toggleChip(chip)} style={{padding:'6px 12px',background:active?primary:'white',color:active?'white':'#1a1a18',border:active?`1px solid ${primary}`:'1px solid #e0d8c8',borderRadius:'20px',fontSize:'13px',cursor:'pointer',transition:'all 0.15s',fontFamily:'Georgia,serif'}}>{chip}</button>
          })}
        </div>
        <p style={{fontSize:'12px',color:'#aaa',margin:'0 0 6px'}}>Add your own notes below</p>
        <textarea value={rawText} onChange={e=>updateRaw(e.target.value)} placeholder="Your notes appear here. Add more detail or type freely..."
          style={{width:'100%',minHeight:'clamp(100px,20vw,160px)',padding:'0.875rem',border:'1px solid #e0d8c8',borderRadius:'8px',fontSize:'14px',lineHeight:1.6,resize:'vertical',outline:'none',background:'white',color:'#1a1a18',fontFamily:'Georgia,serif'}}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'1rem'}}>
          <button onClick={()=>currentQ>0&&setCurrentQ(currentQ-1)} disabled={currentQ===0}
            style={{padding:'0.75rem 1.5rem',background:'white',border:'1px solid #ddd',borderRadius:'8px',fontSize:'14px',fontWeight:'bold',cursor:currentQ===0?'not-allowed':'pointer',color:currentQ===0?'#ccc':'#1a1a18',fontFamily:'Georgia,serif'}}>← Back</button>
          <div style={{display:'flex',gap:'5px'}}>
            {Array(8).fill(0).map((_,i)=>(
              <div key={i} onClick={()=>setCurrentQ(i)} style={{width:i===currentQ?'22px':'8px',height:'8px',borderRadius:'4px',background:i<currentQ?secondary:i===currentQ?primary:'#e0d8c8',cursor:'pointer',transition:'all 0.2s'}}/>
            ))}
          </div>
          <button onClick={goNext} style={{padding:'0.75rem 1.5rem',background:primary,color:'white',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'bold',cursor:'pointer',fontFamily:'Georgia,serif'}}>
            {currentQ===7?'Review →':'Save & Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
