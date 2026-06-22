# Phase 8D Theme Engine Changelog

Date: June 22, 2026

Scope: Phase 8A through Phase 8D.

## Completed

- Audited editor/viewer theme usage and confirmed app-local CSS variable duplication as the active theme drift.
- Added app-facing theme token generation to `packages/theme-engine`.
- Widened persisted editor theme preferences to known built-in theme IDs.
- Wired editor and viewer shell roots to package-generated app CSS variables.
- Exposed Sepia Paper as the first non-light/dark app-visible theme in editor, viewer, and editor preferences.
- Updated current-status docs, architecture notes, theming docs, parity rows, and screenshot evidence.

## Still Deferred

- App-visible High Contrast, GitHub-like, and Modern Neutral controls.
- System theme following.
- Syntax-highlighter theme switching beyond app code block variables.
- Export/print theme option UI.
- Custom theme JSON/CSS variable loading and validation.

## Verification

- `pnpm vitest run packages/theme-engine/src/index.spec.ts packages/core/src/index.spec.ts apps/editor/src/ui/editorPreferences.spec.ts`
- `pnpm build:editor`
- `pnpm build:viewer`
- Desktop and mobile screenshot evidence under `docs/audits/screenshots/phase-8d/`
