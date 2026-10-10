'use strict';
/*
 * Тихо — сервер мессенджера.
 * Сервер хранит только зашифрованные сообщения и файлы: расшифровать их
 * могут лишь участники чата, у которых есть приватные ключи (в браузере).
 */
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const net = require('net');
const dns = require('dns');
const crypto = require('crypto');
const express = require('express');
const { WebSocketServer } = require('ws');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const FILES_DIR = path.join(DATA_DIR, 'files');
const AVATARS_DIR = path.join(DATA_DIR, 'avatars');
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const GOOGLE_JWKS_URL = process.env.GOOGLE_JWKS_URL || 'https://www.googleapis.com/oauth2/v3/certs';
const GIPHY_API_KEY = (process.env.GIPHY_API_KEY || '').trim();
const GIPHY_API_BASE = process.env.GIPHY_API_BASE || 'https://api.giphy.com';
const GIF_MEDIA_HOSTS = (process.env.GIF_MEDIA_HOSTS || 'giphy.com').split(',').map((x) => x.trim()).filter(Boolean);
const MAX_FILE = Number(process.env.MAX_FILE_MB || 25) * 1024 * 1024;
const SESSION_DAYS = 60;

fs.mkdirSync(FILES_DIR, { recursive: true });
fs.mkdirSync(AVATARS_DIR, { recursive: true });

/* ---------- База ---------- */
// Встроенная в Node.js база SQLite: ничего не нужно компилировать
const db = new DatabaseSync(path.join(DATA_DIR, 'tiho.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
db.transaction = (fn) => () => {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
};
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

/* Миграция: поля для двухфакторной аутентификации */
{
  const cols = new Set(db.prepare('PRAGMA table_info(users)').all().map((c) => c.name));
  if (!cols.has('totp_secret')) db.exec('ALTER TABLE users ADD COLUMN totp_secret TEXT');
  if (!cols.has('totp_pending')) db.exec('ALTER TABLE users ADD COLUMN totp_pending TEXT');
  if (!cols.has('totp_last_step')) db.exec('ALTER TABLE users ADD COLUMN totp_last_step INTEGER NOT NULL DEFAULT 0');
  if (!cols.has('backup_codes')) db.exec("ALTER TABLE users ADD COLUMN backup_codes TEXT NOT NULL DEFAULT '[]'");
  if (!cols.has('google_sub')) db.exec('ALTER TABLE users ADD COLUMN google_sub TEXT');
  if (!cols.has('email')) db.exec('ALTER TABLE users ADD COLUMN email TEXT');
  if (!cols.has('bio')) db.exec("ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT ''");
  if (!cols.has('last_seen')) db.exec('ALTER TABLE users ADD COLUMN last_seen INTEGER NOT NULL DEFAULT 0');
  if (!cols.has('avatar')) db.exec('ALTER TABLE users ADD COLUMN avatar INTEGER NOT NULL DEFAULT 0');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google ON users(google_sub) WHERE google_sub IS NOT NULL');
  const mcols = new Set(db.prepare('PRAGMA table_info(messages)').all().map((c) => c.name));
  if (!mcols.has('edited_at')) db.exec('ALTER TABLE messages ADD COLUMN edited_at INTEGER');
  if (!mcols.has('thread_id')) db.exec('ALTER TABLE messages ADD COLUMN thread_id INTEGER');
  db.exec('CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id, id)');
  const ccols = new Set(db.prepare('PRAGMA table_info(chats)').all().map((c) => c.name));
  if (!ccols.has('pinned_id')) db.exec('ALTER TABLE chats ADD COLUMN pinned_id INTEGER');
  const mbcols = new Set(db.prepare('PRAGMA table_info(members)').all().map((c) => c.name));
  if (!mbcols.has('archived')) db.exec('ALTER TABLE members ADD COLUMN archived INTEGER NOT NULL DEFAULT 0');
  if (!mbcols.has('role')) {
    db.exec("ALTER TABLE members ADD COLUMN role TEXT NOT NULL DEFAULT 'member'");
    db.exec("UPDATE members SET role = 'owner' WHERE EXISTS (SELECT 1 FROM chats c WHERE c.id = members.chat_id AND c.type = 'group' AND c.created_by = members.user_id)");
  }
  if (!ccols.has('secret')) db.exec('ALTER TABLE chats ADD COLUMN secret INTEGER NOT NULL DEFAULT 0');
  if (!ccols.has('ttl')) db.exec('ALTER TABLE chats ADD COLUMN ttl INTEGER NOT NULL DEFAULT 0');
  if (!mcols.has('expires_at')) db.exec('ALTER TABLE messages ADD COLUMN expires_at INTEGER');
  if (!mcols.has('file_ref')) db.exec('ALTER TABLE messages ADD COLUMN file_ref TEXT');
  if (!ccols.has('perms')) db.exec("ALTER TABLE chats ADD COLUMN perms TEXT NOT NULL DEFAULT '{}'");
  db.exec(`CREATE TABLE IF NOT EXISTS invites (
    code TEXT PRIMARY KEY, chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE, created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL DEFAULT 0, max_uses INTEGER NOT NULL DEFAULT 0, uses INTEGER NOT NULL DEFAULT 0, revoked INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS chat_bans (chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (chat_id, user_id));`);
  if (!mbcols.has('muted_until')) db.exec('ALTER TABLE members ADD COLUMN muted_until INTEGER NOT NULL DEFAULT 0');
  db.exec(`CREATE TABLE IF NOT EXISTS scheduled (
    id INTEGER PRIMARY KEY, chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, body TEXT NOT NULL, mentions TEXT NOT NULL DEFAULT '[]',
    send_at INTEGER NOT NULL, created_at INTEGER NOT NULL);
  CREATE INDEX IF NOT EXISTS idx_scheduled_at ON scheduled(send_at);`);
  if (!cols.has('folders')) db.exec("ALTER TABLE users ADD COLUMN folders TEXT NOT NULL DEFAULT '[]'");
  db.exec(`CREATE TABLE IF NOT EXISTS poll_votes (
    message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    option INTEGER NOT NULL,
    PRIMARY KEY (message_id, user_id, option));
  CREATE TABLE IF NOT EXISTS file_access (
    file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    PRIMARY KEY (file_id, chat_id));`);
  const scols = new Set(db.prepare('PRAGMA table_info(sessions)').all().map((c) => c.name));
  if (!scols.has('created_at')) db.exec('ALTER TABLE sessions ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0');
  if (!scols.has('last_active')) db.exec('ALTER TABLE sessions ADD COLUMN last_active INTEGER NOT NULL DEFAULT 0');
  if (!scols.has('user_agent')) db.exec("ALTER TABLE sessions ADD COLUMN user_agent TEXT NOT NULL DEFAULT ''");
  if (!scols.has('ip')) db.exec("ALTER TABLE sessions ADD COLUMN ip TEXT NOT NULL DEFAULT ''");
  if (!cols.has('banned')) db.exec('ALTER TABLE users ADD COLUMN banned INTEGER NOT NULL DEFAULT 0');
  db.exec(`CREATE TABLE IF NOT EXISTS blocks (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, blocked_id));
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY, reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL, target_id INTEGER NOT NULL, target_user_id INTEGER, reason TEXT NOT NULL,
    comment TEXT NOT NULL DEFAULT '', evidence TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'open', handled_by INTEGER, handled_at INTEGER);`);
  db.exec(`CREATE TABLE IF NOT EXISTS mentions (
    message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (message_id, user_id));
  CREATE INDEX IF NOT EXISTS idx_mentions_user ON mentions(user_id, chat_id, message_id);`);
  db.exec(`CREATE TABLE IF NOT EXISTS reactions (
    message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    PRIMARY KEY (message_id, user_id))`);
}

const now = () => Date.now();
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

const q = {
  userByName: db.prepare('SELECT * FROM users WHERE username = ?'),
  userById: db.prepare('SELECT * FROM users WHERE id = ?'),
  insertUser: db.prepare(`INSERT INTO users (username, display_name, pass_hash, public_key, key_backup, color, created_at)
                          VALUES (?, ?, ?, ?, ?, ?, ?)`),
  updateProfile: db.prepare('UPDATE users SET display_name = ? WHERE id = ?'),
  insertSession: db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at, last_active, user_agent, ip) VALUES (?, ?, ?, ?, ?, ?, ?)'),
  sessionUser: db.prepare(`SELECT u.*, s.rowid AS session_id, s.last_active AS session_active FROM sessions s JOIN users u ON u.id = s.user_id
                           WHERE s.token_hash = ? AND s.expires_at > ? AND u.banned = 0`),
  deleteSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
  purgeSessions: db.prepare('DELETE FROM sessions WHERE expires_at <= ?'),
  searchUsers: db.prepare(`SELECT id, username, display_name, color, bio, avatar, last_seen FROM users
                           WHERE (username LIKE ? ESCAPE '\\' OR display_name LIKE ? ESCAPE '\\') AND id != ?  AND banned = 0
                           ORDER BY CASE WHEN lower(username) = lower(?) THEN 0
                                         WHEN username LIKE ? ESCAPE '\\' THEN 1 ELSE 2 END, length(username), username
                           LIMIT 20`),
  chatById: db.prepare('SELECT * FROM chats WHERE id = ?'),
  chatByDirectKey: db.prepare('SELECT * FROM chats WHERE direct_key = ?'),
  insertChat: db.prepare('INSERT INTO chats (type, title, direct_key, created_by, created_at) VALUES (?, ?, ?, ?, ?)'),
  insertMember: db.prepare('INSERT OR IGNORE INTO members (chat_id, user_id, joined_at) VALUES (?, ?, ?)'),
  deleteMember: db.prepare('DELETE FROM members WHERE chat_id = ? AND user_id = ?'),
  isMember: db.prepare('SELECT 1 FROM members WHERE chat_id = ? AND user_id = ?'),
  chatMembers: db.prepare(`SELECT u.id, u.username, u.display_name, u.public_key, u.color, u.bio, u.avatar, u.last_seen, m.last_read_id, m.role
                           FROM members m JOIN users u ON u.id = m.user_id WHERE m.chat_id = ? ORDER BY u.id`),
  memberIds: db.prepare('SELECT user_id FROM members WHERE chat_id = ?'),
  myChats: db.prepare(`SELECT c.*, m.last_read_id, m.archived, m.muted_until,
                         (SELECT COUNT(*) FROM scheduled sc WHERE sc.chat_id = c.id AND sc.sender_id = m.user_id) AS scheduled_count,
                         (SELECT MAX(id) FROM messages WHERE chat_id = c.id AND thread_id IS NULL) AS last_id,
                         (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND id > m.last_read_id AND thread_id IS NULL
                            AND (sender_id IS NULL OR sender_id != m.user_id)) AS unread,
                         (SELECT COUNT(*) FROM mentions mn JOIN messages mm ON mm.id = mn.message_id
                            WHERE mn.chat_id = c.id AND mn.user_id = m.user_id AND mn.message_id > m.last_read_id AND mm.kind = 'msg') AS mentions
                       FROM members m JOIN chats c ON c.id = m.chat_id WHERE m.user_id = ?`),
  messageById: db.prepare('SELECT * FROM messages WHERE id = ?'),
  insertMessage: db.prepare('INSERT INTO messages (chat_id, sender_id, kind, body, created_at) VALUES (?, ?, ?, ?, ?)'),
  messagesBefore: db.prepare('SELECT * FROM messages WHERE chat_id = ? AND id < ? AND thread_id IS NULL ORDER BY id DESC LIMIT ?'),
  setRead: db.prepare('UPDATE members SET last_read_id = MAX(last_read_id, ?) WHERE chat_id = ? AND user_id = ?'),
  insertFile: db.prepare('INSERT INTO files (id, chat_id, uploader_id, size, created_at) VALUES (?, ?, ?, ?, ?)'),
  fileById: db.prepare('SELECT * FROM files WHERE id = ?'),
  contactIds: db.prepare(`SELECT DISTINCT m2.user_id AS id FROM members m1
                          JOIN members m2 ON m2.chat_id = m1.chat_id WHERE m1.user_id = ? AND m2.user_id != ?`),
  deleteEmptyChat: db.prepare('DELETE FROM chats WHERE id = ? AND NOT EXISTS (SELECT 1 FROM members WHERE chat_id = ?)'),
};

q.setTotpPending = db.prepare('UPDATE users SET totp_pending = ? WHERE id = ?');
q.enableTotp = db.prepare('UPDATE users SET totp_secret = ?, totp_pending = NULL, totp_last_step = ?, backup_codes = ? WHERE id = ?');
q.disableTotp = db.prepare("UPDATE users SET totp_secret = NULL, totp_pending = NULL, totp_last_step = 0, backup_codes = '[]' WHERE id = ?");
q.setTotpStep = db.prepare('UPDATE users SET totp_last_step = ? WHERE id = ?');
q.setBackupCodes = db.prepare('UPDATE users SET backup_codes = ? WHERE id = ?');

q.userByGoogle = db.prepare('SELECT * FROM users WHERE google_sub = ?');
q.setGoogle = db.prepare('UPDATE users SET google_sub = ?, email = ? WHERE id = ?');
q.updateMessage = db.prepare('UPDATE messages SET body = ?, edited_at = ? WHERE id = ?');
q.deleteMessage = db.prepare("UPDATE messages SET kind = 'deleted', body = '{}', edited_at = ? WHERE id = ?");
q.reactionOf = db.prepare('SELECT emoji FROM reactions WHERE message_id = ? AND user_id = ?');
q.setReaction = db.prepare('INSERT INTO reactions (message_id, user_id, emoji) VALUES (?, ?, ?) ON CONFLICT(message_id, user_id) DO UPDATE SET emoji = excluded.emoji');
q.delReaction = db.prepare('DELETE FROM reactions WHERE message_id = ? AND user_id = ?');
q.clearReactions = db.prepare('DELETE FROM reactions WHERE message_id = ?');
q.reactionsOf = db.prepare('SELECT emoji, user_id FROM reactions WHERE message_id = ? ORDER BY rowid');
q.deleteFile = db.prepare('DELETE FROM files WHERE id = ?');

setInterval(() => q.purgeSessions.run(now()), 6 * 3600 * 1000).unref();

/* ---------- Google Authenticator (TOTP, RFC 6238) ---------- */
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function b32encode(buf) {
  let bits = 0, val = 0, out = '';
  for (const b of buf) { val = (val << 8) | b; bits += 8; while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  return out;
}
function b32decode(str) {
  let bits = 0, val = 0; const out = [];
  for (const ch of str.replace(/=+$/, '').toUpperCase()) {
    const i = B32.indexOf(ch); if (i < 0) continue;
    val = (val << 5) | i; bits += 5;
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}
function totpAt(secret, step) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(step));
  const h = crypto.createHmac('sha1', b32decode(secret)).update(msg).digest();
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1000000).padStart(6, '0');
}
/* Возвращает номер шага, если код верный и ещё не использовался (окно ±30 секунд) */
function checkTotp(secret, code, lastStep = 0) {
  code = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(code)) return 0;
  const cur = Math.floor(Date.now() / 30000);
  for (const step of [cur - 1, cur, cur + 1]) {
    if (step <= lastStep) continue;
    const a = Buffer.from(totpAt(secret, step)), b = Buffer.from(code);
    if (crypto.timingSafeEqual(a, b)) return step;
  }
  return 0;
}
const normBackup = (c) => String(c || '').toLowerCase().replace(/[^a-z0-9]/g, '');
function useBackupCode(user, code) {
  const n = normBackup(code);
  if (n.length !== 10) return false;
  const list = JSON.parse(user.backup_codes || '[]');
  const i = list.indexOf(sha256('tiho-backup:' + n));
  if (i < 0) return false;
  list.splice(i, 1);
  q.setBackupCodes.run(JSON.stringify(list), user.id);
  return true;
}
function newBackupCodes() {
  const plain = Array.from({ length: 8 }, () => {
    const c = crypto.randomBytes(5).toString('hex');
    return c.slice(0, 5) + '-' + c.slice(5);
  });
  return { plain, hashed: plain.map((c) => sha256('tiho-backup:' + normBackup(c))) };
}
/* Вход в два шага: после пароля выдаём одноразовый билет, сессия — только после кода */
const loginTickets = new Map();
setInterval(() => { const t = now(); for (const [k, v] of loginTickets) if (v.exp < t) loginTickets.delete(k); }, 60000).unref();

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
const publicUser = (u) => ({ id: u.id, username: u.username, displayName: u.display_name, color: u.color,
  bio: u.bio || '', avatar: u.avatar || 0, lastSeen: u.last_seen || 0, online: online.has(u.id) });
const memberView = (m) => ({ ...publicUser(m), publicKey: m.public_key, lastReadId: m.last_read_id, role: m.role || 'member' });
const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
function reactionsFor(ids) {
  const out = new Map();
  if (!ids.length) return out;
  const rows = db.prepare(`SELECT message_id, emoji, user_id FROM reactions WHERE message_id IN (${ids.map(() => '?').join(',')}) ORDER BY rowid`).all(...ids);
  for (const r of rows) {
    if (!out.has(r.message_id)) out.set(r.message_id, new Map());
    const m = out.get(r.message_id);
    if (!m.has(r.emoji)) m.set(r.emoji, []);
    m.get(r.emoji).push(r.user_id);
  }
  return out;
}
const reactionList = (map) => (map ? [...map].map(([emoji, users]) => ({ emoji, users })) : []);
function pollVotes(messageId) {
  const out = {};
  for (const r of db.prepare('SELECT option, user_id FROM poll_votes WHERE message_id = ? ORDER BY rowid').all(messageId)) (out[r.option] ||= []).push(r.user_id);
  return out;
}
function threadInfo(ids) {
  const out = new Map();
  if (!ids.length) return out;
  for (const r of db.prepare(`SELECT thread_id, COUNT(*) AS n, MAX(created_at) AS last FROM messages WHERE thread_id IN (${ids.map(() => '?').join(',')}) AND kind != 'deleted' GROUP BY thread_id`).all(...ids)) {
    const who = db.prepare('SELECT DISTINCT sender_id FROM messages WHERE thread_id = ? ORDER BY id DESC LIMIT 3').all(r.thread_id).map((x) => x.sender_id);
    out.set(r.thread_id, { count: r.n, last: r.last, users: who });
  }
  return out;
}
const messageView = (m, reactions, thread) => ({
  threadId: m.thread_id || null, thread: thread || undefined, expiresAt: m.expires_at || null,
  id: m.id, chatId: m.chat_id, senderId: m.sender_id, kind: m.kind,
  body: JSON.parse(m.body), createdAt: m.created_at, editedAt: m.edited_at || null,
  reactions: reactionList(reactions), votes: pollVotes(m.id),
});

function chatView(chat, userId) {
  const members = q.chatMembers.all(chat.id).map(memberView);
  const last = chat.last_id ? q.messageById.get(chat.last_id) : null;
  return {
    id: chat.id, type: chat.type, title: chat.title, createdAt: chat.created_at,
    members, lastMessage: last ? messageView(last) : null,
    pinned: chat.pinned_id ? (() => { const pm = q.messageById.get(chat.pinned_id); return pm && pm.kind !== 'deleted' ? messageView(pm) : null; })() : null,
    archived: !!chat.archived,
    mutedUntil: chat.muted_until > now() ? chat.muted_until : 0,
    scheduled: chat.scheduled_count || 0,
    groupCall: chat.type === 'group' ? roomView(rooms.get(chat.id)) : null,
    bot: chat.type === 'group' ? !!db.prepare('SELECT enabled FROM group_bots WHERE chat_id = ?').get(chat.id)?.enabled : false,
    secret: !!chat.secret, ttl: chat.ttl || 0,
    perms: chat.type === 'group' ? groupPerms(chat) : null,
    blocked: chat.type === 'direct' ? blockState(userId, members.find((m) => m.id !== userId)?.id) : null,
    unread: chat.unread ?? 0, mentions: chat.mentions ?? 0, lastReadId: chat.last_read_id ?? members.find((m) => m.id === userId)?.lastReadId ?? 0,
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
    "style-src 'self' https://fonts.googleapis.com https://accounts.google.com 'unsafe-inline'; font-src https://fonts.gstatic.com; " +
    "connect-src 'self' ws: wss: https://accounts.google.com; script-src 'self' https://accounts.google.com/gsi/client; " +
    "frame-src https://accounts.google.com; frame-ancestors 'none'; base-uri 'none'");
  next();
});

function auth(req, res, next) {
  const token = cookie.parse(req.headers.cookie || '').tiho_session;
  const user = token && q.sessionUser.get(sha256(token), now());
  if (!user) return res.status(401).json({ error: 'Нужно войти' });
  req.user = user;
  req.sessionId = user.session_id;
  if (now() - user.session_active > 5 * 60000) db.prepare('UPDATE sessions SET last_active = ?, ip = ? WHERE rowid = ?').run(now(), clientIp(req), user.session_id);
  next();
}
const clientIp = (req) => String((['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket?.remoteAddress) && req.headers['cf-connecting-ip']) || req.ip || '').slice(0, 64);
function startSession(req, res, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  q.insertSession.run(sha256(token), userId, now() + SESSION_DAYS * 86400000, now(), now(), String(req.headers['user-agent'] || '').slice(0, 300), clientIp(req));
  res.setHeader('Set-Cookie', cookie.serialize('tiho_session', token, {
    httpOnly: true, sameSite: 'strict', secure: req.secure, path: '/', maxAge: SESSION_DAYS * 86400,
  }));
}
const fail = (res, code, error) => res.status(code).json({ error });

const json = express.json({ limit: '256kb' });

app.get('/api/config', (req, res) => res.json({ maxFile: MAX_FILE, googleClientId: GOOGLE_CLIENT_ID || null, reactions: REACTIONS, gifSearch: !!GIPHY_API_KEY }));

/* ---------- Поиск GIF через GIPHY (через наш сервер, чтобы GIPHY не видел пользователей) ---------- */
const gifUrl = (u) => '/api/gif/file?u=' + encodeURIComponent(u);
function mediaAllowed(u) {
  try {
    const x = new URL(u);
    return (x.protocol === 'https:' || x.hostname === '127.0.0.1') && GIF_MEDIA_HOSTS.some((h) => x.hostname === h || x.hostname.endsWith('.' + h));
  } catch { return false; }
}
async function giphy(pathname, params) {
  const url = new URL(GIPHY_API_BASE + pathname);
  for (const [k, v] of Object.entries({ api_key: GIPHY_API_KEY, limit: 24, rating: 'pg-13', ...params })) url.searchParams.set(k, v);
  const r = await fetch(url);
  if (!r.ok) throw new Error('GIPHY ' + r.status);
  const data = (await r.json()).data || [];
  return data.map((g) => {
    const prev = g.images?.fixed_width_downsampled || g.images?.fixed_width || g.images?.original;
    const full = g.images?.downsized_medium || g.images?.downsized || g.images?.original;
    return prev?.url && full?.url ? { id: g.id, title: g.title || '', w: Number(full.width) || 0, h: Number(full.height) || 0, preview: gifUrl(prev.url), full: gifUrl(full.url) } : null;
  }).filter(Boolean);
}
app.get('/api/gif/search', auth, async (req, res) => {
  if (!GIPHY_API_KEY) return fail(res, 400, 'Поиск GIF не настроен на сервере');
  if (rateLimited('gif:' + req.user.id, 120, 60000)) return fail(res, 429, 'Слишком часто');
  const qv = String(req.query.q || '').trim().slice(0, 80);
  try {
    res.json({ gifs: qv ? await giphy('/v1/gifs/search', { q: qv, lang: 'ru', offset: Number(req.query.offset) || 0 }) : await giphy('/v1/gifs/trending', {}) });
  } catch (e) { console.warn('GIF search failed:', e.message); fail(res, 502, 'GIPHY не отвечает'); }
});
app.get('/api/gif/file', auth, async (req, res) => {
  const u = String(req.query.u || '');
  if (!GIPHY_API_KEY || !mediaAllowed(u)) return fail(res, 404, 'Нет файла');
  try {
    const r = await fetch(u);
    const len = Number(r.headers.get('content-length') || 0);
    if (!r.ok || len > 15 * 1024 * 1024) return fail(res, 404, 'Нет файла');
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 15 * 1024 * 1024) return fail(res, 413, 'Слишком большой GIF');
    res.setHeader('Content-Type', buf.slice(0, 3).toString() === 'GIF' ? 'image/gif' : (r.headers.get('content-type') || '').startsWith('image/webp') ? 'image/webp' : 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, max-age=86400');
    res.end(buf);
  } catch { fail(res, 502, 'GIPHY не отвечает'); }
});

/* ---------- Предпросмотр ссылок ----------
 * Карточку собирает отправитель: его браузер просит сервер прочитать страницу,
 * потом кладёт заголовок и уменьшенную картинку внутрь зашифрованного сообщения.
 * Получатели ничего не скачивают. Запросы во внутреннюю сеть запрещены. */
const LINK_PRIVATE_OK = process.env.LINK_PREVIEW_PRIVATE === '1';
function privateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b < 128) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b < 32) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  const x = ip.toLowerCase();
  if (x.startsWith('::ffff:')) return privateIp(x.slice(7));
  return x === '::' || x === '::1' || x.startsWith('fc') || x.startsWith('fd') || x.startsWith('fe8') || x.startsWith('fe9') || x.startsWith('fea') || x.startsWith('feb') || x.startsWith('ff');
}
function safeLookup(host, opts, cb) {
  dns.lookup(host, { all: true }, (err, list) => {
    if (err) return cb(err);
    const ok = list.filter((a) => LINK_PRIVATE_OK || !privateIp(a.address));
    if (!ok.length) return cb(new Error('blocked address'));
    if (opts && opts.all) return cb(null, ok);
    cb(null, ok[0].address, ok[0].family);
  });
}
function fetchLimited(url, { maxBytes, accept, redirects = 4 }) {
  return new Promise((resolve, reject) => {
    let u;
    try { u = new URL(url); } catch { return reject(new Error('bad url')); }
    if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) return reject(new Error('bad url'));
    if (u.port && !['80', '443', '8080', '8443'].includes(u.port) && !LINK_PRIVATE_OK) return reject(new Error('bad port'));
    const literal = u.hostname.replace(/^\[|\]$/g, '');
    if (net.isIP(literal) && privateIp(literal) && !LINK_PRIVATE_OK) return reject(new Error('blocked address')); // для IP lookup не вызывается
    const mod = u.protocol === 'https:' ? https : http;
    const req = mod.get(u, { lookup: safeLookup, timeout: 6000, headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TihoLinkPreview/1.0)', Accept: accept, 'Accept-Language': 'ru,en;q=0.8' } }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        if (redirects <= 0) return reject(new Error('too many redirects'));
        return resolve(fetchLimited(new URL(res.headers.location, u).href, { maxBytes, accept, redirects: redirects - 1 }));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('status ' + res.statusCode)); }
      const chunks = []; let size = 0;
      res.on('data', (c) => {
        size += c.length;
        if (size > maxBytes) { chunks.push(c.subarray(0, c.length - (size - maxBytes))); res.destroy(); }
        else chunks.push(c);
      });
      const done = () => resolve({ url: u.href, type: String(res.headers['content-type'] || ''), body: Buffer.concat(chunks), cut: size > maxBytes });
      res.on('end', done); res.on('close', done); res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}
const htmlDecode = (s) => String(s || '').replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp|laquo|raquo|mdash|ndash|hellip);/gi, (m, e) => {
  const k = e.toLowerCase();
  if (k[0] === '#') { const n = k[1] === 'x' ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10); try { return String.fromCodePoint(n); } catch { return ''; } }
  return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', laquo: '«', raquo: '»', mdash: '—', ndash: '–', hellip: '…' }[k];
}).replace(/\s+/g, ' ').trim();
function parsePreview(html, base) {
  const head = html.slice(0, 300000);
  const meta = {};
  for (const tag of head.match(/<meta\b[^>]*>/gi) || []) {
    const attr = (n) => (new RegExp(`\\b${n}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag) || [])
      .slice(2).find((x) => x !== undefined);
    const key = (attr('property') || attr('name') || '').toLowerCase();
    const val = attr('content');
    if (key && val !== undefined && !(key in meta)) meta[key] = htmlDecode(val);
  }
  const title = meta['og:title'] || meta['twitter:title'] || htmlDecode((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(head) || [])[1]);
  const desc = meta['og:description'] || meta['twitter:description'] || meta.description || '';
  let image = meta['og:image'] || meta['og:image:url'] || meta['twitter:image'] || meta['twitter:image:src'] || '';
  try { image = image ? new URL(image, base).href : ''; } catch { image = ''; }
  if (image && !/^https?:/.test(image)) image = '';
  const site = meta['og:site_name'] || new URL(base).hostname.replace(/^www\./, '');
  return { title: title.slice(0, 200), description: desc.slice(0, 300), site: site.slice(0, 80), image };
}
const previewCache = new Map();
app.get('/api/link-preview', auth, async (req, res) => {
  const url = String(req.query.url || '').slice(0, 2000);
  if (!/^https?:\/\//i.test(url)) return fail(res, 400, 'Нужна ссылка http(s)');
  if (rateLimited('lp:' + req.user.id, 60, 60000)) return fail(res, 429, 'Слишком часто');
  const hit = previewCache.get(url);
  if (hit && hit.exp > now()) return res.json(hit.data);
  try {
    const r = await fetchLimited(url, { maxBytes: 600 * 1024, accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5' });
    let data;
    if (/^image\/(jpeg|png|gif|webp)/.test(r.type)) data = { url, title: '', description: '', site: new URL(r.url).hostname, image: r.url };
    else if (/html/.test(r.type) || !r.type) {
      const cs = (/charset=([\w-]+)/i.exec(r.type) || /<meta[^>]+charset=["']?([\w-]+)/i.exec(r.body.subarray(0, 4096).toString('latin1')) || [])[1] || 'utf-8';
      let html;
      try { html = new TextDecoder(cs.toLowerCase()).decode(r.body); } catch { html = r.body.toString('utf8'); }
      data = { url, ...parsePreview(html, r.url) };
    } else return fail(res, 404, 'Нет предпросмотра');
    if (!data.title && !data.description && !data.image) return fail(res, 404, 'Нет предпросмотра');
    if (data.image) data.image = '/api/link-preview/image?u=' + encodeURIComponent(data.image);
    if (previewCache.size > 500) previewCache.delete(previewCache.keys().next().value);
    previewCache.set(url, { data, exp: now() + 3600000 });
    res.json(data);
  } catch { fail(res, 404, 'Нет предпросмотра'); }
});
app.get('/api/link-preview/image', auth, async (req, res) => {
  const u = String(req.query.u || '').slice(0, 2000);
  if (rateLimited('lpi:' + req.user.id, 60, 60000)) return fail(res, 429, 'Слишком часто');
  try {
    const r = await fetchLimited(u, { maxBytes: 4 * 1024 * 1024, accept: 'image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8' });
    const b = r.body;
    const type = b[0] === 0xff && b[1] === 0xd8 ? 'image/jpeg' : b[0] === 0x89 && b[1] === 0x50 ? 'image/png'
      : b.subarray(0, 3).toString() === 'GIF' ? 'image/gif' : b.subarray(8, 12).toString() === 'WEBP' ? 'image/webp' : null;
    if (!type || r.cut) return fail(res, 404, 'Нет картинки');
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.end(b);
  } catch { fail(res, 404, 'Нет картинки'); }
});

/* ---------- Вход через Google (проверка ID-токена Google Identity Services) ---------- */
let jwks = { keys: [], exp: 0 };
async function googleKeys(force = false) {
  if (!force && jwks.exp > now() && jwks.keys.length) return jwks.keys;
  const r = await fetch(GOOGLE_JWKS_URL);
  if (!r.ok) throw new Error('Google недоступен');
  const maxAge = Number(/max-age=(\d+)/.exec(r.headers.get('cache-control') || '')?.[1] || 3600);
  jwks = { keys: (await r.json()).keys || [], exp: now() + Math.min(maxAge, 86400) * 1000 };
  return jwks.keys;
}
async function verifyGoogle(credential) {
  const parts = String(credential || '').split('.');
  if (parts.length !== 3) throw new Error('bad token');
  const header = JSON.parse(Buffer.from(parts[0], 'base64url'));
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url'));
  if (header.alg !== 'RS256') throw new Error('bad alg');
  let jwk = (await googleKeys()).find((k) => k.kid === header.kid);
  if (!jwk) jwk = (await googleKeys(true)).find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('unknown key');
  const key = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const ok = crypto.verify('RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]), key, Buffer.from(parts[2], 'base64url'));
  if (!ok) throw new Error('bad signature');
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss)) throw new Error('bad iss');
  if (payload.aud !== GOOGLE_CLIENT_ID) throw new Error('bad aud');
  if (!payload.exp || payload.exp * 1000 < now() - 60000) throw new Error('expired');
  if (!payload.sub || payload.email_verified === false) throw new Error('email not verified');
  return payload;
}
const googleSignups = new Map();
setInterval(() => { const t = now(); for (const [k, v] of googleSignups) if (v.exp < t) googleSignups.delete(k); }, 60000).unref();
function suggestUsername(email, name) {
  let base = String(email || '').split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  if (base.length < 3) base = 'user';
  base = base.slice(0, 26);
  if (!q.userByName.get(base)) return base;
  for (let i = 0; i < 50; i++) { const c = base + '_' + crypto.randomInt(10, 9999); if (!q.userByName.get(c)) return c; }
  return 'user_' + crypto.randomBytes(4).toString('hex');
}
function loginOrTicket(req, res, user) {
  if (user.totp_secret) {
    const ticket = crypto.randomBytes(24).toString('base64url');
    loginTickets.set(ticket, { userId: user.id, exp: now() + 5 * 60000, tries: 0 });
    return res.json({ need2fa: true, ticket });
  }
  startSession(req, res, user.id);
  res.json({ user: publicUser(user), publicKey: user.public_key, keyBackup: JSON.parse(user.key_backup) });
}

app.post('/api/google', json, async (req, res) => {
  if (!GOOGLE_CLIENT_ID) return fail(res, 400, 'Вход через Google не настроен на сервере');
  if (rateLimited('google:' + req.ip, 30)) return fail(res, 429, 'Слишком много попыток, подождите');
  let g;
  try { g = await verifyGoogle(req.body?.credential); } catch (e) { console.warn('Google sign-in rejected:', e.message); return fail(res, 401, 'Google не подтвердил вход, попробуйте ещё раз'); }
  const user = q.userByGoogle.get(g.sub);
  if (user?.banned) return fail(res, 403, 'Аккаунт заблокирован за нарушение правил');
  if (user) return loginOrTicket(req, res, user);
  const ticket = crypto.randomBytes(24).toString('base64url');
  googleSignups.set(ticket, { sub: g.sub, email: g.email || null, name: cleanName(g.name) || null, exp: now() + 15 * 60000 });
  res.json({ needSignup: true, ticket, username: suggestUsername(g.email, g.name), name: cleanName(g.name) || '', email: g.email || '' });
});

app.post('/api/google/link', auth, json, async (req, res) => {
  if (!GOOGLE_CLIENT_ID) return fail(res, 400, 'Вход через Google не настроен на сервере');
  let g;
  try { g = await verifyGoogle(req.body?.credential); } catch { return fail(res, 401, 'Google не подтвердил вход'); }
  const other = q.userByGoogle.get(g.sub);
  if (other && other.id !== req.user.id) return fail(res, 409, 'Этот Google-аккаунт уже привязан к другому пользователю');
  q.setGoogle.run(g.sub, g.email || null, req.user.id);
  res.json({ ok: true, email: g.email || '' });
});

app.post('/api/google/unlink', auth, (req, res) => {
  q.setGoogle.run(null, null, req.user.id);
  res.json({ ok: true });
});

app.post('/api/register', json, (req, res) => {
  if (rateLimited('reg:' + req.ip, 10)) return fail(res, 429, 'Слишком много попыток, подождите');
  const { username, displayName, auth: authKey, publicKey, keyBackup, googleTicket } = req.body || {};
  if (!USERNAME_RE.test(username || '')) return fail(res, 400, 'Логин: 3–32 символа, латиница, цифры и _');
  const g = googleTicket ? googleSignups.get(String(googleTicket)) : null;
  if (googleTicket && (!g || g.exp < now())) return fail(res, 401, 'Время регистрации через Google истекло, начните заново');
  if (g && q.userByGoogle.get(g.sub)) return fail(res, 409, 'Этот Google-аккаунт уже зарегистрирован');
  const name = cleanName(displayName) || g?.name || username;
  if (!isB64(authKey, 200) || !isB64(publicKey, 400)) return fail(res, 400, 'Некорректные данные ключа');
  if (!keyBackup || !isB64(keyBackup.iv, 64) || !isB64(keyBackup.ct, 1000)) return fail(res, 400, 'Некорректная резервная копия ключа');
  if (q.userByName.get(username)) return fail(res, 409, 'Этот логин уже занят');
  const hash = bcrypt.hashSync(authKey, 11);
  const color = crypto.randomInt(0, 8);
  const info = q.insertUser.run(username, name, hash, publicKey, JSON.stringify({ iv: keyBackup.iv, ct: keyBackup.ct }), color, now());
  if (g) { q.setGoogle.run(g.sub, g.email, info.lastInsertRowid); googleSignups.delete(String(googleTicket)); }
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
  if (user.banned) return fail(res, 403, 'Аккаунт заблокирован за нарушение правил');
  loginOrTicket(req, res, user);
});

app.post('/api/login/2fa', json, (req, res) => {
  if (rateLimited('2fa:' + req.ip, 30)) return fail(res, 429, 'Слишком много попыток, подождите 10 минут');
  const t = loginTickets.get(String(req.body?.ticket || ''));
  if (!t || t.exp < now()) return fail(res, 401, 'Время входа истекло, введите пароль ещё раз');
  if (++t.tries > 5) { loginTickets.delete(req.body.ticket); return fail(res, 401, 'Слишком много неверных кодов, войдите заново'); }
  const user = q.userById.get(t.userId);
  if (!user || !user.totp_secret) return fail(res, 401, 'Войдите заново');
  const code = String(req.body?.code || '');
  const step = checkTotp(user.totp_secret, code, user.totp_last_step);
  if (step) q.setTotpStep.run(step, user.id);
  else if (!useBackupCode(user, code)) return fail(res, 401, 'Неверный код');
  loginTickets.delete(req.body.ticket);
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
  res.json({ user: publicUser(req.user), publicKey: req.user.public_key, keyBackup: JSON.parse(req.user.key_backup),
    google: req.user.google_sub ? (req.user.email || 'привязан') : null,
    twoFactor: !!req.user.totp_secret, backupLeft: JSON.parse(req.user.backup_codes || '[]').length, admin: isAdmin(req.user) });
});

app.post('/api/2fa/setup', auth, async (req, res) => {
  if (req.user.totp_secret) return fail(res, 400, 'Двухфакторная защита уже включена');
  const secret = b32encode(crypto.randomBytes(20));
  q.setTotpPending.run(secret, req.user.id);
  const host = (req.headers.host || 'tiho').split(':')[0];
  const label = encodeURIComponent(`Тихо (${host}):${req.user.username}`);
  const uri = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent('Тихо')}&algorithm=SHA1&digits=6&period=30`;
  const svg = await QRCode.toString(uri, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0E1726', light: '#FFFFFF' } });
  res.json({ secret: secret.replace(/(.{4})/g, '$1 ').trim(), uri, qr: 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64') });
});

app.post('/api/2fa/enable', auth, json, (req, res) => {
  if (rateLimited('2fa-set:' + req.user.id, 20)) return fail(res, 429, 'Слишком много попыток, подождите');
  const u = q.userById.get(req.user.id);
  if (!u.totp_pending) return fail(res, 400, 'Начните настройку заново');
  const step = checkTotp(u.totp_pending, req.body?.code);
  if (!step) return fail(res, 400, 'Код не подошёл. Проверьте время на телефоне и введите свежий код');
  const codes = newBackupCodes();
  q.enableTotp.run(u.totp_pending, step, JSON.stringify(codes.hashed), u.id);
  res.json({ ok: true, backupCodes: codes.plain });
});

app.post('/api/2fa/disable', auth, json, (req, res) => {
  if (rateLimited('2fa-set:' + req.user.id, 20)) return fail(res, 429, 'Слишком много попыток, подождите');
  const u = q.userById.get(req.user.id);
  if (!u.totp_secret) return res.json({ ok: true });
  const step = checkTotp(u.totp_secret, req.body?.code, u.totp_last_step);
  if (!step && !useBackupCode(u, req.body?.code)) return fail(res, 400, 'Неверный код');
  q.disableTotp.run(u.id);
  res.json({ ok: true });
});

function announceUser(userId) {
  const u = q.userById.get(userId);
  for (const id of [u.id, ...q.contactIds.all(u.id, u.id).map((r) => r.id)]) sendTo(id, { type: 'user', user: publicUser(u) });
  return u;
}
app.patch('/api/me', auth, json, (req, res) => {
  if (req.body?.displayName !== undefined) {
    const name = cleanName(req.body.displayName);
    if (!name) return fail(res, 400, 'Имя не может быть пустым');
    q.updateProfile.run(name, req.user.id);
  }
  if (req.body?.bio !== undefined) {
    const bio = String(req.body.bio || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 140);
    db.prepare('UPDATE users SET bio = ? WHERE id = ?').run(bio, req.user.id);
  }
  res.json({ user: publicUser(announceUser(req.user.id)) });
});

/* Фото профиля: браузер присылает уже уменьшенное изображение (JPEG/WebP/PNG) */
app.post('/api/me/avatar', auth, express.raw({ type: ['image/jpeg', 'image/webp', 'image/png'], limit: '1mb' }), (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length < 100) return fail(res, 400, 'Не удалось прочитать изображение');
  const b = req.body;
  const isJpg = b[0] === 0xff && b[1] === 0xd8, isPng = b[0] === 0x89 && b[1] === 0x50, isWebp = b.slice(8, 12).toString() === 'WEBP';
  if (!isJpg && !isPng && !isWebp) return fail(res, 400, 'Нужна картинка JPEG, PNG или WebP');
  fs.writeFileSync(path.join(AVATARS_DIR, String(req.user.id)), b);
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(now(), req.user.id);
  res.json({ user: publicUser(announceUser(req.user.id)) });
});
app.delete('/api/me/avatar', auth, (req, res) => {
  try { fs.unlinkSync(path.join(AVATARS_DIR, String(req.user.id))); } catch { /* не было */ }
  db.prepare('UPDATE users SET avatar = 0 WHERE id = ?').run(req.user.id);
  res.json({ user: publicUser(announceUser(req.user.id)) });
});
app.get('/api/avatars/:id', auth, (req, res) => {
  const id = Number(req.params.id);
  const file = path.join(AVATARS_DIR, String(id));
  if (!Number.isInteger(id) || !fs.existsSync(file)) return fail(res, 404, 'Нет фото');
  const b = fs.readFileSync(file);
  const type = b[0] === 0xff ? 'image/jpeg' : b[0] === 0x89 ? 'image/png' : 'image/webp';
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
  res.end(b);
});

app.get('/api/users/search', auth, (req, res) => {
  const s = String(req.query.q || '').trim().replace(/^@/, '');
  if (s.length < 2) return res.json({ users: [] });
  const esc = s.replace(/[\\%_]/g, (c) => '\\' + c);
  res.json({ users: q.searchUsers.all('%' + esc + '%', '%' + esc + '%', req.user.id, s, esc + '%').map(publicUser) });
});

/* Профиль по юзернейму — для ссылок вида https://адрес/@username */
app.get('/api/users/by-name/:username', auth, (req, res) => {
  const u = q.userByName.get(String(req.params.username).replace(/^@/, ''));
  if (!u) return fail(res, 404, 'Пользователь не найден');
  res.json({ user: publicUser(u) });
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
  const valid = [...new Set(ids)].filter((id) => id !== req.user.id && q.userById.get(id) && !blockedBy(id, req.user.id)).slice(0, 199);
  let chatId;
  db.transaction(() => {
    chatId = q.insertChat.run('group', title, null, req.user.id, now()).lastInsertRowid;
    q.insertMember.run(chatId, req.user.id, now());
    db.prepare("UPDATE members SET role = 'owner' WHERE chat_id = ? AND user_id = ?").run(chatId, req.user.id);
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
  if (groupPerms(chat).add === 'admins' && !isGroupAdmin(chat.id, req.user.id)) return fail(res, 403, 'Добавлять участников могут только админы');
  const ids = Array.isArray(req.body?.userIds) ? req.body.userIds.map(Number) : [];
  const added = [];
  db.transaction(() => {
    for (const id of new Set(ids)) {
      const u = q.userById.get(id);
      if (u && !q.isMember.get(chat.id, id) && !blockedBy(id, req.user.id)) {
        db.prepare('DELETE FROM chat_bans WHERE chat_id = ? AND user_id = ?').run(chat.id, id);
        q.insertMember.run(chat.id, id, now()); added.push(u);
      }
    }
    if (added.length) addSystem(chat.id, `${req.user.display_name} добавил(а): ${added.map((u) => u.display_name).join(', ')}`);
  })();
  if (added.length) setTimeout(() => botWelcome(chat.id, added), 300);
  broadcastChat(chat.id);
  res.json({ chat: fullChat(chat.id, req.user.id) });
});

app.post('/api/chats/:id/leave', auth, (req, res) => {
  const chat = requireMember(req, res); if (!chat) return;
  if (chat.type !== 'group') return fail(res, 400, 'Из личного чата выйти нельзя');
  leaveRoom(chat.id, req.user.id);
  const wasOwner = memberRole(chat.id, req.user.id) === 'owner';
  q.deleteMember.run(chat.id, req.user.id);
  addSystem(chat.id, `${req.user.display_name} покинул(а) группу`);
  if (wasOwner) {
    const heir = db.prepare("SELECT user_id FROM members WHERE chat_id = ? ORDER BY CASE role WHEN 'admin' THEN 0 ELSE 1 END, joined_at LIMIT 1").get(chat.id);
    if (heir) {
      db.prepare("UPDATE members SET role = 'owner' WHERE chat_id = ? AND user_id = ?").run(chat.id, heir.user_id);
      addSystem(chat.id, `${q.userById.get(heir.user_id).display_name} теперь владелец группы`);
    }
  }
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
  const rx = reactionsFor(rows.map((r) => r.id));
  const th = threadInfo(rows.map((r) => r.id));
  res.json({ messages: rows.map((r) => messageView(r, rx.get(r.id), th.get(r.id))) });
});
/* Ветка ответов к сообщению группы */
app.get('/api/chats/:id/threads/:root', auth, (req, res) => {
  const chat = requireMember(req, res); if (!chat) return;
  const root = q.messageById.get(Number(req.params.root));
  if (!root || root.chat_id !== chat.id || root.thread_id) return fail(res, 404, 'Сообщение не найдено');
  const rows = db.prepare('SELECT * FROM messages WHERE thread_id = ? ORDER BY id LIMIT 500').all(root.id);
  const rx = reactionsFor([root.id, ...rows.map((r) => r.id)]);
  res.json({ root: messageView(root, rx.get(root.id), threadInfo([root.id]).get(root.id)), messages: rows.map((r) => messageView(r, rx.get(r.id))) });
});

function validEnvelope(e) {
  if (!e || e.v !== 1 || !isB64(e.iv, 64) || typeof e.ct !== 'string' || e.ct.length > 200000 || !isB64(e.epk, 400)) return false;
  if (!e.keys || typeof e.keys !== 'object') return false;
  return Object.values(e.keys).every((k) => k && isB64(k.iv, 64) && isB64(k.wk, 200));
}

app.post('/api/chats/:id/messages', auth, json, (req, res) => {
  const chat = requireMember(req, res); if (!chat) return;
  const env = req.body?.envelope;
  if (!validEnvelope(env)) return fail(res, 400, 'Некорректное зашифрованное сообщение');
  if (chat.type === 'group' && groupPerms(chat).send === 'admins' && !isGroupAdmin(chat.id, req.user.id)) return fail(res, 403, 'Писать в группу могут только админы');
  if (chat.type === 'direct') {
    const otherId = q.memberIds.all(chat.id).map((r) => r.user_id).find((id) => id !== req.user.id);
    const st = blockState(req.user.id, otherId);
    if (st === 'me') return fail(res, 403, 'Вы заблокировали этого пользователя');
    if (st === 'them') return fail(res, 403, 'Пользователь ограничил сообщения от вас');
  }
  let threadId = null;
  if (req.body.threadId) {
    const root = q.messageById.get(Number(req.body.threadId));
    if (chat.type !== 'group' || !root || root.chat_id !== chat.id || root.thread_id || !['msg', 'gift'].includes(root.kind)) return fail(res, 400, 'Ветка не найдена');
    threadId = root.id;
  }
  const sendAt = threadId || chat.secret ? 0 : Number(req.body.sendAt) || 0;
  if (sendAt > now() + 5000) {
    if (sendAt > now() + 366 * 86400000) return fail(res, 400, 'Можно запланировать не больше чем на год вперёд');
    if (db.prepare('SELECT COUNT(*) AS n FROM scheduled WHERE sender_id = ?').get(req.user.id).n >= 100) return fail(res, 400, 'Слишком много отложенных сообщений');
    const id = db.prepare('INSERT INTO scheduled (chat_id, sender_id, body, mentions, send_at, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(chat.id, req.user.id, JSON.stringify(env), JSON.stringify(Array.isArray(req.body.mentions) ? req.body.mentions.slice(0, 50) : []), sendAt, now()).lastInsertRowid;
    sendTo(req.user.id, { type: 'scheduled', chatId: chat.id });
    return res.json({ scheduled: { id, sendAt } });
  }
  res.json({ message: deliverMessage(chat.id, req.user.id, env, req.body.mentions, req.body.clientId, threadId, req.body.fileRef ? String(req.body.fileRef) : null) });
});
/* Доставка сообщения: сохранить, разослать, отметить упоминания, отправить push */
function deliverMessage(chatId, senderId, env, mentions, clientId, threadId = null, fileRef = null) {
  const info = q.insertMessage.run(chatId, senderId, 'msg', JSON.stringify(env), now());
  if (fileRef && /^[a-f0-9]{32}$/.test(fileRef)) db.prepare('UPDATE messages SET file_ref = ? WHERE id = ?').run(fileRef, info.lastInsertRowid);
  if (threadId) db.prepare('UPDATE messages SET thread_id = ? WHERE id = ?').run(threadId, info.lastInsertRowid);
  else q.setRead.run(info.lastInsertRowid, chatId, senderId);
  /* Упоминания: текст зашифрован, поэтому клиент сам сообщает, кого отметил (только участников чата) */
  const mentioned = new Set();
  if (Array.isArray(mentions)) {
    for (const id of mentions.slice(0, 50).map(Number)) {
      if (Number.isInteger(id) && id !== senderId && q.isMember.get(chatId, id)) mentioned.add(id);
    }
    for (const id of mentioned) db.prepare('INSERT OR IGNORE INTO mentions (message_id, chat_id, user_id) VALUES (?, ?, ?)').run(info.lastInsertRowid, chatId, id);
  }
  const msg = messageView(q.messageById.get(info.lastInsertRowid));
  if (threadId) {
    const th = threadInfo([threadId]).get(threadId);
    for (const { user_id } of q.memberIds.all(chatId)) sendTo(user_id, { type: 'message', message: msg, clientId, thread: th, mentioned: mentioned.has(user_id) || undefined });
    // в ветке уведомляем автора исходного сообщения и тех, кто уже отвечал
    const people = new Set([q.messageById.get(threadId).sender_id, ...db.prepare('SELECT DISTINCT sender_id FROM messages WHERE thread_id = ?').all(threadId).map((r) => r.sender_id), ...mentioned]);
    const chat = q.chatById.get(chatId), sender = q.userById.get(senderId);
    for (const uid of people) if (uid && uid !== senderId && q.isMember.get(chatId, uid)) pushTo(uid, { title: chat.title, body: `${sender.display_name} ответил(а) в ветке`, tag: 'chat-' + chatId, url: '/', chatId });
    return msg;
  }
  for (const { user_id } of q.memberIds.all(chatId)) sendTo(user_id, { type: 'message', message: msg, clientId, mentioned: mentioned.has(user_id) || undefined });
  pushMessage(chatId, senderId, 'Новое сообщение', mentioned);
  return msg;
}

/* Отложенные сообщения: зашифрованы заранее, сервер только ждёт нужного времени */
function sendScheduled(row) {
  db.prepare('DELETE FROM scheduled WHERE id = ?').run(row.id);
  const chat = q.chatById.get(row.chat_id);
  if (!chat || !q.isMember.get(chat.id, row.sender_id)) return null;
  if (chat.type === 'direct') {
    const otherId = q.memberIds.all(chat.id).map((r) => r.user_id).find((id) => id !== row.sender_id);
    if (blockState(row.sender_id, otherId)) { sendTo(row.sender_id, { type: 'scheduled', chatId: chat.id }); return null; }
  }
  const msg = deliverMessage(chat.id, row.sender_id, JSON.parse(row.body), JSON.parse(row.mentions || '[]'));
  sendTo(row.sender_id, { type: 'scheduled', chatId: chat.id });
  broadcastChat(chat.id);
  return msg;
}
setInterval(() => {
  for (const row of db.prepare('SELECT * FROM scheduled WHERE send_at <= ? ORDER BY send_at LIMIT 50').all(now())) {
    try { sendScheduled(row); } catch (e) { console.warn('scheduled send failed', e.message); }
  }
}, 5000).unref();
app.get('/api/chats/:id/scheduled', auth, (req, res) => {
  const chat = requireMember(req, res); if (!chat) return;
  res.json({ scheduled: db.prepare('SELECT * FROM scheduled WHERE chat_id = ? AND sender_id = ? ORDER BY send_at').all(chat.id, req.user.id)
    .map((r) => ({ id: r.id, chatId: r.chat_id, senderId: r.sender_id, body: JSON.parse(r.body), sendAt: r.send_at, createdAt: r.created_at })) });
});
function ownScheduled(req, res) {
  const r = db.prepare('SELECT * FROM scheduled WHERE id = ? AND sender_id = ?').get(Number(req.params.id), req.user.id);
  if (!r) fail(res, 404, 'Сообщение уже отправлено или удалено');
  return r;
}
app.delete('/api/scheduled/:id', auth, (req, res) => {
  const r = ownScheduled(req, res); if (!r) return;
  db.prepare('DELETE FROM scheduled WHERE id = ?').run(r.id);
  sendTo(req.user.id, { type: 'scheduled', chatId: r.chat_id });
  broadcastChat(r.chat_id);
  res.json({ ok: true });
});
app.post('/api/scheduled/:id/send', auth, (req, res) => {
  const r = ownScheduled(req, res); if (!r) return;
  const msg = sendScheduled(r);
  if (!msg) return fail(res, 403, 'Не удалось отправить');
  res.json({ message: msg });
});
app.patch('/api/scheduled/:id', auth, json, (req, res) => {
  const r = ownScheduled(req, res); if (!r) return;
  const t = Number(req.body?.sendAt);
  if (!t || t < now() || t > now() + 366 * 86400000) return fail(res, 400, 'Неверное время');
  db.prepare('UPDATE scheduled SET send_at = ? WHERE id = ?').run(t, r.id);
  sendTo(req.user.id, { type: 'scheduled', chatId: r.chat_id });
  res.json({ ok: true });
});

/* Беззвучный режим чата — личная настройка */
app.post('/api/chats/:id/mute', auth, json, (req, res) => {
  const chat = requireMember(req, res); if (!chat) return;
  const until = Math.max(0, Math.min(Number(req.body?.until) || 0, 4102444800000));
  db.prepare('UPDATE members SET muted_until = ? WHERE chat_id = ? AND user_id = ?').run(until, chat.id, req.user.id);
  res.json({ chat: fullChat(chat.id, req.user.id) });
});

/* Правка, удаление и реакции */
function ownMessage(req, res) {
  const m = q.messageById.get(Number(req.params.id));
  if (!m || !q.isMember.get(m.chat_id, req.user.id)) { fail(res, 404, 'Сообщение не найдено'); return null; }
  return m;
}
function broadcastMessage(m) {
  const view = messageView(m, reactionsFor([m.id]).get(m.id));
  for (const { user_id } of q.memberIds.all(m.chat_id)) sendTo(user_id, { type: 'messageUpdated', message: view });
  return view;
}
app.patch('/api/messages/:id', auth, json, (req, res) => {
  const m = ownMessage(req, res); if (!m) return;
  if (m.sender_id !== req.user.id || m.kind !== 'msg') return fail(res, 403, 'Можно менять только свои сообщения');
  if (!validEnvelope(req.body?.envelope)) return fail(res, 400, 'Некорректное зашифрованное сообщение');
  q.updateMessage.run(JSON.stringify(req.body.envelope), now(), m.id);
  res.json({ message: broadcastMessage(q.messageById.get(m.id)) });
});
app.delete('/api/messages/:id', auth, json, (req, res) => {
  const m = ownMessage(req, res); if (!m) return;
  if (m.sender_id !== req.user.id || m.kind !== 'msg') return fail(res, 403, 'Можно удалять только свои сообщения');
  const fileId = String(req.body?.fileId || '');
  if (/^[a-f0-9]{32}$/.test(fileId)) {
    const f = q.fileById.get(fileId);
    if (f && f.uploader_id === req.user.id && f.chat_id === m.chat_id) {
      try { fs.unlinkSync(path.join(FILES_DIR, fileId)); } catch { /* уже нет */ }
      q.deleteFile.run(fileId);
    }
  }
  db.transaction(() => { q.clearReactions.run(m.id); q.deleteMessage.run(now(), m.id); })();
  const view = broadcastMessage(q.messageById.get(m.id));
  for (const { user_id } of q.memberIds.all(m.chat_id)) { const c = fullChat(m.chat_id, user_id); if (c) sendTo(user_id, { type: 'chat', chat: c }); }
  res.json({ message: view });
});
app.post('/api/messages/:id/react', auth, json, (req, res) => {
  const m = ownMessage(req, res); if (!m) return;
  if (m.kind !== 'msg') return fail(res, 400, 'Нельзя');
  const emoji = String(req.body?.emoji || '');
  if (emoji && !REACTIONS.includes(emoji)) return fail(res, 400, 'Такой реакции нет');
  const cur = q.reactionOf.get(m.id, req.user.id)?.emoji;
  if (!emoji || cur === emoji) q.delReaction.run(m.id, req.user.id);
  else q.setReaction.run(m.id, req.user.id, emoji);
  const reactions = reactionList(reactionsFor([m.id]).get(m.id));
  for (const { user_id } of q.memberIds.all(m.chat_id)) sendTo(user_id, { type: 'reactions', chatId: m.chat_id, messageId: m.id, reactions });
  res.json({ reactions });
});

/* Пересылка файла в другой чат: даём участникам того чата доступ к тем же зашифрованным байтам */
app.post('/api/files/:id/share', auth, json, (req, res) => {
  const f = q.fileById.get(String(req.params.id));
  const target = Number(req.body?.chatId);
  if (f && q.chatById.get(f.chat_id)?.secret) return fail(res, 403, 'Из секретного чата пересылать нельзя');
  const canRead = f && (q.isMember.get(f.chat_id, req.user.id) ||
    db.prepare('SELECT 1 FROM file_access fa JOIN members m ON m.chat_id = fa.chat_id WHERE fa.file_id = ? AND m.user_id = ?').get(f.id, req.user.id));
  if (!canRead || !q.isMember.get(target, req.user.id)) return fail(res, 404, 'Файл не найден');
  db.prepare('INSERT OR IGNORE INTO file_access (file_id, chat_id) VALUES (?, ?)').run(f.id, target);
  res.json({ ok: true });
});

/* Закреплённое сообщение */
app.post('/api/chats/:id/pin', auth, json, (req, res) => {
  const chat = requireMember(req, res); if (!chat) return;
  if (chat.type === 'group' && groupPerms(chat).pin === 'admins' && !isGroupAdmin(chat.id, req.user.id)) return fail(res, 403, 'Закреплять могут только админы');
  const mid = req.body?.messageId ? Number(req.body.messageId) : null;
  if (mid) { const m = q.messageById.get(mid); if (!m || m.chat_id !== chat.id || m.kind === 'deleted') return fail(res, 404, 'Сообщение не найдено'); }
  db.prepare('UPDATE chats SET pinned_id = ? WHERE id = ?').run(mid, chat.id);
  const sys = addSystem(chat.id, mid ? `${req.user.display_name} закрепил(а) сообщение` : `${req.user.display_name} открепил(а) сообщение`);
  for (const { user_id } of q.memberIds.all(chat.id)) sendTo(user_id, { type: 'message', message: messageView(sys) });
  broadcastChat(chat.id);
  res.json({ chat: fullChat(chat.id, req.user.id) });
});

/* ---------- Тихобот: встроенный бот для групп ----------
 * Сообщения бота создаёт сервер, поэтому они не шифруются сквозным шифрованием (как системные). */
db.exec(`CREATE TABLE IF NOT EXISTS group_bots (chat_id INTEGER PRIMARY KEY REFERENCES chats(id) ON DELETE CASCADE,
  enabled INTEGER NOT NULL DEFAULT 1, welcome TEXT NOT NULL DEFAULT '', rules TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS bot_tasks (id INTEGER PRIMARY KEY, chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, body TEXT NOT NULL, next_at INTEGER NOT NULL, repeat TEXT NOT NULL DEFAULT 'once', tz INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_bot_tasks_next ON bot_tasks(next_at);`);
const botCfg = (chatId) => db.prepare('SELECT * FROM group_bots WHERE chat_id = ?').get(chatId);
function botPost(chatId, body) {
  const info = q.insertMessage.run(chatId, null, 'bot', JSON.stringify(body), now());
  const msg = messageView(q.messageById.get(info.lastInsertRowid));
  for (const { user_id } of q.memberIds.all(chatId)) sendTo(user_id, { type: 'message', message: msg });
  const chat = q.chatById.get(chatId);
  for (const { user_id } of q.memberIds.all(chatId)) {
    if (db.prepare('SELECT muted_until FROM members WHERE chat_id = ? AND user_id = ?').get(chatId, user_id)?.muted_until > now()) continue;
    pushTo(user_id, { title: chat.title, body: '🤖 ' + (body.poll ? 'Опрос: ' + body.poll.question : body.text).slice(0, 120), tag: 'chat-' + chatId, url: '/', chatId });
  }
  return msg;
}
function botWelcome(chatId, users) {
  const cfg = botCfg(chatId);
  if (!cfg?.enabled || !cfg.welcome || !users.length) return;
  const names = users.map((u) => u.display_name || u.displayName).join(', ');
  botPost(chatId, { text: cfg.welcome.replaceAll('{имя}', names).replaceAll('{name}', names) });
}
const cleanText = (v, n) => String(v || '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim().slice(0, n);
function nextRun(t, repeat, tz) {
  const DAY = 86400000;
  if (repeat === 'daily') return t + DAY;
  if (repeat === 'weekly') return t + 7 * DAY;
  if (repeat === 'weekdays') {
    let n = t + DAY;
    // день недели в часовом поясе создателя
    while ([0, 6].includes(new Date(n - tz * 60000).getUTCDay())) n += DAY;
    return n;
  }
  return 0;
}
const taskView = (t) => ({ id: t.id, kind: t.kind, body: JSON.parse(t.body), nextAt: t.next_at, repeat: t.repeat });
app.get('/api/chats/:id/bot', auth, (req, res) => {
  const chat = requireMember(req, res); if (!chat) return;
  if (chat.type !== 'group') return fail(res, 400, 'Бот есть только в группах');
  const cfg = botCfg(chat.id) || { enabled: 0, welcome: '', rules: '' };
  res.json({ enabled: !!cfg.enabled, welcome: cfg.welcome, rules: cfg.rules, admin: isGroupAdmin(chat.id, req.user.id),
    tasks: isGroupAdmin(chat.id, req.user.id) ? db.prepare('SELECT * FROM bot_tasks WHERE chat_id = ? ORDER BY next_at').all(chat.id).map(taskView) : [] });
});
app.put('/api/chats/:id/bot', auth, json, (req, res) => {
  const chat = requireGroupAdmin(req, res); if (!chat) return;
  const was = botCfg(chat.id);
  const enabled = req.body?.enabled ? 1 : 0;
  db.prepare('INSERT INTO group_bots (chat_id, enabled, welcome, rules) VALUES (?, ?, ?, ?) ON CONFLICT(chat_id) DO UPDATE SET enabled = excluded.enabled, welcome = excluded.welcome, rules = excluded.rules')
    .run(chat.id, enabled, cleanText(req.body?.welcome, 1000), cleanText(req.body?.rules, 3000));
  if (enabled && !was?.enabled) botPost(chat.id, { text: 'Привет! Я Тихобот 🤖 Напишите /помощь, чтобы узнать, что я умею.' });
  broadcastChat(chat.id);
  res.json({ ok: true });
});
app.post('/api/chats/:id/bot/tasks', auth, json, (req, res) => {
  const chat = requireGroupAdmin(req, res); if (!chat) return;
  if (db.prepare('SELECT COUNT(*) AS n FROM bot_tasks WHERE chat_id = ?').get(chat.id).n >= 30) return fail(res, 400, 'Не больше 30 заданий');
  const kind = req.body?.kind === 'poll' ? 'poll' : 'text';
  const repeat = ['once', 'daily', 'weekdays', 'weekly'].includes(req.body?.repeat) ? req.body.repeat : 'once';
  const at = Number(req.body?.firstAt);
  if (!at || at < now() - 60000 || at > now() + 366 * 86400000) return fail(res, 400, 'Укажите время в будущем');
  let body;
  if (kind === 'poll') {
    const options = Array.isArray(req.body?.options) ? req.body.options.map((o) => cleanText(o, 100)).filter(Boolean).slice(0, 10) : [];
    const question = cleanText(req.body?.question, 200);
    if (!question || options.length < 2) return fail(res, 400, 'Нужен вопрос и минимум 2 варианта');
    body = { poll: { question, options, multiple: !!req.body?.multiple } };
  } else {
    const text = cleanText(req.body?.text, 2000);
    if (!text) return fail(res, 400, 'Напишите текст напоминания');
    body = { text };
  }
  db.prepare('INSERT INTO bot_tasks (chat_id, kind, body, next_at, repeat, tz, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(chat.id, kind, JSON.stringify(body), at, repeat, Number(req.body?.tz) || 0, req.user.id, now());
  if (!botCfg(chat.id)) db.prepare('INSERT INTO group_bots (chat_id, enabled) VALUES (?, 1)').run(chat.id);
  res.json({ ok: true });
});
app.delete('/api/bot-tasks/:id', auth, (req, res) => {
  const t = db.prepare('SELECT * FROM bot_tasks WHERE id = ?').get(Number(req.params.id));
  if (!t || !isGroupAdmin(t.chat_id, req.user.id)) return fail(res, 404, 'Задание не найдено');
  db.prepare('DELETE FROM bot_tasks WHERE id = ?').run(t.id);
  res.json({ ok: true });
});
setInterval(() => {
  for (const t of db.prepare('SELECT * FROM bot_tasks WHERE next_at <= ? LIMIT 50').all(now())) {
    try {
      if (botCfg(t.chat_id)?.enabled && q.chatById.get(t.chat_id)) botPost(t.chat_id, JSON.parse(t.body));
      const next = nextRun(t.next_at, t.repeat, t.tz);
      if (next) db.prepare('UPDATE bot_tasks SET next_at = ? WHERE id = ?').run(next < now() ? nextRun(now(), t.repeat, t.tz) : next, t.id);
      else db.prepare('DELETE FROM bot_tasks WHERE id = ?').run(t.id);
    } catch (e) { console.warn('bot task failed', e.message); }
  }
}, 5000).unref();
/* Команды: клиент видит свой текст и сам вызывает команду (сервер переписку не читает) */
app.post('/api/chats/:id/bot/command', auth, json, (req, res) => {
  const chat = requireMember(req, res); if (!chat) return;
  const cfg = botCfg(chat.id);
  if (!cfg?.enabled) return fail(res, 400, 'Бот в этой группе выключен');
  if (rateLimited('botcmd:' + chat.id, 30, 60000)) return fail(res, 429, 'Слишком часто');
  const cmd = String(req.body?.cmd || '').toLowerCase().replace(/^\//, '').replace(/@.*$/, '');
  const name = req.user.display_name;
  let text;
  if (['правила', 'rules'].includes(cmd)) text = cfg.rules ? '📋 Правила группы:\n' + cfg.rules : 'Правила пока не написаны. Админ может добавить их в настройках бота.';
  else if (['монетка', 'coin'].includes(cmd)) text = `🪙 ${name} подбрасывает монетку: ${crypto.randomInt(2) ? 'орёл' : 'решка'}!`;
  else if (['кубик', 'dice'].includes(cmd)) text = `🎲 ${name} бросает кубик: ${crypto.randomInt(1, 7)}`;
  else if (['кто', 'online'].includes(cmd)) {
    const on = q.chatMembers.all(chat.id).filter((m) => online.has(m.id)).map((m) => m.display_name);
    text = on.length ? `🟢 Сейчас в сети (${on.length}): ${on.join(', ')}` : 'Сейчас никого нет в сети';
  } else if (['помощь', 'help', 'start'].includes(cmd)) text = 'Я умею:\n/правила — правила группы\n/кто — кто сейчас в сети\n/монетка — орёл или решка\n/кубик — бросить кубик\nАдмины могут настроить приветствие, напоминания и опросы по расписанию.';
  else return res.json({ ok: false });
  botPost(chat.id, { text });
  res.json({ ok: true });
});

/* ---------- Секретные чаты ---------- */
function removeMessagesHard(chatId, ids) {
  if (!ids.length) return;
  for (const id of ids) {
    const m = q.messageById.get(id);
    if (m?.file_ref) { try { fs.unlinkSync(path.join(FILES_DIR, m.file_ref)); } catch { /* нет */ } q.deleteFile.run(m.file_ref); }
    db.prepare('DELETE FROM messages WHERE id = ?').run(id);
  }
  for (const { user_id } of q.memberIds.all(chatId)) sendTo(user_id, { type: 'messagesGone', chatId, ids });
  broadcastChat(chatId);
}
setInterval(() => {
  const rows = db.prepare('SELECT id, chat_id FROM messages WHERE expires_at IS NOT NULL AND expires_at <= ? LIMIT 500').all(now());
  const by = new Map();
  for (const r of rows) { if (!by.has(r.chat_id)) by.set(r.chat_id, []); by.get(r.chat_id).push(r.id); }
  for (const [cid, ids] of by) { try { removeMessagesHard(cid, ids); } catch (e) { console.warn('expire failed', e.message); } }
}, 3000).unref();
app.post('/api/chats/secret', auth, json, (req, res) => {
  const other = q.userById.get(Number(req.body?.userId));
  if (!other || other.id === req.user.id) return fail(res, 404, 'Пользователь не найден');
  if (blockState(req.user.id, other.id)) return fail(res, 403, 'Нельзя: пользователь заблокирован');
  const key = 's:' + [req.user.id, other.id].sort((a, b) => a - b).join(':');
  let chat = q.chatByDirectKey.get(key);
  if (!chat) {
    db.transaction(() => {
      const id = q.insertChat.run('direct', null, key, req.user.id, now()).lastInsertRowid;
      db.prepare('UPDATE chats SET secret = 1, ttl = 0 WHERE id = ?').run(id);
      q.insertMember.run(id, req.user.id, now()); q.insertMember.run(id, other.id, now());
      addSystem(id, `${req.user.display_name} создал(а) секретный чат`);
      chat = q.chatById.get(id);
    })();
    broadcastChat(chat.id);
  }
  res.json({ chat: fullChat(chat.id, req.user.id) });
});
const TTL_NAMES = { 0: 'выключен', 30: '30 секунд', 60: '1 минута', 3600: '1 час', 86400: '1 день', 604800: '1 неделя' };
app.post('/api/chats/:id/ttl', auth, json, (req, res) => {
  const chat = requireMember(req, res); if (!chat) return;
  if (!chat.secret) return fail(res, 400, 'Таймер есть только в секретных чатах');
  const ttl = Number(req.body?.ttl) || 0;
  if (!(ttl in TTL_NAMES)) return fail(res, 400, 'Такого таймера нет');
  db.prepare('UPDATE chats SET ttl = ? WHERE id = ?').run(ttl, chat.id);
  const sys = addSystem(chat.id, ttl ? `${req.user.display_name} включил(а) самоуничтожение: ${TTL_NAMES[ttl]}` : `${req.user.display_name} выключил(а) самоуничтожение`);
  for (const { user_id } of q.memberIds.all(chat.id)) sendTo(user_id, { type: 'message', message: messageView(sys) });
  broadcastChat(chat.id);
  res.json({ chat: fullChat(chat.id, req.user.id) });
});
/* Фото «на один просмотр»: после просмотра получателем исчезает у обоих */
app.post('/api/messages/:id/viewed', auth, (req, res) => {
  const m = q.messageById.get(Number(req.params.id));
  const chat = m && q.chatById.get(m.chat_id);
  if (!m || !chat?.secret || !q.isMember.get(chat.id, req.user.id) || m.sender_id === req.user.id) return fail(res, 404, 'Сообщение не найдено');
  removeMessagesHard(chat.id, [m.id]);
  res.json({ ok: true });
});
app.delete('/api/chats/:id', auth, (req, res) => {
  const chat = requireMember(req, res); if (!chat) return;
  if (!chat.secret) return fail(res, 400, 'Удалить целиком можно только секретный чат');
  const members = q.memberIds.all(chat.id).map((r) => r.user_id);
  for (const r of db.prepare('SELECT file_ref FROM messages WHERE chat_id = ? AND file_ref IS NOT NULL').all(chat.id)) { try { fs.unlinkSync(path.join(FILES_DIR, r.file_ref)); } catch { /* нет */ } }
  for (const f of db.prepare('SELECT id FROM files WHERE chat_id = ?').all(chat.id)) { try { fs.unlinkSync(path.join(FILES_DIR, f.id)); } catch { /* нет */ } }
  db.prepare('DELETE FROM chats WHERE id = ?').run(chat.id);
  for (const uid of members) sendTo(uid, { type: 'chatRemoved', chatId: chat.id });
  res.json({ ok: true });
});

/* ---------- Права в группах ---------- */
const DEFAULT_PERMS = { send: 'all', add: 'all', pin: 'all', info: 'admins' };
function groupPerms(chat) { try { return { ...DEFAULT_PERMS, ...JSON.parse(chat.perms || '{}') }; } catch { return { ...DEFAULT_PERMS }; } }
const memberRole = (chatId, userId) => db.prepare('SELECT role FROM members WHERE chat_id = ? AND user_id = ?').get(chatId, userId)?.role || null;
const isGroupAdmin = (chatId, userId) => ['owner', 'admin'].includes(memberRole(chatId, userId));
function requireGroupAdmin(req, res) {
  const chat = requireMember(req, res); if (!chat) return null;
  if (chat.type !== 'group') { fail(res, 400, 'Это не группа'); return null; }
  if (!isGroupAdmin(chat.id, req.user.id)) { fail(res, 403, 'Только для админов группы'); return null; }
  return chat;
}
app.patch('/api/chats/:id', auth, json, (req, res) => {
  const chat = requireMember(req, res); if (!chat) return;
  if (chat.type !== 'group') return fail(res, 400, 'Это не группа');
  const perms = groupPerms(chat);
  const admin = isGroupAdmin(chat.id, req.user.id);
  if (req.body?.title !== undefined) {
    if (perms.info === 'admins' && !admin) return fail(res, 403, 'Менять название могут только админы');
    const title = cleanName(req.body.title);
    if (!title) return fail(res, 400, 'Название не может быть пустым');
    if (title !== chat.title) {
      db.prepare('UPDATE chats SET title = ? WHERE id = ?').run(title, chat.id);
      addSystem(chat.id, `${req.user.display_name} переименовал(а) группу в «${title}»`);
    }
  }
  if (req.body?.perms && typeof req.body.perms === 'object') {
    if (!admin) return fail(res, 403, 'Менять права могут только админы');
    const next = { ...perms };
    for (const k of Object.keys(DEFAULT_PERMS)) if (['all', 'admins'].includes(req.body.perms[k])) next[k] = req.body.perms[k];
    db.prepare('UPDATE chats SET perms = ? WHERE id = ?').run(JSON.stringify(next), chat.id);
    if (next.send !== perms.send) addSystem(chat.id, next.send === 'admins' ? `${req.user.display_name} разрешил(а) писать только админам` : `${req.user.display_name} разрешил(а) писать всем`);
  }
  broadcastChat(chat.id);
  res.json({ chat: fullChat(chat.id, req.user.id) });
});
app.post('/api/chats/:id/role', auth, json, (req, res) => {
  const chat = requireGroupAdmin(req, res); if (!chat) return;
  if (memberRole(chat.id, req.user.id) !== 'owner') return fail(res, 403, 'Назначать админов может только владелец');
  const uid = Number(req.body?.userId);
  const role = req.body?.role === 'admin' ? 'admin' : req.body?.role === 'owner' ? 'owner' : 'member';
  const cur = memberRole(chat.id, uid);
  if (!cur || uid === req.user.id) return fail(res, 400, 'Нельзя');
  const u = q.userById.get(uid);
  db.transaction(() => {
    if (role === 'owner') {
      db.prepare("UPDATE members SET role = 'admin' WHERE chat_id = ? AND user_id = ?").run(chat.id, req.user.id);
      addSystem(chat.id, `${req.user.display_name} передал(а) группу: теперь владелец ${u.display_name}`);
    } else if (role !== cur) addSystem(chat.id, role === 'admin' ? `${u.display_name} теперь админ` : `${u.display_name} больше не админ`);
    db.prepare('UPDATE members SET role = ? WHERE chat_id = ? AND user_id = ?').run(role, chat.id, uid);
  })();
  broadcastChat(chat.id);
  res.json({ chat: fullChat(chat.id, req.user.id) });
});
app.delete('/api/chats/:id/members/:uid', auth, (req, res) => {
  const chat = requireGroupAdmin(req, res); if (!chat) return;
  const uid = Number(req.params.uid);
  const target = memberRole(chat.id, uid);
  const mine = memberRole(chat.id, req.user.id);
  if (!target || uid === req.user.id) return fail(res, 404, 'Участник не найден');
  if (target === 'owner' || (target === 'admin' && mine !== 'owner')) return fail(res, 403, 'Удалить админа может только владелец');
  const u = q.userById.get(uid);
  leaveRoom(chat.id, uid);
  q.deleteMember.run(chat.id, uid);
  db.prepare('INSERT OR IGNORE INTO chat_bans (chat_id, user_id) VALUES (?, ?)').run(chat.id, uid);
  addSystem(chat.id, `${req.user.display_name} удалил(а) ${u.display_name} из группы`);
  sendTo(uid, { type: 'chatRemoved', chatId: chat.id, kicked: chat.title });
  broadcastChat(chat.id);
  res.json({ chat: fullChat(chat.id, req.user.id) });
});

/* ---------- Ссылки-приглашения ---------- */
const inviteView = (r) => ({ code: r.code, createdAt: r.created_at, expiresAt: r.expires_at, maxUses: r.max_uses, uses: r.uses,
  active: !r.revoked && (!r.expires_at || r.expires_at > now()) && (!r.max_uses || r.uses < r.max_uses), revoked: !!r.revoked,
  by: q.userById.get(r.created_by)?.display_name || '' });
app.get('/api/chats/:id/invites', auth, (req, res) => {
  const chat = requireMember(req, res); if (!chat) return;
  if (chat.type !== 'group') return fail(res, 400, 'Это не группа');
  if (groupPerms(chat).add === 'admins' && !isGroupAdmin(chat.id, req.user.id)) return fail(res, 403, 'Только для админов группы');
  res.json({ invites: db.prepare('SELECT * FROM invites WHERE chat_id = ? AND revoked = 0 ORDER BY created_at DESC LIMIT 50').all(chat.id).map(inviteView) });
});
app.post('/api/chats/:id/invites', auth, json, (req, res) => {
  const chat = requireMember(req, res); if (!chat) return;
  if (chat.type !== 'group') return fail(res, 400, 'Это не группа');
  if (groupPerms(chat).add === 'admins' && !isGroupAdmin(chat.id, req.user.id)) return fail(res, 403, 'Создавать ссылки могут только админы');
  if (rateLimited('invite:' + req.user.id, 30, 3600000)) return fail(res, 429, 'Слишком много ссылок, подождите');
  const ttl = Math.max(0, Math.min(Number(req.body?.expiresIn) || 0, 366 * 86400000));
  const max = Math.max(0, Math.min(Number(req.body?.maxUses) || 0, 100000));
  const code = crypto.randomBytes(9).toString('base64url');
  db.prepare('INSERT INTO invites (code, chat_id, created_by, created_at, expires_at, max_uses) VALUES (?, ?, ?, ?, ?, ?)').run(code, chat.id, req.user.id, now(), ttl ? now() + ttl : 0, max);
  res.json({ invite: inviteView(db.prepare('SELECT * FROM invites WHERE code = ?').get(code)) });
});
app.delete('/api/invites/:code', auth, (req, res) => {
  const r = db.prepare('SELECT * FROM invites WHERE code = ?').get(String(req.params.code));
  if (!r || !q.isMember.get(r.chat_id, req.user.id) || (r.created_by !== req.user.id && !isGroupAdmin(r.chat_id, req.user.id))) return fail(res, 404, 'Ссылка не найдена');
  db.prepare('UPDATE invites SET revoked = 1 WHERE code = ?').run(r.code);
  res.json({ ok: true });
});
function inviteFor(req, res) {
  if (rateLimited('invite-use:' + req.user.id, 60, 600000)) { fail(res, 429, 'Слишком часто'); return null; }
  const r = db.prepare('SELECT * FROM invites WHERE code = ?').get(String(req.params.code));
  const chat = r && q.chatById.get(r.chat_id);
  if (!r || !chat || !inviteView(r).active) { fail(res, 404, 'Ссылка недействительна или устарела'); return null; }
  return { r, chat };
}
app.get('/api/invites/:code', auth, (req, res) => {
  const x = inviteFor(req, res); if (!x) return;
  const members = q.memberIds.all(x.chat.id).length;
  res.json({ chat: { id: x.chat.id, title: x.chat.title, members }, member: !!q.isMember.get(x.chat.id, req.user.id) });
});
app.post('/api/invites/:code/join', auth, (req, res) => {
  const x = inviteFor(req, res); if (!x) return;
  const { chat, r } = x;
  if (q.isMember.get(chat.id, req.user.id)) return res.json({ chat: fullChat(chat.id, req.user.id) });
  if (db.prepare('SELECT 1 FROM chat_bans WHERE chat_id = ? AND user_id = ?').get(chat.id, req.user.id)) return fail(res, 403, 'Вас удалили из этой группы — вернуть может только админ');
  if (q.memberIds.all(chat.id).length >= 200) return fail(res, 400, 'В группе уже 200 участников');
  db.transaction(() => {
    q.insertMember.run(chat.id, req.user.id, now());
    db.prepare('UPDATE invites SET uses = uses + 1 WHERE code = ?').run(r.code);
    addSystem(chat.id, `${req.user.display_name} вступил(а) по ссылке`);
  })();
  setTimeout(() => botWelcome(chat.id, [req.user]), 300);
  broadcastChat(chat.id);
  res.json({ chat: fullChat(chat.id, req.user.id) });
});

/* Архив — личная настройка каждого участника */
app.post('/api/chats/:id/archive', auth, json, (req, res) => {
  const chat = requireMember(req, res); if (!chat) return;
  db.prepare('UPDATE members SET archived = ? WHERE chat_id = ? AND user_id = ?').run(req.body?.archived ? 1 : 0, chat.id, req.user.id);
  res.json({ chat: fullChat(chat.id, req.user.id) });
});

/* Папки чатов */
app.get('/api/me/folders', auth, (req, res) => res.json({ folders: JSON.parse(q.userById.get(req.user.id).folders || '[]') }));
app.put('/api/me/folders', auth, json, (req, res) => {
  const list = Array.isArray(req.body?.folders) ? req.body.folders.slice(0, 20) : [];
  const clean = list.map((f, i) => ({
    id: String(f.id || 'f' + i).replace(/[^a-z0-9_-]/gi, '').slice(0, 24) || 'f' + i,
    name: cleanName(f.name).slice(0, 24) || 'Папка',
    chatIds: Array.isArray(f.chatIds) ? [...new Set(f.chatIds.map(Number).filter((n) => q.isMember.get(n, req.user.id)))].slice(0, 500) : [],
  }));
  db.prepare('UPDATE users SET folders = ? WHERE id = ?').run(JSON.stringify(clean), req.user.id);
  res.json({ folders: clean });
});

/* Голосование в опросе (вопрос и варианты зашифрованы, сервер знает только номера вариантов) */
app.post('/api/messages/:id/vote', auth, json, (req, res) => {
  const m = q.messageById.get(Number(req.params.id));
  if (!m || !['msg', 'bot'].includes(m.kind) || !q.isMember.get(m.chat_id, req.user.id)) return fail(res, 404, 'Опрос не найден');
  const opts = Array.isArray(req.body?.options) ? [...new Set(req.body.options.map(Number))].filter((n) => Number.isInteger(n) && n >= 0 && n < 12) : [];
  db.transaction(() => {
    db.prepare('DELETE FROM poll_votes WHERE message_id = ? AND user_id = ?').run(m.id, req.user.id);
    for (const o of opts) db.prepare('INSERT INTO poll_votes (message_id, user_id, option) VALUES (?, ?, ?)').run(m.id, req.user.id, o);
  })();
  const votes = pollVotes(m.id);
  for (const { user_id } of q.memberIds.all(m.chat_id)) sendTo(user_id, { type: 'votes', chatId: m.chat_id, messageId: m.id, votes });
  res.json({ votes });
});

app.post('/api/chats/:id/read', auth, json, (req, res) => {
  const chat = requireMember(req, res); if (!chat) return;
  const id = Number(req.body?.messageId) || 0;
  q.setRead.run(id, chat.id, req.user.id);
  for (const { user_id } of q.memberIds.all(chat.id)) sendTo(user_id, { type: 'read', chatId: chat.id, userId: req.user.id, messageId: id });
  if (chat.secret && chat.ttl) {
    // таймер самоуничтожения запускается, когда собеседник прочитал сообщение
    const rows = db.prepare("SELECT id FROM messages WHERE chat_id = ? AND id <= ? AND expires_at IS NULL AND kind = 'msg' AND sender_id != ?").all(chat.id, id, req.user.id);
    if (rows.length) {
      const at = now() + chat.ttl * 1000;
      for (const r of rows) db.prepare('UPDATE messages SET expires_at = ? WHERE id = ?').run(at, r.id);
      for (const { user_id } of q.memberIds.all(chat.id)) sendTo(user_id, { type: 'expiry', chatId: chat.id, ids: rows.map((r) => r.id), expiresAt: at });
    }
  }
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
  const shared = f && db.prepare('SELECT 1 FROM file_access fa JOIN members m ON m.chat_id = fa.chat_id WHERE fa.file_id = ? AND m.user_id = ?').get(id, req.user.id);
  if (!f || (!q.isMember.get(f.chat_id, req.user.id) && !shared)) return fail(res, 404, 'Файл не найден');
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
  fs.createReadStream(path.join(FILES_DIR, id)).pipe(res);
});

/* ---------- Блокировка пользователей ---------- */
function blockedBy(blocker, target) { return !!db.prepare('SELECT 1 FROM blocks WHERE user_id = ? AND blocked_id = ?').get(blocker, target); }
/* 'me' — я заблокировал собеседника, 'them' — он меня */
function blockState(me, otherId) {
  if (!otherId || otherId === me) return null;
  return blockedBy(me, otherId) ? 'me' : blockedBy(otherId, me) ? 'them' : null;
}
function afterBlockChange(a, b) {
  const chat = q.chatByDirectKey.get([a, b].sort((x, y) => x - y).join(':'));
  if (chat) broadcastChat(chat.id);
  sendTo(a, { type: 'blocks' });
}
app.get('/api/blocks', auth, (req, res) => {
  const rows = db.prepare('SELECT u.* FROM blocks b JOIN users u ON u.id = b.blocked_id WHERE b.user_id = ? ORDER BY b.created_at DESC').all(req.user.id);
  res.json({ users: rows.map(publicUser) });
});
app.post('/api/blocks', auth, json, (req, res) => {
  const u = q.userById.get(Number(req.body?.userId));
  if (!u || u.id === req.user.id) return fail(res, 404, 'Пользователь не найден');
  db.prepare('INSERT OR IGNORE INTO blocks (user_id, blocked_id, created_at) VALUES (?, ?, ?)').run(req.user.id, u.id, now());
  for (const [cid, live] of liveCalls) if ([live.caller, live.callee].includes(u.id) && [live.caller, live.callee].includes(req.user.id)) {
    sendTo(u.id, { type: 'call', from: req.user.id, callId: cid, action: 'end' }); finishCall(cid, 'rejected');
  }
  afterBlockChange(req.user.id, u.id);
  res.json({ ok: true });
});
app.delete('/api/blocks/:id', auth, (req, res) => {
  db.prepare('DELETE FROM blocks WHERE user_id = ? AND blocked_id = ?').run(req.user.id, Number(req.params.id));
  afterBlockChange(req.user.id, Number(req.params.id));
  res.json({ ok: true });
});

/* ---------- Активные сеансы ---------- */
function deviceName(ua) {
  ua = String(ua || '');
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows'
    : /Mac OS X|Macintosh/.test(ua) ? 'macOS' : /CrOS/.test(ua) ? 'ChromeOS' : /Linux/.test(ua) ? 'Linux' : '';
  const br = /YaBrowser/.test(ua) ? 'Яндекс Браузер' : /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung Internet'
    : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : '';
  return [br, os].filter(Boolean).join(', ') || 'Неизвестное устройство';
}
function kickSessions(userId, sessionIds) {
  const set = online.get(userId);
  if (!set) return;
  for (const ws of [...set]) if (!sessionIds || sessionIds.includes(ws.sessionId)) {
    try { ws.send(JSON.stringify({ type: 'loggedOut' })); } catch { /* закрыт */ }
    ws.close();
  }
}
app.get('/api/sessions', auth, (req, res) => {
  const rows = db.prepare('SELECT rowid AS id, created_at, last_active, user_agent, ip FROM sessions WHERE user_id = ? AND expires_at > ? ORDER BY last_active DESC').all(req.user.id, now());
  const live = new Set([...(online.get(req.user.id) || [])].map((ws) => ws.sessionId));
  res.json({ sessions: rows.map((r) => ({ id: r.id, current: r.id === req.sessionId, online: live.has(r.id), device: deviceName(r.user_agent),
    ip: r.ip, createdAt: r.created_at, lastActive: r.last_active })) });
});
app.delete('/api/sessions/:id', auth, (req, res) => {
  const id = Number(req.params.id);
  if (id === req.sessionId) return fail(res, 400, 'Чтобы завершить этот сеанс, нажмите «Выйти»');
  const r = db.prepare('DELETE FROM sessions WHERE rowid = ? AND user_id = ?').run(id, req.user.id);
  if (!r.changes) return fail(res, 404, 'Сеанс не найден');
  kickSessions(req.user.id, [id]);
  res.json({ ok: true });
});
app.post('/api/sessions/terminate-others', auth, (req, res) => {
  const ids = db.prepare('SELECT rowid AS id FROM sessions WHERE user_id = ? AND rowid != ?').all(req.user.id, req.sessionId).map((r) => r.id);
  db.prepare('DELETE FROM sessions WHERE user_id = ? AND rowid != ?').run(req.user.id, req.sessionId);
  kickSessions(req.user.id, ids);
  res.json({ ok: true, count: ids.length });
});

/* ---------- Жалобы и модерация ---------- */
const ADMINS = (process.env.ADMINS || '').split(',').map((x) => x.trim().replace(/^@/, '').toLowerCase()).filter(Boolean);
function isAdmin(u) {
  if (!u) return false;
  if (ADMINS.length) return ADMINS.includes(u.username.toLowerCase());
  return u.id === db.prepare('SELECT MIN(id) AS id FROM users').get().id; // без настройки модератор — первый зарегистрированный
}
const REPORT_REASONS = ['Спам', 'Мошенничество', 'Оскорбления или травля', 'Насилие', 'Незаконный контент', 'Другое'];
app.post('/api/reports', auth, json, (req, res) => {
  if (rateLimited('report:' + req.user.id, 20, 3600000)) return fail(res, 429, 'Слишком много жалоб, попробуйте позже');
  const kind = String(req.body?.kind || '');
  const targetId = Number(req.body?.targetId);
  const reason = REPORT_REASONS.includes(req.body?.reason) ? req.body.reason : null;
  if (!reason) return fail(res, 400, 'Выберите причину');
  let targetUser = null;
  if (kind === 'user') { const u = q.userById.get(targetId); if (!u || u.id === req.user.id) return fail(res, 404, 'Пользователь не найден'); targetUser = u.id; }
  else if (kind === 'message') {
    const m = q.messageById.get(targetId);
    if (!m || !q.isMember.get(m.chat_id, req.user.id) || m.sender_id === req.user.id) return fail(res, 404, 'Сообщение не найдено');
    targetUser = m.sender_id;
  } else if (kind === 'channel') { const c = cq.byId.get(targetId); if (!c) return fail(res, 404, 'Канал не найден'); targetUser = c.owner_id; }
  else if (kind === 'post') { const p = cq.post.get(targetId); if (!p) return fail(res, 404, 'Публикация не найдена'); targetUser = p.author_id; }
  else return fail(res, 400, 'Неизвестный тип жалобы');
  const clean = (v, n) => String(v || '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim().slice(0, n);
  db.prepare('INSERT INTO reports (reporter_id, kind, target_id, target_user_id, reason, comment, evidence, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(req.user.id, kind, targetId, targetUser, reason, clean(req.body?.comment, 1000), kind === 'message' ? clean(req.body?.evidence, 4000) : '', now());
  if (req.body?.block && targetUser && targetUser !== req.user.id && (kind === 'user' || kind === 'message')) {
    db.prepare('INSERT OR IGNORE INTO blocks (user_id, blocked_id, created_at) VALUES (?, ?, ?)').run(req.user.id, targetUser, now());
    afterBlockChange(req.user.id, targetUser);
  }
  for (const a of db.prepare('SELECT * FROM users').all()) if (isAdmin(a) && a.id !== req.user.id) sendTo(a.id, { type: 'reports' });
  res.json({ ok: true });
});
function adminOnly(req, res, next) { return isAdmin(req.user) ? next() : fail(res, 403, 'Только для модераторов'); }
app.get('/api/admin/reports', auth, adminOnly, (req, res) => {
  const status = req.query.status === 'closed' ? 'closed' : 'open';
  const rows = db.prepare('SELECT * FROM reports WHERE status = ? ORDER BY id DESC LIMIT 200').all(status);
  res.json({ reports: rows.map((r) => {
    const reporter = q.userById.get(r.reporter_id), target = r.target_user_id ? q.userById.get(r.target_user_id) : null;
    let channel = null, post = null;
    if (r.kind === 'channel') { const c = cq.byId.get(r.target_id); channel = c ? { id: c.id, title: c.title, slug: c.slug } : null; }
    if (r.kind === 'post') {
      const p = cq.post.get(r.target_id);
      const c = p && cq.byId.get(p.channel_id);
      post = p ? { id: p.id, channelId: p.channel_id, text: String(JSON.parse(p.body).text || '').slice(0, 500) } : null;
      channel = c ? { id: c.id, title: c.title, slug: c.slug } : null;
    }
    return { id: r.id, kind: r.kind, reason: r.reason, comment: r.comment, evidence: r.evidence, createdAt: r.created_at, status: r.status,
      reporter: reporter ? publicUser(reporter) : null, target: target ? { ...publicUser(target), banned: !!target.banned } : null, channel, post,
      sameTarget: db.prepare('SELECT COUNT(*) AS n FROM reports WHERE target_user_id = ?').get(r.target_user_id).n };
  }), open: db.prepare("SELECT COUNT(*) AS n FROM reports WHERE status = 'open'").get().n });
});
function banUser(id, on) {
  db.prepare('UPDATE users SET banned = ? WHERE id = ?').run(on ? 1 : 0, id);
  if (on) { db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id); kickSessions(id); }
}
app.post('/api/admin/reports/:id', auth, adminOnly, json, (req, res) => {
  const r = db.prepare('SELECT * FROM reports WHERE id = ?').get(Number(req.params.id));
  if (!r) return fail(res, 404, 'Жалоба не найдена');
  const action = String(req.body?.action || 'close');
  if (action === 'ban') {
    if (!r.target_user_id || isAdmin(q.userById.get(r.target_user_id))) return fail(res, 400, 'Этого пользователя нельзя заблокировать');
    banUser(r.target_user_id, true);
  } else if (action === 'deletePost' && r.kind === 'post') {
    const p = cq.post.get(r.target_id);
    if (p) { cq.delPost.run(p.id); chBroadcast(p.channel_id, { type: 'channelPostDeleted', channelId: p.channel_id, postId: p.id }); }
  } else if (action === 'deleteChannel' && (r.kind === 'channel' || r.kind === 'post')) {
    const c = cq.byId.get(r.kind === 'channel' ? r.target_id : cq.post.get(r.target_id)?.channel_id);
    if (c) removeChannel(c);
  } else if (action !== 'close') return fail(res, 400, 'Неизвестное действие');
  // закрываем и все остальные открытые жалобы на ту же цель
  db.prepare("UPDATE reports SET status = 'closed', handled_by = ?, handled_at = ? WHERE status = 'open' AND kind = ? AND target_id = ?").run(req.user.id, now(), r.kind, r.target_id);
  if (action === 'ban') db.prepare("UPDATE reports SET status = 'closed', handled_by = ?, handled_at = ? WHERE status = 'open' AND target_user_id = ?").run(req.user.id, now(), r.target_user_id);
  res.json({ ok: true });
});
app.get('/api/admin/banned', auth, adminOnly, (req, res) => {
  res.json({ users: db.prepare('SELECT * FROM users WHERE banned = 1 ORDER BY id DESC').all().map(publicUser) });
});
app.post('/api/admin/unban', auth, adminOnly, json, (req, res) => { banUser(Number(req.body?.userId), false); res.json({ ok: true }); });

/* ---------- Истории: видны контактам 24 часа, зашифрованы для каждого зрителя ---------- */
const STORY_DIR = path.join(DATA_DIR, 'story-files');
fs.mkdirSync(STORY_DIR, { recursive: true });
const STORY_TTL = 24 * 3600000;
db.exec(`CREATE TABLE IF NOT EXISTS stories (
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, body TEXT NOT NULL, file_id TEXT, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id, expires_at);
CREATE TABLE IF NOT EXISTS story_audience (
  story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (story_id, user_id));
CREATE INDEX IF NOT EXISTS idx_story_aud_user ON story_audience(user_id);
CREATE TABLE IF NOT EXISTS story_views (
  story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at INTEGER NOT NULL, reaction TEXT, PRIMARY KEY (story_id, user_id));
CREATE TABLE IF NOT EXISTS story_files (
  id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, size INTEGER NOT NULL, created_at INTEGER NOT NULL);`);
function purgeStories() {
  const old = db.prepare('SELECT id, file_id FROM stories WHERE expires_at <= ?').all(now());
  for (const st of old) if (st.file_id) { try { fs.unlinkSync(path.join(STORY_DIR, st.file_id)); } catch { /* нет */ } }
  db.prepare('DELETE FROM stories WHERE expires_at <= ?').run(now());
  // файлы, загруженные, но не опубликованные
  for (const f of db.prepare('SELECT id FROM story_files WHERE created_at < ? AND id NOT IN (SELECT file_id FROM stories WHERE file_id IS NOT NULL)').all(now() - 3600000)) {
    try { fs.unlinkSync(path.join(STORY_DIR, f.id)); } catch { /* нет */ }
    db.prepare('DELETE FROM story_files WHERE id = ?').run(f.id);
  }
}
setInterval(purgeStories, 10 * 60000).unref();
const storyContacts = (userId) => q.contactIds.all(userId, userId).map((r) => r.id).filter((id) => !blockState(userId, id));
function storyView(st, viewerId) {
  const mine = st.user_id === viewerId;
  const v = db.prepare('SELECT viewed_at, reaction FROM story_views WHERE story_id = ? AND user_id = ?').get(st.id, viewerId);
  return { id: st.id, userId: st.user_id, kind: st.kind, envelope: JSON.parse(st.body), fileId: st.file_id, createdAt: st.created_at, expiresAt: st.expires_at,
    seen: mine || !!v, reaction: v?.reaction || null,
    views: mine ? db.prepare('SELECT COUNT(*) AS n FROM story_views WHERE story_id = ?').get(st.id).n : undefined };
}
app.get('/api/stories', auth, (req, res) => {
  const t = now();
  const rows = db.prepare(`SELECT s.* FROM stories s WHERE s.expires_at > ? AND (s.user_id = ? OR EXISTS
    (SELECT 1 FROM story_audience a WHERE a.story_id = s.id AND a.user_id = ?)) ORDER BY s.id`).all(t, req.user.id, req.user.id);
  const by = new Map();
  for (const r of rows) {
    if (r.user_id !== req.user.id && blockState(req.user.id, r.user_id)) continue;
    if (!by.has(r.user_id)) by.set(r.user_id, []);
    by.get(r.user_id).push(storyView(r, req.user.id));
  }
  const feed = [...by].map(([uid, stories]) => {
    const u = q.userById.get(uid);
    return { user: { ...publicUser(u), publicKey: u.public_key }, stories, unseen: stories.some((x) => !x.seen), last: stories[stories.length - 1].createdAt };
  });
  res.json({ feed, audience: storyContacts(req.user.id).map((id) => { const u = q.userById.get(id); return { id: u.id, publicKey: u.public_key }; }) });
});
app.post('/api/stories/files', auth, express.raw({ type: 'application/octet-stream', limit: MAX_FILE + 1024 }), (req, res) => {
  if (!Buffer.isBuffer(req.body) || !req.body.length) return fail(res, 400, 'Пустой файл');
  if (rateLimited('story-file:' + req.user.id, 60, 3600000)) return fail(res, 429, 'Слишком много историй, подождите');
  const id = crypto.randomBytes(16).toString('hex');
  fs.writeFileSync(path.join(STORY_DIR, id), req.body);
  db.prepare('INSERT INTO story_files (id, user_id, size, created_at) VALUES (?, ?, ?, ?)').run(id, req.user.id, req.body.length, now());
  res.json({ id });
});
app.get('/api/stories/files/:id', auth, (req, res) => {
  const id = String(req.params.id);
  if (!/^[a-f0-9]{32}$/.test(id)) return fail(res, 404, 'Файл не найден');
  const ok = db.prepare(`SELECT 1 FROM stories s WHERE s.file_id = ? AND s.expires_at > ? AND (s.user_id = ? OR EXISTS
    (SELECT 1 FROM story_audience a WHERE a.story_id = s.id AND a.user_id = ?))`).get(id, now(), req.user.id, req.user.id)
    || db.prepare('SELECT 1 FROM story_files WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!ok || !fs.existsSync(path.join(STORY_DIR, id))) return fail(res, 404, 'Файл не найден');
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Cache-Control', 'private, max-age=86400');
  fs.createReadStream(path.join(STORY_DIR, id)).pipe(res);
});
app.post('/api/stories', auth, json, (req, res) => {
  if (rateLimited('story:' + req.user.id, 30, 3600000)) return fail(res, 429, 'Слишком много историй, подождите');
  const env = req.body?.envelope;
  const kind = ['photo', 'video', 'text'].includes(req.body?.kind) ? req.body.kind : null;
  if (!kind || !validEnvelope(env)) return fail(res, 400, 'Некорректная история');
  const fileId = req.body.fileId ? String(req.body.fileId) : null;
  if (kind !== 'text' && !(fileId && db.prepare('SELECT 1 FROM story_files WHERE id = ? AND user_id = ?').get(fileId, req.user.id))) return fail(res, 400, 'Файл не найден');
  const allowed = new Set(storyContacts(req.user.id));
  const audience = Object.keys(env.keys).map(Number).filter((id) => allowed.has(id));
  const id = db.transaction(() => {
    const sid = db.prepare('INSERT INTO stories (user_id, kind, body, file_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.id, kind, JSON.stringify(env), kind === 'text' ? null : fileId, now(), now() + STORY_TTL).lastInsertRowid;
    for (const uid of audience) db.prepare('INSERT OR IGNORE INTO story_audience (story_id, user_id) VALUES (?, ?)').run(sid, uid);
    return sid;
  })();
  for (const uid of [req.user.id, ...audience]) sendTo(uid, { type: 'stories' });
  res.json({ story: storyView(db.prepare('SELECT * FROM stories WHERE id = ?').get(id), req.user.id), audience: audience.length });
});
function storyFor(req, res) {
  const st = db.prepare('SELECT * FROM stories WHERE id = ? AND expires_at > ?').get(Number(req.params.id), now());
  const ok = st && (st.user_id === req.user.id || db.prepare('SELECT 1 FROM story_audience WHERE story_id = ? AND user_id = ?').get(st.id, req.user.id));
  if (!ok) { fail(res, 404, 'История не найдена или исчезла'); return null; }
  return st;
}
app.post('/api/stories/:id/view', auth, (req, res) => {
  const st = storyFor(req, res); if (!st) return;
  if (st.user_id !== req.user.id) {
    const r = db.prepare('INSERT OR IGNORE INTO story_views (story_id, user_id, viewed_at) VALUES (?, ?, ?)').run(st.id, req.user.id, now());
    if (r.changes) sendTo(st.user_id, { type: 'storyViews', storyId: st.id });
  }
  res.json({ ok: true });
});
app.post('/api/stories/:id/react', auth, json, (req, res) => {
  const st = storyFor(req, res); if (!st) return;
  if (st.user_id === req.user.id) return fail(res, 400, 'Нельзя');
  const emoji = String(req.body?.emoji || '');
  if (emoji && !REACTIONS.includes(emoji)) return fail(res, 400, 'Такой реакции нет');
  db.prepare('INSERT INTO story_views (story_id, user_id, viewed_at, reaction) VALUES (?, ?, ?, ?) ON CONFLICT(story_id, user_id) DO UPDATE SET reaction = excluded.reaction')
    .run(st.id, req.user.id, now(), emoji || null);
  sendTo(st.user_id, { type: 'storyViews', storyId: st.id, reaction: emoji || null, from: req.user.display_name });
  res.json({ ok: true });
});
app.get('/api/stories/:id/views', auth, (req, res) => {
  const st = storyFor(req, res); if (!st) return;
  if (st.user_id !== req.user.id) return fail(res, 403, 'Только автор видит просмотры');
  const rows = db.prepare('SELECT v.*, u.* FROM story_views v JOIN users u ON u.id = v.user_id WHERE v.story_id = ? ORDER BY v.viewed_at DESC').all(st.id);
  res.json({ views: rows.map((r) => ({ user: publicUser(r), viewedAt: r.viewed_at, reaction: r.reaction })) });
});
app.delete('/api/stories/:id', auth, (req, res) => {
  const st = storyFor(req, res); if (!st) return;
  if (st.user_id !== req.user.id) return fail(res, 403, 'Нельзя');
  const aud = db.prepare('SELECT user_id FROM story_audience WHERE story_id = ?').all(st.id).map((r) => r.user_id);
  if (st.file_id) { try { fs.unlinkSync(path.join(STORY_DIR, st.file_id)); } catch { /* нет */ } db.prepare('DELETE FROM story_files WHERE id = ?').run(st.file_id); }
  db.prepare('DELETE FROM stories WHERE id = ?').run(st.id);
  for (const uid of [req.user.id, ...aud]) sendTo(uid, { type: 'stories' });
  res.json({ ok: true });
});

/* ---------- Push-уведомления (Web Push, VAPID) ---------- */
const webpush = require('web-push');
const VAPID_FILE = path.join(DATA_DIR, 'vapid.json');
let vapid;
try { vapid = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf8')); } catch {
  vapid = webpush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_FILE, JSON.stringify(vapid), { mode: 0o600 });
}
webpush.setVapidDetails(process.env.PUSH_CONTACT || 'mailto:admin@tiho.invalid', vapid.publicKey, vapid.privateKey);
db.exec(`CREATE TABLE IF NOT EXISTS push_subs (
  endpoint TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  p256dh TEXT NOT NULL, auth TEXT NOT NULL, created_at INTEGER NOT NULL);`);
app.get('/api/push/key', auth, (req, res) => res.json({ publicKey: vapid.publicKey }));
app.post('/api/push/subscribe', auth, json, (req, res) => {
  const s = req.body?.subscription;
  const ok = s && typeof s.endpoint === 'string' && /^https:\/\//.test(s.endpoint) && s.endpoint.length < 1000 && isB64(s.keys?.p256dh, 200) && isB64(s.keys?.auth, 100);
  if (!ok) return fail(res, 400, 'Некорректная подписка');
  db.prepare('INSERT INTO push_subs (endpoint, user_id, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth')
    .run(s.endpoint, req.user.id, s.keys.p256dh, s.keys.auth, now());
  res.json({ ok: true });
});
app.post('/api/push/unsubscribe', auth, json, (req, res) => {
  db.prepare('DELETE FROM push_subs WHERE endpoint = ? AND user_id = ?').run(String(req.body?.endpoint || ''), req.user.id);
  res.json({ ok: true });
});
app.post('/api/push/test', auth, (req, res) => {
  pushTo(req.user.id, { title: 'Тихо', body: 'Push-уведомления работают', tag: 'test', url: '/' }, true);
  res.json({ ok: true });
});
/* Отправляем, только если у человека нет открытого мессенджера (нет WebSocket) */
function pushTo(userId, payload, force = false) {
  if (!force && online.has(userId)) return;
  const subs = db.prepare('SELECT * FROM push_subs WHERE user_id = ?').all(userId);
  for (const s of subs) {
    webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 3600, urgency: payload.urgent ? 'high' : 'normal' })
      .catch((e) => { if (e.statusCode === 404 || e.statusCode === 410) db.prepare('DELETE FROM push_subs WHERE endpoint = ?').run(s.endpoint); });
  }
}
function pushMessage(chatId, senderId, kindText, mentioned) {
  const chat = q.chatById.get(chatId);
  const sender = senderId ? q.userById.get(senderId) : null;
  if (!chat || !sender) return;
  for (const { user_id } of q.memberIds.all(chatId)) {
    if (user_id === senderId) continue;
    const muted = db.prepare('SELECT muted_until FROM members WHERE chat_id = ? AND user_id = ?').get(chatId, user_id)?.muted_until > now();
    if (muted && !mentioned?.has(user_id)) continue;
    const text = mentioned?.has(user_id) ? 'Упомянул(а) вас' : kindText;
    pushTo(user_id, {
      title: chat.type === 'group' ? chat.title : sender.display_name,
      body: chat.type === 'group' ? `${sender.display_name}: ${text}` : text,
      tag: 'chat-' + chatId, url: '/', chatId,
    });
  }
}

/* ---------- Звонки: сервер только передаёт сигналы WebRTC, звук и видео идут напрямую ---------- */
const TURN_URL = (process.env.TURN_URL || '').trim();
const TURN_SECRET = (process.env.TURN_SECRET || '').trim();
const TURN_USER = (process.env.TURN_USER || '').trim();
const TURN_PASS = (process.env.TURN_PASS || '').trim();
const STUN_URLS = (process.env.STUN_URLS || 'stun:stun.l.google.com:19302,stun:stun.cloudflare.com:3478').split(',').map((x) => x.trim()).filter(Boolean);
db.exec(`CREATE TABLE IF NOT EXISTS calls (
  id TEXT PRIMARY KEY, caller_id INTEGER NOT NULL, callee_id INTEGER NOT NULL, kind TEXT NOT NULL,
  started_at INTEGER NOT NULL, answered_at INTEGER, ended_at INTEGER, status TEXT NOT NULL DEFAULT 'ringing');
CREATE INDEX IF NOT EXISTS idx_calls_caller ON calls(caller_id); CREATE INDEX IF NOT EXISTS idx_calls_callee ON calls(callee_id);`);
function iceServers(userId) {
  const list = [{ urls: STUN_URLS }];
  if (TURN_URL && TURN_SECRET) {
    const username = `${Math.floor(Date.now() / 1000) + 12 * 3600}:${userId}`;
    list.push({ urls: TURN_URL.split(','), username, credential: crypto.createHmac('sha1', TURN_SECRET).update(username).digest('base64') });
  } else if (TURN_URL && TURN_USER) {
    list.push({ urls: TURN_URL.split(','), username: TURN_USER, credential: TURN_PASS });
  }
  return list;
}
app.get('/api/calls/ice', auth, (req, res) => res.json({ iceServers: iceServers(req.user.id) }));
app.get('/api/calls', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM calls WHERE caller_id = ? OR callee_id = ? ORDER BY started_at DESC LIMIT 100').all(req.user.id, req.user.id);
  res.json({ calls: rows.map((c) => {
    const otherId = c.caller_id === req.user.id ? c.callee_id : c.caller_id;
    const o = q.userById.get(otherId);
    return { id: c.id, kind: c.kind, outgoing: c.caller_id === req.user.id, status: c.status, startedAt: c.started_at,
      duration: c.answered_at && c.ended_at ? Math.round((c.ended_at - c.answered_at) / 1000) : 0, user: o ? publicUser(o) : null };
  }) });
});
const liveCalls = new Map(); // callId -> {caller, callee}
function callAllowed(a, b) { return a !== b && !blockState(a, b) && !!q.chatByDirectKey.get([a, b].sort((x, y) => x - y).join(':')); }
function finishCall(callId, status) {
  const c = db.prepare('SELECT * FROM calls WHERE id = ?').get(callId);
  liveCalls.delete(callId);
  if (!c || c.ended_at) return;
  const final = c.answered_at ? 'ended' : status;
  db.prepare('UPDATE calls SET ended_at = ?, status = ? WHERE id = ?').run(now(), final, callId);
  const chatId = q.chatByDirectKey.get([c.caller_id, c.callee_id].sort((x, y) => x - y).join(':'))?.id;
  if (!chatId) return;
  const duration = c.answered_at ? Math.round((now() - c.answered_at) / 1000) : 0;
  const info = q.insertMessage.run(chatId, c.caller_id, 'call', JSON.stringify({ kind: c.kind, status: final, duration }), now());
  const msg = messageView(q.messageById.get(info.lastInsertRowid));
  for (const { user_id } of q.memberIds.all(chatId)) { sendTo(user_id, { type: 'message', message: msg }); sendTo(user_id, { type: 'callsChanged' }); }
}
function handleCallSignal(user, m) {
  const to = Number(m.to);
  const callId = String(m.callId || '').slice(0, 40);
  if (!/^[a-z0-9-]{8,40}$/i.test(callId) || !callAllowed(user.id, to)) return;
  const action = String(m.action || '');
  if (!['offer', 'answer', 'ice', 'end', 'reject', 'busy', 'ringing', 'renegotiate', 'renegotiate-answer'].includes(action)) return;
  if (action === 'offer') {
    if (db.prepare('SELECT 1 FROM calls WHERE id = ?').get(callId)) return;
    const kind = m.kind === 'video' ? 'video' : 'audio';
    db.prepare('INSERT INTO calls (id, caller_id, callee_id, kind, started_at) VALUES (?, ?, ?, ?, ?)').run(callId, user.id, to, kind, now());
    liveCalls.set(callId, { caller: user.id, callee: to });
    if (!online.has(to)) {
      setTimeout(() => finishCall(callId, 'missed'), 100);
      sendTo(user.id, { type: 'call', from: to, callId, action: 'unavailable' });
      pushTo(to, { title: user.display_name, body: kind === 'video' ? '📵 Пропущенный видеозвонок' : '📵 Пропущенный звонок', tag: 'call', url: '/', urgent: true });
      return;
    }
  } else {
    const live = liveCalls.get(callId);
    if (!live || ![live.caller, live.callee].includes(user.id) || ![live.caller, live.callee].includes(to)) return;
    if (action === 'answer') db.prepare("UPDATE calls SET answered_at = COALESCE(answered_at, ?), status = 'answered' WHERE id = ?").run(now(), callId);
    if (action === 'end') finishCall(callId, user.id === live.caller ? 'missed' : 'rejected');
    if (action === 'reject') finishCall(callId, 'rejected');
    if (action === 'busy') finishCall(callId, 'busy');
  }
  const me = q.userById.get(user.id);
  sendTo(to, { type: 'call', from: user.id, fromUser: publicUser(me), callId, action, kind: m.kind, data: m.data });
}

/* ---------- Каналы (публикации не шифруются сквозным шифрованием — как в Telegram) ---------- */
const CH_FILES = path.join(DATA_DIR, 'channel_files');
fs.mkdirSync(CH_FILES, { recursive: true });
db.exec(`CREATE TABLE IF NOT EXISTS channels (
  id INTEGER PRIMARY KEY, slug TEXT NOT NULL UNIQUE COLLATE NOCASE, title TEXT NOT NULL, about TEXT NOT NULL DEFAULT '',
  owner_id INTEGER NOT NULL REFERENCES users(id), color INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS channel_subs (
  channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'sub', last_read_id INTEGER NOT NULL DEFAULT 0, joined_at INTEGER NOT NULL, PRIMARY KEY (channel_id, user_id));
CREATE TABLE IF NOT EXISTS channel_posts (
  id INTEGER PRIMARY KEY, channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE, author_id INTEGER NOT NULL REFERENCES users(id),
  body TEXT NOT NULL, created_at INTEGER NOT NULL, edited_at INTEGER);
CREATE INDEX IF NOT EXISTS idx_cposts ON channel_posts(channel_id, id);
CREATE TABLE IF NOT EXISTS channel_views (post_id INTEGER NOT NULL REFERENCES channel_posts(id) ON DELETE CASCADE, user_id INTEGER NOT NULL, PRIMARY KEY (post_id, user_id));
CREATE TABLE IF NOT EXISTS channel_reactions (post_id INTEGER NOT NULL REFERENCES channel_posts(id) ON DELETE CASCADE, user_id INTEGER NOT NULL, emoji TEXT NOT NULL, PRIMARY KEY (post_id, user_id));
CREATE TABLE IF NOT EXISTS channel_files (id TEXT PRIMARY KEY, channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE, mime TEXT NOT NULL, size INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS channel_comments (id INTEGER PRIMARY KEY, post_id INTEGER NOT NULL REFERENCES channel_posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, text TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_ccomments_post ON channel_comments(post_id, id);`);
if (!new Set(db.prepare('PRAGMA table_info(channels)').all().map((c) => c.name)).has('no_comments')) db.exec('ALTER TABLE channels ADD COLUMN no_comments INTEGER NOT NULL DEFAULT 0');
const cq = {
  byId: db.prepare('SELECT * FROM channels WHERE id = ?'),
  bySlug: db.prepare('SELECT * FROM channels WHERE slug = ?'),
  insert: db.prepare('INSERT INTO channels (slug, title, about, owner_id, color, created_at) VALUES (?, ?, ?, ?, ?, ?)'),
  sub: db.prepare('SELECT * FROM channel_subs WHERE channel_id = ? AND user_id = ?'),
  addSub: db.prepare("INSERT OR IGNORE INTO channel_subs (channel_id, user_id, role, joined_at, last_read_id) VALUES (?, ?, ?, ?, ?)"),
  delSub: db.prepare('DELETE FROM channel_subs WHERE channel_id = ? AND user_id = ?'),
  subCount: db.prepare('SELECT COUNT(*) AS n FROM channel_subs WHERE channel_id = ?'),
  subIds: db.prepare('SELECT user_id FROM channel_subs WHERE channel_id = ?'),
  mine: db.prepare(`SELECT c.*, s.role, s.last_read_id,
      (SELECT MAX(id) FROM channel_posts WHERE channel_id = c.id) AS last_id,
      (SELECT COUNT(*) FROM channel_posts WHERE channel_id = c.id AND id > s.last_read_id AND author_id != s.user_id) AS unread
    FROM channel_subs s JOIN channels c ON c.id = s.channel_id WHERE s.user_id = ?`),
  search: db.prepare(`SELECT * FROM channels WHERE (title LIKE ? ESCAPE '\\' OR slug LIKE ? ESCAPE '\\') ORDER BY
      (SELECT COUNT(*) FROM channel_subs WHERE channel_id = channels.id) DESC LIMIT 20`),
  post: db.prepare('SELECT * FROM channel_posts WHERE id = ?'),
  postsBefore: db.prepare('SELECT * FROM channel_posts WHERE channel_id = ? AND id < ? ORDER BY id DESC LIMIT ?'),
  addPost: db.prepare('INSERT INTO channel_posts (channel_id, author_id, body, created_at) VALUES (?, ?, ?, ?)'),
  editPost: db.prepare('UPDATE channel_posts SET body = ?, edited_at = ? WHERE id = ?'),
  delPost: db.prepare('DELETE FROM channel_posts WHERE id = ?'),
  view: db.prepare('INSERT OR IGNORE INTO channel_views (post_id, user_id) VALUES (?, ?)'),
  views: db.prepare('SELECT COUNT(*) AS n FROM channel_views WHERE post_id = ?'),
  setRead: db.prepare('UPDATE channel_subs SET last_read_id = MAX(last_read_id, ?) WHERE channel_id = ? AND user_id = ?'),
};
const SLUG_RE = /^[a-zA-Z][a-zA-Z0-9_]{3,31}$/;
function postView(p, userId) {
  const author = q.userById.get(p.author_id);
  const rx = db.prepare('SELECT emoji, user_id FROM channel_reactions WHERE post_id = ? ORDER BY rowid').all(p.id);
  const map = new Map();
  for (const r of rx) { if (!map.has(r.emoji)) map.set(r.emoji, []); map.get(r.emoji).push(r.user_id); }
  return { id: p.id, channelId: p.channel_id, author: author ? { id: author.id, displayName: author.display_name } : null,
    body: JSON.parse(p.body), createdAt: p.created_at, editedAt: p.edited_at || null, views: cq.views.get(p.id).n,
    reactions: [...map].map(([emoji, users]) => ({ emoji, count: users.length, mine: users.includes(userId) })),
    comments: db.prepare('SELECT COUNT(*) AS n FROM channel_comments WHERE post_id = ?').get(p.id).n };
}
function channelView(c, userId) {
  const sub = cq.sub.get(c.id, userId);
  const lastId = c.last_id ?? db.prepare('SELECT MAX(id) AS m FROM channel_posts WHERE channel_id = ?').get(c.id).m;
  const last = lastId ? cq.post.get(lastId) : null;
  return { id: c.id, slug: c.slug, title: c.title, about: c.about, color: c.color, createdAt: c.created_at,
    subscribers: cq.subCount.get(c.id).n, role: sub?.role || null, subscribed: !!sub, comments: !c.no_comments,
    unread: c.unread ?? 0, lastPost: last ? postView(last, userId) : null };
}
function canPost(channelId, userId) { const s = cq.sub.get(channelId, userId); return s && (s.role === 'owner' || s.role === 'admin'); }
function chBroadcast(channelId, data) { for (const { user_id } of cq.subIds.all(channelId)) sendTo(user_id, data); }
function chGet(req, res) {
  const c = cq.byId.get(Number(req.params.id));
  if (!c) { fail(res, 404, 'Канал не найден'); return null; }
  return c;
}
function cleanPost(b) {
  const text = String(b?.text || '').replace(/\u0000/g, '').slice(0, 8000).trim();
  let image = null;
  if (b?.image && /^[a-f0-9]{32}$/.test(String(b.image.id || ''))) image = { id: b.image.id, w: Number(b.image.w) || 0, h: Number(b.image.h) || 0 };
  return { text, image };
}

app.post('/api/channels', auth, json, (req, res) => {
  const title = cleanName(req.body?.title);
  const slug = String(req.body?.slug || '').trim().replace(/^@/, '');
  if (!title) return fail(res, 400, 'Укажите название канала');
  if (!SLUG_RE.test(slug)) return fail(res, 400, 'Адрес: 4–32 символа, латиница, цифры и _, начинается с буквы');
  if (cq.bySlug.get(slug)) return fail(res, 409, 'Этот адрес уже занят');
  const about = String(req.body?.about || '').slice(0, 400).trim();
  const id = cq.insert.run(slug, title, about, req.user.id, crypto.randomInt(0, 8), now()).lastInsertRowid;
  cq.addSub.run(id, req.user.id, 'owner', now(), 0);
  res.json({ channel: channelView(cq.byId.get(id), req.user.id) });
});
app.get('/api/channels', auth, (req, res) => res.json({ channels: cq.mine.all(req.user.id).map((c) => channelView(c, req.user.id)) }));
app.get('/api/channels/search', auth, (req, res) => {
  const s = String(req.query.q || '').trim().replace(/^@/, '');
  if (s.length < 2) return res.json({ channels: [] });
  const like = '%' + s.replace(/[\\%_]/g, (x) => '\\' + x) + '%';
  res.json({ channels: cq.search.all(like, like).map((c) => channelView(c, req.user.id)) });
});
app.get('/api/channels/by-slug/:slug', auth, (req, res) => {
  const c = cq.bySlug.get(String(req.params.slug));
  if (!c) return fail(res, 404, 'Канал не найден');
  res.json({ channel: channelView(c, req.user.id) });
});
app.patch('/api/channels/:id', auth, json, (req, res) => {
  const c = chGet(req, res); if (!c) return;
  if (c.owner_id !== req.user.id) return fail(res, 403, 'Менять канал может только владелец');
  const title = req.body?.title !== undefined ? cleanName(req.body.title) : c.title;
  const about = req.body?.about !== undefined ? String(req.body.about).slice(0, 400).trim() : c.about;
  if (!title) return fail(res, 400, 'Название не может быть пустым');
  db.prepare('UPDATE channels SET title = ?, about = ? WHERE id = ?').run(title, about, c.id);
  if (req.body?.comments !== undefined) db.prepare('UPDATE channels SET no_comments = ? WHERE id = ?').run(req.body.comments ? 0 : 1, c.id);
  const v = channelView(cq.byId.get(c.id), req.user.id);
  chBroadcast(c.id, { type: 'channel', channelId: c.id });
  res.json({ channel: v });
});
app.post('/api/channels/:id/join', auth, (req, res) => {
  const c = chGet(req, res); if (!c) return;
  const last = db.prepare('SELECT MAX(id) AS m FROM channel_posts WHERE channel_id = ?').get(c.id).m || 0;
  cq.addSub.run(c.id, req.user.id, 'sub', now(), last);
  res.json({ channel: channelView(cq.byId.get(c.id), req.user.id) });
});
app.post('/api/channels/:id/leave', auth, (req, res) => {
  const c = chGet(req, res); if (!c) return;
  if (c.owner_id === req.user.id) return fail(res, 400, 'Владелец не может отписаться. Удалите канал или передайте его.');
  cq.delSub.run(c.id, req.user.id);
  res.json({ ok: true });
});
app.delete('/api/channels/:id', auth, (req, res) => {
  const c = chGet(req, res); if (!c) return;
  if (c.owner_id !== req.user.id) return fail(res, 403, 'Удалить канал может только владелец');
  removeChannel(c);
  res.json({ ok: true });
});
function removeChannel(c) {
  const subs = cq.subIds.all(c.id);
  for (const f of db.prepare('SELECT id FROM channel_files WHERE channel_id = ?').all(c.id)) { try { fs.unlinkSync(path.join(CH_FILES, f.id)); } catch { /* нет */ } }
  db.prepare('DELETE FROM channels WHERE id = ?').run(c.id);
  for (const { user_id } of subs) sendTo(user_id, { type: 'channelRemoved', channelId: c.id });
}
app.get('/api/channels/:id/posts', auth, (req, res) => {
  const c = chGet(req, res); if (!c) return;
  const before = Number(req.query.before) || Number.MAX_SAFE_INTEGER;
  const rows = cq.postsBefore.all(c.id, before, 30).reverse();
  for (const r of rows) cq.view.run(r.id, req.user.id);
  res.json({ posts: rows.map((r) => postView(r, req.user.id)), hasMore: rows.length === 30 });
});
app.post('/api/channels/:id/posts', auth, json, (req, res) => {
  const c = chGet(req, res); if (!c) return;
  if (!canPost(c.id, req.user.id)) return fail(res, 403, 'Публиковать могут только владелец и админы');
  const body = cleanPost(req.body);
  if (!body.text && !body.image) return fail(res, 400, 'Пустая публикация');
  if (body.image && !db.prepare('SELECT 1 FROM channel_files WHERE id = ? AND channel_id = ?').get(body.image.id, c.id)) return fail(res, 400, 'Картинка не найдена');
  const id = cq.addPost.run(c.id, req.user.id, JSON.stringify(body), now()).lastInsertRowid;
  cq.view.run(id, req.user.id);
  cq.setRead.run(id, c.id, req.user.id);
  const post = postView(cq.post.get(id), req.user.id);
  chBroadcast(c.id, { type: 'channelPost', channelId: c.id, post });
  for (const { user_id } of cq.subIds.all(c.id)) if (user_id !== req.user.id) pushTo(user_id, { title: c.title, body: body.text ? body.text.slice(0, 140) : '📷 Фото', tag: 'ch-' + c.id, url: '/c/' + c.slug });
  res.json({ post });
});
app.patch('/api/channels/:id/posts/:pid', auth, json, (req, res) => {
  const c = chGet(req, res); if (!c) return;
  const p = cq.post.get(Number(req.params.pid));
  if (!p || p.channel_id !== c.id) return fail(res, 404, 'Публикация не найдена');
  if (!canPost(c.id, req.user.id)) return fail(res, 403, 'Нет прав');
  const old = JSON.parse(p.body);
  const body = { ...old, text: String(req.body?.text || '').slice(0, 8000).trim() };
  if (!body.text && !body.image) return fail(res, 400, 'Пустая публикация');
  cq.editPost.run(JSON.stringify(body), now(), p.id);
  chBroadcast(c.id, { type: 'channelPostUpdated', channelId: c.id, postId: p.id });
  res.json({ post: postView(cq.post.get(p.id), req.user.id) });
});
app.delete('/api/channels/:id/posts/:pid', auth, (req, res) => {
  const c = chGet(req, res); if (!c) return;
  const p = cq.post.get(Number(req.params.pid));
  if (!p || p.channel_id !== c.id) return fail(res, 404, 'Публикация не найдена');
  if (!canPost(c.id, req.user.id)) return fail(res, 403, 'Нет прав');
  cq.delPost.run(p.id);
  chBroadcast(c.id, { type: 'channelPostDeleted', channelId: c.id, postId: p.id });
  res.json({ ok: true });
});
/* Комментарии к публикациям (каналы не шифруются, комментарии тоже) */
app.get('/api/channels/:id/posts/:pid/comments', auth, (req, res) => {
  const c = chGet(req, res); if (!c) return;
  const p = cq.post.get(Number(req.params.pid));
  if (!p || p.channel_id !== c.id) return fail(res, 404, 'Публикация не найдена');
  const rows = db.prepare('SELECT * FROM channel_comments WHERE post_id = ? ORDER BY id LIMIT 500').all(p.id);
  res.json({ enabled: !c.no_comments, comments: rows.map((r) => { const u = q.userById.get(r.user_id); return { id: r.id, text: r.text, createdAt: r.created_at, user: u ? publicUser(u) : null,
    canDelete: r.user_id === req.user.id || canPost(c.id, req.user.id) }; }) });
});
app.post('/api/channels/:id/posts/:pid/comments', auth, json, (req, res) => {
  const c = chGet(req, res); if (!c) return;
  const p = cq.post.get(Number(req.params.pid));
  if (!p || p.channel_id !== c.id) return fail(res, 404, 'Публикация не найдена');
  if (c.no_comments) return fail(res, 403, 'Комментарии в канале выключены');
  if (!cq.sub.get(c.id, req.user.id)) return fail(res, 403, 'Подпишитесь на канал, чтобы комментировать');
  if (rateLimited('comment:' + req.user.id, 30, 60000)) return fail(res, 429, 'Слишком часто');
  const text = String(req.body?.text || '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim().slice(0, 2000);
  if (!text) return fail(res, 400, 'Пустой комментарий');
  db.prepare('INSERT INTO channel_comments (post_id, user_id, text, created_at) VALUES (?, ?, ?, ?)').run(p.id, req.user.id, text, now());
  chBroadcast(c.id, { type: 'channelComments', channelId: c.id, postId: p.id });
  if (p.author_id !== req.user.id) pushTo(p.author_id, { title: c.title, body: `${req.user.display_name} прокомментировал(а) публикацию`, tag: 'ch-' + c.id, url: '/c/' + c.slug });
  res.json({ ok: true });
});
app.delete('/api/channel-comments/:id', auth, (req, res) => {
  const r = db.prepare('SELECT cc.*, cp.channel_id FROM channel_comments cc JOIN channel_posts cp ON cp.id = cc.post_id WHERE cc.id = ?').get(Number(req.params.id));
  if (!r || (r.user_id !== req.user.id && !canPost(r.channel_id, req.user.id))) return fail(res, 404, 'Комментарий не найден');
  db.prepare('DELETE FROM channel_comments WHERE id = ?').run(r.id);
  chBroadcast(r.channel_id, { type: 'channelComments', channelId: r.channel_id, postId: r.post_id });
  res.json({ ok: true });
});

app.post('/api/channels/:id/posts/:pid/react', auth, json, (req, res) => {
  const c = chGet(req, res); if (!c) return;
  const p = cq.post.get(Number(req.params.pid));
  if (!p || p.channel_id !== c.id || !cq.sub.get(c.id, req.user.id)) return fail(res, 404, 'Публикация не найдена');
  const emoji = String(req.body?.emoji || '');
  if (!REACTIONS.includes(emoji)) return fail(res, 400, 'Такой реакции нет');
  const cur = db.prepare('SELECT emoji FROM channel_reactions WHERE post_id = ? AND user_id = ?').get(p.id, req.user.id)?.emoji;
  if (cur === emoji) db.prepare('DELETE FROM channel_reactions WHERE post_id = ? AND user_id = ?').run(p.id, req.user.id);
  else db.prepare('INSERT INTO channel_reactions (post_id, user_id, emoji) VALUES (?, ?, ?) ON CONFLICT(post_id, user_id) DO UPDATE SET emoji = excluded.emoji').run(p.id, req.user.id, emoji);
  chBroadcast(c.id, { type: 'channelPostUpdated', channelId: c.id, postId: p.id });
  res.json({ post: postView(cq.post.get(p.id), req.user.id) });
});
app.get('/api/channels/:id/posts/:pid', auth, (req, res) => {
  const c = chGet(req, res); if (!c) return;
  const p = cq.post.get(Number(req.params.pid));
  if (!p || p.channel_id !== c.id) return fail(res, 404, 'Публикация не найдена');
  res.json({ post: postView(p, req.user.id) });
});
app.post('/api/channels/:id/read', auth, json, (req, res) => {
  const c = chGet(req, res); if (!c) return;
  const upto = Number(req.body?.postId) || 0;
  const sub = cq.sub.get(c.id, req.user.id);
  if (sub) {
    for (const r of db.prepare('SELECT id FROM channel_posts WHERE channel_id = ? AND id > ? AND id <= ? ORDER BY id DESC LIMIT 200').all(c.id, sub.last_read_id, upto)) cq.view.run(r.id, req.user.id);
  }
  cq.setRead.run(upto, c.id, req.user.id);
  res.json({ ok: true });
});
app.post('/api/channels/:id/files', auth, express.raw({ type: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], limit: '10mb' }), (req, res) => {
  const c = chGet(req, res); if (!c) return;
  if (!canPost(c.id, req.user.id)) return fail(res, 403, 'Нет прав');
  if (!Buffer.isBuffer(req.body) || req.body.length < 50) return fail(res, 400, 'Пустой файл');
  const id = crypto.randomBytes(16).toString('hex');
  fs.writeFileSync(path.join(CH_FILES, id), req.body);
  db.prepare('INSERT INTO channel_files (id, channel_id, mime, size) VALUES (?, ?, ?, ?)').run(id, c.id, req.headers['content-type'], req.body.length);
  res.json({ id });
});
app.get('/api/channel-files/:id', auth, (req, res) => {
  const f = db.prepare('SELECT * FROM channel_files WHERE id = ?').get(String(req.params.id));
  if (!f) return fail(res, 404, 'Нет файла');
  res.setHeader('Content-Type', f.mime);
  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
  fs.createReadStream(path.join(CH_FILES, f.id)).pipe(res);
});

/* ---------- Звёзды и подарки ---------- */
const GIFTS = [
  { id: 'heart', name: 'Сердце', price: 15, upgrade: 25 },
  { id: 'star', name: 'Звезда', price: 25, upgrade: 25 },
  { id: 'flower', name: 'Цветок', price: 50, upgrade: 50 },
  { id: 'cake', name: 'Торт', price: 50, upgrade: 50 },
  { id: 'box', name: 'Подарок', price: 100, upgrade: 50 },
  { id: 'cat', name: 'Кот', price: 150, upgrade: 75, supply: 5000 },
  { id: 'rocket', name: 'Ракета', price: 250, upgrade: 100, supply: 2000 },
  { id: 'trophy', name: 'Кубок', price: 350, upgrade: 100, supply: 1000 },
  { id: 'gem', name: 'Алмаз', price: 500, upgrade: 150, supply: 500 },
  { id: 'crown', name: 'Корона', price: 1000, upgrade: 250, supply: 100 },
];
const GIFT_BY_ID = new Map(GIFTS.map((g) => [g.id, g]));
// Вес — в промилле: 5 → 0,5 %
const MODELS = [['Изумруд', 300], ['Мята', 250], ['Сапфир', 180], ['Рубин', 120], ['Аметист', 80], ['Золото', 50], ['Неон', 15], ['Полночь', 5]];
const BACKDROPS = [['Лес', 260], ['Океан', 220], ['Закат', 180], ['Графит', 150], ['Сирень', 110], ['Песок', 50], ['Изумрудная ночь', 25], ['Северное сияние', 5]];
const SYMBOLS = [['Звёзды', 260], ['Листья', 220], ['Сердца', 180], ['Молнии', 150], ['Искры', 110], ['Луны', 50], ['Короны', 25], ['Ключи', 5]];
const START_STARS = 500, DAILY_STARS = 50, DAILY_EVERY = 20 * 3600 * 1000;
{
  const cols = new Set(db.prepare('PRAGMA table_info(users)').all().map((c) => c.name));
  if (!cols.has('stars')) db.exec(`ALTER TABLE users ADD COLUMN stars INTEGER NOT NULL DEFAULT ${START_STARS}`);
  if (!cols.has('bonus_at')) db.exec('ALTER TABLE users ADD COLUMN bonus_at INTEGER NOT NULL DEFAULT 0');
  db.exec(`CREATE TABLE IF NOT EXISTS gifts (
    id INTEGER PRIMARY KEY,
    type TEXT NOT NULL,
    sender_id INTEGER REFERENCES users(id),
    owner_id INTEGER NOT NULL REFERENCES users(id),
    created_at INTEGER NOT NULL,
    upgraded_at INTEGER, serial INTEGER, model TEXT, backdrop TEXT, symbol TEXT,
    hidden INTEGER NOT NULL DEFAULT 0, converted INTEGER NOT NULL DEFAULT 0);
  CREATE INDEX IF NOT EXISTS idx_gifts_owner ON gifts(owner_id);
  CREATE TABLE IF NOT EXISTS star_log (
    id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, reason TEXT NOT NULL, created_at INTEGER NOT NULL);`);
}
const gq = {
  stars: db.prepare('SELECT stars, bonus_at FROM users WHERE id = ?'),
  addStars: db.prepare('UPDATE users SET stars = stars + ? WHERE id = ?'),
  setBonus: db.prepare('UPDATE users SET bonus_at = ? WHERE id = ?'),
  log: db.prepare('INSERT INTO star_log (user_id, amount, reason, created_at) VALUES (?, ?, ?, ?)'),
  history: db.prepare('SELECT amount, reason, created_at FROM star_log WHERE user_id = ? ORDER BY id DESC LIMIT 30'),
  sold: db.prepare('SELECT type, COUNT(*) AS n FROM gifts GROUP BY type'),
  soldOf: db.prepare('SELECT COUNT(*) AS n FROM gifts WHERE type = ?'),
  upgradedOf: db.prepare('SELECT COUNT(*) AS n FROM gifts WHERE type = ? AND upgraded_at IS NOT NULL'),
  insert: db.prepare('INSERT INTO gifts (type, sender_id, owner_id, created_at) VALUES (?, ?, ?, ?)'),
  byId: db.prepare('SELECT * FROM gifts WHERE id = ?'),
  ofUser: db.prepare('SELECT * FROM gifts WHERE owner_id = ? AND converted = 0 ORDER BY COALESCE(upgraded_at, 0) DESC, id DESC LIMIT 200'),
  upgrade: db.prepare('UPDATE gifts SET upgraded_at = ?, serial = ?, model = ?, backdrop = ?, symbol = ? WHERE id = ?'),
  convert: db.prepare('UPDATE gifts SET converted = 1 WHERE id = ?'),
  transfer: db.prepare('UPDATE gifts SET owner_id = ?, hidden = 0 WHERE id = ?'),
  hide: db.prepare('UPDATE gifts SET hidden = ? WHERE id = ?'),
};
const rarityOf = (list, name) => { const r = list.find((x) => x[0] === name); return r ? r[1] / 10 : null; };
function pickWeighted(list) {
  let r = crypto.randomInt(0, list.reduce((s, x) => s + x[1], 0));
  for (const [name, w] of list) { if (r < w) return name; r -= w; }
  return list[0][0];
}
function spend(userId, amount, reason) {
  const row = gq.stars.get(userId);
  if (!row || row.stars < amount) { const e = new Error('Не хватает звёзд'); e.status = 402; throw e; }
  gq.addStars.run(-amount, userId);
  gq.log.run(userId, -amount, reason, now());
}
function earn(userId, amount, reason) { gq.addStars.run(amount, userId); gq.log.run(userId, amount, reason, now()); }
function wallet(userId) {
  const r = gq.stars.get(userId);
  const next = r.bonus_at + DAILY_EVERY;
  return { stars: r.stars, daily: DAILY_STARS, canClaim: now() >= next, nextClaimAt: next };
}
function giftView(g) {
  const t = GIFT_BY_ID.get(g.type);
  const sender = g.sender_id ? q.userById.get(g.sender_id) : null;
  const owner = q.userById.get(g.owner_id);
  return {
    id: g.id, type: g.type, name: t?.name || g.type, createdAt: g.created_at,
    sender: sender ? publicUser(sender) : null, owner: owner ? publicUser(owner) : null,
    upgraded: !!g.upgraded_at, upgradedAt: g.upgraded_at || null, serial: g.serial || null, supply: t?.supply || null,
    model: g.model ? { name: g.model, rarity: rarityOf(MODELS, g.model) } : null,
    backdrop: g.backdrop ? { name: g.backdrop, rarity: rarityOf(BACKDROPS, g.backdrop) } : null,
    symbol: g.symbol ? { name: g.symbol, rarity: rarityOf(SYMBOLS, g.symbol) } : null,
    hidden: !!g.hidden, converted: !!g.converted,
    price: t?.price || 0, upgradePrice: t?.upgrade || 0, convertValue: Math.floor((t?.price || 0) * 0.85),
  };
}
function walletPush(userId) { sendTo(userId, { type: 'wallet', wallet: wallet(userId) }); }
function directChatId(a, b) {
  const ids = [a, b].sort((x, y) => x - y);
  const key = ids.join(':');
  let chat = q.chatByDirectKey.get(key);
  if (!chat) {
    const info = q.insertChat.run('direct', null, key, a, now());
    for (const id of new Set(ids)) q.insertMember.run(info.lastInsertRowid, id, now());
    chat = q.chatById.get(info.lastInsertRowid);
  }
  return chat.id;
}
function giftMessage(chatId, senderId, giftId, type, action) {
  const info = q.insertMessage.run(chatId, senderId, 'gift', JSON.stringify({ giftId, type, action }), now());
  return q.messageById.get(info.lastInsertRowid);
}
function deliver(chatId, msgRow) {
  const msg = messageView(msgRow);
  for (const { user_id } of q.memberIds.all(chatId)) {
    const c = fullChat(chatId, user_id);
    if (c) sendTo(user_id, { type: 'chat', chat: c });
    sendTo(user_id, { type: 'message', message: msg });
  }
  return msg;
}
const giftFail = (res, e) => (e.status ? fail(res, e.status, e.message) : (console.error(e), fail(res, 500, 'Ошибка сервера')));

app.get('/api/gifts/catalog', auth, (req, res) => {
  const sold = new Map(gq.sold.all().map((r) => [r.type, r.n]));
  res.json({
    gifts: GIFTS.map((g) => ({ ...g, sold: sold.get(g.id) || 0, left: g.supply ? Math.max(0, g.supply - (sold.get(g.id) || 0)) : null })),
    models: MODELS.map(([n, w]) => ({ name: n, rarity: w / 10 })), backdrops: BACKDROPS.map(([n, w]) => ({ name: n, rarity: w / 10 })),
    symbols: SYMBOLS.map(([n, w]) => ({ name: n, rarity: w / 10 })),
  });
});
app.get('/api/wallet', auth, (req, res) => res.json({ ...wallet(req.user.id), history: gq.history.all(req.user.id) }));
app.post('/api/wallet/daily', auth, (req, res) => {
  const w = wallet(req.user.id);
  if (!w.canClaim) return fail(res, 429, 'Бонус уже получен, загляните позже');
  db.transaction(() => { earn(req.user.id, DAILY_STARS, 'Ежедневный бонус'); gq.setBonus.run(now(), req.user.id); })();
  res.json(wallet(req.user.id));
});
app.post('/api/gifts/send', auth, json, (req, res) => {
  if (rateLimited('gift:' + req.user.id, 60)) return fail(res, 429, 'Слишком часто, подождите');
  const t = GIFT_BY_ID.get(String(req.body?.type || ''));
  const to = q.userById.get(Number(req.body?.userId));
  if (!t) return fail(res, 400, 'Такого подарка нет');
  if (!to) return fail(res, 404, 'Пользователь не найден');
  if (to.id === req.user.id) return fail(res, 400, 'Себе подарок отправить нельзя');
  if (blockState(req.user.id, to.id)) return fail(res, 403, 'Нельзя: пользователь заблокирован');
  let giftId, chatId, msgRow;
  try {
    db.transaction(() => {
      if (t.supply && gq.soldOf.get(t.id).n >= t.supply) { const e = new Error('Этот подарок закончился'); e.status = 409; throw e; }
      spend(req.user.id, t.price, `Подарок «${t.name}» для ${to.display_name}`);
      giftId = gq.insert.run(t.id, req.user.id, to.id, now()).lastInsertRowid;
      chatId = directChatId(req.user.id, to.id);
      msgRow = giftMessage(chatId, req.user.id, giftId, t.id, 'sent');
    })();
  } catch (e) { return giftFail(res, e); }
  const message = deliver(chatId, msgRow);
  pushMessage(chatId, req.user.id, `🎁 Подарок «${t.name}»`);
  walletPush(req.user.id);
  res.json({ gift: giftView(gq.byId.get(giftId)), chatId, message, wallet: wallet(req.user.id) });
});
app.get('/api/users/:id/gifts', auth, (req, res) => {
  const id = Number(req.params.id);
  const mine = id === req.user.id;
  res.json({ gifts: gq.ofUser.all(id).filter((g) => mine || !g.hidden).map(giftView) });
});
app.get('/api/gifts/:id', auth, (req, res) => {
  const g = gq.byId.get(Number(req.params.id));
  if (!g || (g.hidden && g.owner_id !== req.user.id && g.sender_id !== req.user.id)) return fail(res, 404, 'Подарок не найден');
  res.json({ gift: giftView(g) });
});
function ownGift(req, res) {
  const g = gq.byId.get(Number(req.params.id));
  if (!g || g.owner_id !== req.user.id || g.converted) { fail(res, 404, 'Подарок не найден'); return null; }
  return g;
}
app.post('/api/gifts/:id/upgrade', auth, (req, res) => {
  const g = ownGift(req, res); if (!g) return;
  if (g.upgraded_at) return fail(res, 400, 'Подарок уже коллекционный');
  const t = GIFT_BY_ID.get(g.type);
  try {
    db.transaction(() => {
      spend(req.user.id, t.upgrade, `Улучшение «${t.name}»`);
      gq.upgrade.run(now(), gq.upgradedOf.get(g.type).n + 1, pickWeighted(MODELS), pickWeighted(BACKDROPS), pickWeighted(SYMBOLS), g.id);
    })();
  } catch (e) { return giftFail(res, e); }
  walletPush(req.user.id);
  res.json({ gift: giftView(gq.byId.get(g.id)), wallet: wallet(req.user.id) });
});
app.post('/api/gifts/:id/convert', auth, (req, res) => {
  const g = ownGift(req, res); if (!g) return;
  if (g.upgraded_at) return fail(res, 400, 'Коллекционный подарок нельзя обменять');
  const v = giftView(g);
  db.transaction(() => { gq.convert.run(g.id); earn(req.user.id, v.convertValue, `Обмен подарка «${v.name}»`); })();
  walletPush(req.user.id);
  res.json({ ok: true, wallet: wallet(req.user.id) });
});
app.post('/api/gifts/:id/transfer', auth, json, (req, res) => {
  const g = ownGift(req, res); if (!g) return;
  if (!g.upgraded_at) return fail(res, 400, 'Передавать можно только коллекционные подарки — сначала улучшите его');
  const to = q.userById.get(Number(req.body?.userId));
  if (!to || to.id === req.user.id) return fail(res, 400, 'Выберите получателя');
  let chatId, msgRow;
  db.transaction(() => {
    gq.transfer.run(to.id, g.id);
    chatId = directChatId(req.user.id, to.id);
    msgRow = giftMessage(chatId, req.user.id, g.id, g.type, 'transfer');
  })();
  deliver(chatId, msgRow);
  res.json({ gift: giftView(gq.byId.get(g.id)), chatId });
});
app.post('/api/gifts/:id/hide', auth, json, (req, res) => {
  const g = ownGift(req, res); if (!g) return;
  gq.hide.run(req.body?.hidden ? 1 : 0, g.id);
  res.json({ gift: giftView(gq.byId.get(g.id)) });
});

app.use('/api', (err, req, res, next) => {
  if (err.type === 'entity.too.large') return fail(res, 413, 'Файл слишком большой');
  console.error(err);
  fail(res, 500, 'Ошибка сервера');
});

/* Подтверждение для приложения Android (Trusted Web Activity) — тогда оно открывается без адресной строки */
app.get('/.well-known/assetlinks.json', (req, res) => {
  const prints = String(process.env.ANDROID_SHA256 || '').split(',').map((x) => x.replace(/[^a-f0-9]/gi, '').toUpperCase())
    .filter((x) => x.length === 64).map((x) => x.match(/../g).join(':'));
  res.json(prints.length ? [{ relation: ['delegate_permission/common.handle_all_urls'],
    target: { namespace: 'android_app', package_name: process.env.ANDROID_PACKAGE || 'ru.tiho.app', sha256_cert_fingerprints: prints } }] : []);
});

app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html', maxAge: '1h' }));
app.get(/^\/(?!api|ws).*/, (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

/* ---------- Групповые звонки: каждый соединяется с каждым (mesh), сервер только передаёт сигналы ---------- */
const rooms = new Map(); // chatId -> { id, kind, startedAt, by, maxPeers, peers: Map<userId, {ws, muted, video, screen, joinedAt}> }
const GC_MAX = 10;
const peerState = (p) => ({ muted: p.muted, video: p.video, screen: p.screen });
const roomView = (r) => (r ? { id: r.id, kind: r.kind, startedAt: r.startedAt, count: r.peers.size, peers: [...r.peers.keys()] } : null);
function roomBroadcast(chatId, data, except) { for (const { user_id } of q.memberIds.all(chatId)) if (user_id !== except) sendTo(user_id, data); }
const sendWs = (ws, data) => { if (ws?.readyState === 1) ws.send(JSON.stringify(data)); };
function leaveRoom(chatId, userId) {
  const r = rooms.get(chatId);
  if (!r || !r.peers.has(userId)) return;
  r.peers.delete(userId);
  for (const p of r.peers.values()) sendWs(p.ws, { type: 'gcall', action: 'peerLeft', chatId, userId });
  if (!r.peers.size) {
    rooms.delete(chatId);
    if (q.chatById.get(chatId)) {
      const duration = Math.round((now() - r.startedAt) / 1000);
      const info = q.insertMessage.run(chatId, r.by, 'call', JSON.stringify({ kind: r.kind, status: 'ended', duration, group: true, count: r.maxPeers }), now());
      const msg = messageView(q.messageById.get(info.lastInsertRowid));
      roomBroadcast(chatId, { type: 'message', message: msg });
    }
  }
  roomBroadcast(chatId, { type: 'gcall', action: 'room', chatId, room: roomView(rooms.get(chatId)) });
}
function handleGroupCall(user, m, ws) {
  const chatId = Number(m.chatId);
  const chat = q.chatById.get(chatId);
  if (!chat || chat.type !== 'group' || !q.isMember.get(chatId, user.id)) return;
  let r = rooms.get(chatId);
  if (m.action === 'join') {
    for (const [cid, other] of rooms) if (cid !== chatId && other.peers.has(user.id)) leaveRoom(cid, user.id);
    if (r?.peers.has(user.id)) leaveRoom(chatId, user.id), r = rooms.get(chatId);
    if (r && r.peers.size >= GC_MAX) return sendWs(ws, { type: 'gcall', action: 'full', chatId });
    const isNew = !r;
    if (!r) { r = { id: crypto.randomUUID(), kind: m.kind === 'video' ? 'video' : 'audio', startedAt: now(), by: user.id, maxPeers: 0, peers: new Map() }; rooms.set(chatId, r); }
    const existing = [...r.peers].map(([id, p]) => ({ id, state: peerState(p) }));
    const me = { ws, muted: !!m.muted, video: !!m.video, screen: false, joinedAt: now() };
    r.peers.set(user.id, me);
    r.maxPeers = Math.max(r.maxPeers, r.peers.size);
    sendWs(ws, { type: 'gcall', action: 'joined', chatId, callId: r.id, startedAt: r.startedAt, kind: r.kind, peers: existing });
    for (const [id, p] of r.peers) if (id !== user.id) sendWs(p.ws, { type: 'gcall', action: 'peerJoined', chatId, userId: user.id, state: peerState(me) });
    roomBroadcast(chatId, { type: 'gcall', action: 'room', chatId, room: roomView(r) });
    if (isNew) {
      roomBroadcast(chatId, { type: 'gcall', action: 'started', chatId, by: user.id, byName: user.display_name, kind: r.kind }, user.id);
      for (const { user_id } of q.memberIds.all(chatId)) {
        if (user_id !== user.id) pushTo(user_id, { title: chat.title, body: `${user.display_name} начал(а) групповой ${r.kind === 'video' ? 'видеозвонок' : 'звонок'}`, tag: 'gcall-' + chatId, url: '/', chatId, urgent: true });
      }
    }
    return;
  }
  if (!r || r.peers.get(user.id)?.ws !== ws) return;
  if (m.action === 'leave') return leaveRoom(chatId, user.id);
  if (m.action === 'signal') {
    const to = r.peers.get(Number(m.to));
    const data = m.data && typeof m.data === 'object' ? m.data : null;
    if (to && data && JSON.stringify(data).length < 60000) sendWs(to.ws, { type: 'gcall', action: 'signal', chatId, from: user.id, data });
    return;
  }
  if (m.action === 'state') {
    const me = r.peers.get(user.id);
    Object.assign(me, { muted: !!m.muted, video: !!m.video, screen: !!m.screen });
    for (const [id, p] of r.peers) if (id !== user.id) sendWs(p.ws, { type: 'gcall', action: 'state', chatId, userId: user.id, state: peerState(me) });
  }
}

/* ---------- WebSocket ---------- */
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true, maxPayload: 96 * 1024 });
const online = new Map(); // userId -> Set<ws>

function sendTo(userId, data) {
  const set = online.get(userId);
  if (!set) return;
  const s = JSON.stringify(data);
  for (const ws of set) if (ws.readyState === 1) ws.send(s);
}
function announcePresence(userId, isOnline) {
  const lastSeen = now();
  if (!isOnline) db.prepare('UPDATE users SET last_seen = ? WHERE id = ?').run(lastSeen, userId);
  for (const { id } of q.contactIds.all(userId, userId)) sendTo(id, { type: 'presence', userId, online: isOnline, lastSeen });
}

server.on('upgrade', (req, socket, head) => {
  if (!req.url.startsWith('/ws')) return socket.destroy();
  const token = cookie.parse(req.headers.cookie || '').tiho_session;
  const user = token && q.sessionUser.get(sha256(token), now());
  if (!user) { socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n'); return socket.destroy(); }
  wss.handleUpgrade(req, socket, head, (ws) => {
    ws.userId = user.id;
    ws.sessionId = user.session_id;
    ws.isAlive = true;
    if (!online.has(user.id)) { online.set(user.id, new Set()); announcePresence(user.id, true); }
    online.get(user.id).add(ws);
    ws.on('pong', () => { ws.isAlive = true; });
    ws.on('message', (raw) => {
      let m; try { m = JSON.parse(raw); } catch { return; }
      if (m.type === 'call') return handleCallSignal(user, m);
      if (m.type === 'gcall') return handleGroupCall(user, m, ws);
      if (m.type === 'typing' && q.isMember.get(Number(m.chatId), user.id)) {
        for (const { user_id } of q.memberIds.all(Number(m.chatId))) {
          if (user_id !== user.id) sendTo(user_id, { type: 'typing', chatId: Number(m.chatId), userId: user.id });
        }
      }
    });
    ws.on('close', () => {
      for (const [cid, r] of rooms) if (r.peers.get(user.id)?.ws === ws) leaveRoom(cid, user.id);
      const set = online.get(user.id);
      if (!set) return;
      set.delete(ws);
      if (!set.size) {
        online.delete(user.id); announcePresence(user.id, false);
        for (const [cid, live] of liveCalls) if (live.caller === user.id || live.callee === user.id) {
          const other = live.caller === user.id ? live.callee : live.caller;
          sendTo(other, { type: 'call', from: user.id, callId: cid, action: 'end' });
          finishCall(cid, live.caller === user.id ? 'missed' : 'rejected');
        }
      }
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
