# Component Contracts - CommuteCast Adaptive Design System

This document outlines the formal component contracts for the CommuteCast Adaptive Core Framework. All layout modifications must respect these specifications.

---

## 1. AdaptiveLayout
- **Purpose**: Controls the outer boundaries of content layout based on layout density and device size.
- **Owner**: Core UI Platform Team
- **Inputs (Props)**:
  - `children: React.ReactNode`
  - `className?: string`
  - `variant: LayoutVariant`
- **Responsive Rules**:
  - `LayoutVariant.Compact`: Sets padding `px-4` (Mobile)
  - `LayoutVariant.Regular`: Sets padding `px-8` (Tablet)
  - `LayoutVariant.Expanded`: Sets padding `px-16` (Desktop)
- **Accessibility (A11y)**:
  - Uses native semantic containers.
  - Transparent layout spacing respects reducedMotion configuration.

---

## 2. AdaptiveContainer
- **Purpose**: Restricts content width on ultra-wide screens to prevent scanning fatigue (fluid boundaries).
- **Owner**: Core UI Platform Team
- **Inputs (Props)**:
  - `children: React.ReactNode`
  - `className?: string`
  - `variant: LayoutVariant`
- **Responsive Rules**:
  - Sets a hard constraint of `max-w-7xl` with auto margins (`mx-auto`).
  - Adapts padding: `p-4` (Compact), `p-8` (Regular), `p-12` (Expanded).

---

## 3. AdaptiveNavigation
- **Purpose**: Dispatches the correct device navigation mechanism depending on viewport size.
- **Owner**: Core Navigation Layer
- **Inputs (Props)**:
  - `activeTab: TabType`
  - `setActiveTab: (tab: TabType) => void`
  - `uiLanguage: "vi" | "en"`
  - `unreadQueueCount?: number`
  - `unreadRssCount?: number`
- **Adaptive Dispatcher Rules**:
  - `DeviceType.Mobile` -> Returns native touch-friendly `<BottomNavigation />`
  - `DeviceType.Tablet` -> Returns standard `<Sidebar />`
  - `DeviceType.Desktop` -> Returns standard `<Sidebar />`

---

## 4. AdaptiveGrid
- **Purpose**: Unified multi-column layout organizer that replaces manually written media queries.
- **Owner**: Grid Alignment System
- **Inputs (Props)**:
  - `children: React.ReactNode`
  - `className?: string`
  - `cols?: { compact?: number; regular?: number; expanded?: number; }`
- **Responsive Grid rules**:
  - Maps to appropriate CSS grid styles (`grid-cols-1`, `md:grid-cols-2`, `lg:grid-cols-3/4`) depending on current environmental variant context.

---

## 5. AdaptiveCard
- **Purpose**: Container card supporting standard content groupings, handling variant padding internally.
- **Owner**: Display Cards System
- **Inputs (Props)**:
  - `children: React.ReactNode`
  - `className?: string`
  - `variant?: LayoutVariant`
- **Styling Specs**:
  - Compact: `p-4` padding with compact borders.
  - Regular: `p-6` padding.
  - Expanded: `p-8` padding.

---

## 6. PageTemplate
- **Purpose**: Orchestrates standard workspace placement (sticky headers, scrollable main area, safe area margins, footers).
- **Owner**: Layout Orchestrations Team
- **Inputs (Props)**:
  - `children: React.ReactNode`
  - `header?: React.ReactNode`
  - `toolbar?: React.ReactNode`
  - `footer?: React.ReactNode`
  - `className?: string`
- **A11y & Device Adaptation**:
  - Handles safe area margins dynamically via safeArea state (`pb-24` spacing for bottom navigators on iPhone/Android).
