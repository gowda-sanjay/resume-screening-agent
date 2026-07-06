# Mobile "Failed to Fetch" - Fix Guide

## Problem
Mobile devices are getting "Failed to fetch" when trying to upload files or run analysis.

## Root Cause
The frontend environment variable `VITE_API_BASE_URL` is not set in Netlify, so it defaults to `/api` which doesn't work for cross-domain requests.

## Solution (Immediate - 5 Minutes)

### Step 1: Get Your Backend URL
1. Go to https://dashboard.render.com
2. Find your `resume-screening-backend` service
3. Copy the URL (looks like: `https://resume-screening-backend-xxxxx.onrender.com`)

### Step 2: Update Netlify Environment Variable
1. Go to https://app.netlify.com
2. Select your site (`resume-screening-agent`)
3. Go to **Site Settings** → **Build & deploy** → **Environment**
4. Click **Edit variables**
5. Update/Add: 
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://resume-screening-backend-xxxxx.onrender.com`
6. Click **Save**

### Step 3: Trigger Rebuild
1. Go back to **Deployments** tab
2. Find latest deployment
3. Click the **...** menu
4. Select **Trigger deploy** → **Deploy site**
5. Wait for build to complete (2-5 minutes)

### Step 4: Test on Mobile
1. Clear browser cache (Ctrl+Shift+Delete or Settings)
2. Visit your Netlify URL on mobile
3. Try uploading files again

---

## Verification Steps

**Check if environment variable is set:**
1. Deploy completes
2. Go to **Site Settings** → **Build & deploy** → **Environment**
3. Confirm `VITE_API_BASE_URL` is there

**Test the API connection:**
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try uploading a file
4. Check the request URL - should be `https://your-backend-url/upload-jd`

**If still failing:**
- Check that Render backend is running (visit the URL in browser)
- Verify backend has CORS enabled (it does by default)
- Check Network tab for exact error message

---

## What Changed in Code

1. **App.jsx** - Better API URL detection for different environments
2. **netlify.toml** - Simplified SPA routing config
3. **.env.production** - Reference file for documentation

---

## For Future Deployments

When you push to GitHub:
1. Netlify auto-rebuilds
2. Environment variables are automatically applied
3. No manual steps needed!

Just make sure `VITE_API_BASE_URL` stays set in Netlify.
