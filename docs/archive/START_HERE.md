# 🚀 START HERE: CommuteCast 5.0 Platform Onboarding

Welcome to the CommuteCast 5.0 Platform. This document is a 5-page rapid onboarding guide for new developers and AI agents. It explains the core architectural concepts of the platform so you can contribute effectively without reading 50 pages of legacy documentation.

CommuteCast 5.0 is an **Operator Platform**, not a standard consumer app. Think of it like a control center for producing personalized audio briefings.

---

## 1. What is a "Mission"?

A **Mission** is the core operational unit of CommuteCast. It represents a single, end-to-end task of generating a briefing.

*   **Not just an article:** A Mission takes raw data (RSS feeds, news), analyzes it using an AI model (like Gemini), and synthesizes it into an audio briefing using a Voice Engine.
*   **Mission Lifecycle:** 
    1.  `DRAFT`: Being configured.
    2.  `QUEUED`: Waiting to be executed.
    3.  `PROCESSING`: AI and Voice engines are actively working on it.
    4.  `SUCCESS` / `FAILED`: Execution result.
*   **Mission Model:** All data flows through a strict `MissionModel`. Never create intermediate data types like `RSSItem` or `Article` outside of the source connectors. Everything normalizes into the `MissionModel`.

---

## 2. What is a "Workspace"?

CommuteCast UI is divided into **Workspaces**. We do not use traditional "pages" or "screens." A Workspace is an isolated environment designed for a specific Operator workflow.

*   **The 5 Core Workspaces:**
    1.  **Home (Dashboard):** High-level overview, quick actions, and system status.
    2.  **Mission Studio (Create):** The workbench where the Operator configures and launches new Missions.
    3.  **Assets (Library):** The storage area for saved briefings, favorite episodes, and raw audio files.
    4.  **Mission Intelligence (Analytics):** The diagnostic deck showing execution history, AI decisions, and performance root-cause analysis.
    5.  **Platform Control Center (Settings):** Global configuration for AI Models, Voice Engines, RSS Providers, and Cache.
*   **Isolation (Error Boundaries):** Workspaces are lazy-loaded and wrapped in Error Boundaries. If Mission Studio crashes, Home and Playback must remain completely unaffected.

---

## 3. What is a "Capability"?

A **Capability** is an independent, replaceable module that provides a specific service to the platform. CommuteCast is designed to swap Capabilities easily without rewriting the core.

*   **Examples:**
    *   `Voice Capability` (Edge-TTS, Google TTS, OpenAI TTS)
    *   `AI Capability` (Gemini 1.5 Flash, GPT-4o)
    *   `Storage Capability` (LocalForage, Supabase, IndexedDB)
*   **Rule:** The core platform orchestrates Capabilities, but never tightly couples to them. A Mission does not care *which* Voice Engine is used, only that the Voice Capability fulfills the contract.

---

## 4. What is a "Repository"?

A **Repository** is the data access layer. It abstracts away *where* and *how* data is stored.

*   **Why we use it:** Instead of calling `localStorage.setItem` directly in a UI component, the component calls `NewsRepository.save()`.
*   **Benefits:** This allows us to transparently swap out the underlying storage (e.g., migrating from `localStorage` to `IndexedDB` or a cloud database) without changing a single line of UI code.
*   **Rule:** UI components MUST NOT contain direct data fetching or storage logic. All data access must route through a Repository.

---

## 5. What is a "Workflow"?

A **Workflow** represents the step-by-step state machine that executes a Mission.

*   **The Pipeline:** `Source` (RSS) -> `Script` (AI) -> `Voice` (TTS) -> `Produce` (Audio).
*   **Recovery & Resilience:** Workflows must be recoverable. If the pipeline crashes at the `Voice` stage, the Workflow must be able to resume from the `Script` stage without re-fetching RSS or re-running the AI prompt.
*   **Rule:** Workflows must emit Telemetry events at every state transition. This is how the Mission Intelligence workspace visualizes the execution graph and diagnoses failures.

---
**Next Steps:**
Before writing any code, always check the `PLATFORM_READINESS_REPORT.md` to ensure your proposed change aligns with the current sprint goals (e.g., Operational Excellence, Beta Readiness).
