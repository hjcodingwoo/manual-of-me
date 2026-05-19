'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useCompanyColors } from '../../../lib/useCompanyConfig'

const QUESTIONS = [
  'Conditions I like to work in','Times/Hours I like to work','The best ways to communicate with me',
  'The ways I like to receive feedback','Things I need','Things I struggle with','Things I love',
  'Other things to know about me','My favorites','Guilty pleasure','Dietary restrictions','Hobbies',
  'Personality type (MBTI or other)'
]
const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL

export default function ReviewPage() {
  const params = useParams()
  const slug = (params?.company || '').toLowerCase()
  const { primary, secondary, tertiary } = useCompanyColors(slug)
  const [responses, setResponses] = useState(Array(13).fill(null).map(() => ({ raw:'', refined:'' })))
  const [originals, setOriginals] = useState({})
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [refining, setRefining] = useState(false)
  const [refineStatus, setRefineStatus] = useState(Array(13).fill('idle'))
  const [publishState, setPublishState] = useState('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  useEffect(() => {
    const name = sessionStorage.getItem('userName')
    const email = sessionStorage.getItem('userEmail') || ''
    const saved = sessionStorage.getItem('responses')
    if (!name || !saved) { router.push(`/${slug}`); return }
    setUserName(name); setUserEmail(email)
    try { setResponses(JSON.parse(saved)) } catch(e) { router.push(`/${slug}`) }
  }, [])

  const updateRefined = (idx, text) => setResponses(prev => prev.map((r, i) => i === idx ? { ...r, refined: text } : r))
  const revertToOriginal = (idx) => {
    setResponses(prev => prev.map((r, i) => i === idx ? { ...r, refined: '' } : r))
    setRefineStatus(prev => prev.map((s, i) => i === idx ? 'idle' : s))
  }

  const handleRefineAll = async () => {
    if (!API_URL) { setErrorMsg('No API URL configured'); return }
    setRefining(true)
    const newStatus = Array(13).fill('idle')
    for (let i = 0; i < 13; i++) {
      const raw = responses[i]?.raw || ''
      if (!raw.trim() || i >= 8) { newStatus[i] = 'skip'; setRefineStatus([...newStatus]); continue }
      newStatus[i] = 'refining'; setRefineStatus([...newStatus])
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          body: new URLSearchParams({ action: 'refine', rawText: raw, questionTitle: QUESTIONS[i] })
        })
        const data = await res.json()
        if (data.refined) { updateRefined(i, data.refined); newStatus[i] = 'done' }
        else { newStatus[i] = 'error'; setErrorMsg('Refine error: ' + (data.error || 'unknown')) }
      } catch(e) { newStatus[i] = 'error'; setErrorMsg('Network error: ' + e.message) }
      setRefineStatus([...newStatus])
    }
    setRefining(false)
  }

  const handlePublish = async () => {
    if (!userName) { router.push(`/${slug}`); return }
    setPublishState('publishing'); setProgress(5); setErrorMsg('')
    try {
      setProgress(20)
      const company = slug || sessionStorage.getItem('company') || ''
      const saveRes = await fetch(API_URL, {
        method: 'POST',
        body: new URLSearchParams({
          action: 'saveAllResponses',
          name: userName,
          company,
          responses: JSON.stringify(responses.map(r => ({ raw: r?.raw || '', refined: r?.refined || r?.raw || '' })))
        })
      })
      const saveData = await saveRes.json()
      if (saveData.error) throw new Error(saveData.error)
      setProgress(70)
      await fetch(API_URL, {
        method: 'POST',
        body: new URLSearchParams({ action: 'createUser', name: userName, email: userEmail, company })
      })
      setProgress(100)
      const dk = sessionStorage.getItem('draftKey')
      if (dk) localStorage.removeItem(dk)
      sessionStorage.removeItem('draftKey')
      setPublishState('done')
      setTimeout(() => router.push(`/${slug}/completion?name=${encodeURIComponent(userName)}`), 400)
    } catch(err) {
      setErrorMsg(err.message || 'Failed to publish.')
      setPublishState('error'); setProgress(0)
    }
  }

  if (publishState === 'publishing' || publishState === 'done') return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:tertiary, fontFamily:'Georgia,serif' }}>
      <div style={{ textAlign:'center', maxWidth:'320px', width:'100%', padding:'2rem' }}>
        <div style={{ fontSize:'48px', marginBottom:'1rem' }}>{publishState === 'done' ? '🎉' : '🚀'}</div>
        <h2 style={{ fontSize:'22px', fontWeight:'bold', margin:'0 0 1.5rem' }}>{publishState === 'done' ? 'Published!' : 'Publishing...'}</h2>
        <div style={{ background:'#e8e4da', borderRadius:'999px', height:'10px', overflow:'hidden' }}>
          <div style={{ background:primary, height:'100%', width:`${progress}%`, transition:'width 0.6s ease', borderRadius:'999px' }} />
        </div>
        <p style={{ fontSize:'13px', color:'#aaa', marginTop:'0.75rem' }}>{progress}%</p>
      </div>
    </div>
  )

  const allDone = refineStatus.every(s => s === 'done' || s === 'skip')
  const anyRefining = refineStatus.some(s => s === 'refining')

  return (
    <div style={{ minHeight:'100vh', background:tertiary, padding:'clamp(1rem,3vw,2rem)', fontFamily:'Georgia,serif', color:'#1a1a18' }}>
      <div style={{ maxWidth:'900px', margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'10px' }}>
          <button onClick={() => router.push(`/${slug}/form`)} style={{ background:'transparent', border:'1px solid #ddd', color:'#666', padding:'0.4rem 0.875rem', borderRadius:'8px', fontSize:'13px', cursor:'pointer' }}>← Edit</button>
          <button onClick={handleRefineAll} disabled={refining || allDone}
            style={{ padding:'0.5rem 1.25rem', background: allDone ? '#e8e4da' : '#FF7900', color: allDone ? '#aaa' : 'white', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'bold', cursor: refining || allDone ? 'not-allowed' : 'pointer' }}>
            {allDone ? '✓ Refined' : anyRefining ? 'Refining...' : '✦ Refine with Claude in 60 seconds'}
          </button>
        </div>

        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <h1 style={{ fontSize:'clamp(22px,4vw,30px)', fontWeight:'bold', margin:'0 0 0.25rem' }}>Review Your Manual</h1>
          <p style={{ fontSize:'14px', color:'#888', margin:0 }}>Refine with Claude, edit if needed, then publish.</p>
        </div>

        {errorMsg && <div style={{ background:'#fff0f0', border:'1px solid #ffcccc', borderRadius:'8px', padding:'1rem', marginBottom:'1rem', fontSize:'14px', color:'#cc3300' }}>⚠️ {errorMsg}</div>}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,400px),1fr))', gap:'12px', marginBottom:'1.5rem' }}>
          {responses.map((r, idx) => {
            const status = refineStatus[idx]
            const displayText = r.refined || r.raw || ''
            const isFun = idx >= 8
            return (
              <div key={idx} style={{ background:'white', borderRadius:'12px', border: status === 'done' ? '1px solid #FF7900' : '1px solid #e8e4da', padding:'1rem', position:'relative' }}>
                {status === 'refining' && (
                  <div style={{ position:'absolute', top:'10px', right:'10px' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" style={{ animation:'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="9" fill="none" stroke="#f0ede4" strokeWidth="2.5"/>
                      <circle cx="12" cy="12" r="9" fill="none" stroke={primary} strokeWidth="2.5" strokeDasharray="15 45" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'5px', flex:1, paddingRight:'30px' }}>
                    {isFun && <span style={{ fontSize:'9px', fontWeight:'bold', background:secondary, color:'#1a1a18', padding:'1px 5px', borderRadius:'8px', textTransform:'uppercase', flexShrink:0 }}>Fun</span>}
                    <h3 style={{ fontSize:'11px', fontWeight:'bold', color:primary, textTransform:'uppercase', letterSpacing:'0.5px', margin:0 }}>{idx + 1}. {QUESTIONS[idx]}</h3>
                  </div>
                  <div style={{ display:'flex', gap:'4px', flexShrink:0 }}>
                    {status === 'done' && <span style={{ fontSize:'10px', background:primary, color:'white', padding:'2px 6px', borderRadius:'10px' }}>refined</span>}
                    {status === 'error' && <span style={{ fontSize:'10px', background:'#cc3300', color:'white', padding:'2px 6px', borderRadius:'10px' }}>error</span>}
                    {status === 'done' && <button onClick={() => revertToOriginal(idx)}
                      style={{ fontSize:'11px', padding:'2px 6px', background:'white', border:`1px solid ${primary}`, borderRadius:'5px', cursor:'pointer', color:primary }}>↩ un-claude</button>}
                    <button onClick={() => { sessionStorage.setItem('editIndex', String(idx)); router.push(`/${slug}/form`) }}
                      style={{ fontSize:'11px', padding:'2px 6px', background:'white', border:'1px solid #ddd', borderRadius:'5px', cursor:'pointer', color:'#666' }}>Edit</button>
                  </div>
                </div>
                {status === 'done'
                  ? <textarea value={r.refined} onChange={e => updateRefined(idx, e.target.value)}
                      style={{ width:'100%', minHeight:'80px', padding:'8px', background:'#fffbf0', border:'1px solid #f0e8d8', borderRadius:'6px', fontSize:'13px', lineHeight:1.6, resize:'vertical', outline:'none', color:'#1a1a18', fontFamily:'Georgia,serif' }} />
                  : <p style={{ fontSize:'13px', lineHeight:1.6, color: displayText ? '#1a1a18' : '#ccc', margin:0, fontStyle: displayText ? 'normal' : 'italic', whiteSpace:'pre-wrap' }}>
                      {status === 'refining' ? (displayText || 'Refining...') : (displayText || 'Not answered')}
                    </p>
                }
              </div>
            )
          })}
        </div>

        <div style={{ display:'flex', justifyContent:'center' }}>
          <button onClick={handlePublish} style={{ padding:'0.875rem 2.5rem', background:primary, color:'white', border:'none', borderRadius:'8px', fontSize:'16px', fontWeight:'bold', cursor:'pointer' }}>
            Publish Your Manual 🚀
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
