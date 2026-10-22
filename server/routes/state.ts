import { Router } from 'express';
import { pool } from '../db.js';
import { me } from '../session.js';

export const state = Router();

state.get('/me', (_req, res) => {
  const { id, username, role } = me(res);
  res.json({ id, username, role });
});

// Whole state in one call: the data set of one building is small.
state.get('/state', async (_req, res) => {
  const user = me(res);
  // Person users only see the room of the person their account is linked to.
  let scope: number | null | undefined; // undefined = no restriction
  if (user.role === 'person') {
    const r = await pool.query('SELECT room_id FROM persons WHERE id = $1', [user.personId]);
    scope = r.rows[0]?.room_id ?? null;
  }
  const where = (column: string) => (scope === undefined ? '' : `WHERE ${column} = $1`);
  const params = scope === undefined ? [] : [scope];
  const [s, rooms, persons, readings] = await Promise.all([
    pool.query('SELECT electric_price::float8 AS "electricPrice", water_price::float8 AS "waterPrice" FROM settings WHERE id = 1'),
    pool.query(`SELECT id, name, number, price::float8 AS price FROM rooms ${where('id')} ORDER BY number, id`, params),
    pool.query(`SELECT id, full_name AS "fullName", to_char(birthday, 'YYYY-MM-DD') AS birthday, room_id AS "roomId", active
                FROM persons ${where('room_id')} ORDER BY full_name, id`, params),
    pool.query(`SELECT room_id AS "roomId", month, electric::float8 AS electric, water::float8 AS water
                FROM readings ${where('room_id')}`, params),
  ]);
  res.json({ settings: s.rows[0], rooms: rooms.rows, persons: persons.rows, readings: readings.rows });
});
