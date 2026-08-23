# Visual Regression Test Plan & Baseline Checklist

To prevent regressions (such as "fixing RSS breaks Audio" or "responsive breaks multi-column desktop"), this plan establishes the test cases and visual snapshots required before releasing code to production.

---

## 1. Visual Verification Profiles

### Desktop (Viewport: 1440x900)
- [ ] Sidebar is expanded.
- [ ] Columns are organized side-by-side (minimum 3 panels for Mission Intelligence).
- [ ] Player is pinned to the right side of the screen.
- [ ] All display headings pair "Space Grotesk" or sans-serif elegantly.

### Tablet (Viewport: 834x1112 - iPad Pro)
- [ ] Sidebar contracts to a compact navigation rail.
- [ ] Mission Workspace wraps into a secondary layout grid with side sheets.
- [ ] Primary player collapses into a modular block at the bottom.

### Mobile Portrait (Viewport: 390x844 - iPhone 15)
- [ ] Sidebar is completely hidden (no sidebar DOM rendering).
- [ ] Bottom Navigation is sticky at the bottom.
- [ ] Zero horizontal scrollbars (`overflow-x: hidden` enforced on page root).
- [ ] Touch targets (buttons, inputs, tabs) are strictly $\ge$ 44px.
- [ ] Card widths are 100% of the viewport width.

### Mobile Landscape (Viewport: 844x390 - iPhone Landscape)
- [ ] Content adjusts to standard horizontal view.
- [ ] Bottom navigation changes to secondary sidebar indicator, or stays fixed.
- [ ] Scrollable area handles compressed heights safely.

---

## 2. Regression Verification Matrix

| Area | Verification Task | Expected Outcome | Status |
| :--- | :--- | :--- | :--- |
| **Navigation** | Toggle all tabs (Home, Create, Library, Settings, Playground) | URL state or tab state switches instantly without page reload. | [ ] |
| **Mission Studio** | Generate a piece of briefing content | Step indicator progresses visually through each stage. | [ ] |
| **Audio player** | Play synthetic briefing track | Waveform displays, play/pause state triggers haptic or visual micro-animation. | [ ] |
| **Settings** | Toggle UI language or active voice setting | Form shifts gracefully, no multi-column layouts squashed. | [ ] |
| **Assistant** | Toggle assistant drawer or chat panel | FAB is positioned cleanly without blocking Bottom Navigation. | [ ] |

---

## 3. Playback and Media Integrity
- [ ] Synthesizer Web Audio context remains isolated.
- [ ] Changing tabs does NOT disrupt active background audio streams.
- [ ] Audio volume/rate sliders respond smoothly to continuous touch gestures.
