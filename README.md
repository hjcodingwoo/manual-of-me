# Manual of Me - Setup Guide

This is a complete Personal Operating Manual application that helps teams understand how each member works, their needs, and how to collaborate best.

## Stack

- **Frontend**: Next.js + React + Tailwind CSS
- **Backend**: Google Apps Script
- **Database**: Google Sheets
- **APIs**: Claude API (for text refinement), Gmail API (for emails)
- **Deployment**: Vercel

## Setup Instructions

### Step 1: Create Google Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Create a new project
3. Copy the entire contents of `Code.gs` into the editor
4. Replace these placeholders:
   - `YOUR_CLAUDE_API_KEY` → Your Claude API key from [console.anthropic.com](https://console.anthropic.com)
   - `YOUR_EMAIL@gmail.com` → Your Gmail address
   - `YOUR_SHEET_ID` → The ID of your Google Sheet (see Step 2)

### Step 2: Create Google Sheet

1. Create a new Google Sheet
2. Copy the ID from the URL: `docs.google.com/spreadsheets/d/[THIS_PART]`
3. Paste it in Code.gs as `SHEET_ID`
4. Create these sheets (tabs):
   - `Users` (columns: name, password_hash, created_at)
   - `Responses` (columns: name, question_index, raw_text, refined_text, created_at)

### Step 3: Deploy Google Apps Script

1. In the Apps Script editor, click **"Deploy"** → **"New deployment"**
2. Select type: **Web app**
3. Settings:
   - Execute as: Your account
   - Who has access: Anyone
4. Copy the deployment URL (looks like: `https://script.google.com/macros/d/.../usercontent/exec`)

### Step 4: Setup Frontend

1. Clone this repo
2. Install dependencies: `npm install`
3. Create `.env.local`:
   ```
   NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/d/YOUR_DEPLOYMENT_ID/usercontent/exec
   ```
4. Test locally: `npm run dev` (visit http://localhost:3000)

### Step 5: Deploy to Vercel

1. Push to GitHub
2. Connect repo to Vercel
3. Vercel will auto-detect Next.js and deploy
4. Visit your live site!

## Pages

- **`/`** - Landing page (intro + all 8 questions + name input)
- **`/form`** - Form pages (one question per page with raw + refined)
- **`/review`** - Review all answers before publishing
- **`/completion`** - Success page with shareable link + credentials
- **`/profile/[name]`** - Public shareable profile (password-protected)
- **`/admin`** - Admin dashboard (password: "admin123")

## Admin Dashboard Features

### View by User
- Expandable cards for each team member
- All 8 answers visible side-by-side
- Search by name

### View by Question
- Grid of all team answers to one question
- 🤖 "Generate AI Analysis" button (on-demand)
- Shows team patterns and insights

## API Costs (Rough Estimate)

For a team of 20 people:
- **Refining**: ~200 tokens per person × 8 questions = ~32,000 tokens ($0.16)
- **Admin analysis**: ~400 tokens per click = negligible
- **Total**: < $0.20 for full team

## Color Theme

- Primary: `#FFBF00` (warm yellow)
- Secondary: `#F2CF7E` (soft yellow)
- Accent: `#FFE642` (bright yellow)
- Dark: `#FF7900` (orange)

## Font

Professional serif font (Georgia/Garamond) for warm, human feel

## Key Features

✅ Multi-page form with progress tracking  
✅ Claude API refinement (inline, live)  
✅ Raw + Refined side-by-side  
✅ Review before publish  
✅ Shareable profiles with password protection  
✅ Real-time email with credentials  
✅ Admin dashboard (by user + by question)  
✅ On-demand AI team insights  
✅ Token-efficient API calls  
✅ Warm, human-centered design  

## Troubleshooting

### "Unknown action" error
- Check Apps Script deployment is live
- Verify APPS_SCRIPT_URL in `.env.local`

### Refine button not working
- Check Claude API key in Code.gs
- Verify API key has Anthropic access

### Profile page shows "Invalid password"
- Password is auto-generated at publish time
- Check Google Sheet `Users` tab has the correct password hash

### Admin dashboard not loading
- Default password is "admin123" (case-sensitive)
- Check SHEET_ID is correct in Code.gs

## Next Steps

1. Set up all environment variables
2. Test with your own account
3. Invite team to fill out manuals
4. Use admin dashboard to understand team dynamics
5. Share insights with team for better collaboration

---

**Questions?** Check out the Code.gs and app files—they're well-commented!
