## Product Strategy: CommuteCast

## Identity
CommuteCast is a **Mission Confidence Platform** for AI Broadcast production. We transform raw information into professional audio experiences through a deterministic, resilient workflow where every production step is a **Mission**—a unit of work that can be resumed, tracked, explained, and completed with 100% accuracy. The platform prioritizes proactive predictability: determining whether a mission *can* succeed before execution begins, rather than reacting to failures post-run.

## Core Pillars
- **Mission Confidence & Continuity**: Guarantee that an operator knows the system's execution capability and can resume work at any time.
- **Broadcast Studio Grade**: High-fidelity audio synthesis, segment-based delivery, and professional editorial intelligence.
- **AI-Agent Ready**: A platform designed for both humans and AI agents to collaborate on content production.

## Learning Platform Principles (Era 4.0: Mission Continuity Focus)
- **Measure Less, Learn More**: Every metric must drive a decision. If a metric hasn't changed a product decision in 6 months, it is retired.
- **Framework Growth ≤ Evidence Growth**: Governance complexity must not increase faster than actionable evidence.
- **Decision Density**: Every artifact must justify its existence. Artifacts with zero impact on decisions are pruned.
- **Portfolio Value**: Success is measured by the percentage of product decisions that remain valid over time.
- **Portfolio Health**: Measured by the ratio of `Questions Answered / Questions Asked`.
- **Evidence Budget**: Max 1 research question, ≤3 primary KPIs, ≤1 dashboard change per sprint.
- **Research Exit Rule**: No new ERCs may be opened until the current one yields a Decision Record and a Reusable Principle.
- **Governance Freeze Constitutional Rule**: The governance system is completely frozen. No further meta-frameworks, tools, rules, or committees may be introduced unless backed by multiple research cycles proving an absolute blocker that cannot be resolved via product/UX changes.
- **Intelligence Debt**: Prune metrics and telemetry that no longer drive decisions.
- **Institutional Learning**: Every ERC must answer: *What surprised us?*, *What became more certain?*, *What should never be repeated?*, and *What is the Reusable Principle?*
- **Scientific Governance**: Decisions follow the `Observe → Understand → Decide → Ship → Measure → Learn` intelligence loop.

## Product Intelligence Maturity
1. **Build**: App exists and works.
2. **Stabilize**: Reliable and performant.
3. **Observe**: Visibility into what happens.
4. **Understand**: Knowing *why* things happen.
5. **Improve**: Evidence-driven changes (Current Stage: Sprint #012 Recommendation Engine).
6. **Compound**: Systematic learning flywheel.

## Decision Confidence Matrix
Each ERC evaluates the strength of evidence gathered to determine the appropriate product action and confidence tier:

| Evidence Strength | Decision Confidence | Action | Outcome |
| :--- | :--- | :--- | :--- |
| **Weak** | Low | Continue Observation | No action, keep monitoring |
| **Moderate** | Medium | Small Experiment | Limited rollout / A/B validation |
| **Strong** | High | Ship Change | Full production update |
| **Strong** | High + Repeated | Promote to Principle | Added to `PRINCIPLES.md` |

## Permanent Freeze List (Zero Meta-Work Boundary)
To maintain strict focus on user-facing value and product learning over administrative scaffolding, the following elements are permanently frozen:
1. **Telemetry schema** — Stable, no further instrumentation expansion.
2. **Dashboard framework** — Current observation deck is fully sufficient.
3. **Governance workflows** — No new protocols, rules, or committees.
4. **Product Constitution** — Locked at v1.0.
5. **Research Portfolio structure** — Active/Planned/Backlog taxonomy is final.
6. **Evidence templates & Principle Registry** — Layout and table schemas are locked.

## North Star Metric
- **Historical Success**: The percentage of historical production missions that reached a "Completed" state.
    - *Target*: >96%
- **Mission Confidence KPI**: Proactive indicator calculating system viability before mission execution.
  Calculated dynamically using the **MCI Version 2** formula:
  $$\text{Mission Confidence} = \text{Platform} \times \text{Capability} \times \text{Historical Reliability} \times \text{Current Recovery State} \times \text{Mission Complexity}$$
  - **Platform Health**: Real-time checking of core RSS feeds, Gemini AI APIs, Voice TTS, local storage, and gateway connectivity.
  - **Capability Readiness**: Validation of active operator capabilities, device permissions (microphone, local storage), and schema integrations.
  - **Historical Reliability**: Evaluation of operational completion rates across recent previous missions.
  - **Current Recovery State**: Automatic failover, active self-healing status, and connection retry cycles.
  - **Mission Complexity**: Analysis of script requirements (e.g., bilingual translation depth, fact-checking, custom host instructions) relative to platform capacity.
    - *Target*: >97%
- **Mission Resume Accuracy**: The percentage of sessions restored to the exact correct state.
    - *Target*: 100%

## Weekly Product Memo
A concise one-page summary focusing on:
1. **Question investigated**
2. **What we learned & what surprised us**
3. **Decision made & Decision intentionally NOT made**
4. **Next question**

## ERC 5-Question Evaluation Rubric
Every research cycle must address exactly five questions to guide product actions:
1. **Question** — What are we trying to answer? (Must be quantitative/falsifiable).
2. **Evidence** — What does the real-world user data say?
3. **Decision** — What is the specific product action (or "No Change" verdict)?
4. **Expected Impact** — Which KPI do we expect to change, and by how much?
5. **Verification Plan** — How will we measure if the decision was correct?

## Strategic Organizational Metrics (Era 4.0)
We evaluate organization health and learning velocity using three primary metrics:
1. **Decision Quality** — % of product decisions directly supported by high-confidence evidence.
2. **Learning Velocity** — The average calendar days to go from Research Question to Product Decision.
3. **Decision Accuracy** — % of shipped decisions that achieve their Expected Impact KPI.

## Core Product KPIs (The "Top 7" & Editorial Host metrics)
1. **D1 Retention**: Do users return within 24 hours of a session? (The ultimate survival metric).
2. **Historical Success**: % of audio briefings heard to completion by returning users (North Star).
3. **Mission Resume Accuracy**: 100% target for state restoration.
4. **Story Continuity**: Rate of seamless transitions and logical sequencing (>95% target).
5. **Context Recall Accuracy**: High accuracy in remembering historic topics and previous discussions (>90% target).
6. **Recommendation Acceptance**: Rate of relevant selections tailored to user context (+20% target).
7. **Average Listening Time**: Average session duration per user (+15% target).
8. **Daily Return Rate / Return Rate**: The percentage of listeners returning daily (+20% target).
9. **Story Diversity**: Topic and style richness score (>0.85 target).
10. **Repetition Rate**: Deduplication and fresh story curation guarantee (<5% target).

## Mission Platform Baseline (Phase A - Platform Engineering)
CommuteCast is currently in a **Platform Freeze** state. No new user-facing features or AI capabilities are being added until the Mission Core infrastructure is certified:
1. **Mission Lifecycle Specification**: Formalized state transitions (`Running`, `Waiting`, `Blocked`, `Paused`).
2. **Mission Repository**: The single, immutable Source of Truth for all production state.
3. **Mission Snapshot Engine**: Git-like snapshotting for 100% Resume Accuracy and rapid restoration.
4. **Mission Query Layer**: Standardized access patterns (`find`, `list`, `search`) for all consumers.
5. **Mission Timeline Builder**: Domain-level logic for constructing explainable production histories.
6. **Mission Event Contract**: Formalized communication schemas between all Producers and Consumers.

## Editorial Intelligence Platform (Editorial AI Era)
With the technical core of the Runtime fully certified and frozen, the strategic focus transitions to the **Editorial AI Era**. The central brain comprises specialized AI modules to ensure CommuteCast feels like a premium broadcast companion rather than a neutral news-reader:

1. **Editorial Planner**: Determines overarching session goals, duration, structure, and pacing based on user context before content is curated.
2. **Editorial Brain**: 
   - **Editorial Intent Engine**: Frames the same story differently based on intent (e.g., "A huge breakthrough..." vs. "If you thought AI was smart...").
   - **Curiosity Engine**: Evaluates story metadata to calculate a dynamic `Curiosity Score`.
   - **Emotion Arc Engine**: Outlines a balanced dramatic wave for the session.
   - **Narrative Arc Engine**: Coordinates story role definitions (Hook, Evidence, Analysis).
   - **Surprise Engine**: Introduces unexpected content and trivia hooks.
   - **Memory Recall Engine**: Recalls historical discussions to weave contextual threads.
3. **Persona Platform**: Defines the Editorial Identity including vocabulary, sentence rhythm, transition habits, humor, curiosity, confidence, opinion tendency, catchphrases, speaking speed, and editorial bias.
4. **Broadcast Director**: Acts as the Executive Producer to arrange the show (Opening, Hook, Music, Lead Story, Secondary Story, Break, Transition, Reflection, Closing).
5. **Taste Graph**: Maps complex multi-dimensional user contexts (User + Topic + Time + Commute Length + Host + Emotion + Weather + Day).
6. **Conversational Host & Companion Memory**: Supports seamless interactive dialogues and long-term retention of user preferences, recurring interests, and personal milestones.

## Product Constitution v4.0

### Operating Philosophy: Mission Confidence Platform
- CommuteCast is strictly governed by "Mission Confidence", "Mission Continuity", and "Operator Learning" principles.
- **Core Principles**:
  - **Predictive Success (Confidence)**: Before starting a mission, the platform calculates its confidence index to assure high-probability of completion.
  - **Mission Confidence Principle**: Every operator decision should be supported by a measurable confidence signal.
    - *Before Creating*: A proactive Platform readiness indicator calculates if Gemini AI APIs, Voice TTS engines, and RSS source connectors are fully available.
    - *Before Publishing*: Confirms cloud GCS/Supabase storage quotas, connection health, and session payload correctness.
    - *Before Resuming*: Evaluates session index integrity, database replication, and script restorability.
    - *Before Retry*: Inspects real-time gateway latency and connection handshake status before trying again.
  - **Operator Learning Principle**: Every new capability must be discoverable through guided interaction instead of external documentation.
    - Users learn to operate complex predictive systems by doing, supported by in-context practice sandboxes, real scenarios, and AI-assisted "Confidence Coaching" rather than static guides or external wikis.
  - **Mission Academy Framework**: A progressive learning path that guides operators from novice to automated system experts:
    - *Level 1 (Foundation)*: Interactive Mission Confidence and risk factors comprehension.
    - *Level 2 (Scenarios)*: Situational practice simulating typical degraded states (e.g., RSS offline, voice timeouts) and learning optimal recovery actions.
    - *Level 3 (Sandbox)*: Non-destructive staging environments to test complex prompt custom templates without resource waste.
    - *Level 4 (Confidence Coach & Automation)*: Proactive advisory agents suggesting routing optimizations, unlocking advanced operational automation once certified.
  - **Resume First**: Every session begins by picking up exactly where the user left off.
  - **Task-Oriented Workstations**: Only 4 core workstations: Home (Continue Working), Create (Studio Desk), Library (All Media Manager), and Settings (Admin).
  - **Mission Immutability**: All significant transitions must be recorded as immutable events in Mission history.
  - **Zero-Recall UX**: The system must always know where the user's content and jobs are, never requiring user recall.
  - **UI as Observer**: UI emits events but never modifies Mission state directly.

1. **User behavior beats opinions.**
2. **One question per sprint.**
3. **One meaningful decision per ERC.**
4. **No evidence, no roadmap changes.**
5. **Delete artifacts that don't improve decisions.**
6. **Protect the Foundation and Governance Freeze.**
7. **Optimize retention before expansion.**
8. **Institutional learning is a deliverable.**
9. **A rejected hypothesis is progress, not failure.**
10. **If users succeed without thinking, the platform succeeds.**
11. **CommuteCast competes on storytelling and editorial companionship, not reading raw feeds.**

## Product Knowledge Graph
We map system evolution through causal linkages:
`Problem` → `Hypothesis` → `Experiment` → `Evidence` → `Decision` → `Principle` → `Capabilities` → `KPI`

## Target Audience
- Daily commuters, active learners, and professionals seeking efficient, high-quality information consumption.

## Business Goals
- Achieve enterprise-grade stability, scalability, and performance in AI-driven audio synthesis.
- Maintain a strictly professional, high-performance software architecture.
- **Learning Velocity**: Maximize the rate of validated learning cycles per month.

## Intelligent Driving Assistant & Privacy Controls

- **External Playback Controls**: Full integration with the browser's Media Session API for hardware-level control (Steering wheel, Bluetooth, Lock screen).

### Auto-suggest Driving Mode (Prompt A4)
To enhance safety and convenience for daily commuters, CommuteCast incorporates intelligent motion detection. By tracking speed patterns over time, the platform proactively suggests enabling the specialized **Driving HUD** mode without requiring direct user initiation during transit.

- **Intelligent Motion Analysis**: Utilizes low-power GPS `navigator.geolocation.watchPosition` to analyze movement speed. Rather than immediate triggers, a confirmation prompt is displayed only when speeds exceed **15 km/h sustained continuously for more than 30 seconds**.
- **Privacy First (Purely Client-Side)**: To guarantee complete user privacy, all geolocation tracking and speed calculations are processed **strictly locally on the client browser**. No location coordinates, paths, or speed data are ever transmitted to any external servers or stored permanently.
- **Strict Opt-In Control**: The feature defaults to **OFF** and operates as a strict opt-in. Geolocation tracking is never initialized, and device permissions are never requested unless the user explicitly toggles on the "Tự động gợi ý Chế độ lái xe" (Auto-suggest Driving Mode) setting in the Driving Assistant preferences panel.


