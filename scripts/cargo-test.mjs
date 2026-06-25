import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const crates = [
  ['editor', path.join(repoRoot, 'apps', 'editor', 'src-tauri')],
  ['viewer', path.join(repoRoot, 'apps', 'viewer', 'src-tauri')]
]

for (const [name, cwd] of crates) {
  console.log(`\n[cargo:test] ${name}`)
  const result = spawnSync('cargo', ['test'], {
    cwd,
    env: process.env,
    shell: process.platform === 'win32',
    stdio: 'inherit'
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
