# Sky Chart Replacement Audit

Status: initial architecture and feature audit

Working branch: `experiment/sky-chart-after-contextual-focus-v1`

Protected return point: commit `cfc3b920d72a5b198e6323064f2f3efafc998113`

## Replacement rule

The rainbow Sky Chart is the new rendering and interaction foundation. The production Sky Chart is a functionality reference only. Legacy rendering, target-switching, polling, and cross-script coordination must not be transplanted as the new architecture.

## Systems located

### Production entry point

- `sky-chart.html`
- Uses the shared Tarot application shell and loads `tarot-app.js`.
- Direct dependencies include:
  - `style.css`
  - `tarot-cards.js`
  - `relphi-locked-interpretations.js`
  - `relphi-card-senses.js`
  - `relphi-rising-sign-house-offset-effects.js`
  - `vendor/astronomy-engine/astronomy.browser.min.js`
  - `relphi-house-systems.js`
  - `tarot-app.js`
  - `navloader.js`

### Production page-specific enhancement chain

`navloader.js` dynamically adds the following Sky Chart scripts:

- `sky-chart-stability-hotfix.js`
- `sky-chart-static-dynamic.js`
- `sky-chart-aspect-duration-fix.js`
- `sky-chart-relationship-language.js`
- `sky-chart-canonical-relationship-ui-v1.js`
- `sky-chart-canonical-glyph-correction-v1.js`
- `sky-chart-related-relationships-v2.js`
- `sky-chart-sign-cusps-v1.js`
- `sky-chart-provenance-fix.js`
- `sky-chart-extra-points-support-v1.js`
- `sky-chart-calculated-points-v1.js`
- `sky-chart-special-vector-color-v1.js`
- `relphi-glyph-registry-v1.js`
- `relphi-glyph-component-v1.js`
- `relphi-moon-stroke-preservation-v1.js`
- `relphi-neptune-cross-connection-v1.js`
- `sky-chart-wheel-canonical-component-v1.js`
- `sky-chart-wheel-marker-interaction-v1.js`
- `sky-chart-builder-v4-unlock.js`
- `sky-chart-builder-v4.js`
- `sky-chart-builder-v4-defaults.js`
- `sky-chart-language-cleanup.js`
- `sky-chart-aspect-keyboard.js`
- `sky-chart-relationship-color-hints.js`

This confirms that the production chart is a layered system rather than a single application module.

### Rainbow foundation

- `sky-chart-next.html`
- `sky-chart-next.css`
- `sky-chart-next.js`
- `sky-chart-next-glyphs.js`
- `sky-chart-next-aspects.js`
- `sky-chart-next-focus-targets.js`
- canonical glyph registry/component and Moon/Neptune adapters

The rainbow foundation currently owns a clean SVG wheel, two rainbow house rings, one fixed zodiac, collision-managed placements, canonical glyph consumers, one shared central aspect space, degree ticks, and contextual hover/click isolation.

## Confirmed production functionality

### Sky creation and editing

- Explicit Sky A / Sky B target selection.
- Wizard and Advanced interfaces.
- New sky naming with automatic fallback names.
- Saved-sky name suggestions and conflict handling.
- Notes attached to saved skies.
- Manual placement builder.
- Placement paste parser/input.
- Edit and clear controls for each workspace slot.

### Calculation and enrichment

- Astronomy Engine-based planetary calculation.
- Date and local time input.
- IANA time-zone input and restoration.
- Typed location search.
- Browser geolocation (“Use Here”).
- Latitude/longitude entry.
- Coordinate-to-place/time-zone resolution.
- Metadata seeding from the currently edited sky.
- Reverse solve / infer date and place from placements.
- Attach calculation metadata to a sky.
- Planetary Hours settings handoff.
- Query-string handoff for date, time, coordinates, time zone, location, name, and auto-calculation.

### House systems

The production house engine exposes:

- Whole Sign
- Equal House
- Porphyry
- Placidus
- Alcabitius
- Regiomontanus
- Campanus
- Koch

It includes special handling for systems that can be undefined near polar latitudes.

### Persistence and sky records

- Saved sky library in local storage.
- Separate Sky A and Sky B workspace slots.
- Session restoration for the wizard/controller state.
- Load saved sky.
- Save/update sky.
- Delete stored sky independently from clearing a slot.
- Preserve calculation profile and notes.
- Import sky text.
- Export selected sky placements as text.
- Clear selected sky.

### Single and comparison modes

- Single-sky state.
- Two-sky comparison state.
- Sky B is deferred until actual placements exist.
- Slot identity is distinct from saved-record identity.
- Production uses two naming systems internally: `skyA` / `skyB` and legacy `chart` / `currentSky`.

### Placements and calculated points

Confirmed support includes ordinary planets and chart angles. Enhancement filenames and prior implementation history also identify:

- Rising / Ascendant
- Midheaven
- Descendant
- IC
- North Node / South Node
- extra calculated points
- special vectors
- retrograde status

The exact retained point list still needs line-by-line verification.

### Relationships

- Same-sky and cross-sky relationships.
- Aspect color system.
- Major and minor aspects, including at least conjunction, opposition, square, trine, sextile, quintile, biquintile, sesquisquare / sesquiquadrate.
- Orb display.
- Related-relationship selection behavior.
- Progressive relationship language.
- Plain-language meanings followed by astrological terminology.
- Chart Axes section for ASC–Descendant, MC–IC, and Node-axis oppositions.
- Angular Frame section for ASC/Descendant-to-MC/IC squares.
- Structural axes are excluded from the ordinary relationship count.
- Keyboard support for aspect interaction.

The full aspect catalog and per-aspect orb rules still require direct verification.

### Output and surrounding interface

- Unified chart output region.
- Sky cards / summaries.
- Results toolbar.
- Export reading.
- Placement export/import.
- Inspector/relationship content.
- Responsive behavior inherited from the production application styles.
- Canonical glyph loading and marker interaction.
- Planetary Hours portal/handoff behavior.

## Already present in the rainbow foundation

- Clean independent page instead of Tarot Ledger shell.
- One explicit visual Sky A and Sky B composition.
- Fixed zodiac with two independently rotated rainbow house systems.
- Whole Sign and Equal House demonstration switching.
- Canonical planetary and zodiac glyph rendering.
- Placement collision avoidance with local and global passes.
- Accurate true-longitude leader anchors despite displaced display glyphs.
- Shared central aspect space.
- Major cross-sky aspects with a demonstration orb.
- Inward-facing aspect-degree ticks.
- Hover highlighting.
- Click/tap isolation.
- White-space clearing.
- Contextual retention of applicable signs, houses, placements, leaders, and directly connected aspects.
- Responsive three-column-to-stacked shell.

## Missing from the rainbow foundation

### Data and state

- User-created sky data.
- A formal shared sky schema.
- Editing workflow.
- Dynamic placement sets.
- Retrograde data.
- axes and extra points.
- calculation profiles.
- persisted libraries and workspace restoration.

### Calculation

- Astronomy Engine integration.
- location and time-zone services.
- all eight production house systems.
- enrichment and reverse-solving.
- calculated axes/points.

### Application workflows

- create/load/save/edit/delete/clear.
- paste/manual entry synchronization.
- single-sky mode with comparison hidden.
- comparison creation workflow.
- import/export/share.
- Planetary Hours handoff.

### Relationship system

- same-sky relationships.
- full production aspect catalog.
- production orb rules.
- Chart Axes and Angular Frame structural groups.
- relationship counts, filters, language, and keyboard semantics.
- relationship detail/progressive reveal.

### Presentation

- real sky metadata and cards.
- comprehensive ledgers.
- chart controls and filters.
- production-grade accessibility audit.
- exportable reading presentation.
- mobile interaction verification with real data density.

## Architectural risks found

1. **Monolithic legacy core.** `sky-chart.html` loads the 9,000+ line `tarot-app.js`, which also contains unrelated Tarot application behavior and embedded card assets.
2. **Enhancement stacking.** The production chart depends on many scripts that patch or reinterpret earlier output after render.
3. **Dual naming/state models.** New builder slots (`skyA`/`skyB`) bridge to legacy targets (`chart`/`currentSky`). Past defects show that target synchronization can overwrite the wrong sky.
4. **DOM-mediated state.** Parts of the builder synchronize by clicking hidden legacy controls and reading rendered output rather than using one authoritative application state.
5. **Renderer replacement layers.** The canonical wheel is itself loaded as a later correction over the legacy wheel, which is exactly the architecture the do-over must avoid.
6. **Feature coupling.** Chart functionality currently reaches into Tarot correspondences, Planetary Hours storage, location services, relationship-language passes, and export systems.
7. **Glyph adapter debt in the rainbow prototype.** The current rainbow glyph adapter still needs a later architecture review against complete canonical inscribed masters; it must not be described as the final canonical asset pipeline yet.

## Proposed migration stages

### Stage 0 — lock contracts before migration

- Define the canonical `Sky`, `Placement`, `Axis`, `HouseFrame`, `Aspect`, `CalculationProfile`, and `SavedSkyRecord` schemas.
- Decide the retained body/point list and aspect list.
- Decide whether Tarot-card correspondences are core Sky Chart data or a separate optional presentation module.

### Stage 1 — convert the rainbow demonstration to data-driven rendering

- Remove hard-coded demonstration skies from the renderer.
- Give the renderer one explicit input contract.
- Preserve its geometry, visual hierarchy, collisions, aspects, and focus behavior.
- Support true single-sky and two-sky states.

### Stage 2 — add a clean state controller

- One state object for Sky A, Sky B, active selection, display preferences, and calculation status.
- No hidden legacy controls, polling, synthetic clicks, or target-name translation.

### Stage 3 — recover creation and editing

- Load saved sky.
- Create through date/time/location or placements.
- Manual and pasted placements as two editors for the same sky record.
- Edit, clear, delete, and save without confusing record identity and workspace slot identity.

### Stage 4 — calculation and enrichment

- Integrate Astronomy Engine behind a calculation service.
- Integrate the existing house-system engine through a stable adapter.
- Add axes, retrogrades, extra points, metadata, and error states.

### Stage 5 — full relationship engine

- Port calculations as pure data operations.
- Add retained major/minor aspects and orb rules.
- Add same-sky, cross-sky, Chart Axes, and Angular Frame groups.
- Connect existing contextual focus behavior to the complete relationship graph.

### Stage 6 — persistence and interchange

- Saved library migration/compatibility.
- Import/export text.
- reading export.
- URL and Planetary Hours handoffs.

### Stage 7 — surrounding interface and correspondence layers

- Production-quality sky cards, ledgers, inspectors, filters, progressive relationship language, and optional Tarot correspondences.

### Stage 8 — parity verification and controlled replacement

- Feature checklist.
- calculation fixtures.
- saved-library migration tests.
- desktop/mobile/touch/keyboard testing.
- rollback verification.
- explicit approval before replacing `sky-chart.html`.

## Decisions needed before implementation

1. Which calculated points beyond the ten planets, Ascendant, Midheaven, Nodes, Descendant, and IC are required?
2. Which minor aspects and orb rules are canonical for the replacement?
3. Should Tarot decan/card correspondences remain inside Sky Chart or load as an optional module?
4. Must the replacement read all existing local-storage records without migration, or may it perform a one-time schema migration?
5. Which Planetary Hours links/settings are required in the first parity release?
6. Is reverse solving from placements a required parity feature or an experimental utility?

## Audit work still open

- Trace the exact production placement/body registry.
- Trace the full aspect catalog and orb policy.
- Trace saved record and export formats.
- Trace location/geocoding providers and failure behavior.
- Trace all Planetary Hours handoff fields.
- Trace the production wheel’s input/output contract.
- Trace relationship-language and progressive-disclosure structures.
- Trace mobile, keyboard, and accessibility behavior.
- Identify tests and fixtures already present in the repository.

No application functionality was changed during this audit commit.
