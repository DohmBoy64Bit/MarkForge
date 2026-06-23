# Phase 10 Packaging and Documentation Changelog

Date: June 22, 2026

Scope: reproducible Windows packaging baseline, validation gate, and Linux smoke plan.

## Completed

- Added `pnpm packaging:check`.
- Added `scripts/packaging-check.mjs` to validate release scripts, Tauri config, Cargo metadata, icons, capabilities, NSIS targets, installer mode, window baselines, CSP baseline, and version alignment.
- Added `docs/packaging-release.md` with prerequisites, validation sequence, Windows installer commands, artifact paths, manual smoke checks, Linux smoke plan, and updater status.
- Added `docs/phase-10-packaging-documentation.md`.
- Updated README, roadmap, developer docs, user docs, product requirements, architecture, and parity tracking for Phase 10.

## Verification

- `pnpm docs:check`
- `pnpm test`
- `pnpm build:editor`
- `pnpm build:viewer`
- `pnpm bundle:check`
- `pnpm packaging:check`
- `cargo check` in both Tauri app crates.
- `pnpm tauri:build`
- `pnpm tauri:viewer:build`

## Still Deferred

- Code signing.
- Auto-updater plugin and update metadata publishing.
- Windows file associations and recent-document shell integration.
- Linux AppImage/deb/rpm artifacts and smoke evidence.
- Native file watching, spellcheck, rich clipboard, and native PDF export.
