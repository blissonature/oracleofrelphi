# Sky Chart preview rendering ownership

`sky-chart-wheel-glyph-preview-tuning-v1.js` is the sole owner of placement bubble positions, glyph placement, collision spacing, bubble radius, and leader geometry.

`sky-chart-wheel-glyph-preview-v1.js` owns only interaction state: tooltip, hover/focus foreground order, and the preview badge.

Interaction code must not move or resize SVG markers, rebuild leaders, append finalizer scripts, or mutate the stored placement data.
