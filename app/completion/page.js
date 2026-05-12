'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL

function CompletionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [extraEmail, setExtraEmail] = useState('')
  const [sentEmails, setSentEmails] = useState([])
  const [sendingEmail, setSendingEmail] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const n = searchParams.get('name')
    if (!n) { router.push('/'); return }
    setName(n)
    const e = sessionStorage.getItem('userEmail') || ''
    setEmail(e)
  }, [searchParams, router])

  const profileUrl = `https://themanualofme.vercel.app/profile/${encodeURIComponent(name)}`

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendEmail = async (targetEmail) => {
    if (!targetEmail.trim() || sentEmails.includes(targetEmail.trim())) return
    const emailAddr = targetEmail.trim()
    setSendingEmail(emailAddr)
    try {
      const responses = JSON.parse(sessionStorage.getItem('responses') || '[]')
      const refined = responses.map(r => r?.refined || r?.raw || '')
      await fetch(API_URL, {
        method: 'POST',
        body: new URLSearchParams({
          action: 'sendEmail',
          name,
          email: emailAddr,
          responses: JSON.stringify(refined),
        }),
      })
      setSentEmails(prev => [...prev, emailAddr])
      setExtraEmail('')
    } catch(e) {
      alert('Failed to send email.')
    }
    setSendingEmail(null)
  }

  return (
    <div style={{minHeight:'100vh', background:'#fffdf5', padding:'clamp(1rem,3vw,2rem)'}}>
      <div style={{maxWidth:'580px', margin:'0 auto'}}>

        <div style={{textAlign:'center', marginBottom:'2.5rem'}}>
          <div style={{fontSize:'56px', marginBottom:'1rem'}}>🎉</div>
          <h1 style={{fontSize:'32px', fontWeight:'bold', color:'#1a1a18', marginBottom:'0.5rem'}}>Your Manual is live!</h1>
          <p style={{fontSize:'15px', color:'#888', lineHeight:1.7, margin:0}}>Your team can now understand how you work best.</p>
        </div>

        <div style={{background:'white', borderRadius:'12px', border:'1px solid #e8e4da', padding:'1.5rem', marginBottom:'1.5rem'}}>
          <h2 style={{fontSize:'13px', fontWeight:'bold', color:'#1a1a18', textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 1rem'}}>View your profile</h2>
          <button onClick={() => router.push(`/profile/${encodeURIComponent(name)}`)}
            style={{width:'100%', padding:'0.875rem', background:'linear-gradient(135deg,#FFBF00,#FF7900)', color:'#1a1a18', border:'none', borderRadius:'8px', fontSize:'15px', fontWeight:'bold', cursor:'pointer', marginBottom:'0.75rem'}}>
            View My Profile →
          </button>
          <p style={{fontSize:'12px', color:'#aaa', margin:'0 0 0.75rem'}}>or share this link with your team:</p>
          <div style={{display:'flex', gap:'8px', alignItems:'center', background:'#fffbf0', padding:'0.75rem', borderRadius:'8px', border:'1px solid #f9e8cc', marginBottom:'0.5rem'}}>
            <span style={{flex:1, fontSize:'12px', fontFamily:'monospace', color:'#1a1a18', wordBreak:'break-all'}}>{profileUrl}</span>
            <button onClick={handleCopy}
              style={{padding:'0.4rem 0.75rem', background:'white', border:'1px solid #ddd', borderRadius:'6px', fontSize:'12px', cursor:'pointer', fontWeight:'bold', flexShrink:0}}>
              {copied ? '✓' : '🔗'}
            </button>
          </div>
          <p style={{fontSize:'11px', color:'#aaa', margin:0}}>No password needed to view</p>
        </div>

        <div style={{background:'white', borderRadius:'12px', border:'1px solid #e8e4da', padding:'1.5rem', marginBottom:'1.5rem'}}>
          <h2 style={{fontSize:'13px', fontWeight:'bold', color:'#1a1a18', textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 0.75rem'}}>Email a copy</h2>
          {email && (
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.75rem', background:'#f9f9f9', borderRadius:'8px', marginBottom:'0.75rem'}}>
              <span style={{fontSize:'13px', color:'#666'}}>{email}</span>
              {sentEmails.includes(email) ? (
                <span style={{fontSize:'12px', color:'#4a9a4a', fontWeight:'bold'}}>✓ Sent</span>
              ) : (
                <button onClick={() => sendEmail(email)} disabled={sendingEmail === email}
                  style={{padding:'0.4rem 0.75rem', background: sendingEmail === email ? '#e8e4da' : '#1a1a18', color: sendingEmail === email ? '#aaa' : '#FFBF00', border:'none', borderRadius:'6px', fontSize:'12px', fontWeight:'bold', cursor:'pointer'}}>
                  {sendingEmail === email ? '...' : 'Send'}
                </button>
              )}
            </div>
          )}
          {sentEmails.filter(e => e !== email).map(e => (
            <div key={e} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.75rem', background:'#f9f9f9', borderRadius:'8px', marginBottom:'0.75rem'}}>
              <span style={{fontSize:'13px', color:'#666'}}>{e}</span>
              <span style={{fontSize:'12px', color:'#4a9a4a', fontWeight:'bold'}}>✓ Sent</span>
            </div>
          ))}
          <div style={{display:'flex', gap:'8px'}}>
            <input type="email" placeholder="Add another email" value={extraEmail} onChange={e => setExtraEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendEmail(extraEmail)}
              style={{flex:1, padding:'0.75rem', border:'1px solid #ddd', borderRadius:'8px', fontSize:'13px', outline:'none'}} />
            <button onClick={() => sendEmail(extraEmail)} disabled={sendingEmail || !extraEmail.trim()}
              style={{padding:'0.75rem 1rem', background: extraEmail.trim() ? '#1a1a18' : '#e8e4da', color: extraEmail.trim() ? '#FFBF00' : '#aaa', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'bold', cursor: extraEmail.trim() ? 'pointer' : 'not-allowed', flexShrink:0}}>
              {sendingEmail === extraEmail ? '...' : 'Send'}
            </button>
          </div>
        </div>

        <div style={{background:'white', borderRadius:'12px', border:'1px solid #e8e4da', padding:'1.5rem', marginBottom:'2rem'}}>
          <h2 style={{fontSize:'13px', fontWeight:'bold', color:'#1a1a18', textTransform:'uppercase', letterSpacing:'0.5px', margin:'0 0 0.75rem'}}>Retrieve your info</h2>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
            <div style={{background:'#f9f9f9', padding:'0.875rem', borderRadius:'8px'}}>
              <p style={{fontSize:'11px', color:'#999', textTransform:'uppercase', margin:'0 0 0.25rem'}}>Name</p>
              <p style={{fontSize:'14px', fontFamily:'monospace', fontWeight:'bold', color:'#1a1a18', margin:0}}>{name}</p>
            </div>
            <div style={{background:'#f9f9f9', padding:'0.875rem', borderRadius:'8px'}}>
              <p style={{fontSize:'11px', color:'#999', textTransform:'uppercase', margin:'0 0 0.25rem'}}>Email</p>
              <p style={{fontSize:'13px', fontFamily:'monospace', fontWeight:'bold', color:'#1a1a18', margin:0, wordBreak:'break-all'}}>{email || '—'}</p>
            </div>
          </div>
          <p style={{fontSize:'12px', color:'#aaa', margin:'0.75rem 0 0'}}>Use these to resume or update your manual anytime.</p>
        </div>

        <a href="/" style={{display:'block', textAlign:'center', fontSize:'13px', color:'#aaa', textDecoration:'none'}}>← Back to home</a>

      </div>
    </div>
  )
}

export default function CompletionPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fffdf5'}}>Loading...</div>}>
      <CompletionContent />
    </Suspense>
  )
}
