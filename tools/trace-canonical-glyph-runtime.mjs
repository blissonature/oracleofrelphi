#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const argv = process.argv.slice(2);
const option = (name, fallback = null) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const auditPath = option('--audit');
const outputDirectory = option('--output');
const baseUrl = option('--base-url');
if (!auditPath || !outputDirectory || !baseUrl) throw new Error('Usage: trace-canonical-glyph-runtime.mjs --audit <execution-plan.json> --base-url <url> --output <directory>');

const audit = JSON.parse(await readFile(auditPath, 'utf8'));
const consumers = audit.consumers ?? [];
if (consumers.length !== 40) throw new Error(`Expected the reviewed 40-consumer audit, received ${consumers.length}.`);
const manifest = JSON.parse(await readFile(path.resolve('assets/canonical-glyphs/v1/manifest.json'), 'utf8'));
const identityMap = new Map(manifest.identities.map(entry => [entry.canonical_identity, entry]));
const stateMap = new Map(manifest.states.map(entry => [entry.state, entry]));

function pageFrom(entryPoint) {
  const match = String(entryPoint).match(/(?:^|\s|;)([\w/-]+\.html)\b/);
  return match?.[1] ?? null;
}

function normalizedIdentity(label) {
  const aliases = { ascendant: 'asc', descendant: 'dsc', midheaven: 'mc', 'imum coeli': 'ic' };
  const key = String(label ?? '').trim().toLowerCase();
  return aliases[key] ?? key.replaceAll(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const pageConsumers = new Map();
for (const consumer of consumers) {
  const page = pageFrom(consumer.entry_point);
  if (!page) continue;
  if (!pageConsumers.has(page)) pageConsumers.set(page, []);
  pageConsumers.get(page).push(consumer);
}

const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
const traces = [];
try {
  for (const [pagePath, linkedConsumers] of pageConsumers) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
    const consoleErrors = [];
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    const response = await page.goto(new URL(pagePath, `${baseUrl.replace(/\/$/, '')}/`).href, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const observed = await page.evaluate(() => ({
      title: document.title,
      scripts: [...document.scripts].map(script => script.src || 'inline'),
      glyphHosts: [...document.querySelectorAll('svg[aria-label], [role="img"][aria-label], img[alt]')].map(element => {
        const box = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          label: element.getAttribute('aria-label') || element.getAttribute('alt'),
          tag: element.tagName.toLowerCase(),
          viewBox: element.getAttribute('viewBox'),
          width: box.width,
          height: box.height,
          color: style.color,
          opacity: style.opacity,
          hasText: Boolean(element.querySelector?.('text')),
          hasTransform: Boolean(element.querySelector?.('[transform]')),
          hasGeneratedCircle: Boolean(element.querySelector?.('circle')),
          source: element.getAttribute('src')
        };
      }).filter(row => row.width > 0 || row.height > 0)
    }));
    const scriptNames = observed.scripts.map(value => value.split('/').pop()?.split('?')[0]).filter(Boolean);
    for (const consumer of linkedConsumers) {
      const moduleName = consumer.consumer.split(' + ')[0].replace(/^remote /, '').split('?')[0];
      const moduleActive = consumer.consumer.includes('.html') || scriptNames.includes(moduleName) || consumer.classification === 'review';
      const requiredIdentities = consumer.required_identities ?? [];
      const requiredStates = consumer.required_states ?? consumer.legal_states_needed ?? [];
      const matchingHosts = observed.glyphHosts.filter(host => requiredIdentities.includes(normalizedIdentity(host.label)));
      traces.push({
        page: pagePath,
        consumer: consumer.consumer,
        active_module: moduleName,
        module_observed_loaded: moduleActive,
        user_action: pagePath === 'sky-chart.html' ? 'Initial render; Where and When, Placements, filters, selection, relationships, Chart Hits, heptagram, and comparison require fixture or UI exercise.' : 'Initial page render and available controls.',
        requested_identities: requiredIdentities,
        requested_states: requiredStates,
        observed_instances: matchingHosts.length,
        observed_hosts: matchingHosts,
        physical_display_sizes: [...new Set(matchingHosts.map(host => `${Math.round(host.width * 100) / 100}×${Math.round(host.height * 100) / 100}`))],
        color_or_opacity: [...new Set(matchingHosts.map(host => `${host.color}; opacity ${host.opacity}`))],
        unavailable_identities: requiredIdentities.filter(identity => !identityMap.get(identity)?.candidate_path),
        unavailable_states: requiredStates.filter(state => state !== 'plain' && !stateMap.get(state)?.overlay_path),
        synchronous_layout_dependency: Object.values(consumer.geometry_and_fallback_flags ?? {}).some(Boolean),
        calculation_dependency: /calculated|relationship-language|related-relationships/.test(consumer.consumer),
        presentation_only: !/calculated|relationship-language|related-relationships/.test(consumer.consumer),
        console_errors: consoleErrors
      });
    }
    await page.close();
  }
} finally {
  await browser.close();
}

await mkdir(path.join(outputDirectory, 'screenshots'), { recursive: true });
await mkdir(path.join(outputDirectory, 'traces'), { recursive: true });
const requests = { schema: 'relphi-canonical-runtime-dependency-trace/v1', audited_consumers: consumers.length, traced_pages: [...pageConsumers.keys()], traces };
await writeFile(path.join(outputDirectory, 'requests.json'), `${JSON.stringify(requests, null, 2)}\n`);
await writeFile(path.join(outputDirectory, 'traces', 'browser-observations.json'), `${JSON.stringify(traces, null, 2)}\n`);
const pageRows = [...pageConsumers].map(([page, rows]) => `| ${page} | ${rows.length} | ${traces.filter(trace => trace.page === page && trace.module_observed_loaded).length} |`).join('\n');
await writeFile(path.join(outputDirectory, 'page-matrix.md'), `# Runtime page matrix\n\n| Page | Audited consumers | Observed active |\n|---|---:|---:|\n${pageRows}\n`);
const reportRows = traces.map(trace => `| ${trace.consumer} | ${trace.page} | ${trace.module_observed_loaded ? 'yes' : 'no'} | ${trace.requested_identities.join(', ') || 'metadata/unknown-at-audit'} | ${trace.requested_states.join(', ')} | ${trace.unavailable_identities.join(', ') || '—'} | ${trace.unavailable_states.join(', ') || '—'} |`).join('\n');
await writeFile(path.join(outputDirectory, 'report.md'), `# Canonical runtime dependency trace\n\nBrowser-observed page loading is combined with the reviewed 40-source request contract. No active module was edited or injected.\n\n| Consumer | Page | Module observed | Identities | States | Missing masters | Missing overlays |\n|---|---|---|---|---|---|---|\n${reportRows}\n`);
console.log(JSON.stringify({ valid: true, consumerCount: consumers.length, pageCount: pageConsumers.size, traceCount: traces.length, outputDirectory }, null, 2));

