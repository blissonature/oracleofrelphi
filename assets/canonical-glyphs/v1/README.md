# Canonical glyphs v1 staging

Review-only, incomplete, fail-closed source package. It contains 38 available masters out of 93: 33 exact static masters and 5 approved masters with documented raster differences. The remaining 55 identities are unavailable: Moon remains a failed-equivalence identity and 54 identities remain blocked on font/text-backed authority artwork.

The exact Circled backplate is available. Day-ruler, hour-ruler, and combined day-and-hour overlays remain unavailable. Nothing in production consumes this directory.

The five approved-difference masters are Sun, Jupiter, Pluto, Virgo, and Capricorn. Their exact hashes, approval evidence, and non-zero raster comparisons are recorded under `approvals/`; they are not classified as exact-equivalence sources.

Validate with `node tools/verify-canonical-source-package.mjs <this-directory>`.
