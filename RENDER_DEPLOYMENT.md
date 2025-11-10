# Render Deployment Guide for UDash

## What is .env file used for?

The `.env` file in `/backend/` contains **backend environment variables** for the Express server. The variables in `.env` are:
- `NODE_ENV=production` - Tells Node.js this is production
- `PORT=3001` - The port the backend listens on

## Step-by-Step Render Deployment

### Step 1: Deploy Backend Service

1. **Go to https://render.com** and sign up/login
2. Click **New +** → **Web Service**
3. Connect your GitHub repo (`benzislin2007-coder/HackUmass`)
4. Fill in the form:
   - **Name**: `udash-backend` (or whatever you want)
   - **Root Directory**: `backend` ← **This is important!**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Select Node.js

5. Click **Environment** tab and add these variables:
   ```
   NODE_ENV=production
   PORT=3001
   ```

6. Click **Deploy**
7. Wait for deployment to complete (5-10 minutes)
8. **Copy the backend URL** from the dashboard (e.g., `https://udash-backend.onrender.com`)

### Step 2: Deploy Frontend Service

1. Click **New +** → **Web Service** again
2. Connect the same repo: `benzislin2007-coder/HackUmass`
3. Fill in the form:
   - **Name**: `udash-frontend`
   - **Root Directory**: `frontend` ← **This is important!**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview`
   - **Environment**: Select Node.js

4. Click **Environment** tab and add this variable:
   ```
   VITE_API_URL=https://udash-backend.onrender.com
   ```
   (Replace with your actual backend URL from Step 1.8)

5. Click **Deploy**
6. Wait for deployment to complete
7. **Copy the frontend URL** (your live app URL)

### Step 3: Add Custom .tech Domain

1. On your **Frontend service** dashboard
2. Click **Settings** → look for **Custom Domain** section
3. Click **+ Add Custom Domain**
4. Enter your domain: `udash.tech`
5. Render will show you DNS records to add
6. Go to your domain registrar (GoDaddy, Namecheap, etc.)
7. Add those DNS records
8. Wait 5-30 minutes for DNS to propagate

### Done! 🎉

Your app will be live at:
- `https://udash.tech` (custom domain)
- `https://udash-frontend.onrender.com` (Render default domain)

---

## Important Notes

✅ **The .env file in /backend/ is OK to use for Render**
- It contains backend configuration
- Render will read it automatically
- You still need to set environment variables in Render's dashboard

✅ **Root Directory is KEY**
- Backend service: Root Directory = `backend`
- Frontend service: Root Directory = `frontend`

✅ **VITE_API_URL is CRITICAL**
- Frontend needs to know backend URL
- Set `VITE_API_URL` environment variable in frontend service on Render
- This tells frontend where to call the API

## Troubleshooting

**Frontend can't reach backend:**
- Check `VITE_API_URL` is set in frontend service environment
- Check backend is deployed and running
- Go to Logs tab to see errors

**Build fails on Render:**
- Check Root Directory is set correctly
- Check build logs in Logs tab
- Make sure `npm install` works in that folder

**DNS not working:**
- Clear browser cache (Cmd+Shift+R on Mac)
- Wait longer (DNS takes time)
- Check DNS records are added correctly
