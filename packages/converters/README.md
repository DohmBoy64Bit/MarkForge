# packages/converters

Plugin-style Convert to Markdown architecture and converter implementations.

Current status: implemented package boundary.

## Public API

- Plugin-style converter contract with metadata, capability checks, result types, warnings, and cancellation.
- Sanitized Markdown-to-HTML converter backed by `packages/markdown-engine`.
- HTML export settings for generated metadata and table-of-contents insertion.
- Browser-print converter that truthfully delegates PDF/printer output to the host webview print dialog.
- HTML-to-Markdown converter backed by Turndown, with lossy-conversion warnings.
- CSV-to-Markdown table converter with quoted-field parsing and ragged-row warnings.
- Rich clipboard HTML-to-Markdown converter with lossy-conversion warnings.
- URL/article-to-Markdown converter with HTTP(S) validation, injected/global fetch support, and trust warnings.
- Markdown cleanup converter for line endings, trailing whitespace, excessive blank lines, and final newline normalization.
- Compact app-facing helpers for default HTML export paths and warning-aware conversion status messages.
- Editor-facing workflow coverage for supported HTML/CSV import insertion and converter activity history lives in `apps/editor/src/ui` with focused tests.
- Explicit unsupported converter boundaries for DOCX, native PDF import/export, and OCR.

DOCX, OCR, and full native PDF import/export remain explicit external-runtime boundaries. URL and rich clipboard conversion are supported through HTML-to-Markdown paths with trust/lossiness warnings.
