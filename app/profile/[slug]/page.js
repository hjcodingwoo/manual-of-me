'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

const QUESTIONS = ['Conditions I like to work in','Times/Hours I like to work','The best ways to communicate with me','The ways I like to receive feedback','Things I need','Things I struggle with','Things I love','Other things to know about me']
const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [name, setName] = useState('')
  const [responses, setResponses] = useState(Array(8).fill(''))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [shareStatus, setShareStatus] = useState('idle')
  const [compareName, setCompareName] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)

  useEffect(() => {
    if (!params?.slug) return
    const decoded = decodeURIComponent(params.slug)
    setName(decoded)
    fetchResponses(decoded)
  }, [params])

  const fetchResponses = async (userName) => {
    if (!API_URL) { setError('App not configured.'); setLoading(false); return }
    try {
      const res = await fetch(API_URL, { method:'POST', body: new URLSearchParams({ action:'getUserResponses', name:userName }) })
      const data = await res.json()
      if (data.responses && Object.keys(data.responses).length > 0) {
        const arr = Array(8).fill('')
        Object.entries(data.responses).forEach(([idx, val]) => { arr[parseInt(idx)] = val.refined || val.raw || '' })
        setResponses(arr)
      } else {
        setError('No manual found for this name.')
      }
    } catch(e) { setError('Could not load profile.') }
    setLoading(false)
  }

  const handleShare = async () => {
    if (!shareEmail.trim() || !shareEmail.includes('@')) return
    setShareStatus('sending')
    try {
      await fetch(API_URL, {
        method: 'POST',
        body: new URLSearchParams({ action:'sendEmail', name, email:shareEmail.trim(), responses:JSON.stringify(responses) }),
      })
      setShareStatus('sent')
      setTimeout(() => { setShowShareModal(false); setShareEmail(''); setShareStatus('idle') }, 1500)
    } catch(e) { setShareStatus('idle') }
  }

  const inviteUrl = 'https://themanualofme.vercel.app'
  const handleCopyInvite = () => { navigator.clipboard.writeText(inviteUrl); setInviteCopied(true); setTimeout(() => setInviteCopied(false), 2000) }
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent('Create your personal Manual of Me — help your team understand how you work best: ' + inviteUrl)}`

  const handleCompare = () => {
    if (!compareName.trim().toLowerCase()) return
    router.push(`/compare/${encodeURIComponent(name)}/${encodeURIComponent(compareName.trim().toLowerCase())}`)
  }

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#fffdf5',color:'#aaa',fontFamily:'Georgia,serif'}}>Loading...</div>

  if (error) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#fffdf5',padding:'2rem',fontFamily:'Georgia,serif'}}>
      <div style={{textAlign:'center'}}>
        <p style={{fontSize:'40px',marginBottom:'1rem'}}>🔍</p>
        <h1 style={{fontSize:'24px',fontWeight:'bold',color:'#1a1a18',marginBottom:'0.5rem'}}>Not found</h1>
        <p style={{color:'#888',marginBottom:'2rem'}}>{error}</p>
        <button onClick={() => router.push('/')} style={{padding:'0.75rem 1.5rem',background:'#1a1a18',color:'white',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'bold',cursor:'pointer',fontFamily:'Georgia,serif'}}>Go home</button>
      </div>
    </div>
  )

  return (
    <div style={{background:'#fffdf5',minHeight:'100vh',padding:'clamp(1rem,3vw,2rem)',fontFamily:'Georgia,serif',color:'#1a1a18'}}>
      <div style={{maxWidth:'900px',margin:'0 auto'}}>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'2rem',flexWrap:'wrap',gap:'10px'}}>
          <div>
            <div style={{fontSize:'12px',color:'#aaa',marginBottom:'0.25rem',textTransform:'uppercase',letterSpacing:'0.5px'}}>Manual of Me</div>
            <h1 style={{fontSize:'clamp(28px,6vw,42px)',fontWeight:'bold',color:'#1a1a18',margin:0,lineHeight:1.1}}>{name}</h1>
          </div>
          <button onClick={() => router.push('/')} style={{fontSize:'13px',color:'#aaa',background:'transparent',border:'none',cursor:'pointer',textDecoration:'underline',fontFamily:'Georgia,serif'}}>← Home</button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,280px),1fr))',gap:'12px',marginBottom:'2rem'}}>
          {responses.map((response, idx) => (
            <div key={idx} style={{background:'white',borderRadius:'12px',border:'1px solid #e8e4da',padding:'1.25rem'}}>
              <h3 style={{fontSize:'11px',fontWeight:'bold',color:'#FFBF00',textTransform:'uppercase',letterSpacing:'0.5px',margin:'0 0 0.75rem'}}>{idx+1}. {QUESTIONS[idx]}</h3>
              <p style={{fontSize:'14px',lineHeight:1.7,color:response?'#1a1a18':'#ccc',margin:0,fontStyle:response?'normal':'italic'}}>{response||'Not answered'}</p>
            </div>
          ))}
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:'8px',maxWidth:'400px',margin:'0 auto'}}>
          <button onClick={() => setShowShareModal(true)}
            style={{padding:'0.875rem',background:'#1a1a18',color:'#FFBF00',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'bold',cursor:'pointer',fontFamily:'Georgia,serif'}}>
            📧 Share with teammate
          </button>
          <button onClick={() => { setShowCompareModal(true); setCompareName('') }}
            style={{padding:'0.875rem',background:'white',border:'1px solid #ddd',color:'#1a1a18',borderRadius:'8px',fontSize:'14px',fontWeight:'bold',cursor:'pointer',fontFamily:'Georgia,serif'}}>
            ⚡ Compare with someone
          </button>
          <button onClick={() => setShowInviteModal(true)}
            style={{padding:'0.875rem',background:'#f0ede4',border:'1px solid #e8e4da',color:'#1a1a18',borderRadius:'8px',fontSize:'14px',fontWeight:'bold',cursor:'pointer',fontFamily:'Georgia,serif'}}>
            ✉️ Invite others to create theirs
          </button>
        </div>

      </div>

      {showShareModal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'1rem'}}>
          <div style={{background:'white',borderRadius:'16px',padding:'1.5rem',maxWidth:'360px',width:'100%',fontFamily:'Georgia,serif'}}>
            <h2 style={{fontSize:'18px',fontWeight:'bold',margin:'0 0 0.5rem'}}>Share with teammate</h2>
            <p style={{fontSize:'13px',color:'#888',margin:'0 0 1rem'}}>Send {name}'s manual to a colleague.</p>
            <input type="email" placeholder="their@email.com" value={shareEmail} onChange={e=>setShareEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleShare()}
              style={{width:'100%',padding:'0.75rem',border:'1px solid #ddd',borderRadius:'8px',fontSize:'14px',marginBottom:'0.75rem',outline:'none',fontFamily:'Georgia,serif'}}/>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={()=>{setShowShareModal(false);setShareEmail('');setShareStatus('idle')}}
                style={{flex:1,padding:'0.75rem',background:'white',border:'1px solid #ddd',borderRadius:'8px',fontSize:'14px',cursor:'pointer',color:'#666',fontFamily:'Georgia,serif'}}>Cancel</button>
              <button onClick={handleShare} disabled={shareStatus!=='idle'}
                style={{flex:2,padding:'0.75rem',background:shareStatus==='sent'?'#4a9a4a':'#1a1a18',color:shareStatus==='sent'?'white':'#FFBF00',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'bold',cursor:shareStatus!=='idle'?'not-allowed':'pointer',fontFamily:'Georgia,serif'}}>
                {shareStatus==='idle'?'Send':shareStatus==='sending'?'Sending...':'✓ Sent!'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompareModal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'1rem'}}>
          <div style={{background:'white',borderRadius:'16px',padding:'1.5rem',maxWidth:'380px',width:'100%',fontFamily:'Georgia,serif'}}>
            <h2 style={{fontSize:'18px',fontWeight:'bold',margin:'0 0 0.5rem'}}>Compare with someone</h2>
            <p style={{fontSize:'13px',color:'#888',margin:'0 0 0.25rem',lineHeight:1.6}}>Enter the name they used when creating their manual.</p>
            <p style={{fontSize:'12px',color:'#FF7900',margin:'0 0 1rem',fontWeight:'bold'}}>Tip: ask them "what name did you use on the app?"</p>
            <input type="text" placeholder="Their app name" value={compareName} onChange={e=>setCompareName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleCompare()}
              style={{width:'100%',padding:'0.75rem',border:'1px solid #ddd',borderRadius:'8px',fontSize:'14px',marginBottom:'0.75rem',outline:'none',fontFamily:'Georgia,serif'}}/>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={()=>{setShowCompareModal(false);setCompareName('')}}
                style={{flex:1,padding:'0.75rem',background:'white',border:'1px solid #ddd',borderRadius:'8px',fontSize:'14px',cursor:'pointer',color:'#666',fontFamily:'Georgia,serif'}}>Cancel</button>
              <button onClick={handleCompare} disabled={!compareName.trim().toLowerCase()}
                style={{flex:2,padding:'0.75rem',background:compareName.trim().toLowerCase()?'#1a1a18':'#e8e4da',color:compareName.trim().toLowerCase()?'#FFBF00':'#aaa',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'bold',cursor:compareName.trim().toLowerCase()?'pointer':'not-allowed',fontFamily:'Georgia,serif'}}>
                Compare →
              </button>
            </div>
          </div>
        </div>
      )}

      {showInviteModal && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'1rem'}}>
          <div style={{background:'white',borderRadius:'16px',padding:'1.5rem',maxWidth:'380px',width:'100%',fontFamily:'Georgia,serif'}}>
            <h2 style={{fontSize:'18px',fontWeight:'bold',margin:'0 0 0.5rem'}}>Invite others</h2>
            <p style={{fontSize:'13px',color:'#888',margin:'0 0 1.25rem',lineHeight:1.6}}>Share the app so your teammates can create their own Manual of Me.</p>
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <button onClick={handleCopyInvite}
                style={{padding:'0.875rem',background:'#1a1a18',color:'#FFBF00',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'bold',cursor:'pointer',fontFamily:'Georgia,serif'}}>
                {inviteCopied ? '✓ Link copied!' : '🔗 Copy invite link'}
              </button>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                style={{display:'block',padding:'0.875rem',background:'#25D366',color:'white',borderRadius:'8px',fontSize:'14px',fontWeight:'bold',textAlign:'center',textDecoration:'none',fontFamily:'Georgia,serif'}}>
                💬 Share via WhatsApp
              </a>
              <button onClick={() => setShowInviteModal(false)}
                style={{padding:'0.75rem',background:'white',border:'1px solid #ddd',borderRadius:'8px',fontSize:'14px',cursor:'pointer',color:'#666',fontFamily:'Georgia,serif'}}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
