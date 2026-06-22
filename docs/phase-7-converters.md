# Phase 7: Converters

Phase 7 starts the MarkForge conversion track as a package-owned capability, not an app-local export menu rewrite.

## Phase 7A Shipped Foundation

- `packages/converters` keeps the plugin-style converter contract with metadata, capability checks, typed results, warnings, cancellation, and explicit unsupported capability reporting.
- Markdown-to-HTML export remains backed by `packages/markdown-engine`, so sanitization and heading behavior stay aligned with editor/viewer rendering.
- Browser print remains a converter-backed handoff to the host webview print dialog; it does not claim native PDF generation.
- HTML-to-Markdown import is implemented through Turndown and reports a lossy-conversion warning because styling and layout are intentionally dropped.
- CSV-to-Markdown table conversion supports quoted fields, escaped quotes, ragged-row padding warnings, and Markdown table pipe escaping.
- Markdown cleanup normalizes line endings, trailing whitespace, excessive blank lines, and final newline behavior.
- DOCX, native PDF import/export, rich clipboard import, URL/article extraction, and OCR are explicit unsupported converter boundaries in Phase 7A.

## Design Notes

Phase 7A is package-first. No new editor or viewer UI was added because the current docs define converter package capabilities more clearly than they define an import/export workflow surface. App integration should come after the converter contract has enough tested capabilities to expose safely.

Unsupported converters are not placeholders presented as complete. They exist so callers can query or call a documented boundary and receive a clear `not-supported` result with a reason.

## Verification

- `packages/converters/src/index.spec.ts` covers Markdown-to-HTML, browser print, HTML-to-Markdown, CSV-to-Markdown table, Markdown cleanup, and unsupported PDF boundary behavior.
- `pnpm test` includes the converter fixtures.

## Remaining Work

- Add app UI for import/export only after workflow requirements are documented.
- Add DOCX import with file parsing fixtures.
- Add native PDF import/export only after text/layout strategy and fixture expectations are defined.
- Add rich clipboard import after platform MIME access is exposed through `packages/platform`.
- Add URL/article extraction after network/readability policy and trust prompts are defined.
- Add OCR after runtime/model packaging decisions are made.
