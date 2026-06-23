# Phase 12 Rich Editor Surface

Date: 2026-06-23

Phase 12 starts the rich editor surface track by replacing the plain source textarea with the planned CodeMirror 6 source editor foundation. This is not WYSIWYG/realtime editing yet; it is the source-mode substrate that future rich editing, autocomplete, linting, and formatting work can build on.

## Implemented

- Added CodeMirror 6 dependencies to `apps/editor`.
- Added `SourceEditor`, a React wrapper around CodeMirror with Markdown syntax support, line numbers, history, active-line highlighting, bracket matching, line wrapping, spellcheck attributes, focus reporting, selection reporting, scroll helpers, and imperative selection control.
- Rewired the editor app to use the CodeMirror selection bridge for:
  - formatting commands
  - command palette execution
  - quick insert execution
  - template insertion
  - template suggestions
  - converter insertion
  - Local AI insertion
  - source search jump
  - replace current/all
  - selection overlay visibility
- Preserved source, split, and preview modes.
- Added CodeMirror and Lezer manual chunks in the editor Vite config so the existing 500 KiB bundle budget remains enforced.
- Added browser-safe guards for Tauri window lifecycle/menu/startup-file paths so design evaluation can load the editor page without a Tauri shim.

## Design Evaluation

The frontend-design skill workflow was used for this UI phase:

- A design brief was written to `C:\Users\SeanS\AppData\Local\Temp\markforge-phase12-kox2iva2.bc2\brief.md`.
- A design implementation subagent implemented the CodeMirror surface.
- A design evaluator subagent returned `MAJOR REVISION` on attempt 1 because the browser page blank-crashed without Tauri internals.
- The implementation subagent fixed the mount crash.
- The evaluator returned `PASS` on attempt 2.

Screenshot evidence:

- [Desktop CodeMirror editor](audits/screenshots/phase-12/editor-codemirror-desktop.png)
- [Mobile CodeMirror editor](audits/screenshots/phase-12/editor-codemirror-mobile.png)

## Verification

Commands run successfully:

```bash
pnpm build:editor
pnpm build:viewer
pnpm bundle:check
pnpm test
pnpm docs:check
```

Additional visual smoke:

- Playwright opened `http://127.0.0.1:1420/`.
- `.cm-editor` rendered on desktop and mobile.
- Screenshots were captured under `docs/audits/screenshots/phase-12/`.

## Still Deferred

- WYSIWYG/realtime editing.
- Advanced table tools.
- Image insertion and editing tools.
- General Markdown autocomplete beyond template suggestions.
- Markdown linting and formatter integration.
- Focus mode, typewriter mode, and distraction-free mode.
