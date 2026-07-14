# Mission Policy Engine Specification

The Mission Policy Engine defines the "Guardrails of Execution." It ensures that Missions adhere to business rules and safety standards.

## 1. Core Policies

### P-001: Blocked Mission Resolution
- **Rule**: If a Mission is in `Blocked` state for > 5 minutes.
- **Action**: Escalate `ExecutionHealth` to `Warning`. Send a system notification to the Operator.
- **Rule**: If a Mission is in `Blocked` state for > 48 hours.
- **Action**: Automatically transition to `Archived` with classification `system`.

### P-002: Capability Integrity
- **Rule**: Mission cannot transition to `Ready` if `requiredCapabilities` are missing from the environment.
- **Error**: `CAPABILITY_MISSING_EXCEPTION`.

### P-003: Sequential Stage Enforcement
- **Rule**: Missions MUST NOT skip stages (e.g., `fetching` -> `publishing` without `generating-audio`).
- **Exception**: Manual override by `Operator` with `P0` priority.

### P-004: Progress Monotonicity
- **Rule**: `progress` field must only increase or stay the same, unless a `Rollback` event occurs.

## 2. Policy Enforcement
Policies are enforced by the `SessionEngine` before any `MissionEvent` is applied to the state.
- **Pre-check**: Validate the event against active policies.
- **Fail-fast**: If a policy is violated, reject the event and emit a `MISSION_POLICY_VIOLATION` event.

## 3. Automation Layer
Policies can trigger automated "Recovery Actions":
- **Auto-Retry**: If `Failed` due to `NetworkTimeout`, retry 3 times before staying in `Failed`.
- **Auto-Snapshot**: Capture a snapshot before any `High-Risk` transition (e.g., `Publishing`).
