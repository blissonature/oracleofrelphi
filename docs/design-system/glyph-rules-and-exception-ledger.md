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
| Chiron and lunar nodes | Unicode characters, symbol font fallback stack, 34 px before fitting | Same registry treatment; a syntactically invalid CSS family declaration discovered on `main` is repaired in stacked PR #406 | Actual resolved font varies by platform; Chromium audit captures its Linux fallback |
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
| G-06 | Hebrew and Greek glyphs use different script-specific fonts and 31/30 px nominal sizes. | Script-specific fallback is plausible. The 2026-11-22 Linux Chromium audit records the **actual chosen platform font** for all 46, and their painted extent; this does not prove identical rendering on other operating systems. | **Structural / verify cross-platform.** Review optical proportions, actual installed fonts and glyph ink before retaining nominal 31/30 px differences. |
| G-07 | Chiron and nodes use a Unicode fallback stack and dynamic fitting instead of SVG masters. | Their symbol-font declaration on `main` was **invalid CSS** because `Noto Sans Symbols 2` was not quoted, so the declaration was discarded. Stacked draft PR #406 quotes each family name correctly. Linux Chromium still selects its installed fallback (DejaVu Sans). | **Syntax defect corrected in PR #406; structural choice still under review.** Test actual fonts and optical fit across Windows/macOS/iOS/Android before approving Unicode dependence. |
| G-08 | The 14 `static-master` identities and 27 dynamically fitted SVG identities follow different sizing paths. | The canonical renderer scales static masters by `0.64 × radius/19`, while dynamic SVGs use source bounds and fit modes. On `main`, static masters incorrectly assume every source's center is (50,50); PR #406 reads the **actual source viewBox** instead. | **Origin defect corrected in PR #406; optical normalization remains under review.** All 95 ink extents were measured and fit in the gallery on desktop/mobile; perceived stroke weight and context-specific sizing still need design approval. |
| G-09 | Trine and the Fire element share `assets/element-glyphs/fire.svg`. | Explicit shared source in registry; geometrically the same triangular motif. | **Structural shared geometry.** Keep while their approved shapes remain identical; split only if the design meaning or required geometry diverges. |
| G-10 | `tau` maps to both Hebrew Tav and Greek Tau. | Both entries list that exact alias; registry resolution assigns the last entry to the normalized key. | **Defect, not an approved exception.** Define unambiguous namespaced resolution in the existing resolver and test both identities before changing aliases. |
| G-11 | Retrograde's source viewBox differs from the 39 other artboards. | **Necessary current consumer contract:** Placements references the original SVG directly as an `<img>`; its −32..32 coordinates are intentional. `staticMaster` previously assumed (50,50) for every file. PR #406 fixes the existing renderer to use each source viewBox center **without changing the SVG**. | **Justified structural exception, retain while direct-image consumer remains.** Reassess only if every consumer is migrated to one canonical artboard contract with verified pixel-equivalent behavior. |
| G-12 | Chiron/nodes symbol font declaration contained invalid CSS. | `Noto Sans Symbols 2` was unquoted, invalidating the entire fallback list and silently inheriting the page font; verified in Chromium. PR #406 quotes family names inside the authoritative renderer; actual Linux fallback is not assumed to match Windows. | **Defect corrected in draft PR #406; no exception to retain.** Keep regression checks for CSS validity and platform-font selection. |
| G-13 | 26 registry entries use nondefault per-glyph scales or positional shifts. | The 95-glyph Chromium audit enumerates the exact offsets/scales in its per-identity JSON and Markdown artifact; original rationale is not present in registry metadata. | **Needs rationale for each nondefault value.** Compare visible optical balance with common standards; retire any values that no longer solve a real fitting problem. |

The 2026-11-22 audit confirms **95 registered identities, 41 asset references resolving to 40 distinct SVG files** (Trine shares Fire), with no missing source assets. **39 original files use `viewBox="0 0 100 100"`; the original Retrograde file intentionally uses `viewBox="-32 -32 64 64"`.** This exception matters because Placements displays it directly as an image. Chromium then tested **95/95 rendered identities** at desktop and mobile widths, including font selection, actual painted-pixel bounds, and circle-toggle dimensions. All 95 painted shapes fit their 19 px gallery rings; that is a structural and visibility check, **not** subjective design approval.

## Measured implementation evidence — November 22, 2026

[Verified GitHub Actions — complete glyph audit, real Sky Chart consumers, exact-commit hosted preview](https://github.com/blissonature/oracleofrelphi/actions/runs/45016231746) documents 95 rendered identities on both 1280 × 900 desktop and 390 × 844 mobile in Chromium. The expanded report is generated by `tests/glyph-design-system-audit-report.mjs` and attached with raw JSON and screenshots to the latest [95-glyph audit workflow](https://github.com/blissonature/oracleofrelphi/actions/workflows/relphi-glyph-consistency-audit.yml).

- The five live Latin labels declare **Arial Bold, 16 px** on `main` and actually render as **Liberation Sans Bold** on this Linux runner. `Asc/Dsc` carry an additional −0.35 px tracking difference; this is an **observed exception, not yet approved**.
- Latin-letter, Hebrew, Greek, and symbol-font groups use different fitting rules. Chromium's computed CSS alone is insufficient to identify the font drawn; the audit queries Chromium's **actual platform-font IDs**.
- A glyph element's layout bounding rectangle can overstate painted ink due to font ascent/descent. The audit distinguishes layout-box review flags from **painted pixels** in an uncircled screenshot, and checks circle toggle consistency.
- The original Retrograde artwork is unchanged. Its placement outside the gallery circle was a **shared renderer coordinate-origin defect** corrected at source, without changing its directly embedded image in Placements.
- The hosted exact-commit preview **supports the Sky Chart route**; an optional gallery page selector has been observed loading Sky Chart instead. Do not claim a hosted Master Glyph List preview is verified until that route itself is confirmed.

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
4. **Completed evidence:** 95/95 glyphs rendered in Chromium on Linux at desktop and mobile sizes, circle toggle, painted ink, and actual platform fonts; the real Placements/wheel consumers and self-hosted Sky Chart preview were also exercised. **Further review:** compare optical stroke weight and baseline aesthetics across operating systems and additional contexts (Relationships, Vocab, Glyph Trainer), as tests do not substitute for human approval.
5. Record approvals and retire unneeded exceptions **without** introducing parallel renderers, ad hoc overrides, or silent changes to the approved master.

This document **defines standards without itself changing a font or artwork**. The separate, stacked [draft PR #406](https://github.com/blissonature/oracleofrelphi/pull/406) fixes two defects inside the **existing canonical renderer**, preserves every original SVG, and verifies the real Sky Chart and glyph gallery in Chromium. The competing [PR #400](https://github.com/blissonature/oracleofrelphi/pull/400) remains a separate, unmerged visual study and supplies no approved typeface or Retrograde geometry.
