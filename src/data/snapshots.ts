import { SnapshotManifest, SnapshotLifecycleState } from "../types/snapshot";

export const KNOWLEDGE_SNAPSHOTS: SnapshotManifest[] = [
  {
    snapshot: {
      id: "Snap-2026.09.01",
      version: "4.23.0",
      parentId: "Snap-2026.08.15",
      createdAt: "2026-07-04T08:00:00Z"
    },
    product: {
      hypothesis: "We believe adjusting the Morning DJ Persona to greet users with direct local weather coordinates will increase Daily Return Rate by 5% because commute relevance is highest during first paint.",
      expectedImpact: {
        dailyReturnLift: 0.052,
        completionLift: 0.035,
        satisfactionLift: 0.04
      },
      targetKPIs: ["Daily Return Rate", "Session Completion Rate", "Average Listening Time"]
    },
    training: {
      dataset: "Commute-V4-Feed-Enrichments-Augmented",
      featureVersion: "2.1.0",
      trainerVersion: "1.14.2"
    },
    validation: {
      replayReport: "Passes 1,000 timeline simulation stress tests without drift. P0 foreign word pronunciation resolved.",
      benchmarkReport: "Mean timeline scheduling jitter: 0.85ms. Memory leak verification: PASS.",
      editorialScore: 9.4,
      runtimeCompatibility: true
    },
    governance: {
      approvedBy: "Chief Editorial Officer",
      approvalTime: "2026-07-04T12:00:00Z",
      rollout: "10% Canary Rollout",
      rollback: "Automatic roll-back trigger on telemetry anomaly score > 1.8"
    },
    lineage: {
      parentSnapshotId: "Snap-2026.08.15",
      derivedFrom: ["Dataset-Bilingual-Traffic-V4", "Taste-Feedback-S2"]
    },
    explainability: {
      topChangedPolicies: ["Traffic Urgency Weight", "Bilingual Segment Alternation Frequency"],
      topChangedWeights: {
        "local_news_urgency": 0.45,
        "global_news_diversity": -0.12
      },
      affectedPersonas: ["Morning DJ Show", "Traditional News"],
      affectedEditorialRules: ["Weather First", "bilingual_pacing_cohesion"],
      affectedRecommendationLogic: ["Urgency Scoring Matrix Boost"]
    },
    lifecycle: {
      state: SnapshotLifecycleState.PRODUCTION
    }
  },
  {
    snapshot: {
      id: "Snap-2026.08.15",
      version: "4.21.0",
      parentId: "Snap-2026.07.20",
      createdAt: "2026-07-03T09:30:00Z"
    },
    product: {
      hypothesis: "We believe resolving bilingual sentence structure splits at the paragraph level will increase conversational satisfaction and reduce session abandonments.",
      expectedImpact: {
        completionLift: 0.08,
        satisfactionLift: 0.06
      },
      targetKPIs: ["Completion Rate", "Cohesion Rating", "Dialogue Satisfaction"]
    },
    training: {
      dataset: "Linguistic-Bilingual-Segmentations-V3",
      featureVersion: "2.0.1",
      trainerVersion: "1.14.0"
    },
    validation: {
      replayReport: "Zero audio distortion gaps detected on bilingual transitions. Fade parameters calibrated to 10ms.",
      benchmarkReport: "Buffer prefetch load-latency reduced by 140ms.",
      editorialScore: 9.1,
      runtimeCompatibility: true
    },
    governance: {
      approvedBy: "Chief Product Officer",
      approvalTime: "2026-07-03T15:00:00Z",
      rollout: "100% General Production",
      rollback: "Manual intervention required"
    },
    lineage: {
      parentSnapshotId: "Snap-2026.07.20",
      derivedFrom: ["Linguistic-Split-Bilingual-Dataset"]
    },
    explainability: {
      topChangedPolicies: ["Sentence Segment Boundary Digital Fade"],
      topChangedWeights: {
        "bilingual_transition_crossfade_ms": 10
      },
      affectedPersonas: ["Traditional News", "Podcast Co-host"],
      affectedEditorialRules: ["Language Aware Grouping Block"],
      affectedRecommendationLogic: ["Segment Continuity Matrix Boost"]
    },
    lifecycle: {
      state: SnapshotLifecycleState.APPROVED
    }
  },
  {
    snapshot: {
      id: "Snap-2026.09.15-Canary",
      version: "4.24.0-Canary",
      parentId: "Snap-2026.09.01",
      createdAt: "2026-07-04T18:00:00Z"
    },
    product: {
      hypothesis: "We believe integrating direct calendar event interjections in conversational styles will increase user trust scores and daily retention metrics.",
      expectedImpact: {
        dailyReturnLift: 0.045,
        trustScoreLift: 0.075
      },
      targetKPIs: ["Daily Return Rate", "User Trust Telemetry Index"]
    },
    training: {
      dataset: "Ambient-Context-Cal-Traffic-Correlations",
      featureVersion: "3.0.0",
      trainerVersion: "2.0.0"
    },
    validation: {
      replayReport: "Passes initial timeline checks. Minor scheduling collision on multi-modal alerts handled by EventBus priority queues.",
      benchmarkReport: "Requires up to 8% more CPU overhead due to real-time calendar graph queries.",
      editorialScore: 8.8,
      runtimeCompatibility: true
    },
    governance: {
      approvedBy: "Lead Systems Architect",
      approvalTime: "2026-07-04T19:30:00Z",
      rollout: "5% Canary Release (Restricted Group)",
      rollback: "Automatic fallback to parent Snap-2026.09.01 if latency threshold exceeds 120ms"
    },
    lineage: {
      parentSnapshotId: "Snap-2026.09.01",
      derivedFrom: ["Dataset-Google-Workspace-Interactions-S1"]
    },
    explainability: {
      topChangedPolicies: ["Calendar Interrupt Privilege", "Real-Time Traffic Interjection Trigger"],
      topChangedWeights: {
        "ambient_interruption_threshold": 0.85
      },
      affectedPersonas: ["Podcast Co-host", "Witty Companion"],
      affectedEditorialRules: ["Ambient Alert Priority Hierarchy"],
      affectedRecommendationLogic: ["Real-time Context Overrides Block"]
    },
    lifecycle: {
      state: SnapshotLifecycleState.CANARY
    }
  }
];
