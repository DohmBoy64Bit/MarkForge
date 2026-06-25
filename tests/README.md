# tests

Cross-package integration, fixture, and end-to-end tests belong here.

Current package and app unit tests live beside the code they cover, such as `packages/markdown-engine/src/index.spec.ts` and `packages/editor-engine/src/editingTransforms.spec.ts`.

Run `pnpm test` for package/app unit tests. This includes `@tauri-apps/api/mocks` coverage for the editor and viewer Tauri platform adapters, including custom invoke calls, plugin dialog/clipboard calls, native watch event wiring, print, shell recent-document, and Tauri window metadata detection.

Run `pnpm cargo:test` for Rust backend command tests in both Tauri crates. It covers editor and viewer filesystem commands, workspace listing/search, extension guards, missing-file metadata, and viewer HTML export write constraints.

Run `pnpm test:e2e:ui` for the browser-preview UI audit. It builds the editor and viewer, starts local Vite previews, exercises the labelled browser-safe UI surface with Playwright, and regenerates screenshot evidence in `docs/audits/screenshots/e2e-editor-ui/`.

Run `pnpm test:e2e:viewer` for the dedicated viewer UI audit. It builds the viewer, starts a Vite preview, exercises every visible viewer control surface that is safe in browser preview, checks desktop/tablet/mobile overflow, and regenerates screenshot evidence in `docs/audits/screenshots/e2e-viewer-ui/`.

Run `pnpm test:tauri:smoke` for the real-app smoke layer. It builds debug editor and viewer Tauri apps, starts `tauri-driver`, drives the WebView with WebdriverIO, and proves real Tauri metadata plus native IPC command paths. Use `pnpm test:tauri:smoke:editor` or `pnpm test:tauri:smoke:viewer` for one app at a time.
