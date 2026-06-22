import { describe, expect, it, vi } from 'vitest'
import {
  converterCanHandle,
  createBrowserPrintConverter,
  createCsvToMarkdownTableConverter,
  createHtmlConverter,
  createHtmlToMarkdownConverter,
  createMarkdownCleanupConverter,
  createPhase7AConverters
} from './index'

describe('@markforge/converters', () => {
  it('converts Markdown to sanitized standalone HTML', async () => {
    const converter = createHtmlConverter()
    const result = await converter.convert({
      format: 'html',
      markdown: '# Export\n\n<script>alert(1)</script>',
      title: 'Export & Review'
    })

    expect(result.ok).toBe(true)
    expect(result.ok && result.value.html).toContain('<title>Export &amp; Review</title>')
    expect(result.ok && result.value.html).toContain('<h1 id="heading-export">Export</h1>')
    expect(result.ok && result.value.html).not.toContain('<script>')
    expect(converterCanHandle(converter, 'html')).toBe(true)
  })

  it('delegates browser print without claiming native PDF export', async () => {
    const print = vi.fn()
    const converter = createBrowserPrintConverter(print)
    const result = await converter.convert({ format: 'browser-print', markdown: '# Print' })

    expect(print).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({
      ok: true,
      value: {
        format: 'browser-print',
        warnings: [{ code: 'host-print-required' }]
      }
    })
  })

  it('converts common HTML structure to Markdown while dropping unsafe nodes', async () => {
    const converter = createHtmlToMarkdownConverter()
    const result = await converter.convert({
      format: 'html-to-markdown',
      html: '<h1>Title</h1><p>Hello <strong>writer</strong>.</p><script>alert(1)</script><ul><li>One</li></ul>'
    })

    expect(result.ok).toBe(true)
    expect(result.ok && result.value.markdown).toContain('# Title')
    expect(result.ok && result.value.markdown).toContain('Hello **writer**.')
    expect(result.ok && result.value.markdown).toMatch(/-\s+One/)
    expect(result.ok && result.value.markdown).not.toContain('alert')
    expect(result.ok && result.value.warnings).toEqual([{ code: 'lossy-conversion', message: expect.any(String) }])
  })

  it('converts CSV rows to a Markdown table with escaped pipes and ragged-row warnings', async () => {
    const converter = createCsvToMarkdownTableConverter()
    const result = await converter.convert({
      format: 'csv-to-markdown-table',
      csv: 'Name,Notes\nAda,"uses | pipes"\nGrace'
    })

    expect(result.ok).toBe(true)
    expect(result.ok && result.value.markdown).toBe([
      '| Name | Notes |',
      '| --- | --- |',
      '| Ada | uses \\| pipes |',
      '| Grace |  |',
      ''
    ].join('\n'))
    expect(result.ok && result.value.warnings).toEqual([{ code: 'lossy-conversion', message: expect.any(String) }])
  })

  it('normalizes Markdown whitespace without changing semantic text', async () => {
    const converter = createMarkdownCleanupConverter()
    const result = await converter.convert({
      format: 'markdown-cleanup',
      markdown: '# Title  \r\n\r\n\r\nBody\t'
    })

    expect(result).toEqual({
      ok: true,
      value: {
        format: 'markdown-cleanup',
        markdown: '# Title\n\nBody\n',
        warnings: [{ code: 'normalized-markdown', message: 'Whitespace and trailing blank lines were normalized.' }]
      }
    })
  })

  it('exposes unsupported heavier Phase 7A capabilities without claiming support', async () => {
    const converters = createPhase7AConverters()
    const pdfConverter = converters.find(converter => converter.metadata.id === 'pdf-to-markdown')

    expect(pdfConverter).toBeDefined()
    expect(pdfConverter && converterCanHandle(pdfConverter, 'pdf-to-markdown')).toBe(false)
    await expect(pdfConverter?.convert({ format: 'pdf-to-markdown' })).resolves.toMatchObject({
      ok: false,
      error: { code: 'not-supported' }
    })
  })
})
