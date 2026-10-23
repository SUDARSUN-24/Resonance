// ═══════════════════════════════════════════════
//  POST /api/requests — save a Voice Lab generation (public)
//  Replaces save_request.php on Netlify
// ═══════════════════════════════════════════════

import { store, json, fail, readBody, clean, clientId, rateLimit, recordEvent, day, HttpError, VOICES, EMOTIONS } from '../lib/util.mjs';

const num = (v, min, max, def) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n * 100) / 100)) : def;
};

export default async (req, context) => {
  try {
    if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405, { allow: 'POST' });
    const d = await readBody(req);

    const voice = clean(d.voice_type, 20);
    if (!VOICES.includes(voice)) throw new HttpError(422, 'Unknown voice_type');
    const text = clean(d.text_input, 500);
    if (!text) throw new HttpError(422, 'text_input is required');
    const email = clean(d.email, 200);
    const lang = clean(d.language, 20);

    if (!(await rateLimit('collect', clientId(req, context), 20, 600))) throw new HttpError(429, 'Too many requests, slow down a little');

    const now = new Date();
    const id = `req/${day(now)}/${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
    const record = {
      id,
      created_at: now.toISOString(),
      producer_name: clean(d.producer_name, 120),
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '',
      voice_type: voice,
      voice_gender: d.voice_gender === 'female' ? 'female' : 'male',
      language: /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(lang) ? lang : 'en-US',
      emotion: EMOTIONS.includes(d.emotion) ? d.emotion : 'neutral',
      speed: num(d.speed, 0.1, 2, 1),
      pitch: num(d.pitch, 0, 2, 1),
      text_input: text,
      char_count: text.length,
      country: context?.geo?.country?.code || null,
    };

    await store('requests').setJSON(id, record);
    await recordEvent('gen');
    return json({ success: true, id, message: 'Voice request saved' }, 201);
  } catch (e) {
    return fail(e);
  }
};

export const config = { path: '/api/requests' };
