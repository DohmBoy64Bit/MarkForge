import { renderMarkdown } from '@markforge/markdown-engine'
import { err, ok, type CancellableOptions, type Result } from '@markforge/shared'
import type { FileChild } from 'docx'

export type ConversionFormat =
  | 'browser-print'
  | 'csv-to-markdown-table'
  | 'docx-to-markdown'
  | 'html'
  | 'html-to-markdown'
  | 'markdown-cleanup'
  | 'markdown-to-docx'
  | 'markdown-to-pdf'
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
    | 'extracted-text'
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
  bodyClass?: string
  includeGeneratedMeta?: boolean
  includeTableOfContents?: boolean
  stylesheet?: string
  title?: string
}

export type ConversionRequest = CancellableOptions & {
  csv?: string
  data?: ArrayBuffer | Uint8Array
  exportSettings?: HtmlExportSettings
  format: ConversionFormat
  html?: string
  image?: ArrayBuffer | Blob | Uint8Array
  markdown?: string
  title?: string
  url?: string
}

export type ConversionResult = {
  data?: ArrayBuffer
  format: ConversionFormat
  html?: string
  markdown?: string
  mimeType?: string
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

export const docxToMarkdownConverterMetadata: ConverterMetadata = {
  id: 'docx-markdown',
  label: 'DOCX to Markdown',
  capabilities: [{ format: 'docx-to-markdown' }]
}

export const pdfToMarkdownConverterMetadata: ConverterMetadata = {
  id: 'pdf-markdown',
  label: 'PDF to Markdown',
  capabilities: [{ format: 'pdf-to-markdown' }]
}

export const ocrToMarkdownConverterMetadata: ConverterMetadata = {
  id: 'ocr-markdown',
  label: 'Image OCR to Markdown',
  capabilities: [{ format: 'ocr-to-markdown' }]
}

export const markdownToPdfConverterMetadata: ConverterMetadata = {
  id: 'markdown-pdf',
  label: 'Markdown to PDF',
  capabilities: [{ format: 'markdown-to-pdf' }]
}

export const markdownToDocxConverterMetadata: ConverterMetadata = {
  id: 'markdown-docx',
  label: 'Markdown to DOCX',
  capabilities: [{ format: 'markdown-to-docx' }]
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

export type DocxHtmlExtractor = (data: ArrayBuffer, options?: CancellableOptions) => Promise<string>
export type DocxExporter = (markdown: string, title: string, options?: CancellableOptions) => Promise<ArrayBuffer>
export type PdfExporter = (markdown: string, title: string, options?: CancellableOptions) => Promise<ArrayBuffer>
export type PdfTextExtractor = (data: ArrayBuffer, options?: CancellableOptions) => Promise<string>
export type OcrTextExtractor = (image: ArrayBuffer | Blob, options?: CancellableOptions) => Promise<string>

export function createDocxToMarkdownConverter(extractHtml: DocxHtmlExtractor = defaultDocxHtmlExtractor): MarkdownConverter {
  return {
    metadata: docxToMarkdownConverterMetadata,
    canConvert(format) {
      return format === 'docx-to-markdown'
    },
    async convert(request) {
      if (request.signal?.aborted) return err('cancelled', 'Conversion was cancelled.')
      if (request.format !== 'docx-to-markdown') return unsupportedFormat(request.format)

      const data = normalizeBinaryInput(request.data)
      if (!data) return err('invalid-input', 'DOCX input data is required.')

      const html = await extractHtml(data, { signal: request.signal })
      const service = await createTurndownService()
      return ok({
        format: 'docx-to-markdown',
        markdown: normalizeConvertedMarkdown(service.turndown(html)),
        warnings: [
          {
            code: 'lossy-conversion',
            message: 'DOCX conversion preserves document text and common structure, but page layout, comments, and unsupported Word features are dropped.'
          }
        ]
      })
    }
  }
}

export function createPdfToMarkdownConverter(extractText: PdfTextExtractor = defaultPdfTextExtractor): MarkdownConverter {
  return {
    metadata: pdfToMarkdownConverterMetadata,
    canConvert(format) {
      return format === 'pdf-to-markdown'
    },
    async convert(request) {
      if (request.signal?.aborted) return err('cancelled', 'Conversion was cancelled.')
      if (request.format !== 'pdf-to-markdown') return unsupportedFormat(request.format)

      const data = normalizeBinaryInput(request.data)
      if (!data) return err('invalid-input', 'PDF input data is required.')

      const text = await extractText(data, { signal: request.signal })
      return ok({
        format: 'pdf-to-markdown',
        markdown: normalizeConvertedMarkdown(text),
        warnings: [
          {
            code: 'extracted-text',
            message: 'PDF conversion extracts readable text order; exact page layout is not reconstructed.'
          }
        ]
      })
    }
  }
}

export function createOcrToMarkdownConverter(extractText: OcrTextExtractor = defaultOcrTextExtractor): MarkdownConverter {
  return {
    metadata: ocrToMarkdownConverterMetadata,
    canConvert(format) {
      return format === 'ocr-to-markdown'
    },
    async convert(request) {
      if (request.signal?.aborted) return err('cancelled', 'Conversion was cancelled.')
      if (request.format !== 'ocr-to-markdown') return unsupportedFormat(request.format)

      const image = normalizeImageInput(request.image ?? request.data)
      if (!image) return err('invalid-input', 'Image input data is required for OCR.')

      const text = await extractText(image, { signal: request.signal })
      return ok({
        format: 'ocr-to-markdown',
        markdown: normalizeConvertedMarkdown(text),
        warnings: [
          {
            code: 'extracted-text',
            message: 'OCR conversion extracts recognized text and may contain recognition errors.'
          }
        ]
      })
    }
  }
}

export function createMarkdownToPdfConverter(exportPdf: PdfExporter = defaultPdfExporter): MarkdownConverter {
  return {
    metadata: markdownToPdfConverterMetadata,
    canConvert(format) {
      return format === 'markdown-to-pdf'
    },
    async convert(request) {
      if (request.signal?.aborted) return err('cancelled', 'Conversion was cancelled.')
      if (request.format !== 'markdown-to-pdf') return unsupportedFormat(request.format)
      if (typeof request.markdown !== 'string') return err('invalid-input', 'Markdown input is required.')

      const data = await exportPdf(request.markdown, request.title ?? request.exportSettings?.title ?? 'MarkForge document', { signal: request.signal })
      return ok({
        data,
        format: 'markdown-to-pdf',
        mimeType: 'application/pdf',
        warnings: []
      })
    }
  }
}

export function createMarkdownToDocxConverter(exportDocx: DocxExporter = defaultDocxExporter): MarkdownConverter {
  return {
    metadata: markdownToDocxConverterMetadata,
    canConvert(format) {
      return format === 'markdown-to-docx'
    },
    async convert(request) {
      if (request.signal?.aborted) return err('cancelled', 'Conversion was cancelled.')
      if (request.format !== 'markdown-to-docx') return unsupportedFormat(request.format)
      if (typeof request.markdown !== 'string') return err('invalid-input', 'Markdown input is required.')

      const data = await exportDocx(request.markdown, request.title ?? request.exportSettings?.title ?? 'MarkForge document', { signal: request.signal })
      return ok({
        data,
        format: 'markdown-to-docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        warnings: [
          {
            code: 'lossy-conversion',
            message: 'DOCX export preserves headings and paragraph text; advanced Markdown layout is simplified.'
          }
        ]
      })
    }
  }
}

export function createUnsupportedConverter(
  format: Exclude<ConversionFormat, 'csv-to-markdown-table' | 'docx-to-markdown' | 'html' | 'html-to-markdown' | 'markdown-cleanup' | 'markdown-to-docx' | 'markdown-to-pdf' | 'ocr-to-markdown' | 'pdf-to-markdown' | 'rich-clipboard-to-markdown' | 'url-to-markdown'>,
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
  docxHtmlExtractor?: DocxHtmlExtractor
  docxExporter?: DocxExporter
  fetchHtml?: UrlHtmlFetcher
  ocrTextExtractor?: OcrTextExtractor
  pdfExporter?: PdfExporter
  pdfTextExtractor?: PdfTextExtractor
  print?: () => void
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
    createDocxToMarkdownConverter(options.docxHtmlExtractor),
    createPdfToMarkdownConverter(options.pdfTextExtractor),
    createOcrToMarkdownConverter(options.ocrTextExtractor),
    createMarkdownToPdfConverter(options.pdfExporter),
    createMarkdownToDocxConverter(options.docxExporter)
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
  const stylesheet = settings.stylesheet?.trim()
    ? `<style>${settings.stylesheet}</style>`
    : ''
  const bodyClass = settings.bodyClass?.trim()
    ? ` class="${escapeHtml(settings.bodyClass.trim())}"`
    : ''

  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    generated,
    `<title>${escapeHtml(title)}</title>`,
    stylesheet,
    '</head>',
    `<body${bodyClass}>`,
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

async function defaultDocxHtmlExtractor(data: ArrayBuffer, options?: CancellableOptions): Promise<string> {
  if (options?.signal?.aborted) throw new Error('Conversion was cancelled.')

  const mammoth = await import('mammoth')
  const result = await mammoth.convertToHtml({ arrayBuffer: data })

  return result.value
}

async function defaultPdfTextExtractor(data: ArrayBuffer, options?: CancellableOptions): Promise<string> {
  if (options?.signal?.aborted) throw new Error('Conversion was cancelled.')

  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const document = await pdfjs.getDocument({
    data: new Uint8Array(data)
  }).promise
  const pages: string[] = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    if (options?.signal?.aborted) throw new Error('Conversion was cancelled.')
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()
    const text = content.items
      .map(item => 'str' in item && typeof item.str === 'string' ? item.str : '')
      .filter(Boolean)
      .join(' ')
      .trim()

    if (text) pages.push(text)
  }

  return pages.join('\n\n')
}

async function defaultOcrTextExtractor(image: ArrayBuffer | Blob, options?: CancellableOptions): Promise<string> {
  if (options?.signal?.aborted) throw new Error('Conversion was cancelled.')

  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng')

  try {
    const imageInput = image instanceof ArrayBuffer ? new Uint8Array(image) : image
    const result = await worker.recognize(imageInput as Parameters<typeof worker.recognize>[0])
    return result.data.text
  } finally {
    await worker.terminate()
  }
}

async function defaultPdfExporter(markdown: string, title: string, options?: CancellableOptions): Promise<ArrayBuffer> {
  if (options?.signal?.aborted) throw new Error('Conversion was cancelled.')

  const { jsPDF } = await import('jspdf')
  const document = new jsPDF({ format: 'letter', unit: 'pt' })
  const lines = markdownToPlainTextLines(markdown, title)
  const pageWidth = document.internal.pageSize.getWidth()
  const pageHeight = document.internal.pageSize.getHeight()
  const margin = 54
  let y = margin

  document.setProperties({ title })
  document.setFont('helvetica', 'normal')
  document.setFontSize(11)

  for (const line of lines) {
    if (options?.signal?.aborted) throw new Error('Conversion was cancelled.')
    const wrapped = document.splitTextToSize(line || ' ', pageWidth - margin * 2) as string[]

    for (const wrappedLine of wrapped) {
      if (y > pageHeight - margin) {
        document.addPage()
        y = margin
      }
      document.text(wrappedLine, margin, y)
      y += 16
    }

    y += 4
  }

  return document.output('arraybuffer')
}

async function defaultDocxExporter(markdown: string, title: string, options?: CancellableOptions): Promise<ArrayBuffer> {
  if (options?.signal?.aborted) throw new Error('Conversion was cancelled.')

  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import('docx')
  const children = markdownToDocxParagraphs(markdown, title, { HeadingLevel, Paragraph, TextRun })
  const document = new Document({
    creator: 'MarkForge',
    title,
    sections: [{ children }]
  })
  const packer = Packer as unknown as {
    toArrayBuffer?: (document: unknown) => Promise<ArrayBuffer>
    toBuffer?: (document: unknown) => Promise<Uint8Array>
  }

  if (packer.toArrayBuffer) return packer.toArrayBuffer(document)
  if (packer.toBuffer) {
    const buffer = await packer.toBuffer(document)
    return normalizeBinaryInput(buffer) ?? new ArrayBuffer(0)
  }

  throw new Error('DOCX exporter runtime does not expose a supported packer.')
}

function normalizeBinaryInput(value: ArrayBuffer | Uint8Array | undefined): ArrayBuffer | null {
  if (!value) return null
  if (value instanceof ArrayBuffer) return value

  const copy = new Uint8Array(value.byteLength)
  copy.set(value)
  return copy.buffer
}

function normalizeImageInput(value: ArrayBuffer | Blob | Uint8Array | undefined): ArrayBuffer | Blob | null {
  if (!value) return null
  if (isBlob(value)) return value
  return normalizeBinaryInput(value)
}

function isBlob(value: unknown): value is Blob {
  return typeof Blob !== 'undefined' && value instanceof Blob
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

function markdownToPlainTextLines(markdown: string, title: string): string[] {
  const lines = cleanupMarkdown(markdown)
    .split('\n')
    .map(line => line
      .replace(/^#{1,6}\s+/, '')
      .replace(/^[-*+]\s+/, '- ')
      .replace(/^\d+\.\s+/, '')
      .replace(/!\[([^\]]*)]\([^)]+\)/g, '$1')
      .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
      .replace(/[`*_~]/g, '')
      .trim())

  return [title, '', ...lines]
}

function markdownToDocxParagraphs(
  markdown: string,
  title: string,
  docx: {
    HeadingLevel: { HEADING_1: unknown; HEADING_2: unknown; HEADING_3: unknown }
    Paragraph: new (options: Record<string, unknown>) => unknown
    TextRun: new (options: Record<string, unknown>) => unknown
  }
): FileChild[] {
  const paragraphs: FileChild[] = [
    new docx.Paragraph({ text: title, heading: docx.HeadingLevel.HEADING_1 }) as FileChild
  ]

  for (const line of cleanupMarkdown(markdown).split('\n')) {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line)
    if (heading) {
      paragraphs.push(new docx.Paragraph({
        text: heading[2],
        heading: heading[1].length === 1
          ? docx.HeadingLevel.HEADING_1
          : heading[1].length === 2
            ? docx.HeadingLevel.HEADING_2
            : docx.HeadingLevel.HEADING_3
      }) as FileChild)
      continue
    }

    if (!line.trim()) {
      paragraphs.push(new docx.Paragraph({ text: '' }) as FileChild)
      continue
    }

    paragraphs.push(new docx.Paragraph({
      children: [new docx.TextRun({ text: markdownToPlainTextLines(line, '')[2] ?? line })]
    }) as FileChild)
  }

  return paragraphs
}
