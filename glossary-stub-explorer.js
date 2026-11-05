/* On-demand preview for draft glossary stubs (never emits indexable pages). */
(function(){
'use strict';
const model=window.RelphiGlossaryStubCatalog,root=document.getElementById('glossaryStubRoot');
if(!model||!root)return;
const fields=['scope','source','sourceSign','sourceHouse','aspect','target','targetSign','targetHouse'];
const lists={scope:model.scopes,source:model.placements,sourceSign:model.signs,sourceHouse:model.houses,aspect:model.aspects,target:model.placements,targetSign:model.signs,targetHouse:model.houses};
const names={scope:'Relationship scope',source:'First placement',sourceSign:'First sign',sourceHouse:'First house',
 aspect:'Aspect',target:'Second placement',targetSign:'Second sign',targetHouse:'Second house'};
root.replaceChildren(); // Remove static JavaScript-disabled fallback once the workbench is interactive.
const input=new URLSearchParams(location.search);
let current={...model.defaults};
for(const key of [...fields,'sourceRx','targetRx']){
 if(input.has(key))current[key]=input.get(key);
}
try{current=model.normalize(current);}catch(_){current=model.normalize(model.defaults);}
const form=document.createElement('form');
form.className='stub-controls';form.setAttribute('aria-label','Build an astrology reference stub');
for(const key of fields){
 const wrapper=document.createElement('label');wrapper.className='stub-field';wrapper.textContent=names[key];
 const select=document.createElement('select');select.name=key;
 for(const entry of lists[key]){
  const option=document.createElement('option');option.value=entry.id;option.textContent=entry.label+(key==='aspect'?' · '+entry.degrees+'°':'');
  select.appendChild(option);
 }
 select.value=current[key];wrapper.appendChild(select);form.appendChild(wrapper);
}
for(const side of ['source','target']){
 const label=document.createElement('label');label.className='stub-checkbox';
 const cb=document.createElement('input');cb.type='checkbox';cb.name=side+'Rx';
 cb.checked=current[side+'Rx'];label.append(cb,document.createTextNode(' '+(side==='source'?'First placement Rx':'Second placement Rx')));
 form.appendChild(label);
}
root.appendChild(form);
const article=document.createElement('article');article.className='stub-draft';article.setAttribute('aria-live','polite');
article.innerHTML='<div class="stub-statusline"><span class="stub-pill">UNWRITTEN STUB</span><span id="stubGeometry"></span></div><h2 id="stubHeading"></h2><p id="stubScope"></p><h3>Interpretation fields awaiting authorship</h3><dl class="stub-open-fields"><dt>Simple definition</dt><dd>Not written</dd><dt>Combined meaning</dt><dd>Not written</dd><dt>Sign and house nuance</dt><dd>Not written</dd><dt>Timing and exact passes</dt><dd>Not written</dd><dt>Caveats</dt><dd>Not written</dd></dl><h3>Stable stub identifier</h3><code id="stubId"></code><h3>Structured scaffold</h3><pre id="stubJson"></pre>';
root.appendChild(article);
const actions=document.createElement('div');actions.className='reference-links stub-actions';
const copyLink=document.createElement('button');copyLink.type='button';copyLink.textContent='Copy this preview link';
const copyJson=document.createElement('button');copyJson.type='button';copyJson.textContent='Copy stub JSON';
const status=document.createElement('span');status.className='stub-action-feedback';status.setAttribute('role','status');
actions.append(copyLink,copyJson,status);root.appendChild(actions);
let snapshot=null;
function values(){
 const data={};
 for(const name of fields)data[name]=form.elements.namedItem(name).value;
 for(const side of ['source','target'])data[side+'Rx']=form.elements.namedItem(side+'Rx').checked;
 return data;
}
function configureRx(){
 for(const side of ['source','target']){
  const checkbox=form.elements.namedItem(side+'Rx');
  const ok=model.rxCapable.includes(form.elements.namedItem(side).value);
  checkbox.disabled=!ok;if(!ok)checkbox.checked=false;
 }
}
function render(){
 configureRx();
 snapshot=model.makeStub(values());
 article.querySelector('#stubHeading').textContent=snapshot.title;
 article.querySelector('#stubScope').textContent=snapshot.scope.label;
 const geometry=article.querySelector('#stubGeometry');
 geometry.textContent=snapshot.geometry.exactAspectPossibleFromSignPair?'Signs geometrically compatible with exact aspect':'Exact aspect impossible for these signs';
 geometry.className=snapshot.geometry.exactAspectPossibleFromSignPair?'stub-feasible':'stub-infeasible';
 article.querySelector('#stubId').textContent=snapshot.id;
 article.querySelector('#stubJson').textContent=JSON.stringify(snapshot,null,2);
 const next=new URL(location.href);next.search=model.query(values());
 if(next.toString()!==location.href)history.replaceState(null,'',next);
 status.textContent='';
}
form.addEventListener('change',render);
function copy(value){
 if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(value);
 // Older preview contexts can lack clipboard permissions; never claim success.
 return Promise.reject(new Error('Clipboard permission is unavailable. Select the JSON text to copy manually.'));
}
copyLink.addEventListener('click',async()=>{
 try{await copy(location.href);status.textContent='Preview link copied';}
 catch(_){status.textContent='Clipboard unavailable in this preview';}
});
copyJson.addEventListener('click',async()=>{
 try{await copy(JSON.stringify(snapshot,null,2));status.textContent='Stub JSON copied';}
 catch(_){status.textContent='Clipboard unavailable; select the JSON text instead';}
});
for(const key of fields)form.elements.namedItem(key).value=current[key];
for(const side of ['source','target'])form.elements.namedItem(side+'Rx').checked=current[side+'Rx'];
render();
const counter=document.getElementById('stubCounter');if(counter)counter.textContent=model.count().toLocaleString('en-US');
})();
