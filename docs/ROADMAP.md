# 🗺️ Master Roadmap: CommuteCast 5.0 (Mission OS)

This document maps the evolution of the CommuteCast 5.0 AI Mission Operating System as we transition from internal development to a Closed Beta release.

---

## 🚀 The 5.0 Release Pipeline

```
[ Platform Baseline (v5.0.0) ]  ──> [ Platform-001: Operational Excellence ]  ──> [ Platform-002: Closed Beta Onboarding ]
          (COMPLETE)                               (CURRENT SPRINT)                                (PLANNED)
                                                                                                       │
[ General Release (v5.5.0) ]   <── [ Platform-004: Integrations ]             <── [ Platform-003: Operational Security ]
```

---

## 📈 Sprint Execution Status

### Sprint Platform-001: Operational Excellence & Integrity (Current Focus)
*   **Status**: 🟡 **Conditionally Approved by Product Owner** (Active Implementation)
*   **Primary Objective**: Deliver enterprise-grade observability, telemetry, and platform-level self-healing capabilities.
*   **Key Deliverables**:
    *   ✓ **Platform Status (Progressive Disclosure)**: Collapse detailed layer statistics into a single "Mission Readiness: Ready (5/5)" action banner, unfolding details smoothly only when toggled.
    *   ✓ **Mission Telemetry (Structured Events)**: Replace unstructured console log text strings with high-fidelity, queryable JSON logs containing `timestamp`, `actor` (RSS, AI, Voice, Storage, Operator), `duration`, `status` (success, failed, retrying), and `retryCount`.
    *   ✓ **Interactive Time Machine (Mission Replay)**: Build a fully interactive, scrubbable playback widget that steps through structured events to visually trace a mission's execution.
    *   ✓ **Platform Diagnostics Node (Self Test)**: Implement a user-facing diagnostics runner that performs pings and validation checks on critical layers (RSS Parser, Gemini API, Voice TTS, IndexedDB Storage, Port 3000 Gateway).
    *   ✓ **Self-Healing UI & Automatic Recovery**: Hide technical stack traces from the operator, replacing them with automatic retry alerts, fallback audio routes, and user-oriented recovery feedback.

### Sprint ARCH-101: Backend Modularization & Monolith Reduction (Completed)
*   **Status**: ✅ **SUCCESSFUL SPRINT** (2026-07-09)
*   **Primary Objective**: De-risk the monolithic `server.ts` by extracting non-core routes into modular, domain-specific routers.
*   **Key Deliverables**:
    *   ✓ **Strangler-Fig Podcast Extraction**: Successfully moved all `/api/podcast/*` and `/api/local-podcasts/*` logic to `src/server/routes/podcast.routes.ts`.
    *   ✓ **Shared Infrastructure Layer**: Centralized Supabase, GCS, and low-level audio utilities into `src/server/shared.ts`.
    *   ✓ **Regression Parity**: Verified 100% functional parity with new automated test suites and manual curl validation.
    *   ✓ **Code Health**: Reduced main server file complexity and resolved legacy lint/type inconsistencies.

### Sprint Platform-002: Closed Beta Onboarding & Operator Experience (Planned)
*   **Status**: 📅 **Planned / Backlog**
*   **Primary Objective**: Ensure a new user or operator can successfully produce their first custom audio briefing in under 5 minutes without reading manuals.
*   **Key Deliverables**:
    *   **Interactive Operator Tour**: An animated step-by-step introduction guiding first-time users through configuring and launching their initial mission.
    *   **Template / Sample Missions**: Pre-configured mission templates (e.g. "Silicon Valley Morning Tech Digest," "Witty Global General News Brief") to instantly run out of the box.
    *   **1-Click Bug Reporting & Feedback**: Native feedback submitter in the header, capturing structured local telemetry state automatically without manual console log copying.

### Sprint Platform-003: Operational Security & PWA Hardening (Planned)
*   **Status**: 📅 **Planned / Backlog**
*   **Primary Objective**: Secure operator data and enhance local performance.
*   **Key Deliverables**:
    *   **Local Telemetry Encryption**: Safely encrypt IndexedDB storage caches and sensitive configuration profiles.
    *   **PWA Asset Pre-Caching**: Configure Service Workers to cache critical UI layouts, icons, and static assets, ensuring the control room remains fully accessible during transport interruptions.

---

## 🎯 Long-term Milestones

1.  **v5.1.0 (Closed Beta Release)**: Released to a selected cohort of 100 enterprise news curators and daily commuting professionals.
2.  **v5.2.0 (Multi-Host Dialogues)**: High-fidelity dual-host AI commentary (including crosstalk, interruptions, and natural audio hand-offs).
3.  **v5.5.0 (General Distribution OS)**: Open platform release supporting native Spotify, Apple Podcasts, and RSS-to-Audio distribution protocols.
