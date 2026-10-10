'use strict';
(() => {
  const C = TihoCrypto;
  const root = document.getElementById('root');
  const AV_COLORS = ['#2747E0', '#B5452B', '#2F7D5B', '#7A4FB5', '#9A6A12', '#1F6F86', '#A3366B', '#4A5568'];
  const NAME_COLORS = ['#3D63F0', '#D0573A', '#2E9A6A', '#9068D0', '#B8860B', '#2A93B0', '#C24A86', '#7A8699'];
  const MOBILE = () => matchMedia('(max-width:760px)').matches;
  const COARSE = matchMedia('(pointer:coarse)').matches;

  /* ---------- иконки ---------- */
  const ICONS = {
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    send: '<path d="M12 19V5m-6 6 6-6 6 6"/>',
    attach: '<path d="m21 11-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8L13.2 3.2a3.7 3.7 0 0 1 5.2 5.2L9.8 17a1.8 1.8 0 0 1-2.6-2.6l8-8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    group: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14a6 6 0 0 1 3.5 6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    reply: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v4"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    download: '<path d="M12 4v12m-5-5 5 5 5-5M5 20h14"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    check2: '<path d="m2 12 5 5 9-10"/><path d="m11 16 1 1 9-10"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/><path d="m9 12 2 2 4-4"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21h4"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    key: '<circle cx="15" cy="9" r="5"/><path d="M11.5 12.5 3 21M6 18l3 3M8 16l2 2"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    leave: '<path d="M14 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8"/><path d="m17 16 4-4-4-4M21 12H9"/>',
    warn: '<path d="M12 3 2 21h20Z"/><path d="M12 10v4M12 17h.01"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
    auto: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18Z" fill="currentColor"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    play: '<path d="M7 4v16l13-8Z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>',
    link: '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>',
  };
  function icon(name, size = 22, sw = 2) {
    const t = document.createElement('template');
    t.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
    return t.content.firstChild;
  }

  /* ---------- DOM ---------- */
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    if (props) for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat(Infinity)) if (c != null && c !== false) el.append(c instanceof Node ? c : String(c));
    return el;
  }
  const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };

  let toastTimer;
  function toast(text) {
    const t = document.getElementById('toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
  }

  /* ---------- сеть ---------- */
  async function api(path, opts = {}) {
    const init = { method: opts.method || (opts.body || opts.raw ? 'POST' : 'GET'), credentials: 'same-origin', headers: {} };
    if (opts.raw) { init.body = opts.raw; init.headers['Content-Type'] = 'application/octet-stream'; }
    else if (opts.body) { init.body = JSON.stringify(opts.body); init.headers['Content-Type'] = 'application/json'; }
    const res = await fetch(path, init);
    let data = {};
    try { data = await res.json(); } catch { /* пусто */ }
    if (!res.ok) { const e = new Error(data.error || 'Нет связи с сервером'); e.status = res.status; throw e; }
    return data;
  }

  /* ---------- хранилище настроек ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* приватный режим */ } },
  };
  function applyTheme() {
    const t = store.get('tiho-theme', 'auto');
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
  }

  /* ---------- состояние ---------- */
  const S = {
    me: null, priv: null, pub: null, config: { maxFile: 25 * 1024 * 1024 },
    chats: new Map(), msgs: new Map(), plain: new Map(), userKeys: new Map(),
    active: null, filter: 'all', query: '', people: [], typing: new Map(),
    reply: null, edit: null, uploads: 0, fresh: new Set(), newBelow: 0, unreadMark: null, fileUrls: new Map(), ws: null, wsDelay: 1000, refs: {},
  };

  /* ---------- форматирование ---------- */
  const initials = (name) => {
    const words = (name || '?').trim().split(/\s+/);
    const long = words.filter((w) => w.length > 2);
    return (long.length >= 2 ? long : words).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  };
  const pad = (n) => String(n).padStart(2, '0');
  const hm = (ts) => { const d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
  function dayLabel(ts) {
    const n = Date.now();
    if (sameDay(ts, n)) return 'Сегодня';
    if (sameDay(ts, n - 86400000)) return 'Вчера';
    return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: new Date(ts).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
  }
  function shortTime(ts) {
    if (!ts) return '';
    if (sameDay(ts, Date.now())) return hm(ts);
    if (sameDay(ts, Date.now() - 86400000)) return 'вчера';
    if (Date.now() - ts < 6 * 86400000) return new Date(ts).toLocaleDateString('ru-RU', { weekday: 'short' });
    return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }
  function fileSize(n) {
    if (n < 1024) return n + ' Б';
    if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' КБ';
    return (n / 1048576).toFixed(1).replace('.', ',') + ' МБ';
  }
  function plural(n, a, b, c) {
    const m10 = n % 10, m100 = n % 100;
    return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c;
  }
  function linkify(text) {
    const out = [];
    const re = /\bhttps?:\/\/[^\s<>"]+[^\s<>".,;:!?)\]]/g;
    let last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) out.push(text.slice(last, m.index));
      out.push(h('a', { href: m[0], target: '_blank', rel: 'noopener noreferrer', text: m[0] }));
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  }

  /* ---------- чаты: помощники ---------- */
  const other = (chat) => chat.members.find((m) => m.id !== S.me.id) || chat.members[0];
  const chatTitle = (chat) => chat.type === 'group' ? chat.title : (other(chat)?.displayName || 'Чат');
  function avatar(chat, size = 52) {
    if (chat.type === 'group') {
      return h('div', { class: 'av', style: `width:${size}px;height:${size}px;font-size:${Math.round(size * .35)}px;border-radius:${Math.round(size * .32)}px;background:${AV_COLORS[chat.id % 8]}` }, initials(chat.title));
    }
    return userAvatar(other(chat), size, true);
  }
  function userAvatar(u, size = 42, dot = false) {
    return h('div', { class: 'av', style: `width:${size}px;height:${size}px;font-size:${Math.round(size * .36)}px;background:${AV_COLORS[(u?.color || 0) % 8]}` },
      initials(u?.displayName), dot && u?.online ? h('span', { class: 'dot' }) : null);
  }
  const lastTs = (c) => c.lastMessage?.createdAt || c.createdAt;
  const memberOf = (chat, id) => chat.members.find((m) => m.id === id);

  async function senderKey(chat, userId) {
    const m = memberOf(chat, userId);
    if (m) return m.publicKey;
    if (!S.userKeys.has(userId)) S.userKeys.set(userId, api('/api/users/' + userId).then((r) => r.user.publicKey).catch(() => null));
    return S.userKeys.get(userId);
  }

  function cleanPayload(p) {
    if (!p || typeof p !== 'object') throw new Error('bad');
    const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
    const reply = p.reply && typeof p.reply === 'object'
      ? { id: Number(p.reply.id) || 0, name: str(p.reply.name, 80), text: str(p.reply.text, 200) } : null;
    if (p.t === 'text') return { t: 'text', text: str(p.text, 20000), reply };
    if (p.t === 'file') {
      return { t: 'file', fileId: str(p.fileId, 32), name: str(p.name, 200) || 'файл', size: Number(p.size) || 0,
        mime: str(p.mime, 100), key: str(p.key, 64), iv: str(p.iv, 32), w: Number(p.w) || 0, h: Number(p.h) || 0,
        caption: str(p.caption, 4000), reply,
        dur: Math.max(0, Math.min(600, Number(p.dur) || 0)),
        wave: Array.isArray(p.wave) ? p.wave.slice(0, 64).map((v) => Math.max(0, Math.min(1, Number(v) || 0))) : null };
    }
    throw new Error('bad');
  }

  async function decryptMsg(msg, chat) {
    if (msg.kind === 'system') return { t: 'system', text: String(msg.body?.text || '') };
    if (msg.kind === 'deleted') return { t: 'deleted' };
    if (msg.payload) return msg.payload;
    if (S.plain.has(msg.id)) return S.plain.get(msg.id);
    let p;
    try {
      const pk = await senderKey(chat, msg.senderId);
      if (!pk) throw new Error('nokey');
      p = cleanPayload(await C.decryptMessage(msg.body, {
        chatId: chat.id, senderId: msg.senderId, senderPublicKey: pk, myId: S.me.id, myPriv: S.priv }));
    } catch (e) {
      p = { t: 'error', reason: e.message === 'no-key' ? 'before' : 'fail' };
    }
    S.plain.set(msg.id, p);
    return p;
  }
  const plainOf = (msg) => msg.kind === 'deleted' ? { t: 'deleted' } : (S.plain.get(msg.id) || msg.payload || (msg.kind === 'system' ? { t: 'system', text: msg.body?.text || '' } : undefined));
  function previewOf(p) {
    if (!p) return '…';
    if (p.t === 'text') return p.text.replace(/\s+/g, ' ');
    if (p.t === 'file') return (p.mime.startsWith('image/') ? 'Фото' : p.mime.startsWith('audio/') && p.wave ? 'Голосовое сообщение' : 'Файл: ' + p.name) + (p.caption ? ' · ' + p.caption : '');
    if (p.t === 'system') return p.text;
    if (p.t === 'deleted') return 'Сообщение удалено';
    return p.reason === 'before' ? 'Сообщение до вашего вступления' : 'Не удалось расшифровать';
  }

  /* Проверка ключей собеседников: предупреждаем, если ключ вдруг сменился */
  const knownKey = () => 'tiho-keys-' + S.me.id;
  const verifiedKey = () => 'tiho-verified-' + S.me.id;
  function checkKeys(chat) {
    const known = store.get(knownKey(), {});
    let changed = false;
    for (const m of chat.members) {
      if (m.id === S.me.id) continue;
      if (!known[m.id]) { known[m.id] = m.publicKey; changed = true; }
    }
    if (changed) store.set(knownKey(), known);
  }
  function keyChanged(member) {
    const known = store.get(knownKey(), {});
    return known[member.id] && known[member.id] !== member.publicKey;
  }
  function acceptKey(member) {
    const known = store.get(knownKey(), {});
    known[member.id] = member.publicKey;
    store.set(knownKey(), known);
  }
  function isVerified(member) {
    return store.get(verifiedKey(), {})[member.id] === member.publicKey;
  }

  /* ================= ВХОД ================= */
  const FEATURES = [
    ['lock', 'Сквозное шифрование', 'Сообщения и файлы шифруются на вашем устройстве'],
    ['shield', 'Двухфакторный вход', 'Код из Google Authenticator защитит аккаунт'],
    ['group', 'Чаты и группы', 'Фото, файлы, ответы и отметки о прочтении'],
  ];
  function authShell(...content) {
    clear(root);
    const hero = h('section', { class: 'auth-hero', 'aria-hidden': 'true' },
      h('div', { class: 'brand light' }, h('div', { class: 'logo' }, icon('lock', 22)), h('h1', null, 'Тихо')),
      h('p', { class: 'hero-title' }, 'Переписка, которую читаете только вы'),
      h('ul', { class: 'hero-list' }, FEATURES.map(([ic, t, d]) =>
        h('li', null, h('span', { class: 'hero-ic' }, icon(ic, 20)), h('span', null, h('b', null, t), h('small', null, d))))),
      h('div', { class: 'hero-bubbles' },
        h('div', { class: 'hb in' }, 'Привет! Это правда никто не прочитает?'),
        h('div', { class: 'hb out' }, 'Даже сервер видит только шифр'),
        h('div', { class: 'hb in short' }, h('span', { class: 'dots' }, h('i'), h('i'), h('i')))));
    root.append(h('div', { class: 'auth' }, hero,
      h('section', { class: 'auth-main' }, h('div', { class: 'auth-card' },
        h('div', { class: 'brand mobile-only' }, h('div', { class: 'logo' }, icon('lock', 22)), h('h1', null, 'Тихо')),
        ...content))));
  }
  function passwordField(attrs) {
    const input = h('input', { class: 'input', type: 'password', required: true, ...attrs });
    const eye = h('button', { type: 'button', class: 'eye', 'aria-label': 'Показать пароль', onclick: () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      eye.setAttribute('aria-label', show ? 'Скрыть пароль' : 'Показать пароль');
      eye.classList.toggle('on', show);
    } }, icon('eye', 20, 1.8));
    return { input, el: h('div', { class: 'pw-wrap' }, input, eye) };
  }
  function strength(pw) {
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[A-ZА-Я]/.test(pw) && /[a-zа-я]/.test(pw)) s++;
    if (/\d/.test(pw) && /[^A-Za-zА-Яа-я0-9]/.test(pw)) s++;
    return Math.min(s, 4);
  }

  function renderAuth(mode = 'login', error = '') {
    const err = h('div', { class: 'err', role: 'alert' }, error);
    const label = mode === 'login' ? 'Войти' : 'Создать аккаунт';
    const submit = h('button', { class: 'btn block big', type: 'submit' }, label);
    const username = h('input', { class: 'input', name: 'username', autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false', required: true, placeholder: 'например, anna_s' });
    const pw = passwordField({ name: 'password', autocomplete: mode === 'login' ? 'current-password' : 'new-password' });
    const pw2 = passwordField({ autocomplete: 'new-password' });
    const meter = h('div', { class: 'meter', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i'));
    const meterText = h('small', { class: 'muted meter-text' });
    if (mode === 'register') {
      pw.input.addEventListener('input', () => {
        const s = pw.input.value ? strength(pw.input.value) : 0;
        meter.dataset.s = s;
        meterText.textContent = pw.input.value ? ['Слишком короткий', 'Слабый', 'Неплохой', 'Хороший', 'Отличный'][s] : '';
      });
    }
    const busy = (on, text) => { submit.disabled = on; clear(submit).append(on ? h('span', { class: 'spin sm' }) : '', text); };

    const form = h('form', { novalidate: true, onsubmit: async (e) => {
      e.preventDefault();
      err.textContent = '';
      const u = username.value.trim().replace(/^@/, '');
      const password = pw.input.value;
      if (!u || !password) { err.textContent = 'Введите логин и пароль'; return; }
      if (mode === 'register') {
        if (!/^[a-zA-Z0-9_]{3,32}$/.test(u)) { err.textContent = 'Логин: 3–32 символа, латиница, цифры и _'; return; }
        if (password.length < 8) { err.textContent = 'Пароль — минимум 8 символов'; return; }
        if (password !== pw2.input.value) { err.textContent = 'Пароли не совпадают'; return; }
      }
      busy(true, 'Готовлю ключи шифрования…');
      try {
        const { auth, kek } = await C.fromPassword(u, password);
        if (mode === 'register') {
          const id = await C.createIdentity(kek);
          const r = await api('/api/register', { body: { username: u, displayName: u, auth, publicKey: id.publicKey, keyBackup: id.backup } });
          await C.saveKey(r.user.id, id.privateKey, id.publicKey);
          Object.assign(S, { me: r.user, priv: id.privateKey, pub: id.publicKey });
          startApp();
        } else {
          const r = await api('/api/login', { body: { username: u, auth } });
          if (r.need2fa) return renderTwoFactor(r.ticket, u, kek);
          await finishLogin(r, kek);
        }
      } catch (e2) {
        err.textContent = e2.status ? e2.message : 'Не удалось: ' + (e2.message || 'ошибка');
        busy(false, label);
      }
    } },
    h('label', { class: 'field-label' }, 'Логин', username),
    h('label', { class: 'field-label' }, 'Пароль', pw.el),
    mode === 'register' && h('div', { class: 'meter-row' }, meter, meterText),
    mode === 'register' && h('label', { class: 'field-label' }, 'Повторите пароль', pw2.el),
    mode === 'register' && h('div', { class: 'note' }, icon('key', 18), h('span', null,
      'Запомните пароль: восстановить его нельзя, без него старые сообщения не прочитать.')),
    err, submit);

    const gErr = h('div', { class: 'err', role: 'alert', style: 'min-height:0' });
    const google = S.config.googleClientId ? [
      h('div', { class: 'or' }, h('span', null, 'или')),
      googleButton((cred) => onGoogleSignIn(cred, gErr), mode === 'login' ? 'signin_with' : 'signup_with'),
      gErr,
    ] : [];
    authShell(
      h('h2', { class: 'auth-title' }, mode === 'login' ? 'С возвращением' : 'Создайте аккаунт'),
      h('p', { class: 'auth-sub' }, mode === 'login' ? 'Войдите, чтобы продолжить переписку' : 'Нужны только логин и пароль'),
      h('div', { class: 'seg', role: 'group', 'aria-label': 'Режим' },
        h('button', { type: 'button', 'aria-pressed': String(mode === 'login'), onclick: () => renderAuth('login') }, 'Вход'),
        h('button', { type: 'button', 'aria-pressed': String(mode === 'register'), onclick: () => renderAuth('register') }, 'Регистрация')),
      form, ...google);
    username.focus();
  }

  async function finishLogin(r, kek) {
    S.me = r.user;
    if (!kek) {
      /* Вход через Google: ключ берём с устройства, а если его нет — просим пароль шифрования */
      const saved = await C.loadKey(r.user.id).catch(() => null);
      if (saved && saved.publicKey === r.publicKey) { Object.assign(S, { priv: saved.privateKey, pub: saved.publicKey }); return startApp(); }
      return renderUnlock(r.keyBackup, r.publicKey, true);
    }
    const priv = await C.unlockIdentity(r.keyBackup, kek);
    await C.saveKey(r.user.id, priv, r.publicKey);
    Object.assign(S, { me: r.user, priv, pub: r.publicKey });
    startApp();
  }

  /* ---------- Google ---------- */
  let gsiPromise = null;
  function loadGsi() {
    if (window.google?.accounts?.id) return Promise.resolve(window.google);
    if (!gsiPromise) {
      gsiPromise = new Promise((resolve, reject) => {
        const sc = document.createElement('script');
        sc.src = 'https://accounts.google.com/gsi/client';
        sc.async = true;
        sc.onload = () => (window.google?.accounts?.id ? resolve(window.google) : reject(new Error('gsi')));
        sc.onerror = () => { gsiPromise = null; reject(new Error('Не удалось загрузить вход Google')); };
        document.head.append(sc);
      });
    }
    return gsiPromise;
  }
  const isDark = () => document.documentElement.dataset.theme === 'dark' ||
    (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  function googleButton(onCredential, text = 'continue_with') {
    const box = h('div', { class: 'gbtn' }, h('span', { class: 'muted', style: 'font-size:13px' }, 'Загружаю вход через Google…'));
    loadGsi().then((g) => {
      g.accounts.id.initialize({
        client_id: S.config.googleClientId,
        callback: (resp) => onCredential(resp.credential),
        ux_mode: 'popup', auto_select: false, cancel_on_tap_outside: true, itp_support: true,
      });
      clear(box);
      g.accounts.id.renderButton(box, {
        type: 'standard', theme: isDark() ? 'filled_black' : 'outline', size: 'large', shape: 'pill',
        text, logo_alignment: 'center', locale: 'ru', width: Math.min(400, Math.max(240, box.clientWidth || 320)),
      });
    }).catch((e) => { clear(box).append(h('span', { class: 'err' }, e.message)); });
    return box;
  }
  async function onGoogleSignIn(credential, err) {
    try {
      const r = await api('/api/google', { body: { credential } });
      if (r.need2fa) return renderTwoFactor(r.ticket, 'Google', null);
      if (r.needSignup) return renderGoogleSignup(r);
      await finishLogin(r, null);
    } catch (e) { if (err) err.textContent = e.message; else toast(e.message); }
  }

  /* Регистрация через Google: логин и пароль шифрования (нужен для переписки на новых устройствах) */
  function renderGoogleSignup(g) {
    const err = h('div', { class: 'err', role: 'alert' });
    const username = h('input', { class: 'input', value: g.username, autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false', required: true });
    const pw = passwordField({ autocomplete: 'new-password' });
    const pw2 = passwordField({ autocomplete: 'new-password' });
    const btn = h('button', { class: 'btn block big', type: 'submit' }, 'Готово');
    authShell(
      h('div', { class: 'g-chip' }, h('span', { class: 'g-logo', 'aria-hidden': 'true' }, 'G'), h('span', null, g.email || 'Google-аккаунт')),
      h('h2', { class: 'auth-title' }, g.name ? `Почти готово, ${g.name.split(' ')[0]}` : 'Почти готово'),
      h('p', { class: 'auth-sub' }, 'Выберите логин, по которому вас найдут, и придумайте пароль шифрования.'),
      h('form', { novalidate: true, onsubmit: async (e) => {
        e.preventDefault();
        err.textContent = '';
        const u = username.value.trim().replace(/^@/, '');
        if (!/^[a-zA-Z0-9_]{3,32}$/.test(u)) { err.textContent = 'Логин: 3–32 символа, латиница, цифры и _'; return; }
        if (pw.input.value.length < 8) { err.textContent = 'Пароль шифрования — минимум 8 символов'; return; }
        if (pw.input.value !== pw2.input.value) { err.textContent = 'Пароли не совпадают'; return; }
        btn.disabled = true; btn.textContent = 'Готовлю ключи шифрования…';
        try {
          const { auth, kek } = await C.fromPassword(u, pw.input.value);
          const id = await C.createIdentity(kek);
          const r = await api('/api/register', { body: { username: u, displayName: g.name || u, auth, publicKey: id.publicKey, keyBackup: id.backup, googleTicket: g.ticket } });
          await C.saveKey(r.user.id, id.privateKey, id.publicKey);
          Object.assign(S, { me: r.user, priv: id.privateKey, pub: id.publicKey });
          startApp();
        } catch (e2) {
          err.textContent = e2.message; btn.disabled = false; btn.textContent = 'Готово';
          if (e2.status === 401) setTimeout(() => renderAuth('register', e2.message), 1500);
        }
      } },
      h('label', { class: 'field-label' }, 'Логин', username),
      h('label', { class: 'field-label' }, 'Пароль шифрования', pw.el),
      h('label', { class: 'field-label' }, 'Повторите пароль', pw2.el),
      h('div', { class: 'note' }, icon('key', 18), h('span', null,
        'Входить вы будете через Google. Пароль шифрования понадобится один раз на каждом новом устройстве, чтобы открыть переписку. Восстановить его нельзя.')),
      err, btn),
      h('div', { class: 'auth-links' }, h('button', { type: 'button', class: 'link', onclick: () => renderAuth('login') }, 'Отмена')));
    username.focus();
  }

  /* Второй шаг входа: код из Google Authenticator или резервный код */
  function renderTwoFactor(ticket, username, kek, backup = false) {
    const err = h('div', { class: 'err', role: 'alert' });
    const code = h('input', backup
      ? { class: 'input code-input', autocomplete: 'off', autocapitalize: 'none', placeholder: 'xxxxx-xxxxx', maxlength: 11, 'aria-label': 'Резервный код' }
      : { class: 'input code-input', inputmode: 'numeric', autocomplete: 'one-time-code', placeholder: '000000', maxlength: 7, 'aria-label': 'Код из приложения' });
    const btn = h('button', { class: 'btn block big', type: 'submit' }, 'Подтвердить');
    let sending = false;
    const send = async () => {
      if (sending) return;
      sending = true; btn.disabled = true; err.textContent = '';
      try {
        const r = await api('/api/login/2fa', { body: { ticket, code: code.value } });
        await finishLogin(r, kek);
      } catch (e) {
        err.textContent = e.message;
        sending = false; btn.disabled = false;
        code.select();
        if (/заново|истекло/.test(e.message)) setTimeout(() => renderAuth('login', e.message), 1200);
      }
    };
    if (!backup) code.addEventListener('input', () => {
      code.value = code.value.replace(/\D/g, '').slice(0, 6);
      if (code.value.length === 6) send();
    });
    authShell(
      h('div', { class: 'tfa-badge' }, icon('shield', 30)),
      h('h2', { class: 'auth-title' }, 'Подтвердите вход'),
      h('p', { class: 'auth-sub' }, backup
        ? 'Введите один из резервных кодов, которые вы сохранили при включении защиты. Каждый код работает один раз.'
        : `Откройте Google Authenticator и введите 6-значный код для «Тихо» (${username}).`),
      h('form', { onsubmit: (e) => { e.preventDefault(); send(); } }, code, err, btn),
      h('div', { class: 'auth-links' },
        h('button', { type: 'button', class: 'link', onclick: () => renderTwoFactor(ticket, username, kek, !backup) },
          backup ? 'Ввести код из приложения' : 'Нет доступа к телефону? Резервный код'),
        h('button', { type: 'button', class: 'link', onclick: () => renderAuth('login') }, 'Назад')));
    code.focus();
  }

  /* Сессия есть, но ключа на этом устройстве нет — расшифровываем копию паролем */
  function renderUnlock(backup, publicKey, viaGoogle = false) {
    const err = h('div', { class: 'err', role: 'alert' });
    const pw = passwordField({ autocomplete: 'current-password' });
    const btn = h('button', { class: 'btn block big', type: 'submit' }, 'Разблокировать');
    authShell(
      h('div', { class: 'tfa-badge' }, icon('key', 30)),
      h('h2', { class: 'auth-title' }, `Здравствуйте, ${S.me.displayName}`),
      h('p', { class: 'auth-sub' }, viaGoogle
        ? 'Вы вошли через Google. Введите пароль шифрования, чтобы открыть переписку на этом устройстве.'
        : 'Введите пароль, чтобы расшифровать ключи на этом устройстве.'),
      h('form', { onsubmit: async (e) => {
        e.preventDefault();
        btn.disabled = true; btn.textContent = 'Проверяю…'; err.textContent = '';
        try {
          const { kek } = await C.fromPassword(S.me.username, pw.input.value);
          const priv = await C.unlockIdentity(backup, kek);
          await C.saveKey(S.me.id, priv, publicKey);
          Object.assign(S, { priv, pub: publicKey });
          startApp();
        } catch {
          err.textContent = 'Неверный пароль';
          btn.disabled = false; btn.textContent = 'Разблокировать';
        }
      } }, h('label', { class: 'field-label' }, viaGoogle ? 'Пароль шифрования' : 'Пароль', pw.el), err, btn),
      h('div', { class: 'auth-links' }, h('button', { type: 'button', class: 'link', onclick: logout }, 'Войти в другой аккаунт')));
    pw.input.focus();
  }

  async function logout() {
    try { await api('/api/logout', { method: 'POST' }); } catch { /* всё равно выходим */ }
    await C.clearKeys();
    location.href = '/';
  }

  /* ================= ПРИЛОЖЕНИЕ ================= */
  function startApp() {
    clear(root);
    const list = h('ul', { class: 'chat-list', 'aria-label': 'Чаты' });
    const searchInput = h('input', { type: 'search', placeholder: 'Поиск чатов и людей', 'aria-label': 'Поиск', oninput: onSearch });
    const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Фильтр' },
      [['all', 'Все'], ['direct', 'Личные'], ['group', 'Группы'], ['unread', 'Непрочитанные']].map(([k, label]) =>
        h('button', { class: 'chip', 'data-k': k, 'aria-pressed': String(S.filter === k), onclick: () => {
          S.filter = k;
          chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.k === k)));
          renderList();
        } }, label)));
    const meBtn = h('button', { class: 'me-btn', onclick: openSettings });
    const side = h('aside', { class: 'side' },
      h('div', { class: 'side-head' },
        h('div', { style: 'display:flex;align-items:center;justify-content:space-between' },
          h('div', { class: 'brand' }, h('div', { class: 'logo' }, icon('lock', 20)), h('h1', null, 'Тихо')),
          h('button', { class: 'icon-btn', 'aria-label': 'Новая группа', title: 'Новая группа', onclick: () => openPicker('group') }, icon('group', 22, 1.8))),
        h('label', { class: 'search' }, icon('search', 18), searchInput),
        chips),
      list,
      h('div', { class: 'side-foot' }, meBtn,
        h('button', { class: 'fab', 'aria-label': 'Новый чат', title: 'Новый чат', onclick: () => openPicker('direct') }, icon('edit', 22))));
    const pane = h('main', { class: 'pane' });
    const app = h('div', { class: 'app' }, side, pane);
    root.append(app);
    S.refs = { app, list, pane, meBtn, searchInput };
    renderMe();
    renderList();
    renderPane();
    loadChats();
    connect();
  }

  function renderMe() {
    const b = clear(S.refs.meBtn);
    b.append(userAvatar({ ...S.me, online: false }, 40),
      h('span', { style: 'min-width:0' }, h('b', null, S.me.displayName), h('small', null, '@' + S.me.username)));
  }

  async function loadChats() {
    try {
      const { chats } = await api('/api/chats');
      const prev = S.chats;
      S.chats = new Map(chats.map((c) => [c.id, c]));
      for (const c of chats) checkKeys(c);
      await Promise.all(chats.filter((c) => c.lastMessage).map((c) => decryptMsg(c.lastMessage, c)));
      if (S.active && !S.chats.has(S.active)) closeChat();
      renderList();
      if (S.active) { renderHead(); if (prev.size) refreshActive(); }
      updateTitle();
    } catch (e) {
      if (e.status === 401) return location.reload();
      toast(e.message);
    }
  }

  /* ---------- список ---------- */
  let searchTimer;
  function onSearch(e) {
    S.query = e.target.value.trim();
    renderList();
    clearTimeout(searchTimer);
    const qv = S.query.replace(/^@/, '');
    if (qv.length < 2) { S.people = []; return; }
    searchTimer = setTimeout(async () => {
      try {
        const { users } = await api('/api/users/search?q=' + encodeURIComponent(qv));
        if (S.query.replace(/^@/, '') === qv) { S.people = users; renderList(); }
      } catch { /* молча */ }
    }, 250);
  }

  const dots = () => h('span', { class: 'tdots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'));
  function typingText(chatId) {
    const t = S.typing.get(chatId);
    if (!t || !t.size) return '';
    const chat = S.chats.get(chatId);
    const names = [...t.keys()].map((id) => memberOf(chat, id)?.displayName?.split(' ')[0]).filter(Boolean);
    if (chat.type === 'direct') return 'печатает…';
    return names.length === 1 ? `${names[0]} печатает…` : 'несколько человек печатают…';
  }

  function renderList() {
    const list = S.refs.list;
    if (!list) return;
    clear(list);
    const qv = S.query.toLowerCase();
    let chats = [...S.chats.values()].sort((a, b) => lastTs(b) - lastTs(a));
    if (S.filter === 'direct' || S.filter === 'group') chats = chats.filter((c) => c.type === S.filter);
    if (S.filter === 'unread') chats = chats.filter((c) => c.unread > 0);
    if (qv) chats = chats.filter((c) => chatTitle(c).toLowerCase().includes(qv) ||
      (c.type === 'direct' && other(c)?.username.toLowerCase().includes(qv.replace(/^@/, ''))));

    if (qv && chats.length) list.append(h('li', { class: 'list-label' }, 'Чаты'));
    for (const c of chats) {
      const lm = c.lastMessage;
      const p = lm ? plainOf(lm) : null;
      const ty = typingText(c.id);
      let prev = lm ? previewOf(p) : 'Нет сообщений';
      if (lm && lm.kind === 'msg') {
        if (lm.senderId === S.me.id) prev = 'Вы: ' + prev;
        else if (c.type === 'group') prev = (memberOf(c, lm.senderId)?.displayName.split(' ')[0] || '…') + ': ' + prev;
      }
      list.append(h('li', null, h('button', {
        class: 'chat-item', 'aria-current': String(S.active === c.id), onclick: () => openChat(c.id) },
      avatar(c, 52),
      h('div', { class: 'ci-body' },
        h('div', { class: 'ci-row' },
          c.type === 'group' ? h('span', { class: 'muted', title: 'Группа' }, icon('group', 15)) : null,
          h('span', { class: 'ci-name' }, chatTitle(c)),
          h('span', { class: 'ci-time' + (c.unread ? ' hot' : '') }, shortTime(lastTs(c)))),
        h('div', { class: 'ci-row' },
          ty ? h('span', { class: 'ci-prev typing' }, dots(), ty) : h('span', { class: 'ci-prev' }, prev),
          c.unread ? h('span', { class: 'badge', 'aria-label': `${c.unread} непрочитанных` }, c.unread > 99 ? '99+' : c.unread) : null)))));
    }
    if (qv && S.people.length) {
      const directIds = new Set([...S.chats.values()].filter((c) => c.type === 'direct').map((c) => other(c)?.id));
      const fresh = S.people.filter((u) => !directIds.has(u.id) || !chats.some((c) => c.type === 'direct' && other(c)?.id === u.id));
      if (fresh.length) {
        list.append(h('li', { class: 'list-label' }, 'Люди'));
        for (const u of fresh) {
          list.append(h('li', null, h('button', { class: 'chat-item', onclick: () => openDirect(u.id) },
            userAvatar(u, 52),
            h('div', { class: 'ci-body' }, h('span', { class: 'ci-name' }, u.displayName), h('span', { class: 'ci-prev' }, '@' + u.username)))));
        }
      }
    }
    if (!list.children.length) {
      list.append(h('li', { class: 'list-empty' }, qv
        ? (qv.length < 2 ? 'Введите ещё символ' : 'Ничего не найдено. Ищите людей по логину.')
        : 'Здесь пока пусто. Нажмите карандаш внизу, найдите собеседника по логину и напишите первым.'));
    }
  }

  function updateTitle() {
    const n = [...S.chats.values()].reduce((s, c) => s + (c.unread || 0), 0);
    document.title = n ? `(${n}) Тихо` : 'Тихо';
  }

  async function openDirect(userId) {
    try {
      const { chat } = await api('/api/chats/direct', { body: { userId } });
      S.chats.set(chat.id, chat);
      checkKeys(chat);
      S.query = ''; S.people = [];
      if (S.refs.searchInput) S.refs.searchInput.value = '';
      openChat(chat.id);
    } catch (e) { toast(e.message); }
  }

  /* ---------- открытый чат ---------- */
  function openChat(id) {
    const wasOpen = S.active != null;
    S.active = id;
    S.reply = null;
    S.newBelow = 0;
    const ch = S.chats.get(id);
    S.unreadMark = ch && ch.unread ? { chatId: id, after: ch.lastReadId || 0, scrolled: false } : null;
    S.refs.app.classList.add('in-chat');
    if (MOBILE() && !wasOpen) history.pushState({ chat: id }, '');
    renderList();
    renderPane();
    const box = S.msgs.get(id);
    if (!box) loadMessages(id); else markRead();
  }
  function closeChat() {
    S.active = null;
    S.refs.app?.classList.remove('in-chat');
    renderList();
    renderPane();
  }
  window.addEventListener('popstate', () => { if (S.active != null && MOBILE()) closeChat(); });

  async function loadMessages(chatId, older = false) {
    const chat = S.chats.get(chatId);
    if (!chat) return;
    const box = S.msgs.get(chatId) || { list: [], hasMore: true, loading: false };
    if (box.loading) return;
    box.loading = true;
    S.msgs.set(chatId, box);
    try {
      const before = older && box.list.length ? box.list.find((m) => typeof m.id === 'number')?.id : '';
      const { messages } = await api(`/api/chats/${chatId}/messages?limit=50${before ? '&before=' + before : ''}`);
      await Promise.all(messages.map((m) => decryptMsg(m, chat)));
      const have = new Set(box.list.map((m) => m.id));
      const fresh = messages.filter((m) => !have.has(m.id));
      box.list = older ? fresh.concat(box.list) : mergeList(box.list, fresh);
      box.hasMore = messages.length === 50;
    } catch (e) { toast(e.message); }
    box.loading = false;
    if (S.active === chatId) { renderMessages(older ? 'keep' : 'bottom'); markRead(); }
  }
  function mergeList(list, fresh) {
    const all = list.concat(fresh);
    return all.sort((a, b) => {
      const ai = typeof a.id === 'number' ? a.id : Infinity, bi = typeof b.id === 'number' ? b.id : Infinity;
      return ai - bi;
    });
  }
  async function refreshActive() {
    const id = S.active;
    if (!id || !S.msgs.has(id)) return;
    await loadMessages(id);
  }

  function markRead() {
    const chat = S.chats.get(S.active);
    if (!chat || document.hidden) return;
    const box = S.msgs.get(chat.id);
    const last = box?.list.filter((m) => typeof m.id === 'number').pop();
    if (!last) return;
    if (last.id > (chat.lastReadId || 0) || chat.unread) {
      chat.lastReadId = last.id;
      chat.unread = 0;
      api(`/api/chats/${chat.id}/read`, { body: { messageId: last.id } }).catch(() => {});
      renderList();
      updateTitle();
    }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) markRead(); });

  function statusLine(chat) {
    const ty = typingText(chat.id);
    if (ty) return { text: ty, cls: 'typing' };
    if (chat.type === 'direct') {
      const o = other(chat);
      return o?.online ? { text: 'в сети', cls: 'on' } : { text: '@' + (o?.username || ''), cls: '' };
    }
    const n = chat.members.length;
    const on = chat.members.filter((m) => m.online && m.id !== S.me.id).length;
    return { text: `${n} ${plural(n, 'участник', 'участника', 'участников')}${on ? `, ${on} в сети` : ''}`, cls: '' };
  }

  function renderPane() {
    const pane = clear(S.refs.pane);
    const chat = S.chats.get(S.active);
    if (!chat) {
      pane.append(h('div', { class: 'empty-pane' },
        h('div', { class: 'logo', style: 'width:64px;height:64px;border-radius:20px' }, icon('lock', 30)),
        h('b', { style: 'font-size:18px;color:var(--text)' }, 'Выберите чат'),
        h('span', null, 'Все сообщения защищены сквозным шифрованием')));
      S.refs.msgs = null;
      return;
    }
    const head = h('header', { class: 'chat-head' });
    const keyWarnBox = h('div');
    const msgs = h('div', { class: 'msgs', onscroll: onMsgsScroll });
    const inner = h('div', { class: 'msgs-inner' });
    msgs.append(inner);
    const typingRow = h('div', { class: 'typing-row', 'aria-live': 'polite' });
    const downBadge = h('span', { class: 'badge' });
    const down = h('button', { class: 'to-bottom', 'aria-label': 'К последним сообщениям', onclick: () => {
      msgs.scrollTo({ top: msgs.scrollHeight, behavior: 'smooth' });
    } }, icon('down', 24), downBadge);
    const composer = buildComposer(chat);
    pane.append(head, keyWarnBox, h('div', { class: 'msgs-wrap' }, msgs, down), composer.el);
    Object.assign(S.refs, { head, keyWarnBox, msgs, inner, typingRow, composer, down, downBadge });
    pane.style.position = 'relative';
    setupDrop(pane);
    renderHead();
    renderMessages('bottom');
    if (!COARSE) composer.input.focus();
  }

  function renderHead() {
    const chat = S.chats.get(S.active);
    const head = S.refs.head;
    if (!chat || !head) return;
    clear(head);
    const st = statusLine(chat);
    head.append(
      h('button', { class: 'icon-btn back', 'aria-label': 'Назад к чатам', onclick: () => (history.state?.chat ? history.back() : closeChat()) }, icon('back', 24)),
      avatar(chat, 42),
      h('button', { class: 'head-title', onclick: () => openInfo(chat.id) },
        h('b', null, chatTitle(chat)), h('small', { class: st.cls }, st.cls === 'typing' ? dots() : null, st.text)),
      h('button', { class: 'icon-btn', 'aria-label': 'О чате и шифровании', title: 'О чате и шифровании', onclick: () => openInfo(chat.id) }, icon('info', 22, 1.8)));
    const warn = clear(S.refs.keyWarnBox);
    const changed = chat.members.filter((m) => m.id !== S.me.id && keyChanged(m));
    if (changed.length) {
      warn.append(h('div', { class: 'key-warn', role: 'alert' }, icon('warn', 20),
        h('span', { style: 'flex:1' }, `Ключ шифрования изменился у: ${changed.map((m) => m.displayName).join(', ')}. Сверьте код безопасности, прежде чем писать что-то важное.`),
        h('button', { class: 'btn ghost', style: 'height:36px;padding:0 12px;font-size:13px', onclick: () => openInfo(chat.id) }, 'Проверить')));
    }
  }

  function updateDown() {
    const { msgs, down, downBadge } = S.refs;
    if (!msgs || !down) return;
    const far = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight > 240;
    if (!far) S.newBelow = 0;
    down.classList.toggle('show', far);
    downBadge.textContent = S.newBelow > 99 ? '99+' : S.newBelow;
    downBadge.style.display = S.newBelow ? '' : 'none';
  }
  function onMsgsScroll() {
    updateDown();
    const m = S.refs.msgs;
    const box = S.msgs.get(S.active);
    if (m && m.scrollTop < 80 && box?.hasMore && !box.loading && box.list.length >= 50) loadMessages(S.active, true);
  }

  function renderMessages(scroll) {
    const chat = S.chats.get(S.active);
    const { msgs, inner, typingRow } = S.refs;
    if (!chat || !inner) return;
    const atBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 120;
    const prevH = msgs.scrollHeight, prevTop = msgs.scrollTop;
    clear(inner);
    const box = S.msgs.get(chat.id);
    inner.append(h('button', { class: 'e2e', onclick: () => openInfo(chat.id) }, icon('lock', 16),
      'Сообщения защищены сквозным шифрованием. Нажмите, чтобы проверить ключ.'));
    if (!box || (box.loading && !box.list.length)) {
      inner.append(h('div', { style: 'align-self:center;padding:24px' }, h('div', { class: 'spin' })));
    } else {
      if (box.hasMore && box.list.length >= 50) {
        inner.append(h('button', { class: 'btn ghost load-more', style: 'height:34px;font-size:13px', onclick: () => loadMessages(chat.id, true) }, box.loading ? 'Загружаю…' : 'Показать раньше'));
      }
      if (!box.list.length) inner.append(h('div', { class: 'sys' }, 'Напишите первое сообщение — его увидите только вы и собеседник'));
      let prev = null;
      const mark = S.unreadMark && S.unreadMark.chatId === chat.id ? S.unreadMark : null;
      const firstNew = mark ? box.list.find((m) => typeof m.id === 'number' && m.id > mark.after && m.kind === 'msg' && m.senderId !== S.me.id) : null;
      box.list.forEach((m, i) => {
        if (!prev || !sameDay(prev.createdAt, m.createdAt)) inner.append(h('div', { class: 'day' }, h('span', null, dayLabel(m.createdAt))));
        if (firstNew && m === firstNew) inner.append(h('div', { class: 'new-divider', id: 'new-divider' }, h('span', null, 'Новые сообщения')));
        const next = box.list[i + 1];
        inner.append(messageEl(chat, m, prev, next));
        prev = m;
      });
    }
    inner.append(typingRow);
    fillTyping(chat);
    const divider = inner.querySelector('#new-divider');
    if (divider && S.unreadMark && !S.unreadMark.scrolled && box && !box.loading) {
      S.unreadMark.scrolled = true;
      msgs.scrollTop = Math.max(0, divider.offsetTop - 80);
    } else if (scroll === 'bottom' || (scroll !== 'keep' && atBottom)) msgs.scrollTop = msgs.scrollHeight;
    else if (scroll === 'keep') msgs.scrollTop = prevTop + (msgs.scrollHeight - prevH);
    S.fresh.clear();
    updateDown();
  }
  function fillTyping(chat) {
    const row = S.refs.typingRow;
    if (!row) return;
    clear(row);
    const t = typingText(chat.id);
    if (t) row.append(dots(), (chat.type === 'direct' ? chatTitle(chat).split(' ')[0] + ' ' : '') + t);
  }

  function readStatus(chat, m) {
    if (m.pending) return icon('clock', 13);
    const readers = chat.members.filter((x) => x.id !== S.me.id && x.lastReadId >= m.id);
    return readers.length ? h('span', { 'aria-label': 'Прочитано', title: 'Прочитано' }, icon('check2', 15)) : h('span', { 'aria-label': 'Доставлено', title: 'Доставлено' }, icon('check', 13));
  }

  function messageEl(chat, m, prev, next) {
    const p = plainOf(m) || { t: 'error', reason: 'fail' };
    if (p.t === 'system') return h('div', { class: 'sys' }, p.text);
    const mine = m.senderId === S.me.id;
    const near = (a, b) => a && b && a.kind === 'msg' && b.kind === 'msg' && a.senderId === b.senderId &&
      Math.abs(a.createdAt - b.createdAt) < 5 * 60000 && sameDay(a.createdAt, b.createdAt);
    const firstOfGroup = !near(prev, m);
    const lastOfGroup = !near(m, next);
    const sender = memberOf(chat, m.senderId);
    const senderName = sender?.displayName || 'Бывший участник';
    const showAvatar = chat.type === 'group' && !mine;

    const meta = h('span', { class: 'meta' }, m.editedAt && p.t !== 'deleted' ? h('span', { class: 'edited' }, 'изменено') : null, hm(m.createdAt), mine && p.t !== 'deleted' ? readStatus(chat, m) : null);
    const bubble = h('div', { class: 'bubble' + (lastOfGroup ? ' tail' : ''), 'data-id': m.id });
    if (showAvatar && firstOfGroup) {
      bubble.append(h('span', { class: 'who', style: `color:${NAME_COLORS[(sender?.color ?? m.senderId) % 8]}` }, senderName));
    }
    if (p.reply) {
      bubble.append(h('button', { class: 'quote', onclick: () => jumpTo(p.reply.id) }, h('b', null, p.reply.name), h('span', null, p.reply.text)));
    }
    if (p.t === 'text') {
      bubble.append(...linkify(p.text), meta);
    } else if (p.t === 'deleted') {
      bubble.classList.add('bad');
      bubble.append(h('span', { class: 'del' }, icon('trash', 15, 1.8), 'Сообщение удалено'), meta);
    } else if (p.t === 'file') {
      bubble.classList.add('media');
      if (p.mime.startsWith('audio/') && p.wave) bubble.classList.add('voice-b');
      bubble.append(p.mime.startsWith('image/') ? imageEl(p) : p.mime.startsWith('audio/') && p.wave ? voiceEl(p, mine) : fileEl(p));
      if (p.caption) bubble.append(h('div', { class: 'cap', style: 'white-space:pre-wrap' }, ...linkify(p.caption), meta));
      else bubble.append(h('div', { class: 'cap', style: 'padding-top:0' }, meta));
    } else {
      bubble.classList.add('bad');
      bubble.append(p.reason === 'before' ? 'Отправлено до того, как вы вступили в чат' : 'Не удалось расшифровать сообщение', meta);
    }

    if (m.reactions?.length) {
      bubble.append(h('div', { class: 'reacts' }, m.reactions.map((r) => {
        const minex = r.users.includes(S.me.id);
        const names = r.users.map((id) => memberOf(chat, id)?.displayName || '…').join(', ');
        return h('button', { class: 'react' + (minex ? ' mine' : ''), title: names, 'aria-label': `${r.emoji} ${r.users.length}: ${names}`,
          'aria-pressed': String(minex), onclick: () => react(m, r.emoji) }, h('span', { class: 'emo' }, r.emoji), r.users.length > 1 ? String(r.users.length) : '');
      })));
    }
    const live = p.t !== 'error' && p.t !== 'deleted' && !m.pending;
    const actions = live ? h('div', { class: 'msg-actions' },
      h('button', { 'aria-label': 'Ответить', title: 'Ответить', onclick: () => setReply(m, p, senderName) }, icon('reply', 18)),
      p.t === 'text' ? h('button', { 'aria-label': 'Копировать', title: 'Копировать', onclick: () => copyText(p.text) }, icon('copy', 17)) : null) : null;
    if (live) {
      const items = [
        ['reply', 'Ответить', () => setReply(m, p, senderName)],
        p.t === 'text' && ['copy', 'Копировать текст', () => copyText(p.text)],
        p.t === 'file' && ['download', 'Скачать файл', () => downloadFile(p)],
        p.t === 'file' && p.caption && ['copy', 'Копировать подпись', () => copyText(p.caption)],
        mine && p.t === 'text' && ['edit', 'Изменить', () => setEdit(m, p)],
        mine && ['trash', 'Удалить у всех', () => deleteMessage(m, p), 'danger'],
      ].filter(Boolean);
      items.reactions = { list: S.config.reactions || ['👍', '❤️', '😂', '😮', '😢', '🔥'], pick: (e) => react(m, e),
        mine: m.reactions?.find((r) => r.users.includes(S.me.id))?.emoji };
      bubble.addEventListener('contextmenu', (e) => { e.preventDefault(); openMenu(e.clientX, e.clientY, items, bubble); });
      bubble.addEventListener('dblclick', (e) => { if (!e.target.closest('a,button')) react(m, (S.config.reactions || ['👍'])[0]); });
      let timer, sx = 0, sy = 0;
      bubble.addEventListener('touchstart', (e) => {
        sx = e.touches[0].clientX; sy = e.touches[0].clientY;
        timer = setTimeout(() => { navigator.vibrate?.(12); openMenu(sx, sy, items, bubble); }, 420);
      }, { passive: true });
      bubble.addEventListener('touchmove', (e) => {
        if (Math.abs(e.touches[0].clientX - sx) > 8 || Math.abs(e.touches[0].clientY - sy) > 8) clearTimeout(timer);
      }, { passive: true });
      ['touchend', 'touchcancel'].forEach((ev) => bubble.addEventListener(ev, () => clearTimeout(timer), { passive: true }));
    }
    const row = h('div', { class: 'row ' + (mine ? 'out' : 'in') + (firstOfGroup ? ' gap' : '') + (S.fresh.has(m.id) ? ' pop' : '') });
    if (showAvatar) row.append(lastOfGroup ? userAvatar(sender || { displayName: '?', color: 7 }, 32) : h('span', { class: 'av-space' }));
    const parts = mine ? [actions, bubble] : [bubble, actions];
    for (const part of parts) if (part) row.append(part);
    return row;
  }

  /* Всплывающее меню сообщения (правый клик или долгое нажатие) */
  function openMenu(x, y, items, anchor) {
    document.querySelector('.ctx')?.remove();
    anchor?.classList.add('held');
    const close = () => { menu.remove(); anchor?.classList.remove('held'); document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', esc); };
    const outside = (e) => { if (!menu.contains(e.target)) close(); };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    const rx = items.reactions;
    const menu = h('div', { class: 'ctx', role: 'menu' },
      rx ? h('div', { class: 'rx-strip' }, rx.list.map((e) => h('button', { class: 'rx' + (rx.mine === e ? ' mine' : ''), 'aria-label': 'Реакция ' + e,
        onclick: () => { close(); rx.pick(e); } }, e))) : null,
      items.map(([ic, label, fn, cls]) =>
        h('button', { role: 'menuitem', class: cls || null, onclick: () => { close(); fn(); } }, icon(ic, 18), label)));
    document.body.append(menu);
    const r = menu.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(x, innerWidth - r.width - 8)) + 'px';
    menu.style.top = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + 'px';
    setTimeout(() => { document.addEventListener('pointerdown', outside, true); document.addEventListener('keydown', esc); menu.querySelector('button')?.focus(); }, 0);
  }

  function jumpTo(id) {
    const el = S.refs.inner?.querySelector(`.bubble[data-id="${Number(id)}"]`);
    if (!el) { toast('Сообщение не загружено'); return; }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  }
  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); toast('Скопировано'); } catch { toast('Не удалось скопировать'); }
  }

  /* ---------- файлы ---------- */
  function getFileUrl(p) {
    if (!S.fileUrls.has(p.fileId)) {
      S.fileUrls.set(p.fileId, (async () => {
        const res = await fetch('/api/files/' + encodeURIComponent(p.fileId), { credentials: 'same-origin' });
        if (!res.ok) throw new Error('Файл недоступен');
        const plain = await C.decryptFile(await res.arrayBuffer(), p.key, p.iv);
        const safeMime = /^(image\/(png|jpeg|gif|webp|avif|bmp)|[a-z]+\/[a-z0-9.+-]+)$/i.test(p.mime) && !/svg|html|xml|javascript/i.test(p.mime) ? p.mime : 'application/octet-stream';
        return URL.createObjectURL(new Blob([plain], { type: safeMime }));
      })().catch((e) => { S.fileUrls.delete(p.fileId); throw e; }));
    }
    return S.fileUrls.get(p.fileId);
  }
  function imageEl(p) {
    const w = Math.min(320, p.w || 320);
    const ratio = p.w && p.h ? p.h / p.w : 0.75;
    const hgt = Math.min(420, Math.round(w * ratio));
    const ph = h('div', { class: 'ph', style: `width:${w}px;max-width:100%;height:${hgt}px` }, h('div', { class: 'spin' }));
    const btn = h('button', { class: 'img-box', 'aria-label': 'Открыть фото: ' + p.name, style: `width:${w}px` }, ph);
    getFileUrl(p).then((url) => {
      const img = h('img', { src: url, alt: p.caption || p.name, style: `aspect-ratio:${p.w && p.h ? p.w + '/' + p.h : 'auto'}` });
      ph.replaceWith(img);
      btn.onclick = () => openViewer(url, p.name);
    }).catch(() => { clear(ph).append(icon('image', 28)); ph.title = 'Не удалось загрузить'; });
    return btn;
  }
  let playing = null;
  function voiceEl(p, mine) {
    const bars = (p.wave && p.wave.length ? p.wave : Array(40).fill(0.3));
    const wave = h('div', { class: 'vwave', 'aria-hidden': 'true' }, bars.map((v) => h('i', { style: `height:${Math.max(3, Math.round(v * 24))}px` })));
    const fmt = (t) => Math.floor(t / 60) + ':' + pad(Math.floor(t % 60));
    const time = h('span', { class: 'vtime' }, fmt(p.dur || 0));
    const btn = h('button', { class: 'vplay', 'aria-label': 'Воспроизвести голосовое' }, icon('play', 18));
    const paint = (frac) => { const n = Math.round(frac * bars.length); [...wave.children].forEach((b, i) => b.classList.toggle('on', i < n)); };
    btn.addEventListener('click', async () => {
      if (playing && playing.p === p) {
        if (playing.audio.paused) playing.audio.play(); else playing.audio.pause();
        return;
      }
      if (playing) { playing.audio.pause(); playing.reset(); }
      clear(btn).append(h('span', { class: 'spin sm' }));
      try {
        const url = await getFileUrl(p);
        const audio = new Audio(url);
        const reset = () => { clear(btn).append(icon('play', 18)); paint(0); time.textContent = fmt(p.dur || 0); };
        playing = { p, audio, reset };
        audio.addEventListener('play', () => { clear(btn).append(icon('pause', 18)); btn.setAttribute('aria-label', 'Пауза'); });
        audio.addEventListener('pause', () => { clear(btn).append(icon('play', 18)); btn.setAttribute('aria-label', 'Воспроизвести голосовое'); });
        audio.addEventListener('timeupdate', () => {
          const d = isFinite(audio.duration) && audio.duration ? audio.duration : (p.dur || 1);
          paint(audio.currentTime / d); time.textContent = fmt(audio.currentTime);
        });
        audio.addEventListener('ended', () => { reset(); playing = null; });
        await audio.play();
      } catch { clear(btn).append(icon('play', 18)); toast('Не удалось воспроизвести'); }
    });
    wave.addEventListener('click', (e) => {
      if (!playing || playing.p !== p) return;
      const r = wave.getBoundingClientRect();
      const d = isFinite(playing.audio.duration) ? playing.audio.duration : p.dur;
      playing.audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * d;
    });
    return h('div', { class: 'voice' + (mine ? ' mine' : '') }, btn, h('div', { class: 'vmid' }, wave, time));
  }

  function fileEl(p) {
    const ext = (p.name.split('.').pop() || 'файл').slice(0, 4);
    return h('button', { class: 'file-card', onclick: () => downloadFile(p), 'aria-label': 'Скачать ' + p.name },
      h('span', { class: 'file-ext' }, ext),
      h('span', { style: 'flex:1;min-width:0' }, h('b', null, p.name), h('small', null, fileSize(p.size))),
      icon('download', 20));
  }
  async function downloadFile(p) {
    toast('Расшифровываю файл…');
    try {
      const url = await getFileUrl(p);
      const a = h('a', { href: url, download: p.name });
      document.body.append(a); a.click(); a.remove();
    } catch (e) { toast(e.message); }
  }
  function openViewer(url, name) {
    const close = () => { v.remove(); document.removeEventListener('keydown', esc); };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    const v = h('div', { class: 'viewer', role: 'dialog', 'aria-label': 'Просмотр фото', onclick: (e) => { if (e.target === v) close(); } },
      h('img', { src: url, alt: name }),
      h('button', { class: 'icon-btn', style: 'right:12px', 'aria-label': 'Закрыть', onclick: close }, icon('close', 26)),
      h('a', { class: 'icon-btn', style: 'right:64px', href: url, download: name, 'aria-label': 'Скачать' }, icon('download', 24)));
    document.addEventListener('keydown', esc);
    document.body.append(v);
  }

  /* ---------- ввод и отправка ---------- */
  function buildComposer(chat) {
    const input = h('textarea', { rows: 1, placeholder: chat.type === 'group' ? 'Сообщение в группу' : 'Сообщение', 'aria-label': 'Сообщение' });
    const fileInput = h('input', { type: 'file', multiple: true, class: 'sr', tabindex: '-1', 'aria-hidden': 'true',
      onchange: () => { sendFiles([...fileInput.files]); fileInput.value = ''; } });
    const replyBox = h('div');
    const uploadBox = h('div');
    let lastTyping = 0;
    const canVoice = !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
    const autosize = () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 160) + 'px'; };
    const actionBtn = h('button', { class: 'send', onclick: () => (input.value.trim() || !canVoice ? submit() : startVoice()) });
    const syncBtn = () => {
      const has = !!input.value.trim();
      clear(actionBtn).append(has || !canVoice || S.edit ? icon(S.edit ? 'check' : 'send', 20, 2.2) : icon('mic', 22, 2));
      actionBtn.setAttribute('aria-label', has || S.edit ? (S.edit ? 'Сохранить' : 'Отправить') : canVoice ? 'Записать голосовое' : 'Отправить');
      actionBtn.classList.toggle('idle', !has && (!canVoice || !!S.edit));
    };
    input.addEventListener('input', () => {
      autosize(); syncBtn();
      if (Date.now() - lastTyping > 2500 && input.value.trim()) {
        lastTyping = Date.now();
        wsSend({ type: 'typing', chatId: chat.id });
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !COARSE && !e.isComposing) { e.preventDefault(); submit(); }
      if (e.key === 'Escape') { if (S.edit) setEdit(null); else if (S.reply) setReply(null); }
    });
    input.addEventListener('paste', (e) => {
      const files = [...(e.clipboardData?.files || [])];
      if (files.length) { e.preventDefault(); sendFiles(files); }
    });
    const submit = () => {
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      autosize();
      if (S.edit) saveEdit(text); else sendPayload({ t: 'text', text });
      syncBtn();
      if (!COARSE) input.focus();
    };
    const attachBtn = h('button', { class: 'icon-btn', style: 'color:var(--muted)', 'aria-label': 'Прикрепить фото или файл', title: 'Прикрепить', onclick: () => fileInput.click() }, icon('attach', 24, 1.8));
    const row = h('div', { class: 'composer' }, attachBtn, h('label', { class: 'field' }, input), actionBtn, fileInput);
    const el = h('div', { class: 'composer-wrap' }, replyBox, uploadBox, row);

    /* Голосовое сообщение */
    async function startVoice() {
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
      catch { toast('Нет доступа к микрофону. Разрешите его в настройках браузера'); return; }
      const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find((t) => MediaRecorder.isTypeSupported?.(t)) || '';
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks = [];
      const levels = [];
      let ctx, analyser, data, raf, cancelled = false;
      try {
        ctx = new AudioContext();
        analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(stream).connect(analyser);
        data = new Uint8Array(analyser.fftSize);
      } catch { /* волна необязательна */ }
      const t0 = Date.now();
      const timer = h('span', { class: 'rec-time' }, '0:00');
      const live = h('div', { class: 'rec-wave', 'aria-hidden': 'true' });
      const tick = () => {
        const sec = Math.floor((Date.now() - t0) / 1000);
        timer.textContent = Math.floor(sec / 60) + ':' + pad(sec % 60);
        if (analyser) {
          analyser.getByteTimeDomainData(data);
          let peak = 0;
          for (const v of data) peak = Math.max(peak, Math.abs(v - 128));
          const lvl = Math.min(1, peak / 64);
          levels.push(lvl);
          live.append(h('i', { style: `height:${Math.max(3, Math.round(lvl * 26))}px` }));
          while (live.children.length > 60) live.firstChild.remove();
        }
        if (sec >= 300) stop(false);
        else raf = setTimeout(tick, 100);
      };
      const finish = () => { clearTimeout(raf); stream.getTracks().forEach((t) => t.stop()); ctx?.close?.(); el.replaceChild(row, recRow); };
      const stop = (cancel) => { cancelled = cancel; if (rec.state !== 'inactive') rec.stop(); };
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        finish();
        const dur = Math.round((Date.now() - t0) / 100) / 10;
        if (cancelled || dur < 0.7) { if (!cancelled) toast('Слишком короткое голосовое'); return; }
        const type = (rec.mimeType || mime || 'audio/webm').split(';')[0];
        const n = 40, wave = [];
        for (let i = 0; i < n; i++) {
          const part = levels.slice(Math.floor(i * levels.length / n), Math.floor((i + 1) * levels.length / n) || undefined);
          wave.push(Math.round((part.length ? Math.max(...part) : 0.1) * 100) / 100);
        }
        const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
        sendFiles([new File(chunks, `voice-${Date.now()}.${ext}`, { type })], { voice: { dur, wave } });
      };
      const recRow = h('div', { class: 'composer rec' },
        h('button', { class: 'icon-btn', 'aria-label': 'Отменить запись', title: 'Отменить', onclick: () => stop(true) }, icon('trash', 22, 1.8)),
        h('div', { class: 'rec-body' }, h('span', { class: 'rec-dot' }), timer, live),
        h('button', { class: 'send', 'aria-label': 'Отправить голосовое', onclick: () => stop(false) }, icon('send', 20, 2.2)));
      el.replaceChild(recRow, row);
      rec.start(250);
      tick();
    }

    syncBtn();
    return { el, input, replyBox, uploadBox, syncBtn, autosize };
  }

  function setReply(m, p, name) {
    const c = S.refs.composer;
    if (!c) return;
    clear(c.replyBox);
    if (S.edit && m) { S.edit = null; c.input.value = ''; c.autosize(); }
    if (!m) { S.reply = null; c.syncBtn(); return; }
    S.reply = { id: m.id, name, text: previewOf(p).slice(0, 120) };
    c.replyBox.append(h('div', { class: 'reply-bar' }, icon('reply', 20),
      h('div', null, h('b', null, 'Ответ: ' + name), h('span', null, S.reply.text)),
      h('button', { class: 'icon-btn', 'aria-label': 'Отменить ответ', onclick: () => setReply(null) }, icon('close', 20))));
    c.syncBtn();
    c.input.focus();
  }

  /* Правка своего сообщения */
  function setEdit(m, p) {
    const c = S.refs.composer;
    if (!c) return;
    clear(c.replyBox);
    S.reply = null;
    if (!m) { S.edit = null; c.input.value = ''; c.autosize(); c.syncBtn(); return; }
    S.edit = { id: m.id, payload: p };
    c.replyBox.append(h('div', { class: 'reply-bar' }, icon('edit', 20),
      h('div', null, h('b', null, 'Редактирование'), h('span', null, p.text.slice(0, 120))),
      h('button', { class: 'icon-btn', 'aria-label': 'Отменить редактирование', onclick: () => setEdit(null) }, icon('close', 20))));
    c.input.value = p.text;
    c.autosize(); c.syncBtn();
    c.input.focus();
    c.input.setSelectionRange(c.input.value.length, c.input.value.length);
  }
  async function saveEdit(text) {
    const ed = S.edit;
    const chat = S.chats.get(S.active);
    setEdit(null);
    if (!ed || !chat || text === ed.payload.text) return;
    const payload = { t: 'text', text, reply: ed.payload.reply || undefined };
    try {
      const envelope = await C.encryptMessage(payload, {
        chatId: chat.id, senderId: S.me.id, senderPriv: S.priv,
        recipients: chat.members.map((m) => ({ id: m.id, publicKey: m.id === S.me.id ? S.pub : m.publicKey })),
      });
      S.plain.set(ed.id, cleanPayload(payload));
      const { message } = await api('/api/messages/' + ed.id, { method: 'PATCH', body: { envelope } });
      applyUpdated(message, payload);
    } catch (e) { toast('Не сохранено: ' + e.message); }
  }
  async function deleteMessage(m, p) {
    if (!confirm('Удалить сообщение у всех участников чата?')) return;
    try {
      const { message } = await api('/api/messages/' + m.id, { method: 'DELETE', body: { fileId: p.t === 'file' ? p.fileId : undefined } });
      applyUpdated(message);
    } catch (e) { toast(e.message); }
  }
  async function react(m, emoji) {
    try {
      const { reactions } = await api(`/api/messages/${m.id}/react`, { body: { emoji } });
      applyReactions(m.chatId, m.id, reactions);
    } catch (e) { toast(e.message); }
  }
  async function applyUpdated(msg, payload) {
    const chat = S.chats.get(msg.chatId);
    if (!chat) return;
    S.plain.delete(msg.id);
    if (payload) S.plain.set(msg.id, cleanPayload(payload)); else await decryptMsg(msg, chat);
    const box = S.msgs.get(chat.id);
    if (box) { const i = box.list.findIndex((x) => x.id === msg.id); if (i >= 0) box.list[i] = msg; }
    if (chat.lastMessage?.id === msg.id) chat.lastMessage = msg;
    renderList();
    if (S.active === chat.id) renderMessages();
  }
  function applyReactions(chatId, messageId, reactions) {
    const box = S.msgs.get(chatId);
    const m = box?.list.find((x) => x.id === messageId);
    if (m) m.reactions = reactions;
    if (S.active === chatId) renderMessages();
  }

  function renderUploads() {
    const c = S.refs.composer;
    if (!c) return;
    clear(c.uploadBox);
    if (S.uploads) c.uploadBox.append(h('div', { class: 'upload-bar' }, `Шифрую и отправляю ${S.uploads} ${plural(S.uploads, 'файл', 'файла', 'файлов')}…`));
  }

  let clientSeq = 0;
  async function sendPayload(payload, chatId = S.active) {
    const chat = S.chats.get(chatId);
    if (!chat) return;
    if (S.reply && chatId === S.active) { payload.reply = S.reply; setReply(null); }
    const clientId = Date.now().toString(36) + '-' + (clientSeq++);
    const box = S.msgs.get(chatId) || { list: [], hasMore: false };
    S.msgs.set(chatId, box);
    const temp = { id: 'tmp-' + clientId, clientId, chatId, senderId: S.me.id, kind: 'msg', createdAt: Date.now(), pending: true, payload };
    box.list.push(temp);
    S.fresh.add(temp.id);
    if (S.active === chatId) renderMessages('bottom');
    try {
      const envelope = await C.encryptMessage(payload, {
        chatId, senderId: S.me.id, senderPriv: S.priv,
        recipients: chat.members.map((m) => ({ id: m.id, publicKey: m.id === S.me.id ? S.pub : m.publicKey })),
      });
      const { message } = await api(`/api/chats/${chatId}/messages`, { body: { envelope, clientId } });
      acceptMessage(message, clientId, payload);
    } catch (e) {
      box.list = box.list.filter((m) => m !== temp);
      if (S.active === chatId) renderMessages();
      toast('Не отправлено: ' + e.message);
    }
  }

  async function sendFiles(files, opts = {}) {
    const chatId = S.active;
    if (!chatId || !files.length) return;
    const input = S.refs.composer?.input;
    let caption = '';
    if (files.length === 1 && !opts.voice && input?.value.trim()) { caption = input.value.trim(); input.value = ''; input.style.height = 'auto'; }
    for (const file of files) {
      if (file.size > S.config.maxFile) { toast(`«${file.name}» больше ${fileSize(S.config.maxFile)}`); continue; }
      S.uploads++; renderUploads();
      try {
        const buf = await file.arrayBuffer();
        let w = 0, hh = 0;
        if (file.type.startsWith('image/')) {
          try { const bmp = await createImageBitmap(new Blob([buf], { type: file.type })); w = bmp.width; hh = bmp.height; bmp.close?.(); } catch { /* не картинка */ }
        }
        const encd = await C.encryptFile(buf);
        const { id } = await api('/api/files?chatId=' + chatId, { raw: encd.data });
        await sendPayload({ t: 'file', fileId: id, name: file.name, size: file.size, mime: file.type || 'application/octet-stream',
          key: encd.key, iv: encd.iv, w, h: hh, caption, ...(opts.voice || {}) }, chatId);
        caption = '';
      } catch (e) { toast('Файл не отправлен: ' + e.message); }
      S.uploads--; renderUploads();
    }
  }

  function setupDrop(pane) {
    let depth = 0, overlay = null;
    pane.addEventListener('dragenter', (e) => {
      if (![...(e.dataTransfer?.types || [])].includes('Files')) return;
      e.preventDefault(); depth++;
      if (!overlay) { overlay = h('div', { class: 'drop' }, 'Отпустите, чтобы отправить'); pane.append(overlay); }
    });
    pane.addEventListener('dragover', (e) => { if (overlay) e.preventDefault(); });
    pane.addEventListener('dragleave', () => { if (--depth <= 0 && overlay) { overlay.remove(); overlay = null; depth = 0; } });
    pane.addEventListener('drop', (e) => {
      if (!overlay) return;
      e.preventDefault(); overlay.remove(); overlay = null; depth = 0;
      sendFiles([...e.dataTransfer.files]);
    });
  }

  /* Новое сообщение (своё подтверждённое или чужое) */
  async function acceptMessage(msg, clientId, payload) {
    const chat = S.chats.get(msg.chatId);
    if (!chat) { await loadChats(); return; }
    if (payload) { S.plain.set(msg.id, payload); } else await decryptMsg(msg, chat);
    const box = S.msgs.get(chat.id);
    if (box) {
      const i = clientId ? box.list.findIndex((m) => m.clientId === clientId) : -1;
      if (box.list.some((m) => m.id === msg.id)) { if (i >= 0) box.list.splice(i, 1); }
      else if (i >= 0) box.list[i] = msg;
      else { box.list = mergeList(box.list, [msg]); S.fresh.add(msg.id); }
    }
    const isNew = !chat.lastMessage || msg.id > chat.lastMessage.id;
    if (isNew) chat.lastMessage = msg;
    const mine = msg.senderId === S.me.id;
    const viewing = S.active === chat.id && !document.hidden;
    if (mine) { chat.lastReadId = Math.max(chat.lastReadId || 0, msg.id); const me = memberOf(chat, S.me.id); if (me) me.lastReadId = chat.lastReadId; }
    else if (isNew && msg.kind === 'msg') {
      S.typing.get(chat.id)?.delete(msg.senderId);
      if (!viewing) { chat.unread = (chat.unread || 0) + 1; notify(chat, msg); }
    }
    renderList();
    updateTitle();
    if (S.active === chat.id) {
      const m = S.refs.msgs;
      if (!mine && isNew && m && m.scrollHeight - m.scrollTop - m.clientHeight > 240) S.newBelow++;
      renderMessages(mine ? 'bottom' : undefined); renderHead(); if (viewing) markRead();
    }
  }

  function notify(chat, msg) {
    if (!store.get('tiho-notify', false) || !('Notification' in window) || Notification.permission !== 'granted' || !document.hidden) return;
    const showText = store.get('tiho-notify-text', false);
    const sender = memberOf(chat, msg.senderId)?.displayName || '';
    const title = chat.type === 'group' ? `${chatTitle(chat)}: ${sender}` : sender;
    try {
      const n = new Notification(title || 'Тихо', { body: showText ? previewOf(plainOf(msg)).slice(0, 140) : 'Новое сообщение', tag: 'chat-' + chat.id, icon: '/icon-192.png' });
      n.onclick = () => { window.focus(); openChat(chat.id); n.close(); };
    } catch { /* мобильные браузеры без поддержки */ }
  }

  /* ---------- WebSocket ---------- */
  function wsSend(data) { if (S.ws?.readyState === 1) S.ws.send(JSON.stringify(data)); }
  function connect() {
    const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
    S.ws = ws;
    let opened = false;
    ws.onopen = () => {
      if (S.wsReconnect) loadChats();
      opened = true; S.wsDelay = 1000; S.wsReconnect = true;
    };
    ws.onmessage = (e) => { let d; try { d = JSON.parse(e.data); } catch { return; } onEvent(d); };
    ws.onclose = () => {
      if (S.ws !== ws) return;
      if (!opened) S.wsDelay = Math.min(S.wsDelay * 2, 15000);
      setTimeout(async () => {
        try { await api('/api/me'); } catch (err) { if (err.status === 401) return location.reload(); }
        connect();
      }, S.wsDelay);
    };
  }
  const typingTimers = new Map();
  async function onEvent(d) {
    if (d.type === 'message') return acceptMessage(d.message, d.clientId);
    if (d.type === 'chat') {
      const old = S.chats.get(d.chat.id);
      S.chats.set(d.chat.id, d.chat);
      checkKeys(d.chat);
      if (d.chat.lastMessage) await decryptMsg(d.chat.lastMessage, d.chat);
      if (old && S.active === d.chat.id) { d.chat.unread = 0; }
      if (old && old.members.length !== d.chat.members.length) S.userKeys.clear();
      if (S.active === d.chat.id) {
        const box = S.msgs.get(d.chat.id);
        if (box && d.chat.lastMessage && !box.list.some((m) => m.id === d.chat.lastMessage.id)) box.list = mergeList(box.list, [d.chat.lastMessage]);
        renderHead(); renderMessages();
      }
      renderList(); updateTitle();
      return;
    }
    if (d.type === 'messageUpdated') return applyUpdated(d.message);
    if (d.type === 'reactions') return applyReactions(d.chatId, d.messageId, d.reactions);
    if (d.type === 'chatRemoved') {
      S.chats.delete(d.chatId); S.msgs.delete(d.chatId);
      if (S.active === d.chatId) closeChat(); else renderList();
      return;
    }
    if (d.type === 'read') {
      const chat = S.chats.get(d.chatId);
      const m = chat && memberOf(chat, d.userId);
      if (!m) return;
      m.lastReadId = Math.max(m.lastReadId || 0, d.messageId);
      if (d.userId === S.me.id) {
        chat.lastReadId = m.lastReadId;
        if (!chat.lastMessage || chat.lastMessage.id <= m.lastReadId) chat.unread = 0;
        renderList(); updateTitle();
      } else if (S.active === d.chatId) renderMessages();
      return;
    }
    if (d.type === 'typing') {
      if (!S.typing.has(d.chatId)) S.typing.set(d.chatId, new Map());
      S.typing.get(d.chatId).set(d.userId, Date.now());
      const key = d.chatId + ':' + d.userId;
      clearTimeout(typingTimers.get(key));
      typingTimers.set(key, setTimeout(() => { S.typing.get(d.chatId)?.delete(d.userId); refreshTyping(d.chatId); }, 4500));
      refreshTyping(d.chatId);
      return;
    }
    if (d.type === 'presence') {
      for (const c of S.chats.values()) { const m = memberOf(c, d.userId); if (m) m.online = d.online; }
      renderList(); renderHead();
      return;
    }
    if (d.type === 'user') {
      for (const c of S.chats.values()) { const m = memberOf(c, d.user.id); if (m) m.displayName = d.user.displayName; }
      if (d.user.id === S.me.id) { S.me.displayName = d.user.displayName; renderMe(); }
      renderList(); renderHead();
    }
  }
  function refreshTyping(chatId) {
    renderList();
    if (S.active === chatId) {
      renderHead();
      const chat = S.chats.get(chatId);
      const t = typingText(chatId);
      if (t !== undefined) fillTyping(chat);
    }
  }

  /* ================= ОКНА ================= */
  function modal(title, body, opts = {}) {
    const prevFocus = document.activeElement;
    const close = () => { back.remove(); document.removeEventListener('keydown', esc); prevFocus?.focus?.(); opts.onClose?.(); };
    const esc = (e) => { if (e.key === 'Escape') close(); };
    const back = h('div', { class: 'modal-back', onclick: (e) => { if (e.target === back) close(); } },
      h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
        h('div', { class: 'modal-head' }, h('h2', null, title), h('button', { class: 'icon-btn', 'aria-label': 'Закрыть', onclick: close }, icon('close', 22))),
        h('div', { class: 'modal-body' }, body)));
    document.addEventListener('keydown', esc);
    document.body.append(back);
    setTimeout(() => (back.querySelector('input:not([type=hidden])') || back.querySelector('.modal-head button'))?.focus(), 30);
    return close;
  }

  /* Выбор людей: новый личный чат / новая группа / добавить в группу */
  function openPicker(mode, chatId) {
    const picked = new Map();
    const existing = chatId ? new Set(S.chats.get(chatId).members.map((m) => m.id)) : new Set();
    const titleInput = h('input', { class: 'input', placeholder: 'Например, Поход в Карелию', maxlength: 64 });
    const search = h('input', { class: 'input', type: 'search', placeholder: 'Логин или имя', autocapitalize: 'none' });
    const results = h('div', { class: 'card' });
    const pickedBox = h('div', { class: 'picked' });
    const go = h('button', { class: 'btn block', disabled: true }, mode === 'group' ? 'Создать группу' : 'Добавить');
    let found = [];
    const contacts = () => {
      const seen = new Map();
      for (const c of S.chats.values()) for (const m of c.members) if (m.id !== S.me.id && !seen.has(m.id)) seen.set(m.id, m);
      return [...seen.values()];
    };
    const draw = () => {
      clear(results);
      const qv = search.value.trim().replace(/^@/, '').toLowerCase();
      let list = qv.length >= 2 ? found : contacts();
      list = list.filter((u) => !existing.has(u.id));
      if (!list.length) {
        results.append(h('div', { class: 'card-row' }, h('span', { class: 'muted' },
          qv.length >= 2 ? 'Никого не нашли' : 'Начните вводить логин собеседника')));
      }
      for (const u of list) {
        const on = picked.has(u.id);
        results.append(h('button', { class: 'card-row', onclick: () => {
          if (mode === 'direct') { close(); openDirect(u.id); return; }
          if (on) picked.delete(u.id); else picked.set(u.id, u);
          draw();
        } }, userAvatar(u, 40), h('span', { class: 'grow' }, h('b', null, u.displayName), h('small', null, '@' + u.username)),
        mode !== 'direct' ? h('span', { class: 'check' + (on ? ' on' : '') }, on ? icon('check', 14, 3) : null) : null));
      }
      clear(pickedBox);
      for (const u of picked.values()) {
        pickedBox.append(h('button', { 'aria-label': 'Убрать ' + u.displayName, onclick: () => { picked.delete(u.id); draw(); } }, u.displayName, icon('close', 14, 2.5)));
      }
      go.disabled = mode === 'group' ? !titleInput.value.trim() : !picked.size;
    };
    let t;
    search.addEventListener('input', () => {
      clearTimeout(t);
      const qv = search.value.trim().replace(/^@/, '');
      if (qv.length < 2) { found = []; draw(); return; }
      t = setTimeout(async () => {
        try { found = (await api('/api/users/search?q=' + encodeURIComponent(qv))).users; } catch { found = []; }
        draw();
      }, 250);
    });
    titleInput.addEventListener('input', draw);
    go.addEventListener('click', async () => {
      go.disabled = true;
      try {
        if (mode === 'group') {
          const { chat } = await api('/api/chats/group', { body: { title: titleInput.value.trim(), memberIds: [...picked.keys()] } });
          S.chats.set(chat.id, chat);
          close(); openChat(chat.id);
        } else {
          const { chat } = await api(`/api/chats/${chatId}/members`, { body: { userIds: [...picked.keys()] } });
          S.chats.set(chat.id, chat);
          close(); renderHead();
        }
      } catch (e) { toast(e.message); go.disabled = false; }
    });
    const body = [];
    if (mode === 'group') body.push(h('label', { class: 'field-label' }, 'Название группы', titleInput));
    body.push(h('label', { class: 'field-label' }, mode === 'direct' ? 'Кому написать' : 'Участники', search));
    if (mode !== 'direct') body.push(pickedBox);
    body.push(results);
    if (mode === 'add') body.push(h('p', { class: 'muted', style: 'margin:0;font-size:13px;line-height:1.45' }, 'Новые участники увидят только сообщения, отправленные после их добавления: старые зашифрованы не для них.'));
    if (mode !== 'direct') body.push(go);
    const close = modal(mode === 'direct' ? 'Новый чат' : mode === 'group' ? 'Новая группа' : 'Добавить участников', body);
    draw();
    if (mode === 'group') setTimeout(() => titleInput.focus(), 40);
  }

  /* Информация о чате, код безопасности */
  async function openInfo(chatId) {
    const chat = S.chats.get(chatId);
    if (!chat) return;
    const body = [];
    if (chat.type === 'direct') {
      const o = other(chat);
      const code = await C.safetyCode(S.pub, o.publicKey);
      const verified = isVerified(o);
      const changed = keyChanged(o);
      body.push(h('div', { style: 'display:flex;flex-direction:column;align-items:center;gap:6px;padding:4px 0 6px;text-align:center' },
        userAvatar(o, 80, true), h('b', { style: 'font-size:20px' }, o.displayName), h('span', { class: 'muted' }, '@' + o.username + (o.online ? ' · в сети' : ''))));
      body.push(h('div', { class: 'hero' },
        h('div', { style: 'display:flex;align-items:center;gap:8px;font-weight:600;color:' + (changed ? '#FFB4A3' : verified ? 'var(--hero-ok)' : 'var(--hero-text)') },
          icon(changed ? 'warn' : 'shield', 18), changed ? 'Ключ собеседника изменился' : verified ? 'Ключ подтверждён' : 'Код безопасности'),
        h('div', { class: 'code', 'aria-label': 'Код безопасности' }, code.map((g) => h('span', null, g))),
        h('p', null, 'Сравните код с экраном собеседника — лично или по звонку. Если цифры совпадают, переписку не может прочитать или подделать никто, кроме вас двоих.'),
        h('button', { class: 'btn', style: 'background:#fff;color:#0E1726', onclick: () => {
          const v = store.get(verifiedKey(), {}); v[o.id] = o.publicKey; store.set(verifiedKey(), v);
          acceptKey(o); close(); renderHead(); toast('Ключ отмечен как проверенный');
        } }, icon('check', 18, 2.4), verified && !changed ? 'Проверено' : 'Коды совпадают')));
    } else {
      body.push(h('div', { style: 'display:flex;flex-direction:column;align-items:center;gap:6px;padding:4px 0 6px;text-align:center' },
        avatar(chat, 80), h('b', { style: 'font-size:20px' }, chat.title),
        h('span', { class: 'muted' }, `${chat.members.length} ${plural(chat.members.length, 'участник', 'участника', 'участников')}`)));
      const members = h('div', { class: 'card' },
        h('button', { class: 'card-row', onclick: () => { close(); openPicker('add', chat.id); } },
          h('span', { class: 'ic', style: 'background:var(--accent-soft);color:var(--accent)' }, icon('plus', 20)), h('span', { class: 'grow' }, h('b', { style: 'color:var(--accent)' }, 'Добавить участников'))),
        chat.members.map((m) => h(m.id === S.me.id ? 'div' : 'button', {
          class: 'card-row', onclick: m.id === S.me.id ? null : () => { close(); openDirect(m.id); } },
        userAvatar(m, 40, true),
        h('span', { class: 'grow' }, h('b', null, m.displayName + (m.id === S.me.id ? ' (вы)' : '')), h('small', null, m.online ? 'в сети' : '@' + m.username)),
        keyChanged(m) ? h('span', { title: 'Ключ изменился', style: 'color:var(--danger)' }, icon('warn', 18)) : null)));
      body.push(members);
      body.push(h('p', { class: 'muted', style: 'margin:0;font-size:13px;line-height:1.45' },
        'Сообщения в группе шифруются отдельно для каждого участника. Проверить ключ конкретного человека можно в личном чате с ним.'));
      body.push(h('button', { class: 'btn danger block', onclick: async () => {
        if (!confirm(`Покинуть группу «${chat.title}»?`)) return;
        try { await api(`/api/chats/${chat.id}/leave`, { method: 'POST' }); close(); } catch (e) { toast(e.message); }
      } }, icon('leave', 18), 'Покинуть группу'));
    }
    const close = modal(chat.type === 'direct' ? 'Шифрование' : 'Группа', body);
  }

  /* Настройки */
  async function openSettings() {
    let info = { twoFactor: false, backupLeft: 0 };
    try { info = await api('/api/me'); } catch { /* покажем без статуса */ }
    const nameInput = h('input', { class: 'input', value: S.me.displayName, maxlength: 64, 'aria-label': 'Имя' });
    const saveName = h('button', { class: 'btn', onclick: async () => {
      try { const { user } = await api('/api/me', { method: 'PATCH', body: { displayName: nameInput.value } }); S.me = user; renderMe(); toast('Имя сохранено'); } catch (e) { toast(e.message); }
    } }, 'Сохранить');
    const themeNow = store.get('tiho-theme', 'auto');
    const themeSeg = h('div', { class: 'theme-seg', role: 'group', 'aria-label': 'Тема' },
      [['light', 'Светлая', 'sun'], ['dark', 'Тёмная', 'moon'], ['auto', 'Авто', 'auto']].map(([k, l, ic]) => h('button', {
        'aria-pressed': String(themeNow === k), 'data-k': k, onclick: () => {
          store.set('tiho-theme', k); applyTheme();
          themeSeg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === k)));
        } }, icon(ic, 18), l)));
    const sw = (key, label, sub, ic, onTurnOn) => {
      const b = h('button', { class: 'sw', role: 'switch', 'aria-checked': String(store.get(key, false)), 'aria-label': label });
      b.addEventListener('click', async () => {
        let v = b.getAttribute('aria-checked') !== 'true';
        if (v && onTurnOn) v = await onTurnOn();
        store.set(key, v); b.setAttribute('aria-checked', String(v));
      });
      return h('div', { class: 'card-row' }, h('span', { class: 'ic' }, icon(ic, 19, 1.9)), h('span', { class: 'grow' }, h('b', null, label), h('small', null, sub)), b);
    };
    const askNotif = async () => {
      if (!('Notification' in window)) { toast('Браузер не поддерживает уведомления'); return false; }
      const p = await Notification.requestPermission();
      if (p !== 'granted') toast('Уведомления запрещены в настройках браузера');
      return p === 'granted';
    };
    const fp = h('div', { class: 'code fp' });
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(S.pub)).then((d) => {
      const b = new Uint8Array(d);
      for (let i = 0; i < 8; i++) fp.append(h('span', null, ((b[i * 2] << 8 | b[i * 2 + 1]) % 10000).toString().padStart(4, '0')));
    });
    const tfaRow = h('button', { class: 'card-row', onclick: () => { close(); info.twoFactor ? openDisable2fa(info.backupLeft) : openEnable2fa(); } },
      h('span', { class: 'ic', style: info.twoFactor ? 'background:var(--ok-soft);color:var(--ok)' : '' }, icon('shield', 19, 1.9)),
      h('span', { class: 'grow' }, h('b', null, 'Google Authenticator'),
        h('small', null, info.twoFactor ? `Код при входе · резервных кодов: ${info.backupLeft}` : 'Код из приложения при каждом входе')),
      h('span', { class: 'chip-status' + (info.twoFactor ? ' on' : '') }, info.twoFactor ? 'Включено' : 'Выключено'));
    const gRow = S.config.googleClientId ? h('button', { class: 'card-row', onclick: async () => {
      if (info.google) {
        if (!confirm('Отвязать Google? Входить можно будет по логину и паролю.')) return;
        try { await api('/api/google/unlink', { method: 'POST' }); close(); toast('Google отвязан'); } catch (e) { toast(e.message); }
      } else { close(); openLinkGoogle(); }
    } },
      h('span', { class: 'ic g-ic' }, h('span', { class: 'g-logo' }, 'G')),
      h('span', { class: 'grow' }, h('b', null, 'Вход через Google'), h('small', null, info.google ? String(info.google) : 'Входите в один клик')),
      h('span', { class: 'chip-status' + (info.google ? ' on' : '') }, info.google ? 'Привязан' : 'Привязать')) : null;
    const section = (title, ...kids) => h('div', { class: 'section' }, h('div', { class: 'section-title' }, title), ...kids);

    const close = modal('Настройки', [
      h('div', { class: 'profile-card' }, userAvatar(S.me, 72),
        h('div', { style: 'min-width:0' }, h('b', null, S.me.displayName), h('span', { class: 'muted' }, '@' + S.me.username))),
      section('Профиль', h('div', { class: 'card', style: 'padding:14px 16px' },
        h('label', { class: 'field-label' }, 'Имя, которое видят другие', h('div', { style: 'display:flex;gap:8px' }, nameInput, saveName)))),
      section('Безопасность', h('div', { class: 'card' }, gRow, tfaRow)),
      section('Оформление', themeSeg),
      section('Уведомления', h('div', { class: 'card' },
        sw('tiho-notify', 'Уведомления', 'Когда вкладка свёрнута', 'bell', askNotif),
        sw('tiho-notify-text', 'Текст в уведомлениях', 'Показывать содержимое сообщений', 'eye'))),
      section('Шифрование', h('div', { class: 'card', style: 'padding:14px 16px;display:flex;flex-direction:column;gap:10px' },
        h('div', { style: 'display:flex;align-items:center;gap:8px;font-weight:600' }, icon('key', 18), 'Отпечаток вашего ключа'),
        fp,
        h('p', { class: 'muted', style: 'margin:0;font-size:13px;line-height:1.45' },
          'Ключи хранятся только на ваших устройствах. Сервер передаёт зашифрованные сообщения и файлы и не может их расшифровать.'))),
      h('button', { class: 'btn danger block', onclick: logout }, icon('logout', 18), 'Выйти из аккаунта'),
    ]);
  }

  function openLinkGoogle() {
    const err = h('div', { class: 'err', role: 'alert' });
    const close = modal('Вход через Google', [
      h('p', { class: 'muted', style: 'margin:0;line-height:1.45' }, 'Привяжите Google-аккаунт, чтобы входить в один клик. Пароль шифрования по-прежнему понадобится на новых устройствах.'),
      googleButton(async (credential) => {
        try { const r = await api('/api/google/link', { body: { credential } }); close(); toast('Google привязан: ' + r.email); }
        catch (e) { err.textContent = e.message; }
      }, 'continue_with'),
      err,
    ]);
  }

  /* Включение Google Authenticator: QR → код → резервные коды */
  async function openEnable2fa() {
    let setup;
    try { setup = await api('/api/2fa/setup', { method: 'POST' }); } catch (e) { toast(e.message); return; }
    const err = h('div', { class: 'err', role: 'alert' });
    const code = h('input', { class: 'input code-input', inputmode: 'numeric', autocomplete: 'one-time-code', placeholder: '000000', maxlength: 6, 'aria-label': 'Код из приложения' });
    const btn = h('button', { class: 'btn block', disabled: true }, 'Включить защиту');
    code.addEventListener('input', () => { code.value = code.value.replace(/\D/g, '').slice(0, 6); btn.disabled = code.value.length !== 6; });
    const step = (n, title, ...kids) => h('div', { class: 'step' }, h('span', { class: 'step-n' }, n), h('div', { class: 'step-body' }, h('b', null, title), ...kids));
    const body = h('div', { style: 'display:flex;flex-direction:column;gap:16px' },
      step(1, 'Установите приложение', h('small', { class: 'muted' }, 'Google Authenticator из App Store или Google Play. Подойдёт и любое другое приложение для кодов.')),
      step(2, 'Отсканируйте QR-код',
        h('div', { class: 'qr-box' }, h('img', { src: setup.qr, alt: 'QR-код для Google Authenticator', width: 200, height: 200 })),
        h('small', { class: 'muted' }, 'Или нажмите «+» → «Ввести ключ настройки» и введите ключ:'),
        h('div', { class: 'secret' }, h('code', null, setup.secret),
          h('button', { class: 'icon-btn', 'aria-label': 'Скопировать ключ', onclick: () => copyText(setup.secret.replace(/\s/g, '')) }, icon('copy', 18))),
        h('a', { class: 'link', href: setup.uri }, 'Открыть в приложении на этом телефоне')),
      step(3, 'Введите код из приложения', code, err, btn));
    const close = modal('Google Authenticator', body);
    btn.addEventListener('click', async () => {
      btn.disabled = true; err.textContent = '';
      try {
        const r = await api('/api/2fa/enable', { body: { code: code.value } });
        close();
        showBackupCodes(r.backupCodes);
      } catch (e) { err.textContent = e.message; btn.disabled = false; code.select(); }
    });
  }

  function showBackupCodes(codes) {
    const text = codes.join('\n');
    const close = modal('Защита включена', [
      h('div', { class: 'success-head' }, h('span', { class: 'tfa-badge ok' }, icon('shield', 30)),
        h('b', null, 'Теперь при входе понадобится код из Google Authenticator')),
      h('div', { class: 'note' }, icon('warn', 18), h('span', null, 'Сохраните резервные коды. Если потеряете телефон, войти можно будет только с ними. Каждый код работает один раз, показываем их только сейчас.')),
      h('div', { class: 'backup-grid' }, codes.map((c) => h('code', null, c))),
      h('div', { style: 'display:flex;gap:8px' },
        h('button', { class: 'btn ghost', style: 'flex:1', onclick: () => copyText(text) }, icon('copy', 18), 'Скопировать'),
        h('button', { class: 'btn ghost', style: 'flex:1', onclick: () => {
          const url = URL.createObjectURL(new Blob(['Резервные коды «Тихо» (' + S.me.username + ')\n\n' + text + '\n'], { type: 'text/plain' }));
          const a = h('a', { href: url, download: 'tiho-backup-codes.txt' }); document.body.append(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 2000);
        } }, icon('download', 18), 'Скачать')),
      h('button', { class: 'btn block', onclick: () => close() }, 'Я сохранил коды'),
    ]);
  }

  function openDisable2fa(left) {
    const err = h('div', { class: 'err', role: 'alert' });
    const code = h('input', { class: 'input code-input', autocomplete: 'one-time-code', placeholder: 'код или резервный код', maxlength: 11, 'aria-label': 'Код' });
    const btn = h('button', { class: 'btn danger block' }, 'Отключить защиту');
    const close = modal('Google Authenticator', [
      h('div', { class: 'success-head' }, h('span', { class: 'tfa-badge ok' }, icon('shield', 30)),
        h('b', null, 'Двухфакторная защита включена'),
        h('small', { class: 'muted' }, `Резервных кодов осталось: ${left}`)),
      h('p', { class: 'muted', style: 'margin:0;line-height:1.45' }, 'Чтобы отключить защиту, введите текущий код из приложения или один из резервных кодов.'),
      code, err, btn,
    ]);
    btn.addEventListener('click', async () => {
      btn.disabled = true; err.textContent = '';
      try { await api('/api/2fa/disable', { body: { code: code.value } }); close(); toast('Двухфакторная защита отключена'); }
      catch (e) { err.textContent = e.message; btn.disabled = false; }
    });
  }

  /* ================= ЗАПУСК ================= */
  async function boot() {
    applyTheme();
    if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('/sw.js').catch(() => {});
    if (!window.isSecureContext || !crypto.subtle) {
      authShell(h('div', { class: 'note' }, icon('warn', 18), h('span', null, 'Шифрование работает только по защищённому адресу (https://). Откройте мессенджер через https.')));
      return;
    }
    clear(root).append(h('div', { class: 'splash' }, h('div', { class: 'logo pulse' }, icon('lock', 28))));
    try { S.config = await api('/api/config'); } catch { /* по умолчанию */ }
    let me;
    try { me = await api('/api/me'); } catch (e) {
      if (e.status === 401) return renderAuth('login');
      authShell(h('div', { class: 'note' }, icon('warn', 18), h('span', null, 'Нет связи с сервером. Проверьте интернет.')),
        h('button', { class: 'btn block big', onclick: boot }, 'Повторить'));
      return;
    }
    S.me = me.user;
    const saved = await C.loadKey(me.user.id).catch(() => null);
    if (saved && saved.publicKey === me.publicKey) {
      Object.assign(S, { priv: saved.privateKey, pub: saved.publicKey });
      startApp();
    } else {
      renderUnlock(me.keyBackup, me.publicKey);
    }
  }
  boot();
})();
