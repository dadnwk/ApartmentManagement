import pg from 'pg';

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://apartment:apartment@localhost:5432/apartment',
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
`;

export async function initSchema(): Promise<void> {
  // The client side is UTF-8 (above), but the database must store UTF-8 too: a WIN1252 database
  // rejects characters such as "ễ". The encoding is fixed at CREATE DATABASE time.
  const { rows } = await pool.query('SHOW server_encoding');
  if (rows[0].server_encoding !== 'UTF8') {
    throw new Error(`database encoding is ${rows[0].server_encoding}, expected UTF8 `
      + `(recreate it with: CREATE DATABASE apartment ENCODING 'UTF8' TEMPLATE template0)`);
  }
  await pool.query(schema);
}
