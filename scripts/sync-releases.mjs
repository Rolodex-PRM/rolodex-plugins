/**
 * For each registry entry, check the plugin repo's newest version tag.
 * If the tag archive has a matching rolodex-plugin.json, update version/release/sha256.
 * Contributors only ship GitHub releases after the initial registry PR.
 */
import { createHash } from 'node:crypto'
import { inflateRawSync } from 'node:zlib'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import semver from 'semver'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pluginsDir = path.join(root, 'registry', 'plugins')
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''
const dryRun = process.argv.includes('--dry-run')

function headers(extra = {}) {
  const h = {
    'User-Agent': 'rolodex-plugins-sync',
    Accept: 'application/vnd.github+json',
    ...extra,
  }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

async function githubJson(url) {
  const response = await fetch(url, { headers: headers() })
  if (!response.ok) throw new Error(`${url} → ${response.status}`)
  return response.json()
}

async function download(url) {
  const response = await fetch(url, {
    headers: headers({ Accept: 'application/octet-stream' }),
    redirect: 'follow',
  })
  if (!response.ok) throw new Error(`download ${url} → ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length > 20_000_000) throw new Error('archive larger than 20 MB')
  return bytes
}

function parseZip(bytes) {
  const files = new Map()
  let offset = 0
  while (offset + 30 <= bytes.length) {
    if (bytes.readUInt32LE(offset) !== 0x04034b50) break
    const method = bytes.readUInt16LE(offset + 8)
    const compSize = bytes.readUInt32LE(offset + 18)
    const nameLen = bytes.readUInt16LE(offset + 26)
    const extraLen = bytes.readUInt16LE(offset + 28)
    const nameStart = offset + 30
    const name = bytes.subarray(nameStart, nameStart + nameLen).toString('utf8')
    const dataStart = nameStart + nameLen + extraLen
    const data = bytes.subarray(dataStart, dataStart + compSize)
    offset = dataStart + compSize
    let content
    if (method === 0) content = Buffer.from(data)
    else if (method === 8) content = inflateRawSync(data)
    else continue
    const normalized = name.replace(/\\/g, '/')
    const slash = normalized.indexOf('/')
    const relative = slash === -1 ? normalized : normalized.slice(slash + 1)
    if (relative && !relative.endsWith('/')) files.set(relative, content)
  }
  return files
}

function manifestFromZip(files, folder) {
  const prefix = folder ? `${folder.replace(/^\/+|\/+$/g, '')}/` : ''
  const key = `${prefix}rolodex-plugin.json`
  const bytes = files.get(key)
  if (!bytes) return null
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch {
    return null
  }
}

function versionTags(tags) {
  return tags
    .map((t) => ({ tag: t.name, version: String(t.name).replace(/^v/, '') }))
    .filter((t) => semver.valid(t.version))
    .sort((a, b) => semver.rcompare(a.version, b.version))
}

async function latestCompatibleTag(repo, entry) {
  const tags = await githubJson(`https://api.github.com/repos/${repo}/tags?per_page=30`)
  const ranked = versionTags(tags)
  for (const candidate of ranked) {
    if (!semver.gt(candidate.version, entry.version)) continue
    const url = `https://github.com/${repo}/archive/refs/tags/${encodeURIComponent(candidate.tag)}.zip`
    const bytes = await download(url)
    const files = parseZip(bytes)
    const manifest = manifestFromZip(files, entry.path || '')
    if (!manifest) continue
    if (manifest.id !== entry.id) continue
    if (String(manifest.version) !== candidate.version) continue
    const sha256 = createHash('sha256').update(bytes).digest('hex')
    return {
      version: candidate.version,
      release: candidate.tag,
      sha256,
      rolodex: manifest.rolodex || entry.rolodex,
      name: manifest.name || entry.name,
      description: manifest.description || entry.description,
      entry: manifest.entry || entry.entry,
      permissions: manifest.permissions ?? entry.permissions,
      settings: manifest.settings ?? entry.settings,
    }
  }
  return null
}

const names = (await readdir(pluginsDir)).filter((n) => n.endsWith('.json')).sort()
let changed = 0

for (const name of names) {
  const file = path.join(pluginsDir, name)
  const entry = JSON.parse(await readFile(file, 'utf8'))
  process.stdout.write(`${entry.id} (${entry.release})… `)
  try {
    const update = await latestCompatibleTag(entry.repo, entry)
    if (!update) {
      console.log('up to date')
      continue
    }
    const next = {
      ...entry,
      version: update.version,
      release: update.release,
      sha256: update.sha256,
      rolodex: update.rolodex,
      name: update.name,
      description: update.description,
      entry: update.entry,
    }
    if (update.permissions) next.permissions = update.permissions
    if (update.settings) next.settings = update.settings
    console.log(`→ ${update.release}`)
    if (!dryRun) {
      await writeFile(file, `${JSON.stringify(next, null, 2)}\n`)
    }
    changed += 1
  } catch (error) {
    console.log(`skip (${error.message})`)
  }
}

console.log(dryRun ? `dry-run: ${changed} would update` : `updated ${changed} entr${changed === 1 ? 'y' : 'ies'}`)
if (changed && !dryRun) process.exitCode = 0
