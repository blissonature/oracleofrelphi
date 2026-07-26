// Ensures every Sky Chart progressive-reveal token uses the approved inscribed glyph unit.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NAME_TO_ID = {
    Sun:'sun', Moon:'moon', Mercury:'mercury', Venus:'venus', Mars:'mars',
    Jupiter:'jupiter', Saturn:'saturn', Uranus:'uranus', Neptune:'neptune', Pluto:'pluto',
    Chiron:'chiron', 'North Node':'north-node', 'South Node':'south-node', Lilith:'lilith',
    Vertex:'vertex', 'Part of Fortune':'part-of-fortune', Ascendant:'asc', Descendant:'dsc',
    Midheaven:'mc', 'Imum Coeli':'ic',
    Aries:'aries', Taurus:'taurus', Gemini:'gemini', Cancer:'cancer', Leo:'leo', Virgo:'virgo',
    Libra:'libra', Scorpio:'scorpio', Sagittarius:'sagittarius', Capricorn:'capricorn', Aquarius:'aquarius', Pisces:'pisces',
    Conjunction:'conjunction', Opposition:'opposition', Square:'square', Trine:'trine', Sextile:'sextile',
    Quincunx:'quincunx', 'Semi-Sextile':'semi-sextile', Octile:'octile', 'Tri-Octile':'tri-octile',
    Quintile:'quintile', 'Bi-Quintile':'bi-quintile'
  };

  function identityFor(button) {
    const label = button.getAttribute('aria-label') || '';
    const name = label.replace(/^Reveal\s+/i, '').trim();
    return NAME_TO_ID[name] || window.RelphiGlyphRegistry?.resolve(name)?.id || '';
  }

  function canonicalize(button) {
    if (!button || button.dataset.relphiCanonicalArt === 'true' || button.dataset.relphiCanonicalArt === 'pending') return;
    const identity = identityFor(button);
    const component = window.RelphiGlyphComponent;
    const registry = window.RelphiGlyphRegistry;
    const entry = identity && (registry?.get(identity) || registry?.resolve(identity));
    if (!identity || !component?.createBubble || !entry) return;

    const original = button.textContent;
    button.dataset.relphiCanonicalArt = 'pending';
    button.replaceChildren();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '-20 -20 40 40');
    svg.setAttribute('width', '1.2em');
    svg.setAttribute('height', '1.2em');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.style.display = 'block';
    svg.style.overflow = 'visible';
    button.appendChild(svg);

    const bubble = component.createBubble(svg, identity, {
      radius:17,
      padding:1,
      color:'currentColor',
      fill:'#ffffff',
      strokeWidth:2.35
    });
    bubble.ready.then(function () {
      button.dataset.relphiCanonicalArt = 'true';
      button.dataset.glyphId = identity;
      button.dataset.masterSource = 'glyphs-unified-preview@0d56ee7ec0ea0fc3e44debcb809afde09f3271ab';
    }).catch(function () {
      button.dataset.relphiCanonicalArt = 'failed';
      button.textContent = original;
    });
  }

  function run() {
    document.querySelectorAll('.relphi-canonical-token-glyph, .relphi-progressive-glyph').forEach(canonicalize);
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
    }).observe(document.body, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();