// The My Voice fine-tune mixer changes speed without changing pitch by time-stretching the
// recording (WSOLA). These checks run that stretch on a test tone: the length must follow the
// factor while the tone keeps its pitch and loudness.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SRC = readFileSync(new URL('../clone.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const a = SRC.indexOf('/* STRETCH:start'), b = SRC.indexOf('/* STRETCH:end */');
assert.ok(a > -1 && b > a, 'stretch code not found in clone.html');
const stretch = vm.runInNewContext(SRC.slice(a, b) + '\nstretch');

const SR = 48000;
const tone = (hz, secs) => Float32Array.from({ length: Math.round(SR * secs) }, (_, i) => 0.8 * Math.sin(2 * Math.PI * hz * i / SR));
// Pitch from zero crossings, measured away from the faded edges
function pitchOf(x) {
  const from = Math.floor(x.length * 0.2), to = Math.floor(x.length * 0.8);
  let n = 0;
  for (let i = from + 1; i < to; i++) if ((x[i - 1] < 0) !== (x[i] < 0)) n++;
  return n / 2 / ((to - from) / SR);
}
const rms = (x) => Math.sqrt(x.slice(Math.floor(x.length * 0.2), Math.floor(x.length * 0.8)).reduce((s, v) => s + v * v, 0) / (x.length * 0.6));

test('a factor of 1 leaves the recording untouched', () => {
  const x = tone(220, 1);
  assert.equal(stretch(x, 1, SR), x);
});

for (const factor of [0.5, 0.8, 1.25, 2]) {
  test(`stretching by ${factor} changes the length, not the pitch`, () => {
    const x = tone(220, 2), y = stretch(x, factor, SR);
    assert.equal(y.length, Math.round(x.length * factor));
    assert.ok(y.every(Number.isFinite), 'no NaN or Infinity');
    assert.ok(Math.abs(pitchOf(y) - 220) < 4, `pitch ${pitchOf(y).toFixed(1)} Hz, expected 220`);
    assert.ok(Math.abs(rms(y) / rms(x) - 1) < 0.15, `loudness changed by ${(rms(y) / rms(x)).toFixed(2)}x`);
  });
}

test('works on a voice-like signal with several harmonics', () => {
  const x = Float32Array.from({ length: SR * 2 }, (_, i) => {
    const t = i / SR;
    return 0.5 * Math.sin(2 * Math.PI * 140 * t) + 0.3 * Math.sin(2 * Math.PI * 280 * t) + 0.15 * Math.sin(2 * Math.PI * 420 * t);
  });
  const y = stretch(x, 1.6, SR);
  assert.equal(y.length, Math.round(x.length * 1.6));
  assert.ok(y.reduce((m, v) => Math.max(m, Math.abs(v)), 0) < 1.1, 'no big spikes where windows join');
});
