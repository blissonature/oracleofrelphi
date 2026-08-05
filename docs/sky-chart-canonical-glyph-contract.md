# Sky Chart canonical glyph contract

Sky Chart must render only the approved canonical glyph masters.

## Immutable authored frame

Each glyph is an authored artboard. The complete artboard, including intentional white space, defines optical centering, position, and scale.

- Never crop to visible path bounds.
- Never call `getBBox()` or equivalent to refit the artwork.
- Never transform, scale, translate, recolor, thicken, thin, or otherwise edit individual paths, strokes, groups, or subcomponents.
- Never recreate or normalize the glyph geometry.
- Scaling is allowed only as a uniform transform of the complete authored artboard.

## Two canonical forms

Each identity has two authored forms with identical outer dimensions:

1. circled;
2. uncircled, with the circle absent and all other framing unchanged.

- Never draw, synthesize, or CSS-generate a circle.
- When a circled form is required, load the authored circled master.
- When an uncircled form is required, load the authored uncircled master.
- Aspect glyphs are uncircled.
- Zodiac glyphs are uncircled in the Sky Chart comparison contexts already specified by product design.

## Prohibited fallback paths

Sky Chart must not use:

- Unicode astrology symbols;
- icon fonts;
- text substitutes;
- procedural SVG geometry;
- generated circles;
- duplicate or local glyph registries;
- visible-bounds fitting;
- post-render resizing or recentering;
- path-level stroke or fill mutation;
- section-specific glyph renderers.

A missing canonical asset is a development error. It must not be silently replaced.

## Scope

This contract applies to every glyph-bearing Sky Chart surface, including:

- Sky A and Sky B cards;
- individual and comparison wheels;
- placement displays;
- relationship lists;
- selected relationships;
- dual-card comparison;
- progressive reveal;
- transit duration displays;
- Chart Hits;
- inspector dialogs;
- Planetary Hours heptagrams;
- filters, helper text, and mobile layouts.

## Change policy

Code that conflicts with this contract must be deleted from the active rendering path, not overridden by a later script or CSS rule. One canonical renderer must own glyph presentation throughout Sky Chart.
