// Stage canonical glyphs offscreen, fit them there, and commit only the finished-size art.
(function () {
  'use strict';
  if (window.__relphiGlyphAtomicLoaderV1) return;
  const base = window.RelphiGlyphComponent;
  if (!base?.draw || !base?.createBubble) return;
  window.__relphiGlyphAtomicLoaderV1 = true;
  window.__relphiGlyphAtomicCommitActive = true;

  const NS = 'http://www.w3.org/2000/svg';
  const svg = name => document.createElementNS(NS, name);
  let stage = null;
  let sequence = 0;

  function ensureStage() {
    if (stage?.isConnected) return stage;
    stage = svg('svg');
    stage.id = 'relphiGlyphAtomicStage';
    stage.setAttribute('width', '1');
    stage.setAttribute('height', '1');
    stage.setAttribute('viewBox', '-1000 -1000 2000 2000');
    stage.setAttribute('aria-hidden', 'true');
    Object.assign(stage.style, {
      position: 'fixed',
      left: '-10000px',
      top: '-10000px',
      width: '1px',
      height: '1px',
      overflow: 'visible',
      opacity: '0',
      pointerEvents: 'none',
      contain: 'layout style paint',
      zIndex: '-1'
    });
    (document.body || document.documentElement).appendChild(stage);
    return stage;
  }

  async function draw(parent, identity, options) {
    if (!parent) throw new Error('A glyph parent is required.');
    const staging = svg('g');
    staging.dataset.atomicGlyphStage = String(++sequence);
    ensureStage().appendChild(staging);
    let art;
    try {
      art = await base.draw(staging, identity, options);
      art.dataset.relphiAtomicCommit = 'true';
      art.dataset.relphiAtomicIdentity = String(identity);
      parent.appendChild(art);
      window.dispatchEvent(new CustomEvent('relphi:glyph-atomic-committed', {
        detail:{ identity:String(identity), art }
      }));
      return art;
    } finally {
      staging.remove();
    }
  }

  function createBubble(parent, identity, options) {
    const registry = window.RelphiGlyphRegistry;
    const entry = registry && (registry.get(identity) || registry.resolve(identity));
    if (!entry) throw new Error('Unknown glyph identity: ' + identity);

    const radius = Number(options?.radius || 19);
    const color = options?.color || '#dc1f18';
    const strokeWidth = Number(options?.strokeWidth || 2.35);
    const root = svg('g');
    root.classList.add('relphi-glyph-bubble');
    root.dataset.glyphId = entry.id;
    root.dataset.relphiAtomicBubble = 'true';
    root.dataset.relphiAtomicPending = 'true';

    const circle = svg('circle');
    circle.setAttribute('cx', '0');
    circle.setAttribute('cy', '0');
    circle.setAttribute('r', String(radius));
    circle.setAttribute('fill', options?.fill || '#fff');
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', String(strokeWidth));
    root.appendChild(circle);
    parent.appendChild(root);

    const ready = draw(root, entry.id, {
      radius,
      padding: options?.padding ?? 1,
      color,
      bubbleStrokeWidth: strokeWidth
    }).then(art => {
      delete root.dataset.relphiAtomicPending;
      root.dataset.relphiAtomicReady = 'true';
      return art;
    }, error => {
      delete root.dataset.relphiAtomicPending;
      root.dataset.relphiAtomicError = 'true';
      throw error;
    });
    return { root, circle, entry, ready };
  }

  window.RelphiGlyphComponent = Object.freeze({
    ...base,
    draw,
    createBubble,
    atomicCommit: true,
    atomicStageId: 'relphiGlyphAtomicStage'
  });
})();
