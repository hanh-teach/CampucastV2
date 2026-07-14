# Archived Unwired v4 Architecture Reference

This directory serves as a documentation marker and historical reference for the unwired v4 architectural experiment.

## 📂 Subsystem Real-World Status
- **`src/types/v4/`**: Discarded simulated schemas, DTOs, and value objects have been **deleted** from the workspace to prevent cognitive bloat and reduce linter overhead. However, **`src/types/v4/mission.ts`** is an exception: it was **retained** and is **actively utilized** by the current production application (imported by active components, hooks, services, and routes).
- **Unwired Domain & Application Layers**: The experimental and unused folders `src/domain/` and `src/application/` have been completely **deleted** (pruned) rather than physically archived here.
- **Unwired Tests**: The 27 mock test files validating simulated pipelines have been completely **deleted** to maintain a clean, active testing suite under `/tests/`.

## ⚠️ Reason for Archival and Deletion
The project has successfully consolidated its core around the robust, active, React-driven generation flow (Flow B) to preserve stability and completely prevent regressions like "fixing RSS breaks playback." Maintaining dual pipeline architectures led to cognitive bloat, slower build times, and duplicate data definitions. Since the discarded code is no longer needed, it was pruned from the repo, leaving this documentation marker.

