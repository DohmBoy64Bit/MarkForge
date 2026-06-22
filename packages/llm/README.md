# packages/llm

Local-first AI provider interfaces and adapters. AI is disabled by default and must never send documents to cloud providers unless explicitly configured in the future.

Current status: implemented package boundary.

## Public API

- Local-only provider interface with cancellation-aware prompt execution.
- Prompt template rendering and validation.
- Mock provider for package and future UI tests.
- Explicit unsupported adapter boundaries for Ollama, LM Studio, and llama.cpp.
- Privacy guard requiring explicit user invocation before document content is sent to a provider.

No user-facing AI workflow is enabled by this package.
