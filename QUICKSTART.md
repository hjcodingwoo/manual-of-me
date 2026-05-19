# Manual of Me - Quick Start

## What You Have

A complete web app for creating personal operating manuals with:

✅ Beautiful landing page with all 8 questions  
✅ 8-step form (one question per page)  
✅ Raw + Refined side-by-side (Claude API refinement)  
✅ Review page before publishing  
✅ Shareable profile with password protection  
✅ Email with refined manual + credentials  
✅ Admin dashboard (view by user or by question)  
✅ On-demand AI team insights  

## File Structure

```
manual-of-me/
├── app/
│   ├── layout.js           # Root layout
│   ├── page.js             # Landing page (/)
│   ├── globals.css         # Global styles
│   ├── form/page.js        # Form pages (/form)
│   ├── review/page.js      # Review page (/review)
│   ├── completion/page.js  # Success page (/completion)
│   ├── profile/[slug]/page.js  # Shareable profile (/profile/[name])
│   └── admin/page.js       # Admin dashboard (/admin)
├── Code.gs                 # Google Apps Script backend
├── .env.local.example      # Environment template
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── README.md               # Full setup guide
└── .gitignore
```

## 3-Step Setup

### 1. Google Apps Script
- Create new project at script.google.com
- Paste Code.gs content
- Replace: CLAUDE_API_KEY, EMAIL, SHEET_ID
- Deploy as "Web app" → copy deployment URL

### 2. Google Sheet
- Create new sheet
- Copy sheet ID
- Paste in Code.gs
- Create tabs: Users, Responses

### 3. Vercel
- Push to GitHub
- Connect to Vercel
- Add env var: NEXT_PUBLIC_APPS_SCRIPT_URL
- Deploy!

## Default Admin Password

**admin123** (case-sensitive)

## Admin Dashboard

- **/admin** - Login with admin password
- **View by User** - See each person's complete manual
- **View by Question** - See all answers to one question + AI analysis

## Customization

- **Colors**: Edit tailwind.config.js (Primary: #FFBF00, Dark: #FF7900)
- **Fonts**: Already set to serif (Georgia/Garamond)
- **Images**: All Unsplash (auto-loaded)
- **Icons**: Emoji throughout (can swap for SVG)
- **Questions**: Edit const QUESTIONS array in app files

## Key Design Decisions

- **Token efficient**: ~200 tokens per refine, on-demand analysis only
- **Warm aesthetic**: Serif fonts, yellow/orange colors, ample whitespace
- **User-first**: Raw + Refined side-by-side, review before publish
- **Privacy**: Password-protected profiles, hashed passwords
- **Team-focused**: Admin dashboard for understanding group dynamics

---

**Everything is ready to go. Just:**

1. Get your Claude API key
2. Create the Google Apps Script & Sheet
3. Deploy to Vercel
4. Share with your team!

Good luck! 🎉
