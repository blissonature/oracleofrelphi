// Rewrites Sky Chart relationship readings as reversible, progressively disclosed symbolic language.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const BODY_MEANING = {
    Sun:'identity, vitality, and conscious purpose',
    Moon:'feelings, instincts, and emotional needs',
    Mercury:'thought, perception, and communication',
    Venus:'values, attraction, affection, and relating',
    Mars:'drive, assertion, desire, and action',
    Jupiter:'growth, confidence, meaning, and expansion',
    Saturn:'structure, limits, responsibility, and commitment',
    Uranus:'freedom, disruption, originality, and change',
    Neptune:'imagination, sensitivity, surrender, and vision',
    Pluto:'power, depth, transformation, and compulsion',
    Chiron:'the wound, the healing intelligence developed around it, and the capacity to guide healing',
    'North Node':'developmental direction, unfamiliar growth, and the path of becoming',
    'South Node':'familiar patterns, inherited capacities, and the past being integrated',
    Lilith:'untamed instinct, refusal, exile, and uncompromised self-possession',
    'Part of Fortune':'the place where circumstance, embodiment, and ease can support flourishing',
    Vertex:'encounters that feel consequential, fated, or outside ordinary control',
    ASC:'the way a person enters life, meets the world, and is immediately perceived',
    DSC:'the qualities met through partners, counterparts, and the relational field',
    MC:'public direction, vocation, visibility, and the role a person grows toward',
    IC:'roots, private foundations, ancestry, and the innermost sense of home'
  };

  const BODY_TERM = {
    ASC:'Ascendant',
    DSC:'Descendant',
    MC:'Midheaven',
    IC:'Imum Coeli'
  };

  const BODY_KIND = {
    Sun:'luminary',
    Moon:'luminary',
    ASC:'angle',
    DSC:'angle',
    MC:'angle',
    IC:'angle',
    'North Node':'node',
    'South Node':'node',
    'Part of Fortune':'calculated point',
    Vertex:'calculated point',
    Lilith:'calculated point',
    Chiron:'minor planet'
  };

  const BODY_KEY_ALIASES = {
    ASC:['ASC','Ascendant'], DSC:['DSC','Descendant'], MC:['MC','Midheaven'], IC:['IC','Imum Coeli'],
    'North Node':['North Node','Node','NN'], 'South Node':['South Node','SouthNode','SN'],
    'Part of Fortune':['Part of Fortune','Fortune','PoF'], Vertex:['Vertex','Vx'], Lilith:['Lilith'], Chiron:['Chiron']
  };

  const SIGN_MEANING = {
    Aries:'initiative, directness, courage, impulse, and beginning',
    Taurus:'embodiment, value, pleasure, endurance, and material continuity',
    Gemini:'language, exchange, curiosity, movement, and multiplicity',
    Cancer:'care, protection, memory, belonging, and attachment',
    Leo:'radiance, creativity, pride, loyalty, and recognition',
    Virgo:'discernment, service, refinement, repair, and usefulness',
    Libra:'relationship, balance, fairness, dialogue, and mutual recognition',
    Scorpio:'intensity, secrecy, survival, bonding, and emotional truth',
    Sagittarius:'meaning, faith, exploration, philosophy, and freedom',
    Capricorn:'structure, responsibility, endurance, mastery, and worldly form',
    Aquarius:'systems, reform, collective intelligence, detachment, and future orientation',
    Pisces:'surrender, imagination, compassion, permeability, and release'
  };

  const ASPECT_MEANING = {
    conjunction:'a concentrated relationship in which the two functions operate together and intensify one another',
    opposition:'a polarized relationship that creates awareness through contrast, mirroring, and negotiation',
    square:'a tense, activating relationship that demands movement, effort, and development',
    trine:'a flowing, low-resistance relationship in which the two functions support one another naturally',
    sextile:'a cooperative relationship that creates usable opportunities when it is consciously engaged',
    quincunx:'an awkward but productive relationship that requires ongoing adjustment and recalibration',
    'semi-sextile':'a subtle relationship that asks two functions to notice and accommodate one another',
    octile:'a minor hard relationship that creates friction and presses for action',
    'tri-octile':'a minor hard relationship that intensifies pressure toward adjustment and expression',
    quintile:'a creative relationship that supports specialized talent and intentional pattern-making',
    'bi-quintile':'a creative relationship that supports refined skill and unusual synthesis'
  };

  const ELEMENT_MEANING = {
    fire:'Both placements operate through initiative, enthusiasm, directness, and the urge to act',
    earth:'Both placements operate through practicality, embodiment, stability, and material reality',
    air:'Both placements operate through ideas, language, social exchange, and perspective',
    water:'Both placements operate through feeling, intuition, receptivity, and emotional memory'
  };

  const BODY_GLYPH = {
    Sun:'☉', Moon:'☽', Mercury:'☿', Venus:'♀', Mars:'♂', Jupiter:'♃', Saturn:'♄',
    Uranus:'♅', Neptune:'♆', Pluto:'⯓', Chiron:'⚷', 'North Node':'☊', 'South Node':'☋',
    Lilith:'⚸', 'Part of Fortune':'⊗', Vertex:'Vx', ASC:'ASC', DSC:'DSC', MC:'MC', IC:'IC'
  };
  const SIGN_GLYPH = {
    Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍',
    Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓'
  };
  const ASPECT_GLYPH = {
    conjunction:'☌', opposition:'☍', square:'□', trine:'△', sextile:'✶', quincunx:'⚻',
    'semi-sextile':'⚺', octile:'∠', 'tri-octile':'⚼', quintile:'Q', 'bi-quintile':'bQ'
  };
  const ELEMENT_GLYPH = { fire:'🜂', earth:'🜃', air:'🜁', water:'🜄' };

  const BODY_PATTERN = '(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron|North Node|South Node|Lilith|Part of Fortune|Vertex|ASC|DSC|MC|IC)';
  const ASPECT_PATTERN = '(conjunction|opposition|square|trine|sextile|quincunx|semi-sextile|octile|tri-octile|quintile|bi-quintile)';

  function displayTerm(body) { return BODY_TERM[body] || body; }

  function storedSky(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value && typeof value === 'object' ? value : null;
    } catch (_) { return null; }
  }

  function degreeParts(value) {
    const parts = String(value || '').match(/\d+/g) || [];
    return { degree:Number(parts[0]), minute:parts.length > 1 ? Number(parts[1]) : null };
  }

  function placementFor(placements, body) {
    const keys = BODY_KEY_ALIASES[body] || [body];
    for (let i = 0; i < keys.length; i += 1) if (placements && placements[keys[i]]) return placements[keys[i]];
    return null;
  }

  function verifiedOwner(fallback, body, sign, degreeText) {
    const wanted = degreeParts(degreeText);
    const matches = ['relphiSkyChartA', 'relphiSkyChartB'].map(storedSky).filter(function (sky) {
      const placements = sky && (sky.placements || sky);
      const placement = placementFor(placements, body);
      if (!placement || placement.sign !== sign || Number(placement.degree) !== wanted.degree) return false;
      return wanted.minute == null || placement.minute == null || Number(placement.minute) === wanted.minute;
    });
    if (matches.length !== 1) return fallback;
    return String(matches[0].name || fallback).trim() || fallback;
  }

  function text(value) { return document.createTextNode(value); }

  function progressiveToken(glyph, name, meaning) {
    const token = document.createElement('span');
    token.className = 'relphi-progressive-token';
    token.dataset.revealLevel = 'glyph';
    const glyphButton = document.createElement('button');
    glyphButton.type = 'button';
    glyphButton.className = 'relphi-progressive-term relphi-progressive-glyph';
    glyphButton.textContent = glyph;
    glyphButton.setAttribute('aria-label', 'Reveal ' + name);
    glyphButton.setAttribute('aria-expanded', 'false');
    token.appendChild(glyphButton);

    function removeMeaning() { token.querySelector('.relphi-progressive-meaning')?.remove(); }
    function toggleMeaning(nameButton) {
      const existing = token.querySelector('.relphi-progressive-meaning');
      if (existing) {
        existing.remove();
        nameButton.setAttribute('aria-expanded', 'false');
        token.dataset.revealLevel = 'name';
        return;
      }
      const meaningButton = document.createElement('button');
      meaningButton.type = 'button';
      meaningButton.className = 'relphi-progressive-term relphi-progressive-meaning';
      meaningButton.textContent = ' (' + meaning + ')';
      meaningButton.setAttribute('aria-label', 'Collapse the meaning of ' + name);
      meaningButton.addEventListener('click', function (event) {
        event.stopPropagation();
        meaningButton.remove();
        nameButton.setAttribute('aria-expanded', 'false');
        token.dataset.revealLevel = 'name';
      });
      token.appendChild(meaningButton);
      nameButton.setAttribute('aria-expanded', 'true');
      token.dataset.revealLevel = 'meaning';
    }

    glyphButton.addEventListener('click', function (event) {
      event.stopPropagation();
      const existingName = token.querySelector('.relphi-progressive-name');
      if (existingName) {
        removeMeaning();
        existingName.remove();
        glyphButton.setAttribute('aria-expanded', 'false');
        token.dataset.revealLevel = 'glyph';
        return;
      }
      const nameButton = document.createElement('button');
      nameButton.type = 'button';
      nameButton.className = 'relphi-progressive-term relphi-progressive-name';
      nameButton.textContent = ' ' + name;
      nameButton.setAttribute('aria-label', 'Reveal what ' + name + ' represents');
      nameButton.setAttribute('aria-expanded', 'false');
      nameButton.addEventListener('click', function (nameEvent) { nameEvent.stopPropagation(); toggleMeaning(nameButton); });
      token.appendChild(nameButton);
      glyphButton.setAttribute('aria-expanded', 'true');
      token.dataset.revealLevel = 'name';
    });
    return token;
  }

  function placementFragment(body, sign, degree) {
    const fragment = document.createDocumentFragment();
    const bodyKind = BODY_KIND[body] || 'planet';
    fragment.appendChild(progressiveToken(BODY_GLYPH[body] || body, displayTerm(body), bodyKind + ': ' + (BODY_MEANING[body] || body)));
    fragment.appendChild(text(' in '));
    fragment.appendChild(progressiveToken(SIGN_GLYPH[sign] || sign, sign, 'sign: ' + (SIGN_MEANING[sign] || sign)));
    fragment.appendChild(text(' at ' + degree));
    return fragment;
  }

  function installStyles() {
    if (document.getElementById('relphi-progressive-reading-styles')) return;
    const style = document.createElement('style');
    style.id = 'relphi-progressive-reading-styles';
    style.textContent = '.relphi-progressive-reading{line-height:1.75}.relphi-progressive-term{appearance:none;border:0;background:transparent;color:inherit;font:inherit;padding:0;cursor:pointer;text-align:left}.relphi-progressive-glyph{font-family:"Segoe UI Symbol","Noto Sans Symbols",serif;font-size:1.14em;font-weight:900;text-decoration:underline dotted rgba(220,31,24,.52);text-underline-offset:.2em}.relphi-progressive-name,.relphi-progressive-meaning{margin-left:.22em}.relphi-progressive-name{font-weight:800;text-decoration:underline dotted rgba(17,17,17,.38);text-underline-offset:.2em}.relphi-progressive-meaning{color:#554d48;font-weight:520}.relphi-progressive-term:hover,.relphi-progressive-term:focus-visible{color:#b81712;outline:2px solid rgba(220,31,24,.32);outline-offset:2px;border-radius:.2em}.relphi-progressive-hint{display:block;margin-top:.55rem;color:#706761;font-size:.78rem;font-weight:650}';
    document.head.appendChild(style);
  }

  function durationSentence(root) {
    const value = root.textContent || '';
    const match = value.match(/(several hours;[^.]+|several days;[^.]+|one to several weeks;[^.]+|several weeks to a few months;[^.]+|several months;[^.]+|many months;[^.]+)/i);
    if (!match) return '';
    return 'This influence lasts ' + match[1]
      .replace(/;\s*the closest passage/i, ', with the closest passage')
      .replace(/;\s*repeated exact passages/i, ', and repeated exact passages') + '.';
  }

  function parse(value) {
    const pattern = new RegExp(
      "^(.+?)'s\\s+" + BODY_PATTERN +
      "\\s+in\\s+([A-Za-z]+)\\s+([^ ]+)\\s+forms an?\\s+" +
      ASPECT_PATTERN +
      "\\s+with\\s+(.+?)'s\\s+" + BODY_PATTERN +
      "\\s+in\\s+([A-Za-z]+)\\s+([^\\.]+)\\.",
      'i'
    );
    return value.match(pattern);
  }

  function rewrite(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(function (node) {
      const value = (node.nodeValue || '').trim();
      if (node.parentElement?.closest('.relphi-progressive-reading')) return;
      if (!/ forms an? /i.test(value) || !/The contact is/i.test(value)) return;

      const match = parse(value);
      if (!match) return;

      const leftName = match[1];
      const leftBody = match[2];
      const leftSign = match[3];
      const leftDegree = match[4];
      const aspect = match[5].toLowerCase();
      const rightName = match[6];
      const rightBody = match[7];
      const rightSign = match[8];
      const rightDegree = match[9].trim();
      const verifiedLeftName = verifiedOwner(leftName, leftBody, leftSign, leftDegree);
      const verifiedRightName = verifiedOwner(rightName, rightBody, rightSign, rightDegree);
      const elementMatch = value.match(/Shared\s+(fire|earth|air|water)\s+element/i);
      const orbMatch = value.match(/Orb:\s*([^·.]+(?:\.[^·\s]+)?)(?:\s*·\s*([^\.]+))?/i);

      const reading = document.createElement('span');
      reading.className = 'relphi-progressive-reading';
      const sameSky = verifiedLeftName.trim().toLowerCase() === verifiedRightName.trim().toLowerCase();
      reading.appendChild(text(sameSky ? 'In the same sky, ' : 'Between ' + verifiedLeftName + ' and ' + verifiedRightName + ', '));
      reading.appendChild(placementFragment(leftBody, leftSign, leftDegree));
      reading.appendChild(text(' connects with '));
      reading.appendChild(placementFragment(rightBody, rightSign, rightDegree));
      reading.appendChild(text(' through '));
      reading.appendChild(progressiveToken(ASPECT_GLYPH[aspect] || aspect, aspect, 'aspect: ' + (ASPECT_MEANING[aspect] || 'a meaningful relationship')));
      reading.appendChild(text('.'));

      if (elementMatch) {
        const element = elementMatch[1].toLowerCase();
        reading.appendChild(text(' They share '));
        reading.appendChild(progressiveToken(ELEMENT_GLYPH[element] || element, element, 'element: ' + (ELEMENT_MEANING[element] || element)));
        reading.appendChild(text('.'));
      }

      const duration = durationSentence(root);
      if (duration) reading.appendChild(text(' ' + duration));
      if (orbMatch) reading.appendChild(text(' Orb: ' + orbMatch[1].trim() + (orbMatch[2] ? ' · ' + orbMatch[2].trim() : '') + '.'));
      const hint = document.createElement('span');
      hint.className = 'relphi-progressive-hint';
      hint.textContent = 'Select a symbol for its name, then select the name for its meaning. Select either level again to fold back.';
      reading.appendChild(hint);
      node.parentNode?.replaceChild(reading, node);
    });
  }

  function run() {
    document.querySelectorAll('body *').forEach(function (element) {
      const value = element.textContent || '';
      if (/RELATIONSHIP READING/i.test(value)) rewrite(element);
    });
  }

  function start() {
    installStyles();
    run();
    let queued = false;
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; run(); });
    }).observe(document.body, { childList:true, subtree:true, characterData:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();