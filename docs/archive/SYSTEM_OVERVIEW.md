# 🏗️ CommuteCast 5.0 System Overview

This document provides a high-level architectural map of CommuteCast 5.0. It is designed to be read in 20 minutes to give you the mental model of how data flows through the platform.

## 1. System Topology

CommuteCast is a **Client-heavy Operator Platform** with a server-side proxy for sensitive operations (API Keys).

```mermaid
graph TD
    %% Client Side
    subgraph Client Application (React / Vite)
        UI[Workspace UI]
        State[State Management / Hooks]
        Repo[Repositories - IndexedDB/Local]
        Orchestrator[Mission Orchestrator]
    end

    %% Server Proxy
    subgraph Server Proxy (Node.js)
        ProxyAPI[Proxy API Routes]
        TelemetryDB[(Telemetry / Logs)]
    end

    %% External Services
    subgraph Capabilities (External)
        RSS[RSS Feeds]
        AI[Gemini / AI Models]
        Voice[Edge-TTS / Voice Engines]
    end

    UI --> State
    State --> Orchestrator
    State --> Repo
    Orchestrator --> ProxyAPI
    ProxyAPI --> RSS
    ProxyAPI --> AI
    ProxyAPI --> Voice
```

## 2. The Mission Pipeline

Every Mission goes through a strict state machine. Understanding this pipeline is critical for debugging.

1.  **Ingestion:** `SourceConnector` fetches XML from RSS providers and normalizes it into `NewsModel`.
2.  **Synthesis:** The `AI Capability` takes `NewsModel` and a prompt to generate a JSON script of the briefing.
3.  **Vocalization:** The `Voice Capability` generates audio (PCM/MP3) for the script.
4.  **Production:** The `Audio Player` / `Offline Storage` saves the final artifact.

If a failure occurs, the orchestrator logs a `MissionEvent` to the Telemetry system. The pipeline can **Resume** from the last successful stage.

## 3. Key Directories

*   `src/components/`: Reusable UI elements and Workspace containers.
*   `src/features/`: Domain-specific logic (e.g., Settings, Memory, Analytics).
*   `src/services/`: Connectors to external APIs and local repositories (Storage, RSS, Sync).
*   `server.ts`: The Express backend proxy. **Never expose API keys in `src/`. Always proxy through `server.ts`.**
*   `docs/`: Architecture decisions, RFCs, and documentation.

## 4. Error Handling Philosophy

*   **Workspace Isolation:** Each major UI area (Home, Mission Studio, Assets) is wrapped in a React `ErrorBoundary`. A crash in one workspace does not crash the platform.
*   **Graceful Degradation:** If the network goes down, the UI must adapt. The `Offline Simulation` and `Autosave` mechanisms ensure Operator work is never lost.
*   **Traceability:** Errors are not just console logs. They are structured `Telemetry` events that power the Mission Intelligence workspace.

## 5. Deployment

*   CommuteCast is built as a single container running Node.js (serving both the compiled Vite SPA and the Express proxy).
*   Port 3000 is the only exposed port.
