import { t } from './i18n.js';

type Theme = 'light' | 'dark';
const STORAGE = 'theme';
const prefersDark = () => matchMedia('(prefers-color-scheme: dark)').matches;

function saved(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE);
    if (v === 'light' || v === 'dark') return v;
  } catch { /* storage unavailable */ }
  return null;
}

/** The saved choice, else the device setting. */
const current = (): Theme => saved() ?? (prefersDark() ? 'dark' : 'light');

export function applyTheme(): void {
  const s = saved();
  if (s) document.documentElement.dataset.theme = s;
  else delete document.documentElement.dataset.theme;
}

/** Wire a button that flips between light and dark; the choice is remembered on this device. */
export function bindThemeButton(button: HTMLButtonElement): void {
  const update = () => {
    const dark = current() === 'dark';
    button.textContent = dark ? '☀' : '☾';
    button.title = button.ariaLabel = t(dark ? 'theme.toLight' : 'theme.toDark');
  };
  button.addEventListener('click', () => {
    try { localStorage.setItem(STORAGE, current() === 'dark' ? 'light' : 'dark'); } catch { /* ignore */ }
    applyTheme();
    update();
  });
  update();
}
