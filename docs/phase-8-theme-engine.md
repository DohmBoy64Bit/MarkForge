# Phase 8: Theme Engine

Phase 8 moves MarkForge theme behavior from app-local color definitions toward a package-owned token model.

## Phase 8A-8F Shipped Scope

- Phase 8A audited current theme usage and confirmed the main drift: `packages/theme-engine` had a tested built-in registry, while editor/viewer shells still duplicated light/dark CSS variables locally.
- Phase 8B added app-facing semantic tokens and CSS-variable generation in `packages/theme-engine`.
- Phase 8C wired editor and viewer shell roots to consume `themeToAppCssVariables(...)` from `packages/theme-engine`.
- Phase 8D exposes Sepia Paper as the first non-light/dark app-visible theme in the editor and viewer compact theme controls, and app chrome preferences only restore currently visible app themes.
- Phase 8E exposes High Contrast, GitHub, and Modern Neutral through the same package-owned app theme list.
- Phase 8F keeps editor, viewer, preferences, persistence, tests, and documentation synchronized around the complete built-in app theme set.

## Current App-Visible Themes

- Light.
- Dark.
- Sepia Paper.
- High Contrast.
- GitHub.
- Modern Neutral.

The editor and viewer compact switchers consume `appVisibleThemes` from `packages/theme-engine`, so the app-visible list is package-owned rather than duplicated in app-local filters.

## Design Notes

The app theme set is intentionally MarkForge-native. Sepia Paper uses warm paper and muted olive accents for long-form writing, High Contrast prioritizes strong edges and yellow focus/accent cues, GitHub follows familiar documentation colors without becoming a GitHub clone, and Modern Neutral gives the workbench a quiet technical-docs surface.

The editor and viewer still keep layout and component CSS locally. The color source of truth for app chrome, panels, source surfaces, preview pages, code blocks, warnings, danger states, and grid lines now comes from `packages/theme-engine`.

## Verification

- `packages/theme-engine/src/index.spec.ts` covers the built-in registry, app-visible theme list, and app-facing token generation.
- `packages/core/src/index.spec.ts` and `apps/editor/src/ui/editorPreferences.spec.ts` cover persisted built-in app theme IDs.
- Phase 8 completion screenshot evidence lives under `docs/audits/screenshots/phase-8/`.

## Post-Phase-8 Follow-On Work

- Add system-theme following through `packages/platform`.
- Integrate code highlighting theme selection with rendered code blocks.
- Wire export/print theme options into converter/export settings.
- Define custom theme JSON/CSS variable validation and loading.
