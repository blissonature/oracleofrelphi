# Oracle of Relphi — Copy button convention

Copying information to the **clipboard** uses the standard **two overlapping rectangles** icon. This is the default for Sky Chart, Drawing Board, Planetary Hours, and future Relphi tools.

- Use an icon-only button for a *single clipboard action* rather than the word “Copy.” The visible icon is the shared, canonical vector in `relphi-copy-icon-convention-v1.css` (18px artwork inside a roughly 33px control).
- Every Copy icon button needs a descriptive `aria-label` and `title` such as **Copy visible relationships**, **Copy all questions**, or **Copy share link**, so users know *what* it copies. Keep keyboard access and visible focus.
- After successful copying, show a checkmark briefly; on failure show an error state. Both states need a meaningful accessible label. Clipboard code remains with the owning tool. The icon decorator must **not** replace or trigger the underlying clipboard action.
- Do not treat **Duplicate**, **Modify a copy**, **Create copy**, etc. as clipboard actions. Where multiple outputs are offered together (**Copy Text**, **Copy PNG**) and the format would be ambiguous, keep sufficient visible format names beside the shared Copy glyph.
- For a new clipboard-only control, add `data-relphi-clipboard-action` to its existing `<button type="button">`, include `relphi-copy-icon-convention-v1.css` and `relphi-copy-icon-convention-v1.js` on the page, and provide an action-specific accessible name. The shared decorator also adapts older owner-specific Copy buttons; it does not remove their text nodes or interfere with clipboard handlers.
- When the toolbar is crowded, reflow its controls into another row based on **available panel width**. Never silently clip Copy or Download outside its panel. The Relationships implementation uses a CSS size container and is regression-tested from narrow mobile through desktop widths.

## Regression contract

`tests/sky-chart-relationship-copy-toolbar-browser.mjs` verifies the standard glyph, accessible label, success feedback, unchanged Relationships serializer, dynamic controls, and non-overflow at 320, 390, 510, 540, 630, 740, 760, 900 and 1200px.
