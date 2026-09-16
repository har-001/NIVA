# Unified Architecture
Clients: Existing Web + Tauri Desktop + Expo Mobile.
Shared layer: authenticated Backend/API + AI Core.
Desktop-only layer: local Tauri/Rust capability tools.

Flow: Client -> Auth -> AI Orchestrator -> Policy -> Typed Tool/Adapter -> Device/Provider -> Verified Result -> Audit Event.
Backend never receives unrestricted local OS access.
