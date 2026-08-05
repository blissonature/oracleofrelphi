# Sky Chart contract verification

This branch is intentionally not marked complete until the exact commit-pinned public build passes the following checks.

## Architecture

- One public renderer: `sky-chart-contract-renderer-v1.js`
- One public interaction/filter controller: `sky-chart-contract-controller-v1.js`
- One semantic bridge to hidden native card interpretations: `sky-chart-contract-native-map-v1.js`
- The old wheel adapter and old marker interaction owner are retired on this branch.
- The hidden native output remains a calculation and interpretation engine only.

## Release gates

- [ ] Canonical workspace becomes visible without deprecated Sky cards or wheel output.
- [ ] Sky A and Sky B panels have stable desktop and iPhone tracks.
- [ ] Comparison wheel renders from persisted Sky A/Sky B state.
- [ ] Every visible glyph resolves through `RelphiGlyphRegistry` and `RelphiGlyphComponent`.
- [ ] ASC, DSC, MC, IC, and Vx use the approved canonical monogram masters.
- [ ] Hover temporarily filters the relationship list and pointer-out restores selected state.
- [ ] House isolation is scoped to the selected sky.
- [ ] Aspect isolation filters to the exact relationship record.
- [ ] Relationship selection maps by participants and aspect identity, not array position.
- [ ] Wrong or unmatched native cards are blocked instead of displayed.
- [ ] Selected Relationship order is graphic, facts, cards with canonical aspect glyph, progressive reveal.
- [ ] No self-sustaining mutation/render loop.
- [ ] No console exception.

## Current evidence

Repository source has been changed and the contract workflow has been added. Browser behavior remains unverified until the commit-pinned RawGitHack page is opened and the gates above are observed.
