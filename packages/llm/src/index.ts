import { assertNotCancelled, err, ok, type CancellableOptions, type Result } from '@markforge/shared'

export type LocalLlmProviderKind = 'llama.cpp' | 'lm-studio' | 'mock' | 'ollama'

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
  model?: string
}

export const defaultPromptTemplates: PromptTemplate[] = [
  {
    id: 'summarize-selection',
    label: 'Summarize Selection',
    variables: ['selection'],
    body: 'Summarize the following Markdown selection without changing its meaning:\n\n{{selection}}'
  },
  {
    id: 'rewrite-selection',
    label: 'Rewrite Selection',
    variables: ['selection', 'tone'],
    body: 'Rewrite the following Markdown selection in a {{tone}} tone:\n\n{{selection}}'
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

function providerLabel(kind: Exclude<LocalLlmProviderKind, 'mock'>): string {
  if (kind === 'ollama') return 'Ollama'
  if (kind === 'lm-studio') return 'LM Studio'
  return 'llama.cpp'
}
