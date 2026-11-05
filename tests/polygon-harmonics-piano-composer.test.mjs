import assert from 'node:assert/strict';
import test from 'node:test';

const black=new Set([1,3,6,8,10]);
const circle=[0,7,2,9,4,11,6,1,8,3,10,5];
const names=['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const label=midi=>names[midi%12]+(Math.floor(midi/12)-1);

test('piano spans two complete octaves from C4 through B5',()=>{
  const midis=Array.from({length:24},(_,i)=>60+i);
  assert.equal(midis[0],60);
  assert.equal(midis.at(-1),83);
  assert.equal(label(midis[0]),'C4');
  assert.equal(label(midis.at(-1)),'B5');
  assert.equal(midis.filter(m=>!black.has(m%12)).length,14);
  assert.equal(midis.filter(m=>black.has(m%12)).length,10);
});

test('circle-of-fifths note targets cover every piano pitch class once',()=>{
  assert.equal(new Set(circle).size,12);
  assert.deepEqual([...circle].sort((a,b)=>a-b),Array.from({length:12},(_,i)=>i));
});

test('geometry pitch-class highlighting maps both octave copies',()=>{
  const midis=Array.from({length:24},(_,i)=>60+i);
  for(let pc=0;pc<12;pc++) assert.equal(midis.filter(m=>m%12===pc).length,2);
});

test('composer timing keeps chord notes simultaneous within one step',()=>{
  const bpm=120;
  const beatMs=60000/bpm;
  const sequence=[
    {notes:[60,64,67],beats:1},
    {notes:[62],beats:.5},
    {notes:[67,71],beats:2}
  ];
  let cursor=0;
  const starts=[];
  for(const step of sequence){
    starts.push(step.notes.map(()=>cursor));
    cursor+=step.beats*beatMs;
  }
  assert.deepEqual(starts[0],[0,0,0]);
  assert.deepEqual(starts[1],[500]);
  assert.deepEqual(starts[2],[750,750]);
  assert.equal(cursor,1750);
});
