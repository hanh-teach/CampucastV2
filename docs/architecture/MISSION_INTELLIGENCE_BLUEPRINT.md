# Mission Intelligence Blueprint (UX-102D)

**Status:** IN PROGRESS (Design Phase)
**Objective:** Define the architecture and UX models for the "Mission Intelligence" Workspace (formerly History) before writing any code.

## 1. Core Philosophy

The Mission Intelligence Workspace exists to answer one central question:
**"How did this Mission unfold?"**

It is not a log viewer. It is an Operational Intelligence tool designed for:
1. **Root Cause Analysis:** Investigating why a Mission failed.
2. **Reusability:** Understanding a successful Mission to replicate its workflow.
3. **Auditing:** Reviewing AI actions vs. Operator actions.
4. **Learning:** Discovering the best workflows (Golden Path).
5. **Knowledge Generation:** Turning execution data into actionable operational knowledge.

The UX is structured around **3 Cognitive Layers**:
*   **Layer 1: Situation** - Instant understanding of what happened (Mission Score, Summary).
*   **Layer 2: Understanding** - Why it happened (AI Insights, Mission Story, Production Graph).
*   **Layer 3: Action** - What to do next (Suggested Actions, Replay, Compare).

## 2. Core Modules (The 8 Pillars)

### ① Mission Summary (First View)
The workspace must NOT open directly to a chronological timeline. The default view is the **Mission Summary** which provides an instant high-level overview.

*   **Mission Score:** An aggregate health metric (e.g., 96/100) based on duration, errors, AI/Operator efficiency, and recovery.
*   **Key Data Points:**
    *   Mission Name (e.g., "Morning News")
    *   Result/Status (e.g., "Completed 98%", "Published", "Healthy")
    *   Total Duration (e.g., "4m 12s")
    *   Asset Count (e.g., "6 Assets created")
    *   Action Breakdown (e.g., "14 AI Actions", "5 Operator Actions")
    *   Warnings/Anomalies (e.g., "1 Warning")

### ② AI Insights (Understanding)
Instead of forcing the user to analyze logs, AI automatically generates operational insights.

*   **Functionality:** Generates insights without prompting (e.g., "Voice Generation took 62% of total time", "RSS Parsing was 24% faster than average", "Operator only edited 2 sentences", "Workflow highly reusable").

### ③ Smart Mission Story
When diving into details, the event flow must not be a flat list of 100+ events. It is presented as a **Mission Story** using semantic grouping and natural language, organized by **Mission Phases**.

*   **Phase Clustering:**
    *   **Acquire:** RSS -> Events
    *   **Create:** Script -> Events
    *   **Produce:** Voice -> Events
    *   **Publish:** Podcast -> Events
*   **Narrative Flow:** Instead of logs, display natural language stories (e.g., "RSS Loaded", "AI summarized", "Operator approved", "Voice rendered").

### ④ Production Graph (Asset & AI Lineage)
Displays the hierarchical and causal relationship between the Mission, its Assets, and **AI interventions**.

*   **Structure:**
    ```
    Mission
    ├── RSS Feed
    ├── Script
    │      ├── Gemini (AI Rewrite)
    │      └── Script v2.0 (Approved)
    ├── Voice Track
    ├── Episode Thumbnail
    └── Podcast (Published)
    ```
*   **Purpose:** Provides complete traceability (Root Cause analysis) and verifies exactly where AI intervened vs. Operator actions.

### ⑤ Suggested Actions (Action)
Intelligence must lead to action. Based on the mission's outcome, surface context-aware actions.

*   **Functionality:** "Reuse Workflow", "Compare Mission", "Export Report", "Interactive Replay".

### ⑥ Interactive Replay
A visual, interactive playback of the Mission's execution.

*   **Functionality:** Operator clicks "Play", and the story/graph automatically runs through the phases.
*   **Interactivity:** Users can click on specific timeline nodes during replay to inspect the asset state exactly at that moment.

### ⑦ AI-Generated Root Cause
An isolated view designed specifically for troubleshooting failures, powered by AI.

*   **Functionality:** Instead of manual investigation, AI automatically diagnoses the failure and suggests the root cause and impact (e.g., "Failure -> Gemini Timeout -> Retry 2 times -> Recovered -> Delay +42s").
*   **KPI:** **Root Cause Time** (< 60 seconds to identify why a Mission failed).

### ⑧ Mission Intelligence Assistant (AI Analyst)
An automated AI analyst with three distinct modes (Not a generic chatbot).

*   **Explain Mode:** "Why was this mission slow?"
*   **Compare Mode:** "How does this compare to yesterday's mission?"
*   **Recommend Mode:** "What should be improved in the next mission?"

## 3. Key Performance Indicators (KPIs)

*   **Mission Comprehension Time:** Time to understand Mission Status and Score. **Target: < 10s.**
*   **Root Cause Time (RCT):** Time taken for an Operator to identify the cause of a Mission failure. **Target: < 60s.**
*   **Mission Replay Time (MRT):** Time taken to fully comprehend a completed Mission workflow. **Target: < 3m.**

## 4. Next Steps & Approval

Before implementation begins, this Blueprint must undergo the following phases:
1. **Wireframe Generation**
2. **UX Review**
3. **RC Design Freeze**
4. **Implementation**

This ensures the Mission Intelligence workspace is thoroughly designed and verified as the core operational knowledge generator before codebase changes occur.
