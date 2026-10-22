import { Router } from 'express';
import { pool } from '../db.js';
import { nonNeg } from '../http.js';

export const settings = Router();

settings.put('/', async (req, res) => {
  await pool.query('UPDATE settings SET electric_price = $1, water_price = $2 WHERE id = 1',
    [nonNeg(req.body.electricPrice, 'electricPrice'), nonNeg(req.body.waterPrice, 'waterPrice')]);
  res.status(204).end();
});
