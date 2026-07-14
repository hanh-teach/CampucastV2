# Settings Dependency Graph

This document maps the relationships between settings to ensure **Progressive Disclosure**.

## 1. Core Dependencies

| Controller Setting | Dependent Sections | Visibility Rule |
| :--- | :--- | :--- |
| **AI Personalization** | AI Personality, Prompt Tuning | Visible only if AI is Enabled. |
| **Memory Engine** | Shared History, User Preferences | Visible only if Memory is Enabled. |
| **Driving Mode** | HUD Layout, Voice-Only Controls | Visible only if Driving Mode is Active. |
| **Multi-Voice Mode** | Speaker Selection, Voice Switching Rules | Visible only if Engine supports multi-voice. |

## 2. Capability Fallbacks
If a specific capability provider (e.g., Gemini) is unavailable:
- The associated settings are marked with a `Warning` icon.
- A "Switch Provider" recommendation is shown.
- Fields are disabled but not hidden (to explain *why* they don't work).
