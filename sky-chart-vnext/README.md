# Sky Chart vNext

This directory is an isolated rebuild of Sky Chart. It deliberately does not load the existing `sky-chart-*.js` repair/runtime chain.

## Architectural contract

1. **One state store.** Sky A, Sky B, orb, selection, and dialog state have one owner. Single/comparison mode is derived from slot occupancy.
2. **One sky model.** Existing, Here and Now, and exact skies normalize to the same payload shape.
3. **One calculation engine.** New skies are calculated in `core/astronomy.mjs`; the calculator does not write storage or manipulate UI.
4. **One layout pass.** Placement collision resolution, sign-boundary constraints, leader identity, and relationship endpoints are finalized before SVG nodes are created.
5. **One wheel renderer.** Single and comparison views use the same renderer.
6. **One interaction owner.** App-level event delegation updates the store. Internal application communication does not use synthetic `storage` events or monkey-patch browser event APIs.
7. **Persistence is separate from active slots.** The adapter reads the existing `relphiSkyLibraryV1` library for compatibility. Saved records use stable IDs; names are case-insensitively unique and a name collision never authorizes overwrite.

## First-run flow

`+ Sky A` → Existing / New → Here and Now / Enter Exactly Where and When.

Once Sky A exists, `+ Sky B` exposes the same flow. Adding Sky B is what creates a comparison; there is no independent comparison-mode switch.

Creation is temporary by default. Saving happens after the sky exists. Duplicate names are blocked and a unique numeric suffix is suggested.

## What this first executable slice includes

- Empty Sky A / Sky B slot UX
- Existing Saved Skies loading
- Here and Now calculation using device location
- Exact date/time/location/time-zone calculation
- Existing Relphi house-system engine
- Sun through Pluto, chart angles, mean nodes, mean Lilith, Vertex, and Part of Fortune
- One responsive wheel for single and comparison views
- Pre-render collision layout that cannot move a placement into another sign
- Leader identity generated from the placement record itself
- Intra-sky or inter-sky aspect calculation from a single relationship function
- Saved-sky ID compatibility, dirty detection, duplicate-name rejection, and safe updates
- Pure invariant tests and a Playwright smoke test

## Intentionally not ported yet

The old runtime remains the behavioral reference for features that should be moved only after their domain behavior is captured in tests: Tarot/relationship copy, export, advanced multiselect filters, harmonic/heptagram overlays, transit timeline, and Progressions. Those features should call the vNext store/calculation/layout APIs rather than reintroduce independent DOM or storage controllers.

Chiron remains `not-provided` for newly calculated skies because the current local Astronomy Engine does not supply it. Existing/imported saved skies that contain Chiron retain it through normalization.

## Regression rules

The rebuild should reject any change that requires downstream code to repair upstream output. In particular:

- layout output may not cross a zodiac sign boundary;
- leaders may not be re-paired after render;
- filter/state actions may not recursively rebroadcast themselves;
- one slot may not mutate the other slot's sky object;
- duplicate names may not overwrite a saved sky;
- dialog input nodes may not be replaced while the user is typing;
- hover must not require a full wheel rebuild;
- browser platform prototypes must not be patched for application correctness.
