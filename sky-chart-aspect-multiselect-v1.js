// Legacy aspect control shell plus Sky B intrasky generator. The scope matrix is the sole owner of aspect/scope visibility.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;
  if (window.__relphiSkyAspectMultiselectV1) return;
  window.__relphiSkyAspectMultiselectV1 = true;

  const ASPECTS = Object.freeze([
    { id:'conjunction', label:'Conjunction' },
    { id:'semi-sextile', label:'Semi-Sextile' },
    { id:'octile', label:'Octile' },
    { id:'sextile', label:'Sextile' },
    { id:'quintile', label:'Quintile' },
    { id:'square', label:'Square' },
    { id:'trine', label:'Trine' },
    { id:'tri-octile', label:'Tri-Octile' },
    { id:'bi-quintile', label:'Bi-Quintile' },
    { id:'quincunx', label:'Quincunx' },
    { id:'opposition', label:'Opposition' }
  ]);
  const SCOPES = Object.freeze([
    { id:'A-A', label:'A↔A' },
    { id:'B-B', label:'B↔B' },
    { id:'A-B', label:'A↔B' }
  ]);
  const IDS = ASPECTS.map(aspect => aspect.id);
  const LABELS = new Map(ASPECTS.map(aspect => [aspect.id, aspect.label]));
  const selected = new Set(IDS);
  const selectedScopes = new Set(SCOPES.map(scope => scope.id));

  const B_KEY = 'relphiSkyChartB';
  const B_COLOR = '#2462d0';
  const SIGNS = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
  const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const ORDER = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','chiron','lilith','part-of-fortune','vertex','north-node','south-node','asc','dsc','mc','ic'];
  const ALIASES = Object.freeze({
    rising:'asc', ascendant:'asc', asc:'asc', ac:'asc',
    descendant:'dsc', dsc:'dsc', dc:'dsc',
    midheaven:'mc', mc:'mc', 'imum coeli':'ic', imumcoeli:'ic', ic:'ic',
    vertex:'vertex', vx:'vertex',
    'north node':'north-node', node:'north-node', 'true node':'north-node', 'mean node':'north-node',
    'south node':'south-node', chiron:'chiron', lilith:'lilith', 'black moon lilith':'lilith',
    fortune:'part-of-fortune', 'part of fortune':'part-of-fortune', pof:'part-of-fortune'
  });
  const REDUNDANT = new Set(['asc|dsc','ic|mc','north-node|south-node']);

  let portalOwner = null;
  let queued = false;
  let countTimer = 0;
  let hoverFilterActive = false;
  let intraBSignature = '';
  let intraBRendered = false;
  let intraBCount = 0;

  function filterBar() {
    return document.querySelector('#skyFoundationRelationships .sky-chart-filter-bar');
  }

  function control() {
    return document.querySelector('[data-aspect-filter="combined"]');
  }

  function popover() {
    return document.getElementById('skyChartAspectPopover');
  }

  function normalize(value) {
    const key = String(value || '').trim().toLowerCase().replace(/[ _]+/g, '-');
    const aliases = {
      semisextile:'semi-sextile',
      'semi-sextile':'semi-sextile',
      semisquare:'octile',
      'semi-square':'octile',
      sesquisquare:'tri-octile',
      'sesqui-square':'tri-octile',
      sesquiquadrate:'tri-octile',
      biquintile:'bi-quintile',
      inconjunct:'quincunx'
    };
    return aliases[key] || key;
  }

  function installScopeStyles() {
    if (document.getElementById('skyAspectRelationshipScopeV1Styles')) return;
    const style = document.createElement('style');
    style.id = 'skyAspectRelationshipScopeV1Styles';
    style.textContent = `
      .sky-chart-aspect-scope-row{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        min-height:36px;
        box-sizing:border-box;
        margin:0 0 7px;
        padding:7px 10px;
        border:1px solid rgba(31,27,24,.17);
        border-radius:9px;
        background:#f4efe8;
      }
      .sky-chart-aspect-scope-choice{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        gap:5px;
        min-width:0;
        margin:0;
        white-space:nowrap;
        color:#29231e;
        cursor:pointer;
        font:850 .67rem/1 system-ui,sans-serif;
      }
      .sky-chart-aspect-scope-choice>span{display:inline-block}
      .sky-chart-aspect-scope-choice>input[type="checkbox"]{flex:0 0 15px}
      @media(max-width:360px){
        .sky-chart-aspect-scope-row{gap:6px;padding-left:7px;padding-right:7px}
        .sky-chart-aspect-scope-choice{gap:4px;font-size:.63rem}
      }
    `;
    document.head.appendChild(style);
  }

  function summary() {
    if (!selected.size) return 'None';
    if (selected.size === IDS.length) return 'All';
    if (selected.size === 1) return LABELS.get(Array.from(selected)[0]) || '1 selected';
    return `${selected.size} of ${IDS.length}`;
  }

  function checkbox(id, labelText, master = false) {
    const label = document.createElement('label');
    label.className = `sky-chart-aspect-list-item${master ? ' sky-chart-aspect-list-item-master' : ''}`;
    label.dataset.aspectListItem = id;

    const text = document.createElement('span');
    text.className = 'sky-chart-aspect-list-label';
    text.textContent = labelText;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.dataset.aspectChoice = id;
    input.checked = master ? selected.size === IDS.length : selected.has(id);
    input.setAttribute('aria-label', labelText);

    label.append(text, input);
    return label;
  }

  function scopeCheckbox(scope) {
    const label = document.createElement('label');
    label.className = 'sky-chart-aspect-scope-choice';
    const text = document.createElement('span');
    text.textContent = scope.label;
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.dataset.aspectScopeChoice = scope.id;
    input.checked = selectedScopes.has(scope.id);
    input.setAttribute('aria-label', `${scope.label} relationships`);
    label.append(text, input);
    return label;
  }

  function renderControl() {
    const body = popover()?.querySelector('.sky-chart-aspect-filter-body');
    if (!body) return;
    body.replaceChildren();
    installScopeStyles();

    const scopes = document.createElement('div');
    scopes.className = 'sky-chart-aspect-scope-row';
    scopes.setAttribute('role', 'group');
    scopes.setAttribute('aria-label', 'Relationship scopes');
    SCOPES.forEach(scope => scopes.appendChild(scopeCheckbox(scope)));
    body.appendChild(scopes);

    const list = document.createElement('div');
    list.className = 'sky-chart-aspect-list';
    list.dataset.aspectList = 'combined';

    const header = document.createElement('div');
    header.className = 'sky-chart-aspect-list-header';
    header.innerHTML = '<strong>Aspect</strong><span>Show</span>';
    list.appendChild(header);
    list.appendChild(checkbox('all', 'All aspects', true));
    ASPECTS.forEach(aspect => list.appendChild(checkbox(aspect.id, aspect.label)));
    body.appendChild(list);
    updateControlStates();
  }

  function updateControlStates() {
    const owner = control();
    const menu = popover();
    if (!owner || !menu) return;
    const all = menu.querySelector('[data-aspect-choice="all"]');
    if (all) {
      all.checked = selected.size === IDS.length;
      all.indeterminate = selected.size > 0 && selected.size < IDS.length;
    }
    menu.querySelectorAll('[data-aspect-choice]:not([data-aspect-choice="all"])').forEach(input => {
      input.checked = selected.has(input.dataset.aspectChoice);
    });
    menu.querySelectorAll('[data-aspect-scope-choice]').forEach(input => {
      input.checked = selectedScopes.has(input.dataset.aspectScopeChoice);
    });
    const status = owner.querySelector('[data-aspect-filter-summary]');
    if (status) status.textContent = summary();
    owner.dataset.selectionCount = String(selected.size);
    owner.dataset.scopeSelectionCount = String(selectedScopes.size);
  }

  function relationshipMode(node) {
    const declared = String(node?.dataset?.relationshipMode || '').toUpperCase();
    if (declared === 'A-A' || declared === 'B-B' || declared === 'A-B') return declared;
    const left = String(node?.dataset?.leftSky || '').toUpperCase();
    const right = String(node?.dataset?.rightSky || '').toUpperCase();
    if (left && right) return left === right ? `${left}-${right}` : 'A-B';
    const single = String(node?.dataset?.singleSky || '').toUpperCase();
    if (single === 'A' || single === 'B') return `${single}-${single}`;
    return 'A-B';
  }

  function relationshipVisible(node) {
    const id = normalize(node.dataset.aspect);
    return selectedScopes.has(relationshipMode(node)) && (!id || selected.has(id));
  }

  function updateVisibleCount() {
    clearTimeout(countTimer);
    countTimer = setTimeout(() => requestAnimationFrame(() => {
      const rows = Array.from(document.querySelectorAll('.sky-foundation-relationship-row'));
      const eligible = rows.filter(row => !row.classList.contains('sky-foundation-single-sky-cross-hidden'));
      const visible = eligible.filter(row =>
        !row.hidden &&
        !row.classList.contains('sky-chart-filter-hidden') &&
        !row.classList.contains('sky-chart-orb-hidden') &&
        !row.classList.contains('sky-orb-filter-hidden') &&
        !row.classList.contains('sky-chart-multiselect-hidden') &&
        !row.classList.contains('sky-chart-house-multiselect-hidden') &&
        !row.classList.contains('sky-chart-aspect-multiselect-hidden')
      ).length;
      const count = document.getElementById('skyFoundationRelationshipCount');
      const empty = document.getElementById('skyFoundationRelationshipEmpty');
      const next = `${visible}/${eligible.length}`;
      if (count && count.textContent !== next) {
        count.textContent = next;
        count.dataset.total = String(eligible.length);
      }
      if (empty) empty.hidden = visible !== 0;
    }), 0);
  }

  function applyFilters() {
    // The matrix module owns sky-chart-aspect-multiselect-hidden, public scope state,
    // counts, and filter-change broadcasts. This legacy module only keeps its shell
    // coherent while generating B↔B relationships.
    updateControlStates();
    document.documentElement.dataset.skyAspectLegacy = 'generator-only';
  }

  function handleChange(event) {
    const scopeInput = event.target.closest?.('[data-aspect-scope-choice]');
    if (scopeInput) {
      const scope = scopeInput.dataset.aspectScopeChoice;
      if (scopeInput.checked) selectedScopes.add(scope);
      else selectedScopes.delete(scope);
      applyFilters();
      return;
    }

    const input = event.target.closest?.('[data-aspect-choice]');
    if (!input) return;
    const id = input.dataset.aspectChoice;
    if (id === 'all') {
      selected.clear();
      if (input.checked) IDS.forEach(aspect => selected.add(aspect));
    } else if (input.checked) selected.add(id);
    else selected.delete(id);
    applyFilters();
  }

  function readB() {
    try { return JSON.parse(localStorage.getItem(B_KEY) || 'null'); }
    catch (_) { return null; }
  }

  function norm(value) { return ((Number(value) % 360) + 360) % 360; }
  function separation(a,b) { return Math.abs(((a-b+180)%360+360)%360-180); }
  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[character]));
  }

  function source(payload) {
    if (!payload || typeof payload !== 'object') return [];
    const known = [payload.placements,payload.positions,payload.points,payload.bodies]
      .find(value => value && typeof value === 'object');
    const raw = known || payload;
    if (Array.isArray(raw)) return raw.map((item,index) => [String(item?.name || item?.label || item?.id || index),item]);
    return Object.entries(raw).filter(([key,item]) =>
      item && typeof item === 'object' && !Array.isArray(item) &&
      !/^(calcProfile|metadata|profile|location|notes|houseCusps|cusps|houses)$/i.test(key) &&
      (Number.isFinite(Number(item.longitude)) || item.sign || item.zodiac)
    );
  }

  function longitude(item) {
    if (Number.isFinite(Number(item?.longitude))) return norm(item.longitude);
    const sign = SIGNS.indexOf(String(item?.sign || item?.zodiac || '').trim().toLowerCase());
    return sign < 0 ? NaN : norm(
      sign * 30 + Number(item.degree || item.degrees || 0) +
      Number(item.minute || item.minutes || 0) / 60 +
      Number(item.second || item.seconds || 0) / 3600
    );
  }

  function canonical(key,item) {
    const registry = window.RelphiGlyphRegistry;
    if (!registry) return null;
    for (const candidate of [item?.glyphId,item?.id,item?.name,item?.label,item?.body,item?.planet,item?.point,key]) {
      if (candidate == null) continue;
      const raw = String(candidate).trim();
      const id = ALIASES[raw.toLowerCase()] || raw;
      const entry = registry.resolve?.(id) || registry.get?.(id);
      if (entry) return entry;
    }
    return null;
  }

  function profile(payload) {
    return payload?.calcProfile && typeof payload.calcProfile === 'object' ? payload.calcProfile : {};
  }

  function ascendant(payload,list) {
    const record = list.find(item => item.id === 'asc');
    if (record) return record.value;
    const value = Number(profile(payload).ascendant ?? payload?.ascendant ?? payload?.asc);
    return Number.isFinite(value) ? norm(value) : 0;
  }

  function cusps(payload,list) {
    const p = profile(payload);
    for (const raw of [p.houseCusps,p.cusps,payload?.houseCusps,payload?.cusps,payload?.houses]) {
      if (!raw) continue;
      const values = (Array.isArray(raw) ? raw : Object.values(raw))
        .map(item => typeof item === 'object' ? Number(item.longitude ?? item.value ?? item.cusp) : Number(item))
        .slice(0,12);
      if (values.length === 12 && values.every(Number.isFinite)) return values.map(norm);
    }
    const asc = ascendant(payload,list);
    const system = String(p.houseSystem || payload?.houseSystem || 'whole-sign').toLowerCase();
    const start = system.includes('whole') ? Math.floor(asc/30)*30 : asc;
    return Array.from({length:12},(_,index) => norm(start+index*30));
  }

  function houseFor(value,houseCusps) {
    for (let index=0; index<12; index += 1) {
      const start = houseCusps[index];
      const span = norm(houseCusps[(index+1)%12]-start) || 30;
      if (norm(value-start) < span) return index+1;
    }
    return 12;
  }

  function prepareB(payload) {
    const list = source(payload).map(([key,item]) => {
      const entry = canonical(key,item);
      const value = longitude(item);
      return {key,item,entry,id:entry?.id || '',value,sky:'B'};
    }).filter(record => record.entry && Number.isFinite(record.value)).sort((a,b) => {
      const ai = ORDER.indexOf(a.id), bi = ORDER.indexOf(b.id);
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || a.value-b.value;
    });
    const houseCusps = cusps(payload,list);
    list.forEach(record => {
      record.sign = Math.floor(record.value/30);
      record.house = houseFor(record.value,houseCusps);
    });
    return list;
  }

  function redundantPair(left,right) {
    return REDUNDANT.has([String(left || ''),String(right || '')].sort().join('|'));
  }

  function relationshipsB(list) {
    const harmonic = window.RelphiHarmonicOrb;
    const aspects = harmonic?.aspects || [];
    const windowValue = Number(harmonic?.maxWindow) || 12;
    const result = [];
    for (let i=0; i<list.length; i += 1) {
      for (let j=i+1; j<list.length; j += 1) {
        const left = list[i], right = list[j];
        if (redundantPair(left.id,right.id)) continue;
        const distance = separation(left.value,right.value);
        for (const aspect of aspects) {
          const relation = harmonic?.relation?.(left,right,aspect,distance,windowValue);
          if (relation) result.push({...relation,scope:'intra-b'});
        }
      }
    }
    return result.sort((a,b) => a.phaseError-b.phaseError || a.harmonicOrder-b.harmonicOrder || a.orb-b.orb);
  }

  function coordinate(record) {
    const value = norm(record.value);
    const sign = Math.floor(value/30);
    const within = value-sign*30;
    const degree = Math.floor(within);
    const minute = Math.floor((within-degree)*60+1e-9);
    return {sign,text:`${degree}°${String(minute).padStart(2,'0')}′`};
  }

  function glyphSlot(role,label) {
    const slot = document.createElement('span');
    slot.className = `sky-foundation-relationship-glyph sky-foundation-relationship-glyph--${role}`;
    slot.dataset.glyphRole = role;
    slot.setAttribute('aria-label',label);
    return slot;
  }

  function makeBRow(relation,index) {
    const left = coordinate(relation.left), right = coordinate(relation.right);
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'sky-foundation-relationship-row sky-intrasky-b-generated';
    row.dataset.relationshipSelection = 'true';
    row.dataset.relationIndex = `BB-${index}`;
    row.dataset.relationshipMode = 'B-B';
    row.dataset.relationScope = 'intra-b';
    row.dataset.leftSky = 'B';
    row.dataset.rightSky = 'B';
    row.dataset.aspect = relation.aspect.id;
    row.dataset.leftPlacement = relation.left.id;
    row.dataset.rightPlacement = relation.right.id;
    row.dataset.sourceOrb = relation.orb.toFixed(6);
    row.dataset.harmonicOrder = String(relation.harmonicOrder);
    row.dataset.harmonicNumerator = String(relation.harmonicNumerator);
    row.dataset.phaseError = relation.phaseError.toFixed(6);
    row.dataset.signedPhaseError = relation.signedPhaseError.toFixed(6);
    row.dataset.harmonicWindow = relation.masterWindow.toFixed(6);
    row.dataset.windowFraction = Number.isFinite(relation.windowFraction) ? relation.windowFraction.toFixed(6) : String(relation.windowFraction);
    row.dataset.harmonicCoherence = relation.coherence.toFixed(8);
    row.dataset.leftHouse = String(relation.left.house);
    row.dataset.rightHouse = String(relation.right.house);
    row.dataset.leftSign = String(left.sign);
    row.dataset.rightSign = String(right.sign);
    row.setAttribute('aria-label',`Sky B ${relation.left.entry.name} ${relation.aspect.id} ${relation.right.entry.name}, orb ${relation.orb.toFixed(2)} degrees`);

    const leftGlyph = glyphSlot('left',relation.left.entry.name);
    const aspectGlyph = glyphSlot('aspect',relation.aspect.id);
    const rightGlyph = glyphSlot('right',relation.right.entry.name);
    const leftCopy = document.createElement('span');
    const rightCopy = document.createElement('span');
    leftCopy.className = rightCopy.className = 'sky-foundation-relationship-copy';
    leftCopy.innerHTML = `${esc(relation.left.entry.name)}<small>${left.text} ${esc(SIGN_NAMES[left.sign])} · H${relation.left.house}</small>`;
    rightCopy.innerHTML = `${esc(relation.right.entry.name)}<small>${right.text} ${esc(SIGN_NAMES[right.sign])} · H${relation.right.house} · Orb ${relation.orb.toFixed(2)}°</small>`;
    row.append(leftGlyph,leftCopy,aspectGlyph,rightGlyph,rightCopy);
    return row;
  }

  async function repairBGlyph(row,side) {
    const templates = window.RelphiRelationshipGlyphTemplates;
    if (!templates?.clone) return;
    const placement = row.dataset[`${side}Placement`];
    const glyph = row.querySelector(`.sky-foundation-relationship-glyph--${side}`);
    if (!placement || !glyph) return;
    const desired = `${placement}|${B_COLOR}|plain`;
    if (glyph.dataset.templateKey === desired && glyph.firstElementChild) return;
    const clone = await templates.clone(placement,B_COLOR);
    if (clone && row.isConnected) {
      glyph.dataset.templateKey = desired;
      glyph.replaceChildren(clone);
    }
  }

  function comparisonActive() {
    const html = document.documentElement;
    const a = document.getElementById('skyFoundationA');
    const b = document.getElementById('skyFoundationB');
    if (!a || !b) return false;
    if (html.dataset.skyBPresent !== 'true') return false;
    if (a.hidden || b.hidden) return false;
    return html.dataset.skyRelationshipMode !== 'B-B';
  }

  function bSignature(payload,list) {
    const harmonic = window.RelphiHarmonicOrb;
    return JSON.stringify({
      active:comparisonActive(),
      window:Number(harmonic?.maxWindow) || 12,
      aspects:(harmonic?.aspects || []).map(aspect => [aspect.id,aspect.angle,aspect.orb]),
      placements:list.map(record => [record.id,Number(record.value.toFixed(8)),record.house]),
      savedAt:payload?.savedAt || ''
    });
  }

  function normalizeBRow(row) {
    row.dataset.relationshipMode = 'B-B';
    row.dataset.relationScope = 'intra-b';
    row.dataset.leftSky = 'B';
    row.dataset.rightSky = 'B';
  }

  function whereWhenEditing() {
    return document.documentElement.dataset.skyWhereWhenEditing === 'true';
  }

  function ensureIntraskyB() {
    if (whereWhenEditing()) return;
    const listMount = document.getElementById('skyFoundationRelationshipList');
    if (!listMount || !window.RelphiHarmonicOrb) return;

    if (!comparisonActive()) {
      listMount.querySelectorAll(':scope>.sky-intrasky-b-generated').forEach(row => row.remove());
      intraBSignature = '';
      intraBRendered = false;
      intraBCount = 0;
      return;
    }

    const payload = readB();
    if (!payload) return;
    const list = prepareB(payload);
    const signature = bSignature(payload,list);
    const existingRows = [...listMount.querySelectorAll(':scope>.sky-intrasky-b-generated')];
    existingRows.forEach(normalizeBRow);
    const existing = existingRows.length;
    if (intraBRendered && signature === intraBSignature && existing === intraBCount) return;

    listMount.querySelectorAll(':scope>.sky-intrasky-b-generated').forEach(row => row.remove());
    const relations = relationshipsB(list);
    relations.forEach((relation,index) => listMount.appendChild(makeBRow(relation,index)));
    listMount.querySelectorAll(':scope>.sky-intrasky-b-generated').forEach(row => {
      void repairBGlyph(row,'left');
      void repairBGlyph(row,'right');
    });

    intraBSignature = signature;
    intraBRendered = true;
    intraBCount = relations.length;
    const currentA = document.querySelectorAll('#skyFoundationRelationshipList>.sky-intrasky-generated:not(.sky-intrasky-b-generated)').length;
    document.documentElement.dataset.skyIntraskyRelationships = `A:${currentA};B:${relations.length}`;
    window.dispatchEvent(new CustomEvent('relphi:sky-intrasky-b-relationships-ready', {
      detail:{B:relations.length,total:currentA+relations.length}
    }));
  }

  function isOpen(owner) {
    return owner?.classList.contains('is-open');
  }

  function positionPortal() {
    const owner = portalOwner;
    const menu = popover();
    const head = owner?.querySelector('.sky-chart-aspect-filter-head');
    if (!isOpen(owner) || !menu?.classList.contains('is-portaled') || !head) return;
    const rect = head.getBoundingClientRect();
    const margin = 12;
    const width = Math.min(270, Math.max(240, window.innerWidth - margin * 2));
    const left = Math.min(window.innerWidth - width - margin, Math.max(margin, rect.left + rect.width / 2 - width / 2));
    const roomBelow = window.innerHeight - rect.bottom - margin;
    const roomAbove = rect.top - margin;
    const maxHeight = Math.max(220, Math.min(520, Math.max(roomBelow, roomAbove)));
    const placeAbove = roomBelow < 260 && roomAbove > roomBelow;
    const top = placeAbove ? Math.max(margin, rect.top - maxHeight - 6) : Math.min(window.innerHeight - maxHeight - margin, rect.bottom + 6);
    Object.assign(menu.style, {
      width:`${width}px`,
      maxHeight:`${maxHeight}px`,
      left:`${left}px`,
      top:`${Math.max(margin, top)}px`
    });
  }

  function open(owner) {
    const menu = owner.querySelector('.sky-chart-aspect-filter-popover') || popover();
    if (!menu) return;
    portalOwner = owner;
    owner.classList.add('is-open');
    menu.hidden = false;
    menu.classList.add('is-portaled');
    document.body.appendChild(menu);
    owner.querySelector('[data-aspect-filter-toggle]')?.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(positionPortal);
  }

  function close(owner) {
    const menu = popover();
    if (!menu || !owner) return;
    menu.hidden = true;
    menu.classList.remove('is-portaled');
    menu.removeAttribute('style');
    owner.appendChild(menu);
    owner.classList.remove('is-open');
    owner.querySelector('[data-aspect-filter-toggle]')?.setAttribute('aria-expanded', 'false');
    portalOwner = null;
  }

  function createControl() {
    const root = document.createElement('div');
    root.className = 'sky-chart-aspect-filter sky-chart-filter-aspect';
    root.dataset.aspectFilter = 'combined';

    const head = document.createElement('div');
    head.className = 'sky-chart-aspect-filter-head';

    const title = document.createElement('span');
    title.className = 'sky-chart-aspect-filter-label';
    title.textContent = 'Aspects';

    const value = document.createElement('button');
    value.type = 'button';
    value.className = 'sky-chart-aspect-filter-value';
    value.dataset.aspectFilterValue = 'true';
    value.setAttribute('aria-label', 'Open aspect filters');
    value.setAttribute('aria-haspopup', 'dialog');
    value.setAttribute('aria-expanded', 'false');
    value.setAttribute('aria-controls', 'skyChartAspectPopover');
    const status = document.createElement('span');
    status.dataset.aspectFilterSummary = 'true';
    status.textContent = 'All';
    value.appendChild(status);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'sky-chart-aspect-filter-toggle';
    toggle.dataset.aspectFilterToggle = 'true';
    toggle.setAttribute('aria-label', 'Open aspect filters');
    toggle.setAttribute('aria-haspopup', 'dialog');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'skyChartAspectPopover');
    toggle.textContent = '⌄';

    const menu = document.createElement('div');
    menu.id = 'skyChartAspectPopover';
    menu.className = 'sky-chart-aspect-filter-popover';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-label', 'Aspect filters');
    menu.hidden = true;
    menu.innerHTML = '<div class="sky-chart-aspect-filter-body"></div>';

    head.append(title, value, toggle);
    root.append(head, menu);
    const toggleMenu = () => isOpen(root) ? close(root) : open(root);
    value.addEventListener('click', toggleMenu);
    toggle.addEventListener('click', toggleMenu);
    return root;
  }

  function ensureControl() {
    const bar = filterBar();
    if (!bar) return false;
    bar.querySelector('[data-filter="aspect"]')?.closest('label')?.remove();
    let owner = bar.querySelector('[data-aspect-filter="combined"]');
    if (!owner) owner = createControl();
    if (!owner.isConnected) {
      const orb = bar.querySelector('[data-filter="orb"]')?.closest('label');
      const placements = bar.querySelector('[data-placement-filter="combined"]');
      if (orb) orb.insertAdjacentElement('afterend', owner);
      else if (placements) placements.insertAdjacentElement('beforebegin', owner);
      else bar.prepend(owner);
    }
    bar.dataset.multiselectAspectFilters = 'true';
    if (!popover()?.querySelector('[data-aspect-list]')) renderControl();
    return true;
  }

  function refresh() {
    queued = false;
    if (whereWhenEditing()) return;
    ensureIntraskyB();
    if (!ensureControl()) return;
    applyFilters();
    positionPortal();
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(refresh);
  }

  function filterChanged(event) {
    const state = event.detail?.state || null;
    const hover = state?.mode === 'hover' || (!state && hoverFilterActive);
    hoverFilterActive = state?.mode === 'hover';
    if (!hover) schedule();
  }

  function closeOutside(event) {
    const owner = portalOwner;
    const menu = popover();
    if (!isOpen(owner)) return;
    if (owner.contains(event.target) || menu?.contains(event.target)) return;
    close(owner);
  }

  function invalidateIntraskyB() {
    intraBRendered = false;
    schedule();
  }

  function start() {
    installScopeStyles();
    const root = document.getElementById('skyFoundationRoot');
    if (root) new MutationObserver(records => {
      if (records.every(record => record.target?.closest?.('.sky-chart-aspect-filter'))) return;
      schedule();
    }).observe(root, { childList:true, subtree:true });

    [
      'relphi:sky-foundation-ready',
      'relphi:sky-foundation-interactions-ready',
      'relphi:sky-placement-multiselect-changed',
      'relphi:sky-house-multiselect-changed',
      'relphi:sky-single-sky-aspects-rendered',
      'relphi:sky-intrasky-relationships-ready',
      'relphi:sky-where-when-committed'
    ].forEach(name => window.addEventListener(name, schedule));
    window.addEventListener('relphi:sky-foundation-filter-changed', filterChanged);
    window.addEventListener('storage', event => {
      if (!event.key || event.key === B_KEY) invalidateIntraskyB();
    });
    new MutationObserver(invalidateIntraskyB).observe(document.documentElement, {
      attributes:true,
      attributeFilter:['data-sky-b-present','data-sky-last-mode','data-sky-relationship-mode']
    });

    document.addEventListener('change', handleChange);
    document.addEventListener('pointerdown', closeOutside, true);
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !isOpen(portalOwner)) return;
      const owner = portalOwner;
      close(owner);
      owner.querySelector('[data-aspect-filter-toggle]')?.focus();
    });
    window.addEventListener('resize', positionPortal);
    window.addEventListener('scroll', positionPortal, true);
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
