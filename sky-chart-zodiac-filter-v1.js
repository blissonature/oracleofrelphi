// Canonical Zodiac Signs filter for relationship rows.
// Wheel sign selection mirrors into this control without becoming a second filter layer.
(function(){
'use strict';
if(window.__relphiSkyZodiacFilterV3)return;
window.__relphiSkyZodiacFilterV3=true;
window.__relphiSkyZodiacFilterV2=true;

const SIGNS=[
  ['aries','Aries','Lamb'],
  ['taurus','Taurus','Bull'],
  ['gemini','Gemini','Twins'],
  ['cancer','Cancer','Crab'],
  ['leo','Leo','Lion'],
  ['virgo','Virgo','Maiden'],
  ['libra','Libra','Scales'],
  ['scorpio','Scorpio','Scorpion'],
  ['sagittarius','Sagittarius','Bow'],
  ['capricorn','Capricorn','Kid'],
  ['aquarius','Aquarius','Bucket'],
  ['pisces','Pisces','Fishes']
];
const COLORS=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
const ALL=SIGNS.map((_,index)=>String(index));
let selected=new Set(ALL),queued=false,wheelDriven=false,root=null,button=null,menu=null;

function canonicalGlyph(host,id,color){
  const registry=window.RelphiGlyphRegistry,component=window.RelphiGlyphComponent,entry=registry&&(registry.get(id)||registry.resolve(id));
  if(!entry||!component?.createBubble)return;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','-20 -20 40 40');svg.setAttribute('aria-hidden','true');host.appendChild(svg);
  const bubble=component.createBubble(svg,entry.id,{radius:15,padding:1,color});
  bubble.circle.style.opacity='0';bubble.circle.setAttribute('aria-hidden','true');
}

function summary(){
  if(selected.size===12)return'All';
  if(selected.size===0)return'None';
  if(selected.size===1){const index=Number(Array.from(selected)[0]);return SIGNS[index]?.[1]||'1 sign';}
  return `${selected.size} signs`;
}

function syncChecks(){
  if(!menu)return;
  menu.querySelectorAll('.sky-chart-zodiac-filter-row input[type="checkbox"]').forEach(input=>{input.checked=selected.has(input.value)});
  if(button)button.textContent=summary();
}

function clearAppliedSignFilter(){
  document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]').forEach(row=>row.classList.remove('sky-chart-sign-filter-hidden'));
}
function apply(){
  queued=false;
  const all=selected.size===12;
  document.querySelectorAll('.sky-foundation-relationship-row[data-relation-index]').forEach(row=>{
    const match=all||selected.has(String(row.dataset.leftSign))||selected.has(String(row.dataset.rightSign));
    // A wheel sign already owns relationship isolation. The dropdown mirrors that state
    // for visibility, but must not feed the same sign back as a second filtering layer.
    row.classList.toggle('sky-chart-sign-filter-hidden',wheelDriven?false:!match);
  });
  syncChecks();
  document.documentElement.dataset.skyZodiacFilterSource=wheelDriven?'wheel':'manual';
  window.dispatchEvent(new CustomEvent('relphi:sky-zodiac-filter-changed',{detail:{signs:Array.from(selected,Number),source:wheelDriven?'wheel':'manual'}}));
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(apply)}

function releaseWheelIsolationForManualFilter(){
  wheelDriven=false;
  const clear=document.getElementById('skyFoundationClearIsolation');
  if(clear&&!clear.hidden)clear.click();
}

function setSelection(values,{source='manual'}={}){
  if(source==='manual')releaseWheelIsolationForManualFilter();
  selected=new Set(Array.from(values,value=>String(value)).filter(value=>ALL.includes(value)));
  syncChecks();schedule();
}

function closeMenu(){
  if(!menu||menu.hidden)return;
  menu.hidden=true;
  button?.setAttribute('aria-expanded','false');
}

function positionMenu(){
  if(!menu||menu.hidden||!button)return;
  const rect=button.getBoundingClientRect(),margin=12,gap=5;
  const width=Math.max(220,Math.min(330,window.innerWidth-margin*2));
  const left=Math.max(margin,Math.min(rect.left,window.innerWidth-width-margin));
  menu.style.width=`${width}px`;

  // Let the menu use its natural height whenever the viewport can hold it. Only turn
  // on scrolling when the full sign list genuinely cannot fit on screen.
  menu.style.height='auto';
  menu.style.maxHeight='none';
  menu.style.overflowY='hidden';
  const style=getComputedStyle(menu);
  const borderHeight=(parseFloat(style.borderTopWidth)||0)+(parseFloat(style.borderBottomWidth)||0);
  const naturalHeight=Math.ceil(menu.scrollHeight+borderHeight);
  const availableHeight=Math.max(180,window.innerHeight-margin*2);
  const needsScroll=naturalHeight>availableHeight;
  const renderedHeight=needsScroll?availableHeight:naturalHeight;

  if(needsScroll){
    menu.style.height=`${availableHeight}px`;
    menu.style.maxHeight=`${availableHeight}px`;
    menu.style.overflowY='auto';
  }else{
    menu.style.height='auto';
    menu.style.maxHeight='none';
    menu.style.overflowY='hidden';
  }

  const belowTop=rect.bottom+gap;
  const aboveTop=rect.top-renderedHeight-gap;
  let top;
  if(belowTop+renderedHeight<=window.innerHeight-margin)top=belowTop;
  else if(aboveTop>=margin)top=aboveTop;
  else top=Math.min(Math.max(margin,rect.top-renderedHeight/2),Math.max(margin,window.innerHeight-renderedHeight-margin));

  menu.style.left=`${left}px`;
  menu.style.top=`${top}px`;
  menu.style.bottom='auto';
  menu.dataset.openDirection=top<rect.top?'above':'below';
}

function openMenu(){
  if(!menu)return;
  menu.hidden=false;button?.setAttribute('aria-expanded','true');positionMenu();
}

function toggleMenu(){menu?.hidden?openMenu():closeMenu()}

function install(){
  const bar=(document.querySelector('#skyFoundationFocus .sky-chart-filter-bar')||document.querySelector('#skyFoundationRelationships .sky-chart-filter-bar'));
  if(!bar)return;
  const existing=bar.querySelector('[data-zodiac-filter]');
  if(existing){root=existing;button=root.querySelector('[data-zodiac-summary]');return;}

  root=document.createElement('div');root.className='sky-chart-zodiac-filter';root.dataset.zodiacFilter='true';
  const label=document.createElement('span');label.className='sky-chart-zodiac-filter-label';label.textContent='Zodiac Signs';
  button=document.createElement('button');button.type='button';button.className='sky-chart-zodiac-filter-toggle';button.dataset.zodiacSummary='true';button.textContent='All';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','skyChartZodiacFilterMenu');

  menu=document.createElement('div');menu.id='skyChartZodiacFilterMenu';menu.className='sky-chart-zodiac-filter-menu';menu.hidden=true;menu.setAttribute('role','dialog');menu.setAttribute('aria-label','Zodiac Signs filters');
  const list=document.createElement('div');list.className='sky-chart-zodiac-filter-list';
  const header=document.createElement('div');header.className='sky-chart-zodiac-filter-header';
  const hName=document.createElement('strong');hName.textContent='ZODIAC SIGN';
  const actions=document.createElement('span');actions.className='sky-chart-zodiac-filter-actions';
  const allButton=document.createElement('button');allButton.type='button';allButton.textContent='All';allButton.dataset.zodiacAll='true';
  const noneButton=document.createElement('button');noneButton.type='button';noneButton.textContent='None';noneButton.dataset.zodiacNone='true';
  actions.append(allButton,noneButton);header.append(hName,actions);list.appendChild(header);

  SIGNS.forEach(([id,name,figure],index)=>{
    const row=document.createElement('label');row.className='sky-chart-zodiac-filter-row';row.dataset.signListItem=id;
    const nameCell=document.createElement('span');nameCell.className='sky-chart-zodiac-filter-name';
    const art=document.createElement('span');art.className='sky-chart-zodiac-filter-glyph';canonicalGlyph(art,id,COLORS[index]);
    const copy=document.createElement('span');copy.className='sky-chart-zodiac-filter-copy';
    const text=document.createElement('span');text.className='sky-chart-sign-list-label';text.textContent=name;
    const figureText=document.createElement('span');figureText.className='sky-chart-sign-list-figure';figureText.textContent=figure;
    copy.append(text,figureText);nameCell.append(art,copy);
    const checkCell=document.createElement('span');checkCell.className='sky-chart-zodiac-filter-check';
    const input=document.createElement('input');input.type='checkbox';input.checked=true;input.value=String(index);input.setAttribute('aria-label',`${name}, ${figure}`);checkCell.appendChild(input);
    row.append(nameCell,checkCell);list.appendChild(row);
    input.addEventListener('change',()=>{
      releaseWheelIsolationForManualFilter();
      input.checked?selected.add(input.value):selected.delete(input.value);
      schedule();
    });
  });

  menu.appendChild(list);document.body.appendChild(menu);
  button.addEventListener('click',toggleMenu);
  allButton.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();setSelection(ALL)});
  noneButton.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();setSelection([])});
  root.append(label,button);
  const placements=bar.querySelector('[data-placement-filter="combined"]');placements?placements.insertAdjacentElement('afterend',root):bar.appendChild(root);

  document.addEventListener('pointerdown',event=>{if(!root?.contains(event.target)&&!menu?.contains(event.target))closeMenu()},true);
  window.addEventListener('resize',positionMenu,{passive:true});
  window.addEventListener('scroll',positionMenu,{passive:true,capture:true});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()});
  syncChecks();
}

// A wheel sign replaces the previous sign selection. Remove any sign-filter class
// before the foundation click handler computes the new wheel relationship set, so
// Scorpio → Libra → Scorpio cannot collapse into Scorpio ∩ Libra.
document.addEventListener('pointerdown',event=>{
  const sector=event.target.closest?.('#skyFoundationWheelMount [data-interactive="sign"]');
  if(!sector)return;
  clearAppliedSignFilter();
},true);

// A click on a wheel sign already locks the foundation isolation. Mirror that exact
// selection into the Sign control after the interaction controller has updated the DOM.
document.addEventListener('click',event=>{
  const sector=event.target.closest?.('#skyFoundationWheelMount [data-interactive="sign"]');
  if(!sector)return;
  queueMicrotask(()=>{
    const sign=String(sector.dataset.sign??'');
    if(!ALL.includes(sign))return;
    if(sector.classList.contains('is-selected')){
      wheelDriven=true;selected=new Set([sign]);syncChecks();schedule();
    }else if(wheelDriven){
      wheelDriven=false;selected=new Set(ALL);syncChecks();schedule();
    }
  });
});

// Clearing a wheel-driven isolation should restore the dropdown to All. Manual Sign
// filter edits set wheelDriven false before clearing, so they are not overwritten here.
window.addEventListener('relphi:sky-foundation-filter-changed',event=>{
  if(wheelDriven&&!event.detail?.state){wheelDriven=false;selected=new Set(ALL);syncChecks();schedule();}
});

function start(){
  install();schedule();
  ['relphi:sky-foundation-interactions-ready','relphi:sky-foundation-ready','relphi:sky-placement-multiselect-changed','relphi:sky-aspect-multiselect-changed'].forEach(name=>window.addEventListener(name,()=>{install();schedule()}));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();