'use strict';
/*
 * Сквозное шифрование «Тихо» на WebCrypto.
 *
 * Ключ личности: ECDH P-256. Приватный ключ живёт только в браузере
 * (IndexedDB, неизвлекаемый). На сервере лежит лишь его копия, зашифрованная
 * ключом, выведенным из пароля (PBKDF2), — сервер пароля не получает:
 * для входа отправляется отдельный хеш, выведенный из того же пароля.
 *
 * Сообщение: случайный ключ AES-256-GCM шифрует содержимое; для каждого
 * участника этот ключ заворачивается ключом из
 * HKDF( ECDH(эфемерный, получатель) || ECDH(отправитель, получатель) ).
 * Вторая часть подтверждает, что сообщение написал владелец ключа отправителя.
 */
const TihoCrypto = (() => {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const subtle = crypto.subtle;
  const ECDH = { name: 'ECDH', namedCurve: 'P-256' };
  const PBKDF2_ITER = 310000;

  const b64 = (buf) => {
    const bytes = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  };
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const rand = (n) => crypto.getRandomValues(new Uint8Array(n));

  async function fromPassword(username, password) {
    const base = await subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = new Uint8Array(await subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode('tiho:v1:' + username.toLowerCase()), iterations: PBKDF2_ITER },
      base, 512));
    const auth = b64(bits.slice(0, 32));
    const kek = await subtle.importKey('raw', bits.slice(32), 'AES-GCM', false, ['encrypt', 'decrypt']);
    return { auth, kek };
  }

  async function createIdentity(kek) {
    const pair = await subtle.generateKey(ECDH, true, ['deriveBits']);
    const publicKey = b64(await subtle.exportKey('spki', pair.publicKey));
    const pkcs8 = await subtle.exportKey('pkcs8', pair.privateKey);
    const iv = rand(12);
    const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, kek, pkcs8);
    const privateKey = await subtle.importKey('pkcs8', pkcs8, ECDH, false, ['deriveBits']);
    return { publicKey, privateKey, backup: { iv: b64(iv), ct: b64(ct) } };
  }

  async function unlockIdentity(backup, kek) {
    const pkcs8 = await subtle.decrypt({ name: 'AES-GCM', iv: unb64(backup.iv) }, kek, unb64(backup.ct));
    return subtle.importKey('pkcs8', pkcs8, ECDH, false, ['deriveBits']);
  }

  const pubCache = new Map();
  async function importPub(spkiB64) {
    if (!pubCache.has(spkiB64)) pubCache.set(spkiB64, subtle.importKey('spki', unb64(spkiB64), ECDH, false, []));
    return pubCache.get(spkiB64);
  }
  async function ecdh(priv, pub) {
    return new Uint8Array(await subtle.deriveBits({ name: 'ECDH', public: pub }, priv, 256));
  }
  async function wrapKey(secretA, secretB, info) {
    const ikm = new Uint8Array(64);
    ikm.set(secretA, 0); ikm.set(secretB, 32);
    const hk = await subtle.importKey('raw', ikm, 'HKDF', false, ['deriveKey']);
    return subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: enc.encode(info) },
      hk, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  const ad = (chatId, senderId) => enc.encode(`tiho:v1:${chatId}:${senderId}`);
  const wrapInfo = (chatId, senderId, recipientId) => `tiho-wrap:v1:${chatId}:${senderId}:${recipientId}`;

  /* recipients: [{id, publicKey}] — включая самого отправителя */
  async function encryptMessage(payload, { chatId, senderId, senderPriv, recipients }) {
    const contentKey = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const raw = await subtle.exportKey('raw', contentKey);
    const iv = rand(12);
    const ct = await subtle.encrypt({ name: 'AES-GCM', iv, additionalData: ad(chatId, senderId) },
      contentKey, enc.encode(JSON.stringify(payload)));
    const eph = await subtle.generateKey(ECDH, true, ['deriveBits']);
    const epk = b64(await subtle.exportKey('spki', eph.publicKey));
    const keys = {};
    for (const r of recipients) {
      const pub = await importPub(r.publicKey);
      const k = await wrapKey(await ecdh(eph.privateKey, pub), await ecdh(senderPriv, pub), wrapInfo(chatId, senderId, r.id));
      const wiv = rand(12);
      keys[r.id] = { iv: b64(wiv), wk: b64(await subtle.encrypt({ name: 'AES-GCM', iv: wiv }, k, raw)) };
    }
    return { v: 1, iv: b64(iv), ct: b64(ct), epk, keys };
  }

  async function decryptMessage(env, { chatId, senderId, senderPublicKey, myId, myPriv }) {
    const entry = env.keys && env.keys[myId];
    if (!entry) throw new Error('no-key');
    const k = await wrapKey(
      await ecdh(myPriv, await importPub(env.epk)),
      await ecdh(myPriv, await importPub(senderPublicKey)),
      wrapInfo(chatId, senderId, myId));
    const raw = await subtle.decrypt({ name: 'AES-GCM', iv: unb64(entry.iv) }, k, unb64(entry.wk));
    const contentKey = await subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
    const pt = await subtle.decrypt({ name: 'AES-GCM', iv: unb64(env.iv), additionalData: ad(chatId, senderId) },
      contentKey, unb64(env.ct));
    return JSON.parse(dec.decode(pt));
  }

  async function encryptFile(buf) {
    const key = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
    const iv = rand(12);
    const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, key, buf);
    return { data: ct, key: b64(await subtle.exportKey('raw', key)), iv: b64(iv) };
  }
  async function decryptFile(buf, keyB64, ivB64) {
    const key = await subtle.importKey('raw', unb64(keyB64), 'AES-GCM', false, ['decrypt']);
    return subtle.decrypt({ name: 'AES-GCM', iv: unb64(ivB64) }, key, buf);
  }

  /* Код безопасности: 12 групп по 5 цифр, одинаковый у обоих собеседников */
  async function safetyCode(pubA, pubB) {
    const [x, y] = [pubA, pubB].sort();
    const h = new Uint8Array(await subtle.digest('SHA-512', enc.encode('tiho-safety:v1:' + x + ':' + y)));
    const groups = [];
    for (let i = 0; i < 12; i++) {
      let n = 0;
      for (let j = 0; j < 5; j++) n = (n * 256 + h[i * 5 + j]) % 100000;
      groups.push(String(n).padStart(5, '0'));
    }
    return groups;
  }

  /* Хранилище ключа в браузере (IndexedDB умеет хранить CryptoKey как есть) */
  function idb() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('tiho', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('keys');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async function saveKey(userId, privateKey, publicKey) {
    const d = await idb();
    return new Promise((res, rej) => {
      const tx = d.transaction('keys', 'readwrite');
      tx.objectStore('keys').put({ privateKey, publicKey }, 'u' + userId);
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  }
  async function loadKey(userId) {
    const d = await idb();
    return new Promise((res, rej) => {
      const r = d.transaction('keys').objectStore('keys').get('u' + userId);
      r.onsuccess = () => res(r.result || null); r.onerror = () => rej(r.error);
    });
  }
  async function clearKeys() {
    const d = await idb();
    return new Promise((res) => {
      const tx = d.transaction('keys', 'readwrite');
      tx.objectStore('keys').clear();
      tx.oncomplete = res; tx.onerror = res;
    });
  }

  return { fromPassword, createIdentity, unlockIdentity, encryptMessage, decryptMessage,
    encryptFile, decryptFile, safetyCode, saveKey, loadKey, clearKeys };
})();
