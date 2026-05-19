import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { companies } = await request.json()
    const token = process.env.GITHUB_TOKEN
    const repo = process.env.GITHUB_REPO || 'hjcodingwoo/manual-of-me'

    if (!token) return NextResponse.json({ error: 'No GitHub token configured' }, { status: 500 })

    const content = JSON.stringify(companies, null, 2)
    const encoded = Buffer.from(content).toString('base64')

    // Get current SHA
    const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/companies.json`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
    })
    const getData = await getRes.json()
    const sha = getData.sha

    // Push updated file
    const pushRes = await fetch(`https://api.github.com/repos/${repo}/contents/companies.json`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Update companies.json via admin setup',
        content: encoded,
        sha
      })
    })

    if (!pushRes.ok) {
      const err = await pushRes.json()
      return NextResponse.json({ error: err.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch(e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
