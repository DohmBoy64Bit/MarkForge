# Release Hardening

This document tracks post-Phase-10 hardening milestones. Each milestone should update docs, validate, commit, and push before the next one starts.

## Milestone 1: Windows Installer Smoke

Status: complete.

Evidence:

- [Windows installer smoke - 2026-06-22](audits/windows-installer-smoke-2026-06-22.md)

Summary:

- Editor and viewer NSIS installers installed silently.
- Installed executables launched.
- Start Menu shortcuts and HKCU uninstall entries were created.
- Silent uninstall removed install folders, shortcuts, registry entries, and running processes.

## Milestone 2: Windows Shell Integration

Status: complete.

Evidence:

- [Windows shell integration smoke - 2026-06-22](audits/windows-shell-integration-smoke-2026-06-22.md)

Implemented:

- Editor installer declares Markdown/text file associations for `.md`, `.markdown`, `.mdown`, and `.txt` with `role: "Editor"`.
- Viewer installer declares the same extensions with `role: "Viewer"`.
- Editor and viewer Rust shells expose a `startup_file_path` command that returns a supported startup file argument.
- Editor and viewer React shells load the startup file through their existing platform read paths.
- `pnpm packaging:check` validates the association declarations.
- Rebuilt installers register both ProgIDs and open commands.
- Installed editor/viewer processes launch successfully with a sample Markdown file path argument.
- Silent uninstall removes install folders, shortcuts, ProgIDs, uninstall entries, and running processes.

## Remaining Milestones

- Milestone 3: signing/update strategy and guarded updater artifact configuration where safe.
- Milestone 4: Linux smoke pass.
- Milestone 5: deferred feature implementation and final drift/debt audit.
