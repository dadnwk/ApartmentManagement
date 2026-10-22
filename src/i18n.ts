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

  'settings.prices': 'Prices',
  'settings.electricPrice': 'Electric price (per unit)',
  'settings.waterPrice': 'Water price (per unit)',
  'theme.toLight': 'Switch to light mode',
  'theme.toDark': 'Switch to dark mode',

  'rooms.title': 'Rooms',
  'rooms.add': '+ Add room',
  'rooms.empty': 'No rooms yet.',
  'rooms.vacant': 'vacant',
  'persons.title': 'Persons',
  'persons.add': '+ Add person',
  'persons.empty': 'No persons yet.',
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
  'bills.detail': 'Bill details: {room} ({month})',
  'bills.noReadings': 'No readings entered for this month.',

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
  'form.room': 'Room',
  'form.noRoom': '— none —',
  'nav.users': 'Users',
  'users.title': 'Users',
  'users.add': '+ Add user',
  'users.empty': 'No users yet.',
  'col.username': 'Username',
  'col.role': 'Role',
  'col.created': 'Created',
  'col.status': 'Status',
  'role.admin': 'Administrator',
  'role.management': 'Management',
  'role.person': 'Person',
  'form.addUser': 'Add user',
  'form.username': 'Username',
  'form.password': 'Password',
  'form.role': 'Role',
  'status.active': 'Active',
  'status.inactive': 'Inactive',
  'users.activate': 'Activate',
  'users.inactivate': 'Inactivate',
  'form.editUser': 'Edit user',
  'form.linkedPerson': 'Linked person',
  'form.passwordKeep': 'Password (leave empty to keep the current one)',
  'form.noPerson': '— none —',
  'confirm.delUser': 'Delete user {user}?',
  'login.inactive': 'This account is inactive',
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

  'settings.prices': 'Đơn giá',
  'settings.electricPrice': 'Giá điện (mỗi đơn vị)',
  'settings.waterPrice': 'Giá nước (mỗi đơn vị)',
  'theme.toLight': 'Chuyển sang chế độ sáng',
  'theme.toDark': 'Chuyển sang chế độ tối',

  'rooms.title': 'Phòng',
  'rooms.add': '+ Thêm phòng',
  'rooms.empty': 'Chưa có phòng nào.',
  'rooms.vacant': 'trống',
  'persons.title': 'Người ở',
  'persons.add': '+ Thêm người',
  'persons.empty': 'Chưa có người nào.',
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
  'bills.detail': 'Chi tiết hóa đơn: {room} ({month})',
  'bills.noReadings': 'Chưa nhập chỉ số cho tháng này.',

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
  'form.room': 'Phòng',
  'form.noRoom': '— không —',
  'nav.users': 'Người dùng',
  'users.title': 'Người dùng',
  'users.add': '+ Thêm người dùng',
  'users.empty': 'Chưa có người dùng nào.',
  'col.username': 'Tên đăng nhập',
  'col.role': 'Vai trò',
  'col.created': 'Ngày tạo',
  'col.status': 'Trạng thái',
  'role.admin': 'Quản trị viên',
  'role.management': 'Quản lý',
  'role.person': 'Người ở',
  'form.addUser': 'Thêm người dùng',
  'form.username': 'Tên đăng nhập',
  'form.password': 'Mật khẩu',
  'form.role': 'Vai trò',
  'status.active': 'Đang hoạt động',
  'status.inactive': 'Ngừng hoạt động',
  'users.activate': 'Kích hoạt',
  'users.inactivate': 'Ngừng kích hoạt',
  'form.editUser': 'Sửa người dùng',
  'form.linkedPerson': 'Người được liên kết',
  'form.passwordKeep': 'Mật khẩu (để trống nếu giữ nguyên)',
  'form.noPerson': '— không —',
  'confirm.delUser': 'Xóa người dùng {user}?',
  'login.inactive': 'Tài khoản này đã ngừng hoạt động',
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

/** Translate static markup: [data-i18n] sets text, [data-i18n-label] sets the tooltip and aria-label, [data-i18n-title] sets document.title. */
export function applyStatic(): void {
  document.documentElement.lang = locale;
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n as Key); });
  document.querySelectorAll<HTMLElement>('[data-i18n-label]').forEach(el => {
    el.title = t(el.dataset.i18nLabel as Key);
    el.setAttribute('aria-label', el.title);
  });
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
