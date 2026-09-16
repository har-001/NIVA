# System Architecture

Web Client
    |
Desktop Client / Trusted Local Agent
    |
NIVA Backend/API
    |
    +-- AI Provider Layer
    +-- Tool Registry + Policy Layer
    +-- Communication
    +-- Memory/RAG
    +-- Automation/Jobs
    +-- Plugin System
    +-- PostgreSQL
    +-- Redis/Queue

## Trust Boundary
A hosted backend must never automatically receive unrestricted control of the user's local computer. Camera, microphone, local files, keyboard/mouse and applications are mediated by an authenticated and authorized local agent.
