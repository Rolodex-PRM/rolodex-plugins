<!-- Adding or updating a plugin in the registry. -->

**Plugin:** <!-- id + link to your public GitHub repo -->

## Checklist

- [ ] I added or updated a single file: `registry/plugins/<id>.json` (the `id` matches the filename).
- [ ] I did **not** touch `dist/` — it is generated on merge.
- [ ] `repo`, `release`, and `sha256` point at a public GitHub tag archive.
- [ ] `id`, `version`, `entry`, and `rolodex` match `rolodex-plugin.json` in that release.
- [ ] `rolodex` is a range such as `>=0.1.0 <1.0.0`.
- [ ] `npm run validate` passes locally (or I understand CI will check the hash).

<!-- Tip: sha256 is of https://github.com/<owner>/<repo>/archive/refs/tags/<release>.zip
     See schema/example-entry.json for the exact shape. -->
