// Build each canonical glyph off-DOM and insert the finished canonical object once.
(function () {
  'use strict';
  if (window.__relphiGlyphAtomicLoaderV3) return;
  const base = window.RelphiGlyphComponent;
  const registry = window.RelphiGlyphRegistry;
  if (!base?.draw || !base?.createBubble || !registry) return;

  window.__relphiGlyphAtomicLoaderV1 = true;
  window.__relphiGlyphAtomicLoaderV2 = true;
  window.__relphiGlyphAtomicLoaderV3 = true;
  window.__relphiGlyphAtomicCommitActive = true;

  const NS = 'http://www.w3.org/2000/svg';
  const svg = name => document.createElementNS(NS, name);
  const assetCache = new Map();
  let stage = null;
  let sequence = 0;

  function entryFor(identity) {
    return registry.get(identity) || registry.resolve(identity);
  }

  function ensureStage() {
    if (stage?.isConnected) return stage;
    stage = svg('svg');
    stage.id = 'relphiGlyphAtomicStage';
    stage.setAttribute('width', '256');
    stage.setAttribute('height', '256');
    stage.setAttribute('viewBox', '-128 -128 256 256');
    stage.setAttribute('aria-hidden', 'true');
    Object.assign(stage.style, {
      position:'fixed',
      left:'-10000px',
      top:'0',
      width:'256px',
      height:'256px',
      overflow:'visible',
      visibility:'hidden',
      pointerEvents:'none',
      zIndex:'-1'
    });
    const bodyStyle = document.body ? getComputedStyle(document.body) : null;
    if (bodyStyle?.fontFamily) stage.style.fontFamily = bodyStyle.fontFamily;
    (document.body || document.documentElement).appendChild(stage);
    return stage;
  }

  async function loadAuthoredAsset(path) {
    if (assetCache.has(path)) return assetCache.get(path).cloneNode(true);
    const response = await fetch(path + '?v=canonical-source');
    if (!response.ok) throw new Error('Could not load authored glyph asset: ' + path);
    const source = new DOMParser().parseFromString(await response.text(), 'image/svg+xml').documentElement;
    if (!source || source.nodeName.toLowerCase() !== 'svg') throw new Error('Invalid authored glyph asset: ' + path);
    assetCache.set(path, source);
    return source.cloneNode(true);
  }

  function recolor(root, color) {
    root.querySelectorAll('path,circle,ellipse,rect,polygon,polyline,line').forEach(node => {
      const fill = node.getAttribute('fill');
      const stroke = node.getAttribute('stroke');
      if (fill && fill !== 'none') node.setAttribute('fill', color);
      if (stroke && stroke !== 'none') node.setAttribute('stroke', color);
      node.style.opacity = '1';
    });
  }

  function sourceViewBox(source) {
    const raw = String(source.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    if (raw.length === 4 && raw.every(Number.isFinite) && raw[2] > 0 && raw[3] > 0) return raw;
    const width = Number.parseFloat(source.getAttribute('width'));
    const height = Number.parseFloat(source.getAttribute('height'));
    if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) return [0, 0, width, height];
    throw new Error('Authored glyph asset has no usable viewBox.');
  }

  async function buildAuthoredAsset(entry, options) {
    const source = await loadAuthoredAsset(entry.asset);
    const [minX, minY, width, height] = sourceViewBox(source);
    const radius = Number(options?.radius || 18);
    const padding = Math.max(1, Number(options?.padding ?? 1));
    const bubbleStrokeWidth = Math.max(0, Number(options?.bubbleStrokeWidth || 0));
    const usableRadius = Math.max(1, radius - bubbleStrokeWidth / 2 - padding);
    const authoredScale = Math.max(0.01, Number(entry.scale) || 1);
    const scale = (usableRadius * 2 / Math.max(width, height)) * authoredScale;
    const cx = minX + width / 2;
    const cy = minY + height / 2;
    const rotation = Number(entry.canonicalRotation) || 0;
    const art = svg('g');
    Array.from(source.children).forEach(child => art.appendChild(document.importNode(child, true)));
    recolor(art, options?.color || '#dc1f18');
    art.setAttribute('transform', `translate(${Number(entry.dx) || 0} ${Number(entry.dy) || 0}) rotate(${rotation}) scale(${scale}) translate(${-cx} ${-cy})`);
    art.classList.add('relphi-canonical-glyph', 'relphi-glyph-' + entry.id);
    art.dataset.relphiCanonicalViewBox = `${minX} ${minY} ${width} ${height}`;
    art.dataset.relphiCanonicalRotation = String(rotation);
    return art;
  }

  function markFinal(art, entry) {
    art.dataset.relphiAtomicCommit = 'true';
    art.dataset.relphiAtomicIdentity = entry.id;
    art.dataset.relphiAtomicBuild = 'detached-final';
    art.dataset.relphiCopyId = entry.id;
    art.dataset.relphiCanonicalSource = entry.canonicalSource || entry.asset || (entry.canonicalUnicode ? `unicode:${entry.canonicalUnicode}` : 'registry');
    return art;
  }

  async function buildFinalArt(identity, options) {
    const entry = entryFor(identity);
    if (!entry) throw new Error('Unknown glyph identity: ' + identity);

    if (entry.asset && entry.canonicalPreserveViewBox === true) {
      return markFinal(await buildAuthoredAsset(entry, options), entry);
    }

    const staging = svg('g');
    staging.dataset.atomicGlyphStage = String(++sequence);
    ensureStage().appendChild(staging);
    try {
      if (!entry.asset && document.fonts?.ready) await document.fonts.ready;
      const art = await base.draw(staging, entry.id, options);
      art.remove();
      return markFinal(art, entry);
    } finally {
      staging.remove();
    }
  }

  async function draw(parent, identity, options) {
    if (!parent) throw new Error('A glyph parent is required.');
    const art = await buildFinalArt(identity, options);
    parent.appendChild(art);
    window.dispatchEvent(new CustomEvent('relphi:glyph-atomic-committed', {
      detail:{ identity:String(identity), art, mode:'detached-final-canonical' }
    }));
    return art;
  }

  function fit(node, radius, padding, entry, bubbleStrokeWidth) {
    if (
      node?.dataset?.relphiAtomicBuild === 'detached-final' &&
      node.isConnected &&
      !node.closest?.('#relphiGlyphAtomicStage')
    ) return node;
    return base.fit?.(node, radius, padding, entry, bubbleStrokeWidth);
  }

  function createBubble(parent, identity, options) {
    if (!parent) throw new Error('A glyph parent is required.');
    const entry = entryFor(identity);
    if (!entry) throw new Error('Unknown glyph identity: ' + identity);

    const radius = Number(options?.radius || 19);
    const color = options?.color || '#dc1f18';
    const strokeWidth = Number(options?.strokeWidth || 2.35);
    const root = svg('g');
    root.classList.add('relphi-glyph-bubble');
    root.dataset.glyphId = entry.id;
    root.dataset.relphiCopyId = entry.id;
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

    const ready = buildFinalArt(entry.id, {
      radius,
      padding:options?.padding ?? 1,
      color,
      bubbleStrokeWidth:strokeWidth
    }).then(art => {
      root.appendChild(art);
      delete root.dataset.relphiAtomicPending;
      root.dataset.relphiAtomicReady = 'true';
      root.dataset.relphiAtomicBuild = 'detached-final';
      root.dataset.relphiCanonicalSource = art.dataset.relphiCanonicalSource || 'registry';
      parent.appendChild(root);
      window.dispatchEvent(new CustomEvent('relphi:glyph-atomic-committed', {
        detail:{ identity:entry.id, art, root, mode:'detached-final-canonical' }
      }));
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
    fit,
    createBubble,
    atomicCommit:true,
    atomicBuildMode:'detached-final-canonical',
    atomicStageId:'relphiGlyphAtomicStage'
  });
})();
