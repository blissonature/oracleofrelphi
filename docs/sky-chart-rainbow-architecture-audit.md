# Sky Chart / Rainbow Brand architecture audit

Baseline: `agent/relationship-restored-c771` at `5f421e50a598380a1a3579d7a04c663201b25c76`.

## Executive finding

The defect is overlapping ownership, not a missing debounce. The current page loads 72 Sky Chart scripts for the deterministic comparison fixture. Six modules participate directly in wheel interaction or its repair, and expanded relationships have multiple render/reveal/decorate owners. A bounded local run averaged 6.988 ms per synthetic pointer transition and 388.11 ms per row expansion; the requested 1,000-hover/100-expansion baseline did not complete within 45 seconds.

## Ownership map

| Responsibility | Current owners | Finding |
| --- | --- | --- |
| Wheel hover | `sky-chart-foundation-interactions-v2.js`, `sky-chart-hover-fast-path-v1.js`, `sky-chart-hover-motion-priority-v1.js` | Three owners: nearest-line calculation, cached direct paint, then delayed event replay. |
| Wheel selection | foundation interactions, relationship-state contract, selected-relationship bridge/panel | Selection exists in JS variables, line datasets, row ARIA, root datasets, and a separate panel. |
| Relationship highlighting/filtering | foundation interactions, fast path, orb control, multiselect controllers, relationship-state contract | Hover and committed filters share the same broad filter event; several consumers rescan all rows/lines. |
| Row expansion | `sky-chart-inline-relationship-v5.js`, selected-relationship renderer, expanded-header repair | Expansion is delegated globally and then repaired by observers. |
| Progressive reveal | inline relationship v5 plus inline-progressive v3; selected panel has progressive-reveal v1 | Two different expanded-row reveal models and a third selected-panel model. |
| House decoration | house-medallion v1 plus inline-progressive v3 | The fixed-track visual solution is correct; runtime decoration is observer-driven, including one observer per row. |
| Tarot navigation | historical Card Row, historical Sky inspector, inline anchors/startup URL rewriting/navloader, and `tarot-card-deep-link-v1.js` | The stable historical primitive is canonical `card_id` passed to `openFullEntryById`; recent deep links regressed by polling and synthetic clicks instead of exposing that operation. |

## Tarot exact-identity archaeology

The recovered history changes this boundary from greenfield design to regression recovery:

- At `836c33a`, Card Row/Drawing Board card surfaces carried canonical `card_id` values in `data-card-id` or `data-row-card`. Their event handlers called the scoped `openFullEntryById(id)` directly. No search term, shorthand, result matching, or URL click proxy participated.
- `openFullEntryById` resolved the ID with `cardById`, assigned `state.selected`, switched to the Ledger browse panel, and rendered the existing `cardDetailHtml(card)` full entry. This exact selected-card operation remains present at the authoritative head.
- The historical Sky relationship inspector passed the same canonical card identity through `data-ledger-card`; the monolithic Sky/Tarot application path resolved it with `cardById` and reused `cardDetailHtml` in `openDedicatedSkyCardInspector`. The robust part was the identity/resolver/renderer chain. The fragile part was coupling Sky presentation to the monolithic Tarot application lifecycle.
- Commit `aab6942` moved expanded Sky cards to `tarot.html?card=<card_id>`, which is a valid public address adapter. Commits beginning at `08cb5db` then attempted to recover the destination through hidden proxy buttons, `.click()`, retries, and polling. Those scripts are the regression, not the source contract.
- Current fuzzy search behavior is intentionally broader than identity (for example, `4s` can match Four of Swords and King of Swords), so search cannot implement exact navigation.

Recovered contract: `openFullTarotEntry(cardId, presentationMode)` is an exact-ID operation over the Ledger's existing `cardById` and full-entry renderer. URL/hash/query handling is only an input adapter. Presentation (`ledger` or `inspector`) is secondary and must not change identity resolution.

## Event map

- Pointer movement: foundation `pointermove` performs nearest-aspect work and `applyState`; fast path independently handles `pointerover`/`pointermove`; motion-priority captures document pointer events and delays `relphi:sky-foundation-filter-changed` by 90 ms.
- Hover settlement: motion-priority re-dispatches the same broad filter event after its quiet timer.
- Selection: foundation click/keyboard changes `lockedState`; the state contract separately marks selection intent on `pointerdown`/keyboard; selected panel and inline row expansion respond through other listeners.
- Filter changes: placement, house, aspect, zodiac, and orb controllers emit separate events. The relationship-state contract and orb controller translate them into whole-list/whole-wheel reconciliation.
- Harmonic window: `relphi:sky-orb-limit-changed` can trigger a full foundation render; the ceiling/prune modules then construct a broad candidate set and delete out-of-constitution lines after rendering; orb control separately toggles row/line visibility.
- Foundation rerender: `relphi:sky-foundation-ready` fans out to at least twelve audited modules, many of which schedule scans or DOM repair.
- Row expansion: a capture-phase document click schedules `open(row)` on the next frame; progressive and header observers discover and decorate the resulting DOM.

## Hot path

The legacy nearest-aspect path reads `getComputedStyle`, calls `getScreenCTM`, creates SVG points, and scans visible aspect lines. The fast path reduces some of that through caching, but still runs alongside the legacy owner and broadcasts secondary synchronization. `applyState` scans every focus node, ledger row, and relationship row. Relationship-state synchronization later scans every row and every aspect line again and reads computed row style.

The audited 21 files contain 80 listener registration sites, 10 `MutationObserver` construction sites, 36 `querySelectorAll` sites, 8 explicit layout/style reads, 24 animation-frame scheduling sites, 6 timeout sites, and one interval site. These are static call-site counts, not claims that every site is active simultaneously.

## Observer map

- Startup mode: one whole-document subtree observer for exact-preview link rewriting and one root-attribute observer. It also monkey-patches `Storage.prototype.getItem`.
- Relationship layout: list child observer plus `IntersectionObserver`; fallback painting reads list and row rectangles.
- Inline progressive reveal: list subtree observer that re-decorates all expanded rows.
- Expanded header: list subtree/attribute observer that normalizes row DOM and can react to its own repair writes.
- House medallions: one list observer plus one coordinate observer per relationship row. The fixed-track geometry is good, but observer count scales with row count.
- Relationship-state contract: document-root subtree/attribute observer followed by whole-row/whole-line reconciliation.
- Orb control: filter-container child observer followed by whole-row/whole-line scans.
- Foundation selection clearing: transient subtree observer used to keep clearing selection marks.

Observers are usually disconnected when their owning list reference changes, but per-row medallion observers and broad root observers make runtime ownership and detached-node retention difficult to prove.

## State map

- JavaScript variables: foundation render signature/flags; foundation `hoverState`, `lockedState`, current relationships, and bound root; fast-path geometry/node caches; motion-priority timer/pending detail; selected index; inline `openRow`; observer queues; filter controller selections.
- DOM classes/attributes: `is-kept`, `is-selected`, `is-hovered`, `hidden`, filter-specific hidden classes, `aria-current`, `aria-expanded`, and selected-line attributes.
- `dataset`: relationship indexes/endpoints/harmonic values, interaction kind, selection policy, progressive field/stage, house decoration state, filter visibility counts, and candidate-prune status.
- Storage: Sky A, Sky B, last comparison mode, and adjacent saved/UI state. Placement records are canonical input; interaction state should not live in storage.
- Custom events: foundation ready/interactions ready/filter changed/clear selection; placement/house/aspect/zodiac changes; harmonic-window visibility; selected relationship rendered; progressive symbols ready; open Ledger card.

## Keep / rewrite / retire

Keep nearly as-is:

- Comparison-wheel visual geometry, canonical glyph rendering, red Sky A / blue Sky B language.
- The house-medallion fixed tracks: desktop 50 px + 18 px and mobile 48 px + 18 px. Preserve blob `54a7eccabaa824a950eaf348e28775cae11a7f71` until equivalent component tests prove parity.
- Lightweight `assets/tarot/rws-export/<card_id>.webp` imagery and restored Tarot proportions from `c771e15…`.
- The harmonic formulas and current six-degree phase-window calibration as behavior, while extracting them into a pure engine.

Rewrite:

- Relationship derivation as first-class immutable domain records with stable IDs, reduced harmonic fraction, signed/absolute errors, phase/coherence, context, provenance, and motion fields.
- Foundation relationship rendering to consume that model directly and produce native SVG hit strokes carrying relationship IDs.
- One interaction store and indexed delta renderer for hover, committed selection, expansion, progressive stages, and filters.
- Relationship tiles as one component; house medallions become component-owned markup rather than observer repair.
- Harmonic-window filtering as visibility/admission over one finite predeclared candidate universe.
- Tarot Ledger navigation as a public exact-ID wrapper over the existing `cardById` → `openFullEntryById` / `cardDetailHtml` chain, with URL initialization invoked at the end of Ledger initialization.

Retire after parity:

- foundation-interactions v2, hover-fast-path, hover-motion-priority, relationship-state contract, selected-relationship panel/bridge, inline-relationship v5, inline-progressive v3, expanded-header repair, candidate-prune, and observer-driven list-layout ownership.
- Tarot deep-link polling, timing retries, synthetic clicks, and exact-preview lifecycle interception.

## Measured authoritative baseline

Deterministic desktop fixture: 121 relationships/visible aspect lines and 121 hit strokes.

| Measure | Baseline |
| --- | ---: |
| 100 pointer transitions | 317.50 ms, then 381.30 ms |
| Mean pointer transition | 6.988 ms |
| 10 row expansion operations | 1,914.50 ms, then 1,966.60 ms |
| Mean row expansion | 388.11 ms |
| DOM additions/removals during bounded run | 4,246 / 3,932 |
| Long tasks | 4; worst 352 ms |
| List and original row identities | stable in bounded run |
| Full 1,000-hover/100-expansion run | did not complete within 45 seconds |

The baseline confirms that list reconstruction is not the only problem: observer-driven decoration and competing state/render owners create thousands of mutations even while top-level row identity remains stable.

## Replacement boundary

The replacement will use four explicit seams: pure `HarmonicEngine`; immutable `SkyChartModel`; one `SkyChartInteractionState`; indexed `ComparisonWheel` and `RelationshipTile` views. Pointer input will resolve `event.target.dataset.relationshipId`, update state, and apply only the old/new relationship delta. Tarot navigation will transmit a card ID to a real Ledger API. No harmonic derivation, DOM scan, storage parsing, or cross-application click simulation belongs in a pointer path.
