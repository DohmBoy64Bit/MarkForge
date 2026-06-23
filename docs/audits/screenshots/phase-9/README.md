# Phase 9 Screenshot Evidence

Date: June 22, 2026

Scope: editor Local AI dialog after Phase 9 implementation.

## Captures

- `editor-desktop-local-ai.png`: desktop viewport, Local AI dialog open, disabled-by-default state, local endpoint/model controls, prompt/result panes, AI status badge.
- `editor-mobile-local-ai.png`: mobile viewport, Local AI dialog open, stacked controls, privacy copy, prompt preview, disabled Run footer.

## Validation Notes

- Local AI is visible as a compact toolbar action and status-bar badge.
- Provider enablement starts disabled.
- Endpoint defaults to a loopback address.
- Run is disabled until a provider is enabled and a model name is supplied.
- Mobile layout stacks controls without incoherent overlap.

## Commands

- `pnpm --filter @markforge/editor dev`
- `agent-browser --session markforge-phase9 open http://127.0.0.1:1420/`
- `agent-browser --session markforge-phase9 set viewport 1440 960`
- `agent-browser --session markforge-phase9 screenshot docs/audits/screenshots/phase-9/editor-desktop-local-ai.png`
- `agent-browser --session markforge-phase9 set viewport 390 844`
- `agent-browser --session markforge-phase9 screenshot docs/audits/screenshots/phase-9/editor-mobile-local-ai.png`
