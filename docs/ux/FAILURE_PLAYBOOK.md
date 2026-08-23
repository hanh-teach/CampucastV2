# Failure Playbook

This document defines the user experience response to system failures, ensuring recovery is always prioritized over error reporting.

| Failure Event | User Experience Response |
| :--- | :--- |
| **RSS Feed Error** | "Cannot retrieve latest news. You can continue editing with the latest cached RSS version or manually enter content." |
| **AI Processing Timeout** | "AI generation took too long. Your work is safe; would you like to retry the generation?" |
| **Export/Save Error** | "Export failed. Your work is saved locally. Please check your storage or try exporting again." |
| **Audio/Voice Failure** | "Unable to generate audio voice. Your script is safe. Please check voice configuration or retry." |
| **Internet Connection Lost** | "Connection lost. Your work is being saved locally. You can continue editing offline." |
| **Storage Full** | "Storage is full. Please free up space or export your projects to avoid data loss." |
| **Browser Closed/Unloaded** | (Silent Autorecovery) "Welcome back! Your work has been saved." |
| **App/Browser Crash** | "We've recovered your work from before the crash. [Continue Editing]" |
