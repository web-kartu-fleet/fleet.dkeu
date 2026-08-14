const CACHE_NAME = 'fleet-cache-v13';

// 1. Dapatkan daftar file lokal murni yang PASTI ADA di GitHub
const assets = [
  './',
  'index.html',
  'manifest.json'
];

// Install & bersihkan cache versi lama secara otomatis
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Hanya cache file yang terdaftar di atas
      return cache.addAll(assets);
    })
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

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // 2. Abaikan request ke domain Google Apps Script & Google Drive
  if (url.includes('script.google.com') || url.includes('googleusercontent.com')) {
    return; // Biarkan dimuat langsung lewat internet (Network Only)
  }

  // 3. Hanya tangani request dengan metode GET
  if (e.request.method !== 'GET') {
    return;
  }

  // 4. Strategi Network First dengan Fallback Cache untuk aset lokal
  e.respondWith(
    fetch(e.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});
