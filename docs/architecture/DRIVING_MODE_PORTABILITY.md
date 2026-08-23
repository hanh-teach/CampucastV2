# Driving Mode & Speech Recognition Portability Audit

This document analyzes the portability of the Voice Intelligence system (Driving Mode) for mobile platforms (React Native / Capacitor).

## 1. Core Logic (Reusable)

The following logic is platform-agnostic and can be reused immediately:
- `matchAndStripWakeWord` (in `useDrivingMode.ts`): Pure string manipulation.
- `parseVoiceCommand` (in `src/utils/parseVoiceCommand.ts`): Regex-based text parsing.
- State management for transcript, feedback, and error messages.

## 2. Platform Dependencies (Web API)

The following areas depend on Web APIs and must be abstracted for mobile:

### `useSpeechRecognition.ts`
- **`SpeechRecognition` / `webkitSpeechRecognition`**:
  - Location: `startListening` (lines 114, 130).
  - Mobile Replacement: `react-native-voice` or native bridge to iOS `SFSpeechRecognizer` / Android `SpeechRecognizer`.
- **`window.onLine` / `window.addEventListener("offline")`**:
  - Location: `useEffect` (line 89), `startListening` (line 103).
  - Mobile Replacement: `@react-native-community/netinfo`.
- **`performance.now()`**:
  - Location: `onstart` (line 137), `onend` (line 179).
  - Mobile Replacement: `Date.now()` or native high-res timer.

### `useDrivingMode.ts`
- **`AudioContext` (Beep/Tick generation)**:
  - Location: `playTick` (line 44).
  - Mobile Replacement: `react-native-sound` or `expo-av`.
- **`document.visibilitychange`**:
  - Location: `useEffect` (line 184).
  - Issue: Web-only global.
  - Mobile Replacement: `AppState` API in React Native.
- **`useUserPreferences`**:
  - Dependency: `../components/UserPreferencesProvider`.
  - Issue: Layer violation (depends on UI component).
  - Solution: Migrate preferences to a non-UI hook/service.

### `DrivingMode.tsx`
- **`navigator.vibrate`**:
  - Location: `handleVoiceCommand` (line 213).
  - Mobile Replacement: `Vibration` API in React Native.

## 3. Proposed Abstraction Interfaces

To avoid modifying hooks when porting, we should inject these dependencies.

### Speech Recognition Adapter
```typescript
interface SpeechRecognitionAdapter {
  isSupported(): boolean;
  isOnline(): boolean;
  createInstance(options: {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onStart: () => void;
    onEnd: () => void;
    onResult: (transcript: string, isFinal: boolean) => void;
    onError: (error: string) => void;
  }): any;
}
```

### Platform Utilities
```typescript
interface PlatformUtils {
  vibrate(pattern: number | number[]): void;
  playFeedbackSound(): void;
  onAppStateChange(handler: (state: 'active' | 'background') => void): () => void;
}
```

## 4. Immediate Refactoring Plan (Phase 1)
- [ ] Allow injecting `SpeechRecognition` class into `useSpeechRecognition`.
- [ ] Add optional `vibrate` and `playTick` overrides to `useDrivingMode`.
- [ ] Move preference types to `src/types.ts`.
