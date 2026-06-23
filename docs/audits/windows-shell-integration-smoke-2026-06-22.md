# Windows Shell Integration Smoke - 2026-06-22

Scope: Release-hardening Milestone 2.

## Artifacts Tested

- `apps/editor/src-tauri/target/release/bundle/nsis/MarkForge_0.0.0_x64-setup.exe`
- `apps/viewer/src-tauri/target/release/bundle/nsis/MarkForge Viewer_0.0.0_x64-setup.exe`

## Result

Passed for source/config, installer registry registration, launch-with-file-argument, and uninstall cleanup.

## Source Changes Covered

- Editor installer declares `.md`, `.markdown`, `.mdown`, and `.txt` file associations with editor role.
- Viewer installer declares `.md`, `.markdown`, `.mdown`, and `.txt` file associations with viewer role.
- Editor and viewer expose a Rust `startup_file_path` command.
- Editor and viewer load supported startup file arguments through their existing platform file-read paths.
- `pnpm packaging:check` validates association declarations.

## Registry Evidence After Install

HKCU extension classes were registered:

- `.md` -> `MarkForge Viewer Document`
- `.markdown` -> `MarkForge Viewer Document`
- `.mdown` -> `MarkForge Viewer Document`
- `.txt` -> `MarkForge Viewer Document`

Viewer was installed after editor, so it became the current HKCU default class. Both ProgIDs were registered:

- `MarkForge Markdown Document`
- `MarkForge Viewer Document`

Open commands were registered:

```text
MarkForge Markdown Document -> %LOCALAPPDATA%\MarkForge\markforge-editor.exe "%1"
MarkForge Viewer Document -> %LOCALAPPDATA%\MarkForge Viewer\markforge-viewer.exe "%1"
```

## Launch Evidence

Created `%TEMP%\markforge-shell-smoke.md`, then launched:

```powershell
Start-Process "$env:LOCALAPPDATA\MarkForge\markforge-editor.exe" -ArgumentList $sample
Start-Process "$env:LOCALAPPDATA\MarkForge Viewer\markforge-viewer.exe" -ArgumentList $sample
```

Both installed processes launched with the file argument and stayed alive until explicitly closed by the smoke script.

## Cleanup Evidence

Silent uninstall removed:

- `%LOCALAPPDATA%\MarkForge`
- `%LOCALAPPDATA%\MarkForge Viewer`
- `%APPDATA%\Microsoft\Windows\Start Menu\Programs\MarkForge.lnk`
- `%APPDATA%\Microsoft\Windows\Start Menu\Programs\MarkForge Viewer.lnk`
- `HKCU\Software\Classes\MarkForge Markdown Document`
- `HKCU\Software\Classes\MarkForge Viewer Document`
- HKCU uninstall entries for both apps

No MarkForge processes remained after uninstall.

## Limitations

This smoke confirms Windows registry integration and startup argument launch. It does not yet visually assert the loaded document content inside the webview.
