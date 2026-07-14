# CommuteCast Engineering Standards
Version: 1.0.0
Status: **ACTIVE** 🔒

This document establishes the technical rules, conventions, and quality gates for developers contributing to the CommuteCast project. Adherence to these standards guarantees long-term codebase health, modular isolation, and platform reliability.

---

## 🏛️ 1. Architecture & Module Boundaries

### System Architecture & Service Boundaries
1. **Consolidated Service-Driven Architecture**: The experimental domain layer (`/src/domain/`) has been retired. Business logic and orchestrations reside cleanly within decoupled services (`/src/services/`) and hooks (`/src/hooks/`).
2. **Infrastructure Decoupling**: Database adapters, external integrations (e.g., Gemini SDK, RSS parsers), and HTTP routers are isolated inside dedicated services. All dependencies point toward standard, unified data schemas and state managers.
3. **Modular Autonomy**: Core domains (such as settings, playback, and driving modes) operate as modular blocks, communicating through explicit service APIs, React contexts, or indexed queues. Importing internal private helpers across module boundaries is forbidden.

### Data Types & Contracts
1. **Unified central models**: Avoid creating local or redundant duplicate models (e.g., `RSSItem`, `Article`) outside of the immediate adapter layer. All internal modules MUST operate on the unified domain models (e.g., `NewsModel` or `NewsItem`, `ListeningSession`).
2. **Types & Enums**: Declare shared interfaces, types, and enums in `/src/types/` at the earliest stage of design. Standard TypeScript `enum` declarations are required (never use `const enum`). Place all type imports at the top of the file using named imports (do not use object destructuring).

---

## 📦 2. Dependency Management & SDK Usage

### Key Guardrails & Server Proxying
1. **API Key Isolation**: All API keys, secrets, and private credentials (including the Gemini API Key, Firebase service accounts, or database connection strings) must remain strictly on the server-side (`server.ts`). They are strictly forbidden from leaking to client-side bundles.
2. **Lazy Initialization**: Resource-heavy clients (such as Stripe, Firebase, or Web Audio contexts) must be initialized lazily when first requested rather than at module load time. This prevents early bootstrap crashes if an environment variable is temporarily absent.
3. **Graceful Failures**: If an integration key is missing, throw a clean, human-readable error or disable the specific capability gracefully (e.g., using optional chaining or guard blocks). Do not let initialization failures crash the entire system.

---

## ⚡ 3. Performance Budgets & Resource Footprints

To prevent degradation of the user experience and hardware resources, every pull request must comply with our strict performance targets:

| Dimension | Metric / Constraint | Verification Tool |
| :--- | :--- | :--- |
| **Server Startup** | Container cold bootstrap < 300 ms | Simulation Suite |
| **Audio Playback Gap** | Gap between beats < 80 ms | Audio Coordinator |
| **Memory Footprint** | Zero unreleased `AudioContext` nodes on unmount | DevTools Profile |
| **API Latency** | Express proxy api handlers < 100 ms | Performance Metrics |
| **Bundle Size** | Production build main bundle < 500 KB | esbuild / vite build |

---

## 🧪 4. Testing & Quality Gates

Every code change must satisfy our verification pipeline before it is approved for merging:

1. **Static Analysis**: Must pass `npm run lint` and `tsc --noEmit` with zero errors or warnings.
2. **Automated Unit Testing**:
   - Every domain engine must be accompanied by a structured, self-contained TypeScript test suite inside `/tests/`.
   - Mock external networks and API providers (e.g., mock `GoogleGenAI` model generation) to keep tests fast, robust, and offline-compatible.
3. **Regression Proofing**: Any changes affecting core pipelines must verify backward compatibility with previous snapshot versions and playback aggregates.

---

## 🔍 5. Code Review Checklist

Before issuing or approving a Pull Request, verify:
- [ ] **Type Compliance**: Are types declared cleanly without `any` overrides or TS-ignore workarounds?
- [ ] **Decoupling**: Does the infrastructure connect via abstractions, or does domain logic leak HTTP/Database details?
- [ ] **Observation Safety**: If modifying evaluation or scoring logic, is the observation-only rule preserved? (Evaluation must never mutate active sessions).
- [ ] **Clean Clean-ups**: Are event listeners, audio contexts, and active intervals cleanly torn down in destructors or unmount effects?

---

## 📝 6. Definition of Done (Anti-Paper-Architecture Protocol)
To ensure features are truly implemented and not just "paper architecture", the Definition of Done requires rigorous proof of actual usage. A feature may only be marked "Done" (in tickets, ROADMAP, or CHANGELOG) if it strictly meets ALL of the following criteria:

1. **Unit Tests**: The feature has comprehensive unit tests (`npm run test`).
2. **Real UI Integration Test**: An integration test must exist that mounts a real React UI component and executes the feature pipeline end-to-end (e.g., `tests/integration/RealBriefingFlow.test.tsx`).
3. **Explicit UI Evidence & Auto-Verification**: 
   - The completion claim must explicitly cite the specific UI file that imports and uses the feature. **Vague claims like "integrated into UI" are forbidden.**
   - **Mandatory Grep Check**: Before marking as "Done", the developer MUST run `grep` to confirm the import/usage exists.
   - **Evidence Block**: The output of the `grep` command MUST be pasted directly into the CHANGELOG or ROADMAP entry as a code block to serve as immutable proof.

## 🛡️ 7. File Creation Guardrails
To prevent duplicating existing models and architectural components:
1. **Pre-Flight Duplication Check**: Before creating any new file in `src/`, developers MUST run a search (e.g., `find src -name '<FileName>.ts'`) to ensure a file with the same name or heavily overlapping responsibility does not already exist.

---

## 🔒 8. Security Engineering Standards
To protect server resource quotas and user identity boundaries, developers must follow these security patterns:
1. **WebSocket Authentication**: All WebSockets (such as `/ws/voice`) must implement dynamic, single-use, short-lived token checks via on-demand endpoints like `/api/voice-token` instead of hardcoded placeholders or permissive states. Tokens must be invalidated immediately upon successful handshake verification to prevent session replays.
2. **CORS Origin Whitelisting**: The Express application CORS middleware must strictly whitelist trusted client-side origins (using the `APP_URL` environment variable and local debug loopbacks) in production. Unrestricted `*` cors configurations are forbidden.
3. **Endpoint Rate Limiting**: Limit API requests based on resource consumption. Resource-heavy endpoints (e.g., AI summary generators, conversational voice interfaces, token issuers) must be restricted to 20 requests per minute. Standard database and media fetching endpoints should enforce a maximum 100 requests per minute safety margin.

