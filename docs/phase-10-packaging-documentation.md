# Phase 10 Packaging and Documentation

Date: June 22, 2026

Phase 10 turns the Windows packaging path into a documented, repeatable baseline and starts the Linux packaging track with an explicit smoke plan.

## Completed

- Added a repository packaging validation gate: `pnpm packaging:check`.
- Documented the Windows NSIS installer build sequence for editor and viewer.
- Documented expected installer artifact locations.
- Documented Rust, JavaScript, docs, bundle, and packaging validation commands.
- Documented manual Windows installer smoke checks.
- Documented the initial Linux smoke plan and package-format evaluation order.
- Updated roadmap, developer docs, user docs, product requirements, and README links.

## Current Windows Baseline

- Editor Tauri identifier: `com.markforge.editor`.
- Viewer Tauri identifier: `com.markforge.viewer`.
- Editor installer target: NSIS, per-user install.
- Viewer installer target: NSIS, per-user install.
- Both apps keep local-first CSP constraints and app-local icon assets.

## Verification

Required Phase 10 validation:

```bash
pnpm docs:check
pnpm test
pnpm build:editor
pnpm build:viewer
pnpm bundle:check
pnpm packaging:check
```

Rust validation:

```bash
cd apps/editor/src-tauri && cargo check
cd apps/viewer/src-tauri && cargo check
```

Installer validation:

```bash
pnpm tauri:build
pnpm tauri:viewer:build
```

## Still Deferred

- Code signing.
- Auto-updater plugin and update metadata publishing.
- Release-channel policy.
- Windows file associations.
- Windows recent-document shell integration.
- Linux AppImage/deb/rpm artifacts and smoke evidence.
- Native file watching, spellcheck, rich clipboard, and native PDF export.
