window.RELPHI_CARD_SENSES = {
  "schema_version": "relphi_card_senses_v1",
  "source_basis": "Derived from oracleofrelphi-v306-requested-fixes/relphi-locked-interpretations.js ingredient refs and locked Relphi-derived interpretations.",
  "ui_recommendation": {
    "drawing_board_panel": "Render a small panel below each drawn card.",
    "empty_state": "Select a sense",
    "interaction": "Hover or tap opens a dropdown of derived sense labels; selected label persists in the panel and can be changed.",
    "free_note": "Allow an optional custom text value when the listed senses do not land.",
    "preset_behavior": "Preset position sticker packages should use the selected sense plus the position role to generate the returned sentence."
  },
  "cards": [
    {
      "card_id": "ace_of_wands",
      "name": "Ace of Wands",
      "group": "Aces",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "spark",
      "ingredients": [
        {
          "ref": "ace_one",
          "name": "Ace / One",
          "operation": "origin, seed, root, undivided beginning, first appearance"
        },
        {
          "ref": "fire_wands",
          "name": "Fire / Wands",
          "operation": "ignition, activation, will entering action"
        }
      ],
      "locked_relphi_interpretation": "The Ace of Wands is the first ignition of active force: will before direction, heat before form, spark before path, and the first event of wanting-to-act.",
      "senses": [
        {
          "key": "spark",
          "label": "First spark",
          "panel_phrase": "First spark",
          "relationship_phrase": "Attraction or action is just beginning.",
          "ingredient_justification": "Ace / One gives origin and first appearance; Fire / Wands gives ignition and will entering action."
        },
        {
          "key": "urge",
          "label": "Wanting to act",
          "panel_phrase": "Wanting to act",
          "relationship_phrase": "Someone wants movement but may not have a plan yet.",
          "ingredient_justification": "Fire / Wands gives appetite, courage, heat, and eventhood before direction."
        },
        {
          "key": "invitation",
          "label": "Start signal",
          "panel_phrase": "Start signal",
          "relationship_phrase": "The situation is offering a beginning.",
          "ingredient_justification": "Ace / One supplies the root; Fire supplies the first visible event."
        },
        {
          "key": "raw_energy",
          "label": "Raw energy",
          "panel_phrase": "Raw energy",
          "relationship_phrase": "Chemistry or pressure is present before it is defined.",
          "ingredient_justification": "The locked phrase says heat before form and spark before path; this sense preserves that early, undirected force."
        }
      ]
    },
    {
      "card_id": "ace_of_cups",
      "name": "Ace of Cups",
      "group": "Aces",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "opening",
      "ingredients": [
        {
          "ref": "ace_one",
          "name": "Ace / One",
          "operation": "origin, seed, root, undivided beginning, first appearance"
        },
        {
          "ref": "water_cups",
          "name": "Water / Cups",
          "operation": "reception, feeling, memory, bonding, softening, containment, and response"
        }
      ],
      "locked_relphi_interpretation": "The Ace of Cups is first receptivity: feeling before object, need before request, the open vessel before it knows what it will hold, and the first movement of being affected.",
      "senses": [
        {
          "key": "opening",
          "label": "Open feeling",
          "panel_phrase": "Open feeling",
          "relationship_phrase": "A tender feeling is beginning.",
          "ingredient_justification": "Ace / One gives firstness; Water / Cups gives receptivity, feeling, bonding, and care."
        },
        {
          "key": "need",
          "label": "Need before request",
          "panel_phrase": "Need before request",
          "relationship_phrase": "A need is present before anyone has said what they need.",
          "ingredient_justification": "The locked phrase explicitly gives need before request, from Water as receptivity and Ace as origin."
        },
        {
          "key": "receptivity",
          "label": "Being affected",
          "panel_phrase": "Being affected",
          "relationship_phrase": "Someone is receptive, moved, or emotionally touched.",
          "ingredient_justification": "Water contributes response and being affected; Ace keeps it at first contact."
        },
        {
          "key": "vessel",
          "label": "The open vessel",
          "panel_phrase": "The open vessel",
          "relationship_phrase": "There is room for feeling, but it has not been shaped yet.",
          "ingredient_justification": "Water gives containment and softening; Ace gives the vessel before content."
        }
      ]
    },
    {
      "card_id": "ace_of_swords",
      "name": "Ace of Swords",
      "group": "Aces",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "distinction",
      "ingredients": [
        {
          "ref": "ace_one",
          "name": "Ace / One",
          "operation": "origin, seed, root, undivided beginning, first appearance"
        },
        {
          "ref": "air_swords",
          "name": "Air / Swords",
          "operation": "distinction, comparison, separation, relation, language, thought, distance, and pattern"
        }
      ],
      "locked_relphi_interpretation": "The Ace of Swords is first distinction: the initial cut that makes thought possible, the first line between this and that, word before argument, and clarity before judgment.",
      "senses": [
        {
          "key": "distinction",
          "label": "First distinction",
          "panel_phrase": "First distinction",
          "relationship_phrase": "A clear difference needs to be named.",
          "ingredient_justification": "Ace / One gives the first appearance; Air / Swords gives distinction, naming, and separation."
        },
        {
          "key": "truth",
          "label": "Cutting truth",
          "panel_phrase": "Cutting truth",
          "relationship_phrase": "The situation asks for one clean truth.",
          "ingredient_justification": "Air / Swords gives the cut, comparison, and discernment; Ace gives the first clear line."
        },
        {
          "key": "word",
          "label": "The first word",
          "panel_phrase": "The first word",
          "relationship_phrase": "A conversation begins with naming the real thing.",
          "ingredient_justification": "Air supplies language and thought; Ace makes it the first usable word."
        },
        {
          "key": "clarity",
          "label": "Clarity before argument",
          "panel_phrase": "Clarity before argument",
          "relationship_phrase": "Do not debate before the terms are clear.",
          "ingredient_justification": "The locked phrase says clarity before argument; this sense stays inside that derivation."
        }
      ]
    },
    {
      "card_id": "ace_of_pentacles",
      "name": "Ace of Pentacles / Disks",
      "group": "Aces",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "seed",
      "ingredients": [
        {
          "ref": "ace_one",
          "name": "Ace / One",
          "operation": "origin, seed, root, undivided beginning, first appearance"
        },
        {
          "ref": "earth_pentacles_disks",
          "name": "Earth / Pentacles / Disks",
          "operation": "embodiment, stabilization, storage, boundary, materialization, endurance, and consequence"
        }
      ],
      "locked_relphi_interpretation": "The Ace of Pentacles is first embodiment: potential made holdable, value before exchange, form before structure, and the first point where possibility touches matter.",
      "senses": [
        {
          "key": "seed",
          "label": "Seed resource",
          "panel_phrase": "Seed resource",
          "relationship_phrase": "Something real could begin here.",
          "ingredient_justification": "Ace / One gives seed and root; Earth / Pentacles gives embodiment, resource, value, and consequence."
        },
        {
          "key": "offer",
          "label": "Holdable offer",
          "panel_phrase": "Holdable offer",
          "relationship_phrase": "A concrete offer, time, body, or support is present.",
          "ingredient_justification": "Earth makes potential holdable and measurable; Ace keeps it in first form."
        },
        {
          "key": "embodiment",
          "label": "First embodiment",
          "panel_phrase": "First embodiment",
          "relationship_phrase": "The situation needs to become real in action.",
          "ingredient_justification": "The locked phrase names first embodiment: possibility touching matter."
        },
        {
          "key": "value",
          "label": "Value before exchange",
          "panel_phrase": "Value before exchange",
          "relationship_phrase": "Value exists before anyone bargains over it.",
          "ingredient_justification": "Earth gives value and evidence; Ace gives value before exchange."
        }
      ]
    },
    {
      "card_id": "page_of_wands",
      "name": "Page of Wands / Princess of Wands",
      "group": "Courts",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "small_spark",
      "ingredients": [
        {
          "ref": "page_princess",
          "name": "Page / Princess",
          "operation": "embodiment, first handling, contact, material entry, carrying the element in a small usable form"
        },
        {
          "ref": "fire_wands",
          "name": "Fire / Wands",
          "operation": "ignition, activation, will entering action"
        }
      ],
      "locked_relphi_interpretation": "Fire made touchable: the spark small enough to carry, first contact with will, appetite, courage, and living force.",
      "senses": [
        {
          "key": "small_spark",
          "label": "Small spark",
          "panel_phrase": "Small spark",
          "relationship_phrase": "A small sign of interest or courage appears.",
          "ingredient_justification": "Page / Princess gives embodiment and first handling; Fire / Wands gives ignition and will. The locked court phrase is fire made touchable."
        },
        {
          "key": "carried_will",
          "label": "Carried will",
          "panel_phrase": "Carried will",
          "relationship_phrase": "Someone can carry the desire, but only in a small usable form.",
          "ingredient_justification": "Page / Princess gives embodiment and first handling; Fire / Wands gives ignition and will. The locked court phrase is fire made touchable."
        },
        {
          "key": "first_contact",
          "label": "First contact with desire",
          "panel_phrase": "First contact with desire",
          "relationship_phrase": "The attraction or motivation is becoming recognizable.",
          "ingredient_justification": "Page / Princess gives embodiment and first handling; Fire / Wands gives ignition and will. The locked court phrase is fire made touchable."
        },
        {
          "key": "try_it",
          "label": "Try it carefully",
          "panel_phrase": "Try it carefully",
          "relationship_phrase": "Begin with a small action rather than a big declaration.",
          "ingredient_justification": "Page / Princess gives embodiment and first handling; Fire / Wands gives ignition and will. The locked court phrase is fire made touchable."
        }
      ]
    },
    {
      "card_id": "prince_of_wands",
      "name": "Knight of Wands / Prince of Wands",
      "group": "Courts",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "pursuit",
      "ingredients": [
        {
          "ref": "knight_prince",
          "name": "Knight / Prince",
          "operation": "motion, pursuit, transmission, strategy, direction, and carrying the element through a path"
        },
        {
          "ref": "fire_wands",
          "name": "Fire / Wands",
          "operation": "ignition, activation, will entering action"
        }
      ],
      "locked_relphi_interpretation": "Fire given motion and direction: will moving through strategy, message, pursuit, and visible force.",
      "senses": [
        {
          "key": "pursuit",
          "label": "Pursuit",
          "panel_phrase": "Pursuit",
          "relationship_phrase": "Someone is moving toward what they want.",
          "ingredient_justification": "Knight / Prince gives motion and direction; Fire / Wands gives ignition and will. The locked court phrase is fire given motion."
        },
        {
          "key": "rush",
          "label": "Rushing force",
          "panel_phrase": "Rushing force",
          "relationship_phrase": "Desire moves faster than reflection.",
          "ingredient_justification": "Knight / Prince gives motion and direction; Fire / Wands gives ignition and will. The locked court phrase is fire given motion."
        },
        {
          "key": "strategy",
          "label": "Directed action",
          "panel_phrase": "Directed action",
          "relationship_phrase": "Will needs a path, not only heat.",
          "ingredient_justification": "Knight / Prince gives motion and direction; Fire / Wands gives ignition and will. The locked court phrase is fire given motion."
        },
        {
          "key": "message",
          "label": "Hot message",
          "panel_phrase": "Hot message",
          "relationship_phrase": "Action arrives as a signal, invitation, or chase.",
          "ingredient_justification": "Knight / Prince gives motion and direction; Fire / Wands gives ignition and will. The locked court phrase is fire given motion."
        }
      ]
    },
    {
      "card_id": "queen_of_wands",
      "name": "Queen of Wands",
      "group": "Courts",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "warmth",
      "ingredients": [
        {
          "ref": "queen",
          "name": "Queen",
          "operation": "reception, interiorization, containment, modulation, and sustaining the element from within"
        },
        {
          "ref": "fire_wands",
          "name": "Fire / Wands",
          "operation": "ignition, activation, will entering action"
        }
      ],
      "locked_relphi_interpretation": "Fire held inward: warmth as atmosphere, desire contained without being extinguished, and active force made responsive.",
      "senses": [
        {
          "key": "warmth",
          "label": "Warmth as atmosphere",
          "panel_phrase": "Warmth as atmosphere",
          "relationship_phrase": "A person draws others through warmth and presence.",
          "ingredient_justification": "Queen gives reception and containment; Fire / Wands gives ignition and will. The locked court phrase is fire held inward."
        },
        {
          "key": "contained_desire",
          "label": "Contained desire",
          "panel_phrase": "Contained desire",
          "relationship_phrase": "Desire is present but held with self-command.",
          "ingredient_justification": "Queen gives reception and containment; Fire / Wands gives ignition and will. The locked court phrase is fire held inward."
        },
        {
          "key": "confidence",
          "label": "Radiant confidence",
          "panel_phrase": "Radiant confidence",
          "relationship_phrase": "Visibility and appetite are sustained from within.",
          "ingredient_justification": "Queen gives reception and containment; Fire / Wands gives ignition and will. The locked court phrase is fire held inward."
        },
        {
          "key": "responsive_fire",
          "label": "Responsive fire",
          "panel_phrase": "Responsive fire",
          "relationship_phrase": "Action stays alive without becoming reckless.",
          "ingredient_justification": "Queen gives reception and containment; Fire / Wands gives ignition and will. The locked court phrase is fire held inward."
        }
      ]
    },
    {
      "card_id": "king_of_wands",
      "name": "King of Wands / Knight of Wands",
      "group": "Courts",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "command",
      "ingredients": [
        {
          "ref": "king_knight",
          "name": "King / Knight",
          "operation": "command, ignition, projection, activation, and outward expression of the element"
        },
        {
          "ref": "fire_wands",
          "name": "Fire / Wands",
          "operation": "ignition, activation, will entering action"
        }
      ],
      "locked_relphi_interpretation": "Fire acting as itself: will ruling itself, force in open expression, ignition with command, and action without dilution.",
      "senses": [
        {
          "key": "command",
          "label": "Commanding will",
          "panel_phrase": "Commanding will",
          "relationship_phrase": "Someone acts from clear desire and authority.",
          "ingredient_justification": "King / Knight gives command and activation; Fire / Wands gives ignition and will. The locked court phrase is fire acting as itself."
        },
        {
          "key": "open_expression",
          "label": "Open expression",
          "panel_phrase": "Open expression",
          "relationship_phrase": "The wanting is visible and direct.",
          "ingredient_justification": "King / Knight gives command and activation; Fire / Wands gives ignition and will. The locked court phrase is fire acting as itself."
        },
        {
          "key": "self_rule",
          "label": "Will ruling itself",
          "panel_phrase": "Will ruling itself",
          "relationship_phrase": "Force governs itself instead of spilling everywhere.",
          "ingredient_justification": "King / Knight gives command and activation; Fire / Wands gives ignition and will. The locked court phrase is fire acting as itself."
        },
        {
          "key": "decisive_action",
          "label": "Decisive action",
          "panel_phrase": "Decisive action",
          "relationship_phrase": "The situation needs action without dilution.",
          "ingredient_justification": "King / Knight gives command and activation; Fire / Wands gives ignition and will. The locked court phrase is fire acting as itself."
        }
      ]
    },
    {
      "card_id": "page_of_cups",
      "name": "Page of Cups / Princess of Cups",
      "group": "Courts",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "tender_opening",
      "ingredients": [
        {
          "ref": "page_princess",
          "name": "Page / Princess",
          "operation": "embodiment, first handling, contact, material entry, carrying the element in a small usable form"
        },
        {
          "ref": "water_cups",
          "name": "Water / Cups",
          "operation": "reception, feeling, memory, bonding, softening, containment, and response"
        }
      ],
      "locked_relphi_interpretation": "Water made touchable: first feeling, first vessel, receptivity carried in small form, and emotion beginning to become recognizable.",
      "senses": [
        {
          "key": "tender_opening",
          "label": "Tender opening",
          "panel_phrase": "Tender opening",
          "relationship_phrase": "A small feeling or apology may be present.",
          "ingredient_justification": "Page / Princess gives embodiment and first handling; Water / Cups gives feeling and receptivity. The locked court phrase is water made touchable."
        },
        {
          "key": "first_feeling",
          "label": "First feeling",
          "panel_phrase": "First feeling",
          "relationship_phrase": "The feeling is real but young.",
          "ingredient_justification": "Page / Princess gives embodiment and first handling; Water / Cups gives feeling and receptivity. The locked court phrase is water made touchable."
        },
        {
          "key": "recognizable_emotion",
          "label": "Recognizable emotion",
          "panel_phrase": "Recognizable emotion",
          "relationship_phrase": "A mood becomes clear enough to name.",
          "ingredient_justification": "Page / Princess gives embodiment and first handling; Water / Cups gives feeling and receptivity. The locked court phrase is water made touchable."
        },
        {
          "key": "small_vessel",
          "label": "Small vessel",
          "panel_phrase": "Small vessel",
          "relationship_phrase": "Handle the feeling gently because it is still forming.",
          "ingredient_justification": "Page / Princess gives embodiment and first handling; Water / Cups gives feeling and receptivity. The locked court phrase is water made touchable."
        }
      ]
    },
    {
      "card_id": "prince_of_cups",
      "name": "Knight of Cups / Prince of Cups",
      "group": "Courts",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "longing",
      "ingredients": [
        {
          "ref": "knight_prince",
          "name": "Knight / Prince",
          "operation": "motion, pursuit, transmission, strategy, direction, and carrying the element through a path"
        },
        {
          "ref": "water_cups",
          "name": "Water / Cups",
          "operation": "reception, feeling, memory, bonding, softening, containment, and response"
        }
      ],
      "locked_relphi_interpretation": "Water given motion and language: feeling moving as image, message, longing, imagination, and relational signal.",
      "senses": [
        {
          "key": "longing",
          "label": "Longing in motion",
          "panel_phrase": "Longing in motion",
          "relationship_phrase": "Someone moves by feeling, desire, or imagination.",
          "ingredient_justification": "Knight / Prince gives motion and direction; Water / Cups gives feeling and receptivity. The locked court phrase is water given motion."
        },
        {
          "key": "romantic_signal",
          "label": "Romantic signal",
          "panel_phrase": "Romantic signal",
          "relationship_phrase": "Feeling is being offered as a message.",
          "ingredient_justification": "Knight / Prince gives motion and direction; Water / Cups gives feeling and receptivity. The locked court phrase is water given motion."
        },
        {
          "key": "image",
          "label": "Image over fact",
          "panel_phrase": "Image over fact",
          "relationship_phrase": "The emotional picture may be stronger than the practical reality.",
          "ingredient_justification": "Knight / Prince gives motion and direction; Water / Cups gives feeling and receptivity. The locked court phrase is water given motion."
        },
        {
          "key": "approach",
          "label": "Soft approach",
          "panel_phrase": "Soft approach",
          "relationship_phrase": "Move through invitation, not force.",
          "ingredient_justification": "Knight / Prince gives motion and direction; Water / Cups gives feeling and receptivity. The locked court phrase is water given motion."
        }
      ]
    },
    {
      "card_id": "queen_of_cups",
      "name": "Queen of Cups",
      "group": "Courts",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "deep_receptivity",
      "ingredients": [
        {
          "ref": "queen",
          "name": "Queen",
          "operation": "reception, interiorization, containment, modulation, and sustaining the element from within"
        },
        {
          "ref": "water_cups",
          "name": "Water / Cups",
          "operation": "reception, feeling, memory, bonding, softening, containment, and response"
        }
      ],
      "locked_relphi_interpretation": "Water receiving itself: feeling held within feeling, deep receptivity, inner tide, memory, care, and emotional atmosphere.",
      "senses": [
        {
          "key": "deep_receptivity",
          "label": "Deep receptivity",
          "panel_phrase": "Deep receptivity",
          "relationship_phrase": "Someone is deeply receptive or emotionally attuned.",
          "ingredient_justification": "Queen gives reception and containment; Water / Cups gives feeling and receptivity. The locked court phrase is water receiving itself."
        },
        {
          "key": "inner_tide",
          "label": "Inner tide",
          "panel_phrase": "Inner tide",
          "relationship_phrase": "Much is happening inside before it is spoken.",
          "ingredient_justification": "Queen gives reception and containment; Water / Cups gives feeling and receptivity. The locked court phrase is water receiving itself."
        },
        {
          "key": "care_field",
          "label": "Care field",
          "panel_phrase": "Care field",
          "relationship_phrase": "Care, memory, and mood shape the space.",
          "ingredient_justification": "Queen gives reception and containment; Water / Cups gives feeling and receptivity. The locked court phrase is water receiving itself."
        },
        {
          "key": "emotional_container",
          "label": "Emotional container",
          "panel_phrase": "Emotional container",
          "relationship_phrase": "The feeling needs a safe place to be held.",
          "ingredient_justification": "Queen gives reception and containment; Water / Cups gives feeling and receptivity. The locked court phrase is water receiving itself."
        }
      ]
    },
    {
      "card_id": "king_of_cups",
      "name": "King of Cups / Knight of Cups",
      "group": "Courts",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "steady_feeling",
      "ingredients": [
        {
          "ref": "king_knight",
          "name": "King / Knight",
          "operation": "command, ignition, projection, activation, and outward expression of the element"
        },
        {
          "ref": "water_cups",
          "name": "Water / Cups",
          "operation": "reception, feeling, memory, bonding, softening, containment, and response"
        }
      ],
      "locked_relphi_interpretation": "Water activated: feeling given will, emotion moved into action, care made forceful, and desire becoming directed.",
      "senses": [
        {
          "key": "steady_feeling",
          "label": "Steady feeling",
          "panel_phrase": "Steady feeling",
          "relationship_phrase": "Emotion is active but contained.",
          "ingredient_justification": "King / Knight gives command and activation; Water / Cups gives feeling and receptivity. The locked court phrase is water activated."
        },
        {
          "key": "directed_care",
          "label": "Directed care",
          "panel_phrase": "Directed care",
          "relationship_phrase": "Care becomes action.",
          "ingredient_justification": "King / Knight gives command and activation; Water / Cups gives feeling and receptivity. The locked court phrase is water activated."
        },
        {
          "key": "emotional_command",
          "label": "Emotional command",
          "panel_phrase": "Emotional command",
          "relationship_phrase": "Someone’s feelings organize the situation.",
          "ingredient_justification": "King / Knight gives command and activation; Water / Cups gives feeling and receptivity. The locked court phrase is water activated."
        },
        {
          "key": "calm_force",
          "label": "Calm force",
          "panel_phrase": "Calm force",
          "relationship_phrase": "The right move is firm without emotional flooding.",
          "ingredient_justification": "King / Knight gives command and activation; Water / Cups gives feeling and receptivity. The locked court phrase is water activated."
        }
      ]
    },
    {
      "card_id": "page_of_swords",
      "name": "Page of Swords / Princess of Swords",
      "group": "Courts",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "first_word",
      "ingredients": [
        {
          "ref": "page_princess",
          "name": "Page / Princess",
          "operation": "embodiment, first handling, contact, material entry, carrying the element in a small usable form"
        },
        {
          "ref": "air_swords",
          "name": "Air / Swords",
          "operation": "distinction, comparison, separation, relation, language, thought, distance, and pattern"
        }
      ],
      "locked_relphi_interpretation": "Air made touchable: the first word, first blade, first distinction, thought entering practice, and language becoming usable.",
      "senses": [
        {
          "key": "first_word",
          "label": "First word",
          "panel_phrase": "First word",
          "relationship_phrase": "The situation begins with a word, question, or observation.",
          "ingredient_justification": "Page / Princess gives embodiment and first handling; Air / Swords gives language and distinction. The locked court phrase is air made touchable."
        },
        {
          "key": "watching",
          "label": "Watching mind",
          "panel_phrase": "Watching mind",
          "relationship_phrase": "Someone is watching, learning, or testing language.",
          "ingredient_justification": "Page / Princess gives embodiment and first handling; Air / Swords gives language and distinction. The locked court phrase is air made touchable."
        },
        {
          "key": "usable_thought",
          "label": "Usable thought",
          "panel_phrase": "Usable thought",
          "relationship_phrase": "A thought becomes practical enough to handle.",
          "ingredient_justification": "Page / Princess gives embodiment and first handling; Air / Swords gives language and distinction. The locked court phrase is air made touchable."
        },
        {
          "key": "small_cut",
          "label": "Small cut",
          "panel_phrase": "Small cut",
          "relationship_phrase": "A small distinction changes the reading.",
          "ingredient_justification": "Page / Princess gives embodiment and first handling; Air / Swords gives language and distinction. The locked court phrase is air made touchable."
        }
      ]
    },
    {
      "card_id": "prince_of_swords",
      "name": "Knight of Swords / Prince of Swords",
      "group": "Courts",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "fast_words",
      "ingredients": [
        {
          "ref": "knight_prince",
          "name": "Knight / Prince",
          "operation": "motion, pursuit, transmission, strategy, direction, and carrying the element through a path"
        },
        {
          "ref": "air_swords",
          "name": "Air / Swords",
          "operation": "distinction, comparison, separation, relation, language, thought, distance, and pattern"
        }
      ],
      "locked_relphi_interpretation": "Air acting through Air: thought in motion, language accelerating, pattern pursuing pattern, and distinction sharpening itself.",
      "senses": [
        {
          "key": "fast_words",
          "label": "Fast words",
          "panel_phrase": "Fast words",
          "relationship_phrase": "Words move quickly and may cut.",
          "ingredient_justification": "Knight / Prince gives motion and direction; Air / Swords gives language and distinction. The locked court phrase is air accelerating."
        },
        {
          "key": "pursuing_answer",
          "label": "Pursuing an answer",
          "panel_phrase": "Pursuing an answer",
          "relationship_phrase": "The mind is chasing a conclusion.",
          "ingredient_justification": "Knight / Prince gives motion and direction; Air / Swords gives language and distinction. The locked court phrase is air accelerating."
        },
        {
          "key": "argument_path",
          "label": "Argument path",
          "panel_phrase": "Argument path",
          "relationship_phrase": "Language is becoming a forceful route.",
          "ingredient_justification": "Knight / Prince gives motion and direction; Air / Swords gives language and distinction. The locked court phrase is air accelerating."
        },
        {
          "key": "sharp_motion",
          "label": "Sharp motion",
          "panel_phrase": "Sharp motion",
          "relationship_phrase": "Decisions accelerate before feelings catch up.",
          "ingredient_justification": "Knight / Prince gives motion and direction; Air / Swords gives language and distinction. The locked court phrase is air accelerating."
        }
      ]
    },
    {
      "card_id": "queen_of_swords",
      "name": "Queen of Swords",
      "group": "Courts",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "clear_boundary",
      "ingredients": [
        {
          "ref": "queen",
          "name": "Queen",
          "operation": "reception, interiorization, containment, modulation, and sustaining the element from within"
        },
        {
          "ref": "air_swords",
          "name": "Air / Swords",
          "operation": "distinction, comparison, separation, relation, language, thought, distance, and pattern"
        }
      ],
      "locked_relphi_interpretation": "Air held inward: thought received into memory, distinction tempered by inner weather, and language held with emotional clarity.",
      "senses": [
        {
          "key": "clear_boundary",
          "label": "Clear boundary",
          "panel_phrase": "Clear boundary",
          "relationship_phrase": "A clean boundary or definition is needed.",
          "ingredient_justification": "Queen gives reception and containment; Air / Swords gives language and distinction. The locked court phrase is air held inward."
        },
        {
          "key": "felt_discernment",
          "label": "Felt discernment",
          "panel_phrase": "Felt discernment",
          "relationship_phrase": "Discernment includes emotional memory.",
          "ingredient_justification": "Queen gives reception and containment; Air / Swords gives language and distinction. The locked court phrase is air held inward."
        },
        {
          "key": "cool_truth",
          "label": "Cool truth",
          "panel_phrase": "Cool truth",
          "relationship_phrase": "The truth can be spoken without heat.",
          "ingredient_justification": "Queen gives reception and containment; Air / Swords gives language and distinction. The locked court phrase is air held inward."
        },
        {
          "key": "inner_judgment",
          "label": "Inner judgment",
          "panel_phrase": "Inner judgment",
          "relationship_phrase": "Someone is privately weighing the words.",
          "ingredient_justification": "Queen gives reception and containment; Air / Swords gives language and distinction. The locked court phrase is air held inward."
        }
      ]
    },
    {
      "card_id": "king_of_swords",
      "name": "King of Swords / Knight of Swords",
      "group": "Courts",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "decisive_word",
      "ingredients": [
        {
          "ref": "king_knight",
          "name": "King / Knight",
          "operation": "command, ignition, projection, activation, and outward expression of the element"
        },
        {
          "ref": "air_swords",
          "name": "Air / Swords",
          "operation": "distinction, comparison, separation, relation, language, thought, distance, and pattern"
        }
      ],
      "locked_relphi_interpretation": "Air activated: thought as command, language as force, distinction becoming action, and the word made decisive.",
      "senses": [
        {
          "key": "decisive_word",
          "label": "Decisive word",
          "panel_phrase": "Decisive word",
          "relationship_phrase": "A decision, statement, or rule shapes the situation.",
          "ingredient_justification": "King / Knight gives command and activation; Air / Swords gives language and distinction. The locked court phrase is air activated."
        },
        {
          "key": "thought_command",
          "label": "Thought command",
          "panel_phrase": "Thought command",
          "relationship_phrase": "Language becomes authority.",
          "ingredient_justification": "King / Knight gives command and activation; Air / Swords gives language and distinction. The locked court phrase is air activated."
        },
        {
          "key": "clear_terms",
          "label": "Clear terms",
          "panel_phrase": "Clear terms",
          "relationship_phrase": "The terms must be stated plainly.",
          "ingredient_justification": "King / Knight gives command and activation; Air / Swords gives language and distinction. The locked court phrase is air activated."
        },
        {
          "key": "reason_as_action",
          "label": "Reason as action",
          "panel_phrase": "Reason as action",
          "relationship_phrase": "The next move is intellectual, legal, verbal, or strategic.",
          "ingredient_justification": "King / Knight gives command and activation; Air / Swords gives language and distinction. The locked court phrase is air activated."
        }
      ]
    },
    {
      "card_id": "page_of_pentacles",
      "name": "Page of Pentacles / Princess of Disks",
      "group": "Courts",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "small_resource",
      "ingredients": [
        {
          "ref": "page_princess",
          "name": "Page / Princess",
          "operation": "embodiment, first handling, contact, material entry, carrying the element in a small usable form"
        },
        {
          "ref": "earth_pentacles_disks",
          "name": "Earth / Pentacles / Disks",
          "operation": "embodiment, stabilization, storage, boundary, materialization, endurance, and consequence"
        }
      ],
      "locked_relphi_interpretation": "Earth made touchable to itself: first body, first resource, first seed, matter entering practice, and value becoming holdable.",
      "senses": [
        {
          "key": "small_resource",
          "label": "Small resource",
          "panel_phrase": "Small resource",
          "relationship_phrase": "A real but modest resource is available.",
          "ingredient_justification": "Page / Princess gives embodiment and first handling; Earth / Pentacles gives embodiment and resource. The locked court phrase is earth made touchable."
        },
        {
          "key": "learning_practice",
          "label": "Learning practice",
          "panel_phrase": "Learning practice",
          "relationship_phrase": "The situation improves through practice.",
          "ingredient_justification": "Page / Princess gives embodiment and first handling; Earth / Pentacles gives embodiment and resource. The locked court phrase is earth made touchable."
        },
        {
          "key": "seed_value",
          "label": "Seed value",
          "panel_phrase": "Seed value",
          "relationship_phrase": "A small thing may grow if tended.",
          "ingredient_justification": "Page / Princess gives embodiment and first handling; Earth / Pentacles gives embodiment and resource. The locked court phrase is earth made touchable."
        },
        {
          "key": "body_contact",
          "label": "Body contact",
          "panel_phrase": "Body contact",
          "relationship_phrase": "Bring the issue into time, touch, schedule, or evidence.",
          "ingredient_justification": "Page / Princess gives embodiment and first handling; Earth / Pentacles gives embodiment and resource. The locked court phrase is earth made touchable."
        }
      ]
    },
    {
      "card_id": "prince_of_disks",
      "name": "Knight of Pentacles / Prince of Disks",
      "group": "Courts",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "steady_method",
      "ingredients": [
        {
          "ref": "knight_prince",
          "name": "Knight / Prince",
          "operation": "motion, pursuit, transmission, strategy, direction, and carrying the element through a path"
        },
        {
          "ref": "earth_pentacles_disks",
          "name": "Earth / Pentacles / Disks",
          "operation": "embodiment, stabilization, storage, boundary, materialization, endurance, and consequence"
        }
      ],
      "locked_relphi_interpretation": "Earth given motion and structure through thought: matter planned, resource measured, work organized, and form carried through method.",
      "senses": [
        {
          "key": "steady_method",
          "label": "Steady method",
          "panel_phrase": "Steady method",
          "relationship_phrase": "Slow consistency matters.",
          "ingredient_justification": "Knight / Prince gives motion and direction; Earth / Pentacles gives embodiment and resource. The locked court phrase is earth given method."
        },
        {
          "key": "planned_resource",
          "label": "Planned resource",
          "panel_phrase": "Planned resource",
          "relationship_phrase": "Resources need a plan.",
          "ingredient_justification": "Knight / Prince gives motion and direction; Earth / Pentacles gives embodiment and resource. The locked court phrase is earth given method."
        },
        {
          "key": "work_path",
          "label": "Work path",
          "panel_phrase": "Work path",
          "relationship_phrase": "The bond or issue moves through work, not drama.",
          "ingredient_justification": "Knight / Prince gives motion and direction; Earth / Pentacles gives embodiment and resource. The locked court phrase is earth given method."
        },
        {
          "key": "measured_progress",
          "label": "Measured progress",
          "panel_phrase": "Measured progress",
          "relationship_phrase": "Progress is real if it can be measured.",
          "ingredient_justification": "Knight / Prince gives motion and direction; Earth / Pentacles gives embodiment and resource. The locked court phrase is earth given method."
        }
      ]
    },
    {
      "card_id": "queen_of_pentacles",
      "name": "Queen of Pentacles / Queen of Disks",
      "group": "Courts",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "embodied_care",
      "ingredients": [
        {
          "ref": "queen",
          "name": "Queen",
          "operation": "reception, interiorization, containment, modulation, and sustaining the element from within"
        },
        {
          "ref": "earth_pentacles_disks",
          "name": "Earth / Pentacles / Disks",
          "operation": "embodiment, stabilization, storage, boundary, materialization, endurance, and consequence"
        }
      ],
      "locked_relphi_interpretation": "Earth held inward: matter receiving care, body as vessel, resource sustained, form softened into nurture, and value protected through containment.",
      "senses": [
        {
          "key": "embodied_care",
          "label": "Embodied care",
          "panel_phrase": "Embodied care",
          "relationship_phrase": "Care shows through food, body, time, shelter, or support.",
          "ingredient_justification": "Queen gives reception and containment; Earth / Pentacles gives embodiment and resource. The locked court phrase is earth held inward."
        },
        {
          "key": "protected_value",
          "label": "Protected value",
          "panel_phrase": "Protected value",
          "relationship_phrase": "Value is protected through containment.",
          "ingredient_justification": "Queen gives reception and containment; Earth / Pentacles gives embodiment and resource. The locked court phrase is earth held inward."
        },
        {
          "key": "sustaining_place",
          "label": "Sustaining place",
          "panel_phrase": "Sustaining place",
          "relationship_phrase": "The environment itself is part of the answer.",
          "ingredient_justification": "Queen gives reception and containment; Earth / Pentacles gives embodiment and resource. The locked court phrase is earth held inward."
        },
        {
          "key": "soft_form",
          "label": "Soft form",
          "panel_phrase": "Soft form",
          "relationship_phrase": "Stability should feel livable, not rigid.",
          "ingredient_justification": "Queen gives reception and containment; Earth / Pentacles gives embodiment and resource. The locked court phrase is earth held inward."
        }
      ]
    },
    {
      "card_id": "king_of_pentacles",
      "name": "King of Pentacles / Knight of Disks",
      "group": "Courts",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "directed_resource",
      "ingredients": [
        {
          "ref": "king_knight",
          "name": "King / Knight",
          "operation": "command, ignition, projection, activation, and outward expression of the element"
        },
        {
          "ref": "earth_pentacles_disks",
          "name": "Earth / Pentacles / Disks",
          "operation": "embodiment, stabilization, storage, boundary, materialization, endurance, and consequence"
        }
      ],
      "locked_relphi_interpretation": "Earth activated: matter put to work, resources directed, form given will, and embodiment made productive.",
      "senses": [
        {
          "key": "directed_resource",
          "label": "Directed resource",
          "panel_phrase": "Directed resource",
          "relationship_phrase": "Resources are being directed or controlled.",
          "ingredient_justification": "King / Knight gives command and activation; Earth / Pentacles gives embodiment and resource. The locked court phrase is earth activated."
        },
        {
          "key": "productive_body",
          "label": "Productive body",
          "panel_phrase": "Productive body",
          "relationship_phrase": "The material world is being put to work.",
          "ingredient_justification": "King / Knight gives command and activation; Earth / Pentacles gives embodiment and resource. The locked court phrase is earth activated."
        },
        {
          "key": "real_commitment",
          "label": "Real commitment",
          "panel_phrase": "Real commitment",
          "relationship_phrase": "Commitment must show up in form.",
          "ingredient_justification": "King / Knight gives command and activation; Earth / Pentacles gives embodiment and resource. The locked court phrase is earth activated."
        },
        {
          "key": "earth_command",
          "label": "Earth command",
          "panel_phrase": "Earth command",
          "relationship_phrase": "Practical authority shapes the situation.",
          "ingredient_justification": "King / Knight gives command and activation; Earth / Pentacles gives embodiment and resource. The locked court phrase is earth activated."
        }
      ]
    },
    {
      "card_id": "two_of_wands",
      "name": "Two of Wands",
      "group": "Wands 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "direction",
      "ingredients": [
        {
          "ref": "two",
          "name": "Two",
          "operation": "polarity, division, relation, first axis"
        },
        {
          "ref": "fire_wands",
          "name": "Fire / Wands",
          "operation": "ignition, activation, will entering action"
        },
        {
          "ref": "mars",
          "name": "Mars",
          "operation": "action, assertion, friction, cutting force"
        },
        {
          "ref": "aries",
          "name": "Aries",
          "operation": "emergence, initiation, direct beginning, cardinal fire"
        }
      ],
      "locked_relphi_interpretation": "The Two of Wands is active force meeting its first axis: will divides into direction, action confronts another possible line, and fire begins to know itself through opposition.",
      "senses": [
        {
          "key": "direction",
          "label": "Choosing direction",
          "panel_phrase": "Choosing direction",
          "relationship_phrase": "Desire is split between possible directions.",
          "ingredient_justification": "Two supplies polarity, division, relation, first axis; Fire / Wands supplies ignition, activation, will entering action; Mars supplies action, assertion, friction, cutting force; Aries supplies emergence, initiation, direct beginning, cardinal fire. This sense emphasizes the card's derived field: The Two of Wands is active force meeting its first axis: will divides into direction, action confronts another possible line, and fire begins to know itself through opposition."
        },
        {
          "key": "axis",
          "label": "First axis",
          "panel_phrase": "First axis",
          "relationship_phrase": "A relationship axis is forming through want and action.",
          "ingredient_justification": "Two supplies polarity, division, relation, first axis; Fire / Wands supplies ignition, activation, will entering action; Mars supplies action, assertion, friction, cutting force; Aries supplies emergence, initiation, direct beginning, cardinal fire. This sense emphasizes the card's derived field: The Two of Wands is active force meeting its first axis: will divides into direction, action confronts another possible line, and fire begins to know itself through opposition."
        },
        {
          "key": "ambition",
          "label": "Held ambition",
          "panel_phrase": "Held ambition",
          "relationship_phrase": "Someone can see the larger aim but has not fully moved.",
          "ingredient_justification": "Two supplies polarity, division, relation, first axis; Fire / Wands supplies ignition, activation, will entering action; Mars supplies action, assertion, friction, cutting force; Aries supplies emergence, initiation, direct beginning, cardinal fire. This sense emphasizes the card's derived field: The Two of Wands is active force meeting its first axis: will divides into direction, action confronts another possible line, and fire begins to know itself through opposition."
        },
        {
          "key": "tension",
          "label": "This versus that",
          "panel_phrase": "This versus that",
          "relationship_phrase": "Two possibilities compete for action.",
          "ingredient_justification": "Two supplies polarity, division, relation, first axis; Fire / Wands supplies ignition, activation, will entering action; Mars supplies action, assertion, friction, cutting force; Aries supplies emergence, initiation, direct beginning, cardinal fire. This sense emphasizes the card's derived field: The Two of Wands is active force meeting its first axis: will divides into direction, action confronts another possible line, and fire begins to know itself through opposition."
        }
      ]
    },
    {
      "card_id": "three_of_wands",
      "name": "Three of Wands",
      "group": "Wands 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "emergence",
      "ingredients": [
        {
          "ref": "three",
          "name": "Three",
          "operation": "emergence, growth, triangulation, first pattern"
        },
        {
          "ref": "fire_wands",
          "name": "Fire / Wands",
          "operation": "ignition, activation, will entering action"
        },
        {
          "ref": "sun",
          "name": "Sun",
          "operation": "illumination, identity, vitality, central radiance"
        },
        {
          "ref": "aries",
          "name": "Aries",
          "operation": "emergence, initiation, direct beginning, cardinal fire"
        }
      ],
      "locked_relphi_interpretation": "The Three of Wands is active force beginning to radiate as a pattern: will has moved beyond opposition into visible emergence, and action starts to show its own form.",
      "senses": [
        {
          "key": "emergence",
          "label": "Plan emerging",
          "panel_phrase": "Plan emerging",
          "relationship_phrase": "Something wanted is beginning to take visible shape.",
          "ingredient_justification": "Three supplies emergence, growth, triangulation, first pattern; Fire / Wands supplies ignition, activation, will entering action; Sun supplies illumination, identity, vitality, central radiance; Aries supplies emergence, initiation, direct beginning, cardinal fire. This sense emphasizes the card's derived field: The Three of Wands is active force beginning to radiate as a pattern: will has moved beyond opposition into visible emergence, and action starts to show its own form."
        },
        {
          "key": "extension",
          "label": "Reaching outward",
          "panel_phrase": "Reaching outward",
          "relationship_phrase": "The situation extends beyond the present place.",
          "ingredient_justification": "Three supplies emergence, growth, triangulation, first pattern; Fire / Wands supplies ignition, activation, will entering action; Sun supplies illumination, identity, vitality, central radiance; Aries supplies emergence, initiation, direct beginning, cardinal fire. This sense emphasizes the card's derived field: The Three of Wands is active force beginning to radiate as a pattern: will has moved beyond opposition into visible emergence, and action starts to show its own form."
        },
        {
          "key": "confidence",
          "label": "Visible growth",
          "panel_phrase": "Visible growth",
          "relationship_phrase": "Action has moved far enough to show a pattern.",
          "ingredient_justification": "Three supplies emergence, growth, triangulation, first pattern; Fire / Wands supplies ignition, activation, will entering action; Sun supplies illumination, identity, vitality, central radiance; Aries supplies emergence, initiation, direct beginning, cardinal fire. This sense emphasizes the card's derived field: The Three of Wands is active force beginning to radiate as a pattern: will has moved beyond opposition into visible emergence, and action starts to show its own form."
        },
        {
          "key": "waiting_signal",
          "label": "Waiting for return",
          "panel_phrase": "Waiting for return",
          "relationship_phrase": "Energy has been sent out and the response matters.",
          "ingredient_justification": "Three supplies emergence, growth, triangulation, first pattern; Fire / Wands supplies ignition, activation, will entering action; Sun supplies illumination, identity, vitality, central radiance; Aries supplies emergence, initiation, direct beginning, cardinal fire. This sense emphasizes the card's derived field: The Three of Wands is active force beginning to radiate as a pattern: will has moved beyond opposition into visible emergence, and action starts to show its own form."
        }
      ]
    },
    {
      "card_id": "four_of_wands",
      "name": "Four of Wands",
      "group": "Wands 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "place",
      "ingredients": [
        {
          "ref": "four",
          "name": "Four",
          "operation": "stability, container, form"
        },
        {
          "ref": "fire_wands",
          "name": "Fire / Wands",
          "operation": "ignition, activation, will entering action"
        },
        {
          "ref": "venus",
          "name": "Venus",
          "operation": "attraction, value, pleasure, coherence, joining"
        },
        {
          "ref": "aries",
          "name": "Aries",
          "operation": "emergence, initiation, direct beginning, cardinal fire"
        }
      ],
      "locked_relphi_interpretation": "The Four of Wands is active force held in form: ignition given a place, will stabilized into a livable pattern, and first action gathered into coherent structure.",
      "senses": [
        {
          "key": "place",
          "label": "A place for joy",
          "panel_phrase": "A place for joy",
          "relationship_phrase": "The bond wants a stable place to happen.",
          "ingredient_justification": "Four supplies stability, container, form; Fire / Wands supplies ignition, activation, will entering action; Venus supplies attraction, value, pleasure, coherence, joining; Aries supplies emergence, initiation, direct beginning, cardinal fire. This sense emphasizes the card's derived field: The Four of Wands is active force held in form: ignition given a place, will stabilized into a livable pattern, and first action gathered into coherent structure."
        },
        {
          "key": "settling",
          "label": "Settling the fire",
          "panel_phrase": "Settling the fire",
          "relationship_phrase": "Excitement becomes livable when given form.",
          "ingredient_justification": "Four supplies stability, container, form; Fire / Wands supplies ignition, activation, will entering action; Venus supplies attraction, value, pleasure, coherence, joining; Aries supplies emergence, initiation, direct beginning, cardinal fire. This sense emphasizes the card's derived field: The Four of Wands is active force held in form: ignition given a place, will stabilized into a livable pattern, and first action gathered into coherent structure."
        },
        {
          "key": "threshold",
          "label": "Shared threshold",
          "panel_phrase": "Shared threshold",
          "relationship_phrase": "A transition or welcome point holds the energy.",
          "ingredient_justification": "Four supplies stability, container, form; Fire / Wands supplies ignition, activation, will entering action; Venus supplies attraction, value, pleasure, coherence, joining; Aries supplies emergence, initiation, direct beginning, cardinal fire. This sense emphasizes the card's derived field: The Four of Wands is active force held in form: ignition given a place, will stabilized into a livable pattern, and first action gathered into coherent structure."
        },
        {
          "key": "structure",
          "label": "Supported celebration",
          "panel_phrase": "Supported celebration",
          "relationship_phrase": "Support makes the warmth safe to inhabit.",
          "ingredient_justification": "Four supplies stability, container, form; Fire / Wands supplies ignition, activation, will entering action; Venus supplies attraction, value, pleasure, coherence, joining; Aries supplies emergence, initiation, direct beginning, cardinal fire. This sense emphasizes the card's derived field: The Four of Wands is active force held in form: ignition given a place, will stabilized into a livable pattern, and first action gathered into coherent structure."
        }
      ]
    },
    {
      "card_id": "five_of_wands",
      "name": "Five of Wands",
      "group": "Wands 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "friction",
      "ingredients": [
        {
          "ref": "five",
          "name": "Five",
          "operation": "disturbance, pressure, disruption, instability"
        },
        {
          "ref": "fire_wands",
          "name": "Fire / Wands",
          "operation": "ignition, activation, will entering action"
        },
        {
          "ref": "saturn",
          "name": "Saturn",
          "operation": "limit, compression, boundary, weight, consequence"
        },
        {
          "ref": "leo",
          "name": "Leo",
          "operation": "expression, radiance, visibility, fixed fire"
        }
      ],
      "locked_relphi_interpretation": "The Five of Wands is expressive fire under pressure: will wants to radiate, but limit and disturbance create friction, contest, and unstable force.",
      "senses": [
        {
          "key": "friction",
          "label": "Friction",
          "panel_phrase": "Friction",
          "relationship_phrase": "Wants collide under pressure.",
          "ingredient_justification": "Five supplies disturbance, pressure, disruption, instability; Fire / Wands supplies ignition, activation, will entering action; Saturn supplies limit, compression, boundary, weight, consequence; Leo supplies expression, radiance, visibility, fixed fire. This sense emphasizes the card's derived field: The Five of Wands is expressive fire under pressure: will wants to radiate, but limit and disturbance create friction, contest, and unstable force."
        },
        {
          "key": "competition",
          "label": "Competing wills",
          "panel_phrase": "Competing wills",
          "relationship_phrase": "Different impulses seek expression at once.",
          "ingredient_justification": "Five supplies disturbance, pressure, disruption, instability; Fire / Wands supplies ignition, activation, will entering action; Saturn supplies limit, compression, boundary, weight, consequence; Leo supplies expression, radiance, visibility, fixed fire. This sense emphasizes the card's derived field: The Five of Wands is expressive fire under pressure: will wants to radiate, but limit and disturbance create friction, contest, and unstable force."
        },
        {
          "key": "unstable_force",
          "label": "Unstable force",
          "panel_phrase": "Unstable force",
          "relationship_phrase": "Energy is active but not coordinated.",
          "ingredient_justification": "Five supplies disturbance, pressure, disruption, instability; Fire / Wands supplies ignition, activation, will entering action; Saturn supplies limit, compression, boundary, weight, consequence; Leo supplies expression, radiance, visibility, fixed fire. This sense emphasizes the card's derived field: The Five of Wands is expressive fire under pressure: will wants to radiate, but limit and disturbance create friction, contest, and unstable force."
        },
        {
          "key": "pressure_test",
          "label": "Pressure test",
          "panel_phrase": "Pressure test",
          "relationship_phrase": "Conflict reveals what each person wants.",
          "ingredient_justification": "Five supplies disturbance, pressure, disruption, instability; Fire / Wands supplies ignition, activation, will entering action; Saturn supplies limit, compression, boundary, weight, consequence; Leo supplies expression, radiance, visibility, fixed fire. This sense emphasizes the card's derived field: The Five of Wands is expressive fire under pressure: will wants to radiate, but limit and disturbance create friction, contest, and unstable force."
        }
      ]
    },
    {
      "card_id": "six_of_wands",
      "name": "Six of Wands",
      "group": "Wands 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "recognition",
      "ingredients": [
        {
          "ref": "six",
          "name": "Six",
          "operation": "coordination, balance, integration, restored relation"
        },
        {
          "ref": "fire_wands",
          "name": "Fire / Wands",
          "operation": "ignition, activation, will entering action"
        },
        {
          "ref": "jupiter",
          "name": "Jupiter",
          "operation": "expansion, increase, confidence, blessing, enlargement"
        },
        {
          "ref": "leo",
          "name": "Leo",
          "operation": "expression, radiance, visibility, fixed fire"
        }
      ],
      "locked_relphi_interpretation": "The Six of Wands is expressive fire enlarged into coherence: will is visible, supported, and able to stand in a wider field without losing its center.",
      "senses": [
        {
          "key": "recognition",
          "label": "Visible support",
          "panel_phrase": "Visible support",
          "relationship_phrase": "Someone’s will is recognized by the wider field.",
          "ingredient_justification": "Six supplies coordination, balance, integration, restored relation; Fire / Wands supplies ignition, activation, will entering action; Jupiter supplies expansion, increase, confidence, blessing, enlargement; Leo supplies expression, radiance, visibility, fixed fire. This sense emphasizes the card's derived field: The Six of Wands is expressive fire enlarged into coherence: will is visible, supported, and able to stand in a wider field without losing its center."
        },
        {
          "key": "centered_success",
          "label": "Centered success",
          "panel_phrase": "Centered success",
          "relationship_phrase": "Desire holds its center while being seen.",
          "ingredient_justification": "Six supplies coordination, balance, integration, restored relation; Fire / Wands supplies ignition, activation, will entering action; Jupiter supplies expansion, increase, confidence, blessing, enlargement; Leo supplies expression, radiance, visibility, fixed fire. This sense emphasizes the card's derived field: The Six of Wands is expressive fire enlarged into coherence: will is visible, supported, and able to stand in a wider field without losing its center."
        },
        {
          "key": "confidence",
          "label": "Confidence restored",
          "panel_phrase": "Confidence restored",
          "relationship_phrase": "Support helps action regain coherence.",
          "ingredient_justification": "Six supplies coordination, balance, integration, restored relation; Fire / Wands supplies ignition, activation, will entering action; Jupiter supplies expansion, increase, confidence, blessing, enlargement; Leo supplies expression, radiance, visibility, fixed fire. This sense emphasizes the card's derived field: The Six of Wands is expressive fire enlarged into coherence: will is visible, supported, and able to stand in a wider field without losing its center."
        },
        {
          "key": "public_signal",
          "label": "Public signal",
          "panel_phrase": "Public signal",
          "relationship_phrase": "The visible message matters.",
          "ingredient_justification": "Six supplies coordination, balance, integration, restored relation; Fire / Wands supplies ignition, activation, will entering action; Jupiter supplies expansion, increase, confidence, blessing, enlargement; Leo supplies expression, radiance, visibility, fixed fire. This sense emphasizes the card's derived field: The Six of Wands is expressive fire enlarged into coherence: will is visible, supported, and able to stand in a wider field without losing its center."
        }
      ]
    },
    {
      "card_id": "seven_of_wands",
      "name": "Seven of Wands",
      "group": "Wands 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "defense",
      "ingredients": [
        {
          "ref": "seven",
          "name": "Seven",
          "operation": "test, threshold, defense, asymmetry, pressure on position"
        },
        {
          "ref": "fire_wands",
          "name": "Fire / Wands",
          "operation": "ignition, activation, will entering action"
        },
        {
          "ref": "mars",
          "name": "Mars",
          "operation": "action, assertion, friction, cutting force"
        },
        {
          "ref": "leo",
          "name": "Leo",
          "operation": "expression, radiance, visibility, fixed fire"
        }
      ],
      "locked_relphi_interpretation": "The Seven of Wands is visible fire defending its position: will stands exposed, assertion meets challenge, and expressive force must hold itself under pressure.",
      "senses": [
        {
          "key": "defense",
          "label": "Defending position",
          "panel_phrase": "Defending position",
          "relationship_phrase": "Someone must hold their ground.",
          "ingredient_justification": "Seven supplies test, threshold, defense, asymmetry, pressure on position; Fire / Wands supplies ignition, activation, will entering action; Mars supplies action, assertion, friction, cutting force; Leo supplies expression, radiance, visibility, fixed fire. This sense emphasizes the card's derived field: The Seven of Wands is visible fire defending its position: will stands exposed, assertion meets challenge, and expressive force must hold itself under pressure."
        },
        {
          "key": "exposure",
          "label": "Exposed will",
          "panel_phrase": "Exposed will",
          "relationship_phrase": "A desire is visible and challenged.",
          "ingredient_justification": "Seven supplies test, threshold, defense, asymmetry, pressure on position; Fire / Wands supplies ignition, activation, will entering action; Mars supplies action, assertion, friction, cutting force; Leo supplies expression, radiance, visibility, fixed fire. This sense emphasizes the card's derived field: The Seven of Wands is visible fire defending its position: will stands exposed, assertion meets challenge, and expressive force must hold itself under pressure."
        },
        {
          "key": "boundary",
          "label": "Active boundary",
          "panel_phrase": "Active boundary",
          "relationship_phrase": "The answer requires a firm stance.",
          "ingredient_justification": "Seven supplies test, threshold, defense, asymmetry, pressure on position; Fire / Wands supplies ignition, activation, will entering action; Mars supplies action, assertion, friction, cutting force; Leo supplies expression, radiance, visibility, fixed fire. This sense emphasizes the card's derived field: The Seven of Wands is visible fire defending its position: will stands exposed, assertion meets challenge, and expressive force must hold itself under pressure."
        },
        {
          "key": "asymmetry",
          "label": "One against many",
          "panel_phrase": "One against many",
          "relationship_phrase": "The pressure is uneven, so position matters.",
          "ingredient_justification": "Seven supplies test, threshold, defense, asymmetry, pressure on position; Fire / Wands supplies ignition, activation, will entering action; Mars supplies action, assertion, friction, cutting force; Leo supplies expression, radiance, visibility, fixed fire. This sense emphasizes the card's derived field: The Seven of Wands is visible fire defending its position: will stands exposed, assertion meets challenge, and expressive force must hold itself under pressure."
        }
      ]
    },
    {
      "card_id": "eight_of_wands",
      "name": "Eight of Wands",
      "group": "Wands 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "momentum",
      "ingredients": [
        {
          "ref": "eight",
          "name": "Eight",
          "operation": "motion through system, rhythm, repetition, circulation, momentum"
        },
        {
          "ref": "fire_wands",
          "name": "Fire / Wands",
          "operation": "ignition, activation, will entering action"
        },
        {
          "ref": "mercury",
          "name": "Mercury",
          "operation": "language, exchange, translation, movement, connection"
        },
        {
          "ref": "sagittarius",
          "name": "Sagittarius",
          "operation": "aim, horizon, trajectory, mutable fire"
        }
      ],
      "locked_relphi_interpretation": "The Eight of Wands is fire transmitted through a moving system: will becomes trajectory, message, rhythm, and rapid outward motion toward a distant aim.",
      "senses": [
        {
          "key": "momentum",
          "label": "Fast momentum",
          "panel_phrase": "Fast momentum",
          "relationship_phrase": "Events or messages move quickly.",
          "ingredient_justification": "Eight supplies motion through system, rhythm, repetition, circulation, momentum; Fire / Wands supplies ignition, activation, will entering action; Mercury supplies language, exchange, translation, movement, connection; Sagittarius supplies aim, horizon, trajectory, mutable fire. This sense emphasizes the card's derived field: The Eight of Wands is fire transmitted through a moving system: will becomes trajectory, message, rhythm, and rapid outward motion toward a distant aim."
        },
        {
          "key": "transmission",
          "label": "Message in flight",
          "panel_phrase": "Message in flight",
          "relationship_phrase": "Will becomes signal or communication.",
          "ingredient_justification": "Eight supplies motion through system, rhythm, repetition, circulation, momentum; Fire / Wands supplies ignition, activation, will entering action; Mercury supplies language, exchange, translation, movement, connection; Sagittarius supplies aim, horizon, trajectory, mutable fire. This sense emphasizes the card's derived field: The Eight of Wands is fire transmitted through a moving system: will becomes trajectory, message, rhythm, and rapid outward motion toward a distant aim."
        },
        {
          "key": "trajectory",
          "label": "Clear trajectory",
          "panel_phrase": "Clear trajectory",
          "relationship_phrase": "Action has a path and a destination.",
          "ingredient_justification": "Eight supplies motion through system, rhythm, repetition, circulation, momentum; Fire / Wands supplies ignition, activation, will entering action; Mercury supplies language, exchange, translation, movement, connection; Sagittarius supplies aim, horizon, trajectory, mutable fire. This sense emphasizes the card's derived field: The Eight of Wands is fire transmitted through a moving system: will becomes trajectory, message, rhythm, and rapid outward motion toward a distant aim."
        },
        {
          "key": "acceleration",
          "label": "Acceleration",
          "panel_phrase": "Acceleration",
          "relationship_phrase": "The pace itself shapes the situation.",
          "ingredient_justification": "Eight supplies motion through system, rhythm, repetition, circulation, momentum; Fire / Wands supplies ignition, activation, will entering action; Mercury supplies language, exchange, translation, movement, connection; Sagittarius supplies aim, horizon, trajectory, mutable fire. This sense emphasizes the card's derived field: The Eight of Wands is fire transmitted through a moving system: will becomes trajectory, message, rhythm, and rapid outward motion toward a distant aim."
        }
      ]
    },
    {
      "card_id": "nine_of_wands",
      "name": "Nine of Wands",
      "group": "Wands 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "endurance",
      "ingredients": [
        {
          "ref": "nine",
          "name": "Nine",
          "operation": "concentration, culmination, inner reserve, completion before release"
        },
        {
          "ref": "fire_wands",
          "name": "Fire / Wands",
          "operation": "ignition, activation, will entering action"
        },
        {
          "ref": "moon",
          "name": "Moon",
          "operation": "rhythm, memory, instinct, mood, protection, recurrence"
        },
        {
          "ref": "sagittarius",
          "name": "Sagittarius",
          "operation": "aim, horizon, trajectory, mutable fire"
        }
      ],
      "locked_relphi_interpretation": "The Nine of Wands is aimed fire held in reserve: will has endured, memory guards the path, and force remains concentrated before final release.",
      "senses": [
        {
          "key": "endurance",
          "label": "Guarded endurance",
          "panel_phrase": "Guarded endurance",
          "relationship_phrase": "Someone has lasted but is still braced.",
          "ingredient_justification": "Nine supplies concentration, culmination, inner reserve, completion before release; Fire / Wands supplies ignition, activation, will entering action; Moon supplies rhythm, memory, instinct, mood, protection, recurrence; Sagittarius supplies aim, horizon, trajectory, mutable fire. This sense emphasizes the card's derived field: The Nine of Wands is aimed fire held in reserve: will has endured, memory guards the path, and force remains concentrated before final release."
        },
        {
          "key": "reserve",
          "label": "Fire in reserve",
          "panel_phrase": "Fire in reserve",
          "relationship_phrase": "Strength is held back before final release.",
          "ingredient_justification": "Nine supplies concentration, culmination, inner reserve, completion before release; Fire / Wands supplies ignition, activation, will entering action; Moon supplies rhythm, memory, instinct, mood, protection, recurrence; Sagittarius supplies aim, horizon, trajectory, mutable fire. This sense emphasizes the card's derived field: The Nine of Wands is aimed fire held in reserve: will has endured, memory guards the path, and force remains concentrated before final release."
        },
        {
          "key": "memory_guard",
          "label": "Memory guards the path",
          "panel_phrase": "Memory guards the path",
          "relationship_phrase": "Past experience shapes current caution.",
          "ingredient_justification": "Nine supplies concentration, culmination, inner reserve, completion before release; Fire / Wands supplies ignition, activation, will entering action; Moon supplies rhythm, memory, instinct, mood, protection, recurrence; Sagittarius supplies aim, horizon, trajectory, mutable fire. This sense emphasizes the card's derived field: The Nine of Wands is aimed fire held in reserve: will has endured, memory guards the path, and force remains concentrated before final release."
        },
        {
          "key": "last_stand",
          "label": "Last stand",
          "panel_phrase": "Last stand",
          "relationship_phrase": "The position is tired but not surrendered.",
          "ingredient_justification": "Nine supplies concentration, culmination, inner reserve, completion before release; Fire / Wands supplies ignition, activation, will entering action; Moon supplies rhythm, memory, instinct, mood, protection, recurrence; Sagittarius supplies aim, horizon, trajectory, mutable fire. This sense emphasizes the card's derived field: The Nine of Wands is aimed fire held in reserve: will has endured, memory guards the path, and force remains concentrated before final release."
        }
      ]
    },
    {
      "card_id": "ten_of_wands",
      "name": "Ten of Wands",
      "group": "Wands 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "burden",
      "ingredients": [
        {
          "ref": "ten",
          "name": "Ten",
          "operation": "completion, totalization, full manifestation, burden of the whole"
        },
        {
          "ref": "fire_wands",
          "name": "Fire / Wands",
          "operation": "ignition, activation, will entering action"
        },
        {
          "ref": "saturn",
          "name": "Saturn",
          "operation": "limit, compression, boundary, weight, consequence"
        },
        {
          "ref": "sagittarius",
          "name": "Sagittarius",
          "operation": "aim, horizon, trajectory, mutable fire"
        }
      ],
      "locked_relphi_interpretation": "The Ten of Wands is aimed fire under total weight: will has reached full burden, the path is constrained by consequence, and force must carry the whole structure of its own direction.",
      "senses": [
        {
          "key": "burden",
          "label": "Burdened will",
          "panel_phrase": "Burdened will",
          "relationship_phrase": "Desire has become heavy responsibility.",
          "ingredient_justification": "Ten supplies completion, totalization, full manifestation, burden of the whole; Fire / Wands supplies ignition, activation, will entering action; Saturn supplies limit, compression, boundary, weight, consequence; Sagittarius supplies aim, horizon, trajectory, mutable fire. This sense emphasizes the card's derived field: The Ten of Wands is aimed fire under total weight: will has reached full burden, the path is constrained by consequence, and force must carry the whole structure of its own direction."
        },
        {
          "key": "overload",
          "label": "Carrying too much",
          "panel_phrase": "Carrying too much",
          "relationship_phrase": "The whole load is being carried at once.",
          "ingredient_justification": "Ten supplies completion, totalization, full manifestation, burden of the whole; Fire / Wands supplies ignition, activation, will entering action; Saturn supplies limit, compression, boundary, weight, consequence; Sagittarius supplies aim, horizon, trajectory, mutable fire. This sense emphasizes the card's derived field: The Ten of Wands is aimed fire under total weight: will has reached full burden, the path is constrained by consequence, and force must carry the whole structure of its own direction."
        },
        {
          "key": "consequence",
          "label": "Weight of the path",
          "panel_phrase": "Weight of the path",
          "relationship_phrase": "Action has reached its consequence.",
          "ingredient_justification": "Ten supplies completion, totalization, full manifestation, burden of the whole; Fire / Wands supplies ignition, activation, will entering action; Saturn supplies limit, compression, boundary, weight, consequence; Sagittarius supplies aim, horizon, trajectory, mutable fire. This sense emphasizes the card's derived field: The Ten of Wands is aimed fire under total weight: will has reached full burden, the path is constrained by consequence, and force must carry the whole structure of its own direction."
        },
        {
          "key": "finish_load",
          "label": "Finish or set down",
          "panel_phrase": "Finish or set down",
          "relationship_phrase": "The situation asks what must be completed or released.",
          "ingredient_justification": "Ten supplies completion, totalization, full manifestation, burden of the whole; Fire / Wands supplies ignition, activation, will entering action; Saturn supplies limit, compression, boundary, weight, consequence; Sagittarius supplies aim, horizon, trajectory, mutable fire. This sense emphasizes the card's derived field: The Ten of Wands is aimed fire under total weight: will has reached full burden, the path is constrained by consequence, and force must carry the whole structure of its own direction."
        }
      ]
    },
    {
      "card_id": "two_of_cups",
      "name": "Two of Cups",
      "group": "Cups 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "mutuality",
      "ingredients": [
        {
          "ref": "two",
          "name": "Two",
          "operation": "polarity, division, relation, first axis"
        },
        {
          "ref": "water_cups",
          "name": "Water / Cups",
          "operation": "reception, feeling, memory, bonding, softening, containment, and response"
        },
        {
          "ref": "venus",
          "name": "Venus",
          "operation": "attraction, value, pleasure, coherence, joining"
        },
        {
          "ref": "cancer",
          "name": "Cancer",
          "operation": "care, belonging, protection, home, cardinal water"
        }
      ],
      "locked_relphi_interpretation": "The Two of Cups is feeling placed into relation: receptivity meets another point of receptivity, attraction draws the emotional field together, and care creates a protected bond.",
      "senses": [
        {
          "key": "mutuality",
          "label": "Mutual recognition",
          "panel_phrase": "Mutual recognition",
          "relationship_phrase": "Feeling meets feeling.",
          "ingredient_justification": "Two supplies polarity, division, relation, first axis; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Venus supplies attraction, value, pleasure, coherence, joining; Cancer supplies care, belonging, protection, home, cardinal water. This sense emphasizes the card's derived field: The Two of Cups is feeling placed into relation: receptivity meets another point of receptivity, attraction draws the emotional field together, and care creates a protected bond."
        },
        {
          "key": "attraction",
          "label": "Attraction drawing together",
          "panel_phrase": "Attraction drawing together",
          "relationship_phrase": "Value and care pull two points into relation.",
          "ingredient_justification": "Two supplies polarity, division, relation, first axis; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Venus supplies attraction, value, pleasure, coherence, joining; Cancer supplies care, belonging, protection, home, cardinal water. This sense emphasizes the card's derived field: The Two of Cups is feeling placed into relation: receptivity meets another point of receptivity, attraction draws the emotional field together, and care creates a protected bond."
        },
        {
          "key": "exchange",
          "label": "Emotional exchange",
          "panel_phrase": "Emotional exchange",
          "relationship_phrase": "The feeling becomes reciprocal through contact.",
          "ingredient_justification": "Two supplies polarity, division, relation, first axis; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Venus supplies attraction, value, pleasure, coherence, joining; Cancer supplies care, belonging, protection, home, cardinal water. This sense emphasizes the card's derived field: The Two of Cups is feeling placed into relation: receptivity meets another point of receptivity, attraction draws the emotional field together, and care creates a protected bond."
        },
        {
          "key": "bond",
          "label": "The bond forms",
          "panel_phrase": "The bond forms",
          "relationship_phrase": "Care creates a relational axis.",
          "ingredient_justification": "Two supplies polarity, division, relation, first axis; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Venus supplies attraction, value, pleasure, coherence, joining; Cancer supplies care, belonging, protection, home, cardinal water. This sense emphasizes the card's derived field: The Two of Cups is feeling placed into relation: receptivity meets another point of receptivity, attraction draws the emotional field together, and care creates a protected bond."
        }
      ]
    },
    {
      "card_id": "three_of_cups",
      "name": "Three of Cups",
      "group": "Cups 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "shared_feeling",
      "ingredients": [
        {
          "ref": "three",
          "name": "Three",
          "operation": "emergence, growth, triangulation, first pattern"
        },
        {
          "ref": "water_cups",
          "name": "Water / Cups",
          "operation": "reception, feeling, memory, bonding, softening, containment, and response"
        },
        {
          "ref": "mercury",
          "name": "Mercury",
          "operation": "language, exchange, translation, movement, connection"
        },
        {
          "ref": "cancer",
          "name": "Cancer",
          "operation": "care, belonging, protection, home, cardinal water"
        }
      ],
      "locked_relphi_interpretation": "The Three of Cups is feeling entering exchange within belonging: the emotional field grows through connection, memory becomes communicable, and care begins to form a pattern.",
      "senses": [
        {
          "key": "shared_feeling",
          "label": "Shared feeling",
          "panel_phrase": "Shared feeling",
          "relationship_phrase": "Feeling grows through connection.",
          "ingredient_justification": "Three supplies emergence, growth, triangulation, first pattern; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Mercury supplies language, exchange, translation, movement, connection; Cancer supplies care, belonging, protection, home, cardinal water. This sense emphasizes the card's derived field: The Three of Cups is feeling entering exchange within belonging: the emotional field grows through connection, memory becomes communicable, and care begins to form a pattern."
        },
        {
          "key": "belonging_exchange",
          "label": "Belonging exchange",
          "panel_phrase": "Belonging exchange",
          "relationship_phrase": "Care becomes communicable in a group or triangle.",
          "ingredient_justification": "Three supplies emergence, growth, triangulation, first pattern; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Mercury supplies language, exchange, translation, movement, connection; Cancer supplies care, belonging, protection, home, cardinal water. This sense emphasizes the card's derived field: The Three of Cups is feeling entering exchange within belonging: the emotional field grows through connection, memory becomes communicable, and care begins to form a pattern."
        },
        {
          "key": "joy_circle",
          "label": "Joy circle",
          "panel_phrase": "Joy circle",
          "relationship_phrase": "The emotional field expands through others.",
          "ingredient_justification": "Three supplies emergence, growth, triangulation, first pattern; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Mercury supplies language, exchange, translation, movement, connection; Cancer supplies care, belonging, protection, home, cardinal water. This sense emphasizes the card's derived field: The Three of Cups is feeling entering exchange within belonging: the emotional field grows through connection, memory becomes communicable, and care begins to form a pattern."
        },
        {
          "key": "memory_shared",
          "label": "Shared memory",
          "panel_phrase": "Shared memory",
          "relationship_phrase": "Memory and feeling move between people.",
          "ingredient_justification": "Three supplies emergence, growth, triangulation, first pattern; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Mercury supplies language, exchange, translation, movement, connection; Cancer supplies care, belonging, protection, home, cardinal water. This sense emphasizes the card's derived field: The Three of Cups is feeling entering exchange within belonging: the emotional field grows through connection, memory becomes communicable, and care begins to form a pattern."
        }
      ]
    },
    {
      "card_id": "four_of_cups",
      "name": "Four of Cups",
      "group": "Cups 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "inward",
      "ingredients": [
        {
          "ref": "four",
          "name": "Four",
          "operation": "stability, container, form"
        },
        {
          "ref": "water_cups",
          "name": "Water / Cups",
          "operation": "reception, feeling, memory, bonding, softening, containment, and response"
        },
        {
          "ref": "moon",
          "name": "Moon",
          "operation": "rhythm, memory, instinct, mood, protection, recurrence"
        },
        {
          "ref": "cancer",
          "name": "Cancer",
          "operation": "care, belonging, protection, home, cardinal water"
        }
      ],
      "locked_relphi_interpretation": "The Four of Cups is feeling held inside a protective container: mood, memory, and care settle into form, and receptivity turns inward within a sheltered emotional field.",
      "senses": [
        {
          "key": "inward",
          "label": "Feeling turned inward",
          "panel_phrase": "Feeling turned inward",
          "relationship_phrase": "Receptivity retreats into its own container.",
          "ingredient_justification": "Four supplies stability, container, form; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Moon supplies rhythm, memory, instinct, mood, protection, recurrence; Cancer supplies care, belonging, protection, home, cardinal water. This sense emphasizes the card's derived field: The Four of Cups is feeling held inside a protective container: mood, memory, and care settle into form, and receptivity turns inward within a sheltered emotional field."
        },
        {
          "key": "not_receiving",
          "label": "Not receiving it",
          "panel_phrase": "Not receiving it",
          "relationship_phrase": "An offer may not be landing.",
          "ingredient_justification": "Four supplies stability, container, form; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Moon supplies rhythm, memory, instinct, mood, protection, recurrence; Cancer supplies care, belonging, protection, home, cardinal water. This sense emphasizes the card's derived field: The Four of Cups is feeling held inside a protective container: mood, memory, and care settle into form, and receptivity turns inward within a sheltered emotional field."
        },
        {
          "key": "protected_mood",
          "label": "Protected mood",
          "panel_phrase": "Protected mood",
          "relationship_phrase": "Mood, memory, or care is sheltered from intrusion.",
          "ingredient_justification": "Four supplies stability, container, form; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Moon supplies rhythm, memory, instinct, mood, protection, recurrence; Cancer supplies care, belonging, protection, home, cardinal water. This sense emphasizes the card's derived field: The Four of Cups is feeling held inside a protective container: mood, memory, and care settle into form, and receptivity turns inward within a sheltered emotional field."
        },
        {
          "key": "emotional_stillness",
          "label": "Emotional stillness",
          "panel_phrase": "Emotional stillness",
          "relationship_phrase": "Feeling settles before it can respond.",
          "ingredient_justification": "Four supplies stability, container, form; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Moon supplies rhythm, memory, instinct, mood, protection, recurrence; Cancer supplies care, belonging, protection, home, cardinal water. This sense emphasizes the card's derived field: The Four of Cups is feeling held inside a protective container: mood, memory, and care settle into form, and receptivity turns inward within a sheltered emotional field."
        }
      ]
    },
    {
      "card_id": "five_of_cups",
      "name": "Five of Cups",
      "group": "Cups 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "loss_focus",
      "ingredients": [
        {
          "ref": "five",
          "name": "Five",
          "operation": "disturbance, pressure, disruption, instability"
        },
        {
          "ref": "water_cups",
          "name": "Water / Cups",
          "operation": "reception, feeling, memory, bonding, softening, containment, and response"
        },
        {
          "ref": "mars",
          "name": "Mars",
          "operation": "action, assertion, friction, cutting force"
        },
        {
          "ref": "scorpio",
          "name": "Scorpio",
          "operation": "intensification, binding, concealment, depth, fixed water"
        }
      ],
      "locked_relphi_interpretation": "The Five of Cups is feeling under disruptive pressure: the emotional field is pierced by action, depth intensifies disturbance, and what was held below the surface is forced into pain or rupture.",
      "senses": [
        {
          "key": "loss_focus",
          "label": "Loss in focus",
          "panel_phrase": "Loss in focus",
          "relationship_phrase": "Feeling is disturbed by what has spilled.",
          "ingredient_justification": "Five supplies disturbance, pressure, disruption, instability; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Mars supplies action, assertion, friction, cutting force; Scorpio supplies intensification, binding, concealment, depth, fixed water. This sense emphasizes the card's derived field: The Five of Cups is feeling under disruptive pressure: the emotional field is pierced by action, depth intensifies disturbance, and what was held below the surface is forced into pain or rupture."
        },
        {
          "key": "hurt",
          "label": "Pierced feeling",
          "panel_phrase": "Pierced feeling",
          "relationship_phrase": "Action or pressure has entered the emotional field.",
          "ingredient_justification": "Five supplies disturbance, pressure, disruption, instability; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Mars supplies action, assertion, friction, cutting force; Scorpio supplies intensification, binding, concealment, depth, fixed water. This sense emphasizes the card's derived field: The Five of Cups is feeling under disruptive pressure: the emotional field is pierced by action, depth intensifies disturbance, and what was held below the surface is forced into pain or rupture."
        },
        {
          "key": "surface_break",
          "label": "What surfaces",
          "panel_phrase": "What surfaces",
          "relationship_phrase": "Hidden feeling is forced upward.",
          "ingredient_justification": "Five supplies disturbance, pressure, disruption, instability; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Mars supplies action, assertion, friction, cutting force; Scorpio supplies intensification, binding, concealment, depth, fixed water. This sense emphasizes the card's derived field: The Five of Cups is feeling under disruptive pressure: the emotional field is pierced by action, depth intensifies disturbance, and what was held below the surface is forced into pain or rupture."
        },
        {
          "key": "grief_pressure",
          "label": "Grief pressure",
          "panel_phrase": "Grief pressure",
          "relationship_phrase": "The disturbance needs care before movement.",
          "ingredient_justification": "Five supplies disturbance, pressure, disruption, instability; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Mars supplies action, assertion, friction, cutting force; Scorpio supplies intensification, binding, concealment, depth, fixed water. This sense emphasizes the card's derived field: The Five of Cups is feeling under disruptive pressure: the emotional field is pierced by action, depth intensifies disturbance, and what was held below the surface is forced into pain or rupture."
        }
      ]
    },
    {
      "card_id": "six_of_cups",
      "name": "Six of Cups",
      "group": "Cups 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "restored_care",
      "ingredients": [
        {
          "ref": "six",
          "name": "Six",
          "operation": "coordination, balance, integration, restored relation"
        },
        {
          "ref": "water_cups",
          "name": "Water / Cups",
          "operation": "reception, feeling, memory, bonding, softening, containment, and response"
        },
        {
          "ref": "sun",
          "name": "Sun",
          "operation": "illumination, identity, vitality, central radiance"
        },
        {
          "ref": "scorpio",
          "name": "Scorpio",
          "operation": "intensification, binding, concealment, depth, fixed water"
        }
      ],
      "locked_relphi_interpretation": "The Six of Cups is deep feeling brought into coherence: hidden waters receive light, emotional intensity finds proportion, and what was submerged becomes centered enough to relate.",
      "senses": [
        {
          "key": "restored_care",
          "label": "Restored care",
          "panel_phrase": "Restored care",
          "relationship_phrase": "Feeling finds proportion again.",
          "ingredient_justification": "Six supplies coordination, balance, integration, restored relation; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Sun supplies illumination, identity, vitality, central radiance; Scorpio supplies intensification, binding, concealment, depth, fixed water. This sense emphasizes the card's derived field: The Six of Cups is deep feeling brought into coherence: hidden waters receive light, emotional intensity finds proportion, and what was submerged becomes centered enough to relate."
        },
        {
          "key": "old_tenderness",
          "label": "Old tenderness",
          "panel_phrase": "Old tenderness",
          "relationship_phrase": "Memory brings hidden feeling into the present.",
          "ingredient_justification": "Six supplies coordination, balance, integration, restored relation; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Sun supplies illumination, identity, vitality, central radiance; Scorpio supplies intensification, binding, concealment, depth, fixed water. This sense emphasizes the card's derived field: The Six of Cups is deep feeling brought into coherence: hidden waters receive light, emotional intensity finds proportion, and what was submerged becomes centered enough to relate."
        },
        {
          "key": "emotional_coherence",
          "label": "Emotional coherence",
          "panel_phrase": "Emotional coherence",
          "relationship_phrase": "The bond becomes centered through care.",
          "ingredient_justification": "Six supplies coordination, balance, integration, restored relation; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Sun supplies illumination, identity, vitality, central radiance; Scorpio supplies intensification, binding, concealment, depth, fixed water. This sense emphasizes the card's derived field: The Six of Cups is deep feeling brought into coherence: hidden waters receive light, emotional intensity finds proportion, and what was submerged becomes centered enough to relate."
        },
        {
          "key": "sweet_return",
          "label": "Sweet return",
          "panel_phrase": "Sweet return",
          "relationship_phrase": "Something submerged becomes warm and recognizable.",
          "ingredient_justification": "Six supplies coordination, balance, integration, restored relation; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Sun supplies illumination, identity, vitality, central radiance; Scorpio supplies intensification, binding, concealment, depth, fixed water. This sense emphasizes the card's derived field: The Six of Cups is deep feeling brought into coherence: hidden waters receive light, emotional intensity finds proportion, and what was submerged becomes centered enough to relate."
        }
      ]
    },
    {
      "card_id": "seven_of_cups",
      "name": "Seven of Cups",
      "group": "Cups 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "many_desires",
      "ingredients": [
        {
          "ref": "seven",
          "name": "Seven",
          "operation": "test, threshold, defense, asymmetry, pressure on position"
        },
        {
          "ref": "water_cups",
          "name": "Water / Cups",
          "operation": "reception, feeling, memory, bonding, softening, containment, and response"
        },
        {
          "ref": "venus",
          "name": "Venus",
          "operation": "attraction, value, pleasure, coherence, joining"
        },
        {
          "ref": "scorpio",
          "name": "Scorpio",
          "operation": "intensification, binding, concealment, depth, fixed water"
        }
      ],
      "locked_relphi_interpretation": "The Seven of Cups is attraction under deep emotional pressure: desire intensifies below the surface, value is tested by hidden attachment, and feeling must distinguish itself inside a field of compelling pulls.",
      "senses": [
        {
          "key": "many_desires",
          "label": "Many desires",
          "panel_phrase": "Many desires",
          "relationship_phrase": "Desire multiplies under emotional pressure.",
          "ingredient_justification": "Seven supplies test, threshold, defense, asymmetry, pressure on position; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Venus supplies attraction, value, pleasure, coherence, joining; Scorpio supplies intensification, binding, concealment, depth, fixed water. This sense emphasizes the card's derived field: The Seven of Cups is attraction under deep emotional pressure: desire intensifies below the surface, value is tested by hidden attachment, and feeling must distinguish itself inside a field of compelling pulls."
        },
        {
          "key": "fantasy_test",
          "label": "Fantasy test",
          "panel_phrase": "Fantasy test",
          "relationship_phrase": "Feeling must distinguish vision from attachment.",
          "ingredient_justification": "Seven supplies test, threshold, defense, asymmetry, pressure on position; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Venus supplies attraction, value, pleasure, coherence, joining; Scorpio supplies intensification, binding, concealment, depth, fixed water. This sense emphasizes the card's derived field: The Seven of Cups is attraction under deep emotional pressure: desire intensifies below the surface, value is tested by hidden attachment, and feeling must distinguish itself inside a field of compelling pulls."
        },
        {
          "key": "hidden_attachment",
          "label": "Hidden attachment",
          "panel_phrase": "Hidden attachment",
          "relationship_phrase": "Value is tangled with what is below the surface.",
          "ingredient_justification": "Seven supplies test, threshold, defense, asymmetry, pressure on position; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Venus supplies attraction, value, pleasure, coherence, joining; Scorpio supplies intensification, binding, concealment, depth, fixed water. This sense emphasizes the card's derived field: The Seven of Cups is attraction under deep emotional pressure: desire intensifies below the surface, value is tested by hidden attachment, and feeling must distinguish itself inside a field of compelling pulls."
        },
        {
          "key": "choice_fog",
          "label": "Choice fog",
          "panel_phrase": "Choice fog",
          "relationship_phrase": "Too many images make the heart hard to read.",
          "ingredient_justification": "Seven supplies test, threshold, defense, asymmetry, pressure on position; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Venus supplies attraction, value, pleasure, coherence, joining; Scorpio supplies intensification, binding, concealment, depth, fixed water. This sense emphasizes the card's derived field: The Seven of Cups is attraction under deep emotional pressure: desire intensifies below the surface, value is tested by hidden attachment, and feeling must distinguish itself inside a field of compelling pulls."
        }
      ]
    },
    {
      "card_id": "eight_of_cups",
      "name": "Eight of Cups",
      "group": "Cups 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "withdrawal",
      "ingredients": [
        {
          "ref": "eight",
          "name": "Eight",
          "operation": "motion through system, rhythm, repetition, circulation, momentum"
        },
        {
          "ref": "water_cups",
          "name": "Water / Cups",
          "operation": "reception, feeling, memory, bonding, softening, containment, and response"
        },
        {
          "ref": "saturn",
          "name": "Saturn",
          "operation": "limit, compression, boundary, weight, consequence"
        },
        {
          "ref": "pisces",
          "name": "Pisces",
          "operation": "dissolution, permeability, surrender, oceanic feeling, mutable water"
        }
      ],
      "locked_relphi_interpretation": "The Eight of Cups is emotional flow meeting weight inside dissolution: feeling tries to move through a permeable field, but limit interrupts circulation and gives the water a sense of heaviness.",
      "senses": [
        {
          "key": "withdrawal",
          "label": "Emotional withdrawal",
          "panel_phrase": "Emotional withdrawal",
          "relationship_phrase": "Feeling moves away because the field cannot circulate.",
          "ingredient_justification": "Eight supplies motion through system, rhythm, repetition, circulation, momentum; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Saturn supplies limit, compression, boundary, weight, consequence; Pisces supplies dissolution, permeability, surrender, oceanic feeling, mutable water. This sense emphasizes the card's derived field: The Eight of Cups is emotional flow meeting weight inside dissolution: feeling tries to move through a permeable field, but limit interrupts circulation and gives the water a sense of heaviness."
        },
        {
          "key": "leaving_fullness",
          "label": "Leaving fullness",
          "panel_phrase": "Leaving fullness",
          "relationship_phrase": "Something full still does not satisfy the need.",
          "ingredient_justification": "Eight supplies motion through system, rhythm, repetition, circulation, momentum; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Saturn supplies limit, compression, boundary, weight, consequence; Pisces supplies dissolution, permeability, surrender, oceanic feeling, mutable water. This sense emphasizes the card's derived field: The Eight of Cups is emotional flow meeting weight inside dissolution: feeling tries to move through a permeable field, but limit interrupts circulation and gives the water a sense of heaviness."
        },
        {
          "key": "blocked_flow",
          "label": "Blocked flow",
          "panel_phrase": "Blocked flow",
          "relationship_phrase": "Limit interrupts emotional movement.",
          "ingredient_justification": "Eight supplies motion through system, rhythm, repetition, circulation, momentum; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Saturn supplies limit, compression, boundary, weight, consequence; Pisces supplies dissolution, permeability, surrender, oceanic feeling, mutable water. This sense emphasizes the card's derived field: The Eight of Cups is emotional flow meeting weight inside dissolution: feeling tries to move through a permeable field, but limit interrupts circulation and gives the water a sense of heaviness."
        },
        {
          "key": "surrender_path",
          "label": "Surrender path",
          "panel_phrase": "Surrender path",
          "relationship_phrase": "The way forward requires letting a feeling-field dissolve.",
          "ingredient_justification": "Eight supplies motion through system, rhythm, repetition, circulation, momentum; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Saturn supplies limit, compression, boundary, weight, consequence; Pisces supplies dissolution, permeability, surrender, oceanic feeling, mutable water. This sense emphasizes the card's derived field: The Eight of Cups is emotional flow meeting weight inside dissolution: feeling tries to move through a permeable field, but limit interrupts circulation and gives the water a sense of heaviness."
        }
      ]
    },
    {
      "card_id": "nine_of_cups",
      "name": "Nine of Cups",
      "group": "Cups 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "fullness",
      "ingredients": [
        {
          "ref": "nine",
          "name": "Nine",
          "operation": "concentration, culmination, inner reserve, completion before release"
        },
        {
          "ref": "water_cups",
          "name": "Water / Cups",
          "operation": "reception, feeling, memory, bonding, softening, containment, and response"
        },
        {
          "ref": "jupiter",
          "name": "Jupiter",
          "operation": "expansion, increase, confidence, blessing, enlargement"
        },
        {
          "ref": "pisces",
          "name": "Pisces",
          "operation": "dissolution, permeability, surrender, oceanic feeling, mutable water"
        }
      ],
      "locked_relphi_interpretation": "The Nine of Cups is feeling expanded into inner fullness: emotional reserve becomes generous, the water widens toward release, and receptivity approaches saturation before completion.",
      "senses": [
        {
          "key": "fullness",
          "label": "Inner fullness",
          "panel_phrase": "Inner fullness",
          "relationship_phrase": "Feeling is concentrated and satisfying within the self.",
          "ingredient_justification": "Nine supplies concentration, culmination, inner reserve, completion before release; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Jupiter supplies expansion, increase, confidence, blessing, enlargement; Pisces supplies dissolution, permeability, surrender, oceanic feeling, mutable water. This sense emphasizes the card's derived field: The Nine of Cups is feeling expanded into inner fullness: emotional reserve becomes generous, the water widens toward release, and receptivity approaches saturation before completion."
        },
        {
          "key": "saturation_near",
          "label": "Almost saturated",
          "panel_phrase": "Almost saturated",
          "relationship_phrase": "The emotional field is near full release.",
          "ingredient_justification": "Nine supplies concentration, culmination, inner reserve, completion before release; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Jupiter supplies expansion, increase, confidence, blessing, enlargement; Pisces supplies dissolution, permeability, surrender, oceanic feeling, mutable water. This sense emphasizes the card's derived field: The Nine of Cups is feeling expanded into inner fullness: emotional reserve becomes generous, the water widens toward release, and receptivity approaches saturation before completion."
        },
        {
          "key": "generous_reserve",
          "label": "Generous reserve",
          "panel_phrase": "Generous reserve",
          "relationship_phrase": "There is enough feeling to offer, not only need.",
          "ingredient_justification": "Nine supplies concentration, culmination, inner reserve, completion before release; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Jupiter supplies expansion, increase, confidence, blessing, enlargement; Pisces supplies dissolution, permeability, surrender, oceanic feeling, mutable water. This sense emphasizes the card's derived field: The Nine of Cups is feeling expanded into inner fullness: emotional reserve becomes generous, the water widens toward release, and receptivity approaches saturation before completion."
        },
        {
          "key": "private_contentment",
          "label": "Private contentment",
          "panel_phrase": "Private contentment",
          "relationship_phrase": "The heart has its own fullness.",
          "ingredient_justification": "Nine supplies concentration, culmination, inner reserve, completion before release; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Jupiter supplies expansion, increase, confidence, blessing, enlargement; Pisces supplies dissolution, permeability, surrender, oceanic feeling, mutable water. This sense emphasizes the card's derived field: The Nine of Cups is feeling expanded into inner fullness: emotional reserve becomes generous, the water widens toward release, and receptivity approaches saturation before completion."
        }
      ]
    },
    {
      "card_id": "ten_of_cups",
      "name": "Ten of Cups",
      "group": "Cups 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "saturation",
      "ingredients": [
        {
          "ref": "ten",
          "name": "Ten",
          "operation": "completion, totalization, full manifestation, burden of the whole"
        },
        {
          "ref": "water_cups",
          "name": "Water / Cups",
          "operation": "reception, feeling, memory, bonding, softening, containment, and response"
        },
        {
          "ref": "mars",
          "name": "Mars",
          "operation": "action, assertion, friction, cutting force"
        },
        {
          "ref": "pisces",
          "name": "Pisces",
          "operation": "dissolution, permeability, surrender, oceanic feeling, mutable water"
        }
      ],
      "locked_relphi_interpretation": "The Ten of Cups is feeling at full saturation under active pressure: the emotional field reaches totality, boundary loosens, and water is pushed toward release, overflow, or exhaustion.",
      "senses": [
        {
          "key": "saturation",
          "label": "Emotional saturation",
          "panel_phrase": "Emotional saturation",
          "relationship_phrase": "The feeling-field is full.",
          "ingredient_justification": "Ten supplies completion, totalization, full manifestation, burden of the whole; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Mars supplies action, assertion, friction, cutting force; Pisces supplies dissolution, permeability, surrender, oceanic feeling, mutable water. This sense emphasizes the card's derived field: The Ten of Cups is feeling at full saturation under active pressure: the emotional field reaches totality, boundary loosens, and water is pushed toward release, overflow, or exhaustion."
        },
        {
          "key": "shared_field",
          "label": "Shared emotional field",
          "panel_phrase": "Shared emotional field",
          "relationship_phrase": "Feeling has become a whole atmosphere.",
          "ingredient_justification": "Ten supplies completion, totalization, full manifestation, burden of the whole; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Mars supplies action, assertion, friction, cutting force; Pisces supplies dissolution, permeability, surrender, oceanic feeling, mutable water. This sense emphasizes the card's derived field: The Ten of Cups is feeling at full saturation under active pressure: the emotional field reaches totality, boundary loosens, and water is pushed toward release, overflow, or exhaustion."
        },
        {
          "key": "boundary_loose",
          "label": "Boundary loosening",
          "panel_phrase": "Boundary loosening",
          "relationship_phrase": "Care, longing, or feeling may overflow.",
          "ingredient_justification": "Ten supplies completion, totalization, full manifestation, burden of the whole; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Mars supplies action, assertion, friction, cutting force; Pisces supplies dissolution, permeability, surrender, oceanic feeling, mutable water. This sense emphasizes the card's derived field: The Ten of Cups is feeling at full saturation under active pressure: the emotional field reaches totality, boundary loosens, and water is pushed toward release, overflow, or exhaustion."
        },
        {
          "key": "release_pressure",
          "label": "Release pressure",
          "panel_phrase": "Release pressure",
          "relationship_phrase": "The full feeling needs expression or release.",
          "ingredient_justification": "Ten supplies completion, totalization, full manifestation, burden of the whole; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response; Mars supplies action, assertion, friction, cutting force; Pisces supplies dissolution, permeability, surrender, oceanic feeling, mutable water. This sense emphasizes the card's derived field: The Ten of Cups is feeling at full saturation under active pressure: the emotional field reaches totality, boundary loosens, and water is pushed toward release, overflow, or exhaustion."
        }
      ]
    },
    {
      "card_id": "two_of_swords",
      "name": "Two of Swords",
      "group": "Swords 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "held_polarity",
      "ingredients": [
        {
          "ref": "two",
          "name": "Two",
          "operation": "polarity, division, relation, first axis"
        },
        {
          "ref": "air_swords",
          "name": "Air / Swords",
          "operation": "distinction, comparison, separation, relation, language, thought, distance, and pattern"
        },
        {
          "ref": "moon",
          "name": "Moon",
          "operation": "rhythm, memory, instinct, mood, protection, recurrence"
        },
        {
          "ref": "libra",
          "name": "Libra",
          "operation": "balance, relation, measure, reciprocity, cardinal air"
        }
      ],
      "locked_relphi_interpretation": "The Two of Swords is thought held in balanced polarity: distinction is guarded by rhythm and memory, and the mind holds two sides in measured relation.",
      "senses": [
        {
          "key": "held_polarity",
          "label": "Held polarity",
          "panel_phrase": "Held polarity",
          "relationship_phrase": "Two sides are held in balance.",
          "ingredient_justification": "Two supplies polarity, division, relation, first axis; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Moon supplies rhythm, memory, instinct, mood, protection, recurrence; Libra supplies balance, relation, measure, reciprocity, cardinal air. This sense emphasizes the card's derived field: The Two of Swords is thought held in balanced polarity: distinction is guarded by rhythm and memory, and the mind holds two sides in measured relation."
        },
        {
          "key": "guarded_mind",
          "label": "Guarded mind",
          "panel_phrase": "Guarded mind",
          "relationship_phrase": "The mind protects itself before deciding.",
          "ingredient_justification": "Two supplies polarity, division, relation, first axis; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Moon supplies rhythm, memory, instinct, mood, protection, recurrence; Libra supplies balance, relation, measure, reciprocity, cardinal air. This sense emphasizes the card's derived field: The Two of Swords is thought held in balanced polarity: distinction is guarded by rhythm and memory, and the mind holds two sides in measured relation."
        },
        {
          "key": "decision_pause",
          "label": "Decision pause",
          "panel_phrase": "Decision pause",
          "relationship_phrase": "The situation needs stillness before a cut.",
          "ingredient_justification": "Two supplies polarity, division, relation, first axis; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Moon supplies rhythm, memory, instinct, mood, protection, recurrence; Libra supplies balance, relation, measure, reciprocity, cardinal air. This sense emphasizes the card's derived field: The Two of Swords is thought held in balanced polarity: distinction is guarded by rhythm and memory, and the mind holds two sides in measured relation."
        },
        {
          "key": "measured_relation",
          "label": "Measured relation",
          "panel_phrase": "Measured relation",
          "relationship_phrase": "The relation must be weighed without rushing.",
          "ingredient_justification": "Two supplies polarity, division, relation, first axis; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Moon supplies rhythm, memory, instinct, mood, protection, recurrence; Libra supplies balance, relation, measure, reciprocity, cardinal air. This sense emphasizes the card's derived field: The Two of Swords is thought held in balanced polarity: distinction is guarded by rhythm and memory, and the mind holds two sides in measured relation."
        }
      ]
    },
    {
      "card_id": "three_of_swords",
      "name": "Three of Swords",
      "group": "Swords 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "compressed_relation",
      "ingredients": [
        {
          "ref": "three",
          "name": "Three",
          "operation": "emergence, growth, triangulation, first pattern"
        },
        {
          "ref": "air_swords",
          "name": "Air / Swords",
          "operation": "distinction, comparison, separation, relation, language, thought, distance, and pattern"
        },
        {
          "ref": "saturn",
          "name": "Saturn",
          "operation": "limit, compression, boundary, weight, consequence"
        },
        {
          "ref": "libra",
          "name": "Libra",
          "operation": "balance, relation, measure, reciprocity, cardinal air"
        }
      ],
      "locked_relphi_interpretation": "The Three of Swords is relation under the weight of consequence: thought forms a pattern through separation, and measured relation is compressed by limit.",
      "senses": [
        {
          "key": "compressed_relation",
          "label": "Compressed relation",
          "panel_phrase": "Compressed relation",
          "relationship_phrase": "The relational pattern is under weight.",
          "ingredient_justification": "Three supplies emergence, growth, triangulation, first pattern; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Saturn supplies limit, compression, boundary, weight, consequence; Libra supplies balance, relation, measure, reciprocity, cardinal air. This sense emphasizes the card's derived field: The Three of Swords is relation under the weight of consequence: thought forms a pattern through separation, and measured relation is compressed by limit."
        },
        {
          "key": "separation_pattern",
          "label": "Separation pattern",
          "panel_phrase": "Separation pattern",
          "relationship_phrase": "Thought forms through painful distinction.",
          "ingredient_justification": "Three supplies emergence, growth, triangulation, first pattern; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Saturn supplies limit, compression, boundary, weight, consequence; Libra supplies balance, relation, measure, reciprocity, cardinal air. This sense emphasizes the card's derived field: The Three of Swords is relation under the weight of consequence: thought forms a pattern through separation, and measured relation is compressed by limit."
        },
        {
          "key": "consequence_words",
          "label": "Words with consequence",
          "panel_phrase": "Words with consequence",
          "relationship_phrase": "Speech or interpretation has weight.",
          "ingredient_justification": "Three supplies emergence, growth, triangulation, first pattern; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Saturn supplies limit, compression, boundary, weight, consequence; Libra supplies balance, relation, measure, reciprocity, cardinal air. This sense emphasizes the card's derived field: The Three of Swords is relation under the weight of consequence: thought forms a pattern through separation, and measured relation is compressed by limit."
        },
        {
          "key": "grief_of_clarity",
          "label": "Grief of clarity",
          "panel_phrase": "Grief of clarity",
          "relationship_phrase": "A clear distinction hurts because it is real.",
          "ingredient_justification": "Three supplies emergence, growth, triangulation, first pattern; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Saturn supplies limit, compression, boundary, weight, consequence; Libra supplies balance, relation, measure, reciprocity, cardinal air. This sense emphasizes the card's derived field: The Three of Swords is relation under the weight of consequence: thought forms a pattern through separation, and measured relation is compressed by limit."
        }
      ]
    },
    {
      "card_id": "four_of_swords",
      "name": "Four of Swords",
      "group": "Swords 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "mental_rest",
      "ingredients": [
        {
          "ref": "four",
          "name": "Four",
          "operation": "stability, container, form"
        },
        {
          "ref": "air_swords",
          "name": "Air / Swords",
          "operation": "distinction, comparison, separation, relation, language, thought, distance, and pattern"
        },
        {
          "ref": "jupiter",
          "name": "Jupiter",
          "operation": "expansion, increase, confidence, blessing, enlargement"
        },
        {
          "ref": "libra",
          "name": "Libra",
          "operation": "balance, relation, measure, reciprocity, cardinal air"
        }
      ],
      "locked_relphi_interpretation": "The Four of Swords is thought held in a balanced container: distinction is given rest, relation is structured, and the mind has enough space to widen without breaking symmetry.",
      "senses": [
        {
          "key": "mental_rest",
          "label": "Mental rest",
          "panel_phrase": "Mental rest",
          "relationship_phrase": "Thought needs a container and pause.",
          "ingredient_justification": "Four supplies stability, container, form; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Jupiter supplies expansion, increase, confidence, blessing, enlargement; Libra supplies balance, relation, measure, reciprocity, cardinal air. This sense emphasizes the card's derived field: The Four of Swords is thought held in a balanced container: distinction is given rest, relation is structured, and the mind has enough space to widen without breaking symmetry."
        },
        {
          "key": "structured_space",
          "label": "Structured space",
          "panel_phrase": "Structured space",
          "relationship_phrase": "The mind needs enough room to widen safely.",
          "ingredient_justification": "Four supplies stability, container, form; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Jupiter supplies expansion, increase, confidence, blessing, enlargement; Libra supplies balance, relation, measure, reciprocity, cardinal air. This sense emphasizes the card's derived field: The Four of Swords is thought held in a balanced container: distinction is given rest, relation is structured, and the mind has enough space to widen without breaking symmetry."
        },
        {
          "key": "recovery",
          "label": "Recovery through stillness",
          "panel_phrase": "Recovery through stillness",
          "relationship_phrase": "Balance returns when distinction rests.",
          "ingredient_justification": "Four supplies stability, container, form; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Jupiter supplies expansion, increase, confidence, blessing, enlargement; Libra supplies balance, relation, measure, reciprocity, cardinal air. This sense emphasizes the card's derived field: The Four of Swords is thought held in a balanced container: distinction is given rest, relation is structured, and the mind has enough space to widen without breaking symmetry."
        },
        {
          "key": "truce",
          "label": "Truce",
          "panel_phrase": "Truce",
          "relationship_phrase": "Conflict pauses inside a protected form.",
          "ingredient_justification": "Four supplies stability, container, form; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Jupiter supplies expansion, increase, confidence, blessing, enlargement; Libra supplies balance, relation, measure, reciprocity, cardinal air. This sense emphasizes the card's derived field: The Four of Swords is thought held in a balanced container: distinction is given rest, relation is structured, and the mind has enough space to widen without breaking symmetry."
        }
      ]
    },
    {
      "card_id": "five_of_swords",
      "name": "Five of Swords",
      "group": "Swords 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "mental_conflict",
      "ingredients": [
        {
          "ref": "five",
          "name": "Five",
          "operation": "disturbance, pressure, disruption, instability"
        },
        {
          "ref": "air_swords",
          "name": "Air / Swords",
          "operation": "distinction, comparison, separation, relation, language, thought, distance, and pattern"
        },
        {
          "ref": "venus",
          "name": "Venus",
          "operation": "attraction, value, pleasure, coherence, joining"
        },
        {
          "ref": "aquarius",
          "name": "Aquarius",
          "operation": "pattern, group, abstraction, future-vision, fixed air"
        }
      ],
      "locked_relphi_interpretation": "The Five of Swords is value-pattern under mental disturbance: relation is pressured inside an abstract system, and coherence is disrupted by conflict within the group or pattern.",
      "senses": [
        {
          "key": "mental_conflict",
          "label": "Mental conflict",
          "panel_phrase": "Mental conflict",
          "relationship_phrase": "Thought and value are disturbed by conflict.",
          "ingredient_justification": "Five supplies disturbance, pressure, disruption, instability; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Venus supplies attraction, value, pleasure, coherence, joining; Aquarius supplies pattern, group, abstraction, future-vision, fixed air. This sense emphasizes the card's derived field: The Five of Swords is value-pattern under mental disturbance: relation is pressured inside an abstract system, and coherence is disrupted by conflict within the group or pattern."
        },
        {
          "key": "hollow_win",
          "label": "Hollow win",
          "panel_phrase": "Hollow win",
          "relationship_phrase": "Winning may damage coherence.",
          "ingredient_justification": "Five supplies disturbance, pressure, disruption, instability; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Venus supplies attraction, value, pleasure, coherence, joining; Aquarius supplies pattern, group, abstraction, future-vision, fixed air. This sense emphasizes the card's derived field: The Five of Swords is value-pattern under mental disturbance: relation is pressured inside an abstract system, and coherence is disrupted by conflict within the group or pattern."
        },
        {
          "key": "system_pressure",
          "label": "System pressure",
          "panel_phrase": "System pressure",
          "relationship_phrase": "A larger pattern pressures the relation.",
          "ingredient_justification": "Five supplies disturbance, pressure, disruption, instability; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Venus supplies attraction, value, pleasure, coherence, joining; Aquarius supplies pattern, group, abstraction, future-vision, fixed air. This sense emphasizes the card's derived field: The Five of Swords is value-pattern under mental disturbance: relation is pressured inside an abstract system, and coherence is disrupted by conflict within the group or pattern."
        },
        {
          "key": "disrupted_value",
          "label": "Disrupted value",
          "panel_phrase": "Disrupted value",
          "relationship_phrase": "What matters is being distorted by argument.",
          "ingredient_justification": "Five supplies disturbance, pressure, disruption, instability; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Venus supplies attraction, value, pleasure, coherence, joining; Aquarius supplies pattern, group, abstraction, future-vision, fixed air. This sense emphasizes the card's derived field: The Five of Swords is value-pattern under mental disturbance: relation is pressured inside an abstract system, and coherence is disrupted by conflict within the group or pattern."
        }
      ]
    },
    {
      "card_id": "six_of_swords",
      "name": "Six of Swords",
      "group": "Swords 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "realignment",
      "ingredients": [
        {
          "ref": "six",
          "name": "Six",
          "operation": "coordination, balance, integration, restored relation"
        },
        {
          "ref": "air_swords",
          "name": "Air / Swords",
          "operation": "distinction, comparison, separation, relation, language, thought, distance, and pattern"
        },
        {
          "ref": "mercury",
          "name": "Mercury",
          "operation": "language, exchange, translation, movement, connection"
        },
        {
          "ref": "aquarius",
          "name": "Aquarius",
          "operation": "pattern, group, abstraction, future-vision, fixed air"
        }
      ],
      "locked_relphi_interpretation": "The Six of Swords is thought coordinated through system: language, pattern, and relation align into a workable mental structure.",
      "senses": [
        {
          "key": "realignment",
          "label": "Mental realignment",
          "panel_phrase": "Mental realignment",
          "relationship_phrase": "Thought, language, and relation become workable.",
          "ingredient_justification": "Six supplies coordination, balance, integration, restored relation; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Mercury supplies language, exchange, translation, movement, connection; Aquarius supplies pattern, group, abstraction, future-vision, fixed air. This sense emphasizes the card's derived field: The Six of Swords is thought coordinated through system: language, pattern, and relation align into a workable mental structure."
        },
        {
          "key": "passage",
          "label": "Passage through thought",
          "panel_phrase": "Passage through thought",
          "relationship_phrase": "A better pattern carries the situation forward.",
          "ingredient_justification": "Six supplies coordination, balance, integration, restored relation; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Mercury supplies language, exchange, translation, movement, connection; Aquarius supplies pattern, group, abstraction, future-vision, fixed air. This sense emphasizes the card's derived field: The Six of Swords is thought coordinated through system: language, pattern, and relation align into a workable mental structure."
        },
        {
          "key": "coordination",
          "label": "Coordinated words",
          "panel_phrase": "Coordinated words",
          "relationship_phrase": "Communication can align what was scattered.",
          "ingredient_justification": "Six supplies coordination, balance, integration, restored relation; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Mercury supplies language, exchange, translation, movement, connection; Aquarius supplies pattern, group, abstraction, future-vision, fixed air. This sense emphasizes the card's derived field: The Six of Swords is thought coordinated through system: language, pattern, and relation align into a workable mental structure."
        },
        {
          "key": "cooler_distance",
          "label": "Cooler distance",
          "panel_phrase": "Cooler distance",
          "relationship_phrase": "Distance makes understanding possible.",
          "ingredient_justification": "Six supplies coordination, balance, integration, restored relation; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Mercury supplies language, exchange, translation, movement, connection; Aquarius supplies pattern, group, abstraction, future-vision, fixed air. This sense emphasizes the card's derived field: The Six of Swords is thought coordinated through system: language, pattern, and relation align into a workable mental structure."
        }
      ]
    },
    {
      "card_id": "seven_of_swords",
      "name": "Seven of Swords",
      "group": "Swords 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "strategy",
      "ingredients": [
        {
          "ref": "seven",
          "name": "Seven",
          "operation": "test, threshold, defense, asymmetry, pressure on position"
        },
        {
          "ref": "air_swords",
          "name": "Air / Swords",
          "operation": "distinction, comparison, separation, relation, language, thought, distance, and pattern"
        },
        {
          "ref": "moon",
          "name": "Moon",
          "operation": "rhythm, memory, instinct, mood, protection, recurrence"
        },
        {
          "ref": "aquarius",
          "name": "Aquarius",
          "operation": "pattern, group, abstraction, future-vision, fixed air"
        }
      ],
      "locked_relphi_interpretation": "The Seven of Swords is individual thought under pressure inside a larger pattern: instinct guards a position, but the mind is tested by distance, abstraction, and asymmetry.",
      "senses": [
        {
          "key": "strategy",
          "label": "Strategy",
          "panel_phrase": "Strategy",
          "relationship_phrase": "The mind is acting under pressure.",
          "ingredient_justification": "Seven supplies test, threshold, defense, asymmetry, pressure on position; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Moon supplies rhythm, memory, instinct, mood, protection, recurrence; Aquarius supplies pattern, group, abstraction, future-vision, fixed air. This sense emphasizes the card's derived field: The Seven of Swords is individual thought under pressure inside a larger pattern: instinct guards a position, but the mind is tested by distance, abstraction, and asymmetry."
        },
        {
          "key": "guarded_position",
          "label": "Guarded position",
          "panel_phrase": "Guarded position",
          "relationship_phrase": "Someone protects their thought or plan.",
          "ingredient_justification": "Seven supplies test, threshold, defense, asymmetry, pressure on position; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Moon supplies rhythm, memory, instinct, mood, protection, recurrence; Aquarius supplies pattern, group, abstraction, future-vision, fixed air. This sense emphasizes the card's derived field: The Seven of Swords is individual thought under pressure inside a larger pattern: instinct guards a position, but the mind is tested by distance, abstraction, and asymmetry."
        },
        {
          "key": "partial_truth",
          "label": "Partial truth",
          "panel_phrase": "Partial truth",
          "relationship_phrase": "Distance and abstraction test honesty.",
          "ingredient_justification": "Seven supplies test, threshold, defense, asymmetry, pressure on position; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Moon supplies rhythm, memory, instinct, mood, protection, recurrence; Aquarius supplies pattern, group, abstraction, future-vision, fixed air. This sense emphasizes the card's derived field: The Seven of Swords is individual thought under pressure inside a larger pattern: instinct guards a position, but the mind is tested by distance, abstraction, and asymmetry."
        },
        {
          "key": "stealth",
          "label": "Indirect movement",
          "panel_phrase": "Indirect movement",
          "relationship_phrase": "The path is not fully open or direct.",
          "ingredient_justification": "Seven supplies test, threshold, defense, asymmetry, pressure on position; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Moon supplies rhythm, memory, instinct, mood, protection, recurrence; Aquarius supplies pattern, group, abstraction, future-vision, fixed air. This sense emphasizes the card's derived field: The Seven of Swords is individual thought under pressure inside a larger pattern: instinct guards a position, but the mind is tested by distance, abstraction, and asymmetry."
        }
      ]
    },
    {
      "card_id": "eight_of_swords",
      "name": "Eight of Swords",
      "group": "Swords 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "interference",
      "ingredients": [
        {
          "ref": "eight",
          "name": "Eight",
          "operation": "motion through system, rhythm, repetition, circulation, momentum"
        },
        {
          "ref": "air_swords",
          "name": "Air / Swords",
          "operation": "distinction, comparison, separation, relation, language, thought, distance, and pattern"
        },
        {
          "ref": "jupiter",
          "name": "Jupiter",
          "operation": "expansion, increase, confidence, blessing, enlargement"
        },
        {
          "ref": "gemini",
          "name": "Gemini",
          "operation": "branching, naming, multiplicity, exchange, mutable air"
        }
      ],
      "locked_relphi_interpretation": "The Eight of Swords is thought multiplying through a moving system: language branches, exchange expands, and mental motion creates too many crossing paths.",
      "senses": [
        {
          "key": "interference",
          "label": "Patterned interference",
          "panel_phrase": "Patterned interference",
          "relationship_phrase": "Too many crossing thoughts bind the situation.",
          "ingredient_justification": "Eight supplies motion through system, rhythm, repetition, circulation, momentum; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Jupiter supplies expansion, increase, confidence, blessing, enlargement; Gemini supplies branching, naming, multiplicity, exchange, mutable air. This sense emphasizes the card's derived field: The Eight of Swords is thought multiplying through a moving system: language branches, exchange expands, and mental motion creates too many crossing paths."
        },
        {
          "key": "mental_trap",
          "label": "Mental trap",
          "panel_phrase": "Mental trap",
          "relationship_phrase": "Language multiplies until movement feels blocked.",
          "ingredient_justification": "Eight supplies motion through system, rhythm, repetition, circulation, momentum; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Jupiter supplies expansion, increase, confidence, blessing, enlargement; Gemini supplies branching, naming, multiplicity, exchange, mutable air. This sense emphasizes the card's derived field: The Eight of Swords is thought multiplying through a moving system: language branches, exchange expands, and mental motion creates too many crossing paths."
        },
        {
          "key": "overthinking",
          "label": "Overthinking",
          "panel_phrase": "Overthinking",
          "relationship_phrase": "Expansion of thought creates the constraint.",
          "ingredient_justification": "Eight supplies motion through system, rhythm, repetition, circulation, momentum; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Jupiter supplies expansion, increase, confidence, blessing, enlargement; Gemini supplies branching, naming, multiplicity, exchange, mutable air. This sense emphasizes the card's derived field: The Eight of Swords is thought multiplying through a moving system: language branches, exchange expands, and mental motion creates too many crossing paths."
        },
        {
          "key": "crossed_paths",
          "label": "Crossed paths",
          "panel_phrase": "Crossed paths",
          "relationship_phrase": "There are too many competing interpretations.",
          "ingredient_justification": "Eight supplies motion through system, rhythm, repetition, circulation, momentum; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Jupiter supplies expansion, increase, confidence, blessing, enlargement; Gemini supplies branching, naming, multiplicity, exchange, mutable air. This sense emphasizes the card's derived field: The Eight of Swords is thought multiplying through a moving system: language branches, exchange expands, and mental motion creates too many crossing paths."
        }
      ]
    },
    {
      "card_id": "nine_of_swords",
      "name": "Nine of Swords",
      "group": "Swords 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "mental_pressure",
      "ingredients": [
        {
          "ref": "nine",
          "name": "Nine",
          "operation": "concentration, culmination, inner reserve, completion before release"
        },
        {
          "ref": "air_swords",
          "name": "Air / Swords",
          "operation": "distinction, comparison, separation, relation, language, thought, distance, and pattern"
        },
        {
          "ref": "mars",
          "name": "Mars",
          "operation": "action, assertion, friction, cutting force"
        },
        {
          "ref": "gemini",
          "name": "Gemini",
          "operation": "branching, naming, multiplicity, exchange, mutable air"
        }
      ],
      "locked_relphi_interpretation": "The Nine of Swords is concentrated mental force under cutting pressure: thought branches inward, language sharpens, and accumulated distinction presses against the mind.",
      "senses": [
        {
          "key": "mental_pressure",
          "label": "Mental pressure",
          "panel_phrase": "Mental pressure",
          "relationship_phrase": "Thought presses inward with force.",
          "ingredient_justification": "Nine supplies concentration, culmination, inner reserve, completion before release; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Mars supplies action, assertion, friction, cutting force; Gemini supplies branching, naming, multiplicity, exchange, mutable air. This sense emphasizes the card's derived field: The Nine of Swords is concentrated mental force under cutting pressure: thought branches inward, language sharpens, and accumulated distinction presses against the mind."
        },
        {
          "key": "night_words",
          "label": "Night words",
          "panel_phrase": "Night words",
          "relationship_phrase": "Language turns sharp inside the mind.",
          "ingredient_justification": "Nine supplies concentration, culmination, inner reserve, completion before release; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Mars supplies action, assertion, friction, cutting force; Gemini supplies branching, naming, multiplicity, exchange, mutable air. This sense emphasizes the card's derived field: The Nine of Swords is concentrated mental force under cutting pressure: thought branches inward, language sharpens, and accumulated distinction presses against the mind."
        },
        {
          "key": "anxiety_cut",
          "label": "Anxiety cut",
          "panel_phrase": "Anxiety cut",
          "relationship_phrase": "Accumulated distinctions hurt.",
          "ingredient_justification": "Nine supplies concentration, culmination, inner reserve, completion before release; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Mars supplies action, assertion, friction, cutting force; Gemini supplies branching, naming, multiplicity, exchange, mutable air. This sense emphasizes the card's derived field: The Nine of Swords is concentrated mental force under cutting pressure: thought branches inward, language sharpens, and accumulated distinction presses against the mind."
        },
        {
          "key": "inward_attack",
          "label": "Inward attack",
          "panel_phrase": "Inward attack",
          "relationship_phrase": "The conflict has moved inside.",
          "ingredient_justification": "Nine supplies concentration, culmination, inner reserve, completion before release; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Mars supplies action, assertion, friction, cutting force; Gemini supplies branching, naming, multiplicity, exchange, mutable air. This sense emphasizes the card's derived field: The Nine of Swords is concentrated mental force under cutting pressure: thought branches inward, language sharpens, and accumulated distinction presses against the mind."
        }
      ]
    },
    {
      "card_id": "ten_of_swords",
      "name": "Ten of Swords",
      "group": "Swords 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "total_severance",
      "ingredients": [
        {
          "ref": "ten",
          "name": "Ten",
          "operation": "completion, totalization, full manifestation, burden of the whole"
        },
        {
          "ref": "air_swords",
          "name": "Air / Swords",
          "operation": "distinction, comparison, separation, relation, language, thought, distance, and pattern"
        },
        {
          "ref": "sun",
          "name": "Sun",
          "operation": "illumination, identity, vitality, central radiance"
        },
        {
          "ref": "gemini",
          "name": "Gemini",
          "operation": "branching, naming, multiplicity, exchange, mutable air"
        }
      ],
      "locked_relphi_interpretation": "The Ten of Swords is distinction at total exposure: thought reaches full consequence, branching is made visible, and the mind meets the weight of its completed divisions.",
      "senses": [
        {
          "key": "total_severance",
          "label": "Total severance",
          "panel_phrase": "Total severance",
          "relationship_phrase": "A thought-pattern has reached full consequence.",
          "ingredient_justification": "Ten supplies completion, totalization, full manifestation, burden of the whole; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Sun supplies illumination, identity, vitality, central radiance; Gemini supplies branching, naming, multiplicity, exchange, mutable air. This sense emphasizes the card's derived field: The Ten of Swords is distinction at total exposure: thought reaches full consequence, branching is made visible, and the mind meets the weight of its completed divisions."
        },
        {
          "key": "exposed_ending",
          "label": "Exposed ending",
          "panel_phrase": "Exposed ending",
          "relationship_phrase": "What was mentally completed is now visible.",
          "ingredient_justification": "Ten supplies completion, totalization, full manifestation, burden of the whole; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Sun supplies illumination, identity, vitality, central radiance; Gemini supplies branching, naming, multiplicity, exchange, mutable air. This sense emphasizes the card's derived field: The Ten of Swords is distinction at total exposure: thought reaches full consequence, branching is made visible, and the mind meets the weight of its completed divisions."
        },
        {
          "key": "no_more_argument",
          "label": "No more argument",
          "panel_phrase": "No more argument",
          "relationship_phrase": "The distinction has reached its limit.",
          "ingredient_justification": "Ten supplies completion, totalization, full manifestation, burden of the whole; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Sun supplies illumination, identity, vitality, central radiance; Gemini supplies branching, naming, multiplicity, exchange, mutable air. This sense emphasizes the card's derived field: The Ten of Swords is distinction at total exposure: thought reaches full consequence, branching is made visible, and the mind meets the weight of its completed divisions."
        },
        {
          "key": "completed_thought",
          "label": "Completed thought",
          "panel_phrase": "Completed thought",
          "relationship_phrase": "The pattern is finished and cannot keep branching.",
          "ingredient_justification": "Ten supplies completion, totalization, full manifestation, burden of the whole; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern; Sun supplies illumination, identity, vitality, central radiance; Gemini supplies branching, naming, multiplicity, exchange, mutable air. This sense emphasizes the card's derived field: The Ten of Swords is distinction at total exposure: thought reaches full consequence, branching is made visible, and the mind meets the weight of its completed divisions."
        }
      ]
    },
    {
      "card_id": "two_of_pentacles",
      "name": "Two of Pentacles / Disks",
      "group": "Pentacles / Disks 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "juggling",
      "ingredients": [
        {
          "ref": "two",
          "name": "Two",
          "operation": "polarity, division, relation, first axis"
        },
        {
          "ref": "earth_pentacles_disks",
          "name": "Earth / Pentacles / Disks",
          "operation": "embodiment, stabilization, storage, boundary, materialization, endurance, and consequence"
        },
        {
          "ref": "jupiter",
          "name": "Jupiter",
          "operation": "expansion, increase, confidence, blessing, enlargement"
        },
        {
          "ref": "capricorn",
          "name": "Capricorn",
          "operation": "structure, ascent, obligation, discipline, cardinal earth"
        }
      ],
      "locked_relphi_interpretation": "The Two of Pentacles / Disks is material relation under expansion and structure: resources are placed into motion between poles, growth meets obligation, and form must adjust while carrying weight.",
      "senses": [
        {
          "key": "juggling",
          "label": "Managing flux",
          "panel_phrase": "Managing flux",
          "relationship_phrase": "Resources are moving between poles.",
          "ingredient_justification": "Two supplies polarity, division, relation, first axis; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Jupiter supplies expansion, increase, confidence, blessing, enlargement; Capricorn supplies structure, ascent, obligation, discipline, cardinal earth. This sense emphasizes the card's derived field: The Two of Pentacles / Disks is material relation under expansion and structure: resources are placed into motion between poles, growth meets obligation, and form must adjust while carrying weight."
        },
        {
          "key": "obligation_growth",
          "label": "Growth meets obligation",
          "panel_phrase": "Growth meets obligation",
          "relationship_phrase": "Expansion must answer to structure.",
          "ingredient_justification": "Two supplies polarity, division, relation, first axis; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Jupiter supplies expansion, increase, confidence, blessing, enlargement; Capricorn supplies structure, ascent, obligation, discipline, cardinal earth. This sense emphasizes the card's derived field: The Two of Pentacles / Disks is material relation under expansion and structure: resources are placed into motion between poles, growth meets obligation, and form must adjust while carrying weight."
        },
        {
          "key": "practical_balance",
          "label": "Practical balance",
          "panel_phrase": "Practical balance",
          "relationship_phrase": "The material situation needs rhythm and proportion.",
          "ingredient_justification": "Two supplies polarity, division, relation, first axis; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Jupiter supplies expansion, increase, confidence, blessing, enlargement; Capricorn supplies structure, ascent, obligation, discipline, cardinal earth. This sense emphasizes the card's derived field: The Two of Pentacles / Disks is material relation under expansion and structure: resources are placed into motion between poles, growth meets obligation, and form must adjust while carrying weight."
        },
        {
          "key": "two_realities",
          "label": "Two real realities",
          "panel_phrase": "Two real realities",
          "relationship_phrase": "Both sides have practical weight.",
          "ingredient_justification": "Two supplies polarity, division, relation, first axis; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Jupiter supplies expansion, increase, confidence, blessing, enlargement; Capricorn supplies structure, ascent, obligation, discipline, cardinal earth. This sense emphasizes the card's derived field: The Two of Pentacles / Disks is material relation under expansion and structure: resources are placed into motion between poles, growth meets obligation, and form must adjust while carrying weight."
        }
      ]
    },
    {
      "card_id": "three_of_pentacles",
      "name": "Three of Pentacles / Disks",
      "group": "Pentacles / Disks 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "skilled_work",
      "ingredients": [
        {
          "ref": "three",
          "name": "Three",
          "operation": "emergence, growth, triangulation, first pattern"
        },
        {
          "ref": "earth_pentacles_disks",
          "name": "Earth / Pentacles / Disks",
          "operation": "embodiment, stabilization, storage, boundary, materialization, endurance, and consequence"
        },
        {
          "ref": "mars",
          "name": "Mars",
          "operation": "action, assertion, friction, cutting force"
        },
        {
          "ref": "capricorn",
          "name": "Capricorn",
          "operation": "structure, ascent, obligation, discipline, cardinal earth"
        }
      ],
      "locked_relphi_interpretation": "The Three of Pentacles / Disks is material form under active construction: effort enters structure, action presses into disciplined earth, and work begins to show a stable pattern.",
      "senses": [
        {
          "key": "skilled_work",
          "label": "Skilled work",
          "panel_phrase": "Skilled work",
          "relationship_phrase": "Effort is taking form.",
          "ingredient_justification": "Three supplies emergence, growth, triangulation, first pattern; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Mars supplies action, assertion, friction, cutting force; Capricorn supplies structure, ascent, obligation, discipline, cardinal earth. This sense emphasizes the card's derived field: The Three of Pentacles / Disks is material form under active construction: effort enters structure, action presses into disciplined earth, and work begins to show a stable pattern."
        },
        {
          "key": "construction",
          "label": "Active construction",
          "panel_phrase": "Active construction",
          "relationship_phrase": "Action presses into disciplined earth.",
          "ingredient_justification": "Three supplies emergence, growth, triangulation, first pattern; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Mars supplies action, assertion, friction, cutting force; Capricorn supplies structure, ascent, obligation, discipline, cardinal earth. This sense emphasizes the card's derived field: The Three of Pentacles / Disks is material form under active construction: effort enters structure, action presses into disciplined earth, and work begins to show a stable pattern."
        },
        {
          "key": "collaboration",
          "label": "Work with others",
          "panel_phrase": "Work with others",
          "relationship_phrase": "The pattern develops through shared structure.",
          "ingredient_justification": "Three supplies emergence, growth, triangulation, first pattern; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Mars supplies action, assertion, friction, cutting force; Capricorn supplies structure, ascent, obligation, discipline, cardinal earth. This sense emphasizes the card's derived field: The Three of Pentacles / Disks is material form under active construction: effort enters structure, action presses into disciplined earth, and work begins to show a stable pattern."
        },
        {
          "key": "visible_craft",
          "label": "Visible craft",
          "panel_phrase": "Visible craft",
          "relationship_phrase": "The work can now be seen and evaluated.",
          "ingredient_justification": "Three supplies emergence, growth, triangulation, first pattern; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Mars supplies action, assertion, friction, cutting force; Capricorn supplies structure, ascent, obligation, discipline, cardinal earth. This sense emphasizes the card's derived field: The Three of Pentacles / Disks is material form under active construction: effort enters structure, action presses into disciplined earth, and work begins to show a stable pattern."
        }
      ]
    },
    {
      "card_id": "four_of_pentacles",
      "name": "Four of Pentacles / Disks",
      "group": "Pentacles / Disks 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "guarding",
      "ingredients": [
        {
          "ref": "four",
          "name": "Four",
          "operation": "stability, container, form"
        },
        {
          "ref": "earth_pentacles_disks",
          "name": "Earth / Pentacles / Disks",
          "operation": "embodiment, stabilization, storage, boundary, materialization, endurance, and consequence"
        },
        {
          "ref": "sun",
          "name": "Sun",
          "operation": "illumination, identity, vitality, central radiance"
        },
        {
          "ref": "capricorn",
          "name": "Capricorn",
          "operation": "structure, ascent, obligation, discipline, cardinal earth"
        }
      ],
      "locked_relphi_interpretation": "The Four of Pentacles / Disks is material identity held in structure: form is stabilized, the center is made visible, and disciplined earth gives identity a container.",
      "senses": [
        {
          "key": "guarding",
          "label": "Guarding resources",
          "panel_phrase": "Guarding resources",
          "relationship_phrase": "Someone is protecting what they have.",
          "ingredient_justification": "Four supplies stability, container, form; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Sun supplies illumination, identity, vitality, central radiance; Capricorn supplies structure, ascent, obligation, discipline, cardinal earth. This sense emphasizes the card's derived field: The Four of Pentacles / Disks is material identity held in structure: form is stabilized, the center is made visible, and disciplined earth gives identity a container."
        },
        {
          "key": "clinging",
          "label": "Clinging",
          "panel_phrase": "Clinging",
          "relationship_phrase": "Holding becomes tight because security feels central.",
          "ingredient_justification": "Four supplies stability, container, form; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Sun supplies illumination, identity, vitality, central radiance; Capricorn supplies structure, ascent, obligation, discipline, cardinal earth. This sense emphasizes the card's derived field: The Four of Pentacles / Disks is material identity held in structure: form is stabilized, the center is made visible, and disciplined earth gives identity a container."
        },
        {
          "key": "withholding",
          "label": "Withholding",
          "panel_phrase": "Withholding",
          "relationship_phrase": "Access is controlled or restricted.",
          "ingredient_justification": "Four supplies stability, container, form; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Sun supplies illumination, identity, vitality, central radiance; Capricorn supplies structure, ascent, obligation, discipline, cardinal earth. This sense emphasizes the card's derived field: The Four of Pentacles / Disks is material identity held in structure: form is stabilized, the center is made visible, and disciplined earth gives identity a container."
        },
        {
          "key": "conserving",
          "label": "Conserving",
          "panel_phrase": "Conserving",
          "relationship_phrase": "Energy, money, time, or attention is being preserved.",
          "ingredient_justification": "Four supplies stability, container, form; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Sun supplies illumination, identity, vitality, central radiance; Capricorn supplies structure, ascent, obligation, discipline, cardinal earth. This sense emphasizes the card's derived field: The Four of Pentacles / Disks is material identity held in structure: form is stabilized, the center is made visible, and disciplined earth gives identity a container."
        },
        {
          "key": "security_control",
          "label": "Security as control",
          "panel_phrase": "Security as control",
          "relationship_phrase": "The need for safety may become controlling.",
          "ingredient_justification": "Four supplies stability, container, form; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Sun supplies illumination, identity, vitality, central radiance; Capricorn supplies structure, ascent, obligation, discipline, cardinal earth. This sense emphasizes the card's derived field: The Four of Pentacles / Disks is material identity held in structure: form is stabilized, the center is made visible, and disciplined earth gives identity a container."
        }
      ]
    },
    {
      "card_id": "five_of_pentacles",
      "name": "Five of Pentacles / Disks",
      "group": "Pentacles / Disks 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "lack",
      "ingredients": [
        {
          "ref": "five",
          "name": "Five",
          "operation": "disturbance, pressure, disruption, instability"
        },
        {
          "ref": "earth_pentacles_disks",
          "name": "Earth / Pentacles / Disks",
          "operation": "embodiment, stabilization, storage, boundary, materialization, endurance, and consequence"
        },
        {
          "ref": "mercury",
          "name": "Mercury",
          "operation": "language, exchange, translation, movement, connection"
        },
        {
          "ref": "taurus",
          "name": "Taurus",
          "operation": "possession, embodiment, value, persistence, fixed earth"
        }
      ],
      "locked_relphi_interpretation": "The Five of Pentacles / Disks is material value under disruptive thought: what is held steady is disturbed by movement, interpretation, and pressure on the body of value.",
      "senses": [
        {
          "key": "lack",
          "label": "Lack",
          "panel_phrase": "Lack",
          "relationship_phrase": "A real need or shortage is present.",
          "ingredient_justification": "Five supplies disturbance, pressure, disruption, instability; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Mercury supplies language, exchange, translation, movement, connection; Taurus supplies possession, embodiment, value, persistence, fixed earth. This sense emphasizes the card's derived field: The Five of Pentacles / Disks is material value under disruptive thought: what is held steady is disturbed by movement, interpretation, and pressure on the body of value."
        },
        {
          "key": "unsupported",
          "label": "Unsupported",
          "panel_phrase": "Unsupported",
          "relationship_phrase": "Someone lacks practical, bodily, or emotional support.",
          "ingredient_justification": "Five supplies disturbance, pressure, disruption, instability; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Mercury supplies language, exchange, translation, movement, connection; Taurus supplies possession, embodiment, value, persistence, fixed earth. This sense emphasizes the card's derived field: The Five of Pentacles / Disks is material value under disruptive thought: what is held steady is disturbed by movement, interpretation, and pressure on the body of value."
        },
        {
          "key": "excluded",
          "label": "Left out",
          "panel_phrase": "Left out",
          "relationship_phrase": "A person is outside the place of help or value.",
          "ingredient_justification": "Five supplies disturbance, pressure, disruption, instability; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Mercury supplies language, exchange, translation, movement, connection; Taurus supplies possession, embodiment, value, persistence, fixed earth. This sense emphasizes the card's derived field: The Five of Pentacles / Disks is material value under disruptive thought: what is held steady is disturbed by movement, interpretation, and pressure on the body of value."
        },
        {
          "key": "worry",
          "label": "Worry",
          "panel_phrase": "Worry",
          "relationship_phrase": "Material pressure becomes mental pressure.",
          "ingredient_justification": "Five supplies disturbance, pressure, disruption, instability; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Mercury supplies language, exchange, translation, movement, connection; Taurus supplies possession, embodiment, value, persistence, fixed earth. This sense emphasizes the card's derived field: The Five of Pentacles / Disks is material value under disruptive thought: what is held steady is disturbed by movement, interpretation, and pressure on the body of value."
        },
        {
          "key": "access_problem",
          "label": "Access problem",
          "panel_phrase": "Access problem",
          "relationship_phrase": "Help may exist, but access is blocked or unclear.",
          "ingredient_justification": "Five supplies disturbance, pressure, disruption, instability; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Mercury supplies language, exchange, translation, movement, connection; Taurus supplies possession, embodiment, value, persistence, fixed earth. This sense emphasizes the card's derived field: The Five of Pentacles / Disks is material value under disruptive thought: what is held steady is disturbed by movement, interpretation, and pressure on the body of value."
        }
      ]
    },
    {
      "card_id": "six_of_pentacles",
      "name": "Six of Pentacles / Disks",
      "group": "Pentacles / Disks 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "redistribution",
      "ingredients": [
        {
          "ref": "six",
          "name": "Six",
          "operation": "coordination, balance, integration, restored relation"
        },
        {
          "ref": "earth_pentacles_disks",
          "name": "Earth / Pentacles / Disks",
          "operation": "embodiment, stabilization, storage, boundary, materialization, endurance, and consequence"
        },
        {
          "ref": "moon",
          "name": "Moon",
          "operation": "rhythm, memory, instinct, mood, protection, recurrence"
        },
        {
          "ref": "taurus",
          "name": "Taurus",
          "operation": "possession, embodiment, value, persistence, fixed earth"
        }
      ],
      "locked_relphi_interpretation": "The Six of Pentacles / Disks is material value brought into rhythm and proportion: resources are held steadily, bodily continuity is protected, and form finds functional balance.",
      "senses": [
        {
          "key": "redistribution",
          "label": "Resource redistributed",
          "panel_phrase": "Resource redistributed",
          "relationship_phrase": "Support moves between people.",
          "ingredient_justification": "Six supplies coordination, balance, integration, restored relation; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Moon supplies rhythm, memory, instinct, mood, protection, recurrence; Taurus supplies possession, embodiment, value, persistence, fixed earth. This sense emphasizes the card's derived field: The Six of Pentacles / Disks is material value brought into rhythm and proportion: resources are held steadily, bodily continuity is protected, and form finds functional balance."
        },
        {
          "key": "proportion",
          "label": "Fair proportion",
          "panel_phrase": "Fair proportion",
          "relationship_phrase": "Resources need balance and measure.",
          "ingredient_justification": "Six supplies coordination, balance, integration, restored relation; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Moon supplies rhythm, memory, instinct, mood, protection, recurrence; Taurus supplies possession, embodiment, value, persistence, fixed earth. This sense emphasizes the card's derived field: The Six of Pentacles / Disks is material value brought into rhythm and proportion: resources are held steadily, bodily continuity is protected, and form finds functional balance."
        },
        {
          "key": "giving_receiving",
          "label": "Giving and receiving",
          "panel_phrase": "Giving and receiving",
          "relationship_phrase": "The relationship depends on the rhythm of support.",
          "ingredient_justification": "Six supplies coordination, balance, integration, restored relation; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Moon supplies rhythm, memory, instinct, mood, protection, recurrence; Taurus supplies possession, embodiment, value, persistence, fixed earth. This sense emphasizes the card's derived field: The Six of Pentacles / Disks is material value brought into rhythm and proportion: resources are held steadily, bodily continuity is protected, and form finds functional balance."
        },
        {
          "key": "protected_continuity",
          "label": "Protected continuity",
          "panel_phrase": "Protected continuity",
          "relationship_phrase": "Care keeps practical life steady.",
          "ingredient_justification": "Six supplies coordination, balance, integration, restored relation; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Moon supplies rhythm, memory, instinct, mood, protection, recurrence; Taurus supplies possession, embodiment, value, persistence, fixed earth. This sense emphasizes the card's derived field: The Six of Pentacles / Disks is material value brought into rhythm and proportion: resources are held steadily, bodily continuity is protected, and form finds functional balance."
        }
      ]
    },
    {
      "card_id": "seven_of_pentacles",
      "name": "Seven of Pentacles / Disks",
      "group": "Pentacles / Disks 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "waiting_yield",
      "ingredients": [
        {
          "ref": "seven",
          "name": "Seven",
          "operation": "test, threshold, defense, asymmetry, pressure on position"
        },
        {
          "ref": "earth_pentacles_disks",
          "name": "Earth / Pentacles / Disks",
          "operation": "embodiment, stabilization, storage, boundary, materialization, endurance, and consequence"
        },
        {
          "ref": "saturn",
          "name": "Saturn",
          "operation": "limit, compression, boundary, weight, consequence"
        },
        {
          "ref": "taurus",
          "name": "Taurus",
          "operation": "possession, embodiment, value, persistence, fixed earth"
        }
      ],
      "locked_relphi_interpretation": "The Seven of Pentacles / Disks is material value tested by limit: what is held steady meets weight, delay, and consequence, and the body of value must endure pressure on its position.",
      "senses": [
        {
          "key": "waiting_yield",
          "label": "Waiting on yield",
          "panel_phrase": "Waiting on yield",
          "relationship_phrase": "Value is tested by delay.",
          "ingredient_justification": "Seven supplies test, threshold, defense, asymmetry, pressure on position; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Saturn supplies limit, compression, boundary, weight, consequence; Taurus supplies possession, embodiment, value, persistence, fixed earth. This sense emphasizes the card's derived field: The Seven of Pentacles / Disks is material value tested by limit: what is held steady meets weight, delay, and consequence, and the body of value must endure pressure on its position."
        },
        {
          "key": "investment_test",
          "label": "Investment test",
          "panel_phrase": "Investment test",
          "relationship_phrase": "What has been built must prove itself.",
          "ingredient_justification": "Seven supplies test, threshold, defense, asymmetry, pressure on position; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Saturn supplies limit, compression, boundary, weight, consequence; Taurus supplies possession, embodiment, value, persistence, fixed earth. This sense emphasizes the card's derived field: The Seven of Pentacles / Disks is material value tested by limit: what is held steady meets weight, delay, and consequence, and the body of value must endure pressure on its position."
        },
        {
          "key": "endurance",
          "label": "Material endurance",
          "panel_phrase": "Material endurance",
          "relationship_phrase": "The resource must hold under weight.",
          "ingredient_justification": "Seven supplies test, threshold, defense, asymmetry, pressure on position; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Saturn supplies limit, compression, boundary, weight, consequence; Taurus supplies possession, embodiment, value, persistence, fixed earth. This sense emphasizes the card's derived field: The Seven of Pentacles / Disks is material value tested by limit: what is held steady meets weight, delay, and consequence, and the body of value must endure pressure on its position."
        },
        {
          "key": "slow_assessment",
          "label": "Slow assessment",
          "panel_phrase": "Slow assessment",
          "relationship_phrase": "The situation asks whether the labor is worth continuing.",
          "ingredient_justification": "Seven supplies test, threshold, defense, asymmetry, pressure on position; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Saturn supplies limit, compression, boundary, weight, consequence; Taurus supplies possession, embodiment, value, persistence, fixed earth. This sense emphasizes the card's derived field: The Seven of Pentacles / Disks is material value tested by limit: what is held steady meets weight, delay, and consequence, and the body of value must endure pressure on its position."
        }
      ]
    },
    {
      "card_id": "eight_of_pentacles",
      "name": "Eight of Pentacles / Disks",
      "group": "Pentacles / Disks 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "practice",
      "ingredients": [
        {
          "ref": "eight",
          "name": "Eight",
          "operation": "motion through system, rhythm, repetition, circulation, momentum"
        },
        {
          "ref": "earth_pentacles_disks",
          "name": "Earth / Pentacles / Disks",
          "operation": "embodiment, stabilization, storage, boundary, materialization, endurance, and consequence"
        },
        {
          "ref": "sun",
          "name": "Sun",
          "operation": "illumination, identity, vitality, central radiance"
        },
        {
          "ref": "virgo",
          "name": "Virgo",
          "operation": "refinement, sorting, repair, service, mutable earth"
        }
      ],
      "locked_relphi_interpretation": "The Eight of Pentacles / Disks is material form moving through refinement: repeated action reveals useful detail, and earth is organized through careful correction.",
      "senses": [
        {
          "key": "practice",
          "label": "Repeated craft",
          "panel_phrase": "Repeated craft",
          "relationship_phrase": "Repeated action improves the form.",
          "ingredient_justification": "Eight supplies motion through system, rhythm, repetition, circulation, momentum; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Sun supplies illumination, identity, vitality, central radiance; Virgo supplies refinement, sorting, repair, service, mutable earth. This sense emphasizes the card's derived field: The Eight of Pentacles / Disks is material form moving through refinement: repeated action reveals useful detail, and earth is organized through careful correction."
        },
        {
          "key": "refinement",
          "label": "Useful refinement",
          "panel_phrase": "Useful refinement",
          "relationship_phrase": "Detail and correction make the work better.",
          "ingredient_justification": "Eight supplies motion through system, rhythm, repetition, circulation, momentum; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Sun supplies illumination, identity, vitality, central radiance; Virgo supplies refinement, sorting, repair, service, mutable earth. This sense emphasizes the card's derived field: The Eight of Pentacles / Disks is material form moving through refinement: repeated action reveals useful detail, and earth is organized through careful correction."
        },
        {
          "key": "skill_building",
          "label": "Skill building",
          "panel_phrase": "Skill building",
          "relationship_phrase": "Value grows through practice, not luck.",
          "ingredient_justification": "Eight supplies motion through system, rhythm, repetition, circulation, momentum; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Sun supplies illumination, identity, vitality, central radiance; Virgo supplies refinement, sorting, repair, service, mutable earth. This sense emphasizes the card's derived field: The Eight of Pentacles / Disks is material form moving through refinement: repeated action reveals useful detail, and earth is organized through careful correction."
        },
        {
          "key": "repair",
          "label": "Repair through detail",
          "panel_phrase": "Repair through detail",
          "relationship_phrase": "Small corrections restore usefulness.",
          "ingredient_justification": "Eight supplies motion through system, rhythm, repetition, circulation, momentum; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Sun supplies illumination, identity, vitality, central radiance; Virgo supplies refinement, sorting, repair, service, mutable earth. This sense emphasizes the card's derived field: The Eight of Pentacles / Disks is material form moving through refinement: repeated action reveals useful detail, and earth is organized through careful correction."
        }
      ]
    },
    {
      "card_id": "nine_of_pentacles",
      "name": "Nine of Pentacles / Disks",
      "group": "Pentacles / Disks 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "self_possession",
      "ingredients": [
        {
          "ref": "nine",
          "name": "Nine",
          "operation": "concentration, culmination, inner reserve, completion before release"
        },
        {
          "ref": "earth_pentacles_disks",
          "name": "Earth / Pentacles / Disks",
          "operation": "embodiment, stabilization, storage, boundary, materialization, endurance, and consequence"
        },
        {
          "ref": "venus",
          "name": "Venus",
          "operation": "attraction, value, pleasure, coherence, joining"
        },
        {
          "ref": "virgo",
          "name": "Virgo",
          "operation": "refinement, sorting, repair, service, mutable earth"
        }
      ],
      "locked_relphi_interpretation": "The Nine of Pentacles / Disks is refined value held in reserve: material detail is corrected into coherence, value is concentrated, and useful form approaches fullness.",
      "senses": [
        {
          "key": "self_possession",
          "label": "Self-possession",
          "panel_phrase": "Self-possession",
          "relationship_phrase": "Someone is secure in their own cultivated space.",
          "ingredient_justification": "Nine supplies concentration, culmination, inner reserve, completion before release; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Venus supplies attraction, value, pleasure, coherence, joining; Virgo supplies refinement, sorting, repair, service, mutable earth. This sense emphasizes the card's derived field: The Nine of Pentacles / Disks is refined value held in reserve: material detail is corrected into coherence, value is concentrated, and useful form approaches fullness."
        },
        {
          "key": "cultivated_value",
          "label": "Cultivated value",
          "panel_phrase": "Cultivated value",
          "relationship_phrase": "Refined work has become reserve.",
          "ingredient_justification": "Nine supplies concentration, culmination, inner reserve, completion before release; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Venus supplies attraction, value, pleasure, coherence, joining; Virgo supplies refinement, sorting, repair, service, mutable earth. This sense emphasizes the card's derived field: The Nine of Pentacles / Disks is refined value held in reserve: material detail is corrected into coherence, value is concentrated, and useful form approaches fullness."
        },
        {
          "key": "secure_alone",
          "label": "Secure alone",
          "panel_phrase": "Secure alone",
          "relationship_phrase": "Independence is strong and may create distance.",
          "ingredient_justification": "Nine supplies concentration, culmination, inner reserve, completion before release; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Venus supplies attraction, value, pleasure, coherence, joining; Virgo supplies refinement, sorting, repair, service, mutable earth. This sense emphasizes the card's derived field: The Nine of Pentacles / Disks is refined value held in reserve: material detail is corrected into coherence, value is concentrated, and useful form approaches fullness."
        },
        {
          "key": "gardened_life",
          "label": "Gardened life",
          "panel_phrase": "Gardened life",
          "relationship_phrase": "The environment reflects patient care and taste.",
          "ingredient_justification": "Nine supplies concentration, culmination, inner reserve, completion before release; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Venus supplies attraction, value, pleasure, coherence, joining; Virgo supplies refinement, sorting, repair, service, mutable earth. This sense emphasizes the card's derived field: The Nine of Pentacles / Disks is refined value held in reserve: material detail is corrected into coherence, value is concentrated, and useful form approaches fullness."
        }
      ]
    },
    {
      "card_id": "ten_of_pentacles",
      "name": "Ten of Pentacles / Disks",
      "group": "Pentacles / Disks 2-10",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "whole_structure",
      "ingredients": [
        {
          "ref": "ten",
          "name": "Ten",
          "operation": "completion, totalization, full manifestation, burden of the whole"
        },
        {
          "ref": "earth_pentacles_disks",
          "name": "Earth / Pentacles / Disks",
          "operation": "embodiment, stabilization, storage, boundary, materialization, endurance, and consequence"
        },
        {
          "ref": "mercury",
          "name": "Mercury",
          "operation": "language, exchange, translation, movement, connection"
        },
        {
          "ref": "virgo",
          "name": "Virgo",
          "operation": "refinement, sorting, repair, service, mutable earth"
        }
      ],
      "locked_relphi_interpretation": "The Ten of Pentacles / Disks is material form completed through ordered exchange: detail, value, and resource reach total structure, and the whole system of usefulness is made manifest.",
      "senses": [
        {
          "key": "whole_structure",
          "label": "Whole resource structure",
          "panel_phrase": "Whole resource structure",
          "relationship_phrase": "The full system of value is visible.",
          "ingredient_justification": "Ten supplies completion, totalization, full manifestation, burden of the whole; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Mercury supplies language, exchange, translation, movement, connection; Virgo supplies refinement, sorting, repair, service, mutable earth. This sense emphasizes the card's derived field: The Ten of Pentacles / Disks is material form completed through ordered exchange: detail, value, and resource reach total structure, and the whole system of usefulness is made manifest."
        },
        {
          "key": "inheritance",
          "label": "Inheritance",
          "panel_phrase": "Inheritance",
          "relationship_phrase": "Resources, family, work, or tradition continue through a structure.",
          "ingredient_justification": "Ten supplies completion, totalization, full manifestation, burden of the whole; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Mercury supplies language, exchange, translation, movement, connection; Virgo supplies refinement, sorting, repair, service, mutable earth. This sense emphasizes the card's derived field: The Ten of Pentacles / Disks is material form completed through ordered exchange: detail, value, and resource reach total structure, and the whole system of usefulness is made manifest."
        },
        {
          "key": "shared_reality",
          "label": "Shared reality",
          "panel_phrase": "Shared reality",
          "relationship_phrase": "The relationship has practical architecture.",
          "ingredient_justification": "Ten supplies completion, totalization, full manifestation, burden of the whole; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Mercury supplies language, exchange, translation, movement, connection; Virgo supplies refinement, sorting, repair, service, mutable earth. This sense emphasizes the card's derived field: The Ten of Pentacles / Disks is material form completed through ordered exchange: detail, value, and resource reach total structure, and the whole system of usefulness is made manifest."
        },
        {
          "key": "completed_use",
          "label": "Completed usefulness",
          "panel_phrase": "Completed usefulness",
          "relationship_phrase": "Detail and exchange have become a working whole.",
          "ingredient_justification": "Ten supplies completion, totalization, full manifestation, burden of the whole; Earth / Pentacles / Disks supplies embodiment, stabilization, storage, boundary, materialization, endurance, and consequence; Mercury supplies language, exchange, translation, movement, connection; Virgo supplies refinement, sorting, repair, service, mutable earth. This sense emphasizes the card's derived field: The Ten of Pentacles / Disks is material form completed through ordered exchange: detail, value, and resource reach total structure, and the whole system of usefulness is made manifest."
        }
      ]
    },
    {
      "card_id": "the_fool",
      "name": "The Fool",
      "group": "Mother Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "openness",
      "ingredients": [
        {
          "ref": "aleph",
          "name": "Aleph",
          "operation": "breath, air, silent movement, beginning before articulation"
        },
        {
          "ref": "mother_letter_class",
          "name": "Mother-letter class",
          "operation": "primal field, root element, source-condition"
        },
        {
          "ref": "air_swords",
          "name": "Air / Swords",
          "operation": "distinction, comparison, separation, relation, language, thought, distance, and pattern"
        }
      ],
      "locked_relphi_interpretation": "The Fool is breath before form: origin before measurement, movement before identity, and openness before the world is divided into named things.",
      "senses": [
        {
          "key": "openness",
          "label": "Openness before form",
          "panel_phrase": "Openness before form",
          "relationship_phrase": "The situation is not defined yet.",
          "ingredient_justification": "Aleph supplies breath, air, silent movement, beginning before articulation; Mother-letter class supplies primal field, root element, source-condition; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern. This sense emphasizes the locked derivation: The Fool is breath before form: origin before measurement, movement before identity, and openness before the world is divided into named things."
        },
        {
          "key": "breath",
          "label": "Breath before name",
          "panel_phrase": "Breath before name",
          "relationship_phrase": "Let there be space before naming it.",
          "ingredient_justification": "Aleph supplies breath, air, silent movement, beginning before articulation; Mother-letter class supplies primal field, root element, source-condition; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern. This sense emphasizes the locked derivation: The Fool is breath before form: origin before measurement, movement before identity, and openness before the world is divided into named things."
        },
        {
          "key": "unmeasured",
          "label": "Unmeasured beginning",
          "panel_phrase": "Unmeasured beginning",
          "relationship_phrase": "Do not force measurement too early.",
          "ingredient_justification": "Aleph supplies breath, air, silent movement, beginning before articulation; Mother-letter class supplies primal field, root element, source-condition; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern. This sense emphasizes the locked derivation: The Fool is breath before form: origin before measurement, movement before identity, and openness before the world is divided into named things."
        },
        {
          "key": "free_movement",
          "label": "Free movement",
          "panel_phrase": "Free movement",
          "relationship_phrase": "Something needs room to move before it becomes identity.",
          "ingredient_justification": "Aleph supplies breath, air, silent movement, beginning before articulation; Mother-letter class supplies primal field, root element, source-condition; Air / Swords supplies distinction, comparison, separation, relation, language, thought, distance, and pattern. This sense emphasizes the locked derivation: The Fool is breath before form: origin before measurement, movement before identity, and openness before the world is divided into named things."
        }
      ]
    },
    {
      "card_id": "the_hanged_man",
      "name": "The Hanged Man",
      "group": "Mother Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "suspension",
      "ingredients": [
        {
          "ref": "mem",
          "name": "Mem",
          "operation": "water, immersion, enclosure, womb, depth, suspension"
        },
        {
          "ref": "mother_letter_class",
          "name": "Mother-letter class",
          "operation": "primal field, root element, source-condition"
        },
        {
          "ref": "water_cups",
          "name": "Water / Cups",
          "operation": "reception, feeling, memory, bonding, softening, containment, and response"
        }
      ],
      "locked_relphi_interpretation": "The Hanged Man is consciousness held in water: movement suspended inside depth, identity softened by immersion, and formation taking place below ordinary action.",
      "senses": [
        {
          "key": "suspension",
          "label": "Suspension",
          "panel_phrase": "Suspension",
          "relationship_phrase": "Ordinary action is paused so the situation can form below the surface.",
          "ingredient_justification": "Mem supplies water, immersion, enclosure, womb, depth, suspension; Mother-letter class supplies primal field, root element, source-condition; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response. This sense emphasizes the locked derivation: The Hanged Man is consciousness held in water: movement suspended inside depth, identity softened by immersion, and formation taking place below ordinary action."
        },
        {
          "key": "immersion",
          "label": "Immersion",
          "panel_phrase": "Immersion",
          "relationship_phrase": "The answer is inside feeling, depth, or surrender, not immediate movement.",
          "ingredient_justification": "Mem supplies water, immersion, enclosure, womb, depth, suspension; Mother-letter class supplies primal field, root element, source-condition; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response. This sense emphasizes the locked derivation: The Hanged Man is consciousness held in water: movement suspended inside depth, identity softened by immersion, and formation taking place below ordinary action."
        },
        {
          "key": "softened_identity",
          "label": "Identity softened",
          "panel_phrase": "Identity softened",
          "relationship_phrase": "The self is being changed by what it is held inside.",
          "ingredient_justification": "Mem supplies water, immersion, enclosure, womb, depth, suspension; Mother-letter class supplies primal field, root element, source-condition; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response. This sense emphasizes the locked derivation: The Hanged Man is consciousness held in water: movement suspended inside depth, identity softened by immersion, and formation taking place below ordinary action."
        },
        {
          "key": "below_action",
          "label": "Formation below action",
          "panel_phrase": "Formation below action",
          "relationship_phrase": "Something is taking shape underneath visible behavior.",
          "ingredient_justification": "Mem supplies water, immersion, enclosure, womb, depth, suspension; Mother-letter class supplies primal field, root element, source-condition; Water / Cups supplies reception, feeling, memory, bonding, softening, containment, and response. This sense emphasizes the locked derivation: The Hanged Man is consciousness held in water: movement suspended inside depth, identity softened by immersion, and formation taking place below ordinary action."
        }
      ]
    },
    {
      "card_id": "judgement",
      "name": "Judgment / Aeon",
      "group": "Mother Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "activation",
      "ingredients": [
        {
          "ref": "shin",
          "name": "Shin",
          "operation": "fire, ignition, transformation, animation, consuming prior form"
        },
        {
          "ref": "mother_letter_class",
          "name": "Mother-letter class",
          "operation": "primal field, root element, source-condition"
        },
        {
          "ref": "fire_wands",
          "name": "Fire / Wands",
          "operation": "ignition, activation, will entering action"
        }
      ],
      "locked_relphi_interpretation": "Judgment / Aeon is primal fire entering the field of identity: what was latent is activated, what was sealed is opened by heat, and prior form is consumed into a new event.",
      "senses": [
        {
          "key": "activation",
          "label": "Latent activated",
          "panel_phrase": "Latent activated",
          "relationship_phrase": "What was sealed opens.",
          "ingredient_justification": "Shin supplies fire, ignition, transformation, animation, consuming prior form; Mother-letter class supplies primal field, root element, source-condition; Fire / Wands supplies ignition, activation, will entering action. This sense emphasizes the locked derivation: Judgment / Aeon is primal fire entering the field of identity: what was latent is activated, what was sealed is opened by heat, and prior form is consumed into a new event."
        },
        {
          "key": "call",
          "label": "The call",
          "panel_phrase": "The call",
          "relationship_phrase": "Something asks to be answered.",
          "ingredient_justification": "Shin supplies fire, ignition, transformation, animation, consuming prior form; Mother-letter class supplies primal field, root element, source-condition; Fire / Wands supplies ignition, activation, will entering action. This sense emphasizes the locked derivation: Judgment / Aeon is primal fire entering the field of identity: what was latent is activated, what was sealed is opened by heat, and prior form is consumed into a new event."
        },
        {
          "key": "fire_of_identity",
          "label": "Fire entering identity",
          "panel_phrase": "Fire entering identity",
          "relationship_phrase": "A prior form is consumed into a new one.",
          "ingredient_justification": "Shin supplies fire, ignition, transformation, animation, consuming prior form; Mother-letter class supplies primal field, root element, source-condition; Fire / Wands supplies ignition, activation, will entering action. This sense emphasizes the locked derivation: Judgment / Aeon is primal fire entering the field of identity: what was latent is activated, what was sealed is opened by heat, and prior form is consumed into a new event."
        },
        {
          "key": "awakening",
          "label": "Awakening",
          "panel_phrase": "Awakening",
          "relationship_phrase": "Heat brings the hidden field alive.",
          "ingredient_justification": "Shin supplies fire, ignition, transformation, animation, consuming prior form; Mother-letter class supplies primal field, root element, source-condition; Fire / Wands supplies ignition, activation, will entering action. This sense emphasizes the locked derivation: Judgment / Aeon is primal fire entering the field of identity: what was latent is activated, what was sealed is opened by heat, and prior form is consumed into a new event."
        }
      ]
    },
    {
      "card_id": "the_emperor",
      "name": "The Emperor",
      "group": "Simple Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "visible_force",
      "ingredients": [
        {
          "ref": "heh",
          "name": "Heh",
          "operation": "window, aperture, opening, breath made visible"
        },
        {
          "ref": "simple_letter_class",
          "name": "Simple-letter class",
          "operation": "single path, directed faculty, zodiacal mode"
        },
        {
          "ref": "aries",
          "name": "Aries",
          "operation": "emergence, initiation, direct beginning, cardinal fire"
        }
      ],
      "locked_relphi_interpretation": "The Emperor, in the Heh-Aries layer, is initiation seen through an opening: first force made visible, direct emergence through a threshold, and action appearing as form.",
      "senses": [
        {
          "key": "visible_force",
          "label": "First force visible",
          "panel_phrase": "First force visible",
          "relationship_phrase": "Action appears through a threshold.",
          "ingredient_justification": "Heh supplies window, aperture, opening, breath made visible; Simple-letter class supplies single path, directed faculty, zodiacal mode; Aries supplies emergence, initiation, direct beginning, cardinal fire. This sense emphasizes the locked derivation: The Emperor, in the Heh-Aries layer, is initiation seen through an opening: first force made visible, direct emergence through a threshold, and action appearing as form."
        },
        {
          "key": "authority",
          "label": "Authority",
          "panel_phrase": "Authority",
          "relationship_phrase": "A direct organizing force is present.",
          "ingredient_justification": "Heh supplies window, aperture, opening, breath made visible; Simple-letter class supplies single path, directed faculty, zodiacal mode; Aries supplies emergence, initiation, direct beginning, cardinal fire. This sense emphasizes the locked derivation: The Emperor, in the Heh-Aries layer, is initiation seen through an opening: first force made visible, direct emergence through a threshold, and action appearing as form."
        },
        {
          "key": "initiation",
          "label": "Initiation",
          "panel_phrase": "Initiation",
          "relationship_phrase": "The situation begins through decisive emergence.",
          "ingredient_justification": "Heh supplies window, aperture, opening, breath made visible; Simple-letter class supplies single path, directed faculty, zodiacal mode; Aries supplies emergence, initiation, direct beginning, cardinal fire. This sense emphasizes the locked derivation: The Emperor, in the Heh-Aries layer, is initiation seen through an opening: first force made visible, direct emergence through a threshold, and action appearing as form."
        },
        {
          "key": "territory",
          "label": "Territory",
          "panel_phrase": "Territory",
          "relationship_phrase": "The boundaries of action need to be visible.",
          "ingredient_justification": "Heh supplies window, aperture, opening, breath made visible; Simple-letter class supplies single path, directed faculty, zodiacal mode; Aries supplies emergence, initiation, direct beginning, cardinal fire. This sense emphasizes the locked derivation: The Emperor, in the Heh-Aries layer, is initiation seen through an opening: first force made visible, direct emergence through a threshold, and action appearing as form."
        }
      ]
    },
    {
      "card_id": "the_hierophant",
      "name": "The Hierophant",
      "group": "Simple Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "continuity",
      "ingredients": [
        {
          "ref": "vav",
          "name": "Vav",
          "operation": "hook, joining, connection, fastening"
        },
        {
          "ref": "simple_letter_class",
          "name": "Simple-letter class",
          "operation": "single path, directed faculty, zodiacal mode"
        },
        {
          "ref": "taurus",
          "name": "Taurus",
          "operation": "possession, embodiment, value, persistence, fixed earth"
        }
      ],
      "locked_relphi_interpretation": "The Hierophant is connection fixed into embodied continuity: value is preserved by attachment, transmission is made durable, and the joining principle holds form in place.",
      "senses": [
        {
          "key": "continuity",
          "label": "Embodied continuity",
          "panel_phrase": "Embodied continuity",
          "relationship_phrase": "The bond continues through structure or tradition.",
          "ingredient_justification": "Vav supplies hook, joining, connection, fastening; Simple-letter class supplies single path, directed faculty, zodiacal mode; Taurus supplies possession, embodiment, value, persistence, fixed earth. This sense emphasizes the locked derivation: The Hierophant is connection fixed into embodied continuity: value is preserved by attachment, transmission is made durable, and the joining principle holds form in place."
        },
        {
          "key": "transmission",
          "label": "Transmission",
          "panel_phrase": "Transmission",
          "relationship_phrase": "A teaching, rule, or value is being passed on.",
          "ingredient_justification": "Vav supplies hook, joining, connection, fastening; Simple-letter class supplies single path, directed faculty, zodiacal mode; Taurus supplies possession, embodiment, value, persistence, fixed earth. This sense emphasizes the locked derivation: The Hierophant is connection fixed into embodied continuity: value is preserved by attachment, transmission is made durable, and the joining principle holds form in place."
        },
        {
          "key": "attachment",
          "label": "Fixed attachment",
          "panel_phrase": "Fixed attachment",
          "relationship_phrase": "Connection is made durable.",
          "ingredient_justification": "Vav supplies hook, joining, connection, fastening; Simple-letter class supplies single path, directed faculty, zodiacal mode; Taurus supplies possession, embodiment, value, persistence, fixed earth. This sense emphasizes the locked derivation: The Hierophant is connection fixed into embodied continuity: value is preserved by attachment, transmission is made durable, and the joining principle holds form in place."
        },
        {
          "key": "preserved_value",
          "label": "Preserved value",
          "panel_phrase": "Preserved value",
          "relationship_phrase": "What matters is protected by form.",
          "ingredient_justification": "Vav supplies hook, joining, connection, fastening; Simple-letter class supplies single path, directed faculty, zodiacal mode; Taurus supplies possession, embodiment, value, persistence, fixed earth. This sense emphasizes the locked derivation: The Hierophant is connection fixed into embodied continuity: value is preserved by attachment, transmission is made durable, and the joining principle holds form in place."
        }
      ]
    },
    {
      "card_id": "the_lovers",
      "name": "The Lovers",
      "group": "Simple Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "choice",
      "ingredients": [
        {
          "ref": "zayin",
          "name": "Zayin",
          "operation": "sword, division, distinction, cutting, choosing"
        },
        {
          "ref": "simple_letter_class",
          "name": "Simple-letter class",
          "operation": "single path, directed faculty, zodiacal mode"
        },
        {
          "ref": "gemini",
          "name": "Gemini",
          "operation": "branching, naming, multiplicity, exchange, mutable air"
        }
      ],
      "locked_relphi_interpretation": "The Lovers is distinction inside multiplicity: the sword creates choice, the path branches, and relation is formed through separation, naming, and exchange.",
      "senses": [
        {
          "key": "choice",
          "label": "Choice through distinction",
          "panel_phrase": "Choice through distinction",
          "relationship_phrase": "A choice forms by naming differences.",
          "ingredient_justification": "Zayin supplies sword, division, distinction, cutting, choosing; Simple-letter class supplies single path, directed faculty, zodiacal mode; Gemini supplies branching, naming, multiplicity, exchange, mutable air. This sense emphasizes the locked derivation: The Lovers is distinction inside multiplicity: the sword creates choice, the path branches, and relation is formed through separation, naming, and exchange."
        },
        {
          "key": "branching",
          "label": "Branching relation",
          "panel_phrase": "Branching relation",
          "relationship_phrase": "Relation creates more than one path.",
          "ingredient_justification": "Zayin supplies sword, division, distinction, cutting, choosing; Simple-letter class supplies single path, directed faculty, zodiacal mode; Gemini supplies branching, naming, multiplicity, exchange, mutable air. This sense emphasizes the locked derivation: The Lovers is distinction inside multiplicity: the sword creates choice, the path branches, and relation is formed through separation, naming, and exchange."
        },
        {
          "key": "exchange",
          "label": "Relating through exchange",
          "panel_phrase": "Relating through exchange",
          "relationship_phrase": "Speech and multiplicity shape the bond.",
          "ingredient_justification": "Zayin supplies sword, division, distinction, cutting, choosing; Simple-letter class supplies single path, directed faculty, zodiacal mode; Gemini supplies branching, naming, multiplicity, exchange, mutable air. This sense emphasizes the locked derivation: The Lovers is distinction inside multiplicity: the sword creates choice, the path branches, and relation is formed through separation, naming, and exchange."
        },
        {
          "key": "separation_relation",
          "label": "Relation through separation",
          "panel_phrase": "Relation through separation",
          "relationship_phrase": "Difference is part of the connection.",
          "ingredient_justification": "Zayin supplies sword, division, distinction, cutting, choosing; Simple-letter class supplies single path, directed faculty, zodiacal mode; Gemini supplies branching, naming, multiplicity, exchange, mutable air. This sense emphasizes the locked derivation: The Lovers is distinction inside multiplicity: the sword creates choice, the path branches, and relation is formed through separation, naming, and exchange."
        }
      ]
    },
    {
      "card_id": "the_chariot",
      "name": "The Chariot",
      "group": "Simple Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "protected_movement",
      "ingredients": [
        {
          "ref": "cheth",
          "name": "Cheth",
          "operation": "fence, enclosure, boundary, contained passage"
        },
        {
          "ref": "simple_letter_class",
          "name": "Simple-letter class",
          "operation": "single path, directed faculty, zodiacal mode"
        },
        {
          "ref": "cancer",
          "name": "Cancer",
          "operation": "care, belonging, protection, home, cardinal water"
        }
      ],
      "locked_relphi_interpretation": "The Chariot is protected movement: feeling is carried inside an enclosure, belonging creates a vehicle, and care moves forward without abandoning its boundary.",
      "senses": [
        {
          "key": "protected_movement",
          "label": "Protected movement",
          "panel_phrase": "Protected movement",
          "relationship_phrase": "Move forward without abandoning your boundary.",
          "ingredient_justification": "Cheth supplies fence, enclosure, boundary, contained passage; Simple-letter class supplies single path, directed faculty, zodiacal mode; Cancer supplies care, belonging, protection, home, cardinal water. This sense emphasizes the locked derivation: The Chariot is protected movement: feeling is carried inside an enclosure, belonging creates a vehicle, and care moves forward without abandoning its boundary."
        },
        {
          "key": "vehicle",
          "label": "Care as vehicle",
          "panel_phrase": "Care as vehicle",
          "relationship_phrase": "Belonging carries the motion.",
          "ingredient_justification": "Cheth supplies fence, enclosure, boundary, contained passage; Simple-letter class supplies single path, directed faculty, zodiacal mode; Cancer supplies care, belonging, protection, home, cardinal water. This sense emphasizes the locked derivation: The Chariot is protected movement: feeling is carried inside an enclosure, belonging creates a vehicle, and care moves forward without abandoning its boundary."
        },
        {
          "key": "contained_feeling",
          "label": "Contained feeling",
          "panel_phrase": "Contained feeling",
          "relationship_phrase": "Emotion needs an enclosure to move safely.",
          "ingredient_justification": "Cheth supplies fence, enclosure, boundary, contained passage; Simple-letter class supplies single path, directed faculty, zodiacal mode; Cancer supplies care, belonging, protection, home, cardinal water. This sense emphasizes the locked derivation: The Chariot is protected movement: feeling is carried inside an enclosure, belonging creates a vehicle, and care moves forward without abandoning its boundary."
        },
        {
          "key": "direction_with_boundary",
          "label": "Direction with boundary",
          "panel_phrase": "Direction with boundary",
          "relationship_phrase": "The path requires both movement and protection.",
          "ingredient_justification": "Cheth supplies fence, enclosure, boundary, contained passage; Simple-letter class supplies single path, directed faculty, zodiacal mode; Cancer supplies care, belonging, protection, home, cardinal water. This sense emphasizes the locked derivation: The Chariot is protected movement: feeling is carried inside an enclosure, belonging creates a vehicle, and care moves forward without abandoning its boundary."
        }
      ]
    },
    {
      "card_id": "strength",
      "name": "Strength / Lust",
      "group": "Simple Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "governed_vitality",
      "ingredients": [
        {
          "ref": "teth",
          "name": "Teth",
          "operation": "serpent, coil, contained vitality, living force held in tension"
        },
        {
          "ref": "simple_letter_class",
          "name": "Simple-letter class",
          "operation": "single path, directed faculty, zodiacal mode"
        },
        {
          "ref": "leo",
          "name": "Leo",
          "operation": "expression, radiance, visibility, fixed fire"
        }
      ],
      "locked_relphi_interpretation": "Strength / Lust is living force held in radiant expression: instinct is not erased, fire is sustained, and vitality is governed from within.",
      "senses": [
        {
          "key": "governed_vitality",
          "label": "Governed vitality",
          "panel_phrase": "Governed vitality",
          "relationship_phrase": "Instinct is alive and guided from within.",
          "ingredient_justification": "Teth supplies serpent, coil, contained vitality, living force held in tension; Simple-letter class supplies single path, directed faculty, zodiacal mode; Leo supplies expression, radiance, visibility, fixed fire. This sense emphasizes the locked derivation: Strength / Lust is living force held in radiant expression: instinct is not erased, fire is sustained, and vitality is governed from within."
        },
        {
          "key": "sustained_fire",
          "label": "Sustained fire",
          "panel_phrase": "Sustained fire",
          "relationship_phrase": "Desire remains warm without burning out.",
          "ingredient_justification": "Teth supplies serpent, coil, contained vitality, living force held in tension; Simple-letter class supplies single path, directed faculty, zodiacal mode; Leo supplies expression, radiance, visibility, fixed fire. This sense emphasizes the locked derivation: Strength / Lust is living force held in radiant expression: instinct is not erased, fire is sustained, and vitality is governed from within."
        },
        {
          "key": "inner_rule",
          "label": "Inner rule",
          "panel_phrase": "Inner rule",
          "relationship_phrase": "Strength comes from inner governance.",
          "ingredient_justification": "Teth supplies serpent, coil, contained vitality, living force held in tension; Simple-letter class supplies single path, directed faculty, zodiacal mode; Leo supplies expression, radiance, visibility, fixed fire. This sense emphasizes the locked derivation: Strength / Lust is living force held in radiant expression: instinct is not erased, fire is sustained, and vitality is governed from within."
        },
        {
          "key": "living_force",
          "label": "Living force",
          "panel_phrase": "Living force",
          "relationship_phrase": "Vitality is not the problem; its expression is the question.",
          "ingredient_justification": "Teth supplies serpent, coil, contained vitality, living force held in tension; Simple-letter class supplies single path, directed faculty, zodiacal mode; Leo supplies expression, radiance, visibility, fixed fire. This sense emphasizes the locked derivation: Strength / Lust is living force held in radiant expression: instinct is not erased, fire is sustained, and vitality is governed from within."
        }
      ]
    },
    {
      "card_id": "the_hermit",
      "name": "The Hermit",
      "group": "Simple Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "refined_attention",
      "ingredients": [
        {
          "ref": "yod",
          "name": "Yod",
          "operation": "hand, seed-point, smallest active mark, touch"
        },
        {
          "ref": "simple_letter_class",
          "name": "Simple-letter class",
          "operation": "single path, directed faculty, zodiacal mode"
        },
        {
          "ref": "virgo",
          "name": "Virgo",
          "operation": "refinement, sorting, repair, service, mutable earth"
        }
      ],
      "locked_relphi_interpretation": "The Hermit is the seed-point of refined attention: the hand works in detail, matter is examined carefully, and useful light is carried through precision.",
      "senses": [
        {
          "key": "refined_attention",
          "label": "Refined attention",
          "panel_phrase": "Refined attention",
          "relationship_phrase": "The answer is in careful detail.",
          "ingredient_justification": "Yod supplies hand, seed-point, smallest active mark, touch; Simple-letter class supplies single path, directed faculty, zodiacal mode; Virgo supplies refinement, sorting, repair, service, mutable earth. This sense emphasizes the locked derivation: The Hermit is the seed-point of refined attention: the hand works in detail, matter is examined carefully, and useful light is carried through precision."
        },
        {
          "key": "useful_light",
          "label": "Useful light",
          "panel_phrase": "Useful light",
          "relationship_phrase": "A small light is enough if carried precisely.",
          "ingredient_justification": "Yod supplies hand, seed-point, smallest active mark, touch; Simple-letter class supplies single path, directed faculty, zodiacal mode; Virgo supplies refinement, sorting, repair, service, mutable earth. This sense emphasizes the locked derivation: The Hermit is the seed-point of refined attention: the hand works in detail, matter is examined carefully, and useful light is carried through precision."
        },
        {
          "key": "private_work",
          "label": "Private work",
          "panel_phrase": "Private work",
          "relationship_phrase": "Withdraw to examine what matters.",
          "ingredient_justification": "Yod supplies hand, seed-point, smallest active mark, touch; Simple-letter class supplies single path, directed faculty, zodiacal mode; Virgo supplies refinement, sorting, repair, service, mutable earth. This sense emphasizes the locked derivation: The Hermit is the seed-point of refined attention: the hand works in detail, matter is examined carefully, and useful light is carried through precision."
        },
        {
          "key": "seed_detail",
          "label": "Seed-point of detail",
          "panel_phrase": "Seed-point of detail",
          "relationship_phrase": "The smallest useful thing may guide the whole.",
          "ingredient_justification": "Yod supplies hand, seed-point, smallest active mark, touch; Simple-letter class supplies single path, directed faculty, zodiacal mode; Virgo supplies refinement, sorting, repair, service, mutable earth. This sense emphasizes the locked derivation: The Hermit is the seed-point of refined attention: the hand works in detail, matter is examined carefully, and useful light is carried through precision."
        }
      ]
    },
    {
      "card_id": "justice",
      "name": "Justice / Adjustment",
      "group": "Simple Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "measure",
      "ingredients": [
        {
          "ref": "lamed",
          "name": "Lamed",
          "operation": "ox-goad, instruction, correction, steering, directed pressure"
        },
        {
          "ref": "simple_letter_class",
          "name": "Simple-letter class",
          "operation": "single path, directed faculty, zodiacal mode"
        },
        {
          "ref": "libra",
          "name": "Libra",
          "operation": "balance, relation, measure, reciprocity, cardinal air"
        }
      ],
      "locked_relphi_interpretation": "Justice / Adjustment is guided correction through measure: relation is weighed, pressure is applied with proportion, and the path is brought back into balance.",
      "senses": [
        {
          "key": "measure",
          "label": "Measured correction",
          "panel_phrase": "Measured correction",
          "relationship_phrase": "The relation needs proportion.",
          "ingredient_justification": "Lamed supplies ox-goad, instruction, correction, steering, directed pressure; Simple-letter class supplies single path, directed faculty, zodiacal mode; Libra supplies balance, relation, measure, reciprocity, cardinal air. This sense emphasizes the locked derivation: Justice / Adjustment is guided correction through measure: relation is weighed, pressure is applied with proportion, and the path is brought back into balance."
        },
        {
          "key": "balance",
          "label": "Balance through pressure",
          "panel_phrase": "Balance through pressure",
          "relationship_phrase": "Pressure must be applied with care.",
          "ingredient_justification": "Lamed supplies ox-goad, instruction, correction, steering, directed pressure; Simple-letter class supplies single path, directed faculty, zodiacal mode; Libra supplies balance, relation, measure, reciprocity, cardinal air. This sense emphasizes the locked derivation: Justice / Adjustment is guided correction through measure: relation is weighed, pressure is applied with proportion, and the path is brought back into balance."
        },
        {
          "key": "accounting",
          "label": "Accounting",
          "panel_phrase": "Accounting",
          "relationship_phrase": "Weigh what happened and what follows.",
          "ingredient_justification": "Lamed supplies ox-goad, instruction, correction, steering, directed pressure; Simple-letter class supplies single path, directed faculty, zodiacal mode; Libra supplies balance, relation, measure, reciprocity, cardinal air. This sense emphasizes the locked derivation: Justice / Adjustment is guided correction through measure: relation is weighed, pressure is applied with proportion, and the path is brought back into balance."
        },
        {
          "key": "adjustment",
          "label": "Adjustment",
          "panel_phrase": "Adjustment",
          "relationship_phrase": "The path can be brought back into balance.",
          "ingredient_justification": "Lamed supplies ox-goad, instruction, correction, steering, directed pressure; Simple-letter class supplies single path, directed faculty, zodiacal mode; Libra supplies balance, relation, measure, reciprocity, cardinal air. This sense emphasizes the locked derivation: Justice / Adjustment is guided correction through measure: relation is weighed, pressure is applied with proportion, and the path is brought back into balance."
        }
      ]
    },
    {
      "card_id": "death",
      "name": "Death",
      "group": "Simple Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "transformation",
      "ingredients": [
        {
          "ref": "nun",
          "name": "Nun",
          "operation": "fish, life beneath the surface, movement through depth, hidden continuity"
        },
        {
          "ref": "simple_letter_class",
          "name": "Simple-letter class",
          "operation": "single path, directed faculty, zodiacal mode"
        },
        {
          "ref": "scorpio",
          "name": "Scorpio",
          "operation": "intensification, binding, concealment, depth, fixed water"
        }
      ],
      "locked_relphi_interpretation": "Death is hidden life moving through deep change: form is pressured below the surface, continuity survives through transformation, and the visible shape is not the whole life.",
      "senses": [
        {
          "key": "transformation",
          "label": "Hidden change",
          "panel_phrase": "Hidden change",
          "relationship_phrase": "The visible form is not the whole life of it.",
          "ingredient_justification": "Nun supplies fish, life beneath the surface, movement through depth, hidden continuity; Simple-letter class supplies single path, directed faculty, zodiacal mode; Scorpio supplies intensification, binding, concealment, depth, fixed water. This sense emphasizes the locked derivation: Death is hidden life moving through deep change: form is pressured below the surface, continuity survives through transformation, and the visible shape is not the whole life."
        },
        {
          "key": "cut_off",
          "label": "Cut off",
          "panel_phrase": "Cut off",
          "relationship_phrase": "Something is removed, reduced, buried, or ended.",
          "ingredient_justification": "Nun supplies fish, life beneath the surface, movement through depth, hidden continuity; Simple-letter class supplies single path, directed faculty, zodiacal mode; Scorpio supplies intensification, binding, concealment, depth, fixed water. This sense emphasizes the locked derivation: Death is hidden life moving through deep change: form is pressured below the surface, continuity survives through transformation, and the visible shape is not the whole life."
        },
        {
          "key": "continuity_below",
          "label": "Continuity below",
          "panel_phrase": "Continuity below",
          "relationship_phrase": "Life continues below the old shape.",
          "ingredient_justification": "Nun supplies fish, life beneath the surface, movement through depth, hidden continuity; Simple-letter class supplies single path, directed faculty, zodiacal mode; Scorpio supplies intensification, binding, concealment, depth, fixed water. This sense emphasizes the locked derivation: Death is hidden life moving through deep change: form is pressured below the surface, continuity survives through transformation, and the visible shape is not the whole life."
        },
        {
          "key": "deep_pressure",
          "label": "Deep pressure",
          "panel_phrase": "Deep pressure",
          "relationship_phrase": "Change is happening under the surface.",
          "ingredient_justification": "Nun supplies fish, life beneath the surface, movement through depth, hidden continuity; Simple-letter class supplies single path, directed faculty, zodiacal mode; Scorpio supplies intensification, binding, concealment, depth, fixed water. This sense emphasizes the locked derivation: Death is hidden life moving through deep change: form is pressured below the surface, continuity survives through transformation, and the visible shape is not the whole life."
        }
      ]
    },
    {
      "card_id": "temperance",
      "name": "Temperance / Art",
      "group": "Simple Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "mixing_path",
      "ingredients": [
        {
          "ref": "samekh",
          "name": "Samekh",
          "operation": "support, prop, sustaining structure, bearing up"
        },
        {
          "ref": "simple_letter_class",
          "name": "Simple-letter class",
          "operation": "single path, directed faculty, zodiacal mode"
        },
        {
          "ref": "sagittarius",
          "name": "Sagittarius",
          "operation": "aim, horizon, trajectory, mutable fire"
        }
      ],
      "locked_relphi_interpretation": "Temperance / Art is supported trajectory: fire is given a sustaining structure, direction is carried across distance, and the path is upheld while it moves toward meaning.",
      "senses": [
        {
          "key": "mixing_path",
          "label": "Supported trajectory",
          "panel_phrase": "Supported trajectory",
          "relationship_phrase": "The path needs sustaining structure.",
          "ingredient_justification": "Samekh supplies support, prop, sustaining structure, bearing up; Simple-letter class supplies single path, directed faculty, zodiacal mode; Sagittarius supplies aim, horizon, trajectory, mutable fire. This sense emphasizes the locked derivation: Temperance / Art is supported trajectory: fire is given a sustaining structure, direction is carried across distance, and the path is upheld while it moves toward meaning."
        },
        {
          "key": "right_mixture",
          "label": "Right mixture",
          "panel_phrase": "Right mixture",
          "relationship_phrase": "Different elements must be combined carefully.",
          "ingredient_justification": "Samekh supplies support, prop, sustaining structure, bearing up; Simple-letter class supplies single path, directed faculty, zodiacal mode; Sagittarius supplies aim, horizon, trajectory, mutable fire. This sense emphasizes the locked derivation: Temperance / Art is supported trajectory: fire is given a sustaining structure, direction is carried across distance, and the path is upheld while it moves toward meaning."
        },
        {
          "key": "carried_direction",
          "label": "Carried direction",
          "panel_phrase": "Carried direction",
          "relationship_phrase": "Movement is upheld across distance.",
          "ingredient_justification": "Samekh supplies support, prop, sustaining structure, bearing up; Simple-letter class supplies single path, directed faculty, zodiacal mode; Sagittarius supplies aim, horizon, trajectory, mutable fire. This sense emphasizes the locked derivation: Temperance / Art is supported trajectory: fire is given a sustaining structure, direction is carried across distance, and the path is upheld while it moves toward meaning."
        },
        {
          "key": "artful_balance",
          "label": "Artful balance",
          "panel_phrase": "Artful balance",
          "relationship_phrase": "The solution is craft, proportion, and timing.",
          "ingredient_justification": "Samekh supplies support, prop, sustaining structure, bearing up; Simple-letter class supplies single path, directed faculty, zodiacal mode; Sagittarius supplies aim, horizon, trajectory, mutable fire. This sense emphasizes the locked derivation: Temperance / Art is supported trajectory: fire is given a sustaining structure, direction is carried across distance, and the path is upheld while it moves toward meaning."
        }
      ]
    },
    {
      "card_id": "the_devil",
      "name": "The Devil",
      "group": "Simple Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "capture",
      "ingredients": [
        {
          "ref": "ayin",
          "name": "Ayin",
          "operation": "eye, appearance, perception, visible surface, seeing and being seen"
        },
        {
          "ref": "simple_letter_class",
          "name": "Simple-letter class",
          "operation": "single path, directed faculty, zodiacal mode"
        },
        {
          "ref": "capricorn",
          "name": "Capricorn",
          "operation": "structure, ascent, obligation, discipline, cardinal earth"
        }
      ],
      "locked_relphi_interpretation": "The Devil is perception fixed into material structure: what is seen gains weight, desire is caught in form, and the visible surface binds attention to constraint.",
      "senses": [
        {
          "key": "capture",
          "label": "Perceptual capture",
          "panel_phrase": "Perceptual capture",
          "relationship_phrase": "Attention is bound to the visible surface.",
          "ingredient_justification": "Ayin supplies eye, appearance, perception, visible surface, seeing and being seen; Simple-letter class supplies single path, directed faculty, zodiacal mode; Capricorn supplies structure, ascent, obligation, discipline, cardinal earth. This sense emphasizes the locked derivation: The Devil is perception fixed into material structure: what is seen gains weight, desire is caught in form, and the visible surface binds attention to constraint."
        },
        {
          "key": "desire_in_form",
          "label": "Desire caught in form",
          "panel_phrase": "Desire caught in form",
          "relationship_phrase": "Desire has gained weight and constraint.",
          "ingredient_justification": "Ayin supplies eye, appearance, perception, visible surface, seeing and being seen; Simple-letter class supplies single path, directed faculty, zodiacal mode; Capricorn supplies structure, ascent, obligation, discipline, cardinal earth. This sense emphasizes the locked derivation: The Devil is perception fixed into material structure: what is seen gains weight, desire is caught in form, and the visible surface binds attention to constraint."
        },
        {
          "key": "material_binding",
          "label": "Material binding",
          "panel_phrase": "Material binding",
          "relationship_phrase": "The form itself holds the person in place.",
          "ingredient_justification": "Ayin supplies eye, appearance, perception, visible surface, seeing and being seen; Simple-letter class supplies single path, directed faculty, zodiacal mode; Capricorn supplies structure, ascent, obligation, discipline, cardinal earth. This sense emphasizes the locked derivation: The Devil is perception fixed into material structure: what is seen gains weight, desire is caught in form, and the visible surface binds attention to constraint."
        },
        {
          "key": "fixed_view",
          "label": "Fixed view",
          "panel_phrase": "Fixed view",
          "relationship_phrase": "What is seen may not be all that is true.",
          "ingredient_justification": "Ayin supplies eye, appearance, perception, visible surface, seeing and being seen; Simple-letter class supplies single path, directed faculty, zodiacal mode; Capricorn supplies structure, ascent, obligation, discipline, cardinal earth. This sense emphasizes the locked derivation: The Devil is perception fixed into material structure: what is seen gains weight, desire is caught in form, and the visible surface binds attention to constraint."
        }
      ]
    },
    {
      "card_id": "the_star",
      "name": "The Star",
      "group": "Simple Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "drawn_forth",
      "ingredients": [
        {
          "ref": "tzaddi",
          "name": "Tzaddi",
          "operation": "fishhook, drawing out, catching, pulling from depth into relation"
        },
        {
          "ref": "simple_letter_class",
          "name": "Simple-letter class",
          "operation": "single path, directed faculty, zodiacal mode"
        },
        {
          "ref": "aquarius",
          "name": "Aquarius",
          "operation": "pattern, group, abstraction, future-vision, fixed air"
        }
      ],
      "locked_relphi_interpretation": "The Star, in the Tzaddi-Aquarius layer, is what is drawn from depth into a future-facing pattern: hidden material is hooked into visibility, and the individual point is placed in a wider field.",
      "senses": [
        {
          "key": "drawn_forth",
          "label": "Drawn from depth",
          "panel_phrase": "Drawn from depth",
          "relationship_phrase": "Something hidden becomes a future pattern.",
          "ingredient_justification": "Tzaddi supplies fishhook, drawing out, catching, pulling from depth into relation; Simple-letter class supplies single path, directed faculty, zodiacal mode; Aquarius supplies pattern, group, abstraction, future-vision, fixed air. This sense emphasizes the locked derivation: The Star, in the Tzaddi-Aquarius layer, is what is drawn from depth into a future-facing pattern: hidden material is hooked into visibility, and the individual point is placed in a wider field."
        },
        {
          "key": "future_pattern",
          "label": "Future-facing pattern",
          "panel_phrase": "Future-facing pattern",
          "relationship_phrase": "The situation is organized by a possible future.",
          "ingredient_justification": "Tzaddi supplies fishhook, drawing out, catching, pulling from depth into relation; Simple-letter class supplies single path, directed faculty, zodiacal mode; Aquarius supplies pattern, group, abstraction, future-vision, fixed air. This sense emphasizes the locked derivation: The Star, in the Tzaddi-Aquarius layer, is what is drawn from depth into a future-facing pattern: hidden material is hooked into visibility, and the individual point is placed in a wider field."
        },
        {
          "key": "individual_signal",
          "label": "Individual signal",
          "panel_phrase": "Individual signal",
          "relationship_phrase": "A singular sign appears within the larger field.",
          "ingredient_justification": "Tzaddi supplies fishhook, drawing out, catching, pulling from depth into relation; Simple-letter class supplies single path, directed faculty, zodiacal mode; Aquarius supplies pattern, group, abstraction, future-vision, fixed air. This sense emphasizes the locked derivation: The Star, in the Tzaddi-Aquarius layer, is what is drawn from depth into a future-facing pattern: hidden material is hooked into visibility, and the individual point is placed in a wider field."
        },
        {
          "key": "hope_as_pattern",
          "label": "Hope as pattern",
          "panel_phrase": "Hope as pattern",
          "relationship_phrase": "Hope becomes useful when it gives shape.",
          "ingredient_justification": "Tzaddi supplies fishhook, drawing out, catching, pulling from depth into relation; Simple-letter class supplies single path, directed faculty, zodiacal mode; Aquarius supplies pattern, group, abstraction, future-vision, fixed air. This sense emphasizes the locked derivation: The Star, in the Tzaddi-Aquarius layer, is what is drawn from depth into a future-facing pattern: hidden material is hooked into visibility, and the individual point is placed in a wider field."
        }
      ]
    },
    {
      "card_id": "the_moon",
      "name": "The Moon",
      "group": "Simple Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "hidden_perception",
      "ingredients": [
        {
          "ref": "qoph",
          "name": "Qoph",
          "operation": "back of the head, hidden perception, dream-image, what is behind awareness"
        },
        {
          "ref": "simple_letter_class",
          "name": "Simple-letter class",
          "operation": "single path, directed faculty, zodiacal mode"
        },
        {
          "ref": "pisces",
          "name": "Pisces",
          "operation": "dissolution, permeability, surrender, oceanic feeling, mutable water"
        }
      ],
      "locked_relphi_interpretation": "The Moon is hidden perception inside dissolution: awareness receives images from behind itself, boundaries soften, and the field moves through dream, echo, and permeability.",
      "senses": [
        {
          "key": "hidden_perception",
          "label": "Hidden perception",
          "panel_phrase": "Hidden perception",
          "relationship_phrase": "Images arrive from behind ordinary awareness.",
          "ingredient_justification": "Qoph supplies back of the head, hidden perception, dream-image, what is behind awareness; Simple-letter class supplies single path, directed faculty, zodiacal mode; Pisces supplies dissolution, permeability, surrender, oceanic feeling, mutable water. This sense emphasizes the locked derivation: The Moon is hidden perception inside dissolution: awareness receives images from behind itself, boundaries soften, and the field moves through dream, echo, and permeability."
        },
        {
          "key": "dream_field",
          "label": "Dream field",
          "panel_phrase": "Dream field",
          "relationship_phrase": "Boundary softens and symbols move.",
          "ingredient_justification": "Qoph supplies back of the head, hidden perception, dream-image, what is behind awareness; Simple-letter class supplies single path, directed faculty, zodiacal mode; Pisces supplies dissolution, permeability, surrender, oceanic feeling, mutable water. This sense emphasizes the locked derivation: The Moon is hidden perception inside dissolution: awareness receives images from behind itself, boundaries soften, and the field moves through dream, echo, and permeability."
        },
        {
          "key": "echo",
          "label": "Echo and uncertainty",
          "panel_phrase": "Echo and uncertainty",
          "relationship_phrase": "The signal may be indirect.",
          "ingredient_justification": "Qoph supplies back of the head, hidden perception, dream-image, what is behind awareness; Simple-letter class supplies single path, directed faculty, zodiacal mode; Pisces supplies dissolution, permeability, surrender, oceanic feeling, mutable water. This sense emphasizes the locked derivation: The Moon is hidden perception inside dissolution: awareness receives images from behind itself, boundaries soften, and the field moves through dream, echo, and permeability."
        },
        {
          "key": "soft_boundary",
          "label": "Soft boundary",
          "panel_phrase": "Soft boundary",
          "relationship_phrase": "Do not demand hard edges from a permeable field.",
          "ingredient_justification": "Qoph supplies back of the head, hidden perception, dream-image, what is behind awareness; Simple-letter class supplies single path, directed faculty, zodiacal mode; Pisces supplies dissolution, permeability, surrender, oceanic feeling, mutable water. This sense emphasizes the locked derivation: The Moon is hidden perception inside dissolution: awareness receives images from behind itself, boundaries soften, and the field moves through dream, echo, and permeability."
        }
      ]
    },
    {
      "card_id": "the_magician",
      "name": "The Magician / Magus",
      "group": "Double Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "translation",
      "ingredients": [
        {
          "ref": "beth",
          "name": "Beth",
          "operation": "house, container, inside/outside, dwelling, enclosure"
        },
        {
          "ref": "double_letter_class",
          "name": "Double-letter class",
          "operation": "gate, hinge, alternation, polarity, passage between two states"
        },
        {
          "ref": "mercury",
          "name": "Mercury",
          "operation": "language, exchange, translation, movement, connection"
        }
      ],
      "locked_relphi_interpretation": "The first active crossing between inside and outside: speech, handling, exchange, and translation at the gate of manifestation.",
      "senses": [
        {
          "key": "translation",
          "label": "Translation at the gate",
          "panel_phrase": "Translation at the gate",
          "relationship_phrase": "Inside must become outside through words or handling.",
          "ingredient_justification": "Beth supplies house, container, inside/outside, dwelling, enclosure; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Mercury supplies language, exchange, translation, movement, connection. This sense emphasizes the locked derivation: The first active crossing between inside and outside: speech, handling, exchange, and translation at the gate of manifestation."
        },
        {
          "key": "skillful_handling",
          "label": "Skillful handling",
          "panel_phrase": "Skillful handling",
          "relationship_phrase": "Tools, speech, and exchange matter.",
          "ingredient_justification": "Beth supplies house, container, inside/outside, dwelling, enclosure; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Mercury supplies language, exchange, translation, movement, connection. This sense emphasizes the locked derivation: The first active crossing between inside and outside: speech, handling, exchange, and translation at the gate of manifestation."
        },
        {
          "key": "first_crossing",
          "label": "First active crossing",
          "panel_phrase": "First active crossing",
          "relationship_phrase": "A private intention crosses into manifest action.",
          "ingredient_justification": "Beth supplies house, container, inside/outside, dwelling, enclosure; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Mercury supplies language, exchange, translation, movement, connection. This sense emphasizes the locked derivation: The first active crossing between inside and outside: speech, handling, exchange, and translation at the gate of manifestation."
        },
        {
          "key": "naming",
          "label": "Naming makes it real",
          "panel_phrase": "Naming makes it real",
          "relationship_phrase": "What is named can be handled.",
          "ingredient_justification": "Beth supplies house, container, inside/outside, dwelling, enclosure; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Mercury supplies language, exchange, translation, movement, connection. This sense emphasizes the locked derivation: The first active crossing between inside and outside: speech, handling, exchange, and translation at the gate of manifestation."
        }
      ]
    },
    {
      "card_id": "the_high_priestess",
      "name": "The High Priestess / Priestess",
      "group": "Double Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "hidden_passage",
      "ingredients": [
        {
          "ref": "gimel",
          "name": "Gimel",
          "operation": "camel, crossing, carrying across distance, passage through emptiness"
        },
        {
          "ref": "double_letter_class",
          "name": "Double-letter class",
          "operation": "gate, hinge, alternation, polarity, passage between two states"
        },
        {
          "ref": "moon",
          "name": "Moon",
          "operation": "rhythm, memory, instinct, mood, protection, recurrence"
        }
      ],
      "locked_relphi_interpretation": "The High Priestess / Priestess is hidden passage through the lunar interval: memory carries awareness across silence, and rhythm preserves what cannot yet be spoken.",
      "senses": [
        {
          "key": "hidden_passage",
          "label": "Hidden passage",
          "panel_phrase": "Hidden passage",
          "relationship_phrase": "Something is moving silently beneath speech.",
          "ingredient_justification": "Gimel supplies camel, crossing, carrying across distance, passage through emptiness; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Moon supplies rhythm, memory, instinct, mood, protection, recurrence. This sense emphasizes the locked derivation: The High Priestess / Priestess is hidden passage through the lunar interval: memory carries awareness across silence, and rhythm preserves what cannot yet be spoken."
        },
        {
          "key": "memory_bridge",
          "label": "Memory bridge",
          "panel_phrase": "Memory bridge",
          "relationship_phrase": "Memory carries what cannot yet be spoken.",
          "ingredient_justification": "Gimel supplies camel, crossing, carrying across distance, passage through emptiness; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Moon supplies rhythm, memory, instinct, mood, protection, recurrence. This sense emphasizes the locked derivation: The High Priestess / Priestess is hidden passage through the lunar interval: memory carries awareness across silence, and rhythm preserves what cannot yet be spoken."
        },
        {
          "key": "silence",
          "label": "Protected silence",
          "panel_phrase": "Protected silence",
          "relationship_phrase": "The situation needs quiet perception.",
          "ingredient_justification": "Gimel supplies camel, crossing, carrying across distance, passage through emptiness; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Moon supplies rhythm, memory, instinct, mood, protection, recurrence. This sense emphasizes the locked derivation: The High Priestess / Priestess is hidden passage through the lunar interval: memory carries awareness across silence, and rhythm preserves what cannot yet be spoken."
        },
        {
          "key": "rhythm",
          "label": "Rhythm preserves it",
          "panel_phrase": "Rhythm preserves it",
          "relationship_phrase": "Timing and recurrence matter more than declaration.",
          "ingredient_justification": "Gimel supplies camel, crossing, carrying across distance, passage through emptiness; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Moon supplies rhythm, memory, instinct, mood, protection, recurrence. This sense emphasizes the locked derivation: The High Priestess / Priestess is hidden passage through the lunar interval: memory carries awareness across silence, and rhythm preserves what cannot yet be spoken."
        }
      ]
    },
    {
      "card_id": "the_empress",
      "name": "The Empress",
      "group": "Double Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "invitation",
      "ingredients": [
        {
          "ref": "daleth",
          "name": "Daleth",
          "operation": "door, threshold, opening, entry, passage between spaces"
        },
        {
          "ref": "double_letter_class",
          "name": "Double-letter class",
          "operation": "gate, hinge, alternation, polarity, passage between two states"
        },
        {
          "ref": "venus",
          "name": "Venus",
          "operation": "attraction, value, pleasure, coherence, joining"
        }
      ],
      "locked_relphi_interpretation": "The Empress is attraction at the door: value opens a passage, beauty admits relation, and coherence forms through invitation and reception.",
      "senses": [
        {
          "key": "invitation",
          "label": "Invitation",
          "panel_phrase": "Invitation",
          "relationship_phrase": "Value opens the door.",
          "ingredient_justification": "Daleth supplies door, threshold, opening, entry, passage between spaces; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Venus supplies attraction, value, pleasure, coherence, joining. This sense emphasizes the locked derivation: The Empress is attraction at the door: value opens a passage, beauty admits relation, and coherence forms through invitation and reception."
        },
        {
          "key": "receptive_growth",
          "label": "Receptive growth",
          "panel_phrase": "Receptive growth",
          "relationship_phrase": "Relation grows through welcome, beauty, and care.",
          "ingredient_justification": "Daleth supplies door, threshold, opening, entry, passage between spaces; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Venus supplies attraction, value, pleasure, coherence, joining. This sense emphasizes the locked derivation: The Empress is attraction at the door: value opens a passage, beauty admits relation, and coherence forms through invitation and reception."
        },
        {
          "key": "attraction",
          "label": "Attraction at the door",
          "panel_phrase": "Attraction at the door",
          "relationship_phrase": "What is desired creates passage.",
          "ingredient_justification": "Daleth supplies door, threshold, opening, entry, passage between spaces; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Venus supplies attraction, value, pleasure, coherence, joining. This sense emphasizes the locked derivation: The Empress is attraction at the door: value opens a passage, beauty admits relation, and coherence forms through invitation and reception."
        },
        {
          "key": "fertility",
          "label": "Generative field",
          "panel_phrase": "Generative field",
          "relationship_phrase": "The situation can grow if it is received.",
          "ingredient_justification": "Daleth supplies door, threshold, opening, entry, passage between spaces; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Venus supplies attraction, value, pleasure, coherence, joining. This sense emphasizes the locked derivation: The Empress is attraction at the door: value opens a passage, beauty admits relation, and coherence forms through invitation and reception."
        }
      ]
    },
    {
      "card_id": "wheel_of_fortune",
      "name": "Wheel of Fortune / Fortune",
      "group": "Double Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "turning",
      "ingredients": [
        {
          "ref": "kaph",
          "name": "Kaph",
          "operation": "palm, curve, grasp, receptacle, turning hand"
        },
        {
          "ref": "double_letter_class",
          "name": "Double-letter class",
          "operation": "gate, hinge, alternation, polarity, passage between two states"
        },
        {
          "ref": "jupiter",
          "name": "Jupiter",
          "operation": "expansion, increase, confidence, blessing, enlargement"
        }
      ],
      "locked_relphi_interpretation": "Wheel of Fortune / Fortune is increase held in a turning hand: expansion passes through alternation, and what is received may be turned, enlarged, offered, or released.",
      "senses": [
        {
          "key": "turning",
          "label": "Turning increase",
          "panel_phrase": "Turning increase",
          "relationship_phrase": "Expansion is moving through alternation.",
          "ingredient_justification": "Kaph supplies palm, curve, grasp, receptacle, turning hand; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Jupiter supplies expansion, increase, confidence, blessing, enlargement. This sense emphasizes the locked derivation: Wheel of Fortune / Fortune is increase held in a turning hand: expansion passes through alternation, and what is received may be turned, enlarged, offered, or released."
        },
        {
          "key": "received_changed",
          "label": "Received and turned",
          "panel_phrase": "Received and turned",
          "relationship_phrase": "What comes in may be enlarged or redirected.",
          "ingredient_justification": "Kaph supplies palm, curve, grasp, receptacle, turning hand; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Jupiter supplies expansion, increase, confidence, blessing, enlargement. This sense emphasizes the locked derivation: Wheel of Fortune / Fortune is increase held in a turning hand: expansion passes through alternation, and what is received may be turned, enlarged, offered, or released."
        },
        {
          "key": "cycle",
          "label": "Cycle",
          "panel_phrase": "Cycle",
          "relationship_phrase": "The situation changes by rotation, not straight force.",
          "ingredient_justification": "Kaph supplies palm, curve, grasp, receptacle, turning hand; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Jupiter supplies expansion, increase, confidence, blessing, enlargement. This sense emphasizes the locked derivation: Wheel of Fortune / Fortune is increase held in a turning hand: expansion passes through alternation, and what is received may be turned, enlarged, offered, or released."
        },
        {
          "key": "opportunity_motion",
          "label": "Opportunity in motion",
          "panel_phrase": "Opportunity in motion",
          "relationship_phrase": "The hand can turn what it receives.",
          "ingredient_justification": "Kaph supplies palm, curve, grasp, receptacle, turning hand; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Jupiter supplies expansion, increase, confidence, blessing, enlargement. This sense emphasizes the locked derivation: Wheel of Fortune / Fortune is increase held in a turning hand: expansion passes through alternation, and what is received may be turned, enlarged, offered, or released."
        }
      ]
    },
    {
      "card_id": "the_tower",
      "name": "The Tower",
      "group": "Double Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "rupture",
      "ingredients": [
        {
          "ref": "peh",
          "name": "Peh",
          "operation": "mouth, utterance, opening, force through speech"
        },
        {
          "ref": "double_letter_class",
          "name": "Double-letter class",
          "operation": "gate, hinge, alternation, polarity, passage between two states"
        },
        {
          "ref": "mars",
          "name": "Mars",
          "operation": "action, assertion, friction, cutting force"
        }
      ],
      "locked_relphi_interpretation": "The Tower is force through the mouth of the gate: pressure opens expression, the sealed structure is struck by utterance, and what was contained is forced outward.",
      "senses": [
        {
          "key": "rupture",
          "label": "Rupture",
          "panel_phrase": "Rupture",
          "relationship_phrase": "Pressure forces the sealed structure open.",
          "ingredient_justification": "Peh supplies mouth, utterance, opening, force through speech; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Mars supplies action, assertion, friction, cutting force. This sense emphasizes the locked derivation: The Tower is force through the mouth of the gate: pressure opens expression, the sealed structure is struck by utterance, and what was contained is forced outward."
        },
        {
          "key": "expression_struck",
          "label": "Expression struck open",
          "panel_phrase": "Expression struck open",
          "relationship_phrase": "What was contained is forced outward.",
          "ingredient_justification": "Peh supplies mouth, utterance, opening, force through speech; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Mars supplies action, assertion, friction, cutting force. This sense emphasizes the locked derivation: The Tower is force through the mouth of the gate: pressure opens expression, the sealed structure is struck by utterance, and what was contained is forced outward."
        },
        {
          "key": "shock",
          "label": "Shock",
          "panel_phrase": "Shock",
          "relationship_phrase": "Force enters through the gate and breaks containment.",
          "ingredient_justification": "Peh supplies mouth, utterance, opening, force through speech; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Mars supplies action, assertion, friction, cutting force. This sense emphasizes the locked derivation: The Tower is force through the mouth of the gate: pressure opens expression, the sealed structure is struck by utterance, and what was contained is forced outward."
        },
        {
          "key": "release",
          "label": "Forced release",
          "panel_phrase": "Forced release",
          "relationship_phrase": "Something hidden or held must come out.",
          "ingredient_justification": "Peh supplies mouth, utterance, opening, force through speech; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Mars supplies action, assertion, friction, cutting force. This sense emphasizes the locked derivation: The Tower is force through the mouth of the gate: pressure opens expression, the sealed structure is struck by utterance, and what was contained is forced outward."
        }
      ]
    },
    {
      "card_id": "the_sun",
      "name": "The Sun",
      "group": "Double Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "recognition",
      "ingredients": [
        {
          "ref": "resh",
          "name": "Resh",
          "operation": "head, face, front, beginning of conscious orientation"
        },
        {
          "ref": "double_letter_class",
          "name": "Double-letter class",
          "operation": "gate, hinge, alternation, polarity, passage between two states"
        },
        {
          "ref": "sun",
          "name": "Sun",
          "operation": "illumination, identity, vitality, central radiance"
        }
      ],
      "locked_relphi_interpretation": "The Sun is identity at the head of visibility: awareness faces forward, radiance crosses the inner/outer gate, and the center is openly recognized.",
      "senses": [
        {
          "key": "recognition",
          "label": "Open recognition",
          "panel_phrase": "Open recognition",
          "relationship_phrase": "The center becomes visible.",
          "ingredient_justification": "Resh supplies head, face, front, beginning of conscious orientation; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Sun supplies illumination, identity, vitality, central radiance. This sense emphasizes the locked derivation: The Sun is identity at the head of visibility: awareness faces forward, radiance crosses the inner/outer gate, and the center is openly recognized."
        },
        {
          "key": "radiance",
          "label": "Radiance",
          "panel_phrase": "Radiance",
          "relationship_phrase": "Identity shines across the inner and outer gate.",
          "ingredient_justification": "Resh supplies head, face, front, beginning of conscious orientation; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Sun supplies illumination, identity, vitality, central radiance. This sense emphasizes the locked derivation: The Sun is identity at the head of visibility: awareness faces forward, radiance crosses the inner/outer gate, and the center is openly recognized."
        },
        {
          "key": "facing_forward",
          "label": "Facing forward",
          "panel_phrase": "Facing forward",
          "relationship_phrase": "Awareness can meet the situation directly.",
          "ingredient_justification": "Resh supplies head, face, front, beginning of conscious orientation; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Sun supplies illumination, identity, vitality, central radiance. This sense emphasizes the locked derivation: The Sun is identity at the head of visibility: awareness faces forward, radiance crosses the inner/outer gate, and the center is openly recognized."
        },
        {
          "key": "vital_center",
          "label": "Vital center",
          "panel_phrase": "Vital center",
          "relationship_phrase": "Life, clarity, and identity organize the field.",
          "ingredient_justification": "Resh supplies head, face, front, beginning of conscious orientation; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Sun supplies illumination, identity, vitality, central radiance. This sense emphasizes the locked derivation: The Sun is identity at the head of visibility: awareness faces forward, radiance crosses the inner/outer gate, and the center is openly recognized."
        }
      ]
    },
    {
      "card_id": "the_world",
      "name": "The World / The Universe",
      "group": "Double Letters",
      "panel_prompt": "Select a sense",
      "allow_free_note": true,
      "default_sense_key": "completion",
      "ingredients": [
        {
          "ref": "tav",
          "name": "Tav",
          "operation": "mark, cross-mark, seal, signature, final sign"
        },
        {
          "ref": "double_letter_class",
          "name": "Double-letter class",
          "operation": "gate, hinge, alternation, polarity, passage between two states"
        },
        {
          "ref": "saturn",
          "name": "Saturn",
          "operation": "limit, compression, boundary, weight, consequence"
        }
      ],
      "locked_relphi_interpretation": "The World / The Universe is form sealed by limit: the mark records the boundary, consequence gives the whole its edge, and the completed sign is made legible.",
      "senses": [
        {
          "key": "completion",
          "label": "Completed sign",
          "panel_phrase": "Completed sign",
          "relationship_phrase": "The whole is legible now.",
          "ingredient_justification": "Tav supplies mark, cross-mark, seal, signature, final sign; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Saturn supplies limit, compression, boundary, weight, consequence. This sense emphasizes the locked derivation: The World / The Universe is form sealed by limit: the mark records the boundary, consequence gives the whole its edge, and the completed sign is made legible."
        },
        {
          "key": "sealed_form",
          "label": "Sealed form",
          "panel_phrase": "Sealed form",
          "relationship_phrase": "Boundary and consequence define the result.",
          "ingredient_justification": "Tav supplies mark, cross-mark, seal, signature, final sign; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Saturn supplies limit, compression, boundary, weight, consequence. This sense emphasizes the locked derivation: The World / The Universe is form sealed by limit: the mark records the boundary, consequence gives the whole its edge, and the completed sign is made legible."
        },
        {
          "key": "integration",
          "label": "Integration",
          "panel_phrase": "Integration",
          "relationship_phrase": "The pieces have become one marked whole.",
          "ingredient_justification": "Tav supplies mark, cross-mark, seal, signature, final sign; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Saturn supplies limit, compression, boundary, weight, consequence. This sense emphasizes the locked derivation: The World / The Universe is form sealed by limit: the mark records the boundary, consequence gives the whole its edge, and the completed sign is made legible."
        },
        {
          "key": "edge",
          "label": "The edge of the whole",
          "panel_phrase": "The edge of the whole",
          "relationship_phrase": "Limit gives the form meaning.",
          "ingredient_justification": "Tav supplies mark, cross-mark, seal, signature, final sign; Double-letter class supplies gate, hinge, alternation, polarity, passage between two states; Saturn supplies limit, compression, boundary, weight, consequence. This sense emphasizes the locked derivation: The World / The Universe is form sealed by limit: the mark records the boundary, consequence gives the whole its edge, and the completed sign is made legible."
        }
      ]
    }
  ]
};
