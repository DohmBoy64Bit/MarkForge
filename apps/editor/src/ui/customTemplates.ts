import { normalizeCustomTemplate, type MarkdownTemplate, type NormalizeCustomTemplateInput } from '@markforge/editor-engine'

export const customTemplatesStorageKey = 'markforge.editor.customTemplates.v1'

export type CustomTemplateSaveResult =
  | { errors: string[]; templates: MarkdownTemplate[]; template: null }
  | { errors: []; templates: MarkdownTemplate[]; template: MarkdownTemplate }

type StorageLike = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>

export function loadCustomTemplates(storage: StorageLike = window.localStorage): MarkdownTemplate[] {
  try {
    const raw = storage.getItem(customTemplatesStorageKey)
    const parsed = raw ? JSON.parse(raw) : []

    if (!Array.isArray(parsed)) return []

    return parsed.flatMap(item => {
      const result = normalizeCustomTemplate(item)
      return result.template ? [result.template] : []
    })
  } catch {
    return []
  }
}

export function saveCustomTemplates(
  templates: MarkdownTemplate[],
  storage: StorageLike = window.localStorage
): MarkdownTemplate[] {
  storage.setItem(customTemplatesStorageKey, JSON.stringify(templates))
  return templates
}

export function upsertCustomTemplate(
  input: NormalizeCustomTemplateInput,
  existingTemplates: MarkdownTemplate[],
  storage: StorageLike = window.localStorage
): CustomTemplateSaveResult {
  const result = normalizeCustomTemplate(input)

  if (!result.template) {
    return {
      errors: result.errors,
      template: null,
      templates: existingTemplates
    }
  }

  const nextTemplates = [
    result.template,
    ...existingTemplates.filter(template => template.id !== result.template.id)
  ]

  saveCustomTemplates(nextTemplates, storage)

  return {
    errors: [],
    template: result.template,
    templates: nextTemplates
  }
}

export function deleteCustomTemplate(
  id: string,
  existingTemplates: MarkdownTemplate[],
  storage: StorageLike = window.localStorage
): MarkdownTemplate[] {
  return saveCustomTemplates(existingTemplates.filter(template => template.id !== id), storage)
}

export function resetCustomTemplates(storage: StorageLike = window.localStorage): MarkdownTemplate[] {
  storage.removeItem(customTemplatesStorageKey)
  return []
}
