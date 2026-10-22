# Astrology placement-pair reference pages

## Scope

The directory at `astrology-pairs.html` links to **441 actual static HTML pages** in `astrology/pairs/`: each ordered pair of the 21 supported placement identities. A page for `uranus-part-of-fortune.html` handles transiting Uranus against natal Part of Fortune **and** natal Uranus / natal Part of Fortune. Its reverse `part-of-fortune-uranus.html` is distinct because the transit's moving endpoint changes.

The full list of eleven aspects is rendered in the *HTML source* of each page. A visitor can then choose one aspect and refine both placements with houses and optional zodiac signs and Rx motion; the query string stores the selection. This is an interpretation, not an ephemeris calculation.

## Search indexing

- Static pair pages and their directory have unique titles, descriptions, canonical URLs and `index,follow` metadata. The directory contains normal HTML links to all 441 pages.
- `sitemap.xml` contains the 441 pages, directory, homepage, and Astrology Foundations.
- The still-unfinished detailed glossary, worked draft, and enormous combinatorial stub workbench remain **noindex**, and are excluded from the sitemap.
- The public Sky Chart stays `noindex` to avoid indexing saved or private sky states.
- Google's indexing and rankings are not guaranteed. Search Central warns against scaled pages that add little unique value. Enhance pages with original, verified aspect-specific interpretations before expecting broad organic search performance. Do not create millions of thin sign/house permutations.

## Regeneration and verification

`tools/build-astrology-pairs.mjs` is the deterministic source of truth for placement descriptions and page structures.

```bash
node tools/materialize-astrology-pairs.mjs --write
node tests/astrology-pair-pages.mjs
node tests/seo-glossary.mjs
node tools/materialize-astrology-pairs.mjs --check
```

House, sign, scope and aspect controls live in `astrology-pair-interactions.js`. All pair pages link to the root asset directory through `<base href="../../">` so the same layout works on the live domain and raw.githack's exact-commit preview.

**Merge / deployment requires explicit approval.** The indexed pages in this draft branch are not yet in production.
