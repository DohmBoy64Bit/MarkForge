# Theming Documentation

## Goals

MarkForge themes must apply consistently to:

- Editor chrome.
- Markdown editor surface.
- Preview and viewer rendering.
- Code blocks and syntax highlighting.
- Sidebars.
- Menus and dialogs.
- Export and print output.

## Built-In Themes

Initial built-ins required by the prompt:

- Light.
- Dark.
- High contrast.
- Sepia/paper.
- GitHub-like.
- Modern neutral.

## Theme Model

Themes should be expressed as design tokens and emitted as CSS variables. Feature components consume semantic tokens, never raw color literals.

Example token groups:

- `surface.*`
- `text.*`
- `border.*`
- `accent.*`
- `editor.*`
- `markdown.*`
- `code.*`
- `sidebar.*`
- `dialog.*`
- `export.*`

## Custom Themes

Custom themes are deferred until the built-in theme system is stable. The intended extension format is JSON plus optional scoped CSS variables, validated by `packages/theme-engine`.

