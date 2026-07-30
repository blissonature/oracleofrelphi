# Sky Chart Replacement — Stage 0 Data Contracts

Status: proposed contracts for review before implementation

Working branch: `experiment/sky-chart-after-contextual-focus-v1`

Protected return point: `cfc3b920d72a5b198e6323064f2f3efafc998113`

## Purpose

The rainbow Sky Chart will become data-driven without inheriting the production chart's hidden controls, target translation, DOM polling, or renderer-replacement layers.

The renderer receives normalized chart data. It does not calculate astronomy, manage storage, parse text, resolve locations, or own saved-record identity.

## Core rule

The application owns truth. The renderer owns presentation.

The application may ask the renderer to display:

- no sky;
- Sky A only;
- Sky A and Sky B;
- calculated relationships;
- a current focus/selection state.

The renderer returns interaction events. It does not mutate the source sky records.

## Coordinate convention

All celestial positions use one normalized tropical ecliptic longitude:

- decimal degrees;
- `0 <= longitude < 360`;
- Aries begins at `0`;
- Taurus begins at `30`;
- and so forth.

Degree/minute/sign fields are presentation and editing forms derived from longitude. They must not become competing sources of truth after normalization.

## Identity conventions

Three identities must remain separate:

1. **Workspace slot** — `A` or `B`.
2. **Sky instance** — a sky object currently loaded into a slot.
3. **Saved record** — an optional persistent library record.

Editing Sky A must not imply that a saved record has been changed until the user explicitly saves. Clearing a slot must not delete its saved record.

## `SkyChartDocument`

The complete application state passed toward rendering and surrounding interface modules.

```js
{
  schemaVersion: 1,
  mode: 'empty' | 'single' | 'comparison',
  skies: {
    A: Sky | null,
    B: Sky | null
  },
  relationships: RelationshipGraph,
  display: DisplayPreferences,
  focus: FocusState
}
```

Rules:

- `empty`: both slots are null.
- `single`: Sky A exists; Sky B is null.
- `comparison`: both skies contain valid placements.
- An empty Sky B is never activated merely because the user has begun creating it.

## `Sky`

One complete sky independent of workspace slot and saved-record identity.

```js
{
  id: 'runtime-generated-stable-id',
  name: 'My birth chart',
  notes: '',
  source: 'calculated' | 'manual' | 'pasted' | 'imported' | 'saved',
  placements: Placement[],
  axes: AxisSet,
  houseFrame: HouseFrame | null,
  calculationProfile: CalculationProfile | null,
  provenance: Provenance,
  createdAt: 'ISO-8601 timestamp',
  updatedAt: 'ISO-8601 timestamp'
}
```

Required for rendering:

- `id`;
- `name`;
- at least one valid placement.

A sky can exist without houses when placements were entered without sufficient location/time information. The interface must explicitly show that the sky is unenriched rather than silently inventing houses.

## `Placement`

A celestial body, calculated point, angle, or supported vector at one exact longitude.

```js
{
  id: 'sun',
  kind: 'planet' | 'angle' | 'node' | 'point' | 'vector',
  label: 'Sun',
  longitude: 195,
  retrograde: false,
  house: 2,
  metadata: {}
}
```

Rules:

- `id` is a canonical registry identity, not display text.
- `longitude` is authoritative.
- `house` is derived from `houseFrame.cusps`; it may be null when no house frame exists.
- `retrograde` is boolean or null when not applicable/unknown.
- Renderer collision displacement never changes `longitude`.
- Display position is renderer-owned ephemeral geometry and is never written back into the sky.

Proposed initial retained identities, pending exact production registry verification:

- `sun`, `moon`, `mercury`, `venus`, `mars`, `jupiter`, `saturn`, `uranus`, `neptune`, `pluto`;
- `ascendant`, `descendant`, `midheaven`, `imum-coeli`;
- `north-node`, `south-node`.

Additional production points and special vectors remain an open registry decision.

## `AxisSet`

Structural chart axes are modeled separately from ordinary placements and ordinary aspect counts.

```js
{
  ascendant: 168.3833,
  descendant: 348.3833,
  midheaven: 76.2833,
  imumCoeli: 256.2833,
  northNode: 40.3,
  southNode: 220.3
}
```

Each value may be null when unavailable.

Rules:

- Descendant is opposite Ascendant when Ascendant exists.
- IC is opposite Midheaven when Midheaven exists.
- South Node is opposite North Node when North Node exists.
- Structural oppositions and the angular frame can be represented in `RelationshipGraph.structural`, not duplicated as ordinary relationships.

## `HouseFrame`

The complete calculated or entered house system for one sky.

```js
{
  system: 'whole-sign',
  label: 'Whole Sign',
  cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
  ascendant: 168.3833,
  midheaven: 76.2833,
  calculationStatus: 'complete' | 'partial' | 'undefined' | 'not-calculated',
  note: 'Whole-sign houses start at zero degrees of the rising sign.'
}
```

Rules:

- `cusps` contains exactly 12 normalized longitudes in house order 1–12.
- Renderer rotates/draws from supplied cusps; it does not independently recalculate them.
- Supported production systems are Whole Sign, Equal House, Porphyry, Placidus, Alcabitius, Regiomontanus, Campanus, and Koch.
- Undefined polar-latitude results remain explicit error/status data; no silent fallback unless the user chooses one.

## `CalculationProfile`

Inputs and outputs needed to reproduce or explain a calculated sky.

```js
{
  dateTimeLocal: '1985-10-08T04:37',
  timeZone: 'America/New_York',
  utcInstant: '1985-10-08T08:37:00.000Z',
  location: {
    label: 'Malden, Massachusetts',
    latitude: 42.4251,
    longitude: -71.0662
  },
  houseSystem: 'whole-sign',
  engine: {
    name: 'Astronomy Engine',
    version: null
  },
  calculatedAt: 'ISO-8601 timestamp'
}
```

Rules:

- Local wall time, IANA time zone, and resulting UTC instant are all preserved.
- Longitude inside `location` is geographic longitude and must never be confused with placement longitude.
- Location-service responses are metadata inputs, not renderer concerns.
- Planetary Hours handoffs populate this structure through an adapter.

## `Provenance`

Explains where the sky data came from and what has changed since calculation/import.

```js
{
  origin: 'astronomy-engine' | 'manual-entry' | 'paste-parser' | 'text-import' | 'saved-library',
  importedFormat: null,
  sourceRecordId: null,
  modifiedAfterCalculation: false,
  warnings: []
}
```

This replaces production-era provenance patches with explicit data.

## `SavedSkyRecord`

Persistent library wrapper around a sky snapshot.

```js
{
  schemaVersion: 1,
  recordId: 'persistent-generated-id',
  name: 'My birth chart',
  notes: '',
  sky: Sky,
  createdAt: 'ISO-8601 timestamp',
  updatedAt: 'ISO-8601 timestamp'
}
```

Rules:

- `recordId` is stable even when the name changes.
- Workspace slot is not stored as part of record identity.
- Loading creates a working sky instance associated with `sourceRecordId`.
- Saving may update the associated record or create a new record by explicit user choice.
- Deleting a record and clearing a workspace slot are different operations.

Legacy saved records will require an adapter or one-time migration after their exact format is fully traced.

## `AspectDefinition`

Canonical configuration, separate from calculated relationships.

```js
{
  id: 'trine',
  label: 'Trine',
  angle: 120,
  defaultOrb: 3,
  colorToken: 'aspect-trine',
  category: 'major' | 'minor'
}
```

The exact retained aspect registry and orb policy remain unresolved. They must be verified from production before the replacement claims parity.

## `Relationship`

One calculated relationship between two exact endpoints.

```js
{
  id: 'A:sun|B:jupiter|trine',
  scope: 'within-A' | 'within-B' | 'between-skies',
  group: 'ordinary' | 'chart-axis' | 'angular-frame',
  aspectId: 'trine',
  exactAngle: 120,
  separation: 119.4,
  orb: 0.6,
  applyingState: 'applying' | 'separating' | 'unknown',
  from: { sky: 'A', placementId: 'sun', longitude: 195 },
  to: { sky: 'B', placementId: 'jupiter', longitude: 75.6 }
}
```

Rules:

- Relationship endpoints use true longitude, never displaced display coordinates.
- Structural axes may use axis endpoint identities while still sharing this normalized shape.
- Language/progressive disclosure is a presentation module consuming this data, not embedded in the calculation result.

## `RelationshipGraph`

```js
{
  ordinary: Relationship[],
  structural: Relationship[],
  byPlacement: {
    'A:sun': ['relationship-id']
  },
  counts: {
    ordinary: 0,
    structural: 0,
    betweenSkies: 0,
    withinA: 0,
    withinB: 0
  }
}
```

The indexes allow current focus behavior without repeatedly searching rendered DOM nodes.

## `DisplayPreferences`

```js
{
  showHouses: true,
  showDegreeTicks: true,
  showAspects: true,
  relationshipScopes: ['between-skies'],
  aspectIds: ['conjunction', 'sextile', 'square', 'trine', 'opposition'],
  dimOpacity: 0.1,
  progressiveLanguageLevel: 'glyphs' | 'names' | 'referents'
}
```

Display preferences never remove data from the sky or relationship graph.

## `FocusState`

```js
{
  type: null | 'sign' | 'house' | 'placement' | 'relationship',
  key: null | 'virgo' | 'A:2' | 'A:sun' | 'relationship-id',
  source: null | 'hover' | 'pointer' | 'keyboard'
}
```

The application/controller resolves the related context from the relationship graph and sky data. The renderer applies visual emphasis to the supplied resolved focus model.

## Renderer input contract

Proposed public interface:

```js
renderSkyChart({
  mount,
  document: SkyChartDocument,
  onInteraction(event) {}
});
```

Interaction events:

```js
{ type:'select-sign', sign:'virgo' }
{ type:'select-house', sky:'A', house:2 }
{ type:'select-placement', sky:'B', placementId:'moon' }
{ type:'select-relationship', relationshipId:'...' }
{ type:'clear-focus' }
```

The renderer must not:

- read or write local storage;
- parse placement text;
- calculate planets, axes, houses, or aspects;
- infer Sky A/Sky B from hidden target names;
- click legacy controls;
- poll DOM output;
- mutate saved records;
- write collision-adjusted display positions into source data.

## Service boundaries

Proposed modules outside the renderer:

- `sky-state-controller` — authoritative workspace and focus state;
- `sky-normalizer` — validates and normalizes imported/manual placement forms;
- `sky-calculation-service` — Astronomy Engine and calculated points;
- `house-frame-service` — adapter around `relphi-house-systems.js`;
- `relationship-engine` — pure relationship calculations and indexes;
- `sky-library` — persistence and legacy migration;
- `sky-text-codec` — paste/import/export formats;
- `sky-handoff-adapter` — URL and Planetary Hours exchange;
- `sky-language-presenter` — progressive relationship wording;
- `sky-correspondence-presenter` — optional Tarot/decan correspondence layer.

## Validation requirements before Stage 1

Stage 1 may begin only after confirming:

1. Whether axes are represented both in `placements` and `axes`, or only in `axes` with renderer adapters. The recommendation is separate `axes`, exposed as endpoint-like objects to relationship/render modules when needed.
2. The exact retained body/point registry.
3. Whether house assignments are stored as cached derived data or recomputed whenever a house frame changes. Recommendation: recompute and treat stored `house` as a cache only.
4. The full aspect registry and orb policy.
5. Legacy saved-record compatibility strategy.
6. Whether Tarot correspondences remain optional presentation rather than core sky data. Recommendation: optional presentation.

## Stage 1 implementation boundary

After approval, Stage 1 should change only the rainbow application so that:

- hard-coded demonstration skies move into a fixture file;
- `sky-chart-next.js` receives a `SkyChartDocument`;
- the same fixture reproduces the current visual result;
- single-sky mode is genuinely supported;
- no creation, storage, astronomy, location, or production UI is added yet;
- visual regression against the protected rainbow checkpoint is checked before continuing.

No application code is changed by this contract document.
