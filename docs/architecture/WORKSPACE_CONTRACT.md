# Workspace Contract - Mission Studio (UX-102B)

This document establishes the UI/UX contract for the `MissionStudio` workstation. All implementation in Sprint UX-102B MUST adhere to this contract.

## 1. Workspace Layout (5-Zone)
The `MissionStudio` is divided into five strictly defined zones:
1.  **MissionCommandBar (Top)**: Context Layer (Stable, persists mission status).
2.  **Workspace (Center, 65-70%)**: Main content creation area (RSS/Script Editor/Preview).
3.  **RightContextPanel (Right, 30%)**: Dynamic context (Assets, AI Suggestions, Capability settings).
4.  **BottomActivityDock (Bottom)**: Event/Status Timeline (Real-time logs, progress tracking).
5.  **FloatingCTA (Floating)**: Context-aware primary action (e.g., "Generate Script", "Publish").

## 2. Component/Capability Mapping
- **Workspace**: Changes based on selected capability. No step-based wizards.
- **Side Panels**: All settings, asset selection, and AI suggestions live in the Right Context Panel. No modals.
- **Capabilities**: RSS, Script, Voice, Publish are available via the Capability Panel.

## 3. Interaction Rules
- **No Wizard**: Absolutely no `activeStep`, `wizardStep`, `nextStep` logic.
- **One Workspace = Multiple Capabilities**: Support concurrent editing/review of script, RSS source, and voice preview.
- **Context-Aware**: UI automatically adapts content based on active mission state.

## 4. Context-Aware CTA/Status Logic
- **Floating CTA**: Automatically determined by Mission State (e.g., Ready -> Generate; Script Ready -> Voice; Voice Ready -> Publish).
- **Activity Dock**: Displays automated capability progress events.

## 5. Success Metrics (KPIs)
| KPI | Target |
| :--- | :--- |
| Time to Generate RSS | ≤ 10s |
| Time to Resume Mission | ≤ 3s |
| Clicks RSS → Publish | ≤ 5 |
| Visible Primary CTA | 1 |
| Context Switches | ≤ 2 |
| Capability Discoverability | > 95% |
| Workspace Completion Rate | > 95% |
