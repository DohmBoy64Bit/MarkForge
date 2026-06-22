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

## Phase 8D Baseline

- `packages/theme-engine` owns the built-in registry and app-facing CSS variable generation.
- Editor and viewer shell roots consume package-generated app variables.
- Light, Dark, and Sepia Paper are app-visible controls.
- Persisted app chrome preferences currently accept only the app-visible theme set.
- High contrast, GitHub-like, and modern neutral remain in the package registry and need app-surface visual validation before they are exposed.

## Custom Themes

Custom themes are deferred until the built-in theme system is stable. The intended extension format is JSON plus optional scoped CSS variables, validated by `packages/theme-engine`.
