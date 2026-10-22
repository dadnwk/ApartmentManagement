export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// ---------- request validation ----------
export const str = (v: unknown, field: string): string => {
  if (typeof v !== 'string' || !v.trim()) throw new HttpError(400, `${field} is required`);
  return v.trim();
};
export const nonNeg = (v: unknown, field: string): number => {
  const n = Number(v);
  if (v === '' || v === null || !Number.isFinite(n) || n < 0) throw new HttpError(400, `${field} must be a number >= 0`);
  return n;
};
export const id = (v: unknown): number => {
  const n = Number(v);
  if (!Number.isInteger(n)) throw new HttpError(400, 'invalid id');
  return n;
};
// roomId is optional: a number puts the person in that room, null/empty leaves them without one.
export const optionalId = (v: unknown): number | null => (v === undefined || v === null || v === '' ? null : id(v));
export const date = (v: unknown): string | null => {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new HttpError(400, 'birthday must be YYYY-MM-DD');
  return v;
};
export const month = (v: unknown): string => {
  if (typeof v !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(v)) throw new HttpError(400, 'month must be YYYY-MM');
  return v;
};
