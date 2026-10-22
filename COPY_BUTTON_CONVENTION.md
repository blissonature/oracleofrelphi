# Oracle of Relphi — canonical Copy glyph (non-negotiable)

Every clipboard-copy action uses the **same one-path, optically centered, mirrored dual-rectangle SVG**. The foreground rectangle is **lower-left** and the background rectangle is **upper-right**. The source of truth is exactly one `<path>` in [`relphi-icons.svg`](./relphi-icons.svg), under the `#relphi-copy` symbol. **Do not redraw, mirror, substitute, rasterize, restroke, transform, or resize the icon in a consuming module.**

## Geometry contract
- Master viewBox: `0 0 24 24`; original line weight `1.9` units; round joins and caps; paired corners radius `1.8`.
- Canonical optical correction: `translate(-.28 .23)` belongs **inside the master path**. It was measured from rendered stroke opacity, then centered to the 24-unit canvas. Never apply a separate consumer transform to the graphic.
- A Copy button displays the master symbol at exactly **20 × 20 CSS pixels**, within a **34 × 32px** hit area (or the established 2.25rem Drawing Board icon-control box). Icon whitespace and drawing scale are always identical.
- **Center the actual SVG frame at 50%/50% of its button with absolute positioning and translate(-50%, -50%).** Clipboard handlers preserve hidden text nodes (e.g. "Copy"); a flex `gap` mistakenly moved the SVG 3px right in an earlier revision. Never allow anonymous invisible text items or a baseline to alter the icon position. The master path already supplies the optical correction within that frame.
- Suppress alternate icon `::before` and `::after` decorations. Copy controls must contain exactly one SVG; any owner-inserted competing icon is removed by the shared controller. Format buttons may use a text `::after` caption, never a second icon.
- All clipboard instances refer to `relphi-icons.svg#relphi-copy` through `<svg class="relphi-copy-icon" viewBox="0 0 24 24"><use href="relphi-icons.svg#relphi-copy"/></svg>`. No inline `<path>`, `<rect>`, CSS-mask SVG, encoded data URL, font glyph, or emoji is permitted as an alternate Copy mark.

## Interaction contract
- The visible button is icon-only when it is a single unambiguous clipboard action. Keep a real keyboard-accessible `<button>` with an action-specific `aria-label` and `title` (e.g., “Copy included relationships”).
- Success and failure are reported accessibly via the existing button's label, tooltip, and control color. **Do not swap the Copy glyph for a checkmark** or any other glyph; its geometry never changes.
- When separate actions for Copy Text vs Copy PNG coexist, retain the short format label **next to** the canonical icon. The icon itself is never modified.
- “Duplicate”, “Modify a copy”, “Create a copy” and similar operations are not clipboard-copy actions.
- The `relphi-copy-icon-convention-v1.js` decorator controls presentation only. Copy operations, serialization, and fallback clipboard handling remain with the owning tool; the decorator does not intercept clicks.

## Coverage and implementation
- The shared `navloader.js` loads the global presentation controller on every Relphi page, with direct inclusion on Sky Chart, Tarot/Drawing Board, and Planetary Hours where needed.
- Invocation Cards are whole-card clipboard actions with **an existing nested `.copy-icon`**. Decorate that existing nested affordance *only*. Do not also decorate the parent `button.question-card`, even if its tooltip begins with “Copy”; doing both previously created duplicated SVGs and repeated observer churn.
- Existing buttons are discovered by their Copy action, including dynamic buttons and `data-relphi-clipboard-action` opt-ins. Homepage Invocation Cards receive the **same** icon inside their clickable card without changing the whole-card copy behavior.
- The Relationships heading reflows based on available **panel** width so Copy and Download remain visible. No toolbar may clip an icon outside its container.

## Regression checks
- `tests/sky-chart-relationship-copy-toolbar-browser.mjs` checks toolbar containment across nine widths, unchanged relationship clipboard behavior, and the canonical SVG source.
- `tests/relphi-copy-canon-browser.mjs` checks only one path exists, no embedded duplicate drawing exists, every Copy button references the same sprite across pages and dynamic controls, and feedback cannot replace the glyph.
