import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';

// Convert machine measurements into an inspectable all-identity report, preserving
// the difference between observed data and design approval.
const out='test-results/glyph-audit/';
const r=JSON.parse(await readFile(out+'95-glyph-rendering-audit.json','utf8'));
const desktop=r.screens.desktop,mobile=r.screens.mobile;
assert.equal(desktop.glyphs.length,95);
assert.equal(mobile.glyphs.length,95);
const inkD=new Map(r.screens.desktopPaintedInk.map(x=>[x.id,x]));
const inkM=new Map(r.screens.mobilePaintedInk.map(x=>[x.id,x]));
const esc=s=>String(s??'').replace(/\|/g,'\\|').replace(/\n/g,' ');
const number=x=>Number(x).toFixed(2);
const lines=[];
lines.push('# Oracle of Relphi — Full glyph design audit');
lines.push('');
lines.push('**Source:** one canonical registry, 95 identities, 40 unique SVG files.  **Environment:** GitHub Actions Chromium on Ubuntu 24.04, desktop 1280×900 and mobile 390×844.  **Revision:** `'+(r.commit||'unknown')+'`.');
lines.push('');
lines.push('**Decision rule:** An existing implementation is not automatically an approved style. Each deliberate departure requires a purpose, evidence and a reconsideration trigger. Font families reported below are those observed in this specific Linux Chromium environment; other operating systems may choose different installed fonts.');
lines.push('');
lines.push('## Result');
lines.push('');
lines.push('- **95/95 visible** at both widths, and all 95 identities retain canonical ownership.');
lines.push('- **95/95 original glyph inks fit inside their 19 px rings** in both viewports, measured from screenshot pixels rather than font layout boxes.');
lines.push('- **95/95 circle toggles** preserve artwork dimensions; both circle states are tested and photographed.');
lines.push('- **No page JavaScript exceptions** in the gallery.');
lines.push('- Source identity collision: `tau` is claimed by both Hebrew Tav and Greek Tau; Greek Tau currently wins resolution. This is an unresolved semantic defect, not an approved exception.');
lines.push('- Shared source: Fire and Trine intentionally point to the same SVG triangle. That is shared geometry, not a font difference.');
lines.push('');
lines.push('## Declared typeface vs. actual Chromium font');
lines.push('');
lines.push('| Identity group | Declared CSS family / size / weight | Actual Linux Chromium font | Why this matters |');
lines.push('| --- | --- | --- | --- |');
const groups=[
 ['Latin (Asc, Dsc, MC, IC, Vx)','vertex','Live letters; compare with proposed Montserrat only after approval'],
 ['Chiron and lunar nodes','chiron','Symbols can select a fallback depending on installed fonts; validate cross-platform'],
 ['Hebrew (22)','hebrew-aleph','Script-specific font fallback is not guaranteed to be the primary named font'],
 ['Greek (24)','greek-alpha','Script-specific font fallback is not guaranteed to be the primary named font']
];
for(const [label,id,reason] of groups){
 const row=desktop.glyphs.find(x=>x.id===id);
 lines.push('| '+esc(label)+' | '+esc([row.font?.family,row.font?.size,row.font?.weight].filter(Boolean).join(' · '))+
   ' | '+esc(row.platformFonts?.map(f=>f.family).join(', ')||'unverified')+' | '+esc(reason)+' |');
}
lines.push('');
lines.push('## Identity-by-identity painted bounds');
lines.push('');
lines.push('**Ink radius** is the farthest visible dark glyph pixel from its master-ring center in the **uncircled** screenshot. The screenshot may have antialiasing and Linux-font variation. The ring radius is 19 px; these are measurements, not subjective approvals of size or weight.');
lines.push('');
lines.push('| Glyph | Mode | Asset / fallback | Desktop ink radius | Mobile ink radius | Actual font if text | Bbox review? |');
lines.push('| --- | --- | --- | ---: | ---: | --- | --- |');
for(const g of desktop.glyphs){
 const d=inkD.get(g.id),m=inkM.get(g.id);
 assert.ok(d&&m&&d.paintedPixels>0&&m.paintedPixels>0,'Missing pixel evidence '+g.id);
 assert.ok(d.inkRadius<=19.5&&m.inkRadius<=19.5,'Painted ink outside ring '+g.id);
 const provider=g.platformFonts?.map(f=>f.family).join(', ')||'—';
 const flagged=desktop.issues.some(x=>x.id===g.id&&x.kind==='layout-bbox-exceeds-ring-needs-ink-review')?'Layout box only':'';
 lines.push('| '+esc(g.name)+' (`'+g.id+'`) | '+g.mode+' | '+
   esc(g.asset||g.literalText||'Unicode fallback')+' | '+number(d.inkRadius)+' px | '+number(m.inkRadius)+
   ' px | '+esc(provider)+' | '+esc(flagged)+' |');
}
lines.push('');
lines.push('## Explicit registry adjustments needing recorded rationale');
lines.push('');
lines.push('These numbers are currently *implemented*, but their original reasons are not recorded in the registry. They are not silently deemed necessary. Reconsider when the visible target, font support or visual comparison changes.');
lines.push('');
lines.push('| Glyph | Scale | Horizontal shift | Vertical shift | Review status |');
lines.push('| --- | ---: | ---: | ---: | --- |');
for(const g of desktop.glyphs.filter(x=>x.rawScale!==1||x.dx!==0||x.dy!==0)){
 lines.push('| '+esc(g.name)+' (`'+g.id+'`) | '+number(g.rawScale)+' | '+number(g.dx)+' | '+number(g.dy)+' | Rationale unrecorded; compare optical fit |');
}
lines.push('');
lines.push('## Evidence to inspect');
lines.push('');
lines.push('- [Desktop, with circles](95-glyphs-desktop-circled.png) and [without circles](95-glyphs-desktop-uncircled.png).');
lines.push('- [Mobile, with circles](95-glyphs-mobile-circled.png) and [without circles](95-glyphs-mobile-uncircled.png).');
lines.push('- [Complete raw JSON](95-glyph-rendering-audit.json) includes exact bounds, computed font stacks, Chromium platform-font IDs, and discrepancies.');
lines.push('- The governing [exception ledger](https://github.com/blissonature/oracleofrelphi/blob/main/docs/design-system/glyph-rules-and-exception-ledger.md) records reasons/approval status rather than redefining the glyph renderer.');
lines.push('');
lines.push('**Outstanding design decisions:** Select the Latin typeface; justify or remove Asc/Dsc tracking; decide how AVx should share typography; approve an actual Retrograde design; explicitly address the Tau alias conflict; check font availability on Windows/macOS/iOS/Android. None of these are decided merely because this audit passes.');
await writeFile(out+'95-glyph-design-report.md',lines.join('\n')+'\n');
console.log('Full 95-glyph Markdown report generated: '+(lines.length)+' lines');
