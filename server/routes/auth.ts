import { Router } from 'express';
import { pool } from '../db.js';
import { hashPassword, verifyPassword } from '../password.js';
import { HttpError } from '../http.js';
import { endSession, startSession } from '../session.js';

/** Login and logout: the only API routes that do not need a session. */
export const auth = Router();

// Hashed once so that an unknown username costs the same time as a wrong password.
const dummyHash = await hashPassword('not-a-real-password');

// Throttle brute force: 5 failed logins per minute per address.
const failures = new Map<string, number[]>();

auth.post('/login', async (req, res) => {
  const ip = req.ip ?? '';
  const recent = (failures.get(ip) ?? []).filter(t => Date.now() - t < 60_000);
  if (recent.length >= 5) throw new HttpError(429, 'Too many attempts, try again in a minute');
  const { username, password } = req.body ?? {};
  const { rows } = typeof username === 'string'
    ? await pool.query('SELECT id, password_hash, active FROM users WHERE lower(username) = lower($1)', [username])
    : { rows: [] };
  const user = rows[0];
  const ok = typeof password === 'string' && await verifyPassword(password, user?.password_hash ?? dummyHash);
  if (!user || !ok) {
    failures.set(ip, [...recent, Date.now()]);
    throw new HttpError(401, 'Invalid username or password');
  }
  if (!user.active) throw new HttpError(403, 'This account is inactive');
  failures.delete(ip);
  startSession(res, user.id);
  res.status(204).end();
});

auth.post('/logout', (req, res) => {
  endSession(req, res);
  res.status(204).end();
});
