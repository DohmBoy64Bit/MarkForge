# packages/converters

Plugin-style Convert to Markdown architecture and converter implementations.

Current status: implemented package boundary.

## Public API

- Plugin-style converter contract with metadata, capability checks, result types, warnings, and cancellation.
- Sanitized Markdown-to-HTML converter backed by `packages/markdown-engine`.
- HTML export settings for generated metadata and table-of-contents insertion.
- Browser-print converter that truthfully delegates PDF/printer output to the host webview print dialog.
- Markdown-to-PDF export backed by the converter runtime and app binary file I/O.
- Markdown-to-DOCX export backed by the converter runtime and app binary file I/O.
- HTML-to-Markdown converter backed by Turndown, with lossy-conversion warnings.
- DOCX-to-Markdown import backed by Mammoth HTML extraction and Turndown.
- PDF-to-Markdown import backed by pdfjs text extraction.
- OCR-to-Markdown import backed by Tesseract image recognition.
- CSV-to-Markdown table converter with quoted-field parsing and ragged-row warnings.
- Rich clipboard HTML-to-Markdown converter with lossy-conversion warnings.
- URL/article-to-Markdown converter with HTTP(S) validation, injected/global fetch support, and trust warnings.
- Markdown cleanup converter for line endings, trailing whitespace, excessive blank lines, and final newline normalization.
- Default app converter set factory used by editor/viewer, with browser print enabled only when the app provides a print adapter.
- Compact app-facing helpers for default HTML export paths and warning-aware conversion status messages.
- Editor-facing workflow coverage for supported HTML/CSV/binary import insertion, HTML/PDF/DOCX export, and converter activity history lives in `apps/editor/src/ui` with focused tests.

DOCX, OCR, and PDF conversion are implemented through packaged JavaScript runtimes, not OS-native document engines. URL and rich clipboard conversion are supported through HTML-to-Markdown paths with trust/lossiness warnings.
