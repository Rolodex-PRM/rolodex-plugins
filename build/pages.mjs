import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, '.pages-site')

await rm(out, { recursive: true, force: true })
await mkdir(out, { recursive: true })
await cp(path.join(root, 'dist', 'index.json'), path.join(out, 'index.json'))
await cp(path.join(root, 'dist', 'index.json.sha256'), path.join(out, 'index.json.sha256'))
await cp(path.join(root, 'schema'), path.join(out, 'schema'), { recursive: true })
await writeFile(
  path.join(out, 'index.html'),
  `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<title>Rolodex plugins</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<body>
  <main>
    <h1>Rolodex plugins</h1>
    <p>Machine-readable registry: <a href="./index.json"><code>index.json</code></a></p>
    <p>Contribute entries in the <a href="https://github.com/Rolodex-PRM/rolodex-plugins">rolodex-plugins</a> repository.</p>
  </main>
</body>
</html>
`
)

console.log('pages site → .pages-site/')
