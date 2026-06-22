# Phase 8 Completion Theme Engine Changelog

Date: June 22, 2026.

Scope: Phase 8 completion after the Phase 8D Sepia baseline.

## Changed

- Promoted High Contrast, GitHub, and Modern Neutral from package-ready themes to app-visible editor/viewer controls.
- Added `appVisibleThemes` in `packages/theme-engine` so editor, viewer, and preferences consume a package-owned app theme list.
- Expanded persisted editor app chrome preferences to accept all six built-in app-visible theme IDs.
- Kept editor/viewer app chrome colors backed by `themeToAppCssVariables(...)`.
- Updated the editor preferences theme selector to lay out the complete built-in set without duplicating app-local theme filters.

## Evidence

- Theme-engine tests cover the built-in registry, app-visible list, and app-facing variables.
- Core/editor preference tests cover persistence for Sepia Paper, High Contrast, GitHub, and Modern Neutral.
- Phase 8 screenshot evidence lives under `docs/audits/screenshots/phase-8/`.

## Follow-On Boundaries

- System theme following still needs a platform/settings contract.
- Export/print theme settings still need converter/export settings UI.
- Custom theme loading still needs JSON/CSS validation and scoped loading.
- Full syntax-highlighter theme switching remains separate from the app chrome/code-block variable baseline.
