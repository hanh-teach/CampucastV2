# Information Architecture Blueprint - CommuteCast v3.2

This blueprint serves as the central design document for Sprint UX-101. It replaces scattered architectural notes with a unified Information Architecture, Navigation, and Workflow model. No implementation code is to be derived until this blueprint is approved.

---

## 1. Global Application Map

```text
Home (Mission Control)
├── Resume Mission
├── Recent Missions (Status: Ready/Running/Paused)
└── Quick Actions (Start New, View Stats)

Studio (Production Desk)
├── Input Capability (RSS, Search, File, Clipboard)
├── Authoring Capability (Script Editor)
├── AI Capability (Suggestions, Rewrite, Translate)
├── Voice Capability (Host Selector, Tone, Speed)
└── Preview Capability (Manual PCM Player)

Assets (Asset Browser)
├── Audio (Generated Clips)
├── Podcast (Full Episodes)
├── Video (Future-proofing)
├── Script (Saved Drafts)
└── Images (Covers)

History (Telemetry & Recovery)
├── Timeline (Event Log)
├── Recovery (Autosave Snapshots)
└── Analytics (Mission Performance)

Settings (Governance)
├── AI (Model Config)
├── Voice (Library)
├── Storage (Quota)
├── Integrations (RSS/Cloud)
└── Developer (Logs/Diagnostic)
```

---

## 2. Navigation Blueprint
- **Primary Nav**: 5 persistent tabs (Home, Studio, Assets, History, Settings).
- **Secondary Nav**: Workflow-specific (e.g., inside Studio: Source -> Script -> Voice -> Preview).
- **Context Nav**: Contextual actions based on selected Mission (e.g., Resume, Archive).
- **Breadcrumb Rule**: Breadcrumbs only show path within the current workstation.
- **Back Rule**: Back navigation *always* returns to the previous step within the current workstation workflow.

---

## 3. Workflow Maps (Intent-based)

### First-time Operator
`Home` -> `Start New Mission` -> `Studio` -> `Source Config` -> `Draft` -> `Generate` -> `Review` -> `Publish`.

### Returning Operator
`Home` -> `Resume Mission` -> `Studio` (Restored State) -> `Continue`.

### Producer (Mission Review)
`History` -> `Timeline` -> `View Mission Snapshot` -> `Audit`.

---

## 4. Information Architecture Reorganization
- **Mission-First**: All operations happen *within* the scope of a Mission.
- **Workflow Silos**: Features follow the workflow stages, not the technical module (e.g., Voice settings are in Settings; Voice selection is in Studio).
- **Single Source of Truth**: Assets, History, and Settings are centralized.

---

## 5. Screen Inventory
- **Merge**: `RSS Manager` + `Topic Suggestions` -> `Studio/Input Stage`.
- **Merge**: `Podcast Manager` + `Storage Stats` + `Asset Browser` -> `Assets`.
- **Remove**: Individual `RSS Tab`, `AI Host Tab`, `Analytics Tab` (unified into Studio/Assets/History).

---

## 6. UX Consistency Report
- **Navigation**: Workflow-first.
- **Design Tokens**: Standardized (Colors: brand-accent, surface-bg, border-subtle; Radius: app-2xl).
- **Components**: Standardized Card (Header/Body/Footer/Action).
- **Accessibility**: All interactive elements target 44px min.
- **Progressive Disclosure**: UI complexity increases based on `Operator Capability Tier` (New -> Operator -> Dev).
