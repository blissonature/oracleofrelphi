# Sky Chart Clean-Room Rebuild Plan

## Purpose

Build a completely new Sky Chart application that preserves the successful visual and interaction discoveries of the rainbow prototype while recovering the legitimate functionality of the legacy Sky Chart.

This is not a refactor, wrapper, adapter, retrofit, or gradual replacement of the legacy application. The legacy system is a behavioral reference. The rainbow prototype is a design and geometry reference. The new application receives a new architecture.

## 1. Comparative system study

### Legacy Sky Chart: what it does well

The legacy Sky Chart contains a broad, mature feature set:

- create, name, edit, clear, save, load, update, and delete skies;
- separate Sky A and Sky B workspace slots;
- create from date, time, time zone, location, coordinates, or placements;
- manual placement entry and pasted placement parsing;
- Astronomy Engine calculation;
- multiple house systems;
- retrogrades, axes, Nodes, extra calculated points, and provenance;
- same-sky and cross-sky relationships;
- major and minor aspects, structural axes, orbs, language, and relationship lists;
- import, export, reading output, URL handoff, and Planetary Hours integration;
- responsive and keyboard-oriented behavior.

### Legacy Sky Chart: how it goes about it

The legacy application is layered rather than coherent.

- The page enters the shared Tarot application and depends on a very large shared script.
- Builder state uses `skyA` / `skyB`, while older application controls use `chart` / `currentSky`.
- State synchronization relies in places on local storage, hidden controls, synthetic clicks, output observation, and target translation.
- Numerous enhancement scripts patch earlier behavior after the page has loaded.
- The canonical wheel is not the original renderer. It searches a previously rendered SVG for placement sticks, derives identities and anchor coordinates from DOM output, creates a later canonical glyph layer, hides earlier markers, and watches DOM mutations to repeat the operation.
- Relationship and language systems also perform later passes over previously rendered output.

The legacy application therefore contains important domain logic and workflows, but its implementation order is reversed: output is frequently created first and then corrected, replaced, interpreted, or patched.

### Rainbow Sky Chart: what it does well

The rainbow prototype succeeds because its visual system is authored directly:

- one fixed zodiac;
- two sky-specific rainbow house rings;
- one root SVG coordinate system;
- explicit radii and layer order;
- true-longitude degree anchors;
- collision-managed display positions with leaders returning to exact longitude;
- canonical zodiac and placement glyphs;
- a shared central aspect chamber;
- inward-facing degree notches at the relationship boundary;
- hover and click/tap focus;
- white-space clearing;
- contextual retention of applicable signs, houses, placements, leaders, and aspects.

The wheel does not need to rediscover its own geometry from DOM output. Houses, signs, placements, and aspects are created in a known coordinate system and carry explicit semantic attributes.

### Rainbow Sky Chart: what remains incomplete or unsatisfactory

- It is a demonstration, not an application.
- Its skies are hard-coded.
- It has no native create, edit, paste, calculate, save, load, import, or export workflow.
- It supports only demonstration house-system switching.
- Its relationship engine is limited to five cross-sky major aspects and one demonstration orb.
- It does not yet support single-sky relationships, structural axes, extra points, retrogrades, full relationship language, filters, or saved records.
- The glyph pipeline still requires a final architecture review against complete canonical inscribed masters.
- Previous attempts to insert a data wrapper broke the working page and repeated the conceptual error of treating the rainbow wheel as a component beneath another application.

## 2. User feedback that governs the rebuild

### Explicitly approved

- The rainbow wheel is gorgeous and should determine the visual language.
- The wheel renderer is cleaner than the legacy renderer.
- The concentric organization works.
- The placement collision behavior and exact-degree leaders work.
- Canonical glyph consistency matters and per-glyph approximation is unacceptable.
- One combined aspect space is preferred over separate aspect rings.
- Aspect lines should meet the next ring without a white gap.
- Degree notches should face inward where aspects begin.
- Hover and click/tap isolation are valuable.
- Clicking a sign should preserve the sign and placements within it.
- Clicking a house should preserve that sky-specific house and its placements.
- Clicking a placement or aspect should preserve all applicable houses, signs, endpoints, and directly connected relationships.
- The resulting lit relational geometry is interesting and worth preserving.

### Explicitly rejected

- Improving the legacy renderer in place.
- Wrapping, adapting, or retrofitting the legacy product.
- Treating the rainbow wheel as a renderer underneath the old application.
- Hidden legacy controls, target translation, polling, synthetic clicks, or post-render replacement.
- Calling architectural scaffolding a successful stage when the user cannot enter data or use the chart.
- Replacing a working visual version before proving the next version loads.
- Large speculative rewrites without a visible, usable vertical slice.

### Still unresolved

- The final complete point registry.
- Canonical minor aspects and orb rules.
- Exact role of Tarot correspondences in the main Sky Chart experience.
- Which reverse-solving and Planetary Hours features belong in the first release.
- Final hierarchy between primary selection and secondary related context.
- Final mobile layout under dense real-world placement sets.

## 3. Clean-room architecture

The new application should have no dependency on `tarot-app.js`, the legacy Sky Builder, legacy chart outputs, or page-specific patch scripts.

### A. Application state

One authoritative state tree:

- `workspace.skyA`
- `workspace.skyB`
- `workspace.mode`
- `editor.activeSky`
- `editor.method`
- `display.houseSystem`
- `display.relationshipFilters`
- `focus.selection`
- `library.records`
- `status.calculation`
- `status.persistence`

No second naming system and no DOM-derived state.

### B. Domain records

A sky record should natively contain:

- stable record ID;
- workspace slot only while loaded;
- name and notes;
- date/time/time-zone/location metadata when available;
- latitude and longitude when available;
- placements with exact longitude, retrograde state, and provenance;
- axes and calculated points;
- house system and twelve exact cusps when enriched;
- calculation provenance and schema version.

Manual skies may exist without houses. The interface should label them as unenriched rather than inventing house data.

### C. Native services

Independent pure or narrowly scoped modules:

- placement parser and formatter;
- astronomical calculation service;
- house-system service;
- relationship calculator;
- saved-library service;
- import/export service;
- URL and Planetary Hours handoff service;
- optional correspondence service.

None of these modules may render or inspect SVG.

### D. Native renderer

The renderer receives application state and draws the complete visible wheel directly.

It owns:

- concentric wheel geometry;
- house sectors;
- fixed zodiac;
- degree scales;
- placement collision layout;
- exact-degree leaders;
- aspect geometry;
- semantic SVG grouping;
- visual focus state.

It does not own:

- parsing;
- astronomy;
- persistence;
- legacy compatibility;
- workflow decisions;
- relationship prose.

### E. Interface shell

The complete Sky Chart application should use the proven desktop composition:

`Sky A panel | rainbow wheel | Sky B panel`

With one sky:

`Sky A panel | rainbow wheel`

Each sky panel must support three coherent states in one place:

1. create or load;
2. edit or enrich;
3. display the completed sky.

Date/time/location and placement entry are two creation methods for the same sky, not separate sky types.

## 4. Build strategy: vertical slices only

Each stage must open, load, and perform a complete user action before it is called successful.

### Slice 1 — Native Sky A placement workflow

Deliver one working page where the user can:

- open the new Sky Chart;
- type or paste Sky A placements;
- see parsed placements in an editable ordinary-text representation;
- render those exact placements on the rainbow wheel;
- change the placements and immediately rerender;
- clear the sky.

No legacy scripts. No saved library yet. No astronomy yet. No Sky B yet.

Acceptance test: the user can enter a real natal placement list and see it on the same clean wheel.

### Slice 2 — Native Sky B comparison workflow

- add or remove Sky B;
- enter Sky B through the same placement editor;
- preserve independent sky identity;
- show both house rings only when house data exists;
- calculate and display major cross-sky aspects;
- preserve the approved contextual focus behavior.

Acceptance test: adding Sky B never overwrites Sky A and never activates an empty comparison state.

### Slice 3 — Native metadata and enrichment

- date, local time, IANA time zone, location, and coordinates;
- Astronomy Engine calculation;
- Ascendant, Midheaven, Nodes, retrogrades, and retained calculated points;
- selected house-system calculation;
- explicit enrichment state and errors.

Acceptance test: the same sky can move from pasted placements to calculated/enriched data without becoming a duplicate sky.

### Slice 4 — Saved library

- save new record;
- update existing record;
- load into either workspace slot;
- clear slot without deleting record;
- delete record without confusing active workspace state;
- preserve names, notes, calculation profiles, and placements.

Acceptance test: record identity and workspace-slot identity cannot overwrite one another.

### Slice 5 — Complete relationship system

- same-sky and cross-sky relationships;
- retained major and minor aspects;
- canonical orb rules;
- Chart Axes and Angular Frame structural groups;
- filters and relationship counts;
- progressive relationship language;
- accessible keyboard and touch selection;
- contextual highlight graph.

### Slice 6 — Interchange and integrations

- text import/export;
- reading export;
- URL handoff;
- Planetary Hours handoff and reciprocal portal;
- optional Tarot correspondence module.

### Slice 7 — parity and production replacement

- feature matrix against legacy;
- calculation fixtures;
- saved-record migration tests;
- responsive, touch, and keyboard tests;
- rollback verification;
- explicit approval before replacing `sky-chart.html`.

## 5. Quality gates

Every slice must meet all of these before the next begins:

1. It loads from an immutable commit preview.
2. The primary workflow can be completed by the user.
3. The existing wheel geometry has not regressed.
4. No legacy application script is loaded.
5. No DOM polling, synthetic clicks, or post-render replacement is introduced.
6. Exact longitude remains separate from collision-adjusted display position.
7. Sky A and Sky B remain separate state records.
8. Keyboard and touch behavior are considered, not deferred indefinitely.
9. Changed files and known limitations are reported accurately.
10. The protected rainbow checkpoint remains untouched.

## 6. Branch strategy

Do not continue implementation on the failed wrapper path.

After this plan is approved, create a new implementation branch with a new page and new modules. The branch may exist in the same repository, but the application code must begin as a clean-room implementation rather than copying the legacy page or importing the legacy application stack.

Recommended branch:

`clean-room/sky-chart-rebuild-v1`

Recommended initial files:

- `sky-chart-rebuild.html`
- `sky-chart-rebuild.css`
- `sky-chart-rebuild-state.js`
- `sky-chart-rebuild-parser.js`
- `sky-chart-rebuild-renderer.js`
- `sky-chart-rebuild-focus.js`
- `sky-chart-rebuild-app.js`
- `tests/sky-chart-rebuild-parser.test.js`
- `tests/sky-chart-rebuild-state.test.js`

Canonical glyph assets may be consumed from their approved source, but the legacy Sky Chart renderer and application scripts must not be loaded.

## 7. First implementation instruction

Build Slice 1 only.

Do not add storage, astronomy, Sky B, or legacy compatibility until the user can enter a real Sky A placement list and see the working rainbow wheel render it reliably.

The first preview must be visibly usable. A page that only displays loading text, architecture scaffolding, or a hard-coded demonstration does not satisfy Slice 1.
