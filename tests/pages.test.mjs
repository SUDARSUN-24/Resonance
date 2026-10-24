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
