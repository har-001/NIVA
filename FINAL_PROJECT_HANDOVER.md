# NIVA — Final Project Handover & Viva Demonstration Manual
**Neural Intelligent Virtual Assistant**  
*4th Final Year B.Tech CSE Major Project — 2026*  
*Candidate: Harshit*

---

## 🌟 Executive Summary

**NIVA** (*Neural Intelligent Virtual Assistant*) is an omnipresent, cross-platform personal AI assistant and autonomous agent ecosystem engineered for modern workstations and mobile devices.

Unlike standard conversational chatbots that only output text, NIVA combines:
1. **Multimodal AI Brain**: Dual-tier Gemini 2.0 Flash with local masculine baritone fallback and 41 registered tools.
2. **Deep Desktop Workstation Control**: Safe, permission-gated execution of OS commands, window management, audio controls, screenshot capture, and IDE launchers (VS Code, Notepad, Terminal).
3. **Floating Desktop Arc HUD**: Standalone lightweight Tauri v2 + Rust HUD with global hotkey (`Alt+Space`), system diagnostics, and wake-word listener.
4. **Mobile Expo Client (Android/iOS)**: Real-time token streaming via Socket.IO, camera vision object analysis, speech synthesis engine, long-term neural vector memory hub, and remote workstation control deck.
5. **Cross-Channel Communication Hub**: Outbound automated dispatch (Email, WhatsApp, Telegram) and an AI Calling Assistant HUD with compliant, opt-in consent-gated recording and live real-time dialogue transcription.
6. **Multi-Agent Squad Orchestration**: 7 specialized autonomous AI agents (Lead Commander, Researcher, Engineer, Visionary, Archivist, Executor, Sentinel) operating over a shared blackboard.
7. **Autonomous Workflow DAG Engine**: Multi-step DAG workflows with scheduled cron execution and human-in-the-loop approvals.

---

## 🏛️ System Architecture

```
                                  ┌───────────────────────────────┐
                                  │   NIVA Mobile App (Expo)      │
                                  │  - Socket.IO Live Streaming   │
                                  │  - Camera Multimodal Vision   │
                                  │  - Remote PC Deck & Volume    │
                                  │  - Neural Memory Hub          │
                                  │  - AI Calling HUD & Comms     │
                                  └──────────────┬────────────────┘
                                                 │ HTTP / WebSocket
                                                 ▼
┌──────────────────────────┐      ┌───────────────────────────────┐      ┌──────────────────────────┐
│  NIVA Desktop (Tauri/Rust│ ◄──► │      NIVA Backend Core        │ ◄──► │  NIVA Web Console        │
│  - Floating Arc Reactor  │      │   Express 5 + TypeScript      │      │   Next.js 15 (React 19)  │
│  - Alt+Space Global HUD  │      │  - Dual-Tier AI Router        │      │  - Cyberpunk Jarvis UI   │
│  - System Hardware Probe │      │  - 41 Tool Registry           │      │  - Live Voice Orb        │
│  - Native App Launcher   │      │  - Device Pairing Service     │      │  - Biometric Face Scanner│
└──────────────────────────┘      │  - Multi-Agent Orchestrator   │      │  - Optical Air Gestures  │
                                  └──────────────┬────────────────┘      └──────────────────────────┘
                                                 │
                                  ┌──────────────┴────────────────┐
                                  │   PostgreSQL 16 & Redis 7     │
                                  │  - Vector RAG Embeddings      │
                                  │  - Sessions & Audit Logs      │
                                  │  - Automated SHA-256 Backups  │
                                  └───────────────────────────────┘
```

---

## 📋 Comprehensive Phase Roadmap & Status

### A. Web & Backend Core (Phases 00 – 16)
| Phase | Feature Description | Status |
| :--- | :--- | :--- |
| **00/01** | Foundation & Cloud Stack (Docker, Postgres, Redis, Express 5, Next.js 15) | ✅ Complete |
| **02** | Core AI Brain & Intent Router (Gemini 2.0 Flash + Baritone fallback + 41 tools) | ✅ Complete |
| **03** | Neural Voice Engine & Dynamic Switcher (Sanitizer, Web Speech, Male ⇄ Female) | ✅ Complete |
| **04** | Vision & Real-Human Face Biometrics (Optical scanner with hardware shutdown) | ✅ Complete |
| **05** | Hand Gesture Recognition & Air Drawing (Open Palm Lock, Air Draw PIN) | ✅ Complete |
| **06** | Native Computer Control & IDE Launcher (Windows apps, volume, clipboard, VS Code) | ✅ Complete |
| **07** | Multi-Factor Security & Dual Auth (Biometric Face ID + Written PIN keypad) | ✅ Complete |
| **08** | Memory & Vector RAG Ingestion (Persistent memories & document embeddings) | ✅ Complete |
| **09** | Multi-Modal Generation Engine & Studio (AI image synthesis, code generator) | ✅ Complete |
| **10** | Communication Hub & AI Calling (Email dispatch, WhatsApp/Telegram, AI Call) | ✅ Complete |
| **11** | Internet Intelligence & Live Web Knowledge (DuckDuckGo, Wikipedia, Google News) | ✅ Complete |
| **12** | Autonomous Workflow DAG Engine (Sequential DAG pipeline, cron scheduler) | ✅ Complete |
| **13** | Sandboxed Plugin Ecosystem (Dynamic tool registration, SDK extensions) | ✅ Complete |
| **14** | Multi-Agent Squad Orchestration (7 specialized AI agents + blackboard) | ✅ Complete |
| **15** | Production DevOps & Live Backups (Nginx reverse proxy, SHA-256 backup) | ✅ Complete |
| **16** | Master Omnipresent In-Chat Experience (Interactive cybernetic cards) | ✅ Complete |

### B. Unified Cross-Platform Clients (Phases 00 – 11)
| Unified Phase | Module & Focus | Status |
| :--- | :--- | :--- |
| **Phase 00** | Cross-Client Audit & Architecture Alignment | ✅ Complete |
| **Phase 01** | Desktop Tauri v2 + Rust Foundation | ✅ Complete |
| **Phase 02** | Desktop Voice & Floating Arc Reactor HUD (`Alt+Space`) | ✅ Complete |
| **Phase 03** | Safe Workstation System Control & Diagnostics | ✅ Complete |
| **Phase 04** | Desktop Optical Vision & Hand Gesture Recognition | ✅ Complete |
| **Phase 05** | Mobile Expo Foundation (Auth, Resilient LAN Bridge, Storage) | ✅ Complete (17/17 Audit) |
| **Phase 06** | Mobile Expo Features (Socket Stream, Vision, Voice, Memory, Remote Deck) | ✅ Complete (26/26 Audit) |
| **Phase 07** | Communication Hub (WhatsApp, Email, Telegram, AI Call Assistant HUD) | ✅ Complete (17/17 Audit) |
| **Phase 08** | Unified Device Pairing & Cross-Platform State Sync (`/api/v1/devices`) | ✅ Complete |
| **Phase 09** | Master Automated Test Suites & Zero-Error Compilation | ✅ Complete |
| **Phase 10** | Production Deployment & Master Launcher (`start-niva-unified.bat`) | ✅ Complete |
| **Phase 11** | Final Project Viva Demonstration & Handover Kit | ✅ Complete |

---

## 🧪 Master Test Results & Quality Metrics

1. **Mobile Foundation Test Suite** (`mobile/test-mobile-foundation.ts`):
   - **Result**: `17 PASSED / 0 FAILED (100%)`
   - Verified: Storage persistence, dynamic URL resolution, health probe, JWT session lifecycle, telemetry parsing, remote app launcher dispatch, chat fallbacks.

2. **Mobile Features Test Suite** (`mobile/test-mobile-features.ts`):
   - **Result**: `26 PASSED / 0 FAILED (100%)`
   - Verified: Socket.IO event listeners, voice engine TTS, multimodal vision frame analysis, neural memory CRUD, PC remote deck (volume up/down/mute, play/pause, screenshot), mobile device pairing.

3. **Unified Integration Test Suite** (`mobile/test-unified-integration.ts`):
   - **Result**: `17 PASSED / 0 FAILED (100%)`
   - Verified: Contact directory filtering and persistence, WhatsApp/Email/Telegram dispatch, AI call session initialization, compliant opt-in recording toggle, live speech-to-transcript flow, device identity verification.

4. **Static Type Safety Check**:
   - `server`: `npx tsc --noEmit` -> **0 errors**
   - `mobile`: `npx tsc --noEmit` -> **0 errors**

---

## 🚀 How to Run the Entire Ecosystem (Viva Demo Guide)

### Option 1: One-Click Master Launcher (Recommended)
Double click or run:
```cmd
start-niva-unified.bat
```
This automatically starts:
1. Docker database verification
2. NIVA Backend server on `http://localhost:3001`
3. NIVA Web Console on `http://localhost:3002`
4. NIVA Desktop Arc Reactor HUD widget
5. NIVA Expo Mobile Metro bundler on `http://localhost:8081`
6. Opens the default browser to the Command Center

### Option 2: Step-by-Step Manual Launch
```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Web Client
cd client
npm run dev

# Terminal 3 — Mobile App (Expo)
cd mobile
npx expo start
```

---

## 🎓 College Viva & Examiner Demonstration Script

Follow these 5 steps to give an impressive viva presentation:

### Step 1: Web Command Center & Arc Core (2 Mins)
1. Open `http://localhost:3002`. Show the dark glassmorphic cybernetic dashboard.
2. Click the center **Voice Orb** or press `Alt+Space` to summon NIVA.
3. Speak: *"Hello NIVA, who are you and what are your capabilities?"*
4. Show the AI baritone response and the interactive capability cards.

### Step 2: Native Workstation Automation & Security (2 Mins)
1. Tell NIVA: *"Open VS Code and check system diagnostics."*
2. Watch NIVA safely launch VS Code on Windows and render real-time CPU/RAM/Battery metrics.
3. Show the **Face Biometrics** and **Secondary PIN Keypad** (`0000`) for high-security actions.

### Step 3: Mobile Remote Control & Camera Vision (3 Mins)
1. Launch the Expo Mobile app (`cd mobile && npx expo start`).
2. Show the **REMOTE** tab:
   - Tap `🔊 VOL +` or `🔉 VOL -` to control the laptop volume from the phone.
   - Tap `📸 CAPTURE PC SCREEN` to take a workstation screenshot remotely.
   - Tap `🔒 INSTANT LOCK LAPTOP WORKSTATION` to demonstrate remote security lock.
3. Show the **CORE** tab: Tap `📸 SCAN ENVIRONMENT VIA CAMERA` to run Gemini 2.0 multimodal vision analysis.

### Step 4: Cross-Channel Communication & AI Calling HUD (2 Mins)
1. Switch to the **COMMS** tab on the phone.
2. Select **DISPATCH** -> Select `WhatsApp` -> Type a test message and send.
3. Select **AI CALL HUD** -> Tap `📲 SIMULATE INCOMING CALL FROM GUIDE`:
   - Demonstrate NIVA answering the incoming call autonomously.
   - Show the live transcript streaming both caller and AI speech.
   - Tap `⚪ RECORD CALL (OPT-IN)` to demonstrate privacy-compliant recording consent.

### Step 5: Neural Memory & Multi-Agent Squads (2 Mins)
1. Switch to the **MEMORY** tab on the phone:
   - Search recalled memories.
   - Add a new memory item: *"External Examiner evaluated NIVA project on 24 Sept 2026."*
2. Demonstrate how memories sync across phone and laptop.

---

## 📁 College Documentation Reference

All college-specific submission files, graphics, and compilation scripts are archived under:
[`Clg Docs/Synopsis/`](file:///c:/Users/harsh_2pgm3oe/OneDrive/Documents/Coding/Project/NIVA/Clg%20Docs/Synopsis)

- **Word Document**: [`Synopsis 2026.docx`](file:///c:/Users/harsh_2pgm3oe/OneDrive/Documents/Coding/Project/NIVA/Clg%20Docs/Synopsis/Synopsis%202026.docx)
- **PDF Document**: [`Synopsis 2026.pdf`](file:///c:/Users/harsh_2pgm3oe/OneDrive/Documents/Coding/Project/NIVA/Clg%20Docs/Synopsis/Synopsis%202026.pdf)
- **Automated Compiler Script**: [`build_synopsis.py`](file:///c:/Users/harsh_2pgm3oe/OneDrive/Documents/Coding/Project/NIVA/Clg%20Docs/Synopsis/build_synopsis.py)
- **Assets & Diagrams**: [`assets/`](file:///c:/Users/harsh_2pgm3oe/OneDrive/Documents/Coding/Project/NIVA/Clg%20Docs/Synopsis/assets) (College logos, 70% phase bar chart, architecture diagram)

---

<div align="center">
  <strong>Project NIVA is 100% complete, fully verified, and ready for Final Viva Submission.</strong>
</div>
