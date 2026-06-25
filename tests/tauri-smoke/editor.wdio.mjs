import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

describe('MarkForge editor real Tauri smoke', () => {
  let fixtureDir
  let markdownPath
  let binaryPath

  before(() => {
    fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'markforge-editor-wdio-'))
    markdownPath = path.join(fixtureDir, 'wdio-editor.md')
    binaryPath = path.join(fixtureDir, 'wdio-editor.bin')
    fs.writeFileSync(markdownPath, '# WDIO editor fixture\n\nNative IPC read.', 'utf8')
    fs.writeFileSync(binaryPath, Buffer.from([9, 8, 7]))
  })

  after(() => {
    if (fixtureDir) fs.rmSync(fixtureDir, { recursive: true, force: true })
  })

  it('renders the real editor shell inside the Tauri WebView', async () => {
    await $('[aria-label="New document"]').waitForDisplayed({ timeout: 30000 })
    await $('[aria-label="Save"]').waitForDisplayed()
    await $('[aria-label="Markdown source"]').waitForDisplayed()

    const bodyText = await $('body').getText()
    expect(bodyText).toContain('MarkForge')
    expect(bodyText).toContain('Welcome.md')

    const hasTauriMetadata = await browser.execute(() => Boolean(window.__TAURI_INTERNALS__?.metadata))
    expect(hasTauriMetadata).toBe(true)
  })

  it('round-trips real editor IPC commands through the native backend', async () => {
    const readText = await browser.executeAsync((filePath, done) => {
      window.__TAURI_INTERNALS__.invoke('read_text_file', { path: filePath })
        .then(value => done({ ok: true, value }))
        .catch(error => done({ ok: false, error: String(error) }))
    }, markdownPath)
    expect(readText).toEqual({ ok: true, value: '# WDIO editor fixture\n\nNative IPC read.' })

    const info = await browser.executeAsync((filePath, done) => {
      window.__TAURI_INTERNALS__.invoke('get_file_info', { path: filePath })
        .then(value => done({ ok: true, value }))
        .catch(error => done({ ok: false, error: String(error) }))
    }, markdownPath)
    expect(info.ok).toBe(true)
    expect(info.value.exists).toBe(true)
    expect(info.value.len).toBeGreaterThan(0)

    const binary = await browser.executeAsync((filePath, done) => {
      window.__TAURI_INTERNALS__.invoke('read_binary_file', { path: filePath })
        .then(value => done({ ok: true, value }))
        .catch(error => done({ ok: false, error: String(error) }))
    }, binaryPath)
    expect(binary).toEqual({ ok: true, value: [9, 8, 7] })

    const workspace = await browser.executeAsync((root, done) => {
      window.__TAURI_INTERNALS__.invoke('list_workspace_files', { root })
        .then(value => done({ ok: true, value }))
        .catch(error => done({ ok: false, error: String(error) }))
    }, fixtureDir)
    expect(workspace.ok).toBe(true)
    expect(workspace.value.map(entry => entry.relativePath)).toContain('wdio-editor.md')
  })
})
