# Packaging and Release

MarkForge is Windows-first. The current reproducible packaging baseline builds two Tauri v2 Windows NSIS installers:

- MarkForge editor: `apps/editor/src-tauri/target/release/bundle/nsis/MarkForge_0.0.0_x64-setup.exe`
- MarkForge Viewer: `apps/viewer/src-tauri/target/release/bundle/nsis/MarkForge Viewer_0.0.0_x64-setup.exe`

## Prerequisites

- Node.js 22.19.0 or newer.
- pnpm 10 or newer through Corepack.
- Rust stable toolchain.
- Windows host with the Tauri v2 bundler prerequisites installed for NSIS output.

## Validation Sequence

Run these from the repository root:

```bash
pnpm docs:check
pnpm test
pnpm build:editor
pnpm build:viewer
pnpm bundle:check
pnpm packaging:check
```

Run Rust checks from each app shell:

```bash
cd apps/editor/src-tauri
cargo check

cd ../../viewer/src-tauri
cargo check
```

## Build Installers

Run these from the repository root:

```bash
pnpm tauri:build
pnpm tauri:viewer:build
```

Expected Windows outputs:

```text
apps/editor/src-tauri/target/release/bundle/nsis/MarkForge_0.0.0_x64-setup.exe
apps/viewer/src-tauri/target/release/bundle/nsis/MarkForge Viewer_0.0.0_x64-setup.exe
```

The current installer mode is per-user NSIS. Version numbers must stay aligned across root `package.json`, each app `tauri.conf.json`, and each app `Cargo.toml`; `pnpm packaging:check` enforces that alignment.

## Windows Shell Integration

The editor and viewer installers declare file associations for:

- `.md`
- `.markdown`
- `.mdown`
- `.txt`

The editor registers as an editor role. The viewer registers as a viewer role. Both apps accept a startup file path argument and load it through the existing platform file-read service. Windows default-app choice remains user-controlled, so smoke checks should verify Open With entries rather than assuming MarkForge becomes the default handler.

## Manual Smoke Checks

After building installers on Windows:

- Install the editor and viewer for the current user.
- Launch both apps from the installer-created shortcuts.
- Launch both apps with a sample Markdown file path argument and confirm the file opens.
- Confirm `.md` files expose MarkForge and MarkForge Viewer in Open With after install.
- Confirm editor open/save/save-as, recent file persistence, source/split/preview switching, theme switching, Export HTML, Import Conversion, Clean Markdown, Local AI disabled state, and print handoff.
- Confirm viewer file open, reload, search, theme switching, Export HTML, and print handoff.
- Uninstall both apps and confirm no obvious user-document files are removed.

Latest smoke evidence:

- [Windows installer smoke - 2026-06-22](audits/windows-installer-smoke-2026-06-22.md)
- [Windows shell integration smoke - 2026-06-22](audits/windows-shell-integration-smoke-2026-06-22.md)

## Linux Smoke Plan

Linux packaging is started as a documented smoke plan, not a completed release channel.

Target order:

1. Run `pnpm docs:check`, `pnpm test`, `pnpm build:editor`, and `pnpm build:viewer` on Ubuntu LTS.
2. Run `cargo check` in both `apps/editor/src-tauri` and `apps/viewer/src-tauri`.
3. Verify Tauri prerequisites for WebKitGTK and bundling.
4. Trial AppImage first because it is the broadest single-file smoke artifact.
5. Evaluate deb or rpm only after the AppImage smoke path launches cleanly.
6. Confirm local file dialogs, file read/write, clipboard text, browser print, and theme rendering.

Linux is not product-ready until this plan has real build artifacts and smoke evidence.

## Update Path

The Phase 10 baseline documents the release path and validates packaging configuration. Auto-update publishing, signing, release channels, and update metadata are still deferred until versioning, signing keys, hosting, and rollback policy are chosen.
