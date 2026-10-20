import { formatLocale, t } from './i18n.js';
import { bill, esc, money, occupants, roomLabel, type Field, type State } from './model.js';

export const formFieldsView = (fields: Field[], values: Partial<Record<string, string>>) => fields.map(f => `
    <label>${esc(f.label)}
      <input name="${f.name}" type="${f.type || 'text'}" ${f.step ? `step="${f.step}"` : ''} ${f.type === 'number' ? 'min="0"' : ''}
        value="${esc(values[f.name] ?? '')}" ${f.required === false ? '' : 'required'}>
    </label>`).join('');

export const totalCellView = (total: number) => `<strong>${money(total)}</strong>`;

export const settingsView = (db: State) => {
  const s = db.settings;
  const roomRows = db.rooms.map(r => `
    <tr><td>${esc(r.number)}</td><td>${esc(r.name)}</td><td class="num">${money(r.price)}</td>
    <td class="actions-cell">
      <button class="small secondary" data-act="edit-room" data-id="${r.id}">${t('edit')}</button>
      <button class="small danger" data-act="del-room" data-id="${r.id}">${t('delete')}</button></td></tr>`).join('');
  const personRows = db.persons.map(p => `
    <tr><td>${esc(p.fullName)}</td><td>${esc(p.birthday)}</td>
    <td class="actions-cell">
      <button class="small secondary" data-act="edit-person" data-id="${p.id}">${t('edit')}</button>
      <button class="small danger" data-act="del-person" data-id="${p.id}">${t('delete')}</button></td></tr>`).join('');
  const roomOpts = (id: number | null) => `<option value="">${t('settings.none')}</option>` +
    db.rooms.map(r => `<option value="${r.id}" ${r.id === id ? 'selected' : ''}>${esc(roomLabel(r))}</option>`).join('');
  const assignRows = db.persons.map(p => `
    <tr><td>${esc(p.fullName)}</td>
    <td><select data-act="assign" data-id="${p.id}">${roomOpts(p.roomId)}</select></td></tr>`).join('');

  return `
  <h2>${t('settings.title')}</h2>
  <div class="card">
    <h3>${t('settings.prices')}</h3>
    <form class="row" data-form="prices">
      <label>${t('settings.electricPrice')}<input name="electricPrice" type="number" min="0" step="any" value="${s.electricPrice}" required></label>
      <label>${t('settings.waterPrice')}<input name="waterPrice" type="number" min="0" step="any" value="${s.waterPrice}" required></label>
      <button>${t('settings.savePrices')}</button>
    </form>
    <p class="muted">${t('settings.pricesNote')}</p>
  </div>
  <div class="card">
    <div class="toolbar"><h3>${t('settings.rooms')}</h3><button data-act="add-room">${t('settings.addRoom')}</button></div>
    ${db.rooms.length ? `<table><thead><tr><th>${t('col.number')}</th><th>${t('col.name')}</th><th class="num">${t('col.price')}</th><th></th></tr></thead><tbody>${roomRows}</tbody></table>` : `<div class="empty">${t('settings.noRooms')}</div>`}
  </div>
  <div class="card">
    <div class="toolbar"><h3>${t('settings.persons')}</h3><button data-act="add-person">${t('settings.addPerson')}</button></div>
    ${db.persons.length ? `<table><thead><tr><th>${t('col.fullName')}</th><th>${t('col.birthday')}</th><th></th></tr></thead><tbody>${personRows}</tbody></table>` : `<div class="empty">${t('settings.noPersons')}</div>`}
  </div>
  <div class="card">
    <h3>${t('settings.assignment')}</h3>
    ${db.persons.length && db.rooms.length ? `<table><thead><tr><th>${t('col.person')}</th><th>${t('col.room')}</th></tr></thead><tbody>${assignRows}</tbody></table>` : `<div class="empty">${t('settings.assignFirst')}</div>`}
  </div>`;
};

export const roomsView = (db: State) => {
  const rows = db.rooms.map(r => {
    const occ = occupants(db, r.id);
    return `<tr><td>${esc(r.number)}</td><td>${esc(r.name)}</td><td class="num">${money(r.price)}</td>
      <td>${occ.length ? occ.map(p => esc(p.fullName)).join(', ') : `<span class="muted">${t('rooms.vacant')}</span>`}</td></tr>`;
  }).join('');
  return `<h2>${t('rooms.title')}</h2><div class="card">${db.rooms.length
    ? `<table><thead><tr><th>${t('col.number')}</th><th>${t('col.name')}</th><th class="num">${t('col.price')}</th><th>${t('col.occupants')}</th></tr></thead><tbody>${rows}</tbody></table>`
    : `<div class="empty">${t('rooms.empty')}</div>`}</div>`;
};

export const personsView = (db: State) => {
  const rows = db.persons.map(p => {
    const r = db.rooms.find(r => r.id === p.roomId);
    return `<tr><td>${esc(p.fullName)}</td><td>${esc(p.birthday)}</td>
      <td>${r ? esc(roomLabel(r)) : `<span class="muted">${t('persons.noRoom')}</span>`}</td></tr>`;
  }).join('');
  return `<h2>${t('persons.title')}</h2><div class="card">${db.persons.length
    ? `<table><thead><tr><th>${t('col.fullName')}</th><th>${t('col.birthday')}</th><th>${t('col.room')}</th></tr></thead><tbody>${rows}</tbody></table>`
    : `<div class="empty">${t('persons.empty')}</div>`}</div>`;
};

export const billsView = (db: State, month: string) => {
  let sum = 0;
  const rows = db.rooms.map(room => {
    const b = bill(db, room, month); sum += b.total;
    const occ = occupants(db, room.id).map(p => p.fullName).join(', ');
    return `<tr data-room="${room.id}">
      <td>${esc(roomLabel(room))}<div class="muted">${esc(occ)}</div></td>
      <td><input type="number" min="0" step="any" data-field="electric" value="${b.recorded ? b.electric : ''}" placeholder="0"></td>
      <td><input type="number" min="0" step="any" data-field="water" value="${b.recorded ? b.water : ''}" placeholder="0"></td>
      <td class="num" data-cell="e">${money(b.e)}</td>
      <td class="num" data-cell="w">${money(b.w)}</td>
      <td class="num">${money(room.price)}</td>
      <td class="num" data-cell="t">${totalCellView(b.total)}</td></tr>`;
  }).join('');
  return `
  <h2>${t('bills.title')}</h2>
  <div class="card">
    <div class="toolbar">
      <label>${t('bills.month')}<input type="month" id="billMonth" value="${month}"></label>
      <span class="muted">${t('bills.formula')}</span>
    </div>
    ${db.rooms.length ? `<table>
      <thead><tr><th>${t('bills.room')}</th><th>${t('bills.electricUsed')}</th><th>${t('bills.waterUsed')}</th><th class="num">${t('bills.electricCost')}</th><th class="num">${t('bills.waterCost')}</th><th class="num">${t('bills.roomPrice')}</th><th class="num">${t('bills.total')}</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="6">${t('bills.allRooms')}</td><td class="num" id="billSum">${money(sum)}</td></tr></tfoot>
    </table>` : `<div class="empty">${t('rooms.empty')}</div>`}
  </div>`;
};

const monthName = (i: number) =>
  new Intl.DateTimeFormat(formatLocale(), { month: 'long' }).format(new Date(2000, i, 1));

export const calendarView = (db: State, year: number) => {
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = `${year}-${String(i + 1).padStart(2, '0')}`;
    let total = 0;
    const lines = db.rooms.map(r => {
      const b = bill(db, r, m);
      if (b.recorded) total += b.total;
      return `<div class="line"><span>${esc(roomLabel(r))}</span><span class="${b.recorded ? '' : 'muted'}">${b.recorded ? money(b.total) : '—'}</span></div>`;
    }).join('');
    return `<div class="month" data-month="${m}"><h3><span>${monthName(i)}</span></h3>
      ${lines || `<div class="muted">${t('calendar.noRooms')}</div>`}
      <div class="line total"><span>${t('calendar.total')}</span><span>${money(total)}</span></div></div>`;
  }).join('');
  return `
  <h2>${t('calendar.title')}</h2>
  <div class="toolbar">
    <div><button class="secondary" data-act="year" data-d="-1">◀</button>
      <strong class="year">${year}</strong>
      <button class="secondary" data-act="year" data-d="1">▶</button></div>
    <span class="muted">${t('calendar.hint')}</span>
  </div>
  <div class="cal">${months}</div>`;
};
