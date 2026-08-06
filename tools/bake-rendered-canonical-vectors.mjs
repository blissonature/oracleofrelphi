#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const BASIC_SHAPES = new Set(['path', 'circle', 'rect']);
const CONTAINER_TAGS = new Set(['svg', 'g']);
const FORBIDDEN_TAGS = new Set(['text', 'script', 'foreignobject', 'image', 'use', 'filter', 'mask', 'clippath', 'iframe', 'object', 'embed', 'style', 'symbol', 'pattern', 'lineargradient', 'radialgradient', 'marker']);
const PAINT_ATTRIBUTES = ['fill', 'fill-rule', 'clip-rule', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'opacity', 'fill-opacity', 'stroke-opacity', 'paint-order'];
const PATH_ARGUMENTS = { M:2, L:2, H:1, V:1, C:6, S:4, Q:4, A:7, Z:0 };
const VALID_STATUSES = new Set(['exact-static-candidate', 'blocked-font-or-text', 'blocked-unsupported-vector-feature', 'blocked-missing-or-invalid-capture', 'failed-pixel-equivalence']);
const IDENTITY_NAMES = new Map();

const planets = new Set(['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','lilith']);
const zodiacs = new Set(['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']);
const elements = new Set(['fire','water','air','earth']);
const aspects = new Set(['conjunction','opposition','trine','square','sextile','semi-sextile','quincunx','octile','tri-octile','quintile','bi-quintile']);
const astrologyPaths = {
  chiron:'assets/planet-glyphs/chiron.svg',
  'north-node':'assets/planet-glyphs/north-node.svg',
  'south-node':'assets/planet-glyphs/south-node.svg',
  'part-of-fortune':'assets/planet-glyphs/part-of-fortune.svg',
  vertex:'assets/planet-glyphs/vertex.svg',
  asc:'assets/planet-glyphs/ascendant.svg',
  dsc:'assets/planet-glyphs/descendant.svg',
  mc:'assets/planet-glyphs/midheaven.svg',
  ic:'assets/planet-glyphs/imum-coeli.svg'
};

export function expectedCanonicalFilename(id) {
  if (id === 'trine') return 'assets/aspect-glyphs/trine.svg';
  if (planets.has(id)) return `assets/planet-glyphs/${id}.svg`;
  if (zodiacs.has(id)) return `assets/zodiac-glyphs/${id}.svg`;
  if (elements.has(id)) return `assets/element-glyphs/${id}.svg`;
  if (aspects.has(id)) return `assets/aspect-glyphs/${id}.svg`;
  if (astrologyPaths[id]) return astrologyPaths[id];
  if (id.startsWith('hebrew-')) return `assets/hebrew-glyphs/${id}.svg`;
  if (id.startsWith('greek-')) return `assets/greek-glyphs/${id}.svg`;
  throw new Error(`No canonical filename is defined for ${id}.`);
}

function decodeXml(value) {
  return String(value).replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function encodeXml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function parseXml(source) {
  const document = { name:'#document', attributes:{}, children:[] };
  const stack = [document];
  const tokens = String(source).match(/<[^>]+>|[^<]+/g) || [];
  for (const token of tokens) {
    if (!token.startsWith('<')) {
      if (token.trim()) stack.at(-1).children.push({ name:'#text', value:decodeXml(token) });
      continue;
    }
    if (/^<\?/.test(token) || /^<!--/.test(token)) continue;
    if (/^<!/.test(token)) throw new Error('Unsupported XML declaration or document type.');
    if (/^<\//.test(token)) {
      const closing = token.slice(2, -1).trim().toLowerCase();
      const current = stack.pop();
      if (!current || current.name.toLowerCase() !== closing) throw new Error(`Mismatched closing tag ${closing}.`);
      continue;
    }
    const selfClosing = /\/>$/.test(token);
    const inner = token.slice(1, selfClosing ? -2 : -1).trim();
    const nameMatch = inner.match(/^([^\s/>]+)/);
    if (!nameMatch) throw new Error('Invalid XML start tag.');
    const node = { name:nameMatch[1], attributes:{}, children:[] };
    const attributeSource = inner.slice(nameMatch[0].length);
    const attributePattern = /([^\s=]+)\s*=\s*"([^"]*)"/g;
    let match;
    let consumed = '';
    while ((match = attributePattern.exec(attributeSource))) {
      node.attributes[match[1]] = decodeXml(match[2]);
      consumed += match[0];
    }
    const residue = attributeSource.replace(attributePattern, '').trim();
    if (residue) throw new Error(`Unsupported or malformed attributes on <${node.name}>: ${residue}`);
    stack.at(-1).children.push(node);
    if (!selfClosing) stack.push(node);
  }
  if (stack.length !== 1) throw new Error('Unclosed XML elements.');
  const roots = document.children.filter(node => node.name !== '#text');
  if (roots.length !== 1) throw new Error(`Expected one root element; found ${roots.length}.`);
  return roots[0];
}

function walk(node, visit) {
  visit(node);
  for (const child of node.children || []) if (child.name !== '#text') walk(child, visit);
}

function findDirectChild(node, predicate) {
  return (node.children || []).find(child => child.name !== '#text' && predicate(child)) || null;
}

function findFirst(node, predicate) {
  if (predicate(node)) return node;
  for (const child of node.children || []) {
    if (child.name === '#text') continue;
    const found = findFirst(child, predicate);
    if (found) return found;
  }
  return null;
}

function parseStyle(style) {
  const values = {};
  for (const declaration of String(style || '').split(';')) {
    const index = declaration.indexOf(':');
    if (index < 0) continue;
    const key = declaration.slice(0, index).trim();
    const value = declaration.slice(index + 1).trim();
    if (key) values[key] = value;
  }
  return values;
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function formatNumber(value) {
  if (!Number.isFinite(value)) throw new Error(`Non-finite coordinate ${value}.`);
  const normalized = Object.is(value, -0) ? 0 : value;
  return String(normalized);
}

function identityMatrix() {
  return [1,0,0,1,0,0];
}

export function multiplyMatrices(left, right) {
  const [a,b,c,d,e,f] = left;
  const [g,h,i,j,k,l] = right;
  return [a*g+c*h, b*g+d*h, a*i+c*j, b*i+d*j, a*k+c*l+e, b*k+d*l+f];
}

function applyMatrix(matrix, x, y) {
  return { x:matrix[0]*x+matrix[2]*y+matrix[4], y:matrix[1]*x+matrix[3]*y+matrix[5] };
}

function matrixScale(matrix) {
  const sx = Math.hypot(matrix[0], matrix[1]);
  const sy = Math.hypot(matrix[2], matrix[3]);
  const dot = matrix[0]*matrix[2] + matrix[1]*matrix[3];
  if (Math.abs(sx - sy) > 1e-9 || Math.abs(dot) > 1e-9) throw new Error('Non-uniform or skewed transforms are unsupported.');
  return sx;
}

function matrixRotationDegrees(matrix) {
  matrixScale(matrix);
  return Math.atan2(matrix[1], matrix[0]) * 180 / Math.PI;
}

export function parseTransform(value) {
  if (!value || value.trim() === '' || value.trim() === 'none') return identityMatrix();
  let matrix = identityMatrix();
  const pattern = /([a-zA-Z]+)\s*\(([^)]*)\)/g;
  let match;
  let consumed = '';
  while ((match = pattern.exec(value))) {
    const name = match[1].toLowerCase();
    const numbers = match[2].trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (numbers.some(number => !Number.isFinite(number))) throw new Error(`Invalid transform ${match[0]}.`);
    let next;
    if (name === 'translate' && (numbers.length === 1 || numbers.length === 2)) next = [1,0,0,1,numbers[0],numbers[1] || 0];
    else if (name === 'scale' && (numbers.length === 1 || numbers.length === 2)) next = [numbers[0],0,0,numbers[1] ?? numbers[0],0,0];
    else if (name === 'rotate' && (numbers.length === 1 || numbers.length === 3)) {
      const radians = numbers[0] * Math.PI / 180;
      const rotation = [Math.cos(radians),Math.sin(radians),-Math.sin(radians),Math.cos(radians),0,0];
      if (numbers.length === 3) {
        const [,cx,cy] = numbers;
        next = multiplyMatrices(multiplyMatrices([1,0,0,1,cx,cy], rotation), [1,0,0,1,-cx,-cy]);
      } else next = rotation;
    } else if (name === 'matrix' && numbers.length === 6) next = numbers;
    else throw new Error(`Unsupported transform ${match[0]}.`);
    matrix = multiplyMatrices(matrix, next);
    consumed += match[0];
  }
  if (value.replace(pattern, '').trim()) throw new Error(`Unsupported transform syntax: ${value}.`);
  return matrix;
}

function pathTokens(data) {
  const tokens = String(data).match(/[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) || [];
  const residue = String(data).replace(/[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?|[\s,]+/g, '');
  if (residue) throw new Error(`Unsupported path data residue: ${residue}.`);
  return tokens;
}

export function transformPathData(data, matrix) {
  const tokens = pathTokens(data);
  const output = [];
  let index = 0;
  let command = null;
  let current = { x:0, y:0 };
  let subpath = { x:0, y:0 };
  const scale = matrixScale(matrix);
  const rotation = matrixRotationDegrees(matrix);
  while (index < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[index])) command = tokens[index++];
    if (!command) throw new Error('Path data starts without a command.');
    const upper = command.toUpperCase();
    const relative = command !== upper;
    const count = PATH_ARGUMENTS[upper];
    if (count === undefined) throw new Error(`Unsupported path command ${command}.`);
    if (upper === 'Z') {
      output.push('Z');
      current = { ...subpath };
      command = null;
      continue;
    }
    if (index + count > tokens.length) throw new Error(`Incomplete path command ${command}.`);
    const values = tokens.slice(index, index + count).map(Number);
    if (values.some(value => !Number.isFinite(value))) throw new Error(`Invalid path command ${command}.`);
    index += count;
    const point = (x, y) => applyMatrix(matrix, relative ? x + current.x : x, relative ? y + current.y : y);
    const absoluteSourcePoint = (x, y) => ({ x:relative ? x + current.x : x, y:relative ? y + current.y : y });
    if (upper === 'M' || upper === 'L') {
      const source = absoluteSourcePoint(values[0], values[1]);
      const target = applyMatrix(matrix, source.x, source.y);
      output.push(`${upper}${formatNumber(target.x)} ${formatNumber(target.y)}`);
      current = source;
      if (upper === 'M') {
        subpath = { ...source };
        command = relative ? 'l' : 'L';
      }
    } else if (upper === 'H') {
      const source = { x:relative ? current.x + values[0] : values[0], y:current.y };
      const target = applyMatrix(matrix, source.x, source.y);
      output.push(`L${formatNumber(target.x)} ${formatNumber(target.y)}`);
      current = source;
    } else if (upper === 'V') {
      const source = { x:current.x, y:relative ? current.y + values[0] : values[0] };
      const target = applyMatrix(matrix, source.x, source.y);
      output.push(`L${formatNumber(target.x)} ${formatNumber(target.y)}`);
      current = source;
    } else if (upper === 'C') {
      const p1 = point(values[0], values[1]);
      const p2 = point(values[2], values[3]);
      const p = point(values[4], values[5]);
      output.push(`C${formatNumber(p1.x)} ${formatNumber(p1.y)} ${formatNumber(p2.x)} ${formatNumber(p2.y)} ${formatNumber(p.x)} ${formatNumber(p.y)}`);
      current = absoluteSourcePoint(values[4], values[5]);
    } else if (upper === 'S' || upper === 'Q') {
      const p1 = point(values[0], values[1]);
      const p = point(values[2], values[3]);
      output.push(`${upper}${formatNumber(p1.x)} ${formatNumber(p1.y)} ${formatNumber(p.x)} ${formatNumber(p.y)}`);
      current = absoluteSourcePoint(values[2], values[3]);
    } else if (upper === 'A') {
      const p = point(values[5], values[6]);
      const determinant = matrix[0]*matrix[3]-matrix[1]*matrix[2];
      const sweep = determinant < 0 ? (values[4] ? 0 : 1) : values[4];
      output.push(`A${formatNumber(Math.abs(values[0]*scale))} ${formatNumber(Math.abs(values[1]*scale))} ${formatNumber(values[2]+rotation)} ${values[3] ? 1 : 0} ${sweep ? 1 : 0} ${formatNumber(p.x)} ${formatNumber(p.y)}`);
      current = absoluteSourcePoint(values[5], values[6]);
    }
    if (index < tokens.length && /^[A-Za-z]$/.test(tokens[index])) continue;
  }
  return output.join('');
}

function inspectForbidden(node) {
  let blocker = null;
  walk(node, current => {
    if (blocker) return;
    const tag = current.name.toLowerCase();
    if (tag === '#text') return;
    if (FORBIDDEN_TAGS.has(tag)) {
      blocker = tag === 'text' ? 'blocked-font-or-text' : 'blocked-unsupported-vector-feature';
      return;
    }
    if (!BASIC_SHAPES.has(tag) && !CONTAINER_TAGS.has(tag)) {
      blocker = 'blocked-unsupported-vector-feature';
      return;
    }
    for (const [name, value] of Object.entries(current.attributes || {})) {
      const lower = name.toLowerCase();
      if (lower.startsWith('on') || lower === 'href' || lower.endsWith(':href') || ['filter','mask','clip-path'].includes(lower) || /url\s*\(/i.test(value)) blocker = 'blocked-unsupported-vector-feature';
      if (lower.includes('font') || /font-family/i.test(value)) blocker = 'blocked-font-or-text';
      if (lower === 'vector-effect' && value !== 'none') blocker = 'blocked-unsupported-vector-feature';
    }
  });
  return blocker;
}

function effectivePaint(attributes, inherited) {
  const style = parseStyle(attributes.style);
  const paint = { ...inherited };
  for (const name of PAINT_ATTRIBUTES) {
    if (attributes[name] !== undefined) paint[name] = attributes[name];
    if (style[name] !== undefined) paint[name] = style[name];
  }
  return paint;
}

function transformedPaint(paint, scale, strokeMutations) {
  const output = {};
  for (const name of PAINT_ATTRIBUTES) {
    if (paint[name] === undefined) continue;
    let value = paint[name];
    if (name === 'stroke-width' || name === 'stroke-dashoffset') {
      const numeric = Number.parseFloat(value);
      if (!Number.isFinite(numeric)) throw new Error(`Unsupported ${name}: ${value}.`);
      const baked = numeric * scale;
      strokeMutations.push({ attribute:name, source:formatNumber(numeric), scale:formatNumber(scale), baked:formatNumber(baked) });
      value = formatNumber(baked);
    } else if (name === 'stroke-dasharray' && value !== 'none') {
      const values = value.split(/[\s,]+/).filter(Boolean).map(Number);
      if (values.some(number => !Number.isFinite(number))) throw new Error(`Unsupported stroke-dasharray: ${value}.`);
      value = values.map(number => formatNumber(number * scale)).join(' ');
    }
    output[name] = value;
  }
  return output;
}

function serializeShape(name, attributes) {
  const order = ['d','cx','cy','r','x','y','width','height','rx','ry',...PAINT_ATTRIBUTES];
  const keys = [...new Set([...order, ...Object.keys(attributes).sort()])].filter(key => attributes[key] !== undefined);
  return `<${name}${keys.map(key => ` ${key}="${encodeXml(attributes[key])}"`).join('')}/>`;
}

function flattenNode(node, parentMatrix, inheritedPaint, state) {
  const localTransform = parseTransform(node.attributes?.transform || '');
  if (node.attributes?.transform) state.transforms.push(node.attributes.transform);
  const matrix = multiplyMatrices(parentMatrix, localTransform);
  const tag = node.name.toLowerCase();
  const paint = effectivePaint(node.attributes || {}, inheritedPaint);
  if (tag === 'g' || tag === 'svg') {
    return (node.children || []).filter(child => child.name !== '#text').flatMap(child => flattenNode(child, matrix, paint, state));
  }
  const scale = matrixScale(matrix);
  const finalPaint = transformedPaint(paint, scale, state.strokeMutations);
  if (tag === 'path') {
    if (!node.attributes.d) throw new Error('Path is missing d.');
    return [serializeShape('path', { d:transformPathData(node.attributes.d, matrix), ...finalPaint })];
  }
  if (tag === 'circle') {
    const center = applyMatrix(matrix, Number(node.attributes.cx || 0), Number(node.attributes.cy || 0));
    const radius = Number(node.attributes.r);
    if (!Number.isFinite(radius)) throw new Error('Circle has invalid radius.');
    return [serializeShape('circle', { cx:formatNumber(center.x), cy:formatNumber(center.y), r:formatNumber(radius*scale), ...finalPaint })];
  }
  if (tag === 'rect') {
    if (node.attributes.rx || node.attributes.ry) throw new Error('Rounded rectangles are unsupported.');
    const x = Number(node.attributes.x || 0);
    const y = Number(node.attributes.y || 0);
    const width = Number(node.attributes.width);
    const height = Number(node.attributes.height);
    if (![x,y,width,height].every(Number.isFinite)) throw new Error('Rectangle has invalid dimensions.');
    if (Math.abs(matrix[1]) < 1e-15 && Math.abs(matrix[2]) < 1e-15) {
      const first = applyMatrix(matrix, x, y);
      const second = applyMatrix(matrix, x + width, y + height);
      return [serializeShape('rect', {
        x:formatNumber(Math.min(first.x, second.x)),
        y:formatNumber(Math.min(first.y, second.y)),
        width:formatNumber(Math.abs(second.x - first.x)),
        height:formatNumber(Math.abs(second.y - first.y)),
        ...finalPaint
      })];
    }
    const d = `M${formatNumber(x)} ${formatNumber(y)}L${formatNumber(x+width)} ${formatNumber(y)}L${formatNumber(x+width)} ${formatNumber(y+height)}L${formatNumber(x)} ${formatNumber(y+height)}Z`;
    return [serializeShape('path', { d:transformPathData(d, matrix), ...finalPaint })];
  }
  throw new Error(`Unsupported visible tag <${tag}>.`);
}

function removePlainRing(root) {
  const bubble = findFirst(root, node => node.name.toLowerCase() === 'g' && String(node.attributes?.class || '').split(/\s+/).includes('relphi-glyph-bubble'));
  if (!bubble) throw new Error('Captured SVG does not contain a relphi-glyph-bubble group.');
  const ringIndex = bubble.children.findIndex(child => child.name.toLowerCase() === 'circle' && child.attributes?.['aria-hidden'] === 'true');
  if (ringIndex < 0) throw new Error('Captured SVG does not contain the hidden presentation ring.');
  bubble.children.splice(ringIndex, 1);
  return bubble;
}

function outerCanvasMatrix(viewBox) {
  const numbers = String(viewBox || '').trim().split(/[\s,]+/).map(Number);
  if (numbers.length !== 4 || numbers.some(number => !Number.isFinite(number)) || numbers[2] <= 0 || numbers[3] <= 0) throw new Error(`Invalid viewBox ${viewBox}.`);
  const [minX,minY,width,height] = numbers;
  if (Math.abs(width-height) > 1e-9) throw new Error('Only square source canvases are supported.');
  const scale = 100/width;
  return [scale,0,0,scale,-minX*scale,-minY*scale];
}

export function bakeCapturedSvg(source, { identity='unknown', name=identity, removeRing=true } = {}) {
  const root = parseXml(source);
  if (root.name.toLowerCase() !== 'svg') throw new Error('Captured source root is not SVG.');
  const target = removeRing ? removePlainRing(root) : root;
  const blocker = inspectForbidden(target);
  if (blocker) return { status:blocker, blocker:blocker === 'blocked-font-or-text' ? 'Visible artwork depends on <text> or font styling.' : 'Visible artwork uses a forbidden or unsupported SVG feature.' };
  const state = { transforms:[], strokeMutations:[] };
  const canvas = outerCanvasMatrix(root.attributes.viewBox);
  const shapes = flattenNode(target, canvas, {}, state);
  if (!shapes.length) return { status:'blocked-missing-or-invalid-capture', blocker:'No visible basic vector shapes remained after inspection.' };
  const output = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${encodeXml(name)}">${shapes.join('')}</svg>\n`;
  if (/\btransform=|<text\b|\bfont/i.test(output)) throw new Error(`Final ${identity} output retained a prohibited transform or font dependency.`);
  return { status:'exact-static-candidate', output, transforms:state.transforms, strokeMutations:state.strokeMutations, geometryElementCount:shapes.length };
}

function plainCapturedSvg(entry) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 -32 64 64" role="img" aria-label="${encodeXml(entry.name)}">${entry.bubbleOuterHTML}</svg>\n`;
}

function serializeOriginalWithoutRing(source) {
  const root = parseXml(source);
  removePlainRing(root);
  function serialize(node) {
    if (node.name === '#text') return encodeXml(node.value);
    const attrs = Object.entries(node.attributes || {}).map(([key,value]) => ` ${key}="${encodeXml(value)}"`).join('');
    return `<${node.name}${attrs}>${(node.children || []).map(serialize).join('')}</${node.name}>`;
  }
  return `${serialize(root)}\n`;
}

function loadSharp() {
  const require = createRequire(import.meta.url);
  try { return require('sharp'); }
  catch (error) { throw new Error('The sharp package is required for pixel-equivalence validation. Make it resolvable through node_modules or NODE_PATH.', { cause:error }); }
}

export async function renderSvg(sharp, source, outputPixels) {
  const sizedSource=String(source).replace(/<svg\b/, `<svg width="${outputPixels}" height="${outputPixels}"`);
  return sharp(Buffer.from(sizedSource)).flatten({ background:'#ffffff' }).removeAlpha().raw().toBuffer();
}

function pixelBounds(raw, size) {
  let minX=size,minY=size,maxX=-1,maxY=-1;
  for (let pixel=0; pixel<size*size; pixel+=1) {
    const offset=pixel*3;
    if (raw[offset]===255 && raw[offset+1]===255 && raw[offset+2]===255) continue;
    const x=pixel%size,y=Math.floor(pixel/size);
    minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
  }
  return maxX<0 ? null : { x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1 };
}

export async function compareSvgPair(sharp, first, second, sizes, densities) {
  const results=[];
  for (const size of sizes) for (const density of densities) {
    const pixels=size*density;
    const firstRaw=await renderSvg(sharp, first, pixels);
    const secondRaw=await renderSvg(sharp, second, pixels);
    let differingPixels=0;
    for (let index=0; index<firstRaw.length; index+=3) if (firstRaw[index]!==secondRaw[index] || firstRaw[index+1]!==secondRaw[index+1] || firstRaw[index+2]!==secondRaw[index+2]) differingPixels+=1;
    results.push({ size, density, outputPixels:pixels, differingPixels, firstVisibleBounds:pixelBounds(firstRaw,pixels), secondVisibleBounds:pixelBounds(secondRaw,pixels) });
  }
  return results;
}

export function equivalencePassed(results) {
  return results.every(result => result.differingPixels === 0 && JSON.stringify(result.firstVisibleBounds) === JSON.stringify(result.secondVisibleBounds));
}

export async function writeCandidateAfterEquivalence(outputPath, output, results) {
  if (!equivalencePassed(results)) {
    await rm(outputPath,{force:true});
    return false;
  }
  await mkdir(path.dirname(outputPath),{recursive:true});
  await writeFile(outputPath,output,'utf8');
  return true;
}

function gitFile(repo, revision, file) {
  try {
    const blobSha=execFileSync('git',['-C',repo,'rev-parse',`${revision}:${file}`],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
    const bytes=execFileSync('git',['-C',repo,'cat-file','blob',blobSha]);
    return { blobSha, bytes, source:bytes.toString('utf8'), sha256:sha256(bytes) };
  } catch { return null; }
}

function parseArguments(argv) {
  const options={ sizes:[100,400,1000], densities:[1,2] };
  for (let index=0; index<argv.length; index+=1) {
    const key=argv[index];
    if (key==='--captures') options.captures=argv[++index];
    else if (key==='--repo') options.repo=argv[++index];
    else if (key==='--manifest') options.manifest=argv[++index];
    else if (key==='--output') options.output=argv[++index];
    else if (key==='--revision') options.revision=argv[++index];
    else if (key==='--sizes') options.sizes=argv[++index].split(',').map(Number);
    else if (key==='--densities') options.densities=argv[++index].split(',').map(Number);
    else if (key==='--help') options.help=true;
    else throw new Error(`Unknown argument ${key}.`);
  }
  return options;
}

function usage() {
  return `Usage: node tools/bake-rendered-canonical-vectors.mjs --captures <live-circled-evidence.json> --repo <repository> --manifest <approved-manifest.json> --output <review-output> [--revision HEAD]\n`;
}

export async function runBake(options) {
  for (const required of ['captures','repo','manifest','output']) if (!options[required]) throw new Error(`Missing --${required}.`);
  const sharp=loadSharp();
  const captures=JSON.parse(await readFile(options.captures,'utf8'));
  const approvedManifest=JSON.parse(await readFile(options.manifest,'utf8'));
  const revision=options.revision || 'HEAD';
  const sizes=options.sizes || [100,400,1000];
  const densities=options.densities || [1,2];
  const outputRoot=path.resolve(options.output);
  const mastersRoot=path.join(outputRoot,'masters');
  const overlaysRoot=path.join(outputRoot,'overlays');
  for (const directory of [mastersRoot,overlaysRoot]) {
    const relative=path.relative(outputRoot,directory);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Unsafe review-output reset target: ${directory}.`);
    await rm(directory,{recursive:true,force:true});
  }
  await mkdir(mastersRoot,{recursive:true});
  await mkdir(overlaysRoot,{recursive:true});
  const records=[];

  for (const entry of captures.entries || []) {
    const identity=entry.id;
    IDENTITY_NAMES.set(identity,entry.name);
    let source;
    let baked;
    try {
      if (!identity || !entry.bubbleOuterHTML) throw new Error('Capture is missing identity or rendered SVG markup.');
      source=plainCapturedSvg(entry);
      baked=bakeCapturedSvg(source,{identity,name:entry.name,removeRing:true});
    } catch (error) {
      records.push({ identity:identity || null, capturedSourceHash:source?sha256(Buffer.from(source)):null, outputPath:null, outputSHA256:null, viewBox:null, flattenedTransforms:[], flattenedStrokeMutations:[], validation:{sizes,densities,results:[]}, candidateStatus:'blocked-missing-or-invalid-capture', blocker:error.message });
      continue;
    }
    if (baked.status !== 'exact-static-candidate') {
      records.push({ identity, capturedSourceHash:sha256(Buffer.from(source)), outputPath:null, outputSHA256:null, viewBox:null, flattenedTransforms:[], flattenedStrokeMutations:[], validation:{sizes,densities,results:[]}, candidateStatus:baked.status, blocker:baked.blocker });
      continue;
    }
    const plainSource=serializeOriginalWithoutRing(source);
    const validation=await compareSvgPair(sharp,plainSource,baked.output,sizes,densities);
    if (!equivalencePassed(validation)) {
      records.push({ identity, capturedSourceHash:sha256(Buffer.from(source)), outputPath:null, outputSHA256:null, viewBox:'0 0 100 100', geometryElementCount:baked.geometryElementCount, flattenedTransforms:baked.transforms, flattenedStrokeMutations:baked.strokeMutations, validation:{sizes,densities,results:validation}, candidateStatus:'failed-pixel-equivalence', blocker:'Baked candidate did not produce zero differing pixels and identical visible bounds at every required size and density.' });
      continue;
    }
    const expected=expectedCanonicalFilename(identity);
    const outputPath=path.join(mastersRoot,...expected.split('/'));
    await writeCandidateAfterEquivalence(outputPath,baked.output,validation);
    const current=gitFile(options.repo,revision,expected);
    const pinnedBlob=approvedManifest.runtime_files?.[expected] || null;
    const pinned=pinnedBlob ? gitFile(options.repo,pinnedBlob,expected) || (()=>{try{const bytes=execFileSync('git',['-C',options.repo,'cat-file','blob',pinnedBlob]);return{blobSha:pinnedBlob,bytes,source:bytes.toString('utf8'),sha256:sha256(bytes)}}catch{return null}})() : null;
    const currentComparison=current ? await compareSvgPair(sharp,baked.output,current.source,sizes,densities) : null;
    const pinnedComparison=pinned ? await compareSvgPair(sharp,baked.output,pinned.source,sizes,densities) : null;
    records.push({ identity, capturedSourceHash:sha256(Buffer.from(source)), outputPath:path.relative(outputRoot,outputPath).replaceAll('\\','/'), expectedCanonicalFilename:expected, outputSHA256:sha256(Buffer.from(baked.output)), viewBox:'0 0 100 100', geometryElementCount:baked.geometryElementCount, flattenedTransforms:baked.transforms, flattenedStrokeMutations:baked.strokeMutations, validation:{sizes,densities,results:validation}, currentAsset:current?{blobSha:current.blobSha,sha256:current.sha256,comparison:currentComparison}:null, pinnedAsset:pinned?{blobSha:pinned.blobSha,sha256:pinned.sha256,comparison:pinnedComparison}:null, candidateStatus:'exact-static-candidate', blocker:null });
  }

  const ringEntry=(captures.entries||[]).find(entry=>entry.ringOuterHTML);
  let overlayRecord;
  if (!ringEntry) overlayRecord={identity:'state:circled',candidateStatus:'blocked-missing-or-invalid-capture',blocker:'No captured ring exists.'};
  else {
    const ringSource=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 -32 64 64" role="img" aria-label="Circled backplate">${ringEntry.ringOuterHTML}</svg>\n`;
    const ringBake=bakeCapturedSvg(ringSource,{identity:'state:circled',name:'Circled backplate',removeRing:false});
    if (ringBake.status!=='exact-static-candidate') overlayRecord={identity:'state:circled',candidateStatus:ringBake.status,blocker:ringBake.blocker};
    else {
      const validation=await compareSvgPair(sharp,ringSource,ringBake.output,sizes,densities);
      const expectedGeometry={cx:'50',cy:'50',r:'29.6875',strokeWidth:'3.671875'};
      const root=parseXml(ringBake.output);
      const circle=findFirst(root,node=>node.name.toLowerCase()==='circle');
      const crossCheck=Boolean(circle&&circle.attributes.cx===expectedGeometry.cx&&circle.attributes.cy===expectedGeometry.cy&&circle.attributes.r===expectedGeometry.r&&circle.attributes['stroke-width']===expectedGeometry.strokeWidth);
      if (!crossCheck || !equivalencePassed(validation)) overlayRecord={identity:'state:circled',candidateStatus:'failed-pixel-equivalence',blocker:'Ring conversion failed its mathematical or pixel-equivalence cross-check.',validation:{sizes,densities,results:validation}};
      else {
        const overlayPath=path.join(overlaysRoot,'circled.svg');
        await writeFile(overlayPath,ringBake.output,'utf8');
        overlayRecord={identity:'state:circled',capturedSourceHash:sha256(Buffer.from(ringSource)),outputPath:'overlays/circled.svg',outputSHA256:sha256(Buffer.from(ringBake.output)),viewBox:'0 0 100 100',flattenedTransforms:ringBake.transforms,flattenedStrokeMutations:ringBake.strokeMutations,validation:{sizes,densities,results:validation},mathematicalCrossCheck:expectedGeometry,candidateStatus:'exact-static-candidate',blocker:null,backplateZOrder:'mount beneath glyph artwork'};
      }
    }
  }

  for (const record of records) if (!VALID_STATUSES.has(record.candidateStatus)) throw new Error(`Invalid status ${record.candidateStatus}.`);
  const manifestDocument={schema:'relphi-baked-canonical-candidates/v1',generatedFromCapturedAuthority:path.resolve(options.captures),repositoryRevision:revision,outerCanvasConversion:{sourceViewBox:'-32 -32 64 64',targetViewBox:'0 0 100 100',matrix:[1.5625,0,0,1.5625,50,50]},validation:{sizes,densities,paint:'black artwork on opaque white square canvas'},identities:records,overlays:[overlayRecord]};
  await writeFile(path.join(outputRoot,'manifest.json'),`${JSON.stringify(manifestDocument,null,2)}\n`,'utf8');
  const counts=Object.fromEntries([...VALID_STATUSES].map(status=>[status,records.filter(record=>record.candidateStatus===status).length]));
  const textBlocked=records.filter(record=>record.candidateStatus==='blocked-font-or-text').map(record=>record.identity);
  const report=[
    '# Baked canonical candidate report','',
    `Captured identities classified: ${records.length}`,'',
    ...Object.entries(counts).map(([status,count])=>`- ${status}: ${count}`),'',
    `Circled overlay: ${overlayRecord.candidateStatus}`,'',
    '## Font/text blocked','',textBlocked.length?textBlocked.map(id=>`- ${id}`).join('\n'):'None','',
    'All candidates are review-only. Production assets and manifests were not modified.'
  ].join('\n');
  await writeFile(path.join(outputRoot,'report.md'),`${report}\n`,'utf8');
  return {manifest:manifestDocument,counts,textBlocked,overlayRecord};
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const options=parseArguments(process.argv.slice(2));
  if (options.help) process.stdout.write(usage());
  else {
    const result=await runBake(options);
    process.stdout.write(`${JSON.stringify({counts:result.counts,textBlocked:result.textBlocked,overlay:result.overlayRecord.candidateStatus},null,2)}\n`);
  }
}
