import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import semver from 'semver'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const schema = JSON.parse(
  await readFile(path.join(root, 'schema', 'plugin-entry.schema.json'), 'utf8')
)

const ajv = new Ajv2020({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(schema)

const args = process.argv.slice(2)
const checkHash = !args.includes('--schema-only')
const targets = args.filter((arg) => !arg.startsWith('--'))

async function listEntries() {
  if (targets.length) return targets.map((t) => path.resolve(t))
  const dir = path.join(root, 'registry', 'plugins')
  const names = (await readdir(dir)).filter((n) => n.endsWith('.json'))
  return names.map((n) => path.join(dir, n))
}

function archiveUrl(repo, release) {
  return `https://github.com/${repo}/archive/refs/tags/${encodeURIComponent(release)}.zip`
}

function rangeLooksValid(range) {
  // Accept comparator ranges Rolodex uses; reject empty / nonsense.
  if (!range || typeof range !== 'string') return false
  try {
    return Boolean(semver.validRange(range, { includePrerelease: true }))
  } catch {
    return false
  }
}

async function hashArchive(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'rolodex-plugins-validate', Accept: 'application/octet-stream' },
    redirect: 'follow',
  })
  if (!response.ok) {
    throw new Error(`could not download ${url} (${response.status})`)
  }
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length > 20_000_000) throw new Error('archive is larger than 20 MB')
  return createHash('sha256').update(bytes).digest('hex')
}

const files = await listEntries()
let failed = 0

for (const file of files) {
  const problems = []
  let entry
  try {
    entry = JSON.parse(await readFile(file, 'utf8'))
  } catch (error) {
    console.error(`✗ ${path.relative(root, file)}: invalid JSON (${error.message})`)
    failed += 1
    continue
  }

  if (!validate(entry)) {
    for (const err of validate.errors ?? []) {
      problems.push(`${err.instancePath || '/'} ${err.message}`)
    }
  }

  const base = path.basename(file, '.json')
  if (entry.id && entry.id !== base) {
    problems.push(`id "${entry.id}" must match filename "${base}.json"`)
  }

  if (entry.rolodex && !rangeLooksValid(entry.rolodex)) {
    problems.push(`rolodex range is not a valid semver range: ${entry.rolodex}`)
  }

  if (checkHash && entry.repo && entry.release && entry.sha256 && problems.length === 0) {
    try {
      const url = archiveUrl(entry.repo, entry.release)
      const actual = await hashArchive(url)
      if (actual !== String(entry.sha256).toLowerCase()) {
        problems.push(
          `sha256 mismatch for ${url}\n    expected ${entry.sha256}\n    actual   ${actual}`
        )
      }
    } catch (error) {
      problems.push(error.message)
    }
  }

  if (problems.length) {
    failed += 1
    console.error(`✗ ${path.relative(root, file)}`)
    for (const problem of problems) console.error(`  - ${problem}`)
  } else {
    console.log(`✓ ${path.relative(root, file)}`)
  }
}

if (failed) {
  console.error(`\n${failed} entr${failed === 1 ? 'y' : 'ies'} failed`)
  process.exit(1)
}

console.log(`\n${files.length} entr${files.length === 1 ? 'y' : 'ies'} ok`)
