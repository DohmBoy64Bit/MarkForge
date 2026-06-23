# ADR 0001: Desktop Stack

Status: accepted

Date: 2026-06-21

## Context

MarkForge must ship a professional Markdown editor and standalone viewer for Windows first, then Linux. The app needs native file dialogs, filesystem access, file watching, clipboard formats, print/PDF, native menus, keyboard shortcuts, spell checking, installer packaging, and a rich web-based editing surface.

MarkText currently uses Electron, Vue 3, TypeScript, CodeMirror, and Muya/MuyaJS. MarkForge may learn from that architecture but must not copy MarkText's code or visual design.

## Decision

Use a TypeScript monorepo with Tauri v2 as the accepted desktop runtime, React for application UI, CodeMirror 6 as the planned full source-editing surface, and a dedicated Markdown engine package using unified/remark/rehype-compatible internals where practical.

Phase 1 validated enough of the Tauri v2 baseline to continue implementation on that stack. Electron is no longer the default fallback path, but the decision can be revisited if later native-integration gates prove impractical in Tauri without excessive custom work.

## Rationale

- Tauri gives a smaller desktop shell and a strong Rust-side boundary for platform services.
- The prompt requires strict separation of filesystem/platform access, which maps well to Tauri commands and a `packages/platform` facade.
- React plus TypeScript gives a broad component ecosystem and testing support while keeping MarkForge visually distinct from MarkText's Vue app.
- CodeMirror 6 is mature for source editing and can be isolated behind `packages/editor-engine`.
- A Markdown engine package prevents UI coupling and allows the editor and viewer to share rendering, TOC, sanitization, and export behavior.

## Consequences

- The team must maintain Rust platform commands for desktop integration.
- Phase 1 validated the editor shell, native file dialogs, local file read/write, menu accelerators, clipboard smoke controls, metadata polling, browser print foundation, and Windows x64 NSIS installer creation.
- Phase 10 added a repeatable packaging validation gate and release documentation for editor/viewer Windows NSIS installers.
- Later phases must still validate file associations, rich clipboard formats, image paste, native file watching, spellcheck, export/PDF workflows, and final renderer hardening.
- If a remaining native-integration gate fails in Tauri, evaluate a targeted Rust/plugin implementation before reconsidering Electron.

## Validation Status

Validated in the current baseline:

- Open/save file dialogs.
- Local file read/write through Tauri commands.
- Native menu accelerators.
- Clipboard read/write smoke path.
- Browser print foundation.
- Sanitized Markdown preview inside the webview.
- Windows x64 installer creation.
- Phase 10 packaging metadata validation through `pnpm packaging:check`.
- Documented editor/viewer Windows NSIS build commands and smoke checks.

Still open:

- Open folder and native file watching.
- Clipboard read/write for HTML, rich text, and images.
- Native menus and configurable keyboard shortcuts.
- Export/PDF pipeline beyond browser print.
- Spellcheck.
- Code signing, auto-updater publishing, and Linux package artifacts.

Post-Phase-10 release hardening added Windows file association declarations and startup-file loading for Markdown/text files.
