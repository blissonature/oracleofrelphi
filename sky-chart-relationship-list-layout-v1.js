// Relationship-list presentation only: compact glyph-first equations with lazy canonical painting.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyRelationshipListLayoutV26) return;
  window.__relphiSkyRelationshipListLayoutV26 = true;

  const NS = 'http://www.w3.org/2000/svg';
  const STYLE_ID = 'skyRelationshipListLayoutV26';
  const OWNER = 'relationship-layout-v26';
  const MASTER_VIEWBOX = '-32 -32 64 64';
  const MASTER_RADIUS = 19;
  const GLYPH_DISPLAY_SIZE = 38;
  const SIGN_IDS = Object.freeze(['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']);
  const SIGN_NAMES = Object.freeze(['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']);
  const SKY_COLORS = Object.freeze({ A:'#c9211e', B:'#2462d0' });
  const ASPECT_COLORS = Object.freeze({
    conjunction:'#e53935','semi-sextile':'#7c9b49',octile:'#b86d43',sextile:'#d3b727',
    quintile:'#8b6cc2',square:'#d6534d',trine:'#4e9e69','tri-octile':'#9f5944',
    'bi-quintile':'#7655aa',quincunx:'#4b8e88',opposition:'#5961c8'
  });

  let visibleRows = null;
  let listMutations = null;
  let observedList = null;
  let registerQueued = false;

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    ['skyRelationshipListLayoutV25','skyRelationshipListLayoutV24','skyRelationshipListLayoutV23','skyRelationshipListLayoutV22','skyRelationshipListLayoutV21','skyRelationshipListLayoutV20','skyRelationshipListLayoutV19','skyRelationshipListLayoutV18','skyRelationshipListLayoutV17','skyRelationshipListLayoutV16']
      .forEach(id => document.getElementById(id)?.remove());
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .sky-foundation-relationship-row{
        --relationship-stripe:var(--aspect-color,#777);
        position:relative;
        display:grid;
        grid-template-columns:${GLYPH_DISPLAY_SIZE}px minmax(96px,1fr) 46px ${GLYPH_DISPLAY_SIZE}px minmax(96px,1fr);
        grid-template-areas:
          "left-glyph left-copy aspect right-glyph right-copy"
          ". . orb . .";
        grid-template-rows:${GLYPH_DISPLAY_SIZE}px 11px;
        align-items:center;
        column-gap:5px;
        row-gap:0;
        min-height:58px;
        padding:4px 8px 3px 12px;
        overflow:hidden;
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
        max-width:${GLYPH_DISPLAY_SIZE}px;
        max-height:${GLYPH_DISPLAY_SIZE}px;
        overflow:visible;
      }
      .sky-foundation-relationship-glyph{align-self:center;justify-self:center}
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
      .sky-foundation-relationship-glyph--aspect{grid-area:aspect}
      .sky-foundation-relationship-row>.sky-foundation-relationship-copy:nth-child(2){grid-area:left-copy}
      .sky-foundation-relationship-row>.sky-foundation-relationship-copy:nth-child(5){grid-area:right-copy}
      .sky-foundation-relationship-copy{
        display:grid;
        align-items:center;
        justify-items:center;
        min-width:0;
        width:100%;
        overflow:visible;
        color:#625b55;
      }
      .sky-foundation-relationship-copy small{
        display:grid;
        grid-template-columns:minmax(50px,auto) ${GLYPH_DISPLAY_SIZE}px;
        align-items:center;
        justify-content:center;
        gap:4px;
        width:100%;
        min-width:0;
        max-width:100%;
        min-height:${GLYPH_DISPLAY_SIZE}px;
        overflow:visible;
        white-space:nowrap;
        color:#625b55;
        font:850 .69rem/1 system-ui,sans-serif;
        font-variant-numeric:tabular-nums;
      }
      .sky-foundation-relationship-sign{display:inline-grid;margin:0;vertical-align:middle}
      .sky-foundation-relationship-orb{
        grid-area:orb;
        align-self:center;
        justify-self:center;
        min-width:40px;
        color:var(--relationship-stripe);
        text-align:center;
        white-space:nowrap;
        font:900 .61rem/1 system-ui,sans-serif;
        font-variant-numeric:tabular-nums;
        letter-spacing:.01em;
      }
      #skyFoundationRelationshipList{scrollbar-width:thin;scrollbar-color:#8d8d8d transparent;scrollbar-gutter:stable}
      #skyFoundationRelationshipList::-webkit-scrollbar{width:8px;height:8px}
      #skyFoundationRelationshipList::-webkit-scrollbar-track{background:transparent}
      #skyFoundationRelationshipList::-webkit-scrollbar-thumb{border:2px solid transparent;border-radius:999px;background:#8d8d8d;background-clip:padding-box}
      #skyFoundationRelationshipList::-webkit-scrollbar-button{display:none;width:0;height:0}
      @media(max-width:620px){
        .sky-foundation-relationship-row{
          grid-template-columns:${GLYPH_DISPLAY_SIZE}px minmax(90px,1fr) 44px ${GLYPH_DISPLAY_SIZE}px minmax(90px,1fr);
          column-gap:4px;
          min-height:58px;
          padding:4px 7px 3px 12px;
        }
        .sky-foundation-relationship-copy small{grid-template-columns:minmax(48px,auto) ${GLYPH_DISPLAY_SIZE}px;gap:3px;font-size:.66rem}
      }
    `;
    document.head.appendChild(style);
  }

  function outerHostIsIntact(slot, entry) {
    const host = slot?.firstElementChild;
    return slot?.childElementCount === 1 && slot?.dataset.relationshipGlyphOwner === OWNER &&
      host?.matches?.(`svg[data-relationship-canonical-host="${OWNER}"]`) &&
      host.dataset.canonicalGlyphId === entry?.id && host.getAttribute('viewBox') === MASTER_VIEWBOX;
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
    if (!entry || !component?.createBubble) { slot.dataset.glyphUnavailable = 'true'; return; }
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
      bubble = component.createBubble(host, entry.id, { radius:MASTER_RADIUS, padding:1, color });
      if (mode === 'plain') { bubble.circle.style.opacity = '0'; bubble.circle.setAttribute('aria-hidden', 'true'); }
    } catch (error) {
      slot.dataset.canonicalGlyphReady = 'error';
      slot.dataset.glyphUnavailable = 'true';
      host.remove();
      console.error('[Sky Chart relationship glyph]', error);
      return;
    }

    Promise.resolve(bubble.ready).then(() => {
      if (canonicalHostIsIntact(slot, entry, mode)) { slot.dataset.canonicalGlyphReady = 'true'; return; }
      slot.dataset.canonicalGlyphReady = 'corrupt';
      queueMicrotask(() => paintGlyph(slot, identity, mode, color, label));
    }).catch(error => {
      slot.dataset.canonicalGlyphReady = 'error';
      slot.dataset.glyphUnavailable = 'true';
      if (host.isConnected) host.remove();
      console.error('[Sky Chart relationship glyph]', error);
    });
  }

  function ensureSignSlot(row, side) {
    const left = side === 'left';
    const copy = row.querySelector(left ? ':scope > .sky-foundation-relationship-copy:nth-child(2)' : ':scope > .sky-foundation-relationship-copy:nth-child(5)');
    const small = copy?.querySelector('small');
    const signIndex = Number(row.dataset[left ? 'leftSign' : 'rightSign']);
    const signId = SIGN_IDS[signIndex];
    const signName = SIGN_NAMES[signIndex];
    if (!copy || !small || !signId || !signName) return null;

    const source = small.dataset.relationshipCoordinate || small.textContent.trim();
    const coordinate = small.dataset.relationshipCoordinate || (source.match(/\d{1,2}°\d{2}′/) || [source.split('·')[0].trim()])[0] || '';
    let signSlot = small.querySelector(':scope > .sky-foundation-relationship-sign');
    if (!signSlot) {
      signSlot = document.createElement('span');
      signSlot.className = 'sky-foundation-relationship-sign';
      signSlot.setAttribute('aria-label', signName);
    }
    signSlot.dataset.signGlyph = signId;
    const alreadyComposed = small.dataset.relationshipCoordinate === coordinate && small.childNodes.length === 2 &&
      small.firstChild?.nodeType === Node.TEXT_NODE && small.firstChild.nodeValue === coordinate && small.lastChild === signSlot;
    if (!alreadyComposed) {
      small.dataset.relationshipCoordinate = coordinate;
      small.replaceChildren(document.createTextNode(coordinate), signSlot);
    }
    const extras = Array.from(copy.childNodes).filter(node => node !== small);
    if (extras.length) extras.forEach(node => node.remove());
    return { signSlot, signId, signName };
  }

  function composeStructure(row) {
    if (!(row instanceof HTMLElement)) return;
    const aspect = String(row.dataset.aspect || '').toLowerCase();
    row.style.setProperty('--relationship-stripe', ASPECT_COLORS[aspect] || '#777');
    ensureSignSlot(row, 'left');
    ensureSignSlot(row, 'right');

    const orb = Number(row.dataset.sourceOrb);
    if (Number.isFinite(orb)) {
      let badge = row.querySelector(':scope > .sky-foundation-relationship-orb');
      if (!badge) { badge = document.createElement('span'); badge.className = 'sky-foundation-relationship-orb'; row.appendChild(badge); }
      const orbText = `${orb.toFixed(2)}°`;
      if (badge.textContent !== orbText) badge.textContent = orbText;
      badge.setAttribute('aria-label', `Orb ${orb.toFixed(2)} degrees`);
    }
    row.dataset.relationshipLayout = 'v26';
  }

  function paintRowGlyphs(row) {
    if (!(row instanceof HTMLElement) || row.dataset.relationshipPainted === 'v26') return;
    const aspect = String(row.dataset.aspect || '').toLowerCase();
    const leftSign = ensureSignSlot(row, 'left');
    const rightSign = ensureSignSlot(row, 'right');
    paintGlyph(row.querySelector('.sky-foundation-relationship-glyph--left'), row.dataset.leftPlacement, 'plain', SKY_COLORS.A, row.dataset.leftPlacement);
    paintGlyph(row.querySelector('.sky-foundation-relationship-glyph--aspect'), aspect, 'plain', ASPECT_COLORS[aspect] || '#777', aspect);
    paintGlyph(row.querySelector('.sky-foundation-relationship-glyph--right'), row.dataset.rightPlacement, 'plain', SKY_COLORS.B, row.dataset.rightPlacement);
    if (leftSign) paintGlyph(leftSign.signSlot, leftSign.signId, 'plain', SKY_COLORS.A, leftSign.signName);
    if (rightSign) paintGlyph(rightSign.signSlot, rightSign.signId, 'plain', SKY_COLORS.B, rightSign.signName);
    row.dataset.relationshipPainted = 'v26';
  }

  function registerRow(row) {
    if (!(row instanceof HTMLElement)) return;
    composeStructure(row);
    if (row.dataset.relationshipPainted === 'v26') return;
    if (visibleRows) visibleRows.observe(row);
    else paintRowGlyphs(row);
  }
  function registerRows(root) { root?.querySelectorAll?.('.sky-foundation-relationship-row').forEach(registerRow); }

  function bindList() {
    const list = document.getElementById('skyFoundationRelationshipList');
    if (!list) return;
    if (list === observedList) { registerRows(list); return; }

    listMutations?.disconnect();
    visibleRows?.disconnect();
    observedList = list;

    if ('IntersectionObserver' in window) {
      visibleRows = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          visibleRows.unobserve(entry.target);
          paintRowGlyphs(entry.target);
        });
      }, { root:list, rootMargin:'160px 0px', threshold:0.01 });
    } else visibleRows = null;

    listMutations = new MutationObserver(records => {
      records.forEach(record => {
        record.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          if (node.matches?.('.sky-foundation-relationship-row')) registerRow(node);
          node.querySelectorAll?.('.sky-foundation-relationship-row').forEach(registerRow);
        });
      });
    });
    listMutations.observe(list, { childList:true, subtree:true });
    registerRows(list);
  }

  function scheduleBind() {
    if (registerQueued) return;
    registerQueued = true;
    requestAnimationFrame(() => { registerQueued = false; bindList(); });
  }

  function start() {
    installStyle();
    bindList();
    ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready','relphi:sky-foundation-filter-changed'].forEach(name => window.addEventListener(name, scheduleBind));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();