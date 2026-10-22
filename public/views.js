import { formatLocale, t } from './i18n.js';
import { bill, esc, money, occupants, roomLabel } from './model.js';
export const formFieldsView = (fields, values) => fields.map(f => {
    const value = values[f.name] ?? '';
    const cond = f.showWhen
        ? ` data-show-field="${f.showWhen.field}" data-show-equals="${esc(f.showWhen.equals)}" ${f.required === false ? '' : 'data-req="1"'}`
        : '';
    if (f.options) {
        return `
    <label${cond}>${esc(f.label)}
      <select name="${f.name}">${f.options.map(o => `<option value="${esc(o.value)}" ${o.value === value ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>
    </label>`;
    }
    return `
    <label${cond}>${esc(f.label)}
      <input name="${f.name}" type="${f.type || 'text'}" ${f.type === 'password' ? 'autocomplete="new-password"' : ''} ${f.step ? `step="${f.step}"` : ''} ${f.type === 'number' ? 'min="0"' : ''}
        value="${esc(value)}" ${f.required === false ? '' : 'required'}>
    </label>`;
}).join('');
export const totalCellView = (total) => `<strong>${money(total)}</strong>`;
export const roomsView = (db, canEdit) => {
    const rows = db.rooms.map(r => {
        const occ = occupants(db, r.id);
        return `<tr><td>${esc(r.number)}</td><td>${esc(r.name)}</td><td class="num">${money(r.price)}</td>
      <td>${occ.length ? occ.map(p => esc(p.fullName)).join(', ') : `<span class="muted">${t('rooms.vacant')}</span>`}</td>
      ${canEdit ? `<td class="actions-cell">
        <button class="small secondary" data-act="edit-room" data-id="${r.id}">${t('edit')}</button>
        <button class="small danger" data-act="del-room" data-id="${r.id}">${t('delete')}</button></td>` : ''}</tr>`;
    }).join('');
    return `<div class="toolbar"><h2>${t('rooms.title')}</h2>${canEdit ? `<button data-act="add-room">${t('rooms.add')}</button>` : ''}</div>
  <div class="card">${db.rooms.length
        ? `<table><thead><tr><th>${t('col.number')}</th><th>${t('col.name')}</th><th class="num">${t('col.price')}</th><th>${t('col.occupants')}</th>${canEdit ? '<th></th>' : ''}</tr></thead><tbody>${rows}</tbody></table>`
        : `<div class="empty">${t('rooms.empty')}</div>`}</div>`;
};
export const personsView = (db) => {
    const rows = db.persons.map(p => {
        const r = db.rooms.find(r => r.id === p.roomId);
        return `<tr class="${p.active ? '' : 'inactive'}"><td>${esc(p.fullName)}</td><td>${esc(p.birthday)}</td>
      <td>${r ? esc(roomLabel(r)) : `<span class="muted">${t('persons.noRoom')}</span>`}</td>
      <td class="${p.active ? '' : 'muted'}">${t(p.active ? 'status.active' : 'status.inactive')}</td>
      <td class="actions-cell">
        <button class="small secondary" data-act="edit-person" data-id="${p.id}">${t('edit')}</button>
        <button class="small secondary" data-act="toggle-person" data-id="${p.id}">${t(p.active ? 'users.inactivate' : 'users.activate')}</button>
        <button class="small danger" data-act="del-person" data-id="${p.id}">${t('delete')}</button></td></tr>`;
    }).join('');
    return `<div class="toolbar"><h2>${t('persons.title')}</h2><button data-act="add-person">${t('persons.add')}</button></div>
  <div class="card">${db.persons.length
        ? `<table><thead><tr><th>${t('col.fullName')}</th><th>${t('col.birthday')}</th><th>${t('col.room')}</th><th>${t('col.status')}</th><th></th></tr></thead><tbody>${rows}</tbody></table>`
        : `<div class="empty">${t('persons.empty')}</div>`}</div>`;
};
export const usersView = (users, me) => {
    const rows = users.map(u => {
        // Management users can only manage person users (and edit themselves); admins manage everyone.
        const manageable = me.role === 'admin' || u.role === 'person' || u.id === me.id;
        // The admin account and your own account can be edited but never deactivated or deleted.
        const protectedRow = u.role === 'admin' || u.id === me.id;
        return `<tr><td>${esc(u.username)}</td><td>${t(`role.${u.role}`)}</td>
      <td>${u.personName ? esc(u.personName) : '<span class="muted">—</span>'}</td>
      <td class="${u.active ? '' : 'muted'}">${t(u.active ? 'status.active' : 'status.inactive')}</td>
      <td>${new Date(u.createdAt).toLocaleDateString(formatLocale())}</td>
      <td class="actions-cell">
        ${manageable ? `<button class="small secondary" data-act="edit-user" data-id="${u.id}">${t('edit')}</button>` : ''}
        ${!manageable || protectedRow ? '' : `
        <button class="small secondary" data-act="toggle-user" data-id="${u.id}">${t(u.active ? 'users.inactivate' : 'users.activate')}</button>
        <button class="small danger" data-act="del-user" data-id="${u.id}">${t('delete')}</button>`}</td></tr>`;
    }).join('');
    return `<div class="toolbar"><h2>${t('users.title')}</h2><button data-act="add-user">${t('users.add')}</button></div>
  <div class="card">${users.length
        ? `<table><thead><tr><th>${t('col.username')}</th><th>${t('col.role')}</th><th>${t('col.person')}</th><th>${t('col.status')}</th><th>${t('col.created')}</th><th></th></tr></thead><tbody>${rows}</tbody></table>`
        : `<div class="empty">${t('users.empty')}</div>`}</div>`;
};
/** Breakdown of one room's bill for a month. */
export const billDetailView = (db, room, month) => {
    const b = bill(db, room, month);
    const occ = occupants(db, room.id).map(p => esc(p.fullName)).join(', ') || `<span class="muted">${t('rooms.vacant')}</span>`;
    const line = (label, calc, amount) => `<tr><td>${label}</td><td class="muted">${calc}</td><td class="num">${money(amount)}</td></tr>`;
    return `<h3 id="billTitle">${t('bills.detail', { room: esc(roomLabel(room)), month })}</h3>
  <p class="muted">${t('col.occupants')}: ${occ}</p>
  ${b.recorded ? '' : `<p class="muted">${t('bills.noReadings')}</p>`}
  <table>
    <tbody>
      ${line(t('bills.electricCost'), `${money(db.settings.electricPrice)} × ${b.electric}`, b.e)}
      ${line(t('bills.waterCost'), `${money(db.settings.waterPrice)} × ${b.water}`, b.w)}
      ${line(t('bills.roomPrice'), '', room.price)}
    </tbody>
    <tfoot><tr><td colspan="2">${t('bills.total')}</td><td class="num">${money(b.total)}</td></tr></tfoot>
  </table>`;
};
export const billsView = (db, month, canEdit) => {
    let sum = 0;
    const rows = db.rooms.map(room => {
        const b = bill(db, room, month);
        sum += b.total;
        const occ = occupants(db, room.id).map(p => p.fullName).join(', ');
        return `<tr data-room="${room.id}" class="pick">
      <td>${esc(roomLabel(room))}<div class="muted">${esc(occ)}</div></td>
      <td><input type="number" min="0" step="any" data-field="electric" value="${b.recorded ? b.electric : ''}" placeholder="0" ${canEdit ? '' : 'readonly'}></td>
      <td><input type="number" min="0" step="any" data-field="water" value="${b.recorded ? b.water : ''}" placeholder="0" ${canEdit ? '' : 'readonly'}></td>
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
const monthName = (i) => new Intl.DateTimeFormat(formatLocale(), { month: 'long' }).format(new Date(2000, i, 1));
export const calendarView = (db, year) => {
    const months = Array.from({ length: 12 }, (_, i) => {
        const m = `${year}-${String(i + 1).padStart(2, '0')}`;
        let total = 0;
        const lines = db.rooms.map(r => {
            const b = bill(db, r, m);
            if (b.recorded)
                total += b.total;
            return `<div class="line"><span>${esc(roomLabel(r))}</span><span class="${b.recorded ? '' : 'muted'}">${b.recorded ? money(b.total) : '—'}</span></div>`;
        }).join('');
        return `<div class="month" data-month="${m}"><h3><span>${monthName(i)}</span></h3>
      ${lines || `<div class="muted">${t('calendar.noRooms')}</div>`}
      <div class="line total"><span>${t('calendar.total')}</span><span>${money(total)}</span></div></div>`;
    }).join('');
    return `
  <div class="sticky-bar">
    <h2>${t('calendar.title')}</h2>
    <div><button class="secondary" data-act="year" data-d="-1">◀</button>
      <strong class="year">${year}</strong>
      <button class="secondary" data-act="year" data-d="1">▶</button></div>
  </div>
  <p class="muted">${t('calendar.hint')}</p>
  <div class="cal">${months}</div>`;
};
