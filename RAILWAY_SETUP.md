# Railway Deployment - Separate Frontend & Backend

## Setup Two Railway Projects

### Project 1: Frontend (React/Vite)

1. Go to Railway.app → New Project
2. Connect your GitHub repository (HackUmass)
3. Configure:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run preview`
   - **Port**: 3000
4. Add Environment Variable:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend-domain.railway.app` (from Project 2)
5. Generate Service Domain
6. (Optional) Add custom domain (.tech domain)

### Project 2: Backend (Express/Node)

1. Go to Railway.app → New Project
2. Connect your GitHub repository (HackUmass) - same repo, same branch
3. Configure:
   - **Start Command**: `npm run dev:server`
   - **Port**: 3001
   - Railway will auto-detect Node.js
4. Generate Service Domain (e.g., `udash-backend.railway.app`)
5. (Optional) Add custom domain subdomain (e.g., `api.yourdomain.tech`)

### Connect Frontend to Backend

After both are deployed:
1. Copy backend domain from Project 2
2. Go to Project 1 (Frontend) → Variables
3. Update `VITE_API_URL` = `https://your-backend-domain.railway.app`
4. Redeploy frontend

## Environment Variables Needed

**Frontend (.env.production)**:
```
VITE_API_URL=https://your-backend.railway.app
```

**Backend**:
- `PORT` (Railway sets this automatically to 3001)
- CORS already configured for all origins

## Testing

After deployment:
1. Visit your frontend domain
2. App should load menu from backend API
3. All features should work as locally

## Troubleshooting

- If menu doesn't load: Check backend domain in frontend env vars
- Check Railway logs for errors
- Verify CORS is enabled (it is in server.js)
