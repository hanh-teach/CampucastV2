# CommuteCast

Evidence-driven personalized daily news briefings with progressive execution feedback and production observability.

## 📌 Project Overview
CommuteCast is a premium, hands-free voice utility and news intelligence platform built for active commutes. It leverages server-side intelligence to deliver custom daily briefings, combining structured RSS feeds and personalized synthesis with high-performance playback capabilities.

---

## 🏗️ System Architecture
CommuteCast consists of:
- **News Intelligence Core**: Gathers, refines, and filters news items under a unified `NewsModel`.
- **Audio Production Studio**: Synthesizes and buffers audio streams using a high-fidelity Web Audio API synthesizer and manual PCM playback engine.
- **Premium Driving Mode**: A specialized automotive HUD featuring hands-free voice assistant controls, automated Audio Ducking, and locale-aware command matching.
- **Progressive Sync & Persistence**: Utilizes IndexedDB and Service Workers to ensure offline resilience and seamless synchronization.

---

## 🗄️ Deletion and Archival of Unwired v4 Architecture
To maintain an enterprise-grade codebase with zero side effects, prevent regression bugs, and eliminate dead-tree code bloat:
- **Historical Reference Marker**: `_archive/unwired-v4-architecture/`
- **Subsystem Status**:
  - `src/domain/` (Decoupled value objects, schemas, and event dispatchers) — **Deleted** from repo.
  - `src/application/` (Complex flow orchestrators and runtime managers) — **Deleted** from repo.
  - `src/types/v4/` — Discarded schemas (`article.ts`, `briefing.ts`, and DTOs) were **deleted**. However, **`src/types/v4/mission.ts`** is **actively used** in production (imported by active hooks, UI, services, and routes).
  - **Tests**: 27 legacy test files targeting unwired architectures were completely **deleted** (active suites reside under `/tests/`).
- **Reasoning**: The system was consolidated around the robust, active, React-driven generation flow (Flow B) as documented in `CHANGELOG.md` and `DECISIONS.md` (PDR-001). This eliminates redundant orchestration pipelines and reduces build/linter complexity.

---

## 🧪 Testing Suites
All core active test suites are preserved and validated in `/tests/`:
- **`synthesis.test.ts`**: Verifies text-to-speech audio synthesis and buffer scheduling.
- **`rssService.test.ts`**: Validates the robust RSS parsing and styling pipeline.
- **`drivingMode.test.tsx`**: High-coverage automotive HUD control, voice recognition, and ducking checks.
- **`preferenceService.test.ts`**: Tests configuration synchronization and localized state.
- **`offlineStorage.test.ts`**: Assures reliability of IndexedDB queues and local cache fallbacks.

Run the entire suite with:
```bash
npm run test
```
or specifically:
```bash
npx vitest run
```
