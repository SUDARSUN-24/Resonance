// ═══════════════════════════════════════════════
//  RESONANCE — shared helpers for Netlify Functions
//  Storage: Netlify Blobs (no external database needed)
// ═══════════════════════════════════════════════

import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';

export const VOICES = ['robotic', 'news', 'deep', 'calm', 'hype', 'mysterious', 'nova'];
export const EMOTIONS = ['neutral', 'calm', 'energetic', 'formal', 'dramatic', 'mysterious'];

// Public page paths → short names used in the stats
export const PAGES = {
  '/': 'home', '/index.html': 'home', '/index': 'home',
  '/services.html': 'tracks', '/services': 'tracks',
  '/contact.html': 'voice-lab', '/contact': 'voice-lab',
  '/clone.html': 'my-voice', '/clone': 'my-voice',
};

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export const store = (name) => getStore({ name, consistency: 'strong' });

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });

// Turn thrown errors into JSON responses; unexpected ones are logged, never leaked
export const fail = (e) => {
  if (!e.status) console.error(e);
  return json({ success: false, error: e.status ? e.message : 'Server error' }, e.status || 500);
};

export const day = (d = new Date()) => d.toISOString().slice(0, 10);
export const daysAgo = (n) => day(new Date(Date.now() - n * 86400000));

export async function readBody(req, max = 4096) {
  const text = await req.text();
  if (text.length > max) throw new HttpError(413, 'Payload too large');
  try { return JSON.parse(text || '{}'); } catch { throw new HttpError(400, 'Invalid JSON'); }
}

export const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

export function clientId(req, context) {
  const ip = context?.ip || req.headers.get('x-nf-client-connection-ip') ||
    (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  // Only a salted hash is ever stored — never the raw IP
  return createHash('sha256').update('resonance:' + ip).digest('hex').slice(0, 24);
}

// Count an event by writing its own tiny record (key = ev/<date>/<kind>/<unique id>).
// Separate keys mean simultaneous visitors can never overwrite each other's counts;
// the admin overview tallies them and folds finished days into daily summaries.
export async function recordEvent(kind) {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  await store('events').set(`ev/${day()}/${kind}/${id}`, '1');
}

// Read-modify-write with optimistic concurrency (used for rate limits and lockouts)
export async function updateJSON(st, key, fn, tries = 8) {
  for (let i = 0; i < tries; i++) {
    const cur = await st.getWithMetadata(key, { type: 'json' });
    const next = fn(cur ? cur.data : null);
    const res = cur
      ? await st.setJSON(key, next, { onlyIfMatch: cur.etag })
      : await st.setJSON(key, next, { onlyIfNew: true });
    if (res.modified) return next;
    await new Promise((r) => setTimeout(r, 15 + Math.random() * 60));
  }
  throw new HttpError(503, 'Busy, please try again');
}

// Fixed-window rate limit, one small record per visitor
export async function rateLimit(name, id, limit, windowSec) {
  const bucket = Math.floor(Date.now() / 1000 / windowSec);
  const rec = await updateJSON(store('ratelimit'), `${name}/${id}`, (c) =>
    c && c.b === bucket ? { b: bucket, n: c.n + 1 } : { b: bucket, n: 1 });
  return rec.n <= limit;
}

// Run async work over a list with limited parallelism
export async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const worker = async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
