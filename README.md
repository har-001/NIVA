# NIVA — Neural Intelligent Virtual Assistant

<div align="center">

**A Multimodal, Secure and Hostable Personal AI Assistant**

*with Voice, Vision, Gesture Recognition, Communication Automation and Intelligent Task Orchestration*

[![Node.js](https://img.shields.io/badge/Node.js-v24+-green?style=flat-square)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue?style=flat-square)](https://www.typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-Private-red?style=flat-square)]()

</div>

---

## 🧠 About

NIVA is a full-stack AI assistant that combines:
- **Text & Voice Interaction** — Natural conversation with multilingual support
- **Vision** — Camera understanding, image analysis, OCR
- **Hand Gesture Recognition** — Air mouse, custom gestures, gesture-to-command mapping
- **Computer Control** — Applications, files, browser automation (via trusted local agent)
- **Memory & RAG** — Long-term memory, document ingestion, semantic search
- **AI Generation** — Images, audio, video, code, documents
- **Communication** — Contacts, messaging, email integration
- **Automation** — Schedules, workflows, triggers
- **Security** — Authentication, 2FA, sessions, audit logging
- **Plugin System** — Extensible with provider adapters

## 🏗️ Architecture

```
Client (Next.js)  ←→  Backend (Express + TypeScript)
                          ├── AI Provider Layer (Gemini/OpenAI/Ollama)
                          ├── Tool Registry + Policy Engine
                          ├── Communication Adapters
                          ├── Memory / RAG Pipeline
                          ├── Automation / Job Queue
                          ├── Plugin System
                          ├── PostgreSQL
                          └── Redis
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** v20+
- **Docker Desktop** (for PostgreSQL & Redis)
- **Gemini API Key** (free at https://aistudio.google.com)

### Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd NIVA

# 2. Start databases
docker compose up -d

# 3. Setup environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 4. Setup backend
cd server
npm install
npx prisma migrate dev --name init
npm run dev

# 5. Setup frontend (new terminal)
cd client
npm install
npm run dev
```

### Access
- **Frontend Web UI**: http://localhost:3002 (or http://localhost:3000)
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/v1/health

## 📁 Project Structure

```
NIVA/
├── client/                    # Next.js Frontend
│   ├── src/
│   │   ├── app/              # Pages (App Router)
│   │   ├── components/       # React components
│   │   ├── context/          # Auth & app contexts
│   │   ├── lib/              # API client, socket, utilities
│   │   └── styles/           # Design system CSS
│   └── ...
│
├── server/                    # Express Backend
│   ├── src/
│   │   ├── config/           # DB, Redis, env config
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── modules/          # Feature modules
│   │   │   ├── auth/         # Authentication
│   │   │   ├── chat/         # Conversations & messaging
│   │   │   ├── ai/           # AI provider abstraction
│   │   │   ├── voice/        # Voice processing
│   │   │   ├── vision/       # Vision/camera
│   │   │   └── ...
│   │   └── utils/            # Logger, errors
│   ├── prisma/               # Database schema & migrations
│   └── ...
│
├── docker-compose.yml         # PostgreSQL + Redis
├── .env.example               # Environment template
└── NIVA_AI_AGENT_BUILD_KIT/   # Build kit documentation
```

## 🔒 Security

- JWT authentication with session management
- bcrypt password hashing
- Rate limiting on all API endpoints
- Zod input validation
- Audit logging for sensitive actions
- Secrets never stored in logs or memory

## 📋 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Health check & system diagnostics |
| `/api/v1/auth/register` | POST | Register new user |
| `/api/v1/auth/login` | POST | Login with email/username |
| `/api/v1/auth/logout` | POST | Logout and invalidate session |
| `/api/v1/auth/me` | GET | Get current authenticated profile |
| `/api/v1/auth/security/status` | GET | Check real-human verification & PIN status |
| `/api/v1/auth/face/verified` | POST | Mark real-human facial biometric enrolled |
| `/api/v1/auth/pin/verify` | POST | Verify written PIN (enforces 1-time human check) |
| `/api/v1/auth/pin/set` | POST | Update user security PIN |
| `/api/v1/chat/conversations` | GET/POST | List & create AI chat sessions |
| `/api/v1/chat/conversations/:id` | GET/DELETE | Manage conversation history |
| `/api/v1/vision/analyze` | POST | Multimodal camera frame AI analysis |

## 🎨 Design System & Desktop Assistant

- **Web Dashboard**: Next.js 15 with Cyberpunk/Jarvis glassmorphism, animated glowing borders, and neural reticle overlays.
- **Desktop Arc Core**: Standalone floating Arc Reactor HUD widget for Windows with live CPU, RAM, Battery telemetry, voice wake ("Hey NIVA"), global hotkey (`Alt+Space`), and auto-start on laptop boot.
- **Privacy First**: Strict camera hardware track shutdown (`MediaStream.getTracks().stop()`) preventing camera LED indicator leaks.

## 📊 Completed Phases & Master System Status (All 17 Phases Complete)

- **Phase 00/01 — Foundation & Cloud Stack** ✅ (Docker PostgreSQL 16 & Redis 7, Prisma 14 models, Express 5, Next.js 15, Socket.IO real-time streaming).
- **Phase 02 — Core AI Brain & Intent Router** ✅ (Gemini 2.0 Flash + masculine Hindi/English fallback provider + 40 active system tools).
- **Phase 03 — Neural Voice Engine & Dynamic Switcher** ✅ (High-fidelity Web Speech API, sentence chunking, URL/code stripping, on-demand Male ⇄ Female voice switcher).
- **Phase 04 — Vision & Real-Human Face Biometrics** ✅ (Anthropometric skin tone & facial geometry scanner with strict camera hardware track shutdown).
- **Phase 05 — Hand Gesture Recognition & Air Drawing** ✅ (Real-time optical palm tracking, ✋ Open Palm Lock, ✌️ Screenshot, ☝️ Air Drawing, ✊ Minimize).
- **Phase 06 — Native Computer Control & IDE Launcher** ✅ (Windows native app launcher, taskmgr, settings, volume control, clipboard, file operations, auto-launching VS Code).
- **Phase 07 — Multi-Factor Security & Dual Auth** ✅ (Face Biometrics + Written PIN keypad with mandatory 1-time real-human verification check).
- **Phase 08 — Memory & Vector RAG Ingestion** ✅ (Persistent user memory recall/save in PostgreSQL + document ingestion & semantic context injection).
- **Phase 09 — Multi-Modal Generation Engine & Studio** ✅ (AI image synthesis via Pollinations/SVG fallback, multi-language code generation with IDE launch, document synthesis).
- **Phase 10 — Communication Hub & AI Calling** ✅ (Zero-cost Windows mail dispatch, WhatsApp Web / Telegram automated messaging, live 2-way AI voice call session).
- **Phase 11 — Internet Intelligence & Live Web Knowledge** ✅ (DuckDuckGo & Wikipedia search, Google News live RSS feed in sidebar & chat, HTML article extraction).
- **Phase 12 — Autonomous Workflow DAG Engine** ✅ (Multi-step sequential workflow engine, cron/interval scheduler, human-in-the-loop approval, in-chat workflow cards).
- **Phase 13 — Sandboxed Plugin Ecosystem** ✅ (Sandboxed Plugin SDK, dynamic tool lifecycle registration, GitHub, Crypto, Media Player, Shell extensions).
- **Phase 14 — Multi-Agent Squad Orchestration** ✅ (7 specialized AI agents: Lead Commander, Researcher, Engineer, Visionary, Archivist, Executor, Sentinel with inter-agent blackboard).
- **Phase 15 — Production DevOps & Live Backups** ✅ (Docker Compose prod with Nginx reverse proxy, real-time Postgres/Redis/Docker telemetry, SHA-256 verified database backups).
- **Phase 16 — Master Integration & Omnipresent In-Chat Experience** ✅ (All capabilities rendered via interactive cybernetic chat cards: System Telemetry, Squad Missions, Workflows, Plugins, Communication, DevOps, 50/50 Master Test Suite passed).

---

## 🏆 Master End-to-End Test Suite

Run the full system audit verifying all 17 phases:

```bash
cd server
npx ts-node src/test-master-integration.ts
```
*Result: 50 / 50 Checks Passed (100% Production Ready!)*

## 📄 License

Private — Harsh's 4th Final Year Project

---

<div align="center">
  <strong>Built with ❤️ for Harsh's 4th Final Year Project</strong>
</div>
