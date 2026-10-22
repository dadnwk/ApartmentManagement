import {
  bill, findReading, money, num, roomLabel, thisMonth,
  type Field, type Me, type Person, type Role, type Room, type State, type User,
} from './model.js';
import { applyStatic, bindLanguageSelect, t as tx } from './i18n.js';
import { applyTheme, bindThemeButton } from './theme.js';
import { billDetailView, billsView, calendarView, formFieldsView, personsView, roomsView, totalCellView, usersView } from './views.js';

type Values = Record<string, string>;

// ---------- data ----------
let db: State = { settings: { electricPrice: 0, waterPrice: 0 }, rooms: [], persons: [], readings: [] };

async function api(method: string, url: string, body?: unknown): Promise<any> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 401) { location.href = '/login.html'; throw new Error('Not logged in'); }
  if (!res.ok) {
    const msg = (await res.json().catch(() => ({}))).error ?? res.statusText;
    alert(tx('error.prefix', { msg }));
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}
let me: Me | null = null;
let users: User[] = [];
const ALL_PAGES = ['bills', 'calendar', 'rooms', 'persons', 'users'];
/** Pages each role may open. Person users only see their own room, bills and calendar. */
const allowedPages = (role: Role | undefined): string[] => (role === 'person' ? ['bills', 'calendar', 'rooms'] : ALL_PAGES);
const canEdit = () => me?.role !== 'person';

async function load(): Promise<void> {
  [db, me] = await Promise.all([api('GET', '/api/state'), api('GET', '/api/me')]);
  users = canEdit() ? await api('GET', '/api/users') : [];
}
/** Run a mutation, then refresh state and the page. */
async function mutate(method: string, url: string, body?: unknown): Promise<void> {
  try { await api(method, url, body); } catch { return; }
  await load();
  render();
}

// ---------- helpers ----------
const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;

// ---------- modal form ----------
const dlg = $<HTMLDialogElement>('#dlg');
let onSubmit: (() => void) | null = null;
function openForm(title: string, fields: Field[], values: Partial<Values>, cb: (v: Values) => void): void {
  $('#dlgTitle').textContent = title;
  const box = $('#dlgFields');
  box.innerHTML = formFieldsView(fields, values);
  // Fields with showWhen appear (and become required) only while their controlling field has that value.
  const syncConditional = () => box.querySelectorAll<HTMLElement>('[data-show-field]').forEach(label => {
    const source = $<HTMLInputElement>(`[name=${label.dataset.showField}]`, box);
    const shown = source.value === label.dataset.showEquals;
    const control = label.querySelector<HTMLInputElement>('input, select')!;
    label.hidden = !shown;
    control.disabled = !shown;
    control.required = shown && label.dataset.req === '1';
  });
  box.onchange = syncConditional;
  syncConditional();
  onSubmit = () => {
    const out: Values = {};
    fields.forEach(f => {
      const control = $<HTMLInputElement>(`[name=${f.name}]`, dlg);
      out[f.name] = control.disabled ? '' : control.value.trim();
    });
    cb(out);
  };
  dlg.showModal();
}
$('#dlgForm').addEventListener('submit', () => onSubmit?.());
$('#dlgCancel').addEventListener('click', () => dlg.close());

// ---------- pages ----------
let billMonth = thisMonth();
let selectedRoom: number | null = null;
const billDlg = $<HTMLDialogElement>('#billDlg');
/** Show the selected room's bill in the popup; closes it if the room no longer exists. */
function fillBillDialog(): void {
  const room = db.rooms.find(r => r.id === selectedRoom);
  if (!room) { billDlg.close(); return; }
  $('#billBody').innerHTML = billDetailView(db, room, billMonth);
}
billDlg.addEventListener('close', () => { selectedRoom = null; });
$('#billClose').addEventListener('click', () => billDlg.close());
// A click on the backdrop lands on the dialog element itself, outside its content box.
billDlg.addEventListener('click', e => {
  const r = billDlg.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) billDlg.close();
});
let calYear = new Date().getFullYear();
const pages: Record<string, () => string> = {
  rooms: () => roomsView(db, canEdit()),
  persons: () => personsView(db),
  bills: () => billsView(db, billMonth, canEdit()),
  calendar: () => calendarView(db, calYear),
  users: () => usersView(users, me!),
};

// ---------- actions ----------
function roomForm(room?: Room): void {
  openForm(room ? tx('form.editRoom') : tx('form.addRoom'),
    [{ name: 'name', label: tx('form.roomName') }, { name: 'number', label: tx('form.roomNumber') }, { name: 'price', label: tx('form.roomPrice'), type: 'number', step: 'any' }],
    room ? { name: room.name, number: room.number, price: String(room.price) } : {},
    v => {
      const body = { name: v.name, number: v.number, price: num(v.price) };
      void (room ? mutate('PUT', `/api/rooms/${room.id}`, body) : mutate('POST', '/api/rooms', body));
    });
}
function userForm(user?: User): void {
  const roles = ['management', 'person'] as const;
  const fields: Field[] = [
    { name: 'username', label: tx('form.username') },
    { name: 'password', label: tx(user ? 'form.passwordKeep' : 'form.password'), type: 'password', required: !user },
  ];
  if (user?.role !== 'admin') {
    fields.push(
      { name: 'role', label: tx('form.role'), options: roles.map(r => ({ value: r, label: tx(`role.${r}`) })) },
      { name: 'personId', label: tx('form.linkedPerson'), showWhen: { field: 'role', equals: 'person' }, options: [
        { value: '', label: tx('form.noPerson') },
        ...db.persons.map(p => ({ value: String(p.id), label: p.fullName })),
      ] },
    );
  }
  openForm(user ? tx('form.editUser') : tx('form.addUser'), fields,
    user ? { username: user.username, role: user.role, personId: user.personId === null ? '' : String(user.personId) } : { role: 'person' },
    v => {
      const body = { username: v.username, password: v.password, role: v.role, personId: v.personId ? Number(v.personId) : null };
      void (user ? mutate('PUT', `/api/users/${user.id}`, body) : mutate('POST', '/api/users', body));
    });
}
function personForm(person?: Person): void {
  openForm(person ? tx('form.editPerson') : tx('form.addPerson'),
    [
      { name: 'fullName', label: tx('form.fullName') },
      { name: 'birthday', label: tx('form.birthday'), type: 'date' },
      { name: 'roomId', label: tx('form.room'), options: [
        { value: '', label: tx('form.noRoom') },
        ...db.rooms.map(r => ({ value: String(r.id), label: roomLabel(r) })),
      ] },
    ],
    person ? { fullName: person.fullName, birthday: person.birthday ?? '', roomId: person.roomId === null ? '' : String(person.roomId) } : {},
    v => {
      const body = { fullName: v.fullName, birthday: v.birthday || null, roomId: v.roomId ? Number(v.roomId) : null };
      void (person ? mutate('PUT', `/api/persons/${person.id}`, body) : mutate('POST', '/api/persons', body));
    });
}

document.addEventListener('click', e => {
  const row = (e.target as HTMLElement).closest<HTMLElement>('tr.pick');
  if (row && !(e.target as HTMLElement).closest('input, button')) {
    selectedRoom = Number(row.dataset.room);
    fillBillDialog();
    if (!billDlg.open) billDlg.showModal();
    return;
  }
  const t = (e.target as HTMLElement).closest<HTMLElement>('[data-act], [data-month]');
  if (!t) return;
  const { act, month } = t.dataset;
  const id = Number(t.dataset.id);
  if (month) { billMonth = month; location.hash = '#/bills'; return; }
  switch (act) {
    case 'add-room': roomForm(); break;
    case 'edit-room': roomForm(db.rooms.find(r => r.id === id)); break;
    case 'del-room': {
      const r = db.rooms.find(r => r.id === id)!;
      if (confirm(tx('confirm.delRoom', { room: roomLabel(r) })))
        void mutate('DELETE', `/api/rooms/${id}`);
      break;
    }
    case 'add-person': personForm(); break;
    case 'add-user': userForm(); break;
    case 'edit-user': userForm(users.find(u => u.id === id)); break;
    case 'toggle-user': {
      const u = users.find(u => u.id === id)!;
      void mutate('PATCH', `/api/users/${id}/active`, { active: !u.active });
      break;
    }
    case 'del-user': {
      const u = users.find(u => u.id === id)!;
      if (confirm(tx('confirm.delUser', { user: u.username }))) void mutate('DELETE', `/api/users/${id}`);
      break;
    }
    case 'toggle-person': {
      const p = db.persons.find(p => p.id === id)!;
      void mutate('PATCH', `/api/persons/${id}/active`, { active: !p.active });
      break;
    }
    case 'edit-person': personForm(db.persons.find(p => p.id === id)); break;
    case 'del-person':
      if (confirm(tx('confirm.delPerson'))) void mutate('DELETE', `/api/persons/${id}`);
      break;
    case 'year': calYear += Number(t.dataset.d); render(); break;
  }
});

// ---------- settings menu (top right) ----------
const settingsBtn = $<HTMLButtonElement>('#settingsBtn');
const settingsMenu = $('#settingsMenu');
function toggleMenu(open: boolean): void {
  settingsMenu.hidden = !open;
  settingsBtn.setAttribute('aria-expanded', String(open));
}
settingsBtn.addEventListener('click', () => toggleMenu(settingsMenu.hidden));
document.addEventListener('click', e => { if (!(e.target as HTMLElement).closest('.menu-wrap')) toggleMenu(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });

$('#menuPrices').addEventListener('click', () => {
  toggleMenu(false);
  openForm(tx('settings.prices'),
    [
      { name: 'electricPrice', label: tx('settings.electricPrice'), type: 'number', step: 'any' },
      { name: 'waterPrice', label: tx('settings.waterPrice'), type: 'number', step: 'any' },
    ],
    { electricPrice: String(db.settings.electricPrice), waterPrice: String(db.settings.waterPrice) },
    v => void mutate('PUT', '/api/settings', { electricPrice: num(v.electricPrice), waterPrice: num(v.waterPrice) }));
});

$('#logout').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  location.href = '/login.html';
});

document.addEventListener('change', async e => {
  const t = e.target as HTMLInputElement | HTMLSelectElement;
  if (t.id === 'billMonth') {
    if (t.value) { billMonth = t.value; render(); }
  } else if (t.dataset.field) {
    const field = t.dataset.field as 'electric' | 'water';
    const tr = t.closest('tr')!;
    const room = db.rooms.find(r => r.id === Number(tr.dataset.room))!;
    const value = num(t.value);
    try { await api('PUT', '/api/readings', { roomId: room.id, month: billMonth, [field]: value }); } catch { return; }
    let r = findReading(db, room.id, billMonth);
    if (!r) db.readings.push(r = { roomId: room.id, month: billMonth, electric: 0, water: 0 });
    r[field] = value;
    const b = bill(db, room, billMonth);
    $('[data-cell=e]', tr).textContent = money(b.e);
    $('[data-cell=w]', tr).textContent = money(b.w);
    $('[data-cell=t]', tr).innerHTML = totalCellView(b.total);
    $('#billSum').textContent = money(db.rooms.reduce((s, r) => s + bill(db, r, billMonth).total, 0));
  }
});

// ---------- live updates ----------
// Another user changed something: reload. While the user is typing or a dialog is open, wait so nothing is lost.
let stale = false;
const busy = () => dlg.open || !!document.activeElement?.matches('#app input, #app select');
async function refreshIfIdle(): Promise<void> {
  if (busy()) { stale = true; return; }
  stale = false;
  try { await load(); render(); } catch { /* retried on the next change */ }
}
document.addEventListener('focusout', () => setTimeout(() => { if (stale) void refreshIfIdle(); }, 0));
dlg.addEventListener('close', () => { if (stale) void refreshIfIdle(); });
new EventSource('/api/events').onmessage = () => void refreshIfIdle();

// ---------- router ----------
function render(): void {
  const wanted = location.hash.replace('#/', '') || 'bills';
  // Pages are limited per role here for convenience; the server enforces the same rules.
  const allowed = allowedPages(me?.role);
  const page = pages[wanted] && allowed.includes(wanted) ? wanted : 'bills';
  $('#menuPrices').hidden = !canEdit(); // person users cannot change prices
  document.querySelectorAll<HTMLAnchorElement>('#nav a').forEach(a => { a.hidden = !allowed.includes(a.hash.slice(2)); });
  $('#app').innerHTML = pages[page]();
  if (billDlg.open) fillBillDialog();
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#/' + page));
}
window.addEventListener('hashchange', render);
// The sticky calendar bar sticks right below the (sticky) page header, whose height changes with wrapping.
const headerEl = $('header');
new ResizeObserver(() => document.documentElement.style.setProperty('--header-h', `${headerEl.offsetHeight}px`)).observe(headerEl);
bindLanguageSelect($<HTMLSelectElement>('#lang'), render);
applyStatic();
applyTheme();
bindThemeButton($<HTMLButtonElement>('#theme'));
load().then(render).catch(() => { $('#app').innerHTML = `<div class="card">${tx('error.server')}</div>`; });
