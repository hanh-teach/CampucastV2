# Screen Responsibility Matrix - CommuteCast v3.2

Each screen in the application is assigned exactly one primary responsibility. Functionality that does not align with this responsibility must be moved.

| Screen | Primary Responsibility | Forbidden Content |
| :--- | :--- | :--- |
| **Home (Console)** | Real-time status, active queue, and "next action" visibility. | Deep configuration, historical archive browsing, source editing. |
| **Create (Studio)** | Moving a single Mission from Source to Export. | Global profile editing, past mission management, general RSS feed cleanup. |
| **Library (Archive)** | Management and retrieval of Projects, Missions, and Assets. | Active production controls, real-time player (except for archive preview), global system settings. |
| **Settings (Gov)** | Global platform-wide defaults and system state. | Per-Mission overrides (handled in Create), active production, history browsing. |

## Enforcement Rules
1. **Contextual Isolation**: If a user is in `Create`, they are producing. Any "RSS Management" must be limited to *selecting* sources for that specific mission.
2. **Single Entry Point**: There should only be one way to perform global actions (e.g., changing the default AI Host), which is via the Settings Workstation.
3. **No UI Bleed**: Feature UI (like the PCM Player) must adapt its responsibility based on the parent screen (e.g., in `Create`, it's a *Preview* tool; in `Library`, it's an *Archive* listener).
