// Voice characters must sound different: each page's voice picker is run against the voice lists
// Chrome and Edge give on Windows, and ANCHOR, DEEP and the other characters must not collapse onto
// one device voice. Pitch-heavy characters must also avoid Edge's online voices, which ignore pitch.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ROOT = new URL('../', import.meta.url);
const read = (f) => readFileSync(new URL(f, ROOT), 'utf8').replace(/\r\n/g, '\n');

const mk = (name, lang, localService, def) => ({ name, lang, localService, default: !!def, voiceURI: name });
const SAPI = [mk('Microsoft David - English (United States)', 'en-US', true, true), mk('Microsoft Mark - English (United States)', 'en-US', true), mk('Microsoft Zira - English (United States)', 'en-US', true)];
const CHROME = [...SAPI, mk('Google US English', 'en-US', false), mk('Google UK English Male', 'en-GB', false)];
const EDGE = [...['Andrew', 'Brian', 'Christopher', 'Eric', 'Guy', 'Roger', 'Steffan', 'Aria', 'Jenny', 'Ava', 'Emma', 'Michelle']
  .map((n) => mk(`Microsoft ${n} Online (Natural) - English (United States)`, 'en-US', false)), ...SAPI];
const BROWSERS = { Chrome: CHROME, Edge: EDGE };
const online = (v) => !v.localService && /microsoft/i.test(v.name);

// The inline speech engine shared by the home, Tracks, Story and My Voice pages
function engine(page, voices) {
  const src = read(page), a = src.indexOf('const Engine=(function(){'), b = src.indexOf('\n})();', a);
  assert.ok(a > -1 && b > a, `${page}: speech engine not found`);
  const window = { speechSynthesis: { getVoices: () => voices, addEventListener() {} } };
  return vm.runInNewContext(src.slice(a, b + 6) + '\nEngine', { window, setTimeout: () => 0 });
}
// The character list each page passes to the engine, in page order
function characters(page) {
  const src = read(page);
  const arr = src.match(/const VOICES=(\[[\s\S]*?\n  \]);/), obj = src.match(/const VOICES=(\{[\s\S]*?\n  \});/);
  const list = vm.runInNewContext('(' + (arr || obj)[1] + ')');
  return Array.isArray(list) ? list : Object.entries(list).map(([id, v]) => ({ id, ...v }));
}

for (const page of ['index.html', 'services.html', 'story.html']) {
  for (const [browser, voices] of Object.entries(BROWSERS)) {
    test(`${page} on ${browser}: characters get their own voices`, () => {
      const E = engine(page, voices), chars = characters(page), byId = {};
      for (const c of chars) {
        byId[c.name] = E.pick('en-US', c.gender, c.pitch, c.id);
        assert.ok(byId[c.name], `${c.name} has a voice`);
        if (c.pitch < 0.65) assert.ok(!online(byId[c.name]), `${c.name} (pitch ${c.pitch}) must use a voice that can change pitch`);
      }
      assert.notEqual(byId.ANCHOR.name, byId.DEEP.name, 'ANCHOR and DEEP share a voice');
      // Chrome on Windows has only one voice with a female name (Zira), so only Edge can split these
      if (browser === 'Edge') assert.notEqual(byId.NOVA.name, byId.ZEN.name, 'NOVA and ZEN share a voice');
      if (browser === 'Edge') assert.ok(online(byId.NOVA), 'NOVA keeps a natural Edge voice');
      return byId;
    });
  }
}

test('a character gets the same voice on every page', () => {
  for (const [browser, voices] of Object.entries(BROWSERS)) {
    const seen = {};
    for (const page of ['index.html', 'services.html', 'story.html']) {
      const E = engine(page, voices);
      for (const c of characters(page)) {
        const name = E.pick('en-US', c.gender, c.pitch, c.id).name;
        seen[c.id] = seen[c.id] || name;
        assert.equal(name, seen[c.id], `${browser}: ${c.name} changes voice on ${page}`);
      }
    }
  }
});

test('My Voice: a low cloned pitch avoids voices that ignore pitch', () => {
  const E = engine('clone.html', EDGE);
  assert.ok(!online(E.pick('en-US', 'male', 0.6)));
  assert.ok(online(E.pick('en-US', 'male', 1.0)));
});

// The Voice Lab has its own picker that also honours a device voice chosen by hand
test('Voice Lab: characters get their own voices', () => {
  const src = read('contact.html');
  const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); assert.ok(i > -1 && j > i, a); return src.slice(i, j); };
  const code = [
    cut('const VOICES={', '/* ── Languages'), cut('const ALIAS=', '/* Script ranges'), cut('/* Name hints', 'const TEMPLATES'),
    'const clamp=function(v,a,b){return Math.min(b,Math.max(a,v));};const baseOf=function(c){return String(c||"").toLowerCase().split("-")[0];};const norm=function(l){return String(l||"").replace(/_/g,"-").toLowerCase();};',
    cut('function matchVoices', 'function langInfo'), cut("/* Edge's online", 'function loadVoices'),
    'return {VOICES,pickVoice,setVoices:function(v){sysVoices=v;}};'
  ].join('\n');
  for (const [browser, voices] of Object.entries(BROWSERS)) {
    const state = { voice: 'nova', lang: 'en-US', emotion: 'neutral', rate: 1, pitch: 1, deviceVoice: '' };
    const lab = new Function('state', code)(state); lab.setVoices(voices);
    const got = {};
    for (const id of Object.keys(lab.VOICES)) { state.voice = id; state.pitch = lab.VOICES[id].pitch; got[id] = lab.pickVoice().name; }
    assert.notEqual(got.news, got.deep, `${browser}: ANCHOR and DEEP share a voice`);
    if (browser === 'Edge') assert.ok(!/Online/.test(got.deep), 'DEEP must be able to change pitch');
  }
});
