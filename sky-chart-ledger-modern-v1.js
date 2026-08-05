// Modern 2026 presentation for Chart Hits and stable one-line planetary ruler captions.
(function(){
  'use strict';
  if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
  if(window.__relphiSkyLedgerModernV1)return;
  window.__relphiSkyLedgerModernV1=true;

  function installStyles(){
    if(document.getElementById('skyLedgerModernStyles'))return;
    const style=document.createElement('style');
    style.id='skyLedgerModernStyles';
    style.textContent=`
      .sky-ruler-caption-one-line{
        display:block!important;
        width:100%!important;
        max-width:100%!important;
        min-width:0!important;
        margin-inline:auto!important;
        white-space:nowrap!important;
        overflow:visible!important;
        text-overflow:clip!important;
        text-align:center!important;
        line-height:1.15!important;
        letter-spacing:-.015em!important;
      }

      .sky-chart-hits{
        padding:.8rem .75rem 1rem!important;
        background:linear-gradient(180deg,rgba(255,255,255,.9),rgba(255,253,249,.96))!important;
      }
      .sky-chart-hits h3{
        margin:0 0 .7rem!important;
        font-size:.82rem!important;
        letter-spacing:.065em!important;
      }
      .sky-chart-hit{
        border-radius:.7rem!important;
        padding:.2rem!important;
        transition:background .16s ease,transform .16s ease!important;
      }
      .sky-chart-hit:hover{background:rgba(31,27,24,.055)!important}
      .sky-chart-hit:active{transform:scale(.98)!important}
      .sky-chart-hit:focus-visible{outline:3px solid color-mix(in srgb,var(--sky-hit-color) 42%,white)!important;outline-offset:2px!important}
      .sky-chart-hit img{
        border-radius:.55rem!important;
        box-shadow:0 1px 2px rgba(31,27,24,.16),0 7px 18px rgba(31,27,24,.09)!important;
      }
      .sky-chart-hit-count{
        top:-.15rem!important;
        right:-.12rem!important;
        padding:.26rem .42rem!important;
        border:2px solid #fffdfa!important;
        box-shadow:0 2px 8px rgba(31,27,24,.2)!important;
      }

      .sky-ledger-dialog{
        width:min(92vw,760px)!important;
        max-height:min(88dvh,880px)!important;
        margin:auto!important;
        padding:0!important;
        border:1px solid rgba(63,54,47,.12)!important;
        border-radius:24px!important;
        background:#fffdfa!important;
        color:#211d1a!important;
        box-shadow:0 28px 80px rgba(30,24,20,.24),0 3px 12px rgba(30,24,20,.1)!important;
        overflow:hidden!important;
      }
      .sky-ledger-dialog::backdrop{
        background:rgba(24,20,17,.48)!important;
        backdrop-filter:blur(7px) saturate(.8)!important;
        -webkit-backdrop-filter:blur(7px) saturate(.8)!important;
      }
      .sky-ledger-shell{
        display:grid!important;
        grid-template-rows:auto minmax(0,1fr)!important;
        max-height:min(88dvh,880px)!important;
        background:#fffdfa!important;
      }
      .sky-ledger-header{
        position:sticky!important;
        top:0!important;
        z-index:3!important;
        display:grid!important;
        grid-template-columns:58px minmax(0,1fr) 44px!important;
        align-items:center!important;
        gap:.9rem!important;
        min-height:82px!important;
        padding:.9rem 1rem!important;
        border-top:0!important;
        border-bottom:1px solid rgba(63,54,47,.11)!important;
        background:rgba(255,253,250,.94)!important;
        backdrop-filter:blur(18px)!important;
        -webkit-backdrop-filter:blur(18px)!important;
      }
      .sky-ledger-header::before{
        content:'';
        position:absolute;
        inset:0 0 auto;
        height:5px;
        background:var(--ledger-accent,#7b716a);
      }
      .sky-ledger-header img{
        width:54px!important;
        height:68px!important;
        object-fit:cover!important;
        border-radius:8px!important;
        box-shadow:0 5px 16px rgba(31,27,24,.16)!important;
      }
      .sky-ledger-header h2{
        margin:0!important;
        min-width:0!important;
        font-size:clamp(1.05rem,2.4vw,1.35rem)!important;
        line-height:1.15!important;
        letter-spacing:-.015em!important;
      }
      .sky-ledger-header h2::before{
        content:'CARD INSPECTOR';
        display:block;
        margin-bottom:.28rem;
        color:#716961;
        font-size:.67rem;
        line-height:1;
        letter-spacing:.11em;
        font-weight:800;
      }
      .sky-ledger-header [data-close-ledger]{
        display:grid!important;
        place-items:center!important;
        width:40px!important;
        height:40px!important;
        margin:0!important;
        padding:0!important;
        border:1px solid rgba(63,54,47,.16)!important;
        border-radius:999px!important;
        background:#fff!important;
        color:#28221e!important;
        font-size:0!important;
        cursor:pointer!important;
        box-shadow:0 1px 2px rgba(31,27,24,.08)!important;
      }
      .sky-ledger-header [data-close-ledger]::before{content:'×';font-size:1.65rem;line-height:1;font-weight:350}
      .sky-ledger-header [data-close-ledger]:hover{background:#f2eee9!important}
      .sky-ledger-header [data-close-ledger]:focus-visible{outline:3px solid color-mix(in srgb,var(--ledger-accent) 35%,white)!important;outline-offset:2px!important}

      .sky-ledger-body{
        overflow:auto!important;
        overscroll-behavior:contain!important;
        padding:1.15rem!important;
        scrollbar-gutter:stable!important;
      }
      .sky-ledger-section{
        margin:0 0 1rem!important;
        padding:1rem!important;
        border:1px solid rgba(63,54,47,.11)!important;
        border-radius:18px!important;
        background:#fff!important;
      }
      .sky-ledger-section:last-child{margin-bottom:0!important}
      .sky-ledger-section h3{
        display:flex!important;
        align-items:center!important;
        gap:.55rem!important;
        margin:0 0 .8rem!important;
        color:#211d1a!important;
        font-size:.82rem!important;
        line-height:1.2!important;
        letter-spacing:.075em!important;
        text-transform:uppercase!important;
      }
      .sky-ledger-section h3::before{
        content:'';
        width:9px;
        height:9px;
        border-radius:999px;
        background:var(--ledger-accent,#7b716a);
        box-shadow:0 0 0 5px color-mix(in srgb,var(--ledger-accent) 13%,transparent);
      }
      .sky-ledger-hit,.sky-ledger-ingredient{
        display:grid!important;
        grid-template-columns:minmax(112px,27%) minmax(0,1fr)!important;
        gap:.8rem!important;
        align-items:start!important;
        padding:.78rem 0!important;
        border-top:1px solid rgba(63,54,47,.095)!important;
      }
      .sky-ledger-hit:first-of-type,.sky-ledger-ingredient:first-of-type{border-top:0!important;padding-top:.15rem!important}
      .sky-ledger-ingredient-label{
        display:inline-flex!important;
        align-items:center!important;
        justify-self:start!important;
        min-height:28px!important;
        padding:.32rem .55rem!important;
        border-radius:999px!important;
        background:#f1ede8!important;
        color:#5f5750!important;
        font-size:.72rem!important;
        line-height:1.15!important;
        font-weight:800!important;
        text-transform:none!important;
      }
      .sky-ledger-progressive{
        display:flex!important;
        flex-wrap:wrap!important;
        align-items:baseline!important;
        gap:.3rem .55rem!important;
        min-width:0!important;
        padding:.15rem 0!important;
      }
      .sky-ledger-progressive button{
        border:0!important;
        border-radius:.55rem!important;
        background:transparent!important;
        padding:.22rem .3rem!important;
        color:inherit!important;
        text-align:left!important;
        cursor:pointer!important;
      }
      .sky-ledger-progressive button:hover{background:#f3efea!important}
      .sky-ledger-progressive button:focus-visible{outline:3px solid color-mix(in srgb,var(--ledger-accent) 28%,white)!important;outline-offset:1px!important}
      .sky-ledger-glyphs{font-size:1rem!important;line-height:1.35!important;font-weight:650!important;letter-spacing:.025em!important}
      .sky-ledger-names{font-size:.96rem!important;line-height:1.35!important;font-weight:720!important}
      .sky-ledger-referent{
        flex-basis:100%!important;
        margin:.18rem 0 0!important;
        padding:.65rem .75rem!important;
        border-left:3px solid color-mix(in srgb,var(--ledger-accent) 55%,#ccc)!important;
        border-radius:0 .7rem .7rem 0!important;
        background:#f8f5f1!important;
        color:#403934!important;
        font-size:.92rem!important;
        line-height:1.5!important;
      }
      .sky-ledger-empty{padding:.75rem!important;border-radius:.7rem!important;background:#f7f4f0!important}

      @media(max-width:620px){
        .sky-ledger-dialog{
          width:100vw!important;
          max-width:none!important;
          height:min(94dvh,900px)!important;
          max-height:94dvh!important;
          margin:auto 0 0!important;
          border-radius:24px 24px 0 0!important;
        }
        .sky-ledger-dialog::before{
          content:'';
          display:block;
          position:absolute;
          top:8px;
          left:50%;
          z-index:5;
          width:42px;
          height:4px;
          border-radius:999px;
          background:rgba(63,54,47,.22);
          transform:translateX(-50%);
        }
        .sky-ledger-shell{height:94dvh!important;max-height:94dvh!important}
        .sky-ledger-header{grid-template-columns:48px minmax(0,1fr) 40px!important;min-height:76px!important;padding:1rem .85rem .75rem!important}
        .sky-ledger-header img{width:44px!important;height:58px!important}
        .sky-ledger-header [data-close-ledger]{width:38px!important;height:38px!important}
        .sky-ledger-body{padding:.8rem!important}
        .sky-ledger-section{padding:.85rem!important;border-radius:16px!important}
        .sky-ledger-hit,.sky-ledger-ingredient{grid-template-columns:1fr!important;gap:.35rem!important;padding:.72rem 0!important}
        .sky-ledger-ingredient-label{font-size:.69rem!important}
      }
    `;
    document.head.appendChild(style);
  }

  function fitRulerCaptions(){
    document.querySelectorAll('#skyFoundationA *,#skyFoundationB *').forEach(node=>{
      if(node.children.length)return;
      const text=(node.textContent||'').replace(/\s+/g,' ').trim();
      if(!/\bday\b.*\bplanetary hour\b|\bplanetary hour\b.*\bhour\b/i.test(text))return;
      node.classList.add('sky-ruler-caption-one-line');
      node.style.fontSize='';
      const available=node.clientWidth||node.parentElement?.clientWidth||0;
      if(!available)return;
      let size=Math.min(12,parseFloat(getComputedStyle(node).fontSize)||12);
      node.style.fontSize=size+'px';
      while(node.scrollWidth>available&&size>7.5){size-=.25;node.style.fontSize=size+'px'}
    });
  }

  function modernizeDialog(){
    const modal=document.querySelector('.sky-ledger-dialog');
    if(!modal)return;
    const header=modal.querySelector('.sky-ledger-header');
    if(header){
      const accent=header.style.borderTopColor||getComputedStyle(header).borderTopColor;
      if(accent&&accent!=='rgba(0, 0, 0, 0)')header.style.setProperty('--ledger-accent',accent);
      header.style.borderTop='0';
      header.querySelector('[data-close-ledger]')?.setAttribute('title','Close card inspector');
    }
    modal.querySelector('.sky-ledger-shell')?.style.setProperty('--ledger-accent',header?.style.getPropertyValue('--ledger-accent')||'#7b716a');
  }

  function refresh(){fitRulerCaptions();modernizeDialog()}
  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;refresh()})}
  function start(){
    installStyles();
    refresh();
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});
    window.addEventListener('resize',schedule,{passive:true});
    ['relphi:sky-foundation-rendered','relphi:selected-relationship-rendered'].forEach(name=>window.addEventListener(name,schedule));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
