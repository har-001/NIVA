# KNOWN ISSUES

1. Docker Desktop must be manually started before running the project.
2. `@types/bcryptjs` shows deprecated warning — bcryptjs v3 includes its own types. Can be removed from devDependencies.
3. npm audit shows 5 vulnerabilities in server dependencies (2 moderate, 3 high) — to be addressed before production deployment.
4. AI Brain (Phase 02) not yet implemented — chat currently returns placeholder response.
