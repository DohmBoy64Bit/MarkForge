# packages/theme-engine

Central theme tokens, built-in themes, validation, code theme mapping, and export/print theme support.

Current status: implemented package boundary.

## Public API

- Built-in registry for light, dark, high contrast, sepia/paper, GitHub-like, and modern neutral themes.
- Theme token validation.
- CSS variable generation.
- App-facing CSS variable generation for editor/viewer shell tokens.
- Code highlighting theme mapping.
- Print/export foreground and background mapping.

The current editor/viewer UI exposes and persists Light, Dark, and Sepia Paper app chrome themes. High contrast, GitHub-like, and modern neutral are package-ready but not yet surfaced as app controls.
