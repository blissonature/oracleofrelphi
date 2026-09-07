// Load the current Card Hits presentation refinement after the structural drawer.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(!document.querySelector('script[data-card-hits-inplace-loader]')){
    const script=document.createElement('script');
    script.src='sky-chart-card-hits-inplace-v1.js?v=4';
    script.async=false;
    script.dataset.cardHitsInplaceLoader='true';
    document.head.appendChild(script);
  }
  if(!document.getElementById('skyCardHitsHouseUniformV1Styles')){
    const style=document.createElement('style');
    style.id='skyCardHitsHouseUniformV1Styles';
    style.textContent=`
      .sky-card-house-row[data-house-number="1"]{--sky-house-unit-color:#e53935}
      .sky-card-house-row[data-house-number="2"]{--sky-house-unit-color:#f06b32}
      .sky-card-house-row[data-house-number="3"]{--sky-house-unit-color:#f39a2e}
      .sky-card-house-row[data-house-number="4"]{--sky-house-unit-color:#f5be3d}
      .sky-card-house-row[data-house-number="5"]{--sky-house-unit-color:#f1dc43}
      .sky-card-house-row[data-house-number="6"]{--sky-house-unit-color:#a9cf46}
      .sky-card-house-row[data-house-number="7"]{--sky-house-unit-color:#43a85b}
      .sky-card-house-row[data-house-number="8"]{--sky-house-unit-color:#2ca69b}
      .sky-card-house-row[data-house-number="9"]{--sky-house-unit-color:#3285c7}
      .sky-card-house-row[data-house-number="10"]{--sky-house-unit-color:#5961c8}
      .sky-card-house-row[data-house-number="11"]{--sky-house-unit-color:#8c4fb4}
      .sky-card-house-row[data-house-number="12"]{--sky-house-unit-color:#bd438e}

      .sky-card-house-card-line{
        --sky-house-card-art-w:46px;
        --sky-house-card-art-h:80px;
        position:relative!important;
        display:grid!important;
        grid-template-columns:repeat(5,minmax(0,1fr))!important;
        column-gap:.28rem!important;
        row-gap:.42rem!important;
        align-items:start!important;
        justify-content:stretch!important;
        min-width:0!important;
        padding:.52rem .42rem .5rem!important;
        border:1.5px solid var(--sky-house-unit-color,#777)!important;
        border-radius:12px!important;
        overflow:hidden!important;
        background:linear-gradient(90deg,
          color-mix(in srgb,var(--sky-house-unit-color,#777) 24%,#fffdfa) 0%,
          color-mix(in srgb,var(--sky-house-unit-color,#777) 24%,#fffdfa) 40%,
          #fffdfa 40%,
          #fffdfa 100%)!important;
      }
      .sky-card-house-card-line::before{
        content:'';
        position:absolute;
        z-index:0;
        top:0;
        bottom:0;
        left:40%;
        width:1.5px;
        background:var(--sky-house-unit-color,#777);
        pointer-events:none;
      }
      .sky-card-house-card-line:not(:has(.sky-card-house-decan))::after{
        content:'No placements';
        grid-column:3/-1;
        align-self:center;
        justify-self:center;
        z-index:1;
        color:#776e66;
        font:800 .52rem/1.2 system-ui,sans-serif;
        text-align:center;
      }
      .sky-card-house-span-major,
      .sky-card-house-card-line .sky-card-house-decan{
        position:relative!important;
        z-index:1!important;
        display:grid!important;
        grid-template-rows:10px var(--sky-house-card-art-h) minmax(18px,auto)!important;
        justify-items:center!important;
        align-items:start!important;
        align-content:start!important;
        gap:.24rem!important;
        width:100%!important;
        min-width:0!important;
      }
      .sky-card-house-span-major-role,
      .sky-card-house-card-line .sky-card-house-decan::before{
        display:block!important;
        width:100%!important;
        color:#6b625b!important;
        font:900 .42rem/1 system-ui,sans-serif!important;
        letter-spacing:.05em!important;
        text-align:center!important;
        text-transform:uppercase!important;
      }
      .sky-card-house-span-major-role{color:color-mix(in srgb,var(--sky-house-unit-color,#555) 72%,#332d28)!important}
      .sky-card-house-card-line .sky-card-house-decan::before{content:'Decan'}
      .sky-card-house-span-major-art,
      .sky-card-house-card-line .sky-card-house-decan-art{
        display:block!important;
        width:var(--sky-house-card-art-w)!important;
        max-width:100%!important;
        height:var(--sky-house-card-art-h)!important;
        aspect-ratio:500/866!important;
        margin:0!important;
        border-radius:5px!important;
      }
      .sky-card-house-span-major-art>img,
      .sky-card-house-card-line .sky-card-house-decan-art>img{
        display:block!important;
        width:100%!important;
        height:100%!important;
        object-fit:cover!important;
        border-radius:4px!important;
      }
      .sky-card-house-span-major-name,
      .sky-card-house-card-line .sky-card-house-decan-label{
        display:flex!important;
        align-items:flex-start!important;
        justify-content:center!important;
        gap:.1rem!important;
        width:100%!important;
        max-width:100%!important;
        min-height:18px!important;
        margin:0!important;
        padding:0!important;
        overflow:visible!important;
        color:#332d28!important;
        font:850 .47rem/1.15 system-ui,sans-serif!important;
        text-align:center!important;
        text-overflow:clip!important;
        white-space:normal!important;
      }
      .sky-card-house-card-line .sky-card-house-decan-label .sky-card-inline-glyph{
        flex:0 0 13px!important;
        width:13px!important;
        height:13px!important;
      }
      @media(max-width:520px){
        .sky-card-house-card-line{
          --sky-house-card-art-w:43px;
          --sky-house-card-art-h:75px;
          column-gap:.2rem!important;
          padding:.48rem .32rem .46rem!important;
        }
      }
    `;
    document.head.appendChild(style);
  }
})();

// Copy every Card Hit and its associated placements as clean Markdown.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.__relphiSkyCardHitsCopyV1)return;
  window.__relphiSkyCardHitsCopyV1=true;

  const COPY_LABEL='Copy All';
  let observer=null;

  function installStyles(){
    if(document.getElementById('skyCardHitsCopyV1Styles'))return;
    const style=document.createElement('style');
    style.id='skyCardHitsCopyV1Styles';
    style.textContent=`
      .sky-card-hits-tab-header{flex-wrap:wrap!important}
      .sky-card-hits-copy-all{appearance:none;border:1px solid rgba(31,27,24,.18);border-radius:999px;background:#fff;color:#241f1b;padding:.4rem .62rem;font:850 .62rem/1 system-ui,sans-serif;white-space:nowrap;cursor:pointer}
      .sky-card-hits-copy-all:hover,.sky-card-hits-copy-all:focus-visible{background:#f4efe8;border-color:rgba(31,27,24,.38);outline:none}
      .sky-card-hits-copy-all[data-copy-state="done"]{border-color:color-mix(in srgb,var(--sky-hit-color,#555) 42%,rgba(31,27,24,.18));background:color-mix(in srgb,var(--sky-hit-color,#555) 8%,#fff);color:var(--sky-hit-color,#555)}
      @media(max-width:620px){.sky-card-hits-copy-all{padding:.38rem .55rem;font-size:.6rem}}
    `;
    document.head.appendChild(style);
  }

  function slotFor(section){
    return section?.dataset.cardHitsSlot || (section?.closest('#skyFoundationA')?'A':section?.closest('#skyFoundationB')?'B':'');
  }

  function cardGrid(section){return section?.querySelector('.sky-card-hits-grid')||null}

  function snapshotCards(section){
    return [...(cardGrid(section)?.querySelectorAll('.sky-card-hit[data-card-hit-id]')||[])].map(button=>({
      id:button.dataset.cardHitId||'',
      name:(button.querySelector('.sky-card-hit-name')?.textContent||'Card').replace(/\s+/g,' ').trim(),
      count:Number((button.querySelector('.sky-card-hit-chip')?.textContent||'').replace(/[^0-9]/g,''))||0
    })).filter(card=>card.id);
  }

  function escapeSelector(value){
    if(window.CSS?.escape)return CSS.escape(value);
    return String(value).replace(/["\\]/g,'\\$&');
  }

  function detailLines(section){
    return [...section.querySelectorAll('.sky-card-hit-placement')].map(item=>{
      const main=(item.querySelector('.sky-card-hit-placement-main')?.textContent||'').replace(/\s+/g,' ').trim();
      const meta=(item.querySelector('.sky-card-hit-placement-meta')?.textContent||'').replace(/\s+/g,' ').trim();
      const why=(item.querySelector('.sky-card-hit-placement-why')?.textContent||'').replace(/\s+/g,' ').trim();
      const placement=[main,meta].filter(Boolean).join(' ');
      return `- **${[placement,why].filter(Boolean).join(' · ')}**`;
    });
  }

  function sectionMarkdown(name,count,lines){
    const noun=count===1?'placement':'placements';
    const verb=count===1?'associates':'associate';
    return [`### ${name} ×${count}`,'',`**${count} ${noun} in this sky ${verb} with this card.**`,'',...lines].join('\n');
  }

  function markdownForAll(section){
    const cards=snapshotCards(section);
    if(!cards.length)return '';
    const chunks=[];
    for(const card of cards){
      const button=section.querySelector(`.sky-card-hit[data-card-hit-id="${escapeSelector(card.id)}"]`);
      if(!button)continue;
      button.click();
      const current=document.querySelector(`[data-card-hits-slot="${slotFor(section)}"]`);
      if(!current)continue;
      chunks.push(sectionMarkdown(card.name,card.count,detailLines(current)));
      current.querySelector('[data-card-hit-back]')?.click();
      section=document.querySelector(`[data-card-hits-slot="${slotFor(current)}"]`);
      if(!section)break;
    }
    return chunks.join('\n\n\n');
  }

  async function writeClipboard(text){
    if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return}
    const area=document.createElement('textarea');
    area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';area.style.pointerEvents='none';document.body.appendChild(area);area.select();
    const ok=document.execCommand('copy');area.remove();if(!ok)throw new Error('Copy command failed');
  }

  function setCopied(button){
    if(!button)return;
    button.dataset.copyState='done';button.textContent='Copied';
    window.setTimeout(()=>{if(!button.isConnected)return;button.dataset.copyState='';button.textContent=COPY_LABEL},1400);
  }

  async function copyAll(button){
    const section=button.closest('[data-card-hits-slot]');
    if(!section)return;
    const slot=slotFor(section);
    const markdown=markdownForAll(section);
    if(!markdown)return;
    try{
      await writeClipboard(markdown);
      hydrate();
      setCopied(document.querySelector(`[data-card-hits-slot="${slot}"] [data-copy-all-card-hits]`)||button);
    }catch(error){
      console.error('[Sky Chart] Card Hits copy failed',error);
      hydrate();
      const visible=document.querySelector(`[data-card-hits-slot="${slot}"] [data-copy-all-card-hits]`)||button;
      visible.textContent='Copy failed';window.setTimeout(()=>{if(visible.isConnected)visible.textContent=COPY_LABEL},1600);
    }
  }

  function installButton(section){
    const header=section.querySelector('.sky-card-hits-tab-header');
    if(!header||!cardGrid(section)||header.querySelector('[data-copy-all-card-hits]'))return;
    const button=document.createElement('button');
    button.type='button';button.className='sky-card-hits-copy-all';button.dataset.copyAllCardHits='true';button.textContent=COPY_LABEL;
    button.setAttribute('aria-label',`Copy all Card Hits and placements for Sky ${slotFor(section)}`);
    const total=header.querySelector('.sky-card-hits-tab-total');
    header.insertBefore(button,total||null);
  }

  function hydrate(){
    document.querySelectorAll('.sky-card-hits-tab[data-card-hits-slot]').forEach(installButton);
  }

  function start(){
    installStyles();hydrate();
    const root=document.getElementById('skyFoundationRoot')||document.body;
    observer=new MutationObserver(()=>hydrate());observer.observe(root,{childList:true,subtree:true});
    document.addEventListener('click',event=>{const button=event.target.closest('[data-copy-all-card-hits]');if(button){event.preventDefault();event.stopPropagation();copyAll(button)}},false);
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();