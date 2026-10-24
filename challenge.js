/* RESONANCE challenge links — "challenge a friend" with no backend.
   The link ends in #challenge=<code>. The part after # never reaches the server,
   so the name and scores only travel to whoever the player sends the link to.
   The code is base64url JSON: { v, d: difficulty, i: twister indexes, s: points per round,
   n: name, h: checksum of the twister texts (catches links made before the list changed) }.
   Classic script: play.html reads it as window.RSChallenge. */
(function (root) {
  const PARAM = 'challenge=';
  const ROUNDS = 5;
  // Same words the leaderboard refuses (netlify/lib/leaderboard.mjs); a test keeps them in step
  const BLOCKED = /(fuck|shit|bitch|cunt|nigg|fag|rape|porn|dick|pussy|asshole|slut|whore)/i;

  // Leaderboard name rules: 2–16 letters, numbers, spaces, _ . -
  function cleanName(n) {
    const name = String(n == null ? '' : n).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 16);
    if (name.length < 2 || !/^[\p{L}\p{N} _.\-]+$/u.test(name)) return null;
    if (BLOCKED.test(name.replace(/[\s_.\-]/g, ''))) return null;
    return name;
  }

  // FNV-1a over the chosen twisters' text
  function checksum(texts) {
    let h = 0x811c9dc5;
    const s = texts.join('\n');
    for (let k = 0; k < s.length; k++) { h ^= s.charCodeAt(k); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(36);
  }

  function toB64url(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function fromB64url(code) {
    const bin = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(bin.length);
    for (let k = 0; k < bin.length; k++) bytes[k] = bin.charCodeAt(k);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }

  /* game: { twisters: {easy:[...]...}, max: {easy:1000...} }
     c: { d, i: [index...], s: [points...], n: name } → the code, or null if the name isn't allowed */
  function encode(c, game) {
    const n = cleanName(c.n);
    if (!n) return null;
    const list = game.twisters[c.d];
    return toB64url(JSON.stringify({ v: 1, d: c.d, i: c.i, s: c.s, n: n, h: checksum(c.i.map(function (k) { return list[k]; })) }));
  }

  /* → { ok: true, d, i, s, n, total } or { ok: false, why: 'broken' | 'outdated' }
     n is null when the sender's name isn't allowed: show "Your friend" instead */
  function decode(code, game) {
    const bad = { ok: false, why: 'broken' };
    if (typeof code !== 'string' || !code || code.length > 600 || !/^[A-Za-z0-9_-]+$/.test(code)) return bad;
    let c;
    try { c = JSON.parse(fromB64url(code)); } catch (e) { return bad; }
    if (!c || typeof c !== 'object' || c.v !== 1) return bad;
    const list = game.twisters[c.d];
    if (!Array.isArray(list) || !Object.prototype.hasOwnProperty.call(game.twisters, c.d)) return bad;
    const i = c.i, s = c.s, max = Math.ceil(game.max[c.d]);
    if (!Array.isArray(i) || !Array.isArray(s) || i.length !== ROUNDS || s.length !== ROUNDS) return bad;
    if (!i.every(function (k, x) { return Number.isInteger(k) && k >= 0 && i.indexOf(k) === x; })) return bad;
    if (!s.every(function (p) { return Number.isInteger(p) && p >= 0 && p <= max; })) return bad;
    if (i.some(function (k) { return k >= list.length; }) || c.h !== checksum(i.map(function (k) { return list[k]; }))) return { ok: false, why: 'outdated' };
    return { ok: true, d: c.d, i: i.slice(), s: s.slice(), n: cleanName(c.n), total: s.reduce(function (a, b) { return a + b; }, 0) };
  }

  // The code from a URL hash such as "#challenge=abc", or null
  function fromHash(hash) {
    const h = String(hash || '').replace(/^#/, '');
    return h.indexOf(PARAM) === 0 ? h.slice(PARAM.length) : null;
  }
  function link(base, code) { return String(base).split('#')[0] + '#' + PARAM + code; }

  root.RSChallenge = { ROUNDS: ROUNDS, BLOCKED: BLOCKED, cleanName: cleanName, checksum: checksum, encode: encode, decode: decode, fromHash: fromHash, link: link };
})(typeof window !== 'undefined' ? window : globalThis);
