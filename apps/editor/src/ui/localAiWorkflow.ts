import {
  createLocalLlmProvider,
  isLocalEndpoint,
  localLlmActions,
  renderPromptTemplate,
  type LocalLlmActionId,
  type LocalLlmProvider,
  type LocalLlmProviderKind
} from '@markforge/llm'
import { err, ok, type Result } from '@markforge/shared'

export type EditorLocalAiProviderKind = Exclude<LocalLlmProviderKind, 'mock'>

export type LocalAiPromptPreview = {
  inputLength: number
  inputSource: 'document' | 'selection'
  prompt: string
}

export const editorLocalAiProviderKinds: EditorLocalAiProviderKind[] = ['ollama', 'lm-studio', 'llama.cpp']

export function defaultEndpointForLocalAiProvider(kind: EditorLocalAiProviderKind): string {
  if (kind === 'ollama') return 'http://127.0.0.1:11434'
  if (kind === 'lm-studio') return 'http://127.0.0.1:1234/v1'
  return 'http://127.0.0.1:8080/v1'
}

export function labelForLocalAiProvider(kind: EditorLocalAiProviderKind): string {
  if (kind === 'ollama') return 'Ollama'
  if (kind === 'lm-studio') return 'LM Studio'
  return 'llama.cpp'
}

export function createEditorLocalAiProvider(
  kind: EditorLocalAiProviderKind,
  endpoint: string,
  model: string
): Result<LocalLlmProvider> {
  const normalizedEndpoint = endpoint.trim()
  const normalizedModel = model.trim()

  if (!normalizedEndpoint || !isLocalEndpoint(normalizedEndpoint)) {
    return err('validation-error', 'Use a loopback endpoint such as http://127.0.0.1:11434.')
  }

  if (!normalizedModel) {
    return err('validation-error', 'Choose a local model before running Local AI.')
  }

  return ok(createLocalLlmProvider(kind, {
    endpoint: normalizedEndpoint,
    model: normalizedModel
  }))
}

export function buildLocalAiPromptPreview(
  actionId: LocalLlmActionId,
  documentText: string,
  selectionText: string,
  useSelection: boolean
): Result<LocalAiPromptPreview> {
  const action = localLlmActions.find(item => item.id === actionId)
  if (!action) return err('validation-error', 'Unknown Local AI action.', { actionId })

  const selection = selectionText.trim()
  const document = documentText.trim()
  const content = useSelection && selection ? selection : document

  if (!content) {
    return err('invalid-input', 'Local AI needs document or selection text.')
  }

  const rendered = renderPromptTemplate(action.template, { content })
  if (!rendered.ok) return rendered

  return ok({
    inputLength: content.length,
    inputSource: useSelection && selection ? 'selection' : 'document',
    prompt: rendered.value
  })
}
