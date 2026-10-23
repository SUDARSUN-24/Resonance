// ═══════════════════════════════════════════════
//  RESONANCE — leaderboard storage helpers
// ═══════════════════════════════════════════════

import { store } from './util.mjs';

export const MODES = { twister: 7500, world: 5000 }; // max possible score per mode
export const DIFFICULTIES = ['easy', 'medium', 'hard'];
export const BLOCKED = /(fuck|shit|bitch|cunt|nigg|fag|rape|porn|dick|pussy|asshole|slut|whore)/i;

export const keyFor = (mode, score) =>
  `lb/${mode}/${String(9999999 - score).padStart(7, '0')}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export async function topScores(mode, period = 'all', limit = 20) {
  const lb = store('leaderboard');
  const { blobs } = await lb.list({ prefix: `lb/${mode}/` });
  const keys = blobs.map((b) => b.key).sort();
  const since = period === 'week' ? Date.now() - 7 * 86400000 : 0;
  const out = [];
  // Read in small batches until we have enough entries for the period
  for (let i = 0; i < keys.length && out.length < limit; i += 25) {
    const batch = await Promise.all(keys.slice(i, i + 25).map((k) => lb.get(k, { type: 'json' })));
    for (const e of batch) if (e && new Date(e.created_at).getTime() >= since && out.length < limit) out.push(e);
  }
  return out;
}
