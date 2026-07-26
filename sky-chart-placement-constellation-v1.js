// One graphical placement constellation shared by Sky Cards and the Placement Editor.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const SLOT_KEYS = { skyA:'relphiSkyChartA', skyB:'relphiSkyChartB' };
  const STATE_KEY = 'relphiSkyBuilderV4State';
  const ORDER = [
    ['Sun'], ['Moon'], ['Rising','Ascendant','ASC','AC'], ['Mercury'], ['Venus'], ['Mars'],
    ['Jupiter'], ['Saturn'], ['Uranus'], ['Neptune'], ['Pluto'], ['Chiron'],
    ['North Node','Node','NN'], ['South Node','SouthNode','SN'], ['Lilith'], ['Vertex','Vx'],
    ['Part of Fortune','Fortune','PoF'], ['Dsc','DSC','Descendant'], ['MC','Midheaven'], ['IC','Imum Coeli']
  ];
  const ID = {
    Sun:'sun', Moon:'moon', Rising:'asc', Ascendant:'asc', ASC:'asc', AC:'asc', Mercury:'mercury', Venus:'venus', Mars:'mars',
    Jupiter:'jupiter', Saturn:'saturn', Uranus:'uranus', Neptune:'neptune', Pluto:'pluto', Chiron:'chiron',
    'North Node':'north-node', Node:'north-node', NN:'north-node', 'South Node':'south-node', SouthNode:'south-node', SN:'south-node',
    Lilith:'lilith', Vertex:'vertex', Vx:'vertex', 'Part of Fortune':'part-of-fortune', Fortune:'part-of-fortune', PoF:'part-of-fortune',
    Dsc:'dsc', DSC:'dsc', Descendant:'dsc', MC:'mc', Midheaven:'mc', IC:'ic', 'Imum Coeli':'ic'
  };
  const LABEL = { Ascendant:'Rising', ASC:'Rising', AC:'Rising', Dsc:'Descendant', DSC:'Descendant', Midheaven:'MC', 'Imum Coeli':'IC' };
  const PLANET_COLOR = {
    sun:'#f0a126', moon:'#d8dce1', mercury:'#9e9b96', venus:'#e6b44d', mars:'#cf5f39', jupiter:'#8a5834', saturn:'#d6b75c',
    uranus:'#6fb6c4', neptune:'#5f77c6', pluto:'#7b5547', chiron:'#a77c55', asc:'#f7f4ed', dsc:'#f7f4ed', mc:'#f7f4ed', ic:'#f7f4ed',
    'north-node':'#f7f4ed', 'south-node':'#f7f4ed', lilith:'#f7f4ed', vertex:'#f7f4ed', 'part-of-fortune':'#f7f4ed'
  };
  const AXES = {
    horizon:{ label:'Self ↔ Other', meaning:'Ascendant and Descendant', ids:['asc','dsc'] },
    meridian:{ label:'Public ↔ Private', meaning:'Midheaven and Imum Coeli', ids:['mc','ic'] },
    nodes:{ label:'Path ↔ Past', meaning:'North Node and South Node', ids:['north-node','south-node'] }
  };
  let queued = false;

  function readJson(storage, key, fallback) { try { const raw = storage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; } }
  function placements(payload) { const value = payload && (payload.placements || payload); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  function findEntry(map, names) { const wanted = names.map(function (name) { return String(name).toLowerCase(); }); const key = Object.keys(map).find(function (candidate) { return wanted.includes(String(candidate).trim().toLowerCase()); }); return key ? { key:key, item:map[key] } : null; }
  function orderedEntries(map) { const used = new Set(), result = []; ORDER.forEach(function (names) { const found = findEntry(map, names); if (found && !used.has(found.key)) { used.add(found.key); result.push(found); } }); Object.keys(map).forEach(function (key) { if (!used.has(key)) result.push({ key:key, item:map[key] }); }); return result; }
  function coordinate(item) { if (!item) return 'Not set'; const sign = String(item.sign || '').trim(); const degree = item.degree === '' || item.degree == null ? '' : Number(item.degree) + '°'; const minute = item.minute === '' || item.minute == null ? '' : String(Number(item.minute)).padStart(2,'0') + '′'; return [sign, degree + minute].filter(Boolean).join(' ') + (item.retrograde ? ' ℞' : ''); }
  function escapeHtml(value) { return String(value || '').replace(/[&<>"']/g, function (char) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]; }); }
  function bodyId(key) { return ID[key] || window.RelphiGlyphRegistry?.resolve(key)?.id || ''; }
  function signId(item) { return window.RelphiGlyphRegistry?.resolve(item?.sign || '')?.id || String(item?.sign || '').toLowerCase(); }
  function signature(map) { return orderedEntries(map).map(function (entry) { const item = entry.item || {}; return [entry.key,item.sign,item.degree,item.minute,item.house,item.retrograde?'R':''].join(':'); }).join('|'); }

  function glyphSvg(identity, className, label) {
    return '<svg class="' + className + '" data-relphi-constellation-glyph="' + escapeHtml(identity) + '" viewBox="-20 -20 40 40" role="img" aria-label="' + escapeHtml(label) + '"></svg>';
  }

  function orb(entry, index, mode) {
    const key = entry.key;
    const item = entry.item || {};
    const id = bodyId(key);
    const label = LABEL[key] || key;
    const coordinateText = coordinate(item);
    const sign = String(item.sign || '').trim();
    const signIdentity = signId(item);
    const house = item.house == null || item.house === '' ? '' : 'H' + item.house;
    const anchor = index < 3 ? ' is-anchor' : '';
    const color = PLANET_COLOR[id] || '#f7f4ed';
    return '<button type="button" class="relphi-placement-orb' + anchor + '" data-placement-key="' + escapeHtml(key) + '" data-body-id="' + escapeHtml(id) + '" style="--orb-color:' + color + '" aria-label="' + escapeHtml(label + ', ' + coordinateText) + '">' +
      '<span class="relphi-placement-orb-art">' + glyphSvg(id,'relphi-placement-body-glyph',label) + '</span>' +
      '<span class="relphi-placement-orb-name">' + escapeHtml(label) + '</span>' +
      '<span class="relphi-placement-orb-coordinate">' + (signIdentity ? glyphSvg(signIdentity,'relphi-placement-sign-glyph',sign) : '') + '<span>' + escapeHtml(coordinateText.replace(sign,'').trim()) + '</span></span>' +
      '<span class="relphi-placement-orb-meta">' + escapeHtml([house,item.retrograde?'retrograde':''].filter(Boolean).join(' · ')) + '</span>' +
    '</button>';
  }

  function constellationMarkup(map, mode) {
    const entries = orderedEntries(map);
    const anchors = entries.slice(0,3).map(function (entry,index) { return orb(entry,index,mode); }).join('');
    const rest = entries.slice(3).map(function (entry,index) { return orb(entry,index + 3,mode); }).join('');
    return '<section class="relphi-placement-constellation is-' + mode + '" data-placement-signature="' + escapeHtml(signature(map)) + '">' +
      '<div class="relphi-placement-anchors" aria-label="Sun, Moon, and Rising">' + anchors + '</div>' +
      '<div class="relphi-placement-toolbar"><button type="button" data-constellation-action="toggle-all" aria-expanded="' + (mode === 'editor' ? 'true' : 'false') + '">' + (mode === 'editor' ? 'All placements' : 'Show all placements') + '</button>' +
      '<button type="button" data-constellation-action="axes" aria-expanded="false">Chart axes</button></div>' +
      '<div class="relphi-placement-orb-grid"' + (mode === 'card' ? ' hidden' : '') + '>' + rest + '</div>' +
      '<div class="relphi-axis-focus" hidden><div class="relphi-axis-focus-buttons">' + Object.keys(AXES).map(function (key) { return '<button type="button" data-axis-focus="' + key + '">' + AXES[key].label + '</button>'; }).join('') + '</div><p class="relphi-axis-focus-copy">Select an axis to highlight its two placements.</p></div>' +
      '<div class="relphi-placement-detail" hidden aria-live="polite"></div>' +
    '</section>';
  }

  function drawGlyphs(root, accent) {
    const component = window.RelphiGlyphComponent;
    if (!component?.createBubble) return;
    root.querySelectorAll('svg[data-relphi-constellation-glyph]:not([data-rendered])').forEach(function (svg) {
      const identity = svg.dataset.relphiConstellationGlyph;
      if (!identity) return;
      svg.dataset.rendered = 'pending';
      const radius = svg.classList.contains('relphi-placement-sign-glyph') ? 8 : 15;
      const bubble = component.createBubble(svg, identity, { radius:radius, padding:1, color:accent || '#111111', fill:'#fff', strokeWidth:2.35 });
      bubble.ready.then(function () { svg.dataset.rendered = 'true'; }).catch(function () { svg.dataset.rendered = 'failed'; });
    });
  }

  function setManualFields(entry) {
    const item = entry.item || {};
    const values = {
      skyCreatorPlacementBody:entry.key,
      skyCreatorPlacementSign:item.sign || '',
      skyCreatorPlacementDegree:item.degree ?? '',
      skyCreatorPlacementMinute:item.minute ?? '',
      skyCreatorPlacementHouse:item.house ?? ''
    };
    Object.keys(values).forEach(function (id) { const field = document.getElementById(id); if (!field) return; field.value = values[id]; field.dispatchEvent(new Event('input',{bubbles:true})); field.dispatchEvent(new Event('change',{bubbles:true})); });
    const retro = document.getElementById('skyCreatorPlacementRetrograde'); if (retro) retro.checked = !!item.retrograde;
  }

  function bindConstellation(section, map, mode) {
    if (section.dataset.bound === 'true') return;
    section.dataset.bound = 'true';
    section.addEventListener('click', function (event) {
      const action = event.target.closest('[data-constellation-action]');
      if (action) {
        const type = action.dataset.constellationAction;
        if (type === 'toggle-all') { const grid = section.querySelector('.relphi-placement-orb-grid'); const open = grid.hidden; grid.hidden = !open; action.setAttribute('aria-expanded', String(open)); action.textContent = open ? 'Hide extra placements' : 'Show all placements'; }
        if (type === 'axes') { const focus = section.querySelector('.relphi-axis-focus'); const open = focus.hidden; focus.hidden = !open; action.setAttribute('aria-expanded', String(open)); section.classList.toggle('is-axis-mode', open); }
        return;
      }
      const axisButton = event.target.closest('[data-axis-focus]');
      if (axisButton) {
        const axis = AXES[axisButton.dataset.axisFocus]; if (!axis) return;
        section.querySelectorAll('.relphi-placement-orb').forEach(function (orbNode) { orbNode.classList.toggle('is-axis-member', axis.ids.includes(orbNode.dataset.bodyId)); orbNode.classList.toggle('is-axis-dimmed', !axis.ids.includes(orbNode.dataset.bodyId)); });
        section.querySelector('.relphi-axis-focus-copy').textContent = axis.meaning;
        return;
      }
      const orbNode = event.target.closest('.relphi-placement-orb');
      if (!orbNode) return;
      const entry = findEntry(map,[orbNode.dataset.placementKey]); if (!entry) return;
      const item = entry.item || {};
      const detail = section.querySelector('.relphi-placement-detail');
      detail.hidden = false;
      detail.innerHTML = '<strong>' + escapeHtml(LABEL[entry.key] || entry.key) + '</strong><span>' + escapeHtml(coordinate(item)) + '</span>' + (item.house == null || item.house === '' ? '' : '<span>House ' + escapeHtml(item.house) + '</span>');
      section.querySelectorAll('.relphi-placement-orb.is-selected').forEach(function (node) { node.classList.remove('is-selected'); });
      orbNode.classList.add('is-selected');
      if (mode === 'editor') { setManualFields(entry); const drawer = document.querySelector('.relphi-placement-advanced'); if (drawer) drawer.open = true; }
    });
  }

  function enhanceCard(panel) {
    const slot = panel.dataset.slot;
    const payload = readJson(localStorage, SLOT_KEYS[slot], null);
    if (!payload) return;
    const map = placements(payload);
    const sig = signature(map);
    let section = panel.querySelector(':scope .relphi-placement-constellation');
    if (!section || section.dataset.placementSignature !== sig) {
      section?.remove();
      section = document.createElement('div');
      section.innerHTML = constellationMarkup(map,'card');
      section = section.firstElementChild;
      const count = panel.querySelector('.relphi-v4-panel-copy > p');
      (count || panel.querySelector('.relphi-v4-panel-copy h3'))?.insertAdjacentElement('afterend',section);
    }
    panel.querySelector('.relphi-sky-identity-strip')?.setAttribute('hidden','');
    panel.querySelector('.relphi-v4-placement-preview')?.setAttribute('hidden','');
    panel.querySelector('.relphi-card-axes')?.setAttribute('hidden','');
    bindConstellation(section,map,'card');
    const accent = getComputedStyle(panel).getPropertyValue('--sky-accent').trim() || (slot === 'skyB' ? '#3166e2' : '#dc1f18');
    drawGlyphs(section,accent);
  }

  function currentEditorPayload() {
    const state = readJson(sessionStorage,STATE_KEY,{});
    const slot = state.editingSlot === 'skyB' ? 'skyB' : 'skyA';
    return readJson(localStorage,SLOT_KEYS[slot],state[slot] || null);
  }

  function enhanceEditor() {
    const card = document.querySelector('.relphi-v4-placement-card');
    const mount = document.getElementById('relphiV4PlacementMount');
    const legacy = mount?.querySelector('.sky-creator-side-by-side');
    if (!card || !mount || !legacy) return;
    const payload = currentEditorPayload();
    const map = placements(payload);
    const sig = signature(map);
    let section = card.querySelector(':scope .relphi-placement-constellation');
    if (!section || section.dataset.placementSignature !== sig) {
      section?.remove();
      const holder = document.createElement('div'); holder.innerHTML = constellationMarkup(map,'editor'); section = holder.firstElementChild;
      mount.insertAdjacentElement('beforebegin',section);
    }
    let advanced = card.querySelector('.relphi-placement-advanced');
    if (!advanced) {
      advanced = document.createElement('details'); advanced.className = 'relphi-placement-advanced'; advanced.innerHTML = '<summary>Import or edit placement fields</summary>';
      mount.insertAdjacentElement('beforebegin',advanced); advanced.appendChild(legacy);
    }
    bindConstellation(section,map,'editor');
    drawGlyphs(section,'#111111');
  }

  function styles() {
    if (document.getElementById('relphi-placement-constellation-styles')) return;
    const style = document.createElement('style');
    style.id = 'relphi-placement-constellation-styles';
    style.textContent = [
      '.relphi-v4-placement-preview[hidden],.relphi-sky-identity-strip[hidden],.relphi-card-axes[hidden]{display:none!important}',
      '.relphi-placement-constellation{display:grid;gap:.8rem;margin:1rem 0}',
      '.relphi-placement-anchors{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.7rem}',
      '.relphi-placement-orb-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(94px,1fr));gap:.65rem}',
      '.relphi-placement-orb{position:relative;display:grid;grid-template-rows:auto auto auto auto;place-items:center;align-content:center;gap:.16rem;min-width:0;min-height:112px;padding:.55rem;border:1px solid color-mix(in srgb,var(--sky-accent,#dc1f18) 24%,#ddd)!important;border-radius:50%!important;background:radial-gradient(circle at 38% 28%,#fff 0 12%,color-mix(in srgb,var(--orb-color) 70%,#fff) 38%,var(--orb-color) 100%)!important;color:#111!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 4px 12px rgba(31,25,20,.08)!important;aspect-ratio:1/1;overflow:hidden}',
      '.relphi-placement-orb.is-anchor{min-height:132px}',
      '.relphi-placement-orb-art{display:grid;place-items:center;width:2.35rem;height:2.35rem}.relphi-placement-body-glyph{display:block;width:100%;height:100%;overflow:hidden}',
      '.relphi-placement-orb-name{font-size:.72rem;font-weight:900;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}',
      '.relphi-placement-orb-coordinate{display:flex;align-items:center;justify-content:center;gap:.2rem;font-size:.78rem;font-weight:800}.relphi-placement-sign-glyph{width:1.05rem;height:1.05rem;overflow:hidden}',
      '.relphi-placement-orb-meta{min-height:.8rem;font-size:.61rem;color:#5f5751}',
      '.relphi-placement-orb:hover,.relphi-placement-orb:focus-visible,.relphi-placement-orb.is-selected{outline:3px solid color-mix(in srgb,var(--sky-accent,#dc1f18) 55%,transparent)!important;outline-offset:2px}',
      '.relphi-placement-toolbar{display:flex;flex-wrap:wrap;gap:.45rem}.relphi-placement-toolbar button,.relphi-axis-focus-buttons button{appearance:none;border:1px solid color-mix(in srgb,var(--sky-accent,#dc1f18) 30%,#ddd);border-radius:999px;background:#fff;color:#111;font:inherit;font-size:.78rem;font-weight:800;padding:.48rem .75rem;cursor:pointer}',
      '.relphi-axis-focus{display:grid;gap:.55rem;padding:.65rem;border:1px solid #e6ded7;border-radius:14px;background:#fff}.relphi-axis-focus-buttons{display:flex;flex-wrap:wrap;gap:.4rem}.relphi-axis-focus-copy{margin:0;font-size:.78rem;color:#5f5751}',
      '.relphi-placement-constellation.is-axis-mode .relphi-placement-orb.is-axis-dimmed{opacity:.2;filter:grayscale(1)}.relphi-placement-orb.is-axis-member{box-shadow:0 0 0 3px color-mix(in srgb,var(--sky-accent,#dc1f18) 45%,transparent)!important}',
      '.relphi-placement-detail{display:flex;flex-wrap:wrap;gap:.45rem;align-items:center;padding:.65rem .75rem;border-left:4px solid var(--sky-accent,#dc1f18);background:#fff;border-radius:10px;font-size:.82rem}.relphi-placement-detail strong{font-weight:900}',
      '.relphi-placement-advanced{margin-top:1rem;border:1px solid #ddd3ca;border-radius:18px;background:#fff;overflow:hidden}.relphi-placement-advanced>summary{cursor:pointer;padding:1rem 1.1rem;font-weight:900}.relphi-placement-advanced>.sky-creator-side-by-side{padding:0 1rem 1rem}',
      '.relphi-v4-placement-card>p{max-width:58rem}.relphi-v4-placement-mount:empty{display:none}',
      '@media(max-width:700px){.relphi-placement-anchors{grid-template-columns:repeat(3,minmax(0,1fr));gap:.4rem}.relphi-placement-orb{min-height:96px;padding:.42rem}.relphi-placement-orb.is-anchor{min-height:108px}.relphi-placement-orb-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:.4rem}.relphi-placement-orb-name{font-size:.62rem}.relphi-placement-orb-coordinate{font-size:.68rem}}',
      '@media(max-width:460px){.relphi-placement-orb-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.relphi-placement-orb-art{width:1.9rem;height:1.9rem}}'
    ].join('');
    document.head.appendChild(style);
  }

  function run() {
    queued = false;
    styles();
    document.querySelectorAll('.relphi-v4-sky-panel[data-slot]').forEach(enhanceCard);
    enhanceEditor();
  }
  function queue() { if (queued) return; queued = true; requestAnimationFrame(run); }
  function start() { run(); new MutationObserver(queue).observe(document.body,{childList:true,subtree:true}); window.addEventListener('storage',queue); window.addEventListener('relphi:sky-builder-v4-loaded',queue); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();