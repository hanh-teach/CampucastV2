# RFC-001: Experience Platform (UX Operating System) for CommuteCast

## Status: PROPOSED
**Author**: Lead Systems Architect & Product Craftsman  
**Date**: 2026-07-04  
**Target Version**: `4.17.0-RC`  
**Core Initiative**: Experience Platform (UX Operating System) — EPIC X

---

## 1. Discovery (Product Alignment)

### 1.1 Problem Statement
While CommuteCast contains a highly advanced backend pipeline (incorporating ADRs from Feed Platform, LLM Intelligence, AI Memory, to the Frozen Runtime Core), the existing user interface suffers from functional density overload. Subsystems like RSS channels, play queues, playback stats, historical logs, and preferences are crammed into technical tabs or side panels. 

This causes:
- **High Cognitive Load**: The user must jump between "Bản tin chính", "Nguồn tin RSS", and individual tabs to build, play, or configure their broadcast.
- **Low Discoverability**: Advanced features (e.g., custom AI personas, Snapshot manifest inspections, semantic story transition controls) are hidden inside submenu drawers or separate sections.
- **Task Disconnection**: The flow from "ingesting RSS articles" to "customizing host style" and "listening with playback statistics" is fragmented.

### 1.2 Proposed Value (UX OS)
We propose to freeze the creation of new platform capabilities and spend a product-focused sprint establishing the **Experience Platform (UX Operating System)**. The UX OS reorganizes the information architecture of CommuteCast around user tasks and goal-directed workflows, transforming the app into a sleek, modular workstation.

### 1.3 Key Performance Indicators (KPIs)
We expect this refactor to directly improve:
1. **Task Completion Time**: Reduction in clicks required to go from raw feed to audio briefing.
2. **Discoverability Rate**: Increased utilization of secondary options (AI Mode, Pronunciation dictionaries).
3. **Daily Return Rate & Listening Time**: Boosted by an inviting, launchpad-focused Home interface.
4. **Learning Velocity**: Empowered by a visual Snapshot & Experimentation inspector that shows how the active Snapshot improves product KPIs.

---

## 2. Audit (Codebase Analysis)

### 2.1 Component & Routing Analysis
- `src/App.tsx`: Currently manages active tab state (`activeTab`) with `dashboard | rss | queue | memory | stats | settings`. 
- `src/components/Sidebar.tsx`: Renders the desktop sidebar and mobile navigation drawer mapping to the old 6-tab system.
- Adjacent subsystems: The RSSManager, PodcastManager, ManualPcmPlayer, and AssistantChat are modular but currently tied to specific tabs.
- State Residence: Core state is already nicely maintained in `App.tsx` (e.g., `newsContent`, `preferences`, `savedBriefings`, `activeAudioChunks`). This allows us to rebuild the presentation layer without breaking current runtime flows or data models.

### 2.2 Regression Map & Safeguards
- **Playback Stream**: Playback must remain completely stable. The `ManualPcmPlayer` must not be re-instantiated or interrupted when shifting between tabs.
- **RSS Auto-Notifications**: The banner for automatic RSS alerts must remain visible and functional.
- **Data Persistence**: Settings, history, and IndexedDB caching (`useBriefcase` / local storage) must remain intact.

---

## 3. Architecture (Systems & State Design)

We will introduce a restructured 6-tab model mapping directly to user-centric goals:

```
        ┌───────────────────────────────────────────────────────────┐
        │                 EXPERIENCE PLATFORM (UX OS)                │
        └─────────────────────────────┬─────────────────────────────┘
                                      │
            ┌───────────────┬─────────┴───────┬──────────────┐
            ▼               ▼                 ▼              ▼
         🏠 Home        📰 Create         🎙 Library      🤖 AI Host
      (Launchpad)     (Studio Desk)    (Media Center)   (Persona Desk)
            │               │                 │              │
            └───────────────┼─────────────────┴──────────────┘
                            ▼
                    📊 Analytics & Settings
```

### 3.1 Workspace Tab Mapping
1. **`home`**: Launcher Desk. Displays "Welcome" banner, "Continue Working" block (quick access to current draft or active briefing player), "Recents", and "Workspace Status".
2. **`create`**: Workstation Desk. Merges draft input, automatic news category generation, and RSS Feed list/articles into a unified workspace.
3. **`library`**: Media Center. Merges historical compiled briefings, the play queue, and podcast publishing feeds with deep search & filter controls.
4. **`aihost`**: Persona Desk. Selects host personas, voices, tones, and displays the active **Knowledge Snapshot Manifest** (DRAFT, TRAINED, VALIDATED, APPROVED, etc.) from the Snapshot Intelligence Contract.
5. **`analytics`**: Observation Deck. Visualizes listening stats, storage metrics, and snapshot product impact lineage maps.
6. **`settings`**: Configuration Desk. System preferences, bilingual triggers, API keys, cache clearing, and PWA metrics.

---

## 4. UX Design (Interaction & Aesthetics)

- **Palette & Typography**: Consistently utilize deep slate charcoal backgrounds, soft off-whites, and glowing cyan/indigo border accents for high-contrast, premium readability.
- **Fluid Layouts**: The application is fully responsive. Mobile layouts feature a dedicated speed-dial bottom bar with 44px touch targets. Desktop layouts display spacious 2-column bento grids.
- **Interactive Staggers**: Use `motion` for visual staggers on item lists and smooth slide transitions when changing tabs.

---

## 5. Implementation Strategy

### Work Package Plan:
- **WP-1**: Update `src/types.ts` to support the new `TabType` values: `"home" | "create" | "library" | "aihost" | "analytics" | "settings"`.
- **WP-2**: Refactor `src/components/Sidebar.tsx` to display the new menu labels, icons, and badges.
- **WP-3**: Update `src/App.tsx` navigation and routing.
- **WP-4**: Develop layout panels for `HomeView`, `CreateView`, `LibraryView`, `AIHostView`, and `AnalyticsView` integrating existing components with zero runtime regression.
- **WP-5**: Run validation checks (`lint_applet` and `compile_applet`) to ensure seamless execution.
