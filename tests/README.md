# tests

Cross-package integration, fixture, and end-to-end tests belong here.

Current package and app unit tests live beside the code they cover, such as `packages/markdown-engine/src/index.spec.ts` and `packages/editor-engine/src/editingTransforms.spec.ts`.

Run `pnpm test:e2e:ui` for the browser-preview UI audit. It builds the editor and viewer, starts local Vite previews, exercises the labelled browser-safe UI surface with Playwright, and regenerates screenshot evidence in `docs/audits/screenshots/e2e-editor-ui/`.
