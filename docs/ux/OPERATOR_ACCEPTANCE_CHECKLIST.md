# Operator Acceptance Checklist

This checklist must be executed and fully passed before any pull request is merged, or any UX Sprint is declared complete.

---

## 🚦 Pre-Merge / Sprint Verification Gate

### 1. Recognition & Orientation (< 3 Seconds)
- [ ] Can a first-time operator determine exactly where they are and how to start a task within 3 seconds?
- [ ] Is the primary focus area of the active screen immediately obvious through high visual contrast?
- [ ] If a draft exists, is the "Continue Working" card surfaced prominently on the landing interface?

### 2. Cognitive Load & Memory Offloading
- [ ] Does the active screen require the operator to memorize previously selected parameters or text?
- [ ] Are active draft items, configurations, and running processes contextually loaded without manual searching?
- [ ] Are secondary configurations hidden beneath logical progressive disclosure boundaries?

### 3. Navigation & Flow Continuity
- [ ] Is there exactly ONE dominant primary action call-to-action (CTA) on the active screen?
- [ ] If the operator navigates away (e.g., from Create to Library) and returns, is their work state fully preserved?
- [ ] Are there any "Dead Ends" (e.g., hard error screens with no back buttons or redirect links)?

### 4. Data Safety & Crash Resilience
- [ ] Does the system run background autosaves (10-second intervals) during content editing?
- [ ] If the tab is forcefully refreshed or the browser restarts, is the operator prompted with a seamless recovery path?
- [ ] Have invasive "Are you sure you want to exit?" popups been eliminated in favor of implicit soft persistence?

### 5. Architectural Visual Grammar
- [ ] Is color used strictly for functional signaling (e.g., warning, error, brand CTA) rather than arbitrary decoration?
- [ ] Are borders reserved for inputs, active selected states, or focus states, rather than layout containment dividers?
- [ ] Is the interface surface hierarchy clear, separating background, workspace panels, and individual controls by at least 2-3% contrast or shadow separation?

---

## 🏁 Definition of Done (DoD) Sign-Off

| Metric / Scenario | Verification Method | Result |
| :--- | :--- | :--- |
| **No Lost Context** | Accidental refresh retains text/state | [ ] Pass |
| **No Dead Ends** | Contextual warnings have redirect anchors | [ ] Pass |
| **Visual Hierarchy** | Single primary CTA clearly stands out | [ ] Pass |
| **Code Validation** | Build PASS & Lint PASS | [ ] Pass |
