# Canonical glyph source intake

`intake-canonical-glyph-source.mjs` creates review evidence only. It never edits the installed v1 package or grants approval.

Master example:

```sh
node tools/intake-canonical-glyph-source.mjs --identity chiron --file incoming/chiron.svg --reference chiron-2x.png --output /tmp/chiron-review
```

Replacement review requires `--replacement-review`. Overlay intake uses `--overlay circled --z-order backplate`. Repeat `--identity`/`--overlay` and `--file` for a batch. The required final path is always derived from the 93-entry manifest; submitted filenames are ignored for destination purposes.

The tool performs strict structural auditing and optional six-viewport raster comparison. Passing either is review evidence, never approval. An external approval record may be attached with `--approval`, and shared geometry requires `--sharing-approval`; hashes and paths must match exactly.
