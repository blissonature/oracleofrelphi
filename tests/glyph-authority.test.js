const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const context={window:{}};
vm.createContext(context);
vm.runInContext(read('relphi-glyph-masters-v1.js'),context);
vm.runInContext(read('relphi-glyph-registry-v1.js'),context);

const masters=context.window.RelphiGlyphMasters;
const registry=context.window.RelphiGlyphRegistry;
assert.equal(masters.ids.length,93,'The authority must contain exactly 93 masters.');
assert.equal(registry.entries.length,93,'Every master must have semantic metadata.');
assert.deepEqual([...masters.ids],[...registry.entries.map(entry=>entry.id)]);

for(const id of masters.ids){
  const master=masters.get(id);
  assert.match(master,/^<svg viewBox="-32 -32 64 64"/i,`${id} must preserve the approved canvas.`);
  assert.equal((master.match(/<svg\b/gi)||[]).length,1,`${id} must be one canonical SVG asset.`);
  assert.equal((master.match(/class="relphi-glyph-bubble"/g)||[]).length,1,`${id} must preserve its approved master root.`);
}

const neptune=masters.get('neptune');
assert.match(neptune,/M12 17L17 11L22 17M17 11V34C17 49 29 60 44 62H56C71 60 83 49 83 34V11/,
  'Neptune must retain the connected canonical crossbar and full trident geometry.');

const prohibited=/createBubble|getBBox\(|canonicalAssets|entry\.asset|glyph\.textContent\s*=|assets\/(?:planet|zodiac|aspect|element)-glyphs|component\.(?:draw|fit)|component\?\.(?:draw|fit|createBubble)/;
const sourceFiles=[];
function collect(directory){
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
    if(entry.name==='.git'||entry.name==='vendor'||entry.name==='node_modules'||entry.name==='tests'||entry.name==='relphi-glyph-masters-v1.js')continue;
    const full=path.join(directory,entry.name);
    if(entry.isDirectory())collect(full);
    else if(/\.(?:js|html|css|svg)$/.test(entry.name))sourceFiles.push(full);
  }
}
collect(root);
const violations=sourceFiles.filter(file=>prohibited.test(fs.readFileSync(file,'utf8'))).map(file=>path.relative(root,file));
assert.deepEqual(violations,[],'No competing fitter, generator, fallback asset, or renderer may remain.');

for(const directory of ['assets/planet-glyphs','assets/zodiac-glyphs','assets/aspect-glyphs','assets/element-glyphs']){
  const absolute=path.join(root,directory);
  assert.equal(fs.existsSync(absolute)&&fs.readdirSync(absolute).some(name=>name.endsWith('.svg')),false,`${directory} must not compete with the unified authority.`);
}

const component=read('relphi-glyph-component-v1.js');
assert.match(component,/RelphiGlyphMasters\?\.get/);
assert.match(component,/Missing canonical glyph master/);
assert.doesNotMatch(component,/createElementNS\(SVG_NS,'circle'\)|setAttribute\('viewBox'/);
