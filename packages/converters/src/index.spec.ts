import { describe, expect, it, vi } from 'vitest'
import {
  conversionWarningStatus,
  converterCanHandle,
  createBrowserPrintConverter,
  createCsvToMarkdownTableConverter,
  createDefaultConverters,
  createDocxToMarkdownConverter,
  createHtmlConverter,
  createHtmlToMarkdownConverter,
  createMarkdownCleanupConverter,
  createMarkdownToDocxConverter,
  createMarkdownToPdfConverter,
  createOcrToMarkdownConverter,
  createPdfToMarkdownConverter,
  createPhase7AConverters,
  createRichClipboardToMarkdownConverter,
  createUrlToMarkdownConverter,
  defaultHtmlExportPath
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

  it('applies HTML export settings for generated metadata and table of contents', async () => {
    const converter = createHtmlConverter()
    const result = await converter.convert({
      exportSettings: {
        bodyClass: 'export-profile',
        includeGeneratedMeta: true,
        includeTableOfContents: true,
        stylesheet: 'body { color: red; }',
        title: 'Configured Export'
      },
      format: 'html',
      markdown: '# Title\n\n## Child'
    })

    expect(result.ok).toBe(true)
    expect(result.ok && result.value.html).toContain('<meta name="generator" content="MarkForge">')
    expect(result.ok && result.value.html).toContain('<nav aria-label="Table of contents">')
    expect(result.ok && result.value.html).toContain('<style>body { color: red; }</style>')
    expect(result.ok && result.value.html).toContain('<body class="export-profile">')
    expect(result.ok && result.value.html).toContain('<title>Configured Export</title>')
    expect(result.ok && result.value.warnings).toEqual([{ code: 'export-settings-applied', message: expect.any(String) }])
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

  it('converts rich clipboard HTML through its own supported capability', async () => {
    const converter = createRichClipboardToMarkdownConverter()
    const result = await converter.convert({
      format: 'rich-clipboard-to-markdown',
      html: '<section><h2>Copied</h2><p><em>rich</em> text</p></section>'
    })

    expect(converterCanHandle(converter, 'rich-clipboard-to-markdown')).toBe(true)
    expect(result.ok).toBe(true)
    expect(result.ok && result.value.markdown).toContain('## Copied')
    expect(result.ok && result.value.markdown).toContain('_rich_ text')
  })

  it('fetches URL HTML and converts it to Markdown with trust warnings', async () => {
    const converter = createUrlToMarkdownConverter(async () => '<article><h1>Remote</h1><p>Fetched body.</p></article>')
    const result = await converter.convert({
      format: 'url-to-markdown',
      url: 'https://example.com/post'
    })

    expect(converterCanHandle(converter, 'url-to-markdown')).toBe(true)
    expect(result.ok).toBe(true)
    expect(result.ok && result.value.markdown).toContain('# Remote')
    expect(result.ok && result.value.warnings.map(warning => warning.code)).toEqual(['network-fetch', 'lossy-conversion'])
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

  it('converts DOCX HTML extraction output to Markdown with lossiness warnings', async () => {
    const converter = createDocxToMarkdownConverter(async () => '<h1>Doc</h1><p><strong>Body</strong></p>')
    const result = await converter.convert({
      data: new Uint8Array([1, 2, 3]),
      format: 'docx-to-markdown'
    })

    expect(converterCanHandle(converter, 'docx-to-markdown')).toBe(true)
    expect(result.ok).toBe(true)
    expect(result.ok && result.value.markdown).toContain('# Doc')
    expect(result.ok && result.value.markdown).toContain('**Body**')
    expect(result.ok && result.value.warnings).toEqual([{ code: 'lossy-conversion', message: expect.any(String) }])
  })

  it('converts extracted PDF text to Markdown text with extraction warnings', async () => {
    const converter = createPdfToMarkdownConverter(async () => 'Page one\n\nPage two')
    const result = await converter.convert({
      data: new Uint8Array([37, 80, 68, 70]),
      format: 'pdf-to-markdown'
    })

    expect(converterCanHandle(converter, 'pdf-to-markdown')).toBe(true)
    expect(result).toEqual({
      ok: true,
      value: {
        format: 'pdf-to-markdown',
        markdown: 'Page one\n\nPage two\n',
        warnings: [{ code: 'extracted-text', message: expect.any(String) }]
      }
    })
  })

  it('converts OCR output to Markdown text with recognition warnings', async () => {
    const converter = createOcrToMarkdownConverter(async () => 'Scanned heading\n\nScanned body')
    const result = await converter.convert({
      data: new Uint8Array([137, 80, 78, 71]),
      format: 'ocr-to-markdown'
    })

    expect(converterCanHandle(converter, 'ocr-to-markdown')).toBe(true)
    expect(result.ok).toBe(true)
    expect(result.ok && result.value.markdown).toBe('Scanned heading\n\nScanned body\n')
    expect(result.ok && result.value.warnings).toEqual([{ code: 'extracted-text', message: expect.any(String) }])
  })

  it('exports Markdown to PDF binary output', async () => {
    const expected = new Uint8Array([1, 2, 3]).buffer
    const converter = createMarkdownToPdfConverter(async (markdown, title) => {
      expect(markdown).toBe('# Export')
      expect(title).toBe('PDF Title')
      return expected
    })
    const result = await converter.convert({
      format: 'markdown-to-pdf',
      markdown: '# Export',
      title: 'PDF Title'
    })

    expect(converterCanHandle(converter, 'markdown-to-pdf')).toBe(true)
    expect(result).toEqual({
      ok: true,
      value: {
        data: expected,
        format: 'markdown-to-pdf',
        mimeType: 'application/pdf',
        warnings: []
      }
    })
  })

  it('exports Markdown to DOCX binary output with simplification warning', async () => {
    const expected = new Uint8Array([4, 5, 6]).buffer
    const converter = createMarkdownToDocxConverter(async () => expected)
    const result = await converter.convert({
      format: 'markdown-to-docx',
      markdown: '# Export',
      title: 'DOCX Title'
    })

    expect(converterCanHandle(converter, 'markdown-to-docx')).toBe(true)
    expect(result.ok).toBe(true)
    expect(result.ok && result.value).toMatchObject({
      data: expected,
      format: 'markdown-to-docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      warnings: [{ code: 'lossy-conversion', message: expect.any(String) }]
    })
  })

  it('exposes external-runtime converter capabilities in the default set', () => {
    const converters = createDefaultConverters()
    const browserPrintConverter = converters.find(converter => converter.metadata.id === 'browser-print')
    const docxConverter = converters.find(converter => converter.metadata.id === 'docx-markdown')
    const pdfConverter = converters.find(converter => converter.metadata.id === 'pdf-markdown')
    const ocrConverter = converters.find(converter => converter.metadata.id === 'ocr-markdown')
    const markdownPdfConverter = converters.find(converter => converter.metadata.id === 'markdown-pdf')
    const markdownDocxConverter = converters.find(converter => converter.metadata.id === 'markdown-docx')
    const richClipboardConverter = converters.find(converter => converter.metadata.id === 'rich-clipboard-markdown')
    const urlConverter = converters.find(converter => converter.metadata.id === 'url-markdown')

    expect(browserPrintConverter && converterCanHandle(browserPrintConverter, 'browser-print')).toBe(false)
    expect(docxConverter && converterCanHandle(docxConverter, 'docx-to-markdown')).toBe(true)
    expect(pdfConverter && converterCanHandle(pdfConverter, 'pdf-to-markdown')).toBe(true)
    expect(ocrConverter && converterCanHandle(ocrConverter, 'ocr-to-markdown')).toBe(true)
    expect(markdownPdfConverter && converterCanHandle(markdownPdfConverter, 'markdown-to-pdf')).toBe(true)
    expect(markdownDocxConverter && converterCanHandle(markdownDocxConverter, 'markdown-to-docx')).toBe(true)
    expect(richClipboardConverter && converterCanHandle(richClipboardConverter, 'rich-clipboard-to-markdown')).toBe(true)
    expect(urlConverter && converterCanHandle(urlConverter, 'url-to-markdown')).toBe(true)
  })

  it('supports browser print in the convenience set only when a print adapter is provided', async () => {
    const print = vi.fn()
    const converters = createDefaultConverters({ print })
    const browserPrintConverter = converters.find(converter => converter.metadata.id === 'browser-print')

    expect(browserPrintConverter && converterCanHandle(browserPrintConverter, 'browser-print')).toBe(true)
    await expect(browserPrintConverter?.convert({ format: 'browser-print', markdown: '# Print' })).resolves.toMatchObject({
      ok: true,
      value: { format: 'browser-print' }
    })
    expect(print).toHaveBeenCalledTimes(1)
  })

  it('keeps the Phase 7 factory as a compatibility alias', () => {
    expect(createPhase7AConverters().map(converter => converter.metadata.id)).toEqual(
      createDefaultConverters().map(converter => converter.metadata.id)
    )
  })

  it('builds compact UI defaults for HTML export paths and warning statuses', () => {
    expect(defaultHtmlExportPath('C:\\docs\\Guide.markdown')).toBe('C:\\docs\\Guide.html')
    expect(defaultHtmlExportPath('/tmp/report.txt')).toBe('/tmp/report.html')
    expect(defaultHtmlExportPath('')).toBe('Untitled.html')
    expect(conversionWarningStatus('Cleaned Markdown', [])).toBe('Cleaned Markdown')
    expect(conversionWarningStatus('Cleaned Markdown', [
      { code: 'normalized-markdown', message: 'Whitespace changed.' }
    ])).toBe('Cleaned Markdown (1 warning: Whitespace changed.)')
  })
})
