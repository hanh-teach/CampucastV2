# Platform Capability Model - CommuteCast v3.2

This model defines the system's functional primitives (Capabilities) and their lifecycle, ensuring the CommuteCast Platform remains extensible without modifying the 4-Workstation navigation.

## 1. Capability Tree
The platform is organized by the functional needs of a broadcast mission.

- **Mission Capability (Orchestration)**
- **Input Capability** (RSS, Search, Clipboard, File)
- **Authoring Capability** (Script, Rewrite, Translate)
- **AI Capability** (Rewrite, Suggestion, Translation)
- **Voice Capability** (Host, Tone, Clone, Speed)
- **Preview Capability** (Live PCM Preview)
- **Publish Capability** (Podcast, RSS Feed, Shared Link)
- **Archive Capability** (Storage, Retrieval)
- **Governance Capability** (Theme, Voice Profile, Privacy)
- **Monitoring Capability** (Telemetry, Status, Logs)

## 2. Capability Ownership Matrix

| Capability | Workstation | Primary Screen/Engine |
| :--- | :--- | :--- |
| **Input** | Settings / Create | Source Registry / Mission Source Step |
| **Authoring** | Create | Editor |
| **AI** | Create | AI Engine |
| **Voice** | Settings / Create | Voice Profile / Host Selector |
| **Preview** | Create | Manual PCM Player |
| **Publish** | Library | Media Exporter |
| **Archive** | Library | Asset Browser |
| **Governance**| Settings | System Governance |
| **Monitoring**| Home | Console Dashboard |

## 3. Capability Lifecycle
All capabilities follow this lifecycle:
1. **Configure** (via Settings/Source Registry)
2. **Execute** (via Create/Mission Production)
3. **Monitor** (via Home/Activity Trail)
4. **Recover** (via Home/Mission Snapshot)
5. **Complete** (via Library/Archive)

## 4. Capability Dependency (Workflow Flow)
`Intent` → `Capability` → `Workflow` → `Mission Instance` → `Asset` → `Export`

Example: "Make Morning News" (Intent) → `Authoring/Voice` (Capability) → `Mission Production` (Workflow) → `Daily Finance - July 5` (Mission) → `script.txt` (Asset) → `daily_finance.mp3` (Export).

## 5. Extensibility Proof: Supporting Future Needs

| Future Capability | Workstation Add? | Implementation Plan |
| :--- | :--- | :--- |
| **Video** | No | `Create` (Add Video Asset), `Library` (Add Video Archive). |
| **Avatar** | No | `Settings` (Global Config), `Create` (Authoring step). |
| **Automation** | No | `Settings` (Schedule), `Home` (Monitor running tasks). |

## 6. Capability Rules
- **Single Source of Truth**: A capability (e.g., RSS Management) cannot reside in both `Create` and `Settings` for the same purpose. `Settings` owns the *Source Registry* (Global), `Create` owns the *Source Selection* (Contextual).
- **Workstation Isolation**: No capability UI may render outside its owner workstation.
- **Intent-First**: Capabilities are surfaced only when the Intent workflow demands it.
