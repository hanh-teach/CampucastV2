# API Contract: CommuteCast v4

## Briefing Endpoints
- `GET /briefings/today`: Return today's `BriefingResponseDto` (metadata + all segments).
- `GET /briefings/{id}`: Return specific briefing `BriefingResponseDto`.
- `GET /briefings/{id}/manifest?lang={lang}&voice={voice}`: Return `ManifestResponseDto` (ordered segment audio URLs).

## Internal TTS Endpoints
- `POST /tts`: Trigger generation. `AudioTtsRequestDto` payload.
