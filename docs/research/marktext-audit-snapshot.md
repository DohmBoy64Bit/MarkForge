# MarkText Audit Snapshot

Date: 2026-06-21

This snapshot records the evidence used for the initial MarkForge parity plan. It is intentionally separate from the parity matrix so the matrix can stay focused on product decisions.

## Repomixr Evidence

DohmBoy64Bit/repomixr was used as required by the MarkForge prompt.

- Config: `docs/research/repomixr/marktext-repos.json`
- Output root: `docs/research/repomixr/output`
- Bundle: `docs/research/repomixr/output/marktext/repomix-output.xml`
- Summary: `docs/research/repomixr/output/SUMMARY.md`
- Status: success
- Repomix version reported by stdout: 1.14.1
- Repository files packed: 1,300
- Output style: XML
- Compression: enabled
- Line numbers: enabled

Repomixr command recorded by the generated project README:

```bash
C:\Users\SeanS\AppData\Roaming\npm\repomix.CMD --remote https://github.com/marktext/marktext --style xml -o repomix-output.xml --output-show-line-numbers --compress
```

## Upstream Repository Snapshot

Temporary read-only checkout used for exact file inspection:

- Repository: `https://github.com/marktext/marktext`
- Branch: `develop`
- Commit: `a118712d482ab9216098c27d45f9c23916caeba6`
- Commit date: `2026-06-21 18:31:41 +0800`
- Commit subject: `fix(muya): make links inside a raw HTML block clickable (#4609)`
- Root package version: `0.20.0-dev`
- Package manager: `pnpm@10.33.4`
- Main stack observed: Electron, Vue 3, TypeScript, Muya/MuyaJS, CodeMirror, pnpm monorepo.

## Latest Release Snapshot

GitHub releases API reported:

- Latest release: `v0.19.1`
- Published: `2026-06-06T05:05:38Z`
- Release URL: `https://github.com/marktext/marktext/releases/tag/v0.19.1`
- Platforms/assets include Windows x64/arm64 setup EXE and ZIP, macOS arm64/x64 DMG/ZIP, Linux AppImage/deb/rpm/snap/tar.gz, update metadata, and `SHA256SUMS.txt`.
- Release notes include documentation sync, pnpm monorepo conversion, website/docs migration, Muya TypeScript migration work, and multiple Muya bug fixes.

## Issues Snapshot

GitHub issues API sample, first 30 open issues on 2026-06-21, showed recurring issue themes relevant to MarkForge:

- Editor stability and null/undefined runtime crashes: examples `#4606`, `#4600`, `#4595`, `#4578`, `#4565`, `#4562`.
- Windows and filesystem integration: Windows 11 install failure `#4598`, SSHFS mounted folder issue `#4599`, WSL file load issue `#4563`, network share image display issue `#4577`.
- Rich clipboard regression: `#4574`.
- UI/editor behavior regressions: custom keybindings without restart `#4621`, TOC click in source mode `#4619`, stacking context/modal preview issue `#4617`, diagram clipping `#4616`, inline math overflow/error presentation `#4615` and `#4614`.
- Feature request: open files in a new window instead of reusing the current window `#4560`.

MarkForge should treat these as design inputs: isolate platform services, test network paths and Windows packaging early, keep rich clipboard behavior under regression tests, and harden editor state transitions.

## High-Value MarkText Source Areas

- User docs and feature descriptions: `packages/website/public/docs-index.json`, `README.md`, localized docs under `docs/i18n`.
- Menus and commands: `packages/desktop/src/main/menu/templates/*`, `packages/desktop/src/main/menu/actions/*`, `packages/desktop/src/common/commands/constants.ts`, `packages/desktop/src/renderer/src/commands/descriptions.ts`.
- Keybindings: `packages/desktop/src/main/keyboard/keybindingsWindows.ts`, `keybindingsLinux.ts`, `keybindingsDarwin.ts`, `shortcutHandler.ts`.
- Preferences: `packages/desktop/src/main/preferences/schema.json`, `packages/desktop/static/preference.json`, `packages/desktop/src/shared/types/preferences.ts`, `packages/desktop/src/renderer/src/prefComponents/*`.
- Editor shell: `packages/desktop/src/renderer/src/components/editorWithTabs/*`, `packages/desktop/src/renderer/src/components/sideBar/*`.
- Markdown/editor engine: `packages/muya/src/*`, `packages/muyajs/lib/*`.
- Export and print: `packages/desktop/src/main/menu/actions/file.ts`, `packages/desktop/src/renderer/src/components/exportSettings/*`, `packages/desktop/src/renderer/src/util/exportHtml.ts`, `pdf.ts`, `printService.css`.
- Themes: `packages/desktop/src/renderer/src/assets/themes/*`, `packages/desktop/src/common/theme.ts`, `packages/desktop/src/renderer/src/util/theme.ts`.
- Spelling: `packages/desktop/src/main/spellchecker/index.ts`, `packages/desktop/src/renderer/src/spellchecker/*`, `packages/desktop/src/renderer/src/prefComponents/spellchecker/index.vue`.
- Security tests: `packages/desktop/test/e2e/xss.spec.ts`, `packages/muya/e2e/tests/security/sanitize.spec.ts`, `packages/muya/src/utils/__tests__/sanitizeHyperlink.spec.ts`.
- Packaging: `packages/desktop/electron-builder.yml`, `packages/desktop/build/windows/installer.nsh`, Linux desktop/appdata files, GitHub release workflow.

## Additional Read-Only Explorer Findings

A single read-only explorer pass over the repomix bundle confirmed these extra parity surfaces:

- No explicit split preview surfaced in the audited MarkText bundle; MarkForge keeps split mode as an original required feature.
- Import/convert path via Pandoc appears in file menu actions and utilities.
- Export settings include page size, orientation, margins, fonts, heading numbering, front matter visibility, export themes, headers/footers, and TOC.
- Image handling includes drag/drop, paste, resize/edit toolbar, path picker/autocomplete, local copy/move settings, PicGo/custom CLI upload, and image cache invalidation.
- Clipboard handling includes copy/cut/paste, paste as plain text, copy as rich text, copy as HTML, and rectangular table clipboard behavior.
- Preferences include startup action, restore state, zoom, TOC wrap, file sorting, text direction, quick-insert hints, task auto-check, watcher polling, custom CSS, Markdown extension toggles, and search options.
- Security evidence includes DOMPurify, hyperlink sanitization, raw HTML disable option, XSS tests, and renderer hardening checks for `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`.
- Tests include desktop Playwright E2E, Vitest unit tests, Muya E2E/unit tests, CommonMark 0.31, GFM 0.29-gfm conformance, and parity QA docs.
