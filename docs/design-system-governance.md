# Oracle of Relphi design-system governance

**Status:** foundational documentation, not a claim that all pages and exports are already compliant.

## Scope and governing principle

Applies to all pages, Sky Chart, Tarot Ledger, Drawing Board, other tools, mobile layouts, screenshots, PNG/SVG exports, PDFs, share graphics, and future formats.

**Decide once, reuse everywhere.** The owner's approved design is authoritative. New features compose canonical assets and components instead of inventing local substitutes.

## Verified existing foundation

The repository already has Sass authoring entry point `styles/relphi-design-system.scss` with `@use "tokens"` and `@use "components"`. `package.json` defines `npm run styles:build` and `npm run styles:watch`. The compiled artifact is `relphi-design-system.css`.

`styles/_tokens.scss` defines red, ink, surface, paper, muted, line, spacing, radius, control, and focus variables. **Some existing muted/surface tokens are warm neutrals; their presence is not permission to use brown for branded text or links.** Confirm approved use case by use case; do not arbitrarily change the existing palette.

`styles/_components.scss` already defines `.relphi-button`, `.relphi-button--primary`, `.relphi-button--quiet`, `.relphi-icon-button`, inputs, selects, tabs, cards, panels, drawers, fingerprints, badges, headings, and toolbars. Reuse these before adding variants.

The existing canonical glyph mechanism is `relphi-glyph-registry-v1.js` plus `relphi-glyph-component-v1.js`. `tools/check-single-glyph-canon.mjs` already guards against competing glyph sources; `tests/relphi-design-system.test.js` checks part of the Sass/component foundation.

## Canonical assets

- **Glyphs:** only the owner's master set, through the registry/component. Preserve intrinsic geometry, optical centering, visual weight, scale, and identities. Never substitute text glyphs, emoji, improvised SVG paths, or alternate asset folders.
- **Logo:** use the repository's approved logo master. **Audit and record the exact canonical asset path before implementing a centralized export header.** Do not invent a new logo or pick an unverified duplicate.
- **Brand identity:** display `Oracle of Relphi` and `oracleofrelphi.com` accurately.
- **Typography:** Montserrat is an owner-specified brand typeface; inventory existing font declarations and approved fallbacks before enforcing a universal font stack.
- **Color:** black/white/red brand foundation. Use approved tokens and intentional contextual colors (such as planetary colors) where part of the established visual language. No improvised brown links or unapproved text colors.

## One component, multiple contexts

A component's canonical implementation owns its structure and visual rules. Contexts may supply explicit variants such as size, density, and orientation; they must not fork geometry, glyph design, colors, or stroke styling.

Examples:
- Sky Card fingerprint and Saved Skies microheptagrams must share one renderer and styling contract, rather than two SVG algorithms that happen to look similar.
- Primary, secondary, tertiary/quiet, destructive, and icon buttons should be centrally specified and reused on all pages.
- Links, menus, labels, card chrome, focus states, and exported labels must use approved typography and tokens.

**Implementation follow-up:** audit Saved Skies and Sky Card SVG generation for remaining duplication. Shared CSS alone does not establish shared SVG ownership.

## Export identity contract

Every user-facing visual/document export must include, in consistent and legible form:
1. The canonical logo.
2. The name **Oracle of Relphi**.
3. **oracleofrelphi.com**.

Create one shared export-branding renderer or template system with format-aware layout variants (square, portrait, landscape, PDF, and any other supported output). The variants control placement and safe-area spacing, **not** the underlying logo, type family, color choices, or identity. Use the same approved glyph assets and component design as the application.

Audit all current export pathways first. Record export format, rendering library, logo source, font loading, URL placement, background, transparency, resolution, and any cross-origin/canvas restrictions. Test actual downloaded output, not just its on-screen preview.

## Enforcement plan

1. **Inventory:** map every page, component, export pathway, logo/font asset, and competing style implementation. Mark verified masters and unresolved decisions separately.
2. **Consolidate:** extend existing Sass tokens/components; compile the CSS; move repeated presentation rules to shared ownership; migrate consumers incrementally.
3. **Guard:** add CI checks for forbidden glyph sources, unapproved fonts, arbitrary brand colors, duplicate renderers, missing export identity, and Sass build drift. Avoid simplistic bans that flag legitimate planetary colors or artwork.
4. **Visual regression:** capture representative desktop/mobile pages, component states, Saved Skies/fingerprint parity, and exported artifacts. Require owner review for intentional visual changes.
5. **Protect workflow:** require PR review and branch protection where repository settings permit. Never merge without explicit owner approval, regardless of CI status.

## Definition of done for future UI changes

- Existing approved masters and tokens reused.
- New variants documented, not improvised.
- Relevant automated and visual checks pass (or failures are clearly disclosed).
- A clickable branch-specific preview accompanies the handoff; a PR link accompanies nonvisual changes.
- Owner approves before merge to `main`.

## Decisions to confirm from the repository audit

- Canonical logo asset path and any approved light/dark variants.
- Approved Montserrat weights, fallbacks, and all permitted typefaces.
- Exact primary/secondary/tertiary/destructive button specifications.
- Approved export-brand lockups and safe-area dimensions.
- Which legacy colors and CSS overrides are intentional versus technical debt.

Do not silently resolve these open items by inventing new design decisions.
