# Netlify Deployment Guide for AUDIT AI Frontend

## Quick Deployment Steps

### 1. Push Frontend to GitHub (if not already done)

```bash
cd frontend
git init
git add .
git commit -m "Initial commit - AUDIT AI Frontend"
git remote add origin https://github.com/YOUR_USERNAME/audit-ai-frontend.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Netlify

1. Go to https://netlify.com
2. Sign up/Login with GitHub
3. Click **"Add new site"** → **"Import an existing project"**
4. Choose **GitHub**
5. Select your `audit-ai-frontend` repository
6. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
7. Click **"Deploy site"**

### 3. Add Environment Variable

After Railway backend is deployed:

1. Netlify Dashboard → Your site → **Site configuration** → **Environment variables**
2. Add variable:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://your-railway-backend-url.up.railway.app`
3. Click **"Save"**
4. Trigger redeploy: **Deploys** → **Trigger deploy** → **Deploy site**

---

## Complete Deployment Order

**Do these in order:**

1. ✅ **Backend to Railway** (already set up)

   - Deploy from GitHub
   - Add `GEMINI_API_KEY` environment variable
   - Get your Railway URL

2. ✅ **Frontend to Netlify**
   - Push frontend to GitHub
   - Deploy to Netlify
   - Add `VITE_API_BASE_URL` with Railway URL
   - Redeploy

---

## Frontend .gitignore

Make sure frontend has this `.gitignore`:

```
node_modules/
dist/
.env
.env.local
.DS_Store
```

---

## After Deployment

Your app will be live at:

- **Frontend**: `https://your-site-name.netlify.app`
- **Backend**: `https://your-app.up.railway.app`

---

Good luck with deployment! 🚀
