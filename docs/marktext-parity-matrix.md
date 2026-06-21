# MarkText Parity Matrix

Status values: `supported`, `partially supported`, `intentionally changed`, `deferred`, `not applicable`.

This matrix is grounded in the repomixr bundle at `docs/research/repomixr/output/marktext/repomix-output.xml`, the temporary upstream checkout described in `docs/research/marktext-audit-snapshot.md`, MarkText docs, GitHub release metadata, and a current issues sample.

| Area | MarkText Feature | Evidence | MarkForge Status | Target Area | Notes |
|---|---|---|---|---|---|
| Editor modes | Realtime/WYSIWYG-style preview editor | `README.md`; `packages/website/public/docs-index.json`; `packages/muya/src`; `packages/muyajs/lib` | deferred | `packages/editor-engine`, `apps/editor` | Required for parity, but implementation waits for editor engine choice. |
| Editor modes | Source code mode | `packages/desktop/src/main/menu/templates/view.ts`; `components/editorWithTabs/sourceCode.vue` | partially supported | `apps/editor`, `packages/editor-engine` | Phase 4/5A provide first-class source Markdown editing; dedicated editor engine extraction remains open. |
| Editor modes | Split editor/preview | No explicit split preview surfaced in audited bundle | intentionally changed | `apps/editor`, `packages/editor-engine` | Required by MarkForge prompt as an optional mode beyond MarkText parity. |
| Editor modes | Typewriter mode | `packages/desktop/src/main/menu/templates/view.ts`; user docs basics/editing | deferred | `packages/editor-engine`, `packages/ui` | Preserve behavior, design original controls. |
| Editor modes | Focus mode | `packages/desktop/src/main/menu/templates/view.ts`; user docs basics/editing | deferred | `packages/editor-engine`, `packages/ui` | Include accessible visual treatment. |
| Editor modes | Distraction-free writing | MarkText docs describe minimal interface and focus/typewriter | deferred | `apps/editor` | MarkForge should add explicit distraction-free layout beyond parity. |
| Layout | Sidebar toggle | `packages/desktop/src/main/menu/templates/view.ts`; docs basics | deferred | `apps/editor`, `packages/ui` | Sidebar hosts workspace, search, and TOC. |
| Layout | Tab bar toggle and draggable tabs | docs basics; `components/editorWithTabs/tabs.vue` | deferred | `apps/editor` | Include keyboard-first tab navigation. |
| Layout | Table of contents panel | docs basics; `components/sideBar/toc.vue`; tests `toc-*` | partially supported | `packages/markdown-engine`, `packages/ui` | Editor and viewer expose generated outlines; full sidebar controls and tests remain open. |
| Workspace | Open file/save/save as | menu templates/actions file; docs basics | partially supported | `packages/platform`, `apps/editor` | Editor and viewer support local file flows; shared platform service boundary remains open. |
| Workspace | Open directory and file explorer | docs basics; sidebar components | deferred | `packages/platform`, `apps/editor` | Windows network paths must be tested due issue sample. |
| Workspace | Quick open | docs basics; `commands/quickOpen.ts` | deferred | `apps/editor` | Add fuzzy workspace file open. |
| Workspace | Opened files list | docs basics; sidebar preference | partially supported | `apps/editor` | Phase 4 tabs and recent files are backed by local session state; workspace file explorer remains open. |
| Workspace | File watching/change notifications | editor tabs notifications; watcher code; issue sample | deferred | `packages/platform` | Needs robust file watcher abstraction. |
| Workspace | File encoding, line ending, trailing newline controls | `commands/fileEncoding.ts`; `commands/lineEnding.ts`; `commands/trailingNewline.ts`; preferences | deferred | `packages/platform`, `packages/core` | Required for professional cross-platform file handling. |
| Session | Recent files/recent documents | app/menu/window manager evidence | partially supported | `packages/platform`, `apps/editor` | Editor stores recent paths locally; Windows jump list integration remains open. |
| Session | Session restore | editor buffer store/data center evidence | partially supported | `packages/core`, `apps/editor` | Editor restores unsaved/dirty tabs locally; core session migrations and tests remain open. |
| Markdown syntax | CommonMark | `README.md`; markdown syntax docs; Muya tests | partially supported | `packages/markdown-engine` | Renderer handles baseline syntax; broader compliance fixtures remain open. |
| Markdown syntax | GitHub Flavored Markdown | `README.md`; markdown syntax docs; GFM fixtures | partially supported | `packages/markdown-engine` | Tables, task lists, footnotes, and strikethrough render; full fixture coverage remains open. |
| Markdown syntax | Selective Pandoc support | `README.md`; docs-index | intentionally changed | `packages/markdown-engine` | Do not promise broad Pandoc parity; track specific extensions. |
| Markdown syntax | Headings h1-h6 and setext | markdown syntax docs | partially supported | `packages/markdown-engine`, `apps/editor` | Rendering and H1-H3 source commands exist; full heading command coverage remains open. |
| Markdown syntax | Paragraphs, breaks, horizontal rules | markdown syntax docs | partially supported | `packages/markdown-engine`, `apps/editor` | Baseline rendering and horizontal-rule insertion exist; conformance fixtures remain open. |
| Markdown syntax | Bold, italic, underline, strikethrough | format menu; markdown syntax docs | partially supported | `packages/editor-engine`, `apps/editor` | Phase 5A adds bold/italic source commands; underline, strikethrough command coverage, and rich editing remain open. |
| Markdown syntax | Superscript/subscript/highlight | format menu; changelog | deferred | `packages/markdown-engine` | Treat as opt-in extensions. |
| Markdown syntax | Links, autolinks, named anchors | markdown syntax docs; issue #4613 | partially supported | `packages/markdown-engine`, `apps/editor` | Links render and Phase 5A adds source link insertion; named anchor navigation tests remain open. |
| Markdown syntax | Images | markdown syntax docs; image tools docs | deferred | `packages/markdown-engine`, `packages/platform` | Include local path and URL handling. |
| Markdown syntax | Blockquotes | markdown syntax docs | partially supported | `packages/markdown-engine`, `apps/editor` | Rendering and source prefix command exist; advanced line transform parity remains open. |
| Markdown syntax | Ordered/unordered lists | markdown syntax docs; menu paragraph | partially supported | `packages/editor-engine`, `apps/editor` | Phase 5A adds source list commands; indentation preferences remain open. |
| Markdown syntax | Task lists | markdown syntax docs; tests `task-list-autocheck` | partially supported | `packages/markdown-engine`, `apps/editor` | Rendering and source task-list insertion exist; checkbox interaction tests remain open. |
| Markdown syntax | Tables and table editing tools | editing docs; Muya table source/tests | partially supported | `packages/editor-engine`, `packages/ui`, `apps/editor` | Rendering and starter table insertion exist; advanced table editing remains high-risk/open. |
| Markdown syntax | Code fences, inline code, syntax highlighting | markdown syntax docs; CodeMirror/prism themes | partially supported | `packages/markdown-engine`, `packages/theme-engine`, `apps/editor` | Rendering, highlighting path, and source inline/fence commands exist; theme contract and copy buttons remain open. |
| Markdown syntax | Keyboard keys syntax | markdown syntax docs | deferred | `packages/markdown-engine` | Confirm parser support or extension. |
| Markdown syntax | Emoji rendering and picker | markdown syntax docs; emoji selector code/data | deferred | `packages/editor-engine` | Use current emoji data at implementation time. |
| Markdown syntax | YAML/TOML/JSON front matter | markdown syntax docs; paragraph menu; changelog | partially supported | `packages/markdown-engine`, `apps/editor`, `apps/viewer` | Phase 2 parses YAML/TOML-style key-value front matter and JSON blocks; editor/viewer inspect it. Full parser coverage and display preferences remain open. |
| Markdown syntax | Math formulas with KaTeX | README; markdown syntax docs; math source/tests | partially supported | `packages/markdown-engine` | Phase 2 renders inline and block KaTeX math; chemical equations, settings, and broader fixtures remain open. |
| Markdown syntax | Diagrams: Mermaid, flowchart, sequence, Vega-lite, PlantUML | markdown syntax docs; diagram source/tests | partially supported | `packages/markdown-engine` | MarkForge prompt asks diagrams in viewer; exact parity may be staged. |
| Markdown syntax | Raw HTML | markdown syntax docs; disable HTML option/tests | partially supported | `packages/markdown-engine` | Renderer supports sanitized raw HTML and an `allowHtml` option; user-facing preferences and broader XSS fixtures remain open. |
| Editing tools | Selection format overlay | editing docs; Muya UI | deferred | `packages/editor-engine`, `packages/ui` | Feature parity with original styling. |
| Editing tools | Quick insert/block inserter | editing docs; quick insert menu tests | deferred | `packages/editor-engine`, `packages/ui` | MarkForge will extend with templates and converters. |
| Editing tools | Line transformer | editing docs; paragraph front menu | deferred | `packages/editor-engine` | Include duplicate/create/delete line actions. |
| Editing tools | Bracket/quote/Markdown auto-pairing | editing docs; preference schema | deferred | `packages/editor-engine` | Must be configurable. |
| Editing tools | Autocomplete for image paths | utils imagePathAutoComplement; tests | deferred | `packages/editor-engine`, `packages/platform` | Expand to links/headings/front matter/templates. |
| Search | Find and replace in document | edit menu; docs editing | partially supported | `packages/editor-engine`, `apps/editor` | Phase 4/5A provide source find, replace current, and replace all; regex/group replacement remains open. |
| Search | Find in folder | docs basics/editing; ripgrep IPC | deferred | `packages/platform`, `apps/editor` | Use ripgrep or equivalent behind platform service. |
| Import | Pandoc-backed import/convert path | `packages/desktop/src/main/utils/pandoc.ts`; file menu actions | intentionally changed | `packages/converters` | MarkForge uses a plugin converter architecture instead of a single import path. |
| Commands | Command palette | docs basics; commandPalette component | partially supported | `packages/ui`, `apps/editor` | Phase 5A adds a typed command registry; command palette UI remains open. |
| Menus | File/Edit/Paragraph/Format/View/Theme/Window/Help menus | menu templates | partially supported | `apps/editor`, `packages/platform` | File/view menu foundations and formatting toolbar exist; full native menu parity remains open. |
| Keybindings | Per-platform default keybindings | `keybindingsWindows.ts`, `keybindingsLinux.ts`, `keybindingsDarwin.ts` | partially supported | `packages/platform`, `packages/ui` | MarkForge supports Windows/Linux first; macOS not required. |
| Keybindings | User shortcut editor | keybinding pref components; issue #4621 | deferred | `packages/ui`, `packages/core` | Apply changes live, test for regressions. |
| Preferences | JSON-backed preferences and settings UI | preference schema/static/defaults/components | deferred | `packages/core`, `packages/ui` | Central schema with migrations. |
| Preferences | Editor fonts, line width, list indentation, auto-completion | docs editing/preferences; schema | deferred | `packages/core` | Data-driven settings. |
| Preferences | Disable HTML rendering | changelog; options tests | partially supported | `packages/markdown-engine`, `packages/core` | Markdown engine exposes `allowHtml: false`; app preference schema/UI remains open. |
| Preferences | Startup action, restore state, zoom, scrollbar, TOC wrap, sorting, watcher polling | preference schema/defaults/components | deferred | `packages/core`, `packages/platform` | Preserve useful desktop behavior with Windows-first defaults. |
| Preferences | Custom CSS | theme preference components | deferred | `packages/theme-engine` | Allowed after built-in theme contract is stable. |
| Clipboard | Copy as Markdown/plain text | edit/context menu evidence | partially supported | `packages/platform`, `packages/editor-engine`, `apps/editor` | Editor can copy Markdown source; richer context menu/plain text variants remain open. |
| Clipboard | Copy as HTML/rich text | edit/context menu; issue #4574 | deferred | `packages/platform` | Add regression tests. |
| Clipboard | Paste as plain text | edit/context menu | deferred | `packages/platform` | Include keyboard/menu parity. |
| Clipboard | Paste images directly | README; editing docs; image paste issue | deferred | `packages/platform`, `packages/editor-engine` | Windows clipboard behavior tested early. |
| Images | Image picker, URL/path popup, resize, alignment | editing docs; image edit tool tests | deferred | `packages/editor-engine`, `packages/ui` | Add drag-and-drop handling. |
| Images | Image upload support | changelog; uploader IPC | intentionally changed | `packages/converters`, `packages/platform` | MarkForge remains local-first; cloud upload only via future explicit plugin. |
| Images | Image cache invalidation | changelog; image handling utilities | deferred | `packages/platform`, `packages/editor-engine` | Needed for watched files and changed assets. |
| Export | HTML export | README; export menu/actions/util/tests | deferred | `packages/markdown-engine`, `packages/converters` | Required baseline. |
| Export | PDF export | README; export settings/PDF util/e2e tests | partially supported | `packages/platform`, `packages/converters` | Phase 1/3/4 provide browser print foundation; real PDF export pipeline and settings remain open. |
| Export | Include TOC in exported document | changelog | deferred | `packages/markdown-engine` | Required export option. |
| Export | Detailed export settings | export settings component/options | deferred | `packages/converters`, `packages/theme-engine` | Page size, orientation, margins, fonts, heading numbering, front matter, headers/footers, TOC, and export theme. |
| Print | Print options | changelog; file menu export/print | partially supported | `packages/platform` | Editor and viewer expose print commands through `window.print()`; shared print service and options remain open. |
| Themes | Application themes | README; theme menu; theme CSS assets | deferred | `packages/theme-engine`, `packages/ui` | MarkForge built-ins differ by prompt. |
| Themes | Code block themes | Prism theme assets | deferred | `packages/theme-engine` | Theme contract covers code. |
| Themes | Export themes | export theme assets/settings | deferred | `packages/theme-engine`, `packages/converters` | Separate print/export tokens. |
| Themes | Follow system theme | theme menu/preferences | deferred | `packages/platform`, `packages/theme-engine` | Windows and Linux support. |
| Themes | Custom CSS/theme override | theme preference components | deferred | `packages/theme-engine` | Validate and scope to avoid unsafe global breakage. |
| Spelling | Spell checker with Hunspell/system providers | spelling docs; spellchecker main/renderer/prefs | deferred | `packages/platform`, `packages/editor-engine` | Windows provider first. |
| Spelling | Automatic language detection | spelling docs | deferred | `packages/editor-engine` | Consider performance impact. |
| Spelling | Add/remove/ignore words | spelling docs; context menu spellcheck | deferred | `packages/platform` | Dictionary storage behind platform service. |
| Security | Sanitized HTML and XSS tests | e2e xss tests; sanitize tests | partially supported | `packages/markdown-engine` | DOMPurify-backed sanitization and dangerous-link tests exist; broader XSS regression fixtures remain non-negotiable. |
| Security | Safe external link handling | hyperlink sanitize tests; recent raw HTML link fix | partially supported | `packages/platform`, `packages/markdown-engine` | Renderer strips dangerous links and adds safe generated-link attributes; platform shell policy remains open. |
| Security | Hardened desktop renderer settings | context isolation e2e/config evidence | partially supported | `apps/editor`, `apps/viewer`, `packages/platform` | Tauri v2 capabilities and CSP are in place for baseline windows; final renderer/security audit remains open. |
| Packaging | Windows x64/arm64 installer and zip | latest release assets; electron-builder config | partially supported | `apps/editor`, `apps/viewer` | Editor and viewer have Windows x64 NSIS build paths; arm64, signing, update metadata, and release asset automation remain open. |
| Packaging | Linux AppImage/deb/rpm/snap/tar.gz | latest release assets | deferred | `apps/editor`, `apps/viewer` | Pick Linux formats after Windows baseline. |
| Updates | Auto-update metadata | latest release assets; installation docs | deferred | `packages/platform` | Decide update channel after stack selection. |
| Docs | User documentation website | MarkText website/docs index | partially supported | `docs` | MarkForge docs started; app help panel pending. |
| Tests | Unit/e2e coverage across editor, menus, export, security | `packages/desktop/test`, `packages/muya/e2e`, `packages/muya/src/__tests__` | partially supported | `tests`, package tests | MarkForge has docs gate only; implementation tests pending. |
| MarkForge extension | Standalone Markdown viewer | Not a MarkText core app component | intentionally changed | `apps/viewer` | Required by prompt; beyond MarkText parity. |
| MarkForge extension | Converter plugin architecture | Not a MarkText core feature | intentionally changed | `packages/converters` | Required by prompt. |
| MarkForge extension | Local LLM provider abstraction | Not a MarkText core feature | intentionally changed | `packages/llm` | Disabled by default, local-only. |
| MarkForge extension | Template system | Limited/no MarkText equivalent in audited sources | intentionally changed | `packages/templates` | Data-driven templates required. |
