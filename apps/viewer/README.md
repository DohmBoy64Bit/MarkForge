# MarkForge Viewer

Phase 10-complete standalone Markdown viewer app/mode for local Markdown and text files.

## Current Scope

- Tauri v2 + React + Vite workspace package named `@markforge/viewer`.
- Local file open and reload for `.md`, `.markdown`, `.mdown`, and `.txt`.
- Sanitized rendering through `@markforge/markdown-engine`.
- Inspector sidebar for file status, front matter, table of contents, search matches, and render warnings.
- Metadata polling for temporary auto-refresh detection.
- Export HTML for the currently rendered Markdown/text document through `@markforge/converters` and a constrained `.html`/`.htm` write path.
- Native menu actions for open, reload, copy source, copy rendered text, Export HTML, print, and quit.
- Package-backed Light, Dark, Sepia Paper, High Contrast, GitHub, and Modern Neutral app theme controls through `@markforge/theme-engine`.
- Windows installer declares `.md`, `.markdown`, `.mdown`, and `.txt` file associations and startup file arguments load through the existing viewer load path.

## Commands

```bash
pnpm --filter @markforge/viewer build
pnpm --filter @markforge/viewer tauri dev
pnpm --filter @markforge/viewer tauri build
```

From the repository root:

```bash
pnpm build:viewer
pnpm tauri:viewer:dev
pnpm tauri:viewer:build
```

## Packaging Status

- Windows NSIS installer output is documented in `docs/packaging-release.md`.
- Release-critical Tauri/Cargo/package metadata is checked by `pnpm packaging:check`.
- Linux installer artifacts, signing, updater publishing, and file associations remain release-hardening work.
