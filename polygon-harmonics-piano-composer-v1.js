(function(){
'use strict';
if(window.__relphiPianoDockV2)return;
window.__relphiPianoDockV2=true;
const stage=document.getElementById('phStageWrap');
const stageCard=stage?.closest('.ph-stage-card');
const noteLayer=document.getElementById('phNoteLayer');
const volume=document.getElementById('phVolume');
if(!stage||!stageCard||!noteLayer)return;

const pitchClassNames=['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const keyNames=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const circlePitchClasses=[0,7,2,9,4,11,6,1,8,3,10,5];
const blackPitchClasses=new Set([1,3,6,8,10]);

const style=document.createElement('style');
style.textContent=`
.ph-stage-wrap{border-radius:1rem 1rem 0 0!important;border-bottom:0!important}
.ph-piano-dock{border:1px solid rgba(255,255,255,.16);border-top:1px solid rgba(247,201,72,.24);border-radius:0 0 1rem 1rem;background:linear-gradient(180deg,#18101c,#0b080d);color:#fff;padding:.62rem .7rem .72rem;text-align:left;box-shadow:inset 0 10px 24px rgba(0,0,0,.18)}
.ph-piano-top{display:flex;align-items:center;justify-content:space-between;gap:.6rem;margin-bottom:.48rem}.ph-piano-title{display:flex;align-items:baseline;gap:.5rem;min-width:0}.ph-piano-title strong{font-size:.88rem;letter-spacing:.04em}.ph-piano-title span{font-size:.7rem;color:rgba(255,255,255,.6);white-space:nowrap}.ph-piano-live{font-size:.72rem;color:#f7c948;min-width:88px;text-align:right;white-space:nowrap}
.ph-compose-row{display:grid;grid-template-columns:82px 118px auto 1fr;gap:.38rem;align-items:center;margin-bottom:.45rem}.ph-compose-row input,.ph-compose-row select,.ph-compose-row button{font:inherit}.ph-compose-row input,.ph-compose-row select{width:100%;min-height:30px;border:1px solid rgba(255,255,255,.2);border-radius:.48rem;background:#241b27;color:#fff;padding:.28rem .38rem}.ph-chord-toggle{display:flex;align-items:center;gap:.28rem;font-size:.72rem;color:rgba(255,255,255,.8);white-space:nowrap}.ph-mini-actions{display:flex;gap:.28rem;justify-content:flex-end;flex-wrap:wrap}.ph-mini-actions button{appearance:none;border:1px solid rgba(255,255,255,.2);background:#2a202d;color:#fff;border-radius:.48rem;padding:.3rem .42rem;cursor:pointer;font-weight:700;font-size:.7rem}.ph-mini-actions button.primary{background:#dc1f18;border-color:#dc1f18}.ph-mini-actions button:disabled{opacity:.4;cursor:default}
.ph-seq-line{display:flex;gap:.25rem;align-items:center;overflow-x:auto;min-height:31px;margin-bottom:.45rem;padding:.25rem .3rem;border:1px solid rgba(255,255,255,.12);border-radius:.5rem;background:rgba(255,255,255,.035)}.ph-seq-empty{font-size:.69rem;color:rgba(255,255,255,.48);padding-left:.15rem}.ph-seq-step{appearance:none;flex:0 0 auto;border:1px solid rgba(255,255,255,.18);background:#2b222e;color:#fff;border-radius:.42rem;padding:.24rem .36rem;cursor:pointer;text-align:left}.ph-seq-step b{display:block;font-size:.7rem;line-height:1.1}.ph-seq-step small{display:block;font-size:.58rem;color:rgba(255,255,255,.55)}.ph-seq-step.sel{outline:1px solid #f7c948}.ph-seq-step.playing{background:#5b241f;border-color:#f7c948}
.ph-keys-wrap{overflow-x:auto}.ph-keys{position:relative;min-width:720px;height:104px;border-radius:.48rem;overflow:hidden;background:#080609;border:1px solid rgba(255,255,255,.2)}.ph-whites{display:flex;height:100%}.ph-key{appearance:none;font:inherit;cursor:pointer;touch-action:manipulation;user-select:none}.ph-key span{font-size:.56rem;opacity:.72;pointer-events:none}.ph-white{flex:1;border:0;border-right:1px solid #b7aaa7;background:#fffaf6;color:#493936;display:flex;align-items:flex-end;justify-content:center;padding:0 0 .32rem}.ph-black{position:absolute;top:0;height:63%;width:5.1%;margin-left:-2.55%;border:0;border-radius:0 0 .24rem .24rem;background:#241b1a;color:#fff;z-index:3;display:flex;align-items:flex-end;justify-content:center;padding:0 0 .25rem}.ph-key.geo{background:#f3c8c2!important;color:#4b1c18!important;box-shadow:inset 0 -6px 0 rgba(220,31,24,.55)}.ph-black.geo{background:#9f1d1b!important;color:#fff!important}.ph-key.me{background:#f7c948!important;color:#241815!important;box-shadow:inset 0 -6px 0 rgba(159,29,27,.45)}
@media(max-width:720px){.ph-compose-row{grid-template-columns:72px 104px auto}.ph-mini-actions{grid-column:1/-1;justify-content:flex-start}.ph-piano-title span{display:none}.ph-keys{min-width:650px}}
`;
document.head.appendChild(style);

const dock=document.createElement('div');
dock.className='ph-piano-dock';
dock.id='phPianoComposer';
dock.innerHTML=`
<div class="ph-piano-top"><div class="ph-piano-title"><strong>PIANO / COMPOSER</strong><span>geometry lights the keys · click keys to write</span></div><div class="ph-piano-live" id="phPianoLive">waiting</div></div>
<div class="ph-compose-row">
  <input id="phPianoTempo" type="number" min="30" max="240" value="96" aria-label="Composition tempo">
  <select id="phPianoDur" aria-label="New note duration"><option value="0.5">⅛ eighth</option><option value="1" selected>¼ quarter</option><option value="2">½ half</option><option value="4">1 whole</option></select>
  <label class="ph-chord-toggle"><input id="phPianoChord" type="checkbox"> chord</label>
  <div class="ph-mini-actions"><button id="phPianoNext" type="button">Next</button><button id="phPianoPlay" type="button" class="primary">▶ Play</button><button id="phPianoStop" type="button">■</button><button id="phPianoUndo" type="button">Undo</button><button id="phPianoDelete" type="button">Delete</button><button id="phPianoClear" type="button">Clear</button></div>
</div>
<div class="ph-seq-line" id="phPianoSequence"></div>
<div class="ph-keys-wrap"><div class="ph-keys" id="phPianoKeys" role="group" aria-label="Piano keyboard C4 through B5"><div class="ph-whites" id="phPianoWhites"></div></div></div>`;
stage.insertAdjacentElement('afterend',dock);

const keys=dock.querySelector('#phPianoKeys');
const whites=dock.querySelector('#phPianoWhites');
const live=dock.querySelector('#phPianoLive');
const tempo=dock.querySelector('#phPianoTempo');
const duration=dock.querySelector('#phPianoDur');
const chord=dock.querySelector('#phPianoChord');
const sequenceEl=dock.querySelector('#phPianoSequence');
const playBtn=dock.querySelector('#phPianoPlay');
const stopBtn=dock.querySelector('#phPianoStop');
const undoBtn=dock.querySelector('#phPianoUndo');
const deleteBtn=dock.querySelector('#phPianoDelete');
const clearBtn=dock.querySelector('#phPianoClear');
const nextBtn=dock.querySelector('#phPianoNext');

const keysByMidi=new Map();
const keysByPc=new Map(Array.from({length:12},(_,i)=>[i,[]]));
const whiteMidis=[];
for(let midi=60;midi<=83;midi++)if(!blackPitchClasses.has(midi%12))whiteMidis.push(midi);
const whiteIndex=new Map(whiteMidis.map((m,i)=>[m,i]));
const noteLabel=midi=>keyNames[midi%12]+(Math.floor(midi/12)-1);
function makeKey(midi,type,left){
  const button=document.createElement('button');
  button.type='button';button.className='ph-key ph-'+type;button.dataset.midi=midi;button.dataset.pc=midi%12;button.setAttribute('aria-label',noteLabel(midi));
  if(type==='black')button.style.left=left+'%';
  button.innerHTML='<span>'+noteLabel(midi)+'</span>';
  button.addEventListener('click',()=>enterNote(midi));
  keysByMidi.set(midi,button);keysByPc.get(midi%12).push(button);return button;
}
whiteMidis.forEach(m=>whites.appendChild(makeKey(m,'white')));
for(let midi=60;midi<=83;midi++)if(blackPitchClasses.has(midi%12)){
  let previous=midi-1;while(blackPitchClasses.has(previous%12))previous--;
  keys.appendChild(makeKey(midi,'black',((whiteIndex.get(previous)+1)/whiteMidis.length)*100));
}

const state={sequence:[],openChord:null,selected:null,playing:false,timers:[],sources:new Set(),flashes:[],suppress:new Set()};
let audioContext=null,masterGain=null;
async function ensureAudio(){
  const AudioCtor=window.AudioContext||window.webkitAudioContext;if(!AudioCtor)return false;
  if(!audioContext){audioContext=new AudioCtor;masterGain=audioContext.createGain();masterGain.connect(audioContext.destination);updateGain()}
  if(audioContext.state==='suspended')await audioContext.resume();return true;
}
function updateGain(){if(!audioContext||!masterGain)return;masterGain.gain.setTargetAtTime(Math.max(.02,(volume?Number(volume.value)/100:.55)*.32),audioContext.currentTime,.01)}
volume?.addEventListener('input',updateGain);
function playVoice(midi,when,length=.28){if(!audioContext||!masterGain)return;const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='triangle';osc.frequency.setValueAtTime(440*Math.pow(2,(midi-69)/12),when);gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(.16,when+.012);gain.gain.exponentialRampToValueAtTime(.0001,when+Math.max(.08,length));osc.connect(gain);gain.connect(masterGain);state.sources.add(osc);osc.addEventListener('ended',()=>state.sources.delete(osc),{once:true});osc.start(when);osc.stop(when+Math.max(.12,length)+.03)}
function flashExact(midi,ms=180){const key=keysByMidi.get(midi);if(!key)return;key.classList.add('me');state.flashes.push(setTimeout(()=>key.classList.remove('me'),ms))}
function flashWheel(pc,ms=180){const noteIndex=circlePitchClasses.indexOf(pc),node=noteLayer.querySelector('[data-note-index="'+noteIndex+'"]');if(!node)return;state.suppress.add(node);node.classList.add('is-hit');state.flashes.push(setTimeout(()=>{node.classList.remove('is-hit');state.suppress.delete(node)},ms))}
function announce(text){live.textContent=text;clearTimeout(announce.timer);announce.timer=setTimeout(()=>{if(!state.playing)live.textContent='waiting'},750)}
async function enterNote(midi){
  await ensureAudio();if(audioContext)playVoice(midi,audioContext.currentTime+.005,.28);flashExact(midi);flashWheel(midi%12);announce(noteLabel(midi));
  const beats=Number(duration.value)||1;
  if(chord.checked){
    if(state.openChord==null||!state.sequence[state.openChord]){state.sequence.push({notes:[midi],beats});state.openChord=state.sequence.length-1}
    else{const step=state.sequence[state.openChord];if(!step.notes.includes(midi))step.notes.push(midi);step.notes.sort((a,b)=>a-b);step.beats=beats}
    state.selected=state.openChord;
  }else{state.openChord=null;state.sequence.push({notes:[midi],beats});state.selected=state.sequence.length-1}
  renderSequence();
}
function durationLabel(beats){return beats===.5?'⅛':beats===1?'¼':beats===2?'½':beats===4?'1':'×'+beats}
function renderSequence(){
  sequenceEl.replaceChildren();
  if(!state.sequence.length){const empty=document.createElement('span');empty.className='ph-seq-empty';empty.textContent='Click a key to place the first note.';sequenceEl.appendChild(empty)}
  else state.sequence.forEach((step,index)=>{const button=document.createElement('button');button.type='button';button.className='ph-seq-step'+(index===state.selected?' sel':'');button.dataset.index=index;button.innerHTML='<b>'+step.notes.map(noteLabel).join('+')+'</b><small>'+durationLabel(step.beats)+(step.notes.length>1?' · chord':'')+'</small>';button.addEventListener('click',()=>{state.selected=index;state.openChord=chord.checked?index:null;duration.value=String(step.beats);renderSequence()});sequenceEl.appendChild(button)});
  playBtn.disabled=!state.sequence.length;undoBtn.disabled=!state.sequence.length;clearBtn.disabled=!state.sequence.length;deleteBtn.disabled=state.selected==null||!state.sequence[state.selected];
}
function stopPlayback(){state.playing=false;state.timers.forEach(clearTimeout);state.timers=[];state.sources.forEach(source=>{try{source.stop()}catch(_error){}});state.sources.clear();sequenceEl.querySelectorAll('.playing').forEach(el=>el.classList.remove('playing'));keysByMidi.forEach(key=>key.classList.remove('me'));live.textContent='stopped'}
async function playSequence(){
  if(!state.sequence.length)return;stopPlayback();await ensureAudio();state.playing=true;live.textContent='playing';
  const beatMs=60000/Math.max(30,Math.min(240,Number(tempo.value)||96));let elapsed=0;
  state.sequence.forEach((step,index)=>{const stepMs=step.beats*beatMs;state.timers.push(setTimeout(()=>{if(!state.playing)return;sequenceEl.querySelectorAll('.playing').forEach(el=>el.classList.remove('playing'));sequenceEl.querySelector('[data-index="'+index+'"]').classList.add('playing');const now=audioContext.currentTime+.005;step.notes.forEach(midi=>{playVoice(midi,now,Math.max(.12,stepMs/1000*.82));flashExact(midi,Math.min(650,stepMs*.85));flashWheel(midi%12,Math.min(650,stepMs*.85))});announce(step.notes.map(noteLabel).join(' + '))},elapsed));elapsed+=stepMs});
  state.timers.push(setTimeout(()=>{state.playing=false;sequenceEl.querySelectorAll('.playing').forEach(el=>el.classList.remove('playing'));live.textContent='done'},elapsed+40));
}
nextBtn.addEventListener('click',()=>{state.openChord=null;state.selected=null;renderSequence()});
playBtn.addEventListener('click',playSequence);stopBtn.addEventListener('click',stopPlayback);
undoBtn.addEventListener('click',()=>{if(!state.sequence.length)return;const last=state.sequence[state.sequence.length-1];if(chord.checked&&state.openChord===state.sequence.length-1&&last.notes.length>1)last.notes.pop();else state.sequence.pop();state.openChord=null;state.selected=state.sequence.length?state.sequence.length-1:null;renderSequence()});
deleteBtn.addEventListener('click',()=>{if(state.selected==null)return;state.sequence.splice(state.selected,1);state.selected=null;state.openChord=null;renderSequence()});
clearBtn.addEventListener('click',()=>{stopPlayback();state.sequence=[];state.selected=null;state.openChord=null;renderSequence()});
chord.addEventListener('change',()=>{if(!chord.checked)state.openChord=null});

function syncGeometry(node){
  if(state.suppress.has(node))return;
  const noteIndex=Number(node.dataset.noteIndex),pc=circlePitchClasses[noteIndex];if(pc==null)return;
  const active=node.classList.contains('is-hit');keysByPc.get(pc).forEach(key=>key.classList.toggle('geo',active));if(active)announce(pitchClassNames[pc]);
}
const observer=new MutationObserver(records=>records.forEach(record=>syncGeometry(record.target)));
noteLayer.querySelectorAll('.ph-note-node').forEach(node=>observer.observe(node,{attributes:true,attributeFilter:['class']}));

renderSequence();
window.RelphiPianoComposer={version:2,getSequence:()=>state.sequence.map(step=>({notes:[...step.notes],beats:step.beats})),setSequence(input){stopPlayback();state.sequence=(Array.isArray(input)?input:[]).map(step=>({notes:(Array.isArray(step.notes)?step.notes:[]).map(Number).filter(Number.isFinite),beats:Math.max(.125,Number(step.beats)||1)})).filter(step=>step.notes.length);state.selected=null;state.openChord=null;renderSequence()},play:playSequence,stop:stopPlayback,addMidi:enterNote};
})();
