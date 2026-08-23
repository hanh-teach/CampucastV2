# Mission Event Contract

This document serves as the **Architectural Constitution** for all inter-module communication in the CommuteCast Mission Platform.

## 1. Event Core Principles
- **Immutability**: Once an event is published, it cannot be changed or deleted.
- **Atomicity**: Events represent discrete, non-overlapping state transitions.
- **Source of Truth**: The `SessionEngine` is the final arbiter of truth for event processing.

## 2. Global Event Schema
```typescript
interface MissionEvent {
  id: string;             // Unique event ID
  missionId: string;      // Associated Mission
  type: string;           // Event Type (from list below)
  timestamp: number;      // Epoch ms
  source: string;         // 'operator' | 'ai' | 'rss' | 'audio' | 'video' | 'system'
  classification: string; // 'operator' | 'ai' | 'system' | 'background' | 'warning' | 'recovery'
  payload: Record<string, any>; // Event-specific data
  stage: MissionStage;    // Production stage at time of event
}
```

## 3. Mission Event Registry

| Event Type | Producer | Consumer | Persistence | Retry Policy | Idempotency | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `MISSION_CREATED` | Operator | Repository | History | None | ID-based | Initial allocation. |
| `MISSION_READY` | System | Operator | History | 3x Exp. | ID-based | Checks passed. |
| `MISSION_STARTED` | Operator | Engines | History | 3x Exp. | At-least-once | Production engaged. |
| `MISSION_PAUSED` | Operator | Engines | History | Immediate | At-least-once | Execution suspended. |
| `MISSION_RESUMED` | Operator | Engines | History | Immediate | At-least-once | Restoration. |
| `MISSION_STAGE_CHANGE` | AI/Engine | Repository | History | Critical | Strict | Stage transition. |
| `MISSION_PROGRESS` | Engines | UI | Snapshot | None | Last-wins | Incremental 0-100. |
| `MISSION_ARTIFACT_READY`| Engines | Library | History | Infinite | Strict | Artifact produced. |
| `MISSION_COMPLETED` | System | Repository | History | Critical | Strict | Production success. |
| `MISSION_FAILED` | System | Recovery | History | None | ID-based | Terminal error. |
| `MISSION_RECOVERY` | System | Operator | History | Immediate | ID-based | Successful restore. |

## 4. Mission Bus Subscription Policy
To ensure clean decoupling, components and engines MUST NOT call each other directly:
1. **Publish**: Producers emit events to the `MissionBus`.
2. **Handle**: The `SessionEngine` processes events, updates the `MissionRepository`, and manages state.
3. **Notify**: Consumers (UI/Analytics) subscribe to specific event types to update their local view.

## 5. History vs. Telemetry
- **Mission History**: Persisted in the `SessionSnapshot`. Contains only **Meaningful Production Events** (e.g., Stage changes, Error logs).
- **Telemetry**: Ephemeral or external logs. Contains **Interaction Events** (e.g., Button clicks, Scroll depth) used for analytics but NOT for state restoration.

## 6. Event Replay Policy
Restoring a session must be achievable via **Snapshot + Replay**.
- The system periodically captures a full state Snapshot.
- Subsequent events are replayed from the Snapshot point to reach the current runtime state.
- Snapshots are triggered every 50 events or on major `MISSION_STAGE_CHANGE`.
