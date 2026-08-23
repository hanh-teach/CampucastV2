export enum SnapshotLifecycleState {
  DRAFT = "DRAFT",
  TRAINED = "TRAINED",
  VALIDATED = "VALIDATED",
  APPROVED = "APPROVED",
  CANARY = "CANARY",
  PRODUCTION = "PRODUCTION",
  ARCHIVED = "ARCHIVED",
}

export interface SnapshotManifest {
  snapshot: {
    id: string;
    version: string;
    parentId?: string;
    createdAt: string;
  };
  product: {
    hypothesis: string; // The "We believe... because... Success means..." contract
    expectedImpact: Record<string, number>; // e.g., { completionLift: 0.05 }
    targetKPIs: string[];
  };
  training: {
    dataset: string;
    featureVersion: string;
    trainerVersion: string;
  };
  validation: {
    replayReport: string;
    benchmarkReport: string;
    editorialScore: number;
    runtimeCompatibility: boolean;
  };
  governance: {
    approvedBy: string;
    approvalTime: string;
    rollout: string; // e.g., "10% canary"
    rollback: string; // e.g., "automatic"
  };
  lineage: {
    parentSnapshotId?: string;
    derivedFrom: string[]; // List of snapshot IDs or dataset versions
  };
  explainability: {
    topChangedPolicies: string[];
    topChangedWeights: Record<string, number>;
    affectedPersonas: string[];
    affectedEditorialRules: string[];
    affectedRecommendationLogic: string[];
  };
  lifecycle: {
    state: SnapshotLifecycleState;
  };
}

export interface SnapshotLineageGraphNode {
  snapshotId: string;
  parentSnapshotIds: string[];
  childSnapshotIds: string[];
}
