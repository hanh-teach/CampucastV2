# Architectural Overview: CommuteCast (Mission OS)

This document outlines the real production software architecture, state lifecycle, and component topology of the CommuteCast platform.

---

## 1. System Topology

CommuteCast is a **Client-Heavy Operator Platform** with a secure server-side Node/Express proxy (`server.ts`). This structure keeps sensitive API keys hidden from the browser, performs vocal speech processing, and proxies RSS resource requests without CORS limitations.

```
       +--------------------------------------------------------+
       |               CLIENT WORKSPACE (React)                 |
       |                                                        |
       |  +--------------------+         +-------------------+  |
       |  |  Workstation Views | <-----> |   State Context   |  |
       |  | (Home / Studio HUD)|         | (Active Mission)  |  |
       |  +--------------------+         +-------------------+  |
       |            |                              ^            |
       |            v                              |            |
       |  +--------------------------------------------------+  |
       |  |                 Capability Layer                 |  |
       |  |  * rssService.ts        * broadcastSpeechEngine  |  |
       |  |  * telemetryService.ts  * indexedDBQueue.ts      |  |
       |  +--------------------------------------------------+  |
       |            |                              |            |
       +------------|------------------------------|------------+
                    | (Proxy REST Requests)        | (Durable Store IO)
                    v                              v
       +----------------------------+    +-----------------------+
       |     SECURE BACKEND PROXY   |    |  Local IndexedDB /    |
       |        (Node/Express)      |    |  Supabase Storage     |
       |                            |    |                       |
       |  +----------------------+  |    |  * IndexedDB Queue    |
       |  |      API Ingress     |  |    |  * Local Telemetry    |
       |  +----------------------+  |    +-----------------------+
       |  | * /api/tts             |  |
       |  | * /api/summarize       |  |
       |  | * /api/generate-news   |  |
       |  | * /api/voice-query     |  |
       |  | * /api/test-tts        |  |
       |  +----------------------+  |
       |            |               |
       |            v               |
       |  +----------------------+  |
       |  |   Capability SDKs    |  |
       |  | * GoogleGenAI SDK      |  |
       |  | * TextToSpeechClient |  |
       |  +----------------------+  |
       +----------------------------+
```

### Verification Commands:
*   **Verify Backend Entry Point**: `find . -name "server.ts"`
*   **Verify Client Directory**: `find src/ -maxdepth 1`

---

## 2. Core Architectural Pillars

The system operates strictly on three main architectural layers:

### A. Modular Client Capabilities (`src/services`)
Business and infrastructure services are separated into individual decoupled modules to promote maintainability and offline resilience:
*   **Storage Capability (`offlineStorageService.ts` / `indexedDBQueue.ts`)**: Manages local caching of multi-block audio chunks (Base64 buffers) and mission script metadata, allowing smooth offline playback on mobile devices without redownloading.
*   **Feed Capability (`rssService.ts`)**: Resolves, fetches, and parses raw XML feeds into structured content models.
*   **Telemetry Capability (`telemetryService.ts`)**: Tracks player metrics (play, pause, skip, completion rate) to analyze usability and user behavior.

### B. Express Server Proxy & Modular Routing (`server.ts` & `src/server/routes/`)
The server encapsulates cloud SDK operations and handles computationally expensive formatting tasks. It uses a modular routing architecture (Strangler-Fig pattern) to separate domain-specific logic:
*   **AI Summarizer Endpoint (`/api/summarize`)**: Invokes `@google/genai` to perform LLM-based text summarization, language detection, and tone adaptation.
*   **Hybrid Smart-TTS & Preview Endpoints (`/api/tts`, `/api/tts/preview`)**: Processes script text by splitting it into single-language segments and routing to the optimal engine. `/api/tts/preview` generates short high-fidelity vocal preview segments for chosen voices.
*   **Dynamic Voices Registry (`/api/voices`)**: Exposes available synthetic voices dynamically to eliminate client-side duplicates and preserve regional accents.
*   **Podcast Module (`/src/server/routes/podcast.routes.ts`)**: Manages the podcast lifecycle, RSS feed generation, and audio streaming, utilizing shared utilities for GCS/Supabase interaction.
*   **Shared Server Infrastructure (`/src/server/shared.ts`)**: Provides centralized client initialization and low-level audio processing utilities for the backend.

### C. Unified Workstation UI (`src/components` / `src/App.tsx`)
The user interface is modeled around a distraction-free, 4-Workstation workflow:
*   **Home (Operator Console)**: Consolidated summary, status indicators, and quick briefing replay.
*   **Create (Studio HUD)**: Step-by-step linear pipeline guiding the user from RSS sources to script generation and final audio production.
*   **Library (Asset Manager)**: Local files and shared cloud briefings management.
*   **Settings (Governance)**: API key managers and general text-to-speech engine defaults.

---

## 3. The Mission Lifecycle Flow

Briefing generation is managed client-side by the `useBriefingGeneration` orchestrator hook, which executes a series of sequential states mapped in `src/types.ts`:

```
[idle] ──► [initializing] ──► [fetching_sources] ──► [normalizing_content] ──► [building_queue] ──► [synthesizing_audio] ──► [ready_to_play]
```

*   `idle`: System rests, waiting for user trigger.
*   `initializing`: Workspace resets, caching mechanisms verify readiness.
*   `fetching_sources`: Crawls configured RSS links and manual inputs.
*   `normalizing_content`: Cleans HTML artifacts and standardizes input text formats.
*   `building_queue`: Invokes `/api/summarize` to obtain structured narrative scripts.
*   `synthesizing_audio`: Sends scripts to `/api/tts` in parallel segments and streams audio blocks.
*   `ready_to_play`: Aggregates the base64 chunks into client-side IndexedDB and loads them into `ManualPcmPlayer` for lag-free playback.

---

## 4. Architectural Mapping & Code Verification

Every architecture module is strictly mapped to actual production codebase files.

| Module / Component | Primary Files | Verification Command |
| :--- | :--- | :--- |
| **Server Entry Point** | `server.ts` | `find . -name "server.ts"` |
| **Podcast Router** | `src/server/routes/podcast.routes.ts` | `grep -rn "podcastRouter" server.ts` |
| **Shared Server Utils** | `src/server/shared.ts` | `ls src/server/shared.ts` |
| **Bilingual TTS Segmenter** | `server.ts` | `grep -rn "segmentTextByLanguage" server.ts` |
| **TTS Cache Engine** | `server.ts` | `grep -rn "initTtsCache" server.ts` |
| **Summarizer API Route** | `server.ts` | `grep -rn "app.post(\"/api/summarize\"" server.ts` |
| **Assistant Chat API Route** | `server.ts` | `grep -rn "app.post(\"/api/assistant-chat\"" server.ts` |
| **Offline Storage Service** | `src/services/offlineStorageService.ts` | `find src/services/ -name "offlineStorageService.ts"` |
| **IndexedDB Queue** | `src/services/indexedDBQueue.ts` | `find src/services/ -name "indexedDBQueue.ts"` |
| **RSS Service** | `src/services/rssService.ts` | `find src/services/ -name "rssService.ts"` |
| **Telemetry Service** | `src/services/telemetryService.ts` | `find src/services/ -name "telemetryService.ts"` |
| **Speech Engine Utility** | `src/services/broadcastSpeechEngine.ts` | `find src/services/ -name "broadcastSpeechEngine.ts"` |
| **Briefing generation orchestrator** | `src/hooks/useBriefingGeneration.ts` | `find src/hooks/ -name "useBriefingGeneration.ts"` |
| **Shared Application State types** | `src/types.ts` | `find src/ -name "types.ts"` |
| **Active Playback State enumeration** | `src/types.ts` | `grep -rn "ExecutionState" src/types.ts` |
| **Sound Player Interface** | `src/App.tsx` (ManualPcmPlayer) | `grep -rn "ManualPcmPlayer" src/` |
| **Production Studio Pipeline Service**| `src/services/productionPipeline.ts`| `find src/services/ -name "productionPipeline.ts"` |

---

## 5. Production Studio Pipeline Architecture (Sprint STU-110)

Sprint STU-110 fully refactored and decoupled the sequential briefing generation pipeline, eliminating circular and UI component dependencies. The pipeline is structured into four distinct, isolated, restartable, and resumable stages.

### Pipeline Topology & Stage Contracts

```
[Stage 1: Source Selection] 
        │
        ▼ (Output: ResearchPackage)
[Stage 2: Editorial Draft Engine] ---- (Decoupled service: generateEditorialDraft)
        │
        ▼ (Output: EditorialDraft)
[Stage 3: Speech Package Builder] ---- (Decoupled service: buildSpeechPackage)
        │
        ▼ (Output: SpeechPackage)
[Stage 4: Audio Generation Engine] ---- (useBriefingGeneration: executeStage4)
        │
        ▼ (Output: AudioAssembly)
[Fulfillment & Persistence]
```

### Core Pipeline Invariants

1. **Immutable Pipeline Artifacts**: Each stage produces a strictly typed, read-only data model:
   - **ResearchPackage**: Structured representation of raw crawled/pasted news articles.
   - **EditorialDraft**: The generated summary narrative (title, body, tags, style guidelines, metadata).
   - **SpeechPackage**: Detailed phonetic translation of the script broken into structured `SpeechSegment` items with pauses, host assignments, emotion weights, and SSML directives.
   - **AudioAssembly**: Merged voice tracks, audio chunks, and background music elements ready for local buffering.
2. **UI-Independence**: No stage reads data from active DOM or input elements (such as `textarea`). The pipeline consumes exclusively state variables managed by `PipelineContext`.
3. **Resumability and Isolation**: Stages can be restarted and executed independently using stateful step gates.
