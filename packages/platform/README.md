# packages/platform

Desktop platform services for filesystem, dialogs, clipboard, file watching, printing, spell checking, shell integration, updates, and close protection.

Current status: implemented package boundary.

## Public API

- Filesystem text/binary read/write/info service contracts.
- Markdown, HTML, DOCX, PDF, and image open/save dialog service contracts.
- Clipboard read/write service contracts.
- Browser print facade.
- Native file-watch adapter contract with polling fallback support.
- Workspace directory dialog, recursive workspace file listing, workspace content search, and workspace watch contracts.
- Shell recent-document integration service.
- Spellcheck service contract.
- Explicit updater status service that reports disabled update channels when no updater adapter is configured.
- Native close-request protection contract for dirty editor windows.

Apps provide thin Tauri adapter wiring at the shell boundary. Editor and viewer native code implement workspace listing/search/watch; editor native code also implements Windows shell recent-document updates. Signing, updater publishing, Linux artifact production, and richer OS spellcheck providers remain release-environment work.

Native menu construction and menu-event fanout currently remain app-shell responsibilities.
