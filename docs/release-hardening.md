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

## Milestone 3: Update and Signing Strategy

Status: complete for guarded baseline.

Implemented:

- Added [Update and Signing Strategy](update-signing-strategy.md).
- Explicitly set `bundle.createUpdaterArtifacts` to `false` in editor and viewer Tauri configs.
- `pnpm packaging:check` now fails if updater endpoints or Windows signing fields are configured before signing/update policy is approved.

Deferred until real release infrastructure exists:

- Tauri updater plugin dependencies and UI.
- Updater key generation and CI secret storage.
- Windows certificate configuration or signing command.
- Release channel endpoints and static update JSON.
- Signed artifact validation in CI.

## Milestone 4: Linux Smoke Pass

Status: complete for repeatable smoke wiring and current WSL prerequisite audit; Linux release artifacts remain blocked by host prerequisites.

Evidence:

- [Linux smoke - 2026-06-22](audits/linux-smoke-2026-06-22.md)

Implemented:

- Added `pnpm linux:smoke`, backed by `scripts/linux-smoke.sh`.
- The smoke script validates Linux host prerequisites before running repository checks.
- The script runs docs, tests, editor/viewer builds, bundle checks, packaging checks, and both Tauri `cargo check` commands once prerequisites are present.
- Optional Linux artifact bundling is guarded behind `MARKFORGE_LINUX_BUNDLE=1`.

Current blocker:

- The available WSL Ubuntu host is missing native Linux Node.js, Rust/Cargo, WebKitGTK, and JavaScriptCoreGTK packages. Sudo requires interactive authentication, so those prerequisites could not be installed non-interactively in this pass.

## Milestone 5: Deferred Feature and Drift/Debt Cleanup

Status: complete for the release-hardening cleanup slice and final audit.

Evidence:

- [Release hardening final drift audit - 2026-06-22](audits/release-hardening-final-drift-audit-2026-06-22.md)

Implemented:

- Split editor and viewer renderer bundles into app, React, icon, and markdown/rendering chunks.
- Tightened `pnpm bundle:check` to a 500 KiB JavaScript asset ceiling per emitted asset.
- Migrated editor/viewer file-change detection through the package-backed platform watcher instead of app-owned timers.
- Added watcher regression coverage for change, missing, and dispose behavior.
- Updated current-state docs for bundle and watcher behavior.

Remaining intentionally deferred:

- Native filesystem watcher events.
- Native close interception.
- Full CodeMirror/WYSIWYG editor surface.
- Diagram rendering and broader Markdown conformance corpus.
- Full native PDF/DOCX/OCR/URL conversion.
- Filesystem/workspace template loading.
- Linux artifact smoke, blocked by current host prerequisites.
