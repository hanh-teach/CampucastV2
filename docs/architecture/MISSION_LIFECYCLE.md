# Mission Lifecycle Specification

This document defines the formal state transitions and ownership rules for the CommuteCast Mission Platform.

## 1. State Definitions

| State | Description | Recovery Rule |
| :--- | :--- | :--- |
| **Created** | Mission initialized with configuration. | Non-recoverable (Restart allowed). |
| **Ready** | Pre-flight checks passed, awaiting trigger. | Recoverable from config. |
| **Running** | Active production loop. | Full restoration from Snapshot + Events. |
| **Waiting** | Awaiting external data or background job (non-stalled). | Resume on data availability. |
| **Blocked** | Stalled progress, requires operator intervention or manual retry. | Requires Operator intervention. |
| **Paused** | Voluntarily suspended. | Resume from last point. |
| **Completed** | Success. Artifacts published. | Read-only. |
| **Failed** | Terminal failure. | Requires `MISSION_RETRY`. |
| **Archived** | Cleaned up and moved to cold storage. | Permanent freeze. |

## 2. Transition Matrix (State Machine)

| From \ To | Created | Ready | Running | Waiting | Blocked | Paused | Completed | Failed | Archived |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Created** | - | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| **Ready** | ✗ | - | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| **Running** | ✗ | ✗ | - | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| **Waiting** | ✗ | ✗ | ✓ | - | ✓ | ✓ | ✗ | ✓ | ✗ |
| **Blocked** | ✗ | ✗ | ✓ | ✗ | - | ✗ | ✗ | ✓ | ✓ |
| **Paused** | ✗ | ✗ | ✓ | ✗ | ✗ | - | ✗ | ✗ | ✓ |
| **Completed**| ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | - | ✗ | ✓ |
| **Failed** | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | - | ✓ |
| **Archived** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | - |

## 3. Transition Rules
- **Running -> Waiting**: Automatic transition when an async dependency (RSS feed) is pending.
- **Running -> Blocked**: Triggered by a "Soft Error" or timeout that doesn't crash the engine but prevents progress.
- **Blocked -> Running**: Triggered by manual retry or automated resolution policy.
- **Any -> Archived**: Can be triggered by the Operator at any time or by the `MissionPolicyEngine` for "Dead" missions.

## 3. Ownership & Permissions

| Role | States Managed | Permission Level |
| :--- | :--- | :--- |
| **Operator** | `Created`, `Paused`, `Archived` | Full Admin |
| **AI Agent** | `Running`, `Waiting`, `Completed` | Orchestrator |
| **Engines** | `Running`, `Failed` | Worker |
| **SessionEngine**| ALL (Gatekeeper) | Final Arbiter |

## 4. Rollback & Retry Policy
- **Rollback**: Missions can revert to the last `Snapshot` if `ExecutionHealth` hits `Critical`.
- **Retry**: Only `Failed` missions can be retried, which resets progress to the start of the current `MissionStage`.

## 5. Termination Rules
- A Mission is considered "Dead" if it remains in `Blocked` for > 48 hours without Operator interaction.
- "Dead" missions are automatically moved to `Archived` with a `System` classification event.
