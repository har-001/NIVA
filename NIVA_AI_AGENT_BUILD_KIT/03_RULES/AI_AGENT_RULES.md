# Critical AI Agent Rules

Never without explicit approval:
- Delete project files/user data
- Reset databases
- Drop tables
- Run destructive migrations
- Disable security
- Expose secrets
- Force-push or rewrite Git history
- Remove tests to make builds pass
- Add hidden telemetry/recording
- Send real messages/emails/calls

Protection:
1. Inspect before editing.
2. Prefer small patches.
3. Preserve compatibility.
4. Keep interfaces stable.
5. Stop before breaking changes.
6. Never overwrite `.env`.
7. Never fake success.
8. Never replace working code with placeholders.
