# packages/llm

Local-first AI provider interfaces and adapters. AI is disabled by default and current adapters reject non-loopback endpoints.

Current status: Phase 9 local provider foundation.

## Public API

- Local-only provider interface with cancellation-aware prompt execution.
- Prompt template rendering, local action metadata, and action execution.
- Mock provider for package and future UI tests.
- Ollama `/api/generate` adapter.
- OpenAI-compatible local `/chat/completions` adapter for LM Studio and llama.cpp-style servers.
- Explicit unsupported adapter boundary helper for future guarded surfaces.
- Loopback endpoint validation for `localhost`, `127.0.0.1`, and `::1`.
- Privacy guard requiring explicit user invocation before document content is sent to a provider.

The editor Local AI dialog consumes this package. Cloud providers are not implemented.
