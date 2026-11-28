// Closed zodiac fifths: 12 identical log-frequency steps must span 7 octaves.
// The geometric sign index fixes the relative pitch, never an absolute frequency.
// 220 Hz at the zero index is a conventional playback calibration (not an astrological claim).
(function(){
'use strict';
const modulo=(n,m)=>((n%m)+m)%m;
const reference=220;
const signValid=n=>Number.isInteger(n)&&n>=0&&n<12;
const fifthSteps=7;
function sequence(root,connected){
  if(!signValid(root))return [];
  const rootHz=reference*2**(modulo(fifthSteps*root,12)/12);
  return [root,...Array.from(new Set(connected)).filter(n=>signValid(n)&&n!==root).sort((a,b)=>modulo(a-root,12)-modulo(b-root,12))]
    .map(sign=>({sign,frequency:rootHz*2**(modulo(fifthSteps*(sign-root),12)/12)}));
}
let context=null,enabled=false,active=[],generation=0,lastKey='';
function stop(){
  generation++;lastKey='';
  for(const voice of active){try{voice.gain.gain.cancelScheduledValues(context.currentTime);voice.gain.gain.setTargetAtTime(0,context.currentTime,.008);voice.osc.stop(context.currentTime+.04)}catch(_){}}
  active=[];
}
async function toggle(){
  if(enabled){enabled=false;stop();return false}
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)return false;
  try{context ||= new Audio();await context.resume();enabled=context.state==='running'}catch(_){enabled=false}
  return enabled;
}
function play(root,connected){
  if(!enabled||context?.state!=='running')return;
  const notes=sequence(root,connected);if(!notes.length)return;
  const key=notes.map(note=>note.sign).join(',');
  if(lastKey===key)return;
  stop();lastKey=key;
  const token=generation;
  const start=context.currentTime+.012,spacing=.09,duration=.14;
  for(let i=0;i<notes.length;i++){
    const osc=context.createOscillator(),gain=context.createGain(),t=start+i*spacing,end=t+duration;
    osc.type='sine';osc.frequency.setValueAtTime(notes[i].frequency,t);
    gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.075,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,end-.006);gain.gain.linearRampToValueAtTime(0,end);
    osc.connect(gain);gain.connect(context.destination);const voice={osc,gain};active.push(voice);
    osc.onended=()=>{osc.disconnect();gain.disconnect();active=active.filter(item=>item!==voice);if(!active.length&&generation===token)lastKey='';};
    osc.start(t);osc.stop(end);
  }
}
window.RelphiSkyCoreTones=Object.freeze({sequence,play,stop,toggle,get enabled(){return enabled}});
})();
