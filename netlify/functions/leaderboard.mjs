// ═══════════════════════════════════════════════
//  /api/leaderboard — Speak-to-Win challenge scores (public)
//  GET  ?mode=twister|world&period=all|week  → top 20
//  POST { name, mode, score, accuracy, difficulty } → saves a score
//  Keys sort by score (inverted), so the best scores list first.
// ═══════════════════════════════════════════════

import { store, json, fail, readBody, clean, clientId, rateLimit, HttpError } from '../lib/util.mjs';
import { MODES, DIFFICULTIES, BLOCKED, keyFor, topScores } from '../lib/leaderboard.mjs';

export default async (req, context) => {
  try {
    const url = new URL(req.url);

    if (req.method === 'GET') {
      const mode = url.searchParams.get('mode') || 'twister';
      if (!MODES[mode]) throw new HttpError(422, 'Unknown mode');
      const period = url.searchParams.get('period') === 'week' ? 'week' : 'all';
      const entries = (await topScores(mode, period)).map(({ id, name, score, accuracy, difficulty, country, created_at }) => ({ id, name, score, accuracy, difficulty, country, created_at }));
      return json({ mode, period, entries }, 200, { 'cache-control': 'public, max-age=15' });
    }

    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { allow: 'GET, POST' });
    const d = await readBody(req, 1024);
    const mode = String(d.mode || '');
    if (!MODES[mode]) throw new HttpError(422, 'Unknown mode');
    const name = clean(d.name, 16).replace(/\s+/g, ' ');
    if (name.length < 2 || !/^[\p{L}\p{N} _.\-]+$/u.test(name)) throw new HttpError(422, 'Pick a name with 2–16 letters or numbers');
    if (BLOCKED.test(name.replace(/[\s_.\-]/g, ''))) throw new HttpError(422, 'Please choose a friendlier name');
    const score = Math.round(Number(d.score));
    const accuracy = Math.round(Number(d.accuracy));
    if (!Number.isFinite(score) || score < 0 || score > MODES[mode]) throw new HttpError(422, 'Invalid score');
    if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100) throw new HttpError(422, 'Invalid accuracy');
    const difficulty = mode === 'twister' && DIFFICULTIES.includes(d.difficulty) ? d.difficulty : null;

    if (!(await rateLimit('leaderboard', clientId(req, context), 10, 600))) throw new HttpError(429, 'Too many submissions, try again later');

    const id = keyFor(mode, score);
    const entry = { id, name, mode, score, accuracy, difficulty, country: context?.geo?.country?.code || null, created_at: new Date().toISOString() };
    await store('leaderboard').setJSON(id, entry);

    // Where does this score rank (all-time)?
    const { blobs } = await store('leaderboard').list({ prefix: `lb/${mode}/` });
    const rank = blobs.map((b) => b.key).sort().indexOf(id) + 1;
    return json({ ok: true, id, rank }, 201);
  } catch (e) {
    return fail(e);
  }
};

export const config = { path: '/api/leaderboard' };
