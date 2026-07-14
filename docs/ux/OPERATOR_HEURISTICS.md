# Operator Heuristics

This document establishes the fundamental usability rules for the CommuteCast Operator Experience. Every workspace, workstation, screen, and workflow must comply with these heuristics.

---

## 🧭 The 8 Core Operator Heuristics

### 1. Unified Status Awareness (Rule of Current Activity)
- **Heuristic**: The operator must always know exactly what they are doing, what the active state is, and how to continue.
- **Implementation**: Avoid generic landing dashboards. Place an active "Continue Working" or status monitor card immediately in focus if a project is in progress or a background task is running.

### 2. Workflow-Next Clarity (Rule of Next Step)
- **Heuristic**: The operator must know the logical next step in the workflow without thinking or seeking navigation.
- **Implementation**: The primary call-to-action (CTA) should be visually distinct (using high-contrast visual weight) and guide the user through the logical sequence (Sources -> AI -> Voice -> Generate -> Publish).

### 3. Absolute Data Integrity (Rule of Absolute Security)
- **Heuristic**: The operator must trust that their work is safe and cannot be lost due to accidental reloads, network drops, or browser crashes.
- **Implementation**: Implement silent 10-second background autosaves. Never present destructive confirmation alerts; favor persistent, soft recovery states.

### 4. Zero Cognitive Recall (Rule of Recognition)
- **Heuristic**: The operator must never have to memorize draft states, parameters, or project locations.
- **Implementation**: The system must surface previous parameters, saved configurations, and incomplete drafts contextually on home load or view initialization.

### 5. Zero Hard Blocking (Rule of No Dead Ends)
- **Heuristic**: The operator must never experience a state where they are stuck without a clear recovery path.
- **Implementation**: When setup prerequisites (e.g., RSS feed selection, voice configuration) are missing, provide direct contextual navigation anchors (e.g., "[Select Voice Now]") rather than passive, dead-end error notifications.

### 6. Seamless Navigation Reversibility (Rule of Easy Return)
- **Heuristic**: The operator must feel free to explore tabs or check statistics without fear of losing their current editing session context.
- **Implementation**: Keep the editing project state fully preserved in-memory or localStorage when transitioning between screens (e.g., Create <-> Library).

### 7. Progressive Disclosure (Rule of Single Purpose)
- **Heuristic**: Every workspace screen should focus on a single core decision or task, hiding secondary configuration options until requested.
- **Implementation**: Group dense configurations inside collapsible accordion sections or contextual panel overlays (e.g., Advanced AI Settings).

### 8. Architectural & Aesthetic Calm (Rule of Visual Order)
- **Heuristic**: Colors, borders, and margins must represent functional relationships and hierarchy rather than pure visual decoration.
- **Implementation**:
  - Border is reserved exclusively for inputs, selectable states, and focus frames.
  - Colors are strictly semantic (e.g., Amber for warning, Blue for information, Indigo/Cyan for brand workspace focus).
  - Use surface elevations (shadows, distinct background grays) to create layered spatial context.
