# packages/ui

Reusable presentational UI components and accessibility helpers. Business logic belongs in package services, not UI components.

Current status: implemented package boundary.

## Public API

- Accessible `IconButton` primitive for icon-only commands.
- Toolbar grouping metadata helpers.
- Shared active-index helpers for menus, palettes, and listbox-style controls.

The editor and viewer use the shared `IconButton` primitive for icon-only command toolbar actions while still owning app-specific workflow components, layout composition, and state. Future extraction should move reusable dialogs/toolbars here without moving domain, platform, Markdown, converter, or persistence logic into UI.
