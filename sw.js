const CACHE_NAME = 'fleet-cache-v12';

// 1. Daftarkan aset lokal fisik secara spesifik (Hindari duplikasi './' dan './index.html')
const assets = [
  'index.html',
  'manifest.json',
  'icon.png'
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

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // 2. Abaikan request ke domain Google Apps Script & Google Drive secara mutlak
  if (url.includes('script.google.com') || url.includes('googleusercontent.com')) {
    return; // Biarkan browser memproses request ini secara normal lewat internet (Network Only)
  }

  // 3. Hanya tangani request dengan metode GET untuk aset lokal
  if (e.request.method !== 'GET') {
    return;
  }

  // 4. Strategi Network First dengan Fallback Cache untuk aset lokal
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Jika berhasil mendapatkan file terbaru dari internet, simpan salinannya ke cache
        if (response && response.status === 200 && response.type === 'basic') {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
        }
        return response;
      })
      .catch(() => {
        // Jika pengguna sedang offline/gagal memuat internet, ambil berkas dari cache
        return caches.match(e.request);
      })
  );
});
