# RFC 002: Production Studio Pipeline Refactoring

## 📋 Status
- **Author**: AI Coding Agent (on behalf of Chief Software Architect)
- **Status**: Proposed (Pending Review)
- **Created**: 2026-07-10

---

## 1. Executive Summary & Objective
The CommuteCast Production Studio is a core capability powering personalized audio briefings. Currently, the transition between:
- **Stage 2**: Editorial Draft (Summarization & Narrative Scripting)
- **Stage 3**: Speech Preparation (Timeline Segment Allocation & Pronunciation Normalization)
- **Stage 4**: Audio Generation (Text-to-Speech Parallel Voice Synthesis)

is managed via a single monolithic execution routine (`handleGenerateBriefing` inside `useBriefingGeneration.ts`). This structure couples stages tightly, introduces implicit dependencies on transient UI component state, duplicates draft representations, and makes debugging or resuming stages in isolation impossible.

This RFC proposes a decoupled, event-driven pipeline architecture driven by **immutable stage artifacts**, formal **StageResult** interfaces, and an orchestrating **PipelineContext**. It focuses on refactoring **Stage 2 (Editorial Draft Engine)** into an isolated service that consumes a standard `ResearchPackage` and emits an `EditorialDraft` without direct UI or Stage 3 coupling.

---

## 2. Architecture & Orchestration Audits

### 2.1 Current Monolithic Pipeline Flow
```
[User Input / RSS Content] 
          │
          ▼
┌────────────────────────────────────────────────────────────────────────┐
│ useBriefingGeneration.ts (handleGenerateBriefing)                       │
│                                                                        │
│  Stage 2: POST /api/summarize                                          │
│        │                                                               │
│        ▼ (activePayload / scriptPayload in closure)                    │
│  Stage 3: prepareSynthesisTimeline(scriptPayload)                      │
│        │                                                               │
│        ▼ (synthesisTimeline array in closure)                          │
│  Stage 4: Parallel fetch(/api/tts) & Promise.allSettled()              │
└────────────────────────────────────────────────────────────────────────┘
          │
          ▼
     [Audio Output / SavedSummary]
```

### 2.2 Proposed Decoupled Event-Driven Pipeline
Each stage operates as an isolated service that takes a dedicated input contract and produces an immutable output artifact. Transitions are driven by event listeners (`onStageCompleted`) or context state machines.

```
       [Stage 1: News Aggregator]
                  │
                  ▼ Emit: StageCompleted (ResearchPackage)
┌────────────────────────────────────────────────────────┐
│ Stage 2: Editorial Draft Engine (Isolated Service)     │
│  - Input: ResearchPackage                              │
│  - Process: API /api/summarize                         │
│  - Output: EditorialDraft                              │
└────────────────────────────────────────────────────────┘
                  │
                  ▼ Emit: StageCompleted (EditorialDraft)
┌────────────────────────────────────────────────────────┐
│ Stage 3: Speech Preparation Engine (Isolated Service)  │
│  - Input: EditorialDraft                               │
│  - Process: Timeline Segments + Dictionary Mapping    │
│  - Output: SpeechTimeline                              │
└────────────────────────────────────────────────────────┘
                  │
                  ▼ Emit: StageCompleted (SpeechTimeline)
┌────────────────────────────────────────────────────────┐
│ Stage 4: Audio Generation Engine (Isolated Service)    │
│  - Input: SpeechTimeline                               │
│  - Process: Parallel TTS + Promise.allSettled         │
│  - Output: AudioAssembly (Master Buffer / Audio Chunks)│
└────────────────────────────────────────────────────────┘
```

---

## 3. Findings: System Pain Points

### 3.1 List of Broken Dependencies & Implicit UI Couplings
1. **Direct UI Component Leakage**: The UI (`MissionTabView.tsx`) allows inline modification of topics, introductions, and conclusions. When Stage 3 or 4 runs, the closure inside `handleGenerateBriefing` reads directly from hook states rather than an immutable output contract of Stage 2.
2. **Title Guessing logic**: The title of the briefing is parsed on the fly inside `handleGenerateBriefing` using regular expressions (`Article #1:` / `Bài báo #1:`) on raw user input. This should be explicitly set inside the `ResearchPackage` and `EditorialDraft` models.
3. **Voice Closure Race Conditions**: In `handleGenerateBriefing`, the effective voice is determined via a complex cascading check: `voiceOverride || preferences.voice`. If the user selects a voice in the UI and clicks generate, state propagation delay can cause a mismatch.
4. **Error Bubble Up**: If Stage 4 (synthesis) fails, the entire pipeline is reset to the `error` state. The user has to regenerate the Stage 2 narrative draft even though the text summary itself is perfectly valid and could be retried directly.

### 3.2 List of Duplicated States
1. **The Draft Representation**: The draft text is represented in:
   - `newsContent` (raw normalized string input)
   - `activePayload` (the JSON representation from Stage 2)
   - In-memory state of `MissionTabView` text areas.
2. **Voice & Settings State**: Tone, Emotion, Language Mode, and Voice selections are read from `preferences` during both Stage 2 (affecting summarization style) and Stage 4 (affecting speech generation parameters), creating hidden couplings.

---

## 4. Proposed Data Contracts & Interfaces

We will define these contracts inside `/src/types.ts` to ensure strict compile-time type safety.

```typescript
/**
 * Generic stage result wrapper reflecting loading, error, and success states
 */
export interface StageResult<T> {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: T | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

/**
 * Stage 1 Output / Stage 2 Input
 */
export interface ResearchPackage {
  id: string;
  missionId: string;
  articles: Array<{
    id: string;
    title: string;
    content: string;
    source?: string;
    publishedAt?: string;
  }>;
  aggregatedText: string;
  language: string;
  createdAt: string;
}

/**
 * Stage 2 Output / Stage 3 Input
 */
export interface EditorialDraft {
  id: string;
  missionId: string;
  language: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  hostProfile: {
    primaryVoice: string;
    cohostVoice?: string;
  };
  narrationStyle: string;
  createdAt: string;
  version: number;
}

/**
 * Central orchestrating context to coordinate resume, restart, and recovery operations
 */
export interface PipelineContext {
  pipelineId: string;
  missionId: string;
  currentStage: 1 | 2 | 3 | 4;
  stages: {
    stage1: StageResult<ResearchPackage>;
    stage2: StageResult<EditorialDraft>;
    stage3: StageResult<any>; // SpeechTimeline
    stage4: StageResult<any>; // AudioAssembly
  };
  synthesisWarning: string | null;
}
```

---

## 5. Detailed Migration Plan

To maintain absolute system stability, we will execute the migration sequentially:

### Phase 1: Define Type Contracts & Event Interfaces
- Declare the immutable pipeline entities (`StageResult`, `ResearchPackage`, `EditorialDraft`, `PipelineContext`) inside `/src/types.ts`.
- Run linter checks to verify contract integrity.

### Phase 2: Isolate Stage 2 Service Layer
- Move Stage 2 narrative summarization logic into a standalone function/class inside `/src/services/editorialService.ts`.
- Ensure it takes `ResearchPackage` as input and returns `EditorialDraft`.
- Make it completely isolated from React UI components or direct hook triggers.

### Phase 3: Update Orchestration and Context State
- Introduce `PipelineContext` inside `useBriefingGeneration.ts`.
- Refactor stage execution routines to read exclusively from the previous stage's result object.
- Provide resume and retry capabilities for each individual stage.

### Phase 4: UI Refactoring & Event Coupling
- Update the `MissionTabView.tsx` views to bind directly to `PipelineContext` properties.
- Remove redundant state variables from the parent component.
- Ensure the UI acts strictly as a visual reporter of stage outcomes.

---

## 6. Design Review & Verification (Quality Gate)
- Run `npm run lint` and `npm run build` after each phase.
- Perform a manual audit of the pipeline flow to guarantee zero regression on TTS or RSS parsing capabilities.
