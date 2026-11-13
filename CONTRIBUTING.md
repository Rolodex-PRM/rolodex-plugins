# Contributing a plugin

This repository lists plugins. It does not host plugin code.

## Steps

1. Create and validate your plugin with `@rolodex/plugin-sdk` (`rolodex-plugin create` / `validate`).
2. Push it to a **public** GitHub repository.
3. Create a release tag that matches the version in `rolodex-plugin.json` (for example `v1.0.0`).
4. Compute the SHA-256 of the tag archive:

   ```sh
   curl -sL "https://github.com/<owner>/<repo>/archive/refs/tags/v1.0.0.zip" | shasum -a 256
   ```

5. Fork this repository and add `registry/plugins/<id>.json` from [`schema/example-entry.json`](./schema/example-entry.json).
6. Open a pull request. CI checks the schema and the archive hash.

Do not edit `dist/`. Maintainers regenerate it on merge.

## Updating a listed plugin

Edit the same `registry/plugins/<id>.json` file: bump `version`, point `release` at the new tag, and set the new `sha256`. Keep `id` and `repo` stable.
