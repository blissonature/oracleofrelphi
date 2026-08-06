# Canonical source package verifier

`verify-canonical-source-package.mjs` is a read-only validator for a staged `relphi-canonical-source-package/v1` directory.

Run it with:

```powershell
node tools/verify-canonical-source-package.mjs C:\path\to\canonical-glyphs-v1-staging
```

The verifier reads `manifest.json` and referenced SVGs. It never writes, regenerates, commits, or pushes. A nonzero exit status means the package is not safe to promote.

Checks include the exact approved 93-identity set, deterministic ordering, fail-closed null paths, unique master paths, SHA-256 integrity, exact `0 0 100 100` artboards, prohibited SVG elements and attributes, accessibility labels, the five legal states, exact Circled geometry, and blocked status for unavailable ruler overlays.
