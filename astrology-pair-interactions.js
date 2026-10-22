/* Refine an indexed placement-pair reference in place; do not create indexable URL variants. */
(function(){
'use strict';
const mount=document.getElementById('pairInteractive'),main=document.querySelector('[data-pair-source][data-pair-target]');
const m=window.RelphiGlossaryStubCatalog;
if(!mount||!main||!m)return;
const source=m.placements.find(p=>p.id===main.dataset.pairSource),target=m.placements.find(p=>p.id===main.dataset.pairTarget);
if(!source||!target)return;
const houseDomains=[
 'self-presentation, the body, and beginnings','resources, possessions, and values',
 'language, neighbors, learning, and exchange','home, ancestry, and private foundations',
 'creativity, pleasure, and expression','daily work, health routines, and service',
 'partnership and one-to-one contracts','shared resources, intimacy, and transformations',
 'worldview, religion, higher learning, and journeys','vocation, visibility, and public responsibility',
 'friends, communities, networks, and future hopes','retreat, solitude, hidden processes, and endings'
];
const signDomains={
 aries:'initiative and direct action',taurus:'continuity and tangible security',gemini:'questions and exchange',
 cancer:'protection and emotional memory',leo:'expression and recognition',virgo:'craft and discernment',
 libra:'balance and negotiation',scorpio:'depth and concentrated change',sagittarius:'exploration and meaning',
 capricorn:'structure and ambition',aquarius:'systems and collective experimentation',pisces:'imagination and surrender'
};
const descriptions={
 conjunction:'coincidence brings the functions into the same focal point',
 'semi-sextile':'neighboring concerns need deliberate small accommodations',
 octile:'focused friction reveals a practical adjustment',
 sextile:'the relationship offers a cooperative opening if it is actively used',
 quintile:'the pairing can form a specialized creative pattern',
 square:'pressure for development asks for action rather than avoidance',
 trine:'the functions can exchange with comparatively little resistance',
 'tri-octile':'accumulated friction asks for a redirection of effort',
 'bi-quintile':'refined creative craftsmanship emerges through practice',
 quincunx:'different modes require continued translation and adjustment',
 opposition:'the two sides meet through contrast, awareness, and exchange'
};
const pairs=[['scope','Reading context'],['aspect','Aspect'],['sourceHouse',source.label+' house'],['targetHouse',target.label+' house']];
const params=new URLSearchParams(location.search);
mount.replaceChildren();
const controls=document.createElement('section');controls.className='pair-filter-panel';
const heading=document.createElement('h3');heading.textContent='Choose the relationship';controls.append(heading);
const grid=document.createElement('div');grid.className='pair-filter-grid';controls.append(grid);
function addSelect(holder,id,label,items,initial){
 const wrapper=document.createElement('label');wrapper.textContent=label;wrapper.htmlFor='pair-'+id;
 const select=document.createElement('select');select.id='pair-'+id;select.name=id;
 items.forEach(([value,text])=>{const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option)});
 const initialValue=params.get(id)??initial;
 if([...select.options].some(o=>o.value===initialValue))select.value=initialValue;
 wrapper.append(select);holder.append(wrapper);return select;
}
const scope=addSelect(grid,'scope','Reading context',[['transit-to-natal','Transiting '+source.label+' → natal '+target.label],['intrasky','Both placements natal'],['intersky','Across two skies']],'transit-to-natal');
const aspect=addSelect(grid,'aspect','Aspect',m.aspects.map(x=>[x.id,x.label+' · '+x.degrees+'°']),'opposition');
const houses=[['','Not specified'],...m.houses.map(x=>[x.id,x.label])];
const sourceHouse=addSelect(grid,'sourceHouse',source.label+' house',houses,'');
const targetHouse=addSelect(grid,'targetHouse',target.label+' house',houses,'');
const advanced=document.createElement('details');
const summary=document.createElement('summary');summary.textContent='Refine by signs and retrograde (optional)';advanced.append(summary);
const advancedGrid=document.createElement('div');advancedGrid.className='pair-filter-grid';
const signs=[['','Not specified'],...m.signs.map(x=>[x.id,x.label])];
const sourceSign=addSelect(advancedGrid,'sourceSign',source.label+' sign',signs,'');
const targetSign=addSelect(advancedGrid,'targetSign',target.label+' sign',signs,'');
function rx(placement,side){
 const label=document.createElement('label');label.className='pair-rx';
 const box=document.createElement('input');box.type='checkbox';box.name=side+'Rx';box.checked=params.get(side+'Rx')==='1';
 const valid=m.rxCapable.includes(placement.id);
 box.disabled=!valid;if(!valid)box.checked=false;
 label.append(box,document.createTextNode(' '+placement.label+' Rx'+(valid?'':' (not applicable)')));
 advancedGrid.append(label);return box;
}
const sourceRx=rx(source,'source'),targetRx=rx(target,'target');
advanced.append(advancedGrid);controls.append(advanced);mount.append(controls);
const result=document.createElement('div');result.className='pair-result';result.setAttribute('aria-live','polite');mount.append(result);
const actions=document.createElement('div');actions.className='pair-actions';
const copy=document.createElement('button');copy.type='button';copy.textContent='Copy this refined link';
const clear=document.createElement('button');clear.type='button';clear.className='secondary';clear.textContent='Reset refinements';
const status=document.createElement('span');status.className='pair-status';status.setAttribute('role','status');
actions.append(copy,clear,status);mount.append(actions);
const fields=[scope,aspect,sourceHouse,targetHouse,sourceSign,targetSign,sourceRx,targetRx];
function update(){
 const scopeText=scope.options[scope.selectedIndex].textContent;
 const aspectName=m.aspects.find(x=>x.id===aspect.value)?.label||'Aspect';
 const suffix=scope.value==='transit-to-natal'?'Transiting '+source.label+' → natal '+target.label:scopeText;
 const text=[
  '<h3>'+suffix+' · '+aspectName+'</h3>',
  '<p>As a '+aspectName.toLowerCase()+', '+descriptions[aspect.value]+'. Read the contact between '+source.label+' and '+target.label+' as a relationship between their symbolic functions—not as a guaranteed event.</p>'
 ];
 if(sourceHouse.value)text.push('<p><strong>'+source.label+' in House '+sourceHouse.value+':</strong> '+houseDomains[Number(sourceHouse.value)-1]+'.</p>');
 if(targetHouse.value)text.push('<p><strong>'+target.label+' in House '+targetHouse.value+':</strong> '+houseDomains[Number(targetHouse.value)-1]+'.</p>');
 if(sourceHouse.value&&targetHouse.value)text.push('<p>Bring the '+houseDomains[Number(sourceHouse.value)-1]+' into conversation with '+houseDomains[Number(targetHouse.value)-1]+'.</p>');
 if(sourceSign.value)text.push('<p><strong>'+source.label+' in '+sourceSign.options[sourceSign.selectedIndex].textContent+':</strong> expressed through '+signDomains[sourceSign.value]+'.</p>');
 if(targetSign.value)text.push('<p><strong>'+target.label+' in '+targetSign.options[targetSign.selectedIndex].textContent+':</strong> expressed through '+signDomains[targetSign.value]+'.</p>');
 if(sourceSign.value&&targetSign.value){
  const config={scope:scope.value,aspect:aspect.value,source:source.id,target:target.id,sourceSign:sourceSign.value,targetSign:targetSign.value,sourceHouse:sourceHouse.value||'1',targetHouse:targetHouse.value||'1',sourceRx:sourceRx.checked,targetRx:targetRx.checked};
  const isPossible=m.exactSignGeometry(config);
  text.push('<p class="'+(!isPossible?'pair-alert':'pair-note')+'">'+(isPossible?'The selected sign pair permits this exact aspect geometrically; positions and orb are still unknown.':'These two signs cannot form this exact aspect. Check the sign or aspect before treating the contact as exact.')+'</p>');
 }
 if(sourceRx.checked||targetRx.checked)text.push('<p>Rx marks apparent retrograde motion; in this interpretation it calls for revisiting and reworking a theme, not an automatic setback. Confirm the actual motion for the chosen date.</p>');
 text.push('<p class="pair-note">Selecting houses and signs does not calculate their longitudes or verify an aspect. For an actual chart, use Sky Chart.</p>');
 result.innerHTML=text.join('');
 const url=new URL(location.href);
 const query=new URLSearchParams();
 for(const field of [scope,aspect,sourceHouse,targetHouse,sourceSign,targetSign]){
  if(field.value)query.set(field.name,field.value);
 }
 if(sourceRx.checked)query.set('sourceRx','1');
 if(targetRx.checked)query.set('targetRx','1');
 url.search=query.toString();
 if(url.href!==location.href)history.replaceState(null,'',url);
 status.textContent='';
}
fields.forEach(x=>x.addEventListener('change',update));
copy.addEventListener('click',async()=>{
 try{await navigator.clipboard.writeText(location.href);status.textContent='Link copied';}
 catch(_){status.textContent='Copy unavailable here; use the address bar';}
});
clear.addEventListener('click',()=>{
 for(const x of [sourceHouse,targetHouse,sourceSign,targetSign])x.value='';
 scope.value='transit-to-natal';aspect.value='opposition';sourceRx.checked=false;targetRx.checked=false;
 update();
});
update();
})();
