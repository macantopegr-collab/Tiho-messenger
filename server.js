'use strict';
/*
 * Тихо — сервер мессенджера.
 * Сервер хранит только зашифрованные сообщения и файлы: расшифровать их
 * могут лишь участники чата, у которых есть приватные ключи (в браузере).
 */
const path = require('path');
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const express = require('express');
const { WebSocketServer } = require('ws');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const FILES_DIR = path.join(DATA_DIR, 'files');
const REGISTRATION_CODE = process.env.REGISTRATION_CODE || '';
const MAX_FILE = Number(process.env.MAX_FILE_MB || 25) * 1024 * 1024;
const SESSION_DAYS = 60;

fs.mkdirSync(FILES_DIR, { recursive: true });

/* ---------- База ---------- */
const db = new Database(path.join(DATA_DIR, 'tiho.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  pass_hash TEXT NOT NULL,
  public_key TEXT NOT NULL,
  key_backup TEXT NOT NULL,
  color INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS chats (
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('direct','group')),
  title TEXT,
  direct_key TEXT UNIQUE,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS members (
  chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_id INTEGER NOT NULL DEFAULT 0,
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (chat_id, user_id)
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY,
  chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id),
  kind TEXT NOT NULL DEFAULT 'msg',
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id, id);
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  uploader_id INTEGER NOT NULL REFERENCES users(id),
  size INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
`);

const now = () => Date.now();
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

const q = {
  userByName: db.prepare('SELECT * FROM users WHERE username = ?'),
  userById: db.prepare('SELECT * FROM users WHERE id = ?'),
  insertUser: db.prepare(`INSERT INTO users (username, display_name, pass_hash, public_key, key_backup, color, created_at)
                          VALUES (?, ?, ?, ?, ?, ?, ?)`),
  updateProfile: db.prepare('UPDATE users SET display_name = ? WHERE id = ?'),
  insertSession: db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)'),
  sessionUser: db.prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
                           WHERE s.token_hash = ? AND s.expires_at > ?`),
  deleteSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
  purgeSessions: db.prepare('DELETE FROM sessions WHERE expires_at <= ?'),
  searchUsers: db.prepare(`SELECT id, username, display_name, color FROM users
                           WHERE (username LIKE ? ESCAPE '\\' OR display_name LIKE ? ESCAPE '\\') AND id != ?
                           ORDER BY username LIMIT 20`),
  chatById: db.prepare('SELECT * FROM chats WHERE id = ?'),
  chatByDirectKey: db.prepare('SELECT * FROM chats WHERE direct_key = ?'),
  insertChat: db.prepare('INSERT INTO chats (type, title, direct_key, created_by, created_at) VALUES (?, ?, ?, ?, ?)'),
  insertMember: db.prepare('INSERT OR IGNORE INTO members (chat_id, user_id, joined_at) VALUES (?, ?, ?)'),
  deleteMember: db.prepare('DELETE FROM members WHERE chat_id = ? AND user_id = ?'),
  isMember: db.prepare('SELECT 1 FROM members WHERE chat_id = ? AND user_id = ?'),
  chatMembers: db.prepare(`SELECT u.id, u.username, u.display_name, u.public_key, u.color, m.last_read_id
                           FROM members m JOIN users u ON u.id = m.user_id WHERE m.chat_id = ? ORDER BY u.id`),
  memberIds: db.prepare('SELECT user_id FROM members WHERE chat_id = ?'),
  myChats: db.prepare(`SELECT c.*, m.last_read_id,
                         (SELECT MAX(id) FROM messages WHERE chat_id = c.id) AS last_id,
                         (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND id > m.last_read_id
                            AND (sender_id IS NULL OR sender_id != m.user_id)) AS unread
                       FROM members m JOIN chats c ON c.id = m.chat_id WHERE m.user_id = ?`),
  messageById: db.prepare('SELECT * FROM messages WHERE id = ?'),
  insertMessage: db.prepare('INSERT INTO messages (chat_id, sender_id, kind, body, created_at) VALUES (?, ?, ?, ?, ?)'),
  messagesBefore: db.prepare('SELECT * FROM messages WHERE chat_id = ? AND id < ? ORDER BY id DESC LIMIT ?'),
  setRead: db.prepare('UPDATE members SET last_read_id = MAX(last_read_id, ?) WHERE chat_id = ? AND user_id = ?'),
  insertFile: db.prepare('INSERT INTO files (id, chat_id, uploader_id, size, created_at) VALUES (?, ?, ?, ?, ?)'),
  fileById: db.prepare('SELECT * FROM files WHERE id = ?'),
  contactIds: db.prepare(`SELECT DISTINCT m2.user_id AS id FROM members m1
                          JOIN members m2 ON m2.chat_id = m1.chat_id WHERE m1.user_id = ? AND m2.user_id != ?`),
  deleteEmptyChat: db.prepare('DELETE FROM chats WHERE id = ? AND NOT EXISTS (SELECT 1 FROM members WHERE chat_id = ?)'),
};

setInterval(() => q.purgeSessions.run(now()), 6 * 3600 * 1000).unref();

/* ---------- Вспомогательное ---------- */
const cookie = {
  parse(header) {
    const out = {};
    for (const part of String(header || '').split(';')) {
      const i = part.indexOf('=');
      if (i < 0) continue;
      const k = part.slice(0, i).trim();
      if (k && !(k in out)) { try { out[k] = decodeURIComponent(part.slice(i + 1).trim()); } catch { /* битая кука */ } }
    }
    return out;
  },
  serialize(name, value, o = {}) {
    let s = `${name}=${encodeURIComponent(value)}; Path=${o.path || '/'}; Max-Age=${o.maxAge ?? 0}`;
    if (o.httpOnly) s += '; HttpOnly';
    if (o.sameSite) s += '; SameSite=' + o.sameSite[0].toUpperCase() + o.sameSite.slice(1);
    if (o.secure) s += '; Secure';
    return s;
  },
};
const publicUser = (u) => ({ id: u.id, username: u.username, displayName: u.display_name, color: u.color });
const memberView = (m) => ({
  id: m.id, username: m.username, displayName: m.display_name, color: m.color,
  publicKey: m.public_key, lastReadId: m.last_read_id, online: online.has(m.id),
});
const messageView = (m) => ({
  id: m.id, chatId: m.chat_id, senderId: m.sender_id, kind: m.kind,
  body: m.kind === 'msg' ? JSON.parse(m.body) : JSON.parse(m.body), createdAt: m.created_at,
});

function chatView(chat, userId) {
  const members = q.chatMembers.all(chat.id).map(memberView);
  const last = chat.last_id ? q.messageById.get(chat.last_id) : null;
  return {
    id: chat.id, type: chat.type, title: chat.title, createdAt: chat.created_at,
    members, lastMessage: last ? messageView(last) : null,
    unread: chat.unread ?? 0, lastReadId: chat.last_read_id ?? members.find((m) => m.id === userId)?.lastReadId ?? 0,
  };
}
function fullChat(chatId, userId) {
  const row = q.myChats.all(userId).find((c) => c.id === chatId);
  return row ? chatView(row, userId) : null;
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;
const cleanName = (s) => String(s || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 64);
const isB64 = (s, max) => typeof s === 'string' && s.length > 0 && s.length <= max && /^[A-Za-z0-9+/=_-]+$/.test(s);

/* Простая защита от перебора паролей */
const attempts = new Map();
function rateLimited(key, limit = 20, windowMs = 10 * 60 * 1000) {
  const t = now();
  const a = (attempts.get(key) || []).filter((x) => t - x < windowMs);
  a.push(t);
  attempts.set(key, a);
  return a.length > limit;
}
setInterval(() => attempts.clear(), 30 * 60 * 1000).unref();

/* ---------- HTTP ---------- */
const app = express();
app.set('trust proxy', 'loopback');
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; img-src 'self' blob: data:; media-src 'self' blob:; " +
    "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src https://fonts.gstatic.com; " +
    "connect-src 'self' ws: wss:; script-src 'self'; frame-ancestors 'none'; base-uri 'none'");
  next();
});

function auth(req, res, next) {
  const token = cookie.parse(req.headers.cookie || '').tiho_session;
  const user = token && q.sessionUser.get(sha256(token), now());
  if (!user) return res.status(401).json({ error: 'Нужно войти' });
  req.user = user;
  next();
}
function startSession(req, res, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  q.insertSession.run(sha256(token), userId, now() + SESSION_DAYS * 86400000);
  res.setHeader('Set-Cookie', cookie.serialize('tiho_session', token, {
    httpOnly: true, sameSite: 'strict', secure: req.secure, path: '/', maxAge: SESSION_DAYS * 86400,
  }));
}
const fail = (res, code, error) => res.status(code).json({ error });

const json = express.json({ limit: '256kb' });

app.get('/api/config', (req, res) => res.json({ needCode: !!REGISTRATION_CODE, maxFile: MAX_FILE }));

app.post('/api/register', json, (req, res) => {
  if (rateLimited('reg:' + req.ip, 10)) return fail(res, 429, 'Слишком много попыток, подождите');
  const { username, displayName, auth: authKey, publicKey, keyBackup, code } = req.body || {};
  if (REGISTRATION_CODE && code !== REGISTRATION_CODE) return fail(res, 403, 'Неверный код приглашения');
  if (!USERNAME_RE.test(username || '')) return fail(res, 400, 'Логин: 3–32 символа, латиница, цифры и _');
  const name = cleanName(displayName) || username;
  if (!isB64(authKey, 200) || !isB64(publicKey, 400)) return fail(res, 400, 'Некорректные данные ключа');
  if (!keyBackup || !isB64(keyBackup.iv, 64) || !isB64(keyBackup.ct, 1000)) return fail(res, 400, 'Некорректная резервная копия ключа');
  if (q.userByName.get(username)) return fail(res, 409, 'Этот логин уже занят');
  const hash = bcrypt.hashSync(authKey, 11);
  const color = crypto.randomInt(0, 8);
  const info = q.insertUser.run(username, name, hash, publicKey, JSON.stringify({ iv: keyBackup.iv, ct: keyBackup.ct }), color, now());
  startSession(req, res, info.lastInsertRowid);
  res.json({ user: publicUser(q.userById.get(info.lastInsertRowid)) });
});

app.post('/api/login', json, (req, res) => {
  if (rateLimited('login:' + req.ip)) return fail(res, 429, 'Слишком много попыток, подождите 10 минут');
  const { username, auth: authKey } = req.body || {};
  const user = typeof username === 'string' && q.userByName.get(username);
  if (!user || typeof authKey !== 'string' || !bcrypt.compareSync(authKey, user.pass_hash)) {
    return fail(res, 401, 'Неверный логин или пароль');
  }
  startSession(req, res, user.id);
  res.json({ user: publicUser(user), publicKey: user.public_key, keyBackup: JSON.parse(user.key_backup) });
});

app.post('/api/logout', (req, res) => {
  const token = cookie.parse(req.headers.cookie || '').tiho_session;
  if (token) q.deleteSession.run(sha256(token));
  res.setHeader('Set-Cookie', cookie.serialize('tiho_session', '', { path: '/', maxAge: 0 }));
  res.json({ ok: true });
});

app.get('/api/me', auth, (req, res) => {
  res.json({ user: publicUser(req.user), publicKey: req.user.public_key, keyBackup: JSON.parse(req.user.key_backup) });
});

app.patch('/api/me', auth, json, (req, res) => {
  const name = cleanName(req.body?.displayName);
  if (!name) return fail(res, 400, 'Имя не может быть пустым');
  q.updateProfile.run(name, req.user.id);
  const u = q.userById.get(req.user.id);
  for (const id of [u.id, ...q.contactIds.all(u.id, u.id).map((r) => r.id)]) sendTo(id, { type: 'user', user: publicUser(u) });
  res.json({ user: publicUser(u) });
});

app.get('/api/users/search', auth, (req, res) => {
  const s = String(req.query.q || '').trim().replace(/^@/, '');
  if (s.length < 2) return res.json({ users: [] });
  const like = '%' + s.replace(/[\\%_]/g, (c) => '\\' + c) + '%';
  res.json({ users: q.searchUsers.all(like, like, req.user.id).map(publicUser) });
});

app.get('/api/users/:id', auth, (req, res) => {
  const u = q.userById.get(Number(req.params.id));
  if (!u) return fail(res, 404, 'Пользователь не найден');
  res.json({ user: { ...publicUser(u), publicKey: u.public_key } });
});

app.get('/api/chats', auth, (req, res) => {
  res.json({ chats: q.myChats.all(req.user.id).map((c) => chatView(c, req.user.id)) });
});

function addSystem(chatId, text) {
  const info = q.insertMessage.run(chatId, null, 'system', JSON.stringify({ text }), now());
  return q.messageById.get(info.lastInsertRowid);
}
function broadcastChat(chatId) {
  for (const { user_id } of q.memberIds.all(chatId)) {
    const c = fullChat(chatId, user_id);
    if (c) sendTo(user_id, { type: 'chat', chat: c });
  }
}

app.post('/api/chats/direct', auth, json, (req, res) => {
  const other = q.userById.get(Number(req.body?.userId));
  if (!other) return fail(res, 404, 'Пользователь не найден');
  const ids = [req.user.id, other.id].sort((a, b) => a - b);
  const key = ids.join(':');
  let chat = q.chatByDirectKey.get(key);
  if (!chat) {
    db.transaction(() => {
      const info = q.insertChat.run('direct', null, key, req.user.id, now());
      for (const id of new Set(ids)) q.insertMember.run(info.lastInsertRowid, id, now());
      chat = q.chatById.get(info.lastInsertRowid);
    })();
    broadcastChat(chat.id);
  }
  res.json({ chat: fullChat(chat.id, req.user.id) });
});

app.post('/api/chats/group', auth, json, (req, res) => {
  const title = cleanName(req.body?.title);
  const ids = Array.isArray(req.body?.memberIds) ? req.body.memberIds.map(Number) : [];
  if (!title) return fail(res, 400, 'Укажите название группы');
  const valid = [...new Set(ids)].filter((id) => id !== req.user.id && q.userById.get(id)).slice(0, 199);
  let chatId;
  db.transaction(() => {
    chatId = q.insertChat.run('group', title, null, req.user.id, now()).lastInsertRowid;
    q.insertMember.run(chatId, req.user.id, now());
    for (const id of valid) q.insertMember.run(chatId, id, now());
    addSystem(chatId, `${req.user.display_name} создал(а) группу «${title}»`);
  })();
  broadcastChat(chatId);
  res.json({ chat: fullChat(chatId, req.user.id) });
});

function requireMember(req, res) {
  const chat = q.chatById.get(Number(req.params.id));
  if (!chat || !q.isMember.get(chat.id, req.user.id)) { fail(res, 404, 'Чат не найден'); return null; }
  return chat;
}

app.post('/api/chats/:id/members', auth, json, (req, res) => {
  const chat = requireMember(req, res); if (!chat) return;
  if (chat.type !== 'group') return fail(res, 400, 'Добавлять участников можно только в группу');
  const ids = Array.isArray(req.body?.userIds) ? req.body.userIds.map(Number) : [];
  const added = [];
  db.transaction(() => {
    for (const id of new Set(ids)) {
      const u = q.userById.get(id);
      if (u && !q.isMember.get(chat.id, id)) { q.insertMember.run(chat.id, id, now()); added.push(u); }
    }
    if (added.length) addSystem(chat.id, `${req.user.display_name} добавил(а): ${added.map((u) => u.display_name).join(', ')}`);
  })();
  broadcastChat(chat.id);
  res.json({ chat: fullChat(chat.id, req.user.id) });
});

app.post('/api/chats/:id/leave', auth, (req, res) => {
  const chat = requireMember(req, res); if (!chat) return;
  if (chat.type !== 'group') return fail(res, 400, 'Из личного чата выйти нельзя');
  q.deleteMember.run(chat.id, req.user.id);
  addSystem(chat.id, `${req.user.display_name} покинул(а) группу`);
  q.deleteEmptyChat.run(chat.id, chat.id);
  sendTo(req.user.id, { type: 'chatRemoved', chatId: chat.id });
  if (q.chatById.get(chat.id)) broadcastChat(chat.id);
  res.json({ ok: true });
});

app.get('/api/chats/:id/messages', auth, (req, res) => {
  const chat = requireMember(req, res); if (!chat) return;
  const before = Number(req.query.before) || Number.MAX_SAFE_INTEGER;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const rows = q.messagesBefore.all(chat.id, before, limit).reverse();
  res.json({ messages: rows.map(messageView) });
});

function validEnvelope(e) {
  if (!e || e.v !== 1 || !isB64(e.iv, 64) || typeof e.ct !== 'string' || e.ct.length > 120000 || !isB64(e.epk, 400)) return false;
  if (!e.keys || typeof e.keys !== 'object') return false;
  return Object.values(e.keys).every((k) => k && isB64(k.iv, 64) && isB64(k.wk, 200));
}

app.post('/api/chats/:id/messages', auth, json, (req, res) => {
  const chat = requireMember(req, res); if (!chat) return;
  const env = req.body?.envelope;
  if (!validEnvelope(env)) return fail(res, 400, 'Некорректное зашифрованное сообщение');
  const info = q.insertMessage.run(chat.id, req.user.id, 'msg', JSON.stringify(env), now());
  q.setRead.run(info.lastInsertRowid, chat.id, req.user.id);
  const msg = messageView(q.messageById.get(info.lastInsertRowid));
  for (const { user_id } of q.memberIds.all(chat.id)) sendTo(user_id, { type: 'message', message: msg, clientId: req.body.clientId });
  res.json({ message: msg });
});

app.post('/api/chats/:id/read', auth, json, (req, res) => {
  const chat = requireMember(req, res); if (!chat) return;
  const id = Number(req.body?.messageId) || 0;
  q.setRead.run(id, chat.id, req.user.id);
  for (const { user_id } of q.memberIds.all(chat.id)) sendTo(user_id, { type: 'read', chatId: chat.id, userId: req.user.id, messageId: id });
  res.json({ ok: true });
});

/* Файлы: приходят уже зашифрованными, сервер хранит байты как есть */
app.post('/api/files', auth, express.raw({ type: 'application/octet-stream', limit: MAX_FILE + 1024 }), (req, res) => {
  const chatId = Number(req.query.chatId);
  if (!q.isMember.get(chatId, req.user.id)) return fail(res, 404, 'Чат не найден');
  if (!Buffer.isBuffer(req.body) || !req.body.length) return fail(res, 400, 'Пустой файл');
  const id = crypto.randomBytes(16).toString('hex');
  fs.writeFileSync(path.join(FILES_DIR, id), req.body);
  q.insertFile.run(id, chatId, req.user.id, req.body.length, now());
  res.json({ id });
});

app.get('/api/files/:id', auth, (req, res) => {
  const id = String(req.params.id);
  if (!/^[a-f0-9]{32}$/.test(id)) return fail(res, 404, 'Файл не найден');
  const f = q.fileById.get(id);
  if (!f || !q.isMember.get(f.chat_id, req.user.id)) return fail(res, 404, 'Файл не найден');
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
  fs.createReadStream(path.join(FILES_DIR, id)).pipe(res);
});

app.use('/api', (err, req, res, next) => {
  if (err.type === 'entity.too.large') return fail(res, 413, 'Файл слишком большой');
  console.error(err);
  fail(res, 500, 'Ошибка сервера');
});

app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html', maxAge: '1h' }));
app.get(/^\/(?!api|ws).*/, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

/* ---------- WebSocket ---------- */
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 });
const online = new Map(); // userId -> Set<ws>

function sendTo(userId, data) {
  const set = online.get(userId);
  if (!set) return;
  const s = JSON.stringify(data);
  for (const ws of set) if (ws.readyState === 1) ws.send(s);
}
function announcePresence(userId, isOnline) {
  for (const { id } of q.contactIds.all(userId, userId)) sendTo(id, { type: 'presence', userId, online: isOnline });
}

server.on('upgrade', (req, socket, head) => {
  if (!req.url.startsWith('/ws')) return socket.destroy();
  const token = cookie.parse(req.headers.cookie || '').tiho_session;
  const user = token && q.sessionUser.get(sha256(token), now());
  if (!user) { socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n'); return socket.destroy(); }
  wss.handleUpgrade(req, socket, head, (ws) => {
    ws.userId = user.id;
    ws.isAlive = true;
    if (!online.has(user.id)) { online.set(user.id, new Set()); announcePresence(user.id, true); }
    online.get(user.id).add(ws);
    ws.on('pong', () => { ws.isAlive = true; });
    ws.on('message', (raw) => {
      let m; try { m = JSON.parse(raw); } catch { return; }
      if (m.type === 'typing' && q.isMember.get(Number(m.chatId), user.id)) {
        for (const { user_id } of q.memberIds.all(Number(m.chatId))) {
          if (user_id !== user.id) sendTo(user_id, { type: 'typing', chatId: Number(m.chatId), userId: user.id });
        }
      }
    });
    ws.on('close', () => {
      const set = online.get(user.id);
      if (!set) return;
      set.delete(ws);
      if (!set.size) { online.delete(user.id); announcePresence(user.id, false); }
    });
  });
});

setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false;
    ws.ping();
  }
}, 30000).unref();

server.listen(PORT, HOST, () => console.log(`Тихо запущен: http://${HOST}:${PORT}`));
