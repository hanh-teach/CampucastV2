# Interaction Guidelines - CommuteCast v3.2

Standardizing behavior and feedback loops.

## 1. Progressive Disclosure (Capability Tiering)
- **Basic (First-time)**: Only shows mission-critical elements (Home, Create, Library).
- **Operator (Active User)**: Adds full capability set (AI, Voice, Assets).
- **Developer (Admin)**: Adds Diagnostics, Logs, Telemetry.

## 2. Feedback & Motion
- **Transitions**: 200ms ease-in-out.
- **Loading**: Skeletal loaders followed by progress bars for Mission stages.
- **Empty States**: Every module MUST provide an actionable empty state (e.g., "No Assets -> Generate Asset").
- **Error States**: Clear, actionable error messages with "Recovery" actions (Retry, Restore).
