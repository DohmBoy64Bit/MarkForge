# Phase 8D Screenshot Evidence

Captured on June 22, 2026 from production Vite preview builds.

## Scope

- Editor app chrome using package-generated Sepia Paper variables.
- Editor preferences dialog showing the app-visible Light, Dark, and Sepia Paper theme controls.
- Viewer app chrome using package-generated Sepia Paper variables.
- Desktop viewport: 1440 x 1000.
- Mobile viewport: 390 x 844.

## Evidence

- `editor-desktop-sepia-theme.png`
- `editor-desktop-sepia-preferences.png`
- `editor-mobile-sepia-theme.png`
- `viewer-desktop-sepia-theme.png`
- `viewer-mobile-sepia-theme.png`

## Capture Notes

- Built with `corepack pnpm build:editor` and `corepack pnpm build:viewer`.
- Served with Vite preview on `127.0.0.1:5173` and `127.0.0.1:5174`.
- Captured through `agent-browser` after selecting the Sepia Paper control and verifying the shell `data-theme` attribute was `sepia`.
- Preview servers and browser sessions were closed after capture, and ports `5173`, `5174`, `1420`, and `1421` were verified clear.
