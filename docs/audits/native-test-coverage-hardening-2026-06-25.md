# Native Test Coverage Hardening - 2026-06-25

## Scope

This pass adds the missing non-Playwright coverage layers for MarkForge's Tauri boundary. Existing Playwright browser-preview tests remain unchanged and continue to cover broad browser-safe UI workflows.

## Added Coverage

- `@tauri-apps/api/mocks` Vitest coverage for editor and viewer Tauri platform adapters.
- Root `pnpm cargo:test` runner for both Tauri crates.
- Rust backend command tests for editor and viewer filesystem, workspace, search, extension guard, and metadata behavior.
- WebdriverIO plus `tauri-driver` real-app smoke tests for editor and viewer.
- Root scripts:
  - `pnpm cargo:test`
  - `pnpm test:tauri:smoke`
  - `pnpm test:tauri:smoke:editor`
  - `pnpm test:tauri:smoke:viewer`

## What This Proves

- Vitest with Tauri mocks proves frontend adapter wiring to custom commands, plugin dialogs, clipboard calls, native watcher events, print, shell recent-document, and Tauri metadata detection.
- `cargo test` proves backend command behavior without booting the full desktop runtime.
- WebdriverIO with `tauri-driver` proves the debug Tauri applications launch in the native WebView and can execute real IPC commands against the backend.

## Deliberate Boundary

The existing Playwright browser-preview tests were not edited in this pass. Playwright remains the broad UI confidence layer, while `tauri-driver` is reserved for smoke coverage of native WebView, IPC, filesystem command, and Tauri metadata behavior.

## Evidence

- `pnpm test`: 23 test files, 177 tests passed.
- `pnpm cargo:test`: editor 5 tests passed, viewer 6 tests passed.
- `pnpm test:tauri:smoke`: editor 2 WebdriverIO tests passed, viewer 2 WebdriverIO tests passed.
- `pnpm docs:check`: documentation validation passed after docs updates.
