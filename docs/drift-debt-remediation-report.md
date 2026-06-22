# Drift / Debt Remediation Report

## Summary

This pass inventoried all 21 confirmed audit issues and remediated the safe, evidence-backed subset. Five issues are fixed, two architectural drift issues are partially fixed through truthful current-vs-target documentation, and fourteen larger feature/extraction items remain explicitly deferred. Nothing was blocked, and no issue was marked no-change.

The main changes were documentation accuracy updates, README-only package status notes, and replacement of the placeholder `pnpm docs:check` command with a real validation script. No product features, app workflows, or package facades were faked.

## Issue Resolution Table

| Issue ID | Category | Title | Status | Files changed | Verification |
| --- | --- | --- | --- | --- | --- |
| DW-01 | Deferred Work | Platform facade, native file watching, and native close interception | Deferred | `docs/architecture.md`, `packages/platform/README.md`, changelog/report | `pnpm docs:check`, builds |
| DW-02 | Deferred Work | Rich editor engine, CodeMirror 6, WYSIWYG/realtime editing, advanced tools | Deferred | changelog/report | `pnpm test`, builds |
| DW-03 | Deferred Work | Markdown conformance, structured front matter, diagrams, theme highlighting | Deferred | changelog/report | `pnpm test`, builds |
| DW-04 | Deferred Work | Converter package and export pipeline | Deferred | `packages/converters/README.md`, changelog/report | `pnpm docs:check`, builds |
| DW-05 | Deferred Work | Theme engine and built-in theme set | Deferred | `docs/architecture.md`, `packages/theme-engine/README.md`, changelog/report | `pnpm docs:check`, builds |
| DW-06 | Deferred Work | Local LLM support | Deferred | `packages/llm/README.md`, changelog/report | `pnpm docs:check` |
| DW-07 | Deferred Work | Filesystem/workspace templates and broader autocomplete | Deferred | changelog/report | `pnpm test` |
| DW-08 | Deferred Work | Documentation validation placeholder | Fixed | `package.json`, `scripts/docs-check.mjs`, `docs/architecture.md`, `docs/developer-documentation.md`, changelog/report | `pnpm docs:check` |
| DW-09 | Deferred Work | Packaging, Linux, associations, updates, OS integration | Deferred | changelog/report | builds |
| AD-01 | Architectural Drift | README-only packages documented as real boundaries | Partially fixed | `docs/architecture.md`, seven package READMEs, changelog/report | `pnpm docs:check` |
| AD-02 | Architectural Drift | App components own domain/platform behavior targeted for packages | Deferred | `docs/architecture.md`, package READMEs, changelog/report | `pnpm test`, builds |
| AD-03 | Architectural Drift | Dependency graph differs from documented direction | Partially fixed | `docs/architecture.md`, changelog/report | `pnpm docs:check`, builds |
| AD-04 | Architectural Drift | Theme handling is app-local instead of centralized | Deferred | `docs/architecture.md`, `packages/theme-engine/README.md`, changelog/report | builds |
| ID-01 | Implementation Drift | High-level status says Phase 5A instead of Phase 6B | Fixed | `README.md`, `docs/developer-documentation.md`, changelog/report | `pnpm docs:check`, `pnpm test` |
| ID-02 | Implementation Drift | Parity matrix testing row stale | Fixed | `docs/marktext-parity-matrix.md`, changelog/report | `pnpm test` |
| ID-03 | Implementation Drift | Phase 4 deferred bullets superseded later | Fixed | `docs/phase-4-editor-shell.md`, changelog/report | `pnpm docs:check`, `pnpm test` |
| TD-01 | Transitional Debt | Metadata polling temporary file-change detection | Deferred | `docs/architecture.md`, `packages/platform/README.md`, changelog/report | builds |
| TD-02 | Transitional Debt | LocalStorage persistence for session/preferences/recent/templates | Deferred | `docs/architecture.md`, `packages/core/README.md`, changelog/report | `pnpm test` |
| TD-03 | Transitional Debt | Placeholder `pnpm docs:check` | Fixed | `package.json`, `scripts/docs-check.mjs`, docs updates, changelog/report | `pnpm docs:check` |
| TD-04 | Transitional Debt | Browser print/export foundation | Deferred | `packages/converters/README.md`, changelog/report | builds |
| TD-05 | Transitional Debt | Vite chunk-size warning accepted as debt | Deferred | changelog/report | `pnpm build:editor`, `pnpm build:viewer` |

## Architecture Compliance Summary

The required monorepo structure remains intact: implementation code stays under `apps/*` and implemented `packages/*`, with docs/tests/scripts in the documented root areas. The architecture now clearly distinguishes the target dependency graph from the current Phase 6B implementation graph.

Implemented package responsibilities remain behind public package entrypoints for `packages/markdown-engine`, `packages/editor-engine`, and `packages/templates`. README-only target packages are now labeled as planned boundaries, which avoids false claims about public APIs, exports, and tests that do not exist yet.

Security-sensitive behavior remains unchanged: markdown rendering still goes through `packages/markdown-engine`; local LLM and converter trust boundaries remain deferred rather than stubbed. The testing strategy is now documented more accurately: unit/helper coverage exists, while broader integration, e2e, security fixture, converter, platform, and packaging tests remain open.

## Documentation Accuracy Summary

- `README.md` and `docs/developer-documentation.md` now report Phase 6B instead of Phase 5A.
- `docs/marktext-parity-matrix.md` now acknowledges current app/package tests and remaining coverage gaps.
- `docs/phase-4-editor-shell.md` marks its deferred list as a historical phase-era record and points to current docs.
- `docs/architecture.md` now states which packages are implemented, which are README-only target packages, and where current app-local ownership still differs from the target graph.
- README-only package docs now explicitly say they are planned target packages rather than implemented package boundaries.

## Tests and Validation

- `pnpm docs:check`: passed before report creation. The new script checked 35 Markdown files.
- `pnpm test`: passed, 10 test files and 80 tests.
- `pnpm build:editor`: passed. Vite emitted the known chunk-size warning for `dist/assets/index-CY0adLds.js` at 751.25 kB.
- `pnpm build:viewer`: passed. Vite emitted the known chunk-size warning for `dist/assets/index-B8hAbsEu.js` at 676.11 kB.
- Final `pnpm docs:check`: passed after adding this report and the changelog. The script checked 37 Markdown files.

## Remaining Deferred Work

- `packages/platform` facade, watcher abstraction, and native close interception.
- Rich editor surface selection, including CodeMirror 6 and WYSIWYG/realtime editing decisions.
- Markdown conformance fixtures, fuller front matter parsing, diagram rendering, and theme-integrated highlighting.
- `packages/converters` contract and export pipeline beyond browser print.
- `packages/theme-engine` token registry, validation, built-in themes, and export/code theme mapping.
- `packages/llm` provider contract and local adapter implementation.
- Filesystem/workspace templates, syncable template libraries, and broader autocomplete.
- Packaging hardening for Linux, file associations, updates, shell integration, spellcheck, and release documentation.
- Core/platform/schema extraction for localStorage-backed session, preferences, recent files, and custom templates.
- Bundle-size tracking and code-splitting for renderer/highlighter-heavy chunks.

## Blocked or No-Change Items

No items were blocked, and no issue was marked no-change. Large deferred feature work was not implemented because the audit, architecture, and code evidence show planned target ownership but do not provide a safe minimal product requirement for this remediation pass.

## Final Self-Audit

- Re-read issue inventory: complete, 21 issues have statuses.
- Every changed file appears in the changelog evidence ledger.
- Changelog entries include audit evidence, architecture evidence, related docs/code references, verification, risk, and follow-up.
- Required verification commands were run where available.
- No new undocumented product behavior was added.
- No architecture rule was knowingly violated.
- No placeholder implementation is presented as complete.
- Remaining debt is explicitly documented as deferred.
- Final report is fact-based and matches the command results above.
