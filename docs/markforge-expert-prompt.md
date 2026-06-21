# MarkForge Expert Prompt

```text
You are a principal software architect, senior desktop-app engineer, product designer, and technical lead.

I want to build MarkForge: a professional all-in-one Markdown editor and standalone Markdown viewer for Windows and Linux, with Windows as the first production target.

The product should be inspired by the clean writing experience of MarkText, but it must not be a 1:1 visual or code copy. It should achieve 100% functional feature parity with MarkText where practical, then add original features beyond it. Before implementation, audit MarkText’s public repository, documentation, menus, preferences, releases, and issues to create a feature-parity matrix. Use DohmBoy64Bit/repomixr (https://github.com/DohmBoy64Bit/repomixr) for the MarkText parity piece so the audit can be grounded in the repository contents. Do not guess parity. Track every MarkText feature as: supported, partially supported, intentionally changed, deferred, or not applicable.

Core product vision:
Build a modern, fast, local-first Markdown editor with live preview, intelligent editing tools, templates, autocomplete, built-in Markdown assistance, conversion tools, local LLM support, theming, and a polished standalone viewer. The UI should be modern, calm, readable, and uncluttered, similar in simplicity to MarkText, but visually distinct and more extensible.

Key editor features:
- Live preview and/or WYSIWYG-style Markdown editing.
- Optional split editor/preview mode.
- Source Markdown mode.
- Focus mode, typewriter mode, distraction-free mode.
- Full CommonMark and GitHub Flavored Markdown support.
- Tables, task lists, footnotes if supported by chosen parser, strikethrough, links, images, blockquotes, code fences, front matter, emoji, math with KaTeX or equivalent.
- Table of contents generated from headings.
- Built-in Markdown tag/block inserter.
- Autocomplete and smart suggestions for Markdown syntax, links, headings, images, tables, front matter fields, code fences, and templates.
- Markdown linting, formatting, and cleanup tools.
- Search and replace.
- File explorer/workspace support.
- Recent files and session restore.
- Export to HTML, PDF, and optionally DOCX.
- Clipboard support for Markdown, HTML, and plain text.
- Drag-and-drop image handling.
- Built-in help/reference panel for Markdown syntax.
- Keyboard shortcuts with a shortcut editor.
- Template system for README files, documentation, notes, changelogs, blog posts, meeting notes, project specs, GitHub issues, pull requests, and technical docs.

Conversion features:
Create a “Convert to Markdown” system with a clean plugin-style architecture. Support as many of these as possible:
- HTML to Markdown.
- DOCX to Markdown.
- PDF to Markdown, with clear limitations.
- Clipboard rich text to Markdown.
- CSV/table data to Markdown table.
- URL/article to Markdown using readability extraction.
- Image OCR to Markdown text where practical.
- Existing Markdown cleanup/normalization.

Local LLM support:
Add optional local AI assistance for Markdown generation and editing. It must be private, local-first, and disabled by default unless configured by the user.
- Support provider abstraction: Ollama, llama.cpp, LM Studio, or other local backends.
- Select the smallest high-quality current local model at implementation time based on real benchmarks and hardware constraints. Do not hardcode an outdated recommendation without verification.
- Features should include: generate Markdown draft, summarize document, improve clarity, fix formatting, create outline, convert rough notes to structured Markdown, generate tables, suggest headings, and explain Markdown syntax.
- All AI features must work through a service boundary so the editor is not coupled directly to one model/provider.
- Clearly show when AI is being used.
- Never send user documents to cloud APIs unless the user explicitly adds a cloud provider later.

Standalone Markdown viewer:
Build a separate viewer mode/app component with:
- Fast rendering of Markdown files.
- Theme support.
- Table of contents sidebar.
- Search within document.
- Print/export support.
- Copy code block buttons.
- Math, diagrams, tables, task lists, front matter display options.
- Presentation/reading mode if feasible.
- Safe rendering with sanitized HTML.
- File watching / auto-refresh when the source file changes.

Theming:
Implement a real theming system, not hardcoded colors.
- Include several built-in themes: light, dark, high contrast, sepia/paper, GitHub-like, and a modern neutral theme.
- Themes should affect editor, preview, viewer, code blocks, sidebars, menus, and dialogs.
- Support user-custom themes later through JSON/CSS variables.
- Keep the default UI professional, modern, and not cluttered.

Architecture requirements:
Use strict separation of concerns. No spaghetti code. No loose files except standard root-level project files such as README, LICENSE, package files, config files, and build files.

Design the project structure professionally, for example:
- apps/editor
- apps/viewer
- packages/core
- packages/markdown-engine
- packages/editor-engine
- packages/converters
- packages/templates
- packages/theme-engine
- packages/llm
- packages/ui
- packages/platform
- packages/shared
- docs
- tests

Important architecture rules:
- UI components must not contain business logic.
- Markdown parsing/rendering must live in a dedicated module.
- File system access must live behind platform services.
- LLM support must live behind provider interfaces.
- Conversion tools must be modular and testable.
- Theme handling must be centralized.
- Templates must be data-driven.
- Every important function, class, and public API must be documented.
- Keep functions small, readable, and well-named.
- Avoid overengineering, but design for long-term maintainability.
- Add tests for parsing, rendering, conversion, templates, LLM provider interfaces, and critical UI behavior.

Platform requirements:
- Windows support is mandatory and should be built first.
- Linux support is mandatory after Windows baseline is stable.
- Avoid platform-specific assumptions unless isolated behind platform services.
- Provide installer/build pipeline for Windows first.
- Later support Linux packages such as AppImage, deb, rpm, or Flatpak if appropriate.

Recommended implementation process:
1. Research MarkText and produce a feature-parity matrix.
2. Define the product requirements document.
3. Choose the desktop stack with justification. Consider Tauri, Electron, or another suitable framework.
4. Design the architecture and directory structure before coding.
5. Build the Markdown engine and rendering pipeline.
6. Build the editor shell and core editing workflows.
7. Add templates, autocomplete, help, and Markdown insertion tools.
8. Add converter modules.
9. Add standalone viewer.
10. Add theming.
11. Add local LLM provider abstraction and first provider.
12. Add tests, docs, and Windows packaging.
13. Verify Linux compatibility.

Quality bar:
This must feel like a professional open-source desktop application, not a prototype. Prioritize correctness, clean code, testability, accessibility, keyboard support, performance, and maintainability. Any time a shortcut is tempting, choose the cleaner long-term implementation.

Deliverables:
- Product requirements document.
- MarkText parity matrix.
- Architecture document.
- Final directory structure.
- Implementation roadmap.
- Initial working Windows build.
- Automated tests.
- Developer documentation.
- User documentation.
- Theming documentation.
- Local LLM setup documentation.
```
