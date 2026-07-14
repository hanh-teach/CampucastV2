# CommuteCast Design System v1.0

This design system establishes a strict, professional visual language for the CommuteCast Enterprise platform. All future features, custom views, and interface components must adhere to this unified specification.

---

## 🎨 1. Theme Color Tokens

The visual foundation relies on three distinct thematic experiences, along with a system preference automatic mapping.

| Token | Sáng (Light Theme) | Tối (Dark Theme) | Dịu mắt (Eye Comfort - Default) |
| :--- | :--- | :--- | :--- |
| **Sidebar Background** | `#FFFFFF` (Pure white) | `#0E1116` (Deep pitch) | `#2C322D` (Deep sage olive) |
| **Header Background** | `#F6F7F9` (Soft gray tint) | `#181C22` (Charcoal dark) | `#364038` (Medium olive forest) |
| **Content Area Background**| `#FCFCFD` (Pristine background)| `#20242B` (Elegant midnight slate)| `#E8E9E2` (Warm clay / soft grey-cream)|
| **Surface (Cards/Dialogs)** | `#FFFFFF` | `#181C22` | `#F4F5ED` |
| **Primary Text Color** | `#0F172A` (Slate 900) | `#F8FAFC` (Slate 50) | `#1E2520` (Dark forest forest) |
| **Secondary Text Color** | `#475569` | `#94A3B8` | `#4B544D` |
| **Brand Accent Color** | `#06B6D4` (Teal) | `#22D3EE` (Cyan) | `#2E6F40` (Rich light-olive green) |

### System Preference Mode (`auto`)
The **Theo hệ thống (System)** theme is **not** a separate visual template. It dynamically queries the active operating system color scheme preference:
- Windows/macOS/iOS/Android Light Mode → Renders **Sáng (Light Theme)**
- Windows/macOS/iOS/Android Dark Mode → Renders **Tối (Dark Theme)**

---

## 📐 2. Layout & Visual Hierarchy

To prevent a "flat UI" where sections blend into each other, the platform enforces clear visual elevation layers:

1. **Sidebar (Core Navigation)**:
   - Must visually frame the application.
   - Restful color contrast against the header and content areas.
   - Selected tabs feature a subtle background brand tint (`bg-brand-accent/10`), a bold text weight, a slightly expanded icon scale, and an animated vertical left-side bar.
2. **Header (Context & Controls)**:
   - Elevated with a soft, uniform bottom border and a very light shadow (`shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]`).
   - Visually sits between the Sidebar and Content.
3. **Content Area (Workspaces)**:
   - The brightest (Light/Eye Comfort) or most focused (Dark) pane on the screen.
   - Uses generous padding (`p-10` desktop, `p-6` tablet, `p-4` mobile).

---

## 📏 3. Spacing, Radius & Shadows

Consistent dimensions prevent layout discrepancies across modules.

### Spacing Scale (Tailwind standard)
- **xs / 4px**: Inline item gaps, subtle indicators (`gap-1`, `p-1`)
- **sm / 8px**: Component padding, list item gaps (`gap-2`, `p-2`)
- **md / 12px**: Internal card padding, form grids (`gap-3`, `p-3`)
- **lg / 16px**: Standard flex lists, cards (`gap-4`, `p-4`)
- **xl / 24px**: Sections, page titles (`gap-6`, `p-6`)
- **2xl / 32px**: Large workspace grids (`gap-8`, `p-8`)
- **3xl / 40px**: Generous workspace offsets (`p-10`)

### Border Radius Scale
- `rounded-lg` (`0.5rem` / 8px) - Form inputs, secondary action buttons.
- `rounded-xl` (`0.75rem` / 12px) - Standard layout elements, buttons, badges.
- `rounded-2xl` (`1rem` / 16px) - Cards, workspace elements.
- `rounded-3xl` (`1.5rem` / 24px) - Complex nested containers, main modal frames.

### Elevation & Shadows
- **Flat UI elements**: Standard layout panels use crisp border separations (`border-border-subtle`).
- **Standard Cards**: Soft, low-contrast shadow (`shadow-sm` / `shadow-md`) to avoid dirty-looking edges.
- **Hover Transitions**: Interactive components must gently scale and lift up (`interactive-card` class in `index.css`).

---

## ✍️ 4. Typography pairing

- **UI Body/Labels**: **Inter** (sans-serif) for high legibility, clean spacing, and variable weights.
- **Display (Headings)**: All-caps, tracked uppercase display styling for section headers, or rich medium/bold weights for titles to signify weight.
- **Technical/PCM Data**: **JetBrains Mono** or Fira Code for logs, telemetry, timestamps, or system labels.

---

## ♿ 5. Accessibility & Touch targets (WCAG AA Compliance)

1. **Touch Areas**:
   - Every clickable button, link, or tab **MUST** measure at least **44px × 44px** (on mobile / touch screen sizes) or contain clear margins to prevent accidental taps.
2. **Color Contrast**:
   - Body copy must maintain a minimum contrast ratio of **4.5:1** against backgrounds (all colors listed in Section 1 have been audited to surpass this threshold).
3. **No Theme Selection Overload**:
   - The interface remains completely clean and functional. Swapping themes does not reload assets or flash layout shifts.
