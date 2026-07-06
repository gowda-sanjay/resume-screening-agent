# Deployment Guide - Resume Screening Agent

## Deployment Architecture

- **Frontend**: Netlify (React + Vite)
- **Backend**: Render or Railway (FastAPI Python)

---

## Step 1: Deploy Backend to Render

### 1.1 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub

### 1.2 Prepare Backend for Deployment
1. Push your project to GitHub (if not already done)
2. The backend already has a `Dockerfile` - no changes needed

### 1.3 Deploy on Render
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Select your GitHub repo
4. Fill in the configuration:
   - **Name**: `resume-screening-backend`
   - **Region**: `Ohio` (US East)
   - **Branch**: `main`
   - **Runtime**: `Docker`
   - **Build Command**: (leave blank - uses Dockerfile)
   - **Start Command**: (leave blank)
5. Under **Advanced**:
   - **Environment Variables**: None needed initially
6. Select Plan: **Free** (included)
7. Click **"Create Web Service"**

### 1.4 Get Your Backend URL
Once deployed, Render will give you a URL like: `https://resume-screening-backend.onrender.com`

Save this URL - you'll need it for the frontend!

---

## Step 2: Deploy Frontend to Netlify

### 2.1 Create Netlify Account
1. Go to https://netlify.com
2. Sign up with GitHub

### 2.2 Deploy on Netlify
1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Select **GitHub** and authorize
4. Choose your GitHub repo
5. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click **"Show advanced"** → **"New variable"**
7. Add environment variable:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://resume-screening-backend.onrender.com` (your Render backend URL)
8. Click **"Deploy site"**

### 2.3 Wait for Build
Netlify will build and deploy automatically. You'll see the build progress in the dashboard.

---

## Step 3: Test the Deployment

1. Go to your Netlify URL (e.g., `https://your-app-name.netlify.app`)
2. Try uploading a job description and resumes
3. Run the analysis

If you get "Failed to fetch" errors:
- Check that the `VITE_API_BASE_URL` environment variable is set correctly in Netlify
- Verify the backend is running on Render
- Check the browser console (F12) for specific error messages

---

## Troubleshooting

### "Failed to fetch" errors
- Verify the backend URL is correct in Netlify environment variables
- Check if Render backend is running: visit `https://your-backend-url/` in browser
- Look for CORS errors in browser console

### Backend is slow to respond
- Render free tier spins down after 15 minutes of inactivity
- First request may take 30-60 seconds to wake up

### Files not uploading
- Check file size limits (typically 100MB on Netlify)
- Verify backend storage directories exist in Render

---

## Updating Deployment

**To redeploy after code changes:**

1. **Backend**: Push to GitHub → Render auto-deploys
2. **Frontend**: Push to GitHub → Netlify auto-deploys

Both services have automatic CI/CD on push to main branch.

---

## Cost Estimates

- **Netlify**: Free tier (perfect for this app)
- **Render**: Free tier with limitations:
  - Spins down after 15 min inactivity
  - 0.5GB RAM, shared CPU
  - Suitable for testing/demo

For production, upgrade Render to a paid plan.
