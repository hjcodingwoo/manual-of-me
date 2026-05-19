// AI client that uses Claude by default, Gemini for HK/China IPs
// Called from frontend — detects region and routes accordingly

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL

export async function detectRegion() {
  try {
    const res = await fetch('https://ipapi.co/json/')
    const data = await res.json()
    const country = data.country_code || ''
    return { country, isHKorChina: country === 'HK' || country === 'CN' || country === 'MO' }
  } catch(e) {
    return { country: '', isHKorChina: false }
  }
}

export async function refineWithAI(rawText, questionTitle, isHKorChina = false) {
  const prompt = `You are a professional writer helping someone articulate their working style for their team.

Question: ${questionTitle}

Transform these raw notes into a warm, authentic paragraph (2-3 sentences, ~80 words max). Preserve their voice. Be specific. No jargon.

Output ONLY the paragraph. No preamble.

Raw notes:
${rawText}`

  if (isHKorChina && GEMINI_API_KEY) {
    // Use Gemini
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 200 } })
    })
    const data = await res.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  } else {
    // Use Claude via Apps Script
    const res = await fetch(API_URL, { method: 'POST', body: new URLSearchParams({ action: 'refine', rawText, questionTitle }) })
    const data = await res.json()
    return data.refined || ''
  }
}

export async function analyzeWithAI(action, params, isHKorChina = false) {
  const isOverall = params.questionIndex === -1
  let prompt
  if (isOverall) {
    prompt = `Analyze these personal operating manuals. Plain prose only, no markdown. 3 short paragraphs: (1) what this team has in common, (2) key differences, (3) one concrete recommendation. Max 150 words.\n\n${params.allText}`
  } else {
    const allAnswers = params.responses.map(r => `${r.name}: ${r.refined || r.raw || 'no answer'}`).join('\n')
    prompt = `Question: ${params.questionTitle}\n\nResponses:\n${allAnswers}\n\nPlain prose only, no markdown. 3 short paragraphs: (1) common themes, (2) key contrasts, (3) one actionable suggestion. Max 120 words.`
  }

  if (isHKorChina && GEMINI_API_KEY) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 350 } })
    })
    const data = await res.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  } else {
    const res = await fetch(API_URL, {
      method: 'POST',
      body: new URLSearchParams({ action: 'analyzeQuestion', questionIndex: params.questionIndex, responses: JSON.stringify(params.responses) })
    })
    const data = await res.json()
    return data.analysis || ''
  }
}
