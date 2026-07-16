// Rewrites Sky Chart relationship readings into explanatory, meaning-first language.
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
    ASC:'the way a person enters life, meets the world, and is immediately perceived',
    MC:'public direction, vocation, visibility, and the role a person grows toward'
  };

  const BODY_TERM = {
    ASC:'Ascendant',
    MC:'Midheaven'
  };

  const ASPECT_MEANING = {
    conjunction:'a concentrated relationship in which the two functions operate together and intensify one another',
    opposition:'a polarized relationship that creates awareness through contrast, mirroring, and negotiation',
    square:'a tense, activating relationship that demands movement, effort, and development',
    trine:'a flowing, low-resistance relationship in which the two functions support one another naturally',
    sextile:'a cooperative relationship that creates usable opportunities when it is consciously engaged',
    quincunx:'an awkward but productive relationship that requires ongoing adjustment and recalibration'
  };

  const ELEMENT_MEANING = {
    fire:'Both placements operate through initiative, enthusiasm, directness, and the urge to act',
    earth:'Both placements operate through practicality, embodiment, stability, and material reality',
    air:'Both placements operate through ideas, language, social exchange, and perspective',
    water:'Both placements operate through feeling, intuition, receptivity, and emotional memory'
  };

  const BODY_PATTERN = '(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|ASC|MC)';

  function displayTerm(body) {
    return BODY_TERM[body] || body;
  }

  function durationSentence(root) {
    const text = root.textContent || '';
    const match = text.match(/(several hours;[^.]+|several days;[^.]+|one to several weeks;[^.]+|several weeks to a few months;[^.]+|several months;[^.]+|many months;[^.]+)/i);
    if (!match) return '';
    return 'This influence lasts ' + match[1]
      .replace(/;\s*the closest passage/i, ', with the closest passage')
      .replace(/;\s*repeated exact passages/i, ', and repeated exact passages') + '.';
  }

  function parse(value) {
    const pattern = new RegExp(
      "^(.+?)'s\\s+" + BODY_PATTERN +
      "\\s+in\\s+([A-Za-z]+)\\s+([^ ]+)\\s+forms an?\\s+" +
      '(conjunction|opposition|square|trine|sextile|quincunx)' +
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
      const elementMatch = value.match(/Shared\s+(fire|earth|air|water)\s+element/i);
      const orbMatch = value.match(/Orb:\s*([^·.]+(?:\.[^·\s]+)?)(?:\s*·\s*([^\.]+))?/i);

      let sentence = leftName + "'s " + (BODY_MEANING[leftBody] || leftBody) +
        ' (' + displayTerm(leftBody) + ' in ' + leftSign + ' ' + leftDegree + ') connects with ' +
        rightName + "'s " + (BODY_MEANING[rightBody] || rightBody) +
        ' (' + displayTerm(rightBody) + ' in ' + rightSign + ' ' + rightDegree + ') through ' +
        (ASPECT_MEANING[aspect] || 'a meaningful relationship') + ' (' + aspect + ').';

      if (elementMatch) {
        const element = elementMatch[1].toLowerCase();
        if (ELEMENT_MEANING[element]) sentence += ' ' + ELEMENT_MEANING[element] + ' (shared ' + element + ' element).';
      }

      const duration = durationSentence(root);
      if (duration) sentence += ' ' + duration;
      if (orbMatch) sentence += ' Orb: ' + orbMatch[1].trim() + (orbMatch[2] ? ' · ' + orbMatch[2].trim() : '') + '.';

      node.nodeValue = sentence;
    });
  }

  function run() {
    document.querySelectorAll('body *').forEach(function (element) {
      const text = element.textContent || '';
      if (/RELATIONSHIP READING/i.test(text)) rewrite(element);
    });
  }

  function start() {
    run();
    let queued = false;
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        run();
      });
    }).observe(document.body, { childList:true, subtree:true, characterData:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
