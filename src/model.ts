import { formatLocale } from './i18n.js';

export type Role = 'admin' | 'management' | 'person';
export interface Me { id: number; username: string; role: Role }
export interface User {
  id: number; username: string; role: Role; active: boolean;
  personId: number | null; personName: string | null; createdAt: string;
}
export interface Settings { electricPrice: number; waterPrice: number }
export interface Room { id: number; name: string; number: string; price: number }
export interface Person { id: number; fullName: string; birthday: string | null; roomId: number | null; active: boolean }
export interface Reading { roomId: number; month: string; electric: number; water: number }
export interface State { settings: Settings; rooms: Room[]; persons: Person[]; readings: Reading[] }
export interface Field {
  name: string; label: string; type?: string; step?: string; required?: boolean;
  options?: { value: string; label: string }[]; // renders a <select> instead of an <input>
  showWhen?: { field: string; equals: string }; // only shown (and required) while another field has this value
}

export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export const money = (n: number) => (Math.round(n * 100) / 100).toLocaleString(formatLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const num = (v: string) => { const n = parseFloat(v); return isFinite(n) && n >= 0 ? n : 0; };
export const thisMonth = () => new Date().toISOString().slice(0, 7);
export const roomLabel = (r: Room) => `${r.number} – ${r.name}`;
export const occupants = (db: State, roomId: number) => db.persons.filter(p => p.roomId === roomId && p.active);
export const findReading = (db: State, roomId: number, month: string) => db.readings.find(r => r.roomId === roomId && r.month === month);

export function bill(db: State, room: Room, month: string) {
  const r = findReading(db, room.id, month);
  const electric = r?.electric ?? 0, water = r?.water ?? 0;
  const e = db.settings.electricPrice * electric;
  const w = db.settings.waterPrice * water;
  return { recorded: !!r, electric, water, e, w, total: e + w + room.price };
}
