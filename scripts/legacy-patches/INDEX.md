# Legacy Patches Index

This index logs and describes the historical, one-off patch and fix scripts deployed throughout the development lifecycle of CommuteCast. To prevent workspace clutter and potential run-time issues, these files have been relocated from the repository root to this folder.

| Script File | Purpose | Type | Status |
| :--- | :--- | :--- | :--- |
| `append_mission_view.sh` | Appends additional fields/sections to Mission View components | Bash | **Applied & Active** |
| `clean_divs.py` | Sanitizes nested markup issues in `AssetsTabView.tsx` | Python | **Applied & Active** |
| `fix_architecture.cjs` | Prunes retired pipeline components from `ARCHITECTURE.md` | CommonJS | **Applied & Active** |
| `fix_empty_states.py` | Restructures state configurations for empty dashboards | Python | **Applied & Active** |
| `fix_pref.py` | Fixes configuration mappings in `preferenceService` | Python | **Applied & Active** |
| `fix_quotes.py` / `fix_quotes2.py` | Converts multi-line quotes in `MissionTabView.tsx` to `\n\n` escaped strings | Python | **Applied & Active** |
| `fix_roadmap.cjs` | Marks deprecated architectural milestones as **ARCHIVED** in `ROADMAP.md` | CommonJS | **Applied & Active** |
| `fix_tabs.py` | Resolves rendering loops on tab selections in the HUD settings panels | Python | **Applied & Active** |
| `patch_actions.py` | Standardizes interactive command handlers for active HUD models | Python | **Applied & Active** |
| `patch_app_rss.py` / `patch_app_rss2.py` | Integrates dynamic RSS database triggers and updates `RSSManager.tsx` | Python | **Applied & Active** |
| `patch_assets.py` | Adjusts style parameters and custom variables inside Assets Tab | Python | **Applied & Active** |
| `patch_clear.py` | Patches clear-data operations and IndexedDB reset hooks | Python | **Applied & Active** |
| `patch_click.py` | Enhances touch triggers for driving HUD buttons | Python | **Applied & Active** |
| `patch_cmd_bar.py` | Overhauls styling and responsive sizing of Mission Command Bar | Python | **Applied & Active** |
| `patch_draft.py` | Handles editing/saving draft configurations inside Mission Workspace | Python | **Applied & Active** |
| `patch_labels.sh` | Resolves localization and Vietnamese translation string values | Bash | **Applied & Active** |
| `patch_mission_bar.py` | Refines the visual representation of active execution states | Python | **Applied & Active** |
| `patch_mission.py` | Enhances mission pipeline event listeners and lifecycle tracking | Python | **Applied & Active** |
| `patch_mission_scrape.py` / `.sh` | Patches scraping/parsing routes for specialized briefing connectors | Python/Bash | **Applied & Active** |
| `patch_mission.sh` | Shell orchestrator for sequential execution pipeline components | Bash | **Applied & Active** |
| `patch_mission_tab_error.py` | Resolves error boundary fallback presentation in the Mission Panel | Python | **Applied & Active** |
| `patch_mission_tab_music.py` | Configures secondary background track lists for daily briefings | Python | **Applied & Active** |
| `patch_mission_voice.py` / `.sh` | Binds real-time speech-to-text recorders to HUD assistants | Python/Bash | **Applied & Active** |
| `patch_musicsynth.py` | Enhances synthesized transition effects in background music mixers | Python | **Applied & Active** |
| `patch_news_routes.py` | Fixes router exceptions and missing content parameters in news APIs | Python | **Applied & Active** |
| `patch.py` | Multi-file regex replacement utility script | Python | **Applied & Active** |
| `patch_subtabs.sh` | Updates sub-tab selection identifiers | Bash | **Applied & Active** |
| `patch_tts_1.py` / `patch_tts_2.py` | Integrates localized reading dictionaries and pronunciation filters | Python | **Applied & Active** |
| `revert_generate.py` | Reverts unstable changes in generative speech pipelines | Python | **Applied & Active** |
| `update_card_actions.py` | Overhauls interactive layout cards in active dashboards | Python | **Applied & Active** |

## Notes
All modifications introduced by these scripts have been successfully integrated into the active React/Express codebase (`src/`, `server.ts`) and are verified by the automated testing suite `/tests/`. These scripts are retained strictly for auditing and historic backup. Do not execute them directly on the active workspace.
