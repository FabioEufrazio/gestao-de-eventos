const CACHE_NAME = 'gestao-eventos-cache-v45';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/styles.css',
  './js/firebase-service.js',
  './js/store.js',
  './js/aba1-insumos.js',
  './js/aba2-servicos.js',
  './js/aba3-drinques.js',
  './js/aba4-clientes.js',
  './js/aba5-propostas.js',
  './js/aba6-checklist.js',
  './js/aba7-utensilios.js',
  './js/aba8-funil.js',
  './js/pdf-generator.js',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);
      return cachedResponse || fetchPromise;
    })
  );
});

