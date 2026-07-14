# Glossary

- **Briefing**: The master object holding the briefing state (id, date, rssHash, versions, segments).
- **Segment**: Individual structural component (intro, story, transition, outro) with multi-lingual payloads.
- **AudioManifest**: A language-specific projection defining playback URLs.
- **AudioAsset**: Immutable storage pointers (url, voice, engine, version).
- **Projection**: A specific view of the Briefing (e.g., Vietnamese, English, Bilingual).
- **Source of Truth**: The structured JSON Briefing representation stored in the Database.
- **Fingerprint**: A SHA256 hash of RSS content used to determine if regeneration is needed.
- **Prompt Version**: A tag to track which AI prompt generated the current summary.
