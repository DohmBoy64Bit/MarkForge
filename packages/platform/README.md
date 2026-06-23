# packages/platform

Desktop platform services for filesystem, dialogs, clipboard, file watching, menus, printing, spell checking, shell integration, and updates.

Current status: implemented package boundary.

## Public API

- Filesystem read/write/info service contracts.
- Markdown open/save dialog service contracts.
- Clipboard read/write service contracts.
- Browser print facade.
- Native file-watch adapter contract with polling fallback support.
- Native close-request protection contract for dirty editor windows.

Apps provide thin Tauri adapter wiring at the shell boundary. Shell links, spellcheck, update checks, workspace/folder watching, and platform packaging integration remain unsupported until their exact Tauri/Rust contracts are implemented and tested.
