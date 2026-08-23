export interface EditorialScore {
  readonly storyFlow: number;
  readonly transitionQuality: number;
  readonly narrativeArc: number;
  readonly emotionalContinuity: number;
  readonly total: number;
}

export interface TasteLift {
  readonly completionRateWithoutTaste: number;
  readonly completionRateWithTaste: number;
  readonly lift: number;
}

export interface SessionScore {
  readonly editorial: EditorialScore;
  readonly taste: TasteLift;
  readonly conversationQuality: number;
  readonly runtimeMetrics: {
    readonly latency: number;
    readonly continuityStability: number;
  };
  readonly overall: number;
}

export interface EvaluationReport {
  readonly sessionId: string;
  readonly timestamp: Date;
  readonly scores: SessionScore;
}
