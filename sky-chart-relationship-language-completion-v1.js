// Completes the progressive symbolic rewrite for aspect names and point aliases missed by the first pass.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const BODY = {
    Sun:['Sun','☉','identity, vitality, and conscious purpose'],
    Moon:['Moon','☽','feelings, instincts, and emotional needs'],
    Mercury:['Mercury','☿','thought, perception, and communication'],
    Venus:['Venus','♀','values, attraction, affection, and relating'],
    Mars:['Mars','♂','drive, assertion, desire, and action'],
    Jupiter:['Jupiter','♃','growth, confidence, meaning, and expansion'],
    Saturn:['Saturn','♄','structure, limits, responsibility, and commitment'],
    Uranus:['Uranus','♅','freedom, disruption, originality, and change'],
    Neptune:['Neptune','♆','imagination, sensitivity, surrender, and vision'],
    Pluto:['Pluto','⯓','power, depth, transformation, and compulsion'],
    ASC:['Ascendant','ASC','the way a person enters life, meets the world, and is immediately perceived'],
    MC:['Midheaven','MC','public direction, vocation, visibility, and the role a person grows toward']
  };
  const BODY_ALIAS = {
    Sun:'Sun',Moon:'Moon',Mercury:'Mercury',Venus:'Venus',Mars:'Mars',Jupiter:'Jupiter',
    Saturn:'Saturn',Uranus:'Uranus',Neptune:'Neptune',Pluto:'Pluto',
    ASC:'ASC',Ascendant:'ASC',Rising:'ASC',MC:'MC',Midheaven:'MC'
  };
  const SIGN = {
    Aries:'♈',Taurus:'♉',Gemini:'♊',Cancer:'♋',Leo:'♌',Virgo:'♍',
    Libra:'♎',Scorpio:'♏',Sagittarius:'♐',Capricorn:'♑',Aquarius:'♒',Pisces:'♓'
  };
  const ASPECT = {
    conjunction:['☌','concentrated and intensifying',['conjunction']],
    semisextile:['⚺','adjacent and incrementally adjusting',['semi-sextile','semisextile']],
    undecile:['U','subtle and nonlinearly patterning',['undecile']],
    decile:['D','specialized and skill-forming',['decile']],
    novile:['N','inwardly integrating and ripening',['novile']],
    semisquare:['∠','frictional and action-provoking',['semi-square','semisquare','octile']],
    septile:['S','nonlinear and threshold-shaping',['septile']],
    sextile:['✶','cooperative and opportunity-opening',['sextile']],
    quintile:['Q','creative, specialized, and pattern-forming',['quintile']],
    binovile:['bN','deepening and quietly integrating',['binovile','bi-novile']],
    square:['□','tense, activating, and development-demanding',['square']],
    biseptile:['bS','nonlinear, choice-shaping, and pattern-bending',['biseptile','bi-septile']],
    tridecile:['tD','productive, specialized, and creatively applied',['tridecile','tri-decile']],
    trine:['△','flowing, supportive, and low-resistance',['trine']],
    sesquiquadrate:['⚼','pressurized, reactive, and threshold-forming',['sesquiquadrate','sesquisquare','tri-octile','trioctile']],
    biquintile:['bQ','creative, specialized, and pattern-linking',['biquintile','bi-quintile']],
    quincunx:['⚻','awkward, productive, and recalibrating',['quincunx','inconjunct']],
    triseptile:['tS','nonlinear, complex, and resolution-pressing',['triseptile','tri-septile']],
    opposition:['☍','polarized, mirroring, and negotiation-producing',['opposition']]
  };

  const escape = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const bodyPattern = Object.keys(BODY_ALIAS).sort((a,b) => b.length-a.length).map(escape).join('|');
  const signPattern = Object.keys(SIGN).join('|');
  const aspectAlias = {};
  Object.entries(ASPECT).forEach(([key,value]) => value[2].forEach(alias => { aspectAlias[alias.toLowerCase()] = key; }));
  const aspectPattern = Object.keys(aspectAlias).sort((a,b) => b.length-a.length).map(escape).join('|');

  function token(glyph, name, meaning) {
    const wrap = document.createElement('span');
    wrap.className = 'relphi-progressive-token';
    const glyphButton = document.createElement('button');
    glyphButton.type = 'button';
    glyphButton.className = 'relphi-progressive-term relphi-progressive-glyph';
    glyphButton.textContent = glyph;
    glyphButton.setAttribute('aria-label','Reveal ' + name);
    glyphButton.setAttribute('aria-expanded','false');
    wrap.appendChild(glyphButton);

    glyphButton.addEventListener('click', function (event) {
      event.stopPropagation();
      const existing = wrap.querySelector('.relphi-progressive-name');
      if (existing) {
        wrap.querySelector('.relphi-progressive-meaning')?.remove();
        existing.remove();
        glyphButton.setAttribute('aria-expanded','false');
        return;
      }
      const nameButton = document.createElement('button');
      nameButton.type = 'button';
      nameButton.className = 'relphi-progressive-term relphi-progressive-name';
      nameButton.textContent = ' ' + name;
      nameButton.setAttribute('aria-label','Reveal what ' + name + ' represents');
      nameButton.setAttribute('aria-expanded','false');
      nameButton.addEventListener('click', function (nameEvent) {
        nameEvent.stopPropagation();
        const shown = wrap.querySelector('.relphi-progressive-meaning');
        if (shown) { shown.remove(); nameButton.setAttribute('aria-expanded','false'); return; }
        const meaningButton = document.createElement('button');
        meaningButton.type = 'button';
        meaningButton.className = 'relphi-progressive-term relphi-progressive-meaning';
        meaningButton.textContent = ' (' + meaning + ')';
        meaningButton.setAttribute('aria-label','Collapse the meaning of ' + name);
        meaningButton.addEventListener('click', function (meaningEvent) {
          meaningEvent.stopPropagation();
          meaningButton.remove();
          nameButton.setAttribute('aria-expanded','false');
        });
        wrap.appendChild(meaningButton);
        nameButton.setAttribute('aria-expanded','true');
      });
      wrap.appendChild(nameButton);
      glyphButton.setAttribute('aria-expanded','true');
    });
    return wrap;
  }

  function text(value) { return document.createTextNode(value); }
  function placement(body, sign, degree) {
    const data = BODY[body] || [body,body,body];
    const fragment = document.createDocumentFragment();
    fragment.appendChild(token(data[1],data[0],(body === 'ASC' || body === 'MC' ? 'angle: ' : 'planet: ') + data[2]));
    fragment.appendChild(text(' in '));
    fragment.appendChild(token(SIGN[sign] || sign,sign,'zodiac sign'));
    fragment.appendChild(text(' at ' + degree));
    return fragment;
  }

  function parse(value) {
    const pattern = new RegExp(
      String.raw`^(.+?)(?:'s|’s)\s+(${bodyPattern})\s+in\s+(${signPattern})\s+` +
      String.raw`(\d{1,2}°(?:\s*\d{1,2}[′']?)?)\s+forms\s+(?:a|an)\s+(${aspectPattern})\s+with\s+` +
      String.raw`(.+?)(?:'s|’s)\s+(${bodyPattern})\s+in\s+(${signPattern})\s+` +
      String.raw`(\d{1,2}°(?:\s*\d{1,2}[′']?)?)\.`, 'i');
    const match = value.match(pattern);
    if (!match) return null;
    return {
      leftName:match[1],leftBody:BODY_ALIAS[match[2]],leftSign:match[3],leftDegree:match[4],
      aspect:aspectAlias[match[5].toLowerCase()],
      rightName:match[6],rightBody:BODY_ALIAS[match[7]],rightSign:match[8],rightDegree:match[9]
    };
  }

  function rewrite(root) {
    const walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      const value = (node.nodeValue || '').trim();
      if (node.parentElement?.closest('.relphi-progressive-reading')) return;
      if (!/\sforms\s+(?:a|an)\s/i.test(value) || !/The contact is/i.test(value)) return;
      const parsed = parse(value);
      if (!parsed || !ASPECT[parsed.aspect]) return;
      const aspect = ASPECT[parsed.aspect];
      const orb = value.match(/Orb:\s*([^·.]+(?:\.[^·\s]+)?)(?:\s*·\s*([^\.]+))?/i);
      const reading = document.createElement('span');
      reading.className = 'relphi-progressive-reading';
      const sameSky = parsed.leftName.trim().toLowerCase() === parsed.rightName.trim().toLowerCase();
      reading.appendChild(text(sameSky ? 'In the same sky, ' : 'Between ' + parsed.leftName + ' and ' + parsed.rightName + ', '));
      reading.appendChild(placement(parsed.leftBody,parsed.leftSign,parsed.leftDegree));
      reading.appendChild(text(' connects with '));
      reading.appendChild(placement(parsed.rightBody,parsed.rightSign,parsed.rightDegree));
      reading.appendChild(text(' through '));
      reading.appendChild(token(aspect[0],parsed.aspect,'aspect: ' + aspect[1]));
      reading.appendChild(text('.'));
      if (orb) reading.appendChild(text(' Orb: ' + orb[1].trim() + (orb[2] ? ' · ' + orb[2].trim() : '') + '.'));
      const hint = document.createElement('span');
      hint.className = 'relphi-progressive-hint';
      hint.textContent = 'Select symbols to unfold them; select revealed text to fold it back.';
      reading.appendChild(hint);
      node.parentNode?.replaceChild(reading,node);
    });
  }

  function run() {
    document.querySelectorAll('body *').forEach(element => {
      if (/RELATIONSHIP READING/i.test(element.textContent || '')) rewrite(element);
    });
  }

  function start() {
    run();
    let queued = false;
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; run(); });
    }).observe(document.body,{childList:true,subtree:true,characterData:true});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
