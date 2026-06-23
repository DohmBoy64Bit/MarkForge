# packages/platform

Desktop platform services for filesystem, dialogs, clipboard, file watching, menus, printing, spell checking, shell integration, and updates.

Current status: implemented package boundary.

## Public API

- Filesystem read/write/info service contracts.
- Markdown open/save dialog service contracts.
- Clipboard read/write service contracts.
- Browser print facade.
- Native file-watch adapter contract with polling fallback support.
- Workspace directory dialog, recursive workspace file listing, workspace content search, and workspace watch contracts.
- Shell recent-document integration service.
- Spellcheck service contract.
- Explicit updater status service that reports disabled update channels when no updater adapter is configured.
- Native close-request protection contract for dirty editor windows.

Apps provide thin Tauri adapter wiring at the shell boundary. Editor native code implements workspace listing/search/watch and Windows shell recent-document updates. Signing, updater publishing, Linux artifact production, and richer OS spellcheck providers remain release-environment work.
