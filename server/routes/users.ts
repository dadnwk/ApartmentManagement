import { Router, type Response } from 'express';
import { inTransaction, pool, type Role } from '../db.js';
import { hashPassword } from '../password.js';
import { HttpError, id, optionalId, str } from '../http.js';
import { setPersonActive } from '../activation.js';
import { me } from '../session.js';

// Management users manage person accounts: they cannot see the admin account and cannot edit, delete or
// (in)activate other management users (their own account can be edited, e.g. to change the password).
export const users = Router();

const USER_SELECT = `SELECT u.id, u.username, u.role, u.active, u.person_id AS "personId",
  p.full_name AS "personName", u.created_at AS "createdAt"
  FROM users u LEFT JOIN persons p ON p.id = u.person_id`;

users.get('/', async (_req, res) => {
  const hideAdmin = me(res).role !== 'admin';
  const { rows } = await pool.query(`${USER_SELECT} ${hideAdmin ? "WHERE u.role <> 'admin'" : ''} ORDER BY u.created_at, u.id`);
  res.json(rows);
});

async function loadTarget(res: Response, rawId: unknown): Promise<{ id: number; role: Role }> {
  const { rows } = await pool.query('SELECT id, role FROM users WHERE id = $1', [id(rawId)]);
  const target = rows[0];
  const requester = me(res);
  // The admin account does not exist as far as management users can tell.
  if (!target || (target.role === 'admin' && requester.role !== 'admin')) throw new HttpError(404, 'user not found');
  if (requester.role === 'management' && target.role === 'management' && target.id !== requester.id) {
    throw new HttpError(403, 'Management users can only manage person users');
  }
  return target;
}

function userFields(body: Record<string, unknown>, fixedRole?: Role) {
  const username = str(body.username, 'username');
  if (username.length < 3 || username.length > 50) throw new HttpError(400, 'username must be 3 to 50 characters');
  const role = fixedRole ?? body.role;
  if (role !== 'admin' && role !== 'management' && role !== 'person') throw new HttpError(400, 'invalid role');
  if (role === 'admin' && !fixedRole) throw new HttpError(400, 'role must be management or person');
  const personId = role === 'person' ? optionalId(body.personId) : null;
  if (role === 'person' && personId === null) throw new HttpError(400, 'a person user must be linked to a person');
  return { username, role: role as Role, personId };
}
const newPassword = (v: unknown): string | null => {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v !== 'string' || v.length < 4) throw new HttpError(400, 'password must be at least 4 characters');
  return v;
};

// The single admin account is seeded at startup; users created here are management or person.
users.post('/', async (req, res) => {
  const { username, role, personId } = userFields(req.body);
  const password = newPassword(req.body.password);
  if (!password) throw new HttpError(400, 'password is required');
  const { rows } = await pool.query(
    'INSERT INTO users (username, password_hash, role, person_id) VALUES ($1,$2,$3,$4) RETURNING id',
    [username, await hashPassword(password), role, personId]);
  res.status(201).json(rows[0]);
});

users.put('/:id', async (req, res) => {
  const target = await loadTarget(res, req.params.id);
  // The admin account keeps its role; everyone else is management or person.
  const { username, role, personId } = userFields(req.body, target.role === 'admin' ? 'admin' : undefined);
  if (target.id === me(res).id && role !== target.role) throw new HttpError(400, 'you cannot change your own role');
  const password = newPassword(req.body.password);
  await pool.query(
    'UPDATE users SET username = $1, role = $2, person_id = $3, password_hash = COALESCE($4, password_hash) WHERE id = $5',
    [username, role, personId, password && await hashPassword(password), target.id]);
  res.status(204).end();
});

users.patch('/:id/active', async (req, res) => {
  const target = await loadTarget(res, req.params.id);
  if (typeof req.body.active !== 'boolean') throw new HttpError(400, 'active must be true or false');
  if (target.role === 'admin') throw new HttpError(400, 'the admin account cannot be deactivated');
  if (target.id === me(res).id) throw new HttpError(400, 'you cannot deactivate yourself');
  await inTransaction(async client => {
    const { rows } = await client.query('UPDATE users SET active = $1 WHERE id = $2 RETURNING person_id', [req.body.active, target.id]);
    if (rows[0].person_id !== null) await setPersonActive(client, rows[0].person_id, req.body.active);
  });
  res.status(204).end();
});

users.delete('/:id', async (req, res) => {
  const target = await loadTarget(res, req.params.id);
  if (target.role === 'admin') throw new HttpError(400, 'the admin account cannot be deleted');
  if (target.id === me(res).id) throw new HttpError(400, 'you cannot delete yourself');
  await pool.query('DELETE FROM users WHERE id = $1', [target.id]);
  res.status(204).end();
});
