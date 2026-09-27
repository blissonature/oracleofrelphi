(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
if(window.__relphiSkyPanelCommandBarsV1)return;
window.__relphiSkyPanelCommandBarsV1=true;

let queued=false,configOpen=false,configPopover=null,configButton=null;

function q(selector,root=document){return root.querySelector(selector)}
function all(selector,root=document){return [...root.querySelectorAll(selector)]}
function moveBefore(node,parent,before=null){if(node&&parent&&(node.parentElement!==parent||node.nextElementSibling!==before))parent.insertBefore(node,before)}
function activeChecks(root){return all('input[type="checkbox"]',root).filter(input=>!input.disabled)}
function setDefaultState(control,label){
  if(!control)return;
  control.dataset.commandLabel=label;
  let isDefault=false;
  if(control.matches('.sky-chart-zodiac-filter')){
    const button=q('[data-zodiac-summary]',control);
    isDefault=String(button?.textContent||'').trim().toLowerCase()==='all';
  }else if(control.matches('.sky-relationship-display-control')){
    const text=q('[data-relationship-display-value-text]',control);
    isDefault=String(text?.textContent||'').trim().toLowerCase()==='all';
  }else{
    const checks=activeChecks(control);
    const summary=String(q('[data-aspect-filter-summary],[data-placement-filter-summary],[data-house-filter-summary]',control)?.textContent||'').trim().toLowerCase();
    isDefault=checks.length?checks.every(input=>input.checked):summary==='all';
  }
  control.dataset.commandDefault=isDefault?'true':'false';
}

function focusLayout(){
  const panel=q('#skyFoundationFocus'),heading=q(':scope>.sky-foundation-focus-heading',panel);
  const controls=q('.sky-focus-heading-controls',heading);
  if(!panel||!heading||!controls)return;
  heading.classList.add('sky-panel-command-heading');
  controls.classList.add('sky-panel-command-controls','sky-panel-command-controls-focus');

  const display=q('[data-relationship-display-control]');
  const harmonic=q('[data-orb-field="true"]');
  const placement=q('[data-placement-filter="combined"]');
  const zodiac=q('[data-zodiac-filter]');
  const houses=q('[data-house-filter="combined"]');
  const actions=q('.sky-export-wheel-slot',controls)||q('.sky-export-wheel-slot');
  [display,harmonic,placement,zodiac,houses].forEach(node=>node?.classList.add('sky-panel-command-field'));
  if(actions)actions.classList.add('sky-panel-command-actions');

  const ordered=[display,harmonic,placement,zodiac,houses].filter(Boolean);
  ordered.forEach((node,index)=>{
    const before=ordered[index+1]||actions||null;
    moveBefore(node,controls,before);
  });
  if(actions&&actions.parentElement!==controls)controls.appendChild(actions);

  setDefaultState(display,'Display');
  setDefaultState(placement,'Placements');
  setDefaultState(zodiac,'Signs');
  setDefaultState(houses,'Houses');

  const caption=q('.sky-orb-number-field>span',controls);
  if(caption)caption.textContent='Harmonic Window';
  const harmonicInput=q('[data-harmonic-window-input]',controls);
  if(harmonicInput){
    harmonicInput.type='number';harmonicInput.min='.25';harmonicInput.max='12';harmonicInput.step='.25';
  }

  const bar=q(':scope>.sky-chart-filter-bar',panel);
  if(bar){
    const meaningful=all(':scope>*',bar).filter(node=>!node.matches('.sky-chart-aspect-filter'));
    bar.hidden=meaningful.length===0;
  }
}

function ensureConfigControl(actions,sortControl){
  let wrap=q('.sky-relationship-configurations-control',actions);
  if(!wrap){
    wrap=document.createElement('span');
    wrap.className='sky-relationship-configurations-control sky-panel-command-field';
    configButton=document.createElement('button');
    configButton.type='button';
    configButton.className='sky-relationship-configurations-button';
    configButton.textContent='Configurations';
    configButton.setAttribute('aria-haspopup','dialog');
    configButton.setAttribute('aria-expanded','false');
    configButton.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();toggleConfig()});
    wrap.appendChild(configButton);
    actions.insertBefore(wrap,sortControl||actions.firstChild);
  }else configButton=q('.sky-relationship-configurations-button',wrap);
  return wrap;
}

function configSection(){
  return q('#skyChartAspectPopover .sky-chart-configuration-section');
}
function refreshConfigClone(){
  if(!configPopover)return;
  const source=configSection();
  const body=q('.sky-command-config-popover-body',configPopover);
  if(!source||!body)return;
  const clone=source.cloneNode(true);
  clone.classList.add('sky-command-config-clone');
  body.replaceChildren(clone);
  const checked=all('[data-configuration-type]:checked',clone).filter(input=>input.dataset.configurationType!=='all');
  if(configButton)configButton.textContent=checked.length?('Configurations · '+checked.length):'Configurations';
}
function positionConfig(){
  if(!configOpen||!configPopover||!configButton)return;
  const rect=configButton.getBoundingClientRect(),margin=8,width=Math.min(720,Math.max(420,window.innerWidth-margin*2));
  const left=Math.min(window.innerWidth-width-margin,Math.max(margin,rect.left));
  configPopover.style.width=width+'px';
  configPopover.style.left=left+'px';
  configPopover.style.top=Math.min(window.innerHeight-margin-configPopover.offsetHeight,rect.bottom+6)+'px';
}
function openConfig(){
  if(!configPopover){
    configPopover=document.createElement('div');
    configPopover.className='sky-command-config-popover';
    configPopover.setAttribute('role','dialog');
    configPopover.setAttribute('aria-label','Configuration filters');
    configPopover.innerHTML='<div class="sky-command-config-popover-body"></div>';
    document.body.appendChild(configPopover);
  }
  configOpen=true;configPopover.hidden=false;configButton?.setAttribute('aria-expanded','true');
  refreshConfigClone();requestAnimationFrame(positionConfig);
}
function closeConfig(){
  configOpen=false;if(configPopover)configPopover.hidden=true;configButton?.setAttribute('aria-expanded','false');
}
function toggleConfig(){configOpen?closeConfig():openConfig()}

function relationshipsLayout(){
  const panel=q('#skyFoundationRelationships'),heading=q(':scope>.sky-foundation-relationships-heading',panel);
  if(!panel||!heading)return;
  heading.classList.add('sky-panel-command-heading','sky-panel-command-heading-relationships');
  let actions=q(':scope>.sky-relationship-heading-actions',heading);
  if(!actions){
    actions=document.createElement('span');actions.className='sky-relationship-heading-actions';heading.appendChild(actions);
  }
  actions.classList.add('sky-panel-command-controls','sky-panel-command-controls-relationships');

  const aspect=q('[data-aspect-filter="combined"]');
  const sort=q('.sky-relationship-sort-control',panel)||q('.sky-relationship-sort-control');
  const limit=q('.sky-relationship-limit-control',panel)||q('.sky-relationship-limit-control');
  const count=q('#skyFoundationRelationshipCount');
  const copy=q('.sky-relationship-copy-button',heading)||q('.sky-relationship-copy-button',panel);
  const download=q('#skyChartRelationshipsExport');
  [aspect,sort,limit].forEach(node=>node?.classList.add('sky-panel-command-field'));
  const config=ensureConfigControl(actions,sort);

  const left=[aspect,config,sort,limit].filter(Boolean);
  left.forEach((node,index)=>moveBefore(node,actions,left[index+1]||count||copy||download||null));
  if(count&&count.parentElement!==actions)actions.appendChild(count);
  if(copy&&copy.parentElement!==actions)actions.appendChild(copy);
  if(download&&download.parentElement!==actions)actions.appendChild(download);

  setDefaultState(aspect,'Aspects');
  if(sort){
    const select=q('[data-relationship-sort]',sort);
    sort.dataset.commandDefault=select?.value==='exact'?'true':'false';
    sort.dataset.commandLabel='Sort';
  }
  if(limit)limit.dataset.commandLabel='Max';

  if(count){count.classList.add('sky-command-match-count');count.dataset.countLabel='matches'}
  [copy,download].forEach(button=>button?.classList.add('sky-command-action-pill'));

  refreshConfigClone();
}

function normalizeActions(){
  const wheelCopy=q('#skyChartWheelCopy'),wheelDownload=q('#skyChartWheelExport'),relCopy=q('.sky-relationship-copy-button'),relDownload=q('#skyChartRelationshipsExport');
  [wheelCopy,wheelDownload,relCopy,relDownload].forEach(button=>button?.classList.add('sky-command-action-pill'));
  if(wheelDownload&&wheelDownload.dataset.commandText!=='true'){wheelDownload.textContent='Download';wheelDownload.dataset.commandText='true'}
  if(relDownload&&relDownload.dataset.commandText!=='true'){relDownload.textContent='Download';relDownload.dataset.commandText='true'}
  if(wheelCopy)wheelCopy.textContent='Copy';
  if(relCopy&&/^copy/i.test(relCopy.textContent.trim())===false)relCopy.textContent='Copy';
}

function ensure(){
  queued=false;
  focusLayout();relationshipsLayout();normalizeActions();
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(ensure)}
function start(){
  ensure();
  const root=q('#skyFoundationComparison')||document.body;
  new MutationObserver(schedule).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-selection-count','data-scope-selection-count','aria-checked']});
  ['relphi:sky-foundation-ready','relphi:sky-aspect-multiselect-changed','relphi:sky-placement-multiselect-changed','relphi:sky-house-multiselect-changed','relphi:sky-zodiac-filter-changed','relphi:sky-display-changed','relphi:relationship-sort-changed','relphi:relationship-limit-changed','relphi:relationship-limit-applied','relphi:sky-configuration-selection-changed','relphi:sky-configurations-detected'].forEach(name=>window.addEventListener(name,schedule));
  document.addEventListener('change',schedule,true);
  document.addEventListener('pointerdown',event=>{
    if(configOpen&&configPopover&&!configPopover.contains(event.target)&&event.target!==configButton)closeConfig();
  },true);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&configOpen){closeConfig();configButton?.focus()}});
  window.addEventListener('resize',positionConfig);
  window.addEventListener('scroll',positionConfig,true);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();