# Phase 7: Converters

Phase 7 starts the MarkForge conversion track as a package-owned capability, not an app-local export menu rewrite.

## Phase 7B Shipped App Integration

- `packages/converters` keeps the plugin-style converter contract with metadata, capability checks, typed results, warnings, cancellation, and explicit unsupported capability reporting.
- Markdown-to-HTML export remains backed by `packages/markdown-engine`, so sanitization and heading behavior stay aligned with editor/viewer rendering.
- Browser print remains a converter-backed handoff to the host webview print dialog; it does not claim native PDF generation.
- The editor exposes compact toolbar and native-menu actions for supported active-document conversion: Export HTML and Clean Markdown. Export writes through `packages/platform` save/write services; cleanup updates the active tab through the existing document update path.
- The viewer exposes Export HTML for the currently rendered Markdown/text document, using the shared converter and a constrained `.html`/`.htm` write command. Markdown/text open/reload support remains unchanged.
- The platform facade includes a dedicated HTML save-dialog filter so converter UI does not reuse Markdown save filters for HTML output.
- Compact converter UI helpers cover default `.html` export paths and warning-aware status messages.

## Phase 7A Package Foundation

- HTML-to-Markdown import is implemented through Turndown and reports a lossy-conversion warning because styling and layout are intentionally dropped.
- CSV-to-Markdown table conversion supports quoted fields, escaped quotes, ragged-row padding warnings, and Markdown table pipe escaping.
- Markdown cleanup normalizes line endings, trailing whitespace, excessive blank lines, and final newline behavior.
- DOCX, native PDF import/export, rich clipboard import, URL/article extraction, and OCR are explicit unsupported converter boundaries in Phase 7A.

## Design Notes

Phase 7B exposes only the Phase 7A capabilities that are safe in the current apps: Markdown-to-HTML export, Markdown cleanup in the editor, and browser-print handoff. DOCX, native PDF, OCR, URL/article extraction, and rich clipboard conversion are not surfaced as working UI actions.

Unsupported converters are not placeholders presented as complete. They exist so callers can query or call a documented boundary and receive a clear `not-supported` result with a reason.

## Verification

- `packages/converters/src/index.spec.ts` covers Markdown-to-HTML, browser print, HTML-to-Markdown, CSV-to-Markdown table, Markdown cleanup, and unsupported PDF boundary behavior.
- `packages/platform/src/index.spec.ts` covers the HTML save-dialog filter used by converter export UI.
- `pnpm test` includes the converter fixtures.

## Remaining Work

- Add DOCX import with file parsing fixtures.
- Add native PDF import/export only after text/layout strategy and fixture expectations are defined.
- Add rich clipboard import after platform MIME access is exposed through `packages/platform`.
- Add URL/article extraction after network/readability policy and trust prompts are defined.
- Add OCR after runtime/model packaging decisions are made.
