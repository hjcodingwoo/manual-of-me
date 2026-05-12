'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const QUESTIONS = ['Conditions I like to work in','Times/Hours I like to work','The best ways to communicate with me','The ways I like to receive feedback','Things I need','Things I struggle with','Things I love','Other things to know about me']
const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL

export default function ReviewPage() {
  const [responses, setResponses] = useState(Array(8).fill({ raw:'', refined:'' }))
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [refining, setRefining] = useState(false)
  const [refineStatus, setRefineStatus] = useState(Array(8).fill('idle'))
  const [publishState, setPublishState] = useState('idle') // idle | publishing | done | error
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  useEffect(() => {
    const name = sessionStorage.getItem('userName')
    const email = sessionStorage.getItem('userEmail') || ''
    const saved = sessionStorage.getItem('responses')
    if (!name || !saved) { router.push('/'); return }
    setUserName(name)
    setUserEmail(email)
    try { setResponses(JSON.parse(saved)) } catch(e) { router.push('/') }
  }, [])

  const updateRefined = (idx, text) => {
    setResponses(prev => prev.map((r, i) => i === idx ? { ...r, refined: text } : r))
  }

  const handleRefineAll = async () => {
    if (!API_URL) return
    setRefining(true)
    const newStatus = [...Array(8).fill('idle')]
    for (let i = 0; i < 8; i++) {
      const raw = responses[i]?.raw || ''
      if (!raw.trim()) {
        newStatus[i] = 'done'
        setRefineStatus([...newStatus])
        continue
      }
      newStatus[i] = 'refining'
      setRefineStatus([...newStatus])
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          body: new URLSearchParams({ action: 'refine', rawText: raw, questionTitle: QUESTIONS[i] }),
        })
        const data = await res.json()
        if (data.refined) {
          updateRefined(i, data.refined)
          newStatus[i] = 'done'
        } else {
          newStatus[i] = 'idle'
        }
      } catch(e) {
        newStatus[i] = 'idle'
      }
      setRefineStatus([...newStatus])
    }
    setRefining(false)
  }

  const handlePublish = async () => {
    if (!userName) { alert('Session expired. Please start again.'); router.push('/'); return }
    setPublishState('publishing')
    setProgress(5)
    setErrorMsg('')

    const tick = (n) => setProgress(n)

    try {
      tick(20)
      const saveRes = await fetch(API_URL, {
        method: 'POST',
        body: new URLSearchParams({
          action: 'saveAllResponses',
          name: userName,
          responses: JSON.stringify(responses.map(r => ({
            raw: r?.raw || '',
            refined: r?.refined || r?.raw || ''
          }))),
        }),
      })
      const saveData = await saveRes.json()
      if (saveData.error) throw new Error('Save failed: ' + saveData.error)
      tick(60)

      await fetch(API_URL, {
        method: 'POST',
        body: new URLSearchParams({ action: 'createUser', name: userName, email: userEmail }),
      })
      tick(100)

      const dk = sessionStorage.getItem('draftKey')
      if (dk) localStorage.removeItem(dk)
      sessionStorage.removeItem('draftKey')

      setPublishState('done')
      setTimeout(() => router.push(`/completion?name=${encodeURIComponent(userName)}`), 600)
    } catch(err) {
      console.error('Publish error:', err)
      setErrorMsg(err.message || 'Failed to publish. Please try again.')
      setPublishState('error')
      setProgress(0)
    }
  }

  const allRefined = refineStatus.every(s => s === 'done')
  const anyRefining = refineStatus.some(s => s === 'refining')

  if (publishState === 'publishing' || publishState === 'done') return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fffdf5', padding:'2rem', fontFamily:'Georgia,serif' }}>
      <div style={{ textAlign:'center', maxWidth:'320px', width:'100%' }}>
        <div style={{ fontSize:'48px', marginBottom:'1rem' }}>{publishState === 'done' ? '🎉' : '🚀'}</div>
        <h2 style={{ fontSize:'22px', fontWeight:'bold', margin:'0 0 1.5rem', color:'#1a1a18' }}>
          {publishState === 'done' ? 'Published!' : 'Publishing...'}
        </h2>
        <div style={{ background:'#f0ede4', borderRadius:'999px', height:'10px', overflow:'hidden' }}>
          <div style={{ background:'linear-gradient(90deg,#FFBF00,#FF7900)', height:'100%', width:`${progress}%`, transition:'width 0.6s ease', borderRadius:'999px' }} />
        </div>
        <p style={{ fontSize:'13px', color:'#aaa', marginTop:'0.75rem' }}>{progress}%</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#fffdf5', padding:'clamp(1rem,3vw,2rem)', fontFamily:'Georgia,serif' }}>
      <div style={{ maxWidth:'900px', margin:'0 auto' }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'10px' }}>
          <button onClick={() => router.push('/form')} style={{ background:'transparent', border:'1px solid #ddd', color:'#666', padding:'0.4rem 0.875rem', borderRadius:'8px', fontSize:'13px', cursor:'pointer', fontWeight:'bold' }}>← Edit</button>
          <button onClick={handleRefineAll} disabled={refining || allRefined}
            style={{ padding:'0.5rem 1.25rem', background: allRefined ? '#e8e4da' : '#1a1a18', color: allRefined ? '#aaa' : '#FFBF00', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'bold', cursor: refining || allRefined ? 'not-allowed' : 'pointer' }}>
            {allRefined ? '✓ Refined' : anyRefining ? 'Refining...' : '✦ Refine with Claude in 60 seconds'}
          </button>
        </div>

        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <h1 style={{ fontSize:'clamp(22px,4vw,30px)', fontWeight:'bold', margin:'0 0 0.25rem', color:'#1a1a18' }}>Review Your Manual</h1>
          <p style={{ fontSize:'14px', color:'#888', margin:0 }}>Refine with Claude, edit if needed, then publish.</p>
        </div>

        {publishState === 'error' && (
          <div style={{ background:'#fff0f0', border:'1px solid #ffcccc', borderRadius:'8px', padding:'1rem', marginBottom:'1rem', fontSize:'14px', color:'#cc3300' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,400px),1fr))', gap:'12px', marginBottom:'1.5rem' }}>
          {responses.map((r, idx) => {
            const status = refineStatus[idx]
            const displayText = r.refined || r.raw || ''
            return (
              <div key={idx} style={{ background:'white', borderRadius:'12px', border: status === 'done' ? '1px solid #FF7900' : '1px solid #e8e4da', padding:'1rem', position:'relative' }}>
                {status === 'refining' && (
                  <div style={{ position:'absolute', top:'10px', right:'10px' }}>
                    <svg width="28" height="28" viewBox="0 0 28 28" style={{ animation:'spin 1s linear infinite' }}>
                      <circle cx="14" cy="14" r="11" fill="none" stroke="#f0ede4" strokeWidth="3"/>
                      <circle cx="14" cy="14" r="11" fill="none" stroke="#FF7900" strokeWidth="3" strokeDasharray="20 50" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                  <h3 style={{ fontSize:'11px', fontWeight:'bold', color:'#FFBF00', textTransform:'uppercase', letterSpacing:'0.5px', margin:0, flex:1, paddingRight:'36px' }}>{idx+1}. {QUESTIONS[idx]}</h3>
                  <div style={{ display:'flex', gap:'5px', flexShrink:0 }}>
                    {status === 'done' && <span style={{ fontSize:'10px', background:'#1a1a18', color:'#FFBF00', padding:'2px 7px', borderRadius:'10px' }}>refined</span>}
                    <button onClick={() => { sessionStorage.setItem('editIndex', String(idx)); router.push('/form') }}
                      style={{ fontSize:'11px', padding:'2px 7px', background:'white', border:'1px solid #ddd', borderRadius:'5px', cursor:'pointer', color:'#666', fontFamily:'Georgia,serif' }}>Edit</button>
                  </div>
                </div>
                {status === 'done' ? (
                  <textarea value={r.refined} onChange={e => updateRefined(idx, e.target.value)}
                    style={{ width:'100%', minHeight:'80px', padding:'8px', background:'#fffbf0', border:'1px solid #f0e8d8', borderRadius:'6px', fontSize:'13px', lineHeight:1.6, resize:'vertical', outline:'none', color:'#1a1a18', fontFamily:'Georgia,serif' }} />
                ) : (
                  <p style={{ fontSize:'13px', lineHeight:1.6, color: displayText ? '#1a1a18' : '#ccc', margin:0, fontStyle: displayText ? 'normal' : 'italic', whiteSpace:'pre-wrap' }}>
                    {status === 'refining' ? (displayText || 'Refining...') : (displayText || 'Skipped')}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ display:'flex', justifyContent:'center' }}>
          <button onClick={handlePublish}
            style={{ padding:'0.875rem 2.5rem', background:'linear-gradient(135deg,#FFBF00,#FF7900)', color:'#1a1a18', border:'none', borderRadius:'8px', fontSize:'16px', fontWeight:'bold', cursor:'pointer', fontFamily:'Georgia,serif' }}>
            Publish Your Manual 🚀
          </button>
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
