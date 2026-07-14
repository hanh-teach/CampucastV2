# Mission Intelligence - Low-Fidelity Wireframe

This wireframe details the structural layout of the Mission Intelligence workspace based on the 3 Cognitive Layers: Situation, Understanding, and Action.

---

## Workspace Layout Overview

```text
[ MissionCommandBar ] - Title: Mission Intelligence, Status: Ready

+-----------------------------------------------------------------------------------+
|  [Layer 1: Situation] MISSION SUMMARY (Top Banner)                                |
|                                                                                   |
|  [ 96/100 ] Mission Score    |  Mission: Morning News        |  Assets: 6         |
|  [ Healthy ] Status          |  Duration: 4m 32s             |  Actions: 14 AI    |
|                                                                                   |
+-----------------------------------------------------------------------------------+
|  [Layer 2: Understanding]                                                         |
|                                                                                   |
|  +---------------------------+  +----------------------------------------------+  |
|  | AI INSIGHTS (Analyst)     |  | MISSION STORY & PRODUCTION GRAPH             |  |
|  | ------------------------- |  | -------------------------------------------- |  |
|  | - Voice Render: 62% time  |  | [Phase: Acquire]                             |  |
|  | - RSS: 24% faster         |  |   O RSS Loaded                               |  |
|  | - Risk: Low               |  |                                              |  |
|  | - Reusable: Yes           |  | [Phase: Create]                              |  |
|  |                           |  |   O Script Generated                         |  |
|  | [Assistant Modes]         |  |   ├── [AI: Gemini Rewrite]                   |  |
|  | (Explain) (Compare)       |  |   └── Script v2 (Operator Approved)          |  |
|  | (Recommend)               |  |                                              |  |
|  +---------------------------+  | [Phase: Produce]                             |  |
|                                 |   O Voice Rendered                           |  |
|  +---------------------------+  |                                              |  |
|  | [Layer 3: Action]         |  | [Phase: Publish]                             |  |
|  | SUGGESTED ACTIONS         |  |   O Podcast Published                        |  |
|  | ------------------------- |  +----------------------------------------------+  |
|  | [ > Interactive Replay ]  |                                                    |
|  | [ + Reuse Workflow ]      |                                                    |
|  | [ = Compare Mission ]     |                                                    |
|  +---------------------------+                                                    |
+-----------------------------------------------------------------------------------+
```

## Cognitive Flow Analysis

1. **< 10 seconds:** The Operator lands on the page, sees **96/100 Healthy** in the top banner. They immediately know the mission was successful and efficient.
2. **10 - 20 seconds:** The Operator glances at **AI Insights**. They see that Voice Render took the most time, but overall it was faster than average and is highly reusable.
3. **20 - 45 seconds:** The Operator scans the **Mission Story / Production Graph**. They clearly see the workflow phases: Acquire -> Create -> Produce -> Publish. They notice the `[AI: Gemini Rewrite]` node, understanding exactly where AI intervened.
4. **45 - 60 seconds:** Understanding is complete. The Operator looks at the **Suggested Actions** and clicks `[ + Reuse Workflow ]` to replicate this successful run.

Total Comprehension & Action Time: **< 60 seconds**.
