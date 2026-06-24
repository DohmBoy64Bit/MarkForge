# Viewer E2E UI Audit - 2026-06-24

## Scope

This pass adds a dedicated Playwright browser-preview audit for the MarkForge Viewer. The goal is maximum repeatable UI coverage for the implemented viewer surface without claiming native Tauri file dialogs can be completed from a plain browser preview.

## Coverage

- Builds `@markforge/viewer` and starts the built Vite preview on a free local port.
- Verifies the viewer brand, rendered Markdown region, document inspector, toolbar, inspector sections, status metadata, front matter, warnings, and contents links.
- Exercises every visible viewer toolbar control: open file, open workspace, reload file, copy rendered text, copy source, export HTML, print, and the inspector open-folder control.
- Exercises every built-in viewer theme: light, dark, high contrast, sepia paper, GitHub, and modern neutral.
- Exercises viewer document search in populated, no-match, and idle states.
- Exercises contents navigation through the rendered Markdown outline.
- Checks all visible controls expose a usable name across desktop, mobile, and tablet states.
- Checks desktop, mobile, and tablet shells for horizontal overflow and minimum rendered UI density.
- Fails on browser console errors and page exceptions.
- Regenerates screenshot evidence and verifies each screenshot is non-empty.

## Browser-Preview Limit

Open file, open workspace, open folder, clipboard, and HTML export route through native Tauri adapters. In browser preview, those adapters report the expected unavailable-native-path message. The test asserts the controls are wired, labelled, clickable, and surface a guarded status instead of pretending to complete OS dialogs.

## Command

```powershell
pnpm test:e2e:viewer
```

## Screenshot Evidence

The command regenerates `docs/audits/screenshots/e2e-viewer-ui/`.

Current evidence includes:

- `viewer-desktop.png`
- `viewer-theme-light.png`
- `viewer-theme-dark.png`
- `viewer-theme-high-contrast.png`
- `viewer-theme-sepia.png`
- `viewer-theme-github.png`
- `viewer-theme-modern-neutral.png`
- `viewer-search-results.png`
- `viewer-outline-link.png`
- `viewer-search-no-match.png`
- `viewer-search-idle.png`
- `viewer-reload-guard.png`
- `viewer-copy-rendered.png`
- `viewer-copy-source.png`
- `viewer-print.png`
- `viewer-open-file-guard.png`
- `viewer-open-workspace-guard.png`
- `viewer-open-folder-guard.png`
- `viewer-export-html-guard.png`
- `viewer-mobile.png`
- `viewer-tablet.png`

## Result

Dedicated viewer E2E coverage is now repeatable from a root script and captures the full browser-safe implemented viewer UI surface with screenshot evidence.
