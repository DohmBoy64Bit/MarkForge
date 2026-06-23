# Windows Installer Smoke - 2026-06-22

Scope: Release-hardening Milestone 1 after Phase 10 packaging documentation.

## Artifacts Tested

- `apps/editor/src-tauri/target/release/bundle/nsis/MarkForge_0.0.0_x64-setup.exe`
- `apps/viewer/src-tauri/target/release/bundle/nsis/MarkForge Viewer_0.0.0_x64-setup.exe`

## Result

Passed.

## Evidence

- No prior current-user MarkForge install was present under `%LOCALAPPDATA%`.
- Silent install completed for editor and viewer using `/S`.
- Installed binaries were created:
  - `%LOCALAPPDATA%\MarkForge\markforge-editor.exe`
  - `%LOCALAPPDATA%\MarkForge Viewer\markforge-viewer.exe`
- Uninstallers were created:
  - `%LOCALAPPDATA%\MarkForge\uninstall.exe`
  - `%LOCALAPPDATA%\MarkForge Viewer\uninstall.exe`
- Start Menu shortcuts were created:
  - `%APPDATA%\Microsoft\Windows\Start Menu\Programs\MarkForge.lnk`
  - `%APPDATA%\Microsoft\Windows\Start Menu\Programs\MarkForge Viewer.lnk`
- HKCU uninstall registry entries were created for `MarkForge` and `MarkForge Viewer`.
- Both installed executables launched successfully and were closed after the smoke check.
- Silent uninstall completed for editor and viewer using `/S`.
- Install folders, Start Menu shortcuts, uninstall registry entries, and running MarkForge processes were absent after uninstall.

## Commands

```powershell
Start-Process .\apps\editor\src-tauri\target\release\bundle\nsis\MarkForge_0.0.0_x64-setup.exe -ArgumentList '/S' -Wait
Start-Process ".\apps\viewer\src-tauri\target\release\bundle\nsis\MarkForge Viewer_0.0.0_x64-setup.exe" -ArgumentList '/S' -Wait
Start-Process "$env:LOCALAPPDATA\MarkForge\markforge-editor.exe"
Start-Process "$env:LOCALAPPDATA\MarkForge Viewer\markforge-viewer.exe"
Start-Process "$env:LOCALAPPDATA\MarkForge\uninstall.exe" -ArgumentList '/S' -Wait
Start-Process "$env:LOCALAPPDATA\MarkForge Viewer\uninstall.exe" -ArgumentList '/S' -Wait
```

## Follow-Up

- Milestone 2 should add Windows shell integration, starting with explicit file association configuration for Markdown extensions.
