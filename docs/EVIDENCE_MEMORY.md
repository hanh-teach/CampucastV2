# CommuteCast Evidence Memory

This file documents the core lessons learned from experiments, ensuring that each Evidence Review Cycle (ERC) builds institutional knowledge.

## Product Principles (The DNA Registry)
See [PRINCIPLES.md](/PRINCIPLES.md) for the high-confidence registry and knowledge maturity scale.

## Core Learning Loop
`Observe` ↓ `Understand` ↓ `Decide` ↓ `Ship` ↓ `Measure` ↓ `Learn`

---

## [ERC-001] Progressive UX & Observability
- **Status**: ✅ ACCEPTED
- **Question**: How can we reduce perceived latency without actually changing network performance?
- **Hypothesis**: Progressive UI transitions and skeletal loaders will reduce user frustration during long RSS/AI fetches.
- **Evidence**:
    - TTFF/TTFP stabilized at ~2s/4s.
    - Rage Taps decreased to <1%.
    - Confidence Recovery Rate reached 90%+.
- **Decision**: Implemented Progressive Rendering and real-time Telemetry.
- **Lesson Learned**: **Observable Runtime** is the prerequisite for trust. Even if the backend is slow, visibility into the process keeps users engaged.
- **Generalizability**: ✅ **HIGH**. Applies to RSS, AI Generation, Audio Synthesis, and File Synchronization modules.

---

## [ERC-002] Human Perception & Learning Velocity
- **Status**: ▶ IN PROGRESS (Observation)
- **Question**: Does the user actually *perceive* the app as frozen during silent gaps?
- **Hypothesis**: Subjective "Perceived Freeze Rate" (PFR) is a more accurate KPI for UX success than objective TTFF.
- **Experiment**: MUPS-002.1 Evidence Instrument (Perception Survey + Cause Analysis).
- **Evidence**: Captured first responses identifying "No Motion" as the primary freeze indicator.
- **Decision**: CONTINUE OBSERVATION. Focus on building "Learning Runtime".
- **Institutional Learning**:
    - *What surprised us?*: That visual feedback (motion) was a stronger trust indicator than audio start time.
    - *What became more certain?*: That behavioral retention (D1) is the only metric that confirms "Reliability Perception".
    - *What should never be repeated?*: Adding engineering features to fix perception issues without survey evidence.
    - *Reusable Principle*: **Visible progress is part of performance.** Perception of work is as critical as the work itself.
- **Generalizability**: ✅ **HIGH**. Applies to all asynchronous operations and loading states.

---

## [ERC-003] User Abandonment Research
- **Status**: 🟢 IN PROGRESS (Data Collection)
- **Question**: Among sessions with <50% completion, what single factor explains ≥60% of abandonments?
- **Pre-registered Hypothesis**: We believe **Relevance** will be the dominant cause (user abandonments primarily driven by opening content not matching expectations).
- **Locked Taxonomy**: `Network` | `Audio` | `Relevance` | `UX` | `Interruptions` | `External`
- **Classification Coding Rules**:
    - **Network**: RSS timeout, fetch retry, offline, DNS failure, packet loss.
    - **Audio**: Decode failure, playback error, autoplay blocked, volume zero.
    - **UX**: Exiting while the system is working normally but without visual indicators/engagement.
    - **Relevance**: Briefing starts but user abandons despite zero technical errors.
    - **Interruptions**: Phone call, navigation audio overlap, OS interruption.
    - **External**: Manual close, screen lock, commute ended, physical intervention.
- **Handling Unknown Rule**: If evidence is insufficient to reliably categorize a session, it must be marked as **Unknown** in internal analysis to avoid classification bias.
- **Technical Prerequisite (v3.2.16-RC)**: The "Broadcast Grade" TTS Pipeline (Normalization, Acronyms, Artifact Cleaning) must be active to ensure "Audio Artifacts" are not the primary cause of abandonment during the Relevance study.
- **ERC-003 Result (2026-07-03)**: Multi-block delivery and header-based client routing eliminated "rain noise/xì" artifacts. Audio quality verified as "High Fidelity" in field tests.
- **Decision Thresholds**:
    - **≥60%**: Dominant Cause (Action: Ship change)
    - **40–59%**: Strong Candidate (Action: Research Again)
    - **<40%**: No Dominant Cause (Action: No Product Change)
- **Minimum Sample Size**: `≥20` initial sessions with device and network diversity.
- **Permitted Outcomes**: `Ship` | `Research Again` | `No Product Change`
- **7-Criteria PDR Quality Checklist**:
    1. Research Question is clearly answered.
    2. Evidence is fully provided (objective telemetry and session logs).
    3. Interpretation is strictly separated from evidence.
    4. Alternative explanations are systematically considered.
    5. Exactly one primary Decision is reached.
    6. Expected Impact is estimated quantitatively.
    7. Verification Plan is explicitly detailed for the next cycle.

---

## [ERC-004] Product Intelligence & Narrative Flow
- **Status**: ✅ ACCEPTED
- **Question**: Can we increase "Perceived Relevance" by grouping related news instead of showing a random list?
- **Hypothesis**: Moving from list-based to story-based (Lead/Supporting) architecture will increase session completion.
- **Evidence**:
    - Internal validation: Story clusters reduce content redundancy by 40%.
    - Test suites for `StoryIntelligenceEngine` confirm accurate role assignment.
- **Decision**: Implemented `StoryIntelligencePlatform` and `RecommendationEngine` (ADR-018, ADR-019).
- **Lesson Learned**: **Contextual narrative beats raw sorting.** Users value the *connection* between news items as much as the items themselves.
- **Generalizability**: ✅ **HIGH**. Applies to all news-delivery and information-synthesis modules.

---

## Knowledge Base: Evidence-Decision Correlation

| Perceived Cause | Technical Reality | Recommended Fix |
| :--- | :--- | :--- |
| "No Motion" | RSS Fetching (>3s) | Enhanced Skeleton Loaders |
| "No Audio" | TTS Buffer Delay | Pre-fetching first 100ms of audio |
| "Slow Network" | API Handshake | Connection Pooling / Edge Proxies |
| "Unknown" | UI Thread Block | Web Worker for Parser |
