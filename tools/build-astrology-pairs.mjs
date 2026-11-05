/* Deterministic static astrology pair page generator. Run: node tools/build-astrology-pairs.mjs */
const RelphiPairBuilder=(function buildPairGenerator(){
"use strict";
const placements=[
["sun","Sun","identity, vitality, and conscious purpose","act from a visible sense of self","purpose and self-expression"],
["moon","Moon","feelings, instinct, memory, and emotional needs","respond to experience and tend emotional memory","emotional safety and belonging"],
["mercury","Mercury","thought, language, perception, and exchange","name, connect, and communicate what is perceived","understanding and communication"],
["venus","Venus","values, affection, pleasure, and relationship","recognize what is valuable and make room for connection","pleasure, reciprocity, and chosen values"],
["mars","Mars","initiative, desire, assertion, and conflict","mobilize effort and assert a direction","agency and deliberate action"],
["jupiter","Jupiter","growth, confidence, meaning, and opportunity","enlarge possibilities through trust and exploration","growth and wider meaning"],
["saturn","Saturn","structure, time, limits, and responsibility","give commitments boundaries and workable form","enduring structure and accountability"],
["uranus","Uranus","freedom, originality, disruption, and reinvention","interrupt an old pattern and experiment with a new form","liberty and inventive change"],
["neptune","Neptune","imagination, sensitivity, surrender, and ideals","loosen fixed categories and follow an imaginative vision","inspiration and compassionate release"],
["pluto","Pluto","power, depth, elimination, and transformation","expose underlying forces and make an irreversible change","depth and meaningful transformation"],
["chiron","Chiron","wounding, healing intelligence, and the guidance born of experience","recognize a wound without reducing the person to it","healing knowledge and vulnerability"],
["lilith","Lilith","instinctive autonomy, refusal, and uncompromised desire","recognize the right to refuse imposed definitions","uncompromised self-direction"],
["part-of-fortune","Part of Fortune","the meeting of body, feeling, circumstance, and ease","notice where life can be lived with less resistance","embodied fit and fulfillment"],
["vertex","Vertex","encounters experienced as consequential or unexpectedly revealing","notice the significance assigned to an encounter","consequential meetings and response"],
["anti-vertex","Anti-Vertex","the complementary end of the Vertex axis and personal participation in encounters","locate a conscious response along the encounter axis","active participation in what is encountered"],
["north-node","North Node","development through unfamiliar experience and emerging capacity","move toward skills not yet habitual","developing capacity and unfamiliar growth"],
["south-node","South Node","familiar patterns, inherited skills, and the known path","draw upon experience while recognizing its limits","the habitual and inherited path"],
["asc","Ascendant","the manner of entering situations and being initially perceived","meet the world through an embodied point of view","self-presentation and beginnings"],
["dsc","Descendant","partnership, contracts, and encounters with another person","negotiate the meeting between self and other","the terms of partnership and exchange"],
["mc","Midheaven","public direction, vocation, and visibility","orient decisions toward an outward role","public direction and contribution"],
["ic","Imum Coeli","home, roots, private foundations, and belonging","protect the foundations from which life grows","home and inherited belonging"]
].map(([id,name,core,act,need])=>({id,name,core,act,need}));
const aspects=[
["conjunction","Conjunction","conjunct","the two themes concentrate in one place; notice what becomes inseparable",0],
["semi-sextile","Semi-Sextile","semi-sextile","neighboring needs need quiet accommodation rather than assumed harmony",30],
["octile","Octile","octile","a focused point of friction calls for a specific correction",45],
["sextile","Sextile","sextile","a cooperative opportunity is available if it is acted upon",60],
["quintile","Quintile","quintile","a specialized, inventive arrangement can be made from the two functions",72],
["square","Square","square","pressure to act reveals where the two principles cannot remain unexamined",90],
["trine","Trine","trine","the two principles exchange readily; ease still benefits from conscious use",120],
["tri-octile","Tri-Octile","tri-octile","accumulated tension highlights the need to redirect an existing approach",135],
["bi-quintile","Bi-Quintile","bi-quintile","a refined creative pattern emerges through practice and revision",144],
["quincunx","Quincunx","quincunx","continuing adjustment translates between needs that do not share an easy vocabulary",150],
["opposition","Opposition","opposite","contrast makes both sides visible, inviting relationship rather than victory",180]
].map(([id,name,verb,meaning,degrees])=>({id,name,verb,meaning,degrees}));
const base="https://oracleofrelphi.com/";
const file=(a,b)=>"astrology/pairs/"+a+"-"+b+".html";
const esc=x=>String(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const byId=id=>placements.find(x=>x.id===id);
function pairText(a,b){
 const same=a.id===b.id;
 return {
 transitive:`In a transit, ${a.name} describes the moving side: ${a.core}. The natal ${b.name} is the established point being contacted: ${b.core}. The question is how a period of ${a.need} meets a personal pattern of ${b.need}. A transit names a contact between chart positions, not an event that must happen.`,
 natal: same?`In a single birth chart, ${a.name} cannot occupy two independent natal longitudes as the same point. A "${a.name}–${b.name}" comparison is mainly useful across two charts or when transiting ${a.name} contacts natal ${b.name}.`:`In a natal chart, ${a.name} refers to ${a.core}, while ${b.name} refers to ${b.core}. An actual aspect, if present, describes a lasting relationship between ${a.need} and ${b.need}; without exact birth positions, there is no basis for claiming that the two are in aspect.`,
 question:`A useful reading question is: when someone needs to ${a.act}, what allows room for ${b.need}? The answer depends on the exact aspect, the signs, the houses and the chart context.`,
 caution:((a.id==="vertex"&&b.id==="anti-vertex")||(a.id==="anti-vertex"&&b.id==="vertex"))?"Vertex and Anti-Vertex are opposite ends of the same calculated axis; their opposition is definitional, not an independently discovered event.":((a.id==="asc"&&b.id==="dsc")||(a.id==="dsc"&&b.id==="asc")||(a.id==="mc"&&b.id==="ic")||(a.id==="ic"&&b.id==="mc")||(a.id==="north-node"&&b.id==="south-node")||(a.id==="south-node"&&b.id==="north-node"))?"These positions can describe opposite ends of the same chart axis. In the same sky, a defining opposition is not an additional independent discovery.":""
 };
}
function page(sourceId,targetId){
 const a=byId(sourceId),b=byId(targetId);if(!a||!b)throw Error("Unknown pairing "+sourceId+" "+targetId);
 const p=pairText(a,b),path=file(a.id,b.id),url=base+path;
 const name=a.name+" and "+b.name;
 const title=`${a.name} & ${b.name}: Transit and Natal Aspects | Oracle of Relphi`;
 const description=`Understand transiting ${a.name} aspects to natal ${b.name} and natal ${a.name}–${b.name} relationships. Explore all 11 aspect angles and refine by houses and signs.`;
 const linkedAspects=aspects.map(x=>`<li><a href="${esc(path)}?aspect=${x.id}">Transiting ${esc(a.name)} ${x.verb} natal ${esc(b.name)}</a>; natal ${esc(a.name)} ${x.verb} ${esc(b.name)}. ${esc(x.meaning)}. In this pairing, compare ${esc(a.need)} with ${esc(b.need)}.</li>`).join("\n");
 const rxEligible=new Set(["mercury","venus","mars","jupiter","saturn","uranus","neptune","pluto","chiron","lilith","north-node","south-node"]);
 const rxSection=rxEligible.has(a.id)?`<section><h2>Transiting ${esc(a.name)} retrograde aspect natal ${esc(b.name)}</h2><p>When transiting ${esc(a.name)} is retrograde, its apparent return can revisit the meeting of ${esc(a.need)} with ${esc(b.need)}. This does not make the aspect adverse. Repeated exact passes are possible but require actual longitude and date calculations; a glossary cannot assume there are three.</p></section>`:"";
 const reverse=file(b.id,a.id);
 const other=placements.filter(x=>x.id!==b.id).slice(0,4);
 const linkedOthers=other.map(x=>`<a href="${esc(file(a.id,x.id))}">${esc(a.name)} and ${esc(x.name)}</a>`).join(" · ");
 const ld=JSON.stringify([{"@context":"https://schema.org","@type":"DefinedTerm","name":name+" astrological pairing","description":p.transitive,"url":url,"inDefinedTermSet":base+"astrology-pairs.html"},{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Astrology Pairs","item":base+"astrology-pairs.html"},{"@type":"ListItem","position":2,"name":name,"item":url}]}]);
 return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<base href="../../">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Oracle of Relphi">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<link rel="icon" href="favicon.ico">
<link rel="stylesheet" href="style.css?v=346">
<link rel="stylesheet" href="astrology-glossary.css">
<link rel="stylesheet" href="astrology-pairs.css">
<script type="application/ld+json">${ld}</script>
</head>
<body class="astrology-reference-page astrology-pair-page">
<div id="nav-placeholder"></div>
<main class="reference-shell pair-shell" data-pair-source="${a.id}" data-pair-target="${b.id}">
<nav class="reference-topline" aria-label="Breadcrumb"><a href="index.html">Oracle of Relphi</a><span class="divider">/</span><a href="astrology-pairs.html">Aspect Pairs</a><span class="divider">/</span>${esc(name)}</nav>
<p class="reference-eyebrow">Astrological pair · Transit and natal reference</p>
<h1 class="reference-title">${esc(a.name)} <span class="red">and</span> ${esc(b.name)}</h1>
<p class="reference-subtitle">A reference for ${esc(a.name)} contacting ${esc(b.name)}. Choose an aspect and refine by houses, signs, and motion on this same page.</p>
<div class="definition"><h2>In one sentence</h2><p>When ${esc(a.name)} contacts ${esc(b.name)}, the relationship is between <strong>${esc(a.core)}</strong> and <strong>${esc(b.core)}</strong>; the aspect determines how those two functions meet.</p></div>
<div class="reference-two-col"><article class="reference-prose pair-prose">
<section><h2>Transiting ${esc(a.name)} aspect natal ${esc(b.name)}</h2><p>${esc(p.transitive)}</p></section>
<section><h2>Natal ${esc(a.name)} aspect ${esc(b.name)}</h2><p>${esc(p.natal)}</p></section>
<section><h2>How to interpret the pair</h2><p>${esc(p.question)}</p>${p.caution?`<p><strong>Axis or point note:</strong> ${esc(p.caution)}</p>`:""}</section>\n${rxSection}
<section id="pair-interactive-section"><h2>Refine this interpretation</h2><p>The selected aspect, houses, signs and retrograde conditions change the explanation below. These are interpretive controls, not a birth-chart calculation.</p>
<div id="pairInteractive" aria-label="Pair refinements"><p>JavaScript enables the refinements; the pair definitions and all 11 aspects remain readable below without it.</p></div>
</section>
<section><h2>All 11 aspects between ${esc(a.name)} and ${esc(b.name)}</h2>
<p>These are possible <em>types of relationships</em>, not a claim that your positions actually form all these angles. See the degree, orb, and exactness in <a href="sky-chart.html">Sky Chart</a>.</p>
<ul class="pair-aspect-links">${linkedAspects}</ul></section>
<section><h2>What information makes a reading specific?</h2>
<p><strong>Houses</strong> identify the life areas through which ${esc(a.need)} and ${esc(b.need)} are experienced. Signs describe the mode of expression; degrees establish whether an exact aspect exists. For a transit, the moving body's date and retrograde status also matter. A birth-time-dependent point requires reliable time and location data.</p>
<p>Relphi's interpretations are symbolic rather than forecasts of guaranteed events. No house choice or sign selection proves that the aspect is present.</p>
</section>
<div class="reference-links"><a class="primary" href="sky-chart.html">Open Sky Chart</a><a href="astrology-pairs.html">Explore all pairs</a></div>
</article>
<aside class="reference-aside" aria-label="Related reference">
<h2>Related pages</h2>
<a href="${esc(reverse)}">Reverse the direction: ${esc(b.name)} → ${esc(a.name)}</a>
<a href="astrology-glossary.html">Astrology glossary</a>
<a href="glossary-stubs.html">Draft combinatorial workbench</a>
<p>Other pairings from ${esc(a.name)}:</p>${linkedOthers}
</aside></div>
</main>
<footer class="reference-footer"><a href="astrology-pairs.html">Astrology Pairs</a> · Oracle of Relphi · <a href="index.html">Home</a></footer>
<script src="glossary-stub-catalog.js"></script>
<script src="astrology-pair-interactions.js"></script>
<script src="navloader.js"></script>
</body>
</html>`;
}
function directory(){
 let nav=placements.map(a=>`<a href="#group-${a.id}">${esc(a.name)}</a>`).join(" ");
 let groups=placements.map(a=>`<section class="pair-group" id="group-${a.id}"><h2>${esc(a.name)} with other placements</h2><p>Open a page for a transiting ${esc(a.name)} contact to another natal placement, or use its natal pairing interpretation.</p><div class="pair-link-grid">${placements.map(b=>`<a class="pair-link" data-pair-label="${esc((a.name+" "+b.name).toLowerCase())}" href="${esc(file(a.id,b.id))}">${esc(a.name)} <span>and</span> ${esc(b.name)}</a>`).join("")}</div></section>`).join("\n");
 return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Astrology Aspects by Planet and Point | Oracle of Relphi</title>
<meta name="description" content="Explore astrology aspects for every pair of 21 planetary placements and points. Find natal and transiting interpretations and refine with signs, houses and aspect angles.">
<meta name="robots" content="index,follow"><link rel="canonical" href="${base}astrology-pairs.html">
<link rel="icon" href="favicon.ico"><link rel="stylesheet" href="style.css?v=346"><link rel="stylesheet" href="astrology-glossary.css"><link rel="stylesheet" href="astrology-pairs.css">
</head><body class="astrology-reference-page"><div id="nav-placeholder"></div><main class="reference-shell pair-directory">
<nav class="reference-topline"><a href="index.html">Oracle of Relphi</a> / <a href="astrology-glossary.html">Astrology Glossary</a> / Aspect Pairs</nav>
<p class="reference-eyebrow">Astrological reference library</p><h1 class="reference-title">Aspects between <span class="red">placements</span></h1>
<p class="reference-subtitle">Select two placements, then refine the meaning with an aspect, houses, signs, and motion. Each pair has a stable page covering both transit-to-natal and natal contexts.</p>
<p>Browse <strong>${placements.length*placements.length} ordered placement pairs</strong> across ${placements.length} placements. Reversing the pair changes which position is the transiting one. A page describes potential aspects without asserting that a particular chart contains them.</p>
<label class="pair-search-label">Find a placement or pair <input id="pairSearch" type="search" placeholder="Try Uranus Part of Fortune" autocomplete="off"></label>
<nav class="pair-jump" aria-label="Browse first placement">${nav}</nav>
<div id="pairGroups">${groups}</div><p id="pairNoMatches" hidden>No pairs matched. Try another placement name.</p>
<div class="reference-links"><a href="astrology-glossary.html">Astrology glossary</a><a href="sky-chart.html">Open Sky Chart</a></div>
</main><footer class="reference-footer">Oracle of Relphi · <a href="index.html">Home</a></footer>
<script src="astrology-pair-directory.js"></script><script src="navloader.js"></script></body></html>`;
}
function sitemap(){
 let links=[base,base+"astrology-foundations.html",base+"astrology-pairs.html"];
 for(const a of placements)for(const b of placements)links.push(base+file(a.id,b.id));
 return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+links.map(u=>"  <url><loc>"+esc(u)+"</loc></url>").join("\n")+"\n</urlset>\n";
}
return Object.freeze({placements,aspects,file,page,directory,sitemap});
})();
if(typeof module!=='undefined')module.exports=RelphiPairBuilder;
