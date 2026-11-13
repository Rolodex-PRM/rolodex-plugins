# Rolodex plugins

The community registry for [Rolodex](https://github.com/Rolodex-PRM/rolodex) plugins.

This repository is a **static index**. Rolodex downloads one file — [`dist/index.json`](./dist/index.json) — to list plugins under Admin → Plugins. There is no server and no account. You list a plugin by opening a pull request.

Plugin **code** and **README** live in **your** public GitHub repo. This registry only stores a small JSON pointer to a release tag and its SHA-256.

> [!WARNING]
> Community plugins are third-party software. They run in a sandboxed frame with the permissions the admin grants. Rolodex does not audit entries here. Review the plugin and its declared permissions before you install one.

## How it works

- Each plugin is one file: `registry/plugins/<id>.json`
- CI validates every pull request
- On merge, publish regenerates `dist/index.json` (the live catalog Rolodex fetches)
- A sync workflow watches listed plugin repos for newer version tags and updates those JSON files for you
- Rolodex downloads the pinned tag archive, checks the hash, and unpacks the page — no Rolodex release required to list or bump a plugin

**Discovery URL (what Rolodex hits):**

```
https://raw.githubusercontent.com/Rolodex-PRM/rolodex-plugins/main/dist/index.json
```

When GitHub Pages is enabled:

```
https://rolodex-prm.github.io/rolodex-plugins/index.json
```

## Add your plugin (one JSON file)

1. Build and ship a public GitHub release (`rolodex-plugin create` / `validate`, tag `v1.0.0`, `rolodex-plugin.json` + HTML at the repo root).
2. Fork this repo and add **only** `registry/plugins/<id>.json` from [`schema/example-entry.json`](./schema/example-entry.json).
3. Set `repo`, `release`, and `sha256` of that tag archive:

   ```sh
   curl -sL "https://github.com/<owner>/<repo>/archive/refs/tags/v1.0.0.zip" | shasum -a 256
   ```

4. Open the PR. Do not edit `dist/`.

After merge, ship new tags on **your** repo. Sync picks them up (every few hours, or trigger `plugin-release` via `repository_dispatch`). You should not need another registry PR for routine version bumps.

### Entry checklist

- [ ] Filename is `<id>.json` and matches the `id` field
- [ ] `id` / `version` / `entry` / `rolodex` match the release manifest
- [ ] `repo` is `owner/name`, `release` is the tag, `sha256` is that tag zip
- [ ] You did not change `dist/`

See [`schema/plugin-entry.schema.json`](./schema/plugin-entry.schema.json).

## Local checks

```sh
npm install
npm run validate          # all entries, or pass a path
npm run aggregate         # rebuild dist/index.json
```

## License

MIT for the registry metadata in this repository. Each plugin keeps its own license (declared in its entry).
