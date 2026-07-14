# Entity Relationship Diagram (Logical)

```text
Briefing
  ├── id (PK)
  ├── date
  ├── rssHash
  └── segments (List of Segment IDs)

Segment
  ├── id (PK)
  ├── briefingId (FK)
  ├── type
  ├── content (JSONB: vi, en, bilingual)
  └── order

AudioAsset
  ├── segmentId (FK)
  ├── version
  ├── voice
  ├── lang
  └── url
```
