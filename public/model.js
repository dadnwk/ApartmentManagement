import { formatLocale } from './i18n.js';
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = (n) => (Math.round(n * 100) / 100).toLocaleString(formatLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const num = (v) => { const n = parseFloat(v); return isFinite(n) && n >= 0 ? n : 0; };
export const thisMonth = () => new Date().toISOString().slice(0, 7);
export const roomLabel = (r) => `${r.number} – ${r.name}`;
export const occupants = (db, roomId) => db.persons.filter(p => p.roomId === roomId && p.active);
export const findReading = (db, roomId, month) => db.readings.find(r => r.roomId === roomId && r.month === month);
export function bill(db, room, month) {
    const r = findReading(db, room.id, month);
    const electric = r?.electric ?? 0, water = r?.water ?? 0;
    const e = db.settings.electricPrice * electric;
    const w = db.settings.waterPrice * water;
    return { recorded: !!r, electric, water, e, w, total: e + w + room.price };
}
