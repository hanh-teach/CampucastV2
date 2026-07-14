# Event Catalog
The CommuteCast architecture utilizes an internal Event Bus to decouple capability modules. This document catalogs the core events.

## Event Envelope
Every event published to the Event Bus MUST follow a standardized versioned envelope:
- `eventId`: Unique identifier for the event instance (UUID).
- `eventVersion`: Version of the event schema (e.g., `1.0`).
- `timestamp`: Time the event was generated.
- `source`: The identifier of the publisher module/connector.
- `payload`: The actual event-specific data (as defined below).

## NewsImported
- **Trigger Condition**: When raw data is successfully fetched or ingested from a source.
- **Publisher**: Source Connectors (News Sources)
- **Subscribers**: Normalization Layer
- **Payload**: Raw source data, source identifier, timestamp.

## NewsNormalized
- **Trigger Condition**: When raw data has been successfully mapped to the `NewsModel` (`NewsItem`).
- **Publisher**: Normalization Layer
- **Subscribers**: Deduplication, Classification Engine
- **Payload**: `NewsItem` object.

## NewsScored
- **Trigger Condition**: When a normalized `NewsItem` has been evaluated and scored.
- **Publisher**: Classification Engine
- **Subscribers**: Collections, AI Studio
- **Payload**: `NewsItem` with updated `score` property.

## CandidateEnriched
- **Trigger Condition**: When a `NewsItem` has been processed by the Candidate Intelligence Platform.
- **Publisher**: Candidate Intelligence Platform
- **Subscribers**: Story Intelligence Platform, Recommendation Engine
- **Payload**: `EnrichedCandidate`.

## StoriesClustered
- **Trigger Condition**: When candidates have been grouped into narrative clusters.
- **Publisher**: Story Intelligence Platform
- **Subscribers**: Recommendation Engine, Narrative Composer
- **Payload**: `StoryCluster[]`.

## RecommendationRanked
- **Trigger Condition**: When the Recommendation Engine has finalized the content ranking.
- **Publisher**: Recommendation Engine
- **Subscribers**: Narrative Composer, UI Projection
- **Payload**: `RankingResult[]`.

## NarrativeComposed
- **Trigger Condition**: When the Narrative Composer has assembled the structural beats for a briefing.
- **Publisher**: Narrative Composer
- **Subscribers**: Narrative Generator, Voice Director
- **Payload**: `Narrative`.

## SummaryGenerated
- **Trigger Condition**: When the AI Studio has successfully generated a broadcast script or summary for a `NewsItem`.
- **Publisher**: AI Studio
- **Subscribers**: Audio Studio, Collections
- **Payload**: `NewsItem` with generated script, `aiStatus` updated.

## AudioGenerated
- **Trigger Condition**: When the Audio Studio (TTS) has successfully synthesized the script into an audio file.
- **Publisher**: Audio Studio
- **Subscribers**: Playback Center, Library
- **Payload**: `AudioProject` object or `NewsItem` with updated `audioStatus` and audio URL.

## PlaybackStarted
- **Trigger Condition**: When the user initiates playback of an audio track.
- **Publisher**: Playback Center
- **Subscribers**: Library (for history tracking), Control Center
- **Payload**: `AudioProject` ID, timestamp.

## PodcastPublished
- **Trigger Condition**: When a final compilation (Playlist/Podcast) is ready for distribution or offline saving.
- **Publisher**: Collections / Audio Studio
- **Subscribers**: Library
- **Payload**: `Playlist` or `AudioProject` data.
