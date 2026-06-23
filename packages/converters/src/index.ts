import { renderMarkdown } from '@markforge/markdown-engine'
import { err, ok, type CancellableOptions, type Result } from '@markforge/shared'

export type ConversionFormat =
  | 'browser-print'
  | 'csv-to-markdown-table'
  | 'docx-to-markdown'
  | 'html'
  | 'html-to-markdown'
  | 'markdown-cleanup'
  | 'ocr-to-markdown'
  | 'pdf-to-markdown'
  | 'rich-clipboard-to-markdown'
  | 'url-to-markdown'

export type ConverterCapability = {
  format: ConversionFormat
  requiresHostPrint?: boolean
  unsupported?: boolean
}

export type ConverterMetadata = {
  capabilities: ConverterCapability[]
  id: string
  label: string
}

export type ConversionWarning = {
  code:
    | 'export-settings-applied'
    | 'host-print-required'
    | 'lossy-conversion'
    | 'network-fetch'
    | 'normalized-markdown'
    | 'unsupported-capability'
    | 'unsupported-format'
  message: string
}

export type HtmlExportSettings = {
  includeGeneratedMeta?: boolean
  includeTableOfContents?: boolean
  title?: string
}

export type ConversionRequest = CancellableOptions & {
  csv?: string
  exportSettings?: HtmlExportSettings
  format: ConversionFormat
  html?: string
  markdown?: string
  title?: string
  url?: string
}

export type ConversionResult = {
  format: ConversionFormat
  html?: string
  markdown?: string
  warnings: ConversionWarning[]
}

export type MarkdownConverter = {
  canConvert(format: ConversionFormat): boolean
  convert(request: ConversionRequest): Promise<Result<ConversionResult>>
  metadata: ConverterMetadata
}

export const htmlConverterMetadata: ConverterMetadata = {
  id: 'markdown-html',
  label: 'Markdown to HTML',
  capabilities: [{ format: 'html' }]
}

export const browserPrintConverterMetadata: ConverterMetadata = {
  id: 'browser-print',
  label: 'Browser Print',
  capabilities: [{ format: 'browser-print', requiresHostPrint: true }]
}

export const htmlToMarkdownConverterMetadata: ConverterMetadata = {
  id: 'html-markdown',
  label: 'HTML to Markdown',
  capabilities: [{ format: 'html-to-markdown' }]
}

export const csvToMarkdownTableConverterMetadata: ConverterMetadata = {
  id: 'csv-markdown-table',
  label: 'CSV to Markdown Table',
  capabilities: [{ format: 'csv-to-markdown-table' }]
}

export const markdownCleanupConverterMetadata: ConverterMetadata = {
  id: 'markdown-cleanup',
  label: 'Markdown Cleanup',
  capabilities: [{ format: 'markdown-cleanup' }]
}

export const richClipboardToMarkdownConverterMetadata: ConverterMetadata = {
  id: 'rich-clipboard-markdown',
  label: 'Rich Clipboard to Markdown',
  capabilities: [{ format: 'rich-clipboard-to-markdown' }]
}

export const urlToMarkdownConverterMetadata: ConverterMetadata = {
  id: 'url-markdown',
  label: 'URL/Article to Markdown',
  capabilities: [{ format: 'url-to-markdown' }]
}

export function createHtmlConverter(): MarkdownConverter {
  return {
    metadata: htmlConverterMetadata,
    canConvert(format) {
      return format === 'html'
    },
    async convert(request) {
      if (request.signal?.aborted) return err('cancelled', 'Conversion was cancelled.')
      if (request.format !== 'html') return unsupportedFormat(request.format)

      const markdown = request.markdown
      if (typeof markdown !== 'string') return err('invalid-input', 'Markdown input is required.')

      const rendered = renderMarkdown(markdown)
      const exportSettings = request.exportSettings ?? {}
      return ok({
        format: 'html',
        html: wrapHtmlDocument(rendered.html, exportSettings.title ?? request.title ?? 'MarkForge document', exportSettings, rendered.headings),
        warnings: Object.values(exportSettings).some(value => value)
          ? [{ code: 'export-settings-applied', message: 'HTML export settings were applied.' }]
          : []
      })
    }
  }
}

export function createBrowserPrintConverter(print: () => void): MarkdownConverter {
  return {
    metadata: browserPrintConverterMetadata,
    canConvert(format) {
      return format === 'browser-print'
    },
    async convert(request) {
      if (request.signal?.aborted) return err('cancelled', 'Conversion was cancelled.')
      if (request.format !== 'browser-print') return unsupportedFormat(request.format)

      print()
      return ok({
        format: 'browser-print',
        warnings: [
          {
            code: 'host-print-required',
            message: 'Browser print delegates PDF/printer output to the host webview print dialog.'
          }
        ]
      })
    }
  }
}

export function createHtmlToMarkdownConverter(): MarkdownConverter {
  return {
    metadata: htmlToMarkdownConverterMetadata,
    canConvert(format) {
      return format === 'html-to-markdown'
    },
    async convert(request) {
      if (request.signal?.aborted) return err('cancelled', 'Conversion was cancelled.')
      if (request.format !== 'html-to-markdown') return unsupportedFormat(request.format)
      if (typeof request.html !== 'string' || !request.html.trim()) {
        return err('invalid-input', 'HTML input is required.')
      }

      const service = await createTurndownService()
      return ok({
        format: 'html-to-markdown',
        markdown: normalizeConvertedMarkdown(service.turndown(request.html)),
        warnings: [
          {
            code: 'lossy-conversion',
            message: 'HTML to Markdown conversion preserves document text and common structure, but unsupported styling and layout are dropped.'
          }
        ]
      })
    }
  }
}

export function createCsvToMarkdownTableConverter(): MarkdownConverter {
  return {
    metadata: csvToMarkdownTableConverterMetadata,
    canConvert(format) {
      return format === 'csv-to-markdown-table'
    },
    async convert(request) {
      if (request.signal?.aborted) return err('cancelled', 'Conversion was cancelled.')
      if (request.format !== 'csv-to-markdown-table') return unsupportedFormat(request.format)
      if (typeof request.csv !== 'string' || !request.csv.trim()) {
        return err('invalid-input', 'CSV input is required.')
      }

      const parsed = parseCsv(request.csv)
      if (!parsed.ok) return parsed

      return ok({
        format: 'csv-to-markdown-table',
        markdown: csvRowsToMarkdownTable(parsed.value.rows),
        warnings: parsed.value.warnings
      })
    }
  }
}

export function createMarkdownCleanupConverter(): MarkdownConverter {
  return {
    metadata: markdownCleanupConverterMetadata,
    canConvert(format) {
      return format === 'markdown-cleanup'
    },
    async convert(request) {
      if (request.signal?.aborted) return err('cancelled', 'Conversion was cancelled.')
      if (request.format !== 'markdown-cleanup') return unsupportedFormat(request.format)
      if (typeof request.markdown !== 'string') return err('invalid-input', 'Markdown input is required.')

      const markdown = cleanupMarkdown(request.markdown)
      const changed = markdown !== request.markdown

      return ok({
        format: 'markdown-cleanup',
        markdown,
        warnings: changed
          ? [{ code: 'normalized-markdown', message: 'Whitespace and trailing blank lines were normalized.' }]
          : []
      })
    }
  }
}

export function createRichClipboardToMarkdownConverter(): MarkdownConverter {
  return {
    metadata: richClipboardToMarkdownConverterMetadata,
    canConvert(format) {
      return format === 'rich-clipboard-to-markdown'
    },
    async convert(request) {
      if (request.signal?.aborted) return err('cancelled', 'Conversion was cancelled.')
      if (request.format !== 'rich-clipboard-to-markdown') return unsupportedFormat(request.format)
      if (typeof request.html !== 'string' || !request.html.trim()) {
        return err('invalid-input', 'Rich clipboard HTML input is required.')
      }

      const service = await createTurndownService()
      return ok({
        format: 'rich-clipboard-to-markdown',
        markdown: normalizeConvertedMarkdown(service.turndown(request.html)),
        warnings: [
          {
            code: 'lossy-conversion',
            message: 'Rich clipboard conversion preserves text and common structure, but inline styling and unsupported clipboard metadata are dropped.'
          }
        ]
      })
    }
  }
}

export type UrlHtmlFetcher = (url: string, options?: CancellableOptions) => Promise<string>

export function createUrlToMarkdownConverter(fetchHtml: UrlHtmlFetcher = defaultFetchHtml): MarkdownConverter {
  return {
    metadata: urlToMarkdownConverterMetadata,
    canConvert(format) {
      return format === 'url-to-markdown'
    },
    async convert(request) {
      if (request.signal?.aborted) return err('cancelled', 'Conversion was cancelled.')
      if (request.format !== 'url-to-markdown') return unsupportedFormat(request.format)

      const parsed = parseImportUrl(request.url)
      if (!parsed.ok) return parsed

      const html = await fetchHtml(parsed.value, { signal: request.signal })
      const service = await createTurndownService()
      return ok({
        format: 'url-to-markdown',
        markdown: normalizeConvertedMarkdown(service.turndown(html)),
        warnings: [
          {
            code: 'network-fetch',
            message: `Fetched HTML from ${parsed.value} before converting it to Markdown.`
          },
          {
            code: 'lossy-conversion',
            message: 'URL import preserves article text and common structure, but site scripts, styling, and interactive widgets are dropped.'
          }
        ]
      })
    }
  }
}

export function createUnsupportedConverter(
  format: Exclude<ConversionFormat, 'csv-to-markdown-table' | 'html' | 'html-to-markdown' | 'markdown-cleanup' | 'rich-clipboard-to-markdown' | 'url-to-markdown'>,
  label: string,
  reason: string
): MarkdownConverter {
  return {
    metadata: {
      id: format,
      label,
      capabilities: [{ format, unsupported: true }]
    },
    canConvert() {
      return false
    },
    async convert(request) {
      if (request.signal?.aborted) return err('cancelled', 'Conversion was cancelled.')
      if (request.format !== format) return unsupportedFormat(request.format)

      return err('not-supported', `${label} is explicitly unsupported in the current converter set.`, { reason })
    }
  }
}

export type ConverterSetOptions = {
  print?: () => void
  fetchHtml?: UrlHtmlFetcher
}

export function createDefaultConverters(options: ConverterSetOptions = {}): MarkdownConverter[] {
  const browserPrintConverter = options.print
    ? createBrowserPrintConverter(options.print)
    : createUnsupportedConverter('browser-print', 'Browser print', 'Browser print requires an app-provided print adapter.')

  return [
    createHtmlConverter(),
    browserPrintConverter,
    createHtmlToMarkdownConverter(),
    createCsvToMarkdownTableConverter(),
    createMarkdownCleanupConverter(),
    createRichClipboardToMarkdownConverter(),
    createUrlToMarkdownConverter(options.fetchHtml),
    createUnsupportedConverter('docx-to-markdown', 'DOCX to Markdown', 'DOCX import needs file parsing and fixture coverage before it can be supported.'),
    createUnsupportedConverter('pdf-to-markdown', 'PDF to Markdown', 'PDF import needs an explicit text/layout extraction strategy and fixtures.'),
    createUnsupportedConverter('ocr-to-markdown', 'Image OCR to Markdown', 'OCR import needs an OCR engine decision and model/runtime packaging plan.')
  ]
}

export function createPhase7AConverters(options: ConverterSetOptions = {}): MarkdownConverter[] {
  return createDefaultConverters(options)
}

export function converterCanHandle(converter: MarkdownConverter, format: ConversionFormat): boolean {
  return converter.metadata.capabilities.some(capability => capability.format === format && !capability.unsupported) &&
    converter.canConvert(format)
}

export function defaultHtmlExportPath(sourcePathOrTitle: string | null | undefined): string {
  const fallback = 'Untitled.html'
  const value = sourcePathOrTitle?.trim()
  if (!value) return fallback

  const separatorIndex = Math.max(value.lastIndexOf('/'), value.lastIndexOf('\\'))
  const directory = separatorIndex >= 0 ? value.slice(0, separatorIndex + 1) : ''
  const name = separatorIndex >= 0 ? value.slice(separatorIndex + 1) : value
  const baseName = name.replace(/\.(md|markdown|mdown|txt|html?)$/i, '') || 'Untitled'

  return `${directory}${baseName}.html`
}

export function conversionWarningStatus(action: string, warnings: ConversionWarning[]): string {
  if (warnings.length === 0) return action
  const warningLabel = warnings.length === 1 ? '1 warning' : `${warnings.length} warnings`

  return `${action} (${warningLabel}: ${warnings.map(warning => warning.message).join(' ')})`
}

async function createTurndownService() {
  const { default: TurndownService } = await import('turndown')
  const service = new TurndownService({
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    headingStyle: 'atx'
  })

  service.remove(['script', 'style', 'meta', 'link'])

  return service
}

function parseCsv(input: string): Result<{ rows: string[][]; warnings: ConversionWarning[] }> {
  const rows: string[][] = []
  let cell = ''
  let row: string[] = []
  let inQuotes = false
  let hadRaggedRows = false

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]
    const next = input[index + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (!inQuotes && char === ',') {
      row.push(cell)
      cell = ''
      continue
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      row.push(cell)
      rows.push(row)
      cell = ''
      row = []
      if (char === '\r' && next === '\n') index += 1
      continue
    }

    cell += char
  }

  if (inQuotes) return err('invalid-input', 'CSV input has an unterminated quoted field.')

  row.push(cell)
  rows.push(row)

  const normalizedRows = rows
    .map(cells => cells.map(value => value.trim()))
    .filter(cells => cells.some(Boolean))

  if (normalizedRows.length === 0) return err('invalid-input', 'CSV input did not contain any rows.')

  const columnCount = Math.max(...normalizedRows.map(cells => cells.length))
  for (const cells of normalizedRows) {
    if (cells.length !== columnCount) hadRaggedRows = true
    while (cells.length < columnCount) cells.push('')
  }

  return ok({
    rows: normalizedRows,
    warnings: hadRaggedRows
      ? [{ code: 'lossy-conversion', message: 'Rows with missing cells were padded to produce a valid Markdown table.' }]
      : []
  })
}

function csvRowsToMarkdownTable(rows: string[][]): string {
  const [header, ...bodyRows] = rows
  const separator = header.map(() => '---')
  const tableRows = [
    header,
    separator,
    ...(bodyRows.length > 0 ? bodyRows : [header.map(() => '')])
  ]

  return `${tableRows.map(row => `| ${row.map(escapeMarkdownTableCell).join(' | ')} |`).join('\n')}\n`
}

function cleanupMarkdown(markdown: string): string {
  return `${markdown
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(line => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()}\n`
}

function normalizeConvertedMarkdown(markdown: string): string {
  return cleanupMarkdown(markdown)
}

function unsupportedFormat(format: ConversionFormat): Result<never> {
  return err('not-supported', `Converter does not support ${format}.`, { format })
}

function wrapHtmlDocument(
  body: string,
  title: string,
  settings: HtmlExportSettings = {},
  headings: Array<{ id: string; level: number; text: string }> = []
): string {
  const toc = settings.includeTableOfContents && headings.length > 0
    ? [
        '<nav aria-label="Table of contents">',
        '<h2>Contents</h2>',
        '<ol>',
        ...headings.map(heading => `<li data-level="${heading.level}"><a href="#${escapeHtml(heading.id)}">${escapeHtml(heading.text)}</a></li>`),
        '</ol>',
        '</nav>'
      ].join('')
    : ''
  const generated = settings.includeGeneratedMeta
    ? `<meta name="generator" content="MarkForge">`
    : ''

  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    generated,
    `<title>${escapeHtml(title)}</title>`,
    '</head>',
    '<body>',
    toc,
    body,
    '</body>',
    '</html>'
  ].join('')
}

function parseImportUrl(value: string | undefined): Result<string> {
  if (!value?.trim()) return err('invalid-input', 'URL input is required.')

  try {
    const parsed = new URL(value.trim())
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return err('invalid-input', 'URL import supports only http and https URLs.')
    }

    return ok(parsed.toString())
  } catch {
    return err('invalid-input', 'URL input must be a valid absolute URL.')
  }
}

async function defaultFetchHtml(url: string, options?: CancellableOptions): Promise<string> {
  if (typeof fetch !== 'function') throw new Error('URL import requires a fetch implementation.')

  const response = await fetch(url, { signal: options?.signal })
  if (!response.ok) throw new Error(`URL fetch failed with HTTP ${response.status}.`)

  return response.text()
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeMarkdownTableCell(value: string): string {
  return value
    .replace(/\r?\n/g, '<br>')
    .replace(/\|/g, '\\|')
}
