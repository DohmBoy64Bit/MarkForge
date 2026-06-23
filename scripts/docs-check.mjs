import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredFiles = [
  'README.md',
  'docs/architecture.md',
  'docs/developer-documentation.md',
  'docs/audits/documentation-code-drift-debt-audit.md',
  'docs/audits/drift-debt-remediation-report.md',
  'docs/audits/final-pre-next-phase-implementation-report.md',
  'docs/implementation-roadmap.md',
  'docs/marktext-parity-matrix.md',
  'docs/phase-4-editor-shell.md',
  'docs/phase-5-advanced-editing.md',
  'docs/phase-6-templates-help.md',
  'docs/phase-7-converters.md',
  'docs/phase-10-packaging-documentation.md',
  'docs/packaging-release.md',
  'docs/release-hardening.md',
  'docs/update-signing-strategy.md',
  'docs/product-requirements.md',
  'docs/user-documentation.md',
  'packages/markdown-engine/README.md',
  'packages/editor-engine/README.md',
  'packages/templates/README.md'
]

const plannedOnlyPackages = []

const implementedPackages = [
  'converters',
  'core',
  'editor-engine',
  'llm',
  'markdown-engine',
  'platform',
  'shared',
  'templates',
  'theme-engine',
  'ui'
]

const staleMarkers = [
  {
    file: 'README.md',
    marker: 'implementation has progressed through Phase 5A',
    message: 'README current status must not stop at Phase 5A.'
  },
  {
    file: 'docs/developer-documentation.md',
    marker: 'Implementation has progressed through Phase 5A',
    message: 'Developer documentation implementation state must not stop at Phase 5A.'
  },
  {
    file: 'docs/marktext-parity-matrix.md',
    marker: 'MarkForge has docs gate only; implementation tests pending.',
    message: 'Parity matrix must acknowledge current app/package tests.'
  },
  {
    file: 'README.md',
    marker: 'implementation has progressed through Phase 6B',
    message: 'README current status must not stop at Phase 6B.'
  },
  {
    file: 'docs/developer-documentation.md',
    marker: 'Implementation has progressed through Phase 6B',
    message: 'Developer documentation implementation state must not stop at Phase 6B.'
  }
]

const ignoredLinkPrefixes = [
  'http:',
  'https:',
  'mailto:',
  '#',
  'app://'
]

const errors = []

function projectPath(relativePath) {
  return path.join(root, relativePath)
}

function readText(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8')
}

function exists(relativePath) {
  return fs.existsSync(projectPath(relativePath))
}

for (const file of requiredFiles) {
  if (!exists(file)) {
    errors.push(`Missing required documentation file: ${file}`)
  }
}

for (const pkg of implementedPackages) {
  for (const child of ['README.md', 'package.json', 'src/index.ts']) {
    const relativePath = `packages/${pkg}/${child}`
    if (!exists(relativePath)) {
      errors.push(`Implemented package is missing ${child}: packages/${pkg}`)
    }
  }

  if (!hasPackageSpec(pkg)) {
    errors.push(`Implemented package is missing package-level tests: packages/${pkg}`)
  }

  const packageJsonPath = `packages/${pkg}/package.json`
  if (exists(packageJsonPath)) {
    const packageJson = JSON.parse(readText(packageJsonPath))
    if (packageJson.exports?.['.'] !== './src/index.ts') {
      errors.push(`Implemented package must export only its public entrypoint: packages/${pkg}`)
    }
  }
}

for (const pkg of plannedOnlyPackages) {
  const readmePath = `packages/${pkg}/README.md`
  if (!exists(readmePath)) {
    errors.push(`Planned package is missing README: packages/${pkg}`)
    continue
  }

  const readme = readText(readmePath)
  if (!readme.includes('Current status: planned target package only.')) {
    errors.push(`Planned package README must state README-only status: ${readmePath}`)
  }

  for (const child of ['package.json', 'src']) {
    if (exists(`packages/${pkg}/${child}`)) {
      errors.push(`Planned package marked README-only but implementation path exists: packages/${pkg}/${child}`)
    }
  }
}

for (const { file, marker, message } of staleMarkers) {
  if (exists(file) && readText(file).includes(marker)) {
    errors.push(`${message} Found stale marker in ${file}: ${marker}`)
  }
}

const productMarkdownFiles = collectMarkdownFiles(['README.md', 'docs', 'apps', 'packages', 'tests'])

for (const file of productMarkdownFiles) {
  const text = readText(file)
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g
  for (const match of text.matchAll(linkPattern)) {
    const rawLink = match[1].trim()
    if (!rawLink || ignoredLinkPrefixes.some((prefix) => rawLink.startsWith(prefix))) {
      continue
    }

    const [targetWithoutAnchor] = rawLink.split('#')
    if (!targetWithoutAnchor) {
      continue
    }

    const decodedTarget = decodeURIComponent(targetWithoutAnchor)
    const normalized = path.normalize(path.join(path.dirname(projectPath(file)), decodedTarget))
    if (!normalized.startsWith(root)) {
      errors.push(`Documentation link escapes repository root in ${file}: ${rawLink}`)
      continue
    }

    if (!fs.existsSync(normalized)) {
      errors.push(`Broken local documentation link in ${file}: ${rawLink}`)
    }
  }
}

if (errors.length > 0) {
  console.error('MarkForge docs validation failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log(`MarkForge docs validation passed (${productMarkdownFiles.length} markdown files checked).`)

function collectMarkdownFiles(entries) {
  const files = []

  for (const entry of entries) {
    const absolutePath = projectPath(entry)
    if (!fs.existsSync(absolutePath)) {
      continue
    }

    const stat = fs.statSync(absolutePath)
    if (stat.isFile()) {
      if (entry.endsWith('.md') || entry.endsWith('.mdx')) {
        files.push(path.normalize(entry))
      }
      continue
    }

    for (const child of fs.readdirSync(absolutePath, { withFileTypes: true })) {
      const relativeChild = path.join(entry, child.name)
      if (child.isDirectory()) {
        files.push(...collectMarkdownFiles([relativeChild]))
      } else if (child.isFile() && (child.name.endsWith('.md') || child.name.endsWith('.mdx'))) {
        files.push(path.normalize(relativeChild))
      }
    }
  }

  return files.sort()
}

function hasPackageSpec(pkg) {
  const sourcePath = projectPath(`packages/${pkg}/src`)
  if (!fs.existsSync(sourcePath)) return false

  return fs.readdirSync(sourcePath, { recursive: true })
    .some(file => typeof file === 'string' && /\.spec\.tsx?$/.test(file))
}
