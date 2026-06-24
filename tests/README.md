# tests

Cross-package integration, fixture, and end-to-end tests belong here.

Current package and app unit tests live beside the code they cover, such as `packages/markdown-engine/src/index.spec.ts` and `packages/editor-engine/src/editingTransforms.spec.ts`.

Run `pnpm test:e2e:editor` for the editor browser E2E audit. It builds the editor, starts a local Vite preview, exercises the labelled UI surface with Playwright, and writes screenshot evidence to `docs/audits/screenshots/e2e-editor-ui/`.
