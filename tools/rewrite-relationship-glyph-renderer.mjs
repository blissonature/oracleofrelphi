import fs from 'node:fs/promises';
import path from 'node:path';

const inputPath = path.resolve(process.argv[2] || 'sky-chart-foundation-interactions-v2.js');
const outputPath = path.resolve(process.argv[3] || 'sky-chart-foundation-interactions-v2.clean.js');
let source = await fs.readFile(inputPath, 'utf8');

function replaceOnce(pattern, replacement, label) {
  const matches = source.match(pattern);
  if (!matches || matches.length !== 1) throw new Error(`Expected exactly one ${label}; found ${matches?.length || 0}.`);
  source = source.replace(pattern, replacement);
}

replaceOnce(/  const NS='http:\/\/www\.w3\.org\/2000\/svg';\n/, '', 'relationship SVG namespace declaration');
replaceOnce(/  const APPROVED_FALLBACKS=new Set\([^\n]+\);\n/, '', 'relationship fallback set');
replaceOnce(/if\(entry\?\.asset\|\|APPROVED_FALLBACKS\.has\(entry\?\.id\)\)return entry;/, 'if(entry)return entry;', 'relationship fallback condition');

const renderer = `  function glyphSlot(role,label){
    const slot=document.createElement('span');
    slot.className='sky-foundation-relationship-glyph sky-foundation-relationship-glyph--'+role;
    slot.dataset.glyphRole=role;
    slot.setAttribute('aria-label',label);
    return slot;
  }
  function placeCanonicalGlyph(slot,id,state,color,label){
    const placer=window.RelphiCanonicalGlyphState;
    if(!placer)throw new Error('Canonical glyph state placer is unavailable.');
    return placer.place(slot,id,{state,color,size:28,label});
  }
  async function renderRows(relations){
    const list=document.getElementById('skyFoundationRelationshipList'),count=document.getElementById('skyFoundationRelationshipCount');if(!list||!count)return;
    const selectionCleared=document.getElementById('skyFoundationRoot')?.dataset.relationshipSelectionCleared==='true',selected=selectionCleared?null:document.querySelector('.sky-foundation-relationship-row[aria-current="true"]');const selectedKey=selected?\\`${'${selected.dataset.leftPlacement}|${selected.dataset.aspect}|${selected.dataset.rightPlacement}|${selected.getAttribute(\'aria-label\')}'}\\`:'';
    list.replaceChildren();count.textContent=\\`${'${relations.length}/${relations.length}'}\\`;count.dataset.total=String(relations.length);const jobs=[];
    relations.forEach((relation,index)=>{
      const left=coordinate(relation.left),right=coordinate(relation.right),row=document.createElement('button');row.type='button';row.className='sky-foundation-relationship-row';row.dataset.relationshipSelection='true';row.dataset.relationIndex=String(index);row.dataset.aspect=relation.aspect.id;row.dataset.leftPlacement=relation.left.id;row.dataset.rightPlacement=relation.right.id;row.dataset.sourceOrb=relation.orb.toFixed(6);row.dataset.leftHouse=String(relation.left.house);row.dataset.rightHouse=String(relation.right.house);row.dataset.leftSign=String(relation.left.sign);row.dataset.rightSign=String(relation.right.sign);row.setAttribute('aria-label',\\`${'${relation.left.entry.name} ${relation.aspect.id} ${relation.right.entry.name}, orb ${relation.orb.toFixed(2)} degrees'}\\`);
      const leftGlyph=glyphSlot('left',relation.left.entry.name),aspectGlyph=glyphSlot('aspect',relation.aspect.id),rightGlyph=glyphSlot('right',relation.right.entry.name),leftCopy=document.createElement('span'),rightCopy=document.createElement('span');leftCopy.className=rightCopy.className='sky-foundation-relationship-copy';leftCopy.innerHTML=\\`${'${esc(relation.left.entry.name)}<small>${left.text} ${esc(SIGN_NAMES[left.sign])} · H${relation.left.house}</small>'}\\`;rightCopy.innerHTML=\\`${'${esc(relation.right.entry.name)}<small>${right.text} ${esc(SIGN_NAMES[right.sign])} · H${relation.right.house} · Orb ${relation.orb.toFixed(2)}°</small>'}\\`;row.append(leftGlyph,leftCopy,aspectGlyph,rightGlyph,rightCopy);list.appendChild(row);
      const key=\\`${'${row.dataset.leftPlacement}|${row.dataset.aspect}|${row.dataset.rightPlacement}|${row.getAttribute(\'aria-label\')}'}\\`;if(key===selectedKey)row.setAttribute('aria-current','true');
      const fail=(slot,error)=>{slot.dataset.glyphError='true';console.error(error)};
      jobs.push(
        Promise.resolve().then(()=>placeCanonicalGlyph(leftGlyph,relation.left.id,'circled',SKY.A,relation.left.entry.name)).catch(error=>fail(leftGlyph,error)),
        Promise.resolve().then(()=>placeCanonicalGlyph(aspectGlyph,relation.aspect.id,'plain',relation.aspect.color,relation.aspect.id)).catch(error=>fail(aspectGlyph,error)),
        Promise.resolve().then(()=>placeCanonicalGlyph(rightGlyph,relation.right.id,'circled',SKY.B,relation.right.entry.name)).catch(error=>fail(rightGlyph,error))
      );
    });
    await Promise.allSettled(jobs);
  }
`;

replaceOnce(/  async function draw\([\s\S]*?\n  function annotateHouseLayer/, renderer + '  function annotateHouseLayer', 'relationship glyph renderer block');

const forbidden = [
  /createBubble/,
  /function makeSvg/,
  /createElementNS\(/,
  /viewBox','-20 -20 40 40/,
  /radius:15/,
  /padding:1/,
  /APPROVED_FALLBACKS/
];
for (const pattern of forbidden) {
  if (pattern.test(source)) throw new Error(`Forbidden relationship glyph code remains: ${pattern}`);
}

await fs.writeFile(outputPath, source, 'utf8');
console.log(`Wrote glyph-clean relationship controller to ${outputPath}`);
