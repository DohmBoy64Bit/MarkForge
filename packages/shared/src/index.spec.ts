import { describe, expect, it } from 'vitest'
import { assertNotCancelled, createEvent, err, isRecord, ok, toError } from './index'

describe('@markforge/shared', () => {
  it('creates typed success and failure results', () => {
    expect(ok('ready')).toEqual({ ok: true, value: 'ready' })
    expect(err('not-supported', 'No converter')).toEqual({
      ok: false,
      error: {
        code: 'not-supported',
        message: 'No converter',
        details: undefined
      }
    })
  })

  it('normalizes cancellation and unexpected errors', () => {
    const controller = new AbortController()
    controller.abort()

    expect(assertNotCancelled(controller.signal)).toMatchObject({
      ok: false,
      error: { code: 'cancelled' }
    })
    expect(toError(new Error('boom'))).toMatchObject({
      code: 'provider-error',
      message: 'boom'
    })
  })

  it('exposes shared record and event helpers', () => {
    expect(isRecord({ value: true })).toBe(true)
    expect(isRecord(['nope'])).toBe(false)
    expect(createEvent('file.changed', { path: 'a.md' }, 10)).toEqual({
      type: 'file.changed',
      payload: { path: 'a.md' },
      timestamp: 10
    })
  })
})
