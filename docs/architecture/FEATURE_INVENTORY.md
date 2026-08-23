# Feature Inventory Audit - CommuteCast v3.2

This inventory tracks 100% of the currently implemented features, their primary locations, and identified redundancies.

## 1. Core Modules & Distribution

| Feature | Primary Location | Secondary/Redundant Locations | Status |
| :--- | :--- | :--- | :--- |
| **RSS Reader/Ingestion** | `RSSManager` (Tab) | `CreateView` (Source), `SettingsCenter` | **Scattered** |
| **AI Content Generation** | `CreateView` (AI Assistant) | `AssistantChat` (Overlay) | **Consolidated** |
| **Voice Search (RAG)** | `VoiceSearch` (Component) | `CreateView`, `AssistantChat` | **Redundant** |
| **AI Host Configuration** | `AIHostView` (Tab) | `SettingsCenter`, `App.tsx` (Preferences) | **Scattered** |
| **Podcast Publishing** | `PodcastManager` (Tab) | `LibraryView` | **Misplaced** |
| **Media Player (PCM)** | `ManualPcmPlayer` | `CreateView` (Preview) | **Inconsistent** |
| **Analytics & Telemetry** | `AnalyticsView` (Tab) | `ReadingStatistics`, `TelemetryDashboard` | **Developer-Focused** |
| **History / Archive** | `LibraryView` (History) | `HomeView` (Recent), `SmartQueue` | **Overlapping** |
| **Driving Mode** | `DrivingMode` (Overlay) | `Sidebar` (Toggle) | **Workflow-Based** |
| **PWA Notifications** | `SettingsCenter` | `PwaStatus`, `App.tsx` | **Setting-Based** |

## 2. Identified "Information Leaks"

- **RSS Management**: Currently exists as a standalone tab, but logically belongs to the "Source" step of a Mission.
- **AI Host Identity**: Exists as a standalone tab, but should be a property of a Mission or a Global Identity setting.
- **Analytics**: Exposed as primary navigation, which clutters the workspace for non-expert users.
- **Library Queue**: The "Queue" is a transient state of the player/mission, not a permanent library asset.
- **Settings Redundancy**: The `SettingsCenter` component is rendered in both the "Settings" tab and a secondary right-hand panel, leading to UI confusion.

## 3. Deprecation Candidates (Era 1.0 Legacy)
- `SampleBriefings`: Static presets that should be moved to the "Source" stage as templates.
- `TelemetryDashboard`: Move to "Advanced Settings" (Expert Mode only).
- `TrendingBriefings`: Redundant if a global Search exists.
