# User Documentation

MarkForge is not yet ready for end users. This document tracks the planned user-facing documentation set.

## Planned Guides

- Getting started.
- Opening files and folders.
- Editing Markdown.
- Source, preview, and split modes.
- Focus, typewriter, and distraction-free modes.
- Markdown syntax reference. Phase 6A includes an in-app reference for headings, emphasis, links, lists, task lists, code fences, tables, front matter, math, diagrams, and raw HTML sanitization.
- Templates. Phase 6B includes README, meeting notes, changelog, project spec, blog post, GitHub issue, pull request, and technical docs templates with guided variables, local custom templates, and `/template` or `/tpl` source suggestions.
- Convert to Markdown.
- Export to HTML, PDF, and DOCX.
- Standalone viewer.
- Themes.
- Keyboard shortcuts.
- Local AI setup and privacy.
- Troubleshooting Windows install and file access.
- Linux installation and packaging notes.

## Current In-App Help

In the editor, open **Templates and Help** from the toolbar or the default `Ctrl+Alt+T` shortcut. The Built-ins tab searches the catalog, exposes variable fields for the active template, previews the resolved Markdown live, and inserts at the current source cursor or selection. The Custom tab stores local templates in this browser profile with create, delete, and reset controls. The Reference tab is a concise syntax sheet for the Markdown features currently supported by MarkForge.

In source mode, start a line with `/template` or `/tpl` to open the first template suggestion menu. Type after the trigger to filter, use Arrow keys to navigate, Enter to insert, or Escape to close. This is intentionally limited to template insertion; general Markdown autocomplete remains future scope.

## Privacy Promise

MarkForge is local-first. Local AI assistance will be disabled until configured by the user. User documents will not be sent to cloud APIs unless a future cloud provider is explicitly added and configured by the user.
