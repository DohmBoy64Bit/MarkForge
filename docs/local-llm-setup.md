# Local LLM Setup

Phase 9 adds the first local-only AI foundation and editor UI. Local AI remains disabled by default until the user opens the editor Local AI dialog, enables a local provider, enters a loopback endpoint and model name, and presses Run.

## Privacy Rules

- AI features are disabled by default.
- Document or selection text is sent only after an explicit Run button press.
- Current adapters accept loopback endpoints only: `localhost`, `127.0.0.1`, or `::1`.
- Cloud provider endpoints are rejected by current validators.
- Provider adapters live in `packages/llm`; the editor calls AI through package interfaces, not direct provider SDKs.
- The editor Local AI dialog shows disabled, enabled, running, and error state.

## Current Providers

- Ollama through `/api/generate`.
- LM Studio through an OpenAI-compatible local `/chat/completions` endpoint.
- llama.cpp-compatible OpenAI-style local server.
- Additional local providers if they expose a stable local API.

## Model Selection

The UI intentionally does not hardcode a model recommendation. Choose a model installed in your local provider and enter its exact model name.

Common default endpoints:

- Ollama: `http://127.0.0.1:11434`
- LM Studio: `http://127.0.0.1:1234/v1`
- llama.cpp OpenAI-compatible server: `http://127.0.0.1:8080/v1`

## Current Actions

- Summarize document or selection.
- Improve clarity while preserving Markdown structure.
- Create an outline.
- Explain Markdown syntax.

Additional actions such as draft generation, formatting fixes, structured notes, table generation, and heading suggestions remain future prompt/action work.
