# Oracle of Relphi: repository working agreement

These instructions apply to **every page, application feature, component, and export**, not just Sky Chart.

## Change and approval workflow

1. Inspect the existing implementation, design-system sources, canonical assets, and relevant tests before editing.
2. Make all changes on a development branch. Never edit `main` directly.
3. Include a **clickable, branch-specific preview** with every code-change handoff. For website changes, use the GitHack development URL: `https://raw.githack.com/blissonature/oracleofrelphi/<branch>/<page>.html`. Also include the plain URL as a fallback. Do not substitute GitHub's source viewer or HTMLPreview. Confirm the page path exists and, where browser verification is available, test the preview. Explicitly disclose any verification limitation.
4. Let the owner inspect and request revisions. **Never merge into `main` without explicit approval for that particular merge.** A previous approval does not authorize later merges.
5. Provide a PR/review link for documentation or nonvisual changes; do not pretend those have a meaningful visual preview.

## Design-system contract

Read [docs/design-system-governance.md](docs/design-system-governance.md) before creating or modifying UI or export presentation.

- Preserve the owner's canonical glyph artwork, optical centering, and intentional scaling. Use `relphi-glyph-registry-v1.js` and `relphi-glyph-component-v1.js`; do not draw replacement glyphs, use lookalike Unicode, or bypass the registry.
- Reuse existing approved components and Sass tokens. Do not introduce arbitrary fonts, colors, buttons, links, or duplicate component styles.
- One visual asset or component used in multiple places must have one authoritative rendering/styling implementation; consumers may configure documented size/layout variants only.
- All exported artifacts must carry the canonical logo, **Oracle of Relphi**, and **oracleofrelphi.com**, using approved typography and styling. Preserve content legibility and format-specific safe areas.
- Existing nonconforming code is not approval to replicate the deviation. Identify it and migrate deliberately rather than inventing another variation.
- Add or update regression checks for canonical glyph usage, component reuse, brand compliance, and export attribution whenever the relevant code changes.

## Existing implementation anchors

- `styles/relphi-design-system.scss`, `styles/_tokens.scss`, `styles/_components.scss`
- `relphi-design-system.css` (compiled output; run `npm run styles:build` after Sass changes)
- `relphi-glyph-registry-v1.js`, `relphi-glyph-component-v1.js`
- `tools/check-single-glyph-canon.mjs`, `tests/relphi-design-system.test.js`

This is a project-wide contract. Do not treat these instructions as an invitation to redesign approved assets.
