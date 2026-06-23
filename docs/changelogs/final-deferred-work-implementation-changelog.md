# Final Deferred Work Implementation Changelog

Date: 2026-06-22

Scope: architecture-completion slice after `docs/audits/drift-debt-remediation-report.md`. The pass converted all required README-only package boundaries into real packages where safe, moved low-risk core/platform/converter ownership out of app code, expanded validation, and documented remaining unsupported capabilities with evidence.

## Verification Summary

- Before editing pass 1: started from `docs/audits/drift-debt-remediation-report.md` and confirmed 21 unresolved/deferred/partial issues.
- Before editing pass 2: started from source/config and confirmed missing manifests/source/tests for `packages/core`, `packages/platform`, `packages/shared`, `packages/converters`, `packages/theme-engine`, `packages/llm`, and `packages/ui`; confirmed app-local storage/platform/print behavior.
- After editing pass 1: code now has real package entrypoints/tests and editor/viewer delegate core/platform/browser-print paths through packages.
- After editing pass 2: docs/package READMEs/architecture now describe implemented package boundaries and explicitly unsupported capabilities.

## Issue Inventory

| Issue ID | Original status | New status | Implementation summary | Evidence checked | Tests / commands | Remaining risk |
| --- | --- | --- | --- | --- | --- | --- |
| DW-01 | Deferred | Completed by Phase 11 for opened files and editor close protection; follow-up adds editor workspace services | Implemented `packages/platform` with filesystem, dialogs, clipboard, print, watch, workspace list/search/watch, shell recent, spellcheck, updater status, and close-protection contracts; Phase 11 adds Rust `notify` open-file watchers and Tauri close-request interception. | Report DW-01; architecture platform rules; editor/viewer direct Tauri calls. | `packages/platform/src/index.spec.ts`; builds; Rust checks. | Viewer workspace browsing and broader workspace/network smoke remain unsupported. |
| DW-02 | Deferred | Partially completed by Phase 12A | CodeMirror 6 source editor foundation added; existing source commands preserved through a selection bridge. | Report DW-02; editor-engine docs/source; Phase 12 audit. | Editor build, app/package tests, evaluator pass. | WYSIWYG/realtime editing and advanced rich editing tools remain deferred. |
| DW-03 | Deferred | Deferred | No parser rewrite or diagram renderer added; current markdown warnings preserved. | Report DW-03; markdown-engine source/tests. | Existing markdown-engine tests. | CommonMark/GFM corpus and diagram renderer still needed. |
| DW-04 | Deferred | Partially completed | Implemented `packages/converters` contract, sanitized HTML converter, rich clipboard HTML import, URL/article HTML import, CSV table import, basic HTML export settings, capability checks, warnings, and browser-print converter. | Report DW-04/TD-04; print calls in apps. | `packages/converters/src/index.spec.ts`; builds. | Native PDF/DOCX/OCR unsupported. |
| DW-05 | Deferred | Completed for built-in app themes | Implemented `packages/theme-engine` tokens, validation, six built-in themes, CSS variables, code/export mappings; Phase 8F exposes the full app-visible built-in theme set in editor/viewer. | Architecture theme rules; theme README; Phase 8 docs. | `packages/theme-engine/src/index.spec.ts`; editor preference/theme tests. | System theme following, custom theme loading, and export theme settings remain future work. |
| DW-06 | Deferred | Completed for Phase 9 baseline | Implemented `packages/llm` provider interface, prompt templates, mock provider, cancellation, privacy guard, loopback endpoint validation, Ollama runtime adapter, OpenAI-compatible local adapter for LM Studio/llama.cpp-style servers, and editor Local AI UI. | Local LLM docs; architecture privacy rule; Phase 9 doc. | `packages/llm/src/index.spec.ts`, `apps/editor/src/ui/localAiWorkflow.spec.ts`, editor build. | Streaming, persisted provider profiles, model benchmarking guidance, and broader AI actions remain future work. |
| DW-07 | Deferred | Deferred | Preserved current templates behavior; no filesystem/workspace loader added. | Templates docs/source; app custom-template storage. | Existing template/custom-template tests. | Workspace template contract still needed. |
| DW-08 | Fixed | Fixed / expanded | Existing `docs:check` kept and expanded to validate implemented package README/manifest/source/test/entrypoint coverage. | `scripts/docs-check.mjs`; package inventory. | `pnpm docs:check`. | Broader release validation can still grow. |
| DW-09 | Deferred | Deferred | No packaging claims added. | Tauri configs/docs. | Builds only. | Linux packaging/file associations/updates remain release-hardening work. |
| AD-01 | Partially fixed | Completed for required packages | Added manifests, public entrypoints, READMEs, and tests for seven previously README-only packages. | Package directories and architecture. | `pnpm test`; `pnpm docs:check`. | None for package existence. |
| AD-02 | Deferred | Partially completed | Moved preference/session/recent schemas to core; moved app platform/print calls behind platform/converter APIs. | App source before/after. | App builds/tests. | Search/editor orchestration and custom template UI remain app-owned. |
| AD-03 | Partially fixed | Partially completed | Added real dependency edges and docs-check coverage; documented remaining direct editor imports. | App package manifests/source. | Builds/docs-check. | Editor still imports markdown-engine/templates directly. |
| AD-04 | Deferred | Partially completed | Theme engine is real and tested, and editor/viewer consume package-owned app theme variables and app-visible theme lists. | Theme docs/source; Phase 8 docs. | Theme package tests and editor preference tests. | Layout/component CSS remains app-local; system/custom/export theme settings remain future work. |
| ID-01 | Fixed | Fixed | Previous docs remediation preserved. | README/developer docs. | Docs-check. | None introduced. |
| ID-02 | Fixed | Fixed | Previous parity matrix remediation preserved. | Parity matrix/tests. | `pnpm test`. | None introduced. |
| ID-03 | Fixed | Fixed | Previous phase-history remediation preserved. | Phase 4/5 docs. | Docs-check. | None introduced. |
| TD-01 | Deferred | Partially completed | Platform owns polling watch fallback and metadata calls; Phase 11 adds native opened-file watch commands/events for editor and viewer, and follow-up remediation adds editor workspace watch commands/events. | App/platform source; Phase 11 docs. | Platform tests, builds, Phase 11 Rust checks. | Viewer workspace browsing and broader workspace/network smoke remain unsupported. |
| TD-02 | Deferred | Partially completed | Core now owns editor preferences, session restore, recent files, and storage helpers. | App localStorage source. | Core/app tests. | Custom templates remain app-local. |
| TD-03 | Fixed | Fixed / expanded | Docs-check remains real and now validates new package boundaries. | Script/package inventory. | `pnpm docs:check`. | None introduced. |
| TD-04 | Deferred | Partially completed | Browser print now runs through converter-backed path in both apps. | App print source. | Converter tests/builds. | Native PDF/export options unsupported. |
| TD-05 | Deferred | Completed by release hardening Milestone 5 | Added `pnpm bundle:check`; release hardening later split app, React, icon, and markdown/rendering chunks and tightened the JavaScript asset budget to 500 KiB. | Build output assets; release-hardening audit. | `pnpm build:editor`, `pnpm build:viewer`, `pnpm bundle:check`. | Route-level lazy loading can still be considered if future features grow the app chunks. |

## Files Changed By This Pass

- `apps/editor/package.json`
- `apps/editor/src/ui/App.tsx`
- `apps/editor/src/ui/editorPreferences.ts`
- `apps/viewer/package.json`
- `apps/viewer/src/ui/App.tsx`
- `docs/architecture.md`
- `docs/changelogs/final-deferred-work-implementation-changelog.md`
- `docs/audits/final-pre-next-phase-implementation-report.md`
- `package.json`
- `pnpm-lock.yaml`
- `packages/converters/README.md`
- `packages/converters/package.json`
- `packages/converters/src/index.ts`
- `packages/converters/src/index.spec.ts`
- `packages/core/README.md`
- `packages/core/package.json`
- `packages/core/src/index.ts`
- `packages/core/src/index.spec.ts`
- `packages/llm/README.md`
- `packages/llm/package.json`
- `packages/llm/src/index.ts`
- `packages/llm/src/index.spec.ts`
- `packages/platform/README.md`
- `packages/platform/package.json`
- `packages/platform/src/index.ts`
- `packages/platform/src/index.spec.ts`
- `packages/shared/README.md`
- `packages/shared/package.json`
- `packages/shared/src/index.ts`
- `packages/shared/src/index.spec.ts`
- `packages/theme-engine/README.md`
- `packages/theme-engine/package.json`
- `packages/theme-engine/src/index.ts`
- `packages/theme-engine/src/index.spec.ts`
- `packages/ui/README.md`
- `packages/ui/package.json`
- `packages/ui/src/index.ts`
- `packages/ui/src/index.spec.ts`
- `scripts/bundle-check.mjs`
- `scripts/docs-check.mjs`

## Unsupported Capabilities

Unsupported capabilities are explicit package results or documented remaining work: viewer workspace browsing, native spellcheck providers, auto-update publishing/signing, Linux package artifacts, native PDF/DOCX/OCR conversion, local AI streaming and persisted provider profiles, WYSIWYG/realtime editing beyond CodeMirror source mode, broader Markdown autocomplete, and syncable template libraries. Broader route-level lazy loading remains optional future optimization rather than current chunk-warning debt.
