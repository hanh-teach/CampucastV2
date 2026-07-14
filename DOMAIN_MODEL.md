# Domain Model

This document describes the core entities that act as the Single Source of Truth for the CommuteCast platform.

To maintain simplicity and prevent codebase bloat, CommuteCast exclusively uses a unified set of types representing the React-driven generation flow (per the architectural cleanup decision in Prompt #3).

## Data Flow Models

### RSSFeed & RSSArticle
The foundational data structures for all incoming information streams. They represent raw data parsed from RSS sources.
- `RSSFeed`: Contains feed metadata (url, title, enabled).
- `RSSArticle`: Contains the extracted article content (title, summary, date, content).

### SummaryPayload & NewsChapter
The structured payload returned by the LLM Gemini generation step.
- `SummaryPayload`: Contains the high-level `introduction`, an array of `chapters`, and a `conclusion`.
- `NewsChapter`: Represents a single block of generated script (`topic`, `scriptText`, `summaryBullets`).

### SavedSummary & PublishedEpisode
The persisted versions of generated audio scripts.
- `SavedSummary`: Represents a brief stored in local storage, containing the `SummaryPayload` and metadata.
- `PublishedEpisode`: Represents a fully generated and hosted audio broadcast, containing references to the original audio file (`audioUrl`) and the `SummaryPayload`.

### BroadcastConfiguration
Manages the user's settings and playback configurations for the generation flow.
- Preferences such as `voice`, `speed`, `tone`, `aiMode`, `languageMode`.
- Context parameters like `commuteType`, `customInstructions`.

## Application Telemetry

### TelemetryEvent
Represents an event triggered during the execution pipeline (e.g. `execution_start`, `tts_synthesized`) used to track execution durations and errors for observability without interrupting the core data flow.
