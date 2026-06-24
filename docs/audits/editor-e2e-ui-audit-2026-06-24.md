# Editor E2E UI Audit - 2026-06-24

## Scope

This pass rechecked the editor UI for loose ends, implementation drift, deferred browser validation, and unwired visible controls. It uses the current drift/debt reports as source material, then verifies the implemented editor surface directly with Playwright.

## Findings

| Finding | Status | Evidence |
| --- | --- | --- |
| Repo-level browser E2E coverage was missing for the editor shell and dialogs. | Fixed in this pass. | Added `scripts/e2e-editor-ui.mjs` and `pnpm test:e2e:editor`. |
| Visible editor controls need automated label coverage to prevent placeholder or inaccessible UI drift. | Fixed in this pass. | The Playwright runner fails if visible buttons, inputs, selects, textareas, role buttons/options, or contenteditable editors lack a usable label. |
| Screenshot validation had been manual per phase rather than reusable. | Fixed in this pass. | The Playwright runner captures desktop, mobile, command palette, import conversion, templates/reference, preferences, and Local AI screenshots under `docs/audits/screenshots/e2e-editor-ui/`. |
| Source editor mutations emitted production React #185 console errors during Playwright-driven editing. | Fixed in this pass. | `apps/editor/src/ui/SourceEditor.tsx` now coalesces user edits outside the CodeMirror transaction callback and suppresses prop-sync echo changes. `apps/editor/src/ui/App.tsx` now de-duplicates identical selection state updates. |
| Native file dialogs and external provider calls are not safe to invoke from browser preview. | Guarded, not deferred product work. | The runner asserts the native-adapter controls are present and labelled, while testing browser-safe converter, Local AI profile, search, theme, view, and formatting workflows. Native filesystem/export behavior remains covered by unit/package checks and Tauri validation commands. |
| Previously documented product-level deferred items remain broader roadmap items, not newly discovered drift from this audit. | Unchanged. | `docs/audits/drift-debt-remediation-report.md` remains the ledger for broader fixture conformance, updater publishing, Linux artifacts, and full documentation site expansion. |

## Playwright Coverage

- Starts the built editor with Vite preview on a free local port.
- Replaces the default document with a stable Markdown fixture covering front matter, headings, task lists, tables, image syntax, and a Mermaid block.
- Verifies toolbar controls, formatting controls, inspector sections, source/search/replace inputs, theme buttons, and view modes.
- Exercises search and replace, table formatting actions, command palette, quick insert, HTML import conversion, custom template creation, reference help, preferences/keybindings, and Local AI profile setup without contacting an external model.
- Checks for browser console errors and page exceptions.
- Checks desktop and mobile horizontal overflow.
- Checks screenshot artifacts are non-empty and large enough to indicate rendered UI rather than blank captures.
- Visually inspected the generated desktop and mobile screenshots after the passing run.

## Command

```powershell
pnpm test:e2e:editor
```

## Screenshot Evidence

Expected outputs after the command runs:

- `docs/audits/screenshots/e2e-editor-ui/editor-desktop.png`
- `docs/audits/screenshots/e2e-editor-ui/editor-mobile.png`
- `docs/audits/screenshots/e2e-editor-ui/editor-command-palette.png`
- `docs/audits/screenshots/e2e-editor-ui/editor-import-conversion.png`
- `docs/audits/screenshots/e2e-editor-ui/editor-templates-reference.png`
- `docs/audits/screenshots/e2e-editor-ui/editor-preferences.png`
- `docs/audits/screenshots/e2e-editor-ui/editor-local-ai.png`
