import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const code=readFileSync('sky-chart-relationship-scope-sections-v1.js','utf8');
function fixture(data={}){
  const entries=new Map(Object.entries(data));
  const localStorage={getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,String(v))};
  const window={
    addEventListener(){},
    RelphiSkyRelationshipDisplay:{getState:()=>({glyphs:true,names:true,referents:true})},
    RelphiSkyPlacementLogic:{summary:()=> 'Sun OR · B Moon NOT'},
    RelphiHarmonicOrb:{getWindow:()=>1},
    RelphiRelationshipLimit:{get:()=> 'all'},
    RelphiRelationshipSort:{mode:()=> 'exact'}
  };
  const document={readyState:'loading',addEventListener(){},querySelector(){return null;}};
  const sandbox={location:{pathname:'/sky-chart.html'},window,document,localStorage,Set,Map,console};
  vm.runInNewContext(code,sandbox);
  const focus=window.RelphiRelationshipExportFocus;
  assert.ok(focus,'Copy Focus serialization must be exposed');
  return {focus,entries};
}
const sky=JSON.stringify({placements:{Sun:{longitude:200}}});
let x=fixture({relphiSkyChartA:sky,relphiSkyChartB:sky});
assert.equal(x.focus.matrix().aspects,'All','Unopened filter defaults to All, not None');
assert.match(x.focus.lines().join('\n'),/Aspects: All/);
x=fixture({relphiSkyChartA:sky,relphiSkyChartB:sky,
  relphiSkyAspectMatrixV1:JSON.stringify({'A-A':['conjunction'],'B-B':['conjunction'],'A-B':['conjunction']})});
assert.equal(x.focus.matrix().aspects,'Conjunction');
assert.match(x.focus.lines().join('\n'),/Aspects: Conjunction/);
x=fixture({relphiSkyChartA:sky,relphiSkyChartB:sky,
  relphiSkyAspectMatrixV1:JSON.stringify({'A-A':[],'B-B':[],'A-B':[]})});
assert.equal(x.focus.matrix().aspects,'None');
assert.equal(x.focus.matrix().scopes,'None');
x=fixture({relphiSkyChartA:sky,relphiSkyChartB:sky,
  relphiSkyAspectMatrixV1:JSON.stringify({'A-A':['conjunction'],'B-B':['trine'],'A-B':[]}),
  relphiSkyAspectBySignV2:JSON.stringify(['square']),
  relphiSkyZodiacFilterV1:JSON.stringify([2,6]),
  relphiSkyHouseFilterV1:JSON.stringify({A:[1],B:[2,3]})});
const lines=x.focus.lines().join('\n');
assert.match(lines,/Aspects: A↔A: Conjunction · B↔B: Trine/);
assert.match(lines,/By Sign: Square/);
assert.match(lines,/Placements: Sun OR · B Moon NOT/);
assert.match(lines,/Zodiac Signs: Gemini, Libra/);
assert.match(lines,/Houses: Sky A: House 1 · Sky B: Houses 2, 3/);
console.log('Sky Chart Copy Focus selects the actual named aspects, zodiac signs, houses and placement logic.');
