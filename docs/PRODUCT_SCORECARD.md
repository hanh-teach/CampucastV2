# CommuteCast Product Scorecard
Version: 1.0.0
Status: **ACTIVE** 📊

This scorecard maps every product capability in CommuteCast to objective, user-centric **Product KPIs**. All future feature enhancements (EPICs) must justify their existence by moving these target metrics.

---

## 📈 Strategic Product Performance Matrix

| Product Domain | Capability Module | Core Product KPI | Baseline | Current | Target | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Recommendation** | Taste Intelligence | **Recommendation Acceptance Rate** | 12% | 18% | 25% | 🟡 |
| **Editorial Brain** | Narrative Composer | **Story Continuity Score** | 92% | 96% | 98% | 🟢 |
| **Persona Platform** | Host Voice Engine | **Subjective Host Satisfaction** | 3.8/5 | 4.4/5 | 4.7/5 | 🟡 |
| **Broadcast Director** | Execution Manifest | **Daily Session Completion Rate** | 68% | 82% | 85% | 🟢 |
| **Conversational Host** | Interjection Orchestrator | **Explainer Engagement Rate** | 45% | 62% | 75% | 🟡 |
| **Evaluation Layer** | Scoring & Statistics | **Score Prediction Stability** | 88% | 96% | 95% | 🟢 |
| **Offline Learning** | Model Registry | **Validation Fail / Rollback Rate** | N/A | 0% | < 2% | 🟢 |
| **System Evolution** | Knowledge Platform | **Learning Velocity** | N/A | 14 days | < 7 days | 🟡 |
| **Operator Experience**| Workspace Context | **Decision Velocity** | N/A | >10s | < 2s | 🟡 |

*Status Guide: 🟢 Meeting Target, 🟡 Near Target / Under Optimization, 🔴 At Risk.*

---

## 🎯 Metric Definitions & Data Sources

### 1. Recommendation Acceptance Rate
*   *Definition*: The percentage of recommended stories that are listened to completely without being skipped.
*   *Formula*: `(Completed Recommended Stories / Total Recommended Stories Served) * 100`
*   *Data Source*: Ingested by `TasteLiftAnalyzer` from playback history logs.

### 2. Story Continuity Score
*   *Definition*: Programmatic rating of narrative, emotional, and context transition coherence between sequential beats.
*   *Formula*: Scored based on topical proximity and transition appropriateness.
*   *Data Source*: Evaluated by `EditorialScorer` using the `EditorialScore` schema.

### 3. Subjective Host Satisfaction
*   *Definition*: Listener feedback score regarding host tone, vocabulary appropriateness, and conversational flow.
*   *Formula*: Aggregate average of user-facing feedback metrics (e.g., thumb-up/down or score ratings).
*   *Data Source*: Stored in the Context and Personalization history tables.

### 4. Daily Session Completion Rate
*   *Definition*: Percentage of planned briefings that are played from the opening sequence to the final closing signature beat.
*   *Formula*: `(Successfully Completed Sessions / Total Sessions Started) * 100`
*   *Data Source*: Tracked by the `SessionAnalyzer`.

### 5. Explainer Engagement Rate
*   *Definition*: The ratio of triggered conversational explanations ("explain this story") where the user listens to the entire 30-second interjection rather than skipping or interrupting the stream.
*   *Formula*: `(Completed Dialogue Beats / Total Dialogue Beats Triggered) * 100`
*   *Data Source*: Compiled by the `ConversationAnalyzer`.

### 6. Learning Velocity
*   *Definition*: The average duration required to complete a full learning cycle from formulation of product hypothesis to final deployment or rejection of a Knowledge Snapshot.
*   *Formula*: `Sum(Time(Decision) - Time(Hypothesis)) / Count(Snapshots)`
*   *Data Source*: Tracked via the Snapshot Registry lifecycle log.

---

## 🛠️ Performance-Driven Development Cycle

To prevent feature bloat and preserve the core platform boundaries, all teams must apply the following workflow:

```
  ┌──────────────────────────┐
  │   Propose Capability     │
  └─────────────┬────────────┘
                ▼
  ┌──────────────────────────┐
  │ Identify Scorecard KPI   │
  └─────────────┬────────────┘
                ▼
  ┌──────────────────────────┐
  │  Develop in Sandbox /    │
  │     Offline Epoch        │
  └─────────────┬────────────┘
                ▼
  ┌──────────────────────────┐
  │ Run Validation & Replay  │
  └─────────────┬────────────┘
                ▼
  ┌──────────────────────────┐
  │ Check Target Lift (YES)  │──(NO)──► [Reject / Refine]
  └─────────────┬────────────┘
                ▼
  ┌──────────────────────────┐
  │   Publish to Registry    │
  └──────────────────────────┘
```
