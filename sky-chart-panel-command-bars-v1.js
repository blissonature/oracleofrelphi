(function(){
'use strict';
if(!/(^|\/)sky-chart\.html$/.test(location.pathname))return;
if(window.__relphiSkyPanelCommandBarsV2)return;
window.__relphiSkyPanelCommandBarsV2=true;

let queued=false;
let configOpen=false;
let configPopover=null;
let configButton=null;

function q(selector,root=document){return root?.querySelector?.(selector)||null}
function all(selector,root=document){return root?[...root.querySelectorAll(selector)]:[]}
function move(node,parent,before=null){if(node&&parent&&(node.parentElement!==parent||node.nextElementSibling!==before))parent.insertBefore(node,before)}
function summaryText(control,selector){return String(q(selector,control)?.textContent||'').trim()}
function normalize(text){return String(text||'').trim().toLowerCase()}

function setDropdownState(control,label,selector){
  if(!control)return;
  control.dataset.commandLabel=label;
  control.dataset.commandDefault=normalize(summaryText(control,selector))==='all'?'true':'false';
}
function ensureFocusActions(controls){
  const slot=q('.sky-export-wheel-slot',controls)||q('.sky-export-wheel-slot');
  if(slot){
    slot.classList.add('sky-command-right','sky-panel-command-actions');
    if(slot.parentElement!==controls)controls.appendChild(slot);
  }
  return slot;
}

function focusLayout(){
  const panel=q('#skyFoundationFocus');
  const heading=q(':scope>.sky-foundation-focus-heading',panel);
  const controls=q('.sky-focus-heading-controls',heading);
  if(!panel||!heading||!controls)return;

  heading.classList.add('sky-panel-command-heading');
  controls.classList.add('sky-panel-command-controls','sky-panel-command-controls-focus');

  const display=q('[data-relationship-display-control]');
  const harmonic=q('[data-orb-field="true"]');
  const placement=q('[data-placement-filter="combined"]');
  const signs=q('[data-zodiac-filter]');
  const houses=q('[data-house-filter="combined"]');
  const actions=ensureFocusActions(controls);

  [display,harmonic,placement,signs,houses].forEach(node=>node?.classList.add('sky-panel-command-field','sky-command-left'));

  const ordered=[display,harmonic,placement,signs,houses].filter(Boolean);
  ordered.forEach((node,index)=>move(node,controls,ordered[index+1]||actions||null));

  setDropdownState(display,'Display','[data-relationship-display-value-text]');
  setDropdownState(placement,'Placements','[data-placement-filter-summary]');
  setDropdownState(signs,'Signs','[data-zodiac-summary]');
  setDropdownState(houses,'Houses','[data-house-filter-summary]');

  const harmonicInput=q('[data-harmonic-window-input]',harmonic);
  if(harmonicInput){
    harmonic.dataset.commandLabel='Harmonic Window';
    harmonicInput.type='number';
    harmonicInput.min='.25';
    harmonicInput.max='12';
    harmonicInput.step='.25';
    harmonicInput.placeholder='Harmonic Window';
  }

  const bar=q(':scope>.sky-chart-filter-bar',panel);
  if(bar){
    const leftover=all(':scope>*',bar).filter(node=>!node.matches('.sky-chart-aspect-filter'));
    bar.hidden=leftover.length===0;
  }
}

function ensureConfigPopover(){
  if(configPopover)return configPopover;
  configPopover=document.createElement('div');
  configPopover.id='skyRelationshipConfigurationsMenu';
  configPopover.className='sky-command-config-popover';
  configPopover.setAttribute('role','dialog');
  configPopover.setAttribute('aria-label','Configurations');
  configPopover.hidden=true;
  const body=document.createElement('div');
  body.id='skyRelationshipConfigurationsMenuBody';
  body.className='sky-command-config-popover-body';
  configPopover.appendChild(body);
  document.body.appendChild(configPopover);

  const existing=q('.sky-chart-configuration-section');
  if(existing)body.appendChild(existing);
  window.RelphiAspectConfigurations?.refresh?.();
  return configPopover;
}
function configSelectionLabel(){
  const section=q('#skyRelationshipConfigurationsMenuBody .sky-chart-configuration-section')||q('.sky-chart-configuration-section');
  if(!section)return'Configurations';
  const typeInputs=all('[data-configuration-scope="all"][data-configuration-type]:not([data-configuration-type="all"])',section)
    .filter(input=>!input.disabled);
  const checked=typeInputs.filter(input=>input.checked&&!input.indeterminate);
  if(typeInputs.length&&checked.length===typeInputs.length)return'Configurations';
  if(!checked.length)return'Configurations · None';
  if(checked.length===1){
    const row=checked[0].closest('[data-configuration-row]');
    return row?.querySelector('.sky-chart-configuration-name')?.textContent?.trim()||'Configurations · 1';
  }
  return `Configurations · ${checked.length}`;
}
function ensureConfigControl(actions){
  let wrap=q(':scope>.sky-relationship-configurations-control',actions);
  if(!wrap){
    wrap=document.createElement('span');
    wrap.className='sky-relationship-configurations-control sky-panel-command-field sky-command-left';
    configButton=document.createElement('button');
    configButton.type='button';
    configButton.className='sky-relationship-configurations-button';
    configButton.setAttribute('aria-haspopup','dialog');
    configButton.setAttribute('aria-controls','skyRelationshipConfigurationsMenu');
    configButton.setAttribute('aria-expanded','false');
    configButton.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();toggleConfig()});
    wrap.appendChild(configButton);
    actions.appendChild(wrap);
  }else configButton=q('.sky-relationship-configurations-button',wrap);
  configButton.textContent=configSelectionLabel();
  return wrap;
}
function positionConfig(){
  if(!configOpen||!configPopover||!configButton)return;
  const rect=configButton.getBoundingClientRect(),margin=8;
  const width=Math.min(720,Math.max(380,Math.min(window.innerWidth-margin*2,rect.width*4.2)));
  configPopover.style.width=`${width}px`;
  configPopover.style.left=`${Math.min(window.innerWidth-width-margin,Math.max(margin,rect.left))}px`;
  configPopover.style.top=`${Math.min(window.innerHeight-configPopover.offsetHeight-margin,rect.bottom+6)}px`;
}
function openConfig(){
  ensureConfigPopover();
  const body=q('#skyRelationshipConfigurationsMenuBody',configPopover);
  const section=q('.sky-chart-configuration-section');
  if(section&&section.parentElement!==body)body.appendChild(section);
  configOpen=true;
  configPopover.hidden=false;
  configButton?.setAttribute('aria-expanded','true');
  requestAnimationFrame(positionConfig);
}
function closeConfig(){
  configOpen=false;
  if(configPopover)configPopover.hidden=true;
  configButton?.setAttribute('aria-expanded','false');
}
function toggleConfig(){configOpen?closeConfig():openConfig()}

function relationshipActionsContainer(heading){
  let actions=q(':scope>.sky-relationship-heading-actions',heading);
  if(!actions){
    actions=document.createElement('span');
    actions.className='sky-relationship-heading-actions';
    heading.appendChild(actions);
  }
  actions.classList.add('sky-panel-command-controls','sky-panel-command-controls-relationships');
  return actions;
}

function relationshipsLayout(){
  const panel=q('#skyFoundationRelationships');
  const heading=q(':scope>.sky-foundation-relationships-heading',panel);
  if(!panel||!heading)return;

  heading.classList.add('sky-panel-command-heading','sky-panel-command-heading-relationships');
  const actions=relationshipActionsContainer(heading);

  const aspect=q('[data-aspect-filter="combined"]');
  const config=ensureConfigControl(actions);
  const sort=q('.sky-relationship-sort-control',panel)||q('.sky-relationship-sort-control');
  const limit=q('.sky-relationship-limit-control',panel)||q('.sky-relationship-limit-control');
  const count=q('#skyFoundationRelationshipCount');
  const copy=q('.sky-relationship-copy-button',heading)||q('.sky-relationship-copy-button',panel);
  const download=q('#skyChartRelationshipsExport');

  [aspect,config,sort,limit].forEach(node=>node?.classList.add('sky-panel-command-field','sky-command-left'));
  [count,copy,download].forEach(node=>node?.classList.add('sky-command-right'));

  const left=[aspect,config,sort,limit].filter(Boolean);
  const right=[count,copy,download].filter(Boolean);
  [...left,...right].forEach((node,index)=>{
    const sequence=[...left,...right];
    move(node,actions,sequence[index+1]||null);
  });

  setDropdownState(aspect,'Aspects','[data-aspect-filter-summary]');

  if(sort){
    sort.dataset.commandLabel='Sort';
    const select=q('[data-relationship-sort]',sort);
    sort.dataset.commandDefault=select?.value==='exact'?'true':'false';
  }
  if(limit){
    limit.dataset.commandLabel='Max';
    const select=q('[data-relationship-limit-preset]',limit);
    limit.dataset.commandDefault=select?.value==='all'?'true':'false';
  }

  if(count){
    count.classList.add('sky-command-match-count');
    count.dataset.countLabel='matches';
  }
  [copy,download].forEach(button=>button?.classList.add('sky-command-action-pill'));
  if(configButton)configButton.textContent=configSelectionLabel();
}

function normalizeActions(){
  const wheelCopy=q('#skyChartWheelCopy');
  const wheelDownload=q('#skyChartWheelExport');
  const relCopy=q('.sky-relationship-copy-button');
  const relDownload=q('#skyChartRelationshipsExport');
  [wheelCopy,wheelDownload,relCopy,relDownload].forEach(button=>button?.classList.add('sky-command-action-pill'));
  if(wheelCopy)wheelCopy.textContent='Copy';
  if(wheelDownload)wheelDownload.textContent='Download';
  if(relCopy&&!/^copied/i.test(relCopy.textContent.trim()))relCopy.textContent='Copy';
  if(relDownload)relDownload.textContent='Download';
}

function ensure(){
  queued=false;
  ensureConfigPopover();
  focusLayout();
  relationshipsLayout();
  normalizeActions();
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(ensure)}
function start(){
  ensure();
  const root=q('#skyFoundationRoot')||document.body;
  new MutationObserver(records=>{
    if(records.some(record=>record.type==='childList'||record.type==='attributes'))schedule();
  }).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-selection-count','data-scope-selection-count','aria-checked','value']});

  [
    'relphi:sky-foundation-ready','relphi:sky-aspect-multiselect-changed','relphi:sky-placement-multiselect-changed',
    'relphi:sky-house-multiselect-changed','relphi:sky-zodiac-filter-changed','relphi:sky-display-changed',
    'relphi:relationship-sort-changed','relphi:relationship-limit-changed','relphi:relationship-limit-applied',
    'relphi:sky-configuration-selection-changed','relphi:sky-configurations-detected'
  ].forEach(name=>window.addEventListener(name,schedule));

  document.addEventListener('change',schedule,true);
  document.addEventListener('pointerdown',event=>{
    if(configOpen&&configPopover&&!configPopover.contains(event.target)&&event.target!==configButton)closeConfig();
  },true);
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&configOpen){closeConfig();configButton?.focus()}
  });
  window.addEventListener('resize',positionConfig);
  window.addEventListener('scroll',positionConfig,true);
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();