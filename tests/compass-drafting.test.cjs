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

test('every snap is optional, independent, and off by default',()=>{
 const t=mount();const keys=['snapGrid','snapGeometry','snap','snapRadius'];
 for(const key of keys)assert.equal(Boolean(t.get(key).checked),false,key+' must start off');
 t.get('snapGrid').checked=true;
 t.get('snapGrid').emit('change',{target:t.get('snapGrid')});
 assert.equal(t.state().snapGrid,true);
 assert.equal(t.state().snapGeometry,false);
 assert.equal(t.state().snapRadius,false);
 const reopened=mount(t.data.get(STORAGE_KEY));
 assert.equal(reopened.get('snapGrid').checked,true);
 assert.equal(reopened.get('snap').checked,false);
});
test('grid snap moves right pivot to nearest 25-unit intersection but leaves old art unchanged',()=>{
 const t=mount();
 t.get('circle').click();
 const ink=JSON.stringify(t.state().strokes);
 t.drag('pivot',{x:550,y:390},{x:599,y:414});
 near(t.state().c.x,599);near(t.state().c.y,414);
 t.get('snapGrid').checked=true;
 t.get('snapGrid').emit('change',{target:t.get('snapGrid')});
 t.drag('pivot',{x:599,y:414},{x:599,y:414});
 near(t.state().c.x,600);near(t.state().c.y,425);
 assert.equal(JSON.stringify(t.state().strokes),ink);
});
test('snap to exact geometry crossings and construction centers',()=>{
 const init={c:{x:550,y:390},a:0,r:180,strokes:[
  {points:[{x:100,y:100},{x:700,y:700}],color:'#2347ca',weight:3},
  {points:[{x:100,y:700},{x:700,y:100}],color:'#2347ca',weight:3}
 ],snapGeometry:true};
 const t=mount(JSON.stringify(init));
 t.drag('pivot',{x:550,y:390},{x:407,y:404});
 near(t.state().c.x,400);
 near(t.state().c.y,400);
 const withCenter={...init,c:{x:550,y:390},strokes:[{points:[{x:100,y:100},{x:160,y:100}],center:{x:500,y:500},color:'#2347ca',weight:3}]};
 const c=mount(JSON.stringify(withCenter));
 c.drag('pivot',{x:550,y:390},{x:506,y:504});
 near(c.state().c.x,500);
 near(c.state().c.y,500);
});
test('angle snap quantizes the left caliper and pencil, but not the free mode',()=>{
 const t=mount();
 const c={x:550,y:390},raw=Math.PI*33/180;
 const leftAng=raw+2.48;
 const target={x:c.x+126*Math.cos(leftAng),y:c.y+126*Math.sin(leftAng)};
 t.drag('left',{x:550,y:390},target);
 near(t.state().a,raw,.00001);
 t.get('snap').checked=true;t.get('snap').emit('change',{target:t.get('snap')});
 t.drag('left',{x:550,y:390},target);
 near(t.state().a,Math.PI/6,.00001);
 const penAngle=Math.PI*47/180,penTarget={x:c.x+180*Math.cos(penAngle),y:c.y+180*Math.sin(penAngle)};
 t.drag('pen',{x:0,y:0},penTarget);
 near(t.state().a,Math.PI/4,.00001);
 assert.equal(t.state().strokes.length,1);
});
test('radius snap quantizes holder movement and radius slider to 5 units',()=>{
 const t=mount();
 t.get('snapRadius').checked=true;t.get('snapRadius').emit('change',{target:t.get('snapRadius')});
 const c=t.state().c,angle=t.state().a,raw=132.4;
 const target={x:c.x+.64*raw*Math.cos(angle),y:c.y+.64*raw*Math.sin(angle)};
 t.drag('holder',{x:0,y:0},target);
 near(t.state().r,130);
 t.get('radius').value='137';t.get('radius').emit('input',{target:t.get('radius')});
 near(t.state().r,135);
 t.get('snapRadius').checked=false;t.get('snapRadius').emit('change',{target:t.get('snapRadius')});
 t.get('radius').value='137';t.get('radius').emit('input',{target:t.get('radius')});
 near(t.state().r,137);
});
test('spiral pen snaps to grid points but a fixed-radius pen retains its circle',()=>{
 const t=mount();
 t.get('snapGrid').checked=true;t.get('snapGrid').emit('change',{target:t.get('snapGrid')});
 const point={x:677,y:453};
 t.drag('pen',{x:0,y:0},point);
 near(t.state().r,180);
 for(const r of radii(t.state().strokes[0].points,t.state().c))near(r,180);
 t.get('spiral').checked=true;t.get('spiral').emit('change',{target:t.get('spiral')});
 t.drag('pen',{x:0,y:0},point);
 const spiral=t.state();
 near(spiral.strokes.at(-1).points.at(-1).x,675);
 near(spiral.strokes.at(-1).points.at(-1).y,450);
 near(spiral.r,Math.hypot(125,60));
});

test('fourth ink swatch opens a native picker and keeps quick presets independent',()=>{
 const t=mount();
 assert.match(html,/<input type="color" id="customColor"/);
 assert.match(html,/data-color="#292a30"[\s\S]*?data-color="#dc1f18"[\s\S]*?data-color="#2347ca"[\s\S]*?id="customSwatch"/);
 assert.equal(t.get('customSwatch').getAttribute('data-selected'),'false');
 t.get('customColor').value='#12ab34';
 t.get('customColor').emit('input',{target:t.get('customColor')});
 assert.equal(t.state().color,'#12ab34');
 assert.equal(t.state().customColor,'#12ab34');
 assert.equal(t.state().inkSource,'custom');
 assert.equal(t.get('customSwatch').getAttribute('data-selected'),'true');
 assert.equal(t.get('customDot').style.backgroundColor,'#12ab34');
 assert.ok(t.swatches.every(b=>b.getAttribute('aria-pressed')==='false'));
 t.get('circle').click();
 assert.equal(t.state().strokes[0].color,'#12ab34');
 const black=t.swatches.find(b=>b.dataset.color==='#292a30');
 black.click();
 assert.equal(t.state().color,'#292a30');
 assert.equal(t.get('customSwatch').getAttribute('data-selected'),'false');
 assert.equal(t.get('customColor').value,'#12ab34');
 assert.equal(black.getAttribute('aria-pressed'),'true');
 t.get('circle').click();
 assert.equal(t.state().strokes[0].color,'#12ab34');
 assert.equal(t.state().strokes[1].color,'#292a30');
});
test('custom ink color is saved, restored, and can be selected again after a preset',()=>{
 const t=mount();
 t.get('customColor').value='#ef8143';
 t.get('customColor').emit('change',{target:t.get('customColor')});
 let reopened=mount(t.data.get(STORAGE_KEY));
 assert.equal(reopened.state().color,'#ef8143');
 assert.equal(reopened.get('customColor').value,'#ef8143');
 assert.equal(reopened.get('customSwatch').getAttribute('data-selected'),'true');
 reopened.swatches.find(b=>b.dataset.color==='#2347ca').click();
 reopened=mount(reopened.data.get(STORAGE_KEY));
 assert.equal(reopened.state().color,'#2347ca');
 assert.equal(reopened.get('customColor').value,'#ef8143');
 reopened.get('customColor').emit('input',{target:reopened.get('customColor')});
 assert.equal(reopened.state().color,'#ef8143');
});
