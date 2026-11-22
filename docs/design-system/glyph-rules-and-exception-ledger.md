# Glyph design rules and exception ledger

**Status:** Working governance rule; individual glyph choices remain subject to visual approval.  
**Established:** 2026-11-21. **Scope:** Oracle of Relphi's Master Glyph List and its Sky Chart, Placements, Relationships, Vocab, and learning consumers.  
**Authoritative code:** `relphi-glyph-registry-v1.js` and `relphi-glyph-component-v1.js`. This document records design decisions and discrepancies; it is **not** a second renderer, registry, or source of artwork.

## Operating principle

**Consistency is the default. Make exceptions only for an identifiable purpose. Record the reason and revisit it when the purpose changes.**

1. Find the existing authoritative rendering owner and the established visual rule **before** changing a glyph.
2. Separate **approved intent**, **current implementation**, **unmerged proposal**, and **unverified interpretation**. A merged implementation is not automatically a design approval; a green test does not constitute visual approval.
3. Define one shared treatment for each relevant class: alphabetic lettering, geometric symbols, script-specific characters, shape fitting, and contextual placement. Do not force dissimilar shapes to share arbitrary stroke geometry; do require visible consistency, proper baselines, and clear spacing.
4. When departing from a shared treatment, capture the **exact difference, demonstrable reason, visual acceptance criteria, responsible implementation owner, evidence, and review trigger** in the ledger below. Unknown reasons remain unknown.
5. Prefer adjusting the existing canonical asset/renderer/layout rather than patches, competing rendering paths, duplicated state, or overrides.
6. Retire an exception once its reason is no longer necessary, and verify the reintegrated form across actual consumer contexts.
7. For rendered changes, verify in Chromium at desktop and mobile sizes, including relevant interactions and copy behavior, with an **exact-commit self-hosted preview**. Test output documents behavior; a human still judges the design. Never merge without explicit approval.

## Observed baseline, not an automatic approval

The snapshot matters. On 2026-11-21, production `main` was commit [`5389b5c`](https://github.com/blissonature/oracleofrelphi/tree/5389b5c75b41bc0eef51736b8fb2af0c699e2880). The **unmerged** Retrograde typography study was [PR #400 at `963b09c`](https://github.com/blissonature/oracleofrelphi/pull/400). Those are different states.

| Observed role | `main` | PR #400 (unmerged) | Decision status |
| --- | --- | --- | --- |
| Live Latin lettering: `Asc`, `Dsc`, `MC`, `IC`, `Vx` | `Arial,Helvetica,sans-serif`; 700; 16 px | `Montserrat,Arial,Helvetica,sans-serif`; 700; 16 px | **Font-family choice unresolved** |
| `Asc` and `Dsc` tracking | −0.35 px; other Latin lettered marks normal | Same | Reason for narrower tracking not documented |
| `AVx` | SVG asset registered under `letter` fit mode | Three outlined SVG paths with `static-master` fit mode | Under review; outline-versus-font rationale must be explicit |
| Retrograde | Earlier single outlined `Px`-like master | `system-ui` P plus separately drawn X in one SVG | Under visual review; has not satisfied all lettering requests |
| Placements planet names (e.g., Pluto, Chiron) | `system-ui`, 700, `.74rem`, 1.2 line-height | Same | Separate *text-label role*; the requested Retrograde P correspondence is unresolved |
| Chiron and lunar nodes | Unicode characters, symbol font fallback stack, 34 px before fitting | Same | Actual fallback and optical size must be verified |
| Hebrew / Greek letter groups | Separate script-specific font stacks, 600; 31 / 30 px | Same | Script coverage is a plausible need, not yet independently confirmed |

Source: [`main` registry](https://github.com/blissonature/oracleofrelphi/blob/5389b5c75b41bc0eef51736b8fb2af0c699e2880/relphi-glyph-registry-v1.js), [`main` renderer](https://github.com/blissonature/oracleofrelphi/blob/5389b5c75b41bc0eef51736b8fb2af0c699e2880/relphi-glyph-component-v1.js), [PR #400 renderer](https://github.com/blissonature/oracleofrelphi/blob/963b09c5462b19d8a4f16e65d2fb4cc4e5373eef/relphi-glyph-component-v1.js), and [Placements stylesheet](https://github.com/blissonature/oracleofrelphi/blob/5389b5c75b41bc0eef51736b8fb2af0c699e2880/sky-chart-foundation-v1.css).

### Shared standards to apply during design review

- **Letters:** A single chosen Latin-letter family, weight, nominal size, consistent geometry and x-leg symmetry should govern lettered glyphs **unless a reviewed, justified exception is recorded**. The family has **not** yet been chosen. Check both live-letter marks (`Asc/Dsc/MC/IC/Vx`) and drawn letterforms (`AVx`, Retrograde `P/x`, Quintile `Q`, Bi-Quintile `BQ`).
- **Baseline:** A letter placed next to a Placements name must be assessed against the **name's actual baseline**. For the reported Retrograde defect, the explicit reference is **Chiron's name baseline**, **not** the X's baseline. The Retrograde P's form was also requested to match the P visible in **Pluto**.
- **Context:** Placements places the marker beside the **name**; Relationships places it beside the **planetary glyph**; Vocab has another compact presentation. Scale or placement may vary by context only if the reason and intended appearance are documented.
- **Symbols:** Keep geometric artwork in canonical SVG sources, without drawing ad hoc circles inside glyphs. Use the existing canonical bubble presentation or dedicated approved inscribed variants where applicable.
- **Verification:** Evaluate actual rendered geometry and readability, not only CSS declarations. Confirm that the requested font loaded, check letter sizes and optical balance in screenshots, and test the user's actual hover/click/copy workflows.

## Exception and discrepancy ledger

**Status meanings:** `needs rationale` = inherited difference with no documented reason; `proposed` = unmerged or undecided treatment; `review` = actual requirement conflicts or fails in a consumer; `structural` = distinct geometry or script class that may warrant different handling; `defect` = broken semantics, not an exception to preserve.

| ID | Observed departure / issue | Current evidence or reason | Status and reconsideration trigger |
| --- | --- | --- | --- |
| G-01 | `Asc/Dsc` use −0.35 px tracking; `MC/IC/Vx` use normal tracking. | Explicit conditional in the canonical text renderer; **no recorded typography rationale**. | **Needs rationale.** Reassess against visible label alignment and the chosen Latin standard; remove the special case if unjustified. |
| G-02 | `main` uses Arial for Latin glyphs; PR #400 proposes Montserrat. | Actual committed source differs. No recorded approval for the change. | **Proposed.** Compare rendered reference lettering, font loading, and all consumers; choose one font deliberately before changing glyph art. |
| G-03 | `AVx` is outlined artwork while the other Latin angle labels are live text; its fit mode also changes in PR #400. | The same registry points to an SVG asset; exact visual rationale for outlining instead of consistent live lettering has not been established. | **Review.** Confirm whether outlines solve a necessary font, fitting, or stability constraint. Otherwise restore shared lettering treatment. |
| G-04 | Retrograde `P/x` uses differing letter origins and has alignment/spacing objections. | `main` uses an outlined master; PR #400 uses `system-ui` for P and a custom X path. User specifically requested symmetrical X diagonals, a Pluto-matching P, Chiron-name baseline, and comfortable separation from the name. | **Review; do not approve automatically.** Resolve the apparent conflict between matching Pluto's text P and using the same typography as `Dsc/Vx`, then check Placements, Relationships, Vocab, desktop, and mobile. |
| G-05 | Placements labels are `system-ui` ~11.84 px at a 16 px root; Latin master lettering is 16 px Arial on `main`. | These serve **different UI roles**, so a difference is not itself a defect; however a glyph explicitly required to match a label introduces a cross-role constraint. | **Needs rationale for cross-role cases.** Reassess if a glyph must share a letterform/baseline with its neighboring name. |
| G-06 | Hebrew and Greek glyphs use different script-specific fonts and 31/30 px nominal sizes. | Separate script support is plausible; no browser font-availability and comparable optical-size evidence gathered in this ledger. | **Structural / verify.** Keep only script-related differences that remain necessary after actual font and sizing tests. |
| G-07 | Chiron and nodes use a Unicode fallback stack and dynamic fitting instead of SVG masters. | Source uses symbol fit mode and `Apple Symbols, Segoe UI Symbol, Noto Sans Symbols 2, serif`. Actual font and shape may vary across operating systems. | **Structural / verify.** Test font fallback, stable shape, and accessible equivalence; consolidate if a canonical master offers reliable geometry. |
| G-08 | The 14 `static-master` identities and 27 dynamically fitted SVG identities follow different sizing paths. | The renderer fixes static art to a 100 × 100 source and scales by `0.64 × radius/19`; other SVGs use source bounds and fit modes. | **Needs visual normalization audit.** Check perceived size and stroke weight for every identity; retain a different fit algorithm only where it serves a measurable requirement. |
| G-09 | Trine and the Fire element share `assets/element-glyphs/fire.svg`. | Explicit shared source in registry; geometrically the same triangular motif. | **Structural shared geometry.** Keep while their approved shapes remain identical; split only if the design meaning or required geometry diverges. |
| G-10 | `tau` maps to both Hebrew Tav and Greek Tau. | Both entries list that exact alias; registry resolution assigns the last entry to the normalized key. | **Defect, not an approved exception.** Define unambiguous namespaced resolution in the existing resolver and test both identities before changing aliases. |

The 2026-11-21 source audit found **95 registered identities, 41 asset references resolving to 40 distinct SVG files** (Trine shares Fire), and **no missing source assets**. All 40 files declare `viewBox="0 0 100 100"`. That validates source availability and artboard conventions, **not** equal visible size or a complete visual pass.

## Exception record template

When a new style departure is proposed, append or revise one row with:

- **Rule / owner:** Canonical rule being departed from; exact existing asset, component, or stylesheet responsible.
- **Observation:** Measured or visibly documented difference and which contexts it affects.
- **Reason:** Necessary constraint, supporting evidence, and who approved it; explicitly state `unknown` or `proposed` where appropriate.
- **Acceptance:** Expected appearance; Chromium desktop/mobile screenshots and relevant hover/click/copy behavior.
- **Reconsideration trigger:** Font standard chosen, browser capability changes, new consumer, removal of the constraint, accessibility issue, or visual design review.
- **Resolution:** Retain with reason, consolidate back into the shared rule, or supersede; preserve the history and approval reference.

### First decisions to resolve

1. Compare **what `Dsc` and `Vx` actually render on `main`**, not merely the PR's changed CSS, and choose whether Latin-lettered glyphs should be Arial, Montserrat, or another explicitly approved common family.
2. Compare the **actual Pluto P**, the **Chiron name baseline**, and the chosen Latin glyph P at the user-facing size. Resolve the constraints before changing the canonical Retrograde geometry again.
3. Judge the `Dsc/Asc` tracking exception and the `AVx` outlined exception on visible evidence. Keep only justified departures.
4. Complete a **95/95 rendered audit**, accounting for missing fonts, effective dimensions, stroke weight, alignment, and all consumer contexts. Loading 95 registry entries or passing a structural CI job is insufficient.
5. Record approvals and retire unneeded exceptions **without** introducing parallel renderers, ad hoc overrides, or silent changes to the approved master.

No glyph assets, runtime CSS, rendering logic, or production behavior are changed by adopting this document. Work in [PR #400](https://github.com/blissonature/oracleofrelphi/pull/400) remains a separate, unmerged visual study.
