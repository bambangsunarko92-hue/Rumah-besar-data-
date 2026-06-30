/* Service Worker - Aplikasi Buku Kerja Guru
   Tujuan: setelah aplikasi dibuka 1x secara online, seluruh file aplikasi
   (HTML, ikon, manifest) disimpan di cache perangkat sehingga aplikasi
   tetap bisa dibuka & dipakai meskipun sedang offline / tanpa internet.
   Data yang diinput pengguna (dokumen, nilai, jadwal, dll) TIDAK disimpan
   di sini -- itu disimpan permanen lewat IndexedDB di index.html.
*/

const CACHE_NAME = 'buku-kerja-guru-cache-v1';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Strategi: coba ambil dari jaringan dulu (agar selalu dapat versi terbaru saat online),
// jika gagal (offline), ambil dari cache supaya aplikasi tetap bisa dibuka.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Hanya tangani permintaan untuk file aplikasi sendiri (bukan API/font eksternal CDN font/script khusus)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const respClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // Hanya simpan file dari origin sendiri ke cache
          if (event.request.url.startsWith(self.location.origin)) {
            cache.put(event.request, respClone);
          }
        });
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Jika halaman utama diminta dan tidak ada di cache, fallback ke index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        })
      )
  );
});
