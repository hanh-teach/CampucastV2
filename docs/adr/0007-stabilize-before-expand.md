# ADR 0007: Stabilize Before Expand (Pipeline Validation)

**Date:** 2026-07-02
**Status:** Accepted

## Context
The Normalization Pipeline (Epic 2) has been successfully implemented with a modular plugin architecture. The initial roadmap called for immediately expanding the number of data sources (Epic 3: Website, PDF, etc.). However, expanding sources before proving the stability and scalability of the pipeline risks creating cascading failures that are difficult to debug.

## Decision
We adopt the "Stabilize before Expand" principle. We insert a new Epic (Epic 2.5: Pipeline Validation & Observability) before Epic 3 (Source Expansion).

This new epic mandates:
1. **Pipeline Benchmark**: Measure RAM, CPU, Time, Score, and Duplicate % under varying loads (e.g., 10 to 10000 articles).
2. **Golden Dataset**: Maintain a repository of known valid inputs (e.g., `tests/golden-dataset/`) to run regression tests against every pipeline modification.
3. **Snapshot Tests**: Capture the JSON output of the pipeline to detect unintentional changes in the generated `NewsModel`.
4. **Pipeline Visualizer**: Build a developer tool to step through each stage of the pipeline, visualizing input, output, time, warnings, and fixes applied.
5. **Quality Dashboard**: Aggregate telemetry data into a dashboard tracking success rate, processing time, duplicate rate, quality score, and language distribution.

## Consequences
- **Pros:** Guarantees pipeline stability, performance, and correctness. Makes debugging future source connectors significantly easier because the pipeline itself is a proven quantity.
- **Cons:** Delays the introduction of new data sources by one epic.
- **Risks:** The effort to build validation tools must be timeboxed so it does not permanently stall product development.
