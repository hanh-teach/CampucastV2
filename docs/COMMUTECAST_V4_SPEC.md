# CommuteCast v4 Enterprise Specification: "The AI DJ Architecture"

## 1. Vision & Goals
CommuteCast v4 evolves from an RSS reader into a high-scale, AI-driven News Intelligence Platform. 
- **Core Philosophy**: "Generate Once, Play Many."
- **Spotify AI DJ Experience**: Instant language switching, personalized briefing segments, and high-fidelity streaming.
- **Production Scale**: Decoupled services (Event-Driven), immutable caching, and robust observability.

## 2. Domain Model
- **Briefing**: The master object holding the briefing state (`id`, `date`, `rssHash`, `versions`, `segments[]`).
- **Segment**: Individual briefing components (`intro`, `story-id`, `transition`, `outro`).
- **AudioAsset**: Immutable storage pointers (`url`, `version`, `voice`, `engine`, `lang`).
- **UserProfile**: User interests, language preferences, and voice choices.

## 3. Database Schema (Logical)
- **Briefings**: `{ id, date, rssHash, schemaVersion, promptVersion, ttsVersion, segments (jsonb) }`
- **Segments**: `{ briefingId, segmentId, type, content_vi, content_en, content_bilingual }`
- **AudioAssets**: `{ segmentId, lang, voice, engine, version, url, createdAt }`

## 4. API Contracts (Manifest-Driven)
- `GET /briefings/today`: Return today's briefing metadata.
- `GET /briefings/{id}/manifest?lang={vi|en|bilingual}&voice={mai|nam}`: Return structured segment URLs.
- `POST /tts`: (Internal) Trigger TTS for a segment.
- `GET /tts/status/{id}`: Polling/Webhook status for audio generation.

## 5. Event Definitions (Event Bus)
- `BriefingGenerated`: Trigger audio generation.
- `AudioSegmentGenerated`: Trigger notification/indexing/analytics.
- `BriefingUpdateRequested`: Trigger re-rank/summarization.

## 6. Audio Manifest Specification (v1)
```json
{
  "briefingId": "...",
  "language": "vi",
  "voice": "mai",
  "segments": [
    { "segmentId": "intro", "url": "audio/123/v1/mai/edge/intro.mp3" },
    { "segmentId": "story-1", "url": "audio/123/v1/mai/edge/story-1.mp3" }
  ]
}
```

## 7. Telemetry Schema
- **Player Events**: `Play`, `Pause`, `Seek`, `Complete`, `Abandon`, `LanguageSwitch`.
- **System Events**: `CacheHit`, `CacheMiss`, `TtsEngineError`, `DecodeError`.

## 8. Caching Strategy
- **Briefing Cache (Redis/SSR)**: 24h retention.
- **Audio Cache (Object Storage/CDN)**: Immutable, infinite retention (via versioning).
- **Versioning**: `audio/{briefingId}/{ttsVersion}/{voice}/{engine}/{segmentId}.mp3`.

## 9. Rollback & Versioning
- **Schema/Prompt/TTS Versioning**: Every major change triggers a version increment in the `Briefing` metadata.
- **Rollback**: Toggling `PromptRegistry` version or `TTSVersion` allows instantaneous rollback without deployment.

## 10. Performance SLOs
- **TTFF (Time to First Frame)**: <500ms (manifest load).
- **Audio Streaming**: Pre-buffered streaming per segment.

## 11. Acceptance Criteria (DoD)
- [ ] Multi-block synthesis verified for 100% of segments.
- [ ] Zero `EncodingError` in client-side logs.
- [ ] Manifest-based streaming implemented.
- [ ] Event Bus operational for asynchronous tasks.
- [ ] Telemetry Pipeline capturing 100% of player interactions.
