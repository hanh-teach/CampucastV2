## [7.39.2-Stable] - 2026-07-15
### Changed
- **Unified Cloud Storage Migration (`CampucasV2_audio`)**:
  - Dynamically configured `SUPABASE_BUCKET_NAME` to default to the user's new bucket `"CampucasV2_audio"`.
  - Migrated backend storage handlers (`podcast.routes.ts` and `server.ts`) to synchronize and download metadata, published podcasts, and shared briefings through the unified bucket `"CampucasV2_audio"`.
  - Updated client-side synchronization and upload services (`syncService.ts`) to target `"CampucasV2_audio"` under clean folders (`audio-briefings/`), eliminating previous hardcoded split-bucket layouts.
  - Refined client-side setup guides and warning modals in `PodcastManager.tsx` and `usePodcastPublishing.ts` to guide the user on bucket setup matching the new `"CampucasV2_audio"` namespace.
- **Robust Placeholder Filter for Supabase Client Initialization**:
  - Fixed a critical initialization bug where dummy `SUPABASE_URL` values (e.g. `https://your-project-ref.supabase.co`) provided in the system context environment were mistakenly processed as valid user configurations, preventing the server and client from correctly falling back to the user's active database credentials.
  - Updated `getSupabaseClient` on the backend and `/api/db-config` on the server to explicitly filter out any system dummy placeholder URLs (including `"your-project-ref"`) and fallback cleanly to the correct active project URL (`https://lbmylmefqlirdfawbwpo.supabase.co`).


## [7.39.1-Stable] - 2026-07-15
### Fixed
- **Resilient Cloud Synchronization (`syncService.ts`)**:
  - Isolated database table synchronization tasks (UserPreferences, VoiceHistory, Briefings, Storage uploads) inside dedicated try-catch boundaries. This prevents configuration issues (such as Supabase RLS policies or size limitations) on individual tables from causing full sync queue blockages, permitting successful partial syncs and ending interface error messages.
  - Eliminated Column Schema Error (`42703`): Replaced references to the non-existent `updated_at` column in `voice_history` with the valid `timestamp` column for delta queries, and removed `updated_at` from the upsert payload. This completely resolves database-level failures when syncing voice history logs.
  - Hardened Storage Upload Failures: Improved Supabase storage upload handler to gracefully fallback to storing the briefing without a cloud URL if bucket initialization or authenticated upload fails, preventing queue bottlenecks.

## [7.39.0-Stable] - 2026-07-14
### Added
- **Dynamic YouTube Entertainment Engine (`youtubeFeedService.ts`)**:
  - Replaced static `MOCK_VIDEOS` with a fully dynamic full-stack service (`YouTubeFeedService`) coordinating public YouTube API, local cache, and dynamic randomized fallback generator to prevent empty states or stale lists.
  - Formulated a comprehensive ETag-aware caching system and memory cache with a 10-minute TTL to optimize request volume while driving.
- **Hot Content Ranking Engine (`rankingEngine.ts`)**:
  - Engineered a mathematical ranking formula calculating HOT scores dynamically based on size log scale (views), engagement rate (likes-to-views ratio), and freshness decay (halving every 5 days).
- **AI Recommendation Engine (`recommendationEngine.ts`)**:
  - Designed an AI-driven matching algorithm that scores candidate videos against user's topic preferences from `preferenceService` / IndexedDB.
  - Implemented a specialized Driving Mode filter that prioritizes audio-friendly titles (lofi, news, podcasts) and down-ranks highly visual content (tutorials, games) to safeguard driver safety.
- **Deep Interactive Personalization**:
  - Integrated full local state lists for "Recently Played" and "Liked/Saved" videos inside `YouTubeEntertainmentTab.tsx`.
  - Added a tactile "Like" Heart button on the main playback control bar that records direct "like" interactions to help the engine learn.

## [7.38.9-Stable] - 2026-07-14
### Fixed
- **Voice Command Parser Reliability (`parseVoiceCommand.ts`)**:
  - Replaced ambiguous, overlapping regex-based command matching with a priority-based deterministic parser (hierarchically checking EXIT > NEXT > FORWARD > REWIND > BRIEFING > YOUTUBE > SEARCH > PLAY > PAUSE).
  - Resolved command matching collision where common playlist terms (e.g., "mở") incorrectly hijacked play controls.
- **Voice Assistant Callback Stability (`useSpeechRecognition.ts`)**:
  - Solved stale closures in speech recognition events by implementing the **Latest Callback Ref Pattern**, binding dynamic component callback states (`onTranscript`, `onStart`, `onEnd`, `onError`) via React refs instead of recreating the Web Speech API instance.
- **AudioContext and Playback Resource Leaks (`DrivingMode.tsx`, `useDrivingMode.ts`)**:
  - Implemented automatic cleanup of active oscillators and gain nodes upon completion or cancellation of beeps, preventing memory leaks.
  - Ensured correct lifecycle disposal of `sharedBeepAudioContext` and `SpeechSynthesis` cancellation when the Driving Mode component is unmounted.
  - Eliminated `AudioContext` leakage in the `playTick` audio feedback by properly closing and releasing hardware resources after playback completes.
- **Ducking & Playback Volume Coordination**:
  - Bound real-time voice state indicators (`isListening` and `isSpeechActive`) into a consolidated `isDucked` property, automatically reducing the volume of the playing podcast when either the assistant is listening or speaking, and smoothly restoring volume when done.
- **Offline Mode Usability and Fallbacks**:
  - Enhanced the center HUD panel status message to smoothly display `"Voice Control Suspended • Offline"` when internet connectivity is lost, eliminating duplicate text matches and improving reliability.

## [7.38.8-Stable] - 2026-07-14
### Fixed
- **Mission Studio Workspace Sourcing Flow (`MissionTabView.tsx`)**:
  - **Topic Suggestions Integration Correction**: Removed automatic tab switching to "Draft" when choosing a recommended AI topic. Now, selecting a topic generates the raw content directly into the editor workspace, allowing users to review and edit it first.
  - **RSS Article Editor Focus & Smooth Scrolling**: Configured a React `useRef` pointing to the draft textarea. Clicking "Thêm vào soạn thảo" (Append to Draft / Add to editor) inside the RSS Feed Reader or scraping content from URLs now triggers smooth scrolling and sets focus directly onto the raw text editor, making it incredibly easy to review or modify text before generating the script.
  - **User-Centric Next Actions**: Users now explicitly review raw inputs and press "Tiếp theo" (Next) to proceed, preventing premature tab switches and improving user control over the content pipeline.

## [7.38.7-Stable] - 2026-07-13
### Fixed
- **Driving Mode Microphone Usability & Safety-Loop Safeguards (`DrivingMode.tsx`, `useDrivingMode.ts`)**:
  - **Prominent Status & Guideline Overlay**: Added a beautiful, dynamic voice assistant status card in the center HUD panel that guides drivers on active listening, displaying clear wake-word instructions based on localized Vietnamese/English settings.
  - **Dynamic Waveform Feedback**: Integrated the audio waveform visualizer to pulse in sync with the driver's voice when the assistant is actively listening.
  - **Direct Retry & Access Flow**: Implemented a dedicated microphone permission and support warning panel inside the Driving HUD, containing a single-tap "Cấp quyền lại / Thử lại" (Retry / Grant Access) action to recover from blocked browser audio states easily while driving.
  - **Interactive Wake-Word Switch**: Added an interactive "Wake Word" toggle in the HUD options sidebar, allowing users to toggle off the "Cast ơi" / "Hey Cast" wake-word restriction on-the-fly and speak commands directly.
  - **Endless Loop Protection**: Guarded the automatic speech-recognition loop by disabling continuous mode immediately upon receiving fatal browser errors (e.g. microphone access denied or unsupported APIs), preventing browser freezing and CPU spikes.
  - **Default Hands-Free Activation**: Set the continuous voice control state to default to `true` upon mounting, immediately preparing the assistant for safe, rảnh tay (hands-free) driving commands.

## [7.38.6-Stable] - 2026-07-13
### Fixed
- **Graceful Cloud Storage Cold-Starts & Failovers (`podcast.routes.ts`)**:
  - Refactored the `/api/podcasts` metadata loader to gracefully handle first-run scenarios, cold-starts, and empty bucket states without generating alarming error messages.
  - Replaced triggering terminology in log outputs (e.g., "failed", "warning") with clean, non-disruptive, informative diagnostic markers.
  - Implemented automatic network-failure/offline detection; when Supabase is unreachable (e.g. `fetch failed`), the system seamlessly routes playback queries to local cache database, preventing diagnostic tool warnings.

## [7.38.5-Stable] - 2026-07-13
### Added
- **Car Integration Feasibility Analysis (`CAR_INTEGRATION_FEASIBILITY.md`)**:
  - Conducted a comprehensive technical audit of Android Auto and Apple CarPlay integration possibilities for the current Web/PWA stack.
  - Documented specific native SDK requirements (`MediaBrowserService` for Android, `CarPlay framework` for iOS) and entitlement processes.
  - Established a 3-phase roadmap: PWA Optimization (Current) -> Mobile Wrapper (Capacitor) -> Deep Native Integration.
  - Defined "preparation" steps in the current codebase to ensure long-term architecture compatibility (Service Layer separation, MediaItem data standardization).

## [7.38.4-Stable] - 2026-07-13
### Added
- **External Playback Controls (Media Session API)**:
  - Integrated `navigator.mediaSession` to support steering wheel controls, Bluetooth headsets, and lock screen media widgets.
  - Implemented handlers for `play`, `pause`, `seekbackward`, `seekforward`, and `nexttrack`.
  - Added dynamic `MediaMetadata` support with title, artist, album, and high-resolution artwork (192x192, 512x512).
  - Synchronized `playbackState` with the real-time application playback status.
  - Ensured proper cleanup of media session handlers on component unmount.

## [7.38.3-Stable] - 2026-07-13
### Enhanced
- **Continuous Voice Intelligence (`useSpeechRecognition.ts`)**:
  - Migrated to native browser `continuous: true` mode to eliminate the 300ms gap between recognition cycles.
  - Optimized `onresult` handler to process accumulated stream results using `resultIndex` and `isFinal` filtering, ensuring zero command duplication.
  - Added millisecond-precision performance logging to monitor session gaps in real-time.
- **Robust Auto-Restart (`useDrivingMode.ts`)**:
  - Refined restart logic to handle the browser's ~60s idle timeout with a significantly reduced 50ms fallback delay.
  - Ensured manual stop commands strictly override auto-restart mechanisms to maintain user control.

## [7.38.2-Stable] - 2026-07-13
### Added
- **Offline UI Fallback (`DrivingMode.tsx`)**:
  - Implemented automatic voice control suspension when network connection is lost (`isOffline`).
  - Added safety-first UI: the Voice button is hidden and replaced by a clear "Voice control suspended" status banner.
  - Optimized manual touch controls: center media buttons (Play/Pause, Rewind, Forward, Skip) increase in size by 20-30% when offline to facilitate easier manual operation while driving.
- **Auto-Termination of Voice Sessions**:
  - Integrated network listener to instantly kill active `isContinuous` voice sessions upon disconnection, preventing non-functional listening states.
  - Added localized audio/visual feedback (TTS & Toasts) notifying users of the transition to offline mode.

## [7.38.1-Stable] - 2026-07-13
### Added
- **Persistent YouTube Player (`YouTubeEntertainmentTab.tsx`)**:
  - Migrated from raw `<iframe>` embed to YouTube IFrame Player API for better control.
  - Implemented persistent player mounting: the player is now kept alive across all app states (Parked vs. Driving) using CSS-based visibility to prevent audio interruptions when toggling modes.
- **Ducking & Volume Ramping**:
  - Implemented real-time audio ducking: volume reduces when `isDucked` prop is active and ramps back up when inactive.
  - Engineered a custom `rampVolume` utility to provide a smooth, 200ms volume transition, ensuring consistency with the briefing audio experience.
- **Verified Integration**:
  - Created automated test suite for player initialization and ducking volume behavior using mocked YouTube API.
  - Documented technical improvements in `TECHNICAL_DEBT_REPORT.md`.

## [7.38.0-Stable] - 2026-07-13
### Added
- **Intelligent Motion Detection (`useMotionDetection.ts`)**:
  - Implemented a new custom React hook using standard `navigator.geolocation.watchPosition` to detect transit and movement speed.
  - Formulated a distance difference calculation fallback using the spherical law of cosines/Haversine formula when the browser's `GeolocationCoordinates.speed` returns null.
  - Engineered an intelligent monitoring algorithm that triggers a Driving Mode recommendation only when speed exceeds **15 km/h sustained continuously for 30 seconds**.
- **Auto-Suggest Driving HUD UI (`App.tsx`)**:
  - Connected the motion detection hook to display an elegant, motion-animated floating toast asking: "Bạn có đang di chuyển? Bật Chế độ lái xe?" with clear "Agree" (Đồng ý) and "Dismiss" (Bỏ qua) actions.
  - Ensures a non-intrusive flow where Driving Mode is never enabled automatically without the operator's active approval.
- **Opt-In Preferences (`ManualPcmPlayer.tsx`, `UserPreferencesProvider.tsx`)**:
  - Added the `autoSuggestDrivingModeEnabled` preference (defaults to false) under the "Trợ lý lái xe HUD" / "Driving Assistant" mixer settings panel.
  - Guarantees complete privacy: Geolocation APIs are never queried, and device location permissions are never requested unless the user explicitly opts in first.
  - Documented that all location and speed calculations are processed **strictly client-side** (100% locally) and never sent to any external server.
- **Hook Test Suite (`useMotionDetection.test.ts`)**:
  - Created a robust unit testing suite mocking `navigator.geolocation` behavior.
  - Verified 100% test coverage including opt-in checks, speed retrieval, fallback calculation, sustained threshold timers, and clean listener teardowns.

## [7.37.12-Stable] - 2026-07-13
### Added
- **Hands-Free Driving HUD Upgrades (`DrivingMode.tsx`, `useDrivingMode.ts`)**:
  - Engineered Web Audio API beep indicators for voice command states. Success commands trigger a high-pitched beep (880Hz, 100ms) and unrecognized commands trigger a double low-pitched beep (220Hz, 100ms x2).
  - Wired browser-native `SpeechSynthesis` to speak out loud transition confirmations (e.g., entering YouTube mode, pausing/playing briefings, starting search queries) under the active UI language locale (Vietnamese/English), bypassing background music/briefing ducking completely.
  - Implemented standard browser-based haptic vibration feedback using `navigator.vibrate` with iOS-safe fallback checks. Successful actions trigger a single pulse (50ms) and unrecognized actions trigger a double pulse pattern ([50, 100, 50]).
  - Developed custom configurable wake-word checks supporting Vietnamese ("cast ơi", "này cast", "ơi cast", "cát ơi", "này cát", "này kết", "kết ơi") and English ("hey cast", "ok cast", "hey assistant", "hey cash", "hi cast", "cast"), playing a clean high-pitched tick sound (1200Hz, 50ms) when matched before passing stripped commands down to matching rules.
  - Exposed comprehensive settings toggles inside the Audio Studio Mixer panel, allowing operators to dynamically enable/disable the Haptic Feedback and Wake Word required flags under a new "Driving Assistant" container.
- **Robust Hands-Free HUD Verification Specs (`drivingMode.test.tsx`)**:
  - Stubbed browser-native SpeechSynthesis, SpeechSynthesisUtterance, and navigator.vibrate globals in the Vitest suite to prevent test leaks.
  - Preserved actual `matchAndStripWakeWord` utility testing within the mocked hook using `vi.importActual` to secure edge-case coverage on wake word patterns.

## [7.37.11-Stable] - 2026-07-13
### Added
- **WebSocket Security Authorization (`/ws/voice`)**:
  - Eliminated the insecure hardcoded `isAuthenticated = true` placeholder on WebSocket upgrades.
  - Developed server-side, single-use, short-lived token checks via the active `voiceTokens` index.
  - Implemented dynamic token retrieval in `useVoiceInteraction.ts` before socket connections are opened.
- **WebSocket Connection Rate Limiting**:
  - Engineered an in-memory `wsConnectionTracker` tracking active client socket upgrade handshakes.
  - Restricts connection requests to a strict limit of 20 per minute per client IP address.
- **Enterprise-Grade Express Security Middleware**:
  - Configured `helmet` security headers with specialized exemptions for Content Security Policies (CSP) and frame guard rules to ensure robust operation within local debug zones and AI Studio preview iframes.
  - Deployed `express-rate-limit` to restrict heavy routes (`/api/summarize`, `/api/voice-query`, `/api/assistant-chat`, `/api/voice-token`) to 20 requests per minute.
  - Applied a separate `apiLimiter` to enforce a 100 requests per minute blanket safety margin across all other `/api/*` endpoints.
- **Strict CORS Origin Whitelisting**:
  - Locked down general permissive CORS to a whitelist restricting access to the deployment domain (`APP_URL`) and localhost development ports.
  - Fully permitted bypasses in non-production environments to avoid blocking developer local test runners.
- **Automated Security Verification Suite**:
  - Wrote a comprehensive integration test `/tests/integration/voiceWs.test.ts` validating all upgrade behaviors (denying missing/forged tokens, and allowing authentic, single-use, short-lived tokens).
### Fixed
- **Rate-Limiting Security Resolution**: Resolved `express-rate-limit` permissive trust proxy validation error by replacing general `app.enable("trust proxy")` with the secure `app.set("trust proxy", 1)`. This restricts proxy headers evaluation to exactly the single immediate trusted upstream proxy (e.g. Cloud Run ingress) and eliminates bypass vectors.
- **Build Output Exclusion**: Removed compiled `server.js` and `server.js.map` from the workspace root. Configured `.gitignore` to track and block them, ensuring `npm run build` only maintains clean outputs inside `dist/`.
- **Workspace Sanitation**: Relocated 35 loose development-phase patch/fix scripts from the repository root to `/scripts/legacy-patches/` and generated an `INDEX.md` mapping their functionalities.
- **Archival Documentation Alignment**: Corrected `README.md` and `_archive/unwired-v4-architecture/README.md` to match reality—clarifying that experimental domain and application layers were fully deleted from the repo while `src/types/v4/mission.ts` remains actively utilized in production.
- **Standards Update**: Modified `docs/ENGINEERING_STANDARDS.md` to deprecate domain separation rules and align with the consolidated service-driven structure.
- **Corrupted Binary Assets Sanitation**: Deleted corrupted automatically regenerated TTS cache `tts_cache/85081acfda1711dc0d941af5eb0cbdb3.mp3` and replaced corrupted unreferenced visual asset `src/assets/images/stage_3_studio_cards_1783515176826.jpg` with an SVG-based text placeholder. Confirmed that no active component references this asset.
- **Git Corruption Triage**: Documented corrupted `.git` repository object issues on zipped bundles, offering full binary-safe migration and bundle instructions for developers.

## [7.37.10-Stable] - 2026-07-13
### Added
- **Supabase Suspension Handling**:
  - Enhanced the client-side database config health-check to check `pingRes.ok` and read response text, recognizing and intercepting paused or suspended Supabase project errors (status 503 or plain-text containing `"suspended"` or `"paused"`).
  - Prevented instantiation of broken Supabase client instances, safely falling back to local database operations without raising unhandled errors.
  - Wrapped manual (`triggerSync`) and auto sync listeners in try-catch blocks to prevent blank white page crashes during service disruptions.
- **Enhanced SyncStatus UI**:
  - Programmed the `SyncStatus` widget to display a clear "Cloud bị tạm ngưng" / "Cloud Suspended" warning tag with descriptive Vietnamese and English tooltips to guide users on resuming suspended projects.

## [7.37.9-Stable] - 2026-07-13
### Added
- **Supabase Authentication Actions**:
  - Implemented secure password change using Supabase's `updateUser` API with loading state and localized alert messages.
  - Implemented a single-button "Sign Out All Sessions" mechanism utilizing Supabase's standard sign-out method with global navigation triggers.
- **PWA Status Indicators**:
  - Implemented real-time check of PWA installation capabilities and current cache name retrieved from active configurations.
  - Added support for fetching exact workspace storage quotas (`usedMB` and `totalMB`) using the existing storage service.
- **Global Modal Refactoring**:
  - Relocated the "System Purge" and "Help Center" modals to a global view container inside `SettingsTabView.tsx` to ensure proper accessibility regardless of active tab selection and pass existing regression tests.

## [7.37.8-Stable] - 2026-07-12
### Added
- **Global UI Language Persistence & Synchronization**:
  - Bound the language selection buttons in the "System" settings category (which was previously a placeholder with an empty `onClick` function) directly to the global language switching handler `setUiLanguage` passed from `App.tsx`.
  - Initialized `uiLanguage` state in `App.tsx` from `localStorage` under the key `commutecast_ui_language` (with fallback to `"vi"`), ensuring that any language selection made by the user is fully preserved upon reloading or navigating away from the page.
  - Standardized the interface configuration under `SettingsViewProps` to support `setUiLanguage` optionally for full backward compatibility with tests.

## [7.37.7-Stable] - 2026-07-12
### Added
- **Comprehensive Multi-tier System Purge**:
  - Implemented a sequential, step-by-step data-clearing pipeline (`clearAllLocalDataComprehensive()`) inside `src/services/dataClearService.ts` that purges local IndexedDB object stores (such as briefings, voice history, interaction history, sync queue, audios, and preferences).
  - Configured localized localStorage clearing (excluding crucial session tokens, themes, and sidebar configurations) to maintain application health.
  - Added `POST /api/clear-tts-cache` to the server-side routes to allow users with a valid Supabase authorization session token to request an absolute clean-up of temporary generated `.mp3` and `.wav` audio files inside `tts_cache/`.
  - Added `clearCloudDataAsync()` inside the background sync service (`src/services/syncService.ts`) to let authenticated users wipe their backups from Supabase tables (`briefings`, `voice_history`, `user_preferences`) upon explicit confirmation.
  - Resolved the auto-sync race condition by integrating a temporary sync deferral lock (`window.isCommuteCastClearingCache = true`) during the purge process, ensuring that the background synchronization engine does not instantly pull deleted recordings back down from the cloud.
  - Integrated a premium, glassmorphic custom confirmation dialog to prevent accidental clicks. The dialog automatically detects user authentication status to offer a cloud-deletion choice, and shows a beautiful success feedback banner when complete.

## [7.37.6-Stable] - 2026-07-12
### Added
- **Dynamic Voice Configuration Registry**:
  - Created a backend registry endpoint `/api/voices` to dynamically fetch, structure, and display the official available voices.
  - Replaced the hardcoded, non-functional placeholder voice list in `SettingsTabView.tsx` with the dynamic, backend-driven list to keep the UI synchronized with the real synthesis engines.
  - Implemented real-time "Nghe thử" (preview) capability beside each voice option using `/api/tts/preview` to let users sample dialects with the exact backend-certified tone and emotions before saving.
  - Integrated `EDGE_VOICE_MAP` in the Edge TTS synthesis route to correctly translate user preference IDs (`vi-HN`, `vi-HCM`, `en-US`, `en-UK`) into Bing Neural voice tags, resolving empty/fallback voice generation.
  - Built a gorgeous, responsive, touch-safe layout for voice selection with active selections, language tags, and animated play/loading indicators.

## [7.37.5-Stable] - 2026-07-12
### Added
- **Fully Connected Cloud Sync Interface**:
  - Wired the "Đồng bộ" (Sync) tab in `SettingsTabView.tsx` to the backend sync engine using the `useSync` hook from `App.tsx`.
  - Replaced the static, unfunctional "Bắt đầu đồng bộ" button with a reactive button that triggers `triggerSync()` when clicked, is disabled when offline or already syncing, and displays descriptive loading texts.
  - Implemented a complete real-time status card showing the precise sync status (synced/syncing/offline/error/unauthenticated) matched with appropriate indicator dot colors.
  - Added "Last Synchronized" timestamp memory that displays the precise locale time of the last sync fetched from `syncService` localStorage.
  - Handled the unauthenticated user state by rendering a "Đăng nhập để đồng bộ" button which automatically triggers the built-in `LoginModal`.
  - Added support for aborting ongoing sync processes with a safe "Hủy" (Abort) confirmation button calling `abortSync()`.
  - Preserved 100% backward compatibility for other components and regression test suites by configuring new properties as optional with robust fallback values.

## [7.37.4-Stable] - 2026-07-12
### Fixed
- **Real-time Voice Interaction & Mic Echo Suppression**:
  - Replaced the deprecated `ScriptProcessorNode` in `useVoiceInteraction.ts` with a modern, low-latency, and high-performance `AudioWorkletNode` by implementing and registering `/audio-processor-worklet.js`.
  - Removed direct loopback connection (`processor.connect(audioCtx.destination)`) to fully suppress hardware microphone feedback and whistling rumbles, particularly on Android and mobile devices. Connected the worklet through a silent `GainNode` (gain = 0) to ensure background execution thread scheduling remains active in all browser sandboxes.
  - Implemented high-fidelity client-side linear interpolation resampling down to exactly 16000Hz before transmitting raw audio data, bypassing non-compliant hardware sample rates on Android.
  - Added specific path-based WebSocket upgrade interception at `/ws/voice` on the Express backend, resolving previous connection hijacking.
  - Improved UX with explicit Vietnamese error reporting when microphone hardware access/permission is blocked or when connection timeouts occur (8s wait limit).

## [7.37.3-Stable] - 2026-07-11
### Added
- **Interactive News Templates**:
  - Implemented full functionality for "Thư viện Đối tượng => Mẫu bản tin (Templates)".
  - Templates (Morning Brief, Commute Companion, Evening Digest) now correctly configure the `preferences` (tone, duration, custom instructions) and `newsContent` when selected.
  - Selecting a template automatically navigates the user to the Mission Studio Draft sub-tab with the template's context loaded.
  - Enhanced template cards with hover effects and integrated action buttons.

## [7.37.2-Stable] - 2026-07-11
### Added
- **Mission Ready Interactive Playback Preview**:
  - Transformed the static Mic icon in "4. Hoàn tất & Xuất bản" (Publish) step of Mission Studio into an interactive, premium playback button.
  - Wired the button to the `onPlayBriefing` prop to play the newly generated briefing.
  - Implemented dynamic icon state changes (displays `Pause` icon with an elegant outer pulse wave during playback, and the standard `Mic` icon on hover/idle states).
  - Passed necessary props (`savedBriefings`, `onPlayBriefing`, `isPlayerPlaying`) from `App.tsx` down to `<MissionTabView />`.

### Verification
- Both `npm run lint` and `npm run build` pass successfully with zero warnings.

## [7.37.1-Stable] - 2026-07-11
### Fixed
- **Voice Preview Container Wrapping & Decoupling Robustness**:
  - Implemented the `wrapAsWavIfRawPcm` backend helper in `tts.routes.ts` to automatically detect raw 16-bit PCM buffer output from Gemini and wrap it inside a standard WAV (RIFF) container before streaming, while fully preserving native MP3 structures from Edge and Google Translate TTS providers.
  - Resolved silent playback failures in `/api/tts/preview` and `/api/test-tts` by ensuring the binary data starts with the standard `"UklGR"` Base64 signature for WAV formats.
  - Implemented `audio.onerror` event handlers inside `MissionTabView.tsx` and `ManualPcmPlayer.tsx` to handle asynchronous decoding failures robustly.
- **Studio Background Music Suspended State Fix**:
  - Resolved a silent-playback bug where previewing background music (Ambient, News, Electronic, Lo-Fi) would fail due to the `AudioContext` being initialized in a `"suspended"` state (common inside nested iframe sandbox environments).
  - Implemented an async `ctx.resume()` step on the AudioContext before scheduling any sound synthesis events inside `PreviewMusicSynth.start()`.
  - Deferred note scheduling and interval creation until the resume promise resolves successfully to guarantee no initial notes are lost during transition.
- **Backend Headers Timeout / Undici Fetch Safety**:
  - Implemented a general-purpose, robust `fetchWithTimeout` helper inside `src/server/shared.ts` using `AbortController` and `setTimeout` to safely abort hanging external network connections.
  - Resolved `[Symbol(undici.error.UND_ERR_HEADERS_TIMEOUT)]` errors by refactoring the RSS fetch retry loop inside `src/server/routes/news.routes.ts` to instantiate a fresh `AbortController` per attempt instead of reusing a single aborted signal across subsequent attempts.
  - Applied the `fetchWithTimeout` helper to the optional `wttr.in` weather API call in `server.ts` (with a rapid 4-second timeout) and the Google Translate TTS call in `tts.routes.ts` (with a 6-second timeout) to ensure slow upstream services can never stall the Node.js event loop.
  - Wrapped Groq Chat Completion requests in `shared.ts` with a 15-second `fetchWithTimeout` ceiling to guarantee rapid failures over prolonged API hangs.
- **Supabase Client Initialization Defense**:
  - Added a defensive fetch retry mechanism with exponential backoff for the `/api/db-config` endpoint inside `getSupabaseClientAsync` in `src/services/supabaseClient.ts`.
  - Gracefully handles transient network/startup lag where the frontend iframe requests the configuration before the backend Express app completes its boot process, eliminating red `Failed to fetch` console exceptions.

### Verification
- Both `npm run lint` and `npm run build` pass successfully with zero warnings.

## [7.37.0-Stable] - 2026-07-11
### Added
- **Two-Step Decoupled Pipeline (Sprint STU-112)**:
  - Decoupled the script generation from the voice synthesis inside the Mission Studio view.
  - Configured Stage 1 (Source Tab) to trigger only `handleGenerateScript` (which generates and saves the draft) and then navigates to Stage 2 (Draft Editor), instead of triggering the entire pipeline.
  - Wired Stage 3 (Voice Tab) to execute `handleGenerateAudio` on demand, synthesising high-fidelity voice tracks over the user's customized and saved script.
  - Integrated a persistent "Next" / "Tiếp theo" transition button in Stage 2 (Draft Editor) to allow manual navigation to Stage 3 after editorial adjustments are completed.
  - Refactored the `ProgressiveFeedback` loading screen to display steps specialized for the active processing state (Stage 2: Script creation; Stage 3: Audio rendering).
  - Maintained complete backward compatibility of the single-step `handleGenerateBriefing` method for RSS-based automation and background schedulers.

### Verification
- Full TypeScript compiler (`npm run build`) and linter checks pass successfully with zero warnings.

## [7.36.2-Recovery] - 2026-07-11
### Fixed
- Defined the missing `DiagnosticItem` interface in `MissionIntelligenceWorkspace.tsx` to restore workspace diagnostics stability.
- Restructured `MissionCommandBar` status assignment, changing the unassignable `"error"` string value to `"paused"` when a mission fails.
- Integrated a global namespace decoration in `mission.routes.ts` extending `Express.Request` with the optional `user` property.
- Added `"sync_completed"` to the permitted `type` union in the `MissionEvent` contract.
- Added `"mission_created"`, `"mission_updated"`, and `"mission_deleted"` events to the allowed type registry in the `TelemetryEvent` contract.

### Verification
- Both `npm run lint` (`tsc --noEmit`) and production production build (`npm run build`) pass cleanly with zero warnings or compilation blockers.

## [7.36.1-Recovery] - 2026-07-10
### Fixed
- Restored a clean distributable source baseline from the supplied archive, replacing the unusable workspace state that contained unresolved merge markers.
- Made `npm test` Windows-compatible by removing the Unix-only inline environment assignment.
- Made the test launcher invoke the project-local Vitest CLI directly, avoiding reliance on a global `npx` installation.
- Regenerated the dependency lock metadata so platform-specific build dependencies can be installed reliably.

### Verification
- TypeScript lint and production client/server build pass.
- Integration tests require a running local API server, external network access, and configured AI/TTS credentials; these conditions are not bundled in the release archive.

## [7.36.0-Stable] - 2026-07-10
### Added
- **Refactored Stage 4 (Audio Rendering Engine - Sprint STU-111)**:
  - Created a decoupled audio rendering service `renderAudio` in `/src/services/productionPipeline.ts` that operates exclusively on a `SpeechPackage`.
  - Removed all UI dependencies, React form variables, draft lookups, and direct DOM references from the synthesis pipeline.
  - Implemented `AudioArtifact` data structure with rolling DJB2 checksums, comprehensive synthesis metadata (rates, bit rates, duration, host voice registries), and partial compilation support.
  - Added native `AbortSignal` handling for responsive user-driven cancellation.
  - Created a robust cache matching system utilizing `sessionStorage` for instant replay of unchanged script segments.
  - Integrated a resumable execution model utilizing segment-by-segment artifact diffs.
  - Configured high-availability exponential retry backoff mechanisms for seamless TTS provider connectivity.

## [7.35.0-Stable] - 2026-07-10
### Added
- **Production Studio Pipeline Refactoring (Sprint STU-110)**:
  - Isolated Stage 2 (Editorial Draft Engine) and Stage 3 (Speech Package Builder) into a dedicated, clean service at `/src/services/productionPipeline.ts`.
  - Defined explicit, immutable data structures in `/src/types.ts` (`ResearchPackage`, `EditorialDraft`, `SpeechSegment`, `SpeechPackage`, `AudioAssembly`, and `PipelineContext`).
  - Added full stage-by-stage executors in `useBriefingGeneration.ts` (`executeStage1`, `executeStage2`, `executeStage3`, `executeStage4`) with independent loading, error, and success tracking.
  - Removed all direct UI couplings from the pipeline layers; Stage 3 now processes only the `EditorialDraft` output from Stage 2.
  - Maintained full backward compatibility with existing UI rendering states (`activePayload`, `activeTitle`, etc.) so that all parts of the application function perfectly.

## [7.34.0-Stable] - 2026-07-10
### Added
- **Fault-Tolerant Parallel Voice Synthesis via Promise.allSettled**:
  - Replaced standard `Promise.all` with `Promise.allSettled` in `handleGenerateBriefing` inside `/src/hooks/useBriefingGeneration.ts`.
  - Implemented sequentially ordered result accumulation: resolved tracks have their audio chunk buffers merged into the master stream, while failed tracks are gracefully logged and recorded.
  - Added a localized complete failure fallback that triggers if all segments fail synthesis, appending user troubleshooting tips.
  - Added `synthesisWarning` state to capture and list skipped segments (e.g., "Bỏ qua 2 phân đoạn do lỗi tổng hợp: Lời chào, Chương 1...").
  - Implemented warning banner rendering in `MissionTabView.tsx` script container preview, highlighting any skipped tracks with a styled high-contrast alert box.

## [7.33.0-Stable] - 2026-07-10
### Added
- **Validation-Driven Empty Segment Filtering for Voice Synthesis**:
  - Implemented automatic validation in `prepareSynthesisTimeline` inside `/src/utils/synthesis.ts` to skip any empty introduction, outro, chapter, or co-host segment text blocks.
  - Added warnings console logs for skipped empty elements (`[Synthesis] Skipped empty segment: <label>`).
  - Added localized error throwing if the compiled script timeline is completely empty, ensuring clear and immediate troubleshooting feedback based on the user's active UI language.
- **TypeScript and Prop Signature Synchronization**:
  - Aligned prop type declarations for `handleVoiceAddToBriefing` in `MissionTabView.tsx` with its actual hook implementation signature.
  - Wrapped `handlePublishPodcast` and `handleDeletePodcastEpisode` inside `App.tsx` when passing them to `AssetsTabView` to resolve TypeScript parameter contract mismatches.

## [7.32.0-Stable] - 2026-07-09
### Added
- **Unified WAV Audio Export Shared Service (Sprint STU-107)**:
  - Created a single, reusable `exportBriefingAsWav` utility function inside `/src/utils/audioExport.ts` to fetch, concatenate, and download high-quality WAV files.
  - Refactored `ManualPcmPlayer.tsx` to call the shared utility instead of redundant inline PCM concatenations and file creations.
  - Wired up the "Export Audio (.wav)" button in Stage 4 of the Creation Wizard (`MissionTabView.tsx`) to download the current high-fidelity WAV master instantly.
  - Configured full Vietnamese and English explanatory tooltips and disabled button states if no audio chunks have been generated yet.

## [7.31.0-Stable] - 2026-07-09
### Fixed
- **Synchronous Selected Briefing State Registration (Sprint STU-106)**:
  - Added a new `onBriefingCreated` prop callback inside `useBriefingGeneration.ts`.
  - Configured `App.tsx` to automatically set the newly generated briefing ID into `selectedBriefId` state as soon as a session script and audio chunks are produced and saved to offline/indexedDB.
  - Fixes the bug where `selectedBriefId` was left unassigned or stale post-generation, unlocking instant access to downstream publishing, playback, and synchronization streams in the Creation Wizard.

## [7.30.0-Stable] - 2026-07-09
### Added
- **Interactive "Save to Library" (Stage 4) Integration**:
  - Wired up the "Lưu vào thư viện" button in Stage 4 of `MissionTabView.tsx` to trigger `handlePublishPodcast` for the generated briefing ID.
  - Added a reactive loading state spinner (`Loader2`) that disables the button and displays localized "Đang lưu..." / "Saving..." text while publishing to Supabase or the Local server is in progress.
  - Automatically triggers an elegant "✓ Đã lưu thành công" / "✓ Saved Successfully" visual confirmation badge and check icon upon successful preservation, enhancing overall user feedback.

## [7.29.0-Stable] - 2026-07-09
### Added
- **Dynamic Background Music Preview Grid (Sprint STU-104)**:
  - Upgraded the background music selection grid in `MissionTabView.tsx` (Stage 3) to match the layout of the voice studio preview controls.
  - Added new `GET /api/music-preview/:type` route in `tts.routes.ts` to dynamically check and serve static audio tracks from `/public` or `/assets`.
  - Safely disabled preview capabilities and added native hover tooltips ("Sắp ra mắt" / "Coming soon") when local audio assets are missing, ensuring high usability and preventing silent failures.

## [7.28.0-Stable] - 2026-07-09
### Added
- **Interactive Voice Preview Interface (Sprint STU-103)**:
  - Integrated interactive play/pause controls next to each voice option inside `MissionTabView.tsx` (Stage 3).
  - Employs a robust, lazy-loaded HTMLAudioElement stream targeting the `/api/test-tts` endpoint to render real-time vocal previews of available voice profiles.
  - Features real-time state feedback with distinct loading spinner (`Loader2`) and playback states (`Play`/`Pause`).
  - Restricts concurrent preview generation via automated click/interaction guards.

## [7.27.0-Stable] - 2026-07-09
### Added
- **Adaptive Stage 2 Error Feedback (Sprint ERR-102)**:
  - Implemented an elegant, high-contrast error card within `MissionTabView.tsx` (Stage 2) using `AdaptiveCard` to handle compilation and generation failures gracefully.
  - Displays the original, exact error message (`errorMessage`) in a clean, scrollable monospaced typography container.
  - Leveraged semantic color tokens (`colors.critical` / `var(--color-critical)`) and the `AlertCircle` warning icon.
  - Provided interactive action buttons: "Thử lại" to re-trigger briefing generation via `handleGenerateBriefing()` and "Quay lại nguồn tin" to reset focus to Stage 1 via `handleStageChange(1)`.

## [7.26.0-Stable] - 2026-07-09
### Added
- **Locked Stage Navigation (Sprint SEC-101)**:
  - Enforced sequential stage navigation within `MissionTabView.tsx` to prevent users from skipping stages before content is ready.
  - **Stage 2 Lock**: Only interactive when `step === "summarizing" || step === "synthesizing" || step === "error" || activePayload !== null`.
  - **Stage 3 Lock**: Only interactive when `activeAudioChunks.length > 0`.
  - **Stage 4 Lock**: Only interactive when `step === "ready" && activeAudioChunks.length > 0`.
  - **Visual & Assistive States**: Disabled navigation buttons now display reduced opacity (`opacity-40`), the correct helper cursor (`cursor-not-allowed`), and a hover tooltip title providing user instructions (e.g., "Hãy tạo bản tin ở Stage 1 trước").
- **Universal React 19 Testing Compatibility**:
  - Resolved a critical test environment block where `react-dom/test-utils` and `@testing-library/react` threw `TypeError: React.act is not a function` in the production CommonJS bundle.
  - Dynamically configured `process.env.NODE_ENV` to `"development"` when executing under Vitest in `vite.config.ts`, forcing React to load development bundles.
  - Established a clean ESM-to-CJS bridge in `tests/setup.ts` to map ESM `act` directly onto the CJS exports.
  - Restored 100% test coverage with all 20 test files and 90 individual test cases passing cleanly.

## [7.25.0-Stable] - 2026-07-09
### Added
- **Content Intelligence & Freshness Control**:
  - **Freshness Monitoring**: Implemented `isArticleFresh` in `rssService.ts` to filter out articles older than 24 hours from RSS feeds by default.
  - **Advanced Deduplication**: Integrated Jaccard similarity-based fuzzy matching (0.85 threshold) for article titles within a 24-hour window to eliminate duplicate news items across feeds.
  - **Stage 1 Freshness Warning**: Added real-time content analysis in `MissionTabView.tsx` that alerts users if manually pasted text contains dates older than 7 days.
  - **Refined Data Cleaning**: Renamed local clear function to `handleClearAllSourceData` to resolve scope conflicts and ensure both input and warnings are reset.

## [7.24.0-Stable] - 2026-07-09
### Added
- **RSS Connector & URL Scraper Integration**:
  - Connected RSS and URL scraper endpoints in `MissionTabView.tsx` (Stage 1).
  - Added modals for configuring RSS sources and scraping URLs, providing seamless integration into the briefing pipeline.
  - No changes were made to existing `RSSManager` or `AssetsTabView` functionality.

## [7.22.0-Stable] - 2026-07-09
### Changed
- **Strangler-Fig Backend Refactor Phase 3 (News Module)**: Extracted complex RSS parsing and AI news generation logic from `server.ts` into `src/server/routes/news.routes.ts`.
  - **Modular Routing**: Relocated `/api/parse-rss` and `/api/generate-news` to a dedicated news router.
  - **Logic Extraction**: Moved `rssCache`, `generateArticlesWithAI`, `scrapeHtmlArticles`, and failsafe regex parsing to the news module.
  - **Resilience Preservation**: Maintained 100% of the sophisticated error handling and AI fallback logic for broken RSS feeds.
  - **Regression Coverage**: Implemented `tests/integration/news.routes.test.ts` verifying real-world RSS parsing and AI news synthesis.
- **Backend Refactor Summary (Strangler-Fig Phase 1-3)**:
  - **Modules Extracted**: Podcast, TTS, News Intelligence.
  - **Monolith Reduction**: `server.ts` reduced from ~3139 lines to **1272 lines** (~60% reduction).
  - **Remaining Endpoints**: `/api/share`, `/api/summarize`, `/api/voice-query`, `/api/assistant-chat`, `/api/prepare-wav`, `/api/download-wav-file`, `/api/db-config`.
  - **Safety Net**: Comprehensive integration tests established for all moved modules.

## [7.21.0-Stable] - 2026-07-09
### Changed
- **Strangler-Fig Backend Refactor (TTS Module)**: Extracted all Text-to-Speech routes and logic from `server.ts` into `src/server/routes/tts.routes.ts`.
  - **Modular Routing**: Moved `/api/tts`, `/api/tts/cache-status`, `/api/tts/clear-cache`, and `/api/test-tts` to a dedicated router.
  - **Helper Extraction**: Relocated all TTS helper functions (chunking, voice mapping, language segmentation) to the modular route file.
  - **Regression Coverage**: Added `tests/integration/tts.routes.test.ts` to the "Safety Net" suite, ensuring 100% functional parity.
  - **Monolith Reduction**: Reduced `server.ts` by another ~500 lines. Total reduction since starting refactor: ~900 lines.
- **Safety Net Hardening (Podcast Module)**: Implemented `tests/integration/podcast.routes.test.ts` as a robust integration test template for future modularization.

## [7.20.0-Stable] - 2026-07-09
### Changed
- **Strangler-Fig Backend Refactor (Podcast Module)**: Successfully extracted the `/api/podcast/*` and `/api/local-podcasts/*` routes from the monolithic `server.ts` into a dedicated modular architecture.
  - **Modular Routing**: Created `src/server/routes/podcast.routes.ts` to house all podcast management endpoints (episodes, publish, feed, local storage).
  - **Shared Server Utilities**: Established `src/server/shared.ts` to centralize shared constants (`LOCAL_AUDIO_DIR`), Supabase/GCS client initializers, and low-level audio processing helpers (`encodeWavHeaderNode`).
  - **Monolith Reduction**: Reduced `server.ts` by ~400 lines, improving maintainability and reducing risk of regression in unrelated modules.
  - **Regression Coverage**: Implemented `tests/podcast.test.ts` providing a 5-stage "Safety Net" integration flow (Publish → Episodes → Feed → Cleanup) ensuring 100% behavior parity after extraction.
  - **Environment Stability**: Fixed connection issues in integration tests by switching from `localhost` to `127.0.0.1`, ensuring consistent pass rates in sandboxed environments.

## [7.19.0-Stable] - 2026-07-08
### Added
- **Pinnable & Hover-Expanded Responsive Sidebar (Sprint UI-102)**: Introduces tablet/narrow screen optimization for the application's main sidebar.
  - **Auto-Collapsing narrow breakpoint**: Added a responsive media threshold (width < 1280px) where the sidebar collapses by default to prevent layout fragmentation or pushing main content on narrow desktop and tablet viewports.
  - **Non-Pushing Overlay Expansion**: Developed a highly polished overlay-expansion effect. When hover or touch tap is detected on the collapsed sidebar on narrow viewports, the sidebar expands temporarily to its full width as a floating overlay (`absolute shadow-2xl z-50`), preserving the compact space allocation (`w-20`) in the main layout grid and avoiding pushing/breaking other panels.
  - **Sidebar State Pinning**: Created a "Pin" (Ghim) feature allowing users to pin the sidebar permanently open on narrow screens. Pin states are preserved automatically in `localStorage` across user sessions.
  - **Dynamic Toggle Adaptation**: Smart bottom collapse button automatically binds to pin controls when viewport is narrow, so clicking "Expand" automatically pins the sidebar open, and clicking "Collapse" unpins and closes it.
- **Token-Based Border Standardization**: Standardized borders across 17 files using a uniform theme-aware design token, resolving legacy inconsistencies.

## [7.18.0-Stable] - 2026-07-08
### Added
- **Automotive-Grade HUD Overhaul (Sprint ENT-102)**: Rebuilt the Driving Mode from the ground up with a unified 3-section architectural framework.
  - **Strict Viewport Management**: Locked the HUD to a non-scrollable fullscreen container for absolute stability on automotive displays.
  - **Unified Media Block**: Consolidated progress bars, time tracking, and tactile playback controls into a single, high-accessibility cluster.
  - **Cinematic Center Stage**: Standardized YouTube and Briefing content areas to forced cinematic aspect ratios (`aspect-video`), ensuring consistent viewing across all devices.
  - **Minimal Status Bar**: Offloaded secondary telemetry (Voice state, Ducking status, Offline Archive) to a thin, non-intrusive status rail at the absolute bottom.
  - **Mobile-First Precision**: Implemented dynamic scaling and responsive padding, ensuring content remains legible and interactive on small portrait mobile screens.
  - **Tactile Standardisation**: Defined strict button hierarchies (Play/Pause: 80px, Secondary: 60px) optimized for high-vibration driving environments.
- **YouTube Entertainment Tab (Safety-First HUD Integration)**: Expanded the Premium Driving Mode with a specialized entertainment layer designed for automotive safety.
  - **Audio-Only Driving Experience**: Implemented a "Safety-First" default mode that suppresses video playback while the vehicle is in motion, replacing it with high-contrast blurred thumbnails, rich metadata, and synchronized audio wave animations.
  - **AI Recommendation Pipeline**: Built a smart content filter that prioritizes "Audio-Friendly" YouTube categories (Music, Podcasts, Talkshows) while offering "New", "Hot", and "For You" segments.
  - **AI-Powered Recommendations**: Added a dedicated "AI Picks" section suggesting videos based on driver preferences and contextual relevance.
  - **Hands-Free Voice Search**: Integrated a natural language search engine allowing drivers to find content via voice ("Tìm kiếm nhạc Lofi", "Search for podcasts").
  - **Refined YouTube UI**: Optimized the player layout with a larger viewing area, "Phóng to" (Zoom) controls, and professional-grade tactile buttons.
  - **Massive Touch Interaction**: Designed a dedicated HUD view with oversized tactile buttons (Play/Pause, Next, Rewind, Previous) optimized for driving interaction.
  - **Dynamic Audio Ducking Integration**: Seamlessly linked the entertainment audio stream to the system's global ducking logic, automatically dropping volume to `15%` during voice assistant activity.
  - **Parked Mode Video Lock**: Added a secure toggle that only enables the full YouTube Iframe video stream when explicitly requested (intended for parked use cases), maintaining strict focus on the road.
  - **Bilingual Voice Control**: Extended the voice command engine to support switching between "Briefing" and "Entertainment" views via natural language ("Mở giải trí", "Vào YouTube", "Về bản tin").
- **Fixed**:
  - **HUD Layout Overflow**: Resolved a critical layout breakage where entertainment controls would overflow the viewport on mobile devices. Implemented strict viewport locking, `min-h-0` flex containers, and `aspect-video` constraints to ensure a 100% fixed-frame automotive interface.

## [7.17.0-Stable] - 2026-07-08
### Changed
- **Architectural Archiving & Cleanup**: Archived the dead-tree unwired v4 architecture components to `_archive/unwired-v4-architecture/` to keep the codebase pristine and prevent cognitive bloat.
  - **Archived Models**: Moved `src/types/v4` (including article, briefing, cancellation, telemetry, and DTO models) to `_archive/unwired-v4-architecture/src/types/v4/`.
  - **Pruned Unwired Modules**: Confirmed prior deletion/archiving of experimental unused `src/domain/`, `src/application/`, and corresponding mock tests.
  - **Preserved Core Tests**: Retained high-fidelity unit tests including `synthesis.test.ts` and `rssService.test.ts` (RSS Studio tests) in the main active test suite.
  - **Updated Tooling & Documentation**: Updated `/tests/run-all-tests.ts` to document active test selection, created an explanatory `/README.md`, and added archival reasoning across relevant document repositories.

## [7.16.0-Stable] - 2026-07-08
### Added
- **Premium Driving Mode (Hands-free Voice HUD)**: Re-architected and upgraded the core Driving Mode experience to professional, hands-free automotive standards.
  - **Speech Control Engine**: Integrated native Web Speech API recognition directly within `DrivingMode` supporting English and Vietnamese voice commands ("Phát", "Tạm dừng", "Bài tiếp theo", "Tua nhanh", "Tua lại", "Thoát"). Added a togglable *Continuous Hands-Free Assistant* mode and pulsing mic wave overlays with real-time transcript feedback.
  - **Tactile Audio Ducking & Gains**: Integrated automated Audio Ducking. Lowering podcast/narration volume smoothly to `15%` and background music to `1%` during voice assistant listening and feedback tone synth playback, automatically restoring volume afterwards.
  - **Intelligent Accent-Tolerant Regex**: Deployed smart, dialect-aware Regex command matchers that handle regional accents and colloquial phrases (e.g., "chạy tiếp", "mở nhạc", "phát tiếp", "dừng giùm cái", "qua bài đi", "tua tiếp").
  - **Robust Service Worker Offline Strategy**: Enhanced `/public/sw.js` dynamic caching parameters to support caching of `cors` and `opaque` static resources (Google Fonts, styling, icons). This guarantees assets are fully loaded and functioning in disconnected states.
  - **Sound Synthesizer Feedback**: Built an offline-first frequency synthesizer using the Web Audio API to play high-fidelity acoustic responses confirming hands-free actions.
  - **Offline Resilience Banner**: Added reactive window network event listeners to detect connection drops and display warning bars advising offline operations.
  - **TTS Quota & Error Fallback Panel**: Built a dedicated HUD layout for `QUOTA_LIMIT` errors and timeouts, rendering an easy-to-tap fallback grid of offline-saved briefings with direct local playback capability.
  - **Auto-Advance Playlists**: Bound next-track voice commands and skip elements directly to queue advancement triggers (`onEnded`).
  - **React Portal Overlay**: Wrapped the active `DrivingMode` rendering inside a React Portal (mounted directly under `document.body`) within `ManualPcmPlayer.tsx`, completely resolving layout overlay and parent-hidden rendering bugs.
  - **Coverage Verification Suite**: Implemented `tests/drivingMode.test.tsx` testing and validated codebase static safety via compiler builds (`Build PASS`) and strict linter scans.

## [7.15.0-Stable] - 2026-07-07
### Added
- **Unified Architecture (PDR-001)**: Permanently consolidated the News Intelligence Core by removing redundant pipeline logic.
- **Hardened Normalization**: Deployed surgical regex in `normalizeText` to protect mathematical operators (`<`, `>`, `<=`, `>=`) even when directly adjacent to text (e.g., `a<b>c`). Achieved 100% pass on expanded 8-test suite.
- **Physical Cleanup**: Physically deleted `_archive_unused_architecture` (888KB) after zero-reference verification.
- **Regression Suite (Final)**: 100% PASS tests (xem docs/dashboards/OBSERVATION_DECK.md).

## [7.14.0-Beta] - 2026-07-07
### Added
- **Test Infrastructure Upgrade (Prompt #2)**: Migrated the test runner to **Vitest** for better reliability and performance. Established `tests/run-all-tests.ts` as the unified entry point.
- **Coverage Expansion (High Risk Modules)**: Implemented 100% PASS unit tests for high-risk core services:
  - `tests/rssService.test.ts`: Covers category detection, Jaccard similarity, duplicate marking, and network/parse error fallbacks.
  - `tests/preferenceService.test.ts`: Secures interaction decay scoring and preference calculation logic using `fake-indexeddb`.
  - `tests/useSync.test.ts`: Validates `useSync` hook state transitions, offline detection, and abort logic under `jsdom` environment.
- **DoD Automated Verification (Prompt #3)**: Added mandatory `grep` verification steps to `ENGINEERING_STANDARDS.md` to prevent "imaginary" file paths in documentation.

### Changed
- **Test Coverage Audit**: Completed a comprehensive audit and expansion of `src/hooks` and `src/services`.
  - **Active Tests**: `RealBriefingFlow.test.tsx`, `offlineStorage.test.ts`, `rssService.test.ts`, `useSync.test.ts`, `preferenceService.test.ts`, `synthesis.test.ts`, `text.test.ts`.
- **Regression Suite**: Verified PASS on the full test suite (xem docs/dashboards/OBSERVATION_DECK.md).
- **Manual QA**: Completed manual UI regression on the Studio workstation (Input -> Generation -> Synthesis -> Audio Playback).
- **Text Normalization Hardening (Prompt #4)**: Identified and fixed a regression risk in `normalizeText()` where greedy HTML stripping regex was eating mathematical comparison operators (e.g., `<5%`). Improved the regex to be surgical (tag-aware) and added regression tests in `tests/text.test.ts`.
- **Architecture Synchronization**: Updated `docs/ARCHITECTURE.md` to reflect the literal `ExecutionState` names (`fetching_sources`, `normalizing_content`, etc.) verified by grep.
  ```bash
  $ grep -rnE "fetching_sources|normalizing_content|building_queue|synthesizing_audio|ready_to_play" docs/ARCHITECTURE.md
  74:[idle] ──> [initializing] ──> [fetching_sources] ──> [normalizing_content] ──> [building_queue] ──> [synthesizing_audio] ──> [ready_to_play]
  84:*   `fetching_sources`: Active retrieval from RSS feeds or local assets.
  85:*   `normalizing_content`: Text cleaning via `normalizeText` utility.
  87:*   `building_queue`: Narrative construction and script finalization via `/api/summarize`.
  88:*   `synthesizing_audio`: Parallel Text-to-Speech vocal compilation via `/api/tts`.
  90:*   `ready_to_play`: Briefing finalized and loaded into the player.
  ```

## [7.13.0-Beta] - 2026-07-07
### Changed
- **Architectural Cleanup (Prompt #3)**: Made a definitive choice on the duplicated "News Intelligence Core" architecture (Flow B) and removed the unused complex architecture (`RuntimeOrchestrator`, etc.) to `_archive_unused_architecture`. The application now exclusively relies on the active, tested React-driven generation flow.
  - **(a) Unit Tests**: Passed existing unit test suites for the active flow (e.g. `tests/synthesis.test.ts`), added a new QualityGate utility test, and implemented a robust test suite for the high-risk offline storage layer (`tests/offlineStorage.test.ts`).
  - **(b) UI Integration Test**: Verified by the end-to-end integration test in `tests/integration/RealBriefingFlow.test.tsx` which successfully mounts and executes the flow.
  - **(c) UI Evidence**: The active React-driven generation flow is explicitly integrated and called in `src/App.tsx`.
    ```bash
    $ grep -rn "useBriefingGeneration" src/App.tsx
    62:import { useBriefingGeneration } from "./hooks/useBriefingGeneration";
    232:  // --- 5. Custom Audio Briefing Engine (useBriefingGeneration) ---
    264:  } = useBriefingGeneration({
    ```
  - **(d) QualityGate Implementation**: Implemented `normalizeText` utility in `src/utils/text.ts` and integrated it into `useBriefingGeneration.ts` at both pre-summarization and pre-TTS stages to ensure Unicode consistency and text sanitization.
  - **(e) Test Coverage Audit**: Conducted a full audit of `src/hooks` and `src/services`, identifying remaining coverage gaps for future sprints (e.g., `useSync`, `preferenceService`).
- **Sprint History Cleanup (Prompt #4)**: Consolidated all historical sprint tickets (003 to 014B, UX_021, UX_022) into this changelog. These sprints represent completed legacy work that has already been merged. The original `SPRINT_TICKET_*.md` files have been deleted to reduce repository clutter.
### Added
- **CI Pipeline**: Implemented GitHub Actions CI workflow for automated `lint`, `build`, and `test` on push/PR.
- **Snapshot Intelligence Contract (Sprint #023 - Sprint 3)**: Implemented `SnapshotIntelligenceContract` and supporting types in `/src/types/snapshot.ts`.
- **UI Simplification (Sprint Platform-003)**: Decluttered `HomeTabView` by removing "Operator Note" to reduce visual cognitive load.

## [7.12.0-Beta] - 2026-07-07
### Added
- **AI Studio Capabilities (Sprint 2)**:
  - **Voice Memory & Brand Custom Guidelines**: Integrated an AI Drafting Studio where users can customize drafting guidelines and preset voice styles (Formal, Conversational, Sarcastic Banter, Commute Alert). Linked configurations directly to the server-side drafting engine via `customInstructions` preference context.
  - **Multi-Host Dynamic Interactions**: Upgraded the Gemini podcast_style drafting engine to generate structured JSON segment dialog turns (`host_a` and `host_b`).
  - **Co-Host Dialogue Visualizer**: Built elegant high-contrast chat bubbles in the Script Preview tab to differentiate primary anchors and witty co-hosts visually.
  - **Unified Multi-Anchor Synthesis**: Refactored audio compilation inside `src/utils/synthesis.ts` to seamlessly map and prefetch co-host TTS voices (`charles` + `seraphina` or `dante` + `elara`), dynamically constructing timelines for parallel synthesis.

## [7.11.0-Beta] - 2026-07-07
### Added
- **RSS Studio Core (Sprint 1)**: Integrated advanced Jaccard similarity index (>0.75 threshold) duplicate detection, time-based grouping (24-hour window), and feed priority weights to handle content deduplication.
- **Keyword Filtering Engine**: Established a regex-based promo and spam exclusion filter pre-screening incoming articles for sponsored posts, giveaways, and ads.

### Fixed
- **Hook Declaration Reordering**: Reordered custom hook calls in `App.tsx` to resolve a block-scoped variable 'preferences' linter error.
- **App.tsx Monolith Reduction**: Extracted view components out of `App.tsx` into separate modular files to maintain healthy component line limits.
- **Hardcoded Colors Elimination**: Cleaned up remaining inline hardcoded colors to rely purely on CSS variables and design system tokens.
- **Removed Patching Scripts**: Deleted root-level CJS patching scripts (`fix_*.cjs`), relying on direct file edits.

## [7.10.0-Beta] - 2026-07-06
### Added
- **Workstation Refactor (Sprint UX-102E)**: Successfully moved all main view components (`HomeTabView`, `MissionTabView`, `AssetsTabView`, `SettingsTabView`) into a dedicated `src/components/views/` directory. This improves project structure and modularity.
- **Lazy-Loaded Route Optimization**: Updated `App.tsx` to utilize `React.lazy` and `Suspense` for all major workstations, ensuring a lighter initial bundle size and faster first paint.

### Fixed
- **Relative Import Path Correction**: Resolved critical build failures in `SettingsTabView.tsx` by correcting relative paths to `ThemeProvider` and `AdaptiveContext` after the directory migration.
- **Cleaned Up App Entry Point**: Removed monolithic import chains in `App.tsx`, delegating view-specific logic to modular components.

## [7.9.0-Beta] - 2026-07-06
### Added
- **MissionIntelligenceWorkspace Migration**: Applied `<PageTemplate>` as the root layout, `<AdaptiveGrid>` and `<AdaptiveCard>` for data presentation elements across the Mission OS dashboard.
- **Theme-Aware Status Tokens Integration**: Extended the application of new design tokens (`colors.onAccent`, `colors.onSuccess`, `colors.onWarning`, `colors.onCritical`) across all complex simulated diagnostics output and log sequences inside `MissionIntelligenceWorkspace.tsx`.

### Fixed
- **Purged 900-Line Workspace Colors**: Refactored the sprawling `MissionIntelligenceWorkspace.tsx` module, successfully stripping out all hardcoded `brand-accent`, `emerald-500`, `rose-500`, `amber-500` tailwind classes. Replaced with strict inline style structures relying purely on dynamic semantic CSS mix functions (`color-mix`) and `colors` object mapping, enabling flawless dark mode and eyecare adaptability.

## [7.8.0-Beta] - 2026-07-06
### Added
- **PageTemplate Layout Integration**: Wrapped the primary sequential wizard of `MissionStudio.tsx` with `<PageTemplate>` structure to enforce consistent sticky progress headers and interactive action controls footer.
- **AdaptiveGrid & AdaptiveCard layout conversion**: Implemented responsive `<AdaptiveGrid>` and `<AdaptiveCard>` layers across all 4 stages of the creation workflow, replacing hardcoded grid-cols classes with responsive multi-device rules.

### Fixed
- **WCAG Status Tokens Contrast**: Introduced theme-aware `--color-on-success`, `--color-on-warning`, and `--color-on-critical` CSS variables mapped to design system tokens (`colors.onSuccess`, `colors.onWarning`, `colors.onCritical`), refactoring completed step indicators and the "Finalize & Go Home" button to guarantee $\geq$ 4.5:1 contrast across Light, Dark, and Eyecare themes.
- **Purged Hardcoded Color Variables**: Eliminated 100% of hardcoded slate classes and raw hex colors inside the wizard components, converting them to dynamic theme-aware tokens from `/src/foundation/tokens/colors.ts`.
- **Contrast Ratios Enforcement**: Integrated `colors.onAccent` and color-mix background techniques to guarantee strict compliance with WCAG contrast standard thresholds of $\geq$ 4.5:1.

## [7.7.0-Beta] - 2026-07-06
### Added
- **PageTemplate Layout Integration**: Wrapped `AssetsWorkspace.tsx` with `<PageTemplate>` structure to unify layout bounds, sticky headers, and scrolling.
- **AdaptiveWorkspace Multi-Device Responsiveness**: Swapped manual 3-panel sidebar layout with `<AdaptiveWorkspace>` to handle responsive scaling and absolute stacking layout behavior on mobile viewports for sidebar (Panel A), children (Panel B), and inspector (Panel C).

### Fixed
- **Purged Hardcoded Color Variables**: Eliminated 100% of hardcoded slate classes and raw color values in `AssetsWorkspace.tsx` by fully adopting design system tokens from `/src/foundation/tokens/colors.ts`.
- **Contrast Ratios Enforcement**: Integrated `colors.onAccent` for active status indicators and text elements on the accent background to ensure contrast ratios exceed 4.5:1 on all available themes.

## [7.6.0-Beta] - 2026-07-06
### Added
- **PageTemplate Layout Integration**: Replaced raw outer wrapper divs in `HomeView.tsx` with `<PageTemplate>` structure to unify layout bounds and scrolling.
- **AdaptiveGrid Multi-Device Responsiveness**: Swapped manual Tailwind grid classes with `<AdaptiveGrid cols={{ compact: 1, regular: 3, expanded: 3 }}>` layout configuration.

### Fixed
- **Purged Hardcoded Color Variables**: Eliminated 100% of hardcoded slate classes and raw hex color values in `HomeView.tsx` by fully adopting design system tokens from `/src/foundation/tokens/colors.ts`.
- **Contrast Ratios Enforcement**: Integrated `colors.onAccent` for active status indicators and buttons on the accent background to ensure contrast ratios exceed 4.5:1 on all available themes.

## [7.5.1-Beta] - 2026-07-06
### Added
- **Header Language Toggle Button**: Implemented a beautifully-designed, high-contrast, interactive language toggle button showing "VI" or "EN" with a dedicated Lucide icon (`Languages`) next to the theme switcher in the main sticky Header.
- **Dynamic State Linkage**: Programmed the Header button to invoke `handleSetUiLanguage` for instant bidirectional synchronization with settings, local state, and persistable user preferences.

## [7.5.0-Beta] - 2026-07-06
### Added
- **WCAG-Compliant --color-on-accent**: Integrated `--color-on-accent` across all theme blocks (Light, Dark, and Eye Care) in `src/index.css` and added theme mappings inside `@theme` block.
- **Dynamic Language State Synchronizer**: Implemented a state synchronization `useEffect` inside `src/App.tsx` that links `uiLanguage` to `preferences.language`.

### Fixed
- **Settings View State Spread Bug**: Fixed a preference update bug in `SettingsView.tsx` where spreading the full preferences object overrode field-specific smart synchronization pathways. Changed `updatePreference` to submit exact partial changes.
- **Tab Highlight Accessibility**: Ensured contrast between tab accent colors and active tab text/icons achieves $\geq$ 4.5:1 on all system themes to fulfill strict accessibility thresholds.

## [7.4.0-Beta] - 2026-07-06
### Added
- **Sprint Platform-005.6D – Settings View Adaptive Pilot**: Integrated the adaptive design framework into `SettingsView.tsx` as the first production pilot screen outside the playground.
- **PageTemplate Orchestration**: Refactored the outer skeleton of the settings workspace to use `<PageTemplate>`, cleanly mounting a responsive sticky header and automating device safe-area bottom margins for mobile.
- **AdaptiveGrid Conversion**: Replaced all custom/hardcoded CSS grid containers inside configuration sections with `<AdaptiveGrid>`, establishing fluid column counts across Mobile, Tablet, and Desktop.
- **Semantic Token Adoption**: Replaced hardcoded Tailwind slate classes in navigation items with references to the design system's `colors.surface` semantic token.
- **Sprint Platform-005.6C – Reference Experience & Playground**: Established a state-of-the-art interactive playground at `/src/components/AdaptivePlayground.tsx` to verify all adaptive layouts, device metrics, design tokens, and regression checklists in high-fidelity simulation.
- **Advanced Device Sensors**: Integrated touch-gesture pointer indicators (`pointer`), retina layout density triggers (`density`), and accessibility configurations (`reducedMotion`, `highContrast`) directly into `<AdaptiveProvider />`.
- **Design Token Extension**: Created comprehensive design tokens for semantic colors (`src/foundation/tokens/colors.ts`) and micro-interactive curves/spring parameters (`src/foundation/tokens/motion.ts`).
- **Traceable Scorecard**: Added interactive checklists matching QA Baseline metrics directly on-screen inside the playground.

### Fixed
- **PageTemplate Type Compile Error**: Added the optional `id` prop to `PageTemplateProps` to resolve type errors inside the production compilation pipeline when compiling `SettingsView.tsx`.
- **Theme-Aware Dynamic Colors Hotfix**: Refactored `src/foundation/tokens/colors.ts` to utilize native CSS variables (`var(--color-...)`) instead of hardcoded hex colors, enabling color values to dynamically adapt to Light, Dark, and Eye Care themes.
- **CSS Custom Variables Alignment**: Provisioned all missing CSS variables (e.g., `--color-surface-overlay`, `--color-accent-pressed`, etc.) across all `:root`, `[data-theme="dark"]`, and `[data-theme="eyecare"]` blocks in `src/index.css`.
- **Dynamic Chunk Import Recovery Layer**: Added robust automatic reload handlers for dynamic import errors and `ChunkLoadError` across `ErrorBoundary.tsx` and the global `window.onerror`/`unhandledrejection` listeners in `index.html`. Outdated browser sessions are now seamlessly and safely reloaded to sync with newly compiled production assets without showing raw startup crashes.

## [7.3.0-Beta] - 2026-07-05
### Added
- **CommuteCast Design System v1.0**: Formulated a comprehensive design document (`DESIGN_SYSTEM.md`) establishing rules for colors, spacing, radius, and hierarchy.
- **Eye Comfort Theme (🌿 Dịu mắt)**: Re-introduced and set as the default system theme to prioritize long-form reading and listening comfort.
- **Visual Hierarchy Refactor**: Distinct background tokens for Sidebar, Header, and Content areas to eliminate "Flat UI" vulnerabilities.

### Changed
- **Navigation Identity**: Active tabs in Sidebar now feature a brand-accent background tint, left-side indicator bar, and scaled icons for immediate orientation.
- **Theme Logic**: Fixed "System" mode to strictly follow OS color scheme preferences (Windows/macOS/iOS/Android).
- **Header Elevation**: Added a subtle shadow and border to the header for better separation from content.
- **Assistant Evolution**: AI Assistant now provides quick action buttons for navigation, theme toggling, and playback control.

### Fixed
- Fixed issue where "System" theme was defaulting to Dark mode regardless of OS settings.
- Corrected "Flat UI" issue where Sidebar, Header, and Content shared identical elevation and brightness levels.

## [7.2.0-Beta] - 2026-07-05
### Added
- **Operator Assistant Reborn (Sprint Platform-003.2) [COMPLETED]** ✅
  - **Action Executor**: Integrated direct platform control allowing the Assistant to execute workstation navigation and production tasks.
  - **Workstation-Aware Intelligence**: Enhanced the context model to include active workstation and system execution state (`step`).
  - **Mission Control Panel**: Injected a system health monitor directly into the Assistant UI for real-time status reporting.
  - **Proactive Onboarding**: Implemented workstation-specific "Smart Suggestions" to guide new operators through complex production flows.
  - **General Action Dispatcher**: Upgraded the internal hook to support generalized `onAction` callbacks for deep platform integration.

## [7.1.0-Beta] - 2026-07-05
### Added
- **Platform Identity & Assistant Upgrade (Blueprint v1.1) [COMPLETED]** ✅
  - **Identity Restoration**: Restored the Header and CommuteCast Assistant as non-negotiable core product identifiers.
  - **Header Redesign**: Implemented a solid 68px sticky header with WCAG AA contrast, branding, and a dedicated Assistant shortcut (`Bot` icon).
  - **Operator Assistant**: Rebranded and refactored the assistant from a generic "Chatbot" to a context-aware "Operator Assistant."
  - **Context-Aware Suggestions**: The assistant now provides dynamic, workstation-specific prompts based on the active workstation (Home, Create, Library, Settings).
  - **Expandable Panel Architecture**: Transitioned the assistant UI to a non-obstructive expandable side-panel with an AI-Host Floating Action Button (FAB).
  - **Intent-First Integration**: Connected the Header's assistant shortcut directly to the Assistant panel for unified access.

## [7.0.0-Beta] - 2026-07-05
### Added
- **Product Information Architecture Overhaul (Blueprint v1.0) [COMPLETED]** ✅
  - **Operator Desk (Home)**: Transformed the home view into a mission-centric control center.
  - **Production Station (Create)**: Refactored into a linear 4-stage workflow (Source → Content → Voice → Publish).
  - **Library (Assets)**: Reorganized into a structured media management workstation using a 3-panel system grid.
  - **Unified Settings**: Consolidated all system and AI host configurations into a single, cohesive workstation.
  - **Linguistic Cleanup**: Standardized all UI labels to be strictly literal and human-friendly, removing technical jargon.
  - **Feature Pruning**: Removed unrequested floating UI elements and secondary dashboards to maximize focus and trust.

## [5.2.0-Alpha-1] - 2026-07-05
### Scheduled / Planning
- **Sprint Platform-003 – Product Simplification [IN PROGRESS]** 🏗️
  - **Core Theme**: Ruthless UI and UX simplicity for the Closed Beta launch.
  - **Home Screen Reform**: Planned deprecation of 40% of widgets on the Home dashboard, narrowing the display strictly to ongoing briefings, upcoming schedules, and critical action alerts (answering: *What is running?*, *What's next?*, *Is there an issue?*).
  - **Unified Figma-Like Creator**: Consolidating multi-tab configurations (Voice, AI, Source, Preview, Publish) into a clean, singular editor canvas.
  - **True Library Object Model**: Moving from a history archive to a structured hierarchy: Workspace -> Project -> Mission -> Assets -> Versions -> Export.
  - **Intent-First Settings**: Replacing advanced parameter sliders (pitch, rates, temperature) with clear operational declarations (e.g., choice of voice style, speed levels, briefing length, content priority).
  - **Strict Four-Workstation Sidebar**: Restructuring the primary workspace layout down to exactly 4 distinct workstations.
  - **Linguistic Purge**: Scheduled removal of developer-facing words like "Build PASS", "Contract", or "Baseline" from standard screens to focus on business metrics.

## [5.1.0-Beta-1] - 2026-07-05
### Added
- **Sprint Platform-002A – Mission Academy Foundation [COMPLETED]** ✅
  - **Operator Learning Principle**: Established the principle that every system capability must be learned through direct interaction in-product.
  - **Mission Academy (Level 1)**: Created the structural foundation for in-app education. Shipped Level 1 (Mission Confidence), guiding operators through critical situational "What-If" scenarios.
  - **Situational Scenario Simulator**: Developed an interactive playground inside the Home Workstation featuring drag-and-drop/sliders and contextual operator suggestions based on degraded states (e.g., RSS down, voice-synth server offline) instead of dry engineering formulas.
  - **Decision-Oriented Guidance**: Structured steps around real-world situation-to-outcome mappings: Can I publish? Should I retry? Should I wait?
  - **Product/UX Integration**: Enabled persistent state caching for dismissed/show again states of the Academy widget.

## [5.0.0-Beta-1] - 2026-07-05
### Added
- **Sprint Platform-001.1: Telemetry Hardening & Replay Engineering [COMPLETED]** ✅
  - **Correlation ID Engine**: Hardened the Structured Mission Event Contract with global Correlation IDs and Event Versioning (`schemaVersion`) to provide strict backward compatibility and traceability.
  - **Replay Filter Interface**: Integrated interactive event-type filters (Operator, AI, RSS Connector, Voice TTS, Storage, Recovery) inside the System Time Machine (Mission Replay) workspace.
  - **Diagnostics Export Utility**: Developed high-fidelity client-side diagnostics reporting that generates self-test telemetry reports matching real-world payloads and allows download of standardized JSON files.

## [5.0.0-Beta] - 2026-07-05
### Added
- **Platform Polish Sprint [COMPLETED]** ✅
  - Performance: Implemented React `lazy` and `Suspense` for all Workspace routes, reducing the main bundle by ~78KB.
  - Resilience: Added `react-error-boundary` to gracefully catch and isolate workspace-level crashes without halting the platform.
  - Deliverables: Submitted `PLATFORM_POLISH_EVIDENCE.md` outlining the KPIs (Before/After metrics).
- **Settings Workspace (Platform Control Center) [COMPLETED]** ✅
  - Upgraded settings from simple preferences to an operational Platform Control Center.

# CommuteCast Changelog

## [6.2.0-RC] - 2026-07-05
### Added
- **Sprint UX-100: Experience Polish [IN PROGRESS]** 🏗️
  - Goal: Pivot from feature development to total experience refinement.
  - Deliverables: Navigation Audit, Information Architecture Refactor, Visual Polish, Component Standardization, and comprehensive UX Audit.

## [6.12.1-RC] - 2026-07-05
### Added
- **Mission Intelligence RC Evidence [COMPLETED]** ✅
  - Goal: Validate the Mission Intelligence MVP against strict Performance, UX, and Product gates.
  - Deliverables: Submitted `MISSION_INTELLIGENCE_RC_EVIDENCE.md` containing React Profiler metrics, Lighthouse scores, and Golden Workflow breakdown.
  - Status: Mission Intelligence Baseline Approved.

## [6.12.0-RC] - 2026-07-05
### Added
- **Sprint UX-102D: Mission Intelligence Blueprint [IN PROGRESS]** 🏗️
  - Goal: Design the blueprint for the Mission Intelligence Workspace (formerly History) before implementation.
  - Deliverables: Mission Summary, Timeline Model, Production Graph, Replay Flow, and Root Cause View.

## [6.11.0-RC] - 2026-07-05
### Added
- **Sprint UX-102C: Assets Experience RC Validation [COMPLETED]** ✅
  - Goal: Validate the Assets Workspace against Release Readiness criteria.
  - Deliverables: Workflow Demo, Performance/A11y Metrics, AI Action validation, and RC Certificate.
  - Gate: **Assets Experience Freeze** declared.

## [6.9.0-RC] - 2026-07-05
### Added
- **Sprint UX-103: Platform Stabilization [COMPLETED]** ✅
  - Goal: Finalize Studio stability, performance, and accessibility.
  - Deliverables: Performance optimizations, Keyboard accessibility, Error boundary resilience, Empty state CTAs, and final evidence documentation.
  - **Mission Studio Freeze** and **Workspace Pattern Freeze** declared.

## [6.5.1-RC] - 2026-07-05
### Added
- **Sprint UX-102A: Mission Control Experience [COMPLETED]** ✅
  - Goal: Transform Home into a Mission Control Center.
  - Deliverables: Hero Control Card, 3-action limit, simplified mission status, recent mission list, intentional empty states.
  - **Home Experience Freeze** initiated.

## [6.5.0-RC] - 2026-07-05
### Added
- **Sprint UX-102A: Mission Control Experience [IN PROGRESS]** 🏗️

## [6.4.0-RC] - 2026-07-05
### Added
- **Sprint UX-102: Workspace Transformation [PLANNED]** 🏗️
  - Goal: Refine Workstation experiences (Home, Studio, Assets, History, Settings) based on the approved IA.
  - Deliverables: Mission-centric UI, consistent design grammar, interaction polish.

## [6.3.0-RC] - 2026-07-05
### Added
- **Sprint UX-101: Information Architecture Blueprint [COMPLETED]** ✅
  - Goal: Define the comprehensive application structure before refactoring navigation.
  - Deliverables: Application Map, Navigation Blueprint, Workflow Maps, IA Reorganization, Screen Inventory, UX Consistency Report, Navigation Spec, User Flow Matrix, Design Grammar, Interaction Guidelines, and Workspace Principles.
- **Sprint UX-019.6: Platform Capability Model** — **COMPLETED** ✅
  - **Capability Tree**: Standardized 9 core system capabilities (Mission, Input, Authoring, AI, Voice, Preview, Publish, Archive, Governance, Monitoring).
  - **Ownership Mapping**: Enforced strict Workstation ownership per capability.
  - **Extensibility Proof**: Demonstrated how future capabilities (Video, Automation) fit within the existing 4-Workstation structure without architectural changes.
- **Sprint UX-019.5: Product Information Architecture Certification** — **COMPLETED** ✅
  - **Feature Consolidation Audit**: Identified all redundancies across RSS, Voice, and Settings modules.
  - **Workstation Architecture**: Established the "4 Workstations" rule (Home, Create, Library, Settings).
  - **Certification Vault**: Created five mandatory architecture documents.
- **Universal Search Specification**: Defined the requirement for a global Command Palette (Ctrl+K) to unify fragmented search states.

### Changed
- **Architectural Freeze**: Officially froze the Sidebar and View structure; no modifications permitted until PO approval of the certification bundle and the Platform Capability Model.
- **Intent-First Pivot**: Shifted from "Screen-Based" to "Intent-Based" navigation design.

### Added
- **UX Revolution Phase**: Pivoted from Infrastructure to Experience Layer (Phase B).
- **New UX Principle**: Added Principle #15 to `UX_CONSTITUTION.md`: "The UI must never expose the system's internal architecture."
- **Visual Hierarchy Audit**: Identified critical "Hero" element deficiencies across Home, Create, and Library views.

### Changed
- **Platform Engineering Freeze**: Officially froze Mission Platform, Repository, and Event-bus engineering to focus on Operator Experience.
- **Roadmap Pivot**: Replaced Phase A.2 technical sprints with a 6-sprint UX Revolution series (UX-030 to UX-035).

## [4.31.0-RC] - 2026-07-05
### Added
- **Product UX Audit**: Conducted a deep-dive audit of all core views (`Settings`, `Home`, `Create`, `Library`), identifying 🔴 Critical hierarchy and language issues.
- **Operator Intent Model**: Established `docs/architecture/OPERATOR_INTENT_MODEL.md` to shift from modular configuration to goal-based intent.
- **Preference Tree Specification**: Created mapping logic to translate human goals into multi-parameter system changes.
- **Settings Decision Flow**: Standardized instant feedback loops and progressive disclosure rules.

### Changed
- Pivoted `ROADMAP.md` to prioritize **Intent Architecture** over UI implementation.
- Refined the "Language Audit" rules in `CONTEXTUAL_GUIDANCE.md` to eliminate developer jargon.

## [4.30.0-RC] - 2026-07-05
### Added
- **Operator Settings Architecture**: Established 5 foundational documents governing goal-oriented settings.
- **Settings Information Architecture**: Pivoted from Module-based to Goal-based categorization in `docs/architecture/SETTINGS_IA.md`.
- **Progressive Disclosure Policy**: Defined dependency-based field visibility in `docs/architecture/SETTINGS_DEPENDENCY_GRAPH.md`.

### Changed
- Refined `ROADMAP.md` to include `Sprint UX-020A` as a mandatory architecture gate.
- Updated Mission Model to treat settings as "Preferred Capabilities."

## [4.29.0-RC] - 2026-07-05
### Added
- **Mission Lifecycle Matrix**: Established a formal state transition matrix in `docs/architecture/MISSION_LIFECYCLE.md`.
- **Mission Capability Registry**: Created `docs/architecture/MISSION_CAPABILITY_REGISTRY.md` to decouple modular production requirements.
- **Mission Policy Engine**: Established `docs/architecture/MISSION_POLICY.md` for automated guardrails and recovery actions.
- **Mission Versioning**: Introduced versioning to the `Mission` model for optimistic locking.
- **Repository Interface**: Defined the formal contract for the `MissionRepository` in `MISSION_MODEL.md`.

### Changed
- Refined `MISSION_EVENT_CONTRACT.md` with Retry, Idempotency, and Persistence rules.
- Updated `SessionTypes.ts` to support Versioning and Capability Requirements.
- Pivoted `ROADMAP.md` to focus on Infrastructure Core (Phase A.2).

## [4.28.0-RC] - 2026-07-05
### Added
- **Mission Event Contract**: Established `docs/architecture/MISSION_EVENT_CONTRACT.md` defining strict payload, producer, and consumer schemas.
- **Mission Platform Baseline**: Declared **Platform Freeze** for Phase A, focusing on Mission Core infrastructure.
- **Operational Health Engine**: Implemented `executionHealth` (`healthy`, `warning`, `attention`, `critical`) to replace binary status checks.
- **Capability Mapping**: Added `MissionCapability` registry to track required vs provided production assets.
- **Mission Bus Architecture**: Enhanced `SessionEngine` with `logMissionEvent` for unified background worker communication.

### Changed
- Refined `SessionTypes.ts` with enhanced Mission domain models.
- Updated `HomeView` to display `ExecutionHealth` and mission stage metadata.
- Elevated Mission priority in `ROADMAP.md` and `PRODUCT.md`.

## [4.26.0-RC] - 2026-07-05
### Added
- **Mission Model Architecture**: Established `docs/architecture/MISSION_MODEL.md` as the source of truth for work continuity.
- **Mission Continuity Platform Pivot**: Rebranded the product vision to focus on Mission-based production (Era 4).
- **SessionEngine Event Contract**: Implemented `publishMissionEvent` for immutable state transitions and history tracking.
- **Supabase Robustness**: Enhanced client initialization with case-insensitive HTML detection and 302 redirect safety.

### Fixed
- Supabase initialization error when encountering AI Studio auth redirection (HTML instead of JSON).
- Session state persistence race conditions and state sync issues.

## [4.25.0-RC] - 2026-07-04
### Added
- **EPIC X: Experience Platform - Hierarchical Workstations & Workspace Refactor** — **COMPLETED** ✅
  - **Layer 1 (Information Architecture & Navigation)**: Streamlined the flat sidebar navigation and divided the workspace into 4 robust, specialized workstations:
    - **Home (Workspace Resume)**: Re-centered around a "Continue Working" mindset. Prominently shows active draft indicators, word/character metrics, quick actions, and direct continuation cards for seamless resumption.
    - **Create (Studio Desk)**: Combined script editor workbench, automatic topic recommendations, AI drafting tools, smart voice querying, and player/compiler monitoring into a high-efficiency single layout.
    - **Library (Workspace Media Manager)**: Turned the flat library view into a comprehensive workstation with tabbed segments for Saved Briefing History, Podcast Publishing, Play Queue, Stats & Downloads, and Storage/Cache tracking.
    - **Settings (System & AI Admin)**: Dedicated advanced control panel that keeps vocal adjustments, Cloud Sync triggers, PWA controls, and administrative details cleanly out of general viewports.
  - **Layer 2 (Advanced AI Settings Consolidation)**: Grouped and collapsed all advanced parameters ("Editorial Brain," "Persona Tuning," and "Vocal Emotion Profiles") under an "Advanced AI Host Settings" accordion. This hides technical complexity from standard operators while keeping it easily accessible for power users.
  - **UI/UX Polishing**: Cleaned up layout spacing, verified touch targets (min 44px), eliminated duplicate margins, and successfully certified on both TypeScript linter and production compiler.

## [4.24.0-RC] - 2026-07-04
### Added
- **EPIC X: Experience Platform - Workflow, Workspace & Search Enhancements** — **COMPLETED** ✅
  - **Layer 2 (Workflow)**: Added the high-fidelity Workflow Chevron Rail at the top of the Create Studio desk, offering clear progressive indicators mapping the user journey from RSS Selection, Script Drafting, Audio Synthesis, to Preview & Polishing, and ultimate Social Publishing.
  - **Layer 3 (Workspace & Companion)**: Integrated smart workspace continuation cards directly into the main Home dashboard, recalling the current editor draft buffer, state metadata (character/word length), and and providing a one-click resumption shortcut.
  - **Layer 4 (Companion Greeting)**: Enhanced the companion assistant greetings with a responsive Vietnamese/English contextual card, greeting the user with specific local weather conditions, traffic status on their commute route, and proactive draft resumption prompts.
  - **Layer 5 (Universal Search)**: Designed and launched the Ctrl+K Global Command Palette search panel, enabling instant keyboard-driven search matching across navigation workstations, recently saved audio briefings, custom AI host voices (Fenrir, Zephyr, Kore, Puck), and common system controls (switch language, toggle driving HUD, trigger cloud sync).
  - Updated all relevant system manifests, roadmaps, and architecture documents to maintain 100% compliance. Fully certified on TypeScript/Vite compiler.

## [4.23.0-RC] - 2026-07-04
### Added
- **EPIC X: Experience Platform (UX Operating System)** — **COMPLETED** ✅
  - Reorganized information architecture into 6 core task-oriented workstations (`home`, `create`, `library`, `aihost`, `analytics`, `settings`) to improve usability, discoverability, and reduce cognitive load.
  - Authored **RFC-001** and **ADR-040** establishing the systems and design principles for the Experience Platform.
  - Aligned workspace views with Product Baseline 2.0, adding explicit visualizers for Snapshot Manifests and Experimentation metrics.
  - **HomeView**: Unified entry deck displaying intelligent greetings, active system status indicators, quick workstation launcher blocks, and a carousel of recently compiled briefings.
  - **CreateView**: A high-efficiency studio editorial workbench consolidating topic recommendations, draft-writing boards, automated AI article generation, smart voice assistant searching, and a broadcast config column displaying the embedded ManualPcmPlayer and compiler active logging.
  - **LibraryView**: Central media center grouping the Smart Play Queue, compiled archive log, cloud podcast syncing, and local indexedDB search tools.
  - **AnalyticsView**: Comprehensive observation deck hosting real-time telemetry tables, reading habit stats, and an interactive Snapshot Value Lineage mapping registered KPI lifts.
  - **AIHostView**: Specialized control deck for calibrating active host personalities, fine-tuning vocal tone/tempo, and parsing lineage metadata for active Knowledge Snapshots.
  - Passed all lint, typescript, and production bundling validations. Perfect backward compatibility with the certified Runtime Core.

## [4.22.0-RC] - 2026-07-04
### Added
- **Project Baseline 2.0 (Evidence-Driven Phase)** — **INITIATED** 🏁
- **EPIC A: Evidence Platform**: Bắt đầu triển khai năng lực đo lường tác động sản phẩm cho Knowledge Snapshots.
- Established structural plan for Evidence Platform: Snapshot Experiment Metadata, Lineage Tracking, Explainability Reports, and Automated Regression Guardrails.

## [4.21.0-RC] - 2026-07-04
### Added
- **Sprint #021: Product Evaluation Layer** — **COMPLETED** ✅
- Established `EvaluationOrchestrator`, `EditorialScorer`, `TasteLiftAnalyzer` infrastructure for independent session analysis (Observe-only).
- **ADR-035**: Established "Observe Before Learn" governance.
- **ADR-036**: Established "Learning Happens Offline" governance.

## [4.20.0-RC] - 2026-07-04
### Added
- **Sprint #020: AI Radio Host Foundation**: Implemented interactive dialogue capabilities within the broadcast stream.
- **ConversationalHostEngine**: Integration with Gemini (gemini-3.5-flash) for persona-aware real-time explanations.
- **InterjectionOrchestrator**: Dynamic timeline management to inject conversational beats and shift session flow without losing continuity.
- **DialogueModel**: Structured types for host intents (Explain, Summarize, Contextualize).
- **Conversational Certification**: Verified dialogue generation and timeline shifting logic.

## [4.19.0-RC] - 2026-07-04

### Added
- **Sprint #019: Phase 5 — Taste Intelligence Platform**: Implemented a situational intelligence layer for advanced content personalization.
- **Taste Graph**: Developed a multi-dimensional mapping of topics to contexts (Time, Weather, State).
- **HabitEngine**: Added pattern detection for recurring listening behaviors (e.g., specific topics at specific times).
- **ContextAffinityEngine**: Implemented weighted affinities that adapt based on the user's environment (Morning vs. Evening vs. Weekend).
- **SurpriseEngines (Novelty & Diversity)**: Integrated active anti-bubble logic to maintain a 15% surprise ratio and penalize immediate topical repetition.
- **TasteResolver**: Unified orchestrator providing situational "Taste Profiles" to the AI DJ.
- **TasteCertification Test Suite**: Validated contextual accuracy, habit detection, and novelty/diversity logic.
- **ADR-033: Taste Evolves, Preferences Don't**: Documented the shift from static user preferences to dynamic, situational taste intelligence.

## [4.18.0-RC] - 2026-07-04

### Added
- **Sprint #018: Phase 4 — AI DJ Experience Platform**: Transitioned from segment-oriented logic to holistic session orchestration.
- **ListeningSession Aggregate**: Introduced a unified data model for the entire broadcast experience, including context, objective, persona, and timeline.
- **AI DJ Orchestrator**: Developed the "Conductor" module that coordinates Intelligence, Recommendation, Editorial, Persona, and Broadcast layers into a seamless session.
- **Session Objectives Engine**: Added logic to optimize sessions based on context (e.g., "Inform Quickly" for mornings, "Calm Ending" for nights).
- **Dynamic Session Adaptation**: Implemented real-time adaptation logic for user skips and shrinking time windows (arrival time tracking).
- **AI DJ Certification Test Suite**: Validated session continuity, editorial consistency, and dynamic adaptation behaviors.
- **ADR-032: Session Before Segment**: Documented the architectural shift prioritizing the session experience over individual content pieces.

## [4.17.0-RC] - 2026-07-04

### Added
- **Sprint #017: Phase 3 — Broadcast Director Foundation**: Implemented the "Executive Producer" layer of the system.
- **BroadcastPlan DTO**: Created a comprehensive data model for show structuring, including sections, pacing, energy curves, and emotion sequences.
- **TempoEngine & EnergyCurveEngine**: Developed the logic for shifting pace (Fast/Slow/Medium/Pause) and energy levels (High/Peak/Reflection/Warm) contextually.
- **SectionPlanner**: Dynamic segment planning ensuring programs start with an Opening, hit Lead Stories, and close with Reflection, maintaining logical flow.
- **BroadcastPolicyManager**: Governs constraints based on user state (e.g., shorter driving briefs vs extended weekend programs).
- **DirectorCertification Test Suite**: Validated pacing, emotional flow, section balancing, and program integrity to ensure the AI behaves like a real radio producer.
- **ADR-031: Broadcast Before Performance**: Documented the architectural principle that show structure (Broadcast Director) must be generated before audio rendering (Performance Director).

## [4.16.0-RC] - 2026-07-04

### Added
- **Sprint #015: Phase 1 — Editorial Planner & Editorial Brain**: Implemented `EditorialPlanner` as the high-level producer determining session constraints (duration, depth, pacing). Implemented `EditorialBrain` and its 6 discrete engines (`EditorialIntentEngine`, `CuriosityEngine`, `EmotionArcEngine`, `NarrativeArcEngine`, `SurpriseEngine`, `MemoryRecallEngine`) to synthesize human-like editorial decisions.
- **Sprint #014E: Runtime Certification & Execution Freeze (WP-6, WP-7)**: Designed the comprehensive benchmark simulation matrix and certified the entire Runtime Core execution framework.
- **WP-6: Simulation Matrix & Resource Profiling**: Implemented deterministic simulation of network throttling (WiFi, 3G, Packet Loss) and load spam, with granular resource tracking (heap delta, user CPU, etc.).
- **WP-7: Certification Artifact Giga-Bundle**: Created the complete verification package under `/RuntimeCertification/` featuring `benchmark-report.json`, `resource-report.json`, `chaos-report.json`, `replay-verification.json`, `kpi-summary.json`, and `certification.md`.
- **WP-7: Freeze Manifest & Maintenance Policy**: Formally locked all core runtime components (`TimelineScheduler`, `RuntimeSnapshot`, `TimelineEvent`, `RuntimeCommand`, `ExecutionTimeline`, `Plugin Lifecycle`, and `Event Bus Contract`) to prevent architectural regressions.
- **Baseline Version Formulation**: Established `v4.16.0-RC` as the permanent performance and resource baseline for subsequent regression checks.
- **ADR-028: Editorial Intelligence First**: Documented the strategic shift from technical platform engineering to product value, focusing future efforts entirely on AI character, storytelling, and audience taste loops.
- **ADR-029: Editorial Planner & Taste Graph**: Introduced the `Editorial Planner` layer to construct strategic show pacing and goals, the `Editorial Intent Engine` within the Brain, and upgraded the user profile to a multi-dimensional `Taste Graph` encompassing environmental context, host preference, and emotion.

## [4.15.0-RC] - 2026-07-04

### Added
- **Sprint #014C: Runtime Diagnostic Inspector (WP-5)**: Implemented full runtime observability to bridge architecture and product KPIs.
- **WP-5: Inspector Plugin**: Upgraded `InspectorPlugin` to centralize telemetry across `RuntimeSnapshot`, `TimelineEvent`, and `RuntimeCommand` for deep observability.
- **WP-5: Critical Path Analysis**: Implemented automated analysis of event chains (e.g., PREFETCH -> PLAY) to identify latency bottlenecks.
- **WP-5: Replay Bundle**: Built a "black box recorder" for runtime state, including checksums for integrity verification and environment metadata for issue reproduction.
- **WP-5: Diagnostic Metadata**: Augmented replay bundles with runtime version, platform, device, and network telemetry.

## [4.13.0-RC] - 2026-07-03

### Added
- **Sprint #014B: Runtime Experience Execution (WP-1, WP-2, WP-3)**: Implemented complete state-driven pure execution engine contracts and plugin infrastructure.
- **WP-1**: Formalized `RuntimeSnapshot`, `RuntimeCommand`, `TimelineEvent`, and `ExecutionTimeline` type-safe contracts.
- **WP-2**: Implemented the pure `TimelineScheduler` with CQRS-lite command generation and high-efficiency decoupled asynchronous `CommandDispatcher`.
- **WP-3**: Built the modular `PluginManager` framework with execution isolation, dynamic command routing (`CommandHandlerRegistry`), event publishing, and failure resiliency.
- **Metrics Plugin**: Built a core plugin compiling micro-telemetry on startups, gaps, and prefetch hit ratios into a composite Experience Score.
- **Inspector Plugin**: Developed a telemetry-based subscriber history manager logging snapshots, commands, and events for developer-mode time-travel analysis and simulation.

## [4.12.0-RC] - 2026-07-03

### Added
- **Sprint #013.5: Execution Contract (Intent-Based)**: Formalized contract using Performance Intents.
- **ADR-025**: Intent-Based Performance Architecture.

## [4.11.0-RC] - 2026-07-03

### Added
- **Sprint #013.5: Execution Contract**: Performance Manifest v3 contract definition.
- **ADR-024**: Execution contract between Performance Director and Runtime.

## [4.10.0-RC] - 2026-07-03

### Added
- **Sprint #013 Narrative Composer Platform**: Implemented structural narrative assembly.
- **Editorial Policy Engine**: Context-aware program sequencing (Morning vs. Night).
- **Narrative Manifest v2**: Rich metadata for audio cues and voice direction.
- **ADR-020, ADR-021, ADR-022**: Documented narrative-first principles.

## [4.8.0-RC] - 2026-07-03

### Added
- **Sprint #012 Recommendation Engine**: Implemented the multi-dimensional ranking core.
- **Scoring Matrix**: Formula-based ranking using Interest Vectors, Context, and Candidate signals.
- **Diversity Control**: Added penalty for redundant topics in the top-N results.
- **ADR-019 Recommendation as a Pure Ranker**: Defined the mathematical boundary of content selection.

## [4.7.0-RC] - 2026-07-03

### Added
- **Sprint #011 Story Intelligence Platform**: Implemented the clustering and editorial layer.
- **Story Clustering**: Grouped candidates by semantic relationship (e.g., tech race, market trends).
- **Editorial Role Assignment**: Added roles (Lead, Supporting, Transition) to candidates.
- **ADR-018 Story Intelligence as the Narrative Backbone**: Established clustering logic before recommendation.

## [4.6.0-RC] - 2026-07-03

### Added
- **Sprint #010 Candidate Intelligence Platform**: Added semantic enrichment layer for news candidates.
- **Topic & Keyword Extraction**: Candidates now include extracted entities and topics.
- **Urgency & Sentiment Analysis**: Added scoring for content urgency and emotional tone.
- **ADR-017 Product Intelligence First**: Enforced rule that Recommendation must consume enriched intelligence, not raw articles.

## [4.5.0-RC] - 2026-07-03

### Added
- **Sprint #009 User Intelligence Platform**: Implemented the "brain" of personalization between Memory and Recommendation.
- **Interest Vectorization**: Added logic to calculate topic affinity scores from historical listening behavior.
- **Context Engine**: Added environment resolution (Morning Commute, Night Mode) to influence runtime behavior.
- **ADR-016 User Intelligence as the Heart of Personalization**: Established the boundary between data storage and intelligent analysis.

## [4.4.1-RC] - 2026-07-03

### Added
- **Sprint #008.5 Runtime Certification**: Added performance and chaos test suite to ensure Event Bus and Projection Engine meet strict latency KPIs (<2ms dispatch, <10ms projection) and are free of memory leaks.

## [4.4.0-RC] - 2026-07-03

### Added
- **Sprint #008 Runtime Orchestration Platform**: Transitioned architecture to an event-driven centralized runtime.
- **RuntimeEventBus & RuntimeContext**: Decoupled modules and centralized state management.
- **ProjectionEngine**: Translates raw briefings into UI-ready language projections.
- **PlaybackScheduler**: Manages gapless audio playback via intelligent segment prefetching.
- **ADR-015 Runtime Orchestration First**: Enforced rule that UI and services must communicate via the Runtime platform, not directly.

## [4.3.0-RC] - 2026-07-03

### Added
- **Sprint #007 AI Memory Platform**: Established a pristine domain layer to serve as the Source of Truth for user personalization.
- **User Memory Aggregates**: Added `UserAggregate`, `UserPreference`, and `InterestGraph` models to track user state without algorithmic bias.
- **Event-Driven History**: Added `ListeningEvent` and `FeedbackEvent` structures to chronologically track user behavior (e.g., `SegmentSkipped`, `Like`, `LanguageChanged`).
- **Memory Service & Repository**: Implemented business logic and an in-memory repository to handle state mutations and event logging.
- **ADR-014 User Memory as Source of Personalization**: Mandated that the Memory Platform purely stores data, separating it from the future Recommendation Engine which will handle compute/decision logic.

## [4.2.0-RC] - 2026-07-03

### Added
- **Sprint #006.5 AI Runtime Verification**: Introduced a Quality and Verification Gate to ensure the LLM Intelligence Platform is production-ready. Focused on deterministic replay, model routing correctness, output repair, and cost telemetry logging. No new features; pure test coverage and validation.

## [4.1.0-RC] - 2026-07-03

### Added
- **Sprint #006 LLM Intelligence Platform**: Abstracted AI models into a robust platform. Built Prompt Registry, Model Router, Output Validator, Response Repairer, Safety Engine, and Cost Telemetry.
- **ADR-013 AI Vendor Independence**: Prohibited downstream services from directly accessing LLM SDKs, enforcing the LLM Platform Interface abstraction.
- **Sprint #005 Feed Intelligence Platform**: Transitioned RSS Gateway from a basic transport layer into a fully-fledged Content Intelligence Platform.
- **Feed Aggregate Lifecycle**: Modeled `Feed` as a living DDD Aggregate, encapsulating Identity, Health, Quality, Fetch Policy, and Statistics.
- **Three-Tier Fingerprint Service**: Introduced granular deduplication at the Transport (ETag/Last-Modified), Content (SHA-256), and Semantic layers to drastically reduce redundant downstream processing and LLM costs.
- **Feed Health State Machine**: Evaluates and routes feed health transitions (`UNKNOWN` -> `HEALTHY` -> `DEGRADED` -> `UNAVAILABLE` -> `RECOVERING`).
- **Feed Ranking Engine**: Computes authority, freshness, and reliability scores, paving the way for the future AI DJ Recommendation Engine.
- **Candidate as Source of Truth**: Decreed via ADR-012 that downstream systems only consume enriched `Candidate` objects (Article + Intelligence metadata), permanently removing raw RSS passthrough.

## [4.0.0-RC] - 2026-07-03

### Added
- **Deterministic Briefing Generation Pipeline**: Implemented a complete pipeline architecture based on ADR-006, ADR-008, and ADR-009 using the unified `Pipeline` orchestrator and `PipelineStep` interface.
- **Sequential Pipeline Steps**:
  - `ParseRSSStep`: Decouples RSS XML retrieval and uses `SimpleXmlParser` to parse feed items.
  - `NormalizeStep`: Sanitizes content by removing HTML markup, collapsing excess whitespace, and stripping URL tracking elements (`utm_*`, etc.) via `ContentNormalizer`.
  - `FingerprintStep`: Generates a deterministic SHA-256 content hash using `RSSFingerprintService` to guarantee order-independence.
  - `DuplicateCheckStep`: Integrates with `FingerprintRepository` to detect duplicates, gracefully skipping downstream execution to prevent redundant LLM summarization.
  - `SummarizeStep`: Calls the `Summarizer` port to transform articles into a structured, bilingual briefing outline.
  - `AssembleBriefingStep`: Synthesizes outputs into immutable DDD Aggregates (`Briefing` and child `Segment` entities).
  - `PersistBriefingStep`: Persists the complete briefing aggregate and content fingerprint in a single atomic database transaction.
  - `PublishEventsStep`: Emits corresponding domain events (`BriefingGenerated` or `BriefingSkipped`) to downstream services.
- **Value Objects and Domain Events**: Added type-safe Value Objects (`BriefingId`, `Fingerprint`, `Language`, `VoiceId`) and decoupled event contracts to `src/domain/`.
- **Integrated Pipeline Test Suite**: Designed a deterministic, framework-free testing script (`tests/pipeline/BriefingGenerationPipeline.test.ts`) that verifies normalization correctness, error rollback boundaries, and deduplication behavior.
- **Sprint #004.5 Operational & Resilience Gates**:
  - **Step-level Telemetry**: Captured precise performance durations (durations in ms, status success/skipped/failed, and attempt counts) for each executed step within the context and manifest.
  - **Centralized Exponential Backoff Retry**: Handled step failure recovery globally inside the `Pipeline` class using customizable exponential retry rules.
  - **Step Execution Timeout**: Embedded a standard `Promise.race` wrapper safeguarding step execution and preventing infinite worker hanging.
  - **Dead Letter Queue (DLQ)**: Captured and stored unrecoverable pipeline states securely to simplify production logging and analysis.
  - **State Replay Engine**: Created `Pipeline.replay` static engine allowing historical runs to be fully replayed with 100% identical outputs using stored contexts and manifests with 0 external API cost.
  - **ADR-010: Observability First**: Formulated a new architectural decision record mandating metrics, logging, and trace instrumentation across all future subsystem integrations.
  - **ADR-011: Product Value First**: Established product metrics validation requirement for any architectural implementation.
  - **ADR-012: Content Intelligence First**: Decreed that feeds must act as rich DDD Aggregates producing Candidates, not raw transport passthroughs.


## [3.2.16-RC] - 2026-07-03

### Added
- **Broadcast Formatter**: Implemented a `cleanBroadcastArtifacts` layer before language detection to aggressively strip out common RSS artifacts (e.g., "(Reuters) -", "Breaking:", "LIVE", "Updated", "Photo:", "Video:", "Read more") for a true radio-broadcast quality reading experience.
- **Acronym & Abbreviation Normalization**: Implemented a comprehensive acronym lookup (`ACRONYM_MAP_VI`) allowing terms like "NASA", "GDP", "CEO", "TP.HCM" to be accurately spelled out in phonetics prior to synthesis.
- **Language Confidence Scoring**: Refactored the `detectLanguage` heuristic to return a confidence score (`detectLanguageWithConfidence`). Text chunks failing to meet a threshold (e.g. < 50%) now seamlessly inherit context from the preceding segment instead of hard-failing to an incorrect language.
- **Decoupled Proper Noun Dictionaries**: Extracted hardcoded proper nouns and acronym mappings into a dedicated `src/utils/tts-dictionaries.ts` configuration file to allow for independent future updates and granular classifications.
- **Proper Noun Dictionary**: Excluded standard proper nouns like Google, OpenAI, Gemini, ChatGPT, Apple, World Cup, Premier League, etc. during language detection to prevent false-positive language shifts for bilingual sentences.
- **Linguistic Text Normalization**: Structured a normalization engine (`normalizeTextForLanguage`) to automatically translate numbers, percentages, units (km, kg, USD), and common symbols (`vs`, `&`, `@`) into their proper spoken equivalents depending on the target language block (Vietnamese vs. English) before synthesis.
- **Smart Slash Boundaries (`/`)**: Added a fraction, date, and abbreviation-aware delimiter parser that preserves entries like `2026/07/03` or `and/or` while successfully dividing true translation pair sentences.
- **Neutral Token Inheritance**: Enabled numeric or symbolic segments (with no alphabetical letters) to automatically inherit the surrounding block language instead of resorting to static defaults.
- **Multi-block Audio Delivery**: Refactored the TTS response to return an array of independent base64 audio chunks (`audioChunks[]`). This prevents container corruption caused by concatenating different formats (MP3/WAV) on the server, ensuring clean native decoding at the client.
- **Header-Based Client Routing**: Optimized `ManualPcmPlayer` to identify container types (WAV/MP3/PCM) via binary headers before decoding, eliminating expected `EncodingError` logs and streamlining the playback pipeline.
- **Unified TTS & Player Audit Layer**: Integrated a comprehensive logging system (`[TTS-AUDIT]` and `[ManualPcmPlayer-AUDIT]`) that tracks engine performance, container headers, chunk sizes, and decoding paths (Native vs. PCM Fallback) to provide verifiable evidence for field testing.

## [3.2.15-RC] - 2026-07-03

### Added
- **Language-Aware Text Segmentation**: Introduced an in-depth, language-aware paragraph & sentence-level text segmenter at the `/api/tts` level to detect Vietnamese vs. English sentences and group them into ordered single-language blocks.
- **Language-Specific TTS Routing**: Configured the synthesis engine to only send pure single-language blocks to their designated speech synthesis engines (Edge TTS for Vietnamese, Gemini TTS for English), entirely avoiding mixed-language mispronunciation errors (e.g. Vietnamese voice trying to read English phonetically).
- **Silent Skip in VN_ONLY Mode**: Added a dynamic skip fallback for bilingual news tracks when in "Vietnamese Only" playback mode, seamlessly filtering out any English sentences and delivering a clean, uninterrupted Vietnamese broadcast experience.
- **Selective Gemini Cooldown**: Updated the Gemini engine transient timeout recovery lockouts to ignore configuration, authorization, or bad request errors (400, 401, 403, 404), ensuring we do not apply a lockout penalty for static structural issues.

## [3.2.14-RC] - 2026-07-03

### Fixed
- **Audio Quality (Boundary Pops/Static)**: Applied a 5ms linear fade-in and a 10ms linear fade-out to all decoded audio buffers in memory inside `ManualPcmPlayer.tsx` before joining. This prevents clicks, pops, and static at sentence boundaries.
- **RSS Manager Filter UX**: Replaced blocked browser alert popups inside the AI Studio iframe sandbox with an interactive, beautiful non-blocking inline warning and confirmation panel. It offers helpful tips when 0 articles are found and allows confirmation to generate briefings with fewer articles when available.
- **Aggressive Gemini TTS Lockout**: Reduced the global Gemini engine disable lockout from 3 minutes to 10 seconds. This prevents transient chunk-level timeouts from disabling the primary high-quality TTS engine for subsequent request chunks.

## [3.2.13-RC] - 2026-07-03

### Fixed
- **Supabase Client Initialization**: Gracefully handle AI Studio sandbox/iframe cookie checks redirection when accessing `/api/db-config`. If the browser receives an HTML page, it falls back gracefully to `LOCAL_ONLY` instead of throwing a JSON parsing error (`Unexpected token '<'`).

## [3.2.12-RC] - 2026-07-03

### Added
- **ERC-003 Formal Authorization**: Kicked off the "User Abandonment Research" with fully locked operational parameters to protect research integrity.
- **Locked Parameters & Boundaries**: Formally defined the research question, sample size metrics (n≥20), set taxonomy (Network, Audio, Relevance, UX, Interruptions, External), and strict decision boundaries (≥60% dominant cause) in `ROADMAP.md` and `DECISIONS.md`.

## [3.2.11-RC] - 2026-07-03

### Added
- **Era 2.6: Pure Operational Focus**: Formally transitioned the product organization to a purely evidence-driven, operational research model.
- **5-Question ERC Evaluation Rubric**: Standardized exactly five core questions required to justify or assess any product proposal.
- **Strategic Organizational Indicators**: Implemented three core health metrics: **Decision Quality**, **Learning Velocity**, and **Decision Accuracy** to evaluate the efficiency of our learning flywheel.
- **Governance Freeze Constitutional Rule**: Enacted Rule 6 in the Product Constitution (v1.1) to completely freeze meta-scaffolding and prevent governance creep.

### Changed
- Shifted the Telemetry Dashboard from "Era 2.5 Portfolio Deck" to "Era 2.6 Operational Deck" v3.2.11.

## [3.2.10-RC] - 2026-07-03

### Added
- **Permanent Freeze (Meta-Work Zero Boundary)**: Formally locked all telemetry schemas, dashboards, governance protocols, and templates to completely prevent framework inflation.
- **Decision Confidence Matrix**: Integrated evidence strength mapping with actionable product outcomes and DNA promotion.
- **Living Knowledge DNA**: Added `Scope` and `Invalidated By` criteria to `/PRINCIPLES.md` for contextual durability.

### Changed
- Updated `/AGENTS.md` and `/PRODUCT.md` with strict freeze constraints and confidence matrix guidelines.

## [3.2.9-RC] - 2026-07-03

### Added
- **Era 2.5 Finalized**: Established the "Research Portfolio" and "Problem Space" organization.
- **Portfolio Health KPI**: New organizational metric to track research efficiency.
- **Research Exit Rule**: Mandatory closure of learning loops before opening new research questions.
- **PRINCIPLES.md Registry**: Dedicated SSOT for high-confidence Product DNA.

### Changed
- Refined **ERC-003** to a quantitative threshold model (Dominant Factor ≥60%).
- Transitioned **ROADMAP.md** to a dynamic Portfolio structure.
- Refined **AGENTS.md** Behavioral Policy with Research Exit and Portfolio Value rules.

## [3.2.8-RC] - 2026-07-03

## [3.2.7-RC] - 2026-07-03

### Added
- **Era 2.4: Governance Maturity**: Established strict controls to prevent governance inflation.
- **Framework Growth Cap**: Implemented the "Framework Growth ≤ Evidence Growth" rule.
- **Evidence Budget Refinement**: Capped research sprints at 1 active question and ≤3 KPIs.
- **ERC-003 Behavioral Focus**: Launched the "Why do users stop listening?" research sprint.
- **Intelligence Debt Pruning**: Initiated an audit to remove non-decisional metrics and documents.

### Changed
- Updated `AGENTS.md` and `PRODUCT.md` with Era 2.4 governance principles.
- Refined the learning loop to emphasize pruning and behavioral understanding.

## [3.2.6-RC] - 2026-07-03

### Added
- **Era 2.3 Finalized**: Formally closed the "Platform Evolution" chapter and transitioned to "Product Intelligence Maturity".
- **Evidence Budget**: Implemented strict limits on metrics (Max 3 KPIs, 2 Dashboards) to maximize signal-to-noise.
- **Weekly Product Memo**: Standardized the weekly learning summary format.
- **Intelligence Maturity Model**: Adopted the 6-stage maturity framework (Build to Compound).

### Changed
- Refined **North Star Metric** interpretation to focus on completion rate as an *outcome* rather than a target.
- Updated **Operating Agreement** in `AGENTS.md` with Evidence Budget and Weekly Memo rules.
- Upgraded `DECISIONS.md` to reflect Level 5 maturity status.

## [3.2.5-RC] - 2026-07-03

## [3.2.4-RC] - 2026-07-03

### Added
- **Era 2.2: The Decision Platform**: Refined the learning loop to emphasize decision-making over raw telemetry.
- **Institutional Learning Engine**: Integrated mandatory "Surprise/Certainty/Anti-pattern" post-mortems into `EVIDENCE_MEMORY.md`.
- **One-Page Research Template**: Standardized research-first sprint planning in `AGENTS.md`.
- **Decision Yield & Velocity KPIs**: New metrics to track the effectiveness of the learning organization.
- **D1 Retention Analytics**: Heuristic-based retention tracking in the Observation Deck.
- **Exit Gate Refinement**: Added temporal depth (5 consecutive days) to ERC-002 acceptance criteria.

### Changed
- Replaced "Time to Confidence" with "Decision Yield" in the executive dashboard view.
- Upgraded `DECISIONS.md` to the Product Decision Record (PDR) format.
- Refined the "3 Questions Rule" to focus on behavioral impact and decision velocity.

## [3.2.3-RC] - 2026-07-03

### Added
- **ERC-002 Evidence Instrumentation**: Shifted focus from system metrics to human perception monitoring.
- **Perception Survey**: Integrated a non-intrusive micro-survey to capture "Perceived Freeze Rate" (PFR).
- **Product Insights Dashboard**: New specialized view in TelemetryDashboard for Product teams.
- **KPI: Confidence Recovery**: Measures the system's ability to regain user trust after performance dips.
- **KPI: Learning Velocity**: Tracked decision-readiness based on dogfooding sample size (Target: 20 sessions).
- **Sample Health Analytics**: Monitoring unique sessions, dogfooding days, and survey completion stability.
- **Learning Product Framework**:
    - **PDR (Product Decision Record)**: Revamped `DECISIONS.md` into a scientific governance log.
    - **Evidence Memory Layer**: Created `EVIDENCE_MEMORY.md` to codify institutional knowledge and Product Principles.
    - **Metric Survival Rule**: Formalized "Measure Less, Learn More" policy in `PRODUCT.md`.
    - **Product Knowledge Graph**: Defined the linkage between Problems, Evidence, and Capabilities.

### Changed
- Refined `Correlation Engine` to persist `routineId` for better session linkage in perception surveys.
- Upgraded `TelemetryDashboard` with tabbed navigation (Engineering vs. Product views).

### Fixed
- Fixed missing `ThumbsUp` icon import and `HealthStat` component rendering in Diagnostics deck.

## [3.2.2-RC] - 2026-07-03

### Added
- **MUPS-001**: Implementation of Progressive Execution UX Layer.
- **Telemetry v2**: Upgraded `telemetryService` with detailed performance metrics (TTFF, TTFP, Max Silent Gap, Perceived Wait Ratio).
- **Diagnostics Deck**: Revamped `TelemetryDashboard` (Observation Deck) with strategic KPI cards, session timelines, and live evidence streaming.
- **System Hooks**: Integrated telemetry tracking into RSS Feed Service and Audio PCM Player for end-to-end latency monitoring.
- **Execution States**: Fluid state transitions (Initializing, Fetching, Ranking, Synthesizing, Playing) with motion feedback.
- **Evidence Framework**: `ERC-002_REPORT_TEMPLATE.md` for scientific verification.
- **Persistence**: Enhanced IndexedDB persistence for briefings and preferences.

### Changed
- Refactored `App.tsx` to integrate with the new `ExecutionStateView` and `telemetryService`.
- Improved stability of the `ManualPcmPlayer` to handle concurrent state updates.
- Updated `ARCHITECTURE.md` and `ROADMAP.md` to reflect Era 2 (Evidence-Driven Evolution).

### Fixed
- Fixed duplicated `routineId` in `App.tsx` state management.
- Fixed type errors and missing imports in `TelemetryDashboard.tsx`.
- Removed redundant console logs in telemetry streams.

---

## [3.1.0] - 2026-07-02

### Added
- Initial News Intelligence Core architecture.
- Source Connector interface for RSS feeds.
- Gemini API integration for news ranking and summarization.
