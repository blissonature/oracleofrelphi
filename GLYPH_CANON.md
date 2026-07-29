# Oracle of Relphi Glyph Canon

This file defines the permanent source of truth for glyph geometry throughout Oracle of Relphi.

## Authoritative source

The approved canonical system was established at commit:

`0d56ee7ec0ea0fc3e44debcb809afde09f3271ab`

The three authoritative files are:

- `relphi-glyph-registry-v1.js`
- `relphi-glyph-component-v1.js`
- `glyphs-unified-preview.html`

The machine-readable contract is `glyph-canon.json`.

## Two sanctioned presentations

There is one canonical master geometry with two presentations:

- **Plain**: the enclosing circle is hidden.
- **Inscribed**: the same glyph geometry is shown with its enclosing circle.

The plain and inscribed versions must retain identical fitting, centering, padding, scale, margins, and internal geometry. They are not separate drawings.

## Required usage

- Zodiac signs in a zodiac wheel's sign ring use the **plain** presentation.
- Planets, Chiron, nodes, angles, and calculated-point placement markers use the **inscribed** presentation.

## Prohibited substitutions

Do not:

- substitute Unicode text for an available canonical asset;
- recreate a glyph from memory;
- derive a new glyph set from a legacy wheel renderer;
- treat an older wheel component as the source of truth;
- modify plain and inscribed geometry independently.

Any future change to the glyph canon must update both this document and `glyph-canon.json` in the same commit.
