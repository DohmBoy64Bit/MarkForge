import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const budgets = [
  {
    app: 'editor',
    directory: 'apps/editor/dist/assets',
    maxJavaScriptBytes: 500 * 1024
  },
  {
    app: 'viewer',
    directory: 'apps/viewer/dist/assets',
    maxJavaScriptBytes: 500 * 1024
  }
]

const errors = []

for (const budget of budgets) {
  const directory = path.join(root, budget.directory)

  if (!fs.existsSync(directory)) {
    errors.push(`Missing build output for ${budget.app}: ${budget.directory}`)
    continue
  }

  const scripts = fs.readdirSync(directory)
    .filter(file => file.endsWith('.js'))
    .map(file => ({
      file,
      bytes: fs.statSync(path.join(directory, file)).size
    }))

  if (scripts.length === 0) {
    errors.push(`No JavaScript assets found for ${budget.app}: ${budget.directory}`)
    continue
  }

  for (const script of scripts) {
    if (script.bytes > budget.maxJavaScriptBytes) {
      errors.push(
        `${budget.app} asset exceeds budget: ${script.file} is ${formatBytes(script.bytes)}, budget ${formatBytes(budget.maxJavaScriptBytes)}`
      )
    }
  }
}

if (errors.length > 0) {
  console.error('MarkForge bundle budget validation failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log('MarkForge bundle budget validation passed.')

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2)} kB`
}
