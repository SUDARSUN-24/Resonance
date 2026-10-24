// ═══════════════════════════════════════════════
//  POST /api/track — anonymous counters (public)
//  { type: 'view', page } · { type: 'scan', twin } · { type: 'story' } · { type: 'game', mode }
//  Stores counts only: no IPs, no cookies, no user IDs
// ═══════════════════════════════════════════════

import { json, fail, readBody, clientId, rateLimit, recordEvent, HttpError, VOICES, PAGES } from '../lib/util.mjs';

export default async (req, context) => {
  try {
    if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405, { allow: 'POST' });
    const d = await readBody(req, 1024);
    let kind;

    if (d.type === 'view') {
      const path = String(d.page || '').split('?')[0].replace(/\/+$/, '') || '/';
      const page = PAGES[path];
      if (!page) throw new HttpError(422, 'Unknown page');
      const country = /^[A-Z]{2}$/.test(context?.geo?.country?.code || '') ? context.geo.country.code : 'XX';
      kind = `view.${page}.${country}`;
    } else if (d.type === 'scan') {
      if (!VOICES.includes(d.twin)) throw new HttpError(422, 'Unknown twin');
      kind = `scan.${d.twin}`;
    } else if (d.type === 'story') {
      kind = 'story';
    } else if (d.type === 'game') {
      if (!['twister', 'world', 'practice', 'duo'].includes(d.mode)) throw new HttpError(422, 'Unknown game mode');
      kind = `game.${d.mode}`;
    } else {
      throw new HttpError(422, 'Unknown event type');
    }

    if (!(await rateLimit('track', clientId(req, context), 120, 600))) return json({ ok: false }, 429);
    await recordEvent(kind);
    return json({ ok: true });
  } catch (e) {
    return fail(e);
  }
};

export const config = { path: '/api/track' };
