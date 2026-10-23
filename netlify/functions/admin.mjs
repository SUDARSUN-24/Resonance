// ═══════════════════════════════════════════════
//  Owner-only admin API (requires the session cookie)
//  GET    /api/admin/overview?days=30   → requests + daily stats
//  DELETE /api/admin/requests?id=…      → delete one request
//  DELETE /api/admin/leaderboard?id=…   → remove a leaderboard entry
// ═══════════════════════════════════════════════

import { store, json, fail, mapLimit, daysAgo, day } from '../lib/util.mjs';
import { isAuthed } from '../lib/auth.mjs';
import { topScores } from '../lib/leaderboard.mjs';

const MAX_ROWS = 2000;
const ID_RE = /^req\/\d{4}-\d{2}-\d{2}\/[\w-]+$/;
const LB_RE = /^lb\/(twister|world)\/\d{7}-[\w-]+$/;

const add = (obj, key, n) => { obj[key] = (obj[key] || 0) + n; };

// Merge raw event keys (ev/<date>/<kind>/<id>) into a { gens, views, scans, countries, stories, games } summary
function tally(summary, keys) {
  const s = { gens: summary.gens || 0, stories: summary.stories || 0, views: { ...summary.views }, scans: { ...summary.scans }, countries: { ...summary.countries }, games: { ...summary.games } };
  for (const key of keys) {
    const [kind, a, b] = key.split('/')[2].split('.');
    if (kind === 'gen') s.gens++;
    else if (kind === 'view') { add(s.views, a, 1); if (b && b !== 'XX') add(s.countries, b, 1); }
    else if (kind === 'scan') add(s.scans, a, 1);
    else if (kind === 'story') s.stories++;
    else if (kind === 'game') add(s.games, a, 1);
  }
  return s;
}

// Daily stats for the given dates. Finished days with raw events are compacted into
// a summary (and the raw events removed) so each later read stays cheap.
async function dailyStats(dates) {
  const events = store('events'), stats = store('stats');
  const [{ blobs: evBlobs }, { blobs: sumBlobs }] = await Promise.all([events.list({ prefix: 'ev/' }), stats.list({ prefix: 'day/' })]);
  const evByDate = {};
  for (const b of evBlobs) (evByDate[b.key.slice(3, 13)] ||= []).push(b.key);
  const hasSummary = new Set(sumBlobs.map((b) => b.key.slice(4)));
  const today = day();

  // Compact every finished day that still has raw events (even outside the requested range)
  for (const d of Object.keys(evByDate)) {
    if (d >= today) continue;
    const prev = hasSummary.has(d) ? (await stats.get(`day/${d}`, { type: 'json' })) || {} : {};
    await stats.setJSON(`day/${d}`, tally(prev, evByDate[d]));
    await mapLimit(evByDate[d], 20, (k) => events.delete(k));
    hasSummary.add(d);
    delete evByDate[d];
  }

  return mapLimit(dates, 25, async (d) => {
    const base = hasSummary.has(d) ? (await stats.get(`day/${d}`, { type: 'json' })) || {} : {};
    return { date: d, ...tally(base, evByDate[d] || []) };
  });
}

export default async (req) => {
  try {
    if (!isAuthed(req)) return json({ error: 'Unauthorized' }, 401);
    const url = new URL(req.url);

    if (url.pathname.endsWith('/overview') && req.method === 'GET') {
      const raw = url.searchParams.get('days');
      const all = raw === 'all';
      const days = all ? 365 : Math.min(365, Math.max(1, parseInt(raw, 10) || 30));
      const cutoff = all ? '0000-00-00' : daysAgo(days - 1);

      const requests = store('requests');
      const { blobs } = await requests.list({ prefix: 'req/' });
      const keys = blobs.map((b) => b.key).filter((k) => k.slice(4, 14) >= cutoff).sort().reverse().slice(0, MAX_ROWS);
      const rows = (await mapLimit(keys, 25, (k) => requests.get(k, { type: 'json' }))).filter(Boolean);

      // Daily counters for this period and the one before it (for the ▲▼ comparisons)
      const span = all ? days : days * 2;
      const dates = Array.from({ length: span }, (_, i) => daysAgo(span - 1 - i));
      const daily = await dailyStats(dates);

      const [twister, world] = await Promise.all([topScores('twister', 'all', 50), topScores('world', 'all', 50)]);

      return json({ days: all ? 'all' : days, requests: rows, daily, leaderboard: { twister, world }, totalStored: blobs.length, truncated: keys.length >= MAX_ROWS, generatedAt: new Date().toISOString() });
    }

    if (url.pathname.endsWith('/requests') && req.method === 'DELETE') {
      if (req.headers.get('x-requested-with') !== 'resonance') return json({ error: 'Bad request' }, 400);
      const id = url.searchParams.get('id') || '';
      if (!ID_RE.test(id)) return json({ error: 'Invalid id' }, 400);
      await store('requests').delete(id);
      return json({ ok: true });
    }

    if (url.pathname.endsWith('/leaderboard') && req.method === 'DELETE') {
      if (req.headers.get('x-requested-with') !== 'resonance') return json({ error: 'Bad request' }, 400);
      const id = url.searchParams.get('id') || '';
      if (!LB_RE.test(id)) return json({ error: 'Invalid id' }, 400);
      await store('leaderboard').delete(id);
      return json({ ok: true });
    }

    return json({ error: 'Not found' }, 404);
  } catch (e) {
    return fail(e);
  }
};

export const config = { path: ['/api/admin/overview', '/api/admin/requests', '/api/admin/leaderboard'] };
