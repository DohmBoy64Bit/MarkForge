# packages/ui

Reusable presentational UI components and accessibility helpers. Business logic belongs in package services, not UI components.

Current status: implemented package boundary.

## Public API

- Accessible `IconButton` primitive for icon-only commands.
- Toolbar grouping metadata helpers.
- Shared active-index helpers for menus, palettes, and listbox-style controls.

The editor and viewer still own app-specific workflow components. Future extraction should move reusable dialogs/toolbars here without moving domain, platform, Markdown, converter, or persistence logic into UI.
