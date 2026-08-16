# Sky Chart interaction architecture audit

Baseline: `5f421e50a598380a1a3579d7a04c663201b25c76` on `agent/relationship-restored-c771`.

## Ownership map before replacement

- `sky-chart-foundation-v1.js`: chart records, ordinary-orb relationship candidates, wheel and placement-ledger structure.
- `sky-chart-foundation-interactions-v2.js`: a second chart/relationship model, relationship rows, wheel annotation, hover, locked selection, list synchronization, and global filter events.
- `sky-chart-hover-fast-path-v1.js`: a third relationship/index model and a capture-phase hover controller that preempts the foundation controller.
- `sky-chart-hover-motion-priority-v1.js`: intercepts the fast-path controller's global hover event and replays it after pointer quiet.
- `sky-chart-inline-relationship-v5.js`: expanded-row state, localStorage relationship reconstruction, cards, mini-wheel, and one three-state reveal controller.
- `sky-chart-inline-progressive-contract-v3.js`: a second expanded-row reveal controller, DOM repair/decorate passes, injected CSS, capture-phase event interception, and a list MutationObserver.
- `sky-chart-relationship-list-layout-v2.js` and `sky-chart-house-medallion-v1.js`: retained presentation helpers for compact-row composition and the known-good fixed-track medallions.
- Filter modules: retain ownership of explicit filter state. Harmonic math remains owned by `window.RelphiHarmonicOrb`.

## Measured baseline

Static hot-path instrumentation at the handoff head:

- Two `pointermove` controllers are attached to `#skyFoundationRoot`; both can attempt aspect hit testing.
- The legacy nearest-aspect path performs per-candidate `getComputedStyle`, `getScreenCTM`, `createSVGPoint`, and `matrixTransform` work.
- One hover transition can fan out through `relphi:sky-foundation-filter-changed` to more than a dozen listeners; several listeners schedule full relationship-row or wheel scans.
- Expanded relationship behavior is split across two document capture listeners and one subtree MutationObserver.
- Opening a row reconstructs both placements by parsing `relphiSkyChartA` and `relphiSkyChartB` from localStorage and scanning placement data.

The deterministic browser fixture is `tests/sky-chart-interaction-fixture.html`. Runtime before/after measurements are produced by the interaction stress test added with the replacement and include row identity, node counts, observer/controller counters, and per-transition timing.

The settled 130-relationship fixture completes 100 expand/reveal/collapse cycles and 1,000 hover transitions without replacing a relationship row, changing row count, retaining an expanded detail, or losing row/line identity. Representative local measurements were roughly 2–4 ms per complete expand/reveal/collapse cycle and 2–4 ms per synthetic hover-over/hover-out pair. Total document-node count is reported diagnostically but is not asserted because unrelated lazy canonical-glyph rendering continues in the background; component detail count and row identity are the bounded lifecycle assertions.

## Hot paths

1. Pointer movement enters both the fast path and the legacy foundation interaction path.
2. Aspect proximity can fall back to geometric scans instead of using the existing SVG hit line.
3. Hover broadcasts wake filter, layout, semantic, copy, medallion, and stability controllers.
4. Expanded rows are inferred and repaired from DOM mutations instead of being rendered from an explicit relationship model.
5. Relationship identity is the current array index, so downstream code reconstructs meaning from row datasets.

## Replacement architecture

- One `SkyChartInteractionCore` owns hover, locked wheel selection, expanded relationship, and the seven progressive reveal stages.
- Stable relationship IDs are derived from the two placement IDs, aspect ID, and precise orb.
- Chart semantics are derived only on a foundation render/data change.
- A view index maps relationship, placement, house, and sign IDs to their wheel, ledger, and row nodes.
- Every aspect gets a wide transparent SVG hit stroke carrying its relationship ID; pointer input resolves through `event.target` without geometry reads.
- State transitions diff the previous and next node sets. Hover paint is immediate and local. Global filter events are emitted only for committed selection/clear state.
- Expanded content receives the `Relationship` object directly. It never reparses localStorage, never observes itself, and keeps all seven reveal stages in core state.
- Mouse, pointer, touch/click, focus, Enter, Space, and Escape feed the same transition functions.

## Keep

- `sky-chart-foundation-v1.js` wheel geometry and established visual grammar.
- `sky-chart-harmonic-orb-v1.js` and the harmonic window/filter boundary unchanged.
- `sky-chart-house-medallion-v1.js`, including fixed 50/18 desktop and 48/18 mobile tracks.
- Lightweight `assets/tarot/rws-export/<card_id>.webp` relationship images.
- `sky-chart-relationship-list-layout-v2.js`, expanded-header presentation, relationship copy, and ordinary styles until they can consume an explicit lifecycle in a later cleanup.

## Retire

- `sky-chart-foundation-interactions-v2.js`
- `sky-chart-hover-fast-path-v1.js`
- `sky-chart-hover-motion-priority-v1.js`
- `sky-chart-inline-relationship-v5.js`
- `sky-chart-inline-progressive-contract-v3.js`
- `sky-chart-selected-relationship-wheel-bridge-v1.js` (native hit targets now belong to the core)
- `sky-chart-inline-expanded-header-v1.js` (its stable layout rules moved to the ordinary core stylesheet)
- `sky-chart-relationship-state-contract-v1.js` (the core now owns selection and row/line visibility directly)

They are removed from `sky-chart.html`; historical files remain in Git for reference.

## Invariants

- No harmonic formula or threshold change.
- No relationship-list reconstruction for hover, selection, expansion, or progressive reveal.
- One expanded row at a time; reopening starts from its retained reveal state only while that relationship remains in the current model.
- Progressive order remains placement, sign, house, aspect, placement, sign, house; every token advances symbol -> name -> referent.
- Tarot cards retain the c771 proportions and lightweight WebP source.
- House medallion fixed-track alignment is unchanged.
- Keyboard semantics, focus visibility, touch scrolling, and native links remain available.
