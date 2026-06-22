# packages/platform

Desktop platform services for filesystem, dialogs, clipboard, file watching, menus, printing, spell checking, shell integration, and updates.

Current status: implemented package boundary.

## Public API

- Filesystem read/write/info service contracts.
- Markdown open/save dialog service contracts.
- Clipboard read/write service contracts.
- Browser print facade.
- Polling file-watch abstraction for current metadata-based change detection.

Apps provide thin Tauri adapter wiring at the shell boundary. Native file watching, native close interception, shell links, spellcheck, update checks, and platform packaging integration remain unsupported until their exact Tauri/Rust contracts are implemented and tested.
