/* Минимальный service worker: позволяет установить «Тихо» как приложение
   и открывать оболочку без сети. Запросы к API не кешируются. */
const CACHE = 'tiho-v12';
const SHELL = ['/', '/index.html', '/app.css', '/app.js', '/crypto.js', '/gifts.js', '/stickers.js', '/manifest.json', '/icon.svg', '/icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api') || url.pathname.startsWith('/ws')) return;
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match('/index.html')))
  );
});

/* Push-уведомления: показываем, даже когда мессенджер закрыт */
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Тихо', {
    body: d.body || 'Новое сообщение', tag: d.tag || 'tiho', renotify: true,
    icon: '/icon-192.png', badge: '/icon-192.png', data: { url: d.url || '/' },
    vibrate: d.urgent ? [200, 100, 200, 100, 200] : [120],
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) if (new URL(c.url).origin === location.origin) { c.focus(); if (url !== '/') c.navigate(url); return; }
    return self.clients.openWindow(url);
  }));
});
