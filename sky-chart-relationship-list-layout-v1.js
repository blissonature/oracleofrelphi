// Relationship-list presentation only: stripe, semantic slot layout, orb badge, scrollbar,
// and canonical relationship glyph mounts. Every glyph uses the exact 64×64 Master Glyph List artboard.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyRelationshipListLayoutV16) return;
  window.__relphiSkyRelationshipListLayoutV16 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const STYLE_ID = 'skyRelationshipListLayoutV16';
  const MASTER_VIEWBOX = '-32 -32 64 64';
  const MASTER_RADIUS = 19;
  const SKY_COLORS = Object.freeze({ A:'#c9211e', B:'#2462d0' });
  const ASPECT_COLORS = Object.freeze({
    conjunction:'#e53935','semi-sextile':'#7c9b49',octile:'#b86d43',sextile:'#d3b727',
    quintile:'#8b6cc2',square:'#d6534d',trine:'#4e9e69','tri-octile':'#9f5944',
    'bi-quintile':'#7655aa',quincunx:'#4b8e88',opposition:'#5961c8'
  });

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .sky-foundation-relationship-row{
        --relationship-stripe:var(--aspect-color,#777);
        position:relative;
        grid-template-columns:28px minmax(0,1fr) 28px 28px minmax(0,1fr) auto;
        grid-template-areas:"left-glyph left-copy aspect right-glyph right-copy orb";
        column-gap:6px;
        row-gap:4px;
        padding:8px 9px 8px 12px;
        overflow:visible;
      }
      .sky-foundation-relationship-row::before{
        content:"";
        position:absolute;
        inset:0 auto 0 0;
        width:5px;
        background:var(--relationship-stripe);
      }
      .sky-foundation-relationship-glyph{
        display:block;
        width:28px;
        height:28px;
        min-width:28px;
        min-height:28px;
        align-self:center;
        overflow:visible;
      }
      .sky-foundation-relationship-glyph>svg{
        display:block;
        width:28px;
        height:28px;
        overflow:visible;
      }
      .sky-foundation-relationship-glyph--left{grid-area:left-glyph}
      .sky-foundation-relationship-glyph--aspect{grid-area:aspect;justify-self:center}
      .sky-foundation-relationship-glyph--right{grid-area:right-glyph}
      .sky-foundation-relationship-row>.sky-foundation-relationship-copy:nth-of-type(1){grid-area:left-copy}
      .sky-foundation-relationship-row>.sky-foundation-relationship-copy:nth-of-type(2){grid-area:right-copy}
      .sky-foundation-relationship-copy{white-space:normal;line-height:1.15;min-width:0}
      .sky-foundation-relationship-copy small{white-space:normal}
      .sky-foundation-relationship-orb{
        grid-area:orb;
        align-self:center;
        justify-self:end;
        min-width:48px;
        padding:5px 7px;
        border:1px solid color-mix(in srgb,var(--relationship-stripe) 42%,transparent);
        border-radius:999px;
        background:color-mix(in srgb,var(--relationship-stripe) 9%,#fffdfa);
        color:#403a35;
        text-align:center;
        white-space:nowrap;
        font:800 .6rem/1 system-ui,sans-serif;
        font-variant-numeric:tabular-nums;
      }
      #skyFoundationRelationshipList{
        scrollbar-width:thin;
        scrollbar-color:#8d8d8d transparent;
        scrollbar-gutter:stable;
      }
      #skyFoundationRelationshipList::-webkit-scrollbar{width:8px;height:8px}
      #skyFoundationRelationshipList::-webkit-scrollbar-track{background:transparent}
      #skyFoundationRelationshipList::-webkit-scrollbar-thumb{
        border:2px solid transparent;
        border-radius:999px;
        background:#8d8d8d;
        background-clip:padding-box;
      }
      #skyFoundationRelationshipList::-webkit-scrollbar-button{display:none;width:0;height:0}
      @media(max-width:620px){
        .sky-foundation-relationship-row{
          grid-template-columns:28px minmax(0,1fr) 28px minmax(0,1fr) 28px;
          grid-template-areas:"left-glyph left-copy aspect right-copy right-glyph" ". orb orb orb .";
          padding:9px 10px 8px 13px;
        }
        .sky-foundation-relationship-orb{justify-self:center;min-width:74px;margin-top:2px}
        .sky-foundation-relationship-row>.sky-foundation-relationship-copy:nth-of-type(2){text-align:right}
        .sky-foundation-relationship-glyph--right{justify-self:end}
      }
    `;
    document.head.appendChild(style);
  }

  function paintGlyph(slot, identity, mode, color, label) {
    if (!slot || slot.dataset.canonicalGlyphReady === 'true' || slot.dataset.canonicalGlyphReady === 'loading') return;
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry && (registry.get(identity) || registry.resolve(identity));
    if (!entry || !component?.createBubble) {
      slot.dataset.glyphUnavailable = 'true';
      return;
    }

    const host = document.createElementNS(NS, 'svg');
    host.setAttribute('viewBox', MASTER_VIEWBOX);
    host.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    host.setAttribute('aria-hidden', 'true');
    host.setAttribute('focusable', 'false');
    host.dataset.canonicalGlyphId = entry.id;
    host.dataset.masterGlyphViewBox = MASTER_VIEWBOX;
    slot.replaceChildren(host);
    slot.dataset.canonicalGlyphReady = 'loading';
    slot.setAttribute('title', label || entry.name || entry.id);
    delete slot.dataset.glyphUnavailable;

    let bubble;
    try {
      bubble = component.createBubble(host, entry.id, {
        radius:MASTER_RADIUS,
        padding:1,
        color
      });
      if (mode === 'plain') {
        bubble.circle.style.opacity = '0';
        bubble.circle.setAttribute('aria-hidden', 'true');
      }
    } catch (error) {
      slot.dataset.canonicalGlyphReady = 'error';
      slot.dataset.glyphUnavailable = 'true';
      host.remove();
      console.error('[Sky Chart relationship glyph]', error);
      return;
    }

    Promise.resolve(bubble.ready).then(() => {
      slot.dataset.canonicalGlyphReady = 'true';
    }).catch(error => {
      slot.dataset.canonicalGlyphReady = 'error';
      slot.dataset.glyphUnavailable = 'true';
      host.remove();
      console.error('[Sky Chart relationship glyph]', error);
    });
  }

  function paintRowGlyphs(row) {
    const aspect = String(row.dataset.aspect || '').toLowerCase();
    paintGlyph(row.querySelector('.sky-foundation-relationship-glyph--left'), row.dataset.leftPlacement, 'plain', SKY_COLORS.A, row.dataset.leftPlacement);
    paintGlyph(row.querySelector('.sky-foundation-relationship-glyph--aspect'), aspect, 'plain', ASPECT_COLORS[aspect] || '#777', aspect);
    paintGlyph(row.querySelector('.sky-foundation-relationship-glyph--right'), row.dataset.rightPlacement, 'plain', SKY_COLORS.B, row.dataset.rightPlacement);
  }

  function compose(row) {
    if (!(row instanceof HTMLElement)) return;
    const aspect = String(row.dataset.aspect || '').toLowerCase();
    const color = ASPECT_COLORS[aspect] || '#777';
    row.style.setProperty('--relationship-stripe', color);
    paintRowGlyphs(row);

    if (row.dataset.relationshipLayout === 'v16') return;
    const copies = row.querySelectorAll('.sky-foundation-relationship-copy');
    const rightSmall = copies[1]?.querySelector('small');
    const orb = Number(row.dataset.sourceOrb);
    if (!rightSmall || !Number.isFinite(orb)) return;

    rightSmall.textContent = rightSmall.textContent.replace(/\s*·\s*Orb\s+[\d.]+°?\s*$/i, '').trim();
    row.querySelector(':scope > .sky-foundation-relationship-orb')?.remove();
    const badge = document.createElement('span');
    badge.className = 'sky-foundation-relationship-orb';
    badge.textContent = `Orb ${orb.toFixed(2)}°`;
    badge.setAttribute('aria-label', `Orb ${orb.toFixed(2)} degrees`);
    row.appendChild(badge);
    row.dataset.relationshipLayout = 'v16';
  }

  function refresh(root) {
    (root || document).querySelectorAll?.('.sky-foundation-relationship-row').forEach(compose);
  }

  function start() {
    installStyle();
    refresh(document);
    new MutationObserver(function (records) {
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.matches?.('.sky-foundation-relationship-row')) compose(node);
          refresh(node);
        });
      });
    }).observe(document.documentElement, { childList:true, subtree:true });
    window.addEventListener('relphi:sky-foundation-interactions-ready', () => refresh(document));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();