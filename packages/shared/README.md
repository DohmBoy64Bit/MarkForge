# packages/shared

Shared types, contracts, result helpers, schema utilities, and constants.

Current status: implemented package boundary.

## Public API

- `Result`, `MarkForgeError`, and helper constructors for typed package-boundary success/error values.
- Cancellation, disposable, event envelope, JSON, and storage-adapter types used by core/platform/converter/LLM contracts.
- Lightweight guards such as `isRecord`, `toError`, and `assertNotCancelled`.

This package intentionally has no app, platform, Markdown, or UI dependencies.
