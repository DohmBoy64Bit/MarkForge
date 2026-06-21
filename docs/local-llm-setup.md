# Local LLM Setup

Local AI assistance is planned but not implemented.

## Privacy Rules

- AI features are disabled by default.
- Documents never leave the local machine unless a future cloud provider is explicitly configured by the user.
- Provider adapters live in `packages/llm`.
- The editor calls AI through service interfaces, not direct provider SDKs.
- The UI must clearly indicate when AI is being used.

## Planned Providers

- Ollama.
- llama.cpp-compatible server.
- LM Studio.
- Additional local providers if they expose a stable local API.

## Model Selection

The first recommended local model must be selected during implementation using current benchmarks, licensing, quality, RAM/VRAM constraints, and Windows availability. Do not hardcode a model recommendation in advance.

## Planned Actions

- Generate Markdown draft.
- Summarize document.
- Improve clarity.
- Fix Markdown formatting.
- Create outline.
- Convert rough notes to structured Markdown.
- Generate tables.
- Suggest headings.
- Explain Markdown syntax.

