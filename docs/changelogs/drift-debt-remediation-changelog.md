# Drift / Debt Remediation Changelog

Date: 2026-06-22

Scope: remediation of every confirmed issue in `docs/documentation-code-drift-debt-audit.md` against `docs/architecture.md`, related product docs, package READMEs, app/package source, config, and tests.

## Verification Summary

- `pnpm docs:check`: passed before final report generation; the new script checked 35 Markdown files.
- `pnpm test`: passed, 10 test files and 80 tests.
- `pnpm build:editor`: passed; Vite chunk-size warning remains for a 751.25 kB JS asset.
- `pnpm build:viewer`: passed; Vite chunk-size warning remains for a 676.11 kB JS asset.
- Final `pnpm docs:check`: passed after report/changelog creation; the script checked 37 Markdown files.

## Issue Inventory and Resolution

| Issue ID | Category | Original audit title | Severity | Status | Summary of change and why | Architecture / docs evidence | Code / config / test evidence | Files changed | Tests added or updated | Remaining risk / follow-up |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DW-01 | Deferred Work | Platform facade, native file watching, and native close interception remain open | High | Deferred | Made README-only platform status explicit and documented current-vs-target ownership in architecture. Full facade/watch/close interception is deferred because it is new platform behavior. | `docs/architecture.md`, `apps/editor/README.md`, `apps/viewer/README.md`, `docs/phase-5-advanced-editing.md` | `packages/platform/README.md`; direct Tauri calls and polling in `apps/editor/src/ui/App.tsx`, `apps/viewer/src/ui/App.tsx`; Rust `get_file_info` commands | `docs/architecture.md`, `packages/platform/README.md`, changelog/report | `scripts/docs-check.mjs` validates README-only package status; no behavior tests added | Extract `packages/platform` facade and watcher fallback before adding more desktop integrations. |
| DW-02 | Deferred Work | Rich editor engine, CodeMirror 6 source surface, WYSIWYG/realtime editing, and advanced tools remain open | High | Deferred | Kept as explicit deferred work; no feature implementation because current code is a textarea/source-command foundation and docs do not define a minimal safe WYSIWYG slice for this pass. | `docs/adr/0001-desktop-stack.md`, `docs/product-requirements.md`, `docs/phase-5-advanced-editing.md`, `packages/editor-engine/README.md` | No CodeMirror dependency in `apps/editor/package.json`; textarea and source commands in app/editor-engine tests | changelog/report | Existing `pnpm test` covers current source-mode behavior | Choose editor surface integration point before implementing. |
| DW-03 | Deferred Work | Markdown engine conformance, structured front matter parsing, diagrams, and theme-integrated highlighting remain open | Medium | Deferred | Kept as explicit deferred work; current markdown engine docs/code already identify limited parser and deferred diagram rendering. | `docs/phase-2-markdown-engine.md`, `docs/implementation-roadmap.md`, `docs/marktext-parity-matrix.md` | `packages/markdown-engine/src/index.ts`, `packages/markdown-engine/src/index.spec.ts` | changelog/report | Existing markdown-engine tests pass | Add fixture corpus and dedicated parser/diagram decisions later. |
| DW-04 | Deferred Work | Converter package and export pipeline are not implemented beyond browser print | High | Deferred | Made converter README-only status explicit and kept browser print labeled as interim; no export UI or fake converter package was added. | `docs/product-requirements.md`, `docs/implementation-roadmap.md`, `docs/marktext-parity-matrix.md`, `packages/converters/README.md` | `packages/converters` lacks manifest/src; `window.print()` in editor/viewer | `packages/converters/README.md`, changelog/report | Docs check validates package placeholder consistency | Define converter contract before export workflow expansion. |
| DW-05 | Deferred Work | Theme engine and full built-in theme set remain open | Medium | Deferred | Made theme-engine README-only status explicit and documented app-local light/dark state as current debt. | `docs/theming-documentation.md`, `docs/product-requirements.md`, `docs/architecture.md`, `packages/theme-engine/README.md` | App CSS and preferences own light/dark theme state | `docs/architecture.md`, `packages/theme-engine/README.md`, changelog/report | Docs check validates package placeholder consistency | Extract current tokens before adding more themes. |
| DW-06 | Deferred Work | Local LLM support remains unimplemented | Medium | Deferred | Made LLM README-only status explicit; did not add provider interfaces without implementation requirements. | `docs/local-llm-setup.md`, `docs/product-requirements.md`, `docs/markforge-expert-prompt.md`, `packages/llm/README.md` | `packages/llm` lacks manifest/src; no provider code found | `packages/llm/README.md`, changelog/report | Docs check validates package placeholder consistency | Add tested local provider contract with mocked providers when scope is chosen. |
| DW-07 | Deferred Work | Filesystem/workspace templates and broader autocomplete remain open | Medium | Deferred | Kept as deferred; current templates package/app-local custom templates remain truthfully described. | `docs/phase-6-templates-help.md`, `packages/templates/README.md`, `apps/editor/README.md`, `docs/user-documentation.md` | `packages/templates/src/index.ts`; `apps/editor/src/ui/customTemplates.ts`; `templateAutocomplete.ts` only handles `/template` and `/tpl` | changelog/report | Existing templates/custom-template/autocomplete tests pass | Decide workspace template ownership before loader implementation. |
| DW-08 | Deferred Work | Documentation validation remains a placeholder | High | Fixed | Replaced placeholder `pnpm docs:check` with `scripts/docs-check.mjs`, updated developer/architecture docs to describe it. | `docs/architecture.md`, `docs/developer-documentation.md` | Root `package.json` had placeholder script; new script validates required docs, stale markers, package placeholder status, and links | `package.json`, `scripts/docs-check.mjs`, `docs/architecture.md`, `docs/developer-documentation.md`, changelog/report | `pnpm docs:check` added as real validation command | Broader release-grade docs validation can expand from this foundation. |
| DW-09 | Deferred Work | Packaging, Linux, file associations, update path, and OS integration remain incomplete | Medium | Deferred | Kept as deferred; no unsupported packaging/config claims were added. | `docs/product-requirements.md`, `docs/implementation-roadmap.md`, `docs/adr/0001-desktop-stack.md`, `docs/user-documentation.md` | Tauri configs currently target Windows NSIS; no update/file association/spellcheck implementation found | changelog/report | Build commands pass for web bundles | Add packaging/OS checklist and smoke tests when release hardening begins. |
| AD-01 | Architectural Drift | Target package responsibilities exceed implemented package boundaries | High | Partially fixed | Architecture now distinguishes implemented package boundaries from README-only target directories; package READMEs state current placeholder status. | `docs/architecture.md`, package READMEs | Only `markdown-engine`, `editor-engine`, and `templates` have manifests/src/tests | `docs/architecture.md`, seven README-only package READMEs, changelog/report | Docs check validates placeholder package state | Actual package extraction remains deferred. |
| AD-02 | Architectural Drift | App-local ownership remains broader than the target architecture | High | Deferred | Architecture now explicitly records current app-owned session, recent files, polling, preferences, custom templates, and print wiring. No risky refactor was attempted. | `docs/architecture.md`, `docs/developer-documentation.md` | Direct app logic in `apps/editor/src/ui/App.tsx`, `apps/viewer/src/ui/App.tsx` | `docs/architecture.md`, package READMEs, changelog/report | Existing app/package tests pass | Extract one boundary at a time, beginning with platform/core. |
| AD-03 | Architectural Drift | Current app/package imports bypass parts of the documented dependency graph | High | Partially fixed | Architecture now labels the dependency graph as target and documents current direct imports until missing packages exist. | `docs/architecture.md` | `apps/editor/package.json`, `apps/viewer/package.json`, direct imports in app source | `docs/architecture.md`, changelog/report | Docs check validates docs consistency; builds pass | Add lint/build package-boundary rules after packages exist. |
| AD-04 | Architectural Drift | Theme behavior lives in app CSS/state instead of `packages/theme-engine` | Medium | Deferred | Theme-engine README and architecture now state current app-local theme ownership. | `docs/theming-documentation.md`, `docs/architecture.md`, `packages/theme-engine/README.md` | `apps/editor/src/styles.css`, `apps/viewer/src/styles.css`, `editorPreferences.ts` | `docs/architecture.md`, `packages/theme-engine/README.md`, changelog/report | Build commands pass | Extract token model before adding theme set. |
| ID-01 | Implementation Drift | Phase status is stale in high-level docs | High | Fixed | Updated README and developer docs from Phase 5A to Phase 6B and listed Phase 5/6 shipped scope. | `docs/implementation-roadmap.md`, `docs/phase-6-templates-help.md`, `apps/editor/README.md`, `docs/user-documentation.md` | Templates package/app template UI source and tests | `README.md`, `docs/developer-documentation.md`, changelog/report | Docs check includes stale Phase 5A markers | Keep docs current when Phase 7 begins. |
| ID-02 | Implementation Drift | Testing status says implementation tests are pending despite current app/package tests | Medium | Fixed | Updated parity matrix test row to acknowledge app/package unit/helper tests and remaining gaps. | `docs/marktext-parity-matrix.md`, `tests/README.md` | `vitest.config.ts`; 10 spec files; `pnpm test` result | `docs/marktext-parity-matrix.md`, changelog/report | `pnpm test` passed 10 files/80 tests | Add integration/e2e/export/security/packaging tests later. |
| ID-03 | Implementation Drift | Phase 4 deferred list includes items now implemented in later phases | Low | Fixed | Marked Phase 4 deferred section as phase-era history and corrected superseded bullets for dirty-close, command palette, and keybindings. | `docs/phase-4-editor-shell.md`, `docs/phase-5-advanced-editing.md`, `docs/implementation-roadmap.md` | `UnsavedChangesDialog.tsx`, `documentLifecycle.ts`, `CommandPalette.tsx`, `PreferencesDialog.tsx`, `editorPreferences.ts` | `docs/phase-4-editor-shell.md`, changelog/report | Existing app helper tests pass | Continue preserving phase history with current-status links. |
| TD-01 | Transitional Debt | Metadata polling is the temporary file-change mechanism | High | Deferred | Documented current polling/app ownership more explicitly; no native watcher implemented. | `docs/phase-1-proof-of-concept.md`, `docs/phase-3-viewer-foundation.md`, `docs/phase-5-advanced-editing.md`, app READMEs | `window.setInterval` and `get_file_info` in editor/viewer | `docs/architecture.md`, `packages/platform/README.md`, changelog/report | Builds pass | Add platform watcher abstraction with polling fallback. |
| TD-02 | Transitional Debt | LocalStorage persists session, preferences, recent files, and custom templates | Medium | Deferred | Architecture/core/templates notes now distinguish temporary app/localStorage ownership from target package ownership. | `docs/architecture.md`, `docs/implementation-roadmap.md`, `docs/phase-6-templates-help.md` | `App.tsx`, `editorPreferences.ts`, `customTemplates.ts` localStorage usage | `docs/architecture.md`, `packages/core/README.md`, changelog/report | Existing preference/custom-template tests pass | Define versioned schemas before expanding persisted data. |
| TD-03 | Transitional Debt | `pnpm docs:check` is a placeholder release gate | High | Fixed | Same remediation as DW-08: real script replaces placeholder command and docs no longer call it a scaffold. | `docs/architecture.md`, `docs/developer-documentation.md` | `package.json`, `scripts/docs-check.mjs` | `package.json`, `scripts/docs-check.mjs`, docs updates, changelog/report | `pnpm docs:check` passed | Expand validation coverage over time. |
| TD-04 | Transitional Debt | Print/export remains a browser print foundation | Medium | Deferred | Converter README now explicitly states browser print remains interim; no unsupported export implementation was added. | `docs/phase-1-proof-of-concept.md`, `docs/phase-2-markdown-engine.md`, `docs/implementation-roadmap.md`, `docs/marktext-parity-matrix.md` | `window.print()` in editor/viewer; no converter package implementation | `packages/converters/README.md`, changelog/report | Builds pass | Define converter/export ownership before new export UI. |
| TD-05 | Transitional Debt | Vite chunk-size warning is accepted debt | Medium | Deferred | Recorded current warning in changelog/report; no chunking change was made because audit tracks it as accepted debt. | `docs/phase-2-markdown-engine.md`, audit command output | `pnpm build:editor` and `pnpm build:viewer` warnings | changelog/report | Build commands pass with warnings | Track bundle budgets and split markdown/highlighter paths later. |

## Evidence Ledger

### `README.md`

- Changed for: ID-01
- Why changed: high-level current status stopped at Phase 5A while code and newer docs show Phase 6B.
- Supporting audit evidence: Implementation Drift 1.
- Supporting architecture evidence: `docs/architecture.md` current drift section.
- Supporting related docs: `docs/implementation-roadmap.md`, `docs/phase-6-templates-help.md`, `apps/editor/README.md`, `docs/user-documentation.md`.
- Supporting code evidence: `packages/templates/src/index.ts`, `apps/editor/src/ui/TemplatesHelpDialog.tsx`, `apps/editor/src/ui/customTemplates.ts`, `apps/editor/src/ui/templateAutocomplete.ts`.
- Tests/commands: `pnpm docs:check`, `pnpm test`.
- Verification pass 1 result: audit-to-doc/code confirmed stale Phase 5A claim.
- Verification pass 2 result: code/docs-to-README confirmed Phase 6B wording.
- Final status: Fixed.

### `docs/developer-documentation.md`

- Changed for: ID-01, DW-08, TD-03
- Why changed: implementation state and docs-check description were stale.
- Supporting audit evidence: Implementation Drift 1; Deferred Work 8; Transitional Debt 3.
- Supporting architecture evidence: `docs/architecture.md` package/debt sections.
- Supporting related docs: `docs/implementation-roadmap.md`, `docs/phase-6-templates-help.md`.
- Supporting code evidence: `package.json`, `scripts/docs-check.mjs`, templates/app source.
- Tests/commands: `pnpm docs:check`, `pnpm test`.
- Verification pass 1 result: stale Phase 5A and placeholder docs-check were confirmed.
- Verification pass 2 result: new script and Phase 6B evidence align.
- Final status: Fixed for stale docs/docs gate description.

### `docs/marktext-parity-matrix.md`

- Changed for: ID-02
- Why changed: testing row said implementation tests were pending despite current app/package tests.
- Supporting audit evidence: Implementation Drift 2.
- Supporting architecture evidence: testing strategy allows package-level tests beside source.
- Supporting related docs: `tests/README.md`.
- Supporting code evidence: `vitest.config.ts`, app/package `*.spec.ts` files.
- Tests/commands: `pnpm test` passed 10 files/80 tests.
- Verification pass 1 result: audit-to-tests confirmed stale row.
- Verification pass 2 result: test config/spec inventory confirmed corrected wording.
- Final status: Fixed.

### `docs/phase-4-editor-shell.md`

- Changed for: ID-03
- Why changed: Phase 4 deferred list could be misread as current even after later implementation.
- Supporting audit evidence: Implementation Drift 3.
- Supporting architecture evidence: architecture allows phase drift tracking as transitional debt.
- Supporting related docs: `docs/phase-5-advanced-editing.md`, `docs/implementation-roadmap.md`.
- Supporting code evidence: dirty-close, command palette, and preferences/keybinding source files.
- Tests/commands: `pnpm test`, `pnpm docs:check`.
- Verification pass 1 result: stale deferred bullets confirmed.
- Verification pass 2 result: later docs and code confirmed superseded wording.
- Final status: Fixed.

### `docs/architecture.md`

- Changed for: AD-01, AD-02, AD-03, AD-04, DW-01, DW-05, DW-08, TD-01, TD-02, TD-03
- Why changed: target graph needed explicit current-vs-target status after audit found README-only packages and app-local ownership.
- Supporting audit evidence: Architectural Drift 1-4; Deferred Work 1/5/8; Transitional Debt 1-3.
- Supporting architecture evidence: required structure, dependency direction, package responsibilities, public API rules.
- Supporting related docs: package READMEs, `docs/developer-documentation.md`, phase docs.
- Supporting code evidence: package inventory, app imports, app polling/localStorage/print/direct Tauri usage.
- Tests/commands: `pnpm docs:check`, `pnpm build:editor`, `pnpm build:viewer`.
- Verification pass 1 result: target architecture and implementation drift both confirmed.
- Verification pass 2 result: package inventory/app imports confirmed the revised current-vs-target wording.
- Final status: Partially fixed architectural drift by documenting truth; extraction deferred.

### `packages/core/README.md`

- Changed for: AD-01, AD-02, TD-02
- Why changed: make README-only target package status explicit.
- Supporting audit evidence: README-only package drift and localStorage transitional debt.
- Supporting architecture evidence: `packages/core` responsibilities.
- Supporting related docs: `docs/implementation-roadmap.md`, `apps/editor/README.md`.
- Supporting code evidence: no manifest/src; app-local session/preferences/recent files.
- Tests/commands: `pnpm docs:check`.
- Verification pass 1 result: placeholder status confirmed from package inventory.
- Verification pass 2 result: app source confirmed temporary ownership.
- Final status: Partially fixed documentation truthfulness; extraction deferred.

### `packages/platform/README.md`

- Changed for: DW-01, AD-01, AD-02, TD-01
- Why changed: make platform placeholder status and app-local direct platform calls explicit.
- Supporting audit evidence: platform facade/watch/close and app ownership findings.
- Supporting architecture evidence: `packages/platform` responsibilities and security rules.
- Supporting related docs: app READMEs, phase docs.
- Supporting code evidence: no manifest/src; direct Tauri invokes, polling, Rust commands.
- Tests/commands: `pnpm docs:check`, builds.
- Verification pass 1 result: placeholder and polling confirmed.
- Verification pass 2 result: app source confirmed no platform facade.
- Final status: Deferred implementation; documentation clarified.

### `packages/ui/README.md`

- Changed for: AD-01, AD-02
- Why changed: make README-only target package status explicit.
- Supporting audit evidence: README-only package drift and app-local UI ownership.
- Supporting architecture evidence: `packages/ui` responsibilities.
- Supporting related docs: `docs/developer-documentation.md`.
- Supporting code evidence: no manifest/src.
- Tests/commands: `pnpm docs:check`.
- Verification pass 1 result: placeholder status confirmed.
- Verification pass 2 result: no implemented UI package confirmed.
- Final status: Partially fixed documentation truthfulness; extraction deferred.

### `packages/shared/README.md`

- Changed for: AD-01, AD-03
- Why changed: make README-only shared contract status explicit.
- Supporting audit evidence: README-only package drift and target graph mismatch.
- Supporting architecture evidence: `packages/shared` responsibilities.
- Supporting related docs: package READMEs.
- Supporting code evidence: no manifest/src.
- Tests/commands: `pnpm docs:check`.
- Verification pass 1 result: placeholder status confirmed.
- Verification pass 2 result: dependency graph cannot use shared package yet.
- Final status: Partially fixed documentation truthfulness; extraction deferred.

### `packages/converters/README.md`

- Changed for: DW-04, AD-01, TD-04
- Why changed: make converter placeholder status and browser-print interim state explicit.
- Supporting audit evidence: converter/export pipeline and print/export debt.
- Supporting architecture evidence: `packages/converters` responsibilities.
- Supporting related docs: `docs/product-requirements.md`, `docs/implementation-roadmap.md`, `docs/marktext-parity-matrix.md`.
- Supporting code evidence: no manifest/src; app `window.print()`.
- Tests/commands: `pnpm docs:check`, builds.
- Verification pass 1 result: no converter implementation confirmed.
- Verification pass 2 result: print-only behavior confirmed.
- Final status: Deferred implementation; documentation clarified.

### `packages/theme-engine/README.md`

- Changed for: DW-05, AD-01, AD-04
- Why changed: make theme-engine placeholder status and app-local theme state explicit.
- Supporting audit evidence: theme engine/open built-in theme set and app-local theme drift.
- Supporting architecture evidence: `packages/theme-engine` responsibilities.
- Supporting related docs: `docs/theming-documentation.md`, `docs/product-requirements.md`.
- Supporting code evidence: no manifest/src; app CSS/preferences own light/dark state.
- Tests/commands: `pnpm docs:check`, builds.
- Verification pass 1 result: no theme package implementation confirmed.
- Verification pass 2 result: app-local theme ownership confirmed.
- Final status: Deferred implementation; documentation clarified.

### `packages/llm/README.md`

- Changed for: DW-06, AD-01
- Why changed: make LLM placeholder status explicit.
- Supporting audit evidence: local LLM support unimplemented.
- Supporting architecture evidence: `packages/llm` responsibilities and security rule.
- Supporting related docs: `docs/local-llm-setup.md`, `docs/markforge-expert-prompt.md`.
- Supporting code evidence: no manifest/src or provider implementation.
- Tests/commands: `pnpm docs:check`.
- Verification pass 1 result: no LLM implementation confirmed.
- Verification pass 2 result: docs/code agree it remains planned.
- Final status: Deferred implementation; documentation clarified.

### `package.json`

- Changed for: DW-08, TD-03
- Why changed: replace placeholder docs-check command with real validation script.
- Supporting audit evidence: docs validation placeholder finding.
- Supporting architecture evidence: architecture said docs-check should become a real validation gate.
- Supporting related docs: `docs/developer-documentation.md`.
- Supporting code evidence: previous script printed only scaffold message.
- Tests/commands: `pnpm docs:check`.
- Verification pass 1 result: placeholder command confirmed.
- Verification pass 2 result: new command executed script successfully.
- Final status: Fixed.

### `scripts/docs-check.mjs`

- Changed for: DW-08, TD-03
- Why changed: provide a targeted documentation validation gate.
- Supporting audit evidence: placeholder docs-check and stale status/testing drift.
- Supporting architecture evidence: docs-check release-gate requirement.
- Supporting related docs: README, developer docs, architecture, parity matrix, package READMEs.
- Supporting code evidence: package inventory and implemented package entrypoints.
- Tests/commands: `pnpm docs:check`.
- Verification pass 1 result: validation targets match confirmed drift markers.
- Verification pass 2 result: command passes after remediation and validates 35 Markdown files.
- Final status: Fixed.

### `docs/changelogs/drift-debt-remediation-changelog.md`

- Changed for: all issues
- Why changed: required remediation changelog with inventory, statuses, evidence, verification, and follow-up.
- Supporting audit evidence: entire audit issue set.
- Supporting architecture evidence: architecture document and current drift section.
- Supporting related docs: all docs referenced in issue table.
- Supporting code evidence: source/config/tests referenced in issue table.
- Tests/commands: final `pnpm docs:check`.
- Verification pass 1 result: all 21 confirmed issues inventoried.
- Verification pass 2 result: final self-audit checks every issue has a status.
- Final status: Required reporting artifact.

### `docs/drift-debt-remediation-report.md`

- Changed for: all issues
- Why changed: required final remediation report.
- Supporting audit evidence: entire audit issue set.
- Supporting architecture evidence: architecture compliance summary.
- Supporting related docs: changelog and issue references.
- Supporting code evidence: verification results and changed-file list.
- Tests/commands: final `pnpm docs:check`.
- Verification pass 1 result: report built from inventory and command results.
- Verification pass 2 result: final self-audit confirms no unresolved issue rows.
- Final status: Required reporting artifact.

## Follow-up Backlog

- Extract `packages/platform` facade around file read/write/info/dialog/clipboard/print/watch/close-event semantics.
- Define core schemas for session restore, recent files, preferences, and custom template migration.
- Add package manifests/entrypoints/tests only when a package owns a real minimal contract, not as empty placeholders.
- Add CommonMark/GFM fixture coverage before replacing markdown parser/front matter/diagram internals.
- Define converter/export contract before adding export settings UI.
- Extract current light/dark tokens into `packages/theme-engine` before adding more themes.
- Add integration/e2e/security/export/packaging tests.
- Track bundle budgets and code-split renderer/highlighter-heavy paths.
