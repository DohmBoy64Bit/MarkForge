# Drift / Debt Remediation Report

Date: 2026-06-23

## Summary

This pass reconciled the original Documentation / Code Drift and Debt Audit with the current Phase 12A repository state. The original audit remains valid historical evidence for the Phase 6B baseline, but later phases have implemented several package boundaries and product foundations that the old remediation report still described as deferred.

No new product features were added in this pass. The fixes were documentation and validation updates: top-level status now reports Phase 12A, `docs:check` rejects Phase 10 as a stale current-status marker, and the remediation changelog/report now give every original audit issue a current evidence-backed status.

## Issue Resolution Table

| Issue ID | Category | Title | Status | Files Changed | Verification |
| --- | --- | --- | --- | --- | --- |
| DW-01 | Deferred Work | Platform facade, native file watching, and native close interception | Partially fixed | `docs/marktext-parity-matrix.md`, changelog/report | `pnpm test`, builds, Phase 11 docs/audit |
| DW-02 | Deferred Work | Rich editor engine, CodeMirror 6, WYSIWYG/realtime editing, advanced tools | Partially fixed | `README.md`, `docs/developer-documentation.md`, changelog/report | `pnpm build:editor`, `pnpm test`, Phase 12 docs/audit |
| DW-03 | Deferred Work | Markdown conformance, structured front matter, diagrams, theme highlighting | Deferred | Changelog/report | `pnpm test` |
| DW-04 | Deferred Work | Converter package and export pipeline | Partially fixed | Changelog/report | `pnpm test`, builds, Phase 7 docs |
| DW-05 | Deferred Work | Theme engine and full built-in theme set | Fixed for audited scope | Changelog/report | `pnpm test`, builds, Phase 8 docs |
| DW-06 | Deferred Work | Local LLM support | Fixed for Phase 9 baseline | Changelog/report | `pnpm test`, `pnpm build:editor`, Phase 9 docs |
| DW-07 | Deferred Work | Filesystem/workspace templates and broader autocomplete | Partially fixed | `packages/templates`, `packages/editor-engine`, editor workspace loading, changelog/report | Focused template/editor-engine tests |
| DW-08 | Deferred Work | Documentation validation placeholder | Fixed | `scripts/docs-check.mjs`, changelog/report | `pnpm docs:check` |
| DW-09 | Deferred Work | Packaging, Linux, associations, updates, OS integration | Partially fixed | Changelog/report | `pnpm packaging:check`, builds, docs-check |
| AD-01 | Architectural Drift | README-only packages documented as real boundaries | Fixed | Changelog/report | `pnpm docs:check`, `pnpm test` |
| AD-02 | Architectural Drift | App components own domain/platform behavior targeted for packages | Partially fixed | Changelog/report | `pnpm test`, builds |
| AD-03 | Architectural Drift | Dependency graph differs from documented direction | Partially fixed | Changelog/report | `pnpm docs:check`, builds |
| AD-04 | Architectural Drift | Theme handling is app-local instead of centralized | Partially fixed | Changelog/report | `pnpm test`, builds |
| ID-01 | Implementation Drift | High-level status docs stale | Fixed | `README.md`, `docs/developer-documentation.md`, `scripts/docs-check.mjs`, changelog/report | `pnpm docs:check` |
| ID-02 | Implementation Drift | Parity matrix testing row stale | Fixed | Changelog/report | `pnpm test` |
| ID-03 | Implementation Drift | Phase 4 deferred bullets superseded later | Fixed | Changelog/report | `pnpm docs:check` |
| TD-01 | Transitional Debt | Metadata polling temporary file-change detection | Partially fixed | `docs/marktext-parity-matrix.md`, changelog/report | `pnpm test`, builds, Phase 11 docs |
| TD-02 | Transitional Debt | LocalStorage persistence for session/preferences/recent/templates | Partially fixed | `docs/marktext-parity-matrix.md`, changelog/report | `pnpm test` |
| TD-03 | Transitional Debt | Placeholder `pnpm docs:check` | Fixed | `scripts/docs-check.mjs`, changelog/report | `pnpm docs:check` |
| TD-04 | Transitional Debt | Browser print/export foundation | Partially fixed | Changelog/report | `pnpm test`, builds |
| TD-05 | Transitional Debt | Vite chunk-size warning accepted as debt | Fixed for audited warning | Changelog/report | `pnpm build:editor`, `pnpm build:viewer`, `pnpm bundle:check` |

## Architecture Compliance Summary

The required monorepo structure is present: implementation code lives under `apps/*` and `packages/*`, with docs, scripts, tests, and root configuration in documented locations. All required packages now have manifests, public entrypoints, READMEs, and package-level tests. `scripts/docs-check.mjs` verifies that implemented packages keep those public-entrypoint rules.

Dependency direction is materially closer to the target architecture than in the original audit. Editor/viewer code now uses package-owned core, platform, converter, theme, LLM, shared, UI, markdown, editor-engine, and template boundaries where implemented. Remaining drift is documented in `docs/architecture.md`: the editor still directly imports markdown/templates and app shells still own orchestration, workflow dialogs, search state, live preview composition, and adapter wiring.

Security-sensitive behavior remains package-owned or explicitly bounded. Markdown sanitization remains in `packages/markdown-engine`; converters declare capabilities and unsupported results; local LLM providers reject non-loopback endpoints and require explicit user invocation; platform paths are routed through package contracts at the app boundary.

## Documentation Accuracy Summary

Corrected current-status documentation:

- `README.md` now reports progress through Phase 12A and links Phase 11/12 docs.
- `docs/developer-documentation.md` now reports Phase 11 and Phase 12A implementation state.
- `docs/marktext-parity-matrix.md` now reflects package-owned platform/core progress for file flows, opened-file watching, session restore, and preferences.
- `scripts/docs-check.mjs` now rejects stale top-level Phase 10 current-status wording, in addition to the earlier Phase 5A/6B stale markers.
- `docs/changelogs/drift-debt-remediation-changelog.md` now records current statuses for all 21 original audit findings.
- This report now matches the current repository instead of the earlier Phase 6B remediation state.

Historical phase docs remain historical. Deferred work is not erased; it is preserved where implementation and docs still show real gaps.

## Tests and Validation

Commands run for this pass:

- `pnpm docs:check`: passed.
- `pnpm test`: passed.
- `pnpm build:editor`: passed.
- `pnpm build:viewer`: passed.
- `pnpm bundle:check`: passed.

Previously recorded phase validation remains relevant evidence for Phase 11/12:

- Phase 11 recorded successful `cargo check` for editor/viewer Tauri crates plus Tauri builds.
- Phase 12 recorded successful desktop/mobile screenshot validation for the CodeMirror editor.

## Remaining Deferred Work

- WYSIWYG/realtime editing.
- Advanced table tools, image insertion/editing tools, Markdown linting/formatting, broader autocomplete, focus mode, typewriter mode, and distraction-free mode.
- CommonMark/GFM fixture corpus, structured YAML/TOML parsing, broader diagram runtime coverage beyond safe Mermaid flowcharts, and full syntax-highlighter theme switching.
- Viewer workspace browsing, broader workspace/network-path smoke coverage, native spellcheck providers, auto-update publishing/signing, Linux artifacts, and broader OS integration.
- Native PDF/DOCX/OCR conversion and richer export profile UI.
- Syncable template libraries and broader Markdown autocomplete.
- Custom/system theme support and export theme settings UI.

## Blocked or No-Change Items

- DW-03 remains deferred because the audit and current docs call for fixture-backed parser/diagram decisions before implementation.
- DW-07 is partially fixed by workspace template loading from `.markforge/templates/*.md`; broader autocomplete and syncable template libraries remain deferred.
- Remaining OS/release work under DW-09 is deferred until signing, updater, Linux, native spellcheck providers, and release smoke contracts are selected and testable.
- No change was made to working source code in this pass because current source evidence already implements the package/feature slices that could safely be fixed by later phases.

## Final Self-Audit

- Every original confirmed issue has a current status in the changelog and this report.
- Every changed file appears in the changelog evidence ledger.
- Validation commands were run and recorded.
- No new undocumented behavior was added.
- No placeholders were presented as complete implementations.
- Remaining debt is explicitly documented.
- The report is based on the original audit, current architecture, related phase/package docs, and current code/config/test evidence.
