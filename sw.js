// ════════════════════════════════════════════════
// Admin Andiamo — Service Worker
// Permite uso offline y carga instantánea
// ════════════════════════════════════════════════

const CACHE_NAME = 'andiamo-v1';

// Archivos que se guardan en el dispositivo
const ARCHIVOS_CACHE = [
  './index.html',
  './manifest.json'
];

// ── Instalación: guarda los archivos en caché ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ARCHIVOS_CACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activación: limpia cachés anteriores ───────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: sirve desde caché si no hay internet ─
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        // Si está en caché lo devuelve inmediatamente
        if (cached) return cached;

        // Si no está en caché, intenta la red
        return fetch(event.request)
          .then(response => {
            // Guarda la respuesta en caché para la próxima vez
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
            }
            return response;
          })
          .catch(() => {
            // Sin red y sin caché: devuelve el index como fallback
            return caches.match('./index.html');
          });
      })
  );
});
