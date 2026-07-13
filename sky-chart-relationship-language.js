// Rewrites Sky Chart relationship readings into concise customer-facing language.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const PLANET_MEANING = {
    Sun:'identity and vitality', Moon:'feeling and instinct', Mercury:'thought and communication', Venus:'values and attraction', Mars:'drive and action', Jupiter:'growth and expansion', Saturn:'structure and commitment', Uranus:'freedom, change, and originality', Neptune:'imagination, surrender, and vision', Pluto:'power, transformation, and depth'
  };
  const ASPECT_QUALITY = {
    conjunction:'a concentrated, fused contact', opposition:'a polarized, mirroring contact', square:'a tense, activating contact', trine:'a low-resistance, flowing contact', sextile:'a cooperative, opportunity-forming contact', quincunx:'an adjusting, recalibrating contact'
  };
  const ELEMENT_FLAVOR = {
    fire:'Their shared fire element gives the contact a bold, direct, action-oriented quality.',
    earth:'Their shared earth element gives the contact a practical, grounded, material quality.',
    air:'Their shared air element gives the contact a mental, social, idea-driven quality.',
    water:'Their shared water element gives the contact an emotional, intuitive, receptive quality.'
  };

  function durationSentence(root) {
    const text = root.textContent || '';
    const match = text.match(/(several hours;[^.]+|several days;[^.]+|one to several weeks;[^.]+|several weeks to a few months;[^.]+|several months;[^.]+|many months;[^.]+)/i);
    if (!match) return '';
    return 'This influence lasts ' + match[1].replace(/^several /i, 'several ').replace(/;\s*the closest passage/i, ', with the closest passage').replace(/;\s*repeated exact passages/i, ', and repeated exact passages') + '.';
  }

  function rewrite(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(function (node) {
      const value = (node.nodeValue || '').trim();
      if (!/ forms an? /i.test(value) || !/The contact is/i.test(value)) return;

      const match = value.match(/^(.+?)'s\s+(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto)\s+in\s+([A-Za-z]+)\s+([^ ]+)\s+forms an?\s+(conjunction|opposition|square|trine|sextile|quincunx)\s+with\s+(.+?)'s\s+(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto)\s+in\s+([A-Za-z]+)\s+([^\.]+)\./i);
      if (!match) return;

      const leftName = match[1], leftPlanet = match[2], leftSign = match[3], leftDegree = match[4];
      const aspect = match[5].toLowerCase();
      const rightName = match[6], rightPlanet = match[7], rightSign = match[8], rightDegree = match[9].trim();
      const elementMatch = value.match(/Shared\s+(fire|earth|air|water)\s+element/i);
      const orbMatch = value.match(/Orb:\s*([^\.]+(?:\.[^\s]+)?)(?:\s*·\s*([^\.]+))?/i);

      let sentence = 'Because ' + leftName + "'s " + leftPlanet + ' in ' + leftSign + ' ' + leftDegree + ' forms a ' + aspect + ' to ' + rightName + "'s " + rightPlanet + ' in ' + rightSign + ' ' + rightDegree + ', there is ' + (ASPECT_QUALITY[aspect] || 'a meaningful contact') + ' between ' + (PLANET_MEANING[leftPlanet] || leftPlanet) + ' (' + leftPlanet + ') and ' + (PLANET_MEANING[rightPlanet] || rightPlanet) + ' (' + rightPlanet + ').';
      if (elementMatch && ELEMENT_FLAVOR[elementMatch[1].toLowerCase()]) sentence += ' ' + ELEMENT_FLAVOR[elementMatch[1].toLowerCase()];
      const duration = durationSentence(root);
      if (duration) sentence += ' ' + duration;
      if (orbMatch) sentence += ' Orb: ' + orbMatch[1].trim() + (orbMatch[2] ? ' · ' + orbMatch[2].trim() : '') + '.';

      node.nodeValue = sentence;
    });
  }

  function run() {
    document.querySelectorAll('body *').forEach(function (el) {
      const text = el.textContent || '';
      if (/RELATIONSHIP READING/i.test(text)) rewrite(el);
    });
  }

  function start() {
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
