export type Locale = 'en' | 'vi';
export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
];

const en = {
  'app.title': 'Apartment Management',
  'nav.bills': 'Bills',
  'nav.calendar': 'Calendar',
  'nav.rooms': 'Rooms',
  'nav.persons': 'Persons',
  'nav.settings': 'Settings',
  'logout': 'Log out',
  'save': 'Save',
  'cancel': 'Cancel',
  'edit': 'Edit',
  'delete': 'Delete',
  'language': 'Language',
  'error.prefix': 'Error: {msg}',
  'error.server': 'Cannot reach the server.',

  'login.title': 'Login',
  'login.username': 'Username',
  'login.password': 'Password',
  'login.submit': 'Log in',
  'login.failed': 'Login failed',
  'login.invalid': 'Invalid username or password',

  'col.number': 'Number',
  'col.name': 'Name',
  'col.price': 'Price',
  'col.occupants': 'Occupants',
  'col.fullName': 'Full name',
  'col.birthday': 'Birthday',
  'col.room': 'Room',
  'col.person': 'Person',

  'settings.title': 'Settings',
  'settings.prices': 'Prices',
  'settings.electricPrice': 'Electric price (per unit)',
  'settings.waterPrice': 'Water price (per unit)',
  'settings.savePrices': 'Save prices',
  'settings.pricesNote': 'Bills always use the current prices.',
  'settings.rooms': 'Rooms',
  'settings.addRoom': '+ Add room',
  'settings.noRooms': 'No rooms yet.',
  'settings.persons': 'Persons',
  'settings.addPerson': '+ Add person',
  'settings.noPersons': 'No persons yet.',
  'settings.assignment': 'Room assignment',
  'settings.assignFirst': 'Add rooms and persons first.',
  'settings.none': '— none —',

  'rooms.title': 'Rooms',
  'rooms.empty': 'No rooms yet. Add them in Settings.',
  'rooms.vacant': 'vacant',
  'persons.title': 'Persons',
  'persons.empty': 'No persons yet. Add them in Settings.',
  'persons.noRoom': 'no room',

  'bills.title': 'Monthly bills',
  'bills.month': 'Month',
  'bills.formula': 'Bill = electric price × electric + water price × water + room price',
  'bills.room': 'Room',
  'bills.electricUsed': 'Electric used',
  'bills.waterUsed': 'Water used',
  'bills.electricCost': 'Electric cost',
  'bills.waterCost': 'Water cost',
  'bills.roomPrice': 'Room price',
  'bills.total': 'Total',
  'bills.allRooms': 'All rooms',

  'calendar.title': 'Calendar',
  'calendar.hint': 'Amount per room per month (— = no readings entered). Click a month to edit its bills.',
  'calendar.total': 'Total',
  'calendar.noRooms': 'No rooms',

  'form.addRoom': 'Add room',
  'form.editRoom': 'Edit room',
  'form.roomName': 'Room name',
  'form.roomNumber': 'Room number',
  'form.roomPrice': 'Room price',
  'form.addPerson': 'Add person',
  'form.editPerson': 'Edit person',
  'form.fullName': 'Full name',
  'form.birthday': 'Birthday',
  'confirm.delRoom': 'Delete room {room}? Its occupants will be unassigned and its readings removed.',
  'confirm.delPerson': 'Delete this person?',
};

export type Key = keyof typeof en;

// Typed against `en`, so a missing Vietnamese key is a compile error.
const vi: Record<Key, string> = {
  'app.title': 'Quản lý căn hộ',
  'nav.bills': 'Hóa đơn',
  'nav.calendar': 'Lịch',
  'nav.rooms': 'Phòng',
  'nav.persons': 'Người ở',
  'nav.settings': 'Cài đặt',
  'logout': 'Đăng xuất',
  'save': 'Lưu',
  'cancel': 'Hủy',
  'edit': 'Sửa',
  'delete': 'Xóa',
  'language': 'Ngôn ngữ',
  'error.prefix': 'Lỗi: {msg}',
  'error.server': 'Không thể kết nối tới máy chủ.',

  'login.title': 'Đăng nhập',
  'login.username': 'Tên đăng nhập',
  'login.password': 'Mật khẩu',
  'login.submit': 'Đăng nhập',
  'login.failed': 'Đăng nhập thất bại',
  'login.invalid': 'Sai tên đăng nhập hoặc mật khẩu',

  'col.number': 'Số phòng',
  'col.name': 'Tên',
  'col.price': 'Giá',
  'col.occupants': 'Người ở',
  'col.fullName': 'Họ và tên',
  'col.birthday': 'Ngày sinh',
  'col.room': 'Phòng',
  'col.person': 'Người',

  'settings.title': 'Cài đặt',
  'settings.prices': 'Đơn giá',
  'settings.electricPrice': 'Giá điện (mỗi đơn vị)',
  'settings.waterPrice': 'Giá nước (mỗi đơn vị)',
  'settings.savePrices': 'Lưu đơn giá',
  'settings.pricesNote': 'Hóa đơn luôn tính theo đơn giá hiện tại.',
  'settings.rooms': 'Phòng',
  'settings.addRoom': '+ Thêm phòng',
  'settings.noRooms': 'Chưa có phòng nào.',
  'settings.persons': 'Người ở',
  'settings.addPerson': '+ Thêm người',
  'settings.noPersons': 'Chưa có người nào.',
  'settings.assignment': 'Xếp phòng',
  'settings.assignFirst': 'Hãy thêm phòng và người ở trước.',
  'settings.none': '— không —',

  'rooms.title': 'Phòng',
  'rooms.empty': 'Chưa có phòng nào. Hãy thêm trong Cài đặt.',
  'rooms.vacant': 'trống',
  'persons.title': 'Người ở',
  'persons.empty': 'Chưa có người nào. Hãy thêm trong Cài đặt.',
  'persons.noRoom': 'chưa có phòng',

  'bills.title': 'Hóa đơn hàng tháng',
  'bills.month': 'Tháng',
  'bills.formula': 'Hóa đơn = giá điện × số điện + giá nước × số nước + giá phòng',
  'bills.room': 'Phòng',
  'bills.electricUsed': 'Điện sử dụng',
  'bills.waterUsed': 'Nước sử dụng',
  'bills.electricCost': 'Tiền điện',
  'bills.waterCost': 'Tiền nước',
  'bills.roomPrice': 'Giá phòng',
  'bills.total': 'Tổng cộng',
  'bills.allRooms': 'Tất cả phòng',

  'calendar.title': 'Lịch',
  'calendar.hint': 'Số tiền của từng phòng theo tháng (— = chưa nhập chỉ số). Nhấn vào một tháng để sửa hóa đơn.',
  'calendar.total': 'Tổng cộng',
  'calendar.noRooms': 'Chưa có phòng',

  'form.addRoom': 'Thêm phòng',
  'form.editRoom': 'Sửa phòng',
  'form.roomName': 'Tên phòng',
  'form.roomNumber': 'Số phòng',
  'form.roomPrice': 'Giá phòng',
  'form.addPerson': 'Thêm người',
  'form.editPerson': 'Sửa thông tin người',
  'form.fullName': 'Họ và tên',
  'form.birthday': 'Ngày sinh',
  'confirm.delRoom': 'Xóa phòng {room}? Người ở sẽ bị gỡ khỏi phòng và các chỉ số điện nước sẽ bị xóa.',
  'confirm.delPerson': 'Xóa người này?',
};

const messages: Record<Locale, Record<Key, string>> = { en, vi };
const STORAGE = 'locale';

const detect = (): Locale => {
  try {
    const saved = localStorage.getItem(STORAGE);
    if (saved === 'en' || saved === 'vi') return saved;
  } catch { /* storage unavailable */ }
  return navigator.language.toLowerCase().startsWith('vi') ? 'vi' : 'en';
};

let locale: Locale = detect();

export const getLocale = (): Locale => locale;
/** BCP 47 tag for number and date formatting. */
export const formatLocale = (): string => (locale === 'vi' ? 'vi-VN' : 'en-US');

export function setLocale(l: Locale): void {
  locale = l;
  try { localStorage.setItem(STORAGE, l); } catch { /* ignore */ }
}

export function t(key: Key, params: Record<string, string | number> = {}): string {
  return messages[locale][key].replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? ''));
}

/** Translate static markup: [data-i18n] sets text, [data-i18n-title] sets document.title. */
export function applyStatic(): void {
  document.documentElement.lang = locale;
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n as Key); });
  const title = document.querySelector<HTMLElement>('[data-i18n-title]');
  if (title) document.title = t(title.dataset.i18nTitle as Key);
}

/** Fill a <select> with the available languages and wire it to `onChange`. */
export function bindLanguageSelect(select: HTMLSelectElement, onChange: () => void): void {
  select.innerHTML = LOCALES.map(l => `<option value="${l.code}">${l.label}</option>`).join('');
  select.value = locale;
  select.addEventListener('change', () => {
    setLocale(select.value as Locale);
    applyStatic();
    onChange();
  });
}
