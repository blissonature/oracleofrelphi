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
    const match = text.match(/(several hours;[^.]+|several days;[^.]+|one to several weeks;[^.]+|several weeks to a few months;[^.]+|several months;[^.]+|many months;[^.]+|days to two weeks)/i);
    if (!match) return '';
    if (/^days to two weeks$/i.test(match[1])) return 'This influence lasts days to two weeks.';
    return 'This influence lasts ' + match[1]
      .replace(/;\s*the closest passage/i, ', with the closest passage')
      .replace(/;\s*repeated exact passages/i, ', and repeated exact passages') + '.';
  }

  function findReadingRoot() {
    const headings = Array.from(document.querySelectorAll('body *')).filter(function (el) {
      return /^Relationship reading$/i.test((el.textContent || '').trim());
    });
    if (!headings.length) return null;
    const heading = headings[headings.length - 1];
    return heading.parentElement || heading;
  }

  function parseReading(text) {
    return text.match(/(.+?)(?:'s|’s)\s+(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto)\s+in\s+([A-Za-z]+)\s+([^\s]+)\s+forms an?\s+(conjunction|opposition|square|trine|sextile|quincunx)\s+with\s+(.+?)(?:'s|’s)\s+(Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto)\s+in\s+([A-Za-z]+)\s+([^\.]+)\./i);
  }

  function rewrite(root) {
    if (!root || root.dataset.relphiRelationshipRewrite === 'done') return;
    const fullText = (root.textContent || '').replace(/\s+/g, ' ').trim();
    const match = parseReading(fullText);
    if (!match) return;

    const leftName = match[1].replace(/^Relationship reading\s*/i, '').trim();
    const leftPlanet = match[2], leftSign = match[3], leftDegree = match[4];
    const aspect = match[5].toLowerCase();
    const rightName = match[6].trim(), rightPlanet = match[7], rightSign = match[8], rightDegree = match[9].trim();
    const elementMatch = fullText.match(/Shared\s+(fire|earth|air|water)\s+element/i);
    const orbMatch = fullText.match(/Orb:\s*([^·]+?)\s*·\s*([^\.]+(?:orb)?)/i);

    let sentence = 'Because ' + leftName + "'s " + leftPlanet + ' in ' + leftSign + ' ' + leftDegree + ' forms a ' + aspect + ' to ' + rightName + "'s " + rightPlanet + ' in ' + rightSign + ' ' + rightDegree + ', there is ' + (ASPECT_QUALITY[aspect] || 'a meaningful contact') + ' between ' + (PLANET_MEANING[leftPlanet] || leftPlanet) + ' (' + leftPlanet + ') and ' + (PLANET_MEANING[rightPlanet] || rightPlanet) + ' (' + rightPlanet + ').';
    if (elementMatch && ELEMENT_FLAVOR[elementMatch[1].toLowerCase()]) sentence += ' ' + ELEMENT_FLAVOR[elementMatch[1].toLowerCase()];
    const duration = durationSentence(root.closest('article, section, div') || root);
    if (duration) sentence += ' ' + duration;
    if (orbMatch) sentence += ' Orb: ' + orbMatch[1].trim() + ' · ' + orbMatch[2].trim().replace(/\s*orb$/i, '') + '.';

    const textNodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    const firstSentenceNode = textNodes.find(function (node) {
      return /forms an?\s+(conjunction|opposition|square|trine|sextile|quincunx)/i.test(node.nodeValue || '');
    });
    if (!firstSentenceNode) return;

    firstSentenceNode.nodeValue = sentence;
    textNodes.forEach(function (node) {
      if (node === firstSentenceNode) return;
      if (/The contact is|Shared\s+(fire|earth|air|water)\s+element|Shared\s+(cardinal|fixed|mutable)\s+modality|Orb:/i.test(node.nodeValue || '')) node.nodeValue = '';
    });
    root.dataset.relphiRelationshipRewrite = 'done';
  }

  function run() {
    rewrite(findReadingRoot());
  }

  function start() {
    run();
    let queued = false;
    new MutationObserver(function () {
      const root = findReadingRoot();
      if (root) delete root.dataset.relphiRelationshipRewrite;
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; run(); });
    }).observe(document.body, { childList:true, subtree:true, characterData:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();