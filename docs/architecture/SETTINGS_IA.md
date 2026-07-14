# Settings Information Architecture (IA)

This document establishes the **Operator Mental Model** for CommuteCast settings, pivoting away from technical modules to goal-oriented categories.

## 1. Top-Level Categories

| Category | Operator Goal | Sub-sections |
| :--- | :--- | :--- |
| **1. My Experience** | "Make the app look and feel right for me." | Theme, Font Size, Layout, Driving Mode, Animations. |
| **2. Voice** | "Change how the broadcast sounds." | Language, Voice Character, Speed, Pitch, Sample Test. |
| **3. Personalization** | "Make the news more relevant to my life." | Identity (Name), Interests, Editorial Tone, Memory, AI Personality. |
| **4. Briefing Sources** | "Control where my news comes from." | News Sources (RSS), Keywords, Filters, Frequency. |
| **5. My Data** | "Manage my library and backups." | Library Management, Cache, Backup/Sync, Export. |
| **6. Privacy** | "Control my digital footprint." | Data Collection, Permissions, Account Security. |
| **7. Advanced** | "Access technical controls (Experts only)." | System Logs, Experimental Features, Developer Tools. |

## 2. Capability Mapping
Settings no longer control "Module Parameters" directly. They set **Capability Preferences**:
- **Voice Settings** -> Maps to `PreferredVoiceCapability`.
- **Sources** -> Maps to `PreferredSourceCapability`.
- **Theme** -> Maps to `SystemVisualCapability`.

## 3. Search Model
Every setting must be indexable via a **Semantic Search Interface**:
- Search: "Voice" -> Matches `Category: Voice`.
- Search: "Bigger text" -> Matches `My Experience > Font Size`.
- Search: "Stop history" -> Matches `Privacy > Data Collection`.
