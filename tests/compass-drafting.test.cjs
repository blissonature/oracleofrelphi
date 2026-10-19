const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'drafting-studio.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const STORAGE_KEY = 'relphi-compass-drafting-v1';

class FakeElement {
  constructor(id='') {
    this.id=id; this.children=[]; this.handlers={}; this.attrs={}; this.style={};
    this.dataset={}; this.value=''; this.checked=false; this.disabled=false;
    this.textContent=''; this.innerHTML='';
  }
  addEventListener(type,fn){ (this.handlers[type]??=[]).push(fn); }
  emit(type,event={}){ for(const fn of this.handlers[type]||[]) fn(event); }
  click(){this.emit('click',{target:this,preventDefault(){}});}
  appendChild(n){this.children.push(n);return n;}
  replaceChildren(...n){this.children=n;}
  setAttribute(k,v){this.attrs[k]=String(v);}
  getAttribute(k){return this.attrs[k];}
  remove(){}
  getBoundingClientRect(){return {width:1100,height:740};}
  createSVGPoint(){return {x:0,y:0,matrixTransform(){return {x:this.x,y:this.y};}};}
  getScreenCTM(){return {inverse(){return {};}};}
  setPointerCapture(){}
  hasPointerCapture(){return true;}
  releasePointerCapture(){}
}

function mount(persisted) {
  const nodes=new Map();
  const get=id=>{if(!nodes.has(id))nodes.set(id,new FakeElement(id));return nodes.get(id);};
  const swatches=['#2347ca','#292a30','#dc1f18'].map(color=>{const n=new FakeElement();n.dataset.color=color;return n;});
  const doc={
    body:new FakeElement('body'), getElementById:get,
    querySelectorAll:q=>q==='.swatch'?swatches:[],
    createElementNS:(namespace,name)=>new FakeElement(name),
    createDocumentFragment:()=>new FakeElement('fragment'),
    createElement:name=>new FakeElement(name),addEventListener(){}
  };
  const data=new Map(persisted ? [[STORAGE_KEY,persisted]] : []);
  const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
  const browser={innerWidth:1100,addEventListener(){}};
  new Function('document','window','localStorage','requestAnimationFrame','confirm',script)(
    doc,browser,storage,cb=>cb(),()=>true
  );
  const state=()=>JSON.parse(data.get(STORAGE_KEY)||'null');
  const event=(name,x,y,pointerId)=>({
    button:0,pointerId,clientX:x,clientY:y,preventDefault(){},
    target:{closest(){return {dataset:{handle:name}};}}
  });
  const drag=(name,start,end,pointerId=1)=>{
    const svg=get('sheet');
    svg.emit('pointerdown',event(name,start.x,start.y,pointerId));
    svg.emit('pointermove',event(name,end.x,end.y,pointerId));
    svg.emit('pointerup',event(name,end.x,end.y,pointerId));
  };
  return {get,state,drag,data,swatches};
}
function radii(points,c){return points.map(p=>Math.hypot(p.x-c.x,p.y-c.y));}
function near(a,b,tol=.08){assert.ok(Math.abs(a-b)<=tol, a+' not within '+tol+' of '+b);}

test('standalone script parses and all four handle roles are present',()=>{
 assert.ok(script);
 assert.doesNotThrow(()=>new Function(script));
 for(const handle of ['pivot','left','holder','pen']) assert.match(script,new RegExp('"'+handle+'"'));
 assert.match(html,/Export SVG/);
 assert.match(html,/Export PNG/);
});
test('exact circle, polygon/star, and undo/redo',()=>{
 const t=mount();
 assert.match(t.get('counter').textContent,/0 marks/);
 t.get('circle').click();
 let state=t.state();
 assert.equal(state.strokes.length,1);
 let values=radii(state.strokes[0].points,state.c);
 for(const r of values)near(r,180);
 t.get('star').click();
 state=t.state();
 assert.equal(state.strokes.length,2);
 assert.equal(state.strokes[1].points.length,6);
 const star=state.strokes[1].points;
 near(star[0].x,star[5].x);near(star[0].y,star[5].y);
 t.get('undo').click();assert.equal(t.state().strokes.length,1);
 t.get('redo').click();assert.equal(t.state().strokes.length,2);
});
test('right point moves with no mark, left point rotates without drawing, holder changes diameter',()=>{
 const t=mount();
 t.get('circle').click();
 const before=t.state();
 t.drag('pivot',{x:550,y:390},{x:580,y:420});
 let now=t.state();
 assert.equal(now.strokes.length,before.strokes.length);
 near(now.c.x,580);near(now.c.y,420);
 const angle=now.a;
 t.drag('left',{x:500,y:540},{x:490,y:495});
 now=t.state();
 assert.equal(now.strokes.length,1);
 assert.notEqual(now.a,angle);
 const r=now.r, p={x:now.c.x+now.r*.8*Math.cos(now.a),y:now.c.y+now.r*.8*Math.sin(now.a)};
 t.drag('holder',p,p);
 now=t.state();
 assert.equal(now.strokes.length,1);
 assert.ok(now.r>r);
});
test('pencil drag creates a mark and no mark on mere placement',()=>{
 const t=mount(),c={x:550,y:390},r=180;
 const start={x:c.x+r*Math.cos(-.61),y:c.y+r*Math.sin(-.61)};
 const end={x:c.x+r*Math.cos(.2),y:c.y+r*Math.sin(.2)};
 t.drag('pen',start,end);
 const s=t.state();
 assert.equal(s.strokes.length,1);
 assert.ok(s.strokes[0].points.length>10);
 for(const radius of radii(s.strokes[0].points,s.c))near(radius,r);
});
test('precision spiral changes radius by pitch after one full revolution',()=>{
 const t=mount();
 t.get('spiral').checked=true;
 t.get('spiral').emit('change',{target:t.get('spiral')});
 t.get('revolution').click();
 const s=t.state();
 assert.equal(s.strokes.length,1);
 const rs=radii(s.strokes[0].points,s.c);
 near(rs[0],180);near(rs.at(-1),222);
 near(s.r,222);
 near(s.a,-.61);
});
test('sample construction and browser restoration preserve the drawing',()=>{
 const t=mount();
 t.get('sample').click();
 const sample=t.state();
 assert.ok(sample.strokes.length>=5);
 const second=mount(t.data.get(STORAGE_KEY));
 assert.equal(second.state().strokes.length,sample.strokes.length);
 second.get('clear').click();
 assert.equal(second.state().strokes.length,0);
 second.get('undo').click();
 assert.equal(second.state().strokes.length,sample.strokes.length);
});
