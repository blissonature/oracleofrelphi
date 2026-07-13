// Corrects aspect duration language using the body from the Dynamic sky.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const PLANETS = ['Moon','Mercury','Venus','Sun','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
  const DURATION = {
    Moon: { tier:'Short-lived / immediate', phrase:'several hours; the closest passage is usually contained within part of a day' },
    Mercury: { tier:'Brief / fast-moving', phrase:'several days; the closest passage is usually strongest for hours to a day' },
    Venus: { tier:'Brief / fast-moving', phrase:'several days; the closest passage is usually strongest for about a day' },
    Sun: { tier:'Brief / steady', phrase:'several days; the closest passage is usually strongest for about a day' },
    Mars: { tier:'Developing / active', phrase:'one to several weeks; the closest passage can remain active for days' },
    Jupiter: { tier:'Long-term / developmental', phrase:'several weeks to a few months; the closest passage can remain active for weeks' },
    Saturn: { tier:'Long-term / structural', phrase:'several months; the closest passage can remain active for weeks' },
    Uranus: { tier:'Long-term / structural', phrase:'many months; repeated exact passages may extend the story beyond a year' },
    Neptune: { tier:'Long-term / structural', phrase:'many months; repeated exact passages may extend the story beyond a year' },
    Pluto: { tier:'Long-term / structural', phrase:'many months; repeated exact passages may extend the story beyond a year' }
  };

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function roles() {
    if (window.RelphiSkyRoles) return window.RelphiSkyRoles;
    try {
      const saved = JSON.parse(localStorage.getItem('relphiSkyChartRoles') || 'null');
      return {
        chart: saved && saved.chart === 'static' ? 'static' : 'dynamic',
        currentSky: saved && saved.currentSky === 'dynamic' ? 'dynamic' : 'static'
      };
    } catch (error) {
      return { chart:'dynamic', currentSky:'static' };
    }
  }

  function outputText(target) {
    const node = document.getElementById(target === 'chart' ? 'chartOutput' : 'currentSkyOutput');
    return normalize(node && node.textContent);
  }

  function extractPairs(text) {
    const planetPattern = PLANETS.join('|');
    const pattern = new RegExp("([A-Z][A-Za-z0-9 .:/_\\-]{0,70}?)(?:'s|’s)\\s+(" + planetPattern + ")", 'g');
    const pairs = [];
    let match;
    while ((match = pattern.exec(text))) {
      pairs.push({ label:match[1].trim(), planet:match[2] });
    }
    return pairs;
  }

  function scoreLabelAgainstOutput(label, text) {
    const clean = normalize(label);
    if (!clean || !text) return 0;
    if (text.includes(clean)) return clean.length + 20;
    const words = clean.split(' ').filter(function (word) { return word.length > 2; });
    return words.reduce(function (score, word) { return score + (text.includes(word) ? word.length : 0); }, 0);
  }

  function dynamicBodyFromRoles(text) {
    const currentRoles = roles();
    const dynamicTarget = currentRoles.chart === 'dynamic' ? 'chart' : (currentRoles.currentSky === 'dynamic' ? 'currentSky' : null);
    if (!dynamicTarget) return null;

    const pairs = extractPairs(text);
    if (!pairs.length) return null;

    const dynamicText = outputText(dynamicTarget);
    const staticText = outputText(dynamicTarget === 'chart' ? 'currentSky' : 'chart');
    let best = null;
    let bestScore = -Infinity;

    pairs.forEach(function (pair) {
      const score = scoreLabelAgainstOutput(pair.label, dynamicText) - scoreLabelAgainstOutput(pair.label, staticText);
      if (score > bestScore) {
        bestScore = score;
        best = pair.planet;
      }
    });

    if (bestScore > 0) return best;

    // Common explicit moving-sky labels remain a backward-compatible fallback.
    const explicit = text.match(/(?:Planetary Hours date|transit|current sky|moving sky)(?:'s|’s)?\s+(Moon|Mercury|Venus|Sun|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto)/i);
    return explicit ? explicit[1] : null;
  }

  function patchDurationText(root) {
    const allText = root.textContent || '';
    const body = dynamicBodyFromRoles(allText);
    if (!body || !DURATION[body]) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(function (node) {
      let value = node.nodeValue || '';
      if (!/Short-lived|Brief|Developing|Long-term|several hours|several days|several months|many months|several weeks|closest passage|repeated exact passages/i.test(value)) return;

      value = value
        .replace(/(?:Short-lived|Brief|Developing|Long-term)(?:\s*\/\s*[A-Za-z-]+)?/gi, DURATION[body].tier)
        .replace(/several hours;\s*the closest passage is usually contained within part of a day/gi, DURATION[body].phrase)
        .replace(/several days;\s*the closest passage is usually strongest for hours to a day/gi, DURATION[body].phrase)
        .replace(/several days;\s*the closest passage is usually strongest for about a day/gi, DURATION[body].phrase)
        .replace(/one to several weeks;\s*the closest passage can remain active for days/gi, DURATION[body].phrase)
        .replace(/several weeks to a few months;\s*the closest passage can remain active for weeks/gi, DURATION[body].phrase)
        .replace(/several months;\s*the closest passage can remain active for weeks/gi, DURATION[body].phrase)
        .replace(/many months;\s*repeated exact passages may extend the story beyond a year/gi, DURATION[body].phrase);

      node.nodeValue = value;
    });
  }

  function run() {
    const candidates = Array.from(document.querySelectorAll('body *')).filter(function (el) {
      const text = el.textContent || '';
      return /SELECTED RELATIONSHIP/i.test(text) && /RELATIONSHIP READING/i.test(text);
    });
    patchDurationText(candidates.length ? candidates[candidates.length - 1] : document.body);
  }

  function start() {
    run();
    document.addEventListener('relphi:skyroleschange', run);
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
