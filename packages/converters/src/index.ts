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
    | 'host-print-required'
    | 'lossy-conversion'
    | 'normalized-markdown'
    | 'unsupported-capability'
    | 'unsupported-format'
  message: string
}

export type ConversionRequest = CancellableOptions & {
  csv?: string
  format: ConversionFormat
  html?: string
  markdown?: string
  title?: string
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
      return ok({
        format: 'html',
        html: wrapHtmlDocument(rendered.html, request.title ?? 'MarkForge document'),
        warnings: []
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

export function createUnsupportedConverter(
  format: Exclude<ConversionFormat, 'browser-print' | 'csv-to-markdown-table' | 'html' | 'html-to-markdown' | 'markdown-cleanup'>,
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

      return err('not-supported', `${label} is not implemented in Phase 7A.`, { reason })
    }
  }
}

export function createPhase7AConverters(): MarkdownConverter[] {
  return [
    createHtmlConverter(),
    createBrowserPrintConverter(() => {
      throw new Error('Browser print requires an app-provided print adapter.')
    }),
    createHtmlToMarkdownConverter(),
    createCsvToMarkdownTableConverter(),
    createMarkdownCleanupConverter(),
    createUnsupportedConverter('docx-to-markdown', 'DOCX to Markdown', 'DOCX import needs file parsing and fixture coverage before it can be supported.'),
    createUnsupportedConverter('pdf-to-markdown', 'PDF to Markdown', 'PDF import needs an explicit text/layout extraction strategy and fixtures.'),
    createUnsupportedConverter('rich-clipboard-to-markdown', 'Rich Clipboard to Markdown', 'Rich clipboard import needs platform clipboard MIME access.'),
    createUnsupportedConverter('url-to-markdown', 'URL/Article to Markdown', 'URL import needs network/readability policy and user trust decisions.'),
    createUnsupportedConverter('ocr-to-markdown', 'Image OCR to Markdown', 'OCR import needs an OCR engine decision and model/runtime packaging plan.')
  ]
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

function wrapHtmlDocument(body: string, title: string): string {
  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    `<title>${escapeHtml(title)}</title>`,
    '</head>',
    '<body>',
    body,
    '</body>',
    '</html>'
  ].join('')
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
