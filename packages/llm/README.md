# packages/llm

Local-first AI provider interfaces and adapters. AI is disabled by default and current adapters reject non-loopback endpoints.

Current status: local provider foundation plus streaming/profile helpers.

## Public API

- Local-only provider interface with cancellation-aware prompt execution and optional streaming.
- Prompt template rendering, local action metadata, action execution, and streaming action execution.
- Mock provider for package and future UI tests.
- Ollama `/api/generate` adapter with newline JSON streaming support.
- OpenAI-compatible local `/chat/completions` adapter for LM Studio and llama.cpp-style servers with SSE-style streaming support.
- Persistable local provider profile helpers for Ollama, LM Studio, and llama.cpp endpoints/models.
- Broader local actions: summarize, improve, outline, explain, format, draft, table generation, and heading suggestions.
- Explicit unsupported adapter boundary helper for future guarded surfaces.
- Loopback endpoint validation for `localhost`, `127.0.0.1`, and `::1`.
- Privacy guard requiring explicit user invocation before document content is sent to a provider.

The editor Local AI dialog consumes this package, stores local provider profiles in app-local storage, and displays streamed output when a provider supports it. Cloud providers are not implemented.
