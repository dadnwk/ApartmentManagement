import { Router } from 'express';
import { pool } from '../db.js';
import { HttpError, id, nonNeg, str } from '../http.js';

export const rooms = Router();

rooms.post('/', async (req, res) => {
  const { rows } = await pool.query('INSERT INTO rooms (name, number, price) VALUES ($1,$2,$3) RETURNING id',
    [str(req.body.name, 'name'), str(req.body.number, 'number'), nonNeg(req.body.price, 'price')]);
  res.status(201).json(rows[0]);
});

rooms.put('/:id', async (req, res) => {
  const r = await pool.query('UPDATE rooms SET name = $1, number = $2, price = $3 WHERE id = $4',
    [str(req.body.name, 'name'), str(req.body.number, 'number'), nonNeg(req.body.price, 'price'), id(req.params.id)]);
  if (!r.rowCount) throw new HttpError(404, 'room not found');
  res.status(204).end();
});

rooms.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM rooms WHERE id = $1', [id(req.params.id)]); // persons unassigned, readings cascade
  res.status(204).end();
});
