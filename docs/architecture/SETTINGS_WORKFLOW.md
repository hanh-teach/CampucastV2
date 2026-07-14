# Settings Workflow Specification

Settings must prioritize **Recognition over Recall** and provide instant, deterministic feedback.

## 1. The "Instant Apply" Rule
- **Visual Changes**: Themes, font sizes, and layouts must update the UI immediately upon selection (No "Save" button required for visuals).
- **Audio Changes**: Voice selection must provide an in-situ "Play Sample" button. The operator must hear the voice before committing.

## 2. Navigation Hierarchy
To reduce cognitive load, the UI follows a strict 3-tier hierarchy:
1. **Navigation Rail** (Left): Iconic category selection.
2. **Main Panel** (Center): Scrollable list of goal-oriented sections.
3. **Detail View** (Right/Overlay): Complex configuration (e.g., adding a specific RSS feed).

## 3. Progressive Disclosure
Hide complexity until it is needed:
- **Collapsed Sections**: Advanced fields within a section (e.g., RSS "Refresh Interval") are hidden behind a "Show Advanced" toggle.
- **Dependency Hiding**: If `AI Memory` is toggled OFF, all associated memory management fields are removed from the DOM.

## 4. Search Workflow
- **Global Search**: Gathers results from across all categories.
- **Deep Linking**: Selecting a search result navigates the user directly to that section and highlights the target field.
