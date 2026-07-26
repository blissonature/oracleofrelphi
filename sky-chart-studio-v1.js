// Integrated visual Sky Studio for placement recognition, editing, and calculation.
(function () {
  'use strict';
  if (!/(^|\/)sky-chart\.html$/.test(location.pathname)) return;

  const ORDER = [
    ['Sun',['Sun'],'sun'],['Moon',['Moon'],'moon'],['Rising',['Rising','Ascendant','ASC','AC'],'asc'],
    ['Mercury',['Mercury'],'mercury'],['Venus',['Venus'],'venus'],['Mars',['Mars'],'mars'],
    ['Jupiter',['Jupiter'],'jupiter'],['Saturn',['Saturn'],'saturn'],['Uranus',['Uranus'],'uranus'],
    ['Neptune',['Neptune'],'neptune'],['Pluto',['Pluto'],'pluto'],['Chiron',['Chiron'],'chiron'],
    ['North Node',['North Node','Node','Mean North Node'],'north-node'],['South Node',['South Node'],'south-node'],
    ['Lilith',['Lilith','Black Moon Lilith','BML'],'lilith'],['Vertex',['Vertex','Vx'],'vertex'],
    ['Part of Fortune',['Part of Fortune','Fortune','POF'],'part-of-fortune'],
    ['Descendant',['Dsc','DSC','Descendant'],'dsc'],['Midheaven',['MC','Midheaven'],'mc'],['Imum Coeli',['IC','Imum Coeli'],'ic']
  ];
  const SLOT = { chart:'relphiSkyChartA', currentSky:'relphiSkyChartB' };
  const COLOR = {
    Sun:'#e9a51a', Moon:'#bfc6d2', Mercury:'#8b8b8b', Venus:'#d9a83d', Mars:'#c5522d',
    Jupiter:'#a87654', Saturn:'#9d8156', Uranus:'#79a8b7', Neptune:'#667dc8', Pluto:'#7b566d',
    Chiron:'#8e765e', 'North Node':'#70a89d', 'South Node':'#8f8174', Lilith:'#3c3540', Vertex:'#786e89',
    'Part of Fortune':'#d2a431', Rising:'#d84b43', Descendant:'#d84b43', Midheaven:'#d84b43', 'Imum Coeli':'#d84b43'
  };
  const MEANING = {
    Sun:'identity and vitality', Moon:'feeling and instinct', Rising:'the way this sky enters the world',
    Mercury:'thought and communication', Venus:'value, attraction, and relating', Mars:'drive and action',
    Jupiter:'growth and meaning', Saturn:'structure and responsibility', Uranus:'freedom and disruption',
    Neptune:'imagination and surrender', Pluto:'power and transformation', Chiron:'wounding and healing intelligence',
    'North Node':'direction of development', 'South Node':'familiar pattern and release', Lilith:'untamed instinct and refusal',
    Vertex:'consequential encounter', 'Part of Fortune':'circumstance supporting flourishing', Descendant:'the relational field',
    Midheaven:'public direction and vocation', 'Imum Coeli':'roots and private foundation'
  };

  let queued = false;
  function byId(id){ return document.getElementById(id); }
  function read(key){ try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } }
  function mapOf(payload){ const map = payload && (payload.placements || payload); return map && typeof map === 'object' && !Array.isArray(map) ? map : {}; }
  function placement(map, aliases){ const wanted = aliases.map(v => v.toLowerCase()); const key = Object.keys(map).find(k => wanted.includes(String(k).trim().toLowerCase())); return key ? map[key] : null; }
  function activeStorageKey(){ const target = byId('skyCreatorTarget')?.value || byId('skyCalcTarget')?.value || 'chart'; return SLOT[target] || SLOT.chart; }
  function coordinate(item){
    if (!item) return 'Not set';
    const sign = String(item.sign || '').trim();
    const degree = item.degree == null || item.degree === '' ? '' : Number(item.degree) + '°';
    const minute = item.minute == null || item.minute === '' ? '' : String(Number(item.minute)).padStart(2,'0') + '′';
    return [sign, degree + minute].filter(Boolean).join(' ');
  }
  function house(item){ return item && item.house ? 'House ' + item.house : 'House not set'; }
  function registryEntry(id){ try { return window.RelphiGlyphRegistry && window.RelphiGlyphRegistry.resolve(id); } catch (_) { return null; } }
  function canonicalImage(id, label){
    const entry = registryEntry(id);
    if (!entry || !entry.asset) return '<span class="relphi-studio-glyph-missing" aria-label="' + label + ' glyph unavailable"></span>';
    return '<img src="' + entry.asset + '" alt="" aria-hidden="true">';
  }
  function orb(label, aliases, glyphId, item, index){
    const details = coordinate(item);
    const retro = item && item.retrograde ? ' · retrograde' : '';
    const color = COLOR[label] || '#8a817a';
    return '<button type="button" class="relphi-studio-orb" data-reveal="glyph" data-placement="' + label + '" style="--orb-color:' + color + ';--orb-delay:' + (index * 28) + 'ms" aria-label="Reveal ' + label + '">' +
      '<span class="relphi-studio-orb-face"><span class="relphi-studio-orb-art">' + canonicalImage(glyphId,label) + '</span><span class="relphi-studio-orb-coordinate">' + details + '</span></span>' +
      '<span class="relphi-studio-orb-name" hidden>' + label + '</span>' +
      '<span class="relphi-studio-orb-detail" hidden>' + house(item) + retro + ' · ' + (MEANING[label] || 'astrological placement') + '</span>' +
    '</button>';
  }
  function renderOrbs(host){
    const payload = read(activeStorageKey());
    const map = mapOf(payload);
    host.innerHTML = ORDER.map(function(entry,index){ return orb(entry[0],entry[1],entry[2],placement(map,entry[1]),index); }).join('');
  }
  function installOrbInteraction(root){
    if (root.dataset.relphiOrbInteraction) return;
    root.dataset.relphiOrbInteraction = 'true';
    root.addEventListener('click', function(event){
      const orb = event.target.closest('.relphi-studio-orb');
      if (!orb) return;
      const name = orb.querySelector('.relphi-studio-orb-name');
      const detail = orb.querySelector('.relphi-studio-orb-detail');
      const level = orb.dataset.reveal || 'glyph';
      if (level === 'glyph') { name.hidden = false; detail.hidden = true; orb.dataset.reveal = 'name'; orb.setAttribute('aria-label','Reveal details for ' + orb.dataset.placement); }
      else if (level === 'name') { name.hidden = false; detail.hidden = false; orb.dataset.reveal = 'detail'; orb.setAttribute('aria-label','Collapse ' + orb.dataset.placement); }
      else { name.hidden = true; detail.hidden = true; orb.dataset.reveal = 'glyph'; orb.setAttribute('aria-label','Reveal ' + orb.dataset.placement); }
    });
  }
  function hideObsoleteCalculatorActions(calculator){
    calculator.querySelectorAll('button,label').forEach(function(node){
      const value = String(node.textContent || '').replace(/\s+/g,' ').trim();
      if (/^(Use Planetary Hours settings|Use editing sky metadata|Infer date\/place from placements|Attach to sky)$/i.test(value)) {
        const wrapper = node.closest('label,button') || node;
        wrapper.hidden = true;
        wrapper.setAttribute('aria-hidden','true');
      }
    });
  }
  function createStudio(card){
    if (card.querySelector('.relphi-sky-studio')) return;
    const studio = document.createElement('section');
    studio.className = 'relphi-sky-studio';
    studio.innerHTML = '<header class="relphi-studio-header"><div><span class="eyebrow">Sky Studio</span><h2>Build and recognize this sky</h2><p>Begin with the glyphs. Select an orb to reveal its name, then its placement and meaning.</p></div></header>' +
      '<div class="relphi-studio-orbs" aria-label="Sky placements"></div>' +
      '<section class="relphi-studio-when-where"><div class="relphi-studio-section-heading"><span class="eyebrow">When + Where</span><h3>Calculate or recalculate this sky</h3></div><div class="relphi-studio-calc-mount"></div></section>' +
      '<details class="relphi-studio-utility"><summary>Import or manually edit placements</summary><div class="relphi-studio-utility-mount"></div></details>';
    const title = card.querySelector('h2');
    (title ? title.parentElement : card).insertAdjacentElement('afterend', studio);

    const orbs = studio.querySelector('.relphi-studio-orbs');
    renderOrbs(orbs);
    installOrbInteraction(orbs);

    const editor = card.querySelector('.sky-creator-side-by-side') || document.querySelector('.sky-creator-side-by-side');
    const utilityMount = studio.querySelector('.relphi-studio-utility-mount');
    if (editor && utilityMount) { utilityMount.appendChild(editor); editor.hidden = false; }

    const calculator = document.querySelector('.sky-calc-drawer');
    const calcMount = studio.querySelector('.relphi-studio-calc-mount');
    if (calculator && calcMount) {
      calcMount.appendChild(calculator);
      calculator.hidden = false;
      calculator.open = true;
      calculator.setAttribute('open','');
      hideObsoleteCalculatorActions(calculator);
      const summary = calculator.querySelector('summary'); if (summary) summary.hidden = true;
    }
  }
  function refresh(){
    queued = false;
    document.querySelectorAll('.relphi-v4-placement-card').forEach(createStudio);
    document.querySelectorAll('.relphi-studio-orbs').forEach(renderOrbs);
    document.querySelectorAll('.relphi-studio-orbs').forEach(installOrbInteraction);
    document.querySelectorAll('.relphi-studio-calc-mount .sky-calc-drawer').forEach(hideObsoleteCalculatorActions);
  }
  function queue(){ if (queued) return; queued = true; requestAnimationFrame(refresh); }
  function styles(){
    if (byId('relphiSkyStudioStyles')) return;
    const style = document.createElement('style');
    style.id = 'relphiSkyStudioStyles';
    style.textContent = [
      '.relphi-v4-placement-card>p,.relphi-v4-placement-card>label,.relphi-v4-placement-card>.relphi-v4-placement-mount{display:none!important}',
      '.relphi-sky-studio{display:grid;gap:1.25rem;margin-top:1.25rem}',
      '.relphi-studio-header{display:flex;justify-content:space-between;gap:1rem;align-items:end}',
      '.relphi-studio-header h2,.relphi-studio-section-heading h3{margin:.2rem 0}',
      '.relphi-studio-header p{margin:.25rem 0;color:#6b625d;max-width:58rem}',
      '.relphi-studio-orbs{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:.85rem}',
      '.relphi-studio-orb{position:relative;display:grid!important;place-items:center!important;align-content:center!important;gap:.42rem!important;aspect-ratio:1!important;min-height:0!important;padding:.8rem!important;border-radius:50%!important;border:2px solid color-mix(in srgb,var(--orb-color) 58%,#d8d0c8)!important;background:radial-gradient(circle at 34% 28%,#fff 0 15%,color-mix(in srgb,var(--orb-color) 17%,#fff) 55%,color-mix(in srgb,var(--orb-color) 30%,#fff) 100%)!important;box-shadow:inset 0 0 0 5px rgba(255,255,255,.62),0 10px 22px rgba(50,35,27,.08)!important;color:#171311!important;overflow:visible!important;animation:relphiStudioEnter .42s both;animation-delay:var(--orb-delay)}',
      '.relphi-studio-orb-face{display:grid;place-items:center;gap:.35rem;min-width:0}',
      '.relphi-studio-orb-art{display:grid;place-items:center;width:3.15rem;height:3.15rem}',
      '.relphi-studio-orb-art img{display:block;width:100%;height:100%;object-fit:contain}',
      '.relphi-studio-glyph-missing{display:block;width:1.2rem;height:1.2rem;border:2px dotted currentColor;border-radius:50%;opacity:.45}',
      '.relphi-studio-orb-coordinate{font-size:.78rem;font-weight:850;line-height:1.1;text-align:center;max-width:7rem}',
      '.relphi-studio-orb-name{font-size:.82rem;font-weight:900;line-height:1;text-align:center}',
      '.relphi-studio-orb-detail{position:absolute;z-index:4;left:50%;top:calc(100% + .45rem);transform:translateX(-50%);width:min(15rem,82vw);padding:.7rem .8rem;border:1px solid color-mix(in srgb,var(--orb-color) 42%,#ddd);border-radius:14px;background:#fffaf4;box-shadow:0 14px 30px rgba(30,20,14,.16);font-size:.75rem;font-weight:650;line-height:1.35;text-align:left}',
      '.relphi-studio-when-where{display:grid;gap:.85rem;padding:1.15rem;border:1px solid #e2d9d0;border-radius:24px;background:#fff}',
      '.relphi-studio-calc-mount .sky-calc-drawer{display:block!important;margin:0!important;border:0!important;box-shadow:none!important;background:transparent!important;padding:0!important}',
      '.relphi-studio-calc-mount .sky-calc-drawer>summary{display:none!important}',
      '.relphi-studio-calc-mount [data-relphi-deprecated-target="true"]{display:none!important}',
      '.relphi-studio-utility{border:1px solid #e2d9d0;border-radius:20px;background:#fff;overflow:hidden}',
      '.relphi-studio-utility>summary{cursor:pointer;padding:1rem 1.15rem;font-weight:850}',
      '.relphi-studio-utility-mount{padding:0 1rem 1rem}',
      '.relphi-studio-utility .sky-creator-side-by-side{grid-template-columns:1fr!important;gap:1rem!important}',
      '.relphi-studio-utility .sky-paste-panel,.relphi-studio-utility .placement-entry-drawer{border-radius:18px!important}',
      '@keyframes relphiStudioEnter{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}',
      '@media(prefers-reduced-motion:reduce){.relphi-studio-orb{animation:none!important}}',
      '@media(max-width:620px){.relphi-studio-orbs{grid-template-columns:repeat(3,minmax(0,1fr));gap:.55rem}.relphi-studio-orb{padding:.5rem!important}.relphi-studio-orb-art{width:2.45rem;height:2.45rem}.relphi-studio-orb-coordinate{font-size:.66rem}.relphi-studio-orb-name{font-size:.7rem}}'
    ].join('');
    document.head.appendChild(style);
  }
  function start(){ styles(); refresh(); new MutationObserver(queue).observe(document.body,{childList:true,subtree:true}); window.addEventListener('storage',queue); document.addEventListener('relphi:extra-points-updated',queue); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();