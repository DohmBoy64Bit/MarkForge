# Documentation / Code Drift and Debt Audit

## Scope

Documentation files reviewed fully:

- `README.md`
- `apps/editor/README.md`
- `apps/viewer/README.md`
- `packages/converters/README.md`
- `packages/core/README.md`
- `packages/editor-engine/README.md`
- `packages/llm/README.md`
- `packages/markdown-engine/README.md`
- `packages/platform/README.md`
- `packages/shared/README.md`
- `packages/templates/README.md`
- `packages/theme-engine/README.md`
- `packages/ui/README.md`
- `tests/README.md`
- `docs/adr/0001-desktop-stack.md`
- `docs/architecture.md`
- `docs/design-principles.md`
- `docs/developer-documentation.md`
- `docs/implementation-roadmap.md`
- `docs/local-llm-setup.md`
- `docs/markforge-expert-prompt.md`
- `docs/marktext-parity-matrix.md`
- `docs/phase-1-proof-of-concept.md`
- `docs/phase-2-markdown-engine.md`
- `docs/phase-3-viewer-foundation.md`
- `docs/phase-4-editor-shell.md`
- `docs/phase-5-advanced-editing.md`
- `docs/phase-6-templates-help.md`
- `docs/product-requirements.md`
- `docs/research/marktext-audit-snapshot.md`
- `docs/research/repomixr/output/SUMMARY.md`
- `docs/research/repomixr/output/marktext/README.md`
- `docs/research/repomixr/output/marktext/repomix_stderr.txt`
- `docs/research/repomixr/output/marktext/repomix_stdout.txt`
- `docs/theming-documentation.md`
- `docs/user-documentation.md`

Generated research artifacts were treated separately from product documentation because they record external MarkText/Repomix provenance rather than MarkForge implementation behavior. The generated `.md` and `.txt` artifacts above were still read fully because they were returned by `rg --files -g "*.md" -g "*.mdx" -g "*.txt"`. The large generated `docs/research/repomixr/output/marktext/repomix-output.xml` was not in that documentation-file inventory and was not read fully for this audit.

Major code, configuration, test, script, and build areas cross-referenced:

- Root project files: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `vitest.config.ts`
- Audit script/config: `scripts/audit_marktext.py`, `docs/research/repomixr/marktext-repos.json`
- App manifests/config: `apps/editor/package.json`, `apps/viewer/package.json`, both Vite configs, both Tauri configs, both Tauri capability files
- Tauri Rust commands and menus: `apps/editor/src-tauri/src/lib.rs`, `apps/viewer/src-tauri/src/lib.rs`
- Editor app source: `apps/editor/src/ui/*`, `apps/editor/src/styles.css`
- Viewer app source: `apps/viewer/src/ui/*`, `apps/viewer/src/styles.css`
- Implemented packages: `packages/markdown-engine`, `packages/editor-engine`, `packages/templates`
- README-only package directories: `packages/core`, `packages/platform`, `packages/ui`, `packages/shared`, `packages/converters`, `packages/theme-engine`, `packages/llm`
- Tests discovered by `rg --files -g "*.spec.ts"` under `apps` and `packages`
- Verification commands run during audit: `pnpm docs:check`, `pnpm test`, `pnpm build:editor`, `pnpm build:viewer`

## Methodology

Each documentation file was read in full, then claims were checked against repository evidence. For implementation claims, the audit compared documentation to manifests, imports, package exports, app source, Rust command handlers, Tauri configuration, CSS theme ownership, local storage usage, tests, and scripts. For deferred/future-work claims, the audit required both documentation evidence and implementation evidence, such as README-only package directories, missing package manifests/source, direct app ownership, explicit placeholder scripts, metadata polling code, or implemented warnings. Findings below are limited to confirmed evidence. Items that were suspicious but not provable from repo contents are listed under "Unverified or Insufficient Evidence" instead of being classified.

## Executive Summary

MarkForge is a functioning early desktop Markdown editor/viewer baseline with Tauri apps, a shared markdown engine, source-mode editor commands, templates/help, local custom templates, and passing app/package unit tests. The most current implementation evidence aligns best with Phase 6B, not the Phase 5A status still stated in some high-level docs.

The strongest confirmed debt is architectural: the target monorepo boundaries are documented, but several target packages remain README-only and the editor/viewer apps still own platform calls, session storage, preferences, metadata polling, and UI wiring directly. This transitional state is explicitly acknowledged in the architecture and phase docs, but it remains real debt.

No critical release-blocking contradiction was found. The highest practical risks before the next phase are updating stale status/testing docs, replacing placeholder documentation validation, and deciding whether to extract platform/core/theme responsibilities before adding more feature depth.

## Confirmed Deferred Work

### 1. Platform facade, native file watching, and native close interception remain open

- Evidence from docs: `docs/architecture.md` assigns filesystem, dialogs, clipboard, file watching, printing/PDF, spell checking, native menus, app paths, and OS behavior to `packages/platform`; `apps/editor/README.md`, `apps/viewer/README.md`, `docs/phase-3-viewer-foundation.md`, `docs/phase-5-advanced-editing.md`, and `docs/implementation-roadmap.md` defer native file watching beyond metadata polling; `apps/editor/README.md` also defers native Tauri window-close interception.
- Evidence from code/config/tests: `packages/platform` contains only `README.md` and no `package.json` or `src`; editor/viewer call Tauri APIs directly in `apps/editor/src/ui/App.tsx` and `apps/viewer/src/ui/App.tsx`; file metadata is polled with `window.setInterval` in both apps; Rust commands live directly in `apps/editor/src-tauri/src/lib.rs` and `apps/viewer/src-tauri/src/lib.rs`; `rg` found `beforeunload` only in the editor web UI and no Tauri close-request handler.
- Why it qualifies as Deferred Work: The docs explicitly identify the final platform boundary and the native watcher/close behavior as later work, and the current code still uses polling and direct app/Tauri integration.
- Impact: New desktop integrations risk duplicating app-local behavior and increasing later extraction cost.
- Recommended next action: Build the first `packages/platform` facade around read/write/info/dialog/clipboard/watch/close-event semantics, then move editor/viewer call sites behind it incrementally.

### 2. Rich editor engine, CodeMirror 6 source surface, WYSIWYG/realtime editing, and advanced tools remain open

- Evidence from docs: `docs/adr/0001-desktop-stack.md` names CodeMirror 6 as the planned full source-editing surface; `docs/product-requirements.md`, `docs/marktext-parity-matrix.md`, `docs/phase-5-advanced-editing.md`, and `packages/editor-engine/README.md` describe WYSIWYG/realtime editing, autocomplete, table tools, image tools, linting, formatting, focus/typewriter, and richer line transforms as required or deferred.
- Evidence from code/config/tests: `apps/editor/package.json` has no CodeMirror dependency; the editor source pane is a React `<textarea>` in `apps/editor/src/ui/App.tsx`; `packages/editor-engine/src/commands.ts` and `packages/editor-engine/src/editingTransforms.ts` implement source-mode command transforms only; tests cover source transforms, quick insert helpers, command palette helpers, search, lifecycle, preferences, custom templates, and template autocomplete, not WYSIWYG/realtime editing.
- Why it qualifies as Deferred Work: The documentation explicitly treats these as future requirements, and the current implementation is a source-textarea plus command-transform foundation.
- Impact: MarkText parity for core editing remains partial, and adding rich editing later may affect selection, command, shortcut, and document-state contracts.
- Recommended next action: Choose and document the full editor-surface integration point before adding more source-only UI features.

### 3. Markdown engine conformance, full structured front matter parsing, diagrams, and theme-integrated highlighting remain open

- Evidence from docs: `docs/phase-2-markdown-engine.md` and `docs/implementation-roadmap.md` defer full CommonMark/GFM fixture import, full YAML/TOML parsing, Mermaid/PlantUML/Vega rendering, and theme-integrated code highlighting; `docs/marktext-parity-matrix.md` marks these areas partially supported or deferred.
- Evidence from code/config/tests: `packages/markdown-engine/src/index.ts` implements a limited key-value YAML/TOML parser, emits `front-matter-structured-parse-limited`, detects diagram fences with `diagram-rendering-deferred`, and registers a curated set of highlight.js languages; `packages/markdown-engine/src/index.spec.ts` tests representative rendering, sanitization, front matter, math, highlighting, and diagram warnings, but there is no imported CommonMark/GFM fixture corpus.
- Why it qualifies as Deferred Work: The docs name the unfinished parser/rendering/test coverage, and code contains explicit limited parsing and deferred diagram warnings.
- Impact: Documents using complex front matter, diagrams, broader syntax edge cases, or theme-specific code highlighting can render differently from the intended final engine.
- Recommended next action: Add fixture-based conformance coverage first, then replace limited parsers/renderers with dedicated libraries where needed.

### 4. Converter package and export pipeline are not implemented beyond browser print

- Evidence from docs: `docs/product-requirements.md`, `docs/implementation-roadmap.md`, `docs/marktext-parity-matrix.md`, and `packages/converters/README.md` require or plan a plugin-style conversion architecture, HTML/DOCX/PDF/clipboard/CSV/URL/OCR converters, HTML export, and PDF export settings.
- Evidence from code/config/tests: `packages/converters` contains only `README.md`; no `packages/converters/package.json` or `src` exists; `rg` finds no converter implementation; editor/viewer print actions call `window.print()` in `apps/editor/src/ui/App.tsx` and `apps/viewer/src/ui/App.tsx`; `packages/markdown-engine/README.md` mentions export HTML generation, but `packages/markdown-engine/src/index.ts` exports render/parse/heading APIs only.
- Why it qualifies as Deferred Work: The docs explicitly plan converter/export systems, while the repo currently has only scaffolding and print calls.
- Impact: Export and conversion requirements cannot be validated, tested, or exposed as stable product workflows yet.
- Recommended next action: Define `packages/converters` manifest and minimal converter contract before adding any app-level export UI.

### 5. Theme engine and full built-in theme set remain open

- Evidence from docs: `docs/product-requirements.md`, `docs/theming-documentation.md`, `docs/implementation-roadmap.md`, and `packages/theme-engine/README.md` require centralized tokens, validation, code/export/print theme mapping, and built-in light, dark, high contrast, sepia/paper, GitHub-like, and modern neutral themes.
- Evidence from code/config/tests: `packages/theme-engine` contains only `README.md`; editor/viewer theme state supports only light/dark in `apps/editor/src/ui/editorPreferences.ts`, `apps/editor/src/ui/App.tsx`, and `apps/viewer/src/ui/App.tsx`; app CSS files define local CSS variables and colors in `apps/editor/src/styles.css` and `apps/viewer/src/styles.css`.
- Why it qualifies as Deferred Work: The central theme system is documented as a future package, while implementation is app-local light/dark styling.
- Impact: Adding more themes or export/code-theme mapping now would likely duplicate local CSS instead of exercising the documented theme contract.
- Recommended next action: Extract current app CSS variables into an initial `packages/theme-engine` token model before adding additional built-in themes.

### 6. Local LLM support remains unimplemented

- Evidence from docs: `docs/local-llm-setup.md`, `docs/product-requirements.md`, `docs/implementation-roadmap.md`, `docs/markforge-expert-prompt.md`, and `packages/llm/README.md` describe local-first provider interfaces/adapters, disabled-by-default AI, Ollama/llama.cpp/LM Studio support, and AI Markdown actions as planned.
- Evidence from code/config/tests: `packages/llm` contains only `README.md`; no package manifest or source exists; `rg` finds no Ollama/llama.cpp/LM Studio/provider implementation in `apps`, `packages`, or `scripts`.
- Why it qualifies as Deferred Work: The docs explicitly say local AI assistance is planned but not implemented, and the codebase contains no implementation beyond the README.
- Impact: Privacy and provider-boundary requirements cannot yet be tested.
- Recommended next action: Keep AI docs framed as planned until `packages/llm` has a tested provider contract with mocked local providers.

### 7. Filesystem/workspace templates and broader autocomplete remain open

- Evidence from docs: `docs/phase-6-templates-help.md`, `packages/templates/README.md`, `apps/editor/README.md`, `docs/user-documentation.md`, and `docs/product-requirements.md` defer filesystem/workspace template loading, syncable template libraries, and general Markdown autocomplete beyond `/template` and `/tpl`.
- Evidence from code/config/tests: `packages/templates/src/index.ts` implements the built-in catalog and template helpers; `apps/editor/src/ui/customTemplates.ts` stores custom templates in `window.localStorage`; `apps/editor/src/ui/templateAutocomplete.ts` handles only line-leading `/template` and `/tpl` triggers; no filesystem template loader was found.
- Why it qualifies as Deferred Work: The docs identify these as later template/autocomplete requirements, and the current code is intentionally bounded to built-ins, editor-local custom templates, and template-only suggestions.
- Impact: Template sharing, workspace reuse, and non-template autocomplete cannot yet be treated as product-ready.
- Recommended next action: Decide whether workspace template loading belongs in `packages/templates`, `packages/platform`, or `packages/core`, then add a tested read-only loader before sync semantics.

### 8. Documentation validation remains a placeholder

- Evidence from docs: `docs/architecture.md` says `pnpm docs:check` is still a placeholder and should become a real documentation validation gate; `docs/developer-documentation.md` repeats that warning.
- Evidence from code/config/tests: root `package.json` defines `"docs:check": "node -e \"console.log('MarkForge docs scaffold ready')\""`. Running `pnpm docs:check` during this audit printed only `MarkForge docs scaffold ready`.
- Why it qualifies as Deferred Work: The docs explicitly call this out as a placeholder that must be replaced before release-gate use.
- Impact: Documentation drift can continue undetected by automation.
- Recommended next action: Replace the scaffold with link checks, stale-phase checks, package/doc inventory checks, and required-doc-section checks.

### 9. Packaging, Linux, file associations, update path, and OS integration remain incomplete

- Evidence from docs: `docs/product-requirements.md`, `docs/implementation-roadmap.md`, `docs/adr/0001-desktop-stack.md`, and `docs/user-documentation.md` require Windows first, then Linux packaging, file associations, recent documents, update story, shell integration, network path testing, spellcheck, and packaging documentation.
- Evidence from code/config/tests: editor/viewer Tauri configs target NSIS only; Windows x64 NSIS installers exist under each app's `src-tauri/target/release/bundle/nsis`; no Linux bundle target, update configuration, file association config, or spellcheck implementation was found in app/package source.
- Why it qualifies as Deferred Work: The docs place these requirements later than the current baseline, and the current configs only show Windows NSIS bundling.
- Impact: The project remains Windows-baseline-only and cannot yet claim cross-platform desktop completeness.
- Recommended next action: Add a packaging/OS integration checklist with separate Windows-hardening and Linux-smoke milestones.

## Confirmed Architectural Drift

### 1. Several documented packages are README-only placeholders

- Title: Target package responsibilities exceed implemented package boundaries.
- Documented architecture/design: `docs/architecture.md` and package READMEs assign concrete responsibilities to `packages/core`, `packages/platform`, `packages/ui`, `packages/shared`, `packages/converters`, `packages/theme-engine`, and `packages/llm`.
- Actual implementation: Those directories contain only `README.md`; they have no `package.json`, no `src`, no exports, and no tests. Only `packages/markdown-engine`, `packages/editor-engine`, and `packages/templates` are implemented package code.
- Evidence files: `docs/architecture.md`; all package READMEs; `pnpm-workspace.yaml`; `packages/*` directory inventory; implemented package manifests under `packages/markdown-engine/package.json`, `packages/editor-engine/package.json`, and `packages/templates/package.json`.
- Why it qualifies as Architectural Drift: The documented system shape includes package-owned services and contracts that do not yet exist as code modules.
- Impact: Responsibilities currently have no enforceable package boundary, which makes later extraction riskier as features accumulate.
- Recommended next action: Either mark README-only packages explicitly as planned placeholders or add minimal manifests/entrypoints/tests for the packages that should constrain upcoming work.

### 2. Editor and viewer app components still own domain/platform behavior targeted for packages

- Title: App-local ownership remains broader than the target architecture.
- Documented architecture/design: `docs/architecture.md` says apps should delegate domain work to packages and that filesystem/platform access belongs behind `packages/platform`; `docs/developer-documentation.md` says UI components must not contain business logic and filesystem access must live behind `packages/platform`.
- Actual implementation: `apps/editor/src/ui/App.tsx` owns document state, session persistence, recent files, save/reload behavior, search/replace flows, metadata polling, direct Tauri `invoke`, dialog calls, clipboard calls, `window.print()`, and local storage helpers. `apps/viewer/src/ui/App.tsx` owns file lifecycle, search, metadata polling, direct Tauri `invoke`, dialog calls, clipboard calls, and `window.print()`.
- Evidence files: `docs/architecture.md`; `docs/developer-documentation.md`; `apps/editor/src/ui/App.tsx`; `apps/viewer/src/ui/App.tsx`; `apps/editor/src-tauri/src/lib.rs`; `apps/viewer/src-tauri/src/lib.rs`.
- Why it qualifies as Architectural Drift: The actual responsibilities are concentrated in app UI modules, while the documented architecture assigns them to core/platform/editor-engine/theme packages.
- Impact: App code is doing useful work, but the current placement weakens reuse between editor/viewer and increases migration effort.
- Recommended next action: Extract one boundary at a time, starting with platform file/metadata services and core session/recent-files models.

### 3. Documented dependency direction does not match current package imports

- Title: Current app/package imports bypass parts of the documented dependency graph.
- Documented architecture/design: `docs/architecture.md` diagrams `apps/editor` depending on `packages/ui`, `packages/editor-engine`, `packages/core`, `packages/platform`, and `packages/shared`, while `packages/editor-engine` depends on `packages/markdown-engine`, `packages/templates`, `packages/theme-engine`, and `packages/shared`.
- Actual implementation: `apps/editor/package.json` depends directly on `@markforge/editor-engine`, `@markforge/markdown-engine`, and `@markforge/templates`; `apps/editor/src/ui/App.tsx` imports `@markforge/markdown-engine` and `@markforge/templates` directly. The editor does not depend on implemented `core`, `platform`, `ui`, or `shared` packages because those are README-only. `apps/viewer/package.json` depends directly on `@markforge/markdown-engine` and not on `theme-engine`, `platform`, `ui`, or `shared`.
- Evidence files: `docs/architecture.md`; `apps/editor/package.json`; `apps/viewer/package.json`; `apps/editor/src/ui/App.tsx`; `apps/viewer/src/ui/App.tsx`; `rg "@markforge/" apps packages`.
- Why it qualifies as Architectural Drift: Actual dependency edges differ from the documented target graph.
- Impact: Package extraction and dependency rules are not yet enforceable, and direct imports may become harder to unwind.
- Recommended next action: Update the architecture document to distinguish target graph from current graph, then add lint/build rules once package boundaries exist.

### 4. Theme handling is app-local rather than centralized

- Title: Theme behavior lives in app CSS/state instead of `packages/theme-engine`.
- Documented architecture/design: `docs/theming-documentation.md`, `docs/product-requirements.md`, `docs/architecture.md`, and `packages/theme-engine/README.md` require central theme tokens, built-in theme registry, validation, code theme mapping, and export/print theme support.
- Actual implementation: `packages/theme-engine` has only `README.md`; light/dark theme state and CSS variables are implemented in `apps/editor/src/ui/editorPreferences.ts`, `apps/editor/src/ui/App.tsx`, `apps/editor/src/styles.css`, `apps/viewer/src/ui/App.tsx`, and `apps/viewer/src/styles.css`.
- Evidence files: `docs/theming-documentation.md`; `packages/theme-engine/README.md`; `apps/editor/src/styles.css`; `apps/viewer/src/styles.css`; `apps/editor/src/ui/editorPreferences.ts`; `apps/viewer/src/ui/App.tsx`.
- Why it qualifies as Architectural Drift: The documented central theme engine does not own current theme behavior.
- Impact: Editor and viewer can visually diverge and future built-in/custom/export themes have no single contract.
- Recommended next action: Extract the current light/dark token set into the theme package before adding more themes.

## Confirmed Implementation Drift

### 1. Some current-status docs stop at Phase 5A while code and newer docs are at Phase 6B

- Title: Phase status is stale in high-level docs.
- Documentation claim: `README.md` says implementation has progressed through Phase 5A; `docs/developer-documentation.md` says implementation has progressed through Phase 5A and lists Phase 5A as the latest implemented phase.
- Actual code behavior: `packages/templates/src/index.ts` implements the Phase 6 built-in template catalog, variable helpers, and custom-template normalization; `apps/editor/src/ui/TemplatesHelpDialog.tsx`, `apps/editor/src/ui/customTemplates.ts`, and `apps/editor/src/ui/templateAutocomplete.ts` implement templates/help, local custom templates, and `/template`/`/tpl` suggestions. `docs/implementation-roadmap.md`, `docs/phase-6-templates-help.md`, `apps/editor/README.md`, and `docs/user-documentation.md` also describe Phase 6A/6B as shipped.
- Evidence files: `README.md`; `docs/developer-documentation.md`; `docs/implementation-roadmap.md`; `docs/phase-6-templates-help.md`; `apps/editor/README.md`; `docs/user-documentation.md`; `packages/templates/src/index.ts`; `apps/editor/src/ui/TemplatesHelpDialog.tsx`; `apps/editor/src/ui/customTemplates.ts`; `apps/editor/src/ui/templateAutocomplete.ts`.
- Why it qualifies as Implementation Drift: Current-state documentation understates implemented functionality relative to code.
- Impact: Contributors may plan work from the wrong phase boundary or miss existing templates/help implementation.
- Recommended next action: Update high-level status docs to say Phase 6B is implemented and keep historical phase docs clearly historical.

### 2. The parity matrix testing row is stale

- Title: Testing status says implementation tests are pending despite current app/package tests.
- Documentation claim: `docs/marktext-parity-matrix.md` says under "Tests" that "MarkForge has docs gate only; implementation tests pending."
- Actual code behavior: `vitest.config.ts` includes `packages/**/*.spec.ts` and `apps/**/*.spec.ts`; `rg --files -g "*.spec.ts"` finds 10 app/package spec files; running `pnpm test` during this audit passed 10 test files and 80 tests.
- Evidence files: `docs/marktext-parity-matrix.md`; `vitest.config.ts`; `packages/markdown-engine/src/index.spec.ts`; `packages/editor-engine/src/editingTransforms.spec.ts`; `packages/templates/src/index.spec.ts`; app spec files under `apps/editor/src/ui`; root `package.json`; audit command output from `pnpm test`.
- Why it qualifies as Implementation Drift: The documentation claims implementation tests are pending, but implementation tests now exist and pass.
- Impact: Test coverage is understated, and readers may not know where current tests live.
- Recommended next action: Update the parity matrix test row to distinguish current unit/helper coverage from still-missing integration/e2e/security/packaging coverage.

### 3. Older Phase 4 deferred bullets have been superseded by later implementation

- Title: Phase 4 deferred list includes items now implemented in later phases.
- Documentation claim: `docs/phase-4-editor-shell.md` lists prompt-before-close for dirty tabs, command palette UI, and user-editable keybinding preference model as deferred items.
- Actual code behavior: `apps/editor/src/ui/UnsavedChangesDialog.tsx`, `apps/editor/src/ui/documentLifecycle.ts`, and `apps/editor/src/ui/App.tsx` implement dirty-tab close/reload protection; `apps/editor/src/ui/CommandPalette.tsx` implements the command palette; `apps/editor/src/ui/PreferencesDialog.tsx` and `apps/editor/src/ui/editorPreferences.ts` implement local editable keybindings. Later docs in `docs/phase-5-advanced-editing.md` and `docs/implementation-roadmap.md` correctly record these as implemented.
- Evidence files: `docs/phase-4-editor-shell.md`; `docs/phase-5-advanced-editing.md`; `docs/implementation-roadmap.md`; `apps/editor/src/ui/UnsavedChangesDialog.tsx`; `apps/editor/src/ui/documentLifecycle.ts`; `apps/editor/src/ui/CommandPalette.tsx`; `apps/editor/src/ui/PreferencesDialog.tsx`; `apps/editor/src/ui/editorPreferences.ts`.
- Why it qualifies as Implementation Drift: If read as current status, the Phase 4 deferred list is stale against implemented later-phase code.
- Impact: Low direct product risk, but it can confuse audits that read phase files as current.
- Recommended next action: Add a note to older phase documents that their deferred lists are phase-era records and point to the roadmap for current status.

## Confirmed Transitional Debt

### 1. Metadata polling is the temporary file-change mechanism

- Evidence of transitional/temporary state: `docs/phase-1-proof-of-concept.md`, `docs/phase-3-viewer-foundation.md`, `docs/phase-5-advanced-editing.md`, `apps/editor/README.md`, and `apps/viewer/README.md` describe metadata polling as temporary or deferred versus native file watching.
- Current implementation status: Editor and viewer use `window.setInterval` to call `get_file_info` every 2500 ms; Tauri Rust exposes `get_file_info` commands in both apps.
- Why it qualifies as Transitional Debt: Polling is an intentionally temporary compatibility layer until native file watching/platform APIs settle.
- Impact: Change detection is less native and may miss richer watcher semantics such as renames, directory moves, and event coalescing.
- Recommended next action: Introduce a platform watcher abstraction with polling as a fallback, then migrate app code to it.

### 2. LocalStorage persists session, preferences, recent files, and custom templates

- Evidence of transitional/temporary state: `docs/architecture.md` says app-owned session restore, recent files, and platform/session logic should move toward `packages/core` and `packages/platform`; `docs/implementation-roadmap.md`, `apps/editor/README.md`, and `docs/phase-6-templates-help.md` describe localStorage-backed restore/preferences/custom templates and defer syncable/workspace template libraries.
- Current implementation status: `apps/editor/src/ui/App.tsx` persists session via `markforge.editor.session.v1`; `apps/editor/src/ui/editorPreferences.ts` persists preferences/keybindings via `markforge.editor.prefs.v1`; `apps/editor/src/ui/customTemplates.ts` persists custom templates via `markforge.editor.customTemplates.v1`.
- Why it qualifies as Transitional Debt: Browser-profile storage is accepted for momentum but is not the documented final core/platform/template ownership model.
- Impact: Migration, validation, backups, and cross-device/workspace behavior are not yet product-grade.
- Recommended next action: Define versioned core preference/session/template schemas before expanding persisted data.

### 3. `pnpm docs:check` is a placeholder release gate

- Evidence of transitional/temporary state: `docs/architecture.md` and `docs/developer-documentation.md` explicitly call `pnpm docs:check` a placeholder scaffold check.
- Current implementation status: Root `package.json` implements it as a one-line Node command printing `MarkForge docs scaffold ready`; audit execution confirmed that output.
- Why it qualifies as Transitional Debt: A placeholder command exists where a real validation gate is intended.
- Impact: CI or contributors could mistake a successful scaffold check for documentation quality assurance.
- Recommended next action: Replace with a real docs validation script before any release-gate claims.

### 4. Print/export remains a browser print foundation

- Evidence of transitional/temporary state: `docs/phase-1-proof-of-concept.md`, `docs/phase-2-markdown-engine.md`, `docs/phase-3-viewer-foundation.md`, `docs/implementation-roadmap.md`, and `docs/marktext-parity-matrix.md` describe browser print as a foundation and defer final export/PDF workflows.
- Current implementation status: Editor and viewer invoke `window.print()` for print actions; no converter/export package implementation exists.
- Why it qualifies as Transitional Debt: Browser print is a working interim path while the planned export/PDF/converter pipeline remains unbuilt.
- Impact: Export settings, PDF fidelity, HTML export, and DOCX workflows are not represented by current implementation.
- Recommended next action: Keep browser print labeled as interim and avoid adding export UI until converter/export ownership is defined.

### 5. Vite chunk-size warning is accepted debt

- Evidence of transitional/temporary state: `docs/phase-2-markdown-engine.md` says `pnpm build:editor` reports a Vite chunk-size warning after adding KaTeX and syntax highlighting and that a later slice should split/lazy-load heavier renderers.
- Current implementation status: Running `pnpm build:editor` during this audit succeeded and emitted a chunk-size warning for a 751.25 kB JS asset; running `pnpm build:viewer` also succeeded and emitted a chunk-size warning for a 676.11 kB JS asset.
- Why it qualifies as Transitional Debt: The project knowingly accepts large bundles until performance/code-splitting work.
- Impact: Startup/download size can grow as features are added, especially around renderers and editor tooling.
- Recommended next action: Track bundle budgets and split markdown/highlighter/template surfaces when feature work increases bundle size further.

## Unverified or Insufficient Evidence

- Historical command success claims in `docs/phase-1-proof-of-concept.md`, `docs/phase-2-markdown-engine.md`, and other phase docs were not fully re-run. This audit ran `pnpm docs:check`, `pnpm test`, `pnpm build:editor`, and `pnpm build:viewer`; it did not run `cargo check`, `pnpm tauri:build`, or `pnpm tauri:viewer:build`.
- Generated research claims about MarkText's latest release, open issues sample, and upstream commit in `docs/research/marktext-audit-snapshot.md` were not revalidated against GitHub during this code audit. Treat them as recorded research evidence from 2026-06-21, not as freshly verified external facts.
- The placeholder-icon note in `docs/phase-1-proof-of-concept.md` was not classified because the audit did not inspect icon provenance or design intent.
- Public API documentation completeness was not classified. `docs/architecture.md` says public package APIs must be documented, and exported functions/types exist in implemented packages, but the repo does not define a machine-checkable standard for what counts as sufficient API documentation.
- The generated Repomix XML bundle was not read fully because it is not one of the `.md`, `.mdx`, or `.txt` documentation files requested by the inventory command. Findings based on MarkText parity therefore rely on MarkForge's docs and generated summary/stdout files, not a fresh full XML audit.

## Clean Areas

- The root directory structure matches the documented monorepo shape: apps, packages, docs, tests, scripts, and standard root project/config files. No implementation code outside those boundaries was found by `rg --files` after excluding generated target/output areas.
- Implemented code packages (`packages/markdown-engine`, `packages/editor-engine`, `packages/templates`) each export through a single package entrypoint, matching the package API rule for packages that currently have manifests.
- `packages/markdown-engine` documentation is broadly accurate for the implemented renderer surface: render contract, sanitization, headings, front matter extraction, GFM-style tables/task lists/footnotes, KaTeX, highlight.js, warnings, and tests are present.
- `packages/templates` documentation matches the implemented catalog, variables, filtering, application, placeholder extraction, default merging, and custom-template normalization helpers.
- `apps/editor/README.md`, `docs/phase-6-templates-help.md`, and `docs/user-documentation.md` accurately reflect the current templates/help/custom-template/template-suggestion behavior seen in editor code.
- `apps/viewer/README.md` accurately reflects the current standalone viewer foundation: file open/reload for supported extensions, shared markdown rendering, inspector data, metadata polling, menu actions, copy actions, print, and light/dark mode.
- The documented `docs:check` placeholder status is accurate.
- The documented editor Vite chunk-size warning is still accurate; both editor and viewer builds completed successfully during this audit.

## Priority Fix List

### Critical

- None confirmed from the documentation/code evidence in this audit.

### High

- Update high-level current-status docs from Phase 5A to Phase 6B.
- Decide and document current-vs-target package boundaries, especially for `packages/core`, `packages/platform`, `packages/theme-engine`, `packages/converters`, and `packages/llm`.
- Replace `pnpm docs:check` with a real documentation validation gate.
- Begin platform/core extraction before adding more app-local desktop and persistence behavior.

### Medium

- Update the parity matrix test row to reflect current unit/helper tests and remaining missing integration/e2e/security/packaging coverage.
- Add explicit "historical phase record" notes or current-status links to older phase docs.
- Define initial package manifests/entrypoints for README-only packages that will be used in the next implementation phase.
- Create bundle-size tracking and code-splitting tasks for markdown/highlighter-heavy paths.

### Low

- Revalidate or date-stamp generated external research claims when they are used for future parity decisions.
- Clarify API documentation expectations so public exported functions/types can be audited objectively.
- Keep generated research artifacts separated from product/current-state documentation in future audits.

## Final Assessment

MarkForge is beyond a proof of concept and has a coherent Phase 6B baseline: editor, viewer, markdown engine, editor-engine commands, templates/help, local custom templates, and unit/helper tests are present and building. The docs are strongest where they describe recent Phase 5/6 implementation details and weakest where high-level status, package-boundary aspirations, and testing status have not been updated.

Before moving deeper into converters, theming, local LLM, or richer editing, the project should address the package-boundary and documentation-gate debt. The next phase will be easier to control if the repo first distinguishes target architecture from current architecture, updates stale status docs, and extracts at least the first platform/core responsibilities that editor and viewer already share.
