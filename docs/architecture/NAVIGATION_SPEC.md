# Navigation Specification - CommuteCast v3.2

This document defines the hierarchical navigation structure of CommuteCast.

## 1. Navigation Hierarchy

- **Global Navigation (L1)**: Persistent 5-tab bar (Home, Studio, Assets, History, Settings).
- **Workspace Navigation (L2)**: Contextual sidebars specific to the active workstation (e.g., Studio Capabilities).
- **Context Navigation (L3)**: Mission-specific control via the Mission Command Bar.
- **Action Navigation (L4)**: Primary CTAs within the active workspace.

## 2. Navigation Components
- **Global Tab**: Access to Workstations.
- **Sidebar**: Workflow capabilities within the current Workstation.
- **Mission Command Bar**: Mission-level context and high-level state.
- **Breadcrumbs**: Localized to the current Workstation workflow.

## 3. Navigation Rules
- **Back Navigation**: Must always return to the previous workflow step within the current Workstation.
- **Deep Linking**: All major Mission states (Edit, Preview, Publish) must be deep-linkable.
