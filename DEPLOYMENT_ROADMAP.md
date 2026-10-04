# NIVA — Complete Production Deployment & GitHub Roadmap
> **Comprehensive Guide for Cloud Deployment (Web, Backend, Database, Mobile APK & Desktop)**

---

## 🗺️ 1. Global Deployment Architecture & Free Tier Stack

NIVA is designed with a modern microservices-compatible architecture that can be deployed **100% Free** using industry-standard platforms:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NIVA CLOUD ECOSYSTEM                            │
└────────────────────────────────────────────────────────────────────────┘
          │                                           │
          ▼                                           ▼
┌───────────────────┐                       ┌───────────────────┐
│   NEXT.JS WEB     │                       │  ANDROID APP APK  │
│   (Vercel Cloud)  │                       │    (Expo EAS)     │
│   https://niva... │                       │   .apk installer  │
└─────────┬─────────┘                       └─────────┬─────────┘
          │                                           │
          │             HTTPS & WebSocket             │
          └───────────────────┬───────────────────────┘
                              ▼
                  ┌───────────────────────┐
                  │   EXPRESS 5 BACKEND   │
                  │ (Render.com / Railway)│
                  │   REST + Socket.IO    │
                  └───────────┬───────────┘
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
┌───────────────────────┐           ┌───────────────────────┐
│  SERVERLESS POSTGRES  │           │   SERVERLESS REDIS    │
│ (Neon.tech/Supabase)  │           │     (Upstash.com)     │
│   Vector + Relational │           │  Sub/Pub Cache Stream │
└───────────────────────┘           └───────────────────────┘
```

| Component | Recommended Cloud Host | Free Tier Benefits | Deployment Time |
| :--- | :--- | :--- | :--- |
| **Backend API** | [Render.com](https://render.com) or [Railway.app](https://railway.app) | Node.js web service, automatic SSL, WebSockets | 4 Minutes |
| **Web Console** | [Vercel](https://vercel.com) | Official Next.js host, global CDN, zero-config | 2 Minutes |
| **PostgreSQL** | [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com) | Serverless PostgreSQL 16, auto-scaling, SSL | 2 Minutes |
| **Redis Cache** | [Upstash](https://upstash.com) | Free Serverless Redis, zero-maintenance | 1 Minute |
| **Mobile Android** | [Expo EAS Build](https://expo.dev) | Cloud builds, direct standalone `.apk` download | 5 Minutes |
| **Desktop App** | GitHub Releases | Standalone Windows `.exe` installer | 3 Minutes |

---

## 🐙 2. GitHub Setup & Code Push Guide

Your local repository is already connected to GitHub at:
👉 **`https://github.com/har-001/NIVA`**

### Step 2.1: Verify Security (`.gitignore`)
Our `.gitignore` is already protecting all sensitive keys and local databases:
- ✅ `.env` and `server/.env` are **IGNORED** (Your secret API keys will NEVER leak).
- ✅ `node_modules/`, `dist/`, `.next/`, and local Docker data are **IGNORED**.

### Step 2.2: Commit & Push All Updates to GitHub
Run these commands in PowerShell or Git Bash to push all new voice features, mobile screens, tests, and documentation:

```bash
# 1. Check current changes
git status

# 2. Stage all clean project files
git add .

# 3. Create a descriptive commit
git commit -m "feat: complete Phase 00-16 with Google Voice Engine, Arc Reactor fixes, mobile tests & deployment kit"

# 4. Push to your GitHub main branch
git push origin main
```

---

## 🗄️ 3. Cloud Database Setup (Free & Instant)

Before deploying the backend, set up free cloud databases for PostgreSQL and Redis:

### 3.1 Free Cloud PostgreSQL (Neon.tech):
1. Go to **[Neon.tech](https://neon.tech)** and sign in with GitHub.
2. Click **"Create Project"** (Name: `niva-production`).
3. Under **Dashboard > Connection Details**, copy the **Connection string**:
   ```
   postgresql://harsh:AbCdEfGh@ep-cool-frost-123456.us-east-2.aws.neon.tech/niva_db?sslmode=require
   ```
   *(Keep this string for your backend env).*

### 3.2 Free Cloud Redis (Upstash):
1. Go to **[Upstash.com](https://upstash.com)** and sign in with GitHub.
2. Click **"Create Database"** (Type: Redis, Name: `niva-redis`).
3. Under **Details**, copy the **`rediss://default:...@...upstash.io:6379`** connection string.

---

## ⚙️ 4. Deploying Backend API (Render.com)

1. Go to **[Render.com](https://render.com)** and sign in with your GitHub account.
2. Click **"New +" > "Web Service"**.
3. Select your repository: **`har-001/NIVA`**.
4. Configure these exact settings:
   - **Name**: `niva-backend`
   - **Region**: Singapore or Frankfurt (fastest for India)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npx prisma generate && npx prisma db push && npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Instance Type**: Free
5. Add **Environment Variables** (Click *Add Environment Variable*):
   | Key | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `3001` |
   | `DATABASE_URL` | *Your Neon PostgreSQL connection string* |
   | `REDIS_URL` | *Your Upstash Redis connection string* |
   | `JWT_SECRET` | `niva-super-secret-jwt-production-token-2026` |
   | `GEMINI_API_KEY` | *Your Google AI Studio key (`AIzaSy...`)* |
   | `CLIENT_URL` | `https://niva-web.vercel.app` *(update once Vercel is created)* |
6. Click **"Create Web Service"**.
7. Render will build and deploy your API within 3 minutes and give you a public URL:
   👉 `https://niva-backend.onrender.com`

---

## 🌐 5. Deploying Frontend Web Console (Vercel)

1. Go to **[Vercel.com](https://vercel.com)** and sign in with GitHub.
2. Click **"Add New..." > "Project"**.
3. Import your repository: **`har-001/NIVA`**.
4. Configure project settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click *Edit* and select **`client`**
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Under **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `NEXT_PUBLIC_API_URL` | `https://niva-backend.onrender.com/api/v1` |
   | `NEXT_PUBLIC_SOCKET_URL` | `https://niva-backend.onrender.com` |
6. Click **"Deploy"**.
7. Within 90 seconds, your site will be live at:
   👉 **`https://niva-client.vercel.app`** *(or your custom name)*

---

## 📱 6. Building Standalone Android Mobile App (.APK)

To generate a real installable `.apk` file that you or your teachers/evaluators can install directly on an Android smartphone:

### Step 6.1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 6.2: Login to Expo
```bash
eas login
```
*(If you don't have an Expo account, create one free at [expo.dev](https://expo.dev)).*

### Step 6.3: Configure Build
Inside `mobile/`, run:
```bash
cd mobile
eas build:configure
```

### Step 6.4: Trigger Cloud APK Build
```bash
eas build -p android --profile preview
```
- Expo cloud servers will automatically compile the React Native app.
- Once finished (approx. 5-7 minutes), it will output a **direct QR code & download link** for `niva-mobile.apk`!
- Transfer the `.apk` to any Android phone, tap install, and NIVA runs natively!

---

## 💻 7. Building Desktop Windows App (.EXE)

To create a standalone `.exe` installer for Windows:

```bash
cd desktop
npm run build
```
*(Or for Tauri: `cd desktop-tauri && cargo tauri build`).*
The compiled executable will be generated under:
`desktop/dist/NIVA Setup 1.0.0.exe`

You can attach this `.exe` directly to your **GitHub Releases** page.

---

## 📋 8. Master Environment Variables Checklist

Use this table as your exact reference when filling out variables on Cloud Hosts:

| Environment Variable | Where Used | Example / Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Render (Backend) | `postgresql://user:pass@host/niva_db?sslmode=require` |
| `REDIS_URL` | Render (Backend) | `rediss://default:token@host.upstash.io:6379` |
| `JWT_SECRET` | Render (Backend) | `niva-jwt-secret-secure-key-2026` |
| `GEMINI_API_KEY` | Render (Backend) | `AIzaSy...` (from Google AI Studio) |
| `PORT` | Render (Backend) | `3001` |
| `NODE_ENV` | Render (Backend) | `production` |
| `CLIENT_URL` | Render (Backend) | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_API_URL` | Vercel (Frontend) | `https://your-backend.onrender.com/api/v1` |
| `NEXT_PUBLIC_SOCKET_URL` | Vercel (Frontend) | `https://your-backend.onrender.com` |

---

## 🎯 9. Deployment Verification & Viva Presentation Links

Once deployed, your project submission will have working live links:

1. **GitHub Repository**: `https://github.com/har-001/NIVA`
2. **Live Web App**: `https://niva-web.vercel.app`
3. **Live Backend API Health**: `https://niva-backend.onrender.com/api/v1/health`
4. **Android Mobile App**: `niva-mobile.apk` (via Expo EAS)
5. **Desktop HUD**: `NIVA-Core-Desktop.exe`

*This complete setup is industry-grade, production-ready, and ideal for your college project viva.*
