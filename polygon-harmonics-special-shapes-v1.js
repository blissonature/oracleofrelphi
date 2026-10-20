(function(){
'use strict';
if(window.__relphiPolygonSpecialShapesV1) return;
window.__relphiPolygonSpecialShapesV1 = true;

const TAU=Math.PI*2, DEG=Math.PI/180, CX=360, CY=360, R=284, SVG_NS='http://www.w3.org/2000/svg';
const circleNotes=[
  {name:'C',pc:0},{name:'G',pc:7},{name:'D',pc:2},{name:'A',pc:9},{name:'E',pc:4},{name:'B',pc:11},
  {name:'F♯',pc:6},{name:'D♭',pc:1},{name:'A♭',pc:8},{name:'E♭',pc:3},{name:'B♭',pc:10},{name:'F',pc:5}
];
const pitchNames=['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];

const goldenSmall=2*Math.atan(1/((1+Math.sqrt(5))/2)); // 63.4349488°
const triangleB=111.54226734437484*DEG;
const triangleC=-36.80449239188047*DEG;
const shapes={
  golden:{
    key:'golden', label:'φ Golden rectangle', center:'φ',
    title:'Golden pulse · tritone dyads',
    stage:'Golden rectangle · tritone pulse',
    detail:'Opposite corners always strike together, so every hit is a tritone. The two opposite-corner pairs interleave in the golden rectangle’s uneven pulse against the twelve-note grid.',
    offsets:[0,goldenSmall,Math.PI,Math.PI+goldenSmall],
    labels:['','','',''], together:2, strikes:24, contacts:48,
    law:'Four vertices do not make this a square: the golden rectangle has only opposite-pair rotational symmetry. Opposite corners stay one hundred eighty degrees apart, so every strike is a tritone dyad. Its adjacent arcs alternate about sixty-three point four three five degrees and one hundred sixteen point five six five degrees, producing alternating strike gaps of about three point four three five degrees and twenty-six point five six five degrees against the thirty-degree note lattice.'
  },
  triangle:{
    key:'triangle', label:'△ 21–55–64', center:'△',
    title:'21–55–64 · A-rooted pulse',
    stage:'21–55–64 triangle · A as root',
    detail:'A is the root vertex. AB = 55, AC = 21, and BC = 64. The unequal circumcircle arcs create three interleaved note streams instead of the simultaneous augmented-triad strikes of the regular triangle.',
    offsets:[0,triangleB,triangleC],
    labels:['A','B','C'], together:1, strikes:36, contacts:36,
    law:'The exact side lengths place B about one hundred eleven point five four two degrees clockwise from A on the circumcircle and C about thirty-six point eight zero four degrees counterclockwise from A. Modulo the thirty-degree note lattice, the three crossing streams are distinct, so all thirty-six vertex-note contacts are separate. Whenever A crosses a note, that pitch becomes the current root.'
  }
};

const stageWrap=document.getElementById('phStageWrap');
const wheel=document.getElementById('phWheel');
const shapeGrid=document.getElementById('phShapeGrid');
const basePolygon=document.getElementById('phPolygon');
const baseVertexLayer=document.getElementById('phVertexLayer');
const centerNumber=document.getElementById('phCenterNumber');
const stageTitle=document.getElementById('phStageTitle');
const eventVisual=document.getElementById('phEventVisual');
const modePill=document.getElementById('phModePill');
const modeText=document.getElementById('phModeText');
const counterBtn=document.getElementById('phCounterBtn');
const clockBtn=document.getElementById('phClockBtn');
const speedInput=document.getElementById('phSpeed');
const toneInput=document.getElementById('phTone');
const lengthInput=document.getElementById('phLength');
const volumeInput=document.getElementById('phVolume');
const playBtn=document.getElementById('phPlayBtn');
const resetBtn=document.getElementById('phResetBtn');
const muteBtn=document.getElementById('phMuteBtn');
const patternTitle=document.getElementById('phPatternTitle');
const patternDetail=document.getElementById('phPatternDetail');
const togetherOut=document.getElementById('phTogether');
const strikesOut=document.getElementById('phStrikes');
const contactsOut=document.getElementById('phContacts');
const lawTitle=document.getElementById('phLawTitle');
const lawText=document.getElementById('phLawText');
if(!stageWrap||!wheel||!shapeGrid||!basePolygon||!playBtn) return;

const style=document.createElement('style');
style.textContent=`
.ph-special-picker{margin-top:.65rem;padding-top:.65rem;border-top:1px solid #e7d2cc}
.ph-special-picker .ph-special-label{display:block;margin:0 0 .35rem;font-weight:700;color:#382520;font-size:.92rem}
.ph-special-buttons{display:grid;grid-template-columns:1fr 1fr;gap:.4rem}
.ph-special-buttons button{appearance:none;border:1px solid #d9b7af;background:#fffaf6;color:#5b241f;border-radius:.72rem;font:inherit;font-weight:700;padding:.52rem .4rem;cursor:pointer}
.ph-special-buttons button[aria-pressed="true"]{background:#5b241f;color:#fff8f2;border-color:#5b241f}
.ph-special-shape{fill:rgba(247,201,72,.055);stroke:#fff;stroke-width:3;stroke-linejoin:round;filter:drop-shadow(0 0 8px rgba(247,201,72,.28));pointer-events:none}
.ph-special-vertex{fill:#f7c948;stroke:#fff;stroke-width:2;filter:drop-shadow(0 0 5px rgba(247,201,72,.5));pointer-events:none}
.ph-special-vertex.root{fill:#dc1f18;stroke:#fff;stroke-width:3}
.ph-special-vlabel{fill:#fff;font:800 13px system-ui,sans-serif;text-anchor:middle;dominant-baseline:middle;paint-order:stroke;stroke:#100b14;stroke-width:3px;pointer-events:none}
.ph-special-root-readout{margin-top:.6rem;padding:.55rem .65rem;border-radius:.75rem;background:#f7ede7;color:#5b241f;font-size:.82rem;line-height:1.4}
.ph-special-root-readout strong{color:#9f1d1b}
@media(max-width:620px){.ph-special-buttons{grid-template-columns:1fr}}
`;
document.head.appendChild(style);

const picker=document.createElement('div');
picker.className='ph-special-picker';
picker.innerHTML='<span class="ph-special-label">Special geometry</span><div class="ph-special-buttons"><button type="button" data-ph-special="golden" aria-pressed="false">φ Golden rectangle</button><button type="button" data-ph-special="triangle" aria-pressed="false">△ 21–55–64</button></div>';
shapeGrid.insertAdjacentElement('afterend',picker);
const specialButtons=[...picker.querySelectorAll('[data-ph-special]')];

const rootReadout=document.createElement('div');
rootReadout.className='ph-special-root-readout';
rootReadout.hidden=true;
const patternBox=patternTitle?.closest('.ph-pattern');
if(patternBox) patternBox.appendChild(rootReadout);

const layer=document.createElementNS(SVG_NS,'g');
layer.id='phSpecialShapeLayer';
layer.style.display='none';
const centerRing=wheel.querySelector('.ph-center-ring');
wheel.insertBefore(layer,centerRing||null);

const state={
  active:null, phase:0, direction:counterBtn.getAttribute('aria-pressed')==='true'?-1:1,
  rpm:Number(speedInput.value)||3, playing:false, lastFrame:null, raf:null, drag:null,
  resumeBase:false, muted:muteBtn.getAttribute('aria-pressed')==='true', rootPc:0
};
let audioContext=null, masterGain=null, compressor=null;
const flashTimers=new Map();

function pointAt(angle){return {x:CX+Math.sin(angle)*R,y:CY-Math.cos(angle)*R};}
function svgEl(name,attrs){const el=document.createElementNS(SVG_NS,name);Object.entries(attrs||{}).forEach(([k,v])=>el.setAttribute(k,v));return el;}
function ensureAudio(){
  const AudioCtor=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtor) return Promise.resolve(false);
  if(!audioContext){
    audioContext=new AudioCtor();
    masterGain=audioContext.createGain();
    compressor=audioContext.createDynamicsCompressor();
    compressor.threshold.value=-18; compressor.knee.value=16; compressor.ratio.value=4; compressor.attack.value=.004; compressor.release.value=.18;
    masterGain.connect(compressor); compressor.connect(audioContext.destination); updateMasterGain();
  }
  if(audioContext.state==='suspended') return audioContext.resume().then(()=>true).catch(()=>false);
  return Promise.resolve(true);
}
function updateMasterGain(){
  if(!masterGain||!audioContext) return;
  const normalized=Number(volumeInput.value)/100;
  masterGain.gain.setTargetAtTime(state.muted?0:normalized*.38,audioContext.currentTime,.015);
}
function frequencyForPc(pc,octaveShift=0){const midi=60+pc+octaveShift;return 440*Math.pow(2,(midi-69)/12);}
function voice(pc,when,isRoot){
  if(!audioContext||!masterGain||state.muted) return;
  const duration=Number(lengthInput.value)/1000, tone=toneInput.value, frequency=frequencyForPc(pc,isRoot?-12:0), end=when+duration;
  if(tone==='bell'){
    [{ratio:1,gain:isRoot?.24:.19},{ratio:2.01,gain:.07},{ratio:3.98,gain:.025}].forEach((part,index)=>{
      const osc=audioContext.createOscillator(), gain=audioContext.createGain();
      osc.type='sine'; osc.frequency.setValueAtTime(frequency*part.ratio,when);
      gain.gain.setValueAtTime(.0001,when); gain.gain.exponentialRampToValueAtTime(part.gain,when+.008+index*.002); gain.gain.exponentialRampToValueAtTime(.0001,end+index*.035);
      osc.connect(gain); gain.connect(masterGain); osc.start(when); osc.stop(end+.08+index*.035);
    }); return;
  }
  const osc=audioContext.createOscillator(), gain=audioContext.createGain();
  osc.type=tone==='soft'?'triangle':'sine'; osc.frequency.setValueAtTime(frequency,when);
  gain.gain.setValueAtTime(.0001,when); gain.gain.exponentialRampToValueAtTime(isRoot?.20:(tone==='soft'?.16:.14),when+.012); gain.gain.exponentialRampToValueAtTime(.0001,end);
  osc.connect(gain); gain.connect(masterGain); osc.start(when); osc.stop(end+.04);
}
function updateRootReadout(){
  if(state.active!=='triangle'){rootReadout.hidden=true;return;}
  rootReadout.hidden=false;
  rootReadout.innerHTML='<strong>A root:</strong> '+pitchNames[state.rootPc]+' · A is voiced one octave lower when it strikes, so the root remains audible inside the three-stream rhythm.';
}
function render(){
  if(!state.active) return;
  const def=shapes[state.active], pts=[];
  layer.replaceChildren();
  const polygon=svgEl('polygon',{class:'ph-special-shape'});
  def.offsets.forEach((offset,i)=>{
    const p=pointAt(state.phase+offset); pts.push(`${p.x.toFixed(2)},${p.y.toFixed(2)}`);
    const vertex=svgEl('circle',{class:'ph-special-vertex'+(state.active==='triangle'&&i===0?' root':''),cx:p.x.toFixed(2),cy:p.y.toFixed(2),r:state.active==='triangle'&&i===0?8:7});
    layer.appendChild(vertex);
    if(def.labels[i]){
      const lp=pointAt(state.phase+offset);
      const label=svgEl('text',{class:'ph-special-vlabel',x:lp.x.toFixed(2),y:(lp.y-15).toFixed(2)});
      label.textContent=def.labels[i]; layer.appendChild(label);
    }
  });
  polygon.setAttribute('points',pts.join(' ')); layer.insertBefore(polygon,layer.firstChild);
  centerNumber.textContent=def.center;
}
function updateCopy(){
  if(!state.active) return;
  const def=shapes[state.active];
  stageTitle.textContent=def.stage; patternTitle.textContent=def.title; patternDetail.textContent=def.detail;
  togetherOut.textContent=def.together; strikesOut.textContent=def.strikes; contactsOut.textContent=def.contacts;
  lawTitle.textContent=state.active==='golden'?'For the golden rectangle':'For the 21–55–64 triangle';
  lawText.textContent=def.law; updateRootReadout();
}
function updatePlayUI(){
  playBtn.textContent=state.playing?'Pause rotation':'Start rotation';
  modeText.textContent=state.playing?'Rotating':(state.drag?'Dragging':'Paused');
  modePill.classList.toggle('is-playing',state.playing);
}
function setSpecialPressed(key){specialButtons.forEach(b=>b.setAttribute('aria-pressed',b.dataset.phSpecial===key?'true':'false'));}
function baseIsPlaying(){return /^Pause rotation/i.test(playBtn.textContent);}
function enterSpecial(key){
  const wasSpecial=!!state.active, keepPlaying=wasSpecial?state.playing:baseIsPlaying();
  if(!wasSpecial&&baseIsPlaying()){state.resumeBase=true;playBtn.click();}
  state.active=key;
  if(!wasSpecial){state.phase=0;state.rootPc=0;}
  basePolygon.style.display='none'; baseVertexLayer.style.display='none'; layer.style.display='';
  setSpecialPressed(key); updateCopy(); render(); eventVisual.textContent='—';
  if(keepPlaying) startSpecial(); else updatePlayUI();
}
function exitSpecial(resume){
  if(!state.active) return;
  stopSpecial(false); state.active=null; state.drag=null; layer.style.display='none';
  basePolygon.style.display=''; baseVertexLayer.style.display=''; rootReadout.hidden=true; setSpecialPressed('');
  if(resume||state.resumeBase){state.resumeBase=false;setTimeout(()=>{if(!baseIsPlaying()) playBtn.click();},0);}
}
function collectCrossings(prev,next){
  if(!state.active) return [];
  const def=shapes[state.active], delta=next-prev; if(Math.abs(delta)<1e-10) return [];
  const positive=delta>0, events=[];
  def.offsets.forEach((offset,vertex)=>{
    const oldAngle=prev+offset,newAngle=next+offset;
    for(let noteIndex=0;noteIndex<12;noteIndex++){
      const target=noteIndex*TAU/12; let crossing;
      if(positive){
        const turn=Math.floor((oldAngle-target)/TAU)+1; crossing=target+turn*TAU; if(crossing>newAngle+1e-9) continue;
      }else{
        const turn=Math.ceil((oldAngle-target)/TAU)-1; crossing=target+turn*TAU; if(crossing<newAngle-1e-9) continue;
      }
      const fraction=(crossing-oldAngle)/delta; if(fraction<-1e-8||fraction>1+1e-8) continue;
      events.push({fraction:Math.max(0,Math.min(1,fraction)),noteIndex,pc:circleNotes[noteIndex].pc,vertex});
    }
  });
  events.sort((a,b)=>a.fraction-b.fraction||a.noteIndex-b.noteIndex||a.vertex-b.vertex); return events;
}
function triggerCrossings(prev,next,spanSeconds){
  const events=collectCrossings(prev,next); if(!events.length) return;
  const groups=[];
  events.forEach(ev=>{
    const last=groups[groups.length-1];
    if(!last||Math.abs(last.fraction-ev.fraction)>1e-5) groups.push({fraction:ev.fraction,events:[ev]});
    else last.events.push(ev);
  });
  groups.forEach(group=>{
    const delay=Math.max(0,spanSeconds||0)*group.fraction;
    const when=audioContext?audioContext.currentTime+Math.max(.004,delay):0;
    const labels=[];
    group.events.forEach(ev=>{
      const isRoot=state.active==='triangle'&&ev.vertex===0;
      if(isRoot){state.rootPc=ev.pc; updateRootReadout();}
      if(audioContext) voice(ev.pc,when,isRoot);
      const vertexName=state.active==='triangle'?shapes.triangle.labels[ev.vertex]:'';
      labels.push((vertexName?vertexName+(isRoot?' root':'')+': ':'')+pitchNames[ev.pc]);
      const node=wheel.querySelector(`[data-note-index="${ev.noteIndex}"]`);
      if(node){
        setTimeout(()=>{node.classList.add('is-hit'); if(flashTimers.has(node)) clearTimeout(flashTimers.get(node)); flashTimers.set(node,setTimeout(()=>{node.classList.remove('is-hit');flashTimers.delete(node);},150));},delay*1000);
      }
    });
    setTimeout(()=>{eventVisual.textContent=labels.join(' · ');},delay*1000);
  });
}
function frame(ts){
  if(!state.playing||!state.active){state.raf=null;return;}
  if(state.lastFrame==null) state.lastFrame=ts;
  const elapsed=Math.min(.05,Math.max(0,(ts-state.lastFrame)/1000)); state.lastFrame=ts;
  if(elapsed>0){const prev=state.phase,next=prev+state.rpm*TAU/60*elapsed*state.direction;triggerCrossings(prev,next,elapsed);state.phase=next;render();}
  state.raf=requestAnimationFrame(frame);
}
async function startSpecial(){await ensureAudio(); if(!state.active)return; state.playing=true;state.lastFrame=null;updatePlayUI();if(!state.raf)state.raf=requestAnimationFrame(frame);}
function stopSpecial(update=true){state.playing=false;state.lastFrame=null;if(state.raf){cancelAnimationFrame(state.raf);state.raf=null;}if(update)updatePlayUI();}
function pointerAngle(event){const r=wheel.getBoundingClientRect(),x=(event.clientX-r.left)/r.width*720,y=(event.clientY-r.top)/r.height*720;return Math.atan2(x-CX,-(y-CY));}
function normalizeDelta(d){if(d>Math.PI)return d-TAU;if(d<-Math.PI)return d+TAU;return d;}

specialButtons.forEach(btn=>btn.addEventListener('click',()=>enterSpecial(btn.dataset.phSpecial)));

shapeGrid.addEventListener('click',event=>{
  const btn=event.target.closest('.ph-shape-btn'); if(!btn||!state.active)return;
  const resume=state.playing||state.resumeBase; exitSpecial(resume);
},true);

playBtn.addEventListener('click',event=>{
  if(!state.active)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(state.playing) stopSpecial(); else startSpecial();
},true);
resetBtn.addEventListener('click',event=>{
  if(!state.active)return;
  event.preventDefault();event.stopImmediatePropagation();
  state.phase=0;state.rootPc=0;eventVisual.textContent='—';updateRootReadout();render();
},true);
counterBtn.addEventListener('click',()=>{state.direction=-1;});
clockBtn.addEventListener('click',()=>{state.direction=1;});
speedInput.addEventListener('input',()=>{state.rpm=Number(speedInput.value)||3;});
volumeInput.addEventListener('input',()=>{if(audioContext)updateMasterGain();});
muteBtn.addEventListener('click',()=>{setTimeout(()=>{state.muted=muteBtn.getAttribute('aria-pressed')==='true';if(audioContext)updateMasterGain();},0);});

stageWrap.addEventListener('pointerdown',async event=>{
  if(!state.active)return;
  if(event.button!=null&&event.button!==0)return;
  event.preventDefault();event.stopImmediatePropagation();await ensureAudio();
  const resume=state.playing;if(resume)stopSpecial();
  state.drag={pointerId:event.pointerId,angle:pointerAngle(event),resume};
  stageWrap.classList.add('is-dragging');try{stageWrap.setPointerCapture(event.pointerId);}catch(_e){}updatePlayUI();
},true);
stageWrap.addEventListener('pointermove',event=>{
  if(!state.active||!state.drag||state.drag.pointerId!==event.pointerId)return;
  event.preventDefault();event.stopImmediatePropagation();
  const nextPointer=pointerAngle(event),move=normalizeDelta(nextPointer-state.drag.angle);state.drag.angle=nextPointer;if(Math.abs(move)<1e-8)return;
  const prev=state.phase,next=prev+move;triggerCrossings(prev,next,0);state.phase=next;render();
},true);
function finishDrag(event){
  if(!state.active||!state.drag||state.drag.pointerId!==event.pointerId)return;
  event.preventDefault();event.stopImmediatePropagation();const resume=state.drag.resume;state.drag=null;stageWrap.classList.remove('is-dragging');
  try{stageWrap.releasePointerCapture(event.pointerId);}catch(_e){}if(resume)startSpecial();else updatePlayUI();
}
stageWrap.addEventListener('pointerup',finishDrag,true);stageWrap.addEventListener('pointercancel',finishDrag,true);
document.addEventListener('keydown',event=>{
  if(!state.active)return;const target=event.target,isField=target&&/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(target.tagName);
  if(event.code==='Space'&&!isField){event.preventDefault();event.stopImmediatePropagation();if(state.playing)stopSpecial();else startSpecial();}
},true);

window.RelphiPolygonSpecialShapes={
  shapes,
  triangleCentralOffsetsDegrees:[0,triangleB/DEG,triangleC/DEG],
  goldenArcDegrees:[goldenSmall/DEG,180-goldenSmall/DEG]
};
})();