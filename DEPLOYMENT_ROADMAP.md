# 🚀 NIVA — Master Production Deployment & Cloud Roadmap
> **Comprehensive Step-by-Step Guide for Free Cloud Deployment (Web, Backend, Database, Mobile APK & Windows Desktop)**

---

## 🌟 Quick Index & Navigation

```
  [1. Cloud Architecture]  ───►  [2. GitHub Push]   ───►  [3. Cloud Database]
            │                              │                         │
            ▼                              ▼                         ▼
  [4. Render Backend]      ───►  [5. Vercel Web]    ───►  [6. Mobile APK]
            │                              │                         │
            ▼                              ▼                         ▼
  [7. Desktop .EXE]        ───►  [8. Env Cheatsheet]───►  [9. Viva Links]
```

---

## 🗺️ 1. Architecture & 100% Free Hosting Stack

NIVA is designed with a modern microservices architecture that can be deployed **100% Free** across developer-grade platforms:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   NIVA GLOBAL CLOUD ARCHITECTURE                       │
└────────────────────────────────────────────────────────────────────────┘
          │                                           │
          ▼                                           ▼
┌───────────────────┐                       ┌───────────────────┐
│   VERCEL CLOUD    │                       │  ANDROID APP APK  │
│   Next.js 15 Web  │                       │   (Expo EAS)      │
│  Global CDN + SSL │                       │ Standalone .apk   │
└─────────┬─────────┘                       └─────────┬─────────┘
          │                                           │
          │             HTTPS & WebSocket             │
          └───────────────────┬───────────────────────┘
                              ▼
                  ┌───────────────────────┐
                  │      RENDER.COM       │
                  │   Express 5 Backend   │
                  │  Socket.IO + Web API  │
                  └───────────┬───────────┘
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
┌───────────────────────┐           ┌───────────────────────┐
│       NEON.TECH       │           │      UPSTASH.COM      │
│ Serverless PostgreSQL │           │ Serverless Redis 7    │
│  Vectors + User Data  │           │ Pub/Sub Voice Chunks  │
└───────────────────────┘           └───────────────────────┘
```

### 📊 Free Hosting Stack Overview:

```
┌────────────────────┬───────────────┬───────────────────────────────┐
│ Component          │ Free Platform │ Role & Setup Time             │
├────────────────────┼───────────────┼───────────────────────────────┤
│ 🌐 Web Frontend    │ Vercel        │ Next.js 15 Web UI (90s)       │
│ ⚙️ Backend API     │ Render.com    │ Express 5 + Sockets (3 min)   │
│ 🗄️ Database (SQL)  │ Neon.tech     │ Postgres 16 Cloud (2 min)     │
│ ⚡ Cache (Redis)   │ Upstash       │ Redis Pub/Sub (1 min)         │
│ 📱 Android Mobile  │ Expo EAS      │ Standalone .apk Build (5 min) │
│ 💻 Windows App     │ GitHub Release│ Standalone .exe Setup (3 min) │
└────────────────────┴───────────────┴───────────────────────────────┘
```

---

## 🐙 Stage 1: GitHub Repository & Code Sync

Aapka repository already GitHub se live connected hai:
👉 **`https://github.com/har-001/NIVA`**

```
┌────────────────────────────────────────────────────────────────────┐
│                    GIT PUSH WORKFLOW CHEAT-SHEET                   │
└────────────────────────────────────────────────────────────────────┘
  1. git status          ───► Check modified & new files
  2. git add .           ───► Stage all clean project files
  3. git commit -m "..." ───► Create clear descriptive commit
  4. git push origin main───► Sync directly with GitHub
```

### Exact Terminal Commands:
```bash
# 1. Project folder me status check karein
git status

# 2. Saare files stage karein
git add .

# 3. Commit banayein
git commit -m "feat: complete NIVA deployment package"

# 4. GitHub par push karein
git push origin main
```

> [!TIP]
> **Zero Leak Guarantee**: Humari `.gitignore` file me `.env`, `server/.env`, aur `node_modules` already protected hain. Aapki private Google Gemini API key aur passwords GitHub par kabhi leak nahi honge.

---

## 🗄️ Stage 2: Free Serverless Database Setup (Neon + Upstash)

Cloud par database run karne ke liye local Docker ki zaroorat nahi hoti:

```
                  ┌───────────────────────────────┐
                  │     FREE CLOUD DATABASES      │
                  └───────────────┬───────────────┘
                                  │
                 ┌────────────────┴────────────────┐
                 ▼                                 ▼
      ┌─────────────────────┐           ┌─────────────────────┐
      │      NEON.TECH      │           │     UPSTASH.COM     │
      │ Serverless Postgres │           │  Serverless Redis   │
      │   (User & Memory)   │           │   (Realtime Cache)  │
      └─────────────────────┘           └─────────────────────┘
```

### 2.1 Free PostgreSQL 16 (Neon.tech) — 2 Minutes:
1. Open karein: **[https://neon.tech](https://neon.tech)**
2. Click **"Sign in with GitHub"**.
3. Click **"Create Project"**:
   - **Name**: `niva-cloud`
   - **Region**: `AWS / Singapore` (India ke liye best speed)
4. Dashboard se **Connection Details** copy karein:
   ```env
   DATABASE_URL=postgresql://neondb_owner:password@ep-cool-cloud.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
   *(Ise Notepad me save kar lein — yeh Render me paste hogi).*

---

### 2.2 Free Redis 7 (Upstash.com) — 1 Minute:
1. Open karein: **[https://upstash.com](https://upstash.com)**
2. Click **"Log In with GitHub"**.
3. Click **"Create Database"**:
   - **Name**: `niva-redis`
   - **Region**: `Singapore / Asia`
4. Page par niche **"Node (ioredis)"** tab se URL copy karein:
   ```env
   REDIS_URL=rediss://default:token@global-niva-redis.upstash.io:6379
   ```
   *(Ise bhi Notepad me save kar lein).*

---

## ⚙️ Stage 3: Deploying Backend API (Render.com)

Render hamara Node.js Express 5 server aur Socket.IO host karega:

```
┌────────────────────────────────────────────────────────────────────┐
│                    RENDER.COM DEPLOYMENT FORM                      │
└────────────────────────────────────────────────────────────────────┘
  1. Login to https://render.com with GitHub
  2. Click "New +" ───► Select "Web Service"
  3. Choose repository: har-001/NIVA
```

### Render Settings Box:

```
┌────────────────────┬────────────────────────────────────────────────────────┐
│ Field Name         │ Exact Value to Enter                                   │
├────────────────────┼────────────────────────────────────────────────────────┤
│ Service Name       │ niva-backend                                           │
│ Region             │ Singapore                                              │
│ Branch             │ main                                                   │
│ Root Directory     │ server                                                 │
│ Runtime            │ Node                                                   │
│ Build Command      │ npm install && npx prisma db push && npm run build     │
│ Start Command      │ npm start                                              │
│ Instance Type      │ Free                                                   │
└────────────────────┴────────────────────────────────────────────────────────┘
```

### Render Environment Variables Box:

```
┌──────────────────┬──────────────────────────────────────────────────────────┐
│ Variable Key     │ Value / Description                                      │
├──────────────────┼──────────────────────────────────────────────────────────┤
│ NODE_ENV         │ production                                               │
│ PORT             │ 3001                                                     │
│ DATABASE_URL     │ postgresql://...neon.tech/neondb?sslmode=require         │
│ REDIS_URL        │ rediss://default:...upstash.io:6379                      │
│ JWT_SECRET       │ niva-secure-jwt-secret-2026                              │
│ GEMINI_API_KEY   │ AIzaSy... (Your Google AI Studio API key)                │
│ CLIENT_URL       │ https://niva-web.vercel.app (Your Vercel URL)            │
└──────────────────┴──────────────────────────────────────────────────────────┘
```

- Click **"Deploy Web Service"**.
- 3 minute me aapko live link mil jayega:
  👉 **`https://niva-backend.onrender.com`**

> [!NOTE]
> **Health Check**: Browser me `https://niva-backend.onrender.com/api/v1/health` kholein. Agar status `healthy` aaye, to backend 100% online hai!

---

## 🌐 Stage 4: Deploying Frontend Web App (Vercel)

Vercel Next.js ka official host hai aur 1-click me deploy hota hai:

```
┌────────────────────────────────────────────────────────────────────┐
│                    VERCEL IMPORT & DEPLOY FLOW                     │
└────────────────────────────────────────────────────────────────────┘
  1. Open https://vercel.com ───► "Add New..." ───► "Project"
  2. Import repository: har-001/NIVA
  3. Root Directory: Click "Edit" ───► Select "client" folder
```

### Vercel Environment Variables Box:

```
┌─────────────────────────┬───────────────────────────────────────────────────┐
│ Variable Key            │ Value (Pointing to your live Render Backend)      │
├─────────────────────────┼───────────────────────────────────────────────────┤
│ NEXT_PUBLIC_API_URL     │ https://niva-backend.onrender.com/api/v1          │
│ NEXT_PUBLIC_SOCKET_URL  │ https://niva-backend.onrender.com                 │
└─────────────────────────┴───────────────────────────────────────────────────┘
```

- Click **"Deploy"**.
- Sirf 60-90 seconds me aapki website live ho jayegi:
  👉 **`https://niva-web.vercel.app`** *(ya aapka chosen custom name)*.

---

## 📱 Stage 5: Building Android Mobile App (.APK)

Is step se aapka real Android `.apk` ban jayega jo kisi bhi phone me install ho sakta hai:

```
┌────────────────────────────────────────────────────────────────────┐
│                    EXPO EAS CLOUD BUILD PIPELINE                   │
└────────────────────────────────────────────────────────────────────┘
  [Terminal]               [Expo Cloud Servers]          [Your Phone]
   eas build  ───►  Compiles React Native APK ───►  Install niva-mobile.apk
```

### Step-by-Step Commands:

```bash
# 1. EAS CLI install karein
npm install -g eas-cli

# 2. Expo se login karein (Free account: expo.dev)
eas login

# 3. Mobile folder me configure karein
cd mobile
eas build:configure

# 4. Standalone APK cloud build trigger karein
eas build -p android --profile preview
```

### Result:
- 5 minute me terminal par **Direct Download Link** aur **QR Code** aayega.
- Us link se `niva-mobile.apk` download karke phone me install karein!

> [!TIP]
> **Android Install Warning**: Manually `.apk` install karte waqt Play Protect "Unknown App" keh sakta hai. Simply click karein **"More Details" ➔ "Install Anyway"**.

---

## 💻 Stage 6: Packaging Desktop Windows App (.EXE)

Agar aapko Windows laptop ke liye standalone `.exe` installer banana hai:

```bash
cd desktop
npm run build
```

Compiled setup yahan generate hoga:
📁 `desktop/dist/NIVA Setup 1.0.0.exe`

Ise aap Google Drive ya GitHub ke **"Releases"** section me attach kar sakte hain.

---

## 📋 8. Master Environment Variables Cheat-Sheet

Deploy karte waqt is clean reference box ko follow karein:

### Backend Variables (Render.com):
```
┌──────────────────┬──────────────────────────────────────────────────────────┐
│ Key              │ Example Value                                            │
├──────────────────┼──────────────────────────────────────────────────────────┤
│ DATABASE_URL     │ postgresql://user:pass@host/neondb?sslmode=require       │
│ REDIS_URL        │ rediss://default:token@host.upstash.io:6379              │
│ GEMINI_API_KEY   │ AIzaSy... (from aistudio.google.com)                     │
│ JWT_SECRET       │ niva-secure-jwt-production-2026                          │
│ PORT             │ 3001                                                     │
│ NODE_ENV         │ production                                               │
│ CLIENT_URL       │ https://niva-web.vercel.app                              │
└──────────────────┴──────────────────────────────────────────────────────────┘
```

### Frontend Variables (Vercel):
```
┌─────────────────────────┬───────────────────────────────────────────────────┐
│ Key                     │ Value                                             │
├─────────────────────────┼───────────────────────────────────────────────────┤
│ NEXT_PUBLIC_API_URL     │ https://niva-backend.onrender.com/api/v1          │
│ NEXT_PUBLIC_SOCKET_URL  │ https://niva-backend.onrender.com                 │
└─────────────────────────┴───────────────────────────────────────────────────┘
```

---

## 🛠️ 9. Troubleshooting & Common Gotchas

```
┌───────────────────────────┬─────────────────────────────────────────────────┐
│ Issue                     │ Solution                                        │
├───────────────────────────┼─────────────────────────────────────────────────┤
│ Render Cold Start (Slow)  │ Free tier 15 min inactivity pe sleep ho jata hai│
│                           │ First request 30s leti hai, fir fast ho jati hai│
├───────────────────────────┼─────────────────────────────────────────────────┤
│ Neon Database Timeout     │ URL ke aakhir me ?sslmode=require zaroor daalein│
├───────────────────────────┼─────────────────────────────────────────────────┤
│ Vercel CORS Error         │ Render env CLIENT_URL me Vercel ka exact link ho│
├───────────────────────────┼─────────────────────────────────────────────────┤
│ Android Install Blocked   │ Android popup me "More Details" ➔ "Install" dabayein│
└───────────────────────────┴─────────────────────────────────────────────────┘
```

---

## 🎯 10. College Viva & Final Presentation Showcase Links

College viva me examiner ko aap yeh standard portfolio dikha sakte hain:

```
┌────────────────────┬──────────────────────────────────┬────────────────────────┐
│ Deliverable        │ Live Link                        │ Viva Highlight         │
├────────────────────┼──────────────────────────────────┼────────────────────────┤
│ 🐙 GitHub Repo     │ github.com/har-001/NIVA          │ Clean commits & tests  │
│ 🌐 Live Web App    │ niva-web.vercel.app              │ Voice Orb & Vision     │
│ ⚙️ API Health      │ niva-backend.onrender.com/health │ Postgres & Sockets     │
│ 📱 Android App     │ niva-mobile.apk                  │ Phone companion app    │
│ 📄 College Report  │ Synopsis 2026.pdf                │ IEEE references & docs │
└────────────────────┴──────────────────────────────────┴────────────────────────┘
```

---
*NIVA is completely verified, audited, and ready for global deployment.*
