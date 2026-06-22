import { describe, expect, it } from 'vitest'
import {
  customTemplatesStorageKey,
  deleteCustomTemplate,
  loadCustomTemplates,
  resetCustomTemplates,
  upsertCustomTemplate
} from './customTemplates'

describe('custom template storage helpers', () => {
  it('creates and persists normalized custom templates', () => {
    const storage = createMemoryStorage()
    const result = upsertCustomTemplate({
      title: 'Release Checklist',
      category: 'release',
      tags: 'ship, verify',
      body: '# {{version}}\n- [ ] Smoke test'
    }, [], storage)

    expect(result.errors).toEqual([])
    expect(result.template?.id).toBe('custom-release-checklist')
    expect(loadCustomTemplates(storage).map(template => template.title)).toEqual(['Release Checklist'])
    expect(JSON.parse(storage.getItem(customTemplatesStorageKey) ?? '[]')).toHaveLength(1)
  })

  it('returns validation errors without touching existing templates', () => {
    const storage = createMemoryStorage()
    const existing = loadCustomTemplates(storage)
    const result = upsertCustomTemplate({ title: '', body: '' }, existing, storage)

    expect(result.template).toBeNull()
    expect(result.templates).toBe(existing)
    expect(result.errors).toContain('Title is required.')
    expect(storage.getItem(customTemplatesStorageKey)).toBeNull()
  })

  it('deletes and resets local custom templates', () => {
    const storage = createMemoryStorage()
    const first = upsertCustomTemplate({
      title: 'Runbook',
      category: 'engineering',
      body: '# Runbook'
    }, [], storage)

    expect(deleteCustomTemplate(first.template!.id, first.templates, storage)).toEqual([])
    expect(loadCustomTemplates(storage)).toEqual([])

    upsertCustomTemplate({ title: 'Notes', category: 'collaboration', body: '# Notes' }, [], storage)
    expect(resetCustomTemplates(storage)).toEqual([])
    expect(storage.getItem(customTemplatesStorageKey)).toBeNull()
  })
})

function createMemoryStorage(): Pick<Storage, 'getItem' | 'removeItem' | 'setItem'> {
  const values = new Map<string, string>()

  return {
    getItem: key => values.get(key) ?? null,
    removeItem: key => {
      values.delete(key)
    },
    setItem: (key, value) => {
      values.set(key, value)
    }
  }
}
