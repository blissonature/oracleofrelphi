(function(){
'use strict';
const names=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const glyphs=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const rulers=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
const exalt=['Sun','Moon',null,'Jupiter',null,'Mercury','Saturn',null,null,'Mars',null,'Venus'];
const modes=['Cardinal','Fixed','Mutable'];
const elements=['Fire','Earth','Air','Water'];
const colors={Fire:'#da3b35',Earth:'#67a95c',Air:'#e6c84a',Water:'#4e90d6'};
const major=['The Emperor','The Hierophant','The Lovers','The Chariot','Strength','The Hermit','Justice','Death','Temperance','The Devil','The Star','The Moon'];
const order=['Mars','Sun','Venus','Mercury','Moon','Saturn','Jupiter'];
const tarotSuits=['Wands','Cups','Swords','Disks'];
const signElement=i=>['Fire','Earth','Air','Water'][((i*1)%4+4)%4] === undefined?'': ['Fire','Earth','Air','Water'][[0,1,2,3,0,1,2,3,0,1,2,3][i]];
const elBySign=['Fire','Earth','Air','Water','Fire','Earth','Air','Water','Fire','Earth','Air','Water'];
const decanRuler=i=>order[i%7];
const decanCard=i=>(2+Math.floor(i%9))+' of '+tarotSuits[Math.floor(i/9)];
const point=(degree,r)=>{let t=(180-degree)*Math.PI/180;return [210+r*Math.cos(t),210+r*Math.sin(t)]};
const wedge=(start,end,a,b)=>{const p=point(start,b),q=point(end,b),r=point(end,a),s=point(start,a);return 'M'+p.join(' ')+' A'+b+' '+b+' 0 0 0 '+q.join(' ')+' L'+r.join(' ')+' A'+a+' '+a+' 0 0 1 '+s.join(' ')+' Z'};
const norm=v=>(v%360+360)%360;
let mode='Sign',filter='All',selected=null,origin=0,orb=1;
const aspectDefs=[['Conjunction',0],['Semisextile',30],['Octile',45],['Sextile',60],['Quintile',72],['Square',90],['Trine',120],['Sesquiquadrate',135],['Quincunx',150],['Opposition',180]];
function describeSign(i){let ex=exalt[i]||'None (traditional)';let opposite=rulers[(i+6)%12];return names[i]+' · '+(i%2===0?'Yang':'Yin')+' · '+elBySign[i]+' · '+modes[i%3]+' · domicile '+rulers[i]+' · exaltation '+ex+' · detriment '+opposite+' · fall '+(exalt[(i+6)%12]||'None (traditional)')+'.'}
function render(grid,providedSigns,oldWheel){
 grid.classList.add('foundation-unified-active');
 const controls='<div class="uf-controls"><label>Explore <select data-uf-kind>'+['Sign','House','Element','Mode','Polarity','Rulership','Dignities','Decans & Tarot','Aspects'].map(x=>'<option '+(mode===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label>'+
 '<label>Focus <select data-uf-filter><option>All</option>'+ (mode==='Element'?elements:mode==='Mode'?modes:mode==='Polarity'?['Yang','Yin']:mode==='Rulership'?['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn']:names).map(x=>'<option '+(filter===x?'selected':'')+'>'+x+'</option>').join('')+'</select></label></div>';
 const aspectControls=mode==='Aspects'?'<div class="uf-aspect"><label>Starting degree <input type="number" min="0" max="359.99" step="0.01" data-uf-origin value="'+origin+'"></label><label>Orb ± <input type="number" min="0" max="12" step="0.25" data-uf-orb value="'+orb+'"></label></div>':'';
 const arcs=names.map((name,i)=>{const on=filter==='All'||filter===name||filter===elBySign[i]||filter===modes[i%3]||filter===(i%2===0?'Yang':'Yin')||filter===rulers[i];return '<g tabindex="0" role="button" aria-label="'+name+'" data-uf-sign="'+i+'" opacity="'+(on?1:.16)+'"><path d="'+wedge(i*30,(i+1)*30,105,181)+'" fill="'+colors[elBySign[i]]+'" stroke="#333" stroke-width=".8"/><text x="'+point(i*30+15,145)[0]+'" y="'+point(i*30+15,145)[1]+'" font-size="24" text-anchor="middle" dominant-baseline="central">'+glyphs[i]+'</text></g>'}).join('');
 const houses=names.map((_,i)=>'<g tabindex="0" role="button" data-uf-house="'+(i+1)+'" aria-label="House '+(i+1)+'"><path d="'+wedge(i*30,(i+1)*30,52,103)+'" stroke="#777" stroke-width=".7" fill="#fbfaf8"/><text x="'+point(i*30+15,79)[0]+'" y="'+point(i*30+15,79)[1]+'" text-anchor="middle" dominant-baseline="central" font-size="16">'+(i+1)+'</text></g>').join('');
 const aspectLines=mode==='Aspects'?aspectDefs.map(([label,d])=>{let a=point(origin,49),b=point(origin+d,98);return '<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" stroke="#d21e1e" stroke-width="2"><title>'+label+' '+d+'° ± '+orb+'°</title></line>'}).join(''):'';
 const wheel='<svg viewBox="0 0 420 420" class="uf-wheel" role="group" aria-label="Interactive zodiac and houses wheel"><circle cx="210" cy="210" r="190" fill="#fff" stroke="#333"/>'+arcs+houses+aspectLines+'<circle cx="210" cy="210" r="49" fill="#fff" stroke="#555"/><text x="210" y="205" text-anchor="middle" font-size="13" font-weight="700">Foundations</text><text x="210" y="222" text-anchor="middle" font-size="10">Aries rising · ideal model</text></svg>';
 const side=mode==='Decans & Tarot'?'<div class="uf-chart-wrap"><table class="uf-chart"><caption>Chaldean decans · Golden Dawn tarot minors</caption><thead><tr><th>Sign</th><th>Degrees</th><th>Decan ruler</th><th>Tarot</th></tr></thead><tbody>'+Array.from({length:36},(_,i)=>'<tr data-uf-row="'+Math.floor(i/3)+'"><td>'+glyphs[Math.floor(i/3)]+' '+names[Math.floor(i/3)]+'</td><td>'+(i%3*10)+'°–'+((i%3+1)*10)+'°</td><td>'+decanRuler(i)+'</td><td>'+decanCard(i)+'</td></tr>').join('')+'</tbody></table></div>':mode==='Aspects'?'<div class="uf-chart-wrap"><table class="uf-chart"><caption>Calculated aspect points, clockwise from selected degree</caption><thead><tr><th>Aspect</th><th>Angle</th><th>Positions</th></tr></thead><tbody>'+aspectDefs.map(([name,d])=>'<tr><td>'+name+'</td><td>'+d+'°</td><td>'+norm(origin+d).toFixed(2)+'° ± '+orb+'°'+(d!==0&&d!==180?' / '+norm(origin-d).toFixed(2)+'° ± '+orb+'°':'')+'</td></tr>').join('')+'</tbody></table></div>':'<div class="uf-guide"><h3>'+mode+'</h3><p>Select a sign or house on the wheel. The nearest corner displays a short description.</p><p>Traditional rulership; modern outer-planet associations are informational only. Houses follow an illustrative Aries-rising template, not a natal chart.</p></div>';
 const info=selected?' <div class="uf-corner" role="status">'+selected+'</div>':'';
 grid.innerHTML='<section class="uf-layout">'+controls+aspectControls+'<div class="uf-wheel-area">'+wheel+info+'</div>'+side+'</section>';
 grid.querySelector('[data-uf-kind]').addEventListener('change',e=>{mode=e.target.value;filter='All';selected=null;render(grid,providedSigns,oldWheel)});
 grid.querySelector('[data-uf-filter]').addEventListener('change',e=>{filter=e.target.value;selected=null;render(grid,providedSigns,oldWheel)});
 grid.querySelectorAll('[data-uf-sign]').forEach(n=>{const go=()=>{let i=Number(n.dataset.ufSign);selected=describeSign(i);filter=names[i];render(grid,providedSigns,oldWheel)};n.addEventListener('click',go);n.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}})});
 grid.querySelectorAll('[data-uf-house]').forEach(n=>{const go=()=>{let i=Number(n.dataset.ufHouse);selected='House '+i+' · '+['Self, body, approach','Resources and values','Communication and siblings','Home and roots','Creation and pleasure','Work and routines','Other and relationship','Shared resources and change','Belief and distant journeys','Public life and career','Groups and community','Solitude and hidden matters'][i-1];render(grid,providedSigns,oldWheel)};n.addEventListener('click',go);n.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}})});
 for(const [key,field] of [['[data-uf-origin]','origin'],['[data-uf-orb]','orb']]){const el=grid.querySelector(key);if(el)el.addEventListener('change',()=>{if(field==='origin')origin=norm(Number(el.value)||0);else orb=Math.min(12,Math.max(0,Number(el.value)||0));render(grid,providedSigns,oldWheel)})}
}
window.RelphiFoundationUnifiedWheel={render};
})();