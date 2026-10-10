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
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
    userCircle: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.2 18.4a7 7 0 0 1 11.6 0"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.5-.8 1.5-1.5 0-1.2-1-1.5-1-2.5S13.3 15 14.5 15H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
    database: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
    more: '<circle cx="12" cy="5" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="19" r="1.4" fill="currentColor"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.5"/>',
    volume: '<path d="M4 9v6h4l5 4V5L8 9Z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    files: '<path d="M14 3H6v18h12V7Z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>',
    gift: '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13M12 8C10 4 6 4 6 6.5S10 8 12 8ZM12 8c2-4 6-4 6-1.5S14 8 12 8Z"/>',
    starFill: '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9Z" fill="currentColor"/>',
    sparkle: '<path d="M12 3c.8 4.6 2.4 6.2 7 7-4.6.8-6.2 2.4-7 7-.8-4.6-2.4-6.2-7-7 4.6-.8 6.2-2.4 7-7ZM19 15c.3 1.7.9 2.3 2.6 2.6-1.7.3-2.3.9-2.6 2.6-.3-1.7-.9-2.3-2.6-2.6 1.7-.3 2.3-.9 2.6-2.6Z"/>',
    swap: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    eyeOff: '<path d="M3 3l18 18M10.6 6.2A10 10 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.6 6.6C3.8 8.3 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4.4-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    pin: '<path d="M12 17v5"/><path d="M9 10.8V5h6v5.8l2 3.2H7Z"/>',
    up: '<path d="m6 15 6-6 6 6"/>',
    poll: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
    forward: '<path d="m15 5 6 6-6 6"/><path d="M21 11H10a6 6 0 0 0-6 6v2"/>',
    megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1Z"/><path d="M17 8a5 5 0 0 1 0 8M7 14l1.5 5h2.5l-1-4.5"/>',
    video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-3v10l-6-3"/>',
    videoOff: '<path d="M3 3l18 18M16 16v1a1 1 0 0 1-1 1H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2M10 6h4a2 2 0 0 1 2 2v2l6-3v10"/>',
    phoneOff: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" transform="rotate(135 12 12)"/>',
    micOff: '<path d="M3 3l18 18M9 9v2a3 3 0 0 0 5 2.2M15 9.3V6a3 3 0 0 0-5.7-1.3M5 11a7 7 0 0 0 11.3 5.5M19 11a7 7 0 0 1-.6 2.8M12 18v3"/>',
    arrowUp: '<path d="M7 17 17 7M8 7h9v9"/>',
    arrowDown: '<path d="M17 7 7 17M16 17H7V8"/>',
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
    if (opts.raw) { init.body = opts.raw; init.headers['Content-Type'] = opts.type || 'application/octet-stream'; }
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
    document.documentElement.dataset.size = store.get('tiho-size', 'm');
    const t = store.get('tiho-theme', 'auto');
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
  }

  /* ---------- состояние ---------- */
  const S = {
    me: null, priv: null, pub: null, config: { maxFile: 25 * 1024 * 1024 },
    chats: new Map(), msgs: new Map(), plain: new Map(), userKeys: new Map(),
    active: null, filter: 'all', query: '', people: [], typing: new Map(),
    tab: 'chats', page: null, channels: new Map(), cposts: new Map(), channel: null, channelHits: [], folders: [], searchQ: '', wallet: null, catalog: null, reply: null, edit: null, uploads: 0, fresh: new Set(), newBelow: 0, unreadMark: null, fileUrls: new Map(), ws: null, wsDelay: 1000, refs: {},
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
      u?.avatar ? h('img', { src: `/api/avatars/${u.id}?v=${u.avatar}`, alt: '', loading: 'lazy', class: 'av-img' }) : initials(u?.displayName),
      dot && u?.online ? h('span', { class: 'dot' }) : null);
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
    const fwd = p.fwd ? str(p.fwd, 80) : '';
    if (p.t === 'text') return { t: 'text', text: str(p.text, 20000), reply, fwd };
    if (p.t === 'sticker') {
      const pack = str(p.pack, 20), id = str(p.id, 20);
      if (!TihoStickers.svg(pack, id)) throw new Error('bad');
      return { t: 'sticker', pack, id, reply, fwd };
    }
    if (p.t === 'poll') {
      const options = Array.isArray(p.options) ? p.options.slice(0, 10).map((o) => str(o, 100)).filter(Boolean) : [];
      if (options.length < 2) throw new Error('bad');
      return { t: 'poll', question: str(p.question, 200), options, multiple: !!p.multiple, fwd };
    }
    if (p.t === 'file') {
      return { t: 'file', fileId: str(p.fileId, 32), name: str(p.name, 200) || 'файл', size: Number(p.size) || 0,
        mime: str(p.mime, 100), key: str(p.key, 64), iv: str(p.iv, 32), w: Number(p.w) || 0, h: Number(p.h) || 0,
        caption: str(p.caption, 4000), reply, fwd, gif: !!p.gif,
        dur: Math.max(0, Math.min(600, Number(p.dur) || 0)),
        wave: Array.isArray(p.wave) ? p.wave.slice(0, 64).map((v) => Math.max(0, Math.min(1, Number(v) || 0))) : null };
    }
    throw new Error('bad');
  }

  async function decryptMsg(msg, chat) {
    if (msg.kind === 'system') return { t: 'system', text: String(msg.body?.text || '') };
    if (msg.kind === 'deleted') return { t: 'deleted' };
    if (msg.kind === 'gift') return { t: 'gift', ...msg.body };
    if (msg.kind === 'call') return { t: 'call', ...msg.body };
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
  const plainOf = (msg) => msg.kind === 'call' ? { t: 'call', ...msg.body } : msg.kind === 'gift' ? { t: 'gift', ...msg.body } : msg.kind === 'deleted' ? { t: 'deleted' } : (S.plain.get(msg.id) || msg.payload || (msg.kind === 'system' ? { t: 'system', text: msg.body?.text || '' } : undefined));
  function previewOf(p) {
    if (!p) return '…';
    if (p.t === 'text') return p.text.replace(/\s+/g, ' ');
    if (p.t === 'file') return (isGif(p) ? 'GIF' : p.mime.startsWith('image/') ? 'Фото' : p.mime.startsWith('audio/') && p.wave ? 'Голосовое сообщение' : 'Файл: ' + p.name) + (p.caption ? ' · ' + p.caption : '');
    if (p.t === 'system') return p.text;
    if (p.t === 'deleted') return 'Сообщение удалено';
    if (p.t === 'poll') return '📊 ' + p.question;
    if (p.t === 'call') return (p.status === 'ended' ? '📞 ' : '📵 ') + (p.kind === 'video' ? 'Видеозвонок' : 'Звонок');
    if (p.t === 'sticker') return 'Стикер «' + TihoStickers.nameOf(p.pack, p.id) + '»';
    if (p.t === 'gift') return '🎁 ' + ((S.catalog?.gifts || []).find((x) => x.id === p.type)?.name ? `Подарок «${S.catalog.gifts.find((x) => x.id === p.type).name}»` : 'Подарок');
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
    ['lock', 'Приватность', 'Сквозное шифрование: сообщения видите только вы'],
    ['bolt', 'Быстро', 'Сообщения, фото и голосовые доходят мгновенно'],
    ['shield', 'Надёжно', 'Двухфакторный вход и проверка ключей'],
    ['group', 'Для своих', 'Личные чаты и группы для близких'],
  ];
  function authShell(...content) {
    clear(root);
    const hero = h('section', { class: 'auth-hero', 'aria-hidden': 'true' },
      logoMark(96),
      h('div', null, h('p', { class: 'hero-word' }, 'Тихо'), h('p', { class: 'hero-title' }, 'Твои разговоры — только твои')),
      h('ul', { class: 'hero-list' }, FEATURES.map(([ic, t, d]) =>
        h('li', null, h('span', { class: 'hero-ic' }, icon(ic, 20)), h('span', null, h('b', null, t), h('small', null, d))))),
    );
    root.append(h('div', { class: 'auth' }, hero,
      h('section', { class: 'auth-main' }, h('div', { class: 'auth-card' },
        h('div', { class: 'brand mobile-only' }, logoMark(44), h('h1', { class: 'wordmark' }, 'Тихо')),
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
    const searchInput = h('input', { type: 'search', placeholder: 'Поиск', 'aria-label': 'Поиск по чатам и @юзернейму', oninput: onSearch });
    const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Папки' });
    const chatsView = h('div', { class: 'tab-view', 'data-tab': 'chats' },
      h('div', { class: 'side-head' },
        h('div', { class: 'head-row' },
          h('h1', { class: 'wordmark' }, 'Тихо'),
          h('button', { class: 'icon-btn accent', 'aria-label': 'Новая группа', title: 'Новая группа', onclick: () => openPicker('group') }, icon('group', 22, 1.8))),
        h('label', { class: 'search' }, icon('search', 18), searchInput),
        chips),
      list,
      h('button', { class: 'fab', 'aria-label': 'Создать', title: 'Создать', onclick: (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        openMenu(r.right - 220, r.top - 150, [['chat', 'Новый чат', () => openPicker('direct')], ['group', 'Новая группа', () => openPicker('group')], ['megaphone', 'Новый канал', openNewChannel]]);
      } }, icon('edit', 22)));
    const contactsView = h('div', { class: 'tab-view', 'data-tab': 'contacts' });
    const callsView = h('div', { class: 'tab-view', 'data-tab': 'calls' });
    const profileView = h('div', { class: 'tab-view', 'data-tab': 'profile' });
    const tabs = [['chats', 'Чаты', 'chat'], ['contacts', 'Контакты', 'user'], ['calls', 'Звонки', 'phone'], ['profile', 'Профиль', 'userCircle']];
    const tabbar = h('nav', { class: 'tabbar', 'aria-label': 'Разделы' }, tabs.map(([k, label, ic]) =>
      h('button', { 'data-k': k, 'aria-current': String(S.tab === k), onclick: () => setTab(k) },
        h('span', { class: 'tab-ic' }, icon(ic, 24, 1.8), k === 'chats' ? h('span', { class: 'tab-badge' }) : null), label)));
    const side = h('aside', { class: 'side' }, chatsView, contactsView, callsView, profileView, tabbar);
    const pane = h('main', { class: 'pane' });
    const app = h('div', { class: 'app' }, side, pane);
    root.append(app);
    S.searchOpen = false;
    S.refs = { app, list, pane, searchInput, side, tabbar, contactsView, callsView, profileView, chips };
    renderChips();
    api('/api/me/folders').then((r) => { S.folders = r.folders; renderChips(); renderList(); }).catch(() => {});
    setTab(S.tab || 'chats');
    renderList();
    renderPane();
    loadChats().then(openFromLink);
    loadChannels();
    getCatalog().then(() => { renderList(); if (S.active) renderMessages(); }).catch(() => {});
    connect();
  }

  function setTab(k) {
    S.tab = k;
    const { side, tabbar } = S.refs;
    side.querySelectorAll('.tab-view').forEach((v) => { v.hidden = v.dataset.tab !== k; });
    tabbar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.k === k)));
    if (k === 'contacts') renderContacts();
    if (k === 'calls') renderCalls();
    if (k === 'profile') renderProfileTab();
  }
  function renderMe() { if (S.tab === 'profile') renderProfileTab(); }

  /* «был(а) в сети» */
  function seenText(u) {
    if (!u) return '';
    if (u.online) return 'в сети';
    if (!u.lastSeen) return 'был(а) давно';
    const diff = Date.now() - u.lastSeen;
    if (diff < 60000) return 'был(а) только что';
    if (diff < 3600000) { const m = Math.floor(diff / 60000); return `был(а) ${m} ${plural(m, 'минуту', 'минуты', 'минут')} назад`; }
    if (sameDay(u.lastSeen, Date.now())) return 'был(а) сегодня в ' + hm(u.lastSeen);
    if (sameDay(u.lastSeen, Date.now() - 86400000)) return 'был(а) вчера в ' + hm(u.lastSeen);
    return 'был(а) ' + new Date(u.lastSeen).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  }

  /* ---------- Контакты ---------- */
  function allContacts() {
    const seen = new Map();
    for (const c of S.chats.values()) for (const m of c.members) if (m.id !== S.me.id && !seen.has(m.id)) seen.set(m.id, m);
    return [...seen.values()];
  }
  let contactQuery = '', contactFound = [], contactTimer;
  function renderContacts() {
    const v = S.refs.contactsView;
    const keep = v.querySelector('input')?.value ?? contactQuery;
    const input = h('input', { type: 'search', placeholder: 'Поиск по имени или @юзернейму', 'aria-label': 'Поиск контактов', value: keep });
    input.addEventListener('input', () => {
      contactQuery = input.value.trim();
      clearTimeout(contactTimer);
      const qv = contactQuery.replace(/^@/, '');
      if (qv.length < 2) { contactFound = []; drawList(); return; }
      contactTimer = setTimeout(async () => {
        try { contactFound = (await api('/api/users/search?q=' + encodeURIComponent(qv))).users; } catch { contactFound = []; }
        drawList();
      }, 250);
      drawList();
    });
    const listEl = h('ul', { class: 'chat-list contacts' });
    const drawList = () => {
      clear(listEl);
      const qv = contactQuery.replace(/^@/, '').toLowerCase();
      const mine = allContacts();
      let people = mine.filter((u) => !qv || u.displayName.toLowerCase().includes(qv) || u.username.toLowerCase().includes(qv));
      const known = new Set(mine.map((u) => u.id));
      const extra = qv.length >= 2 ? contactFound.filter((u) => !known.has(u.id)) : [];
      people.sort((a, b) => a.displayName.localeCompare(b.displayName, 'ru'));
      listEl.append(h('li', null, h('button', { class: 'chat-item add-row', onclick: () => openPicker('direct') },
        h('span', { class: 'add-ic' }, icon('plus', 22, 2.2)), h('span', { class: 'ci-name' }, 'Добавить контакт'))));
      let letter = '';
      for (const u of people) {
        const l = (u.displayName[0] || '#').toUpperCase();
        if (l !== letter) { letter = l; listEl.append(h('li', { class: 'letter' }, l)); }
        listEl.append(contactRow(u));
      }
      if (extra.length) {
        listEl.append(h('li', { class: 'list-label' }, 'Найдено по юзернейму'));
        extra.forEach((u) => listEl.append(contactRow(u)));
      }
      if (!people.length && !extra.length) {
        listEl.append(h('li', { class: 'list-empty' }, qv ? (qv.length < 2 ? 'Введите ещё символ' : `Никого не нашли по «${qv}»`)
          : 'Контакты появятся, когда вы начнёте переписку. Нажмите «Добавить контакт» и найдите человека по юзернейму.'));
      }
    };
    clear(v).append(
      h('div', { class: 'side-head' }, h('div', { class: 'head-row' }, h('h1', { class: 'page-title' }, 'Контакты')),
        h('label', { class: 'search' }, icon('search', 18), input)),
      listEl);
    drawList();
  }
  function contactRow(u) {
    return h('li', null, h('button', { class: 'chat-item', onclick: () => openPage({ type: 'contact', userId: u.id, user: u }) },
      userAvatar(u, 48, true),
      h('div', { class: 'ci-body' }, h('span', { class: 'ci-name' }, u.displayName),
        h('span', { class: 'ci-prev' + (u.online ? ' on' : '') }, seenText(u)))));
  }

  /* ---------- Профиль и настройки ---------- */
  function renderProfileTab() {
    const v = S.refs.profileView;
    if (!S.wallet) getWallet().then(() => { if (S.tab === 'profile') renderProfileTab(); }).catch(() => {});
    const row = (ic, title, sub, fn, cls) => h('button', { class: 'card-row' + (cls ? ' ' + cls : ''), onclick: fn },
      h('span', { class: 'ic' }, icon(ic, 20, 1.8)), h('span', { class: 'grow' }, h('b', null, title), sub ? h('small', null, sub) : null),
      cls ? null : h('span', { class: 'chev' }, icon('chevron', 18)));
    clear(v).append(
      h('div', { class: 'side-head' }, h('div', { class: 'head-row' }, h('h1', { class: 'page-title' }, 'Настройки'))),
      h('div', { class: 'settings-list' },
        h('div', { class: 'card' }, h('button', { class: 'card-row me-row', onclick: openMyProfile },
          userAvatar(S.me, 56), h('span', { class: 'grow' }, h('b', null, S.me.displayName), h('small', null, '@' + S.me.username + (S.me.bio ? ' · ' + S.me.bio : ''))),
          h('span', { class: 'chev' }, icon('chevron', 18)))),
        h('div', { class: 'card' },
          h('button', { class: 'card-row', onclick: openWallet }, h('span', { class: 'ic star-ic' }, icon('starFill', 20, 0)),
            h('span', { class: 'grow' }, h('b', null, 'Звёзды'), h('small', null, 'Баланс и ежедневный бонус')),
            S.wallet ? starBadge(S.wallet.stars) : null, h('span', { class: 'chev' }, icon('chevron', 18))),
          row('gift', 'Мои подарки', 'Коллекция в вашем профиле', openMyGifts)),
        h('div', { class: 'card' },
          row('bell', 'Уведомления', 'Звук, текст в уведомлениях', openNotifications),
          row('shield', 'Конфиденциальность', 'Google, двухфакторная защита, ключ шифрования', openPrivacy),
          row('palette', 'Внешний вид', 'Тема, размер текста', openAppearance),
          row('database', 'Данные и хранилище', 'Кеш файлов на устройстве', openStorage)),
        h('div', { class: 'card' }, row('help', 'Помощь', 'Как работает шифрование, частые вопросы', openHelp)),
        h('div', { class: 'card' }, row('logout', 'Выйти', null, logout, 'danger-row'))));
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
    if (qv.length < 2) { S.people = []; S.channelHits = []; return; }
    searchTimer = setTimeout(async () => {
      try {
        const [{ users }, ch] = await Promise.all([api('/api/users/search?q=' + encodeURIComponent(qv)), api('/api/channels/search?q=' + encodeURIComponent(qv)).catch(() => ({ channels: [] }))]);
        if (S.query.replace(/^@/, '') === qv) { S.people = users; S.channelHits = ch.channels; renderList(); }
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
    const archivedAll = chats.filter((c) => c.archived);
    if (S.filter === 'archive') chats = archivedAll;
    else if (!qv) chats = chats.filter((c) => !c.archived);
    if (S.filter.startsWith('f:')) { const f = (S.folders || []).find((x) => 'f:' + x.id === S.filter); chats = chats.filter((c) => f?.chatIds.includes(c.id)); }
    if (S.filter === 'all' && !qv && archivedAll.length) {
      const un = archivedAll.reduce((n, c) => n + (c.unread || 0), 0);
      list.append(h('li', null, h('button', { class: 'chat-item archive-row', onclick: () => { S.filter = 'archive'; renderChips(); renderList(); } },
        h('span', { class: 'add-ic' }, icon('database', 22, 1.8)),
        h('div', { class: 'ci-body' }, h('span', { class: 'ci-name' }, 'Архив'),
          h('span', { class: 'ci-prev' }, archivedAll.map((c) => chatTitle(c)).slice(0, 3).join(', '))),
        un ? h('span', { class: 'badge muted-badge' }, un) : null)));
    }
    if (S.filter === 'archive') {
      list.append(h('li', null, h('button', { class: 'chat-item archive-row', onclick: () => { S.filter = 'all'; renderChips(); renderList(); } },
        h('span', { class: 'add-ic' }, icon('back', 22)), h('span', { class: 'ci-name' }, 'Выйти из архива'))));
    }
    if (S.filter === 'direct' || S.filter === 'group') chats = chats.filter((c) => c.type === S.filter);
    if (S.filter === 'channels') chats = [];
    let chans = ['all', 'channels', 'unread'].includes(S.filter) ? [...S.channels.values()].filter((c) => c.subscribed) : [];
    if (S.filter === 'unread') chans = chans.filter((c) => c.unread > 0);
    if (qv) chans = chans.filter((c) => c.title.toLowerCase().includes(qv) || c.slug.toLowerCase().includes(qv.replace(/^@/, '')));
    if (S.filter === 'unread') chats = chats.filter((c) => c.unread > 0);
    if (qv) chats = chats.filter((c) => chatTitle(c).toLowerCase().includes(qv) ||
      (c.type === 'direct' && other(c)?.username.toLowerCase().includes(qv.replace(/^@/, ''))));

    const mixed = chats.map((c) => ({ t: lastTs(c), c })).concat(chans.map((c) => ({ t: chLastTs(c), ch: c }))).sort((x, y) => y.t - x.t);
    if (qv && mixed.length) list.append(h('li', { class: 'list-label' }, 'Чаты'));
    for (const row of mixed) {
      if (row.ch) { list.append(channelItem(row.ch)); continue; }
      const c = row.c;
      const lm = c.lastMessage;
      const p = lm ? plainOf(lm) : null;
      const ty = typingText(c.id);
      let prev = lm ? previewOf(p) : 'Нет сообщений';
      if (lm && lm.kind === 'msg') {
        if (lm.senderId === S.me.id) prev = 'Вы: ' + prev;
        else if (c.type === 'group') prev = (memberOf(c, lm.senderId)?.displayName.split(' ')[0] || '…') + ': ' + prev;
      }
      const item = h('button', {
        class: 'chat-item', 'aria-current': String(S.active === c.id), onclick: () => openChat(c.id),
        oncontextmenu: (e) => { e.preventDefault(); chatMenu(c, e.clientX, e.clientY); } },
      avatar(c, 52),
      h('div', { class: 'ci-body' },
        h('div', { class: 'ci-row' },
          c.type === 'group' ? h('span', { class: 'muted', title: 'Группа' }, icon('group', 15)) : null,
          h('span', { class: 'ci-name' }, chatTitle(c)),
          h('span', { class: 'ci-time' + (c.unread ? ' hot' : '') }, shortTime(lastTs(c)))),
        h('div', { class: 'ci-row' },
          ty ? h('span', { class: 'ci-prev typing' }, dots(), ty) : h('span', { class: 'ci-prev' }, prev),
          c.unread ? h('span', { class: 'badge', 'aria-label': `${c.unread} непрочитанных` }, c.unread > 99 ? '99+' : c.unread) : null)));
      longPress(item, (x, y) => chatMenu(c, x, y));
      list.append(h('li', null, item));
    }
    if (!qv && S.filter.startsWith('f:') && !chats.length) list.append(h('li', { class: 'list-empty' }, 'В папке пока нет чатов. Нажмите и удерживайте чат в списке → «Добавить в папку».'));
    const subIds = new Set(chans.map((c) => c.id));
    const foundCh = qv ? S.channelHits.filter((c) => !subIds.has(c.id)) : [];
    if (foundCh.length) { list.append(h('li', { class: 'list-label' }, 'Каналы')); foundCh.forEach((c) => list.append(channelItem(c))); }
    if (S.filter === 'channels' && !qv && !chans.length) list.append(h('li', { class: 'list-empty' }, 'Вы пока не подписаны на каналы. Найдите канал через поиск или создайте свой: кнопка-карандаш → «Новый канал».'));
    if (qv && S.people.length) {
      const directIds = new Set([...S.chats.values()].filter((c) => c.type === 'direct').map((c) => other(c)?.id));
      const fresh = S.people.filter((u) => !directIds.has(u.id) || !chats.some((c) => c.type === 'direct' && other(c)?.id === u.id));
      if (fresh.length) {
        list.append(h('li', { class: 'list-label' }, 'Люди'));
        for (const u of fresh) {
          list.append(h('li', null, h('button', { class: 'chat-item', onclick: () => openDirect(u.id) },
            userAvatar(u, 52),
            h('div', { class: 'ci-body' }, h('span', { class: 'ci-name' }, u.displayName), h('span', { class: 'ci-prev uname' }, '@' + u.username)),
            h('span', { class: 'chip-status on' }, 'Написать'))));
        }
      }
    }
    if (!list.children.length) {
      const uq = qv.replace(/^@/, '');
      if (qv) {
        list.append(h('li', { class: 'list-empty' }, uq.length < 2 ? 'Введите ещё символ'
          : /^[a-z0-9_]+$/i.test(uq) ? `Пользователь @${uq} не найден. Проверьте написание юзернейма.` : 'Ничего не найдено'));
      } else {
        list.append(h('li', { class: 'list-empty' },
          h('div', { class: 'empty-ic' }, icon('search', 28)),
          h('b', null, 'Здесь пока пусто'),
          h('span', null, 'Найдите собеседника по юзернейму или отправьте ему свою ссылку.'),
          h('div', { class: 'empty-actions' },
            h('button', { class: 'btn', onclick: () => S.refs.searchInput?.focus() }, icon('search', 18), 'Найти по юзернейму'),
            h('button', { class: 'btn ghost', onclick: shareMyLink }, icon('link', 18), 'Моя ссылка'))));
      }
    }
  }

  function updateTitle() {
    const n = [...S.chats.values()].reduce((s, c) => s + (c.unread || 0), 0) + [...S.channels.values()].reduce((s, c) => s + (c.subscribed ? c.unread || 0 : 0), 0);
    document.title = n ? `(${n}) Тихо` : 'Тихо';
    const tb = S.refs.tabbar?.querySelector('.tab-badge');
    if (tb) { tb.textContent = n > 99 ? '99+' : n; tb.style.display = n ? '' : 'none'; }
  }

  const myLink = () => `${location.origin}/@${S.me.username}`;
  async function shareMyLink() {
    const url = myLink();
    if (navigator.share && COARSE) {
      try { await navigator.share({ title: 'Тихо', text: `Напиши мне в «Тихо»: @${S.me.username}`, url }); return; } catch { /* отменили */ }
    }
    copyText(url);
  }
  /* Открыли ссылку вида /@username — сразу открываем чат с этим человеком */
  async function openFromLink() {
    const cm = /^\/c\/([a-zA-Z0-9_]{4,32})\/?$/.exec(location.pathname);
    if (cm) {
      history.replaceState(null, '', '/');
      try { const { channel } = await api('/api/channels/by-slug/' + encodeURIComponent(cm[1])); openChannel(channel, true); }
      catch { toast('Канал не найден'); }
      return;
    }
    const m = /^\/@([a-zA-Z0-9_]{3,32})\/?$/.exec(location.pathname);
    if (!m) return;
    history.replaceState(null, '', '/');
    if (m[1].toLowerCase() === S.me.username.toLowerCase()) { toast('Это ваша ссылка — отправьте её собеседнику'); return; }
    try {
      const { user } = await api('/api/users/by-name/' + encodeURIComponent(m[1]));
      openDirect(user.id);
    } catch { toast(`Пользователь @${m[1]} не найден`); }
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
    const wasOpen = S.active != null || !!S.page || S.channel != null;
    S.page = null; S.channel = null;
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
  window.addEventListener('popstate', () => {
    if (!MOBILE()) return;
    if (S.page) closePage(); else if (S.channel != null) closeChannel(); else if (S.active != null) closeChat();
  });
  function openPage(page) {
    const was = S.page || S.active != null;
    S.page = page;
    S.refs.app.classList.add('in-chat');
    if (MOBILE()) history.pushState({ page: 1 }, '');
    else if (!was) { /* на компьютере просто показываем справа */ }
    renderPane();
  }
  function closePage() {
    S.page = null;
    if (S.active == null && S.channel == null) S.refs.app.classList.remove('in-chat');
    renderPane();
  }
  function openChatPage(chat) {
    if (chat.type === 'group') openPage({ type: 'group', chatId: chat.id });
    else { const o = other(chat); openPage({ type: 'contact', userId: o.id, user: o }); }
  }

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
      return { text: seenText(o), cls: o?.online ? 'on' : '' };
    }
    const n = chat.members.length;
    const on = chat.members.filter((m) => m.online && m.id !== S.me.id).length;
    return { text: `${n} ${plural(n, 'участник', 'участника', 'участников')}${on ? `, ${on} в сети` : ''}`, cls: '' };
  }

  function renderPane() {
    const pane = clear(S.refs.pane);
    if (S.page) { S.refs.msgs = null; S.refs.head = null; return renderPage(pane); }
    if (S.channel != null && S.channels.has(S.channel)) return renderChannel(pane);
    const chat = S.chats.get(S.active);
    if (!chat) {
      pane.append(h('div', { class: 'empty-pane' },
        logoMark(72),
        h('b', { style: 'font-size:20px;color:var(--text)' }, 'Тихо'),
        h('span', null, 'Твои разговоры — только твои. Выберите чат слева.')));
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
    const pinBox = h('div');
    pane.append(head, pinBox, keyWarnBox, h('div', { class: 'msgs-wrap' }, msgs, down), composer.el);
    Object.assign(S.refs, { head, keyWarnBox, msgs, inner, typingRow, composer, down, downBadge, pinBox });
    S.searchQ = ''; S.searchOpen = false;
    pane.style.position = 'relative';
    setupDrop(pane);
    renderHead();
    renderPinned();
    renderMessages('bottom');
    if (!COARSE) composer.input.focus();
  }

  /* ---------- Страница контакта / группы ---------- */
  const logoMark = (size = 40) => h('div', { class: 'logo-mark', style: `width:${size}px;height:${size}px;border-radius:${Math.round(size * .3)}px` }, icon('chat', Math.round(size * .56), 2.2));
  const freshUser = (id) => { for (const c of S.chats.values()) { const m = memberOf(c, id); if (m) return m; } return null; };
  const directWith = (id) => [...S.chats.values()].find((c) => c.type === 'direct' && c.members.some((m) => m.id === id) && (id === S.me.id || c.members.some((m) => m.id !== S.me.id)));
  const URL_RE = /\bhttps?:\/\/[^\s<>"]+[^\s<>".,;:!?)\]]/g;
  function chatStuff(chat) {
    const out = { images: [], files: [], links: [] };
    const box = chat && S.msgs.get(chat.id);
    for (const m of box?.list || []) {
      const p = plainOf(m);
      if (!p) continue;
      if (p.t === 'file') {
        if (p.mime.startsWith('image/')) out.images.push(p);
        else if (!(p.mime.startsWith('audio/') && p.wave)) out.files.push(p);
      }
      const text = p.t === 'text' ? p.text : p.t === 'file' ? p.caption : '';
      for (const u of (text || '').match(URL_RE) || []) out.links.push(u);
    }
    out.images.reverse(); out.files.reverse(); out.links.reverse();
    return out;
  }
  function thumb(p, size) {
    const b = h('button', { class: 'thumb', style: `width:${size}px;height:${size}px`, 'aria-label': 'Открыть фото' }, h('span', { class: 'spin sm dark' }));
    getFileUrl(p).then((url) => { clear(b).append(h('img', { src: url, alt: '' })); b.onclick = () => openViewer(url, p.name); }).catch(() => clear(b).append(icon('image', 20)));
    return b;
  }
  async function renderPage(pane) {
    const pg = S.page;
    const back = h('button', { class: 'icon-btn', 'aria-label': 'Назад', onclick: () => (history.state?.page ? history.back() : closePage()) }, icon('back', 24));
    const body = h('div', { class: 'page' });
    pane.append(h('header', { class: 'chat-head page-head' }, back, h('span', { style: 'flex:1' })), body);
    const isGroup = pg.type === 'group';
    const chat = isGroup ? S.chats.get(pg.chatId) : directWith(pg.userId);
    if (isGroup && !chat) return closePage();
    const u = isGroup ? null : (freshUser(pg.userId) || pg.user);
    const action = (ic, label, fn) => h('button', { class: 'pg-action', onclick: fn }, icon(ic, 22, 1.8), h('span', null, label));

    const hero = isGroup
      ? h('div', { class: 'pg-hero' }, avatar(chat, 120), h('h2', null, chat.title),
        h('span', { class: 'muted' }, `${chat.members.length} ${plural(chat.members.length, 'участник', 'участника', 'участников')}`))
      : h('div', { class: 'pg-hero' }, userAvatar(u, 120), h('h2', null, u.displayName),
        h('span', { class: 'pg-seen' + (u.online ? ' on' : '') }, seenText(u)),
        h('span', { class: 'muted' }, '@' + u.username),
        u.bio ? h('p', { class: 'pg-bio' }, u.bio) : null);
    const actions = isGroup
      ? h('div', { class: 'pg-actions' },
        action('chat', 'Написать', () => openChat(chat.id)),
        action('plus', 'Добавить', () => openPicker('add', chat.id)),
        action('shield', 'Шифрование', () => openInfo(chat.id)),
        action('leave', 'Выйти', async () => {
          if (!confirm(`Покинуть группу «${chat.title}»?`)) return;
          try { await api(`/api/chats/${chat.id}/leave`, { method: 'POST' }); closePage(); } catch (e) { toast(e.message); }
        }))
      : h('div', { class: 'pg-actions' },
        action('chat', 'Написать', () => openDirect(u.id)),
        action('phone', 'Звонок', () => startCall(u, 'audio')),
        action('video', 'Видео', () => startCall(u, 'video')),
        action('shield', 'Ключ', async () => { if (chat) openInfo(chat.id); else toast('Сначала напишите собеседнику'); }),
        action('gift', 'Подарить', () => openGiftShop(u)));
    const listCard = h('div', { class: 'card pg-list' });
    const giftsBox = h('div', { class: 'section' });
    body.append(hero, actions, giftsBox, listCard);
    if (!isGroup) {
      api(`/api/users/${u.id}/gifts`).then(({ gifts }) => {
        if (S.page !== pg || !gifts.length) return;
        giftsBox.append(h('div', { class: 'section-title' }, `Подарки · ${gifts.length}`), giftGrid(gifts.slice(0, 12), 84));
      }).catch(() => {});
    }

    const fill = () => {
      if (S.page !== pg) return;
      const st = chatStuff(chat);
      const groups = isGroup ? [] : [...S.chats.values()].filter((c) => c.type === 'group' && c.members.some((m) => m.id === u.id));
      const row = (ic, label, count, fn) => h('button', { class: 'card-row', onclick: fn, disabled: !count },
        h('span', { class: 'ic' }, icon(ic, 19, 1.9)), h('span', { class: 'grow' }, h('b', null, label)),
        h('span', { class: 'muted' }, String(count)), h('span', { class: 'chev' }, icon('chevron', 18)));
      const searchRow = !isGroup && chat ? h('button', { class: 'card-row', onclick: () => { closePage(); if (S.active !== chat.id) openChat(chat.id); setTimeout(openSearch, 50); } },
        h('span', { class: 'ic' }, icon('search', 19, 1.9)), h('span', { class: 'grow' }, h('b', null, 'Поиск по сообщениям')), h('span', { class: 'chev' }, icon('chevron', 18))) : null;
      clear(listCard).append(...[searchRow,
        row('image', 'Медиа', st.images.length, () => modal('Медиа', [h('div', { class: 'media-grid' }, st.images.map((p) => thumb(p, 104)))])),
        st.images.length ? h('div', { class: 'media-strip' }, st.images.slice(0, 4).map((p) => thumb(p, 72))) : null,
        row('files', 'Файлы', st.files.length, () => modal('Файлы', [h('div', { class: 'file-list' }, st.files.map((p) => fileEl(p)))])),
        row('link', 'Ссылки', st.links.length, () => modal('Ссылки', [h('div', { class: 'card' }, st.links.map((l) =>
          h('a', { class: 'card-row', href: l, target: '_blank', rel: 'noopener noreferrer' }, h('span', { class: 'ic' }, icon('link', 18)), h('span', { class: 'grow link-text' }, l))))])),
        isGroup ? null : row('group', 'Общие группы', groups.length, () => {
          const close = modal('Общие группы', [h('div', { class: 'card' }, groups.map((g) => h('button', { class: 'card-row', onclick: () => { close(); openChat(g.id); } },
            avatar(g, 40), h('span', { class: 'grow' }, h('b', null, g.title), h('small', null, `${g.members.length} ${plural(g.members.length, 'участник', 'участника', 'участников')}`)))))]);
        })].filter(Boolean));
      if (isGroup) {
        body.querySelector('.pg-members')?.remove();
        body.append(h('div', { class: 'section pg-members' }, h('div', { class: 'section-title' }, 'Участники'),
          h('div', { class: 'card' }, chat.members.map((m) => h(m.id === S.me.id ? 'div' : 'button', {
            class: 'card-row', onclick: m.id === S.me.id ? null : () => openPage({ type: 'contact', userId: m.id, user: m }) },
          userAvatar(m, 40, true), h('span', { class: 'grow' }, h('b', null, m.displayName + (m.id === S.me.id ? ' (вы)' : '')), h('small', null, seenText(m))))))));
      }
    };
    fill();
    if (chat && !S.msgs.has(chat.id)) { await loadMessages(chat.id); fill(); }
  }

  function renderHead() {
    const chat = S.chats.get(S.active);
    const head = S.refs.head;
    if (!chat || !head || S.searchOpen) return;
    clear(head);
    const st = statusLine(chat);
    head.append(
      h('button', { class: 'icon-btn back', 'aria-label': 'Назад к чатам', onclick: () => (history.state?.chat ? history.back() : closeChat()) }, icon('back', 24)),
      h('button', { class: 'head-av', 'aria-label': 'Профиль', onclick: () => openChatPage(chat) }, avatar(chat, 42)),
      h('button', { class: 'head-title', onclick: () => openChatPage(chat) },
        h('b', null, chatTitle(chat)), h('small', { class: st.cls }, st.cls === 'typing' ? dots() : null, st.text)),
      chat.type === 'direct' ? h('button', { class: 'icon-btn', 'aria-label': 'Аудиозвонок', title: 'Аудиозвонок', onclick: () => startCall(other(chat), 'audio') }, icon('phone', 21, 1.8)) : null,
      chat.type === 'direct' ? h('button', { class: 'icon-btn', 'aria-label': 'Видеозвонок', title: 'Видеозвонок', onclick: () => startCall(other(chat), 'video') }, icon('video', 22, 1.8)) : null,
      h('button', { class: 'icon-btn' + (chat.type === 'direct' ? ' hide-sm' : ''), 'aria-label': 'Поиск по сообщениям', title: 'Поиск', onclick: openSearch }, icon('search', 22, 1.8)),
      h('button', { class: 'icon-btn hide-sm', 'aria-label': 'Код безопасности', title: 'Код безопасности', onclick: () => openInfo(chat.id) }, icon('shield', 22, 1.8)),
      h('button', { class: 'icon-btn', 'aria-label': chat.type === 'group' ? 'О группе' : 'Профиль собеседника', onclick: () => openChatPage(chat) }, icon('more', 22)));
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
    if (p.t === 'call') return callPill(m, p, chat);
    const mine = m.senderId === S.me.id;
    const near = (a, b) => a && b && a.kind === 'msg' && b.kind === 'msg' && a.senderId === b.senderId && p.t !== 'gift' &&
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
    if (p.fwd) bubble.append(h('span', { class: 'fwd' }, icon('forward', 13), 'Переслано от ' + p.fwd));
    if (p.reply) {
      bubble.append(h('button', { class: 'quote', onclick: () => jumpTo(p.reply.id) }, h('b', null, p.reply.name), h('span', null, p.reply.text)));
    }
    if (p.t === 'text') {
      bubble.append(...highlight(linkify(p.text)), meta);
    } else if (p.t === 'sticker') {
      bubble.classList.add('sticker-b');
      bubble.append(h('div', { class: 'sticker', role: 'img', 'aria-label': 'Стикер ' + TihoStickers.nameOf(p.pack, p.id) }, TihoStickers.el(p.pack, p.id)), meta);
    } else if (p.t === 'poll') {
      bubble.classList.add('poll-b');
      bubble.append(pollEl(m, p, chat), meta);
    } else if (p.t === 'gift') {
      bubble.classList.add('gift-b');
      bubble.append(giftBubble(m, p, mine, sender), meta);
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
    const live = p.t !== 'error' && p.t !== 'deleted' && p.t !== 'gift' && !m.pending;
    const actions = live ? h('div', { class: 'msg-actions' },
      h('button', { 'aria-label': 'Ответить', title: 'Ответить', onclick: () => setReply(m, p, senderName) }, icon('reply', 18)),
      p.t === 'text' ? h('button', { 'aria-label': 'Копировать', title: 'Копировать', onclick: () => copyText(p.text) }, icon('copy', 17)) : null) : null;
    if (live) {
      const items = [
        ['reply', 'Ответить', () => setReply(m, p, senderName)],
        p.t === 'text' && ['copy', 'Копировать текст', () => copyText(p.text)],
        isGif(p) && ['image', 'Сохранить в «Мои GIF»', () => { saveGif(p); toast('GIF сохранён'); }],
        p.t === 'file' && ['download', 'Скачать файл', () => downloadFile(p)],
        p.t === 'file' && p.caption && ['copy', 'Копировать подпись', () => copyText(p.caption)],
        ['forward', 'Переслать', () => forwardMessage(m, p, senderName)],
        chat.pinned?.id === m.id ? ['pin', 'Открепить', () => pinMessage(chat, null)] : ['pin', 'Закрепить', () => pinMessage(chat, m)],
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
    const btn = h('button', { class: 'img-box', 'aria-label': (isGif(p) ? 'Открыть GIF: ' : 'Открыть фото: ') + p.name, style: `width:${w}px` }, ph,
      isGif(p) ? h('span', { class: 'gif-badge' }, 'GIF') : null);
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
    const attachBtn = h('button', { class: 'icon-btn', style: 'color:var(--muted)', 'aria-label': 'Прикрепить фото или файл', title: 'Прикрепить', onclick: (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      const items = [['image', 'Фото или файл', () => fileInput.click()], ['poll', 'Опрос', () => openPollEditor(chat)]];
      if (chat.type === 'direct') items.push(['gift', 'Подарок', () => openGiftShop(other(chat))]);
      openMenu(r.left, r.top - 160, items);
    } }, icon('attach', 24, 1.8));
    const media = buildMediaPanel(chat, input);
    const emojiBtn = h('button', { type: 'button', class: 'emoji-btn', 'aria-label': 'Эмодзи и стикеры', 'aria-expanded': 'false', onclick: (ev) => {
      ev.preventDefault();
      emojiBtn.setAttribute('aria-expanded', String(media.toggle()));
    } }, icon('smile', 22, 1.8));
    const row = h('div', { class: 'composer' }, attachBtn, h('div', { class: 'field' }, input, emojiBtn), actionBtn, fileInput);
    const el = h('div', { class: 'composer-wrap' }, replyBox, uploadBox, media.el, row);

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
    const chatId = opts.chatId || S.active;
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
          key: encd.key, iv: encd.iv, w, h: hh, caption, ...(opts.voice || {}), ...(opts.gif || file.type === 'image/gif' ? { gif: true } : {}) }, chatId);
        if (opts.gif || file.type === 'image/gif') saveGif({ fileId: id, name: file.name, size: file.size, mime: file.type || 'image/gif', key: encd.key, iv: encd.iv, w, h: hh });
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

  let audioCtx;
  function beep() {
    try {
      audioCtx = audioCtx || new AudioContext();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(880, audioCtx.currentTime); o.frequency.exponentialRampToValueAtTime(660, audioCtx.currentTime + 0.12);
      g.gain.setValueAtTime(0.0001, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
      o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.26);
    } catch { /* без звука */ }
  }
  function notify(chat, msg) {
    if (store.get('tiho-sound', false)) beep();
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
      if (S.wsReconnect) { loadChats(); loadChannels(); }
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
        renderPinned();
        const box = S.msgs.get(d.chat.id);
        if (box && d.chat.lastMessage && !box.list.some((m) => m.id === d.chat.lastMessage.id)) box.list = mergeList(box.list, [d.chat.lastMessage]);
        renderHead(); renderMessages();
      }
      renderList(); updateTitle();
      return;
    }
    if (d.type === 'messageUpdated') return applyUpdated(d.message);
    if (d.type === 'call') return onCallSignal(d);
    if (d.type === 'callsChanged') { if (S.tab === 'calls') renderCalls(); return; }
    if (d.type === 'channelPost') {
      const c = S.channels.get(d.channelId);
      if (!c) return loadChannels();
      const viewing = S.channel === c.id && !document.hidden;
      if (d.post.author?.id !== S.me.id && !viewing) c.unread = (c.unread || 0) + 1;
      addPost(c.id, d.post); updateTitle();
      return;
    }
    if (d.type === 'channelPostUpdated') { api(`/api/channels/${d.channelId}/posts/${d.postId}`).then((r) => replacePost(d.channelId, r.post)).catch(() => {}); return; }
    if (d.type === 'channelPostDeleted') return removePost(d.channelId, d.postId);
    if (d.type === 'channel') return loadChannels();
    if (d.type === 'channelRemoved') return dropChannel(d.channelId);
    if (d.type === 'votes') {
      const m = S.msgs.get(d.chatId)?.list.find((x) => x.id === d.messageId);
      if (m) { m.votes = d.votes; if (S.active === d.chatId) renderMessages('keep'); }
      return;
    }
    if (d.type === 'wallet') { S.wallet = { ...(S.wallet || {}), ...d.wallet }; if (S.tab === 'profile') renderProfileTab(); return; }
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
      for (const c of S.chats.values()) { const m = memberOf(c, d.userId); if (m) { m.online = d.online; if (!d.online) m.lastSeen = d.lastSeen; } }
      renderList(); renderHead();
      if (S.tab === 'contacts') renderContacts();
      if (S.page?.type === 'contact' && S.page.userId === d.userId) renderPane();
      return;
    }
    if (d.type === 'user') {
      for (const c of S.chats.values()) {
        const m = memberOf(c, d.user.id);
        if (m) Object.assign(m, { displayName: d.user.displayName, bio: d.user.bio, avatar: d.user.avatar, color: d.user.color });
      }
      if (d.user.id === S.me.id) { Object.assign(S.me, d.user); renderMe(); }
      renderList(); renderHead();
      if (S.tab === 'contacts') renderContacts();
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
    const search = h('input', { class: 'input', type: 'search', placeholder: '@юзернейм или имя', autocapitalize: 'none' });
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
          qv.length >= 2 ? `Никого не нашли по «${qv}»` : 'Начните вводить юзернейм собеседника')));
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
    if (mode === 'direct') body.push(h('button', { class: 'btn ghost block', onclick: () => { close(); shareMyLink(); } }, icon('link', 18), 'Отправить свою ссылку'));
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

  /* ---------- разделы настроек ---------- */
  const settingsSw = (key, label, sub, ic, onTurnOn) => {
    const b = h('button', { class: 'sw', role: 'switch', 'aria-checked': String(store.get(key, false)), 'aria-label': label });
    b.addEventListener('click', async () => {
      let v = b.getAttribute('aria-checked') !== 'true';
      if (v && onTurnOn) v = await onTurnOn();
      store.set(key, v); b.setAttribute('aria-checked', String(v));
    });
    return h('div', { class: 'card-row' }, h('span', { class: 'ic' }, icon(ic, 19, 1.9)), h('span', { class: 'grow' }, h('b', null, label), h('small', null, sub)), b);
  };

  function openMyProfile() {
    const nameInput = h('input', { class: 'input', value: S.me.displayName, maxlength: 64 });
    const bioInput = h('input', { class: 'input', value: S.me.bio || '', maxlength: 140, placeholder: 'Например: Всё будет хорошо' });
    const avBox = h('div', { class: 'av-edit' });
    const fileIn = h('input', { type: 'file', accept: 'image/*', class: 'sr', tabindex: '-1', 'aria-hidden': 'true' });
    const drawAv = () => clear(avBox).append(userAvatar(S.me, 112),
      h('button', { class: 'av-cam', 'aria-label': 'Изменить фото', onclick: () => fileIn.click() }, icon('camera', 20, 2)));
    drawAv();
    fileIn.addEventListener('change', async () => {
      const f = fileIn.files[0]; fileIn.value = '';
      if (!f) return;
      try {
        const blob = await squareImage(f, 320);
        const { user } = await api('/api/me/avatar', { raw: blob, type: 'image/jpeg' });
        S.me = user; drawAv(); renderMe(); toast('Фото обновлено');
      } catch (e) { toast(e.message || 'Не удалось загрузить фото'); }
    });
    const save = h('button', { class: 'btn block', onclick: async () => {
      try {
        const { user } = await api('/api/me', { method: 'PATCH', body: { displayName: nameInput.value, bio: bioInput.value } });
        S.me = user; renderMe(); close(); toast('Профиль сохранён');
      } catch (e) { toast(e.message); }
    } }, 'Сохранить');
    const close = modal('Мой профиль', [
      h('div', { class: 'profile-hero' }, avBox, fileIn,
        S.me.avatar ? h('button', { class: 'link', onclick: async () => {
          try { const { user } = await api('/api/me/avatar', { method: 'DELETE' }); S.me = user; drawAv(); renderMe(); } catch (e) { toast(e.message); }
        } }, 'Убрать фото') : null),
      h('label', { class: 'field-label' }, 'Имя', nameInput),
      h('label', { class: 'field-label' }, 'Статус', bioInput),
      h('div', { class: 'field-label' }, 'Юзернейм — по нему вас находят',
        h('div', { class: 'secret' }, h('code', null, '@' + S.me.username),
          h('button', { class: 'icon-btn', 'aria-label': 'Скопировать юзернейм', onclick: () => copyText('@' + S.me.username) }, icon('copy', 18)))),
      h('div', { class: 'field-label' }, 'Ваша ссылка — откроет чат с вами',
        h('div', { class: 'secret' }, h('code', null, myLink()),
          h('button', { class: 'icon-btn', 'aria-label': 'Поделиться ссылкой', onclick: shareMyLink }, icon('link', 18)))),
      save,
    ]);
  }
  /* Квадратная уменьшенная копия фото для аватарки */
  async function squareImage(file, size) {
    const bmp = await createImageBitmap(file);
    const side = Math.min(bmp.width, bmp.height);
    const c = document.createElement('canvas');
    c.width = c.height = size;
    c.getContext('2d').drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, size, size);
    bmp.close?.();
    return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Не удалось обработать фото'))), 'image/jpeg', 0.86));
  }

  /* Push на телефон через Service Worker */
  function b64ToBytes(b64) {
    const pad = '='.repeat((4 - (b64.length % 4)) % 4);
    return Uint8Array.from(atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  }
  async function pushState() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';
    const reg = await navigator.serviceWorker.ready;
    return (await reg.pushManager.getSubscription()) ? 'on' : 'off';
  }
  async function enablePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast(/iPhone|iPad/.test(navigator.userAgent) ? 'На iPhone сначала добавьте «Тихо» на экран «Домой» (Поделиться → На экран «Домой»)' : 'Браузер не поддерживает push');
      return false;
    }
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { toast('Уведомления запрещены в настройках браузера'); return false; }
    try {
      const reg = await navigator.serviceWorker.ready;
      const { publicKey } = await api('/api/push/key');
      const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) });
      await api('/api/push/subscribe', { body: { subscription: sub.toJSON() } });
      store.set('tiho-push', true);
      return true;
    } catch (e) { toast('Не удалось включить push: ' + (e.message || 'ошибка')); return false; }
  }
  async function disablePush() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) { await api('/api/push/unsubscribe', { body: { endpoint: sub.endpoint } }).catch(() => {}); await sub.unsubscribe(); }
    } catch { /* уже нет */ }
    store.set('tiho-push', false);
  }

  async function openNotifications() {
    const st = await pushState().catch(() => 'unsupported');
    const pushSw = h('button', { class: 'sw', role: 'switch', 'aria-checked': String(st === 'on'), 'aria-label': 'Push на телефон', disabled: st === 'unsupported' && !/iPhone|iPad/.test(navigator.userAgent) });
    pushSw.addEventListener('click', async () => {
      const on = pushSw.getAttribute('aria-checked') === 'true';
      if (on) { await disablePush(); pushSw.setAttribute('aria-checked', 'false'); toast('Push выключены'); }
      else if (await enablePush()) { pushSw.setAttribute('aria-checked', 'true'); toast('Push включены'); }
    });
    const pushRow = h('div', { class: 'card' },
      h('div', { class: 'card-row' }, h('span', { class: 'ic' }, icon('bell', 19, 1.9)),
        h('span', { class: 'grow' }, h('b', null, 'Push на телефон'), h('small', null, st === 'unsupported' ? 'Браузер не поддерживает. На iPhone — добавьте на экран «Домой»' : 'Сообщения и звонки, даже когда мессенджер закрыт')), pushSw),
      h('button', { class: 'card-row', onclick: async () => { try { await api('/api/push/test', { method: 'POST' }); toast('Отправили тестовое уведомление'); } catch (e) { toast(e.message); } } },
        h('span', { class: 'ic' }, icon('send', 19, 1.9)), h('span', { class: 'grow' }, h('b', null, 'Проверить'), h('small', null, 'Прислать тестовое push-уведомление'))));
    modal('Уведомления', [
      pushRow,
      h('p', { class: 'muted', style: 'margin:0;font-size:13px;line-height:1.45' }, 'В push видно, от кого сообщение, но не его текст: сервер не может расшифровать переписку.'),
      h('div', { class: 'section-title' }, 'Пока мессенджер открыт'),
      h('div', { class: 'card' },
        settingsSw('tiho-notify', 'Уведомления во вкладке', 'Когда вкладка свёрнута', 'bell', async () => {
          if (!('Notification' in window)) { toast('Браузер не поддерживает уведомления'); return false; }
          const p = await Notification.requestPermission();
          if (p !== 'granted') toast('Уведомления запрещены в настройках браузера');
          return p === 'granted';
        }),
        settingsSw('tiho-notify-text', 'Текст в уведомлениях', 'Показывать содержимое сообщений', 'eye'),
        settingsSw('tiho-sound', 'Звук', 'Короткий сигнал о новом сообщении', 'volume')),
    ]);
  }
  function openNotificationsOld() {
    const askNotif = async () => {
      if (!('Notification' in window)) { toast('Браузер не поддерживает уведомления'); return false; }
      const p = await Notification.requestPermission();
      if (p !== 'granted') toast('Уведомления запрещены в настройках браузера');
      return p === 'granted';
    };
    modal('Уведомления', [h('div', { class: 'card' },
      settingsSw('tiho-notify', 'Уведомления', 'Когда вкладка свёрнута', 'bell', askNotif),
      settingsSw('tiho-notify-text', 'Текст в уведомлениях', 'Показывать содержимое сообщений', 'eye'),
      settingsSw('tiho-sound', 'Звук', 'Короткий сигнал о новом сообщении', 'volume'))]);
  }

  async function openPrivacy() {
    let info = { twoFactor: false, backupLeft: 0, google: null };
    try { info = await api('/api/me'); } catch { /* без статуса */ }
    const fp = h('div', { class: 'code fp' });
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(S.pub)).then((d) => {
      const b = new Uint8Array(d);
      for (let i = 0; i < 8; i++) fp.append(h('span', null, ((b[i * 2] << 8 | b[i * 2 + 1]) % 10000).toString().padStart(4, '0')));
    });
    const gRow = S.config.googleClientId ? h('button', { class: 'card-row', onclick: async () => {
      if (info.google) {
        if (!confirm('Отвязать Google? Входить можно будет по логину и паролю.')) return;
        try { await api('/api/google/unlink', { method: 'POST' }); close(); toast('Google отвязан'); } catch (e) { toast(e.message); }
      } else { close(); openLinkGoogle(); }
    } },
      h('span', { class: 'ic g-ic' }, h('span', { class: 'g-logo' }, 'G')),
      h('span', { class: 'grow' }, h('b', null, 'Вход через Google'), h('small', null, info.google ? String(info.google) : 'Входите в один клик')),
      h('span', { class: 'chip-status' + (info.google ? ' on' : '') }, info.google ? 'Привязан' : 'Привязать')) : null;
    const tfaRow = h('button', { class: 'card-row', onclick: () => { close(); info.twoFactor ? openDisable2fa(info.backupLeft) : openEnable2fa(); } },
      h('span', { class: 'ic', style: info.twoFactor ? 'background:var(--ok-soft);color:var(--ok)' : '' }, icon('shield', 19, 1.9)),
      h('span', { class: 'grow' }, h('b', null, 'Google Authenticator'),
        h('small', null, info.twoFactor ? `Код при входе · резервных кодов: ${info.backupLeft}` : 'Код из приложения при каждом входе')),
      h('span', { class: 'chip-status' + (info.twoFactor ? ' on' : '') }, info.twoFactor ? 'Включено' : 'Выключено'));
    const close = modal('Конфиденциальность', [
      h('div', { class: 'section' }, h('div', { class: 'section-title' }, 'Вход'), h('div', { class: 'card' }, gRow, tfaRow)),
      h('div', { class: 'section' }, h('div', { class: 'section-title' }, 'Шифрование'),
        h('div', { class: 'card', style: 'padding:14px 16px;display:flex;flex-direction:column;gap:10px' },
          h('div', { style: 'display:flex;align-items:center;gap:8px;font-weight:600' }, icon('key', 18), 'Отпечаток вашего ключа'), fp,
          h('p', { class: 'muted', style: 'margin:0;font-size:13px;line-height:1.45' },
            'Ключи хранятся только на ваших устройствах. Сервер передаёт зашифрованные сообщения и файлы и не может их расшифровать.'))),
    ]);
  }

  function openAppearance() {
    const themeNow = store.get('tiho-theme', 'auto');
    const themeSeg = h('div', { class: 'theme-seg', role: 'group', 'aria-label': 'Тема' },
      [['light', 'Светлая', 'sun'], ['dark', 'Тёмная', 'moon'], ['auto', 'Авто', 'auto']].map(([k, l, ic]) => h('button', {
        'aria-pressed': String(themeNow === k), 'data-k': k, onclick: () => {
          store.set('tiho-theme', k); applyTheme();
          themeSeg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === k)));
        } }, icon(ic, 18), l)));
    const sizeNow = store.get('tiho-size', 'm');
    const sizeSeg = h('div', { class: 'theme-seg', role: 'group', 'aria-label': 'Размер текста' },
      [['s', 'Мелкий'], ['m', 'Обычный'], ['l', 'Крупный']].map(([k, l]) => h('button', {
        'aria-pressed': String(sizeNow === k), 'data-k': k, onclick: () => {
          store.set('tiho-size', k); applyTheme();
          sizeSeg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === k)));
        } }, l)));
    modal('Внешний вид', [
      h('div', { class: 'section' }, h('div', { class: 'section-title' }, 'Тема'), themeSeg),
      h('div', { class: 'section' }, h('div', { class: 'section-title' }, 'Размер текста в чатах'), sizeSeg),
    ]);
  }

  async function openStorage() {
    let est = '';
    try { const e = await navigator.storage?.estimate?.(); if (e) est = fileSize(e.usage || 0); } catch { /* нет данных */ }
    const close = modal('Данные и хранилище', [
      h('div', { class: 'card' },
        h('div', { class: 'card-row' }, h('span', { class: 'ic' }, icon('database', 19, 1.9)),
          h('span', { class: 'grow' }, h('b', null, 'Занято на устройстве'), h('small', null, est || 'неизвестно'))),
        h('div', { class: 'card-row' }, h('span', { class: 'ic' }, icon('image', 19, 1.9)),
          h('span', { class: 'grow' }, h('b', null, 'Расшифрованные файлы в памяти'), h('small', null, `${S.fileUrls.size} ${plural(S.fileUrls.size, 'файл', 'файла', 'файлов')}`)))),
      h('button', { class: 'btn ghost block', onclick: async () => {
        for (const pr of S.fileUrls.values()) pr.then((u) => URL.revokeObjectURL(u)).catch(() => {});
        S.fileUrls.clear();
        try { for (const k of await caches.keys()) await caches.delete(k); } catch { /* нет кеша */ }
        close(); toast('Кеш очищен');
      } }, icon('trash', 18), 'Очистить кеш'),
      h('p', { class: 'muted', style: 'margin:0;font-size:13px;line-height:1.45' }, 'Переписка и файлы хранятся на сервере в зашифрованном виде и не удаляются при очистке кеша.'),
    ]);
  }

  function openHelp() {
    const qa = [
      ['Кто может прочитать мои сообщения?', 'Только участники чата. Сообщения и файлы шифруются на вашем устройстве, сервер хранит лишь шифр.'],
      ['Как найти собеседника?', 'По юзернейму: вкладка «Чаты» → поиск или кнопка-карандаш. Ещё можно отправить свою ссылку из «Мой профиль».'],
      ['Что такое код безопасности?', 'Цифры в профиле собеседника → «Ключ». Сверьте их при встрече или по звонку: если совпадают, между вами никого нет.'],
      ['Я забыл пароль', 'Восстановить его нельзя: он защищает ключи шифрования. Можно создать новый аккаунт, но старая переписка останется недоступной.'],
      ['Как удалить сообщение?', 'Долгое нажатие (или правый клик) на своём сообщении → «Удалить у всех».'],
    ];
    modal('Помощь', [h('div', { class: 'card faq' }, qa.map(([q, a]) => h('details', null, h('summary', null, q), h('p', null, a))))]);
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

  /* ================= ЗВОНКИ ================= */
  const CALL = { cur: null };
  let ringIv = null, ringAc = null;
  function ringtone(on, outgoing) {
    clearInterval(ringIv); ringIv = null;
    if (!on) return;
    try { ringAc = ringAc || new AudioContext(); } catch { return; }
    const tone = (f, t0, dur) => {
      const o = ringAc.createOscillator(), g = ringAc.createGain();
      o.frequency.value = f; g.gain.setValueAtTime(0.0001, ringAc.currentTime + t0);
      g.gain.exponentialRampToValueAtTime(0.08, ringAc.currentTime + t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, ringAc.currentTime + t0 + dur);
      o.connect(g).connect(ringAc.destination); o.start(ringAc.currentTime + t0); o.stop(ringAc.currentTime + t0 + dur + 0.05);
    };
    const play = outgoing ? () => tone(425, 0, 1) : () => { tone(784, 0, 0.18); tone(988, 0.22, 0.18); tone(1175, 0.44, 0.3); };
    play();
    ringIv = setInterval(play, outgoing ? 4000 : 2200);
  }
  const fmtDur = (s) => Math.floor(s / 60) + ':' + pad(s % 60);
  function signal(action, data) {
    const c = CALL.cur;
    if (c) wsSend({ type: 'call', to: c.peerId, callId: c.id, action, kind: c.kind, data });
  }
  async function getIce() {
    if (!S.iceServers) {
      try { S.iceServers = (await api('/api/calls/ice')).iceServers; } catch { S.iceServers = [{ urls: 'stun:stun.l.google.com:19302' }]; }
    }
    return S.iceServers;
  }
  async function makePC() {
    const c = CALL.cur;
    const pc = new RTCPeerConnection({ iceServers: await getIce() });
    c.pc = pc;
    pc.onicecandidate = (e) => { if (e.candidate) signal('ice', { candidate: e.candidate.toJSON() }); };
    pc.ontrack = (e) => { c.remote = e.streams[0] || new MediaStream([e.track]); attachMedia(); };
    pc.onconnectionstatechange = () => {
      if (CALL.cur !== c) return;
      const st = pc.connectionState;
      if (st === 'connected' && c.state !== 'active') {
        c.state = 'active'; c.startedAt = Date.now(); ringtone(false);
        c.tick = setInterval(() => setCallStatus(fmtDur(Math.floor((Date.now() - c.startedAt) / 1000))), 1000);
        renderCallUI();
      }
      if (st === 'disconnected' && c.state === 'active') setCallStatus('Связь прерывается…');
      if (st === 'failed') { signal('end'); endCall('Не удалось соединиться. Возможно, мешает сеть — нужен TURN-сервер (см. инструкцию).'); }
    };
    return pc;
  }
  async function getMedia(video) {
    return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: video ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false });
  }
  async function startCall(user, kind) {
    if (CALL.cur) return toast('Уже идёт звонок');
    if (!window.RTCPeerConnection || !navigator.mediaDevices?.getUserMedia) return toast('Браузер не поддерживает звонки');
    let stream;
    try { stream = await getMedia(kind === 'video'); }
    catch { return toast(kind === 'video' ? 'Нет доступа к камере или микрофону' : 'Нет доступа к микрофону'); }
    const id = (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, 36);
    CALL.cur = { id, peerId: user.id, user, kind, outgoing: true, local: stream, state: 'calling', queue: [], muted: false, camOff: false };
    renderCallUI();
    ringtone(true, true);
    const pc = await makePC();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    await pc.setLocalDescription(await pc.createOffer());
    signal('offer', { sdp: pc.localDescription.toJSON() });
    const c = CALL.cur;
    c.timeout = setTimeout(() => { if (CALL.cur === c && c.state === 'calling') { signal('end'); endCall('Нет ответа'); } }, 45000);
  }
  async function flushIce() {
    const c = CALL.cur;
    for (const cand of c.queue.splice(0)) { try { await c.pc.addIceCandidate(cand); } catch { /* устаревший кандидат */ } }
  }
  async function onCallSignal(d) {
    const c = CALL.cur;
    if (d.action === 'offer') {
      if (c) { wsSend({ type: 'call', to: d.from, callId: d.callId, action: 'busy' }); return; }
      const user = d.fromUser || freshUser(d.from) || { id: d.from, displayName: 'Собеседник' };
      CALL.cur = { id: d.callId, peerId: d.from, user, kind: d.kind === 'video' ? 'video' : 'audio', outgoing: false, state: 'incoming', offer: d.data?.sdp, queue: [], muted: false, camOff: false };
      wsSend({ type: 'call', to: d.from, callId: d.callId, action: 'ringing' });
      ringtone(true, false); renderCallUI();
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        try { new Notification(CALL.cur.kind === 'video' ? 'Входящий видеозвонок' : 'Входящий звонок', { body: user.displayName, tag: 'call', icon: '/icon-192.png' }); } catch { /* нет уведомлений */ }
      }
      return;
    }
    if (!c || c.id !== d.callId) return;
    switch (d.action) {
      case 'ringing': setCallStatus('Гудки…'); break;
      case 'answer':
        clearTimeout(c.timeout); ringtone(false);
        await c.pc.setRemoteDescription(d.data.sdp); await flushIce();
        c.state = 'connecting'; setCallStatus('Соединение…'); break;
      case 'ice':
        if (c.pc && c.pc.remoteDescription) { try { await c.pc.addIceCandidate(d.data.candidate); } catch { /* пропуск */ } }
        else c.queue.push(d.data.candidate);
        break;
      case 'reject': endCall('Звонок отклонён'); break;
      case 'busy': endCall('Собеседник сейчас разговаривает'); break;
      case 'unavailable': endCall('Собеседник не в сети'); break;
      case 'end': endCall(c.state === 'active' ? 'Звонок завершён' : c.outgoing ? 'Звонок завершён' : 'Пропущенный звонок'); break;
      default: break;
    }
  }
  async function acceptCall(withVideo) {
    const c = CALL.cur;
    if (!c || c.state !== 'incoming') return;
    ringtone(false);
    try { c.local = await getMedia(c.kind === 'video' && withVideo); }
    catch { toast('Нет доступа к микрофону'); signal('reject'); return endCall(); }
    if (c.kind === 'video' && !withVideo) c.camOff = true;
    c.state = 'connecting'; renderCallUI(); setCallStatus('Соединение…');
    const pc = await makePC();
    c.local.getTracks().forEach((t) => pc.addTrack(t, c.local));
    await pc.setRemoteDescription(c.offer);
    await flushIce();
    await pc.setLocalDescription(await pc.createAnswer());
    signal('answer', { sdp: pc.localDescription.toJSON() });
  }
  function endCall(msg) {
    const c = CALL.cur;
    if (!c) return;
    ringtone(false); clearTimeout(c.timeout); clearInterval(c.tick);
    try { c.pc?.close(); } catch { /* уже закрыт */ }
    c.local?.getTracks().forEach((t) => t.stop());
    CALL.cur = null;
    document.querySelector('.call-screen')?.remove();
    if (msg) toast(msg);
    if (S.tab === 'calls') renderCalls();
  }
  function setCallStatus(t) { const el = document.getElementById('call-status'); if (el) el.textContent = t; }
  function attachMedia() {
    const c = CALL.cur;
    const scr = document.querySelector('.call-screen');
    if (!c || !scr) return;
    const rv = scr.querySelector('video.remote'), lv = scr.querySelector('video.local'), au = scr.querySelector('audio');
    if (c.remote) {
      if (rv && rv.srcObject !== c.remote) { rv.muted = true; rv.srcObject = c.remote; rv.play?.().catch(() => {}); }
      if (au && au.srcObject !== c.remote) { au.srcObject = c.remote; au.play?.().catch(() => {}); }
      const hasVideo = c.remote.getVideoTracks().some((t) => t.readyState === 'live');
      scr.classList.toggle('has-remote-video', c.kind === 'video' && hasVideo);
    }
    if (lv && c.local && lv.srcObject !== c.local) { lv.muted = true; lv.srcObject = c.local; lv.play?.().catch(() => {}); }
  }
  function renderCallUI() {
    const c = CALL.cur;
    if (!c) return;
    document.querySelector('.call-screen')?.remove();
    const btn = (cls, ic, label, fn, pressed) => h('div', { class: 'call-btn-wrap' },
      h('button', { class: 'call-btn ' + cls, 'aria-label': label, 'aria-pressed': pressed === undefined ? null : String(pressed), onclick: fn }, icon(ic, 26, 2)), h('span', null, label));
    const status = c.state === 'incoming' ? (c.kind === 'video' ? 'Входящий видеозвонок' : 'Входящий звонок')
      : c.state === 'calling' ? 'Звоним…' : c.state === 'connecting' ? 'Соединение…' : fmtDur(Math.floor((Date.now() - (c.startedAt || Date.now())) / 1000));
    let controls;
    if (c.state === 'incoming') {
      controls = [btn('red', 'phoneOff', 'Отклонить', () => { signal('reject'); endCall(); })];
      if (c.kind === 'video') controls.push(btn('green', 'video', 'С видео', () => acceptCall(true)));
      controls.push(btn('green', 'phone', c.kind === 'video' ? 'Только звук' : 'Принять', () => acceptCall(false)));
    } else {
      controls = [btn('glass' + (c.muted ? ' on' : ''), c.muted ? 'micOff' : 'mic', c.muted ? 'Включить микрофон' : 'Микрофон', () => {
        c.muted = !c.muted; c.local?.getAudioTracks().forEach((t) => { t.enabled = !c.muted; }); renderCallUI(); }, c.muted)];
      if (c.kind === 'video' && c.local?.getVideoTracks().length) {
        controls.push(btn('glass' + (c.camOff ? ' on' : ''), c.camOff ? 'videoOff' : 'video', c.camOff ? 'Включить камеру' : 'Камера', () => {
          c.camOff = !c.camOff; c.local.getVideoTracks().forEach((t) => { t.enabled = !c.camOff; }); renderCallUI(); }, c.camOff));
      }
      controls.push(btn('red', 'phoneOff', 'Завершить', () => { signal('end'); endCall('Звонок завершён'); }));
    }
    const scr = h('div', { class: 'call-screen' + (c.kind === 'video' ? ' video' : ''), role: 'dialog', 'aria-label': 'Звонок' },
      c.kind === 'video' ? h('video', { class: 'remote', autoplay: true, playsinline: true }) : null,
      h('audio', { autoplay: true }),
      h('div', { class: 'call-info' }, h('div', { class: 'call-av' + (c.state === 'incoming' || c.state === 'calling' ? ' pulse-ring' : '') }, userAvatar(c.user, 128)),
        h('h2', null, c.user.displayName), h('p', { id: 'call-status' }, status),
        h('small', { class: 'call-e2e' }, icon('lock', 13), 'Звонок шифруется между устройствами')),
      c.kind === 'video' && c.local?.getVideoTracks().length ? h('video', { class: 'local', autoplay: true, playsinline: true, muted: true }) : null,
      h('div', { class: 'call-controls' }, controls));
    document.body.append(scr);
    scr.querySelector('video.local')?.setAttribute('muted', '');
    if (scr.querySelector('video.local')) scr.querySelector('video.local').muted = true;
    attachMedia();
  }

  /* История звонков — вкладка «Звонки» */
  let callFilter = 'all';
  async function renderCalls() {
    const v = S.refs.callsView;
    if (!v) return;
    const listEl = h('ul', { class: 'chat-list' });
    const chips = h('div', { class: 'chips' }, [['all', 'Все'], ['missed', 'Пропущенные'], ['in', 'Входящие'], ['out', 'Исходящие']].map(([k, l]) =>
      h('button', { class: 'chip', 'aria-pressed': String(callFilter === k), onclick: () => { callFilter = k; renderCalls(); } }, l)));
    clear(v).append(h('div', { class: 'side-head' }, h('div', { class: 'head-row' }, h('h1', { class: 'page-title' }, 'Звонки')), chips), listEl);
    let calls = [];
    try { calls = (await api('/api/calls')).calls; } catch { /* нет сети */ }
    const missed = (c) => !c.outgoing && ['missed', 'rejected', 'busy'].includes(c.status) && c.status !== 'answered';
    if (callFilter === 'missed') calls = calls.filter(missed);
    if (callFilter === 'in') calls = calls.filter((c) => !c.outgoing);
    if (callFilter === 'out') calls = calls.filter((c) => c.outgoing);
    if (!calls.length) {
      listEl.append(h('li', { class: 'list-empty' }, h('div', { class: 'empty-ic' }, icon('phone', 28)), h('b', null, 'Звонков пока нет'),
        h('span', null, 'Позвоните из чата — кнопки с трубкой и камерой вверху переписки.')));
      return;
    }
    for (const c of calls) {
      if (!c.user) continue;
      const bad = missed(c);
      const label = (c.outgoing ? 'Исходящий' : c.status === 'rejected' ? 'Отклонённый' : bad ? 'Пропущенный' : 'Входящий') + (c.kind === 'video' ? ' видеозвонок' : '');
      listEl.append(h('li', null, h('div', { class: 'chat-item call-row' },
        userAvatar(c.user, 48),
        h('div', { class: 'ci-body' }, h('span', { class: 'ci-name' + (bad ? ' missed' : '') }, c.user.displayName),
          h('span', { class: 'ci-prev' + (bad ? ' missed' : '') }, icon(c.outgoing ? 'arrowUp' : 'arrowDown', 13, 2.4),
            `${label} · ${shortTime(c.startedAt)}${c.duration ? ' · ' + fmtDur(c.duration) : ''}`)),
        h('button', { class: 'icon-btn accent', 'aria-label': `Позвонить ${c.user.displayName}`, onclick: () => startCall(c.user, c.kind) }, icon(c.kind === 'video' ? 'video' : 'phone', 22, 1.8)))));
    }
  }
  function callPill(m, p, chat) {
    const mine = m.senderId === S.me.id;
    const bad = !mine && p.status !== 'ended';
    const label = p.status === 'ended'
      ? `${mine ? 'Исходящий' : 'Входящий'} ${p.kind === 'video' ? 'видеозвонок' : 'звонок'} · ${fmtDur(p.duration || 0)}`
      : mine ? (p.status === 'busy' ? 'Собеседник был занят' : p.status === 'rejected' ? 'Звонок отклонён' : 'Нет ответа')
        : (p.kind === 'video' ? 'Пропущенный видеозвонок' : 'Пропущенный звонок');
    const o = other(chat);
    return h('div', { class: 'call-pill' + (bad ? ' missed' : '') }, icon(p.kind === 'video' ? 'video' : 'phone', 15, 2), h('span', null, label),
      h('span', { class: 'muted' }, hm(m.createdAt)),
      o ? h('button', { class: 'link', onclick: () => startCall(o, p.kind) }, 'Перезвонить') : null);
  }

  /* ================= КАНАЛЫ ================= */
  const chAvatar = (c, size = 52) => h('div', { class: 'av ch-av', style: `width:${size}px;height:${size}px;font-size:${Math.round(size * .36)}px;background:${AV_COLORS[(c.color || 0) % 8]}` }, initials(c.title));
  const chLastTs = (c) => c.lastPost?.createdAt || c.createdAt;
  const chPreview = (p) => !p ? 'Нет публикаций' : (p.body.image && !p.body.text ? 'Фото' : (p.body.image ? 'Фото · ' : '') + p.body.text.replace(/\s+/g, ' '));
  const canPostIn = (c) => c && (c.role === 'owner' || c.role === 'admin');
  async function loadChannels() {
    try {
      const { channels } = await api('/api/channels');
      S.channels = new Map(channels.map((c) => [c.id, c]));
      renderList(); updateTitle();
      if (S.channel && S.channels.has(S.channel)) renderChannelHead();
    } catch { /* без каналов */ }
  }
  function channelItem(c) {
    const item = h('button', { class: 'chat-item', 'aria-current': String(S.channel === c.id), onclick: () => openChannel(c) },
      chAvatar(c, 52),
      h('div', { class: 'ci-body' },
        h('div', { class: 'ci-row' }, h('span', { class: 'muted', title: 'Канал' }, icon('megaphone', 15)),
          h('span', { class: 'ci-name' }, c.title), h('span', { class: 'ci-time' + (c.unread ? ' hot' : '') }, shortTime(chLastTs(c)))),
        h('div', { class: 'ci-row' }, h('span', { class: 'ci-prev' }, c.subscribed ? chPreview(c.lastPost) : `@${c.slug} · ${c.subscribers} ${plural(c.subscribers, 'подписчик', 'подписчика', 'подписчиков')}`),
          c.unread ? h('span', { class: 'badge muted-badge' }, c.unread > 99 ? '99+' : c.unread) : null)));
    return h('li', null, item);
  }
  async function openChannel(c, fromLink) {
    const wasOpen = S.active != null || !!S.page || S.channel != null;
    if (!S.channels.has(c.id)) S.channels.set(c.id, c);
    S.channel = c.id; S.active = null; S.page = null;
    S.refs.app.classList.add('in-chat');
    if (MOBILE() && !wasOpen) history.pushState({ chat: 'c' + c.id }, '');
    renderList(); renderPane();
    if (!S.cposts.has(c.id)) await loadPosts(c.id);
  }
  function closeChannel() { S.channel = null; S.refs.app?.classList.remove('in-chat'); renderList(); renderPane(); }
  async function loadPosts(id, older = false) {
    const box = S.cposts.get(id) || { list: [], hasMore: true, loading: false };
    if (box.loading) return;
    box.loading = true; S.cposts.set(id, box);
    try {
      const before = older && box.list.length ? box.list[0].id : '';
      const r = await api(`/api/channels/${id}/posts${before ? '?before=' + before : ''}`);
      const have = new Set(box.list.map((p) => p.id));
      const fresh = r.posts.filter((p) => !have.has(p.id));
      box.list = older ? fresh.concat(box.list) : box.list.concat(fresh).sort((a, b) => a.id - b.id);
      box.hasMore = r.hasMore;
    } catch (e) { toast(e.message); }
    box.loading = false;
    if (S.channel === id) { renderPosts(older ? 'keep' : 'bottom'); markChannelRead(); }
  }
  function markChannelRead() {
    const c = S.channels.get(S.channel);
    const last = S.cposts.get(S.channel)?.list.at(-1);
    if (!c || !last || document.hidden || !c.subscribed) return;
    if (c.unread) { c.unread = 0; renderList(); updateTitle(); }
    api(`/api/channels/${c.id}/read`, { body: { postId: last.id } }).catch(() => {});
  }
  function renderChannel(pane) {
    const c = S.channels.get(S.channel);
    if (!c) return;
    const head = h('header', { class: 'chat-head' });
    const msgs = h('div', { class: 'msgs ch-feed', onscroll: () => { if (msgs.scrollTop < 80) { const b = S.cposts.get(c.id); if (b?.hasMore && !b.loading) loadPosts(c.id, true); } } });
    const inner = h('div', { class: 'msgs-inner' });
    msgs.append(inner);
    const foot = h('div', { class: 'composer-wrap' });
    pane.append(head, h('div', { class: 'msgs-wrap' }, msgs), foot);
    Object.assign(S.refs, { head, msgs, inner, chFoot: foot });
    renderChannelHead(); renderPosts('bottom'); renderChannelFoot();
  }
  function renderChannelHead() {
    const c = S.channels.get(S.channel);
    const head = S.refs.head;
    if (!c || !head) return;
    clear(head).append(
      h('button', { class: 'icon-btn back', 'aria-label': 'Назад к чатам', onclick: () => (history.state?.chat ? history.back() : closeChannel()) }, icon('back', 24)),
      h('button', { class: 'head-av', 'aria-label': 'О канале', onclick: () => openChannelInfo(c) }, chAvatar(c, 42)),
      h('button', { class: 'head-title', onclick: () => openChannelInfo(c) }, h('b', null, c.title),
        h('small', null, `${c.subscribers} ${plural(c.subscribers, 'подписчик', 'подписчика', 'подписчиков')}`)),
      h('button', { class: 'icon-btn', 'aria-label': 'О канале', onclick: () => openChannelInfo(c) }, icon('more', 22)));
  }
  function renderPosts(scroll) {
    const c = S.channels.get(S.channel);
    const { msgs, inner } = S.refs;
    if (!c || !inner) return;
    const prevH = msgs.scrollHeight, prevTop = msgs.scrollTop;
    const atBottom = msgs.scrollHeight - msgs.scrollTop - msgs.clientHeight < 120;
    clear(inner);
    inner.append(h('div', { class: 'ch-note' }, icon('megaphone', 15), 'Канал: публикации видят все подписчики, они не шифруются сквозным шифрованием.'));
    const box = S.cposts.get(c.id);
    if (!box || (box.loading && !box.list.length)) inner.append(h('div', { style: 'align-self:center;padding:24px' }, h('div', { class: 'spin' })));
    else {
      if (!box.list.length) inner.append(h('div', { class: 'sys' }, canPostIn(c) ? 'Напишите первую публикацию — её увидят все подписчики' : 'В канале пока нет публикаций'));
      let prev = null;
      for (const p of box.list) {
        if (!prev || !sameDay(prev.createdAt, p.createdAt)) inner.append(h('div', { class: 'day' }, h('span', null, dayLabel(p.createdAt))));
        inner.append(postEl(c, p));
        prev = p;
      }
    }
    if (scroll === 'bottom' || (scroll !== 'keep' && atBottom)) msgs.scrollTop = msgs.scrollHeight;
    else if (scroll === 'keep') msgs.scrollTop = prevTop + (msgs.scrollHeight - prevH);
  }
  function postEl(c, p) {
    const card = h('article', { class: 'post', 'data-id': p.id },
      h('div', { class: 'post-head' }, chAvatar(c, 28), h('b', null, c.title)),
      p.body.image ? h('img', { class: 'post-img', src: '/api/channel-files/' + p.body.image.id, alt: '', loading: 'lazy',
        style: p.body.image.w ? `aspect-ratio:${p.body.image.w}/${p.body.image.h}` : '', onclick: (e) => openViewer(e.target.src, 'image') }) : null,
      p.body.text ? h('div', { class: 'post-text' }, ...linkify(p.body.text)) : null,
      p.reactions.length ? h('div', { class: 'reacts' }, p.reactions.map((r) => h('button', { class: 'react' + (r.mine ? ' mine' : ''), 'aria-pressed': String(r.mine),
        onclick: () => reactPost(c, p, r.emoji) }, h('span', { class: 'emo' }, r.emoji), String(r.count)))) : null,
      h('div', { class: 'post-meta' }, h('span', { class: 'views' }, icon('eye', 14), String(p.views)),
        p.editedAt ? h('span', { class: 'edited' }, 'изменено') : null, h('span', null, hm(p.createdAt))));
    const items = [
      c.subscribed && ['smile', 'Реакция…', () => {
        const r = card.getBoundingClientRect();
        openMenu(r.left + 20, r.bottom - 60, Object.assign([], { reactions: { list: S.config.reactions || ['👍'], pick: (e) => reactPost(c, p, e), mine: p.reactions.find((x) => x.mine)?.emoji } }));
      }],
      p.body.text && ['copy', 'Копировать текст', () => copyText(p.body.text)],
      ['link', 'Ссылка на канал', () => copyText(`${location.origin}/c/${c.slug}`)],
      canPostIn(c) && p.body.text !== undefined && ['edit', 'Изменить', () => editPost(c, p)],
      canPostIn(c) && ['trash', 'Удалить', () => deletePost(c, p), 'danger'],
    ].filter(Boolean);
    if (c.subscribed) items.reactions = { list: S.config.reactions || ['👍'], pick: (e) => reactPost(c, p, e), mine: p.reactions.find((x) => x.mine)?.emoji };
    card.addEventListener('contextmenu', (e) => { e.preventDefault(); openMenu(e.clientX, e.clientY, items, card); });
    card.addEventListener('dblclick', (e) => { if (c.subscribed && !e.target.closest('button,a')) reactPost(c, p, (S.config.reactions || ['👍'])[0]); });
    longPress(card, (x, y) => openMenu(x, y, items, card));
    return card;
  }
  async function reactPost(c, p, emoji) {
    try { const { post } = await api(`/api/channels/${c.id}/posts/${p.id}/react`, { body: { emoji } }); replacePost(c.id, post); } catch (e) { toast(e.message); }
  }
  function replacePost(cid, post) {
    const box = S.cposts.get(cid);
    const i = box?.list.findIndex((x) => x.id === post.id);
    if (i >= 0) box.list[i] = post;
    const c = S.channels.get(cid);
    if (c?.lastPost?.id === post.id) c.lastPost = post;
    if (S.channel === cid) renderPosts('keep');
  }
  function editPost(c, p) {
    const ta = h('textarea', { class: 'input', rows: 6, style: 'height:auto;padding:12px;resize:vertical' });
    ta.value = p.body.text || '';
    const close = modal('Изменить публикацию', [ta, h('button', { class: 'btn block', onclick: async () => {
      try { const { post } = await api(`/api/channels/${c.id}/posts/${p.id}`, { method: 'PATCH', body: { text: ta.value } }); replacePost(c.id, post); close(); } catch (e) { toast(e.message); }
    } }, 'Сохранить')]);
  }
  async function deletePost(c, p) {
    if (!confirm('Удалить публикацию у всех подписчиков?')) return;
    try { await api(`/api/channels/${c.id}/posts/${p.id}`, { method: 'DELETE' }); removePost(c.id, p.id); } catch (e) { toast(e.message); }
  }
  function removePost(cid, pid) {
    const box = S.cposts.get(cid);
    if (box) box.list = box.list.filter((x) => x.id !== pid);
    const c = S.channels.get(cid);
    if (c?.lastPost?.id === pid) { c.lastPost = box?.list.at(-1) || null; }
    renderList();
    if (S.channel === cid) renderPosts('keep');
  }
  function renderChannelFoot() {
    const c = S.channels.get(S.channel);
    const foot = S.refs.chFoot;
    if (!c || !foot) return;
    clear(foot);
    if (canPostIn(c)) {
      const ta = h('textarea', { rows: 1, placeholder: 'Новая публикация', 'aria-label': 'Текст публикации' });
      let image = null;
      const prevBox = h('div');
      const fileIn = h('input', { type: 'file', accept: 'image/*', class: 'sr', tabindex: '-1', 'aria-hidden': 'true', onchange: async () => {
        const f = fileIn.files[0]; fileIn.value = '';
        if (!f) return;
        if (f.size > 10 * 1024 * 1024) return toast('Картинка больше 10 МБ');
        try {
          let w = 0, hh = 0;
          try { const bmp = await createImageBitmap(f); w = bmp.width; hh = bmp.height; bmp.close?.(); } catch { /* размеры неизвестны */ }
          const { id } = await api(`/api/channels/${c.id}/files`, { raw: f, type: f.type || 'image/jpeg' });
          image = { id, w, h: hh };
          clear(prevBox).append(h('div', { class: 'reply-bar' }, icon('image', 20), h('div', null, h('b', null, 'Фото прикреплено'), h('span', null, f.name)),
            h('button', { class: 'icon-btn', 'aria-label': 'Убрать фото', onclick: () => { image = null; clear(prevBox); } }, icon('close', 20))));
        } catch (e) { toast(e.message); }
      } });
      const publish = async () => {
        const text = ta.value.trim();
        if (!text && !image) return;
        btn.disabled = true;
        try {
          const { post } = await api(`/api/channels/${c.id}/posts`, { body: { text, image } });
          ta.value = ''; image = null; clear(prevBox); ta.style.height = 'auto';
          addPost(c.id, post);
        } catch (e) { toast(e.message); }
        btn.disabled = false;
      };
      const btn = h('button', { class: 'send', 'aria-label': 'Опубликовать', onclick: publish }, icon('send', 20, 2.2));
      ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'; });
      ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); publish(); } });
      foot.append(prevBox, h('div', { class: 'composer' },
        h('button', { class: 'icon-btn', style: 'color:var(--muted)', 'aria-label': 'Прикрепить фото', onclick: () => fileIn.click() }, icon('image', 22, 1.8)),
        h('label', { class: 'field' }, ta), btn, fileIn));
    } else if (c.subscribed) {
      foot.append(h('div', { class: 'ch-bar' }, h('button', { class: 'btn ghost block', onclick: () => openChannelInfo(c) }, icon('check', 18), 'Вы подписаны')));
    } else {
      foot.append(h('div', { class: 'ch-bar' }, h('button', { class: 'btn block big', onclick: () => joinChannel(c) }, 'Подписаться')));
    }
  }
  function addPost(cid, post) {
    const box = S.cposts.get(cid);
    if (box && !box.list.some((x) => x.id === post.id)) box.list.push(post);
    const c = S.channels.get(cid);
    if (c) c.lastPost = post;
    renderList();
    if (S.channel === cid) { renderPosts(); markChannelRead(); }
  }
  async function joinChannel(c) {
    try {
      const { channel } = await api(`/api/channels/${c.id}/join`, { method: 'POST' });
      S.channels.set(channel.id, channel);
      toast('Вы подписались на «' + channel.title + '»');
      renderList(); renderChannelHead(); renderChannelFoot();
    } catch (e) { toast(e.message); }
  }
  function openChannelInfo(c) {
    const link = `${location.origin}/c/${c.slug}`;
    const body = [
      h('div', { class: 'pg-hero' }, chAvatar(c, 96), h('h2', null, c.title),
        h('span', { class: 'muted' }, `@${c.slug} · ${c.subscribers} ${plural(c.subscribers, 'подписчик', 'подписчика', 'подписчиков')}`),
        c.about ? h('p', { class: 'pg-bio' }, c.about) : null),
      h('div', { class: 'field-label' }, 'Ссылка на канал',
        h('div', { class: 'secret' }, h('code', null, link), h('button', { class: 'icon-btn', 'aria-label': 'Скопировать ссылку', onclick: () => copyText(link) }, icon('copy', 18)))),
    ];
    if (c.role === 'owner') {
      body.push(h('button', { class: 'btn ghost block', onclick: () => { close(); editChannel(c); } }, icon('edit', 18), 'Изменить канал'));
      body.push(h('button', { class: 'btn danger block', onclick: async () => {
        if (!confirm(`Удалить канал «${c.title}» вместе со всеми публикациями?`)) return;
        try { await api(`/api/channels/${c.id}`, { method: 'DELETE' }); close(); dropChannel(c.id); } catch (e) { toast(e.message); }
      } }, icon('trash', 18), 'Удалить канал'));
    } else if (c.subscribed) {
      body.push(h('button', { class: 'btn danger block', onclick: async () => {
        try { await api(`/api/channels/${c.id}/leave`, { method: 'POST' }); close(); c.subscribed = false; c.role = null; c.subscribers--; S.channels.delete(c.id); closeChannel(); toast('Вы отписались'); } catch (e) { toast(e.message); }
      } }, icon('leave', 18), 'Отписаться'));
    } else {
      body.push(h('button', { class: 'btn block big', onclick: () => { close(); joinChannel(c); } }, 'Подписаться'));
    }
    body.push(h('p', { class: 'muted', style: 'margin:0;font-size:13px;line-height:1.45' }, 'Публикации канала видят все подписчики. В отличие от личных чатов и групп, они не шифруются сквозным шифрованием.'));
    const close = modal('Канал', body);
  }
  function dropChannel(id) { S.channels.delete(id); S.cposts.delete(id); if (S.channel === id) closeChannel(); else renderList(); }
  function editChannel(c) {
    const title = h('input', { class: 'input', value: c.title, maxlength: 64 });
    const about = h('textarea', { class: 'input', rows: 3, style: 'height:auto;padding:12px' });
    about.value = c.about || '';
    const close = modal('Изменить канал', [h('label', { class: 'field-label' }, 'Название', title), h('label', { class: 'field-label' }, 'Описание', about),
      h('button', { class: 'btn block', onclick: async () => {
        try { const { channel } = await api(`/api/channels/${c.id}`, { method: 'PATCH', body: { title: title.value, about: about.value } }); S.channels.set(channel.id, channel); close(); renderList(); renderChannelHead(); } catch (e) { toast(e.message); }
      } }, 'Сохранить')]);
  }
  function openNewChannel() {
    const title = h('input', { class: 'input', maxlength: 64, placeholder: 'Например: Новости района' });
    const slug = h('input', { class: 'input', maxlength: 32, placeholder: 'news_rayon', autocapitalize: 'none', spellcheck: 'false' });
    const about = h('textarea', { class: 'input', rows: 3, style: 'height:auto;padding:12px', placeholder: 'О чём канал' });
    const err = h('div', { class: 'err', role: 'alert' });
    const close = modal('Новый канал', [
      h('label', { class: 'field-label' }, 'Название', title),
      h('label', { class: 'field-label' }, 'Адрес канала', h('div', { class: 'slug-row' }, h('span', { class: 'muted' }, '/c/'), slug)),
      h('label', { class: 'field-label' }, 'Описание', about),
      h('div', { class: 'note' }, icon('megaphone', 18), h('span', null, 'В канале пишете вы, остальные читают. Публикации не шифруются сквозным шифрованием, чтобы новые подписчики видели историю и канал открывался по ссылке.')),
      err,
      h('button', { class: 'btn block big', onclick: async () => {
        err.textContent = '';
        try {
          const { channel } = await api('/api/channels', { body: { title: title.value, slug: slug.value, about: about.value } });
          S.channels.set(channel.id, channel); close(); openChannel(channel);
        } catch (e) { err.textContent = e.message; }
      } }, 'Создать канал'),
    ]);
    setTimeout(() => title.focus(), 40);
  }

  /* ================= СТИКЕРЫ И GIF ================= */
  const EMOJI = '😀 😂 🥹 😊 😍 🥰 😘 😎 🤔 😅 😭 😡 🥳 😴 🤗 🙃 😏 😬 🤯 🥺 👍 👎 👏 🙏 💪 🤝 👋 ✌️ 🤞 👀 ❤️ 💙 💚 🖤 💔 🔥 ✨ 🎉 💯 ✅ ❌ ⚡ 🌙 ☀️ 🌧 ❄️ 🍕 🍔 ☕ 🍺 🎂 🎁 🐱 🐶 🦊 🌲 🌸 🏔 🌊 🚗 ✈️ 🏠 📍 ⏰ 📷 🎵 ⚽ 🎮'.split(' ');
  const recentKey = () => 'tiho-recent-stickers-' + S.me.id;
  const gifKey = () => 'tiho-gifs-' + S.me.id;
  function savedGifs() { return store.get(gifKey(), []); }
  function saveGif(p) {
    const list = savedGifs().filter((g) => g.fileId !== p.fileId);
    list.unshift({ t: 'file', fileId: p.fileId, name: p.name, size: p.size, mime: p.mime, key: p.key, iv: p.iv, w: p.w, h: p.h, gif: true, caption: '' });
    store.set(gifKey(), list.slice(0, 60));
  }
  const isGif = (p) => p?.t === 'file' && (p.gif || p.mime === 'image/gif');

  function sendSticker(chatId, pack, id) {
    const rec = store.get(recentKey(), []).filter((x) => !(x[0] === pack && x[1] === id));
    rec.unshift([pack, id]);
    store.set(recentKey(), rec.slice(0, 16));
    sendPayload({ t: 'sticker', pack, id }, chatId);
  }
  async function sendSavedGif(chatId, g) {
    try {
      await api(`/api/files/${g.fileId}/share`, { body: { chatId } });
      saveGif(g);
      await sendPayload({ ...g }, chatId);
    } catch (e) { toast('Не удалось отправить GIF: ' + e.message); }
  }
  async function sendGifFromUrl(chatId, gif) {
    toast('Отправляю GIF…');
    try {
      const r = await fetch(gif.full, { credentials: 'same-origin' });
      if (!r.ok) throw new Error('GIF недоступен');
      const blob = await r.blob();
      const file = new File([blob], 'gif.gif', { type: blob.type || 'image/gif' });
      await sendFiles([file], { gif: true, chatId });
    } catch (e) { toast(e.message); }
  }

  function buildMediaPanel(chat, input) {
    const panel = h('div', { class: 'media-panel', hidden: true, role: 'dialog', 'aria-label': 'Эмодзи, стикеры и GIF' });
    const tabs = h('div', { class: 'mp-tabs', role: 'tablist' });
    const body = h('div', { class: 'mp-body' });
    let cur = store.get('tiho-media-tab', 'emoji');
    const insert = (e) => {
      const st = input.selectionStart ?? input.value.length, en = input.selectionEnd ?? st;
      input.value = input.value.slice(0, st) + e + input.value.slice(en);
      input.focus(); input.setSelectionRange(st + e.length, st + e.length);
      input.dispatchEvent(new Event('input'));
    };
    const stickerBtn = (pack, id) => h('button', { class: 'st-btn', 'aria-label': 'Стикер ' + TihoStickers.nameOf(pack, id), title: TihoStickers.nameOf(pack, id),
      onclick: () => sendSticker(chat.id, pack, id) }, TihoStickers.el(pack, id));
    const gifTile = (src, w, hh, onPick, label) => {
      const img = h('img', { src, alt: label || 'GIF', loading: 'lazy' });
      return h('button', { class: 'gif-tile', style: w && hh ? `aspect-ratio:${w}/${hh}` : '', 'aria-label': label || 'Отправить GIF', onclick: onPick }, img);
    };
    const draw = () => {
      store.set('tiho-media-tab', cur);
      tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.k === cur)));
      clear(body);
      if (cur === 'emoji') {
        body.append(h('div', { class: 'emoji-grid' }, EMOJI.map((e) => h('button', { type: 'button', 'aria-label': e, onclick: () => insert(e) }, e))));
      } else if (cur === 'stickers') {
        const rec = store.get(recentKey(), []).filter(([p, i]) => TihoStickers.svg(p, i));
        if (rec.length) body.append(h('div', { class: 'mp-label' }, 'Недавние'), h('div', { class: 'st-grid' }, rec.slice(0, 8).map(([p, i]) => stickerBtn(p, i))));
        for (const pack of TihoStickers.PACKS) {
          body.append(h('div', { class: 'mp-label' }, pack.name), h('div', { class: 'st-grid' }, Object.keys(pack.items).map((id) => stickerBtn(pack.id, id))));
        }
      } else {
        const fileIn = h('input', { type: 'file', accept: 'image/gif,image/webp', class: 'sr', tabindex: '-1', 'aria-hidden': 'true',
          onchange: () => { const f = fileIn.files[0]; fileIn.value = ''; if (f) sendFiles([f], { gif: true, chatId: chat.id }); } });
        const mine = savedGifs();
        const mineBox = h('div', { class: 'gif-grid' });
        mine.forEach((g) => {
          const tile = gifTile('', g.w, g.h, () => sendSavedGif(chat.id, g), 'Мой GIF');
          getFileUrl(g).then((u) => { tile.querySelector('img').src = u; }).catch(() => tile.remove());
          mineBox.append(tile);
        });
        body.append(h('div', { class: 'mp-row' }, h('button', { class: 'btn ghost', onclick: () => fileIn.click() }, icon('image', 18), 'GIF с устройства'), fileIn));
        if (S.config.gifSearch) {
          const q = h('input', { type: 'search', class: 'input', placeholder: 'Поиск GIF', 'aria-label': 'Поиск GIF' });
          const results = h('div', { class: 'gif-grid' }, h('div', { class: 'spin dark sm' }));
          const run = async () => {
            clear(results).append(h('div', { class: 'spin sm dark' }));
            try {
              const { gifs } = await api('/api/gif/search?q=' + encodeURIComponent(q.value.trim()));
              clear(results).append(...gifs.map((g) => gifTile(g.preview, g.w, g.h, () => sendGifFromUrl(chat.id, g), g.title)));
              if (!gifs.length) results.append(h('span', { class: 'muted' }, 'Ничего не нашлось'));
            } catch (e) { clear(results).append(h('span', { class: 'muted' }, e.message)); }
          };
          let t; q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 350); });
          body.append(q);
          if (mine.length) body.append(h('div', { class: 'mp-label' }, 'Мои GIF'), mineBox);
          body.append(h('div', { class: 'mp-label' }, 'GIPHY'), results);
          run();
        } else {
          body.append(h('div', { class: 'mp-label' }, 'Мои GIF'), mine.length ? mineBox
            : h('p', { class: 'muted mp-note' }, 'Здесь появятся GIF, которые вы отправили или сохранили (меню GIF в чате → «Сохранить в Мои GIF»). Поиск по GIPHY включается в настройках сервера.'));
        }
      }
    };
    for (const [k, label] of [['emoji', 'Эмодзи'], ['stickers', 'Стикеры'], ['gif', 'GIF']]) {
      tabs.append(h('button', { type: 'button', role: 'tab', 'data-k': k, onclick: () => { cur = k; draw(); } }, label));
    }
    panel.append(tabs, body);
    return {
      el: panel,
      toggle(force) { panel.hidden = force !== undefined ? !force : !panel.hidden; if (!panel.hidden) draw(); return !panel.hidden; },
    };
  }

  /* ================= ПАПКИ И АРХИВ ================= */
  function renderChips() {
    const box = S.refs.chips;
    if (!box) return;
    clear(box);
    const base = [['all', 'Все'], ['direct', 'Личные'], ['group', 'Группы'], ['channels', 'Каналы'], ['unread', 'Непрочитанные']];
    const items = base.concat((S.folders || []).map((f) => ['f:' + f.id, f.name]));
    if (S.filter === 'archive') items.push(['archive', 'Архив']);
    for (const [k, label] of items) {
      const chip = h('button', { class: 'chip', 'aria-pressed': String(S.filter === k), onclick: () => { S.filter = k; renderChips(); renderList(); } }, label);
      if (k.startsWith('f:')) {
        const f = S.folders.find((x) => 'f:' + x.id === k);
        const menu = (x, y) => openMenu(x, y, [['edit', 'Изменить папку', () => editFolder(f)], ['trash', 'Удалить папку', () => deleteFolder(f), 'danger']]);
        chip.addEventListener('contextmenu', (e) => { e.preventDefault(); menu(e.clientX, e.clientY); });
        longPress(chip, (x, y) => menu(x, y));
      }
      box.append(chip);
    }
    requestAnimationFrame(() => box.querySelector('[aria-pressed="true"]')?.scrollIntoView({ inline: 'nearest', block: 'nearest' }));
    box.append(h('button', { class: 'chip add-chip', 'aria-label': 'Новая папка', title: 'Новая папка', onclick: () => editFolder(null) }, icon('plus', 16, 2.4)));
  }
  function longPress(el, fn) {
    let t, sx = 0, sy = 0;
    el.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; t = setTimeout(() => { navigator.vibrate?.(12); fn(sx, sy); }, 450); }, { passive: true });
    el.addEventListener('touchmove', (e) => { if (Math.abs(e.touches[0].clientX - sx) > 8 || Math.abs(e.touches[0].clientY - sy) > 8) clearTimeout(t); }, { passive: true });
    ['touchend', 'touchcancel'].forEach((ev) => el.addEventListener(ev, () => clearTimeout(t), { passive: true }));
  }
  async function saveFolders(folders) {
    const r = await api('/api/me/folders', { method: 'PUT', body: { folders } });
    S.folders = r.folders;
    renderChips(); renderList();
  }
  function editFolder(f) {
    const name = h('input', { class: 'input', value: f?.name || '', maxlength: 24, placeholder: 'Например: Работа' });
    const picked = new Set(f?.chatIds || []);
    const list = h('div', { class: 'card' });
    const draw = () => {
      clear(list);
      for (const c of [...S.chats.values()].sort((a, b) => lastTs(b) - lastTs(a))) {
        const on = picked.has(c.id);
        list.append(h('button', { class: 'card-row', onclick: () => { on ? picked.delete(c.id) : picked.add(c.id); draw(); } },
          avatar(c, 36), h('span', { class: 'grow' }, h('b', null, chatTitle(c))),
          h('span', { class: 'check' + (on ? ' on' : '') }, on ? icon('check', 14, 3) : null)));
      }
      if (!S.chats.size) list.append(h('div', { class: 'card-row muted' }, 'Пока нет чатов'));
    };
    draw();
    const close = modal(f ? 'Папка' : 'Новая папка', [
      h('label', { class: 'field-label' }, 'Название', name),
      h('div', { class: 'section-title' }, 'Чаты в папке'), list,
      h('button', { class: 'btn block', onclick: async () => {
        if (!name.value.trim()) { toast('Введите название папки'); return; }
        const folders = (S.folders || []).filter((x) => x.id !== f?.id);
        const id = f?.id || 'f' + Date.now().toString(36);
        const idx = f ? S.folders.findIndex((x) => x.id === f.id) : folders.length;
        folders.splice(idx < 0 ? folders.length : idx, 0, { id, name: name.value.trim(), chatIds: [...picked] });
        try { await saveFolders(folders); S.filter = 'f:' + id; renderChips(); renderList(); close(); } catch (e) { toast(e.message); }
      } }, 'Сохранить'),
    ]);
    setTimeout(() => name.focus(), 40);
  }
  async function deleteFolder(f) {
    if (!confirm(`Удалить папку «${f.name}»? Чаты останутся.`)) return;
    if (S.filter === 'f:' + f.id) S.filter = 'all';
    try { await saveFolders(S.folders.filter((x) => x.id !== f.id)); } catch (e) { toast(e.message); }
  }
  async function setArchived(c, archived) {
    try {
      await api(`/api/chats/${c.id}/archive`, { body: { archived } });
      c.archived = archived;
      if (!archived && S.filter === 'archive' && ![...S.chats.values()].some((x) => x.archived)) S.filter = 'all';
      renderChips(); renderList(); toast(archived ? 'Чат в архиве' : 'Чат возвращён из архива');
    } catch (e) { toast(e.message); }
  }
  function chatMenu(c, x, y) {
    const folders = S.folders || [];
    openMenu(x, y, [
      c.archived ? ['leave', 'Вернуть из архива', () => setArchived(c, false)] : ['database', 'В архив', () => setArchived(c, true)],
      ['plus', folders.length ? 'Добавить в папку…' : 'Создать папку с этим чатом', () => {
        if (!folders.length) return editFolder({ id: null, name: '', chatIds: [c.id] });
        const close = modal('В папку', [h('div', { class: 'card' }, folders.map((f) => {
          const on = f.chatIds.includes(c.id);
          return h('button', { class: 'card-row', onclick: async () => {
            const next = folders.map((x) => x.id !== f.id ? x : { ...x, chatIds: on ? x.chatIds.filter((i) => i !== c.id) : [...x.chatIds, c.id] });
            try { await saveFolders(next); close(); toast(on ? `Убрано из «${f.name}»` : `Добавлено в «${f.name}»`); } catch (e) { toast(e.message); }
          } }, h('span', { class: 'ic' }, icon('files', 18)), h('span', { class: 'grow' }, h('b', null, f.name)),
          h('span', { class: 'check' + (on ? ' on' : '') }, on ? icon('check', 14, 3) : null));
        }))]);
      }],
    ]);
  }

  /* ================= ЗАКРЕП, ПОИСК, ПЕРЕСЫЛКА, ОПРОСЫ ================= */
  function renderPinned() {
    const chat = S.chats.get(S.active);
    const box = S.refs.pinBox;
    if (!box || !chat) return;
    clear(box);
    const pm = chat.pinned;
    if (!pm) return;
    const p = plainOf(pm);
    if (!p && pm.kind === 'msg') { decryptMsg(pm, chat).then(() => renderPinned()); return; }
    box.append(h('div', { class: 'pin-bar' },
      h('button', { class: 'pin-main', onclick: () => jumpTo(pm.id) }, icon('pin', 18),
        h('span', null, h('small', null, 'Закреплённое сообщение'), h('b', null, previewOf(p)))),
      h('button', { class: 'icon-btn', 'aria-label': 'Открепить', onclick: () => pinMessage(chat, null) }, icon('close', 18))));
  }
  async function pinMessage(chat, m) {
    try { const { chat: c } = await api(`/api/chats/${chat.id}/pin`, { body: { messageId: m ? m.id : null } }); S.chats.set(c.id, { ...S.chats.get(c.id), ...c }); renderPinned(); }
    catch (e) { toast(e.message); }
  }

  /* Поиск по сообщениям открытого чата (по расшифрованному на устройстве) */
  function openSearch() {
    const chat = S.chats.get(S.active);
    const head = S.refs.head;
    if (!chat || !head) return;
    let hits = [], pos = -1;
    const input = h('input', { type: 'search', class: 'search-input', placeholder: 'Поиск в чате', 'aria-label': 'Поиск по сообщениям' });
    const counter = h('span', { class: 'search-count muted' });
    const go = (i) => {
      if (!hits.length) return;
      pos = (i + hits.length) % hits.length;
      counter.textContent = `${pos + 1} из ${hits.length}`;
      jumpTo(hits[pos]);
    };
    const run = async (deep) => {
      const qv = input.value.trim().toLowerCase();
      S.searchQ = qv;
      if (!qv) { hits = []; counter.textContent = ''; renderMessages(); return; }
      if (deep) {
        counter.textContent = 'Ищу во всей истории…';
        let guard = 0;
        while (S.msgs.get(chat.id)?.hasMore && guard++ < 40) await loadMessages(chat.id, true);
      }
      const box = S.msgs.get(chat.id);
      hits = (box?.list || []).filter((m) => {
        const p = plainOf(m);
        const t = p?.t === 'text' ? p.text : p?.t === 'file' ? `${p.name} ${p.caption}` : p?.t === 'poll' ? `${p.question} ${p.options.join(' ')}` : '';
        return t.toLowerCase().includes(qv);
      }).map((m) => m.id).reverse();
      renderMessages('keep');
      counter.textContent = hits.length ? `1 из ${hits.length}` : (box?.hasMore ? '' : 'Не найдено');
      if (hits.length) go(0);
      else if (box?.hasMore && !deep) { clear(counter).append(h('button', { class: 'link', onclick: () => run(true) }, 'Искать во всей истории')); }
    };
    let t;
    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => run(false), 250); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(pos + 1); } if (e.key === 'Escape') close(); });
    const close = () => { S.searchQ = ''; S.searchOpen = false; renderHead(); renderMessages('keep'); };
    S.searchOpen = true;
    clear(head).append(
      h('button', { class: 'icon-btn', 'aria-label': 'Закрыть поиск', onclick: close }, icon('back', 24)),
      h('div', { class: 'search search-in-chat' }, icon('search', 18), input), counter,
      h('button', { class: 'icon-btn', 'aria-label': 'Предыдущее совпадение', onclick: () => go(pos + 1) }, icon('up', 22)),
      h('button', { class: 'icon-btn', 'aria-label': 'Следующее совпадение', onclick: () => go(pos - 1) }, icon('down', 22)));
    input.focus();
  }
  function highlight(nodes) {
    const qv = S.searchQ;
    if (!qv) return nodes;
    const out = [];
    for (const n of nodes) {
      if (typeof n !== 'string') { out.push(n); continue; }
      const low = n.toLowerCase();
      let i = 0, j;
      while ((j = low.indexOf(qv, i)) >= 0) { if (j > i) out.push(n.slice(i, j)); out.push(h('mark', null, n.slice(j, j + qv.length))); i = j + qv.length; }
      if (i < n.length) out.push(n.slice(i));
    }
    return out;
  }

  /* Пересылка: сообщение заново шифруется для участников другого чата */
  function forwardMessage(m, p, fromName) {
    const chats = [...S.chats.values()].sort((a, b) => lastTs(b) - lastTs(a));
    const close = modal('Переслать', [h('div', { class: 'card' }, chats.map((c) => h('button', { class: 'card-row', onclick: async () => {
      close();
      try {
        const payload = { ...p, fwd: p.fwd || fromName };
        delete payload.reply;
        if (p.t === 'file') await api(`/api/files/${p.fileId}/share`, { body: { chatId: c.id } });
        await sendPayload(payload, c.id);
        toast(`Переслано: ${chatTitle(c)}`);
      } catch (e) { toast('Не удалось переслать: ' + e.message); }
    } }, avatar(c, 40), h('span', { class: 'grow' }, h('b', null, chatTitle(c)), h('small', null, c.type === 'group' ? 'Группа' : '@' + (other(c)?.username || ''))))))]);
  }

  /* Опросы */
  function openPollEditor(chat) {
    const question = h('input', { class: 'input', maxlength: 200, placeholder: 'Например: Куда идём в субботу?' });
    const box = h('div', { class: 'poll-opts' });
    const multiple = h('button', { class: 'sw', role: 'switch', 'aria-checked': 'false', 'aria-label': 'Несколько ответов',
      onclick: () => multiple.setAttribute('aria-checked', String(multiple.getAttribute('aria-checked') !== 'true')) });
    const addOpt = (val = '') => {
      if (box.children.length >= 10) return;
      const inp = h('input', { class: 'input', maxlength: 100, placeholder: `Вариант ${box.children.length + 1}`, value: val });
      const row = h('div', { class: 'poll-opt-row' }, inp, h('button', { class: 'icon-btn', 'aria-label': 'Убрать вариант', onclick: () => { if (box.children.length > 2) row.remove(); } }, icon('close', 18)));
      box.append(row);
      return inp;
    };
    addOpt(); addOpt();
    const close = modal('Новый опрос', [
      h('label', { class: 'field-label' }, 'Вопрос', question),
      h('div', { class: 'field-label' }, 'Варианты ответа', box,
        h('button', { class: 'btn ghost', onclick: () => addOpt()?.focus() }, icon('plus', 18), 'Добавить вариант')),
      h('div', { class: 'card' }, h('div', { class: 'card-row' }, h('span', { class: 'grow' }, h('b', null, 'Несколько ответов'), h('small', null, 'Можно выбрать больше одного варианта')), multiple)),
      h('button', { class: 'btn block big', onclick: () => {
        const opts = [...box.querySelectorAll('input')].map((i) => i.value.trim()).filter(Boolean);
        if (!question.value.trim()) return toast('Напишите вопрос');
        if (opts.length < 2) return toast('Нужно минимум два варианта');
        close();
        sendPayload({ t: 'poll', question: question.value.trim(), options: opts, multiple: multiple.getAttribute('aria-checked') === 'true' }, chat.id);
      } }, 'Отправить опрос'),
    ]);
    setTimeout(() => question.focus(), 40);
  }
  function pollEl(m, p, chat) {
    const votes = m.votes || {};
    const voters = new Set(Object.values(votes).flat());
    const total = voters.size;
    const mineSet = new Set(Object.entries(votes).filter(([, ids]) => ids.includes(S.me.id)).map(([k]) => Number(k)));
    const voted = mineSet.size > 0;
    const sel = new Set(mineSet);
    const submit = h('button', { class: 'btn poll-submit', hidden: !p.multiple || voted }, 'Голосовать');
    const send = async (options) => {
      try { const r = await api(`/api/messages/${m.id}/vote`, { body: { options } }); m.votes = r.votes; renderMessages('keep'); } catch (e) { toast(e.message); }
    };
    const rows = p.options.map((label, i) => {
      const n = (votes[i] || []).length;
      const pct = total ? Math.round((n / total) * 100) : 0;
      const names = (votes[i] || []).map((id) => memberOf(chat, id)?.displayName || '…').join(', ');
      const b = h('button', { class: 'poll-row' + (mineSet.has(i) ? ' mine' : ''), title: names, onclick: () => {
        if (voted) return;
        if (!p.multiple) return send([i]);
        sel.has(i) ? sel.delete(i) : sel.add(i);
        b.classList.toggle('picked', sel.has(i));
      } },
      h('span', { class: 'poll-fill', style: `width:${voted ? pct : 0}%` }),
      h('span', { class: 'poll-mark' }, mineSet.has(i) ? icon('check', 14, 3) : null),
      h('span', { class: 'poll-label' }, label),
      voted ? h('span', { class: 'poll-pct' }, pct + '%') : null);
      return b;
    });
    submit.addEventListener('click', () => sel.size && send([...sel]));
    return h('div', { class: 'poll' },
      h('b', { class: 'poll-q' }, p.question),
      h('small', { class: 'poll-kind' }, p.multiple ? 'Опрос · несколько ответов' : 'Опрос'),
      ...rows, submit,
      h('div', { class: 'poll-foot' }, h('span', null, total ? `${total} ${plural(total, 'голос', 'голоса', 'голосов')}` : 'Пока никто не голосовал'),
        voted ? h('button', { class: 'link', onclick: () => send([]) }, 'Отменить голос') : null));
  }

  /* ================= ПОДАРКИ И ЗВЁЗДЫ ================= */
  const starBadge = (n) => h('span', { class: 'stars' }, icon('starFill', 15, 0), String(n));
  async function getCatalog(force) {
    if (!S.catalog || force) S.catalog = await api('/api/gifts/catalog');
    return S.catalog;
  }
  async function getWallet() { S.wallet = await api('/api/wallet'); return S.wallet; }
  const giftArt = (g, size, cls = '') => h('div', { class: 'gift-art ' + cls + (g.upgraded ? ' up' : ''), style: `width:${size}px;height:${size}px` },
    TihoGifts.el(g.type, g.upgraded ? { model: g.model?.name, backdrop: g.backdrop?.name, symbol: g.symbol?.name } : {}));
  const giftTitle = (g) => g.name + (g.upgraded && g.serial ? ` #${g.serial}` : '');

  /* Магазин подарков для конкретного человека */
  async function openGiftShop(user) {
    let cat, w;
    try { [cat, w] = await Promise.all([getCatalog(true), getWallet()]); } catch (e) { toast(e.message); return; }
    const close = modal('Подарок для ' + user.displayName, [
      h('div', { class: 'wallet-line' }, h('span', null, 'Ваш баланс'), starBadge(w.stars),
        h('button', { class: 'link', onclick: () => { close(); openWallet(); } }, 'Пополнить')),
      h('div', { class: 'gift-grid' }, cat.gifts.map((g) => {
        const out = g.left === 0;
        return h('button', { class: 'gift-card', disabled: out, onclick: () => { close(); confirmGift(user, g, w.stars); } },
          giftArt({ type: g.id }, 84),
          h('b', null, g.name),
          out ? h('span', { class: 'sold' }, 'Раскуплено') : starBadge(g.price),
          g.supply ? h('small', { class: 'limited' }, out ? `тираж ${g.supply}` : `осталось ${g.left} из ${g.supply}`) : null);
      })),
      h('p', { class: 'muted', style: 'margin:0;font-size:13px;line-height:1.45' },
        'Подарок появится в профиле получателя. Его можно улучшить до коллекционного — с номером и редкими узорами — или обменять на звёзды.'),
    ]);
  }
  function confirmGift(user, g, balance) {
    const err = h('div', { class: 'err', role: 'alert' });
    const btn = h('button', { class: 'btn block big', disabled: balance < g.price }, 'Подарить за ', starBadge(g.price));
    const close = modal('Подарок', [
      h('div', { class: 'gift-hero' }, giftArt({ type: g.id }, 168, 'pop-in'), h('h3', null, g.name),
        h('span', { class: 'muted' }, `для ${user.displayName}`),
        g.supply ? h('span', { class: 'limited' }, `Лимитированный · осталось ${g.left} из ${g.supply}`) : null),
      balance < g.price ? h('div', { class: 'note' }, icon('warn', 18), h('span', null, `Не хватает звёзд: у вас ${balance}. Заберите ежедневный бонус в разделе «Звёзды».`)) : null,
      err, btn,
    ]);
    btn.addEventListener('click', async () => {
      btn.disabled = true; err.textContent = '';
      try {
        const r = await api('/api/gifts/send', { body: { type: g.id, userId: user.id } });
        S.wallet = { ...S.wallet, ...r.wallet };
        close(); toast(`Подарок «${g.name}» отправлен`);
        if (!S.chats.has(r.chatId)) await loadChats();
        openChat(r.chatId);
      } catch (e) { err.textContent = e.message; btn.disabled = false; }
    });
  }

  /* Карточка подарка */
  async function openGift(id) {
    let g;
    try { g = (await api('/api/gifts/' + id)).gift; } catch (e) { toast(e.message); return; }
    const mine = g.owner?.id === S.me.id;
    const attr = (label, a) => a ? h('div', { class: 'attr' }, h('span', null, label), h('b', null, a.name), h('em', null, (a.rarity < 1 ? a.rarity.toFixed(1) : a.rarity.toFixed(0)) + '%')) : null;
    const rows = h('div', { class: 'card gift-rows' },
      h('div', { class: 'gr' }, h('span', null, 'Владелец'), h('b', null, g.owner ? g.owner.displayName : '—')),
      g.sender ? h('div', { class: 'gr' }, h('span', null, 'От кого'), h('b', null, g.sender.displayName)) : null,
      h('div', { class: 'gr' }, h('span', null, 'Получен'), h('b', null, new Date(g.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }))),
      g.upgraded ? null : h('div', { class: 'gr' }, h('span', null, 'Цена'), starBadge(g.price)));
    const actions = [];
    if (mine && !g.upgraded) {
      actions.push(h('button', { class: 'btn block big shine', onclick: () => upgradeGift(g, close) }, icon('sparkle', 18), 'Сделать коллекционным за ', starBadge(g.upgradePrice)));
      actions.push(h('button', { class: 'btn ghost block', onclick: async () => {
        if (!confirm(`Обменять «${g.name}» на ${g.convertValue} звёзд? Подарок исчезнет из профиля.`)) return;
        try { await api(`/api/gifts/${g.id}/convert`, { method: 'POST' }); close(); toast(`+${g.convertValue} звёзд`); refreshGiftViews(); } catch (e) { toast(e.message); }
      } }, icon('swap', 18), `Обменять на ${g.convertValue} звёзд`));
    }
    if (mine && g.upgraded) {
      actions.push(h('button', { class: 'btn block big', onclick: () => { close(); chooseRecipient(g); } }, icon('send', 18), 'Передать'));
    }
    if (mine) {
      actions.push(h('button', { class: 'btn ghost block', onclick: async () => {
        try { await api(`/api/gifts/${g.id}/hide`, { body: { hidden: !g.hidden } }); close(); toast(g.hidden ? 'Подарок снова в профиле' : 'Подарок скрыт из профиля'); refreshGiftViews(); } catch (e) { toast(e.message); }
      } }, icon(g.hidden ? 'eye' : 'eyeOff', 18), g.hidden ? 'Показать в профиле' : 'Скрыть из профиля'));
    }
    const close = modal(g.upgraded ? 'Коллекционный подарок' : 'Подарок', [
      h('div', { class: 'gift-hero' }, giftArt(g, 200, 'pop-in'), h('h3', null, giftTitle(g)),
        g.upgraded ? h('span', { class: 'muted' }, g.supply ? `Коллекционный · ${g.serial} из ${g.supply}` : `Коллекционный · №${g.serial}`) : h('span', { class: 'muted' }, 'Обычный подарок')),
      g.upgraded ? h('div', { class: 'attrs' }, attr('Модель', g.model), attr('Фон', g.backdrop), attr('Узор', g.symbol)) : null,
      rows, ...actions,
    ]);
  }
  async function upgradeGift(g, closePrev) {
    try {
      const r = await api(`/api/gifts/${g.id}/upgrade`, { method: 'POST' });
      closePrev();
      const reveal = h('div', { class: 'reveal' }, h('div', { class: 'reveal-spin' }, giftArt({ type: g.type }, 200)));
      const close = modal('Улучшаем…', [reveal]);
      setTimeout(() => { close(); openGift(r.gift.id); refreshGiftViews(); }, 1400);
    } catch (e) { toast(e.message); }
  }
  function chooseRecipient(g) {
    const people = allContacts();
    const close = modal(`Кому передать «${giftTitle(g)}»?`, [
      people.length ? h('div', { class: 'card' }, people.map((u) => h('button', { class: 'card-row', onclick: async () => {
        if (!confirm(`Передать «${giftTitle(g)}» пользователю ${u.displayName}? Подарок станет его.`)) return;
        try { const r = await api(`/api/gifts/${g.id}/transfer`, { body: { userId: u.id } }); close(); toast('Подарок передан'); if (!S.chats.has(r.chatId)) await loadChats(); openChat(r.chatId); }
        catch (e) { toast(e.message); }
      } }, userAvatar(u, 40), h('span', { class: 'grow' }, h('b', null, u.displayName), h('small', null, '@' + u.username)))))
        : h('p', { class: 'muted' }, 'Сначала начните переписку с человеком, которому хотите передать подарок.'),
    ]);
  }
  function giftGrid(gifts, size = 96, beforeOpen) {
    return h('div', { class: 'gift-shelf' }, gifts.map((g) => h('button', { class: 'shelf-item' + (g.hidden ? ' hidden-gift' : ''), onclick: () => { beforeOpen?.(); openGift(g.id); }, 'aria-label': giftTitle(g) },
      giftArt(g, size), h('span', null, giftTitle(g)))));
  }
  async function openMyGifts() {
    let gifts = [];
    try { gifts = (await api(`/api/users/${S.me.id}/gifts`)).gifts; } catch (e) { toast(e.message); return; }
    const close = modal('Мои подарки', [gifts.length ? giftGrid(gifts, 96, () => close()) : h('div', { class: 'list-empty' },
      h('div', { class: 'empty-ic' }, icon('gift', 28)), h('b', null, 'Пока нет подарков'),
      h('span', null, 'Подарите что-нибудь другу — откройте его профиль и нажмите «Подарить».'))]);
  }
  async function openWallet() {
    let w;
    try { w = await getWallet(); } catch (e) { toast(e.message); return; }
    const left = Math.max(0, w.nextClaimAt - Date.now());
    const hrs = Math.floor(left / 3600000), mins = Math.ceil((left % 3600000) / 60000);
    const claim = h('button', { class: 'btn block big', disabled: !w.canClaim }, w.canClaim ? `Забрать ${w.daily} звёзд` : `Следующий бонус через ${hrs ? hrs + ' ч ' : ''}${mins} мин`);
    claim.addEventListener('click', async () => {
      claim.disabled = true;
      try { S.wallet = await api('/api/wallet/daily', { method: 'POST' }); close(); toast(`+${w.daily} звёзд`); renderMe(); openWallet(); } catch (e) { toast(e.message); }
    });
    const close = modal('Звёзды', [
      h('div', { class: 'wallet-hero' }, h('div', { class: 'big-star' }, icon('starFill', 44, 0)), h('b', null, String(w.stars)), h('span', { class: 'muted' }, 'звёзд на балансе')),
      claim,
      h('p', { class: 'muted', style: 'margin:0;font-size:13px;line-height:1.45;text-align:center' }, 'Звёзды — внутренняя валюта «Тихо» для подарков. Каждый день можно забрать бонус.'),
      w.history?.length ? h('div', { class: 'section' }, h('div', { class: 'section-title' }, 'История'),
        h('div', { class: 'card' }, w.history.map((x) => h('div', { class: 'card-row hist' },
          h('span', { class: 'grow' }, h('b', null, x.reason), h('small', null, new Date(x.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))),
          h('b', { class: x.amount > 0 ? 'plus' : 'minus' }, (x.amount > 0 ? '+' : '') + x.amount))))) : null,
    ]);
  }
  function refreshGiftViews() {
    if (S.tab === 'profile') renderProfileTab();
    if (S.page?.type === 'contact') renderPane();
  }
  function giftBubble(m, p, mine, sender) {
    const t = (S.catalog?.gifts || []).find((x) => x.id === p.type);
    const name = t?.name || 'Подарок';
    const who = sender?.displayName?.split(' ')[0] || 'Собеседник';
    const text = p.action === 'transfer'
      ? (mine ? `Вы передали коллекционный «${name}»` : `${who} передаёт вам коллекционный «${name}»`)
      : (mine ? `Вы подарили «${name}»` : `${who} дарит вам «${name}»`);
    return h('div', { class: 'gift-msg' }, giftArt({ type: p.type }, 120, 'float'), h('b', null, text),
      h('button', { class: 'btn ghost gift-open', onclick: () => openGift(p.giftId) }, mine ? 'Посмотреть' : 'Открыть подарок'));
  }

  /* ================= ЗАПУСК ================= */
  async function boot() {
    applyTheme();
    if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('/sw.js').catch(() => {});
    if (!window.isSecureContext || !crypto.subtle) {
      authShell(h('div', { class: 'note' }, icon('warn', 18), h('span', null, 'Шифрование работает только по защищённому адресу (https://). Откройте мессенджер через https.')));
      return;
    }
    clear(root).append(h('div', { class: 'splash' }, h('div', { class: 'pulse' }, logoMark(88)),
      h('p', { class: 'splash-word' }, 'Тихо'), h('p', { class: 'splash-tag' }, 'Твои разговоры — только твои')));
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
