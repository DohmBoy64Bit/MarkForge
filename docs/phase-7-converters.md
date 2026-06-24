# Phase 7: Converters

Phase 7 starts the MarkForge conversion track as a package-owned capability, not an app-local export menu rewrite.

## Phase 7F Shipped App Integration

- `packages/converters` keeps the plugin-style converter contract with metadata, capability checks, typed results, warnings, cancellation, and explicit unsupported capability reporting.
- Markdown-to-HTML export remains backed by `packages/markdown-engine`, so sanitization and heading behavior stay aligned with editor/viewer rendering.
- Browser print remains a converter-backed handoff to the host webview print dialog; it does not claim native PDF generation.
- The editor exposes compact toolbar and native-menu actions for supported active-document conversion: Export HTML and Clean Markdown. Export writes through `packages/platform` save/write services; cleanup updates the active tab through the existing document update path.
- Phase 7C adds editor Import Conversion for supported HTML-to-Markdown, CSV-to-Markdown-table, rich clipboard HTML, and URL/article conversions. Converted Markdown can replace the current selection, insert at the cursor, or append to the document through tested insertion helpers.
- Phase 7D adds a bounded converter activity feed in the editor inspector for supported import, export, cleanup, and print actions, including success, warning, and error states.
- Phase 7E polishes the converter workflow with a responsive dialog, segmented source/insert controls, disabled/converting states, and screenshot-stable layout behavior.
- Phase 7F updates documentation, validation, and screenshot evidence for the expanded converter UI.
- The viewer exposes Export HTML for the currently rendered Markdown/text document, using the shared converter and a constrained `.html`/`.htm` write command. Markdown/text open/reload support remains unchanged.
- The platform facade includes a dedicated HTML save-dialog filter so converter UI does not reuse Markdown save filters for HTML output.
- Compact converter UI helpers cover default `.html` export paths and warning-aware status messages.

## Phase 7A Package Foundation

- HTML-to-Markdown import is implemented through Turndown and reports a lossy-conversion warning because styling and layout are intentionally dropped.
- HTML export settings support generated metadata and table-of-contents insertion.
- CSV-to-Markdown table conversion supports quoted fields, escaped quotes, ragged-row padding warnings, and Markdown table pipe escaping.
- Rich clipboard HTML conversion is implemented through the same sanitized HTML-to-Markdown path with clipboard-specific lossiness warnings.
- URL/article conversion validates HTTP(S) URLs, fetches HTML through an injected/global fetch path, and reports trust/lossiness warnings.
- Markdown cleanup normalizes line endings, trailing whitespace, excessive blank lines, and final newline behavior.
- DOCX import/export, PDF text import, Markdown-to-PDF export, and OCR image import are implemented through packaged converter runtimes and app binary file I/O. Broader fidelity fixtures remain required before claiming full native document parity.

## Design Notes

The converter UI exposes capabilities that have package-owned implementation and tests: Markdown-to-HTML/PDF/DOCX export, HTML-to-Markdown import, CSV-to-Markdown table import, rich clipboard HTML import, URL/article import, DOCX import, PDF text import, OCR image import, Markdown cleanup in the editor, and browser-print handoff. Full document fidelity remains fixture-driven follow-up work.

Unsupported converters are not placeholders presented as complete. They exist so callers can query or call a documented boundary and receive a clear `not-supported` result with a reason.

## Verification

- `packages/converters/src/index.spec.ts` covers Markdown-to-HTML, export settings, browser print, HTML-to-Markdown, rich clipboard HTML import, URL/article import, CSV-to-Markdown table, Markdown cleanup, and unsupported PDF boundary behavior.
- `packages/platform/src/index.spec.ts` covers the HTML save-dialog filter used by converter export UI.
- `apps/editor/src/ui/converterWorkflow.spec.ts` covers supported converted-Markdown insertion modes.
- `apps/editor/src/ui/converterActivity.spec.ts` covers bounded converter activity history.
- `pnpm test` includes the converter fixtures.

## Remaining Work

- Add DOCX import with file parsing fixtures.
- Add native PDF import/export only after text/layout strategy and fixture expectations are defined.
- Add OCR after runtime/model packaging decisions are made.
