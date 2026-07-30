# Sky Chart Investigation Correction

Status: authoritative correction to `sky-chart-completed-investigation.md`

The earlier document was incorrectly labeled complete. It omitted two defining product requirements:

1. the dual-card comparison view;
2. progressive reveal from glyph to name to referent/meaning, with reversible collapse.

Until those are fully incorporated, the earlier investigation must not be treated as the final build specification.

## 1. Dual-card comparison view is core Sky Chart structure

The dual-card view is not a generic responsive card layout and not a minor presentation enhancement.

It is the visual comparison surface that lets the user see the two symbolic correspondences belonging to the selected relationship together. In the existing product, the relationship layer searches for the paired card images associated with a reading and marks the host as a dual-card comparison view. On mobile, the first two cards are held side by side and the relationship reading is placed beneath them.

The clean-room Sky Chart must implement this natively from relationship data. It must not discover cards by searching rendered DOM descendants.

### Required native behavior

For a selected relationship, the comparison view must be able to show:

- the card corresponding to the first placement;
- the card corresponding to the second placement;
- clear ownership by Sky A and Sky B, or by the two placements in a same-sky relationship;
- the relationship/aspect between them;
- readable placement coordinates and context;
- the progressive symbolic reading associated with the pair.

The paired cards and the reading form one coherent relationship object. They must not be assembled after render by scanning for unrelated card images.

### Desktop and mobile

Desktop may use a wider paired-card composition. Mobile must preserve both cards together rather than stacking them so far apart that the comparison is lost.

The dual-card view must remain legible when cards have different artwork proportions or text lengths.

### Architectural consequence

A relationship record must include or resolve:

- endpoint A placement;
- endpoint B placement;
- endpoint A correspondence card;
- endpoint B correspondence card;
- aspect definition;
- orb and applying/separating status when available;
- ownership and sky roles;
- progressive reading tokens.

Card correspondence is therefore not merely an optional decorative module for the relationship experience. The relationship comparison view requires a formal correspondence resolver, even if the wheel can render without card artwork.

## 2. Progressive reveal is a primary interaction language

The progressive reveal is not ordinary tooltip help and not a prose post-processing effect.

Its sequence is:

1. glyph;
2. name;
3. what the name refers to or represents.

Each level can be selected to reveal the next level, and the sequence must be reversible so the user can collapse back to the symbolic level.

This applies to:

- planets and luminaries;
- signs;
- aspects;
- elements where present;
- angles and calculated points when supported;
- other canonical symbolic tokens used by the relationship reading.

### Product purpose

The reveal system lets a knowledgeable user remain at the compact symbolic layer while allowing another user to unfold terminology and meaning only as needed. It is part of Oracle of Relphi's teaching method and information architecture.

### Required native behavior

The clean-room application must generate progressive tokens directly from structured data. A token requires:

- canonical glyph asset or approved symbolic form;
- canonical display name;
- referent/meaning;
- semantic kind, such as planet, luminary, sign, angle, aspect, or element;
- current reveal level;
- accessible labels and expanded state.

The application must never generate prose and then parse that prose to rediscover the glyph, name, or meaning.

### Reveal state

Reveal state should be explicit application/interface state. It must support:

- independent reveal for each token;
- collapse from meaning to name;
- collapse from name to glyph;
- keyboard activation;
- preservation or reset according to a deliberate interaction rule;
- no accidental global expansion caused by one token.

## 3. Relationship experience is a coordinated three-part system

A complete selected-relationship experience consists of:

1. wheel focus;
2. dual-card comparison;
3. progressive symbolic reading.

Selecting an aspect or relationship on the wheel should coordinate all three:

- the applicable placements, leaders, signs, houses, and aspect remain lit on the wheel;
- the two correspondence cards appear together in the comparison view;
- the relationship reading appears in progressive symbolic form.

Selecting a card or endpoint in the comparison view should be able to focus the corresponding placement context without losing the relationship pair.

These are not three unrelated widgets. They are three views of the same relationship record.

## 4. Revised architecture

The clean-room application must include first-class modules for:

- `relationship-engine`: calculates structured relationships;
- `correspondence-resolver`: resolves each placement to its card/correspondence data;
- `dual-card-view`: renders the paired correspondence comparison;
- `progressive-token-view`: renders glyph → name → referent/meaning interactions;
- `relationship-coordinator`: keeps wheel focus, dual cards, and reading synchronized.

None of these modules may depend on parsing rendered prose or searching the DOM for card images.

## 5. Revised delivery gates

The previous plan placed relationship presentation too late and too vaguely. The corrected gates are:

### Gate A — Native Sky A creation

- create or paste Sky A;
- edit placements;
- render the rainbow wheel;
- display a copyable ledger.

### Gate B — Native Sky B and geometric comparison

- add Sky B through the same workflow;
- show both sky-specific house systems and placements;
- calculate and focus cross-sky relationships.

### Gate C — Complete relationship experience

Before the relationship system can be called usable, it must include:

- selected relationship on the wheel;
- synchronized dual-card comparison view;
- progressive glyph → name → referent/meaning reading;
- reversible collapse;
- desktop, mobile, touch, and keyboard verification.

This is not deferred polish. It is a parity and product-identity gate.

## 6. Acceptance criteria

The clean-room build is not acceptable if:

- it shows an aspect line but no paired card comparison;
- it shows card artwork without clear placement and sky ownership;
- it outputs only fully expanded prose;
- it treats progressive reveal as a tooltip;
- it cannot collapse a revealed token;
- it generates text and reparses it;
- it identifies the paired cards by scanning rendered DOM;
- it separates the two cards so completely on mobile that comparison is lost;
- wheel focus, cards, and reading can disagree about the selected relationship.

## 7. Corrected governing principle

The new Sky Chart is not only a wheel with data-entry features.

It is a symbolic comparison application in which the rainbow wheel, the dual-card comparison view, and progressive reveal work as one coordinated system.

The earlier `sky-chart-completed-investigation.md` is superseded wherever it conflicts with this correction.