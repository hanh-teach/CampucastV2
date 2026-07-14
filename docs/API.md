# CommuteCast API Documentation

## Internal API Routes (Server Proxy)

All backend requests are proxied via the server to protect API keys and ensure stable execution.

### `GET /api/health`
- **Purpose**: Health check for the server.
- **Response**: `{ "status": "ok" }`

### `POST /api/briefing`
- **Purpose**: Generates a new personalized news briefing.
- **Payload**: `UserPreferences` object.
- **Response**: `BriefingResult` (Stream or JSON).

### `POST /api/tts`
- **Purpose**: Converts text to speech with language-aware segmentation and smart engine routing.
- **Payload**: `{ text: string, voice: string, tone?: string, emotion?: string, languageMode?: "VN_ONLY" | "EN_ONLY" | "BILINGUAL" }`
- **Response**: `{ base64Audio: string, engine: string, chunksCount: number, processedByEngine: boolean, cacheable: boolean }`
- **Behavior**: 
    1. **Broadcast Cleaning**: Strips metadata (Reuters, Breaking, etc.).
    2. **Segmentation**: Splits text into paragraphs and sentences.
    3. **Language Detection**: Scores each segment for Vietnamese vs English confidence.
    4. **Context Inheritance**: Neutral or low-confidence segments inherit language from preceding blocks.
    5. **Normalization**: Language-specific conversion of units, numbers, and symbols.
    6. **Routing**: Routes Vietnamese to Edge TTS and English to Gemini TTS.
    7. **Merging**: Concatenates audio buffers into a single stream.

### `POST /api/intelligence/candidate`
- **Purpose**: Enriches a candidate with semantic signals.
- **Response**: `EnrichedCandidate`.

### `POST /api/intelligence/story`
- **Purpose**: Clusters candidates into story narratives.
- **Response**: `StoryCluster[]`.

### `POST /api/recommendation/rank`
- **Purpose**: Ranks candidates based on user interests and context.
- **Response**: `RankingResult[]`.

### `POST /api/assistant-chat`
- **Purpose**: Unified endpoint for the Operator Assistant to process natural language queries and workstation actions.
- **Payload**: `{ message: string, workstationContext: string, history?: Message[] }`
- **Response**: `{ response: string, action?: string, suggestions?: string[] }`
- **Behavior**: Context-aware reasoning based on the active workstation workstation (Home, Create, Library, Settings).

---

## Podcast API (Modular Router)

Managed via `src/server/routes/podcast.routes.ts`.

### `GET /api/podcast/episodes`
- **Purpose**: Retrieves the list of published podcast episodes.
- **Response**: `PodcastEpisode[]` (JSON).

### `POST /api/podcast/publish`
- **Purpose**: Publishes a new briefing as a podcast episode.
- **Payload**: `{ id, title, description, audioUrl, duration }`.
- **Response**: `{ success: true, episode: PodcastEpisode }`.

### `DELETE /api/podcast/episodes/:id`
- **Purpose**: Deletes a podcast episode.

### `GET /api/podcast/feed`
- **Purpose**: Generates the public RSS XML feed for the podcast.
- **Response**: XML data with `application/xml` content-type.

### `GET /api/local-podcasts/:filename`
- **Purpose**: Streams local audio files from the `/local_podcasts` directory.
- **Response**: Audio binary stream.

---

## Client-Side Services (Interaction Layer)

### `telemetryService`
- **`track(type, payload)`**: Tracks system and user behavior with persistent `visitorId` and session-specific `sessionId`.
- **`startExecution(routineId)`**: Initializes a new execution chain with a unique `correlationId`.
- **`trackInteraction(type, payload)`**: Tracks user interactions (Rage Taps, Surveys, etc.).
- **New Instruments**: 
  - `perception_survey`: Captures subjective user experience linked via `correlationId` to the execution chain.
  - `URC`: Calculates User Return Confidence based on visitor history.

#### Hardened `StructuredEvent` Schema (Platform-001.1)
All lifecycle events are strongly-typed, versioned, and correlated:
```typescript
interface StructuredEvent {
  readonly timestamp: string;        // ISO timestamp or localized HH:MM:SS
  readonly actor: "RSS Connector" | "Gemini AI" | "Voice TTS" | "Storage" | "Operator";
  readonly event: string;            // Human-readable action description
  readonly duration: number;         // Step duration in milliseconds
  readonly status: "success" | "failed" | "retrying";
  readonly retryCount: number;       // Current attempt counter
  readonly correlationId: string;    // End-to-end tracing token
  readonly schemaVersion: string;     // Event payload schema definition version (e.g., "v1.0")
}
```

### `rssService`
- **`fetchFeeds(urls)`**: Fetches and normalizes RSS data.

### `broadcastSpeechEngine`
- **`speak(text)`**: Synthesizes and plays audio.

---

## Pipeline Orchestrator & Resilience API (Application Layer)

The Pipeline Orchestrator controls deterministic execution of processing steps, equipped with robust retry, timeout, circuit breaker, and dead letter queue systems.

### `Pipeline` Interface

#### `constructor(options?: { dlq?: DeadLetterQueue, promptVersion?: string, schemaVersion?: string })`
- **`dlq`**: Customs Dead Letter Queue implementation (defaults to `MemoryDeadLetterQueue`).
- **`promptVersion`**: Active prompt version identifier (defaults to `v1.0.0`).
- **`schemaVersion`**: Active schema version identifier (defaults to `v4.0.0`).

#### `addStep(step: PipelineStep): this`
- Appends a step (`ParseRSSStep`, `NormalizeStep`, etc.) to the execution sequence.

#### `execute(initialContext: PipelineContext): Promise<Result<PipelineContext>>`
- Executes the pipeline sequentially.
- **Centralized Resilience features**:
  1. **Centralized Retry with Exponential Backoff**: Retries failing steps up to `step.retryConfig.maxAttempts` with backoff delay.
  2. **Circuit Breaker**: Trips step execution to immediate failure if failures exceed threshold, avoiding endless worker hanging.
  3. **Step Timeout**: Aborts hanging steps with `Promise.race` if execution exceeds `step.timeoutMs`.
  4. **Dead Letter Queue Routing**: Intercepts unrecoverable failures and records raw inputs/states into the DLQ.
  5. **Telemetry & Manifest**: Appends granular execution timestamps and publishes a run manifest.

#### `static replay(context: PipelineContext, manifest: PipelineManifest, steps: PipelineStep[]): Promise<Result<PipelineContext>>`
- Re-runs a pipeline run using stored raw RSS XML and recorded Gemini `summaryResult` with 100% determinism.
- Bypasses external API and network requests (0 tokens used).

### Telemetry Manifest Schema (`PipelineManifest`)
```typescript
interface PipelineManifest {
  readonly runId: string;
  readonly timestamp: string;         // ISO start/completion timestamp
  readonly fingerprint: string | null; // Deterministic SHA-256 content hash
  readonly promptVersion: string;      // Current LLM Prompt version
  readonly schemaVersion: string;      // Current schema definition version
  readonly status: "success" | "skipped" | "failed";
  readonly durationMs: number;         // Total pipeline run duration
  readonly executedSteps: string[];    // Successful steps
  readonly skippedSteps: string[];     // Skipped steps
  readonly stepTelemetry: StepTelemetry[];
}

interface StepTelemetry {
  readonly stepName: string;
  readonly durationMs: number;         // Precise execution duration
  readonly status: "success" | "skipped" | "failed";
  readonly attempts: number;           // Execution attempt count
  readonly error?: string;             // Error message (if failed)
}
```

## Production Studio Stage 4 Audio Rendering Engine

The Audio Rendering Engine is implemented inside the standalone service function `renderAudio` in `/src/services/productionPipeline.ts`.

### Function Signature
```typescript
export async function renderAudio(
  speechPackage: SpeechPackage,
  options: {
    getApiUrl: (path: string) => string;
    tone?: string;
    languageMode?: string;
    onProgress?: (progress: {
      current: number;
      total: number;
      label: string;
      status: "idle" | "rendering" | "completed" | "failed" | "cached";
    }) => void;
    signal?: AbortSignal;
    useCache?: boolean;
    maxRetries?: number;
    initialDelayMs?: number;
    existingArtifact?: AudioArtifact;
  }
): Promise<AudioArtifact>;
```

### Immutable Output Schema (`AudioArtifact`)
```typescript
export interface AudioArtifact {
  id: string;
  speechPackageId: string;
  audioChunks: string[];                  // Base64 audio arrays
  succeededSegments: string[];             // List of segment IDs successfully processed
  failedSegments: Array<{ id: string; label: string; message: string }>;
  completedAt: string;
  checksum: string;                       // Collision-resistant rolling DJB2 hash of chunks
  metadata: {
    totalDuration: number;                // Total track duration in seconds
    bitRate: string;                      // Output encoding bit rate (e.g., "128kbps")
    sampleRate: number;                   // Sample rate in Hz (e.g., 24000)
    channelCount: number;                 // Channels (e.g., 1 for Mono)
    voiceManifest: Record<string, string>; // Mapping of segmentId to assigned voice
    volumeLevelDb: number;                // Target normalized loudness level (e.g., -14.0 LUFS)
    generatedBy: string;                  // Engine identifier signature
  };
  isPartial: boolean;                     // Flag indicating if some chunks failed but a valid partial track was built
}
```


