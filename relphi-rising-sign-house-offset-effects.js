window.RELPHI_RISING_SIGN_HOUSE_OFFSET_EFFECTS = {
  "schema": {
    "name": "Relphi Rising Sign House Offset Effects",
    "version": "1.0",
    "purpose": "Twelve rising-sign whole-sign-house variations showing sign-as-house descriptions, ingredients, and derivations.",
    "offsetDefinition": "Offset is the one-based rising sign number in this dataset, with Aries rising as offset one and Pisces rising as offset twelve. The Aries-rising baseline has symbolic displacement zero because each sign occupies its natural house.",
    "entryFields": [
      "id",
      "risingSign",
      "offsetSet",
      "symbolicDisplacementFromNatural",
      "houseNumber",
      "houseName",
      "sign",
      "title",
      "ingredients",
      "derivation",
      "description"
    ]
  },
  "signIngredients": {
    "Aries": {
      "signNumber": 1,
      "modality": "cardinal",
      "element": "fire",
      "ruler": "Mars",
      "rulerQualifier": "traditionally",
      "structure": "cardinal fire"
    },
    "Taurus": {
      "signNumber": 2,
      "modality": "fixed",
      "element": "earth",
      "ruler": "Venus",
      "rulerQualifier": null,
      "structure": "fixed earth"
    },
    "Gemini": {
      "signNumber": 3,
      "modality": "mutable",
      "element": "air",
      "ruler": "Mercury",
      "rulerQualifier": null,
      "structure": "mutable air"
    },
    "Cancer": {
      "signNumber": 4,
      "modality": "cardinal",
      "element": "water",
      "ruler": "Moon",
      "rulerQualifier": null,
      "structure": "cardinal water"
    },
    "Leo": {
      "signNumber": 5,
      "modality": "fixed",
      "element": "fire",
      "ruler": "Sun",
      "rulerQualifier": null,
      "structure": "fixed fire"
    },
    "Virgo": {
      "signNumber": 6,
      "modality": "mutable",
      "element": "earth",
      "ruler": "Mercury",
      "rulerQualifier": null,
      "structure": "mutable earth"
    },
    "Libra": {
      "signNumber": 7,
      "modality": "cardinal",
      "element": "air",
      "ruler": "Venus",
      "rulerQualifier": null,
      "structure": "cardinal air"
    },
    "Scorpio": {
      "signNumber": 8,
      "modality": "fixed",
      "element": "water",
      "ruler": "Mars",
      "rulerQualifier": "traditionally",
      "structure": "fixed water"
    },
    "Sagittarius": {
      "signNumber": 9,
      "modality": "mutable",
      "element": "fire",
      "ruler": "Jupiter",
      "rulerQualifier": null,
      "structure": "mutable fire"
    },
    "Capricorn": {
      "signNumber": 10,
      "modality": "cardinal",
      "element": "earth",
      "ruler": "Saturn",
      "rulerQualifier": null,
      "structure": "cardinal earth"
    },
    "Aquarius": {
      "signNumber": 11,
      "modality": "fixed",
      "element": "air",
      "ruler": "Saturn",
      "rulerQualifier": "traditionally",
      "structure": "fixed air"
    },
    "Pisces": {
      "signNumber": 12,
      "modality": "mutable",
      "element": "water",
      "ruler": "Jupiter",
      "rulerQualifier": "traditionally",
      "structure": "mutable water"
    }
  },
  "houseIngredients": {
    "house1": "self, body, appearance, identity, and immediate orientation",
    "house2": "resources, value, money, food, possession, and survival support",
    "house3": "speech, learning, siblings, neighbors, messages, and local movement",
    "house4": "home, roots, ancestry, foundation, memory, and belonging",
    "house5": "pleasure, play, creativity, romance, children, risk, and self-expression",
    "house6": "work, maintenance, service, health, routine, labor, and repair",
    "house7": "partnership, mirrors, agreements, contracts, equality, and the other",
    "house8": "intimacy, shared resources, debt, death, inheritance, and transformation",
    "house9": "belief, philosophy, travel, law, teaching, higher learning, and meaning",
    "house10": "vocation, public life, authority, visibility, achievement, and consequence",
    "house11": "community, friends, groups, hopes, networks, and shared futures",
    "house12": "solitude, retreat, hidden things, sorrow, dream, undoing, and release"
  },
  "entries": [
    {
      "id": "aries-rising-house-1-aries",
      "risingSign": "Aries",
      "offsetSet": 1,
      "symbolicDisplacementFromNatural": 0,
      "houseNumber": 1,
      "houseName": "House One",
      "sign": "Aries",
      "title": "Aries as House One",
      "ingredients": {
        "houseField": "self, body, appearance, identity, and immediate orientation",
        "signStructure": {
          "element": "fire",
          "modality": "cardinal",
          "combined": "cardinal fire"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House One supplies self, body, appearance, identity, and immediate orientation.",
        "signLayer": "Aries supplies cardinal fire.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "The self becomes cardinal fire: identity begins through action, initiative, courage, directness, and the impulse to emerge into the world. Mars rules the house, so the body and persona are organized through movement, assertion, challenge, and the need to act upon immediate circumstances."
      },
      "description": "The self becomes cardinal fire: identity begins through action, initiative, courage, directness, and the impulse to emerge into the world. Mars rules the house, so the body and persona are organized through movement, assertion, challenge, and the need to act upon immediate circumstances."
    },
    {
      "id": "aries-rising-house-2-taurus",
      "risingSign": "Aries",
      "offsetSet": 1,
      "symbolicDisplacementFromNatural": 0,
      "houseNumber": 2,
      "houseName": "House Two",
      "sign": "Taurus",
      "title": "Taurus as House Two",
      "ingredients": {
        "houseField": "resources, value, money, food, possession, and survival support",
        "signStructure": {
          "element": "earth",
          "modality": "fixed",
          "combined": "fixed earth"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Two supplies resources, value, money, food, possession, and survival support.",
        "signLayer": "Taurus supplies fixed earth.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "Resources become fixed earth: value settles into matter, possession, stability, nourishment, craft, and the cultivation of what can endure. Venus rules the house, so survival is organized through attraction, enjoyment, preservation, and the patient accumulation of things that support life."
      },
      "description": "Resources become fixed earth: value settles into matter, possession, stability, nourishment, craft, and the cultivation of what can endure. Venus rules the house, so survival is organized through attraction, enjoyment, preservation, and the patient accumulation of things that support life."
    },
    {
      "id": "aries-rising-house-3-gemini",
      "risingSign": "Aries",
      "offsetSet": 1,
      "symbolicDisplacementFromNatural": 0,
      "houseNumber": 3,
      "houseName": "House Three",
      "sign": "Gemini",
      "title": "Gemini as House Three",
      "ingredients": {
        "houseField": "speech, learning, siblings, neighbors, messages, and local movement",
        "signStructure": {
          "element": "air",
          "modality": "mutable",
          "combined": "mutable air"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Three supplies speech, learning, siblings, neighbors, messages, and local movement.",
        "signLayer": "Gemini supplies mutable air.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "Speech and local experience become mutable air: thought branches into questions, comparisons, conversations, messages, and short journeys of mind and body. Mercury rules the house, so learning is organized through naming, distinction, exchange, and the continual gathering and sharing of information."
      },
      "description": "Speech and local experience become mutable air: thought branches into questions, comparisons, conversations, messages, and short journeys of mind and body. Mercury rules the house, so learning is organized through naming, distinction, exchange, and the continual gathering and sharing of information."
    },
    {
      "id": "aries-rising-house-4-cancer",
      "risingSign": "Aries",
      "offsetSet": 1,
      "symbolicDisplacementFromNatural": 0,
      "houseNumber": 4,
      "houseName": "House Four",
      "sign": "Cancer",
      "title": "Cancer as House Four",
      "ingredients": {
        "houseField": "home, roots, ancestry, foundation, memory, and belonging",
        "signStructure": {
          "element": "water",
          "modality": "cardinal",
          "combined": "cardinal water"
        },
        "ruler": {
          "planet": "Moon",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Four supplies home, roots, ancestry, foundation, memory, and belonging.",
        "signLayer": "Cancer supplies cardinal water.",
        "rulerLayer": "Moon supplies the organizing mechanism.",
        "result": "Home becomes cardinal water: roots are established through feeling, memory, belonging, care, and the creation of emotional shelter. The Moon rules the house, so foundation is organized through rhythms of need, attachment, ancestry, and the instinct to protect what is vulnerable."
      },
      "description": "Home becomes cardinal water: roots are established through feeling, memory, belonging, care, and the creation of emotional shelter. The Moon rules the house, so foundation is organized through rhythms of need, attachment, ancestry, and the instinct to protect what is vulnerable."
    },
    {
      "id": "aries-rising-house-5-leo",
      "risingSign": "Aries",
      "offsetSet": 1,
      "symbolicDisplacementFromNatural": 0,
      "houseNumber": 5,
      "houseName": "House Five",
      "sign": "Leo",
      "title": "Leo as House Five",
      "ingredients": {
        "houseField": "pleasure, play, creativity, romance, children, risk, and self-expression",
        "signStructure": {
          "element": "fire",
          "modality": "fixed",
          "combined": "fixed fire"
        },
        "ruler": {
          "planet": "Sun",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Five supplies pleasure, play, creativity, romance, children, risk, and self-expression.",
        "signLayer": "Leo supplies fixed fire.",
        "rulerLayer": "Sun supplies the organizing mechanism.",
        "result": "Pleasure becomes fixed fire: creativity stabilizes as play, expression, celebration, romance, children, and the desire to radiate one's unique light. The Sun rules the house, so joy is organized through visibility, vitality, generosity, and the impulse to create from the heart."
      },
      "description": "Pleasure becomes fixed fire: creativity stabilizes as play, expression, celebration, romance, children, and the desire to radiate one's unique light. The Sun rules the house, so joy is organized through visibility, vitality, generosity, and the impulse to create from the heart."
    },
    {
      "id": "aries-rising-house-6-virgo",
      "risingSign": "Aries",
      "offsetSet": 1,
      "symbolicDisplacementFromNatural": 0,
      "houseNumber": 6,
      "houseName": "House Six",
      "sign": "Virgo",
      "title": "Virgo as House Six",
      "ingredients": {
        "houseField": "work, maintenance, service, health, routine, labor, and repair",
        "signStructure": {
          "element": "earth",
          "modality": "mutable",
          "combined": "mutable earth"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Six supplies work, maintenance, service, health, routine, labor, and repair.",
        "signLayer": "Virgo supplies mutable earth.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "Work and maintenance become mutable earth: daily life is refined through service, adjustment, technique, health practices, and the continual improvement of embodied processes. Mercury rules the house, so labor is organized through analysis, method, discernment, and practical problem-solving."
      },
      "description": "Work and maintenance become mutable earth: daily life is refined through service, adjustment, technique, health practices, and the continual improvement of embodied processes. Mercury rules the house, so labor is organized through analysis, method, discernment, and practical problem-solving."
    },
    {
      "id": "aries-rising-house-7-libra",
      "risingSign": "Aries",
      "offsetSet": 1,
      "symbolicDisplacementFromNatural": 0,
      "houseNumber": 7,
      "houseName": "House Seven",
      "sign": "Libra",
      "title": "Libra as House Seven",
      "ingredients": {
        "houseField": "partnership, mirrors, agreements, contracts, equality, and the other",
        "signStructure": {
          "element": "air",
          "modality": "cardinal",
          "combined": "cardinal air"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Seven supplies partnership, mirrors, agreements, contracts, equality, and the other.",
        "signLayer": "Libra supplies cardinal air.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "Partnership becomes cardinal air: relationship begins through meeting, comparison, reciprocity, agreement, and the recognition of another as an equal participant. Venus rules the house, so union is organized through attraction, harmony, proportion, fairness, and the creation of shared value."
      },
      "description": "Partnership becomes cardinal air: relationship begins through meeting, comparison, reciprocity, agreement, and the recognition of another as an equal participant. Venus rules the house, so union is organized through attraction, harmony, proportion, fairness, and the creation of shared value."
    },
    {
      "id": "aries-rising-house-8-scorpio",
      "risingSign": "Aries",
      "offsetSet": 1,
      "symbolicDisplacementFromNatural": 0,
      "houseNumber": 8,
      "houseName": "House Eight",
      "sign": "Scorpio",
      "title": "Scorpio as House Eight",
      "ingredients": {
        "houseField": "intimacy, shared resources, debt, death, inheritance, and transformation",
        "signStructure": {
          "element": "water",
          "modality": "fixed",
          "combined": "fixed water"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eight supplies intimacy, shared resources, debt, death, inheritance, and transformation.",
        "signLayer": "Scorpio supplies fixed water.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "Entanglement becomes fixed water: intimacy, loss, debt, inheritance, and shared resources deepen through emotional intensity and irrevocable bonds. Mars rules the house traditionally, so transformation is organized through confrontation, desire, severance, endurance, and the courage to enter what cannot remain superficial."
      },
      "description": "Entanglement becomes fixed water: intimacy, loss, debt, inheritance, and shared resources deepen through emotional intensity and irrevocable bonds. Mars rules the house traditionally, so transformation is organized through confrontation, desire, severance, endurance, and the courage to enter what cannot remain superficial."
    },
    {
      "id": "aries-rising-house-9-sagittarius",
      "risingSign": "Aries",
      "offsetSet": 1,
      "symbolicDisplacementFromNatural": 0,
      "houseNumber": 9,
      "houseName": "House Nine",
      "sign": "Sagittarius",
      "title": "Sagittarius as House Nine",
      "ingredients": {
        "houseField": "belief, philosophy, travel, law, teaching, higher learning, and meaning",
        "signStructure": {
          "element": "fire",
          "modality": "mutable",
          "combined": "mutable fire"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Nine supplies belief, philosophy, travel, law, teaching, higher learning, and meaning.",
        "signLayer": "Sagittarius supplies mutable fire.",
        "rulerLayer": "Jupiter supplies the organizing mechanism.",
        "result": "Belief becomes mutable fire: meaning expands through travel, philosophy, teaching, law, and the pursuit of horizons beyond immediate experience. Jupiter rules the house, so understanding is organized through faith, synthesis, generosity, and the continual search for a larger framework of meaning."
      },
      "description": "Belief becomes mutable fire: meaning expands through travel, philosophy, teaching, law, and the pursuit of horizons beyond immediate experience. Jupiter rules the house, so understanding is organized through faith, synthesis, generosity, and the continual search for a larger framework of meaning."
    },
    {
      "id": "aries-rising-house-10-capricorn",
      "risingSign": "Aries",
      "offsetSet": 1,
      "symbolicDisplacementFromNatural": 0,
      "houseNumber": 10,
      "houseName": "House Ten",
      "sign": "Capricorn",
      "title": "Capricorn as House Ten",
      "ingredients": {
        "houseField": "vocation, public life, authority, visibility, achievement, and consequence",
        "signStructure": {
          "element": "earth",
          "modality": "cardinal",
          "combined": "cardinal earth"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Ten supplies vocation, public life, authority, visibility, achievement, and consequence.",
        "signLayer": "Capricorn supplies cardinal earth.",
        "rulerLayer": "Saturn supplies the organizing mechanism.",
        "result": "Vocation becomes cardinal earth: public life takes form through responsibility, structure, ambition, discipline, and the steady construction of lasting achievement. Saturn rules the house, so authority is organized through time, commitment, consequence, and the acceptance of duty."
      },
      "description": "Vocation becomes cardinal earth: public life takes form through responsibility, structure, ambition, discipline, and the steady construction of lasting achievement. Saturn rules the house, so authority is organized through time, commitment, consequence, and the acceptance of duty."
    },
    {
      "id": "aries-rising-house-11-aquarius",
      "risingSign": "Aries",
      "offsetSet": 1,
      "symbolicDisplacementFromNatural": 0,
      "houseNumber": 11,
      "houseName": "House Eleven",
      "sign": "Aquarius",
      "title": "Aquarius as House Eleven",
      "ingredients": {
        "houseField": "community, friends, groups, hopes, networks, and shared futures",
        "signStructure": {
          "element": "air",
          "modality": "fixed",
          "combined": "fixed air"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eleven supplies community, friends, groups, hopes, networks, and shared futures.",
        "signLayer": "Aquarius supplies fixed air.",
        "rulerLayer": "Saturn supplies the organizing mechanism traditionally.",
        "result": "Community becomes fixed air: friendships, groups, and collective aspirations stabilize through principles, systems, shared ideals, and enduring social patterns. Saturn rules the house traditionally, so belonging is organized through structure, accountability, long-term alliances, and the work of building something larger than oneself."
      },
      "description": "Community becomes fixed air: friendships, groups, and collective aspirations stabilize through principles, systems, shared ideals, and enduring social patterns. Saturn rules the house traditionally, so belonging is organized through structure, accountability, long-term alliances, and the work of building something larger than oneself."
    },
    {
      "id": "aries-rising-house-12-pisces",
      "risingSign": "Aries",
      "offsetSet": 1,
      "symbolicDisplacementFromNatural": 0,
      "houseNumber": 12,
      "houseName": "House Twelve",
      "sign": "Pisces",
      "title": "Pisces as House Twelve",
      "ingredients": {
        "houseField": "solitude, retreat, hidden things, sorrow, dream, undoing, and release",
        "signStructure": {
          "element": "water",
          "modality": "mutable",
          "combined": "mutable water"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Twelve supplies solitude, retreat, hidden things, sorrow, dream, undoing, and release.",
        "signLayer": "Pisces supplies mutable water.",
        "rulerLayer": "Jupiter supplies the organizing mechanism traditionally.",
        "result": "The hidden realm becomes mutable water: solitude, dream, release, sorrow, retreat, undoing, and spiritual permeability dissolve fixed identity back into the oceanic field. Jupiter rules the house traditionally, so release is organized through mercy, imagination, faith, surrender, and meaning beyond containment."
      },
      "description": "The hidden realm becomes mutable water: solitude, dream, release, sorrow, retreat, undoing, and spiritual permeability dissolve fixed identity back into the oceanic field. Jupiter rules the house traditionally, so release is organized through mercy, imagination, faith, surrender, and meaning beyond containment."
    },
    {
      "id": "taurus-rising-house-1-taurus",
      "risingSign": "Taurus",
      "offsetSet": 2,
      "symbolicDisplacementFromNatural": 1,
      "houseNumber": 1,
      "houseName": "House One",
      "sign": "Taurus",
      "title": "Taurus as House One",
      "ingredients": {
        "houseField": "self, body, appearance, identity, and immediate orientation",
        "signStructure": {
          "element": "earth",
          "modality": "fixed",
          "combined": "fixed earth"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House One supplies self, body, appearance, identity, and immediate orientation.",
        "signLayer": "Taurus supplies fixed earth.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "The self becomes fixed earth: identity stabilizes through embodiment, continuity, comfort, beauty, and the cultivation of enduring values. Venus rules the house, so the body and persona are organized through attraction, preservation, pleasure, and the steady tending of life."
      },
      "description": "The self becomes fixed earth: identity stabilizes through embodiment, continuity, comfort, beauty, and the cultivation of enduring values. Venus rules the house, so the body and persona are organized through attraction, preservation, pleasure, and the steady tending of life."
    },
    {
      "id": "taurus-rising-house-2-gemini",
      "risingSign": "Taurus",
      "offsetSet": 2,
      "symbolicDisplacementFromNatural": 1,
      "houseNumber": 2,
      "houseName": "House Two",
      "sign": "Gemini",
      "title": "Gemini as House Two",
      "ingredients": {
        "houseField": "resources, value, money, food, possession, and survival support",
        "signStructure": {
          "element": "air",
          "modality": "mutable",
          "combined": "mutable air"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Two supplies resources, value, money, food, possession, and survival support.",
        "signLayer": "Gemini supplies mutable air.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "Resources become mutable air: value is gathered through information, communication, trade, learning, and the ability to connect disparate things. Mercury rules the house, so survival is organized through adaptability, exchange, and mental versatility."
      },
      "description": "Resources become mutable air: value is gathered through information, communication, trade, learning, and the ability to connect disparate things. Mercury rules the house, so survival is organized through adaptability, exchange, and mental versatility."
    },
    {
      "id": "taurus-rising-house-3-cancer",
      "risingSign": "Taurus",
      "offsetSet": 2,
      "symbolicDisplacementFromNatural": 1,
      "houseNumber": 3,
      "houseName": "House Three",
      "sign": "Cancer",
      "title": "Cancer as House Three",
      "ingredients": {
        "houseField": "speech, learning, siblings, neighbors, messages, and local movement",
        "signStructure": {
          "element": "water",
          "modality": "cardinal",
          "combined": "cardinal water"
        },
        "ruler": {
          "planet": "Moon",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Three supplies speech, learning, siblings, neighbors, messages, and local movement.",
        "signLayer": "Cancer supplies cardinal water.",
        "rulerLayer": "Moon supplies the organizing mechanism.",
        "result": "Speech and local experience become cardinal water: learning and communication begin through feeling, memory, care, and emotional significance. The Moon rules the house, so the mind is organized through personal associations, rhythms of attention, and the need for familiarity and belonging."
      },
      "description": "Speech and local experience become cardinal water: learning and communication begin through feeling, memory, care, and emotional significance. The Moon rules the house, so the mind is organized through personal associations, rhythms of attention, and the need for familiarity and belonging."
    },
    {
      "id": "taurus-rising-house-4-leo",
      "risingSign": "Taurus",
      "offsetSet": 2,
      "symbolicDisplacementFromNatural": 1,
      "houseNumber": 4,
      "houseName": "House Four",
      "sign": "Leo",
      "title": "Leo as House Four",
      "ingredients": {
        "houseField": "home, roots, ancestry, foundation, memory, and belonging",
        "signStructure": {
          "element": "fire",
          "modality": "fixed",
          "combined": "fixed fire"
        },
        "ruler": {
          "planet": "Sun",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Four supplies home, roots, ancestry, foundation, memory, and belonging.",
        "signLayer": "Leo supplies fixed fire.",
        "rulerLayer": "Sun supplies the organizing mechanism.",
        "result": "Home becomes fixed fire: roots are established through pride, loyalty, creativity, and the desire to make one's dwelling a place of warmth and radiance. The Sun rules the house, so foundation is organized through identity, vitality, and the expression of the authentic self."
      },
      "description": "Home becomes fixed fire: roots are established through pride, loyalty, creativity, and the desire to make one's dwelling a place of warmth and radiance. The Sun rules the house, so foundation is organized through identity, vitality, and the expression of the authentic self."
    },
    {
      "id": "taurus-rising-house-5-virgo",
      "risingSign": "Taurus",
      "offsetSet": 2,
      "symbolicDisplacementFromNatural": 1,
      "houseNumber": 5,
      "houseName": "House Five",
      "sign": "Virgo",
      "title": "Virgo as House Five",
      "ingredients": {
        "houseField": "pleasure, play, creativity, romance, children, risk, and self-expression",
        "signStructure": {
          "element": "earth",
          "modality": "mutable",
          "combined": "mutable earth"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Five supplies pleasure, play, creativity, romance, children, risk, and self-expression.",
        "signLayer": "Virgo supplies mutable earth.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "Pleasure becomes mutable earth: creativity and play are refined through skill, improvement, craftsmanship, and thoughtful attention to detail. Mercury rules the house, so joy is organized through experimentation, learning, and the satisfaction of making things better."
      },
      "description": "Pleasure becomes mutable earth: creativity and play are refined through skill, improvement, craftsmanship, and thoughtful attention to detail. Mercury rules the house, so joy is organized through experimentation, learning, and the satisfaction of making things better."
    },
    {
      "id": "taurus-rising-house-6-libra",
      "risingSign": "Taurus",
      "offsetSet": 2,
      "symbolicDisplacementFromNatural": 1,
      "houseNumber": 6,
      "houseName": "House Six",
      "sign": "Libra",
      "title": "Libra as House Six",
      "ingredients": {
        "houseField": "work, maintenance, service, health, routine, labor, and repair",
        "signStructure": {
          "element": "air",
          "modality": "cardinal",
          "combined": "cardinal air"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Six supplies work, maintenance, service, health, routine, labor, and repair.",
        "signLayer": "Libra supplies cardinal air.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "Work and maintenance become cardinal air: daily life seeks balance, cooperation, fairness, and harmonious arrangement. Venus rules the house, so labor is organized through relationship, aesthetics, diplomacy, and the cultivation of pleasant and equitable conditions."
      },
      "description": "Work and maintenance become cardinal air: daily life seeks balance, cooperation, fairness, and harmonious arrangement. Venus rules the house, so labor is organized through relationship, aesthetics, diplomacy, and the cultivation of pleasant and equitable conditions."
    },
    {
      "id": "taurus-rising-house-7-scorpio",
      "risingSign": "Taurus",
      "offsetSet": 2,
      "symbolicDisplacementFromNatural": 1,
      "houseNumber": 7,
      "houseName": "House Seven",
      "sign": "Scorpio",
      "title": "Scorpio as House Seven",
      "ingredients": {
        "houseField": "partnership, mirrors, agreements, contracts, equality, and the other",
        "signStructure": {
          "element": "water",
          "modality": "fixed",
          "combined": "fixed water"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Seven supplies partnership, mirrors, agreements, contracts, equality, and the other.",
        "signLayer": "Scorpio supplies fixed water.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "Partnership becomes fixed water: relationships deepen through intensity, loyalty, vulnerability, and transformative emotional bonds. Mars rules the house traditionally, so union is organized through desire, confrontation, courage, and the willingness to be profoundly changed by another."
      },
      "description": "Partnership becomes fixed water: relationships deepen through intensity, loyalty, vulnerability, and transformative emotional bonds. Mars rules the house traditionally, so union is organized through desire, confrontation, courage, and the willingness to be profoundly changed by another."
    },
    {
      "id": "taurus-rising-house-8-sagittarius",
      "risingSign": "Taurus",
      "offsetSet": 2,
      "symbolicDisplacementFromNatural": 1,
      "houseNumber": 8,
      "houseName": "House Eight",
      "sign": "Sagittarius",
      "title": "Sagittarius as House Eight",
      "ingredients": {
        "houseField": "intimacy, shared resources, debt, death, inheritance, and transformation",
        "signStructure": {
          "element": "fire",
          "modality": "mutable",
          "combined": "mutable fire"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eight supplies intimacy, shared resources, debt, death, inheritance, and transformation.",
        "signLayer": "Sagittarius supplies mutable fire.",
        "rulerLayer": "Jupiter supplies the organizing mechanism.",
        "result": "Entanglement becomes mutable fire: shared resources, loss, and transformation are approached through faith, exploration, philosophy, and the search for meaning beyond immediate circumstances. Jupiter rules the house, so deep change is organized through growth, wisdom, and the expansion of perspective."
      },
      "description": "Entanglement becomes mutable fire: shared resources, loss, and transformation are approached through faith, exploration, philosophy, and the search for meaning beyond immediate circumstances. Jupiter rules the house, so deep change is organized through growth, wisdom, and the expansion of perspective."
    },
    {
      "id": "taurus-rising-house-9-capricorn",
      "risingSign": "Taurus",
      "offsetSet": 2,
      "symbolicDisplacementFromNatural": 1,
      "houseNumber": 9,
      "houseName": "House Nine",
      "sign": "Capricorn",
      "title": "Capricorn as House Nine",
      "ingredients": {
        "houseField": "belief, philosophy, travel, law, teaching, higher learning, and meaning",
        "signStructure": {
          "element": "earth",
          "modality": "cardinal",
          "combined": "cardinal earth"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Nine supplies belief, philosophy, travel, law, teaching, higher learning, and meaning.",
        "signLayer": "Capricorn supplies cardinal earth.",
        "rulerLayer": "Saturn supplies the organizing mechanism.",
        "result": "Belief becomes cardinal earth: philosophy and higher learning seek structure, practicality, discipline, and enduring achievement. Saturn rules the house, so understanding is organized through responsibility, perseverance, and the slow construction of wisdom."
      },
      "description": "Belief becomes cardinal earth: philosophy and higher learning seek structure, practicality, discipline, and enduring achievement. Saturn rules the house, so understanding is organized through responsibility, perseverance, and the slow construction of wisdom."
    },
    {
      "id": "taurus-rising-house-10-aquarius",
      "risingSign": "Taurus",
      "offsetSet": 2,
      "symbolicDisplacementFromNatural": 1,
      "houseNumber": 10,
      "houseName": "House Ten",
      "sign": "Aquarius",
      "title": "Aquarius as House Ten",
      "ingredients": {
        "houseField": "vocation, public life, authority, visibility, achievement, and consequence",
        "signStructure": {
          "element": "air",
          "modality": "fixed",
          "combined": "fixed air"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Ten supplies vocation, public life, authority, visibility, achievement, and consequence.",
        "signLayer": "Aquarius supplies fixed air.",
        "rulerLayer": "Saturn supplies the organizing mechanism traditionally.",
        "result": "Vocation becomes fixed air: public life takes shape through ideas, systems, reform, and commitment to principles that extend beyond the personal. Saturn rules the house traditionally, so authority is organized through long-term vision, social responsibility, and the creation of durable structures."
      },
      "description": "Vocation becomes fixed air: public life takes shape through ideas, systems, reform, and commitment to principles that extend beyond the personal. Saturn rules the house traditionally, so authority is organized through long-term vision, social responsibility, and the creation of durable structures."
    },
    {
      "id": "taurus-rising-house-11-pisces",
      "risingSign": "Taurus",
      "offsetSet": 2,
      "symbolicDisplacementFromNatural": 1,
      "houseNumber": 11,
      "houseName": "House Eleven",
      "sign": "Pisces",
      "title": "Pisces as House Eleven",
      "ingredients": {
        "houseField": "community, friends, groups, hopes, networks, and shared futures",
        "signStructure": {
          "element": "water",
          "modality": "mutable",
          "combined": "mutable water"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eleven supplies community, friends, groups, hopes, networks, and shared futures.",
        "signLayer": "Pisces supplies mutable water.",
        "rulerLayer": "Jupiter supplies the organizing mechanism traditionally.",
        "result": "Community becomes mutable water: friendships and aspirations flow through compassion, imagination, spiritual affinity, and the dissolving of rigid boundaries between self and group. Jupiter rules the house traditionally, so belonging is organized through generosity, faith, and shared meaning."
      },
      "description": "Community becomes mutable water: friendships and aspirations flow through compassion, imagination, spiritual affinity, and the dissolving of rigid boundaries between self and group. Jupiter rules the house traditionally, so belonging is organized through generosity, faith, and shared meaning."
    },
    {
      "id": "taurus-rising-house-12-aries",
      "risingSign": "Taurus",
      "offsetSet": 2,
      "symbolicDisplacementFromNatural": 1,
      "houseNumber": 12,
      "houseName": "House Twelve",
      "sign": "Aries",
      "title": "Aries as House Twelve",
      "ingredients": {
        "houseField": "solitude, retreat, hidden things, sorrow, dream, undoing, and release",
        "signStructure": {
          "element": "fire",
          "modality": "cardinal",
          "combined": "cardinal fire"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Twelve supplies solitude, retreat, hidden things, sorrow, dream, undoing, and release.",
        "signLayer": "Aries supplies cardinal fire.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "The hidden realm becomes cardinal fire: solitude, retreat, and unconscious processes become places of ignition, courage, and latent initiative. Mars rules the house, so release is organized through decisive severance, the recovery of personal agency, and the emergence of action from the unseen depths."
      },
      "description": "The hidden realm becomes cardinal fire: solitude, retreat, and unconscious processes become places of ignition, courage, and latent initiative. Mars rules the house, so release is organized through decisive severance, the recovery of personal agency, and the emergence of action from the unseen depths."
    },
    {
      "id": "gemini-rising-house-1-gemini",
      "risingSign": "Gemini",
      "offsetSet": 3,
      "symbolicDisplacementFromNatural": 2,
      "houseNumber": 1,
      "houseName": "House One",
      "sign": "Gemini",
      "title": "Gemini as House One",
      "ingredients": {
        "houseField": "self, body, appearance, identity, and immediate orientation",
        "signStructure": {
          "element": "air",
          "modality": "mutable",
          "combined": "mutable air"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House One supplies self, body, appearance, identity, and immediate orientation.",
        "signLayer": "Gemini supplies mutable air.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "The self becomes mutable air: identity is organized through curiosity, language, adaptability, comparison, and the continual exchange of information. Mercury rules the house, so the body and persona are shaped through naming, questioning, learning, and making connections."
      },
      "description": "The self becomes mutable air: identity is organized through curiosity, language, adaptability, comparison, and the continual exchange of information. Mercury rules the house, so the body and persona are shaped through naming, questioning, learning, and making connections."
    },
    {
      "id": "gemini-rising-house-2-cancer",
      "risingSign": "Gemini",
      "offsetSet": 3,
      "symbolicDisplacementFromNatural": 2,
      "houseNumber": 2,
      "houseName": "House Two",
      "sign": "Cancer",
      "title": "Cancer as House Two",
      "ingredients": {
        "houseField": "resources, value, money, food, possession, and survival support",
        "signStructure": {
          "element": "water",
          "modality": "cardinal",
          "combined": "cardinal water"
        },
        "ruler": {
          "planet": "Moon",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Two supplies resources, value, money, food, possession, and survival support.",
        "signLayer": "Cancer supplies cardinal water.",
        "rulerLayer": "Moon supplies the organizing mechanism.",
        "result": "Resources become cardinal water: value is established through care, nourishment, belonging, memory, and emotional security. The Moon rules the house, so survival is organized through attachment, protection, and the cultivation of what feels like home."
      },
      "description": "Resources become cardinal water: value is established through care, nourishment, belonging, memory, and emotional security. The Moon rules the house, so survival is organized through attachment, protection, and the cultivation of what feels like home."
    },
    {
      "id": "gemini-rising-house-3-leo",
      "risingSign": "Gemini",
      "offsetSet": 3,
      "symbolicDisplacementFromNatural": 2,
      "houseNumber": 3,
      "houseName": "House Three",
      "sign": "Leo",
      "title": "Leo as House Three",
      "ingredients": {
        "houseField": "speech, learning, siblings, neighbors, messages, and local movement",
        "signStructure": {
          "element": "fire",
          "modality": "fixed",
          "combined": "fixed fire"
        },
        "ruler": {
          "planet": "Sun",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Three supplies speech, learning, siblings, neighbors, messages, and local movement.",
        "signLayer": "Leo supplies fixed fire.",
        "rulerLayer": "Sun supplies the organizing mechanism.",
        "result": "Speech and local experience become fixed fire: communication radiates through confidence, creativity, storytelling, and the desire to be heard and recognized. The Sun rules the house, so learning is organized through personal expression, vitality, and the development of a distinctive voice."
      },
      "description": "Speech and local experience become fixed fire: communication radiates through confidence, creativity, storytelling, and the desire to be heard and recognized. The Sun rules the house, so learning is organized through personal expression, vitality, and the development of a distinctive voice."
    },
    {
      "id": "gemini-rising-house-4-virgo",
      "risingSign": "Gemini",
      "offsetSet": 3,
      "symbolicDisplacementFromNatural": 2,
      "houseNumber": 4,
      "houseName": "House Four",
      "sign": "Virgo",
      "title": "Virgo as House Four",
      "ingredients": {
        "houseField": "home, roots, ancestry, foundation, memory, and belonging",
        "signStructure": {
          "element": "earth",
          "modality": "mutable",
          "combined": "mutable earth"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Four supplies home, roots, ancestry, foundation, memory, and belonging.",
        "signLayer": "Virgo supplies mutable earth.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "Home becomes mutable earth: roots are maintained through service, practical care, repair, routine, and thoughtful attention to the details of daily life. Mercury rules the house, so foundation is organized through method, discernment, and the continual refinement of one's environment."
      },
      "description": "Home becomes mutable earth: roots are maintained through service, practical care, repair, routine, and thoughtful attention to the details of daily life. Mercury rules the house, so foundation is organized through method, discernment, and the continual refinement of one's environment."
    },
    {
      "id": "gemini-rising-house-5-libra",
      "risingSign": "Gemini",
      "offsetSet": 3,
      "symbolicDisplacementFromNatural": 2,
      "houseNumber": 5,
      "houseName": "House Five",
      "sign": "Libra",
      "title": "Libra as House Five",
      "ingredients": {
        "houseField": "pleasure, play, creativity, romance, children, risk, and self-expression",
        "signStructure": {
          "element": "air",
          "modality": "cardinal",
          "combined": "cardinal air"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Five supplies pleasure, play, creativity, romance, children, risk, and self-expression.",
        "signLayer": "Libra supplies cardinal air.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "Pleasure becomes cardinal air: creativity begins through relationship, beauty, harmony, and the impulse to share experiences with others. Venus rules the house, so joy is organized through attraction, cooperation, aesthetics, and the creation of balanced forms."
      },
      "description": "Pleasure becomes cardinal air: creativity begins through relationship, beauty, harmony, and the impulse to share experiences with others. Venus rules the house, so joy is organized through attraction, cooperation, aesthetics, and the creation of balanced forms."
    },
    {
      "id": "gemini-rising-house-6-scorpio",
      "risingSign": "Gemini",
      "offsetSet": 3,
      "symbolicDisplacementFromNatural": 2,
      "houseNumber": 6,
      "houseName": "House Six",
      "sign": "Scorpio",
      "title": "Scorpio as House Six",
      "ingredients": {
        "houseField": "work, maintenance, service, health, routine, labor, and repair",
        "signStructure": {
          "element": "water",
          "modality": "fixed",
          "combined": "fixed water"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Six supplies work, maintenance, service, health, routine, labor, and repair.",
        "signLayer": "Scorpio supplies fixed water.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "Work and maintenance become fixed water: daily life deepens through commitment, emotional intensity, persistence, and a willingness to confront what lies beneath the surface. Mars rules the house traditionally, so labor is organized through courage, endurance, and transformative effort."
      },
      "description": "Work and maintenance become fixed water: daily life deepens through commitment, emotional intensity, persistence, and a willingness to confront what lies beneath the surface. Mars rules the house traditionally, so labor is organized through courage, endurance, and transformative effort."
    },
    {
      "id": "gemini-rising-house-7-sagittarius",
      "risingSign": "Gemini",
      "offsetSet": 3,
      "symbolicDisplacementFromNatural": 2,
      "houseNumber": 7,
      "houseName": "House Seven",
      "sign": "Sagittarius",
      "title": "Sagittarius as House Seven",
      "ingredients": {
        "houseField": "partnership, mirrors, agreements, contracts, equality, and the other",
        "signStructure": {
          "element": "fire",
          "modality": "mutable",
          "combined": "mutable fire"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Seven supplies partnership, mirrors, agreements, contracts, equality, and the other.",
        "signLayer": "Sagittarius supplies mutable fire.",
        "rulerLayer": "Jupiter supplies the organizing mechanism.",
        "result": "Partnership becomes mutable fire: relationships seek growth, adventure, meaning, and the expansion of horizons through connection with others. Jupiter rules the house, so union is organized through generosity, teaching, shared beliefs, and the pursuit of a larger vision."
      },
      "description": "Partnership becomes mutable fire: relationships seek growth, adventure, meaning, and the expansion of horizons through connection with others. Jupiter rules the house, so union is organized through generosity, teaching, shared beliefs, and the pursuit of a larger vision."
    },
    {
      "id": "gemini-rising-house-8-capricorn",
      "risingSign": "Gemini",
      "offsetSet": 3,
      "symbolicDisplacementFromNatural": 2,
      "houseNumber": 8,
      "houseName": "House Eight",
      "sign": "Capricorn",
      "title": "Capricorn as House Eight",
      "ingredients": {
        "houseField": "intimacy, shared resources, debt, death, inheritance, and transformation",
        "signStructure": {
          "element": "earth",
          "modality": "cardinal",
          "combined": "cardinal earth"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eight supplies intimacy, shared resources, debt, death, inheritance, and transformation.",
        "signLayer": "Capricorn supplies cardinal earth.",
        "rulerLayer": "Saturn supplies the organizing mechanism.",
        "result": "Entanglement becomes cardinal earth: shared resources, obligations, and transformation take shape through responsibility, structure, and the acceptance of long-term consequences. Saturn rules the house, so deep change is organized through discipline, endurance, and the patient management of what cannot be avoided."
      },
      "description": "Entanglement becomes cardinal earth: shared resources, obligations, and transformation take shape through responsibility, structure, and the acceptance of long-term consequences. Saturn rules the house, so deep change is organized through discipline, endurance, and the patient management of what cannot be avoided."
    },
    {
      "id": "gemini-rising-house-9-aquarius",
      "risingSign": "Gemini",
      "offsetSet": 3,
      "symbolicDisplacementFromNatural": 2,
      "houseNumber": 9,
      "houseName": "House Nine",
      "sign": "Aquarius",
      "title": "Aquarius as House Nine",
      "ingredients": {
        "houseField": "belief, philosophy, travel, law, teaching, higher learning, and meaning",
        "signStructure": {
          "element": "air",
          "modality": "fixed",
          "combined": "fixed air"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Nine supplies belief, philosophy, travel, law, teaching, higher learning, and meaning.",
        "signLayer": "Aquarius supplies fixed air.",
        "rulerLayer": "Saturn supplies the organizing mechanism traditionally.",
        "result": "Belief becomes fixed air: philosophy and higher learning stabilize around ideas, principles, systems, and visions of collective possibility. Saturn rules the house traditionally, so understanding is organized through intellectual rigor, social responsibility, and coherent frameworks."
      },
      "description": "Belief becomes fixed air: philosophy and higher learning stabilize around ideas, principles, systems, and visions of collective possibility. Saturn rules the house traditionally, so understanding is organized through intellectual rigor, social responsibility, and coherent frameworks."
    },
    {
      "id": "gemini-rising-house-10-pisces",
      "risingSign": "Gemini",
      "offsetSet": 3,
      "symbolicDisplacementFromNatural": 2,
      "houseNumber": 10,
      "houseName": "House Ten",
      "sign": "Pisces",
      "title": "Pisces as House Ten",
      "ingredients": {
        "houseField": "vocation, public life, authority, visibility, achievement, and consequence",
        "signStructure": {
          "element": "water",
          "modality": "mutable",
          "combined": "mutable water"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Ten supplies vocation, public life, authority, visibility, achievement, and consequence.",
        "signLayer": "Pisces supplies mutable water.",
        "rulerLayer": "Jupiter supplies the organizing mechanism traditionally.",
        "result": "Vocation becomes mutable water: public life flows through compassion, imagination, receptivity, and sensitivity to the unseen dimensions of experience. Jupiter rules the house traditionally, so authority is organized through wisdom, faith, mercy, and the ability to inspire meaning in others."
      },
      "description": "Vocation becomes mutable water: public life flows through compassion, imagination, receptivity, and sensitivity to the unseen dimensions of experience. Jupiter rules the house traditionally, so authority is organized through wisdom, faith, mercy, and the ability to inspire meaning in others."
    },
    {
      "id": "gemini-rising-house-11-aries",
      "risingSign": "Gemini",
      "offsetSet": 3,
      "symbolicDisplacementFromNatural": 2,
      "houseNumber": 11,
      "houseName": "House Eleven",
      "sign": "Aries",
      "title": "Aries as House Eleven",
      "ingredients": {
        "houseField": "community, friends, groups, hopes, networks, and shared futures",
        "signStructure": {
          "element": "fire",
          "modality": "cardinal",
          "combined": "cardinal fire"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eleven supplies community, friends, groups, hopes, networks, and shared futures.",
        "signLayer": "Aries supplies cardinal fire.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "Community becomes cardinal fire: friendships and collective aspirations begin through initiative, courage, enthusiasm, and the willingness to lead. Mars rules the house, so belonging is organized through action, directness, and the pursuit of shared endeavors."
      },
      "description": "Community becomes cardinal fire: friendships and collective aspirations begin through initiative, courage, enthusiasm, and the willingness to lead. Mars rules the house, so belonging is organized through action, directness, and the pursuit of shared endeavors."
    },
    {
      "id": "gemini-rising-house-12-taurus",
      "risingSign": "Gemini",
      "offsetSet": 3,
      "symbolicDisplacementFromNatural": 2,
      "houseNumber": 12,
      "houseName": "House Twelve",
      "sign": "Taurus",
      "title": "Taurus as House Twelve",
      "ingredients": {
        "houseField": "solitude, retreat, hidden things, sorrow, dream, undoing, and release",
        "signStructure": {
          "element": "earth",
          "modality": "fixed",
          "combined": "fixed earth"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Twelve supplies solitude, retreat, hidden things, sorrow, dream, undoing, and release.",
        "signLayer": "Taurus supplies fixed earth.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "The hidden realm becomes fixed earth: solitude, retreat, and release become places of stillness, preservation, sensory memory, and enduring values that remain beneath the surface of conscious life. Venus rules the house, so surrender is organized through peace, acceptance, beauty, and the gentle holding of what cannot be forced."
      },
      "description": "The hidden realm becomes fixed earth: solitude, retreat, and release become places of stillness, preservation, sensory memory, and enduring values that remain beneath the surface of conscious life. Venus rules the house, so surrender is organized through peace, acceptance, beauty, and the gentle holding of what cannot be forced."
    },
    {
      "id": "cancer-rising-house-1-cancer",
      "risingSign": "Cancer",
      "offsetSet": 4,
      "symbolicDisplacementFromNatural": 3,
      "houseNumber": 1,
      "houseName": "House One",
      "sign": "Cancer",
      "title": "Cancer as House One",
      "ingredients": {
        "houseField": "self, body, appearance, identity, and immediate orientation",
        "signStructure": {
          "element": "water",
          "modality": "cardinal",
          "combined": "cardinal water"
        },
        "ruler": {
          "planet": "Moon",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House One supplies self, body, appearance, identity, and immediate orientation.",
        "signLayer": "Cancer supplies cardinal water.",
        "rulerLayer": "Moon supplies the organizing mechanism.",
        "result": "The self becomes cardinal water: identity emerges through feeling, care, memory, protection, and responsiveness to the environment. The Moon rules the house, so the body and persona are organized through rhythms of need, belonging, and emotional attunement."
      },
      "description": "The self becomes cardinal water: identity emerges through feeling, care, memory, protection, and responsiveness to the environment. The Moon rules the house, so the body and persona are organized through rhythms of need, belonging, and emotional attunement."
    },
    {
      "id": "cancer-rising-house-2-leo",
      "risingSign": "Cancer",
      "offsetSet": 4,
      "symbolicDisplacementFromNatural": 3,
      "houseNumber": 2,
      "houseName": "House Two",
      "sign": "Leo",
      "title": "Leo as House Two",
      "ingredients": {
        "houseField": "resources, value, money, food, possession, and survival support",
        "signStructure": {
          "element": "fire",
          "modality": "fixed",
          "combined": "fixed fire"
        },
        "ruler": {
          "planet": "Sun",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Two supplies resources, value, money, food, possession, and survival support.",
        "signLayer": "Leo supplies fixed fire.",
        "rulerLayer": "Sun supplies the organizing mechanism.",
        "result": "Resources become fixed fire: value stabilizes through creativity, generosity, pride, and the desire to cultivate what brings warmth and vitality. The Sun rules the house, so survival is organized through self-expression, confidence, and the radiance of one's gifts."
      },
      "description": "Resources become fixed fire: value stabilizes through creativity, generosity, pride, and the desire to cultivate what brings warmth and vitality. The Sun rules the house, so survival is organized through self-expression, confidence, and the radiance of one's gifts."
    },
    {
      "id": "cancer-rising-house-3-virgo",
      "risingSign": "Cancer",
      "offsetSet": 4,
      "symbolicDisplacementFromNatural": 3,
      "houseNumber": 3,
      "houseName": "House Three",
      "sign": "Virgo",
      "title": "Virgo as House Three",
      "ingredients": {
        "houseField": "speech, learning, siblings, neighbors, messages, and local movement",
        "signStructure": {
          "element": "earth",
          "modality": "mutable",
          "combined": "mutable earth"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Three supplies speech, learning, siblings, neighbors, messages, and local movement.",
        "signLayer": "Virgo supplies mutable earth.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "Speech and local experience become mutable earth: learning and communication are refined through observation, analysis, practical knowledge, and attention to detail. Mercury rules the house, so the mind is organized through discernment, method, and the continual improvement of understanding."
      },
      "description": "Speech and local experience become mutable earth: learning and communication are refined through observation, analysis, practical knowledge, and attention to detail. Mercury rules the house, so the mind is organized through discernment, method, and the continual improvement of understanding."
    },
    {
      "id": "cancer-rising-house-4-libra",
      "risingSign": "Cancer",
      "offsetSet": 4,
      "symbolicDisplacementFromNatural": 3,
      "houseNumber": 4,
      "houseName": "House Four",
      "sign": "Libra",
      "title": "Libra as House Four",
      "ingredients": {
        "houseField": "home, roots, ancestry, foundation, memory, and belonging",
        "signStructure": {
          "element": "air",
          "modality": "cardinal",
          "combined": "cardinal air"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Four supplies home, roots, ancestry, foundation, memory, and belonging.",
        "signLayer": "Libra supplies cardinal air.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "Home becomes cardinal air: roots are established through relationship, harmony, fairness, and the creation of a balanced environment. Venus rules the house, so foundation is organized through beauty, cooperation, and the cultivation of peaceful connections."
      },
      "description": "Home becomes cardinal air: roots are established through relationship, harmony, fairness, and the creation of a balanced environment. Venus rules the house, so foundation is organized through beauty, cooperation, and the cultivation of peaceful connections."
    },
    {
      "id": "cancer-rising-house-5-scorpio",
      "risingSign": "Cancer",
      "offsetSet": 4,
      "symbolicDisplacementFromNatural": 3,
      "houseNumber": 5,
      "houseName": "House Five",
      "sign": "Scorpio",
      "title": "Scorpio as House Five",
      "ingredients": {
        "houseField": "pleasure, play, creativity, romance, children, risk, and self-expression",
        "signStructure": {
          "element": "water",
          "modality": "fixed",
          "combined": "fixed water"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Five supplies pleasure, play, creativity, romance, children, risk, and self-expression.",
        "signLayer": "Scorpio supplies fixed water.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "Pleasure becomes fixed water: creativity, romance, and play deepen through intensity, passion, loyalty, and emotional risk. Mars rules the house traditionally, so joy is organized through desire, courage, and the willingness to create from profound feeling."
      },
      "description": "Pleasure becomes fixed water: creativity, romance, and play deepen through intensity, passion, loyalty, and emotional risk. Mars rules the house traditionally, so joy is organized through desire, courage, and the willingness to create from profound feeling."
    },
    {
      "id": "cancer-rising-house-6-sagittarius",
      "risingSign": "Cancer",
      "offsetSet": 4,
      "symbolicDisplacementFromNatural": 3,
      "houseNumber": 6,
      "houseName": "House Six",
      "sign": "Sagittarius",
      "title": "Sagittarius as House Six",
      "ingredients": {
        "houseField": "work, maintenance, service, health, routine, labor, and repair",
        "signStructure": {
          "element": "fire",
          "modality": "mutable",
          "combined": "mutable fire"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Six supplies work, maintenance, service, health, routine, labor, and repair.",
        "signLayer": "Sagittarius supplies mutable fire.",
        "rulerLayer": "Jupiter supplies the organizing mechanism.",
        "result": "Work and maintenance become mutable fire: daily life seeks growth, meaning, exploration, and opportunities to broaden experience. Jupiter rules the house, so labor is organized through learning, generosity, optimism, and the pursuit of a larger purpose."
      },
      "description": "Work and maintenance become mutable fire: daily life seeks growth, meaning, exploration, and opportunities to broaden experience. Jupiter rules the house, so labor is organized through learning, generosity, optimism, and the pursuit of a larger purpose."
    },
    {
      "id": "cancer-rising-house-7-capricorn",
      "risingSign": "Cancer",
      "offsetSet": 4,
      "symbolicDisplacementFromNatural": 3,
      "houseNumber": 7,
      "houseName": "House Seven",
      "sign": "Capricorn",
      "title": "Capricorn as House Seven",
      "ingredients": {
        "houseField": "partnership, mirrors, agreements, contracts, equality, and the other",
        "signStructure": {
          "element": "earth",
          "modality": "cardinal",
          "combined": "cardinal earth"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Seven supplies partnership, mirrors, agreements, contracts, equality, and the other.",
        "signLayer": "Capricorn supplies cardinal earth.",
        "rulerLayer": "Saturn supplies the organizing mechanism.",
        "result": "Partnership becomes cardinal earth: relationships take shape through commitment, responsibility, reliability, and the building of enduring structures together. Saturn rules the house, so union is organized through boundaries, duty, and the patient development of trust."
      },
      "description": "Partnership becomes cardinal earth: relationships take shape through commitment, responsibility, reliability, and the building of enduring structures together. Saturn rules the house, so union is organized through boundaries, duty, and the patient development of trust."
    },
    {
      "id": "cancer-rising-house-8-aquarius",
      "risingSign": "Cancer",
      "offsetSet": 4,
      "symbolicDisplacementFromNatural": 3,
      "houseNumber": 8,
      "houseName": "House Eight",
      "sign": "Aquarius",
      "title": "Aquarius as House Eight",
      "ingredients": {
        "houseField": "intimacy, shared resources, debt, death, inheritance, and transformation",
        "signStructure": {
          "element": "air",
          "modality": "fixed",
          "combined": "fixed air"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eight supplies intimacy, shared resources, debt, death, inheritance, and transformation.",
        "signLayer": "Aquarius supplies fixed air.",
        "rulerLayer": "Saturn supplies the organizing mechanism traditionally.",
        "result": "Entanglement becomes fixed air: shared resources, intimacy, and transformation are approached through ideas, principles, and enduring patterns of connection. Saturn rules the house traditionally, so deep change is organized through objectivity, long-term consequences, and the restructuring of systems and bonds."
      },
      "description": "Entanglement becomes fixed air: shared resources, intimacy, and transformation are approached through ideas, principles, and enduring patterns of connection. Saturn rules the house traditionally, so deep change is organized through objectivity, long-term consequences, and the restructuring of systems and bonds."
    },
    {
      "id": "cancer-rising-house-9-pisces",
      "risingSign": "Cancer",
      "offsetSet": 4,
      "symbolicDisplacementFromNatural": 3,
      "houseNumber": 9,
      "houseName": "House Nine",
      "sign": "Pisces",
      "title": "Pisces as House Nine",
      "ingredients": {
        "houseField": "belief, philosophy, travel, law, teaching, higher learning, and meaning",
        "signStructure": {
          "element": "water",
          "modality": "mutable",
          "combined": "mutable water"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Nine supplies belief, philosophy, travel, law, teaching, higher learning, and meaning.",
        "signLayer": "Pisces supplies mutable water.",
        "rulerLayer": "Jupiter supplies the organizing mechanism traditionally.",
        "result": "Belief becomes mutable water: philosophy and higher learning flow through imagination, compassion, spiritual longing, and receptivity to mystery. Jupiter rules the house traditionally, so understanding is organized through faith, mercy, and the search for meaning beyond ordinary boundaries."
      },
      "description": "Belief becomes mutable water: philosophy and higher learning flow through imagination, compassion, spiritual longing, and receptivity to mystery. Jupiter rules the house traditionally, so understanding is organized through faith, mercy, and the search for meaning beyond ordinary boundaries."
    },
    {
      "id": "cancer-rising-house-10-aries",
      "risingSign": "Cancer",
      "offsetSet": 4,
      "symbolicDisplacementFromNatural": 3,
      "houseNumber": 10,
      "houseName": "House Ten",
      "sign": "Aries",
      "title": "Aries as House Ten",
      "ingredients": {
        "houseField": "vocation, public life, authority, visibility, achievement, and consequence",
        "signStructure": {
          "element": "fire",
          "modality": "cardinal",
          "combined": "cardinal fire"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Ten supplies vocation, public life, authority, visibility, achievement, and consequence.",
        "signLayer": "Aries supplies cardinal fire.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "Vocation becomes cardinal fire: public life begins through initiative, leadership, courage, and the willingness to act decisively in the world. Mars rules the house, so authority is organized through action, directness, and the capacity to pioneer new paths."
      },
      "description": "Vocation becomes cardinal fire: public life begins through initiative, leadership, courage, and the willingness to act decisively in the world. Mars rules the house, so authority is organized through action, directness, and the capacity to pioneer new paths."
    },
    {
      "id": "cancer-rising-house-11-taurus",
      "risingSign": "Cancer",
      "offsetSet": 4,
      "symbolicDisplacementFromNatural": 3,
      "houseNumber": 11,
      "houseName": "House Eleven",
      "sign": "Taurus",
      "title": "Taurus as House Eleven",
      "ingredients": {
        "houseField": "community, friends, groups, hopes, networks, and shared futures",
        "signStructure": {
          "element": "earth",
          "modality": "fixed",
          "combined": "fixed earth"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eleven supplies community, friends, groups, hopes, networks, and shared futures.",
        "signLayer": "Taurus supplies fixed earth.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "Community becomes fixed earth: friendships and aspirations stabilize through loyalty, consistency, shared resources, and the cultivation of enduring networks. Venus rules the house, so belonging is organized through mutual support, pleasure, and the steady growth of common values."
      },
      "description": "Community becomes fixed earth: friendships and aspirations stabilize through loyalty, consistency, shared resources, and the cultivation of enduring networks. Venus rules the house, so belonging is organized through mutual support, pleasure, and the steady growth of common values."
    },
    {
      "id": "cancer-rising-house-12-gemini",
      "risingSign": "Cancer",
      "offsetSet": 4,
      "symbolicDisplacementFromNatural": 3,
      "houseNumber": 12,
      "houseName": "House Twelve",
      "sign": "Gemini",
      "title": "Gemini as House Twelve",
      "ingredients": {
        "houseField": "solitude, retreat, hidden things, sorrow, dream, undoing, and release",
        "signStructure": {
          "element": "air",
          "modality": "mutable",
          "combined": "mutable air"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Twelve supplies solitude, retreat, hidden things, sorrow, dream, undoing, and release.",
        "signLayer": "Gemini supplies mutable air.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "The hidden realm becomes mutable air: solitude, retreat, and release become places of reflection, imagination, memory, and inner dialogue. Mercury rules the house, so surrender is organized through understanding, naming, and the gradual integration of thoughts that arise from beyond ordinary awareness."
      },
      "description": "The hidden realm becomes mutable air: solitude, retreat, and release become places of reflection, imagination, memory, and inner dialogue. Mercury rules the house, so surrender is organized through understanding, naming, and the gradual integration of thoughts that arise from beyond ordinary awareness."
    },
    {
      "id": "leo-rising-house-1-leo",
      "risingSign": "Leo",
      "offsetSet": 5,
      "symbolicDisplacementFromNatural": 4,
      "houseNumber": 1,
      "houseName": "House One",
      "sign": "Leo",
      "title": "Leo as House One",
      "ingredients": {
        "houseField": "self, body, appearance, identity, and immediate orientation",
        "signStructure": {
          "element": "fire",
          "modality": "fixed",
          "combined": "fixed fire"
        },
        "ruler": {
          "planet": "Sun",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House One supplies self, body, appearance, identity, and immediate orientation.",
        "signLayer": "Leo supplies fixed fire.",
        "rulerLayer": "Sun supplies the organizing mechanism.",
        "result": "The self becomes fixed fire: identity stabilizes through visibility, creativity, loyalty, courage, and the desire to radiate one's essential nature. The Sun rules the house, so the body and persona are organized through vitality, self-expression, and the need to shine from the center of one's own life."
      },
      "description": "The self becomes fixed fire: identity stabilizes through visibility, creativity, loyalty, courage, and the desire to radiate one's essential nature. The Sun rules the house, so the body and persona are organized through vitality, self-expression, and the need to shine from the center of one's own life."
    },
    {
      "id": "leo-rising-house-2-virgo",
      "risingSign": "Leo",
      "offsetSet": 5,
      "symbolicDisplacementFromNatural": 4,
      "houseNumber": 2,
      "houseName": "House Two",
      "sign": "Virgo",
      "title": "Virgo as House Two",
      "ingredients": {
        "houseField": "resources, value, money, food, possession, and survival support",
        "signStructure": {
          "element": "earth",
          "modality": "mutable",
          "combined": "mutable earth"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Two supplies resources, value, money, food, possession, and survival support.",
        "signLayer": "Virgo supplies mutable earth.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "Resources become mutable earth: value is cultivated through usefulness, skill, refinement, service, and the continual improvement of practical systems. Mercury rules the house, so survival is organized through discernment, method, and intelligent stewardship of material resources."
      },
      "description": "Resources become mutable earth: value is cultivated through usefulness, skill, refinement, service, and the continual improvement of practical systems. Mercury rules the house, so survival is organized through discernment, method, and intelligent stewardship of material resources."
    },
    {
      "id": "leo-rising-house-3-libra",
      "risingSign": "Leo",
      "offsetSet": 5,
      "symbolicDisplacementFromNatural": 4,
      "houseNumber": 3,
      "houseName": "House Three",
      "sign": "Libra",
      "title": "Libra as House Three",
      "ingredients": {
        "houseField": "speech, learning, siblings, neighbors, messages, and local movement",
        "signStructure": {
          "element": "air",
          "modality": "cardinal",
          "combined": "cardinal air"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Three supplies speech, learning, siblings, neighbors, messages, and local movement.",
        "signLayer": "Libra supplies cardinal air.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "Speech and local experience become cardinal air: communication begins through dialogue, comparison, relationship, and the search for balance and mutual understanding. Venus rules the house, so learning is organized through harmony, aesthetics, diplomacy, and the exchange of ideas."
      },
      "description": "Speech and local experience become cardinal air: communication begins through dialogue, comparison, relationship, and the search for balance and mutual understanding. Venus rules the house, so learning is organized through harmony, aesthetics, diplomacy, and the exchange of ideas."
    },
    {
      "id": "leo-rising-house-4-scorpio",
      "risingSign": "Leo",
      "offsetSet": 5,
      "symbolicDisplacementFromNatural": 4,
      "houseNumber": 4,
      "houseName": "House Four",
      "sign": "Scorpio",
      "title": "Scorpio as House Four",
      "ingredients": {
        "houseField": "home, roots, ancestry, foundation, memory, and belonging",
        "signStructure": {
          "element": "water",
          "modality": "fixed",
          "combined": "fixed water"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Four supplies home, roots, ancestry, foundation, memory, and belonging.",
        "signLayer": "Scorpio supplies fixed water.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "Home becomes fixed water: roots deepen through loyalty, emotional intensity, privacy, and bonds that endure transformation and loss. Mars rules the house traditionally, so foundation is organized through courage, protection, and the willingness to confront what lies beneath the surface of family and memory."
      },
      "description": "Home becomes fixed water: roots deepen through loyalty, emotional intensity, privacy, and bonds that endure transformation and loss. Mars rules the house traditionally, so foundation is organized through courage, protection, and the willingness to confront what lies beneath the surface of family and memory."
    },
    {
      "id": "leo-rising-house-5-sagittarius",
      "risingSign": "Leo",
      "offsetSet": 5,
      "symbolicDisplacementFromNatural": 4,
      "houseNumber": 5,
      "houseName": "House Five",
      "sign": "Sagittarius",
      "title": "Sagittarius as House Five",
      "ingredients": {
        "houseField": "pleasure, play, creativity, romance, children, risk, and self-expression",
        "signStructure": {
          "element": "fire",
          "modality": "mutable",
          "combined": "mutable fire"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Five supplies pleasure, play, creativity, romance, children, risk, and self-expression.",
        "signLayer": "Sagittarius supplies mutable fire.",
        "rulerLayer": "Jupiter supplies the organizing mechanism.",
        "result": "Pleasure becomes mutable fire: creativity and play seek adventure, meaning, exploration, and the joy of expanding beyond familiar limits. Jupiter rules the house, so delight is organized through generosity, teaching, discovery, and the celebration of possibility."
      },
      "description": "Pleasure becomes mutable fire: creativity and play seek adventure, meaning, exploration, and the joy of expanding beyond familiar limits. Jupiter rules the house, so delight is organized through generosity, teaching, discovery, and the celebration of possibility."
    },
    {
      "id": "leo-rising-house-6-capricorn",
      "risingSign": "Leo",
      "offsetSet": 5,
      "symbolicDisplacementFromNatural": 4,
      "houseNumber": 6,
      "houseName": "House Six",
      "sign": "Capricorn",
      "title": "Capricorn as House Six",
      "ingredients": {
        "houseField": "work, maintenance, service, health, routine, labor, and repair",
        "signStructure": {
          "element": "earth",
          "modality": "cardinal",
          "combined": "cardinal earth"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Six supplies work, maintenance, service, health, routine, labor, and repair.",
        "signLayer": "Capricorn supplies cardinal earth.",
        "rulerLayer": "Saturn supplies the organizing mechanism.",
        "result": "Work and maintenance become cardinal earth: daily life takes shape through discipline, responsibility, structure, and sustained effort. Saturn rules the house, so labor is organized through duty, endurance, accountability, and the careful management of time and resources."
      },
      "description": "Work and maintenance become cardinal earth: daily life takes shape through discipline, responsibility, structure, and sustained effort. Saturn rules the house, so labor is organized through duty, endurance, accountability, and the careful management of time and resources."
    },
    {
      "id": "leo-rising-house-7-aquarius",
      "risingSign": "Leo",
      "offsetSet": 5,
      "symbolicDisplacementFromNatural": 4,
      "houseNumber": 7,
      "houseName": "House Seven",
      "sign": "Aquarius",
      "title": "Aquarius as House Seven",
      "ingredients": {
        "houseField": "partnership, mirrors, agreements, contracts, equality, and the other",
        "signStructure": {
          "element": "air",
          "modality": "fixed",
          "combined": "fixed air"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Seven supplies partnership, mirrors, agreements, contracts, equality, and the other.",
        "signLayer": "Aquarius supplies fixed air.",
        "rulerLayer": "Saturn supplies the organizing mechanism traditionally.",
        "result": "Partnership becomes fixed air: relationships stabilize through shared principles, friendship, intellectual connection, and commitment to a larger vision. Saturn rules the house traditionally, so union is organized through boundaries, long-term agreements, and the creation of enduring social structures."
      },
      "description": "Partnership becomes fixed air: relationships stabilize through shared principles, friendship, intellectual connection, and commitment to a larger vision. Saturn rules the house traditionally, so union is organized through boundaries, long-term agreements, and the creation of enduring social structures."
    },
    {
      "id": "leo-rising-house-8-pisces",
      "risingSign": "Leo",
      "offsetSet": 5,
      "symbolicDisplacementFromNatural": 4,
      "houseNumber": 8,
      "houseName": "House Eight",
      "sign": "Pisces",
      "title": "Pisces as House Eight",
      "ingredients": {
        "houseField": "intimacy, shared resources, debt, death, inheritance, and transformation",
        "signStructure": {
          "element": "water",
          "modality": "mutable",
          "combined": "mutable water"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eight supplies intimacy, shared resources, debt, death, inheritance, and transformation.",
        "signLayer": "Pisces supplies mutable water.",
        "rulerLayer": "Jupiter supplies the organizing mechanism traditionally.",
        "result": "Entanglement becomes mutable water: intimacy, shared resources, and transformation flow through compassion, surrender, imagination, and emotional permeability. Jupiter rules the house traditionally, so deep change is organized through faith, mercy, and the search for meaning within loss and renewal."
      },
      "description": "Entanglement becomes mutable water: intimacy, shared resources, and transformation flow through compassion, surrender, imagination, and emotional permeability. Jupiter rules the house traditionally, so deep change is organized through faith, mercy, and the search for meaning within loss and renewal."
    },
    {
      "id": "leo-rising-house-9-aries",
      "risingSign": "Leo",
      "offsetSet": 5,
      "symbolicDisplacementFromNatural": 4,
      "houseNumber": 9,
      "houseName": "House Nine",
      "sign": "Aries",
      "title": "Aries as House Nine",
      "ingredients": {
        "houseField": "belief, philosophy, travel, law, teaching, higher learning, and meaning",
        "signStructure": {
          "element": "fire",
          "modality": "cardinal",
          "combined": "cardinal fire"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Nine supplies belief, philosophy, travel, law, teaching, higher learning, and meaning.",
        "signLayer": "Aries supplies cardinal fire.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "Belief becomes cardinal fire: philosophy and higher learning begin through initiative, direct experience, courage, and the impulse to seek new horizons. Mars rules the house, so understanding is organized through action, challenge, and the willingness to venture into unknown territory."
      },
      "description": "Belief becomes cardinal fire: philosophy and higher learning begin through initiative, direct experience, courage, and the impulse to seek new horizons. Mars rules the house, so understanding is organized through action, challenge, and the willingness to venture into unknown territory."
    },
    {
      "id": "leo-rising-house-10-taurus",
      "risingSign": "Leo",
      "offsetSet": 5,
      "symbolicDisplacementFromNatural": 4,
      "houseNumber": 10,
      "houseName": "House Ten",
      "sign": "Taurus",
      "title": "Taurus as House Ten",
      "ingredients": {
        "houseField": "vocation, public life, authority, visibility, achievement, and consequence",
        "signStructure": {
          "element": "earth",
          "modality": "fixed",
          "combined": "fixed earth"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Ten supplies vocation, public life, authority, visibility, achievement, and consequence.",
        "signLayer": "Taurus supplies fixed earth.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "Vocation becomes fixed earth: public life stabilizes through reliability, craftsmanship, stewardship, and the cultivation of lasting achievements. Venus rules the house, so authority is organized through value, beauty, patience, and the creation of tangible and enduring results."
      },
      "description": "Vocation becomes fixed earth: public life stabilizes through reliability, craftsmanship, stewardship, and the cultivation of lasting achievements. Venus rules the house, so authority is organized through value, beauty, patience, and the creation of tangible and enduring results."
    },
    {
      "id": "leo-rising-house-11-gemini",
      "risingSign": "Leo",
      "offsetSet": 5,
      "symbolicDisplacementFromNatural": 4,
      "houseNumber": 11,
      "houseName": "House Eleven",
      "sign": "Gemini",
      "title": "Gemini as House Eleven",
      "ingredients": {
        "houseField": "community, friends, groups, hopes, networks, and shared futures",
        "signStructure": {
          "element": "air",
          "modality": "mutable",
          "combined": "mutable air"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eleven supplies community, friends, groups, hopes, networks, and shared futures.",
        "signLayer": "Gemini supplies mutable air.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "Community becomes mutable air: friendships and aspirations multiply through conversation, networks, learning, and the exchange of ideas. Mercury rules the house, so belonging is organized through communication, adaptability, and the weaving together of diverse people and perspectives."
      },
      "description": "Community becomes mutable air: friendships and aspirations multiply through conversation, networks, learning, and the exchange of ideas. Mercury rules the house, so belonging is organized through communication, adaptability, and the weaving together of diverse people and perspectives."
    },
    {
      "id": "leo-rising-house-12-cancer",
      "risingSign": "Leo",
      "offsetSet": 5,
      "symbolicDisplacementFromNatural": 4,
      "houseNumber": 12,
      "houseName": "House Twelve",
      "sign": "Cancer",
      "title": "Cancer as House Twelve",
      "ingredients": {
        "houseField": "solitude, retreat, hidden things, sorrow, dream, undoing, and release",
        "signStructure": {
          "element": "water",
          "modality": "cardinal",
          "combined": "cardinal water"
        },
        "ruler": {
          "planet": "Moon",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Twelve supplies solitude, retreat, hidden things, sorrow, dream, undoing, and release.",
        "signLayer": "Cancer supplies cardinal water.",
        "rulerLayer": "Moon supplies the organizing mechanism.",
        "result": "The hidden realm becomes cardinal water: solitude, retreat, and release become places of memory, feeling, protection, and the return to emotional origins. The Moon rules the house, so surrender is organized through rhythms of need, remembrance, and the restoration of inner belonging."
      },
      "description": "The hidden realm becomes cardinal water: solitude, retreat, and release become places of memory, feeling, protection, and the return to emotional origins. The Moon rules the house, so surrender is organized through rhythms of need, remembrance, and the restoration of inner belonging."
    },
    {
      "id": "virgo-rising-house-1-virgo",
      "risingSign": "Virgo",
      "offsetSet": 6,
      "symbolicDisplacementFromNatural": 5,
      "houseNumber": 1,
      "houseName": "House One",
      "sign": "Virgo",
      "title": "Virgo as House One",
      "ingredients": {
        "houseField": "self, body, appearance, identity, and immediate orientation",
        "signStructure": {
          "element": "earth",
          "modality": "mutable",
          "combined": "mutable earth"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House One supplies self, body, appearance, identity, and immediate orientation.",
        "signLayer": "Virgo supplies mutable earth.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "The self becomes mutable earth: identity is organized through refinement, adjustment, usefulness, and the continual improvement of embodied life. Mercury rules the house, so the body and persona are shaped through observation, discernment, method, and the intelligent management of practical realities."
      },
      "description": "The self becomes mutable earth: identity is organized through refinement, adjustment, usefulness, and the continual improvement of embodied life. Mercury rules the house, so the body and persona are shaped through observation, discernment, method, and the intelligent management of practical realities."
    },
    {
      "id": "virgo-rising-house-2-libra",
      "risingSign": "Virgo",
      "offsetSet": 6,
      "symbolicDisplacementFromNatural": 5,
      "houseNumber": 2,
      "houseName": "House Two",
      "sign": "Libra",
      "title": "Libra as House Two",
      "ingredients": {
        "houseField": "resources, value, money, food, possession, and survival support",
        "signStructure": {
          "element": "air",
          "modality": "cardinal",
          "combined": "cardinal air"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Two supplies resources, value, money, food, possession, and survival support.",
        "signLayer": "Libra supplies cardinal air.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "Resources become cardinal air: value is established through relationship, exchange, beauty, fairness, and the creation of balance between self and other. Venus rules the house, so survival is organized through attraction, cooperation, and the cultivation of mutually beneficial arrangements."
      },
      "description": "Resources become cardinal air: value is established through relationship, exchange, beauty, fairness, and the creation of balance between self and other. Venus rules the house, so survival is organized through attraction, cooperation, and the cultivation of mutually beneficial arrangements."
    },
    {
      "id": "virgo-rising-house-3-scorpio",
      "risingSign": "Virgo",
      "offsetSet": 6,
      "symbolicDisplacementFromNatural": 5,
      "houseNumber": 3,
      "houseName": "House Three",
      "sign": "Scorpio",
      "title": "Scorpio as House Three",
      "ingredients": {
        "houseField": "speech, learning, siblings, neighbors, messages, and local movement",
        "signStructure": {
          "element": "water",
          "modality": "fixed",
          "combined": "fixed water"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Three supplies speech, learning, siblings, neighbors, messages, and local movement.",
        "signLayer": "Scorpio supplies fixed water.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "Speech and local experience become fixed water: learning deepens through emotional intensity, secrecy, loyalty, and the desire to penetrate beneath appearances. Mars rules the house traditionally, so the mind is organized through courage, investigation, and the willingness to engage difficult truths."
      },
      "description": "Speech and local experience become fixed water: learning deepens through emotional intensity, secrecy, loyalty, and the desire to penetrate beneath appearances. Mars rules the house traditionally, so the mind is organized through courage, investigation, and the willingness to engage difficult truths."
    },
    {
      "id": "virgo-rising-house-4-sagittarius",
      "risingSign": "Virgo",
      "offsetSet": 6,
      "symbolicDisplacementFromNatural": 5,
      "houseNumber": 4,
      "houseName": "House Four",
      "sign": "Sagittarius",
      "title": "Sagittarius as House Four",
      "ingredients": {
        "houseField": "home, roots, ancestry, foundation, memory, and belonging",
        "signStructure": {
          "element": "fire",
          "modality": "mutable",
          "combined": "mutable fire"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Four supplies home, roots, ancestry, foundation, memory, and belonging.",
        "signLayer": "Sagittarius supplies mutable fire.",
        "rulerLayer": "Jupiter supplies the organizing mechanism.",
        "result": "Home becomes mutable fire: roots expand through exploration, philosophy, teaching, and the search for meaning beyond inherited boundaries. Jupiter rules the house, so foundation is organized through faith, generosity, and the continual broadening of one's sense of belonging."
      },
      "description": "Home becomes mutable fire: roots expand through exploration, philosophy, teaching, and the search for meaning beyond inherited boundaries. Jupiter rules the house, so foundation is organized through faith, generosity, and the continual broadening of one's sense of belonging."
    },
    {
      "id": "virgo-rising-house-5-capricorn",
      "risingSign": "Virgo",
      "offsetSet": 6,
      "symbolicDisplacementFromNatural": 5,
      "houseNumber": 5,
      "houseName": "House Five",
      "sign": "Capricorn",
      "title": "Capricorn as House Five",
      "ingredients": {
        "houseField": "pleasure, play, creativity, romance, children, risk, and self-expression",
        "signStructure": {
          "element": "earth",
          "modality": "cardinal",
          "combined": "cardinal earth"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Five supplies pleasure, play, creativity, romance, children, risk, and self-expression.",
        "signLayer": "Capricorn supplies cardinal earth.",
        "rulerLayer": "Saturn supplies the organizing mechanism.",
        "result": "Pleasure becomes cardinal earth: creativity and joy take form through discipline, craftsmanship, responsibility, and the patient building of something enduring. Saturn rules the house, so delight is organized through commitment, mastery, and the satisfaction of meaningful achievement."
      },
      "description": "Pleasure becomes cardinal earth: creativity and joy take form through discipline, craftsmanship, responsibility, and the patient building of something enduring. Saturn rules the house, so delight is organized through commitment, mastery, and the satisfaction of meaningful achievement."
    },
    {
      "id": "virgo-rising-house-6-aquarius",
      "risingSign": "Virgo",
      "offsetSet": 6,
      "symbolicDisplacementFromNatural": 5,
      "houseNumber": 6,
      "houseName": "House Six",
      "sign": "Aquarius",
      "title": "Aquarius as House Six",
      "ingredients": {
        "houseField": "work, maintenance, service, health, routine, labor, and repair",
        "signStructure": {
          "element": "air",
          "modality": "fixed",
          "combined": "fixed air"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Six supplies work, maintenance, service, health, routine, labor, and repair.",
        "signLayer": "Aquarius supplies fixed air.",
        "rulerLayer": "Saturn supplies the organizing mechanism traditionally.",
        "result": "Work and maintenance become fixed air: daily life stabilizes through systems, principles, innovation, and the improvement of collective structures. Saturn rules the house traditionally, so labor is organized through responsibility, long-term thinking, and the creation of coherent and durable methods."
      },
      "description": "Work and maintenance become fixed air: daily life stabilizes through systems, principles, innovation, and the improvement of collective structures. Saturn rules the house traditionally, so labor is organized through responsibility, long-term thinking, and the creation of coherent and durable methods."
    },
    {
      "id": "virgo-rising-house-7-pisces",
      "risingSign": "Virgo",
      "offsetSet": 6,
      "symbolicDisplacementFromNatural": 5,
      "houseNumber": 7,
      "houseName": "House Seven",
      "sign": "Pisces",
      "title": "Pisces as House Seven",
      "ingredients": {
        "houseField": "partnership, mirrors, agreements, contracts, equality, and the other",
        "signStructure": {
          "element": "water",
          "modality": "mutable",
          "combined": "mutable water"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Seven supplies partnership, mirrors, agreements, contracts, equality, and the other.",
        "signLayer": "Pisces supplies mutable water.",
        "rulerLayer": "Jupiter supplies the organizing mechanism traditionally.",
        "result": "Partnership becomes mutable water: relationships flow through compassion, imagination, sensitivity, and the softening of rigid boundaries between self and other. Jupiter rules the house traditionally, so union is organized through faith, mercy, and a shared search for meaning and transcendence."
      },
      "description": "Partnership becomes mutable water: relationships flow through compassion, imagination, sensitivity, and the softening of rigid boundaries between self and other. Jupiter rules the house traditionally, so union is organized through faith, mercy, and a shared search for meaning and transcendence."
    },
    {
      "id": "virgo-rising-house-8-aries",
      "risingSign": "Virgo",
      "offsetSet": 6,
      "symbolicDisplacementFromNatural": 5,
      "houseNumber": 8,
      "houseName": "House Eight",
      "sign": "Aries",
      "title": "Aries as House Eight",
      "ingredients": {
        "houseField": "intimacy, shared resources, debt, death, inheritance, and transformation",
        "signStructure": {
          "element": "fire",
          "modality": "cardinal",
          "combined": "cardinal fire"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eight supplies intimacy, shared resources, debt, death, inheritance, and transformation.",
        "signLayer": "Aries supplies cardinal fire.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "Entanglement becomes cardinal fire: intimacy, shared resources, and transformation begin through courage, confrontation, desire, and decisive encounters with change. Mars rules the house, so deep bonds are organized through action, intensity, and the willingness to move directly into what cannot be avoided."
      },
      "description": "Entanglement becomes cardinal fire: intimacy, shared resources, and transformation begin through courage, confrontation, desire, and decisive encounters with change. Mars rules the house, so deep bonds are organized through action, intensity, and the willingness to move directly into what cannot be avoided."
    },
    {
      "id": "virgo-rising-house-9-taurus",
      "risingSign": "Virgo",
      "offsetSet": 6,
      "symbolicDisplacementFromNatural": 5,
      "houseNumber": 9,
      "houseName": "House Nine",
      "sign": "Taurus",
      "title": "Taurus as House Nine",
      "ingredients": {
        "houseField": "belief, philosophy, travel, law, teaching, higher learning, and meaning",
        "signStructure": {
          "element": "earth",
          "modality": "fixed",
          "combined": "fixed earth"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Nine supplies belief, philosophy, travel, law, teaching, higher learning, and meaning.",
        "signLayer": "Taurus supplies fixed earth.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "Belief becomes fixed earth: philosophy and higher learning stabilize through practical wisdom, lived experience, sensory understanding, and values that endure over time. Venus rules the house, so understanding is organized through appreciation, cultivation, and the search for a meaningful and beautiful life."
      },
      "description": "Belief becomes fixed earth: philosophy and higher learning stabilize through practical wisdom, lived experience, sensory understanding, and values that endure over time. Venus rules the house, so understanding is organized through appreciation, cultivation, and the search for a meaningful and beautiful life."
    },
    {
      "id": "virgo-rising-house-10-gemini",
      "risingSign": "Virgo",
      "offsetSet": 6,
      "symbolicDisplacementFromNatural": 5,
      "houseNumber": 10,
      "houseName": "House Ten",
      "sign": "Gemini",
      "title": "Gemini as House Ten",
      "ingredients": {
        "houseField": "vocation, public life, authority, visibility, achievement, and consequence",
        "signStructure": {
          "element": "air",
          "modality": "mutable",
          "combined": "mutable air"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Ten supplies vocation, public life, authority, visibility, achievement, and consequence.",
        "signLayer": "Gemini supplies mutable air.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "Vocation becomes mutable air: public life evolves through communication, teaching, writing, networking, and the ability to connect diverse ideas and people. Mercury rules the house, so authority is organized through language, adaptability, and the skillful exchange of information."
      },
      "description": "Vocation becomes mutable air: public life evolves through communication, teaching, writing, networking, and the ability to connect diverse ideas and people. Mercury rules the house, so authority is organized through language, adaptability, and the skillful exchange of information."
    },
    {
      "id": "virgo-rising-house-11-cancer",
      "risingSign": "Virgo",
      "offsetSet": 6,
      "symbolicDisplacementFromNatural": 5,
      "houseNumber": 11,
      "houseName": "House Eleven",
      "sign": "Cancer",
      "title": "Cancer as House Eleven",
      "ingredients": {
        "houseField": "community, friends, groups, hopes, networks, and shared futures",
        "signStructure": {
          "element": "water",
          "modality": "cardinal",
          "combined": "cardinal water"
        },
        "ruler": {
          "planet": "Moon",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eleven supplies community, friends, groups, hopes, networks, and shared futures.",
        "signLayer": "Cancer supplies cardinal water.",
        "rulerLayer": "Moon supplies the organizing mechanism.",
        "result": "Community becomes cardinal water: friendships and aspirations begin through care, protection, emotional bonds, and the creation of places of belonging. The Moon rules the house, so participation in groups is organized through shared feeling, memory, and responsiveness to collective needs."
      },
      "description": "Community becomes cardinal water: friendships and aspirations begin through care, protection, emotional bonds, and the creation of places of belonging. The Moon rules the house, so participation in groups is organized through shared feeling, memory, and responsiveness to collective needs."
    },
    {
      "id": "virgo-rising-house-12-leo",
      "risingSign": "Virgo",
      "offsetSet": 6,
      "symbolicDisplacementFromNatural": 5,
      "houseNumber": 12,
      "houseName": "House Twelve",
      "sign": "Leo",
      "title": "Leo as House Twelve",
      "ingredients": {
        "houseField": "solitude, retreat, hidden things, sorrow, dream, undoing, and release",
        "signStructure": {
          "element": "fire",
          "modality": "fixed",
          "combined": "fixed fire"
        },
        "ruler": {
          "planet": "Sun",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Twelve supplies solitude, retreat, hidden things, sorrow, dream, undoing, and release.",
        "signLayer": "Leo supplies fixed fire.",
        "rulerLayer": "Sun supplies the organizing mechanism.",
        "result": "The hidden realm becomes fixed fire: solitude, retreat, and release become places where creativity, identity, and inner vitality are preserved beyond public visibility. The Sun rules the house, so surrender is organized through the rediscovery of one's inner light and the quiet integration of the self's deepest radiance."
      },
      "description": "The hidden realm becomes fixed fire: solitude, retreat, and release become places where creativity, identity, and inner vitality are preserved beyond public visibility. The Sun rules the house, so surrender is organized through the rediscovery of one's inner light and the quiet integration of the self's deepest radiance."
    },
    {
      "id": "libra-rising-house-1-libra",
      "risingSign": "Libra",
      "offsetSet": 7,
      "symbolicDisplacementFromNatural": 6,
      "houseNumber": 1,
      "houseName": "House One",
      "sign": "Libra",
      "title": "Libra as House One",
      "ingredients": {
        "houseField": "self, body, appearance, identity, and immediate orientation",
        "signStructure": {
          "element": "air",
          "modality": "cardinal",
          "combined": "cardinal air"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House One supplies self, body, appearance, identity, and immediate orientation.",
        "signLayer": "Libra supplies cardinal air.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "The self becomes cardinal air: identity emerges through relationship, comparison, balance, and the impulse to create harmony between differing perspectives. Venus rules the house, so the body and persona are organized through attraction, beauty, reciprocity, and the cultivation of meaningful connections."
      },
      "description": "The self becomes cardinal air: identity emerges through relationship, comparison, balance, and the impulse to create harmony between differing perspectives. Venus rules the house, so the body and persona are organized through attraction, beauty, reciprocity, and the cultivation of meaningful connections."
    },
    {
      "id": "libra-rising-house-2-scorpio",
      "risingSign": "Libra",
      "offsetSet": 7,
      "symbolicDisplacementFromNatural": 6,
      "houseNumber": 2,
      "houseName": "House Two",
      "sign": "Scorpio",
      "title": "Scorpio as House Two",
      "ingredients": {
        "houseField": "resources, value, money, food, possession, and survival support",
        "signStructure": {
          "element": "water",
          "modality": "fixed",
          "combined": "fixed water"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Two supplies resources, value, money, food, possession, and survival support.",
        "signLayer": "Scorpio supplies fixed water.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "Resources become fixed water: value deepens through emotional investment, loyalty, shared bonds, and the willingness to commit completely to what matters. Mars rules the house traditionally, so survival is organized through courage, intensity, resourcefulness, and the management of what is hidden or held in reserve."
      },
      "description": "Resources become fixed water: value deepens through emotional investment, loyalty, shared bonds, and the willingness to commit completely to what matters. Mars rules the house traditionally, so survival is organized through courage, intensity, resourcefulness, and the management of what is hidden or held in reserve."
    },
    {
      "id": "libra-rising-house-3-sagittarius",
      "risingSign": "Libra",
      "offsetSet": 7,
      "symbolicDisplacementFromNatural": 6,
      "houseNumber": 3,
      "houseName": "House Three",
      "sign": "Sagittarius",
      "title": "Sagittarius as House Three",
      "ingredients": {
        "houseField": "speech, learning, siblings, neighbors, messages, and local movement",
        "signStructure": {
          "element": "fire",
          "modality": "mutable",
          "combined": "mutable fire"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Three supplies speech, learning, siblings, neighbors, messages, and local movement.",
        "signLayer": "Sagittarius supplies mutable fire.",
        "rulerLayer": "Jupiter supplies the organizing mechanism.",
        "result": "Speech and local experience become mutable fire: learning expands through stories, philosophy, teaching, travel, and the continual search for broader meaning. Jupiter rules the house, so the mind is organized through synthesis, optimism, and the desire to connect facts to larger truths."
      },
      "description": "Speech and local experience become mutable fire: learning expands through stories, philosophy, teaching, travel, and the continual search for broader meaning. Jupiter rules the house, so the mind is organized through synthesis, optimism, and the desire to connect facts to larger truths."
    },
    {
      "id": "libra-rising-house-4-capricorn",
      "risingSign": "Libra",
      "offsetSet": 7,
      "symbolicDisplacementFromNatural": 6,
      "houseNumber": 4,
      "houseName": "House Four",
      "sign": "Capricorn",
      "title": "Capricorn as House Four",
      "ingredients": {
        "houseField": "home, roots, ancestry, foundation, memory, and belonging",
        "signStructure": {
          "element": "earth",
          "modality": "cardinal",
          "combined": "cardinal earth"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Four supplies home, roots, ancestry, foundation, memory, and belonging.",
        "signLayer": "Capricorn supplies cardinal earth.",
        "rulerLayer": "Saturn supplies the organizing mechanism.",
        "result": "Home becomes cardinal earth: roots are established through responsibility, structure, endurance, and the building of secure foundations that can withstand time and difficulty. Saturn rules the house, so belonging is organized through duty, commitment, and the patient cultivation of stability."
      },
      "description": "Home becomes cardinal earth: roots are established through responsibility, structure, endurance, and the building of secure foundations that can withstand time and difficulty. Saturn rules the house, so belonging is organized through duty, commitment, and the patient cultivation of stability."
    },
    {
      "id": "libra-rising-house-5-aquarius",
      "risingSign": "Libra",
      "offsetSet": 7,
      "symbolicDisplacementFromNatural": 6,
      "houseNumber": 5,
      "houseName": "House Five",
      "sign": "Aquarius",
      "title": "Aquarius as House Five",
      "ingredients": {
        "houseField": "pleasure, play, creativity, romance, children, risk, and self-expression",
        "signStructure": {
          "element": "air",
          "modality": "fixed",
          "combined": "fixed air"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Five supplies pleasure, play, creativity, romance, children, risk, and self-expression.",
        "signLayer": "Aquarius supplies fixed air.",
        "rulerLayer": "Saturn supplies the organizing mechanism traditionally.",
        "result": "Pleasure becomes fixed air: creativity stabilizes through ideas, experimentation, friendship, and the expression of individuality within larger patterns and communities. Saturn rules the house traditionally, so joy is organized through principles, long-term projects, and contributions that extend beyond personal gratification."
      },
      "description": "Pleasure becomes fixed air: creativity stabilizes through ideas, experimentation, friendship, and the expression of individuality within larger patterns and communities. Saturn rules the house traditionally, so joy is organized through principles, long-term projects, and contributions that extend beyond personal gratification."
    },
    {
      "id": "libra-rising-house-6-pisces",
      "risingSign": "Libra",
      "offsetSet": 7,
      "symbolicDisplacementFromNatural": 6,
      "houseNumber": 6,
      "houseName": "House Six",
      "sign": "Pisces",
      "title": "Pisces as House Six",
      "ingredients": {
        "houseField": "work, maintenance, service, health, routine, labor, and repair",
        "signStructure": {
          "element": "water",
          "modality": "mutable",
          "combined": "mutable water"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Six supplies work, maintenance, service, health, routine, labor, and repair.",
        "signLayer": "Pisces supplies mutable water.",
        "rulerLayer": "Jupiter supplies the organizing mechanism traditionally.",
        "result": "Work and maintenance become mutable water: daily life flows through compassion, intuition, imagination, and sensitivity to what cannot be measured or strictly defined. Jupiter rules the house traditionally, so labor is organized through mercy, faith, and the search for meaningful service."
      },
      "description": "Work and maintenance become mutable water: daily life flows through compassion, intuition, imagination, and sensitivity to what cannot be measured or strictly defined. Jupiter rules the house traditionally, so labor is organized through mercy, faith, and the search for meaningful service."
    },
    {
      "id": "libra-rising-house-7-aries",
      "risingSign": "Libra",
      "offsetSet": 7,
      "symbolicDisplacementFromNatural": 6,
      "houseNumber": 7,
      "houseName": "House Seven",
      "sign": "Aries",
      "title": "Aries as House Seven",
      "ingredients": {
        "houseField": "partnership, mirrors, agreements, contracts, equality, and the other",
        "signStructure": {
          "element": "fire",
          "modality": "cardinal",
          "combined": "cardinal fire"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Seven supplies partnership, mirrors, agreements, contracts, equality, and the other.",
        "signLayer": "Aries supplies cardinal fire.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "Partnership becomes cardinal fire: relationships begin through directness, courage, initiative, and the willingness to meet another person dynamically and honestly. Mars rules the house, so union is organized through action, challenge, passion, and the mutual encouragement to grow stronger through engagement."
      },
      "description": "Partnership becomes cardinal fire: relationships begin through directness, courage, initiative, and the willingness to meet another person dynamically and honestly. Mars rules the house, so union is organized through action, challenge, passion, and the mutual encouragement to grow stronger through engagement."
    },
    {
      "id": "libra-rising-house-8-taurus",
      "risingSign": "Libra",
      "offsetSet": 7,
      "symbolicDisplacementFromNatural": 6,
      "houseNumber": 8,
      "houseName": "House Eight",
      "sign": "Taurus",
      "title": "Taurus as House Eight",
      "ingredients": {
        "houseField": "intimacy, shared resources, debt, death, inheritance, and transformation",
        "signStructure": {
          "element": "earth",
          "modality": "fixed",
          "combined": "fixed earth"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eight supplies intimacy, shared resources, debt, death, inheritance, and transformation.",
        "signLayer": "Taurus supplies fixed earth.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "Entanglement becomes fixed earth: intimacy, shared resources, and transformation deepen through loyalty, steadiness, material support, and enduring bonds. Venus rules the house, so profound change is organized through trust, patience, and the careful cultivation of what is shared."
      },
      "description": "Entanglement becomes fixed earth: intimacy, shared resources, and transformation deepen through loyalty, steadiness, material support, and enduring bonds. Venus rules the house, so profound change is organized through trust, patience, and the careful cultivation of what is shared."
    },
    {
      "id": "libra-rising-house-9-gemini",
      "risingSign": "Libra",
      "offsetSet": 7,
      "symbolicDisplacementFromNatural": 6,
      "houseNumber": 9,
      "houseName": "House Nine",
      "sign": "Gemini",
      "title": "Gemini as House Nine",
      "ingredients": {
        "houseField": "belief, philosophy, travel, law, teaching, higher learning, and meaning",
        "signStructure": {
          "element": "air",
          "modality": "mutable",
          "combined": "mutable air"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Nine supplies belief, philosophy, travel, law, teaching, higher learning, and meaning.",
        "signLayer": "Gemini supplies mutable air.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "Belief becomes mutable air: philosophy and higher learning branch into questions, conversations, comparisons, and the exploration of many possible perspectives. Mercury rules the house, so understanding is organized through language, curiosity, and the continual refinement of ideas."
      },
      "description": "Belief becomes mutable air: philosophy and higher learning branch into questions, conversations, comparisons, and the exploration of many possible perspectives. Mercury rules the house, so understanding is organized through language, curiosity, and the continual refinement of ideas."
    },
    {
      "id": "libra-rising-house-10-cancer",
      "risingSign": "Libra",
      "offsetSet": 7,
      "symbolicDisplacementFromNatural": 6,
      "houseNumber": 10,
      "houseName": "House Ten",
      "sign": "Cancer",
      "title": "Cancer as House Ten",
      "ingredients": {
        "houseField": "vocation, public life, authority, visibility, achievement, and consequence",
        "signStructure": {
          "element": "water",
          "modality": "cardinal",
          "combined": "cardinal water"
        },
        "ruler": {
          "planet": "Moon",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Ten supplies vocation, public life, authority, visibility, achievement, and consequence.",
        "signLayer": "Cancer supplies cardinal water.",
        "rulerLayer": "Moon supplies the organizing mechanism.",
        "result": "Vocation becomes cardinal water: public life takes shape through care, protection, responsiveness, and the ability to nurture others or create a sense of belonging. The Moon rules the house, so authority is organized through emotional intelligence, memory, and attentiveness to changing needs."
      },
      "description": "Vocation becomes cardinal water: public life takes shape through care, protection, responsiveness, and the ability to nurture others or create a sense of belonging. The Moon rules the house, so authority is organized through emotional intelligence, memory, and attentiveness to changing needs."
    },
    {
      "id": "libra-rising-house-11-leo",
      "risingSign": "Libra",
      "offsetSet": 7,
      "symbolicDisplacementFromNatural": 6,
      "houseNumber": 11,
      "houseName": "House Eleven",
      "sign": "Leo",
      "title": "Leo as House Eleven",
      "ingredients": {
        "houseField": "community, friends, groups, hopes, networks, and shared futures",
        "signStructure": {
          "element": "fire",
          "modality": "fixed",
          "combined": "fixed fire"
        },
        "ruler": {
          "planet": "Sun",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eleven supplies community, friends, groups, hopes, networks, and shared futures.",
        "signLayer": "Leo supplies fixed fire.",
        "rulerLayer": "Sun supplies the organizing mechanism.",
        "result": "Community becomes fixed fire: friendships and aspirations stabilize through generosity, loyalty, creativity, and the desire to inspire and uplift the collective. The Sun rules the house, so belonging is organized through visibility, heartfelt leadership, and the expression of one's unique gifts within a group."
      },
      "description": "Community becomes fixed fire: friendships and aspirations stabilize through generosity, loyalty, creativity, and the desire to inspire and uplift the collective. The Sun rules the house, so belonging is organized through visibility, heartfelt leadership, and the expression of one's unique gifts within a group."
    },
    {
      "id": "libra-rising-house-12-virgo",
      "risingSign": "Libra",
      "offsetSet": 7,
      "symbolicDisplacementFromNatural": 6,
      "houseNumber": 12,
      "houseName": "House Twelve",
      "sign": "Virgo",
      "title": "Virgo as House Twelve",
      "ingredients": {
        "houseField": "solitude, retreat, hidden things, sorrow, dream, undoing, and release",
        "signStructure": {
          "element": "earth",
          "modality": "mutable",
          "combined": "mutable earth"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Twelve supplies solitude, retreat, hidden things, sorrow, dream, undoing, and release.",
        "signLayer": "Virgo supplies mutable earth.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "The hidden realm becomes mutable earth: solitude, retreat, and release become places of quiet refinement, inner work, healing, and the gradual reordering of what has become disordered. Mercury rules the house, so surrender is organized through understanding, discernment, and the patient integration of life's unfinished details."
      },
      "description": "The hidden realm becomes mutable earth: solitude, retreat, and release become places of quiet refinement, inner work, healing, and the gradual reordering of what has become disordered. Mercury rules the house, so surrender is organized through understanding, discernment, and the patient integration of life's unfinished details."
    },
    {
      "id": "scorpio-rising-house-1-scorpio",
      "risingSign": "Scorpio",
      "offsetSet": 8,
      "symbolicDisplacementFromNatural": 7,
      "houseNumber": 1,
      "houseName": "House One",
      "sign": "Scorpio",
      "title": "Scorpio as House One",
      "ingredients": {
        "houseField": "self, body, appearance, identity, and immediate orientation",
        "signStructure": {
          "element": "water",
          "modality": "fixed",
          "combined": "fixed water"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House One supplies self, body, appearance, identity, and immediate orientation.",
        "signLayer": "Scorpio supplies fixed water.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "The self becomes fixed water: identity stabilizes through emotional depth, loyalty, intensity, privacy, and the capacity to endure transformation. Mars rules the house traditionally, so the body and persona are organized through courage, desire, confrontation, and the willingness to move toward what others avoid."
      },
      "description": "The self becomes fixed water: identity stabilizes through emotional depth, loyalty, intensity, privacy, and the capacity to endure transformation. Mars rules the house traditionally, so the body and persona are organized through courage, desire, confrontation, and the willingness to move toward what others avoid."
    },
    {
      "id": "scorpio-rising-house-2-sagittarius",
      "risingSign": "Scorpio",
      "offsetSet": 8,
      "symbolicDisplacementFromNatural": 7,
      "houseNumber": 2,
      "houseName": "House Two",
      "sign": "Sagittarius",
      "title": "Sagittarius as House Two",
      "ingredients": {
        "houseField": "resources, value, money, food, possession, and survival support",
        "signStructure": {
          "element": "fire",
          "modality": "mutable",
          "combined": "mutable fire"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Two supplies resources, value, money, food, possession, and survival support.",
        "signLayer": "Sagittarius supplies mutable fire.",
        "rulerLayer": "Jupiter supplies the organizing mechanism.",
        "result": "Resources become mutable fire: value grows through exploration, learning, teaching, travel, and the pursuit of broader horizons. Jupiter rules the house, so survival is organized through faith, generosity, opportunity, and the continual expansion of one's understanding of abundance."
      },
      "description": "Resources become mutable fire: value grows through exploration, learning, teaching, travel, and the pursuit of broader horizons. Jupiter rules the house, so survival is organized through faith, generosity, opportunity, and the continual expansion of one's understanding of abundance."
    },
    {
      "id": "scorpio-rising-house-3-capricorn",
      "risingSign": "Scorpio",
      "offsetSet": 8,
      "symbolicDisplacementFromNatural": 7,
      "houseNumber": 3,
      "houseName": "House Three",
      "sign": "Capricorn",
      "title": "Capricorn as House Three",
      "ingredients": {
        "houseField": "speech, learning, siblings, neighbors, messages, and local movement",
        "signStructure": {
          "element": "earth",
          "modality": "cardinal",
          "combined": "cardinal earth"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Three supplies speech, learning, siblings, neighbors, messages, and local movement.",
        "signLayer": "Capricorn supplies cardinal earth.",
        "rulerLayer": "Saturn supplies the organizing mechanism.",
        "result": "Speech and local experience become cardinal earth: learning takes shape through discipline, structure, responsibility, and the practical application of knowledge. Saturn rules the house, so the mind is organized through patience, careful observation, and the gradual construction of understanding."
      },
      "description": "Speech and local experience become cardinal earth: learning takes shape through discipline, structure, responsibility, and the practical application of knowledge. Saturn rules the house, so the mind is organized through patience, careful observation, and the gradual construction of understanding."
    },
    {
      "id": "scorpio-rising-house-4-aquarius",
      "risingSign": "Scorpio",
      "offsetSet": 8,
      "symbolicDisplacementFromNatural": 7,
      "houseNumber": 4,
      "houseName": "House Four",
      "sign": "Aquarius",
      "title": "Aquarius as House Four",
      "ingredients": {
        "houseField": "home, roots, ancestry, foundation, memory, and belonging",
        "signStructure": {
          "element": "air",
          "modality": "fixed",
          "combined": "fixed air"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Four supplies home, roots, ancestry, foundation, memory, and belonging.",
        "signLayer": "Aquarius supplies fixed air.",
        "rulerLayer": "Saturn supplies the organizing mechanism traditionally.",
        "result": "Home becomes fixed air: roots stabilize through ideas, principles, friendship, and participation in systems larger than the individual or family. Saturn rules the house traditionally, so foundation is organized through enduring structures, shared responsibilities, and long-term visions of belonging."
      },
      "description": "Home becomes fixed air: roots stabilize through ideas, principles, friendship, and participation in systems larger than the individual or family. Saturn rules the house traditionally, so foundation is organized through enduring structures, shared responsibilities, and long-term visions of belonging."
    },
    {
      "id": "scorpio-rising-house-5-pisces",
      "risingSign": "Scorpio",
      "offsetSet": 8,
      "symbolicDisplacementFromNatural": 7,
      "houseNumber": 5,
      "houseName": "House Five",
      "sign": "Pisces",
      "title": "Pisces as House Five",
      "ingredients": {
        "houseField": "pleasure, play, creativity, romance, children, risk, and self-expression",
        "signStructure": {
          "element": "water",
          "modality": "mutable",
          "combined": "mutable water"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Five supplies pleasure, play, creativity, romance, children, risk, and self-expression.",
        "signLayer": "Pisces supplies mutable water.",
        "rulerLayer": "Jupiter supplies the organizing mechanism traditionally.",
        "result": "Pleasure becomes mutable water: creativity and joy flow through imagination, compassion, dream, and the softening of ordinary boundaries. Jupiter rules the house traditionally, so delight is organized through faith, inspiration, and the search for transcendent meaning."
      },
      "description": "Pleasure becomes mutable water: creativity and joy flow through imagination, compassion, dream, and the softening of ordinary boundaries. Jupiter rules the house traditionally, so delight is organized through faith, inspiration, and the search for transcendent meaning."
    },
    {
      "id": "scorpio-rising-house-6-aries",
      "risingSign": "Scorpio",
      "offsetSet": 8,
      "symbolicDisplacementFromNatural": 7,
      "houseNumber": 6,
      "houseName": "House Six",
      "sign": "Aries",
      "title": "Aries as House Six",
      "ingredients": {
        "houseField": "work, maintenance, service, health, routine, labor, and repair",
        "signStructure": {
          "element": "fire",
          "modality": "cardinal",
          "combined": "cardinal fire"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Six supplies work, maintenance, service, health, routine, labor, and repair.",
        "signLayer": "Aries supplies cardinal fire.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "Work and maintenance become cardinal fire: daily life begins through initiative, action, challenge, and the direct engagement of problems. Mars rules the house, so labor is organized through decisiveness, courage, competition, and the desire to make immediate progress."
      },
      "description": "Work and maintenance become cardinal fire: daily life begins through initiative, action, challenge, and the direct engagement of problems. Mars rules the house, so labor is organized through decisiveness, courage, competition, and the desire to make immediate progress."
    },
    {
      "id": "scorpio-rising-house-7-taurus",
      "risingSign": "Scorpio",
      "offsetSet": 8,
      "symbolicDisplacementFromNatural": 7,
      "houseNumber": 7,
      "houseName": "House Seven",
      "sign": "Taurus",
      "title": "Taurus as House Seven",
      "ingredients": {
        "houseField": "partnership, mirrors, agreements, contracts, equality, and the other",
        "signStructure": {
          "element": "earth",
          "modality": "fixed",
          "combined": "fixed earth"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Seven supplies partnership, mirrors, agreements, contracts, equality, and the other.",
        "signLayer": "Taurus supplies fixed earth.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "Partnership becomes fixed earth: relationships deepen through loyalty, steadiness, sensuality, and the patient cultivation of trust. Venus rules the house, so union is organized through attraction, mutual support, and the creation of enduring value together."
      },
      "description": "Partnership becomes fixed earth: relationships deepen through loyalty, steadiness, sensuality, and the patient cultivation of trust. Venus rules the house, so union is organized through attraction, mutual support, and the creation of enduring value together."
    },
    {
      "id": "scorpio-rising-house-8-gemini",
      "risingSign": "Scorpio",
      "offsetSet": 8,
      "symbolicDisplacementFromNatural": 7,
      "houseNumber": 8,
      "houseName": "House Eight",
      "sign": "Gemini",
      "title": "Gemini as House Eight",
      "ingredients": {
        "houseField": "intimacy, shared resources, debt, death, inheritance, and transformation",
        "signStructure": {
          "element": "air",
          "modality": "mutable",
          "combined": "mutable air"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eight supplies intimacy, shared resources, debt, death, inheritance, and transformation.",
        "signLayer": "Gemini supplies mutable air.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "Entanglement becomes mutable air: intimacy, shared resources, and transformation unfold through conversation, understanding, curiosity, and the exchange of ideas and information. Mercury rules the house, so deep change is organized through naming, learning, and the continual reinterpretation of experience."
      },
      "description": "Entanglement becomes mutable air: intimacy, shared resources, and transformation unfold through conversation, understanding, curiosity, and the exchange of ideas and information. Mercury rules the house, so deep change is organized through naming, learning, and the continual reinterpretation of experience."
    },
    {
      "id": "scorpio-rising-house-9-cancer",
      "risingSign": "Scorpio",
      "offsetSet": 8,
      "symbolicDisplacementFromNatural": 7,
      "houseNumber": 9,
      "houseName": "House Nine",
      "sign": "Cancer",
      "title": "Cancer as House Nine",
      "ingredients": {
        "houseField": "belief, philosophy, travel, law, teaching, higher learning, and meaning",
        "signStructure": {
          "element": "water",
          "modality": "cardinal",
          "combined": "cardinal water"
        },
        "ruler": {
          "planet": "Moon",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Nine supplies belief, philosophy, travel, law, teaching, higher learning, and meaning.",
        "signLayer": "Cancer supplies cardinal water.",
        "rulerLayer": "Moon supplies the organizing mechanism.",
        "result": "Belief becomes cardinal water: philosophy and higher learning arise through memory, care, emotional significance, and the search for meaning that nurtures and protects life. The Moon rules the house, so understanding is organized through intuition, responsiveness, and a sense of belonging within larger patterns."
      },
      "description": "Belief becomes cardinal water: philosophy and higher learning arise through memory, care, emotional significance, and the search for meaning that nurtures and protects life. The Moon rules the house, so understanding is organized through intuition, responsiveness, and a sense of belonging within larger patterns."
    },
    {
      "id": "scorpio-rising-house-10-leo",
      "risingSign": "Scorpio",
      "offsetSet": 8,
      "symbolicDisplacementFromNatural": 7,
      "houseNumber": 10,
      "houseName": "House Ten",
      "sign": "Leo",
      "title": "Leo as House Ten",
      "ingredients": {
        "houseField": "vocation, public life, authority, visibility, achievement, and consequence",
        "signStructure": {
          "element": "fire",
          "modality": "fixed",
          "combined": "fixed fire"
        },
        "ruler": {
          "planet": "Sun",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Ten supplies vocation, public life, authority, visibility, achievement, and consequence.",
        "signLayer": "Leo supplies fixed fire.",
        "rulerLayer": "Sun supplies the organizing mechanism.",
        "result": "Vocation becomes fixed fire: public life stabilizes through creativity, visibility, generosity, and the desire to express one's essential nature before others. The Sun rules the house, so authority is organized through vitality, confidence, and the ability to inspire through personal presence."
      },
      "description": "Vocation becomes fixed fire: public life stabilizes through creativity, visibility, generosity, and the desire to express one's essential nature before others. The Sun rules the house, so authority is organized through vitality, confidence, and the ability to inspire through personal presence."
    },
    {
      "id": "scorpio-rising-house-11-virgo",
      "risingSign": "Scorpio",
      "offsetSet": 8,
      "symbolicDisplacementFromNatural": 7,
      "houseNumber": 11,
      "houseName": "House Eleven",
      "sign": "Virgo",
      "title": "Virgo as House Eleven",
      "ingredients": {
        "houseField": "community, friends, groups, hopes, networks, and shared futures",
        "signStructure": {
          "element": "earth",
          "modality": "mutable",
          "combined": "mutable earth"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eleven supplies community, friends, groups, hopes, networks, and shared futures.",
        "signLayer": "Virgo supplies mutable earth.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "Community becomes mutable earth: friendships and aspirations evolve through service, practical improvement, shared work, and the refinement of systems that benefit the group. Mercury rules the house, so belonging is organized through cooperation, analysis, and the intelligent coordination of collective efforts."
      },
      "description": "Community becomes mutable earth: friendships and aspirations evolve through service, practical improvement, shared work, and the refinement of systems that benefit the group. Mercury rules the house, so belonging is organized through cooperation, analysis, and the intelligent coordination of collective efforts."
    },
    {
      "id": "scorpio-rising-house-12-libra",
      "risingSign": "Scorpio",
      "offsetSet": 8,
      "symbolicDisplacementFromNatural": 7,
      "houseNumber": 12,
      "houseName": "House Twelve",
      "sign": "Libra",
      "title": "Libra as House Twelve",
      "ingredients": {
        "houseField": "solitude, retreat, hidden things, sorrow, dream, undoing, and release",
        "signStructure": {
          "element": "air",
          "modality": "cardinal",
          "combined": "cardinal air"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Twelve supplies solitude, retreat, hidden things, sorrow, dream, undoing, and release.",
        "signLayer": "Libra supplies cardinal air.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "The hidden realm becomes cardinal air: solitude, retreat, and release become places of reflection on relationship, balance, fairness, and the many ways self and other meet within the mind. Venus rules the house, so surrender is organized through reconciliation, beauty, and the restoration of inner harmony."
      },
      "description": "The hidden realm becomes cardinal air: solitude, retreat, and release become places of reflection on relationship, balance, fairness, and the many ways self and other meet within the mind. Venus rules the house, so surrender is organized through reconciliation, beauty, and the restoration of inner harmony."
    },
    {
      "id": "sagittarius-rising-house-1-sagittarius",
      "risingSign": "Sagittarius",
      "offsetSet": 9,
      "symbolicDisplacementFromNatural": 8,
      "houseNumber": 1,
      "houseName": "House One",
      "sign": "Sagittarius",
      "title": "Sagittarius as House One",
      "ingredients": {
        "houseField": "self, body, appearance, identity, and immediate orientation",
        "signStructure": {
          "element": "fire",
          "modality": "mutable",
          "combined": "mutable fire"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House One supplies self, body, appearance, identity, and immediate orientation.",
        "signLayer": "Sagittarius supplies mutable fire.",
        "rulerLayer": "Jupiter supplies the organizing mechanism.",
        "result": "The self becomes mutable fire: identity is organized through exploration, meaning, possibility, and the desire to move beyond present boundaries. Jupiter rules the house, so the body and persona are shaped through faith, generosity, teaching, and the continual expansion of perspective."
      },
      "description": "The self becomes mutable fire: identity is organized through exploration, meaning, possibility, and the desire to move beyond present boundaries. Jupiter rules the house, so the body and persona are shaped through faith, generosity, teaching, and the continual expansion of perspective."
    },
    {
      "id": "sagittarius-rising-house-2-capricorn",
      "risingSign": "Sagittarius",
      "offsetSet": 9,
      "symbolicDisplacementFromNatural": 8,
      "houseNumber": 2,
      "houseName": "House Two",
      "sign": "Capricorn",
      "title": "Capricorn as House Two",
      "ingredients": {
        "houseField": "resources, value, money, food, possession, and survival support",
        "signStructure": {
          "element": "earth",
          "modality": "cardinal",
          "combined": "cardinal earth"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Two supplies resources, value, money, food, possession, and survival support.",
        "signLayer": "Capricorn supplies cardinal earth.",
        "rulerLayer": "Saturn supplies the organizing mechanism.",
        "result": "Resources become cardinal earth: value is established through responsibility, discipline, structure, and the patient accumulation of lasting results. Saturn rules the house, so survival is organized through stewardship, restraint, commitment, and the wise management of limited resources."
      },
      "description": "Resources become cardinal earth: value is established through responsibility, discipline, structure, and the patient accumulation of lasting results. Saturn rules the house, so survival is organized through stewardship, restraint, commitment, and the wise management of limited resources."
    },
    {
      "id": "sagittarius-rising-house-3-aquarius",
      "risingSign": "Sagittarius",
      "offsetSet": 9,
      "symbolicDisplacementFromNatural": 8,
      "houseNumber": 3,
      "houseName": "House Three",
      "sign": "Aquarius",
      "title": "Aquarius as House Three",
      "ingredients": {
        "houseField": "speech, learning, siblings, neighbors, messages, and local movement",
        "signStructure": {
          "element": "air",
          "modality": "fixed",
          "combined": "fixed air"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Three supplies speech, learning, siblings, neighbors, messages, and local movement.",
        "signLayer": "Aquarius supplies fixed air.",
        "rulerLayer": "Saturn supplies the organizing mechanism traditionally.",
        "result": "Speech and local experience become fixed air: learning stabilizes through ideas, systems, principles, and the recognition of patterns that connect individuals to larger networks. Saturn rules the house traditionally, so the mind is organized through coherence, objectivity, and long-term intellectual frameworks."
      },
      "description": "Speech and local experience become fixed air: learning stabilizes through ideas, systems, principles, and the recognition of patterns that connect individuals to larger networks. Saturn rules the house traditionally, so the mind is organized through coherence, objectivity, and long-term intellectual frameworks."
    },
    {
      "id": "sagittarius-rising-house-4-pisces",
      "risingSign": "Sagittarius",
      "offsetSet": 9,
      "symbolicDisplacementFromNatural": 8,
      "houseNumber": 4,
      "houseName": "House Four",
      "sign": "Pisces",
      "title": "Pisces as House Four",
      "ingredients": {
        "houseField": "home, roots, ancestry, foundation, memory, and belonging",
        "signStructure": {
          "element": "water",
          "modality": "mutable",
          "combined": "mutable water"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Four supplies home, roots, ancestry, foundation, memory, and belonging.",
        "signLayer": "Pisces supplies mutable water.",
        "rulerLayer": "Jupiter supplies the organizing mechanism traditionally.",
        "result": "Home becomes mutable water: roots flow through compassion, imagination, memory, and a sense of belonging that extends beyond ordinary boundaries. Jupiter rules the house traditionally, so foundation is organized through faith, mercy, and the search for meaning within family and inner life."
      },
      "description": "Home becomes mutable water: roots flow through compassion, imagination, memory, and a sense of belonging that extends beyond ordinary boundaries. Jupiter rules the house traditionally, so foundation is organized through faith, mercy, and the search for meaning within family and inner life."
    },
    {
      "id": "sagittarius-rising-house-5-aries",
      "risingSign": "Sagittarius",
      "offsetSet": 9,
      "symbolicDisplacementFromNatural": 8,
      "houseNumber": 5,
      "houseName": "House Five",
      "sign": "Aries",
      "title": "Aries as House Five",
      "ingredients": {
        "houseField": "pleasure, play, creativity, romance, children, risk, and self-expression",
        "signStructure": {
          "element": "fire",
          "modality": "cardinal",
          "combined": "cardinal fire"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Five supplies pleasure, play, creativity, romance, children, risk, and self-expression.",
        "signLayer": "Aries supplies cardinal fire.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "Pleasure becomes cardinal fire: creativity and joy begin through initiative, courage, play, romance, and the desire to bring something new into being. Mars rules the house, so delight is organized through action, enthusiasm, competition, and the willingness to take risks."
      },
      "description": "Pleasure becomes cardinal fire: creativity and joy begin through initiative, courage, play, romance, and the desire to bring something new into being. Mars rules the house, so delight is organized through action, enthusiasm, competition, and the willingness to take risks."
    },
    {
      "id": "sagittarius-rising-house-6-taurus",
      "risingSign": "Sagittarius",
      "offsetSet": 9,
      "symbolicDisplacementFromNatural": 8,
      "houseNumber": 6,
      "houseName": "House Six",
      "sign": "Taurus",
      "title": "Taurus as House Six",
      "ingredients": {
        "houseField": "work, maintenance, service, health, routine, labor, and repair",
        "signStructure": {
          "element": "earth",
          "modality": "fixed",
          "combined": "fixed earth"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Six supplies work, maintenance, service, health, routine, labor, and repair.",
        "signLayer": "Taurus supplies fixed earth.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "Work and maintenance become fixed earth: daily life stabilizes through routine, craftsmanship, bodily care, and the steady cultivation of practical systems. Venus rules the house, so labor is organized through patience, comfort, sustainability, and the creation of pleasant and enduring conditions."
      },
      "description": "Work and maintenance become fixed earth: daily life stabilizes through routine, craftsmanship, bodily care, and the steady cultivation of practical systems. Venus rules the house, so labor is organized through patience, comfort, sustainability, and the creation of pleasant and enduring conditions."
    },
    {
      "id": "sagittarius-rising-house-7-gemini",
      "risingSign": "Sagittarius",
      "offsetSet": 9,
      "symbolicDisplacementFromNatural": 8,
      "houseNumber": 7,
      "houseName": "House Seven",
      "sign": "Gemini",
      "title": "Gemini as House Seven",
      "ingredients": {
        "houseField": "partnership, mirrors, agreements, contracts, equality, and the other",
        "signStructure": {
          "element": "air",
          "modality": "mutable",
          "combined": "mutable air"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Seven supplies partnership, mirrors, agreements, contracts, equality, and the other.",
        "signLayer": "Gemini supplies mutable air.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "Partnership becomes mutable air: relationships evolve through conversation, curiosity, adaptability, and the continual exchange of ideas. Mercury rules the house, so union is organized through communication, learning, and the ability to see matters from multiple perspectives."
      },
      "description": "Partnership becomes mutable air: relationships evolve through conversation, curiosity, adaptability, and the continual exchange of ideas. Mercury rules the house, so union is organized through communication, learning, and the ability to see matters from multiple perspectives."
    },
    {
      "id": "sagittarius-rising-house-8-cancer",
      "risingSign": "Sagittarius",
      "offsetSet": 9,
      "symbolicDisplacementFromNatural": 8,
      "houseNumber": 8,
      "houseName": "House Eight",
      "sign": "Cancer",
      "title": "Cancer as House Eight",
      "ingredients": {
        "houseField": "intimacy, shared resources, debt, death, inheritance, and transformation",
        "signStructure": {
          "element": "water",
          "modality": "cardinal",
          "combined": "cardinal water"
        },
        "ruler": {
          "planet": "Moon",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eight supplies intimacy, shared resources, debt, death, inheritance, and transformation.",
        "signLayer": "Cancer supplies cardinal water.",
        "rulerLayer": "Moon supplies the organizing mechanism.",
        "result": "Entanglement becomes cardinal water: intimacy, shared resources, and transformation arise through care, emotional investment, and the instinct to protect what is deeply bonded. The Moon rules the house, so profound change is organized through memory, attachment, and responsiveness to shared needs."
      },
      "description": "Entanglement becomes cardinal water: intimacy, shared resources, and transformation arise through care, emotional investment, and the instinct to protect what is deeply bonded. The Moon rules the house, so profound change is organized through memory, attachment, and responsiveness to shared needs."
    },
    {
      "id": "sagittarius-rising-house-9-leo",
      "risingSign": "Sagittarius",
      "offsetSet": 9,
      "symbolicDisplacementFromNatural": 8,
      "houseNumber": 9,
      "houseName": "House Nine",
      "sign": "Leo",
      "title": "Leo as House Nine",
      "ingredients": {
        "houseField": "belief, philosophy, travel, law, teaching, higher learning, and meaning",
        "signStructure": {
          "element": "fire",
          "modality": "fixed",
          "combined": "fixed fire"
        },
        "ruler": {
          "planet": "Sun",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Nine supplies belief, philosophy, travel, law, teaching, higher learning, and meaning.",
        "signLayer": "Leo supplies fixed fire.",
        "rulerLayer": "Sun supplies the organizing mechanism.",
        "result": "Belief becomes fixed fire: philosophy and higher learning stabilize through creative vision, personal conviction, and the desire to illuminate meaning for oneself and others. The Sun rules the house, so understanding is organized through vitality, confidence, and the expression of an authentic worldview."
      },
      "description": "Belief becomes fixed fire: philosophy and higher learning stabilize through creative vision, personal conviction, and the desire to illuminate meaning for oneself and others. The Sun rules the house, so understanding is organized through vitality, confidence, and the expression of an authentic worldview."
    },
    {
      "id": "sagittarius-rising-house-10-virgo",
      "risingSign": "Sagittarius",
      "offsetSet": 9,
      "symbolicDisplacementFromNatural": 8,
      "houseNumber": 10,
      "houseName": "House Ten",
      "sign": "Virgo",
      "title": "Virgo as House Ten",
      "ingredients": {
        "houseField": "vocation, public life, authority, visibility, achievement, and consequence",
        "signStructure": {
          "element": "earth",
          "modality": "mutable",
          "combined": "mutable earth"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Ten supplies vocation, public life, authority, visibility, achievement, and consequence.",
        "signLayer": "Virgo supplies mutable earth.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "Vocation becomes mutable earth: public life evolves through service, skill, refinement, and the continual improvement of practical systems. Mercury rules the house, so authority is organized through discernment, method, and the intelligent management of complexity."
      },
      "description": "Vocation becomes mutable earth: public life evolves through service, skill, refinement, and the continual improvement of practical systems. Mercury rules the house, so authority is organized through discernment, method, and the intelligent management of complexity."
    },
    {
      "id": "sagittarius-rising-house-11-libra",
      "risingSign": "Sagittarius",
      "offsetSet": 9,
      "symbolicDisplacementFromNatural": 8,
      "houseNumber": 11,
      "houseName": "House Eleven",
      "sign": "Libra",
      "title": "Libra as House Eleven",
      "ingredients": {
        "houseField": "community, friends, groups, hopes, networks, and shared futures",
        "signStructure": {
          "element": "air",
          "modality": "cardinal",
          "combined": "cardinal air"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eleven supplies community, friends, groups, hopes, networks, and shared futures.",
        "signLayer": "Libra supplies cardinal air.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "Community becomes cardinal air: friendships and aspirations begin through cooperation, mutual recognition, fairness, and the creation of balanced relationships within groups. Venus rules the house, so belonging is organized through diplomacy, shared values, and the cultivation of harmony among diverse people."
      },
      "description": "Community becomes cardinal air: friendships and aspirations begin through cooperation, mutual recognition, fairness, and the creation of balanced relationships within groups. Venus rules the house, so belonging is organized through diplomacy, shared values, and the cultivation of harmony among diverse people."
    },
    {
      "id": "sagittarius-rising-house-12-scorpio",
      "risingSign": "Sagittarius",
      "offsetSet": 9,
      "symbolicDisplacementFromNatural": 8,
      "houseNumber": 12,
      "houseName": "House Twelve",
      "sign": "Scorpio",
      "title": "Scorpio as House Twelve",
      "ingredients": {
        "houseField": "solitude, retreat, hidden things, sorrow, dream, undoing, and release",
        "signStructure": {
          "element": "water",
          "modality": "fixed",
          "combined": "fixed water"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Twelve supplies solitude, retreat, hidden things, sorrow, dream, undoing, and release.",
        "signLayer": "Scorpio supplies fixed water.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "The hidden realm becomes fixed water: solitude, retreat, and release become places of emotional depth, secrecy, transformation, and the preservation of what lies beneath conscious awareness. Mars rules the house traditionally, so surrender is organized through courage, profound inner work, and the willingness to face what has been hidden."
      },
      "description": "The hidden realm becomes fixed water: solitude, retreat, and release become places of emotional depth, secrecy, transformation, and the preservation of what lies beneath conscious awareness. Mars rules the house traditionally, so surrender is organized through courage, profound inner work, and the willingness to face what has been hidden."
    },
    {
      "id": "capricorn-rising-house-1-capricorn",
      "risingSign": "Capricorn",
      "offsetSet": 10,
      "symbolicDisplacementFromNatural": 9,
      "houseNumber": 1,
      "houseName": "House One",
      "sign": "Capricorn",
      "title": "Capricorn as House One",
      "ingredients": {
        "houseField": "self, body, appearance, identity, and immediate orientation",
        "signStructure": {
          "element": "earth",
          "modality": "cardinal",
          "combined": "cardinal earth"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House One supplies self, body, appearance, identity, and immediate orientation.",
        "signLayer": "Capricorn supplies cardinal earth.",
        "rulerLayer": "Saturn supplies the organizing mechanism.",
        "result": "The self becomes cardinal earth: identity is organized through structure, responsibility, endurance, and the impulse to build something lasting. Saturn rules the house, so the body and persona are shaped through discipline, boundaries, accountability, and an awareness of time and consequence."
      },
      "description": "The self becomes cardinal earth: identity is organized through structure, responsibility, endurance, and the impulse to build something lasting. Saturn rules the house, so the body and persona are shaped through discipline, boundaries, accountability, and an awareness of time and consequence."
    },
    {
      "id": "capricorn-rising-house-2-aquarius",
      "risingSign": "Capricorn",
      "offsetSet": 10,
      "symbolicDisplacementFromNatural": 9,
      "houseNumber": 2,
      "houseName": "House Two",
      "sign": "Aquarius",
      "title": "Aquarius as House Two",
      "ingredients": {
        "houseField": "resources, value, money, food, possession, and survival support",
        "signStructure": {
          "element": "air",
          "modality": "fixed",
          "combined": "fixed air"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Two supplies resources, value, money, food, possession, and survival support.",
        "signLayer": "Aquarius supplies fixed air.",
        "rulerLayer": "Saturn supplies the organizing mechanism traditionally.",
        "result": "Resources become fixed air: value stabilizes through ideas, systems, networks, and participation in something larger than oneself. Saturn rules the house traditionally, so survival is organized through long-term planning, principled stewardship, and the cultivation of durable social and intellectual resources."
      },
      "description": "Resources become fixed air: value stabilizes through ideas, systems, networks, and participation in something larger than oneself. Saturn rules the house traditionally, so survival is organized through long-term planning, principled stewardship, and the cultivation of durable social and intellectual resources."
    },
    {
      "id": "capricorn-rising-house-3-pisces",
      "risingSign": "Capricorn",
      "offsetSet": 10,
      "symbolicDisplacementFromNatural": 9,
      "houseNumber": 3,
      "houseName": "House Three",
      "sign": "Pisces",
      "title": "Pisces as House Three",
      "ingredients": {
        "houseField": "speech, learning, siblings, neighbors, messages, and local movement",
        "signStructure": {
          "element": "water",
          "modality": "mutable",
          "combined": "mutable water"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Three supplies speech, learning, siblings, neighbors, messages, and local movement.",
        "signLayer": "Pisces supplies mutable water.",
        "rulerLayer": "Jupiter supplies the organizing mechanism traditionally.",
        "result": "Speech and local experience become mutable water: learning flows through imagination, intuition, symbolism, and sensitivity to meanings that cannot always be spoken directly. Jupiter rules the house traditionally, so the mind is organized through faith, compassion, and the search for significance within experience."
      },
      "description": "Speech and local experience become mutable water: learning flows through imagination, intuition, symbolism, and sensitivity to meanings that cannot always be spoken directly. Jupiter rules the house traditionally, so the mind is organized through faith, compassion, and the search for significance within experience."
    },
    {
      "id": "capricorn-rising-house-4-aries",
      "risingSign": "Capricorn",
      "offsetSet": 10,
      "symbolicDisplacementFromNatural": 9,
      "houseNumber": 4,
      "houseName": "House Four",
      "sign": "Aries",
      "title": "Aries as House Four",
      "ingredients": {
        "houseField": "home, roots, ancestry, foundation, memory, and belonging",
        "signStructure": {
          "element": "fire",
          "modality": "cardinal",
          "combined": "cardinal fire"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Four supplies home, roots, ancestry, foundation, memory, and belonging.",
        "signLayer": "Aries supplies cardinal fire.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "Home becomes cardinal fire: roots are established through initiative, courage, independence, and the impulse to create one's own place of belonging. Mars rules the house, so foundation is organized through action, protection, and the willingness to take decisive steps on behalf of home and family."
      },
      "description": "Home becomes cardinal fire: roots are established through initiative, courage, independence, and the impulse to create one's own place of belonging. Mars rules the house, so foundation is organized through action, protection, and the willingness to take decisive steps on behalf of home and family."
    },
    {
      "id": "capricorn-rising-house-5-taurus",
      "risingSign": "Capricorn",
      "offsetSet": 10,
      "symbolicDisplacementFromNatural": 9,
      "houseNumber": 5,
      "houseName": "House Five",
      "sign": "Taurus",
      "title": "Taurus as House Five",
      "ingredients": {
        "houseField": "pleasure, play, creativity, romance, children, risk, and self-expression",
        "signStructure": {
          "element": "earth",
          "modality": "fixed",
          "combined": "fixed earth"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Five supplies pleasure, play, creativity, romance, children, risk, and self-expression.",
        "signLayer": "Taurus supplies fixed earth.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "Pleasure becomes fixed earth: creativity and joy stabilize through sensuality, craftsmanship, beauty, and the patient cultivation of what brings lasting satisfaction. Venus rules the house, so delight is organized through appreciation, comfort, and the steady enjoyment of life's tangible pleasures."
      },
      "description": "Pleasure becomes fixed earth: creativity and joy stabilize through sensuality, craftsmanship, beauty, and the patient cultivation of what brings lasting satisfaction. Venus rules the house, so delight is organized through appreciation, comfort, and the steady enjoyment of life's tangible pleasures."
    },
    {
      "id": "capricorn-rising-house-6-gemini",
      "risingSign": "Capricorn",
      "offsetSet": 10,
      "symbolicDisplacementFromNatural": 9,
      "houseNumber": 6,
      "houseName": "House Six",
      "sign": "Gemini",
      "title": "Gemini as House Six",
      "ingredients": {
        "houseField": "work, maintenance, service, health, routine, labor, and repair",
        "signStructure": {
          "element": "air",
          "modality": "mutable",
          "combined": "mutable air"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Six supplies work, maintenance, service, health, routine, labor, and repair.",
        "signLayer": "Gemini supplies mutable air.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "Work and maintenance become mutable air: daily life evolves through learning, communication, adaptability, and the continual exchange of information. Mercury rules the house, so labor is organized through method, versatility, and the intelligent coordination of many moving parts."
      },
      "description": "Work and maintenance become mutable air: daily life evolves through learning, communication, adaptability, and the continual exchange of information. Mercury rules the house, so labor is organized through method, versatility, and the intelligent coordination of many moving parts."
    },
    {
      "id": "capricorn-rising-house-7-cancer",
      "risingSign": "Capricorn",
      "offsetSet": 10,
      "symbolicDisplacementFromNatural": 9,
      "houseNumber": 7,
      "houseName": "House Seven",
      "sign": "Cancer",
      "title": "Cancer as House Seven",
      "ingredients": {
        "houseField": "partnership, mirrors, agreements, contracts, equality, and the other",
        "signStructure": {
          "element": "water",
          "modality": "cardinal",
          "combined": "cardinal water"
        },
        "ruler": {
          "planet": "Moon",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Seven supplies partnership, mirrors, agreements, contracts, equality, and the other.",
        "signLayer": "Cancer supplies cardinal water.",
        "rulerLayer": "Moon supplies the organizing mechanism.",
        "result": "Partnership becomes cardinal water: relationships begin through care, emotional responsiveness, protection, and the desire to create a sense of belonging together. The Moon rules the house, so union is organized through shared needs, memory, and attentiveness to the rhythms of connection."
      },
      "description": "Partnership becomes cardinal water: relationships begin through care, emotional responsiveness, protection, and the desire to create a sense of belonging together. The Moon rules the house, so union is organized through shared needs, memory, and attentiveness to the rhythms of connection."
    },
    {
      "id": "capricorn-rising-house-8-leo",
      "risingSign": "Capricorn",
      "offsetSet": 10,
      "symbolicDisplacementFromNatural": 9,
      "houseNumber": 8,
      "houseName": "House Eight",
      "sign": "Leo",
      "title": "Leo as House Eight",
      "ingredients": {
        "houseField": "intimacy, shared resources, debt, death, inheritance, and transformation",
        "signStructure": {
          "element": "fire",
          "modality": "fixed",
          "combined": "fixed fire"
        },
        "ruler": {
          "planet": "Sun",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eight supplies intimacy, shared resources, debt, death, inheritance, and transformation.",
        "signLayer": "Leo supplies fixed fire.",
        "rulerLayer": "Sun supplies the organizing mechanism.",
        "result": "Entanglement becomes fixed fire: intimacy, shared resources, and transformation deepen through loyalty, creative investment, and the courage to bring one's whole heart into profound bonds. The Sun rules the house, so deep change is organized through authenticity, vitality, and the revelation of one's essential nature."
      },
      "description": "Entanglement becomes fixed fire: intimacy, shared resources, and transformation deepen through loyalty, creative investment, and the courage to bring one's whole heart into profound bonds. The Sun rules the house, so deep change is organized through authenticity, vitality, and the revelation of one's essential nature."
    },
    {
      "id": "capricorn-rising-house-9-virgo",
      "risingSign": "Capricorn",
      "offsetSet": 10,
      "symbolicDisplacementFromNatural": 9,
      "houseNumber": 9,
      "houseName": "House Nine",
      "sign": "Virgo",
      "title": "Virgo as House Nine",
      "ingredients": {
        "houseField": "belief, philosophy, travel, law, teaching, higher learning, and meaning",
        "signStructure": {
          "element": "earth",
          "modality": "mutable",
          "combined": "mutable earth"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Nine supplies belief, philosophy, travel, law, teaching, higher learning, and meaning.",
        "signLayer": "Virgo supplies mutable earth.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "Belief becomes mutable earth: philosophy and higher learning are refined through practical experience, discernment, and the careful improvement of one's understanding. Mercury rules the house, so wisdom is organized through analysis, method, and the intelligent application of knowledge."
      },
      "description": "Belief becomes mutable earth: philosophy and higher learning are refined through practical experience, discernment, and the careful improvement of one's understanding. Mercury rules the house, so wisdom is organized through analysis, method, and the intelligent application of knowledge."
    },
    {
      "id": "capricorn-rising-house-10-libra",
      "risingSign": "Capricorn",
      "offsetSet": 10,
      "symbolicDisplacementFromNatural": 9,
      "houseNumber": 10,
      "houseName": "House Ten",
      "sign": "Libra",
      "title": "Libra as House Ten",
      "ingredients": {
        "houseField": "vocation, public life, authority, visibility, achievement, and consequence",
        "signStructure": {
          "element": "air",
          "modality": "cardinal",
          "combined": "cardinal air"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Ten supplies vocation, public life, authority, visibility, achievement, and consequence.",
        "signLayer": "Libra supplies cardinal air.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "Vocation becomes cardinal air: public life takes shape through relationship, diplomacy, fairness, and the ability to balance competing interests. Venus rules the house, so authority is organized through cooperation, aesthetics, and the cultivation of harmony and mutual benefit."
      },
      "description": "Vocation becomes cardinal air: public life takes shape through relationship, diplomacy, fairness, and the ability to balance competing interests. Venus rules the house, so authority is organized through cooperation, aesthetics, and the cultivation of harmony and mutual benefit."
    },
    {
      "id": "capricorn-rising-house-11-scorpio",
      "risingSign": "Capricorn",
      "offsetSet": 10,
      "symbolicDisplacementFromNatural": 9,
      "houseNumber": 11,
      "houseName": "House Eleven",
      "sign": "Scorpio",
      "title": "Scorpio as House Eleven",
      "ingredients": {
        "houseField": "community, friends, groups, hopes, networks, and shared futures",
        "signStructure": {
          "element": "water",
          "modality": "fixed",
          "combined": "fixed water"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eleven supplies community, friends, groups, hopes, networks, and shared futures.",
        "signLayer": "Scorpio supplies fixed water.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "Community becomes fixed water: friendships and aspirations deepen through loyalty, trust, emotional intensity, and enduring bonds forged through shared transformation. Mars rules the house traditionally, so belonging is organized through courage, commitment, and the willingness to remain present during periods of profound change."
      },
      "description": "Community becomes fixed water: friendships and aspirations deepen through loyalty, trust, emotional intensity, and enduring bonds forged through shared transformation. Mars rules the house traditionally, so belonging is organized through courage, commitment, and the willingness to remain present during periods of profound change."
    },
    {
      "id": "capricorn-rising-house-12-sagittarius",
      "risingSign": "Capricorn",
      "offsetSet": 10,
      "symbolicDisplacementFromNatural": 9,
      "houseNumber": 12,
      "houseName": "House Twelve",
      "sign": "Sagittarius",
      "title": "Sagittarius as House Twelve",
      "ingredients": {
        "houseField": "solitude, retreat, hidden things, sorrow, dream, undoing, and release",
        "signStructure": {
          "element": "fire",
          "modality": "mutable",
          "combined": "mutable fire"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Twelve supplies solitude, retreat, hidden things, sorrow, dream, undoing, and release.",
        "signLayer": "Sagittarius supplies mutable fire.",
        "rulerLayer": "Jupiter supplies the organizing mechanism.",
        "result": "The hidden realm becomes mutable fire: solitude, retreat, and release become places of faith, meaning, exploration, and the expansion of consciousness beyond familiar limits. Jupiter rules the house, so surrender is organized through wisdom, hope, and trust in a larger horizon of understanding."
      },
      "description": "The hidden realm becomes mutable fire: solitude, retreat, and release become places of faith, meaning, exploration, and the expansion of consciousness beyond familiar limits. Jupiter rules the house, so surrender is organized through wisdom, hope, and trust in a larger horizon of understanding."
    },
    {
      "id": "aquarius-rising-house-1-aquarius",
      "risingSign": "Aquarius",
      "offsetSet": 11,
      "symbolicDisplacementFromNatural": 10,
      "houseNumber": 1,
      "houseName": "House One",
      "sign": "Aquarius",
      "title": "Aquarius as House One",
      "ingredients": {
        "houseField": "self, body, appearance, identity, and immediate orientation",
        "signStructure": {
          "element": "air",
          "modality": "fixed",
          "combined": "fixed air"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House One supplies self, body, appearance, identity, and immediate orientation.",
        "signLayer": "Aquarius supplies fixed air.",
        "rulerLayer": "Saturn supplies the organizing mechanism traditionally.",
        "result": "The self becomes fixed air: identity stabilizes through ideas, principles, pattern recognition, and participation in something larger than the personal self. Saturn rules the house traditionally, so the body and persona are organized through coherence, responsibility, intellectual integrity, and long-range vision."
      },
      "description": "The self becomes fixed air: identity stabilizes through ideas, principles, pattern recognition, and participation in something larger than the personal self. Saturn rules the house traditionally, so the body and persona are organized through coherence, responsibility, intellectual integrity, and long-range vision."
    },
    {
      "id": "aquarius-rising-house-2-pisces",
      "risingSign": "Aquarius",
      "offsetSet": 11,
      "symbolicDisplacementFromNatural": 10,
      "houseNumber": 2,
      "houseName": "House Two",
      "sign": "Pisces",
      "title": "Pisces as House Two",
      "ingredients": {
        "houseField": "resources, value, money, food, possession, and survival support",
        "signStructure": {
          "element": "water",
          "modality": "mutable",
          "combined": "mutable water"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Two supplies resources, value, money, food, possession, and survival support.",
        "signLayer": "Pisces supplies mutable water.",
        "rulerLayer": "Jupiter supplies the organizing mechanism traditionally.",
        "result": "Resources become mutable water: value flows through compassion, imagination, faith, and sensitivity to subtle and intangible forms of abundance. Jupiter rules the house traditionally, so survival is organized through generosity, trust, meaning, and the recognition that not all resources are material."
      },
      "description": "Resources become mutable water: value flows through compassion, imagination, faith, and sensitivity to subtle and intangible forms of abundance. Jupiter rules the house traditionally, so survival is organized through generosity, trust, meaning, and the recognition that not all resources are material."
    },
    {
      "id": "aquarius-rising-house-3-aries",
      "risingSign": "Aquarius",
      "offsetSet": 11,
      "symbolicDisplacementFromNatural": 10,
      "houseNumber": 3,
      "houseName": "House Three",
      "sign": "Aries",
      "title": "Aries as House Three",
      "ingredients": {
        "houseField": "speech, learning, siblings, neighbors, messages, and local movement",
        "signStructure": {
          "element": "fire",
          "modality": "cardinal",
          "combined": "cardinal fire"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Three supplies speech, learning, siblings, neighbors, messages, and local movement.",
        "signLayer": "Aries supplies cardinal fire.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "Speech and local experience become cardinal fire: learning begins through direct engagement, initiative, courage, and the willingness to ask, move, and experiment. Mars rules the house, so the mind is organized through action, decisiveness, and immediate response to the environment."
      },
      "description": "Speech and local experience become cardinal fire: learning begins through direct engagement, initiative, courage, and the willingness to ask, move, and experiment. Mars rules the house, so the mind is organized through action, decisiveness, and immediate response to the environment."
    },
    {
      "id": "aquarius-rising-house-4-taurus",
      "risingSign": "Aquarius",
      "offsetSet": 11,
      "symbolicDisplacementFromNatural": 10,
      "houseNumber": 4,
      "houseName": "House Four",
      "sign": "Taurus",
      "title": "Taurus as House Four",
      "ingredients": {
        "houseField": "home, roots, ancestry, foundation, memory, and belonging",
        "signStructure": {
          "element": "earth",
          "modality": "fixed",
          "combined": "fixed earth"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Four supplies home, roots, ancestry, foundation, memory, and belonging.",
        "signLayer": "Taurus supplies fixed earth.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "Home becomes fixed earth: roots stabilize through continuity, nourishment, beauty, and the cultivation of secure and enduring foundations. Venus rules the house, so belonging is organized through comfort, preservation, and the patient tending of family and place."
      },
      "description": "Home becomes fixed earth: roots stabilize through continuity, nourishment, beauty, and the cultivation of secure and enduring foundations. Venus rules the house, so belonging is organized through comfort, preservation, and the patient tending of family and place."
    },
    {
      "id": "aquarius-rising-house-5-gemini",
      "risingSign": "Aquarius",
      "offsetSet": 11,
      "symbolicDisplacementFromNatural": 10,
      "houseNumber": 5,
      "houseName": "House Five",
      "sign": "Gemini",
      "title": "Gemini as House Five",
      "ingredients": {
        "houseField": "pleasure, play, creativity, romance, children, risk, and self-expression",
        "signStructure": {
          "element": "air",
          "modality": "mutable",
          "combined": "mutable air"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Five supplies pleasure, play, creativity, romance, children, risk, and self-expression.",
        "signLayer": "Gemini supplies mutable air.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "Pleasure becomes mutable air: creativity and joy branch into conversation, learning, play, storytelling, and the delight of making new connections. Mercury rules the house, so pleasure is organized through curiosity, variety, and the exchange of ideas."
      },
      "description": "Pleasure becomes mutable air: creativity and joy branch into conversation, learning, play, storytelling, and the delight of making new connections. Mercury rules the house, so pleasure is organized through curiosity, variety, and the exchange of ideas."
    },
    {
      "id": "aquarius-rising-house-6-cancer",
      "risingSign": "Aquarius",
      "offsetSet": 11,
      "symbolicDisplacementFromNatural": 10,
      "houseNumber": 6,
      "houseName": "House Six",
      "sign": "Cancer",
      "title": "Cancer as House Six",
      "ingredients": {
        "houseField": "work, maintenance, service, health, routine, labor, and repair",
        "signStructure": {
          "element": "water",
          "modality": "cardinal",
          "combined": "cardinal water"
        },
        "ruler": {
          "planet": "Moon",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Six supplies work, maintenance, service, health, routine, labor, and repair.",
        "signLayer": "Cancer supplies cardinal water.",
        "rulerLayer": "Moon supplies the organizing mechanism.",
        "result": "Work and maintenance become cardinal water: daily life takes shape through care, protection, emotional responsiveness, and attentiveness to the needs of living systems. The Moon rules the house, so labor is organized through rhythm, nourishment, and the cultivation of supportive routines."
      },
      "description": "Work and maintenance become cardinal water: daily life takes shape through care, protection, emotional responsiveness, and attentiveness to the needs of living systems. The Moon rules the house, so labor is organized through rhythm, nourishment, and the cultivation of supportive routines."
    },
    {
      "id": "aquarius-rising-house-7-leo",
      "risingSign": "Aquarius",
      "offsetSet": 11,
      "symbolicDisplacementFromNatural": 10,
      "houseNumber": 7,
      "houseName": "House Seven",
      "sign": "Leo",
      "title": "Leo as House Seven",
      "ingredients": {
        "houseField": "partnership, mirrors, agreements, contracts, equality, and the other",
        "signStructure": {
          "element": "fire",
          "modality": "fixed",
          "combined": "fixed fire"
        },
        "ruler": {
          "planet": "Sun",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Seven supplies partnership, mirrors, agreements, contracts, equality, and the other.",
        "signLayer": "Leo supplies fixed fire.",
        "rulerLayer": "Sun supplies the organizing mechanism.",
        "result": "Partnership becomes fixed fire: relationships deepen through loyalty, generosity, visibility, and the desire to celebrate and encourage one another's unique light. The Sun rules the house, so union is organized through authenticity, creativity, and wholehearted participation."
      },
      "description": "Partnership becomes fixed fire: relationships deepen through loyalty, generosity, visibility, and the desire to celebrate and encourage one another's unique light. The Sun rules the house, so union is organized through authenticity, creativity, and wholehearted participation."
    },
    {
      "id": "aquarius-rising-house-8-virgo",
      "risingSign": "Aquarius",
      "offsetSet": 11,
      "symbolicDisplacementFromNatural": 10,
      "houseNumber": 8,
      "houseName": "House Eight",
      "sign": "Virgo",
      "title": "Virgo as House Eight",
      "ingredients": {
        "houseField": "intimacy, shared resources, debt, death, inheritance, and transformation",
        "signStructure": {
          "element": "earth",
          "modality": "mutable",
          "combined": "mutable earth"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eight supplies intimacy, shared resources, debt, death, inheritance, and transformation.",
        "signLayer": "Virgo supplies mutable earth.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "Entanglement becomes mutable earth: intimacy, shared resources, and transformation are refined through discernment, practical care, and the intelligent management of complexity. Mercury rules the house, so deep change is organized through analysis, understanding, and the gradual reordering of what has become disordered."
      },
      "description": "Entanglement becomes mutable earth: intimacy, shared resources, and transformation are refined through discernment, practical care, and the intelligent management of complexity. Mercury rules the house, so deep change is organized through analysis, understanding, and the gradual reordering of what has become disordered."
    },
    {
      "id": "aquarius-rising-house-9-libra",
      "risingSign": "Aquarius",
      "offsetSet": 11,
      "symbolicDisplacementFromNatural": 10,
      "houseNumber": 9,
      "houseName": "House Nine",
      "sign": "Libra",
      "title": "Libra as House Nine",
      "ingredients": {
        "houseField": "belief, philosophy, travel, law, teaching, higher learning, and meaning",
        "signStructure": {
          "element": "air",
          "modality": "cardinal",
          "combined": "cardinal air"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Nine supplies belief, philosophy, travel, law, teaching, higher learning, and meaning.",
        "signLayer": "Libra supplies cardinal air.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "Belief becomes cardinal air: philosophy and higher learning begin through dialogue, comparison, fairness, and the search for balanced understanding. Venus rules the house, so wisdom is organized through relationship, beauty, and the cultivation of harmony among differing viewpoints."
      },
      "description": "Belief becomes cardinal air: philosophy and higher learning begin through dialogue, comparison, fairness, and the search for balanced understanding. Venus rules the house, so wisdom is organized through relationship, beauty, and the cultivation of harmony among differing viewpoints."
    },
    {
      "id": "aquarius-rising-house-10-scorpio",
      "risingSign": "Aquarius",
      "offsetSet": 11,
      "symbolicDisplacementFromNatural": 10,
      "houseNumber": 10,
      "houseName": "House Ten",
      "sign": "Scorpio",
      "title": "Scorpio as House Ten",
      "ingredients": {
        "houseField": "vocation, public life, authority, visibility, achievement, and consequence",
        "signStructure": {
          "element": "water",
          "modality": "fixed",
          "combined": "fixed water"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Ten supplies vocation, public life, authority, visibility, achievement, and consequence.",
        "signLayer": "Scorpio supplies fixed water.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "Vocation becomes fixed water: public life stabilizes through depth, commitment, emotional courage, and the capacity to guide transformation. Mars rules the house traditionally, so authority is organized through resilience, determination, and the willingness to engage difficult realities directly."
      },
      "description": "Vocation becomes fixed water: public life stabilizes through depth, commitment, emotional courage, and the capacity to guide transformation. Mars rules the house traditionally, so authority is organized through resilience, determination, and the willingness to engage difficult realities directly."
    },
    {
      "id": "aquarius-rising-house-11-sagittarius",
      "risingSign": "Aquarius",
      "offsetSet": 11,
      "symbolicDisplacementFromNatural": 10,
      "houseNumber": 11,
      "houseName": "House Eleven",
      "sign": "Sagittarius",
      "title": "Sagittarius as House Eleven",
      "ingredients": {
        "houseField": "community, friends, groups, hopes, networks, and shared futures",
        "signStructure": {
          "element": "fire",
          "modality": "mutable",
          "combined": "mutable fire"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eleven supplies community, friends, groups, hopes, networks, and shared futures.",
        "signLayer": "Sagittarius supplies mutable fire.",
        "rulerLayer": "Jupiter supplies the organizing mechanism.",
        "result": "Community becomes mutable fire: friendships and aspirations expand through teaching, adventure, shared meaning, and the pursuit of broader horizons together. Jupiter rules the house, so belonging is organized through generosity, faith, and the continual widening of collective possibilities."
      },
      "description": "Community becomes mutable fire: friendships and aspirations expand through teaching, adventure, shared meaning, and the pursuit of broader horizons together. Jupiter rules the house, so belonging is organized through generosity, faith, and the continual widening of collective possibilities."
    },
    {
      "id": "aquarius-rising-house-12-capricorn",
      "risingSign": "Aquarius",
      "offsetSet": 11,
      "symbolicDisplacementFromNatural": 10,
      "houseNumber": 12,
      "houseName": "House Twelve",
      "sign": "Capricorn",
      "title": "Capricorn as House Twelve",
      "ingredients": {
        "houseField": "solitude, retreat, hidden things, sorrow, dream, undoing, and release",
        "signStructure": {
          "element": "earth",
          "modality": "cardinal",
          "combined": "cardinal earth"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Twelve supplies solitude, retreat, hidden things, sorrow, dream, undoing, and release.",
        "signLayer": "Capricorn supplies cardinal earth.",
        "rulerLayer": "Saturn supplies the organizing mechanism.",
        "result": "The hidden realm becomes cardinal earth: solitude, retreat, and release become places of structure, responsibility, and the quiet building of inner foundations. Saturn rules the house, so surrender is organized through discipline, acceptance of limits, and the patient integration of life's enduring lessons."
      },
      "description": "The hidden realm becomes cardinal earth: solitude, retreat, and release become places of structure, responsibility, and the quiet building of inner foundations. Saturn rules the house, so surrender is organized through discipline, acceptance of limits, and the patient integration of life's enduring lessons."
    },
    {
      "id": "pisces-rising-house-1-pisces",
      "risingSign": "Pisces",
      "offsetSet": 12,
      "symbolicDisplacementFromNatural": 11,
      "houseNumber": 1,
      "houseName": "House One",
      "sign": "Pisces",
      "title": "Pisces as House One",
      "ingredients": {
        "houseField": "self, body, appearance, identity, and immediate orientation",
        "signStructure": {
          "element": "water",
          "modality": "mutable",
          "combined": "mutable water"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House One supplies self, body, appearance, identity, and immediate orientation.",
        "signLayer": "Pisces supplies mutable water.",
        "rulerLayer": "Jupiter supplies the organizing mechanism traditionally.",
        "result": "The self becomes mutable water: identity flows through imagination, compassion, permeability, and responsiveness to subtle currents that cannot always be contained by ordinary boundaries. Jupiter rules the house traditionally, so the body and persona are organized through faith, mercy, meaning, and the search for a unifying vision."
      },
      "description": "The self becomes mutable water: identity flows through imagination, compassion, permeability, and responsiveness to subtle currents that cannot always be contained by ordinary boundaries. Jupiter rules the house traditionally, so the body and persona are organized through faith, mercy, meaning, and the search for a unifying vision."
    },
    {
      "id": "pisces-rising-house-2-aries",
      "risingSign": "Pisces",
      "offsetSet": 12,
      "symbolicDisplacementFromNatural": 11,
      "houseNumber": 2,
      "houseName": "House Two",
      "sign": "Aries",
      "title": "Aries as House Two",
      "ingredients": {
        "houseField": "resources, value, money, food, possession, and survival support",
        "signStructure": {
          "element": "fire",
          "modality": "cardinal",
          "combined": "cardinal fire"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Two supplies resources, value, money, food, possession, and survival support.",
        "signLayer": "Aries supplies cardinal fire.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "Resources become cardinal fire: value is established through initiative, courage, self-reliance, and the willingness to act directly in support of survival. Mars rules the house, so resources are organized through effort, decisiveness, and the readiness to seize opportunity."
      },
      "description": "Resources become cardinal fire: value is established through initiative, courage, self-reliance, and the willingness to act directly in support of survival. Mars rules the house, so resources are organized through effort, decisiveness, and the readiness to seize opportunity."
    },
    {
      "id": "pisces-rising-house-3-taurus",
      "risingSign": "Pisces",
      "offsetSet": 12,
      "symbolicDisplacementFromNatural": 11,
      "houseNumber": 3,
      "houseName": "House Three",
      "sign": "Taurus",
      "title": "Taurus as House Three",
      "ingredients": {
        "houseField": "speech, learning, siblings, neighbors, messages, and local movement",
        "signStructure": {
          "element": "earth",
          "modality": "fixed",
          "combined": "fixed earth"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Three supplies speech, learning, siblings, neighbors, messages, and local movement.",
        "signLayer": "Taurus supplies fixed earth.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "Speech and local experience become fixed earth: learning stabilizes through repetition, practical knowledge, sensory experience, and the steady accumulation of understanding. Venus rules the house, so the mind is organized through appreciation, patience, and the cultivation of pleasant and enduring connections."
      },
      "description": "Speech and local experience become fixed earth: learning stabilizes through repetition, practical knowledge, sensory experience, and the steady accumulation of understanding. Venus rules the house, so the mind is organized through appreciation, patience, and the cultivation of pleasant and enduring connections."
    },
    {
      "id": "pisces-rising-house-4-gemini",
      "risingSign": "Pisces",
      "offsetSet": 12,
      "symbolicDisplacementFromNatural": 11,
      "houseNumber": 4,
      "houseName": "House Four",
      "sign": "Gemini",
      "title": "Gemini as House Four",
      "ingredients": {
        "houseField": "home, roots, ancestry, foundation, memory, and belonging",
        "signStructure": {
          "element": "air",
          "modality": "mutable",
          "combined": "mutable air"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Four supplies home, roots, ancestry, foundation, memory, and belonging.",
        "signLayer": "Gemini supplies mutable air.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "Home becomes mutable air: roots branch through conversation, learning, stories, movement, and the continual exchange of ideas within family and place. Mercury rules the house, so foundation is organized through communication, adaptability, and intellectual connection."
      },
      "description": "Home becomes mutable air: roots branch through conversation, learning, stories, movement, and the continual exchange of ideas within family and place. Mercury rules the house, so foundation is organized through communication, adaptability, and intellectual connection."
    },
    {
      "id": "pisces-rising-house-5-cancer",
      "risingSign": "Pisces",
      "offsetSet": 12,
      "symbolicDisplacementFromNatural": 11,
      "houseNumber": 5,
      "houseName": "House Five",
      "sign": "Cancer",
      "title": "Cancer as House Five",
      "ingredients": {
        "houseField": "pleasure, play, creativity, romance, children, risk, and self-expression",
        "signStructure": {
          "element": "water",
          "modality": "cardinal",
          "combined": "cardinal water"
        },
        "ruler": {
          "planet": "Moon",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Five supplies pleasure, play, creativity, romance, children, risk, and self-expression.",
        "signLayer": "Cancer supplies cardinal water.",
        "rulerLayer": "Moon supplies the organizing mechanism.",
        "result": "Pleasure becomes cardinal water: creativity and joy arise through care, memory, emotional expression, and the desire to nurture and protect what one loves. The Moon rules the house, so delight is organized through feeling, attachment, and the rhythms of the heart."
      },
      "description": "Pleasure becomes cardinal water: creativity and joy arise through care, memory, emotional expression, and the desire to nurture and protect what one loves. The Moon rules the house, so delight is organized through feeling, attachment, and the rhythms of the heart."
    },
    {
      "id": "pisces-rising-house-6-leo",
      "risingSign": "Pisces",
      "offsetSet": 12,
      "symbolicDisplacementFromNatural": 11,
      "houseNumber": 6,
      "houseName": "House Six",
      "sign": "Leo",
      "title": "Leo as House Six",
      "ingredients": {
        "houseField": "work, maintenance, service, health, routine, labor, and repair",
        "signStructure": {
          "element": "fire",
          "modality": "fixed",
          "combined": "fixed fire"
        },
        "ruler": {
          "planet": "Sun",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Six supplies work, maintenance, service, health, routine, labor, and repair.",
        "signLayer": "Leo supplies fixed fire.",
        "rulerLayer": "Sun supplies the organizing mechanism.",
        "result": "Work and maintenance become fixed fire: daily life stabilizes through pride in one's craft, creative effort, generosity, and the desire to bring vitality into ordinary tasks. The Sun rules the house, so labor is organized through self-expression, confidence, and wholehearted participation."
      },
      "description": "Work and maintenance become fixed fire: daily life stabilizes through pride in one's craft, creative effort, generosity, and the desire to bring vitality into ordinary tasks. The Sun rules the house, so labor is organized through self-expression, confidence, and wholehearted participation."
    },
    {
      "id": "pisces-rising-house-7-virgo",
      "risingSign": "Pisces",
      "offsetSet": 12,
      "symbolicDisplacementFromNatural": 11,
      "houseNumber": 7,
      "houseName": "House Seven",
      "sign": "Virgo",
      "title": "Virgo as House Seven",
      "ingredients": {
        "houseField": "partnership, mirrors, agreements, contracts, equality, and the other",
        "signStructure": {
          "element": "earth",
          "modality": "mutable",
          "combined": "mutable earth"
        },
        "ruler": {
          "planet": "Mercury",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Seven supplies partnership, mirrors, agreements, contracts, equality, and the other.",
        "signLayer": "Virgo supplies mutable earth.",
        "rulerLayer": "Mercury supplies the organizing mechanism.",
        "result": "Partnership becomes mutable earth: relationships evolve through service, refinement, practical support, and the continual adjustment of shared life. Mercury rules the house, so union is organized through understanding, discernment, and cooperative problem-solving."
      },
      "description": "Partnership becomes mutable earth: relationships evolve through service, refinement, practical support, and the continual adjustment of shared life. Mercury rules the house, so union is organized through understanding, discernment, and cooperative problem-solving."
    },
    {
      "id": "pisces-rising-house-8-libra",
      "risingSign": "Pisces",
      "offsetSet": 12,
      "symbolicDisplacementFromNatural": 11,
      "houseNumber": 8,
      "houseName": "House Eight",
      "sign": "Libra",
      "title": "Libra as House Eight",
      "ingredients": {
        "houseField": "intimacy, shared resources, debt, death, inheritance, and transformation",
        "signStructure": {
          "element": "air",
          "modality": "cardinal",
          "combined": "cardinal air"
        },
        "ruler": {
          "planet": "Venus",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eight supplies intimacy, shared resources, debt, death, inheritance, and transformation.",
        "signLayer": "Libra supplies cardinal air.",
        "rulerLayer": "Venus supplies the organizing mechanism.",
        "result": "Entanglement becomes cardinal air: intimacy, shared resources, and transformation begin through relationship, reciprocity, and the balancing of mutual obligations. Venus rules the house, so profound change is organized through trust, fairness, and the creation of harmony within what is shared."
      },
      "description": "Entanglement becomes cardinal air: intimacy, shared resources, and transformation begin through relationship, reciprocity, and the balancing of mutual obligations. Venus rules the house, so profound change is organized through trust, fairness, and the creation of harmony within what is shared."
    },
    {
      "id": "pisces-rising-house-9-scorpio",
      "risingSign": "Pisces",
      "offsetSet": 12,
      "symbolicDisplacementFromNatural": 11,
      "houseNumber": 9,
      "houseName": "House Nine",
      "sign": "Scorpio",
      "title": "Scorpio as House Nine",
      "ingredients": {
        "houseField": "belief, philosophy, travel, law, teaching, higher learning, and meaning",
        "signStructure": {
          "element": "water",
          "modality": "fixed",
          "combined": "fixed water"
        },
        "ruler": {
          "planet": "Mars",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Nine supplies belief, philosophy, travel, law, teaching, higher learning, and meaning.",
        "signLayer": "Scorpio supplies fixed water.",
        "rulerLayer": "Mars supplies the organizing mechanism traditionally.",
        "result": "Belief becomes fixed water: philosophy and higher learning deepen through emotional truth, loyalty to deeply held convictions, and the willingness to explore life's mysteries. Mars rules the house traditionally, so understanding is organized through courage, intensity, and transformative insight."
      },
      "description": "Belief becomes fixed water: philosophy and higher learning deepen through emotional truth, loyalty to deeply held convictions, and the willingness to explore life's mysteries. Mars rules the house traditionally, so understanding is organized through courage, intensity, and transformative insight."
    },
    {
      "id": "pisces-rising-house-10-sagittarius",
      "risingSign": "Pisces",
      "offsetSet": 12,
      "symbolicDisplacementFromNatural": 11,
      "houseNumber": 10,
      "houseName": "House Ten",
      "sign": "Sagittarius",
      "title": "Sagittarius as House Ten",
      "ingredients": {
        "houseField": "vocation, public life, authority, visibility, achievement, and consequence",
        "signStructure": {
          "element": "fire",
          "modality": "mutable",
          "combined": "mutable fire"
        },
        "ruler": {
          "planet": "Jupiter",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Ten supplies vocation, public life, authority, visibility, achievement, and consequence.",
        "signLayer": "Sagittarius supplies mutable fire.",
        "rulerLayer": "Jupiter supplies the organizing mechanism.",
        "result": "Vocation becomes mutable fire: public life expands through teaching, exploration, meaning-making, and the continual widening of horizons. Jupiter rules the house, so authority is organized through wisdom, generosity, and the ability to inspire a larger vision."
      },
      "description": "Vocation becomes mutable fire: public life expands through teaching, exploration, meaning-making, and the continual widening of horizons. Jupiter rules the house, so authority is organized through wisdom, generosity, and the ability to inspire a larger vision."
    },
    {
      "id": "pisces-rising-house-11-capricorn",
      "risingSign": "Pisces",
      "offsetSet": 12,
      "symbolicDisplacementFromNatural": 11,
      "houseNumber": 11,
      "houseName": "House Eleven",
      "sign": "Capricorn",
      "title": "Capricorn as House Eleven",
      "ingredients": {
        "houseField": "community, friends, groups, hopes, networks, and shared futures",
        "signStructure": {
          "element": "earth",
          "modality": "cardinal",
          "combined": "cardinal earth"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": null
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Eleven supplies community, friends, groups, hopes, networks, and shared futures.",
        "signLayer": "Capricorn supplies cardinal earth.",
        "rulerLayer": "Saturn supplies the organizing mechanism.",
        "result": "Community becomes cardinal earth: friendships and aspirations take shape through responsibility, structure, commitment, and the patient building of enduring networks. Saturn rules the house, so belonging is organized through duty, accountability, and long-term cooperation."
      },
      "description": "Community becomes cardinal earth: friendships and aspirations take shape through responsibility, structure, commitment, and the patient building of enduring networks. Saturn rules the house, so belonging is organized through duty, accountability, and long-term cooperation."
    },
    {
      "id": "pisces-rising-house-12-aquarius",
      "risingSign": "Pisces",
      "offsetSet": 12,
      "symbolicDisplacementFromNatural": 11,
      "houseNumber": 12,
      "houseName": "House Twelve",
      "sign": "Aquarius",
      "title": "Aquarius as House Twelve",
      "ingredients": {
        "houseField": "solitude, retreat, hidden things, sorrow, dream, undoing, and release",
        "signStructure": {
          "element": "air",
          "modality": "fixed",
          "combined": "fixed air"
        },
        "ruler": {
          "planet": "Saturn",
          "qualifier": "traditionally"
        }
      },
      "derivation": {
        "formula": "house field plus sign element plus sign modality plus ruler mechanism",
        "houseLayer": "House Twelve supplies solitude, retreat, hidden things, sorrow, dream, undoing, and release.",
        "signLayer": "Aquarius supplies fixed air.",
        "rulerLayer": "Saturn supplies the organizing mechanism traditionally.",
        "result": "The hidden realm becomes fixed air: solitude, retreat, and release become places of contemplation, pattern recognition, and participation in realities larger than the personal self. Saturn rules the house traditionally, so surrender is organized through perspective, coherence, and the quiet integration of one's place within greater systems."
      },
      "description": "The hidden realm becomes fixed air: solitude, retreat, and release become places of contemplation, pattern recognition, and participation in realities larger than the personal self. Saturn rules the house traditionally, so surrender is organized through perspective, coherence, and the quiet integration of one's place within greater systems."
    }
  ]
};
