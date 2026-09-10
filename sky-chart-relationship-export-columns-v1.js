// Rich Relationships PNG export v4: compact, readable relationship sheets.
(function(){
'use strict';
if(window.__relphiRelationshipExportColumnsV4)return;
window.__relphiRelationshipExportColumnsV4=true;
window.__relphiRelationshipExportColumnsV3=true;
window.__relphiRelationshipExportColumnsV2=true;
window.__relphiRelationshipExportColumnsV1=true;

const ID='skyChartRelationshipsExport';
const ROWS=16;
const W=500;
const GAP=8;
const PAD=12;
const LIB='https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js';
const KEYS={A:'relphiSkyChartA',B:'relphiSkyChartB'};
const COLORS={A:'#c9211e',B:'#2462d0'};
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_MEAN=[
  'initiative, directness, courage, impulse, and beginning',
  'embodiment, value, pleasure, endurance, and material continuity',
  'language, exchange, curiosity, movement, and multiplicity',
  'care, protection, memory, belonging, and attachment',
  'radiance, creativity, pride, loyalty, and recognition',
  'discernment, service, refinement, repair, and usefulness',
  'relationship, balance, fairness, dialogue, and mutual recognition',
  'intensity, secrecy, survival, bonding, and emotional truth',
  'meaning, faith, exploration, philosophy, and freedom',
  'structure, responsibility, endurance, mastery, and worldly form',
  'systems, reform, collective intelligence, detachment, and future orientation',
  'surrender, imagination, compassion, permeability, and release'
];
const PLACEMENT_MEAN={
  sun:'identity, vitality, and conscious purpose',
  moon:'feelings, instincts, memory, and emotional needs',
  mercury:'thought, perception, language, and communication',
  venus:'values, attraction, affection, pleasure, and relating',
  mars:'drive, assertion, desire, conflict, and action',
  jupiter:'growth, confidence, meaning, opportunity, and expansion',
  saturn:'structure, limits, responsibility, time, and commitment',
  uranus:'freedom, disruption, originality, awakening, and change',
  neptune:'imagination, sensitivity, surrender, ideals, and vision',
  pluto:'power, depth, compulsion, elimination, and transformation',
  chiron:'wounding, healing intelligence, and the capacity to guide healing',
  asc:'the way a person enters life and is immediately perceived',
  dsc:'the way a person meets partners and encounters the other',
  mc:'public direction, vocation, visibility, and the role a person grows toward',
  ic:'roots, home, private foundations, and inherited belonging',
  'north-node':'growth through unfamiliar experience and developing capacity',
  'south-node':'familiar patterns, inherited capacity, and the known path',
  lilith:'instinctive autonomy, refusal, exile, and uncompromised desire',
  'part-of-fortune':'the meeting place of body, feeling, circumstance, and ease',
  vertex:'encounters that feel consequential or outside ordinary control'
};
const HOUSE_NAMES=['','First House','Second House','Third House','Fourth House','Fifth House','Sixth House','Seventh House','Eighth House','Ninth House','Tenth House','Eleventh House','Twelfth House'];
const HOUSE_MEAN=[
  '',
  'self, embodiment, appearance, approach, and the immediate way life is entered',
  'resources, possessions, money, personal values, and what is held as one’s own',
  'communication, learning, siblings, neighbors, short journeys, and the local environment',
  'home, roots, family, ancestry, privacy, and the foundations of life',
  'creativity, pleasure, romance, children, play, and personal self-expression',
  'work, service, routines, health practices, maintenance, and practical obligations',
  'partnership, contracts, one-to-one relationship, and encounters with the other',
  'shared resources, intimacy, debt, inheritance, vulnerability, and transformation',
  'worldview, religion, philosophy, higher learning, long journeys, and the search for meaning',
  'vocation, public standing, reputation, authority, achievement, and visible responsibility',
  'friends, networks, groups, alliances, hopes, and participation in a larger collective',
  'retreat, hidden processes, solitude, confinement, surrender, spirituality, and closure'
];
const ASPECT_NAME={conjunction:'Conjunction','semi-sextile':'Semi-Sextile',octile:'Octile',sextile:'Sextile',quintile:'Quintile',square:'Square',trine:'Trine','tri-octile':'Tri-Octile','bi-quintile':'Bi-Quintile',quincunx:'Quincunx',opposition:'Opposition'};
const ASPECT_MEAN={conjunction:'the two functions operate together','semi-sextile':'neighboring functions accommodate one another',octile:'focused friction and adjustment',sextile:'a cooperative opening activated through participation',quintile:'creative pattern-making and specialized skill',square:'activating pressure and development',trine:'low-resistance exchange','tri-octile':'accumulated friction and redirection','bi-quintile':'refined creative pattern-making',quincunx:'continuing adjustment and translation',opposition:'awareness through polarity, contrast, and exchange'};
const ASPECT_COLOR={conjunction:'#e53935','semi-sextile':'#7c9b49',octile:'#b86d43',sextile:'#d3b727',quintile:'#8b6cc2',square:'#d6534d',trine:'#4e9e69','tri-octile':'#9f5944','bi-quintile':'#7655aa',quincunx:'#4b8e88',opposition:'#5961c8'};
const DECANS=[
  [['two_of_wands','Two of Wands'],['three_of_wands','Three of Wands'],['four_of_wands','Four of Wands']],
  [['five_of_pentacles','Five of Pentacles'],['six_of_pentacles','Six of Pentacles'],['seven_of_pentacles','Seven of Pentacles']],
  [['eight_of_swords','Eight of Swords'],['nine_of_swords','Nine of Swords'],['ten_of_swords','Ten of Swords']],
  [['two_of_cups','Two of Cups'],['three_of_cups','Three of Cups'],['four_of_cups','Four of Cups']],
  [['five_of_wands','Five of Wands'],['six_of_wands','Six of Wands'],['seven_of_wands','Seven of Wands']],
  [['eight_of_pentacles','Eight of Pentacles'],['nine_of_pentacles','Nine of Pentacles'],['ten_of_pentacles','Ten of Pentacles']],
  [['two_of_swords','Two of Swords'],['three_of_swords','Three of Swords'],['four_of_swords','Four of Swords']],
  [['five_of_cups','Five of Cups'],['six_of_cups','Six of Cups'],['seven_of_cups','Seven of Cups']],
  [['eight_of_wands','Eight of Wands'],['nine_of_wands','Nine of Wands'],['ten_of_wands','Ten of Wands']],
  [['two_of_pentacles','Two of Pentacles'],['three_of_pentacles','Three of Pentacles'],['four_of_pentacles','Four of Pentacles']],
  [['five_of_swords','Five of Swords'],['six_of_swords','Six of Swords'],['seven_of_swords','Seven of Swords']],
  [['eight_of_cups','Eight of Cups'],['nine_of_cups','Nine of Cups'],['ten_of_cups','Ten of Cups']]
];

let busy=false,pending=null,libPromise=null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const norm=v=>((Number(v)%360)+360)%360;
const read=s=>{try{return JSON.parse(localStorage.getItem(KEYS[s])||'null')}catch(_){return null}};
const status=t=>{const n=document.getElementById('skyChartExportStatus');if(n)n.textContent=t||''};

function name(s){
  const v=read(s);
  try{
    const n=window.RelphiSkyCardTitle?.nameFor?.(s,v);
    if(String(n||'').trim())return String(n).trim();
  }catch(_){}
  const m=v?.metadata||{};
  return m.savedSkyName||v?.name||v?.displayName||v?.skyName||v?.title||`Sky ${s}`;
}
function context(s){
  const p=read(s)?.calcProfile||{};
  let d=String(p.dateTime||'');
  try{
    const dt=window.luxon?.DateTime?.fromISO(d,{zone:String(p.timeZone||'UTC'),setZone:true});
    if(dt?.isValid)d=dt.toFormat('LLL d, yyyy · h:mm a');
  }catch(_){}
  return[String(p.location||''),d].filter(Boolean).join(' · ');
}
const safe=v=>String(v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48)||'sky';
const fileName=()=>`${safe(name('A'))}-vs-${safe(name('B'))}-relationships-${new Date().toISOString().slice(0,16).replace(/[-:T]/g,'')}.png`;

function slot(row,side){
  const explicit=String(row.dataset[side+'Sky']||'').toUpperCase();
  if(explicit==='A'||explicit==='B')return explicit;
  const mode=String(row.dataset.relationshipMode||'A-B').toUpperCase();
  return mode==='A-A'?'A':mode==='B-B'?'B':side==='left'?'A':'B';
}
function entries(s){
  const packet=read(s)||{};
  const points=[packet.placements,packet.positions,packet.points,packet.bodies].find(v=>v&&typeof v==='object')||packet;
  return Object.entries(points||{});
}
function lon(x){
  if(Number.isFinite(Number(x?.longitude)))return norm(x.longitude);
  const index=SIGNS.findIndex(s=>s.toLowerCase()===String(x?.sign||x?.zodiac||'').toLowerCase());
  return index<0?NaN:norm(index*30+Number(x?.degree||0)+Number(x?.minute||0)/60);
}
function pid(k,x){
  const registry=window.RelphiGlyphRegistry;
  for(const candidate of [x?.glyphId,x?.id,x?.name,x?.label,x?.body,x?.planet,x?.point,k]){
    if(!candidate)continue;
    const entry=registry?.resolve?.(candidate)||registry?.get?.(candidate);
    if(entry)return entry.id;
  }
  return String(x?.id||x?.name||k||'').toLowerCase().replace(/\s+/g,'-');
}
function rec(row,side){
  const sky=slot(row,side),id=String(row.dataset[side+'Placement']||'');
  for(const[k,x]of entries(sky)){
    const value=lon(x);
    if(pid(k,x)===id&&Number.isFinite(value))return{sky,id,value};
  }
  return null;
}
function relation(row){
  const a=rec(row,'left'),b=rec(row,'right');
  return a&&b?{a,b,aspect:String(row.dataset.aspect||''),orb:Number(row.dataset.sourceOrb||0)}:null;
}
function pos(r){
  const value=norm(r.value),sign=Math.floor(value/30),within=value-sign*30,degree=Math.floor(within);
  return{sign,degree,minute:Math.floor((within-degree)*60+1e-7)};
}
function card(r){
  const p=pos(r),[id,title]=DECANS[p.sign][Math.min(2,Math.floor(p.degree/10))];
  return{id,title,image:`assets/tarot/rws/${id}.webp?v=border-preserving-crop-352`};
}
function pt(v){
  const a=(norm(v)-180)*Math.PI/180;
  return{x:70+52*Math.cos(a),y:70+52*Math.sin(a)};
}
function visual(row){
  const r=relation(row);
  if(!r)return null;
  const ca=card(r.a),cb=card(r.b),a=pt(r.a.value),b=pt(r.b.value),c=ASPECT_COLOR[r.aspect]||'#777';
  const n=document.createElement('div');
  n.className='rex-visual';
  n.style.setProperty('--ac',c);
  n.innerHTML=`<div class="rex-card a"><small>Sky ${r.a.sky}</small><img src="${esc(ca.image)}" alt="${esc(ca.title)}"><b>${esc(ca.title)}</b></div><div class="rex-wheel"><svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="52"/><line x1="70" y1="70" x2="${a.x}" y2="${a.y}" style="stroke:${COLORS[r.a.sky]}"/><line x1="70" y1="70" x2="${b.x}" y2="${b.y}" style="stroke:${COLORS[r.b.sky]}"/><line class="asp" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" style="stroke:${c}"/><circle class="pa" cx="${a.x}" cy="${a.y}" r="6" style="fill:${COLORS[r.a.sky]}"/><circle class="pb" cx="${b.x}" cy="${b.y}" r="6" style="fill:${COLORS[r.b.sky]}"/></svg><strong>${Number.isFinite(r.orb)?r.orb.toFixed(2):'—'}°</strong></div><div class="rex-card b"><small>Sky ${r.b.sky}</small><img src="${esc(cb.image)}" alt="${esc(cb.title)}"><b>${esc(cb.title)}</b></div>`;
  return n;
}
function pname(id){
  return window.RelphiGlyphRegistry?.get?.(id)?.name||window.RelphiGlyphRegistry?.resolve?.(id)?.name||String(id).replace(/-/g,' ');
}
function coord(row,side){
  const s=row.querySelector(`.sky-foundation-relationship-placement--${side} small`);
  return String(s?.dataset?.relationshipCoordinate||s?.textContent||'').match(/\d{1,2}°\d{2}′/)?.[0]||'';
}
function timing(row){
  const x=window.RelphiRelationshipTransitMeta?.exportTimingForRow?.(row);
  const fmt=m=>new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric'}).format(new Date(m));
  if(x?.kind==='dynamic')return[
    `Start ${fmt(x.startMs)}`,
    `Exact ${x.exacts?.length?x.exacts.map(fmt).join(' · '):'near pass'}`,
    `End ${fmt(x.endMs)}`,
    `Passes ${x.passCount||0}${x.motion?' · '+x.motion:''}`
  ];
  const e=window.RelphiRelationshipTransitMeta?.estimatedTimingForRow?.(row);
  return e&&Number.isFinite(e.durationDays)?[`Duration ≈ ${Math.round(e.durationDays*10)/10} days`]:[];
}
function chip(title,sub,text,cls){
  const n=document.createElement('section');
  n.className='rex-chip '+cls;
  n.innerHTML=`<strong>${esc(title)}</strong>${sub?`<small>${esc(sub)}</small>`:''}${text?`<p>${esc(text)}</p>`:''}`;
  return n;
}
function concepts(row){
  const n=document.createElement('div');
  n.className='rex-concepts';
  const li=+row.dataset.leftSign,ri=+row.dataset.rightSign,lh=+row.dataset.leftHouse,rh=+row.dataset.rightHouse;
  const aspect=String(row.dataset.aspect||''),orb=Number(row.dataset.sourceOrb);
  const lp=String(row.dataset.leftPlacement||''),rp=String(row.dataset.rightPlacement||'');
  n.append(
    chip(pname(lp),coord(row,'left'),PLACEMENT_MEAN[lp]||'','a'),
    chip(SIGNS[li],'',SIGN_MEAN[li]||'','a'),
    chip(HOUSE_NAMES[lh]||'House','',HOUSE_MEAN[lh]||'','a'),
    chip(ASPECT_NAME[aspect]||aspect,Number.isFinite(orb)?orb.toFixed(2)+'°':'',ASPECT_MEAN[aspect]||'','asp'),
    chip(pname(rp),coord(row,'right'),PLACEMENT_MEAN[rp]||'','b'),
    chip(SIGNS[ri],'',SIGN_MEAN[ri]||'','b'),
    chip(HOUSE_NAMES[rh]||'House','',HOUSE_MEAN[rh]||'','b')
  );
  timing(row).forEach(text=>{
    const p=document.createElement('p');
    p.className='rex-time';
    p.textContent=text;
    n.children[3].appendChild(p);
  });
  return n;
}
function visibleRows(){
  return[...document.querySelectorAll('#skyFoundationRelationshipList>.sky-foundation-relationship-row')].filter(row=>{
    const s=getComputedStyle(row);
    return!row.hidden&&s.display!=='none'&&s.visibility!=='hidden';
  });
}
function summary(){
  const b=document.querySelector('#skyFoundationRelationships .sky-chart-filter-bar');
  if(!b)return'';
  const p=[],h=b.querySelector('[data-harmonic-window-input]');
  if(h?.value)p.push(`Harmonic window ${h.value}°`);
  for(const[q,label]of[['[data-placement-filter-summary]','Placements'],['[data-house-filter-summary]','Houses'],['[data-aspect-filter-summary]','Aspects']]){
    const text=(b.querySelector(q)?.textContent||'').replace(/\s+/g,' ').trim();
    if(text&&!/^all$/i.test(text))p.push(`${label}: ${text}`);
  }
  return p.join(' · ');
}
function install(){
  if(document.getElementById('rexStyle'))return;
  const s=document.createElement('style');
  s.id='rexStyle';
  s.textContent=`
    .rex-sheet{box-sizing:border-box;padding:${PAD}px;border:1px solid #ded9d2;border-radius:14px;background:#fffdf8;color:#191613;font-family:system-ui,sans-serif}
    .rex-title{display:grid;gap:3px;margin-bottom:8px}
    .rex-title h1{margin:0;font:900 20px/1.12 system-ui}
    .rex-title p{margin:0;color:#655d56;font:700 10px/1.25 system-ui}
    .rex-context{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px}
    .rex-context span{padding:6px 7px;border-radius:8px;background:#f4efe8;color:#554d47;font:750 9px/1.25 system-ui}
    .rex-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:17px;font-weight:900}
    .rex-head em{padding:4px 7px;border-radius:999px;background:#f0ebe4;font:800 10px/1 system-ui;font-style:normal}
    .rex-summary{margin-bottom:8px;padding:7px;border-radius:8px;background:#f6f0e8;text-align:center;font:750 9px/1.25 system-ui}
    .rex-cols{display:flex;align-items:flex-start;gap:${GAP}px}
    .rex-col{display:grid;gap:7px;width:${W}px;min-width:${W}px}
    .rex-row{box-sizing:border-box;width:${W}px!important;min-width:${W}px!important;max-width:${W}px!important;margin:0!important;height:auto!important;overflow:visible!important}
    .rex-concepts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) minmax(92px,1.12fr) repeat(3,minmax(0,1fr));gap:4px;padding:7px 6px 6px;border-top:1px solid rgba(31,27,24,.11);background:#fffdfa}
    .rex-chip{display:grid;align-content:start;gap:2px;min-width:0;padding:5px 4px;border-radius:8px;background:#f4efe8;border-top:3px solid #777;text-align:center}
    .rex-chip.a{border-color:${COLORS.A}}.rex-chip.b{border-color:${COLORS.B}}.rex-chip.asp{border-color:var(--relationship-stripe,#777)}
    .rex-chip strong{font:900 9px/1.08 system-ui;overflow-wrap:anywhere}
    .rex-chip small{color:#5e554d;font:850 7.5px/1.05 system-ui}
    .rex-chip p{margin:0;color:#5d554e;font:650 7.4px/1.18 system-ui;overflow-wrap:anywhere}
    .rex-chip .rex-time{color:#3e3934;font-weight:750}
    .rex-visual{display:grid;grid-template-columns:96px minmax(132px,1fr) 96px;align-items:center;justify-content:center;gap:12px;padding:8px 12px 9px;border-top:1px solid rgba(31,27,24,.11);background:linear-gradient(180deg,#fbf8f3,#f8f4ee)}
    .rex-card{display:grid;justify-items:center;gap:3px}
    .rex-card small{font:900 8px/1 system-ui;text-transform:uppercase}
    .rex-card.a{color:${COLORS.A}}.rex-card.b{color:${COLORS.B}}
    .rex-card img{display:block;width:68px;aspect-ratio:352/600;object-fit:cover;border:2px solid currentColor;border-radius:6px;background:#fff}
    .rex-card b{max-width:92px;color:#211d19;font:800 8px/1.08 system-ui;text-align:center}
    .rex-wheel{display:grid;justify-items:center;gap:2px;color:var(--ac)}
    .rex-wheel svg{width:132px;height:132px;overflow:visible}
    .rex-wheel svg>circle:first-child{fill:#fffdfa;stroke:rgba(45,39,34,.3);stroke-width:1.2}
    .rex-wheel line{stroke-width:1.5;opacity:.7}
    .rex-wheel .asp{stroke-width:4;stroke-linecap:round;opacity:1}
    .rex-wheel strong{font:900 9px/1 system-ui}
  `;
  document.head.appendChild(s);
}
function load(){
  if(window.htmlToImage?.toBlob)return Promise.resolve(window.htmlToImage);
  if(libPromise)return libPromise;
  libPromise=new Promise((ok,no)=>{
    let s=document.querySelector(`script[src="${LIB}"]`);
    if(!s){
      s=document.createElement('script');
      s.src=LIB;
      s.async=true;
      s.crossOrigin='anonymous';
      document.head.appendChild(s);
    }
    const ready=()=>window.htmlToImage?.toBlob?ok(window.htmlToImage):no(Error('PNG exporter unavailable.'));
    s.addEventListener('load',ready,{once:true});
    s.addEventListener('error',()=>no(Error('PNG exporter did not load.')),{once:true});
    if(window.htmlToImage?.toBlob)ok(window.htmlToImage);
  });
  return libPromise;
}
async function waitImgs(root){
  await Promise.all([...root.querySelectorAll('img')].map(i=>
    i.complete&&i.naturalWidth
      ? i.decode?.().catch(()=>{})||Promise.resolve()
      : new Promise(resolve=>{i.onload=i.onerror=resolve})
  ));
}
async function build(){
  install();
  const rows=visibleRows();
  if(!rows.length)throw Error('No relationships match the current filters.');
  const cols=Math.ceil(rows.length/ROWS);
  const width=PAD*2+cols*W+(cols-1)*GAP;
  const host=document.createElement('div'),sheet=document.createElement('div');
  Object.assign(host.style,{position:'fixed',left:'-100000px',top:'0',width:width+'px',background:'#fffdf8',zIndex:'-1'});
  document.body.appendChild(host);
  sheet.className='rex-sheet';
  sheet.style.width=width+'px';
  sheet.innerHTML=`<div class="rex-title"><h1>${esc(name('A'))} ↔ ${esc(name('B'))} — Relationships</h1><p>Complete relationship export · referents · timing · Tarot correspondences · isolated aspect geometry</p></div><div class="rex-context"><span><b>${esc(name('A'))}</b>${context('A')?' · '+esc(context('A')):''}</span><span><b>${esc(name('B'))}</b>${context('B')?' · '+esc(context('B')):''}</span></div><div class="rex-head"><strong>Relationships</strong><em>${esc(document.getElementById('skyFoundationRelationshipCount')?.textContent||rows.length)}</em></div>`;
  const filter=summary();
  if(filter){
    const n=document.createElement('div');
    n.className='rex-summary';
    n.textContent='Showing only: '+filter;
    sheet.appendChild(n);
  }
  const wrap=document.createElement('div');
  wrap.className='rex-cols';
  sheet.appendChild(wrap);
  host.appendChild(sheet);
  for(let c=0;c<cols;c++){
    const col=document.createElement('div');
    col.className='rex-col';
    wrap.appendChild(col);
    for(const row of rows.slice(c*ROWS,(c+1)*ROWS)){
      const clone=row.cloneNode(true);
      clone.classList.remove('is-inline-expanded','is-wheel-related','is-row-hovered');
      clone.classList.add('rex-row');
      clone.removeAttribute('aria-current');
      clone.querySelector(':scope>.inline-rel-detail')?.remove();
      clone.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
      clone.appendChild(concepts(row));
      const v=visual(row);
      if(v)clone.appendChild(v);
      col.appendChild(clone);
    }
  }
  await waitImgs(sheet);
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  return{host,sheet,width,height:Math.ceil(sheet.scrollHeight),count:rows.length,cols};
}
async function render(b){
  if(document.fonts?.ready)await document.fonts.ready.catch(()=>{});
  const h=await load();
  const ratio=b.count>24?1:1.1;
  const blob=await h.toBlob(b.sheet,{
    backgroundColor:'#fffdf8',
    width:b.width,
    height:b.height,
    pixelRatio:ratio,
    canvasWidth:Math.ceil(b.width*ratio),
    canvasHeight:Math.ceil(b.height*ratio),
    skipAutoScale:true
  });
  if(!blob)throw Error('PNG exporter returned no image.');
  return new File([blob],fileName(),{type:'image/png'});
}
function download(f){
  const u=URL.createObjectURL(f),a=document.createElement('a');
  a.href=u;
  a.download=f.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(u),30000);
}
async function run(button){
  if(busy)return;
  if((/iPad|iPhone|iPod/i.test(navigator.userAgent))&&pending){
    try{await navigator.share({files:[pending]})}catch(e){if(e?.name!=='AbortError')console.error(e)}
    return;
  }
  busy=true;
  button.disabled=true;
  status('Preparing compact Relationships PNG…');
  let built;
  try{
    built=await build();
    const file=await render(built);
    if(/iPad|iPhone|iPod/i.test(navigator.userAgent)){
      pending=file;
      status(`PNG ready — ${built.count} relationships in ${built.cols} columns. Tap again to share.`);
    }else{
      download(file);
      status(`PNG download started — ${built.count} relationships in ${built.cols} columns.`);
    }
  }catch(e){
    console.error(e);
    status('Export failed: '+(e.message||e));
  }finally{
    built?.host.remove();
    busy=false;
    button.disabled=false;
  }
}
document.addEventListener('click',e=>{
  const b=e.target.closest?.('#'+ID);
  if(!b)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  run(b);
},true);
[
  'relphi:sky-foundation-ready',
  'relphi:sky-orb-limit-changed',
  'relphi:sky-harmonic-window-visibility-changed',
  'relphi:sky-placement-multiselect-changed',
  'relphi:sky-house-multiselect-changed',
  'relphi:sky-aspect-multiselect-changed',
  'relphi:sky-zodiac-filter-changed',
  'relphi:sky-where-when-committed',
  'relphi:sky-name-updated'
].forEach(eventName=>window.addEventListener(eventName,()=>{pending=null}));
load().catch(()=>{});
})();
