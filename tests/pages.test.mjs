// Every page keeps its JavaScript inline, so one stray quote breaks the whole page.
// This parses each inline <script> (without running it) to catch that early.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';

const ROOT = new URL('../', import.meta.url);
const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html'));

for (const page of pages) {
  test(`${page}: inline scripts parse`, () => {
    const html = readFileSync(new URL(page, ROOT), 'utf8');
    const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    scripts.forEach((code, i) => {
      assert.doesNotThrow(() => new vm.Script(code, { filename: `${page} script #${i + 1}` }));
    });
  });
}

test('service worker precaches only files that exist', () => {
  const sw = readFileSync(new URL('sw.js', ROOT), 'utf8');
  const core = JSON.parse(sw.match(/const CORE = (\[[\s\S]*?\]);/)[1].replace(/'/g, '"'));
  for (const file of core) {
    if (file === './') continue;
    assert.doesNotThrow(() => readFileSync(new URL(file, ROOT)), `${file} is in CORE but missing`);
  }
});

test('service worker never caches the API or the owner dashboard', () => {
  const sw = readFileSync(new URL('sw.js', ROOT), 'utf8');
  assert.match(sw, /url\.pathname\.startsWith\('\/api\/'\)/);
  assert.match(sw, /url\.pathname === '\/admin\.html'/);
});

// Lighthouse: web fonts must not hold up the first paint, and phones get a lighter background photo
for (const page of pages) {
  test(`${page}: web fonts load after the first frame, with a no-JavaScript fallback`, () => {
    const html = readFileSync(new URL(page, ROOT), 'utf8');
    assert.doesNotMatch(html.replace(/<noscript>[\s\S]*?<\/noscript>/g, ''), /<link[^>]+rel="(stylesheet|preload)"[^>]+href="https:\/\/fonts\.googleapis\.com/, 'no font stylesheet in the first paint');
    const href = html.match(/l\.href='(https:\/\/fonts\.googleapis\.com\/css2[^']+)'/);
    assert.ok(href, 'fonts are added by script after the first frame');
    assert.ok(html.includes(`<noscript><link rel="stylesheet" href="${href[1]}"></noscript>`), 'same fonts without JavaScript');
    const photo = html.match(/url\('https:\/\/images\.unsplash\.com\/photo-([0-9a-f-]+)\?q=80&w=1920/);
    if (photo) assert.ok(html.includes(`@media(max-width:760px){.bg-photo{background-image:url('https://images.unsplash.com/photo-${photo[1]}?q=50&w=600&h=1200`), 'phones get the same photo, smaller');
  });
}
