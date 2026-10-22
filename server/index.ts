import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'node:path';
import { initSchema } from './db.js';
import { HttpError } from './http.js';
import { currentUser, requireLogin, requireStaff } from './session.js';
import { events, notifyOnChange } from './events.js';
import { auth } from './routes/auth.js';
import { state } from './routes/state.js';
import { settings } from './routes/settings.js';
import { rooms } from './routes/rooms.js';
import { persons } from './routes/persons.js';
import { readings } from './routes/readings.js';
import { users } from './routes/users.js';

const app = express();
app.use(express.json());

// ---------- API ----------
app.use('/api', auth); // login and logout need no session
app.use('/api', requireLogin);
app.use('/api/events', events);
app.use('/api', notifyOnChange);
app.use('/api', state);
// Person users are read-only: they may only fetch /api/state and /api/me, so everything below is staff only.
app.use('/api/settings', requireStaff, settings);
app.use('/api/rooms', requireStaff, rooms);
app.use('/api/persons', requireStaff, persons);
app.use('/api/readings', requireStaff, readings);
app.use('/api/users', requireStaff, users);

// ---------- pages ----------
// The app page needs a session; the login page and static assets stay public.
app.get(['/', '/index.html'], async (req, res) => {
  if (!await currentUser(req)) return void res.redirect('/login.html');
  res.sendFile(path.join(import.meta.dirname, '..', 'public', 'index.html'));
});
app.use(express.static(path.join(import.meta.dirname, '..', 'public'), { index: false }));

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) return void res.status(err.status).json({ error: err.message });
  const code = (err as { code?: string }).code;
  if (code === '23505') return void res.status(409).json({ error: 'username already exists' });
  if (code === '23503') return void res.status(400).json({ error: 'referenced record does not exist' });
  console.error(err);
  res.status(500).json({ error: 'internal error' });
});

const port = Number(process.env.PORT ?? 3000);
initSchema()
  .then(() => app.listen(port, () => console.log(`http://localhost:${port}`)))
  .catch(err => { console.error('Cannot connect to PostgreSQL:', err.message); process.exit(1); });
