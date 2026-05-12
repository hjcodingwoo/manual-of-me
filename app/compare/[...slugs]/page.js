'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL
const QUESTIONS = ['Conditions I like to work in','Times/Hours I like to work','The best ways to communicate with me','The ways I like to receive feedback','Things I need','Things I struggle with','Things I love','Other things to know about me']

export default function CompareResultsPage() {
  const params = useParams()
  const router = useRouter()
  const [names, setNames] = useState([])
  const [allResponses, setAllResponses] = useState({})
  const [loading, setLoading] = useState(true)
  const [summaries, setSummaries] = useState({})
  const [overallSummary, setOverallSummary] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [addName, setAddName] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const raw = params?.slugs
    const slugs = Array.isArray(raw) ? raw : raw ? [raw] : []
    const decoded = slugs.map(s => decodeURIComponent(s)).filter(Boolean).slice(0, 6)
    if (decoded.length < 2) {
      router.replace('/compare')
      return
    }
    setNames(decoded)
    fetchAll(decoded)
  }, [])

  const fetchAll = async (nameList) => {
    setLoading(true)
    const results = {}
    await Promise.all(nameList.map(async (name) => {
      try {
        const res = await fetch(API_URL, { method: 'POST', body: new URLSearchParams({ action: 'getUserResponses', name }) })
        const data = await res.json()
        results[name] = data.responses || {}
      } catch(e) { results[name] = {} }
    }))
    setAllResponses(results)
    setLoading(false)
  }

  const handleAddName = () => {
    const trimmed = addName.trim()
    if (!trimmed || names.length >= 6 || names.map(n => n.toLowerCase()).includes(trimmed.toLowerCase())) return
    const newNames = [...names, trimmed]
    setAddName('')
    router.push('/compare/' + newNames.map(n => encodeURIComponent(n)).join('/'))
  }

  const handleRemoveName = (name) => {
    const newNames = names.filter(n => n !== name)
    if (newNames.length >= 2) router.push('/compare/' + newNames.map(n => encodeURIComponent(n)).join('/'))
    else router.push('/compare')
  }

  const handleAnalyze = async () => {
    if (!API_URL || names.length < 2) return
    setAnalyzing(true)
    setSummaries({})
    setOverallSummary('')
    const newSummaries = {}
    for (let i = 0; i < 8; i++) {
      const responses = names.map(name => ({ name, refined: allResponses[name]?.[i]?.refined || allResponses[name]?.[i]?.raw || '' })).filter(r => r.refined)
      if (responses.length < 2) continue
      try {
        const res = await fetch(API_URL, { method: 'POST', body: new URLSearchParams({ action: 'analyzeQuestion', questionIndex: i, responses: JSON.stringify(responses) }) })
        const data = await res.json()
        newSummaries[i] = data.analysis || ''
      } catch(e) {}
    }
    setSummaries(newSummaries)
    try {
      const allText = names.map(name => QUESTIONS.map((q, i) => `${name} on "${q}": ${allResponses[name]?.[i]?.refined || allResponses[name]?.[i]?.raw || 'no answer'}`).join('\n')).join('\n\n')
      const res = await fetch(API_URL, { method: 'POST', body: new URLSearchParams({ action: 'analyzeQuestion', questionIndex: '-1', responses: JSON.stringify([{ name: 'all', refined: allText }]) }) })
      const data = await res.json()
      setOverallSummary(data.analysis || '')
    } catch(e) {}
    setAnalyzing(false)
  }

  const handleCopy = () => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#fffdf5',fontFamily:'Georgia,serif',color:'#aaa'}}>
      Loading profiles...
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#fffdf5',padding:'clamp(1rem,3vw,2rem)',fontFamily:'Georgia,serif',color:'#1a1a18'}}>
      <div style={{maxWidth:'1100px',margin:'0 auto'}}>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',flexWrap:'wrap',gap:'10px'}}>
          <div style={{display:'flex',flexWrap:'wrap',gap:'6px',alignItems:'center'}}>
            <button onClick={() => router.push('/compare')} style={{fontSize:'13px',color:'#aaa',background:'transparent',border:'none',cursor:'pointer',fontFamily:'Georgia,serif',marginRight:'4px'}}>←</button>
            {names.map(n => (
              <span key={n} style={{padding:'5px 12px',background:'#1a1a18',color:'#FFBF00',borderRadius:'20px',fontSize:'13px',display:'inline-flex',alignItems:'center',gap:'5px'}}>
                {n}
                <span onClick={() => handleRemoveName(n)} style={{cursor:'pointer',opacity:0.6,fontSize:'11px'}}>✕</span>
              </span>
            ))}
            {names.length < 6 && (
              <div style={{display:'flex',gap:'5px'}}>
                <input type="text" placeholder="Add person" value={addName} onChange={e => setAddName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddName()}
                  style={{padding:'5px 10px',border:'1px solid #ddd',borderRadius:'20px',fontSize:'13px',outline:'none',width:'110px',fontFamily:'Georgia,serif'}}/>
                <button onClick={handleAddName} style={{padding:'5px 10px',background:'white',border:'1px solid #ddd',borderRadius:'20px',fontSize:'13px',cursor:'pointer',fontFamily:'Georgia,serif'}}>+</button>
              </div>
            )}
          </div>
          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={handleCopy} style={{padding:'0.5rem 1rem',background:'white',border:'1px solid #ddd',borderRadius:'8px',fontSize:'13px',cursor:'pointer',color:'#666',fontFamily:'Georgia,serif'}}>
              {copied ? '✓ Copied!' : '🔗 Share'}
            </button>
            <button onClick={handleAnalyze} disabled={analyzing}
              style={{padding:'0.5rem 1rem',background:'#1a1a18',color:'#FFBF00',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'bold',cursor:analyzing?'not-allowed':'pointer',opacity:analyzing?0.7:1,fontFamily:'Georgia,serif'}}>
              {analyzing ? 'Analyzing...' : '✦ Analyze with Claude'}
            </button>
          </div>
        </div>

        {overallSummary && (
          <div style={{background:'#1a1a18',borderRadius:'12px',padding:'1.25rem',marginBottom:'1.5rem'}}>
            <p style={{fontSize:'11px',fontWeight:'bold',color:'#FFBF00',textTransform:'uppercase',letterSpacing:'0.5px',margin:'0 0 0.75rem'}}>Overall team summary</p>
            <p style={{fontSize:'14px',color:'white',lineHeight:1.7,margin:0}}>{overallSummary}</p>
          </div>
        )}

        {QUESTIONS.map((q, qi) => (
          <div key={qi} style={{marginBottom:'1.5rem'}}>
            <h2 style={{fontSize:'12px',fontWeight:'bold',color:'#FF7900',textTransform:'uppercase',letterSpacing:'0.5px',margin:'0 0 0.75rem'}}>{qi+1}. {q}</h2>
            <div style={{display:'grid',gridTemplateColumns:`repeat(${Math.min(names.length, 3)},minmax(0,1fr))`,gap:'10px',marginBottom:summaries[qi]?'8px':0}}>
              {names.map(name => (
                <div key={name} style={{background:'white',borderRadius:'10px',border:'1px solid #e8e4da',padding:'1rem'}}>
                  <p style={{fontSize:'12px',fontWeight:'bold',color:'#1a1a18',margin:'0 0 6px',paddingBottom:'6px',borderBottom:'1px solid #f0ede4'}}>{name}</p>
                  <p style={{fontSize:'13px',lineHeight:1.6,color:allResponses[name]?.[qi]?'#1a1a18':'#ccc',margin:0,fontStyle:allResponses[name]?.[qi]?'normal':'italic'}}>
                    {allResponses[name]?.[qi]?.refined || allResponses[name]?.[qi]?.raw || 'No answer'}
                  </p>
                </div>
              ))}
            </div>
            {summaries[qi] && (
              <div style={{background:'#fffbf0',borderRadius:'8px',border:'1px solid #f9e8cc',padding:'0.875rem'}}>
                <p style={{fontSize:'11px',fontWeight:'bold',color:'#FF7900',margin:'0 0 4px'}}>Key insight</p>
                <p style={{fontSize:'13px',color:'#1a1a18',lineHeight:1.6,margin:0}}>{summaries[qi]}</p>
              </div>
            )}
          </div>
        ))}

      </div>
    </div>
  )
}
