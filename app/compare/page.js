'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CompareLanding() {
  const [names, setNames] = useState([])
  const [input, setInput] = useState('')
  const [inputError, setInputError] = useState('')
  const router = useRouter()

  const addName = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    if (names.length >= 6) { setInputError('Maximum 6 people.'); return }
    if (names.map(n => n.toLowerCase()).includes(trimmed.toLowerCase())) { setInputError('That name is already added.'); return }
    setNames(prev => [...prev, trimmed])
    setInput('')
    setInputError('')
  }

  const removeName = (n) => setNames(prev => prev.filter(x => x !== n))

  const handleCompare = () => {
    if (names.length < 2) return
    const path = '/compare/' + names.map(n => encodeURIComponent(n)).join('/')
    router.push(path)
  }

  return (
    <div style={{minHeight:'100vh',background:'#fffdf5',display:'flex',alignItems:'center',justifyContent:'center',padding:'clamp(1rem,3vw,2rem)',fontFamily:'Georgia,serif',color:'#1a1a18'}}>
      <div style={{maxWidth:'480px',width:'100%'}}>
        <button onClick={() => router.push('/')} style={{fontSize:'13px',color:'#aaa',background:'transparent',border:'none',cursor:'pointer',marginBottom:'2rem',display:'block',fontFamily:'Georgia,serif'}}>← Home</button>

        <h1 style={{fontSize:'clamp(24px,5vw,32px)',fontWeight:'bold',margin:'0 0 0.5rem'}}>Compare profiles</h1>
        <p style={{fontSize:'15px',color:'#888',margin:'0 0 0.75rem',lineHeight:1.6}}>Add 2–6 people to compare their manuals side by side.</p>

        <div style={{background:'#fffbf0',border:'1px solid #f9e8cc',borderRadius:'8px',padding:'0.875rem',marginBottom:'1.5rem'}}>
          <p style={{fontSize:'13px',color:'#FF7900',margin:0,fontWeight:'bold',lineHeight:1.6}}>
            💡 Ask your colleague "what name did you use when you created your manual?" Use that exact name below.
          </p>
        </div>

        {names.length > 0 && (
          <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'1rem'}}>
            {names.map(n => (
              <span key={n} onClick={() => removeName(n)}
                style={{padding:'6px 12px',background:'#1a1a18',color:'#FFBF00',borderRadius:'20px',fontSize:'13px',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:'6px'}}>
                {n} <span style={{opacity:0.6,fontSize:'11px'}}>✕</span>
              </span>
            ))}
          </div>
        )}

        <div style={{display:'flex',gap:'8px',marginBottom:'0.5rem'}}>
          <input
            type="text"
            placeholder="Enter their app name exactly..."
            value={input}
            onChange={e => { setInput(e.target.value); setInputError('') }}
            onKeyDown={e => e.key === 'Enter' && addName()}
            style={{flex:1,padding:'0.875rem',border:'2px solid #1a1a18',borderRadius:'8px',fontSize:'14px',outline:'none',fontFamily:'Georgia,serif'}}
          />
          <button
            onClick={addName}
            style={{padding:'0.875rem 1.25rem',background:input.trim()?'#1a1a18':'#e8e4da',color:input.trim()?'white':'#aaa',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'bold',cursor:input.trim()?'pointer':'not-allowed',fontFamily:'Georgia,serif'}}>
            Add
          </button>
        </div>

        {inputError && <p style={{fontSize:'13px',color:'#cc4400',margin:'0 0 0.5rem'}}>{inputError}</p>}
        <p style={{fontSize:'12px',color:'#aaa',margin:'0 0 1.5rem'}}>{names.length} added · {6 - names.length} slots remaining</p>

        <button
          onClick={handleCompare}
          disabled={names.length < 2}
          style={{width:'100%',padding:'0.875rem',background:names.length>=2?'linear-gradient(135deg,#FFBF00,#FF7900)':'#e8e4da',color:names.length>=2?'#1a1a18':'#aaa',border:'none',borderRadius:'8px',fontSize:'15px',fontWeight:'bold',cursor:names.length>=2?'pointer':'not-allowed',fontFamily:'Georgia,serif'}}>
          {names.length >= 2 ? `Compare ${names.length} profiles →` : 'Add at least 2 names to compare'}
        </button>
      </div>
    </div>
  )
}
