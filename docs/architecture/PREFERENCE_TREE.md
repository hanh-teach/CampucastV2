# Preference Tree Specification

This document maps high-level **Operator Preferences** to low-level **Capability Parameters**.

## 1. Mapping Table

| Goal Intent | Primary Parameter | Secondary Parameters | Dependency |
| :--- | :--- | :--- | :--- |
| **"Read Faster"** | `voiceSpeed` | `scriptComplexity`, `backgroundMusicVolume` | None |
| **"More Detail"** | `summaryLength` | `includeOriginalQuotes`, `rssMaxArticles` | RSS Enabled |
| **"Morning Energy"**| `voiceCharacter` | `backgroundMusicTempo`, `lightingTheme` | None |
| **"Deep Focus"** | `drivingMode` | `accessibilityHighContrast`, `disableNotifications` | None |
| **"Privacy First"** | `dataSyncEnabled` | `telemetryEnabled`, `cacheTTL` | None |

## 2. The Multi-Parameter Rule
A single Preference change should be able to trigger multiple parameter updates across different modules (e.g., changing "Energy" affects both Audio and UI Theme).

## 3. Override Hierarchy
1. **Mission-Specific Override**: (Highest priority) Changes made inside a specific production run.
2. **User Preference**: Global settings set in the Console.
3. **System Default**: Hardcoded safe-fallbacks.
