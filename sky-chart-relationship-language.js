// Applies one reversible glyph -> name -> meaning language system to every supported Sky Chart relationship.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const BODIES = {
    Sun:['☉','luminary','identity, vitality, and conscious purpose',['Sun']],
    Moon:['☽','luminary','feelings, instincts, and emotional needs',['Moon']],
    Mercury:['☿','planet','thought, perception, and communication',['Mercury']],
    Venus:['♀','planet','values, attraction, affection, and relating',['Venus']],
    Mars:['♂','planet','drive, assertion, desire, and action',['Mars']],
    Jupiter:['♃','planet','growth, confidence, meaning, and expansion',['Jupiter']],
    Saturn:['♄','planet','structure, limits, responsibility, and commitment',['Saturn']],
    Uranus:['♅','planet','freedom, disruption, originality, and change',['Uranus']],
    Neptune:['♆','planet','imagination, sensitivity, surrender, and vision',['Neptune']],
    Pluto:['⯓','planet','power, depth, transformation, and compulsion',['Pluto']],
    Chiron:['⚷','minor body','wounding, medicine, teaching, and initiation through pain',['Chiron']],
    'North Node':['☊','lunar node','growth, appetite, direction, and unfamiliar development',['North Node','True Node','Mean Node','Ascending Node','Node']],
    'South Node':['☋','lunar node','habit, residue, release, and familiar patterns',['South Node','Descending Node']],
    Lilith:['⚸','calculated point','refusal, exile, autonomy, taboo, and uncompromised need',['Lilith','Black Moon Lilith']],
    'Part of Fortune':['⊗','lot','material flow, embodied support, worldly ease, and circumstance',['Part of Fortune','Pars Fortunae','Fortune']],
    Vertex:['Vx','calculated point','encounter, relational thresholds, and fated-feeling meetings',['Vertex','Vx']],
    Ascendant:['ASC','angle','the way a person enters life, meets the world, and is immediately perceived',['Ascendant','ASC','Rising']],
    Descendant:['DSC','angle','partners, mirrors, others, and the relational horizon',['Descendant','DSC']],
    Midheaven:['MC','angle','public direction, vocation, visibility, and the role a person grows toward',['Midheaven','MC']],
    'Imum Coeli':['IC','angle','roots, home, ancestry, privacy, and the hidden foundation',['Imum Coeli','IC']]
  };

  const SIGNS = {
    Aries:['♈','initiative, directness, courage, impulse, and beginning'], Taurus:['♉','embodiment, value, pleasure, endurance, and material continuity'],
    Gemini:['♊','language, exchange, curiosity, movement, and multiplicity'], Cancer:['♋','care, protection, memory, belonging, and attachment'],
    Leo:['♌','radiance, creativity, pride, loyalty, and recognition'], Virgo:['♍','discernment, service, refinement, repair, and usefulness'],
    Libra:['♎','relationship, balance, fairness, dialogue, and mutual recognition'], Scorpio:['♏','intensity, secrecy, survival, bonding, and emotional truth'],
    Sagittarius:['♐','meaning, faith, exploration, philosophy, and freedom'], Capricorn:['♑','structure, responsibility, endurance, mastery, and worldly form'],
    Aquarius:['♒','systems, reform, collective intelligence, detachment, and future orientation'], Pisces:['♓','surrender, imagination, compassion, permeability, and release']
  };

  const ASPECTS = {
    conjunction:['☌','a concentrated relationship in which the two functions operate together and intensify one another',['conjunction','conjunct']],
    semisextile:['⚺','an adjacent relationship that creates subtle friction, awareness, and small continuing adjustments',['semisextile','semi-sextile','semi sextile']],
    undecile:['U','an elevenfold harmonic relationship associated with unusual integration, compulsion, and nonordinary patterning',['undecile']],
    decile:['D','a tenth-harmonic relationship associated with specialized ability, construction, and applied talent',['decile','semiquintile','semi-quintile']],
    novile:['N','a ninth-harmonic relationship associated with ripening, inward completion, and spiritual development',['novile']],
    semisquare:['∠','a tense minor relationship that produces irritation, pressure, and the need for corrective action',['semisquare','semi-square','semi square','octile']],
    septile:['S','a seventh-harmonic relationship associated with nonlinear choice, destiny, and difficult-to-rationalize turning points',['septile']],
    sextile:['✶','a cooperative relationship that creates usable opportunities when consciously engaged',['sextile']],
    quintile:['Q','a fifth-harmonic relationship associated with creative intelligence, patterning, craft, and distinctive talent',['quintile']],
    binovile:['bN','a doubled ninth-harmonic relationship associated with maturation, integration, and contemplative development',['binovile','bi-novile','bi novile']],
    square:['□','a tense, activating relationship that demands movement, effort, and development',['square']],
    biseptile:['bS','a doubled seventh-harmonic relationship associated with consequential choices and nonlinear developmental pressure',['biseptile','bi-septile','bi septile']],
    tridecile:['tD','a tenth-harmonic relationship associated with refined aptitude, productive specialization, and crafted expression',['tridecile','tri-decile','tri decile']],
    trine:['△','a flowing, low-resistance relationship in which the two functions support one another naturally',['trine']],
    sesquiquadrate:['⚼','a compounded frictional relationship that builds agitation and demands sustained adjustment',['sesquiquadrate','sesquisquare','sesqui-square','tri-octile','trioctile']],
    biquintile:['bQ','a doubled fifth-harmonic relationship associated with refined creative ability and complex pattern integration',['biquintile','bi-quintile','bi quintile']],
    quincunx:['⚻','an awkward but productive relationship that requires ongoing adjustment and recalibration',['quincunx','inconjunct']],
    triseptile:['tS','a tripled seventh-harmonic relationship associated with decisive thresholds, nonlinear timing, and consequential redirection',['triseptile','tri-septile','tri septile']],
    opposition:['☍','a polarized relationship that creates awareness through contrast, mirroring, and negotiation',['opposition','opposite']]
  };

  const ELEMENTS = { fire:['🜂','initiative, enthusiasm, directness, and the urge to act'], earth:['🜃','practicality, embodiment, stability, and material reality'], air:['🜁','ideas, language, social exchange, and perspective'], water:['🜄','feeling, intuition, receptivity, and emotional memory'] };

  function esc(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function aliasIndex(source) {
    const result = new Map();
    Object.entries(source).forEach(function (entry) { entry[1][3]?.forEach(function (alias) { result.set(alias.toLowerCase(), entry[0]); }); });
    return result;
  }
  const BODY_ALIAS = aliasIndex(BODIES);
  const ASPECT_ALIAS = aliasIndex(ASPECTS);
  const bodyPattern = Array.from(BODY_ALIAS.keys()).sort(function (a,b) { return b.length-a.length; }).map(esc).join('|');
  const aspectPattern = Array.from(ASPECT_ALIAS.keys()).sort(function (a,b) { return b.length-a.length; }).map(esc).join('|');
  const signPattern = Object.keys(SIGNS).join('|');
  const readingPattern = new RegExp("^(.+?)(?:'s|’s)\\s+(" + bodyPattern + ")\\s+in\\s+(" + signPattern + ")\\s+([^\\s]+)\\s+forms an?\\s+(" + aspectPattern + ")\\s+with\\s+(.+?)(?:'s|’s)\\s+(" + bodyPattern + ")\\s+in\\s+(" + signPattern + ")\\s+([^\\.]+)\\.", 'i');

  function token(glyph, name, meaning) {
    const wrap = document.createElement('span'); wrap.className = 'relphi-progressive-token';
    const glyphButton = document.createElement('button'); glyphButton.type = 'button'; glyphButton.className = 'relphi-progressive-term relphi-progressive-glyph'; glyphButton.textContent = glyph; glyphButton.setAttribute('aria-expanded','false');
    glyphButton.addEventListener('click', function (event) {
      event.stopPropagation();
      const oldName = wrap.querySelector('.relphi-progressive-name');
      if (oldName) { wrap.querySelector('.relphi-progressive-meaning')?.remove(); oldName.remove(); glyphButton.setAttribute('aria-expanded','false'); return; }
      const nameButton = document.createElement('button'); nameButton.type = 'button'; nameButton.className = 'relphi-progressive-term relphi-progressive-name'; nameButton.textContent = ' ' + name; nameButton.setAttribute('aria-expanded','false');
      nameButton.addEventListener('click', function (inner) {
        inner.stopPropagation();
        const oldMeaning = wrap.querySelector('.relphi-progressive-meaning');
        if (oldMeaning) { oldMeaning.remove(); nameButton.setAttribute('aria-expanded','false'); return; }
        const meaningButton = document.createElement('button'); meaningButton.type = 'button'; meaningButton.className = 'relphi-progressive-term relphi-progressive-meaning'; meaningButton.textContent = ' (' + meaning + ')';
        meaningButton.addEventListener('click', function (last) { last.stopPropagation(); meaningButton.remove(); nameButton.setAttribute('aria-expanded','false'); });
        wrap.appendChild(meaningButton); nameButton.setAttribute('aria-expanded','true');
      });
      wrap.appendChild(nameButton); glyphButton.setAttribute('aria-expanded','true');
    });
    wrap.appendChild(glyphButton); return wrap;
  }

  function placement(body, sign, degree) {
    const fragment = document.createDocumentFragment();
    const bodyData = BODIES[body]; const signData = SIGNS[sign];
    fragment.appendChild(token(bodyData[0], body, bodyData[1] + ': ' + bodyData[2]));
    fragment.append(' in '); fragment.appendChild(token(signData[0], sign, 'sign: ' + signData[1])); fragment.append(' at ' + degree);
    return fragment;
  }

  function installStyles() {
    if (document.getElementById('relphi-progressive-reading-styles')) return;
    const style = document.createElement('style'); style.id = 'relphi-progressive-reading-styles';
    style.textContent = '.relphi-progressive-reading{line-height:1.75}.relphi-progressive-term{appearance:none;border:0;background:transparent;color:inherit;font:inherit;padding:0;cursor:pointer;text-align:left}.relphi-progressive-glyph{font-family:"Segoe UI Symbol","Noto Sans Symbols",serif;font-size:1.14em;font-weight:800;text-decoration:underline dotted rgba(220,31,24,.52);text-underline-offset:.2em}.relphi-progressive-name,.relphi-progressive-meaning{margin-left:.22em}.relphi-progressive-name{font-weight:800;text-decoration:underline dotted rgba(17,17,17,.38);text-underline-offset:.2em}.relphi-progressive-meaning{color:#554d48;font-weight:520}.relphi-progressive-term:focus-visible{outline:2px solid rgba(220,31,24,.32);outline-offset:2px;border-radius:.2em}.relphi-progressive-hint{display:block;margin-top:.55rem;color:#706761;font-size:.78rem;font-weight:650}';
    document.head.appendChild(style);
  }

  function rewrite(root) {
    const nodes = []; const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (node.parentElement?.closest('.relphi-progressive-reading')) return;
      const value = (node.nodeValue || '').replace(/\s+/g,' ').trim(); if (!/ forms an? /i.test(value)) return;
      const match = value.match(readingPattern); if (!match) return;
      const bodyA = BODY_ALIAS.get(match[2].toLowerCase()), signA = match[3], aspect = ASPECT_ALIAS.get(match[5].toLowerCase());
      const bodyB = BODY_ALIAS.get(match[7].toLowerCase()), signB = match[8]; if (!bodyA || !bodyB || !aspect) return;
      const reading = document.createElement('span'); reading.className = 'relphi-progressive-reading';
      reading.append('Between ' + match[1].trim() + ' and ' + match[6].trim() + ', ');
      reading.appendChild(placement(bodyA, signA, match[4])); reading.append(' connects with '); reading.appendChild(placement(bodyB, signB, match[9].trim())); reading.append(' through ');
      const aspectData = ASPECTS[aspect]; reading.appendChild(token(aspectData[0], aspect, 'aspect: ' + aspectData[1])); reading.append('.');
      const elementMatch = value.match(/Shared\s+(fire|earth|air|water)\s+element/i); if (elementMatch) { const key = elementMatch[1].toLowerCase(); reading.append(' They share '); reading.appendChild(token(ELEMENTS[key][0], key, 'element: ' + ELEMENTS[key][1])); reading.append('.'); }
      const orbMatch = value.match(/Orb:\s*([^\.]+(?:\.|$))/i); if (orbMatch) reading.append(' Orb: ' + orbMatch[1].trim());
      const hint = document.createElement('span'); hint.className = 'relphi-progressive-hint'; hint.textContent = 'Select a glyph for its name, then select the name for its meaning. Select either again to fold back.'; reading.appendChild(hint);
      node.parentNode?.replaceChild(reading, node);
    });
  }

  function loadFilterGlyphs() {
    if (document.querySelector('script[src^="sky-chart-filter-glyphs-v1.js"]')) return;
    const script = document.createElement('script'); script.src = 'sky-chart-filter-glyphs-v1.js?v=2'; script.async = false; document.body.appendChild(script);
  }
  function run() { document.querySelectorAll('body *').forEach(function (element) { if (/RELATIONSHIP READING/i.test(element.textContent || '')) rewrite(element); }); }
  function start() { installStyles(); loadFilterGlyphs(); run(); let queued=false; new MutationObserver(function () { if (queued) return; queued=true; requestAnimationFrame(function () { queued=false; run(); }); }).observe(document.body,{childList:true,subtree:true,characterData:true}); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true }); else start();
})();