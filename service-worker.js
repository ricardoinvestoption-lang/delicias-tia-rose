// =============================================
// SERVICE WORKER — Delícias da Tia Rose
// ⚠️ Sempre que atualizar o site, mude o número
//    da versão aqui (CACHE_VERSION) para forçar
//    todos os navegadores a baixar os arquivos novos
// =============================================

const CACHE_VERSION = 'tia-rose-v2';

const ARQUIVOS_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js?v=2',
    '/logo.png',
    '/manifest.json'
];

// Instalação: salva os arquivos no cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => {
            return cache.addAll(ARQUIVOS_CACHE);
        })
    );
    self.skipWaiting(); // Ativa imediatamente sem esperar
});

// Ativação: apaga caches antigos
self.addEventListener('activate', (event) => {
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
    self.clients.claim(); // Assume controle de todas as abas
});

// Requisições: tenta a rede primeiro, usa cache como fallback
self.addEventListener('fetch', (event) => {
    // Ignora requisições do Firebase (sempre precisam da rede)
    if (event.request.url.includes('firebase') ||
        event.request.url.includes('firestore') ||
        event.request.url.includes('googleapis') ||
        event.request.url.includes('gstatic')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((resposta) => {
                // Atualiza o cache com a versão mais recente
                const respostaClone = resposta.clone();
                caches.open(CACHE_VERSION).then((cache) => {
                    cache.put(event.request, respostaClone);
                });
                return resposta;
            })
            .catch(() => {
                // Sem internet: usa o cache
                return caches.match(event.request);
            })
    );
});
