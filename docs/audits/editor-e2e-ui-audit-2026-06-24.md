# Editor E2E UI Audit - 2026-06-24

## Scope

This pass rechecked the editor and viewer UI for loose ends, implementation drift, deferred browser validation, and unwired visible controls. It uses the current drift/debt reports as source material, then verifies the implemented browser-safe surface directly with Playwright.

## Findings

| Finding | Status | Evidence |
| --- | --- | --- |
| Repo-level browser E2E coverage was missing for the editor shell, viewer shell, and dialogs. | Fixed in this pass. | Added `scripts/e2e-editor-ui.mjs`, `pnpm test:e2e:editor`, and `pnpm test:e2e:ui`. |
| Visible app controls need automated label coverage to prevent placeholder or inaccessible UI drift. | Fixed in this pass. | The Playwright runner fails if visible buttons, inputs, selects, textareas, role buttons/options, or contenteditable editors lack a usable label across editor and viewer states. |
| Screenshot validation had been manual per phase rather than reusable. | Fixed in this pass. | The Playwright runner regenerates the screenshot folder and captures editor/viewer desktop, mobile, theme, view, dialog, search, guarded, and empty states under `docs/audits/screenshots/e2e-editor-ui/`. |
| Source editor mutations emitted production React #185 console errors during Playwright-driven editing. | Fixed in this pass. | `apps/editor/src/ui/SourceEditor.tsx` now coalesces user edits outside the CodeMirror transaction callback and suppresses prop-sync echo changes. `apps/editor/src/ui/App.tsx` now de-duplicates identical selection state updates. |
| Native file dialogs and external provider calls are not safe to invoke from browser preview. | Guarded, not deferred product work. | The runner asserts the native-adapter controls are present and labelled, while testing browser-safe converter, Local AI profile, search, theme, view, and formatting workflows. Native filesystem/export behavior remains covered by unit/package checks and Tauri validation commands. |
| CodeMirror slash autocomplete popover is not deterministic under Playwright typing in production browser preview. | Browser automation limit. | The autocomplete engine remains covered by package tests. The E2E runner records the limit and screenshots the slash-command source state rather than claiming false popover coverage. |
| Previously documented product-level deferred items remain broader roadmap items, not newly discovered drift from this audit. | Unchanged. | `docs/audits/drift-debt-remediation-report.md` remains the ledger for broader fixture conformance, updater publishing, Linux artifacts, and full documentation site expansion. |

## Playwright Coverage

- Builds editor and viewer, then starts each app with Vite preview on a free local port.
- Replaces the default document with a stable Markdown fixture covering front matter, headings, task lists, tables, image syntax, and a Mermaid block.
- Verifies editor and viewer toolbar controls, formatting controls, inspector sections, source/search/replace inputs, theme buttons, and view modes.
- Exercises all browser-safe editor formatting controls, prompt-backed image insertion, search/replace, command palette populated/empty states, quick insert populated/empty states, converter modes, HTML import conversion, custom template creation, reference help, preferences/keybindings, and Local AI profile setup without contacting an external model.
- Exercises viewer themes, search results, no-match search, guarded reload, desktop, and mobile states.
- Checks for browser console errors and page exceptions.
- Checks desktop and mobile horizontal overflow.
- Checks screenshot artifacts are non-empty and large enough to indicate rendered UI rather than blank captures.
- Records browser-automation limits instead of presenting native dialog/provider paths or nondeterministic popovers as fully covered.

## Command

```powershell
pnpm test:e2e:ui
```

## Screenshot Evidence

The command regenerates `docs/audits/screenshots/e2e-editor-ui/`. Current coverage includes editor theme/view/dialog/search/mobile screenshots plus viewer theme/search/guard/mobile screenshots.
