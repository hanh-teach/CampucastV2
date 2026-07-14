# Workspace Principles - CommuteCast v3.2

This document establishes the fundamental principles for all CommuteCast Workstations, ensuring consistency, operator focus, and architectural stability during the Workspace Transformation phase (UX-102).

## 1. Workstation Principles

### Home (Mission Control)
- **Mission Control Only**: Focus strictly on "What am I doing?" and "What needs attention?".
- **Resume-First**: Surfacing dangled missions is the highest priority.

### Studio (Production Desk)
- **Create, Edit, Produce, Publish**: A dedicated environment for mission production.
- **Workflow-centric**: RSS -> Script -> Voice -> Publish.

### Assets (Production Library)
- **Find, Reuse, Manage**: Central repository for all mission artifacts.
- **Preview-First**: Quick access to asset content without deep navigation.

### History (Review & Recovery)
- **Review, Recover, Audit**: Telemetry-focused view for audit trails and recovery.

### Settings (Governance)
- **Configure, Maintain**: System-level controls partitioned by Domain.

---

## 2. Shared Workspace Principles
- **One Screen = One Job**: Each workstation/screen has a singular purpose.
- **Maximum 1 Primary CTA**: Reduce decision fatigue; clear direction.
- **Maximum 2 Context Switches**: Minimize mental load for cross-workstation tasks.
- **Progressive Disclosure**: Show info based on intent and expertise (Basic -> Operator -> Dev).
- **Workflow First**: UI follows the operator's mental model, not the module boundary.
- **Mission Always Visible**: Context layer persists across all workstations.
- **Never Hide Mission State**: Operator must always know state, health, and readiness.
- **Never Lose Operator Context**: State is persistent and resilient to session interruptions.
