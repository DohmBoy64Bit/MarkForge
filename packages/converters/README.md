# packages/converters

Plugin-style Convert to Markdown architecture and converter implementations.

Current status: implemented package boundary.

## Public API

- Plugin-style converter contract with metadata, capability checks, result types, warnings, and cancellation.
- Sanitized Markdown-to-HTML converter backed by `packages/markdown-engine`.
- Browser-print converter that truthfully delegates PDF/printer output to the host webview print dialog.
- HTML-to-Markdown converter backed by Turndown, with lossy-conversion warnings.
- CSV-to-Markdown table converter with quoted-field parsing and ragged-row warnings.
- Markdown cleanup converter for line endings, trailing whitespace, excessive blank lines, and final newline normalization.
- Compact app-facing helpers for default HTML export paths and warning-aware conversion status messages.
- Explicit unsupported converter boundaries for DOCX, native PDF import/export, rich clipboard import, URL/article extraction, and OCR.

DOCX, OCR, URL import, rich clipboard import, and full native PDF import/export are explicitly unsupported in Phase 7B; this package does not claim those capabilities.
