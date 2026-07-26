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

  function ensureStyles() {
    if (document.getElementById('relphi-progressive-canonical-size')) return;
    const style = document.createElement('style');
    style.id = 'relphi-progressive-canonical-size';
    style.textContent = [
      '.relphi-progressive-reading{line-height:1.75}',
      '.relphi-progressive-token{display:inline-flex;align-items:center;vertical-align:middle;max-width:100%}',
      '.relphi-progressive-glyph{display:inline-grid!important;place-items:center!important;vertical-align:middle!important;width:1.45em!important;height:1.45em!important;min-width:1.45em!important;min-height:1.45em!important;max-width:1.45em!important;max-height:1.45em!important;padding:0!important;margin:0 .12em!important;line-height:1!important;overflow:hidden!important;border:0!important;background:transparent!important}',
      '.relphi-progressive-glyph>svg{display:block!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;overflow:hidden!important}',
      '.relphi-progressive-name,.relphi-progressive-meaning{vertical-align:baseline}'
    ].join('');
    document.head.appendChild(style);
  }

  function identityFor(button) {
    const label = button.getAttribute('aria-label') || '';
    const name = label.replace(/^Reveal\s+/i, '').trim();
    return NAME_TO_ID[name] || window.RelphiGlyphRegistry?.resolve(name)?.id || '';
  }

  function resolvedColor(button) {
    const value = getComputedStyle(button).color;
    return value && value !== 'rgba(0, 0, 0, 0)' ? value : '#111111';
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

    // Build detached and publish atomically. The fixed viewport clips only overflow;
    // it does not alter the approved unit's internal geometry or positioning.
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '-20 -20 40 40');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.style.display = 'block';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.overflow = 'hidden';

    let bubble;
    try {
      bubble = component.createBubble(svg, identity, {
        radius:17,
        padding:1,
        color:resolvedColor(button),
        fill:'#ffffff',
        strokeWidth:2.35
      });
    } catch (_) {
      button.dataset.relphiCanonicalArt = 'failed';
      return;
    }

    bubble.ready.then(function () {
      if (!button.isConnected) return;
      button.replaceChildren(svg);
      button.dataset.relphiCanonicalArt = 'true';
      button.dataset.glyphId = identity;
      button.dataset.masterSource = 'glyphs-unified-preview@0d56ee7ec0ea0fc3e44debcb809afde09f3271ab';
    }).catch(function () {
      button.dataset.relphiCanonicalArt = 'failed';
      button.textContent = original;
    });
  }

  function run() {
    ensureStyles();
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