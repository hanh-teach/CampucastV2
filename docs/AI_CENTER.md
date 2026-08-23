# AI Center Documentation

## Overview
The AI Center (`AIHostView.tsx`) allows users to calibrate their AI assistant co-host experience.

## Features
- **Personality (Tone) Selection**: Choose how the AI sounds (Conversational, Traditional, Upbeat, Analytical, Witty).
- **Voice Selection**: Select from available voices in the local browser speech engine.
- **Vocal Calibration**: 
  - **Reading Speed**: Adjust the speed (`rate`) of the voice output (0.8x - 1.3x).
  - **Vocal Pitch**: Adjust the `pitch` of the voice output (0.8x - 1.2x).
- **Special Directives**: Provide custom instructions to tailor AI responses.
- **Knowledge Snapshots**: View and switch between different data snapshots for the AI's knowledge base.

## Implementation Details
- **Settings Consumption**: Settings are passed to the `useAssistant` hook and applied directly to the `SpeechSynthesisUtterance` interface, ensuring that the voice output adheres to user preferences.
- **State Management**: Preferences are updated via `useUserPreferences` and persisted for future sessions.
