# Architectural Decisions

1. Mobile is future scope.
2. Local computer control is separated from hosted backend.
3. AI, communication and generation use provider adapters.
4. Handover documentation is mandatory.
5. **Tech stack**: Next.js 15 (frontend) + Express 5 (backend) + TypeScript throughout.
6. **Database**: PostgreSQL 16 with Prisma ORM for type-safe access and migrations.
7. **Auth**: JWT tokens + bcrypt + server-side session validation.
8. **Real-time**: Socket.IO for chat, AI responses, and status updates.
9. **Design**: Dark premium theme, Inter font, glassmorphism, CSS custom properties for design tokens.
10. **AI Provider**: Abstraction layer supporting Gemini (primary), OpenAI, Ollama.
11. **API**: RESTful under /api/v1/ + WebSocket for real-time features.
12. **Deployment target**: Vercel (frontend, free) + Railway (backend, free/hobby tier).
