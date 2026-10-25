// Backend checks that run without Netlify (no blob storage is touched)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PAGES } from '../netlify/lib/util.mjs';
import track from '../netlify/functions/track.mjs';

const ROOT = new URL('../', import.meta.url);
const read = (f) => readFileSync(new URL(f, ROOT), 'utf8');
const post = (body) => new Request('http://localhost/api/track', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

test('the Reader page is counted in page views', () => {
  assert.equal(PAGES['/read.html'], 'reader');
  assert.equal(PAGES['/read'], 'reader');
});

test('every page in the site menu can record a page view', () => {
  const nav = read('index.html').match(/<div class="nav-links" id="nav-links">([\s\S]*?)<\/div>/)[1];
  const pages = [...nav.matchAll(/href="([a-z]+)\.html"/g)].map((m) => m[1]);
  assert.ok(pages.length >= 7, 'menu has at least 7 links');
  for (const p of pages) {
    assert.ok(PAGES[`/${p}.html`], `/${p}.html missing from PAGES`);
    if (p !== 'index') assert.ok(PAGES[`/${p}`], `/${p} (pretty URL) missing from PAGES`);
  }
});

test('every page sends its view with a path the backend accepts', () => {
  for (const page of ['index', 'services', 'contact', 'read', 'clone', 'story', 'play', 'learn']) {
    const list = read(`${page}.html`).match(/if\((\[[^\]]*\])\.indexOf\(location\.pathname\)/)[1];
    for (const path of JSON.parse(list.replace(/'/g, '"'))) assert.ok(PAGES[path], `${page}.html sends ${path}, which the backend rejects`);
  }
});

test('the owner dashboard has a label for the Reader page', () => {
  assert.match(read('admin.html'), /reader:\['Reader','📖'\]/);
});

test('track rejects unknown pages and event types before storing anything', async () => {
  const ctx = { geo: { country: { code: 'TH' } } };
  let res = await track(post({ type: 'view', page: '/not-a-page.html' }), ctx);
  assert.equal(res.status, 422);
  res = await track(post({ type: 'game', mode: 'daily' }), ctx);
  assert.equal(res.status, 422);
  res = await track(post({ type: 'nope' }), ctx);
  assert.equal(res.status, 422);
  res = await track(new Request('http://localhost/api/track'), ctx);
  assert.equal(res.status, 405);
});

test('track accepts every game mode the Play page sends', async () => {
  const modes = [...read('play.html').matchAll(/kind:'([a-z]+)'/g)].map((m) => m[1]);
  assert.ok(modes.includes('practice'));
  assert.match(read('play.html'), /mode:duo\?'duo'/, 'pass and play is tracked as duo');
  assert.match(read('play.html'), /isChallenge\?'challenge'/, 'challenge games are tracked as challenge');
  for (const mode of new Set([...modes, 'duo', 'challenge'])) {
    const res = await track(post({ type: 'game', mode }), { geo: {} });
    assert.notEqual(res.status, 422, `track rejects game mode ${mode}`);
  }
});

test('the owner dashboard counts language practice sessions', () => {
  assert.match(read('admin.html'), /cur\.games\.practice/);
  assert.match(read('admin.html'), /cur\.games\.duo/);
  assert.match(read('admin.html'), /cur\.games\.challenge/);
});
