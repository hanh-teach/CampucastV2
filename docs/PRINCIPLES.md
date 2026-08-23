# Product Principles Registry (CommuteCast DNA)

This registry documents the immutable (or high-confidence) principles derived from evidence. These are the "Reusable Principles" that guide all future product and engineering decisions.

| Principle | First Proven | Last Verified | Confidence | Evidence Count | Scope | Invalidated By |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Visible progress is part of performance.** Perception of work is as critical as the work itself. | ERC-001 | 2026-07-03 | High | 2 | Long-running operations (>2s) | None |
| **Recovery wins Trust.** A failure that recovers gracefully can result in higher trust than a perfect session. | ERC-001 | 2026-07-03 | High | 1 | Operational errors during playback or generation | None |
| **Perception beats Precision.** Visual feedback is a stronger trust indicator than raw latency numbers. | ERC-002 | 2026-07-03 | Medium | 1 | Audio stream start indicators | None |
| **Observable Runtime is the prerequisite for trust.** Visibility into the process keeps users engaged. | ERC-001 | 2026-07-03 | High | 2 | Backend feed generation | None |
| **D1 Retention is the ultimate validator.** It is the only metric that confirms "Reliability Perception". | ERC-002 | 2026-07-03 | Medium | 1 | Continuous user feedback loops | None |
| **Evidence explains what happened. Stories explain why.** Never confuse the two. Telemetry shows when, where, and what, but does not self-explain. Always separate objective telemetry from hypotheses. | ERC-003 | 2026-07-03 | High | 1 | Product Decision Records (PDR) | Confirmation bias or interpretation without multiple hypotheses |
| **Operator Learning Principle.** Every complex system capability must be learned through direct interactive in-product situation scenarios. | Platform-002A | 2026-07-05 | High | 1 | Onboarding and educational widgets | None |

## Knowledge Maturity Scale
- **Low**: Hypothesis supported by limited evidence or single-user dogfooding.
- **Medium**: Supported by multiple sessions across different network conditions.
- **High**: Supported by diverse user behavior, temporal depth, and reproducible patterns.
