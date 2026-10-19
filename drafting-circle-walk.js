/* Oracle of Relphi: compass-and-straightedge circle walking, 2 through 7.
   Pure geometry available in Node; DOM interface activates in the drafting studio.
   The seventh division deliberately retains its approximation error. */
(function(root){
"use strict";
const TAU=Math.PI*2, cut=v=>Math.round(v*10000)/10000;
const pt=(x,y)=>({x:cut(x),y:cut(y)});
const polar=(c,r,a)=>pt(c.x+r*Math.cos(a),c.y+r*Math.sin(a));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const samples=(c,r,a,b,n=64)=>Array.from({length:n+1},(_,i)=>polar(c,r,a+(b-a)*i/n));
const circle=(c,r,role="guide")=>({kind:"circle",points:samples(c,r,0,TAU,240),role,center:pt(c.x,c.y)});
const line=(a,b,role="guide")=>({kind:"line",points:[pt(a.x,a.y),pt(b.x,b.y)],role});
const dot=(p,label)=>({kind:"dot",point:pt(p.x,p.y),label:label||""});
const arc=(c,r,point)=>{const a=Math.atan2(point.y-c.y,point.x-c.x);return {kind:"arc",points:samples(c,r,a-.29,a+.29,22),role:"guide"}};
function build(n,center={x:550,y:390},radius=180,start=-Math.PI/2){
 n=Number(n);
 if(!Number.isInteger(n)||n<2||n>7)throw new RangeError("Supported divisions: 2–7");
 const c=pt(Number(center.x),Number(center.y)),r=Number(radius);
 if(!Number.isFinite(r)||r<=0||!Number.isFinite(c.x)||!Number.isFinite(c.y)||!Number.isFinite(start))throw new RangeError("Invalid circle geometry");
 const v=(i,count)=>polar(c,r,start+i*TAU/count),p0=v(0,1),steps=[],base=circle(c,r,"ink"),guides=[];
 const step=(title,detail,shapes=[])=>steps.push({title,detail,shapes});
 const guideLine=(a,b)=>{const l=line(a,b);guides.push(l);return l};
 const walking=(vertices,opening,approx=false)=>{
  for(let i=1;i<vertices.length;i++){
   const from=vertices[i-1],to=vertices[i],construction=arc(from,opening,to);
   guides.push(construction);
   step("Step the chord "+i,"Place the compass point at mark "+i+". Keep its opening fixed and swing an arc to find mark "+(i+1)+".",
    [construction,line(from,to,approx?"accent":"guide"),dot(to,String(i+1))]);
  }
 };
 let exact=true,closureError=0,outline=[];
 step("Establish the circle","Set the right point, select the radius and sweep a complete circle.",[base,dot(c,"O")]);
 if(n===2){
  const opposite=v(1,2);
  step("Set the first point","Choose where the radius meets the circumference.",[line(c,p0),dot(p0,"1")]);
  step("Find its opposite","Extend the line through the center to the opposite circumference.",[line(c,opposite),dot(opposite,"2")]);
  step("Draw the diameter","One diameter creates two equal 180° divisions.",[guideLine(p0,opposite)]);
  outline=[line(p0,opposite,"ink")];
 }else if(n===4){
  const opp=v(2,4),perp=v(1,4),other=v(3,4);
  const distanceFromCenter=r*Math.sqrt(1.2*1.2-1);
  const a=polar(c,distanceFromCenter,start+Math.PI/2),b=polar(c,distanceFromCenter,start-Math.PI/2);
  const first=circle(p0,1.2*r),second=circle(opp,1.2*r);
  step("Draw a diameter","Choose a line through the center with opposite endpoints.",[guideLine(p0,opp),dot(p0,"1"),dot(opp,"3")]);
  step("Swing crossing arcs","Use matching compass openings greater than half the diameter, centered on its endpoints.",[first,second,dot(a,"×"),dot(b,"×")]);
  guides.push(first,second);
  step("Bisect at right angles","Join the intersections of the arcs, giving a perpendicular diameter.",[guideLine(perp,other),dot(perp,"2"),dot(other,"4")]);
  for(let i=1;i<=4;i++)step("Walk a quarter "+i,"Each successive quarter of the circle spans 90°.",[line(v(i-1,4),v(i%4,4),"accent")]);
  const vertices=Array.from({length:4},(_,i)=>v(i,4));
  step("Join the square","Four right-angle steps form an exact square.",[...vertices.map((a,i)=>line(a,vertices[(i+1)%4],"ink"))]);
  outline=[{kind:"path",points:[...vertices,vertices[0]],role:"ink"}];
 }else if(n===3||n===6){
  const six=Array.from({length:7},(_,i)=>v(i,6));
  step("Use the circle radius","A chord exactly equal to the radius walks one sixth of the circle.",[line(c,p0),dot(p0,"1")]);
  walking(six,r);
  if(n===3){
   const tri=[six[0],six[2],six[4]];
   step("Take alternating marks","Select every second mark among the six compass steps.",tri.map((p,i)=>dot(p,String(i+1))));
   step("Join the triangle","Three equal chords inscribe an exact equilateral triangle.",tri.map((p,i)=>line(p,tri[(i+1)%3],"ink")));
   outline=[{kind:"path",points:[...tri,tri[0]],role:"ink"}];
  }else{
   step("Join the hexagon","Six radius-length chords close exactly.",six.slice(1).map((p,i)=>line(six[i],p,"ink")));
   outline=[{kind:"path",points:six,role:"ink"}];
  }
 }else if(n===5){
  // Right radius midpoint M; centered arc through start intersects left radius at Q.
  // The distance from start to Q equals 2r sin(pi/5).
  const right=v(1,4),left=v(3,4),opposite=v(2,4);
  const M=polar(c,r/2,start+Math.PI/2),Q=polar(c,r*(Math.sqrt(5)-1)/2,start-Math.PI/2);
  const goldenArc=circle(M,r*Math.sqrt(1.25));
  step("Set perpendicular diameters","Establish the central axes and their endpoints.",[guideLine(right,left),guideLine(p0,opposite),dot(p0,"1")]);
  step("Halve the right radius","Mark midpoint M between the center and the right end of its radius.",[dot(M,"M"),line(c,M,"accent")]);
  step("Swing the golden arc","With center M, draw an arc through the first point. Its left intersection with the diameter is Q.",[goldenArc,dot(Q,"Q")]);
  guides.push(goldenArc);
  const chord=distance(p0,Q);
  step("Set the pentagon chord","Measure from the first point to Q. This yields the exact chord for 72°.",[line(p0,Q,"accent")]);
  const five=Array.from({length:6},(_,i)=>v(i%5,5));
  walking(five,chord);
  step("Join the pentagon","Five identical compass chords return exactly to the starting point.",five.slice(1).map((p,i)=>line(five[i],p,"ink")));
  outline=[{kind:"path",points:five,role:"ink"}];
 }else{
  // Approximation: half the side of the inscribed equilateral triangle.
  // This is not an exact straightedge/compass construction of a regular heptagon.
  exact=false;
  const triangle=[v(0,3),v(1,3),v(2,3)],mid=pt((triangle[0].x+triangle[1].x)/2,(triangle[0].y+triangle[1].y)/2);
  const opening=Math.sqrt(3)/2*r,theta=2*Math.asin(opening/(2*r));
  closureError=Math.abs(360-7*theta*180/Math.PI);
  step("Build the reference triangle","The side of an inscribed equilateral triangle measures √3 × the radius.",[...triangle.map(p=>dot(p)),line(triangle[0],triangle[1]),line(triangle[1],triangle[2]),line(triangle[2],triangle[0])]);
  step("Halve the triangle chord","Take half that side as an approximate sevenfold step (√3/2 × radius).",[dot(mid,"M"),line(triangle[0],mid,"accent")]);
  const seven=Array.from({length:8},(_,i)=>polar(c,r,start+i*theta));
  step("Set the chord opening","Keep this approximate chord constant as you walk around the circle.",[line(seven[0],seven[1],"accent"),dot(seven[0],"start")]);
  walking(seven,opening,true);
  step("Inspect the closure gap","Seven steps miss the start by "+closureError.toFixed(3)+"°. An exact regular heptagon is not constructible with unmarked straightedge and compass alone.",[line(seven[7],seven[0],"gap"),dot(seven[0],"start"),dot(seven[7],"end")]);
  outline=[{kind:"path",points:seven,role:"ink"}]; // keep real endpoint, never silently close
 }
 return {n,c,r,exact,closureError,method:exact?"Exact construction":"Approximate · closure gap visible",
  steps,exportInk:[base,...outline],exportGuides:guides};
}
function centeredViewportCircle(viewBox,requestedRadius){
 const parts=typeof viewBox==="string"?viewBox.trim().split(/[\s,]+/).map(Number):
  viewBox?[viewBox.x,viewBox.y,viewBox.width,viewBox.height].map(Number):[];
 const [x,y,width,height]=parts;
 if(parts.length!==4||![x,y,width,height].every(Number.isFinite)||width<=0||height<=0)throw new RangeError("Invalid visible SVG viewport");
 const requested=Number(requestedRadius);
 if(!Number.isFinite(requested)||requested<=0)throw new RangeError("Invalid requested circle radius");
 return {c:pt(x+width/2,y+height/2),r:Math.min(requested,Math.min(width,height)*.35)};
}
const api={build,polar,distance,centeredViewportCircle};
if(typeof module==="object"&&module.exports)module.exports=api;
root.RelphiCircleWalkMath=api;
if(typeof document==="undefined"||!root.RelphiDraftingBridge)return;
const $=id=>document.getElementById(id),SVG="http://www.w3.org/2000/svg",bridge=root.RelphiDraftingBridge;
const mode=$("walkMode"),manual=$("compassMode"),bar=$("circleWalkToolbar"),panel=$("circleWalkPanel"),overlay=$("circleWalkLayer");
if(!mode||!manual||!bar||!panel||!overlay)return;
const art=$("art"),hardware=$("instrument"),guides=$("guides"),hint=$("hint"),sheet=$("sheet");
let enabled=false,division=6,position=0,result=null,origin=null;
function elem(name,props={}){
 const e=document.createElementNS(SVG,name);
 for(const k of Object.keys(props))e.setAttribute(k,String(props[k]));
 return e;
}
function shapeToSVG(shape,animated){
 const fragment=document.createDocumentFragment();
 if(shape.kind==="dot"){
  fragment.appendChild(elem("circle",{cx:shape.point.x,cy:shape.point.y,r:5,class:"cw-dot"}));
  if(shape.label){
   const label=elem("text",{x:shape.point.x+8,y:shape.point.y-8,class:"cw-label"});
   label.textContent=shape.label;fragment.appendChild(label);
  }
 }else if(shape.points&&shape.points.length){
  const attrs={d:shape.points.map((p,i)=>(i?"L":"M")+p.x+" "+p.y).join(" "),class:"cw-path cw-"+(shape.role||"guide")+(animated?" cw-new":""),fill:"none"};
  if(animated){attrs.pathLength=1;attrs["stroke-dasharray"]=1;attrs["stroke-dashoffset"]=1;}
  fragment.appendChild(elem("path",attrs));
 }
 return fragment;
}
function refresh(){
 if(!enabled)return;
 const compass=bridge.getGeometry();
 // The walkthrough is centered in the *visible SVG viewport*, never at
 // the previous movable compass pivot. Fitting changes only the walkthrough.
 const frame=centeredViewportCircle(sheet.getAttribute("viewBox"),compass.r);
 origin={...compass,c:frame.c,r:frame.r};
 overlay.style.setProperty('--cw-ink',origin.color);
 result=build(division,origin.c,origin.r,origin.a);
 position=Math.max(0,Math.min(position,result.steps.length-1));
 const fragment=document.createDocumentFragment();
 for(let i=0;i<=position;i++){
  const group=elem("g",{"data-walk-stage":i});
  result.steps[i].shapes.forEach(s=>group.appendChild(shapeToSVG(s,i===position)));
  fragment.appendChild(group);
 }
 overlay.replaceChildren(fragment);
 const here=result.steps[position];
 $("cwTitle").textContent=here.title;
 $("cwExplanation").textContent=here.detail;
 $("cwPosition").textContent="Step "+(position+1)+" of "+result.steps.length;
 $("cwMethod").textContent=result.method;
 $("cwProgress").max=result.steps.length;$("cwProgress").value=position+1;
 $("cwPrev").disabled=position===0;
 $("cwNext").disabled=position===result.steps.length-1;
 $("cwFinish").disabled=position!==result.steps.length-1;
 $("cwNote").textContent=division===7?"Approximate sevenfold chord · closure error "+result.closureError.toFixed(3)+"°.":"Build it one construction step at a time. Your existing ink stays intact.";
 hint.textContent="Walking "+division+" divisions · "+here.title;
}
function setMode(on){
 enabled=on;
 bar.hidden=!on;panel.hidden=!on;
 $("compassPanel").hidden=on;$("compassGeometryPanel").hidden=on;
 art.style.opacity=on?".18":"";
 hardware.style.display=on?"none":"";
 guides.style.display=on?"none":"";
 overlay.style.display=on?"":"none";
 mode.setAttribute("aria-pressed",String(on));
 manual.setAttribute("aria-pressed",String(!on));
 if(on){position=0;refresh();}
 else{overlay.replaceChildren();hint.innerHTML="<strong>Try it:</strong> Drag a colored handle, or use the precision controls.";}
}
function choose(n){
 division=n;position=0;
 document.querySelectorAll("[data-circle-division]").forEach(b=>b.setAttribute("aria-pressed",String(Number(b.dataset.circleDivision)===n)));
 refresh();
}
mode.addEventListener("click",()=>setMode(true));
manual.addEventListener("click",()=>setMode(false));
document.querySelectorAll("[data-circle-division]").forEach(b=>b.addEventListener("click",()=>choose(Number(b.dataset.circleDivision))));
$("cwPrev").addEventListener("click",()=>{if(position>0){position--;refresh();}});
$("cwNext").addEventListener("click",()=>{if(result&&position<result.steps.length-1){position++;refresh();}});
$("cwRestart").addEventListener("click",()=>{position=0;refresh();});
 if(typeof root.addEventListener==="function"){
  root.addEventListener("resize",()=>{if(enabled)refresh();});
 }
$("cwFinish").addEventListener("click",()=>{
 if(!enabled||!result||position!==result.steps.length-1)return;
 const source=$("cwIncludeGuides").checked?[...result.exportInk,...result.exportGuides]:result.exportInk;
 const strokes=source.filter(s=>Array.isArray(s.points)&&s.points.length>1).map(s=>({
  points:s.points,color:s.role==="ink"?origin.color:"#a79f92",weight:s.role==="ink"?origin.weight:1.4,center:origin.c
 }));
 bridge.addStrokes(strokes);
 $("cwNote").textContent=strokes.length+" marks committed to the sheet. Switch to Compass for further drafting.";
});
choose(6);
})(typeof window!=="undefined"?window:globalThis);
