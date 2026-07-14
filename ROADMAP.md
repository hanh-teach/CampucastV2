# Roadmap

## Research Portfolio

### Listening Experience
- **ACTIVE**
  - **ERC-003 (Post-3.2.16-RC)**: "Among sessions with <50% completion, what single factor explains ≥60% of abandonments?"
    - **Status**: SUCCESSFUL / SHIPPED (2026-07-03)
    - **Outcome**: Multi-block Audio Delivery resolved container corruption and artifacts. Completion rates stabilized.
    - **Change-Point v3.2.16-RC**: Introduced "Broadcast Grade" TTS Pipeline.
- **PLANNED**
  - **CommuteCast v4 Enterprise**: Implementation of Spotify AI DJ Architecture (Event-driven, Segments, Multi-block Delivery).
- **BACKLOG**
  - **ERC-006**: "What is the optimal briefing duration for the average commute?"
  - **ERC-007**: "Does synthetic voice variety impact retention?"

### Trust & Reliability
- **PLANNED**
  - **ERC-004**: "What specific UI interactions contribute most to subjective Trust Score?"
- **BACKLOG**
  - **ERC-009**: "Does explicit recovery messaging (vs silent recovery) increase session completion?"

### Personalization
- **PLANNED**
  - **ERC-005**: "How does the time of day impact Morning Briefing engagement?"

### Retention
- **BACKLOG**
  - **ERC-010**: "What is the correlation between 'News Topic Variety' and D7 Retention?"

---

## 🏗️ CommuteCast v4 Enterprise Milestones & History

### 🏁 Phase A: Mission Core (PLATFORM FREEZE ❄️)
- **Sprint UX-022B: Mission Model & Bus [COMPLETED]** ✅
- **Sprint UX-020A.0: Operator Intent Model [COMPLETED]** ✅
  - Goal: Information Architecture, Goal Mapping, and Intent Taxonomy.
  - Deliverables: `OPERATOR_INTENT_MODEL.md`, `PREFERENCE_TREE.md`, `SETTINGS_DECISION_FLOW.md`.

### 🚀 Release Milestones [PHASE B]
- **Sprint HUD-102: Intelligent Motion Detection & Auto-suggest Driving Mode [COMPLETED]** ✅
  - Goal: Implement a low-power, privacy-first client-side motion detection system to suggest entering the Driving HUD when commuting is detected.
  - Deliverables: Custom `useMotionDetection.ts` hook utilizing `navigator.geolocation.watchPosition` with Haversine speed fallback, non-intrusive motion-animated toast suggestion inside `App.tsx`, strict opt-in toggles under Driving Assistant mixer settings, and an extensive unit test suite with 100% code coverage.
- **Mission Platform [COMPLETED]** ✅
- **Architecture Freeze [COMPLETED]** ✅
- **Home Freeze [COMPLETED]** ✅
- **Mission Studio RC [COMPLETED]** ✅
- **Sprint STU-113: Dynamic Listening Experience & Vocal Previews [COMPLETED]** ✅
  - Goal: Replace hardcoded placeholder voices with a dynamic, backend-driven registry, restore regional Edge TTS accents, and provide responsive vocal preview controls.
  - Deliverables: Dynamically populated voice list from `/api/voices`, inline play/stop preview buttons utilizing `/api/tts/preview`, dynamic local fallback structure, and fully corrected Edge TTS neural voices mapping.
- **Platform Stabilization [COMPLETED]** ✅
- **Sprint UI-102: Pinnable & Hover-Expanded Responsive Sidebar [COMPLETED]** ✅
- **Mission Studio Freeze [COMPLETED]** ✅
- **Workspace Pattern Freeze [COMPLETED]** ✅
- **Assets Experience [COMPLETED]** ✅
  - Goal: Validate the Assets Workspace against Release Readiness criteria.
  - Deliverables: Workflow Demo, Performance/A11y Metrics, AI Action validation.
- **Mission Intelligence Blueprint [COMPLETED]** ✅
  - Goal: Design the blueprint for the Mission Intelligence Workspace (formerly History) before implementation.
  - Deliverables: Mission Summary, Timeline Model, Production Graph, Replay Flow, Root Cause View.
- **Mission Intelligence Experience [COMPLETED]** ✅
  - Goal: Validate the MVP implementation of Mission Intelligence.
  - Deliverables: Evidence Package (Screenshots, Profiler, Lighthouse, Golden Workflow).
- **Settings Workspace (Platform Control Center) [COMPLETED]** ✅
- **Platform Polish [COMPLETED]** ✅
  - Goal: Animation, Typography, Skeleton, Error State, Empty State, Focus Ring, Keyboard, Micro Interaction, Responsive, Memory Leak Audit, Bundle Audit.
- **Sprint STU-110: Production Studio Pipeline Refactoring [COMPLETED]** ✅
  - Goal: Refactor the sequential creation pipeline to decouple Stage 2 (Editorial Draft Engine) and Stage 3 (Speech Package Builder) into isolated, testable, and resumable services.
  - Deliverables: `/src/services/productionPipeline.ts` containing the service layer, explicit domain contracts in `/src/types.ts` (`ResearchPackage`, `EditorialDraft`, `SpeechPackage`, `AudioAssembly`), and stage-based orchestrator executors in `useBriefingGeneration.ts`.
- **Sprint STU-111: Stage 4 Audio Rendering Engine Isolation [COMPLETED]** ✅
  - Goal: Decouple Stage 4 (Audio Rendering Engine) into a pure service layer that accepts only a `SpeechPackage`, manages all synthesis dependencies cleanly, and returns an immutable `AudioArtifact`.
  - Deliverables: `renderAudio` service function in `/src/services/productionPipeline.ts`, `AudioArtifact` data structure in `/src/types.ts`, and full integration of resume-rendering, cancellation, retry strategies, and verification checksums in `useBriefingGeneration.ts`.
- **Sprint STU-112: Two-Step Decoupled Pipeline Interaction Layout [COMPLETED]** ✅
  - Goal: Decouple script creation from voice synthesis in the Mission Studio Workspace to support user edits prior to synthesis.
  - Deliverables: Two-step pipeline execution triggers, Stage 2 editor "Next" navigation button, and context-aware ProgressiveFeedback matching the specific generation state.
- **Sprint STU-108: Validation-Driven Empty Segment Filtering [COMPLETED]** ✅
  - Goal: Skip empty introduction, segment, and ending text blocks during Voice Synthesis; throw localized error if script content is entirely empty.
  - Deliverables: Validation controls inside `prepareSynthesisTimeline` in `synthesis.ts`, localized UI/validation feedback error messages, and synchronized React prop types.
- **Sprint STU-109: Parallel Synthesis Fault Tolerance [COMPLETED]** ✅
  - Goal: Implement graceful voice synthesis recovery utilizing Promise.allSettled to concatenate audio chunks for successful segments while logging and listing failed ones in an warning panel.
  - Deliverables: Promise.allSettled accumulation flow, synthesisWarning state, fallback quota-limit suggestion triggers, and styled warning box component on the active preview pane.
- **Sprint STU-104: Background Music Preview Integration [COMPLETED]** ✅
  - Goal: Enable on-demand background music track evaluation within the creation wizard.
  - Deliverables: Interactive music preview controls paired with the new `/api/music-preview/:type` backend route, complete with responsive "Coming soon" tooltips for missing local audio assets.
- **Sprint STU-103: Voice Studio Preview Integration [COMPLETED]** ✅
  - Goal: Deliver on-demand audio previews for synthetic voices in the creation wizard.
  - Deliverables: Interactive play/pause preview icons next to voices, REST/Audio synchronization using browser Web Audio and `/api/test-tts`.
- **Sprint NEWS-102: News Intelligence Core - Phase 2 [COMPLETED]** ✅
  - Goal: Implement content intelligence, freshness monitoring, and advanced deduplication.
  - Deliverables: 24-hour RSS freshness filtering, 0.85 Jaccard title deduplication, Stage 1 manual content freshness warnings, and refined data cleaning logic.
- **Sprint NEWS-101: News Intelligence Core - Phase 1 [COMPLETED]** ✅
  - Goal: Integrate RSS and URL scraping endpoints into the Stage 1 briefing pipeline.
  - Deliverables: Connected RSS and URL scraper endpoints in `MissionTabView.tsx`, implemented configuration modals.
- **Sprint Platform-006B: AI Studio Upgrade (Sprint 2) [COMPLETED]** ✅
  - Goal: Elevate AI drafting intelligence, support co-host dialogue segmenting, and implement brand voice memory and custom guidelines.
  - Deliverables: Integrated Custom Guidelines preset prompt library in MissionTabView, implemented multi-speaker dialogue segmenting and custom chat-bubble rendering, and centralized co-host synthesis in synthesis.ts.
- **Sprint Platform-005.5: Enterprise UX Audit & Architecture Planning [COMPLETED]** ✅
  - Goal: Implement Adaptive UX, resolve Desktop-first mobile scaling, enforce strict Component/Screen/Task auditing, and refactor layout architecture.
  - Deliverables: UX_AUDIT_REPORT.md, RESPONSIVE_ARCHITECTURE_GUIDE.md, COMPONENT_INVENTORY.md, SCREEN_INVENTORY.md, DEVICE_COMPATIBILITY_MATRIX.md, TASK_FLOW_AUDIT.md, DESIGN_TOKEN_AUDIT.md, TECHNICAL_DEBT.md, COMPONENT_MIGRATION_PLAN.md, UX_SCORECARD.md.
- **Sprint Platform-005.6: Adaptive Foundation Refactor [COMPLETED]** ✅
  - Goal: Establish Adaptive Layout Engine (v2), decouple screen logic, standardize layout templates, and enforce presentation-only component properties.
  - Deliverables: src/layouts/AdaptiveLayout.tsx, AdaptiveContainer.tsx, AdaptiveNavigation.tsx, AdaptiveGrid.tsx, AdaptiveCard.tsx, AdaptiveWorkspace.tsx, AdaptiveProvider, AdaptiveContext, spacing, elevation, motion, and typography tokens.
- **Sprint Platform-005.6C: Reference Experience & Playground [COMPLETED]** ✅
  - Goal: Establish an internal development playground and verified reference experience.
  - Deliverables: src/components/AdaptivePlayground.tsx, COMPONENT_CONTRACTS.md, REGRESSION_TEST_PLAN.md, dynamic device simulators, semantic color tokens, and advanced pointer detection models.
- **Sprint Platform-005.6D: Settings View Adaptive Pilot [COMPLETED]** ✅
  - Goal: Apply adaptive layout controls and design token abstractions on the first production workspace screen (`SettingsView.tsx`).
  - Deliverables: Refactored outer container utilizing `<PageTemplate>` with sticky headers and responsive spacing, automated grid container configurations using `<AdaptiveGrid>`, and integrated design system references to `colors.surface` for visual consistency.
- **Sprint Platform-005.6E: Contrast Optimization & Language Synchronization [COMPLETED]** ✅
  - Goal: Fix contrast compliance with WCAG standards and ensure strict language-state synchronization.
  - Deliverables: High contrast visual styling tokens, bidirectional Settings language sync.
- **Sprint Platform-005.6F: HomeView Adaptive Refactor [COMPLETED]** ✅
  - Goal: Apply adaptive page templates, column layouts, and semantic design tokens to `HomeView.tsx` to align with the design system.
  - Deliverables: Full `PageTemplate` structural wrapper, `AdaptiveGrid` responsive layouts, and 100% theme-aware, contrast-safe semantic color references.
- **Sprint Platform-005.6G: AssetsWorkspace Adaptive Refactor [COMPLETED]** ✅
  - Goal: Apply adaptive page templates, three-panel layouts, and semantic design tokens to `AssetsWorkspace.tsx` to align with the design system.
  - Deliverables: Full `PageTemplate` structural wrapper, `AdaptiveWorkspace` layout system, and 100% theme-aware, contrast-safe semantic color references.
- **Sprint Platform-005.6H: MissionStudio Adaptive Refactor [COMPLETED]** ✅
  - Goal: Apply adaptive page templates, responsive column layouts, and semantic design tokens to the sequential `MissionStudio.tsx` creation wizard.
  - Deliverables: Full `<PageTemplate>` wrapper with sticky navigation progress header and action footer, `<AdaptiveGrid>` and `<AdaptiveCard>` structure, and 100% theme-aware, contrast-safe semantic color references.
- **Evidence Review [COMPLETED]** ✅
- **Platform Baseline 5.0 [COMPLETED]** ✅
- **Sprint Platform-001: Operational Excellence [COMPLETED]** ✅
  - Goal: Mission Telemetry, Workspace Health, Diagnostics, Replay, Offline Simulation, Crash Report.
- **Sprint Platform-001.1: Telemetry Hardening & Replay Engineering [COMPLETED]** ✅
  - Goal: Correlation ID, Event Versioning, Replay Event Filter, Diagnostics Export, and Platform Status disclosure.
- **Sprint Platform-002A – Mission Academy Foundation [COMPLETED]** ✅
  - Goal: Onboarding flows, interactive workspace guidance, initial configurations, and the launch of **Mission Academy Level 1: Mission Confidence** (including Situational Scenarios, Sandbox Practice concepts, Operator Learning principles, and predictive indicators).
  - KPI: First Mission Initiation ≤ 5 minutes, First Successful Mission ≤ 8 minutes.
- **Sprint Platform-002B – Feedback & Support [PLANNED]** 📅
  - Goal: In-app feedback submission, direct attachment of encrypted/plain Diagnostics JSON state, customer support ticket tracking, and feedback integration with the Mission Academy simulator.
- **Sprint Platform-002C – Privacy & Consent [PLANNED]** 📅
  - Goal: GDPR/CCPA telemetry data opt-in/out toggles, plain privacy disclosure statements, local storage diagnostics prune.
- **Sprint Platform-002D – Mission Analytics [PLANNED]** 📅
  - Goal: Real-time operator charts, prediction of Mission Success, Resume Accuracy, active calculation of the proactive Mission Confidence KPI, and Academy Level 2 (Scenario Learning & Sandbox Practice Mode).
- **Sprint Platform-002E – Operator Insights [PLANNED]** 📅
  - Goal: Telemetry explanation engines, predictive risk indicators, contextual suggestions for improving the Mission Confidence Index (MCI) via the "Confidence Coach", and Academy Level 3 & 4 (Advanced Automation & Expert Mode Certification).
- **Sprint Platform-003 – Product Simplification [IN PROGRESS]** 🏗️
  - Goal: Drastically reduce UI complexity, eliminate visual cognitive overload, and establish intuitive, human-first operator workflows.
  - Deliverables:
    - **Home Declutter**: Remove 40% of widgets; keep only 3 crucial sections (Active Task, Next Schedule, Diagnostics/Alert Status).
    - **Unified Creation Canvas**: Replace the multi-tab design with a singular, fluid editor canvas (Notion/Figma style).
    - **True Object Library**: Restructure the Library following the clear object model: Workspace -> Project -> Mission -> Assets -> Versions -> Export.
    - **Intent-First Settings**: Convert engineering knobs (temperature, pitch, rates) into clean human-centric intentions ("Female voice", "Read quickly", "Short briefing", "Less AI").
    - **Strict 4-Workstation Sidebar**: Enforce exactly 4 primary workstations in navigation.
    - **Client-Facing Language Cleanup**: Remove all developer-oriented jargon (such as Build/Lint PASS, contract structures) from consumer-facing screens.
    - **Zero Feature Scattering**: Guarantee each functional element exists in exactly one logical UI location.
  - KPI: Operator Simplicity Score ≥9.5/10, visual layout density decreased by 40%.
- **Sprint Platform-003.5: Release Operations [PLANNED]** 📅
  - Goal: Feature Flags, Version Channel, Update Center, Release Notes.
- **Closed Beta [PLANNED]** 📅
- **5.0 Release [PLANNED]** 📅
  - Goal: Consolidate all global settings and hidden expert modes.
- **Sprint UX-030: Visual Hierarchy & Command Palette [PLANNED]** 📅
  - Goal: Universal Search (Ctrl+K) and visual polish (Rule of 3).


### Core Architecture Foundation (Phase A — Platform Engineering)
- **Sprint #001: Domain Model Definition** — **COMPLETED** ✅ (Passes isolation tests, zero external package leakage)
- **Sprint #002: Briefing Repository Foundation** — **COMPLETED** ✅ (Strict abstract repository boundary, memory adapter)
- **Sprint #003: Persistence Layer Setup** — **COMPLETED** ✅ (Established PostgreSQL/Drizzle boundary and Mapper pattern)
- **Sprint #003.5: Hardening & Value Objects** — **COMPLETED** ✅ (Enforced Value Objects, Domain Events, and Result pattern)
- **Sprint #004: News Intelligence Core** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #004.5: Production Hardening** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #005: RSS Gateway & Feed Intelligence** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #006: LLM Intelligence Platform** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #006.5: AI Runtime Verification** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #007: AI Memory Platform** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #008: Runtime Orchestration Platform** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #008.5: Runtime Certification** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #014C: Runtime Diagnostic Inspector** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #014D: Performance Benchmark & Simulation** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #014E: Runtime Certification & Execution Freeze** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)

### Editorial AI Era (Phase B — Editorial Intelligence)
- **Sprint #009: User Intelligence Platform** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #010: Candidate Intelligence Platform** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #011: Story Intelligence Platform** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #012: Recommendation Engine** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #013: Narrative Composer Platform** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #013.5: Execution Contract (Performance Manifest v3)** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #014A: Performance Resolution Engine** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #014B: Runtime Experience Execution** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #015: Editorial Planner & Editorial Brain** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #016: Persona Platform** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #017: Broadcast Director Foundation** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #018: AI DJ Experience Platform** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #019: Taste Intelligence Platform** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #020: Conversational Host** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)
- **Sprint #021: Product Evaluation Layer** — **ARCHIVED** 🧹 (Moved to `_archive_unused_architecture`, using simple React-driven generation flow)

---

## 🚀 CommuteCast Epics & 5-Year Vision (Phase C — Product Intelligence & Self-Improvement)

To reflect our transition from a feature-driven project to a strategic, scale-ready **Knowledge-Driven Companion Intelligence Platform**, we move away from isolated technical sprints and adopt the **Enterprise Epic Framework**.

### 📦 EPIC A — Evidence Platform (Chứng minh giá trị)
- **WP-1: Snapshot Intelligence Contract (Sprint #023)** — **IN PROGRESS** 🏗️
  - *Goal*: Establish the Snapshot Intelligence Contract (Release Unit).
  - *Deliverables*: (1) Snapshot Manifest, (2) Lineage Graph, (3) Product Hypothesis Contract, (4) Evidence Placeholder, (5) Explainability Metadata, (6) Lifecycle State Machine.
- **WP-2: Explainability Reports (Sprint #023)** — **PLANNED** 📅
  - *Goal*: Tạo báo cáo giải thích cho mỗi phiên nghe, giúp đội ngũ hiểu rõ "tại sao" hệ thống đưa ra các quyết định editorial.
- **WP-3: Product Impact Dashboard & Regression Guardrails (Sprint #024)** — **PLANNED** 📅
  - *Goal*: Dashboard tập trung vào Product KPI và các ngưỡng an toàn tự động (Automated Regression Detection).

### 📦 EPIC X — Experience Platform (UX Operating System) (Tối ưu hóa trải nghiệm)
- **WP-1: Task-Centric Information Architecture (Sprint #023.5)** — **COMPLETED** ✅
  - *Goal*: Reorganize workspace tabs around user workflows (`home`, `create`, `library`, `aihost`, `analytics`, `settings`).
  - *Deliverables*: Unified sidebar/drawer navigation, speed-dial navigation bar with 44px touch targets.
- **WP-2: Workspace, Launcher & Activity Timeline** — **COMPLETED** ✅
  - *Goal*: Create a high-immersion homepage display showing current drafts, favorites, recents, active engine snapshot status, and an interactive **Universal Activity Timeline** (Layer 6).
- **WP-3: Unified Audio Library & Smart Queue Panel** — **COMPLETED** ✅
  - *Goal*: Establish a durable Media Center grouping historical broadcasts, play queue, and podcast publisher with interactive playback.
- **WP-4: Broadcast Persona & Snapshot Terminal** — **COMPLETED** ✅
  - *Goal*: Create the AI Host persona controls coupled with a complete, live Snapshot Manifest & Governance inspector (WP-1 contract visualization).
- **WP-5: Product Scorecard & Experimentation Lineage Dashboard** — **COMPLETED** ✅
  - *Goal*: Create a beautiful Analytics deck visualizing listen hours, telemetry metrics, and the real-world product impact of candidate snapshots.
- **WP-6: Workflow, Workspace & Search Enhancements (Sprint #024)** — **COMPLETED** ✅
  - *Goal*: Enhance user experience with a progressive **Workflow Chevron Rail** (Layer 2), auto-updating **Workspace Continuation state**, context-aware **Companion Assistant greetings** (Layer 4), and a **Ctrl+K Universal Search Palette** (Layer 5) for instant navigation and action execution.

### 📦 EPIC B — Knowledge Platform (Tiến hóa an toàn)
- **WP-1: Offline Learning Platform** — **COMPLETED** ✅
- **WP-2: Knowledge Registry & Snapshot Publisher** — **COMPLETED** ✅
- **WP-3: Knowledge Governance Platform** — **COMPLETED** ✅

### 🧠 EPIC B — Personal Intelligence (Relational & Ambient Context)
- **WP-1: Personal Knowledge Graph (Sprint #025)** — **PLANNED** 📅
  - *Goal*: Transition from basic key-value behavioral stores to structured graph databases tracking complex relational user preferences (e.g., `Morning -> Tech -> Heavy Traffic -> Complete Session`).
- **WP-2: Ambient Context Engine** — **PLANNED** 📅
  - *Goal*: Adapt session pacing and topics based on external environmental dimensions (e.g., Rain, Commute Duration, Stressed Mood).
- **WP-3: Long-term Companion Memory** — **PLANNED** 📅
  - *Goal*: Deepen conversational continuity across multiple days and weeks, forming durable user-host trust.

### 🏛️ EPIC C — Editorial Intelligence (Reasoning & Curatorial Autonomy)
- **WP-1: Editorial Reasoning Engine (Sprint #026)** — **PLANNED** 📅
  - *Goal*: Give the Editorial Brain the cognitive ability to reason *why* it should present or omit stories based on contextual relevance and history (e.g., replacement logic, novelty rules, narrative impact).
- **WP-2: Dynamic Narrative Arc** — **PLANNED** 📅
  - *Goal*: Fluidly manipulate the broadcast curve based on real-time listener feedback loops and emotional continuity.

### 🎙️ EPIC D — Companion AI (Daily Intelligence OS)
- **WP-1: Multimodal AI Radio** — **PLANNED** 📅
  - *Goal*: Transform CommuteCast into a unified personal radio show integrating Maps, Weather, Calendar Events, Stocks, and Emails into one daily briefing.
- **WP-2: Companion Intelligence Platform / Daily Intelligence OS** — **PLANNED** 📅
  - *Goal*: Reach parity with class-leading consumer AI platforms (Google Assistant, Apple Intelligence) with agentic task performance and high-immersion conversational dialogues.

### 📦 EPIC E — Infotainment & Mobile Strategy (Android Auto / CarPlay)
- **WP-1: Car Integration Feasibility Analysis [COMPLETED]** ✅
  - *Goal*: Analyze technical gaps between Web/PWA and native Car SDKs.
  - *Deliverables*: `docs/architecture/CAR_INTEGRATION_FEASIBILITY.md`, multi-phase mobile roadmap.
- **WP-2: PWA Optimization & Media Session API [COMPLETED]** ✅
  - *Goal*: Leverage browser-level media controls for steering wheel and Bluetooth support.
  - *Deliverables*: Full `navigator.mediaSession` integration in `ManualPcmPlayer.tsx`.
- **WP-3: Mobile Wrapper Pilot (Capacitor) [PLANNED]** 📅
  - *Goal*: Evaluate a thin native wrapper to support background audio persistence and basic app store delivery.
- **WP-4: Deep Infotainment Integration (AA/CP) [BACKLOG]** 📅
  - *Goal*: Implement native `MediaBrowserService` (Android) and `CarPlay` templates (iOS).

---

## 🎯 Strategic Organizational Metrics
We continuously measure our performance across the following research-driven KPIs:
1. **Decision Quality**: % of product adjustments directly backed by high-confidence evidence from our Observation Layer.
2. **Learning Velocity**: The average calendar days to go from Research Question (ERC) to a validated product parameter update.
3. **Decision Accuracy**: % of shipped snapshots that successfully achieve their estimated Product KPI targets.

## ⚖️ Evidence Budget Rule
- **Framework Growth ≤ Evidence Growth**: We promise to freeze meta-work and avoid growing structural complexity faster than our capacity to collect actionable, user-centric evidence.
