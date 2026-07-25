// Ensures every SkyChart relationship token uses the canonical glyph renderer.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const NAME_TO_ID = {
    Sun:'sun', Moon:'moon', Mercury:'mercury', Venus:'venus', Mars:'mars',
    Jupiter:'jupiter', Saturn:'saturn', Uranus:'uranus', Neptune:'neptune', Pluto:'pluto',
    Chiron:'chiron', Ascendant:'asc', Midheaven:'mc',
    Aries:'aries', Taurus:'taurus', Gemini:'gemini', Cancer:'cancer', Leo:'leo', Virgo:'virgo',
    Libra:'libra', Scorpio:'scorpio', Sagittarius:'sagittarius', Capricorn:'capricorn', Aquarius:'aquarius', Pisces:'pisces',
    Conjunction:'conjunction', Opposition:'opposition', Square:'square', Trine:'trine', Sextile:'sextile',
    Quincunx:'quincunx', 'Semi-Sextile':'semi-sextile', Octile:'octile', 'Tri-Octile':'tri-octile',
    Quintile:'quintile', 'Bi-Quintile':'bi-quintile'
  };

  function correctRegistry() {
    const registry = window.RelphiGlyphRegistry;
    if (!registry) return;
    const mars = registry.resolve('mars');
    if (mars) {
      mars.dx = 0;
      mars.dy = 0;
    }
  }

  function identityFor(button) {
    const label = button.getAttribute('aria-label') || '';
    const name = label.replace(/^Reveal\s+/i, '').trim();
    return NAME_TO_ID[name] || window.RelphiGlyphRegistry?.resolve(name)?.id || '';
  }

  function canonicalize(button) {
    if (!button || button.dataset.relphiCanonicalArt === 'true') return;
    const identity = identityFor(button);
    const component = window.RelphiGlyphComponent;
    const registry = window.RelphiGlyphRegistry;
    const entry = identity && registry?.resolve(identity);
    if (!identity || !component || !entry) return;

    button.dataset.relphiCanonicalArt = 'true';
    button.replaceChildren();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '-20 -20 40 40');
    svg.setAttribute('width', '1.15em');
    svg.setAttribute('height', '1.15em');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.style.display = 'block';
    svg.style.overflow = 'visible';
    button.appendChild(svg);
    component.draw(svg, identity, { radius:17, padding:1.5, color:'currentColor', bubbleStrokeWidth:0 })
      .catch(function () {
        button.dataset.relphiCanonicalArt = 'failed';
        const fallback = entry.aliases?.find(function (value) { return /[^A-Za-z\s-]/.test(value); }) || entry.fallback || entry.name;
        button.textContent = fallback;
      });
  }

  function run() {
    correctRegistry();
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
