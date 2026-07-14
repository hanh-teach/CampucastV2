# Mission Capability Registry

This registry defines the modular capabilities that can be requested or provided by a Mission.

## 1. Core Capabilities

| Capability | Category | Description |
| :--- | :--- | :--- |
| `rss_fetcher` | Data | Ability to sync and parse RSS feeds. |
| `text_summarizer`| AI | Ability to compress news articles into scripts. |
| `voice_synthesis`| Media | Ability to generate PCM audio from text. |
| `video_rendering`| Media | Ability to export visual containers. |
| `cloud_storage` | System | Ability to persist large artifacts to S3/Cloud Storage. |
| `analytics` | System | Ability to track operational KPIs. |

## 2. Usage in Mission Model
Missions do not define "features"; they declare **Capability Requirements**.

```typescript
interface MissionCapabilities {
  required: MissionCapability[]; // Must be present to start
  optional: MissionCapability[]; // Enhances the mission if present
  provided: MissionCapability[]; // Artifact types produced
}
```

## 3. Capability Resolution
The `MissionPlatform` resolves capabilities before moving a Mission from `Created` to `Ready`.
- If a `required` capability is missing, the Mission is marked as `Blocked` with a `CapabilityError`.
- If an `optional` capability is missing, the Mission proceeds but logs a `Warning`.

## 4. Capability Providers
Capabilities are provided by **Engines** or **Adapters**.
- `RSSAdapter` provides `rss_fetcher`.
- `GeminiAdapter` provides `text_summarizer`.
- `AudioStudio` provides `voice_synthesis`.
