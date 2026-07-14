# Domain Model: CommuteCast v5

## Aggregate Root: `SummaryPayload`
The `SummaryPayload` is the central data model for a generated briefing.

- **Interface `SummaryPayload`**: Encapsulates the script structure.
  - `title`: String
  - `introduction`: String
  - `chapters`: Array of `NewsChapter`
  - `conclusion`: String

- **Interface `NewsChapter`**: Represents a specific news topic/story.
  - `topic`: String
  - `scriptText`: String
  - `summaryBullets`: String[]

- **Entity `SavedSummary`**: The persistent representation of a generated briefing.
  - `id`: Unique identifier
  - `timestamp`: Generation time
  - `preferences`: `SummaryPreferences` used
  - `payload`: The `SummaryPayload` content
  - `audioChunks`: Array of Base64 audio strings (Intro, Chapters..., Conclusion)

## External Input: `RSSArticle`
Represents raw data fetched from sources before being processed into a briefing.
- `title`, `link`, `pubDate`, `content`
- `isDuplicate`: Boolean (QualityGate result)

## Configuration: `BroadcastConfiguration`
Defines the parameters for briefing generation and audio synthesis.
- `languageMode`, `voice`, `tone`, `targetDuration`, etc.

## Relationships
- `SummaryPayload` 1:N `NewsChapter`
- `SavedSummary` 1:1 `SummaryPayload`
- `SavedSummary` 1:N `audioChunks`
