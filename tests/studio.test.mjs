// The My Voice studio's settings: every slider, EQ band and filter preset must point at a real
// setting with a default inside its range, typed numbers must snap onto the control, and the
// distortion / bit crush curve and echo tail must behave.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SRC = readFileSync(new URL('../clone.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const a = SRC.indexOf('/* STUDIO:start'), b = SRC.indexOf('/* STUDIO:end */');
assert.ok(a > -1 && b > a, 'studio settings not found in clone.html');
const S = vm.runInNewContext(SRC.slice(a, b) + '\n({MIX0,BANDS,EQ_DB,EQ_PRESETS,MODS,SLIDERS,snap,showNum,echoTail,driveCurve,cutQ,trackPitch,nearestNote,tuneRatios,retune,autotune,SCALES,KEYS})');
const { MIX0, BANDS, EQ_DB, EQ_PRESETS, MODS, SLIDERS, snap, showNum, echoTail, driveCurve, cutQ, trackPitch, nearestNote, tuneRatios, retune, autotune, SCALES, KEYS } = S;

test('every slider has a setting whose default sits on its range and step', () => {
  const keys = new Set();
  for (const s of SLIDERS) {
    assert.ok(s.k in MIX0, `${s.name}: no setting ${s.k}`);
    assert.ok(!keys.has(s.k), `${s.k} has two sliders`);
    keys.add(s.k);
    const v = s.get(MIX0[s.k]);
    assert.ok(v >= s.min && v <= s.max, `${s.name}: default ${v} outside ${s.min}..${s.max}`);
    assert.equal(snap(v, s.min, s.max, s.step), +v.toFixed(4), `${s.name}: default ${v} is off the step`);
    assert.ok(Math.abs(s.put(v) - MIX0[s.k]) < 1e-9, `${s.name}: get and put disagree`);
    assert.ok(['pitch', 'space', 'char', 'out'].includes(s.tab), `${s.name}: unknown tab ${s.tab}`);
  }
});

test('every EQ band has its settings, with defaults in range and flat', () => {
  for (const band of BANDS) {
    for (const k of [band.f, band.g, band.q].filter(Boolean)) assert.ok(k in MIX0, `${band.name}: no setting ${k}`);
    assert.ok(MIX0[band.f] >= band.min && MIX0[band.f] <= band.max, `${band.name}: default frequency out of range`);
    if (band.g) assert.equal(MIX0[band.g], 0, `${band.name}: not flat by default`);
    if (band.q) assert.ok(MIX0[band.q] >= band.qmin && MIX0[band.q] <= band.qmax, `${band.name}: default Q out of range`);
  }
  assert.ok(MIX0.mod === MODS[0][0], 'wobble is off by default');
});

test('filter presets only set EQ values the bands allow', () => {
  const allowed = {};
  for (const band of BANDS) {
    allowed[band.f] = [band.min, band.max];
    if (band.g) allowed[band.g] = [-EQ_DB, EQ_DB];
    if (band.q) allowed[band.q] = [band.qmin, band.qmax];
  }
  for (const p of EQ_PRESETS) {
    for (const [k, v] of Object.entries(p.v)) {
      assert.ok(allowed[k], `${p.name}: ${k} is not an EQ setting`);
      assert.ok(v >= allowed[k][0] && v <= allowed[k][1], `${p.name}: ${k}=${v} outside ${allowed[k]}`);
    }
  }
});

test('typed numbers snap onto the range and step', () => {
  assert.equal(snap(99, -12, 12, 0.5), 12);
  assert.equal(snap(-40, -12, 12, 0.5), -12);
  assert.equal(snap(3.3, -12, 12, 0.5), 3.5);
  assert.equal(snap('1.27', 0.5, 2, 0.05), 1.25);
  assert.equal(snap(283, 20, 1500, 10), 280);
  assert.equal(snap('abc', 0, 100, 1), 0);
  assert.equal(snap('', 0, 100, 1), 0);
});

test('values are shown the way the number box expects', () => {
  const pitch = SLIDERS.find((s) => s.k === 'semi'), echo = SLIDERS.find((s) => s.k === 'echo');
  assert.equal(showNum(pitch, 3), '+3.0');
  assert.equal(showNum(pitch, -2.5), '-2.5');
  assert.equal(showNum(echo, 0.38), '38');
});

test('echo tail grows with the repeats and never runs past 10 seconds', () => {
  assert.equal(echoTail(0.3, 0), 0.3);
  assert.ok(echoTail(0.3, 0.6) > echoTail(0.3, 0.3));
  assert.ok(Math.abs(echoTail(0.3, 0.38) - 0.3 * Math.log(0.001) / Math.log(0.38)) < 1e-9);
  assert.equal(echoTail(1.5, 0.9), 10);
});

test('distortion and bit crush curve', () => {
  assert.equal(driveCurve(0, 16), null, 'untouched when both are off');
  const crushed = driveCurve(0, 3);
  assert.ok(new Set(crushed).size <= 9, `3 bits should give at most 9 levels, got ${new Set(crushed).size}`);
  const fuzz = driveCurve(0.8, 16);
  for (let i = 1; i < fuzz.length; i++) assert.ok(fuzz[i] >= fuzz[i - 1], 'curve never goes backwards');
  assert.ok(Math.abs(fuzz[0] + fuzz[fuzz.length - 1]) < 1e-6, 'symmetric');
  assert.ok(fuzz.every((v) => Math.abs(v) <= 1), 'stays within full scale');
});

test('a cut with no resonance is a flat (Butterworth) filter', () => {
  assert.ok(Math.abs(cutQ(0) + 3) < 1e-9);
  assert.ok(Math.abs(cutQ(18) - 18) < 1e-9);
});

// Auto-tune
const SR = 48000;
const tone = (hz, secs) => Float32Array.from({ length: Math.round(SR * secs) }, (_, i) => 0.6 * Math.sin(2 * Math.PI * hz * i / SR) + 0.2 * Math.sin(4 * Math.PI * hz * i / SR));
// Pitch from the fundamental's zero crossings, away from the edges (smoothed so the harmonic adds none)
function pitchOf(x) {
  const from = Math.floor(x.length * 0.2), to = Math.floor(x.length * 0.8);
  let n = 0, prev = 0, lp = 0;
  for (let i = from; i < to; i++) { lp += (x[i] - lp) * 0.05; if (i > from && (prev < 0) !== (lp < 0)) n++; prev = lp; }
  return n / 2 / ((to - from) / SR);
}

test('the pitch tracker finds a steady tone, and nothing in silence', () => {
  const f0 = trackPitch(tone(220, 1), SR);
  const voiced = [...f0].filter((v) => v > 0);
  assert.ok(voiced.length > f0.length * 0.8, `only ${voiced.length} of ${f0.length} frames voiced`);
  for (const v of voiced) assert.ok(Math.abs(v - 220) < 3, `found ${v.toFixed(1)} Hz`);
  assert.ok([...trackPitch(new Float32Array(SR), SR)].every((v) => v === 0), 'silence has no pitch');
});

test('notes snap to the scale of the key', () => {
  assert.equal(nearestNote(69.4, 0, 'chromatic'), 69);
  assert.equal(nearestNote(66.2, 0, 'major'), 67);   // F# is not in C major: G is nearer
  assert.equal(nearestNote(65.8, 0, 'major'), 65);   // ...and here F is
  assert.equal(nearestNote(66.2, 7, 'major'), 66);   // but it is in G major
  assert.equal(nearestNote(61, 0, 'penta'), 60);
  assert.equal(KEYS.length, 12);
  for (const sc of Object.values(SCALES)) assert.ok(sc.every((n) => n >= 0 && n < 12));
});

test('an off-key tone comes out on the note, the same length', () => {
  const x = tone(452, 2), y = autotune(x, SR, 0, 'chromatic', 1, 1);
  assert.equal(y.length, x.length);
  assert.ok(y.every(Number.isFinite), 'no NaN or Infinity');
  assert.ok(Math.abs(pitchOf(x) - 452) < 4, 'the test tone measures right');
  assert.ok(Math.abs(pitchOf(y) - 440) < 4, `came out at ${pitchOf(y).toFixed(1)} Hz, expected 440`);
  assert.ok(y.reduce((m, v) => Math.max(m, Math.abs(v)), 0) < 1.1, 'no spikes where grains join');
});

test('half the amount corrects half way', () => {
  const y = autotune(tone(452, 2), SR, 0, 'chromatic', 0.5, 1), half = 440 * Math.pow(2, Math.log2(452 / 440) / 2);
  assert.ok(Math.abs(pitchOf(y) - half) < 4, `came out at ${pitchOf(y).toFixed(1)} Hz, expected ${half.toFixed(1)}`);
});

test('auto-tune off, or a tone already on the note, leaves the clip alone', () => {
  const x = tone(452, 1);
  assert.equal(autotune(x, SR, 0, 'chromatic', 0, 1), x);
  const r = tuneRatios(Float32Array.from([440, 440, 0, 440]), 0, 'chromatic', 1, 1);
  assert.ok([...r].every((v) => Math.abs(v - 1) < 1e-6));
  assert.equal(retune(x, SR, Float32Array.from([1, 1, 1]), 0.02), x);
});

test('a slow retune speed glides to the note instead of jumping', () => {
  const f0 = new Float32Array(50).fill(452);
  const fast = tuneRatios(f0, 0, 'chromatic', 1, 1), slow = tuneRatios(f0, 0, 'chromatic', 1, 0);
  assert.ok(Math.abs(fast[0] - 440 / 452) < 1e-3, 'instant at full speed');
  assert.ok(slow[0] > 0.99 && slow[49] < slow[10] && slow[10] < slow[0], 'gradual at slow speed');
});
