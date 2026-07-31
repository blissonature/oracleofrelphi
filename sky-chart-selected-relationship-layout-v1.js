// Canonical selected-relationship layout. Uses the two actual card items; never reuses their narrow legacy columns.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
let timer=0;
function style(){
 if(document.getElementById('relphi-selected-canonical-style'))return;
 const s=document.createElement('style');s.id='relphi-selected-canonical-style';s.textContent=`
 .relphi-mobile-dual-card-view.relphi-selected-canonical{display:block!important;width:100%!important;min-width:0!important;max-width:none!important;height:auto!important;overflow:visible!important;position:relative!important;inset:auto!important;transform:none!important;container-type:inline-size}
 .relphi-selected-canonical>.relphi-selected-canonical-shell{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:1rem!important;width:100%!important;min-width:0!important}
 .relphi-selected-canonical-cards{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:.9rem!important;width:100%!important;min-width:0!important}
 .relphi-selected-canonical-card{display:block!important;width:100%!important;min-width:0!important;max-width:none!important;margin:0!important;padding:.8rem!important;border:1px solid rgba(17,17,17,.14);border-radius:1rem;background:#fffdf8;overflow:hidden!important;position:relative!important;inset:auto!important;transform:none!important}
 .relphi-selected-canonical-card>.relphi-dual-card-item,.relphi-selected-canonical-card .relphi-dual-card-item{display:grid!important;grid-template-columns:minmax(92px,128px) minmax(0,1fr)!important;gap:.8rem!important;align-items:start!important;width:100%!important;min-width:0!important;max-width:none!important;margin:0!important;padding:0!important;position:relative!important;inset:auto!important;transform:none!important}
 .relphi-selected-canonical-card .relphi-dual-card-item>*{min-width:0!important;max-width:100%!important;position:relative!important;inset:auto!important;transform:none!important;margin:0!important;white-space:normal!important;word-break:normal!important;overflow-wrap:break-word!important;writing-mode:horizontal-tb!important}
 .relphi-selected-canonical-card img,.relphi-selected-canonical-card svg,.relphi-selected-canonical-card canvas{display:block!important;width:100%!important;max-width:128px!important;height:auto!important;margin:0 auto!important}
 .relphi-selected-canonical-reading{display:block!important;width:100%!important;min-width:0!important;max-width:none!important;padding:1rem!important;border-radius:1rem;background:rgba(255,253,248,.78);line-height:1.55!important;white-space:normal!important;word-break:normal!important;overflow-wrap:normal!important}
 .relphi-selected-canonical-reading>*{width:100%!important;min-width:0!important;max-width:none!important;margin-left:0!important;margin-right:0!important;white-space:normal!important;word-break:normal!important;overflow-wrap:normal!important}
 .relphi-selected-canonical-orb{display:flex!important;justify-content:center!important;width:100%!important;min-width:0!important;overflow:visible!important}
 .relphi-selected-canonical-orb>*{position:relative!important;inset:auto!important;transform:none!important;margin:0 auto!important;max-width:100%!important}
 .relphi-selected-canonical>.relphi-selected-canonical-legacy{display:none!important}
 @container (min-width:620px){.relphi-selected-canonical-cards{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
 @media(max-width:600px){.relphi-selected-canonical-card>.relphi-dual-card-item,.relphi-selected-canonical-card .relphi-dual-card-item{grid-template-columns:minmax(78px,104px) minmax(0,1fr)!important;gap:.65rem!important}.relphi-selected-canonical-card{padding:.65rem!important}.relphi-selected-canonical-reading{padding:.8rem!important}}
 `;document.head.appendChild(s);
}
function rebuild(host){
 if(!host)return false;
 const cards=Array.from(host.querySelectorAll('.relphi-dual-card-item')).slice(0,2);
 const reading=host.querySelector('.relphi-progressive-reading,.relphi-canonical-relationship-reading');
 if(cards.length<2||!reading)return false;
 const stamp=[cards[0].textContent,cards[1].textContent,reading.textContent].join('|').slice(0,500);
 if(host.dataset.relphiSelectedStamp===stamp&&host.querySelector(':scope>.relphi-selected-canonical-shell'))return true;
 host.querySelector(':scope>.relphi-selected-canonical-shell')?.remove();
 Array.from(host.children).forEach(function(child){child.classList.add('relphi-selected-canonical-legacy')});
 const shell=document.createElement('div');shell.className='relphi-selected-canonical-shell';
 const cardsHost=document.createElement('div');cardsHost.className='relphi-selected-canonical-cards';
 cards.forEach(function(card){const slot=document.createElement('article');slot.className='relphi-selected-canonical-card';slot.appendChild(card);cardsHost.appendChild(slot)});
 const orbCandidate=Array.from(host.querySelectorAll('svg,canvas')).find(function(v){return !cards.some(function(c){return c.contains(v)})&&!reading.contains(v)});
 if(orbCandidate){const orb=document.createElement('div');orb.className='relphi-selected-canonical-orb';orb.appendChild(orbCandidate);shell.appendChild(orb)}
 shell.appendChild(cardsHost);
 const readSlot=document.createElement('section');readSlot.className='relphi-selected-canonical-reading';readSlot.appendChild(reading);shell.appendChild(readSlot);
 host.appendChild(shell);host.classList.add('relphi-selected-canonical');host.dataset.relphiSelectedStamp=stamp;return true;
}
function run(){style();document.querySelectorAll('.relphi-mobile-dual-card-view').forEach(rebuild)}
function queue(){clearTimeout(timer);timer=setTimeout(run,30)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
new MutationObserver(queue).observe(document.documentElement,{subtree:true,childList:true});
document.addEventListener('click',queue,true);
})();