import { Router } from 'express';
import { inTransaction, pool } from '../db.js';
import { HttpError, date, id, optionalId, str } from '../http.js';
import { setPersonActive } from '../activation.js';

export const persons = Router();

persons.post('/', async (req, res) => {
  const { rows } = await pool.query('INSERT INTO persons (full_name, birthday, room_id) VALUES ($1,$2,$3) RETURNING id',
    [str(req.body.fullName, 'fullName'), date(req.body.birthday), optionalId(req.body.roomId)]);
  res.status(201).json(rows[0]);
});

persons.put('/:id', async (req, res) => {
  const roomId = optionalId(req.body.roomId);
  if (roomId !== null) {
    const { rows } = await pool.query('SELECT active FROM persons WHERE id = $1', [id(req.params.id)]);
    if (rows[0] && !rows[0].active) throw new HttpError(400, 'an inactive person cannot be assigned to a room');
  }
  const r = await pool.query('UPDATE persons SET full_name = $1, birthday = $2, room_id = $3 WHERE id = $4',
    [str(req.body.fullName, 'fullName'), date(req.body.birthday), roomId, id(req.params.id)]);
  if (!r.rowCount) throw new HttpError(404, 'person not found');
  res.status(204).end();
});

persons.patch('/:id/active', async (req, res) => {
  if (typeof req.body.active !== 'boolean') throw new HttpError(400, 'active must be true or false');
  const personId = id(req.params.id);
  await inTransaction(async client => {
    if (!await setPersonActive(client, personId, req.body.active)) throw new HttpError(404, 'person not found');
  });
  res.status(204).end();
});

persons.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM persons WHERE id = $1', [id(req.params.id)]);
  res.status(204).end();
});
