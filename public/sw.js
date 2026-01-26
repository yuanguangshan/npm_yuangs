const CACHE_NAME = 'yuangs-pwa-v1';
const ASSETS = [
    '/',
    '/index.html',
    'https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css',
    'https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js',
    'https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js',
    '/socket.io/socket.io.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
