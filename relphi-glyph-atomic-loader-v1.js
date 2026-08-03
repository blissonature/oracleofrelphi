// Build every canonical glyph completely off-DOM and insert it exactly once.
(function () {
  'use strict';
  if (window.__relphiGlyphAtomicLoaderV2) return;
  const base = window.RelphiGlyphComponent;
  if (!base?.draw || !base?.createBubble) return;

  window.__relphiGlyphAtomicLoaderV1 = true;
  window.__relphiGlyphAtomicLoaderV2 = true;
  window.__relphiGlyphAtomicCommitActive = true;

  const NS = 'http://www.w3.org/2000/svg';
  const svg = name => document.createElementNS(NS, name);
  let stage = null;
  let sequence = 0;

  const VECTOR_GLYPHS = Object.freeze({
    'north-node':{
      bounds:[17,22,66,53],
      markup:'<g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 58C24 36 35 25 50 25C65 25 76 36 80 58"/><circle cx="25" cy="67" r="8"/><circle cx="75" cy="67" r="8"/></g>'
    },
    'south-node':{
      bounds:[17,25,66,53],
      markup:'<g transform="rotate(180 50 50)" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 58C24 36 35 25 50 25C65 25 76 36 80 58"/><circle cx="25" cy="67" r="8"/><circle cx="75" cy="67" r="8"/></g>'
    },
    chiron:{
      bounds:[32,14,38,69],
      markup:'<g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="68" r="15"/><path d="M50 53V17M50 27L68 17M50 27L67 38"/></g>'
    },
    vertex:{
      bounds:[13,28,60,44],
      markup:'<path d="M13 28L31 72L49 28M55 43L73 72M73 43L55 72" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
    },
    asc:{
      bounds:[12,35,76,30],
      markup:'<path d="M33.28 59.03H21.46L19.6 64.37H12L22.86 35.06H31.87L42.73 64.37H35.13ZM23.35 53.59H31.38L27.37 41.93Z M63.48 43.07V48.41Q61.22 47.47 59.12 47Q57.02 46.52 55.15 46.52Q53.15 46.52 52.18 47.03Q51.21 47.53 51.21 48.57Q51.21 49.41 51.94 49.86Q52.68 50.31 54.58 50.53L55.82 50.71Q61.22 51.39 63.09 52.96Q64.95 54.54 64.95 57.89Q64.95 61.41 62.36 63.17Q59.77 64.94 54.62 64.94Q52.44 64.94 50.12 64.6Q47.79 64.25 45.34 63.57V58.23Q47.44 59.25 49.65 59.76Q51.86 60.27 54.13 60.27Q56.19 60.27 57.23 59.7Q58.28 59.13 58.28 58.01Q58.28 57.07 57.56 56.61Q56.84 56.15 54.7 55.89L53.47 55.73Q48.77 55.14 46.89 53.55Q45 51.96 45 48.72Q45 45.23 47.4 43.54Q49.79 41.85 54.74 41.85Q56.69 41.85 58.83 42.15Q60.97 42.44 63.48 43.07Z M88 43.07V48.8Q86.57 47.82 85.12 47.35Q83.68 46.88 82.13 46.88Q79.18 46.88 77.55 48.6Q75.91 50.31 75.91 53.4Q75.91 56.48 77.55 58.2Q79.18 59.91 82.13 59.91Q83.78 59.91 85.26 59.42Q86.74 58.93 88 57.97V63.72Q86.35 64.33 84.65 64.64Q82.95 64.94 81.25 64.94Q75.3 64.94 71.94 61.89Q68.58 58.83 68.58 53.4Q68.58 47.96 71.94 44.91Q75.3 41.85 81.25 41.85Q82.97 41.85 84.65 42.16Q86.33 42.46 88 43.07Z" fill="currentColor"/>'
    },
    dsc:{
      bounds:[12,35,76,31],
      markup:'<path d="M19.68 40.62V58.8H22.44Q27.15 58.8 29.63 56.47Q32.12 54.13 32.12 49.68Q32.12 45.25 29.64 42.93Q27.17 40.62 22.44 40.62ZM12 34.81H20.1Q26.89 34.81 30.21 35.78Q33.53 36.75 35.91 39.06Q38.01 41.08 39.02 43.71Q40.04 46.35 40.04 49.68Q40.04 53.05 39.02 55.7Q38.01 58.34 35.91 60.36Q33.51 62.67 30.16 63.64Q26.81 64.61 20.1 64.61H12Z M63.07 42.95V48.38Q60.78 47.43 58.64 46.95Q56.51 46.47 54.61 46.47Q52.57 46.47 51.59 46.98Q50.6 47.49 50.6 48.54Q50.6 49.4 51.35 49.86Q52.1 50.32 54.03 50.54L55.29 50.72Q60.78 51.42 62.67 53.01Q64.57 54.61 64.57 58.02Q64.57 61.6 61.93 63.39Q59.3 65.19 54.07 65.19Q51.86 65.19 49.49 64.84Q47.13 64.49 44.63 63.79V58.36Q46.77 59.4 49.01 59.92Q51.26 60.44 53.57 60.44Q55.67 60.44 56.73 59.86Q57.78 59.28 57.78 58.14Q57.78 57.18 57.06 56.72Q56.33 56.25 54.15 55.99L52.89 55.83Q48.12 55.23 46.21 53.61Q44.29 52 44.29 48.7Q44.29 45.15 46.73 43.43Q49.16 41.72 54.19 41.72Q56.17 41.72 58.34 42.02Q60.52 42.32 63.07 42.95Z M88 42.95V48.78Q86.54 47.78 85.08 47.31Q83.61 46.83 82.03 46.83Q79.04 46.83 77.37 48.57Q75.71 50.32 75.71 53.45Q75.71 56.59 77.37 58.33Q79.04 60.08 82.03 60.08Q83.71 60.08 85.22 59.58Q86.72 59.08 88 58.1V63.95Q86.32 64.57 84.6 64.88Q82.87 65.19 81.13 65.19Q75.09 65.19 71.67 62.08Q68.26 58.98 68.26 53.45Q68.26 47.92 71.67 44.82Q75.09 41.72 81.13 41.72Q82.89 41.72 84.6 42.03Q86.3 42.34 88 42.95Z" fill="currentColor"/>'
    },
    mc:{
      bounds:[12,31,76,38],
      markup:'<path d="M12 32.37H23.56L31.58 51.21L39.64 32.37H51.18V67.58H42.59V41.83L34.48 60.82H28.72L20.61 41.83V67.58H12Z M88 65.65Q85.5 66.95 82.79 67.61Q80.07 68.27 77.13 68.27Q68.33 68.27 63.19 63.35Q58.04 58.43 58.04 50.01Q58.04 41.57 63.19 36.65Q68.33 31.73 77.13 31.73Q80.07 31.73 82.79 32.39Q85.5 33.05 88 34.35V41.64Q85.48 39.92 83.02 39.11Q80.57 38.31 77.86 38.31Q73 38.31 70.21 41.43Q67.43 44.54 67.43 50.01Q67.43 55.46 70.21 58.57Q73 61.69 77.86 61.69Q80.57 61.69 83.02 60.89Q85.48 60.08 88 58.36Z" fill="currentColor"/>'
    },
    ic:{
      bounds:[26,31,48,38],
      markup:'<path d="M26.13 31.66H35.58V68.29H26.13Z M73.87 66.28Q71.27 67.63 68.45 68.31Q65.63 69 62.56 69Q53.41 69 48.06 63.89Q42.71 58.77 42.71 50.01Q42.71 41.23 48.06 36.11Q53.41 31 62.56 31Q65.63 31 68.45 31.69Q71.27 32.37 73.87 33.72V41.3Q71.24 39.51 68.69 38.68Q66.14 37.84 63.32 37.84Q58.27 37.84 55.37 41.08Q52.48 44.32 52.48 50.01Q52.48 55.68 55.37 58.92Q58.27 62.16 63.32 62.16Q66.14 62.16 68.69 61.32Q71.24 60.49 73.87 58.7Z" fill="currentColor"/>'
    }
  });

  function buildVectorArt(identity, options) {
    const spec = VECTOR_GLYPHS[identity];
    if (!spec) return null;
    const registry = window.RelphiGlyphRegistry;
    const entry = registry && (registry.get(identity) || registry.resolve(identity));
    const radius = Number(options?.radius || 18);
    const padding = Math.max(1, Number(options?.padding ?? 1));
    const bubbleStrokeWidth = Math.max(0, Number(options?.bubbleStrokeWidth || 0));
    const usableRadius = Math.max(1, radius - bubbleStrokeWidth / 2 - padding);
    const [x,y,width,height] = spec.bounds;
    const sourceStroke = /stroke-width=/.test(spec.markup) ? 6 : 0;
    const visibleWidth = width + sourceStroke;
    const visibleHeight = height + sourceStroke;
    const maximumScale = usableRadius / (Math.hypot(visibleWidth / 2, visibleHeight / 2) || 1);
    const scale = maximumScale * Math.max(0.1, Number(entry?.scale) || 1);
    const cx = x + width / 2;
    const cy = y + height / 2;
    const art = svg('g');
    art.innerHTML = spec.markup;
    art.setAttribute('color', options?.color || '#dc1f18');
    art.setAttribute('transform', `translate(${entry?.dx || 0} ${entry?.dy || 0}) scale(${scale}) translate(${-cx} ${-cy})`);
    art.classList.add('relphi-canonical-glyph', 'relphi-glyph-' + identity);
    return art;
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
      position: 'fixed',
      left: '-10000px',
      top: '0',
      width: '256px',
      height: '256px',
      overflow: 'visible',
      opacity: '0',
      pointerEvents: 'none',
      zIndex: '-1'
    });
    (document.body || document.documentElement).appendChild(stage);
    return stage;
  }

  async function buildFinalArt(identity, options) {
    const vectorArt = buildVectorArt(String(identity), options);
    if (vectorArt) {
      vectorArt.dataset.relphiAtomicCommit = 'true';
      vectorArt.dataset.relphiAtomicIdentity = String(identity);
      vectorArt.dataset.relphiAtomicBuild = 'detached-final';
      return vectorArt;
    }
    const staging = svg('g');
    staging.dataset.atomicGlyphStage = String(++sequence);
    ensureStage().appendChild(staging);
    try {
      const art = await base.draw(staging, identity, options);
      art.dataset.relphiAtomicCommit = 'true';
      art.dataset.relphiAtomicIdentity = String(identity);
      art.dataset.relphiAtomicBuild = 'detached-final';
      art.remove();
      return art;
    } finally {
      staging.remove();
    }
  }

  async function draw(parent, identity, options) {
    if (!parent) throw new Error('A glyph parent is required.');
    const art = await buildFinalArt(identity, options);
    parent.appendChild(art);
    window.dispatchEvent(new CustomEvent('relphi:glyph-atomic-committed', {
      detail:{ identity:String(identity), art, mode:'detached-final' }
    }));
    return art;
  }

  function createBubble(parent, identity, options) {
    if (!parent) throw new Error('A glyph parent is required.');
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

    const ready = buildFinalArt(entry.id, {
      radius,
      padding: options?.padding ?? 1,
      color,
      bubbleStrokeWidth: strokeWidth
    }).then(art => {
      root.appendChild(art);
      delete root.dataset.relphiAtomicPending;
      root.dataset.relphiAtomicReady = 'true';
      root.dataset.relphiAtomicBuild = 'detached-final';
      parent.appendChild(root);
      window.dispatchEvent(new CustomEvent('relphi:glyph-atomic-committed', {
        detail:{ identity:entry.id, art, root, mode:'detached-final' }
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
    createBubble,
    atomicCommit: true,
    atomicBuildMode: 'detached-final',
    atomicStageId: 'relphiGlyphAtomicStage'
  });
})();
