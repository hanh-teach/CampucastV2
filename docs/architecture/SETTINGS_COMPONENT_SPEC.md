# Settings Component Specification

This document defines the structural components for the **Operator Settings Console**.

## 1. Structural Components

### `SettingsRail`
- **Location**: Vertical Left.
- **Content**: Large icons with short text labels (My Experience, Voice, etc.).
- **Behavior**: Persistent navigation.

### `SettingsSection`
- **Structure**: Title -> Subtitle -> Content Block.
- **Spacing**: Generous negative space between sections.

### `SettingsField`
- **Structure**: Label (Bold) -> Description (Muted) -> Control (Right-aligned).
- **Controls**: Toggles, Sliders, Dropdowns (Goal-oriented).

## 2. Visual Hierarchy
1. **Primary Actions**: (e.g., Voice Select) Uses brand-accent borders.
2. **Secondary Actions**: (e.g., Font Size) Standard monochromatic layout.
3. **Danger Zone**: (e.g., Delete Data) Red text/border with confirmation gate.

## 3. Interactive Elements
- **Live Preview**: A mini-player or mini-UI mock that updates in real-time as settings change.
- **Search Bar**: Centered at the top of the Settings Console.
