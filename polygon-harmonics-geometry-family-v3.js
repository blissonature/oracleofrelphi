(function(){
'use strict';
if(window.__relphiPolygonFamilyV3)return;
window.__relphiPolygonFamilyV3=true;
const bridge=window.RelphiPolygonSpecialShapes;
if(!bridge?.shapes)return;
const DEG=Math.PI/180,PHI=(1+Math.sqrt(5))/2;
const picker=document.querySelector('.ph-special-picker');
const buttons=picker?.querySelector('.ph-special-buttons');
const goldenButton=picker?.querySelector('[data-ph-special="golden"]');
const triangleButton=picker?.querySelector('[data-ph-special="triangle"]');
const patternTitle=document.getElementById('phPatternTitle');
const patternBox=patternTitle?.closest('.ph-pattern');
if(!buttons||!goldenButton||!triangleButton||!patternBox)return;

const canonicalTriangle={
  name:'21–55–64',center:'△',title:'21–55–64 · A-rooted pulse',stage:'21–55–64 triangle · A as root',
  detail:'A is the root vertex. AB = 55, AC = 21, and BC = 64. Neptune/C keeps its canonical Quadrant II orientation.',
  offsets:[0,-111.54226734437484*DEG,36.80449239188047*DEG],labels:['A','B','C'],together:1,strikes:36,contacts:36,
  law:'The canonical construction places A at the origin, B at fifty-five on the horizontal axis, and Neptune/C at negative sixty-three elevenths, positive eighty-four square-root-seven elevenths: Quadrant II. On the clockwise-positive sound wheel, B is counterclockwise from A and C is clockwise. All thirty-six vertex-note contacts remain distinct.'
};
const triangleFamilies={
  goldenTriangle:{
    name:'Golden triangle',center:'φ△',title:'Golden triangle · φ isosceles',stage:'Golden triangle · A as root',
    detail:'A is the thirty-six-degree apex root. The two equal legs stand in the golden ratio to the base, linking this three-point pulse directly to the pentagonal family.',
    offsets:[0,-144*DEG,144*DEG],labels:['A','B','C'],together:1,strikes:36,contacts:36,
    law:'Its angles are thirty-six, seventy-two, and seventy-two degrees. On the circumcircle the A-to-B and A-to-C arcs are each one hundred forty-four degrees, while the remaining arc is seventy-two degrees. The equal legs are φ times the base.'
  },
  goldenGnomon:{
    name:'Golden gnomon',center:'g△',title:'Golden gnomon · complementary φ triangle',stage:'Golden gnomon · A as root',
    detail:'A is the one-hundred-eight-degree apex root. This complementary golden triangle reverses the golden triangle’s long-side relation.',
    offsets:[0,-72*DEG,72*DEG],labels:['A','B','C'],together:1,strikes:36,contacts:36,
    law:'Its angles are one hundred eight, thirty-six, and thirty-six degrees. The A-to-B and A-to-C arcs are each seventy-two degrees, and the base arc is two hundred sixteen degrees. The base is φ times either equal leg.'
  },
  pyth345:{
    name:'3–4–5 triangle',center:'345',title:'3–4–5 triangle · rope-stretcher pulse',stage:'3–4–5 triangle · A as right-angle root',
    detail:'A is the right-angle root. AB = 4, AC = 3, and BC = 5. A strikes alone, while the diametrically opposed B and C vertices strike together as a tritone dyad.',
    offsets:[0,-106.26020470831196*DEG,73.73979529168804*DEG],labels:['A','B','C'],together:'1 / 2',strikes:24,contacts:36,
    law:'Because A is ninety degrees, B and C are opposite on the circumcircle. Their note crossings therefore coincide, creating twelve B/C tritone-dyad strikes per turn, interleaved with twelve single A-root strikes: twenty-four strike moments from thirty-six vertex-note contacts.'
  },
  kepler:{
    name:'Kepler triangle',center:'K△',title:'Kepler triangle · right angle with φ',stage:'Kepler triangle · A as right-angle root',
    detail:'A is the right-angle root. The side proportions are one, square root of φ, and φ. A strikes alone, while the diametrically opposed B and C vertices strike together as a tritone dyad.',
    offsets:[0,-76.34541525402449*DEG,103.65458474597551*DEG],labels:['A','B','C'],together:'1 / 2',strikes:24,contacts:36,
    law:'The Kepler triangle is right-angled, so B and C are opposite on the circumcircle and their crossings coincide. Its one, square-root-φ, φ side family therefore yields twelve B/C tritone-dyad strikes interleaved with twelve A-root single strikes: twenty-four strike moments per turn.'
  },
  triangle215564:canonicalTriangle
};
function setTriangle(def){Object.assign(bridge.shapes.triangle,def);triangleButton.click();}
function goldenOffsets(ratio){const a=2*Math.atan(1/ratio);return[0,a,Math.PI,Math.PI+a];}
function setRectangle(ratio,label){
  const a=2*Math.atan(1/ratio)/DEG,b=180-a,locks=Math.abs(a/30-Math.round(a/30))<1e-9;
  Object.assign(bridge.shapes.golden,{
    name:label,center:label==='Golden rectangle'?'φ':'▭',title:label+' · tritone dyads',stage:label+' · variable tritone pulse',
    detail:locks?'All four vertices lock to the thirty-degree note lattice, so each strike becomes a four-note event.':'Opposite corners remain simultaneous, so every strike is a tritone dyad. The aspect ratio controls the spacing between the two opposite-corner streams.',
    offsets:goldenOffsets(ratio),labels:['','','',''],together:locks?4:2,strikes:locks?12:24,contacts:48,
    law:'A centered rectangle always keeps opposite vertices one hundred eighty degrees apart. At aspect ratio '+ratio.toFixed(3)+':1, the adjacent circumcircle arcs are about '+a.toFixed(3)+' degrees and '+b.toFixed(3)+' degrees. '+(locks?'Here the adjacent arc is also a multiple of thirty degrees, so both opposite-corner streams coincide: twelve four-note strikes per turn.':'The two opposite-corner streams stay distinct, giving twenty-four tritone-dyad strike moments per turn.')
  });
  goldenButton.click();
}

const extra=[
  ['goldenTriangle','△ Golden triangle'],['goldenGnomon','△ Golden gnomon'],['pyth345','△ 3–4–5 triangle'],['kepler','△ Kepler triangle'],['rectangle','▭ Rectangle family']
];
extra.forEach(([key,label])=>{const b=document.createElement('button');b.type='button';b.dataset.phFamily=key;b.textContent=label;buttons.appendChild(b);});

const panel=document.createElement('div');
panel.className='ph-rectangle-panel';panel.hidden=true;
panel.innerHTML='<div class="ph-rectangle-head"><strong>Rectangle aspect</strong><span id="phRectRatioOut">1.618 : 1</span></div><input id="phRectRatio" type="range" min="1" max="2.5" step="0.001" value="1.61803398875" aria-label="Rectangle aspect ratio"><div class="ph-rect-presets"><button type="button" data-r="1">Square</button><button type="button" data-r="1.61803398875">Golden</button><button type="button" data-r="2">2 : 1</button></div><div class="ph-rect-foot">Move continuously from the square’s equal pulse to the golden pulse and beyond.</div>';
patternBox.appendChild(panel);
const style=document.createElement('style');style.textContent='.ph-special-buttons [data-ph-family]{appearance:none;border:1px solid #d9b7af;background:#fffaf6;color:#5b241f;border-radius:.72rem;font:inherit;font-weight:700;padding:.52rem .4rem;cursor:pointer}.ph-special-buttons [data-ph-family][aria-pressed="true"]{background:#5b241f;color:#fff8f2;border-color:#5b241f}.ph-rectangle-panel{margin-top:.6rem;padding:.6rem .7rem;border-radius:.85rem;background:#f7ede7;color:#5b241f;font-size:.82rem}.ph-rectangle-panel[hidden]{display:none}.ph-rectangle-head{display:flex;justify-content:space-between;gap:.5rem;font-weight:700}.ph-rectangle-panel input{width:100%;margin:.35rem 0}.ph-rect-presets{display:grid;grid-template-columns:repeat(3,1fr);gap:.35rem}.ph-rect-presets button{border:1px solid #d9b7af;border-radius:.65rem;background:#fffaf6;padding:.4rem;font:inherit;font-weight:700;cursor:pointer}.ph-rect-foot{margin-top:.35rem;font-size:.78rem;color:#6d5450}';document.head.appendChild(style);
const familyButtons=[...buttons.querySelectorAll('[data-ph-family]')];
const ratioInput=panel.querySelector('#phRectRatio'),ratioOut=panel.querySelector('#phRectRatioOut');
let activeFamily=null,internal=false;
function press(key){familyButtons.forEach(b=>b.setAttribute('aria-pressed',b.dataset.phFamily===key?'true':'false'));activeFamily=key;panel.hidden=key!=='rectangle';}
familyButtons.forEach(b=>b.addEventListener('click',()=>{const key=b.dataset.phFamily;press(key);internal=true;if(key==='rectangle')setRectangle(Number(ratioInput.value)||PHI,'Rectangle');else setTriangle(triangleFamilies[key]);internal=false;}));
ratioInput.addEventListener('input',()=>{const r=Number(ratioInput.value)||PHI;ratioOut.textContent=r.toFixed(3)+' : 1';if(activeFamily==='rectangle'){internal=true;setRectangle(r,'Rectangle');internal=false;}});
panel.querySelectorAll('[data-r]').forEach(b=>b.addEventListener('click',()=>{const r=Number(b.dataset.r);ratioInput.value=String(r);ratioOut.textContent=r.toFixed(3)+' : 1';press('rectangle');internal=true;setRectangle(r,'Rectangle');internal=false;}));
goldenButton.addEventListener('click',()=>{if(internal)return;press(null);panel.hidden=true;Object.assign(bridge.shapes.golden,{name:'Golden rectangle',center:'φ',title:'Golden pulse · tritone dyads',stage:'Golden rectangle · tritone pulse',detail:'Opposite corners always strike together, so every hit is a tritone. The two opposite-corner pairs interleave in the golden rectangle’s uneven pulse against the twelve-note grid.',offsets:goldenOffsets(PHI),labels:['','','',''],together:2,strikes:24,contacts:48,law:'Opposite corners stay one hundred eighty degrees apart, so every strike is a tritone dyad. The golden aspect ratio produces the characteristic uneven pulse against the thirty-degree note lattice.'});},true);
triangleButton.addEventListener('click',()=>{if(internal)return;press(null);panel.hidden=true;Object.assign(bridge.shapes.triangle,canonicalTriangle);},true);
document.getElementById('phShapeGrid')?.addEventListener('click',()=>{press(null);panel.hidden=true;});
bridge.familyV3={triangleFamilies,goldenOffsets,canonicalTriangle};
})();
