# Drift / Debt Remediation Changelog

Date: 2026-06-23
Latest evidence-mode verification: 2026-06-24

Scope: current remediation record for every confirmed issue in `docs/audits/documentation-code-drift-debt-audit.md`. The original audit captured a Phase 6B-era baseline. Later implementation phases resolved or reduced several findings, so this changelog records the current evidence-backed status after Phase 12A rather than preserving stale Phase 6-only conclusions.

## Verification Summary

- Pass 1, audit to code/docs: read the full audit, architecture, roadmap, current phase docs, remediation reports, package READMEs, package inventory, app manifests, and representative source evidence for platform, core, converters, theme, LLM, CodeMirror, and persistence behavior.
- Pass 2, code/docs to audit: started from current package manifests/source/tests and current phase docs, then mapped them back to each audit finding.
- Result: no speculative product feature was added in this pass. The safe remediation was documentation correction and validation hardening for stale top-level status plus current remediation records.

## Issue Inventory and Resolution

| Issue ID | Original category | Original audit title | Severity | Status | Current resolution summary | Related audit evidence | Current code/config evidence | Related docs | Files changed in this pass | Tests / commands | Remaining risk / follow-up |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DW-01 | Deferred Work | Platform facade, native file watching, and native close interception remain open | High | Partially fixed | `packages/platform` is now a real package. Phase 11 added native open-file watching and editor close-request protection while preserving polling/browser fallbacks. Follow-up remediation added editor/viewer workspace listing/search/watch, shell recent-document service wiring, spellcheck contract, and updater status contract. Native spellcheck providers, updater publishing/signing, Linux artifacts, and broader smoke coverage remain deferred. | Audit DW-01 and TD-01. | `packages/platform/src/index.ts`, `packages/platform/src/index.spec.ts`, editor/viewer Tauri watch commands, editor/viewer workspace commands, app platform adapters. | `docs/architecture.md`, `docs/phase-11-native-platform-hardening.md`, `packages/platform/README.md`, app READMEs, `docs/marktext-parity-matrix.md`. | `docs/marktext-parity-matrix.md`, changelog/report. | Focused tests, builds, docs-check. | Add broader OS/release integration when contracts are defined. |
| DW-02 | Deferred Work | Rich editor engine, CodeMirror 6 source surface, WYSIWYG/realtime editing, and advanced tools remain open | High | Partially fixed | Phase 12A implemented the CodeMirror 6 Markdown source surface and selection bridge. Follow-up remediation added ProseMirror-backed rich Markdown mode, image insertion/update, table row/column/alignment tools, delete-line, source formatting, source search/insertion helpers, general Markdown structure autocomplete, and workspace-backed link/image path autocomplete. Focus/typewriter modes, linting, and broader rich-editing fixture coverage remain open. | Audit DW-02. | `apps/editor/package.json`, `apps/editor/src/ui/SourceEditor.tsx`, `apps/editor/src/ui/RichMarkdownEditor.tsx`, `apps/editor/src/ui/App.tsx`, `packages/editor-engine/src/commands.ts`, `packages/editor-engine/src/markdownAutocomplete.ts`, `apps/editor/vite.config.ts`. | `docs/phase-12-rich-editor-surface.md`, `docs/implementation-roadmap.md`, `docs/marktext-parity-matrix.md`. | `README.md`, `docs/developer-documentation.md`, changelog/report. | `pnpm build:editor`, `pnpm test`, visual screenshot evidence from Phase 12. | Add broader rich-editing fixtures and focus/typewriter decisions. |
| DW-03 | Deferred Work | Markdown engine conformance, structured front matter parsing, diagrams, and theme-integrated highlighting remain open | Medium | Deferred | No parser/diagram/conformance implementation was added by this pass. Existing limited front matter and deferred diagram warnings remain truthful. | Audit DW-03. | `packages/markdown-engine/src/index.ts`, `packages/markdown-engine/src/index.spec.ts`. | `docs/phase-2-markdown-engine.md`, `docs/implementation-roadmap.md`, `docs/marktext-parity-matrix.md`, `packages/markdown-engine/README.md`. | Changelog/report only. | `pnpm test`. | Add fixture corpus before parser/diagram expansion. |
| DW-04 | Deferred Work | Converter package and export pipeline are not implemented beyond browser print | High | Partially fixed | Phase 7 implemented `packages/converters`, sanitized HTML export, HTML-to-Markdown, CSV-to-Markdown table import, cleanup, browser-print handoff, app UI, and activity history. Follow-up remediation added rich clipboard HTML import, URL/article HTML import, basic HTML export settings, DOCX import/export, PDF text import, Markdown-to-PDF export, OCR image import, and editor binary file import/export UI. Broader document-fidelity fixtures remain open. | Audit DW-04 and TD-04. | `packages/converters/src/index.ts`, converter tests, editor/viewer converter call sites. | `docs/phase-7-converters.md`, `packages/converters/README.md`, `docs/marktext-parity-matrix.md`. | Changelog/report only. | Focused converter tests, builds. | Define full-fidelity PDF/DOCX/OCR fixtures and release packaging validation. |
| DW-05 | Deferred Work | Theme engine and full built-in theme set remain open | Medium | Fixed for audited scope | Phase 8 implemented `packages/theme-engine`, app CSS-variable generation, validation, code/export mappings, and six app-visible built-in themes consumed by editor/viewer. System theme, custom theme loading, export settings UI, and full syntax-highlighter theme switching remain follow-on work. | Audit DW-05 and AD-04. | `packages/theme-engine/src/index.ts`, theme tests, editor/viewer `themeToAppCssVariables` usage. | `docs/phase-8-theme-engine.md`, `packages/theme-engine/README.md`, `docs/theming-documentation.md`, `docs/architecture.md`. | Changelog/report only. | `pnpm test`, builds. | Continue theme work for system/custom/export settings. |
| DW-06 | Deferred Work | Local LLM support remains unimplemented | Medium | Fixed for Phase 9 baseline | Phase 9 implemented `packages/llm`, prompt/action contracts, loopback-only adapters for Ollama and OpenAI-compatible local servers, privacy guard, disabled-by-default editor Local AI UI, streaming action execution, persisted provider profiles, and broader editor actions. Provider model discovery and benchmarking remain future work. | Audit DW-06. | `packages/llm/src/index.ts`, LLM tests, `apps/editor/src/ui/LocalAiDialog.tsx`, `localAiWorkflow.ts`. | `docs/phase-9-local-llm.md`, `docs/local-llm-setup.md`, `packages/llm/README.md`. | Changelog/report only. | `pnpm test`, `pnpm build:editor`. | Add provider model discovery and benchmark guidance later. |
| DW-07 | Deferred Work | Filesystem/workspace templates and broader autocomplete remain open | Medium | Partially fixed | Built-in templates, local custom templates, workspace templates under `.markforge/templates/*.md`, `/template`/`/tpl` suggestions, general Markdown structure autocomplete, and workspace-backed link/image path autocomplete are implemented. Syncable template libraries remain deferred. | Audit DW-07 and TD-02. | `packages/templates/src/index.ts`, `packages/editor-engine/src/templateAutocomplete.ts`, `packages/editor-engine/src/markdownAutocomplete.ts`, `apps/editor/src/ui/customTemplates.ts`, editor workspace template loading. | `docs/phase-6-templates-help.md`, `packages/templates/README.md`, `apps/editor/README.md`, `docs/user-documentation.md`. | Changelog/report only. | Focused template/editor-engine tests. | Define syncable template ownership. |
| DW-08 | Deferred Work | Documentation validation remains a placeholder | High | Fixed | `pnpm docs:check` is a real validation script and now also rejects Phase 10 as a stale top-level current-status marker. | Audit DW-08 and TD-03. | `scripts/docs-check.mjs`, root `package.json`. | `docs/developer-documentation.md`, `docs/architecture.md`. | `scripts/docs-check.mjs`, changelog/report. | `pnpm docs:check`. | Expand validation as release gates mature. |
| DW-09 | Deferred Work | Packaging, Linux, file associations, update path, and OS integration remain incomplete | Medium | Partially fixed | Phase 10 added packaging docs/checks, release-hardening added Windows associations/startup loading, and Phase 11 added native file watching/close protection. Follow-up remediation added shell recent-document service wiring, spellcheck service contract, and updater status contract. Linux artifacts, updater publishing/signing, native spellcheck providers, and broader OS integration remain deferred. | Audit DW-09. | Tauri configs, `scripts/packaging-check.mjs`, app startup-file/watch code, platform OS service contracts. | `docs/phase-10-packaging-documentation.md`, `docs/release-hardening.md`, `docs/update-signing-strategy.md`, `docs/phase-11-native-platform-hardening.md`. | Changelog/report only. | Focused tests, packaging check, builds, docs-check. | Complete Linux/release/signing/native-spellcheck passes. |
| AD-01 | Architectural Drift | Target package responsibilities exceed implemented package boundaries | High | Fixed | All required packages now have package manifests, public entrypoints, READMEs, and package-level tests. | Audit AD-01. | `packages/*/package.json`, `packages/*/src/index.ts`, `packages/*/*.spec.ts`, `scripts/docs-check.mjs`. | `docs/architecture.md`, package READMEs. | Changelog/report only. | `pnpm docs:check`, `pnpm test`. | None for package existence; deeper ownership still tracked separately. |
| AD-02 | Architectural Drift | App-local ownership remains broader than target architecture | High | Partially fixed | Apps now delegate core schemas, platform services, converters, theme tokens, local AI, and editor preview/template APIs to packages. App UI still owns orchestration, dialogs, search state, live preview composition, converter/AI UI state, and Tauri adapter wiring. | Audit AD-02. | `apps/editor/src/ui/App.tsx`, `apps/viewer/src/ui/App.tsx`, package imports and tests. | `docs/architecture.md`, `docs/developer-documentation.md`, package READMEs. | Changelog/report only. | Focused tests, builds. | Continue one-boundary-at-a-time extraction. |
| AD-03 | Architectural Drift | Current app/package imports bypass parts of documented dependency graph | High | Partially fixed | Implemented package edges now exist and are documented. Editor preview/template APIs flow through `packages/editor-engine`; app shells still own React orchestration and Tauri adapter wiring. | Audit AD-03. | `apps/editor/package.json`, `apps/viewer/package.json`, `rg "@markforge/" apps packages`. | `docs/architecture.md`, `docs/implementation-roadmap.md`. | Changelog/report only. | `pnpm docs:check`, builds. | Add boundary linting after remaining package ownership decisions. |
| AD-04 | Architectural Drift | Theme behavior lives in app CSS/state instead of `packages/theme-engine` | Medium | Partially fixed | Theme tokens, validation, app-visible themes, and CSS-variable generation are package-owned. Layout/component CSS remains app-local, and system/custom/export settings remain future work. | Audit AD-04. | `packages/theme-engine/src/index.ts`, app theme imports, CSS variable usage. | `docs/phase-8-theme-engine.md`, `docs/architecture.md`, `packages/theme-engine/README.md`. | Changelog/report only. | `pnpm test`, builds. | Expand theme settings without duplicating tokens. |
| ID-01 | Implementation Drift | Phase status is stale in high-level docs | High | Fixed | Earlier Phase 5A/6B drift was fixed; this pass also updates stale Phase 10 top-level status to Phase 12A. | Audit ID-01. | Current phase docs and implemented package/app evidence through Phase 12A. | `README.md`, `docs/developer-documentation.md`, `docs/implementation-roadmap.md`, Phase 7-12 docs. | `README.md`, `docs/developer-documentation.md`, `scripts/docs-check.mjs`, changelog/report. | `pnpm docs:check`. | Keep status current after future phases. |
| ID-02 | Implementation Drift | Testing status says implementation tests are pending despite current app/package tests | Medium | Fixed | Parity matrix now acknowledges app/package unit/helper coverage and remaining gaps; test count has grown since the original audit. | Audit ID-02. | `vitest.config.ts`, app/package `*.spec.ts`. | `docs/marktext-parity-matrix.md`, `docs/developer-documentation.md`. | Changelog/report only. | `pnpm test`. | Add integration/e2e/security/packaging tests. |
| ID-03 | Implementation Drift | Phase 4 deferred list includes items now implemented in later phases | Low | Fixed | Phase 4 doc is clearly historical and notes superseded items including dirty-close, command palette, keybindings, and Phase 11 native close interception. | Audit ID-03. | `UnsavedChangesDialog.tsx`, `documentLifecycle.ts`, `CommandPalette.tsx`, `PreferencesDialog.tsx`, `editorPreferences.ts`. | `docs/phase-4-editor-shell.md`, `docs/phase-5-advanced-editing.md`, `docs/phase-11-native-platform-hardening.md`. | Changelog/report only. | `pnpm docs:check`. | Keep historical docs labeled. |
| TD-01 | Transitional Debt | Metadata polling is the temporary file-change mechanism | High | Partially fixed | Phase 11 added native open-file watching and kept polling as fallback through `packages/platform`. Follow-up remediation added editor and viewer workspace recursive native watch events. | Audit TD-01. | `packages/platform/src/index.ts`, editor/viewer native watch adapters, Rust watch commands. | `docs/phase-11-native-platform-hardening.md`, `packages/platform/README.md`, `docs/marktext-parity-matrix.md`. | `docs/marktext-parity-matrix.md`, changelog/report. | Focused tests, builds, Rust checks. | Add broader smoke coverage if required. |
| TD-02 | Transitional Debt | LocalStorage persists session, preferences, recent files, and custom templates | Medium | Partially fixed | `packages/core` owns preference/session/recent-file schemas and storage helpers. Local custom templates still use app-local localStorage helpers, which remains documented deferred work. | Audit TD-02. | `packages/core/src/index.ts`, `apps/editor/src/ui/editorPreferences.ts`, `customTemplates.ts`. | `docs/architecture.md`, `packages/core/README.md`, `docs/phase-6-templates-help.md`. | Changelog/report only. | `pnpm test`. | Move custom template/workspace persistence when ownership is defined. |
| TD-03 | Transitional Debt | `pnpm docs:check` is a placeholder release gate | High | Fixed | Same as DW-08; the real docs check now validates required docs, links, stale markers, and package coverage. | Audit TD-03. | `scripts/docs-check.mjs`, `package.json`. | `docs/developer-documentation.md`, `docs/architecture.md`. | `scripts/docs-check.mjs`, changelog/report. | `pnpm docs:check`. | Keep expanding checks with release criteria. |
| TD-04 | Transitional Debt | Print/export remains a browser print foundation | Medium | Partially fixed | Browser print is now a converter-backed handoff, HTML export/import/cleanup paths exist, and Markdown-to-PDF/DOCX export plus DOCX/PDF/OCR import are wired through package converters and editor binary file I/O. Full-fidelity PDF/page settings and release packaging validation remain deferred. | Audit TD-04. | `packages/converters/src/index.ts`, editor/viewer print/export call sites, editor binary import/export UI. | `docs/phase-7-converters.md`, `docs/marktext-parity-matrix.md`, `packages/converters/README.md`, `apps/editor/README.md`. | Changelog/report only. | `pnpm test`, builds, screenshot validation. | Expand full-fidelity PDF/page settings only with fixture-backed requirements. |
| TD-05 | Transitional Debt | Vite chunk-size warning is accepted debt | Medium | Fixed for audited warning | Bundle checking and manual chunks are now in place. Phase 12A keeps CodeMirror/Lezer below the 500 KiB budget with `pnpm bundle:check`. | Audit TD-05. | `scripts/bundle-check.mjs`, app Vite configs, Phase 12 bundle evidence. | `docs/phase-12-rich-editor-surface.md`, `docs/audits/phase-12-rich-editor-surface-2026-06-23.md`. | Changelog/report only. | `pnpm build:editor`, `pnpm build:viewer`, `pnpm bundle:check`. | Consider route-level lazy loading if future assets grow. |

## Evidence Ledger

### `README.md`

- Changed for: ID-01.
- Why changed: top-level status stopped at Phase 10 even though Phase 11 and Phase 12A are documented and implemented.
- Supporting audit evidence: original stale-status finding ID-01.
- Supporting architecture evidence: `docs/architecture.md` current drift section lists Phase 12A CodeMirror and platform/package delegation.
- Supporting related docs: `docs/implementation-roadmap.md`, `docs/phase-11-native-platform-hardening.md`, `docs/phase-12-rich-editor-surface.md`.
- Supporting code evidence: `apps/editor/src/ui/SourceEditor.tsx`, CodeMirror dependencies in `apps/editor/package.json`, platform native watch/close APIs in `packages/platform/src/index.ts`.
- Tests/commands: `pnpm docs:check`.
- Verification pass 1 result: audit-to-doc confirmed high-level status docs are the intended current-status surface.
- Verification pass 2 result: code/docs-to-README confirmed Phase 12A wording is implemented and not speculative.
- Final status: fixed.

### `docs/developer-documentation.md`

- Changed for: ID-01.
- Why changed: developer implementation state stopped at Phase 10 even though developers need the Phase 11/12 current boundary before new work.
- Supporting audit evidence: original stale-status finding ID-01.
- Supporting architecture evidence: package responsibilities and current drift section in `docs/architecture.md`.
- Supporting related docs: Phase 11 and Phase 12 docs plus `docs/implementation-roadmap.md`.
- Supporting code evidence: same Phase 11/12 implementation evidence as README.
- Tests/commands: `pnpm docs:check`.
- Verification pass 1 result: status text was stale against current phase docs.
- Verification pass 2 result: current source and package manifests confirm the added Phase 11/12 bullets.
- Final status: fixed.

### `scripts/docs-check.mjs`

- Changed for: DW-08, TD-03, ID-01.
- Why changed: the existing stale-marker gate caught Phase 5A/6B but not the new Phase 10 stale top-level status.
- Supporting audit evidence: docs validation placeholder finding and stale-status finding.
- Supporting architecture evidence: testing strategy and docs validation notes in `docs/architecture.md`.
- Supporting related docs: `README.md`, `docs/developer-documentation.md`.
- Supporting code evidence: current script already validates required docs, links, package coverage, and older stale markers.
- Tests/commands: `pnpm docs:check`.
- Verification pass 1 result: script had no Phase 10 stale marker.
- Verification pass 2 result: added markers are targeted and do not reject historical Phase 10 docs.
- Final status: fixed.

### `docs/marktext-parity-matrix.md`

- Changed for: DW-01, TD-01, TD-02, AD-02.
- Why changed: several parity rows still described the pre-Phase-11 platform/core state, including native file watching as deferred.
- Supporting audit evidence: platform facade/watch debt, metadata polling debt, app-local ownership drift, and localStorage transitional debt.
- Supporting architecture evidence: `packages/platform` and `packages/core` responsibilities plus current implementation drift notes in `docs/architecture.md`.
- Supporting related docs: `docs/phase-11-native-platform-hardening.md`, `packages/platform/README.md`, `packages/core/README.md`.
- Supporting code evidence: `packages/platform/src/index.ts`, `packages/core/src/index.ts`, editor/viewer watch adapters, app usage of core storage helpers.
- Tests/commands: `pnpm docs:check`.
- Verification pass 1 result: stale parity wording was confirmed from the matrix.
- Verification pass 2 result: current platform/core code and Phase 11 docs confirm the corrected wording.
- Final status: fixed.

### `docs/changelogs/drift-debt-remediation-changelog.md`

- Changed for: all 21 confirmed audit issues.
- Why changed: the previous changelog reflected the initial remediation pass and was stale after Phase 7-12 implementation.
- Supporting audit evidence: every confirmed finding in `docs/audits/documentation-code-drift-debt-audit.md`.
- Supporting architecture evidence: full `docs/architecture.md`, especially Required Structure, Dependency Direction, Package Responsibilities, Current Implementation Drift / Transitional Debt, Public API Rules, Security Rules, and Testing Strategy.
- Supporting related docs: roadmap, phase docs 4-12, package READMEs, parity matrix, developer docs, user docs, release hardening docs.
- Supporting code evidence: package manifests/source/tests, app manifests/source, scripts.
- Tests/commands: `pnpm docs:check`, `pnpm test`, builds, bundle check.
- Verification pass 1 result: issue inventory mapped old findings to current docs/code.
- Verification pass 2 result: current package/source inventory mapped back to every issue.
- Final status: updated.

### `docs/audits/drift-debt-remediation-report.md`

- Changed for: all 21 confirmed audit issues.
- Why changed: final remediation report was Phase 6B-era and contradicted current Phase 12A evidence.
- Supporting audit evidence: every confirmed finding in the original audit.
- Supporting architecture evidence: current architecture doc.
- Supporting related docs: current phase docs and final implementation reports.
- Supporting code evidence: package/app/script evidence listed in the issue table.
- Tests/commands: `pnpm docs:check`, `pnpm test`, `pnpm build:editor`, `pnpm build:viewer`, `pnpm bundle:check`.
- Verification pass 1 result: stale report entries were confirmed.
- Verification pass 2 result: updated report statuses agree with current code/docs.
- Final status: updated.

## Remaining Deferred Work

- Broader rich-editing fixture coverage, linting beyond current formatting, image asset management beyond current insertion/update helpers, and focus/typewriter modes.
- Markdown conformance fixture corpus, structured front matter parser upgrade, broader diagram runtime coverage, and full syntax-highlighter theme switching.
- Broader workspace/network smoke coverage, native spellcheck providers, auto-update publishing/signing, Linux artifacts, and broader OS smoke coverage.
- Full-fidelity PDF/DOCX/OCR fixture coverage, richer page/export settings, and release packaging validation for conversion runtimes.
- Syncable template libraries.
- Custom/system theme support and export theme settings UI.

## Final Self-Audit

- Every confirmed audit issue has a current status.
- Changed files appear in the evidence ledger.
- No product feature or placeholder implementation was added in this pass.
- Remaining debt is explicitly listed and tied to current docs/code evidence.
- Architecture drift is reduced where later phases implemented package boundaries and remains documented where app orchestration still owns behavior.
