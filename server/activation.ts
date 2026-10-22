import type pg from 'pg';

// A person and the person user accounts linked to them are activated and inactivated together, in either direction,
// so an inactive person can never log in. Inactivating a person (e.g. moved out) also removes them from their room;
// activating does not restore the room, so assign one again by hand.

/** Returns false when the person does not exist. */
export async function setPersonActive(client: pg.PoolClient, personId: number, active: boolean): Promise<boolean> {
  const r = await client.query(
    'UPDATE persons SET active = $1, room_id = CASE WHEN $1 THEN room_id ELSE NULL END WHERE id = $2', [active, personId]);
  if (!r.rowCount) return false;
  await client.query("UPDATE users SET active = $1 WHERE person_id = $2 AND role = 'person'", [active, personId]);
  return true;
}
