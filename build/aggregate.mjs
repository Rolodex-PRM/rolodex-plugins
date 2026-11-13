import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pluginsDir = path.join(root, 'registry', 'plugins')
const distDir = path.join(root, 'dist')

const names = (await readdir(pluginsDir))
  .filter((name) => name.endsWith('.json'))
  .sort((a, b) => a.localeCompare(b))

const plugins = []
for (const name of names) {
  const entry = JSON.parse(await readFile(path.join(pluginsDir, name), 'utf8'))
  plugins.push(entry)
}

plugins.sort((a, b) => String(a.name).localeCompare(String(b.name)))

const registry = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  plugins,
}

const json = `${JSON.stringify(registry, null, 2)}\n`
await mkdir(distDir, { recursive: true })
await writeFile(path.join(distDir, 'index.json'), json)
const sha = createHash('sha256').update(json).digest('hex')
await writeFile(path.join(distDir, 'index.json.sha256'), `${sha}  index.json\n`)

console.log(`aggregated ${plugins.length} plugin(s) → dist/index.json (sha256 ${sha.slice(0, 12)}…)`)
