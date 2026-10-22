// Harmonic Explorer: optional second-row Relationships lens; no duplicate placement controls.
(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname)||window.RelphiHarmonicExplorer)return;
const catalogue=window.RelphiHarmonicAspectCatalog;
if(!catalogue)return;
let active=false,order=7;
const min=2,max=catalogue.maxOrder||40;
const enabled=()=>active;
const matches=id=>{const a=catalogue.byId(id);return !!a&&a.harmonic===order};
function announce(){
 document.documentElement.dataset.harmonicExplorer=active?'on':'off';
 document.documentElement.dataset.harmonicExplorerOrder=String(order);
 window.dispatchEvent(new CustomEvent('relphi:harmonic-explorer-changed',{detail:{active,order}}));
}
function setEnabled(value){active=!!value;refresh();announce()}
function setOrder(value){
 const raw=String(value).trim();
 if(!/^\d+$/.test(raw))return false;
 const n=Number(raw);
 if(!Number.isSafeInteger(n)||n<min||n>max)return false;
 order=n;refresh();announce();return true;
}
function refresh(){
 const root=document.querySelector('[data-harmonic-explorer]');
 if(!root)return;
 const toggle=root.querySelector('[data-harmonic-explorer-toggle]');
 const controls=root.querySelector('[data-harmonic-explorer-controls]');
 const number=root.querySelector('[data-harmonic-explorer-number]');
 if(toggle){toggle.checked=active;toggle.setAttribute('aria-checked',String(active))}
 if(controls)controls.hidden=!active;
 if(number&&document.activeElement!==number)number.value=String(order);
 root.querySelector('[data-harmonic-explorer-down]')?.toggleAttribute('disabled',order===min);
 root.querySelector('[data-harmonic-explorer-up]')?.toggleAttribute('disabled',order===max);
 root.querySelector('[data-harmonic-explorer-caption]')?.replaceChildren(document.createTextNode(order+' equal divisions'));
}
function install(){
 const panel=document.getElementById('skyFoundationRelationships');
 const first=panel?.querySelector(':scope > .sky-relationship-controls');
 if(!first)return;
 let root=panel.querySelector(':scope > [data-harmonic-explorer]');
 if(!root){
  root=document.createElement('div');
  root.className='relphi-harmonic-explorer';
  root.dataset.harmonicExplorer='';
  root.innerHTML='<label class="relphi-harmonic-toggle"><input type="checkbox" data-harmonic-explorer-toggle><span>Harmonic Explorer</span></label><div class="relphi-harmonic-stepper" data-harmonic-explorer-controls hidden><button type="button" data-harmonic-explorer-down aria-label="Previous harmonic">−</button><input data-harmonic-explorer-number type="number" inputmode="numeric" min="2" max="'+max+'" step="1" value="7" aria-label="Harmonic order"><button type="button" data-harmonic-explorer-up aria-label="Next harmonic">+</button><span data-harmonic-explorer-caption></span></div>';
  first.after(root);
  root.querySelector('[data-harmonic-explorer-toggle]').addEventListener('change',e=>setEnabled(e.target.checked));
  root.querySelector('[data-harmonic-explorer-down]').addEventListener('click',()=>setOrder(order-1));
  root.querySelector('[data-harmonic-explorer-up]').addEventListener('click',()=>setOrder(order+1));
  const field=root.querySelector('[data-harmonic-explorer-number]');
  const commit=()=>{if(!setOrder(field.value)){field.value=String(order);field.setCustomValidity('Enter a whole number from '+min+' to '+max);field.reportValidity();field.setCustomValidity('')}};
  field.addEventListener('change',commit);
  field.addEventListener('blur',commit);
  field.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();field.blur()}});
 }
 refresh();
}
const css=document.createElement('style');css.textContent=`
#skyFoundationRelationships .relphi-harmonic-explorer{display:flex;align-items:center;flex-wrap:wrap;gap:9px;padding:5px 10px;border-bottom:1px solid rgba(31,27,24,.12);background:#fffdf8;font:700 12px/1.3 system-ui,sans-serif;min-height:34px;box-sizing:border-box}
.relphi-harmonic-toggle{display:inline-flex;gap:7px;align-items:center;cursor:pointer}
.relphi-harmonic-toggle input{accent-color:#8657ae;width:16px;height:16px}
.relphi-harmonic-stepper:not([hidden]){display:inline-flex;align-items:center;gap:4px;margin-left:auto}
.relphi-harmonic-stepper button{width:30px;height:30px;border:1px solid #b8aaa0;border-radius:7px;background:#fff;cursor:pointer;font-size:20px;line-height:1}
.relphi-harmonic-stepper button:disabled{opacity:.35;cursor:default}
.relphi-harmonic-stepper input{box-sizing:border-box;width:58px;height:30px;border:1px solid #b8aaa0;border-radius:7px;background:#fff;text-align:center;font:700 14px system-ui,sans-serif}
.relphi-harmonic-stepper input::-webkit-inner-spin-button,.relphi-harmonic-stepper input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.relphi-harmonic-stepper [data-harmonic-explorer-caption]{font:600 10px/1.2 system-ui,sans-serif;color:#675e59;margin-left:5px}
@media(max-width:440px){.relphi-harmonic-stepper [data-harmonic-explorer-caption]{display:none}}
`;document.head.appendChild(css);
window.RelphiHarmonicExplorer=Object.freeze({enabled,getOrder:()=>order,matches,setEnabled,setOrder});
const start=()=>{install();new MutationObserver(()=>{if(!document.querySelector('[data-harmonic-explorer]'))install()}).observe(document.body,{childList:true,subtree:true});};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();