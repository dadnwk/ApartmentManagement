import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'node:path';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { pool, initSchema } from './db.js';

const app = express();
app.use(express.json());

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// ---------- authentication ----------
const ADMIN_USER = process.env.ADMIN_USER ?? 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '4108';
const COOKIE = 'sid';
const SESSION_MS = 8 * 60 * 60 * 1000;
const sessions = new Map<string, number>(); // token -> expiry

const sameSecret = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};
const sessionToken = (req: Request): string | undefined =>
  req.headers.cookie?.split(';').map(c => c.trim().split('=')).find(([k]) => k === COOKIE)?.[1];
const isAuthed = (req: Request): boolean => {
  const t = sessionToken(req);
  const exp = t ? sessions.get(t) : undefined;
  if (!t || !exp) return false;
  if (exp < Date.now()) { sessions.delete(t); return false; }
  return true;
};

// Throttle brute force: 5 failed logins per minute per address.
const failures = new Map<string, number[]>();

app.post('/api/login', (req, res) => {
  const ip = req.ip ?? '';
  const recent = (failures.get(ip) ?? []).filter(t => Date.now() - t < 60_000);
  if (recent.length >= 5) throw new HttpError(429, 'Too many attempts, try again in a minute');
  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string'
      || !sameSecret(username, ADMIN_USER) || !sameSecret(password, ADMIN_PASSWORD)) {
    failures.set(ip, [...recent, Date.now()]);
    throw new HttpError(401, 'Invalid username or password');
  }
  failures.delete(ip);
  const token = randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_MS);
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}`);
  res.status(204).end();
});

app.post('/api/logout', (req, res) => {
  const t = sessionToken(req);
  if (t) sessions.delete(t);
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
  res.status(204).end();
});

app.use('/api', (req, _res, next) => {
  if (!isAuthed(req)) throw new HttpError(401, 'Not logged in');
  next();
});

// The app page needs a session; the login page and static assets stay public.
app.get(['/', '/index.html'], (req, res) => {
  if (!isAuthed(req)) return void res.redirect('/login.html');
  res.sendFile(path.join(import.meta.dirname, '..', 'public', 'index.html'));
});
app.use(express.static(path.join(import.meta.dirname, '..', 'public'), { index: false }));

const str = (v: unknown, field: string): string => {
  if (typeof v !== 'string' || !v.trim()) throw new HttpError(400, `${field} is required`);
  return v.trim();
};
const nonNeg = (v: unknown, field: string): number => {
  const n = Number(v);
  if (v === '' || v === null || !Number.isFinite(n) || n < 0) throw new HttpError(400, `${field} must be a number >= 0`);
  return n;
};
const id = (v: unknown): number => {
  const n = Number(v);
  if (!Number.isInteger(n)) throw new HttpError(400, 'invalid id');
  return n;
};
const date = (v: unknown): string | null => {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new HttpError(400, 'birthday must be YYYY-MM-DD');
  return v;
};
const month = (v: unknown): string => {
  if (typeof v !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(v)) throw new HttpError(400, 'month must be YYYY-MM');
  return v;
};

// Whole state in one call: the data set of one building is small.
app.get('/api/state', async (_req, res) => {
  const [s, rooms, persons, readings] = await Promise.all([
    pool.query('SELECT electric_price::float8 AS "electricPrice", water_price::float8 AS "waterPrice" FROM settings WHERE id = 1'),
    pool.query('SELECT id, name, number, price::float8 AS price FROM rooms ORDER BY number, id'),
    pool.query(`SELECT id, full_name AS "fullName", to_char(birthday, 'YYYY-MM-DD') AS birthday, room_id AS "roomId"
                FROM persons ORDER BY full_name, id`),
    pool.query('SELECT room_id AS "roomId", month, electric::float8 AS electric, water::float8 AS water FROM readings'),
  ]);
  res.json({ settings: s.rows[0], rooms: rooms.rows, persons: persons.rows, readings: readings.rows });
});

app.put('/api/settings', async (req, res) => {
  await pool.query('UPDATE settings SET electric_price = $1, water_price = $2 WHERE id = 1',
    [nonNeg(req.body.electricPrice, 'electricPrice'), nonNeg(req.body.waterPrice, 'waterPrice')]);
  res.status(204).end();
});

app.post('/api/rooms', async (req, res) => {
  const { rows } = await pool.query('INSERT INTO rooms (name, number, price) VALUES ($1,$2,$3) RETURNING id',
    [str(req.body.name, 'name'), str(req.body.number, 'number'), nonNeg(req.body.price, 'price')]);
  res.status(201).json(rows[0]);
});
app.put('/api/rooms/:id', async (req, res) => {
  const r = await pool.query('UPDATE rooms SET name = $1, number = $2, price = $3 WHERE id = $4',
    [str(req.body.name, 'name'), str(req.body.number, 'number'), nonNeg(req.body.price, 'price'), id(req.params.id)]);
  if (!r.rowCount) throw new HttpError(404, 'room not found');
  res.status(204).end();
});
app.delete('/api/rooms/:id', async (req, res) => {
  await pool.query('DELETE FROM rooms WHERE id = $1', [id(req.params.id)]); // persons unassigned, readings cascade
  res.status(204).end();
});

app.post('/api/persons', async (req, res) => {
  const { rows } = await pool.query('INSERT INTO persons (full_name, birthday) VALUES ($1,$2) RETURNING id',
    [str(req.body.fullName, 'fullName'), date(req.body.birthday)]);
  res.status(201).json(rows[0]);
});
app.put('/api/persons/:id', async (req, res) => {
  const r = await pool.query('UPDATE persons SET full_name = $1, birthday = $2 WHERE id = $3',
    [str(req.body.fullName, 'fullName'), date(req.body.birthday), id(req.params.id)]);
  if (!r.rowCount) throw new HttpError(404, 'person not found');
  res.status(204).end();
});
app.delete('/api/persons/:id', async (req, res) => {
  await pool.query('DELETE FROM persons WHERE id = $1', [id(req.params.id)]);
  res.status(204).end();
});
// Add a person to a room, or remove from any room with roomId = null.
app.put('/api/persons/:id/room', async (req, res) => {
  const roomId = req.body.roomId === null ? null : id(req.body.roomId);
  const r = await pool.query('UPDATE persons SET room_id = $1 WHERE id = $2', [roomId, id(req.params.id)]);
  if (!r.rowCount) throw new HttpError(404, 'person not found');
  res.status(204).end();
});

// Upsert only the fields sent, so editing electric doesn't reset water.
app.put('/api/readings', async (req, res) => {
  const { roomId, month: m, electric, water } = req.body;
  const e = electric === undefined ? null : nonNeg(electric, 'electric');
  const w = water === undefined ? null : nonNeg(water, 'water');
  await pool.query(
    `INSERT INTO readings (room_id, month, electric, water) VALUES ($1, $2, COALESCE($3,0), COALESCE($4,0))
     ON CONFLICT (room_id, month) DO UPDATE
       SET electric = COALESCE($3, readings.electric), water = COALESCE($4, readings.water)`,
    [id(roomId), month(m), e, w]);
  res.status(204).end();
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) return void res.status(err.status).json({ error: err.message });
  const code = (err as { code?: string }).code;
  if (code === '23503') return void res.status(400).json({ error: 'referenced room does not exist' });
  console.error(err);
  res.status(500).json({ error: 'internal error' });
});

const port = Number(process.env.PORT ?? 3000);
initSchema()
  .then(() => app.listen(port, () => console.log(`http://localhost:${port}`)))
  .catch(err => { console.error('Cannot connect to PostgreSQL:', err.message); process.exit(1); });
