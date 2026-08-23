# Feature to Workflow Mapping - CommuteCast v3.2

This document maps every application feature to its designated Workstation based on the **Task-First** philosophy.

## 1. 🏠 HOME (Operator Console)
*Context: "What is my current status and what do I need to do next?"*

- **Feature: Continue Mission** (Mapping: `History` -> `Home`)
- **Feature: Active Queue** (Mapping: `SmartQueue` -> `Home`)
- **Feature: Background Tasks** (Mapping: `ExecutionStateView` -> `Home`)
- **Feature: Quick Action (New Mission)** (Mapping: `Create` Shortcut -> `Home`)

## 2. ✏️ CREATE (Production Studio)
*Context: "I want to produce a specific briefing from start to finish."*

- **Workflow Step: RESEARCH/SOURCE**
  - RSS Manager (Integrated)
  - Google News / Search
  - Manual Text/Paste
  - Voice Assistant Research
- **Workflow Step: DRAFT/SCRIPT**
  - AI Rewrite Engine
  - Translation Engine (Bilingual)
- **Workflow Step: VOICE/HOST**
  - Host Selection (Internal Host Picker)
  - Voice Cloning (Settings-defined Identity)
- **Workflow Step: PREVIEW/PRODUCE**
  - Manual PCM Player (Live Preview mode)
  - Final Generation Status

## 3. 📚 LIBRARY (Asset Management)
*Context: "I want to manage my projects and access my historical archives."*

- **Category: PROJECTS**
  - High-level folders (Education, Finance, Personal)
- **Category: MISSIONS**
  - Individual instances of productions.
- **Category: ASSETS**
  - Audio files (.wav, .mp3)
  - Scripts (Text/JSON)
  - Metadata
- **Category: EXPORTS**
  - Podcast RSS Feeds
  - Shared Links
- **Category: INSIGHTS**
  - Per-Project/Per-Mission Analytics (Consolidated from Analytics Tab)

## 4. ⚙️ SETTINGS (System Governance)
*Context: "I want to configure the global behavior of my platform."*

- **Category: MY EXPERIENCE**
  - Theme, Language, Notifications, Accessibility.
- **Category: MY VOICE (GLOBAL IDENTITY)**
  - Default Host settings.
  - Global Voice/Tone presets.
- **Category: NEWS PREFERENCES**
  - Global Topics, Sources, and Priority.
- **Category: ADVANCED (EXPERT MODE)**
  - Telemetry, Storage Stats, AI Model parameters (PCM, Temp, Tokens).
