// =============================================
// SERVICE WORKER — Delícias da Tia Rose
// ⚠️ Sempre que atualizar o site, mude o número
// da versão aqui (CACHE_VERSION) para forçar
// todos os navegadores a baixar os arquivos novos
// =============================================

const CACHE_VERSION = 'tia-rose-v5';

const ARQUIVOS_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/logo.png',
  '/manifest.json'
];

// Instalação: salva os arquivos no cache
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('Service Worker: Caching app shell...');
      return Promise.allSettled(
        ARQUIVOS_CACHE.map(url => cache.add(url).catch(err => {
          console.warn('Cache: não foi possível armazenar', url, err);
        }))
      );
    })
  );
  self.skipWaiting();
});

// Ativação: apaga caches antigos
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((nomes) => {
      return Promise.all(
        nomes
          .filter((nome) => nome !== CACHE_VERSION)
          .map((nome) => {
            console.log('🗑️ Cache antigo removido:', nome);
            return caches.delete(nome);
          })
      );
    })
  );
  self.clients.claim();
});

// Requisições: estratégia cache-first com atualização em segundo plano
self.addEventListener('fetch', (event) => {

  const url = event.request.url;
  if (
    url.includes('firebase') ||
    url.includes('firestore') ||
    url.includes('googleapis') ||
    url.includes('gstatic') ||
    url.includes('postimg') ||
    url.includes('via.placeholder')
  ) {
    return;
  }

  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {

        const networkFetch = fetch(event.request).then((response) => {
          if (response && response.ok && response.type === 'basic') {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => {
          return cachedResponse;
        });

        return cachedResponse || networkFetch;
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    console.log('Service Worker: tomando controle imediatamente.');
  }
});