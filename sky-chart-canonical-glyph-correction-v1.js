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
      '.relphi-progressive-token,.relphi-canonical-token{display:inline-flex;align-items:center;vertical-align:middle;max-width:100%}',
      '.relphi-progressive-glyph,.relphi-canonical-token-glyph{display:inline-grid!important;place-items:center!important;vertical-align:middle!important;width:1.45em!important;height:1.45em!important;min-width:1.45em!important;min-height:1.45em!important;max-width:1.45em!important;max-height:1.45em!important;padding:0!important;margin:0 .12em!important;line-height:1!important;overflow:hidden!important;border:0!important;background:transparent!important}',
      '.relphi-progressive-glyph>svg,.relphi-canonical-token-glyph>svg{display:block!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;overflow:hidden!important}',
      '.relphi-progressive-name,.relphi-progressive-meaning,.relphi-canonical-token-name,.relphi-canonical-token-meaning{vertical-align:baseline}',
      '.relphi-progressive-glyph-stage{position:fixed!important;left:-10000px!important;top:-10000px!important;width:40px!important;height:40px!important;visibility:hidden!important;pointer-events:none!important;overflow:hidden!important}',
      '.relationship-explore-pieces[data-relphi-retired="true"]{display:none!important}'
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

  function fitsInsideCircle(svg) {
    const bubble = svg.querySelector('.relphi-glyph-bubble');
    const circle = bubble && bubble.querySelector(':scope > circle');
    const art = bubble && bubble.querySelector('.relphi-canonical-glyph');
    if (!circle || !art) return false;

    const circleBox = circle.getBoundingClientRect();
    const artBox = art.getBoundingClientRect();
    if (!circleBox.width || !circleBox.height || !artBox.width || !artBox.height) return false;

    const tolerance = 0.75;
    return artBox.left >= circleBox.left - tolerance &&
      artBox.right <= circleBox.right + tolerance &&
      artBox.top >= circleBox.top - tolerance &&
      artBox.bottom <= circleBox.bottom + tolerance;
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

    const stage = document.createElement('span');
    stage.className = 'relphi-progressive-glyph-stage';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '-20 -20 40 40');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.style.display = 'block';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.overflow = 'hidden';
    stage.appendChild(svg);
    document.body.appendChild(stage);

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
      stage.remove();
      button.dataset.relphiCanonicalArt = 'failed';
      return;
    }

    bubble.ready.then(function () {
      return new Promise(function (resolve) {
        requestAnimationFrame(function () { requestAnimationFrame(resolve); });
      });
    }).then(function () {
      if (!button.isConnected || !fitsInsideCircle(svg)) {
        stage.remove();
        button.dataset.relphiCanonicalArt = 'failed';
        button.textContent = original;
        return;
      }
      stage.remove();
      button.replaceChildren(svg);
      button.dataset.relphiCanonicalArt = 'true';
      button.dataset.glyphId = identity;
      button.dataset.masterSource = 'glyphs-unified-preview@0d56ee7ec0ea0fc3e44debcb809afde09f3271ab';
    }).catch(function () {
      stage.remove();
      button.dataset.relphiCanonicalArt = 'failed';
      button.textContent = original;
    });
  }

  function retireDuplicateExplore() {
    document.querySelectorAll('.relphi-progressive-reading,.relphi-canonical-relationship-reading').forEach(function (reading) {
      if (!reading.querySelector('.relphi-canonical-token-glyph,.relphi-progressive-glyph')) return;
      const panel = reading.closest('.relationship-prose-panel') || reading.parentElement;
      const explore = panel && panel.querySelector('.relationship-explore-pieces');
      if (explore) {
        explore.dataset.relphiRetired = 'true';
        explore.hidden = true;
        explore.setAttribute('aria-hidden', 'true');
      }
    });
  }

  function run() {
    ensureStyles();
    document.querySelectorAll('.relphi-canonical-token-glyph, .relphi-progressive-glyph').forEach(canonicalize);
    retireDuplicateExplore();
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