# RelicID — Deployment Guide

## What's in this project

```
relicid/
├── app/
│   ├── api/
│   │   ├── scan/route.js        ← Quick scan API (keeps your API key hidden)
│   │   └── deep-scan/route.js   ← Deep scan API (web search enabled)
│   ├── layout.js                ← HTML wrapper, fonts, metadata
│   ├── globals.css              ← Base styles
│   └── page.js                  ← Loads the app
├── components/
│   └── RelicID.js               ← The full app
├── .env.local.example           ← Template for your API key
├── .gitignore
├── next.config.mjs
├── package.json
└── README.md                    ← You're reading this
```

## Step-by-Step Deployment

### 1. Install Node.js (if you don't have it)
- Go to https://nodejs.org
- Download the LTS version
- Install it (just click Next through everything)
- To verify: open a terminal/command prompt and type `node --version`

### 2. Set up the project locally
- Unzip the relicid folder to somewhere on your computer (e.g., Desktop)
- Open a terminal/command prompt
- Navigate to the folder: `cd Desktop/relicid` (or wherever you put it)
- Run: `npm install`
- This will download all dependencies (takes about 30 seconds)

### 3. Add your API key
- Copy `.env.local.example` to `.env.local`
- Open `.env.local` in a text editor
- Replace `sk-ant-your-key-here` with your actual Anthropic API key
- Save the file

### 4. Test locally (optional but recommended)
- Run: `npm run dev`
- Open http://localhost:3000 in your browser
- Try scanning something to make sure it works
- Press Ctrl+C to stop the server when done

### 5. Deploy to Vercel (FREE hosting)

Option A — Easy way (through Vercel website):
1. Go to https://vercel.com and sign up (free, use your GitHub account)
2. Push this project to a GitHub repository
3. In Vercel, click "Add New Project"
4. Import your GitHub repo
5. In the "Environment Variables" section, add:
   - Name: ANTHROPIC_API_KEY
   - Value: (paste your API key)
6. Click Deploy
7. Vercel gives you a URL like relicid.vercel.app — your app is live!

Option B — Command line:
1. Install Vercel CLI: `npm install -g vercel`
2. Run: `vercel`
3. Follow the prompts (say Yes to everything)
4. When asked about environment variables, add ANTHROPIC_API_KEY
5. Done — Vercel gives you a live URL

### 6. Connect your domain (getrelicid.com)

After deploying to Vercel:
1. In your Vercel dashboard, go to your project → Settings → Domains
2. Type `getrelicid.com` and click Add
3. Vercel will show you DNS records to add
4. Go to Namecheap → Domain List → click Manage on getrelicid.com
5. Go to Advanced DNS
6. Delete any existing A records or CNAME records
7. Add the records Vercel showed you (usually a CNAME pointing to cname.vercel-dns.com)
8. Wait 5-30 minutes for DNS to propagate
9. getrelicid.com is now live!

## Important Notes

- Your API key is NEVER exposed to users — it stays on the server
- The free Vercel plan handles plenty of traffic for starting out
- Local storage is used for collections (each user's data stays on their device)
- Scan limits are tracked client-side for now (3/day free)

## Cost Monitoring

- Check your API usage at console.anthropic.com
- Quick scans cost ~$0.01-0.03 each
- Deep scans cost ~$0.05-0.15 each
- Your $10 spending limit will protect you while testing
