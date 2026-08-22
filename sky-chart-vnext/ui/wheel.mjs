import{SIGNS,norm}from'../core/model.mjs';
import{GEOMETRY,polar,layoutWheel}from'../core/layout.mjs';

const NS='http://www.w3.org/2000/svg';
const SLOT_COLOR={A:'#c9211e',B:'#2462d0'};
const ASPECT_COLOR={conjunction:'#e53935','semi-sextile':'#7c9b49',octile:'#b86d43',sextile:'#d3b727',quintile:'#8b6cc2',square:'#d6534d',trine:'#4e9e69','tri-octile':'#9f5944','bi-quintile':'#7655aa',quincunx:'#4b8e88',opposition:'#5961c8'};
const SIGN_COLOR=['#e53935','#f06b32','#f39a2e','#f5be3d','#f1dc43','#a9cf46','#43a85b','#2ca69b','#3285c7','#5961c8','#8c4fb4','#bd438e'];
const GLYPH_ID={Ascendant:'asc',Descendant:'dsc',Midheaven:'mc','Imum Coeli':'ic','North Node':'north-node','South Node':'south-node','Part of Fortune':'part-of-fortune',Vertex:'vertex',Lilith:'lilith',Chiron:'chiron'};
const make=(name,attrs={})=>{const node=document.createElementNS(NS,name);for(const[key,value]of Object.entries(attrs))node.setAttribute(key,String(value));return node};

function annular(inner,outer,start,end){
  const span=((end-start)%360+360)%360||360,large=span>180?1:0,a=polar(outer,start),b=polar(outer,start+span),c=polar(inner,start+span),d=polar(inner,start);
  return`M${a.x} ${a.y} A${outer} ${outer} 0 ${large} 1 ${b.x} ${b.y} L${c.x} ${c.y} A${inner} ${inner} 0 ${large} 0 ${d.x} ${d.y} Z`;
}
function radial(parent,inner,outer,degree,className){const a=polar(inner,degree),b=polar(outer,degree),line=make('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:className});parent.appendChild(line);return line}
function text(parent,radius,degree,value,className){const p=polar(radius,degree),node=make('text',{x:p.x,y:p.y,class:className});node.textContent=value;parent.appendChild(node);return node}

function drawZodiac(svg){
  const group=make('g',{'data-layer':'zodiac'});svg.appendChild(group);
  for(let i=0;i<12;i++){
    const path=make('path',{d:annular(GEOMETRY.zodiacInner,GEOMETRY.zodiacOuter,i*30,(i+1)*30),class:'zodiac-sector',fill:SIGN_COLOR[i]});group.appendChild(path);
    const label=text(group,(GEOMETRY.zodiacInner+GEOMETRY.zodiacOuter)/2,i*30+15,SIGNS[i].slice(0,3).toUpperCase(),'zodiac-label');label.setAttribute('fill',i>=3&&i<=6?'#2d2a22':'#fff');
  }
  for(let degree=0;degree<360;degree++)radial(group,GEOMETRY.zodiacOuter-((degree%5===0)?8:4),GEOMETRY.zodiacOuter,degree,'degree-tick');
}
function drawHouses(svg,cusps,slot){
  if(!Array.isArray(cusps)||cusps.length!==12)return;
  const group=make('g',{'data-layer':`houses-${slot}`,'data-slot':slot});svg.appendChild(group);
  const inner=slot==='A'?GEOMETRY.zodiacOuter:120,outer=slot==='A'?486:GEOMETRY.zodiacInner;
  for(let i=0;i<12;i++){
    radial(group,inner,outer,cusps[i],'house-line');
    const next=cusps[(i+1)%12],span=norm(next-cusps[i])||30,mid=norm(cusps[i]+span/2),label=text(group,slot==='A'?472:137,mid,String(i+1),'house-number');label.setAttribute('fill',SLOT_COLOR[slot]);
  }
}
async function drawCanonical(group,item){
  const id=GLYPH_ID[item.name]||item.id,component=window.RelphiGlyphComponent,registry=window.RelphiGlyphRegistry;
  try{
    const entry=registry?.resolve?.(id)||registry?.get?.(id);
    if(!entry||!component?.draw)throw new Error('Canonical glyph unavailable');
    await component.draw(group,entry.id,{radius:13,padding:1,color:SLOT_COLOR[item.slot]});
  }catch{
    const fallback=make('text',{x:0,y:1,fill:SLOT_COLOR[item.slot]});fallback.textContent=item.name.slice(0,2);group.appendChild(fallback);
  }
}
function selectedPlacementKey(selected){return selected?`${selected.slot}:${selected.id}`:''}

export function renderWheel(mount,{skyA,skyB,orb=3,selectedPlacement=null,selectedRelationship=null}={}){
  mount.replaceChildren();
  if(!skyA){const empty=document.createElement('div');empty.className='sky-empty-stage';empty.innerHTML='<div><strong>No sky selected.</strong>Add Sky A to draw the wheel.</div>';mount.appendChild(empty);return{placements:[],relationships:[],cusps:{A:null,B:null}}}
  const model=layoutWheel(skyA,skyB,orb),svg=make('svg',{viewBox:'0 0 1000 1000',class:'sky-wheel',role:'img','aria-label':skyB?'Comparison zodiac wheel':'Zodiac wheel'});mount.appendChild(svg);
  drawZodiac(svg);drawHouses(svg,model.cusps.A,'A');if(skyB)drawHouses(svg,model.cusps.B,'B');
  const aspectLayer=make('g',{'data-layer':'aspects'});svg.appendChild(aspectLayer);
  for(const relation of model.relationships){
    const line=make('line',{x1:relation.leftLayout.x,y1:relation.leftLayout.y,x2:relation.rightLayout.x,y2:relation.rightLayout.y,stroke:ASPECT_COLOR[relation.id.split('|').at(-1)]||ASPECT_COLOR[relation.id]||'#79645f',class:`aspect-line${selectedRelationship===relation.id?' is-selected':''}`,'data-relationship-id':relation.id,'data-left':`${relation.left.slot}:${relation.left.id}`,'data-right':`${relation.right.slot}:${relation.right.id}`});aspectLayer.appendChild(line);
  }
  const leaderLayer=make('g',{'data-layer':'leaders'}),placementLayer=make('g',{'data-layer':'placements'});svg.append(leaderLayer,placementLayer);
  const selectedKey=selectedPlacementKey(selectedPlacement);
  for(const item of model.placements){
    const key=`${item.slot}:${item.id}`,leader=make('line',{...item.leader,stroke:SLOT_COLOR[item.slot],class:'leader','data-placement-key':key});leader.removeAttribute('id');leader.removeAttribute('slot');leader.removeAttribute('placementId');leaderLayer.appendChild(leader);
    const group=make('g',{transform:`translate(${item.x} ${item.y})`,class:`placement${selectedKey===key?' is-selected':''}`,tabindex:'0',role:'button','aria-label':`${item.name}, ${item.slot==='A'?'Sky A':'Sky B'}`,'data-placement-key':key,'data-slot':item.slot,'data-placement-id':item.id});
    const ring=make('circle',{cx:0,cy:0,r:GEOMETRY.placementRadius,class:'placement-ring',stroke:SLOT_COLOR[item.slot]});group.appendChild(ring);placementLayer.appendChild(group);drawCanonical(group,item);
  }
  return model;
}

export function applyTransientFocus(root,key=''){
  const wheel=root?.querySelector?.('.sky-wheel');if(!wheel)return;
  const active=String(key||'');
  wheel.querySelectorAll('.placement').forEach(node=>node.classList.toggle('is-muted',!!active&&node.dataset.placementKey!==active));
  wheel.querySelectorAll('.aspect-line').forEach(node=>node.classList.toggle('is-muted',!!active&&node.dataset.left!==active&&node.dataset.right!==active));
}
