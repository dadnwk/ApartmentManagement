import { applyStatic, bindLanguageSelect, t } from './i18n.js';

const form = document.getElementById('loginForm') as HTMLFormElement;
const err = document.getElementById('error') as HTMLElement;

bindLanguageSelect(document.getElementById('lang') as HTMLSelectElement, () => { err.textContent = ''; });
applyStatic();

form.addEventListener('submit', async e => {
  e.preventDefault();
  err.textContent = '';
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: form.username.value, password: form.password.value }),
  });
  if (res.ok) { location.href = '/'; return; }
  const serverMsg: string | undefined = (await res.json().catch(() => ({}))).error;
  err.textContent = res.status === 401 ? t('login.invalid') : serverMsg ?? t('login.failed');
});
