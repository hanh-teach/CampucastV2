# CommuteCast Enterprise Guidelines & Mission Continuity Platform Framework

To ensure absolute system stability, zero side-effects, enterprise-grade scalability, and prevent regressions (such as "fixing RSS breaks Audio"), this project strictly enforces the **Sequential 11-Stage Sprint Lifecycle Framework**.

Every future sprint, task series, or software iteration must adhere to and document these stages sequentially before making and finalizing any codebase changes.

---

## 🔄 The 11-Stage Enterprise Sprint Lifecycle

```
Sprint X
① Discovery ──> ② Audit ──> ③ Architecture ──> ④ Design Review (Mission Model) ──> ⑤ UX Design ──> ⑥ Implementation
                                                                                                        │
⑪ Freeze <── ⑩ Documentation <── ⑨ Performance <── ⑧ Manual QA <── ⑦ Automated Testing
```

### ① Discovery (Product Alignment)
- **Objective**: Establish product-centric justification and quantify business value before engineering begins.
- **Key Questions**:
  - **Why** are we building or modifying this feature? What user pain point does it solve?
  - **Scale**: How many users utilize this feature, and how frequently?
  - **Feasibility**: Is this change worth the engineering overhead and regression risks?
  - **KPIs**: What are the success metrics (e.g., Mission Success Rate, Mission Resume Accuracy)?

### ② Audit (Codebase Analysis)
- **Objective**: Conduct a comprehensive static analysis of the active codebase relative to the task.
- **Rules**:
  - Review files, dependencies, active environment properties, and existing architectural patterns.
  - Formulate a strict **Regression Map** identifying adjacent subsystems that might be affected (e.g., tweaking RSS schemas must explicitly test podcast generation and playback streams).

### ③ Architecture (Systems & State Design)
- **Objective**: Formulate the data models, contracts, and boundaries prior to any code execution.
- **Rules**:
  - Map data structures, network topologies, API endpoints, and client-side states.
  - Define state residences: React Context, local state, or centralized stores.
  - **Type Safety First**: Declare or update all relevant interfaces, type definitions, and schema structures in `/src/types.ts` before component files are updated.

### ④ Design Review (Mission Model) [NEW GATE]
- **Objective**: Final design gate to ensure alignment with the Mission-based Operator Platform philosophy.
- **Rules**:
  - Verify that the proposed change respects `docs/architecture/MISSION_MODEL.md`.
  - Confirm Mission ownership and event contract compliance.
  - Evaluate impact on "Mission Success Rate" and "Mission Resume Accuracy".

### ⑤ UX Design (Interaction & Aesthetics)
- **Objective**: Define typography, micro-interactions, responsive states, and accessibility layouts.
- **Rules**:
  - Ensure touch targets are at least **44px** on all viewports.
  - Structure fluid responsive layouts supporting **Mobile, Tablet, Desktop, and Car Driving HUD**.
  - Detail visual transitions (using `motion/react`) and skeletal loaders for seamless asynchronous experiences.
  - Respect typography hierarchies (Inter for general body, display fonts for headings, and JetBrains Mono for data displays).

### ⑥ Implementation (Modular Coding)
- **Objective**: Deliver modular, highly targeted, clean, and self-documenting code updates.
- **Rules**:
  - Break tasks into non-interfering micro-updates to avoid large file bloat or compiler timeouts.
  - Use lazy initialization for resource-heavy components (e.g., AudioContext, WebSockets) to safeguard application startup.
  - Implement robust client-side error boundaries and safe server proxy paths.

### ⑦ Automated Testing (Continuous Integration)
- **Objective**: Programmatically validate code integrity and style rules.
- **Rules**:
  - Run `npm run lint` and `npm run build` after changes to guarantee there are no type errors, unused imports, or broken dependencies.
  - Validate package dependency lock-files to prevent runtime container boot failures.

### ⑧ Manual QA (Multi-Device & Network Checks)
- **Objective**: Verify interaction reliability and state stability under diverse environment conditions.
- **Rules**:
  - Test layouts and behaviors against target viewports: **Android, iPhone, Tablet, Desktop, and specialized Car HUD displays**.
  - Ensure full cross-browser compatibility across **Chrome, Edge, Firefox, and Safari**.
  - Simulate varying network speeds (throttled, offline mode) to verify offline PWA behavior, storage capacity limits, and background recovery.

### ⑨ Performance Optimization (Audit & Profiles)
- **Objective**: Programmatically and manually profile resource footprints, load speeds, and runtime stability to guarantee zero performance regressions.
- **Strict Success Threshold**: A passing compiler build (`Build PASS`) is merely a prerequisite. The entire sprint is declared a **FAIL** if any of the following core performance metrics degrade compared to the previous stable release.
- **Rules & Core Metrics to Measure**:
  - **Loading Speed (FP & LCP)**: Track *First Paint* (FP) and *Largest Contentful Paint* (LCP). Ensure the application remains highly interactive and that any layout changes or widgets do not delay paint sequences.
  - **Bundle Size**: Analyze package bundle size post-build. Prevent import leaks; any newly introduced third-party libraries must be tree-shaken and carefully analyzed to keep bundle sizes compact.
  - **Memory & CPU Footprint**:
    - Monitor runtime memory usage to prevent memory leaks over long sessions.
    - Audit Web Audio Performance: Verify that all initialized `AudioContext` nodes, synthesizers, and PCM players are explicitly closed and freed on component unmount to release audio hardware resources.
    - Profile React rendering loops and component trees to eliminate redundant state updates, render cascades, and infinite re-renders.
  - **Network Optimization**: Ensure API endpoints, RSS parser operations, and text-to-speech payloads are aggressively cached or compressed on the proxy server. Optimize request count and payload sizes.
  - **Offline Capabilities**: Measure performance, start times, and data read/write latency under throttled network conditions or full offline state. Ensure robust local caching of podcasts, RSS feeds, and user configurations.

### ⑩ Documentation (API & Knowledge Maps)
- **Objective**: Prevent documentation from becoming outdated by systematically updating core system files after major implementations.
- **Rules**:
  - Keep internal comments and inline codebase types fully synchronous with actual behaviors.
  - **Mandatory Document Updates**: The agent **MUST** review and update the following files at the end of each sprint to prevent technical debt and documentation decay:
    - **`CHANGELOG.md`**: Record all new features, enhancements, dependency upgrades, and fixed issues.
    - **`ROADMAP.md`**: Update milestone progress, shift deferred items, and lay out future sprint goals.
    - **`ARCHITECTURE.md`**: Document modifications to system topology, React contexts, state management structures, and proxy architectures.
    - **`API.md`**: Keep backend proxy routes, schema request/response types, and SDK integration configurations accurate.
    - **`VERSION.md`**: Increment the system version identifier and specify release notes matching the current production tag.
    - **`DECISIONS.md`**: Document key architectural and product decisions. For Era 2+, use the **PDR (Product Decision Record)** format: `Question` ↓ `Hypothesis` ↓ `Experiment` ↓ `Evidence` ↓ `Decision` ↓ `Result after 30 days`.
    - **`EVIDENCE_MEMORY.md`**: Update core lessons learned from Evidence Review Cycles (ERC).
    - **`PRODUCT.md`**: Maintain the "Measure Less, Learn More" and "Product Knowledge Graph" documentation.
    - **`MISSION_MODEL.md`**: Ensure mission-based workflow patterns are accurately reflected.

### ⑪ Freeze Sprint (Release & Compliance)
- **Objective**: Securely freeze the verified version and declare release stability.
- **Rules**:
  - Compile the final application and test it in a production state.
  - Label and tag the finalized version appropriately (e.g., **CommuteCast 3.1 Release Candidate**).
  - transition the build into a production-ready locked state without letting experimental codes leak.

### ⑪ Definition of Done (DoD)
- **Objective**: Ensure absolute quality control and sprint integrity.
- **Rules**:
  - A sprint is considered **COMPLETE** only when ALL the following are met:
    - ✓ Build PASS
    - ✓ Linter PASS
    - ✓ Type Check PASS
    - ✓ Unit Test PASS
    - ✓ Integration PASS
    - ✓ Responsive PASS
    - ✓ Accessibility PASS
    - ✓ Performance PASS
    - ✓ Regression PASS
    - ✓ Documentation Updated
    - ✓ Changelog Updated
    - ✓ Version Tagged
    - ✓ **Evidence Confidence Checked** (for Era 2+)
  - If any of these are missing, the sprint is marked as **FAILED**.
  - **Sprint 3.1.1 (News Intelligence Core) Specific DoD**:
    - ✓ No features added outside the scope of News Intelligence Core.
    - ✓ `NewsModel` (`NewsItem`) is implemented as the unified central data model.
    - ✓ Domain Layer is completed before adding new news sources.
    - ✓ Existing API, TTS, AI Studio, and Audio Studio logic remains unchanged and functional (backward compatibility).
    - ✓ `ARCHITECTURE.md`, `DOMAIN_MODEL.md`, and `EVENT_CATALOG.md` are documented and aligned with the code.

### ⑫ RFC & ADR Governance
To maintain Enterprise-grade control over the architecture:
- **ADR (Architecture Decision Records)**: All major architectural decisions MUST be recorded in `docs/adr/` with context, decision, and consequences. Do not stuff all decisions into `DECISIONS.md`.
- **RFC (Request For Comments)**: Before implementing any new Epic, the AI MUST write an RFC in `docs/rfc/` proposing the design, alternatives, and consequences.
- **Process**: `RFC -> Architecture Review -> Implementation -> Testing -> Review -> Freeze`. No coding until RFC is approved by the Chief Software Architect.

### 🤖 AI Behavior Policy
To ensure consistency across coding environments (Gemini, Claude, Cursor, etc.):

#### 🏛️ Architecture First (NO IMPLEMENTATION WITHOUT ARCHITECTURE APPROVAL)
No module may be implemented until:
- ✓ Domain Model Approved
- ✓ Event Contract Approved
- ✓ Repository Contract Approved
- ✓ Connector Contract Approved
- ✓ Dependency Review Passed
- ✓ Rollback Strategy Defined
- ✓ **Decision Density Audit Passed** (Era 2.2)
- ✓ **Intelligence Debt Audit Passed** (Era 2.3)
- ✓ **Portfolio Value Check Passed** (Era 2.5)
- ✓ **Research Exit Rule Compliance** (Era 2.5)
- ✓ **Research Progress Checked** (Era 2.6)
- ✓ **Evidence Quality Evaluated** (Era 2.6)
- ✓ **Decision Readiness Assessed** (Era 2.6)
- ✓ **Product Impact Verified** (Era 2.6)

#### 🧪 Research First (ERA 2.2/2.3/2.5/2.6 GUIDELINE)
Every research sprint must follow the **One-Page Research Template** and answer exactly 5 core questions to evaluate any product change proposal:
1. **Question**: What are we trying to answer? (Must be quantitative/falsifiable, e.g. "among sessions with <50% completion, what single factor explains ≥60% of abandonments?").
2. **Evidence**: What does the real-world user data say?
3. **Decision**: What is the specific product action (or "No Change" verdict)?
4. **Expected Impact**: Which KPI do we expect to change, and by how much?
5. **Verification Plan**: How will we programmatically measure if the decision was correct?

#### 📊 Strategic Organizational Metrics
To measure our capability as a Research-Driven Product organization, we monitor:
1. **Decision Quality**: % of product decisions directly backed by high-confidence evidence.
2. **Learning Velocity**: The average calendar days to go from Research Question to Product Decision.
3. **Decision Accuracy**: % of shipped decisions that achieve their Expected Impact KPI.

#### 📝 Weekly Product Memo
Every week, the AI must deliver a single-page memo summarizing:
- **Question we investigated**
- **What we learned & What surprised us**
- **Decision made & Decision intentionally NOT made**
- **Next question**

#### 🛑 The "Stop Rule" (Era 2.3 Version)
If a research sprint or ERC concludes that **no change is necessary** based on evidence, this is a **SUCCESSFUL SPRINT**. Do not create work to justify a change.

#### ⚖️ Evidence Budget Rule (Era 2.4/2.5/2.6 Governance)
- **Framework Growth ≤ Evidence Growth**: Governance complexity must not increase faster than the volume of actionable evidence.
- **Strict Limits**: Max 1 active research question, ≤3 primary KPIs, ≤1 dashboard change, and 0 new governance documents per research sprint.
- **Portfolio Value**: Every change must be justified by its contribution to the active research portfolio.
- **Research Exit Rule**: No new ERCs may be opened until the current one yields a Decision Record and a Reusable Principle.
- **Governance Freeze Constitutional Rule**: The governance system is completely frozen. Any future modification to governance or frameworks is strictly forbidden unless it is backed by multiple research cycles demonstrating an absolute system barrier that cannot be solved via product UX changes.
- **Stop Rule**: If evidence concludes "no change needed", the sprint is a success. Do not create work to justify a change.

#### 🛑 Permanent Freeze List (Zero Meta-Work)
The following elements are permanently frozen to completely eliminate meta-work. No modifications allowed unless backed by undeniable product evidence:
- **Telemetry schema** (Stable & complete)
- **Dashboard framework** (Observation deck v3.2.9)
- **Governance workflows** (Rules are locked)
- **Product Constitution** (Locked at v1.0)
- **Research Portfolio structure** (Listening/Trust/Personalization/Retention taxonomy)
- **Evidence templates & Principle Registry** (Locked)

#### 📊 Decision Confidence Matrix
Every product change proposal must map to one of these confidence tiers based on evidence strength:
- **Weak Evidence** → Continue Observation (No action)
- **Moderate Evidence** → Small Experiment (A/B testing/Limited rollout)
- **Strong Evidence** → Ship Change (Production release)
- **Strong + Repeated Evidence** → Promote to Principle (Add to `PRINCIPLES.md` with Scope)

#### 🛑 The "3 Questions" Rule (Era 2.2 Version)
Before writing ANY code, every proposed change MUST answer "Yes" to these three questions:
1. **Does it solve a specific behavioral problem identified in evidence?**
2. **Does it increase Decision Velocity or Decision Accuracy?**
3. **Does it preserve established user trust and "Reliability Perception"?**
If any answer is "No", the change MUST NOT be implemented.

#### 🚫 AI MUST NEVER
- Rewrite the entire application.
- Replace stable modules without explicit justification.
- Remove backward compatibility.
- Rename public APIs.
- Change persistent storage schema without migration plans.
- Break keyboard shortcuts.
- Remove accessibility features.
- Introduce experimental dependencies without approval.
- **Create new intermediate data types for news (e.g., `RSSItem`, `Article`) outside of the Source Connectors layer. All modules MUST operate on the unified `NewsModel`.**

#### ✅ AI SHOULD
- Prefer incremental refactoring.
- Keep strict module boundaries.
- Preserve established user workflows.
- Update documentation immediately.
- Update `CHANGELOG.md` upon completion.
- Update `DECISIONS.md` for architectural shifts.
- Minimize code duplication.
- Strictly follow the `DESIGN_SYSTEM.md`.

---

## 🛠️ Codebase Invariants & Guidelines

1. **Strict Client-Side/Server-Side Boundaries**: Keep API credentials and heavy text processing on the server-side proxy route `/api/*`. Never expose keys to client-side bundles.
2. **Audio Performance Preservation**: The Audio Synthesis and Manual PCM Player are core assets. Do not modify PCM stream players or audio contexts without performing full device and memory leak regression tests first.
3. **Typography**: Use standard fonts paired via Tailwind. Keep interface displays clean, literal, and clutter-free (No tech-larping status indicators).
4. **Capability-Based Naming**: Never name Sprints or core modules after specific underlying technologies (e.g., do NOT use "RSS Sprint", "TTS Module", "Queue"). Instead, always name them after the user value and systemic capability (e.g., "News Intelligence Core", "Audio Production Studio", "Playback Experience"). This prevents technology lock-in and scales the architecture cleanly.
