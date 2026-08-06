// Relationship-list owner: direct canonical circled/uncircled glyph output, aspect stripe, and orb badge.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyRelationshipListLayoutV10) return;
  window.__relphiSkyRelationshipListLayoutV10 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const STYLE_ID = 'skyRelationshipListLayoutV10';
  const SKY = { A:'#c9211e', B:'#2462d0' };
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
      .sky-foundation-relationship-row{--relationship-stripe:var(--aspect-color,#777);position:relative;grid-template-columns:38px minmax(0,1fr) 38px 38px minmax(0,1fr) auto;grid-template-areas:"left-glyph left-copy aspect right-glyph right-copy orb";column-gap:6px;row-gap:4px;padding:8px 9px 8px 12px;overflow:hidden}
      .sky-foundation-relationship-row::before{content:"";position:absolute;inset:0 auto 0 0;width:5px;background:var(--relationship-stripe)}
      .sky-relationship-canonical-stage{display:block;width:38px!important;height:38px!important;min-width:38px!important;min-height:38px!important;max-width:38px!important;max-height:38px!important;overflow:visible;align-self:center;color:inherit}
      .sky-relationship-canonical-stage[data-role="left"]{grid-area:left-glyph}.sky-relationship-canonical-stage[data-role="aspect"]{grid-area:aspect;justify-self:center}.sky-relationship-canonical-stage[data-role="right"]{grid-area:right-glyph}
      .sky-foundation-relationship-row>.sky-foundation-relationship-copy:nth-of-type(1){grid-area:left-copy}.sky-foundation-relationship-row>.sky-foundation-relationship-copy:nth-of-type(2){grid-area:right-copy}
      .sky-foundation-relationship-orb{grid-area:orb;align-self:center;justify-self:end;min-width:48px;padding:5px 7px;border:1px solid color-mix(in srgb,var(--relationship-stripe) 42%,transparent);border-radius:999px;background:color-mix(in srgb,var(--relationship-stripe) 9%,#fffdfa);color:#403a35;text-align:center;white-space:nowrap;font:800 .6rem/1 system-ui,sans-serif;font-variant-numeric:tabular-nums}
      .sky-foundation-relationship-copy{white-space:normal;line-height:1.15}.sky-foundation-relationship-copy small{white-space:normal}
      #skyFoundationRelationshipList{scrollbar-width:thin;scrollbar-color:#8d8d8d transparent;scrollbar-gutter:stable}
      #skyFoundationRelationshipList::-webkit-scrollbar{width:8px;height:8px}
      #skyFoundationRelationshipList::-webkit-scrollbar-track{background:transparent}
      #skyFoundationRelationshipList::-webkit-scrollbar-thumb{border:2px solid transparent;border-radius:999px;background:#8d8d8d;background-clip:padding-box}
      #skyFoundationRelationshipList::-webkit-scrollbar-button{display:none;width:0;height:0}
      @media(max-width:620px){.sky-foundation-relationship-row{grid-template-columns:38px minmax(0,1fr) 38px minmax(0,1fr) 38px;grid-template-areas:"left-glyph left-copy aspect right-copy right-glyph" ". orb orb orb .";padding:9px 10px 8px 13px}.sky-foundation-relationship-orb{justify-self:center;min-width:74px;margin-top:2px}.sky-foundation-relationship-row>.sky-foundation-relationship-copy:nth-of-type(2){text-align:right}.sky-relationship-canonical-stage[data-role="right"]{justify-self:end}}
    `;
    document.head.appendChild(style);
  }

  function stage(role, label) {
    const node = document.createElementNS(NS, 'svg');
    node.classList.add('sky-relationship-canonical-stage');
    node.dataset.role = role;
    node.setAttribute('aria-label', label);
    return node;
  }

  async function renderCircled(node, id, color) {
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry && (registry.get(id) || registry.resolve(id));
    if (!entry || !component?.createBubble) throw new Error('Canonical circled glyph unavailable: ' + id);
    const bubble = component.createBubble(node, entry.id, { radius:19, padding:1, color });
    bubble.root.dataset.masterGlyphSource = 'https://oracleofrelphi.com/glyphs-unified-preview.html';
    await bubble.ready;
  }

  async function renderUncircled(node, id, color) {
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry && (registry.get(id) || registry.resolve(id));
    if (!entry || !component?.draw) throw new Error('Canonical uncircled glyph unavailable: ' + id);
    await component.draw(node, entry.id, { radius:19, padding:1, color });
    node.dataset.masterGlyphSource = 'https://oracleofrelphi.com/glyphs-unified-preview.html';
  }

  function replaceWithCanonicalGlyphs(row, color) {
    if (row.dataset.relationshipMasterGlyphs === 'v10') return;
    const current = Array.from(row.querySelectorAll(':scope > svg, :scope > .sky-relationship-master-slot'));
    if (current.length < 3) return;
    const leftId = row.dataset.leftPlacement;
    const aspectId = row.dataset.aspect;
    const rightId = row.dataset.rightPlacement;
    if (!leftId || !aspectId || !rightId) return;

    const left = stage('left', leftId);
    const aspect = stage('aspect', aspectId);
    const right = stage('right', rightId);
    current[0].replaceWith(left);
    current[1].replaceWith(aspect);
    current[2].replaceWith(right);

    Promise.allSettled([
      renderCircled(left, leftId, SKY.A),
      renderUncircled(aspect, aspectId, color),
      renderCircled(right, rightId, SKY.B)
    ]).then(results => results.forEach((result, index) => {
      if (result.status === 'rejected') {
        [left, aspect, right][index].replaceChildren();
        console.error(result.reason);
      }
    }));
    row.dataset.relationshipMasterGlyphs = 'v10';
  }

  function compose(row) {
    if (!(row instanceof HTMLElement)) return;
    const aspect = String(row.dataset.aspect || '').toLowerCase();
    const color = ASPECT_COLORS[aspect] || '#777';
    row.style.setProperty('--relationship-stripe', color);
    replaceWithCanonicalGlyphs(row, color);

    if (row.dataset.relationshipLayout === 'v10') return;
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
    row.dataset.relationshipLayout = 'v10';
  }

  function refresh(root) {
    (root || document).querySelectorAll?.('.sky-foundation-relationship-row').forEach(compose);
  }

  function start() {
    installStyle();
    refresh(document);
    new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
      if (node.nodeType !== 1) return;
      if (node.matches?.('.sky-foundation-relationship-row')) compose(node);
      refresh(node);
    }))).observe(document.documentElement, { childList:true, subtree:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
