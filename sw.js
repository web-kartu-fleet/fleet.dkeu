const CACHE_NAME = 'gatra-cache-v3';
const assets = [
  './index.html',
  './manifest.json',
  'https://googleusercontent.com'
];

// Install & bersihkan cache versi lama secara otomatis
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(assets))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// METODE NETWORK FIRST: Ambil data internet dulu, jika offline baru ambil cache
self.addEventListener('fetch', e => {
  // Semua request ke Google Script wajib 100% online langsung tanpa cache
  if (e.request.url.includes('://google.com')) {
    return e.respondWith(fetch(e.request));
  }

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Simpan salinan terbaru ke cache untuk backup offline
        if (response.status === 200) {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
        }
        return response;
      })
      .catch(() => caches.match(e.request)) // Jika internet mati total, baru pakai cache
  );
});
