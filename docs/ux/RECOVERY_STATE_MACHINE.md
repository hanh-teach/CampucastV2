# Recovery State Machine

## 🔄 State Machine Logic
| State | Transition | Recovery Action | User Message |
| :--- | :--- | :--- | :--- |
| **NEW** | User Input | -> EDITING | - |
| **EDITING** | Autosave Trigger (10s) | -> AUTOSAVING | - |
| **AUTOSAVING** | Success | -> SAVED | - |
| **AUTOSAVING** | Failure | -> SAVE_FAILED | [Warning: Saving failed] |
| **SAVED** | Background Task | -> BACKGROUND_RUNNING | - |
| **BACKGROUND_RUNNING**| Success | -> COMPLETED | - |
| **SAVE_FAILED**| Retry Success | -> SAVED | [Auto-saved] |
| **CRASH/RELOAD**| Detect Draft | -> RECOVERABLE | "Found recent draft, resume?" [Continue] |
| **RECOVERABLE**| User Action | -> RESTORED | - |
| **RESTORED** | Resume | -> CONTINUE | - |
| **TAB_CONFLICT**| Detection | -> RESOLVE | - |

## ⚙️ Design Policies
1. **Autosave Trigger**: 10-second interval, and on tab navigation/unload, or before major actions.
2. **Storage Strategy**: `localStorage` (primary draft), `IndexedDB` (large assets/background task state), `SessionStorage` (transient UI state).
3. **Multi-tab Behavior**: Last-writer-wins with version timestamp comparison; prompt only if version mismatch is significant.
4. **Failure Handling**:
   - Save Failure: Silent background retry, show "Saving failed" status if retry > 3.
   - Recovery Failure: Clear corrupted draft, prompt "New Project" with "Previous recovery failed" hint.
5. **Recovery Priority**: 1. Unsaved Crash Draft, 2. Previous Session Save, 3. Manual Save.
6. **User Messaging**: 
   - Never use "Are you sure?" confirmation popups.
   - Use direct action buttons: "Continue", "Start Over".
