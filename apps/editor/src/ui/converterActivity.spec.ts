import { describe, expect, it } from 'vitest'
import { formatConverterActivityTime, prependConverterActivity } from './converterActivity'

describe('converterActivity', () => {
  it('prepends entries and keeps the newest items within the limit', () => {
    const first = prependConverterActivity([], {
      label: 'HTML import',
      detail: 'Inserted 42 characters',
      status: 'warning'
    }, 2, 1000)
    const second = prependConverterActivity(first, {
      label: 'CSV import',
      detail: 'Inserted a table',
      status: 'success'
    }, 2, 2000)
    const third = prependConverterActivity(second, {
      label: 'HTML export',
      detail: 'Exported document',
      status: 'success'
    }, 2, 3000)

    expect(third.map(entry => entry.label)).toEqual(['HTML export', 'CSV import'])
    expect(third[0]).toMatchObject({
      detail: 'Exported document',
      id: '3000-html-export',
      status: 'success',
      timestamp: 3000
    })
  })

  it('formats timestamps as short local times', () => {
    expect(formatConverterActivityTime(new Date('2026-06-22T14:05:00').getTime())).toContain('2:05')
  })
})
