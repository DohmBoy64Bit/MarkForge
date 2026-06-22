# Phase 7F Converter UI Changelog

Date: June 22, 2026

Scope: Phase 7C through Phase 7F.

## Completed

- Added editor Import Conversion for supported HTML-to-Markdown and CSV-to-Markdown-table conversion.
- Added tested insertion rules for replacing the current selection, inserting at the cursor, or appending converted Markdown.
- Added tested converter activity history for supported editor converter actions.
- Added a responsive converter dialog with segmented source and insert controls, disabled/converting states, and compact toolbar/native-menu entry points.
- Updated Phase 7 documentation, current-status docs, parity notes, architecture drift notes, and screenshot evidence.

## Still Deferred

- DOCX import.
- Native PDF import/export.
- Rich clipboard import.
- URL/article extraction.
- OCR import.
- Export settings such as page size, margins, TOC inclusion, headers/footers, and export themes.

## Verification

- `pnpm test`
- `pnpm build:editor`
- `pnpm build:viewer`
- `pnpm bundle:check`
- `pnpm docs:check`
- `cargo check` from `apps/editor/src-tauri`
- Desktop and mobile screenshot evidence under `docs/audits/screenshots/phase-7f/`
