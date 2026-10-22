import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { hashPassword } from './password.js';

/** The localhost default is for development only; production must say where its database is. */
function devDatabaseUrl(): string {
  if (process.env.NODE_ENV === 'production') throw new Error('DATABASE_URL is required in production');
  return 'postgres://apartment:apartment@localhost:5432/apartment';
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? devDatabaseUrl(),
  // Exchange text as UTF-8 so names such as "Nguyễn Thị Ánh" survive the round trip.
  options: '-c client_encoding=UTF8',
});

const schema = `
CREATE TABLE IF NOT EXISTS settings (
  id             integer PRIMARY KEY CHECK (id = 1),
  electric_price numeric(12,4) NOT NULL DEFAULT 0 CHECK (electric_price >= 0),
  water_price    numeric(12,4) NOT NULL DEFAULT 0 CHECK (water_price >= 0)
);
INSERT INTO settings (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS rooms (
  id     serial PRIMARY KEY,
  name   text NOT NULL,
  number text NOT NULL,
  price  numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0)
);

CREATE TABLE IF NOT EXISTS persons (
  id        serial PRIMARY KEY,
  full_name text NOT NULL,
  birthday  date,
  room_id   integer REFERENCES rooms(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS readings (
  room_id  integer NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  month    char(7) NOT NULL CHECK (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  electric numeric(12,2) NOT NULL DEFAULT 0 CHECK (electric >= 0),
  water    numeric(12,2) NOT NULL DEFAULT 0 CHECK (water >= 0),
  PRIMARY KEY (room_id, month)
);

CREATE TABLE IF NOT EXISTS users (
  id            serial PRIMARY KEY,
  username      text NOT NULL,
  password_hash text NOT NULL,
  role          text NOT NULL CHECK (role IN ('admin', 'management', 'person')),
  active        boolean NOT NULL DEFAULT true,
  person_id     integer REFERENCES persons(id) ON DELETE SET NULL, -- the person a 'person' user may see
  created_at    timestamptz NOT NULL DEFAULT now()
);
-- upgrade databases created before these columns existed
ALTER TABLE persons ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS person_id integer REFERENCES persons(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_key ON users (lower(username));
`;

export type Role = 'admin' | 'management' | 'person';

export async function initSchema(): Promise<void> {
  // The client side is UTF-8 (above), but the database must store UTF-8 too: a WIN1252 database
  // rejects characters such as "ễ". The encoding is fixed at CREATE DATABASE time.
  const { rows } = await pool.query('SHOW server_encoding');
  if (rows[0].server_encoding !== 'UTF8') {
    throw new Error(`database encoding is ${rows[0].server_encoding}, expected UTF8 `
      + `(recreate it with: CREATE DATABASE apartment ENCODING 'UTF8' TEMPLATE template0)`);
  }
  await pool.query(schema);
  await seedAdmin();
}

/**
 * First start only: create the admin account. The password comes from ADMIN_PASSWORD, or from the file named by
 * ADMIN_PASSWORD_FILE (Docker/Compose secrets). With neither set, a random one is generated and printed once.
 */
async function seedAdmin(): Promise<void> {
  const { rowCount } = await pool.query("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1");
  if (rowCount) return;
  const username = process.env.ADMIN_USER ?? 'admin';
  let password = process.env.ADMIN_PASSWORD
    ?? (process.env.ADMIN_PASSWORD_FILE && readFileSync(process.env.ADMIN_PASSWORD_FILE, 'utf8').trim());
  if (!password) {
    password = randomBytes(12).toString('base64url');
    console.log(`Created admin account "${username}" with generated password: ${password}  (change it after logging in)`);
  }
  await pool.query("INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'admin')",
    [username, await hashPassword(password)]);
}

/** Run `work` in one transaction: committed if it resolves, rolled back if it throws. */
export async function inTransaction(work: (client: pg.PoolClient) => Promise<void>): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await work(client);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
