// Applies the same glyph -> name -> description reveal contract to every dual-card relationship placement.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const CARD_SELECTOR = '.relationship-reading-pair > .relationship-placement-card';
  const LAYERS = ['glyph', 'name', 'detail'];
  let queued = false;

  function ensureStylesheet() {
    if (document.querySelector('link[href^="sky-chart-relationship-progressive-reveal.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'sky-chart-relationship-progressive-reveal.css?v=1';
    document.head.appendChild(link);
  }

  function text(node) {
    return (node && node.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function firstOutside(root, selectors, excluded) {
    const nodes = Array.from(root.querySelectorAll(selectors));
    return nodes.find(function (node) {
      return !excluded.some(function (item) { return item && (item === node || item.contains(node)); });
    }) || null;
  }

  function directChildren(card) {
    return Array.from(card.children).filter(function (node) {
      return !/^(SCRIPT|STYLE|TEMPLATE)$/.test(node.tagName);
    });
  }

  function glyphNode(card) {
    const explicit = card.querySelector([
      '.relationship-placement-glyph',
      '.relationship-card-glyph',
      '.placement-glyph',
      '.relationship-glyph',
      '[data-placement-glyph]',
      '[data-relationship-glyph]',
      '[data-glyph]',
      '.planet-glyph',
      '.point-glyph',
      '.sign-glyph'
    ].join(','));
    if (explicit) return explicit;

    const svg = card.querySelector('svg');
    if (svg) {
      const parent = svg.parentElement;
      if (parent && parent !== card && text(parent).length <= 8) return parent;
      return svg;
    }

    return directChildren(card).find(function (node) {
      const value = text(node);
      return value.length > 0 && value.length <= 8 && !/[A-Za-z]{3,}/.test(value);
    }) || null;
  }

  function nameNode(card, glyph) {
    const explicit = firstOutside(card, [
      '.relationship-placement-name',
      '.relationship-card-name',
      '.placement-name',
      '.relationship-name',
      '[data-placement-name]',
      '[data-relationship-name]',
      '[data-name]',
      'h2', 'h3', 'h4', 'h5', 'strong'
    ].join(','), [glyph]);
    if (explicit) return explicit;

    return directChildren(card).find(function (node) {
      if (glyph && (node === glyph || node.contains(glyph))) return false;
      const value = text(node);
      return value.length >= 2 && value.length <= 90;
    }) || null;
  }

  function detailNodes(card, glyph, name) {
    const explicit = Array.from(card.querySelectorAll([
      '.relationship-placement-description',
      '.relationship-card-description',
      '.placement-description',
      '.relationship-description',
      '.relationship-placement-details',
      '.relationship-placement-meta',
      '[data-placement-description]',
      '[data-relationship-description]',
      '[data-description]',
      'p', 'small', 'dl', 'ul', 'ol'
    ].join(','))).filter(function (node) {
      return ![glyph, name].some(function (item) { return item && (item === node || item.contains(node)); });
    });
    if (explicit.length) return explicit;

    return directChildren(card).filter(function (node) {
      return ![glyph, name].some(function (item) {
        return item && (item === node || node.contains(item) || item.contains(node));
      });
    });
  }

  function makeLayer(node, layer) {
    if (!node) return;
    node.dataset.relphiRevealLayer = layer;
    if (!node.matches('button,a,input,select,textarea,summary,[tabindex]')) node.tabIndex = 0;
    if (!node.matches('button,a,input,select,textarea,summary,[role]')) node.setAttribute('role', 'button');
  }

  function stageNumber(card) {
    const value = Number(card.dataset.relphiRevealStageNumber);
    return Number.isFinite(value) ? Math.max(0, Math.min(2, value)) : 0;
  }

  function applyStage(card, stage) {
    const next = Math.max(0, Math.min(2, Number(stage) || 0));
    card.dataset.relphiRevealStageNumber = String(next);
    card.dataset.relphiRevealStage = LAYERS[next];

    card.querySelectorAll('[data-relphi-reveal-layer]').forEach(function (node) {
      const layer = node.dataset.relphiRevealLayer;
      const index = LAYERS.indexOf(layer);
      const visible = index <= next;
      node.hidden = !visible;
      node.setAttribute('aria-hidden', String(!visible));
      if (layer === 'glyph') node.setAttribute('aria-expanded', String(next >= 1));
      if (layer === 'name') node.setAttribute('aria-expanded', String(next >= 2));
    });

    card.dispatchEvent(new CustomEvent('relphi:relationshipreveal', {
      bubbles: true,
      detail: { stage: LAYERS[next], stageNumber: next }
    }));
  }

  function installCard(card) {
    const glyph = glyphNode(card);
    const name = nameNode(card, glyph);
    const details = detailNodes(card, glyph, name);
    if (!glyph || !name || !details.length) return;

    makeLayer(glyph, 'glyph');
    makeLayer(name, 'name');
    details.forEach(function (node) { makeLayer(node, 'detail'); });

    if (card.dataset.relphiProgressiveReveal !== 'ready') {
      card.dataset.relphiProgressiveReveal = 'ready';
      card.addEventListener('click', function (event) {
        const layer = event.target.closest && event.target.closest('[data-relphi-reveal-layer]');
        if (!layer || !card.contains(layer)) return;
        const current = stageNumber(card);
        const selected = LAYERS.indexOf(layer.dataset.relphiRevealLayer);
        if (selected < 0) return;

        event.preventDefault();
        event.stopPropagation();

        if (selected === 0) applyStage(card, current === 0 ? 1 : 0);
        else if (selected === 1) applyStage(card, current === 1 ? 2 : 1);
        else applyStage(card, 2);
      }, true);

      card.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const layer = event.target.closest && event.target.closest('[data-relphi-reveal-layer]');
        if (!layer || !card.contains(layer)) return;
        event.preventDefault();
        layer.click();
      });
    }

    if (!card.dataset.relphiRevealStageNumber) applyStage(card, 0);
    else applyStage(card, stageNumber(card));
  }

  function enhance() {
    ensureStylesheet();
    document.querySelectorAll(CARD_SELECTOR).forEach(installCard);
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      enhance();
    });
  }

  function install() {
    enhance();
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  }

  window.RelphiRelationshipProgressiveReveal = Object.freeze({ enhance: enhance, applyStage: applyStage });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
