// voicestore.js keeps saved versions in IndexedDB. These checks cover the fallback when storage
// is blocked (versions stay in the tab), and that every page opens the same database the same way,
// because a different version number or store name would break the other pages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SRC = readFileSync(new URL('../voicestore.js', import.meta.url), 'utf8');
const load = (indexedDB) => { const window = { indexedDB }; vm.runInNewContext(SRC, { window }); return window.VoiceStore; };
const blocked = { open() { throw new Error('SecurityError'); } };

test('blocked storage falls back to this tab and says so once', async () => {
  let told = 0;
  const s = load(blocked).create(() => told++);
  assert.equal((await s.all()).length, 0);
  const a = await s.add({ label: 'one' }), b = await s.add({ label: 'two' });
  assert.equal(told, 1);
  assert.notEqual(a, b);
  assert.equal((await s.get(b)).label, 'two');
  assert.equal(await s.get(999), null);
  await s.del(a);
  assert.equal((await s.all()).map((r) => r.label).join(), 'two');
  await s.clear();
  assert.equal((await s.all()).length, 0);
});

test('no IndexedDB at all also falls back', async () => {
  const s = load(undefined).create();
  const id = await s.add({ label: 'x' });
  assert.equal((await s.get(id)).label, 'x');
});

test('the library holds 12 versions', () => {
  assert.equal(load(blocked).MAX, 12);
});

test('no page opens the voice database on its own', () => {
  for (const page of ['clone.html', 'contact.html', 'lab.html']) {
    let html;
    try { html = readFileSync(new URL(`../${page}`, import.meta.url), 'utf8'); } catch { continue; }
    assert.doesNotMatch(html, /indexedDB\.open\(/, `${page} should use voicestore.js`);
    if (/VoiceStore\./.test(html)) assert.match(html, /<script src="voicestore\.js"><\/script>/, `${page} uses VoiceStore without loading it`);
  }
});

test('wav() writes a 16-bit WAV with the right header and clips loud samples', async () => {
  const window = {};
  vm.runInNewContext(SRC, { window, Blob, DataView, ArrayBuffer, Math });
  const blob = window.VoiceStore.wav([Float32Array.from([0, 0.5, -1, 2])], 24000);
  const v = new DataView(await blob.arrayBuffer());
  const tag = (o) => String.fromCharCode(...[0, 1, 2, 3].map((i) => v.getUint8(o + i)));
  assert.equal(tag(0) + tag(8) + tag(36), 'RIFFWAVEdata');
  assert.equal(v.getUint16(22, true), 1, 'mono');
  assert.equal(v.getUint32(24, true), 24000);
  assert.equal(v.getUint32(40, true), 8, 'four 2-byte samples');
  assert.equal([0, 1, 2, 3].map((i) => v.getInt16(44 + i * 2, true)).join(), '0,16383,-32768,32767');
});

test('every Voice Lab character has an HD voice', () => {
  const html = readFileSync(new URL('../contact.html', import.meta.url), 'utf8');
  const grab = (name) => vm.runInNewContext('(' + new RegExp(String.raw`const ${name}=(\{[\s\S]*?\});`).exec(html)[1] + ')');
  const chars = grab('VOICES'), hd = grab('HD_VOICES'), pick = grab('HD_FOR');
  for (const k of Object.keys(chars)) assert.ok(hd[pick[k]], `${k} has no HD voice`);
  for (const id of Object.keys(hd)) assert.match(id, /^[ab][fm]_[a-z]+$/, `${id}: only American and British voices`);
});
