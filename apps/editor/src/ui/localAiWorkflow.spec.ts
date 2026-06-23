import { describe, expect, it } from 'vitest'
import {
  buildLocalAiPromptPreview,
  createEditorLocalAiProvider,
  defaultEndpointForLocalAiProvider,
  labelForLocalAiProvider
} from './localAiWorkflow'

describe('localAiWorkflow', () => {
  it('builds prompt previews from selection before document text', () => {
    const preview = buildLocalAiPromptPreview(
      'summarize-document',
      '# Document\n\nLong document',
      'Selected paragraph',
      true
    )

    expect(preview).toMatchObject({
      ok: true,
      value: {
        inputLength: 'Selected paragraph'.length,
        inputSource: 'selection'
      }
    })
    expect(preview.ok && preview.value.prompt).toContain('Selected paragraph')
  })

  it('falls back to document text when selection mode has no selection', () => {
    expect(buildLocalAiPromptPreview('create-outline', '# Title', '', true)).toMatchObject({
      ok: true,
      value: {
        inputSource: 'document'
      }
    })
  })

  it('validates local provider configuration before creating adapters', () => {
    expect(createEditorLocalAiProvider('ollama', 'https://api.example.com', 'llama3.2')).toMatchObject({
      ok: false,
      error: { code: 'validation-error' }
    })
    expect(createEditorLocalAiProvider('ollama', 'http://127.0.0.1:11434', '')).toMatchObject({
      ok: false,
      error: { code: 'validation-error' }
    })
    expect(createEditorLocalAiProvider('ollama', 'http://127.0.0.1:11434', 'llama3.2')).toMatchObject({
      ok: true
    })
  })

  it('labels provider choices for compact UI controls', () => {
    expect(defaultEndpointForLocalAiProvider('lm-studio')).toBe('http://127.0.0.1:1234/v1')
    expect(labelForLocalAiProvider('llama.cpp')).toBe('llama.cpp')
  })
})
