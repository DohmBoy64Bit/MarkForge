# Phase 8: Theme Engine

Phase 8 moves MarkForge theme behavior from app-local color definitions toward a package-owned token model.

## Phase 8A-8D Shipped Scope

- Phase 8A audited current theme usage and confirmed the main drift: `packages/theme-engine` had a tested built-in registry, while editor/viewer shells still duplicated light/dark CSS variables locally.
- Phase 8B added app-facing semantic tokens and CSS-variable generation in `packages/theme-engine`.
- Phase 8C wired editor and viewer shell roots to consume `themeToAppCssVariables(...)` from `packages/theme-engine`.
- Phase 8D exposes Sepia Paper as the first non-light/dark app-visible theme in the editor and viewer compact theme controls, and app chrome preferences only restore currently visible app themes.

## Current App-Visible Themes

- Light.
- Dark.
- Sepia Paper.

The package registry also contains high contrast, GitHub-like, and modern neutral themes. Those are still package-ready rather than fully exposed as app controls until the next theme UI pass validates contrast, screenshots, and preference ergonomics for every app surface.

## Design Notes

The new Sepia Paper app surface is intentionally MarkForge-native. It uses warm paper and muted olive accents for long-form writing without copying MarkText's visual styling.

The editor and viewer still keep layout and component CSS locally. The color source of truth for app chrome, panels, source surfaces, preview pages, code blocks, warnings, danger states, and grid lines now comes from `packages/theme-engine`.

## Verification

- `packages/theme-engine/src/index.spec.ts` covers app-facing token generation.
- `packages/core/src/index.spec.ts` and `apps/editor/src/ui/editorPreferences.spec.ts` cover persisted non-light/dark theme IDs.
- Phase 8D screenshot evidence lives under `docs/audits/screenshots/phase-8d/`.

## Remaining Work

- Surface high contrast, GitHub-like, and modern neutral app themes after visual validation.
- Add system-theme following through `packages/platform`.
- Integrate code highlighting theme selection with rendered code blocks.
- Wire export/print theme options into converter/export settings.
- Define custom theme JSON/CSS variable validation and loading.
