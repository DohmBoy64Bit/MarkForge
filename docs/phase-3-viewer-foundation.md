# Phase 3 Viewer Foundation

Date: 2026-06-21

Phase 3 introduces the standalone MarkForge viewer as its own Tauri v2 workspace package at `apps/viewer`.

## Implemented

- `@markforge/viewer` React/Vite/Tauri app scaffold.
- Markdown and text file opening through native dialog filters for `.md`, `.markdown`, `.mdown`, and `.txt`.
- Native Tauri commands for reading supported text files and polling file metadata.
- Sanitized rendered Markdown through `packages/markdown-engine`.
- Document-first viewer layout with compact command rail and right-side inspector.
- Inspector sections for file status, front matter, generated table of contents, search matches, and render warnings.
- In-document search foundation that lists matching source lines.
- Temporary file-change detection through metadata polling.
- Native menu actions for Open, Reload, Copy Source, Copy Rendered Text, Print, and Quit.
- Light and dark viewer modes as an initial theme control.

## Verification

Expected commands for this slice:

```bash
pnpm --filter @markforge/viewer build
cargo check
```

Run `cargo check` from `apps/viewer/src-tauri`.

## Still Deferred

- Superseded by Phase 11 for opened files: native file watching is implemented through the platform package, with polling fallback support.
- Full search navigation and rendered-range highlighting.
- Copy code buttons for individual fenced blocks.
- Export/PDF workflows beyond browser print.
- Shared platform filesystem abstraction once editor and viewer requirements converge.
- Theme-engine integration after Phase 8 tokens exist.
