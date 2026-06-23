# Phase 9 Local LLM

Date: June 22, 2026

Phase 9 adds the first local-only AI foundation and editor workflow. It is intentionally not a cloud AI integration and not a visual clone of any MarkText surface.

## Completed

- Added `packages/llm` provider contracts, prompt templates, local action metadata, mocked provider tests, cancellation-aware generation, and explicit user-invocation privacy checks.
- Added loopback-only endpoint validation for `localhost`, `127.0.0.1`, and `::1`.
- Added Ollama `/api/generate` support.
- Added OpenAI-compatible local `/chat/completions` support for LM Studio and llama.cpp-style servers.
- Added editor Local AI UI with disabled-by-default provider enablement, provider/endpoint/model fields, action/source selection, prompt preview, result output, running/error state, and explicit insertion controls.
- Added an editor status-bar AI indicator showing off/open/running state.

## Current Actions

- Summarize document or selection.
- Improve clarity while preserving Markdown structure.
- Create an outline.
- Explain Markdown syntax.

## Privacy Boundary

- Local AI starts disabled every dialog session.
- Document text is not sent until the user presses Run.
- Current runtime adapters reject non-loopback endpoints before issuing requests.
- Cloud AI providers remain out of scope.

## Verification

- `pnpm vitest run packages/llm/src/index.spec.ts apps/editor/src/ui/localAiWorkflow.spec.ts`
- `pnpm --filter @markforge/editor build`

Screenshot evidence lives under `docs/audits/screenshots/phase-9/`.

## Still Open

- Streaming output.
- Persisted provider profiles.
- Hardware/model benchmarking guidance.
- More AI actions: draft generation, formatting fixes, structured notes, table generation, and heading suggestions.
- Dedicated end-to-end tests with a fake local provider process.
