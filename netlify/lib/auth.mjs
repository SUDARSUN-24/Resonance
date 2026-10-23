// ═══════════════════════════════════════════════
//  RESONANCE — admin authentication
//  One owner password (ADMIN_PASSWORD env var), signed HttpOnly session cookie
// ═══════════════════════════════════════════════

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const COOKIE = 'rs_admin';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export const passwordConfigured = () => !!process.env.ADMIN_PASSWORD;

// Changing ADMIN_PASSWORD (or SESSION_SECRET) signs everyone out
function signingKey() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHash('sha256').update(`resonance-session:${pw}:${process.env.SESSION_SECRET || ''}`).digest();
}

export function checkPassword(input) {
  const pw = process.env.ADMIN_PASSWORD || '';
  const a = createHash('sha256').update(String(input)).digest();
  const b = createHash('sha256').update(pw).digest();
  return pw.length > 0 && timingSafeEqual(a, b);
}

export function makeToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + MAX_AGE * 1000, n: randomBytes(8).toString('hex') })).toString('base64url');
  const sig = createHmac('sha256', signingKey()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token) {
  const key = signingKey();
  if (!key || !token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = createHmac('sha256', key).update(payload).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now(); } catch { return false; }
}

function getCookie(req, name) {
  for (const part of (req.headers.get('cookie') || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export const isAuthed = (req) => verifyToken(getCookie(req, COOKIE));
export const sessionCookie = (token) => `${COOKIE}=${token}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`;
export const clearCookie = () => `${COOKIE}=; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
