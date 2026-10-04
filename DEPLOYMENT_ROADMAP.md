# 🚀 NIVA — Simple & Complete Cloud Deployment Guide
> **Aasan Bhasha Me Step-by-Step Deployment Roadmap (Web, Backend, Database, Mobile & Desktop)**

---

## ⚡ Quick Summary (Overview)

Aapka project internet par live hone ke baad in 5 cheezon me chalega:

| Component | Kahan Deploy Hoga? | Cost | Kaam Kya Karega? |
| :--- | :--- | :---: | :--- |
| **1. Web Frontend** | **[Vercel](https://vercel.com)** | **Free** | Website ban jayegi (jaise `https://niva-ai.vercel.app`) jise koi bhi open kar sakega. |
| **2. Backend Server** | **[Render.com](https://render.com)** | **Free** | NIVA ka main API server aur WebSockets 24/7 internet par chalega. |
| **3. Database** | **[Neon.tech](https://neon.tech)** | **Free** | Cloud PostgreSQL database jisme users, chats, aur memories save rahengi. |
| **4. Cache System** | **[Upstash.com](https://upstash.com)** | **Free** | Serverless Redis cache jo real-time speed provide karega. |
| **5. Mobile App** | **[Expo EAS](https://expo.dev)** | **Free** | Standalone `.apk` file download ho jayegi jise phone me direct install kar sakte hain. |

---

## 📌 STEP 1: GitHub Par Code Update Rakhna (Already Done ✅)

Aapka repository already GitHub par connect hai:
👉 **`https://github.com/har-001/NIVA`**

> [!NOTE]
> Aapka saara latest code, Google Voice Engine, Arc Reactor fixes, aur mobile features **already GitHub par push ho chuke hain!** 

Jab bhi aap aage koi naya change karein, terminal me bas yeh 3 simple commands chalani hain:
```bash
git add .
git commit -m "update: niva latest changes"
git push origin main
```

---

## 🗄️ STEP 2: Free Cloud Database Banana (Sirf 3 Minute)

Backend deploy karne se pehle hume cloud me 2 free databases create karne hain:

### 2.1 Neon PostgreSQL Database (1 Minute):
1. Browser me open karein: **[Neon.tech](https://neon.tech)**
2. **"Sign in with GitHub"** par click karein.
3. **"Create Project"** dabayein (Project Name: `niva-db`).
4. Dashboard par **"Connection Details"** me se connection string copy karein:
   ```env
   # Example:
   postgresql://harsh:xyz123@ep-cool-lake-12345.us-east-2.aws.neon.tech/niva_db?sslmode=require
   ```
   *(Ise save kar lein, yeh Step 3 me kaam aayegi).*

### 2.2 Upstash Redis Cache (1 Minute):
1. Browser me open karein: **[Upstash.com](https://upstash.com)**
2. **"Sign in with GitHub"** karein.
3. **"Create Database"** dabayein:
   - Type: **Redis**
   - Name: `niva-redis`
   - Region: Global / Any
4. Database banne ke baad **"REST URL"** ya **`rediss://...`** connection string copy kar lein.

---

## ⚙️ STEP 3: Backend API Server Deploy Karna (Render.com)

Render par NIVA ka Express backend 24/7 online chalega:

1. Browser me open karein: **[Render.com](https://render.com)** aur GitHub se sign in karein.
2. Upar right side me **"New +"** par click karke **"Web Service"** choose karein.
3. Apni GitHub repository select karein: **`har-001/NIVA`**.
4. Niche diye gaye exact options bhar dein:

| Setting Field | Exactly Kya Daalna Hai |
| :--- | :--- |
| **Name** | `niva-backend` |
| **Region** | `Singapore` *(ya Frankfurt - fast for India)* |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate && npx prisma db push && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** |

5. Niche **"Environment Variables"** me jakar **"Add Environment Variable"** par click karein aur yeh add karein:

| Key (Naam) | Value (Kya Daalna Hai) |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `DATABASE_URL` | *Neon.tech se copy kiya hua PostgreSQL link* |
| `REDIS_URL` | *Upstash se copy kiya hua Redis link* |
| `JWT_SECRET` | `niva-secure-production-jwt-key-2026` |
| `GEMINI_API_KEY` | *Aapki Google AI Studio key (`AIzaSy...`)* |

6. **"Create Web Service"** par click kar dein!
7. **Result**: 2-3 minute me aapka backend live ho jayega aur ek public link mil jayega:
   👉 **`https://niva-backend.onrender.com`**

---

## 🌐 STEP 4: Frontend Web App Deploy Karna (Vercel)

Vercel Next.js ka official host hai aur 1 minute me website live kar deta hai:

1. Browser me open karein: **[Vercel.com](https://vercel.com)** aur GitHub se sign in karein.
2. **"Add New..."** > **"Project"** par click karein.
3. Apni repo import karein: **`har-001/NIVA`**.
4. Settings me:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: *Edit* button dabayein aur **`client`** select karein.
   - **Build Command**: `npm run build` (default)
5. **Environment Variables** section me sirf yeh 2 variables add karein:

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://niva-backend.onrender.com/api/v1` *(Step 3 ka backend URL)* |
| `NEXT_PUBLIC_SOCKET_URL` | `https://niva-backend.onrender.com` |

6. **"Deploy"** button dabayein!
7. **Result**: 60 seconds me aapki NIVA website globally live ho jayegi:
   👉 **`https://niva-web.vercel.app`**

---

## 📱 STEP 5: Android Mobile App (.APK) Download Link Banana (Expo EAS)

Agar aapko apne ya teachers ke Android phone me NIVA install karwana hai:

1. Apne laptop terminal me command chalayein:
   ```cmd
   npm install -g eas-cli
   ```
2. Free Expo account se login karein:
   ```cmd
   eas login
   ```
3. Mobile folder me jakar build command chalayein:
   ```cmd
   cd mobile
   eas build:configure
   eas build -p android --profile preview
   ```
4. **Result**:
   - Expo cloud automatically Android APK build kar dega (4-5 minutes me).
   - Terminal me ek **QR Code** aur direct **Download Link** aayega (`niva-mobile.apk`).
   - Use kisi bhi Android phone me download karke install kar sakte hain!

---

## 💻 STEP 6: Windows Desktop Standalone (.EXE) File Banana

Agar laptop ke liye standalone software installer banana ho:

```cmd
cd desktop
npm run build
```
*(Compiled installer file `desktop/dist/NIVA Setup 1.0.0.exe` me ban jayegi, jise aap direct GitHub Releases me upload kar sakte hain).*

---

## 🎯 Master Links Summary (For Viva & Presentation)

Jab aapka project deploy ho jaye, to aap presentation me yeh sab show kar sakte hain:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   NIVA LIVE PRODUCTION SHOWCASE                        │
├────────────────────────────────────────────────────────────────────────┤
│ 🐙 GitHub Repository : https://github.com/har-001/NIVA                 │
│ 🌐 Live Web Console   : https://niva-web.vercel.app                    │
│ ⚡ Backend API Health  : https://niva-backend.onrender.com/api/v1/health│
│ 📱 Android Mobile APK  : Downloadable .apk file (via Expo EAS)         │
│ 💻 Windows Desktop HUD : Floating Arc Reactor Core (Alt+Space)         │
└────────────────────────────────────────────────────────────────────────┘
```

> [!TIP]
> **Sabse Aasan Tarika**:
> Pehle **Neon.tech** aur **Render.com** par Backend deploy karein, fir uske link ko **Vercel** me daal kar Frontend deploy karein. Poora process sirf 5 se 7 minute me complete ho jata hai!
