'use client'
import { useState, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL

export default function SetupPage() {
  const [auth, setAuth] = useState(false)
  const [pw, setPw] = useState('')
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ company_name:'', slug:'', logo_url:'', primary_color:'#FF7900', secondary_color:'#FFBF00', tertiary_color:'#fffdf5' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [editIdx, setEditIdx] = useState(null)
  const [deploying, setDeploying] = useState(false)

  const login = () => { if (pw === 'admin123') { setAuth(true); loadCompanies() } else alert('Wrong password') }

  const loadCompanies = async () => {
    setLoading(true)
    try {
      const res = await fetch(API_URL, { method:'POST', body: new URLSearchParams({ action:'getCompanies' }) })
      const data = await res.json()
      setCompanies(data.companies || [])
    } catch(e) {}
    setLoading(false)
  }

  const pushCompaniesToGitHub = async (updatedCompanies) => {
    setDeploying(true)
    try {
      const companiesObj = {}
      updatedCompanies.forEach(c => {
        companiesObj[c.slug] = {
          slug: c.slug,
          company_name: c.company_name,
          logo_url: c.logo_url || '',
          primary_color: c.primary_color || '#FF7900',
          secondary_color: c.secondary_color || '#FFBF00',
          tertiary_color: c.tertiary_color || '#fffdf5',
          status: c.status || 'active'
        }
      })
      const res = await fetch('/api/push-companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: companiesObj })
      })
      const data = await res.json()
      if (data.success) setMsg(prev => prev + ' · GitHub updated · Vercel redeploying (~60s)')
      else setMsg(prev => prev + ' · GitHub push failed: ' + data.error)
    } catch(e) {
      setMsg(prev => prev + ' · GitHub push failed')
    }
    setDeploying(false)
  }

  const handleSave = async () => {
    if (!form.company_name.trim() || !form.slug.trim()) { setMsg('Company name and slug are required.'); return }
    const slug = form.slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    setSaving(true); setMsg('')
    try {
      const res = await fetch(API_URL, { method:'POST', body: new URLSearchParams({ action:'saveCompany', ...form, slug }) })
      const data = await res.json()
      if (data.success) {
        setMsg(`✓ Saved: themanualofme.vercel.app/${slug}`)
        // Build updated list for GitHub push
        const existing = companies.filter(c => c.slug !== slug)
        const updated = [...existing, { ...form, slug, status: 'active' }]
        setCompanies(updated)
        await pushCompaniesToGitHub(updated)
        setForm({ company_name:'', slug:'', logo_url:'', primary_color:'#FF7900', secondary_color:'#FFBF00', tertiary_color:'#fffdf5' })
        setEditIdx(null)
        loadCompanies()
      } else setMsg('Error: ' + (data.error || 'Unknown'))
    } catch(e) { setMsg('Failed to save.') }
    setSaving(false)
  }

  const handleEdit = (c, i) => {
    setForm({ company_name:c.company_name, slug:c.slug, logo_url:c.logo_url||'', primary_color:c.primary_color||'#FF7900', secondary_color:c.secondary_color||'#FFBF00', tertiary_color:c.tertiary_color||'#fffdf5' })
    setEditIdx(i); setMsg('')
  }

  const handleToggle = async (slug, currentStatus) => {
    try {
      await fetch(API_URL, { method:'POST', body: new URLSearchParams({ action:'toggleCompany', slug, status: currentStatus === 'active' ? 'suspended' : 'active' }) })
      const updated = companies.map(c => c.slug === slug ? { ...c, status: currentStatus === 'active' ? 'suspended' : 'active' } : c)
      setCompanies(updated)
      await pushCompaniesToGitHub(updated)
    } catch(e) {}
  }

  const s = {
    page: { minHeight:'100vh', background:'#fffdf5', padding:'clamp(1rem,3vw,2rem)', fontFamily:'Georgia,serif' },
    inner: { maxWidth:'900px', margin:'0 auto' },
    label: { fontSize:'11px', fontWeight:'bold', color:'#666', textTransform:'uppercase', display:'block', marginBottom:'4px', letterSpacing:'0.5px' },
    input: { width:'100%', padding:'0.75rem', border:'1px solid #ddd', borderRadius:'8px', fontSize:'14px', outline:'none', fontFamily:'Georgia,serif', marginBottom:'0.75rem', boxSizing:'border-box' },
    card: { background:'white', borderRadius:'12px', border:'1px solid #e8e4da', padding:'1.25rem', marginBottom:'10px' },
    btnDark: { padding:'0.75rem 1.5rem', background:'#1a1a18', color:'#FFBF00', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'bold', cursor:'pointer', fontFamily:'Georgia,serif' },
    btnLight: { padding:'0.5rem 0.875rem', background:'white', border:'1px solid #ddd', borderRadius:'8px', fontSize:'13px', cursor:'pointer', fontFamily:'Georgia,serif', color:'#666' },
  }

  if (!auth) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#fffdf5',padding:'1rem',fontFamily:'Georgia,serif'}}>
      <div style={{background:'white',borderRadius:'16px',padding:'2rem',maxWidth:'360px',width:'100%',border:'1px solid #e8e4da'}}>
        <h1 style={{fontSize:'22px',fontWeight:'bold',margin:'0 0 0.5rem'}}>Company Setup</h1>
        <p style={{fontSize:'14px',color:'#888',margin:'0 0 1.25rem'}}>Admin access only.</p>
        <input type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} style={s.input}/>
        <button onClick={login} style={{...s.btnDark,width:'100%'}}>Enter</button>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2rem',flexWrap:'wrap',gap:'10px'}}>
          <h1 style={{fontSize:'24px',fontWeight:'bold',margin:0}}>Company Setup</h1>
          <div style={{display:'flex',gap:'10px'}}>
            <a href="/admin" style={{fontSize:'13px',color:'#FF7900',textDecoration:'none',fontWeight:'bold'}}>← Admin</a>
            <a href="/" style={{fontSize:'13px',color:'#aaa',textDecoration:'none'}}>← Site</a>
          </div>
        </div>

        <div style={{...s.card, marginBottom:'2rem', borderColor:'#FF7900'}}>
          <h2 style={{fontSize:'16px',fontWeight:'bold',margin:'0 0 1rem'}}>{editIdx !== null ? 'Edit company' : 'Add new company'}</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,260px),1fr))',gap:'0 16px'}}>
            <div>
              <label style={s.label}>Company name</label>
              <input value={form.company_name} onChange={e=>setForm(p=>({...p,company_name:e.target.value}))} placeholder="e.g. Beyond Border" style={s.input}/>
            </div>
            <div>
              <label style={s.label}>URL slug</label>
              <input value={form.slug} onChange={e=>setForm(p=>({...p,slug:e.target.value}))} placeholder="e.g. beyondborder" style={s.input}/>
              {form.slug && <p style={{fontSize:'11px',color:'#888',margin:'-0.5rem 0 0.75rem'}}>themanualofme.vercel.app/{form.slug.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')}</p>}
            </div>
            <div>
              <label style={s.label}>Logo URL</label>
              <input value={form.logo_url} onChange={e=>setForm(p=>({...p,logo_url:e.target.value}))} placeholder="https://..." style={s.input}/>
              {form.logo_url && <img src={form.logo_url} alt="preview" style={{height:'32px',objectFit:'contain',marginBottom:'0.75rem'}} onError={e=>e.target.style.display='none'}/>}
            </div>
          </div>

          <div style={{background:'#f9f9f9',borderRadius:'10px',padding:'1rem',marginBottom:'1rem'}}>
            <p style={{fontSize:'12px',fontWeight:'bold',color:'#666',textTransform:'uppercase',letterSpacing:'0.5px',margin:'0 0 1rem'}}>Colors — mix and match as you like</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'12px'}}>
              {[
                { key:'primary_color', label:'Primary — buttons & accents', default:'#FF7900' },
                { key:'secondary_color', label:'Secondary — text highlights', default:'#FFBF00' },
                { key:'tertiary_color', label:'Tertiary — page background', default:'#fffdf5' },
              ].map(({key,label,default:def})=>(
                <div key={key}>
                  <label style={s.label}>{label}</label>
                  <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                    <input type="color" value={form[key]||def} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}
                      style={{width:'44px',height:'38px',border:'1px solid #ddd',borderRadius:'6px',cursor:'pointer',padding:'2px',flexShrink:0}}/>
                    <input value={form[key]||def} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} placeholder={def}
                      style={{...s.input,margin:0,flex:1,fontFamily:'monospace',fontSize:'13px'}}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{marginTop:'1rem',padding:'1rem',background:form.tertiary_color||'#fffdf5',borderRadius:'8px',border:'1px solid #e8e4da'}}>
              <p style={{fontSize:'11px',color:'#888',margin:'0 0 8px',textTransform:'uppercase',letterSpacing:'0.5px'}}>Preview</p>
              <button style={{padding:'8px 16px',background:form.primary_color||'#FF7900',color:'white',border:'none',borderRadius:'6px',fontSize:'13px',fontWeight:'bold',marginRight:'8px',cursor:'default'}}>Button</button>
              <span style={{fontSize:'14px',color:form.secondary_color||'#FFBF00',fontWeight:'bold'}}>Accent text</span>
            </div>
          </div>

          {msg && <p style={{fontSize:'13px',color:msg.startsWith('✓')?'#4a9a4a':'#cc4400',margin:'0 0 0.75rem',lineHeight:1.6}}>{msg}</p>}
          {deploying && <p style={{fontSize:'13px',color:'#888',margin:'0 0 0.75rem'}}>⏳ Pushing to GitHub and triggering Vercel redeploy...</p>}
          <div style={{display:'flex',gap:'8px'}}>
            <button onClick={handleSave} disabled={saving||deploying} style={{...s.btnDark,opacity:saving||deploying?0.6:1}}>
              {saving?'Saving...':deploying?'Deploying...':editIdx!==null?'Update company':'Deploy company →'}
            </button>
            {editIdx !== null && <button onClick={()=>{setEditIdx(null);setForm({company_name:'',slug:'',logo_url:'',primary_color:'#FF7900',secondary_color:'#FFBF00',tertiary_color:'#fffdf5'});setMsg('')}} style={s.btnLight}>Cancel</button>}
          </div>
        </div>

        <h2 style={{fontSize:'16px',fontWeight:'bold',margin:'0 0 1rem'}}>All companies ({companies.length})</h2>
        {loading && <p style={{color:'#aaa',fontSize:'14px'}}>Loading...</p>}
        {companies.map((c,i) => (
          <div key={i} style={{...s.card,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'10px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
              {c.logo_url && <img src={c.logo_url} alt={c.company_name} style={{height:'28px',objectFit:'contain'}} onError={e=>e.target.style.display='none'}/>}
              <div>
                <p style={{fontWeight:'bold',fontSize:'15px',margin:0}}>{c.company_name}</p>
                <p style={{fontSize:'12px',color:'#888',margin:0}}>
                  <a href={`/${c.slug}`} target="_blank" rel="noopener noreferrer" style={{color:'#FF7900',textDecoration:'none'}}>/{c.slug}</a>
                  {' · '}<span style={{color:c.status==='active'?'#4a9a4a':'#cc4400'}}>{c.status||'active'}</span>
                  {' · '}Users: {c.user_count||0} · Refines: {c.refine_count||0}
                </p>
              </div>
            </div>
            <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
              <div style={{width:'16px',height:'16px',borderRadius:'50%',background:c.primary_color||'#FF7900',border:'1px solid #ddd',title:'primary'}}/>
              <div style={{width:'16px',height:'16px',borderRadius:'50%',background:c.secondary_color||'#FFBF00',border:'1px solid #ddd'}}/>
              <div style={{width:'16px',height:'16px',borderRadius:'50%',background:c.tertiary_color||'#fffdf5',border:'1px solid #ddd'}}/>
              <button onClick={()=>handleEdit(c,i)} style={s.btnLight}>Edit</button>
              <button onClick={()=>handleToggle(c.slug,c.status||'active')} style={{...s.btnLight,color:c.status==='suspended'?'#4a9a4a':'#cc4400'}}>
                {c.status==='suspended'?'Activate':'Suspend'}
              </button>
              <a href={`/${c.slug}`} target="_blank" rel="noopener noreferrer" style={{...s.btnLight,textDecoration:'none',color:'#FF7900',fontWeight:'bold'}}>View ↗</a>
            </div>
          </div>
        ))}
        {!loading && companies.length===0 && <p style={{color:'#aaa',fontSize:'14px'}}>No companies yet. Add one above.</p>}
      </div>
    </div>
  )
}
