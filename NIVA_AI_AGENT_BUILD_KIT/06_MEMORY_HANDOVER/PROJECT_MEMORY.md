# PROJECT MEMORY

Objective: Build NIVA as a modular, secure and hostable multimodal personal AI assistant for 4th final year college project.

Completed phases:
- Phase 00: Documentation & Planning
- Phase 01: Foundation (PostgreSQL 16, Redis 7, Express 5 + TS, Prisma ORM, JWT Auth & Sessions, Next.js 15 UI, Socket.IO real-time communication, Automated E2E test suite)

Active phase: Phase 02 — Core AI Brain

Key Architectural Decisions:
1. Docker Compose manages PostgreSQL and Redis containers.
2. Express 5 + TypeScript backend runs on port 3001.
3. Next.js 15 client runs on port 3002 (port 3000 used by Google Maps MCP server).
4. CORS allows localhost origins dynamically in development mode.
5. Socket.IO supports JWT handshake auth and real-time bi-directional messaging (`chat:send`, `chat:message`, `chat:status`, `chat:typing`).
6. Security includes bcrypt password hashing (12 rounds), JWT sessions, helmet headers, and express-rate-limit.
7. Automated E2E verification script located at `server/src/test-e2e.ts`.

Key Ports & Endpoints:
- Backend: `http://localhost:3001`
- Backend Health: `http://localhost:3001/api/v1/health`
- Frontend: `http://localhost:3002`
- Database: `localhost:5432` (`niva_db`)
- Redis: `localhost:6379`
