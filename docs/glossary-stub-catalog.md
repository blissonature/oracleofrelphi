# Astrology glossary combinatorial scaffold

**Status: unpublished, unindexed draft.** Do not merge or publish these reference files without approval, and never submit the unfinished catalog to Search Console.

Source of truth: `glossary-stub-catalog.js`; the stable placement IDs match `relphi-glyph-registry-v1.js` (including Anti-Vertex) and the 11 aspect IDs match `sky-chart-aspect-multiselect-v1.js`.

## Model and coverage

A reference stub has:

- First placement (21 choices), sign (12), house (12), optional Rx when astronomically meaningful.
- Aspect (11 choices).
- Second placement (21 choices), sign (12), house (12), optional Rx when meaningful.
- Relationship scope: transit-to-natal, intersky, or intrasky. Scope is a **qualifier**, not part of the headline 100,590,336 count.
- Stable ID, title, exact-sign-pair geometry flag, and **empty** fields for a short definition, combined interpretation, sign/house nuance, timing, and caveats.
- `publication.approved=false`, `indexable=false`, and `readyForSitemap=false`.

Base universe: 21 × 11 × 21 × 12 × 12 × 12 × 12 = **100,590,336 theoretical slots**, including many sign pairs that **cannot** produce the selected exact aspect. Retrograde qualifiers and other scopes are NOT counted in that number. Do not use the theoretical number as a count of physically possible actual chart relationships or quality articles.

## Architectural constraints

- A single catalog and deterministic `makeStub()` function stand in for 100 million files.
- The workbench `glossary-stubs.html` uses query parameters to address a particular stub in a shareable preview.
- All draft glossary pages carry `noindex` and appear in no sitemap until authorship and review are complete.
- A false `geometry.exactAspectPossibleFromSignPair` warns the writer that no exact aspect can occur with that sign pair.
- Sign and house combinations still need degrees, chart scope, house system, and accurate birth times; **do not auto-write predictions**.
- Astrological meanings should be written carefully, reviewed by a human, and selectively turned into **substantive static pages** for SEO, never doorway pages.
- Preserve Sky Chart's existing `noindex` and privacy settings.

## Usage

Open `glossary-stubs.html` and select the first placement, aspect, second placement, both signs/houses, and Rx conditions. Copy its permalink or JSON record.

Run `node tests/glossary-stub-catalog.mjs` to verify the catalog and `node tests/seo-glossary.mjs` to check draft search visibility.

Use `node tools/glossary-stub-batch.mjs --count` for base coverage or add bounded filters to get JSON:

```bash
node tools/glossary-stub-batch.mjs --source=uranus --aspect=opposition --target=part-of-fortune --sourceSign=gemini --sourceHouse=10 --targetSign=sagittarius --targetHouse=3 --sourceRx=1 --limit=1 --out=./drafts/uranus-fortune.json
```

This script writes only JSON to an explicitly named local path, never pages, commits, or sitemaps.
