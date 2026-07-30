# Sky Chart Completed Investigation

Status: complete comparative investigation before clean-room implementation

Working study branch: `experiment/sky-chart-native-rebuild-v1`

Protected rainbow checkpoint: `cfc3b920d72a5b198e6323064f2f3efafc998113`

## Executive conclusion

The replacement must be a new native Sky Chart application.

It should preserve:

- the legacy application's useful domain capabilities;
- the rainbow prototype's approved wheel geometry, visual hierarchy, and interaction logic;
- the canonical Relphi glyph assets.

It should preserve neither implementation's accidental architecture.

The legacy Sky Chart must not be wrapped, patched, adapted, or used as a runtime dependency. The rainbow prototype must not simply be enlarged into a monolithic file or treated as a frozen component beneath another shell.

The correct approach is a clean-room application whose state, calculations, relationships, renderer, persistence, and interface are designed together from the beginning.

## 1. What the legacy Sky Chart is doing

### 1.1 Application shell

The production `sky-chart.html` is a specialized entry point into the shared Tarot application. It loads:

- the shared Tarot shell and styles;
- Tarot card and correspondence data;
- Astronomy Engine;
- the house-system engine;
- the large `tarot-app.js` core;
- a long chain of Sky Chart enhancement scripts from `navloader.js`.

The Sky Chart is therefore not one coherent module. It is the accumulated result of the core app plus many post-load modifications.

### 1.2 State and storage

The legacy system uses several overlapping identities and storage locations:

- workspace slot A: `relphiSkyChartA`;
- workspace slot B: `relphiSkyChartB`;
- saved library: `relphiSkyLibraryV1`;
- builder session: `relphiSkyBuilderV4State`;
- legacy target names: `chart` and `currentSky`;
- builder target names: `skyA` and `skyB`;
- separate static/dynamic role storage: `relphiSkyChartRoles`.

A saved sky record and a visible workspace slot are conceptually different, but the implementation repeatedly translates between them through storage, hidden controls, and rendered output.

### 1.3 Creation workflow

The legacy interface supports:

- guided Wizard and Advanced modes;
- load saved sky;
- create a sky with date, time, and location;
- use current date/location;
- paste placements;
- manually enter placements;
- optional naming and automatic fallback names;
- notes;
- name-conflict handling;
- special birth-chart setup;
- creation of a second comparison sky only after actual data exists.

The useful product principle is that date/time/location and direct placement entry are two ways to create the same kind of sky. The accidental implementation problem is that these workflows coordinate with older native controls rather than one state controller.

### 1.4 Calculation

The production calculation path uses Astronomy Engine for planetary positions and a separate Relphi house-system engine.

The house engine supports:

- Whole Sign;
- Equal House;
- Porphyry;
- Placidus;
- Alcabitius;
- Regiomontanus;
- Campanus;
- Koch.

It also reports systems that can be undefined at high latitudes rather than silently inventing cusps.

The calculated point pass adds or normalizes:

- North Node;
- South Node;
- Rising / Ascendant;
- Descendant;
- Midheaven;
- IC;
- mean Lilith;
- Vertex;
- Part of Fortune.

Chiron is supported as a pasted or supplied placement. The calculated-points script does not calculate Chiron itself.

The Part of Fortune formula switches between day and night based on the Sun's house. The node and Lilith implementations are explicitly mean values.

### 1.5 Placement parser and normalization

The legacy system accepts inconsistent names and aliases. Extra-point parsing recognizes aliases such as ASC, AC, Descendant, DSC, Vx, BML, POF, and several Node names.

Placement values may contain:

- sign;
- degree;
- minute;
- second;
- longitude;
- house;
- retrograde status;
- glyph;
- source;
- calculation description.

This flexibility is useful at the import boundary but should not remain the internal state format. A clean-room parser should accept aliases and immediately normalize them to canonical IDs and numeric longitude.

### 1.6 Renderer behavior

The legacy visible wheel is not rendered once from authoritative data.

The canonical placement renderer:

1. waits for a legacy SVG to appear;
2. searches it for `.chart-wheel-placement-stick` elements;
3. infers body identity from labels, glyph text, attributes, and classes;
4. infers Sky A/B/C from classes and labels;
5. finds contact dots or stick knobs;
6. transforms those points back into the root SVG coordinate system;
7. computes new display positions and collision shifts;
8. draws a new canonical glyph layer;
9. hides the original glyph and stick output;
10. observes DOM mutations and repeats the process.

This renderer is technically resourceful, but it is a reconstruction layer. It does not own the chart geometry or source data.

### 1.7 Sign and wheel corrections

Other scripts add sign cusp diameters, canonical markers, color corrections, extra point support, special-vector colors, provenance corrections, and interaction behavior after the original wheel has rendered.

These scripts frequently use MutationObserver because they do not control the original render lifecycle.

### 1.8 Relationships

The legacy relationship system contains useful product ideas:

- same-sky and between-sky relationships;
- static versus dynamic sky roles;
- aspect color coding;
- orb display;
- aspect duration language based on the moving planet;
- progressive glyph → name → meaning disclosure;
- body, sign, aspect, and element meanings;
- keyboard interaction;
- Chart Axes and Angular Frame structural groups;
- related-relationship selection.

Confirmed aspect vocabulary across the relationship layers includes:

- conjunction;
- opposition;
- square;
- trine;
- sextile;
- quincunx;
- semi-sextile;
- octile / semi-square;
- tri-octile / sesquisquare;
- quintile;
- bi-quintile.

The older language pass only handles six aspects, while the canonical relationship layer expands the catalog. This confirms that the production relationship system is also layered and that aspect definitions are not controlled from one source.

### 1.9 Relationship-language implementation

Relationship prose is generated first and then parsed and rewritten by later scripts.

The progressive-language script searches text for phrases such as “forms a square with,” extracts bodies, signs, degrees, owners, element notes, orb, and duration, then replaces that text with interactive tokens.

A later canonical pass parses the already-rewritten relationship again and replaces it with canonical glyph assets.

The clean-room application should generate progressive relationship UI directly from a relationship object. It should never need to parse its own prose to recover structured data.

### 1.10 Static and dynamic roles

The production application lets each sky be marked Static or Dynamic. This distinction controls duration language and is more general than assuming Sky A is always natal and Sky B is always transit.

This should be retained as explicit sky metadata, not inferred from slot identity or labels.

### 1.11 Provenance and handoffs

The legacy page can receive date, time, latitude, longitude, time zone, location, name, and auto-calculate flags through URL parameters. Planetary Hours uses this route.

A separate correction script exists because “Planetary Hours date” was previously supplied as a false default even when no Planetary Hours provenance existed.

The clean-room system must preserve explicit provenance and never infer a source merely from a workflow default.

### 1.12 Persistence and interchange

Confirmed production capabilities include:

- save and update a named sky;
- preserve notes and calculation profile;
- load saved sky into either workspace slot;
- clear a slot without deleting the saved record;
- delete a saved record;
- export placement text;
- import placement text;
- export a reading;
- restore session/workspace state.

The useful conceptual separation is:

- saved record identity;
- workspace slot identity;
- current edited draft.

The legacy implementation does not consistently enforce that separation.

## 2. What the rainbow Sky Chart is doing

### 2.1 Direct geometry

The rainbow wheel directly authors:

- one fixed zodiac band;
- an outer Sky A house ring;
- an inner Sky B house ring;
- house sectors and dividers;
- degree ticks;
- exact-longitude placement anchors;
- displaced display glyphs;
- leader lines;
- one central aspect chamber.

Everything is drawn in one known `1200 × 1200` SVG coordinate system. Nothing has to be rediscovered from rendered DOM geometry.

### 2.2 Placement collision system

Each placement retains its true longitude. The display glyph may move tangentially or to a neighboring radial lane to avoid collision. A leader returns to the true-longitude notch.

The approved version uses:

- fixed inner and outer degree radii;
- defined glyph footprint;
- defined notch clearance;
- three possible display lanes per sky;
- angular packing;
- leader-crossing penalties;
- global collision passes.

This is a strong architectural principle: truth coordinates and display coordinates are distinct but explicitly connected.

### 2.3 Central relationship geometry

The rainbow relationship system reads explicit placement longitude attributes and calculates major cross-sky aspects within the prototype orb.

It draws all relationships into one central chamber whose edge meets the inner ring. Inward-facing degree ticks identify the exact points where relationship lines begin.

This was approved because the relationship field reads as one geometric structure rather than two unrelated aspect rings.

### 2.4 Contextual interaction graph

The focus system treats the wheel as a relationship graph.

Selecting a placement keeps visible:

- the placement;
- its leader;
- its sign;
- its sky-specific house;
- its directly connected aspect lines;
- counterpart placements;
- counterpart signs and houses.

Selecting a sign or house keeps its placements and their direct relational context. Selecting an aspect keeps both endpoints and their contexts.

This behavior was explicitly refined after user feedback that isolated objects must retain their applicable houses, signs, and aspects.

### 2.5 Glyph pipeline

The rainbow prototype consumes the shared canonical registry/component, Moon preservation, and Neptune correction.

However, its `sky-chart-next-glyphs.js` still creates the inscription circle in code and calls the shared drawing component to produce the internal art. That is not yet the desired final “complete approved master file” architecture.

The clean-room build should consume complete canonical inscribed and uncircled masters as assets/components without manufacturing the circle per placement and without per-consumer fitting exceptions.

### 2.6 Current limitations

The approved rainbow checkpoint is still a prototype. It lacks:

- user entry;
- calculation;
- saved skies;
- dynamic metadata;
- complete point set;
- complete aspect catalog and orb policy;
- same-sky relationships;
- accessibility completion;
- export and handoffs.

It also splits behavior across the wheel, aspect, focus-target, and glyph scripts. That separation is useful, but the modules currently coordinate through SVG datasets and MutationObserver. The clean-room system should use explicit state and render calls while preserving the same user-visible behavior.

## 3. User feedback incorporated as requirements

### 3.1 Approved

- The rainbow wheel is gorgeous and is the correct visual starting point.
- The renderer is clean compared with the production wheel.
- One fixed zodiac and two independently meaningful house systems are coherent.
- The concentric organization is readable.
- Exact-longitude notches and leader lines are valuable.
- Placement glyphs must avoid collision without corrupting astronomical position.
- Canonical glyph artwork must not be approximated, resized ad hoc, or corrected per glyph in the Sky Chart.
- The central combined aspect space is more meaningful than separate aspect rings.
- Aspect lines should meet the next ring with no white gap.
- Degree notches should face inward where aspects originate.
- Hover and click/tap isolation are valuable.
- White-space click/tap should clear isolation.
- A selected sign must keep placements in that sign visible.
- A selected house must keep only that sky's placements in that house visible.
- A selected placement must keep everything directly connected to it visible.
- A selected aspect must keep both endpoints and all applicable context visible.
- Applicable houses, signs, placements, leaders, and aspects must remain lit.
- The currently approved rainbow state deserves a permanent checkpoint.

### 3.2 Rejected

- Using the existing Sky Chart as the implementation base.
- Wrapping the old application.
- Adapting or retrofitting the broken product.
- Treating the rainbow wheel as a component underneath the old system.
- Hidden controls, target translation, polling, synthetic clicks, or DOM scraping.
- Replacing a working wheel with an unverified abstraction.
- Calling a data contract or loading shell a usable migration stage.
- Delivering a preview without opening and verifying that it loads.
- Claiming progress when the user cannot enter data.
- Making architectural moves before understanding both systems and the user's feedback.

### 3.3 Still unsatisfied / unresolved

- There is not yet a real native Sky Chart application using the rainbow design.
- There is no verified data-entry workflow in the rainbow design.
- The complete glyph-master pipeline remains unresolved.
- The exact canonical orb policy has not been approved for the replacement.
- The final retained calculated-point list has not been explicitly approved.
- The balance between the rich legacy workflow and a clean, uncluttered interface still needs design.
- The relationship inspector and progressive language must be redesigned as native output rather than post-processed prose.

## 4. Clean-room product model

### 4.1 One application, not a renderer plus wrappers

The new Sky Chart should be one application with coordinated modules:

- state;
- input and parsing;
- astronomy and enrichment;
- relationships;
- wheel rendering;
- interaction/focus;
- persistence;
- import/export;
- optional correspondence presentation.

These modules may be separate files, but none should treat another rendered UI as its data source.

### 4.2 One authoritative state tree

The state should explicitly contain:

- Sky A draft/working sky;
- optional Sky B draft/working sky;
- active editing slot;
- saved-record linkage, if any;
- display preferences;
- focus selection;
- calculation status and errors;
- relationship graph;
- unsaved-change status.

Rendered DOM is an output of this state, never an input source for reconstructing it.

### 4.3 Canonical internal placement form

Every internal placement should use:

- canonical body/point ID;
- exact longitude in decimal degrees;
- retrograde flag;
- optional speed;
- optional supplied house number;
- provenance/calculation metadata.

Sign, degree, minute, and house labels should be derived views. Imported aliases should be normalized at the parser boundary.

### 4.4 House frames

A sky may have:

- no house frame;
- one calculated frame;
- multiple cached frames for different house systems.

The renderer should draw houses only when a valid frame exists. It must not invent an Ascendant or silently substitute a system.

### 4.5 Relationship graph

Relationships should be calculated into structured objects before rendering. Each relationship should know:

- endpoint sky and placement IDs;
- aspect definition;
- exact separation;
- orb;
- applying/separating state when speed/time data permits;
- same-sky or cross-sky scope;
- structural-group membership;
- static/dynamic role context.

The wheel, inspector, relationship list, progressive language, and isolation behavior should all consume the same relationship objects.

### 4.6 Native progressive disclosure

Glyph → name → referent/meaning should be generated directly from body, sign, aspect, and element registries.

No module should parse already-generated relationship sentences.

### 4.7 Explicit provenance

A sky should record whether it came from:

- manual placement entry;
- pasted text;
- date/time/location calculation;
- Planetary Hours handoff;
- imported file;
- saved library record.

Source labels should only be shown when factual.

## 5. Clean-room file/module plan

Proposed new application names, distinct from both existing implementations:

- `sky-chart-rebuild.html` — application entry point;
- `sky-chart-rebuild.css` — application styles;
- `sky-chart-state.js` — authoritative state and actions;
- `sky-chart-registry.js` — canonical bodies, points, signs, aspects, aliases;
- `sky-chart-parser.js` — text/manual normalization;
- `sky-chart-calculator.js` — Astronomy Engine adapter;
- `sky-chart-houses.js` — stable adapter to verified house calculations;
- `sky-chart-relationships.js` — pure relationship graph calculation;
- `sky-chart-wheel.js` — direct SVG geometry and placement layout;
- `sky-chart-focus.js` — graph-based hover and isolation;
- `sky-chart-editor.js` — native create/edit UI;
- `sky-chart-library.js` — persistence and migration;
- `sky-chart-export.js` — text/reading interchange;
- `sky-chart-correspondences.js` — optional Tarot/decan presentation;
- `tests/sky-chart-*.test.js` — fixtures and regression tests.

Exact filenames may change, but responsibilities must remain separated.

## 6. Build order that does things right the first time

### Gate 0 — investigation and specification

Complete. No implementation branch should begin until this document is reviewed.

### Gate 1 — executable skeleton with proven asset loading

Create the new branch and new page with:

- navigation;
- canonical glyph asset load;
- visible error state;
- a minimal static wheel smoke test;
- automated or scripted load verification.

Do not proceed if the page does not visibly load.

### Gate 2 — complete native Sky A vertical slice

Deliver a page where the user can:

- name Sky A;
- paste placements;
- edit normalized placement rows;
- remove or add placements;
- choose Whole Sign only when an Ascendant is supplied;
- render the exact placements in the approved rainbow wheel;
- see a compact, copyable ledger.

Acceptance requires direct visible use, not only an API or fixture.

### Gate 3 — native Sky B comparison

Add Sky B through the same editor model.

Acceptance requires:

- no empty Sky B activation;
- one-sky layout before Sky B exists;
- two-sky layout after real Sky B data exists;
- independent editing and clearing;
- retained contextual focus behavior.

### Gate 4 — calculation and enrichment

Integrate date, time, time zone, location, Astronomy Engine, axes, retrogrades, and house systems.

Calculation must write the same normalized placement records used by pasted/manual entry.

### Gate 5 — persistence

Add save, update, load, delete, clear-slot, notes, and unsaved-change protection.

Saved-record identity and workspace-slot identity must remain separate.

### Gate 6 — complete relationship system

Establish one approved aspect registry and orb policy, then add:

- same-sky relationships;
- between-sky relationships;
- structural axes;
- static/dynamic roles;
- applying/separating where supported;
- progressive language;
- filters and keyboard behavior.

The wheel and textual relationship list must consume the same graph.

### Gate 7 — handoffs and interchange

Add:

- import/export text;
- reading export;
- URL handoff;
- Planetary Hours handoff;
- explicit provenance;
- optional correspondence modules.

### Gate 8 — parity and replacement

Only replace `sky-chart.html` after:

- retained-feature parity is documented;
- calculation fixtures pass;
- legacy saved records migrate safely;
- desktop, mobile, touch, and keyboard behavior pass;
- approved rainbow behavior has no regression;
- rollback is verified;
- the user explicitly approves replacement.

## 7. Verification requirements

Every implementation stage must include:

- a commit-specific preview URL;
- confirmation that the preview was actually opened or otherwise executed;
- visible success criteria;
- changed-file list;
- regression comparison against the approved rainbow checkpoint;
- no merge to `main` without explicit approval.

Tests should cover at minimum:

- longitude normalization;
- sign/degree conversion;
- parser aliases;
- house assignment across 0°;
- collision-free placement layout;
- true-longitude leader endpoints;
- single-sky and two-sky rendering;
- aspect separation/orb calculations;
- focus graph results;
- saved record versus workspace slot identity;
- import/export round trip;
- polar-latitude house errors;
- Planetary Hours provenance.

## 8. Decisions requiring user approval before the relevant gates

These are product decisions, not investigation gaps:

1. Exact retained point list beyond planets, Chiron, Nodes, angles, Lilith, Vertex, and Part of Fortune.
2. Exact aspect catalog and per-aspect orb policy.
3. Whether applying/separating is required for manually entered placements without speed data.
4. Whether static/dynamic roles should be visible controls by default or inferred then editable.
5. Whether Tarot/decan correspondences are always visible or an optional layer.
6. Whether existing saved skies are read in place or migrated once to a new schema.
7. Which Planetary Hours information belongs directly on each sky card in the first parity release.
8. Whether reverse-solving date/place from placements remains a supported product feature.

## Final governing statement

Build a new Sky Chart application from first principles.

Use the legacy Sky Chart to understand required capabilities and edge cases.

Use the rainbow Sky Chart to understand the approved geometry, visual hierarchy, and relational interaction.

Use neither implementation as the new application's runtime architecture.
