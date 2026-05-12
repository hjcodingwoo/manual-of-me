'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getCompanyConfig } from '../../lib/companies'

const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL

export default function CompanyLanding() {
  const params = useParams()
  const router = useRouter()
  const slug = (params?.company || '').toLowerCase()
  const config = getCompanyConfig(slug)

  const [name, setName] = useState('')
  const [showPopup, setShowPopup] = useState(false)
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [checking, setChecking] = useState(false)
  const [showOverride, setShowOverride] = useState(false)
  const [suggestedName, setSuggestedName] = useState('')

  // If company not found, redirect home
  if (!config || config.status === 'suspended') {
    if (typeof window !== 'undefined') router.push('/')
    return null
  }

  const primary = config.primary_color || '#FF7900'
  const secondary = config.secondary_color || '#FFBF00'
  const tertiary = config.tertiary_color || '#fffdf5'
  const logoUrl = config.logo_url || ''
  const companyName = config.company_name || ''

  const boxes = [
    {icon:'🏢',title:'Work conditions'},{icon:'⏰',title:'Hours & energy'},
    {icon:'💬',title:'Communication'},{icon:'🎯',title:'Feedback style'},
    {icon:'⚡',title:'What I need'},{icon:'🌊',title:'What I struggle with'},
    {icon:'❤️',title:'What I love'},{icon:'✨',title:'Other things'},
  ]

  const handleStart = () => {
    if (!name.trim()) return
    setShowPopup(true); setMsg(''); setEmail(''); setShowOverride(false); setSuggestedName('')
  }

  const checkNameAndProceed = async () => {
    if (!email.trim() || !email.includes('@')) { setMsg('Please enter a valid email.'); return }
    setChecking(true); setMsg('Checking for an existing profile with this name...')
    try {
      const res = await fetch(API_URL, { method:'POST', body: new URLSearchParams({ action:'getUserResponses', name:name.trim(), company:slug }) })
      const data = await res.json()
      const nameExists = data.responses && Object.keys(data.responses).length > 0
      if (nameExists) { setSuggestedName(name.trim()+'2'); setShowOverride(true); setChecking(false); setMsg(''); return }
    } catch(e) {}
    setChecking(false); setMsg('')
    startSession(name.trim())
  }

  const startSession = (finalName) => {
    const key = `draft_${slug}_${finalName.toLowerCase()}`
    localStorage.setItem(`${key}_meta`, JSON.stringify({ name:finalName, email:email.trim(), company:slug }))
    sessionStorage.setItem('userName', finalName)
    sessionStorage.setItem('userEmail', email.trim())
    sessionStorage.setItem('draftKey', key)
    sessionStorage.setItem('company', slug)
    sessionStorage.removeItem('responses')
    setShowPopup(false)
    router.push(`/${slug}/form`)
  }

  return (
    <div style={{background:tertiary,minHeight:'100vh',fontFamily:'Georgia,serif',color:'#1a1a18'}}>
      <div style={{maxWidth:'860px',margin:'0 auto',padding:'clamp(1rem,4vw,2.5rem) clamp(1rem,4vw,2rem)'}}>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'clamp(1.5rem,4vw,3rem)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            {logoUrl
              ? <img src={logoUrl} alt={companyName} style={{height:'36px',objectFit:'contain'}}/>
              : <div style={{fontSize:'18px',fontWeight:'bold'}}>Manual of <span style={{color:primary}}>Me</span></div>
            }
          </div>
          <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
            <a href={`/${slug}/compare`} style={{fontSize:'13px',color:'#888',textDecoration:'none'}}>Compare</a>
            <a href="https://medium.com/@zalihataahamada/unlocking-team-collaboration-the-power-of-the-manual-of-me-workshop-4495e99a2d73" target="_blank" rel="noopener noreferrer" style={{fontSize:'13px',color:primary,textDecoration:'none',fontWeight:'bold'}}>Read the story</a>
          </div>
        </div>

        <div style={{paddingBottom:'2rem'}}>
          <div style={{fontSize:'clamp(28px,6vw,52px)',fontWeight:'bold',lineHeight:1.05,marginBottom:'1rem',letterSpacing:'-1px'}}>
            Your personal<br/>
            <span style={{color:secondary,background:'#1a1a18',padding:'2px 10px',display:'inline-block',borderRadius:'4px'}}>operating manual.</span>
          </div>
          <p style={{fontSize:'clamp(14px,2vw,17px)',color:'#666',maxWidth:'500px',lineHeight:1.7,margin:'0 0 0.5rem'}}>Help your team understand how you work, what energizes you, and how to collaborate with you at your best.</p>
          <p style={{fontSize:'13px',color:'#999',margin:'0 0 1.5rem'}}>Concept by <strong style={{color:'#333'}}>Ben Dattner</strong> (2008) · Popularized by <strong style={{color:'#333'}}>Cass Thompson</strong> · <a href="https://www.bloomberg.com/news/articles/2008-07-06/writing-your-managerial-users-manual" target="_blank" rel="noopener noreferrer" style={{color:primary,textDecoration:'none',fontWeight:'bold'}}>Original article</a></p>

          <div style={{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'0.75rem'}}>
            <input type="text" placeholder="Enter your name to begin" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleStart()}
              style={{padding:'0.875rem 1.25rem',border:'2px solid #1a1a18',background:'white',color:'#1a1a18',borderRadius:'8px',fontSize:'15px',width:'clamp(180px,40vw,260px)',outline:'none',fontFamily:'Georgia,serif'}}/>
            <button onClick={handleStart} style={{padding:'0.875rem 1.5rem',background:primary,color:'white',border:'none',borderRadius:'8px',fontSize:'15px',fontWeight:'bold',cursor:'pointer',fontFamily:'Georgia,serif',opacity:name.trim()?1:0.4}}>
              Start Your Manual →
            </button>
          </div>
          <p style={{fontSize:'13px',color:'#999',margin:0}}>Takes 10–15 min · AI refinement included · Your name is your unique ID</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:'8px',marginBottom:'2rem'}}>
          {boxes.map((b,i)=>(
            <div key={i} style={{background:'white',borderRadius:'10px',padding:'1rem',border:'1px solid #e8e4da'}}>
              <div style={{fontSize:'20px',marginBottom:'6px'}}>{b.icon}</div>
              <div style={{fontSize:'13px',fontWeight:'bold',color:'#1a1a18',lineHeight:1.3}}>{b.title}</div>
            </div>
          ))}
        </div>

        <div style={{textAlign:'center',paddingBottom:'2rem'}}>
          <p style={{fontSize:'12px',color:'#ccc'}}>Powered by Manual of Me</p>
        </div>
      </div>

      {showPopup && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'1rem'}}>
          <div style={{background:'white',borderRadius:'16px',padding:'clamp(1.25rem,4vw,2rem)',maxWidth:'400px',width:'100%',fontFamily:'Georgia,serif'}}>
            {!showOverride ? (
              <>
                <h2 style={{fontSize:'20px',fontWeight:'bold',margin:'0 0 0.5rem'}}>Hi {name}! 👋</h2>
                <p style={{fontSize:'14px',color:'#888',margin:'0 0 1.25rem',lineHeight:1.6}}>Enter your email to save progress and receive your manual when done.</p>
                <input type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&checkNameAndProceed()}
                  style={{width:'100%',padding:'0.75rem',border:'1px solid #ddd',borderRadius:'8px',fontSize:'14px',marginBottom:'0.5rem',outline:'none',fontFamily:'Georgia,serif'}}/>
                {msg && <p style={{fontSize:'13px',color:msg.startsWith('Checking')?'#aaa':'#cc4400',margin:'0 0 0.75rem',fontStyle:msg.startsWith('Checking')?'italic':'normal'}}>{msg}</p>}
                {!msg && <div style={{height:'1rem'}}/>}
                <div style={{display:'flex',gap:'8px'}}>
                  <button onClick={()=>{setShowPopup(false);setMsg('')}} style={{flex:1,padding:'0.75rem',background:'white',border:'1px solid #ddd',borderRadius:'8px',fontSize:'14px',cursor:'pointer',color:'#666',fontFamily:'Georgia,serif'}}>Cancel</button>
                  <button onClick={checkNameAndProceed} disabled={checking} style={{flex:2,padding:'0.75rem',background:primary,color:'white',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'bold',cursor:checking?'not-allowed':'pointer',fontFamily:'Georgia,serif'}}>
                    {checking?'Checking...':'Continue →'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{fontSize:'20px',fontWeight:'bold',margin:'0 0 0.5rem'}}>Name already taken</h2>
                <p style={{fontSize:'14px',color:'#888',margin:'0 0 0.5rem',lineHeight:1.6}}>The name <strong>"{name}"</strong> already has a manual. Is that you?</p>
                <p style={{fontSize:'13px',color:'#888',margin:'0 0 1.25rem',lineHeight:1.6}}>If not, try <strong style={{color:'#1a1a18'}}>"{suggestedName}"</strong> instead.</p>
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  <button onClick={()=>startSession(name.trim())} style={{padding:'0.75rem',background:primary,color:'white',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'bold',cursor:'pointer',fontFamily:'Georgia,serif'}}>Yes, that's me — continue as {name}</button>
                  <button onClick={()=>startSession(suggestedName)} style={{padding:'0.75rem',background:'white',border:'1px solid #ddd',borderRadius:'8px',fontSize:'14px',cursor:'pointer',color:'#666',fontFamily:'Georgia,serif'}}>Use "{suggestedName}" instead</button>
                  <button onClick={()=>{setShowOverride(false);setShowPopup(false)}} style={{padding:'0.5rem',background:'transparent',border:'none',fontSize:'13px',cursor:'pointer',color:'#aaa',fontFamily:'Georgia,serif'}}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
