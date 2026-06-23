import { assertNotCancelled, err, ok, toError, type CancellableOptions, type Result } from '@markforge/shared'

export type LocalLlmProviderKind = 'llama.cpp' | 'lm-studio' | 'mock' | 'ollama'

export type LocalLlmActionId =
  | 'create-outline'
  | 'explain-markdown'
  | 'improve-clarity'
  | 'summarize-document'

export type PromptTemplate = {
  body: string
  id: string
  label: string
  variables: string[]
}

export type LlmPromptRequest = CancellableOptions & {
  prompt: string
}

export type LlmPromptResponse = {
  provider: LocalLlmProviderKind
  text: string
}

export type LocalLlmProvider = {
  id: string
  kind: LocalLlmProviderKind
  label: string
  runPrompt(request: LlmPromptRequest): Promise<Result<LlmPromptResponse>>
}

export type LocalProviderAdapterConfig = {
  endpoint?: string
  fetch?: typeof fetch
  model?: string
}

export type LocalLlmAction = {
  description: string
  id: LocalLlmActionId
  label: string
  template: PromptTemplate
}

export type RunLlmActionRequest = CancellableOptions & {
  actionId: LocalLlmActionId
  document: string
  invokedByUser: boolean
  selection?: string
}

export const defaultPromptTemplates: PromptTemplate[] = [
  {
    id: 'summarize-document',
    label: 'Summarize Document',
    variables: ['content'],
    body: 'Summarize the following Markdown in concise bullet points. Preserve important headings and decisions.\n\n{{content}}'
  },
  {
    id: 'improve-clarity',
    label: 'Improve Clarity',
    variables: ['content'],
    body: 'Improve the clarity of the following Markdown while preserving meaning, formatting, and technical details.\n\n{{content}}'
  },
  {
    id: 'create-outline',
    label: 'Create Outline',
    variables: ['content'],
    body: 'Create a structured Markdown outline from the following content. Use nested bullets and preserve key concepts.\n\n{{content}}'
  },
  {
    id: 'explain-markdown',
    label: 'Explain Markdown',
    variables: ['content'],
    body: 'Explain the Markdown syntax and structure used in the following content. Keep the explanation practical and concise.\n\n{{content}}'
  }
]

export const localLlmActions: LocalLlmAction[] = [
  {
    id: 'summarize-document',
    label: 'Summarize',
    description: 'Summarize the active document or selection.',
    template: defaultPromptTemplates[0]
  },
  {
    id: 'improve-clarity',
    label: 'Improve',
    description: 'Rewrite for clarity while keeping Markdown structure.',
    template: defaultPromptTemplates[1]
  },
  {
    id: 'create-outline',
    label: 'Outline',
    description: 'Create a structured outline from the current text.',
    template: defaultPromptTemplates[2]
  },
  {
    id: 'explain-markdown',
    label: 'Explain',
    description: 'Explain the Markdown syntax in the current text.',
    template: defaultPromptTemplates[3]
  }
]

export function renderPromptTemplate(
  template: PromptTemplate,
  variables: Record<string, string>
): Result<string> {
  const missing = template.variables.filter(variable => !variables[variable])
  if (missing.length > 0) {
    return err('validation-error', 'Prompt template is missing required variables.', { missing })
  }

  return ok(template.body.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (placeholder, key: string) => {
    return variables[key] ?? placeholder
  }))
}

export function createMockLlmProvider(responseText: string): LocalLlmProvider {
  return {
    id: 'mock',
    kind: 'mock',
    label: 'Mock Provider',
    async runPrompt(request) {
      const cancelled = assertNotCancelled(request.signal)
      if (!cancelled.ok) return cancelled

      return ok({
        provider: 'mock',
        text: responseText
      })
    }
  }
}

export function createLocalLlmProvider(
  kind: LocalLlmProviderKind,
  config: LocalProviderAdapterConfig = {}
): LocalLlmProvider {
  if (kind === 'mock') return createMockLlmProvider('Mock local response')
  if (kind === 'ollama') return createOllamaProvider(config)
  return createOpenAiCompatibleLocalProvider(kind, config)
}

export function createOllamaProvider(config: LocalProviderAdapterConfig = {}): LocalLlmProvider {
  const endpoint = config.endpoint ?? 'http://127.0.0.1:11434'

  return {
    id: 'ollama',
    kind: 'ollama',
    label: 'Ollama',
    async runPrompt(request) {
      const ready = validateLocalAdapterRequest(endpoint, config.model, request.signal)
      if (!ready.ok) return ready

      try {
        const response = await resolveFetch(config.fetch)(`${trimTrailingSlash(endpoint)}/api/generate`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            model: config.model,
            prompt: request.prompt,
            stream: false
          }),
          signal: request.signal
        })

        if (!response.ok) {
          return err('provider-error', `Ollama returned HTTP ${response.status}.`)
        }

        const body = await response.json() as { response?: unknown }
        if (typeof body.response !== 'string') {
          return err('provider-error', 'Ollama response did not include text output.')
        }

        return ok({ provider: 'ollama', text: body.response })
      } catch (error) {
        const markForgeError = toError(error, 'Ollama request failed.')
        return { ok: false, error: markForgeError }
      }
    }
  }
}

export function createOpenAiCompatibleLocalProvider(
  kind: Exclude<LocalLlmProviderKind, 'mock' | 'ollama'>,
  config: LocalProviderAdapterConfig = {}
): LocalLlmProvider {
  const endpoint = config.endpoint ?? (kind === 'lm-studio' ? 'http://127.0.0.1:1234/v1' : 'http://127.0.0.1:8080/v1')
  const label = providerLabel(kind)

  return {
    id: kind,
    kind,
    label,
    async runPrompt(request) {
      const ready = validateLocalAdapterRequest(endpoint, config.model, request.signal)
      if (!ready.ok) return ready

      try {
        const response = await resolveFetch(config.fetch)(`${trimTrailingSlash(endpoint)}/chat/completions`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            model: config.model,
            messages: [{ role: 'user', content: request.prompt }],
            stream: false
          }),
          signal: request.signal
        })

        if (!response.ok) {
          return err('provider-error', `${label} returned HTTP ${response.status}.`)
        }

        const body = await response.json() as {
          choices?: Array<{ message?: { content?: unknown }; text?: unknown }>
        }
        const text = body.choices?.[0]?.message?.content ?? body.choices?.[0]?.text
        if (typeof text !== 'string') {
          return err('provider-error', `${label} response did not include text output.`)
        }

        return ok({ provider: kind, text })
      } catch (error) {
        const markForgeError = toError(error, `${label} request failed.`)
        return { ok: false, error: markForgeError }
      }
    }
  }
}

export function createUnsupportedLocalProvider(
  kind: Exclude<LocalLlmProviderKind, 'mock'>,
  config: LocalProviderAdapterConfig = {}
): LocalLlmProvider {
  return {
    id: kind,
    kind,
    label: providerLabel(kind),
    async runPrompt(request) {
      const cancelled = assertNotCancelled(request.signal)
      if (!cancelled.ok) return cancelled

      return err('not-supported', `${providerLabel(kind)} is a documented local-only adapter boundary, but no HTTP/runtime adapter is implemented yet.`, {
        endpointConfigured: Boolean(config.endpoint),
        modelConfigured: Boolean(config.model)
      })
    }
  }
}

export function ensureExplicitUserInvocation(value: { invokedByUser: boolean }): Result<void> {
  return value.invokedByUser
    ? ok(undefined)
    : err('validation-error', 'Document content cannot be sent to an LLM provider without an explicit user action.')
}

export async function runLlmAction(
  provider: LocalLlmProvider,
  request: RunLlmActionRequest
): Promise<Result<LlmPromptResponse>> {
  const explicit = ensureExplicitUserInvocation(request)
  if (!explicit.ok) return explicit

  const action = localLlmActions.find(item => item.id === request.actionId)
  if (!action) return err('validation-error', 'Unknown local LLM action.', { actionId: request.actionId })

  const content = request.selection?.trim() || request.document.trim()
  if (!content) return err('invalid-input', 'Local LLM actions require document or selection text.')

  const rendered = renderPromptTemplate(action.template, { content })
  if (!rendered.ok) return rendered

  return provider.runPrompt({ prompt: rendered.value, signal: request.signal })
}

export function isLocalEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint)
    const hostname = url.hostname.toLowerCase()
    return (url.protocol === 'http:' || url.protocol === 'https:') &&
      (hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname === '[::1]')
  } catch {
    return false
  }
}

function providerLabel(kind: Exclude<LocalLlmProviderKind, 'mock'>): string {
  if (kind === 'ollama') return 'Ollama'
  if (kind === 'lm-studio') return 'LM Studio'
  return 'llama.cpp'
}

function validateLocalAdapterRequest(endpoint: string, model: string | undefined, signal?: AbortSignal): Result<void> {
  const cancelled = assertNotCancelled(signal)
  if (!cancelled.ok) return cancelled
  if (!isLocalEndpoint(endpoint)) {
    return err('validation-error', 'Local LLM adapters only accept loopback HTTP endpoints.', { endpoint })
  }
  if (!model?.trim()) {
    return err('validation-error', 'A local model name is required before running an LLM action.')
  }

  return ok(undefined)
}

function resolveFetch(fetchImpl: typeof fetch | undefined): typeof fetch {
  if (fetchImpl) return fetchImpl
  if (typeof fetch === 'function') return fetch
  throw new TypeError('Fetch is not available in this runtime.')
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}
