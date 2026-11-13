# Rolodex plugins

The community registry for [Rolodex](https://github.com/Rolodex-PRM/rolodex) plugins.

This repository is a **static index**. Rolodex downloads one file — [`dist/index.json`](./dist/index.json) — to list plugins under Admin → Plugins. There is no server and no account. You list a plugin by opening a pull request.

Plugin **code** and **README** live in **your** public GitHub repo. This registry only stores a small JSON pointer to a release tag and its SHA-256.

> [!WARNING]
> Community plugins are third-party software. They run in a sandboxed frame with the permissions the admin grants. Rolodex does not audit entries here. Review the plugin and its declared permissions before you install one.

## How it works

- Each plugin is one file: `registry/plugins/<id>.json`
- CI validates every pull request
- On merge, the publish workflow regenerates `dist/index.json`
- Rolodex fetches that index, downloads the pinned GitHub tag archive, checks the hash, and unpacks `rolodex-plugin.json` plus the HTML page

**Discovery URL (what Rolodex hits):**

```
https://raw.githubusercontent.com/Rolodex-PRM/rolodex-plugins/main/dist/index.json
```

When GitHub Pages is enabled for this repo, the same file is also served at:

```
https://rolodex-prm.github.io/rolodex-plugins/index.json
```

## Add your plugin

1. **Build** with [`@rolodex/plugin-sdk`](https://github.com/Rolodex-PRM/rolodex/tree/main/plugin-sdk):

   ```sh
   npx rolodex-plugin create
   npx rolodex-plugin validate
   ```

2. **Publish** a public GitHub release. Tag it with the plugin version (for example `v1.0.0`). Put `rolodex-plugin.json` and the HTML page at the repository root (or in one folder if you set `path` in the entry).

3. **Hash** the tag archive Rolodex will download:

   ```sh
   curl -sL "https://github.com/<owner>/<repo>/archive/refs/tags/v1.0.0.zip" | shasum -a 256
   ```

4. **Open a PR** that adds only `registry/plugins/<id>.json`. Copy [`schema/example-entry.json`](./schema/example-entry.json). Do not edit `dist/` — it is generated on merge.

### Entry checklist

- [ ] Filename is `<id>.json` and matches the `id` field
- [ ] `id`, `version`, `entry`, and `rolodex` match `rolodex-plugin.json` in the release
- [ ] `repo` is `owner/name`
- [ ] `release` is the git tag (for example `v1.0.0`)
- [ ] `sha256` is the SHA-256 of that tag’s `.zip` archive
- [ ] `rolodex` is a range such as `>=0.1.0 <1.0.0`
- [ ] You did not change `dist/`

See [`schema/plugin-entry.schema.json`](./schema/plugin-entry.schema.json) for the full shape.

## Local checks

```sh
npm install
npm run validate          # all entries, or pass a path
npm run aggregate         # rebuild dist/index.json
```

## License

MIT for the registry metadata in this repository. Each plugin keeps its own license (declared in its entry).
