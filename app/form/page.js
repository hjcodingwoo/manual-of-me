'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 8 work questions + 5 fun = 13 total
// Question index 8 is special "My Favorites" with 3 sub-inputs
const WORK_QUESTIONS = [
  { title:'Conditions I like to work in', chips:['I need quiet to focus','Background music helps me','Open office drains me','I prefer natural light','I work best from home','I like being in the office','Hybrid works best for me','I need a tidy workspace','I can work anywhere','I like a standing desk','Noise-cancelling headphones essential','Coffee shop buzz energizes me','I need do-not-disturb blocks','Cool temperature helps me','I need two monitors'] },
  { title:'Times/Hours I like to work', chips:['I\'m sharpest in the morning','I\'m a night owl','I need slow mornings','I start early, finish early','Afternoons are my low point','I protect mornings for deep work','No meetings before 10am','I don\'t work evenings','I\'m flexible with hours','I work in focused sprints','I need breaks between meetings','Back-to-back calls exhaust me','I exercise before work','I\'m in a different time zone','I work best 10am–2pm'] },
  { title:'The best ways to communicate with me', chips:['Slack for quick questions','Email for anything detailed','I prefer async over real-time','Please don\'t call without warning','I check messages twice a day','Short messages please','Give me full context upfront','Video calls for complex topics','I prefer written over verbal','Ask before booking my calendar','I keep my calendar up to date','I\'m direct — don\'t take it personally','I think out loud — bear with me','I need time to process','WhatsApp for urgent things only'] },
  { title:'The ways I like to receive feedback', chips:['Be direct, I can handle it','Use the sandwich method','Private, not in front of others','Give me examples, not just labels','Written first, then discuss','Face to face is best','I need time to process first','Tell me the impact','Be specific, not vague','Include what I should do differently','Positive feedback matters too','I want regular feedback','I welcome challenge — push me','Be honest even if it\'s hard','I take feedback personally at first'] },
  { title:'Things I need', chips:['Clear goals and priorities','Autonomy on how I work','Context on why we\'re doing this','Time to think before deciding','Regular 1:1s with my manager','Recognition when I do good work','Creative freedom','Structured processes','Psychological safety to speak up','Space to make mistakes','Clarity on decisions and ownership','To see the bigger picture','Work that connects to real impact','A manager who has my back','Deep work time blocked off'] },
  { title:'Things I struggle with', chips:['Ambiguity without direction','Back-to-back meetings','Being micromanaged','Unnecessary process','People pleasing','Saying no','Switching tasks quickly','Last-minute changes','Working without clear purpose','Passive-aggressive behaviour','Meetings without an agenda','Perfectionism — I go too deep','Asking for help','Conflict — I avoid it','Imposter syndrome'] },
  { title:'Things I love', chips:['Solving hard problems','Connecting ideas across teams','Creative brainstorms','Helping others grow','Seeing the impact of my work','Learning new things','Deep focused work','Presenting to an audience','Shipping things quickly','Building things from scratch','Cross-functional collaboration','Mentoring people','Data and patterns','Working with autonomy','Big picture strategy'] },
  { title:'Other things to know about me', chips:['I\'m an introvert','I\'m an extrovert','I\'m an ambivert','I bring my whole self to work','I name the elephant in the room','Fairness matters a lot to me','I have a dark sense of humour','I\'m very literal — say what you mean','I have caring responsibilities','I\'m neurodivergent','I value honesty over comfort','Silence means I\'m thinking','I over-commit — remind me'] },
]

const FUN_QUESTIONS = [
  { title:'Guilty pleasure', chips:['Reality TV','Fast food','Sleeping in','Binge watching','Online shopping','Scrolling social media','Karaoke','Instant noodles','True crime podcasts','Celebrity gossip'] },
  { title:'Dietary restrictions', chips:['No restrictions — I eat everything','Vegetarian','Vegan','Halal','Kosher','Gluten-free','Dairy-free','No pork','No beef','Pescatarian','Allergic to nuts','Allergic to shellfish'] },
  { title:'Hobbies', chips:['Running','Gym','Yoga','Hiking','Cooking','Reading','Gaming','Photography','Music','Art/drawing','Travel','Cycling','Swimming','Dancing','Gardening','Film/TV','Meditation'] },
  { title:'Personality type (MBTI or other)', chips:['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP','Type A','Type B','Highly sensitive person','Ambivert'] },
]

// Total steps: 8 work + 1 favorites page + 4 fun = 13
const TOTAL = 13

export default function FormPage() {
  const [currentQ, setCurrentQ] = useState(0)
  // responses[0-7] = work, responses[8] = {food,show,city}, responses[9-12] = fun
  const [responses, setResponses] = useState(Array(13).fill(null).map(() => ({ raw:'', refined:'' })))
  const [favorites, setFavorites] = useState({ food:'', show:'', city:'' })
  const [rawText, setRawText] = useState('')
  const [selectedChips, setSelectedChips] = useState(Array(13).fill([]))
  const [userName, setUserName] = useState('')
  const [draftKey, setDraftKey] = useState(null)
  const [savedMsg, setSavedMsg] = useState('')
  const router = useRouter()

  useEffect(() => {
    const name = sessionStorage.getItem('userName')
    if (!name) { router.push('/'); return }
    setUserName(name)
    const key = sessionStorage.getItem('draftKey')
    if (key) {
      setDraftKey(key)
      try {
        const saved = localStorage.getItem(key)
        if (saved) {
          const p = JSON.parse(saved)
          if (p.responses) { setResponses(p.responses); setSelectedChips(p.chips || Array(13).fill([])) }
          if (p.favorites) setFavorites(p.favorites)
          setRawText(p.responses?.[0]?.raw || '')
        }
      } catch(e) {}
    }
    const editIdx = sessionStorage.getItem('editIndex')
    if (editIdx !== null) { setCurrentQ(parseInt(editIdx)); sessionStorage.removeItem('editIndex') }
  }, [])

  useEffect(() => {
    if (currentQ !== 8) setRawText(responses[currentQ]?.raw || '')
    else setRawText('')
  }, [currentQ])

  const saveDraft = (resp, chips, favs) => {
    if (!draftKey) return
    localStorage.setItem(draftKey, JSON.stringify({ responses: resp, chips, favorites: favs }))
  }

  const toggleChip = (chip) => {
    const current = selectedChips[currentQ] || []
    const newChips = current.includes(chip) ? current.filter(c => c !== chip) : [...current, chip]
    const updatedChips = selectedChips.map((c, i) => i === currentQ ? newChips : c)
    setSelectedChips(updatedChips)
    // Use responses[currentQ].raw as source of truth (not rawText state which may be stale)
    const currentRaw = responses[currentQ]?.raw || ''
    const chipsText = newChips.map(c => `• ${c}`).join('\n')
    const manualLines = currentRaw.split('\n').filter(l => !l.startsWith('• '))
    const newText = chipsText + (manualLines.join('\n').trim() ? '\n' + manualLines.join('\n').trim() : '')
    setRawText(newText)
    const updated = responses.map((r, i) => i === currentQ ? { ...r, raw: newText } : r)
    setResponses(updated)
    saveDraft(updated, updatedChips, favorites)
  }

  const updateRaw = (text) => {
    setRawText(text)
    const updated = responses.map((r, i) => i === currentQ ? { ...r, raw: text } : r)
    setResponses(updated)
    saveDraft(updated, selectedChips, favorites)
  }

  const updateFavorite = (key, val) => {
    const newFavs = { ...favorites, [key]: val }
    setFavorites(newFavs)
    // Store favorites as combined raw text in responses[8]
    const combined = `Food: ${newFavs.food}\nTV show/movie: ${newFavs.show}\nCity/country: ${newFavs.city}`
    const updated = responses.map((r, i) => i === 8 ? { ...r, raw: combined } : r)
    setResponses(updated)
    saveDraft(updated, selectedChips, newFavs)
  }

  const goNext = () => {
    saveDraft(responses, selectedChips, favorites)
    setSavedMsg('Saved!'); setTimeout(() => setSavedMsg(''), 1500)
    setTimeout(() => {
      if (currentQ < TOTAL - 1) setCurrentQ(currentQ + 1)
      else { sessionStorage.setItem('responses', JSON.stringify(responses)); router.push('/review') }
    }, 200)
  }

  const pct = Math.round((currentQ / TOTAL) * 100)
  const isFavPage = currentQ === 8
  const isFunQ = currentQ > 8
  const workQ = currentQ < 8 ? WORK_QUESTIONS[currentQ] : null
  const funQ = currentQ > 8 ? FUN_QUESTIONS[currentQ - 9] : null

  return (
    <div style={{ minHeight:'100vh', padding:'clamp(1rem,3vw,1.5rem)', background:'#fffdf5', fontFamily:'Georgia,serif', color:'#1a1a18' }}>
      <div style={{ maxWidth:'800px', margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <button onClick={() => router.push('/')} style={{ background:'transparent', border:'1px solid #ddd', color:'#666', padding:'0.4rem 0.875rem', borderRadius:'8px', fontSize:'13px', cursor:'pointer' }}>← Home</button>
          {savedMsg && <span style={{ fontSize:'13px', color:'#FF7900', fontWeight:'bold' }}>{savedMsg}</span>}
        </div>

        {currentQ === 8 && (
          <div style={{ background:'#FF7900', color:'white', borderRadius:'10px', padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'13px', textAlign:'center' }}>
            🎉 Work questions done! Now for the fun part...
          </div>
        )}

        <div style={{ height:'4px', background:'#e8e4da', borderRadius:'2px', marginBottom:'4px' }}>
          <div style={{ height:'4px', background: isFunQ || isFavPage ? '#FFBF00' : '#FF7900', borderRadius:'2px', width:`${pct}%`, transition:'width 0.3s' }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1rem' }}>
          <span style={{ fontSize:'12px', color:'#FF7900', fontWeight:'bold' }}>{pct}%</span>
          <span style={{ fontSize:'12px', color:'#aaa' }}>{currentQ + 1} / {TOTAL}</span>
        </div>

        {/* FAVORITES PAGE */}
        {isFavPage && (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'1.5rem' }}>
              <span style={{ fontSize:'11px', fontWeight:'bold', background:'#FFBF00', color:'#1a1a18', padding:'2px 8px', borderRadius:'10px', textTransform:'uppercase' }}>Fun</span>
              <h1 style={{ fontSize:'clamp(18px,4vw,26px)', fontWeight:'bold', margin:0 }}>My Favorites</h1>
            </div>
            {[
              { key:'food', label:'🍜 Favorite food', placeholder:'e.g. sushi, pasta, my mum\'s cooking...' },
              { key:'show', label:'🎬 Favorite TV show or movie', placeholder:'e.g. Succession, Studio Ghibli, anything Nolan...' },
              { key:'city', label:'🌏 Favorite city or country', placeholder:'e.g. Tokyo, anywhere with a beach...' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} style={{ marginBottom:'1rem' }}>
                <label style={{ fontSize:'13px', fontWeight:'bold', color:'#666', display:'block', marginBottom:'6px' }}>{label}</label>
                <input
                  type="text" value={favorites[key]}
                  onChange={e => updateFavorite(key, e.target.value)}
                  placeholder={placeholder}
                  style={{ width:'100%', padding:'0.75rem', border:'1px solid #e0d8c8', borderRadius:'8px', fontSize:'14px', outline:'none', background:'white', color:'#1a1a18', fontFamily:'Georgia,serif' }}
                />
              </div>
            ))}
          </>
        )}

        {/* WORK QUESTIONS */}
        {!isFavPage && !isFunQ && workQ && (
          <>
            <h1 style={{ fontSize:'clamp(18px,4vw,26px)', fontWeight:'bold', margin:'0 0 0.25rem' }}>{workQ.title}</h1>
            <p style={{ fontSize:'13px', color:'#aaa', margin:'0 0 1rem' }}>Tap to add · tap again to remove</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'12px' }}>
              {workQ.chips.map((chip, i) => {
                const active = (selectedChips[currentQ] || []).includes(chip)
                return <button key={i} onClick={() => toggleChip(chip)} style={{ padding:'6px 12px', background: active ? '#1a1a18' : 'white', color: active ? '#FFBF00' : '#1a1a18', border: active ? '1px solid #1a1a18' : '1px solid #e0d8c8', borderRadius:'20px', fontSize:'13px', cursor:'pointer', transition:'all 0.15s' }}>{chip}</button>
              })}
            </div>
            <p style={{ fontSize:'12px', color:'#aaa', margin:'0 0 6px' }}>Add your own notes below</p>
            <textarea value={rawText} onChange={e => updateRaw(e.target.value)} placeholder="Your notes appear here. Add more detail or type freely..."
              style={{ width:'100%', minHeight:'clamp(100px,20vw,160px)', padding:'0.875rem', border:'1px solid #e0d8c8', borderRadius:'8px', fontSize:'14px', lineHeight:1.6, resize:'vertical', outline:'none', background:'white', color:'#1a1a18', fontFamily:'Georgia,serif' }} />
          </>
        )}

        {/* FUN QUESTIONS */}
        {isFunQ && funQ && (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'0.25rem' }}>
              <span style={{ fontSize:'11px', fontWeight:'bold', background:'#FFBF00', color:'#1a1a18', padding:'2px 8px', borderRadius:'10px', textTransform:'uppercase' }}>Fun</span>
              <h1 style={{ fontSize:'clamp(18px,4vw,26px)', fontWeight:'bold', margin:0 }}>{funQ.title}</h1>
            </div>
            <p style={{ fontSize:'13px', color:'#aaa', margin:'0.25rem 0 1rem' }}>Tap to add · tap again to remove</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'12px' }}>
              {funQ.chips.map((chip, i) => {
                const active = (selectedChips[currentQ] || []).includes(chip)
                return <button key={i} onClick={() => toggleChip(chip)} style={{ padding:'6px 12px', background: active ? '#1a1a18' : 'white', color: active ? '#FFBF00' : '#1a1a18', border: active ? '1px solid #1a1a18' : '1px solid #e0d8c8', borderRadius:'20px', fontSize:'13px', cursor:'pointer', transition:'all 0.15s' }}>{chip}</button>
              })}
            </div>
            <p style={{ fontSize:'12px', color:'#aaa', margin:'0 0 6px' }}>Or type your own</p>
            <textarea value={rawText} onChange={e => updateRaw(e.target.value)} placeholder="Type freely..."
              style={{ width:'100%', minHeight:'80px', padding:'0.875rem', border:'1px solid #e0d8c8', borderRadius:'8px', fontSize:'14px', lineHeight:1.6, resize:'vertical', outline:'none', background:'white', color:'#1a1a18', fontFamily:'Georgia,serif' }} />
          </>
        )}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'1.25rem' }}>
          <button onClick={() => currentQ > 0 && setCurrentQ(currentQ - 1)} disabled={currentQ === 0}
            style={{ padding:'0.75rem 1.5rem', background:'white', border:'1px solid #ddd', borderRadius:'8px', fontSize:'14px', fontWeight:'bold', cursor: currentQ === 0 ? 'not-allowed' : 'pointer', color: currentQ === 0 ? '#ccc' : '#1a1a18' }}>← Back</button>
          <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', maxWidth:'200px', justifyContent:'center' }}>
            {Array(TOTAL).fill(0).map((_, i) => (
              <div key={i} onClick={() => setCurrentQ(i)}
                style={{ width: i === currentQ ? '18px' : '6px', height:'6px', borderRadius:'3px', background: i < currentQ ? '#FFBF00' : i === currentQ ? '#FF7900' : '#e0d8c8', cursor:'pointer', transition:'all 0.2s' }} />
            ))}
          </div>
          <button onClick={goNext} style={{ padding:'0.75rem 1.5rem', background:'#FF7900', color:'white', border:'none', borderRadius:'8px', fontSize:'14px', fontWeight:'bold', cursor:'pointer' }}>
            {currentQ === TOTAL - 1 ? 'Review →' : 'Save & Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
