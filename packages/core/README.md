# packages/core

Application persistence schemas and helpers for preferences, session restore, recent files, and safe JSON storage.

Current status: implemented package boundary.

## Public API

- Versioned editor preference schema, defaults, validation, and migration helpers for the existing local preference key.
- Session restore schema and local-storage read/write helpers for unsaved editor session tabs.
- Recent-file normalization and update helpers.
- JSON storage helpers that keep localStorage failures non-fatal.

The editor still owns app-specific command registry labels and UI state, but persistence schema ownership now lives here.
