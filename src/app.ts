import {
  bill, findReading, money, num, roomLabel, thisMonth,
  type Field, type Person, type Room, type State,
} from './model.js';
import { applyStatic, bindLanguageSelect, t as tx } from './i18n.js';
import { billsView, calendarView, formFieldsView, personsView, roomsView, settingsView, totalCellView } from './views.js';

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
async function load(): Promise<void> { db = await api('GET', '/api/state'); }
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
  $('#dlgFields').innerHTML = formFieldsView(fields, values);
  onSubmit = () => {
    const out: Values = {};
    fields.forEach(f => out[f.name] = $<HTMLInputElement>(`[name=${f.name}]`, dlg).value.trim());
    cb(out);
  };
  dlg.showModal();
}
$('#dlgForm').addEventListener('submit', () => onSubmit?.());
$('#dlgCancel').addEventListener('click', () => dlg.close());

// ---------- pages ----------
let billMonth = thisMonth();
let calYear = new Date().getFullYear();
const pages: Record<string, () => string> = {
  settings: () => settingsView(db),
  rooms: () => roomsView(db),
  persons: () => personsView(db),
  bills: () => billsView(db, billMonth),
  calendar: () => calendarView(db, calYear),
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
function personForm(person?: Person): void {
  openForm(person ? tx('form.editPerson') : tx('form.addPerson'),
    [{ name: 'fullName', label: tx('form.fullName') }, { name: 'birthday', label: tx('form.birthday'), type: 'date' }],
    person ? { fullName: person.fullName, birthday: person.birthday ?? '' } : {},
    v => {
      const body = { fullName: v.fullName, birthday: v.birthday || null };
      void (person ? mutate('PUT', `/api/persons/${person.id}`, body) : mutate('POST', '/api/persons', body));
    });
}

document.addEventListener('click', e => {
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
    case 'edit-person': personForm(db.persons.find(p => p.id === id)); break;
    case 'del-person':
      if (confirm(tx('confirm.delPerson'))) void mutate('DELETE', `/api/persons/${id}`);
      break;
    case 'year': calYear += Number(t.dataset.d); render(); break;
  }
});

$('#logout').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  location.href = '/login.html';
});

document.addEventListener('submit', e => {
  const form = e.target as HTMLFormElement;
  if (form.dataset.form === 'prices') {
    e.preventDefault();
    void mutate('PUT', '/api/settings', {
      electricPrice: num(form.electricPrice.value),
      waterPrice: num(form.waterPrice.value),
    });
  }
});

document.addEventListener('change', async e => {
  const t = e.target as HTMLInputElement | HTMLSelectElement;
  if (t.dataset.act === 'assign') {
    await mutate('PUT', `/api/persons/${t.dataset.id}/room`, { roomId: t.value ? Number(t.value) : null });
  } else if (t.id === 'billMonth') {
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

// ---------- router ----------
function render(): void {
  const wanted = location.hash.replace('#/', '') || 'bills';
  const page = pages[wanted] ? wanted : 'bills';
  $('#app').innerHTML = pages[page]();
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#/' + page));
}
window.addEventListener('hashchange', render);
bindLanguageSelect($<HTMLSelectElement>('#lang'), render);
applyStatic();
load().then(render).catch(() => { $('#app').innerHTML = `<div class="card">${tx('error.server')}</div>`; });
