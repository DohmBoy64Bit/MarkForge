import { describe, expect, it, vi } from 'vitest'
import {
  createLocalLlmProvider,
  createMockLlmProvider,
  createOllamaProvider,
  createOpenAiCompatibleLocalProvider,
  createUnsupportedLocalProvider,
  ensureExplicitUserInvocation,
  isLocalEndpoint,
  runLlmAction,
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

  it('builds local-only HTTP adapters for Ollama and OpenAI-compatible providers', async () => {
    const ollamaFetch = viFetch({ response: 'local summary' })
    await expect(createOllamaProvider({
      endpoint: 'http://127.0.0.1:11434',
      fetch: ollamaFetch,
      model: 'llama3.2'
    }).runPrompt({ prompt: 'hello' })).resolves.toEqual({
      ok: true,
      value: { provider: 'ollama', text: 'local summary' }
    })
    expect(ollamaFetch).toHaveBeenCalledWith('http://127.0.0.1:11434/api/generate', expect.objectContaining({
      method: 'POST'
    }))

    const lmStudioFetch = viFetch({ choices: [{ message: { content: 'local rewrite' } }] })
    await expect(createOpenAiCompatibleLocalProvider('lm-studio', {
      endpoint: 'http://localhost:1234/v1',
      fetch: lmStudioFetch,
      model: 'local-model'
    }).runPrompt({ prompt: 'rewrite' })).resolves.toEqual({
      ok: true,
      value: { provider: 'lm-studio', text: 'local rewrite' }
    })
    expect(lmStudioFetch).toHaveBeenCalledWith('http://localhost:1234/v1/chat/completions', expect.any(Object))
  })

  it('rejects non-local endpoints and missing models before provider calls', async () => {
    const fetchMock = viFetch({ response: 'nope' })

    await expect(createOllamaProvider({
      endpoint: 'https://api.example.com',
      fetch: fetchMock,
      model: 'llama3.2'
    }).runPrompt({ prompt: 'hello' })).resolves.toMatchObject({
      ok: false,
      error: { code: 'validation-error' }
    })

    await expect(createLocalLlmProvider('ollama', {
      endpoint: 'http://127.0.0.1:11434',
      fetch: fetchMock
    }).runPrompt({ prompt: 'hello' })).resolves.toMatchObject({
      ok: false,
      error: { code: 'validation-error' }
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('guards document-content privacy behind explicit user invocation', () => {
    expect(ensureExplicitUserInvocation({ invokedByUser: false })).toMatchObject({
      ok: false,
      error: { code: 'validation-error' }
    })
    expect(ensureExplicitUserInvocation({ invokedByUser: true })).toEqual({ ok: true, value: undefined })
  })

  it('runs local LLM actions only after explicit user invocation', async () => {
    const provider = createMockLlmProvider('outline')

    await expect(runLlmAction(provider, {
      actionId: 'create-outline',
      document: '# Title',
      invokedByUser: true
    })).resolves.toEqual({
      ok: true,
      value: { provider: 'mock', text: 'outline' }
    })

    await expect(runLlmAction(provider, {
      actionId: 'summarize-document',
      document: '# Title',
      invokedByUser: false
    })).resolves.toMatchObject({
      ok: false,
      error: { code: 'validation-error' }
    })
  })

  it('recognizes loopback endpoints only', () => {
    expect(isLocalEndpoint('http://127.0.0.1:11434')).toBe(true)
    expect(isLocalEndpoint('http://localhost:1234/v1')).toBe(true)
    expect(isLocalEndpoint('https://example.com')).toBe(false)
    expect(isLocalEndpoint('not-a-url')).toBe(false)
  })
})

function viFetch(body: unknown) {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => body
  } as Response))
}
