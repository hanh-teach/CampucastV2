# Mission Model Architecture

## 1. What is a Mission?
A **Mission** is NOT a Project. It is a **deterministic unit of work** that can be resumed, tracked, explained, and completed. While a Project is a static container for configuration, a Mission is a live execution instance. It represents the "active state of production."

## 2. Mission vs. Project
- **Project**: The definition of "What" (e.g., "Morning Briefing Template", "RSS Source List").
- **Mission**: The execution of "How" (e.g., "The production run for July 5th, 8:00 AM").
  - *Hierarchical Relationship*: One Project spawns multiple Missions over time.
  - *Example*:
    - **Project**: `Morning_Edition`
    - **Mission 1**: `ME_2026_07_05_Fetch` (Ready)
    - **Mission 2**: `ME_2026_07_05_Synthesis` (Running)

## 3. Mission Lifecycle
Missions follow a strictly sequential path to ensure data integrity:
1.  **Created**: Initial state, configuration loaded.
2.  **Ready**: Pre-flight checks passed, awaiting operator trigger.
3.  **Running**: Active processing (Engines engaged).
4.  **Paused**: Voluntarily or involuntarily suspended (Resume point captured).
5.  **Completed**: Artifacts produced and validated.
6.  **Failed**: Terminal error encountered (Requires retry or manual intervention).
7.  **Archived**: Permanent record, state frozen.

## 4. Mission State Machine
Transitions are governed by the `SessionEngine`:
- **Running -> Failed**: Triggered by Engine exceptions or timeout.
- **Failed -> Running**: Triggered by `MISSION_RETRY` event.
- **Running -> Paused**: Triggered by user navigation or system interrupt.
- **Paused -> Running**: Triggered by `MISSION_RESUME` event (Restore from Snapshot).

## 5. Mission Ownership
- **Writers (Authorized Agents)**:
  - **Operator**: Sets intent and manual overrides.
  - **AI Host**: Generates scripts and transitions stages.
  - **Engines (RSS/Audio/Video)**: Update progress and append artifacts.
- **Observers (Read-Only)**:
  - **UI Components**: Render state but MUST NOT modify it directly.
  - **Telemetry**: Logs events for analytics.

## 6. Mission Event Contract
The `SessionEventBus` communicates the following immutable events:
- `MISSION_CREATED`: Initial allocation.
- `MISSION_STARTED`: Engines engaged.
- `MISSION_UPDATED`: Progress or minor field change.
- `MISSION_STAGE_CHANGE`: Transition between production steps.
- `MISSION_COMPLETED`: Production success.
- `MISSION_FAILED`: Error recorded.

## 7. Mission History (Meaningful Events Only)
The history is an immutable log of **pivotal moments**.
- **Included**: `Stage Change`, `Audio Segment Ready`, `RSS Sync Start`, `Operator Resume`.
- **Excluded**: `UI Hover`, `Typing`, `Scroll Position`.

## 8. Mission Execution Health
Calculated exclusively by the `SessionEngine` based on operational integrity:
- **Healthy**: Progressing normally, data synced.
- **Waiting**: Awaiting external data or background job (non-stalled).
- **Blocked**: Stalled progress, requires operator intervention or manual retry.
- **Warning**: Potential bottleneck or engine latency detected.
- **Critical**: Terminal engine failure or data corruption.

## 9. Mission Capability Mapping
Missions explicitly declare their required and provided capabilities:
- `requires`: `[rss, summary, youtube_entertainment]`
- `provides`: `[audio_stream, transcript, video_player]`
This allows the UI (Home/Workstations) to use **Recognition over Recall** to guide the operator.

## 10. Repository-Centric Architecture
The **Mission Repository** is the absolute Source of Truth.
- `SessionEngine`: Orchestrates events and manages the active execution loop.
- `MissionRepository`: Handles persistence, indexing, and storage of Mission states and Snapshots.
- `MissionBus`: Decouples producers (Engines) from consumers (UI/Analytics).

### Mission Repository Interface (Contract)
```typescript
interface MissionRepository {
  create(mission: Mission): Promise<void>;
  update(missionId: string, update: Partial<Mission>): Promise<void>;
  findById(missionId: string): Promise<Mission | null>;
  findByProject(projectId: string): Promise<Mission[]>;
  appendEvent(missionId: string, event: MissionEvent): Promise<void>;
  saveSnapshot(missionId: string, snapshot: MissionSnapshot): Promise<void>;
  restoreLatestSnapshot(missionId: string): Promise<MissionSnapshot | null>;
  archive(missionId: string): Promise<void>;
  search(query: MissionQuery): Promise<Mission[]>;
}
```

## 11. Mission Versioning
Every Mission includes a `version` field for optimistic concurrency control and state tracking.
- **Auto-Increment**: The `version` is incremented on every `MISSION_UPDATED` or `MISSION_STAGE_CHANGE`.
- **Conflicts**: If a "Writer" attempts to update a Mission with a stale version, the Repository rejects the update.

## 12. Mission Snapshot & Replay
A Mission's value is realized in its **Artifacts**:
- `Mission` -> `produces` -> `Artifacts` (Audio Files, Transcripts, Metadata, Thumbnails).
- Artifacts are linked to the Mission ID for 100% traceability.

## 13. Mission Recovery (Crash/Restart)
- **Automatic Restore**: On application boot, `SessionEngine.resume()` is called.
- **State Pinning**: The UI automatically navigates to the "Workstation" associated with the active Mission.

## 15. Capability-Based Configuration
To prevent technology lock-in and ensure architectural agility, user preferences (Settings) are mapped to **Preferred Capabilities** rather than module-specific parameters:
- **Voice Selection**: Mapped to `PreferredVoiceCapability`.
- **News Sources**: Mapped to `PreferredSourceCapability`.
- **Media Engine**: Mapped to `PreferredMediaCapability`.
This allows the Mission Platform to resolve the best "Provider" (e.g., Gemini vs. local engine) without modifying the Mission Model or UI.

---

## Strategic Metrics
- **Mission Success Rate (MSR)**: Goal > 96%.
- **Mission Resume Accuracy (MRA)**: Goal 100%.
- **Mean Mission Completion Time (MMCT)**: Target per mission type.
- **Mission Failure Recovery Rate**: Goal > 95%.
- **Blocked Mission Resolution Time**: Goal < 2 mins (for automated flows).
