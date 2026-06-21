# ADR 0001: Desktop Stack

Status: proposed

Date: 2026-06-21

## Context

MarkForge must ship a professional Markdown editor and standalone viewer for Windows first, then Linux. The app needs native file dialogs, filesystem access, file watching, clipboard formats, print/PDF, native menus, keyboard shortcuts, spell checking, installer packaging, and a rich web-based editing surface.

MarkText currently uses Electron, Vue 3, TypeScript, CodeMirror, and Muya/MuyaJS. MarkForge may learn from that architecture but must not copy MarkText's code or visual design.

## Decision

Use a TypeScript monorepo with Tauri v2 as the preferred desktop runtime, React for application UI, CodeMirror 6 for source editing, and a dedicated Markdown engine package using unified/remark/rehype-compatible internals where practical.

Electron remains the fallback if a proof-of-concept shows that Tauri cannot meet required Windows packaging, clipboard, menu, print/PDF, spellcheck, or editor webview behavior without excessive custom native work.

## Rationale

- Tauri gives a smaller desktop shell and a strong Rust-side boundary for platform services.
- The prompt requires strict separation of filesystem/platform access, which maps well to Tauri commands and a `packages/platform` facade.
- React plus TypeScript gives a broad component ecosystem and testing support while keeping MarkForge visually distinct from MarkText's Vue app.
- CodeMirror 6 is mature for source editing and can be isolated behind `packages/editor-engine`.
- A Markdown engine package prevents UI coupling and allows the editor and viewer to share rendering, TOC, sanitization, and export behavior.

## Consequences

- The team must maintain Rust platform commands for desktop integration.
- The first proof-of-concept must validate Windows installer, file associations, clipboard rich text, image paste, print/PDF, native menus, and file watching.
- If Tauri proof-of-concept fails those gates, switch to Electron before large UI implementation.

## Proof-of-Concept Gate

Before broad implementation, build a small Windows proof-of-concept that verifies:

- Open/save file dialogs.
- Open folder and watch file changes.
- Clipboard read/write for Markdown, HTML, plain text, and images.
- Native menus and configurable keyboard shortcuts.
- Print/PDF export path.
- Sanitized Markdown preview inside the webview.
- Windows x64 installer creation.

