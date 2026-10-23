// ═══════════════════════════════════════════════
//  /api/auth/login · /api/auth/logout · /api/auth/me
//  5 wrong passwords → 15-minute lockout for that visitor
// ═══════════════════════════════════════════════

import { store, json, fail, readBody, clientId } from '../lib/util.mjs';
import { passwordConfigured, checkPassword, makeToken, isAuthed, sessionCookie, clearCookie } from '../lib/auth.mjs';

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

export default async (req, context) => {
  try {
    const path = new URL(req.url).pathname;

    if (path.endsWith('/me')) return json({ authenticated: isAuthed(req), configured: passwordConfigured() });
    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { allow: 'POST' });
    if (path.endsWith('/logout')) return json({ ok: true }, 200, { 'set-cookie': clearCookie() });

    // ── login ──
    if (!passwordConfigured()) {
      return json({ error: 'Admin password is not set yet. Add ADMIN_PASSWORD in Netlify → Site configuration → Environment variables, then redeploy.' }, 503);
    }
    const st = store('auth');
    const key = `lock/${clientId(req, context)}`;
    const rec = (await st.get(key, { type: 'json' })) || { fails: 0, until: 0 };
    const now = Date.now();
    if (rec.until > now) {
      const mins = Math.ceil((rec.until - now) / 60000);
      return json({ error: `Too many attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.`, retryAfter: rec.until - now }, 429);
    }

    const { password } = await readBody(req, 1024);
    if (!checkPassword(password || '')) {
      const fails = (rec.until && rec.until <= now ? 0 : rec.fails) + 1;
      const locked = fails >= MAX_FAILS;
      await st.setJSON(key, { fails, until: locked ? now + LOCK_MS : 0 });
      await new Promise((r) => setTimeout(r, 400)); // slow down guessing
      const left = MAX_FAILS - fails;
      return json({ error: locked ? 'Too many attempts. Locked for 15 minutes.' : `Wrong password. ${left} attempt${left === 1 ? '' : 's'} left.` }, locked ? 429 : 401);
    }

    await st.delete(key);
    return json({ ok: true }, 200, { 'set-cookie': sessionCookie(makeToken()) });
  } catch (e) {
    return fail(e);
  }
};

export const config = { path: ['/api/auth/login', '/api/auth/logout', '/api/auth/me'] };
