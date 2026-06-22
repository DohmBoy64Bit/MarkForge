import { describe, expect, it } from 'vitest'
import {
  createMockLlmProvider,
  createUnsupportedLocalProvider,
  ensureExplicitUserInvocation,
  renderPromptTemplate
} from './index'

describe('@markforge/llm', () => {
  it('renders prompt templates and enforces required variables', () => {
    expect(renderPromptTemplate({
      id: 'test',
      label: 'Test',
      variables: ['selection'],
      body: 'Summarize {{selection}}'
    }, { selection: '# Title' })).toEqual({ ok: true, value: 'Summarize # Title' })

    expect(renderPromptTemplate({
      id: 'test',
      label: 'Test',
      variables: ['selection'],
      body: '{{selection}}'
    }, {})).toMatchObject({
      ok: false,
      error: { code: 'validation-error' }
    })
  })

  it('supports mock providers and explicit unsupported local adapter boundaries', async () => {
    await expect(createMockLlmProvider('done').runPrompt({ prompt: 'hello' })).resolves.toEqual({
      ok: true,
      value: { provider: 'mock', text: 'done' }
    })

    await expect(createUnsupportedLocalProvider('ollama').runPrompt({ prompt: 'hello' })).resolves.toMatchObject({
      ok: false,
      error: { code: 'not-supported' }
    })
  })

  it('guards document-content privacy behind explicit user invocation', () => {
    expect(ensureExplicitUserInvocation({ invokedByUser: false })).toMatchObject({
      ok: false,
      error: { code: 'validation-error' }
    })
    expect(ensureExplicitUserInvocation({ invokedByUser: true })).toEqual({ ok: true, value: undefined })
  })
})
