// Shared Sky Chart terminology. Edit definitions here, not in presentation or export code.
// Compact: the short Vocab referent. Expanded: the fuller Relationships export explanation.
// The distinct lengths are intentional, but both live in this single authored module.
(function(){
'use strict';
if(window.RelphiTermDefinitions)return;
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_REFERENTS={
  Aries:'initiative, directness, courage, impulse, and beginning',
  Taurus:'embodiment, value, pleasure, endurance, and material continuity',
  Gemini:'writing, speech, learning, information exchange, and interpretation',
  Cancer:'care, protection, memory, belonging, and attachment',
  Leo:'radiance, creativity, pride, loyalty, and recognition',
  Virgo:'discernment, service, refinement, repair, and usefulness',
  Libra:'relationship, balance, fairness, dialogue, and mutual recognition',
  Scorpio:'intensity, secrecy, survival, bonding, and emotional truth',
  Sagittarius:'the search for meaning, greater aspirations, worldview, and the bigger picture',
  Capricorn:'structure, responsibility, endurance, mastery, and worldly form',
  Aquarius:'systems, reform, collective intelligence, detachment, and future orientation',
  Pisces:'surrender, imagination, compassion, permeability, and release'
};
const HOUSE_NAMES=['','First House','Second House','Third House','Fourth House','Fifth House','Sixth House','Seventh House','Eighth House','Ninth House','Tenth House','Eleventh House','Twelfth House'];
const HOUSE_REFERENTS=['',
  'self, embodiment, appearance, approach, and the immediate way life is entered',
  'resources, possessions, money, personal values, and what is held as one’s own',
  'communication, learning, siblings, neighbors, short journeys, and the local environment',
  'home, roots, family, ancestry, privacy, and the foundations of life',
  'creativity, pleasure, romance, children, play, and personal self-expression',
  'work, service, routines, health practices, maintenance, and practical obligations',
  'partnership, contracts, one-to-one relationship, and encounters with the other',
  'shared resources, intimacy, debt, inheritance, vulnerability, and transformation',
  'worldview, religion, philosophy, higher learning, long journeys, and the search for meaning',
  'vocation, public standing, reputation, authority, achievement, and visible responsibility',
  'friends, networks, groups, alliances, hopes, and participation in a larger collective',
  'retreat, hidden processes, solitude, confinement, surrender, spirituality, and closure'
];
const PLACEMENT_REFERENTS={
  sun:'identity',
  moon:'feelings and emotional needs',
  mercury:'thought and communication',
  venus:'values, affection, attraction, and relating',
  mars:'drive, assertion, conflict, and action',
  jupiter:'growth, meaning, opportunity, and expansion',
  saturn:'structure, limits, responsibility, and time',
  uranus:'disruption',
  neptune:'imagination, ideals, permeability, and surrender',
  pluto:'power, depth, elimination, and transformation',
  chiron:'wound',
  asc:'immediate presentation and the way life is entered',
  dsc:'partnership and encounters with the other',
  mc:'public visibility',
  ic:'foundation for home and family',
  'north-node':'growth through unfamiliar experience',
  'south-node':'familiar and inherited patterns',
  lilith:'instinctive autonomy and refusal',
  'asteroid-lilith':'equality',
  'part-of-fortune':'fortune and openings',
  vertex:'consequential encounters',
  'anti-vertex':'what becomes accessible through the back door',
  child:'children',
  hidalgo:'independence',
  victoria:'victory',
  daphne:'self-preservation through transformation',
  vesta:'devotion'
};
const ASPECT_NAMES={
  conjunction:'Conjunction',
  'semi-sextile':'Semi-Sextile',
  octile:'Octile',
  sextile:'Sextile',
  quintile:'Quintile',
  square:'Square',
  trine:'Trine',
  'tri-octile':'Tri-Octile',
  'bi-quintile':'Bi-Quintile',
  quincunx:'Quincunx',
  opposition:'Opposition'
};
const ASPECT_REFERENTS={
  conjunction:'union',
  'semi-sextile':'accommodation',
  octile:'focused friction',
  sextile:'cooperative opening',
  quintile:'creative pattern-making',
  square:'activating pressure',
  trine:'low-resistance flow',
  'tri-octile':'accumulated friction',
  'bi-quintile':'refined creative pattern-making',
  quincunx:'continuing adjustment',
  opposition:'polarity'
};
const EXPANDED_SIGN_REFERENTS={Aries:'initiative, directness, courage, impulse, and beginning',Taurus:'embodiment, value, pleasure, endurance, and material continuity',Gemini:'language, exchange, curiosity, movement, and multiplicity',Cancer:'care, protection, memory, belonging, and attachment',Leo:'radiance, creativity, pride, loyalty, and recognition',Virgo:'discernment, service, refinement, repair, and usefulness',Libra:'relationship, balance, fairness, dialogue, and mutual recognition',Scorpio:'intensity, secrecy, survival, bonding, and emotional truth',Sagittarius:'meaning, faith, exploration, philosophy, and freedom',Capricorn:'structure, responsibility, endurance, mastery, and worldly form',Aquarius:'systems, reform, collective intelligence, detachment, and future orientation',Pisces:'surrender, imagination, compassion, permeability, and release'};
const EXPANDED_PLACEMENT_REFERENTS={sun:'identity, vitality, and conscious purpose',moon:'feelings, instincts, memory, and emotional needs',mercury:'thought, perception, language, and communication',venus:'values, attraction, affection, pleasure, and relating',mars:'drive, assertion, desire, conflict, and action',jupiter:'growth, confidence, meaning, opportunity, and expansion',saturn:'structure, limits, responsibility, time, and commitment',uranus:'freedom, disruption, originality, awakening, and change',neptune:'imagination, sensitivity, surrender, ideals, and vision',pluto:'power, depth, compulsion, elimination, and transformation',chiron:'wounding, healing intelligence, and the capacity to guide healing',asc:'the way a person enters life and is immediately perceived',dsc:'the way a person meets partners and encounters the other',mc:'public direction, vocation, visibility, and the role a person grows toward',ic:'roots, home, private foundations, and inherited belonging','north-node':'growth through unfamiliar experience and developing capacity','south-node':'familiar patterns, inherited capacity, and the known path',lilith:'instinctive autonomy, refusal, exile, and uncompromised desire','part-of-fortune':'the meeting place of body, feeling, circumstance, and ease',vertex:'encounters that feel consequential or outside ordinary control','anti-vertex':'what becomes accessible through the back door'};
const EXPANDED_HOUSE_REFERENTS=['','self, embodiment, appearance, approach, and the immediate way life is entered','resources, possessions, money, personal values, and what is held as one’s own','communication, learning, siblings, neighbors, short journeys, and the local environment','home, roots, family, ancestry, privacy, and the foundations of life','creativity, pleasure, romance, children, play, and personal self-expression','work, service, routines, health practices, maintenance, and practical obligations','partnership, contracts, one-to-one relationship, and encounters with the other','shared resources, intimacy, debt, inheritance, vulnerability, and transformation','worldview, religion, philosophy, higher learning, long journeys, and the search for meaning','vocation, public standing, reputation, authority, achievement, and visible responsibility','friends, networks, groups, alliances, hopes, and participation in a larger collective','retreat, hidden processes, solitude, confinement, surrender, spirituality, and closure'];
const EXPANDED_ASPECT_REFERENTS={conjunction:'the two functions operate together','semi-sextile':'neighboring functions accommodate one another',octile:'focused friction and adjustment',sextile:'a cooperative opening activated through participation',quintile:'creative pattern-making and specialized skill',square:'activating pressure and development',trine:'low-resistance exchange','tri-octile':'accumulated friction and redirection','bi-quintile':'refined creative pattern-making',quincunx:'continuing adjustment and translation',opposition:'awareness through polarity, contrast, and exchange'};
const CONFIGS={
  'grand-trine':{name:'Grand Trine',referent:'closed three-way low-resistance flow'},
  kite:{name:'Kite',referent:'low-resistance circuit given direction through an opposing axis'},
  yod:{name:'Yod / Finger of God',referent:'converging adjustment toward a single apex'},
  'mystic-rectangle':{name:'Mystic Rectangle',referent:'balanced polarity linked by alternating flow and opportunity'},
  't-square':{name:'T-Square',referent:'opposition concentrated through a third point'},
  'grand-cross':{name:'Grand Cross / Grand Square',referent:'four-way activating pressure across two opposing axes'},
  'minor-grand-trine':{name:'Minor Grand Trine',referent:'flowing exchange focused through a cooperative apex'},
  'grand-sextile':{name:'Grand Sextile',referent:'six-point cooperative circuit with interlocking flow and polarity'},
  cradle:{name:'Cradle',referent:'opposing poles supported by a network of trines and sextiles'},
  'thors-hammer':{name:"Thor's Hammer / Fist of God",referent:'concentrated friction driven through a single apex'}
};
const dictionary=Object.freeze({SIGNS,SIGN_REFERENTS,HOUSE_NAMES,HOUSE_REFERENTS,PLACEMENT_REFERENTS,ASPECT_NAMES,ASPECT_REFERENTS,EXPANDED_SIGN_REFERENTS,EXPANDED_PLACEMENT_REFERENTS,EXPANDED_HOUSE_REFERENTS,EXPANDED_ASPECT_REFERENTS,CONFIGS});
window.RelphiTermDefinitions=dictionary;
})();
