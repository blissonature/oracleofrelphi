# Rendered canonical vector baker

`bake-rendered-canonical-vectors.mjs` creates review-only, static `0 0 100 100` SVG candidates from a previously captured `live-circled-evidence.json`. It never fetches the live authority.

The baker fails closed. It rejects text/font artwork and unsupported SVG features, removes the captured presentation ring from plain masters, flattens supported transforms, scales all dimensional stroke attributes with the canvas conversion, and emits only paths, circles, and transformed rectangle paths. A candidate is written only after every required raster comparison has zero differing pixels and identical visible bounds.

The raster verifier requires the `sharp` package to be resolvable by Node. In the Codex workspace runtime, set `NODE_PATH` to the bundled `node_modules` directory before running the command.

```powershell
node tools/bake-rendered-canonical-vectors.mjs `
  --captures C:\path\to\live-circled-evidence.json `
  --repo C:\path\to\oracleofrelphi `
  --manifest C:\path\to\oracleofrelphi\glyph-canon-approved-source-manifest.json `
  --output C:\path\to\outputs\baked-canonical-candidates `
  --revision HEAD
```

Default validation sizes are 100, 400, and 1000 pixels at densities 1 and 2. Override them only for diagnostics with `--sizes` and `--densities`; approval runs must use the defaults.

The output directory contains:

- `masters/` — candidates nested beneath their final expected production paths;
- `overlays/circled.svg` — the independently calculated circled backplate, only if it passes the same exact gate;
- `manifest.json` — source hashes, output hashes, flattened transforms and stroke measurements, all raster results, classifications, and blockers;
- `report.md` — classification summary.

Generated output is intentionally not committed. The tool clears only the `masters/` and `overlays/` subdirectories of the selected review output before each run so a failed candidate cannot survive from an earlier run.
