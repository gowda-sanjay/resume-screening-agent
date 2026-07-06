# 🚀 Production Deployment Guide

## Prerequisites
- GitHub account (https://github.com)
- Render account (https://render.com) 
- Netlify account (https://netlify.com)

---

## Step 1: Push Project to GitHub

### 1.1 Create a GitHub Repository
1. Go to https://github.com/new
2. Repository name: `resume-screening-agent`
3. Description: `AI-powered resume screening agent with semantic similarity matching`
4. Choose **Public** or **Private**
5. Click **Create repository**

### 1.2 Push Code to GitHub (Run in Terminal)

```powershell
cd C:\Users\Sanjay Gowda\OneDrive\Desktop\resume-screening-agent

# Initialize git
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: Resume screening agent with React frontend and FastAPI backend"

# Add remote origin (replace YOUR_USERNAME and repo name)
git remote add origin https://github.com/YOUR_USERNAME/resume-screening-agent.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

### 2.1 Create Render Web Service

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Select **GitHub** and authorize Render
4. Choose your `resume-screening-agent` repository
5. Click **Connect**

### 2.2 Configure Backend Service

**Settings:**
- **Name:** `resume-screening-backend`
- **Environment:** `Docker`
- **Region:** `Ohio` (US East)
- **Branch:** `main`
- **Root Directory:** `backend` *(Optional - if Render doesn't auto-detect)*

**Advanced Settings:**
- Leave Build & Start commands blank (uses Dockerfile)
- No environment variables needed for free tier

### 2.3 Deploy

1. Select Plan: **Free** (included)
2. Click **Create Web Service**
3. Wait 2-3 minutes for deployment
4. **Copy the service URL** when ready (e.g., `https://resume-screening-backend-xxxxx.onrender.com`)

---

## Step 3: Deploy Frontend to Netlify

### 3.1 Connect GitHub to Netlify

1. Go to https://app.netlify.com
2. Click **Add new site** → **Import an existing project**
3. Click **GitHub** and authorize
4. Select `resume-screening-agent` repository
5. Click **Install** if prompted

### 3.2 Configure Frontend Build

**Build Settings:**
- **Base directory:** `frontend` *(or leave blank if auto-detected)*
- **Build command:** `npm run build`
- **Publish directory:** `dist`

### 3.3 Set Environment Variable

**Critical Step - Add Backend URL:**

1. Before deploying, click **Show advanced**
2. Click **New variable**
3. Set:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://resume-screening-backend-xxxxx.onrender.com` *(your Render URL from Step 2.4)*
4. Click **Save**

### 3.4 Deploy

1. Scroll down and click **Deploy site**
2. Wait for build to complete (2-5 minutes)
3. **Your site URL** will appear (e.g., `https://resume-screening-agent.netlify.app`)

---

## Step 4: Test Production Deployment

1. Go to your Netlify URL
2. Try uploading a job description and resumes
3. Run the analysis
4. Verify results display correctly

**If you get "Failed to fetch" errors:**
- Check environment variable: `VITE_API_BASE_URL` is set correctly in Netlify
- Verify Render backend is running (visit backend URL in browser)
- Check browser console (F12) for detailed errors

---

## Step 5: Automatic Deployments

Once connected to GitHub:
- **Push to GitHub** → Render auto-deploys backend
- **Push to GitHub** → Netlify auto-deploys frontend

No manual deployment needed after initial setup!

---

## Troubleshooting

### Backend Errors on Render
- **504 Gateway Timeout:** Backend is spinning up (free tier sleeps after 15 min)
  - Solution: Wait 30-60 seconds for startup
  
- **502 Bad Gateway:** Check backend logs in Render dashboard
  - Go to Logs tab and look for Python errors

### Frontend Not Connecting to Backend
- **Wrong VITE_API_BASE_URL:** Update in Netlify Site settings → Build & deploy
- **CORS errors:** Backend CORS is already configured (`allow_origins=["*"]`)
- **File uploads fail:** Check backend storage directories

### Render Free Tier Limitations
- Spins down after 15 min of inactivity (causes slow first request)
- 0.5GB RAM, shared CPU
- Best for demos/testing
- **Upgrade to Starter** for production ($7/month)

### Netlify Free Tier Limitations
- Perfect for this app! No limitations for frontend
- Auto-deploys on GitHub push
- Free SSL certificate included

---

## Final Checklist

- [ ] GitHub repository created and pushed
- [ ] Render backend deployed and URL copied
- [ ] Netlify frontend deployed with `VITE_API_BASE_URL` set
- [ ] Test upload/analysis works on production
- [ ] Share your live URL!

---

## Your Production URLs

Once deployed, you'll have:

**Frontend:** `https://your-app-name.netlify.app`

**Backend:** `https://your-app-name.onrender.com`

**API Endpoint:** `https://your-app-name.onrender.com/upload-jd`

---

## Need Help?

- **Netlify Support:** https://support.netlify.com
- **Render Support:** https://render.com/docs
- **FastAPI:** https://fastapi.tiangolo.com
- **React:** https://react.dev

Good luck! 🚀
