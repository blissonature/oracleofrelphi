// Relationship-list presentation only: stripe, semantic slot layout, orb, scrollbar,
// and canonical relationship glyph mounts. Every glyph uses the exact 64×64 Master Glyph List artboard.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyRelationshipListLayoutV21) return;
  window.__relphiSkyRelationshipListLayoutV21 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const STYLE_ID = 'skyRelationshipListLayoutV21';
  const OWNER = 'relationship-layout-v21';
  const MASTER_VIEWBOX = '-32 -32 64 64';
  const MASTER_RADIUS = 19;
  const GLYPH_DISPLAY_SIZE = 26;
  const SIGN_IDS = Object.freeze(['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']);
  const SIGN_NAMES = Object.freeze(['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']);
  const SKY_COLORS = Object.freeze({ A:'#c9211e', B:'#2462d0' });
  const ASPECT_COLORS = Object.freeze({
    conjunction:'#e53935','semi-sextile':'#7c9b49',octile:'#b86d43',sextile:'#d3b727',
    quintile:'#8b6cc2',square:'#d6534d',trine:'#4e9e69','tri-octile':'#9f5944',
    'bi-quintile':'#7655aa',quincunx:'#4b8e88',opposition:'#5961c8'
  });

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    ['skyRelationshipListLayoutV20','skyRelationshipListLayoutV19','skyRelationshipListLayoutV18','skyRelationshipListLayoutV17','skyRelationshipListLayoutV16']
      .forEach(id => document.getElementById(id)?.remove());
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .sky-foundation-relationship-row{
        --relationship-stripe:var(--aspect-color,#777);
        position:relative;
        grid-template-columns:${GLYPH_DISPLAY_SIZE}px minmax(0,1fr) 52px ${GLYPH_DISPLAY_SIZE}px minmax(0,1fr);
        grid-template-areas:
          "left-glyph left-copy aspect right-glyph right-copy"
          ". . orb . .";
        column-gap:7px;
        row-gap:0;
        min-height:82px;
        padding:10px 10px 9px 13px;
        overflow:visible;
      }
      .sky-foundation-relationship-row::before{
        content:"";
        position:absolute;
        inset:0 auto 0 0;
        width:5px;
        background:var(--relationship-stripe);
      }
      .sky-foundation-relationship-glyph,
      .sky-foundation-relationship-sign{
        display:grid;
        place-items:center;
        width:${GLYPH_DISPLAY_SIZE}px;
        height:${GLYPH_DISPLAY_SIZE}px;
        min-width:${GLYPH_DISPLAY_SIZE}px;
        min-height:${GLYPH_DISPLAY_SIZE}px;
        overflow:visible;
      }
      .sky-foundation-relationship-glyph{
        align-self:center;
      }
      .sky-foundation-relationship-glyph>svg[data-relationship-canonical-host="${OWNER}"],
      .sky-foundation-relationship-sign>svg[data-relationship-canonical-host="${OWNER}"]{
        display:block;
        width:${GLYPH_DISPLAY_SIZE}px!important;
        height:${GLYPH_DISPLAY_SIZE}px!important;
        min-width:${GLYPH_DISPLAY_SIZE}px;
        min-height:${GLYPH_DISPLAY_SIZE}px;
        max-width:${GLYPH_DISPLAY_SIZE}px;
        max-height:${GLYPH_DISPLAY_SIZE}px;
        overflow:visible;
        transform:none!important;
      }
      .sky-foundation-relationship-glyph--left{grid-area:left-glyph}
      .sky-foundation-relationship-glyph--right{grid-area:right-glyph}
      .sky-foundation-relationship-glyph--aspect{
        grid-area:aspect;
        justify-self:center;
        align-self:end;
      }
      .sky-foundation-relationship-row>.sky-foundation-relationship-copy:nth-child(2){grid-area:left-copy}
      .sky-foundation-relationship-row>.sky-foundation-relationship-copy:nth-child(5){grid-area:right-copy}
      .sky-foundation-relationship-copy{
        display:flex;
        flex-direction:column;
        justify-content:center;
        gap:2px;
        min-width:0;
        white-space:normal;
        line-height:1.08;
        font-weight:800;
      }
      .sky-foundation-relationship-copy small{
        display:flex;
        align-items:center;
        flex-wrap:wrap;
        gap:2px;
        min-height:${GLYPH_DISPLAY_SIZE}px;
        white-space:normal;
        color:#625b55;
        font-weight:700;
        line-height:1.05;
      }
      .sky-foundation-relationship-sign{
        display:inline-grid;
        margin:0 1px;
        vertical-align:middle;
      }
      .sky-foundation-relationship-orb{
        grid-area:orb;
        align-self:start;
        justify-self:center;
        margin-top:-2px;
        min-width:42px;
        color:var(--relationship-stripe);
        text-align:center;
        white-space:nowrap;
        font:900 .63rem/1 system-ui,sans-serif;
        font-variant-numeric:tabular-nums;
        letter-spacing:.01em;
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
          grid-template-columns:${GLYPH_DISPLAY_SIZE}px minmax(0,1fr) 52px minmax(0,1fr) ${GLYPH_DISPLAY_SIZE}px;
          grid-template-areas:
            "left-glyph left-copy aspect right-copy right-glyph"
            ". . orb . .";
          column-gap:5px;
          min-height:86px;
          padding:10px 9px 9px 13px;
        }
        .sky-foundation-relationship-row>.sky-foundation-relationship-copy:nth-child(5){text-align:right;align-items:flex-end}
        .sky-foundation-relationship-glyph--right{justify-self:end}
      }
    `;
    document.head.appendChild(style);
  }

  function outerHostIsIntact(slot, entry) {
    const host = slot?.firstElementChild;
    return slot?.childElementCount === 1 &&
      slot?.dataset.relationshipGlyphOwner === OWNER &&
      host?.matches?.(`svg[data-relationship-canonical-host="${OWNER}"]`) &&
      host.dataset.canonicalGlyphId === entry?.id &&
      host.getAttribute('viewBox') === MASTER_VIEWBOX;
  }

  function canonicalHostIsIntact(slot, entry, mode) {
    if (!outerHostIsIntact(slot, entry)) return false;
    const host = slot.firstElementChild;
    if (host.childElementCount !== 1) return false;
    const bubble = host.firstElementChild;
    if (!bubble?.matches?.('g.relphi-glyph-bubble') || bubble.dataset.glyphId !== entry.id) return false;
    const circles = Array.from(bubble.children).filter(node => node.tagName?.toLowerCase() === 'circle');
    const arts = Array.from(bubble.children).filter(node => node.classList?.contains('relphi-canonical-glyph'));
    if (circles.length !== 1 || arts.length !== 1 || !arts[0].classList.contains('relphi-glyph-' + entry.id)) return false;
    if (mode === 'plain' && circles[0].style.opacity !== '0') return false;
    return true;
  }

  function paintGlyph(slot, identity, mode, color, label) {
    if (!slot) return;
    const registry = window.RelphiGlyphRegistry;
    const component = window.RelphiGlyphComponent;
    const entry = registry && (registry.get(identity) || registry.resolve(identity));
    if (!entry || !component?.createBubble) {
      slot.dataset.glyphUnavailable = 'true';
      return;
    }

    if (slot.dataset.canonicalGlyphReady === 'loading' && outerHostIsIntact(slot, entry)) return;
    if (slot.dataset.canonicalGlyphReady === 'true' && canonicalHostIsIntact(slot, entry, mode)) return;

    const host = document.createElementNS(NS, 'svg');
    host.setAttribute('viewBox', MASTER_VIEWBOX);
    host.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    host.setAttribute('aria-hidden', 'true');
    host.setAttribute('focusable', 'false');
    host.dataset.relationshipCanonicalHost = OWNER;
    host.dataset.canonicalGlyphId = entry.id;
    host.dataset.masterGlyphViewBox = MASTER_VIEWBOX;

    slot.replaceChildren(host);
    slot.dataset.relationshipGlyphOwner = OWNER;
    slot.dataset.relationshipGlyphIdentity = entry.id;
    slot.dataset.relationshipGlyphMode = mode;
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
      if (canonicalHostIsIntact(slot, entry, mode)) {
        slot.dataset.canonicalGlyphReady = 'true';
        return;
      }
      slot.dataset.canonicalGlyphReady = 'corrupt';
      queueMicrotask(() => paintGlyph(slot, identity, mode, color, label));
    }).catch(error => {
      slot.dataset.canonicalGlyphReady = 'error';
      slot.dataset.glyphUnavailable = 'true';
      if (host.isConnected) host.remove();
      console.error('[Sky Chart relationship glyph]', error);
    });
  }

  function ensureSignGlyph(row, side, color) {
    const left = side === 'left';
    const copy = row.querySelector(left
      ? ':scope > .sky-foundation-relationship-copy:nth-child(2)'
      : ':scope > .sky-foundation-relationship-copy:nth-child(5)');
    const small = copy?.querySelector('small');
    const signIndex = Number(row.dataset[left ? 'leftSign' : 'rightSign']);
    const house = row.dataset[left ? 'leftHouse' : 'rightHouse'];
    const signId = SIGN_IDS[signIndex];
    const signName = SIGN_NAMES[signIndex];
    if (!small || !signId || !signName || !house) return;

    let signSlot = small.querySelector(':scope > .sky-foundation-relationship-sign');
    if (!signSlot) {
      const source = small.textContent.trim();
      const match = source.match(/^(.+?)\s+(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\s+·/i);
      const coordinate = (match?.[1] || source.split('·')[0] || '').trim();
      signSlot = document.createElement('span');
      signSlot.className = 'sky-foundation-relationship-sign';
      signSlot.dataset.signGlyph = signId;
      signSlot.setAttribute('aria-label', signName);
      small.replaceChildren(
        document.createTextNode(coordinate + ' '),
        signSlot,
        document.createTextNode(` · H${house}`)
      );
    }
    paintGlyph(signSlot, signId, 'plain', color, signName);
  }

  function paintRowGlyphs(row) {
    const aspect = String(row.dataset.aspect || '').toLowerCase();
    paintGlyph(row.querySelector('.sky-foundation-relationship-glyph--left'), row.dataset.leftPlacement, 'plain', SKY_COLORS.A, row.dataset.leftPlacement);
    paintGlyph(row.querySelector('.sky-foundation-relationship-glyph--aspect'), aspect, 'plain', ASPECT_COLORS[aspect] || '#777', aspect);
    paintGlyph(row.querySelector('.sky-foundation-relationship-glyph--right'), row.dataset.rightPlacement, 'plain', SKY_COLORS.B, row.dataset.rightPlacement);
    ensureSignGlyph(row, 'left', SKY_COLORS.A);
    ensureSignGlyph(row, 'right', SKY_COLORS.B);
  }

  function compose(row) {
    if (!(row instanceof HTMLElement)) return;
    const aspect = String(row.dataset.aspect || '').toLowerCase();
    const color = ASPECT_COLORS[aspect] || '#777';
    row.style.setProperty('--relationship-stripe', color);
    paintRowGlyphs(row);

    if (row.dataset.relationshipLayout === 'v21') return;
    const copies = row.querySelectorAll('.sky-foundation-relationship-copy');
    const rightSmall = copies[1]?.querySelector('small');
    const orb = Number(row.dataset.sourceOrb);
    if (!rightSmall || !Number.isFinite(orb)) return;

    rightSmall.textContent = rightSmall.textContent.replace(/\s*·\s*Orb\s+[\d.]+°?\s*$/i, '').trim();
    ensureSignGlyph(row, 'right', SKY_COLORS.B);
    row.querySelector(':scope > .sky-foundation-relationship-orb')?.remove();
    const badge = document.createElement('span');
    badge.className = 'sky-foundation-relationship-orb';
    badge.textContent = `${orb.toFixed(2)}°`;
    badge.setAttribute('aria-label', `Orb ${orb.toFixed(2)} degrees`);
    row.appendChild(badge);
    row.dataset.relationshipLayout = 'v21';
  }

  function refresh(root) {
    (root || document).querySelectorAll?.('.sky-foundation-relationship-row').forEach(compose);
  }

  function start() {
    installStyle();
    refresh(document);
    new MutationObserver(function (records) {
      const rows = new Set();
      records.forEach(function (record) {
        const targetRow = record.target instanceof Element ? record.target.closest('.sky-foundation-relationship-row') : null;
        if (targetRow) rows.add(targetRow);
        record.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.matches?.('.sky-foundation-relationship-row')) rows.add(node);
          const parentRow = node.closest?.('.sky-foundation-relationship-row');
          if (parentRow) rows.add(parentRow);
          node.querySelectorAll?.('.sky-foundation-relationship-row').forEach(row => rows.add(row));
        });
      });
      rows.forEach(compose);
    }).observe(document.documentElement, { childList:true, subtree:true });
    window.addEventListener('relphi:sky-foundation-interactions-ready', () => refresh(document));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();