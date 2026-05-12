'use client'
import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL
const QUESTIONS = ['Conditions I like to work in','Times/Hours I like to work','The best ways to communicate with me','The ways I like to receive feedback','Things I need','Things I struggle with','Things I love','Other things to know about me']

export default function AdminPage() {
  const [auth, setAuth] = useState(false)
  const [pw, setPw] = useState('')
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [userResponses, setUserResponses] = useState({})
  const [analysisUsers, setAnalysisUsers] = useState([])
  const [analysisQ, setAnalysisQ] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [loading, setLoading] = useState(false)

  const login = () => { if (pw === 'admin123') { setAuth(true); loadUsers() } else alert('Wrong password') }

  const loadUsers = async () => {
    if (!API_URL) return
    setLoading(true)
    try {
      const res = await fetch(API_URL, { method:'POST', body: new URLSearchParams({ action:'getUsers' }) })
      const data = await res.json()
      setUsers(data.users || [])
    } catch(e) {}
    setLoading(false)
  }

  const loadUserResponses = async (name) => {
    if (!API_URL) return
    try {
      const res = await fetch(API_URL, { method:'POST', body: new URLSearchParams({ action:'getUserResponses', name }) })
      const data = await res.json()
      setUserResponses(prev => ({ ...prev, [name]: data.responses || {} }))
    } catch(e) {}
  }

  const handleViewUser = async (name) => {
    if (selectedUser === name) { setSelectedUser(null); return }
    setSelectedUser(name)
    if (!userResponses[name]) await loadUserResponses(name)
  }

  const toggleAnalysisUser = (name) => {
    setAnalysisUsers(prev => prev.includes(name) ? prev.filter(u => u !== name) : [...prev, name])
  }

  const handleAnalyze = async () => {
    if (!analysisUsers.length || !analysisQ) return
    setAnalyzing(true)
    setAnalysis('')
    try {
      const responses = await Promise.all(analysisUsers.map(async (name) => {
        if (!userResponses[name]) await loadUserResponses(name)
        const qIdx = parseInt(analysisQ)
        return { name, refined: userResponses[name]?.[qIdx]?.refined || userResponses[name]?.[qIdx]?.raw || '' }
      }))
      const res = await fetch(API_URL, {
        method: 'POST',
        body: new URLSearchParams({ action:'analyzeQuestion', questionIndex:analysisQ, responses:JSON.stringify(responses) })
      })
      const data = await res.json()
      setAnalysis(data.analysis || 'No analysis returned.')
    } catch(e) { setAnalysis('Error running analysis.') }
    setAnalyzing(false)
  }

  const s = {
    page: { minHeight:'100vh', background:'#fffdf5', padding:'clamp(1rem,3vw,2rem)' },
    inner: { maxWidth:'960px', margin:'0 auto' },
    tabs: { display:'flex', gap:'4px', flexWrap:'wrap', marginBottom:'1.5rem', background:'#f0ede4', borderRadius:'10px', padding:'4px' },
    tab: (active) => ({ padding:'0.5rem 1rem', borderRadius:'8px', fontSize:'13px', fontWeight:'bold', cursor:'pointer', border:'none', background: active ? '#1a1a18' : 'transparent', color: active ? '#FFBF00' : '#666' }),
    card: { background:'white', borderRadius:'12px', border:'1px solid #e8e4da', padding:'1rem', marginBottom:'10px' },
    statGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:'10px', marginBottom:'1.5rem' },
    stat: { background:'white', border:'1px solid #e8e4da', borderRadius:'10px', padding:'1rem', textAlign:'center' },
    userRow: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.875rem', background:'white', borderRadius:'10px', border:'1px solid #e8e4da', marginBottom:'8px', flexWrap:'wrap', gap:'8px' },
    chip: (active) => ({ padding:'5px 12px', borderRadius:'20px', fontSize:'13px', cursor:'pointer', border: active ? '1px solid #1a1a18' : '1px solid #e0d8c8', background: active ? '#1a1a18' : 'white', color: active ? '#FFBF00' : '#1a1a18' }),
    btnDark: { padding:'0.75rem 1.5rem', background:'#1a1a18', color:'#FFBF00', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'bold', cursor:'pointer' },
  }

  if (!auth) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fffdf5', padding:'1rem' }}>
      <div style={{ background:'white', borderRadius:'16px', padding:'2rem', maxWidth:'360px', width:'100%', border:'1px solid #e8e4da' }}>
        <h1 style={{ fontSize:'22px', fontWeight:'bold', margin:'0 0 0.5rem' }}>Admin</h1>
        <p style={{ fontSize:'14px', color:'#888', margin:'0 0 1.25rem' }}>Enter admin password to continue.</p>
        <input type="password" placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()}
          style={{ width:'100%', padding:'0.75rem', border:'1px solid #ddd', borderRadius:'8px', fontSize:'14px', marginBottom:'0.75rem', outline:'none' }} />
        <button onClick={login} style={{ ...s.btnDark, width:'100%' }}>Enter</button>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'10px' }}>
          <h1 style={{ fontSize:'24px', fontWeight:'bold', margin:0 }}>Admin Dashboard</h1>
          <a href="/" style={{ fontSize:'13px', color:'#FF7900', textDecoration:'none', fontWeight:'bold' }}>← Back to site</a>
        </div>

        <div style={s.statGrid}>
          <div style={s.stat}><div style={{ fontSize:'28px', fontWeight:'bold', color:'#1a1a18' }}>{users.length}</div><div style={{ fontSize:'12px', color:'#888' }}>Users</div></div>
          <div style={s.stat}><div style={{ fontSize:'28px', fontWeight:'bold', color:'#FFBF00' }}>{users.filter(u => u.email).length}</div><div style={{ fontSize:'12px', color:'#888' }}>With email</div></div>
        </div>

        <div style={s.tabs}>
          {['users','analysis','compare','setup'].map(t => (
            t === 'setup' 
              ? <a key={t} href="/admin/setup" style={{...s.tab(false), textDecoration:'none', display:'inline-block'}}>Company Setup</a>
              : <button key={t} onClick={() => setTab(t)} style={s.tab(tab === t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>

        {tab === 'users' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <h2 style={{ fontSize:'16px', fontWeight:'bold', margin:0 }}>All users</h2>
              <button onClick={loadUsers} style={{ fontSize:'12px', color:'#888', background:'none', border:'1px solid #ddd', borderRadius:'6px', padding:'4px 10px', cursor:'pointer' }}>Refresh</button>
            </div>
            {loading && <p style={{ color:'#aaa', fontSize:'14px' }}>Loading...</p>}
            {users.map(u => (
              <div key={u.name}>
                <div style={s.userRow}>
                  <div>
                    <p style={{ fontWeight:'bold', fontSize:'15px', margin:0 }}>{u.name}</p>
                    <p style={{ fontSize:'12px', color:'#888', margin:0 }}>{u.email || 'No email'} · {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''}</p>
                  </div>
                  <div style={{ display:'flex', gap:'6px' }}>
                    <button onClick={() => handleViewUser(u.name)} style={{ fontSize:'12px', padding:'5px 10px', background:'white', border:'1px solid #ddd', borderRadius:'6px', cursor:'pointer', color:'#666' }}>
                      {selectedUser === u.name ? 'Hide' : 'View'}
                    </button>
                    <a href={`/profile/${encodeURIComponent(u.name)}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:'12px', padding:'5px 10px', background:'#1a1a18', color:'#FFBF00', borderRadius:'6px', textDecoration:'none', fontWeight:'bold' }}>Profile</a>
                  </div>
                </div>
                {selectedUser === u.name && userResponses[u.name] && (
                  <div style={{ background:'#fffbf0', borderRadius:'10px', border:'1px solid #f9e8cc', padding:'1rem', marginBottom:'10px' }}>
                    {QUESTIONS.map((q, i) => {
                      const r = userResponses[u.name][i]
                      return r ? (
                        <div key={i} style={{ marginBottom:'1rem', paddingBottom:'1rem', borderBottom:'1px solid #f0e8d8' }}>
                          <p style={{ fontSize:'11px', fontWeight:'bold', color:'#FF7900', textTransform:'uppercase', margin:'0 0 4px' }}>{i+1}. {q}</p>
                          <p style={{ fontSize:'13px', lineHeight:1.6, color:'#1a1a18', margin:0 }}>{r.refined || r.raw}</p>
                        </div>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'analysis' && (
          <div>
            <h2 style={{ fontSize:'16px', fontWeight:'bold', margin:'0 0 1rem' }}>AI Analysis</h2>
            <p style={{ fontSize:'13px', color:'#888', margin:'0 0 1rem' }}>Pick users and a question. Claude will analyze patterns across selected responses.</p>
            <p style={{ fontSize:'12px', fontWeight:'bold', color:'#666', textTransform:'uppercase', margin:'0 0 8px' }}>Select users</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'1rem' }}>
              {users.map(u => (
                <button key={u.name} onClick={() => toggleAnalysisUser(u.name)} style={s.chip(analysisUsers.includes(u.name))}>{u.name}</button>
              ))}
            </div>
            <p style={{ fontSize:'12px', fontWeight:'bold', color:'#666', textTransform:'uppercase', margin:'0 0 8px' }}>Select question</p>
            <select value={analysisQ} onChange={e => setAnalysisQ(e.target.value)}
              style={{ width:'100%', padding:'0.75rem', border:'1px solid #ddd', borderRadius:'8px', fontSize:'14px', marginBottom:'1rem', outline:'none', background:'white' }}>
              <option value=''>Pick a question...</option>
              {QUESTIONS.map((q, i) => <option key={i} value={i}>{i+1}. {q}</option>)}
            </select>
            <button onClick={handleAnalyze} disabled={analyzing || !analysisUsers.length || !analysisQ} style={{ ...s.btnDark, opacity: analyzing || !analysisUsers.length || !analysisQ ? 0.5 : 1, cursor: analyzing ? 'not-allowed' : 'pointer' }}>
              {analyzing ? 'Analyzing...' : '✦ Analyze with Claude'}
            </button>
            {analysis && (
              <div style={{ marginTop:'1.25rem', background:'white', borderRadius:'12px', border:'1px solid #e8e4da', padding:'1.25rem' }}>
                <p style={{ fontSize:'12px', fontWeight:'bold', color:'#FF7900', textTransform:'uppercase', margin:'0 0 0.75rem' }}>Analysis</p>
                <p style={{ fontSize:'14px', lineHeight:1.7, color:'#1a1a18', margin:0 }}>{analysis}</p>
              </div>
            )}
          </div>
        )}

        {tab === 'compare' && (
          <div>
            <h2 style={{ fontSize:'16px', fontWeight:'bold', margin:'0 0 0.5rem' }}>Compare profiles</h2>
            <p style={{ fontSize:'13px', color:'#888', margin:'0 0 1rem' }}>Select users then click Compare to go to the compare page.</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'1rem' }}>
              {users.map(u => (
                <button key={u.name} onClick={() => toggleAnalysisUser(u.name)} style={s.chip(analysisUsers.includes(u.name))}>{u.name}</button>
              ))}
            </div>
            <a href={`/compare/${analysisUsers.map(u => encodeURIComponent(u)).join('/')}`}
              style={{ ...s.btnDark, display:'inline-block', textDecoration:'none', opacity: analysisUsers.length >= 2 ? 1 : 0.4, pointerEvents: analysisUsers.length >= 2 ? 'auto' : 'none' }}>
              Compare {analysisUsers.length >= 2 ? `${analysisUsers.length} profiles →` : '(select 2+)'}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
