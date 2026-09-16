# Product Requirements Document — NIVA

## Vision
NIVA is a multimodal, secure and hostable personal AI assistant combining natural text and voice interaction with vision, hand gesture recognition, controlled computer automation, memory, RAG, AI generation, communication and automation.

NIVA should feel natural and conversational while remaining transparent that it is AI.

## Current Platforms
- Web
- Desktop/trusted local agent
- Hostable backend/API

## Future Platforms
- Android
- iOS

## Required Features
### Interaction
Text chat, voice interaction, multilingual understanding/responses, contextual conversation and natural personality.

### Vision
Camera understanding, image analysis, OCR, object detection and authorized screen understanding.

### Hand Gestures
Hand tracking, built-in/custom gestures, custom gesture mapping, air mouse, air drawing, draw-a-box recognition, confidence thresholds and accidental-trigger protection.

### Computer Control
Applications, windows, mouse, keyboard, files, clipboard, browser automation, screenshots and safely confirmed lock/restart/shutdown.

### Security
Password/PIN, optional biometric adapters, 2FA, sessions, devices, permissions, audit logs and emergency lock.

### Memory/RAG
Conversation persistence, explicit remember/forget, user-controlled long-term memory, document ingestion, RAG and semantic search.

### AI Generation
Images, audio, voice, video, code, documents and presentations through provider adapters and background jobs.

### Communication
Contact resolution, messages, email and calls through technically supported and authorized integrations. AI-assisted calls require explicit authorization. Incoming-call assistance must be explicitly enabled and supported. Recording requires visible status and applicable consent handling.

### Automation
Schedules, workflows, triggers, conditions, retries, approvals and notifications.

### Extensibility
Plugins, provider abstraction and multi-agent orchestration.

## Out of Scope
Native mobile apps in current phases, hidden recording, unauthorized platform automation, credential bypass and unrestricted arbitrary shell execution.
