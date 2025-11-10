# UDash - Monorepo Structure

This project is now organized as a **monorepo** with separate backend and frontend folders.

## Directory Structure

```
HackUmass/
├── backend/              (Express API server)
│   ├── server.js
│   ├── package.json
│   ├── .env
│   └── .env.example
│
├── frontend/             (React + Vite app)
│   ├── App.tsx
│   ├── index.tsx
│   ├── vite.config.ts
│   ├── package.json
│   ├── components/
│   ├── hooks/
│   ├── public/
│   └── tsconfig.json
│
└── [root config files]
    ├── .gitignore
    ├── README.md
    └── package.json (root - optional)
```

## Local Development

### Start Backend
```bash
cd backend
npm install
npm run dev        # Runs on http://localhost:3001
```

### Start Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev        # Runs on http://localhost:3000 (or 3001, 3002, etc.)
```

## Deployment on Render

### Backend Deployment

1. **Create new Web Service on Render**
   - Connect GitHub repo: `benzislin2007-coder/HackUmass`
   - Set **Root Directory** to: `backend`
   - Set **Build Command** to: `npm install`
   - Set **Start Command** to: `npm run start`
   - Add **Environment Variables:**
     ```
     NODE_ENV=production
     PORT=3001
     ```
   - Deploy

2. **Get Backend URL**
   - After deployment, copy the service URL (e.g., `https://udash-backend.onrender.com`)
   - You'll need this for the frontend

### Frontend Deployment

1. **Create new Web Service on Render**
   - Connect GitHub repo: `benzislin2007-coder/HackUmass`
   - Set **Root Directory** to: `frontend`
   - Set **Build Command** to: `npm install && npm run build`
   - Set **Start Command** to: `npm run preview`
   - Add **Environment Variables:**
     ```
     VITE_API_URL=https://udash-backend.onrender.com
     ```
     (Replace with your actual backend URL)
   - Deploy

2. **Get Frontend URL**
   - After deployment, your app will be live at the provided Render URL

### Add Custom Domain

1. On **Frontend Service** → Settings → Custom Domain
2. Add your `.tech` domain (e.g., `udash.tech`)
3. Follow Render's instructions to update your domain's DNS records
4. Wait for DNS propagation (5-30 minutes)

## Important Notes

✅ **Root Directory is KEY**
- Backend service: Root Directory = `backend`
- Frontend service: Root Directory = `frontend`
- This tells Render which folder to deploy

✅ **Environment Variables**
- Frontend must know backend URL via `VITE_API_URL`
- Backend runs on PORT 3001 in production

✅ **Build Process**
- Frontend: `npm run build` creates optimized build
- Backend: Just needs `npm install` (no build step)

✅ **Health Check**
- Backend has `/healthz` endpoint for Render's health checks
- Should return `{ status: 'ok' }`

## Troubleshooting

**If frontend can't reach backend:**
- Check `VITE_API_URL` environment variable is set correctly
- Check backend is deployed and running
- Check CORS settings in `backend/server.js`

**If build fails:**
- Check the build logs in Render dashboard
- Make sure `package.json` in each folder has correct scripts
- Make sure `npm install` can run successfully

**To test locally before deploying:**
```bash
# Terminal 1: Backend
cd backend && npm install && npm run dev

# Terminal 2: Frontend  
cd frontend && npm install && npm run dev
```

Visit `http://localhost:3000` (or shown port) to test the app.
