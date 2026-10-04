# 🚀 NIVA — Production Deployment Guide
> **Simple, Step-by-Step Cloud Roadmap (Web, Backend, Database, Mobile & Desktop)**

---

## 📌 Quick Summary (Sabse Pehle Yeh Samjhein)

NIVA ko internet par live karne ke liye hume **4 main cheezein** deploy karni hain:

1. **Database**: PostgreSQL (Neon.tech) + Redis (Upstash) — *Free Cloud DBs*
2. **Backend Server**: Express 5 API (Render.com) — *Free Node.js Server*
3. **Web Frontend**: Next.js 15 App (Vercel.com) — *Free Global Website*
4. **Mobile App**: Android `.apk` File (Expo EAS) — *Phone me chalane ke liye*

Sabhi platforms **100% Free** hain aur bina credit card ke chalte hain.

---

## 🛠️ Step 1: GitHub Check (Already Done ✅)

Aapka poora code already GitHub par live sync ho chuka hai:
- **Repository Link**: [https://github.com/har-001/NIVA](https://github.com/har-001/NIVA)
- **Branch**: `main`
- **Security**: `.env` aur secret keys `.gitignore` me protected hain.

Jab bhi future me code push karna ho, terminal me bas yeh chalana hai:
```bash
git add .
git commit -m "update project"
git push origin main
```

---

## 🗄️ Step 2: Free Cloud Database Setup

Is step me hume 2 connection strings copy karni hain jo Step 3 (Backend) me kaam aayengi.

### 2.1 PostgreSQL Database (Neon.tech)
1. Browser me open karein: **[https://neon.tech](https://neon.tech)**
2. **"Sign in with GitHub"** par click karein.
3. Click: **"Create Project"**
   - **Name**: `niva-db`
   - **Region**: `AWS / Singapore` (India ke pass)
   - Click **"Create"**.
4. Screen par **Connection String** dikhegi, use copy karke Notepad me save karein:
```text
postgresql://neondb_owner:password@ep-cool-12345.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

---

### 2.2 Redis Cache (Upstash.com)
1. Browser me open karein: **[https://upstash.com](https://upstash.com)**
2. **"Log In with GitHub"** karein.
3. Click: **"Create Database"**
   - **Name**: `niva-redis`
   - **Type**: Regional (Singapore)
   - Click **"Create"**.
4. Niche scroll karke **"Node (ioredis)"** tab se URL copy karein:
```text
rediss://default:token123@global-redis.upstash.io:6379
```

---

## ⚙️ Step 3: Backend API Deploy Karna (Render.com)

1. Open karein: **[https://render.com](https://render.com)** aur GitHub se sign in karein.
2. Upar right side me click karein: **"New +" ➔ "Web Service"**.
3. Select karein: **"Build and deploy from a Git repository"**.
4. List me se apna repo choose karein: **`har-001/NIVA`**.

### Render ke Form me Yeh Values Bharein:

- **Name**: `niva-backend`
- **Region**: `Singapore`
- **Branch**: `main`
- **Root Directory**: `server`
- **Runtime**: `Node`
- **Instance Type**: `Free`

**Build Command**:
```bash
npm install && npx prisma generate && npx prisma db push && npm run build
```

**Start Command**:
```bash
npm start
```

---

### Render me Environment Variables (Yeh Values Add Karein):

Click karein **"Add Environment Variable"** aur ek-ek karke add karein:

| Key (Name) | Value (Example) |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `DATABASE_URL` | *(Neon se copy ki hui PostgreSQL link)* |
| `REDIS_URL` | *(Upstash se copy ki hui Redis link)* |
| `JWT_SECRET` | `niva-super-secret-jwt-key-2026` |
| `GEMINI_API_KEY` | *(Aapki Google AI Studio key: `AIzaSy...`)* |
| `CLIENT_URL` | `https://niva-web.vercel.app` *(Step 4 ka link)* |

Click karein **"Deploy Web Service"**.
3 minute me aapko aapka live backend URL mil jayega:
👉 **`https://niva-backend.onrender.com`**

---

## 🌐 Step 4: Frontend Web App Deploy Karna (Vercel)

1. Open karein: **[https://vercel.com](https://vercel.com)** aur GitHub se sign in karein.
2. Click karein: **"Add New..." ➔ "Project"**.
3. Apna repo **`har-001/NIVA`** find karke **"Import"** dabayein.

### Vercel Project Settings:
- **Framework Preset**: `Next.js`
- **Root Directory**: Edit par click karke select karein **`client`**
- **Build Command**: `npm run build` *(default)*

### Environment Variables:
Niche **Environment Variables** me 2 values add karein:

1. **Variable 1**:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://niva-backend.onrender.com/api/v1`

2. **Variable 2**:
   - Name: `NEXT_PUBLIC_SOCKET_URL`
   - Value: `https://niva-backend.onrender.com`

Click karein **"Deploy"**.
1 se 2 minute me aapki website live ho jayegi:
👉 **`https://niva-ai.vercel.app`**

---

## 📱 Step 5: Android Mobile App (.APK) Banana

Agar aapko apne phone me install karne ke liye real `.apk` installer file chahiye:

### 1. Terminal me EAS CLI install karein:
```bash
npm install -g eas-cli
```

### 2. Expo account login karein:
```bash
eas login
```
*(Free account [https://expo.dev](https://expo.dev) par banayein).*

### 3. Build command chalayein:
```bash
cd mobile
eas build:configure
eas build -p android --profile preview
```

### 4. Download & Install:
- 5 minute me terminal par ek **Download Link** aur **QR Code** aa jayega.
- Link se `.apk` download karke phone me install karein.
- Phone par agar "Play Protect" warning aaye, to **"More Details ➔ Install Anyway"** par click karein.

---

## 💻 Step 6: Desktop App (.EXE) Banana (Optional)

Laptop ke liye setup file banane ke liye:
```bash
cd desktop
npm run build
```
File yahan ban jayegi:
📁 `desktop/dist/NIVA Setup 1.0.0.exe`

---

## 📋 Copy-Paste Environment Variables Reference

Aapke reference ke liye saare variables ek jagah:

### Render Backend Variables:
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://neondb_owner:pass@ep-cool.neon.tech/neondb?sslmode=require
REDIS_URL=rediss://default:token@global-redis.upstash.io:6379
JWT_SECRET=niva-production-jwt-token-key-2026
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
CLIENT_URL=https://niva-web.vercel.app
```

### Vercel Frontend Variables:
```env
NEXT_PUBLIC_API_URL=https://niva-backend.onrender.com/api/v1
NEXT_PUBLIC_SOCKET_URL=https://niva-backend.onrender.com
```

---

## ⚠️ Common Problems & Quick Fixes

- **Problem 1: Render pe pehli baar website open hone me 30-40 second lag rahe hain?**
  - *Kyu*: Render ka free server 15 minute baad sleep mode me chala jata hai. Pehli request par wake-up me 30 second leta hai, fir fast ho jata hai.

- **Problem 2: Neon database connect nahi ho raha?**
  - *Fix*: Hamesha check karein ki URL ke end me `?sslmode=require` laga ho.

- **Problem 3: Web app pe CORS error aa raha hai?**
  - *Fix*: Render ke `CLIENT_URL` me apne Vercel ka exact URL save karein.

---

## 🎓 College Viva Presentation Cheatsheet

College me examiner ko kya dikhana hai:

1. **GitHub Code**: [https://github.com/har-001/NIVA](https://github.com/har-001/NIVA)
   - Show karein: Clean commits, clean architecture, zero errors.

2. **Live Web App**: `https://niva-web.vercel.app`
   - Show karein: Google Voice Orb (en-IN Hinglish), AI Chat, Code generator.

3. **Backend Health**: `https://niva-backend.onrender.com/api/v1/health`
   - Show karein: Live JSON status: `{"status": "healthy"}`.

4. **Mobile App**: `niva-mobile.apk`
   - Show karein: Phone se laptop volume aur lock control.

5. **College Synopsis PDF**: [`Synopsis 2026.pdf`](file:///c:/Users/harsh_2pgm3oe/OneDrive/Documents/Coding/Project/NIVA/Clg%20Docs/Synopsis/Synopsis%202026.pdf)
   - Show karein: Timeline chart aur IEEE references.

---
*NIVA complete cloud deployment guide.*
