import { applyStatic, bindLanguageSelect, t } from './i18n.js';
import { applyTheme, bindThemeButton } from './theme.js';
const form = document.getElementById('loginForm');
const err = document.getElementById('error');
bindLanguageSelect(document.getElementById('lang'), () => { err.textContent = ''; });
applyStatic();
applyTheme();
bindThemeButton(document.getElementById('theme'));
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.textContent = '';
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username.value, password: form.password.value }),
    });
    if (res.ok) {
        location.href = '/';
        return;
    }
    const serverMsg = (await res.json().catch(() => ({}))).error;
    err.textContent = res.status === 401 ? t('login.invalid')
        : res.status === 403 ? t('login.inactive')
            : serverMsg ?? t('login.failed');
});
