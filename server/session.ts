import type { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'node:crypto';
import { pool, type Role } from './db.js';
import { HttpError } from './http.js';

const COOKIE = 'sid';
const SESSION_MS = 8 * 60 * 60 * 1000;
interface Session { userId: number; expires: number }
const sessions = new Map<string, Session>(); // token -> session
export interface CurrentUser { id: number; username: string; role: Role; personId: number | null }

const sessionToken = (req: Request): string | undefined =>
  req.headers.cookie?.split(';').map(c => c.trim().split('=')).find(([k]) => k === COOKIE)?.[1];

/** The logged-in user. The user row is read on every request, so deactivating, deleting or
 *  re-roling an account takes effect immediately instead of when its session expires. */
export async function currentUser(req: Request): Promise<CurrentUser | undefined> {
  const t = sessionToken(req);
  const s = t ? sessions.get(t) : undefined;
  if (!t || !s) return undefined;
  if (s.expires < Date.now()) { sessions.delete(t); return undefined; }
  const { rows } = await pool.query(
    'SELECT id, username, role, person_id AS "personId" FROM users WHERE id = $1 AND active', [s.userId]);
  if (!rows[0]) { sessions.delete(t); return undefined; }
  return rows[0];
}
export const me = (res: Response) => res.locals.user as CurrentUser;

export function startSession(res: Response, userId: number): void {
  const token = randomBytes(32).toString('hex');
  sessions.set(token, { userId, expires: Date.now() + SESSION_MS });
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}`);
}

export function endSession(req: Request, res: Response): void {
  const t = sessionToken(req);
  if (t) sessions.delete(t);
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
}

export async function requireLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = await currentUser(req);
  if (!user) throw new HttpError(401, 'Not logged in');
  res.locals.user = user;
  next();
}

// Person users are read-only: they may only fetch /api/state (their own room) and /api/me.
export const requireStaff = (_req: Request, res: Response, next: NextFunction) => {
  if (me(res).role === 'person') throw new HttpError(403, 'Not allowed');
  next();
};
