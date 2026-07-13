// Corrects aspect duration language using the fastest moving body in the relationship.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SPEED_ORDER = ['Moon','Mercury','Venus','Sun','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
  const DURATION = {
    Moon: {
      tier: 'Short-lived / immediate',
      phrase: 'several hours; the closest passage is usually contained within part of a day'
    },
    Mercury: {
      tier: 'Brief / fast-moving',
      phrase: 'several days; the closest passage is usually strongest for hours to a day'
    },
    Venus: {
      tier: 'Brief / fast-moving',
      phrase: 'several days; the closest passage is usually strongest for about a day'
    },
    Sun: {
      tier: 'Brief / steady',
      phrase: 'several days; the closest passage is usually strongest for about a day'
    },
    Mars: {
      tier: 'Developing / active',
      phrase: 'one to several weeks; the closest passage can remain active for days'
    },
    Jupiter: {
      tier: 'Long-term / developmental',
      phrase: 'several weeks to a few months; the closest passage can remain active for weeks'
    },
    Saturn: {
      tier: 'Long-term / structural',
      phrase: 'several months; the closest passage can remain active for weeks'
    },
    Uranus: {
      tier: 'Long-term / structural',
      phrase: 'many months; repeated exact passages may extend the story beyond a year'
    },
    Neptune: {
      tier: 'Long-term / structural',
      phrase: 'many months; repeated exact passages may extend the story beyond a year'
    },
    Pluto: {
      tier: 'Long-term / structural',
      phrase: 'many months; repeated exact passages may extend the story beyond a year'
    }
  };

  function fastestBody(text) {
    const found = SPEED_ORDER.filter(function (name) {
      return new RegExp('\\b' + name + '\\b', 'i').test(text);
    });
    return found[0] || null;
  }

  function transitBodyFromReading(text) {
    const patterns = [
      /Planetary Hours date(?:'s|’s)\s+(Moon|Mercury|Venus|Sun|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto)/i,
      /transit\s+(Moon|Mercury|Venus|Sun|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto)/i,
      /current\s+(Moon|Mercury|Venus|Sun|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto)/i
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    }
    return null;
  }

  function relationshipRoot(node) {
    let el = node.nodeType === 1 ? node : node.parentElement;
    while (el && el !== document.body) {
      const text = el.textContent || '';
      if (/RELATIONSHIP READING/i.test(text) && /SELECTED RELATIONSHIP/i.test(text)) return el;
      el = el.parentElement;
    }
    return document.body;
  }

  function patchDurationText(root) {
    const allText = root.textContent || '';
    const body = transitBodyFromReading(allText) || fastestBody(allText);
    if (!body || !DURATION[body]) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(function (node) {
      let value = node.nodeValue || '';
      if (!/several months|many months|several weeks|closest passage/i.test(value)) return;

      value = value
        .replace(/Long-term\s*\/\s*structural/gi, DURATION[body].tier)
        .replace(/several months;\s*the closest passage can remain active for weeks/gi, DURATION[body].phrase)
        .replace(/many months;\s*repeated exact passages may extend the story beyond a year/gi, DURATION[body].phrase)
        .replace(/several weeks to a few months;\s*the closest passage can remain active for weeks/gi, DURATION[body].phrase)
        .replace(/one to several weeks;\s*the closest passage can remain active for days/gi, DURATION[body].phrase);

      node.nodeValue = value;
    });
  }

  function run() {
    const candidates = Array.from(document.querySelectorAll('body *')).filter(function (el) {
      const text = el.textContent || '';
      return /SELECTED RELATIONSHIP/i.test(text) && /RELATIONSHIP READING/i.test(text);
    });
    if (candidates.length) patchDurationText(candidates[candidates.length - 1]);
    else patchDurationText(document.body);
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
