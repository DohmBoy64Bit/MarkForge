import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

describe('MarkForge viewer real Tauri smoke', () => {
  let fixtureDir
  let markdownPath
  let htmlPath

  before(() => {
    fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'markforge-viewer-wdio-'))
    markdownPath = path.join(fixtureDir, 'wdio-viewer.md')
    htmlPath = path.join(fixtureDir, 'wdio-viewer.html')
    fs.writeFileSync(markdownPath, '# WDIO viewer fixture\n\nNative IPC read.', 'utf8')
  })

  after(() => {
    if (fixtureDir) fs.rmSync(fixtureDir, { recursive: true, force: true })
  })

  it('renders the real viewer shell inside the Tauri WebView', async () => {
    await $('[aria-label="Search document"]').waitForDisplayed({ timeout: 30000 })
    await $('[aria-label="Open file"]').waitForDisplayed()
    await $('[aria-label="Export HTML"]').waitForDisplayed()

    const bodyText = await $('body').getText()
    expect(bodyText).toContain('MarkForge Viewer')
    expect(bodyText).toContain('Sample document')

    const hasTauriMetadata = await browser.execute(() => Boolean(window.__TAURI_INTERNALS__?.metadata))
    expect(hasTauriMetadata).toBe(true)
  })

  it('proves viewer read/write and workspace IPC commands against the native backend', async () => {
    const readText = await browser.executeAsync((filePath, done) => {
      window.__TAURI_INTERNALS__.invoke('read_text_file', { path: filePath })
        .then(value => done({ ok: true, value }))
        .catch(error => done({ ok: false, error: String(error) }))
    }, markdownPath)
    expect(readText).toEqual({ ok: true, value: '# WDIO viewer fixture\n\nNative IPC read.' })

    const htmlWrite = await browser.executeAsync((filePath, done) => {
      window.__TAURI_INTERNALS__.invoke('write_text_file', { path: filePath, contents: '<h1>Viewer export</h1>' })
        .then(() => done({ ok: true }))
        .catch(error => done({ ok: false, error: String(error) }))
    }, htmlPath)
    expect(htmlWrite).toEqual({ ok: true })
    expect(fs.readFileSync(htmlPath, 'utf8')).toBe('<h1>Viewer export</h1>')

    const search = await browser.executeAsync((root, done) => {
      window.__TAURI_INTERNALS__.invoke('search_workspace', {
        root,
        query: 'Native IPC',
        caseSensitive: false,
        limit: 10
      })
        .then(value => done({ ok: true, value }))
        .catch(error => done({ ok: false, error: String(error) }))
    }, fixtureDir)
    expect(search.ok).toBe(true)
    expect(search.value[0].relativePath).toBe('wdio-viewer.md')
  })
})
