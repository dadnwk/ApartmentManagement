import { Router } from 'express';
import { pool } from '../db.js';
import { id, month, nonNeg } from '../http.js';

/** Meter readings per room and month; the bills are computed from them in the browser. */
export const readings = Router();

// Upsert only the fields sent, so editing electric doesn't reset water.
readings.put('/', async (req, res) => {
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
