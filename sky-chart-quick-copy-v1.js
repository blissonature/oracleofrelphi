// Quick-copy actions for individual Card Hits and each Sky's rendered Placements view.
// Clipboard text is derived from the rendered UI so copied values cannot diverge from display truth.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyQuickCopyV1)return;
  window.__relphiSkyQuickCopyV1=true;

  let queued=false;

  function installStyles(){
    if(document.getElementById('skyQuickCopyV1Styles'))return;
    const style=document.createElement('style');
    style.id='skyQuickCopyV1Styles';
    style.textContent=`
      .sky-quick-copy-button{appearance:none;border:1px solid rgba(31,27,24,.18);border-radius:999px;background:#fff;color:#241f1b;padding:.38rem .62rem;font:850 .62rem/1 system-ui,sans-serif;white-space:nowrap;cursor:pointer}
      .sky-quick-copy-button:hover,.sky-quick-copy-button:focus-visible{background:#f4efe8;border-color:rgba(31,27,24,.38);outline:none}
      .sky-quick-copy-button[data-copy-state="done"]{border-color:color-mix(in srgb,var(--slot-color,#555) 42%,rgba(31,27,24,.18));background:color-mix(in srgb,var(--slot-color,#555) 8%,#fff);color:var(--slot-color,#555)}
      .sky-card-hit-detail-copy .sky-card-hit-copy-one{justify-self:start;margin-top:.18rem}
      .sky-placement-copy-row{display:flex;justify-content:flex-end;align-items:center;padding:8px 10px 0;min-height:34px;box-sizing:border-box}
      .sky-where-when-placement-view>.sky-placement-copy-row+.sky-foundation-ledger{margin-top:0}
      @media(max-width:620px){.sky-quick-copy-button{padding:.36rem .56rem;font-size:.6rem}.sky-placement-copy-row{padding:7px 8px 0}}
    `;
    document.head.appendChild(style);
  }

  function slotFor(node){return node?.closest('#skyFoundationA')?'A':node?.closest('#skyFoundationB')?'B':''}
  function skyName(slot){
    const panel=document.getElementById(slot==='A'?'skyFoundationA':'skyFoundationB');
    const name=(panel?.querySelector('.sky-foundation-name')?.textContent||`Sky ${slot}`).replace(/\s+/g,' ').trim();
    return name||`Sky ${slot}`;
  }
  function clean(value){return String(value||'').replace(/\s+/g,' ').trim()}

  async function writeClipboard(text){
    if(!text)return;
    if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return}
    const area=document.createElement('textarea');
    area.value=text;area.setAttribute('readonly','');
    Object.assign(area.style,{position:'fixed',opacity:'0',pointerEvents:'none',left:'-9999px'});
    document.body.appendChild(area);area.select();
    const ok=document.execCommand('copy');area.remove();
    if(!ok)throw new Error('Copy command failed');
  }

  function copied(button,label='Copy'){
    if(!button)return;
    button.dataset.copyState='done';button.textContent='Copied';
    window.setTimeout(()=>{if(!button.isConnected)return;button.dataset.copyState='';button.textContent=label},1400);
  }
  function failed(button,label='Copy'){
    if(!button)return;
    button.textContent='Copy failed';
    window.setTimeout(()=>{if(button.isConnected)button.textContent=label},1600);
  }

  function placementMarkdown(view){
    const slot=slotFor(view),name=skyName(slot);
    const rows=[...view.querySelectorAll('.sky-foundation-row')].map(row=>{
      const body=clean(row.querySelector('.sky-foundation-row-name')?.textContent);
      const coordinate=clean(row.querySelector('.sky-foundation-coordinate')?.textContent);
      const house=clean(row.querySelector('.sky-foundation-house')?.textContent);
      if(!body)return '';
      return `- **${body}** — ${[coordinate,house].filter(Boolean).join(' · ')}`;
    }).filter(Boolean);
    if(!rows.length)return '';
    return [`### ${name} — Placements`,'',...rows].join('\n');
  }

  function cardHitMarkdown(section){
    const heading=clean(section.querySelector('.sky-card-hit-detail-copy h3')?.textContent);
    const description=clean(section.querySelector('.sky-card-hit-detail-copy p')?.textContent);
    if(!heading)return '';
    const lines=[...section.querySelectorAll('.sky-card-hit-placement')].map(item=>{
      const main=clean(item.querySelector('.sky-card-hit-placement-main')?.textContent);
      const meta=clean(item.querySelector('.sky-card-hit-placement-meta')?.textContent);
      const why=clean(item.querySelector('.sky-card-hit-placement-why')?.textContent);
      return `- **${[[main,meta].filter(Boolean).join(' · '),why].filter(Boolean).join(' · ')}**`;
    });
    return [`### ${heading}`,'',description?`**${description}**`:'','',...lines].filter((line,index,array)=>line!==''||array[index-1]!=='' ).join('\n');
  }

  async function copyPlacements(button){
    const view=button.closest('.sky-where-when-placement-view');
    const text=placementMarkdown(view);
    if(!text)return;
    try{await writeClipboard(text);copied(button,'Copy')}catch(error){console.error('[Sky Chart] Placements copy failed',error);failed(button,'Copy')}
  }
  async function copyCardHit(button){
    const section=button.closest('[data-card-hits-slot]');
    const text=cardHitMarkdown(section);
    if(!text)return;
    try{await writeClipboard(text);copied(button,'Copy')}catch(error){console.error('[Sky Chart] Card Hit copy failed',error);failed(button,'Copy')}
  }

  function installPlacementButton(view){
    if(!view||view.querySelector(':scope > .sky-placement-copy-row'))return;
    if(!view.querySelector('.sky-foundation-row'))return;
    const row=document.createElement('div');row.className='sky-placement-copy-row';
    const button=document.createElement('button');
    button.type='button';button.className='sky-quick-copy-button sky-placement-copy';button.dataset.copyPlacements='true';button.textContent='Copy';
    const slot=slotFor(view);button.setAttribute('aria-label',`Copy all placements for ${skyName(slot)}`);
    row.appendChild(button);view.prepend(row);
  }

  function installCardHitButton(section){
    const copy=section?.querySelector('.sky-card-hit-detail-copy');
    if(!copy||copy.querySelector('[data-copy-card-hit]'))return;
    const button=document.createElement('button');
    button.type='button';button.className='sky-quick-copy-button sky-card-hit-copy-one';button.dataset.copyCardHit='true';button.textContent='Copy';
    const heading=clean(copy.querySelector('h3')?.textContent)||'this Card Hit';
    button.setAttribute('aria-label',`Copy ${heading} and its associated placements`);
    copy.appendChild(button);
  }

  function hydrate(){
    queued=false;
    document.querySelectorAll('.sky-where-when-placement-view').forEach(installPlacementButton);
    document.querySelectorAll('.sky-card-hits-tab[data-card-hits-slot]').forEach(installCardHitButton);
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(hydrate)}

  function start(){
    installStyles();hydrate();
    const root=document.getElementById('skyFoundationRoot')||document.body;
    new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
    document.addEventListener('click',event=>{
      const placements=event.target.closest('[data-copy-placements]');
      if(placements){event.preventDefault();event.stopPropagation();copyPlacements(placements);return}
      const hit=event.target.closest('[data-copy-card-hit]');
      if(hit){event.preventDefault();event.stopPropagation();copyCardHit(hit)}
    });
    ['relphi:sky-foundation-ready','relphi:sky-foundation-interactions-ready'].forEach(name=>window.addEventListener(name,schedule));
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
