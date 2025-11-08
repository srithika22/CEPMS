# 🚀 CEPMS Deployment Guide

Complete deployment guide for CEPMS on Render (Backend) and Vercel (Frontend).

## 🌐 Live Deployment URLs

- **Frontend**: Will be available on Vercel
- **Backend**: Will be available on Render

## 📋 Pre-Deployment Checklist

- [x] ✅ Project cleaned and optimized
- [x] ✅ Environment example files created
- [x] ✅ .gitignore files updated  
- [x] ✅ Deployment configurations added
- [x] ✅ Documentation updated

## 🔧 Backend Deployment (Render)

### Step 1: Push to GitHub

```bash
# Add all files
git add .

# Commit changes
git commit -m "Ready for deployment - Backend configured for Render"

# Push to GitHub
git push origin main
```

### Step 2: Setup Render

1. Go to [Render.com](https://render.com) and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

   **Basic Settings:**
   - **Name**: `cepms-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   
   **Build & Deploy:**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 3: Environment Variables

Add these in Render dashboard (Environment tab):

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/CEPMS?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=30d
FRONTEND_URL=https://your-app.vercel.app
CLIENT_URL=https://your-app.vercel.app
EMAIL_FROM=noreply@yourdomain.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

**⚠️ Important**: Replace placeholder values with your actual credentials

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment to complete (~2-5 minutes)
3. Note your backend URL: `https://your-service.onrender.com`

## 🌟 Frontend Deployment (Vercel)

### Step 1: Setup Vercel

1. Go to [Vercel.com](https://vercel.com) and sign up/login
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure the project:

   **Framework Preset:** Vite
   **Root Directory:** `frontend`
   **Build Command:** `npm run build`
   **Output Directory:** `dist`

### Step 2: Environment Variables

Add these in Vercel dashboard (Settings → Environment Variables):

```env
VITE_API_URL=https://your-render-backend.onrender.com/api
VITE_APP_NAME=CEPMS
VITE_APP_VERSION=1.0.0
```

**⚠️ Important**: Replace `your-render-backend.onrender.com` with your actual Render URL

### Step 3: Deploy

1. Click **"Deploy"**
2. Wait for deployment to complete (~1-3 minutes)
3. Note your frontend URL: `https://your-app.vercel.app`

## 🔄 Post-Deployment Configuration

### Update Backend CORS Settings

1. Go to your Render dashboard
2. Navigate to Environment variables
3. Update these variables with your Vercel URL:
   ```env
   FRONTEND_URL=https://your-app.vercel.app
   CLIENT_URL=https://your-app.vercel.app
   ```
4. Redeploy the service

### Test Your Application

1. Visit your frontend URL
2. Try logging in with default credentials:
   - **Admin**: admin@college.edu / password123
   - **Faculty**: sarah.johnson@college.edu / password123
   - **Student**: john.smith@student.college.edu / password123
   - **Trainer**: david.wilson@trainer.college.edu / password123

## 🛠 Troubleshooting

### Common Issues

**Backend Issues:**
- ❌ "Application failed to start" → Check environment variables
- ❌ "Database connection failed" → Verify MongoDB URI
- ❌ "Cannot find module" → Check if all dependencies are in package.json

**Frontend Issues:**
- ❌ "Network Error" → Check VITE_API_URL points to correct backend
- ❌ "Build failed" → Check for any TypeScript/ESLint errors
- ❌ "404 on refresh" → Vercel.json should handle client-side routing

### Debug Steps

1. **Check Logs**: 
   - Render: Service → Logs tab
   - Vercel: Functions tab or Runtime Logs

2. **Verify Environment Variables**:
   - Ensure all required variables are set
   - Check for typos in variable names

3. **Test API Endpoints**:
   ```bash
   # Test backend health
   curl https://your-backend.onrender.com/api/auth/test
   ```

## 🔒 Security Checklist

- [x] ✅ .env files in .gitignore
- [x] ✅ Strong JWT secret (generated)
- [x] ✅ MongoDB URI with restricted user
- [x] ✅ CORS configured for production
- [x] ✅ Rate limiting enabled
- [x] ✅ Helmet security headers

## 🚀 Go Live!

Once both deployments are successful and configured:

1. **Share your URLs**:
   - Frontend: `https://your-app.vercel.app`
   - Backend: `https://your-backend.onrender.com`

2. **Monitor**: Keep an eye on logs for first few hours

3. **Celebrate** 🎉 Your CEPMS is live!

---

**Need help?** Check the logs or contact support. Your application is production-ready!