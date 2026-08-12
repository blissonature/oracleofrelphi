# Sky Chart contract smoke test

Use the commit-pinned `sky-chart.html` URL for the branch head.

1. Hard reload at desktop width. Fail if old Sky cards or old wheel appear.
2. Confirm Sky A and Sky B panels and the comparison wheel appear without an indefinite preparing state.
3. Confirm every visible planet, sign, angle, point, and aspect uses the approved canonical component.
4. Hover a house. Confirm same-sky placements and their relationships are emphasized and the list is filtered.
5. Move the pointer out. Confirm the prior selected state returns.
6. Select an aspect. Confirm one exact relationship remains and the matching dual-card interpretation opens.
7. Confirm Selected Relationship order: graphic, facts, cards separated by canonical aspect glyph, progressive reveal.
8. Repeat at iPhone portrait width.
9. Open Sky B editor. Confirm Sky B is the locked target and Sky A is unchanged.
10. Check the console for exceptions or repeating render loops.
