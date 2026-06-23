# Phase 9 Local LLM Changelog

Date: June 22, 2026

Scope: local-only AI provider foundation and first editor workflow.

## Completed

- Expanded `packages/llm` from provider contracts into tested local runtime adapters.
- Added loopback-only endpoint validation before provider requests.
- Added Ollama `/api/generate` execution.
- Added OpenAI-compatible `/chat/completions` execution for LM Studio and llama.cpp-style local servers.
- Added local action metadata and execution for summarize, improve, outline, and Markdown explanation workflows.
- Added editor Local AI workflow helpers, dialog UI, status indicator, and insertion handling.
- Updated Phase 9, Local LLM, user, product, architecture, and deferred-work documentation.

## Verification

- `pnpm vitest run packages/llm/src/index.spec.ts apps/editor/src/ui/localAiWorkflow.spec.ts`
- `pnpm --filter @markforge/editor build`

## Still Deferred

- Streaming output.
- Persisted provider profiles.
- Local provider/model benchmark recommendations.
- More AI actions and UI affordances.
- Fake-provider end-to-end coverage.
