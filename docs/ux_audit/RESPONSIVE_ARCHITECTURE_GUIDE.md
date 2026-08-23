# Responsive Architecture Guide (Adaptive UX v1.0)

## 1. Core Philosophy: Adaptive, Not Responsive
- **Product Layering**: View Desktop, Tablet, and Mobile as three distinct products.
- **Logic Separation**: Shared business logic; unique layout, navigation, and IA for each form factor.

## 2. Layout Rules
- **Breakpoints**: 
  - Mobile (< 768px): Stacked, Scrollable.
  - Tablet (768px - 1199px): Hybrid.
  - Desktop (>= 1200px): Sidebar + Content + Inspector.
- **Scroll Management**: Native scroll only. No nested scroll containers.
- **Safe Areas**: Mandatory use of `env(safe-area-inset-*)`.

## 3. Adaptive Component Rules
| Component | Desktop | Tablet | Mobile |
| :--- | :--- | :--- | :--- |
| Sidebar | Sidebar | Nav Rail | Bottom Nav |
| Settings | 3-Panel Grid | 2-Panel | Accordion Stack |
| Content Area | Grid | Grid/List | Full-width List |
| Floating Actions | FAB | FAB | FAB (avoid overlay) |

## 4. Typography & Spacing Tokens
- **Typography**: Reduce font-size variation. Focus on readable body text (15-16px). Eliminate < 13px fonts.
- **Spacing**: Use standard 4px-based spacing tokens (4, 8, 12, 16, 20, 24, 32, 40, 48).
